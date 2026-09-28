// Character database. Setting: an alternate timeline five years after the Fourth Great
// Ninja War. Every character in this game is an adult; ages are listed below.
(function () {
  'use strict';
  const NR = window.NR;

  // Emotion / situation tags used by scripts to pick portraits. Aliases let file names in
  // English or Indonesian match automatically (e.g. "hinata_malu.png" -> blush).
  NR.EMOTIONS = {
    neutral: ['neutral', 'normal', 'default', 'idle', 'biasa', 'datar', 'calm', 'tenang', 'base', 'main', 'portrait', 'face'],
    happy: ['happy', 'smile', 'smiling', 'joy', 'laugh', 'grin', 'cheerful', 'senang', 'senyum', 'bahagia', 'gembira', 'ketawa', 'tertawa'],
    sad: ['sad', 'cry', 'crying', 'tears', 'upset', 'sedih', 'nangis', 'menangis'],
    angry: ['angry', 'mad', 'rage', 'annoyed', 'furious', 'marah', 'kesal', 'emosi'],
    surprised: ['surprised', 'surprise', 'shock', 'shocked', 'wow', 'kaget', 'terkejut'],
    blush: ['blush', 'blushing', 'shy', 'embarrassed', 'malu', 'tersipu', 'merah'],
    flirty: ['flirty', 'flirt', 'tease', 'teasing', 'wink', 'seductive', 'sexy', 'sultry', 'genit', 'goda', 'menggoda', 'nakal'],
    love: ['love', 'loving', 'romance', 'romantic', 'kiss', 'date', 'cinta', 'sayang', 'romantis', 'mesra', 'intimate'],
    serious: ['serious', 'determined', 'focus', 'cool', 'serius', 'tegas', 'fokus'],
    hurt: ['hurt', 'injured', 'pain', 'wounded', 'tired', 'luka', 'sakit', 'terluka', 'lelah', 'capek'],
    battle: ['battle', 'fight', 'fighting', 'attack', 'combat', 'action', 'jutsu', 'tarung', 'bertarung', 'serang', 'perang'],
  };
  // Outfit / scene tags that combine with emotions ("tsunade_onsen_flirty.png").
  NR.OUTFITS = {
    onsen: ['onsen', 'bath', 'towel', 'hotspring', 'spring', 'swimsuit', 'bikini', 'handuk', 'mandi', 'renang', 'pantai', 'beach'],
    casual: ['casual', 'date', 'civilian', 'kencan', 'santai'],
    kimono: ['kimono', 'yukata', 'festival', 'matsuri', 'dress', 'gaun', 'pesta'],
    night: ['night', 'bed', 'sleep', 'pajama', 'lingerie', 'robe', 'malam', 'tidur', 'kamar'],
    // Tsunade without her Transformation Jutsu
    aged: ['aged', 'old', 'elder', 'granny', 'tua', 'nenek'],
  };
  // Fallback chain when a portrait for the requested emotion does not exist.
  NR.EMO_FALLBACK = {
    happy: ['neutral'],
    sad: ['hurt', 'neutral'],
    angry: ['serious', 'neutral'],
    surprised: ['blush', 'neutral'],
    blush: ['love', 'happy', 'neutral'],
    flirty: ['love', 'blush', 'happy', 'neutral'],
    love: ['blush', 'flirty', 'happy', 'neutral'],
    serious: ['battle', 'neutral'],
    hurt: ['sad', 'serious', 'neutral'],
    battle: ['serious', 'angry', 'neutral'],
    neutral: ['happy'],
  };

  const C = (NR.CHARS = {
    naruto: {
      name: 'Naruto', full: 'Naruto Uzumaki', age: 22, gender: 'm', color: '#f28c28', voice: 1.0,
      title: 'Jonin of the Leaf · Hero of the War',
      aliases: ['naruto', 'uzumaki'],
      bio: 'The loudest ninja in Konoha grew into its hero. At 22 he is the favourite to become the Seventh Hokage — if he can stop eating ramen long enough to do the paperwork.',
      look: {
        build: 'm', skin: '#f5cfa8', eyes: '#2f7fe0',
        hair: { style: 'spiky', color: '#f5c93a' },
        outfit: 'jacket', top: '#f07f1e', top2: '#23232d', sleeve: '#f07f1e', bottom: '#f07f1e', shoes: '#26345a',
        acc: ['headband', 'whiskers', 'necklace'],
      },
    },
    hinata: {
      name: 'Hinata', full: 'Hinata Hyuga', age: 22, gender: 'f', color: '#9d8cd6', voice: 1.25, romance: true,
      title: 'Heiress of the Hyuga Clan',
      aliases: ['hinata', 'hyuga', 'hyuuga'],
      bio: 'Gentle, fiercely loyal and far stronger than she lets on. Hinata has loved Naruto since the Academy days — and she is done waiting quietly.',
      look: {
        build: 'f', skin: '#f9e2d2', eyes: '#d8d2ee', eyeStyle: 'pale',
        hair: { style: 'hime', color: '#2b2f66' },
        outfit: 'jacket', top: '#bfb0de', top2: '#f0e8f6', sleeve: '#bfb0de', bottom: '#27305c', shoes: '#26345a',
        acc: ['headband_neck'],
      },
    },
    sakura: {
      name: 'Sakura', full: 'Sakura Haruno', age: 22, gender: 'f', color: '#f06f9c', voice: 1.3, romance: true,
      title: 'Chief Medical Ninja',
      aliases: ['sakura', 'haruno'],
      bio: 'Tsunade\'s successor at Konoha Hospital. Brilliant, short-tempered and terrifyingly strong, Sakura works too hard and admits her feelings too rarely.',
      look: {
        build: 'f', skin: '#f8dcc8', eyes: '#46b36a',
        hair: { style: 'bob', color: '#f3a2c0' },
        outfit: 'qipao', top: '#c8302e', top2: '#f4f0ea', sleeve: null, bottom: '#35303f', shoes: '#2d2d3a',
        acc: ['diamond', 'gloves', 'circle_back'],
      },
    },
    ino: {
      name: 'Ino', full: 'Ino Yamanaka', age: 22, gender: 'f', color: '#b67fe0', voice: 1.3, romance: true,
      title: 'Yamanaka Flower Shop · Sensory Division',
      aliases: ['ino', 'yamanaka'],
      bio: 'Runs the family flower shop by day and the Sensory Division\'s toughest interrogations by night. Confident, stylish and a shameless flirt.',
      look: {
        build: 'f', skin: '#f8dfcd', eyes: '#8ecfee', eyeStyle: 'light',
        hair: { style: 'ponytail', color: '#f4e3a0' },
        outfit: 'crop', top: '#7a4fb0', top2: '#6a4298', sleeve: null, bottom: '#6a4298', shoes: '#2d2d3a',
        acc: ['earrings', 'armwarmers'],
      },
    },
    tenten: {
      name: 'Tenten', full: 'Tenten', age: 23, gender: 'f', color: '#e8719a', voice: 1.2, romance: true,
      title: 'Weapons Mistress · Shop Owner',
      aliases: ['tenten', 'ten ten'],
      bio: 'Konoha\'s weapons specialist now runs her own armory. She never misses a target, and she is tired of being the friend everybody forgets to ask out.',
      look: {
        build: 'f', skin: '#f6d6bc', eyes: '#7a4b2c',
        hair: { style: 'buns', color: '#5a3826' },
        outfit: 'qipao', bottomType: 'pants', top: '#ee93ae', top2: '#c43a55', sleeve: null, bottom: '#2c3048', shoes: '#26345a',
        acc: ['headband', 'scroll_back'],
      },
    },
    temari: {
      name: 'Temari', full: 'Temari of the Sand', age: 25, gender: 'f', color: '#d8b24a', voice: 1.12, romance: true,
      title: 'Suna Ambassador to Konoha',
      aliases: ['temari'],
      bio: 'The Kazekage\'s older sister and Suna\'s envoy in the Leaf. Blunt, proud and fond of winning — at wind jutsu, at negotiations, and at teasing.',
      look: {
        build: 'f', skin: '#f3d0ae', eyes: '#2f8b7c',
        hair: { style: 'quad', color: '#e5c265' },
        outfit: 'kimono', bottomType: 'dress_short', top: '#2b2331', top2: '#c43b3b', sleeve: '#2b2331', bottom: '#2b2331', shoes: '#26262e',
        acc: ['headband_sand', 'fan'],
      },
    },
    tsunade: {
      name: 'Tsunade', full: 'Tsunade Senju', age: 56, gender: 'f', color: '#7fb069', voice: 1.05, romance: true,
      title: 'Fifth Hokage (Retired) · Legendary Sannin',
      aliases: ['tsunade', 'senju', 'godaime'],
      bio: 'The retired Fifth Hokage, still looking twenty-five thanks to her jutsu. Gambles badly, drinks well and hides a lonely heart behind a legendary temper.',
      look: {
        build: 'f', curvy: true, skin: '#f8dcc6', eyes: '#b9853c',
        hair: { style: 'twintails', color: '#f1d27b' },
        outfit: 'haori', top: '#8f929b', top2: '#5f8f4d', sleeve: '#5f8f4d', bottom: '#384872', shoes: '#2d2d3a',
        acc: ['diamond'],
      },
    },
    shizune: {
      name: 'Shizune', full: 'Shizune', age: 36, gender: 'f', color: '#6d6d8a', voice: 1.15,
      title: 'Hokage Office Chief of Staff',
      aliases: ['shizune'],
      bio: 'Tsunade\'s long-suffering assistant, now keeping Kakashi\'s office running. Carries poison needles and a very judgmental pig.',
      look: {
        build: 'f', skin: '#f6dac8', eyes: '#3a2c2a',
        hair: { style: 'short', color: '#1f1c24' },
        outfit: 'kimono', top: '#2a2832', top2: '#e8e2d8', sleeve: '#2a2832', bottom: '#2a2832', shoes: '#26262e',
        acc: [],
      },
    },
    kakashi: {
      name: 'Kakashi', full: 'Kakashi Hatake', age: 36, gender: 'm', color: '#9aa7b8', voice: 0.82,
      title: 'Sixth Hokage',
      aliases: ['kakashi', 'hatake', 'rokudaime'],
      bio: 'Naruto\'s old sensei and the reluctant Sixth Hokage. Always late, always reading, always two steps ahead.',
      look: {
        build: 'm', skin: '#f2d6bd', eyes: '#3a3a44',
        hair: { style: 'kakashi', color: '#d8dde4' },
        outfit: 'robe', top: '#f3f3f1', top2: '#d9442b', sleeve: '#27304d', bottom: '#27304d', shoes: '#26345a',
        acc: ['mask', 'headband', 'scar_eye'],
      },
    },
    sasuke: {
      name: 'Sasuke', full: 'Sasuke Uchiha', age: 22, gender: 'm', color: '#5b5f9e', voice: 0.85,
      title: 'Wandering Shinobi',
      aliases: ['sasuke', 'uchiha'],
      bio: 'Naruto\'s rival and brother in all but blood, wandering the lands to atone. He shows up when it matters most.',
      look: {
        build: 'm', skin: '#f1dac8', eyes: '#2a2530',
        hair: { style: 'sasuke', color: '#1c2032' },
        outfit: 'cloak', top: '#3b3a47', top2: '#6c5a8e', sleeve: '#3b3a47', bottom: '#2b2a33', shoes: '#26262e',
        acc: ['sword'],
      },
    },
    shikamaru: {
      name: 'Shikamaru', full: 'Shikamaru Nara', age: 22, gender: 'm', color: '#6b8f4e', voice: 0.9,
      title: 'Hokage\'s Advisor',
      aliases: ['shikamaru', 'nara'],
      bio: 'The laziest genius alive. Advises the Hokage, plans everything, and complains about all of it.',
      look: {
        build: 'm', skin: '#f0d1b2', eyes: '#3b2a1c',
        hair: { style: 'pineapple', color: '#2a2622' },
        outfit: 'vest', top: '#6a8452', top2: '#24252c', sleeve: '#24252c', bottom: '#24252c', shoes: '#26345a',
        acc: ['earrings'],
      },
    },
    lee: {
      name: 'Rock Lee', full: 'Rock Lee', age: 23, gender: 'm', color: '#3f9a3a', voice: 1.05,
      title: 'Taijutsu Master',
      aliases: ['lee', 'rocklee', 'rock'],
      bio: 'Youth personified. Rock Lee will challenge you to a fight, a race, and a push-up contest before breakfast.',
      look: {
        build: 'm', skin: '#f2d2b4', eyes: '#141418', eyeStyle: 'round',
        hair: { style: 'bowl', color: '#131318' }, brows: 'thick',
        outfit: 'vest', top: '#6a8452', top2: '#3f8f3a', sleeve: '#3f8f3a', bottom: '#3f8f3a', shoes: '#f07f1e',
        acc: ['headband_waist', 'legwarmers'],
      },
    },
    kiba: {
      name: 'Kiba', full: 'Kiba Inuzuka', age: 22, gender: 'm', color: '#9c6b3f', voice: 0.95,
      title: 'Tracker of the Inuzuka Clan',
      aliases: ['kiba', 'inuzuka'],
      bio: 'Wild, loud, and never seen without his giant partner Akamaru.',
      look: {
        build: 'm', skin: '#eac6a0', eyes: '#6b3a1e', eyeStyle: 'slit',
        hair: { style: 'messy', color: '#5a3a26' },
        outfit: 'jacket', top: '#6e6c76', top2: '#e8e2d6', sleeve: '#6e6c76', bottom: '#2c2c36', shoes: '#26345a',
        acc: ['fangs', 'headband', 'fur'],
      },
    },
    choji: {
      name: 'Choji', full: 'Choji Akimichi', age: 22, gender: 'm', color: '#b7312c', voice: 0.88,
      title: 'Akimichi Clan Heir',
      aliases: ['choji', 'chouji', 'akimichi'],
      bio: 'Big-hearted, big-appetite, and the best barbecue companion in the Land of Fire.',
      look: {
        build: 'big', skin: '#f0cfae', eyes: '#3b2a1c',
        hair: { style: 'wild_long', color: '#a4532d' },
        outfit: 'armor', top: '#b7312c', top2: '#e1c26a', sleeve: '#2c2c34', bottom: '#2c2c34', shoes: '#26345a',
        acc: ['swirls', 'headband'],
      },
    },
    shino: {
      name: 'Shino', full: 'Shino Aburame', age: 22, gender: 'm', color: '#4c5a4a', voice: 0.8,
      title: 'Academy Instructor',
      aliases: ['shino', 'aburame'],
      bio: 'Quiet, logical and full of insects. Nobody is sure whether he is smiling behind the collar.',
      look: {
        build: 'm', skin: '#eed3bb', eyes: '#222',
        hair: { style: 'hood', color: '#4c5a4a' },
        outfit: 'coat', top: '#566654', top2: '#3d4a3b', sleeve: '#566654', bottom: '#2e3230', shoes: '#26262e',
        acc: ['glasses'],
      },
    },
    sai: {
      name: 'Sai', full: 'Sai Yamanaka', age: 22, gender: 'm', color: '#555566', voice: 0.95,
      title: 'Ink Artist · ANBU',
      aliases: ['sai'],
      bio: 'Former Root operative who still learns emotions from books. Brutally honest, usually by accident.',
      look: {
        build: 'm', skin: '#f6e8e0', eyes: '#1b1b22',
        hair: { style: 'neat', color: '#1b1b22' },
        outfit: 'jacket', top: '#23232b', top2: '#b63232', sleeve: '#23232b', bottom: '#23232b', shoes: '#26262e',
        acc: ['sword'],
      },
    },
    iruka: {
      name: 'Iruka', full: 'Iruka Umino', age: 30, gender: 'm', color: '#6a8452', voice: 0.95,
      title: 'Academy Headmaster',
      aliases: ['iruka', 'umino'],
      bio: 'The first person who ever believed in Naruto. Still treats him to ramen — and still lectures him.',
      look: {
        build: 'm', skin: '#d9ac84', eyes: '#3b2a1c',
        hair: { style: 'topknot', color: '#3f281a' },
        outfit: 'vest', top: '#6a8452', top2: '#27304d', sleeve: '#27304d', bottom: '#27304d', shoes: '#26345a',
        acc: ['headband', 'scar_nose'],
      },
    },
    gaara: {
      name: 'Gaara', full: 'Gaara of the Sand', age: 22, gender: 'm', color: '#b3322b', voice: 0.8,
      title: 'Fifth Kazekage',
      aliases: ['gaara', 'kazekage'],
      bio: 'Temari\'s younger brother and Naruto\'s closest friend beyond the Leaf. Speaks softly, carries a lot of sand.',
      look: {
        build: 'm', skin: '#f2d9c6', eyes: '#72c6bb', eyeStyle: 'light',
        hair: { style: 'short_spiky', color: '#b3322b' }, brows: 'none',
        outfit: 'coat', top: '#6a2d2d', top2: '#b9a37a', sleeve: '#6a2d2d', bottom: '#4a2222', shoes: '#26262e',
        acc: ['gourd', 'lovemark', 'eyerings'],
      },
    },
    teuchi: {
      name: 'Teuchi', full: 'Teuchi', age: 58, gender: 'm', color: '#c9a36b', voice: 0.85,
      title: 'Owner of Ichiraku Ramen',
      aliases: ['teuchi', 'ichiraku', 'oldman'],
      bio: 'The greatest ramen chef in the world, according to one very loyal customer.',
      look: {
        build: 'm', skin: '#e9c8a4', eyes: '#3b2a1c', eyeStyle: 'closed',
        hair: { style: 'chef', color: '#9a9a9a' },
        outfit: 'chef', top: '#f3f1ea', top2: '#3a6ea5', sleeve: '#f3f1ea', bottom: '#3a3a44', shoes: '#26262e',
        acc: [],
      },
    },
    ayame: {
      name: 'Ayame', full: 'Ayame', age: 26, gender: 'f', color: '#c97a5a', voice: 1.22,
      title: 'Ichiraku Ramen',
      aliases: ['ayame'],
      bio: 'Teuchi\'s daughter, the other half of Ichiraku. Knows everyone\'s order and everyone\'s gossip.',
      look: {
        build: 'f', skin: '#f4d4b8', eyes: '#5a3622',
        hair: { style: 'bandana', color: '#4a2a1a' },
        outfit: 'chef', top: '#f3f1ea', top2: '#3a6ea5', sleeve: null, bottom: '#3a6ea5', shoes: '#26262e',
        acc: [],
      },
    },
    anko: {
      name: 'Anko', full: 'Anko Mitarashi', age: 29, gender: 'f', color: '#8a6fb0', voice: 1.12,
      title: 'Special Jonin · Dango Enthusiast',
      aliases: ['anko', 'mitarashi'],
      bio: 'Proctor, interrogator, and owner of the loudest laugh at the dango stand.',
      look: {
        build: 'f', skin: '#f3d3b6', eyes: '#8a6a4a',
        hair: { style: 'anko', color: '#4b3f6b' },
        outfit: 'coat', top: '#bca079', top2: '#c9653a', sleeve: '#bca079', bottom: '#c9653a', shoes: '#2d2d3a',
        acc: ['headband'],
      },
    },
    izumo: {
      name: 'Izumo', full: 'Izumo Kamizuki', age: 32, gender: 'm', color: '#6a8452', voice: 0.9,
      title: 'Gate Guard', aliases: ['izumo'],
      look: {
        build: 'm', skin: '#efcfb0', eyes: '#3b2a1c',
        hair: { style: 'side_long', color: '#3f2a1f' },
        outfit: 'vest', top: '#6a8452', top2: '#27304d', sleeve: '#27304d', bottom: '#27304d', shoes: '#26345a',
        acc: ['bandana'],
      },
    },
    kotetsu: {
      name: 'Kotetsu', full: 'Kotetsu Hagane', age: 32, gender: 'm', color: '#6a8452', voice: 0.92,
      title: 'Gate Guard', aliases: ['kotetsu'],
      look: {
        build: 'm', skin: '#efcfb0', eyes: '#3b2a1c',
        hair: { style: 'messy', color: '#1d1d24' },
        outfit: 'vest', top: '#6a8452', top2: '#27304d', sleeve: '#27304d', bottom: '#27304d', shoes: '#26345a',
        acc: ['headband', 'bandage_nose'],
      },
    },
    okami: {
      name: 'Okami', full: 'Okami-san', age: 48, gender: 'f', color: '#b0707a', voice: 1.05,
      title: 'Hot Spring Innkeeper', aliases: ['okami', 'innkeeper'],
      look: {
        build: 'f', skin: '#f3d6be', eyes: '#3b2a1c', eyeStyle: 'closed',
        hair: { style: 'bun', color: '#2a2024' },
        outfit: 'kimono', top: '#9a5a6a', top2: '#e8d6a8', sleeve: '#9a5a6a', bottom: '#9a5a6a', shoes: '#3a2a2a',
        acc: [],
      },
    },
    merchant: {
      name: 'Shopkeeper', full: 'General Store Clerk', age: 41, gender: 'm', color: '#8a7a5a', voice: 0.95,
      title: 'Konoha General Store', aliases: ['merchant', 'shopkeeper'],
      look: {
        build: 'm', skin: '#efc9a6', eyes: '#3b2a1c',
        hair: { style: 'short', color: '#4a3526' },
        outfit: 'chef', top: '#6e7f95', top2: '#b9854a', sleeve: '#6e7f95', bottom: '#3a3a44', shoes: '#26262e',
        acc: [],
      },
    },
    kurama: {
      name: 'Kurama', full: 'Kurama, the Nine-Tailed Fox', age: 1000, gender: 'm', color: '#e2552b', voice: 0.6,
      title: 'Nine-Tailed Fox · Naruto\'s Partner',
      aliases: ['kurama', 'kyuubi', 'kyubi', 'ninetails', 'nine tails', 'fox'],
      special: 'fox',
      look: { build: 'fox', skin: '#e2552b', eyes: '#f6c343', hair: { style: 'none', color: '#e2552b' }, outfit: 'none', top: '#e2552b', acc: [] },
    },
    akamaru: {
      name: 'Akamaru', full: 'Akamaru', age: 23, gender: 'm', color: '#e8e2d6', voice: 0.7,
      title: 'Ninja Hound', aliases: ['akamaru'],
      special: 'dog',
      look: { build: 'dog', skin: '#f2eee6', eyes: '#222', hair: { style: 'none', color: '#f2eee6' }, outfit: 'none', top: '#f2eee6', acc: [] },
    },

    // ----- Hollow Moon (villains) -----
    kagen: {
      name: 'Kagen', full: 'Kagen of the Hollow Moon', age: 41, gender: 'm', color: '#7a5ab8', voice: 0.72,
      title: 'Leader of the Hollow Moon',
      aliases: ['kagen'],
      bio: 'A former Root operative who believes chakra itself is the source of every war.',
      look: {
        build: 'm', skin: '#e9d6cc', eyes: '#b58cff', eyeStyle: 'light',
        hair: { style: 'long_white', color: '#e8e6f0' },
        outfit: 'cloak', top: '#1f1a2c', top2: '#7a5ab8', sleeve: '#1f1a2c', bottom: '#1a1624', shoes: '#141018',
        acc: ['seal_marks'],
      },
    },
    mizuchi: {
      name: 'Mizuchi', full: 'Mizuchi the Serpent', age: 34, gender: 'f', color: '#3aa39a', voice: 1.0,
      title: 'Hollow Moon Lieutenant',
      aliases: ['mizuchi'],
      look: {
        build: 'f', skin: '#e6e0da', eyes: '#e6c23a', eyeStyle: 'slit',
        hair: { style: 'long_flow', color: '#2f8f89' },
        outfit: 'kimono', top: '#43305a', top2: '#2f8f89', sleeve: '#43305a', bottom: '#43305a', shoes: '#1e1a24',
        acc: [],
      },
    },
    nue: {
      name: 'Nue', full: 'Nue, the Masked Rogue', age: 38, gender: 'm', color: '#8a3a3a', voice: 0.78,
      title: 'Hollow Moon Agent', aliases: ['nue'],
      look: {
        build: 'm', skin: '#e9d6cc', eyes: '#d23a3a',
        hair: { style: 'masked', color: '#2a2230' },
        outfit: 'cloak', top: '#2a2230', top2: '#8a3a3a', sleeve: '#2a2230', bottom: '#1c1822', shoes: '#141018',
        acc: [],
      },
    },
    hm_soldier: {
      name: 'Hollow Moon', full: 'Hollow Moon Soldier', age: 30, gender: 'm', color: '#6a5a8a', voice: 0.85,
      look: {
        build: 'm', skin: '#e9d6cc', eyes: '#222',
        hair: { style: 'masked', color: '#221e2c' },
        outfit: 'cloak', top: '#26222f', top2: '#6a5a8a', sleeve: '#26222f', bottom: '#1c1822', shoes: '#141018',
        acc: [],
      },
    },
    hm_elite: {
      name: 'Hollow Moon', full: 'Hollow Moon Elite', age: 33, gender: 'f', color: '#a04a6a', voice: 1.0,
      look: {
        build: 'f', skin: '#e9d6cc', eyes: '#222',
        hair: { style: 'masked', color: '#2a1e28' },
        outfit: 'cloak', top: '#2a1e28', top2: '#b0405a', sleeve: '#2a1e28', bottom: '#1c1822', shoes: '#141018',
        acc: [],
      },
    },
    rogue: {
      name: 'Rogue Ninja', full: 'Rogue Ninja', age: 30, gender: 'm', color: '#777', voice: 0.9,
      look: {
        build: 'm', skin: '#e6c3a0', eyes: '#222',
        hair: { style: 'messy', color: '#3a3430' },
        outfit: 'vest', top: '#5c5a52', top2: '#3a3a40', sleeve: '#3a3a40', bottom: '#3a3a40', shoes: '#26262e',
        acc: ['headband_slashed', 'facecloth'],
      },
    },
    bandit: {
      name: 'Bandit', full: 'Bandit', age: 31, gender: 'm', color: '#8a6a4a', voice: 0.9,
      look: {
        build: 'm', skin: '#d9ad84', eyes: '#222',
        hair: { style: 'short', color: '#2a2018' },
        outfit: 'vest', top: '#7a5a3a', top2: '#4a3a2a', sleeve: null, bottom: '#4a3a2a', shoes: '#2a2018',
        acc: ['bandana'],
      },
    },
    chunin: {
      name: 'Chunin', full: 'Leaf Chunin', age: 27, gender: 'm', color: '#6a8452', voice: 0.95,
      look: {
        build: 'm', skin: '#efcfb0', eyes: '#3b2a1c',
        hair: { style: 'short', color: '#3a2a20' },
        outfit: 'vest', top: '#6a8452', top2: '#27304d', sleeve: '#27304d', bottom: '#27304d', shoes: '#26345a',
        acc: ['headband'],
      },
    },
  });

  // Generic villagers (adults) with varied looks.
  const VILLAGERS = [
    ['vm1', 'm', 'short', '#3a2a20', 'kimono', '#5a7aa0', '#e8d6a8'],
    ['vm2', 'm', 'topknot', '#2a2622', 'kimono', '#8a5a3a', '#d9c49a'],
    ['vm3', 'm', 'bald', '#9a9a9a', 'kimono', '#6a6a7a', '#c9b98a'],
    ['vm4', 'm', 'messy', '#4a3526', 'jacket', '#4d6b52', '#e8e2d6'],
    ['vf1', 'f', 'bun', '#2a2024', 'kimono', '#c86a7a', '#f2e6c8'],
    ['vf2', 'f', 'long', '#5a3826', 'kimono', '#6a9ac8', '#f2e6c8'],
    ['vf3', 'f', 'ponytail_low', '#3a2a20', 'kimono', '#9ac86a', '#f2e6c8'],
    ['vf4', 'f', 'short', '#6a4a36', 'jacket', '#c8905a', '#f2e6c8'],
  ];
  for (const [id, g, hs, hc, of, t, t2] of VILLAGERS) {
    C[id] = {
      name: 'Villager', full: 'Konoha Villager', age: 30, gender: g, color: '#8a8a8a', voice: g === 'f' ? 1.15 : 0.92,
      look: {
        build: g, skin: g === 'f' ? '#f5d8c2' : '#ecc7a2', eyes: '#3b2a1c',
        hair: { style: hs, color: hc }, outfit: of, top: t, top2: t2, sleeve: t, bottom: of === 'kimono' ? t : '#3a3a44', shoes: '#3a2a2a', acc: [],
      },
    };
  }

  for (const id in C) C[id].id = id;
  NR.ROMANCE = ['hinata', 'sakura', 'ino', 'tenten', 'temari', 'tsunade'];
  NR.charName = (id) => (C[id] ? C[id].name : id);
})();
