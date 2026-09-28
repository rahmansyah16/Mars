// Quest journal entries. Stages are advanced by story scripts.
(function () {
  'use strict';
  const NR = window.NR;
  NR.QUESTS = {
    // ---------------- main story ----------------
    main1: {
      title: 'Shadows over the Leaf', type: 'main', chapter: 1,
      stages: [
        'Kakashi wants to see you. Go to the Hokage Tower in the village centre.',
        'Kakashi assigned you a medic. Find Sakura at Konoha Hospital.',
        'Head east through the Training Ground to reach the Outer Forest.',
        'Search the Outer Forest for the missing chunin patrol.',
        'Follow the drained chakra trail deeper into the forest.',
      ],
    },
    main2: {
      title: 'The Hollow Moon', type: 'main', chapter: 2,
      stages: [
        'Report what happened in the forest to Kakashi at the Hokage Tower.',
        'Tsunade knows seals better than anyone. Find her at the Hot Springs.',
        'It is late. Enjoy your free evening in the village, then sleep at home.',
        'Meet the others at the Hokage Tower in the morning.',
      ],
    },
    main3: {
      title: 'Serpent\'s Den', type: 'main', chapter: 3,
      stages: [
        'Find the Hollow Moon hideout: a cave in the far north of the Outer Forest.',
        'Break the three seal locks guarding the inner hideout.',
        'Confront the Hollow Moon lieutenant in the deepest chamber.',
      ],
    },
    main4: {
      title: 'Bonds of the Leaf', type: 'main', chapter: 4,
      stages: [
        'Recover at Konoha Hospital.',
        'Before the journey, visit the people who matter to you. (Talk to your friends in the village.)',
        'The Lantern Festival starts tonight in the village square.',
        'At dawn, leave from the East Gate for the ruins of Uzushiogakure.',
      ],
    },
    main5: {
      title: 'The Whirlpool\'s Heart', type: 'main', chapter: 5,
      stages: [
        'Cross the ruins of Uzushiogakure.',
        'Descend to the Moon Well at the heart of the ruins.',
        'Stop Kagen before the Moon Well drains the world\'s chakra.',
      ],
    },
    // ---------------- side quests ----------------
    side_ramen: {
      title: 'Ramen Rush', type: 'side',
      stages: ['Teuchi needs three deliveries: Iruka (Academy grounds), Kiba (Training Ground) and Shikamaru (Hokage Tower).', 'All orders delivered. Return to Ichiraku Ramen.'],
    },
    side_akamaru: {
      title: 'Where\'s Akamaru?', type: 'side',
      stages: ['Kiba\'s partner Akamaru ran off into the Outer Forest chasing a scent. Find him.', 'You found Akamaru! Return to Kiba at the Training Ground.'],
    },
    side_lee: {
      title: 'The Springtime of Youth', type: 'side',
      stages: ['Rock Lee challenged you to a spar at the Training Ground.'],
    },
    side_scroll: {
      title: 'The Stolen Scroll', type: 'side',
      stages: ['A basic-seals scroll was stolen from the Academy. Iruka suspects the Hollow Moon took it to their hideout.', 'You found the Academy scroll. Return it to Iruka.'],
    },
    // ---------------- romance ----------------
    r_hinata: {
      title: 'Moonlit Heart (Hinata)', type: 'romance', char: 'hinata',
      stages: [
        'Hinata wants to train with you in the Hyuga garden.',
        'Hinata would like to walk by the river with you some evening. (Affection ♥25+)',
        'Hinata has reserved the private bath at the Hot Springs tonight... (Affection ♥60+, at night)',
      ],
    },
    r_sakura: {
      title: 'Cherry Blossom Nights (Sakura)', type: 'romance', char: 'sakura',
      stages: [
        'Sakura needs Moonlit Herbs from the Outer Forest for the hospital.',
        'Sakura is stressed from overwork. Visit her at the hospital. (Affection ♥25+)',
        'Sakura asked you to meet her under the big cherry tree in the park at night. (Affection ♥60+)',
      ],
    },
    r_ino: {
      title: 'The Language of Flowers (Ino)', type: 'romance', char: 'ino',
      stages: [
        'Ino wants a rare Moon Lily from the Outer Forest for her shop.',
        'Ino has a "flower lesson" planned at her shop. (Affection ♥25+)',
        'Ino asked you to come to the flower shop after closing time. (Affection ♥60+, at night)',
      ],
    },
    r_tenten: {
      title: 'Weapon of Choice (Tenten)', type: 'romance', char: 'tenten',
      stages: [
        'Bandits stole a crate of Tenten\'s weapons. Their camp is in the Outer Forest.',
        'Tenten offered to teach you her shuriken technique at the Training Ground. (Affection ♥25+)',
        'Tenten invited you to her armory for a drink after closing. (Affection ♥60+, at night)',
      ],
    },
    r_temari: {
      title: 'Wind and Sand (Temari)', type: 'romance', char: 'temari',
      stages: [
        'Temari needs the Suna treaty documents delivered to Kakashi — and his reply brought back.',
        'Temari wants a real sparring partner. Meet her at the Training Ground. (Affection ♥25+)',
        'Temari asked to see the village rooftops at night. Meet her by the Hokage Monument path. (Affection ♥60+)',
      ],
    },
    r_tsunade: {
      title: 'The Legendary Sucker (Tsunade)', type: 'romance', char: 'tsunade',
      stages: [
        'Tsunade lost her legendary sake in a bet. Win it back at the gambling hall behind the Hot Springs Inn.',
        'Tsunade challenged you to a drinking contest at the inn. (Affection ♥25+)',
        'Tsunade reserved the moonlit outdoor bath... just for two. (Affection ♥60+, at night)',
      ],
    },
    r_tsunade2: {
      title: 'The Slug Princess\'s Secret (Tsunade)', type: 'romance', char: 'tsunade',
      stages: [
        'Tsunade has been working late in the hospital\'s research wing. Visit her there after dark.',
        'Tsunade wants a rematch in her private room at the Moonrise Inn: her game, her rules. (evening or night)',
        'A note in Tsunade\'s hand: "The old spring in the grotto north of the forest pond. Tonight. Come alone."',
        'Tsunade invited you to dinner at her house, next to the Moonrise Inn. (evening or night)',
      ],
    },
  };
  for (const id in NR.QUESTS) NR.QUESTS[id].id = id;

  NR.BOND_RANKS = [
    [0, 'Acquaintance'],
    [15, 'Friend'],
    [35, 'Close'],
    [60, 'Special'],
    [85, 'Beloved'],
  ];
  NR.bondRank = (v) => {
    let r = NR.BOND_RANKS[0][1];
    for (const [t, n] of NR.BOND_RANKS) if (v >= t) r = n;
    return r;
  };
})();
