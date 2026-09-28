// User art library: portraits from "naruto characters/", sprite sheets from "sprite/",
// optional music from "music/". Files come from user-assets.js (written by Play.bat /
// play.sh) or from the in-game folder import (stored in IndexedDB). File and folder
// names are matched to characters, emotions and outfits automatically; the Art Setup
// screen lets the player fix anything by hand.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;

  const IMG_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'avif'];
  const AUD_EXT = ['mp3', 'ogg', 'wav', 'm4a', 'aac', 'oga', 'webm', 'flac'];
  const ROOTS = {
    portrait: ['naruto characters', 'naruto character', 'characters art', 'portraits', 'portrait', 'avatars', 'avatar', 'faces', 'face', 'busts', 'pictures', 'karakter', 'foto', 'gambar'],
    sprite: ['sprite', 'sprites', 'charsets', 'characters', 'walk', 'walking', 'chara'],
    music: ['music', 'musik', 'bgm', 'audio', 'lagu', 'songs', 'sound', 'sounds'],
  };
  const TRACK_ALIASES = {
    title: ['title', 'menu', 'main', 'opening', 'theme', 'judul'],
    village: ['village', 'town', 'konoha', 'desa', 'kota', 'daily'],
    forest: ['forest', 'woods', 'hutan', 'field', 'outside'],
    battle: ['battle', 'fight', 'combat', 'pertarungan', 'tarung', 'perang'],
    boss: ['boss', 'final', 'bos'],
    romance: ['romance', 'love', 'romantic', 'cinta', 'romantis', 'date'],
    night: ['night', 'malam', 'calm'],
    onsen: ['onsen', 'hotspring', 'spring', 'bath', 'relax'],
    dungeon: ['dungeon', 'cave', 'hideout', 'gua', 'ruins'],
    sad: ['sad', 'sedih', 'grief', 'tragic'],
    festival: ['festival', 'matsuri', 'party', 'pesta'],
    tension: ['tension', 'villain', 'danger', 'tegang', 'suspense'],
    victory: ['victory', 'win', 'menang', 'fanfare'],
    gameover: ['gameover', 'defeat', 'kalah', 'lose'],
  };

  const A = (NR.art = {
    items: [],
    byPath: {},
    overrides: NR.storage.get('art_overrides', {}),
    loaded: false,
    listeners: [],
  });

  A.saveOverrides = () => NR.storage.set('art_overrides', A.overrides);
  A.onChange = (fn) => A.listeners.push(fn);
  const changed = () => {
    A.version = (A.version || 0) + 1;
    NR.spritegen && (A.spriteCache = {});
    A.listeners.forEach((f) => f());
  };

  function extOf(path) {
    const m = /\.([a-z0-9]+)$/i.exec(path);
    return m ? m[1].toLowerCase() : '';
  }
  function norm(path) {
    return String(path).replace(/\\/g, '/').replace(/^\.\//, '');
  }

  // Figure out which root folder a path belongs to; return {kind, rest}.
  function classify(path) {
    const segs = norm(path).split('/');
    for (let i = segs.length - 2; i >= 0; i--) {
      const s = segs[i].toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
      const tight = s.replace(/ /g, '');
      for (const kind in ROOTS) {
        if (ROOTS[kind].some((r) => r === s || r.replace(/ /g, '') === tight)) return { kind, rest: segs.slice(i + 1).join('/') };
      }
    }
    const ext = extOf(path);
    if (AUD_EXT.includes(ext)) return { kind: 'music', rest: segs.join('/') };
    const name = segs[segs.length - 1];
    if (name.startsWith('$') || name.startsWith('!')) return { kind: 'sprite', rest: segs.join('/') };
    const toks = U.tokens(segs.slice(-2).join('/'));
    if (toks.some((t) => SPRITE_WORDS.includes(t))) return { kind: 'sprite', rest: segs.slice(-2).join('/') };
    return { kind: 'portrait', rest: segs.slice(-2).join('/'), guessed: true };
  }
  const SPRITE_WORDS = ['walk', 'walking', 'run', 'running', 'sprite', 'sprites', 'spritesheet', 'charset', 'charsets', 'chara', 'sheet', 'strip', 'frames', 'anim', 'animation', 'movement', 'jalan', 'berjalan', 'gerak', 'lari', 'animasi'];
  // Small images shaped like RPG Maker sheets are almost certainly walking sprites.
  function looksLikeSheet(it) {
    const r = it.w / it.h;
    if (Math.abs(r - 0.75) < 0.02 && it.h <= 260) return true;
    if (Math.abs(r - 1.5) < 0.02 && it.h <= 400) return true;
    if (Math.abs(r - 2 / 3) < 0.02 && it.h <= 260) return true;
    // a strip of frames side by side is never a portrait
    const n = Math.round(r);
    if (n >= 2 && Math.abs(r - n) < 0.04 * n && it.h <= 320) return true;
    return false;
  }

  // Character aliases: multi-word aliases matched against the joined token string.
  let aliasList = null;
  function aliases() {
    if (aliasList) return aliasList;
    aliasList = [];
    for (const id in NR.CHARS) {
      const c = NR.CHARS[id];
      const al = new Set([id, ...(c.aliases || []), c.name.toLowerCase()]);
      for (const a of al) aliasList.push({ id, a: a.toLowerCase().replace(/[^a-z0-9 ]/g, '') });
    }
    aliasList.sort((x, y) => y.a.length - x.a.length);
    return aliasList;
  }

  function detectChar(rest) {
    const segs = rest.split('/');
    // check filename first, then folders from nearest to farthest
    const order = [segs[segs.length - 1], ...segs.slice(0, -1).reverse()];
    for (const seg of order) {
      const toks = U.tokens(seg);
      const joined = ' ' + toks.join(' ') + ' ';
      const hits = [];
      for (const { id, a } of aliases()) {
        if (a.length < 3 && !toks.includes(a)) continue;
        if (joined.includes(' ' + a + ' ') || (a.length >= 5 && joined.replace(/ /g, '').includes(a.replace(/ /g, '')))) {
          if (!hits.includes(id)) hits.push(id);
        }
      }
      if (hits.length) {
        // "naruto" is usually the series name when another character is also named
        const others = hits.filter((h) => h !== 'naruto');
        return others.length ? others[0] : hits[0];
      }
    }
    return null;
  }

  function detectTags(rest, table) {
    const toks = U.tokens(rest);
    const joined = toks.join('');
    const out = [];
    for (const tag in table) {
      // whole-word match, or substring for longer words ("hinatablush.png")
      if (table[tag].some((w) => toks.includes(w) || (w.length >= 5 && joined.includes(w)))) out.push(tag);
    }
    return out;
  }

  function detectTrack(rest) {
    const toks = U.tokens(rest);
    for (const tr in TRACK_ALIASES) if (TRACK_ALIASES[tr].some((w) => toks.includes(w))) return tr;
    return null;
  }

  function makeItem(path, url, source, blob) {
    path = norm(path);
    const ext = extOf(path);
    if (!IMG_EXT.includes(ext) && !AUD_EXT.includes(ext)) return null;
    const { kind, rest, guessed } = classify(path);
    const it = { path, url, source, ext, kind: AUD_EXT.includes(ext) ? 'music' : kind, rest, guessed: !!guessed, blob: blob || null };
    it.name = path.split('/').pop();
    it.auto = {
      char: it.kind === 'music' ? null : detectChar(rest),
      emotions: detectTags(rest, NR.EMOTIONS),
      outfits: detectTags(rest, NR.OUTFITS),
      track: it.kind === 'music' ? detectTrack(rest) : null,
    };
    return it;
  }

  // Effective settings = auto-detected merged with the player's overrides.
  A.eff = function (it) {
    const o = A.overrides[it.path] || {};
    return {
      kind: o.kind || it.kind,
      char: o.char !== undefined ? o.char : it.auto.char,
      emotions: o.emotions || it.auto.emotions,
      outfits: o.outfits || it.auto.outfits,
      track: o.track !== undefined ? o.track : it.auto.track,
      ignore: !!o.ignore,
      layout: o.layout || 'auto',
      scale: o.scale || 1,
      frames: o.frames || 0,
    };
  };
  A.setOverride = function (path, patch) {
    A.overrides[path] = Object.assign({}, A.overrides[path] || {}, patch);
    A.saveOverrides();
    changed();
  };
  A.resetOverride = function (path) {
    delete A.overrides[path];
    A.saveOverrides();
    changed();
  };

  function loadImage(it) {
    return new Promise((resolve) => {
      const img = new Image();
      let done = false;
      const fin = (ok) => {
        if (done) return;
        done = true;
        it.img = ok ? img : null;
        it.broken = !ok;
        if (ok) {
          it.w = img.naturalWidth;
          it.h = img.naturalHeight;
          if (it.guessed && it.kind === 'portrait' && looksLikeSheet(it)) it.kind = 'sprite';
        }
        resolve(it);
      };
      img.onload = () => fin(true);
      img.onerror = () => fin(false);
      setTimeout(() => fin(false), 15000);
      img.decoding = 'async';
      img.src = it.url;
    }).then((it) => (it.img && it.blob && /^(gif|webp|png|avif)$/.test(it.ext) ? decodeAnim(it) : it));
  }

  // Animated GIF / WebP / APNG sprites: split into frames with the browser's ImageDecoder.
  // Works for imported files (their bytes are available); folder files keep their first frame.
  async function decodeAnim(it) {
    if (!window.ImageDecoder) return it;
    try {
      const type = it.blob.type || (it.ext === 'gif' ? 'image/gif' : 'image/' + it.ext);
      if (!(await ImageDecoder.isTypeSupported(type))) return it;
      const dec = new ImageDecoder({ data: await it.blob.arrayBuffer(), type });
      await dec.tracks.ready;
      const tr = dec.tracks.selectedTrack;
      const count = tr ? tr.frameCount : 1;
      if (count > 1) {
        const step = Math.max(1, Math.ceil(count / 12));
        const frames = [];
        for (let i = 0; i < count; i += step) {
          const { image } = await dec.decode({ frameIndex: i });
          const c = U.canvas(image.displayWidth, image.displayHeight);
          c.getContext('2d').drawImage(image, 0, 0);
          image.close();
          frames.push(c);
        }
        if (frames.length > 1) {
          it.anim = frames;
          // small animated files without a clear folder are walking sprites, not portraits
          if (it.guessed && it.kind === 'portrait' && it.w <= 320 && it.h <= 320) it.kind = 'sprite';
        }
      }
      dec.close();
    } catch (e) {
      console.warn('could not decode animation', it.path, e);
    }
    return it;
  }

  const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');

  A.init = async function () {
    const items = [];
    const man = window.NR_USER_ASSETS;
    if (man && Array.isArray(man.files)) {
      for (const f of man.files) {
        const it = makeItem(f, encodePath(norm(f)), 'folder');
        if (it) items.push(it);
      }
    }
    const recs = await NR.storage.blobAll();
    for (const r of recs) {
      if (items.some((i) => i.path === r.path)) continue;
      const it = makeItem(r.path, URL.createObjectURL(r.blob), 'import', r.blob);
      if (it) items.push(it);
    }
    await Promise.all(items.filter((i) => i.kind !== 'music').map(loadImage));
    A.items = items;
    A.byPath = {};
    for (const it of items) A.byPath[it.path] = it;
    A.loaded = true;
    A.applyMusic();
    changed();
    return items;
  };

  // Import files picked by the player (folder picker or multi-select).
  A.importFiles = async function (fileList, onProgress) {
    const files = Array.from(fileList).filter((f) => {
      const e = extOf(f.name);
      return IMG_EXT.includes(e) || AUD_EXT.includes(e);
    });
    const recs = [];
    let n = 0;
    for (const f of files) {
      const path = norm(f.webkitRelativePath || f.name);
      recs.push({ path, blob: f, name: f.name, added: Date.now() });
      n++;
      if (onProgress && n % 10 === 0) onProgress(n, files.length);
    }
    try {
      await NR.storage.blobPutMany(recs);
    } catch (e) {
      console.warn('could not persist imports', e);
    }
    const fresh = [];
    for (const r of recs) {
      const old = A.byPath[r.path];
      if (old) A.items = A.items.filter((i) => i !== old);
      const it = makeItem(r.path, URL.createObjectURL(r.blob), 'import', r.blob);
      if (it) fresh.push(it);
    }
    await Promise.all(fresh.filter((i) => i.kind !== 'music').map(loadImage));
    A.items.push(...fresh);
    for (const it of fresh) A.byPath[it.path] = it;
    A.applyMusic();
    changed();
    return fresh.length;
  };

  A.clearImported = async function () {
    await NR.storage.blobClear();
    A.items = A.items.filter((i) => i.source !== 'import');
    A.byPath = {};
    for (const it of A.items) A.byPath[it.path] = it;
    A.applyMusic();
    changed();
  };

  A.applyMusic = function () {
    NR.audio.custom = {};
    for (const it of A.items) {
      const e = A.eff(it);
      if (e.kind === 'music' && e.track && !e.ignore) NR.audio.custom[e.track] = it.url;
    }
  };

  A.list = (kind) => A.items.filter((i) => A.eff(i).kind === kind && !i.broken);
  A.countFor = (charId) => A.list('portrait').filter((i) => A.eff(i).char === charId && !A.eff(i).ignore).length;

  // ---------- portrait lookup ----------
  A.portraitFor = function (charId, emotion = 'neutral', outfit = null, seed = 0) {
    const cands = A.list('portrait').filter((i) => {
      const e = A.eff(i);
      return e.char === charId && !e.ignore && i.img;
    });
    if (!cands.length) return null;
    const chain = [emotion, ...(NR.EMO_FALLBACK[emotion] || ['neutral'])];
    let best = -1e9, top = [];
    for (const it of cands) {
      const e = A.eff(it);
      let s = 0;
      const idx = chain.findIndex((c) => e.emotions.includes(c));
      if (e.emotions.includes(emotion)) s += 100;
      else if (idx > 0) s += 70 - idx * 10;
      else if (!e.emotions.length) s += 40;
      else s -= 20;
      // outfits can combine tags ("onsen+aged"): reward each match, penalise foreign tags
      const want = outfit ? String(outfit).split('+').filter(Boolean) : [];
      if (want.length) {
        const hit = want.filter((t) => e.outfits.includes(t)).length;
        const extra = e.outfits.filter((t) => !want.includes(t)).length;
        s += hit ? hit * 60 - extra * 30 : e.outfits.length ? -30 : 0;
      } else if (e.outfits.length) s -= 25;
      if (s > best) {
        best = s;
        top = [it];
      } else if (s === best) top.push(it);
    }
    top.sort((a, b) => (a.path < b.path ? -1 : 1));
    const pick = top[Math.abs(seed) % top.length];
    return pick;
  };

  // ---------- sprite lookup ----------
  A.spriteCache = {};
  const LAYOUTS = {
    rm: { cols: 3, rows: 4, dirs: { down: 0, left: 1, right: 2, up: 3 }, cycle: [0, 1, 2, 1], idle: 1 },
    xp: { cols: 4, rows: 4, dirs: { down: 0, left: 1, right: 2, up: 3 }, cycle: [0, 1, 2, 3], idle: 0 },
    lpc: { cols: 13, rows: 21, dirs: { up: 8, left: 9, down: 10, right: 11 }, cycle: [1, 2, 3, 4, 5, 6, 7, 8], idle: 0, useCols: 9 },
    // a single picture used for every direction (no walking animation)
    still: { cols: 1, rows: 1, dirs: { down: 0, left: 0, right: 0, up: 0 }, cycle: [0], idle: 0 },
  };
  // a horizontal strip of square-ish frames (e.g. 6 walking frames side by side)
  const stripCols = (it) => {
    const set = (A.overrides[it.path] || {}).frames;
    if (set) return set;
    const r = it.w / it.h, n = Math.round(r);
    return n >= 2 && n <= 16 && Math.abs(r - n) < 0.04 * n ? n : 0;
  };
  A.LAYOUTS = LAYOUTS;
  A.stripCols = (it) => stripCols(it);
  A.layoutNames = ['auto', 'rm', 'rm8-0', 'rm8-1', 'rm8-2', 'rm8-3', 'rm8-4', 'rm8-5', 'rm8-6', 'rm8-7', 'xp', 'lpc', 'strip', 'frames', 'still'];

  A.detectLayout = function (it) {
    const n = it.name;
    if (n.startsWith('$') || n.startsWith('!$')) return 'rm';
    const r = it.w / it.h;
    if (Math.abs(r - 0.75) < 0.03) return 'rm';
    if (Math.abs(r - 1.5) < 0.05) return 'rm8-0';
    if (it.w === 832 && it.h >= 1344) return 'lpc';
    if (Math.abs(r - 2 / 3) < 0.03 || Math.abs(r - 1) < 0.03) return it.anim ? 'frames' : 'xp';
    if (it.anim) return 'frames';
    if (stripCols(it)) return 'strip';
    // anything else is not a grid we know: show it as one still picture
    return 'still';
  };

  A.sheetFrom = function (it, layoutName, scale = 1) {
    let ln = layoutName === 'auto' ? A.detectLayout(it) : layoutName;
    if (ln === 'frames') ln = 'still';
    let L, bx = 0, by = 0, bw = it.w, bh = it.h;
    if (ln === 'strip') {
      const n = stripCols(it) || Math.max(2, Math.round(it.w / it.h));
      L = { cols: n, rows: 1, dirs: { down: 0, left: 0, right: 0, up: 0 }, cycle: [...Array(n).keys()], idle: 0 };
    } else if (ln.startsWith('rm8')) {
      L = LAYOUTS.rm;
      const idx = +ln.split('-')[1] || 0;
      bw = it.w / 4;
      bh = it.h / 2;
      bx = (idx % 4) * bw;
      by = Math.floor(idx / 4) * bh;
    } else L = LAYOUTS[ln] || LAYOUTS.rm;
    const fw = bw / L.cols, fh = bh / L.rows;
    return {
      img: it.img, fw, fh, bx, by, layout: L, layoutName: ln, scale,
      smooth: fw > 72, user: true, path: it.path,
    };
  };

  // ---------- frame sequences (one image per animation frame) ----------
  // "naruto_walk_down_1.png", "Hinata left 2.png", "run03.png": numbered frames of the same
  // character are combined into a sheet. Direction words pick the row; frames without one
  // are used for every direction (mirrored for left/right when only one side exists).
  const DIR_WORDS = {
    down: ['down', 'front', 'depan', 'bawah', 'south', 'forward'],
    up: ['up', 'back', 'belakang', 'atas', 'north', 'behind'],
    left: ['left', 'kiri', 'west'],
    right: ['right', 'kanan', 'east', 'side', 'samping'],
  };
  const ALL_DIR_WORDS = Object.values(DIR_WORDS).flat();
  A.frameInfo = function (it) {
    if (!it.img || /^[$!]/.test(it.name) || it.w > 480 || it.h > 480) return null;
    const stem = it.name.replace(/\.[a-z0-9]+$/i, '');
    const m = /(\d{1,3})\D*$/.exec(stem);
    if (!m) return null;
    const toks = U.tokens(stem);
    let dir = null;
    for (const d in DIR_WORDS) if (toks.some((t) => DIR_WORDS[d].includes(t))) dir = d;
    const base = toks.filter((t) => !/^\d+$/.test(t) && !ALL_DIR_WORDS.includes(t)).join(' ');
    return { n: +m[1], dir, base };
  };
  // Frames inside one file: an animated GIF/WebP, or a horizontal strip.
  function framesOf(it, layout) {
    if (it.anim && it.anim.length > 1 && (layout === 'auto' || layout === 'frames')) return it.anim;
    const n = layout === 'strip' || (layout === 'auto' && A.detectLayout(it) === 'strip') ? stripCols(it) || Math.max(2, Math.round(it.w / it.h)) : 0;
    if (!n) return null;
    const fw = Math.floor(it.w / n), out = [];
    for (let i = 0; i < n; i++) {
      const c = U.canvas(fw, it.h);
      c.getContext('2d').drawImage(it.img, i * fw, 0, fw, it.h, 0, 0, fw, it.h);
      out.push(c);
    }
    return out;
  }
  function looseInfo(it) {
    const toks = U.tokens(it.name);
    let dir = null;
    for (const d in DIR_WORDS) if (toks.some((t) => DIR_WORDS[d].includes(t))) dir = d;
    const base = toks.filter((t) => !/^\d+$/.test(t) && !ALL_DIR_WORDS.includes(t)).join(' ');
    return { dir, base };
  }
  function frameGroup(charId) {
    const groups = {};
    for (const it of A.list('sprite')) {
      const e = A.eff(it);
      if (e.char !== charId || e.ignore || !it.img || !['auto', 'frames', 'strip'].includes(e.layout)) continue;
      const folder = it.path.split('/').slice(0, -1).join('/');
      const multi = framesOf(it, e.layout);
      if (multi) {
        const { dir, base } = looseInfo(it);
        const k = folder + '|' + base;
        multi.forEach((c, i) => (groups[k] = groups[k] || []).push({ it: { img: c, w: c.width, h: c.height, path: it.path, src: it }, f: { n: i, dir, base }, multi: true }));
        continue;
      }
      if (e.layout === 'strip') continue;
      const f = A.frameInfo(it) || (e.layout === 'frames' ? { n: 0, dir: null, base: '' } : null);
      if (!f) continue;
      const k = folder + '|' + f.base;
      (groups[k] = groups[k] || []).push({ it, f, forced: e.layout === 'frames' });
    }
    let best = null;
    for (const k in groups) {
      const g = groups[k];
      // numbered sheets ("naruto1.png, naruto2.png") must not be mistaken for frames:
      // automatic grouping needs 3+ same-sized files and direction words, 4+ files or odd shapes
      const forced = g.some((x) => x.forced || x.multi);
      const same = g.every((x) => x.it.w === g[0].it.w && x.it.h === g[0].it.h);
      const dirs = g.some((x) => x.f.dir);
      const ok = forced || (g.length >= 3 && same && (dirs || g.length >= 4 || A.detectLayout(g[0].it) === 'still'));
      if (ok && (!best || g.length > best.length)) best = g;
    }
    return best;
  }
  function sheetFromFrames(list) {
    if (!list || !list.length) return null;
    const byDir = { down: [], left: [], right: [], up: [], any: [] };
    for (const { it, f } of list) byDir[f.dir || 'any'].push({ it, n: f.n });
    for (const d in byDir) byDir[d].sort((a, b) => a.n - b.n);
    const pick = (d) => byDir[d].length ? { frames: byDir[d] } : null;
    const rows = {};
    rows.down = pick('down') || pick('any') || pick('right') || pick('left') || pick('up');
    rows.up = pick('up') || pick('any') || rows.down;
    rows.right = pick('right') || (byDir.left.length ? { frames: byDir.left, flip: true } : null) || pick('any') || rows.down;
    rows.left = pick('left') || (byDir.right.length ? { frames: byDir.right, flip: true } : null) || pick('any') || rows.down;
    const order = ['down', 'left', 'right', 'up'];
    const cols = Math.min(8, Math.max(...order.map((d) => rows[d].frames.length)));
    const fw = Math.max(...list.map((x) => x.it.w)), fh = Math.max(...list.map((x) => x.it.h));
    const c = U.canvas(fw * cols, fh * 4);
    const x = c.getContext('2d');
    order.forEach((d, r) => {
      const { frames, flip } = rows[d];
      for (let i = 0; i < cols; i++) {
        const fr = frames[i % frames.length].it;
        const dx = i * fw + (fw - fr.w) / 2, dy = r * fh + (fh - fr.h);
        x.save();
        if (flip) {
          x.translate(dx + fr.w, dy);
          x.scale(-1, 1);
          x.drawImage(fr.img, 0, 0);
        } else x.drawImage(fr.img, dx, dy);
        x.restore();
      }
    });
    const cycle = cols >= 3 ? [...Array(cols).keys()] : [0, cols - 1];
    const e = A.eff(list[0].it.src || list[0].it);
    return {
      img: c, fw, fh, bx: 0, by: 0, scale: e.scale, smooth: fw > 72, user: true, path: list[0].it.path,
      layout: { cols, rows: 4, dirs: { down: 0, left: 1, right: 2, up: 3 }, cycle, idle: 0 }, layoutName: 'frames',
    };
  }

  // Preview for one file in Art Setup (animated files and strips play their frames).
  A.previewSheet = function (it) {
    const e = A.eff(it);
    const multi = framesOf(it, e.layout);
    if (multi) {
      const { dir, base } = looseInfo(it);
      const sh = sheetFromFrames(multi.map((c, i) => ({ it: { img: c, w: c.width, h: c.height, path: it.path, src: it }, f: { n: i, dir, base } })));
      if (sh) return sh;
    }
    return A.sheetFrom(it, e.layout, e.scale);
  };

  A.spriteFor = function (charId) {
    if (NR.settings.spritePref === 'generated') return null;
    const key = charId + '|' + (A.version || 0);
    if (key in A.spriteCache) return A.spriteCache[key];
    let res = null;
    const group = frameGroup(charId);
    if (group) res = sheetFromFrames(group);
    else {
      const cands = A.list('sprite').filter((i) => {
        const e = A.eff(i);
        return e.char === charId && !e.ignore && i.img && e.layout !== 'frames';
      });
      if (cands.length) {
        // prefer real sheets over still pictures
        cands.sort((a, b) => (A.detectLayout(a) === 'still') - (A.detectLayout(b) === 'still') || (a.path < b.path ? -1 : 1));
        const it = cands[0];
        const e = A.eff(it);
        res = A.sheetFrom(it, e.layout, e.scale);
      }
    }
    A.spriteCache[key] = res;
    return res;
  };
})();
