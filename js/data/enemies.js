// Enemies and troops (battle groups).
(function () {
  'use strict';
  const NR = window.NR;
  // sprite: character id drawn with its walking sheet; beast: procedural creature art
  const E = (NR.ENEMIES = {
    wolf: { name: 'Corrupted Wolf', beast: 'wolf', hp: 74, cp: 20, atk: 15, def: 6, int: 4, res: 5, spd: 14, exp: 15, ryo: 12, skills: ['bite', 'bite', 'howl'], drops: [['ramen_miso', 0.12]] },
    boar: { name: 'Wild Boar', beast: 'boar', hp: 118, cp: 10, atk: 19, def: 10, int: 2, res: 4, spd: 8, exp: 19, ryo: 10, skills: ['charge', 'charge'], weak: 'fire', drops: [['ramen_miso', 0.2]] },
    wasps: { name: 'Chakra Wasps', beast: 'wasps', hp: 52, cp: 20, atk: 12, def: 4, int: 8, res: 6, spd: 19, exp: 13, ryo: 8, skills: ['sting'], elem: 'wind', drops: [['antidote', 0.2]] },
    rogue: { name: 'Rogue Ninja', sprite: 'rogue', hp: 96, cp: 60, atk: 15, def: 8, int: 14, res: 8, spd: 11, exp: 22, ryo: 34, skills: ['strike', 'shuriken', 'earth_spike'], elem: 'earth', drops: [['soldier_pill', 0.2], ['tag', 0.1]] },
    rogue_fire: { name: 'Rogue Scout', sprite: 'rogue', hp: 84, cp: 60, atk: 13, def: 7, int: 16, res: 9, spd: 13, exp: 22, ryo: 34, skills: ['strike', 'e_fireball', 'shuriken'], elem: 'fire', drops: [['soldier_pill', 0.2]] },
    nue: { name: 'Nue, the Masked Rogue', sprite: 'nue', boss: true, hp: 720, cp: 200, atk: 22, def: 12, int: 22, res: 12, spd: 14, exp: 160, ryo: 320, skills: ['dark_claw', 'chakra_drain', 'shadow_shuriken', 'e_fireball'], elem: 'fire', drops: [['chakra_pill', 1]] },
    bandit: { name: 'Bandit Thug', sprite: 'bandit', hp: 110, cp: 20, atk: 17, def: 9, int: 5, res: 6, spd: 10, exp: 20, ryo: 45, skills: ['bandit_slash', 'strike'], drops: [['ramen_miso', 0.2]] },
    bandit_boss: { name: 'Gorou the Fence', sprite: 'bandit', scale: 1.2, hp: 420, cp: 60, atk: 22, def: 12, int: 10, res: 8, spd: 11, exp: 90, ryo: 260, skills: ['bandit_slash', 'bandit_bomb', 'strike'], drops: [['dango', 1]] },
    // spar partners (fights end when they drop to 25% HP)
    spar_lee: { name: 'Rock Lee', sprite: 'lee', hp: 520, cp: 40, atk: 20, def: 10, int: 4, res: 8, spd: 20, exp: 70, ryo: 0, skills: ['strike', 'leaf_hurricane', 'lotus'] },
    spar_sakura: { name: 'Sakura', sprite: 'sakura', hp: 600, cp: 90, atk: 22, def: 11, int: 14, res: 12, spd: 11, exp: 80, ryo: 0, skills: ['strike', 'cherry_impact', 'mystic_palm'] },
    spar_temari: { name: 'Temari', sprite: 'temari', hp: 620, cp: 100, atk: 14, def: 10, int: 24, res: 13, spd: 15, exp: 90, ryo: 0, skills: ['wind_scythe', 'sickle_weasel', 'strike'], elem: 'wind' },
    // hideout
    hm_soldier: { name: 'Hollow Moon Soldier', sprite: 'hm_soldier', hp: 190, cp: 80, atk: 24, def: 14, int: 22, res: 14, spd: 14, exp: 42, ryo: 60, skills: ['strike', 'water_bullet', 'water_bullet'], elem: 'water', drops: [['soldier_pill', 0.25], ['ramen_miso', 0.15]] },
    hm_striker: { name: 'Hollow Moon Striker', sprite: 'hm_elite', hp: 170, cp: 80, atk: 22, def: 12, int: 26, res: 13, spd: 17, exp: 46, ryo: 66, skills: ['strike', 'lightning_blade'], elem: 'lightning', drops: [['antidote', 0.25]] },
    snake: { name: 'Experiment Serpent', beast: 'snake', hp: 240, cp: 40, atk: 25, def: 13, int: 10, res: 10, spd: 12, exp: 48, ryo: 40, skills: ['venom_fang', 'coil'], weak: 'lightning', drops: [['antidote', 0.35]] },
    puppet: { name: 'Sentinel Puppet', beast: 'puppet', hp: 170, cp: 0, atk: 26, def: 22, int: 4, res: 6, spd: 13, exp: 44, ryo: 50, skills: ['poison_blades', 'strike'], weak: 'fire', drops: [['tag', 0.3]] },
    mizuchi: { name: 'Mizuchi the Serpent', sprite: 'mizuchi', boss: true, female: true, hp: 1750, cp: 400, atk: 26, def: 16, int: 34, res: 18, spd: 16, exp: 620, ryo: 900, skills: ['water_dragon', 'snake_hands', 'hydro_prison', 'water_bullet'], elem: 'water', drops: [['chakra_pill', 1], ['med_scroll', 1]] },
    // ruins
    hm_elite: { name: 'Hollow Moon Elite', sprite: 'hm_elite', hp: 390, cp: 120, atk: 36, def: 20, int: 36, res: 20, spd: 18, exp: 110, ryo: 140, skills: ['lightning_blade', 'fire_dragon', 'strike'], elem: 'lightning', drops: [['chakra_pill', 0.2], ['ramen_pork', 0.2]] },
    golem: { name: 'Seal Golem', beast: 'golem', hp: 640, cp: 60, atk: 40, def: 34, int: 10, res: 18, spd: 8, exp: 150, ryo: 120, skills: ['rock_slam', 'rock_slam', 'harden'], elem: 'earth', drops: [['soldier_pill', 0.5]] },
    sea_serpent: { name: 'Whirlpool Serpent', beast: 'serpent', hp: 540, cp: 100, atk: 34, def: 20, int: 34, res: 18, spd: 15, exp: 140, ryo: 110, skills: ['tidal_wave', 'venom_fang'], elem: 'water', drops: [['ramen_pork', 0.3]] },
    kagen1: { name: 'Kagen', sprite: 'kagen', boss: true, hp: 3200, cp: 999, atk: 40, def: 24, int: 44, res: 24, spd: 20, exp: 1200, ryo: 2000, skills: ['moon_ray', 'seal_chains', 'hollow_drain', 'void_palm'], drops: [] },
    kagen2: { name: 'Kagen — Hollow Moon Avatar', sprite: 'kagen', boss: true, scale: 1.55, aura: '#8a5aff', hp: 4600, cp: 999, atk: 46, def: 28, int: 50, res: 28, spd: 22, exp: 3000, ryo: 5000, skills: ['void_burst', 'moon_ray', 'absorb', 'void_palm', 'seal_chains'], drops: [] },
  });
  for (const id in E) E[id].id = id;

  NR.TROOPS = {
    forest_wolves: { members: ['wolf', 'wolf'], bg: 'forest' },
    forest_pack: { members: ['wolf', 'wolf', 'wolf'], bg: 'forest' },
    forest_boar: { members: ['boar'], bg: 'forest' },
    forest_wasps: { members: ['wasps', 'wasps'], bg: 'forest' },
    forest_rogues: { members: ['rogue', 'rogue_fire'], bg: 'forest' },
    forest_mix: { members: ['rogue', 'wolf'], bg: 'forest' },
    boss_nue: { members: ['nue'], bg: 'forest', bgm: 'boss', boss: true, noEscape: true },
    bandits: { members: ['bandit', 'bandit_boss', 'bandit'], bg: 'forest', bgm: 'battle', noEscape: true },
    spar_lee: { members: ['spar_lee'], bg: 'training', spar: true, noEscape: true },
    spar_sakura: { members: ['spar_sakura'], bg: 'training', spar: true, noEscape: true },
    spar_temari: { members: ['spar_temari'], bg: 'training', spar: true, noEscape: true },
    hideout_a: { members: ['hm_soldier', 'hm_soldier'], bg: 'cave' },
    hideout_b: { members: ['snake'], bg: 'cave' },
    hideout_c: { members: ['puppet', 'hm_soldier'], bg: 'cave' },
    hideout_d: { members: ['hm_striker', 'puppet'], bg: 'cave' },
    hideout_e: { members: ['hm_striker', 'hm_soldier', 'snake'], bg: 'cave' },
    boss_mizuchi: { members: ['mizuchi'], bg: 'cave', bgm: 'boss', boss: true, noEscape: true },
    ruins_a: { members: ['hm_elite', 'hm_soldier'], bg: 'ruins' },
    ruins_b: { members: ['golem'], bg: 'ruins' },
    ruins_c: { members: ['sea_serpent', 'hm_elite'], bg: 'ruins' },
    ruins_d: { members: ['hm_elite', 'hm_elite'], bg: 'ruins' },
    ruins_e: { members: ['golem', 'hm_striker'], bg: 'ruins' },
    boss_kagen: { members: ['kagen1'], bg: 'moonwell', bgm: 'boss', boss: true, noEscape: true, final: 1 },
    boss_kagen2: { members: ['kagen2'], bg: 'moonwell', bgm: 'boss', boss: true, noEscape: true, final: 2 },
  };
})();
