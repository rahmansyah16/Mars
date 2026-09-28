// Keyboard, mouse, touch and gamepad mapped to game actions.
(function () {
  'use strict';
  const NR = window.NR;

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Enter: 'ok', Space: 'ok', NumpadEnter: 'ok',
    KeyX: 'cancel', Escape: 'cancel', Backspace: 'cancel', Numpad0: 'cancel',
    ShiftLeft: 'dash', ShiftRight: 'dash',
    KeyQ: 'pageup', PageUp: 'pageup',
    KeyE: 'pagedown', PageDown: 'pagedown',
    ControlLeft: 'skip', ControlRight: 'skip',
    Tab: 'log', KeyL: 'log',
    KeyM: 'menu', KeyC: 'menu',
    F2: 'fps',
  };

  const I = (NR.input = {
    down: {}, // physically held (keyboard)
    padDown: {},
    queue: {}, // pressed since last update
    now: {}, // pressed this frame
    repeatT: {},
    repeatNow: {},
    mouse: { x: -100, y: -100, down: false, clicked: false, rclicked: false, moved: false, wheel: 0, _q: {} },
    lastDevice: 'keyboard',
    enabled: true,
  });

  function press(a) {
    I.queue[a] = true;
  }

  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
    if (document.body.classList.contains('dom-overlay')) return;
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    I.lastDevice = 'keyboard';
    if (!e.repeat) press(a);
    I.down[a] = true;
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (a) I.down[a] = false;
  });
  window.addEventListener('blur', () => {
    I.down = {};
    I.padDown = {};
  });

  function toLogical(cx, cy) {
    const c = NR.engine.canvas;
    const r = c.getBoundingClientRect();
    return [((cx - r.left) / r.width) * NR.W, ((cy - r.top) / r.height) * NR.H];
  }

  function bindPointer(canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const [x, y] = toLogical(e.clientX, e.clientY);
      I.mouse.x = x;
      I.mouse.y = y;
      I.mouse._q.moved = true;
      I.lastDevice = 'mouse';
    });
    canvas.addEventListener('mousedown', (e) => {
      const [x, y] = toLogical(e.clientX, e.clientY);
      I.mouse.x = x;
      I.mouse.y = y;
      if (e.button === 0) {
        I.mouse.down = true;
        I.mouse._q.clicked = true;
      } else if (e.button === 2) I.mouse._q.rclicked = true;
      I.lastDevice = 'mouse';
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) I.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener(
      'wheel',
      (e) => {
        I.mouse._q.wheel = (I.mouse._q.wheel || 0) + Math.sign(e.deltaY);
        e.preventDefault();
      },
      { passive: false }
    );
    let touchStart = 0, touches = 0;
    canvas.addEventListener(
      'touchstart',
      (e) => {
        touches = e.touches.length;
        touchStart = performance.now();
        const t = e.changedTouches[0];
        const [x, y] = toLogical(t.clientX, t.clientY);
        I.mouse.x = x;
        I.mouse.y = y;
        I.mouse.down = true;
        I.lastDevice = 'touch';
        e.preventDefault();
      },
      { passive: false }
    );
    canvas.addEventListener(
      'touchend',
      (e) => {
        I.mouse.down = false;
        if (touches >= 2) I.mouse._q.rclicked = true;
        else if (performance.now() - touchStart < 600) I.mouse._q.clicked = true;
        touches = 0;
        e.preventDefault();
      },
      { passive: false }
    );
  }
  I.bind = bindPointer;

  // ---------- gamepad ----------
  let padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && Array.from(pads).find((x) => x && x.connected);
    const cur = {};
    if (p) {
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      cur.up = b(12) || ay < -0.5;
      cur.down = b(13) || ay > 0.5;
      cur.left = b(14) || ax < -0.5;
      cur.right = b(15) || ax > 0.5;
      cur.ok = b(0);
      cur.cancel = b(1);
      cur.menu = b(9) || b(3);
      cur.dash = b(2) || b(7);
      cur.pageup = b(4);
      cur.pagedown = b(5);
      cur.skip = b(6);
      for (const k in cur) {
        if (cur[k] && !padPrev[k]) {
          press(k);
          I.lastDevice = 'gamepad';
        }
      }
    }
    padPrev = cur;
    I.padDown = cur;
  }

  I.update = function (dt) {
    pollPad();
    I.now = I.queue;
    I.queue = {};
    const m = I.mouse;
    m.clicked = !!m._q.clicked;
    m.rclicked = !!m._q.rclicked;
    m.moved = !!m._q.moved;
    m.wheel = m._q.wheel || 0;
    m._q = {};
    // key repeat for menu navigation
    I.repeatNow = {};
    for (const a of ['up', 'down', 'left', 'right', 'pageup', 'pagedown']) {
      if (I.now[a]) {
        I.repeatNow[a] = true;
        I.repeatT[a] = 0.32;
      } else if (I.held(a)) {
        I.repeatT[a] -= dt;
        if (I.repeatT[a] <= 0) {
          I.repeatNow[a] = true;
          I.repeatT[a] = 0.07;
        }
      }
    }
  };
  I.endFrame = function () {};

  I.pressed = (a) => I.enabled && !!I.now[a];
  I.held = (a) => I.enabled && !!(I.down[a] || I.padDown[a]);
  I.repeat = (a) => I.enabled && !!I.repeatNow[a];
  I.consume = (a) => {
    if (a) {
      I.now[a] = false;
      I.repeatNow[a] = false;
    } else {
      I.now = {};
      I.repeatNow = {};
      I.mouse.clicked = false;
      I.mouse.rclicked = false;
    }
  };
  I.okPressed = () => I.pressed('ok') || I.mouse.clicked;
  I.cancelPressed = () => I.pressed('cancel') || I.mouse.rclicked;
  I.anyPressed = () => Object.keys(I.now).some((k) => I.now[k]) || I.mouse.clicked;
  I.dirHeld = () => {
    // most recent wins would be nicer; simple priority is fine for grid movement
    if (I.held('up')) return 'up';
    if (I.held('down')) return 'down';
    if (I.held('left')) return 'left';
    if (I.held('right')) return 'right';
    return null;
  };
  I.inRect = (x, y, w, h) => I.mouse.x >= x && I.mouse.x < x + w && I.mouse.y >= y && I.mouse.y < y + h;
})();
