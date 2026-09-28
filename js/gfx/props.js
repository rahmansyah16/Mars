// Map objects (trees, fences, lamps, furniture, buildings...). Each type draws itself
// with vector cel-shaded art into a cached canvas; flat "decal" props are baked into
// the ground chunks instead.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const TS = NR.TS;
  const OUT = '#2a1c22';
  const PR = (NR.props = { types: {}, cache: new Map() });

  // ---------- drawing helpers (shared with buildings/interior files) ----------
  const H = (PR.h = {});
  H.OUT = OUT;
  H.P = () => new Path2D();
  H.rr = (p, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    p.moveTo(x + r, y);
    p.arcTo(x + w, y, x + w, y + h, r);
    p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r);
    p.arcTo(x, y, x + w, y, r);
    p.closePath();
    return p;
  };
  H.ell = (p, cx, cy, rx, ry, rot = 0) => {
    p.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
    p.ellipse(cx, cy, rx, ry, rot, 0, U.TAU);
    return p;
  };
  H.poly = (p, pts) => {
    p.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
    p.closePath();
    return p;
  };
  H.cel = (ctx, path, base, o = {}) => {
    const lw = o.lw != null ? o.lw : 2;
    if (o.line !== false && lw > 0) {
      ctx.lineWidth = lw * 2;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.lineColor || U.mix(U.shade(base, -0.65), OUT, 0.5);
      ctx.stroke(path);
    }
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = o.shadow || U.shadow(base, o.depth || 0.25);
    ctx.fill(path);
    ctx.translate(-(o.ox != null ? o.ox : 5), -(o.oy != null ? o.oy : 6));
    ctx.fillStyle = base;
    ctx.fill(path);
    ctx.restore();
  };
  H.flat = (ctx, path, color, lw = 0, lineColor) => {
    ctx.fillStyle = color;
    ctx.fill(path);
    if (lw) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = lineColor || U.shade(color, -0.55);
      ctx.stroke(path);
    }
  };
  H.shadow = (ctx, cx, cy, rx, ry, a = 0.28) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, `rgba(20,25,20,${a})`);
    g.addColorStop(1, 'rgba(20,25,20,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rx, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  };
  H.wood = (ctx, x, y, w, h, col, horizontal = true, seed = 1) => {
    const p = H.rr(H.P(), x, y, w, h, 2);
    H.cel(ctx, p, col, { ox: 2, oy: 2, lw: 1.2 });
    const rng = U.rng(seed);
    ctx.save();
    ctx.clip(p);
    ctx.strokeStyle = U.rgba(U.shade(col, -0.45), 0.45);
    ctx.lineWidth = 0.9;
    for (let i = 0; i < (horizontal ? h : w) / 5; i++) {
      ctx.beginPath();
      if (horizontal) {
        const gy = y + 3 + rng() * (h - 6);
        ctx.moveTo(x + 2, gy);
        ctx.quadraticCurveTo(x + w / 2, gy + (rng() - 0.5) * 3, x + w - 2, gy);
      } else {
        const gx = x + 3 + rng() * (w - 6);
        ctx.moveTo(gx, y + 2);
        ctx.quadraticCurveTo(gx + (rng() - 0.5) * 3, y + h / 2, gx, y + h - 2);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
  H.text = (ctx, str, x, y, size, color, font) => {
    ctx.save();
    ctx.font = `bold ${size}px ${font || '"Trebuchet MS", "Segoe UI", sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  };
  // Leaf-village swirl emblem
  H.leafMark = (ctx, cx, cy, r, color, lw) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || r * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy + r * 0.1, r * 0.75, Math.PI * 0.15, Math.PI * 1.95);
    ctx.lineTo(cx + r * 1.1, cy - r * 0.9);
    ctx.stroke();
  };
  // Kanji 火 (fire) drawn with strokes
  H.fireKanji = (ctx, cx, cy, s, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.42, cy - s * 0.22);
    ctx.lineTo(cx - s * 0.28, cy + s * 0.02);
    ctx.moveTo(cx + s * 0.42, cy - s * 0.26);
    ctx.lineTo(cx + s * 0.26, cy + s * 0.02);
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.quadraticCurveTo(cx + s * 0.02, cy + s * 0.1, cx - s * 0.46, cy + s * 0.5);
    ctx.moveTo(cx + s * 0.01, cy + s * 0.02);
    ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.48, cy + s * 0.5);
    ctx.stroke();
  };
  // Hot-spring symbol
  H.onsenMark = (ctx, cx, cy, s, color) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.25, s * 0.42, s * 0.2, 0, 0, U.TAU);
    ctx.fill();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      const x = cx + i * s * 0.22;
      ctx.moveTo(x, cy + s * 0.05);
      ctx.bezierCurveTo(x - s * 0.12, cy - s * 0.1, x + s * 0.12, cy - s * 0.25, x, cy - s * 0.45);
      ctx.stroke();
    }
  };

  // Tree canopy made of overlapping lobes with cel shading and highlights.
  H.canopy = (ctx, cx, cy, r, col, seed, o = {}) => {
    const rng = U.rng(seed);
    const lobes = [];
    const n = o.lobes || 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * U.TAU + rng() * 0.5;
      const d = r * (0.46 + rng() * 0.12);
      lobes.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * (o.squash || 0.78), r * (0.42 + rng() * 0.14)]);
    }
    lobes.push([cx, cy, r * 0.62]);
    const p = H.P();
    for (const [x, y, br] of lobes) {
      p.moveTo(x + br, y);
      p.arc(x, y, br, 0, U.TAU);
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = U.mix(U.shade(col, -0.7), OUT, 0.4);
    ctx.stroke(p);
    ctx.save();
    ctx.clip(p);
    ctx.fillStyle = U.shadow(col, 0.34);
    ctx.fill(p);
    // mid tone lobes shifted up-left
    const m = H.P();
    for (const [x, y, br] of lobes) {
      m.moveTo(x - br * 0.18 + br * 0.9, y - br * 0.22);
      m.arc(x - br * 0.18, y - br * 0.22, br * 0.9, 0, U.TAU);
    }
    ctx.fillStyle = col;
    ctx.fill(m);
    // highlights
    ctx.fillStyle = U.light(col, 0.28);
    for (const [x, y, br] of lobes) {
      if (y > cy + r * 0.25) continue;
      ctx.beginPath();
      ctx.arc(x - br * 0.34, y - br * 0.42, br * 0.42, 0, U.TAU);
      ctx.fill();
    }
    ctx.fillStyle = U.rgba(U.light(col, 0.55), 0.8);
    for (let i = 0; i < (o.dots || 16); i++) {
      const a = rng() * U.TAU, d = rng() * r * 0.9;
      const x = cx + Math.cos(a) * d - r * 0.15, y = cy + Math.sin(a) * d * 0.7 - r * 0.2;
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + rng() * 4, 2 + rng() * 2.5, rng() * 3, 0, U.TAU);
      ctx.fill();
    }
    if (o.blossom) {
      for (let i = 0; i < 60; i++) {
        const a = rng() * U.TAU, d = rng() * r;
        ctx.fillStyle = rng() < 0.5 ? '#fff4f8' : '#ffc4d8';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.75, 1.5 + rng() * 2, 0, U.TAU);
        ctx.fill();
      }
    }
    if (o.fruit) {
      for (let i = 0; i < 8; i++) {
        const a = rng() * U.TAU, d = rng() * r * 0.8;
        ctx.fillStyle = o.fruit;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 3.5, 0, U.TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    return p;
  };

  H.trunk = (ctx, cx, baseY, w, h, col) => {
    const p = H.P();
    p.moveTo(cx - w * 0.75, baseY);
    p.quadraticCurveTo(cx - w * 0.42, baseY - h * 0.12, cx - w * 0.4, baseY - h * 0.4);
    p.lineTo(cx - w * 0.32, baseY - h);
    p.lineTo(cx + w * 0.32, baseY - h);
    p.lineTo(cx + w * 0.4, baseY - h * 0.4);
    p.quadraticCurveTo(cx + w * 0.42, baseY - h * 0.12, cx + w * 0.75, baseY);
    p.quadraticCurveTo(cx, baseY + 4, cx - w * 0.75, baseY);
    p.closePath();
    H.cel(ctx, p, col, { ox: -3, oy: 0, lw: 1.6 });
    ctx.save();
    ctx.clip(p);
    ctx.strokeStyle = U.rgba(U.shade(col, -0.5), 0.5);
    ctx.lineWidth = 1.2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * w * 0.18, baseY - 4);
      ctx.lineTo(cx + i * w * 0.14, baseY - h * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- registry ----------
  PR.def = (name, spec) => {
    PR.types[name] = Object.assign({ w: 1, h: 1, solid: true }, spec);
  };

  PR.instance = function (raw) {
    const [t, x, y, o = {}] = raw;
    const T = PR.types[t];
    if (!T) {
      console.warn('unknown prop', t);
      return null;
    }
    const w = o.w || (typeof T.w === 'function' ? T.w(o) : T.w);
    const h = o.h || (typeof T.h === 'function' ? T.h(o) : T.h);
    const inst = { t, T, x, y, w, h, o, decal: !!(T.decal || o.decal), animated: !!T.animated };
    inst.sortY = (y + h) * TS + (T.sortOffset || 0) + (o.sortOffset || 0);
    // solid mask: function (dx,dy) -> bool
    const solid = o.solid != null ? o.solid : T.solid;
    inst.solidAt = (dx, dy) => {
      if (typeof solid === 'function') return solid(dx, dy, o, w, h);
      if (Array.isArray(solid)) return !!(solid[dy] && solid[dy][dx]);
      if (o.door != null && dy === h - 1 && dx === o.door) return false;
      return !!solid;
    };
    inst.key = t + JSON.stringify(o) + w + 'x' + h;
    return inst;
  };

  function bounds(inst) {
    const b = inst.T.bounds ? inst.T.bounds(inst.o, inst.w, inst.h) : [-TS * 0.2, -TS * 0.8, inst.w * TS + TS * 0.4, inst.h * TS + TS];
    return b;
  }

  PR.image = function (inst, cpr) {
    const key = inst.key + '@' + cpr + (inst.T.stateKey ? inst.T.stateKey(inst) : '');
    let c = PR.cache.get(key);
    if (c) return c;
    const [bx, by, bw, bh] = bounds(inst);
    const canvas = U.canvas(bw * cpr, bh * cpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(cpr, cpr);
    ctx.translate(-bx, -by);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    try {
      inst.T.draw(ctx, inst.o, inst.w * TS, inst.h * TS, inst);
    } catch (e) {
      console.error('prop draw failed', inst.t, e);
    }
    c = { canvas, bx, by, bw, bh };
    PR.cache.set(key, c);
    if (PR.cache.size > 400) PR.cache.delete(PR.cache.keys().next().value);
    return c;
  };
  PR.clear = () => PR.cache.clear();
  NR.engine.on('cprchange', () => PR.clear());

  PR.draw = function (ctx, inst, time) {
    const px = inst.x * TS, py = inst.y * TS;
    if (inst.animated) {
      ctx.save();
      ctx.translate(px, py);
      inst.T.draw(ctx, inst.o, inst.w * TS, inst.h * TS, inst, time);
      ctx.restore();
      return;
    }
    const img = PR.image(inst, NR.engine.cpr);
    ctx.drawImage(img.canvas, px + img.bx, py + img.by, img.bw, img.bh);
    if (inst.T.overlay) {
      ctx.save();
      ctx.translate(px, py);
      inst.T.overlay(ctx, inst.o, inst.w * TS, inst.h * TS, inst, time);
      ctx.restore();
    }
  };
  PR.drawDecal = function (ctx, inst) {
    ctx.save();
    ctx.translate(inst.x * TS, inst.y * TS);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    inst.T.draw(ctx, inst.o, inst.w * TS, inst.h * TS, inst);
    ctx.restore();
  };
  PR.lights = function (inst) {
    if (!inst.T.light) return [];
    const L = inst.T.light(inst.o, inst.w * TS, inst.h * TS, inst);
    const arr = Array.isArray(L) ? L : [L];
    return arr.filter(Boolean).map((l) => Object.assign({}, l, { x: inst.x * TS + l.x, y: inst.y * TS + l.y }));
  };

  // ===================== NATURE =====================
  const TREE_COLS = { green: '#5aa64a', dark: '#3f8a3e', autumn: '#e0913a', sakura: '#f4a9c4', gold: '#d9b44a', teal: '#3f9a7a' };
  PR.def('tree', {
    bounds: (o) => {
      const s = o.s || 1;
      return [-TS * 1.1 * s + TS / 2 - TS / 2, -TS * 2.6 * s, TS * 2.2 * s + TS, TS * 3.2 * s + TS * 0.4];
    },
    draw(ctx, o) {
      const s = o.s || 1;
      const cx = TS / 2, base = TS * 0.92;
      H.shadow(ctx, cx, base, 50 * s, 16 * s, 0.34);
      H.trunk(ctx, cx, base, 22 * s, 70 * s, o.trunk || '#8a5a3a');
      const col = TREE_COLS[o.c] || o.c || TREE_COLS.green;
      H.canopy(ctx, cx, base - 96 * s, 58 * s, col, (o.seed || 1) * 97 + 3, { blossom: o.c === 'sakura', fruit: o.fruit });
    },
  });
  PR.def('pine', {
    bounds: (o) => [-TS * 0.9, -TS * 3.2 * (o.s || 1), TS * 2.8, TS * 4.2 * (o.s || 1)],
    draw(ctx, o) {
      const s = o.s || 1;
      const cx = TS / 2, base = TS * 0.92;
      H.shadow(ctx, cx, base, 40 * s, 14 * s, 0.34);
      H.trunk(ctx, cx, base, 16 * s, 40 * s, '#7a4a2e');
      const col = o.c || '#2f7a4a';
      for (let i = 0; i < 4; i++) {
        const w = (62 - i * 12) * s, top = base - (40 + i * 38) * s - 70 * s, bot = base - (26 + i * 38) * s;
        const p = H.P();
        p.moveTo(cx, top);
        const teeth = 5;
        p.lineTo(cx - w * 0.35, top + (bot - top) * 0.45);
        for (let k = 0; k <= teeth; k++) {
          const x = cx - w + (2 * w * k) / teeth;
          p.lineTo(x, bot - (k % 2) * 8 * s);
        }
        p.lineTo(cx + w * 0.35, top + (bot - top) * 0.45);
        p.closePath();
        H.cel(ctx, p, col, { ox: 6, oy: 3, lw: 2 });
        ctx.fillStyle = U.rgba(U.light(col, 0.4), 0.6);
        ctx.beginPath();
        ctx.moveTo(cx - 4, top + 10);
        ctx.lineTo(cx - w * 0.5, bot - 10);
        ctx.lineTo(cx - w * 0.2, bot - 12);
        ctx.closePath();
        ctx.fill();
      }
    },
  });
  PR.def('bigtree', {
    w: 2,
    h: 2,
    bounds: () => [-TS * 1.6, -TS * 4.6, TS * 5.2, TS * 6.8],
    draw(ctx, o) {
      const cx = TS, base = TS * 1.9;
      H.shadow(ctx, cx, base, 110, 34, 0.38);
      // roots
      const r = H.P();
      for (const [dx, len] of [[-1, 60], [1, 58], [-0.4, 44], [0.5, 40]]) {
        r.moveTo(cx + dx * 20, base - 20);
        r.quadraticCurveTo(cx + dx * 40, base - 6, cx + dx * len, base + 4);
        r.quadraticCurveTo(cx + dx * 30, base + 2, cx + dx * 10, base - 4);
        r.closePath();
      }
      H.cel(ctx, r, '#6e4a32', { ox: 2, oy: 3, lw: 1.6 });
      H.trunk(ctx, cx, base, 64, 170, '#7a5236');
      const col = o.c ? TREE_COLS[o.c] || o.c : '#3f8a3e';
      H.canopy(ctx, cx - 40, base - 210, 80, U.shade(col, -0.05), (o.seed || 3) * 13, { dots: 20 });
      H.canopy(ctx, cx + 50, base - 200, 76, col, (o.seed || 3) * 31, { dots: 20 });
      H.canopy(ctx, cx + 4, base - 250, 86, U.light(col, 0.06), (o.seed || 3) * 7, { dots: 24 });
    },
  });
  PR.def('bush', {
    bounds: () => [-TS * 0.3, -TS * 0.5, TS * 1.6, TS * 1.6],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 34, 12, 0.3);
      H.canopy(ctx, TS / 2, TS * 0.52, 30, TREE_COLS[o.c] || o.c || '#4f9a42', (o.seed || 5) * 11, { lobes: 6, squash: 0.62, dots: 8, fruit: o.berries ? '#e04a5a' : null });
    },
  });
  PR.def('rock', {
    bounds: () => [-TS * 0.2, -TS * 0.3, TS * 1.4, TS * 1.4],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.84, 32, 11, 0.32);
      const col = o.c || '#8f8a86';
      const rng = U.rng((o.seed || 7) * 5);
      const p = H.P();
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * U.TAU;
        const r = 26 + rng() * 8;
        const x = TS / 2 + Math.cos(a) * r, y = TS * 0.56 + Math.sin(a) * r * 0.66 - (Math.sin(a) < 0 ? 6 : 0);
        i ? p.lineTo(x, y) : p.moveTo(x, y);
      }
      p.closePath();
      H.cel(ctx, p, col, { ox: 7, oy: 8, lw: 2 });
      ctx.fillStyle = U.rgba(U.light(col, 0.5), 0.5);
      ctx.beginPath();
      ctx.ellipse(TS / 2 - 8, TS * 0.36, 10, 4, -0.3, 0, U.TAU);
      ctx.fill();
      if (o.moss) {
        ctx.fillStyle = 'rgba(90,150,60,0.7)';
        ctx.beginPath();
        ctx.ellipse(TS / 2 + 4, TS * 0.3, 14, 5, 0.2, 0, U.TAU);
        ctx.fill();
      }
    },
  });
  PR.def('boulder', {
    w: 2,
    h: 2,
    bounds: () => [-TS * 0.2, -TS * 0.8, TS * 2.4, TS * 2.9],
    draw(ctx, o) {
      H.shadow(ctx, TS, TS * 1.8, 66, 20, 0.34);
      const col = o.c || '#8a8580';
      const rng = U.rng((o.seed || 9) * 3);
      const p = H.P();
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * U.TAU;
        const r = 56 + rng() * 12;
        const x = TS + Math.cos(a) * r, y = TS * 1.1 + Math.sin(a) * r * 0.72 - (Math.sin(a) < 0 ? 20 : 0);
        i ? p.lineTo(x, y) : p.moveTo(x, y);
      }
      p.closePath();
      H.cel(ctx, p, col, { ox: 12, oy: 14, lw: 2.2 });
      ctx.strokeStyle = U.rgba(U.shade(col, -0.5), 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TS - 10, TS * 0.3);
      ctx.lineTo(TS + 6, TS * 0.9);
      ctx.lineTo(TS - 4, TS * 1.4);
      ctx.stroke();
    },
  });
  PR.def('log', {
    w: 2,
    bounds: () => [-TS * 0.1, -TS * 0.2, TS * 2.2, TS * 1.3],
    draw(ctx) {
      H.shadow(ctx, TS, TS * 0.82, 64, 12, 0.3);
      const p = H.rr(H.P(), 6, TS * 0.3, TS * 2 - 20, TS * 0.5, 14);
      H.cel(ctx, p, '#8a5a3a', { ox: 0, oy: 5, lw: 1.6 });
      const e = H.ell(H.P(), TS * 2 - 14, TS * 0.55, 12, 16);
      H.cel(ctx, e, '#d9b27a', { ox: 2, oy: 2, lw: 1.6 });
      ctx.strokeStyle = '#a07a4a';
      ctx.lineWidth = 1.2;
      for (const r of [4, 8, 12]) {
        ctx.beginPath();
        ctx.ellipse(TS * 2 - 14, TS * 0.55, r * 0.7, r, 0, 0, U.TAU);
        ctx.stroke();
      }
    },
  });
  PR.def('stump', {
    bounds: () => [-TS * 0.1, -TS * 0.3, TS * 1.2, TS * 1.3],
    draw(ctx) {
      H.shadow(ctx, TS / 2, TS * 0.84, 28, 10, 0.3);
      const p = H.P();
      p.moveTo(TS * 0.18, TS * 0.3);
      p.lineTo(TS * 0.16, TS * 0.8);
      p.quadraticCurveTo(TS / 2, TS * 0.94, TS * 0.84, TS * 0.8);
      p.lineTo(TS * 0.82, TS * 0.3);
      p.closePath();
      H.cel(ctx, p, '#8a5a3a', { ox: -3, oy: 0, lw: 1.6 });
      const t = H.ell(H.P(), TS / 2, TS * 0.3, TS * 0.32, TS * 0.13);
      H.cel(ctx, t, '#d9b27a', { ox: 0, oy: 2, lw: 1.6 });
    },
  });
  PR.def('post', {
    // training post / log pillar
    bounds: () => [-TS * 0.1, -TS * 0.9, TS * 1.2, TS * 1.9],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 24, 9, 0.3);
      const p = H.P();
      p.moveTo(TS * 0.26, -TS * 0.55);
      p.lineTo(TS * 0.24, TS * 0.82);
      p.quadraticCurveTo(TS / 2, TS * 0.92, TS * 0.76, TS * 0.82);
      p.lineTo(TS * 0.74, -TS * 0.55);
      p.closePath();
      H.cel(ctx, p, '#9a6a42', { ox: -3, oy: 0, lw: 1.6 });
      const t = H.ell(H.P(), TS / 2, -TS * 0.55, TS * 0.24, TS * 0.1);
      H.cel(ctx, t, '#d9b27a', { ox: 0, oy: 2, lw: 1.4 });
      ctx.strokeStyle = '#6a4a2a';
      ctx.lineWidth = 3;
      for (const y of [-6, 12]) {
        ctx.beginPath();
        ctx.moveTo(TS * 0.25, y);
        ctx.lineTo(TS * 0.75, y + 3);
        ctx.stroke();
      }
    },
  });
  PR.def('flowerbed', {
    decal: true,
    solid: false,
    draw(ctx, o, w, h) {
      const rng = U.rng((o.seed || 1) * 17 + w);
      const cols = o.cols || ['#ff9ec4', '#ffe066', '#ffffff', '#b8a4ff', '#ff7a6a'];
      for (let i = 0; i < (w * h) / 180; i++) {
        const x = 4 + rng() * (w - 8), y = 4 + rng() * (h - 8);
        ctx.fillStyle = '#3f7a30';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 4, 2, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = cols[Math.floor(rng() * cols.length)];
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * U.TAU;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2, 0, U.TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd23a';
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, U.TAU);
        ctx.fill();
      }
    },
  });
  PR.def('tallgrass', {
    solid: false,
    sortOffset: -20,
    bounds: (o, w, h) => [-8, -TS * 0.4, w * TS + 16, h * TS + TS * 0.4],
    draw(ctx, o, w, h) {
      const rng = U.rng((o.seed || 2) * 13 + w);
      for (let i = 0; i < (w * h) / 110; i++) {
        const x = rng() * w, y = 14 + rng() * (h - 10);
        const col = U.pick(['#4f9a3a', '#5aa846', '#3f8a30', '#6ab852']);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.2;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(x + k * 2, y);
          ctx.quadraticCurveTo(x + k * 3, y - 10, x + k * 5, y - 18 - rng() * 8);
          ctx.stroke();
        }
      }
    },
  });
  PR.def('reeds', {
    solid: false,
    bounds: () => [-10, -TS * 0.7, TS + 20, TS * 1.7],
    draw(ctx, o) {
      const rng = U.rng((o.seed || 3) * 7);
      for (let i = 0; i < 9; i++) {
        const x = 6 + rng() * (TS - 12), y = TS * 0.8;
        ctx.strokeStyle = '#6a8a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + (rng() - 0.5) * 10, y - 30, x + (rng() - 0.5) * 16, y - 44 - rng() * 12);
        ctx.stroke();
        if (rng() < 0.5) {
          ctx.fillStyle = '#7a5a36';
          ctx.beginPath();
          ctx.ellipse(x + (rng() - 0.5) * 6, y - 40, 2.5, 7, 0, 0, U.TAU);
          ctx.fill();
        }
      }
    },
  });
  PR.def('mushrooms', {
    solid: false,
    decal: true,
    draw(ctx, o) {
      const rng = U.rng((o.seed || 4) * 5);
      for (let i = 0; i < 4; i++) {
        const x = 12 + rng() * 40, y = 20 + rng() * 34;
        ctx.fillStyle = '#efe6d6';
        ctx.fillRect(x - 1.5, y, 3, 6);
        ctx.fillStyle = o.c || '#d9534f';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 4, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 1, 0, U.TAU);
        ctx.fill();
      }
    },
  });
  PR.def('bamboo', {
    bounds: () => [-TS * 0.3, -TS * 3.2, TS * 1.6, TS * 4.2],
    draw(ctx, o) {
      const rng = U.rng((o.seed || 6) * 3);
      H.shadow(ctx, TS / 2, TS * 0.86, 30, 10, 0.3);
      for (let i = 0; i < 5; i++) {
        const x = 8 + i * 12 + rng() * 4, top = -TS * 2.9 + rng() * 40;
        const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0);
        g.addColorStop(0, '#9ac860');
        g.addColorStop(1, '#5a8a36');
        ctx.fillStyle = g;
        ctx.fillRect(x - 4, top, 8, TS * 0.9 - top);
        ctx.fillStyle = '#4a7a2a';
        for (let y = top + 20; y < TS * 0.8; y += 26) ctx.fillRect(x - 5, y, 10, 2.5);
        ctx.fillStyle = '#6aaa46';
        for (let k = 0; k < 3; k++) {
          const ly = top + 10 + k * 30;
          ctx.beginPath();
          ctx.ellipse(x + 12, ly, 12, 3, 0.4, 0, U.TAU);
          ctx.ellipse(x - 12, ly + 12, 12, 3, -0.4, 0, U.TAU);
          ctx.fill();
        }
      }
    },
  });

  // ===================== VILLAGE =====================
  PR.def('fence', {
    // o.dir 'h' (along x, w tiles) or 'v' (along y, h tiles)
    bounds: (o, w, h) => [-6, -TS * 0.5, w * TS + 12, h * TS + TS * 0.6],
    draw(ctx, o, w, h) {
      const col = o.c || '#a8784a';
      if (o.dir === 'v') {
        for (let y = 0; y <= h; y += TS / 2) {
          const p = H.rr(H.P(), TS / 2 - 5, y - 30, 10, 36, 3);
          H.cel(ctx, p, col, { ox: 2, oy: 2, lw: 1.4 });
        }
        for (const yy of [-16, 0]) {
          const p = H.rr(H.P(), TS / 2 - 3, yy, 6, h, 2);
          H.cel(ctx, p, U.shade(col, -0.1), { ox: 1, oy: 1, lw: 1.2 });
        }
        return;
      }
      for (const yy of [TS * 0.35, TS * 0.6]) {
        const p = H.rr(H.P(), 0, yy, w, 7, 2);
        H.cel(ctx, p, U.shade(col, -0.08), { ox: 1, oy: 2, lw: 1.2 });
      }
      for (let x = 6; x < w; x += TS / 2) {
        const p = H.P();
        p.moveTo(x - 5, TS * 0.84);
        p.lineTo(x - 5, TS * 0.12);
        p.lineTo(x, TS * 0.02);
        p.lineTo(x + 5, TS * 0.12);
        p.lineTo(x + 5, TS * 0.84);
        p.closePath();
        H.cel(ctx, p, col, { ox: 2, oy: 2, lw: 1.4 });
      }
    },
  });
  PR.def('lamp', {
    bounds: () => [-TS * 0.2, -TS * 1.7, TS * 1.4, TS * 2.7],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 20, 7, 0.3);
      const post = H.rr(H.P(), TS / 2 - 4, -TS * 1.1, 8, TS * 1.95, 3);
      H.cel(ctx, post, '#4a3a34', { ox: 2, oy: 0, lw: 1.4 });
      const base = H.rr(H.P(), TS / 2 - 9, TS * 0.7, 18, 12, 3);
      H.cel(ctx, base, '#3a302c', { ox: 1, oy: 2, lw: 1.4 });
      // lantern box
      const l = H.rr(H.P(), TS / 2 - 14, -TS * 1.5, 28, 34, 6);
      H.cel(ctx, l, o.c || '#f0c060', { ox: 3, oy: 3, lw: 1.6 });
      ctx.fillStyle = 'rgba(255,250,210,0.8)';
      ctx.fillRect(TS / 2 - 8, -TS * 1.44, 16, 22);
      const roof = H.poly(H.P(), [TS / 2 - 18, -TS * 1.48, TS / 2, -TS * 1.66, TS / 2 + 18, -TS * 1.48]);
      H.cel(ctx, roof, '#5a3a2e', { ox: 1, oy: 2, lw: 1.4 });
    },
    light: () => ({ x: TS / 2, y: -TS * 1.2, r: 170, color: '#ffc870', a: 1 }),
  });
  PR.def('paper_lantern', {
    solid: false,
    bounds: () => [0, -TS * 1.8, TS, TS * 1.4],
    draw(ctx, o) {
      ctx.strokeStyle = '#3a2a24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(TS / 2, -TS * 1.8);
      ctx.lineTo(TS / 2, -TS * 1.4);
      ctx.stroke();
      const l = H.ell(H.P(), TS / 2, -TS * 1.1, 16, 20);
      H.cel(ctx, l, o.c || '#e04a3a', { ox: 3, oy: 3, lw: 1.4 });
      ctx.strokeStyle = 'rgba(80,20,10,0.5)';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(TS / 2, -TS * 1.1 + i * 7, 16 - Math.abs(i) * 2, 1.5, 0, 0, U.TAU);
        ctx.stroke();
      }
      ctx.fillStyle = '#2a1a14';
      ctx.fillRect(TS / 2 - 9, -TS * 1.1 - 22, 18, 5);
      ctx.fillRect(TS / 2 - 9, -TS * 1.1 + 18, 18, 5);
    },
    light: (o) => ({ x: TS / 2, y: -TS * 1.1, r: 120, color: o.c === '#f6e6b0' ? '#fff0b0' : '#ff9a60', a: 0.9 }),
  });
  PR.def('stone_lantern', {
    bounds: () => [-TS * 0.1, -TS * 1.3, TS * 1.2, TS * 2.3],
    draw(ctx) {
      H.shadow(ctx, TS / 2, TS * 0.86, 24, 9, 0.3);
      const col = '#a8a49c';
      const parts = [
        H.rr(H.P(), TS / 2 - 16, TS * 0.62, 32, 14, 3),
        H.rr(H.P(), TS / 2 - 6, TS * 0.05, 12, TS * 0.6, 2),
        H.rr(H.P(), TS / 2 - 14, -TS * 0.35, 28, 28, 3),
        H.poly(H.P(), [TS / 2 - 24, -TS * 0.35, TS / 2, -TS * 0.72, TS / 2 + 24, -TS * 0.35]),
      ];
      for (const p of parts) H.cel(ctx, p, col, { ox: 3, oy: 3, lw: 1.4 });
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(TS / 2 - 7, -TS * 0.28, 14, 14);
    },
    light: () => ({ x: TS / 2, y: -TS * 0.2, r: 110, color: '#ffc870', a: 0.8 }),
  });
  PR.def('bench', {
    w: 2,
    bounds: () => [-6, -TS * 0.2, TS * 2 + 12, TS * 1.2],
    draw(ctx) {
      H.shadow(ctx, TS, TS * 0.84, 60, 10, 0.25);
      H.wood(ctx, 4, TS * 0.28, TS * 2 - 8, 14, '#a87a4a', true, 3);
      H.wood(ctx, 4, TS * 0.5, TS * 2 - 8, 12, '#946a40', true, 4);
      for (const x of [14, TS * 2 - 22]) {
        const l = H.rr(H.P(), x, TS * 0.6, 8, 20, 2);
        H.cel(ctx, l, '#6a4a2e', { ox: 1, oy: 1, lw: 1.2 });
      }
    },
  });
  PR.def('barrel', {
    bounds: () => [-TS * 0.1, -TS * 0.3, TS * 1.2, TS * 1.3],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.88, 24, 8, 0.3);
      const p = H.P();
      p.moveTo(TS * 0.24, TS * 0.05);
      p.quadraticCurveTo(TS * 0.12, TS * 0.45, TS * 0.24, TS * 0.86);
      p.lineTo(TS * 0.76, TS * 0.86);
      p.quadraticCurveTo(TS * 0.88, TS * 0.45, TS * 0.76, TS * 0.05);
      p.closePath();
      H.cel(ctx, p, o.c || '#a8743e', { ox: -4, oy: 0, lw: 1.6 });
      ctx.strokeStyle = '#4a4040';
      ctx.lineWidth = 3;
      for (const y of [TS * 0.22, TS * 0.7]) {
        ctx.beginPath();
        ctx.moveTo(TS * 0.17, y);
        ctx.quadraticCurveTo(TS / 2, y + 4, TS * 0.83, y);
        ctx.stroke();
      }
      const t = H.ell(H.P(), TS / 2, TS * 0.06, TS * 0.26, TS * 0.08);
      H.cel(ctx, t, '#c8945a', { ox: 0, oy: 1, lw: 1.4 });
    },
  });
  PR.def('crate', {
    bounds: () => [-TS * 0.05, -TS * 0.35, TS * 1.1, TS * 1.35],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.88, 28, 8, 0.3);
      const col = o.c || '#b8864e';
      const front = H.rr(H.P(), TS * 0.1, TS * 0.2, TS * 0.8, TS * 0.66, 3);
      H.cel(ctx, front, col, { ox: 2, oy: 2, lw: 1.6 });
      const top = H.poly(H.P(), [TS * 0.1, TS * 0.2, TS * 0.2, -TS * 0.02, TS * 0.9 + 6, -TS * 0.02, TS * 0.9, TS * 0.2]);
      H.cel(ctx, top, U.light(col, 0.12), { ox: 1, oy: 1, lw: 1.6 });
      ctx.strokeStyle = U.shade(col, -0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TS * 0.12, TS * 0.22);
      ctx.lineTo(TS * 0.88, TS * 0.84);
      ctx.moveTo(TS * 0.88, TS * 0.22);
      ctx.lineTo(TS * 0.12, TS * 0.84);
      ctx.stroke();
    },
  });
  PR.def('pots', {
    bounds: () => [-TS * 0.1, -TS * 0.6, TS * 1.2, TS * 1.6],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 28, 9, 0.3);
      const pots = [[TS * 0.3, TS * 0.72, 12], [TS * 0.66, TS * 0.76, 14]];
      for (const [x, y, r] of pots) {
        const flower = U.pick(['#ff7aa8', '#ffd24a', '#b58cff', '#ff6a5a']);
        H.canopy(ctx, x, y - r - 8, r + 2, '#4f9a42', x * 7, { lobes: 5, dots: 3 });
        ctx.fillStyle = flower;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.arc(x - 6 + k * 4, y - r - 12 + (k % 2) * 5, 3.2, 0, U.TAU);
          ctx.fill();
        }
        const p = H.P();
        p.moveTo(x - r, y - r);
        p.lineTo(x + r, y - r);
        p.lineTo(x + r * 0.72, y + 4);
        p.lineTo(x - r * 0.72, y + 4);
        p.closePath();
        H.cel(ctx, p, '#c0643a', { ox: 2, oy: 1, lw: 1.4 });
      }
    },
  });
  PR.def('sign', {
    bounds: () => [-TS * 0.3, -TS * 0.9, TS * 1.6, TS * 1.9],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 22, 8, 0.28);
      const post = H.rr(H.P(), TS / 2 - 4, -TS * 0.1, 8, TS * 0.95, 2);
      H.cel(ctx, post, '#6a4a2e', { ox: 1, oy: 0, lw: 1.2 });
      H.wood(ctx, -TS * 0.18, -TS * 0.72, TS * 1.36, TS * 0.66, '#b8864e', true, 9);
      if (o.text) H.text(ctx, o.text, TS / 2, -TS * 0.39, o.size || 13, '#3a2616');
    },
  });
  PR.def('noticeboard', {
    w: 2,
    bounds: () => [-6, -TS * 1.3, TS * 2 + 12, TS * 2.3],
    draw(ctx) {
      H.shadow(ctx, TS, TS * 0.86, 50, 10, 0.28);
      for (const x of [10, TS * 2 - 18]) {
        const post = H.rr(H.P(), x, -TS * 0.6, 8, TS * 1.45, 2);
        H.cel(ctx, post, '#6a4a2e', { ox: 1, oy: 0, lw: 1.2 });
      }
      H.wood(ctx, 2, -TS * 1.1, TS * 2 - 4, TS * 0.95, '#a87a4a', true, 5);
      const rng = U.rng(33);
      for (let i = 0; i < 5; i++) {
        const x = 12 + i * 22 + rng() * 4, y = -TS * 1.0 + rng() * 14;
        ctx.fillStyle = U.pick(['#f6f0e0', '#fff8d0', '#f0e6ff']);
        ctx.fillRect(x, y, 18, 24);
        ctx.fillStyle = '#c23a3a';
        ctx.beginPath();
        ctx.arc(x + 9, y + 2, 2, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(40,30,20,0.5)';
        for (let k = 0; k < 4; k++) ctx.fillRect(x + 3, y + 7 + k * 4, 12, 1.4);
      }
    },
  });
  PR.def('well', {
    bounds: () => [-TS * 0.4, -TS * 1.4, TS * 1.8, TS * 2.4],
    draw(ctx) {
      H.shadow(ctx, TS / 2, TS * 0.88, 40, 12, 0.32);
      const base = H.rr(H.P(), TS * 0.02, TS * 0.3, TS * 0.96, TS * 0.56, 8);
      H.cel(ctx, base, '#9a948c', { ox: 3, oy: 4, lw: 1.6 });
      const hole = H.ell(H.P(), TS / 2, TS * 0.34, TS * 0.38, TS * 0.12);
      H.flat(ctx, hole, '#1c2a3a', 1.6, '#4a4440');
      for (const x of [TS * 0.08, TS * 0.84]) {
        const p = H.rr(H.P(), x, -TS * 0.9, 8, TS * 1.24, 2);
        H.cel(ctx, p, '#7a5236', { ox: 1, oy: 0, lw: 1.2 });
      }
      const roof = H.poly(H.P(), [-TS * 0.3, -TS * 0.72, TS / 2, -TS * 1.3, TS * 1.3, -TS * 0.72, TS * 1.1, -TS * 0.62, -TS * 0.1, -TS * 0.62]);
      H.cel(ctx, roof, '#8a4a36', { ox: 2, oy: 4, lw: 1.6 });
    },
  });
  PR.def('cart', {
    w: 2,
    bounds: () => [-10, -TS * 0.7, TS * 2 + 20, TS * 1.7],
    draw(ctx) {
      H.shadow(ctx, TS, TS * 0.88, 60, 12, 0.3);
      H.wood(ctx, 8, -TS * 0.1, TS * 2 - 16, TS * 0.7, '#a87a4a', true, 12);
      ctx.fillStyle = '#e0b060';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(20 + i * 16, -TS * 0.1, 9, 0, U.TAU);
        ctx.fill();
      }
      for (const x of [22, TS * 2 - 22]) {
        const w = H.ell(H.P(), x, TS * 0.66, 15, 15);
        H.cel(ctx, w, '#5a3a24', { ox: 2, oy: 2, lw: 1.6 });
        ctx.strokeStyle = '#3a2416';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 12, TS * 0.66);
        ctx.lineTo(x + 12, TS * 0.66);
        ctx.moveTo(x, TS * 0.66 - 12);
        ctx.lineTo(x, TS * 0.66 + 12);
        ctx.stroke();
      }
    },
  });
  PR.def('stall', {
    w: 2,
    bounds: () => [-12, -TS * 1.6, TS * 2 + 24, TS * 2.6],
    draw(ctx, o) {
      H.shadow(ctx, TS, TS * 0.88, 64, 12, 0.3);
      for (const x of [4, TS * 2 - 12]) {
        const p = H.rr(H.P(), x, -TS * 1.2, 8, TS * 2, 2);
        H.cel(ctx, p, '#6a4a2e', { ox: 1, oy: 0, lw: 1.2 });
      }
      H.wood(ctx, 0, TS * 0.2, TS * 2, TS * 0.62, '#b8864e', true, 7);
      // goods
      const goods = o.goods || ['#e04a3a', '#f0a030', '#8ac850', '#f0e070'];
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = goods[i % goods.length];
        ctx.beginPath();
        ctx.arc(14 + i * 14, TS * 0.2 - 3 - (i % 2) * 4, 7, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(12 + i * 14, TS * 0.2 - 6 - (i % 2) * 4, 2, 0, U.TAU);
        ctx.fill();
      }
      // striped awning
      const aw = H.P();
      aw.moveTo(-10, -TS * 0.72);
      aw.lineTo(6, -TS * 1.5);
      aw.lineTo(TS * 2 - 6, -TS * 1.5);
      aw.lineTo(TS * 2 + 10, -TS * 0.72);
      aw.closePath();
      H.cel(ctx, aw, o.c || '#d84a3a', { ox: 0, oy: 4, lw: 1.6 });
      ctx.save();
      ctx.clip(aw);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(-10 + i * 36, -TS * 0.72);
        ctx.lineTo(6 + i * 32, -TS * 1.5);
        ctx.lineTo(22 + i * 32, -TS * 1.5);
        ctx.lineTo(8 + i * 36, -TS * 0.72);
        ctx.fill();
      }
      ctx.restore();
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : o.c || '#d84a3a';
        ctx.beginPath();
        ctx.arc(-6 + i * 17, -TS * 0.72, 8.5, 0, Math.PI);
        ctx.fill();
      }
    },
  });
  PR.def('target', {
    bounds: () => [-TS * 0.1, -TS * 0.9, TS * 1.2, TS * 1.9],
    draw(ctx) {
      H.shadow(ctx, TS / 2, TS * 0.86, 26, 8, 0.28);
      for (const x of [TS * 0.24, TS * 0.7]) {
        const p = H.rr(H.P(), x, -TS * 0.2, 6, TS * 1.05, 2);
        H.cel(ctx, p, '#6a4a2e', { ox: 1, oy: 0, lw: 1.2 });
      }
      const board = H.ell(H.P(), TS / 2, -TS * 0.3, TS * 0.42, TS * 0.42);
      H.cel(ctx, board, '#e8dcc0', { ox: 3, oy: 3, lw: 1.6 });
      for (const [r, c] of [[0.32, '#c23a3a'], [0.22, '#f4efe6'], [0.12, '#c23a3a']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(TS / 2, -TS * 0.3, TS * r, 0, U.TAU);
        ctx.fill();
      }
      // stuck kunai
      ctx.strokeStyle = '#3a3a48';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(TS * 0.58, -TS * 0.34);
      ctx.lineTo(TS * 0.78, -TS * 0.46);
      ctx.stroke();
    },
  });
  PR.def('dummy', {
    bounds: () => [-TS * 0.2, -TS * 1.1, TS * 1.4, TS * 2.1],
    draw(ctx) {
      H.shadow(ctx, TS / 2, TS * 0.86, 24, 8, 0.28);
      const post = H.rr(H.P(), TS / 2 - 4, -TS * 0.3, 8, TS * 1.15, 2);
      H.cel(ctx, post, '#6a4a2e', { ox: 1, oy: 0, lw: 1.2 });
      const arm = H.rr(H.P(), TS * 0.05, -TS * 0.3, TS * 0.9, 10, 3);
      H.cel(ctx, arm, '#c8a060', { ox: 1, oy: 2, lw: 1.2 });
      const body = H.rr(H.P(), TS / 2 - 14, -TS * 0.5, 28, 40, 10);
      H.cel(ctx, body, '#d8b070', { ox: 2, oy: 2, lw: 1.6 });
      const head = H.ell(H.P(), TS / 2, -TS * 0.72, 13, 13);
      H.cel(ctx, head, '#d8b070', { ox: 2, oy: 2, lw: 1.6 });
      ctx.strokeStyle = '#a07a40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TS / 2 - 10, -TS * 0.36);
      ctx.lineTo(TS / 2 + 10, -TS * 0.36);
      ctx.stroke();
    },
  });
  PR.def('torii', {
    w: 3,
    solid: (dx, dy) => dx === 0 || dx === 2,
    sortOffset: -10,
    bounds: () => [-TS * 0.5, -TS * 2.8, TS * 4, TS * 3.8],
    draw(ctx, o) {
      const col = o.c || '#d0402c';
      H.shadow(ctx, TS * 0.5, TS * 0.86, 20, 7, 0.3);
      H.shadow(ctx, TS * 2.5, TS * 0.86, 20, 7, 0.3);
      for (const x of [TS * 0.5, TS * 2.5]) {
        const p = H.rr(H.P(), x - 9, -TS * 2.1, 18, TS * 2.95, 3);
        H.cel(ctx, p, col, { ox: 3, oy: 0, lw: 1.8 });
        const b = H.rr(H.P(), x - 12, TS * 0.62, 24, 14, 3);
        H.cel(ctx, b, '#2a2a2a', { ox: 1, oy: 2, lw: 1.4 });
      }
      const nuki = H.rr(H.P(), -TS * 0.1, -TS * 1.8, TS * 3.2, 14, 3);
      H.cel(ctx, nuki, col, { ox: 0, oy: 3, lw: 1.8 });
      const kasagi = H.P();
      kasagi.moveTo(-TS * 0.45, -TS * 2.45);
      kasagi.quadraticCurveTo(TS * 1.5, -TS * 2.2, TS * 3.45, -TS * 2.45);
      kasagi.lineTo(TS * 3.3, -TS * 2.15);
      kasagi.quadraticCurveTo(TS * 1.5, -TS * 1.98, -TS * 0.3, -TS * 2.15);
      kasagi.closePath();
      H.cel(ctx, kasagi, '#2a2a2a', { ox: 0, oy: 3, lw: 1.8 });
      const k2 = H.rr(H.P(), -TS * 0.2, -TS * 2.18, TS * 3.4, 12, 2);
      H.cel(ctx, k2, col, { ox: 0, oy: 2, lw: 1.6 });
      const plaque = H.rr(H.P(), TS * 1.5 - 12, -TS * 2.05, 24, 30, 2);
      H.cel(ctx, plaque, '#2a2a2a', { ox: 1, oy: 1, lw: 1.2 });
    },
  });
  PR.def('wallsegment', {
    // village outer wall (along x)
    bounds: (o, w, h) => [-4, -TS * 1.4, w * TS + 8, h * TS + TS * 1.5],
    draw(ctx, o, w, h) {
      const col = o.c || '#c9b89a';
      const face = H.rr(H.P(), 0, -TS * 0.9, w, TS * 1.8, 2);
      H.cel(ctx, face, col, { ox: 0, oy: 6, lw: 1.8 });
      ctx.strokeStyle = U.rgba(U.shade(col, -0.4), 0.6);
      ctx.lineWidth = 1.4;
      for (let y = -TS * 0.9 + 16; y < TS * 0.9; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const top = H.rr(H.P(), -4, -TS * 1.2, w + 8, 18, 3);
      H.cel(ctx, top, '#8a5a3a', { ox: 0, oy: 3, lw: 1.6 });
    },
  });

  // Animated campfire
  PR.def('campfire', {
    animated: true,
    draw(ctx, o, w, h, inst, time = 0) {
      H.shadow(ctx, TS / 2, TS * 0.8, 30, 10, 0.3);
      ctx.fillStyle = '#6a4a2e';
      ctx.save();
      ctx.translate(TS / 2, TS * 0.72);
      for (const a of [-0.5, 0.5, 0]) {
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(-18, -4, 36, 8);
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = '#7a7470';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * U.TAU;
        ctx.beginPath();
        ctx.ellipse(TS / 2 + Math.cos(a) * 24, TS * 0.74 + Math.sin(a) * 9, 6, 4, 0, 0, U.TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const ph = time * 7 + i * 1.7;
        const fx = TS / 2 + Math.sin(ph) * 6 + (i - 2) * 5;
        const fh = 26 + Math.sin(ph * 1.3) * 8 - Math.abs(i - 2) * 5;
        const g = ctx.createLinearGradient(0, TS * 0.7, 0, TS * 0.7 - fh);
        g.addColorStop(0, 'rgba(255,200,60,0.9)');
        g.addColorStop(0.5, 'rgba(255,110,30,0.7)');
        g.addColorStop(1, 'rgba(255,60,20,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(fx - 8, TS * 0.72);
        ctx.quadraticCurveTo(fx - 6, TS * 0.7 - fh * 0.5, fx, TS * 0.7 - fh);
        ctx.quadraticCurveTo(fx + 6, TS * 0.7 - fh * 0.5, fx + 8, TS * 0.72);
        ctx.fill();
      }
      ctx.restore();
    },
    light: () => ({ x: TS / 2, y: TS * 0.5, r: 220, color: '#ff9a40', a: 1, flicker: true }),
  });
})();
