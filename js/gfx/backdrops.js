// Painted full-screen backdrops for the title, battles and cinematic/romance scenes.
// Static layers are cached; animated details (steam, petals, lanterns...) draw per frame.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const W = NR.W, H = NR.H;
  const BD = (NR.backdrops = { cache: new Map() });
  const H_ = NR.props.h;

  // ---------- painting helpers ----------
  function sky(x, stops) {
    const g = x.createLinearGradient(0, 0, 0, H);
    stops.forEach(([k, c]) => g.addColorStop(k, c));
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  }
  function stars(x, n, seed, maxY = H * 0.6) {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const a = 0.3 + r() * 0.7;
      x.fillStyle = `rgba(255,255,240,${a})`;
      const s = r() < 0.08 ? 2.2 : 1.1;
      x.beginPath();
      x.arc(r() * W, r() * maxY, s, 0, U.TAU);
      x.fill();
    }
  }
  function moon(x, cx, cy, r, col = '#fff8e0', glow = 'rgba(255,245,210,0.35)') {
    const g = x.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 5);
    g.addColorStop(0, glow);
    g.addColorStop(1, 'rgba(255,245,210,0)');
    x.fillStyle = g;
    x.fillRect(cx - r * 5, cy - r * 5, r * 10, r * 10);
    x.fillStyle = col;
    x.beginPath();
    x.arc(cx, cy, r, 0, U.TAU);
    x.fill();
    x.fillStyle = 'rgba(200,190,160,0.35)';
    for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.13], [-0.05, 0.35, 0.1]]) {
      x.beginPath();
      x.arc(cx + dx * r, cy + dy * r, rr * r, 0, U.TAU);
      x.fill();
    }
  }
  function sun(x, cx, cy, r, col) {
    const g = x.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 6);
    g.addColorStop(0, U.rgba(col, 0.7));
    g.addColorStop(1, U.rgba(col, 0));
    x.fillStyle = g;
    x.fillRect(cx - r * 6, cy - r * 6, r * 12, r * 12);
    x.fillStyle = '#fff2c8';
    x.beginPath();
    x.arc(cx, cy, r, 0, U.TAU);
    x.fill();
  }
  function ridge(x, y0, amp, col, seed, step = 40, rough = 0.5) {
    const r = U.rng(seed);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, H);
    let y = y0;
    for (let px = 0; px <= W + step; px += step) {
      y = y0 + Math.sin(px * 0.004 + seed) * amp + (r() - 0.5) * amp * rough;
      x.lineTo(px, y);
    }
    x.lineTo(W, H);
    x.closePath();
    x.fill();
  }
  function treeline(x, y0, col, seed, size = 40) {
    const r = U.rng(seed);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, H);
    x.lineTo(0, y0);
    for (let px = 0; px <= W + size; px += size * 0.6) {
      const h = size * (0.7 + r() * 0.8);
      x.quadraticCurveTo(px + size * 0.3, y0 - h, px + size * 0.6, y0 - r() * 8);
    }
    x.lineTo(W, H);
    x.closePath();
    x.fill();
  }
  function roofs(x, baseY, col, seed, o = {}) {
    const r = U.rng(seed);
    x.fillStyle = col;
    let px = -20;
    while (px < W + 40) {
      const w = 60 + r() * 110, h = 40 + r() * (o.tall || 90);
      const top = baseY - h;
      x.fillRect(px, top, w, H - top);
      if (r() < 0.6) {
        // gable roof
        x.beginPath();
        x.moveTo(px - 8, top);
        x.lineTo(px + w / 2, top - 18 - r() * 16);
        x.lineTo(px + w + 8, top);
        x.fill();
      } else if (r() < 0.6) {
        // water tank
        x.fillRect(px + w * 0.6, top - 26, 26, 26);
        x.beginPath();
        x.ellipse(px + w * 0.6 + 13, top - 26, 13, 5, 0, 0, U.TAU);
        x.fill();
      }
      if (o.windows) {
        for (let wy = top + 14; wy < baseY - 10; wy += 22) {
          for (let wx = px + 8; wx < px + w - 14; wx += 20) {
            if (r() < 0.35) {
              x.save();
              x.fillStyle = r() < 0.5 ? 'rgba(255,200,110,0.85)' : 'rgba(255,220,150,0.6)';
              x.fillRect(wx, wy, 9, 11);
              x.restore();
            }
          }
        }
      }
      px += w + r() * 14;
    }
  }
  function monumentSilhouette(x, cx, baseY, w, col, light) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(cx - w * 0.7, baseY);
    x.lineTo(cx - w * 0.62, baseY - 120);
    x.quadraticCurveTo(cx - w * 0.3, baseY - 180, cx, baseY - 176);
    x.quadraticCurveTo(cx + w * 0.4, baseY - 186, cx + w * 0.66, baseY - 110);
    x.lineTo(cx + w * 0.74, baseY);
    x.closePath();
    x.fill();
    // faces
    const n = 6;
    for (let i = 0; i < n; i++) {
      const fx = cx - w * 0.52 + (i + 0.5) * ((w * 1.04) / n), fy = baseY - 104;
      x.fillStyle = light;
      x.beginPath();
      x.ellipse(fx, fy, 22, 30, 0, 0, U.TAU);
      x.fill();
      x.fillStyle = col;
      x.fillRect(fx - 14, fy - 4, 10, 4);
      x.fillRect(fx + 4, fy - 4, 10, 4);
      x.fillRect(fx - 2, fy + 2, 4, 12);
      x.beginPath();
      x.moveTo(fx - 24, fy - 14);
      for (let k = 0; k < 5; k++) x.lineTo(fx - 24 + k * 12, fy - 34 - (k % 2) * 10);
      x.lineTo(fx + 24, fy - 14);
      x.fill();
    }
  }
  function water(x, y0, top, bottom) {
    const g = x.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    x.fillStyle = g;
    x.fillRect(0, y0, W, H - y0);
  }
  function lanternString(x, y0, y1, n, seed) {
    const r = U.rng(seed);
    x.strokeStyle = 'rgba(40,20,20,0.8)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(-20, y0);
    x.quadraticCurveTo(W / 2, y1, W + 20, y0);
    x.stroke();
    const out = [];
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const px = -20 + t * (W + 40);
      const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y0;
      out.push([px, py + 18, r() < 0.5 ? '#ff6a3a' : '#ffc050']);
    }
    return out;
  }
  function paperLantern(x, px, py, col, glow = 1) {
    const g = x.createRadialGradient(px, py, 2, px, py, 60);
    g.addColorStop(0, U.rgba(col, 0.45 * glow));
    g.addColorStop(1, U.rgba(col, 0));
    x.fillStyle = g;
    x.fillRect(px - 60, py - 60, 120, 120);
    x.fillStyle = col;
    x.beginPath();
    x.ellipse(px, py, 14, 18, 0, 0, U.TAU);
    x.fill();
    x.fillStyle = 'rgba(255,255,220,0.5)';
    x.beginPath();
    x.ellipse(px - 4, py - 4, 5, 8, 0, 0, U.TAU);
    x.fill();
    x.fillStyle = '#2a1a14';
    x.fillRect(px - 8, py - 21, 16, 4);
    x.fillRect(px - 8, py + 17, 16, 4);
  }
  function rocks(x, y, n, seed, col = '#4a4a56') {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const px = r() * W, rr = 30 + r() * 60, py = y + r() * 40;
      const g = x.createLinearGradient(px, py - rr, px, py + rr);
      g.addColorStop(0, U.shade(col, 0.18));
      g.addColorStop(1, U.shade(col, -0.35));
      x.fillStyle = g;
      x.beginPath();
      x.ellipse(px, py, rr, rr * 0.55, r() * 0.4 - 0.2, 0, U.TAU);
      x.fill();
    }
  }
  function bigTree(x, cx, baseY, s, trunk, foliage, blossom) {
    x.fillStyle = trunk;
    x.beginPath();
    x.moveTo(cx - 40 * s, baseY);
    x.quadraticCurveTo(cx - 20 * s, baseY - 120 * s, cx - 30 * s, baseY - 240 * s);
    x.lineTo(cx + 12 * s, baseY - 250 * s);
    x.quadraticCurveTo(cx + 10 * s, baseY - 120 * s, cx + 44 * s, baseY);
    x.fill();
    // branches
    x.lineCap = 'round';
    x.strokeStyle = trunk;
    for (const [a, l, w] of [[-2.3, 170, 22], [-0.9, 190, 20], [-1.6, 120, 16], [-2.8, 120, 14], [-0.3, 130, 14]]) {
      x.lineWidth = w * s;
      x.beginPath();
      x.moveTo(cx - 10 * s, baseY - 220 * s);
      x.quadraticCurveTo(cx + Math.cos(a) * l * 0.5 * s, baseY - 220 * s + Math.sin(a) * l * 0.6 * s, cx + Math.cos(a) * l * s, baseY - 220 * s + Math.sin(a) * l * s);
      x.stroke();
    }
    const r = U.rng(99);
    for (let i = 0; i < 70; i++) {
      const a = r() * U.TAU, d = r();
      const px = cx + Math.cos(a) * d * 260 * s, py = baseY - 330 * s + Math.sin(a) * d * 140 * s;
      const rr = (26 + r() * 40) * s;
      const g = x.createRadialGradient(px - rr * 0.3, py - rr * 0.3, 2, px, py, rr);
      g.addColorStop(0, U.light(foliage, 0.25));
      g.addColorStop(1, U.rgba(U.shade(foliage, -0.2), 0.85));
      x.fillStyle = g;
      x.beginPath();
      x.arc(px, py, rr, 0, U.TAU);
      x.fill();
    }
    if (blossom) {
      for (let i = 0; i < 400; i++) {
        const a = r() * U.TAU, d = Math.sqrt(r());
        x.fillStyle = r() < 0.5 ? 'rgba(255,240,246,0.85)' : 'rgba(255,190,215,0.8)';
        x.beginPath();
        x.arc(cx + Math.cos(a) * d * 290 * s, baseY - 330 * s + Math.sin(a) * d * 150 * s, 2 + r() * 2.5, 0, U.TAU);
        x.fill();
      }
    }
  }
  function vignette(x, a = 0.55) {
    const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${a})`);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  }

  // ---------- scene definitions ----------
  const DEF = {};
  DEF.title = {
    paint(x) {
      sky(x, [[0, '#2a1a4a'], [0.35, '#8a3a5a'], [0.62, '#f0843a'], [0.78, '#ffc46a'], [1, '#ffd890']]);
      stars(x, 60, 3, H * 0.25);
      sun(x, W * 0.5, H * 0.66, 46, '#ffb050');
      ridge(x, H * 0.62, 30, '#8a4a5a', 11, 60, 0.4);
      monumentSilhouette(x, W * 0.5, H * 0.72, 470, '#5a2e44', '#7a3e54');
      ridge(x, H * 0.74, 14, '#4a2438', 7, 30, 0.8);
      roofs(x, H * 0.95, '#2a1428', 21, { windows: true, tall: 120 });
      treeline(x, H * 0.99, '#1a0c18', 5, 50);
      vignette(x, 0.45);
    },
    anim(x, t) {
      // soft god rays
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.28 + Math.sin(t * 0.2 + i) * 0.03;
        const g = x.createLinearGradient(W / 2, H * 0.66, W / 2 + Math.cos(a) * 700, H * 0.66 + Math.sin(a) * 700);
        g.addColorStop(0, 'rgba(255,190,110,0.12)');
        g.addColorStop(1, 'rgba(255,190,110,0)');
        x.fillStyle = g;
        x.beginPath();
        x.moveTo(W / 2, H * 0.66);
        x.lineTo(W / 2 + Math.cos(a - 0.08) * 800, H * 0.66 + Math.sin(a - 0.08) * 800);
        x.lineTo(W / 2 + Math.cos(a + 0.08) * 800, H * 0.66 + Math.sin(a + 0.08) * 800);
        x.fill();
      }
      x.restore();
    },
    weather: 'leaves',
  };
  DEF.forest = {
    paint(x) {
      sky(x, [[0, '#6fb0d8'], [0.5, '#bfe0d0'], [1, '#7aa860']]);
      ridge(x, H * 0.42, 20, '#8ab89a', 4, 50);
      treeline(x, H * 0.5, '#4f8a5a', 8, 70);
      treeline(x, H * 0.58, '#3a7040', 9, 60);
      const g = x.createLinearGradient(0, H * 0.55, 0, H);
      g.addColorStop(0, '#5a9a44');
      g.addColorStop(1, '#3a6a2e');
      x.fillStyle = g;
      x.fillRect(0, H * 0.58, W, H * 0.42);
      // giant trunks
      for (const [px, w] of [[60, 90], [W - 120, 110], [W * 0.3, 50], [W * 0.72, 60]]) {
        const tg = x.createLinearGradient(px - w / 2, 0, px + w / 2, 0);
        tg.addColorStop(0, '#4a3020');
        tg.addColorStop(0.5, '#7a5236');
        tg.addColorStop(1, '#3a2418');
        x.fillStyle = tg;
        x.fillRect(px - w / 2, 0, w, H * 0.66);
      }
      x.fillStyle = 'rgba(40,80,30,0.55)';
      for (let i = 0; i < 40; i++) {
        x.beginPath();
        x.ellipse(Math.random() * W, H * 0.62 + Math.random() * H * 0.36, 30 + Math.random() * 50, 8, 0, 0, U.TAU);
        x.fill();
      }
      // light shafts
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const px = 200 + i * 260;
        const g2 = x.createLinearGradient(px, 0, px + 120, H);
        g2.addColorStop(0, 'rgba(255,250,200,0.16)');
        g2.addColorStop(1, 'rgba(255,250,200,0)');
        x.fillStyle = g2;
        x.beginPath();
        x.moveTo(px, 0);
        x.lineTo(px + 60, 0);
        x.lineTo(px + 220, H);
        x.lineTo(px + 100, H);
        x.fill();
      }
      x.restore();
      vignette(x, 0.35);
    },
  };
  DEF.training = {
    paint(x) {
      sky(x, [[0, '#5aa0e0'], [0.55, '#cfe8f0'], [1, '#9ac870']]);
      ridge(x, H * 0.46, 26, '#9ac0b0', 12, 50);
      treeline(x, H * 0.55, '#5a9a54', 14, 60);
      const g = x.createLinearGradient(0, H * 0.55, 0, H);
      g.addColorStop(0, '#8ab85a');
      g.addColorStop(1, '#5a8a3a');
      x.fillStyle = g;
      x.fillRect(0, H * 0.56, W, H * 0.44);
      // three training posts
      for (const px of [W * 0.2, W * 0.5, W * 0.8]) {
        x.fillStyle = '#8a5a3a';
        x.fillRect(px - 18, H * 0.45, 36, 110);
        x.fillStyle = '#d9b27a';
        x.beginPath();
        x.ellipse(px, H * 0.45, 18, 7, 0, 0, U.TAU);
        x.fill();
      }
      vignette(x, 0.3);
    },
  };
  DEF.cave = {
    paint(x) {
      sky(x, [[0, '#0e0c14'], [0.5, '#2a2430'], [1, '#1a1620']]);
      const r = U.rng(5);
      for (let i = 0; i < 16; i++) {
        const px = r() * W, w = 30 + r() * 60, h = 60 + r() * 160;
        x.fillStyle = U.shade('#3a3440', r() * 0.2);
        x.beginPath();
        x.moveTo(px - w / 2, 0);
        x.lineTo(px, h);
        x.lineTo(px + w / 2, 0);
        x.fill();
      }
      const g = x.createLinearGradient(0, H * 0.55, 0, H);
      g.addColorStop(0, '#3a3440');
      g.addColorStop(1, '#1e1a24');
      x.fillStyle = g;
      x.fillRect(0, H * 0.56, W, H * 0.44);
      rocks(x, H * 0.6, 10, 8, '#3a3642');
      // glowing crystals & seal light
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const px = r() * W, py = H * 0.55 + r() * 60;
        const g2 = x.createRadialGradient(px, py, 2, px, py, 90);
        g2.addColorStop(0, 'rgba(160,120,255,0.35)');
        g2.addColorStop(1, 'rgba(160,120,255,0)');
        x.fillStyle = g2;
        x.fillRect(px - 90, py - 90, 180, 180);
      }
      x.restore();
      vignette(x, 0.6);
    },
    weather: 'dust',
  };
  DEF.ruins = {
    paint(x) {
      sky(x, [[0, '#6a7a9a'], [0.5, '#b8c0c8'], [1, '#7a8a8a']]);
      water(x, H * 0.5, '#6a90a8', '#3a5a6a');
      ridge(x, H * 0.5, 10, '#5a6a78', 3, 40);
      // broken pillars & spiral arches
      const r = U.rng(8);
      for (let i = 0; i < 7; i++) {
        const px = 60 + i * 190 + r() * 40, h = 80 + r() * 180;
        x.fillStyle = U.shade('#8a909a', (r() - 0.5) * 0.2);
        x.fillRect(px, H * 0.62 - h, 36, h);
        x.fillStyle = 'rgba(200,50,30,0.5)';
        x.beginPath();
        x.arc(px + 18, H * 0.62 - h * 0.6, 10, 0, U.TAU);
        x.fill();
      }
      const g = x.createLinearGradient(0, H * 0.6, 0, H);
      g.addColorStop(0, '#8a8e96');
      g.addColorStop(1, '#4a4e56');
      x.fillStyle = g;
      x.fillRect(0, H * 0.62, W, H * 0.38);
      x.strokeStyle = 'rgba(200,50,30,0.35)';
      x.lineWidth = 8;
      x.beginPath();
      for (let a = 0; a < 6 * Math.PI; a += 0.1) {
        const rr = a * 12;
        const px = W / 2 + Math.cos(a) * rr, py = H * 0.82 + Math.sin(a) * rr * 0.3;
        a === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.stroke();
      vignette(x, 0.45);
    },
    weather: 'fog',
  };
  DEF.moonwell = {
    paint(x) {
      sky(x, [[0, '#060414'], [0.5, '#1c1036'], [1, '#0c0818']]);
      stars(x, 160, 9, H);
      moon(x, W / 2, H * 0.3, 90, '#e8e0ff', 'rgba(170,130,255,0.35)');
      // hollow (dark centre)
      x.fillStyle = '#0c0818';
      x.beginPath();
      x.arc(W / 2 + 24, H * 0.28, 74, 0, U.TAU);
      x.fill();
      const g = x.createLinearGradient(0, H * 0.6, 0, H);
      g.addColorStop(0, '#2a2040');
      g.addColorStop(1, '#0c0818');
      x.fillStyle = g;
      x.beginPath();
      x.ellipse(W / 2, H * 0.9, W * 0.7, H * 0.36, 0, 0, U.TAU);
      x.fill();
      x.strokeStyle = 'rgba(180,140,255,0.55)';
      x.lineWidth = 4;
      for (const k of [1, 0.75, 0.5]) {
        x.beginPath();
        x.ellipse(W / 2, H * 0.84, W * 0.42 * k, H * 0.12 * k, 0, 0, U.TAU);
        x.stroke();
      }
      vignette(x, 0.6);
    },
    anim(x, t) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 24; i++) {
        const a = t * 0.6 + i * 0.26;
        const px = W / 2 + Math.cos(a) * W * 0.4, py = H * 0.84 + Math.sin(a) * H * 0.11;
        x.fillStyle = 'rgba(180,140,255,0.6)';
        x.beginPath();
        x.arc(px, py - ((t * 40 + i * 30) % 200), 2.5, 0, U.TAU);
        x.fill();
      }
      x.restore();
    },
  };
  DEF.village = {
    paint(x) {
      sky(x, [[0, '#6aa8e8'], [0.55, '#d8ecf4'], [1, '#e8d8b0']]);
      monumentSilhouette(x, W * 0.5, H * 0.5, 460, '#b0a080', '#c8b898');
      roofs(x, H * 0.66, '#c88a5a', 31, { tall: 70 });
      const g = x.createLinearGradient(0, H * 0.62, 0, H);
      g.addColorStop(0, '#d8c8a8');
      g.addColorStop(1, '#a89878');
      x.fillStyle = g;
      x.fillRect(0, H * 0.64, W, H * 0.36);
      vignette(x, 0.3);
    },
  };

  // ----- romance / cinematic scenes -----
  DEF.onsen_night = {
    paint(x) {
      sky(x, [[0, '#070a22'], [0.45, '#1a2450'], [1, '#26305a']]);
      stars(x, 140, 17, H * 0.45);
      moon(x, W * 0.78, H * 0.2, 44);
      ridge(x, H * 0.4, 30, '#141a36', 21, 50);
      // bamboo fence
      for (let px = 0; px < W; px += 16) {
        x.fillStyle = px % 32 ? '#3a3a24' : '#4a4a2c';
        x.fillRect(px, H * 0.3, 14, H * 0.24);
      }
      x.fillStyle = '#2a2a18';
      x.fillRect(0, H * 0.34, W, 6);
      x.fillRect(0, H * 0.48, W, 6);
      rocks(x, H * 0.5, 14, 4, '#3a3e52');
      water(x, H * 0.58, '#2f6a8a', '#1a3a5a');
      // moon reflection
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        x.fillStyle = `rgba(255,245,210,${0.3 - i * 0.018})`;
        x.fillRect(W * 0.78 - 40 + Math.sin(i) * 20, H * 0.6 + i * 18, 80 - i * 3, 4);
      }
      x.restore();
      rocks(x, H * 0.92, 10, 7, '#2a2e40');
      paperLantern(x, W * 0.12, H * 0.28, '#ff8a4a');
      paperLantern(x, W * 0.4, H * 0.26, '#ffb060');
      vignette(x, 0.55);
    },
    anim(x, t) {
      // rising steam
      for (let i = 0; i < 16; i++) {
        const px = (i * 97 + t * 14) % (W + 200) - 100, py = H * 0.7 - ((t * 22 + i * 60) % 300);
        const r = 60 + (i % 4) * 20;
        const g = x.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, 'rgba(255,255,255,0.13)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(px - r, py - r, r * 2, r * 2);
      }
    },
  };
  DEF.river_evening = {
    paint(x) {
      sky(x, [[0, '#3a2a6a'], [0.35, '#c85a6a'], [0.58, '#ffa05a'], [0.66, '#ffd08a'], [1, '#ffd08a']]);
      sun(x, W * 0.32, H * 0.58, 36, '#ff9a4a');
      ridge(x, H * 0.56, 20, '#6a3a5a', 13, 50);
      treeline(x, H * 0.6, '#4a2a44', 6, 40);
      water(x, H * 0.6, '#d8805a', '#4a3a6a');
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) {
        x.fillStyle = `rgba(255,200,120,${0.35 - i * 0.017})`;
        x.fillRect(W * 0.32 - 50 + Math.sin(i * 2) * 26, H * 0.62 + i * 14, 100 - i * 4, 3);
      }
      x.restore();
      // bridge silhouette
      x.fillStyle = '#2a1a2a';
      x.beginPath();
      x.moveTo(W * 0.52, H * 0.64);
      x.quadraticCurveTo(W * 0.76, H * 0.48, W + 20, H * 0.62);
      x.lineTo(W + 20, H * 0.67);
      x.quadraticCurveTo(W * 0.76, H * 0.54, W * 0.52, H * 0.69);
      x.fill();
      for (let i = 0; i < 9; i++) {
        const px = W * 0.54 + i * 60;
        const py = H * 0.64 - Math.sin((i / 8) * Math.PI) * 60;
        x.fillRect(px, py - 34, 4, 34);
      }
      x.fillStyle = '#3a2a2a';
      x.fillRect(0, H * 0.88, W, H * 0.12);
      vignette(x, 0.45);
    },
    weather: 'fireflies',
  };
  DEF.sakura_night = {
    paint(x) {
      sky(x, [[0, '#0a0c2a'], [0.55, '#2a2a5a'], [1, '#3a2a4a']]);
      stars(x, 120, 23, H * 0.5);
      moon(x, W * 0.2, H * 0.18, 38);
      ridge(x, H * 0.66, 12, '#1a1a36', 9, 40);
      const g = x.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, '#2a3a3a');
      g.addColorStop(1, '#141c20');
      x.fillStyle = g;
      x.fillRect(0, H * 0.72, W, H * 0.28);
      bigTree(x, W * 0.62, H * 0.9, 1, '#2a1a1e', '#e88aaa', true);
      // stone lantern glow
      paperLantern(x, W * 0.2, H * 0.72, '#ffb060', 0.8);
      vignette(x, 0.5);
    },
    weather: 'petals',
  };
  DEF.flowershop_night = {
    paint(x) {
      sky(x, [[0, '#2a1a2a'], [1, '#4a2a3a']]);
      // back shelves full of flowers
      for (let row = 0; row < 4; row++) {
        x.fillStyle = '#3a2418';
        x.fillRect(0, 80 + row * 120, W, 14);
        const r = U.rng(row * 31);
        for (let i = 0; i < 40; i++) {
          const px = r() * W, py = 80 + row * 120 - 10 - r() * 40;
          x.fillStyle = U.pick(['#ff7aa8', '#ffd24a', '#b58cff', '#ff6a5a', '#ffffff', '#ff9a4a']);
          x.globalAlpha = 0.85;
          x.beginPath();
          x.arc(px, py, 8 + r() * 10, 0, U.TAU);
          x.fill();
          x.globalAlpha = 1;
        }
      }
      x.fillStyle = '#5a3a26';
      x.fillRect(0, H * 0.72, W, H * 0.28);
      x.fillStyle = '#7a5236';
      x.fillRect(0, H * 0.72, W, 14);
      vignette(x, 0.65);
    },
    anim(x, t) {
      // candles
      for (const [px, py] of [[W * 0.2, H * 0.68], [W * 0.5, H * 0.66], [W * 0.8, H * 0.69]]) {
        const f = 1 + Math.sin(t * 12 + px) * 0.08;
        const g = x.createRadialGradient(px, py - 20, 2, px, py - 20, 220 * f);
        g.addColorStop(0, 'rgba(255,190,110,0.35)');
        g.addColorStop(1, 'rgba(255,190,110,0)');
        x.fillStyle = g;
        x.fillRect(px - 240, py - 240, 480, 480);
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
      sky(x, [[0, '#1a1410'], [1, '#3a2a1e']]);
      for (let i = 0; i < 12; i++) {
        const px = 60 + i * 100;
        x.strokeStyle = i % 2 ? '#8a9098' : '#a8b0ba';
        x.lineWidth = 6;
        x.beginPath();
        x.moveTo(px, 60);
        x.lineTo(px + (i % 3) * 6, H * 0.6);
        x.stroke();
        x.fillStyle = '#5a2a1a';
        x.fillRect(px - 6, H * 0.52, 12, 40);
      }
      x.fillStyle = '#4a3020';
      x.fillRect(0, H * 0.7, W, H * 0.3);
      vignette(x, 0.6);
    },
    anim(x, t) {
      const f = 1 + Math.sin(t * 9) * 0.05;
      const g = x.createRadialGradient(W * 0.5, H * 0.4, 10, W * 0.5, H * 0.4, 520 * f);
      g.addColorStop(0, 'rgba(255,170,90,0.28)');
      g.addColorStop(1, 'rgba(255,170,90,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
    },
  };
  DEF.rooftop_night = {
    paint(x) {
      sky(x, [[0, '#050818'], [0.5, '#141c44'], [1, '#2a2a4a']]);
      stars(x, 220, 41, H * 0.7);
      moon(x, W * 0.7, H * 0.22, 52);
      monumentSilhouette(x, W * 0.36, H * 0.6, 420, '#0e1228', '#1a2040');
      roofs(x, H * 0.84, '#0a0c1c', 51, { windows: true, tall: 100 });
      x.fillStyle = '#1a1a2a';
      x.fillRect(0, H * 0.86, W, H * 0.14);
      x.fillStyle = '#2a2a3a';
      x.fillRect(0, H * 0.86, W, 8);
      vignette(x, 0.5);
    },
  };
  DEF.festival_night = {
    paint(x) {
      sky(x, [[0, '#0a0a2a'], [0.6, '#2a1a4a'], [1, '#4a2a3a']]);
      stars(x, 90, 7, H * 0.4);
      roofs(x, H * 0.72, '#1a1024', 61, { windows: true, tall: 80 });
      const g = x.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, '#3a2430');
      g.addColorStop(1, '#1a1018');
      x.fillStyle = g;
      x.fillRect(0, H * 0.72, W, H * 0.28);
      BD._lanterns = lanternString(x, H * 0.18, H * 0.34, 14, 3).concat(lanternString(x, H * 0.4, H * 0.54, 12, 5));
      vignette(x, 0.45);
    },
    anim(x, t) {
      for (const [px, py, c] of BD._lanterns || []) paperLantern(x, px, py + Math.sin(t * 1.5 + px) * 3, c, 0.9 + Math.sin(t * 5 + px) * 0.1);
      // fireworks
      for (let k = 0; k < 3; k++) {
        const cyc = (t * 0.45 + k * 0.37) % 1;
        const cx = W * (0.2 + ((k * 0.31 + Math.floor(t * 0.45 + k * 0.37) * 0.17) % 0.6)), cy = H * (0.14 + k * 0.06);
        const col = ['#ff6a8a', '#ffd24a', '#7ad0ff'][k];
        if (cyc < 0.7) {
          const r = U.ease.outCubic(cyc / 0.7) * 110;
          x.save();
          x.globalCompositeOperation = 'lighter';
          x.globalAlpha = 1 - cyc / 0.7;
          x.fillStyle = col;
          for (let i = 0; i < 28; i++) {
            const a = (i / 28) * U.TAU;
            x.beginPath();
            x.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r + cyc * 30, 2.6, 0, U.TAU);
            x.fill();
          }
          x.restore();
        }
      }
    },
  };
  DEF.bedroom_morning = {
    paint(x) {
      sky(x, [[0, '#f6e6d0'], [1, '#e8cfb0']]);
      // window with light
      x.fillStyle = '#fff8e8';
      x.fillRect(W * 0.62, 60, 300, 260);
      x.strokeStyle = '#8a6a4a';
      x.lineWidth = 10;
      x.strokeRect(W * 0.62, 60, 300, 260);
      x.beginPath();
      x.moveTo(W * 0.62 + 150, 60);
      x.lineTo(W * 0.62 + 150, 320);
      x.stroke();
      // curtains
      x.fillStyle = 'rgba(240,200,160,0.85)';
      x.fillRect(W * 0.62 - 40, 40, 60, 320);
      x.fillRect(W * 0.62 + 280, 40, 60, 320);
      x.save();
      x.globalCompositeOperation = 'lighter';
      const g = x.createLinearGradient(W * 0.62, 60, W * 0.3, H);
      g.addColorStop(0, 'rgba(255,240,200,0.4)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(W * 0.62, 60);
      x.lineTo(W * 0.62 + 300, 320);
      x.lineTo(W * 0.5, H);
      x.lineTo(W * 0.05, H);
      x.fill();
      x.restore();
      // futon
      x.fillStyle = '#f4f0e6';
      x.fillRect(80, H * 0.62, W * 0.62, H * 0.3);
      x.fillStyle = '#9ab0d8';
      x.fillRect(80, H * 0.7, W * 0.62, H * 0.22);
      vignette(x, 0.3);
    },
    weather: 'dust',
  };
  DEF.hyuga_garden = {
    paint(x) {
      sky(x, [[0, '#8ac0e8'], [0.6, '#e0f0f4'], [1, '#c8d8b8']]);
      roofs(x, H * 0.5, '#5a5a6a', 71, { tall: 40 });
      const g = x.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, '#9ac080');
      g.addColorStop(1, '#6a9a58');
      x.fillStyle = g;
      x.fillRect(0, H * 0.5, W, H * 0.5);
      water(x, H * 0.7, '#6aa8c8', '#4a88a8');
      rocks(x, H * 0.68, 8, 3, '#7a7a80');
      bigTree(x, W * 0.14, H * 0.66, 0.6, '#4a3020', '#5a9a4a', false);
      vignette(x, 0.3);
    },
  };
  DEF.ending_dawn = {
    paint(x) {
      sky(x, [[0, '#3a4a8a'], [0.4, '#e89a8a'], [0.62, '#ffd08a'], [1, '#fff0c8']]);
      sun(x, W * 0.5, H * 0.62, 50, '#ffd070');
      monumentSilhouette(x, W * 0.5, H * 0.72, 520, '#6a4a5a', '#8a6a70');
      roofs(x, H * 0.95, '#3a2a3a', 81, { tall: 110 });
      vignette(x, 0.35);
    },
    weather: 'petals',
  };

  // ---------- public ----------
  // scenery.js extends DEF with richer painted scenes and reuses these helpers
  BD.DEF = DEF;
  BD.helpers = { sky, stars, moon, sun, ridge, treeline, roofs, monumentSilhouette, water, lanternString, paperLantern, rocks, bigTree, vignette };
  Object.defineProperty(BD, 'names', { get: () => Object.keys(DEF) });
  BD.paintStatic = function (name) {
    const cpr = NR.engine.cpr;
    const key = name + '@' + cpr;
    if (BD.cache.has(key)) return BD.cache.get(key);
    const d = DEF[name] || DEF.forest;
    const c = U.canvas(W * cpr, H * cpr);
    const x = c.getContext('2d');
    x.scale(cpr, cpr);
    d.paint(x);
    BD.cache.set(key, c);
    if (BD.cache.size > 8) BD.cache.delete(BD.cache.keys().next().value);
    return c;
  };
  BD.draw = function (ctx, name, t, o = {}) {
    const d = DEF[name] || DEF.forest;
    ctx.drawImage(BD.paintStatic(name), 0, 0, W, H);
    if (d.anim) d.anim(ctx, t || 0);
    if (d.weather) {
      BD.parts = BD.parts || new NR.fx.Particles();
      if (BD.partsFor !== name) {
        BD.parts.clear();
        BD.parts.setWeather(d.weather);
        BD.partsFor = name;
        for (let i = 0; i < 240; i++) BD.parts.update(1 / 30, { x: 0, y: 0 });
      }
      BD.parts.update(1 / 60, { x: 0, y: 0 });
      BD.parts.draw(ctx, { x: 0, y: 0 });
    }
    if (o.dim) {
      ctx.fillStyle = `rgba(0,0,0,${o.dim})`;
      ctx.fillRect(0, 0, W, H);
    }
  };
  NR.engine.on('cprchange', () => BD.cache.clear());
})();
