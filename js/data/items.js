// Items, gifts, equipment and key items.
(function () {
  'use strict';
  const NR = window.NR;
  // use: {heal: fraction|abs, cp, all, revive, cure, damage, elem, escape}
  NR.ITEMS = {
    // ----- consumables -----
    ramen_miso: { name: 'Miso Ramen', icon: '🍜', type: 'use', price: 120, desc: 'Ichiraku\'s classic. Restores 55% HP to one ally.', use: { heal: 0.55 }, battle: true, field: true },
    ramen_pork: { name: 'Extra-Pork Ramen', icon: '🍜', type: 'use', price: 300, desc: 'Naruto\'s favourite. Restores all HP and 30 chakra.', use: { heal: 1, cp: 30 }, battle: true, field: true },
    dango: { name: 'Dango Skewers', icon: '🍡', type: 'use', price: 240, desc: 'Sweet and chewy. Restores 35% HP to the whole party.', use: { heal: 0.35, all: true }, battle: true, field: true },
    soldier_pill: { name: 'Soldier Pill', icon: '💊', type: 'use', price: 150, desc: 'Bitter but effective. Restores 50 chakra.', use: { cp: 50 }, battle: true, field: true },
    chakra_pill: { name: 'Akimichi Chakra Pill', icon: '🟢', type: 'use', price: 420, desc: 'Restores all chakra to one ally.', use: { cp: 9999 }, battle: true, field: true },
    antidote: { name: 'Antidote', icon: '🧪', type: 'use', price: 60, desc: 'Cures poison, burns, paralysis and chakra seals.', use: { cure: true }, battle: true, field: true },
    med_scroll: { name: 'Medical Scroll', icon: '📜', type: 'use', price: 520, desc: 'Revives a fallen ally with 40% HP.', use: { revive: 0.4 }, battle: true, field: true },
    tag: { name: 'Explosive Tag', icon: '💥', type: 'use', price: 110, desc: 'Deals heavy fire damage to one enemy.', use: { damage: 140, elem: 'fire' }, battle: true },
    smoke: { name: 'Smoke Bomb', icon: '💨', type: 'use', price: 80, desc: 'Guarantees escape from a normal battle.', use: { escape: true }, battle: true },
    // ----- gifts (raise affection) -----
    gift_zenzai: { name: 'Zenzai (Sweet Bean Soup)', icon: '🥣', type: 'gift', price: 90, desc: 'Warm red-bean soup with mochi. Someone gentle loves this.' },
    gift_cinnamon: { name: 'Cinnamon Rolls', icon: '🥐', type: 'gift', price: 80, desc: 'Fresh from the bakery, still warm.' },
    gift_anmitsu: { name: 'Anmitsu', icon: '🍧', type: 'gift', price: 100, desc: 'A jelly-and-fruit dessert. A certain medic\'s weakness.' },
    gift_pudding: { name: 'Almond Pudding', icon: '🍮', type: 'gift', price: 90, desc: 'Silky and sweet. Perfect for a flower girl.' },
    gift_manju: { name: 'Peach Buns', icon: '🍑', type: 'gift', price: 70, desc: 'Soft peach-shaped buns. A weapons expert\'s favourite snack.' },
    gift_chestnut: { name: 'Roasted Chestnuts', icon: '🌰', type: 'gift', price: 80, desc: 'Hot chestnuts. Suna folk rarely get these.' },
    gift_sake: { name: 'Premium Sake', icon: '🍶', type: 'gift', price: 260, desc: 'Aged sake from the Land of Rice Fields. For serious drinkers only.' },
    gift_bouquet: { name: 'Flower Bouquet', icon: '💐', type: 'gift', price: 150, desc: 'A pretty bouquet. Almost everyone likes flowers.' },
    gift_perfume: { name: 'Plum Blossom Perfume', icon: '🌸', type: 'gift', price: 300, desc: 'Elegant and subtle. A grown-up gift.' },
    // ----- equipment -----
    kunai_steel: { name: 'Steel Kunai', icon: '🗡', type: 'equip', slot: 'weapon', price: 300, desc: 'A well-balanced kunai. ATK +6.', stats: { atk: 6 } },
    chakra_blade: { name: 'Chakra Blade', icon: '🗡', type: 'equip', slot: 'weapon', price: 900, desc: 'Channels chakra into the edge. ATK +12, INT +4.', stats: { atk: 12, int: 4 } },
    tenten_kunai: { name: 'Tenten\'s Custom Kunai', icon: '🗡', type: 'equip', slot: 'weapon', price: 0, desc: 'Forged just for you. ATK +16, crit up.', stats: { atk: 16, crit: 8 } },
    flak_vest: { name: 'Flak Vest', icon: '🦺', type: 'equip', slot: 'gear', price: 350, desc: 'Standard jonin vest. DEF +6.', stats: { def: 6 } },
    silk_jacket: { name: 'Hyuga Silk Jacket', icon: '🧥', type: 'equip', slot: 'gear', price: 800, desc: 'Light and tough. DEF +9, RES +6.', stats: { def: 9, res: 6 } },
    medic_coat: { name: 'Medic Corps Coat', icon: '🥼', type: 'equip', slot: 'gear', price: 700, desc: 'Treated with healing herbs. RES +8, HP +40.', stats: { res: 8, mhp: 40 } },
    necklace: { name: 'First Hokage\'s Necklace', icon: '💎', type: 'equip', slot: 'charm', price: 0, desc: 'A gift from Tsunade, long ago. HP +60.', stats: { mhp: 60 } },
    charm_hinata: { name: 'Hinata\'s Scarf', icon: '🧣', type: 'equip', slot: 'charm', price: 0, desc: 'Hand-knitted and warm. DEF +8, regenerate 5% HP each turn.', stats: { def: 8, regen: 0.05 } },
    charm_sakura: { name: 'Sakura\'s Glove', icon: '🧤', type: 'equip', slot: 'charm', price: 0, desc: 'Still smells of cherry blossoms. ATK +14.', stats: { atk: 14 } },
    charm_ino: { name: 'Ino\'s Hairpin', icon: '📍', type: 'equip', slot: 'charm', price: 0, desc: 'Restores 6 chakra each turn. INT +8.', stats: { int: 8, cpregen: 6 } },
    charm_tenten: { name: 'Tenten\'s Lucky Charm', icon: '🎯', type: 'equip', slot: 'charm', price: 0, desc: 'Critical hits much more likely. Crit +15.', stats: { crit: 15 } },
    charm_temari: { name: 'Temari\'s Fan Ribbon', icon: '🎀', type: 'equip', slot: 'charm', price: 0, desc: 'Light as the desert wind. SPD +10.', stats: { spd: 10 } },
    charm_tsunade2: { name: 'Senju Hairpin', icon: '🌸', type: 'equip', slot: 'charm', price: 0, desc: 'The pin she wore the night she stopped hiding. HP +80, all stats +7.', stats: { mhp: 80, atk: 7, def: 7, int: 7, res: 7, spd: 7 } },
    charm_tsunade: { name: 'Tsunade\'s Lucky Coin', icon: '🪙', type: 'equip', slot: 'charm', price: 0, desc: 'Her luck finally turned. All stats +5, more ryo from battles.', stats: { atk: 5, def: 5, int: 5, res: 5, spd: 5, ryo: 0.5 } },
    // ----- key items -----
    k_mask: { name: 'Hollow Moon Mask', icon: '🎭', type: 'key', desc: 'A porcelain mask marked with a hollow crescent moon.' },
    k_scroll: { name: 'Seal Scroll Fragment', icon: '📜', type: 'key', desc: 'Half of an Uzumaki sealing formula. The ink still glows faintly.' },
    k_orders: { name: 'Hollow Moon Orders', icon: '✉', type: 'key', desc: 'Orders mentioning the "Moon Well" beneath Uzushiogakure.' },
    k_herbs: { name: 'Moonlit Herbs', icon: '🌿', type: 'key', desc: 'Rare medicinal herbs Sakura asked you to gather.' },
    k_moonlily: { name: 'Moon Lily', icon: '🌼', type: 'key', desc: 'A luminous flower that only blooms in the Outer Forest.' },
    k_crate: { name: 'Tenten\'s Weapon Crate', icon: '📦', type: 'key', desc: 'Heavy. Very heavy. Stolen stock from Tenten\'s shop.' },
    k_documents: { name: 'Suna Treaty Documents', icon: '🗂', type: 'key', desc: 'Sealed diplomatic papers for the Hokage.' },
    k_sake: { name: 'Legendary Sake "Sannin\'s Tears"', icon: '🍶', type: 'key', desc: 'The bottle Tsunade bet — and lost — in a card game.' },
    k_collar: { name: 'Akamaru\'s Collar', icon: '🐾', type: 'key', desc: 'A red collar. Kiba will want this back.' },
    k_tsunade_key: { name: 'Tsunade\'s Spare Key', icon: '🗝', type: 'key', desc: '"Come home whenever you like." Her house is next to the Moonrise Inn.' },
    k_tsunade_note: { name: 'Folded Note', icon: '💌', type: 'key', desc: 'Tsunade\'s handwriting: "The old spring in the grotto north of the forest pond. Tonight. Come alone."' },
    k_acadscroll: { name: 'Academy Scroll', icon: '📜', type: 'key', desc: 'The stolen Academy scroll of basic seals.' },
    k_charm: { name: 'Bond Charm', icon: '✨', type: 'key', desc: 'Charms from the people who believe in you. They hum with chakra.' },
    k_ramen1: { name: 'Ramen Order (Iruka)', icon: '🥡', type: 'key', desc: 'Miso ramen for Iruka at the Academy.' },
    k_ramen2: { name: 'Ramen Order (Kiba)', icon: '🥡', type: 'key', desc: 'Pork ramen for Kiba at the training ground.' },
    k_ramen3: { name: 'Ramen Order (Shikamaru)', icon: '🥡', type: 'key', desc: 'Salt ramen for Shikamaru at the Hokage Tower.' },
  };
  for (const id in NR.ITEMS) NR.ITEMS[id].id = id;

  // Gift preferences: 'love' +10, 'like' +5, anything else +2
  NR.GIFTS = {
    hinata: { love: ['gift_zenzai', 'gift_cinnamon'], like: ['gift_bouquet', 'gift_perfume', 'gift_anmitsu'] },
    sakura: { love: ['gift_anmitsu'], like: ['gift_bouquet', 'gift_perfume', 'gift_zenzai'] },
    ino: { love: ['gift_pudding', 'gift_perfume'], like: ['gift_bouquet', 'gift_anmitsu'] },
    tenten: { love: ['gift_manju'], like: ['gift_cinnamon', 'gift_chestnut', 'gift_bouquet'] },
    temari: { love: ['gift_chestnut'], like: ['gift_sake', 'gift_perfume'] },
    tsunade: { love: ['gift_sake'], like: ['gift_perfume', 'gift_anmitsu', 'gift_chestnut'] },
  };
})();
