// Tsunade's second romance chapter, "The Slug Princess's Secret", unlocked after her first
// route. Four scenes, then nights at her house. Tsunade (56) and Naruto (22) are adults.
// Intimate moments are written as sensual romance and fade to black; with "Mature romance
// scenes" off in Settings they are summarised instead.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const S = NR.S;
  const SC = NR.SCRIPTS;
  const G = () => NR.game;
  const Q = 'r_tsunade2';
  const st = () => S.qs(Q);
  const done = () => S.qd(Q);

  // ---------- where she is ----------
  // Away from the inn while her story waits for you somewhere else.
  NR.tsunadeAway = () => {
    if (!G().qDone('r_tsunade')) return false;
    if (S.night() && (st() === 0 || st() === 2)) return true; // research wing / hidden grotto
    if (S.eve() && (st() === 3 || done())) return true; // at home in the evening
    return false;
  };
  const canStart = () => G().qDone('r_tsunade') && st() < 0 && !done() && S.ch() >= 2 && !(S.ch() === 4 && S.qs('main4') <= 1);
  NR.tsunadeMark = () => (canStart() || (st() === 1 && S.eve()) ? 'heart' : null);

  // ---------- helpers ----------
  async function blackout(E, text) {
    await E.fadeOut(1400);
    E.clearStage();
    await E.narrate(text);
  }
  async function summary(E, text, key, replay) {
    await E.narrate(text);
    if (!replay) E.unlock(key);
  }
  const CHAT = [
    [['flirty', 'You keep looking at my mouth, brat. Ask, or stop staring.'], ['happy', 'Shizune thinks I\'ve been sleeping better. I told her it\'s the new pillows.'], ['love', 'I caught myself humming this morning. Humming! This is your fault.']],
    [['flirty', 'If you keep smiling at me like that in public, people are going to talk.', 'love', '...Let them.'], ['happy', 'I won three hands of cards yesterday. Three! I think you rubbed off on me.'], ['blush', 'Stop that. You know exactly what that look does to me.']],
    [['love', 'Every night I tell myself I\'m too old for this. Every morning I wake up grinning.'], ['flirty', 'Come here. No — closer. There.'], ['love', 'You make me feel like I did at twenty. Worse: you make me feel like I did at fifteen.']],
  ];

  // ---------- talk ----------
  const baseTalk = SC.tsunade_talk;
  SC.tsunade_talk = async (E, self) => {
    if (!G().qDone('r_tsunade') || S.qs('main2') === 1) return baseTalk(E, self);
    if (await NR.bondVisit(E, 'tsunade')) return;
    if (canStart()) return NR.STORY.tsunadeStart(E);
    await NR.romanceTalk(E, 'tsunade', {
      chat: CHAT,
      questOption: () => {
        const s = st();
        if (s === 0) return { label: 'About tonight...', heart: true, run: (E) => E.say('tsunade', 'flirty', 'The hospital. Research wing, top floor, after dark. Bring those steady hands of yours.') };
        if (s === 1) return S.eve() ? { label: 'The rematch', heart: true, run: (E) => NR.STORY.tsunade5(E) } : { label: 'A rematch?', heart: true, run: (E) => E.say('tsunade', 'flirty', 'This evening. My private room. My dice, my rules. Don\'t be late.') };
        if (s === 2) return { label: 'About your note...', heart: true, run: (E) => E.say('tsunade', 'blush', 'Not here. Tonight — the grotto north of the forest pond. You\'ll see the steam.') };
        if (s === 3) return { label: 'About dinner...', heart: true, run: (E) => E.say('tsunade', 'happy', 'My house, right next to this inn. Come in the evening. Bring an appetite... and low expectations.') };
        return null;
      },
    });
  };

  NR.STORY.tsunadeStart = async (E) => {
    await E.say('tsunade', 'hurt', 'Ugh. Don\'t mind me. I\'ve been in the hospital research wing every night translating Uzumaki seal notes.');
    await E.say('tsunade', 'angry', 'Four hundred pages. Written by someone with the handwriting of a drunk spider.');
    await E.say('tsunade', 'flirty', 'My neck is made of stone. If a certain brat with steady hands happened to drop by tonight... I wouldn\'t throw him out.');
    await E.say('naruto', 'blush', 'Is that... an invitation?');
    await E.say('tsunade', 'love', 'It\'s a prescription. Doctor\'s orders.');
    E.quest(Q, 0);
    E.aff('tsunade', 3);
  };

  // ============================ 1. Night Shift ============================
  SC.tsunade_lab = async (E) => NR.STORY.tsunade4(E);
  NR.STORY.tsunade4 = async (E, replay) => {
    await E.backdrop('hospital_night');
    E.bgm('night');
    if (!E.romanceOn()) {
      await summary(E, 'You find Tsunade buried in scrolls in the research wing and work the knots out of her shoulders. One thing leads to another, and the lamp is still burning when the sun comes up.', 'tsunade_4', replay);
      return finish4(E, replay);
    }
    await E.narrate('The research wing is silent except for the scratch of a brush. Lamplight, towers of scrolls, and one very tired legend.');
    await E.say('tsunade', 'serious', 'Look at this seal notation. Whoever wrote it drew every stroke backwards, on purpose, to annoy me personally.');
    await E.say('tsunade', 'hurt', '...Ow. My neck. Don\'t laugh. A hundred battles, and it\'s paperwork that finally takes me down.');
    const i = replay ? 0 : await E.choice([{ label: 'Let me give you a massage.', heart: true }, 'You should really go to bed.']);
    if (i === 0) await E.say('tsunade', 'flirty', 'Hoh? Those clumsy hands? ...Fine. But I\'m the greatest medic alive — I\'ll know if you do it wrong.');
    else await E.say('tsunade', 'flirty', 'To bed? Alone, with a neck like this? Get over here and make yourself useful first.');
    E.bgm('romance');
    await E.narrate('She loosens the tie of her haori and lets it slide down her arms. Beneath it, her shoulders are knotted like old rope.');
    await E.say('tsunade', 'neutral', 'Thumbs here, either side of the spine. Now push a little chakra in. Gently... gently.');
    let hits = 3;
    if (!replay) hits = (await E.minigame('timing', { theme: 'palm', title: 'Pressure Points', rounds: 4, speed: 0.75, zone: 0.26, partner: 'tsunade' })).hits;
    if (hits >= 3) await E.say('tsunade', 'love', 'Mmh... where did you learn to — ah. Right there. Don\'t you dare stop.');
    else await E.say('tsunade', 'happy', 'Ow! That\'s my collarbone, not a pressure point. ...Here. Let me show you.');
    await E.narrate('Her hand closes over yours and guides it lower, into the warm hollow between her shoulder blades. She lets out a long, unguarded sigh — the kind nobody in the village has ever heard from the Fifth Hokage.');
    await E.say('tsunade', 'blush', '...You\'re good at this. Suspiciously good.');
    await E.say('naruto', 'blush', 'I just pay attention to you. I always have.');
    await E.narrate('The chair creaks as she turns to face you. Lamplight catches the diamond on her forehead, and the loosened collar of her robe.');
    await E.say('tsunade', 'flirty', 'My turn. You\'ve been carrying this whole village on your shoulders since you were twelve.');
    await E.narrate('Her palms settle on your chest, warm with healing chakra, and every ache you didn\'t know you had melts away. Then her fingers curl into your collar and pull.');
    await E.say('tsunade', 'love', 'Naruto. Lock the door.');
    await E.say('naruto', 'surprised', 'The — the door?');
    await E.say('tsunade', 'flirty', 'I\'m a medical ninja. I can hear exactly how fast your heart is beating. Lock. The. Door.');
    await E.narrate('The lock clicks. Scrolls slide off the desk and roll across the floor, and nobody bothers to pick them up.');
    await blackout(E, 'The lamp burns low, then out. Somewhere downstairs a night nurse hears a thump from the research wing, considers investigating, and very wisely decides she heard nothing at all.');
    await E.backdrop('hospital_night', { fade: false });
    await E.fadeIn(1100);
    await E.narrate('Dawn. You wake on the floor of the research wing, tangled in Tsunade\'s green haori, with ink on your cheek.');
    await E.say('shizune', 'surprised', 'Lady Tsunade? Are you in there? The door\'s locked... Were you here ALL night?');
    await E.say('tsunade', 'surprised', 'R-research! Very... hands-on research! Out in a minute, Shizune!');
    await E.say('tsunade', 'flirty', 'Window. Now. ...And Naruto? The dice table at the inn. This evening. I want a rematch.');
    await E.narrate('You leave by the window, three floors up, grinning like an idiot the whole way down.');
    return finish4(E, replay);
  };
  async function finish4(E, replay) {
    await E.backdrop(null);
    if (replay) return;
    E.unlock('tsunade_4');
    E.aff('tsunade', 12);
    E.quest(Q, 1);
    E.nextDay();
    E.give('med_scroll', 2, true);
    await E.transfer('konoha', 39, 21, 'down');
  }

  // ============================ 2. Forfeit Dice ============================
  const HER = [
    ['Her hair ties', 'She pulls the ties from her hair, and it spills down her back in two golden waves.'],
    ['Her haori', 'The green haori with the 賭 on its back slides off her shoulders and pools on the tatami.'],
    ['Her obi', 'She tugs the knot of her sash loose, slowly, holding your eyes the whole time. The yukata stays closed — barely.'],
    ['Her dignity', 'She laughs, throws the dice cup over her shoulder, and crawls across the tatami to sit in your lap.'],
  ];
  const HIS = [
    ['tsunade', 'flirty', 'That orange monstrosity. Off.'],
    ['tsunade', 'happy', 'The forehead protector. I want to see your face properly.'],
    ['tsunade', 'flirty', 'The shirt. For medical reasons. I need to inspect your... chakra pathways.'],
    ['tsunade', 'love', 'I\'ll take a kiss. A real one. Now.'],
  ];
  const SECRETS = [
    'I cheat at dice. Badly. That\'s the only reason I ever lose.',
    'The first time I saw you as a man and not a brat was at the peace summit. You wore a suit. I needed three cups of sake.',
    'I kept every letter you ever wrote Jiraiya about becoming Hokage. He gave them to me before he left.',
    'Since the night at the baths, I\'ve been leaving my window unlocked. Just in case.',
  ];
  NR.STORY.tsunade5 = async (E, replay) => {
    await E.backdrop('inn_room');
    E.bgm('romance');
    E.outfit('kimono');
    if (!E.romanceOn()) {
      await summary(E, 'Tsunade challenges you to dice with forfeits in her private room. The stakes get sillier with every round, the sake runs out, and you both lose track of the score before morning.', 'tsunade_5', replay);
      return finish5(E, replay);
    }
    await E.say('tsunade', 'flirty', 'You came. Good. Close the screen behind you.');
    await E.say('tsunade', 'happy', 'Cho-han. One throw a round. The loser pays a forfeit — winner\'s choice. A secret, a cup of sake... or something they\'re wearing.');
    await E.say('naruto', 'surprised', 'Something they\'re — Granny!');
    await E.say('tsunade', 'angry', 'Call me Granny again and the next forfeit is your dignity.');
    await E.say('tsunade', 'flirty', 'Scared? I\'ve lost at dice for forty years, brat. The odds are on your side.');
    let mine = 0, hers = 0;
    for (let r = 0; r < 4; r++) {
      let won = r % 2 === 0;
      if (!replay) won = (await E.minigame('dice', { need: 1, maxRounds: 1, luck: 0.55, title: `Forfeit Dice — round ${r + 1} of 4` })).won;
      if (won) {
        hers++;
        await E.say('tsunade', 'surprised', ['Tch. Beginner\'s luck.', 'Again?! These dice are rigged.', 'You\'re enjoying this far too much.', '...Fine. FINE.'][r]);
        const k = replay ? 2 : await E.choice(['Tell me a secret.', 'Drink!', { label: HER[hers - 1][0], heart: true }]);
        if (k === 0) await E.say('tsunade', 'blush', SECRETS[r]);
        else if (k === 1) {
          await E.narrate('She tips the cup back in one smooth swallow and sets it down with a satisfied clack.');
          await E.say('tsunade', 'flirty', 'Is that all? You\'ll have to try harder than that to get me drunk.');
        } else {
          await E.narrate(HER[hers - 1][1]);
          if (hers >= 3) await E.say('tsunade', 'flirty', 'Eyes up here, brat. ...Or don\'t.');
        }
      } else {
        mine++;
        await E.say('tsunade', 'happy', ['Ha! Pay up.', 'The legendary sucker strikes back!', 'Oh, I\'m on a streak now.', 'Now THIS is luck.'][r]);
        const [w, emo, text] = HIS[mine - 1];
        await E.say(w, emo, text);
        await E.narrate(['Your jacket lands on the pile. She hangs it over her own shoulders like a trophy.', 'You untie your headband. She reaches over and pushes the hair out of your eyes, very slowly.', 'The shirt goes. She doesn\'t even pretend to look away, and her "examination" involves a lot more touching than medicine requires.', 'She leans across the table and takes her kiss — long, slow, and tasting of plum wine.'][mine - 1]);
      }
    }
    await E.narrate('By the last throw, the tatami is a battlefield of forfeits and the lantern has burned down to a low red glow.');
    await E.say('tsunade', 'love', 'I haven\'t cheated once tonight. Do you know what that means?');
    await E.say('naruto', 'happy', 'That you\'re finally lucky?');
    await E.say('tsunade', 'blush', 'That I wanted to lose to you.');
    await E.narrate('She pulls the last knot of her yukata free and lets it slip from one shoulder. She doesn\'t fix it.');
    await E.say('tsunade', 'flirty', 'One more round, Naruto. No dice this time. Winner takes all.');
    await blackout(E, 'The lantern gutters out. Out in the corridor, Okami-san quietly hangs a sign on the door: DO NOT DISTURB — by order of the Fifth.');
    await E.backdrop('inn_room', { fade: false });
    E.outfit('night');
    await E.fadeIn(1100);
    await E.narrate('Morning light glows through the shoji. Tsunade is already awake, propped on one elbow under the quilt, watching you sleep.');
    await E.say('tsunade', 'love', 'You snore like a toad summon.');
    await E.say('naruto', 'happy', 'You stole the whole blanket.');
    await E.say('tsunade', 'happy', 'Spoils of war.');
    await E.narrate('She tucks a folded note into the pocket of your jacket and presses your hand over it.');
    await E.say('tsunade', 'serious', 'Read it when you\'re alone. And come alone.');
    E.outfit(null);
    return finish5(E, replay);
  };
  async function finish5(E, replay) {
    await E.backdrop(null);
    if (replay) return;
    E.unlock('tsunade_5');
    E.aff('tsunade', 12);
    E.give('k_tsunade_note');
    E.quest(Q, 2);
    E.nextDay();
  }

  // ============================ 3. Her True Face ============================
  SC.tsunade_spring = async (E) => NR.STORY.tsunade6(E);
  NR.STORY.tsunade6 = async (E, replay) => {
    await E.backdrop('hidden_spring');
    E.bgm('romance');
    if (!E.romanceOn()) {
      await summary(E, 'In a hidden grotto spring, Tsunade lets go of the Transformation she has held for thirty years and shows you her true face. You tell her she is beautiful, and you mean it. The night belongs to the two of you.', 'tsunade_6', replay);
      return finish6(E, replay);
    }
    E.outfit('onsen');
    await E.narrate('Steam rolls off the water in slow silver waves. Tsunade sits on the warm stones at the edge, feet in the spring, a sake cup forgotten beside her.');
    await E.say('tsunade', 'happy', 'You found it. Jiraiya, Orochimaru and I stumbled on this place when we were thirteen. We swore never to show anyone.');
    await E.say('tsunade', 'sad', 'They\'re both gone now. I suppose that makes it mine to share.');
    await E.say('naruto', 'serious', 'Why did you bring me here?');
    await E.say('tsunade', 'serious', 'Because I\'m tired of lying to you.');
    await E.narrate('She forms a single hand seal. For thirty years she has held one jutsu every waking moment, even in her sleep. Now she lets it go.');
    E.sfx('heal');
    E.flash('#ffffff', 0.45);
    E.outfit('onsen+aged');
    await E.narrate('The years settle over her like falling snow: silver threads through her golden hair, fine lines at the corners of her eyes, the soft marks of every smile and every grief she has survived.');
    await E.say('tsunade', 'sad', 'This is me. The real Tsunade. Fifty-six, and every one of those years is written on my face.');
    await E.say('tsunade', 'hurt', 'Go on. Say something. Or don\'t — you can leave. I would understand.');
    const i = replay ? 0 : await E.choice([{ label: 'You\'re beautiful.', heart: true }, { label: 'Why did you ever hide this?', heart: true }, 'I\'m not going anywhere.']);
    if (i === 0) {
      await E.say('naruto', 'love', 'You\'re beautiful, Tsunade. You always were. But this is you — and this is better.');
      await E.say('tsunade', 'sad', '...Liar.');
      await E.say('naruto', 'serious', 'I never lie. That\'s my nindo.');
    } else if (i === 1) {
      await E.say('naruto', 'serious', 'Every one of those lines is something you lived through. I want to know all of them. Every single one.');
      await E.say('tsunade', 'sad', 'That could take a very long time.');
      await E.say('naruto', 'love', 'Good.');
    } else {
      await E.say('naruto', 'love', 'I\'m not going anywhere. Not tonight. Not ever.');
    }
    await E.say('tsunade', 'love', '...You stupid, wonderful brat.');
    await E.narrate('She slides into the water and comes to you through the steam. The kiss is nothing like the teasing kisses at the inn — it is slow, and deep, and a little afraid: the kiss of someone who has finally stopped hiding.');
    await E.narrate('Your hands find her waist beneath the warm water. Her fingertips trace the whisker marks on your cheeks, the old scars on your shoulders, the seal on your stomach, as if she is memorising you.');
    await E.say('tsunade', 'love', 'Don\'t let go of me.');
    await E.say('naruto', 'love', 'Never.');
    await blackout(E, 'Beneath the grotto\'s hidden moon, the old spring keeps its oldest secret — and one new one.');
    await E.backdrop('hidden_spring', { fade: false });
    await E.fadeIn(1100);
    await E.narrate('Much later, you lie together on the warm stones wrapped in her green haori, listening to the waterfall.');
    await E.say('tsunade', 'love', 'I think I\'ll keep this face. With you, at least.');
    await E.say('tsunade', 'flirty', 'Come to my house tomorrow evening. I\'ll cook.');
    await E.say('naruto', 'surprised', 'You can cook?');
    await E.say('tsunade', 'happy', 'No. It\'ll be a disaster. Come anyway.');
    E.outfit(null);
    return finish6(E, replay);
  };
  async function finish6(E, replay) {
    await E.backdrop(null);
    if (replay) return;
    E.unlock('tsunade_6');
    E.aff('tsunade', 15);
    if (S.has('k_tsunade_note')) E.take('k_tsunade_note');
    E.quest(Q, 3);
    E.nextDay();
  }

  // ============================ 4. Stay ============================
  SC.tsunade_house_door = async (E) => {
    const open = (done() && S.has('k_tsunade_key')) || (st() === 3 && S.eve());
    if (open) {
      NR.audio.sfx('door');
      await E.transfer('tsunade_house', 3, 7, 'up');
      return;
    }
    if (st() === 3) return E.think('naruto', 'neutral', 'Tsunade\'s house. She said dinner is in the evening... I\'ll come back then.');
    await E.think('naruto', 'neutral', G().qDone('r_tsunade') ? 'A green noren with 綱 on it. Lady Tsunade\'s house. The door is locked.' : 'A house with a green noren. The door is locked.');
  };
  SC.tsunade_home = async (E) => {
    if (st() === 3) return NR.STORY.tsunade7(E);
    await NR.romanceTalk(E, 'tsunade', {
      greet: (E) => E.say('tsunade', 'love', U.pick(['There you are. Shoes off, sit down, I\'ll pour.', 'Welcome home, brat. ...I like the sound of that.', 'I was just thinking about you. Don\'t let it go to your head.'])),
      chat: CHAT,
      extra: () => (S.night() ? [{ label: 'Stay the night', heart: true, run: (E) => NR.STORY.tsunadeNight(E) }] : [{ label: 'Stay until night', heart: true, run: async (E) => { await E.say('tsunade', 'flirty', 'Hmm. Help me with the dishes and I\'ll think about it.'); await E.rest('night'); await E.say('tsunade', 'love', 'Look at that. It got dark. Whatever shall we do?'); return false; } }]),
    });
  };
  SC.tsunade_futon = async (E) => {
    if (done() && S.night() && E.actor('tsunade_home')) return NR.STORY.tsunadeNight(E);
    await E.think('naruto', 'blush', 'Her futon. It smells like her perfume... Focus, Naruto.');
  };
  NR.STORY.tsunade7 = async (E, replay) => {
    await E.backdrop('tsunade_room');
    E.bgm('romance');
    if (!E.romanceOn()) {
      await summary(E, 'Tsunade cooks you a gloriously burnt dinner and, over the sake, asks you to stay — not just tonight. You say yes. In the morning she gives you the key to her house.', 'tsunade_7', replay);
      return finish7(E, replay);
    }
    E.outfit('night');
    await E.narrate('Her house smells of incense, good sake, and something very burnt.');
    await E.say('tsunade', 'angry', 'Don\'t. Say. Anything. The tempura fought back.');
    await E.say('naruto', 'happy', 'It\'s perfect. It\'s the most perfect burnt tempura I\'ve ever seen.');
    await E.say('tsunade', 'happy', 'Liar. ...Eat it anyway.');
    await E.narrate('You eat. You laugh. The sake is excellent, the rice is edible, and she is wearing a dark silk robe that she keeps pretending not to notice you noticing.');
    await E.say('tsunade', 'sad', 'Nawaki. Dan. Jiraiya. Everyone I\'ve ever loved has died, Naruto. So I stopped letting anyone close. Fewer funerals.');
    await E.say('tsunade', 'serious', 'Then a loud brat in an orange jumpsuit yelled at me that he\'d be Hokage, and I bet my grandfather\'s necklace on him.');
    await E.say('naruto', 'serious', 'You won that bet.');
    await E.say('tsunade', 'love', 'I did. So here\'s another one.');
    await E.say('tsunade', 'blush', 'Stay. Not just tonight. Stay with me.');
    const i = replay ? 0 : await E.choice([{ label: 'I\'ll stay.', heart: true }, { label: 'Only if you stop calling me brat.', heart: true }, 'Are you sure? I\'m still... me.']);
    if (i === 0) await E.say('tsunade', 'love', '...Good. That\'s good.');
    else if (i === 1) {
      await E.say('tsunade', 'flirty', 'Not a chance, brat.');
      await E.narrate('She kisses you anyway, laughing against your mouth.');
    } else await E.say('tsunade', 'love', 'You\'re the one thing I\'m sure about.');
    await E.narrate('She rises, takes your hand, and leads you past the screen to where the futon waits, turned down, with candles burning low on either side.');
    await E.narrate('The silk sash slips free between her fingers. In the candlelight she is neither the Fifth Hokage nor the Legendary Sannin — only Tsunade, smiling at you like you are the best bet she ever made.');
    await E.say('tsunade', 'love', 'Come here, Naruto.');
    await blackout(E, 'The candles burn down one by one. Neither of you notices when the last one goes out.');
    await E.backdrop('bedroom_morning', { fade: false });
    await E.fadeIn(1100);
    await E.narrate('You wake to the smell of burning eggs. Tsunade is at the stove wearing nothing but your orange jacket, swearing softly at a frying pan.');
    await E.say('tsunade', 'happy', 'Don\'t look at me like that. It was cold.');
    await E.say('naruto', 'love', 'It looks better on you.');
    await E.say('tsunade', 'love', 'Everything does, brat.');
    await E.say('tsunade', 'blush', 'Here. My spare key — come home whenever you like. And this... my grandmother Mito\'s hairpin. She would have liked you. She had terrible taste in men too.');
    E.outfit(null);
    return finish7(E, replay);
  };
  async function finish7(E, replay) {
    await E.backdrop(null);
    if (replay) return;
    E.unlock('tsunade_7');
    E.aff('tsunade', 20);
    E.give('k_tsunade_key');
    if (!S.has('charm_tsunade2')) E.give('charm_tsunade2');
    E.complete(Q);
    E.nextDay();
  }

  // ============================ nights at her house ============================
  const NIGHTS = [
    ['By the open window you share the last of the good sake and watch the moon climb over the Hokage Monument. Somewhere between the second cup and the third, her head ends up on your shoulder, then her lips at your ear.', 'tsunade', 'love', 'Take me to bed, Naruto. That\'s an order from the Fifth.'],
    ['She comes home stiff and sore from a day of teaching Sakura\'s medics. You spend a long time working the knots out of her back, until her sighs turn into something else entirely.', 'tsunade', 'flirty', 'Mmh... you\'re getting far too good at that. Come here and let me return the favour.'],
    ['The wooden tub in her washroom is barely big enough for one. You make it work for two. The water is scalding, the steam is thick, and she laughs every time your knees bump.', 'tsunade', 'love', 'Stay right there. Don\'t you dare move.'],
    ['She tells you about Jiraiya\'s very worst pickup lines until you\'re both crying with laughter on the futon. Then she stops laughing and just looks at you for a long moment.', 'tsunade', 'love', 'I used to think happiness was something that happened to other people. Kiss me.'],
  ];
  NR.STORY.tsunadeNight = async (E) => {
    await E.backdrop('tsunade_room');
    E.bgm('romance');
    const n = NIGHTS[G().state.day % NIGHTS.length];
    if (!E.romanceOn()) {
      await E.narrate('You spend a warm, quiet night at Tsunade\'s house.');
      await E.fadeOut(800);
    } else {
      E.outfit('night');
      await E.narrate(n[0]);
      await E.say(n[1], n[2], n[3]);
      await blackout(E, U.pick(['The candles gutter and go out.', 'Moonlight slides across the tatami, and the night grows very warm.', 'Outside, the village sleeps. Inside, nobody does for quite a while.']));
      E.outfit(null);
    }
    await E.backdrop(null, { fade: false });
    E.heal();
    const first = G().state.talked.tsunade_night !== G().state.day;
    E.nextDay();
    await E.fadeIn(900);
    await E.narrate('Morning. Tsunade is still asleep, one arm thrown across your chest. Your whole party feels rested.');
    if (first) {
      G().state.talked.tsunade_night = G().state.day;
      E.aff('tsunade', 2);
    }
  };

  // ============================ the grotto ============================
  SC.hidden_spring_enter = async (E) => {
    if (st() === 2 && !S.night()) await E.think('naruto', 'neutral', 'So this is the place in her note. She said tonight... I\'ll come back after dark.');
  };
  SC.spring_bathe = async (E) => {
    const i = await E.choice(['Soak in the spring (full recovery)', 'Not now']);
    if (i !== 0) return;
    await E.fadeOut(500);
    G().fullHeal();
    NR.audio.sfx('heal');
    await E.wait(400);
    await E.fadeIn(500);
    await E.narrate(done() ? 'The water is exactly as warm as you remember. You can almost hear her laughing.' : 'The hot water soaks the ache out of every muscle. HP and chakra fully restored.');
  };

  // ============================ memories ============================
  const MEM = { 4: 'tsunade4', 5: 'tsunade5', 6: 'tsunade6', 7: 'tsunade7' };
  for (const k in MEM) {
    SC['memory_tsunade_' + k] = async (E) => {
      await NR.STORY[MEM[k]](E, true);
      await E.backdrop(null, { fade: false });
    };
  }
})();
