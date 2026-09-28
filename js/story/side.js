// Side quests and everyday NPCs: Ichiraku deliveries, Akamaru, Lee's challenge, the Academy
// scroll, shops, the hospital and the inn.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const S = NR.S;
  const SC = NR.SCRIPTS;
  const G = () => NR.game;

  // The Outer Forest opens once the first mission has been handed out.
  NR.forestOpen = () => S.qs('main1') >= 2 || S.qd('main1');

  // Line chosen by chapter (falls back to the closest earlier chapter).
  function byChapter(table) {
    for (let c = S.ch(); c >= 0; c--) if (table[c]) return table[c];
    return table[Object.keys(table)[0]];
  }
  // A different line each day, stable within the day.
  function daily(pool, salt) {
    return pool[(G().state.day + U.strSeed(salt || '')) % pool.length];
  }
  async function sayLines(E, lines) {
    for (const [who, emo, text, o] of lines) await E.say(who, emo, text, o);
  }

  // ============================== RAMEN RUSH ==============================
  NR.checkRamenDone = function (E) {
    if (S.qs('side_ramen') !== 0) return;
    if (S.has('k_ramen1') || S.has('k_ramen2') || S.has('k_ramen3')) {
      const left = ['k_ramen1', 'k_ramen2', 'k_ramen3'].filter((k) => S.has(k)).length;
      NR.ui.toast(`Ramen delivered! ${left} order${left > 1 ? 's' : ''} left.`, { icon: '🍜' });
      return;
    }
    E.quest('side_ramen', 1);
  };

  const TEUCHI = {
    1: [['happy', 'Naruto! The usual? Extra pork, extra noodles, extra everything?']],
    2: [['serious', 'Heard about those drained chunin. Eat up — you\'ll need your strength.']],
    3: [['happy', 'A hero can\'t save the world on an empty stomach. That\'s the first rule of ramen.']],
    4: [['sad', 'Kurama sealed away... Well, the broth is still hot. Some things don\'t change.']],
    5: [['happy', 'Our number-one customer, back from Uzushio! This bowl\'s on the house, Hokage-sama!']],
  };
  SC.teuchi_talk = async (E) => {
    if (await NR.bondVisit(E, 'teuchi')) return;
    const st = G().state;
    const rs = S.qs('side_ramen');
    if (rs === 1) {
      await E.say('teuchi', 'happy', 'All three delivered — and still hot? Ha! You\'re faster than my delivery boy ever was.');
      await E.say('ayame', 'happy', 'Dad, he IS faster than your delivery boy. He\'s a hundred shadow clones.');
      await E.say('teuchi', 'happy', 'Here — three bowls of the good stuff to take on your missions. And from now on, your first bowl every day is on the house.');
      E.complete('side_ramen');
      E.give('ramen_pork', 3);
      E.ryo(300);
      E.flag('ramen_free', true);
      return;
    }
    if (rs < 0 && S.ch() >= 1) {
      await E.say('teuchi', 'surprised', 'Naruto! Perfect timing — I\'ve got three lunch orders and nobody to run them.');
      await E.say('teuchi', 'neutral', 'Miso for Iruka at the Academy, pork for Kiba at the training ground, and salt for Shikamaru up in the Hokage Tower.');
      const i = await E.choice(['Leave it to me!', 'Maybe later']);
      if (i === 1) return E.say('teuchi', 'neutral', 'No worries. Ramen waits for no one... but I\'ll keep the orders warm a while.');
      await E.say('teuchi', 'happy', 'That\'s my boy! Don\'t spill the broth!');
      E.quest('side_ramen', 0);
      E.give('k_ramen1', 1, true);
      E.give('k_ramen2', 1, true);
      E.give('k_ramen3', 1, true);
      NR.audio.sfx('item');
      NR.ui.toast('Obtained [y]3 Ramen Orders[/y]', { icon: '🥡' });
      return;
    }
    const [emo, line] = U.pick(byChapter(TEUCHI));
    await E.say('teuchi', emo, line);
    for (;;) {
      const free = S.f('ramen_free') && st.talked.ramen_free !== st.day;
      const opts = [
        free ? 'Eat a bowl here (free today!)' : 'Eat a bowl here (120 ryo · full recovery)',
        'Buy ramen to go',
        'Chat',
        'Leave',
      ];
      const i = await E.choice(opts, { cancel: 3 });
      if (i === 0) {
        if (!free && st.ryo < 120) {
          NR.audio.sfx('buzzer');
          await E.say('teuchi', 'neutral', 'Short on ryo? Come back after payday, kid. Or after a mission.');
          continue;
        }
        if (free) st.talked.ramen_free = st.day;
        else G().addRyo(-120);
        await E.fadeOut(400);
        G().fullHeal();
        NR.audio.sfx('heal');
        await E.wait(300);
        await E.fadeIn(400);
        await E.think('naruto', 'love', 'Mmmh... that broth. Every cell in my body just said "thank you".');
        await E.say('naruto', 'happy', 'Party fully recovered! Thanks, old man!');
        return;
      }
      if (i === 1) {
        await E.shop(NR.SHOPS.ichiraku, { title: 'Ichiraku Ramen' });
        continue;
      }
      if (i === 2) {
        await E.say('teuchi', 'happy', daily([
          'Thirty years of broth. The secret? Patience — and never letting Naruto near the stock pot.',
          'Ayame\'s been trying new toppings. Some of them are even edible.',
          'You know, your father used to sit on that exact stool. Tipped well, too. Hint, hint.',
          'Kakashi ordered takeout again. I\'ve never once seen him eat it.',
        ], 'teuchi'));
        continue;
      }
      return;
    }
  };

  // Ayame gossips about who likes what — handy gift hints.
  const GIFT_HINTS = {
    hinata: 'Lady Hinata buys zenzai from Anko\'s dango stand every week. And her eyes light up at cinnamon rolls.',
    sakura: 'Sakura-chan has a weakness for anmitsu. She\'d kill me for telling you, so... you didn\'t hear it from me.',
    ino: 'Ino says a man who brings her plum blossom perfume — or almond pudding — is worth a second look.',
    tenten: 'Tenten? Peach buns from the general store. She hides them inside her weapon scrolls, I\'ve seen it.',
    temari: 'Temari-san asked Dad where she could find roasted chestnuts like the ones in Suna. The general store has them!',
    tsunade: 'Lady Tsunade... well. Premium sake. Obviously. The Moonrise Inn sells the good stuff.',
  };
  SC.ayame_talk = async (E) => {
    const known = NR.ROMANCE.filter((c) => S.qs('r_' + c) >= 0 || S.aff(c) >= 10);
    const pool = known.length ? known : NR.ROMANCE;
    const c = pool[(G().state.day + known.length) % pool.length];
    await E.say('ayame', 'happy', daily([
      'Welcome, Naruto! Sit, sit. Dad\'s in a good mood today.',
      'You\'re here again? Not that I\'m complaining — you\'re our best customer.',
      'Ooh, you look like a man with something on his mind. Or someone.',
    ], 'ayame'));
    const i = await E.choice([{ label: 'Any gossip?', heart: true }, 'Nothing, just saying hi']);
    if (i === 0) {
      await E.say('ayame', 'flirty', 'Gossip? Me? ...Okay, maybe a little.');
      await E.say('ayame', 'happy', GIFT_HINTS[c]);
      G().vr('giftknown_' + c, 1);
    } else await E.say('ayame', 'happy', 'Hi yourself. Don\'t be a stranger!');
  };

  // ============================== ANKO & THE DANGO STAND ==============================
  SC.anko_talk = async (E) => {
    if (await NR.bondVisit(E, 'anko')) return;
    await E.say('anko', 'flirty', daily([
      'Well, well. Konoha\'s favourite knucklehead. You buying, or just staring at my dango?',
      'Don\'t look at me like that. Three sticks before lunch is a perfectly balanced diet.',
      'You grew up nice, brat. Shame about the orange.',
      'If you\'re looking for sweets to impress a girl, you came to the right woman.',
    ], 'anko'));
    const i = await E.choice(['Browse the stand', 'Ask for dating advice', 'Leave'], { cancel: 2 });
    if (i === 0) return E.shop(NR.SHOPS.dango, { title: 'Dango Stand' });
    if (i === 1) {
      await E.say('anko', 'happy', 'Advice? Ha! Okay. One: bring sweets. Two: listen more than you talk. Three...');
      await E.say('anko', 'flirty', 'Three: confidence. Nothing is more attractive than a man who knows what he wants and isn\'t scared to go get it.');
      await E.say('anko', 'serious', 'And the gift thing — everyone has a favourite. Ask around. Ayame at Ichiraku hears everything.');
    }
  };

  // ============================== IRUKA & THE STOLEN SCROLL ==============================
  SC.iruka_talk = async (E) => {
    if (await NR.bondVisit(E, 'iruka')) return;
    if (S.qs('side_ramen') === 0 && S.has('k_ramen1')) {
      await E.say('iruka', 'surprised', 'Miso ramen from Ichiraku? For me? ...Naruto, you\'re delivering food now?');
      await E.say('iruka', 'happy', 'You used to beg me to buy YOU ramen. Look at us now. Thank you.');
      E.take('k_ramen1');
      NR.checkRamenDone(E);
      return;
    }
    if (S.has('k_acadscroll') && !S.qd('side_scroll')) {
      const early = S.qs('side_scroll') < 0;
      if (early) await E.say('iruka', 'surprised', 'Is that... the Academy\'s seal scroll?! It was stolen last week — I hadn\'t even told anyone yet!');
      else await E.say('iruka', 'surprised', 'You found it! The Academy scroll — from the Hollow Moon\'s hideout?');
      await E.say('iruka', 'happy', 'The kids will be thrilled. And I\'ll finally stop getting letters from the council.');
      await E.say('iruka', 'serious', 'Here — this was meant for my best graduate. It took a few years, but I think you\'ve earned it.');
      E.take('k_acadscroll');
      if (early) E.quest('side_scroll', 1, true);
      E.complete('side_scroll');
      E.give('chakra_blade');
      E.ryo(200);
      return;
    }
    if (S.ch() >= 2 && S.qs('side_scroll') < 0) {
      await E.say('iruka', 'serious', 'Naruto, can I ask a favour? Someone broke into the Academy and stole a scroll of basic sealing techniques.');
      await E.say('iruka', 'neutral', 'Useless to most thieves... but a group that studies seals might want it. If you run into those Hollow Moon people, keep an eye out.');
      E.quest('side_scroll', 0);
      return;
    }
    await E.say('iruka', ...U.pick(byChapter({
      0: [['happy', 'Good morning, Naruto!']],
      1: [['happy', 'The new students asked me if the "Seventh Hokage" really painted the monument once. I told them the truth.'], ['neutral', 'Don\'t forget to eat properly. And vegetables are not the enemy.']],
      2: [['serious', 'Strange times. Be careful out there — and trust your team.']],
      3: [['serious', 'Every Academy kid wants to know where you are. I tell them you\'re protecting the village.']],
      4: [['sad', 'I heard about Kurama... You were never alone, Naruto. Not anymore.']],
      5: [['love', 'My student. The Seventh Hokage. I think I\'m going to cry. Don\'t look.']],
    })));
  };

  // ============================== VILLAGE FRIENDS ==============================
  SC.choji_talk = async (E) => {
    if (await NR.bondVisit(E, 'choji')) return;
    if (!S.f('choji_gift') && S.ch() >= 1) {
      E.flag('choji_gift', true);
      await E.say('choji', 'happy', 'Naruto! Here — Akimichi clan soldier pills. Mom made a triple batch. They taste like barbecue!');
      E.give('soldier_pill', 2);
      return;
    }
    await E.say('choji', ...U.pick([
      ['happy', 'Barbecue after the next mission? Team Ten\'s treat. By which I mean Shikamaru\'s wallet.'],
      ['neutral', 'Ino keeps telling me to try salad. I tried it. It was a bowl of sadness.'],
      ['happy', 'Did you know the dango stand has a new flavour? I\'ve had seven. For science.'],
      ['serious', 'If you need muscle for a mission, call me. I mean it — the big-guy kind of muscle.'],
    ]));
  };

  SC.sai_talk = async (E) => {
    if (await NR.bondVisit(E, 'sai')) return;
    const fav = NR.ROMANCE.slice().sort((a, b) => S.aff(b) - S.aff(a))[0];
    if (fav && S.aff(fav) >= 60) {
      await E.say('sai', 'happy', `I read that when a man smiles like you've been smiling lately, he is in love. The book says to "tease him about it".`);
      await E.say('sai', 'neutral', `So: Naruto and ${NR.charName(fav)}, sitting in a tree... I don't know the rest. Is it a jutsu?`);
      return;
    }
    await E.say('sai', ...U.pick([
      ['happy', 'I\'m painting the village from the rooftops. It\'s hard to get your hair right — it doesn\'t obey physics.'],
      ['neutral', 'I read a book called "How to Compliment a Friend". Naruto, your forehead is very... shiny today.'],
      ['happy', 'Sakura hit me for calling her "ugly" again. Progress: she only hit me once.'],
      ['neutral', 'Ino says I should "read the room". I have looked everywhere. There are no words on the walls.'],
    ]));
  };

  // ============================== ROCK LEE'S CHALLENGE ==============================
  SC.lee_talk = async (E) => {
    if (await NR.bondVisit(E, 'lee')) return;
    if (S.ch() < 1) return E.say('lee', 'happy', 'Good morning, Naruto! Five hundred push-ups before breakfast!');
    if (!S.qd('side_lee')) {
      if (S.qs('side_lee') < 0) {
        await E.say('lee', 'battle', 'NARUTO! My eternal rival\'s eternal rival! The flames of youth demand a spar!');
        await E.say('lee', 'serious', 'Gai-sensei says a true shinobi tests himself every day. So test me! No holding back!');
        E.quest('side_lee', 0);
      } else await E.say('lee', 'battle', 'Have you come to accept my challenge?!');
      const i = await E.choice([{ label: 'You\'re on, bushy brows!' }, 'Later — I have to warm up']);
      if (i === 1) return E.say('lee', 'happy', 'A wise choice! Warming up is the foundation of youth! I will be waiting — doing laps!');
      const r = await E.battle('spar_lee', { canLose: true, bg: 'training' });
      if (r === 'win') {
        await E.say('lee', 'hurt', 'Incredible... Your youth burns brighter than ever. I concede — for today!');
        await E.say('lee', 'happy', 'Take this! Gai-sensei gave me a spare flak vest. It is... slightly green. Wear it with pride!');
        E.complete('side_lee');
        E.give('flak_vest');
      } else await E.say('lee', 'happy', 'A fine match! Train hard, and challenge me again whenever your spirit is ready!');
      return;
    }
    await E.say('lee', 'happy', 'Naruto! Another round? Sparring is the best training there is!');
    const i = await E.choice(['Spar again (training battle)', 'Not today']);
    if (i === 0) {
      const r = await E.battle('spar_lee', { canLose: true, bg: 'training' });
      await E.say('lee', r === 'win' ? 'surprised' : 'happy', r === 'win' ? 'Again I am defeated! I shall run two thousand laps in penance!' : 'YOSH! Victory tastes like sweat and determination!');
    }
  };

  // ============================== WHERE'S AKAMARU? ==============================
  SC.kiba_talk = async (E) => {
    if (await NR.bondVisit(E, 'kiba')) return;
    if (S.qs('side_ramen') === 0 && S.has('k_ramen2')) {
      await E.say('kiba', 'happy', 'Is that pork ramen?! You\'re a legend, Naruto!');
      await E.say('kiba', 'neutral', '...Akamaru, no. This one\'s mine. MINE.');
      E.take('k_ramen2');
      NR.checkRamenDone(E);
      return;
    }
    const aq = S.qs('side_akamaru');
    if (aq === 1) {
      await E.say('kiba', 'surprised', 'Wait — I know that bark!');
      const pup = E.spawn({ key: 'akamaru_run', char: 'akamaru', x: 30, y: 16, dir: 'left' });
      pup.speed = 7;
      await E.move(pup, 'lllllllll', { speed: 7 });
      E.remove(pup);
      E.complete('side_akamaru');
      E.refresh();
      await E.jump('akamaru');
      await E.say('akamaru', 'happy', 'WOOF! WOOF!', { name: 'Akamaru' });
      await E.say('kiba', 'love', 'Akamaru! You big idiot, you had me worried sick! ...Thanks, Naruto. Really.');
      await E.say('kiba', 'happy', 'Here — my sister\'s ointment and some ryo. And if you ever need a nose on a mission, call us!');
      E.give('med_scroll', 2);
      E.ryo(250);
      return;
    }
    if (aq === 0) return E.say('kiba', 'sad', 'Any sign of Akamaru? He went east, into the Outer Forest... Follow the stream, he loves water.');
    if (aq < 0 && NR.forestOpen()) {
      await E.say('kiba', 'happy', 'Yo, Naruto! Akamaru and I were just about to—');
      await E.say('akamaru', 'surprised', 'Woof?! ...WOOF!', { name: 'Akamaru' });
      await E.emote('akamaru', '!');
      await E.move('akamaru', 'rrrrrrrrrr', { speed: 7 });
      E.remove('akamaru');
      await E.say('kiba', 'angry', 'AKAMARU! Get back here! ...He caught some scent and bolted straight for the Outer Forest!');
      await E.say('kiba', 'hurt', 'I\'d chase him myself, but I twisted my ankle on the last mission. Naruto — can you find him? Please?');
      E.quest('side_akamaru', 0);
      return;
    }
    await E.say('kiba', ...U.pick([
      ['happy', 'Akamaru\'s been restless all week. Something\'s got his nose twitching.'],
      ['flirty', 'You and Hinata, huh? ...What? I have a nose. I can smell a crush from a mile away.'],
      ['battle', 'Next time we spar, Akamaru and I are going to wipe the floor with you!'],
    ]));
  };

  SC.akamaru_talk = async (E) => {
    await E.say('akamaru', 'happy', U.pick(['Woof!', 'Arf! Arf!', '*happy panting*', '*rolls over for belly rubs*']), { name: 'Akamaru' });
    if (S.qd('side_akamaru')) await E.say('kiba', 'happy', 'He says thanks for finding him. And that you smell like ramen. Both are compliments.');
  };

  SC.akamaru_found = async (E, self) => {
    await E.say('akamaru', 'happy', 'WOOF!', { name: 'Akamaru' });
    await E.say('naruto', 'happy', 'Akamaru! There you are! Kiba\'s worried sick about you!');
    await E.narrate('Akamaru wags his enormous tail and drops something at your feet — a muddy traveller\'s pouch he dug up.');
    await E.say('naruto', 'surprised', 'Is this what you were sniffing out? ...Heavy. Somebody lost a lot of ryo.');
    E.ryo(180);
    E.give('antidote', 2);
    E.flag('akamaru_found', true);
    E.quest('side_akamaru', 1);
    await E.say('naruto', 'happy', 'Come on, let\'s get you home!');
    await E.narrate('Akamaru barks once and bounds off toward the village — he knows the way better than you do.');
    const a = E.actor(self && self.key ? self.key : 'akamaru');
    if (a) {
      await E.move(a, 'lllll', { speed: 7 });
      E.poof(a);
      E.remove(a);
    }
  };

  // ============================== HOSPITAL ==============================
  SC.nurse_talk = async (E) => {
    await E.say('vf2', 'happy', 'Welcome to Konoha Hospital. Would you like a check-up? It\'s free for active-duty shinobi.', { name: 'Nurse' });
    const i = await E.choice(['Yes, please (full recovery)', 'No thanks']);
    if (i !== 0) return;
    await E.fadeOut(350);
    G().fullHeal();
    NR.audio.sfx('heal');
    await E.wait(300);
    await E.fadeIn(350);
    await E.say('vf2', 'happy', U.pick([
      'All done! You heal ridiculously fast, you know. The doctors write papers about you.',
      'All patched up. And please — no more fighting in the hallway.',
      'Good as new! Sakura-sensei says to stop eating instant ramen. Her words, not mine.',
    ]), { name: 'Nurse' });
  };

  SC.patient_talk = async (E) => {
    if (S.f('chunin_found')) {
      await E.say('vm4', 'happy', 'You\'re the one who carried Daisuke back from the forest, right? He\'s my squadmate. Thank you — really.', { name: 'Patient' });
      if (!S.f('patient_thanks')) {
        E.flag('patient_thanks', true);
        await E.say('vm4', 'neutral', 'Take this. It\'s not much, but I won\'t need it lying in here.', { name: 'Patient' });
        E.give('chakra_pill', 1);
      }
      return;
    }
    await E.say('vm4', 'hurt', U.pick([
      'The doctors say my chakra will come back in a week. Feels like I ran a hundred missions at once.',
      'I only remember a pale mask... and a cold feeling, like the moon was drinking me.',
    ]), { name: 'Patient' });
  };

  SC.hospital_shelf = async (E) => {
    await E.think('naruto', 'neutral', '"Advanced Medical Ninjutsu", "Poisons of the Five Nations", "Anatomy of the Chakra Network"... Sakura-chan read all of these?');
    if (!S.f('hospital_shelf')) {
      E.flag('hospital_shelf', true);
      await E.narrate('A box of spare supplies is tucked behind the books. A sticky note reads: "For Naruto — you WILL need these. — S."');
      E.give('antidote', 2);
      E.give('med_scroll', 1);
    }
  };

  // ============================== SHOPS & INN ==============================
  SC.store_talk = async (E) => {
    await E.say('merchant', 'happy', daily([
      'Welcome! Pills, tags, sweets for your sweetheart — I\'ve got it all.',
      'Ah, Naruto! Soldier pills are on special. Chestnuts are fresh, too.',
      'Welcome, welcome! Mind the display — Lee knocked it over last week doing handstand laps.',
    ], 'store'), { name: 'Shopkeeper' });
    await E.shop(NR.SHOPS.store, { title: 'General Store' });
  };

  SC.okami_talk = async (E) => {
    const nightDate = S.night() && ((S.qs('r_hinata') === 2 && S.aff('hinata') >= 60) || (S.qs('r_tsunade') === 2 && S.aff('tsunade') >= 60));
    await E.say('okami', 'happy', nightDate
      ? 'Oh my, good evening. Someone reserved the private bath tonight... I wonder who they\'re waiting for? Ohoho.'
      : daily([
        'Welcome to the Moonrise Inn, dear. The baths are through the curtain in the back.',
        'Good to see you, Naruto. Lady Tsunade is in the gaming room... as usual.',
        'Welcome, welcome! Would you like a room? The futons are freshly aired.',
      ], 'okami'));
    for (;;) {
      const i = await E.choice(['Buy something', 'Rest (80 ryo)', 'About the baths', 'Leave'], { cancel: 3 });
      if (i === 0) {
        await E.shop(NR.SHOPS.inn, { title: 'Moonrise Inn' });
        continue;
      }
      if (i === 1) return NR.innRest(E);
      if (i === 2) {
        await E.say('okami', 'neutral', 'The outdoor baths are fed by a hot spring under the mountain. Good for chakra, good for the skin, good for the heart.');
        await E.say('okami', 'flirty', 'And the private bath can be reserved for two, if you ever have someone special in mind.');
        continue;
      }
      return;
    }
  };

  SC.inn_guest = async (E) => {
    await E.say('vf1', 'happy', U.pick([
      'I came all the way from the Land of Tea for these baths. Worth every step.',
      'The Hokage\'s advisor lost forty thousand ryo at dice last night. Or was it the former Hokage? The blonde one.',
      'Is it true the Seventh Hokage candidate eats ramen three times a day? That\'s so... dedicated.',
      'The okami says the private bath is booked most nights now. Konoha must be a romantic place.',
    ]), { name: 'Traveller' });
  };

  SC.bather_talk = async (E) => {
    await E.say('vm3', 'happy', 'Ahh... nothing like a hot soak. Young man, this is the men\'s side. The ladies\' side is over that bamboo fence.', { name: 'Old Bather' });
    const i = await E.choice(['Why are you telling me that?', 'Enjoy your bath, old man']);
    if (i === 0) {
      await E.say('vm3', 'serious', 'Because the last fellow who "accidentally" climbed it was punched clear over the Hokage Monument. Lady Tsunade doesn\'t miss.', { name: 'Old Bather' });
      await E.say('naruto', 'sad', '...Pervy Sage, I think I know where your old spot was.');
    } else await E.say('vm3', 'happy', 'Bah! Kids these days. Polite AND handsome. Unbearable.', { name: 'Old Bather' });
  };
})();
