// Procedural chibi sprite sheets in RPG Maker layout (3 frames x 4 directions:
// down, left, right, up). Drawn with vector shapes + cel shading + outline.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const SG = (NR.spritegen = { cache: {} });
  const OUT = '#2a1c26';
  const D2R = Math.PI / 180;

  // ---------- path helpers ----------
  function P() {
    return new Path2D();
  }
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
  function poly(p, pts) {
    p.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
    p.closePath();
  }
  // Tapered spike/strand from base (bx,by) to tip (tx,ty), base width w.
  function spike(p, bx, by, tx, ty, w, bulge = 0.28, bend = 0) {
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
  // spikes arranged around an ellipse: [angleDeg, len, width, tiltDeg, bend]
  function spikeRing(p, cx, cy, rx, ry, list) {
    for (const s of list) {
      const [ang, len, w, tilt = 0, bend = 0] = s;
      const a = ang * D2R;
      const bx = cx + Math.cos(a) * rx, by = cy + Math.sin(a) * ry;
      const d = (ang + tilt) * D2R;
      // start slightly inside so spikes merge with the cap
      const ix = cx + Math.cos(a) * rx * 0.72, iy = cy + Math.sin(a) * ry * 0.72;
      spike(p, ix, iy, bx + Math.cos(d) * len, by + Math.sin(d) * len, w, 0.3, bend);
    }
  }

  // Cel-shaded fill: whole shape in shadow tone, then base tone shifted up-left.
  function cel(ctx, path, base, o = {}) {
    const sh = o.shadow || U.shadow(base, o.depth || 0.22);
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = sh;
    ctx.fill(path);
    ctx.translate(-(o.ox != null ? o.ox : 1.0), -(o.oy != null ? o.oy : 1.15));
    ctx.fillStyle = base;
    ctx.fill(path);
    ctx.restore();
    if (o.line !== false) {
      ctx.lineWidth = o.lw || 0.5;
      ctx.strokeStyle = o.lineColor || U.mix(U.shade(base, -0.6), OUT, 0.4);
      ctx.stroke(path);
    }
  }
  function fill(ctx, path, color) {
    ctx.fillStyle = color;
    ctx.fill(path);
  }
  function shine(ctx, clipPath, color, fn) {
    ctx.save();
    ctx.clip(clipPath);
    ctx.strokeStyle = U.rgba(U.light(color, 0.55), 0.75);
    ctx.lineCap = 'round';
    fn(ctx);
    ctx.restore();
  }

  // ---------- defaults ----------
  const OUTFIT_BOTTOM = {
    jacket: 'pants', vest: 'pants', qipao: 'shorts', crop: 'skirt', kimono: 'long', robe: 'pants',
    cloak: 'pants', coat: 'pants', haori: 'pants', armor: 'pants', chef: 'pants', none: 'none',
  };
  const OVERCOAT = { robe: 43, cloak: 41.5, coat: 41, haori: 42 };

  function normLook(look) {
    const L = Object.assign({}, look);
    L.acc = L.acc || [];
    L.has = (a) => L.acc.includes(a);
    L.bottomType = L.bottomType || OUTFIT_BOTTOM[L.outfit] || 'pants';
    L.f = L.build === 'f';
    L.big = L.build === 'big';
    L.hairColor = (L.hair && L.hair.color) || '#333';
    L.style = (L.hair && L.hair.style) || 'short';
    return L;
  }

  // ---------- body ----------
  function torsoPath(L, view, bob) {
    const p = P(), y = bob;
    if (view === 'side') {
      const w = L.big ? 7.5 : L.f ? 5.1 : 5.6;
      p.moveTo(24 - w + 0.6, 25.8 + y);
      p.quadraticCurveTo(24 - w - 0.6, 27 + y, 24 - w + (L.big ? -1.2 : 0.2), 31 + y);
      p.lineTo(24 - w + (L.f ? 0.6 : 0.5), 36.8 + y);
      p.lineTo(24 + w - 0.2, 36.8 + y);
      p.quadraticCurveTo(24 + w + (L.big ? 1.5 : 0.4), 30 + y, 24 + w - 0.3, 26.4 + y);
      p.quadraticCurveTo(24 + w - 1.2, 25.6 + y, 24 + 1, 25.6 + y);
      p.closePath();
      return p;
    }
    if (L.big) {
      p.moveTo(19, 25.6 + y);
      p.quadraticCurveTo(14.2, 26, 14.4, 29.5 + y);
      p.quadraticCurveTo(13.6, 35.5 + y, 17.4, 37 + y);
      p.lineTo(30.6, 37 + y);
      p.quadraticCurveTo(34.4, 35.5 + y, 33.6, 29.5 + y);
      p.quadraticCurveTo(33.8, 26, 29, 25.6 + y);
      p.closePath();
    } else if (L.f) {
      p.moveTo(20.2, 25.7 + y);
      p.quadraticCurveTo(17.3, 25.9 + y, 17.6, 28.2 + y);
      p.quadraticCurveTo(18.3, 30.8 + y, 19.3, 32.8 + y);
      p.quadraticCurveTo(18.1, 34.8 + y, 18.4, 36.8 + y);
      p.lineTo(29.6, 36.8 + y);
      p.quadraticCurveTo(29.9, 34.8 + y, 28.7, 32.8 + y);
      p.quadraticCurveTo(29.7, 30.8 + y, 30.4, 28.2 + y);
      p.quadraticCurveTo(30.7, 25.9 + y, 27.8, 25.7 + y);
      p.closePath();
    } else {
      p.moveTo(19.4, 25.6 + y);
      p.quadraticCurveTo(16.2, 25.9 + y, 16.5, 28.4 + y);
      p.lineTo(18.1, 36.8 + y);
      p.lineTo(29.9, 36.8 + y);
      p.lineTo(31.5, 28.4 + y);
      p.quadraticCurveTo(31.8, 25.9 + y, 28.6, 25.6 + y);
      p.closePath();
    }
    return p;
  }

  function headPath(view) {
    const p = P();
    if (view === 'side') {
      p.moveTo(14.4, 15.6);
      p.bezierCurveTo(14.4, 5.6, 33.4, 5.2, 33.4, 16);
      p.bezierCurveTo(33.4, 21.6, 30, 25.2, 25, 25.8);
      p.bezierCurveTo(20.6, 26.3, 16.6, 25.3, 15.5, 23.6);
      p.bezierCurveTo(14.6, 21.6, 14.4, 18.6, 14.4, 15.6);
      p.closePath();
      return p;
    }
    p.moveTo(13.8, 16);
    p.bezierCurveTo(13.8, 5.5, 34.2, 5.5, 34.2, 16);
    p.bezierCurveTo(34.2, 22, 29.6, 26, 24, 26.2);
    p.bezierCurveTo(18.4, 26, 13.8, 22, 13.8, 16);
    p.closePath();
    return p;
  }

  function drawLegs(ctx, L, view, pose) {
    if (L.bottomType === 'none') return;
    const hip = 35.4 + pose.bob;
    const pants = L.bottom || '#333';
    const shoe = L.shoes || '#26345a';
    const bare = L.bottomType === 'shorts' || L.bottomType === 'skirt' || L.bottomType === 'dress_short';
    const legW = L.big ? 5 : L.f ? 3.7 : 4.2;
    const legs = [];
    if (view === 'side') {
      // stride: s=-1/1 legs apart, 0 together
      const s = pose.step;
      const off = s ? 3.4 : 0.6;
      legs.push({ x: 24 - off, far: false }, { x: 24 + off, far: true });
      if (s === 1) legs.reverse();
      for (const lg of legs) {
        const col = lg.far ? U.shade(pants, -0.18) : pants;
        const p = P();
        const fx = lg.x, top = hip;
        p.moveTo(23 - legW / 2 + 0.6, top);
        p.lineTo(24 + legW / 2 - 0.6, top);
        p.lineTo(fx + legW / 2, 44.4);
        p.lineTo(fx - legW / 2, 44.4);
        p.closePath();
        cel(ctx, p, bare ? L.skin : col, { lw: 0.45 });
        if (bare) {
          const up = P();
          const cut = L.bottomType === 'shorts' ? 0.35 : 0.5;
          up.moveTo(23 - legW / 2 + 0.6, top);
          up.lineTo(24 + legW / 2 - 0.6, top);
          up.lineTo(U.lerp(24 + legW / 2 - 0.6, fx + legW / 2, cut), U.lerp(top, 44.4, cut));
          up.lineTo(U.lerp(23 - legW / 2 + 0.6, fx - legW / 2, cut), U.lerp(top, 44.4, cut));
          up.closePath();
          cel(ctx, up, col, { lw: 0.45 });
        }
        const sh = P();
        rr(sh, fx - legW / 2 - 1.3, 43, legW + 2, 3.4, 1.4);
        cel(ctx, sh, lg.far ? U.shade(shoe, -0.2) : shoe, { lw: 0.45 });
      }
      return;
    }
    // front / back
    const cx = [24 - (L.big ? 3.4 : L.f ? 2.6 : 2.9), 24 + (L.big ? 3.4 : L.f ? 2.6 : 2.9)];
    for (let i = 0; i < 2; i++) {
      const lifted = (pose.step === -1 && i === 1) || (pose.step === 1 && i === 0);
      const fwd = (pose.step === -1 && i === 0) || (pose.step === 1 && i === 1);
      const foot = 46 + (fwd ? 0.25 : 0) - (lifted ? 1.5 : 0);
      const x = cx[i];
      const p = P();
      rr(p, x - legW / 2, hip, legW, foot - hip - 1.2, 1.2);
      if (bare) {
        cel(ctx, p, L.skin, { lw: 0.45 });
        const up = P();
        const len = L.bottomType === 'shorts' ? 4.2 : 3;
        rr(up, x - legW / 2 - 0.2, hip, legW + 0.4, len, 1);
        cel(ctx, up, pants, { lw: 0.45 });
      } else cel(ctx, p, pants, { lw: 0.45 });
      if (L.has('legwarmers')) {
        const w = P();
        rr(w, x - legW / 2 - 0.4, foot - 5.4, legW + 0.8, 3.2, 1);
        cel(ctx, w, '#f07f1e', { lw: 0.45 });
      }
      const sh = P();
      rr(sh, x - legW / 2 - 0.5, foot - 2.6, legW + 1, 2.8, 1.2);
      cel(ctx, sh, shoe, { lw: 0.45 });
    }
  }

  function armPath(x0, y0, x1, y1, w) {
    const p = P();
    spike(p, x0, y0, x1, y1, w, 0.1);
    ell(p, x0, y0, w / 2, w / 2);
    return p;
  }

  function drawArms(ctx, L, view, pose, which) {
    const sleeve = L.sleeve || L.skin;
    const skin = L.skin;
    const y = pose.bob;
    const W = L.big ? 4.4 : L.f ? 3.2 : 3.6;
    const draw = (x0, y0, x1, y1, far) => {
      const col = far ? U.shade(sleeve, -0.15) : sleeve;
      const p = armPath(x0, y0, x1, y1, W);
      cel(ctx, p, col, { lw: 0.45 });
      if (L.has('armwarmers')) {
        const a = P();
        spike(a, U.lerp(x0, x1, 0.55), U.lerp(y0, y1, 0.55), x1, y1, W + 0.5, 0.05);
        cel(ctx, a, L.top2 || '#6a4298', { lw: 0.4 });
      }
      if (L.has('gloves')) {
        const g = P();
        ell(g, x1, y1 + 0.2, 1.9, 1.9);
        cel(ctx, g, '#2b2b33', { lw: 0.4 });
      } else {
        const h = P();
        ell(h, x1, y1 + 0.3, 1.7, 1.7);
        cel(ctx, h, skin, { lw: 0.45 });
      }
    };
    if (view === 'side') {
      const s = pose.step;
      const sw = s * 2.6;
      if (which === 'far') draw(25.6, 27.4 + y, 25.6 + sw, 34.4 + y, true);
      else draw(24.2, 27.4 + y, 24.2 - sw, 34.6 + y, false);
      return;
    }
    const s = pose.step;
    const lx = L.big ? 14.6 : L.f ? 17.5 : 16.8, rx = 48 - lx;
    // front view: arm swing shows as small vertical offsets
    draw(lx + 0.4, 27.2 + y, lx - 1.1, 34.4 + y + (s === 1 ? 0.7 : s === -1 ? -0.6 : 0));
    draw(rx - 0.4, 27.2 + y, rx + 1.1, 34.4 + y + (s === -1 ? 0.7 : s === 1 ? -0.6 : 0));
  }

  function drawTorso(ctx, L, view, pose) {
    if (L.outfit === 'none') return;
    const y = pose.bob;
    const tp = torsoPath(L, view, y);
    const top = L.top || '#777', top2 = L.top2 || U.shade(top, -0.3);
    const back = view === 'back';
    // neck
    const nk = P();
    rr(nk, 21.8, 23.6 + y, 4.4, 3.4, 1);
    cel(ctx, nk, L.skin, { lw: 0.4 });

    switch (L.outfit) {
      case 'crop': {
        cel(ctx, tp, L.skin);
        ctx.save();
        ctx.clip(tp);
        const t = P();
        rr(t, 10, 20 + y, 28, 11.6, 0);
        cel(ctx, t, top, { line: false });
        const s = P();
        rr(s, 10, 34.4 + y, 28, 6, 0);
        cel(ctx, s, L.bottom || top2, { line: false });
        ctx.restore();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = U.shade(top, -0.6);
        ctx.stroke(tp);
        break;
      }
      case 'qipao': {
        cel(ctx, tp, top);
        ctx.save();
        ctx.clip(tp);
        ctx.strokeStyle = top2;
        ctx.lineWidth = 0.9;
        if (!back && view !== 'side') {
          ctx.beginPath();
          ctx.moveTo(21.5, 25.8 + y);
          ctx.quadraticCurveTo(24, 27.5 + y, 26.5, 25.8 + y);
          ctx.moveTo(24, 27 + y);
          ctx.quadraticCurveTo(27, 28.5 + y, 28.2, 30.5 + y);
          ctx.stroke();
        }
        if (back && L.has('circle_back')) {
          ctx.fillStyle = '#f4f0ea';
          ctx.beginPath();
          ctx.arc(24, 30.5 + y, 2.6, 0, U.TAU);
          ctx.fill();
          ctx.fillStyle = top;
          ctx.beginPath();
          ctx.arc(24, 30.5 + y, 1.3, 0, U.TAU);
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case 'kimono': {
        cel(ctx, tp, top);
        ctx.save();
        ctx.clip(tp);
        if (!back) {
          ctx.fillStyle = top2;
          const c = P();
          if (view === 'side') poly(c, [19.8, 25.4 + y, 21.4, 25.4 + y, 23.4, 31 + y, 22, 31 + y]);
          else poly(c, [21, 25.4 + y, 22.4, 25.4 + y, 25.4, 31.2 + y, 24.4, 32 + y]);
          ctx.fill(c);
          const c2 = P();
          if (view !== 'side') poly(c2, [27, 25.4 + y, 25.6, 25.4 + y, 23.2, 30.4 + y, 24.2, 31 + y]);
          ctx.fill(c2);
        }
        const obi = P();
        rr(obi, 10, 32.2 + y, 28, 3, 0);
        cel(ctx, obi, top2 && L.id !== 'shizune' ? top2 : '#3a3448', { line: false });
        ctx.restore();
        break;
      }
      case 'vest': {
        cel(ctx, tp, top2);
        const v = P();
        if (view === 'side') rr(v, 18.8, 26.4 + y, 10.4, 9.6, 2.2);
        else if (back) rr(v, 17.6, 26 + y, 12.8, 10.2, 2);
        else {
          v.moveTo(17.3, 27 + y);
          v.lineTo(22.4, 26 + y);
          v.lineTo(23.2, 36.2 + y);
          v.lineTo(18.4, 36.2 + y);
          v.closePath();
          v.moveTo(30.7, 27 + y);
          v.lineTo(25.6, 26 + y);
          v.lineTo(24.8, 36.2 + y);
          v.lineTo(29.6, 36.2 + y);
          v.closePath();
        }
        cel(ctx, v, top);
        if (!back && view !== 'side') {
          const pk = P();
          rr(pk, 18.8, 30 + y, 3.4, 2.6, 0.7);
          rr(pk, 25.8, 30 + y, 3.4, 2.6, 0.7);
          cel(ctx, pk, U.shade(top, -0.08), { lw: 0.35 });
          const col = P();
          col.moveTo(20.6, 25.6 + y);
          col.quadraticCurveTo(24, 24.4 + y, 27.4, 25.6 + y);
          col.lineTo(26.4, 27.2 + y);
          col.quadraticCurveTo(24, 26.4 + y, 21.6, 27.2 + y);
          col.closePath();
          cel(ctx, col, U.shade(top, 0.06), { lw: 0.35 });
        }
        break;
      }
      case 'jacket': {
        cel(ctx, tp, top);
        ctx.save();
        ctx.clip(tp);
        if (top2 && L.id !== 'kiba') {
          // two-tone shoulders (Naruto) / inner shirt
          const sh = P();
          if (view === 'side') rr(sh, 17, 24.8 + y, 14, 4.4, 2);
          else {
            sh.moveTo(14, 24 + y);
            sh.lineTo(34, 24 + y);
            sh.lineTo(34, 28.6 + y);
            sh.quadraticCurveTo(24, 30.6 + y, 14, 28.6 + y);
            sh.closePath();
          }
          cel(ctx, sh, top2, { line: false });
        }
        if (!back && view !== 'side') {
          ctx.strokeStyle = U.shade(top, -0.45);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(24, 27 + y);
          ctx.lineTo(24, 36.8 + y);
          ctx.stroke();
        }
        ctx.restore();
        if (L.has('fur')) {
          const f = P();
          if (view === 'side') ell(f, 26.5, 25.8 + y, 4.2, 2);
          else ell(f, 24, 25.8 + y, 6.6, 2.2);
          cel(ctx, f, L.top2 || '#e8e2d6', { lw: 0.4 });
        }
        if (!back && view !== 'side' && L.id === 'naruto') {
          // the Uzumaki spiral on the back is only seen from behind; front gets a collar
          const col = P();
          col.moveTo(20.4, 25.2 + y);
          col.quadraticCurveTo(24, 23.8 + y, 27.6, 25.2 + y);
          col.lineTo(26.6, 27 + y);
          col.quadraticCurveTo(24, 26 + y, 21.4, 27 + y);
          col.closePath();
          cel(ctx, col, top2, { lw: 0.35 });
        }
        if (back && L.id === 'naruto') {
          ctx.strokeStyle = '#c8431a';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          for (let a = 0; a < 5.2 * Math.PI; a += 0.25) {
            const r = 0.3 + a * 0.16;
            const px = 24 + Math.cos(a) * r, py = 31.6 + y + Math.sin(a) * r;
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        break;
      }
      case 'armor': {
        cel(ctx, tp, top);
        ctx.save();
        ctx.clip(tp);
        ctx.strokeStyle = top2;
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(12, 29 + i * 2.6 + y);
          ctx.quadraticCurveTo(24, 30.4 + i * 2.6 + y, 36, 29 + i * 2.6 + y);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case 'chef': {
        cel(ctx, tp, top);
        if (!back) {
          const ap = P();
          if (view === 'side') rr(ap, 17.6, 29 + y, 5, 10.5, 1);
          else rr(ap, 19.2, 29 + y, 9.6, 11, 1.2);
          cel(ctx, ap, top2, { lw: 0.4 });
        }
        break;
      }
      case 'robe':
      case 'cloak':
      case 'coat':
      case 'haori': {
        // inner garment
        const inner = L.outfit === 'haori' ? top : L.outfit === 'robe' ? '#6a8452' : top;
        cel(ctx, tp, inner);
        if (L.outfit === 'haori' && !back) {
          ctx.save();
          ctx.clip(tp);
          const obi = P();
          rr(obi, 10, 32.4 + y, 28, 2.6, 0);
          cel(ctx, obi, '#3a4a78', { line: false });
          ctx.restore();
        }
        break;
      }
      default:
        cel(ctx, tp, top);
    }
    if (L.has('headband_waist')) {
      const b = P();
      rr(b, view === 'side' ? 18.4 : 17.6, 33.6 + y, view === 'side' ? 11.2 : 12.8, 2.2, 0.6);
      cel(ctx, b, '#c62828', { lw: 0.4 });
      if (!back && view !== 'side') {
        const pl = P();
        rr(pl, 22, 33.4 + y, 4, 2.6, 0.5);
        cel(ctx, pl, '#cfd5de', { lw: 0.35 });
      }
    }
  }

  // Long outer garment drawn over legs & torso (robe/cloak/coat/haori/long kimono skirt).
  function drawOvercoat(ctx, L, view, pose) {
    const y = pose.bob;
    const back = view === 'back';
    const kimonoLong = L.outfit === 'kimono' && (L.bottomType === 'long' || L.bottomType === 'dress_short');
    if (kimonoLong) {
      const hem = L.bottomType === 'dress_short' ? 41.2 : 44.6;
      const p = P();
      if (view === 'side') {
        p.moveTo(19.4, 32 + y);
        p.lineTo(28.8, 32 + y);
        p.lineTo(29.6 + pose.step * 0.5, hem);
        p.lineTo(18.4 + pose.step * 0.5, hem);
      } else {
        p.moveTo(18.2, 32 + y);
        p.lineTo(29.8, 32 + y);
        p.lineTo(30.8, hem);
        p.lineTo(17.2, hem);
      }
      p.closePath();
      cel(ctx, p, L.bottom || L.top);
      if (!back && view !== 'side') {
        ctx.strokeStyle = U.shade(L.bottom || L.top, -0.4);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(25, 32.2 + y);
        ctx.lineTo(26.2, hem - 0.2);
        ctx.stroke();
      }
      return;
    }
    const hemY = OVERCOAT[L.outfit];
    if (!hemY) return;
    const col = L.outfit === 'haori' ? L.top2 : L.outfit === 'robe' ? L.top : L.top;
    const p = P();
    const flare = L.outfit === 'cloak' ? 3.2 : 1.8;
    if (view === 'side') {
      p.moveTo(18.4, 25.6 + y);
      p.quadraticCurveTo(24, 24.2 + y, 30, 26 + y);
      p.lineTo(31 + flare * 0.6 + pose.step * 0.4, hemY);
      p.lineTo(17.6 - flare * 0.3 + pose.step * 0.4, hemY);
      p.closePath();
    } else {
      p.moveTo(19, 25.4 + y);
      p.quadraticCurveTo(15.2, 25.8 + y, 15.6, 28.4 + y);
      p.lineTo(16.2 - flare, hemY);
      p.lineTo(31.8 + flare, hemY);
      p.lineTo(32.4, 28.4 + y);
      p.quadraticCurveTo(32.8, 25.8 + y, 29, 25.4 + y);
      p.closePath();
    }
    cel(ctx, p, col);
    ctx.save();
    ctx.clip(p);
    if (!back && view !== 'side' && L.outfit !== 'cloak') {
      // open front showing inner layer
      const o = P();
      o.moveTo(22.2, 25 + y);
      o.lineTo(25.8, 25 + y);
      o.lineTo(26.8, hemY);
      o.lineTo(21.2, hemY);
      o.closePath();
      const inner = L.outfit === 'haori' ? L.top : L.outfit === 'robe' ? '#6a8452' : L.top2;
      cel(ctx, o, inner, { lw: 0.4 });
      if (L.outfit === 'haori') {
        const obi = P();
        rr(obi, 21, 32.2 + y, 6, 2.4, 0);
        cel(ctx, obi, '#3a4a78', { line: false });
      }
    }
    if (L.outfit === 'robe') {
      // Hokage flames along the hem
      ctx.fillStyle = L.top2 || '#d9442b';
      ctx.beginPath();
      const x0 = view === 'side' ? 16 : 13, x1 = view === 'side' ? 34 : 35;
      ctx.moveTo(x0, hemY + 1);
      for (let x = x0; x <= x1; x += 2.2) {
        ctx.lineTo(x + 0.6, hemY - 3.2 - ((x * 7) % 3) * 0.5);
        ctx.lineTo(x + 1.6, hemY - 0.8);
      }
      ctx.lineTo(x1, hemY + 1);
      ctx.closePath();
      ctx.fill();
    }
    if (L.outfit === 'cloak' && L.top2) {
      ctx.strokeStyle = L.top2;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      if (view === 'side') {
        ctx.moveTo(18, hemY - 1);
        ctx.lineTo(32, hemY - 1);
      } else {
        ctx.moveTo(14, hemY - 1);
        ctx.lineTo(34, hemY - 1);
      }
      ctx.stroke();
      if (back && (L.id === 'hm_soldier' || L.id === 'hm_elite' || L.id === 'kagen' || L.id === 'nue')) {
        // Hollow Moon crescent
        ctx.fillStyle = L.top2;
        ctx.beginPath();
        ctx.arc(24, 31 + y, 3, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(25.4, 30.2 + y, 2.6, 0, U.TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    if (L.outfit === 'coat' || L.outfit === 'cloak') {
      // high collar
      const c = P();
      if (view === 'side') rr(c, 20, 23.6 + y, 9, 3.6, 1.4);
      else rr(c, 19.2, 23.4 + y, 9.6, 3.8, 1.6);
      cel(ctx, c, U.shade(col, 0.05), { lw: 0.4 });
    }
  }

  // ---------- face ----------
  function drawEye(ctx, L, x, y, w, h, side) {
    const st = L.eyeStyle || 'normal';
    if (st === 'closed') {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + 0.4);
      ctx.quadraticCurveTo(x, y - 1.1, x + w / 2, y + 0.4);
      ctx.stroke();
      return;
    }
    const p = P();
    ell(p, x, y, w / 2, h / 2);
    ctx.fillStyle = st === 'pale' || st === 'light' ? '#fbfaff' : OUT;
    ctx.fill(p);
    if (st === 'pale') {
      const ir = P();
      ell(ir, x, y + 0.3, w / 2 - 0.35, h / 2 - 0.5);
      ctx.fillStyle = L.eyes;
      ctx.fill(ir);
      ctx.strokeStyle = U.shade(L.eyes, -0.45);
      ctx.lineWidth = 0.35;
      ctx.stroke(p);
    } else {
      const ir = P();
      ell(ir, x + (side ? -0.15 : 0), y + 0.35, w / 2 - 0.35, h / 2 - 0.5);
      const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
      g.addColorStop(0, U.shade(L.eyes, -0.45));
      g.addColorStop(0.55, L.eyes);
      g.addColorStop(1, U.light(L.eyes, 0.35));
      ctx.fillStyle = g;
      ctx.fill(ir);
      if (st !== 'round') {
        ctx.fillStyle = U.shade(L.eyes, -0.7);
        ctx.beginPath();
        if (st === 'slit') ctx.ellipse(x, y + 0.4, 0.28, h * 0.3, 0, 0, U.TAU);
        else ctx.ellipse(x, y + 0.45, w * 0.17, h * 0.2, 0, 0, U.TAU);
        ctx.fill();
      }
      if (st === 'light') {
        ctx.strokeStyle = U.shade(L.eyes, -0.5);
        ctx.lineWidth = 0.35;
        ctx.stroke(p);
      }
    }
    // upper lid
    ctx.strokeStyle = OUT;
    ctx.lineWidth = L.f ? 0.85 : 0.7;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 0.2, y - h / 2 + 0.9);
    ctx.quadraticCurveTo(x, y - h / 2 - 0.5, x + w / 2 + 0.2, y - h / 2 + 0.9);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - w * 0.2, y - h * 0.16, 0.55, 0, U.TAU);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(x + w * 0.18, y + h * 0.22, 0.28, 0, U.TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawFace(ctx, L, view) {
    if (view === 'back') return;
    const side = view === 'side';
    const f = L.f;
    const ew = f ? 2.9 : 2.6, eh = f ? 3.9 : 3.5;
    const ey = 19.3;
    const eyes = side ? [17.9] : [19.9, 28.1];
    if (L.has('eyerings')) {
      ctx.fillStyle = 'rgba(40,20,30,0.55)';
      for (const ex of eyes) {
        ctx.beginPath();
        ctx.ellipse(ex, ey, ew / 2 + 0.7, eh / 2 + 0.6, 0, 0, U.TAU);
        ctx.fill();
      }
    }
    for (const ex of eyes) drawEye(ctx, L, ex, ey, side ? ew * 0.82 : ew, eh, side);
    // brows
    if (L.brows !== 'none') {
      ctx.strokeStyle = U.shade(L.hairColor, -0.35);
      ctx.lineWidth = L.brows === 'thick' ? 1.6 : 0.55;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const ex of eyes) {
        ctx.moveTo(ex - 1.5, 15.9);
        ctx.quadraticCurveTo(ex, 15.1, ex + 1.5, 15.9);
      }
      ctx.stroke();
    }
    // mouth
    ctx.strokeStyle = U.mix(OUT, '#a0404a', 0.4);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    if (side) {
      ctx.moveTo(15.6, 23.4);
      ctx.quadraticCurveTo(16.4, 23.9, 17.1, 23.5);
    } else {
      ctx.moveTo(22.9, 23.4);
      ctx.quadraticCurveTo(24, 24.1, 25.1, 23.4);
    }
    ctx.stroke();
    // cheeks
    if (f) {
      ctx.fillStyle = 'rgba(255,110,130,0.28)';
      for (const ex of side ? [19.2] : [17.6, 30.4]) {
        ctx.beginPath();
        ctx.ellipse(ex, 21.9, 1.7, 0.85, 0, 0, U.TAU);
        ctx.fill();
      }
    }
    if (L.has('whiskers')) {
      ctx.strokeStyle = 'rgba(90,50,40,0.8)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      const sides = side ? [[20.2, 1]] : [[17.1, -1], [30.9, 1]];
      for (const [cx, d] of sides) {
        for (let i = 0; i < 3; i++) {
          ctx.moveTo(cx - 1.3, 20.6 + i * 0.9);
          ctx.lineTo(cx + 1.3, 20.9 + i * 0.9 + d * 0.1);
        }
      }
      ctx.stroke();
    }
    if (L.has('fangs')) {
      ctx.fillStyle = '#c62828';
      for (const cx of side ? [19.8] : [17.4, 30.6]) {
        ctx.beginPath();
        ctx.moveTo(cx - 1.1, 20.6);
        ctx.lineTo(cx + 1.1, 20.6);
        ctx.lineTo(cx, 23);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (L.has('swirls')) {
      ctx.strokeStyle = '#e86a8a';
      ctx.lineWidth = 0.45;
      for (const cx of side ? [19.8] : [17.3, 30.7]) {
        ctx.beginPath();
        for (let a = 0; a < 4 * Math.PI; a += 0.3) {
          const r = 0.15 + a * 0.1;
          const px = cx + Math.cos(a) * r, py = 21.8 + Math.sin(a) * r;
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    if (L.has('scar_eye') && !side) {
      ctx.strokeStyle = 'rgba(120,60,60,0.9)';
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(28.4, 15.8);
      ctx.lineTo(28, 21.6);
      ctx.stroke();
    }
    if (L.has('scar_nose')) {
      ctx.strokeStyle = 'rgba(140,70,60,0.9)';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      if (side) {
        ctx.moveTo(14.8, 21);
        ctx.lineTo(18.8, 21.2);
      } else {
        ctx.moveTo(20.2, 21.3);
        ctx.lineTo(27.8, 21.3);
      }
      ctx.stroke();
    }
    if (L.has('bandage_nose')) {
      const b = P();
      if (side) rr(b, 14.4, 20.6, 4.6, 1.5, 0.4);
      else rr(b, 20.6, 20.6, 6.8, 1.5, 0.4);
      cel(ctx, b, '#f2eee4', { lw: 0.35 });
    }
    if (L.has('mask') || L.has('facecloth')) {
      const m = P();
      if (side) {
        m.moveTo(14.4, 20.8);
        m.lineTo(26, 20.4);
        m.lineTo(26.4, 27.4);
        m.lineTo(17, 27.4);
        m.quadraticCurveTo(14.6, 24, 14.4, 20.8);
      } else {
        m.moveTo(14.2, 20.6);
        m.quadraticCurveTo(24, 20, 33.8, 20.6);
        m.quadraticCurveTo(33, 26.4, 24, 27.4);
        m.quadraticCurveTo(15, 26.4, 14.2, 20.6);
      }
      m.closePath();
      cel(ctx, m, L.has('mask') ? '#2a3350' : '#4a4a52', { lw: 0.4 });
    }
    if (L.has('glasses')) {
      ctx.fillStyle = '#1a1c22';
      for (const ex of eyes) {
        ctx.beginPath();
        ctx.ellipse(ex, ey - 0.2, 2.3, 1.9, 0, 0, U.TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(160,200,255,0.5)';
      for (const ex of eyes) {
        ctx.beginPath();
        ctx.ellipse(ex - 0.8, ey - 0.8, 0.7, 0.4, -0.5, 0, U.TAU);
        ctx.fill();
      }
    }
  }

  // ---------- hair ----------
  function capPath(view, style) {
    const p = P();
    if (view === 'side') {
      p.moveTo(15.3, 14.6);
      p.bezierCurveTo(14.4, 3.8, 34.8, 3.4, 34.5, 16.3);
      p.bezierCurveTo(34.4, 21, 32.6, 23.9, 30.2, 24.9);
      p.lineTo(27.7, 23.6);
      p.bezierCurveTo(28.6, 20.4, 27.6, 17, 25.6, 15.4);
      p.bezierCurveTo(22.6, 13, 18, 12.8, 15.3, 14.6);
      p.closePath();
      return p;
    }
    if (view === 'back') {
      p.moveTo(13.1, 17.6);
      p.bezierCurveTo(11.8, 3.8, 36.2, 3.8, 34.9, 17.6);
      p.bezierCurveTo(34.9, 23, 30, 25.6, 24, 25.7);
      p.bezierCurveTo(18, 25.6, 13.1, 23, 13.1, 17.6);
      p.closePath();
      return p;
    }
    const hl = style === 'pineapple' || style === 'topknot' ? 10.6 : 11.6;
    p.moveTo(13.1, 20);
    p.bezierCurveTo(11.6, 3.9, 36.4, 3.9, 34.9, 20);
    p.lineTo(33.3, 20);
    p.bezierCurveTo(33.2, 14, 29.2, hl, 24, hl);
    p.bezierCurveTo(18.8, hl, 14.8, 14, 14.7, 20);
    p.closePath();
    return p;
  }

  // Style definitions: functions that add shapes to layers.
  // layers: back (behind body), cap (over head), front (bangs, over face), over (after headband)
  const HAIR = {};
  const R = (ang, len, w, tilt, bend) => [ang, len, w, tilt || 0, bend || 0];

  HAIR.spiky = (v, H) => {
    if (v === 'front') {
      spikeRing(H.cap, 24, 13.6, 10.6, 9.6, [
        R(-172, 4.6, 5, -28), R(-150, 6, 5.4, -14), R(-126, 6.6, 5.4, -6), R(-103, 6.8, 5.4, 0),
        R(-78, 6.8, 5.4, 2), R(-54, 6.6, 5.4, 8), R(-30, 6, 5.4, 14), R(-8, 4.6, 5, 28),
        R(165, 3.4, 4.2, 30), R(15, 3.4, 4.2, -30),
      ]);
      spike(H.over, 18, 11, 16.6, 17.8, 3.6);
      spike(H.over, 20.6, 10.6, 20.1, 15.6, 3.1);
      spike(H.over, 27.4, 10.6, 27.9, 15.6, 3.1);
      spike(H.over, 30, 11, 31.4, 17.8, 3.6);
    } else if (v === 'side') {
      spikeRing(H.cap, 25, 14.4, 10, 9.6, [
        R(-160, 5.4, 5, -12), R(-132, 6.6, 5.4, -4), R(-104, 7, 5.4, 6), R(-76, 7.2, 5.6, 14),
        R(-48, 7, 5.6, 22), R(-20, 6.4, 5.4, 28), R(8, 5.4, 5, 32), R(34, 4, 4.4, 30),
      ]);
      spike(H.over, 17.2, 10.6, 13.2, 17, 3.8);
      spike(H.over, 19.6, 11, 17.4, 16.4, 3.2);
    } else {
      spikeRing(H.cap, 24, 14.4, 10.8, 10, [
        R(-172, 5, 5, -22), R(-148, 6.2, 5.4, -12), R(-124, 6.6, 5.4, -6), R(-100, 6.8, 5.4, 0),
        R(-76, 6.8, 5.4, 4), R(-52, 6.6, 5.4, 10), R(-28, 6.2, 5.4, 16), R(-6, 5, 5, 22),
        R(170, 4.4, 4.6, -26), R(150, 3.8, 4.4, -30), R(12, 4.4, 4.6, 26), R(32, 3.8, 4.4, 30),
        R(118, 3.4, 4.4, 0), R(94, 3.4, 4.4, 0), R(68, 3.4, 4.4, 0),
      ]);
    }
  };
  HAIR.sasuke = (v, H) => {
    if (v === 'front') {
      spikeRing(H.cap, 24, 13.2, 10.2, 9.4, [R(-150, 4.6, 5, -30), R(-120, 4, 5, -20), R(-60, 4, 5, 20), R(-30, 4.6, 5, 30)]);
      // long bangs framing face, one over the left eye (viewer's right)
      spike(H.front, 16, 12, 14.8, 25, 4.4, 0.2, -0.8);
      spike(H.front, 32, 12, 33.2, 25, 4.4, 0.2, 0.8);
      spike(H.front, 27.6, 10.4, 29.4, 22.4, 5.2, 0.25, 0.6);
      spike(H.front, 21.4, 10.8, 20.6, 16.4, 4.2);
      spike(H.front, 24.6, 10.4, 24.4, 15.4, 3.6);
    } else if (v === 'side') {
      spikeRing(H.cap, 25.5, 13.6, 9.6, 9, [R(-70, 6, 5.6, 40), R(-40, 7.6, 6, 42), R(-12, 8, 6, 40), R(14, 6.4, 5.4, 34), R(-100, 4, 5, 30)]);
      spike(H.front, 17, 11, 14.2, 24, 4.2, 0.22, -0.6);
      spike(H.front, 19.6, 11.4, 17.8, 17, 3.6);
    } else {
      spikeRing(H.cap, 24, 13.4, 10.4, 9.6, [
        R(-140, 6, 5.6, 10), R(-110, 7.2, 5.8, 30), R(-70, 7.2, 5.8, -30), R(-40, 6, 5.6, -10),
        R(-90, 7.6, 6, 0), R(160, 4.4, 4.6, -20), R(20, 4.4, 4.6, 20),
      ]);
    }
  };
  HAIR.kakashi = (v, H) => {
    if (v === 'front') {
      spikeRing(H.cap, 24.4, 13.2, 10.4, 9.6, [
        R(-165, 5, 5.4, 10), R(-140, 7, 5.8, 22), R(-114, 8.4, 6, 30), R(-88, 9, 6.2, 34),
        R(-62, 8.8, 6.2, 36), R(-36, 7.4, 5.8, 34), R(-12, 5.6, 5.2, 30), R(12, 4.2, 4.4, 24),
      ]);
      spike(H.front, 19, 10.8, 18.2, 16.2, 3.4);
      spike(H.front, 23, 10.4, 23.4, 15.4, 3.4);
      spike(H.front, 27, 10.6, 28.4, 15.8, 3.4);
    } else if (v === 'side') {
      spikeRing(H.cap, 25.2, 13.6, 9.8, 9.2, [R(-140, 6.4, 5.6, 26), R(-110, 8.4, 6, 34), R(-80, 9, 6.2, 40), R(-50, 8.4, 6, 44), R(-20, 7, 5.6, 44), R(10, 5.4, 5, 40)]);
      spike(H.front, 17.4, 11, 14.4, 16.2, 3.4);
    } else {
      spikeRing(H.cap, 24.4, 13.6, 10.6, 9.8, [
        R(-165, 5.4, 5.4, 12), R(-140, 7.4, 5.8, 24), R(-114, 8.6, 6, 30), R(-88, 9, 6.2, 34),
        R(-62, 8.6, 6.2, 36), R(-36, 7.4, 5.8, 34), R(-12, 6, 5.2, 30), R(14, 4.6, 4.6, 24), R(165, 4, 4.6, -10),
      ]);
    }
  };
  HAIR.bob = (v, H) => {
    if (v === 'front') {
      const s = H.cap;
      s.moveTo(13.4, 12);
      s.quadraticCurveTo(12.2, 20, 13, 24.8);
      s.quadraticCurveTo(15, 25.8, 16.8, 24.4);
      s.lineTo(16.6, 15);
      s.closePath();
      s.moveTo(34.6, 12);
      s.quadraticCurveTo(35.8, 20, 35, 24.8);
      s.quadraticCurveTo(33, 25.8, 31.2, 24.4);
      s.lineTo(31.4, 15);
      s.closePath();
      const f = H.front;
      f.moveTo(23.4, 9.2);
      f.quadraticCurveTo(17, 10, 15, 18.4);
      f.quadraticCurveTo(17.2, 15.4, 19.6, 15.8);
      f.quadraticCurveTo(21.4, 12.4, 23.4, 9.2);
      f.closePath();
      f.moveTo(24.6, 9.2);
      f.quadraticCurveTo(31, 10, 33, 18.4);
      f.quadraticCurveTo(30.8, 15.4, 28.4, 15.8);
      f.quadraticCurveTo(26.6, 12.4, 24.6, 9.2);
      f.closePath();
      H.forehead = true;
    } else if (v === 'side') {
      const s = H.cap;
      s.moveTo(20, 13);
      s.quadraticCurveTo(19, 21, 20.4, 25.6);
      s.quadraticCurveTo(26, 26.4, 31.6, 24.4);
      s.quadraticCurveTo(35, 20, 33.4, 14);
      s.closePath();
      spike(H.front, 18.6, 10.2, 14.6, 17.4, 4.8, 0.3);
    } else {
      const s = H.cap;
      s.moveTo(12.8, 16);
      s.quadraticCurveTo(12, 24, 14, 26.4);
      s.quadraticCurveTo(24, 28, 34, 26.4);
      s.quadraticCurveTo(36, 24, 35.2, 16);
      s.closePath();
    }
  };
  HAIR.hime = (v, H) => {
    if (v === 'front') {
      const b = H.back;
      b.moveTo(13.6, 15);
      b.quadraticCurveTo(11.4, 28, 11.8, 39);
      b.lineTo(36.2, 39);
      b.quadraticCurveTo(36.6, 28, 34.4, 15);
      b.closePath();
      const f = H.front;
      f.moveTo(14.4, 12.4);
      f.quadraticCurveTo(24, 8.6, 33.6, 12.4);
      f.lineTo(33.5, 15.9);
      f.lineTo(14.5, 15.9);
      f.closePath();
      spike(f, 15.2, 13.4, 15.6, 29.8, 3.6, 0.12, 0.3);
      spike(f, 32.8, 13.4, 32.4, 29.8, 3.6, 0.12, -0.3);
      H.strands = [[18, 12.2, 18, 15.8], [21.8, 11.2, 21.8, 15.8], [26.2, 11.2, 26.2, 15.8], [30, 12.2, 30, 15.8]];
    } else if (v === 'side') {
      const b = H.back;
      b.moveTo(26, 14);
      b.quadraticCurveTo(36, 16, 35.4, 26);
      b.quadraticCurveTo(35.4, 34, 34.6, 39.4);
      b.lineTo(27.4, 39.4);
      b.quadraticCurveTo(28.4, 30, 26.4, 24);
      b.closePath();
      const f = H.front;
      f.moveTo(14.6, 12.6);
      f.quadraticCurveTo(18, 9, 22, 10.6);
      f.lineTo(21.4, 16);
      f.lineTo(14.8, 16);
      f.closePath();
      spike(f, 24.4, 14, 23.4, 29.6, 3.4, 0.12);
    } else {
      const o = H.overBody;
      o.moveTo(13, 15);
      o.quadraticCurveTo(11.4, 28, 12, 39.6);
      o.quadraticCurveTo(24, 41, 36, 39.6);
      o.quadraticCurveTo(36.6, 28, 35, 15);
      o.closePath();
    }
  };
  HAIR.ponytail = (v, H) => {
    if (v === 'front') {
      spike(H.back, 31, 14, 36.4, 35.6, 5, 0.25, 1.6);
      const f = H.front;
      f.moveTo(27.8, 9.4);
      f.quadraticCurveTo(18, 10, 14.8, 16.8);
      f.quadraticCurveTo(14.2, 21, 15.6, 23.6);
      f.quadraticCurveTo(17.4, 19.8, 20.8, 18.6);
      f.quadraticCurveTo(23.4, 13.6, 27.8, 9.4);
      f.closePath();
      spike(f, 30.6, 11, 32.8, 17.6, 3.6);
      H.tie = [31.5, 8.4];
    } else if (v === 'side') {
      spike(H.back, 29, 7.4, 36.2, 36.4, 5.2, 0.3, 3.2);
      spike(H.front, 18.6, 10.2, 14.4, 18.4, 4.8, 0.3);
      H.tie = [29.2, 7.6];
    } else {
      spike(H.overBody, 24, 8.4, 24.6, 38.4, 5.4, 0.25, 1);
      H.tie = [24, 8.6];
    }
  };
  HAIR.buns = (v, H) => {
    if (v === 'front') {
      ell(H.pre, 16.4, 7.6, 4.3, 4.1);
      ell(H.pre, 31.6, 7.6, 4.3, 4.1);
      spike(H.front, 23.2, 10, 17.6, 15.6, 4.2, 0.3);
      spike(H.front, 24.8, 10, 30.4, 15.6, 4.2, 0.3);
      H.forehead = true;
    } else if (v === 'side') {
      ell(H.pre, 27.8, 5.6, 4.2, 4);
      ell(H.pre, 23.2, 5, 4.3, 4.1);
      spike(H.front, 18.4, 10.2, 14.8, 16.2, 4.2, 0.3);
    } else {
      ell(H.pre, 16.4, 8, 4.3, 4.1);
      ell(H.pre, 31.6, 8, 4.3, 4.1);
    }
  };
  HAIR.quad = (v, H) => {
    if (v === 'front') {
      spike(H.pre, 16, 11.2, 9.8, 9.8, 5, 0.3);
      spike(H.pre, 32, 11.2, 38.2, 9.8, 5, 0.3);
      spike(H.pre, 16, 18, 10.6, 22.8, 5, 0.3);
      spike(H.pre, 32, 18, 37.4, 22.8, 5, 0.3);
      spike(H.front, 18.6, 10.8, 16.6, 16.4, 3.4);
      spike(H.front, 21.6, 10.4, 21, 15.4, 3.2);
      spike(H.front, 26.4, 10.4, 27, 15.4, 3.2);
      spike(H.front, 29.4, 10.8, 31.4, 16.4, 3.4);
    } else if (v === 'side') {
      spike(H.pre, 30, 10.6, 36.6, 8.4, 5.2, 0.3);
      spike(H.pre, 30.6, 18, 36.6, 21.4, 5.2, 0.3);
      spike(H.front, 17.8, 10.6, 14.4, 16.2, 3.6);
    } else {
      spike(H.over, 19.4, 11, 13.4, 8.8, 5.2, 0.3);
      spike(H.over, 28.6, 11, 34.6, 8.8, 5.2, 0.3);
      spike(H.over, 19.4, 18.4, 13.8, 22, 5.2, 0.3);
      spike(H.over, 28.6, 18.4, 34.2, 22, 5.2, 0.3);
      H.ties = [[19.4, 11], [28.6, 11], [19.4, 18.4], [28.6, 18.4]];
    }
  };
  HAIR.twintails = (v, H) => {
    if (v === 'front') {
      spike(H.back, 14.4, 21, 12.6, 38, 4.8, 0.22, -0.6);
      spike(H.back, 33.6, 21, 35.4, 38, 4.8, 0.22, 0.6);
      const f = H.front;
      f.moveTo(23.4, 9.2);
      f.quadraticCurveTo(15.6, 10.6, 14.4, 19.6);
      f.quadraticCurveTo(16.8, 15.6, 19.8, 14.6);
      f.quadraticCurveTo(21.4, 11.6, 23.4, 9.2);
      f.closePath();
      f.moveTo(24.6, 9.2);
      f.quadraticCurveTo(32.4, 10.6, 33.6, 19.6);
      f.quadraticCurveTo(31.2, 15.6, 28.2, 14.6);
      f.quadraticCurveTo(26.6, 11.6, 24.6, 9.2);
      f.closePath();
      H.forehead = true;
      H.ties = [[14.4, 21.4], [33.6, 21.4]];
    } else if (v === 'side') {
      spike(H.back, 29.4, 21.6, 31.6, 38, 5, 0.22, 1);
      spike(H.front, 18.6, 10.2, 14.6, 18.6, 4.6, 0.3);
      H.ties = [[29.4, 22]];
    } else {
      spike(H.overBody, 19.2, 22, 18, 38.6, 5, 0.22, -0.4);
      spike(H.overBody, 28.8, 22, 30, 38.6, 5, 0.22, 0.4);
      H.ties = [[19.2, 22.4], [28.8, 22.4]];
    }
  };
  HAIR.short = (v, H) => {
    if (v === 'front') {
      const s = H.cap;
      s.moveTo(13.4, 13);
      s.quadraticCurveTo(12.6, 19, 13.6, 22.6);
      s.lineTo(16.2, 21.8);
      s.lineTo(16, 14);
      s.closePath();
      s.moveTo(34.6, 13);
      s.quadraticCurveTo(35.4, 19, 34.4, 22.6);
      s.lineTo(31.8, 21.8);
      s.lineTo(32, 14);
      s.closePath();
      const f = H.front;
      f.moveTo(14.6, 12.6);
      f.quadraticCurveTo(24, 8.8, 33.4, 12.6);
      f.lineTo(33, 15);
      f.lineTo(30.6, 14.2);
      f.lineTo(28.6, 15.4);
      f.lineTo(26, 14.4);
      f.lineTo(24, 15.6);
      f.lineTo(21.8, 14.4);
      f.lineTo(19.4, 15.4);
      f.lineTo(17.4, 14.2);
      f.lineTo(15, 15);
      f.closePath();
    } else if (v === 'side') {
      spike(H.front, 18, 10.4, 14.8, 15.8, 4.4, 0.3);
    }
  };
  HAIR.neat = (v, H) => {
    HAIR.short(v, H);
  };
  HAIR.pineapple = (v, H) => {
    if (v === 'front') {
      spikeRing(H.pre, 24, 7.4, 2.4, 2, [R(-150, 5, 4.2, 20), R(-118, 6.4, 4.4, 8), R(-90, 7, 4.6, 0), R(-62, 6.4, 4.4, -8), R(-30, 5, 4.2, -20)]);
      H.ties = [[24, 6.8]];
    } else if (v === 'side') {
      spikeRing(H.pre, 29.4, 6.6, 2.4, 2, [R(-150, 5, 4.2, 10), R(-115, 6.6, 4.4, 10), R(-80, 7, 4.6, 12), R(-45, 6.4, 4.4, 16), R(-10, 5, 4.2, 20)]);
      H.ties = [[29, 7]];
    } else {
      spikeRing(H.over, 24, 7.6, 2.4, 2, [R(-150, 5, 4.2, 20), R(-118, 6.4, 4.4, 8), R(-90, 7, 4.6, 0), R(-62, 6.4, 4.4, -8), R(-30, 5, 4.2, -20)]);
      H.ties = [[24, 8.4]];
    }
  };
  HAIR.topknot = (v, H) => {
    if (v === 'front') {
      spikeRing(H.pre, 24, 6.4, 1.6, 1.4, [R(-130, 3.6, 3.4, 10), R(-90, 4.4, 3.6, 0), R(-50, 3.6, 3.4, -10)]);
    } else if (v === 'side') {
      spikeRing(H.pre, 31, 8, 1.6, 1.4, [R(-80, 3.6, 3.4, 30), R(-40, 4.6, 3.8, 30), R(0, 3.6, 3.4, 30)]);
      H.ties = [[31, 8.4]];
    } else {
      spikeRing(H.over, 24, 7.4, 1.6, 1.4, [R(-130, 3.6, 3.4, 10), R(-90, 4.4, 3.6, 0), R(-50, 3.6, 3.4, -10)]);
      H.ties = [[24, 8]];
    }
  };
  HAIR.bowl = (v, H) => {
    if (v === 'front') {
      const s = H.front;
      s.moveTo(13.4, 11);
      s.quadraticCurveTo(12.8, 17, 13.4, 21);
      s.lineTo(16.4, 21);
      s.lineTo(16.4, 14.3);
      s.lineTo(31.6, 14.3);
      s.lineTo(31.6, 21);
      s.lineTo(34.6, 21);
      s.quadraticCurveTo(35.2, 17, 34.6, 11);
      s.quadraticCurveTo(24, 7, 13.4, 11);
      s.closePath();
      H.gloss = true;
    } else if (v === 'side') {
      const s = H.front;
      s.moveTo(14.8, 12);
      s.lineTo(15, 14.6);
      s.lineTo(24.8, 14.6);
      s.lineTo(25.6, 21.4);
      s.lineTo(34.4, 21.4);
      s.quadraticCurveTo(35, 14, 32, 9);
      s.quadraticCurveTo(22, 5, 14.8, 12);
      s.closePath();
      H.gloss = true;
    } else H.gloss = true;
  };
  HAIR.messy = (v, H) => {
    if (v === 'front') {
      spikeRing(H.cap, 24, 13.2, 10.8, 9.8, [
        R(-170, 3.6, 4.4, -30), R(-145, 4.4, 4.6, -20), R(-120, 3.8, 4.4, 10), R(-98, 4.8, 4.6, -10),
        R(-75, 4, 4.4, 14), R(-52, 4.6, 4.6, 0), R(-28, 3.8, 4.4, 20), R(-8, 3.8, 4.4, 30), R(160, 3, 4, 20), R(20, 3, 4, -20),
      ]);
      spike(H.front, 18.4, 10.8, 17, 15.8, 3.4);
      spike(H.front, 22, 10.4, 22.4, 15.4, 3.2);
      spike(H.front, 26, 10.4, 25.2, 15.2, 3.2);
      spike(H.front, 29.6, 10.8, 31.2, 15.8, 3.4);
    } else if (v === 'side') {
      spikeRing(H.cap, 25, 14, 10, 9.6, [R(-150, 4.4, 4.6, -10), R(-120, 4.8, 4.6, 10), R(-90, 5, 4.8, 20), R(-60, 5, 4.8, 24), R(-30, 4.8, 4.6, 30), R(0, 4.4, 4.6, 30), R(30, 3.6, 4.2, 20)]);
      spike(H.front, 17.4, 10.8, 14, 15.8, 3.6);
    } else {
      spikeRing(H.cap, 24, 14, 10.8, 10, [
        R(-170, 4, 4.6, -20), R(-140, 4.6, 4.6, -10), R(-110, 4.8, 4.6, 0), R(-80, 4.8, 4.6, 10),
        R(-50, 4.6, 4.6, 14), R(-20, 4.2, 4.6, 20), R(10, 3.8, 4.4, 20), R(170, 3.8, 4.4, -20), R(110, 3, 4, 0), R(70, 3, 4, 0),
      ]);
    }
  };
  HAIR.wild_long = (v, H) => {
    HAIR.messy(v, H);
    if (v === 'front') {
      spike(H.back, 14.6, 16, 11.6, 36, 6.4, 0.3);
      spike(H.back, 33.4, 16, 36.4, 36, 6.4, 0.3);
    } else if (v === 'side') spike(H.back, 30, 14, 35, 36, 8, 0.3, 1);
    else {
      spike(H.overBody, 19, 18, 16.4, 36.4, 7, 0.3);
      spike(H.overBody, 29, 18, 31.6, 36.4, 7, 0.3);
      spike(H.overBody, 24, 18, 24, 37.4, 7, 0.3);
    }
  };
  HAIR.short_spiky = (v, H) => {
    if (v === 'front') {
      spikeRing(H.cap, 24, 13.4, 10.4, 9.4, [R(-160, 3.4, 4.4, -20), R(-130, 3.8, 4.4, -10), R(-100, 4, 4.4, 0), R(-70, 4, 4.4, 6), R(-40, 3.8, 4.4, 14), R(-14, 3.4, 4.4, 20)]);
      spike(H.front, 18.2, 10.8, 17.4, 15.6, 3.6);
      spike(H.front, 21.6, 10.4, 21.2, 15, 3.4);
      spike(H.front, 25, 10.4, 25.2, 14.2, 3.2);
    } else if (v === 'side') {
      spikeRing(H.cap, 25, 14, 9.8, 9.4, [R(-140, 3.6, 4.4, 10), R(-110, 4, 4.4, 14), R(-80, 4.2, 4.4, 20), R(-50, 4, 4.4, 24), R(-20, 3.6, 4.4, 26), R(10, 3.2, 4, 24)]);
      spike(H.front, 17.6, 10.8, 14.6, 15.4, 3.6);
    } else {
      spikeRing(H.cap, 24, 14, 10.6, 9.8, [R(-160, 3.6, 4.4, -16), R(-130, 4, 4.4, -8), R(-100, 4.2, 4.4, 0), R(-70, 4.2, 4.4, 8), R(-40, 4, 4.4, 14), R(-12, 3.6, 4.4, 18), R(170, 3.2, 4.2, -20), R(12, 3.2, 4.2, 20)]);
    }
  };
  HAIR.side_long = (v, H) => {
    HAIR.short(v, H);
    if (v === 'front') {
      const f = H.front;
      f.moveTo(26, 9.6);
      f.quadraticCurveTo(17, 10.4, 15.2, 17);
      f.quadraticCurveTo(15, 21, 16.4, 23.4);
      f.quadraticCurveTo(18, 19, 21.4, 17.6);
      f.quadraticCurveTo(23.2, 13.4, 26, 9.6);
      f.closePath();
    }
  };
  HAIR.long = (v, H) => {
    if (v === 'front') {
      const b = H.back;
      b.moveTo(13.8, 15);
      b.quadraticCurveTo(12.2, 26, 12.8, 34);
      b.lineTo(35.2, 34);
      b.quadraticCurveTo(35.8, 26, 34.2, 15);
      b.closePath();
      const f = H.front;
      f.moveTo(23.4, 9.2);
      f.quadraticCurveTo(15.6, 10.6, 14.4, 21);
      f.quadraticCurveTo(16.8, 15.6, 19.8, 14.6);
      f.quadraticCurveTo(21.4, 11.6, 23.4, 9.2);
      f.closePath();
      f.moveTo(24.6, 9.2);
      f.quadraticCurveTo(32.4, 10.6, 33.6, 21);
      f.quadraticCurveTo(31.2, 15.6, 28.2, 14.6);
      f.quadraticCurveTo(26.6, 11.6, 24.6, 9.2);
      f.closePath();
    } else if (v === 'side') {
      const b = H.back;
      b.moveTo(26, 14);
      b.quadraticCurveTo(35.6, 16, 35, 26);
      b.lineTo(34.4, 34.4);
      b.lineTo(27.8, 34.4);
      b.quadraticCurveTo(28, 28, 26.4, 24);
      b.closePath();
      spike(H.front, 18.6, 10.2, 14.6, 18.6, 4.6, 0.3);
    } else {
      const o = H.overBody;
      o.moveTo(13, 15);
      o.quadraticCurveTo(11.8, 26, 12.4, 34.6);
      o.quadraticCurveTo(24, 36, 35.6, 34.6);
      o.quadraticCurveTo(36.2, 26, 35, 15);
      o.closePath();
    }
  };
  HAIR.long_white = (v, H) => {
    HAIR.long(v, H);
    if (v === 'front') spike(H.back, 24, 16, 24, 38.6, 18, 0.1);
    if (v === 'side') spike(H.back, 30, 16, 33, 38.6, 6, 0.1, 1);
    if (v === 'back') spike(H.overBody, 24, 18, 24, 38.8, 18, 0.1);
  };
  HAIR.long_flow = (v, H) => {
    HAIR.long(v, H);
    if (v === 'front') {
      spike(H.back, 14, 18, 10.4, 40, 6, 0.3, -2);
      spike(H.back, 34, 18, 37.6, 40, 6, 0.3, 2);
    } else if (v === 'side') spike(H.back, 29.4, 16, 36.4, 40, 7, 0.3, 3);
    else {
      spike(H.overBody, 17, 20, 13.4, 40.4, 7, 0.3, -2);
      spike(H.overBody, 31, 20, 34.6, 40.4, 7, 0.3, 2);
    }
  };
  HAIR.ponytail_low = (v, H) => {
    HAIR.short(v, H);
    if (v === 'front') spike(H.back, 31.4, 20, 34.4, 33.4, 4.2, 0.22, 1);
    else if (v === 'side') {
      spike(H.back, 30, 21.4, 32.4, 34, 4.4, 0.22, 1);
      H.ties = [[30, 21.8]];
    } else {
      spike(H.overBody, 24, 22, 24.4, 34.4, 4.6, 0.22);
      H.ties = [[24, 22.4]];
    }
  };
  HAIR.bun = (v, H) => {
    HAIR.short(v, H);
    if (v === 'front') ell(H.pre, 24, 5.2, 4, 3.4);
    else if (v === 'side') ell(H.pre, 29.4, 6.6, 3.8, 3.6);
    else ell(H.over, 24, 7, 4, 3.6);
    H.pin = true;
  };
  HAIR.anko = (v, H) => {
    if (v === 'front') {
      spikeRing(H.pre, 29, 8, 2, 2, [R(-100, 5, 4, 0), R(-70, 6, 4, 0), R(-40, 5.6, 4, 0), R(-10, 4.6, 4, 0)]);
      spike(H.front, 18.4, 10.8, 16.4, 16.4, 3.6);
      spike(H.front, 22, 10.4, 21.2, 15.6, 3.4);
      spike(H.front, 26.2, 10.4, 26.6, 15, 3.2);
      spike(H.front, 29.8, 10.8, 31.6, 16.4, 3.6);
    } else if (v === 'side') {
      spikeRing(H.pre, 31, 9, 2, 2, [R(-80, 5, 4, 20), R(-50, 6, 4, 20), R(-20, 6, 4, 20), R(10, 5, 4, 20)]);
      spike(H.front, 17.6, 10.8, 14.4, 16, 3.6);
    } else {
      spikeRing(H.over, 24, 9, 2, 2, [R(-150, 5, 4, 0), R(-115, 6, 4, 0), R(-80, 6, 4, 0), R(-45, 6, 4, 0), R(-15, 5, 4, 0)]);
    }
  };
  HAIR.bald = (v, H) => {
    H.noCap = true;
    if (v !== 'back') {
      ell(H.front, v === 'side' ? 27 : 14.6, 18, 1.6, 3);
      if (v !== 'side') ell(H.front, 33.4, 18, 1.6, 3);
    } else {
      const f = H.front;
      f.moveTo(14, 16);
      f.quadraticCurveTo(24, 26, 34, 16);
      f.lineTo(33.6, 22);
      f.quadraticCurveTo(24, 27, 14.4, 22);
      f.closePath();
    }
  };
  HAIR.chef = (v, H) => {
    HAIR.short(v, H);
    H.hat = 'chef';
  };
  HAIR.bandana = (v, H) => {
    HAIR.short(v, H);
    if (v === 'front') {
      spike(H.back, 14, 18, 13.4, 27, 4.6, 0.2);
      spike(H.back, 34, 18, 34.6, 27, 4.6, 0.2);
    } else if (v === 'side') spike(H.back, 30, 18, 31, 27, 5.6, 0.2);
    else spike(H.overBody, 24, 20, 24, 28, 14, 0.1);
    H.hat = 'bandana';
  };
  HAIR.hood = (v, H) => {
    H.noCap = true;
    H.hat = 'hood';
  };
  HAIR.masked = (v, H) => {
    H.noCap = true;
    H.hat = 'hood';
    H.maskFace = true;
  };
  HAIR.none = (v, H) => {
    H.noCap = true;
  };

  function hairLayers(L, view) {
    const H = { back: P(), pre: P(), cap: P(), front: P(), over: P(), overBody: P() };
    (HAIR[L.style] || HAIR.short)(view, H);
    return H;
  }

  function drawHairPath(ctx, path, color, o = {}) {
    cel(ctx, path, color, Object.assign({ ox: 1.2, oy: 1.4, depth: 0.28 }, o));
  }

  function drawHat(ctx, L, view, H) {
    if (H.hat === 'chef') {
      const p = P();
      if (view === 'side') {
        rr(p, 15.6, 3.2, 17.6, 9, 3.6);
      } else {
        p.moveTo(15.4, 11.6);
        p.lineTo(15.6, 6);
        p.quadraticCurveTo(15, 1.4, 20, 2.2);
        p.quadraticCurveTo(24, -0.2, 28, 2.2);
        p.quadraticCurveTo(33, 1.4, 32.4, 6);
        p.lineTo(32.6, 11.6);
        p.quadraticCurveTo(24, 13, 15.4, 11.6);
        p.closePath();
      }
      cel(ctx, p, '#f7f5ef', { lw: 0.45 });
    } else if (H.hat === 'bandana') {
      const p = P();
      if (view === 'side') {
        p.moveTo(15.4, 12.6);
        p.bezierCurveTo(14.6, 3.6, 34.6, 3.4, 34, 14.6);
        p.lineTo(28, 14);
        p.quadraticCurveTo(22, 11, 15.4, 12.6);
      } else if (view === 'back') {
        p.moveTo(13.6, 13.6);
        p.bezierCurveTo(12.6, 3.6, 35.4, 3.6, 34.4, 13.6);
        p.quadraticCurveTo(24, 16, 13.6, 13.6);
      } else {
        p.moveTo(13.8, 12.8);
        p.bezierCurveTo(12.8, 3.6, 35.2, 3.6, 34.2, 12.8);
        p.quadraticCurveTo(24, 10.2, 13.8, 12.8);
      }
      p.closePath();
      cel(ctx, p, '#f4f2ec', { lw: 0.45 });
    } else if (H.hat === 'hood') {
      const col = L.hairColor;
      const p = P();
      if (view === 'side') {
        p.moveTo(14.8, 12.6);
        p.bezierCurveTo(13.6, 2.6, 35.8, 2.6, 35.2, 16);
        p.bezierCurveTo(35, 23, 32, 26.4, 26, 27);
        p.lineTo(22, 27);
        p.quadraticCurveTo(24.6, 20, 21.4, 14.6);
        p.quadraticCurveTo(18, 12.4, 14.8, 12.6);
      } else if (view === 'back') {
        p.moveTo(12.4, 17);
        p.bezierCurveTo(11.4, 2.6, 36.6, 2.6, 35.6, 17);
        p.bezierCurveTo(35.6, 24, 30, 27.2, 24, 27.2);
        p.bezierCurveTo(18, 27.2, 12.4, 24, 12.4, 17);
      } else {
        p.moveTo(12.6, 22);
        p.bezierCurveTo(10.8, 2.6, 37.2, 2.6, 35.4, 22);
        p.lineTo(32.6, 25);
        p.bezierCurveTo(33.6, 14.6, 29.4, 11.4, 24, 11.4);
        p.bezierCurveTo(18.6, 11.4, 14.4, 14.6, 15.4, 25);
      }
      p.closePath();
      cel(ctx, p, col, { lw: 0.45 });
      if (H.maskFace && view !== 'back') {
        const m = P();
        if (view === 'side') {
          m.moveTo(14.2, 13.4);
          m.quadraticCurveTo(20.4, 11.6, 21.8, 16);
          m.quadraticCurveTo(22.6, 22, 20.8, 26);
          m.quadraticCurveTo(16.4, 26.4, 15, 23.4);
          m.quadraticCurveTo(13.6, 18, 14.2, 13.4);
        } else {
          m.moveTo(15.8, 14.6);
          m.quadraticCurveTo(24, 10.2, 32.2, 14.6);
          m.quadraticCurveTo(33.2, 23, 24, 26.2);
          m.quadraticCurveTo(14.8, 23, 15.8, 14.6);
        }
        m.closePath();
        cel(ctx, m, '#f1efe9', { lw: 0.45 });
        ctx.fillStyle = OUT;
        const eyes = view === 'side' ? [17.2] : [20.2, 27.8];
        for (const ex of eyes) {
          ctx.beginPath();
          ctx.ellipse(ex, 18.6, 1.5, 0.7, ex < 24 ? 0.25 : -0.25, 0, U.TAU);
          ctx.fill();
        }
        ctx.fillStyle = L.id === 'nue' ? '#c23a3a' : L.top2 || '#7a5ab8';
        ctx.beginPath();
        if (view === 'side') ctx.arc(18.2, 22.6, 1.2, 0, U.TAU);
        else {
          ctx.moveTo(22, 21.6);
          ctx.quadraticCurveTo(24, 24.6, 26, 21.6);
          ctx.quadraticCurveTo(24, 23.2, 22, 21.6);
        }
        ctx.fill();
      }
    }
  }

  function drawHeadband(ctx, L, view, kind) {
    const cloth = kind === 'bandana' ? (L.id === 'bandit' ? '#7a4a2a' : '#2b3550') : '#252a3a';
    const plateCol = '#d9dee6';
    if (view === 'back') {
      const b = P();
      rr(b, 13.2, 12.6, 21.6, 2.9, 1);
      cel(ctx, b, cloth, { lw: 0.4 });
      const k = P();
      ell(k, 24, 14, 1.6, 1.4);
      spike(k, 24, 14.4, 21.6, 21.6, 2.2, 0.15);
      spike(k, 24, 14.4, 26.8, 21, 2.2, 0.15);
      cel(ctx, k, cloth, { lw: 0.4 });
      return;
    }
    const b = P();
    if (view === 'side') {
      b.moveTo(14.4, 11.8);
      b.lineTo(33.8, 13.2);
      b.lineTo(33.6, 16.2);
      b.lineTo(14.6, 14.8);
      b.closePath();
      spike(b, 33.4, 14.6, 37.2, 20.6, 2.2, 0.15);
      spike(b, 33.4, 14.6, 35.8, 21.8, 2.2, 0.15);
    } else {
      b.moveTo(13.7, 13.2);
      b.quadraticCurveTo(24, 10.8, 34.3, 13.2);
      b.lineTo(34.2, 16);
      b.quadraticCurveTo(24, 13.8, 13.8, 16);
      b.closePath();
    }
    cel(ctx, b, cloth, { lw: 0.4 });
    const pl = P();
    if (view === 'side') rr(pl, 14.2, 11.2, 5.6, 4.2, 0.8);
    else rr(pl, 19.4, 11.1, 9.2, 4.2, 0.9);
    const g = ctx.createLinearGradient(0, 11, 0, 15.4);
    g.addColorStop(0, '#f4f6fa');
    g.addColorStop(1, '#9aa3b3');
    ctx.fillStyle = g;
    ctx.fill(pl);
    ctx.strokeStyle = '#5a6272';
    ctx.lineWidth = 0.4;
    ctx.stroke(pl);
    // emblem
    const cx = view === 'side' ? 17 : 24, cy = 13.2;
    ctx.strokeStyle = '#4a5262';
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    if (kind === 'sand') {
      ctx.moveTo(cx - 1.4, cy - 1.2);
      ctx.lineTo(cx + 1.4, cy - 1.2);
      ctx.lineTo(cx - 1.4, cy + 1.2);
      ctx.lineTo(cx + 1.4, cy + 1.2);
      ctx.closePath();
    } else {
      ctx.arc(cx - 0.2, cy + 0.1, 1.1, Math.PI * 0.2, Math.PI * 1.9);
      ctx.lineTo(cx + 1.6, cy - 1.2);
    }
    ctx.stroke();
    if (kind === 'slashed') {
      ctx.strokeStyle = '#2a2a34';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - 3.4, cy - 0.6);
      ctx.lineTo(cx + 3.4, cy + 0.8);
      ctx.stroke();
    }
  }

  function drawHair(ctx, L, view, H, layer) {
    const col = L.hairColor;
    if (layer === 'back') {
      drawHairPath(ctx, H.back, col);
      return;
    }
    if (layer === 'overBody') {
      drawHairPath(ctx, H.overBody, col);
      if (H.ties && view === 'back') drawTies(ctx, L, H.ties);
      return;
    }
    // head layers
    drawHairPath(ctx, H.pre, col);
    if (!H.noCap) {
      const cap = capPath(view, L.style);
      cap.addPath(H.cap);
      drawHairPath(ctx, cap, col);
      shine(ctx, cap, col, (c) => {
        c.lineWidth = 1.1;
        c.beginPath();
        if (view === 'side') c.arc(24, 13, 8.4, Math.PI * 1.1, Math.PI * 1.45);
        else if (view === 'back') c.arc(24, 14, 8.6, Math.PI * 1.15, Math.PI * 1.4);
        else c.arc(24, 14, 9.4, Math.PI * 1.18, Math.PI * 1.36);
        c.stroke();
        if (H.gloss) {
          c.lineWidth = 0.9;
          c.beginPath();
          c.arc(24, 14, 7, Math.PI * 1.55, Math.PI * 1.8);
          c.stroke();
        }
      });
    } else {
      drawHairPath(ctx, H.cap, col);
    }
    if (view === 'back') drawHairPath(ctx, H.over, col);
    if (layer === 'head') {
      drawHairPath(ctx, H.front, col);
      if (H.strands) {
        ctx.strokeStyle = U.shade(col, -0.4);
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        for (const s of H.strands) {
          ctx.moveTo(s[0], s[1]);
          ctx.lineTo(s[2], s[3]);
        }
        ctx.stroke();
      }
    }
    if (H.ties && view !== 'back') drawTies(ctx, L, H.ties);
    if (H.tie) drawTies(ctx, L, [H.tie]);
  }

  function drawTies(ctx, L, ties) {
    ctx.fillStyle = L.id === 'tsunade' ? '#6a4a8a' : L.id === 'ino' ? '#a07ad0' : '#3a3440';
    for (const [x, y] of ties) {
      ctx.beginPath();
      ctx.ellipse(x, y, 1.3, 0.9, 0, 0, U.TAU);
      ctx.fill();
    }
  }

  function drawBackAcc(ctx, L, view, pose, front) {
    const y = pose.bob;
    if (L.has('fan')) {
      const p = P();
      if (view === 'side') {
        rr(p, 26.4, 16 + y, 5.4, 22, 2);
      } else if (view === 'back') {
        rr(p, 19.8, 15.4 + y, 8.4, 24, 2.4);
      } else {
        rr(p, 29.4, 14.6 + y, 5.6, 22, 2.2);
      }
      cel(ctx, p, '#6a4a3a', { lw: 0.45 });
      ctx.save();
      ctx.clip(p);
      ctx.fillStyle = '#e9e1cc';
      ctx.fillRect(10, 15 + y, 30, 4);
      ctx.fillStyle = '#c23b3b';
      if (view === 'back') {
        ctx.beginPath();
        ctx.arc(24, 30 + y, 1.5, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    if (L.has('gourd')) {
      const p = P();
      const gx = view === 'side' ? 29.8 : view === 'back' ? 24 : 32.6;
      ell(p, gx, 22.2 + y, 4.2, 4.2);
      ell(p, gx, 31 + y, 6.2, 6.4);
      cel(ctx, p, '#c4a879', { lw: 0.45 });
      const b = P();
      rr(b, gx - 2, 17 + y, 4, 2.2, 0.8);
      cel(ctx, b, '#8a4a2a', { lw: 0.35 });
    }
    if (L.has('sword')) {
      const p = P();
      if (view === 'back') spike(p, 18.6, 38 + y, 30.8, 20.4 + y, 1.6, 0.02);
      else if (view === 'side') spike(p, 22, 38 + y, 32, 22 + y, 1.6, 0.02);
      else spike(p, 30.4, 22.4 + y, 34.4, 17 + y, 1.6, 0.02);
      cel(ctx, p, '#3a3a50', { lw: 0.4 });
      if (view !== 'side') {
        const h = P();
        rr(h, view === 'back' ? 29.8 : 33.4, view === 'back' ? 19 + y : 15.4 + y, 2.4, 3, 0.6);
        cel(ctx, h, '#b09a6a', { lw: 0.35 });
      }
    }
    if (L.has('scroll_back')) {
      const p = P();
      if (view === 'back') rr(p, 16.4, 27 + y, 15.2, 3.4, 1.6);
      else if (view === 'side') rr(p, 27.6, 25 + y, 3.4, 10, 1.6);
      else rr(p, 31, 25.4 + y, 3.2, 9, 1.4);
      cel(ctx, p, '#e8dcc0', { lw: 0.4 });
    }
  }

  function drawNeckAcc(ctx, L, view, pose) {
    const y = pose.bob;
    if (L.has('headband_neck')) {
      const b = P();
      if (view === 'side') rr(b, 19.6, 24.4 + y, 9, 2.4, 1);
      else rr(b, 19.4, 24.4 + y, 9.2, 2.4, 1);
      cel(ctx, b, '#2a3550', { lw: 0.4 });
      if (view !== 'back') {
        const pl = P();
        rr(pl, view === 'side' ? 19 : 21.4, 24 + y, view === 'side' ? 3 : 5.2, 3, 0.6);
        cel(ctx, pl, '#d9dee6', { lw: 0.35 });
      }
    }
    if (L.has('necklace') && view === 'down') {
      ctx.fillStyle = '#5fd18a';
      ctx.beginPath();
      ctx.ellipse(24, 27.6 + y, 0.8, 1.1, 0, 0, U.TAU);
      ctx.fill();
    }
    if (L.has('earrings') && view !== 'back') {
      ctx.fillStyle = '#e8c94a';
      const xs = view === 'side' ? [26.2] : [14.6, 33.4];
      for (const x of xs) {
        ctx.beginPath();
        ctx.arc(x, 22.6, 0.6, 0, U.TAU);
        ctx.fill();
      }
    }
  }

  function drawForeheadMarks(ctx, L, view, H) {
    if (view === 'back') return;
    const cx = view === 'side' ? 16.2 : 24;
    if (L.has('diamond') && (H.forehead || view === 'side')) {
      ctx.fillStyle = '#8a4fc2';
      ctx.beginPath();
      ctx.moveTo(cx, 11.2);
      ctx.lineTo(cx + 0.9, 12.5);
      ctx.lineTo(cx, 13.8);
      ctx.lineTo(cx - 0.9, 12.5);
      ctx.closePath();
      ctx.fill();
    }
    if (L.has('lovemark') && view !== 'side') {
      ctx.strokeStyle = '#c0302a';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(26.4, 12.2);
      ctx.lineTo(29.2, 12.2);
      ctx.moveTo(27.8, 11.4);
      ctx.lineTo(27.8, 14.6);
      ctx.moveTo(26.6, 13.6);
      ctx.lineTo(29, 14.2);
      ctx.stroke();
    }
    if (L.has('seal_marks')) {
      ctx.strokeStyle = 'rgba(160,110,255,0.9)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 3, 22);
      ctx.lineTo(cx - 1.8, 24.4);
      if (view !== 'side') {
        ctx.moveTo(cx + 3, 22);
        ctx.lineTo(cx + 1.8, 24.4);
      }
      ctx.stroke();
    }
  }

  // ---------- specials ----------
  function drawFox(ctx, dir, f) {
    const b = f === 1 ? 0 : -0.6;
    const side = dir === 'left';
    const col = '#e8612c';
    // tails
    const tails = P();
    for (let i = 0; i < 9; i++) {
      const a = (-160 + i * 17.5) * D2R;
      const bx = side ? 30 : 24, by = 33;
      spike(tails, bx, by + b, bx + Math.cos(a) * 12 + (side ? 4 : 0), by - 6 + Math.sin(a) * 9 + b, 3.4, 0.35, (i - 4) * 0.4);
    }
    if (dir === 'up') {
      // tails in front when seen from behind
    } else cel(ctx, tails, col, { lw: 0.45 });
    const body = P();
    if (side) {
      ell(body, 25, 36 + b, 8.4, 6.2);
    } else ell(body, 24, 36 + b, 7.6, 6.6);
    cel(ctx, body, col);
    // legs
    const legs = P();
    const lp = side ? [19.6, 26.6] : [19.6, 28.4];
    lp.forEach((x, i) => rr(legs, x - 1.6 + (side && f !== 1 ? (i ? -1 : 1) : 0), 39 + b, 3.2, 6.8 - b - (f !== 1 && i === (f === 0 ? 0 : 1) ? 1 : 0), 1.4));
    cel(ctx, legs, '#3a2a2a');
    // head
    const h = P();
    const hx = side ? 17.6 : 24;
    ell(h, hx, 22.4 + b, 8, 7);
    // ears
    spike(h, hx - 4.4, 17.4 + b, hx - 6.4, 9.2 + b, 4.4, 0.2);
    spike(h, hx + 4.4, 17.4 + b, hx + 6.4, 9.2 + b, 4.4, 0.2);
    if (side) spike(h, hx - 5.4, 24 + b, hx - 11, 25.4 + b, 5, 0.15);
    cel(ctx, h, col);
    if (dir !== 'up') {
      ctx.fillStyle = '#f7efe4';
      ctx.beginPath();
      if (side) ctx.ellipse(hx - 4.4, 25.4 + b, 3.4, 2, 0, 0, U.TAU);
      else ctx.ellipse(hx, 25.6 + b, 4.2, 2.6, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#f6c343';
      const es = side ? [hx - 3.6] : [hx - 3, hx + 3];
      for (const ex of es) {
        ctx.beginPath();
        ctx.ellipse(ex, 21.4 + b, 1.2, 1.6, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(ex - 0.25, 20.2 + b, 0.5, 2.4);
        ctx.fillStyle = '#f6c343';
      }
      ctx.fillStyle = '#1a1010';
      ctx.beginPath();
      ctx.arc(side ? hx - 7.6 : hx, 24.2 + b, 0.8, 0, U.TAU);
      ctx.fill();
    } else cel(ctx, tails, col, { lw: 0.45 });
  }

  function drawDog(ctx, dir, f) {
    const b = f === 1 ? 0 : -0.5;
    const side = dir === 'left';
    const col = '#f2eee6';
    const body = P();
    if (side) ell(body, 26, 33 + b, 10.4, 6.6);
    else ell(body, 24, 34 + b, 8.4, 7.4);
    cel(ctx, body, col, { depth: 0.18 });
    const legs = P();
    const xs = side ? [18.6, 22.6, 29, 33] : [18.8, 22.4, 25.6, 29.2];
    xs.forEach((x, i) => {
      const lift = f !== 1 && (i % 2 === (f === 0 ? 0 : 1)) ? 1.2 : 0;
      rr(legs, x - 1.5, 37 + b, 3, 8.8 - b - lift, 1.3);
    });
    cel(ctx, legs, col, { depth: 0.2 });
    const h = P();
    const hx = side ? 15.4 : 24;
    const hy = side ? 24.6 : 23;
    ell(h, hx, hy + b, 7, 6.2);
    if (side) ell(h, hx - 5.6, hy + 2.4 + b, 3.8, 2.8);
    cel(ctx, h, col, { depth: 0.18 });
    const ears = P();
    ell(ears, hx - (side ? -2.6 : 5.6), hy - 1 + b, 2.4, 4, 0.3);
    if (!side) ell(ears, hx + 5.6, hy - 1 + b, 2.4, 4, -0.3);
    cel(ctx, ears, '#e8dcc8', { depth: 0.2 });
    if (dir !== 'up') {
      ctx.fillStyle = '#1a1414';
      const es = side ? [hx - 2.6] : [hx - 2.6, hx + 2.6];
      for (const ex of es) {
        ctx.beginPath();
        ctx.arc(ex, hy - 0.6 + b, 0.9, 0, U.TAU);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(side ? hx - 8.8 : hx, hy + (side ? 1.8 : 2.4) + b, 1.1, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#d9534f';
      ctx.beginPath();
      ctx.ellipse(side ? hx - 3.6 : hx, hy + 4.2 + b, 1, 0.7, 0, 0, U.TAU);
      ctx.fill();
    }
  }

  // ---------- frame assembly ----------
  function drawFrame(ctx, spec, dir, frame) {
    const L = spec;
    const view = dir === 'left' ? 'side' : dir === 'up' ? 'back' : 'front';
    const vfull = view === 'front' ? 'down' : view;
    if (L.build === 'fox') return drawFox(ctx, dir, frame);
    if (L.build === 'dog') return drawDog(ctx, dir, frame);
    const step = frame === 0 ? -1 : frame === 2 ? 1 : 0;
    const pose = { step, bob: step ? -0.55 : 0 };
    const H = hairLayers(L, view);

    if (view !== 'back') {
      drawBackAcc(ctx, L, view, pose, true);
      drawHair(ctx, L, view, H, 'back');
    }
    if (view === 'side') drawArms(ctx, L, view, pose, 'far');
    drawLegs(ctx, L, view, pose);
    drawTorso(ctx, L, view, pose);
    drawOvercoat(ctx, L, view, pose);
    if (view !== 'side') drawArms(ctx, L, view, pose);
    drawNeckAcc(ctx, L, vfull, pose);
    if (view === 'back') {
      drawBackAcc(ctx, L, view, pose, false);
    }
    // head (offset by bob)
    ctx.save();
    ctx.translate(0, pose.bob);
    const hp = headPath(view);
    if (view === 'side') {
      // ear
      const e = P();
      ell(e, 26.8, 18.8, 1.5, 2.1);
      cel(ctx, e, L.skin, { lw: 0.4 });
    }
    cel(ctx, hp, L.skin, { depth: 0.16, ox: 0.9, oy: 1.1 });
    if (view === 'front' && !H.noCap) {
      // soft hair shadow on forehead
      ctx.save();
      ctx.clip(hp);
      ctx.fillStyle = U.rgba(U.shadow(L.skin, 0.3), 0.45);
      ctx.beginPath();
      ctx.ellipse(24, 12.6, 10.4, 4.6, 0, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    }
    drawFace(ctx, L, view);
    drawHair(ctx, L, view, H, view === 'back' ? 'backhead' : 'head');
    if (L.has('headband')) drawHeadband(ctx, L, view, 'leaf');
    if (L.has('headband_sand')) drawHeadband(ctx, L, view, 'sand');
    if (L.has('headband_slashed')) drawHeadband(ctx, L, view, 'slashed');
    if (L.has('bandana')) drawHeadband(ctx, L, view, 'bandana');
    if (view !== 'back') drawHairPath(ctx, H.over, L.hairColor);
    drawHat(ctx, L, view, H);
    drawForeheadMarks(ctx, L, view, H);
    ctx.restore();
    if (view === 'back') {
      ctx.save();
      ctx.translate(0, pose.bob);
      drawHair(ctx, L, view, H, 'overBody');
      ctx.restore();
    }
  }

  // Dark outline around the whole silhouette (stamped in 8 directions).
  function outlined(src, px) {
    const c = U.canvas(src.width, src.height);
    const x = c.getContext('2d');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * U.TAU;
      x.drawImage(src, Math.cos(a) * px, Math.sin(a) * px);
    }
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = OUT;
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    x.drawImage(src, 0, 0);
    return c;
  }

  // Build a 3x4 sheet. frame = 48 units * scale pixels.
  SG.build = function (look, scale, id) {
    const L = normLook(look);
    L.id = id;
    const fs = Math.round(48 * scale);
    const sheet = U.canvas(fs * 3, fs * 4);
    const sx = sheet.getContext('2d');
    const dirs = ['down', 'left', 'right', 'up'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const f = U.canvas(fs, fs);
        const fx = f.getContext('2d');
        fx.lineJoin = 'round';
        fx.lineCap = 'round';
        fx.scale(fs / 48, fs / 48);
        if (dirs[r] === 'right') {
          fx.translate(48, 0);
          fx.scale(-1, 1);
          drawFrame(fx, L, 'left', c);
        } else drawFrame(fx, L, dirs[r], c);
        sx.drawImage(outlined(f, Math.max(1, (fs / 48) * 0.85)), c * fs, r * fs);
      }
    }
    return sheet;
  };

  // Cached sheet sized for on-screen drawing at the current pixel ratio.
  SG.get = function (id, px) {
    const ch = NR.CHARS[id];
    if (!ch) return null;
    const scale = px || (NR.TS / 48) * NR.engine.cpr;
    const key = id + '@' + scale.toFixed(3);
    if (!SG.cache[key]) {
      const canvas = SG.build(ch.look, scale, id);
      SG.cache[key] = { img: canvas, fw: canvas.width / 3, fh: canvas.height / 4, cols: 3, rows: 4, smooth: true, generated: true };
    }
    return SG.cache[key];
  };
  SG.clear = () => (SG.cache = {});
  NR.engine && NR.engine.on('cprchange', () => SG.clear());
  SG.drawFrame = drawFrame;
  SG.normLook = normLook;
})();
