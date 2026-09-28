// Naruto: Seventh Dawn — shared helpers (math, random, color, text).
(function () {
  'use strict';
  const NR = (window.NR = window.NR || {});
  const U = (NR.U = {});

  // ---------- math ----------
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  U.TAU = Math.PI * 2;

  U.ease = {
    linear: (t) => t,
    in: (t) => t * t,
    out: (t) => 1 - (1 - t) * (1 - t),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
  };

  // ---------- random ----------
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Seeded generator (mulberry32) so procedural art is stable between runs.
  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.strSeed = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  // Integer lattice hash -> [0,1)
  U.hash2 = (x, y, s) => {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + ((s | 0) * 2147483647 >>> 0);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  // Smooth value noise
  U.noise2 = (x, y, s = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = U.hash2(xi, yi, s), b = U.hash2(xi + 1, yi, s);
    const c = U.hash2(xi, yi + 1, s), d = U.hash2(xi + 1, yi + 1, s);
    return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
  };
  U.fbm = (x, y, s = 0, oct = 3) => {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += U.noise2(x * f, y * f, s + i * 17) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };

  // ---------- color ----------
  const hexCache = {};
  U.hex2rgb = (hex) => {
    if (hexCache[hex]) return hexCache[hex];
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return (hexCache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  };
  U.rgb2hex = (r, g, b) =>
    '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  // amt -1..1 : negative darkens toward black, positive lightens toward white
  U.shade = (hex, amt) => {
    const [r, g, b] = U.hex2rgb(hex);
    if (amt < 0) return U.rgb2hex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
    return U.rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  };
  U.mix = (h1, h2, t) => {
    const a = U.hex2rgb(h1), b = U.hex2rgb(h2);
    return U.rgb2hex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t));
  };
  U.rgba = (hex, a) => {
    const [r, g, b] = U.hex2rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  // Shift hue toward warm/cool for cel-shading shadows (keeps colors saturated).
  U.shadow = (hex, amt = 0.28) => U.mix(U.shade(hex, -amt), '#3a2a6a', amt * 0.35);
  U.light = (hex, amt = 0.25) => U.mix(U.shade(hex, amt), '#fff4d8', amt * 0.3);

  // ---------- canvas ----------
  U.canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  // ---------- text ----------
  U.wrap = (ctx, text, maxW) => {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      out.push(line);
    }
    return out;
  };

  U.fmtTime = (sec) => {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  U.clone = (o) => JSON.parse(JSON.stringify(o));

  // Split a file path into lowercase word tokens: "Hinata_Blush02.png" -> [hinata, blush, 02]
  U.tokens = (str) =>
    String(str)
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

  U.dirs = {
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
    up: [0, -1],
  };
  U.dirFromDelta = (dx, dy) =>
    Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  U.opposite = { down: 'up', up: 'down', left: 'right', right: 'left' };
})();
