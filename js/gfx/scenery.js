// Richer painted scenery in an anime-background style: two-tone clouds, clumped foliage,
// detailed Konoha buildings, the carved Hokage Monument and warm interiors.
// Extends NR.backdrops (see backdrops.js); static layers are painted once and cached.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const W = NR.W, H = NR.H;
  const BD = NR.backdrops;
  const DEF = BD.DEF;
  const { sky, stars, moon, sun, water, paperLantern, vignette } = BD.helpers;

  // ---------- helpers ----------
  const circles = (r, cx, cy, rx, ry, n, rmin, rmax) => {
    const p = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = r() * U.TAU, d = Math.sqrt(r());
      const px = cx + Math.cos(a) * d * rx, py = cy + Math.sin(a) * d * ry;
      const rr = rmin + r() * (rmax - rmin);
      p.moveTo(px + rr, py);
      p.arc(px, py, rr, 0, U.TAU);
    }
    return p;
  };

  // Cumulus cloud with a lit top and a soft shadowed, flat base.
  function cloud(x, cx, cy, w, seed, lit = '#ffffff', shade = '#c6d3ec') {
    const r = U.rng(seed);
    const p = new Path2D();
    const n = 7 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const hump = Math.sin(t * Math.PI);
      const rr = w * (0.08 + hump * 0.12) * (0.8 + r() * 0.45);
      const px = cx - w / 2 + t * w, py = cy - rr * 0.3 - hump * w * 0.05;
      p.moveTo(px + rr, py);
      p.arc(px, py, rr, 0, U.TAU);
    }
    x.save();
    x.beginPath();
    x.rect(cx - w, cy - w, w * 2, w);
    x.clip();
    x.fillStyle = shade;
    x.fill(p);
    x.clip(p);
    x.translate(-w * 0.025, -w * 0.06);
    x.fillStyle = lit;
    x.fill(p);
    x.restore();
  }

  // A clump of leaves: dark core, mid tone, light top-left and small highlights.
  function foliage(x, cx, cy, rx, ry, base, seed, o = {}) {
    const r = U.rng(seed);
    const s = Math.min(rx, ry);
    const light = o.light || [-0.22, -0.34];
    x.fillStyle = U.shade(base, -0.36);
    x.fill(circles(r, cx, cy, rx, ry, 26, s * 0.3, s * 0.52));
    x.fillStyle = base;
    x.fill(circles(r, cx + light[0] * rx * 0.3, cy + light[1] * ry * 0.3, rx * 0.84, ry * 0.76, 22, s * 0.26, s * 0.44));
    x.fillStyle = U.light(base, 0.2);
    x.fill(circles(r, cx + light[0] * rx, cy + light[1] * ry, rx * 0.52, ry * 0.44, 16, s * 0.16, s * 0.32));
    x.fillStyle = U.light(base, 0.42);
    x.fill(circles(r, cx + light[0] * rx * 1.3, cy + light[1] * ry * 1.3, rx * 0.34, ry * 0.26, 10, s * 0.05, s * 0.13));
    x.fillStyle = U.rgba(U.shade(base, -0.55), 0.3);
    for (let i = 0; i < 36; i++) {
      const a = r() * U.TAU, d = Math.sqrt(r());
      x.beginPath();
      x.ellipse(cx + Math.cos(a) * d * rx * 0.9, cy + Math.sin(a) * d * ry * 0.9, s * 0.06, s * 0.028, r() * 3, 0, U.TAU);
      x.fill();
    }
    if (o.blossom) {
      for (let i = 0; i < (o.blossom | 0); i++) {
        const a = r() * U.TAU, d = Math.sqrt(r());
        x.fillStyle = r() < 0.5 ? 'rgba(255,246,250,0.9)' : 'rgba(255,200,222,0.85)';
        x.beginPath();
        x.arc(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, 1.5 + r() * 2.2, 0, U.TAU);
        x.fill();
      }
    }
  }

  // Broadleaf tree: shaded trunk, branches and several foliage clumps.
  function tree(x, cx, baseY, h, o = {}) {
    const r = U.rng(o.seed || 7);
    const trunk = o.trunk || '#5a3b26', leaf = o.leaf || '#4d8c3c';
    const tw = h * (o.thick || 0.06);
    const g = x.createLinearGradient(cx - tw * 1.4, 0, cx + tw * 1.4, 0);
    g.addColorStop(0, U.light(trunk, 0.18));
    g.addColorStop(0.55, trunk);
    g.addColorStop(1, U.shade(trunk, -0.4));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(cx - tw * 1.5, baseY);
    x.quadraticCurveTo(cx - tw * 0.6, baseY - h * 0.25, cx - tw * 0.7, baseY - h * 0.6);
    x.lineTo(cx + tw * 0.7, baseY - h * 0.6);
    x.quadraticCurveTo(cx + tw * 0.7, baseY - h * 0.25, cx + tw * 1.6, baseY);
    x.closePath();
    x.fill();
    // bark lines
    x.strokeStyle = U.rgba(U.shade(trunk, -0.5), 0.45);
    x.lineWidth = Math.max(1, tw * 0.08);
    for (let i = 0; i < 5; i++) {
      const bx = cx + (r() - 0.5) * tw;
      x.beginPath();
      x.moveTo(bx, baseY - r() * h * 0.1);
      x.quadraticCurveTo(bx + (r() - 0.5) * tw * 0.6, baseY - h * 0.3, bx + (r() - 0.5) * tw * 0.4, baseY - h * (0.35 + r() * 0.25));
      x.stroke();
    }
    x.lineCap = 'round';
    x.strokeStyle = U.shade(trunk, -0.12);
    for (const [ang, len, wd] of [[-2.4, 0.3, 0.5], [-0.75, 0.32, 0.5], [-1.9, 0.22, 0.34], [-1.2, 0.24, 0.34]]) {
      x.lineWidth = tw * wd;
      const sx = cx, sy = baseY - h * 0.55;
      x.beginPath();
      x.moveTo(sx, sy);
      x.quadraticCurveTo(sx + Math.cos(ang) * h * len * 0.5, sy + Math.sin(ang) * h * len * 0.7, sx + Math.cos(ang) * h * len, sy + Math.sin(ang) * h * len);
      x.stroke();
    }
    const clumps = o.clumps || [[-0.3, -0.66, 0.3, 0.2], [0.32, -0.68, 0.32, 0.2], [0, -0.78, 0.44, 0.26], [-0.12, -0.98, 0.3, 0.18], [0.2, -0.93, 0.26, 0.16]];
    for (const [dx, dy, sx, sy] of clumps) foliage(x, cx + dx * h, baseY + dy * h, sx * h, sy * h, leaf, (r() * 1e6) | 0, { blossom: o.blossom });
  }

  // Conifer with jagged, shaded tiers.
  function pine(x, cx, baseY, h, col, seed) {
    const r = U.rng(seed);
    x.fillStyle = '#4a3020';
    x.fillRect(cx - h * 0.025, baseY - h * 0.2, h * 0.05, h * 0.2);
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const k = i / tiers;
      const tw = h * (0.34 - k * 0.24), ty = baseY - h * (0.14 + k * 0.17), top = ty - h * 0.3;
      const p = new Path2D();
      p.moveTo(cx, top);
      const n = 7;
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        const px = cx + tw * (t * 2 - 1), py = ty + (j % 2 ? -h * 0.03 : 0) + (r() - 0.5) * h * 0.012;
        p.lineTo(px, py);
      }
      p.closePath();
      x.fillStyle = U.shade(col, -0.1 - k * 0.05);
      x.fill(p);
      x.save();
      x.clip(p);
      x.fillStyle = U.rgba(U.shade(col, -0.45), 0.55);
      x.fillRect(cx + tw * 0.1, top, tw, ty - top + 4);
      x.fillStyle = U.rgba(U.light(col, 0.3), 0.5);
      x.beginPath();
      x.moveTo(cx - 2, top + 4);
      x.lineTo(cx - tw * 0.55, ty - 2);
      x.lineTo(cx - tw * 0.2, ty - 2);
      x.closePath();
      x.fill();
      x.restore();
    }
  }

  // Grass field with mottling, blades and optional flowers.
  function field(x, y0, top, bottom, seed, o = {}) {
    const g = x.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    x.fillStyle = g;
    x.fillRect(0, y0, W, H - y0);
    const r = U.rng(seed);
    for (let i = 0; i < 70; i++) {
      const py = y0 + Math.pow(r(), 0.75) * (H - y0), k = (py - y0) / (H - y0);
      x.fillStyle = U.rgba(r() < 0.5 ? U.shade(top, -0.2) : U.light(top, 0.14), 0.22);
      x.beginPath();
      x.ellipse(r() * W, py, (50 + r() * 140) * (0.4 + k), (5 + r() * 9) * (0.4 + k), 0, 0, U.TAU);
      x.fill();
    }
    x.lineCap = 'round';
    for (let i = 0; i < (o.blades || 1100); i++) {
      const py = y0 + Math.pow(r(), 0.8) * (H - y0), k = (py - y0) / (H - y0);
      const hh = (3 + r() * 9) * (0.35 + k * 1.5), px = r() * W;
      x.strokeStyle = U.rgba(r() < 0.55 ? U.shade(bottom, -0.28) : U.light(top, 0.32), 0.55);
      x.lineWidth = 0.8 + k * 1.2;
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + (r() - 0.5) * 4, py - hh * 0.6, px + (r() - 0.5) * 9, py - hh);
      x.stroke();
    }
    for (let i = 0; i < (o.flowers || 0); i++) {
      const py = y0 + Math.pow(r(), 0.7) * (H - y0), k = (py - y0) / (H - y0);
      x.fillStyle = U.pick(o.flowerCols || ['#ffffff', '#ffe36a', '#ffb3cf']);
      x.beginPath();
      x.arc(r() * W, py, 1.4 + k * 2.4, 0, U.TAU);
      x.fill();
    }
  }

  // Distant mountain range with a lit ridge line.
  function mountains(x, y0, h, col, seed, o = {}) {
    const r = U.rng(seed);
    const p = new Path2D();
    p.moveTo(0, H);
    p.lineTo(0, y0);
    let px = 0;
    while (px < W + 40) {
      const w = 140 + r() * 240, pk = y0 - h * (0.45 + r() * 0.55);
      p.quadraticCurveTo(px + w * 0.28, pk + h * 0.12, px + w * 0.5, pk);
      p.quadraticCurveTo(px + w * 0.72, pk + h * 0.14, px + w, y0 - r() * h * 0.25);
      px += w;
    }
    p.lineTo(W, H);
    p.closePath();
    x.fillStyle = col;
    x.fill(p);
    if (o.rim) {
      x.save();
      x.clip(p);
      x.translate(6, 10);
      x.fillStyle = U.rgba(U.shade(col, -0.12), 0.8);
      x.fill(p);
      x.restore();
    }
  }

  // Horizontal cobbled/earth ground seen at a low angle.
  function ground(x, y0, top, bottom, seed, o = {}) {
    const g = x.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    x.fillStyle = g;
    x.fillRect(0, y0, W, H - y0);
    const r = U.rng(seed);
    if (o.cobble) {
      let row = 0;
      for (let py = y0 + 4; py < H; row++) {
        const k = (py - y0) / (H - y0);
        const sh = 6 + k * 26, sw = 22 + k * 70;
        for (let px = -((row % 2) * sw) / 2; px < W; px += sw) {
          x.fillStyle = U.rgba(U.shade(top, (r() - 0.5) * 0.18), 0.9);
          x.beginPath();
          x.ellipse(px + sw / 2, py + sh / 2, sw * 0.46, sh * 0.42, 0, 0, U.TAU);
          x.fill();
          x.fillStyle = 'rgba(255,255,255,0.12)';
          x.beginPath();
          x.ellipse(px + sw / 2 - sw * 0.08, py + sh * 0.35, sw * 0.3, sh * 0.16, 0, 0, U.TAU);
          x.fill();
        }
        py += sh + 2;
      }
    } else {
      for (let i = 0; i < 400; i++) {
        const py = y0 + Math.pow(r(), 0.8) * (H - y0), k = (py - y0) / (H - y0);
        x.fillStyle = U.rgba(r() < 0.5 ? U.shade(bottom, -0.25) : U.light(top, 0.2), 0.35);
        x.beginPath();
        x.ellipse(r() * W, py, 1 + k * 4, 0.6 + k * 2, 0, 0, U.TAU);
        x.fill();
      }
    }
  }

  // Frontal Konoha building: plaster walls, framed windows, tiled or flat roof.
  function building(x, px, baseY, w, h, o = {}) {
    const wall = o.wall || '#ecdfc8', roof = o.roof || '#b8552f', r = U.rng(o.seed || 3);
    const top = baseY - h;
    const g = x.createLinearGradient(0, top, 0, baseY);
    g.addColorStop(0, U.light(wall, 0.06));
    g.addColorStop(1, U.shade(wall, -0.14));
    x.fillStyle = g;
    x.fillRect(px, top, w, h);
    x.fillStyle = 'rgba(70,40,40,0.16)';
    x.fillRect(px + w * 0.84, top, w * 0.16, h);
    if (o.band) {
      x.fillStyle = o.band;
      x.fillRect(px, top + h * 0.42, w, Math.max(4, h * 0.05));
    }
    // windows
    const cols = Math.max(1, Math.floor((w - 16) / 38)), rows = Math.max(1, Math.floor((h - 24) / 44));
    const cw = (w - 16) / cols, rh = (h - 24) / rows;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        if (r() < 0.12) continue;
        const wx = px + 8 + i * cw + cw * 0.2, wy = top + 12 + j * rh + rh * 0.18, ww = cw * 0.6, wh = rh * 0.56;
        x.fillStyle = U.shade(wall, -0.45);
        x.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
        const gg = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
        if (o.night) {
          const lit = r() < 0.55;
          gg.addColorStop(0, lit ? '#ffd88a' : '#26304a');
          gg.addColorStop(1, lit ? '#e8a050' : '#161c30');
        } else {
          gg.addColorStop(0, '#cfe8f8');
          gg.addColorStop(1, '#7aa8cc');
        }
        x.fillStyle = gg;
        x.fillRect(wx, wy, ww, wh);
        if (!o.night) {
          x.fillStyle = 'rgba(255,255,255,0.45)';
          x.beginPath();
          x.moveTo(wx + ww * 0.15, wy + wh);
          x.lineTo(wx + ww * 0.45, wy);
          x.lineTo(wx + ww * 0.62, wy);
          x.lineTo(wx + ww * 0.32, wy + wh);
          x.fill();
        }
        x.fillStyle = U.shade(wall, -0.45);
        x.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      }
    if (o.door) {
      const dw = Math.min(40, w * 0.3), dx = px + w * (o.doorAt || 0.5) - dw / 2;
      x.fillStyle = '#6a4630';
      x.fillRect(dx, baseY - 52, dw, 52);
      x.fillStyle = 'rgba(255,230,180,0.25)';
      x.fillRect(dx + 4, baseY - 48, dw - 8, 18);
    }
    if (o.flat) {
      x.fillStyle = U.shade(wall, -0.3);
      x.fillRect(px - 4, top - 8, w + 8, 10);
      if (o.tank) {
        const tx = px + w * (o.tankAt || 0.62), tw = Math.min(46, w * 0.34), th = tw * 0.9;
        x.fillStyle = '#6a6a72';
        x.fillRect(tx + 4, top - 18, 4, 12);
        x.fillRect(tx + tw - 8, top - 18, 4, 12);
        const tg = x.createLinearGradient(tx, 0, tx + tw, 0);
        tg.addColorStop(0, o.night ? '#3a3e52' : '#d8dce2');
        tg.addColorStop(0.4, o.night ? '#565c74' : '#f4f6f8');
        tg.addColorStop(1, o.night ? '#22263a' : '#8a9098');
        x.fillStyle = tg;
        x.fillRect(tx, top - 18 - th, tw, th);
        x.fillStyle = o.night ? '#4a5066' : '#b8bec6';
        x.beginPath();
        x.ellipse(tx + tw / 2, top - 18 - th, tw / 2, tw * 0.14, 0, 0, U.TAU);
        x.fill();
        x.strokeStyle = 'rgba(60,60,70,0.35)';
        x.lineWidth = 1.5;
        for (let k = 1; k < 3; k++) {
          x.beginPath();
          x.moveTo(tx, top - 18 - th + (th * k) / 3);
          x.lineTo(tx + tw, top - 18 - th + (th * k) / 3);
          x.stroke();
        }
      }
    } else {
      const rh = o.roofH || Math.min(60, w * 0.3), ov = 16;
      const rp = new Path2D();
      rp.moveTo(px - ov, top + 4);
      rp.quadraticCurveTo(px - ov * 0.4, top - rh * 0.25, px + w * 0.12, top - rh);
      rp.lineTo(px + w * 0.88, top - rh);
      rp.quadraticCurveTo(px + w + ov * 0.4, top - rh * 0.25, px + w + ov, top + 4);
      rp.closePath();
      const rg = x.createLinearGradient(0, top - rh, 0, top);
      rg.addColorStop(0, U.light(roof, 0.12));
      rg.addColorStop(1, U.shade(roof, -0.22));
      x.fillStyle = rg;
      x.fill(rp);
      x.save();
      x.clip(rp);
      x.strokeStyle = U.rgba(U.shade(roof, -0.45), 0.55);
      x.lineWidth = 2;
      for (let tx = px - ov; tx < px + w + ov; tx += 9) {
        x.beginPath();
        x.moveTo(tx, top + 4);
        x.lineTo(px + w / 2 + (tx - px - w / 2) * 0.76, top - rh);
        x.stroke();
      }
      for (let k = 1; k < 4; k++) {
        x.strokeStyle = U.rgba(U.light(roof, 0.25), 0.35);
        x.beginPath();
        x.moveTo(px - ov, top + 4 - (rh * k) / 4);
        x.lineTo(px + w + ov, top + 4 - (rh * k) / 4);
        x.stroke();
      }
      x.restore();
      x.fillStyle = U.shade(roof, -0.4);
      x.fillRect(px - ov, top + 1, w + ov * 2, 6);
      x.fillRect(px + w * 0.1, top - rh - 5, w * 0.8, 7);
    }
    if (o.sign) {
      x.fillStyle = '#f6efe0';
      x.fillRect(px + w * 0.2, top + 4, w * 0.6, 16);
      x.fillStyle = '#c8321e';
      x.font = 'bold 11px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(o.sign, px + w / 2, top + 12);
    }
  }

  // The Hokage Monument: rock cliff with six carved faces and trees on top.
  const FACES = ['hashirama', 'tobirama', 'hiruzen', 'minato', 'tsunade', 'kakashi'];
  function monument(x, cx, baseY, w, h, o = {}) {
    const rock = o.rock || '#b9a88a', dark = U.shade(rock, -0.35), r = U.rng(11);
    const top = baseY - h;
    const cliff = new Path2D();
    cliff.moveTo(cx - w / 2 - 30, baseY);
    cliff.lineTo(cx - w / 2, top + h * 0.2);
    let px = cx - w / 2;
    while (px < cx + w / 2) {
      px += 30 + r() * 40;
      cliff.lineTo(Math.min(px, cx + w / 2), top + (r() - 0.5) * 14 + Math.abs(px - cx) / w * 30);
    }
    cliff.lineTo(cx + w / 2 + 10, top + h * 0.22);
    cliff.lineTo(cx + w / 2 + 40, baseY);
    cliff.closePath();
    const g = x.createLinearGradient(0, top, 0, baseY);
    g.addColorStop(0, U.light(rock, 0.1));
    g.addColorStop(1, U.shade(rock, -0.2));
    x.fillStyle = g;
    x.fill(cliff);
    x.save();
    x.clip(cliff);
    // strata and cracks
    x.strokeStyle = U.rgba(dark, 0.35);
    x.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const sy = top + (i + 1) * (h / 10);
      x.beginPath();
      x.moveTo(cx - w, sy);
      for (let sx = cx - w; sx < cx + w; sx += 40) x.lineTo(sx, sy + Math.sin(sx * 0.03 + i) * 4);
      x.stroke();
    }
    for (let i = 0; i < 14; i++) {
      let sx = cx - w / 2 + r() * w, sy = top + r() * h * 0.4;
      x.beginPath();
      x.moveTo(sx, sy);
      for (let k = 0; k < 4; k++) x.lineTo((sx += (r() - 0.5) * 14), (sy += 12 + r() * 16));
      x.stroke();
    }
    x.fillStyle = U.rgba(dark, 0.25);
    x.fillRect(cx + w * 0.3, top, w * 0.3, h);
    x.restore();
    // faces
    const n = 6, fw = (w * 0.9) / n;
    FACES.forEach((kind, i) => face(x, cx - w * 0.45 + (i + 0.5) * fw, top + h * 0.52, fw * 0.36, rock, kind));
    // trees along the top
    if (!o.noTrees) {
      for (let i = 0; i < 9; i++) {
        const tx = cx - w / 2 + 20 + (i / 8) * (w - 40) + (r() - 0.5) * 30;
        foliage(x, tx, top - 4 + Math.abs(tx - cx) / w * 26, 36 + r() * 24, 18 + r() * 8, o.leaf || '#4f8a44', 100 + i);
      }
    }
  }
  function face(x, fx, fy, s, rock, kind) {
    const hi = U.light(rock, 0.18), sh = U.shade(rock, -0.32), line = U.shade(rock, -0.5);
    // hair / headgear relief behind the face
    const hair = new Path2D();
    if (kind === 'hashirama') {
      hair.ellipse(fx, fy - s * 0.1, s * 1.12, s * 1.3, 0, Math.PI * 1.05, Math.PI * 1.95);
      hair.lineTo(fx + s * 1.1, fy + s * 0.9);
      hair.lineTo(fx - s * 1.1, fy + s * 0.9);
    } else if (kind === 'minato' || kind === 'kakashi' || kind === 'tobirama') {
      hair.moveTo(fx - s * 1.1, fy + s * 0.1);
      const spikes = kind === 'tobirama' ? 5 : 7;
      for (let k = 0; k <= spikes; k++) {
        const t = k / spikes, a = Math.PI * (1.05 + t * 0.9);
        const rr = s * (k % 2 ? 1.25 : 1.55) * (kind === 'kakashi' ? 1.05 : 1);
        const tilt = kind === 'kakashi' ? -s * 0.35 * t : 0;
        hair.lineTo(fx + Math.cos(a) * rr + tilt, fy - s * 0.2 + Math.sin(a) * rr);
      }
      hair.lineTo(fx + s * 1.1, fy + s * 0.1);
      hair.closePath();
    } else if (kind === 'tsunade') {
      hair.ellipse(fx, fy - s * 0.15, s * 1.15, s * 1.2, 0, Math.PI, 0);
      hair.lineTo(fx + s * 1.3, fy + s * 1.2);
      hair.lineTo(fx + s * 0.9, fy + s * 1.2);
      hair.lineTo(fx + s * 0.9, fy);
      hair.lineTo(fx - s * 0.9, fy);
      hair.lineTo(fx - s * 0.9, fy + s * 1.2);
      hair.lineTo(fx - s * 1.3, fy + s * 1.2);
      hair.closePath();
    } else {
      // hiruzen: hat-like crown
      hair.ellipse(fx, fy - s * 0.25, s * 1.08, s * 1.05, 0, Math.PI, 0);
      hair.closePath();
    }
    x.save();
    x.translate(-4, 4);
    x.fillStyle = U.rgba(sh, 0.7);
    x.fill(hair);
    x.restore();
    x.fillStyle = U.shade(rock, -0.08);
    x.fill(hair);
    // face oval with carved shading
    const fp = new Path2D();
    fp.ellipse(fx, fy + s * 0.12, s * 0.82, s * 1.02, 0, 0, U.TAU);
    x.save();
    x.translate(-5, 6);
    x.fillStyle = U.rgba(sh, 0.8);
    x.fill(fp);
    x.restore();
    const fg = x.createLinearGradient(fx - s, fy - s, fx + s, fy + s);
    fg.addColorStop(0, hi);
    fg.addColorStop(1, U.shade(rock, -0.06));
    x.fillStyle = fg;
    x.fill(fp);
    // features
    x.strokeStyle = line;
    x.lineCap = 'round';
    x.lineWidth = Math.max(2, s * 0.09);
    x.beginPath();
    for (const d of [-1, 1]) {
      x.moveTo(fx + d * s * 0.62, fy - s * 0.18);
      x.lineTo(fx + d * s * 0.16, fy - s * 0.08);
      x.moveTo(fx + d * s * 0.56, fy + s * 0.08);
      x.quadraticCurveTo(fx + d * s * 0.38, fy + s * 0.14, fx + d * s * 0.2, fy + s * 0.08);
    }
    x.moveTo(fx, fy + s * 0.12);
    x.lineTo(fx - s * 0.06, fy + s * 0.42);
    x.stroke();
    if (kind === 'kakashi') {
      x.fillStyle = U.rgba(sh, 0.6);
      x.beginPath();
      x.ellipse(fx, fy + s * 0.72, s * 0.8, s * 0.42, 0, Math.PI * 1.02, Math.PI * 1.98, true);
      x.fill();
      x.beginPath();
      x.moveTo(fx - s * 0.8, fy + s * 0.34);
      x.quadraticCurveTo(fx, fy + s * 0.46, fx + s * 0.8, fy + s * 0.34);
      x.stroke();
    } else {
      x.beginPath();
      x.moveTo(fx - s * 0.26, fy + s * 0.66);
      x.quadraticCurveTo(fx, fy + s * 0.72, fx + s * 0.26, fy + s * 0.66);
      x.stroke();
    }
    if (kind === 'tsunade') {
      x.fillStyle = line;
      x.beginPath();
      x.moveTo(fx, fy - s * 0.5);
      x.lineTo(fx + s * 0.08, fy - s * 0.4);
      x.lineTo(fx, fy - s * 0.3);
      x.lineTo(fx - s * 0.08, fy - s * 0.4);
      x.fill();
    }
    if (kind === 'hashirama' || kind === 'tobirama' || kind === 'minato') {
      // forehead protector band
      x.fillStyle = U.rgba(sh, 0.55);
      x.fillRect(fx - s * 0.84, fy - s * 0.62, s * 1.68, s * 0.18);
    }
  }

  // The round red Hokage Tower seen from the front.
  function hokageTower(x, cx, baseY, s) {
    const w = 190 * s, h = 120 * s, top = baseY - h;
    const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, '#b8402c');
    g.addColorStop(0.35, '#e0664a');
    g.addColorStop(1, '#8a2a1e');
    x.fillStyle = g;
    x.fillRect(cx - w / 2, top, w, h);
    x.fillStyle = '#f2e6d0';
    x.fillRect(cx - w / 2, top + h * 0.32, w, 5 * s);
    x.fillRect(cx - w / 2, top + h * 0.62, w, 5 * s);
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < 7; i++) {
        const wx = cx - w / 2 + 12 * s + i * ((w - 24 * s) / 7), wy = top + 10 * s + row * h * 0.34;
        x.fillStyle = '#2a3a58';
        x.fillRect(wx, wy, 16 * s, 20 * s);
        x.fillStyle = '#9ac8e8';
        x.fillRect(wx + 2 * s, wy + 2 * s, 12 * s, 16 * s);
      }
    x.fillStyle = '#5a2a1e';
    x.fillRect(cx - 18 * s, baseY - 34 * s, 36 * s, 34 * s);
    // round roof and upper drum
    x.fillStyle = '#c84a32';
    x.beginPath();
    x.ellipse(cx, top, w * 0.58, 16 * s, 0, 0, U.TAU);
    x.fill();
    const tg = x.createLinearGradient(cx - w * 0.3, 0, cx + w * 0.3, 0);
    tg.addColorStop(0, '#c8503a');
    tg.addColorStop(0.4, '#ee7456');
    tg.addColorStop(1, '#9a3020');
    x.fillStyle = tg;
    x.fillRect(cx - w * 0.28, top - 70 * s, w * 0.56, 70 * s);
    x.fillStyle = '#e06a4e';
    x.beginPath();
    x.ellipse(cx, top - 70 * s, w * 0.28, 9 * s, 0, 0, U.TAU);
    x.fill();
    x.fillStyle = '#f6f0e4';
    x.beginPath();
    x.arc(cx, top - 36 * s, 17 * s, 0, U.TAU);
    x.fill();
    x.fillStyle = '#c8321e';
    x.font = `bold ${Math.round(20 * s)}px sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('火', cx, top - 35 * s);
  }

  function lampPost(x, px, baseY, h, lit) {
    x.fillStyle = '#3a2e28';
    x.fillRect(px - 3, baseY - h, 6, h);
    x.fillStyle = '#2a201c';
    x.fillRect(px - 12, baseY - h - 6, 24, 6);
    x.fillStyle = lit ? '#ffe0a0' : '#f4ead0';
    x.fillRect(px - 9, baseY - h - 30, 18, 24);
    x.fillStyle = '#2a201c';
    x.beginPath();
    x.moveTo(px - 14, baseY - h - 30);
    x.lineTo(px, baseY - h - 42);
    x.lineTo(px + 14, baseY - h - 30);
    x.fill();
    if (lit) {
      const g = x.createRadialGradient(px, baseY - h - 18, 2, px, baseY - h - 18, 80);
      g.addColorStop(0, 'rgba(255,210,130,0.5)');
      g.addColorStop(1, 'rgba(255,210,130,0)');
      x.fillStyle = g;
      x.fillRect(px - 80, baseY - h - 98, 160, 160);
    }
  }

  function shojiWall(x, x0, y0, x1, y1, o = {}) {
    const glow = o.glow || '#fff1d0';
    x.fillStyle = o.frame || '#5a3a24';
    x.fillRect(x0, y0, x1 - x0, y1 - y0);
    const panelW = o.panelW || 150;
    for (let px = x0 + 8; px < x1 - 8; px += panelW) {
      const pw = Math.min(panelW - 8, x1 - 8 - px);
      const g = x.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, U.light(glow, 0.05));
      g.addColorStop(1, U.shade(glow, -0.12));
      x.fillStyle = g;
      x.fillRect(px, y0 + 8, pw, y1 - y0 - 16);
      x.strokeStyle = U.rgba(o.frame || '#5a3a24', 0.85);
      x.lineWidth = 3;
      for (let gx = px + pw / 3; gx < px + pw - 2; gx += pw / 3) {
        x.beginPath();
        x.moveTo(gx, y0 + 8);
        x.lineTo(gx, y1 - 8);
        x.stroke();
      }
      for (let gy = y0 + 8 + (y1 - y0) / 5; gy < y1 - 10; gy += (y1 - y0) / 5) {
        x.beginPath();
        x.moveTo(px, gy);
        x.lineTo(px + pw, gy);
        x.stroke();
      }
    }
  }

  // Perspective floor (planks or tatami) converging toward a vanishing point.
  function floor(x, y0, kind, o = {}) {
    const vx = o.vx || W / 2, vy = o.vy || y0 - 260;
    const base = kind === 'tatami' ? '#b8b070' : o.col || '#a8784c';
    const g = x.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, U.shade(base, -0.08));
    g.addColorStop(1, U.shade(base, -0.3));
    x.fillStyle = g;
    x.fillRect(0, y0, W, H - y0);
    const toY = (t) => y0 + (H - y0) * t;
    const proj = (bx, yy) => vx + (bx - vx) * ((yy - vy) / (H - vy));
    if (kind === 'tatami') {
      // rows of mats with dark borders
      const rows = [0, 0.16, 0.38, 0.66, 1];
      for (let i = 0; i < rows.length - 1; i++) {
        const ya = toY(rows[i]), yb = toY(rows[i + 1]);
        const cols = 6;
        for (let c = -cols; c < cols; c++) {
          const bx0 = vx + c * 230, bx1 = bx0 + 230;
          const p = new Path2D();
          p.moveTo(proj(bx0, ya) + 2, ya + 2);
          p.lineTo(proj(bx1, ya) - 2, ya + 2);
          p.lineTo(proj(bx1, yb) - 2, yb - 2);
          p.lineTo(proj(bx0, yb) + 2, yb - 2);
          p.closePath();
          x.fillStyle = U.shade(base, ((c + i) % 2 ? -0.04 : 0.04) - rows[i] * 0.15);
          x.fill(p);
          x.strokeStyle = 'rgba(40,40,20,0.85)';
          x.lineWidth = 3 + rows[i] * 6;
          x.stroke(p);
          x.save();
          x.clip(p);
          x.strokeStyle = 'rgba(90,90,40,0.22)';
          x.lineWidth = 1;
          for (let k = 0; k < 24; k++) {
            const t = k / 24, yy = ya + (yb - ya) * t;
            x.beginPath();
            x.moveTo(0, yy);
            x.lineTo(W, yy);
            x.stroke();
          }
          x.restore();
        }
      }
    } else {
      x.strokeStyle = 'rgba(60,34,18,0.4)';
      x.lineWidth = 2;
      for (let i = -16; i <= 16; i++) {
        const bx = vx + i * 90;
        x.beginPath();
        x.moveTo(proj(bx, y0), y0);
        x.lineTo(bx, H);
        x.stroke();
      }
      const r = U.rng(5);
      for (let k = 1; k < 10; k++) {
        const yy = y0 + (H - y0) * Math.pow(k / 10, 1.5);
        x.strokeStyle = 'rgba(60,34,18,0.2)';
        x.beginPath();
        for (let i = -16; i <= 16; i += 2) {
          const off = r() < 0.5 ? 0 : 1;
          const a = vx + (i + off) * 90;
          x.moveTo(proj(a, yy), yy);
          x.lineTo(proj(a + 90, yy), yy);
        }
        x.stroke();
      }
      x.fillStyle = 'rgba(255,230,190,0.08)';
      x.fillRect(0, y0, W, 6);
    }
  }

  function glow(x, px, py, r, col, a) {
    const g = x.createRadialGradient(px, py, 1, px, py, r);
    g.addColorStop(0, U.rgba(col, a));
    g.addColorStop(1, U.rgba(col, 0));
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }

  function lowTable(x, cx, cy, w, o = {}) {
    const h = w * 0.28;
    x.fillStyle = 'rgba(0,0,0,0.28)';
    x.beginPath();
    x.ellipse(cx, cy + h * 1.2, w * 0.6, h * 0.5, 0, 0, U.TAU);
    x.fill();
    x.fillStyle = '#4a2a1a';
    for (const d of [-1, 1]) x.fillRect(cx + d * w * 0.38 - 6, cy, 12, h);
    const top = new Path2D();
    top.moveTo(cx - w * 0.44, cy - h * 0.3);
    top.lineTo(cx + w * 0.44, cy - h * 0.3);
    top.lineTo(cx + w * 0.5, cy + h * 0.2);
    top.lineTo(cx - w * 0.5, cy + h * 0.2);
    top.closePath();
    const g = x.createLinearGradient(0, cy - h * 0.3, 0, cy + h * 0.2);
    g.addColorStop(0, '#8a5a36');
    g.addColorStop(1, '#6a4028');
    x.fillStyle = g;
    x.fill(top);
    x.fillStyle = '#4a2a1a';
    x.fillRect(cx - w * 0.5, cy + h * 0.2, w, 8);
    if (o.sake) {
      // tokkuri bottle and cups
      const bx = cx - w * 0.12, by = cy - h * 0.1;
      x.fillStyle = '#f2ece0';
      x.beginPath();
      x.moveTo(bx - 6, by - 58);
      x.quadraticCurveTo(bx - 4, by - 34, bx - 18, by - 16);
      x.quadraticCurveTo(bx - 22, by, bx, by);
      x.quadraticCurveTo(bx + 22, by, bx + 18, by - 16);
      x.quadraticCurveTo(bx + 4, by - 34, bx + 6, by - 58);
      x.closePath();
      x.fill();
      x.fillStyle = '#3a4a8a';
      x.fillRect(bx - 16, by - 22, 32, 5);
      for (const d of [0.12, 0.28]) {
        const ux = cx + w * d, uy = cy - h * 0.02;
        x.fillStyle = '#f2ece0';
        x.beginPath();
        x.moveTo(ux - 10, uy - 12);
        x.lineTo(ux + 10, uy - 12);
        x.lineTo(ux + 6, uy);
        x.lineTo(ux - 6, uy);
        x.fill();
        x.fillStyle = '#e8d8a0';
        x.beginPath();
        x.ellipse(ux, uy - 12, 10, 3, 0, 0, U.TAU);
        x.fill();
      }
    }
    if (o.tea) {
      for (const d of [-0.2, 0.2]) {
        const ux = cx + w * d, uy = cy - h * 0.05;
        x.fillStyle = '#6a8a6a';
        x.fillRect(ux - 9, uy - 16, 18, 16);
        x.fillStyle = '#9ab89a';
        x.beginPath();
        x.ellipse(ux, uy - 16, 9, 3, 0, 0, U.TAU);
        x.fill();
      }
    }
  }
  function cushion(x, cx, cy, w, col) {
    const p = new Path2D();
    p.moveTo(cx - w * 0.5, cy);
    p.quadraticCurveTo(cx, cy - w * 0.16, cx + w * 0.5, cy);
    p.quadraticCurveTo(cx + w * 0.56, cy + w * 0.18, cx + w * 0.5, cy + w * 0.3);
    p.quadraticCurveTo(cx, cy + w * 0.38, cx - w * 0.5, cy + w * 0.3);
    p.quadraticCurveTo(cx - w * 0.56, cy + w * 0.18, cx - w * 0.5, cy);
    const g = x.createLinearGradient(0, cy - w * 0.1, 0, cy + w * 0.35);
    g.addColorStop(0, U.light(col, 0.15));
    g.addColorStop(1, U.shade(col, -0.3));
    x.fillStyle = g;
    x.fill(p);
    x.fillStyle = U.shade(col, -0.4);
    x.beginPath();
    x.arc(cx, cy + w * 0.12, 3, 0, U.TAU);
    x.fill();
  }
  function hangingLantern(x, px, py, col, s = 1) {
    x.strokeStyle = '#2a1a14';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(px, 0);
    x.lineTo(px, py - 34 * s);
    x.stroke();
    const g = x.createLinearGradient(px - 26 * s, 0, px + 26 * s, 0);
    g.addColorStop(0, U.shade(col, -0.2));
    g.addColorStop(0.45, U.light(col, 0.35));
    g.addColorStop(1, U.shade(col, -0.35));
    x.fillStyle = g;
    x.beginPath();
    x.ellipse(px, py, 26 * s, 34 * s, 0, 0, U.TAU);
    x.fill();
    x.strokeStyle = U.rgba(U.shade(col, -0.45), 0.6);
    x.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) {
      x.beginPath();
      x.ellipse(px, py, Math.abs(k) * 6 * s + 2, 34 * s, 0, 0, U.TAU);
      x.stroke();
    }
    x.fillStyle = '#2a1a14';
    x.fillRect(px - 14 * s, py - 38 * s, 28 * s, 6 * s);
    x.fillRect(px - 14 * s, py + 32 * s, 28 * s, 6 * s);
  }

  // Bouquet in a bucket for the flower shop.
  function flowerBucket(x, cx, baseY, s, cols, seed) {
    const r = U.rng(seed);
    x.strokeStyle = '#3a6a2a';
    x.lineWidth = 2 * s;
    const heads = [];
    for (let i = 0; i < 9; i++) {
      const hx = cx + (r() - 0.5) * 60 * s, hy = baseY - 50 * s - r() * 50 * s;
      x.beginPath();
      x.moveTo(cx + (r() - 0.5) * 16 * s, baseY - 20 * s);
      x.quadraticCurveTo(hx, hy + 30 * s, hx, hy);
      x.stroke();
      heads.push([hx, hy, U.pick(cols)]);
    }
    for (let i = 0; i < 6; i++) foliage(x, cx + (r() - 0.5) * 50 * s, baseY - 40 * s - r() * 20 * s, 14 * s, 8 * s, '#3f7a36', seed * 13 + i);
    for (const [hx, hy, c] of heads) {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * U.TAU;
        x.fillStyle = U.shade(c, (k % 2) * -0.12);
        x.beginPath();
        x.ellipse(hx + Math.cos(a) * 6 * s, hy + Math.sin(a) * 5 * s, 6 * s, 4 * s, a, 0, U.TAU);
        x.fill();
      }
      x.fillStyle = '#ffe07a';
      x.beginPath();
      x.arc(hx, hy, 3 * s, 0, U.TAU);
      x.fill();
    }
    // bucket
    const g = x.createLinearGradient(cx - 30 * s, 0, cx + 30 * s, 0);
    g.addColorStop(0, '#6a7a88');
    g.addColorStop(0.4, '#b8c4ce');
    g.addColorStop(1, '#5a6874');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(cx - 30 * s, baseY - 34 * s);
    x.lineTo(cx + 30 * s, baseY - 34 * s);
    x.lineTo(cx + 24 * s, baseY);
    x.lineTo(cx - 24 * s, baseY);
    x.fill();
    x.fillStyle = 'rgba(40,50,60,0.4)';
    x.fillRect(cx - 28 * s, baseY - 24 * s, 56 * s, 3 * s);
  }

  // ============================== scenes ==============================
  DEF.village = {
    paint(x) {
      sky(x, [[0, '#3f86d8'], [0.45, '#9ccbf0'], [0.62, '#e6f2f6'], [1, '#e8dcc0']]);
      cloud(x, W * 0.18, H * 0.2, 300, 1);
      cloud(x, W * 0.78, H * 0.14, 360, 2);
      cloud(x, W * 0.55, H * 0.3, 200, 3, '#ffffff', '#d4def0');
      mountains(x, H * 0.42, 90, '#a8c4d8', 5);
      monument(x, W * 0.5, H * 0.46, 760, 190, {});
      tree(x, W * 0.08, H * 0.56, 200, { seed: 3, leaf: '#4f8a44' });
      tree(x, W * 0.93, H * 0.56, 220, { seed: 4, leaf: '#56924a' });
      hokageTower(x, W * 0.5, H * 0.6, 0.8);
      const row = [
        [0, 150, 120, { flat: true, tank: true, wall: '#efe4cf', seed: 1 }],
        [140, 130, 90, { roof: '#b8552f', wall: '#f2e6d2', seed: 2 }],
        [262, 110, 130, { flat: true, tank: true, wall: '#e6dccb', band: '#c85a3a', seed: 3 }],
        [770, 120, 100, { roof: '#4f7aa8', wall: '#efe6d6', seed: 4 }],
        [884, 150, 130, { flat: true, tank: true, tankAt: 0.2, wall: '#ece2d0', seed: 5 }],
        [1030, 120, 96, { roof: '#7a4fb0', wall: '#f4ecf2', seed: 6 }],
        [1140, 150, 124, { flat: true, tank: true, wall: '#e8dcc6', seed: 7 }],
      ];
      for (const [px, w, h, o] of row) building(x, px, H * 0.66, w, h, o);
      for (const [px, w, h, o] of [[380, 140, 70, { roof: '#c8642e', wall: '#f2e6d0', door: true, seed: 8 }], [620, 140, 70, { roof: '#9a5a3a', wall: '#efe2cc', door: true, seed: 9 }]]) building(x, px, H * 0.68, w, h, o);
      ground(x, H * 0.66, '#d6c4a0', '#9a8462', 3, { cobble: true });
      lampPost(x, W * 0.22, H * 0.78, 110, false);
      lampPost(x, W * 0.78, H * 0.78, 110, false);
      vignette(x, 0.28);
    },
    weather: 'leaves',
  };

  DEF.training = {
    paint(x) {
      sky(x, [[0, '#3a84d6'], [0.5, '#a8d4f2'], [0.7, '#e2f0f0'], [1, '#b8d890']]);
      cloud(x, W * 0.25, H * 0.16, 340, 11);
      cloud(x, W * 0.72, H * 0.24, 260, 12);
      mountains(x, H * 0.46, 110, '#9ab8c8', 13);
      mountains(x, H * 0.5, 60, '#7aa0a0', 14);
      for (let i = 0; i < 14; i++) foliage(x, i * 100 + 30, H * 0.52, 80, 44, i % 3 ? '#3f7a3c' : '#4a8a42', 200 + i);
      field(x, H * 0.54, '#8cc05a', '#4f8a32', 15, { flowers: 90 });
      // dirt training circle
      // worn dirt where everyone spars
      const dr = U.rng(16);
      for (let i = 0; i < 26; i++) {
        const a = dr() * U.TAU, d = Math.sqrt(dr());
        x.fillStyle = `rgba(${170 + ((dr() * 30) | 0)},${130 + ((dr() * 20) | 0)},80,0.16)`;
        x.beginPath();
        x.ellipse(W * 0.5 + Math.cos(a) * d * W * 0.3, H * 0.8 + Math.sin(a) * d * H * 0.08, 60 + dr() * 120, 14 + dr() * 20, 0, 0, U.TAU);
        x.fill();
      }
      // three training posts
      for (const [px, s] of [[W * 0.3, 0.8], [W * 0.5, 0.86], [W * 0.7, 0.8]]) {
        const top = H * 0.5, bot = H * 0.62;
        const g = x.createLinearGradient(px - 22 * s, 0, px + 22 * s, 0);
        g.addColorStop(0, '#a8744a');
        g.addColorStop(0.5, '#8a5a36');
        g.addColorStop(1, '#5a3620');
        x.fillStyle = g;
        x.fillRect(px - 20 * s, top, 40 * s, bot - top);
        x.fillStyle = '#d9b27a';
        x.beginPath();
        x.ellipse(px, top, 20 * s, 7 * s, 0, 0, U.TAU);
        x.fill();
        x.strokeStyle = '#c8b890';
        x.lineWidth = 4;
        for (const k of [0.3, 0.55]) {
          x.beginPath();
          x.moveTo(px - 20 * s, top + (bot - top) * k);
          x.lineTo(px + 20 * s, top + (bot - top) * k + 4);
          x.stroke();
        }
      }
      tree(x, W * 0.04, H * 0.86, 360, { seed: 21, leaf: '#3f7a36' });
      tree(x, W * 0.97, H * 0.84, 330, { seed: 22, leaf: '#4a8a3e' });
      vignette(x, 0.3);
    },
    weather: 'leaves',
  };

  DEF.forest = {
    paint(x) {
      sky(x, [[0, '#8ac8e0'], [0.5, '#cfe8d8'], [1, '#6a9a50']]);
      // far misty trees
      for (let i = 0; i < 16; i++) foliage(x, i * 86, H * 0.4 + (i % 3) * 10, 70, 60, '#8ab8a0', 300 + i);
      for (let i = 0; i < 12; i++) pine(x, i * 115 + 40, H * 0.56, 190 + (i % 4) * 30, '#4f8a60', 330 + i);
      x.fillStyle = 'rgba(210,235,225,0.35)';
      x.fillRect(0, H * 0.3, W, H * 0.3);
      field(x, H * 0.56, '#6aa04a', '#335a26', 31, { flowers: 40, blades: 900 });
      // giant foreground trunks with roots
      for (const [px, w] of [[70, 110], [W - 110, 130], [W * 0.3, 54], [W * 0.73, 64]]) {
        const tg = x.createLinearGradient(px - w / 2, 0, px + w / 2, 0);
        tg.addColorStop(0, '#6a4630');
        tg.addColorStop(0.45, '#8a603e');
        tg.addColorStop(1, '#3a2418');
        x.fillStyle = tg;
        x.beginPath();
        x.moveTo(px - w * 0.5, 0);
        x.lineTo(px + w * 0.5, 0);
        x.lineTo(px + w * 0.52, H * 0.6);
        x.quadraticCurveTo(px + w * 0.9, H * 0.66, px + w * 1.1, H * 0.68);
        x.lineTo(px - w * 1.1, H * 0.68);
        x.quadraticCurveTo(px - w * 0.9, H * 0.66, px - w * 0.52, H * 0.6);
        x.closePath();
        x.fill();
        x.strokeStyle = 'rgba(40,24,14,0.45)';
        x.lineWidth = 2;
        const r = U.rng(px | 0);
        for (let k = 0; k < 8; k++) {
          const bx = px + (r() - 0.5) * w * 0.8;
          x.beginPath();
          x.moveTo(bx, r() * H * 0.2);
          x.quadraticCurveTo(bx + (r() - 0.5) * 10, H * 0.3, bx + (r() - 0.5) * 8, H * 0.6);
          x.stroke();
        }
      }
      // canopy overhead
      for (let i = 0; i < 12; i++) foliage(x, i * 120, -10 + (i % 2) * 30, 130, 70, '#2f6a32', 360 + i, { light: [-0.1, 0.3] });
      // undergrowth
      for (let i = 0; i < 10; i++) foliage(x, i * 140 + 20, H * 0.64 + (i % 2) * 14, 70, 30, '#3f7a36', 380 + i);
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const px = 160 + i * 240;
        const g2 = x.createLinearGradient(px, 0, px + 160, H);
        g2.addColorStop(0, 'rgba(255,250,200,0.18)');
        g2.addColorStop(1, 'rgba(255,250,200,0)');
        x.fillStyle = g2;
        x.beginPath();
        x.moveTo(px, 0);
        x.lineTo(px + 70, 0);
        x.lineTo(px + 260, H);
        x.lineTo(px + 120, H);
        x.fill();
      }
      x.restore();
      vignette(x, 0.35);
    },
    weather: 'leaves',
  };

  DEF.hyuga_garden = {
    paint(x) {
      sky(x, [[0, '#5a9ade'], [0.5, '#bfe0f4'], [1, '#e8f0e8']]);
      cloud(x, W * 0.7, H * 0.12, 300, 41);
      // compound wall with roof tiles
      x.fillStyle = '#f2ebdc';
      x.fillRect(0, H * 0.3, W, H * 0.18);
      x.fillStyle = '#3a3a4a';
      x.fillRect(0, H * 0.28, W, 14);
      for (let px = 0; px < W; px += 18) {
        x.fillStyle = px % 36 ? '#4a4a5c' : '#3a3a4c';
        x.fillRect(px, H * 0.26, 16, 10);
      }
      // main house: shoji panels and dark beams
      shojiWall(x, W * 0.36, H * 0.22, W, H * 0.54, { panelW: 120 });
      x.fillStyle = '#3a2a24';
      x.fillRect(W * 0.36, H * 0.2, W * 0.64, 14);
      const roof = new Path2D();
      roof.moveTo(W * 0.3, H * 0.21);
      roof.lineTo(W * 0.44, H * 0.06);
      roof.lineTo(W + 40, H * 0.06);
      roof.lineTo(W + 40, H * 0.21);
      roof.closePath();
      x.fillStyle = '#44485a';
      x.fill(roof);
      x.save();
      x.clip(roof);
      x.strokeStyle = 'rgba(20,20,30,0.5)';
      x.lineWidth = 2;
      for (let px = W * 0.26; px < W + 40; px += 14) {
        x.beginPath();
        x.moveTo(px, H * 0.21);
        x.lineTo(px + 40, H * 0.06);
        x.stroke();
      }
      x.restore();
      // engawa veranda
      const eg = x.createLinearGradient(0, H * 0.54, 0, H * 0.62);
      eg.addColorStop(0, '#b8844e');
      eg.addColorStop(1, '#7a5230');
      x.fillStyle = eg;
      x.fillRect(W * 0.34, H * 0.54, W * 0.66, H * 0.08);
      x.fillStyle = '#5a3a20';
      for (let px = W * 0.36; px < W; px += 120) x.fillRect(px, H * 0.62, 12, H * 0.08);
      // garden
      field(x, H * 0.62, '#8ab86a', '#5a8a44', 42, { blades: 500 });
      // koi pond
      const pond = new Path2D();
      pond.ellipse(W * 0.34, H * 0.84, W * 0.28, H * 0.1, 0, 0, U.TAU);
      x.fillStyle = '#6a7a70';
      x.fill(pond);
      x.save();
      x.clip(pond);
      water(x, H * 0.74, '#5aa0b8', '#2f6a88');
      for (const [kx, ky, c] of [[W * 0.28, H * 0.84, '#ff8a3a'], [W * 0.42, H * 0.82, '#f4f0e8'], [W * 0.36, H * 0.88, '#e84a2a']]) {
        x.fillStyle = c;
        x.beginPath();
        x.ellipse(kx, ky, 18, 7, 0.3, 0, U.TAU);
        x.fill();
      }
      x.restore();
      x.strokeStyle = 'rgba(80,90,90,0.8)';
      x.lineWidth = 6;
      x.stroke(pond);
      for (const [rx, ry, rr] of [[W * 0.08, H * 0.82, 40], [W * 0.6, H * 0.86, 34], [W * 0.18, H * 0.93, 30], [W * 0.52, H * 0.78, 22]]) {
        const g = x.createLinearGradient(rx, ry - rr, rx, ry + rr);
        g.addColorStop(0, '#a8a8a8');
        g.addColorStop(1, '#5a5a60');
        x.fillStyle = g;
        x.beginPath();
        x.ellipse(rx, ry, rr, rr * 0.6, 0, 0, U.TAU);
        x.fill();
      }
      // stone lantern
      const lx = W * 0.72, ly = H * 0.8;
      x.fillStyle = '#8a8a8e';
      x.fillRect(lx - 10, ly - 60, 20, 60);
      x.fillRect(lx - 30, ly - 90, 60, 30);
      x.fillStyle = '#ffe0a0';
      x.fillRect(lx - 12, ly - 84, 24, 18);
      x.fillStyle = '#6a6a70';
      x.beginPath();
      x.moveTo(lx - 44, ly - 90);
      x.lineTo(lx, ly - 118);
      x.lineTo(lx + 44, ly - 90);
      x.fill();
      x.fillRect(lx - 22, ly - 4, 44, 8);
      // red maple
      tree(x, W * 0.14, H * 0.66, 300, { seed: 45, leaf: '#d0502e', trunk: '#4a2a1e' });
      // bamboo
      for (let i = 0; i < 6; i++) {
        const bx = W * 0.9 + i * 20;
        x.fillStyle = i % 2 ? '#6a9a3a' : '#7aaa4a';
        x.fillRect(bx, 0, 9, H * 0.7);
        x.fillStyle = '#4a7a2a';
        for (let k = 0; k < 7; k++) x.fillRect(bx - 1, 40 + k * 70 + i * 9, 11, 3);
      }
      vignette(x, 0.28);
    },
    weather: 'leaves',
  };

  DEF.sakura_night = {
    paint(x) {
      sky(x, [[0, '#070a26'], [0.5, '#1c2458'], [0.75, '#3a2e5a'], [1, '#2a2438']]);
      stars(x, 160, 23, H * 0.55);
      moon(x, W * 0.18, H * 0.17, 40);
      cloud(x, W * 0.36, H * 0.22, 240, 51, 'rgba(90,100,160,0.8)', 'rgba(40,44,90,0.8)');
      // distant village lights
      for (let i = 0; i < 18; i++) building(x, i * 76 - 10, H * 0.6, 70, 40 + (i * 37) % 50, { flat: i % 3 !== 0, tank: i % 4 === 0, roof: '#2a2a44', wall: '#262a44', night: true, seed: 500 + i });
      field(x, H * 0.6, '#27402f', '#141e18', 52, { blades: 700, flowers: 30, flowerCols: ['#ffd0e0', '#fff0f6'] });
      // stone path
      x.fillStyle = 'rgba(160,160,170,0.35)';
      for (let i = 0; i < 9; i++) {
        const k = i / 8;
        x.beginPath();
        x.ellipse(W * 0.3 + k * W * 0.1, H * 0.64 + Math.pow(k, 1.4) * H * 0.34, 20 + k * 50, 6 + k * 14, 0, 0, U.TAU);
        x.fill();
      }
      // the great cherry tree
      tree(x, W * 0.64, H * 0.9, 520, {
        seed: 55, trunk: '#3a2226', leaf: '#e896b4', thick: 0.05, blossom: 90,
        clumps: [[-0.42, -0.62, 0.3, 0.16], [0.4, -0.64, 0.32, 0.17], [-0.2, -0.78, 0.34, 0.18], [0.18, -0.8, 0.36, 0.2], [0, -0.95, 0.3, 0.15], [-0.5, -0.8, 0.2, 0.12], [0.55, -0.82, 0.2, 0.12]],
      });
      // bench and lantern
      x.fillStyle = '#4a3024';
      x.fillRect(W * 0.8, H * 0.8, 170, 12);
      x.fillRect(W * 0.8 + 10, H * 0.8 + 12, 8, 30);
      x.fillRect(W * 0.8 + 150, H * 0.8 + 12, 8, 30);
      x.fillRect(W * 0.8, H * 0.74, 170, 8);
      const lx = W * 0.14, ly = H * 0.86;
      x.fillStyle = '#6a6a74';
      x.fillRect(lx - 9, ly - 60, 18, 60);
      x.fillRect(lx - 26, ly - 86, 52, 26);
      x.fillStyle = '#ffd890';
      x.fillRect(lx - 11, ly - 80, 22, 16);
      x.fillStyle = '#50505a';
      x.beginPath();
      x.moveTo(lx - 38, ly - 86);
      x.lineTo(lx, ly - 110);
      x.lineTo(lx + 38, ly - 86);
      x.fill();
      glow(x, lx, ly - 72, 150, '#ffc070', 0.35);
      vignette(x, 0.5);
    },
    weather: 'petals',
  };

  DEF.rooftop_night = {
    paint(x) {
      sky(x, [[0, '#040716'], [0.5, '#131b44'], [1, '#2a2a4c']]);
      stars(x, 240, 41, H * 0.7);
      moon(x, W * 0.74, H * 0.2, 50);
      monument(x, W * 0.36, H * 0.56, 620, 150, { rock: '#262c4a', leaf: '#141c30' });
      for (let i = 0; i < 16; i++) building(x, i * 84 - 20, H * 0.8, 80, 70 + (i * 53) % 90, { flat: i % 3 !== 1, tank: i % 3 === 0, roof: '#1c1e34', wall: '#1a1e36', night: true, seed: 600 + i });
      // our rooftop: parapet, tank, railings
      x.fillStyle = '#2a2c3e';
      x.fillRect(0, H * 0.82, W, H * 0.18);
      x.fillStyle = '#3a3c50';
      x.fillRect(0, H * 0.82, W, 10);
      const tx = W * 0.84, ty = H * 0.82;
      x.fillStyle = '#3a3e4a';
      x.fillRect(tx + 8, ty - 30, 6, 30);
      x.fillRect(tx + 92, ty - 30, 6, 30);
      const tg = x.createLinearGradient(tx, 0, tx + 106, 0);
      tg.addColorStop(0, '#4a4e60');
      tg.addColorStop(0.4, '#6a7084');
      tg.addColorStop(1, '#2a2e3a');
      x.fillStyle = tg;
      x.fillRect(tx, ty - 130, 106, 100);
      x.fillStyle = '#5a6072';
      x.beginPath();
      x.ellipse(tx + 53, ty - 130, 53, 12, 0, 0, U.TAU);
      x.fill();
      vignette(x, 0.5);
    },
  };

  DEF.ending_dawn = {
    paint(x) {
      sky(x, [[0, '#34488a'], [0.36, '#d8909a'], [0.58, '#ffcf8a'], [1, '#fff0c8']]);
      cloud(x, W * 0.2, H * 0.22, 320, 61, '#ffe0c8', '#d89aa0');
      cloud(x, W * 0.8, H * 0.16, 280, 62, '#ffe8d0', '#c8909a');
      sun(x, W * 0.5, H * 0.6, 50, '#ffd070');
      monument(x, W * 0.5, H * 0.64, 700, 170, { rock: '#a8807a', leaf: '#6a6a4a' });
      for (let i = 0; i < 15; i++) building(x, i * 90 - 20, H * 0.88, 86, 60 + (i * 41) % 70, { flat: i % 2 === 0, tank: i % 3 === 0, roof: '#6a4a52', wall: '#8a6a6a', seed: 700 + i });
      x.fillStyle = '#4a3440';
      x.fillRect(0, H * 0.88, W, H * 0.12);
      vignette(x, 0.3);
    },
    weather: 'petals',
  };

  // ----- interiors -----
  DEF.bedroom_morning = {
    paint(x) {
      const wall = x.createLinearGradient(0, 0, 0, H * 0.62);
      wall.addColorStop(0, '#e8d4b4');
      wall.addColorStop(1, '#f6e8d0');
      x.fillStyle = wall;
      x.fillRect(0, 0, W, H * 0.62);
      x.fillStyle = '#7a5236';
      x.fillRect(0, 0, W, 30);
      x.fillStyle = '#5e3e28';
      x.fillRect(0, 30, W, 6);
      for (const px of [60, W - 100]) {
        x.fillStyle = '#80583a';
        x.fillRect(px, 0, 40, H * 0.62);
        x.fillStyle = 'rgba(0,0,0,0.16)';
        x.fillRect(px + 30, 0, 10, H * 0.62);
      }
      // hanging scroll
      x.fillStyle = '#f4ecd8';
      x.fillRect(250, 70, 90, 230);
      x.fillStyle = '#6a3a24';
      x.fillRect(244, 64, 102, 8);
      x.fillRect(244, 298, 102, 8);
      x.fillStyle = '#2a2a2a';
      x.font = 'bold 44px serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('朝', 295, 150);
      x.fillStyle = '#c8321e';
      x.fillRect(285, 230, 20, 20);
      // window
      const wx = W * 0.54, wy = 70, ww = 400, wh = 270;
      const out = x.createLinearGradient(0, wy, 0, wy + wh);
      out.addColorStop(0, '#8ec8f0');
      out.addColorStop(1, '#fff0d4');
      x.fillStyle = out;
      x.fillRect(wx, wy, ww, wh);
      x.save();
      x.beginPath();
      x.rect(wx, wy, ww, wh);
      x.clip();
      cloud(x, wx + ww * 0.3, wy + 80, 180, 71);
      for (let i = 0; i < 6; i++) building(x, wx - 20 + i * 76, wy + wh + 4, 70, 50 + (i * 23) % 40, { flat: i % 2 === 0, tank: i % 2 === 0, roof: '#c07a5a', wall: '#e8d8c8', seed: 800 + i });
      glow(x, wx + ww * 0.8, wy + 50, 200, '#fffbe8', 0.9);
      x.restore();
      x.strokeStyle = '#6e4a30';
      x.lineWidth = 12;
      x.strokeRect(wx, wy, ww, wh);
      x.lineWidth = 6;
      x.beginPath();
      x.moveTo(wx + ww / 2, wy);
      x.lineTo(wx + ww / 2, wy + wh);
      x.moveTo(wx, wy + wh / 2);
      x.lineTo(wx + ww, wy + wh / 2);
      x.stroke();
      x.fillStyle = '#7a5236';
      x.fillRect(wx - 16, wy + wh, ww + 32, 14);
      // curtains
      for (const side of [0, 1]) {
        const cx0 = side ? wx + ww - 30 : wx - 60;
        const cg = x.createLinearGradient(cx0, 0, cx0 + 90, 0);
        cg.addColorStop(0, 'rgba(240,200,150,0.95)');
        cg.addColorStop(0.5, 'rgba(255,230,190,0.95)');
        cg.addColorStop(1, 'rgba(220,170,120,0.95)');
        x.fillStyle = cg;
        x.beginPath();
        x.moveTo(cx0, wy - 20);
        x.lineTo(cx0 + 90, wy - 20);
        x.quadraticCurveTo(cx0 + (side ? 70 : 30), wy + wh * 0.6, cx0 + (side ? 90 : 60), wy + wh + 50);
        x.lineTo(cx0 + (side ? 20 : 0), wy + wh + 50);
        x.quadraticCurveTo(cx0 + (side ? 0 : 20), wy + wh * 0.5, cx0, wy - 20);
        x.fill();
        x.strokeStyle = 'rgba(180,120,70,0.35)';
        x.lineWidth = 2;
        for (let k = 1; k < 4; k++) {
          x.beginPath();
          x.moveTo(cx0 + k * 22, wy - 20);
          x.quadraticCurveTo(cx0 + k * 20, wy + wh * 0.5, cx0 + k * 18 + (side ? 10 : 0), wy + wh + 46);
          x.stroke();
        }
      }
      x.fillStyle = '#5a3a24';
      x.fillRect(wx - 80, wy - 26, ww + 160, 8);
      floor(x, H * 0.62, 'wood', { col: '#b28256' });
      // futon
      const mat = new Path2D();
      mat.moveTo(150, 470);
      mat.lineTo(700, 470);
      mat.lineTo(800, 650);
      mat.lineTo(50, 650);
      mat.closePath();
      x.fillStyle = '#f6f2ea';
      x.fill(mat);
      x.fillStyle = '#d8d0c2';
      x.fillRect(50, 650, 750, 20);
      for (const px of [220, 440]) {
        const pg = x.createLinearGradient(0, 452, 0, 500);
        pg.addColorStop(0, '#ffffff');
        pg.addColorStop(1, '#dcd6cc');
        x.fillStyle = pg;
        x.beginPath();
        x.ellipse(px + 80, 478, 92, 26, 0, 0, U.TAU);
        x.fill();
      }
      const blanket = new Path2D();
      blanket.moveTo(110, 540);
      blanket.bezierCurveTo(260, 500, 380, 560, 520, 520);
      blanket.bezierCurveTo(620, 494, 700, 520, 752, 540);
      blanket.lineTo(820, 668);
      blanket.lineTo(30, 668);
      blanket.closePath();
      const bg = x.createLinearGradient(0, 520, 0, 670);
      bg.addColorStop(0, '#7a9ad6');
      bg.addColorStop(1, '#4a66a8');
      x.fillStyle = bg;
      x.fill(blanket);
      x.save();
      x.clip(blanket);
      x.fillStyle = 'rgba(255,255,255,0.5)';
      const br = U.rng(72);
      for (let i = 0; i < 110; i++) {
        const px = 40 + br() * 780, py = 510 + br() * 160;
        x.beginPath();
        x.arc(px, py, 2 + br() * 2, 0, U.TAU);
        x.fill();
      }
      x.strokeStyle = 'rgba(30,40,90,0.35)';
      x.lineWidth = 4;
      for (const [a, b, c] of [[200, 560, 260], [420, 580, 480], [610, 560, 700]]) {
        x.beginPath();
        x.moveTo(a, b);
        x.quadraticCurveTo((a + c) / 2, b + 40, c, H);
        x.stroke();
      }
      x.restore();
      // folded orange jacket and a pair of cups
      x.fillStyle = '#f07f1e';
      x.fillRect(930, 600, 140, 40);
      x.fillStyle = '#1e1e28';
      x.fillRect(930, 612, 140, 8);
      lowTable(x, 1110, 540, 180, { tea: true });
      // morning light
      x.save();
      x.globalCompositeOperation = 'lighter';
      const lg = x.createLinearGradient(wx + ww / 2, wy, W * 0.3, H);
      lg.addColorStop(0, 'rgba(255,236,190,0.16)');
      lg.addColorStop(1, 'rgba(255,236,190,0)');
      x.fillStyle = lg;
      x.beginPath();
      x.moveTo(wx, wy);
      x.lineTo(wx + ww, wy + wh);
      x.lineTo(W * 0.62, H);
      x.lineTo(W * 0.06, H);
      x.closePath();
      x.fill();
      x.restore();
      vignette(x, 0.26);
    },
    weather: 'dust',
  };

  DEF.inn_room = {
    paint(x) {
      x.fillStyle = '#2a1a14';
      x.fillRect(0, 0, W, H);
      shojiWall(x, 0, 40, W, H * 0.6, { panelW: 160, glow: '#f6d8a0', frame: '#4a2a1c' });
      // open panel to the moonlit garden
      const ox = W * 0.62, ow = 300;
      const g = x.createLinearGradient(0, 48, 0, H * 0.6);
      g.addColorStop(0, '#0e1636');
      g.addColorStop(1, '#2a3050');
      x.fillStyle = g;
      x.fillRect(ox, 48, ow, H * 0.6 - 56);
      x.save();
      x.beginPath();
      x.rect(ox, 48, ow, H * 0.6 - 56);
      x.clip();
      stars(x, 40, 91, H * 0.3);
      moon(x, ox + ow * 0.7, 120, 30);
      for (let i = 0; i < 5; i++) foliage(x, ox + i * 70, H * 0.52, 60, 30, '#1e3a2a', 900 + i);
      x.restore();
      x.fillStyle = '#4a2a1c';
      x.fillRect(0, 26, W, 18);
      x.fillRect(0, H * 0.6 - 8, W, 12);
      for (const px of [0, W * 0.3, W - 40]) x.fillRect(px, 26, 40, H * 0.6 - 20);
      floor(x, H * 0.6, 'tatami');
      // warm lamp light over the scene
      glow(x, W * 0.2, H * 0.3, 520, '#ffb060', 0.28);
      hangingLantern(x, W * 0.2, 150, '#ff9a4a');
      // andon floor lamp
      const ax = W * 0.9, ay = H * 0.8;
      x.fillStyle = '#3a2418';
      x.fillRect(ax - 34, ay - 10, 68, 10);
      x.fillStyle = '#f6dca0';
      x.fillRect(ax - 28, ay - 110, 56, 100);
      x.strokeStyle = '#3a2418';
      x.lineWidth = 4;
      x.strokeRect(ax - 28, ay - 110, 56, 100);
      glow(x, ax, ay - 60, 220, '#ffc070', 0.45);
      lowTable(x, W * 0.48, H * 0.78, 360, { sake: true });
      cushion(x, W * 0.24, H * 0.82, 160, '#8a2a3a');
      cushion(x, W * 0.72, H * 0.82, 160, '#8a2a3a');
      vignette(x, 0.5);
    },
    anim(x, t) {
      const f = 0.9 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13) * 0.03;
      glow(x, W * 0.2, 150, 160 * f, '#ffc070', 0.35);
    },
  };

  DEF.flowershop_night = {
    paint(x) {
      const wall = x.createLinearGradient(0, 0, 0, H * 0.66);
      wall.addColorStop(0, '#3a2438');
      wall.addColorStop(1, '#5a3a4a');
      x.fillStyle = wall;
      x.fillRect(0, 0, W, H * 0.66);
      // window to the night street
      const wx = W * 0.62, wy = 60, ww = 380, wh = 240;
      const out = x.createLinearGradient(0, wy, 0, wy + wh);
      out.addColorStop(0, '#0c1230');
      out.addColorStop(1, '#2a2a50');
      x.fillStyle = out;
      x.fillRect(wx, wy, ww, wh);
      x.save();
      x.beginPath();
      x.rect(wx, wy, ww, wh);
      x.clip();
      stars(x, 50, 81, H * 0.4);
      moon(x, wx + ww * 0.75, wy + 60, 26);
      for (let i = 0; i < 6; i++) building(x, wx - 10 + i * 70, wy + wh, 66, 60 + (i * 31) % 60, { flat: i % 2 === 1, tank: i % 3 === 0, roof: '#262840', wall: '#22263e', night: true, seed: 950 + i });
      x.restore();
      x.strokeStyle = '#4a2a1c';
      x.lineWidth = 12;
      x.strokeRect(wx, wy, ww, wh);
      x.lineWidth = 5;
      x.beginPath();
      x.moveTo(wx + ww / 2, wy);
      x.lineTo(wx + ww / 2, wy + wh);
      x.stroke();
      // hanging plants
      for (const [px, py] of [[W * 0.12, 90], [W * 0.36, 70], [W * 0.56, 100]]) {
        x.strokeStyle = '#2a1a14';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(px, 0);
        x.lineTo(px, py);
        x.stroke();
        foliage(x, px, py + 20, 50, 26, '#3f7a3a', (px | 0) + 7);
        x.fillStyle = '#b86a3a';
        x.beginPath();
        x.ellipse(px, py + 30, 28, 14, 0, 0, Math.PI);
        x.fill();
      }
      // shelves with buckets of flowers
      const COLS = [['#ff7aa8', '#ffb3cf', '#ffffff'], ['#ffd24a', '#ff9a4a'], ['#b58cff', '#e0c8ff'], ['#ff5a5a', '#ffffff'], ['#ffffff', '#fff0b0']];
      for (const [sy, n, s] of [[H * 0.42, 6, 0.9], [H * 0.62, 7, 1.05]]) {
        x.fillStyle = '#5a3624';
        x.fillRect(0, sy, W * 0.6, 14);
        x.fillStyle = 'rgba(0,0,0,0.3)';
        x.fillRect(0, sy + 14, W * 0.6, 8);
        for (let i = 0; i < n; i++) flowerBucket(x, 60 + i * ((W * 0.56) / n), sy, s, COLS[(i + n) % COLS.length], 30 + i + n);
      }
      floor(x, H * 0.66, 'wood', { col: '#7a5236' });
      // counter
      const cg = x.createLinearGradient(0, H * 0.7, 0, H);
      cg.addColorStop(0, '#8a5a36');
      cg.addColorStop(1, '#5a3620');
      x.fillStyle = cg;
      x.fillRect(W * 0.52, H * 0.74, W * 0.48, H * 0.26);
      x.fillStyle = '#a8744a';
      x.fillRect(W * 0.5, H * 0.72, W * 0.5, 16);
      flowerBucket(x, W * 0.66, H * 0.72, 1.2, ['#ff7aa8', '#ffffff', '#ffb3cf'], 77);
      x.fillStyle = '#f4ecd8';
      x.fillRect(W * 0.8, H * 0.66, 80, 60);
      x.fillStyle = '#8a3a4a';
      x.fillRect(W * 0.8, H * 0.66, 80, 10);
      glow(x, W * 0.4, H * 0.5, 600, '#ffb070', 0.22);
      vignette(x, 0.55);
    },
    anim(x, t) {
      for (const [px, py] of [[W * 0.58, H * 0.7], [W * 0.94, H * 0.7]]) {
        const f = 1 + Math.sin(t * 12 + px) * 0.08;
        glow(x, px, py - 20, 150 * f, '#ffbe6e', 0.35);
        x.fillStyle = '#f4ead0';
        x.fillRect(px - 8, py - 16, 16, 30);
        x.fillStyle = '#ffd070';
        x.beginPath();
        x.ellipse(px, py - 24, 5, 9 * f, 0, 0, U.TAU);
        x.fill();
      }
    },
  };

  DEF.armory_night = {
    paint(x) {
      // plank wall
      for (let px = 0; px < W; px += 64) {
        const g = x.createLinearGradient(px, 0, px + 64, 0);
        g.addColorStop(0, '#4a3020');
        g.addColorStop(0.5, '#5a3a26');
        g.addColorStop(1, '#3a2418');
        x.fillStyle = g;
        x.fillRect(px, 0, 64, H * 0.66);
        x.fillStyle = 'rgba(0,0,0,0.35)';
        x.fillRect(px + 62, 0, 2, H * 0.66);
      }
      // weapon racks
      for (const ry of [H * 0.16, H * 0.4]) {
        x.fillStyle = '#2a1a12';
        x.fillRect(40, ry, W - 80, 12);
        x.fillStyle = '#6a4630';
        x.fillRect(40, ry - 4, W - 80, 6);
      }
      // swords on the upper rack
      for (let i = 0; i < 7; i++) {
        const sx = 90 + i * 160, sy = H * 0.14;
        x.save();
        x.translate(sx, sy);
        x.rotate(-0.08);
        const bg = x.createLinearGradient(0, -6, 0, 6);
        bg.addColorStop(0, '#f0f4f8');
        bg.addColorStop(1, '#8a929c');
        x.fillStyle = bg;
        x.beginPath();
        x.moveTo(40, -4);
        x.quadraticCurveTo(100, -8, 130, -2);
        x.lineTo(130, 2);
        x.quadraticCurveTo(100, 2, 40, 4);
        x.fill();
        x.fillStyle = '#c9a24a';
        x.fillRect(34, -10, 6, 20);
        x.fillStyle = '#2a2a3a';
        x.fillRect(0, -4, 34, 8);
        x.fillStyle = '#8a2a2a';
        for (let k = 0; k < 4; k++) x.fillRect(4 + k * 8, -4, 4, 8);
        x.restore();
      }
      // kunai fans and a giant shuriken on the lower rack
      for (let i = 0; i < 5; i++) {
        const kx = 120 + i * 230, ky = H * 0.38;
        for (let k = -2; k <= 2; k++) {
          x.save();
          x.translate(kx, ky);
          x.rotate(-Math.PI / 2 + k * 0.28);
          x.fillStyle = '#b8c0ca';
          x.beginPath();
          x.moveTo(0, -5);
          x.lineTo(46, 0);
          x.lineTo(0, 5);
          x.fill();
          x.fillStyle = '#2a2a2a';
          x.fillRect(-22, -2, 22, 4);
          x.strokeStyle = '#2a2a2a';
          x.lineWidth = 2;
          x.beginPath();
          x.arc(-26, 0, 4, 0, U.TAU);
          x.stroke();
          x.restore();
        }
      }
      x.save();
      x.translate(W * 0.5, H * 0.52);
      x.fillStyle = '#9aa2ac';
      for (let k = 0; k < 4; k++) {
        x.rotate(Math.PI / 2);
        x.beginPath();
        x.moveTo(0, -12);
        x.quadraticCurveTo(40, -20, 78, 0);
        x.quadraticCurveTo(40, -4, 0, 12);
        x.fill();
      }
      x.fillStyle = '#3a3a44';
      x.beginPath();
      x.arc(0, 0, 14, 0, U.TAU);
      x.fill();
      x.restore();
      // scroll shelf
      for (let i = 0; i < 8; i++) {
        const cx0 = 60 + i * 34, cy0 = H * 0.54;
        x.fillStyle = ['#e8dcc0', '#d8c8a0', '#f0e6cc'][i % 3];
        x.beginPath();
        x.ellipse(cx0, cy0, 14, 14, 0, 0, U.TAU);
        x.fill();
        x.fillStyle = '#8a2a2a';
        x.beginPath();
        x.arc(cx0, cy0, 5, 0, U.TAU);
        x.fill();
      }
      floor(x, H * 0.66, 'wood', { col: '#6a4630' });
      // workbench with whetstone
      const wg = x.createLinearGradient(0, H * 0.74, 0, H);
      wg.addColorStop(0, '#7a5236');
      wg.addColorStop(1, '#4a2e1c');
      x.fillStyle = wg;
      x.fillRect(W * 0.06, H * 0.76, W * 0.5, 22);
      x.fillRect(W * 0.08, H * 0.79, 20, H * 0.2);
      x.fillRect(W * 0.52, H * 0.79, 20, H * 0.2);
      x.fillStyle = '#5a6a6a';
      x.fillRect(W * 0.2, H * 0.74, 120, 16);
      x.fillStyle = '#e8e8f0';
      x.save();
      x.translate(W * 0.36, H * 0.745);
      x.rotate(-0.05);
      x.fillRect(0, -3, 200, 6);
      x.fillStyle = '#2a2a3a';
      x.fillRect(-50, -4, 50, 8);
      x.restore();
      // sake and two cups at the far end
      lowTable(x, W * 0.78, H * 0.84, 260, { sake: true });
      vignette(x, 0.55);
    },
    anim(x, t) {
      const f = 1 + Math.sin(t * 9) * 0.05 + Math.sin(t * 17) * 0.03;
      hangingLantern(x, W * 0.86, 130, '#ff9a4a', 0.9);
      glow(x, W * 0.86, 130, 460 * f, '#ffb060', 0.3);
      glow(x, W * 0.5, H * 0.5, 700 * f, '#ffaa60', 0.12);
    },
  };

  // ---------- Tsunade's chapters ----------
  function scrollPile(x, cx, cy, n, seed) {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const px = cx + (r() - 0.5) * 120, py = cy - i * 7 + (r() - 0.5) * 6;
      x.save();
      x.translate(px, py);
      x.rotate((r() - 0.5) * 0.6);
      x.fillStyle = r() < 0.5 ? '#efe3c4' : '#e4d4b0';
      x.fillRect(-40, -6, 80, 12);
      x.fillStyle = '#8a3a2a';
      x.fillRect(-44, -7, 6, 14);
      x.fillRect(38, -7, 6, 14);
      x.restore();
    }
  }
  function candle(x, px, py, h = 34) {
    x.fillStyle = '#f4ead0';
    x.fillRect(px - 7, py - h, 14, h);
    x.fillStyle = 'rgba(0,0,0,0.12)';
    x.fillRect(px + 2, py - h, 5, h);
    x.fillStyle = '#3a2a20';
    x.fillRect(px - 12, py - 2, 24, 5);
  }
  function flame(x, px, py, t, s = 1) {
    const f = 1 + Math.sin(t * 13 + px) * 0.1 + Math.sin(t * 7.3 + py) * 0.06;
    glow(x, px, py - 6 * s, 150 * s * f, '#ffb868', 0.34);
    x.fillStyle = '#ffd98a';
    x.beginPath();
    x.ellipse(px, py - 8 * s, 4.5 * s, 10 * s * f, Math.sin(t * 5 + px) * 0.08, 0, U.TAU);
    x.fill();
    x.fillStyle = '#fff6d8';
    x.beginPath();
    x.ellipse(px, py - 5 * s, 2 * s, 4.5 * s, 0, 0, U.TAU);
    x.fill();
  }

  DEF.hospital_night = {
    paint(x) {
      // plaster walls in lamplight, dark wood trim
      const wall = x.createLinearGradient(0, 0, 0, H * 0.64);
      wall.addColorStop(0, '#2e3448');
      wall.addColorStop(1, '#4a4e5e');
      x.fillStyle = wall;
      x.fillRect(0, 0, W, H * 0.64);
      x.fillStyle = '#2a2018';
      x.fillRect(0, 0, W, 26);
      x.fillRect(0, H * 0.64 - 10, W, 10);
      // tall window: the sleeping village
      const wx = W * 0.58, wy = 60, ww = 380, wh = 300;
      const out = x.createLinearGradient(0, wy, 0, wy + wh);
      out.addColorStop(0, '#08102c');
      out.addColorStop(1, '#22284c');
      x.fillStyle = out;
      x.fillRect(wx, wy, ww, wh);
      x.save();
      x.beginPath();
      x.rect(wx, wy, ww, wh);
      x.clip();
      stars(x, 60, 131, H * 0.5);
      moon(x, wx + ww * 0.24, wy + 70, 30);
      monument(x, wx + ww * 0.6, wy + 190, 420, 90, { rock: '#1e2440', leaf: '#101830', noTrees: true });
      for (let i = 0; i < 7; i++) building(x, wx - 20 + i * 64, wy + wh + 2, 60, 50 + ((i * 29) % 50), { flat: i % 2 === 0, tank: i % 3 === 0, roof: '#1c1e34', wall: '#1a1e36', night: true, seed: 1300 + i });
      x.restore();
      x.strokeStyle = '#3a2a1e';
      x.lineWidth = 12;
      x.strokeRect(wx, wy, ww, wh);
      x.lineWidth = 5;
      x.beginPath();
      x.moveTo(wx + ww / 2, wy);
      x.lineTo(wx + ww / 2, wy + wh);
      x.moveTo(wx, wy + wh * 0.55);
      x.lineTo(wx + ww, wy + wh * 0.55);
      x.stroke();
      // moonlight falling into the room
      x.save();
      x.globalCompositeOperation = 'lighter';
      const mg = x.createLinearGradient(wx, wy, wx - 200, H);
      mg.addColorStop(0, 'rgba(140,170,255,0.16)');
      mg.addColorStop(1, 'rgba(140,170,255,0)');
      x.fillStyle = mg;
      x.beginPath();
      x.moveTo(wx, wy);
      x.lineTo(wx + ww, wy);
      x.lineTo(wx + ww - 120, H);
      x.lineTo(wx - 320, H);
      x.closePath();
      x.fill();
      x.restore();
      // shelves of scrolls and books
      for (const sy of [96, 196, 296]) {
        x.fillStyle = '#3a2a1e';
        x.fillRect(40, sy + 60, W * 0.46, 12);
        const r = U.rng(sy);
        let px = 52;
        while (px < W * 0.46) {
          const bw = 14 + r() * 18, bh = 44 + r() * 16;
          if (r() < 0.3) {
            // rolled scrolls stacked
            for (let k = 0; k < 3; k++) {
              x.fillStyle = ['#e8dcc0', '#d8c8a0', '#f0e6cc'][k];
              x.beginPath();
              x.ellipse(px + 14, sy + 52 - k * 16, 14, 8, 0, 0, U.TAU);
              x.fill();
              x.fillStyle = '#8a2a2a';
              x.beginPath();
              x.arc(px + 14, sy + 52 - k * 16, 3, 0, U.TAU);
              x.fill();
            }
            px += 34;
          } else {
            x.fillStyle = U.pick(['#6a2a2a', '#2a4a6a', '#3a5a3a', '#5a4a2a', '#4a2a5a']);
            x.fillRect(px, sy + 60 - bh, bw, bh);
            x.fillStyle = 'rgba(255,230,180,0.25)';
            x.fillRect(px + 2, sy + 60 - bh + 6, bw - 4, 3);
            px += bw + 2;
          }
        }
      }
      // anatomy chart of the chakra network
      x.fillStyle = '#e8e0cc';
      x.fillRect(W * 0.49, 90, 90, 150);
      x.strokeStyle = '#6a8ac8';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(W * 0.49 + 45, 120, 13, 0, U.TAU);
      x.moveTo(W * 0.49 + 45, 133);
      x.lineTo(W * 0.49 + 45, 200);
      x.moveTo(W * 0.49 + 20, 160);
      x.lineTo(W * 0.49 + 70, 160);
      x.moveTo(W * 0.49 + 45, 200);
      x.lineTo(W * 0.49 + 28, 232);
      x.moveTo(W * 0.49 + 45, 200);
      x.lineTo(W * 0.49 + 62, 232);
      x.stroke();
      x.fillStyle = '#c84a4a';
      for (const [dx, dy] of [[45, 150], [45, 175], [33, 160], [57, 160], [45, 195]]) {
        x.beginPath();
        x.arc(W * 0.49 + dx, dy, 3, 0, U.TAU);
        x.fill();
      }
      floor(x, H * 0.64, 'wood', { col: '#5a4030' });
      // the desk, buried in research
      const dg = x.createLinearGradient(0, H * 0.7, 0, H);
      dg.addColorStop(0, '#6a4a30');
      dg.addColorStop(1, '#3a2618');
      x.fillStyle = dg;
      x.fillRect(W * 0.18, H * 0.74, W * 0.64, H * 0.26);
      x.fillStyle = '#8a6040';
      x.fillRect(W * 0.16, H * 0.72, W * 0.68, 18);
      scrollPile(x, W * 0.3, H * 0.71, 6, 31);
      scrollPile(x, W * 0.7, H * 0.71, 4, 37);
      // open scroll with the Hollow Moon seal
      x.fillStyle = '#f2e8cc';
      x.fillRect(W * 0.42, H * 0.7, 200, 24);
      x.strokeStyle = '#6a3a8a';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(W * 0.42 + 100, H * 0.7 + 12, 9, 0, U.TAU);
      x.arc(W * 0.42 + 104, H * 0.7 + 12, 6, 0, U.TAU);
      x.stroke();
      // sake bottle hidden behind the reports
      x.fillStyle = '#f2ece0';
      x.beginPath();
      x.moveTo(W * 0.78 - 5, H * 0.72 - 60);
      x.quadraticCurveTo(W * 0.78 - 4, H * 0.72 - 36, W * 0.78 - 16, H * 0.72 - 16);
      x.quadraticCurveTo(W * 0.78 - 20, H * 0.72, W * 0.78, H * 0.72);
      x.quadraticCurveTo(W * 0.78 + 20, H * 0.72, W * 0.78 + 16, H * 0.72 - 16);
      x.quadraticCurveTo(W * 0.78 + 4, H * 0.72 - 36, W * 0.78 + 5, H * 0.72 - 60);
      x.fill();
      x.fillStyle = '#3a4a8a';
      x.fillRect(W * 0.78 - 14, H * 0.72 - 24, 28, 5);
      // desk lamp
      const lx = W * 0.22, ly = H * 0.72;
      x.fillStyle = '#2a2a30';
      x.fillRect(lx - 4, ly - 90, 8, 90);
      x.fillRect(lx - 26, ly - 8, 52, 8);
      x.fillStyle = '#3a5a3a';
      x.beginPath();
      x.moveTo(lx - 40, ly - 86);
      x.lineTo(lx + 40, ly - 86);
      x.lineTo(lx + 24, ly - 120);
      x.lineTo(lx - 24, ly - 120);
      x.closePath();
      x.fill();
      vignette(x, 0.55);
    },
    anim(x, t) {
      const f = 1 + Math.sin(t * 3) * 0.02;
      glow(x, W * 0.22, H * 0.72 - 80, 420 * f, '#ffc078', 0.3);
      glow(x, W * 0.4, H * 0.78, 520, '#ffb070', 0.1);
    },
    weather: 'dust',
  };

  DEF.hidden_spring = {
    paint(x) {
      // cavern: dark rock framing a moonlit opening
      x.fillStyle = '#0a0c14';
      x.fillRect(0, 0, W, H);
      const hole = new Path2D();
      hole.ellipse(W * 0.52, H * 0.16, 250, 120, 0.05, 0, U.TAU);
      x.save();
      x.clip(hole);
      sky(x, [[0, '#060a24'], [1, '#1e2658']]);
      stars(x, 120, 171, H * 0.4);
      moon(x, W * 0.6, H * 0.12, 34, '#fff8e8');
      for (let i = 0; i < 7; i++) foliage(x, W * 0.3 + i * 70, H * 0.3, 60, 30, '#0e1e1e', 1700 + i);
      x.restore();
      // layered rock walls with rim light
      const rockLayer = (seed, col, rim, inset) => {
        const r = U.rng(seed);
        const p = new Path2D();
        p.moveTo(0, 0);
        p.lineTo(W, 0);
        p.lineTo(W, H);
        let px = W;
        let py = H * (0.6 + inset);
        p.lineTo(W, py);
        while (px > W * 0.72) {
          px -= 30 + r() * 50;
          py -= 20 + r() * 50;
          p.lineTo(px, Math.max(inset * 200, py));
        }
        p.quadraticCurveTo(W * 0.52, -60 + inset * 300, W * 0.3, 40 + inset * 160);
        px = W * 0.3;
        py = 40 + inset * 160;
        while (px > 0) {
          px -= 30 + r() * 50;
          py += 20 + r() * 50;
          p.lineTo(px, py);
        }
        p.lineTo(0, H);
        p.lineTo(W, H);
        p.closePath();
        x.save();
        x.fillStyle = col;
        x.fill(p, 'evenodd');
        x.restore();
      };
      rockLayer(3, '#141824', '#3a4a6a', 0);
      // cave walls left and right
      for (const side of [0, 1]) {
        const g = x.createLinearGradient(side ? W : 0, 0, side ? W * 0.62 : W * 0.38, 0);
        g.addColorStop(0, '#07080e');
        g.addColorStop(1, 'rgba(20,24,36,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
      }
      // glowing moss and crystals
      const r = U.rng(9);
      for (let i = 0; i < 26; i++) {
        const side = i % 2;
        const px = side ? W - 40 - r() * 260 : 40 + r() * 260, py = 120 + r() * 360;
        const c = r() < 0.5 ? '#6ae8d0' : '#b88aff';
        glow(x, px, py, 40 + r() * 40, c, 0.25);
        x.fillStyle = U.rgba(c, 0.9);
        x.beginPath();
        x.moveTo(px, py - 16 - r() * 16);
        x.lineTo(px + 7, py);
        x.lineTo(px - 7, py);
        x.closePath();
        x.fill();
      }
      // waterfall at the back
      const fx = W * 0.5, fw = 90;
      const wf = x.createLinearGradient(fx - fw / 2, 0, fx + fw / 2, 0);
      wf.addColorStop(0, 'rgba(160,210,255,0.25)');
      wf.addColorStop(0.5, 'rgba(220,240,255,0.7)');
      wf.addColorStop(1, 'rgba(160,210,255,0.25)');
      x.fillStyle = wf;
      x.fillRect(fx - fw / 2, H * 0.22, fw, H * 0.34);
      // back rocks around the pool
      const back = x.createLinearGradient(0, H * 0.48, 0, H * 0.62);
      back.addColorStop(0, '#2a3040');
      back.addColorStop(1, '#161a24');
      x.fillStyle = back;
      x.beginPath();
      x.moveTo(0, H * 0.62);
      for (let i = 0; i <= 12; i++) x.lineTo((i / 12) * W, H * (0.5 + ((i * 37) % 7) / 100) + Math.sin(i) * 10);
      x.lineTo(W, H * 0.62);
      x.closePath();
      x.fill();
      // the steaming pool
      const pool = new Path2D();
      pool.ellipse(W * 0.5, H * 0.78, W * 0.46, H * 0.2, 0, 0, U.TAU);
      x.save();
      x.clip(pool);
      water(x, H * 0.56, '#2f7a8a', '#123a4a');
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        x.fillStyle = `rgba(200,230,255,${0.24 - i * 0.013})`;
        x.fillRect(W * 0.5 - 50 + Math.sin(i * 1.7) * 30, H * 0.6 + i * 12, 100 - i * 4, 3);
      }
      for (let i = 0; i < 30; i++) {
        const c = i % 2 ? '#6ae8d0' : '#b88aff';
        glow(x, W * 0.1 + ((i * 97) % (W * 0.8)), H * 0.62 + ((i * 53) % 120), 30, c, 0.08);
      }
      x.restore();
      // warm flat stones at the edge
      for (const [px, py, rw] of [[W * 0.12, H * 0.8, 110], [W * 0.86, H * 0.82, 120], [W * 0.3, H * 0.96, 140], [W * 0.72, H * 0.97, 150], [W * 0.5, H * 1.0, 180]]) {
        const g = x.createLinearGradient(px, py - 30, px, py + 30);
        g.addColorStop(0, '#5a5a66');
        g.addColorStop(1, '#2a2a34');
        x.fillStyle = g;
        x.beginPath();
        x.ellipse(px, py, rw, 32, 0, 0, U.TAU);
        x.fill();
        x.fillStyle = 'rgba(255,255,255,0.08)';
        x.beginPath();
        x.ellipse(px - rw * 0.2, py - 14, rw * 0.5, 7, 0, 0, U.TAU);
        x.fill();
      }
      // folded green haori and a sake cup on a stone
      x.fillStyle = '#3f7a4a';
      x.fillRect(W * 0.8, H * 0.78, 90, 22);
      x.fillStyle = '#e8e2d0';
      x.fillRect(W * 0.8 + 70, H * 0.78, 20, 22);
      x.fillStyle = '#f2ece0';
      x.beginPath();
      x.moveTo(W * 0.1 - 10, H * 0.78 - 14);
      x.lineTo(W * 0.1 + 10, H * 0.78 - 14);
      x.lineTo(W * 0.1 + 6, H * 0.78);
      x.lineTo(W * 0.1 - 6, H * 0.78);
      x.fill();
      // moonbeam into the water
      x.save();
      x.globalCompositeOperation = 'lighter';
      const mb = x.createLinearGradient(W * 0.55, 0, W * 0.5, H * 0.8);
      mb.addColorStop(0, 'rgba(190,210,255,0.22)');
      mb.addColorStop(1, 'rgba(190,210,255,0)');
      x.fillStyle = mb;
      x.beginPath();
      x.moveTo(W * 0.44, H * 0.1);
      x.lineTo(W * 0.66, H * 0.1);
      x.lineTo(W * 0.62, H * 0.8);
      x.lineTo(W * 0.36, H * 0.8);
      x.closePath();
      x.fill();
      x.restore();
      vignette(x, 0.5);
    },
    anim(x, t) {
      // falling water streaks
      x.save();
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = 'rgba(230,245,255,0.35)';
      x.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const px = W * 0.5 - 40 + i * 7;
        const off = (t * 420 + i * 53) % 240;
        x.beginPath();
        x.moveTo(px, H * 0.22 + off);
        x.lineTo(px, H * 0.22 + off + 40);
        x.stroke();
      }
      x.restore();
      // rising steam
      for (let i = 0; i < 18; i++) {
        const px = (i * 83 + t * 12) % (W + 200) - 100, py = H * 0.86 - ((t * 20 + i * 57) % 320);
        const rr = 70 + (i % 4) * 24;
        const g = x.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, 'rgba(255,255,255,0.1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
    },
    weather: 'fireflies',
  };

  DEF.tsunade_room = {
    paint(x) {
      x.fillStyle = '#1e140e';
      x.fillRect(0, 0, W, H);
      shojiWall(x, 0, 30, W, H * 0.58, { panelW: 150, glow: '#e8b878', frame: '#3a2418' });
      // a panel slid open onto the moonlit garden
      const ox = W * 0.08, ow = 280;
      const g = x.createLinearGradient(0, 38, 0, H * 0.58);
      g.addColorStop(0, '#0a1030');
      g.addColorStop(1, '#1e2448');
      x.fillStyle = g;
      x.fillRect(ox, 38, ow, H * 0.58 - 46);
      x.save();
      x.beginPath();
      x.rect(ox, 38, ow, H * 0.58 - 46);
      x.clip();
      stars(x, 40, 191, H * 0.3);
      moon(x, ox + ow * 0.3, 110, 26);
      tree(x, ox + ow * 0.7, H * 0.6, 260, { seed: 193, trunk: '#1a1216', leaf: '#6a3a5a', blossom: 30 });
      x.restore();
      x.fillStyle = '#3a2418';
      x.fillRect(0, 16, W, 18);
      x.fillRect(0, H * 0.58 - 8, W, 12);
      for (const px of [0, ox + ow, W * 0.62, W - 36]) x.fillRect(px, 16, 36, H * 0.58 - 4);
      // hanging scroll: 賭 (a gamble)
      x.fillStyle = '#efe4cc';
      x.fillRect(W * 0.7, 70, 80, 200);
      x.fillStyle = '#4a2a1a';
      x.fillRect(W * 0.7 - 6, 64, 92, 8);
      x.fillRect(W * 0.7 - 6, 268, 92, 8);
      x.fillStyle = '#1e1a1a';
      x.font = 'bold 50px serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('賭', W * 0.7 + 40, 150);
      x.fillStyle = '#b8321e';
      x.fillRect(W * 0.7 + 30, 222, 20, 20);
      // her green haori on a stand
      x.fillStyle = '#4a3020';
      x.fillRect(W * 0.9 - 70, 110, 140, 8);
      x.fillRect(W * 0.9 - 4, 110, 8, 250);
      x.fillStyle = '#3f7a4a';
      x.beginPath();
      x.moveTo(W * 0.9 - 66, 118);
      x.lineTo(W * 0.9 + 66, 118);
      x.lineTo(W * 0.9 + 76, 330);
      x.lineTo(W * 0.9 - 76, 330);
      x.closePath();
      x.fill();
      x.fillStyle = '#f2ece0';
      x.font = 'bold 34px serif';
      x.fillText('賭', W * 0.9, 250);
      floor(x, H * 0.58, 'tatami');
      // the futon, turned down, deep plum quilt
      const mat = new Path2D();
      mat.moveTo(W * 0.3, H * 0.66);
      mat.lineTo(W * 0.78, H * 0.66);
      mat.lineTo(W * 0.9, H * 0.98);
      mat.lineTo(W * 0.18, H * 0.98);
      mat.closePath();
      x.fillStyle = '#f4efe6';
      x.fill(mat);
      for (const px of [W * 0.4, W * 0.6]) {
        const pg = x.createLinearGradient(0, H * 0.64, 0, H * 0.72);
        pg.addColorStop(0, '#ffffff');
        pg.addColorStop(1, '#d8d0c4');
        x.fillStyle = pg;
        x.beginPath();
        x.ellipse(px, H * 0.69, 80, 22, 0, 0, U.TAU);
        x.fill();
      }
      const quilt = new Path2D();
      quilt.moveTo(W * 0.24, H * 0.8);
      quilt.bezierCurveTo(W * 0.4, H * 0.74, W * 0.52, H * 0.84, W * 0.66, H * 0.78);
      quilt.bezierCurveTo(W * 0.74, H * 0.75, W * 0.8, H * 0.78, W * 0.84, H * 0.8);
      quilt.lineTo(W * 0.92, H);
      quilt.lineTo(W * 0.14, H);
      quilt.closePath();
      const qg = x.createLinearGradient(0, H * 0.76, 0, H);
      qg.addColorStop(0, '#8a2a4a');
      qg.addColorStop(1, '#4a1226');
      x.fillStyle = qg;
      x.fill(quilt);
      x.save();
      x.clip(quilt);
      x.strokeStyle = 'rgba(255,200,220,0.25)';
      x.lineWidth = 2;
      const r = U.rng(77);
      for (let i = 0; i < 26; i++) {
        const px = W * 0.16 + r() * W * 0.74, py = H * 0.8 + r() * H * 0.2;
        x.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * U.TAU;
          x.moveTo(px, py);
          x.lineTo(px + Math.cos(a) * 8, py + Math.sin(a) * 6);
        }
        x.stroke();
      }
      x.restore();
      // dinner remains and sake on a low table
      lowTable(x, W * 0.12, H * 0.9, 220, { sake: true });
      // candles and an andon lamp
      for (const [px, py] of [[W * 0.24, H * 0.64], [W * 0.84, H * 0.64], [W * 0.95, H * 0.9]]) candle(x, px, py);
      const ax = W * 0.96, ay = H * 0.62;
      x.fillStyle = '#f2d8a0';
      x.fillRect(ax - 26, ay - 96, 52, 90);
      x.strokeStyle = '#3a2418';
      x.lineWidth = 4;
      x.strokeRect(ax - 26, ay - 96, 52, 90);
      vignette(x, 0.55);
    },
    anim(x, t) {
      for (const [px, py] of [[W * 0.24, H * 0.64 - 34], [W * 0.84, H * 0.64 - 34], [W * 0.95, H * 0.9 - 34]]) flame(x, px, py, t);
      glow(x, W * 0.96, H * 0.62 - 50, 240, '#ffc078', 0.35 + Math.sin(t * 2) * 0.02);
      glow(x, W * 0.5, H * 0.8, 600, '#ff9a6a', 0.08);
    },
  };
})();
