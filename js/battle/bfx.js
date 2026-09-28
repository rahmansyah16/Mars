// Battle visual effects for jutsu. play() resolves at the moment of impact so the
// battle can show damage in sync; the visuals keep fading out afterwards.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, W = NR.W, H = NR.H;
  const FX = (NR.bfx = { list: [], parts: null });
  const TAU = U.TAU;

  FX.reset = function () {
    FX.list = [];
    FX.parts = new NR.fx.Particles();
  };
  FX.add = function (dur, draw) {
    const f = { t: 0, dur, draw };
    FX.list.push(f);
    return f;
  };
  FX.update = function (dt) {
    for (let i = FX.list.length - 1; i >= 0; i--) {
      const f = FX.list[i];
      f.t += dt;
      if (f.t >= f.dur) FX.list.splice(i, 1);
    }
    FX.parts && FX.parts.update(dt, { x: 0, y: 0 });
  };
  FX.draw = function (ctx) {
    for (const f of FX.list) {
      ctx.save();
      f.draw(ctx, U.clamp(f.t / f.dur, 0, 1), f.t);
      ctx.restore();
    }
    FX.parts && FX.parts.draw(ctx, { x: 0, y: 0 });
  };
  const wait = (ms) => NR.engine.wait(ms / (NR.settings.battleSpeed || 1));
  const burst = (x, y, n, o) => FX.parts.burst(x, y, n, o);
  const glow = (ctx, x, y, r, col, a = 1) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U.rgba(col, a));
    g.addColorStop(1, U.rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  FX.glow = glow;
  const lighter = (ctx) => (ctx.globalCompositeOperation = 'lighter');

  // ---------- primitives ----------
  function starburst(x, y, r, col = '#ffffff') {
    FX.add(0.28, (ctx, k) => {
      lighter(ctx);
      ctx.globalAlpha = 1 - k;
      glow(ctx, x, y, r * (0.6 + k), col, 0.9);
      ctx.strokeStyle = col;
      ctx.lineWidth = 4 * (1 - k);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.3;
        ctx.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3);
        ctx.lineTo(x + Math.cos(a) * r * (0.8 + k * 0.6), y + Math.sin(a) * r * (0.8 + k * 0.6));
      }
      ctx.stroke();
    });
  }
  function ring(x, y, r0, r1, col, dur = 0.5, lw = 6) {
    FX.add(dur, (ctx, k) => {
      lighter(ctx);
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = col;
      ctx.lineWidth = lw * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y, U.lerp(r0, r1, U.ease.outCubic(k)), U.lerp(r0, r1, U.ease.outCubic(k)) * 0.45, 0, 0, TAU);
      ctx.stroke();
    });
  }
  function projectile(from, to, dur, drawAt) {
    return new Promise((resolve) => {
      FX.add(dur, (ctx, k) => {
        const e = U.ease.inOut(k);
        const x = U.lerp(from.x, to.x, e), y = U.lerp(from.y, to.y, e) - Math.sin(k * Math.PI) * (from.arc || 0);
        drawAt(ctx, x, y, k);
      });
      setTimeout(resolve, (dur * 1000) / (NR.settings.battleSpeed || 1));
    });
  }
  function bolt(ctx, x1, y1, x2, y2, col, w = 3, jag = 18) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const n = 8;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      ctx.lineTo(U.lerp(x1, x2, t) + (Math.random() - 0.5) * jag, U.lerp(y1, y2, t) + (Math.random() - 0.5) * jag);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function spiral(ctx, x, y, r, rot, col, lw = 3, turns = 3) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let a = 0; a < turns * TAU; a += 0.2) {
      const rr = (a / (turns * TAU)) * r;
      const px = x + Math.cos(a + rot) * rr, py = y + Math.sin(a + rot) * rr;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  function rasenSphere(ctx, x, y, r, t, big) {
    lighter(ctx);
    glow(ctx, x, y, r * 2.4, '#5ab0ff', 0.6);
    glow(ctx, x, y, r * 1.2, '#cfeaff', 0.9);
    for (let i = 0; i < 4; i++) spiral(ctx, x, y, r, t * 18 + i * 1.6, 'rgba(255,255,255,0.8)', 2, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, TAU);
    ctx.fill();
    if (big) {
      ctx.strokeStyle = 'rgba(160,220,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.05, t * 9, t * 9 + 4);
      ctx.stroke();
    }
  }
  function flames(x, y, w, h, col1 = '#ffd040', col2 = '#ff4a1a', dur = 0.9, dark) {
    FX.add(dur, (ctx, k, t) => {
      if (!dark) lighter(ctx);
      const a = Math.sin(k * Math.PI);
      for (let i = 0; i < 14; i++) {
        const fx = x + (i / 13 - 0.5) * w + Math.sin(t * 9 + i) * 8;
        const fh = h * (0.5 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 0.5) * a;
        const g = ctx.createLinearGradient(0, y, 0, y - fh);
        g.addColorStop(0, U.rgba(dark ? '#140414' : col1, 0.9 * a));
        g.addColorStop(0.6, U.rgba(dark ? '#3a0a2a' : col2, 0.6 * a));
        g.addColorStop(1, U.rgba(dark ? '#000000' : col2, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(fx - 16, y);
        ctx.quadraticCurveTo(fx - 12, y - fh * 0.6, fx, y - fh);
        ctx.quadraticCurveTo(fx + 12, y - fh * 0.6, fx + 16, y);
        ctx.fill();
        if (dark) {
          ctx.strokeStyle = U.rgba('#c8203a', 0.5 * a);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });
  }
  function rocksUp(x, y, n = 5, col = '#9a8060') {
    FX.add(0.8, (ctx, k) => {
      const e = k < 0.3 ? U.ease.outBack(k / 0.3) : 1;
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      for (let i = 0; i < n; i++) {
        const px = x + (i - (n - 1) / 2) * 30, h = (50 + (i % 2) * 30) * e;
        ctx.fillStyle = U.shade(col, (i % 3) * -0.1);
        ctx.beginPath();
        ctx.moveTo(px - 16, y);
        ctx.lineTo(px - 3, y - h);
        ctx.lineTo(px + 16, y);
        ctx.fill();
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }
  function screenFlash(col, a = 0.7, dur = 0.35) {
    FX.add(dur, (ctx, k) => {
      ctx.fillStyle = U.rgba(col, a * (1 - k));
      ctx.fillRect(0, 0, W, H);
    });
  }
  FX.starburst = starburst;
  FX.screenFlash = screenFlash;

  // ---------- effect library ----------
  // Each: async (B, user, targets, sk) -> resolves at impact
  const LIB = {};
  LIB.hit = async (B, u, ts) => {
    for (const t of ts) {
      starburst(t.cx, t.cy, 50);
      burst(t.cx, t.cy, 8, { type: 'spark', speed: 220, life: 0.4, size: 3, color: '#fff6c0' });
    }
    NR.audio.sfx('hit');
  };
  LIB.slash = async (B, u, ts) => {
    NR.audio.sfx('slash');
    for (const t of ts) {
      FX.add(0.3, (ctx, k) => {
        lighter(ctx);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6 * (1 - k) + 1;
        for (const off of [-16, 12]) {
          ctx.beginPath();
          ctx.moveTo(t.cx - 60, t.cy - 50 + off);
          ctx.quadraticCurveTo(t.cx, t.cy + off, t.cx + 60, t.cy + 40 + off);
          ctx.stroke();
        }
      });
    }
  };
  LIB.palm = async (B, u, ts) => {
    NR.audio.sfx('hit');
    for (const t of ts) {
      ring(t.cx, t.cy, 10, 90, '#9ad4ff', 0.45, 8);
      ring(t.cx, t.cy, 10, 60, '#ffffff', 0.35, 5);
      burst(t.cx, t.cy, 10, { type: 'spark', speed: 180, life: 0.5, size: 3, color: '#9ad4ff' });
    }
  };
  LIB.bite = async (B, u, ts) => {
    NR.audio.sfx('bite');
    for (const t of ts) {
      FX.add(0.35, (ctx, k) => {
        const g = U.ease.inCubic(Math.min(1, k * 2));
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#f4f0e6';
        for (const s of [-1, 1]) {
          for (let i = 0; i < 5; i++) {
            const x = t.cx - 40 + i * 20, y = t.cy + s * (40 - g * 34);
            ctx.beginPath();
            ctx.moveTo(x - 8, y);
            ctx.lineTo(x, y - s * 18);
            ctx.lineTo(x + 8, y);
            ctx.fill();
          }
        }
      });
      screenFlash('#ff2a2a', 0.18, 0.2);
    }
  };
  LIB.shuriken = async (B, u, ts) => {
    NR.audio.sfx('slash');
    await Promise.all(ts.map((t) => projectile({ x: u.cx, y: u.cy }, { x: t.cx, y: t.cy }, 0.32, (ctx, x, y, k) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k * 30);
      ctx.fillStyle = '#5a6272';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(14, 0);
        ctx.lineTo(0, 3);
        ctx.fill();
      }
      ctx.restore();
    })));
    for (const t of ts) starburst(t.cx, t.cy, 30);
  };
  LIB.weapons = async (B, u, ts) => {
    NR.audio.sfx('slash');
    const shots = [];
    for (const t of ts) {
      for (let i = 0; i < 5; i++) {
        shots.push(
          new Promise((r) => setTimeout(r, i * 60)).then(() =>
            projectile({ x: u.cx + U.rand(-30, 30), y: u.cy - 80 + U.rand(-30, 30), arc: 60 }, { x: t.cx + U.rand(-30, 30), y: t.cy + U.rand(-20, 20) }, 0.3, (ctx, x, y, k) => {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(Math.atan2(t.cy - u.cy, t.cx - u.cx) + Math.PI);
              ctx.fillStyle = '#c8d0da';
              ctx.fillRect(-14, -2, 24, 4);
              ctx.fillStyle = '#3a2a2a';
              ctx.fillRect(10, -3, 8, 6);
              ctx.restore();
            })
          )
        );
      }
    }
    await Promise.all(shots);
    for (const t of ts) starburst(t.cx, t.cy, 40, '#e8f0ff');
    NR.audio.sfx('hit');
  };
  LIB.clones = async (B, u, ts) => {
    const t = ts[0];
    NR.audio.sfx('poof');
    const spots = [[-90, -40], [80, -50], [-70, 60], [90, 50]];
    for (const [dx, dy] of spots) burst(t.cx + dx, t.cy + dy, 8, { type: 'poof', speed: 60, life: 0.5, size: 16, color: '#f2f2f6' });
    FX.add(0.9, (ctx, k) => {
      const sh = NR.sheetOf(u.char);
      if (!sh) return;
      ctx.globalAlpha = k < 0.8 ? 0.85 : (1 - k) / 0.2 * 0.85;
      spots.forEach(([dx, dy], i) => {
        const lunge = Math.sin(Math.min(1, k * 2.4 - i * 0.18) * Math.PI) * 30;
        const x = t.cx + dx * (1 - lunge / 60), y = t.cy + dy * (1 - lunge / 60);
        const s = 2.2 * (NR.TS / sh.fw) * (sh.scale || 1);
        const row = sh.layout.dirs[dx > 0 ? 'left' : 'right'];
        ctx.imageSmoothingEnabled = sh.smooth !== false;
        ctx.drawImage(sh.img, sh.bx + sh.layout.cycle[(Math.floor(k * 12) + i) % sh.layout.cycle.length] * sh.fw, sh.by + row * sh.fh, sh.fw, sh.fh, x - (sh.fw * s) / 2, y + 60 - sh.fh * s, sh.fw * s, sh.fh * s);
      });
    });
    await wait(220);
  };
  LIB.rasengan = async (B, u, ts, sk, big) => {
    NR.audio.sfx('rasengan');
    const hx = u.cx - 40, hy = u.cy;
    await new Promise((resolve) => {
      FX.add(0.7, (ctx, k, t) => rasenSphere(ctx, hx, hy, (big ? 44 : 26) * U.ease.outBack(Math.min(1, k * 1.4)), t, big));
      setTimeout(resolve, 650 / (NR.settings.battleSpeed || 1));
    });
    const t = ts[0];
    await projectile({ x: hx, y: hy }, { x: t.cx + 20, y: t.cy }, 0.22, (ctx, x, y, k) => rasenSphere(ctx, x, y, big ? 44 : 26, k * 3, big));
    NR.engine.shake(big ? 16 : 10, 0.4);
    NR.audio.sfx('explosion');
    FX.add(0.6, (ctx, k, tt) => {
      lighter(ctx);
      ctx.globalAlpha = 1 - k;
      const r = (big ? 150 : 100) * U.ease.outCubic(k);
      glow(ctx, t.cx, t.cy, r * 1.4, '#5ab0ff', 0.7);
      for (let i = 0; i < 6; i++) spiral(ctx, t.cx, t.cy, r, tt * 14 + i, 'rgba(220,240,255,0.8)', 3, 1.2);
    });
    screenFlash('#cfeaff', 0.45);
    burst(t.cx, t.cy, 26, { type: 'spark', speed: 360, life: 0.6, size: 3.5, color: '#bfe4ff' });
  };
  LIB.rasengan_big = (B, u, ts, sk) => LIB.rasengan(B, u, ts, sk, true);
  LIB.rasenshuriken = async (B, u, ts) => {
    NR.audio.sfx('wind');
    const cx = ts.reduce((s, t) => s + t.cx, 0) / ts.length, cy = ts.reduce((s, t) => s + t.cy, 0) / ts.length;
    const disc = (ctx, x, y, r, t) => {
      lighter(ctx);
      glow(ctx, x, y, r * 2.2, '#9ad4ff', 0.6);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 30);
      ctx.fillStyle = 'rgba(235,248,255,0.85)';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.2);
        ctx.quadraticCurveTo(r * 1.6, -r * 0.6, r * 2.2, 0);
        ctx.quadraticCurveTo(r * 1.4, r * 0.1, 0, r * 0.2);
        ctx.fill();
      }
      ctx.restore();
      rasenSphere(ctx, x, y, r, t, true);
    };
    await new Promise((resolve) => {
      FX.add(0.6, (ctx, k, t) => disc(ctx, u.cx - 40, u.cy - 60, 30 * Math.min(1, k * 1.5), t));
      setTimeout(resolve, 560 / (NR.settings.battleSpeed || 1));
    });
    await projectile({ x: u.cx - 40, y: u.cy - 60 }, { x: cx, y: cy }, 0.35, (ctx, x, y, k) => disc(ctx, x, y, 30, k * 4));
    NR.engine.shake(20, 0.8);
    NR.audio.sfx('explosion');
    FX.add(1.1, (ctx, k, t) => {
      lighter(ctx);
      const r = 240 * U.ease.outCubic(Math.min(1, k * 1.6));
      ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
      glow(ctx, cx, cy, r * 1.3, '#9ad4ff', 0.75);
      ctx.strokeStyle = 'rgba(240,250,255,0.85)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU + t * 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
        ctx.lineTo(cx + Math.cos(a + 0.3) * r, cy + Math.sin(a + 0.3) * r * 0.8);
        ctx.stroke();
      }
    });
    screenFlash('#ffffff', 0.85, 0.5);
  };
  LIB.sexy = async (B, u, ts) => {
    NR.audio.sfx('sexy');
    burst(u.cx, u.cy, 22, { type: 'poof', speed: 90, life: 0.8, size: 22, color: '#ffc4e0' });
    FX.add(1.2, (ctx, k) => {
      ctx.globalAlpha = Math.sin(k * Math.PI);
      lighter(ctx);
      glow(ctx, u.cx, u.cy, 160, '#ff7ab8', 0.5);
      ctx.globalCompositeOperation = 'source-over';
      NR.ui.text(ctx, '♥ Sexy Jutsu! ♥', u.cx, u.cy - 130 - k * 20, { size: 26, bold: true, align: 'center', color: '#ffb3d9', outline: '#6a1a3a' });
    });
    await wait(500);
    for (const t of ts) {
      for (let i = 0; i < 6; i++) FX.parts.add({ type: 'heart', x: u.cx, y: u.cy - 20, vx: (t.cx - u.cx) * 1.4 + U.rand(-40, 40), vy: (t.cy - u.cy) * 1.4 - 60 + U.rand(-40, 40), life: 0.8, size: U.rand(10, 16), color: '#ff5a9a' });
    }
    await wait(450);
  };
  LIB.sage = async (B, u) => {
    NR.audio.sfx('buff');
    ring(u.cx, u.fy, 20, 120, '#ffb44a', 0.8, 8);
    burst(u.cx, u.cy, 20, { type: 'leaf', speed: 120, life: 1, size: 5, color: '#8ac850', rot: 0, vr: 5, seed: 1 });
    await wait(300);
  };
  LIB.kurama = async (B, u) => {
    NR.audio.sfx('kurama');
    screenFlash('#ff8a2a', 0.6, 0.6);
    NR.engine.shake(12, 0.8);
    FX.add(1.4, (ctx, k, t) => {
      lighter(ctx);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      glow(ctx, u.cx, u.cy, 220, '#ffb040', 0.8);
      flamesDraw(ctx, u.cx, u.fy, 140, 220, t);
    });
    for (let i = 0; i < 40; i++) FX.parts.add({ type: 'ember', x: u.cx + U.rand(-60, 60), y: u.fy, vx: U.rand(-30, 30), vy: U.rand(-260, -120), life: U.rand(0.8, 1.4), size: U.rand(2, 4), color: '#ffcc50' });
    await wait(900);
  };
  function flamesDraw(ctx, x, y, w, h, t) {
    for (let i = 0; i < 12; i++) {
      const fx = x + (i / 11 - 0.5) * w;
      const fh = h * (0.5 + Math.abs(Math.sin(t * 7 + i * 1.3)) * 0.5);
      const g = ctx.createLinearGradient(0, y, 0, y - fh);
      g.addColorStop(0, 'rgba(255,220,90,0.8)');
      g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(fx - 18, y);
      ctx.quadraticCurveTo(fx - 12, y - fh * 0.6, fx, y - fh);
      ctx.quadraticCurveTo(fx + 12, y - fh * 0.6, fx + 18, y);
      ctx.fill();
    }
  }
  LIB.beastbomb = async (B, u, ts) => {
    NR.audio.sfx('charge');
    const sx = u.cx - 60, sy = u.cy - 140;
    await new Promise((resolve) => {
      FX.add(0.9, (ctx, k, t) => {
        lighter(ctx);
        const r = 60 * U.ease.outBack(Math.min(1, k * 1.2));
        glow(ctx, sx, sy, r * 2.2, '#ff6a2a', 0.6);
        glow(ctx, sx, sy, r, '#2a0a3a', 0.9);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU - t * 4;
          ctx.fillStyle = i % 2 ? 'rgba(255,120,40,0.8)' : 'rgba(120,60,255,0.8)';
          ctx.beginPath();
          ctx.arc(sx + Math.cos(a) * r * (2 - k), sy + Math.sin(a) * r * (2 - k), 4, 0, TAU);
          ctx.fill();
        }
      });
      setTimeout(resolve, 850 / (NR.settings.battleSpeed || 1));
    });
    const cx = ts.reduce((s, t) => s + t.cx, 0) / ts.length, cy = ts.reduce((s, t) => s + t.cy, 0) / ts.length;
    await projectile({ x: sx, y: sy }, { x: cx, y: cy }, 0.3, (ctx, x, y) => {
      lighter(ctx);
      glow(ctx, x, y, 110, '#ff6a2a', 0.7);
      glow(ctx, x, y, 50, '#1a0a2a', 0.9);
    });
    NR.audio.sfx('explosion');
    NR.engine.shake(26, 1);
    screenFlash('#ffffff', 1, 0.7);
    FX.add(1.2, (ctx, k) => {
      lighter(ctx);
      ctx.globalAlpha = 1 - k;
      glow(ctx, cx, cy, 420 * U.ease.outCubic(k), '#ff9a4a', 0.9);
      ring(cx, cy, 20, 500, '#ffe0a0', 0.9, 12);
    });
  };
  LIB.impact = async (B, u, ts) => {
    NR.audio.sfx('earth');
    NR.engine.shake(14, 0.5);
    for (const t of ts) {
      starburst(t.cx, t.cy, 70, '#ffd0e0');
      ring(t.cx, t.fy, 20, 200, '#ff9ac0', 0.6, 10);
      FX.add(0.9, (ctx, k) => {
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#3a2418';
        ctx.lineWidth = 4;
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(t.cx, t.fy);
          ctx.lineTo(t.cx + Math.cos(a) * 120 * Math.min(1, k * 3), t.fy - Math.sin(a) * 30 * Math.min(1, k * 3));
          ctx.stroke();
        }
      });
      burst(t.cx, t.fy, 18, { type: 'poof', speed: 200, life: 0.6, size: 7, color: '#a08060', gravity: 500, up: 200 });
    }
  };
  LIB.heal = async (B, u, ts) => {
    NR.audio.sfx('heal');
    for (const t of ts) {
      FX.add(1, (ctx, k) => {
        lighter(ctx);
        ctx.globalAlpha = Math.sin(k * Math.PI);
        glow(ctx, t.cx, t.cy, 110, '#7af0a0', 0.55);
      });
      for (let i = 0; i < 14; i++) FX.parts.add({ type: 'spark', x: t.cx + U.rand(-40, 40), y: t.fy - U.rand(0, 40), vx: 0, vy: U.rand(-120, -60), life: U.rand(0.7, 1.1), size: U.rand(2, 4), color: '#aaffc0' });
    }
    await wait(250);
  };
  LIB.heal_all = LIB.heal;
  LIB.byakugo = async (B, u) => {
    NR.audio.sfx('buff');
    FX.add(1, (ctx, k) => {
      lighter(ctx);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      glow(ctx, u.cx, u.cy - 60, 80, '#b58cff', 0.8);
      ctx.strokeStyle = 'rgba(160,255,190,0.7)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(u.cx, u.cy);
        ctx.lineTo(u.cx + Math.cos(i) * 90 * k, u.cy + Math.sin(i) * 90 * k);
        ctx.stroke();
      }
    });
    await wait(300);
  };
  LIB.byakugan = async (B, u, ts) => {
    NR.audio.sfx('buff');
    FX.add(0.8, (ctx, k) => {
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.5;
      ctx.strokeStyle = '#e6e0ff';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(u.cx, u.cy, 60 + k * 900 - i * 40, 0, TAU);
        ctx.stroke();
      }
    });
    await wait(300);
  };
  LIB.palms = async (B, u, ts) => {
    const t = ts[0];
    FX.add(0.9, (ctx, k) => {
      lighter(ctx);
      ctx.globalAlpha = 1 - k * 0.6;
      for (let i = 0; i < 8; i++) {
        if (k * 8 < i) break;
        const a = (i / 8) * TAU;
        glow(ctx, t.cx + Math.cos(a) * 46, t.cy + Math.sin(a) * 46, 30, '#9ad4ff', 0.8);
      }
      ctx.strokeStyle = 'rgba(200,230,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.cx, t.cy, 70, 0, TAU * Math.min(1, k * 1.3));
      ctx.stroke();
    });
    NR.audio.sfx('hit');
  };
  LIB.wind = async (B, u, ts) => {
    NR.audio.sfx('wind');
    for (const t of ts) {
      FX.add(0.5, (ctx, k) => {
        lighter(ctx);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = 'rgba(220,255,240,0.85)';
        ctx.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
          const x = U.lerp(u.cx, t.cx, Math.min(1, k * 1.6)) + i * 18;
          ctx.beginPath();
          ctx.arc(x, t.cy + (i - 1) * 24, 40, -1.1, 1.1);
          ctx.stroke();
        }
      });
    }
    await wait(260);
    for (const t of ts) burst(t.cx, t.cy, 10, { type: 'leaf', speed: 240, life: 0.7, size: 4, color: '#bfe8c8', rot: 0, vr: 8, seed: 2 });
  };
  LIB.wind_big = async (B, u, ts) => {
    await LIB.wind(B, u, ts);
    NR.engine.shake(10, 0.4);
    for (const t of ts) ring(t.cx, t.cy, 20, 160, '#dff8f0', 0.6, 10);
  };
  LIB.rotation = async (B, u, ts) => {
    NR.audio.sfx('wind');
    for (const t of ts) {
      FX.add(1, (ctx, k, tt) => {
        lighter(ctx);
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
        ctx.strokeStyle = '#9ad4ff';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(t.cx, t.cy, 80, 90, 0, tt * 10 + i, tt * 10 + i + 1.4);
          ctx.stroke();
        }
      });
    }
    await wait(400);
  };
  LIB.lions = async (B, u, ts) => {
    NR.audio.sfx('charge');
    const t = ts[0];
    const lion = (ctx, x, y, s) => {
      lighter(ctx);
      glow(ctx, x, y, 70 * s, '#6ab4ff', 0.8);
      ctx.fillStyle = 'rgba(200,230,255,0.85)';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 20 * s, y + Math.sin(a) * 20 * s);
        ctx.lineTo(x + Math.cos(a + 0.3) * 50 * s, y + Math.sin(a + 0.3) * 50 * s);
        ctx.lineTo(x + Math.cos(a + 0.6) * 20 * s, y + Math.sin(a + 0.6) * 20 * s);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 18 * s, 0, TAU);
      ctx.fill();
    };
    await Promise.all([
      projectile({ x: u.cx - 30, y: u.cy - 30, arc: 40 }, { x: t.cx, y: t.cy - 20 }, 0.45, (ctx, x, y) => lion(ctx, x, y, 1)),
      projectile({ x: u.cx - 30, y: u.cy + 30, arc: -40 }, { x: t.cx, y: t.cy + 20 }, 0.45, (ctx, x, y) => lion(ctx, x, y, 1)),
    ]);
    NR.engine.shake(14, 0.5);
    NR.audio.sfx('explosion');
    ring(t.cx, t.cy, 20, 220, '#9ad4ff', 0.6, 10);
    screenFlash('#cfeaff', 0.5);
  };
  LIB.chidori = async (B, u, ts) => {
    NR.audio.sfx('thunder');
    FX.add(0.55, (ctx) => {
      lighter(ctx);
      glow(ctx, u.cx - 30, u.cy, 70, '#9ad4ff', 0.9);
      for (let i = 0; i < 5; i++) bolt(ctx, u.cx - 30, u.cy, u.cx - 30 + U.rand(-70, 70), u.cy + U.rand(-70, 70), '#e8f6ff', 2, 14);
    });
    await wait(450);
    for (const t of ts) {
      FX.add(0.4, (ctx) => {
        lighter(ctx);
        for (let i = 0; i < 6; i++) bolt(ctx, t.cx, t.cy, t.cx + U.rand(-120, 120), t.cy + U.rand(-120, 120), '#e8f6ff', 3, 22);
        glow(ctx, t.cx, t.cy, 120, '#9ad4ff', 0.8);
      });
    }
    screenFlash('#e8f6ff', 0.6, 0.25);
    NR.engine.shake(10, 0.35);
  };
  LIB.lightning_all = async (B, u, ts) => {
    NR.audio.sfx('thunder');
    for (const t of ts) {
      FX.add(0.45, (ctx) => {
        lighter(ctx);
        bolt(ctx, t.cx + U.rand(-40, 40), 0, t.cx, t.cy, '#e8f6ff', 5, 40);
        glow(ctx, t.cx, t.cy, 100, '#9ad4ff', 0.8);
      });
    }
    screenFlash('#e8f6ff', 0.5, 0.25);
    await wait(150);
  };
  LIB.kirin = async (B, u, ts) => {
    NR.audio.sfx('thunder');
    FX.add(0.7, (ctx, k) => {
      ctx.fillStyle = `rgba(10,10,30,${0.6 * Math.sin(k * Math.PI)})`;
      ctx.fillRect(0, 0, W, H);
    });
    await wait(450);
    const cx = ts.reduce((s, t) => s + t.cx, 0) / ts.length;
    FX.add(0.6, (ctx) => {
      lighter(ctx);
      for (let i = 0; i < 4; i++) bolt(ctx, cx + U.rand(-60, 60), 0, cx + U.rand(-100, 100), H * 0.72, '#ffffff', 10 - i * 2, 60);
    });
    screenFlash('#ffffff', 1, 0.6);
    NR.engine.shake(24, 0.9);
    NR.audio.sfx('explosion');
  };
  LIB.fire = async (B, u, ts) => {
    NR.audio.sfx('fire');
    const t = ts[0];
    await projectile({ x: u.cx - 40, y: u.cy, arc: 30 }, { x: t.cx, y: t.cy }, 0.45, (ctx, x, y, k) => {
      lighter(ctx);
      glow(ctx, x, y, 70, '#ff7a2a', 0.85);
      glow(ctx, x, y, 34, '#ffe08a', 0.9);
      FX.parts.add({ type: 'ember', x, y, vx: U.rand(-40, 40), vy: U.rand(-60, 0), life: 0.5, size: 3, color: '#ffb040' });
    });
    NR.audio.sfx('explosion');
    flames(t.cx, t.fy, 120, 170);
    starburst(t.cx, t.cy, 90, '#ffb060');
    NR.engine.shake(8, 0.3);
  };
  LIB.fire_all = async (B, u, ts) => {
    NR.audio.sfx('fire');
    for (const t of ts) flames(t.cx, t.fy, 140, 190, '#ffd040', '#ff4a1a', 1);
    await wait(260);
    NR.engine.shake(8, 0.4);
  };
  LIB.amaterasu = async (B, u, ts) => {
    NR.audio.sfx('fire');
    screenFlash('#ff2a2a', 0.35, 0.3);
    for (const t of ts) flames(t.cx, t.fy, 120, 200, '#000', '#000', 1.4, true);
    await wait(300);
  };
  LIB.earth = async (B, u, ts) => {
    NR.audio.sfx('earth');
    for (const t of ts) rocksUp(t.cx, t.fy + 4, 5);
    NR.engine.shake(10, 0.4);
    await wait(160);
  };
  LIB.earth_wall = async (B, u, ts) => {
    NR.audio.sfx('earth');
    FX.add(1.1, (ctx, k) => {
      const e = Math.min(1, k * 3);
      ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 0.8;
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(780, 560 - 300 * e, 40, 300 * e);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(780, 560 - 300 * e, 12, 300 * e);
    });
    await wait(350);
  };
  LIB.susanoo = async (B, u) => {
    NR.audio.sfx('charge');
    FX.add(1.3, (ctx, k, t) => {
      lighter(ctx);
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
      glow(ctx, u.cx, u.cy - 40, 200, '#9a5aff', 0.7);
      ctx.strokeStyle = 'rgba(200,160,255,0.8)';
      ctx.lineWidth = 6;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(u.cx, u.cy - 40, 60 + i * 14, 110 - i * 10, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    });
    await wait(600);
  };
  LIB.mind = async (B, u, ts) => {
    NR.audio.sfx('debuff');
    for (const t of ts) {
      FX.add(0.9, (ctx, k, tt) => {
        lighter(ctx);
        ctx.globalAlpha = Math.sin(k * Math.PI);
        for (let i = 0; i < 3; i++) spiral(ctx, t.cx, t.cy - 30, 60 - i * 12, tt * 8 + i * 2, '#e8a8ff', 3, 2);
      });
    }
    await wait(380);
  };
  LIB.petals = async (B, u, ts) => {
    NR.audio.sfx('wind');
    for (const t of ts) for (let i = 0; i < 16; i++) FX.parts.add({ type: 'petal', x: u.cx + U.rand(-40, 40), y: u.cy + U.rand(-40, 40), vx: (t.cx - u.cx) * 1.5 + U.rand(-60, 60), vy: (t.cy - u.cy) * 1.5 + U.rand(-60, 60), life: 0.8, size: 5, rot: 0, vr: 8, seed: i, color: U.pick(['#ffc4d8', '#ffffff', '#ffb0c8']) });
    await wait(500);
  };
  LIB.buff = async (B, u) => {
    NR.audio.sfx('buff');
    for (let i = 0; i < 3; i++) setTimeout(() => ring(u.cx, u.fy - i * 30, 30, 70, '#ffd28a', 0.6, 5), i * 120);
    await wait(300);
  };
  LIB.debuff = async (B, u, ts) => {
    NR.audio.sfx('debuff');
    for (const t of ts) for (let i = 0; i < 3; i++) setTimeout(() => ring(t.cx, t.cy - 60 + i * 30, 70, 30, '#8a5aff', 0.6, 5), i * 120);
    await wait(300);
  };
  LIB.drain = async (B, u, ts) => {
    NR.audio.sfx('poison');
    for (const t of ts) {
      FX.add(0.9, (ctx, k) => {
        lighter(ctx);
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.strokeStyle = '#9a5aff';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(u.cx, u.cy);
          ctx.quadraticCurveTo((u.cx + t.cx) / 2 + (i - 1) * 60, (u.cy + t.cy) / 2 - 80, t.cx, t.cy);
          ctx.stroke();
        }
        glow(ctx, t.cx, t.cy, 80, '#6a2aff', 0.6);
      });
      for (let i = 0; i < 12; i++) FX.parts.add({ type: 'spark', x: t.cx, y: t.cy, vx: (u.cx - t.cx) * 1.2 + U.rand(-40, 40), vy: (u.cy - t.cy) * 1.2 + U.rand(-40, 40), life: 0.8, size: 3, color: '#b58cff' });
    }
    await wait(380);
  };
  LIB.water = async (B, u, ts) => {
    NR.audio.sfx('water');
    const t = ts[0];
    await projectile({ x: u.cx, y: u.cy }, { x: t.cx, y: t.cy }, 0.35, (ctx, x, y) => {
      glow(ctx, x, y, 40, '#5ab0ff', 0.9);
      ctx.fillStyle = 'rgba(220,240,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, TAU);
      ctx.fill();
    });
    burst(t.cx, t.cy, 18, { type: 'spark', speed: 260, life: 0.5, size: 3.5, color: '#9ad4ff', gravity: 600 });
    ring(t.cx, t.cy, 10, 90, '#9ad4ff', 0.4, 6);
  };
  LIB.water_big = async (B, u, ts) => {
    NR.audio.sfx('water');
    const dir = ts[0].cx > u.cx ? 1 : -1;
    FX.add(1.1, (ctx, k) => {
      const x = U.lerp(u.cx, u.cx + dir * 900, k);
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
      const g = ctx.createLinearGradient(x - 200, 0, x + 200, 0);
      g.addColorStop(0, 'rgba(60,140,220,0)');
      g.addColorStop(0.5, 'rgba(120,190,255,0.85)');
      g.addColorStop(1, 'rgba(60,140,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 200, H * 0.82);
      ctx.quadraticCurveTo(x, H * 0.3, x + 200, H * 0.82);
      ctx.fill();
    });
    await wait(560);
    NR.engine.shake(10, 0.4);
    for (const t of ts) burst(t.cx, t.cy, 12, { type: 'spark', speed: 240, life: 0.5, size: 3.5, color: '#9ad4ff', gravity: 600 });
  };
  LIB.moon = async (B, u, ts) => {
    NR.audio.sfx('charge');
    for (const t of ts) {
      FX.add(0.8, (ctx, k) => {
        lighter(ctx);
        ctx.globalAlpha = Math.sin(k * Math.PI);
        const g = ctx.createLinearGradient(t.cx - 40, 0, t.cx + 40, 0);
        g.addColorStop(0, 'rgba(200,170,255,0)');
        g.addColorStop(0.5, 'rgba(230,210,255,0.9)');
        g.addColorStop(1, 'rgba(200,170,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(t.cx - 50, 0, 100, t.fy);
        glow(ctx, t.cx, t.fy - 20, 90, '#b58cff', 0.7);
      });
    }
    await wait(420);
    NR.audio.sfx('explosion');
    NR.engine.shake(8, 0.3);
  };
  LIB.chains = async (B, u, ts) => {
    NR.audio.sfx('guard');
    for (const t of ts) {
      FX.add(1, (ctx, k) => {
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.strokeStyle = '#e8c04a';
        ctx.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(t.cx, t.cy - 20 + i * 26, 60, 18, 0.2 * (i - 1), 0, TAU * Math.min(1, k * 2));
          ctx.stroke();
        }
      });
    }
    await wait(420);
  };
  LIB.guard = async (B, u) => {
    NR.audio.sfx('guard');
    ring(u.cx, u.cy, 30, 70, '#9ad4ff', 0.4, 5);
  };
  LIB.item = async (B, u, ts) => {
    NR.audio.sfx('heal');
    for (const t of ts) starburst(t.cx, t.cy, 40, '#fff6c0');
    await wait(150);
  };

  FX.play = async function (name, B, user, targets, sk) {
    const f = LIB[name] || LIB.hit;
    try {
      await f(B, user, targets, sk);
    } catch (e) {
      console.warn('fx', name, e);
    }
  };
  FX.has = (n) => !!LIB[n];
})();
