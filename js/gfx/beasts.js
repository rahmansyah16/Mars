// Battle creatures drawn procedurally (facing right). Cached per pixel ratio.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const H = NR.props.h;
  const B = (NR.beasts = { cache: new Map() });

  const DEF = {
    wolf: {
      w: 260, h: 190,
      draw(x) {
        const col = '#6a6478', dark = '#3a3446';
        H.shadow(x, 130, 176, 100, 16, 0.4);
        const legs = H.P();
        for (const [lx, back] of [[70, 1], [100, 0], [170, 1], [196, 0]]) H.rr(legs, lx, 120, 18, 56, 8);
        H.cel(x, legs, dark, { ox: 3, oy: 0 });
        const body = H.P();
        body.moveTo(50, 110);
        body.bezierCurveTo(40, 60, 150, 60, 200, 80);
        body.bezierCurveTo(230, 96, 220, 140, 190, 140);
        body.lineTo(70, 140);
        body.quadraticCurveTo(40, 138, 50, 110);
        body.closePath();
        // tail
        body.moveTo(56, 100);
        body.quadraticCurveTo(10, 90, 4, 50);
        body.quadraticCurveTo(30, 80, 60, 86);
        body.closePath();
        H.cel(x, body, col, { ox: 8, oy: 10 });
        const head = H.P();
        head.moveTo(186, 90);
        head.bezierCurveTo(190, 40, 240, 50, 250, 78);
        head.lineTo(258, 96);
        head.quadraticCurveTo(230, 110, 200, 118);
        head.closePath();
        H.poly(head, [200, 60, 206, 24, 222, 58]);
        H.poly(head, [218, 60, 232, 28, 238, 64]);
        H.cel(x, head, col, { ox: 5, oy: 6 });
        // fur streaks
        x.strokeStyle = U.rgba('#9a94a8', 0.6);
        x.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          x.beginPath();
          x.moveTo(80 + i * 20, 76);
          x.lineTo(90 + i * 20, 96);
          x.stroke();
        }
        // corrupted glowing eyes + chakra marks
        x.fillStyle = '#ff3a5a';
        x.beginPath();
        x.ellipse(226, 74, 6, 4, -0.3, 0, U.TAU);
        x.fill();
        x.strokeStyle = 'rgba(180,90,255,0.8)';
        x.lineWidth = 3;
        x.beginPath();
        x.moveTo(120, 90);
        x.lineTo(140, 110);
        x.lineTo(160, 92);
        x.stroke();
        x.fillStyle = '#f4f0e6';
        x.beginPath();
        x.moveTo(236, 98);
        x.lineTo(240, 108);
        x.lineTo(246, 97);
        x.fill();
      },
    },
    boar: {
      w: 270, h: 200,
      draw(x) {
        const col = '#7a4e36';
        H.shadow(x, 130, 184, 110, 18, 0.4);
        const legs = H.P();
        for (const lx of [66, 96, 170, 196]) H.rr(legs, lx, 130, 22, 54, 8);
        H.cel(x, legs, '#4a2e20', { ox: 3, oy: 0 });
        const body = H.P();
        body.moveTo(40, 120);
        body.bezierCurveTo(30, 50, 200, 40, 230, 90);
        body.bezierCurveTo(250, 130, 220, 156, 180, 156);
        body.lineTo(70, 156);
        body.quadraticCurveTo(36, 150, 40, 120);
        body.closePath();
        H.cel(x, body, col, { ox: 10, oy: 12 });
        // bristles
        x.strokeStyle = '#3a2418';
        x.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          x.beginPath();
          x.moveTo(70 + i * 12, 64 - Math.sin(i / 3) * 6);
          x.lineTo(66 + i * 12, 48 - Math.sin(i / 3) * 6);
          x.stroke();
        }
        const snout = H.ell(H.P(), 242, 118, 22, 18);
        H.cel(x, snout, '#b07a5a', { ox: 3, oy: 3 });
        x.fillStyle = '#3a2418';
        x.beginPath();
        x.ellipse(254, 114, 4, 6, 0, 0, U.TAU);
        x.fill();
        // tusks
        const t = H.P();
        t.moveTo(234, 132);
        t.quadraticCurveTo(262, 140, 262, 104);
        t.quadraticCurveTo(254, 130, 238, 126);
        t.closePath();
        H.cel(x, t, '#f4ecd8', { ox: 1, oy: 1, lw: 1.4 });
        x.fillStyle = '#ffcc3a';
        x.beginPath();
        x.arc(214, 90, 5, 0, U.TAU);
        x.fill();
        x.fillStyle = '#1a0a08';
        x.beginPath();
        x.arc(215, 90, 2, 0, U.TAU);
        x.fill();
      },
    },
    wasps: {
      w: 230, h: 200, anim: true,
      draw(x, t = 0) {
        for (let i = 0; i < 6; i++) {
          const a = t * 3 + i * 1.3;
          const cx = 115 + Math.cos(a) * 60 + Math.sin(a * 1.7) * 20, cy = 90 + Math.sin(a * 1.3) * 40;
          x.save();
          x.translate(cx, cy);
          x.fillStyle = 'rgba(220,240,255,0.55)';
          x.beginPath();
          x.ellipse(-4, -12 + Math.sin(t * 40 + i) * 3, 12, 6, -0.5, 0, U.TAU);
          x.ellipse(6, -12 - Math.sin(t * 40 + i) * 3, 12, 6, 0.5, 0, U.TAU);
          x.fill();
          const body = H.ell(H.P(), 0, 0, 18, 10);
          H.cel(x, body, '#e8b830', { ox: 2, oy: 2, lw: 1.4 });
          x.fillStyle = '#2a1a10';
          x.fillRect(-6, -9, 4, 18);
          x.fillRect(2, -9, 4, 18);
          x.fillStyle = '#8a3aff';
          x.beginPath();
          x.arc(16, -2, 3, 0, U.TAU);
          x.fill();
          x.restore();
        }
      },
    },
    snake: {
      w: 280, h: 230,
      draw(x) {
        H.shadow(x, 140, 208, 120, 18, 0.4);
        const col = '#5a7a4a';
        const body = H.P();
        body.moveTo(20, 196);
        body.bezierCurveTo(60, 140, 180, 220, 200, 160);
        body.bezierCurveTo(214, 110, 150, 90, 170, 50);
        body.lineTo(200, 58);
        body.bezierCurveTo(190, 90, 240, 120, 228, 170);
        body.bezierCurveTo(210, 236, 90, 180, 40, 210);
        body.closePath();
        H.cel(x, body, col, { ox: 8, oy: 8 });
        x.strokeStyle = 'rgba(30,50,20,0.5)';
        x.lineWidth = 2;
        for (let i = 0; i < 14; i++) {
          x.beginPath();
          x.arc(60 + i * 12, 186 - Math.sin(i / 2.5) * 20, 7, 0, Math.PI);
          x.stroke();
        }
        const head = H.P();
        head.moveTo(160, 58);
        head.bezierCurveTo(150, 20, 230, 10, 262, 40);
        head.quadraticCurveTo(250, 70, 200, 70);
        head.closePath();
        H.cel(x, head, U.light(col, 0.05), { ox: 4, oy: 5 });
        x.fillStyle = '#ffd23a';
        x.beginPath();
        x.ellipse(222, 34, 7, 5, 0, 0, U.TAU);
        x.fill();
        x.fillStyle = '#1a0a08';
        x.fillRect(221, 29, 2, 10);
        x.strokeStyle = '#d23a3a';
        x.lineWidth = 3;
        x.beginPath();
        x.moveTo(262, 42);
        x.lineTo(278, 38);
        x.moveTo(270, 40);
        x.lineTo(278, 46);
        x.stroke();
      },
    },
    puppet: {
      w: 200, h: 240,
      draw(x) {
        H.shadow(x, 100, 228, 70, 14, 0.4);
        const col = '#8a6a4a';
        const parts = [H.rr(H.P(), 70, 150, 18, 70, 6), H.rr(H.P(), 112, 150, 18, 70, 6)];
        for (const p of parts) H.cel(x, p, U.shade(col, -0.2), { ox: 2, oy: 0 });
        const torso = H.rr(H.P(), 60, 70, 80, 90, 16);
        H.cel(x, torso, col, { ox: 6, oy: 6 });
        for (const [ax, ang] of [[48, 0.4], [152, -0.4]]) {
          x.save();
          x.translate(ax, 86);
          x.rotate(ang);
          const arm = H.rr(H.P(), -8, 0, 16, 80, 6);
          H.cel(x, arm, U.shade(col, -0.1), { ox: 2, oy: 2 });
          const blade = H.poly(H.P(), [-4, 78, 0, 120, 4, 78]);
          H.cel(x, blade, '#c8d0da', { ox: 1, oy: 1, lw: 1.2 });
          x.restore();
        }
        const head = H.ell(H.P(), 100, 46, 30, 30);
        H.cel(x, head, '#e8dcc8', { ox: 4, oy: 4 });
        x.fillStyle = '#2a1a14';
        x.beginPath();
        x.arc(90, 44, 5, 0, U.TAU);
        x.arc(112, 44, 5, 0, U.TAU);
        x.fill();
        x.strokeStyle = '#a02a2a';
        x.lineWidth = 3;
        x.beginPath();
        x.moveTo(86, 62);
        x.lineTo(116, 62);
        x.stroke();
        // strings
        x.strokeStyle = 'rgba(160,200,255,0.5)';
        x.lineWidth = 1;
        for (const sx of [60, 100, 140]) {
          x.beginPath();
          x.moveTo(sx, 0);
          x.lineTo(sx, 80);
          x.stroke();
        }
      },
    },
    golem: {
      w: 280, h: 300,
      draw(x) {
        H.shadow(x, 140, 286, 110, 20, 0.45);
        const col = '#8a8078';
        const legs = H.P();
        H.rr(legs, 80, 200, 50, 84, 12);
        H.rr(legs, 150, 200, 50, 84, 12);
        H.cel(x, legs, U.shade(col, -0.15), { ox: 5, oy: 0 });
        const body = H.P();
        body.moveTo(50, 110);
        body.lineTo(80, 60);
        body.lineTo(200, 60);
        body.lineTo(236, 110);
        body.lineTo(220, 216);
        body.lineTo(64, 216);
        body.closePath();
        H.cel(x, body, col, { ox: 12, oy: 12 });
        for (const [ax, d] of [[30, -1], [250, 1]]) {
          const arm = H.rr(H.P(), ax - 26, 90, 52, 130, 18);
          H.cel(x, arm, U.shade(col, -0.05), { ox: 6, oy: 6 });
        }
        const head = H.rr(H.P(), 108, 16, 70, 56, 12);
        H.cel(x, head, U.light(col, 0.05), { ox: 5, oy: 5 });
        x.fillStyle = '#7ad0ff';
        x.fillRect(122, 36, 14, 8);
        x.fillRect(150, 36, 14, 8);
        // glowing seal on chest
        x.strokeStyle = '#c8321e';
        x.lineWidth = 5;
        x.beginPath();
        for (let a = 0; a < 5 * Math.PI; a += 0.2) {
          const r = a * 3;
          const px = 143 + Math.cos(a) * r, py = 140 + Math.sin(a) * r;
          a === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
        }
        x.stroke();
        x.strokeStyle = 'rgba(40,30,30,0.4)';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(70, 120);
        x.lineTo(100, 150);
        x.lineTo(90, 190);
        x.moveTo(200, 90);
        x.lineTo(180, 130);
        x.stroke();
      },
    },
    serpent: {
      w: 320, h: 300,
      draw(x) {
        const col = '#3a7aa0';
        // water base
        x.fillStyle = 'rgba(90,170,220,0.5)';
        x.beginPath();
        x.ellipse(160, 270, 150, 26, 0, 0, U.TAU);
        x.fill();
        const body = H.P();
        body.moveTo(60, 270);
        body.bezierCurveTo(40, 180, 170, 180, 150, 110);
        body.bezierCurveTo(140, 60, 190, 30, 230, 40);
        body.lineTo(240, 80);
        body.bezierCurveTo(210, 80, 196, 110, 210, 150);
        body.bezierCurveTo(236, 230, 130, 240, 140, 270);
        body.closePath();
        H.cel(x, body, col, { ox: 10, oy: 10 });
        const fin = H.P();
        for (let i = 0; i < 5; i++) H.poly(fin, [150 + i * 6, 100 + i * 30, 120 + i * 4, 90 + i * 30, 146 + i * 6, 120 + i * 30]);
        H.cel(x, fin, '#8ad0e8', { ox: 2, oy: 2, lw: 1.4 });
        const head = H.P();
        head.moveTo(200, 50);
        head.bezierCurveTo(210, 10, 290, 10, 312, 44);
        head.quadraticCurveTo(290, 80, 236, 84);
        head.closePath();
        H.cel(x, head, U.light(col, 0.06), { ox: 5, oy: 5 });
        x.fillStyle = '#ffe24a';
        x.beginPath();
        x.ellipse(262, 36, 8, 6, 0, 0, U.TAU);
        x.fill();
        x.fillStyle = '#1a0a08';
        x.fillRect(261, 31, 2.5, 11);
        x.fillStyle = '#f4f0e6';
        for (let i = 0; i < 4; i++) {
          x.beginPath();
          x.moveTo(270 + i * 9, 62);
          x.lineTo(274 + i * 9, 72);
          x.lineTo(278 + i * 9, 61);
          x.fill();
        }
      },
    },
  };
  B.DEF = DEF;

  B.draw = function (ctx, kind, cx, footY, scale = 1, t = 0, flip = false) {
    const d = DEF[kind];
    if (!d) return;
    const cpr = NR.engine.cpr;
    const s = scale * 0.9;
    ctx.save();
    ctx.translate(cx, footY);
    if (flip) ctx.scale(-1, 1);
    const breathe = 1 + Math.sin(t * 2.2) * 0.015;
    ctx.scale(s, s * breathe);
    ctx.translate(-d.w / 2, -d.h);
    if (d.anim) d.draw(ctx, t);
    else {
      const key = kind + '@' + cpr + '@' + s.toFixed(2);
      let c = B.cache.get(key);
      if (!c) {
        c = U.canvas(d.w * cpr * s, d.h * cpr * s);
        const x = c.getContext('2d');
        x.scale(cpr * s, cpr * s);
        x.lineJoin = 'round';
        x.lineCap = 'round';
        d.draw(x);
        B.cache.set(key, c);
      }
      ctx.drawImage(c, 0, 0, d.w, d.h);
    }
    ctx.restore();
  };
  B.size = (kind) => DEF[kind] || { w: 200, h: 200 };
  NR.engine.on('cprchange', () => B.cache.clear());
})();
