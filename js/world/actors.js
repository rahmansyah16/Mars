// Characters on the map: player, followers, NPCs and visible enemies.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const TS = NR.TS;

  // Sprite sheet for a character: the player's own sheet if assigned, else generated.
  NR.sheetOf = function (charId) {
    const user = NR.art && NR.art.spriteFor(charId);
    if (user) return user;
    const g = NR.spritegen.get(charId);
    if (!g) return null;
    g.layout = NR.art.LAYOUTS.rm;
    g.bx = g.by = 0;
    g.scale = 1;
    return g;
  };

  let uid = 0;
  class Actor {
    constructor(o) {
      this.key = o.key || 'a' + ++uid;
      this.char = o.char;
      this.x = o.x;
      this.y = o.y;
      this.px = o.x * TS;
      this.py = o.y * TS;
      this.dir = o.dir || 'down';
      this.speed = o.speed || 4.2;
      this.moving = false;
      this.stepDist = 0;
      this.idleT = 0;
      this.wander = o.wander || 0;
      this.home = { x: o.x, y: o.y };
      this.wanderT = U.rand(1.5, 4);
      this.talk = o.talk;
      this.through = !!o.through;
      this.visible = o.visible !== false;
      this.fixed = !!o.fixed;
      this.balloon = null;
      this.queue = [];
      this.waiters = [];
      this.enemy = o.enemy || null;
      this.opacity = 1;
      this.jump = 0;
      this.scale = o.scale || 1;
      this.def = o;
      this.pose = o.pose || null; // 'sit' | 'lie' | 'sleep'
    }
    sheet() {
      return NR.sheetOf(this.char);
    }
    get busy() {
      return this.moving || this.queue.length > 0;
    }
    face(dir) {
      if (dir) this.dir = dir;
    }
    faceTo(a) {
      this.dir = U.dirFromDelta(a.x - this.x, a.y - this.y);
    }
    canEnter(scene, x, y) {
      if (this.through) return scene.map.inBounds(x, y);
      return scene.passable(x, y, this);
    }
    // Start moving one tile in dir if possible.
    step(dir, scene, force) {
      const [dx, dy] = U.dirs[dir];
      this.dir = dir;
      const nx = this.x + dx, ny = this.y + dy;
      if (!force && !this.canEnter(scene, nx, ny)) return false;
      this.fromX = this.x;
      this.fromY = this.y;
      this.x = nx;
      this.y = ny;
      this.moving = true;
      return true;
    }
    // Queue a path of tile coordinates or direction letters (u/d/l/r).
    walk(path) {
      for (const p of path) this.queue.push(p);
      return new Promise((r) => this.waiters.push(r));
    }
    stop() {
      this.queue.length = 0;
    }
    update(dt, scene) {
      if (this.moving) {
        const tx = this.x * TS, ty = this.y * TS;
        const sp = this.speed * TS * dt;
        const dx = tx - this.px, dy = ty - this.py;
        const d = Math.hypot(dx, dy);
        this.stepDist += Math.min(sp, d);
        if (d <= sp) {
          this.px = tx;
          this.py = ty;
          this.moving = false;
          this.idleT = 0;
          if (this.onStep) this.onStep(this);
        } else {
          this.px += (dx / d) * sp;
          this.py += (dy / d) * sp;
        }
      }
      if (!this.moving && this.queue.length) {
        const next = this.queue[0];
        let dir = null;
        if (typeof next === 'string') {
          if (next === 'wait') {
            this.queue.shift();
            return;
          }
          if (next.startsWith('face:')) {
            this.dir = next.slice(5);
            this.queue.shift();
            return;
          }
          dir = { u: 'up', d: 'down', l: 'left', r: 'right' }[next] || next;
        } else {
          if (next.x === this.x && next.y === this.y) {
            this.queue.shift();
            return;
          }
          dir = U.dirFromDelta(next.x - this.x, next.y - this.y);
        }
        const ok = this.step(dir, scene, this.forceWalk);
        if (ok) {
          if (typeof next === 'string' || (next.x === this.x && next.y === this.y)) this.queue.shift();
          this.blockedT = 0;
        } else {
          this.blockedT = (this.blockedT || 0) + dt;
          if (this.blockedT > 1.2) {
            // give up after being blocked for a while
            this.queue.length = 0;
            this.blockedT = 0;
          }
        }
      }
      if (!this.moving && !this.queue.length && this.waiters.length) {
        const w = this.waiters;
        this.waiters = [];
        w.forEach((r) => r());
      }
      if (!this.moving) this.idleT += dt;
      // idle wandering NPCs
      if (this.wander && !this.moving && !this.queue.length && !scene.eventBusy) {
        this.wanderT -= dt;
        if (this.wanderT <= 0) {
          this.wanderT = U.rand(2, 5);
          const d = U.pick(['up', 'down', 'left', 'right']);
          const [dx, dy] = U.dirs[d];
          if (Math.abs(this.x + dx - this.home.x) <= this.wander && Math.abs(this.y + dy - this.home.y) <= this.wander) this.step(d, scene);
          else this.dir = d;
        }
      }
      if (this.balloon) {
        this.balloon.t += dt;
        if (this.balloon.t > this.balloon.dur) this.balloon = null;
      }
      if (this.jumpT != null) {
        this.jumpT += dt;
        const k = this.jumpT / 0.4;
        this.jump = k >= 1 ? 0 : -Math.sin(k * Math.PI) * 26;
        if (k >= 1) this.jumpT = null;
      }
    }
    doJump() {
      this.jumpT = 0;
    }
    emote(kind, dur = 1.4) {
      this.balloon = { kind, t: 0, dur };
    }
    footX() {
      return this.px + TS / 2;
    }
    footY() {
      return this.py + TS - 3;
    }
    draw(ctx) {
      if (!this.visible || this.opacity <= 0) return;
      const sh = this.sheet();
      if (!sh) return;
      const cx = this.px + TS / 2, by = this.py + TS - 3;
      ctx.save();
      ctx.globalAlpha = this.opacity;
      // shadow
      ctx.fillStyle = 'rgba(10,15,20,0.28)';
      ctx.beginPath();
      ctx.ellipse(cx, by - 1, 17 * this.scale, 6 * this.scale, 0, 0, U.TAU);
      ctx.fill();
      const L = sh.layout;
      const row = L.dirs[this.dir] != null ? L.dirs[this.dir] : 0;
      let col = L.idle;
      const walking = this.moving || this.idleT < 0.08;
      if (walking) col = L.cycle[Math.floor(this.stepDist / (TS * 0.5)) % L.cycle.length];
      // fit the frame to one tile wide, but keep tall frames (single-image sprites) from towering
      const s = Math.min(TS / sh.fw, (TS * 1.2) / sh.fh) * (sh.scale || 1) * this.scale;
      const dw = sh.fw * s, dh = sh.fh * s;
      ctx.imageSmoothingEnabled = sh.smooth !== false;
      let dy = by - dh + 2 + this.jump;
      if (this.pose === 'sit') dy += 8;
      if (this.pose === 'lie' || this.pose === 'sleep') {
        ctx.translate(cx, by - 14);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(sh.img, sh.bx + L.idle * sh.fw, sh.by + L.dirs.down * sh.fh, sh.fw, sh.fh, -dh / 2 - 4, -dw / 2, dw, dh);
        ctx.restore();
        if (this.pose === 'sleep' && Math.floor(NR.engine.time * 1.2) % 3 !== 0) NR.fx.drawBalloon(ctx, cx + 20, by - 40, 'zzz', 1);
        return;
      }
      ctx.drawImage(sh.img, sh.bx + col * sh.fw, sh.by + row * sh.fh, sh.fw, sh.fh, cx - dw / 2, dy, dw, dh);
      ctx.restore();
      if (this.balloon) NR.fx.drawBalloon(ctx, cx, dy + (sh.user ? dh * 0.15 : 6), this.balloon.kind, this.balloon.t / this.balloon.dur);
      else if (this.mark) this.drawMark(ctx, cx, dy + 4);
    }
    drawMark(ctx, cx, y) {
      // floating quest/romance marker above head
      const b = Math.sin(NR.engine.time * 4) * 3;
      ctx.save();
      ctx.translate(cx, y - 10 + b);
      if (this.mark === 'heart') {
        ctx.scale(1.3, 1.3);
        NR.fx.heartPath(ctx);
        ctx.fillStyle = '#ff5a8a';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = this.mark === '?' ? '#5ab0ff' : '#ffd23a';
        ctx.strokeStyle = '#2a1c22';
        ctx.lineWidth = 3;
        ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(this.mark, 0, 0);
        ctx.fillText(this.mark, 0, 0);
      }
      ctx.restore();
    }
  }
  NR.Actor = Actor;
})();
