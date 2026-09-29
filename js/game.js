// Game state: party, inventory, flags, quests, affection, time of day and saving.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const G = (NR.game = {});
  const TIMES = ['morning', 'day', 'evening', 'night'];
  G.TIMES = TIMES;
  G.TIME_LABEL = { morning: 'Morning', day: 'Afternoon', evening: 'Evening', night: 'Night' };

  G.newGame = function () {
    G.state = {
      version: 1,
      map: 'naruto_home',
      x: 4, y: 3, dir: 'down',
      party: ['naruto'],
      members: {},
      inv: { ramen_miso: 3, soldier_pill: 2, antidote: 1 },
      ryo: 600,
      flags: {},
      vars: {},
      quests: {},
      aff: {},
      time: 'morning',
      day: 1,
      chapter: 0,
      playtime: 0,
      gallery: {},
      defeated: {},
      talked: {},
      giftDay: {},
    };
    G.addMember('naruto', 1);
    const n = G.member('naruto');
    n.equip.charm = 'necklace';
    for (const id of NR.ROMANCE) G.state.aff[id] = 0;
    G.state.aff.hinata = 10;
    G.state.aff.sakura = 8;
    G.fullHeal();
  };

  // ---------- flags / vars ----------
  G.flag = (k, v) => {
    if (!G.state) return false;
    if (v === undefined) return !!G.state.flags[k];
    G.state.flags[k] = !!v;
    if (!v) delete G.state.flags[k];
    return !!v;
  };
  G.vr = (k, v) => {
    if (v === undefined) return G.state.vars[k] || 0;
    G.state.vars[k] = v;
    return v;
  };

  // ---------- party ----------
  G.member = (id) => G.state.members[id];
  G.addMember = function (id, level) {
    const st = G.state;
    if (!st.members[id]) {
      const lv = level || Math.max(1, G.member('naruto') ? G.member('naruto').level : 1);
      st.members[id] = { id, level: lv, exp: 0, hp: 1, cp: 1, equip: { weapon: null, gear: null, charm: null }, kurama: 0 };
      const s = G.stats(id);
      st.members[id].hp = s.mhp;
      st.members[id].cp = s.mcp;
    } else if (level && st.members[id].level < level) {
      st.members[id].level = level;
    }
    if (!st.party.includes(id)) st.party.push(id);
  };
  G.removeMember = function (id) {
    G.state.party = G.state.party.filter((p) => p !== id);
  };
  G.inParty = (id) => G.state.party.includes(id);
  // Guests join at the hero's level so they are always useful.
  G.addGuest = function (id) {
    const st = G.state;
    if (!st.party.includes(id) && st.party.length >= (NR.PARTY_MAX || 4)) {
      // the story needs this slot: an optional companion heads back to the village
      const drop = st.party.slice().reverse().find((p) => G.flag('companion_' + p));
      if (drop) {
        G.removeMember(drop);
        G.flag('companion_' + drop, false);
        NR.ui && NR.ui.toast(`${NR.charName(drop)} heads back to the village.`, { icon: '👋' });
      }
    }
    const lv = G.member('naruto').level + 1;
    G.addMember(id, lv);
    const m = G.member(id);
    if (m.level < lv) m.level = lv;
    const s = G.stats(id);
    m.hp = s.mhp;
    m.cp = s.mcp;
  };

  G.skillsOf = function (id) {
    const c = NR.CLASSES[id], m = G.member(id);
    if (!c || !m) return [];
    const out = c.learn.filter(([lv]) => lv <= m.level).map(([, s]) => s);
    if (id === 'naruto' && G.flag('learned_rasenshuriken') && !out.includes('rasenshuriken')) out.push('rasenshuriken');
    if (id === 'naruto' && G.flag('kurama_awake')) out.push('beast_bomb');
    return out;
  };

  G.stats = function (id) {
    const c = NR.CLASSES[id], m = G.member(id);
    const s = { mhp: 100, mcp: 50, atk: 10, def: 10, int: 10, res: 10, spd: 10, crit: 5, regen: 0, cpregen: 0, ryo: 0 };
    if (!c || !m) return s;
    for (const k of ['mhp', 'mcp', 'atk', 'def', 'int', 'res', 'spd']) s[k] = Math.round(c.base[k] + c.grow[k] * (m.level - 1));
    for (const slot of ['weapon', 'gear', 'charm']) {
      const it = m.equip[slot] && NR.ITEMS[m.equip[slot]];
      if (it && it.stats) for (const k in it.stats) s[k] = (s[k] || 0) + it.stats[k];
    }
    // bond blessings: max-affection partners give a small permanent boost to Naruto
    if (id === 'naruto') {
      const beloved = NR.ROMANCE.filter((r) => (G.state.aff[r] || 0) >= 85).length;
      s.mhp += beloved * 12;
      s.atk += beloved;
      s.int += beloved;
    }
    return s;
  };

  G.fullHeal = function () {
    for (const id in G.state.members) {
      const m = G.state.members[id];
      const s = G.stats(id);
      m.hp = s.mhp;
      m.cp = s.mcp;
    }
  };

  // Returns array of {id, level, learned:[skill]} level-ups
  G.gainExp = function (amount) {
    const ups = [];
    for (const id of G.state.party) {
      const m = G.member(id);
      if (!m) continue;
      m.exp += amount;
      while (m.level < NR.MAX_LEVEL && m.exp >= NR.expToNext(m.level)) {
        m.exp -= NR.expToNext(m.level);
        const before = G.skillsOf(id);
        const s0 = G.stats(id);
        m.level++;
        const s1 = G.stats(id);
        m.hp += s1.mhp - s0.mhp;
        m.cp += s1.mcp - s0.mcp;
        const learned = G.skillsOf(id).filter((k) => !before.includes(k));
        ups.push({ id, level: m.level, learned });
      }
    }
    return ups;
  };

  G.equip = function (id, itemId) {
    const it = NR.ITEMS[itemId];
    if (!it || it.type !== 'equip') return false;
    const m = G.member(id);
    const old = m.equip[it.slot];
    if (!G.take(itemId, 1)) return false;
    if (old) G.give(old, 1);
    m.equip[it.slot] = itemId;
    const s = G.stats(id);
    m.hp = Math.min(m.hp, s.mhp);
    m.cp = Math.min(m.cp, s.mcp);
    return true;
  };
  G.unequip = function (id, slot) {
    const m = G.member(id);
    if (!m.equip[slot]) return;
    G.give(m.equip[slot], 1);
    m.equip[slot] = null;
    const s = G.stats(id);
    m.hp = Math.min(m.hp, s.mhp);
    m.cp = Math.min(m.cp, s.mcp);
  };

  // ---------- inventory ----------
  G.count = (id) => G.state.inv[id] || 0;
  G.has = (id, n = 1) => G.count(id) >= n;
  G.give = function (id, n = 1) {
    G.state.inv[id] = (G.state.inv[id] || 0) + n;
  };
  G.take = function (id, n = 1) {
    if (!G.has(id, n)) return false;
    G.state.inv[id] -= n;
    if (G.state.inv[id] <= 0) delete G.state.inv[id];
    return true;
  };
  G.addRyo = function (n) {
    G.state.ryo = Math.max(0, G.state.ryo + n);
  };

  // Apply a field/battle item to a member. Returns a short result text or null.
  G.useItemOn = function (itemId, id) {
    const it = NR.ITEMS[itemId];
    const m = G.member(id);
    if (!it || !it.use || !m) return null;
    const s = G.stats(id);
    const u = it.use;
    if (u.revive) {
      if (m.hp > 0) return null;
      m.hp = Math.round(s.mhp * u.revive);
      return `${NR.charName(id)} is back on their feet!`;
    }
    if (m.hp <= 0) return null;
    let did = false;
    if (u.heal) {
      if (m.hp < s.mhp) did = true;
      m.hp = Math.min(s.mhp, m.hp + Math.round(u.heal <= 1 ? s.mhp * u.heal : u.heal));
    }
    if (u.cp) {
      if (m.cp < s.mcp) did = true;
      m.cp = Math.min(s.mcp, m.cp + u.cp);
    }
    if (u.cure) did = true;
    return did ? `${NR.charName(id)} recovered.` : null;
  };

  // ---------- quests ----------
  G.quest = (id) => G.state.quests[id] || null;
  // A finished quest reads as one past its last stage, so a check like "qs('main4') === 3" only
  // matches while the quest is still at that step (it used to replay finished chapters).
  G.qStage = (id) => {
    const s = G.state.quests[id];
    if (!s) return -1;
    const q = NR.QUESTS[id];
    return s.done && q ? Math.max(s.stage, q.stages.length) : s.stage;
  };
  G.qDone = (id) => !!(G.state.quests[id] && G.state.quests[id].done);
  G.qActive = (id) => !!(G.state.quests[id] && !G.state.quests[id].done);
  G.setQuest = function (id, stage, silent) {
    const q = NR.QUESTS[id];
    if (!q) return;
    const cur = G.state.quests[id];
    const isNew = !cur;
    G.state.quests[id] = { stage, done: false, t: Date.now() };
    if (!silent) {
      NR.audio.sfx('quest');
      NR.ui.toast(`${isNew ? 'New quest' : 'Quest updated'}: [y]${q.title}[/y]`, { icon: q.type === 'romance' ? 'heart' : '📜', color: q.type === 'romance' ? '#ff7aa8' : '#e8a43a' });
    }
  };
  G.completeQuest = function (id, silent) {
    const q = NR.QUESTS[id];
    if (!q) return;
    const cur = G.state.quests[id] || { stage: q.stages.length - 1 };
    G.state.quests[id] = { stage: cur.stage, done: true, t: Date.now() };
    if (!silent) {
      NR.audio.sfx('item');
      NR.ui.toast(`Quest complete: [g]${q.title}[/g]`, { icon: '✔', color: '#8fe07a' });
    }
  };
  G.activeQuests = function (type) {
    const out = [];
    for (const id in G.state.quests) {
      const s = G.state.quests[id];
      const q = NR.QUESTS[id];
      if (!q || s.done || (type && q.type !== type)) continue;
      out.push({ id, q, stage: s.stage, text: q.stages[Math.min(s.stage, q.stages.length - 1)] });
    }
    out.sort((a, b) => (a.q.type === 'main' ? -1 : 0) - (b.q.type === 'main' ? -1 : 0));
    return out;
  };

  // ---------- affection ----------
  G.aff = (id) => G.state.aff[id] || 0;
  G.addAff = function (id, n, silent) {
    const before = G.aff(id);
    G.state.aff[id] = U.clamp(before + n, 0, 100);
    if (!silent && n > 0) {
      NR.audio.sfx('heart');
      const rankUp = NR.bondRank(G.state.aff[id]) !== NR.bondRank(before);
      NR.ui.toast(`${NR.charName(id)} ♥ +${n}` + (rankUp ? `  ([p]${NR.bondRank(G.state.aff[id])}[/p])` : ''), { icon: 'heart', color: '#ff7aa8' });
      const sc = NR.engine.scenes.find((s) => s.isMap);
      const a = sc && sc.actorByChar(id);
      if (a) {
        for (let i = 0; i < 5; i++) sc.particles.add({ type: 'heart', x: a.px + 32 + U.rand(-14, 14), y: a.py - 30, vx: U.rand(-20, 20), vy: U.rand(-70, -40), life: 1.3, size: U.rand(9, 13) });
      }
    }
  };

  // ---------- time ----------
  G.setTime = function (t) {
    G.state.time = t;
    NR.engine.emit('time', t);
  };
  G.nextDay = function () {
    G.state.day++;
    G.state.time = 'morning';
    G.state.talked = {};
    NR.engine.emit('time', 'morning');
  };
  G.isNight = () => G.state.time === 'night';
  G.isEvening = () => G.state.time === 'evening' || G.state.time === 'night';

  // ---------- text formatting ----------
  G.format = function (text) {
    return String(text).replace(/\{(\w+)\}/g, (m, k) => {
      if (k === 'ryo') return String(G.state.ryo);
      if (k === 'day') return String(G.state.day);
      if (k === 'time') return G.TIME_LABEL[G.state.time];
      return m;
    });
  };

  // ---------- save / load ----------
  G.snapshot = function () {
    const sc = NR.engine.scenes.find((s) => s.isMap);
    if (sc && sc.player) {
      G.state.map = sc.mapId;
      G.state.x = sc.player.x;
      G.state.y = sc.player.y;
      G.state.dir = sc.player.dir;
    }
    const n = G.member('naruto');
    const mapDef = NR.MAPS[G.state.map];
    return {
      info: {
        savedAt: Date.now(),
        place: mapDef ? mapDef.name : G.state.map,
        chapter: G.state.chapter,
        level: n ? n.level : 1,
        playtime: G.state.playtime,
        day: G.state.day,
        time: G.state.time,
        party: G.state.party.slice(),
        quest: (G.activeQuests('main')[0] || {}).text || '',
      },
      state: U.clone(G.state),
    };
  };
  G.save = function (slot) {
    const ok = NR.storage.saveSlot(slot, G.snapshot());
    if (ok) NR.audio.sfx('save');
    return ok;
  };
  G.load = function (slot) {
    const d = NR.storage.loadSlot(slot);
    if (!d || !d.state) return false;
    G.state = d.state;
    // forward-compatible defaults
    G.state.gallery = G.state.gallery || {};
    G.state.defeated = G.state.defeated || {};
    G.state.talked = G.state.talked || {};
    G.state.giftDay = G.state.giftDay || {};
    for (const id of NR.ROMANCE) if (G.state.aff[id] == null) G.state.aff[id] = 0;
    G.repairStory();
    return true;
  };

  // Older versions could replay a finished chapter (the south gate re-ran the departure for
  // Uzushio after the ending), which put the save back in chapter 5 with an unfinishable quest.
  // Restore the chapter and quests the save had really reached.
  const MAIN = ['main1', 'main2', 'main3', 'main4', 'main5'];
  G.repairStory = function () {
    const qs = G.state.quests;
    const finish = (id) => {
      if (!G.qDone(id)) qs[id] = { stage: NR.QUESTS[id].stages.length - 1, done: true, t: (qs[id] && qs[id].t) || Date.now() };
    };
    if (G.flag('game_clear')) finish('main5');
    // each main quest only starts once the one before it is finished
    for (let i = MAIN.length - 2; i >= 0; i--) if (qs[MAIN[i + 1]]) finish(MAIN[i]);
    // and finishing main quest n moves the story on to chapter n + 1
    MAIN.forEach((id, i) => {
      if (G.qDone(id)) G.state.chapter = Math.max(G.state.chapter, i + 2);
    });
  };

  // Short state helpers used by map conditions and scripts.
  NR.S = {
    f: (k) => G.flag(k),
    qs: (id) => G.qStage(id),
    qd: (id) => G.qDone(id),
    qa: (id) => G.qActive(id),
    ch: () => (G.state ? G.state.chapter : 0),
    time: () => G.state.time,
    night: () => G.state.time === 'night',
    eve: () => G.isEvening(),
    day: () => !G.isEvening(),
    aff: (c) => G.aff(c),
    has: (i) => G.has(i),
    party: (c) => G.inParty(c),
    romance: () => NR.settings.romance !== false,
  };

  G.unlockScene = function (key) {
    if (!G.state.gallery[key]) {
      G.state.gallery[key] = Date.now();
      NR.ui.toast('Memory unlocked in the [p]Gallery[/p]', { icon: '🖼', color: '#ff9ec8' });
    }
  };
})();
