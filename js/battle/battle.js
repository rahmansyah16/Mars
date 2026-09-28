// Side-view battle scene with a speed-based turn order (CTB), jutsu, statuses,
// portrait cut-ins, bond combos and Kurama mode.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, UI = NR.ui, W = NR.W, H = NR.H;
  const I = NR.input;
  const FX = NR.bfx;

  // Battlers stand above the bottom UI band (y >= BAND_Y), like RPG Maker MZ.
  const BAND_Y = H - 172;
  const PARTY_SLOTS = [[880, 405], [1030, 445], [945, 530], [1100, 335]];
  const ENEMY_SLOTS = {
    1: [[380, 480]],
    2: [[300, 405], [480, 515]],
    3: [[265, 375], [480, 440], [310, 530]],
    4: [[250, 355], [455, 395], [275, 530], [520, 530]],
  };
  const STATUS_INFO = {
    poison: { icon: '☠', color: '#b86aff', name: 'Poison' },
    burn: { icon: '🔥', color: '#ff7a3a', name: 'Burn' },
    para: { icon: '⚡', color: '#ffe04a', name: 'Paralysis' },
    stun: { icon: '💫', color: '#ffd28a', name: 'Stun' },
    sleep: { icon: '💤', color: '#8ac8ff', name: 'Sleep' },
    seal: { icon: '⛓', color: '#c8b0ff', name: 'Chakra Seal' },
    confuse: { icon: '❓', color: '#ff9ec8', name: 'Confusion' },
    defdown: { icon: '🛡↓', color: '#ff7a6a', name: 'DEF Down' },
  };
  const wait = (ms) => NR.engine.wait(ms / (NR.settings.battleSpeed || 1));

  class Battle {
    constructor(troopId, opts, resolve) {
      this.troopId = troopId;
      this.troop = NR.TROOPS[troopId] || { members: ['wolf'], bg: 'forest' };
      this.opts = opts || {};
      this.resolve = resolve;
      this.opaque = true;
      this.t = 0;
      this.pops = [];
      this.banner = null;
      this.menu = null;
      this.cut = null;
      this.intro = 0;
      this.log = [];
      this.turnCount = 0;
      this.snapshot = U.clone({ members: NR.game.state.members, inv: NR.game.state.inv });
      FX.reset();
      this.build();
    }

    // ---------- setup ----------
    build() {
      this.units = [];
      const party = NR.game.state.party.slice(0, 4);
      party.forEach((id, i) => {
        const m = NR.game.member(id), s = NR.game.stats(id);
        const [x, y] = PARTY_SLOTS[i];
        this.units.push({
          side: 'party', id, char: id, name: NR.charName(id),
          hp: Math.max(0, m.hp), mhp: s.mhp, cp: m.cp, mcp: s.mcp,
          base: s, x, y, ct: U.rand(100, 400) + s.spd * 10, buffs: [], st: {}, scale: 2.3,
          skills: NR.game.skillsOf(id), attack: (NR.CLASSES[id] || {}).attack || 'strike',
          ox: 0, oy: 0, flash: 0, alpha: 1, alive: m.hp > 0,
        });
      });
      const mem = this.troop.members;
      const slots = ENEMY_SLOTS[Math.min(4, mem.length)] || ENEMY_SLOTS[4];
      mem.forEach((eid, i) => {
        const d = NR.ENEMIES[eid];
        const [x, y] = slots[i] || [300, 500];
        const scale = (d.scale || 1) * (d.beast ? 1 : d.boss ? 2.7 : 2.3);
        this.units.push({
          side: 'enemy', id: eid, char: d.sprite || null, beast: d.beast || null, name: d.name, data: d,
          hp: d.hp, mhp: d.hp, cp: d.cp, mcp: d.cp,
          base: { atk: d.atk, def: d.def, int: d.int, res: d.res, spd: d.spd, crit: d.crit || 5 },
          elem: d.elem || 'none', weak: d.weak || null, x, y, ct: U.rand(0, 300) + d.spd * 10, buffs: [], st: {}, scale,
          skills: d.skills || ['strike'], ox: -500, oy: 0, flash: 0, alpha: 1, alive: true, boss: !!d.boss,
        });
      });
      // duplicate enemy names get letters
      const counts = {};
      for (const u of this.units) if (u.side === 'enemy') counts[u.name] = (counts[u.name] || 0) + 1;
      const seen = {};
      for (const u of this.units) {
        if (u.side === 'enemy' && counts[u.name] > 1) {
          seen[u.name] = (seen[u.name] || 0) + 1;
          u.name += ' ' + String.fromCharCode(64 + seen[u.name]);
        }
      }
      for (const u of this.units) this.updateGeom(u);
      this.lastTarget = null;
    }
    updateGeom(u) {
      const hgt = u.beast ? NR.beasts.size(u.beast).h * u.scale * 0.9 : 48 * u.scale * 1.2;
      u.fx = u.x + u.ox;
      u.fy = u.y + u.oy;
      u.cx = u.fx;
      u.cy = u.fy - hgt * 0.45;
      u.h = hgt;
    }
    alive(side) {
      return this.units.filter((u) => u.alive && (!side || u.side === side));
    }
    stat(u, k) {
      let v = u.base[k] || 0;
      for (const b of u.buffs) if (b[k] && typeof b[k] === 'number' && k !== 'crit' && k !== 'regen') v *= b[k];
      if (k === 'def' && u.st.defdown) v *= 0.7;
      if (k === 'atk' && u.st.burn) v *= 0.9;
      if (k === 'crit') for (const b of u.buffs) if (b.crit) v += b.crit;
      return v;
    }
    hasBuff(u, key) {
      return u.buffs.some((b) => b.key === key);
    }

    // ---------- lifecycle ----------
    enter() {
      NR.audio.playBgm(this.troop.bgm || 'battle', true);
      this.run().catch((e) => {
        NR.engine.reportError(e);
        this.finish('win');
      });
    }
    async run() {
      // intro: enemies slide in
      const en = this.alive('enemy');
      await Promise.all(en.map((u, i) => NR.engine.tween(u, { ox: 0 }, 520 + i * 90, U.ease.outCubic)));
      const names = [...new Set(this.troop.members.map((m) => NR.ENEMIES[m].name))];
      this.say(this.troop.spar ? `Sparring match: ${names.join(', ')}!` : names.length === 1 ? `${names[0]} appears!` : `${names.join(' and ')} appear!`);
      await wait(900);
      if (this.opts.onStart) await this.opts.onStart(this);
      while (!this.over) {
        const u = this.nextActor();
        this.active = u;
        this.turnCount++;
        const skip = await this.turnStart(u);
        if (this.checkEnd()) break;
        if (!skip && u.alive) {
          let act;
          if (u.side === 'party' && !u.st.confuse) act = await this.commandInput(u);
          else act = this.ai(u);
          if (act) await this.perform(u, act);
        }
        this.turnEnd(u);
        u.ct -= 1000;
        if (u.guardCt) {
          u.ct += 300;
          u.guardCt = false;
        }
        this.active = null;
        if (this.opts.onTurn) await this.opts.onTurn(this);
        if (this.checkEnd()) break;
      }
    }
    nextActor() {
      for (let guard = 0; guard < 5000; guard++) {
        let best = null;
        for (const u of this.alive()) if (u.ct >= 1000 && (!best || u.ct > best.ct)) best = u;
        if (best) return best;
        for (const u of this.alive()) u.ct += this.stat(u, 'spd') * 2;
      }
      return this.alive()[0];
    }
    predictOrder(n = 8) {
      // the acting unit will spend 1000 CT when its turn ends
      const sim = this.alive().map((u) => ({ u, ct: u.ct - (u === this.active ? 1000 : 0), spd: this.stat(u, 'spd') }));
      const out = [];
      if (this.active && this.active.alive) out.push(this.active);
      let guard = 0;
      while (out.length < n && guard++ < 4000) {
        let best = null;
        for (const s of sim) if (s.ct >= 1000 && (!best || s.ct > best.ct)) best = s;
        if (best) {
          out.push(best.u);
          best.ct -= 1000;
        } else for (const s of sim) s.ct += s.spd * 2;
      }
      return out.slice(0, n);
    }
    checkEnd() {
      if (this.over) return true;
      if (this.troop.spar && this.alive('enemy').some((u) => u.hp <= u.mhp * 0.25)) {
        this.endWith('win');
        return true;
      }
      if (!this.alive('enemy').length) {
        this.endWith('win');
        return true;
      }
      if (!this.alive('party').length) {
        this.endWith('lose');
        return true;
      }
      return false;
    }
    endWith(r) {
      if (this.over) return;
      this.over = true;
      (r === 'win' ? this.victory() : r === 'lose' ? this.defeat() : this.finish(r)).catch((e) => {
        NR.engine.reportError(e);
        this.finish(r);
      });
    }

    // ---------- turn processing ----------
    async turnStart(u) {
      u.guard = false;
      for (const b of u.buffs) if (b.regen) this.healUnit(u, Math.round(u.mhp * b.regen), true);
      if (u.side === 'party') {
        const m = NR.game.member(u.id);
        const eq = NR.game.stats(u.id);
        if (eq.regen) this.healUnit(u, Math.round(u.mhp * eq.regen), true);
        if (eq.cpregen) u.cp = Math.min(u.mcp, u.cp + eq.cpregen);
      }
      for (const k of ['poison', 'burn']) {
        if (u.st[k]) {
          const d = Math.max(1, Math.round(u.mhp * (k === 'poison' ? 0.06 : 0.08) * (u.boss ? 0.35 : 1)));
          this.damageUnit(u, d, { color: STATUS_INFO[k].color });
          await wait(300);
          if (!u.alive) return true;
        }
      }
      if (u.st.stun) {
        this.say(`${u.name} is stunned!`);
        delete u.st.stun;
        await wait(700);
        return true;
      }
      if (u.st.sleep) {
        this.say(`${u.name} is asleep…`);
        await wait(600);
        return true;
      }
      if (u.st.para && Math.random() < 0.35) {
        this.say(`${u.name} is paralysed and can't move!`);
        await wait(700);
        return true;
      }
      return false;
    }
    turnEnd(u) {
      for (const b of u.buffs) b.turns--;
      u.buffs = u.buffs.filter((b) => b.turns > 0);
      for (const k in u.st) {
        if (k === 'stun') continue;
        u.st[k]--;
        if (u.st[k] <= 0) delete u.st[k];
      }
    }

    // ---------- player input ----------
    async commandInput(u) {
      const naruto = u.id === 'naruto';
      const m = NR.game.member(u.id);
      for (;;) {
        const cmds = [{ label: 'Attack', key: 'attack' }, { label: 'Jutsu', key: 'jutsu', disabled: !!u.st.seal }];
        const combos = this.availableCombos(u);
        if (combos.length) cmds.push({ label: '♥ Bond Combo', key: 'combo', heart: true });
        if (naruto && !NR.game.flag('kurama_sealed')) {
          const full = (m.kurama || 0) >= 100 && !this.hasBuff(u, 'kurama');
          cmds.push({ label: full ? '🦊 Kurama Mode!' : `🦊 Kurama ${Math.floor(m.kurama || 0)}%`, key: 'kurama', disabled: !full });
        }
        cmds.push({ label: 'Items', key: 'items' }, { label: 'Guard', key: 'guard' });
        if (!this.troop.noEscape) cmds.push({ label: 'Escape', key: 'escape' });
        const ci = await this.chooseList(cmds, { kind: 'cmd', title: u.name, index: this.lastCmd || 0 });
        if (ci < 0) continue;
        this.lastCmd = ci;
        const c = cmds[ci];
        if (c.key === 'attack') {
          const t = await this.chooseTarget(u, 'enemy');
          if (!t) continue;
          return { skill: NR.SKILLS[u.attack], targets: [t] };
        }
        if (c.key === 'guard') return { skill: NR.SKILLS.guard, targets: [u] };
        if (c.key === 'escape') return { escape: true };
        if (c.key === 'kurama') return { skill: NR.SKILLS.kurama_mode, targets: [u] };
        if (c.key === 'jutsu' || c.key === 'combo') {
          const list = c.key === 'combo' ? combos : u.skills.filter((s) => s !== u.attack && NR.SKILLS[s] && !NR.SKILLS[s].combo);
          const items = list.map((id) => {
            const sk = NR.SKILLS[id];
            const lacks = u.cp < (sk.cp || 0) || (sk.needBuff && !this.hasBuff(u, sk.needBuff));
            return { label: sk.name, sk, disabled: lacks, right: sk.cp ? sk.cp + ' CP' : '', elem: sk.elem };
          });
          const si = await this.chooseList(items, { kind: 'skill', title: c.key === 'combo' ? 'Bond Combos' : 'Jutsu' });
          if (si < 0) continue;
          const sk = items[si].sk;
          const targets = await this.pickTargets(u, sk);
          if (!targets) continue;
          return { skill: sk, targets };
        }
        if (c.key === 'items') {
          const inv = NR.game.state.inv;
          const items = Object.keys(inv).filter((k) => NR.ITEMS[k] && NR.ITEMS[k].battle).map((k) => ({ label: `${NR.ITEMS[k].icon} ${NR.ITEMS[k].name}`, id: k, right: '×' + inv[k], it: NR.ITEMS[k] }));
          if (!items.length) {
            NR.audio.sfx('buzzer');
            continue;
          }
          const ii = await this.chooseList(items, { kind: 'skill', title: 'Items' });
          if (ii < 0) continue;
          const it = items[ii].it;
          let targets;
          if (it.use.damage) {
            const t = await this.chooseTarget(u, 'enemy');
            if (!t) continue;
            targets = [t];
          } else if (it.use.escape) targets = [u];
          else if (it.use.all) targets = this.alive('party');
          else {
            const t = await this.chooseTarget(u, it.use.revive ? 'dead' : 'ally');
            if (!t) continue;
            targets = [t];
          }
          return { item: items[ii].id, targets };
        }
      }
    }
    availableCombos(u) {
      if (u.id !== 'naruto') return [];
      const out = [];
      for (const r of NR.ROMANCE) {
        if (NR.game.aff(r) < 80) continue;
        const partner = this.units.find((x) => x.side === 'party' && x.id === r && x.alive);
        if (partner) out.push('combo_' + r);
      }
      return out;
    }
    async pickTargets(u, sk) {
      switch (sk.target) {
        case 'enemy': {
          const t = await this.chooseTarget(u, 'enemy');
          return t ? [t] : null;
        }
        case 'ally': {
          const t = await this.chooseTarget(u, 'ally');
          return t ? [t] : null;
        }
        case 'ally_dead': {
          const t = await this.chooseTarget(u, 'dead');
          return t ? [t] : null;
        }
        case 'enemies':
          return this.alive('enemy');
        case 'allies':
          return this.alive('party');
        default:
          return [u];
      }
    }
    chooseList(items, o) {
      return new Promise((resolve) => {
        const cmd = o.kind === 'cmd';
        // commands: two columns inside the bottom band; skills/items: taller list above it
        const cols = cmd ? 2 : 1;
        const rowH = cmd ? 34 : 38;
        const rows = cmd ? Math.min(4, Math.ceil(items.length / 2)) : Math.min(6, items.length);
        const w = cmd ? 400 : 580;
        const h = rows * rowH + 50;
        const x = 16;
        const y = cmd ? BAND_Y : H - 16 - h;
        const list = new UI.List({
          x: x + 12, y: y + 40, w: w - 24, rowH, visible: rows, cols, items, index: Math.min(o.index || 0, items.length - 1),
          onPick: (i) => {
            this.menu = null;
            resolve(i);
          },
          onCancel: cmd ? null : () => {
            this.menu = null;
            resolve(-1);
          },
        });
        this.menu = { list, x, y, w, h: cmd ? H - 16 - BAND_Y : h, title: o.title, kind: o.kind };
      });
    }
    chooseTarget(u, kind) {
      return new Promise((resolve) => {
        let cands;
        if (kind === 'enemy') cands = this.alive('enemy');
        else if (kind === 'ally') cands = this.alive('party');
        else cands = this.units.filter((x) => x.side === 'party' && !x.alive);
        if (!cands.length) {
          NR.audio.sfx('buzzer');
          return resolve(null);
        }
        let idx = Math.max(0, cands.indexOf(this.lastTarget));
        if (kind !== 'enemy') idx = Math.max(0, cands.indexOf(u));
        this.targeting = {
          cands, idx,
          done: (t) => {
            this.targeting = null;
            if (t && kind === 'enemy') this.lastTarget = t;
            resolve(t);
          },
        };
      });
    }

    // ---------- enemy AI ----------
    ai(u) {
      const party = this.alive('party');
      if (u.st.confuse && Math.random() < 0.5) {
        const all = this.alive().filter((x) => x !== u);
        return { skill: NR.SKILLS[u.side === 'party' ? u.attack : 'strike'], targets: [U.pick(all)], confused: true };
      }
      if (u.side === 'party') {
        // confused party member attacks normally
        return { skill: NR.SKILLS[u.attack], targets: [U.pick(this.alive('enemy'))] };
      }
      let pool = u.skills.map((s) => NR.SKILLS[s]).filter(Boolean);
      pool = pool.filter((s) => !(s.cp > u.cp));
      if (u.st.seal) pool = pool.filter((s) => s.kind === 'tai' || s.kind === 'none');
      pool = pool.filter((s) => {
        if (s.kind === 'heal') return u.hp < u.mhp * 0.5;
        if (s.buff) return !u.buffs.some((b) => b.src === s.id);
        return true;
      });
      if (!pool.length) pool = [NR.SKILLS.strike];
      let sk = U.pick(pool);
      if (u.boss && this.turnCount % 4 === 0) {
        const aoe = pool.filter((s) => s.target === 'enemies');
        if (aoe.length) sk = U.pick(aoe);
      }
      let targets;
      if (sk.target === 'enemies') targets = party;
      else if (sk.target === 'self' || sk.target === 'allies') targets = [u];
      else {
        const weakest = party.slice().sort((a, b) => a.hp / a.mhp - b.hp / b.mhp)[0];
        targets = [Math.random() < 0.3 ? weakest : U.pick(party)];
      }
      return { skill: sk, targets };
    }

    // ---------- actions ----------
    async perform(u, act) {
      if (act.escape) return this.tryEscape(u);
      if (act.item) return this.useItem(u, act.item, act.targets);
      const sk = act.skill;
      let targets = act.targets.filter(Boolean);
      if (sk.target === 'enemy' || sk.target === 'ally') {
        targets = targets.map((t) => (t.alive ? t : this.retarget(u, t))).filter(Boolean);
        if (!targets.length) return;
      }
      if (sk.id === 'guard') {
        u.guard = true;
        u.guardCt = true;
        u.cp = Math.min(u.mcp, u.cp + Math.round(u.mcp * 0.06));
        this.say(`${u.name} guards.`);
        await FX.play('guard', this, u, [u]);
        await wait(400);
        return;
      }
      this.say(act.confused ? `${u.name} is confused and attacks wildly!` : sk.id === u.attack ? `${u.name} attacks!` : `${u.name}: ${sk.name}!`);
      if (sk.cutin && u.side === 'party') await this.cutin(u, sk);
      else if (sk.cutin && u.boss) await this.cutin(u, sk);
      u.cp = Math.max(0, u.cp - (sk.cp || 0));
      if (sk.selfDamage) this.damageUnit(u, Math.round(u.mhp * sk.selfDamage), { quiet: true });
      const melee = sk.kind === 'tai' && sk.target === 'enemy' && sk.fx !== 'shuriken' && sk.fx !== 'weapons';
      const t0 = targets[0];
      if (melee && t0 !== u) {
        await NR.engine.tween(u, { ox: t0.fx - u.x + (u.side === 'party' ? 90 : -90), oy: t0.fy - u.y }, 220 / NR.settings.battleSpeed, U.ease.out);
      } else if (u.side === 'party' && sk.kind !== 'none') {
        await NR.engine.tween(u, { ox: -24 }, 120 / NR.settings.battleSpeed);
      }
      // special jutsu
      if (sk.special === 'kurama') {
        await FX.play('kurama', this, u, [u]);
        u.buffs = u.buffs.filter((b) => b.key !== 'kurama');
        u.buffs.push(Object.assign({ key: 'kurama', src: sk.id }, sk.buff));
        NR.game.member('naruto').kurama = 0;
        this.healUnit(u, Math.round(u.mhp * (sk.heal || 0.3)));
        u.cp = u.mcp;
        this.say('Naruto and Kurama fight as one!');
        await wait(600);
        await this.retreat(u);
        return;
      }
      await FX.play(sk.fx || 'hit', this, u, targets, sk);
      const hits = sk.hits || 1;
      for (let h = 0; h < hits; h++) {
        for (const t of targets) {
          if (!t.alive && !(sk.revive && t.side === u.side)) continue;
          this.applySkill(u, t, sk, h);
        }
        if (hits > 1) {
          if (h > 0) FX.play(sk.kind === 'tai' ? 'hit' : 'palm', this, u, targets.filter((t) => t.alive));
          await wait(Math.max(70, 360 / hits));
        }
      }
      if (sk.buff && (sk.target === 'self' || sk.target === 'allies')) {
        for (const t of targets) {
          t.buffs = t.buffs.filter((b) => b.src !== sk.id);
          t.buffs.push(Object.assign({ src: sk.id }, sk.buff));
        }
      }
      await wait(420);
      await this.retreat(u);
      await this.cleanupDead();
    }
    async retreat(u) {
      if (u.ox || u.oy) await NR.engine.tween(u, { ox: 0, oy: 0 }, 240 / NR.settings.battleSpeed, U.ease.inOut);
    }
    retarget(u, t) {
      const side = t.side;
      const list = this.alive(side);
      return list.length ? list[0] : null;
    }
    applySkill(u, t, sk, hitIndex) {
      if (sk.kind === 'heal') {
        if (sk.revive) {
          if (t.alive) return;
          t.alive = true;
          t.alpha = 1;
          t.hp = Math.round(t.mhp * sk.revive);
          this.popup(t, '+' + t.hp, '#8fe07a');
          return;
        }
        const amt = Math.round(t.mhp * (sk.heal || 0.3) + this.stat(u, 'int') * 0.6);
        this.healUnit(t, amt);
        if (sk.cure) t.st = {};
        return;
      }
      if (sk.kind === 'none') {
        if (sk.status) this.tryStatus(u, t, sk.status, sk);
        return;
      }
      // damage
      const tai = sk.kind === 'tai';
      const A = this.stat(u, tai ? 'atk' : 'int'), D = this.stat(t, tai ? 'def' : 'res');
      const accBuff = u.buffs.some((b) => b.acc);
      if (!accBuff && !t.st.sleep && !t.st.stun && Math.random() < 0.05 + (tai ? Math.max(0, (this.stat(t, 'spd') - this.stat(u, 'spd')) * 0.003) : 0)) {
        this.popup(t, 'Miss', '#c8c0d8');
        NR.audio.sfx('miss');
        return;
      }
      let dmg = Math.max(A * 0.55, A * 2 - D) * (sk.power || 1);
      let mult = NR.elemMult(sk.elem, t.elem);
      if (t.weak && sk.elem === t.weak) mult *= 1.5;
      dmg *= mult;
      dmg *= U.rand(0.92, 1.08);
      const crit = Math.random() * 100 < this.stat(u, 'crit');
      if (crit) dmg *= 1.6;
      if (t.guard) dmg *= 0.5;
      for (const b of t.buffs) if (b.guard) dmg *= b.guard;
      if (u.side === 'enemy' && t.side === 'party') dmg *= 0.92;
      dmg = Math.max(1, Math.round(dmg));
      this.damageUnit(t, dmg, { crit, weak: mult > 1.01, resist: mult < 0.99 });
      if (t.st.sleep) delete t.st.sleep;
      if (sk.drainCp) {
        const d = Math.min(t.cp, sk.drainCp);
        t.cp -= d;
        u.cp = Math.min(u.mcp, u.cp + Math.round(d * 0.5));
      }
      if (sk.status && hitIndex === 0) this.tryStatus(u, t, sk.status, sk);
      // Kurama gauge
      if (u.id === 'naruto' && u.side === 'party') this.addKurama(3);
      if (t.id === 'naruto' && t.side === 'party') this.addKurama(7);
    }
    addKurama(n) {
      if (NR.game.flag('kurama_sealed')) return;
      const m = NR.game.member('naruto');
      const u = this.units.find((x) => x.id === 'naruto' && x.side === 'party');
      if (u && this.hasBuff(u, 'kurama')) return;
      m.kurama = Math.min(100, (m.kurama || 0) + n);
    }
    tryStatus(u, t, s, sk) {
      if (!t.alive) return;
      let chance = s.chance;
      if (t.boss) chance *= s.id === 'stun' || s.id === 'sleep' ? 0.25 : 0.6;
      if (sk && sk.id === 'sexy' && (t.data && (t.data.female || t.beast))) {
        this.popup(t, 'Unimpressed', '#c8c0d8');
        return;
      }
      if (Math.random() < chance) {
        t.st[s.id] = Math.max(t.st[s.id] || 0, s.turns);
        this.popup(t, STATUS_INFO[s.id] ? STATUS_INFO[s.id].name + '!' : s.id, STATUS_INFO[s.id] ? STATUS_INFO[s.id].color : '#fff', 0.2);
      }
    }
    damageUnit(t, dmg, o = {}) {
      t.hp = Math.max(0, t.hp - dmg);
      t.flash = 1;
      if (!o.quiet) {
        this.popup(t, String(dmg), o.color || (o.crit ? '#ffe04a' : t.side === 'party' ? '#ffb0a0' : '#ffffff'), 0, o.crit);
        if (o.crit) this.popup(t, 'CRITICAL', '#ffd23a', 0.12);
        else if (o.weak) this.popup(t, 'Weak!', '#ffab5a', 0.12);
        else if (o.resist) this.popup(t, 'Resist', '#9ab0c8', 0.12);
      }
      const kb = t.side === 'party' ? 16 : -16;
      t.ox += kb;
      NR.engine.tween(t, { ox: t.ox - kb }, 200);
      if (t.hp <= 0) {
        t.alive = false;
        t.st = {};
        t.buffs = [];
      }
    }
    healUnit(t, amt, quiet) {
      if (!t.alive) return;
      const before = t.hp;
      t.hp = Math.min(t.mhp, t.hp + amt);
      if (!quiet || t.hp > before) this.popup(t, '+' + (t.hp - before), '#8fe07a');
    }
    async cleanupDead() {
      for (const u of this.units) {
        if (!u.alive && u.alpha > 0 && u.side === 'enemy' && !u.fading) {
          u.fading = true;
          NR.audio.sfx('poof');
          FX.parts.burst(u.cx, u.cy, 16, { type: 'poof', speed: 100, life: 0.7, size: 18, color: '#d8d0e8' });
          NR.engine.tween(u, { alpha: 0 }, 500);
        }
      }
    }
    async useItem(u, id, targets) {
      const it = NR.ITEMS[id];
      if (!NR.game.take(id, 1)) return;
      this.say(`${u.name} uses ${it.name}.`);
      const use = it.use;
      if (use.escape) {
        await FX.play('poof', this, u, [u]);
        FX.parts.burst(W * 0.78, H * 0.6, 30, { type: 'poof', speed: 160, life: 0.9, size: 26, color: '#e8e8ee' });
        NR.audio.sfx('poof');
        await wait(600);
        this.over = true;
        return this.finish('escape');
      }
      if (use.damage) {
        const t = targets[0];
        await FX.play('fire', this, u, [t]);
        this.damageUnit(t, Math.round(use.damage * NR.elemMult(use.elem, t.elem)), {});
        await wait(400);
        return this.cleanupDead();
      }
      await FX.play('item', this, u, targets);
      for (const t of targets) {
        if (use.revive) {
          if (t.alive) continue;
          t.alive = true;
          t.alpha = 1;
          t.hp = Math.round(t.mhp * use.revive);
          this.popup(t, '+' + t.hp, '#8fe07a');
          continue;
        }
        if (!t.alive) continue;
        if (use.heal) this.healUnit(t, Math.round(use.heal <= 1 ? t.mhp * use.heal : use.heal));
        if (use.cp) {
          const before = t.cp;
          t.cp = Math.min(t.mcp, t.cp + use.cp);
          this.popup(t, '+' + (t.cp - before) + ' CP', '#8ac8ff', 0.15);
        }
        if (use.cure) t.st = {};
      }
      await wait(500);
    }
    async tryEscape(u) {
      const ps = this.alive('party').reduce((s, x) => s + this.stat(x, 'spd'), 0) / Math.max(1, this.alive('party').length);
      const es = this.alive('enemy').reduce((s, x) => s + this.stat(x, 'spd'), 0) / Math.max(1, this.alive('enemy').length);
      const chance = U.clamp(0.62 + (ps - es) * 0.02, 0.3, 0.95);
      this.say('The party tries to escape…');
      await wait(500);
      if (Math.random() < chance) {
        NR.audio.sfx('poof');
        this.say('Got away safely!');
        for (const p of this.alive('party')) NR.engine.tween(p, { ox: 400 }, 500);
        await wait(700);
        this.over = true;
        return this.finish('escape');
      }
      this.say("Couldn't escape!");
      NR.audio.sfx('buzzer');
      await wait(700);
    }

    // ---------- cut-in ----------
    async cutin(u, sk) {
      const emo = u.side === 'party' ? 'battle' : 'angry';
      this.cut = { u, sk, t: 0, card: NR.msg.resolvePortrait(u.char, emo) };
      NR.audio.sfx('charge');
      await wait(1050);
      this.cut = null;
    }

    // ---------- endings ----------
    syncBack() {
      for (const u of this.units) {
        if (u.side !== 'party') continue;
        const m = NR.game.member(u.id);
        if (!m) continue;
        m.hp = u.alive ? u.hp : 1;
        m.cp = u.cp;
      }
    }
    async victory() {
      await wait(500);
      await this.cleanupDead();
      this.menu = null;
      this.targeting = null;
      NR.audio.stopBgm(300);
      NR.audio.jingle('victory');
      const enemies = this.units.filter((u) => u.side === 'enemy');
      let exp = Math.round(enemies.reduce((s, u) => s + (u.data.exp || 0), 0) * 1.6);
      let ryoBonus = 0;
      for (const id of NR.game.state.party) ryoBonus += NR.game.stats(id).ryo || 0;
      const ryo = Math.round(enemies.reduce((s, u) => s + (u.data.ryo || 0), 0) * (1 + ryoBonus));
      const drops = [];
      for (const u of enemies) for (const [item, ch] of u.data.drops || []) if (Math.random() < ch) drops.push(item);
      this.syncBack();
      const ups = NR.game.gainExp(exp);
      NR.game.addRyo(ryo);
      for (const d of drops) NR.game.give(d, 1);
      for (const up of ups) {
        const u = this.units.find((x) => x.side === 'party' && x.id === up.id);
        if (u) {
          const s = NR.game.stats(up.id);
          u.mhp = s.mhp;
          u.hp = Math.max(u.hp, 1);
        }
      }
      this.results = { exp, ryo, drops, ups, t: 0 };
      if (ups.length) NR.audio.sfx('levelup');
      await this.waitConfirm(900);
      this.finish('win');
    }
    waitConfirm(minMs) {
      return new Promise((resolve) => {
        this.confirmWait = { t: 0, min: minMs / 1000, resolve };
      });
    }
    async defeat() {
      await wait(600);
      this.menu = null;
      this.targeting = null;
      if (this.opts.canLose) {
        this.syncBack();
        for (const id of NR.game.state.party) NR.game.member(id).hp = Math.max(1, Math.round(NR.game.stats(id).mhp * 0.3));
        this.finish('lose');
        return;
      }
      NR.audio.stopBgm(400);
      NR.audio.jingle('gameover');
      this.gameover = { t: 0 };
      const items = [{ label: 'Try the battle again' }, { label: 'Load a save' }, { label: 'Return to title' }];
      const i = await new Promise((resolve) => {
        this.gameover.list = new UI.List({ x: W / 2 - 200, y: 430, w: 400, rowH: 48, visible: 3, items, onPick: (k) => resolve(k) });
      });
      if (i === 0) {
        NR.game.state.members = U.clone(this.snapshot.members);
        NR.game.state.inv = U.clone(this.snapshot.inv);
        const opts = this.opts, troop = this.troopId, resolve = this.resolve;
        NR.engine.pop();
        const b = new Battle(troop, opts, resolve);
        NR.engine.push(b);
      } else if (i === 1) {
        NR.battle.active = null;
        NR.engine.pop();
        NR.menus.saveLoad('load').then((ok) => {
          if (!ok) NR.titleScreen.show();
        });
      } else {
        NR.battle.active = null;
        NR.engine.pop();
        NR.titleScreen.show();
      }
    }
    async finish(result) {
      await NR.engine.fadeOut(350);
      FX.reset();
      NR.engine.pop();
      const sc = NR.engine.scenes.find((s) => s.isMap);
      if (sc) sc.applyAmbience();
      await NR.engine.fadeIn(350);
      this.resolve && this.resolve(result);
    }

    // ---------- helpers ----------
    say(text) {
      this.banner = { text, t: 0 };
    }
    popup(u, text, color, delay = 0, big) {
      this.pops.push({ x: u.cx + U.rand(-16, 16), y: u.cy - 20, text, color, t: -delay, big });
    }

    // ---------- update ----------
    update(dt, focus) {
      this.t += dt;
      FX.update(dt);
      for (const u of this.units) {
        u.flash = Math.max(0, u.flash - dt * 4);
        this.updateGeom(u);
      }
      for (let i = this.pops.length - 1; i >= 0; i--) {
        const p = this.pops[i];
        p.t += dt;
        if (p.t > 1.1) this.pops.splice(i, 1);
      }
      if (this.banner) {
        this.banner.t += dt;
        if (this.banner.t > 2.2) this.banner = null;
      }
      if (this.cut) this.cut.t += dt * (NR.settings.battleSpeed || 1);
      if (!focus) return;
      if (this.confirmWait) {
        const c = this.confirmWait;
        c.t += dt;
        if (this.results) this.results.t += dt;
        if (c.t > c.min && (I.okPressed() || I.cancelPressed())) {
          I.consume();
          this.confirmWait = null;
          c.resolve();
        }
        return;
      }
      if (this.gameover) {
        this.gameover.t += dt;
        if (this.gameover.list && this.gameover.t > 1.2) this.gameover.list.update(dt, true);
        return;
      }
      if (this.targeting) return this.updateTargeting();
      if (this.menu) this.menu.list.update(dt, true);
    }
    updateTargeting() {
      const T = this.targeting;
      const n = T.cands.length;
      const old = T.idx;
      if (I.repeat('up') || I.repeat('left')) T.idx = (T.idx - 1 + n) % n;
      if (I.repeat('down') || I.repeat('right')) T.idx = (T.idx + 1) % n;
      const m = I.mouse;
      let hit = -1;
      T.cands.forEach((u, i) => {
        if (Math.abs(m.x - u.cx) < 70 && m.y > u.fy - u.h && m.y < u.fy + 10) hit = i;
      });
      if (m.moved && hit >= 0) T.idx = hit;
      if (old !== T.idx) NR.audio.sfx('cursor');
      if (I.pressed('ok') || (m.clicked && hit >= 0)) {
        I.consume();
        NR.audio.sfx('ok');
        T.done(T.cands[T.idx]);
      } else if (I.cancelPressed()) {
        I.consume();
        NR.audio.sfx('cancel');
        T.done(null);
      }
    }

    // ---------- draw ----------
    draw(ctx) {
      const bg = this.opts.bg || this.troop.bg || 'forest';
      NR.backdrops.draw(ctx, bg, this.t);
      // ground shade
      const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, H * 0.5, W, H * 0.5);
      const order = this.units.slice().sort((a, b) => a.fy - b.fy);
      for (const u of order) this.drawUnit(ctx, u);
      FX.draw(ctx);
      // popups
      for (const p of this.pops) {
        if (p.t < 0) continue;
        const k = p.t / 1.1;
        const y = p.y - U.ease.outCubic(Math.min(1, p.t * 2.5)) * 50;
        ctx.save();
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        const sc = p.t < 0.12 ? 1 + (0.12 - p.t) * 5 : 1;
        ctx.translate(p.x, y);
        ctx.scale(sc, sc);
        UI.text(ctx, p.text, 0, 0, { size: p.big ? 40 : /^\d+$/.test(p.text) || p.text[0] === '+' ? 32 : 20, bold: true, align: 'center', color: p.color, outline: '#1a0e14', outlineW: 6, font: '"Trebuchet MS", Impact, sans-serif' });
        ctx.restore();
      }
      this.drawTurnOrder(ctx);
      this.drawPartyPanel(ctx);
      if (this.banner) {
        const k = Math.min(1, this.banner.t * 6);
        ctx.save();
        ctx.globalAlpha = k * Math.min(1, (2.2 - this.banner.t) * 3);
        const w = UI.measure(ctx, this.banner.text, 22, true) + 80;
        const gx = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
        gx.addColorStop(0, 'rgba(10,12,30,0)');
        gx.addColorStop(0.15, 'rgba(10,12,30,0.85)');
        gx.addColorStop(0.85, 'rgba(10,12,30,0.85)');
        gx.addColorStop(1, 'rgba(10,12,30,0)');
        ctx.fillStyle = gx;
        ctx.fillRect(W / 2 - w / 2, 76, w, 46);
        UI.text(ctx, this.banner.text, W / 2, 99, { size: 22, bold: true, align: 'center', color: '#fff4dc' });
        ctx.restore();
      }
      if (this.menu) this.drawMenu(ctx);
      if (this.targeting) this.drawTargeting(ctx);
      if (this.cut) this.drawCutin(ctx);
      if (this.results) this.drawResults(ctx);
      if (this.gameover) this.drawGameOver(ctx);
    }
    drawUnit(ctx, u) {
      if (u.alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = u.alpha;
      const t = this.t;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(u.fx, u.fy, (u.beast ? NR.beasts.size(u.beast).w * 0.3 : 22 * u.scale) * 1, 9 + u.scale * 2, 0, 0, U.TAU);
      ctx.fill();
      if (u.data && u.data.aura) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        FX.glow(ctx, u.cx, u.cy, 170 + Math.sin(t * 3) * 12, u.data.aura, 0.45);
        ctx.restore();
      }
      if (u.side === 'party' && this.hasBuff(u, 'kurama')) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        FX.glow(ctx, u.cx, u.cy, 110 + Math.sin(t * 8) * 8, '#ffb040', 0.55);
        ctx.restore();
      }
      if (u.beast) {
        NR.beasts.draw(ctx, u.beast, u.fx, u.fy, u.scale, t + u.x, false);
      } else {
        const sh = NR.sheetOf(u.char);
        if (sh) {
          const dir = u.side === 'party' ? 'left' : 'right';
          const s = Math.min(NR.TS / sh.fw, (NR.TS * 1.2) / sh.fh) * (sh.scale || 1) * (u.scale / 1.35);
          const moving = Math.abs(u.ox) > 2 && this.active === u;
          const col = u.alive ? (moving ? sh.layout.cycle[Math.floor(t * 10) % sh.layout.cycle.length] : sh.layout.idle) : sh.layout.idle;
          const row = sh.layout.dirs[u.alive ? dir : 'down'];
          const dw = sh.fw * s, dh = sh.fh * s;
          ctx.imageSmoothingEnabled = sh.smooth !== false;
          const bob = u.alive ? Math.sin(t * 3 + u.x) * 1.5 : 0;
          if (!u.alive && u.side === 'party') {
            ctx.translate(u.fx, u.fy - 18);
            ctx.rotate(u.side === 'party' ? Math.PI / 2 : -Math.PI / 2);
            ctx.filter = 'grayscale(0.8) brightness(0.8)';
            ctx.drawImage(sh.img, sh.bx + col * sh.fw, sh.by + row * sh.fh, sh.fw, sh.fh, -dh / 2, -dw / 2, dh, dw);
            ctx.filter = 'none';
          } else {
            ctx.drawImage(sh.img, sh.bx + col * sh.fw, sh.by + row * sh.fh, sh.fw, sh.fh, u.fx - dw / 2, u.fy - dh + 4 + bob, dw, dh);
            if (u.flash > 0) {
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = u.flash * 0.7;
              ctx.drawImage(sh.img, sh.bx + col * sh.fw, sh.by + row * sh.fh, sh.fw, sh.fh, u.fx - dw / 2, u.fy - dh + 4 + bob, dw, dh);
            }
          }
        }
      }
      ctx.restore();
      // status icons & enemy HP
      if (u.alive) {
        const icons = Object.keys(u.st).map((k) => (STATUS_INFO[k] || {}).icon).filter(Boolean);
        if (icons.length) UI.text(ctx, icons.join(''), u.cx, u.fy - u.h - 16, { size: 18, align: 'center', shadow: false });
        if (u.side === 'enemy') {
          const w = u.boss ? 180 : 110;
          UI.bar(ctx, u.cx - w / 2, u.fy + 12, w, 9, u.hp / u.mhp, '#e84a4a', '#ff9a6a');
          if (u.boss) UI.text(ctx, u.name, u.cx, u.fy + 34, { size: 15, bold: true, align: 'center', color: '#ffd0d0' });
        }
      }
      if (this.active === u && u.side === 'party' && !this.over) {
        const b = Math.sin(this.t * 6) * 4;
        ctx.fillStyle = '#ffd23a';
        ctx.beginPath();
        ctx.moveTo(u.cx - 10, u.fy - u.h - 30 + b);
        ctx.lineTo(u.cx + 10, u.fy - u.h - 30 + b);
        ctx.lineTo(u.cx, u.fy - u.h - 16 + b);
        ctx.fill();
      }
    }
    drawTurnOrder(ctx) {
      const order = this.predictOrder(9);
      UI.text(ctx, 'NEXT', 24, 30, { size: 13, bold: true, color: '#ffd28a' });
      order.forEach((u, i) => {
        const x = 70 + i * 50, y = 12, s = i === 0 ? 44 : 36;
        const yy = y + (i === 0 ? 0 : 4);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + s / 2, yy + s / 2, s / 2, 0, U.TAU);
        ctx.fillStyle = u.side === 'party' ? '#2a4a8a' : '#8a2a3a';
        ctx.fill();
        ctx.restore();
        if (u.beast) UI.text(ctx, '🐾', x + s / 2, yy + s / 2 + 1, { size: s * 0.5, align: 'center', shadow: false });
        else NR.menus.drawFace(ctx, u.char, x, yy, s);
        ctx.strokeStyle = u.side === 'party' ? '#8ac8ff' : '#ff8a8a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + s / 2, yy + s / 2, s / 2, 0, U.TAU);
        ctx.stroke();
      });
    }
    drawPartyPanel(ctx) {
      const party = this.units.filter((u) => u.side === 'party');
      const maxW = W - 16 - 432, y = BAND_Y, ph = H - 16 - BAND_Y;
      const cw = Math.min(262, (maxW - 16) / Math.max(1, party.length));
      const pw = cw * party.length + 16, x0 = W - 16 - pw;
      UI.panel(ctx, x0, y, pw, ph, { r: 14, alpha: 0.85 });
      const x1 = x0 + 8;
      party.forEach((u, i) => {
        const cx = x1 + i * cw;
        if (this.active === u) UI.cursorBar(ctx, cx + 2, y + 8, cw - 4, ph - 16, this.t);
        ctx.save();
        if (!u.alive) ctx.globalAlpha = 0.55;
        NR.menus.drawFace(ctx, u.char, cx + 10, y + 14, 46);
        ctx.restore();
        UI.text(ctx, u.name, cx + 64, y + 28, { size: 17, bold: true, color: u.alive ? '#fff4dc' : '#8a86a0', maxW: cw - 72 });
        const icons = Object.keys(u.st).map((k) => (STATUS_INFO[k] || {}).icon).filter(Boolean).join('');
        if (icons) UI.text(ctx, icons, cx + 64, y + 50, { size: 13, shadow: false });
        const bw = cw - 22, low = u.hp / u.mhp < 0.3;
        UI.text(ctx, 'HP', cx + 12, y + 78, { size: 13, bold: true, color: '#a8f08a' });
        UI.text(ctx, `${u.hp} / ${u.mhp}`, cx + 12 + bw, y + 78, { size: 15, bold: true, align: 'right', color: low ? '#ff9a6a' : '#fff4dc' });
        UI.bar(ctx, cx + 12, y + 88, bw, 11, u.hp / u.mhp, low ? '#e84a4a' : '#5ad07a', low ? '#ff9a6a' : '#a8f08a');
        UI.text(ctx, 'CP', cx + 12, y + 112, { size: 13, bold: true, color: '#8ac8ff' });
        UI.text(ctx, `${u.cp}`, cx + 12 + bw, y + 112, { size: 14, align: 'right', color: '#8ac8ff' });
        UI.bar(ctx, cx + 12, y + 121, bw, 8, u.cp / u.mcp, '#3a8ae8', '#8ad0ff');
        if (u.id === 'naruto' && !NR.game.flag('kurama_sealed')) {
          const k = (NR.game.member('naruto').kurama || 0) / 100;
          UI.text(ctx, '🦊', cx + 12, y + 142, { size: 12, shadow: false });
          UI.bar(ctx, cx + 30, y + 138, bw - 18, 7, this.hasBuff(u, 'kurama') ? 1 : k, '#ff7a2a', '#ffd04a');
        }
      });
    }
    drawMenu(ctx) {
      const M = this.menu;
      UI.panel(ctx, M.x, M.y, M.w, M.h, { r: 14 });
      UI.text(ctx, M.title, M.x + 20, M.y + 22, { size: 17, bold: true, color: '#ffd28a' });
      M.list.draw(ctx, (c, it, x, y, w, h, sel) => {
        UI.text(c, it.label, x + 14, y + h / 2, { size: M.kind === 'cmd' ? 17 : 18, bold: sel, color: it.disabled ? '#6a6680' : sel ? '#fff4d6' : '#e8e2d6', maxW: it.right ? w - 90 : w - 22 });
        if (it.right) UI.text(c, it.right, x + w - 12, y + h / 2, { size: 15, align: 'right', color: it.elem ? NR.ELEM_COLOR[it.elem] : '#8ac8ff' });
      });
      if (M.kind === 'skill') {
        const it = M.list.items[M.list.index];
        const desc = it && (it.sk ? it.sk.desc : it.it ? it.it.desc : '');
        if (desc) {
          UI.panel(ctx, M.x, M.y - 64, M.w, 56, { r: 12, alpha: 0.9 });
          const lines = U.wrap((ctx.font = `600 15px ${UI.FONT}`, ctx), desc, M.w - 30);
          lines.slice(0, 2).forEach((l, i) => UI.text(ctx, l, M.x + 16, M.y - 46 + i * 20, { size: 15 }));
        }
      }
    }
    drawTargeting(ctx) {
      const T = this.targeting;
      const u = T.cands[T.idx];
      if (!u) return;
      const b = Math.sin(this.t * 7) * 5;
      ctx.fillStyle = '#ff5a4a';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(u.cx - 14, u.fy - u.h - 36 + b);
      ctx.lineTo(u.cx + 14, u.fy - u.h - 36 + b);
      ctx.lineTo(u.cx, u.fy - u.h - 16 + b);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const w = 280;
      UI.panel(ctx, W / 2 - w / 2, 128, w, 66, { r: 12, alpha: 0.9 });
      UI.text(ctx, u.name, W / 2, 148, { size: 18, bold: true, align: 'center', color: '#ffd28a', maxW: w - 20 });
      UI.bar(ctx, W / 2 - 110, 166, 220, 10, u.hp / u.mhp, u.side === 'enemy' ? '#e84a4a' : '#5ad07a', u.side === 'enemy' ? '#ff9a6a' : '#a8f08a');
      if (u.side === 'enemy' && (u.elem !== 'none' || u.weak) && this.units.some((x) => x.side === 'party' && x.buffs.some((bb) => bb.acc))) {
        UI.text(ctx, `Element: ${u.elem}${u.weak ? ' · weak to ' + u.weak : ''}`, W / 2, 206, { size: 14, align: 'center', color: '#c8b0ff' });
      }
    }
    drawCutin(ctx) {
      const c = this.cut;
      const k = c.t / 1.0;
      const inK = U.ease.outCubic(U.clamp(k / 0.18, 0, 1));
      const outK = U.ease.inCubic(U.clamp((k - 0.82) / 0.18, 0, 1));
      const col = (NR.CHARS[c.u.char] && NR.CHARS[c.u.char].color) || '#e8a43a';
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.45 * inK * (1 - outK)})`;
      ctx.fillRect(0, 0, W, H);
      // skewed band
      const bandY = 190, bandH = 300;
      ctx.beginPath();
      ctx.moveTo(-100 + (1 - inK) * W * 1.2 - outK * W * 1.4, bandY + 40);
      ctx.lineTo(W + 100 + (1 - inK) * W * 1.2 - outK * W * 1.4, bandY);
      ctx.lineTo(W + 100 + (1 - inK) * W * 1.2 - outK * W * 1.4, bandY + bandH - 40);
      ctx.lineTo(-100 + (1 - inK) * W * 1.2 - outK * W * 1.4, bandY + bandH);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
      g.addColorStop(0, U.shade(col, -0.5));
      g.addColorStop(0.5, U.shade(col, -0.2));
      g.addColorStop(1, U.shade(col, -0.6));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
      // speed lines
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const y = bandY + ((i * 37) % bandH);
        const x = ((i * 173 + this.t * 2400) % (W + 400)) - 200;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 160 + (i % 3) * 60, y - 12);
        ctx.stroke();
      }
      if (c.card) {
        const sc = Math.min(430 / c.card.h, 520 / c.card.w) * 1.15;
        const px = W * 0.62 - (c.card.w * sc) / 2 + (1 - inK) * 300 - outK * 200 - k * 60;
        ctx.drawImage(c.card.canvas, px, bandY - 30, c.card.w * sc, c.card.h * sc);
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = inK * (1 - outK);
      ctx.translate(W * 0.3 - k * 40, bandY + bandH / 2);
      ctx.transform(1, 0, -0.18, 1, 0, 0);
      UI.text(ctx, c.sk.name, 0, 0, { size: 50, bold: true, align: 'center', color: '#fff6de', outline: U.shade(col, -0.6), outlineW: 10, font: 'Impact, "Arial Black", "Trebuchet MS", sans-serif', maxW: 640 });
      UI.text(ctx, c.u.name, 0, 50, { size: 22, bold: true, align: 'center', color: U.light(col, 0.4), outline: '#140a10', outlineW: 5 });
      ctx.restore();
    }
    drawResults(ctx) {
      const r = this.results;
      const k = U.ease.outBack(Math.min(1, r.t * 3));
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.5 * Math.min(1, r.t * 3)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H / 2);
      ctx.scale(k, k);
      ctx.translate(-W / 2, -H / 2);
      const h = 230 + r.ups.length * 30 + (r.drops.length ? 30 : 0);
      UI.panel(ctx, W / 2 - 300, H / 2 - h / 2, 600, h, { r: 18 });
      UI.text(ctx, this.troop.spar ? 'Sparring won!' : 'Victory!', W / 2, H / 2 - h / 2 + 44, { size: 38, bold: true, align: 'center', color: '#ffd28a', font: UI.HFONT, outline: '#3a1a08', outlineW: 6 });
      let y = H / 2 - h / 2 + 100;
      UI.text(ctx, `EXP +${r.exp}`, W / 2, y, { size: 22, align: 'center' });
      y += 34;
      UI.text(ctx, `Ryo +${r.ryo}`, W / 2, y, { size: 22, align: 'center', color: '#ffe08a' });
      y += 34;
      if (r.drops.length) {
        UI.text(ctx, 'Found: ' + r.drops.map((d) => NR.ITEMS[d].name).join(', '), W / 2, y, { size: 18, align: 'center', color: '#9ae8a0', maxW: 560 });
        y += 32;
      }
      for (const up of r.ups) {
        UI.text(ctx, `${NR.charName(up.id)} reached level ${up.level}!` + (up.learned.length ? ` Learned ${up.learned.map((s) => NR.SKILLS[s].name).join(', ')}!` : ''), W / 2, y, { size: 17, align: 'center', color: '#8ac8ff', maxW: 560 });
        y += 30;
      }
      if (r.t > 0.9) UI.text(ctx, 'Press Z to continue', W / 2, H / 2 + h / 2 - 24, { size: 15, align: 'center', color: '#9a96a8' });
      ctx.restore();
    }
    drawGameOver(ctx) {
      const g = this.gameover;
      ctx.fillStyle = `rgba(20,0,0,${Math.min(0.8, g.t)})`;
      ctx.fillRect(0, 0, W, H);
      if (g.t < 0.8) return;
      UI.text(ctx, 'Defeated…', W / 2, 300, { size: 52, bold: true, align: 'center', color: '#ff8a7a', font: UI.HFONT, outline: '#2a0808', outlineW: 8 });
      UI.text(ctx, '"I never go back on my word. That\'s my nindo!"', W / 2, 360, { size: 19, align: 'center', italic: true, color: '#f0d0c8' });
      if (g.list && g.t > 1.2) {
        UI.panel(ctx, W / 2 - 220, 418, 440, 172, { r: 14 });
        g.list.draw(ctx, (c, it, x, y, w, h, sel) => UI.text(c, it.label, x + w / 2, y + h / 2, { size: 19, bold: sel, align: 'center' }));
      }
    }
  }

  NR.battle = {
    active: null,
    start(troopId, opts = {}) {
      // never run two battles at once: a second request waits for the first one's result
      if (NR.battle.active) return NR.battle.active;
      const p = new Promise((resolve) => {
        const b = new Battle(troopId, opts, (r) => {
          NR.battle.active = null;
          resolve(r);
        });
        NR.engine.fadeOut(250).then(() => {
          NR.engine.push(b);
          NR.engine.fadeIn(300);
        });
      });
      NR.battle.active = p;
      return p;
    },
    Battle,
  };
})();
