// UI core: overlay stack, panels, text helpers, list widgets and toast notifications.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;

  const FONT = '"Segoe UI", "Trebuchet MS", "Noto Sans", "Helvetica Neue", Arial, sans-serif';
  const HFONT = '"Trebuchet MS", "Segoe UI", "Noto Sans", Arial, sans-serif';
  const UI = (NR.ui = { stack: [], toasts: [], FONT, HFONT });

  UI.push = (w) => {
    UI.stack.push(w);
    w.onOpen && w.onOpen();
    return w;
  };
  UI.pop = (w) => {
    const i = w ? UI.stack.indexOf(w) : UI.stack.length - 1;
    if (i >= 0) {
      const [x] = UI.stack.splice(i, 1);
      x.onClose && x.onClose();
    }
  };
  UI.top = () => UI.stack[UI.stack.length - 1];
  UI.blocking = () => UI.stack.some((w) => w.modal !== false);
  UI.update = function (dt) {
    const top = UI.top();
    for (const w of UI.stack.slice()) w.update && w.update(dt, w === top);
    for (let i = UI.toasts.length - 1; i >= 0; i--) {
      const t = UI.toasts[i];
      t.t += dt;
      if (t.t > t.dur) UI.toasts.splice(i, 1);
    }
  };
  UI.draw = function (ctx) {
    for (const w of UI.stack) if (!w.top) w.draw && w.draw(ctx);
    UI.drawToasts(ctx);
  };
  // Drawn above screen fades (title cards, credits).
  UI.drawTop = function (ctx) {
    for (const w of UI.stack) if (w.top) w.draw && w.draw(ctx);
    if (UI.loading) {
      UI.text(ctx, UI.loading, NR.W / 2, NR.H / 2, { size: 22, align: 'center', color: '#f6e6b8' });
    }
  };

  // ---------- drawing primitives ----------
  UI.rr = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  UI.panel = function (ctx, x, y, w, h, o = {}) {
    const r = o.r != null ? o.r : 12;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    UI.rr(ctx, x, y, w, h, r);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    const a = o.alpha != null ? o.alpha : 0.9;
    g.addColorStop(0, o.top || `rgba(34,40,72,${a})`);
    g.addColorStop(1, o.bottom || `rgba(14,16,34,${a})`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.save();
    UI.rr(ctx, x, y, w, h, r);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = o.border || '#e8a43a';
    ctx.stroke();
    UI.rr(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(2, r - 4));
    ctx.lineWidth = 1;
    ctx.strokeStyle = o.inner || 'rgba(255,220,160,0.22)';
    ctx.stroke();
    // top sheen
    ctx.clip();
    const s = ctx.createLinearGradient(0, y, 0, y + Math.min(40, h * 0.4));
    s.addColorStop(0, 'rgba(255,255,255,0.08)');
    s.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = s;
    ctx.fillRect(x, y, w, Math.min(40, h * 0.4));
    ctx.restore();
  };
  UI.text = function (ctx, str, x, y, o = {}) {
    ctx.save();
    const size = o.size || 20;
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || (o.bold ? 'bold' : '600')} ${size}px ${o.font || FONT}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.maxW && ctx.measureText(str).width > o.maxW) {
      const k = o.maxW / ctx.measureText(str).width;
      ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || (o.bold ? 'bold' : '600')} ${Math.floor(size * k)}px ${o.font || FONT}`;
    }
    if (o.outline) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.outlineW || 4;
      ctx.strokeStyle = o.outline;
      ctx.strokeText(str, x, y);
    } else if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(str, x + 1.5, y + 2);
    }
    ctx.fillStyle = o.color || '#f4f1ea';
    ctx.fillText(str, x, y);
    ctx.restore();
  };
  UI.measure = function (ctx, str, size = 20, bold) {
    ctx.save();
    ctx.font = `${bold ? 'bold' : '600'} ${size}px ${FONT}`;
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };
  UI.bar = function (ctx, x, y, w, h, k, c1, c2, o = {}) {
    k = U.clamp(k, 0, 1);
    ctx.save();
    UI.rr(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = o.bg || 'rgba(0,0,0,0.55)';
    ctx.fill();
    if (k > 0) {
      UI.rr(ctx, x, y, Math.max(h, w * k), h, h / 2);
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2 || c1);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + h / 2, y + 1, Math.max(0, w * k - h), h * 0.35);
    }
    UI.rr(ctx, x, y, w, h, h / 2);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
    ctx.restore();
  };
  UI.cursorBar = function (ctx, x, y, w, h, t) {
    ctx.save();
    const a = 0.35 + Math.sin(t * 5) * 0.12;
    UI.rr(ctx, x, y, w, h, 8);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, `rgba(255,170,60,${a + 0.15})`);
    g.addColorStop(1, `rgba(255,120,40,${a * 0.4})`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,210,140,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };

  // ---------- rich text ----------
  // Markup: [y]yellow[/y] [r]red[/r] [b]blue[/b] [p]pink[/p] [g]green[/g] [o]orange[/o] [i]italic[/i]
  const COLORS = { y: '#ffd76a', r: '#ff7a6a', b: '#7ab8ff', p: '#ff9ec8', g: '#8fe07a', o: '#ffab5a', w: '#ffffff', v: '#c9a6ff' };
  UI.parseRich = function (str) {
    const runs = [];
    let color = null, italic = false;
    const re = /\[(\/?)([a-z])\]/g;
    let last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) runs.push({ t: str.slice(last, m.index), color, italic });
      if (m[2] === 'i') italic = !m[1];
      else color = m[1] ? null : COLORS[m[2]] || null;
      last = re.lastIndex;
    }
    if (last < str.length) runs.push({ t: str.slice(last), color, italic });
    return runs;
  };
  UI.stripRich = (s) => String(s).replace(/\[\/?[a-z]\]/g, '');

  // Layout rich text into lines of words: [{words:[{t,color,italic,w}], w}]
  UI.layoutRich = function (ctx, str, maxW, size, base) {
    const runs = UI.parseRich(str);
    const lines = [{ items: [], w: 0 }];
    const fontOf = (it) => `${it ? 'italic ' : ''}600 ${size}px ${FONT}`;
    for (const run of runs) {
      const parts = run.t.split(/(\s+|\n)/);
      for (const part of parts) {
        if (part === '') continue;
        if (part === '\n' || part.includes('\n')) {
          lines.push({ items: [], w: 0 });
          continue;
        }
        ctx.font = fontOf(run.italic || base.italic);
        const w = ctx.measureText(part).width;
        let line = lines[lines.length - 1];
        if (line.w + w > maxW && !/^\s+$/.test(part) && line.items.length) {
          line = { items: [], w: 0 };
          lines.push(line);
        }
        if (/^\s+$/.test(part) && !line.items.length) continue;
        line.items.push({ t: part, color: run.color, italic: run.italic || base.italic, w });
        line.w += w;
      }
    }
    return lines;
  };
  // Draw laid-out lines; reveal only `chars` characters. Returns total char count.
  UI.drawRich = function (ctx, lines, x, y, lh, size, base, chars = Infinity) {
    let n = 0;
    ctx.save();
    ctx.textBaseline = 'top';
    for (let li = 0; li < lines.length; li++) {
      let cx = x;
      for (const it of lines[li].items) {
        ctx.font = `${it.italic ? 'italic ' : ''}600 ${size}px ${FONT}`;
        let t = it.t;
        if (n + t.length > chars) t = t.slice(0, Math.max(0, chars - n));
        if (t) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillText(t, cx + 1.5, y + li * lh + 2);
          ctx.fillStyle = it.color || base.color || '#f4f1ea';
          ctx.fillText(t, cx, y + li * lh);
        }
        n += it.t.length;
        cx += it.w;
        if (n >= chars) {
          ctx.restore();
          return n;
        }
      }
    }
    ctx.restore();
    return n;
  };
  UI.richLength = (lines) => lines.reduce((s, l) => s + l.items.reduce((a, i) => a + i.t.length, 0), 0);

  // ---------- selectable list helper ----------
  // Handles keyboard + mouse for a vertical list. items: [{label, disabled}]
  UI.List = class {
    constructor(o) {
      Object.assign(this, { x: 0, y: 0, w: 300, rowH: 44, index: 0, scroll: 0, visible: 8, cols: 1, onPick: null, onCancel: null, onMove: null }, o);
    }
    get count() {
      return this.items.length;
    }
    update(dt, focus) {
      if (!focus || !this.count) return;
      const I = NR.input;
      const old = this.index;
      const cols = this.cols, n = this.count;
      if (I.repeat('down')) {
        this.index += cols;
        if (this.index >= n) this.index = this.index % cols;
        if (this.index >= n) this.index = n - 1;
      }
      if (I.repeat('up')) {
        this.index -= cols;
        if (this.index < 0) {
          const col = (this.index + cols) % cols;
          let last = col;
          while (last + cols < n) last += cols;
          this.index = last;
        }
      }
      if (cols > 1) {
        if (I.repeat('right')) this.index = (this.index + 1) % n;
        if (I.repeat('left')) this.index = (this.index - 1 + n) % n;
      }
      this.index = ((this.index % n) + n) % n;
      // mouse hover / wheel
      const m = I.mouse;
      if (m.wheel) this.scroll = U.clamp(this.scroll + m.wheel, 0, Math.max(0, Math.ceil(this.count / cols) - this.visible));
      const hit = this.hitTest(m.x, m.y);
      if (m.moved && hit >= 0) this.index = hit;
      if (old !== this.index) {
        NR.audio.sfx('cursor');
        this.onMove && this.onMove(this.index);
      }
      const row = Math.floor(this.index / cols);
      if (row < this.scroll) this.scroll = row;
      if (row >= this.scroll + this.visible) this.scroll = row - this.visible + 1;
      if (I.pressed('ok') || (m.clicked && hit >= 0 && hit === this.index)) {
        const it = this.items[this.index];
        if (it && it.disabled) NR.audio.sfx('buzzer');
        else {
          NR.audio.sfx('ok');
          this.onPick && this.onPick(this.index, it);
        }
        I.consume('ok');
        m.clicked = false;
      } else if (I.cancelPressed()) {
        I.consume('cancel');
        m.rclicked = false;
        if (this.onCancel) {
          NR.audio.sfx('cancel');
          this.onCancel();
        }
      }
    }
    colW() {
      return this.w / this.cols;
    }
    hitTest(mx, my) {
      for (let i = 0; i < this.count; i++) {
        const r = Math.floor(i / this.cols) - this.scroll;
        if (r < 0 || r >= this.visible) continue;
        const cx = this.x + (i % this.cols) * this.colW();
        const cy = this.y + r * this.rowH;
        if (mx >= cx && mx < cx + this.colW() && my >= cy && my < cy + this.rowH) return i;
      }
      return -1;
    }
    draw(ctx, drawItem, focus = true) {
      const t = NR.engine.time;
      for (let i = 0; i < this.count; i++) {
        const r = Math.floor(i / this.cols) - this.scroll;
        if (r < 0 || r >= this.visible) continue;
        const cx = this.x + (i % this.cols) * this.colW();
        const cy = this.y + r * this.rowH;
        if (i === this.index && focus) UI.cursorBar(ctx, cx, cy + 2, this.colW() - 6, this.rowH - 4, t);
        drawItem(ctx, this.items[i], cx, cy, this.colW() - 6, this.rowH, i === this.index);
      }
      const rows = Math.ceil(this.count / this.cols);
      if (rows > this.visible) {
        const h = this.visible * this.rowH;
        const k = this.scroll / (rows - this.visible);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(this.x + this.w + 2, this.y, 4, h);
        ctx.fillStyle = '#e8a43a';
        ctx.fillRect(this.x + this.w + 2, this.y + k * (h - 30), 4, 30);
      }
    }
  };

  // ---------- toasts ----------
  UI.toast = function (text, o = {}) {
    UI.toasts.push({ text, t: 0, dur: o.dur || 3.2, icon: o.icon || null, color: o.color || '#e8a43a' });
    if (UI.toasts.length > 5) UI.toasts.shift();
  };
  UI.drawToasts = function (ctx) {
    let y = 86;
    for (const t of UI.toasts) {
      const k = Math.min(1, t.t / 0.25, (t.dur - t.t) / 0.4);
      ctx.save();
      ctx.globalAlpha = U.clamp(k, 0, 1);
      ctx.font = `600 18px ${FONT}`;
      const w = ctx.measureText(UI.stripRich(t.text)).width + (t.icon ? 70 : 44);
      const x = NR.W - 24 - w + (1 - U.ease.outCubic(U.clamp(t.t / 0.3, 0, 1))) * 60;
      UI.panel(ctx, x, y, w, 42, { r: 10, border: t.color, alpha: 0.92 });
      let tx = x + 22;
      if (t.icon === 'heart') {
        ctx.save();
        ctx.translate(x + 28, y + 23);
        ctx.scale(1.2, 1.2);
        NR.fx.heartPath(ctx);
        ctx.fillStyle = '#ff5a8a';
        ctx.fill();
        ctx.restore();
        tx = x + 48;
      } else if (t.icon) {
        UI.text(ctx, t.icon, x + 30, y + 21, { size: 20, align: 'center' });
        tx = x + 50;
      }
      const lines = UI.layoutRich(ctx, t.text, 2000, 18, {});
      UI.drawRich(ctx, lines, tx, y + 11, 22, 18, {});
      ctx.restore();
      y += 50;
    }
  };

  // Simple full-screen gradient background helper (menus, title)
  UI.bgGradient = function (ctx, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, NR.H);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, NR.W, NR.H);
  };
})();
