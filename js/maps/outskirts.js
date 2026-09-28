// The Outer Forest: exploration, visible enemies, quest spots, bandit camp, boss clearing.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const S = NR.S;
  const M = NR.MAPS;

  // Build terrain once; props are scattered from it so trees never block paths.
  let built = null;
  function build() {
    if (built) return built;
    const W = 48, H = 38;
    const b = NR.mb(W, H, 'forest');
    b.patches('grass2', 'forest', 0.3, 0.15, 21);
    b.patches('moss', 'forest', 0.14, 0.3, 23);
    b.rect(0, 0, 47, 1, 'cliff');
    b.rect(14, 2, 34, 2, 'cliff');
    // stream first, paths cross it on bridges
    b.path([[29, 2], [28, 8], [29, 16], [30, 24], [29, 37]], 'water', 2);
    const road = (pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let s = 0; s <= steps; s++) {
          const x = Math.round(U.lerp(x0, x1, s / (steps || 1))), y = Math.round(U.lerp(y0, y1, s / (steps || 1)));
          for (let dy = 0; dy < 2; dy++)
            for (let dx = 0; dx < 2; dx++) {
              const cur = b.get(x + dx, y + dy);
              if (cur === 'cliff') continue;
              b.set(x + dx, y + dy, cur === 'water' || cur === 'bridge' ? 'bridge' : 'dirt');
            }
        }
      }
    };
    b.ellipse(39, 8, 6, 3.6, 'grass');
    b.ellipse(41, 31, 6, 4, 'dirt');
    b.ellipse(9, 7, 3, 2, 'water');
    b.ellipse(9, 7.1, 1.4, 0.8, 'deep');
    road([[0, 18], [12, 18], [20, 16], [27, 16], [33, 16]]);
    road([[33, 16], [38, 12], [38, 10]]);
    road([[20, 16], [22, 10], [23, 5], [23, 3]]);
    road([[12, 19], [14, 26], [22, 30], [33, 31], [37, 31]]);
    road([[33, 17], [40, 19], [45, 19]]);
    road([[12, 18], [10, 12], [11, 9]]);
    b.set(23, 2, 'dirt').set(24, 2, 'dirt');
    const grid = b.done();

    // keep-out zones for scattered trees (special spots)
    const keep = [
      [33, 4, 46, 12], [34, 26, 47, 36], [5, 4, 13, 10], [14, 19, 19, 23], [42, 17, 47, 22],
      [2, 25, 7, 30], [16, 31, 21, 35], [33, 21, 37, 25], [21, 2, 26, 6], [0, 16, 3, 21],
    ];
    const blocked = (x, y) => {
      if (x < 1 || y < 3 || x > W - 2 || y > H - 2) return true;
      for (const [x0, y0, x1, y1] of keep) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return true;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = grid.cells[(y + dy) * W + (x + dx)];
          if (!t || t === 'dirt' || t === 'bridge' || t === 'water' || t === 'deep' || t === 'cliff') return true;
        }
      return false;
    };
    const rng = U.rng(4242);
    const props = [];
    const taken = new Set();
    for (let gy = 3; gy < H - 1; gy += 3) {
      for (let gx = 1; gx < W - 1; gx += 3) {
        const x = gx + Math.floor(rng() * 2), y = gy + Math.floor(rng() * 2);
        if (blocked(x, y) || taken.has(x + ',' + y)) continue;
        const r = rng();
        if (r < 0.14 && !blocked(x + 1, y) && !blocked(x, y + 1) && !blocked(x + 1, y + 1)) {
          props.push(['bigtree', x, y, { seed: Math.floor(rng() * 99), c: rng() < 0.3 ? 'teal' : null }]);
          taken.add(x + ',' + y).add(x + 1 + ',' + y).add(x + ',' + (y + 1)).add(x + 1 + ',' + (y + 1));
        } else if (r < 0.45) props.push(['pine', x, y, { s: 0.9 + rng() * 0.4, c: rng() < 0.5 ? '#2f7a4a' : '#3a6a3a' }]);
        else if (r < 0.8) props.push(['tree', x, y, { seed: Math.floor(rng() * 99), c: rng() < 0.25 ? 'dark' : rng() < 0.1 ? 'autumn' : 'green', s: 0.9 + rng() * 0.3 }]);
        else if (r < 0.92) props.push(['bush', x, y, { seed: Math.floor(rng() * 99), berries: rng() < 0.3 }]);
        else props.push(['rock', x, y, { seed: Math.floor(rng() * 99), moss: true }]);
        taken.add(x + ',' + y);
      }
    }
    // decorative clutter that doesn't block
    for (let i = 0; i < 40; i++) {
      const x = 1 + Math.floor(rng() * (W - 2)), y = 3 + Math.floor(rng() * (H - 4));
      const t = grid.cells[y * W + x];
      if (t === 'forest' || t === 'grass2' || t === 'moss') props.push([rng() < 0.6 ? 'tallgrass' : 'mushrooms', x, y, { seed: i, c: rng() < 0.5 ? '#d9534f' : '#e8b04a' }]);
    }
    // keep the path to the hidden grotto (north of the pond) clear of trees
    const clear = (p) => {
      const [t, x, y] = p;
      const w = t === 'bigtree' ? 2 : 1, h = t === 'bigtree' ? 2 : 1;
      return !(x + w - 1 >= 8 && x <= 11 && y + h - 1 >= 2 && y <= 4);
    };
    built = { grid, props: props.filter(clear) };
    return built;
  }
  const grotto = () => S.qs('r_tsunade2') >= 2 || S.qd('r_tsunade2');

  const kurama = () => S.f('kurama_sealed');
  M.forest = {
    name: 'Outer Forest', sub: 'East of Konoha', outdoor: true, battleBg: 'forest', darkBonus: 0.06,
    bgm: () => (S.night() ? 'night' : 'forest'),
    weather: () => (S.night() ? 'fireflies' : 'leaves'),
    grid: () => build().grid,
    get props() {
      return build().props.concat([
        ['cave_mouth', 23, 2, {}],
        ['barrier', 23, 3, { w: 2, if: () => S.qs('main3') < 0 && !S.qd('main3') }],
        ['sign', 21, 4, { text: 'KEEP OUT', size: 11 }],
        ['seal', 38, 7, { w: 2, h: 2, r: 1.4, flag: 'nue_defeated', c: '#c86aff' }],
        ['tent', 36, 27, { c: '#8a7a5a' }],
        ['tent', 43, 27, { c: '#6a7a5a' }],
        ['campfire', 41, 31, {}],
        ['crate', 45, 33, {}], ['crate', 44, 33, { c: '#9a7040' }], ['barrel', 36, 33, {}], ['barrel', 37, 34, {}],
        ['log', 38, 32, {}],
        ['flowerbed', 12, 8, { w: 1, h: 1, cols: ['#f6f8ff', '#e8f0ff', '#fff6c0'] }],
        ['flowerbed', 4, 27, { w: 1, h: 1, cols: ['#b8f0c0', '#ffffff'] }],
        ['flowerbed', 18, 33, { w: 1, h: 1, cols: ['#b8f0c0', '#ffffff'] }],
        ['flowerbed', 35, 23, { w: 1, h: 1, cols: ['#b8f0c0', '#ffffff'] }],
        ['sign', 2, 16, { text: '← KONOHA', size: 11 }],
        ['reeds', 7, 5, {}], ['reeds', 11, 6, { seed: 3 }],
        ['cave_mouth', 9, 2, { if: grotto }],
        ['sign', 11, 3, { text: '♨', size: 16, if: grotto }],
      ]);
    },
    emitters: [
      { type: 'sparkle', x: 12, y: 8, w: 1, h: 1, rate: 3, color: '#e8f4ff' },
      { type: 'sparkle', x: 4, y: 27, rate: 2, color: '#b8ffc8' },
      { type: 'sparkle', x: 18, y: 33, rate: 2, color: '#b8ffc8' },
      { type: 'sparkle', x: 35, y: 23, rate: 2, color: '#b8ffc8' },
      { type: 'sparkle', x: 38, y: 7, w: 2, h: 2, rate: 3, color: '#c86aff' },
      { type: 'embers', x: 41, y: 31, rate: 4 },
      { type: 'steam', x: 9, y: 2, w: 2, h: 1, rate: 3, if: grotto },
    ],
    npcs: [
      { key: 'chunin', char: 'chunin', x: 16, y: 21, dir: 'down', pose: 'lie', fixed: true, talk: 'forest_chunin', if: () => S.qs('main1') >= 3 && !S.f('chunin_found') },
      { key: 'nue', char: 'nue', x: 39, y: 8, dir: 'left', fixed: true, talk: 'nue_confront', if: () => S.qs('main1') === 4 && !S.f('nue_defeated') },
      { key: 'akamaru', char: 'akamaru', x: 45, y: 20, dir: 'left', talk: 'akamaru_found', if: () => S.qs('side_akamaru') === 0 && !S.f('akamaru_found'), mark: () => '!' },
      { key: 'bandit_boss', char: 'bandit', x: 41, y: 29, dir: 'down', scale: 1.2, talk: 'bandit_camp', if: () => !S.f('bandits_beaten'), mark: () => (S.qs('r_tenten') === 0 ? '!' : null) },
      { key: 'bandit_a', char: 'bandit', x: 39, y: 31, dir: 'right', talk: 'bandit_camp', if: () => !S.f('bandits_beaten') },
      { key: 'bandit_b', char: 'bandit', x: 43, y: 31, dir: 'left', talk: 'bandit_camp', if: () => !S.f('bandits_beaten') },
    ],
    enemies: [
      { troop: 'forest_wolves', x: 8, y: 15 },
      { troop: 'forest_boar', x: 17, y: 12 },
      { troop: 'forest_rogues', look: 'rogue', x: 25, y: 19 },
      { troop: 'forest_wasps', x: 33, y: 13 },
      { troop: 'forest_mix', look: 'rogue', x: 15, y: 27 },
      { troop: 'forest_pack', x: 26, y: 29 },
      { troop: 'forest_rogues', look: 'rogue', x: 37, y: 20 },
      { troop: 'forest_wolves', x: 44, y: 14 },
      { troop: 'forest_mix', look: 'rogue', x: 21, y: 7 },
      { troop: 'forest_boar', x: 6, y: 31 },
    ],
    events: [
      { x: 0, y: 18, h: 2, on: 'touch', to: ['training', 30, 10, 'left'] },
      { x: 23, y: 2, w: 2, on: 'touch', run: 'enter_hideout', if: () => S.qs('main3') >= 0 || S.qd('main3'), blocked: 'A strange chakra barrier seals the cave. I can\'t get through... yet.' },
      { x: 23, y: 3, w: 2, on: 'bump', run: 'hideout_barrier', if: () => S.qs('main3') < 0 && !S.qd('main3') },
      { x: 12, y: 8, on: 'here', run: 'moon_lily' },
      { x: 12, y: 8, on: 'touch', run: 'moon_lily' },
      { x: 4, y: 27, on: 'touch', run: 'herb_spot', herb: 1 },
      { x: 18, y: 33, on: 'touch', run: 'herb_spot', herb: 2 },
      { x: 35, y: 23, on: 'touch', run: 'herb_spot', herb: 3 },
      { x: 14, y: 19, w: 5, h: 4, on: 'touch', run: 'forest_chunin', if: () => S.qs('main1') === 3 && !S.f('chunin_found') },
      { x: 34, y: 6, w: 2, h: 6, on: 'touch', run: 'nue_confront', if: () => S.qs('main1') === 4 && !S.f('nue_defeated') },
      { x: 34, y: 6, w: 2, h: 6, on: 'touch', run: 'clearing_early', if: () => S.qs('main1') === 3 && !S.f('clearing_warned') },
      { on: 'enter', x: 0, y: 0, run: 'forest_enter', if: () => S.qs('main1') === 3 && !S.f('forest_intro') },
      { x: 9, y: 2, w: 2, on: 'touch', to: ['hidden_spring', 9, 11, 'up'], if: grotto },
    ],
    spawns: { default: [1, 18, 'right'], cave: [23, 4, 'down'] },
  };

  // ---------- Hidden grotto spring (Tsunade's secret) ----------
  M.hidden_spring = {
    name: 'Hidden Grotto', sub: 'An old hot spring nobody remembers', bgm: 'onsen', battleBg: 'cave',
    dark: 0.42, darkColor: '#060812', nightDark: 0.55, playerLight: 200, weather: 'fireflies',
    grid: () => {
      const b = NR.mb(18, 13, 'rock');
      b.ellipse(9, 6.2, 7.6, 5.4, 'cave');
      b.patches('moss', 'cave', 0.2, 0.3, 17);
      b.ellipse(9, 5.4, 4.8, 2.9, 'spring');
      b.rect(8, 10, 10, 12, 'cave');
      return b.done();
    },
    props: [
      ['onsen_rock', 3, 5, { seed: 11 }], ['onsen_rock', 14, 5, { seed: 12 }], ['onsen_rock', 5, 8, { seed: 13 }],
      ['onsen_rock', 12, 8, { seed: 14 }], ['onsen_rock', 6, 2, { seed: 15 }], ['onsen_rock', 11, 2, { seed: 16 }],
      ['crystal', 2, 3, { c: '#6ae8d0' }], ['crystal', 15, 3, { c: '#b88aff' }], ['crystal', 3, 9, { c: '#b88aff' }], ['crystal', 14, 9, { c: '#6ae8d0' }],
      ['stalagmite', 2, 7, {}], ['stalagmite', 15, 7, {}],
      ['bucket', 7, 9, {}],
    ],
    emitters: [
      { type: 'steam', x: 5, y: 3, w: 9, h: 5, rate: 12 },
      { type: 'sparkle', x: 2, y: 3, w: 1, h: 1, rate: 2, color: '#6ae8d0' },
      { type: 'sparkle', x: 15, y: 3, w: 1, h: 1, rate: 2, color: '#b88aff' },
      { type: 'sparkle', x: 3, y: 9, w: 1, h: 1, rate: 2, color: '#b88aff' },
      { type: 'sparkle', x: 14, y: 9, w: 1, h: 1, rate: 2, color: '#6ae8d0' },
    ],
    npcs: [
      { key: 'tsunade_spring', char: 'tsunade', x: 9, y: 9, dir: 'up', fixed: true, talk: 'tsunade_spring', if: () => S.night() && S.qs('r_tsunade2') === 2 && !S.party('tsunade'), mark: () => 'heart' },
    ],
    events: [
      { x: 8, y: 12, w: 3, on: 'touch', to: ['forest', 9, 3, 'down'] },
      { x: 4, y: 2, w: 10, h: 7, on: 'action', run: 'spring_bathe' },
      { on: 'enter', x: 0, y: 0, run: 'hidden_spring_enter' },
    ],
    spawns: { default: [9, 11, 'up'] },
  };
})();
