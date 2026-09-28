// Main menu and sub-screens, shop, gift picker, save/load, settings.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, UI = NR.ui, W = NR.W, H = NR.H;
  const I = NR.input;
  const MN = (NR.menus = {});

  // ---------- face thumbnails ----------
  const faceCache = new Map();
  MN.face = function (id, size = 96) {
    const key = id + '|' + size + '|' + (NR.art.version || 0) + '|' + NR.engine.cpr;
    if (faceCache.has(key)) return faceCache.get(key);
    const cpr = NR.engine.cpr;
    const c = U.canvas(size * cpr, size * cpr);
    const x = c.getContext('2d');
    x.scale(cpr, cpr);
    x.save();
    x.beginPath();
    x.arc(size / 2, size / 2, size / 2 - 2, 0, U.TAU);
    x.clip();
    const bg = x.createLinearGradient(0, 0, 0, size);
    const col = (NR.CHARS[id] && NR.CHARS[id].color) || '#888';
    bg.addColorStop(0, U.light(col, 0.3));
    bg.addColorStop(1, U.shade(col, -0.4));
    x.fillStyle = bg;
    x.fillRect(0, 0, size, size);
    const it = NR.art.portraitFor(id, 'neutral');
    if (it && it.img) {
      const s = Math.max(size / it.w, (size * 1.2) / it.h) * 1.05;
      x.drawImage(it.img, size / 2 - (it.w * s) / 2, -it.h * s * 0.04, it.w * s, it.h * s);
    } else {
      const p = NR.portraitgen.get(id, 'neutral', null, 0.5);
      if (p) {
        // head region of the 400x500 design
        x.drawImage(p, 60 * 0.5 * cpr, 20 * 0.5 * cpr, 280 * 0.5 * cpr, 280 * 0.5 * cpr, 0, 0, size, size);
      }
    }
    x.restore();
    x.lineWidth = 3;
    x.strokeStyle = col;
    x.beginPath();
    x.arc(size / 2, size / 2, size / 2 - 2, 0, U.TAU);
    x.stroke();
    faceCache.set(key, c);
    if (faceCache.size > 60) faceCache.delete(faceCache.keys().next().value);
    return c;
  };
  MN.drawFace = (ctx, id, x, y, size) => ctx.drawImage(MN.face(id, size), x, y, size, size);

  function dimBg(ctx, a = 0.62) {
    ctx.fillStyle = `rgba(6,8,20,${a})`;
    ctx.fillRect(0, 0, W, H);
  }
  function header(ctx, title, sub) {
    UI.text(ctx, title, 60, 50, { size: 32, bold: true, color: '#ffd28a', font: UI.HFONT });
    if (sub) UI.text(ctx, sub, 62, 84, { size: 16, color: '#b8b0c8' });
    ctx.fillStyle = 'rgba(232,164,58,0.6)';
    ctx.fillRect(60, 100, W - 120, 2);
  }
  function hint(ctx, t) {
    UI.text(ctx, t, W / 2, H - 26, { size: 15, align: 'center', color: '#9a96a8' });
  }

  // Generic base screen with list + back handling.
  class Screen {
    constructor() {
      this.t = 0;
      // full-screen menus hide the menus underneath them (the map still shows, dimmed)
      this.cover = true;
    }
    update(dt, focus) {
      this.t += dt;
    }
    close() {
      UI.pop(this);
    }
  }

  // ---------- main menu ----------
  const CMDS = [
    ['Items', () => UI.push(new ItemScreen())],
    ['Jutsu', () => UI.push(new MemberPick((id) => UI.push(new SkillScreen(id))))],
    ['Equip', () => UI.push(new MemberPick((id) => UI.push(new EquipScreen(id))))],
    ['Status', () => UI.push(new MemberPick((id) => UI.push(new StatusScreen(id))))],
    ['Party Talk', () => {
      const others = NR.game.state.party.filter((id) => id !== 'naruto');
      if (!others.length) {
        NR.audio.sfx('buzzer');
        return UI.toast('Naruto is travelling alone right now.', { icon: '🍃' });
      }
      UI.push(new MemberPick((id) => {
        while (UI.stack.length) UI.pop();
        NR.events.run('companion_talk', { self: { char: id } });
      }, { members: others, title: 'Talk to…' }));
    }],
    ['Quests', () => UI.push(new QuestScreen())],
    ['Bonds ♥', () => UI.push(new BondScreen())],
    ['Gallery', () => UI.push(new GalleryScreen())],
    ['Save', () => MN.saveLoad('save')],
    ['Load', () => MN.saveLoad('load')],
    ['Settings', () => UI.push(new SettingsScreen())],
    ['Art Setup', () => NR.artManager.show()],
    ['Title Screen', () => MN.confirm('Return to the title screen? Unsaved progress will be lost.').then((y) => y && NR.titleScreen.show())],
  ];
  class MainMenu extends Screen {
    constructor() {
      super();
      this.cover = false;
      this.list = new UI.List({
        x: 70, y: 126, w: 260, rowH: 41, visible: 13,
        items: CMDS.map(([l]) => ({ label: l })),
        onPick: (i) => CMDS[i][1](),
        onCancel: () => this.close(),
      });
    }
    onOpen() {
      NR.audio.sfx('open');
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus && I.pressed('menu')) {
        I.consume();
        this.close();
        return;
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      const k = U.ease.outCubic(Math.min(1, this.t * 5));
      ctx.save();
      ctx.globalAlpha = k;
      dimBg(ctx, 0.55);
      UI.panel(ctx, 50, 110, 300, 560, { r: 16 });
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => UI.text(c, it.label, x + 22, y + h / 2, { size: 21, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6' }));
      // party cards
      const party = NR.game.state.party;
      party.forEach((id, i) => {
        const x = 380, y = 110 + i * 140;
        drawMemberCard(ctx, id, x, y, 560, 126);
      });
      // info panel
      const st = NR.game.state;
      UI.panel(ctx, 960, 110, 270, 312, { r: 16 });
      UI.text(ctx, NR.MAPS[st.map] ? NR.MAPS[st.map].name : '', 980, 140, { size: 18, bold: true, color: '#ffd28a', maxW: 230 });
      UI.text(ctx, `Day ${st.day} · ${NR.game.TIME_LABEL[st.time]}`, 980, 172, { size: 17 });
      UI.text(ctx, `💰 ${st.ryo} ryo`, 980, 204, { size: 17 });
      UI.text(ctx, `⏱ ${U.fmtTime(st.playtime)}`, 980, 236, { size: 17 });
      UI.text(ctx, `Chapter ${st.chapter}`, 980, 268, { size: 17, color: '#c8c0d8' });
      const q = NR.game.activeQuests('main')[0];
      if (q) {
        UI.text(ctx, q.q.title, 980, 300, { size: 14, bold: true, color: '#ffd28a', maxW: 230 });
        const lines = U.wrap((ctx.font = `600 14px ${UI.FONT}`, ctx), q.text, 230).slice(0, 5);
        lines.forEach((l, j) => UI.text(ctx, l, 980, 322 + j * 19, { size: 14, color: '#e8e2d6' }));
      }
      ctx.restore();
      hint(ctx, 'Z/Enter select · X/Esc back');
    }
  }
  function drawMemberCard(ctx, id, x, y, w, h, sel) {
    const m = NR.game.member(id), s = NR.game.stats(id), ch = NR.CHARS[id];
    UI.panel(ctx, x, y, w, h, { r: 14, border: sel ? '#ffd28a' : '#e8a43a' });
    MN.drawFace(ctx, id, x + 14, y + 13, 100);
    UI.text(ctx, ch.name, x + 130, y + 30, { size: 23, bold: true, color: ch.color });
    UI.text(ctx, `Lv ${m.level}`, x + w - 24, y + 30, { size: 20, bold: true, align: 'right', color: '#ffd28a' });
    UI.text(ctx, 'HP', x + 130, y + 62, { size: 15, color: '#9ae8a0' });
    UI.bar(ctx, x + 162, y + 54, w - 300, 14, m.hp / s.mhp, '#5ad07a', '#a8f08a');
    UI.text(ctx, `${m.hp}/${s.mhp}`, x + w - 24, y + 61, { size: 15, align: 'right' });
    UI.text(ctx, 'CP', x + 130, y + 88, { size: 15, color: '#8ac8ff' });
    UI.bar(ctx, x + 162, y + 80, w - 300, 14, m.cp / s.mcp, '#3a8ae8', '#8ad0ff');
    UI.text(ctx, `${m.cp}/${s.mcp}`, x + w - 24, y + 87, { size: 15, align: 'right' });
    const need = NR.expToNext(m.level);
    UI.bar(ctx, x + 130, y + 106, w - 154, 7, m.exp / need, '#e8a43a', '#ffd28a');
  }
  MN.drawMemberCard = drawMemberCard;

  MN.openMain = () => UI.push(new MainMenu());

  // ---------- member picker ----------
  class MemberPick extends Screen {
    constructor(onPick, o = {}) {
      super();
      this.cover = false;
      this.o = o;
      const party = o.members || NR.game.state.party;
      this.list = new UI.List({
        x: 360, y: 150, w: 560, rowH: 140, visible: 4, items: party.map((id) => ({ id })),
        onPick: (i, it) => {
          if (o.keep) onPick(it.id, this);
          else {
            this.close();
            onPick(it.id);
          }
        },
        onCancel: () => this.close(),
      });
    }
    update(dt, focus) {
      super.update(dt, focus);
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.5);
      UI.text(ctx, this.o.title || 'Choose a party member', W / 2, 110, { size: 24, bold: true, align: 'center', color: '#ffd28a' });
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => drawMemberCard(c, it.id, x, y, w, h - 12, sel), true);
      if (this.o.extra) this.o.extra(ctx);
    }
  }
  MN.MemberPick = MemberPick;

  // ---------- items ----------
  const CATS = [['use', 'Items'], ['gift', 'Gifts'], ['equip', 'Gear'], ['key', 'Key Items']];
  class ItemScreen extends Screen {
    constructor() {
      super();
      this.cat = 0;
      this.build();
    }
    build() {
      const type = CATS[this.cat][0];
      const inv = NR.game.state.inv;
      const items = Object.keys(inv).filter((k) => NR.ITEMS[k] && NR.ITEMS[k].type === type).map((k) => ({ id: k, n: inv[k], it: NR.ITEMS[k] }));
      const old = this.list ? this.list.index : 0;
      this.list = new UI.List({
        x: 70, y: 170, w: 640, rowH: 46, visible: 10, items, index: Math.min(old, Math.max(0, items.length - 1)),
        onPick: (i, e) => this.use(e),
        onCancel: () => this.close(),
      });
    }
    use(e) {
      if (!e || e.it.type !== 'use' || !e.it.field) {
        NR.audio.sfx('buzzer');
        return;
      }
      UI.push(
        new MemberPick(
          (id, picker) => {
            if (!NR.game.has(e.id)) return picker.close();
            if (e.it.use.all) {
              let any = false;
              for (const pid of NR.game.state.party) any = NR.game.useItemOn(e.id, pid) || any;
              if (any) {
                NR.game.take(e.id);
                NR.audio.sfx('heal');
              } else NR.audio.sfx('buzzer');
            } else {
              const r = NR.game.useItemOn(e.id, id);
              if (r) {
                NR.game.take(e.id);
                NR.audio.sfx('heal');
              } else NR.audio.sfx('buzzer');
            }
            this.build();
            if (!NR.game.has(e.id)) picker.close();
          },
          { keep: true, title: `Use ${e.it.name} on…` }
        )
      );
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus && (I.pressed('pageup') || I.pressed('pagedown') || I.repeat('left') || I.repeat('right'))) {
        const d = I.pressed('pageup') || I.repeat('left') ? -1 : 1;
        this.cat = (this.cat + d + CATS.length) % CATS.length;
        NR.audio.sfx('cursor');
        this.build();
        I.consume();
      }
      if (focus && I.mouse.clicked) {
        for (let i = 0; i < CATS.length; i++) if (I.inRect(70 + i * 160, 118, 150, 38)) {
          this.cat = i;
          this.build();
          I.mouse.clicked = false;
        }
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.72);
      header(ctx, 'Items', 'Q/E or ←/→ to switch pouch');
      CATS.forEach(([, label], i) => {
        const on = i === this.cat;
        UI.panel(ctx, 70 + i * 160, 118, 150, 38, { r: 10, border: on ? '#ffd28a' : 'rgba(232,164,58,0.4)', alpha: on ? 0.95 : 0.6 });
        UI.text(ctx, label, 145 + i * 160, 137, { size: 17, bold: on, align: 'center', color: on ? '#fff4d6' : '#b8b0c8' });
      });
      UI.panel(ctx, 60, 164, 660, 480, { r: 14 });
      if (!this.list.count) UI.text(ctx, 'Nothing here yet.', 390, 400, { size: 18, align: 'center', color: '#8a86a0' });
      this.list.draw(ctx, (c, e, x, y, w, h, sel) => {
        UI.text(c, e.it.icon || '•', x + 26, y + h / 2, { size: 22, align: 'center', shadow: false });
        UI.text(c, e.it.name, x + 52, y + h / 2, { size: 19, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6', maxW: w - 140 });
        UI.text(c, '×' + e.n, x + w - 16, y + h / 2, { size: 18, align: 'right', color: '#ffd28a' });
      });
      const e = this.list.items[this.list.index];
      UI.panel(ctx, 740, 164, 480, 480, { r: 14 });
      if (e) {
        UI.text(ctx, (e.it.icon || '') + ' ' + e.it.name, 764, 196, { size: 21, bold: true, color: '#ffd28a', maxW: 430 });
        const lines = U.wrap((ctx.font = `600 17px ${UI.FONT}`, ctx), e.it.desc || '', 430);
        lines.forEach((l, i) => UI.text(ctx, l, 764, 236 + i * 26, { size: 17 }));
        if (e.it.type === 'gift') UI.text(ctx, 'Give it to someone when talking to them.', 764, 600, { size: 15, color: '#ff9ec8' });
        if (e.it.type === 'use' && e.it.field) UI.text(ctx, 'Press Z to use.', 764, 600, { size: 15, color: '#9ae8a0' });
        if (e.it.type === 'equip') UI.text(ctx, 'Equip it from the Equip menu.', 764, 600, { size: 15, color: '#8ac8ff' });
      }
      hint(ctx, 'Z use · X back');
    }
  }

  // ---------- jutsu (field) ----------
  class SkillScreen extends Screen {
    constructor(id) {
      super();
      this.id = id;
      const skills = NR.game.skillsOf(id).map((s) => ({ id: s, sk: NR.SKILLS[s] }));
      this.list = new UI.List({
        x: 70, y: 170, w: 640, rowH: 50, visible: 9, items: skills,
        onPick: (i, e) => this.use(e),
        onCancel: () => this.close(),
      });
    }
    use(e) {
      const sk = e.sk, m = NR.game.member(this.id);
      if (sk.kind !== 'heal' || m.cp < sk.cp) {
        NR.audio.sfx('buzzer');
        return;
      }
      const apply = (tid) => {
        const t = NR.game.member(tid), s = NR.game.stats(tid);
        if (sk.revive) {
          if (t.hp > 0) return false;
          t.hp = Math.round(s.mhp * sk.revive);
          return true;
        }
        if (t.hp <= 0 || t.hp >= s.mhp) return false;
        t.hp = Math.min(s.mhp, t.hp + Math.round(s.mhp * (sk.heal || 0.3)));
        return true;
      };
      if (sk.target === 'allies') {
        let any = false;
        for (const pid of NR.game.state.party) any = apply(pid) || any;
        if (any) {
          m.cp -= sk.cp;
          NR.audio.sfx('heal');
        } else NR.audio.sfx('buzzer');
        return;
      }
      UI.push(
        new MemberPick(
          (tid, picker) => {
            if (m.cp < sk.cp) return picker.close();
            if (apply(tid)) {
              m.cp -= sk.cp;
              NR.audio.sfx('heal');
            } else NR.audio.sfx('buzzer');
          },
          { keep: true, title: `${sk.name} on…` }
        )
      );
    }
    update(dt, focus) {
      super.update(dt, focus);
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.72);
      const m = NR.game.member(this.id);
      header(ctx, `${NR.charName(this.id)} — Jutsu`, `Chakra ${m.cp}/${NR.game.stats(this.id).mcp}`);
      UI.panel(ctx, 60, 160, 660, 480, { r: 14 });
      this.list.draw(ctx, (c, e, x, y, w, h, sel) => {
        const col = NR.ELEM_COLOR[e.sk.elem || 'none'];
        UI.text(c, e.sk.name, x + 20, y + h / 2, { size: 19, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6', maxW: w - 150 });
        if (e.sk.elem) UI.text(c, NR.ELEM_ICON[e.sk.elem] || '', x + w - 110, y + h / 2, { size: 18, shadow: false });
        UI.text(c, e.sk.cp ? e.sk.cp + ' CP' : '—', x + w - 16, y + h / 2, { size: 17, align: 'right', color: col });
      });
      const e = this.list.items[this.list.index];
      UI.panel(ctx, 740, 160, 480, 480, { r: 14 });
      if (e) {
        UI.text(ctx, e.sk.name, 764, 194, { size: 21, bold: true, color: '#ffd28a', maxW: 430 });
        const lines = U.wrap((ctx.font = `600 17px ${UI.FONT}`, ctx), e.sk.desc || '', 430);
        lines.forEach((l, i) => UI.text(ctx, l, 764, 234 + i * 26, { size: 17 }));
        const info = [];
        if (e.sk.power) info.push(`Power ${e.sk.power}${e.sk.hits ? ' ×' + e.sk.hits : ''}`);
        info.push({ enemy: 'One enemy', enemies: 'All enemies', ally: 'One ally', allies: 'Whole party', self: 'Self', ally_dead: 'Fallen ally' }[e.sk.target] || '');
        if (e.sk.elem) info.push(e.sk.elem[0].toUpperCase() + e.sk.elem.slice(1) + ' element');
        UI.text(ctx, info.join(' · '), 764, 560, { size: 15, color: '#b8b0c8' });
        if (e.sk.kind === 'heal') UI.text(ctx, 'Press Z to use now.', 764, 600, { size: 15, color: '#9ae8a0' });
      }
      hint(ctx, 'Healing jutsu can be used outside battle · X back');
    }
  }

  // ---------- equip ----------
  class EquipScreen extends Screen {
    constructor(id) {
      super();
      this.id = id;
      this.slot = 0;
      this.mode = 'slots';
      this.buildSlots();
    }
    buildSlots() {
      const m = NR.game.member(this.id);
      this.slots = new UI.List({
        x: 70, y: 180, w: 520, rowH: 60, visible: 3,
        items: ['weapon', 'gear', 'charm'].map((s) => ({ slot: s, item: m.equip[s] })),
        index: this.slot,
        onPick: (i) => {
          this.slot = i;
          this.openPick();
        },
        onCancel: () => this.close(),
        onMove: (i) => (this.slot = i),
      });
    }
    openPick() {
      const slot = ['weapon', 'gear', 'charm'][this.slot];
      const inv = NR.game.state.inv;
      const items = [{ id: null, label: '— Remove —' }].concat(Object.keys(inv).filter((k) => NR.ITEMS[k] && NR.ITEMS[k].type === 'equip' && NR.ITEMS[k].slot === slot).map((k) => ({ id: k, label: NR.ITEMS[k].name, n: inv[k] })));
      this.mode = 'pick';
      this.pick = new UI.List({
        x: 640, y: 180, w: 560, rowH: 48, visible: 8, items,
        onPick: (i, e) => {
          if (e.id) NR.game.equip(this.id, e.id);
          else NR.game.unequip(this.id, slot);
          NR.audio.sfx('ok');
          this.mode = 'slots';
          this.buildSlots();
        },
        onCancel: () => {
          this.mode = 'slots';
        },
      });
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (this.mode === 'pick') this.pick.update(dt, focus);
      else this.slots.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.72);
      header(ctx, `${NR.charName(this.id)} — Equipment`);
      UI.panel(ctx, 60, 170, 540, 200, { r: 14 });
      this.slots.draw(ctx, (c, e, x, y, w, h, sel) => {
        UI.text(c, e.slot.toUpperCase(), x + 20, y + h / 2, { size: 15, color: '#b8b0c8' });
        const it = e.item && NR.ITEMS[e.item];
        UI.text(c, it ? it.icon + ' ' + it.name : '— empty —', x + 120, y + h / 2, { size: 19, bold: sel, color: it ? '#fff4d6' : '#8a86a0', maxW: w - 140 });
      }, this.mode === 'slots');
      // stats with preview
      const s = NR.game.stats(this.id);
      let preview = null;
      if (this.mode === 'pick') {
        const e = this.pick.items[this.pick.index];
        const m = NR.game.member(this.id);
        const slot = ['weapon', 'gear', 'charm'][this.slot];
        const old = m.equip[slot];
        m.equip[slot] = e ? e.id : null;
        preview = NR.game.stats(this.id);
        m.equip[slot] = old;
      }
      UI.panel(ctx, 60, 390, 540, 260, { r: 14 });
      const keys = [['mhp', 'Max HP'], ['mcp', 'Max CP'], ['atk', 'ATK'], ['def', 'DEF'], ['int', 'INT'], ['res', 'RES'], ['spd', 'SPD'], ['crit', 'CRIT']];
      keys.forEach(([k, label], i) => {
        const x = 90 + (i % 2) * 260, y = 420 + Math.floor(i / 2) * 50;
        UI.text(ctx, label, x, y, { size: 16, color: '#b8b0c8' });
        UI.text(ctx, String(s[k]), x + 120, y, { size: 19, bold: true, align: 'right' });
        if (preview && preview[k] !== s[k]) UI.text(ctx, '→ ' + preview[k], x + 132, y, { size: 19, bold: true, color: preview[k] > s[k] ? '#8fe07a' : '#ff7a6a' });
      });
      if (this.mode === 'pick') {
        UI.panel(ctx, 630, 170, 580, 480, { r: 14 });
        this.pick.draw(ctx, (c, e, x, y, w, h, sel) => {
          UI.text(c, e.label, x + 20, y + h / 2, { size: 18, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6', maxW: w - 80 });
          if (e.n) UI.text(c, '×' + e.n, x + w - 14, y + h / 2, { size: 16, align: 'right', color: '#ffd28a' });
        });
        const e = this.pick.items[this.pick.index];
        if (e && e.id) {
          const lines = U.wrap((ctx.font = `600 15px ${UI.FONT}`, ctx), NR.ITEMS[e.id].desc, 520);
          lines.forEach((l, i) => UI.text(ctx, l, 650, 600 + i * 20, { size: 15, color: '#c8c0d8' }));
        }
      }
      hint(ctx, 'Z choose · X back');
    }
  }

  // ---------- status ----------
  class StatusScreen extends Screen {
    constructor(id) {
      super();
      this.id = id;
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus && (I.cancelPressed() || I.okPressed())) {
        I.consume();
        this.close();
      }
    }
    draw(ctx) {
      dimBg(ctx, 0.78);
      const ch = NR.CHARS[this.id], m = NR.game.member(this.id), s = NR.game.stats(this.id);
      const card = NR.msg.resolvePortrait(this.id, 'neutral');
      if (card) {
        const sc = Math.min(560 / card.h, 440 / card.w);
        ctx.drawImage(card.canvas, W - 40 - card.w * sc, H - card.h * sc, card.w * sc, card.h * sc);
      }
      header(ctx, ch.full || ch.name, `${ch.title || ''} · Age ${ch.age}`);
      UI.panel(ctx, 60, 120, 700, 540, { r: 14 });
      UI.text(ctx, `Level ${m.level}`, 90, 156, { size: 24, bold: true, color: '#ffd28a' });
      UI.text(ctx, `EXP ${m.exp} / ${NR.expToNext(m.level)}`, 260, 156, { size: 17, color: '#c8c0d8' });
      const rows = [['HP', `${m.hp} / ${s.mhp}`], ['Chakra', `${m.cp} / ${s.mcp}`], ['Attack', s.atk], ['Defense', s.def], ['Ninjutsu', s.int], ['Resistance', s.res], ['Speed', s.spd], ['Critical', s.crit + '%']];
      rows.forEach(([k, v], i) => {
        const x = 90 + (i % 2) * 330, y = 200 + Math.floor(i / 2) * 44;
        UI.text(ctx, k, x, y, { size: 17, color: '#b8b0c8' });
        UI.text(ctx, String(v), x + 280, y, { size: 19, bold: true, align: 'right' });
      });
      UI.text(ctx, 'Equipment', 90, 390, { size: 18, bold: true, color: '#ffd28a' });
      ['weapon', 'gear', 'charm'].forEach((sl, i) => {
        const it = m.equip[sl] && NR.ITEMS[m.equip[sl]];
        UI.text(ctx, `${sl}: ${it ? it.name : '—'}`, 90, 422 + i * 28, { size: 16 });
      });
      const bio = U.wrap((ctx.font = `italic 600 16px ${UI.FONT}`, ctx), ch.bio || '', 640);
      bio.slice(0, 4).forEach((l, i) => UI.text(ctx, l, 90, 530 + i * 24, { size: 16, italic: true, color: '#d8d0e0' }));
      if (this.id === 'naruto') {
        UI.text(ctx, `Kurama gauge: ${Math.round(m.kurama || 0)}%`, 420, 390, { size: 16, color: '#ff9a4a' });
      }
      hint(ctx, 'X back');
    }
  }

  // ---------- quests ----------
  const QTABS = [['main', 'Main'], ['side', 'Side'], ['romance', 'Romance ♥'], ['done', 'Completed']];
  class QuestScreen extends Screen {
    constructor() {
      super();
      this.tab = 0;
      this.build();
    }
    build() {
      const tab = QTABS[this.tab][0];
      const qs = NR.game.state.quests;
      const items = Object.keys(qs)
        .filter((id) => NR.QUESTS[id] && (tab === 'done' ? qs[id].done : !qs[id].done && NR.QUESTS[id].type === tab))
        .map((id) => ({ id, q: NR.QUESTS[id], s: qs[id] }))
        .sort((a, b) => b.s.t - a.s.t);
      this.list = new UI.List({ x: 70, y: 170, w: 460, rowH: 50, visible: 9, items, onCancel: () => this.close() });
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus && (I.pressed('pageup') || I.pressed('pagedown') || I.repeat('left') || I.repeat('right'))) {
        const d = I.pressed('pageup') || I.repeat('left') ? -1 : 1;
        this.tab = (this.tab + d + QTABS.length) % QTABS.length;
        NR.audio.sfx('cursor');
        this.build();
        I.consume();
      }
      if (focus && I.mouse.clicked) {
        for (let i = 0; i < QTABS.length; i++) if (I.inRect(70 + i * 170, 118, 160, 38)) {
          this.tab = i;
          this.build();
          I.mouse.clicked = false;
        }
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.78);
      header(ctx, 'Quest Journal', 'Q/E or ←/→ to switch tabs');
      QTABS.forEach(([, label], i) => {
        const on = i === this.tab;
        UI.panel(ctx, 70 + i * 170, 118, 160, 38, { r: 10, border: on ? '#ffd28a' : 'rgba(232,164,58,0.4)', alpha: on ? 0.95 : 0.6 });
        UI.text(ctx, label, 150 + i * 170, 137, { size: 17, bold: on, align: 'center', color: on ? '#fff4d6' : '#b8b0c8' });
      });
      UI.panel(ctx, 60, 164, 480, 490, { r: 14 });
      if (!this.list.count) UI.text(ctx, 'No quests here.', 300, 400, { size: 18, align: 'center', color: '#8a86a0' });
      this.list.draw(ctx, (c, e, x, y, w, h, sel) => {
        const col = e.q.type === 'romance' ? '#ff9ec8' : e.q.type === 'main' ? '#ffd28a' : '#8ac8ff';
        UI.text(c, e.q.title, x + 18, y + h / 2, { size: 18, bold: sel, color: sel ? '#fff4d6' : col, maxW: w - 30 });
      });
      const e = this.list.items[this.list.index];
      UI.panel(ctx, 560, 164, 660, 490, { r: 14 });
      if (e) {
        UI.text(ctx, e.q.title, 584, 198, { size: 23, bold: true, color: '#ffd28a', maxW: 610 });
        let y = 240;
        const stages = e.q.stages;
        for (let i = 0; i <= Math.min(e.s.stage, stages.length - 1); i++) {
          const cur = i === e.s.stage && !e.s.done;
          const lines = U.wrap((ctx.font = `600 16px ${UI.FONT}`, ctx), (cur ? '▶ ' : '✔ ') + stages[i], 600);
          for (const l of lines) {
            UI.text(ctx, l, 584, y, { size: 16, color: cur ? '#fff4d6' : '#8a86a0' });
            y += 23;
          }
          y += 8;
        }
        if (e.q.char) {
          const a = NR.game.aff(e.q.char);
          UI.text(ctx, `${NR.charName(e.q.char)} ♥ ${a}/100 · ${NR.bondRank(a)}`, 584, 624, { size: 16, color: '#ff9ec8' });
        }
      }
      hint(ctx, 'X back');
    }
  }

  // ---------- bonds ----------
  class BondScreen extends Screen {
    constructor() {
      super();
      this.list = new UI.List({ x: 70, y: 130, w: 420, rowH: 84, visible: 6, items: NR.ROMANCE.map((id) => ({ id })), onCancel: () => this.close() });
    }
    update(dt, focus) {
      super.update(dt, focus);
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.8);
      const e = this.list.items[this.list.index];
      if (e) {
        const card = NR.msg.resolvePortrait(e.id, NR.game.aff(e.id) >= 60 ? 'love' : 'happy');
        if (card) {
          const sc = Math.min(600 / card.h, 480 / card.w);
          ctx.drawImage(card.canvas, W - 30 - card.w * sc, H - card.h * sc, card.w * sc, card.h * sc);
        }
      }
      header(ctx, 'Bonds', 'Spend time, finish their quests and bring gifts to grow closer. All characters are adults.');
      UI.panel(ctx, 60, 120, 450, 530, { r: 14, border: '#ff7aa8' });
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => {
        const ch = NR.CHARS[it.id], a = NR.game.aff(it.id);
        MN.drawFace(c, it.id, x + 10, y + 8, 66);
        UI.text(c, ch.name, x + 90, y + 26, { size: 20, bold: true, color: ch.color });
        UI.text(c, NR.bondRank(a), x + w - 16, y + 26, { size: 15, align: 'right', color: '#ff9ec8' });
        drawHearts(c, x + 90, y + 50, a);
      });
      if (e) {
        const ch = NR.CHARS[e.id];
        const a = NR.game.aff(e.id);
        UI.panel(ctx, 530, 470, 420, 180, { r: 14, border: '#ff7aa8', alpha: 0.85 });
        UI.text(ctx, `${ch.full}, ${ch.age}`, 552, 500, { size: 19, bold: true, color: '#ffd28a' });
        UI.text(ctx, ch.title, 552, 526, { size: 15, color: '#c8c0d8', maxW: 380 });
        const q = NR.QUESTS['r_' + e.id];
        const s = NR.game.quest('r_' + e.id);
        let tip = !s ? 'Talk to them around the village to begin.' : s.done ? 'Your hearts are one. ♥' : q.stages[s.stage];
        const lines = U.wrap((ctx.font = `600 15px ${UI.FONT}`, ctx), tip, 380);
        lines.slice(0, 3).forEach((l, i) => UI.text(ctx, l, 552, 556 + i * 21, { size: 15 }));
        const known = NR.game.vr('giftknown_' + e.id);
        UI.text(ctx, 'Favourite gift: ' + (known ? NR.ITEMS[NR.GIFTS[e.id].love[0]].name : '???'), 552, 628, { size: 14, color: '#ff9ec8' });
        UI.text(ctx, `♥ ${a} / 100`, 930, 500, { size: 18, bold: true, align: 'right', color: '#ff7aa8' });
      }
      hint(ctx, 'X back');
    }
  }
  function drawHearts(ctx, x, y, a) {
    for (let i = 0; i < 10; i++) {
      const f = U.clamp((a - i * 10) / 10, 0, 1);
      ctx.save();
      ctx.translate(x + i * 22 + 8, y + 8);
      ctx.scale(0.9, 0.9);
      NR.fx.heartPath(ctx);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
      if (f > 0) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#ff5a8a';
        ctx.fillRect(-12, -14, 24 * f, 22);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  MN.drawHearts = drawHearts;

  // ---------- gallery ----------
  const MEMORIES = [
    ['hinata_1', 'hinata', 'Training in the Hyuga Garden'], ['hinata_2', 'hinata', 'A Walk by the River'], ['hinata_3', 'hinata', 'Moonlit Bath'],
    ['sakura_1', 'sakura', 'Herbs for the Hospital'], ['sakura_2', 'sakura', 'Overtime'], ['sakura_3', 'sakura', 'Under the Cherry Tree'],
    ['ino_1', 'ino', 'The Moon Lily'], ['ino_2', 'ino', 'Flower Lesson'], ['ino_3', 'ino', 'After Hours'],
    ['tenten_1', 'tenten', 'The Stolen Crate'], ['tenten_2', 'tenten', 'Target Practice'], ['tenten_3', 'tenten', 'Polishing Steel'],
    ['temari_1', 'temari', 'Diplomatic Errand'], ['temari_2', 'temari', 'Sparring in the Wind'], ['temari_3', 'temari', 'Rooftops at Midnight'],
    ['tsunade_1', 'tsunade', 'Double or Nothing'], ['tsunade_2', 'tsunade', 'Drinking Contest'], ['tsunade_3', 'tsunade', 'Moonlit Bath for Two'],
    ['tsunade_4', 'tsunade', 'Night Shift'], ['tsunade_5', 'tsunade', 'Forfeit Dice'], ['tsunade_6', 'tsunade', 'Her True Face'], ['tsunade_7', 'tsunade', 'Stay'],
    ['festival', null, 'The Lantern Festival'], ['ending', null, 'The Seventh Dawn'],
  ];
  MN.MEMORIES = MEMORIES;
  class GalleryScreen extends Screen {
    constructor() {
      super();
      const g = NR.game.state.gallery;
      this.list = new UI.List({
        x: 70, y: 130, w: 1140, rowH: 60, visible: 8, cols: 3,
        items: MEMORIES.map(([key, ch, title]) => ({ key, ch, title, open: !!g[key] })),
        onPick: (i, it) => {
          if (!it.open) return NR.audio.sfx('buzzer');
          const fn = NR.SCRIPTS['memory_' + it.key];
          if (!fn) return;
          while (UI.stack.length) UI.pop();
          NR.events.run(async (E) => {
            await E.fadeOut(300);
            await fn(E, { replay: true });
            await E.fadeOut(300);
            await E.backdrop(null, { fade: false });
            await E.fadeIn(300);
          });
        },
        onCancel: () => this.close(),
      });
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus && I.pressed('pagedown')) {
        I.consume();
        UI.push(new ArtViewer());
        return;
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.85);
      header(ctx, 'Gallery — Memories', 'Replay scenes you have unlocked · E: character art viewer');
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => {
        UI.panel(c, x + 4, y + 4, w - 8, h - 8, { r: 10, alpha: it.open ? 0.9 : 0.5, border: it.open ? '#ff9ec8' : 'rgba(255,255,255,0.15)' });
        if (it.ch && it.open) MN.drawFace(c, it.ch, x + 12, y + 10, 40);
        UI.text(c, it.open ? it.title : '???', x + (it.ch && it.open ? 62 : 20), y + h / 2, { size: 16, bold: sel, color: it.open ? '#fff4d6' : '#6a6680', maxW: w - 80 });
      });
      hint(ctx, 'Z replay · E art viewer · X back');
    }
  }
  // Browse every character's art for each situation (your pictures or generated).
  class ArtViewer extends Screen {
    constructor() {
      super();
      this.ids = Object.keys(NR.CHARS).filter((id) => NR.CHARS[id].bio);
      this.ci = 0;
      this.ei = 0;
      this.emos = Object.keys(NR.EMOTIONS);
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (!focus) return;
      if (I.repeat('left')) this.ci = (this.ci - 1 + this.ids.length) % this.ids.length;
      if (I.repeat('right')) this.ci = (this.ci + 1) % this.ids.length;
      if (I.repeat('up')) this.ei = (this.ei - 1 + this.emos.length) % this.emos.length;
      if (I.repeat('down')) this.ei = (this.ei + 1) % this.emos.length;
      if (I.cancelPressed()) {
        I.consume();
        this.close();
      }
    }
    draw(ctx) {
      dimBg(ctx, 0.9);
      const id = this.ids[this.ci], emo = this.emos[this.ei];
      header(ctx, `${NR.CHARS[id].full} — ${emo}`, '←/→ character · ↑/↓ situation · X back');
      const card = NR.msg.resolvePortrait(id, emo);
      if (card) {
        const sc = Math.min(560 / card.h, 700 / card.w);
        ctx.drawImage(card.canvas, W / 2 - (card.w * sc) / 2, 130, card.w * sc, card.h * sc);
      }
      const it = NR.art.portraitFor(id, emo);
      UI.text(ctx, it ? 'Your picture: ' + it.path : 'Generated portrait (add your own in Art Setup)', W / 2, H - 56, { size: 15, align: 'center', color: '#c8c0d8' });
    }
  }

  // ---------- save / load ----------
  class SaveScreen extends Screen {
    constructor(mode, resolve) {
      super();
      this.mode = mode;
      this.resolve = resolve;
      this.build();
    }
    build() {
      const items = [];
      for (let i = 0; i < NR.storage.SLOTS; i++) items.push({ slot: i, info: NR.storage.slotInfo(i) });
      const start = this.mode === 'save' ? 1 : 0;
      this.list = new UI.List({
        x: 150, y: 130, w: 980, rowH: 64, visible: 8, items: items.slice(start), index: 0,
        onPick: (i, it) => this.pick(it),
        onCancel: () => this.done(false),
      });
    }
    async pick(it) {
      if (this.mode === 'save') {
        if (it.info && !(await MN.confirm('Overwrite this save?'))) return;
        NR.game.save(it.slot);
        NR.ui.toast('Game saved.', { icon: '💾' });
        this.build();
        this.done(true);
      } else {
        if (!it.info) return NR.audio.sfx('buzzer');
        this.done(true);
        NR.boot.loadGame(it.slot);
      }
    }
    done(v) {
      this.close();
      this.resolve && this.resolve(v);
    }
    update(dt, focus) {
      super.update(dt, focus);
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.85);
      header(ctx, this.mode === 'save' ? 'Save Game' : 'Load Game', this.mode === 'save' ? 'Slot 0 is the autosave (written when you change areas).' : '');
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => {
        UI.panel(c, x + 2, y + 3, w - 4, h - 6, { r: 10, alpha: 0.85, border: sel ? '#ffd28a' : 'rgba(232,164,58,0.35)' });
        const label = it.slot === 0 ? 'Autosave' : 'Slot ' + it.slot;
        UI.text(c, label, x + 24, y + h / 2, { size: 18, bold: true, color: '#ffd28a' });
        if (!it.info) {
          UI.text(c, '— empty —', x + 170, y + h / 2, { size: 17, color: '#6a6680' });
          return;
        }
        const inf = it.info;
        (inf.party || []).slice(0, 4).forEach((pid, k) => MN.drawFace(c, pid, x + 150 + k * 44, y + 12, 40));
        UI.text(c, `Lv ${inf.level} · ${inf.place}`, x + 340, y + 22, { size: 17, bold: true, maxW: 380 });
        UI.text(c, `Chapter ${inf.chapter} · Day ${inf.day} ${NR.game.TIME_LABEL[inf.time] || ''} · ${U.fmtTime(inf.playtime)}`, x + 340, y + 44, { size: 14, color: '#c8c0d8' });
        UI.text(c, new Date(inf.savedAt).toLocaleString(), x + w - 20, y + h / 2, { size: 14, align: 'right', color: '#9a96a8' });
      });
      hint(ctx, 'Z select · X back');
    }
  }
  MN.saveLoad = (mode) => new Promise((r) => UI.push(new SaveScreen(mode, r)));

  // ---------- settings ----------
  class SettingsScreen extends Screen {
    constructor() {
      super();
      const s = NR.settings;
      this.rows = [
        { label: 'Music volume', get: () => Math.round(s.musicVol * 10), set: (d) => (s.musicVol = U.clamp(Math.round(s.musicVol * 10 + d) / 10, 0, 1)), fmt: (v) => '▮'.repeat(v) + '▯'.repeat(10 - v) },
        { label: 'Sound volume', get: () => Math.round(s.sfxVol * 10), set: (d) => (s.sfxVol = U.clamp(Math.round(s.sfxVol * 10 + d) / 10, 0, 1)), fmt: (v) => '▮'.repeat(v) + '▯'.repeat(10 - v) },
        { label: 'Text speed', get: () => s.textSpeed, set: (d) => (s.textSpeed = U.clamp(s.textSpeed + d, 0, 3)), fmt: (v) => ['Slow', 'Normal', 'Fast', 'Instant'][v] },
        { label: 'Always run', get: () => s.alwaysDash, set: () => (s.alwaysDash = !s.alwaysDash), fmt: (v) => (v ? 'On' : 'Off') },
        { label: 'Mature romance scenes (18+)', get: () => s.romance, set: () => (s.romance = !s.romance), fmt: (v) => (v ? 'On' : 'Off — scenes are summarised') },
        { label: 'Show Naruto\'s portrait', get: () => s.showHeroPortrait, set: () => (s.showHeroPortrait = !s.showHeroPortrait), fmt: (v) => (v ? 'On' : 'Off') },
        { label: 'Portrait frames', get: () => s.portraitStyle, set: (d) => { const o = ['auto', 'framed', 'clean']; s.portraitStyle = o[(o.indexOf(s.portraitStyle) + (d < 0 ? 2 : 1)) % 3]; }, fmt: (v) => ({ auto: 'Automatic', framed: 'Always framed', clean: 'Never framed' }[v]) },
        { label: 'Voice blips', get: () => s.voiceBlips, set: () => (s.voiceBlips = !s.voiceBlips), fmt: (v) => (v ? 'On' : 'Off') },
        { label: 'Character sprites', get: () => s.spritePref, set: () => { s.spritePref = s.spritePref === 'user' ? 'generated' : 'user'; NR.art.spriteCache = {}; }, fmt: (v) => (v === 'user' ? 'Your sprites first' : 'Generated only') },
        { label: 'Battle speed', get: () => s.battleSpeed, set: (d) => (s.battleSpeed = U.clamp(Math.round((s.battleSpeed + d * 0.5) * 2) / 2, 1, 2.5)), fmt: (v) => v + '×' },
        { label: 'Open Art Setup…', action: () => NR.artManager.show() },
      ];
      this.list = new UI.List({
        x: 150, y: 140, w: 980, rowH: 46, visible: 11, items: this.rows,
        onPick: (i, r) => (r.action ? r.action() : this.change(r, 1)),
        onCancel: () => this.close(),
      });
    }
    change(r, d) {
      if (!r.set) return;
      r.set(d);
      NR.storage.saveSettings();
      NR.audio.applyVolumes();
      NR.audio.sfx('cursor');
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus) {
        const r = this.rows[this.list.index];
        if (I.repeat('left')) this.change(r, -1);
        if (I.repeat('right')) this.change(r, 1);
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.85);
      header(ctx, 'Settings');
      this.list.draw(ctx, (c, r, x, y, w, h, sel) => {
        UI.text(c, r.label, x + 24, y + h / 2, { size: 19, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6' });
        if (r.get) UI.text(c, r.fmt(r.get()), x + w - 24, y + h / 2, { size: 18, align: 'right', color: '#ffd28a' });
      });
      hint(ctx, '←/→ change · Z toggle · X back');
    }
  }
  MN.SettingsScreen = SettingsScreen;

  // ---------- confirm ----------
  class Confirm extends Screen {
    constructor(text, resolve) {
      super();
      this.cover = false;
      this.text = text;
      this.resolve = resolve;
      this.list = new UI.List({
        x: W / 2 - 120, y: H / 2 + 10, w: 240, rowH: 46, visible: 2, items: [{ label: 'Yes' }, { label: 'No' }], index: 1,
        onPick: (i) => this.done(i === 0),
        onCancel: () => this.done(false),
      });
    }
    done(v) {
      this.close();
      this.resolve(v);
    }
    update(dt, focus) {
      super.update(dt, focus);
      this.list.update(dt, focus);
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      UI.panel(ctx, W / 2 - 300, H / 2 - 90, 600, 220, { r: 16 });
      const lines = U.wrap((ctx.font = `600 19px ${UI.FONT}`, ctx), this.text, 540);
      lines.forEach((l, i) => UI.text(ctx, l, W / 2, H / 2 - 50 + i * 26, { size: 19, align: 'center' }));
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => UI.text(c, it.label, x + w / 2, y + h / 2, { size: 20, bold: sel, align: 'center' }));
    }
  }
  MN.confirm = (text) => new Promise((r) => UI.push(new Confirm(text, r)));

  // ---------- shop ----------
  class ShopScreen extends Screen {
    constructor(list, o, resolve) {
      super();
      this.goods = list;
      this.o = o || {};
      this.resolve = resolve;
      this.mode = 'buy';
      this.build();
    }
    build() {
      let items;
      if (this.mode === 'buy') items = this.goods.map((id) => ({ id, it: NR.ITEMS[id], price: NR.ITEMS[id].price }));
      else items = Object.keys(NR.game.state.inv).filter((k) => NR.ITEMS[k] && NR.ITEMS[k].type !== 'key' && NR.ITEMS[k].price > 0).map((id) => ({ id, it: NR.ITEMS[id], price: Math.floor(NR.ITEMS[id].price / 2), n: NR.game.count(id) }));
      const idx = this.list ? Math.min(this.list.index, Math.max(0, items.length - 1)) : 0;
      this.list = new UI.List({
        x: 70, y: 170, w: 640, rowH: 48, visible: 9, items, index: idx,
        onPick: (i, e) => this.trade(e),
        onCancel: () => this.done(),
      });
    }
    trade(e) {
      const st = NR.game.state;
      if (this.mode === 'buy') {
        if (st.ryo < e.price) return NR.audio.sfx('buzzer');
        st.ryo -= e.price;
        NR.game.give(e.id, 1);
        NR.audio.sfx('coin');
      } else {
        if (!NR.game.take(e.id, 1)) return;
        st.ryo += e.price;
        NR.audio.sfx('coin');
        this.build();
      }
    }
    done() {
      this.close();
      this.resolve && this.resolve();
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (focus && (I.pressed('pageup') || I.pressed('pagedown') || I.repeat('left') || I.repeat('right'))) {
        this.mode = this.mode === 'buy' ? 'sell' : 'buy';
        NR.audio.sfx('cursor');
        this.build();
        I.consume();
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.75);
      header(ctx, this.o.title || 'Shop', `You have ${NR.game.state.ryo} ryo · Q/E switch Buy / Sell`);
      ['buy', 'sell'].forEach((m, i) => {
        const on = m === this.mode;
        UI.panel(ctx, 70 + i * 160, 118, 150, 38, { r: 10, border: on ? '#ffd28a' : 'rgba(232,164,58,0.4)', alpha: on ? 0.95 : 0.6 });
        UI.text(ctx, m === 'buy' ? 'Buy' : 'Sell', 145 + i * 160, 137, { size: 17, bold: on, align: 'center', color: on ? '#fff4d6' : '#b8b0c8' });
      });
      UI.panel(ctx, 60, 164, 660, 480, { r: 14 });
      this.list.draw(ctx, (c, e, x, y, w, h, sel) => {
        UI.text(c, e.it.icon || '•', x + 24, y + h / 2, { size: 20, align: 'center', shadow: false });
        UI.text(c, e.it.name, x + 50, y + h / 2, { size: 18, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6', maxW: w - 220 });
        UI.text(c, `${e.price} ryo`, x + w - 16, y + h / 2, { size: 17, align: 'right', color: NR.game.state.ryo >= e.price || this.mode === 'sell' ? '#ffd28a' : '#8a6a6a' });
        const own = NR.game.count(e.id);
        if (own) UI.text(c, `own ${own}`, x + w - 120, y + h / 2, { size: 14, align: 'right', color: '#9a96a8' });
      });
      const e = this.list.items[this.list.index];
      UI.panel(ctx, 740, 164, 480, 480, { r: 14 });
      if (e) {
        UI.text(ctx, e.it.name, 764, 196, { size: 21, bold: true, color: '#ffd28a', maxW: 430 });
        U.wrap((ctx.font = `600 17px ${UI.FONT}`, ctx), e.it.desc || '', 430).forEach((l, i) => UI.text(ctx, l, 764, 236 + i * 26, { size: 17 }));
      }
      hint(ctx, 'Z buy/sell one · X leave');
    }
  }
  MN.shop = (list, o) => new Promise((r) => UI.push(new ShopScreen(list, o, r)));

  // ---------- gift picker ----------
  class GiftScreen extends Screen {
    constructor(charId, resolve) {
      super();
      this.cover = false;
      this.charId = charId;
      this.resolve = resolve;
      const inv = NR.game.state.inv;
      const items = Object.keys(inv).filter((k) => NR.ITEMS[k] && NR.ITEMS[k].type === 'gift').map((id) => ({ id, it: NR.ITEMS[id], n: inv[id] }));
      this.list = new UI.List({
        x: W / 2 - 300, y: 200, w: 600, rowH: 48, visible: 8, items,
        onPick: (i, e) => this.done(e.id),
        onCancel: () => this.done(null),
      });
    }
    done(v) {
      this.close();
      this.resolve(v);
    }
    update(dt, focus) {
      super.update(dt, focus);
      if (!this.list.count && focus && (I.okPressed() || I.cancelPressed())) {
        I.consume();
        return this.done(null);
      }
      this.list.update(dt, focus);
    }
    draw(ctx) {
      dimBg(ctx, 0.6);
      UI.panel(ctx, W / 2 - 320, 130, 640, 460, { r: 16, border: '#ff7aa8' });
      UI.text(ctx, `Give a gift to ${NR.charName(this.charId)}`, W / 2, 166, { size: 22, bold: true, align: 'center', color: '#ff9ec8' });
      if (!this.list.count) {
        UI.text(ctx, 'You have no gifts. Sweets and flowers are sold in the village.', W / 2, 360, { size: 17, align: 'center', color: '#c8c0d8' });
        return;
      }
      this.list.draw(ctx, (c, e, x, y, w, h, sel) => {
        UI.text(c, e.it.icon, x + 24, y + h / 2, { size: 20, align: 'center', shadow: false });
        UI.text(c, e.it.name, x + 50, y + h / 2, { size: 18, bold: sel, color: sel ? '#fff4d6' : '#e8e2d6' });
        UI.text(c, '×' + e.n, x + w - 16, y + h / 2, { size: 17, align: 'right', color: '#ffd28a' });
      });
    }
  }
  MN.giftPicker = (c) => new Promise((r) => UI.push(new GiftScreen(c, r)));

  // Big centred title card (chapter titles).
  UI.titleCard = function (text, sub, ms) {
    return new Promise((resolve) => {
      const card = {
        t: 0, modal: true, top: true,
        update(dt) {
          this.t += dt;
          if (this.t * 1000 > ms) {
            UI.pop(card);
            resolve();
          }
        },
        draw(ctx) {
          const k = Math.min(1, this.t / 0.6, (ms / 1000 - this.t) / 0.6);
          ctx.save();
          ctx.globalAlpha = U.clamp(k, 0, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.72)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#e8a43a';
          ctx.fillRect(W / 2 - 260 * k, H / 2 - 60, 520 * k, 2);
          ctx.fillRect(W / 2 - 260 * k, H / 2 + 60, 520 * k, 2);
          UI.text(ctx, text, W / 2, H / 2 - 18, { size: 40, bold: true, align: 'center', color: '#fff0d0', font: UI.HFONT });
          if (sub) UI.text(ctx, sub, W / 2, H / 2 + 30, { size: 20, align: 'center', color: '#e8c890', italic: true });
          ctx.restore();
        },
      };
      UI.push(card);
    });
  };
})();
