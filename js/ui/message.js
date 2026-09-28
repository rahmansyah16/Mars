// Dialogue: visual-novel style message box with situation-dependent portraits
// (your pictures first, generated art as fallback), choices and a backlog.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, UI = NR.ui;
  const W = NR.W, H = NR.H;

  const BOX = { x: 40, y: H - 206, w: W - 80, h: 186 };
  const NO_PORTRAIT = new Set(['hm_soldier', 'hm_elite', 'rogue', 'bandit', 'chunin', 'vm1', 'vm2', 'vm3', 'vm4', 'vf1', 'vf2', 'vf3', 'vf4']);
  const SPEEDS = [30, 52, 90, 100000];

  const M = (NR.msg = {
    modal: true,
    // drawn above screen fades, like RPG Maker message windows (narration over black)
    top: true,
    open: false,
    alpha: 0,
    stage: { left: null, right: null },
    speaking: null,
    page: null,
    log: [],
    seed: 1,
    queueClose: false,
  });

  // ---------- portraits ----------
  const cardCache = new Map();
  function isCleanImage(item) {
    const style = NR.settings.portraitStyle;
    if (style === 'framed') return false;
    if (style === 'clean') return true;
    if (item._clean != null) return item._clean;
    let clean = null;
    try {
      const c = U.canvas(16, 16);
      const x = c.getContext('2d');
      x.drawImage(item.img, 0, 0, 16, 16);
      const d = x.getImageData(0, 0, 16, 16).data;
      let transparent = 0;
      for (const [px, py] of [[0, 0], [15, 0], [0, 15], [15, 15], [7, 0], [0, 7], [15, 7]]) if (d[(py * 16 + px) * 4 + 3] < 240) transparent++;
      clean = transparent >= 2;
    } catch (e) {
      // pictures loaded from disk can't be inspected; guess from type and shape
      clean = ['png', 'webp', 'gif', 'avif'].includes(item.ext) && item.h >= item.w * 1.05;
    }
    item._clean = clean;
    return clean;
  }

  // Composite card for rectangular pictures: blurred backdrop + fitted image + frame.
  function framedCard(item, color) {
    const cpr = NR.engine.cpr;
    const key = item.path + '|' + cpr + '|' + color;
    if (cardCache.has(key)) return cardCache.get(key);
    const cw = 430, ch = 520;
    const c = U.canvas(cw * cpr, ch * cpr);
    const x = c.getContext('2d');
    x.scale(cpr, cpr);
    UI.rr(x, 4, 4, cw - 8, ch - 8, 22);
    x.save();
    x.clip();
    const img = item.img, iw = item.w, ih = item.h;
    const cover = Math.max(cw / iw, ch / ih);
    x.filter = 'blur(14px) brightness(0.55) saturate(1.2)';
    x.drawImage(img, (cw - iw * cover) / 2, (ch - ih * cover) / 2, iw * cover, ih * cover);
    x.filter = 'none';
    const fit = Math.min((cw - 16) / iw, (ch - 16) / ih);
    const fw = iw * fit, fh = ih * fit;
    // bias toward the top so faces stay visible above the text box
    x.drawImage(img, (cw - fw) / 2, Math.min((ch - fh) / 2, 30), fw, fh);
    const g = x.createLinearGradient(0, ch * 0.72, 0, ch);
    g.addColorStop(0, 'rgba(10,12,28,0)');
    g.addColorStop(1, 'rgba(10,12,28,0.55)');
    x.fillStyle = g;
    x.fillRect(0, 0, cw, ch);
    x.restore();
    UI.rr(x, 4, 4, cw - 8, ch - 8, 22);
    x.lineWidth = 5;
    x.strokeStyle = color;
    x.stroke();
    UI.rr(x, 11, 11, cw - 22, ch - 22, 17);
    x.lineWidth = 1.5;
    x.strokeStyle = 'rgba(255,255,255,0.45)';
    x.stroke();
    const res = { canvas: c, w: cw, h: ch, framed: true };
    cardCache.set(key, res);
    if (cardCache.size > 40) cardCache.delete(cardCache.keys().next().value);
    return res;
  }

  // Very large cut-outs are scaled down once (drawing a 4000px photo every frame is slow).
  function fitted(item) {
    const max = 1100 * NR.engine.cpr;
    if (item.h <= max) return item.img;
    const key = 'fit|' + item.path + '|' + max;
    if (cardCache.has(key)) return cardCache.get(key);
    let src = item.img, w = item.w, h = item.h;
    // halve repeatedly for a smooth result, then finish at the exact size
    while (h / 2 > max) {
      const c = U.canvas(Math.round(w / 2), Math.round(h / 2));
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      src = c;
      w = c.width;
      h = c.height;
    }
    const out = U.canvas(Math.round((w * max) / h), max);
    const x = out.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, out.width, out.height);
    cardCache.set(key, out);
    return out;
  }

  function cleanCard(img, w, h) {
    return { canvas: img, w, h, framed: false };
  }

  M.resolvePortrait = function (charId, emotion, outfit) {
    const ch = NR.CHARS[charId];
    if (!ch) return null;
    const item = NR.art && NR.art.portraitFor(charId, emotion, outfit, M.seed + (emotion ? emotion.length * 7 : 0));
    if (item) {
      if (isCleanImage(item)) return cleanCard(fitted(item), item.w, item.h);
      return framedCard(item, ch.color || '#e8a43a');
    }
    if (NO_PORTRAIT.has(charId)) return null;
    const g = NR.portraitgen.get(charId, emotion || 'neutral', outfit);
    return g ? cleanCard(g, NR.portraitgen.W, NR.portraitgen.H) : null;
  };

  function setStage(side, charId, emotion, outfit) {
    const cur = M.stage[side];
    const card = M.resolvePortrait(charId, emotion, outfit);
    if (!card) {
      if (cur && cur.char === charId) M.stage[side] = null;
      return;
    }
    if (cur && cur.char === charId) {
      if (cur.card !== card) {
        cur.prev = cur.card;
        cur.prevA = 1;
        cur.card = card;
      }
      cur.emotion = emotion;
      return;
    }
    M.stage[side] = { char: charId, emotion, card, t: 0, a: 0, dim: 0 };
  }

  M.clearStage = function () {
    M.stage.left = M.stage.right = null;
  };

  // ---------- public API ----------
  M.say = function (who, emotion, text, o = {}) {
    return new Promise((resolve) => {
      M.ensureOpen();
      M.queueClose = false;
      const ch = who && NR.CHARS[who];
      const name = o.name || (ch ? ch.name : who || '');
      const outfit = o.outfit || M.outfit || null;
      if (ch && !o.noPortrait) {
        const side = o.side || (who === 'naruto' ? 'left' : 'right');
        if (who !== 'naruto' || NR.settings.showHeroPortrait) setStage(side, who, emotion || 'neutral', outfit);
        M.speaking = side;
      } else M.speaking = null;
      const style = o.style || (ch ? 'talk' : 'narrate');
      const txt = NR.game ? NR.game.format(text) : text;
      M.log.push({ name: style === 'narrate' ? '' : name, text: UI.stripRich(txt), color: ch ? ch.color : '#aaa' });
      if (M.log.length > 120) M.log.shift();
      M.page = { who, name, text: txt, style, color: (ch && ch.color) || '#e8a43a', voice: (ch && ch.voice) || 1, chars: 0, done: false, resolve, lines: null, pageIdx: 0, pages: null, waitT: 0 };
    });
  };

  M.choice = function (options, o = {}) {
    return new Promise((resolve) => {
      M.ensureOpen();
      M.queueClose = false;
      const opts = options.map((op) => (typeof op === 'string' ? { label: op } : op));
      const items = opts.filter((op) => !op.hidden);
      const map = opts.map((op, i) => i).filter((i) => !opts[i].hidden);
      M.choiceBox = new ChoiceBox(items, (idx) => {
        M.choiceBox = null;
        resolve(map[idx]);
      }, o);
    });
  };

  M.ensureOpen = function () {
    if (!M.open) {
      M.open = true;
      M.alpha = 0;
      UI.push(M);
    }
  };
  // Called when an event's run of messages ends.
  M.close = function (keepStage) {
    if (!M.open) return;
    M.open = false;
    M.page = null;
    M.choiceBox = null;
    if (!keepStage) M.clearStage();
    UI.pop(M);
  };
  M.softClose = function () {
    M.queueClose = true;
  };

  // ---------- update ----------
  M.update = function (dt, focus) {
    M.alpha = Math.min(1, M.alpha + dt * 6);
    for (const side of ['left', 'right']) {
      const s = M.stage[side];
      if (!s) continue;
      s.t += dt;
      s.a = Math.min(1, s.a + dt * 5);
      const targetDim = M.speaking && M.speaking !== side ? 1 : 0;
      s.dim = U.approach(s.dim, targetDim, dt * 5);
      if (s.prev) {
        s.prevA -= dt * 6;
        if (s.prevA <= 0) s.prev = null;
      }
    }
    if (!focus) return;
    const I = NR.input;
    if (I.pressed('log') && M.log.length) {
      UI.push(new LogWindow());
      return;
    }
    if (M.choiceBox && (!M.page || M.page.done)) {
      M.choiceBox.update(dt, true);
      return;
    }
    const p = M.page;
    if (!p) {
      if (M.queueClose) M.close();
      return;
    }
    if (!p.lines) layoutPage(p);
    const total = p.pageLen;
    const fast = I.held('skip');
    if (p.chars < total) {
      if (p.waitT > 0) p.waitT -= dt;
      else {
        const speed = fast ? 400 : SPEEDS[NR.settings.textSpeed] || 60;
        const before = Math.floor(p.chars);
        p.chars = Math.min(total, p.chars + speed * dt);
        const after = Math.floor(p.chars);
        if (after > before) {
          const ch = p.plain[after - 1];
          if (after % 2 === 0 && /[a-z0-9]/i.test(ch) && speed < 1000) NR.audio.blip(p.voice);
          if (/[.!?]/.test(ch) && speed < 1000 && !fast) p.waitT = 0.14;
          else if (ch === ',' && speed < 1000 && !fast) p.waitT = 0.05;
        }
      }
      if (I.okPressed()) {
        p.chars = total;
        I.consume('ok');
        I.mouse.clicked = false;
      }
    } else {
      p.done = p.pageIdx >= p.pages.length - 1;
      const adv = I.okPressed() || (fast && (p.fastT = (p.fastT || 0) + dt) > 0.06);
      if (adv) {
        I.consume('ok');
        I.mouse.clicked = false;
        p.fastT = 0;
        if (p.pageIdx < p.pages.length - 1) {
          p.pageIdx++;
          p.chars = 0;
          applyPage(p);
        } else {
          if (!M.choiceBox) {
            NR.audio.sfx('cursor');
            const r = p.resolve;
            M.page = null;
            r();
          }
        }
      }
    }
  };

  const TXT = { size: 25, lh: 36, maxLines: 4 };
  function layoutPage(p) {
    const ctx = NR.engine.ctx;
    const base = { italic: p.style === 'think' || p.style === 'narrate', color: p.style === 'think' ? '#bfe0ff' : p.style === 'narrate' ? '#e6e0d4' : '#f7f3ea' };
    p.base = base;
    const all = UI.layoutRich(ctx, p.text, BOX.w - 90, TXT.size, base);
    p.pages = [];
    for (let i = 0; i < all.length; i += TXT.maxLines) p.pages.push(all.slice(i, i + TXT.maxLines));
    applyPage(p);
  }
  function applyPage(p) {
    p.lines = p.pages[p.pageIdx];
    p.pageLen = UI.richLength(p.lines);
    p.plain = p.lines.map((l) => l.items.map((i) => i.t).join('')).join('');
  }

  // ---------- draw ----------
  function drawSlot(ctx, side, s) {
    const k = U.ease.outCubic(s.a);
    const card = s.card;
    const maxH = 540, maxW = 470;
    const draw = (cd, alpha) => {
      const sc = Math.min(maxH / cd.h, maxW / cd.w);
      const w = cd.w * sc, h = cd.h * sc;
      const cx = side === 'left' ? 250 : W - 250;
      const x = cx - w / 2 + (1 - k) * (side === 'left' ? -60 : 60);
      const bob = Math.sin(s.t * 1.6) * 2;
      const y = BOX.y + 70 - h + bob + s.dim * 16;
      ctx.save();
      ctx.globalAlpha = alpha * k;
      if (!cd.framed) {
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(cd.canvas, x, y, w, h);
      ctx.restore();
      return { x, y, w, h };
    };
    // dimming via filter when another character speaks
    ctx.save();
    if (s.dim > 0.01) ctx.filter = `brightness(${1 - s.dim * 0.42}) saturate(${1 - s.dim * 0.3})`;
    if (s.prev) draw(s.prev, s.prevA);
    draw(card, s.prev ? 1 - s.prevA * 0.5 : 1);
    ctx.restore();
  }

  M.draw = function (ctx) {
    const a = U.ease.outCubic(M.alpha);
    ctx.save();
    ctx.globalAlpha = a;
    // stage (non-speaker first)
    const order = M.speaking === 'left' ? ['right', 'left'] : ['left', 'right'];
    for (const side of order) if (M.stage[side]) drawSlot(ctx, side, M.stage[side]);
    const p = M.page;
    if (p || M.choiceBox) {
      const kur = p && p.who === 'kurama';
      UI.panel(ctx, BOX.x, BOX.y, BOX.w, BOX.h, { r: 18, alpha: 0.9, border: kur ? '#ff6a2a' : '#e8a43a', top: kur ? 'rgba(60,20,14,0.92)' : null, bottom: kur ? 'rgba(24,8,8,0.92)' : null });
      if (p) {
        if (!p.lines) layoutPage(p);
        if (p.style !== 'narrate' && p.name) {
          const nm = p.style === 'think' ? `(${p.name})` : p.name;
          const nw = UI.measure(ctx, nm, 22, true) + 44;
          const nx = M.speaking === 'right' ? BOX.x + BOX.w - nw - 30 : BOX.x + 30;
          const ny = BOX.y - 26;
          ctx.save();
          UI.rr(ctx, nx, ny, nw, 44, 12);
          const g = ctx.createLinearGradient(nx, ny, nx, ny + 44);
          g.addColorStop(0, U.light(p.color, 0.18));
          g.addColorStop(1, U.shade(p.color, -0.35));
          ctx.fillStyle = g;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.stroke();
          ctx.restore();
          UI.text(ctx, nm, nx + nw / 2, ny + 22, { size: 22, bold: true, align: 'center', outline: 'rgba(0,0,0,0.55)', outlineW: 4 });
        }
        UI.drawRich(ctx, p.lines, BOX.x + 44, BOX.y + 30, TXT.lh, TXT.size, p.base, Math.floor(p.chars));
        if (p.chars >= p.pageLen && !M.choiceBox) {
          const t = NR.engine.time;
          const bx = BOX.x + BOX.w - 42, by = BOX.y + BOX.h - 30 + Math.sin(t * 6) * 4;
          ctx.fillStyle = '#ffb44a';
          ctx.beginPath();
          ctx.moveTo(bx - 10, by - 6);
          ctx.lineTo(bx + 10, by - 6);
          ctx.lineTo(bx, by + 6);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    ctx.restore();
    if (M.choiceBox && (!p || p.chars >= p.pageLen)) M.choiceBox.draw(ctx);
  };

  // ---------- choices ----------
  class ChoiceBox {
    constructor(items, done, o) {
      this.items = items;
      this.done = done;
      this.t = 0;
      const ctx = NR.engine.ctx;
      const w = Math.max(320, ...items.map((i) => UI.measure(ctx, UI.stripRich(i.label), 22) + 80));
      const rowH = 50;
      this.w = Math.min(w, W - 200);
      this.h = items.length * rowH + 28;
      this.x = W - 70 - this.w;
      this.y = BOX.y - 30 - this.h;
      this.list = new UI.List({
        x: this.x + 14, y: this.y + 14, w: this.w - 28, rowH, items, visible: 8,
        onPick: (i) => this.done(i),
        onCancel: o.cancel != null ? () => this.done(o.cancel) : null,
      });
    }
    update(dt, focus) {
      this.t += dt;
      this.list.update(dt, focus);
    }
    draw(ctx) {
      const k = U.ease.outBack(Math.min(1, this.t * 5));
      ctx.save();
      ctx.translate(this.x + this.w, this.y + this.h);
      ctx.scale(k, k);
      ctx.translate(-(this.x + this.w), -(this.y + this.h));
      UI.panel(ctx, this.x, this.y, this.w, this.h, { r: 14 });
      this.list.draw(ctx, (c, it, x, y, w, h, sel) => {
        const lines = UI.layoutRich(c, it.label, 2000, 22, { color: it.disabled ? '#8a8a96' : sel ? '#fff4d6' : '#e8e2d6' });
        if (it.heart) {
          c.save();
          c.translate(x + 22, y + h / 2 + 2);
          NR.fx.heartPath(c);
          c.fillStyle = '#ff5a8a';
          c.fill();
          c.restore();
        }
        UI.drawRich(c, lines, x + (it.heart ? 38 : 18), y + h / 2 - 13, 26, 22, { color: it.disabled ? '#8a8a96' : sel ? '#fff4d6' : '#e8e2d6' });
      });
      ctx.restore();
    }
  }

  // ---------- backlog ----------
  class LogWindow {
    constructor() {
      this.top = true;
      this.scroll = Math.max(0, M.log.length - 9);
    }
    update(dt, focus) {
      if (!focus) return;
      const I = NR.input;
      if (I.repeat('up')) this.scroll = Math.max(0, this.scroll - 1);
      if (I.repeat('down')) this.scroll = Math.min(Math.max(0, M.log.length - 9), this.scroll + 1);
      if (I.mouse.wheel) this.scroll = U.clamp(this.scroll + I.mouse.wheel, 0, Math.max(0, M.log.length - 9));
      if (I.cancelPressed() || I.pressed('log') || I.pressed('ok')) {
        I.consume();
        UI.pop(this);
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(6,8,18,0.82)';
      ctx.fillRect(0, 0, W, H);
      UI.text(ctx, 'Conversation Log', W / 2, 44, { size: 28, bold: true, align: 'center', color: '#ffd28a' });
      const lines = M.log.slice(this.scroll, this.scroll + 9);
      let y = 90;
      for (const l of lines) {
        if (l.name) UI.text(ctx, l.name, 90, y + 12, { size: 20, bold: true, color: l.color });
        const lay = UI.layoutRich(ctx, l.text, W - 360, 20, {});
        UI.drawRich(ctx, lay.slice(0, 2), 250, y, 26, 20, { color: '#ece6da' });
        y += Math.min(2, lay.length) * 26 + 16;
      }
      UI.text(ctx, '↑↓ scroll · X / Tab close', W / 2, H - 30, { size: 16, align: 'center', color: '#9a96a8' });
    }
  }
})();
