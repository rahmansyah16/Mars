// The overworld scene: exploration, NPCs, events, visible enemies, HUD, ambience.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, TS = NR.TS;
  const I = NR.input;

  class MapScene {
    constructor() {
      this.isMap = true;
      this.cam = new NR.Camera();
      this.particles = new NR.fx.Particles();
      this.actors = [];
      this.followers = [];
      this.banner = null;
      this.eventBusy = false;
      this.backdrop = null;
      this.hintT = 12;
      this.clickPath = null;
      this.pendingAutosave = false;
    }
    enter() {}

    // ---------- loading ----------
    load(mapId, spawn = {}) {
      const def = NR.MAPS[mapId];
      if (!def) throw new Error('No map ' + mapId);
      const prevId = this.mapId;
      this.mapId = mapId;
      this.map = new NR.GameMap(mapId);
      this.actors = [];
      this.particles.clear();
      this.particles.emitters = (def.emitters || []).map((e) => Object.assign({}, e));
      const st = NR.game.state;
      let sx = spawn.x, sy = spawn.y, sd = spawn.dir;
      if (typeof sx === 'string') {
        const sp = def.spawns && def.spawns[sx];
        if (sp) [sx, sy, sd] = [sp[0], sp[1], sd || sp[2]];
      }
      if (sx == null) {
        const sp = (def.spawns && (def.spawns.default || Object.values(def.spawns)[0])) || [1, 1, 'down'];
        [sx, sy, sd] = [sp[0], sp[1], sd || sp[2]];
      }
      this.player = new NR.Actor({ key: 'player', char: 'naruto', x: sx, y: sy, dir: sd || 'down' });
      this.player.isPlayer = true;
      this.player.onStep = (a) => this.onPlayerStep(a);
      this.actors.push(this.player);
      this.rebuildFollowers();
      this.defeated = new Set();
      this.refreshActors(true);
      // a moment of grace after arriving so nearby monsters don't pounce instantly
      this.enemyCooldown = 1.2;
      st.map = mapId;
      st.x = sx;
      st.y = sy;
      this.cam.focus(this.player.px + TS / 2, this.player.py + TS / 2, this.map, true);
      this.camLock = null;
      this.applyAmbience();
      NR.audio.playBgm(typeof def.bgm === 'function' ? def.bgm() : def.bgm);
      if (prevId !== mapId && !spawn.silent) this.banner = { text: def.name, sub: def.sub || '', t: 0 };
      // warm up chunks around the camera
      for (let i = 0; i < 6; i++) this.map.prefetch(this.cam);
      this.pendingAutosave = !spawn.noAutosave;
      this.enterEventsPending = true;
    }

    applyAmbience() {
      const def = this.map.def;
      const w = typeof def.weather === 'function' ? def.weather() : def.weather;
      this.particles.setWeather(w || null);
      NR.audio.playBgm(typeof def.bgm === 'function' ? def.bgm() : def.bgm);
    }

    spawnActor(o) {
      const a = new NR.Actor(o);
      this.actors.push(a);
      return a;
    }
    removeActor(a) {
      this.actors = this.actors.filter((x) => x !== a);
      this.followers = this.followers.filter((x) => x !== a);
    }
    actorByKey(k) {
      return this.actors.find((a) => a.key === k);
    }
    actorByChar(c) {
      return this.actors.find((a) => a.char === c && !a.isFollower && a !== this.player) || this.actors.find((a) => a.char === c);
    }

    // NPCs / enemies / conditional props from the map definition.
    refreshActors(initial) {
      const def = this.map.def;
      const keep = new Set();
      for (const n of def.npcs || []) {
        const key = n.key || n.char + '@' + n.x + ',' + n.y;
        const ok = !n.if || safe(n.if);
        if (ok) {
          keep.add(key);
          if (!this.actorByKey(key)) {
            const a = new NR.Actor(Object.assign({}, n, { key }));
            a.npc = n;
            this.actors.push(a);
          }
        }
      }
      for (const [i, e] of (def.enemies || []).entries()) {
        const key = e.key || 'enemy' + i;
        const ok = (!e.if || safe(e.if)) && !this.defeated.has(key) && !(e.once && NR.game.state.defeated[this.mapId + ':' + key]);
        if (ok) {
          keep.add(key);
          if (!this.actorByKey(key)) {
            const a = new NR.Actor({ key, char: e.look || null, x: e.x, y: e.y, dir: 'down', wander: e.wander || 3, speed: e.speed || 3.2 });
            a.enemy = e;
            a.wisp = !e.look;
            this.actors.push(a);
          }
        }
      }
      // remove NPC/enemy actors whose conditions no longer hold (spawned script actors stay)
      this.actors = this.actors.filter((a) => !(a.npc || a.enemy) || keep.has(a.key));
      // conditional props
      let changed = false;
      for (const p of this.map.props) {
        const hide = p.o.if ? !safe(p.o.if) : false;
        if (!!p.hidden !== hide) {
          p.hidden = hide;
          changed = true;
        }
      }
      if (changed) {
        this.map.rebuildSolid();
        this.map.clearChunks();
      }
      this.updateMarks();
    }
    updateMarks() {
      for (const a of this.actors) {
        if (!a.npc) continue;
        a.mark = a.npc.mark ? safe(a.npc.mark) || null : null;
      }
    }

    // ---------- party followers ----------
    rebuildFollowers() {
      for (const f of this.followers) this.actors = this.actors.filter((a) => a !== f);
      this.followers = [];
      const party = NR.game.state.party.filter((id) => id !== 'naruto');
      let prev = this.player;
      for (const id of party) {
        const f = new NR.Actor({ key: 'follower_' + id, char: id, x: prev.x, y: prev.y, dir: prev.dir, through: true });
        f.isFollower = true;
        f.visible = this.followersVisible !== false;
        this.followers.push(f);
        this.actors.push(f);
        prev = f;
      }
    }
    resetFollowers() {
      for (const f of this.followers) {
        f.x = this.player.x;
        f.y = this.player.y;
        f.px = this.player.px;
        f.py = this.player.py;
        f.moving = false;
        f.queue.length = 0;
        f.dir = this.player.dir;
      }
    }
    setFollowersVisible(on) {
      this.followersVisible = on;
      for (const f of this.followers) f.visible = on;
      if (on) this.resetFollowers();
    }
    moveFollowers(fromX, fromY) {
      let px = fromX, py = fromY;
      for (const f of this.followers) {
        const ox = f.x, oy = f.y;
        if (ox === px && oy === py) break;
        f.speed = this.player.speed;
        f.queue.length = 0;
        f.walk([{ x: px, y: py }]);
        px = ox;
        py = oy;
      }
    }

    // ---------- collision ----------
    passable(x, y, mover) {
      if (this.map.solidAt(x, y)) return false;
      for (const a of this.actors) {
        if (a === mover || a.through || a.isFollower || !a.visible) continue;
        if (a.x === x && a.y === y) return false;
        if (a.moving && a.fromX === x && a.fromY === y && a !== this.player) return false;
      }
      return true;
    }
    actorAt(x, y) {
      return this.actors.find((a) => a.x === x && a.y === y && a !== this.player && !a.isFollower && a.visible);
    }

    // ---------- events ----------
    runEvent(ev, extra) {
      if (!ev) return;
      if (ev.to) {
        const [m, x, y, d] = ev.to;
        NR.events.run(async (E) => {
          if (ev.sfx !== false) NR.audio.sfx('door');
          await E.transfer(m, x, y, d || this.player.dir);
        });
        return;
      }
      const fn = ev.run;
      NR.events.run(typeof fn === 'string' ? fn : fn, { self: extra, ev });
    }
    tryEvent(list) {
      for (const ev of list) {
        if (ev.if && !safe(ev.if)) {
          if (ev.blocked) {
            NR.events.run(async (E) => {
              if (typeof ev.blocked === 'function') await ev.blocked(E);
              else await E.think('naruto', 'neutral', ev.blocked);
            });
            return true;
          }
          continue;
        }
        if (ev.once && NR.game.flag(ev.once)) continue;
        this.runEvent(ev);
        return true;
      }
      return false;
    }
    onPlayerStep(p) {
      NR.game.state.x = p.x;
      NR.game.state.y = p.y;
      if (NR.events.running) return;
      const evs = this.map.eventsAt(p.x, p.y, 'touch');
      if (evs.length && this.tryEvent(evs)) {
        this.clickPath = null;
        return;
      }
      this.checkEnemyContact();
    }
    checkEnemyContact() {
      if (NR.events.running) return;
      const p = this.player;
      for (const a of this.actors) {
        if (!a.enemy || !a.visible) continue;
        if (Math.abs(a.x - p.x) + Math.abs(a.y - p.y) <= 1 && !(a.moving && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) === 1 && a.fromX === a.x)) {
          this.startEncounter(a);
          return;
        }
      }
    }
    startEncounter(a) {
      const e = a.enemy;
      this.clickPath = null;
      NR.events.run(async (E) => {
        NR.audio.sfx('open');
        a.emote('!', 0.6);
        await E.wait(350);
        const res = await E.battle(e.troop, { bg: e.bg || this.map.def.battleBg });
        if (res === 'win') {
          this.defeated.add(a.key);
          if (e.once) NR.game.state.defeated[this.mapId + ':' + a.key] = true;
          this.removeActor(a);
          if (e.onWin) await e.onWin(E);
        } else if (res === 'escape') {
          a.x = a.home.x;
          a.y = a.home.y;
          a.px = a.x * TS;
          a.py = a.y * TS;
          this.enemyCooldown = 2;
        }
      });
    }
    afterEvent() {
      if (this.pendingAutosave && !NR.events.running) {
        this.pendingAutosave = false;
        if (!this.map.def.noSave && NR.game.state.flags.intro_done) NR.game.save(0);
      }
    }
    checkAutoEvents() {
      if (NR.events.running || NR.ui.blocking()) return;
      if (this.enterEventsPending) {
        this.enterEventsPending = false;
        const evs = this.map.events.filter((e) => e.on === 'enter' && (!e.if || safe(e.if)) && !(e.once && NR.game.flag(e.once)));
        if (evs.length) {
          this.runEvent(evs[0]);
          return;
        }
      }
      for (const ev of this.map.events) {
        if (ev.on !== 'auto') continue;
        if (ev.once && NR.game.flag(ev.once)) continue;
        if (ev.if && !safe(ev.if)) continue;
        this.runEvent(ev);
        return;
      }
      if (this.pendingAutosave) this.afterEvent();
    }

    interact() {
      const p = this.player;
      const [dx, dy] = U.dirs[p.dir];
      const tx = p.x + dx, ty = p.y + dy;
      let target = this.actorAt(tx, ty);
      // talk across counters
      if (!target) {
        const prop = this.map.propAt(tx, ty);
        if (prop && (prop.t === 'counter' || prop.o.counter)) target = this.actorAt(tx + dx, ty + dy);
      }
      if (target && (target.talk || target.npc)) {
        this.talkTo(target);
        return true;
      }
      const evs = [...this.map.eventsAt(tx, ty, 'action'), ...this.map.eventsAt(p.x, p.y, 'here')];
      if (evs.length) return this.tryEvent(evs);
      return false;
    }
    talkTo(a) {
      const talk = a.talk || (a.npc && a.npc.talk);
      if (!talk) return;
      const prevDir = a.dir;
      if (!a.fixed) a.faceTo(this.player);
      NR.events.run(typeof talk === 'string' ? talk : talk, { self: a }).then(() => {
        if (a.npc && a.npc.keepFacing === false) a.dir = prevDir;
      });
    }

    // ---------- update ----------
    update(dt, focus) {
      if (!this.map) return;
      const st = NR.game.state;
      st.playtime += dt;
      this.hintT -= dt;
      if (this.banner) {
        this.banner.t += dt;
        if (this.banner.t > 3.2) this.banner = null;
      }
      if (this.backdrop) this.backdrop.t += dt;
      const free = focus && !NR.events.running && !NR.ui.blocking() && !NR.artManager.open;
      if (free) this.handleInput(dt);
      for (const a of this.actors.slice()) {
        a.update(dt, this);
        if (a.enemy && free) this.updateEnemy(a, dt);
      }
      if (this.enemyCooldown > 0) this.enemyCooldown -= dt;
      this.particles.update(dt, this.cam, this.map);
      const p = this.player;
      if (this.camLock) {
        this.cam.x = this.camLock.x;
        this.cam.y = this.camLock.y;
        this.cam.clampTo(this.map);
      } else this.cam.focus(p.px + TS / 2, p.py + TS / 2, this.map);
      this.map.prefetch(this.cam);
      if (focus) this.checkAutoEvents();
      if (this.markT === undefined || (this.markT -= dt) <= 0) {
        this.markT = 0.5;
        if (!NR.events.running) this.updateMarks();
      }
    }

    updateEnemy(a, dt) {
      const e = a.enemy;
      const p = this.player;
      const d = Math.abs(a.x - p.x) + Math.abs(a.y - p.y);
      if (this.enemyCooldown > 0) return;
      if (d <= 1 && !a.moving && !p.moving) {
        this.startEncounter(a);
        return;
      }
      const chase = e.chase != null ? e.chase : 4;
      if (d <= chase && !a.moving) {
        a.wander = 0;
        a.chaseT = (a.chaseT || 0) - dt;
        if (a.chaseT <= 0) {
          a.chaseT = 0.28;
          const dx = p.x - a.x, dy = p.y - a.y;
          const dirs = Math.abs(dx) > Math.abs(dy) ? [dx < 0 ? 'left' : 'right', dy < 0 ? 'up' : 'down'] : [dy < 0 ? 'up' : 'down', dx < 0 ? 'left' : 'right'];
          for (const dir of dirs) if (a.step(dir, this)) break;
        }
      } else a.wander = e.wander || 3;
    }

    handleInput(dt) {
      const p = this.player;
      if (I.pressed('cancel') || I.pressed('menu') || I.mouse.rclicked) {
        I.consume();
        this.clickPath = null;
        NR.menus.openMain();
        return;
      }
      const dash = I.held('dash') !== !!NR.settings.alwaysDash;
      p.speed = dash ? 6.8 : 4.3;
      if (I.mouse.clicked) this.onClick();
      if (I.pressed('ok')) {
        I.consume('ok');
        if (!p.moving && this.interact()) return;
      }
      if (p.moving) return;
      let dir = I.dirHeld();
      if (dir) this.clickPath = null;
      if (!dir && this.clickPath && this.clickPath.length) {
        const n = this.clickPath[0];
        dir = U.dirFromDelta(n.x - p.x, n.y - p.y);
        if (n.x === p.x && n.y === p.y) {
          this.clickPath.shift();
          return;
        }
        if (!this.passable(n.x, n.y, p)) {
          p.dir = dir;
          this.clickPath = null;
          return;
        }
      }
      if (dir) {
        const fx = p.x, fy = p.y;
        if (p.step(dir, this)) {
          this.moveFollowers(fx, fy);
          if (this.clickPath && this.clickPath.length) this.clickPath.shift();
          if (this.clickPath && !this.clickPath.length) {
            this.clickPath = null;
            if (this.clickTarget) {
              const t = this.clickTarget;
              this.clickTarget = null;
              setTimeout(() => {
                if (!NR.events.running) {
                  p.dir = U.dirFromDelta(t.x - p.x, t.y - p.y);
                  this.interact();
                }
              }, 260);
            }
          }
        } else {
          p.dir = dir;
          const [dx, dy] = U.dirs[dir];
          const bump = this.map.eventsAt(p.x + dx, p.y + dy, 'bump');
          if (bump.length && I.now[dir]) this.tryEvent(bump);
        }
      }
    }

    onClick() {
      const m = I.mouse;
      if (m.y < 60 && m.x > NR.W - 260) return; // HUD area
      const tx = Math.floor((m.x + this.cam.x) / TS), ty = Math.floor((m.y + this.cam.y) / TS);
      const p = this.player;
      if (!this.map.inBounds(tx, ty)) return;
      const target = this.actorAt(tx, ty);
      const evs = this.map.eventsAt(tx, ty, 'action');
      if ((target && (target.talk || target.npc)) || evs.length || this.map.solidAt(tx, ty)) {
        if (Math.abs(tx - p.x) + Math.abs(ty - p.y) === 1) {
          p.dir = U.dirFromDelta(tx - p.x, ty - p.y);
          this.interact();
          return;
        }
        // walk next to it
        let best = null;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const ax = tx + dx, ay = ty + dy;
          if (!this.passable(ax, ay, p) && !(ax === p.x && ay === p.y)) continue;
          const path = NR.pathfind(this.map, p.x, p.y, ax, ay, (x, y) => !this.passable(x, y, p));
          if (path && (!best || path.length < best.length)) best = path;
        }
        if (best) {
          this.clickPath = best;
          this.clickTarget = (target && (target.talk || target.npc)) || evs.length ? { x: tx, y: ty } : null;
        }
        return;
      }
      const path = NR.pathfind(this.map, p.x, p.y, tx, ty, (x, y) => !this.passable(x, y, p));
      if (path && path.length) {
        this.clickPath = path;
        this.clickTarget = null;
        this.clickMarker = { x: tx, y: ty, t: 0 };
      }
    }

    // ---------- lighting ----------
    ambience() {
      const def = this.map.def;
      const t = NR.game.state.time;
      if (def.outdoor) {
        const tod = NR.fx.TOD[t] || NR.fx.TOD.day;
        return { dark: tod.dark + (def.darkBonus || 0), color: tod.color, tint: tod.tint, tintOp: tod.tintOp };
      }
      let dark = def.dark || 0;
      if ((t === 'night' || t === 'evening') && def.nightDark != null) dark = t === 'night' ? def.nightDark : (def.nightDark + dark) / 2;
      return { dark, color: def.darkColor || '#0a0818', tint: def.tint || null, tintOp: def.tintOp };
    }

    // ---------- drawing ----------
    draw(ctx) {
      if (!this.map) return;
      if (this.backdrop) {
        NR.backdrops.draw(ctx, this.backdrop.name, this.backdrop.t, this.backdrop.opts);
        this.particles.draw(ctx, { x: 0, y: 0 }, 'screen');
        return;
      }
      const cam = this.cam;
      const cx = Math.round(cam.x * NR.engine.pr) / NR.engine.pr, cy = Math.round(cam.y * NR.engine.pr) / NR.engine.pr;
      ctx.save();
      ctx.translate(-cx, -cy);
      this.map.drawGround(ctx, { x: cx, y: cy });
      NR.terrain.drawWaterFx(ctx, this.map, { x: cx, y: cy }, NR.engine.time);
      if (this.clickMarker) {
        const m = this.clickMarker;
        m.t += 1 / 60;
        if (m.t < 0.6 && this.clickPath) {
          ctx.strokeStyle = `rgba(255,220,120,${1 - m.t / 0.6})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(m.x * TS + TS / 2, m.y * TS + TS / 2, 10 + m.t * 30, 5 + m.t * 14, 0, 0, U.TAU);
          ctx.stroke();
        } else this.clickMarker = null;
      }
      // y-sorted objects
      const vx0 = cx - TS * 4, vx1 = cx + NR.W + TS * 4, vy0 = cy - TS * 2, vy1 = cy + NR.H + TS * 6;
      const list = [];
      for (const p of this.map.objProps) {
        if (p.hidden) continue;
        const px = p.x * TS, py = p.y * TS;
        if (px + p.w * TS < vx0 || px > vx1 || py + p.h * TS < vy0 || py > vy1) continue;
        list.push({ y: p.sortY, p });
      }
      for (const a of this.actors) {
        if (!a.visible) continue;
        if (a.px < vx0 || a.px > vx1 || a.py < vy0 || a.py > vy1) continue;
        list.push({ y: a.py + TS - 1 + (a.isFollower ? -0.5 : 0), a });
      }
      list.sort((u, v) => u.y - v.y);
      const time = NR.engine.time;
      for (const it of list) {
        if (it.p) NR.props.draw(ctx, it.p, time);
        else if (it.a.wisp) drawWisp(ctx, it.a, time);
        else it.a.draw(ctx);
      }
      for (const p of this.map.objProps) {
        if (!p.hidden && p.T.overhead) {
          ctx.save();
          ctx.translate(p.x * TS, p.y * TS);
          p.T.overhead(ctx, p.o, p.w * TS, p.h * TS, p);
          ctx.restore();
        }
      }
      ctx.restore();
      this.particles.draw(ctx, { x: cx, y: cy });
      // lighting
      const amb = this.ambience();
      if (amb.dark > 0.01) {
        const lights = [];
        const night = NR.game.isEvening();
        for (const l of this.map.staticLights) if (!l.night || night) lights.push(l);
        if (amb.dark > 0.35) lights.push({ x: this.player.px + TS / 2, y: this.player.py + TS / 2, r: this.map.def.playerLight || 200, color: '#ffe8c0', a: 0.75 });
        for (const a of this.actors) if (a.light) lights.push({ x: a.px + TS / 2, y: a.py + TS / 2, r: a.light, color: '#ffd8a0', a: 0.8 });
        NR.fx.drawLighting(ctx, { x: cx, y: cy }, amb.dark, amb.color, lights, time);
      }
      if (amb.tint) NR.fx.drawTint(ctx, amb.tint, amb.tintOp);
      NR.fx.vignette(ctx, this.map.def.outdoor ? 0.28 : 0.38);
      this.drawHUD(ctx);
    }

    drawHUD(ctx) {
      const UI = NR.ui;
      if (NR.events.running && !this.showHudInEvents) {
        this.drawBanner(ctx);
        return;
      }
      const st = NR.game.state;
      // quest tracker
      const q = NR.game.activeQuests('main')[0] || NR.game.activeQuests()[0];
      if (q && !NR.ui.blocking()) {
        ctx.save();
        const lines = U.wrap((ctx.font = `600 16px ${UI.FONT}`, ctx), q.text, 330).slice(0, 3);
        const h = 40 + lines.length * 21;
        UI.panel(ctx, 16, 14, 370, h, { r: 10, alpha: 0.72, border: q.q.type === 'romance' ? '#ff7aa8' : '#e8a43a' });
        UI.text(ctx, (q.q.type === 'main' ? '★ ' : q.q.type === 'romance' ? '♥ ' : '◆ ') + q.q.title, 30, 34, { size: 17, bold: true, color: q.q.type === 'romance' ? '#ffb3cf' : '#ffd28a', maxW: 340 });
        lines.forEach((l, i) => UI.text(ctx, l, 30, 58 + i * 21, { size: 15, color: '#e8e2d6' }));
        ctx.restore();
      }
      // time & money
      const tl = `Day ${st.day} · ${NR.game.TIME_LABEL[st.time]}`;
      UI.panel(ctx, NR.W - 250, 14, 234, 62, { r: 10, alpha: 0.72 });
      drawSunMoon(ctx, NR.W - 222, 45, st.time);
      UI.text(ctx, tl, NR.W - 196, 34, { size: 17, bold: true, color: '#f6e6b8' });
      UI.text(ctx, `💰 ${st.ryo} ryo`, NR.W - 196, 58, { size: 15, color: '#e8e2d6' });
      if (this.hintT > 0 && !NR.ui.blocking()) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.hintT / 2);
        const t = NR.input.lastDevice === 'touch' || NR.input.lastDevice === 'mouse' ? 'Click to walk / talk · Right-click: menu' : 'Arrows/WASD move · Z/Enter talk · X/Esc menu · Shift run';
        const w = UI.measure(ctx, t, 16) + 40;
        UI.panel(ctx, NR.W / 2 - w / 2, NR.H - 54, w, 38, { r: 10, alpha: 0.7 });
        UI.text(ctx, t, NR.W / 2, NR.H - 35, { size: 16, align: 'center', color: '#e8e2d6' });
        ctx.restore();
      }
      this.drawBanner(ctx);
    }
    drawBanner(ctx) {
      const b = this.banner;
      if (!b) return;
      const k = Math.min(1, b.t / 0.4, (3.2 - b.t) / 0.5);
      ctx.save();
      ctx.globalAlpha = U.clamp(k, 0, 1);
      const w = 520, x = NR.W / 2 - w / 2, y = 96 + (1 - U.clamp(k, 0, 1)) * -20;
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, 'rgba(10,12,28,0)');
      g.addColorStop(0.2, 'rgba(10,12,28,0.78)');
      g.addColorStop(0.8, 'rgba(10,12,28,0.78)');
      g.addColorStop(1, 'rgba(10,12,28,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, 64);
      ctx.fillStyle = '#e8a43a';
      ctx.fillRect(x + 60, y, w - 120, 2);
      ctx.fillRect(x + 60, y + 62, w - 120, 2);
      NR.ui.text(ctx, b.text, NR.W / 2, y + (b.sub ? 26 : 32), { size: 26, bold: true, align: 'center', color: '#fff4dc', font: NR.ui.HFONT });
      if (b.sub) NR.ui.text(ctx, b.sub, NR.W / 2, y + 50, { size: 15, align: 'center', color: '#e8c890' });
      ctx.restore();
    }
  }

  function drawSunMoon(ctx, x, y, t) {
    ctx.save();
    if (t === 'night') {
      ctx.fillStyle = '#f6f0c8';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#1a2040';
      ctx.beginPath();
      ctx.arc(x + 6, y - 4, 10, 0, U.TAU);
      ctx.fill();
    } else {
      const col = t === 'evening' ? '#ff9a4a' : t === 'morning' ? '#ffd88a' : '#ffd23a';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * U.TAU + NR.engine.time * 0.3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
        ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Shadow-wisp used for monster encounters on the map.
  function drawWisp(ctx, a, t) {
    const cx = a.px + TS / 2, cy = a.py + TS / 2 + 4;
    const troop = NR.TROOPS[a.enemy.troop];
    const boss = troop && troop.boss;
    const r = boss ? 26 : 20;
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,20,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, a.py + TS - 6, r * 0.9, 6, 0, 0, U.TAU);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const ang = t * 2 + i * 1.05;
      const g = ctx.createRadialGradient(cx + Math.cos(ang) * 6, cy - 6 + Math.sin(ang * 1.3) * 5, 0, cx, cy - 6, r);
      g.addColorStop(0, boss ? 'rgba(150,40,60,0.55)' : 'rgba(90,40,140,0.5)');
      g.addColorStop(1, 'rgba(20,10,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 6, cy - 6 + Math.sin(ang * 1.3) * 5, r, 0, U.TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ff4a4a';
    const bob = Math.sin(t * 3) * 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * 6, cy - 8 + bob, 3, 2, s * 0.3, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function safe(fn) {
    try {
      return typeof fn === 'function' ? fn() : fn;
    } catch (e) {
      console.warn('condition failed', e);
      return false;
    }
  }
  NR.safeCall = safe;
  NR.MapScene = MapScene;
})();
