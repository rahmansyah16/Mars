// Event runner. Story scripts are async functions receiving an API object `E`.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, TS = NR.TS;
  const EV = (NR.events = { running: false, depth: 0 });
  NR.SCRIPTS = NR.SCRIPTS || {};

  EV.run = async function (fn, info = {}) {
    if (typeof fn === 'string') {
      const f = NR.SCRIPTS[fn];
      if (!f) {
        console.warn('missing script', fn);
        return;
      }
      fn = f;
    }
    const scene = NR.engine.scenes.find((s) => s.isMap);
    EV.depth++;
    EV.running = true;
    if (scene) scene.eventBusy = true;
    NR.msg.seed = U.randi(1, 99999);
    const E = makeAPI(scene, info);
    E.ev = info.ev || null;
    try {
      await fn(E, info.self, info.ev);
    } catch (err) {
      console.error('Event error', err);
      NR.engine.reportError(err);
    } finally {
      EV.depth--;
      if (EV.depth <= 0) {
        EV.depth = 0;
        EV.running = false;
        NR.msg.outfit = null;
        NR.msg.close();
        const sc = NR.engine.scenes.find((s) => s.isMap);
        if (sc) {
          sc.eventBusy = false;
          sc.backdrop = null;
          sc.refreshActors();
          sc.afterEvent();
        }
        if (NR.engine.fade.a > 0.5) NR.engine.fadeIn(300);
      }
    }
  };

  function makeAPI(scene0, info) {
    const S = () => NR.engine.scenes.find((s) => s.isMap) || scene0;
    const brk = () => NR.msg.close(true);
    const who = (w) => {
      const sc = S();
      if (!w || w === 'player') return sc.player;
      if (w instanceof NR.Actor) return w;
      return sc.actorByKey(w) || sc.actorByChar(w);
    };
    const E = {
      self: info.self,
      game: NR.game,
      get scene() {
        return S();
      },
      // ----- dialogue -----
      say: (w, emo, text, o) => NR.msg.say(w, emo, text, o),
      narrate: (text, o) => NR.msg.say(null, null, text, Object.assign({ style: 'narrate' }, o)),
      think: (w, emo, text, o) => NR.msg.say(w, emo, text, Object.assign({ style: 'think' }, o)),
      choice: (opts, o) => NR.msg.choice(opts, o),
      outfit: (tag) => (NR.msg.outfit = tag || null),
      clearStage: () => NR.msg.clearStage(),
      close: () => brk(),
      // ----- timing & screen -----
      wait: (ms) => (brk(), NR.engine.wait(ms)),
      fadeOut: (ms = 500, color) => (brk(), NR.engine.fadeOut(ms, color)),
      fadeIn: (ms = 500) => NR.engine.fadeIn(ms),
      flash: (color, a) => NR.engine.flash(color, a),
      shake: (p, t) => NR.engine.shake(p, t),
      sfx: (n) => NR.audio.sfx(n),
      bgm: (n) => NR.audio.playBgm(n),
      stopBgm: () => NR.audio.stopBgm(),
      jingle: (n) => NR.audio.jingle(n),
      weather: (w) => S().particles.setWeather(w),
      // full-screen painted backdrop for intimate/cinematic scenes (null to clear)
      backdrop: async (name, o = {}) => {
        const sc = S();
        if (o.fade !== false) {
          brk();
          await NR.engine.fadeOut(o.ms || 450);
        }
        sc.backdrop = name ? { name, t: 0, opts: o } : null;
        if (o.fade !== false) await NR.engine.fadeIn(o.ms || 450);
      },
      title: (text, sub, ms = 2600) => (brk(), NR.ui.titleCard(text, sub, ms)),
      // ----- actors -----
      actor: (w) => who(w),
      player: () => S().player,
      face: (w, dir) => {
        const a = who(w);
        if (!a) return;
        if (dir === 'player' || dir instanceof NR.Actor || (typeof dir === 'string' && !U.dirs[dir])) {
          const b = dir === 'player' ? S().player : who(dir);
          if (b) a.faceTo(b);
        } else a.face(dir);
      },
      faceEach: (a, b) => {
        const A = who(a), B = who(b);
        if (A && B) {
          A.faceTo(B);
          B.faceTo(A);
        }
      },
      emote: async (w, kind, ms = 900) => {
        const a = who(w);
        if (a) a.emote(kind, ms / 1000 + 0.3);
        await NR.engine.wait(ms);
      },
      jump: async (w) => {
        const a = who(w);
        if (a) a.doJump();
        await NR.engine.wait(420);
      },
      move: async (w, path, o = {}) => {
        brk();
        const a = who(w);
        if (!a) return;
        const steps = typeof path === 'string' ? path.split('') : path;
        const oldSpeed = a.speed, oldThrough = a.through;
        if (o.speed) a.speed = o.speed;
        a.through = o.through != null ? o.through : true;
        const p = a.walk(steps);
        if (o.wait !== false) await p;
        a.speed = oldSpeed;
        a.through = oldThrough;
      },
      moveTo: async (w, x, y, o = {}) => {
        brk();
        const a = who(w);
        if (!a) return;
        const sc = S();
        const path = NR.pathfind(sc.map, a.x, a.y, x, y, (tx, ty) => sc.map.solidAt(tx, ty) && !(tx === x && ty === y)) || [];
        const oldSpeed = a.speed;
        if (o.speed) a.speed = o.speed;
        a.forceWalk = true;
        await a.walk(path);
        a.forceWalk = false;
        a.speed = oldSpeed;
        if (o.face) a.face(o.face);
      },
      place: (w, x, y, dir) => {
        const a = who(w);
        if (!a) return;
        a.x = x;
        a.y = y;
        a.px = x * TS;
        a.py = y * TS;
        a.moving = false;
        if (dir) a.dir = dir;
        if (a === S().player) S().resetFollowers();
      },
      spawn: (o) => S().spawnActor(o),
      remove: (w) => {
        const a = who(w);
        if (a) S().removeActor(a);
      },
      show: (w, v = true) => {
        const a = who(w);
        if (a) a.visible = v;
      },
      hide: (w) => E.show(w, false),
      followers: (on) => S().setFollowersVisible(on),
      poof: (w) => {
        const a = who(w);
        if (!a) return;
        NR.audio.sfx('poof');
        S().particles.burst(a.px + 32, a.py + 30, 14, { type: 'poof', speed: 80, life: 0.6, size: 12, color: '#eeeef2' });
      },
      camera: async (x, y, ms = 800) => {
        brk();
        const sc = S();
        const from = { x: sc.cam.x, y: sc.cam.y };
        sc.camLock = { x: from.x, y: from.y };
        const tx = x * TS + TS / 2 - NR.W / 2, ty = y * TS + TS / 2 - NR.H / 2;
        await NR.engine.tween(sc.camLock, { x: tx, y: ty }, ms);
      },
      cameraReset: async (ms = 600) => {
        const sc = S();
        if (!sc.camLock) return;
        const p = sc.player;
        await NR.engine.tween(sc.camLock, { x: p.px + TS / 2 - NR.W / 2, y: p.py + TS / 2 - NR.H / 2 }, ms);
        sc.camLock = null;
      },
      // ----- world -----
      transfer: async (map, x, y, dir, o = {}) => {
        brk();
        if (o.fade !== false) await NR.engine.fadeOut(o.ms || 350);
        S().load(map, { x, y, dir });
        if (o.fade !== false) await NR.engine.fadeIn(o.ms || 350);
      },
      battle: (troop, o = {}) => (brk(), NR.battle.start(troop, o)),
      refresh: () => S().refreshActors(),
      // ----- state -----
      flag: (k, v) => NR.game.flag(k, v),
      vr: (k, v) => NR.game.vr(k, v),
      has: (it, n) => NR.game.has(it, n),
      give: (it, n = 1, silent) => {
        NR.game.give(it, n);
        if (!silent) {
          NR.audio.sfx('item');
          const d = NR.ITEMS[it];
          NR.ui.toast(`Obtained [y]${d ? d.name : it}[/y]${n > 1 ? ' ×' + n : ''}`, { icon: d ? d.icon : '🎁' });
        }
      },
      take: (it, n = 1) => NR.game.take(it, n),
      ryo: (n) => {
        NR.game.addRyo(n);
        if (n > 0) {
          NR.audio.sfx('coin');
          NR.ui.toast(`+${n} ryo`, { icon: '💰' });
        }
      },
      quest: (id, stage, silent) => NR.game.setQuest(id, stage, silent),
      complete: (id, silent) => NR.game.completeQuest(id, silent),
      qs: (id) => NR.game.qStage(id),
      qdone: (id) => NR.game.qDone(id),
      aff: (c, n, silent) => (n === undefined ? NR.game.aff(c) : NR.game.addAff(c, n, silent)),
      join: (c, silent) => {
        NR.game.addGuest(c);
        S().rebuildFollowers();
        if (!silent) {
          NR.audio.sfx('item');
          NR.ui.toast(`[y]${NR.charName(c)}[/y] joined the party!`, { icon: '⭐' });
        }
      },
      leave: (c, silent) => {
        NR.game.removeMember(c);
        NR.game.flag('companion_' + c, false);
        S().rebuildFollowers();
        if (!silent) NR.ui.toast(`${NR.charName(c)} left the party.`, { icon: '👋' });
      },
      heal: () => NR.game.fullHeal(),
      time: (t) => {
        NR.game.setTime(t);
        S().applyAmbience();
      },
      nextDay: () => {
        NR.game.nextDay();
        S().applyAmbience();
      },
      chapter: (n) => (NR.game.state.chapter = n),
      unlock: (key) => NR.game.unlockScene(key),
      romanceOn: () => NR.settings.romance !== false,
      inParty: (c) => NR.game.inParty(c),
      // ----- menus / minigames -----
      shop: (list, o) => (brk(), NR.menus.shop(list, o)),
      saveMenu: () => (brk(), NR.menus.saveLoad('save')),
      gift: (c) => (brk(), NR.menus.giftPicker(c)),
      minigame: (name, o) => (brk(), NR.minigames[name](o || {})),
      rest: async (untilTime) => {
        brk();
        await NR.engine.fadeOut(600);
        NR.game.fullHeal();
        if (!untilTime || untilTime === 'morning') NR.game.nextDay();
        else NR.game.setTime(untilTime);
        S().applyAmbience();
        S().refreshActors();
        await NR.engine.wait(500);
        await NR.engine.fadeIn(600);
      },
    };
    return E;
  }
})();
