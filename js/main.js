// Boot: start the engine, load the player's art, show the title screen.
(function () {
  'use strict';
  const NR = window.NR;

  NR.boot = {
    async start() {
      const canvas = document.getElementById('game');
      NR.engine.init(canvas);
      NR.input.bind(canvas);
      const unlock = () => NR.audio.unlock();
      for (const ev of ['keydown', 'mousedown', 'touchstart', 'pointerdown']) window.addEventListener(ev, unlock, { passive: true });
      NR.ui.loading = 'Loading your art…';
      try {
        await NR.art.init();
      } catch (e) {
        console.warn('art init failed', e);
      }
      NR.ui.loading = null;
      NR.art.onChange(() => {
        const sc = NR.engine.scenes.find((s) => s.isMap);
        if (sc && sc.map) sc.map.clearChunks();
      });
      NR.titleScreen.show();
      NR.engine.on('cprchange', () => {
        const sc = NR.engine.scenes.find((s) => s.isMap);
        if (sc && sc.map) sc.map.clearChunks();
        NR.terrain.clearTex();
      });
      if (window.NR_DEV && window.NR_DEV.onReady) window.NR_DEV.onReady();
    },
    newGame() {
      NR.events.running = false;
      NR.events.depth = 0;
      NR.battle.active = null;
      NR.game.newGame();
      NR.msg.log = [];
      const st = NR.game.state;
      const sc = new NR.MapScene();
      NR.engine.setScene(sc);
      sc.load(st.map, { x: st.x, y: st.y, dir: st.dir, noAutosave: true, silent: true });
    },
    loadGame(slot) {
      if (slot < 0 || !NR.game.load(slot)) {
        NR.audio.sfx('buzzer');
        return false;
      }
      while (NR.ui.stack.length) NR.ui.pop();
      NR.events.running = false;
      NR.events.depth = 0;
      NR.battle.active = null;
      NR.msg.log = [];
      const st = NR.game.state;
      const sc = new NR.MapScene();
      NR.engine.setScene(sc);
      sc.load(st.map, { x: st.x, y: st.y, dir: st.dir, noAutosave: true });
      NR.engine.fade.a = 1;
      NR.engine.fadeIn(500);
      return true;
    },
  };
  NR.game.onArtChanged = () => {
    NR.menus && NR.art && (NR.art.spriteCache = {});
  };

  // Show script errors on screen so problems can be reported.
  const errBox = document.getElementById('errors');
  const showErr = (msg) => {
    if (!errBox) return;
    errBox.style.display = 'block';
    const line = document.createElement('div');
    line.textContent = msg;
    errBox.appendChild(line);
    while (errBox.childNodes.length > 6) errBox.removeChild(errBox.firstChild);
  };
  window.addEventListener('error', (e) => showErr('Error: ' + (e.message || e.error)));
  window.addEventListener('unhandledrejection', (e) => showErr('Error: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)));
  const origReport = NR.engine.reportError;
  NR.engine.reportError = (err) => {
    origReport(err);
    showErr('Error: ' + ((err && err.message) || err));
  };

  window.addEventListener('load', () => NR.boot.start());
})();
