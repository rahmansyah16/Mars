// Shared script helpers: romance menus and markers, shops, rest/save, villager chatter.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const S = NR.S;
  const SC = NR.SCRIPTS;
  const G = () => NR.game;

  // Chapter in which each romance story can begin (Sakura is busy with the first mission).
  NR.ROMANCE_FROM = { sakura: 2 };
  // Which romance step is available right now for a character? (null if none)
  NR.romanceStep = function (c) {
    const q = 'r_' + c;
    const st = G().qStage(q);
    if (G().qDone(q)) return null;
    const a = G().aff(c);
    if (st < 0) return S.ch() >= (NR.ROMANCE_FROM[c] || 1) ? 'start' : null;
    if (st === 0) return 'step1';
    if (st === 1) return a >= 25 ? 'step2' : null;
    if (st === 2) return a >= 60 ? 'step3' : null;
    return null;
  };
  NR.romanceMark = function (c) {
    const s = NR.romanceStep(c);
    if (s === 'start') return 'heart';
    return null;
  };

  // ---------- romance talk menu ----------
  // opts: {greet(E), chat(E) lines, quest(E) -> handled?, questLabel}
  NR.romanceTalk = async function (E, c, o = {}) {
    const ch = NR.CHARS[c];
    if (o.greet) await o.greet(E);
    for (;;) {
      const opts = [];
      const qItem = o.questOption && o.questOption();
      if (qItem) opts.push({ label: qItem.label, heart: !!qItem.heart, key: 'quest' });
      opts.push({ label: 'Chat', key: 'chat' }, { label: 'Give a gift', key: 'gift' });
      if (o.extra) for (const x of o.extra()) opts.push(x);
      opts.push({ label: 'See you later', key: 'bye' });
      const i = await E.choice(opts, { cancel: opts.length - 1 });
      const k = opts[i].key;
      if (k === 'bye') {
        if (o.bye) await o.bye(E);
        return;
      }
      if (k === 'quest') {
        await qItem.run(E);
        return;
      }
      if (k === 'chat') {
        await NR.romanceChat(E, c, o.chat);
        continue;
      }
      if (k === 'gift') {
        await NR.giveGift(E, c);
        continue;
      }
      const x = opts[i];
      if (x.run) {
        const stop = await x.run(E);
        if (stop !== false) return;
      }
    }
  };

  NR.romanceChat = async function (E, c, lines) {
    const st = G().state;
    const a = G().aff(c);
    const tier = a >= 60 ? 2 : a >= 25 ? 1 : 0;
    const pool = (lines && lines[tier]) || (lines && lines[0]) || [['happy', 'It\'s nice to see you.']];
    const [emo, text, emo2, text2] = U.pick(pool);
    await E.say(c, emo, text);
    if (text2) await E.say(c, emo2 || emo, text2);
    const key = c + '_chat';
    if (st.talked[key] !== st.day) {
      st.talked[key] = st.day;
      E.aff(c, 2);
    }
  };

  NR.giveGift = async function (E, c) {
    const st = G().state;
    if (st.giftDay[c] === st.day) {
      await E.say(c, 'happy', 'You already gave me something today. Save some for tomorrow, okay?');
      return;
    }
    const item = await E.gift(c);
    if (!item) return;
    const pref = NR.GIFTS[c] || { love: [], like: [] };
    E.take(item, 1);
    st.giftDay[c] = st.day;
    const it = NR.ITEMS[item];
    const reactions = NR.GIFT_LINES[c] || {};
    if (pref.love.includes(item)) {
      G().vr('giftknown_' + c, 1);
      await E.say(c, 'love', (reactions.love || 'Oh! This is my absolute favourite! How did you know?') + '');
      E.aff(c, 10);
    } else if (pref.like.includes(item)) {
      await E.say(c, 'happy', reactions.like || `${it.name}? That's really sweet of you. Thank you.`);
      E.aff(c, 5);
    } else {
      await E.say(c, 'neutral', reactions.meh || `Oh, ${it.name}. Thanks, Naruto.`);
      E.aff(c, 2);
    }
  };

  NR.GIFT_LINES = {
    hinata: { love: 'Z-zenzai... You remembered what I like? N-Naruto-kun... thank you. I\'ll treasure the memory, even after I eat it.', like: 'For me? You\'re so kind... thank you.' },
    sakura: { love: 'Anmitsu! Oh, you absolute sweetheart — don\'t tell anyone I squealed.', like: 'Aww, look at you being thoughtful. Thanks!' },
    ino: { love: 'Now THIS is a man with taste. I might have to keep you around.', like: 'Cute. You\'re learning, Naruto.' },
    tenten: { love: 'Peach buns! Okay, you officially get the friends-and-family discount. Maybe more.', like: 'Hey, thanks! That\'s really nice.' },
    temari: { love: 'Roasted chestnuts... just like the ones back home. Hmph. Fine. You win this round.', like: 'Not bad. You have better taste than a certain lazy genius.' },
    tsunade: { love: 'Now we\'re talking! Premium stuff, too. Brat, you might be my favourite person in this village.', like: 'Hoh? Trying to butter me up? ...It\'s working.' },
  };

  // ---------- shops & services ----------
  NR.SHOPS = {
    ichiraku: ['ramen_miso', 'ramen_pork'],
    store: ['soldier_pill', 'chakra_pill', 'antidote', 'med_scroll', 'tag', 'smoke', 'gift_cinnamon', 'gift_chestnut', 'gift_manju'],
    dango: ['dango', 'gift_zenzai', 'gift_anmitsu', 'gift_pudding'],
    flowers: ['gift_bouquet', 'gift_perfume'],
    armory: ['kunai_steel', 'chakra_blade', 'flak_vest', 'silk_jacket', 'medic_coat', 'tag', 'smoke'],
    inn: ['gift_sake', 'dango'],
  };

  SC.save_point = async (E) => {
    await E.narrate('A sealing scroll for recording your progress.');
    const i = await E.choice(['Save the game', 'Not now']);
    if (i === 0) await E.saveMenu();
  };

  SC.home_bed = async (E) => {
    if (!S.f('intro_done')) return;
    const st = G().state;
    if (S.qs('main2') === 2) {
      await E.think('naruto', 'neutral', 'Tsunade said she\'d have answers in the morning. Guess I should get some sleep...');
      const i = await E.choice(['Sleep until morning', 'Not yet (enjoy the evening)']);
      if (i === 0) {
        await E.rest('morning');
        E.quest('main2', 3);
        await E.think('naruto', 'happy', 'Morning! Time to meet everyone at the Hokage Tower. Believe it!');
      }
      return;
    }
    if (S.qs('main4') === 2 && S.f('festival_done')) {
      const i = await E.choice(['Sleep until dawn (depart for Uzushio)', 'Not yet']);
      if (i === 0) {
        await E.rest('morning');
        E.quest('main4', 3);
        await E.think('naruto', 'serious', 'Dawn. The others will be waiting at the south gate.');
      }
      return;
    }
    if (S.qs('main4') === 1 || S.qs('main4') === 2) {
      await E.think('naruto', 'neutral', 'I can\'t sleep yet. There are people I want to see first.');
      return;
    }
    const opts = ['Sleep until morning', 'Rest until evening', 'Rest until night', 'Cancel'];
    const i = await E.choice(opts, { cancel: 3 });
    if (i === 3) return;
    const target = ['morning', 'evening', 'night'][i];
    if (target === 'evening' && (st.time === 'evening' || st.time === 'night')) return E.think('naruto', 'neutral', 'It\'s already evening.');
    if (target === 'night' && st.time === 'night') return E.think('naruto', 'neutral', 'It\'s already night.');
    await E.rest(target);
    await E.narrate(target === 'morning' ? `Day ${st.day}. A fresh morning in Konoha.` : target === 'evening' ? 'The sun sinks behind the Hokage Monument.' : 'Night falls over the village. The lanterns flicker on.');
  };
  SC.home_table = async (E) => {
    await E.think('naruto', 'happy', 'A tower of empty instant ramen cups. Breakfast, lunch and dinner of champions.');
    if (S.ch() >= 1 && !S.f('found_pills')) {
      E.flag('found_pills', true);
      await E.narrate('Hidden under the cups...');
      E.give('soldier_pill', 2);
    }
  };
  SC.home_fridge = async (E) => {
    await E.think('naruto', 'neutral', 'Milk... expired. Milk... also expired. Why do I keep buying milk?');
  };
  SC.home_shelf = async (E) => {
    await E.think('naruto', 'happy', 'Pervy Sage\'s books. "Tale of the Utterly Gutsy Shinobi" — the one he named his hero after me. I still read it when I miss him.');
  };
  SC.home_exit = async (E) => {
    if (!S.f('intro_done')) return;
    NR.audio.sfx('door');
    await E.transfer('konoha', 2, 11, 'down');
  };

  // Rest at the inn for a fee (full heal, time passes to evening/night)
  NR.innRest = async function (E) {
    const i = await E.choice(['Rest in a guest room (80 ryo, full recovery)', 'No thanks']);
    if (i !== 0) return;
    if (G().state.ryo < 80) return E.say('okami', 'neutral', 'Oh dear, you\'re a little short. Come back when you have 80 ryo, dear.');
    G().addRyo(-80);
    await E.fadeOut(500);
    G().fullHeal();
    await E.wait(400);
    await E.fadeIn(500);
    await E.say('okami', 'happy', 'All rested? You look ten years younger. Well — not that you needed it.');
  };

  // ---------- villagers ----------
  const VLINES = {
    0: ['Good morning! Lovely day, isn\'t it?'],
    1: [
      'Did you hear? Three chunin went missing in the Outer Forest. Scary...',
      'Naruto! My kid says you\'re going to be Hokage soon. Is it true?',
      'Ichiraku\'s new pork broth is incredible. Don\'t tell Teuchi I said so, his head will get bigger than his pot.',
      'The hot springs inn got renovated. My husband won\'t stop talking about the outdoor bath.',
      'Kakashi-sama was late to his own council meeting again. Some things never change.',
    ],
    2: [
      'People say a masked man was seen near the forest. What do they want with our village?',
      'Lady Tsunade won at the dice hall last week. Once. She\'s been bragging ever since.',
      'Sakura-sensei stayed at the hospital all night again. That girl works too hard.',
      'You look tired, Naruto. Have you been eating anything besides ramen?',
    ],
    3: [
      'Be careful out there. The whole village is counting on you.',
      'My grandfather used to say the Uzumaki clan could seal away the moon itself.',
    ],
    4: [
      'The Lantern Festival is tonight! Everyone\'s going to be in the square.',
      'We made lanterns for your team. For luck! Come back safe, all of you.',
      'I heard Lady Hinata bought a new yukata... just saying!',
    ],
    5: ['Our hero is back! Seventh Hokage! Seventh Hokage!', 'I knew you could do it. I told everyone, since you were a little brat painting the monument.'],
  };
  SC.villager_talk = async (E, self) => {
    const ch = Math.min(5, S.ch());
    const pool = (VLINES[ch] || VLINES[1]).concat(ch > 1 ? VLINES[1].slice(0, 2) : []);
    const line = pool[(U.strSeed(self ? self.key : 'x') + G().state.day) % pool.length];
    await E.say(self ? self.char : 'vm1', 'happy', line, { name: 'Villager' });
  };
  SC.festival_talk = async (E, self) => {
    const lines = {
      kiba: ['kiba', 'happy', 'Akamaru ate four candy apples and a paper lantern. Best festival ever!'],
      lee: ['lee', 'happy', 'The fire of youth burns brightest under festival lanterns! Naruto, let us race to the fireworks!'],
      choji: ['choji', 'happy', 'I\'m on my third lap of the food stalls. The grilled squid is life-changing.'],
      shikamaru: ['shikamaru', 'neutral', 'Festivals are such a drag... but I guess tonight\'s alright. Go on, someone\'s waiting for you.'],
    };
    const l = self && lines[self.char];
    if (l) await E.say(l[0], l[1], l[2]);
    else await E.say(self ? self.char : 'vf1', 'happy', 'Happy festival! The fireworks start soon!', { name: 'Villager' });
  };
})();
