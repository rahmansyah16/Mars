// Map runtime: parses map definitions, collision, chunk cache, lights and camera.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const TS = NR.TS;

  NR.MAPS = NR.MAPS || {};
  const LEGEND = {
    '.': 'grass', ',': 'grass2', ';': 'forest', ':': 'flowers', '"': 'moss',
    '=': 'dirt', '_': 'sand', '#': 'stone', '+': 'plaza', '%': 'ruins',
    '~': 'water', o: 'deep', s: 'spring', b: 'bridge',
    w: 'wood', t: 'tatami', e: 'tile', c: 'cave',
    W: 'wall', C: 'cliff', R: 'rock', ' ': 'void', X: 'void',
  };
  NR.LEGEND = LEGEND;

  class GameMap {
    constructor(id) {
      const def = NR.MAPS[id];
      if (!def) throw new Error('Unknown map ' + id);
      this.id = id;
      this.def = def;
      this.seed = U.strSeed(id) % 100000;
      if (def.grid) {
        // built with NR.mb(): cells hold terrain names directly
        const g = typeof def.grid === 'function' ? def.grid() : def.grid;
        this.w = g.w;
        this.h = g.h;
        this.terrain = g.cells.slice();
      } else {
        const rows = def.rows;
        this.h = rows.length;
        this.w = Math.max(...rows.map((r) => r.length));
        const legend = Object.assign({}, LEGEND, def.legend || {});
        this.terrain = new Array(this.w * this.h);
        for (let y = 0; y < this.h; y++) {
          for (let x = 0; x < this.w; x++) {
            const ch = rows[y][x] || def.fill || ' ';
            this.terrain[y * this.w + x] = legend[ch] || def.fill || 'grass';
          }
        }
      }
      this.props = [];
      for (const raw of def.props || []) {
        const inst = NR.props.instance(raw);
        if (inst) this.props.push(inst);
      }
      this.decalProps = this.props.filter((p) => p.decal);
      this.objProps = this.props.filter((p) => !p.decal);
      this.chunks = new Map();
      this.rebuildSolid();
      this.staticLights = [];
      for (const p of this.props) this.staticLights.push(...NR.props.lights(p));
      for (const l of def.lights || []) this.staticLights.push({ x: l.x * TS + TS / 2, y: l.y * TS + TS / 2, r: l.r || 160, color: l.color || '#ffc870', a: l.a || 0.9, flicker: l.flicker });
      this.events = (def.events || []).map((e, i) => Object.assign({ w: 1, h: 1, on: 'action', idx: i }, e));
    }

    rebuildSolid() {
      this.solid = new Uint8Array(this.w * this.h);
      for (let i = 0; i < this.terrain.length; i++) {
        const t = NR.terrain.TYPES[this.terrain[i]];
        this.solid[i] = t && t.walk ? 0 : 1;
      }
      for (const p of this.props) {
        if (p.hidden) continue;
        for (let dy = 0; dy < p.h; dy++)
          for (let dx = 0; dx < p.w; dx++) {
            const x = p.x + dx, y = p.y + dy;
            if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
            if (p.solidAt(dx, dy)) this.solid[y * this.w + x] = 1;
          }
      }
      for (const b of this.def.block || []) {
        const [x, y, w = 1, h = 1] = b;
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (this.inBounds(xx, yy)) this.solid[yy * this.w + xx] = 1;
      }
      for (const b of this.def.open || []) {
        const [x, y, w = 1, h = 1] = b;
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (this.inBounds(xx, yy)) this.solid[yy * this.w + xx] = 0;
      }
    }

    inBounds(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
    terrainAt(x, y) {
      x = U.clamp(x, 0, this.w - 1);
      y = U.clamp(y, 0, this.h - 1);
      return this.terrain[y * this.w + x];
    }
    solidAt(x, y) {
      if (!this.inBounds(x, y)) return true;
      return !!this.solid[y * this.w + x];
    }

    // ---------- chunks ----------
    chunk(cx, cy) {
      const key = cx + ',' + cy;
      let c = this.chunks.get(key);
      if (c) {
        this.chunks.delete(key);
        this.chunks.set(key, c);
        return c;
      }
      c = NR.terrain.renderChunk(this, cx, cy, NR.engine.cpr);
      this.chunks.set(key, c);
      while (this.chunks.size > 24) this.chunks.delete(this.chunks.keys().next().value);
      return c;
    }
    clearChunks() {
      this.chunks.clear();
    }
    prefetch(cam) {
      const S = NR.terrain.CH * TS;
      const x0 = Math.floor((cam.x - S * 0.5) / S), y0 = Math.floor((cam.y - S * 0.5) / S);
      const x1 = Math.floor((cam.x + NR.W + S * 0.5) / S), y1 = Math.floor((cam.y + NR.H + S * 0.5) / S);
      for (let cy = y0; cy <= y1; cy++)
        for (let cx = x0; cx <= x1; cx++) {
          if (cx < 0 || cy < 0 || cx * NR.terrain.CH >= this.w || cy * NR.terrain.CH >= this.h) continue;
          if (!this.chunks.has(cx + ',' + cy)) {
            this.chunk(cx, cy);
            return;
          }
        }
    }
    drawGround(ctx, cam) {
      const S = NR.terrain.CH * TS;
      const x0 = Math.floor(cam.x / S), y0 = Math.floor(cam.y / S);
      const x1 = Math.floor((cam.x + NR.W) / S), y1 = Math.floor((cam.y + NR.H) / S);
      ctx.imageSmoothingEnabled = true;
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          if (cx < 0 || cy < 0 || cx * NR.terrain.CH >= this.w || cy * NR.terrain.CH >= this.h) continue;
          const c = this.chunk(cx, cy);
          ctx.drawImage(c, cx * S, cy * S, S, S);
        }
      }
    }

    propAt(x, y) {
      for (const p of this.props) if (!p.hidden && x >= p.x && y >= p.y && x < p.x + p.w && y < p.y + p.h) return p;
      return null;
    }
    eventsAt(x, y, on) {
      return this.events.filter((e) => x >= e.x && y >= e.y && x < e.x + e.w && y < e.y + e.h && (!on || e.on === on));
    }
    lights(time) {
      const out = this.staticLights.slice();
      return out;
    }
  }
  NR.GameMap = GameMap;

  // Tiny terrain builder used by the map files: NR.mb(w, h, fill).rect(...).done()
  NR.mb = function (w, h, fill = 'grass') {
    const cells = new Array(w * h).fill(fill);
    const set = (x, y, t) => {
      if (x >= 0 && y >= 0 && x < w && y < h) cells[y * w + x] = t;
    };
    const B = {
      w, h, cells,
      set(x, y, t) {
        set(x, y, t);
        return B;
      },
      get: (x, y) => cells[U.clamp(y, 0, h - 1) * w + U.clamp(x, 0, w - 1)],
      rect(x0, y0, x1, y1, t) {
        for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, t);
        return B;
      },
      frame(x0, y0, x1, y1, t) {
        for (let x = x0; x <= x1; x++) {
          set(x, y0, t);
          set(x, y1, t);
        }
        for (let y = y0; y <= y1; y++) {
          set(x0, y, t);
          set(x1, y, t);
        }
        return B;
      },
      ellipse(cx, cy, rx, ry, t) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
          for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
            const dx = (x - cx) / rx, dy = (y - cy) / ry;
            if (dx * dx + dy * dy <= 1) set(x, y, t);
          }
        return B;
      },
      // polyline path of given width
      path(pts, t, width = 1) {
        for (let i = 0; i < pts.length - 1; i++) {
          let [x0, y0] = pts[i];
          const [x1, y1] = pts[i + 1];
          const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
          for (let s = 0; s <= steps; s++) {
            const x = Math.round(U.lerp(x0, x1, s / (steps || 1))), y = Math.round(U.lerp(y0, y1, s / (steps || 1)));
            for (let dy = 0; dy < width; dy++) for (let dx = 0; dx < width; dx++) set(x + dx, y + dy, t);
          }
        }
        return B;
      },
      // sprinkle t over cells currently equal to `over`, using smooth noise
      patches(t, over, amount = 0.3, scale = 0.25, seed = 1) {
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            if (over && cells[y * w + x] !== over) continue;
            if (U.fbm(x * scale, y * scale, seed, 2) > 1 - amount) set(x, y, t);
          }
        return B;
      },
      room(x0, y0, x1, y1, floor, wall = 'wall') {
        // two-row top wall, side and bottom walls, floor inside
        B.rect(x0, y0, x1, y1, wall);
        B.rect(x0 + 1, y0 + 2, x1 - 1, y1 - 1, floor);
        return B;
      },
      done() {
        return { w, h, cells };
      },
    };
    return B;
  };

  // ---------- camera ----------
  class Camera {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.target = null;
      this.lock = null; // {x,y} fixed focus for cutscenes
    }
    clampTo(map) {
      const mw = map.w * TS, mh = map.h * TS;
      if (mw <= NR.W) this.x = (mw - NR.W) / 2;
      else this.x = U.clamp(this.x, 0, mw - NR.W);
      if (mh <= NR.H) this.y = (mh - NR.H) / 2;
      else this.y = U.clamp(this.y, 0, mh - NR.H);
    }
    focus(px, py, map, instant) {
      const tx = px - NR.W / 2, ty = py - NR.H / 2;
      if (instant) {
        this.x = tx;
        this.y = ty;
      } else {
        this.x += (tx - this.x) * 0.14;
        this.y += (ty - this.y) * 0.14;
        if (Math.abs(tx - this.x) < 0.3) this.x = tx;
        if (Math.abs(ty - this.y) < 0.3) this.y = ty;
      }
      this.clampTo(map);
    }
  }
  NR.Camera = Camera;
})();
