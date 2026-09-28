// Title screen, 18+ notice and credits.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, UI = NR.ui, W = NR.W, H = NR.H;
  const I = NR.input;

  function drawLogo(ctx, t) {
    ctx.save();
    const y = 170 + Math.sin(t * 1.2) * 3;
    ctx.translate(W / 2, y);
    ctx.transform(1, 0, -0.08, 1, 0, 0);
    ctx.font = `900 112px Impact, "Arial Black", "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#1a0a10';
    ctx.strokeText('NARUTO', 0, 0);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fff4d8';
    ctx.strokeText('NARUTO', 0, 0);
    const g = ctx.createLinearGradient(0, -50, 0, 50);
    g.addColorStop(0, '#ffe07a');
    g.addColorStop(0.45, '#ff9a2a');
    g.addColorStop(1, '#e0501a');
    ctx.fillStyle = g;
    ctx.fillText('NARUTO', 0, 0);
    // swirl behind the O
    ctx.restore();
    ctx.save();
    ctx.translate(W / 2, y + 80);
    ctx.font = `900 40px "Trebuchet MS", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a0a10';
    ctx.strokeText('SEVENTH  DAWN', 0, 0);
    ctx.fillStyle = '#fff0d6';
    ctx.fillText('SEVENTH  DAWN', 0, 0);
    ctx.font = `italic 600 17px ${UI.FONT}`;
    ctx.fillStyle = 'rgba(255,240,220,0.85)';
    ctx.fillText('An unofficial adult fan adventure · 18+', 0, 36);
    ctx.restore();
  }

  class TitleScene {
    constructor() {
      this.t = 0;
      this.opaque = true;
      this.build();
    }
    build() {
      const hasSave = NR.storage.anySave();
      this.items = [
        { label: 'New Game', act: () => this.newGame() },
        { label: 'Continue', act: () => NR.boot.loadGame(NR.storage.latestSlot()), disabled: !hasSave },
        { label: 'Load Game', act: () => NR.menus.saveLoad('load'), disabled: !hasSave },
        { label: 'Art Setup — your pictures & sprites', act: () => NR.artManager.show() },
        { label: 'Settings', act: () => UI.push(new NR.menus.SettingsScreen()) },
        { label: 'Credits', act: () => UI.push(new Credits()) },
      ];
      this.list = new UI.List({
        x: W / 2 - 220, y: 400, w: 440, rowH: 46, visible: 6, items: this.items,
        index: hasSave ? 1 : 0,
        onPick: (i, it) => it.act(),
      });
    }
    enter() {
      NR.audio.playBgm('title');
      this.build();
    }
    resume() {
      this.build();
    }
    async newGame() {
      if (NR.storage.anySave() && !(await NR.menus.confirm('Start a new game? (Your saves are kept.)'))) return;
      NR.boot.newGame();
    }
    update(dt, focus) {
      this.t += dt;
      if (focus && !UI.blocking() && !NR.artManager.open) this.list.update(dt, true);
    }
    draw(ctx) {
      NR.backdrops.draw(ctx, 'title', this.t);
      drawLogo(ctx, this.t);
      UI.panel(ctx, W / 2 - 240, 388, 480, 300, { r: 18, alpha: 0.78 });
      this.list.draw(ctx, (c, it, x, y, w, h, sel) =>
        UI.text(c, it.label, x + w / 2, y + h / 2, { size: 20, bold: sel, align: 'center', color: it.disabled ? '#6a6680' : sel ? '#fff4d6' : '#e8e2d6', maxW: w - 20 })
      , !UI.blocking());
      const n = NR.art.list('portrait').length + NR.art.list('sprite').length;
      const tip = n
        ? `✔ ${NR.art.list('portrait').length} of your character pictures and ${NR.art.list('sprite').length} sprite sheets are loaded.`
        : 'Tip: open “Art Setup” to add your own character pictures and sprites (or start the game with Play.bat).';
      UI.text(ctx, tip, W / 2, H - 22, { size: 15, align: 'center', color: n ? '#b8f0a8' : '#ffe0a8' });
      UI.text(ctx, 'v1.0 · fan work · not affiliated with the creators of Naruto', 16, 20, { size: 12, color: 'rgba(255,255,255,0.45)' });
    }
  }

  class Notice {
    constructor(done) {
      this.done = done;
      this.t = 0;
      this.list = new UI.List({
        x: W / 2 - 230, y: 500, w: 460, rowH: 50, visible: 2,
        items: [{ label: 'I am 18 or older — continue' }, { label: 'Leave' }],
        onPick: (i) => {
          if (i === 0) {
            NR.settings.adultConfirmed = true;
            NR.storage.saveSettings();
            UI.pop(this);
            this.done();
          } else this.left = true;
        },
      });
    }
    update(dt, focus) {
      this.t += dt;
      if (!this.left) this.list.update(dt, focus);
    }
    draw(ctx) {
      UI.bgGradient(ctx, '#0c0e22', '#1c1030');
      const k = Math.min(1, this.t * 2);
      ctx.save();
      ctx.globalAlpha = k;
      UI.panel(ctx, W / 2 - 420, 100, 840, 520, { r: 20 });
      UI.text(ctx, 'Before you play', W / 2, 160, { size: 30, bold: true, align: 'center', color: '#ffd28a' });
      const lines = this.left
        ? ['No problem — you can close this page now.']
        : [
            'Naruto: Seventh Dawn is an unofficial, non-commercial fan game.',
            'Naruto and its characters belong to their creators; this project is not affiliated with them.',
            '',
            'It is set in an alternate timeline five years after the Fourth Great Ninja War.',
            'Every character in this game is an adult (18+).',
            '',
            'It contains mature romantic and suggestive themes intended for adults.',
            'Intimate moments fade to black, and you can turn romance scenes off in Settings.',
          ];
      lines.forEach((l, i) => UI.text(ctx, l, W / 2, 222 + i * 32, { size: 19, align: 'center', color: i === 4 ? '#ffb3cf' : '#ece6da' }));
      if (!this.left) this.list.draw(ctx, (c, it, x, y, w, h, sel) => UI.text(c, it.label, x + w / 2, y + h / 2, { size: 20, bold: sel, align: 'center' }));
      ctx.restore();
    }
  }

  class Credits {
    constructor() {
      this.t = 0;
      this.top = true;
    }
    update(dt, focus) {
      this.t += dt;
      if (focus && (I.okPressed() || I.cancelPressed())) {
        I.consume();
        UI.pop(this);
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(6,8,20,0.9)';
      ctx.fillRect(0, 0, W, H);
      const lines = [
        ['NARUTO: SEVENTH DAWN', 30, '#ffd28a'],
        ['An unofficial fan game', 18, '#c8c0d8'],
        ['', 12],
        ['Naruto © Masashi Kishimoto / Shueisha. Characters used for non-commercial fan work.', 16, '#ece6da'],
        ['', 12],
        ['Game code, story, procedural art and music: made for this fan project', 16, '#ece6da'],
        ['Character pictures and sprites: your own art folders', 16, '#ece6da'],
        ['', 12],
        ['Controls: Arrows/WASD move · Z/Enter/Space confirm · X/Esc menu/back', 15, '#b8b0c8'],
        ['Shift run · Ctrl fast-forward text · Tab conversation log · mouse & gamepad supported', 15, '#b8b0c8'],
        ['', 12],
        ['Thank you for playing. Believe it!', 20, '#ffb44a'],
      ];
      let y = 150;
      for (const [t, s, c] of lines) {
        UI.text(ctx, t, W / 2, y, { size: s, align: 'center', color: c || '#fff', bold: s >= 20 });
        y += s + 18;
      }
      UI.text(ctx, 'Press Z or X to return', W / 2, H - 40, { size: 15, align: 'center', color: '#8a86a0' });
    }
  }
  NR.Credits = Credits;

  NR.titleScreen = {
    show() {
      while (UI.stack.length) UI.pop();
      NR.events.running = false;
      NR.events.depth = 0;
      if (NR.battle) NR.battle.active = null;
      const sc = new TitleScene();
      NR.engine.setScene(sc);
      if (!NR.settings.adultConfirmed) UI.push(new Notice(() => {}));
    },
  };
})();
