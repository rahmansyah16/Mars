// Building props in a Konoha style: houses, shops, Hokage Tower, hospital, Ichiraku,
// the hot-spring inn, the main gate and the Hokage Monument.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const TS = NR.TS;
  const PR = NR.props, H = PR.h;

  function windowRect(ctx, x, y, w, h, o = {}) {
    const f = H.rr(H.P(), x - 3, y - 3, w + 6, h + 6, 3);
    H.cel(ctx, f, o.frame || '#7a5236', { ox: 1, oy: 1, lw: 1.2 });
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, o.glass1 || '#bfe3f2');
    g.addColorStop(1, o.glass2 || '#6fa8c8');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h - 4);
    ctx.lineTo(x + w * 0.45, y + 3);
    ctx.lineTo(x + w * 0.6, y + 3);
    ctx.lineTo(x + 8, y + h - 4);
    ctx.fill();
    ctx.strokeStyle = o.frame || '#7a5236';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    if (h > 26) {
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
    }
    ctx.stroke();
  }

  function slidingDoor(ctx, x, y, w, h, o = {}) {
    const fr = H.rr(H.P(), x - 3, y - 3, w + 6, h + 3, 2);
    H.cel(ctx, fr, '#5a3a26', { ox: 1, oy: 1, lw: 1.4 });
    ctx.fillStyle = o.paper || '#f2ead6';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#6a4a2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < 3; i++) {
      ctx.moveTo(x + (w * i) / 3, y);
      ctx.lineTo(x + (w * i) / 3, y + h);
    }
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(x, y + (h * i) / 4);
      ctx.lineTo(x + w, y + (h * i) / 4);
    }
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();
    if (o.noren) {
      const n = o.noren;
      for (let i = 0; i < 3; i++) {
        const p = H.P();
        const nx = x - 4 + (i * (w + 8)) / 3;
        p.moveTo(nx + 1, y - 2);
        p.lineTo(nx + (w + 8) / 3 - 1, y - 2);
        p.lineTo(nx + (w + 8) / 3 - 2, y + h * 0.42);
        p.quadraticCurveTo(nx + (w + 8) / 6, y + h * 0.46, nx + 2, y + h * 0.42);
        p.closePath();
        H.cel(ctx, p, n, { ox: 1, oy: 2, lw: 1.2 });
      }
      if (o.norenMark === 'onsen') H.onsenMark(ctx, x + w / 2, y + h * 0.2, 20, '#f4efe6');
      else if (o.norenText) H.text(ctx, o.norenText, x + w / 2, y + h * 0.2, 11, '#f4efe6');
    }
  }

  function roofGable(ctx, x0, x1, top, bottom, col, o = {}) {
    const ov = o.overhang != null ? o.overhang : 12;
    const p = H.P();
    p.moveTo(x0 - ov, bottom);
    p.lineTo(x0 + 10, top);
    p.lineTo(x1 - 10, top);
    p.lineTo(x1 + ov, bottom);
    p.closePath();
    H.cel(ctx, p, col, { ox: 0, oy: -6, lw: 2 });
    ctx.save();
    ctx.clip(p);
    // tile rows
    const rows = Math.max(3, Math.round((bottom - top) / 13));
    for (let i = 0; i < rows; i++) {
      const y = top + ((bottom - top) * (i + 1)) / rows;
      ctx.strokeStyle = U.rgba(U.shade(col, -0.45), 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 - ov, y);
      ctx.lineTo(x1 + ov, y);
      ctx.stroke();
      ctx.strokeStyle = U.rgba(U.light(col, 0.3), 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0 - ov, y - 3);
      ctx.lineTo(x1 + ov, y - 3);
      ctx.stroke();
    }
    ctx.strokeStyle = U.rgba(U.shade(col, -0.4), 0.35);
    ctx.lineWidth = 1.2;
    for (let x = x0; x < x1; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + (x - (x0 + x1) / 2) * 0.08, bottom);
      ctx.stroke();
    }
    ctx.restore();
    // ridge + fascia
    const ridge = H.rr(H.P(), x0 + 4, top - 7, x1 - x0 - 8, 12, 5);
    H.cel(ctx, ridge, U.shade(col, -0.2), { ox: 0, oy: 2, lw: 1.6 });
    const fascia = H.rr(H.P(), x0 - ov - 2, bottom - 4, x1 - x0 + ov * 2 + 4, 9, 2);
    H.cel(ctx, fascia, o.fascia || '#4a3226', { ox: 0, oy: 2, lw: 1.4 });
    if (o.curl) {
      for (const [ex, d] of [[x0 - ov - 2, -1], [x1 + ov + 2, 1]]) {
        const c = H.P();
        c.moveTo(ex, bottom);
        c.quadraticCurveTo(ex + d * 8, bottom - 4, ex + d * 10, bottom - 16);
        c.lineTo(ex - d * 4, bottom + 2);
        c.closePath();
        H.cel(ctx, c, U.shade(col, -0.15), { ox: 0, oy: 1, lw: 1.4 });
      }
    }
  }

  function roofFlat(ctx, x0, x1, top, bottom, col, o = {}) {
    const p = H.rr(H.P(), x0 - 6, top, x1 - x0 + 12, bottom - top, 4);
    H.cel(ctx, p, col, { ox: 0, oy: -5, lw: 2 });
    const inner = H.rr(H.P(), x0 + 6, top + 8, x1 - x0 - 12, bottom - top - 18, 3);
    ctx.fillStyle = U.shade(col, -0.1);
    ctx.fill(inner);
    ctx.strokeStyle = U.rgba(U.shade(col, -0.35), 0.5);
    ctx.lineWidth = 1;
    ctx.stroke(inner);
    const lip = H.rr(H.P(), x0 - 8, bottom - 8, x1 - x0 + 16, 10, 2);
    H.cel(ctx, lip, U.shade(col, -0.18), { ox: 0, oy: 2, lw: 1.4 });
    if (o.tank) waterTank(ctx, x0 + (x1 - x0) * (o.tankX != null ? o.tankX : 0.72), top + 10);
    if (o.pipes) {
      ctx.strokeStyle = '#8a8a8a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x0 + 20, bottom - 12);
      ctx.lineTo(x0 + 20, top + 16);
      ctx.lineTo(x0 + 50, top + 16);
      ctx.stroke();
    }
  }

  function waterTank(ctx, cx, top) {
    for (const dx of [-18, 16]) {
      const l = H.rr(H.P(), cx + dx, top + 20, 4, 26, 1);
      H.cel(ctx, l, '#6a6a70', { ox: 0, oy: 0, lw: 1 });
    }
    const body = H.P();
    body.moveTo(cx - 24, top - 16);
    body.lineTo(cx - 24, top + 20);
    body.ellipse(cx, top + 20, 24, 9, 0, Math.PI, 0, true);
    body.lineTo(cx + 24, top - 16);
    body.closePath();
    H.cel(ctx, body, '#c9ccd2', { ox: -6, oy: 0, lw: 1.6 });
    const lid = H.ell(H.P(), cx, top - 16, 24, 9);
    H.cel(ctx, lid, '#e2e5ea', { ox: 0, oy: 2, lw: 1.6 });
    ctx.strokeStyle = 'rgba(80,80,90,0.5)';
    ctx.lineWidth = 1.6;
    for (const y of [top - 2, top + 10]) {
      ctx.beginPath();
      ctx.ellipse(cx, y, 24, 9, 0, 0, Math.PI);
      ctx.stroke();
    }
  }

  function wallFace(ctx, x, y, w, h, col, o = {}) {
    const p = H.rr(H.P(), x, y, w, h, 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = U.mix(U.shade(col, -0.6), H.OUT, 0.5);
    ctx.stroke(p);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, U.shade(col, -0.1));
    g.addColorStop(0.25, col);
    g.addColorStop(1, U.shade(col, -0.06));
    ctx.fillStyle = g;
    ctx.fill(p);
    // right side shade
    ctx.fillStyle = 'rgba(40,30,60,0.12)';
    ctx.fillRect(x + w - 10, y, 10, h);
    if (o.band) {
      ctx.fillStyle = o.band;
      ctx.fillRect(x, y, w, 7);
    }
    if (o.base !== false) {
      ctx.fillStyle = U.shade(col, -0.3);
      ctx.fillRect(x, y + h - 9, w, 9);
    }
    if (o.beams) {
      ctx.fillStyle = o.beams;
      for (let bx = x; bx <= x + w - 6; bx += TS) ctx.fillRect(bx, y, 6, h - 9);
      ctx.fillRect(x, y + h * 0.45, w, 5);
    }
  }

  // Generic Konoha house / shop.
  PR.def('house', {
    w: 4,
    h: 3,
    bounds: (o, w, h) => [-TS * 0.45, -TS * 1.8, w * TS + TS * 0.9, h * TS + TS * 2],
    draw(ctx, o, w, h) {
      const wallH = o.wallH || TS * 1.55;
      const wallTop = h - wallH;
      const col = o.wall || '#efe2c6';
      const roof = o.roof || '#b5532f';
      H.shadow(ctx, w / 2, h - 2, w * 0.62, 18, 0.35);
      wallFace(ctx, 0, wallTop, w, wallH, col, { band: o.band, beams: o.beams });
      // windows
      const doorX = o.door != null ? o.door : Math.floor(w / TS / 2);
      const tiles = Math.round(w / TS);
      for (let i = 0; i < tiles; i++) {
        if (i === doorX) continue;
        if (o.windows === false) break;
        windowRect(ctx, i * TS + 14, wallTop + 18, TS - 28, 30, o.win || {});
      }
      // door
      const dx = doorX * TS + 8, dw = TS - 16, dy = h - TS * 1.06;
      slidingDoor(ctx, dx, dy, dw, TS * 1.04 - 8, { noren: o.noren, norenText: o.norenText, norenMark: o.norenMark });
      if (o.awning) {
        const a = H.P();
        a.moveTo(dx - 16, dy - 4);
        a.lineTo(dx - 8, dy - 22);
        a.lineTo(dx + dw + 8, dy - 22);
        a.lineTo(dx + dw + 16, dy - 4);
        a.closePath();
        H.cel(ctx, a, o.awning, { ox: 0, oy: 3, lw: 1.6 });
      }
      // roof
      const rt = -TS * (o.roofH || 1.25);
      if (o.roofStyle === 'flat') roofFlat(ctx, 0, w, rt, wallTop + 8, roof, o);
      else roofGable(ctx, 0, w, rt, wallTop + 10, roof, { curl: o.curl, fascia: o.fascia });
      if (o.tank && o.roofStyle !== 'flat') waterTank(ctx, w * 0.75, rt - 12);
      if (o.sign) {
        const sw = Math.min(w - 20, o.sign.length * 11 + 26);
        const sp = H.rr(H.P(), w / 2 - sw / 2, wallTop - 14, sw, 26, 4);
        H.cel(ctx, sp, o.signBg || '#3a2a1e', { ox: 1, oy: 2, lw: 1.4 });
        H.text(ctx, o.sign, w / 2, wallTop - 1, 14, o.signColor || '#f6e6b8');
      }
      if (o.chimney) {
        const c = H.rr(H.P(), w * 0.2, rt - 14, 16, 30, 2);
        H.cel(ctx, c, '#8a7a70', { ox: 2, oy: 0, lw: 1.4 });
      }
    },
    light: (o, w, h) => {
      if (o.windows === false) return [];
      const doorX = o.door != null ? o.door : Math.floor(w / TS / 2);
      const wallTop = h - (o.wallH || TS * 1.55);
      const out = [];
      for (let i = 0; i < Math.round(w / TS); i++) if (i !== doorX) out.push({ x: i * TS + TS / 2, y: wallTop + 34, r: 70, color: '#ffc870', a: 0.55, night: true });
      return out;
    },
  });

  // Naruto's apartment block: two floors with an outside staircase.
  PR.def('apartment', {
    w: 5,
    h: 4,
    bounds: (o, w, h) => [-TS * 0.5, -TS * 2.4, w * TS + TS, h * TS + TS * 2.6],
    draw(ctx, o, w, h) {
      const col = o.wall || '#e8d9b8';
      const wallH = TS * 2.6;
      const wallTop = h - wallH;
      H.shadow(ctx, w / 2, h - 2, w * 0.6, 20, 0.35);
      wallFace(ctx, 0, wallTop, w, wallH, col, { band: '#c9a070' });
      // floor divider
      ctx.fillStyle = '#b9905e';
      ctx.fillRect(0, wallTop + wallH * 0.48, w, 8);
      // walkway railing upper floor
      ctx.strokeStyle = '#6a5a4a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, wallTop + wallH * 0.48 - 2);
      ctx.lineTo(w - TS - 4, wallTop + wallH * 0.48 - 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        windowRect(ctx, i * TS + 16, wallTop + 22, TS - 32, 34);
        if (i !== (o.door != null ? o.door : 1)) windowRect(ctx, i * TS + 16, wallTop + wallH * 0.58, TS - 32, 34);
      }
      const dx = (o.door != null ? o.door : 1) * TS + 10;
      slidingDoor(ctx, dx, h - TS * 1.06, TS - 20, TS * 1.04 - 8);
      // stairs on the right
      const sx = w - TS + 4;
      for (let i = 0; i < 8; i++) {
        const st = H.rr(H.P(), sx + 2, wallTop + wallH - 14 - i * 17, TS - 12, 8, 1);
        H.cel(ctx, st, '#9a8a7a', { ox: 0, oy: 1, lw: 1 });
      }
      ctx.strokeStyle = '#5a4a3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, wallTop + wallH - 10);
      ctx.lineTo(sx, wallTop + 10);
      ctx.stroke();
      roofFlat(ctx, 0, w, -TS * 1.6, wallTop + 8, o.roof || '#b8ad9a', { tank: true, tankX: 0.3, pipes: true });
      if (o.sign) {
        const sp = H.rr(H.P(), 20, wallTop + wallH * 0.52, 90, 20, 3);
        H.cel(ctx, sp, '#f4efe2', { ox: 1, oy: 1, lw: 1.2 });
        H.text(ctx, o.sign, 65, wallTop + wallH * 0.52 + 10, 11, '#3a3a3a');
      }
    },
    light: (o, w, h) => {
      const wallTop = h - TS * 2.6;
      return [0, 1, 2, 3].map((i) => ({ x: i * TS + TS / 2, y: wallTop + 40, r: 70, color: '#ffc870', a: 0.5, night: true }));
    },
  });

  // Hokage Tower: large round red building with the fire kanji.
  PR.def('hokage_tower', {
    w: 8,
    h: 5,
    bounds: (o, w, h) => [-TS * 0.6, -TS * 3.6, w * TS + TS * 1.2, h * TS + TS * 3.8],
    draw(ctx, o, w, h) {
      const cx = w / 2;
      const col = '#d8643c';
      H.shadow(ctx, cx, h - 4, w * 0.6, 26, 0.4);
      // main cylinder face
      const top = h - TS * 3.4, bot = h - 6;
      const body = H.P();
      body.moveTo(0, top);
      body.lineTo(0, bot - 26);
      body.quadraticCurveTo(cx, bot + 30, w, bot - 26);
      body.lineTo(w, top);
      body.closePath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#4a1c14';
      ctx.stroke(body);
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, U.shade(col, -0.25));
      g.addColorStop(0.35, U.light(col, 0.1));
      g.addColorStop(0.6, col);
      g.addColorStop(1, U.shade(col, -0.35));
      ctx.fillStyle = g;
      ctx.fill(body);
      ctx.save();
      ctx.clip(body);
      // bands
      ctx.fillStyle = '#f3e6c8';
      for (const y of [top + TS * 1.25, top + TS * 2.35]) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(cx, y + 34, w, y);
        ctx.lineTo(w, y + 9);
        ctx.quadraticCurveTo(cx, y + 43, 0, y + 9);
        ctx.fill();
      }
      // windows following the curve
      for (let i = 0; i < 9; i++) {
        const t = (i + 0.5) / 9;
        const x = t * w;
        const curve = Math.sin(t * Math.PI) * 24;
        if (Math.abs(i - 4) < 1) continue;
        windowRect(ctx, x - 12, top + TS * 1.55 + curve, 24, 30, { frame: '#5a2a1a' });
        windowRect(ctx, x - 12, top + 26 + curve * 0.7, 24, 26, { frame: '#5a2a1a' });
      }
      ctx.restore();
      // door
      const door = H.rr(H.P(), cx - TS * 0.8, bot - TS * 1.2, TS * 1.6, TS * 1.16, 8);
      H.cel(ctx, door, '#6a3a24', { ox: 2, oy: 2, lw: 1.8 });
      ctx.fillStyle = '#3a1c10';
      ctx.fillRect(cx - 2, bot - TS * 1.16, 4, TS * 1.1);
      const aw = H.P();
      aw.moveTo(cx - TS * 1.2, bot - TS * 1.16);
      aw.lineTo(cx - TS, bot - TS * 1.5);
      aw.lineTo(cx + TS, bot - TS * 1.5);
      aw.lineTo(cx + TS * 1.2, bot - TS * 1.16);
      aw.closePath();
      H.cel(ctx, aw, '#8a3a24', { ox: 0, oy: 3, lw: 1.6 });
      // roof: flat disc with rim + small upper drum with kanji
      const rTop = -TS * 1.6;
      const roof = H.ell(H.P(), cx, top, w / 2 + 8, TS * 0.9);
      H.cel(ctx, roof, '#c9533a', { ox: 0, oy: -6, lw: 2 });
      const rim = H.ell(H.P(), cx, top, w / 2 - 12, TS * 0.7);
      ctx.fillStyle = '#b54a32';
      ctx.fill(rim);
      const drum = H.P();
      drum.moveTo(cx - TS * 1.6, rTop);
      drum.lineTo(cx - TS * 1.6, top - 10);
      drum.quadraticCurveTo(cx, top + 22, cx + TS * 1.6, top - 10);
      drum.lineTo(cx + TS * 1.6, rTop);
      drum.closePath();
      H.cel(ctx, drum, col, { ox: -8, oy: 0, lw: 2 });
      const dTop = H.ell(H.P(), cx, rTop, TS * 1.6, TS * 0.36);
      H.cel(ctx, dTop, '#c9533a', { ox: 0, oy: 3, lw: 1.8 });
      // kanji plate
      const plate = H.ell(H.P(), cx, (rTop + top) / 2 + 4, 32, 32);
      H.cel(ctx, plate, '#f6f1e4', { ox: 3, oy: 3, lw: 2 });
      H.fireKanji(ctx, cx, (rTop + top) / 2 + 4, 40, '#c8321e');
    },
    light: (o, w, h) => [{ x: w / 2, y: h - TS * 1.6, r: 150, color: '#ffc870', a: 0.6, night: true }],
  });

  PR.def('hospital', {
    w: 8,
    h: 5,
    bounds: (o, w, h) => [-TS * 0.5, -TS * 2.2, w * TS + TS, h * TS + TS * 2.4],
    draw(ctx, o, w, h) {
      const col = '#f1efe8';
      const wallH = TS * 3;
      const wallTop = h - wallH;
      H.shadow(ctx, w / 2, h - 2, w * 0.6, 22, 0.35);
      wallFace(ctx, 0, wallTop, w, wallH, col, { band: '#7fa6c8' });
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 8; i++) {
          if (row === 1 && (i === 3 || i === 4)) continue;
          windowRect(ctx, i * TS + 14, wallTop + 22 + row * TS * 1.15, TS - 28, 36, { frame: '#6a7a8a' });
        }
      }
      // entrance
      const ex = w / 2 - TS, ey = h - TS * 1.2;
      const glass = H.rr(H.P(), ex + 6, ey, TS * 2 - 12, TS * 1.16, 4);
      H.cel(ctx, glass, '#9ac8e0', { ox: 2, oy: 2, lw: 1.6 });
      ctx.strokeStyle = '#5a6a7a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, ey);
      ctx.lineTo(w / 2, ey + TS * 1.16);
      ctx.stroke();
      const aw = H.P();
      aw.moveTo(ex - 16, ey - 2);
      aw.lineTo(ex - 6, ey - 26);
      aw.lineTo(ex + TS * 2 + 6, ey - 26);
      aw.lineTo(ex + TS * 2 + 16, ey - 2);
      aw.closePath();
      H.cel(ctx, aw, '#4f86b8', { ox: 0, oy: 3, lw: 1.6 });
      roofFlat(ctx, 0, w, -TS * 1.3, wallTop + 8, '#d9d6cc', { tank: true, tankX: 0.85 });
      // medical emblem
      const e = H.ell(H.P(), w / 2, wallTop - 4, 30, 30);
      H.cel(ctx, e, '#ffffff', { ox: 2, oy: 2, lw: 2 });
      ctx.fillStyle = '#d23a3a';
      ctx.fillRect(w / 2 - 6, wallTop - 24, 12, 40);
      ctx.fillRect(w / 2 - 20, wallTop - 10, 40, 12);
      H.text(ctx, 'KONOHA HOSPITAL', w / 2, wallTop + TS * 1.12, 15, '#3a5a7a');
    },
    light: (o, w, h) => [{ x: w / 2, y: h - TS * 0.8, r: 160, color: '#e8f4ff', a: 0.6, night: true }],
  });

  // Ichiraku Ramen stand: counter, eave, noren curtains.
  PR.def('ichiraku', {
    w: 4,
    h: 2,
    bounds: (o, w, h) => [-TS * 0.5, -TS * 2.2, w * TS + TS, h * TS + TS * 2.4],
    draw(ctx, o, w, h) {
      H.shadow(ctx, w / 2, h - 2, w * 0.6, 16, 0.3);
      // back wall (kitchen)
      wallFace(ctx, 6, -TS * 0.9, w - 12, TS * 1.9, '#d9c49a', { base: false, beams: '#8a5a36' });
      // kitchen shelf & pots
      ctx.fillStyle = '#6a4a2e';
      ctx.fillRect(20, -TS * 0.35, w - 40, 6);
      for (let i = 0; i < 5; i++) {
        const px = 34 + i * ((w - 68) / 4);
        const pot = H.rr(H.P(), px - 12, -TS * 0.35 - 20, 24, 20, 4);
        H.cel(ctx, pot, i % 2 ? '#8a8f98' : '#c9a24a', { ox: 2, oy: 1, lw: 1.2 });
      }
      // steam from the stock pot
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(w / 2 + i * 10 - 10, -TS * 0.35 - 34 - i * 8, 8 - i, 0, U.TAU);
        ctx.fill();
      }
      // counter
      const counter = H.rr(H.P(), 0, TS * 0.5, w, TS * 1.3, 4);
      H.cel(ctx, counter, '#a8743e', { ox: 0, oy: 4, lw: 2 });
      const top = H.rr(H.P(), -6, TS * 0.42, w + 12, 18, 3);
      H.cel(ctx, top, '#d9aa6a', { ox: 0, oy: 3, lw: 1.8 });
      // bowls on counter
      for (let i = 0; i < 3; i++) {
        const bx = 50 + i * 70;
        const b = H.P();
        b.ellipse(bx, TS * 0.44, 16, 6, 0, 0, Math.PI, false);
        b.closePath();
        H.cel(ctx, b, '#e8e2d8', { ox: 1, oy: 1, lw: 1.2 });
        ctx.fillStyle = '#d9a04a';
        ctx.beginPath();
        ctx.ellipse(bx, TS * 0.44, 14, 4, 0, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = '#6a4a2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 4, TS * 0.3);
        ctx.lineTo(bx + 18, TS * 0.12);
        ctx.stroke();
      }
      // posts
      for (const x of [2, w - 12]) {
        const p = H.rr(H.P(), x, -TS * 1.3, 10, TS * 2.6, 2);
        H.cel(ctx, p, '#6a4a2e', { ox: 2, oy: 0, lw: 1.4 });
      }
      // eave roof
      roofGable(ctx, 0, w, -TS * 1.95, -TS * 1.1, '#8a3a2a', { overhang: 16, curl: true });
      // noren
      const flaps = ['一', '楽', 'ラ', 'ー', 'メ', 'ン'];
      const n = flaps.length;
      for (let i = 0; i < n; i++) {
        const nx = 8 + (i * (w - 16)) / n;
        const nw = (w - 16) / n - 3;
        const p = H.P();
        p.moveTo(nx, -TS * 1.12);
        p.lineTo(nx + nw, -TS * 1.12);
        p.lineTo(nx + nw - 1, -TS * 0.35);
        p.quadraticCurveTo(nx + nw / 2, -TS * 0.3, nx + 1, -TS * 0.35);
        p.closePath();
        H.cel(ctx, p, '#f4f0e6', { ox: 1, oy: 2, lw: 1.2 });
        H.text(ctx, flaps[i], nx + nw / 2, -TS * 0.8, 17, '#c8321e');
      }
      const sign = H.rr(H.P(), w / 2 - 70, -TS * 2.35, 140, 30, 4);
      H.cel(ctx, sign, '#f4f0e6', { ox: 1, oy: 2, lw: 1.6 });
      H.text(ctx, 'ICHIRAKU RAMEN', w / 2, -TS * 2.35 + 15, 14, '#c8321e');
    },
    light: (o, w) => [{ x: w / 2, y: -TS * 0.4, r: 190, color: '#ffc070', a: 0.9 }],
  });

  // Traditional hot-spring inn.
  PR.def('inn', {
    w: 6,
    h: 4,
    bounds: (o, w, h) => [-TS * 0.6, -TS * 2.2, w * TS + TS * 1.2, h * TS + TS * 2.4],
    draw(ctx, o, w, h) {
      const wallH = TS * 1.8;
      const wallTop = h - wallH;
      H.shadow(ctx, w / 2, h - 2, w * 0.62, 20, 0.36);
      wallFace(ctx, 0, wallTop, w, wallH, '#f1e8d4', { beams: '#5a3a26', band: '#5a3a26' });
      for (let i = 0; i < 6; i++) {
        if (i === (o.door != null ? o.door : 2) || i === 3) continue;
        windowRect(ctx, i * TS + 12, wallTop + 22, TS - 24, 38, { frame: '#4a2e1e', glass1: '#f6eed6', glass2: '#e6d6b0' });
      }
      const dx = (o.door != null ? o.door : 2) * TS + 8;
      slidingDoor(ctx, dx, h - TS * 1.06, TS * 2 - 16, TS * 1.04 - 8, { noren: '#2f4f7a', norenMark: 'onsen' });
      roofGable(ctx, 0, w, -TS * 1.5, wallTop + 10, '#4a5670', { overhang: 22, curl: true, fascia: '#2a2a34' });
      // second tier
      roofGable(ctx, w * 0.2, w * 0.8, -TS * 2, -TS * 1.4, '#4a5670', { overhang: 14, curl: true, fascia: '#2a2a34' });
      for (const x of [TS * 0.5, w - TS * 0.5]) {
        const post = H.rr(H.P(), x - 2, wallTop + 4, 4, 18, 1);
        H.flat(ctx, post, '#2a1a14');
        const l = H.ell(H.P(), x, wallTop + 34, 13, 17);
        H.cel(ctx, l, '#e04a3a', { ox: 2, oy: 2, lw: 1.4 });
      }
    },
    light: (o, w, h) => {
      const wallTop = h - TS * 1.8;
      return [{ x: TS * 0.5, y: wallTop + 34, r: 120, color: '#ff9a60', a: 0.9 }, { x: w - TS * 0.5, y: wallTop + 34, r: 120, color: '#ff9a60', a: 0.9 }];
    },
  });

  // The great gate of Konoha (open). Middle tiles are passable.
  PR.def('gate', {
    w: 6,
    h: 2,
    solid: (dx, dy, o, w) => dx === 0 || dx === w - 1,
    bounds: (o, w, h) => [-TS * 0.6, -TS * 3.4, w * TS + TS * 1.2, h * TS + TS * 3.5],
    draw(ctx, o, w, h) {
      const col = '#7a5a3e';
      for (const x of [0, w - TS]) {
        H.shadow(ctx, x + TS / 2, h - 4, 50, 14, 0.36);
        const p = H.rr(H.P(), x + 6, -TS * 2.4, TS - 12, h + TS * 2.4 - 4, 4);
        H.cel(ctx, p, col, { ox: 5, oy: 0, lw: 2 });
        const b = H.rr(H.P(), x, h - 22, TS, 20, 3);
        H.cel(ctx, b, '#4a4a4e', { ox: 1, oy: 2, lw: 1.6 });
        // open door leaf folded against pillar
        const leaf = H.rr(H.P(), x + (x === 0 ? TS - 6 : -TS * 0.3), -TS * 1.4, TS * 0.36, h + TS * 1.4 - 10, 2);
        H.cel(ctx, leaf, '#4f7a4a', { ox: 2, oy: 0, lw: 1.6 });
      }
    },
    overhead(ctx, o, w) {
      const beam = H.rr(H.P(), -TS * 0.4, -TS * 2.9, w + TS * 0.8, TS * 0.6, 6);
      H.cel(ctx, beam, '#6a4a32', { ox: 0, oy: 4, lw: 2 });
      const roof = H.P();
      roof.moveTo(-TS * 0.6, -TS * 2.9);
      roof.quadraticCurveTo(w / 2, -TS * 3.3, w + TS * 0.6, -TS * 2.9);
      roof.lineTo(w + TS * 0.4, -TS * 3.2);
      roof.quadraticCurveTo(w / 2, -TS * 3.55, -TS * 0.4, -TS * 3.2);
      roof.closePath();
      H.cel(ctx, roof, '#3a4a5a', { ox: 0, oy: 3, lw: 2 });
      const plate = H.rr(H.P(), w / 2 - 40, -TS * 2.84, 80, TS * 0.5, 4);
      H.cel(ctx, plate, '#f3ecd8', { ox: 1, oy: 2, lw: 1.4 });
      H.leafMark(ctx, w / 2, -TS * 2.6, 11, '#c8321e', 4);
    },
  });

  // The Hokage Monument: cliff with six carved faces. Place along the top of a map.
  PR.def('monument', {
    w: 16,
    h: 1,
    bounds: (o, w, h) => [-TS * 0.5, -TS * 5.6, w * TS + TS, TS * 6.8],
    draw(ctx, o, w, h) {
      const col = '#a8977e';
      const rng = U.rng(77);
      // cliff mass
      const p = H.P();
      p.moveTo(-TS * 0.5, h);
      p.lineTo(-TS * 0.5, -TS * 4.4);
      for (let x = 0; x <= w + TS * 0.5; x += TS * 0.5) p.lineTo(x, -TS * 5.2 + Math.sin(x * 0.013) * 18 + rng() * 14);
      p.lineTo(w + TS * 0.5, h);
      p.closePath();
      H.cel(ctx, p, col, { ox: 0, oy: -10, lw: 2.4 });
      ctx.save();
      ctx.clip(p);
      ctx.strokeStyle = 'rgba(80,65,50,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const x = rng() * w;
        ctx.beginPath();
        ctx.moveTo(x, -TS * 5);
        ctx.lineTo(x + (rng() - 0.5) * 30, h);
        ctx.stroke();
      }
      // greenery on top
      ctx.fillStyle = '#5d9a3e';
      for (let x = -TS * 0.5; x < w + TS; x += 26) {
        ctx.beginPath();
        ctx.arc(x, -TS * 5.1 + Math.sin(x * 0.013) * 18, 22 + rng() * 10, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
      // six faces
      const n = 6;
      const span = w / n;
      for (let i = 0; i < n; i++) {
        const cx = span * (i + 0.5), cy = -TS * 2.5;
        face(ctx, cx, cy, span * 0.36, i, col);
      }
    },
  });

  function face(ctx, cx, cy, r, i, col) {
    const dark = U.shade(col, -0.35), light = U.light(col, 0.18);
    // hair silhouettes
    const hair = H.P();
    if (i === 0) {
      hair.moveTo(cx - r * 1.15, cy + r * 1.1);
      hair.bezierCurveTo(cx - r * 1.3, cy - r * 1.6, cx + r * 1.3, cy - r * 1.6, cx + r * 1.15, cy + r * 1.1);
    } else if (i === 1) {
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + (k / 6) * Math.PI;
        hair.moveTo(cx + Math.cos(a) * r * 0.9, cy - r * 0.2 + Math.sin(a) * r * 0.9);
        hair.lineTo(cx + Math.cos(a) * r * 1.35, cy - r * 0.2 + Math.sin(a) * r * 1.3);
        hair.lineTo(cx + Math.cos(a + 0.35) * r * 0.9, cy - r * 0.2 + Math.sin(a + 0.35) * r * 0.9);
      }
    } else if (i === 2) {
      hair.moveTo(cx - r * 1.05, cy - r * 0.2);
      hair.quadraticCurveTo(cx, cy - r * 1.5, cx + r * 1.05, cy - r * 0.2);
      hair.lineTo(cx + r * 1.15, cy + r * 0.1);
      hair.lineTo(cx - r * 1.15, cy + r * 0.1);
    } else if (i === 3) {
      for (let k = 0; k < 8; k++) {
        const a = Math.PI * 0.95 + (k / 7) * Math.PI * 1.1;
        hair.moveTo(cx + Math.cos(a) * r * 0.85, cy - r * 0.15 + Math.sin(a) * r * 0.85);
        hair.lineTo(cx + Math.cos(a + 0.12) * r * 1.4, cy - r * 0.15 + Math.sin(a + 0.12) * r * 1.35);
        hair.lineTo(cx + Math.cos(a + 0.4) * r * 0.85, cy - r * 0.15 + Math.sin(a + 0.4) * r * 0.85);
      }
      hair.moveTo(cx - r * 0.95, cy - r * 0.2);
      hair.lineTo(cx - r * 1.05, cy + r * 0.9);
      hair.lineTo(cx - r * 0.75, cy + r * 0.2);
      hair.moveTo(cx + r * 0.95, cy - r * 0.2);
      hair.lineTo(cx + r * 1.05, cy + r * 0.9);
      hair.lineTo(cx + r * 0.75, cy + r * 0.2);
    } else if (i === 4) {
      hair.moveTo(cx - r, cy + r * 0.2);
      hair.bezierCurveTo(cx - r * 1.2, cy - r * 1.4, cx + r * 1.2, cy - r * 1.4, cx + r, cy + r * 0.2);
      hair.lineTo(cx + r * 1.2, cy + r * 1.3);
      hair.lineTo(cx + r * 0.85, cy + r * 1.3);
      hair.lineTo(cx + r * 0.7, cy);
      hair.lineTo(cx - r * 0.7, cy);
      hair.lineTo(cx - r * 0.85, cy + r * 1.3);
      hair.lineTo(cx - r * 1.2, cy + r * 1.3);
    } else {
      for (let k = 0; k < 6; k++) {
        const a = Math.PI * 1.05 + (k / 5) * Math.PI * 0.9;
        hair.moveTo(cx + Math.cos(a) * r * 0.85, cy - r * 0.2 + Math.sin(a) * r * 0.85);
        hair.lineTo(cx + Math.cos(a + 0.6) * r * 1.5, cy - r * 0.2 + Math.sin(a + 0.6) * r * 1.2);
        hair.lineTo(cx + Math.cos(a + 0.45) * r * 0.85, cy - r * 0.2 + Math.sin(a + 0.45) * r * 0.85);
      }
    }
    hair.closePath();
    H.cel(ctx, hair, U.shade(col, -0.08), { ox: 4, oy: 6, lw: 2 });
    // head
    const head = H.P();
    head.moveTo(cx - r * 0.9, cy - r * 0.3);
    head.bezierCurveTo(cx - r * 0.95, cy + r * 0.8, cx - r * 0.4, cy + r * 1.25, cx, cy + r * 1.3);
    head.bezierCurveTo(cx + r * 0.4, cy + r * 1.25, cx + r * 0.95, cy + r * 0.8, cx + r * 0.9, cy - r * 0.3);
    head.bezierCurveTo(cx + r * 0.9, cy - r * 1.1, cx - r * 0.9, cy - r * 1.1, cx - r * 0.9, cy - r * 0.3);
    head.closePath();
    H.cel(ctx, head, light, { ox: 5, oy: 6, lw: 2 });
    if (i === 3 || i === 4 || i === 1) {
      // bangs
      const b = H.P();
      for (let k = -2; k <= 2; k++) {
        b.moveTo(cx + k * r * 0.34 - r * 0.2, cy - r * 0.62);
        b.lineTo(cx + k * r * 0.34 + r * 0.05, cy - r * 0.05 - Math.abs(k) * 4);
        b.lineTo(cx + k * r * 0.34 + r * 0.2, cy - r * 0.62);
      }
      H.cel(ctx, b, U.shade(col, -0.08), { ox: 2, oy: 3, lw: 1.4 });
    }
    // carved features
    ctx.strokeStyle = dark;
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.05);
    ctx.lineTo(cx - r * 0.18, cy + r * 0.02);
    ctx.moveTo(cx + r * 0.18, cy + r * 0.02);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.05);
    ctx.stroke();
    ctx.fillStyle = dark;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * r * 0.38, cy + r * 0.22, r * 0.16, r * 0.1, 0, 0, U.TAU);
      ctx.fill();
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy + r * 0.3);
    ctx.lineTo(cx + 5, cy + r * 0.66);
    ctx.lineTo(cx - 3, cy + r * 0.7);
    ctx.stroke();
    if (i === 5) {
      // Kakashi's mask
      const m = H.P();
      m.moveTo(cx - r * 0.85, cy + r * 0.45);
      m.quadraticCurveTo(cx, cy + r * 0.38, cx + r * 0.85, cy + r * 0.45);
      m.bezierCurveTo(cx + r * 0.8, cy + r * 1.1, cx - r * 0.8, cy + r * 1.1, cx - r * 0.85, cy + r * 0.45);
      m.closePath();
      H.cel(ctx, m, U.shade(col, -0.12), { ox: 3, oy: 4, lw: 1.6 });
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.25, cy + r * 0.92);
      ctx.quadraticCurveTo(cx, cy + r * (i === 4 ? 1.02 : 0.95), cx + r * 0.25, cy + r * 0.92);
      ctx.stroke();
    }
    if (i === 4) {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.42);
      ctx.lineTo(cx + 6, cy - r * 0.32);
      ctx.lineTo(cx, cy - r * 0.22);
      ctx.lineTo(cx - 6, cy - r * 0.32);
      ctx.fill();
    }
  }

  PR.def('tent', {
    w: 2,
    h: 2,
    bounds: (o, w, h) => [-TS * 0.3, -TS * 1.3, w * TS + TS * 0.6, h * TS + TS * 1.4],
    draw(ctx, o, w, h) {
      H.shadow(ctx, w / 2, h - 6, w * 0.6, 16, 0.34);
      const col = o.c || '#8a8468';
      const back = H.poly(H.P(), [4, h - 8, w / 2, -TS * 1.1, w - 4, h - 8]);
      H.cel(ctx, back, col, { ox: -12, oy: 0, lw: 2 });
      const door = H.poly(H.P(), [w / 2 - 22, h - 8, w / 2, -TS * 0.2, w / 2 + 22, h - 8]);
      H.flat(ctx, door, '#2a2420', 1.5);
      ctx.strokeStyle = '#5a4a3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, -TS * 1.1);
      ctx.lineTo(w / 2, -TS * 1.35);
      ctx.stroke();
    },
  });

  PR.def('cave_mouth', {
    // dark arched entrance drawn on a cliff/rock face; footprint is passable
    w: 2,
    h: 1,
    solid: false,
    decal: false,
    sortOffset: -TS,
    bounds: (o, w, h) => [-TS * 0.4, -TS * 1.6, w * TS + TS * 0.8, TS * 2.7],
    draw(ctx, o, w) {
      const p = H.P();
      p.moveTo(-TS * 0.2, TS);
      p.lineTo(-TS * 0.2, -TS * 0.2);
      p.bezierCurveTo(-TS * 0.1, -TS * 1.4, w + TS * 0.1, -TS * 1.4, w + TS * 0.2, -TS * 0.2);
      p.lineTo(w + TS * 0.2, TS);
      p.closePath();
      H.cel(ctx, p, '#6a625a', { ox: 0, oy: -6, lw: 2 });
      const hole = H.P();
      hole.moveTo(4, TS);
      hole.lineTo(4, 0);
      hole.bezierCurveTo(8, -TS * 1.05, w - 8, -TS * 1.05, w - 4, 0);
      hole.lineTo(w - 4, TS);
      hole.closePath();
      const g = ctx.createLinearGradient(0, -TS, 0, TS);
      g.addColorStop(0, '#050408');
      g.addColorStop(1, '#1e1a22');
      ctx.fillStyle = g;
      ctx.fill(hole);
    },
  });
})();
