// Interior furniture, hot-spring pieces and dungeon props.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const TS = NR.TS;
  const PR = NR.props, H = PR.h;

  // Generic box piece seen from above/front: top face + front face.
  function box(ctx, x, y, w, h, depth, col, o = {}) {
    const front = H.rr(H.P(), x, y + depth, w, h - depth, o.r || 3);
    H.cel(ctx, front, U.shade(col, -0.12), { ox: 2, oy: 2, lw: o.lw || 1.6 });
    const top = H.rr(H.P(), x, y, w, depth + 3, o.r || 3);
    H.cel(ctx, top, o.top || U.light(col, 0.08), { ox: 1, oy: 1, lw: o.lw || 1.6 });
  }

  PR.def('bed', {
    h: 2,
    bounds: (o, w, h) => [-6, -TS * 0.5, w * TS + 12, h * TS + TS * 0.6],
    draw(ctx, o, w, h) {
      H.shadow(ctx, w / 2, h - 4, w * 0.6, 10, 0.25);
      const frame = H.rr(H.P(), 2, -TS * 0.3, w - 4, h + TS * 0.2, 6);
      H.cel(ctx, frame, o.frame || '#8a5a3a', { ox: 2, oy: 3, lw: 1.8 });
      const matt = H.rr(H.P(), 8, -TS * 0.16, w - 16, h - 6, 6);
      H.cel(ctx, matt, '#f4f0e6', { ox: 1, oy: 2, lw: 1.2 });
      const pillow = H.rr(H.P(), 14, -TS * 0.08, w - 28, 22, 8);
      H.cel(ctx, pillow, '#ffffff', { ox: 2, oy: 2, lw: 1.2 });
      const blanket = H.rr(H.P(), 8, TS * 0.45, w - 16, h - TS * 0.6, 6);
      H.cel(ctx, blanket, o.c || '#f07f1e', { ox: 2, oy: 3, lw: 1.4 });
      ctx.strokeStyle = U.rgba(U.shade(o.c || '#f07f1e', -0.35), 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, TS * 0.58);
      ctx.lineTo(w - 12, TS * 0.58);
      ctx.stroke();
      if (o.frog) {
        // Naruto's frog wallet-shaped sleeping cap on the pillow
        const f = H.ell(H.P(), w / 2 + 8, 0, 11, 8);
        H.cel(ctx, f, '#6ab04a', { ox: 1, oy: 1, lw: 1.2 });
      }
    },
  });
  PR.def('futon', {
    h: 2,
    solid: false,
    decal: true,
    draw(ctx, o, w, h) {
      const m = H.rr(H.P(), 6, 4, w - 12, h - 8, 6);
      H.cel(ctx, m, '#f4f0e6', { ox: 1, oy: 2, lw: 1.2 });
      const b = H.rr(H.P(), 6, TS * 0.5, w - 12, h - TS * 0.6, 6);
      H.cel(ctx, b, o.c || '#6a7ab8', { ox: 2, oy: 2, lw: 1.2 });
      const p = H.rr(H.P(), 12, 10, w - 24, 18, 6);
      H.cel(ctx, p, '#ffffff', { ox: 1, oy: 1, lw: 1 });
    },
  });
  PR.def('table', {
    w: 2,
    bounds: (o, w, h) => [-6, -TS * 0.3, w * TS + 12, TS * 1.3],
    draw(ctx, o, w) {
      H.shadow(ctx, w / 2, TS * 0.88, w * 0.5, 10, 0.25);
      const col = o.c || '#a8743e';
      for (const x of [10, w - 18]) {
        const l = H.rr(H.P(), x, TS * 0.3, 8, TS * 0.55, 2);
        H.cel(ctx, l, U.shade(col, -0.25), { ox: 1, oy: 0, lw: 1.2 });
      }
      box(ctx, 2, -TS * 0.12, w - 4, TS * 0.5, TS * 0.3, col);
      if (o.cups) {
        for (let i = 0; i < 5; i++) {
          const x = 16 + i * 20, y = -TS * 0.08 + (i % 2) * 8;
          const c = H.P();
          c.moveTo(x - 7, y);
          c.lineTo(x + 7, y);
          c.lineTo(x + 5, y + 14);
          c.lineTo(x - 5, y + 14);
          c.closePath();
          H.cel(ctx, c, i % 2 ? '#f4f0e6' : '#f6d24a', { ox: 1, oy: 1, lw: 1 });
          ctx.fillStyle = '#d8321e';
          ctx.fillRect(x - 6, y + 3, 12, 3);
        }
      }
      if (o.tea) {
        const t = H.ell(H.P(), w / 2, -TS * 0.02, 10, 8);
        H.cel(ctx, t, '#6a8a5a', { ox: 1, oy: 1, lw: 1.2 });
      }
      if (o.papers) {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i % 2 ? '#f6f0e0' : '#fffaf0';
          ctx.fillRect(14 + i * 34, -TS * 0.08 - i * 2, 26, 18);
        }
      }
    },
  });
  PR.def('low_table', {
    w: 2,
    bounds: (o, w) => [-8, -TS * 0.1, w * TS + 16, TS * 1.1],
    draw(ctx, o, w) {
      H.shadow(ctx, w / 2, TS * 0.8, w * 0.52, 12, 0.25);
      const top = H.ell(H.P(), w / 2, TS * 0.36, w * 0.46, TS * 0.3);
      const side = H.P();
      side.ellipse(w / 2, TS * 0.46, w * 0.46, TS * 0.3, 0, 0, Math.PI);
      side.closePath();
      H.cel(ctx, side, '#5a3a24', { ox: 0, oy: 2, lw: 1.4 });
      H.cel(ctx, top, o.c || '#8a5a3a', { ox: 2, oy: 3, lw: 1.6 });
      if (o.sake) {
        const b = H.rr(H.P(), w / 2 - 6, TS * 0.02, 12, 26, 5);
        H.cel(ctx, b, '#f2ecd8', { ox: 1, oy: 1, lw: 1.2 });
        for (const dx of [-26, 20]) {
          const c = H.ell(H.P(), w / 2 + dx, TS * 0.32, 6, 4);
          H.cel(ctx, c, '#f2ecd8', { ox: 1, oy: 1, lw: 1 });
        }
      }
      if (o.food) {
        for (const dx of [-24, 24]) {
          const b = H.ell(H.P(), w / 2 + dx, TS * 0.34, 12, 7);
          H.cel(ctx, b, '#c23a3a', { ox: 1, oy: 1, lw: 1 });
          ctx.fillStyle = '#e8b060';
          ctx.beginPath();
          ctx.ellipse(w / 2 + dx, TS * 0.32, 9, 4, 0, 0, U.TAU);
          ctx.fill();
        }
      }
    },
  });
  PR.def('cushion', {
    solid: false,
    decal: true,
    draw(ctx, o) {
      const c = H.rr(H.P(), 12, 14, TS - 24, TS - 26, 8);
      H.cel(ctx, c, o.c || '#9a4a5a', { ox: 2, oy: 2, lw: 1.2 });
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(TS / 2, TS / 2 - 2, 3, 0, U.TAU);
      ctx.fill();
    },
  });
  PR.def('chair', {
    bounds: () => [-4, -TS * 0.6, TS + 8, TS * 1.6],
    draw(ctx, o) {
      const col = o.c || '#8a5a3a';
      const back = H.rr(H.P(), 14, -TS * 0.5, TS - 28, TS * 0.7, 3);
      H.cel(ctx, back, col, { ox: 1, oy: 1, lw: 1.4 });
      box(ctx, 10, TS * 0.2, TS - 20, TS * 0.5, 10, col);
      for (const x of [14, TS - 20]) {
        const l = H.rr(H.P(), x, TS * 0.66, 6, TS * 0.22, 1);
        H.cel(ctx, l, U.shade(col, -0.2), { ox: 0, oy: 0, lw: 1 });
      }
    },
  });
  PR.def('stool', {
    solid: false,
    bounds: () => [0, 0, TS, TS],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.8, 16, 6, 0.25);
      const s = H.ell(H.P(), TS / 2, TS * 0.52, 14, 8);
      H.cel(ctx, s, o.c || '#c23a3a', { ox: 1, oy: 2, lw: 1.4 });
      const l = H.rr(H.P(), TS / 2 - 3, TS * 0.56, 6, TS * 0.26, 1);
      H.cel(ctx, l, '#4a4a50', { ox: 0, oy: 0, lw: 1 });
    },
  });
  PR.def('desk', {
    w: 3,
    bounds: (o, w) => [-8, -TS * 0.6, w * TS + 16, TS * 1.7],
    draw(ctx, o, w) {
      H.shadow(ctx, w / 2, TS * 0.9, w * 0.52, 12, 0.28);
      box(ctx, 0, -TS * 0.3, w, TS * 1.18, TS * 0.42, '#7a4a2e', { top: '#a8743e' });
      // drawers
      for (const x of [14, w - 60]) {
        const d = H.rr(H.P(), x, TS * 0.26, 46, 18, 2);
        H.cel(ctx, d, '#6a3e26', { ox: 1, oy: 1, lw: 1.2 });
      }
      // paper stacks
      for (let s = 0; s < 3; s++) {
        const x = 20 + s * 26;
        for (let i = 0; i < 4 + s; i++) {
          ctx.fillStyle = i % 2 ? '#f6f0e0' : '#fffaf0';
          ctx.fillRect(x, -TS * 0.18 - i * 4, 22, 14);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(x, -TS * 0.18 - i * 4, 22, 14);
        }
      }
      // Hokage hat
      if (o.hat !== false) {
        const brim = H.ell(H.P(), w - 44, -TS * 0.1, 26, 10);
        H.cel(ctx, brim, '#f3f1ea', { ox: 2, oy: 2, lw: 1.4 });
        const cone = H.poly(H.P(), [w - 64, -TS * 0.1, w - 44, -TS * 0.62, w - 24, -TS * 0.1]);
        H.cel(ctx, cone, '#f3f1ea', { ox: 2, oy: 2, lw: 1.4 });
        ctx.fillStyle = '#c8321e';
        ctx.beginPath();
        ctx.moveTo(w - 52, -TS * 0.3);
        ctx.lineTo(w - 36, -TS * 0.3);
        ctx.lineTo(w - 40, -TS * 0.46);
        ctx.lineTo(w - 48, -TS * 0.46);
        ctx.fill();
      }
      if (o.book) {
        const b = H.rr(H.P(), w / 2 + 8, -TS * 0.14, 30, 20, 2);
        H.cel(ctx, b, '#e87a2a', { ox: 1, oy: 1, lw: 1.2 });
        ctx.fillStyle = '#2a7a3a';
        ctx.fillRect(w / 2 + 12, -TS * 0.1, 10, 8);
      }
    },
  });
  PR.def('shelf', {
    w: 2,
    bounds: (o, w) => [-4, -TS * 1.3, w * TS + 8, TS * 2.3],
    draw(ctx, o, w) {
      const col = o.c || '#7a4a2e';
      const body = H.rr(H.P(), 2, -TS * 1.2, w - 4, TS * 2, 3);
      H.cel(ctx, body, col, { ox: 2, oy: 0, lw: 1.8 });
      const rng = U.rng((o.seed || 3) * 11);
      const kind = o.kind || 'books';
      for (let row = 0; row < 3; row++) {
        const y = -TS * 1.1 + row * TS * 0.62;
        ctx.fillStyle = U.shade(col, -0.4);
        ctx.fillRect(8, y, w - 16, TS * 0.52);
        let x = 10;
        while (x < w - 14) {
          if (kind === 'books') {
            const bw = 6 + rng() * 8, bh = TS * (0.32 + rng() * 0.16);
            ctx.fillStyle = U.pick(['#c23a3a', '#3a6ea5', '#6a8452', '#e0a030', '#8a4a9a', '#e8dcc0']);
            ctx.fillRect(x, y + TS * 0.5 - bh, bw, bh);
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(x + 1, y + TS * 0.5 - bh + 3, bw - 2, 2);
            x += bw + 1.5;
          } else if (kind === 'scrolls') {
            const r = 6;
            ctx.fillStyle = U.pick(['#e8dcc0', '#f2e6c8', '#d9c9a0']);
            ctx.beginPath();
            ctx.arc(x + r, y + TS * 0.5 - r, r, 0, U.TAU);
            ctx.fill();
            ctx.fillStyle = '#8a3a2a';
            ctx.beginPath();
            ctx.arc(x + r, y + TS * 0.5 - r, 2, 0, U.TAU);
            ctx.fill();
            x += r * 2 + 2;
          } else if (kind === 'jars') {
            const jw = 14;
            const j = H.rr(H.P(), x, y + TS * 0.2, jw, TS * 0.3, 5);
            H.cel(ctx, j, U.pick(['#9ac8a0', '#c8a0d0', '#e0c080', '#a0c0e0']), { ox: 1, oy: 1, lw: 1 });
            x += jw + 4;
          }
        }
        ctx.fillStyle = U.light(col, 0.1);
        ctx.fillRect(4, y + TS * 0.52, w - 8, 5);
      }
    },
  });
  PR.def('cabinet', {
    bounds: () => [-4, -TS * 0.7, TS + 8, TS * 1.7],
    draw(ctx, o) {
      box(ctx, 4, -TS * 0.5, TS - 8, TS * 1.36, 14, o.c || '#8a5a3a');
      for (const y of [-TS * 0.1, TS * 0.36]) {
        ctx.fillStyle = '#c9a24a';
        ctx.beginPath();
        ctx.arc(TS / 2, y + 8, 2.5, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(10, y, TS - 20, TS * 0.38);
      }
      if (o.plant) {
        H.canopy(ctx, TS / 2, -TS * 0.72, 14, '#4f9a42', 5, { lobes: 5, dots: 3 });
      }
    },
  });
  PR.def('plant', {
    bounds: () => [-TS * 0.2, -TS * 1.1, TS * 1.4, TS * 2.1],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 20, 7, 0.28);
      const pot = H.P();
      pot.moveTo(TS / 2 - 16, TS * 0.36);
      pot.lineTo(TS / 2 + 16, TS * 0.36);
      pot.lineTo(TS / 2 + 12, TS * 0.84);
      pot.lineTo(TS / 2 - 12, TS * 0.84);
      pot.closePath();
      H.cel(ctx, pot, o.pot || '#c0643a', { ox: 2, oy: 1, lw: 1.4 });
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.38;
        const l = H.P();
        const tx = TS / 2 + Math.cos(a) * 34, ty = TS * 0.36 + Math.sin(a) * 46;
        l.moveTo(TS / 2, TS * 0.36);
        l.quadraticCurveTo(TS / 2 + Math.cos(a - 0.3) * 30, TS * 0.36 + Math.sin(a - 0.3) * 30, tx, ty);
        l.quadraticCurveTo(TS / 2 + Math.cos(a + 0.3) * 30, TS * 0.36 + Math.sin(a + 0.3) * 30, TS / 2, TS * 0.36);
        H.cel(ctx, l, i % 2 ? '#4f9a42' : '#5aaa4a', { ox: 1, oy: 1, lw: 1.2 });
      }
    },
  });
  PR.def('counter', {
    w: 3,
    bounds: (o, w) => [-6, -TS * 0.4, w * TS + 12, TS * 1.4],
    draw(ctx, o, w) {
      box(ctx, 0, -TS * 0.2, w, TS * 1.05, TS * 0.34, o.c || '#9a6a3e', { top: o.top || '#c8945a' });
      if (o.register) {
        const r = H.rr(H.P(), w - 50, -TS * 0.36, 34, 22, 3);
        H.cel(ctx, r, '#6a6a74', { ox: 1, oy: 1, lw: 1.2 });
      }
      if (o.flowers) {
        for (let i = 0; i < 4; i++) {
          const x = 20 + i * 26;
          ctx.fillStyle = U.pick(['#ff7aa8', '#ffd24a', '#b58cff', '#ff6a5a', '#ffffff']);
          for (let k = 0; k < 5; k++) {
            ctx.beginPath();
            ctx.arc(x + (k - 2) * 4, -TS * 0.2 - 6 - (k % 2) * 5, 4, 0, U.TAU);
            ctx.fill();
          }
        }
      }
    },
  });
  PR.def('flowershelf', {
    w: 2,
    bounds: (o, w) => [-6, -TS * 0.9, w * TS + 12, TS * 1.9],
    draw(ctx, o, w) {
      const col = '#8a5a3a';
      box(ctx, 0, TS * 0.2, w, TS * 0.66, 12, col);
      const tier = H.rr(H.P(), 6, -TS * 0.3, w - 12, TS * 0.5, 3);
      H.cel(ctx, tier, U.shade(col, -0.1), { ox: 1, oy: 2, lw: 1.4 });
      const rng = U.rng((o.seed || 1) * 19);
      for (const [y, n] of [[-TS * 0.32, 5], [TS * 0.18, 6]]) {
        for (let i = 0; i < n; i++) {
          const x = 14 + i * ((w - 28) / (n - 1));
          const b = H.rr(H.P(), x - 9, y, 18, 18, 3);
          H.cel(ctx, b, '#6a7a8a', { ox: 1, oy: 1, lw: 1 });
          const fc = U.pick(['#ff7aa8', '#ffd24a', '#b58cff', '#ff6a5a', '#ffffff', '#ff9a4a']);
          for (let k = 0; k < 6; k++) {
            ctx.fillStyle = k < 2 ? '#4f9a42' : fc;
            ctx.beginPath();
            ctx.arc(x + (rng() - 0.5) * 16, y - 6 - rng() * 12, k < 2 ? 5 : 4, 0, U.TAU);
            ctx.fill();
          }
        }
      }
    },
  });
  PR.def('hbed', {
    h: 2,
    bounds: (o, w, h) => [-6, -TS * 0.5, w * TS + 12, h * TS + TS * 0.6],
    draw(ctx, o, w, h) {
      H.shadow(ctx, w / 2, h - 4, w * 0.6, 10, 0.25);
      const frame = H.rr(H.P(), 4, -TS * 0.3, w - 8, h + TS * 0.2, 5);
      H.cel(ctx, frame, '#c9ced6', { ox: 2, oy: 3, lw: 1.6 });
      const matt = H.rr(H.P(), 9, -TS * 0.2, w - 18, h - 4, 5);
      H.cel(ctx, matt, '#ffffff', { ox: 1, oy: 2, lw: 1.2 });
      const b = H.rr(H.P(), 9, TS * 0.5, w - 18, h - TS * 0.62, 5);
      H.cel(ctx, b, o.c || '#bcd6ea', { ox: 2, oy: 2, lw: 1.2 });
      const p = H.rr(H.P(), 14, -TS * 0.1, w - 28, 20, 7);
      H.cel(ctx, p, '#ffffff', { ox: 1, oy: 1, lw: 1 });
    },
  });
  PR.def('curtain', {
    bounds: () => [-4, -TS * 1.3, TS + 8, TS * 2.3],
    draw(ctx, o) {
      ctx.fillStyle = '#8a929c';
      ctx.fillRect(0, -TS * 1.2, TS, 4);
      const c = H.P();
      c.moveTo(2, -TS * 1.16);
      for (let i = 0; i <= 6; i++) c.lineTo(2 + i * ((TS - 4) / 6), -TS * 1.16 + (i % 2) * 3);
      c.lineTo(TS - 2, TS * 0.8);
      for (let i = 6; i >= 0; i--) c.lineTo(2 + i * ((TS - 4) / 6), TS * 0.8 + (i % 2) * 5);
      c.closePath();
      H.cel(ctx, c, o.c || '#a8d0c8', { ox: 3, oy: 0, lw: 1.4 });
      ctx.strokeStyle = 'rgba(40,80,70,0.3)';
      ctx.lineWidth = 1.4;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(2 + i * ((TS - 4) / 6), -TS * 1.1);
        ctx.lineTo(2 + i * ((TS - 4) / 6), TS * 0.8);
        ctx.stroke();
      }
    },
  });
  PR.def('kitchen', {
    w: 2,
    bounds: (o, w) => [-6, -TS * 0.8, w * TS + 12, TS * 1.8],
    draw(ctx, o, w) {
      box(ctx, 0, -TS * 0.3, w, TS * 1.16, TS * 0.4, '#9aa2ac', { top: '#d0d6de' });
      for (const x of [22, 58]) {
        ctx.strokeStyle = '#2a2a30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, -TS * 0.12, 12, 6, 0, 0, U.TAU);
        ctx.stroke();
      }
      const pot = H.rr(H.P(), 10, -TS * 0.62, 26, 22, 5);
      H.cel(ctx, pot, '#5a5a64', { ox: 1, oy: 1, lw: 1.2 });
      const sink = H.rr(H.P(), w - 52, -TS * 0.22, 40, 18, 4);
      H.flat(ctx, sink, '#7a8a9a', 1.4);
      ctx.strokeStyle = '#8a8a90';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w - 32, -TS * 0.22);
      ctx.lineTo(w - 32, -TS * 0.5);
      ctx.lineTo(w - 22, -TS * 0.5);
      ctx.stroke();
    },
  });
  PR.def('weaponrack', {
    w: 2,
    bounds: (o, w) => [-6, -TS * 1.4, w * TS + 12, TS * 2.4],
    draw(ctx, o, w) {
      const frame = H.rr(H.P(), 4, -TS * 1.2, w - 8, TS * 1.9, 3);
      H.cel(ctx, frame, '#6a4a2e', { ox: 2, oy: 0, lw: 1.6 });
      ctx.fillStyle = '#3a281a';
      ctx.fillRect(10, -TS * 1.1, w - 20, TS * 1.66);
      // katanas, spears, kunai
      const items = 6;
      for (let i = 0; i < items; i++) {
        const x = 18 + i * ((w - 36) / (items - 1));
        ctx.strokeStyle = i % 3 === 0 ? '#d9dee6' : i % 3 === 1 ? '#b0b8c4' : '#e6e9ef';
        ctx.lineWidth = i % 3 === 1 ? 3 : 4;
        ctx.beginPath();
        ctx.moveTo(x, -TS * 1.0);
        ctx.lineTo(x, TS * 0.4);
        ctx.stroke();
        ctx.fillStyle = i % 2 ? '#8a3a2a' : '#2a2a3a';
        ctx.fillRect(x - 3, TS * 0.2, 6, 20);
        if (i % 3 === 1) {
          ctx.fillStyle = '#d9dee6';
          ctx.beginPath();
          ctx.moveTo(x - 6, -TS * 0.95);
          ctx.lineTo(x, -TS * 1.15);
          ctx.lineTo(x + 6, -TS * 0.95);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(6, TS * 0.1, w - 12, 8);
    },
  });
  PR.def('screen', {
    w: 2,
    bounds: (o, w) => [-4, -TS * 1.2, w * TS + 8, TS * 2.2],
    draw(ctx, o, w) {
      for (let i = 0; i < 4; i++) {
        const x = i * (w / 4);
        const p = H.P();
        p.moveTo(x + 2, -TS * 1.05 + (i % 2) * 6);
        p.lineTo(x + w / 4 - 2, -TS * 1.05 + ((i + 1) % 2) * 6);
        p.lineTo(x + w / 4 - 2, TS * 0.84 + ((i + 1) % 2) * 4);
        p.lineTo(x + 2, TS * 0.84 + (i % 2) * 4);
        p.closePath();
        H.cel(ctx, p, '#f4ead0', { ox: 2, oy: 0, lw: 1.6, lineColor: '#3a2416' });
      }
      // painted branch
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, TS * 0.2);
      ctx.quadraticCurveTo(w * 0.4, -TS * 0.5, w - 10, -TS * 0.6);
      ctx.stroke();
      ctx.fillStyle = o.c || '#f4a9c4';
      const rng = U.rng(12);
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.arc(20 + rng() * (w - 40), -TS * 0.7 + rng() * TS * 0.8, 3 + rng() * 2, 0, U.TAU);
        ctx.fill();
      }
    },
  });
  PR.def('fridge', {
    bounds: () => [-4, -TS * 1.1, TS + 8, TS * 2.1],
    draw(ctx) {
      box(ctx, 6, -TS * 1.0, TS - 12, TS * 1.86, 10, '#e6e9ee');
      ctx.fillStyle = '#9aa2ac';
      ctx.fillRect(TS - 18, -TS * 0.6, 4, 20);
      ctx.fillRect(TS - 18, TS * 0.1, 4, 20);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(8, -TS * 0.2, TS - 16, 2);
      ctx.fillStyle = '#f07f1e';
      ctx.fillRect(16, -TS * 0.8, 14, 10);
    },
  });

  // ----- wall decorations (decals over wall tiles) -----
  PR.def('window_in', {
    solid: false,
    decal: true,
    draw(ctx, o) {
      const x = 8, y = 10, w = TS - 16, h = TS - 30;
      const f = H.rr(H.P(), x - 3, y - 3, w + 6, h + 6, 3);
      H.cel(ctx, f, '#6a4a2e', { ox: 1, oy: 1, lw: 1.2 });
      const night = o.night;
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, night ? '#1a2240' : '#9ad4f4');
      g.addColorStop(1, night ? '#2a3460' : '#d4f0ff');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x + 4, y + 4, 6, h - 8);
      ctx.strokeStyle = '#6a4a2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w / 2, y + h);
      ctx.stroke();
    },
  });
  PR.def('scroll_hang', {
    solid: false,
    decal: true,
    draw(ctx, o) {
      ctx.fillStyle = '#6a4a2e';
      ctx.fillRect(TS / 2 - 14, 6, 28, 4);
      const s = H.rr(H.P(), TS / 2 - 11, 9, 22, TS - 24, 2);
      H.cel(ctx, s, '#f4ead0', { ox: 1, oy: 1, lw: 1 });
      ctx.fillStyle = '#2a2a2a';
      ctx.font = 'bold 12px serif';
      ctx.textAlign = 'center';
      if (o.text) {
        for (let i = 0; i < o.text.length; i++) ctx.fillText(o.text[i], TS / 2, 24 + i * 12);
      } else {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(TS / 2 - 4, 18);
        ctx.lineTo(TS / 2 + 3, 26);
        ctx.moveTo(TS / 2, 30);
        ctx.lineTo(TS / 2 - 3, 38);
        ctx.stroke();
      }
      ctx.fillStyle = '#6a4a2e';
      ctx.fillRect(TS / 2 - 13, TS - 16, 26, 4);
    },
  });
  PR.def('poster', {
    solid: false,
    decal: true,
    draw(ctx, o) {
      const p = H.rr(H.P(), 10, 8, TS - 20, TS - 22, 2);
      H.cel(ctx, p, o.c || '#f07f1e', { ox: 1, oy: 1, lw: 1.2 });
      if (o.kind === 'hokage') {
        H.fireKanji(ctx, TS / 2, TS / 2 - 6, 22, '#fff');
      } else {
        H.leafMark(ctx, TS / 2, TS / 2 - 6, 9, '#fff', 3);
      }
    },
  });
  PR.def('frames', {
    // row of framed portraits along the wall (previous Hokage)
    solid: false,
    decal: true,
    draw(ctx, o, w) {
      const n = o.n || 5;
      for (let i = 0; i < n; i++) {
        const fw = 34, x = (w / n) * (i + 0.5) - fw / 2;
        const f = H.rr(H.P(), x, 8, fw, 40, 3);
        H.cel(ctx, f, '#8a6a3a', { ox: 1, oy: 1, lw: 1.2 });
        ctx.fillStyle = '#e6dcc4';
        ctx.fillRect(x + 4, 12, fw - 8, 32);
        const hair = ['#e8e6e0', '#d9dde4', '#8a8a8a', '#f5c93a', '#f1d27b', '#d8dde4'][i % 6];
        ctx.fillStyle = hair;
        ctx.beginPath();
        ctx.arc(x + fw / 2, 26, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#f2d6bd';
        ctx.beginPath();
        ctx.arc(x + fw / 2, 29, 7, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = '#f3f1ea';
        ctx.fillRect(x + 8, 36, fw - 16, 8);
      }
    },
  });
  PR.def('rug', {
    solid: false,
    decal: true,
    draw(ctx, o, w, h) {
      const r = H.rr(H.P(), 6, 6, w - 12, h - 12, 8);
      H.cel(ctx, r, o.c || '#9a4a3a', { ox: 2, oy: 2, lw: 1.4 });
      const inner = H.rr(H.P(), 14, 14, w - 28, h - 28, 6);
      ctx.strokeStyle = o.c2 || '#e8c070';
      ctx.lineWidth = 3;
      ctx.stroke(inner);
      if (o.mark === 'leaf') H.leafMark(ctx, w / 2, h / 2, Math.min(w, h) * 0.14, o.c2 || '#e8c070', 4);
    },
  });
  PR.def('exit', {
    // door mat + light spill marking a room exit
    solid: false,
    decal: true,
    draw(ctx, o, w, h) {
      const g = ctx.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, 'rgba(255,240,200,0.55)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g;
      ctx.fillRect(4, 0, w - 8, h);
      const m = H.rr(H.P(), 10, h - 22, w - 20, 16, 4);
      H.cel(ctx, m, '#8a6a4a', { ox: 1, oy: 1, lw: 1 });
    },
  });

  // ----- hot spring -----
  PR.def('onsen_rock', {
    bounds: () => [-TS * 0.2, -TS * 0.4, TS * 1.4, TS * 1.4],
    draw(ctx, o) {
      const rng = U.rng((o.seed || 1) * 23);
      for (let i = 0; i < 3; i++) {
        const cx = 14 + rng() * 36, cy = 26 + rng() * 24, r = 14 + rng() * 10;
        const p = H.P();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * U.TAU;
          const rr = r * (0.8 + rng() * 0.3);
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.7;
          k ? p.lineTo(x, y) : p.moveTo(x, y);
        }
        p.closePath();
        H.cel(ctx, p, U.shade('#8f8a86', (rng() - 0.5) * 0.2), { ox: 4, oy: 5, lw: 1.6 });
      }
    },
  });
  PR.def('bamboo_fence', {
    bounds: (o, w, h) => [-4, -TS * 1.6, w * TS + 8, h * TS + TS * 1.7],
    draw(ctx, o, w) {
      const n = Math.round(w / 9);
      for (let i = 0; i < n; i++) {
        const x = i * 9 + 1;
        const g = ctx.createLinearGradient(x, 0, x + 8, 0);
        g.addColorStop(0, '#c8b070');
        g.addColorStop(1, '#8a7440');
        ctx.fillStyle = g;
        ctx.fillRect(x, -TS * 1.5 + (i % 3) * 3, 8, TS * 2.35 - (i % 3) * 3);
        ctx.fillStyle = 'rgba(80,60,20,0.6)';
        ctx.fillRect(x, -TS * 0.9, 8, 2);
        ctx.fillRect(x, TS * 0.1, 8, 2);
      }
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(0, -TS * 1.0, w, 6);
      ctx.fillRect(0, TS * 0.05, w, 6);
    },
  });
  PR.def('bucket', {
    solid: false,
    bounds: () => [0, 0, TS, TS],
    draw(ctx) {
      for (const [x, y] of [[20, 40], [40, 36], [30, 26]]) {
        const b = H.P();
        b.moveTo(x - 10, y - 10);
        b.lineTo(x + 10, y - 10);
        b.lineTo(x + 8, y + 6);
        b.lineTo(x - 8, y + 6);
        b.closePath();
        H.cel(ctx, b, '#c8945a', { ox: 1, oy: 1, lw: 1.2 });
        ctx.fillStyle = '#6a4a2e';
        ctx.fillRect(x - 10, y - 4, 20, 2.5);
      }
    },
  });

  // ----- dungeon -----
  PR.def('stalagmite', {
    bounds: () => [-TS * 0.1, -TS * 1.1, TS * 1.2, TS * 2.1],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.86, 24, 8, 0.35);
      const col = o.c || '#7a706a';
      const p = H.P();
      p.moveTo(TS * 0.14, TS * 0.84);
      p.quadraticCurveTo(TS * 0.3, TS * 0.1, TS * 0.46, -TS * 0.9);
      p.quadraticCurveTo(TS * 0.62, TS * 0.1, TS * 0.86, TS * 0.84);
      p.closePath();
      H.cel(ctx, p, col, { ox: 5, oy: 0, lw: 1.8 });
      const p2 = H.P();
      p2.moveTo(TS * 0.6, TS * 0.84);
      p2.quadraticCurveTo(TS * 0.7, TS * 0.4, TS * 0.76, -TS * 0.1);
      p2.quadraticCurveTo(TS * 0.84, TS * 0.4, TS * 0.96, TS * 0.84);
      p2.closePath();
      H.cel(ctx, p2, U.shade(col, -0.1), { ox: 3, oy: 0, lw: 1.6 });
    },
  });
  PR.def('crystal', {
    bounds: () => [-TS * 0.2, -TS * 1.0, TS * 1.4, TS * 2],
    draw(ctx, o) {
      const col = o.c || '#7ad0ff';
      H.shadow(ctx, TS / 2, TS * 0.86, 24, 8, 0.3);
      const shards = [[TS * 0.5, -TS * 0.8, 12], [TS * 0.26, -TS * 0.3, 9], [TS * 0.74, -TS * 0.4, 10], [TS * 0.42, TS * 0.1, 8]];
      for (const [x, top, w] of shards) {
        const p = H.poly(H.P(), [x - w, TS * 0.8, x - w * 0.8, top + 18, x, top, x + w * 0.8, top + 18, x + w, TS * 0.8]);
        H.cel(ctx, p, col, { ox: 4, oy: 0, lw: 1.6 });
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(x - 2, top + 8);
        ctx.lineTo(x - w * 0.5, TS * 0.6);
        ctx.lineTo(x - w * 0.2, TS * 0.6);
        ctx.fill();
      }
    },
    light: (o) => ({ x: TS / 2, y: -TS * 0.2, r: 150, color: o.c || '#7ad0ff', a: 0.9 }),
  });
  PR.def('torch', {
    animated: true,
    draw(ctx, o, w, h, inst, time = 0) {
      const post = H.rr(H.P(), TS / 2 - 4, -TS * 0.4, 8, TS * 1.2, 2);
      H.cel(ctx, post, '#5a3a24', { ox: 1, oy: 0, lw: 1.4 });
      const cup = H.P();
      cup.moveTo(TS / 2 - 12, -TS * 0.44);
      cup.lineTo(TS / 2 + 12, -TS * 0.44);
      cup.lineTo(TS / 2 + 6, -TS * 0.26);
      cup.lineTo(TS / 2 - 6, -TS * 0.26);
      cup.closePath();
      H.cel(ctx, cup, '#4a4a50', { ox: 1, oy: 1, lw: 1.4 });
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const ph = time * 8 + i * 2.1;
        const fh = 22 + Math.sin(ph) * 6;
        const fx = TS / 2 + Math.sin(ph * 1.3) * 3;
        const g = ctx.createLinearGradient(0, -TS * 0.44, 0, -TS * 0.44 - fh);
        g.addColorStop(0, 'rgba(255,210,80,0.95)');
        g.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(fx - 9, -TS * 0.44);
        ctx.quadraticCurveTo(fx - 6, -TS * 0.44 - fh * 0.6, fx, -TS * 0.44 - fh);
        ctx.quadraticCurveTo(fx + 6, -TS * 0.44 - fh * 0.6, fx + 9, -TS * 0.44);
        ctx.fill();
      }
      ctx.restore();
    },
    light: () => ({ x: TS / 2, y: -TS * 0.6, r: 190, color: '#ffa040', a: 1, flicker: true }),
  });
  PR.def('seal', {
    // glowing seal circle drawn on the floor; o.c color, o.r radius tiles, o.off to hide
    solid: false,
    animated: true,
    sortOffset: -1000,
    draw(ctx, o, w, h, inst, time = 0) {
      // o.flag hides the seal once set; with o.invert it only shows after the flag is set
      const set = o.flag && NR.game && NR.game.flag(o.flag);
      if (o.invert ? !set : set) return;
      const cx = w / 2, cy = h / 2, r = (o.r || 1) * TS * 0.9;
      const col = o.c || '#b58cff';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.55 + Math.sin(time * 2.4) * 0.25;
      ctx.strokeStyle = U.rgba(col, pulse);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, U.TAU);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.72, r * 0.43, 0, 0, U.TAU);
      ctx.stroke();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.6);
      ctx.rotate(time * 0.5);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * U.TAU;
        ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
        ctx.lineTo(Math.cos(a + 0.4) * r, Math.sin(a + 0.4) * r);
      }
      ctx.stroke();
      // spiral core
      ctx.beginPath();
      for (let a = 0; a < 5 * Math.PI; a += 0.2) {
        const rr = a * r * 0.035;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    },
    light: (o, w, h) => ({ x: w / 2, y: h / 2, r: 150 * (o.r || 1), color: o.c || '#b58cff', a: 0.8 }),
  });
  PR.def('chest', {
    bounds: () => [-4, -TS * 0.3, TS + 8, TS * 1.3],
    stateKey: (inst) => (NR.game && NR.game.flag(inst.o.flag) ? 'open' : 'closed'),
    draw(ctx, o, w, h, inst) {
      const open = NR.game && NR.game.flag(o.flag);
      H.shadow(ctx, TS / 2, TS * 0.86, 26, 8, 0.3);
      const col = o.c || '#9a5a2a';
      box(ctx, 8, TS * 0.24, TS - 16, TS * 0.62, 6, col);
      if (open) {
        const lid = H.rr(H.P(), 8, -TS * 0.14, TS - 16, TS * 0.36, 4);
        H.cel(ctx, lid, U.shade(col, -0.15), { ox: 1, oy: 1, lw: 1.4 });
        ctx.fillStyle = '#1a1210';
        ctx.fillRect(12, TS * 0.24, TS - 24, 8);
      } else {
        const lid = H.rr(H.P(), 6, TS * 0.04, TS - 12, TS * 0.3, 8);
        H.cel(ctx, lid, U.light(col, 0.08), { ox: 1, oy: 2, lw: 1.4 });
        ctx.fillStyle = '#e8c04a';
        ctx.fillRect(TS / 2 - 5, TS * 0.26, 10, 12);
      }
      ctx.strokeStyle = '#e8c04a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(14, TS * 0.3);
      ctx.lineTo(14, TS * 0.84);
      ctx.moveTo(TS - 14, TS * 0.3);
      ctx.lineTo(TS - 14, TS * 0.84);
      ctx.stroke();
    },
  });
  PR.def('pillar', {
    bounds: () => [-TS * 0.1, -TS * 2.2, TS * 1.2, TS * 3.2],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.88, 30, 10, 0.34);
      const col = o.c || '#a4a8ae';
      const h = o.broken ? TS * 1.1 : TS * 2.8;
      const shaft = H.P();
      shaft.moveTo(TS * 0.2, TS * 0.84);
      shaft.lineTo(TS * 0.24, TS * 0.84 - h);
      if (o.broken) {
        shaft.lineTo(TS * 0.4, TS * 0.84 - h - 10);
        shaft.lineTo(TS * 0.55, TS * 0.84 - h + 4);
        shaft.lineTo(TS * 0.7, TS * 0.84 - h - 6);
      }
      shaft.lineTo(TS * 0.76, TS * 0.84 - h);
      shaft.lineTo(TS * 0.8, TS * 0.84);
      shaft.closePath();
      H.cel(ctx, shaft, col, { ox: 5, oy: 0, lw: 1.8 });
      ctx.strokeStyle = U.rgba(U.shade(col, -0.35), 0.5);
      ctx.lineWidth = 1.6;
      for (const x of [0.36, 0.5, 0.64]) {
        ctx.beginPath();
        ctx.moveTo(TS * x, TS * 0.8);
        ctx.lineTo(TS * x, TS * 0.84 - h + 8);
        ctx.stroke();
      }
      const base = H.rr(H.P(), TS * 0.08, TS * 0.66, TS * 0.84, 18, 3);
      H.cel(ctx, base, U.shade(col, -0.08), { ox: 2, oy: 2, lw: 1.4 });
      if (!o.broken) {
        const cap = H.rr(H.P(), TS * 0.08, TS * 0.84 - h - 12, TS * 0.84, 18, 3);
        H.cel(ctx, cap, U.shade(col, -0.05), { ox: 2, oy: 2, lw: 1.4 });
        if (o.spiral) {
          ctx.strokeStyle = '#c8321e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let a = 0; a < 5 * Math.PI; a += 0.25) {
            const r = a * 0.9;
            const x = TS / 2 + Math.cos(a) * r, y = TS * 0.84 - h * 0.6 + Math.sin(a) * r;
            a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      if (o.moss) {
        ctx.fillStyle = 'rgba(90,150,60,0.75)';
        ctx.beginPath();
        ctx.ellipse(TS * 0.36, TS * 0.84 - h * 0.3, 8, 14, 0.3, 0, U.TAU);
        ctx.fill();
      }
    },
  });
  PR.def('statue', {
    bounds: () => [-TS * 0.3, -TS * 2.2, TS * 1.6, TS * 3.2],
    draw(ctx, o) {
      H.shadow(ctx, TS / 2, TS * 0.88, 32, 10, 0.34);
      const col = o.c || '#9a9ea4';
      const base = H.rr(H.P(), 2, TS * 0.36, TS - 4, TS * 0.52, 3);
      H.cel(ctx, base, U.shade(col, -0.12), { ox: 2, oy: 2, lw: 1.6 });
      const body = H.P();
      body.moveTo(TS * 0.2, TS * 0.38);
      body.quadraticCurveTo(TS * 0.1, -TS * 0.6, TS * 0.34, -TS * 0.9);
      body.lineTo(TS * 0.66, -TS * 0.9);
      body.quadraticCurveTo(TS * 0.9, -TS * 0.6, TS * 0.8, TS * 0.38);
      body.closePath();
      H.cel(ctx, body, col, { ox: 4, oy: 3, lw: 1.8 });
      const head = H.ell(H.P(), TS / 2, -TS * 1.2, 16, 18);
      H.cel(ctx, head, col, { ox: 3, oy: 3, lw: 1.8 });
      ctx.strokeStyle = U.shade(col, -0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TS * 0.3, -TS * 0.4);
      ctx.lineTo(TS * 0.5, -TS * 0.1);
      ctx.lineTo(TS * 0.7, -TS * 0.4);
      ctx.stroke();
    },
  });
  PR.def('altar', {
    w: 2,
    bounds: (o, w) => [-6, -TS * 0.8, w * TS + 12, TS * 1.8],
    draw(ctx, o, w) {
      H.shadow(ctx, w / 2, TS * 0.88, w * 0.55, 12, 0.34);
      box(ctx, 0, -TS * 0.3, w, TS * 1.16, TS * 0.4, o.c || '#8a8e96');
      ctx.fillStyle = '#c8321e';
      ctx.beginPath();
      for (let a = 0; a < 5 * Math.PI; a += 0.25) {
        const r = a * 1.4;
        const x = w / 2 + Math.cos(a) * r, y = TS * 0.4 + Math.sin(a) * r * 0.8;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#c8321e';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (o.scroll) {
        const s = H.rr(H.P(), w / 2 - 22, -TS * 0.4, 44, 16, 7);
        H.cel(ctx, s, '#e8dcc0', { ox: 1, oy: 1, lw: 1.2 });
      }
    },
  });
  PR.def('spiral', {
    solid: false,
    decal: true,
    draw(ctx, o, w, h) {
      ctx.strokeStyle = o.c || 'rgba(200,50,30,0.55)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const r0 = Math.min(w, h) * 0.46;
      for (let a = 0; a < 6 * Math.PI; a += 0.12) {
        const r = (a / (6 * Math.PI)) * r0;
        const x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r0 + 6, 0, U.TAU);
      ctx.stroke();
    },
  });
  PR.def('rubble', {
    solid: false,
    decal: true,
    draw(ctx, o, w, h) {
      const rng = U.rng((o.seed || 5) * 29 + w);
      for (let i = 0; i < (w * h) / 500; i++) {
        const x = rng() * w, y = rng() * h, r = 3 + rng() * 6;
        ctx.fillStyle = U.shade(o.c || '#8a8580', (rng() - 0.5) * 0.3);
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.7, rng() * 3, 0, U.TAU);
        ctx.fill();
      }
    },
  });
  PR.def('labtable', {
    w: 2,
    bounds: (o, w) => [-6, -TS * 0.6, w * TS + 12, TS * 1.6],
    draw(ctx, o, w) {
      box(ctx, 0, -TS * 0.2, w, TS * 1.06, TS * 0.36, '#6a6e78', { top: '#9aa0aa' });
      const cols = ['#7ad07a', '#b58cff', '#ff7a7a', '#7ad0ff'];
      for (let i = 0; i < 5; i++) {
        const x = 16 + i * 22;
        const v = H.rr(H.P(), x - 5, -TS * 0.48, 10, 24, 4);
        H.cel(ctx, v, U.rgba('#e8f0f4', 0.9), { ox: 1, oy: 1, lw: 1 });
        ctx.fillStyle = cols[i % 4];
        ctx.fillRect(x - 4, -TS * 0.3, 8, 10);
      }
    },
    light: () => ({ x: TS, y: -TS * 0.2, r: 90, color: '#9aff9a', a: 0.4 }),
  });
  // Glowing seal wall that blocks a passage until its condition hides it (o.if).
  PR.def('barrier', {
    animated: true,
    draw(ctx, o, w, h, inst, time = 0) {
      const col = o.c || '#b58cff';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, -TS, 0, h);
      g.addColorStop(0, U.rgba(col, 0));
      g.addColorStop(0.5, U.rgba(col, 0.35 + Math.sin(time * 3) * 0.1));
      g.addColorStop(1, U.rgba(col, 0.15));
      ctx.fillStyle = g;
      ctx.fillRect(0, -TS * 1.2, w, h + TS * 1.2);
      ctx.strokeStyle = U.rgba(col, 0.8);
      ctx.lineWidth = 2;
      for (let i = 0; i < w / 20; i++) {
        const x = (i * 20 + time * 30) % w;
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + 10, -TS);
        ctx.stroke();
      }
      ctx.lineWidth = 3;
      for (let k = 0; k < w / TS; k++) {
        const cx = k * TS + TS / 2, cy = h / 2 - TS * 0.3;
        ctx.beginPath();
        for (let a = 0; a < 4 * Math.PI; a += 0.3) {
          const r = a * 2.2;
          const px = cx + Math.cos(a + time) * r, py = cy + Math.sin(a + time) * r;
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    },
    light: (o) => ({ x: TS / 2, y: 0, r: 140, color: o.c || '#b58cff', a: 0.7 }),
  });
  // Noren curtain hanging in a doorway (walkable).
  PR.def('noren_door', {
    solid: false,
    decal: true,
    draw(ctx, o) {
      ctx.fillStyle = '#2a1a14';
      ctx.fillRect(2, 0, TS - 4, TS);
      ctx.fillStyle = '#4a3226';
      ctx.fillRect(0, 0, 5, TS);
      ctx.fillRect(TS - 5, 0, 5, TS);
      for (let i = 0; i < 2; i++) {
        const p = H.P();
        const x = 6 + i * ((TS - 12) / 2);
        p.moveTo(x, 4);
        p.lineTo(x + (TS - 12) / 2 - 2, 4);
        p.lineTo(x + (TS - 12) / 2 - 2, TS * 0.62);
        p.lineTo(x, TS * 0.62);
        p.closePath();
        H.cel(ctx, p, o.c || '#2f4f7a', { ox: 1, oy: 2, lw: 1.2 });
      }
      if (o.mark === 'onsen') H.onsenMark(ctx, TS / 2, TS * 0.3, 18, '#f4efe6');
      else if (o.text) H.text(ctx, o.text, TS / 2, TS * 0.3, 11, '#f4efe6');
    },
  });
  // The Academy swing tree.
  PR.def('swing', {
    w: 2,
    bounds: () => [-TS * 0.9, -TS * 2.8, TS * 3.8, TS * 3.8],
    draw(ctx) {
      H.shadow(ctx, TS * 0.5, TS * 0.9, 50, 14, 0.32);
      H.trunk(ctx, TS * 0.5, TS * 0.92, 24, 90, '#7a5236');
      const b = H.P();
      b.moveTo(TS * 0.5, -TS * 0.3);
      b.quadraticCurveTo(TS * 1.2, -TS * 0.7, TS * 1.9, -TS * 0.55);
      b.lineTo(TS * 1.9, -TS * 0.42);
      b.quadraticCurveTo(TS * 1.2, -TS * 0.55, TS * 0.5, -TS * 0.12);
      b.closePath();
      H.cel(ctx, b, '#7a5236', { ox: 1, oy: 2, lw: 1.4 });
      H.canopy(ctx, TS * 0.7, -TS * 1.4, 70, '#5aa64a', 41, { dots: 18 });
      ctx.strokeStyle = '#5a4a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TS * 1.5, -TS * 0.5);
      ctx.lineTo(TS * 1.5, TS * 0.4);
      ctx.moveTo(TS * 1.8, -TS * 0.48);
      ctx.lineTo(TS * 1.8, TS * 0.4);
      ctx.stroke();
      const seat = H.rr(H.P(), TS * 1.42, TS * 0.36, TS * 0.46, 8, 2);
      H.cel(ctx, seat, '#a8743e', { ox: 1, oy: 1, lw: 1.2 });
    },
    solid: (dx) => dx === 0,
  });
  // The Moon Well seal: a huge animated circle on the floor.
  PR.def('moonwell', {
    solid: false,
    animated: true,
    sortOffset: -2000,
    draw(ctx, o, w, h, inst, time = 0) {
      const cx = w / 2, cy = h / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const active = !(NR.game && NR.game.flag('moonwell_sealed'));
      const col = active ? '#9a6aff' : '#7ad0ff';
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = U.rgba(col, 0.55 - i * 0.1);
        ctx.lineWidth = 4 - i * 0.6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.48 - i * 26, h * 0.46 - i * 22, 0, 0, U.TAU);
        ctx.stroke();
      }
      ctx.translate(cx, cy);
      ctx.scale(1, h / w);
      ctx.rotate(time * (active ? 0.4 : 0.1));
      ctx.strokeStyle = U.rgba(col, 0.7);
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * U.TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * w * 0.2, Math.sin(a) * w * 0.2);
        ctx.lineTo(Math.cos(a + 0.5) * w * 0.44, Math.sin(a + 0.5) * w * 0.44);
        ctx.stroke();
      }
      ctx.beginPath();
      for (let a = 0; a < 6 * Math.PI; a += 0.15) {
        const r = (a / (6 * Math.PI)) * w * 0.18;
        a === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      ctx.restore();
    },
    light: (o, w, h) => ({ x: w / 2, y: h / 2, r: 420, color: '#9a6aff', a: 0.9 }),
  });

  PR.def('bars', {
    bounds: (o, w) => [-2, -TS * 0.9, w * TS + 4, TS * 1.9],
    draw(ctx, o, w) {
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(0, -TS * 0.8, w, 7);
      ctx.fillRect(0, TS * 0.8, w, 7);
      for (let x = 5; x < w; x += 12) {
        const b = H.rr(H.P(), x, -TS * 0.8, 5, TS * 1.66, 2);
        H.cel(ctx, b, '#5a5a66', { ox: 1, oy: 0, lw: 1 });
      }
    },
  });
})();
