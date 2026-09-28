// Fallback anime-style bust portraits with expressions, used when the player has no
// picture for a character/situation. 400x500 design units, cel-shaded vector art.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const PG = (NR.portraitgen = { cache: new Map(), W: 400, H: 500 });
  const OUT = '#2a1a22';
  const D2R = Math.PI / 180;

  // ---------- helpers ----------
  const P = () => new Path2D();
  function ell(p, cx, cy, rx, ry, rot = 0) {
    p.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
    p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  }
  function rr(p, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    p.moveTo(x + r, y);
    p.arcTo(x + w, y, x + w, y + h, r);
    p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r);
    p.arcTo(x, y, x + w, y, r);
    p.closePath();
  }
  function spike(p, bx, by, tx, ty, w, bulge = 0.3, bend = 0) {
    const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const ax = bx + (nx * w) / 2, ay = by + (ny * w) / 2;
    const cx = bx - (nx * w) / 2, cy = by - (ny * w) / 2;
    const mx = bx + dx * 0.55 + nx * bend, my = by + dy * 0.55 + ny * bend;
    p.moveTo(ax, ay);
    p.quadraticCurveTo(mx + nx * w * bulge, my + ny * w * bulge, tx, ty);
    p.quadraticCurveTo(mx - nx * w * bulge, my - ny * w * bulge, cx, cy);
    p.closePath();
  }
  // [angleDeg, len, width, tiltDeg, bend] around ellipse
  function ring(p, cx, cy, rx, ry, list) {
    for (const [ang, len, w, tilt = 0, bend = 0] of list) {
      const a = ang * D2R, d = (ang + tilt) * D2R;
      const ix = cx + Math.cos(a) * rx * 0.7, iy = cy + Math.sin(a) * ry * 0.7;
      const bx = cx + Math.cos(a) * rx, by = cy + Math.sin(a) * ry;
      spike(p, ix, iy, bx + Math.cos(d) * len, by + Math.sin(d) * len, w, 0.32, bend);
    }
  }
  function cel(ctx, path, base, o = {}) {
    const sh = o.shadow || U.shadow(base, o.depth || 0.24);
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = sh;
    ctx.fill(path);
    ctx.translate(-(o.ox != null ? o.ox : 9), -(o.oy != null ? o.oy : 11));
    if (o.grad) {
      const g = ctx.createLinearGradient(0, o.grad[0], 0, o.grad[1]);
      g.addColorStop(0, U.light(base, 0.12));
      g.addColorStop(1, base);
      ctx.fillStyle = g;
    } else ctx.fillStyle = base;
    ctx.fill(path);
    ctx.restore();
    if (o.line !== false) {
      ctx.lineWidth = o.lw || 2.6;
      ctx.strokeStyle = o.lineColor || U.mix(U.shade(base, -0.62), OUT, 0.5);
      ctx.stroke(path);
    }
  }

  // ---------- expressions ----------
  const EMO = {
    neutral: { open: 1, tilt: 0, brow: [0, 0], mouth: 'neutral', blush: 0 },
    happy: { open: 0.92, tilt: 0, brow: [-7, 3], mouth: 'open_smile', blush: 0.2, lowerLift: 6 },
    sad: { open: 0.82, tilt: -7, brow: [2, -12], mouth: 'frown', tears: true, look: [0, 5] },
    angry: { open: 0.74, tilt: 10, brow: [8, 15], mouth: 'shout', vein: true },
    surprised: { open: 1.22, tilt: 0, brow: [-16, 0], mouth: 'o', iris: 0.78 },
    blush: { open: 0.86, tilt: -3, brow: [-3, -7], mouth: 'wavy', blush: 1, look: [-11, 4], sweat: false },
    flirty: { open: 0.6, tilt: 2, brow: [-4, 0], browAsym: true, mouth: 'smirk', blush: 0.45, look: [5, 0] },
    love: { open: 0.66, tilt: -2, brow: [-4, -5], mouth: 'soft_smile', blush: 0.75, sparkle: true },
    serious: { open: 0.82, tilt: 6, brow: [6, 8], mouth: 'flat' },
    hurt: { open: 0.72, tilt: -4, brow: [4, -9], wince: true, mouth: 'grit', sweat: true, scratches: true },
    battle: { open: 0.9, tilt: 9, brow: [6, 13], mouth: 'shout' },
  };
  PG.EMO = EMO;

  // ---------- face ----------
  function facePath(L) {
    const p = P();
    const j = L.f ? 0 : 7;
    p.moveTo(97, 168);
    p.bezierCurveTo(93, 228, 103 - j * 0.3, 272, 131 - j * 0.4, 310 + j * 0.3);
    p.bezierCurveTo(151, 336, 178, 352, 200, 355);
    p.bezierCurveTo(222, 352, 249, 336, 269 + j * 0.4, 310 + j * 0.3);
    p.bezierCurveTo(297 + j * 0.3, 272, 307, 228, 303, 168);
    p.bezierCurveTo(299, 56, 101, 56, 97, 168);
    p.closePath();
    return p;
  }

  function drawEye(ctx, L, side, E, emoName) {
    const f = L.f;
    const cx = 200 + side * 53, cy = 240;
    const w = f ? 70 : 62, h = (f ? 58 : 44) * E.open;
    const st = L.eyeStyle || 'normal';
    const inner = cx - (side * w) / 2 * 0.92, outer = cx + (side * w) / 2;
    const tilt = E.tilt || 0;
    const topY = cy - h / 2 - (L.f ? 2 : 0);
    // closed / happy-squint eyes
    const closed = st === 'closed' || (E.wince && side === 1);
    if (closed) {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (E.wince) {
        ctx.moveTo(inner, cy - 4);
        ctx.lineTo(outer, cy - 12);
        ctx.moveTo(inner, cy - 2);
        ctx.lineTo(outer, cy + 6);
      } else {
        ctx.moveTo(inner, cy + 4);
        ctx.quadraticCurveTo(cx, cy - 14, outer, cy + 2);
      }
      ctx.stroke();
      return;
    }
    const lidIn = cy - h * 0.18 + tilt * 0.6;
    const lidOut = cy - h * 0.22 - tilt * 0.4;
    const shape = P();
    shape.moveTo(inner, lidIn + 6);
    shape.bezierCurveTo(inner + side * 8, topY + tilt * 0.35, outer - side * 18, topY - tilt * 0.2, outer, lidOut);
    const lowY = cy + h / 2 - (E.lowerLift || 0);
    shape.bezierCurveTo(outer - side * 2, cy + h * 0.25, cx + side * 12, lowY, cx - side * 4, lowY);
    shape.bezierCurveTo(inner + side * 10, lowY - 2, inner, cy + h * 0.2, inner, lidIn + 6);
    shape.closePath();
    ctx.fillStyle = st === 'pale' ? '#fbfaff' : '#fdfcff';
    ctx.fill(shape);
    ctx.save();
    ctx.clip(shape);
    // lid shadow on the white
    ctx.fillStyle = 'rgba(120,110,160,0.28)';
    ctx.fillRect(cx - 50, topY - 10, 100, 12 + h * 0.18);
    const look = E.look || [0, 0];
    const ir = (f ? 25 : 22) * (E.iris || 1);
    const irh = (f ? 30 : 25) * (E.iris || 1);
    const ix = cx + look[0] * (side === 1 ? 1 : 1) + side * 1, iy = cy + 3 + look[1];
    if (st === 'pale') {
      const g = ctx.createRadialGradient(ix, iy - 4, 2, ix, iy, irh);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, L.eyes);
      g.addColorStop(1, U.shade(L.eyes, -0.2));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(ix, iy, ir, irh, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(L.eyes, -0.35), 0.6);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      const g = ctx.createLinearGradient(0, iy - irh, 0, iy + irh);
      g.addColorStop(0, U.shade(L.eyes, -0.62));
      g.addColorStop(0.45, U.shade(L.eyes, -0.1));
      g.addColorStop(0.8, L.eyes);
      g.addColorStop(1, U.light(L.eyes, 0.45));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(ix, iy, ir, irh, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = U.shade(L.eyes, -0.65);
      ctx.lineWidth = 2;
      ctx.stroke();
      // pupil
      ctx.fillStyle = U.shade(L.eyes, -0.78);
      ctx.beginPath();
      if (st === 'slit') ctx.ellipse(ix, iy, 3.2, irh * 0.72, 0, 0, U.TAU);
      else if (st === 'round') ctx.ellipse(ix, iy, ir * 0.62, irh * 0.62, 0, 0, U.TAU);
      else ctx.ellipse(ix, iy + 2, ir * (st === 'light' ? 0.3 : 0.42), irh * (st === 'light' ? 0.34 : 0.44), 0, 0, U.TAU);
      ctx.fill();
      // lower iris glow
      ctx.fillStyle = U.rgba(U.light(L.eyes, 0.6), 0.55);
      ctx.beginPath();
      ctx.ellipse(ix, iy + irh * 0.55, ir * 0.62, irh * 0.26, 0, 0, U.TAU);
      ctx.fill();
    }
    // highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ix - ir * 0.36, iy - irh * 0.36, ir * 0.3, irh * 0.26, -0.4, 0, U.TAU);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(ix + ir * 0.34, iy + irh * 0.38, ir * 0.12, 0, U.TAU);
    ctx.fill();
    if (E.sparkle) {
      ctx.beginPath();
      ctx.arc(ix + ir * 0.1, iy - irh * 0.1, ir * 0.1, 0, U.TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // upper lash line
    ctx.strokeStyle = OUT;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = f ? 7.5 : 6;
    ctx.beginPath();
    ctx.moveTo(inner, lidIn + 6);
    ctx.bezierCurveTo(inner + side * 8, topY + tilt * 0.35, outer - side * 18, topY - tilt * 0.2, outer, lidOut);
    ctx.stroke();
    if (f) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(outer - side * 4, lidOut + 1);
      ctx.lineTo(outer + side * 10, lidOut - 7);
      ctx.moveTo(outer - side * 10, lidOut - 3);
      ctx.lineTo(outer + side * 4, lidOut - 12);
      ctx.stroke();
    }
    // lower lash
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = U.rgba(OUT, 0.75);
    ctx.beginPath();
    ctx.moveTo(outer - side * 3, cy + h * 0.18);
    ctx.quadraticCurveTo(cx + side * 10, lowY + 1, cx - side * 6, lowY);
    ctx.stroke();
    // double eyelid crease
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = U.rgba(U.shade(L.skin, -0.45), 0.7);
    ctx.beginPath();
    ctx.moveTo(inner + side * 10, topY - 2 + tilt * 0.2);
    ctx.quadraticCurveTo(cx, topY - 11, outer - side * 8, lidOut - 9);
    ctx.stroke();
    if (E.tears) {
      ctx.fillStyle = 'rgba(150,210,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - side * 4, lowY + 2);
      ctx.quadraticCurveTo(cx - side * 12, lowY + 22, cx - side * 4, lowY + 30);
      ctx.quadraticCurveTo(cx + side * 4, lowY + 22, cx - side * 4, lowY + 2);
      ctx.fill();
    }
  }

  function drawBrows(ctx, L, E) {
    if (L.brows === 'none') return;
    const thick = L.brows === 'thick';
    const col = U.shade(L.hairColor, L.hairColor === '#131318' ? 0 : -0.3);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const cx = 200 + side * 54;
      let raise = E.brow[0], ang = E.brow[1];
      if (E.browAsym && side === 1) raise -= 8;
      const y = 190 + raise;
      const inX = cx - side * 30, outX = cx + side * 32;
      const inY = y + ang * 0.6, outY = y - ang * 0.25 + 4;
      if (thick) {
        const p = P();
        p.moveTo(inX, inY - 8);
        p.quadraticCurveTo(cx, y - 18, outX, outY - 8);
        p.lineTo(outX, outY + 8);
        p.quadraticCurveTo(cx, y + 2, inX, inY + 10);
        p.closePath();
        ctx.fill(p);
      } else {
        ctx.lineWidth = L.f ? 4 : 6;
        ctx.beginPath();
        ctx.moveTo(inX, inY);
        ctx.quadraticCurveTo(cx, y - 10 + ang * 0.1, outX, outY);
        ctx.stroke();
      }
    }
  }

  function drawMouth(ctx, L, E) {
    const x = 200, y = 314;
    const dark = '#6a2a34', lip = U.shade(L.skin, -0.35);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const m = E.mouth;
    const fang = L.id === 'naruto' || L.id === 'kiba';
    if (m === 'neutral' || m === 'flat') {
      ctx.strokeStyle = lip;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.quadraticCurveTo(x, y + (m === 'flat' ? 0 : 3), x + 14, y);
      ctx.stroke();
    } else if (m === 'soft_smile' || m === 'smile') {
      ctx.strokeStyle = lip;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(x - 18, y - 3);
      ctx.quadraticCurveTo(x, y + 9, x + 18, y - 3);
      ctx.stroke();
    } else if (m === 'smirk') {
      ctx.strokeStyle = lip;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 2);
      ctx.quadraticCurveTo(x + 4, y + 7, x + 20, y - 6);
      ctx.stroke();
    } else if (m === 'frown') {
      ctx.strokeStyle = lip;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(x - 15, y + 5);
      ctx.quadraticCurveTo(x, y - 5, x + 15, y + 5);
      ctx.stroke();
    } else if (m === 'wavy') {
      ctx.strokeStyle = lip;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 2);
      ctx.quadraticCurveTo(x - 7, y - 4, x, y + 2);
      ctx.quadraticCurveTo(x + 7, y + 8, x + 14, y + 1);
      ctx.stroke();
    } else if (m === 'o') {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 9, 12, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#e07a8a';
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 6, 4, 0, 0, U.TAU);
      ctx.fill();
    } else if (m === 'open_smile' || m === 'shout') {
      const p = P();
      if (m === 'open_smile') {
        p.moveTo(x - 26, y - 6);
        p.quadraticCurveTo(x, y - 1, x + 26, y - 6);
        p.quadraticCurveTo(x + 18, y + 26, x, y + 27);
        p.quadraticCurveTo(x - 18, y + 26, x - 26, y - 6);
      } else {
        p.moveTo(x - 22, y - 4);
        p.quadraticCurveTo(x, y - 12, x + 22, y - 4);
        p.quadraticCurveTo(x + 20, y + 26, x, y + 28);
        p.quadraticCurveTo(x - 20, y + 26, x - 22, y - 4);
      }
      p.closePath();
      ctx.fillStyle = dark;
      ctx.fill(p);
      ctx.save();
      ctx.clip(p);
      ctx.fillStyle = '#e8798c';
      ctx.beginPath();
      ctx.ellipse(x, y + 26, 16, 10, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#fbf7f2';
      ctx.fillRect(x - 30, y - 14, 60, m === 'shout' ? 11 : 8);
      if (fang) {
        ctx.beginPath();
        ctx.moveTo(x - 17, y - 4);
        ctx.lineTo(x - 12, y + 6);
        ctx.lineTo(x - 8, y - 4);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = U.shade(L.skin, -0.5);
      ctx.lineWidth = 2.4;
      ctx.stroke(p);
    } else if (m === 'grit') {
      const p = P();
      rr(p, x - 22, y - 7, 44, 15, 6);
      ctx.fillStyle = '#fbf7f2';
      ctx.fill(p);
      ctx.strokeStyle = U.shade(L.skin, -0.5);
      ctx.lineWidth = 2.4;
      ctx.stroke(p);
      ctx.beginPath();
      ctx.moveTo(x - 22, y + 0.5);
      ctx.lineTo(x + 22, y + 0.5);
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(x + i * 8, y - 7);
        ctx.lineTo(x + i * 8, y + 8);
      }
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function drawCheeks(ctx, L, E) {
    const b = Math.max(E.blush || 0, L.f ? 0.18 : 0);
    if (b <= 0) return;
    for (const side of [-1, 1]) {
      const cx = 200 + side * 70, cy = 282;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 36);
      g.addColorStop(0, `rgba(255,105,130,${0.5 * b})`);
      g.addColorStop(1, 'rgba(255,105,130,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 38, 22, 0, 0, U.TAU);
      ctx.fill();
      if (b > 0.6) {
        ctx.strokeStyle = `rgba(220,70,100,${0.7 * b})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
          ctx.moveTo(cx + i * 9 - 4, cy + 6);
          ctx.lineTo(cx + i * 9 + 4, cy - 6);
        }
        ctx.stroke();
      }
    }
  }

  function drawFaceMarks(ctx, L, E) {
    const has = (a) => L.acc.includes(a);
    ctx.lineCap = 'round';
    // nose
    ctx.strokeStyle = U.rgba(U.shade(L.skin, -0.45), 0.9);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(203, 272);
    ctx.quadraticCurveTo(207, 283, 199, 287);
    ctx.stroke();
    if (has('whiskers')) {
      ctx.strokeStyle = 'rgba(90,45,35,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const y = 270 + i * 13;
          ctx.moveTo(200 + side * 64, y - 2 + i * 1.5);
          ctx.lineTo(200 + side * 96, y + 2 + i * 2.5);
        }
      }
      ctx.stroke();
    }
    if (has('fangs')) {
      ctx.fillStyle = '#c62828';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(200 + side * 62, 262);
        ctx.lineTo(200 + side * 92, 262);
        ctx.lineTo(200 + side * 77, 300);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (has('swirls')) {
      ctx.strokeStyle = '#e06a8a';
      ctx.lineWidth = 3;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let a = 0; a < 4.2 * Math.PI; a += 0.2) {
          const r = 2 + a * 1.6;
          const px = 200 + side * 78 + Math.cos(a) * r, py = 285 + Math.sin(a) * r;
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    if (has('scar_eye')) {
      ctx.strokeStyle = 'rgba(150,70,70,0.9)';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(256, 185);
      ctx.lineTo(250, 290);
      ctx.stroke();
    }
    if (has('scar_nose')) {
      ctx.strokeStyle = 'rgba(160,80,70,0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(130, 270);
      ctx.lineTo(270, 270);
      ctx.stroke();
    }
    if (has('bandage_nose')) {
      const b = P();
      rr(b, 150, 262, 100, 18, 5);
      cel(ctx, b, '#f2eee4', { lw: 2, ox: 3, oy: 4 });
    }
    if (has('eyerings')) {
      ctx.strokeStyle = 'rgba(40,20,30,0.55)';
      ctx.lineWidth = 7;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(200 + side * 53, 240, 40, 32, 0, 0, U.TAU);
        ctx.stroke();
      }
    }
    if (has('seal_marks')) {
      ctx.strokeStyle = 'rgba(165,110,255,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        ctx.moveTo(200 + side * 70, 268);
        ctx.lineTo(200 + side * 60, 300);
        ctx.lineTo(200 + side * 74, 318);
      }
      ctx.stroke();
    }
    if (E.scratches) {
      ctx.strokeStyle = 'rgba(200,60,60,0.8)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(115, 280);
      ctx.lineTo(140, 272);
      ctx.moveTo(118, 290);
      ctx.lineTo(138, 284);
      ctx.stroke();
    }
    if (E.sweat) {
      ctx.fillStyle = 'rgba(160,215,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(300, 150);
      ctx.quadraticCurveTo(284, 180, 296, 188);
      ctx.quadraticCurveTo(310, 180, 300, 150);
      ctx.fill();
    }
    if (E.vein) {
      ctx.strokeStyle = '#d23a3a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const vx = 285, vy = 135;
      ctx.moveTo(vx - 12, vy - 4);
      ctx.quadraticCurveTo(vx - 3, vy - 3, vx - 4, vy - 12);
      ctx.moveTo(vx + 4, vy - 12);
      ctx.quadraticCurveTo(vx + 3, vy - 3, vx + 12, vy - 4);
      ctx.moveTo(vx + 12, vy + 4);
      ctx.quadraticCurveTo(vx + 3, vy + 3, vx + 4, vy + 12);
      ctx.moveTo(vx - 4, vy + 12);
      ctx.quadraticCurveTo(vx - 3, vy + 3, vx - 12, vy + 4);
      ctx.stroke();
    }
  }

  function drawForehead(ctx, L, H) {
    const has = (a) => L.acc.includes(a);
    if (has('diamond') && H.forehead) {
      ctx.fillStyle = '#8a4fc2';
      ctx.beginPath();
      ctx.moveTo(200, 128);
      ctx.lineTo(210, 142);
      ctx.lineTo(200, 156);
      ctx.lineTo(190, 142);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5a2f8a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (has('lovemark')) {
      ctx.strokeStyle = '#c0302a';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(232, 132);
      ctx.lineTo(268, 130);
      ctx.moveTo(250, 118);
      ctx.lineTo(250, 160);
      ctx.moveTo(236, 150);
      ctx.lineTo(264, 158);
      ctx.moveTo(240, 143);
      ctx.lineTo(244, 136);
      ctx.stroke();
    }
  }

  // ---------- body & clothing ----------
  function torsoPath(L) {
    const sw = L.big ? 205 : L.f ? 150 : 176;
    const sy = L.f ? 424 : 412;
    const p = P();
    p.moveTo(200 - sw - 30, 520);
    p.bezierCurveTo(200 - sw - 18, sy + 34, 200 - sw + 8, sy, 200 - sw + 64, sy - 14);
    p.lineTo(166, 394);
    p.quadraticCurveTo(200, 402, 234, 394);
    p.lineTo(200 + sw - 64, sy - 14);
    p.bezierCurveTo(200 + sw - 8, sy, 200 + sw + 18, sy + 34, 200 + sw + 30, 520);
    p.closePath();
    return p;
  }
  function neckPath() {
    const p = P();
    p.moveTo(166, 300);
    p.lineTo(162, 402);
    p.quadraticCurveTo(200, 416, 238, 402);
    p.lineTo(234, 300);
    p.closePath();
    return p;
  }

  function drawClothes(ctx, L, outfitTag) {
    const tp = torsoPath(L);
    const top = L.top || '#777', top2 = L.top2 || U.shade(top, -0.3);
    const skinT = () => cel(ctx, tp, L.skin, { ox: 10, oy: 8, depth: 0.16 });
    const clip = (fn) => {
      ctx.save();
      ctx.clip(tp);
      fn();
      ctx.restore();
    };
    if (outfitTag === 'onsen') {
      skinT();
      // collarbones
      ctx.strokeStyle = U.rgba(U.shade(L.skin, -0.35), 0.7);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(150, 420);
      ctx.quadraticCurveTo(175, 426, 192, 418);
      ctx.moveTo(250, 420);
      ctx.quadraticCurveTo(225, 426, 208, 418);
      ctx.stroke();
      const t = P();
      t.moveTo(40, 520);
      t.quadraticCurveTo(60, 462, 120, 470);
      t.quadraticCurveTo(200, 480, 280, 470);
      t.quadraticCurveTo(340, 462, 360, 520);
      t.closePath();
      clip(() => cel(ctx, t, '#f6f3ec', { ox: 5, oy: 7, lw: 2 }));
      ctx.strokeStyle = 'rgba(160,190,210,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, 486);
      ctx.lineTo(290, 486);
      ctx.stroke();
      return;
    }
    if (outfitTag === 'night') {
      // silk sleeping robe, loosely tied: bare collarbones, satin sheen
      skinT();
      ctx.strokeStyle = U.rgba(U.shade(L.skin, -0.35), 0.7);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(150, 420);
      ctx.quadraticCurveTo(175, 426, 192, 418);
      ctx.moveTo(250, 420);
      ctx.quadraticCurveTo(225, 426, 208, 418);
      ctx.stroke();
      const SILK = { tsunade: '#6e2440', sakura: '#8a2a4a', hinata: '#4e3e86', ino: '#4a3a7a', tenten: '#7a2626', temari: '#27365e', naruto: '#2a2c3a' };
      const silk = SILK[L.id] || U.shade(U.mix(NR.CHARS[L.id] ? NR.CHARS[L.id].color : top, '#5a2a4a', 0.55), -0.1);
      const robe = P();
      robe.moveTo(0, 520);
      robe.lineTo(0, 440);
      robe.bezierCurveTo(40, 410, 110, 396, 150, 394);
      robe.bezierCurveTo(170, 440, 186, 480, 198, 520);
      robe.closePath();
      robe.moveTo(400, 520);
      robe.lineTo(400, 440);
      robe.bezierCurveTo(360, 410, 290, 396, 250, 394);
      robe.bezierCurveTo(232, 440, 214, 480, 202, 520);
      robe.closePath();
      clip(() => {
        cel(ctx, robe, silk, { ox: 6, oy: 6, lw: 2 });
        // satin highlights
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(60, 470);
        ctx.quadraticCurveTo(110, 430, 150, 418);
        ctx.moveTo(340, 470);
        ctx.quadraticCurveTo(290, 430, 252, 418);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(30, 510);
        ctx.quadraticCurveTo(80, 470, 130, 452);
        ctx.stroke();
      });
      // piping on the collar
      ctx.strokeStyle = U.light(silk, 0.35);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(150, 396);
      ctx.bezierCurveTo(170, 440, 186, 480, 198, 520);
      ctx.moveTo(250, 396);
      ctx.bezierCurveTo(232, 440, 214, 480, 202, 520);
      ctx.stroke();
      return;
    }
    if (outfitTag === 'kimono') {
      const base = U.mix(NR.CHARS[L.id] ? NR.CHARS[L.id].color : top, '#ffffff', 0.15);
      cel(ctx, tp, base);
      clip(() => {
        // floral pattern
        const rng = U.rng(U.strSeed(L.id || 'x'));
        ctx.fillStyle = U.rgba('#ffffff', 0.55);
        for (let i = 0; i < 14; i++) {
          const x = 30 + rng() * 340, y = 420 + rng() * 90;
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * U.TAU;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 3.5, a, 0, U.TAU);
            ctx.fill();
          }
        }
        const c = P();
        c.moveTo(150, 390);
        c.lineTo(178, 390);
        c.lineTo(236, 520);
        c.lineTo(196, 520);
        c.closePath();
        c.moveTo(250, 390);
        c.lineTo(222, 390);
        c.lineTo(206, 440);
        c.lineTo(226, 452);
        c.closePath();
        cel(ctx, c, '#f4ead8', { lw: 2 });
      });
      return;
    }
    switch (L.outfit) {
      case 'jacket': {
        cel(ctx, tp, top);
        clip(() => {
          if (L.id !== 'kiba') {
            const s = P();
            s.moveTo(0, 380);
            s.lineTo(400, 380);
            s.lineTo(400, 452);
            s.quadraticCurveTo(200, 488, 0, 452);
            s.closePath();
            cel(ctx, s, top2, { line: false });
          }
          ctx.strokeStyle = U.shade(top, -0.5);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(200, 420);
          ctx.lineTo(200, 520);
          ctx.stroke();
        });
        const col = P();
        col.moveTo(148, 392);
        col.quadraticCurveTo(200, 370, 252, 392);
        col.lineTo(246, 424);
        col.quadraticCurveTo(200, 408, 154, 424);
        col.closePath();
        cel(ctx, col, L.acc.includes('fur') ? top2 : top2, { lw: 2.2 });
        if (L.acc.includes('fur')) {
          const f = P();
          ell(f, 200, 402, 110, 26);
          cel(ctx, f, '#ece6da', { lw: 2 });
        }
        break;
      }
      case 'vest': {
        cel(ctx, tp, top2);
        const v = P();
        v.moveTo(40, 520);
        v.bezierCurveTo(50, 450, 90, 420, 150, 404);
        v.lineTo(186, 430);
        v.lineTo(186, 520);
        v.closePath();
        v.moveTo(360, 520);
        v.bezierCurveTo(350, 450, 310, 420, 250, 404);
        v.lineTo(214, 430);
        v.lineTo(214, 520);
        v.closePath();
        clip(() => cel(ctx, v, top));
        const roll = P();
        roll.moveTo(140, 400);
        roll.quadraticCurveTo(200, 376, 260, 400);
        roll.quadraticCurveTo(262, 418, 250, 424);
        roll.quadraticCurveTo(200, 400, 150, 424);
        roll.quadraticCurveTo(138, 418, 140, 400);
        roll.closePath();
        cel(ctx, roll, U.shade(top, 0.08), { lw: 2.2 });
        clip(() => {
          const pk = P();
          rr(pk, 90, 462, 70, 44, 10);
          rr(pk, 240, 462, 70, 44, 10);
          cel(ctx, pk, U.shade(top, -0.06), { lw: 2 });
        });
        break;
      }
      case 'qipao': {
        cel(ctx, tp, top);
        clip(() => {
          // bare shoulders (sleeveless)
          const s = P();
          s.moveTo(0, 520);
          s.lineTo(0, 400);
          s.lineTo(110, 400);
          s.bezierCurveTo(118, 440, 108, 480, 96, 520);
          s.closePath();
          s.moveTo(400, 520);
          s.lineTo(400, 400);
          s.lineTo(290, 400);
          s.bezierCurveTo(282, 440, 292, 480, 304, 520);
          s.closePath();
          cel(ctx, s, L.skin, { line: false, depth: 0.14 });
          ctx.strokeStyle = top2;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(200, 420);
          ctx.quadraticCurveTo(236, 432, 250, 474);
          ctx.stroke();
        });
        const col = P();
        rr(col, 162, 384, 76, 36, 12);
        cel(ctx, col, top, { lw: 2.2 });
        ctx.strokeStyle = top2;
        ctx.lineWidth = 4;
        ctx.stroke(col);
        break;
      }
      case 'crop': {
        skinT();
        const t = P();
        t.moveTo(88, 520);
        t.bezierCurveTo(92, 470, 110, 440, 150, 430);
        t.quadraticCurveTo(200, 470, 250, 430);
        t.bezierCurveTo(290, 440, 308, 470, 312, 520);
        t.closePath();
        clip(() => cel(ctx, t, top));
        ctx.strokeStyle = U.rgba(U.shade(L.skin, -0.35), 0.7);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(150, 416);
        ctx.quadraticCurveTo(175, 422, 192, 414);
        ctx.moveTo(250, 416);
        ctx.quadraticCurveTo(225, 422, 208, 414);
        ctx.stroke();
        break;
      }
      case 'kimono':
      case 'haori': {
        const base = L.outfit === 'haori' ? top : top;
        cel(ctx, tp, base);
        clip(() => {
          const c = P();
          const deep = L.outfit === 'haori' ? 60 : 20;
          c.moveTo(150, 392);
          c.lineTo(176, 392);
          c.lineTo(212 + deep * 0.1, 470 + deep);
          c.lineTo(196, 520);
          c.closePath();
          c.moveTo(250, 392);
          c.lineTo(224, 392);
          c.lineTo(202, 440 + deep * 0.6);
          c.lineTo(222, 462 + deep * 0.6);
          c.closePath();
          cel(ctx, c, top2 && L.outfit === 'kimono' ? U.mix(top2, '#ffffff', 0.25) : '#e8e2d8', { lw: 2 });
          if (L.outfit === 'haori') {
            // skin at the neckline
            const n = P();
            n.moveTo(176, 396);
            n.lineTo(224, 396);
            n.lineTo(202, 470);
            n.closePath();
            cel(ctx, n, L.skin, { line: false, depth: 0.14 });
            const h = P();
            h.moveTo(0, 520);
            h.lineTo(0, 410);
            h.bezierCurveTo(60, 400, 120, 396, 150, 400);
            h.bezierCurveTo(140, 450, 130, 490, 124, 520);
            h.closePath();
            h.moveTo(400, 520);
            h.lineTo(400, 410);
            h.bezierCurveTo(340, 400, 280, 396, 250, 400);
            h.bezierCurveTo(260, 450, 270, 490, 276, 520);
            h.closePath();
            cel(ctx, h, top2);
          }
        });
        break;
      }
      case 'robe': {
        cel(ctx, tp, '#27304d');
        clip(() => {
          const v = P();
          v.moveTo(90, 520);
          v.bezierCurveTo(100, 460, 120, 430, 158, 410);
          v.lineTo(186, 440);
          v.lineTo(186, 520);
          v.closePath();
          v.moveTo(310, 520);
          v.bezierCurveTo(300, 460, 280, 430, 242, 410);
          v.lineTo(214, 440);
          v.lineTo(214, 520);
          v.closePath();
          cel(ctx, v, '#6a8452');
          const h = P();
          h.moveTo(0, 520);
          h.lineTo(0, 412);
          h.bezierCurveTo(60, 402, 110, 400, 142, 404);
          h.bezierCurveTo(118, 450, 104, 490, 100, 520);
          h.closePath();
          h.moveTo(400, 520);
          h.lineTo(400, 412);
          h.bezierCurveTo(340, 402, 290, 400, 258, 404);
          h.bezierCurveTo(282, 450, 296, 490, 300, 520);
          h.closePath();
          cel(ctx, h, top);
        });
        break;
      }
      case 'cloak':
      case 'coat': {
        cel(ctx, tp, top);
        const col = P();
        col.moveTo(140, 420);
        col.lineTo(150, 318);
        col.quadraticCurveTo(200, 332, 250, 318);
        col.lineTo(260, 420);
        col.quadraticCurveTo(200, 440, 140, 420);
        col.closePath();
        cel(ctx, col, U.shade(top, 0.06), { lw: 2.4 });
        if (top2) {
          ctx.strokeStyle = top2;
          ctx.lineWidth = 4;
          ctx.stroke(col);
        }
        break;
      }
      case 'armor': {
        cel(ctx, tp, top);
        clip(() => {
          ctx.strokeStyle = top2;
          ctx.lineWidth = 7;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 450 + i * 26);
            ctx.quadraticCurveTo(200, 470 + i * 26, 400, 450 + i * 26);
            ctx.stroke();
          }
        });
        break;
      }
      case 'chef': {
        cel(ctx, tp, top);
        const col = P();
        col.moveTo(150, 396);
        col.lineTo(200, 452);
        col.lineTo(250, 396);
        col.lineTo(236, 392);
        col.lineTo(200, 432);
        col.lineTo(164, 392);
        col.closePath();
        cel(ctx, col, top2 || '#3a6ea5', { lw: 2 });
        break;
      }
      default:
        cel(ctx, tp, top);
    }
  }

  function drawNeckAcc(ctx, L) {
    const has = (a) => L.acc.includes(a);
    if (has('headband_neck')) {
      const b = P();
      rr(b, 158, 356, 84, 26, 10);
      cel(ctx, b, '#2a3550', { lw: 2 });
      const pl = P();
      rr(pl, 176, 352, 48, 32, 5);
      metal(ctx, pl, 352, 384);
      leaf(ctx, 200, 368, 8);
    }
    if (has('necklace')) {
      ctx.strokeStyle = '#3a3040';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(172, 380);
      ctx.quadraticCurveTo(200, 420, 228, 380);
      ctx.stroke();
      const g = P();
      rr(g, 192, 404, 16, 26, 4);
      cel(ctx, g, '#5fd18a', { lw: 1.6, ox: 3, oy: 4 });
    }
    if (has('earrings')) {
      ctx.fillStyle = '#e8c94a';
      for (const x of [92, 308]) {
        ctx.beginPath();
        ctx.arc(x, 290, 6, 0, U.TAU);
        ctx.fill();
      }
    }
  }

  function metal(ctx, path, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#f6f8fb');
    g.addColorStop(0.5, '#c7ced9');
    g.addColorStop(1, '#8a93a3');
    ctx.fillStyle = g;
    ctx.fill(path);
    ctx.strokeStyle = '#4a5262';
    ctx.lineWidth = 2;
    ctx.stroke(path);
  }
  function leaf(ctx, cx, cy, r, kind) {
    ctx.strokeStyle = '#3e4656';
    ctx.lineWidth = Math.max(1.5, r * 0.28);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (kind === 'sand') {
      ctx.moveTo(cx - r, cy - r * 0.8);
      ctx.lineTo(cx + r, cy - r * 0.8);
      ctx.lineTo(cx - r, cy + r * 0.8);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.closePath();
    } else {
      ctx.arc(cx - r * 0.15, cy + r * 0.1, r * 0.75, Math.PI * 0.15, Math.PI * 1.95);
      ctx.lineTo(cx + r * 1.1, cy - r * 0.9);
    }
    ctx.stroke();
    if (kind === 'slashed') {
      ctx.strokeStyle = '#2a2a34';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - r * 2.6, cy - r * 0.6);
      ctx.lineTo(cx + r * 2.6, cy + r * 0.8);
      ctx.stroke();
    }
  }

  function drawHeadband(ctx, L, kind) {
    const cloth = kind === 'bandana' ? (L.id === 'bandit' ? '#7a4a2a' : '#2b3550') : '#242a3c';
    const b = P();
    b.moveTo(92, 146);
    b.quadraticCurveTo(200, 108, 308, 146);
    b.lineTo(307, 178);
    b.quadraticCurveTo(200, 142, 93, 178);
    b.closePath();
    cel(ctx, b, cloth, { lw: 2.2, ox: 4, oy: 6 });
    const pl = P();
    rr(pl, 146, 122, 108, 46, 8);
    metal(ctx, pl, 122, 168);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(152, 127, 96, 5);
    leaf(ctx, 200, 146, 13, kind);
    ctx.fillStyle = '#6a7282';
    for (const x of [154, 246]) {
      ctx.beginPath();
      ctx.arc(x, 130, 2.2, 0, U.TAU);
      ctx.arc(x, 160, 2.2, 0, U.TAU);
      ctx.fill();
    }
  }

  function drawMask(ctx, L) {
    const m = P();
    m.moveTo(90, 262);
    m.quadraticCurveTo(200, 246, 310, 262);
    m.bezierCurveTo(306, 300, 290, 340, 250, 360);
    m.lineTo(240, 420);
    m.lineTo(160, 420);
    m.lineTo(150, 360);
    m.bezierCurveTo(110, 340, 94, 300, 90, 262);
    m.closePath();
    const col = L.acc.includes('mask') ? '#2a3350' : '#4a4a52';
    cel(ctx, m, col, { lw: 2.4, ox: 7, oy: 9 });
    ctx.strokeStyle = U.rgba(U.shade(col, -0.4), 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(196, 262);
    ctx.quadraticCurveTo(206, 290, 200, 300);
    ctx.stroke();
  }

  // ---------- hair (portrait scale) ----------
  function capPath(style) {
    const p = P();
    const hl = style === 'pineapple' || style === 'topknot' ? 112 : 124;
    p.moveTo(84, 250);
    p.bezierCurveTo(60, 40, 340, 40, 316, 250);
    p.lineTo(300, 250);
    p.bezierCurveTo(300, 170, 262, hl, 200, hl);
    p.bezierCurveTo(138, hl, 100, 170, 100, 250);
    p.closePath();
    return p;
  }
  const R = (a, l, w, t, b) => [a, l, w, t || 0, b || 0];
  const HS = {};
  HS.spiky = (H) => {
    ring(H.cap, 200, 150, 112, 104, [
      R(-178, 52, 58, -30), R(-156, 66, 60, -16), R(-134, 74, 60, -8), R(-112, 78, 60, -2),
      R(-90, 80, 60, 0), R(-68, 78, 60, 2), R(-46, 74, 60, 8), R(-24, 66, 60, 16), R(-2, 52, 58, 30),
      R(162, 42, 48, 30), R(18, 42, 48, -30), R(145, 30, 40, 40), R(35, 30, 40, -40),
    ]);
    spike(H.over, 138, 118, 118, 214, 40, 0.3, -4);
    spike(H.over, 168, 110, 162, 180, 34);
    spike(H.over, 232, 110, 238, 180, 34);
    spike(H.over, 262, 118, 282, 214, 40, 0.3, 4);
    spike(H.front, 100, 170, 92, 262, 30, 0.25);
    spike(H.front, 300, 170, 308, 262, 30, 0.25);
  };
  HS.sasuke = (H) => {
    ring(H.cap, 200, 146, 108, 100, [R(-160, 56, 60, -30), R(-130, 50, 56, -20), R(-50, 50, 56, 20), R(-20, 56, 60, 30), R(-90, 36, 56, 0)]);
    ring(H.back, 200, 170, 120, 110, [R(-150, 70, 64, -40), R(-30, 70, 64, 40), R(-170, 60, 56, -60), R(-10, 60, 56, 60)]);
    spike(H.front, 116, 130, 100, 330, 54, 0.22, -10);
    spike(H.front, 284, 130, 300, 330, 54, 0.22, 10);
    spike(H.front, 238, 110, 268, 300, 66, 0.25, 8);
    spike(H.front, 166, 116, 156, 206, 46);
    spike(H.front, 204, 110, 204, 190, 40);
  };
  HS.kakashi = (H) => {
    ring(H.cap, 206, 146, 110, 102, [
      R(-172, 50, 56, 12), R(-148, 72, 62, 24), R(-124, 92, 66, 30), R(-100, 104, 68, 34),
      R(-76, 104, 68, 38), R(-52, 96, 66, 40), R(-28, 80, 62, 38), R(-4, 62, 56, 34), R(18, 44, 48, 26),
    ]);
    spike(H.front, 150, 118, 138, 200, 40);
    spike(H.front, 198, 112, 204, 190, 40);
    spike(H.front, 244, 116, 262, 196, 40);
  };
  HS.bob = (H) => {
    const s = H.back;
    s.moveTo(88, 150);
    s.bezierCurveTo(70, 250, 76, 330, 92, 372);
    s.quadraticCurveTo(122, 386, 144, 360);
    s.lineTo(132, 200);
    s.closePath();
    s.moveTo(312, 150);
    s.bezierCurveTo(330, 250, 324, 330, 308, 372);
    s.quadraticCurveTo(278, 386, 256, 360);
    s.lineTo(268, 200);
    s.closePath();
    const f = H.front;
    f.moveTo(192, 96);
    f.bezierCurveTo(120, 102, 90, 170, 94, 280);
    f.quadraticCurveTo(116, 210, 150, 196);
    f.quadraticCurveTo(174, 150, 192, 96);
    f.closePath();
    f.moveTo(208, 96);
    f.bezierCurveTo(280, 102, 310, 170, 306, 280);
    f.quadraticCurveTo(284, 210, 250, 196);
    f.quadraticCurveTo(226, 150, 208, 96);
    f.closePath();
    H.forehead = true;
  };
  HS.hime = (H) => {
    const b = H.back;
    b.moveTo(92, 170);
    b.bezierCurveTo(60, 300, 50, 420, 44, 520);
    b.lineTo(356, 520);
    b.bezierCurveTo(350, 420, 340, 300, 308, 170);
    b.closePath();
    const f = H.front;
    f.moveTo(98, 150);
    f.quadraticCurveTo(200, 84, 302, 150);
    f.lineTo(301, 196);
    f.lineTo(99, 196);
    f.closePath();
    spike(f, 106, 170, 112, 420, 44, 0.12, 4);
    spike(f, 294, 170, 288, 420, 44, 0.12, -4);
    H.strands = [[140, 128, 140, 194], [172, 116, 172, 194], [228, 116, 228, 194], [260, 128, 260, 194]];
  };
  HS.ponytail = (H) => {
    spike(H.back, 280, 150, 360, 500, 70, 0.3, 30);
    const f = H.front;
    f.moveTo(250, 96);
    f.bezierCurveTo(150, 100, 96, 150, 92, 250);
    f.quadraticCurveTo(94, 310, 116, 330);
    f.quadraticCurveTo(128, 260, 176, 232);
    f.quadraticCurveTo(210, 160, 250, 96);
    f.closePath();
    spike(f, 276, 118, 300, 214, 42);
    spike(f, 300, 150, 312, 280, 34, 0.2);
    H.tie = [300, 92];
  };
  HS.buns = (H) => {
    ell(H.pre, 110, 82, 50, 48);
    ell(H.pre, 290, 82, 50, 48);
    spike(H.front, 190, 104, 120, 210, 56, 0.3);
    spike(H.front, 210, 104, 280, 210, 56, 0.3);
    spike(H.front, 100, 170, 96, 280, 30, 0.2);
    spike(H.front, 300, 170, 304, 280, 30, 0.2);
    H.forehead = true;
  };
  HS.quad = (H) => {
    spike(H.pre, 112, 124, 26, 98, 62, 0.3);
    spike(H.pre, 288, 124, 374, 98, 62, 0.3);
    spike(H.pre, 110, 220, 30, 280, 62, 0.3);
    spike(H.pre, 290, 220, 370, 280, 62, 0.3);
    spike(H.front, 140, 116, 116, 206, 42);
    spike(H.front, 176, 108, 168, 186, 40);
    spike(H.front, 224, 108, 232, 186, 40);
    spike(H.front, 260, 116, 284, 206, 42);
    spike(H.front, 98, 170, 92, 270, 30, 0.2);
    spike(H.front, 302, 170, 308, 270, 30, 0.2);
  };
  HS.twintails = (H) => {
    spike(H.back, 96, 250, 60, 520, 62, 0.22, -12);
    spike(H.back, 304, 250, 340, 520, 62, 0.22, 12);
    const f = H.front;
    f.moveTo(192, 96);
    f.bezierCurveTo(118, 106, 90, 170, 92, 300);
    f.quadraticCurveTo(116, 220, 152, 196);
    f.quadraticCurveTo(172, 150, 192, 96);
    f.closePath();
    f.moveTo(208, 96);
    f.bezierCurveTo(282, 106, 310, 170, 308, 300);
    f.quadraticCurveTo(284, 220, 248, 196);
    f.quadraticCurveTo(228, 150, 208, 96);
    f.closePath();
    H.forehead = true;
    H.ties = [[96, 262], [304, 262]];
  };
  HS.short = (H) => {
    const s = H.back;
    s.moveTo(88, 150);
    s.bezierCurveTo(74, 230, 80, 290, 94, 316);
    s.lineTo(130, 300);
    s.lineTo(126, 180);
    s.closePath();
    s.moveTo(312, 150);
    s.bezierCurveTo(326, 230, 320, 290, 306, 316);
    s.lineTo(270, 300);
    s.lineTo(274, 180);
    s.closePath();
    const f = H.front;
    f.moveTo(98, 150);
    f.quadraticCurveTo(200, 86, 302, 150);
    f.lineTo(298, 186);
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const x = 298 - (196 / n) * i;
      f.lineTo(x + 196 / n / 2, 170 + (i % 2) * 6);
      f.lineTo(x, 190 + ((i + 1) % 2) * 4);
    }
    f.lineTo(102, 186);
    f.closePath();
  };
  HS.neat = (H) => {
    HS.short(H);
  };
  HS.pineapple = (H) => {
    ring(H.pre, 200, 62, 26, 22, [R(-160, 58, 44, 20), R(-130, 74, 46, 8), R(-100, 84, 48, 0), R(-80, 84, 48, 0), R(-50, 74, 46, -8), R(-20, 58, 44, -20)]);
    H.ties = [[200, 64]];
  };
  HS.topknot = (H) => {
    ring(H.pre, 200, 66, 16, 14, [R(-130, 40, 36, 10), R(-90, 48, 38, 0), R(-50, 40, 36, -10)]);
  };
  HS.bowl = (H) => {
    const s = H.front;
    s.moveTo(86, 130);
    s.bezierCurveTo(80, 190, 84, 250, 90, 264);
    s.lineTo(126, 264);
    s.lineTo(126, 176);
    s.lineTo(274, 176);
    s.lineTo(274, 264);
    s.lineTo(310, 264);
    s.bezierCurveTo(316, 250, 320, 190, 314, 130);
    s.bezierCurveTo(290, 50, 110, 50, 86, 130);
    s.closePath();
    H.noCap = true;
    H.gloss = true;
  };
  HS.messy = (H) => {
    ring(H.cap, 200, 146, 114, 104, [
      R(-178, 44, 52, -30), R(-154, 52, 54, -20), R(-130, 46, 52, 10), R(-106, 56, 54, -10),
      R(-82, 48, 52, 14), R(-58, 54, 54, 0), R(-34, 46, 52, 20), R(-10, 46, 52, 30), R(165, 36, 46, 20), R(15, 36, 46, -20),
    ]);
    spike(H.front, 146, 118, 128, 200, 40);
    spike(H.front, 184, 110, 188, 190, 38);
    spike(H.front, 224, 110, 216, 188, 38);
    spike(H.front, 262, 118, 280, 200, 40);
  };
  HS.wild_long = (H) => {
    HS.messy(H);
    spike(H.back, 96, 200, 50, 480, 90, 0.3);
    spike(H.back, 304, 200, 350, 480, 90, 0.3);
  };
  HS.short_spiky = (H) => {
    ring(H.cap, 200, 148, 110, 100, [R(-166, 40, 52, -20), R(-138, 46, 52, -10), R(-110, 48, 52, 0), R(-82, 48, 52, 6), R(-54, 46, 52, 14), R(-26, 40, 52, 20)]);
    spike(H.front, 146, 118, 136, 198, 42);
    spike(H.front, 182, 110, 178, 186, 40);
    spike(H.front, 216, 112, 218, 170, 34);
  };
  HS.side_long = (H) => {
    HS.short(H);
    const f = H.front;
    f.moveTo(236, 98);
    f.bezierCurveTo(150, 104, 104, 150, 100, 240);
    f.quadraticCurveTo(102, 300, 120, 320);
    f.quadraticCurveTo(132, 260, 172, 236);
    f.quadraticCurveTo(204, 160, 236, 98);
    f.closePath();
  };
  HS.long = (H) => {
    const b = H.back;
    b.moveTo(92, 170);
    b.bezierCurveTo(64, 290, 60, 380, 60, 470);
    b.lineTo(340, 470);
    b.bezierCurveTo(340, 380, 336, 290, 308, 170);
    b.closePath();
    const f = H.front;
    f.moveTo(192, 96);
    f.bezierCurveTo(118, 106, 90, 170, 92, 320);
    f.quadraticCurveTo(116, 220, 152, 196);
    f.quadraticCurveTo(172, 150, 192, 96);
    f.closePath();
    f.moveTo(208, 96);
    f.bezierCurveTo(282, 106, 310, 170, 308, 320);
    f.quadraticCurveTo(284, 220, 248, 196);
    f.quadraticCurveTo(228, 150, 208, 96);
    f.closePath();
  };
  HS.long_white = (H) => {
    HS.long(H);
    const b = H.back;
    b.moveTo(70, 400);
    b.lineTo(50, 520);
    b.lineTo(350, 520);
    b.lineTo(330, 400);
    b.closePath();
  };
  HS.long_flow = (H) => {
    HS.long(H);
    spike(H.back, 90, 260, 36, 520, 80, 0.3, -20);
    spike(H.back, 310, 260, 364, 520, 80, 0.3, 20);
  };
  HS.ponytail_low = (H) => {
    HS.short(H);
    spike(H.back, 300, 250, 330, 470, 54, 0.22, 10);
  };
  HS.bun = (H) => {
    HS.short(H);
    ell(H.pre, 200, 58, 52, 42);
    H.pin = true;
  };
  HS.anko = (H) => {
    ring(H.pre, 262, 90, 20, 20, [R(-110, 60, 44, 0), R(-80, 72, 46, 0), R(-50, 70, 46, 0), R(-20, 62, 44, 0), R(10, 50, 40, 0)]);
    spike(H.front, 146, 118, 124, 206, 40);
    spike(H.front, 182, 110, 170, 196, 40);
    spike(H.front, 222, 110, 228, 186, 36);
    spike(H.front, 258, 118, 282, 206, 40);
    spike(H.front, 100, 170, 94, 270, 28, 0.2);
    spike(H.front, 300, 170, 306, 270, 28, 0.2);
  };
  HS.bald = (H) => {
    H.noCap = true;
    ell(H.front, 96, 220, 16, 34);
    ell(H.front, 304, 220, 16, 34);
  };
  HS.chef = (H) => {
    HS.short(H);
    H.hat = 'chef';
  };
  HS.bandana = (H) => {
    HS.short(H);
    spike(H.back, 96, 220, 90, 360, 50, 0.2);
    spike(H.back, 304, 220, 310, 360, 50, 0.2);
    H.hat = 'bandana';
  };
  HS.hood = (H) => {
    H.noCap = true;
    H.hat = 'hood';
  };
  HS.masked = (H) => {
    H.noCap = true;
    H.hat = 'hood';
    H.maskFace = true;
  };
  HS.none = (H) => {
    H.noCap = true;
  };

  function hairCel(ctx, path, col) {
    cel(ctx, path, col, { ox: 12, oy: 15, depth: 0.3, lw: 2.8 });
  }
  function hairShine(ctx, path, col, H) {
    ctx.save();
    ctx.clip(path);
    ctx.strokeStyle = U.rgba(U.light(col, 0.6), 0.7);
    ctx.lineCap = 'round';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(200, 170, 96, Math.PI * 1.16, Math.PI * 1.34);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(200, 170, 96, Math.PI * 1.4, Math.PI * 1.5);
    ctx.stroke();
    if (H.gloss) {
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(200, 170, 80, Math.PI * 1.58, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHat(ctx, L, H) {
    if (H.hat === 'chef') {
      const p = P();
      p.moveTo(110, 150);
      p.lineTo(114, 80);
      p.quadraticCurveTo(100, 10, 160, 22);
      p.quadraticCurveTo(200, -10, 240, 22);
      p.quadraticCurveTo(300, 10, 286, 80);
      p.lineTo(290, 150);
      p.quadraticCurveTo(200, 170, 110, 150);
      p.closePath();
      cel(ctx, p, '#f7f5ef', { lw: 2.4, ox: 8, oy: 8 });
    } else if (H.hat === 'bandana') {
      const p = P();
      p.moveTo(88, 150);
      p.bezierCurveTo(70, 30, 330, 30, 312, 150);
      p.quadraticCurveTo(200, 122, 88, 150);
      p.closePath();
      cel(ctx, p, '#f4f2ec', { lw: 2.4, ox: 8, oy: 10 });
    } else if (H.hat === 'hood') {
      const col = L.hairColor;
      const p = P();
      p.moveTo(70, 340);
      p.bezierCurveTo(30, 20, 370, 20, 330, 340);
      p.lineTo(292, 370);
      p.bezierCurveTo(318, 190, 270, 118, 200, 118);
      p.bezierCurveTo(130, 118, 82, 190, 108, 370);
      p.closePath();
      cel(ctx, p, col, { lw: 2.6 });
      if (H.maskFace) {
        const m = P();
        m.moveTo(112, 170);
        m.quadraticCurveTo(200, 110, 288, 170);
        m.bezierCurveTo(300, 280, 260, 350, 200, 360);
        m.bezierCurveTo(140, 350, 100, 280, 112, 170);
        m.closePath();
        cel(ctx, m, '#f1efe9', { lw: 2.4, ox: 8, oy: 10 });
        ctx.fillStyle = OUT;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(200 + side * 52, 236, 30, 12, side * -0.28, 0, U.TAU);
          ctx.fill();
          ctx.fillStyle = L.eyes && L.eyes !== '#222' ? L.eyes : '#1a1418';
          ctx.beginPath();
          ctx.arc(200 + side * 52, 236, 5, 0, U.TAU);
          ctx.fill();
          ctx.fillStyle = OUT;
        }
        ctx.fillStyle = L.id === 'nue' ? '#c23a3a' : L.top2 || '#7a5ab8';
        ctx.beginPath();
        ctx.moveTo(170, 300);
        ctx.quadraticCurveTo(200, 340, 230, 300);
        ctx.quadraticCurveTo(200, 320, 170, 300);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(200, 160, 14, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = '#f1efe9';
        ctx.beginPath();
        ctx.arc(207, 155, 12, 0, U.TAU);
        ctx.fill();
      }
    }
  }

  function drawBackAcc(ctx, L) {
    const has = (a) => L.acc.includes(a);
    if (has('fan')) {
      const p = P();
      rr(p, 292, 60, 70, 460, 20);
      cel(ctx, p, '#6a4a3a', { lw: 2.4 });
      ctx.fillStyle = '#e9e1cc';
      ctx.fillRect(296, 80, 62, 30);
    }
    if (has('gourd')) {
      const p = P();
      ell(p, 320, 230, 56, 58);
      ell(p, 332, 420, 86, 100);
      cel(ctx, p, '#c4a879', { lw: 2.4 });
      const b = P();
      rr(b, 296, 160, 50, 24, 8);
      cel(ctx, b, '#8a4a2a', { lw: 2 });
    }
    if (has('sword')) {
      const p = P();
      spike(p, 290, 420, 350, 180, 20, 0.02);
      cel(ctx, p, '#3a3a50', { lw: 2 });
      const h = P();
      rr(h, 336, 140, 26, 60, 6);
      cel(ctx, h, '#b09a6a', { lw: 2 });
    }
    if (has('scroll_back')) {
      const p = P();
      rr(p, 300, 280, 40, 200, 18);
      cel(ctx, p, '#e8dcc0', { lw: 2.2 });
    }
  }

  // ---------- specials ----------
  function drawFox(ctx, emo) {
    const E = EMO[emo] || EMO.neutral;
    const col = '#e8612c';
    // ears
    const ears = P();
    spike(ears, 120, 170, 60, 20, 90, 0.2);
    spike(ears, 280, 170, 340, 20, 90, 0.2);
    cel(ctx, ears, col, { lw: 3 });
    ctx.fillStyle = '#3a1a14';
    ctx.beginPath();
    ctx.moveTo(98, 150);
    ctx.lineTo(70, 50);
    ctx.lineTo(128, 130);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(302, 150);
    ctx.lineTo(330, 50);
    ctx.lineTo(272, 130);
    ctx.fill();
    const h = P();
    h.moveTo(60, 230);
    h.bezierCurveTo(60, 100, 340, 100, 340, 230);
    h.bezierCurveTo(350, 300, 290, 380, 200, 420);
    h.bezierCurveTo(110, 380, 50, 300, 60, 230);
    h.closePath();
    // cheek fur
    spike(h, 80, 300, 10, 350, 70, 0.2);
    spike(h, 320, 300, 390, 350, 70, 0.2);
    cel(ctx, h, col, { lw: 3.2 });
    // markings
    ctx.fillStyle = '#9a2a14';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(200 + s * 40, 180);
      ctx.quadraticCurveTo(200 + s * 120, 200, 200 + s * 150, 260);
      ctx.quadraticCurveTo(200 + s * 100, 220, 200 + s * 40, 200);
      ctx.fill();
    }
    // eyes
    for (const s of [-1, 1]) {
      const cx = 200 + s * 74, cy = 236;
      ctx.fillStyle = '#b01e14';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 46, 24 * (E.open || 1), s * 0.3, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#f6c343';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 38, 18 * (E.open || 1), s * 0.3, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#1a0a08';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 5, 17 * (E.open || 1), 0, 0, U.TAU);
      ctx.fill();
    }
    // muzzle + mouth
    const m = P();
    ell(m, 200, 330, 80, 56);
    cel(ctx, m, '#f5e9da', { lw: 2.4, ox: 6, oy: 8 });
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath();
    ctx.ellipse(200, 296, 20, 13, 0, 0, U.TAU);
    ctx.fill();
    const grin = E.mouth === 'open_smile' || E.mouth === 'shout' || E.mouth === 'smirk';
    ctx.fillStyle = '#5a0e0e';
    ctx.beginPath();
    if (grin) {
      ctx.moveTo(130, 330);
      ctx.quadraticCurveTo(200, 400, 270, 330);
      ctx.quadraticCurveTo(200, 360, 130, 330);
    } else {
      ctx.moveTo(150, 340);
      ctx.quadraticCurveTo(200, 356, 250, 340);
      ctx.quadraticCurveTo(200, 350, 150, 340);
    }
    ctx.fill();
    if (grin) {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) {
        const x = 146 + i * 22;
        ctx.beginPath();
        ctx.moveTo(x, 336 + Math.abs(i - 2.5) * -2);
        ctx.lineTo(x + 8, 352);
        ctx.lineTo(x + 16, 338 + Math.abs(i - 2.5) * -2);
        ctx.fill();
      }
    }
  }

  function drawDog(ctx) {
    const col = '#f2eee6';
    const h = P();
    ell(h, 200, 250, 150, 140);
    cel(ctx, h, col, { lw: 3 });
    const ears = P();
    ell(ears, 70, 220, 44, 90, 0.4);
    ell(ears, 330, 220, 44, 90, -0.4);
    cel(ctx, ears, '#e2d6c0', { lw: 3 });
    const m = P();
    ell(m, 200, 320, 80, 60);
    cel(ctx, m, '#fbf8f2', { lw: 2.4 });
    ctx.fillStyle = '#1a1414';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(200 + s * 58, 230, 14, 0, U.TAU);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(200, 290, 24, 16, 0, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = '#d9534f';
    ctx.beginPath();
    ctx.ellipse(200, 356, 22, 18, 0, 0, U.TAU);
    ctx.fill();
  }

  // Her real age: soft lines at the eyes and mouth (Tsunade without her Transformation).
  function drawAgeLines(ctx, L) {
    ctx.save();
    ctx.strokeStyle = U.rgba(U.shade(L.skin, -0.45), 0.62);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const s of [-1, 1]) {
      const ex = 200 + s * 96;
      // crow's feet
      for (const [dy, len] of [[-6, 16], [4, 18], [14, 14]]) {
        ctx.moveTo(ex, 238 + dy);
        ctx.quadraticCurveTo(ex + s * len * 0.5, 238 + dy + 2, ex + s * len, 238 + dy + (dy > 0 ? 5 : -3));
      }
      // lines under the eyes
      ctx.moveTo(200 + s * 34, 268);
      ctx.quadraticCurveTo(200 + s * 56, 276, 200 + s * 80, 268);
      // smile lines
      ctx.moveTo(200 + s * 40, 300);
      ctx.quadraticCurveTo(200 + s * 50, 330, 200 + s * 36, 352);
    }
    ctx.stroke();
    ctx.restore();
  }
  // Silvering hair: tint the hair shapes toward silver, then add soft, broad streaks.
  function silverTint(ctx, path) {
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = 'rgba(214,216,226,0.32)';
    ctx.fillRect(0, 0, 400, 520);
    ctx.restore();
  }
  function silverStreaks(ctx, H, cap) {
    const clipP = new Path2D();
    clipP.addPath(H.front);
    if (cap) clipP.addPath(cap);
    silverTint(ctx, clipP);
    ctx.save();
    ctx.clip(clipP);
    ctx.lineCap = 'round';
    const r = U.rng(56);
    for (let i = 0; i < 9; i++) {
      const x = 110 + r() * 180, y = 30 + r() * 60;
      ctx.strokeStyle = `rgba(240,242,248,${0.25 + r() * 0.2})`;
      ctx.lineWidth = 8 + r() * 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + (r() - 0.5) * 20, y + 50, x + (x < 200 ? -30 : 30), y + 110, x + (x < 200 ? -50 : 50), y + 200);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- assemble ----------
  function render(ch, emo, outfit, scale) {
    const L = NR.spritegen.normLook(ch.look);
    L.id = ch.id;
    const E = EMO[emo] || EMO.neutral;
    const c = U.canvas(PG.W * scale, PG.H * scale);
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (L.build === 'fox') {
      drawFox(ctx, emo);
      return c;
    }
    if (L.build === 'dog') {
      drawDog(ctx);
      return c;
    }
    const H = { back: P(), pre: P(), cap: P(), front: P(), over: P() };
    (HS[L.style] || HS.short)(H);
    const col = L.hairColor;
    // outfit may combine tags, e.g. "onsen+aged"
    const tags = String(outfit || '').split('+').filter(Boolean);
    const aged = tags.includes('aged');
    outfit = tags.find((t) => t !== 'aged') || null;
    const onsen = outfit === 'onsen';

    if (!onsen && outfit !== 'night') drawBackAcc(ctx, L);
    hairCel(ctx, H.back, col);
    if (aged) silverTint(ctx, H.back);
    drawClothes(ctx, L, outfit);
    const np = neckPath();
    cel(ctx, np, L.skin, { ox: 8, oy: 0, depth: 0.18, lw: 2.2 });
    // chin shadow on neck
    ctx.save();
    ctx.clip(np);
    ctx.fillStyle = U.rgba(U.shadow(L.skin, 0.32), 0.6);
    ctx.translate(0, 26);
    ctx.fill(facePath(L));
    ctx.restore();
    const bare = onsen || outfit === 'kimono' || outfit === 'night';
    if (L.outfit === 'cloak' || L.outfit === 'coat') {
      if (!bare) drawClothes(ctx, L, outfit); // collar over neck
    }
    if (!bare) drawNeckAcc(ctx, L);
    else if (L.acc.includes('necklace')) drawNeckAcc(ctx, { acc: ['necklace'] });
    // ears
    for (const s of [-1, 1]) {
      const e = P();
      ell(e, 200 + s * 104, 250, 16, 30, s * -0.15);
      cel(ctx, e, L.skin, { ox: 4, oy: 4, depth: 0.2, lw: 2.2 });
    }
    const fp = facePath(L);
    cel(ctx, fp, L.skin, { ox: 10, oy: 8, depth: 0.14, lw: 2.8, grad: [120, 360] });
    // hair shadow on forehead
    if (!H.noCap || L.style === 'bowl') {
      ctx.save();
      ctx.clip(fp);
      ctx.fillStyle = U.rgba(U.shadow(L.skin, 0.34), 0.55);
      ctx.translate(4, 16);
      const sh = new Path2D();
      sh.addPath(capPath(L.style));
      sh.addPath(H.front);
      ctx.fill(sh);
      ctx.restore();
    }
    drawCheeks(ctx, L, E);
    if (!L.acc.includes('glasses') && !H.maskFace) {
      drawEye(ctx, L, -1, E, emo);
      drawEye(ctx, L, 1, E, emo);
    }
    drawBrows(ctx, L, E);
    const masked = L.acc.includes('mask') || L.acc.includes('facecloth');
    if (!masked && L.style !== 'hood') drawMouth(ctx, L, E);
    drawFaceMarks(ctx, L, E);
    if (aged) drawAgeLines(ctx, L);
    if (masked) drawMask(ctx, L);
    if (L.acc.includes('glasses')) {
      ctx.fillStyle = '#16181e';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(200 + s * 54, 236, 46, 34, 0, 0, U.TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(160,200,255,0.4)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(200 + s * 54 - 14, 226, 14, 8, -0.5, 0, U.TAU);
        ctx.fill();
      }
      ctx.strokeStyle = '#16181e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(180, 232);
      ctx.lineTo(220, 232);
      ctx.stroke();
    }
    // hair
    hairCel(ctx, H.pre, col);
    if (!H.noCap) {
      const cap = capPath(L.style);
      cap.addPath(H.cap);
      hairCel(ctx, cap, col);
      hairShine(ctx, cap, col, H);
    }
    hairCel(ctx, H.front, col);
    if (H.gloss) hairShine(ctx, H.front, col, H);
    if (aged) silverStreaks(ctx, H, H.noCap ? null : capPath(L.style));
    if (H.strands) {
      ctx.strokeStyle = U.rgba(U.shade(col, -0.45), 0.8);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (const s of H.strands) {
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[2], s[3]);
      }
      ctx.stroke();
    }
    // forehead protectors come off in the bath, in a yukata and in nightwear
    const casual = onsen || outfit === 'kimono' || outfit === 'night';
    const has = (a) => L.acc.includes(a) && !(casual && /^(headband|bandana)/.test(a));
    if (has('headband')) drawHeadband(ctx, L, 'leaf');
    if (has('headband_sand')) drawHeadband(ctx, L, 'sand');
    if (has('headband_slashed')) drawHeadband(ctx, L, 'slashed');
    if (has('bandana')) drawHeadband(ctx, L, 'bandana');
    hairCel(ctx, H.over, col);
    if (H.ties || H.tie) {
      ctx.fillStyle = L.id === 'tsunade' ? '#6a4a8a' : L.id === 'ino' ? '#a07ad0' : '#3a3440';
      for (const [x, y] of H.ties || [H.tie]) {
        ctx.beginPath();
        ctx.ellipse(x, y, 16, 11, 0, 0, U.TAU);
        ctx.fill();
      }
    }
    if (H.pin) {
      ctx.strokeStyle = '#c9a24a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(140, 70);
      ctx.lineTo(262, 44);
      ctx.stroke();
    }
    drawHat(ctx, L, H);
    drawForehead(ctx, L, H);
    return c;
  }

  const MAX = 28;
  PG.get = function (id, emo = 'neutral', outfit = null, scale) {
    const ch = NR.CHARS[id];
    if (!ch) return null;
    const s = scale || NR.engine.cpr * 0.95;
    const key = `${id}|${emo}|${outfit || ''}|${s.toFixed(2)}`;
    let c = PG.cache.get(key);
    if (c) {
      PG.cache.delete(key);
      PG.cache.set(key, c);
      return c;
    }
    c = render(ch, emo, outfit, s);
    PG.cache.set(key, c);
    while (PG.cache.size > MAX) PG.cache.delete(PG.cache.keys().next().value);
    return c;
  };
  PG.render = render;
  NR.engine && NR.engine.on && NR.engine.on('cprchange', () => PG.cache.clear());
})();
