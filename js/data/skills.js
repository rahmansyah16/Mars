// Jutsu, party growth and elements.
(function () {
  'use strict';
  const NR = window.NR;

  // Five-element cycle: each beats the next one.
  NR.ELEMENTS = ['fire', 'wind', 'lightning', 'earth', 'water'];
  NR.ELEM_COLOR = { fire: '#ff7a3a', wind: '#9ae8c8', lightning: '#9ad4ff', earth: '#c8a060', water: '#5ab0ff', none: '#e8e2d6', yin: '#b58cff', yang: '#ffe07a' };
  NR.ELEM_ICON = { fire: '🔥', wind: '🌀', lightning: '⚡', earth: '🪨', water: '💧' };
  NR.elemMult = function (atk, target) {
    if (!atk || atk === 'none' || !target || target === 'none') return 1;
    const i = NR.ELEMENTS.indexOf(atk), j = NR.ELEMENTS.indexOf(target);
    if (i < 0 || j < 0) return 1;
    if ((i + 1) % 5 === j) return 1.5; // atk beats target
    if ((j + 1) % 5 === i) return 0.7; // target beats atk
    return 1;
  };

  // kind: 'tai' uses ATK/DEF, 'nin' uses INT/RES
  // target: enemy | enemies | ally | allies | self | ally_dead
  const S = (NR.SKILLS = {
    // ---- basics ----
    strike: { name: 'Strike', kind: 'tai', target: 'enemy', power: 1, cp: 0, fx: 'hit', desc: 'A basic taijutsu attack.' },
    gentle_fist: { name: 'Gentle Fist', kind: 'tai', target: 'enemy', power: 1, cp: 0, fx: 'palm', drainCp: 6, desc: 'Strikes chakra points, draining a little chakra.' },
    guard: { name: 'Guard', kind: 'none', target: 'self', cp: 0, desc: 'Halve damage until your next turn and recover a little chakra.' },
    // ---- Naruto ----
    clones: { name: 'Shadow Clone Barrage', kind: 'tai', target: 'enemy', power: 0.46, hits: 4, cp: 10, fx: 'clones', desc: 'Four shadow clones pile on one enemy.' },
    rasengan: { name: 'Rasengan', kind: 'nin', target: 'enemy', power: 2.3, cp: 16, fx: 'rasengan', cutin: true, desc: 'A spiralling sphere of pure chakra.' },
    sexy: { name: 'Sexy Jutsu', kind: 'none', target: 'enemies', cp: 6, fx: 'sexy', status: { id: 'stun', chance: 0.5, turns: 1 }, desc: 'A legendary... distraction. May stun enemies. Doesn\'t work on everyone.' },
    big_rasengan: { name: 'Giant Rasengan', kind: 'nin', target: 'enemy', power: 3.2, cp: 28, fx: 'rasengan_big', cutin: true, desc: 'A Rasengan the size of a boulder.' },
    sage_mode: { name: 'Sage Mode', kind: 'none', target: 'self', cp: 20, fx: 'sage', buff: { atk: 1.5, int: 1.5, turns: 3 }, desc: 'Draw in natural energy: ATK and INT up for 3 turns.' },
    rasenshuriken: { name: 'Wind Style: Rasenshuriken', kind: 'nin', target: 'enemies', power: 2.4, elem: 'wind', cp: 42, fx: 'rasenshuriken', cutin: true, desc: 'A shrieking shuriken of wind chakra that hits every enemy.' },
    kurama_mode: { name: 'Kurama Link Mode', kind: 'none', target: 'self', cp: 0, fx: 'kurama', special: 'kurama', buff: { atk: 1.8, int: 1.8, spd: 1.4, turns: 4 }, heal: 0.3, desc: 'Fuse chakra with Kurama. Needs a full Kurama gauge.' },
    beast_bomb: { name: 'Tailed Beast Bomb', kind: 'nin', target: 'enemies', power: 4.2, cp: 30, fx: 'beastbomb', cutin: true, needBuff: 'kurama', desc: 'Only in Kurama Link Mode. A devastating chakra blast.' },
    // ---- Sakura ----
    cherry_impact: { name: 'Cherry Blossom Impact', kind: 'tai', target: 'enemy', power: 2.1, elem: 'earth', cp: 12, fx: 'impact', cutin: true, status: { id: 'defdown', chance: 0.4, turns: 3 }, desc: 'A chakra-loaded punch that cracks the earth. May lower DEF.' },
    mystic_palm: { name: 'Mystical Palm', kind: 'heal', target: 'ally', heal: 0.48, cp: 10, fx: 'heal', desc: 'Heals one ally.' },
    detox: { name: 'Detox Jutsu', kind: 'heal', target: 'ally', heal: 0.1, cure: true, cp: 6, fx: 'heal', desc: 'Cures status ailments and heals a little.' },
    heal_wave: { name: 'Healing Wave', kind: 'heal', target: 'allies', heal: 0.32, cp: 22, fx: 'heal_all', desc: 'Heals the whole party.' },
    byakugo: { name: 'Strength of a Hundred', kind: 'none', target: 'self', cp: 24, fx: 'byakugo', buff: { atk: 1.4, regen: 0.12, turns: 4 }, desc: 'Release the seal: ATK up and regenerate HP for 4 turns.' },
    heaven_kick: { name: 'Heavenly Foot of Pain', kind: 'tai', target: 'enemy', power: 2.9, elem: 'earth', cp: 24, fx: 'impact', cutin: true, desc: 'An axe kick that splits the ground.' },
    revive_jutsu: { name: 'Resuscitation', kind: 'heal', target: 'ally_dead', revive: 0.5, cp: 30, fx: 'heal', desc: 'Revives a fallen ally with 50% HP.' },
    // ---- Hinata ----
    byakugan: { name: 'Byakugan', kind: 'none', target: 'allies', cp: 8, fx: 'byakugan', buff: { acc: 1, crit: 20, turns: 4 }, desc: 'See every weakness: party never misses and crits more for 4 turns.' },
    palms64: { name: 'Eight Trigrams 64 Palms', kind: 'tai', target: 'enemy', power: 0.32, hits: 8, cp: 16, fx: 'palms', cutin: true, status: { id: 'seal', chance: 0.35, turns: 2 }, desc: 'Sixty-four strikes. May seal the target\'s jutsu.' },
    vacuum_palm: { name: 'Vacuum Palm', kind: 'nin', target: 'enemies', power: 1.3, elem: 'wind', cp: 14, fx: 'wind', desc: 'A blast of compressed air hits all enemies.' },
    rotation: { name: 'Palm Rotation', kind: 'none', target: 'allies', cp: 14, fx: 'rotation', buff: { guard: 0.5, turns: 1 }, desc: 'A spinning chakra dome: party takes half damage until next turn.' },
    twin_lions: { name: 'Twin Lion Fists', kind: 'nin', target: 'enemy', power: 2.8, cp: 24, fx: 'lions', cutin: true, desc: 'Chakra lions roar from both palms.' },
    // ---- guests ----
    chidori: { name: 'Chidori', kind: 'nin', target: 'enemy', power: 2.4, elem: 'lightning', cp: 16, fx: 'chidori', cutin: true, desc: 'A thousand birds of lightning.' },
    hounds: { name: 'Lightning Hounds', kind: 'nin', target: 'enemies', power: 1.5, elem: 'lightning', cp: 20, fx: 'lightning_all', status: { id: 'para', chance: 0.25, turns: 2 }, desc: 'Lightning wolves tear through all enemies.' },
    fireball: { name: 'Fire Style: Fireball', kind: 'nin', target: 'enemy', power: 1.9, elem: 'fire', cp: 12, fx: 'fire', status: { id: 'burn', chance: 0.3, turns: 3 }, desc: 'A great ball of flame. May burn.' },
    earth_wall: { name: 'Earth Style: Mud Wall', kind: 'none', target: 'allies', cp: 16, fx: 'earth_wall', buff: { def: 1.4, res: 1.4, turns: 3 }, desc: 'Raises a wall: party DEF and RES up.' },
    amaterasu: { name: 'Amaterasu', kind: 'nin', target: 'enemy', power: 2.2, elem: 'fire', cp: 26, fx: 'amaterasu', cutin: true, status: { id: 'burn', chance: 1, turns: 4 }, desc: 'Black flames that never go out.' },
    kirin: { name: 'Kirin', kind: 'nin', target: 'enemies', power: 3.4, elem: 'lightning', cp: 45, fx: 'kirin', cutin: true, desc: 'Lightning from the heavens in the shape of a beast.' },
    susanoo: { name: 'Susanoo', kind: 'none', target: 'self', cp: 30, fx: 'susanoo', buff: { def: 1.8, res: 1.8, atk: 1.3, turns: 3 }, desc: 'A spectral warrior armors Sasuke.' },
    weapon_storm: { name: 'Manipulated Tools', kind: 'tai', target: 'enemies', power: 0.55, hits: 3, cp: 14, fx: 'weapons', desc: 'A rain of blades on all enemies.' },
    twin_dragons: { name: 'Rising Twin Dragons', kind: 'tai', target: 'enemy', power: 0.4, hits: 7, cp: 22, fx: 'weapons', cutin: true, desc: 'Two scrolls unleash a storm of steel.' },
    wind_scythe: { name: 'Wind Scythe Jutsu', kind: 'nin', target: 'enemies', power: 1.6, elem: 'wind', cp: 16, fx: 'wind', desc: 'Razor winds from the giant fan.' },
    sickle_weasel: { name: 'Sickle Weasel', kind: 'nin', target: 'enemy', power: 2.6, elem: 'wind', cp: 22, fx: 'wind_big', cutin: true, desc: 'A summoned weasel rides a devastating gale.' },
    mind_transfer: { name: 'Mind Transfer', kind: 'none', target: 'enemy', cp: 12, fx: 'mind', status: { id: 'confuse', chance: 0.75, turns: 2 }, desc: 'Take over the enemy\'s mind: they may attack their allies.' },
    flower_blast: { name: 'Petal Storm', kind: 'nin', target: 'enemies', power: 1.3, cp: 14, fx: 'petals', status: { id: 'sleep', chance: 0.3, turns: 2 }, desc: 'Drugged petals may put enemies to sleep.' },
    heel_drop: { name: 'Heavenly Heel Drop', kind: 'tai', target: 'enemy', power: 3.4, elem: 'earth', cp: 20, fx: 'impact', cutin: true, desc: 'The legendary heel of the Fifth Hokage.' },
    creation: { name: 'Creation Rebirth', kind: 'heal', target: 'allies', heal: 0.5, cure: true, cp: 36, fx: 'heal_all', desc: 'Heals and cures the whole party.' },
    leaf_hurricane: { name: 'Leaf Hurricane', kind: 'tai', target: 'enemies', power: 1.2, cp: 6, fx: 'wind', desc: 'A spinning kick that hits everyone.' },
    lotus: { name: 'Primary Lotus', kind: 'tai', target: 'enemy', power: 3.2, cp: 18, fx: 'impact', cutin: true, desc: 'Youthful power! Costs a little HP too.', selfDamage: 0.1 },
    // ---- bond combos ----
    combo_hinata: { name: 'Gentle Lion Rasengan', kind: 'nin', target: 'enemy', power: 4.4, cp: 30, fx: 'lions', cutin: true, combo: 'hinata', desc: 'Naruto & Hinata: lions of chakra around a Rasengan.' },
    combo_sakura: { name: 'Cherry Rasengan Impact', kind: 'tai', target: 'enemy', power: 4.2, cp: 30, fx: 'impact', cutin: true, combo: 'sakura', status: { id: 'defdown', chance: 1, turns: 3 }, desc: 'Naruto & Sakura: a Rasengan driven home by a monster punch.' },
    combo_ino: { name: 'Mind-Link Barrage', kind: 'nin', target: 'enemies', power: 1.8, cp: 30, fx: 'mind', combo: 'ino', status: { id: 'confuse', chance: 0.5, turns: 2 }, desc: 'Naruto & Ino: a hundred clones guided by one mind.' },
    combo_tenten: { name: 'Rasen Weapon Storm', kind: 'tai', target: 'enemies', power: 0.7, hits: 4, cp: 30, fx: 'weapons', combo: 'tenten', desc: 'Naruto & Tenten: spinning chakra blades everywhere.' },
    combo_temari: { name: 'Rasen Tornado', kind: 'nin', target: 'enemies', power: 3, elem: 'wind', cp: 30, fx: 'rasenshuriken', combo: 'temari', desc: 'Naruto & Temari: a Rasengan inside a hurricane.' },
    combo_tsunade: { name: 'Sannin Heaven Rasengan', kind: 'tai', target: 'enemy', power: 4.8, elem: 'earth', cp: 30, fx: 'rasengan_big', cutin: true, combo: 'tsunade', desc: 'Naruto & Tsunade: a meteor of a strike.' },
    // ---- enemy skills ----
    bite: { name: 'Savage Bite', kind: 'tai', target: 'enemy', power: 1.25, fx: 'bite', desc: '' },
    howl: { name: 'Howl', kind: 'none', target: 'self', fx: 'buff', buff: { atk: 1.3, turns: 3 }, desc: '' },
    charge: { name: 'Tusk Charge', kind: 'tai', target: 'enemy', power: 1.6, fx: 'hit', desc: '' },
    sting: { name: 'Venom Sting', kind: 'tai', target: 'enemy', power: 0.8, fx: 'bite', status: { id: 'poison', chance: 0.5, turns: 3 }, desc: '' },
    shuriken: { name: 'Shuriken Volley', kind: 'tai', target: 'enemy', power: 0.6, hits: 2, fx: 'shuriken', desc: '' },
    earth_spike: { name: 'Earth Spikes', kind: 'nin', target: 'enemy', power: 1.5, elem: 'earth', fx: 'earth', desc: '' },
    e_fireball: { name: 'Fireball Jutsu', kind: 'nin', target: 'enemy', power: 1.5, elem: 'fire', fx: 'fire', status: { id: 'burn', chance: 0.25, turns: 3 }, desc: '' },
    dark_claw: { name: 'Hollow Claw', kind: 'tai', target: 'enemy', power: 1.5, fx: 'slash', desc: '' },
    chakra_drain: { name: 'Chakra Drain Seal', kind: 'nin', target: 'enemy', power: 0.8, drainCp: 20, fx: 'drain', desc: '' },
    shadow_shuriken: { name: 'Shadow Shuriken', kind: 'tai', target: 'enemies', power: 0.9, fx: 'shuriken', desc: '' },
    water_bullet: { name: 'Water Bullet', kind: 'nin', target: 'enemy', power: 1.5, elem: 'water', fx: 'water', desc: '' },
    lightning_blade: { name: 'Lightning Blade', kind: 'nin', target: 'enemy', power: 1.6, elem: 'lightning', fx: 'chidori', status: { id: 'para', chance: 0.2, turns: 2 }, desc: '' },
    venom_fang: { name: 'Venom Fang', kind: 'tai', target: 'enemy', power: 1.3, fx: 'bite', status: { id: 'poison', chance: 0.6, turns: 3 }, desc: '' },
    coil: { name: 'Crushing Coil', kind: 'tai', target: 'enemy', power: 1.1, fx: 'hit', status: { id: 'stun', chance: 0.35, turns: 1 }, desc: '' },
    poison_blades: { name: 'Poison Blades', kind: 'tai', target: 'enemy', power: 1.2, hits: 2, fx: 'slash', status: { id: 'poison', chance: 0.4, turns: 3 }, desc: '' },
    water_dragon: { name: 'Water Dragon Bullet', kind: 'nin', target: 'enemies', power: 1.5, elem: 'water', fx: 'water_big', desc: '' },
    snake_hands: { name: 'Striking Shadow Snakes', kind: 'tai', target: 'enemy', power: 1.4, hits: 2, fx: 'bite', status: { id: 'poison', chance: 0.5, turns: 3 }, desc: '' },
    hydro_prison: { name: 'Water Prison', kind: 'nin', target: 'enemy', power: 0.6, elem: 'water', fx: 'water', status: { id: 'stun', chance: 0.6, turns: 1 }, desc: '' },
    fire_dragon: { name: 'Fire Dragon Flame', kind: 'nin', target: 'enemies', power: 1.4, elem: 'fire', fx: 'fire_all', status: { id: 'burn', chance: 0.25, turns: 3 }, desc: '' },
    rock_slam: { name: 'Rock Slam', kind: 'tai', target: 'enemy', power: 2, elem: 'earth', fx: 'earth', desc: '' },
    harden: { name: 'Stone Skin', kind: 'none', target: 'self', fx: 'buff', buff: { def: 1.6, turns: 3 }, desc: '' },
    tidal_wave: { name: 'Tidal Wave', kind: 'nin', target: 'enemies', power: 1.6, elem: 'water', fx: 'water_big', desc: '' },
    moon_ray: { name: 'Hollow Moon Ray', kind: 'nin', target: 'enemies', power: 1.7, fx: 'moon', desc: '' },
    seal_chains: { name: 'Sealing Chains', kind: 'nin', target: 'enemy', power: 0.9, fx: 'chains', status: { id: 'seal', chance: 0.6, turns: 2 }, desc: '' },
    hollow_drain: { name: 'Hollow Well', kind: 'nin', target: 'enemies', power: 0.7, drainCp: 16, fx: 'drain', desc: '' },
    void_palm: { name: 'Void Palm', kind: 'tai', target: 'enemy', power: 2.1, fx: 'moon', desc: '' },
    void_burst: { name: 'Void Burst', kind: 'nin', target: 'enemies', power: 2.3, fx: 'beastbomb', desc: '' },
    absorb: { name: 'Absorb Chakra', kind: 'heal', target: 'self', heal: 0.08, fx: 'drain', desc: '' },
    bandit_slash: { name: 'Dirty Slash', kind: 'tai', target: 'enemy', power: 1.25, fx: 'slash', desc: '' },
    bandit_bomb: { name: 'Cheap Bomb', kind: 'nin', target: 'enemies', power: 0.9, elem: 'fire', fx: 'fire_all', desc: '' },
  });
  for (const id in S) S[id].id = id;

  // Party classes: base stats at level 1 and growth per level; skills learned by level.
  NR.CLASSES = {
    naruto: { base: { mhp: 128, mcp: 62, atk: 16, def: 10, int: 14, res: 9, spd: 12 }, grow: { mhp: 19, mcp: 6, atk: 2.7, def: 1.6, int: 2.5, res: 1.4, spd: 1.1 }, attack: 'strike', learn: [[1, 'clones'], [1, 'rasengan'], [1, 'sexy'], [6, 'big_rasengan'], [10, 'sage_mode'], [14, 'rasenshuriken']] },
    sakura: { base: { mhp: 104, mcp: 70, atk: 18, def: 9, int: 13, res: 12, spd: 10 }, grow: { mhp: 15, mcp: 7, atk: 2.9, def: 1.4, int: 2.1, res: 1.8, spd: 1.0 }, attack: 'strike', learn: [[1, 'cherry_impact'], [1, 'mystic_palm'], [1, 'detox'], [5, 'heal_wave'], [9, 'byakugo'], [12, 'revive_jutsu'], [15, 'heaven_kick']] },
    hinata: { base: { mhp: 94, mcp: 74, atk: 13, def: 9, int: 15, res: 12, spd: 15 }, grow: { mhp: 13, mcp: 7, atk: 2.3, def: 1.5, int: 2.6, res: 1.9, spd: 1.5 }, attack: 'gentle_fist', learn: [[1, 'byakugan'], [1, 'palms64'], [4, 'vacuum_palm'], [7, 'rotation'], [11, 'twin_lions']] },
    kakashi: { base: { mhp: 112, mcp: 82, atk: 17, def: 11, int: 18, res: 12, spd: 15 }, grow: { mhp: 16, mcp: 7, atk: 2.6, def: 1.7, int: 2.8, res: 1.7, spd: 1.4 }, attack: 'strike', learn: [[1, 'chidori'], [1, 'hounds'], [1, 'fireball'], [1, 'earth_wall']] },
    sasuke: { base: { mhp: 118, mcp: 88, atk: 19, def: 11, int: 20, res: 12, spd: 16 }, grow: { mhp: 16, mcp: 8, atk: 2.9, def: 1.6, int: 3.0, res: 1.6, spd: 1.5 }, attack: 'strike', learn: [[1, 'chidori'], [1, 'fireball'], [1, 'amaterasu'], [1, 'susanoo'], [1, 'kirin']] },
    tenten: { base: { mhp: 96, mcp: 56, atk: 18, def: 9, int: 11, res: 9, spd: 14 }, grow: { mhp: 14, mcp: 5, atk: 2.8, def: 1.4, int: 1.8, res: 1.4, spd: 1.4 }, attack: 'strike', learn: [[1, 'weapon_storm'], [1, 'twin_dragons']] },
    temari: { base: { mhp: 100, mcp: 72, atk: 12, def: 9, int: 18, res: 11, spd: 14 }, grow: { mhp: 14, mcp: 7, atk: 2.0, def: 1.5, int: 2.8, res: 1.7, spd: 1.4 }, attack: 'strike', learn: [[1, 'wind_scythe'], [1, 'sickle_weasel']] },
    tsunade: { base: { mhp: 142, mcp: 92, atk: 22, def: 12, int: 16, res: 14, spd: 11 }, grow: { mhp: 20, mcp: 8, atk: 3.2, def: 1.8, int: 2.4, res: 2.0, spd: 1.1 }, attack: 'strike', learn: [[1, 'heel_drop'], [1, 'mystic_palm'], [1, 'creation']] },
    ino: { base: { mhp: 90, mcp: 76, atk: 11, def: 9, int: 17, res: 13, spd: 13 }, grow: { mhp: 13, mcp: 7, atk: 1.8, def: 1.4, int: 2.7, res: 1.9, spd: 1.3 }, attack: 'strike', learn: [[1, 'mind_transfer'], [1, 'flower_blast'], [1, 'mystic_palm']] },
    lee: { base: { mhp: 118, mcp: 32, atk: 22, def: 11, int: 5, res: 9, spd: 18 }, grow: { mhp: 16, mcp: 3, atk: 3.2, def: 1.6, int: 0.6, res: 1.3, spd: 1.8 }, attack: 'strike', learn: [[1, 'leaf_hurricane'], [1, 'lotus']] },
  };
  NR.expToNext = (lv) => Math.floor(26 * Math.pow(lv, 1.55) + 24);
  NR.MAX_LEVEL = 40;
})();
