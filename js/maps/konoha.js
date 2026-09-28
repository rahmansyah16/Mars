// Konoha village, the Hyuga compound and Training Ground 3.
(function () {
  'use strict';
  const NR = window.NR;
  const S = NR.S;
  const M = NR.MAPS;
  const fest = () => S.f('festival');
  const dayPeople = () => S.day() && !fest();

  // ---------------- Konoha ----------------
  M.konoha = {
    name: 'Konohagakure', sub: 'The Village Hidden in the Leaves', outdoor: true, battleBg: 'village',
    bgm: () => (fest() ? 'festival' : S.night() ? 'night' : 'village'),
    weather: () => (fest() ? null : S.night() ? 'fireflies' : 'leaves'),
    grid: () => {
      const b = NR.mb(48, 36, 'grass');
      b.patches('grass2', 'grass', 0.35, 0.18, 3);
      b.rect(0, 0, 47, 3, 'cliff');
      b.rect(1, 5, 46, 5, 'dirt');
      // park
      for (let y = 6; y <= 11; y++) for (let x = 32; x <= 46; x++) if (NR.U.hash2(x, y, 5) < 0.35) b.set(x, y, 'flowers');
      b.ellipse(41, 8.5, 3.6, 1.8, 'water');
      b.ellipse(41, 8.6, 1.8, 0.8, 'deep');
      // streets
      b.rect(0, 12, 47, 13, 'stone');
      b.rect(23, 11, 24, 35, 'stone');
      b.rect(19, 11, 28, 11, 'plaza');
      b.rect(19, 14, 28, 16, 'plaza');
      b.rect(0, 18, 22, 18, 'stone');
      b.rect(0, 23, 22, 23, 'stone');
      b.rect(25, 20, 47, 20, 'stone');
      b.rect(25, 28, 47, 28, 'stone');
      b.rect(6, 14, 7, 30, 'dirt');
      b.rect(0, 28, 18, 29, 'water');
      b.ellipse(18.4, 28.5, 1.5, 1.1, 'water');
      b.rect(6, 28, 7, 29, 'bridge');
      b.rect(21, 31, 26, 32, 'stone');
      b.rect(22, 33, 25, 35, 'dirt');
      return b.done();
    },
    open: [[24, 10], [39, 19], [40, 19], [39, 27]],
    props: [
      ['monument', 8, 4, { w: 32 }],
      ['apartment', 1, 7, { door: 1, sign: 'SUNRISE APTS' }],
      ['hokage_tower', 20, 6, { door: 3 }],
      ['ichiraku', 9, 15, { counter: true }],
      ['house', 1, 15, { door: 1, wall: '#f6ecf2', roof: '#7a4fb0', sign: 'YAMANAKA FLOWERS', awning: '#8ac850', noren: '#7a4fb0', norenText: '花' }],
      ['house', 1, 20, { door: 2, wall: '#efe6d2', roof: '#4f7aa8', sign: 'GENERAL STORE', awning: '#4f7aa8' }],
      ['house', 9, 19, { w: 6, h: 4, door: 2, wall: '#f2e2c0', roof: '#c8542e', sign: 'NINJA ACADEMY', tank: true }],
      ['swing', 15, 20, {}],
      ['stall', 15, 16, { c: '#e87aa0', goods: ['#f6d0e0', '#8ac850', '#f4f0e6', '#c86a8a'] }],
      ['house', 29, 15, { door: 1, wall: '#ece0d0', roof: '#6a4a8a', sign: 'TENTEN ARMS', awning: '#c43a55', noren: '#c43a55', norenText: '武' }],
      ['hospital', 36, 15, {}],
      ['inn', 36, 24, { door: 2 }],
      ['house', 26, 21, { door: 1, roof: '#b5532f', tank: true }],
      ['house', 31, 21, { w: 3, h: 3, door: 1, roof: '#4f7aa8', wall: '#f0e8dc' }],
      ['house', 43, 22, { door: 2, roof: '#8a5a3a', roofStyle: 'flat', tank: true, wall: '#e8dcc8' }],
      ['house', 1, 24, { door: 1, roof: '#7a8a4a', wall: '#efe4cc' }],
      ['house', 9, 25, { door: 2, roof: '#b5532f', chimney: true }],
      ['house', 14, 24, { door: 1, roof: '#9a8a7a', roofStyle: 'flat', tank: true, wall: '#e8e0d0' }],
      ['house', 29, 25, { door: 2, roof: '#3f6a4a', wall: '#f2e8d6', noren: '#3f7a4a', norenText: '綱' }],
      ['wallsegment', 0, 31, { w: 21 }],
      ['wallsegment', 27, 31, { w: 21 }],
      ['gate', 21, 31, {}],
      // park
      ['tree', 35, 8, { c: 'sakura', s: 1.5, seed: 3 }],
      ['bench', 35, 11, {}],
      ['bench', 42, 11, {}],
      ['lamp', 33, 7, {}],
      ['lamp', 46, 7, {}],
      ['bush', 33, 10, { c: '#5aa64a', berries: true }],
      ['pine', 45, 6, { s: 1.1 }],
      ['reeds', 37, 9, {}],
      ['reeds', 44, 8, {}],
      // north
      ['tree', 8, 7, { seed: 1 }],
      ['tree', 11, 8, { seed: 2, c: 'dark' }],
      ['tree', 14, 7, { seed: 4 }],
      ['tree', 17, 9, { seed: 5, c: 'autumn' }],
      ['bush', 10, 10, {}],
      ['bush', 15, 10, { c: '#4f9a42' }],
      ['tree', 29, 7, { seed: 6 }],
      ['tree', 31, 9, { seed: 7, c: 'sakura', s: 0.9 }],
      ['sign', 3, 6, { text: 'LOOKOUT', size: 11 }],
      ['noticeboard', 16, 11, {}],
      // lamps
      ['lamp', 8, 11, {}], ['lamp', 18, 11, {}], ['lamp', 29, 11, {}], ['lamp', 38, 11, {}],
      ['lamp', 5, 14, {}], ['lamp', 13, 14, {}], ['lamp', 34, 14, {}], ['lamp', 46, 14, {}],
      ['lamp', 22, 19, {}], ['lamp', 25, 19, {}], ['lamp', 22, 27, {}], ['lamp', 25, 27, {}],
      ['well', 21, 17, {}],
      ['pots', 5, 17, {}],
      ['flowerbed', 5, 16, { w: 1, h: 1 }],
      ['barrel', 33, 17, {}],
      ['crate', 34, 17, {}],
      ['bench', 19, 17, {}],
      ['bench', 27, 17, {}],
      ['stone_lantern', 35, 27, {}],
      ['stone_lantern', 42, 27, {}],
      // south
      ['tree', 2, 30, { seed: 8 }], ['tree', 12, 30, { seed: 9, c: 'dark' }], ['tree', 17, 30, { seed: 10 }],
      ['tree', 29, 30, { seed: 11, c: 'autumn' }], ['tree', 35, 30, { seed: 12 }], ['tree', 44, 30, { seed: 13, c: 'dark' }],
      ['tree', 35, 21, { seed: 14, c: 'sakura', s: 0.9 }], ['tree', 42, 25, { seed: 15 }], ['tree', 46, 26, { seed: 16, c: 'dark' }],
      ['tree', 19, 21, { seed: 17 }],
      ['bush', 20, 30, {}], ['bush', 27, 30, {}],
      ['reeds', 14, 27, { seed: 2 }], ['reeds', 3, 27, { seed: 5 }],
      ['pine', 20, 34, {}], ['pine', 27, 34, {}], ['tree', 18, 33, { seed: 20 }], ['tree', 29, 33, { seed: 21 }],
      // festival decorations
      ['paper_lantern', 19, 14, { if: fest }], ['paper_lantern', 21, 14, { if: fest, c: '#ffb050' }], ['paper_lantern', 26, 14, { if: fest }], ['paper_lantern', 28, 14, { if: fest, c: '#ffb050' }],
      ['paper_lantern', 12, 12, { if: fest }], ['paper_lantern', 16, 13, { if: fest, c: '#ffb050' }], ['paper_lantern', 31, 12, { if: fest }], ['paper_lantern', 35, 13, { if: fest, c: '#ffb050' }],
      ['stall', 19, 15, { if: fest, c: '#d84a3a' }],
      ['stall', 27, 15, { if: fest, c: '#3a6ea5', goods: ['#ff7aa8', '#7ad0ff', '#ffd24a', '#8ae07a'] }],
    ],
    emitters: [{ type: 'smoke', x: 38, y: 23, w: 2, h: 1, rate: 1.5 }, { type: 'smoke', x: 10, y: 14, w: 2, h: 1, rate: 1 }],
    npcs: [
      { key: 'teuchi', char: 'teuchi', x: 10, y: 15, dir: 'down', fixed: true, talk: 'teuchi_talk', mark: () => (S.qs('side_ramen') < 0 && S.ch() >= 1 ? '?' : S.qs('side_ramen') === 1 ? '!' : null) },
      { key: 'ayame', char: 'ayame', x: 12, y: 15, dir: 'down', fixed: true, talk: 'ayame_talk' },
      { key: 'anko', char: 'anko', x: 17, y: 16, dir: 'down', talk: 'anko_talk' },
      { key: 'iruka', char: 'iruka', x: 17, y: 22, dir: 'left', talk: 'iruka_talk', if: () => S.day(), mark: () => (S.has('k_ramen1') || (S.qs('side_scroll') === 1) ? '!' : S.ch() >= 2 && S.qs('side_scroll') < 0 ? '?' : null) },
      { key: 'choji', char: 'choji', x: 13, y: 17, dir: 'down', talk: 'choji_talk', if: dayPeople },
      { key: 'izumo', char: 'izumo', x: 22, y: 30, dir: 'down', talk: 'guard_talk' },
      { key: 'kotetsu', char: 'kotetsu', x: 25, y: 30, dir: 'down', talk: 'guard_talk' },
      { key: 'hinata', char: 'hinata', x: 36, y: 10, dir: 'right', talk: 'hinata_talk', if: () => S.day() && !S.party('hinata') && S.ch() >= 1, mark: () => NR.romanceMark('hinata') },
      { key: 'sai', char: 'sai', x: 45, y: 9, dir: 'left', talk: 'sai_talk', if: dayPeople },
      { key: 'temari', char: 'temari', x: 26, y: 15, dir: 'down', talk: 'temari_talk', if: () => S.day() && !S.party('temari') && S.ch() >= 1 && !S.f('festival'), mark: () => NR.romanceMark('temari') },
      { key: 'temari_night', char: 'temari', x: 3, y: 6, dir: 'down', talk: 'temari_rooftop', if: () => S.night() && S.qs('r_temari') === 2 && S.aff('temari') >= 60 && !S.party('temari'), mark: () => 'heart' },
      { key: 'sakura_night', char: 'sakura', x: 36, y: 9, dir: 'down', talk: 'sakura_tree', if: () => S.night() && S.qs('r_sakura') === 2 && S.aff('sakura') >= 60 && !S.party('sakura'), mark: () => 'heart' },
      { key: 'hinata_eve', char: 'hinata', x: 8, y: 27, dir: 'up', talk: 'hinata_river', if: () => S.eve() && S.qs('r_hinata') === 1 && S.aff('hinata') >= 25 && !S.party('hinata'), mark: () => 'heart' },
      { key: 'v1', char: 'vm1', x: 12, y: 13, dir: 'down', wander: 2, talk: 'villager_talk', if: dayPeople },
      { key: 'v2', char: 'vf1', x: 33, y: 12, dir: 'left', wander: 2, talk: 'villager_talk', if: dayPeople },
      { key: 'v3', char: 'vm3', x: 4, y: 19, dir: 'down', wander: 1, talk: 'villager_talk', if: dayPeople },
      { key: 'v4', char: 'vf2', x: 27, y: 19, dir: 'down', wander: 1, talk: 'villager_talk', if: dayPeople },
      { key: 'v5', char: 'vm4', x: 34, y: 29, dir: 'left', wander: 1, talk: 'villager_talk', if: dayPeople },
      { key: 'v6', char: 'vf3', x: 21, y: 15, dir: 'right', wander: 1, talk: 'villager_talk', if: () => S.day() || fest() },
      { key: 'v7', char: 'vf4', x: 41, y: 21, dir: 'down', wander: 2, talk: 'villager_talk', if: dayPeople },
      { key: 'v8', char: 'vm2', x: 30, y: 13, dir: 'left', wander: 3, talk: 'villager_talk', if: () => S.eve() && !fest() },
      // festival crowd
      { key: 'f1', char: 'vf1', x: 20, y: 16, dir: 'up', talk: 'festival_talk', if: fest },
      { key: 'f2', char: 'vm1', x: 26, y: 16, dir: 'up', talk: 'festival_talk', if: fest },
      { key: 'f3', char: 'kiba', x: 22, y: 14, dir: 'down', talk: 'festival_talk', if: fest },
      { key: 'f4', char: 'lee', x: 25, y: 14, dir: 'down', talk: 'festival_talk', if: fest },
      { key: 'f5', char: 'choji', x: 20, y: 13, dir: 'down', talk: 'festival_talk', if: fest },
      { key: 'f6', char: 'shikamaru', x: 27, y: 13, dir: 'down', talk: 'festival_talk', if: fest },
    ],
    events: [
      { x: 2, y: 10, on: 'touch', to: ['naruto_home', 5, 7, 'up'] },
      { x: 23, y: 10, w: 2, on: 'touch', to: ['hokage_office', 6, 8, 'up'] },
      { x: 2, y: 17, on: 'touch', to: ['flower_shop', 5, 7, 'up'] },
      { x: 3, y: 22, on: 'touch', to: ['store', 5, 7, 'up'] },
      { x: 11, y: 22, on: 'bump', run: 'academy_door' },
      { x: 11, y: 22, on: 'touch', run: 'academy_door' },
      { x: 30, y: 17, on: 'touch', to: ['armory', 5, 7, 'up'] },
      { x: 39, y: 19, w: 2, on: 'touch', to: ['hospital', 8, 10, 'up'] },
      { x: 38, y: 27, w: 2, on: 'touch', to: ['inn', 9, 10, 'up'] },
      { x: 31, y: 27, on: 'touch', run: 'tsunade_house_door' },
      { x: 0, y: 12, h: 2, on: 'touch', to: ['hyuga', 24, 9, 'left'] },
      { x: 47, y: 12, h: 2, on: 'touch', to: ['training', 1, 10, 'right'] },
      { x: 22, y: 35, w: 4, on: 'touch', run: 'south_road' },
      { x: 16, y: 11, w: 2, on: 'action', run: 'noticeboard' },
      { x: 21, y: 17, on: 'action', run: 'well' },
      { x: 8, y: 4, w: 32, on: 'action', run: 'monument' },
      { x: 3, y: 6, on: 'action', run: 'lookout_sign' },
      { on: 'auto', x: 0, y: 0, run: 'festival_start', if: () => S.qs('main4') === 2 && S.eve() && !S.f('festival_done') && !S.f('festival_intro') },
    ],
    spawns: { default: [23, 14, 'down'], home: [2, 11, 'down'] },
  };

  // ---------------- Hyuga compound ----------------
  M.hyuga = {
    name: 'Hyuga Compound', sub: 'Garden of the Main House', outdoor: true, battleBg: 'village',
    bgm: () => (S.night() ? 'night' : 'onsen'),
    weather: () => (S.night() ? 'fireflies' : 'petals'),
    grid: () => {
      const b = NR.mb(26, 18, 'grass');
      b.patches('grass2', 'grass', 0.3, 0.2, 9);
      b.rect(0, 0, 25, 0, 'cliff');
      b.rect(0, 0, 0, 17, 'forest');
      b.rect(0, 17, 25, 17, 'forest');
      b.path([[13, 5], [13, 9], [25, 9]], 'stone', 2);
      b.rect(3, 9, 9, 13, 'sand');
      b.ellipse(19, 13.5, 3.8, 2.2, 'water');
      b.ellipse(19, 13.6, 1.8, 0.9, 'deep');
      return b.done();
    },
    props: [
      ['house', 8, 1, { w: 10, h: 4, door: 5, wall: '#f1e8d4', roof: '#4a5670', beams: '#5a3a26', curl: true, fascia: '#2a2a34', windows: false, noren: '#6a5a9a', norenText: '日' }],
      ['stone_lantern', 11, 6, {}],
      ['stone_lantern', 16, 6, {}],
      ['tree', 4, 5, { c: 'sakura', s: 1.1, seed: 2 }],
      ['tree', 21, 4, { c: 'sakura', s: 1, seed: 3 }],
      ['pine', 2, 14, {}],
      ['bamboo', 1, 3, {}], ['bamboo', 1, 8, { seed: 3 }], ['bamboo', 1, 12, { seed: 5 }],
      ['bamboo', 6, 16, { seed: 7 }], ['bamboo', 11, 16, { seed: 9 }], ['bamboo', 15, 16, { seed: 11 }], ['bamboo', 24, 16, { seed: 13 }],
      ['rock', 16, 12, { seed: 3 }], ['rock', 22, 15, { seed: 4, moss: true }],
      ['reeds', 17, 11, {}],
      ['post', 5, 10, {}], ['post', 7, 10, {}],
      ['bush', 23, 6, {}], ['bush', 9, 6, { c: '#4f9a42' }],
    ],
    npcs: [
      { key: 'hinata', char: 'hinata', x: 6, y: 11, dir: 'down', talk: 'hinata_garden', if: () => !S.party('hinata') && (S.qs('r_hinata') === 0 || S.eve()) && S.ch() !== 4, mark: () => (S.qs('r_hinata') === 0 ? 'heart' : null) },
      { key: 'hyuga_guard', char: 'vm2', x: 13, y: 7, dir: 'down', talk: 'hyuga_guard' },
    ],
    events: [
      { x: 25, y: 9, h: 2, on: 'touch', to: ['konoha', 1, 12, 'right'] },
      { x: 13, y: 4, on: 'bump', run: 'hyuga_house' },
      { x: 13, y: 4, on: 'touch', run: 'hyuga_house' },
    ],
    spawns: { default: [24, 9, 'left'] },
  };

  // ---------------- Training Ground ----------------
  M.training = {
    name: 'Training Ground 3', sub: 'Where Team 7 began', outdoor: true, battleBg: 'training',
    bgm: () => (S.night() ? 'night' : 'village'),
    weather: () => (S.night() ? 'fireflies' : 'leaves'),
    grid: () => {
      const b = NR.mb(32, 22, 'grass');
      b.patches('grass2', 'grass', 0.4, 0.2, 13);
      b.rect(0, 0, 31, 0, 'forest');
      b.rect(0, 21, 31, 21, 'forest');
      b.path([[0, 10], [31, 10]], 'dirt', 2);
      b.path([[10, 11], [10, 7]], 'dirt', 2);
      b.path([[21, 9], [21, 6]], 'dirt', 2);
      b.ellipse(8, 16, 3.2, 2.2, 'water');
      b.ellipse(8, 16.2, 1.5, 0.9, 'deep');
      b.rect(15, 14, 19, 17, 'dirt');
      return b.done();
    },
    props: [
      ['post', 8, 5, {}], ['post', 10, 5, {}], ['post', 12, 5, {}],
      ['rock', 15, 5, { seed: 9, c: '#8a8e96' }],
      ['target', 19, 4, {}], ['target', 21, 4, {}], ['target', 23, 4, {}],
      ['dummy', 25, 7, {}], ['dummy', 27, 7, {}],
      ['log', 16, 13, {}],
      ['stump', 19, 13, {}],
      ['pine', 1, 2, {}], ['pine', 4, 1, { s: 1.2 }], ['tree', 28, 2, { seed: 3 }], ['tree', 31, 3, { seed: 4, c: 'dark' }],
      ['tree', 2, 19, { seed: 5 }], ['tree', 14, 20, { seed: 6, c: 'dark' }], ['pine', 25, 19, {}], ['tree', 30, 18, { seed: 7 }],
      ['bigtree', 28, 13, { seed: 2 }],
      ['bush', 5, 12, {}], ['bush', 13, 17, { berries: true }], ['reeds', 11, 15, {}], ['reeds', 5, 17, { seed: 3 }],
      ['sign', 29, 9, { text: 'OUTER FOREST →', size: 10 }],
    ],
    npcs: [
      { key: 'lee', char: 'lee', x: 16, y: 8, dir: 'down', talk: 'lee_talk', if: () => S.day() && !S.f('festival'), mark: () => (!S.qd('side_lee') && S.ch() >= 1 ? '!' : null) },
      { key: 'kiba', char: 'kiba', x: 20, y: 15, dir: 'left', talk: 'kiba_talk', if: () => S.day() && S.ch() >= 1, mark: () => (S.qs('side_akamaru') === 1 || S.has('k_ramen2') ? '!' : S.qs('side_akamaru') < 0 && NR.forestOpen() ? '?' : null) },
      { key: 'akamaru', char: 'akamaru', x: 21, y: 16, dir: 'left', talk: 'akamaru_talk', if: () => S.day() && S.ch() >= 1 && (S.qs('side_akamaru') < 0 || S.qd('side_akamaru')) },
      { key: 'hinata_join', char: 'hinata', x: 27, y: 10, dir: 'left', talk: 'hinata_joins', if: () => S.qs('main1') === 2 && !S.party('hinata') },
      { key: 'tenten', char: 'tenten', x: 21, y: 6, dir: 'down', talk: 'tenten_training', if: () => S.qs('r_tenten') === 1 && S.aff('tenten') >= 25 && S.day() && !S.party('tenten'), mark: () => 'heart' },
      { key: 'temari', char: 'temari', x: 12, y: 13, dir: 'right', talk: 'temari_spar', if: () => S.qs('r_temari') === 1 && S.aff('temari') >= 25 && S.day() && !S.party('temari'), mark: () => 'heart' },
    ],
    events: [
      { x: 0, y: 10, h: 2, on: 'touch', to: ['konoha', 46, 12, 'left'] },
      { x: 31, y: 10, h: 2, on: 'touch', run: 'to_forest' },
      { x: 15, y: 5, on: 'action', run: 'memorial' },
      { x: 8, y: 5, w: 5, on: 'action', run: 'posts' },
    ],
    spawns: { default: [1, 10, 'right'], east: [30, 10, 'left'] },
  };
})();
