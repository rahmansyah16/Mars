// Ground rendering: terrain types, procedural textures, and chunk-cached drawing
// with rounded organic borders between terrain layers.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const TS = NR.TS;
  const T = (NR.terrain = {});

  // layer: draw order; walk: passable; soft: wavy organic edges
  // Every type has a unique layer so higher layers always draw over lower ones.
  const TYPES = {
    void: { layer: -1, walk: false, color: '#07070b' },
    water: { layer: 0, walk: false, color: '#3f8fc4', water: true },
    deep: { layer: 0.1, walk: false, color: '#2b6c9e', water: true, soft: true },
    spring: { layer: 0.2, walk: false, color: '#5fc9c4', water: true, spring: true, soft: true },
    grass: { layer: 1, walk: true, color: '#6fae4a', soft: true, edge: 'shore' },
    grass2: { layer: 1.1, walk: true, color: '#62a043', soft: true, edge: 'shore', base: 'grass' },
    forest: { layer: 1.2, walk: true, color: '#4c8a3a', soft: true, edge: 'shore' },
    flowers: { layer: 1.3, walk: true, color: '#6fae4a', soft: true, edge: 'shore', base: 'grass', flowers: true },
    moss: { layer: 1.4, walk: true, color: '#5d7a4a', soft: true },
    cave: { layer: 1.5, walk: true, color: '#6b625c', soft: true },
    wood: { layer: 1.6, walk: true, color: '#b8875a' },
    tatami: { layer: 1.7, walk: true, color: '#c6c479' },
    tile: { layer: 1.8, walk: true, color: '#e4e7ea' },
    sand: { layer: 2, walk: true, color: '#e2cd97', soft: true },
    dirt: { layer: 2.1, walk: true, color: '#c9a36b', soft: true, edge: 'path' },
    ruins: { layer: 2.2, walk: true, color: '#8e939b', edge: 'stone' },
    stone: { layer: 3, walk: true, color: '#b8b0a2', edge: 'stone' },
    plaza: { layer: 3.1, walk: true, color: '#d3cab8', edge: 'stone' },
    bridge: { layer: 4, walk: true, color: '#9a6a3e', edge: 'bridge' },
    wall: { layer: 5, walk: false, color: '#e9dcc3', wall: true },
    cliff: { layer: 5, walk: false, color: '#8a7a68', cliff: true },
    rock: { layer: 5, walk: false, color: '#5a524d', cliff: true, cave: true },
  };
  T.TYPES = TYPES;

  // ---------- textures ----------
  const texCache = {};
  function tex(type, cpr) {
    const key = type + '@' + cpr;
    if (texCache[key]) return texCache[key];
    const N = 4; // tiles per texture side
    const size = TS * N;
    const c = U.canvas(size * cpr, size * cpr);
    const x = c.getContext('2d');
    x.scale(cpr, cpr);
    const t = TYPES[type];
    const rng = U.rng(U.strSeed(type));
    const base = t.color;
    x.fillStyle = base;
    x.fillRect(0, 0, size, size);
    // fine noise speckle
    const speck = (n, col, a, rmin, rmax) => {
      for (let i = 0; i < n; i++) {
        x.fillStyle = U.rgba(col, a * (0.5 + rng() * 0.5));
        const px = rng() * size, py = rng() * size, r = rmin + rng() * (rmax - rmin);
        x.beginPath();
        x.ellipse(px, py, r, r * (0.6 + rng() * 0.4), rng() * 3, 0, U.TAU);
        x.fill();
        // wrap copies for seamless tiling
        if (px < rmax || px > size - rmax || py < rmax || py > size - rmax) {
          for (const [ox, oy] of [[size, 0], [-size, 0], [0, size], [0, -size]]) {
            x.beginPath();
            x.ellipse(px + ox, py + oy, r, r * 0.8, 0, 0, U.TAU);
            x.fill();
          }
        }
      }
    };
    // draw fn at (px,py) plus the wrapped copies needed near the texture edges
    const wrap = (px, py, m, fn) => {
      for (const ox of [0, -size, size])
        for (const oy of [0, -size, size]) {
          if ((ox && (ox < 0 ? px < size - m : px > m)) || (oy && (oy < 0 ? py < size - m : py > m))) continue;
          fn(px + ox, py + oy);
        }
    };
    switch (t.base || type) {
      case 'grass':
      case 'forest': {
        speck(260, U.shade(base, -0.25), 0.35, 3, 10);
        speck(200, U.light(base, 0.25), 0.3, 2, 7);
        x.lineCap = 'round';
        for (let i = 0; i < 520; i++) {
          const px0 = rng() * size, py0 = rng() * size;
          const h = 3 + rng() * 5;
          x.strokeStyle = U.rgba(rng() < 0.5 ? U.shade(base, -0.3) : U.light(base, 0.3), 0.55);
          x.lineWidth = 1.1;
          const b1 = (rng() - 0.5) * 3, b2 = (rng() - 0.5) * 4;
          wrap(px0, py0, 10, (px, py) => {
            x.beginPath();
            x.moveTo(px, py);
            x.quadraticCurveTo(px + b1, py - h * 0.6, px + b2, py - h);
            x.stroke();
          });
        }
        break;
      }
      case 'dirt': {
        speck(300, U.shade(base, -0.2), 0.35, 2, 8);
        speck(220, U.light(base, 0.25), 0.35, 1.5, 5);
        for (let i = 0; i < 70; i++) {
          const px = rng() * size, py = rng() * size, r = 1.5 + rng() * 2.6;
          x.fillStyle = U.shade('#a89a86', (rng() - 0.5) * 0.3);
          x.beginPath();
          x.ellipse(px, py, r, r * 0.7, rng() * 3, 0, U.TAU);
          x.fill();
          x.fillStyle = 'rgba(255,255,255,0.35)';
          x.beginPath();
          x.ellipse(px - r * 0.3, py - r * 0.3, r * 0.4, r * 0.25, 0, 0, U.TAU);
          x.fill();
        }
        break;
      }
      case 'sand': {
        speck(400, U.shade(base, -0.12), 0.35, 1, 3);
        speck(300, U.light(base, 0.3), 0.4, 1, 2.5);
        break;
      }
      case 'stone':
      case 'plaza':
      case 'ruins': {
        // irregular flagstones on a grid
        const cell = type === 'plaza' ? TS : TS / 2;
        const n = size / cell;
        x.fillStyle = U.shade(base, -0.35);
        x.fillRect(0, 0, size, size);
        for (let gy = 0; gy < n; gy++) {
          for (let gx = 0; gx < n; gx++) {
            const off = type === 'plaza' ? 0 : (gy % 2) * cell * 0.5;
            const px = gx * cell + off, py = gy * cell;
            const col = U.shade(base, (rng() - 0.5) * 0.14);
            for (const ox of [0, -size]) {
              x.fillStyle = col;
              const r = 5;
              x.beginPath();
              x.roundRect ? x.roundRect(px + ox + 1.6, py + 1.6, cell - 3.2, cell - 3.2, r) : x.rect(px + ox + 1.6, py + 1.6, cell - 3.2, cell - 3.2);
              x.fill();
              x.fillStyle = 'rgba(255,255,255,0.18)';
              x.fillRect(px + ox + 3, py + 2.5, cell - 7, 2);
              x.fillStyle = 'rgba(0,0,0,0.12)';
              x.fillRect(px + ox + 3, py + cell - 4.5, cell - 7, 2);
            }
          }
        }
        speck(160, '#000000', 0.06, 1, 3);
        if (type === 'ruins') {
          x.strokeStyle = 'rgba(40,40,50,0.45)';
          x.lineWidth = 1.2;
          for (let i = 0; i < 16; i++) {
            let px = rng() * size, py = rng() * size;
            x.beginPath();
            x.moveTo(px, py);
            for (let k = 0; k < 4; k++) {
              px += (rng() - 0.5) * 18;
              py += (rng() - 0.5) * 18;
              x.lineTo(px, py);
            }
            x.stroke();
          }
          speck(40, '#5d7a4a', 0.45, 4, 12);
        }
        break;
      }
      case 'water':
      case 'deep':
      case 'spring': {
        const g = x.createLinearGradient(0, 0, size, size);
        g.addColorStop(0, U.light(base, 0.08));
        g.addColorStop(0.5, base);
        g.addColorStop(1, U.shade(base, -0.08));
        x.fillStyle = g;
        x.fillRect(0, 0, size, size);
        x.strokeStyle = U.rgba(U.light(base, 0.5), 0.35);
        x.lineWidth = 1.6;
        x.lineCap = 'round';
        for (let i = 0; i < 70; i++) {
          const w = 8 + rng() * 18;
          wrap(rng() * size, rng() * size, 30, (px, py) => {
            x.beginPath();
            x.moveTo(px, py);
            x.quadraticCurveTo(px + w / 2, py - 3, px + w, py);
            x.stroke();
          });
        }
        speck(60, U.shade(base, -0.3), 0.18, 6, 16);
        break;
      }
      case 'wood': {
        // planks wrap around the texture edge so the floor tiles seamlessly
        const ph = TS / 4;
        for (let row = 0; row < size / ph; row++) {
          const start = -rng() * 60;
          let px = start;
          while (px < start + size - 1) {
            const rem = start + size - px;
            let w = 60 + rng() * 90;
            if (w > rem - 30) w = rem;
            const col = U.shade(base, (rng() - 0.5) * 0.16);
            const grain = [0, 1, 2].map(() => [row * ph + 3 + rng() * (ph - 6), (rng() - 0.5) * 3]);
            for (const off of [0, size]) {
              const qx = px + off;
              x.fillStyle = col;
              x.fillRect(qx, row * ph, w, ph);
              x.strokeStyle = 'rgba(80,45,20,0.25)';
              x.lineWidth = 0.8;
              for (const [gy, bend] of grain) {
                x.beginPath();
                x.moveTo(qx + 3, gy);
                x.quadraticCurveTo(qx + w / 2, gy + bend, qx + w - 3, gy);
                x.stroke();
              }
              x.fillStyle = 'rgba(60,30,10,0.45)';
              x.fillRect(qx, row * ph, 1.4, ph);
            }
            px += w;
          }
          x.fillStyle = 'rgba(60,30,10,0.4)';
          x.fillRect(0, row * ph + ph - 1.2, size, 1.2);
          x.fillStyle = 'rgba(255,230,190,0.18)';
          x.fillRect(0, row * ph, size, 1);
        }
        break;
      }
      case 'tatami': {
        for (let ty = 0; ty < N; ty++) {
          for (let tx = 0; tx < N; tx++) {
            const px = tx * TS, py = ty * TS;
            const horiz = (tx + ty) % 2 === 0;
            x.fillStyle = U.shade(base, (rng() - 0.5) * 0.08);
            x.fillRect(px, py, TS, TS);
            x.strokeStyle = 'rgba(120,120,50,0.3)';
            x.lineWidth = 0.7;
            for (let k = 2; k < TS; k += 3) {
              x.beginPath();
              if (horiz) {
                x.moveTo(px, py + k);
                x.lineTo(px + TS, py + k);
              } else {
                x.moveTo(px + k, py);
                x.lineTo(px + k, py + TS);
              }
              x.stroke();
            }
            x.fillStyle = '#3b3a2a';
            if (horiz) {
              x.fillRect(px, py, TS, 3.5);
              x.fillRect(px, py + TS - 3.5, TS, 3.5);
            } else {
              x.fillRect(px, py, 3.5, TS);
              x.fillRect(px + TS - 3.5, py, 3.5, TS);
            }
          }
        }
        break;
      }
      case 'tile': {
        const cell = TS / 2;
        for (let gy = 0; gy < size / cell; gy++) {
          for (let gx = 0; gx < size / cell; gx++) {
            x.fillStyle = (gx + gy) % 2 ? base : U.shade(base, -0.06);
            x.fillRect(gx * cell, gy * cell, cell, cell);
          }
        }
        x.strokeStyle = 'rgba(120,130,140,0.35)';
        x.lineWidth = 1;
        for (let k = 0; k <= size; k += cell) {
          x.beginPath();
          x.moveTo(k, 0);
          x.lineTo(k, size);
          x.moveTo(0, k);
          x.lineTo(size, k);
          x.stroke();
        }
        break;
      }
      case 'cave':
      case 'moss': {
        speck(260, U.shade(base, -0.25), 0.4, 3, 12);
        speck(200, U.light(base, 0.2), 0.3, 2, 8);
        x.strokeStyle = 'rgba(20,15,15,0.35)';
        x.lineWidth = 1.2;
        for (let i = 0; i < 20; i++) {
          let px = rng() * size, py = rng() * size;
          x.beginPath();
          x.moveTo(px, py);
          for (let k = 0; k < 3; k++) {
            px += (rng() - 0.5) * 22;
            py += (rng() - 0.5) * 22;
            x.lineTo(px, py);
          }
          x.stroke();
        }
        if (type === 'moss') speck(120, '#8ab86a', 0.35, 2, 6);
        break;
      }
      case 'bridge': {
        const pw = TS / 5;
        for (let i = 0; i < size / pw; i++) {
          x.fillStyle = U.shade(base, (rng() - 0.5) * 0.18);
          x.fillRect(i * pw + 0.6, 0, pw - 1.2, size);
          x.fillStyle = 'rgba(40,20,10,0.5)';
          x.fillRect(i * pw, 0, 1.2, size);
          x.fillStyle = 'rgba(255,230,190,0.2)';
          x.fillRect(i * pw + 1.2, 0, 1.2, size);
        }
        break;
      }
      default:
        speck(200, U.shade(base, -0.2), 0.3, 2, 6);
    }
    texCache[key] = c;
    return c;
  }
  T.clearTex = () => {
    for (const k in texCache) delete texCache[k];
  };

  // ---------- chunk rendering ----------
  const CH = 8; // tiles per chunk side
  T.CH = CH;

  const R_CORNER = TS * 0.44;

  // Line from the current point to (bx,by); organic wobble on exposed soft edges.
  // Offsets come from world-space hashes so neighbouring chunks line up exactly.
  function wobLine(p, ax, ay, bx, by, wobble, seed) {
    if (!wobble) {
      p.lineTo(bx, by);
      return;
    }
    const steps = 4;
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = ax + dx * t, py = ay + dy * t;
      const amp = i === steps ? 0 : Math.sin(Math.PI * t) * (U.hash2(Math.round(px * 7), Math.round(py * 7), seed) - 0.5) * 7;
      p.lineTo(px + nx * amp, py + ny * amp);
    }
  }

  function tileShape(p, map, tx, ty, inSet, soft, seed) {
    const x0 = tx * TS, y0 = ty * TS, x1 = x0 + TS, y1 = y0 + TS;
    const n = inSet(tx, ty - 1), s = inSet(tx, ty + 1), w = inSet(tx - 1, ty), e = inSet(tx + 1, ty);
    const R = R_CORNER;
    const rTL = !n && !w ? R : 0, rTR = !n && !e ? R : 0, rBR = !s && !e ? R : 0, rBL = !s && !w ? R : 0;
    const ov = 0.6; // overlap on shared edges to avoid seams
    const ex0 = w ? x0 - ov : x0, ex1 = e ? x1 + ov : x1, ey0 = n ? y0 - ov : y0, ey1 = s ? y1 + ov : y1;
    p.moveTo(ex0 + rTL, ey0);
    wobLine(p, ex0 + rTL, ey0, ex1 - rTR, ey0, !n && soft, seed);
    if (rTR) p.arcTo(x1, y0, x1, y0 + rTR, rTR);
    wobLine(p, ex1, ey0 + rTR, ex1, ey1 - rBR, !e && soft, seed);
    if (rBR) p.arcTo(x1, y1, x1 - rBR, y1, rBR);
    wobLine(p, ex1 - rBR, ey1, ex0 + rBL, ey1, !s && soft, seed);
    if (rBL) p.arcTo(x0, y1, x0, y1 - rBL, rBL);
    wobLine(p, ex0, ey1 - rBL, ex0, ey0 + rTL, !w && soft, seed);
    if (rTL) p.arcTo(x0, y0, x0 + rTL, y0, rTL);
    p.closePath();
    // concave fillets: add a small curved wedge where two set neighbours meet
    const F = TS * 0.3;
    const fil = (px, py, sx, sy) => {
      p.moveTo(px, py);
      p.lineTo(px + sx * F, py);
      p.arc(px + sx * F, py + sy * F, F, sy < 0 ? Math.PI / 2 : -Math.PI / 2, sx < 0 ? 0 : Math.PI, (sx < 0) === (sy < 0));
      p.closePath();
    };
    if (n && w && !inSet(tx - 1, ty - 1)) fil(x0, y0, -1, -1);
    if (n && e && !inSet(tx + 1, ty - 1)) fil(x1, y0, 1, -1);
    if (s && w && !inSet(tx - 1, ty + 1)) fil(x0, y1, -1, 1);
    if (s && e && !inSet(tx + 1, ty + 1)) fil(x1, y1, 1, 1);
  }

  // Exposed edge segments (same wobble as the fill) for border effects.
  function edgePath(map, tx0, ty0, tx1, ty1, inSet, soft, seed) {
    const p = new Path2D();
    const R = R_CORNER;
    for (let ty = ty0; ty < ty1; ty++) {
      for (let tx = tx0; tx < tx1; tx++) {
        if (!inSet(tx, ty)) continue;
        const x0 = tx * TS, y0 = ty * TS, x1 = x0 + TS, y1 = y0 + TS;
        const n = inSet(tx, ty - 1), s = inSet(tx, ty + 1), w = inSet(tx - 1, ty), e = inSet(tx + 1, ty);
        const rTL = !n && !w ? R : 0, rTR = !n && !e ? R : 0, rBR = !s && !e ? R : 0, rBL = !s && !w ? R : 0;
        if (!n) {
          p.moveTo(x0 + rTL, y0);
          wobLine(p, x0 + rTL, y0, x1 - rTR, y0, soft, seed);
          if (rTR) p.arcTo(x1, y0, x1, y0 + rTR, rTR);
        }
        if (!e) {
          p.moveTo(x1, y0 + rTR);
          wobLine(p, x1, y0 + rTR, x1, y1 - rBR, soft, seed);
          if (rBR) p.arcTo(x1, y1, x1 - rBR, y1, rBR);
        }
        if (!s) {
          p.moveTo(x1 - rBR, y1);
          wobLine(p, x1 - rBR, y1, x0 + rBL, y1, soft, seed);
          if (rBL) p.arcTo(x0, y1, x0, y1 - rBL, rBL);
        }
        if (!w) {
          p.moveTo(x0, y1 - rBL);
          wobLine(p, x0, y1 - rBL, x0, y0 + rTL, soft, seed);
          if (rTL) p.arcTo(x0, y0, x0 + rTL, y0, rTL);
        }
      }
    }
    return p;
  }

  function drawWallTile(x, map, tx, ty, t) {
    const px = tx * TS, py = ty * TS;
    const below = map.terrainAt(tx, ty + 1);
    const face = !TYPES[below] || !(TYPES[below].wall || TYPES[below].cliff);
    const rng = U.rng(U.strSeed(tx + ',' + ty));
    if (t.wall) {
      const wc = map.def.wallColor || t.color;
      if (face) {
        const g = x.createLinearGradient(0, py, 0, py + TS);
        g.addColorStop(0, U.shade(wc, -0.12));
        g.addColorStop(1, wc);
        x.fillStyle = g;
        x.fillRect(px, py, TS, TS);
        // wainscot + trim
        x.fillStyle = map.def.wallTrim || '#8a5a36';
        x.fillRect(px, py, TS, 5);
        x.fillStyle = U.shade(map.def.wallTrim || '#8a5a36', -0.2);
        x.fillRect(px, py + TS - 12, TS, 12);
        x.fillStyle = 'rgba(255,255,255,0.15)';
        x.fillRect(px, py + TS - 12, TS, 2);
        // vertical beams
        if ((tx + (map.def.beamOffset || 0)) % 3 === 0) {
          x.fillStyle = U.shade(map.def.wallTrim || '#8a5a36', 0.05);
          x.fillRect(px + 2, py, 7, TS - 12);
        }
      } else {
        x.fillStyle = map.def.ceiling || '#2a2230';
        x.fillRect(px, py, TS, TS);
        x.fillStyle = 'rgba(255,255,255,0.05)';
        x.fillRect(px, py, TS, 2);
      }
      return;
    }
    // cliff / rock
    const cc = t.color;
    if (face) {
      const g = x.createLinearGradient(0, py, 0, py + TS);
      g.addColorStop(0, U.shade(cc, 0.05));
      g.addColorStop(1, U.shade(cc, -0.3));
      x.fillStyle = g;
      x.fillRect(px, py, TS, TS);
      x.strokeStyle = U.rgba(U.shade(cc, -0.5), 0.55);
      x.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const lx = px + 6 + rng() * (TS - 12);
        x.beginPath();
        x.moveTo(lx, py + 4);
        x.lineTo(lx + (rng() - 0.5) * 8, py + TS * 0.5);
        x.lineTo(lx + (rng() - 0.5) * 10, py + TS - 4);
        x.stroke();
      }
      x.fillStyle = U.rgba(U.light(cc, 0.3), 0.35);
      for (let i = 0; i < 5; i++) {
        x.fillRect(px + rng() * TS, py + rng() * TS, 3 + rng() * 6, 1.5);
      }
      // grass lip on top of exterior cliffs
      if (!t.cave) {
        const above = map.terrainAt(tx, ty - 1);
        if (!TYPES[above] || !TYPES[above].cliff) {
          x.fillStyle = '#5d9a3e';
          x.beginPath();
          x.moveTo(px, py);
          for (let k = 0; k <= 8; k++) x.lineTo(px + (k * TS) / 8, py + 5 + (k % 2) * 5 + rng() * 2);
          x.lineTo(px + TS, py);
          x.closePath();
          x.fill();
        }
      }
      // shadow at base
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.fillRect(px, py + TS - 5, TS, 5);
    } else {
      const g = x.createLinearGradient(px, py, px + TS, py + TS);
      g.addColorStop(0, t.cave ? U.shade(cc, -0.2) : '#6a9a48');
      g.addColorStop(1, t.cave ? U.shade(cc, -0.35) : '#5a8a3c');
      x.fillStyle = g;
      x.fillRect(px, py, TS, TS);
      x.fillStyle = t.cave ? 'rgba(255,255,255,0.05)' : 'rgba(30,60,20,0.25)';
      for (let i = 0; i < 6; i++) {
        x.beginPath();
        x.arc(px + rng() * TS, py + rng() * TS, 3 + rng() * 6, 0, U.TAU);
        x.fill();
      }
    }
  }

  function decals(x, map, tx, ty, type) {
    const t = TYPES[type];
    const seed = map.seed;
    const h = (k) => U.hash2(tx * 7 + k, ty * 13 - k, seed);
    const px = tx * TS, py = ty * TS;
    if ((type === 'grass' || type === 'grass2' || type === 'forest') && h(1) < 0.5) {
      // grass tufts
      const n = 1 + Math.floor(h(2) * 3);
      for (let i = 0; i < n; i++) {
        const cx = px + 8 + h(10 + i) * (TS - 16), cy = py + 10 + h(20 + i) * (TS - 14);
        const col = type === 'forest' ? '#3f7a30' : '#5b9a3a';
        x.strokeStyle = col;
        x.lineWidth = 2;
        x.lineCap = 'round';
        for (let k = -2; k <= 2; k++) {
          x.beginPath();
          x.moveTo(cx + k * 2, cy);
          x.quadraticCurveTo(cx + k * 3, cy - 5, cx + k * 4.2, cy - 8 - Math.abs(k) * -1);
          x.stroke();
        }
        x.strokeStyle = '#9ad06a';
        x.lineWidth = 1.2;
        x.beginPath();
        x.moveTo(cx, cy);
        x.quadraticCurveTo(cx + 1, cy - 5, cx + 2, cy - 9);
        x.stroke();
      }
    }
    if (((type === 'grass' || type === 'grass2') && h(3) < 0.12) || t.flowers) {
      const n = t.flowers ? 6 + Math.floor(h(4) * 5) : 1 + Math.floor(h(4) * 2);
      const cols = ['#ffffff', '#ffe066', '#ff9ec4', '#b8a4ff', '#ff7a6a'];
      for (let i = 0; i < n; i++) {
        const cx = px + 6 + h(30 + i) * (TS - 12), cy = py + 6 + h(40 + i) * (TS - 12);
        const col = cols[Math.floor(h(50 + i) * cols.length)];
        x.fillStyle = '#3f7a30';
        x.fillRect(cx - 0.6, cy, 1.2, 4);
        x.fillStyle = col;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * U.TAU;
          x.beginPath();
          x.arc(cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2, 1.7, 0, U.TAU);
          x.fill();
        }
        x.fillStyle = '#ffd23a';
        x.beginPath();
        x.arc(cx, cy, 1.2, 0, U.TAU);
        x.fill();
      }
    }
    if (type === 'forest' && h(5) < 0.18) {
      // fallen leaves
      for (let i = 0; i < 4; i++) {
        const cx = px + h(60 + i) * TS, cy = py + h(70 + i) * TS;
        x.fillStyle = U.pick(['#b8862e', '#9a5a2a', '#c9a23a']);
        x.beginPath();
        x.ellipse(cx, cy, 3.2, 1.8, h(80 + i) * 3, 0, U.TAU);
        x.fill();
      }
    }
    if (type === 'cave' && h(6) < 0.25) {
      const cx = px + 10 + h(90) * (TS - 20), cy = py + 10 + h(91) * (TS - 20);
      x.fillStyle = '#4a433e';
      x.beginPath();
      x.ellipse(cx, cy, 5, 3.5, 0, 0, U.TAU);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,0.12)';
      x.beginPath();
      x.ellipse(cx - 1.5, cy - 1.5, 2, 1, 0, 0, U.TAU);
      x.fill();
    }
  }

  // Render one chunk (cx, cy chunk coords) into a canvas at pixel ratio cpr.
  T.renderChunk = function (map, cx, cy, cpr) {
    const size = CH * TS;
    const c = U.canvas(size * cpr, size * cpr);
    const x = c.getContext('2d');
    x.scale(cpr, cpr);
    x.translate(-cx * size, -cy * size);
    const tx0 = cx * CH, ty0 = cy * CH, tx1 = tx0 + CH, ty1 = ty0 + CH;
    const M = 1; // margin tiles
    const layerOf = (tx, ty) => {
      const t = TYPES[map.terrainAt(tx, ty)];
      return t ? t.layer : -1;
    };
    // base fill with lowest layer present near chunk
    let minLayer = 99, minType = 'void';
    const present = new Set();
    for (let ty = ty0 - M; ty < ty1 + M; ty++)
      for (let tx = tx0 - M; tx < tx1 + M; tx++) {
        const tt = map.terrainAt(tx, ty);
        present.add(tt);
        const l = TYPES[tt] ? TYPES[tt].layer : -1;
        if (l >= 0 && l < minLayer && !TYPES[tt].wall && !TYPES[tt].cliff) {
          minLayer = l;
          minType = tt;
        }
      }
    x.fillStyle = TYPES[minType] ? TYPES[minType].color : '#000';
    x.fillRect(tx0 * TS, ty0 * TS, size, size);
    if (TYPES[minType]) {
      const pat = x.createPattern(tex(minType, cpr), 'repeat');
      pat.setTransform(new DOMMatrix([1 / cpr, 0, 0, 1 / cpr, 0, 0]));
      x.fillStyle = pat;
      x.fillRect(tx0 * TS, ty0 * TS, size, size);
    }
    // types grouped by layer, draw ascending
    const types = [...present].filter((t) => TYPES[t] && !TYPES[t].wall && !TYPES[t].cliff && TYPES[t].layer >= 0);
    types.sort((a, b) => TYPES[a].layer - TYPES[b].layer || a.localeCompare(b));
    for (const tt of types) {
      const t = TYPES[tt];
      if (tt === minType) continue;
      // the set: this type or any higher layer (non-wall) so lower layers extend under
      const inSet = (ax, ay) => {
        const o = map.terrainAt(ax, ay);
        if (o === tt) return true;
        const ot = TYPES[o];
        if (!ot) return false;
        if (ot.wall || ot.cliff) return true;
        return ot.layer > t.layer;
      };
      const p = new Path2D();
      let any = false;
      for (let ty = ty0 - M; ty < ty1 + M; ty++)
        for (let tx = tx0 - M; tx < tx1 + M; tx++)
          if (inSet(tx, ty)) {
            tileShape(p, map, tx, ty, inSet, t.soft, map.seed + t.layer);
            any = true;
          }
      if (!any) continue;
      // shadow / rim under the shape
      if (t.edge === 'shore' && (present.has('water') || present.has('deep') || present.has('spring'))) {
        x.save();
        x.translate(0, 5);
        x.fillStyle = 'rgba(20,50,70,0.35)';
        x.fill(p);
        x.restore();
      }
      x.save();
      x.clip(p);
      const pat = x.createPattern(tex(tt, cpr), 'repeat');
      pat.setTransform(new DOMMatrix([1 / cpr, 0, 0, 1 / cpr, 0, 0]));
      x.fillStyle = pat;
      x.fillRect(tx0 * TS - TS, ty0 * TS - TS, size + TS * 2, size + TS * 2);
      x.restore();
      const ep = edgePath(map, tx0 - M, ty0 - M, tx1 + M, ty1 + M, inSet, t.soft, map.seed + t.layer);
      x.lineCap = 'round';
      if (t.edge === 'shore') {
        x.strokeStyle = 'rgba(225,210,160,0.9)';
        x.lineWidth = 5;
        x.stroke(ep);
        x.strokeStyle = 'rgba(60,120,40,0.5)';
        x.lineWidth = 2;
        x.stroke(ep);
      } else if (t.edge === 'path') {
        x.strokeStyle = 'rgba(110,80,40,0.35)';
        x.lineWidth = 3;
        x.stroke(ep);
        x.strokeStyle = 'rgba(80,130,50,0.45)';
        x.lineWidth = 1.5;
        x.stroke(ep);
      } else if (t.edge === 'stone') {
        x.strokeStyle = 'rgba(70,60,50,0.55)';
        x.lineWidth = 3;
        x.stroke(ep);
      } else if (t.edge === 'bridge') {
        x.strokeStyle = 'rgba(50,25,10,0.8)';
        x.lineWidth = 4;
        x.stroke(ep);
      }
    }
    // walls & cliffs
    for (let ty = ty0; ty < ty1; ty++)
      for (let tx = tx0; tx < tx1; tx++) {
        const tt = map.terrainAt(tx, ty);
        const t = TYPES[tt];
        if (t && (t.wall || t.cliff)) drawWallTile(x, map, tx, ty, t);
      }
    // decals
    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) decals(x, map, tx, ty, map.terrainAt(tx, ty));
    // flat props baked into ground
    if (map.decalProps) {
      for (const pr of map.decalProps) {
        if (pr.x + pr.w < tx0 - 1 || pr.x > tx1 + 1 || pr.y + pr.h < ty0 - 1 || pr.y > ty1 + 1) continue;
        NR.props.drawDecal(x, pr);
      }
    }
    // large-scale color variation (outdoor)
    if (map.def.outdoor) {
      const n = CH * 2 + 1;
      const v = U.canvas(n, n);
      const vx = v.getContext('2d');
      const img = vx.createImageData(n, n);
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const f = U.fbm((tx0 + i / 2) * 0.18, (ty0 + j / 2) * 0.18, map.seed, 3);
          const k = (j * n + i) * 4;
          const d = f < 0.5 ? 0 : 255;
          img.data[k] = d;
          img.data[k + 1] = d;
          img.data[k + 2] = d * 0.8;
          img.data[k + 3] = Math.abs(f - 0.5) * 110;
        }
      vx.putImageData(img, 0, 0);
      x.save();
      x.globalCompositeOperation = 'soft-light';
      x.imageSmoothingEnabled = true;
      x.drawImage(v, tx0 * TS - TS / 4, ty0 * TS - TS / 4, size + TS / 2, size + TS / 2);
      x.restore();
    }
    return c;
  };

  // Animated water sparkle overlay for visible water tiles.
  T.drawWaterFx = function (ctx, map, cam, time) {
    const x0 = Math.floor(cam.x / TS) - 1, y0 = Math.floor(cam.y / TS) - 1;
    const x1 = x0 + Math.ceil(NR.W / TS) + 3, y1 = y0 + Math.ceil(NR.H / TS) + 3;
    ctx.save();
    ctx.lineCap = 'round';
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        const t = TYPES[map.terrainAt(tx, ty)];
        if (!t || !t.water) continue;
        const h = U.hash2(tx, ty, 99);
        const ph = time * (0.6 + h * 0.5) + h * 10;
        const a = (Math.sin(ph) * 0.5 + 0.5) * 0.45;
        const px = tx * TS + 10 + h * 36, py = ty * TS + 16 + ((h * 97) % 1) * 30;
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const dx = Math.sin(ph * 0.7) * 4;
        ctx.moveTo(px + dx, py);
        ctx.quadraticCurveTo(px + dx + 7, py - 3, px + dx + 14, py);
        ctx.stroke();
        if (t.spring && h < 0.5) {
          ctx.fillStyle = `rgba(255,255,255,${0.25 + a * 0.4})`;
          ctx.beginPath();
          ctx.arc(px + 20, py + 12, 1.6 + a * 2, 0, U.TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  };
})();
