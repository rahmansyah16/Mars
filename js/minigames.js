// Minigames: Cho-Han dice (gambling) and a timing bar (target practice, drinking, training).
(function () {
  'use strict';
  const NR = window.NR, U = NR.U, UI = NR.ui, W = NR.W, H = NR.H;
  const I = NR.input;
  const MG = (NR.minigames = {});

  // ---------- Cho-Han ----------
  class Dice {
    constructor(o, resolve) {
      this.o = Object.assign({ bet: 100, need: 3, maxRounds: 6, luck: 0.55 }, o);
      this.resolve = resolve;
      this.wins = 0;
      this.losses = 0;
      this.round = 0;
      this.state = 'choose';
      this.t = 0;
      this.dice = [1, 1];
      this.list = new UI.List({
        x: W / 2 - 330, y: 560, w: 660, rowH: 50, visible: 1, cols: 3,
        items: [{ label: 'Cho (even)' }, { label: 'Han (odd)' }, { label: 'Quit' }],
        onPick: (i) => this.pick(i),
        onCancel: () => this.pick(2),
      });
    }
    pick(i) {
      if (this.state !== 'choose') return;
      if (i === 2) return this.end();
      this.guess = i;
      this.state = 'shake';
      this.t = 0;
      NR.audio.sfx('dice');
      // decide outcome (a little rigged by luck)
      const win = Math.random() < this.o.luck;
      let a, b;
      for (let k = 0; k < 50; k++) {
        a = U.randi(1, 6);
        b = U.randi(1, 6);
        const even = (a + b) % 2 === 0;
        if ((even === (i === 0)) === win) break;
      }
      this.dice = [a, b];
      this.win = ((a + b) % 2 === 0) === (i === 0);
    }
    end() {
      UI.pop(this);
      this.resolve({ wins: this.wins, losses: this.losses, won: this.wins >= this.o.need });
    }
    update(dt, focus) {
      this.t += dt;
      if (this.state === 'choose') this.list.update(dt, focus);
      else if (this.state === 'shake' && this.t > 1.4) {
        this.state = 'reveal';
        this.t = 0;
        this.round++;
        if (this.win) {
          this.wins++;
          NR.audio.sfx('coin');
        } else {
          this.losses++;
          NR.audio.sfx('buzzer');
        }
      } else if (this.state === 'reveal' && this.t > 1.2 && focus && (I.okPressed() || this.t > 2.4)) {
        I.consume();
        if (this.wins >= this.o.need || this.round >= this.o.maxRounds) return this.end();
        this.state = 'choose';
        this.t = 0;
      }
    }
    drawDie(ctx, x, y, n, s) {
      ctx.save();
      ctx.translate(x, y);
      UI.rr(ctx, -s / 2, -s / 2, s, s, s * 0.18);
      ctx.fillStyle = '#f8f4ea';
      ctx.fill();
      ctx.strokeStyle = '#6a5a4a';
      ctx.lineWidth = 3;
      ctx.stroke();
      const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n];
      ctx.fillStyle = n === 1 ? '#d8321e' : '#2a1a14';
      for (const [px, py] of pips) {
        ctx.beginPath();
        ctx.arc(px * s * 0.26, py * s * 0.26, s * (n === 1 ? 0.13 : 0.09), 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(8,6,12,0.86)';
      ctx.fillRect(0, 0, W, H);
      UI.text(ctx, this.o.title || 'Cho-Han — Dice Hall', W / 2, 70, { size: 32, bold: true, align: 'center', color: '#ffd28a', font: UI.HFONT });
      UI.text(ctx, `Wins ${this.wins} / ${this.o.need} needed · Losses ${this.losses} · Round ${this.round}/${this.o.maxRounds}`, W / 2, 112, { size: 18, align: 'center', color: '#e8e2d6' });
      // mat
      ctx.save();
      UI.rr(ctx, W / 2 - 360, 150, 720, 380, 30);
      const g = ctx.createRadialGradient(W / 2, 330, 40, W / 2, 330, 420);
      g.addColorStop(0, '#3a7a4a');
      g.addColorStop(1, '#1a3a24');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.restore();
      const cx = W / 2, cy = 340;
      if (this.state === 'reveal') {
        this.drawDie(ctx, cx - 60, cy, this.dice[0], 80);
        this.drawDie(ctx, cx + 60, cy, this.dice[1], 80);
        const sum = this.dice[0] + this.dice[1];
        UI.text(ctx, `${sum} — ${sum % 2 ? 'Han (odd)' : 'Cho (even)'}`, cx, cy + 90, { size: 24, bold: true, align: 'center' });
        UI.text(ctx, this.win ? 'You win!' : 'You lose!', cx, cy + 130, { size: 34, bold: true, align: 'center', color: this.win ? '#9ae8a0' : '#ff8a7a', outline: '#1a0a0a' });
      }
      // cup
      const lift = this.state === 'reveal' ? Math.min(1, this.t * 3) * 150 : 0;
      const shake = this.state === 'shake' ? Math.sin(this.t * 40) * 10 : 0;
      ctx.save();
      ctx.translate(cx + shake, cy - lift + 10);
      ctx.fillStyle = '#6a3a1e';
      ctx.beginPath();
      ctx.moveTo(-90, 40);
      ctx.lineTo(-70, -80);
      ctx.lineTo(70, -80);
      ctx.lineTo(90, 40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3a1a0a';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#c8943a';
      ctx.fillRect(-84, 10, 168, 10);
      ctx.restore();
      if (this.state === 'choose') {
        UI.panel(ctx, W / 2 - 350, 548, 700, 74, { r: 14 });
        this.list.draw(ctx, (c, it, x, y, w, h, sel) => UI.text(c, it.label, x + w / 2, y + h / 2, { size: 20, bold: sel, align: 'center' }));
        UI.text(ctx, 'Guess whether the two dice add up to an even (Cho) or odd (Han) number.', W / 2, 650, { size: 16, align: 'center', color: '#b8b0c8' });
      }
    }
  }
  MG.dice = (o) => new Promise((r) => UI.push(new Dice(o, r)));

  // ---------- timing bar ----------
  const THEMES = {
    target: { title: 'Target Practice', icon: '🎯', verb: 'Throw!', color: '#e8a43a' },
    sake: { title: 'Drinking Contest', icon: '🍶', verb: 'Drink!', color: '#c8a0ff' },
    palm: { title: 'Gentle Fist Training', icon: '✋', verb: 'Strike!', color: '#9ad4ff' },
    flower: { title: 'Flower Arranging', icon: '💐', verb: 'Place!', color: '#ff9ec8' },
  };
  class Timing {
    constructor(o, resolve) {
      this.o = Object.assign({ rounds: 5, speed: 0.9, zone: 0.2, theme: 'target', wobble: 0 }, o);
      this.th = THEMES[this.o.theme] || THEMES.target;
      this.resolve = resolve;
      this.round = 0;
      this.hits = 0;
      this.perfect = 0;
      this.pos = 0;
      this.dir = 1;
      this.state = 'ready';
      this.t = 0;
      this.zoneC = U.rand(0.35, 0.65);
      this.results = [];
    }
    get speed() {
      return this.o.speed * (1 + this.round * 0.22);
    }
    get zone() {
      return Math.max(0.07, this.o.zone * (1 - this.round * 0.1));
    }
    update(dt, focus) {
      this.t += dt;
      if (this.state === 'ready') {
        if (this.t > 1.2) {
          this.state = 'run';
          this.t = 0;
        }
        return;
      }
      if (this.state === 'run') {
        const wob = this.o.wobble * (1 + this.round * 0.5);
        this.pos += this.dir * this.speed * dt * (1 + Math.sin(this.t * 7) * wob * 0.5);
        if (this.pos > 1) {
          this.pos = 1;
          this.dir = -1;
        } else if (this.pos < 0) {
          this.pos = 0;
          this.dir = 1;
        }
        if (focus && I.okPressed()) {
          I.consume();
          const d = Math.abs(this.pos - this.zoneC);
          const hit = d <= this.zone / 2;
          const perf = d <= this.zone * 0.15;
          if (hit) this.hits++;
          if (perf) this.perfect++;
          this.results.push(perf ? 'perfect' : hit ? 'hit' : 'miss');
          NR.audio.sfx(perf ? 'crit' : hit ? 'hit' : 'miss');
          if (perf) NR.engine.flash('#fff6c0', 0.3);
          this.state = 'result';
          this.t = 0;
          this.last = perf ? 'PERFECT!' : hit ? 'Nice!' : 'Miss…';
        }
        return;
      }
      if (this.state === 'result' && this.t > 0.9) {
        this.round++;
        if (this.round >= this.o.rounds) {
          UI.pop(this);
          this.resolve({ hits: this.hits, perfect: this.perfect, rounds: this.o.rounds });
          return;
        }
        this.zoneC = U.rand(0.25, 0.75);
        this.state = 'run';
        this.t = 0;
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(8,6,16,0.82)';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      if (this.o.wobble) {
        const w = this.o.wobble * (this.round + 1) * 0.004;
        ctx.translate(W / 2, H / 2);
        ctx.rotate(Math.sin(NR.engine.time * 1.3) * w);
        ctx.translate(-W / 2, -H / 2);
      }
      UI.text(ctx, `${this.th.icon} ${this.o.title || this.th.title}`, W / 2, 110, { size: 34, bold: true, align: 'center', color: '#ffd28a', font: UI.HFONT });
      UI.text(ctx, `Round ${Math.min(this.round + 1, this.o.rounds)} / ${this.o.rounds} · Hits ${this.hits}`, W / 2, 156, { size: 19, align: 'center' });
      const bx = W / 2 - 400, by = 330, bw = 800, bh = 46;
      UI.panel(ctx, bx - 20, by - 30, bw + 40, bh + 60, { r: 16 });
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, bh);
      const zx = bx + (this.zoneC - this.zone / 2) * bw, zw = this.zone * bw;
      ctx.fillStyle = U.rgba(this.th.color, 0.55);
      ctx.fillRect(zx, by, zw, bh);
      ctx.fillStyle = U.rgba('#ffffff', 0.7);
      ctx.fillRect(bx + this.zoneC * bw - zw * 0.15, by, zw * 0.3, bh);
      const cx = bx + this.pos * bw;
      ctx.fillStyle = '#ffd23a';
      ctx.beginPath();
      ctx.moveTo(cx - 12, by - 18);
      ctx.lineTo(cx + 12, by - 18);
      ctx.lineTo(cx, by - 2);
      ctx.fill();
      ctx.fillRect(cx - 2, by, 4, bh);
      // result history
      this.results.forEach((r, i) => UI.text(ctx, r === 'perfect' ? '★' : r === 'hit' ? '●' : '✕', W / 2 - (this.o.rounds - 1) * 22 + i * 44, 440, { size: 26, align: 'center', color: r === 'miss' ? '#ff7a6a' : '#ffd23a' }));
      if (this.state === 'ready') UI.text(ctx, 'Press Z when the marker is in the glowing zone!', W / 2, 250, { size: 20, align: 'center', color: '#e8e2d6' });
      if (this.state === 'result') UI.text(ctx, this.last, W / 2, 260, { size: 40, bold: true, align: 'center', color: this.last === 'Miss…' ? '#ff8a7a' : '#ffe08a', outline: '#1a0a0a' });
      else if (this.state === 'run') UI.text(ctx, this.th.verb, W / 2, 260, { size: 28, bold: true, align: 'center', color: U.light(this.th.color, 0.3) });
      ctx.restore();
    }
  }
  MG.timing = (o) => new Promise((r) => UI.push(new Timing(o, r)));
})();
