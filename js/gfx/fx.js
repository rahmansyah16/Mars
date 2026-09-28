// Lighting (time of day, lamps, torches), weather/ambient particles and emote balloons.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const FX = (NR.fx = {});

  // ---------- lighting ----------
  let lc = null, lctx = null;
  const LS = 0.5; // light buffer scale (soft light looks fine at half res)
  function ensureLight() {
    const w = Math.ceil(NR.W * LS), h = Math.ceil(NR.H * LS);
    if (!lc || lc.width !== w) {
      lc = U.canvas(w, h);
      lctx = lc.getContext('2d');
    }
  }

  // Time-of-day presets for outdoor maps.
  FX.TOD = {
    morning: { dark: 0.0, color: '#0a1030', tint: 'rgba(255,236,200,0.08)', tintOp: 'soft-light' },
    day: { dark: 0.0, color: '#0a1030', tint: null },
    evening: { dark: 0.22, color: '#3a1840', tint: 'rgba(255,140,70,0.26)', tintOp: 'soft-light' },
    night: { dark: 0.64, color: '#070c2a', tint: 'rgba(80,110,200,0.16)', tintOp: 'soft-light' },
  };

  // lights: [{x,y (world px), r, color, a, flicker, night}]
  FX.drawLighting = function (ctx, cam, dark, color, lights, time) {
    if (dark <= 0.01) return;
    ensureLight();
    const w = lc.width, h = lc.height;
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, w, h);
    lctx.fillStyle = U.rgba(color, dark);
    lctx.fillRect(0, 0, w, h);
    lctx.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const f = l.flicker ? 1 + Math.sin(time * 11 + l.x) * 0.04 + Math.sin(time * 23 + l.y) * 0.03 : 1;
      const r = l.r * f * LS;
      const x = (l.x - cam.x) * LS, y = (l.y - cam.y) * LS;
      if (x < -r || y < -r || x > w + r || y > h + r) continue;
      const g = lctx.createRadialGradient(x, y, 0, x, y, r);
      const a = U.clamp(l.a != null ? l.a : 1, 0, 1);
      g.addColorStop(0, `rgba(0,0,0,${a})`);
      g.addColorStop(0.45, `rgba(0,0,0,${a * 0.7})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lc, 0, 0, NR.W, NR.H);
    // warm additive glow
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const x = l.x - cam.x, y = l.y - cam.y;
      const r = l.r * 0.7;
      if (x < -r || y < -r || x > NR.W + r || y > NR.H + r) continue;
      const f = l.flicker ? 0.9 + Math.sin(time * 13 + l.x) * 0.1 : 1;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, U.rgba(l.color || '#ffc870', 0.32 * dark * f * (l.a != null ? l.a : 1)));
      g.addColorStop(1, U.rgba(l.color || '#ffc870', 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  };

  FX.drawTint = function (ctx, tint, op) {
    if (!tint) return;
    ctx.save();
    ctx.globalCompositeOperation = op || 'source-over';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, NR.W, NR.H);
    ctx.restore();
  };

  FX.vignette = function (ctx, strength = 0.35) {
    const g = ctx.createRadialGradient(NR.W / 2, NR.H / 2, NR.H * 0.35, NR.W / 2, NR.H / 2, NR.W * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, NR.W, NR.H);
  };

  // ---------- particles ----------
  class Particles {
    constructor() {
      this.list = [];
      this.weather = null;
      this.acc = 0;
      this.emitters = [];
    }
    clear() {
      this.list.length = 0;
    }
    add(p) {
      if (this.list.length > 900) return;
      p.age = 0;
      p.rot = p.rot || 0;
      p.vr = p.vr || 0;
      this.list.push(p);
    }
    setWeather(w) {
      this.weather = w || null;
    }
    burst(x, y, n, opts) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, s = (opts.speed || 120) * (0.4 + Math.random() * 0.6);
        this.add(Object.assign({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opts.up || 0), life: opts.life || 0.8 }, opts, { x, y }));
      }
    }
    update(dt, cam, map) {
      // weather spawning in screen space (world coordinates around camera)
      const w = this.weather;
      if (w) {
        const rate = { leaves: 5, petals: 9, fireflies: 3, rain: 90, dust: 3, embers: 6, fog: 0.8, snow: 20, sparkles: 4 }[w] || 0;
        this.acc += dt * rate;
        while (this.acc > 1) {
          this.acc--;
          this.spawnWeather(w, cam);
        }
      }
      for (const e of this.emitters) {
        e.acc = (e.acc || 0) + dt * (e.rate || 6);
        while (e.acc > 1) {
          e.acc--;
          const x = (e.x + Math.random() * (e.w || 1)) * NR.TS, y = (e.y + Math.random() * (e.h || 1)) * NR.TS;
          if (x < cam.x - 100 || x > cam.x + NR.W + 100 || y < cam.y - 100 || y > cam.y + NR.H + 150) continue;
          if (e.type === 'steam') this.add({ type: 'steam', x, y, vx: U.rand(-6, 6), vy: U.rand(-26, -14), life: U.rand(2.4, 3.6), size: U.rand(16, 30) });
          else if (e.type === 'smoke') this.add({ type: 'smoke', x, y, vx: U.rand(-4, 8), vy: U.rand(-30, -18), life: U.rand(2.5, 4), size: U.rand(10, 18) });
          else if (e.type === 'sparkle') this.add({ type: 'spark', x, y, vx: U.rand(-10, 10), vy: U.rand(-40, -10), life: U.rand(0.6, 1.2), size: U.rand(2, 4), color: e.color || '#b58cff' });
          else if (e.type === 'embers') this.add({ type: 'ember', x, y, vx: U.rand(-10, 10), vy: U.rand(-60, -30), life: U.rand(0.8, 1.6), size: U.rand(1.5, 3) });
        }
      }
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        p.age += dt;
        if (p.age >= p.life) {
          L.splice(i, 1);
          continue;
        }
        if (p.gravity) p.vy += p.gravity * dt;
        if (p.drag) {
          p.vx *= 1 - p.drag * dt;
          p.vy *= 1 - p.drag * dt;
        }
        if (p.type === 'leaf' || p.type === 'petal') {
          p.vx += Math.sin(p.age * 2 + p.seed) * 14 * dt;
        } else if (p.type === 'firefly') {
          p.vx += (Math.random() - 0.5) * 60 * dt;
          p.vy += (Math.random() - 0.5) * 60 * dt;
          p.vx *= 0.98;
          p.vy *= 0.98;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
    }
    spawnWeather(w, cam) {
      const x = cam.x + Math.random() * (NR.W + 200) - 100, y = cam.y - 30;
      switch (w) {
        case 'leaves':
          this.add({ type: 'leaf', x, y: cam.y + Math.random() * NR.H * 0.3 - 40, vx: U.rand(20, 60), vy: U.rand(26, 48), life: 9, size: U.rand(4, 7), rot: Math.random() * 6, vr: U.rand(-3, 3), seed: Math.random() * 9, color: U.pick(['#7ab84a', '#9acc5a', '#e0a040', '#c87a30']) });
          break;
        case 'petals':
          this.add({ type: 'petal', x, y: cam.y + Math.random() * NR.H * 0.3 - 40, vx: U.rand(20, 50), vy: U.rand(28, 50), life: 9, size: U.rand(3, 5), rot: Math.random() * 6, vr: U.rand(-4, 4), seed: Math.random() * 9, color: U.pick(['#ffc4d8', '#ffd8e6', '#ffb0c8', '#fff0f4']) });
          break;
        case 'fireflies':
          this.add({ type: 'firefly', x: cam.x + Math.random() * NR.W, y: cam.y + Math.random() * NR.H, vx: 0, vy: 0, life: U.rand(4, 7), size: U.rand(1.6, 2.6) });
          break;
        case 'rain':
          this.add({ type: 'rain', x: x + 100, y: cam.y - 20, vx: -120, vy: 900, life: 1.2, size: 1 });
          break;
        case 'dust':
          this.add({ type: 'dust', x: cam.x + Math.random() * NR.W, y: cam.y + Math.random() * NR.H, vx: U.rand(-6, 6), vy: U.rand(-6, 2), life: U.rand(4, 7), size: U.rand(1, 2) });
          break;
        case 'embers':
          this.add({ type: 'ember', x: cam.x + Math.random() * NR.W, y: cam.y + NR.H + 10, vx: U.rand(-10, 10), vy: U.rand(-50, -30), life: 8, size: U.rand(1.5, 3) });
          break;
        case 'fog':
          this.add({ type: 'fog', x: cam.x - 200, y: cam.y + Math.random() * NR.H, vx: U.rand(14, 26), vy: U.rand(-2, 2), life: 60, size: U.rand(140, 260) });
          break;
        case 'sparkles':
          this.add({ type: 'spark', x: cam.x + Math.random() * NR.W, y: cam.y + Math.random() * NR.H, vx: 0, vy: -8, life: 1.5, size: U.rand(1.5, 3), color: '#fff6c0' });
          break;
      }
    }
    draw(ctx, cam, layer) {
      const t = NR.engine.time;
      for (const p of this.list) {
        const x = p.x - (p.screen ? 0 : cam.x), y = p.y - (p.screen ? 0 : cam.y);
        if (x < -300 || y < -300 || x > NR.W + 300 || y > NR.H + 300) continue;
        const k = p.age / p.life;
        const fade = Math.min(1, p.age * 3, (p.life - p.age) * 2);
        switch (p.type) {
          case 'leaf':
          case 'petal': {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(p.rot);
            ctx.scale(1, Math.abs(Math.sin(p.rot * 1.3)) * 0.7 + 0.3);
            ctx.globalAlpha = fade;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            if (p.type === 'leaf') ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, U.TAU);
            else {
              ctx.moveTo(0, -p.size);
              ctx.quadraticCurveTo(p.size, 0, 0, p.size);
              ctx.quadraticCurveTo(-p.size, 0, 0, -p.size);
            }
            ctx.fill();
            ctx.restore();
            break;
          }
          case 'firefly': {
            const a = fade * (0.5 + Math.sin(t * 5 + p.x) * 0.5);
            const g = ctx.createRadialGradient(x, y, 0, x, y, p.size * 6);
            g.addColorStop(0, `rgba(230,255,140,${a})`);
            g.addColorStop(1, 'rgba(230,255,140,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - p.size * 6, y - p.size * 6, p.size * 12, p.size * 12);
            break;
          }
          case 'steam':
          case 'smoke': {
            const s = p.size * (1 + k * 1.6);
            const a = (p.type === 'steam' ? 0.22 : 0.3) * Math.sin(k * Math.PI);
            const col = p.type === 'steam' ? '255,255,255' : '90,90,100';
            const g = ctx.createRadialGradient(x, y, 0, x, y, s);
            g.addColorStop(0, `rgba(${col},${a})`);
            g.addColorStop(1, `rgba(${col},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(x - s, y - s, s * 2, s * 2);
            break;
          }
          case 'fog': {
            const a = 0.12 * Math.min(1, p.age / 4, (p.life - p.age) / 4);
            const g = ctx.createRadialGradient(x, y, 0, x, y, p.size);
            g.addColorStop(0, `rgba(220,230,240,${a})`);
            g.addColorStop(1, 'rgba(220,230,240,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
            break;
          }
          case 'rain':
            ctx.strokeStyle = 'rgba(190,210,240,0.45)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + p.vx * 0.02, y + p.vy * 0.02);
            ctx.stroke();
            break;
          case 'dust':
            ctx.fillStyle = `rgba(255,245,210,${0.5 * fade})`;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, U.TAU);
            ctx.fill();
            break;
          case 'ember':
          case 'spark': {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const col = p.color || '#ffb040';
            const g = ctx.createRadialGradient(x, y, 0, x, y, p.size * 4);
            g.addColorStop(0, U.rgba(col, 0.9 * fade));
            g.addColorStop(1, U.rgba(col, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x - p.size * 4, y - p.size * 4, p.size * 8, p.size * 8);
            ctx.restore();
            break;
          }
          case 'heart': {
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(x, y);
            ctx.scale(p.size / 10, p.size / 10);
            FX.heartPath(ctx);
            ctx.fillStyle = p.color || '#ff5a8a';
            ctx.fill();
            ctx.restore();
            break;
          }
          case 'poof': {
            const s = p.size * (0.6 + k * 1.2);
            ctx.globalAlpha = (1 - k) * 0.85;
            ctx.fillStyle = p.color || '#f2f2f6';
            ctx.beginPath();
            ctx.arc(x, y, s, 0, U.TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
            break;
          }
        }
      }
    }
  }
  FX.Particles = Particles;

  FX.heartPath = function (ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-10, -4, -6, -12, 0, -6);
    ctx.bezierCurveTo(6, -12, 10, -4, 0, 3);
    ctx.closePath();
  };

  // ---------- emote balloons ----------
  FX.drawBalloon = function (ctx, x, y, kind, t) {
    // t: 0..1 animation progress (pop in)
    const s = t < 0.15 ? U.ease.outBack(t / 0.15) : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2a1c22';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -18, 20, 16, 0, 0, U.TAU);
    ctx.moveTo(-5, -4);
    ctx.lineTo(0, 6);
    ctx.lineTo(5, -4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -6, 8, 4);
    const k = NR.engine.time;
    switch (kind) {
      case '!':
        ctx.fillStyle = '#e8321e';
        ctx.fillRect(-3, -30, 6, 15);
        ctx.fillRect(-3, -12, 6, 5);
        break;
      case '?':
        ctx.fillStyle = '#2f6fd0';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, -17);
        break;
      case 'heart':
        ctx.save();
        ctx.translate(0, -16);
        ctx.scale(1.2 + Math.sin(k * 8) * 0.08, 1.2 + Math.sin(k * 8) * 0.08);
        FX.heartPath(ctx);
        ctx.fillStyle = '#ff4a7a';
        ctx.fill();
        ctx.restore();
        break;
      case 'anger':
        ctx.strokeStyle = '#e8321e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (const [a, b, c, d] of [[-9, -24, -3, -20], [3, -20, 9, -24], [-9, -12, -3, -16], [3, -16, 9, -12]]) {
          ctx.moveTo(a, b);
          ctx.quadraticCurveTo(0, -18, c, d);
        }
        ctx.stroke();
        break;
      case '...':
        ctx.fillStyle = '#444';
        for (let i = -1; i <= 1; i++) {
          if ((k * 3) % 3 < i + 2) {
            ctx.beginPath();
            ctx.arc(i * 8, -17, 3, 0, U.TAU);
            ctx.fill();
          }
        }
        break;
      case 'note':
        ctx.fillStyle = '#7a3ad0';
        ctx.beginPath();
        ctx.ellipse(-3, -12, 5, 4, -0.4, 0, U.TAU);
        ctx.fill();
        ctx.fillRect(1, -30, 3, 18);
        ctx.fillRect(1, -30, 9, 3);
        break;
      case 'sweat':
        ctx.fillStyle = '#5ab0f0';
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.quadraticCurveTo(-9, -14, 0, -10);
        ctx.quadraticCurveTo(9, -14, 0, -30);
        ctx.fill();
        break;
      case 'zzz':
        ctx.fillStyle = '#5a6ad0';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Zz', 0, -12);
        break;
      case 'idea':
        ctx.fillStyle = '#f6c343';
        ctx.beginPath();
        ctx.arc(0, -20, 7, 0, U.TAU);
        ctx.fill();
        ctx.fillRect(-3, -14, 6, 5);
        break;
    }
    ctx.restore();
  };
})();
