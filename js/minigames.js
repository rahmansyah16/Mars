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
    target: { title: 'Target Practice', icon: '🎯', verb: 'Throw!', color: '#e8a43a', bg: 'training', emo: 'happy', missEmo: 'happy' },
    sake: { title: 'Drinking Contest', icon: '🍶', verb: 'Drink!', color: '#c8a0ff', bg: 'inn_room', emo: 'flirty', missEmo: 'happy' },
    palm: { title: 'Gentle Fist Training', icon: '✋', verb: 'Strike!', color: '#9ad4ff', bg: 'hyuga_garden', emo: 'serious', missEmo: 'happy' },
    flower: { title: 'Flower Arranging', icon: '💐', verb: 'Place!', color: '#ff9ec8', bg: 'flowershop_night', emo: 'happy', missEmo: 'flirty' },
  };
  const FLOWER_COLS = ['#ff7aa8', '#ffd24a', '#b58cff', '#ffffff', '#ff6a5a', '#9ad4ff'];

  // Themed picture under the timing bar: a target with kunai, sake cups, palms, a vase.
  function drawIllustration(ctx, g, cx, cy) {
    const th = g.o.theme, t = NR.engine.time;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (th === 'target') {
      ctx.fillStyle = '#6a4630';
      ctx.fillRect(cx - 50, cy + 60, 12, 70);
      ctx.fillRect(cx + 38, cy + 60, 12, 70);
      [[96, '#5a3a24'], [88, '#f4ecd8'], [68, '#c8321e'], [48, '#f4ecd8'], [28, '#c8321e'], [10, '#f4ecd8']].forEach(([r, c]) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, U.TAU);
        ctx.fill();
      });
      for (const m of g.marks) {
        const kx = cx + Math.cos(m.a) * m.r, ky = cy + Math.sin(m.a) * m.r;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(-0.7 + m.a * 0.05);
        ctx.fillStyle = '#b8c0ca';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-26, -6);
        ctx.lineTo(-26, 6);
        ctx.fill();
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-48, -3, 22, 6);
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-53, 0, 5, 0, U.TAU);
        ctx.stroke();
        ctx.restore();
      }
    } else if (th === 'sake') {
      // tokkuri
      const bx = cx - 170, by = cy + 60;
      ctx.fillStyle = '#f2ece0';
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - 110);
      ctx.quadraticCurveTo(bx - 6, by - 64, bx - 34, by - 30);
      ctx.quadraticCurveTo(bx - 42, by, bx, by);
      ctx.quadraticCurveTo(bx + 42, by, bx + 34, by - 30);
      ctx.quadraticCurveTo(bx + 6, by - 64, bx + 8, by - 110);
      ctx.fill();
      ctx.fillStyle = '#3a4a8a';
      ctx.fillRect(bx - 30, by - 44, 60, 8);
      const n = g.o.rounds;
      for (let i = 0; i < n; i++) {
        const ux = cx - 80 + i * (260 / Math.max(1, n - 1)), uy = cy + 50;
        const r = g.results[i];
        ctx.save();
        ctx.translate(ux, uy);
        if (r === 'miss') {
          ctx.fillStyle = 'rgba(220,210,170,0.45)';
          ctx.beginPath();
          ctx.ellipse(10, 6, 34, 8, 0, 0, U.TAU);
          ctx.fill();
          ctx.rotate(1.2);
        }
        ctx.fillStyle = '#f2ece0';
        ctx.beginPath();
        ctx.moveTo(-18, -24);
        ctx.lineTo(18, -24);
        ctx.lineTo(11, 0);
        ctx.lineTo(-11, 0);
        ctx.fill();
        if (!r) {
          ctx.fillStyle = '#e8d8a0';
          ctx.beginPath();
          ctx.ellipse(0, -24, 18, 5, 0, 0, U.TAU);
          ctx.fill();
        }
        ctx.restore();
        if (r && r !== 'miss') UI.text(ctx, r === 'perfect' ? '★' : '✔', ux, uy - 46, { size: 22, align: 'center', color: '#ffd23a' });
      }
    } else if (th === 'palm') {
      const flash = g.state === 'result' && g.last !== 'Miss…' ? Math.max(0, 1 - g.t * 2) : 0;
      if (flash) {
        const gg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 160);
        gg.addColorStop(0, `rgba(160,220,255,${0.8 * flash})`);
        gg.addColorStop(1, 'rgba(160,220,255,0)');
        ctx.fillStyle = gg;
        ctx.fillRect(cx - 160, cy - 160, 320, 320);
      }
      // two open palms (Naruto's blocks), fingers as rounded capsules
      for (const s of [-1, 1]) {
        const off = g.state === 'run' ? Math.sin(t * 6) * 6 : g.state === 'result' ? -10 : 0;
        ctx.save();
        ctx.translate(cx + s * (72 + off), cy + 10);
        ctx.scale(s, 1);
        ctx.rotate(-0.12);
        const skin = '#f6d6bc', line = 'rgba(120,70,50,0.55)';
        UI.rr(ctx, -34, -26, 60, 66, 22);
        ctx.fillStyle = skin;
        ctx.fill();
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.stroke();
        [[-28, 34], [-13, 40], [2, 38], [16, 30]].forEach(([fx, len]) => {
          UI.rr(ctx, fx, -26 - len, 13, len + 12, 6.5);
          ctx.fillStyle = skin;
          ctx.fill();
          ctx.stroke();
        });
        // thumb
        ctx.save();
        ctx.translate(24, 6);
        ctx.rotate(-0.9);
        UI.rr(ctx, -6, -30, 13, 34, 6.5);
        ctx.fillStyle = skin;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = 'rgba(150,90,70,0.35)';
        ctx.beginPath();
        ctx.moveTo(-24, 6);
        ctx.quadraticCurveTo(-6, 16, 14, 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(160,220,255,0.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = t * 3 + i;
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 40 + i * 6 + Math.sin(a) * 4, a, a + 1.2);
        ctx.stroke();
      }
    } else if (th === 'flower') {
      const stems = g.results.map((r, i) => ({ r, i }));
      for (const { r, i } of stems) {
        const a = -1.1 + (i / Math.max(1, g.o.rounds - 1)) * 2.2;
        const len = r === 'miss' ? 70 : 120 + (i % 2) * 20;
        const tx = cx + Math.sin(a) * len * 0.7, ty = cy + 30 - Math.cos(a) * len;
        ctx.strokeStyle = '#3f7a36';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 40);
        ctx.quadraticCurveTo(cx + Math.sin(a) * 30, cy - 20, tx, ty);
        ctx.stroke();
        if (r === 'miss') {
          ctx.fillStyle = '#8a7a4a';
          ctx.beginPath();
          ctx.ellipse(tx, ty + 6, 8, 12, 0.6, 0, U.TAU);
          ctx.fill();
          continue;
        }
        const col = r === 'perfect' ? '#f6f8ff' : FLOWER_COLS[i % FLOWER_COLS.length];
        for (let k = 0; k < 6; k++) {
          const pa = (k / 6) * U.TAU + t * 0.2;
          ctx.fillStyle = U.shade(col, (k % 2) * -0.1);
          ctx.beginPath();
          ctx.ellipse(tx + Math.cos(pa) * 11, ty + Math.sin(pa) * 11, 11, 7, pa, 0, U.TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#ffe07a';
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, U.TAU);
        ctx.fill();
      }
      const vg = ctx.createLinearGradient(cx - 50, 0, cx + 50, 0);
      vg.addColorStop(0, '#3a5a8a');
      vg.addColorStop(0.45, '#7aa0d0');
      vg.addColorStop(1, '#2a3a6a');
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 30);
      ctx.quadraticCurveTo(cx - 70, cy + 80, cx - 40, cy + 130);
      ctx.lineTo(cx + 40, cy + 130);
      ctx.quadraticCurveTo(cx + 70, cy + 80, cx + 30, cy + 30);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
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
      this.marks = [];
    }
    get speed() {
      return this.o.speed * (1 + this.round * 0.22);
    }
    partnerEmo() {
      if (this.state === 'result') return this.last === 'PERFECT!' ? 'surprised' : this.last === 'Nice!' ? 'happy' : this.th.missEmo;
      return this.th.emo;
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
          this.marks.push({ a: U.rand(0, U.TAU), r: perf ? U.rand(0, 8) : hit ? U.rand(16, 60) : U.rand(80, 94) });
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
      // painted scene behind, dimmed, with the partner watching from the side
      if (this.th.bg && NR.backdrops) NR.backdrops.draw(ctx, this.th.bg, NR.engine.time);
      ctx.fillStyle = 'rgba(8,6,16,0.55)';
      ctx.fillRect(0, 0, W, H);
      const partner = this.o.partner && NR.msg.resolvePortrait(this.o.partner, this.partnerEmo(), this.o.outfit || null);
      if (partner) {
        const s = Math.min(560 / partner.h, 420 / partner.w);
        const pw = partner.w * s, ph = partner.h * s;
        const bob = Math.sin(NR.engine.time * 1.6) * 3;
        ctx.drawImage(partner.canvas, W - pw - 20, H - ph + 20 + bob, pw, ph);
      }
      const CX = partner ? W * 0.38 : W / 2;
      ctx.save();
      if (this.o.wobble) {
        const w = this.o.wobble * (this.round + 1) * 0.004;
        ctx.translate(W / 2, H / 2);
        ctx.rotate(Math.sin(NR.engine.time * 1.3) * w);
        ctx.translate(-W / 2, -H / 2);
      }
      ctx.translate(CX - W / 2, 0);
      UI.text(ctx, `${this.th.icon} ${this.o.title || this.th.title}`, W / 2, 110, { size: 34, bold: true, align: 'center', color: '#ffd28a', font: UI.HFONT });
      UI.text(ctx, `Round ${Math.min(this.round + 1, this.o.rounds)} / ${this.o.rounds} · Hits ${this.hits}`, W / 2, 156, { size: 19, align: 'center' });
      drawIllustration(ctx, this, W / 2, 560);
      const bx = W / 2 - (partner ? 330 : 400), by = 330, bw = partner ? 660 : 800, bh = 46;
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
