// Interior maps.
(function () {
  'use strict';
  const NR = window.NR;
  const S = NR.S;
  const M = NR.MAPS;

  // ---------- Naruto's apartment ----------
  M.naruto_home = {
    name: 'Naruto\'s Apartment', sub: 'Konoha', bgm: () => (S.night() ? 'night' : 'village'),
    wallColor: '#e8d6b0', wallTrim: '#8a5a36', dark: 0, nightDark: 0.45, battleBg: 'village',
    grid: () => NR.mb(12, 9, 'wall').room(0, 0, 11, 8, 'wood').set(5, 8, 'wood').done(),
    props: [
      ['bed', 1, 2, { c: '#f07f1e', frog: true }],
      ['window_in', 3, 1, {}],
      ['window_in', 8, 1, {}],
      ['poster', 6, 1, { c: '#f07f1e' }],
      ['poster', 10, 1, { c: '#c8321e', kind: 'hokage' }],
      ['scroll_hang', 5, 1, {}],
      ['shelf', 6, 2, { seed: 4 }],
      ['kitchen', 8, 2, {}],
      ['fridge', 10, 2, {}],
      ['rug', 3, 5, { w: 4, h: 2, c: '#c8642a', c2: '#ffd28a', mark: 'leaf' }],
      ['table', 4, 4, { cups: true }],
      ['cushion', 3, 4, { c: '#3a5a9a' }],
      ['cushion', 6, 4, { c: '#3a5a9a' }],
      ['plant', 10, 6, {}],
      ['plant', 1, 6, { pot: '#4a6a9a' }],
      ['exit', 5, 8, {}],
    ],
    events: [
      { x: 5, y: 8, on: 'touch', run: 'home_exit' },
      { x: 1, y: 2, h: 2, on: 'action', run: 'home_bed' },
      { x: 4, y: 4, w: 2, on: 'action', run: 'home_table' },
      { x: 5, y: 1, on: 'action', run: 'save_point' },
      { x: 10, y: 2, on: 'action', run: 'home_fridge' },
      { x: 6, y: 2, w: 2, on: 'action', run: 'home_shelf' },
      { on: 'enter', x: 0, y: 0, run: 'intro', once: 'intro_done', if: () => !S.f('intro_done') },
    ],
    spawns: { default: [5, 7, 'up'], bed: [2, 3, 'down'] },
  };

  // ---------- Hokage office ----------
  M.hokage_office = {
    name: 'Hokage\'s Office', sub: 'Hokage Tower', bgm: 'village',
    wallColor: '#e2cfa6', wallTrim: '#7a4a2e', dark: 0, nightDark: 0.35,
    grid: () => NR.mb(14, 10, 'wall').room(0, 0, 13, 9, 'wood').set(6, 9, 'wood').set(7, 9, 'wood').done(),
    props: [
      ['shelf', 1, 2, { kind: 'scrolls', seed: 2 }],
      ['shelf', 11, 2, { kind: 'books', seed: 5 }],
      ['frames', 4, 1, { w: 6, n: 6 }],
      ['window_in', 3, 1, {}],
      ['window_in', 10, 1, {}],
      ['desk', 5, 3, { book: true }],
      ['rug', 4, 5, { w: 6, h: 3, c: '#8a2a2a', c2: '#e8c070', mark: 'leaf' }],
      ['plant', 1, 7, {}],
      ['plant', 12, 7, {}],
      ['cabinet', 1, 4, { plant: true }],
      ['cabinet', 12, 4, {}],
      ['exit', 6, 9, { w: 2 }],
    ],
    npcs: [
      { key: 'kakashi', char: 'kakashi', x: 6, y: 2, dir: 'down', fixed: true, talk: 'kakashi_talk', mark: () => (S.qs('main1') === 0 || S.qs('main2') === 0 || S.qs('main2') === 3 || (S.qs('r_temari') === 0 && S.has('k_documents')) ? '!' : null) },
      { key: 'shizune', char: 'shizune', x: 2, y: 6, dir: 'right', talk: 'shizune_talk', if: () => S.ch() < 5 },
      { key: 'shikamaru', char: 'shikamaru', x: 10, y: 5, dir: 'left', talk: 'shikamaru_talk', if: () => S.ch() <= 3, mark: () => (S.qs('side_ramen') === 0 && S.has('k_ramen3') ? '!' : null) },
    ],
    events: [{ x: 6, y: 9, w: 2, on: 'touch', to: ['konoha', 23, 11, 'down'] }],
    spawns: { default: [6, 8, 'up'] },
  };

  // ---------- Hospital ----------
  M.hospital = {
    name: 'Konoha Hospital', bgm: () => (S.ch() === 4 && S.qs('main4') === 0 ? 'sad' : 'village'),
    wallColor: '#eef2f4', wallTrim: '#7fa6c8', dark: 0, nightDark: 0.3,
    grid: () => NR.mb(18, 12, 'wall').room(0, 0, 17, 11, 'tile').set(8, 11, 'tile').set(9, 11, 'tile').done(),
    props: [
      ['hbed', 1, 2, {}],
      ['hbed', 3, 2, { c: '#c8e0ea' }],
      ['curtain', 5, 2, {}],
      ['hbed', 1, 6, { c: '#d8e8c8' }],
      ['curtain', 3, 6, { c: '#c8d8f0' }],
      ['window_in', 2, 1, {}],
      ['window_in', 8, 1, {}],
      ['window_in', 12, 1, {}],
      ['counter', 7, 4, { w: 4, register: true, c: '#8a9aa8', top: '#d8e2ea' }],
      ['table', 12, 3, { papers: true }],
      ['shelf', 15, 2, { kind: 'jars', seed: 6 }],
      ['plant', 16, 9, {}],
      ['plant', 1, 9, {}],
      ['chair', 12, 7, {}],
      ['chair', 13, 7, {}],
      ['chair', 14, 7, {}],
      ['rug', 7, 7, { w: 4, h: 2, c: '#5a86a8', c2: '#e8f0f4' }],
      ['exit', 8, 11, { w: 2 }],
    ],
    npcs: [
      { key: 'nurse', char: 'vf2', x: 8, y: 3, dir: 'down', fixed: true, talk: 'nurse_talk' },
      { key: 'sakura', char: 'sakura', x: 13, y: 5, dir: 'down', talk: 'sakura_hospital', if: () => !S.party('sakura') && !(S.ch() === 4 && S.qs('main4') === 0), mark: () => (S.qs('main1') === 1 ? '!' : NR.romanceMark('sakura')) },
      { key: 'patient', char: 'vm4', x: 3, y: 4, dir: 'down', talk: 'patient_talk', if: () => S.ch() >= 1 },
    ],
    events: [
      { x: 8, y: 11, w: 2, on: 'touch', to: ['konoha', 39, 20, 'down'] },
      { x: 15, y: 2, w: 2, on: 'action', run: 'hospital_shelf' },
      { on: 'enter', x: 0, y: 0, run: 'ch4_wake', if: () => S.ch() === 4 && S.qs('main4') === 0 && !S.f('ch4_woke') },
    ],
    spawns: { default: [8, 10, 'up'], bed: [2, 4, 'down'] },
  };

  // ---------- Yamanaka Flowers ----------
  M.flower_shop = {
    name: 'Yamanaka Flowers', bgm: () => (S.night() ? 'night' : 'village'),
    wallColor: '#f2e6ee', wallTrim: '#8a6a9a', dark: 0, nightDark: 0.35,
    grid: () => NR.mb(12, 9, 'wall').room(0, 0, 11, 8, 'wood').set(5, 8, 'wood').done(),
    props: [
      ['flowershelf', 1, 2, { seed: 1 }],
      ['flowershelf', 9, 2, { seed: 2 }],
      ['counter', 4, 3, { flowers: true, c: '#9a6a8a', top: '#e8c8d8' }],
      ['window_in', 3, 1, {}],
      ['window_in', 8, 1, {}],
      ['pots', 1, 6, {}],
      ['pots', 10, 6, {}],
      ['plant', 8, 6, {}],
      ['flowerbed', 2, 5, { w: 2, h: 1 }],
      ['exit', 5, 8, {}],
    ],
    npcs: [{ key: 'ino', char: 'ino', x: 5, y: 2, dir: 'down', fixed: true, talk: 'ino_talk', if: () => !S.party('ino'), mark: () => NR.romanceMark('ino') }],
    events: [{ x: 5, y: 8, on: 'touch', to: ['konoha', 2, 18, 'down'] }],
    spawns: { default: [5, 7, 'up'] },
  };

  // ---------- Tenten's armory ----------
  M.armory = {
    name: 'Tenten Arms', sub: 'Weapons & Gear', bgm: () => (S.night() ? 'night' : 'village'),
    wallColor: '#d8c8a8', wallTrim: '#5a3a26', dark: 0, nightDark: 0.4,
    grid: () => NR.mb(12, 9, 'wall').room(0, 0, 11, 8, 'wood').set(5, 8, 'wood').done(),
    props: [
      ['weaponrack', 1, 2, {}],
      ['weaponrack', 9, 2, {}],
      ['counter', 4, 3, { c: '#7a4a2e' }],
      ['window_in', 3, 1, {}],
      ['window_in', 8, 1, {}],
      ['crate', 1, 6, {}],
      ['barrel', 2, 6, {}],
      ['dummy', 10, 5, {}],
      ['target', 10, 6, {}],
      ['exit', 5, 8, {}],
    ],
    npcs: [{ key: 'tenten', char: 'tenten', x: 5, y: 2, dir: 'down', fixed: true, talk: 'tenten_talk', if: () => !S.party('tenten'), mark: () => NR.romanceMark('tenten') }],
    events: [{ x: 5, y: 8, on: 'touch', to: ['konoha', 30, 18, 'down'] }],
    spawns: { default: [5, 7, 'up'] },
  };

  // ---------- General store ----------
  M.store = {
    name: 'Konoha General Store', bgm: 'village',
    wallColor: '#e6dcc6', wallTrim: '#7a5a3a', dark: 0, nightDark: 0.35,
    grid: () => NR.mb(12, 9, 'wall').room(0, 0, 11, 8, 'wood').set(5, 8, 'wood').done(),
    props: [
      ['shelf', 1, 2, { kind: 'jars', seed: 3 }],
      ['shelf', 9, 2, { kind: 'books', seed: 8 }],
      ['counter', 4, 3, { register: true }],
      ['window_in', 3, 1, {}],
      ['window_in', 8, 1, {}],
      ['crate', 1, 6, {}],
      ['crate', 10, 6, { c: '#9a7040' }],
      ['barrel', 9, 6, {}],
      ['exit', 5, 8, {}],
    ],
    npcs: [{ key: 'merchant', char: 'merchant', x: 5, y: 2, dir: 'down', fixed: true, talk: 'store_talk' }],
    events: [{ x: 5, y: 8, on: 'touch', to: ['konoha', 3, 23, 'down'] }],
    spawns: { default: [5, 7, 'up'] },
  };

  // ---------- Hot-spring inn (lobby + gambling room) ----------
  M.inn = {
    name: 'Moonrise Hot Spring Inn', bgm: 'onsen',
    wallColor: '#f1e8d4', wallTrim: '#5a3a26', dark: 0.05, nightDark: 0.4,
    grid: () => {
      const b = NR.mb(20, 12, 'wall').room(0, 0, 19, 11, 'wood');
      b.rect(13, 2, 18, 10, 'tatami');
      b.rect(12, 2, 12, 10, 'wall');
      b.rect(12, 5, 12, 6, 'wood');
      b.set(9, 11, 'wood').set(10, 11, 'wood');
      b.set(3, 1, 'wood');
      return b.done();
    },
    props: [
      ['noren_door', 3, 1, { mark: 'onsen', c: '#8a2a3a' }],
      ['counter', 7, 3, { w: 4, c: '#6a4a2e', top: '#a8743e' }],
      ['scroll_hang', 6, 1, {}],
      ['scroll_hang', 10, 1, { text: '湯' }],
      ['window_in', 8, 1, {}],
      ['plant', 1, 9, {}],
      ['plant', 11, 9, {}],
      ['bench', 1, 6, {}],
      ['paper_lantern', 5, 3, { c: '#f6e6b0' }],
      ['low_table', 15, 4, { sake: true }],
      ['cushion', 14, 5, { c: '#8a3a4a' }],
      ['cushion', 17, 5, { c: '#8a3a4a' }],
      ['low_table', 15, 8, { food: true }],
      ['cushion', 14, 9, { c: '#3a4a7a' }],
      ['cushion', 17, 9, { c: '#3a4a7a' }],
      ['screen', 13, 2, { c: '#f4a9c4' }],
      ['scroll_hang', 17, 1, {}],
      ['exit', 9, 11, { w: 2 }],
    ],
    npcs: [
      { key: 'okami', char: 'okami', x: 8, y: 2, dir: 'down', fixed: true, talk: 'okami_talk' },
      { key: 'tsunade', char: 'tsunade', x: 16, y: 6, dir: 'left', talk: 'tsunade_talk', if: () => !S.party('tsunade') && !(S.ch() === 4 && S.qs('main4') === 0), mark: () => (S.qs('main2') === 1 ? '!' : NR.romanceMark('tsunade')) },
      { key: 'dealer', char: 'vm2', x: 18, y: 4, dir: 'left', fixed: true, talk: 'dealer_talk' },
      { key: 'guest', char: 'vf1', x: 2, y: 4, dir: 'down', wander: 1, talk: 'inn_guest' },
      { key: 'hinata_inn', char: 'hinata', x: 4, y: 2, dir: 'down', fixed: true, talk: 'hinata_onsen', if: () => S.night() && S.qs('r_hinata') === 2 && S.aff('hinata') >= 60 && !S.party('hinata'), mark: () => 'heart' },
    ],
    events: [
      { x: 9, y: 11, w: 2, on: 'touch', to: ['konoha', 38, 28, 'down'] },
      { x: 3, y: 1, on: 'touch', to: ['hot_springs', 10, 12, 'up'] },
    ],
    spawns: { default: [9, 10, 'up'], baths: [3, 2, 'down'] },
  };

  // ---------- Outdoor baths ----------
  M.hot_springs = {
    name: 'Outdoor Baths', sub: 'Moonrise Inn', bgm: 'onsen', outdoor: true, battleBg: 'village',
    grid: () => {
      const b = NR.mb(22, 14, 'grass2');
      b.rect(0, 0, 21, 1, 'cliff');
      b.rect(1, 2, 20, 12, 'stone');
      b.ellipse(10.5, 6.5, 7.5, 3.8, 'spring');
      b.rect(9, 11, 11, 13, 'stone');
      return b.done();
    },
    props: [
      ['bamboo_fence', 1, 1, { w: 20 }],
      ['onsen_rock', 3, 4, { seed: 1 }],
      ['onsen_rock', 3, 8, { seed: 2 }],
      ['onsen_rock', 17, 4, { seed: 3 }],
      ['onsen_rock', 17, 8, { seed: 4 }],
      ['onsen_rock', 6, 10, { seed: 5 }],
      ['onsen_rock', 14, 10, { seed: 6 }],
      ['onsen_rock', 7, 2, { seed: 7 }],
      ['onsen_rock', 13, 2, { seed: 8 }],
      ['stone_lantern', 1, 3, {}],
      ['stone_lantern', 20, 3, {}],
      ['stone_lantern', 1, 10, {}],
      ['stone_lantern', 20, 10, {}],
      ['bucket', 8, 12, {}],
      ['bucket', 12, 12, {}],
      ['tree', 0, 6, { c: 'sakura', s: 0.9 }],
      ['bamboo', 21, 7, {}],
      ['bamboo', 21, 11, {}],
    ],
    emitters: [
      { type: 'steam', x: 4, y: 4, w: 13, h: 5, rate: 10 },
    ],
    npcs: [
      { key: 'bather', char: 'vm3', x: 5, y: 11, dir: 'up', talk: 'bather_talk', if: () => S.day() },
    ],
    events: [{ x: 9, y: 13, w: 3, on: 'touch', to: ['inn', 3, 2, 'down'] }],
    spawns: { default: [10, 12, 'up'] },
    weather: () => (S.night() ? 'fireflies' : null),
  };
})();
