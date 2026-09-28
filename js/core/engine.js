// Canvas, main loop, scenes, timers, tweens and full-screen effects.
(function () {
  'use strict';
  const NR = window.NR;
  const U = NR.U;

  NR.W = 1280; // logical resolution
  NR.H = 720;
  NR.TS = 64; // tile size in logical pixels

  const E = (NR.engine = {
    canvas: null,
    ctx: null,
    pr: 1, // backing pixels per logical pixel
    cpr: 1, // pixel ratio used for cached art (quantized)
    time: 0,
    frame: 0,
    scenes: [],
    timers: [],
    tweens: [],
    handlers: {},
    fade: { a: 0, color: '#000' },
    flashFx: { a: 0, color: '#fff', decay: 3 },
    shakeFx: { power: 0, time: 0, x: 0, y: 0 },
    tint: { color: null, a: 0 },
  });

  E.on = (ev, fn) => (E.handlers[ev] = E.handlers[ev] || []).push(fn);
  E.emit = (ev, ...a) => (E.handlers[ev] || []).forEach((fn) => fn(...a));

  E.init = function (canvas) {
    E.canvas = canvas;
    E.ctx = canvas.getContext('2d');
    window.addEventListener('resize', E.resize);
    E.resize();
    E.last = performance.now();
    requestAnimationFrame(E.loop);
  };

  E.resize = function () {
    const ww = window.innerWidth, wh = window.innerHeight;
    const scale = Math.min(ww / NR.W, wh / NR.H);
    const cssW = Math.floor(NR.W * scale), cssH = Math.floor(NR.H * scale);
    const c = E.canvas;
    c.style.width = cssW + 'px';
    c.style.height = cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = Math.max(1, Math.round(cssW * dpr));
    c.height = Math.max(1, Math.round(cssH * dpr));
    E.pr = c.width / NR.W;
    E.cssScale = scale;
    const cpr = U.clamp(Math.ceil(E.pr * 2) / 2, 1, 2.5);
    if (cpr !== E.cpr) {
      E.cpr = cpr;
      E.emit('cprchange', cpr);
    }
  };

  E.loop = function (now) {
    requestAnimationFrame(E.loop);
    let dt = (now - E.last) / 1000;
    E.last = now;
    if (!(dt > 0)) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05;
    try {
      E.update(dt);
      E.draw();
    } catch (err) {
      E.reportError(err);
    }
  };

  E.errors = [];
  E.reportError = function (err) {
    console.error(err);
    if (E.errors.length < 20) E.errors.push(String((err && err.stack) || err));
  };

  E.update = function (dt) {
    E.time += dt;
    E.frame++;
    NR.input.update(dt);
    for (let i = E.timers.length - 1; i >= 0; i--) {
      const t = E.timers[i];
      t.left -= dt * 1000;
      if (t.left <= 0) {
        E.timers.splice(i, 1);
        t.resolve();
      }
    }
    for (let i = E.tweens.length - 1; i >= 0; i--) {
      const t = E.tweens[i];
      t.t += dt * 1000;
      const k = U.clamp(t.t / t.ms, 0, 1);
      const e = t.ease(k);
      for (const p in t.to) t.obj[p] = U.lerp(t.from[p], t.to[p], e);
      if (k >= 1) {
        E.tweens.splice(i, 1);
        t.resolve();
      }
    }
    // screen effects
    const f = E.flashFx;
    if (f.a > 0) f.a = Math.max(0, f.a - dt * f.decay);
    const s = E.shakeFx;
    if (s.time > 0) {
      s.time -= dt;
      const p = s.power * U.clamp(s.time / 0.3, 0, 1);
      s.x = (Math.random() * 2 - 1) * p;
      s.y = (Math.random() * 2 - 1) * p;
    } else s.x = s.y = 0;

    for (const sc of E.scenes) if (sc.update) sc.update(dt, sc === E.top());
    if (NR.ui) NR.ui.update(dt);
    NR.input.endFrame();
  };

  E.draw = function () {
    const ctx = E.ctx, c = E.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(E.pr, 0, 0, E.pr, 0, 0);
    let start = 0;
    for (let i = E.scenes.length - 1; i >= 0; i--) {
      if (E.scenes[i].opaque !== false) {
        start = i;
        break;
      }
    }
    for (let i = start; i < E.scenes.length; i++) {
      const sc = E.scenes[i];
      ctx.save();
      if (sc.shakeable !== false) ctx.translate(E.shakeFx.x, E.shakeFx.y);
      sc.draw(ctx);
      ctx.restore();
    }
    if (E.tint.a > 0 && E.tint.color) {
      ctx.fillStyle = U.rgba(E.tint.color, E.tint.a);
      ctx.fillRect(0, 0, NR.W, NR.H);
    }
    if (NR.ui) NR.ui.draw(ctx);
    if (E.flashFx.a > 0) {
      ctx.fillStyle = U.rgba(E.flashFx.color, E.flashFx.a);
      ctx.fillRect(0, 0, NR.W, NR.H);
    }
    if (E.fade.a > 0) {
      ctx.fillStyle = U.rgba(E.fade.color, E.fade.a);
      ctx.fillRect(0, 0, NR.W, NR.H);
    }
    if (NR.ui && NR.ui.drawTop) NR.ui.drawTop(ctx);
  };

  // ---------- scenes ----------
  E.top = () => E.scenes[E.scenes.length - 1];
  E.push = (sc) => {
    E.scenes.push(sc);
    sc.enter && sc.enter();
  };
  E.pop = () => {
    const sc = E.scenes.pop();
    sc && sc.exit && sc.exit();
    const t = E.top();
    t && t.resume && t.resume();
    return sc;
  };
  E.setScene = (sc) => {
    while (E.scenes.length) {
      const s = E.scenes.pop();
      s.exit && s.exit();
    }
    E.push(sc);
  };

  // ---------- async helpers ----------
  E.wait = (ms) => new Promise((resolve) => E.timers.push({ left: ms, resolve }));
  E.tween = (obj, to, ms, ease = U.ease.inOut) =>
    new Promise((resolve) => {
      const from = {};
      for (const p in to) from[p] = obj[p];
      E.tweens = E.tweens.filter((t) => t.obj !== obj || !Object.keys(t.to).some((k) => k in to));
      E.tweens.push({ obj, from, to, ms: Math.max(1, ms), t: 0, ease, resolve });
    });

  E.fadeOut = (ms = 400, color = '#000') => {
    E.fade.color = color;
    return E.tween(E.fade, { a: 1 }, ms);
  };
  E.fadeIn = (ms = 400) => E.tween(E.fade, { a: 0 }, ms);
  E.flash = (color = '#fff', a = 0.8, decay = 3) => {
    E.flashFx.color = color;
    E.flashFx.a = a;
    E.flashFx.decay = decay;
  };
  E.shake = (power = 8, time = 0.4) => {
    E.shakeFx.power = power;
    E.shakeFx.time = time;
  };
})();
