// Procedural WebAudio music + sound effects. Custom music files (music/<track>.mp3|ogg)
// found by the asset scanner replace the synth track of the same name.
(function () {
  'use strict';
  const NR = window.NR;
  const U = NR.U;

  const A = (NR.audio = { ctx: null, custom: {}, current: null, currentName: null, muted: false });
  let ctx = null, master, musicBus, sfxBus, reverb, noiseBuf;

  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function nf(name) {
    const m = /^([a-g])(#|b)?(-?\d)$/.exec(name);
    if (!m) return 0;
    let n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const oct = +m[3];
    const midi = (oct + 1) * 12 + n;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  A.nf = nf;

  A.unlock = function () {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = A.ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus.connect(master);
    sfxBus.connect(master);
    // soft reverb
    reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2;
    const imp = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = imp.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    reverb.buffer = imp;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    reverb.connect(wet);
    wet.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    A.applyVolumes();
    setInterval(schedule, 30);
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else ctx.resume();
      if (A.htmlAudio) document.hidden ? A.htmlAudio.pause() : A.htmlAudio.play().catch(() => {});
    });
    if (A.pendingBgm) {
      const p = A.pendingBgm;
      A.pendingBgm = null;
      A.playBgm(p, true);
    }
  };

  A.applyVolumes = function () {
    const s = NR.settings;
    if (musicBus) musicBus.gain.value = s.musicVol * 0.6;
    if (sfxBus) sfxBus.gain.value = s.sfxVol * 0.8;
    if (A.htmlAudio) A.htmlAudio.volume = U.clamp(s.musicVol, 0, 1) * (A.duck || 1);
  };

  // ---------- instruments ----------
  function out(dest, gain) {
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect(dest);
    return g;
  }
  function osc(type, f, t) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    return o;
  }
  function noise(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
    return s;
  }
  function adsr(param, t, a, peak, decay, sus, dur, rel) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(peak, t + a);
    param.setTargetAtTime(peak * sus, t + a, Math.max(0.005, decay / 3));
    param.setTargetAtTime(0.0001, t + Math.max(a, dur), Math.max(0.005, rel / 3));
  }

  const INS = {
    lead(t, f, dur, v, dest, send) {
      const g = out(dest, 0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      lp.connect(g);
      const o = osc('triangle', f, t), o2 = osc('sine', f * 2, t);
      const g2 = out(lp, 0.18);
      o.connect(lp);
      o2.connect(g2);
      const lfo = osc('sine', 5.4, t), lg = ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.35, dur));
      lfo.connect(lg);
      lg.connect(o.frequency);
      lg.connect(o2.frequency);
      adsr(g.gain, t, 0.05, 0.32 * v, 0.2, 0.8, dur, 0.18);
      if (send) g.connect(send);
      const end = t + dur + 0.4;
      [o, o2, lfo].forEach((x) => (x.start(t), x.stop(end)));
    },
    pluck(t, f, dur, v, dest, send) {
      const g = out(dest, 0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 2;
      lp.frequency.setValueAtTime(5200, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + 0.35);
      lp.connect(g);
      const o = osc('sawtooth', f, t), o2 = osc('triangle', f * 1.003, t);
      o.connect(lp);
      o2.connect(lp);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.26 * v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(1.4, 0.5 + dur));
      if (send) g.connect(send);
      const end = t + 1.5;
      [o, o2].forEach((x) => (x.start(t), x.stop(end)));
    },
    shamisen(t, f, dur, v, dest, send) {
      const g = out(dest, 0);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = Math.min(4000, f * 3);
      bp.Q.value = 1.2;
      bp.connect(g);
      const o = osc('square', f, t);
      o.frequency.setValueAtTime(f * 1.02, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
      o.connect(bp);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.34 * v, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      if (send) g.connect(send);
      o.start(t);
      o.stop(t + 0.5);
    },
    piano(t, f, dur, v, dest, send) {
      const g = out(dest, 0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2600, t);
      lp.frequency.exponentialRampToValueAtTime(900, t + 1.2);
      lp.connect(g);
      const o = osc('triangle', f, t), o2 = osc('sine', f * 2, t), o3 = osc('sine', f * 0.5, t);
      const g2 = out(lp, 0.22), g3 = out(lp, 0.25);
      o.connect(lp);
      o2.connect(g2);
      o3.connect(g3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.3 * v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(1.2, dur + 0.8));
      if (send) g.connect(send);
      const end = t + Math.max(1.3, dur + 0.9);
      [o, o2, o3].forEach((x) => (x.start(t), x.stop(end)));
    },
    bell(t, f, dur, v, dest, send) {
      const parts = [[1, 1, 1.6], [2.0, 0.45, 0.9], [3.01, 0.22, 0.5], [4.2, 0.12, 0.3]];
      const g = out(dest, 0.2 * v);
      if (send) g.connect(send);
      for (const [m, a, d] of parts) {
        const o = osc('sine', f * m, t), pg = out(g, 0);
        o.connect(pg);
        pg.gain.setValueAtTime(0.0001, t);
        pg.gain.linearRampToValueAtTime(a, t + 0.003);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + d * 1.3);
        o.start(t);
        o.stop(t + d * 1.3 + 0.05);
      }
    },
    pad(t, f, dur, v, dest, send) {
      const g = out(dest, 0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 950;
      lp.Q.value = 0.6;
      lp.connect(g);
      const o = osc('sawtooth', f, t), o2 = osc('sawtooth', f, t);
      o.detune.value = -8;
      o2.detune.value = 8;
      o.connect(lp);
      o2.connect(lp);
      adsr(g.gain, t, 0.45, 0.07 * v, 0.6, 0.85, dur, 0.9);
      if (send) g.connect(send);
      const end = t + dur + 1.2;
      [o, o2].forEach((x) => (x.start(t), x.stop(end)));
    },
    bass(t, f, dur, v, dest) {
      const g = out(dest, 0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      lp.connect(g);
      const o = osc('triangle', f, t), o2 = osc('sine', f, t);
      o.connect(lp);
      o2.connect(lp);
      adsr(g.gain, t, 0.01, 0.42 * v, 0.25, 0.6, dur * 0.9, 0.08);
      const end = t + dur + 0.3;
      [o, o2].forEach((x) => (x.start(t), x.stop(end)));
    },
    sbass(t, f, dur, v, dest) {
      const g = out(dest, 0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 4;
      lp.frequency.setValueAtTime(1600, t);
      lp.frequency.exponentialRampToValueAtTime(320, t + 0.18);
      lp.connect(g);
      const o = osc('sawtooth', f, t);
      o.connect(lp);
      adsr(g.gain, t, 0.005, 0.3 * v, 0.12, 0.5, dur * 0.8, 0.05);
      o.start(t);
      o.stop(t + dur + 0.2);
    },
    taiko(t, f, dur, v, dest, send) {
      const g = out(dest, 0);
      const o = osc('sine', 150, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.28);
      o.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.9 * v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      const n = noise(t, 0.12), lp = ctx.createBiquadFilter(), ng = out(dest, 0);
      lp.type = 'lowpass';
      lp.frequency.value = 500;
      n.connect(lp);
      lp.connect(ng);
      ng.gain.setValueAtTime(0.5 * v, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      if (send) g.connect(send);
      o.start(t);
      o.stop(t + 0.6);
    },
    kick(t, f, dur, v, dest) {
      const g = out(dest, 0);
      const o = osc('sine', 130, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      o.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.8 * v, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t);
      o.stop(t + 0.32);
    },
    snare(t, f, dur, v, dest, send) {
      const n = noise(t, 0.2), hp = ctx.createBiquadFilter(), g = out(dest, 0);
      hp.type = 'highpass';
      hp.frequency.value = 1200;
      n.connect(hp);
      hp.connect(g);
      g.gain.setValueAtTime(0.35 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      const o = osc('triangle', 190, t), og = out(dest, 0);
      o.connect(og);
      og.gain.setValueAtTime(0.3 * v, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      if (send) g.connect(send);
      o.start(t);
      o.stop(t + 0.1);
    },
    hat(t, f, dur, v, dest) {
      const n = noise(t, 0.06), hp = ctx.createBiquadFilter(), g = out(dest, 0);
      hp.type = 'highpass';
      hp.frequency.value = 7500;
      n.connect(hp);
      hp.connect(g);
      g.gain.setValueAtTime(0.18 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    },
    shaker(t, f, dur, v, dest) {
      const n = noise(t, 0.08), bp = ctx.createBiquadFilter(), g = out(dest, 0);
      bp.type = 'bandpass';
      bp.frequency.value = 5200;
      bp.Q.value = 1.5;
      n.connect(bp);
      bp.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14 * v, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    },
    clap(t, f, dur, v, dest, send) {
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.011;
        const n = noise(tt, 0.1), bp = ctx.createBiquadFilter(), g = out(dest, 0);
        bp.type = 'bandpass';
        bp.frequency.value = 1500;
        n.connect(bp);
        bp.connect(g);
        g.gain.setValueAtTime(0.3 * v, tt);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + (i === 2 ? 0.12 : 0.02));
        if (send && i === 2) g.connect(send);
      }
    },
  };
  A.INS = INS;

  // ---------- music tracks ----------
  // Tokens: note (e.g. d5), chord "d3+f3+a3", "." rest, "_" hold previous. Drum hits: x (normal), X (accent).
  const T = {
    title: {
      bpm: 88,
      ch: [
        { ins: 'pad', per: 16, v: 1, n: 'd3+a3+f4 a#2+f3+d4 c3+g3+e4 a2+e3+c4 d3+a3+f4 a#2+f3+d4 c3+g3+e4 a2+e3+c#4' },
        { ins: 'lead', per: 2, v: 0.9, n: 'd5 _ _ _ f5 . e5 d5 d5 _ c5 . a#4 _ _ . c5 . d5 . e5 . g5 . e5 _ _ _ _ _ . . d5 _ _ _ a5 . g5 f5 f5 _ e5 . d5 _ _ . e5 . f5 . g5 . a5 . a5 _ _ _ c#5 _ _ .' },
        { ins: 'bass', per: 4, v: 0.9, n: 'd2 . d2 a2 a#1 . a#1 f2 c2 . c2 g2 a1 . a1 e2 d2 . d2 a2 a#1 . a#1 f2 c2 . c2 g2 a1 . e2 c#2' },
        { ins: 'taiko', per: 1, v: 0.8, n: 'X.......x.x.X...' },
        { ins: 'shaker', per: 2, v: 0.5, n: '. x . x . x . x' },
      ],
    },
    village: {
      bpm: 104,
      ch: [
        { ins: 'pad', per: 16, v: 0.8, n: 'g3+b3+d4 e3+g3+b3 c3+e3+g3 d3+f#3+a3 g3+b3+d4 e3+g3+b3 a2+c3+e3 d3+f#3+a3' },
        { ins: 'pluck', per: 2, v: 0.9, n: 'd5 . b4 d5 e5 . d5 b4 g5 . e5 . d5 b4 a4 . e5 . g5 e5 d5 . b4 a4 a4 b4 d5 . a4 _ _ . d5 . b4 d5 e5 . g5 a5 b5 . a5 g5 e5 . d5 . e5 d5 b4 a4 g4 . a4 b4 a4 _ _ . d5 . . .' },
        { ins: 'bass', per: 4, v: 0.8, n: 'g2 . d3 . e2 . b2 . c3 . g2 . d3 . a2 . g2 . d3 . e2 . b2 . a2 . e3 . d3 . f#3 d3' },
        { ins: 'hat', per: 1, v: 0.6, n: '..x...x...x...x.' },
        { ins: 'shaker', per: 1, v: 0.5, n: 'x.xx' },
        { ins: 'taiko', per: 1, v: 0.35, n: 'x.......x.....x.' },
      ],
    },
    forest: {
      bpm: 76,
      ch: [
        { ins: 'pad', per: 16, v: 1, n: 'e3+b3+e4 f3+c4+a4 a2+e3+c4 b2+f3+b3' },
        { ins: 'lead', per: 2, v: 0.7, n: 'b4 _ _ . c5 . a4 . f4 _ _ _ . . e4 . a4 . b4 . c5 _ e5 . b4 _ _ _ _ _ . .' },
        { ins: 'bell', per: 4, v: 0.6, n: 'e6 . . . . . a5 . . c6 . . . . . .' },
        { ins: 'shaker', per: 2, v: 0.25, n: 'x . . x . . x .' },
      ],
    },
    battle: {
      bpm: 150,
      ch: [
        { ins: 'pad', per: 16, v: 0.7, n: 'a2+e3+c4 f2+c3+a3 g2+d3+b3 e2+b2+g#3' },
        { ins: 'sbass', per: 2, v: 1, n: 'a2 a2 a3 a2 a2 a2 g2 a2 f2 f2 f3 f2 f2 f2 e2 f2 g2 g2 g3 g2 g2 g2 f2 g2 e2 e2 e3 e2 g#2 g#2 b2 e3' },
        { ins: 'lead', per: 2, v: 0.8, n: 'a4 . c5 . e5 . d5 c5 c5 _ a4 . f4 . a4 . b4 . d5 . g5 . f5 e5 e5 _ _ _ g#4 _ b4 _' },
        { ins: 'kick', per: 1, v: 1, n: 'x...x...x...x..x' },
        { ins: 'snare', per: 1, v: 0.8, n: '....x.......x...' },
        { ins: 'hat', per: 1, v: 0.7, n: 'x.x.x.x.x.x.x.xx' },
        { ins: 'taiko', per: 1, v: 0.6, n: 'X...............' },
      ],
    },
    boss: {
      bpm: 164,
      ch: [
        { ins: 'pad', per: 16, v: 0.8, n: 'e2+b2+g3 f2+c3+a3 e2+b2+g3 d2+a2+f#3' },
        { ins: 'sbass', per: 2, v: 1, n: 'e2 e2 e3 e2 f2 e2 e3 e2 f2 f2 f3 f2 g2 f2 f3 f2 e2 e2 e3 e2 f2 e2 g2 e2 d2 d2 d3 d2 f2 e2 d2 b1' },
        { ins: 'lead', per: 2, v: 0.85, n: 'e5 . . e5 f5 . g5 . a5 _ _ . g5 f5 e5 . e5 . . e5 f5 . b5 . a5 _ g5 _ f5 _ d5 _' },
        { ins: 'kick', per: 1, v: 1, n: 'x..xx...x..xx...' },
        { ins: 'snare', per: 1, v: 0.85, n: '....x.......x.x.' },
        { ins: 'hat', per: 1, v: 0.5, n: 'xxxxxxxxxxxxxxxx' },
        { ins: 'taiko', per: 1, v: 0.8, n: 'X.......X.......' },
      ],
    },
    romance: {
      bpm: 68,
      ch: [
        { ins: 'pad', per: 16, v: 0.8, n: 'f3+a3+c4+e4 e3+g3+b3+d4 d3+f3+a3+c4 c3+e3+g3+d4' },
        { ins: 'piano', per: 2, v: 0.75, n: 'f3 c4 a4 c4 e4 c4 a4 c4 e3 b3 g4 b3 d4 b3 g4 b3 d3 a3 f4 a3 c4 a3 f4 a3 c3 g3 e4 g3 d4 g3 e4 g3' },
        { ins: 'bell', per: 4, v: 0.55, n: 'a5 _ g5 f5 g5 _ _ e5 f5 _ e5 d5 e5 _ _ _' },
      ],
    },
    night: {
      bpm: 70,
      ch: [
        { ins: 'pad', per: 16, v: 0.9, n: 'a2+e3+c4 f2+c3+a3 a2+e3+b3 e2+b2+e3' },
        { ins: 'pluck', per: 2, v: 0.7, n: 'e5 . c5 . b4 _ a4 . c5 . . f5 e5 _ . . e5 . c5 b4 a4 . b4 . a4 _ _ _ . . . .' },
      ],
    },
    onsen: {
      bpm: 84,
      ch: [
        { ins: 'pad', per: 16, v: 0.8, n: 'd3+a3+e4 g3+b3+d4 e3+b3+g4 a2+e3+b3' },
        { ins: 'pluck', per: 2, v: 0.75, n: 'a4 . d5 . e5 d5 b4 . d5 . g5 . e5 _ d5 . b4 . a4 . g4 . e4 . a4 _ _ _ d5 _ _ .' },
        { ins: 'bell', per: 8, v: 0.4, n: 'e6 . b5 . d6 . a5 .' },
      ],
    },
    dungeon: {
      bpm: 64,
      ch: [
        { ins: 'pad', per: 32, v: 1, n: 'c#2+g#2+d3 a1+e2+a#2' },
        { ins: 'bell', per: 4, v: 0.5, n: 'c#5 . . . d5 . . . . . g#4 . . . . .' },
        { ins: 'taiko', per: 1, v: 0.45, n: 'x.......................x.......' },
        { ins: 'bass', per: 8, v: 0.5, n: 'c#2 . d2 . a1 . a#1 .' },
      ],
    },
    sad: {
      bpm: 64,
      ch: [
        { ins: 'pad', per: 16, v: 0.9, n: 'a2+e3+c4 f2+c3+a3 c3+g3+e4 g2+d3+b3' },
        { ins: 'lead', per: 2, v: 0.7, n: 'e5 _ _ _ d5 c5 b4 . c5 _ _ _ a4 _ _ . g4 . a4 . c5 . e5 . d5 _ _ _ _ _ . .' },
        { ins: 'piano', per: 4, v: 0.4, n: 'a3 e4 a3 e4 f3 c4 f3 c4 c4 g4 c4 g4 g3 d4 g3 d4' },
      ],
    },
    festival: {
      bpm: 120,
      ch: [
        { ins: 'taiko', per: 1, v: 0.9, n: 'X..x..X.x.X..x..' },
        { ins: 'shamisen', per: 2, v: 0.9, n: 'g4 . a4 b4 d5 . b4 a4 g4 . e4 . d4 . e4 . g4 . a4 b4 d5 . e5 d5 b4 . a4 . g4 _ _ .' },
        { ins: 'lead', per: 4, v: 0.7, n: 'd5 _ e5 _ b4 _ _ _ d5 _ g5 _ e5 _ d5 _' },
        { ins: 'bass', per: 4, v: 0.7, n: 'g2 . d3 . e2 . b2 . g2 . d3 . c3 . d3 .' },
        { ins: 'clap', per: 1, v: 0.5, n: '....x.......x...' },
      ],
    },
    tension: {
      bpm: 96,
      ch: [
        { ins: 'pad', per: 16, v: 1, n: 'd3+a3+d4 d#3+a#3+d4 d3+a3+d4 c3+g3+c4' },
        { ins: 'sbass', per: 2, v: 0.7, n: 'd2 d2 d2 d2 d2 d2 d#2 d2 d#2 d#2 d#2 d#2 d#2 d#2 d2 d#2 d2 d2 d2 d2 d2 d2 d#2 d2 c2 c2 c2 c2 c2 c2 c#2 d2' },
        { ins: 'taiko', per: 1, v: 0.7, n: 'x.......x.......' },
      ],
    },
    victory: {
      bpm: 132,
      loop: false,
      ch: [
        { ins: 'pluck', per: 1, v: 1, n: 'g4 . b4 . d5 . g5 _ _ _ d5 . g5 _ _ _ a5 _ _ _ b5 _ _ _ _ _ _ _ . . . .' },
        { ins: 'bell', per: 2, v: 0.8, n: 'g5 . . . b5 . d6 _ _ _ g6 _ _ _ . .' },
        { ins: 'bass', per: 4, v: 0.8, n: 'g2 . d3 . c3 . d3 . g2 . . .' },
        { ins: 'taiko', per: 1, v: 0.7, n: 'X...x...x...X.......X...........' },
      ],
    },
    gameover: {
      bpm: 60,
      loop: false,
      ch: [
        { ins: 'pad', per: 16, v: 1, n: 'a2+e3+c4 f2+c3+a3 e2+b2+g#3 _' },
        { ins: 'lead', per: 2, v: 0.8, n: 'e5 _ _ _ d5 _ c5 _ c5 _ _ _ b4 _ a4 _ g#4 _ _ _ _ _ _ _ . . . . . . . .' },
      ],
    },
  };
  A.tracks = T;

  function parseTrack(tr) {
    if (tr._parsed) return tr;
    let len = 0;
    for (const ch of tr.ch) {
      const toks = ch.n.replace(/\|/g, ' ').trim().split(/\s+/);
      const isDrum = ['taiko', 'kick', 'snare', 'hat', 'shaker', 'clap'].includes(ch.ins);
      const flat = isDrum && toks.length === 1 ? toks[0].split('') : toks;
      ch.toks = flat;
      ch.drum = isDrum;
      ch.len = flat.length * ch.per;
      len = Math.max(len, ch.len);
    }
    tr.len = len;
    tr._parsed = true;
    return tr;
  }

  function playStep(st, time, stepDur) {
    const tr = st.tr;
    for (const ch of tr.ch) {
      const s = st.step % ch.len;
      if (s % ch.per) continue;
      const i = s / ch.per;
      const tok = ch.toks[i];
      if (!tok || tok === '.' || tok === '_') continue;
      const v = ch.v * (0.9 + Math.random() * 0.12);
      const tt = time + (ch.drum ? 0 : Math.random() * 0.006);
      if (ch.drum) {
        if (tok === 'x' || tok === 'X') INS[ch.ins](tt, 0, stepDur, tok === 'X' ? v * 1.2 : v * 0.85, st.gain, reverb);
        continue;
      }
      let holds = 1;
      while (ch.toks[(i + holds) % ch.toks.length] === '_' && holds < ch.toks.length) holds++;
      const dur = holds * ch.per * stepDur;
      for (const n of tok.split('+')) INS[ch.ins](tt, nf(n), dur, v, st.gain, reverb);
    }
  }

  function schedule() {
    if (!ctx) return;
    for (const st of A.players) {
      if (st.stopped) continue;
      const stepDur = 60 / st.tr.bpm / 4;
      let guard = 0;
      while (st.next < ctx.currentTime + 0.16 && guard++ < 64) {
        playStep(st, st.next, stepDur);
        st.step++;
        st.next += stepDur;
        if (st.step >= st.tr.len) {
          if (st.tr.loop === false) {
            st.stopped = true;
            if (st.onEnd) setTimeout(st.onEnd, (st.next - ctx.currentTime) * 1000 + 600);
            break;
          }
          st.step = 0;
        }
      }
    }
    A.players = A.players.filter((p) => !p.dead);
  }
  A.players = [];

  function stopPlayer(p, fadeMs) {
    if (!p || p.dead) return;
    p.stopped = true;
    const t = ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0.0001, t + fadeMs / 1000);
    setTimeout(() => {
      p.dead = true;
      try {
        p.gain.disconnect();
      } catch (e) {}
    }, fadeMs + 1800);
  }

  function stopHtml(fadeMs) {
    const el = A.htmlAudio;
    if (!el) return;
    A.htmlAudio = null;
    const v0 = el.volume;
    const t0 = performance.now();
    const iv = setInterval(() => {
      const k = (performance.now() - t0) / Math.max(1, fadeMs);
      if (k >= 1) {
        el.pause();
        clearInterval(iv);
      } else el.volume = v0 * (1 - k);
    }, 40);
  }

  A.playBgm = function (name, force) {
    if (!name) return A.stopBgm();
    if (!ctx) {
      A.pendingBgm = name;
      A.currentName = name;
      return;
    }
    if (A.currentName === name && !force && (A.current || A.htmlAudio)) return;
    A.currentName = name;
    if (A.current) stopPlayer(A.current, 900);
    A.current = null;
    stopHtml(900);
    const url = A.custom[name];
    if (url) {
      const el = new Audio(url);
      el.loop = !(T[name] && T[name].loop === false);
      el.volume = U.clamp(NR.settings.musicVol, 0, 1);
      el.play().catch(() => {});
      A.htmlAudio = el;
      return;
    }
    const tr = T[name];
    if (!tr) return;
    parseTrack(tr);
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(musicBus);
    g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
    const p = { tr, step: 0, next: ctx.currentTime + 0.08, gain: g };
    A.players.push(p);
    A.current = p;
  };

  A.stopBgm = function (fadeMs = 800) {
    A.currentName = null;
    A.pendingBgm = null;
    if (!ctx) return;
    if (A.current) stopPlayer(A.current, fadeMs);
    A.current = null;
    stopHtml(fadeMs);
  };

  // One-shot jingle over the music (music ducks while it plays).
  A.jingle = function (name) {
    if (!ctx) return Promise.resolve();
    const tr = T[name];
    if (!tr) return Promise.resolve();
    parseTrack(tr);
    const cur = A.current;
    if (cur) cur.gain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.1);
    if (A.htmlAudio) {
      A.duck = 0.2;
      A.applyVolumes();
    }
    return new Promise((resolve) => {
      const g = ctx.createGain();
      g.gain.value = 1;
      g.connect(musicBus);
      const p = {
        tr, step: 0, next: ctx.currentTime + 0.05, gain: g,
        onEnd: () => {
          if (cur && A.current === cur) cur.gain.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
          A.duck = 1;
          A.applyVolumes();
          p.dead = true;
          resolve();
        },
      };
      A.players.push(p);
    });
  };

  // ---------- sound effects ----------
  function tone(type, f1, f2, dur, vol, t0 = 0, dest) {
    const t = ctx.currentTime + t0;
    const o = osc(type, f1, t), g = out(dest || sfxBus, 0);
    if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    o.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function nz(dur, vol, type, f1, f2, t0 = 0, q = 1) {
    const t = ctx.currentTime + t0;
    const n = noise(t, dur), fl = ctx.createBiquadFilter(), g = out(sfxBus, 0);
    fl.type = type;
    fl.Q.value = q;
    fl.frequency.setValueAtTime(f1, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    n.connect(fl);
    fl.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }
  function bellAt(f, t0, v = 1) {
    INS.bell(ctx.currentTime + t0, f, 0.5, v, sfxBus, reverb);
  }

  const SFX = {
    cursor: () => tone('sine', 1250, 1250, 0.035, 0.08),
    ok: () => (tone('triangle', 780, 780, 0.06, 0.13), tone('triangle', 1170, 1170, 0.08, 0.1, 0.05)),
    cancel: () => tone('triangle', 620, 380, 0.1, 0.12),
    buzzer: () => tone('square', 140, 120, 0.22, 0.08),
    open: () => nz(0.12, 0.12, 'bandpass', 800, 2400, 0, 1.5),
    hit: () => (nz(0.12, 0.45, 'lowpass', 2400, 300), tone('sine', 160, 60, 0.15, 0.4)),
    crit: () => (nz(0.2, 0.55, 'lowpass', 4000, 300), tone('sine', 200, 50, 0.25, 0.5), tone('triangle', 1800, 1400, 0.25, 0.08)),
    slash: () => nz(0.18, 0.35, 'bandpass', 3500, 700, 0, 2),
    miss: () => nz(0.25, 0.18, 'bandpass', 900, 2600, 0, 3),
    guard: () => (tone('triangle', 1500, 1400, 0.18, 0.12), nz(0.06, 0.2, 'highpass', 3000)),
    heal: () => [0, 1, 2, 3, 4].forEach((i) => bellAt(nf(['c5', 'e5', 'g5', 'c6', 'e6'][i]), i * 0.07, 0.5)),
    charge: () => {
      tone('sine', 220, 880, 0.6, 0.12);
      nz(0.6, 0.12, 'bandpass', 400, 3000, 0, 4);
    },
    rasengan: () => {
      const t = ctx.currentTime;
      const o = osc('sawtooth', 110, t), f = ctx.createBiquadFilter(), g = out(sfxBus, 0);
      f.type = 'bandpass';
      f.Q.value = 6;
      const lfo = osc('sine', 18, t), lg = ctx.createGain();
      lg.gain.value = 900;
      lfo.connect(lg);
      lg.connect(f.frequency);
      f.frequency.value = 1400;
      o.connect(f);
      f.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.start(t);
      lfo.start(t);
      o.stop(t + 1);
      lfo.stop(t + 1);
      nz(0.9, 0.18, 'bandpass', 600, 2400, 0, 3);
    },
    explosion: () => {
      nz(1.1, 0.7, 'lowpass', 1800, 80);
      tone('sine', 90, 30, 0.9, 0.6);
    },
    thunder: () => {
      for (let i = 0; i < 9; i++) nz(0.05, 0.4, 'highpass', 2000 + Math.random() * 3000, 0, i * 0.045);
      tone('sawtooth', 2600, 800, 0.4, 0.06);
      nz(0.6, 0.3, 'lowpass', 900, 100, 0.1);
    },
    wind: () => nz(0.7, 0.3, 'bandpass', 500, 3200, 0, 3),
    water: () => {
      nz(0.6, 0.3, 'lowpass', 1600, 400);
      for (let i = 0; i < 5; i++) tone('sine', 400 + Math.random() * 500, 900 + Math.random() * 600, 0.08, 0.08, 0.1 + i * 0.07);
    },
    fire: () => {
      nz(0.8, 0.4, 'lowpass', 900, 200);
      nz(0.5, 0.15, 'bandpass', 2000, 600, 0.05, 1);
    },
    earth: () => {
      nz(0.5, 0.6, 'lowpass', 500, 60);
      tone('square', 70, 40, 0.4, 0.15);
    },
    poof: () => {
      nz(0.35, 0.35, 'bandpass', 1200, 300, 0, 1);
      tone('sine', 300, 120, 0.2, 0.15);
    },
    door: () => {
      tone('sine', 120, 70, 0.2, 0.3);
      nz(0.2, 0.12, 'bandpass', 300, 200, 0.05, 3);
    },
    step: () => nz(0.04, 0.05, 'lowpass', 900),
    levelup: () => ['c5', 'e5', 'g5', 'c6', 'g5', 'c6', 'e6'].forEach((n, i) => bellAt(nf(n), i * 0.09, 0.7)),
    item: () => ['g5', 'b5', 'd6'].forEach((n, i) => bellAt(nf(n), i * 0.08, 0.7)),
    heart: () => {
      bellAt(nf('e6'), 0, 0.5);
      bellAt(nf('g#6'), 0.12, 0.5);
      bellAt(nf('b6'), 0.24, 0.45);
    },
    quest: () => {
      bellAt(nf('g5'), 0, 0.6);
      bellAt(nf('c6'), 0.14, 0.6);
    },
    save: () => ['c5', 'g5', 'e6'].forEach((n, i) => bellAt(nf(n), i * 0.06, 0.4)),
    dice: () => {
      for (let i = 0; i < 7; i++) tone('square', 1800 + Math.random() * 1200, 1500, 0.02, 0.05, i * 0.05 + Math.random() * 0.02);
    },
    coin: () => (tone('square', 1320, 1320, 0.06, 0.06), tone('square', 1760, 1760, 0.12, 0.06, 0.06)),
    poison: () => {
      for (let i = 0; i < 4; i++) tone('sine', 300 + i * 60, 200, 0.1, 0.1, i * 0.06);
    },
    buff: () => {
      tone('triangle', 440, 880, 0.3, 0.1);
      tone('triangle', 660, 1320, 0.3, 0.08, 0.08);
    },
    debuff: () => tone('triangle', 660, 220, 0.4, 0.1),
    sexy: () => {
      nz(0.35, 0.3, 'bandpass', 1200, 300, 0, 1);
      bellAt(nf('a6'), 0.2, 0.5);
      bellAt(nf('e6'), 0.35, 0.5);
    },
    kurama: () => {
      tone('sawtooth', 55, 110, 1.4, 0.25);
      nz(1.4, 0.4, 'lowpass', 300, 1800, 0, 2);
      tone('sine', 110, 55, 1.4, 0.3, 0.1);
    },
    splash: () => nz(0.4, 0.3, 'bandpass', 2000, 500, 0, 1),
    bite: () => (nz(0.1, 0.4, 'bandpass', 1400, 600, 0, 2), tone('square', 200, 90, 0.08, 0.12)),
  };
  A.sfx = function (name) {
    if (!ctx || !SFX[name]) return;
    try {
      SFX[name]();
    } catch (e) {
      console.warn('sfx', name, e);
    }
  };
  A.blip = function (pitch = 1) {
    if (!ctx || !NR.settings.voiceBlips) return;
    const f = 520 * pitch * (0.96 + Math.random() * 0.08);
    tone('triangle', f, f * 0.94, 0.045, 0.045);
  };
})();
