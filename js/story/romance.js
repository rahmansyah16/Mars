// Romance side-quests. Every character here is an adult. Intimate moments are written as
// suggestive romance that fades to black; with "Mature romance scenes" off in Settings they
// are summarised instead.
(function () {
  'use strict';
  const NR = window.NR;
  const S = NR.S;
  const SC = NR.SCRIPTS;
  const G = () => NR.game;
  const step = (c) => NR.romanceStep(c);

  // helpers
  async function finishStep(E, c, stage, aff, memory, replay) {
    if (replay) return;
    E.aff(c, aff);
    E.unlock(memory);
    if (stage >= 3) E.complete('r_' + c);
    else E.quest('r_' + c, stage);
  }
  async function fadeToBlack(E, text) {
    await E.fadeOut(1400);
    E.clearStage();
    await E.narrate(text);
  }
  async function morningAfter(E, c, charm, lines, replay) {
    await E.backdrop('bedroom_morning', { fade: false });
    E.outfit('night');
    await E.fadeIn(1200);
    for (const [who, emo, text] of lines) await E.say(who, emo, text);
    E.outfit(null);
    if (!replay && charm && !S.has(charm) && !S.f('charm_' + c)) {
      E.flag('charm_' + c, true);
      E.give(charm);
    }
  }
  function summaryNight(c) {
    return `You and ${NR.charName(c)} spend a long, quiet night together, talking until the stars fade. By morning, you both know exactly where your hearts belong.`;
  }

  // ============================== HINATA ==============================
  const HINATA_CHAT = [
    [['blush', 'G-good to see you, Naruto-kun. I was just... um, feeding the ducks.'], ['happy', 'My sister says I talk about you too much. I told her that\'s impossible.'], ['serious', 'I\'ve been practising a new Gentle Fist form. Someday I\'ll show you.']],
    [['happy', 'I made cinnamon rolls this morning. I saved you one... it\'s a little squashed.'], ['blush', 'When you smile like that, I forget what I was going to say.'], ['love', 'Being around you makes me feel brave.']],
    [['love', 'Every morning I wake up and think about you first. Is that silly?'], ['flirty', 'You\'re staring, Naruto-kun... I don\'t mind.'], ['love', 'Wherever you go, I\'ll be right beside you.']],
  ];
  SC.hinata_talk = async (E) => {
    if (await NR.bondVisit(E, 'hinata')) return;
    const s = step('hinata');
    if (s === 'start') {
      await E.say('hinata', 'blush', 'N-Naruto-kun! Good morning... I was just... watching the ducks.');
      await E.say('naruto', 'happy', 'Hey, Hinata! You look like you\'ve been training since dawn.');
      await E.say('hinata', 'serious', 'Every morning. I\'m developing a new technique, but the elders say it\'s too "aggressive" for the heiress of the Hyuga.');
      await E.say('hinata', 'blush', 'Would you... train with me sometime? In the compound garden? I want a partner who won\'t hold back.');
      await E.say('naruto', 'happy', 'Sure thing! I\'ll come by the Hyuga compound — west side of the village, right?');
      await E.say('hinata', 'happy', 'Yes! I... I\'ll be waiting!');
      E.quest('r_hinata', 0);
      E.aff('hinata', 3);
      return;
    }
    await NR.romanceTalk(E, 'hinata', {
      chat: HINATA_CHAT,
      questOption: () =>
        s === 'step1' ? { label: 'About training together', run: (E) => E.say('hinata', 'happy', 'I\'ll be in the Hyuga garden — west of the main street. Come whenever you\'re ready!') }
        : s === 'step2' ? { label: 'About this evening...', heart: true, run: (E) => E.say('hinata', 'blush', 'In the evening I like to walk by the river near the old bridge. If you... happened to be there too...') }
        : s === 'step3' ? { label: 'Something on your mind?', heart: true, run: (E) => E.say('hinata', 'blush', 'T-tonight... could you come to the Moonrise Inn? After dark. I have something to tell you.') }
        : null,
    });
  };
  SC.hinata_garden = async (E) => {
    if (await NR.bondVisit(E, 'hinata')) return;
    if (S.qs('r_hinata') === 0) return NR.STORY.hinata1(E);
    await SC.hinata_talk(E);
  };
  NR.STORY.hinata1 = async (E, replay) => {
    if (replay) await E.backdrop('hyuga_garden', { fade: false });
    await E.say('hinata', 'happy', 'You came! Okay... I\'ll strike your chakra points with the Gentle Fist — lightly! You block with your palms. Ready?');
    await E.say('naruto', 'battle', 'Bring it on!');
    let hits = 3;
    if (!replay) {
      const r = await E.minigame('timing', { theme: 'palm', title: 'Gentle Fist Sparring', rounds: 5, speed: 0.9, zone: 0.22, partner: 'hinata' });
      hits = r.hits;
    }
    if (hits >= 3) await E.say('hinata', 'surprised', 'You matched my rhythm... Nobody\'s ever been able to do that. Not even Neji-niisan.');
    else await E.say('hinata', 'happy', 'Hehe — you got so focused on my eyes that you forgot to block!');
    await E.narrate('Afterwards, you sit together on the wooden veranda, legs dangling over the koi pond.');
    await E.say('hinata', 'blush', 'When I was little, I used to hide behind trees and watch you train. You never gave up, no matter how many people laughed at you.');
    await E.say('hinata', 'serious', 'That\'s why I started training harder. Because of you.');
    await E.say('naruto', 'surprised', 'Hinata...');
    await E.say('hinata', 'blush', 'S-sorry! That was embarrassing, forget I said anything!');
    const i = replay ? 0 : await E.choice([{ label: 'I\'m really glad you told me.', heart: true }, 'You\'re way stronger than me now, you know.', 'Wanna get ramen after this?']);
    if (i === 0) {
      await E.say('hinata', 'love', '...You are? Then... I\'m glad too.');
      if (!replay) E.aff('hinata', 5);
    } else if (i === 1) {
      await E.say('hinata', 'happy', 'Only at chakra control! You still win at... at shouting.');
      if (!replay) E.aff('hinata', 3);
    } else {
      await E.say('hinata', 'happy', 'Ichiraku? With you? ...Yes. Yes, please!');
      if (!replay) E.aff('hinata', 4);
    }
    await finishStep(E, 'hinata', 1, 8, 'hinata_1', replay);
  };
  SC.hinata_river = async (E) => NR.STORY.hinata2(E);
  NR.STORY.hinata2 = async (E, replay) => {
    await E.backdrop('river_evening');
    E.bgm('romance');
    await E.say('hinata', 'happy', 'The river is so pretty at sunset. My mother used to bring me here when I was small.');
    const i = replay ? 1 : await E.choice(['Do you miss her?', { label: 'You\'re prettier than the river.', heart: true }]);
    if (i === 0) {
      await E.say('hinata', 'sad', 'Every day. She used to say that kindness is a kind of strength, even if nobody sees it.');
      await E.say('naruto', 'serious', 'I see it. I always see it in you, Hinata.');
      await E.say('hinata', 'love', '...Thank you, Naruto-kun.');
      if (!replay) E.aff('hinata', 6);
    } else {
      await E.say('hinata', 'surprised', '...!!');
      await E.say('naruto', 'surprised', 'Hinata?! Don\'t faint!');
      await E.say('hinata', 'blush', 'I-I\'m not fainting! I\'m just... very, very happy.');
      if (!replay) E.aff('hinata', 8);
    }
    await E.narrate('Fireflies drift up from the reeds. Somewhere a temple bell rings the hour.');
    await E.say('hinata', 'blush', 'Naruto-kun... may I hold your hand?');
    await E.narrate('Her fingers slip between yours, small and warm and a little shaky.');
    await E.say('hinata', 'love', 'I\'ve wanted to do this since I was eight years old.');
    await E.say('naruto', 'blush', 'Your hand is really warm.');
    await E.say('hinata', 'love', 'Yours too.');
    await E.narrate('She leans her head on your shoulder, and neither of you says anything for a long time.');
    await E.say('hinata', 'serious', 'I\'m not a little girl hiding behind a tree anymore. Soon... I\'m going to tell you how I feel. Properly.');
    await E.backdrop(null);
    await finishStep(E, 'hinata', 2, 8, 'hinata_2', replay);
  };
  SC.hinata_onsen = async (E) => NR.STORY.hinata3(E);
  NR.STORY.hinata3 = async (E, replay) => {
    if (!replay) {
      await E.say('hinata', 'blush', 'Y-you came... I asked Okami-san to reserve the private bath. For... us. Is that okay?');
      const i = await E.choice([{ label: 'Of course it is.', heart: true }, 'Maybe another night.']);
      if (i === 1) return E.say('hinata', 'sad', 'Oh... okay. I\'ll wait. I\'m good at waiting.');
    }
    await E.backdrop('onsen_night');
    E.bgm('romance');
    if (!E.romanceOn()) {
      await E.narrate(summaryNight('hinata'));
      await E.backdrop(null);
      await finishStep(E, 'hinata', 3, 25, 'hinata_3', replay);
      return;
    }
    E.outfit('onsen');
    await E.narrate('The private outdoor bath is wrapped in steam and lantern light. Water whispers over the stones.');
    await E.say('hinata', 'blush', 'D-don\'t stare so much, Naruto-kun... Or do. I don\'t mind. If it\'s you.');
    await E.say('naruto', 'blush', 'S-sorry! It\'s just... you\'re beautiful, Hinata.');
    await E.narrate('She slips into the water beside you, close enough that your shoulders touch.');
    await E.say('hinata', 'flirty', 'I used to faint just standing near you. Look at me now.');
    await E.say('hinata', 'love', 'Turn around. I\'ll wash your back. That\'s what... couples do, isn\'t it?');
    await E.say('naruto', 'surprised', 'C-couples?!');
    await E.say('hinata', 'love', 'I love you, Naruto-kun. I\'ve loved you my whole life. I\'m not afraid to say it anymore.');
    const i = replay ? 0 : await E.choice([{ label: 'I love you too, Hinata.', heart: true }, { label: 'Kiss her.', heart: true }]);
    if (i === 0) await E.say('naruto', 'love', 'I love you too. I think I\'ve been learning how for a long time... and you were always there, waiting for me to catch up.');
    await E.narrate('Her lavender eyes flutter closed. Your first kiss tastes of warm water and something sweeter — a promise.');
    await E.say('hinata', 'love', '(whispering) Stay with me tonight...?');
    await fadeToBlack(E, 'The lanterns burn low. What passes between them under the moon stays theirs alone.');
    await morningAfter(E, 'hinata', 'charm_hinata', [
      ['hinata', 'blush', 'Good morning... N-Naruto-kun. I\'m not dreaming, am I?'],
      ['naruto', 'love', 'If you are, then I\'m in the same dream. And I\'m not waking up.'],
      ['hinata', 'love', 'I knitted this scarf for the man I love. It\'s... it\'s yours. It always was.'],
    ], replay);
    await E.backdrop(null);
    if (!replay) E.nextDay();
    await finishStep(E, 'hinata', 3, 25, 'hinata_3', replay);
  };

  // ============================== SAKURA ==============================
  const SAKURA_CHAT = [
    [['neutral', 'If you\'re here for a check-up, sit. If you\'re here to bother me, also sit. I\'ll get to you.'], ['angry', 'Did you eat a vegetable this week? One? A pickle doesn\'t count.'], ['happy', 'Ino says hi. Well, she said "tell Naruto he owes me a date". I\'m not passing that on.']],
    [['happy', 'You\'re actually pretty good company when you\'re not yelling.'], ['blush', 'Stop smiling at me like that, it\'s distracting. I\'m working.'], ['love', 'Thanks for always checking on me. Nobody else notices when I\'m tired.']],
    [['love', 'Come here. Your collar\'s crooked. ...There. Perfect.'], ['flirty', 'Keep looking at me like that and I\'ll have to prescribe you something.'], ['love', 'I\'m really happy, Naruto. I don\'t say it enough.']],
  ];
  SC.sakura_hospital = async (E) => {
    if (S.qs('main1') === 1) {
      await E.say('sakura', 'neutral', 'There you are. Kakashi-sensei briefed me too.');
      await E.say('naruto', 'happy', 'Ready to go, Sakura-chan?');
      await E.say('sakura', 'serious', 'Give me a second.');
      await E.say('sakura', 'neutral', 'Nurse — keep an eye on bed three. If the fever spikes, call Shizune-senpai.');
      await E.say('sakura', 'battle', 'Okay. Let\'s bring that chunin home. The Outer Forest is east, past Training Ground 3.');
      E.join('sakura');
      E.quest('main1', 2);
      return;
    }
    if (await NR.bondVisit(E, 'sakura')) return;
    const s = step('sakura');
    if (s === 'start') {
      await E.say('sakura', 'hurt', 'Naruto... sorry, I haven\'t slept. We\'re out of Moonlit Herbs — they only grow in the Outer Forest, and I can\'t leave the hospital.');
      await E.say('naruto', 'battle', 'I\'ll get them! How many?');
      await E.say('sakura', 'happy', 'Three. Pale green leaves that glow a little. You\'ll see them sparkle near the forest paths.');
      E.quest('r_sakura', 0);
      E.aff('sakura', 3);
      return;
    }
    await NR.romanceTalk(E, 'sakura', {
      chat: SAKURA_CHAT,
      questOption: () => {
        if (s === 'step1') return G().count('k_herbs') >= 3 ? { label: 'Hand over the Moonlit Herbs', heart: true, run: (E) => NR.STORY.sakura1(E) } : { label: 'About the herbs...', run: (E) => E.say('sakura', 'neutral', `You have ${G().count('k_herbs')} of 3. They glow a little — look near the Outer Forest paths.`) };
        if (s === 'step2') return S.eve() ? { label: 'You look exhausted...', heart: true, run: (E) => NR.STORY.sakura2(E) } : { label: 'Are you okay?', run: (E) => E.say('sakura', 'hurt', 'I\'m fine. Ask me again in the evening when my shift ends... I\'ll probably want to punch something.') };
        if (s === 'step3') return { label: 'About tonight...', heart: true, run: (E) => E.say('sakura', 'blush', 'Meet me under the big cherry tree in the park. Tonight. Don\'t be late, idiot.') };
        return null;
      },
    });
  };
  NR.STORY.sakura1 = async (E, replay) => {
    if (!replay) {
      E.take('k_herbs', 3);
    }
    await E.say('sakura', 'surprised', 'You found all three? And they\'re not even squashed! You actually listened to my description for once!');
    await E.say('naruto', 'happy', 'Hey, I always listen to you, Sakura-chan.');
    await E.narrate('Sakura pulls you into a sudden, tight hug. She smells like antiseptic and cherry blossoms.');
    await E.say('sakura', 'blush', 'Thank you... really. You\'re always there when I need you, aren\'t you?');
    await E.say('sakura', 'angry', '...Tell anyone I hugged you in the hospital lobby and you\'re dead.');
    await finishStep(E, 'sakura', 1, 12, 'sakura_1', replay);
  };
  NR.STORY.sakura2 = async (E, replay) => {
    await E.say('sakura', 'angry', 'Ugh. Fourteen hours. I\'ve been stuck in here for FOURTEEN HOURS. I need to punch something.');
    await E.say('naruto', 'happy', 'You can punch me! Er — I mean, spar with me!');
    await E.say('sakura', 'flirty', '...You\'re going to regret that offer.');
    if (!replay) {
      const r = await E.battle('spar_sakura', { canLose: true, bg: 'training' });
      if (r === 'lose') await E.say('sakura', 'happy', 'Ha! Still can\'t beat me when I\'m angry.');
      else await E.say('sakura', 'surprised', 'You\'ve gotten... really strong, Naruto.');
    }
    await E.backdrop('rooftop_night');
    E.bgm('romance');
    await E.narrate('Afterwards, on the hospital roof, Sakura rolls her shoulders and winces.');
    await E.say('sakura', 'hurt', 'Ow... I overdid it. My shoulders are like rocks.');
    const i = replay ? 0 : await E.choice([{ label: 'Offer a shoulder massage', heart: true }, 'Tell her to get some rest']);
    if (i === 0) {
      await E.say('sakura', 'blush', 'A massage? From you? ...Fine. But if your hands wander, I\'m breaking them.');
      await E.narrate('She sits in front of you. Slowly, the knots in her shoulders loosen under your thumbs.');
      await E.say('sakura', 'flirty', 'Mm... a little lower... there. Where did you learn this?');
      await E.say('naruto', 'blush', 'Pervy Sage\'s books! The... non-pervy chapters!');
      await E.say('sakura', 'flirty', 'Liar.');
      await E.narrate('She leans back against your chest and closes her eyes.');
      await E.say('sakura', 'love', 'Your hands are really warm, you know. ...Don\'t stop yet.');
      if (!replay) E.aff('sakura', 4);
    } else {
      await E.say('sakura', 'happy', 'Look at you, being responsible. Fine, doctor. Walk me home?');
    }
    await finishStep(E, 'sakura', 2, 8, 'sakura_2', replay);
    if (!replay) await E.backdrop(null);
  };
  SC.sakura_tree = async (E) => NR.STORY.sakura3(E);
  NR.STORY.sakura3 = async (E, replay) => {
    await E.backdrop('sakura_night');
    E.bgm('romance');
    await E.say('sakura', 'happy', 'You came. I used to come here after missions when I couldn\'t sleep. Watching the petals fall made everything feel... lighter.');
    await E.say('sakura', 'sad', 'When we were kids, I chased Sasuke-kun. And you chased me. I always thought you\'d grow out of it.');
    await E.say('naruto', 'serious', 'I did grow. It didn\'t go away, Sakura-chan. It just got... deeper.');
    await E.say('sakura', 'love', 'Me too. It took me so long to see what was right in front of me.');
    if (!E.romanceOn()) {
      await E.narrate(summaryNight('sakura'));
      await E.backdrop(null);
      await finishStep(E, 'sakura', 3, 25, 'sakura_3', replay);
      return;
    }
    await E.narrate('She steps close and fixes your collar, the way she always does. This time, her hands don\'t let go.');
    await E.say('sakura', 'blush', 'Naruto... close your eyes.');
    await E.narrate('Under a slow rain of petals, Sakura kisses you — first carefully, then like she\'s making up for years.');
    await E.say('sakura', 'flirty', 'My apartment is five minutes away... and my shift doesn\'t start until noon.');
    await fadeToBlack(E, 'Petals drift through the open window of a small apartment. Some things are better left to the imagination.');
    await morningAfter(E, 'sakura', 'charm_sakura', [
      ['sakura', 'happy', 'Morning, idiot. You snore, you know.'],
      ['naruto', 'surprised', 'I do not!'],
      ['sakura', 'love', 'You do. It\'s cute. Tell anyone I said that and you\'re dead. ...Here, take my glove. For luck.'],
    ], replay);
    await E.backdrop(null);
    if (!replay) E.nextDay();
    await finishStep(E, 'sakura', 3, 25, 'sakura_3', replay);
  };

  // ============================== INO ==============================
  const INO_CHAT = [
    [['flirty', 'Welcome to Yamanaka Flowers! Buying something for a girl? ...Is it me?'], ['happy', 'Sakura\'s been smiling a lot lately. Suspicious. Very suspicious.'], ['neutral', 'Sunflowers mean adoration. Just so you know. For no reason.']],
    [['flirty', 'You come by a lot for someone who doesn\'t buy flowers.'], ['happy', 'I made a bouquet that reminded me of you. Loud colours. Zero subtlety.'], ['blush', 'Don\'t tell anyone, but you\'re my favourite customer.']],
    [['love', 'I could read your mind, you know. But I like hearing you say things.'], ['flirty', 'Come closer, you\'ve got pollen on your nose. ...Gotcha.'], ['love', 'The shop feels brighter when you\'re in it. Gross, right?']],
  ];
  SC.ino_talk = async (E) => {
    if (await NR.bondVisit(E, 'ino')) return;
    const s = step('ino');
    if (s === 'start') {
      await E.say('ino', 'flirty', 'Naruto! Perfect timing. A handsome, strong man with nothing to do. Just what I needed.');
      await E.say('naruto', 'surprised', 'Uh... thanks?');
      await E.say('ino', 'happy', 'I have an order for a Moon Lily. It only blooms beside the pond in the Outer Forest — north-west of the entrance. You\'ll get it for me, right?');
      await E.say('ino', 'flirty', 'For a pretty girl?');
      await E.say('naruto', 'happy', 'Leave it to me!');
      E.quest('r_ino', 0);
      E.aff('ino', 3);
      return;
    }
    await NR.romanceTalk(E, 'ino', {
      chat: INO_CHAT,
      questOption: () => {
        if (s === 'step1') return S.has('k_moonlily') ? { label: 'Give her the Moon Lily', heart: true, run: (E) => NR.STORY.ino1(E) } : { label: 'About the Moon Lily...', run: (E) => E.say('ino', 'neutral', 'By the pond in the north-west of the Outer Forest. It glows — you can\'t miss it.') };
        if (s === 'step2') return { label: 'You mentioned a lesson?', heart: true, run: (E) => NR.STORY.ino2(E) };
        if (s === 'step3') return S.night() ? { label: 'Stay after closing', heart: true, run: (E) => NR.STORY.ino3(E) } : { label: 'Tonight...?', heart: true, run: (E) => E.say('ino', 'flirty', 'Come back after closing time. When it\'s dark. I\'ll leave the door unlocked for you.') };
        return null;
      },
      extra: () => [{ label: 'Browse flowers', run: async (E) => (await E.shop(NR.SHOPS.flowers, { title: 'Yamanaka Flowers' }), false) }],
    });
  };
  NR.STORY.ino1 = async (E, replay) => {
    if (!replay) E.take('k_moonlily');
    await E.say('ino', 'surprised', 'You found one... It\'s even more beautiful than I imagined.');
    await E.say('ino', 'happy', 'Do you know what Moon Lilies mean? "A love that shines in the dark."');
    await E.say('ino', 'flirty', 'Coincidence? ...Maybe.');
    await E.say('naruto', 'blush', 'Wait, was the order for...?');
    await E.say('ino', 'flirty', 'A lady never tells.');
    await finishStep(E, 'ino', 1, 12, 'ino_1', replay);
  };
  NR.STORY.ino2 = async (E, replay) => {
    await E.say('ino', 'happy', 'Every man should know how to make a proper bouquet. Lesson one: don\'t just grab things. Feel the balance.');
    if (!replay) await E.minigame('timing', { theme: 'flower', title: 'Ino\'s Flower Lesson', rounds: 4, speed: 0.8, zone: 0.24, partner: 'ino' });
    await E.narrate('Ino stands close behind you, her hands over yours as you arrange the last stems.');
    await E.say('ino', 'flirty', 'Want to know a secret? I could read your mind right now. One little jutsu...');
    await E.say('naruto', 'surprised', 'D-don\'t you dare!');
    await E.say('ino', 'happy', 'Relax! I\'d never do it without permission. Though I bet your head is full of ramen... and me.');
    const i = replay ? 1 : await E.choice(['Ramen and you. In that order.', { label: 'Mostly you.', heart: true }]);
    if (i === 0) {
      await E.say('ino', 'angry', 'Unbelievable. I lose to NOODLES.');
      if (!replay) E.aff('ino', 3);
    } else {
      await E.say('ino', 'blush', '...Oh. That\'s... okay, that one actually got me.');
      if (!replay) E.aff('ino', 7);
    }
    await finishStep(E, 'ino', 2, 5, 'ino_2', replay);
  };
  NR.STORY.ino3 = async (E, replay) => {
    await E.backdrop('flowershop_night');
    E.bgm('romance');
    await E.say('ino', 'flirty', 'Closed sign\'s up. Candles are lit. Don\'t look so nervous, Naruto.');
    await E.say('ino', 'happy', 'Pop quiz. What do red roses mean?');
    await E.say('naruto', 'neutral', 'Uh... "I like red"?');
    await E.say('ino', 'happy', 'Passion. Desire. "I can\'t stop thinking about you."');
    await E.narrate('She presses a single red rose into your hand.');
    await E.say('ino', 'love', 'I\'ve been giving you roses for weeks, you oblivious idiot.');
    if (!E.romanceOn()) {
      await E.narrate(summaryNight('ino'));
      await E.backdrop(null);
      await finishStep(E, 'ino', 3, 25, 'ino_3', replay);
      return;
    }
    await E.narrate('Ino hops up onto the counter and tugs you closer by your collar.');
    await E.say('ino', 'flirty', 'I\'m done waiting for you to figure it out.');
    await E.narrate('The kiss is bold and bright and smells of a thousand flowers. The candles flicker.');
    await E.say('ino', 'love', '(whispering) My room\'s upstairs...');
    await fadeToBlack(E, 'The candles burn down to stubs among a thousand quiet flowers.');
    await morningAfter(E, 'ino', 'charm_ino', [
      ['ino', 'flirty', 'Good morning, handsome. You\'re on flower-watering duty now. Boyfriend privileges.'],
      ['naruto', 'happy', 'Boyfriend...?'],
      ['ino', 'love', 'Keep up. Here — my hairpin. Wear it somewhere I can see it.'],
    ], replay);
    await E.backdrop(null);
    if (!replay) E.nextDay();
    await finishStep(E, 'ino', 3, 25, 'ino_3', replay);
  };

  // ============================== TENTEN ==============================
  const TENTEN_CHAT = [
    [['happy', 'Welcome to Tenten Arms! If it\'s sharp, I sell it. If it\'s not sharp, I can make it sharp.'], ['neutral', 'Lee broke another training dummy. That\'s six this month.'], ['serious', 'Your kunai is chipped. Give it here. ...How do you even DO that?']],
    [['happy', 'I made a new throwing star design. I named it after you. It spins a lot and never shuts up.'], ['blush', 'You come by more than my actual customers. Not complaining.'], ['happy', 'Wanna see me hit a fly at thirty paces? ...There. Showoff? Me? Never.']],
    [['love', 'You\'re the only person who ever asked about MY dreams. Not Neji\'s, not Lee\'s. Mine.'], ['flirty', 'Stand still. I\'m aiming. ...Right at your heart, obviously.'], ['love', 'The shop feels less empty with you around.']],
  ];
  SC.tenten_talk = async (E) => {
    if (await NR.bondVisit(E, 'tenten')) return;
    const s = step('tenten');
    if (s === 'start') {
      await E.say('tenten', 'angry', 'Naruto! You won\'t believe this. Bandits raided my supply wagon on the forest road — a whole crate of custom kunai!');
      await E.say('tenten', 'serious', 'Their camp\'s in the south-east of the Outer Forest. I\'d go myself, but I can\'t leave the shop.');
      await E.say('naruto', 'battle', 'Bandits stealing from my friend? I\'ll get your crate back, believe it!');
      await E.say('tenten', 'happy', 'You\'re the best! Discount for life. Well — for a week.');
      E.quest('r_tenten', 0);
      E.aff('tenten', 3);
      return;
    }
    await NR.romanceTalk(E, 'tenten', {
      chat: TENTEN_CHAT,
      questOption: () => {
        if (s === 'step1') return S.has('k_crate') ? { label: 'Return the weapon crate', heart: true, run: (E) => NR.STORY.tenten1(E) } : { label: 'About the bandits...', run: (E) => E.say('tenten', 'neutral', 'South-east corner of the Outer Forest. Look for the tents and the campfire.') };
        if (s === 'step2') return { label: 'Training together?', heart: true, run: (E) => E.say('tenten', 'happy', 'Meet me at the targets on Training Ground 3 during the day. Your shuriken form needs serious help.') };
        if (s === 'step3') return S.night() ? { label: 'Stay for a drink', heart: true, run: (E) => NR.STORY.tenten3(E) } : { label: 'After closing...?', heart: true, run: (E) => E.say('tenten', 'blush', 'Come by after dark. I bought sake. And there\'s... something I want to say.') };
        return null;
      },
      extra: () => [{ label: 'Browse weapons', run: async (E) => (await E.shop(NR.SHOPS.armory, { title: 'Tenten Arms' }), false) }],
    });
  };
  SC.bandit_camp = async (E) => {
    if (S.f('bandits_beaten')) return;
    await E.say('bandit', 'angry', 'Oi! This is our camp! Beat it, orange boy!', { name: 'Gorou the Fence' });
    await E.say('naruto', 'angry', 'You stole Tenten\'s weapons! Give them back!');
    await E.say('bandit', 'happy', 'Ha! Come and take \'em!', { name: 'Gorou the Fence' });
    const r = await E.battle('bandits');
    if (r !== 'win') return;
    E.flag('bandits_beaten', true);
    await E.narrate('The bandits scatter into the trees, leaving their loot behind.');
    E.give('k_crate');
    E.ryo(200);
    E.refresh();
  };
  NR.STORY.tenten1 = async (E, replay) => {
    if (!replay) E.take('k_crate');
    await E.say('tenten', 'surprised', 'My babies! Every single one! Oh, look at this balance...');
    await E.say('tenten', 'happy', 'Naruto, you\'re amazing. Here — the first one from the crate. It\'s yours.');
    if (!replay) E.give('kunai_steel');
    await E.say('tenten', 'blush', 'You know... nobody ever does stuff like this for me. Thanks. Really.');
    await finishStep(E, 'tenten', 1, 12, 'tenten_1', replay);
  };
  SC.tenten_training = async (E) => NR.STORY.tenten2(E);
  NR.STORY.tenten2 = async (E, replay) => {
    if (replay) await E.backdrop('training', { fade: false });
    await E.say('tenten', 'serious', 'Okay, show me your throw. ...Yikes. Your elbow is doing something illegal.');
    await E.narrate('Tenten steps behind you and guides your arm, her chin almost on your shoulder.');
    await E.say('tenten', 'neutral', 'Elbow up. Relax your shoulder. Breathe out when you release...');
    let hits = 3;
    if (!replay) hits = (await E.minigame('timing', { theme: 'target', title: 'Tenten\'s Target Practice', rounds: 5, speed: 1, zone: 0.2, partner: 'tenten' })).hits;
    if (hits >= 4) await E.say('tenten', 'surprised', 'Four bullseyes?! Okay, okay — maybe I\'m a good teacher.');
    else await E.say('tenten', 'happy', 'Not bad! We\'ll make a weapons master out of you yet.');
    await E.narrate('You turn around. She\'s still standing very, very close.');
    await E.say('naruto', 'blush', '...');
    await E.say('tenten', 'blush', 'D-don\'t make it weird! ...Okay, it\'s a little weird. A good weird.');
    await finishStep(E, 'tenten', 2, 10, 'tenten_2', replay);
  };
  NR.STORY.tenten3 = async (E, replay) => {
    await E.backdrop('armory_night');
    E.bgm('romance');
    await E.say('tenten', 'happy', 'Shop\'s closed. Sake\'s warm. Help me polish the new blades?');
    await E.narrate('You sit shoulder to shoulder on a crate, oiling steel by lamplight.');
    await E.say('tenten', 'sad', 'Everyone remembers Neji\'s genius and Lee\'s youth. Tenten? "The weapons girl." A background character.');
    await E.say('naruto', 'serious', 'You\'re not background to me. You never miss. You\'re the steadiest person I know.');
    await E.say('tenten', 'blush', '...Ugh. You can\'t just SAY things like that, Naruto.');
    if (!E.romanceOn()) {
      await E.narrate(summaryNight('tenten'));
      await E.backdrop(null);
      await finishStep(E, 'tenten', 3, 25, 'tenten_3', replay);
      return;
    }
    await E.narrate('She sets the blade down, grabs your collar and kisses you — quick and fierce, like a thrown kunai.');
    await E.say('tenten', 'flirty', 'I told you. I never miss.');
    await E.narrate('The weapon rack rattles as she pulls you closer. Neither of you cares.');
    await fadeToBlack(E, 'The lamp gutters out among the rows of polished steel.');
    await morningAfter(E, 'tenten', 'charm_tenten', [
      ['tenten', 'happy', 'Breakfast is peach buns. Don\'t complain.'],
      ['naruto', 'love', 'Wouldn\'t dream of it.'],
      ['tenten', 'love', 'Here. My lucky charm, and a kunai I forged just for you. Now you have to come back to return them.'],
    ], replay);
    if (!replay && !S.has('tenten_kunai')) E.give('tenten_kunai');
    await E.backdrop(null);
    if (!replay) E.nextDay();
    await finishStep(E, 'tenten', 3, 25, 'tenten_3', replay);
  };

  // ============================== TEMARI ==============================
  const TEMARI_CHAT = [
    [['neutral', 'The Leaf is too green. Too many trees. Where do you people put all the sand?'], ['angry', 'If you see Shikamaru, tell him the meeting started an hour ago.'], ['flirty', 'Don\'t stare, Uzumaki. It\'s rude. ...Unless you\'re going to say something interesting.']],
    [['happy', 'You\'re not as dumb as you look. That\'s a compliment. Mostly.'], ['flirty', 'Gaara asks about you in every letter. I think he likes you more than me.'], ['happy', 'Want to see me knock that bird out of the sky with one swing? ...Kidding. I like birds.']],
    [['love', 'Suna nights are cold. I\'m starting to like Leaf nights better.'], ['flirty', 'Come here. Your hair\'s a mess. ...Now it\'s worse. Good.'], ['love', 'I don\'t say this lightly: I\'m glad I met you.']],
  ];
  SC.temari_talk = async (E) => {
    if (await NR.bondVisit(E, 'temari')) return;
    const s = step('temari');
    if (s === 'start') {
      await E.say('temari', 'angry', 'You. Hero. Make yourself useful.');
      await E.say('temari', 'neutral', 'These treaty documents need the Hokage\'s signature, and Shikamaru is "too tired to walk up the stairs".');
      await E.say('naruto', 'happy', 'The Hokage Tower\'s right there! I\'ll take them up!');
      await E.say('temari', 'flirty', 'Good boy. Bring back his reply and I might even say thank you.');
      E.give('k_documents');
      E.quest('r_temari', 0);
      E.aff('temari', 3);
      return;
    }
    await NR.romanceTalk(E, 'temari', {
      chat: TEMARI_CHAT,
      questOption: () => {
        if (s === 'step1') return S.f('temari_reply') ? { label: 'Deliver Kakashi\'s reply', heart: true, run: (E) => NR.STORY.temari1(E) } : { label: 'About the documents...', run: (E) => E.say('temari', 'neutral', 'The Hokage\'s office. Top of the tower. Go.') };
        if (s === 'step2') return { label: 'A rematch?', heart: true, run: (E) => E.say('temari', 'flirty', 'Training Ground 3. Daytime. Bring your A-game — I won\'t hold back.') };
        if (s === 'step3') return { label: 'Tonight...?', heart: true, run: (E) => E.say('temari', 'blush', 'The lookout by the Hokage Monument path. After dark. Don\'t make me wait.') };
        return null;
      },
    });
  };
  NR.STORY.temari1 = async (E, replay) => {
    await E.say('temari', 'neutral', 'Took you long enough. Let me see... Hm. He agreed to nearly everything.');
    await E.say('temari', 'happy', 'Not bad, messenger boy. Thank you.');
    await E.say('temari', 'flirty', '...What? I said it. Don\'t make me say it twice.');
    await finishStep(E, 'temari', 1, 12, 'temari_1', replay);
  };
  SC.temari_spar = async (E) => NR.STORY.temari2(E);
  NR.STORY.temari2 = async (E, replay) => {
    await E.say('temari', 'battle', 'Ready? Wind doesn\'t wait for anyone!');
    if (!replay) {
      const r = await E.battle('spar_temari', { canLose: true, bg: 'training' });
      if (r === 'lose') await E.say('temari', 'happy', 'Blown away. Literally. You\'re still fun to fight.');
    }
    await E.backdrop('training');
    await E.say('temari', 'happy', 'You fight like a hurricane with no sense of direction. I like it.');
    await E.say('naruto', 'surprised', 'Was that a compliment?');
    await E.say('temari', 'flirty', 'Don\'t get used to it.');
    await E.narrate('You both collapse on the grass, catching your breath, watching the clouds drift by.');
    await E.say('temari', 'neutral', 'Shikamaru does this all day. I finally get the appeal.');
    await E.say('temari', 'blush', '...It\'s better with company.');
    await finishStep(E, 'temari', 2, 10, 'temari_2', replay);
    if (!replay) await E.backdrop(null);
  };
  SC.temari_rooftop = async (E) => NR.STORY.temari3(E);
  NR.STORY.temari3 = async (E, replay) => {
    await E.backdrop('rooftop_night');
    E.bgm('romance');
    await E.say('temari', 'neutral', 'Suna doesn\'t have views like this. Just sand. And stars. Lots of stars.');
    await E.say('temari', 'flirty', 'You know what I like about you, Naruto? You don\'t pretend. When you want something, you go straight for it.');
    await E.say('temari', 'love', 'So I\'ll do the same.');
    if (!E.romanceOn()) {
      await E.narrate(summaryNight('temari'));
      await E.backdrop(null);
      await finishStep(E, 'temari', 3, 25, 'temari_3', replay);
      return;
    }
    await E.narrate('Temari kisses you first, one hand fisted in your jacket, like she\'s claiming territory.');
    await E.say('temari', 'flirty', 'Surprised? Women of the Sand don\'t wait for the wind.');
    await E.say('temari', 'love', 'My guest quarters are on the other side of the village. Walk me back. Slowly.');
    await fadeToBlack(E, 'Over the sleeping village, two shadows walk very slowly toward the guest quarters.');
    await morningAfter(E, 'temari', 'charm_temari', [
      ['temari', 'flirty', 'If Gaara asks, we discussed diplomacy. All night.'],
      ['naruto', 'blush', 'D-diplomacy. Right.'],
      ['temari', 'love', 'Take this ribbon from my fan. It\'s... a Suna custom. For someone you want to see again.'],
    ], replay);
    await E.backdrop(null);
    if (!replay) E.nextDay();
    await finishStep(E, 'temari', 3, 25, 'temari_3', replay);
  };

  // ============================== TSUNADE ==============================
  const TSUNADE_CHAT = [
    [['flirty', 'Brat! Sit, drink. ...Juice for you. You\'re still a baby to me.'], ['angry', 'If Shizune sent you to drag me back to the office, I\'m not here.'], ['happy', 'Retirement is wonderful. Sake, hot water, nobody asking me to sign things.']],
    [['happy', 'You remind me of Nawaki sometimes. Loud. Stubborn. Good.'], ['flirty', 'You\'ve grown up handsome, you know. Don\'t let it go to your head.'], ['sad', 'Jiraiya would have loved to see you like this.']],
    [['love', 'When you\'re around, I forget to feel old.'], ['flirty', 'Sit closer. I don\'t bite. Much.'], ['love', 'My luck has been strangely good lately. I wonder why.']],
  ];
  SC.tsunade_talk = async (E) => {
    if (S.qs('main2') === 1) return NR.STORY.tsunadeScroll(E);
    if (await NR.bondVisit(E, 'tsunade')) return;
    const s = step('tsunade');
    if (s === 'start') {
      await E.say('tsunade', 'sad', 'Don\'t look at me like that. Yes, I\'m sulking.');
      await E.say('tsunade', 'angry', 'I bet my legendary sake — "Sannin\'s Tears", fifty years old — in a dice game last night. And lost. Obviously.');
      await E.say('tsunade', 'flirty', 'You have ridiculous luck, brat. Win it back for me at the dice table. The dealer\'s in the corner.');
      E.quest('r_tsunade', 0);
      E.aff('tsunade', 3);
      return;
    }
    await NR.romanceTalk(E, 'tsunade', {
      chat: TSUNADE_CHAT,
      questOption: () => {
        if (s === 'step1') return S.has('k_sake') ? { label: 'Return "Sannin\'s Tears"', heart: true, run: (E) => NR.STORY.tsunade1(E) } : { label: 'About the sake...', run: (E) => E.say('tsunade', 'neutral', 'The dealer in the corner. Win three rounds and it\'s ours. Don\'t lose MY money.') };
        if (s === 'step2') return { label: 'A drinking contest?', heart: true, run: (E) => NR.STORY.tsunade2(E) };
        if (s === 'step3') return S.night() ? { label: 'The moonlit bath...', heart: true, run: (E) => NR.STORY.tsunade3(E) } : { label: 'You wanted to see me?', heart: true, run: (E) => E.say('tsunade', 'flirty', 'Come back tonight, after dark. I\'ve rented something special.') };
        return null;
      },
    });
  };
  SC.dealer_talk = async (E) => {
    if (S.qs('r_tsunade') === 0 && !S.has('k_sake')) {
      await E.say('vm2', 'neutral', 'Cho or Han, sir? Ah, you\'re here for Lady Tsunade\'s bottle. Win three rounds and it\'s yours. Each round is 100 ryo.', { name: 'Dealer' });
      if (G().state.ryo < 100) return E.say('vm2', 'neutral', 'Come back when you have at least 100 ryo, sir.', { name: 'Dealer' });
      const r = await E.minigame('dice', { need: 3, maxRounds: 6, luck: 0.6, title: 'Cho-Han — for "Sannin\'s Tears"' });
      E.ryo(0);
      G().addRyo((r.wins - r.losses) * 100);
      if (r.won) {
        await E.say('vm2', 'surprised', 'Three wins! The bottle is yours, sir. Lady Tsunade never wins like that.', { name: 'Dealer' });
        E.give('k_sake');
      } else await E.say('vm2', 'neutral', 'The dice weren\'t with you tonight. Try again any time.', { name: 'Dealer' });
      return;
    }
    await E.say('vm2', 'neutral', 'A friendly round? 50 ryo a throw. Win two to double your money.', { name: 'Dealer' });
    const i = await E.choice(['Play (50 ryo a round)', 'Maybe later']);
    if (i !== 0) return;
    if (G().state.ryo < 50) return E.say('vm2', 'neutral', 'Not enough ryo, sir.', { name: 'Dealer' });
    const r = await E.minigame('dice', { need: 2, maxRounds: 3, luck: 0.5, title: 'Cho-Han' });
    G().addRyo((r.wins - r.losses) * 50);
  };
  NR.STORY.tsunade1 = async (E, replay) => {
    if (!replay) E.take('k_sake');
    await E.say('tsunade', 'surprised', 'You WON? "Sannin\'s Tears"... fifty years in the cask and it\'s back in my hands!');
    await E.say('tsunade', 'happy', 'Brat, you might just be my lucky charm.');
    await E.narrate('Tsunade plants a loud kiss on your cheek. Across the room, Okami-san pretends not to see.');
    await E.say('naruto', 'blush', 'L-Lady Tsunade!');
    await E.say('tsunade', 'flirty', 'What? You\'ve earned it.');
    await finishStep(E, 'tsunade', 1, 12, 'tsunade_1', replay);
  };
  NR.STORY.tsunade2 = async (E, replay) => {
    await E.backdrop('inn_room');
    await E.say('tsunade', 'flirty', 'You\'re a man now, Naruto. Let\'s see if you can drink like one. First to fall over pays.');
    let hits = 3;
    if (!replay) hits = (await E.minigame('timing', { theme: 'sake', title: 'Drinking Contest vs. Tsunade', rounds: 4, speed: 0.8, zone: 0.24, wobble: 1.2, partner: 'tsunade' })).hits;
    if (hits >= 3) await E.say('tsunade', 'surprised', 'Still standing?! Nobody out-drinks me! ...Nobody except Jiraiya on his birthday.');
    else await E.say('tsunade', 'happy', 'Ha! Down you go. Your whiskers turn pink when you\'re drunk, did you know?');
    await E.narrate('Later, she leans her head on your shoulder, cup dangling from her fingers.');
    await E.say('tsunade', 'sad', 'Jiraiya used to try to out-drink me every year. He never won. I\'d give anything for one more of those nights.');
    await E.say('naruto', 'serious', 'He\'d want you to keep having them. With people who care about you.');
    await E.say('tsunade', 'love', '...People like you, you mean?');
    await finishStep(E, 'tsunade', 2, 10, 'tsunade_2', replay);
    if (!replay) await E.backdrop(null);
  };
  NR.STORY.tsunade3 = async (E, replay) => {
    await E.backdrop('onsen_night');
    E.bgm('romance');
    if (!E.romanceOn()) {
      await E.narrate(summaryNight('tsunade'));
      await E.backdrop(null);
      await finishStep(E, 'tsunade', 3, 25, 'tsunade_3', replay);
      return;
    }
    E.outfit('onsen');
    await E.say('tsunade', 'flirty', 'Don\'t look so terrified, Naruto. I\'m not going to bite. ...Much.');
    await E.say('tsunade', 'sad', 'Everyone sees the Fifth Hokage. The Legendary Sucker. The woman who uses a jutsu to look young. Nobody sees me.');
    await E.say('naruto', 'serious', 'I see you. You\'re brave and kind, and you never gave up on me, even when I was a total brat.');
    await E.say('tsunade', 'blush', 'You\'re still a brat.');
    await E.narrate('She glides closer through the steaming water and rests her head on your shoulder.');
    await E.say('tsunade', 'love', 'Let me be selfish for one night.');
    await E.say('naruto', 'love', 'You\'re not being selfish. You\'re being Tsunade.');
    await E.narrate('The kiss is slow and sure, and tastes faintly of fifty-year-old sake.');
    await fadeToBlack(E, 'The moon sets behind the steam. Some legends are better lived than told.');
    await morningAfter(E, 'tsunade', 'charm_tsunade', [
      ['tsunade', 'happy', 'Well. My luck finally turned.'],
      ['naruto', 'love', 'Mine too.'],
      ['tsunade', 'love', 'Keep this coin. I\'ve carried it for thirty years waiting for a win worth remembering.'],
    ], replay);
    await E.backdrop(null);
    if (!replay) E.nextDay();
    await finishStep(E, 'tsunade', 3, 25, 'tsunade_3', replay);
  };

  // ============================== quest spots ==============================
  SC.moon_lily = async (E) => {
    if (S.qs('r_ino') === 0 && !S.has('k_moonlily')) {
      await E.narrate('A lily with petals like frosted glass glows softly at the water\'s edge.');
      E.give('k_moonlily');
      await E.think('naruto', 'happy', 'This must be the Moon Lily Ino wanted!');
    } else if (!S.f('lily_seen')) {
      E.flag('lily_seen', true);
      await E.narrate('Pale flowers glimmer by the pond like fallen stars.');
    }
  };
  SC.herb_spot = async (E, self, ev) => {
    const n = ev && ev.herb;
    if (S.qs('r_sakura') === 0 && !S.f('herb' + n)) {
      E.flag('herb' + n, true);
      E.give('k_herbs');
      await E.narrate(`Moonlit Herbs! (${G().count('k_herbs')} / 3)`);
    }
  };

  // ============================== memories ==============================
  const MEM = {
    hinata: ['hinata1', 'hinata2', 'hinata3'], sakura: ['sakura1', 'sakura2', 'sakura3'], ino: ['ino1', 'ino2', 'ino3'],
    tenten: ['tenten1', 'tenten2', 'tenten3'], temari: ['temari1', 'temari2', 'temari3'], tsunade: ['tsunade1', 'tsunade2', 'tsunade3'],
  };
  // scenes that play on the map in the story get a painted backdrop when replayed
  const REPLAY_BG = { hinata1: 'hyuga_garden', sakura1: 'village', sakura2: 'rooftop_night', temari2: 'training', tsunade2: 'inn_room', ino1: 'flowershop_night', ino2: 'flowershop_night', tenten1: 'armory_night', tenten2: 'training', temari1: 'village', tsunade1: 'inn_room' };
  for (const c in MEM) {
    MEM[c].forEach((fn, i) => {
      SC[`memory_${c}_${i + 1}`] = async (E) => {
        if (REPLAY_BG[fn]) await E.backdrop(REPLAY_BG[fn], { fade: false });
        await NR.STORY[fn](E, true);
        await E.backdrop(null, { fade: false });
      };
    });
  }
})();
