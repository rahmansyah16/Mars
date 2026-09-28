// Dungeons: the Hollow Moon hideout, the ruins of Uzushiogakure and the Moon Well.
(function () {
  'use strict';
  const NR = window.NR;
  const S = NR.S;
  const M = NR.MAPS;
  const allSeals = () => S.f('seal1') && S.f('seal2') && S.f('seal3');
  const allSpirals = () => S.f('spiral1') && S.f('spiral2') && S.f('spiral3');

  // ---------------- Hollow Moon hideout ----------------
  M.hideout = {
    name: 'Hollow Moon Hideout', sub: 'Beneath the northern cliffs', bgm: 'dungeon', battleBg: 'cave',
    dark: 0.72, darkColor: '#06040e', playerLight: 230, weather: 'dust',
    grid: () => {
      const b = NR.mb(40, 30, 'rock');
      b.rect(18, 22, 21, 29, 'cave');
      b.rect(12, 14, 27, 21, 'cave');
      b.rect(2, 12, 9, 20, 'cave');
      b.rect(10, 16, 11, 17, 'cave');
      b.rect(30, 12, 37, 20, 'cave');
      b.rect(28, 16, 29, 17, 'cave');
      b.rect(3, 2, 12, 9, 'cave');
      b.rect(12, 10, 13, 13, 'cave');
      b.rect(15, 1, 26, 9, 'cave');
      b.rect(19, 10, 20, 13, 'cave');
      b.patches('moss', 'cave', 0.14, 0.3, 5);
      return b.done();
    },
    props: [
      ['seal', 5, 15, { w: 2, h: 2, r: 1.3, flag: 'seal1' }],
      ['seal', 33, 15, { w: 2, h: 2, r: 1.3, flag: 'seal2' }],
      ['seal', 6, 4, { w: 2, h: 2, r: 1.3, flag: 'seal3' }],
      ['barrier', 19, 11, { w: 2, if: () => !allSeals() }],
      ['chest', 11, 8, { flag: 'chest_acad' }],
      ['chest', 36, 19, { flag: 'chest_h2', c: '#6a4a8a' }],
      ['labtable', 4, 7, {}],
      ['labtable', 8, 7, {}],
      ['bars', 9, 2, { w: 3 }],
      ['shelf', 4, 2, { kind: 'jars', seed: 9, c: '#4a3a3a' }],
      ['torch', 12, 14, {}], ['torch', 27, 14, {}], ['torch', 12, 21, {}], ['torch', 27, 21, {}],
      ['torch', 2, 12, {}], ['torch', 9, 12, {}], ['torch', 30, 12, {}], ['torch', 37, 12, {}],
      ['torch', 15, 1, {}], ['torch', 26, 1, {}], ['torch', 18, 22, {}], ['torch', 21, 22, {}],
      ['crystal', 3, 19, { c: '#b58cff' }], ['crystal', 36, 13, { c: '#7ad0ff' }], ['crystal', 16, 8, { c: '#b58cff' }], ['crystal', 25, 8, { c: '#b58cff' }],
      ['stalagmite', 14, 19, {}], ['stalagmite', 25, 15, {}], ['stalagmite', 8, 19, {}], ['stalagmite', 31, 19, {}],
      ['rubble', 13, 15, { w: 3, h: 2 }], ['rubble', 32, 13, { w: 3, h: 2 }],
      ['crate', 26, 20, { c: '#6a5a4a' }], ['barrel', 13, 20, {}],
      ['spiral', 18, 3, { w: 4, h: 4, c: 'rgba(160,110,255,0.45)' }],
    ],
    npcs: [
      { key: 'mizuchi', char: 'mizuchi', x: 20, y: 4, dir: 'down', fixed: true, talk: 'mizuchi_confront', if: () => !S.f('mizuchi_defeated') },
    ],
    enemies: [
      { troop: 'hideout_a', look: 'hm_soldier', x: 19, y: 24, chase: 3 },
      { troop: 'hideout_b', x: 15, y: 18 },
      { troop: 'hideout_c', look: 'hm_soldier', x: 25, y: 17 },
      { troop: 'hideout_d', look: 'hm_elite', x: 6, y: 18 },
      { troop: 'hideout_e', look: 'hm_elite', x: 34, y: 18 },
      { troop: 'hideout_a', look: 'hm_soldier', x: 9, y: 5 },
      { troop: 'hideout_b', x: 35, y: 14 },
    ],
    events: [
      { x: 19, y: 29, w: 2, on: 'touch', to: ['forest', 23, 4, 'down'] },
      { x: 5, y: 15, w: 2, h: 2, on: 'touch', run: 'break_seal', seal: 1, once: 'seal1' },
      { x: 33, y: 15, w: 2, h: 2, on: 'touch', run: 'break_seal', seal: 2, once: 'seal2' },
      { x: 6, y: 4, w: 2, h: 2, on: 'touch', run: 'break_seal', seal: 3, once: 'seal3' },
      { x: 19, y: 12, w: 2, on: 'bump', run: 'hideout_barrier_inner', if: () => !allSeals() },
      { x: 11, y: 8, on: 'action', run: 'chest_acad' },
      { x: 36, y: 19, on: 'action', run: 'chest_h2' },
      { x: 9, y: 2, w: 3, on: 'action', run: 'prison_cells' },
      { x: 19, y: 9, w: 2, on: 'touch', run: 'mizuchi_confront', if: () => !S.f('mizuchi_defeated') },
      { on: 'enter', x: 0, y: 0, run: 'hideout_enter', once: 'hideout_entered' },
    ],
    spawns: { default: [19, 28, 'up'] },
  };

  // ---------------- Uzushiogakure ruins ----------------
  M.ruins = {
    name: 'Ruins of Uzushiogakure', sub: 'The Village Hidden by Whirling Tides', outdoor: true, battleBg: 'ruins',
    bgm: 'dungeon', darkBonus: 0.12, weather: 'fog',
    grid: () => {
      const b = NR.mb(44, 32, 'water');
      b.patches('deep', 'water', 0.45, 0.12, 31);
      b.rect(1, 24, 9, 30, 'ruins');
      b.rect(10, 26, 13, 27, 'bridge');
      b.rect(14, 12, 29, 27, 'ruins');
      b.rect(2, 8, 10, 16, 'ruins');
      b.rect(11, 12, 13, 13, 'bridge');
      b.rect(33, 8, 42, 18, 'ruins');
      b.rect(30, 14, 32, 15, 'bridge');
      b.rect(18, 1, 25, 8, 'ruins');
      b.rect(20, 9, 23, 11, 'ruins');
      b.patches('moss', 'ruins', 0.25, 0.25, 7);
      return b.done();
    },
    props: [
      ['spiral', 16, 14, { w: 2, h: 2 }], ['spiral', 26, 14, { w: 2, h: 2 }], ['spiral', 21, 23, { w: 2, h: 2 }],
      ['seal', 16, 14, { w: 2, h: 2, flag: 'spiral1', invert: true, c: '#ff6a4a' }],
      ['seal', 26, 14, { w: 2, h: 2, flag: 'spiral2', invert: true, c: '#ff6a4a' }],
      ['seal', 21, 23, { w: 2, h: 2, flag: 'spiral3', invert: true, c: '#ff6a4a' }],
      ['barrier', 20, 9, { w: 4, c: '#ff6a4a', if: () => !allSpirals() }],
      ['cave_mouth', 21, 1, {}],
      ['spiral', 19, 3, { w: 6, h: 4, c: 'rgba(200,50,30,0.45)' }],
      ['pillar', 18, 2, { spiral: true }], ['pillar', 25, 2, { spiral: true }], ['pillar', 18, 7, { broken: true, moss: true }], ['pillar', 25, 7, { spiral: true }],
      ['pillar', 14, 12, { broken: true }], ['pillar', 29, 12, { moss: true, spiral: true }], ['pillar', 14, 20, { spiral: true }], ['pillar', 29, 20, { broken: true, moss: true }],
      ['pillar', 3, 9, { broken: true }], ['pillar', 9, 15, { moss: true }], ['pillar', 34, 9, { spiral: true }], ['pillar', 41, 17, { broken: true }],
      ['statue', 21, 18, {}], ['statue', 22, 18, { c: '#8a8e96' }],
      ['altar', 5, 11, { scroll: true }],
      ['chest', 3, 14, { flag: 'chest_r1' }],
      ['chest', 41, 9, { flag: 'chest_r2', c: '#8a3a2a' }],
      ['rubble', 15, 24, { w: 4, h: 2 }], ['rubble', 24, 25, { w: 4, h: 2 }], ['rubble', 36, 12, { w: 3, h: 3 }], ['rubble', 2, 25, { w: 3, h: 2 }],
      ['boulder', 38, 15, {}], ['rock', 6, 29, { moss: true }], ['rock', 8, 25, {}],
      ['torch', 20, 8, {}], ['torch', 23, 8, {}],
      ['reeds', 0, 23, {}], ['reeds', 10, 29, { seed: 4 }],
    ],
    npcs: [
      { key: 'sasuke', char: 'sasuke', x: 21, y: 20, dir: 'down', talk: 'sasuke_talk', if: () => S.f('sasuke_arrives') && !S.party('sasuke') && !S.f('kagen_defeated') },
    ],
    enemies: [
      { troop: 'ruins_a', look: 'hm_elite', x: 6, y: 26, chase: 3 },
      { troop: 'ruins_b', x: 6, y: 12 },
      { troop: 'ruins_c', x: 37, y: 11 },
      { troop: 'ruins_d', look: 'hm_elite', x: 18, y: 17 },
      { troop: 'ruins_e', x: 26, y: 20 },
      { troop: 'ruins_a', look: 'hm_soldier', x: 38, y: 16 },
      { troop: 'ruins_d', look: 'hm_elite', x: 22, y: 5, if: () => allSpirals() },
    ],
    events: [
      { x: 16, y: 14, w: 2, h: 2, on: 'touch', run: 'spiral_switch', spiral: 1, once: 'spiral1' },
      { x: 26, y: 14, w: 2, h: 2, on: 'touch', run: 'spiral_switch', spiral: 2, once: 'spiral2' },
      { x: 21, y: 23, w: 2, h: 2, on: 'touch', run: 'spiral_switch', spiral: 3, once: 'spiral3' },
      { x: 20, y: 10, w: 4, on: 'bump', run: 'ruins_barrier', if: () => !allSpirals() },
      { x: 21, y: 1, w: 2, on: 'touch', to: ['moonwell', 9, 13, 'up'] },
      { x: 14, y: 26, w: 2, h: 2, on: 'touch', run: 'sasuke_arrives', once: 'sasuke_arrives' },
      { x: 5, y: 11, w: 2, on: 'action', run: 'ruins_altar' },
      { x: 3, y: 14, on: 'action', run: 'chest_r1' },
      { x: 41, y: 9, on: 'action', run: 'chest_r2' },
      { x: 1, y: 30, w: 9, on: 'touch', run: 'ruins_boat' },
      { on: 'enter', x: 0, y: 0, run: 'ruins_enter', once: 'ruins_entered' },
    ],
    spawns: { default: [4, 28, 'up'], top: [21, 3, 'down'] },
  };

  // ---------------- The Moon Well ----------------
  M.moonwell = {
    name: 'The Moon Well', sub: 'Heart of the Whirlpool', bgm: 'tension', battleBg: 'moonwell',
    dark: 0.55, darkColor: '#060414', playerLight: 180, weather: 'sparkles', noSave: false,
    grid: () => {
      const b = NR.mb(20, 16, 'void');
      b.ellipse(10, 8, 8.5, 6.4, 'ruins');
      b.rect(9, 13, 10, 15, 'ruins');
      return b.done();
    },
    props: [
      ['moonwell', 3, 2, { w: 14, h: 11 }],
      ['pillar', 3, 4, { spiral: true }], ['pillar', 16, 4, { spiral: true }], ['pillar', 3, 11, { spiral: true, broken: true }], ['pillar', 16, 11, { spiral: true }],
      ['torch', 7, 13, {}], ['torch', 12, 13, {}],
    ],
    npcs: [{ key: 'kagen', char: 'kagen', x: 10, y: 5, dir: 'down', fixed: true, talk: 'final_confront', if: () => !S.f('kagen_defeated') }],
    events: [
      { x: 9, y: 15, w: 2, on: 'touch', to: ['ruins', 21, 3, 'down'] },
      { x: 7, y: 9, w: 6, h: 2, on: 'touch', run: 'final_confront', if: () => !S.f('kagen_defeated') },
    ],
    spawns: { default: [9, 13, 'up'] },
  };
})();
