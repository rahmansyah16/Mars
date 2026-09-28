// Main story. Five chapters and an epilogue.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const S = NR.S;
  const SC = NR.SCRIPTS;
  const G = () => NR.game;
  const K = (E, emo, text) => E.say('kurama', emo, text, { style: 'talk', name: 'Kurama (inside)' });

  // ================= PROLOGUE =================
  SC.intro = async (E) => {
    NR.engine.fade.a = 1;
    E.hide('player');
    E.bgm('title');
    await E.wait(300);
    await E.title('NARUTO: SEVENTH DAWN', 'Five years after the Fourth Great Ninja War', 3200);
    await E.narrate('Five years have passed since the Fourth Great Ninja War. The five great nations have found an uneasy, precious peace.');
    await E.narrate('In the Village Hidden in the Leaves, the young man who ended that war is twenty-two now: a Jonin, a hero, the favourite to become the next Hokage...');
    await E.narrate('...and still [y]terrible[/y] at waking up.');
    await K(E, 'neutral', 'Oi. Brat.');
    await K(E, 'angry', 'NARUTO. Wake up before I set your futon on fire.');
    await E.say('naruto', 'neutral', 'Mmmh... five more minutes, Kurama...', { noPortrait: true });
    await K(E, 'angry', 'You said that an hour ago.');
    E.sfx('door');
    E.shake(6, 0.3);
    await E.say('sakura', 'angry', 'NARUTO!!!', { noPortrait: true });
    E.bgm('village');
    E.place('player', 2, 4, 'down');
    E.show('player');
    const sakura = E.spawn({ key: 'sakura_intro', char: 'sakura', x: 5, y: 8, dir: 'up' });
    await E.fadeIn(600);
    await E.move(sakura, 'uu');
    await E.move(sakura, 'lllu');
    E.faceEach('player', sakura);
    await E.say('sakura', 'angry', 'Do you have ANY idea what time it is? Kakashi-sensei was expecting you at the Hokage Tower at eight!');
    await E.jump('player');
    await E.say('naruto', 'surprised', 'S-Sakura-chan?! What time is it now?');
    await E.say('sakura', 'serious', 'Ten.');
    await E.say('naruto', 'happy', '...Believe it?');
    E.sfx('crit');
    E.shake(14, 0.4);
    E.flash('#ffffff', 0.6);
    await E.emote('player', 'sweat', 700);
    await E.say('naruto', 'hurt', 'Ow ow ow! Okay! I\'m going, I\'m going!');
    await E.say('sakura', 'blush', 'Honestly... The hero of the Fourth War, sleeping in a nest of instant ramen cups.');
    await E.say('sakura', 'serious', 'Put on a clean jacket. It\'s important — something is happening in the Outer Forest.');
    await E.say('sakura', 'happy', 'I\'ve got a shift at the hospital. Come find me after you see Kakashi-sensei, okay?');
    await E.move(sakura, 'drrrdd');
    E.sfx('door');
    E.remove(sakura);
    await E.wait(300);
    await K(E, 'flirty', 'She likes you, you know.');
    await E.say('naruto', 'blush', 'W-what?! Sakura-chan? We\'re just — she\'s my teammate!');
    await K(E, 'neutral', 'Hmph. Five years of peace and you still can\'t read a single woman\'s heart. Not hers. Not the Hyuga girl\'s. Not any of them.');
    await E.say('naruto', 'surprised', '...What\'s that supposed to mean?');
    await K(E, 'happy', 'Figure it out, brat. You have time now. That\'s what peace is for.');
    await E.narrate('[y]How to play:[/y] Arrow keys / WASD to move · Z / Enter / Space to talk and examine · X / Esc for the menu · Shift to run. You can also click to walk.');
    await E.narrate('Save any time from the menu. [p]Spend time with the people of Konoha[/p] — bonds are a shinobi\'s greatest strength. Characters with a [p]♥[/p] above them have a story to share.');
    E.chapter(1);
    E.flag('intro_done', true);
    E.quest('main1', 0);
  };

  // ================= CHAPTER 1 =================
  SC.kakashi_talk = async (E, self) => {
    if (NR.bondVisit && (await NR.bondVisit(E, 'kakashi'))) return;
    if (S.qs('r_temari') === 0 && S.has('k_documents') && !S.f('temari_reply')) {
      await E.say('kakashi', 'neutral', 'Documents from Suna? Let\'s see... trade routes, border patrols, a joint Chunin Exam... Temari drives a hard bargain.');
      await E.say('kakashi', 'happy', 'Tell her the Leaf agrees to everything except the part where Shikamaru is "loaned to Suna indefinitely". He\'d die of exhaustion.');
      E.take('k_documents');
      E.flag('temari_reply', true);
      await E.narrate('You received Kakashi\'s signed reply for Temari.');
      return;
    }
    if (S.qs('main1') === 0) return SC.briefing(E);
    if (S.qs('main2') === 0) return SC.report(E);
    if (S.qs('main2') === 3) return SC.morning_meeting(E);
    if (S.ch() >= 6) {
      await E.say('kakashi', 'happy', 'Ah, Lord Seventh. Your desk is the one with the 400 documents on it. Welcome to the job.');
      return;
    }
    const lines = {
      1: ['neutral', 'The Outer Forest is east of the village, past Training Ground 3. Don\'t get cocky out there.'],
      2: ['neutral', 'Tsunade-sama is at the hot springs inn. South-east of the plaza. Try not to call her "granny" to her face.'],
      3: ['serious', 'The hideout is north of the Outer Forest. Hinata\'s Byakugan should find the way in. Be careful, Naruto.'],
      4: ['neutral', 'The team leaves at dawn after the festival. Until then, rest. That\'s an order.'],
      5: ['serious', 'Uzushio... bring everyone home.'],
    };
    const l = lines[S.ch()] || ['neutral', 'Yo.'];
    await E.say('kakashi', l[0], l[1]);
  };

  SC.briefing = async (E) => {
    E.bgm('tension');
    await E.say('kakashi', 'happy', 'Yo. You\'re late.');
    await E.say('naruto', 'angry', 'You\'re one to talk, Kakashi-sensei! You\'ve been late to everything since I was twelve!');
    await E.say('kakashi', 'neutral', 'I\'m the Hokage. I\'m allowed to be late. You, on the other hand, are my successor-in-training. Punctuality is part of the job.');
    await E.say('naruto', 'surprised', 'Wait — successor? You mean...');
    await E.say('kakashi', 'serious', 'We\'ll talk about that later. First, a mission.');
    await E.say('shikamaru', 'serious', 'Three days ago a chunin patrol went missing in the Outer Forest. Yesterday we found two of them near the border. Alive — but completely drained of chakra.');
    await E.say('shizune', 'serious', 'Their chakra networks are intact. It\'s as if someone siphoned the chakra right out of them. And there was a seal burned into their skin — nothing in our records matches it.');
    await E.say('kakashi', 'serious', 'The third chunin is still missing. Find him. And find whoever is doing this.');
    await E.say('kakashi', 'neutral', 'You\'ll need a medic. Sakura is expecting you at the hospital.');
    await E.say('naruto', 'battle', 'Leave it to me! I\'ll bring him back — believe it!');
    await K(E, 'serious', 'Hmph. A seal that eats chakra... I don\'t like the smell of this, Naruto.');
    E.bgm('village');
    E.quest('main1', 1);
  };

  SC.shizune_talk = async (E) => {
    if (NR.bondVisit && (await NR.bondVisit(E, 'shizune'))) return;
    const l = {
      1: ['serious', 'Please be careful out there, Naruto. And if you see Lady Tsunade, remind her that the inn bill is NOT a Hokage office expense.'],
      2: ['neutral', 'Lady Tsunade is at the Moonrise Inn. She\'s probably at the dice tables. She\'s always at the dice tables.'],
      3: ['serious', 'Tonton and I will keep the office running. Go.'],
    }[S.ch()] || ['happy', 'Tonton says hello. She\'s napping under the desk.'];
    await E.say('shizune', l[0], l[1]);
  };

  SC.shikamaru_talk = async (E) => {
    if (NR.bondVisit && (await NR.bondVisit(E, 'shikamaru'))) return;
    if (S.qs('side_ramen') === 0 && S.has('k_ramen3')) {
      await E.say('shikamaru', 'surprised', 'Salt ramen? From Ichiraku? ...You walked all the way up here to deliver lunch?');
      await E.say('shikamaru', 'happy', 'Thanks. Saves me the effort of walking down. You\'re a lifesaver.');
      E.take('k_ramen3');
      NR.checkRamenDone(E);
      return;
    }
    const l = {
      1: ['neutral', 'The forest to the east is a maze. If you get lost, follow the stream — it runs north to south.'],
      2: ['neutral', 'A group that wants to erase chakra itself... what a drag. They must have a big plan to take on the whole world.'],
      3: ['serious', 'The hideout is sealed with three locks, I\'d bet. Enemies love triangles. Don\'t ask me why.'],
    }[S.ch()] || ['neutral', 'What a drag...'];
    await E.say('shikamaru', l[0], l[1]);
  };

  SC.to_forest = async (E) => {
    const s = S.qs('main1');
    if (s < 2 && !S.qd('main1')) {
      await E.think('naruto', 'neutral', 'I shouldn\'t wander into the Outer Forest without a mission. I should see Kakashi-sensei first.');
      return;
    }
    if (s === 2 && !S.party('hinata')) {
      await SC.hinata_joins(E);
      if (!S.party('hinata')) return;
    }
    NR.audio.sfx('step');
    await E.transfer('forest', 1, 18, 'right');
  };

  SC.hinata_joins = async (E) => {
    if (S.qs('main1') !== 2 || S.party('hinata')) return;
    const h = E.actor('hinata_join') || E.spawn({ key: 'hinata_join2', char: 'hinata', x: 29, y: 11, dir: 'left' });
    await E.say('hinata', 'surprised', 'N-Naruto-kun! Sakura-san! Wait!');
    E.face('player', h);
    await E.say('naruto', 'surprised', 'Hinata? What are you doing out here?');
    await E.say('hinata', 'serious', 'I heard about the missing chunin. The clan elders agreed I could help. My Byakugan can see chakra — even drained chakra leaves traces.');
    await E.say('hinata', 'blush', 'P-please... let me come with you.');
    await E.say('sakura', 'happy', 'We\'d be lucky to have her, Naruto.');
    await E.say('naruto', 'happy', 'Of course! Welcome to the team, Hinata!');
    await E.say('hinata', 'blush', 'Th-thank you... I won\'t let you down.');
    E.remove(h);
    E.join('hinata');
    E.aff('hinata', 3);
    E.quest('main1', 3);
  };

  SC.forest_enter = async (E) => {
    if (S.f('forest_intro') || S.qs('main1') !== 3) return;
    E.flag('forest_intro', true);
    await E.say('hinata', 'serious', 'Byakugan!');
    await E.say('hinata', 'serious', 'There are faint chakra traces... they lead south-east, near the big fallen trees. And further north-east there\'s something else. A patch of dead chakra — like a hole in the world.');
    await K(E, 'serious', 'That\'s no ordinary jutsu. Stay sharp, brat.');
    await E.say('sakura', 'neutral', 'The forest is crawling with corrupted animals. If we fight, I\'ll keep everyone patched up.');
  };

  SC.clearing_early = async (E) => {
    E.flag('clearing_warned', true);
    await E.say('hinata', 'serious', 'Wait, Naruto-kun... the chunin\'s chakra trail goes south-west from here. We should find him first — he might not have much time.');
  };

  SC.forest_chunin = async (E) => {
    if (S.f('chunin_found')) return;
    E.flag('chunin_found', true);
    const c = E.actor('chunin');
    await E.say('sakura', 'surprised', 'There! Someone\'s on the ground!');
    E.sfx('heal');
    E.flash('#8fe07a', 0.4);
    await E.say('sakura', 'serious', 'He\'s alive — barely. His chakra is almost gone. Same seal mark as the others.');
    await E.say('chunin', 'hurt', 'A... a man in a mask... white mask, a hollow moon... he took us one by one...', { name: 'Chunin' });
    await E.say('chunin', 'hurt', 'He said the forest\'s chakra wasn\'t enough... that they needed... "the vessel"...', { name: 'Chunin' });
    await E.say('naruto', 'serious', 'The vessel...?');
    await K(E, 'angry', '...');
    await E.say('hinata', 'serious', 'Byakugan! There\'s a strong chakra source in the clearing to the north-east. It\'s pulsing — like a heartbeat.');
    await E.say('sakura', 'neutral', 'I\'ve sent a signal flare. A retrieval team will take him home. Let\'s go — before that thing drains anyone else.');
    await E.fadeOut(400);
    if (c) E.remove(c);
    await E.fadeIn(400);
    E.quest('main1', 4);
  };

  SC.nue_confront = async (E) => {
    if (S.f('nue_defeated') || S.qs('main1') !== 4) return;
    E.bgm('tension');
    const nue = E.actor('nue');
    await E.camera(39, 8, 700);
    await E.say('nue', 'flirty', 'Hm? The Leaf sent its golden boy. How convenient. I was just finishing my meal.');
    await E.cameraReset(500);
    await E.say('naruto', 'angry', 'You\'re the one who\'s been draining people! Why?!');
    await E.say('nue', 'serious', 'Chakra is a curse. Every war, every orphan, every burned village — all of it fuelled by chakra. The Hollow Moon will empty the world of it.');
    await E.say('hinata', 'angry', 'That\'s insane! Chakra flows through every living thing. Without it, everything dies!');
    await E.say('nue', 'neutral', 'Then let the world be quiet.');
    await E.say('nue', 'battle', 'But first... the vessel. Let\'s see how much of the Nine-Tails is left in you, Uzumaki!');
    const r = await E.battle('boss_nue');
    if (r !== 'win') return;
    E.flag('nue_defeated', true);
    await E.say('nue', 'hurt', 'Heh... Kagen-sama was right about you... such... strength...');
    E.sfx('poof');
    E.poof(nue);
    if (nue) E.remove(nue);
    await E.wait(400);
    await E.say('sakura', 'angry', 'He got away! A smoke bomb — coward!');
    await E.say('hinata', 'neutral', 'He dropped something... a mask, and a scroll.');
    E.give('k_mask');
    E.give('k_scroll');
    await K(E, 'serious', 'That seal on the scroll... I\'ve felt it before. Long ago. Mito... Kushina... the Uzumaki.');
    await E.say('naruto', 'surprised', 'Kurama? What do you mean?');
    await K(E, 'serious', 'Take that scroll to your Hokage. Now.');
    E.complete('main1');
    E.chapter(2);
    E.time('day');
    await E.fadeOut(600);
    await E.title('Chapter 2', 'The Hollow Moon', 2400);
    await E.transfer('hokage_office', 6, 7, 'up', { fade: false });
    E.quest('main2', 0);
    await E.fadeIn(600);
    await E.say('sakura', 'neutral', 'Let\'s report to Kakashi-sensei.');
  };

  // ================= CHAPTER 2 =================
  SC.report = async (E) => {
    E.bgm('tension');
    await E.say('naruto', 'serious', 'Kakashi-sensei, we found the chunin. He\'s alive. And the guy responsible dropped these.');
    await E.say('kakashi', 'serious', 'A mask with a hollow crescent moon... "the Hollow Moon".');
    await E.say('shikamaru', 'neutral', 'Never heard of them.');
    await E.say('kakashi', 'serious', 'Neither have I. Which is exactly what worries me.');
    await E.say('shizune', 'surprised', 'This scroll — the seal formula — it looks like Uzumaki fūinjutsu!');
    await E.say('kakashi', 'neutral', 'Then there\'s one person who can read it. Lady Tsunade. She\'s... on vacation. At the Moonrise hot springs inn.');
    await E.say('naruto', 'happy', 'Granny Tsunade\'s drinking again, isn\'t she?');
    await E.say('kakashi', 'happy', 'I said vacation.');
    await E.say('sakura', 'happy', 'Hinata and I will write the mission report and check on the chunin. Go on, Naruto — we\'ll catch up later.');
    await E.say('hinata', 'blush', 'You were amazing today, Naruto-kun... um, see you soon!');
    E.leave('sakura', true);
    E.leave('hinata', true);
    E.aff('sakura', 3, true);
    E.aff('hinata', 3, true);
    E.bgm('village');
    E.quest('main2', 1);
  };

  NR.STORY = NR.STORY || {};
  NR.STORY.tsunadeScroll = async (E) => {
    await E.say('tsunade', 'flirty', 'Oh? If it isn\'t the brat. Come to drink with me? Pull up a cushion.');
    await E.say('naruto', 'angry', 'Granny, this is serious!');
    E.shake(8, 0.3);
    await E.say('tsunade', 'angry', 'Call me "granny" one more time and I\'ll send you through the roof and into the outdoor bath.');
    await E.say('naruto', 'sad', 'S-sorry... Lady Tsunade. Please, look at this scroll.');
    await E.say('tsunade', 'serious', '...');
    await E.say('tsunade', 'serious', 'Uzumaki fūinjutsu. A variant of the Moon Well seal — a formula that draws chakra from an entire region into a single vessel.');
    await E.say('tsunade', 'serious', 'My grandmother, Mito, told me the Uzumaki designed it to contain tailed beasts. It was sealed away when Uzushiogakure fell.');
    await E.say('naruto', 'serious', 'That masked guy said they needed "the vessel".');
    await E.say('tsunade', 'sad', 'Then they need you, Naruto. Or rather — Kurama.');
    await E.say('tsunade', 'neutral', 'Give me the night to decipher the rest of this. Meet me at the Hokage Tower in the morning.');
    await E.say('tsunade', 'flirty', 'And Naruto... enjoy your evening. You never know how many peaceful nights you get in this line of work.');
    await E.say('tsunade', 'love', 'Spend it with someone who makes you smile, hm?');
    E.take('k_scroll');
    E.quest('main2', 2);
    E.time('evening');
    await E.narrate('Evening falls. You have some free time — visit someone special, or head home to sleep when you\'re ready.');
  };

  SC.morning_meeting = async (E) => {
    E.bgm('tension');
    const ts = E.spawn({ key: 'tsunade_mtg', char: 'tsunade', x: 9, y: 4, dir: 'left' });
    const sk = E.spawn({ key: 'sakura_mtg', char: 'sakura', x: 4, y: 5, dir: 'right' });
    const hn = E.spawn({ key: 'hinata_mtg', char: 'hinata', x: 5, y: 6, dir: 'right' });
    await E.say('tsunade', 'serious', 'I stayed up all night with this scroll. It\'s two things: a map and a promise.');
    await E.say('tsunade', 'serious', 'The map: coordinates to a cave north of the Outer Forest, sealed with the same technique as that seal in the clearing.');
    await E.say('tsunade', 'sad', 'The promise: "The Moon Well will wake when Uzumaki blood returns to the whirlpool."');
    await E.say('naruto', 'surprised', 'The whirlpool...?');
    await E.say('tsunade', 'sad', 'Uzushiogakure. The Village Hidden by Whirling Tides. Your mother\'s homeland, Naruto.');
    await E.say('naruto', 'serious', 'Mom\'s...');
    await E.say('kakashi', 'serious', 'Then we move first. Team: Naruto, Sakura, Hinata. Infiltrate the hideout and find out what the Hollow Moon wants. Recon first. Fight only if you must.');
    await E.say('sakura', 'serious', 'Understood.');
    await E.say('hinata', 'serious', 'Yes, Lord Sixth.');
    await E.say('naruto', 'battle', 'Let\'s go take them down, believe it!');
    E.remove(ts);
    E.remove(sk);
    E.remove(hn);
    E.join('sakura', true);
    E.join('hinata', true);
    E.complete('main2');
    E.chapter(3);
    await E.title('Chapter 3', 'Serpent\'s Den', 2400);
    E.quest('main3', 0);
    E.bgm('village');
  };

  // ================= CHAPTER 3 =================
  SC.hideout_barrier = async (E) => {
    await E.think('naruto', 'serious', 'A strange chakra barrier seals the cave. I can\'t get through... yet.');
  };
  SC.enter_hideout = async (E) => {
    if (!S.f('hideout_opened')) {
      E.flag('hideout_opened', true);
      if (!S.party('hinata')) {
        await E.think('naruto', 'serious', 'The entrance... I should come back with the team.');
        return;
      }
      await E.say('hinata', 'serious', 'Byakugan! The barrier is gone, but the cave is full of seal traps. Stay close to me.');
    }
    NR.audio.sfx('door');
    await E.transfer('hideout', 19, 28, 'up');
  };
  SC.hideout_enter = async (E) => {
    E.flag('hideout_entered', true);
    await E.say('hinata', 'serious', 'Byakugan! Three seal locks are feeding a barrier deeper inside — west, east and in the north-west room. We have to break all three.');
    await E.say('sakura', 'neutral', 'And stay together. This place gives me the creeps... it smells like Orochimaru\'s old labs.');
    if (S.qs('main3') === 0) E.quest('main3', 1);
  };
  SC.break_seal = async (E, self, ev) => {
    const n = ev.seal;
    if (S.f('seal' + n)) return;
    if (n === 2 || n === 3) {
      await E.say('hm_soldier', 'angry', 'Intruders at the seal lock! Stop them!', { name: 'Hollow Moon' });
      const r = await E.battle(n === 2 ? 'hideout_c' : 'hideout_e');
      if (r !== 'win') return;
    }
    await E.say('naruto', 'battle', 'Here goes... Rasengan!');
    E.sfx('rasengan');
    E.flash('#b58cff', 0.7);
    E.shake(12, 0.5);
    E.flag('seal' + n, true);
    const count = [1, 2, 3].filter((i) => S.f('seal' + i)).length;
    await E.narrate(`The seal lock shatters. (${count} / 3)`);
    if (count === 3) {
      E.sfx('explosion');
      E.shake(10, 0.8);
      await E.say('hinata', 'happy', 'The barrier in the central hall is gone! The way north is open.');
      E.quest('main3', 2);
      E.refresh();
    }
  };
  SC.hideout_barrier_inner = async (E) => {
    await E.think('naruto', 'serious', 'The barrier hums with chakra. The three seal locks must be powering it.');
  };
  SC.prison_cells = async (E) => {
    await E.say('sakura', 'sad', 'Cells... and restraints with chakra-drain seals. They kept people here. Some of those chunin must have been held in these.');
    await E.say('naruto', 'angry', 'I\'m going to make them pay for this.');
  };
  SC.chest_acad = async (E) => {
    if (S.f('chest_acad')) return E.narrate('The chest is empty.');
    E.flag('chest_acad', true);
    NR.audio.sfx('open');
    E.refresh();
    E.give('k_acadscroll');
    if (S.qs('side_scroll') === 0) E.quest('side_scroll', 1);
    await E.narrate('A scroll stamped with the Academy\'s seal! Iruka will want this back.');
  };
  SC.chest_h2 = async (E) => {
    if (S.f('chest_h2')) return E.narrate('The chest is empty.');
    E.flag('chest_h2', true);
    NR.audio.sfx('open');
    E.refresh();
    E.give('ramen_pork', 2);
    E.give('chakra_pill', 1);
  };

  SC.mizuchi_confront = async (E) => {
    if (S.f('mizuchi_defeated')) return;
    if (!S.f('seal1') || !S.f('seal2') || !S.f('seal3')) return;
    E.bgm('tension');
    const mz = E.actor('mizuchi');
    await E.say('mizuchi', 'flirty', 'Sssso... the vessel comes crawling into the serpent\'s den all by himself. How thoughtful.');
    await E.say('naruto', 'angry', 'Where\'s your boss? This "Kagen" guy?');
    await E.say('mizuchi', 'happy', 'Kagen-sama is preparing the Moon Well. He only needs one thing from you, darling. Your blood... and your little fox.');
    await E.say('sakura', 'angry', 'You\'re not laying a finger on him!');
    await E.say('mizuchi', 'flirty', 'Oh? Jealous? How adorable. There\'s plenty of me to go around.');
    await E.say('hinata', 'angry', 'Eight Trigrams... stance!');
    const r = await E.battle('boss_mizuchi');
    if (r !== 'win') return;
    E.flag('mizuchi_defeated', true);
    E.bgm('sad');
    await E.say('mizuchi', 'hurt', 'You... think... you\'ve won...?');
    const kg = E.spawn({ key: 'kagen_proj', char: 'kagen', x: 20, y: 3, dir: 'down', through: true });
    kg.opacity = 0.65;
    E.sfx('charge');
    E.flash('#8a5aff', 0.5);
    await E.say('kagen', 'neutral', 'Enough, Mizuchi. You\'ve done well.');
    await E.say('naruto', 'angry', 'Who are you?!');
    await E.say('kagen', 'serious', 'I am Kagen. Once I served in the Root, under Danzo. I watched this world set itself on fire with chakra — again, and again, and again.');
    await E.say('kagen', 'serious', 'I intend to put the fire out. Forever.');
    await E.say('kagen', 'neutral', 'Naruto Uzumaki. The Uzumaki blood in your veins is the key to the Moon Well. And the seal beneath your feet...');
    await E.say('kagen', 'battle', '...was drawn for you.');
    E.sfx('kurama');
    E.flash('#8a5aff', 0.9);
    E.shake(18, 1.2);
    await E.emote('player', '!', 600);
    await K(E, 'angry', 'Naruto—! This seal... it\'s cutting me off from you... NARUTO—!');
    await E.say('naruto', 'hurt', 'Ku...rama...!');
    E.flag('kurama_sealed', true);
    await E.say('hinata', 'sad', 'Naruto-kun!!');
    await E.say('sakura', 'hurt', 'His chakra — it\'s being pulled away! Naruto, hold on!');
    await E.say('kagen', 'neutral', 'Come to the whirlpool, son of Kushina. The Moon Well awaits. Bring your precious bonds, if you like — it will make the ending all the more meaningful.');
    await E.fadeOut(1200);
    E.remove(kg);
    if (mz) E.remove(mz);
    E.stopBgm();
    await E.narrate('...');
    await E.narrate('Darkness. And for the first time in years... silence where Kurama\'s voice should be.');
    E.complete('main3');
    E.leave('sakura', true);
    E.leave('hinata', true);
    E.chapter(4);
    G().fullHeal();
    E.time('day');
    await E.title('Chapter 4', 'Bonds of the Leaf', 2600);
    E.quest('main4', 0);
    await E.transfer('hospital', 2, 4, 'down', { fade: false });
    NR.engine.fade.a = 1;
  };

  // ================= CHAPTER 4 =================
  SC.ch4_wake = async (E) => {
    E.flag('ch4_woke', true);
    E.bgm('sad');
    const sk = E.spawn({ key: 'sakura_w', char: 'sakura', x: 3, y: 5, dir: 'up' });
    const ts = E.spawn({ key: 'tsunade_w', char: 'tsunade', x: 1, y: 5, dir: 'up' });
    E.place('player', 2, 4, 'down');
    await E.fadeIn(1000);
    await E.say('sakura', 'sad', 'Naruto...? Naruto! You\'re awake! You\'ve been out for two days, you idiot...');
    await E.say('naruto', 'hurt', 'Sakura-chan... Where... the hideout...?');
    await E.say('tsunade', 'serious', 'You\'re in Konoha Hospital. Your body is fine. But your chakra... the link between you and Kurama has been sealed.');
    await E.say('naruto', 'surprised', 'Kurama? ...Oi, Kurama! ...');
    await E.say('naruto', 'sad', '...He\'s not answering.');
    await E.say('tsunade', 'sad', 'The Hollow Moon\'s seal feeds on isolation. It convinces chakra that it\'s alone. Cut off.');
    await E.say('tsunade', 'serious', 'But the Uzumaki understood something about seals: the strongest ones are anchored in the bonds between people. That\'s how your mother held Kurama, Naruto. Through love.');
    await E.say('naruto', 'serious', 'Bonds...');
    await E.say('tsunade', 'neutral', 'We leave for Uzushiogakure at dawn, the morning after the Lantern Festival. Kakashi is assembling the team.');
    await E.say('tsunade', 'happy', 'Until then — rest. And spend time with the people who matter to you. Every bond you strengthen is a thread they can\'t cut.');
    await E.say('sakura', 'happy', 'Everyone\'s been worried sick about you. Go see them, okay? And... I\'m glad you\'re okay.');
    E.remove(sk);
    E.remove(ts);
    E.vr('bond_visits', 0);
    E.quest('main4', 1);
    E.bgm('village');
    await E.narrate('Visit your friends around Konoha. (Talk to at least four people who matter to you.)');
  };

  // Called by character talk scripts during chapter 4 (visit friends).
  const BOND_LINES = {
    kakashi: [['kakashi', 'serious', 'When I was your age I thought strength came from following the rules. Obito taught me otherwise. You taught me again.'], ['kakashi', 'happy', 'Go and get Kurama back. That\'s your Hokage speaking... and your old sensei.']],
    shikamaru: [['shikamaru', 'neutral', 'I\'ve run the numbers on this mission forty times. Every plan where we win has one thing in common.'], ['shikamaru', 'happy', 'You, being stubborn. So be stubborn, Naruto.']],
    shizune: [['shizune', 'happy', 'Lady Tsunade hasn\'t touched a drop since you were brought in. That\'s how worried she was. Come back safe, Naruto.']],
    lee: [['lee', 'sad', 'Naruto! I heard! I ran four hundred laps around the village to calm down!'], ['lee', 'battle', 'Your flames of youth cannot be sealed! I believe in you, my eternal rival\'s eternal rival!']],
    kiba: [['kiba', 'angry', 'Some creep puts a seal on you and then runs? When you find him, punch him once for me and Akamaru.'], ['akamaru', 'happy', 'Woof!', { name: 'Akamaru' }]],
    iruka: [['iruka', 'sad', 'Naruto... I remember a boy who had no one. Look at you now. Half the village is asking about you.'], ['iruka', 'happy', 'That\'s your real strength. It always was. Ramen when you get back — my treat.']],
    teuchi: [['teuchi', 'happy', 'I\'m making a new recipe for when you come home. The "Seventh Special". It needs a taste-tester, so don\'t you dare get hurt!']],
    choji: [['choji', 'happy', 'Here, take a chip. Last one in the bag. ...That\'s how much I believe in you.']],
    sai: [['sai', 'happy', 'I read that friends should say "come back safe". I don\'t need the book this time. Come back safe, Naruto.']],
    anko: [['anko', 'flirty', 'Heh, the brat got sealed? Kick their teeth in and I\'ll buy you all the dango you can eat.']],
    hinata: [['hinata', 'sad', 'Naruto-kun... when you fell in the hideout, I thought... I thought I\'d lost you.'], ['hinata', 'serious', 'I won\'t be afraid anymore. Wherever you go, I\'ll walk beside you. That\'s my nindo now.']],
    sakura: [['sakura', 'sad', 'You scared me. Really scared me.'], ['sakura', 'happy', 'Don\'t you dare do that again. We\'re bringing Kurama back — together.']],
    ino: [['ino', 'serious', 'I tried to reach your mind while you were unconscious. There was a wall where the fox should be.'], ['ino', 'happy', 'But behind the wall there were a lot of faces. People you love. It\'s a very crowded head, Naruto. That\'s a good thing.']],
    tenten: [['tenten', 'serious', 'I\'m sharpening every blade I own for this trip. Nobody seals my... friend... and gets away with it.'], ['tenten', 'blush', 'You heard nothing. Go.']],
    temari: [['temari', 'serious', 'Gaara sent a hawk. The Sand stands with you. And so do I.'], ['temari', 'happy', 'Don\'t make that face. Go win.']],
    tsunade: [['tsunade', 'sad', 'I lost too many people who carried that same stubborn look you have.'], ['tsunade', 'happy', 'So you\'re going to be the one who breaks the pattern. Understood, brat?']],
  };
  const CHARMS = { hinata: 'charm_hinata', sakura: 'charm_sakura', ino: 'charm_ino', tenten: 'charm_tenten', temari: 'charm_temari', tsunade: 'charm_tsunade' };
  NR.bondVisit = async function (E, c) {
    if (S.qs('main4') !== 1) return false;
    const key = 'visit_' + c;
    if (S.f(key)) return false;
    const lines = BOND_LINES[c];
    if (!lines) return false;
    E.flag(key, true);
    for (const [who, emo, text, o] of lines) await E.say(who, emo, text, o);
    if (CHARMS[c] && G().aff(c) >= 35 && !S.has(CHARMS[c]) && !S.f('charm_' + c)) {
      E.flag('charm_' + c, true);
      await E.say(c, 'blush', 'Here... take this with you. For luck. And so you remember someone is waiting.');
      E.give(CHARMS[c]);
      E.aff(c, 4);
    } else if (NR.ROMANCE.includes(c)) E.aff(c, 3);
    const n = E.vr('bond_visits') + 1;
    E.vr('bond_visits', n);
    if (!S.has('k_charm')) E.give('k_charm', 1, true);
    NR.audio.sfx('heart');
    NR.ui.toast(`Bonds strengthened (${Math.min(n, 4)} / 4)`, { icon: '✨', color: '#ffd28a' });
    if (n >= 4 && S.qs('main4') === 1) {
      await E.think('naruto', 'happy', 'Everyone... Thank you. I can feel it — something warm, even with Kurama sealed.');
      E.quest('main4', 2);
      E.time('evening');
      await E.narrate('The sun is setting. The Lantern Festival is starting in the village square!');
    }
    return true;
  };

  SC.festival_start = async (E) => {
    E.flag('festival_intro', true);
    E.flag('festival', true);
    E.refresh();
    E.bgm('festival');
    await E.narrate('Paper lanterns bloom over Konoha like a second, warmer sky. Music drifts from the square.');
    const cands = NR.ROMANCE.filter((c) => G().aff(c) >= 25);
    const opts = cands.map((c) => ({ label: `Spend it with ${NR.charName(c)}`, heart: true, c }));
    opts.push({ label: 'Enjoy it with all my friends', c: null });
    await E.think('naruto', 'neutral', 'Who do I want to spend tonight with...?');
    const i = await E.choice(opts);
    const partner = opts[i].c;
    E.vr('festival_partner', partner || '');
    await NR.STORY.festivalScene(E, partner);
  };

  NR.STORY.festivalScene = async (E, partner, replay) => {
    await E.backdrop('festival_night');
    E.bgm('festival');
    if (!partner) {
      await E.say('kiba', 'happy', 'NARUTO! Over here! Akamaru ate four candy apples and a paper lantern!');
      await E.say('lee', 'happy', 'The fire of youth burns brightest under festival lanterns!');
      await E.say('choji', 'happy', 'The grilled squid stall is life-changing. I\'m on my fifth.');
      await E.say('sakura', 'happy', 'Look — the fireworks are starting!');
      await E.say('hinata', 'happy', 'It\'s beautiful...');
      await E.say('naruto', 'happy', 'Yeah. This is what we\'re protecting. All of it. All of you.');
    } else {
      E.outfit('kimono');
      const L = FESTIVAL[partner];
      for (const [who, emo, text] of L) await E.say(who, emo, text);
      E.outfit(null);
      if (!replay) E.aff(partner, 10);
    }
    E.sfx('explosion');
    E.flash('#ffd28a', 0.35);
    await E.narrate('Fireworks bloom over the Hokage Monument — gold, crimson, and blue — and for a little while, the whole village looks up together.');
    if (!replay) {
      E.flag('festival_done', true);
      E.unlock('festival');
    }
    await E.backdrop(null);
    if (!replay) {
      E.flag('festival', false);
      E.refresh();
      E.time('night');
      await E.think('naruto', 'serious', 'Tomorrow at dawn, we leave for Uzushio. I should get some sleep at home.');
    }
  };
  SC.memory_festival = async (E) => {
    const p = G().vr('festival_partner') || null;
    await NR.STORY.festivalScene(E, p || null, true);
  };

  const FESTIVAL = {
    hinata: [
      ['hinata', 'blush', 'N-Naruto-kun! I... I wore a yukata. Is it... strange?'],
      ['naruto', 'surprised', 'Strange? Hinata, you look... wow. Really, really pretty.'],
      ['hinata', 'blush', '...!'],
      ['hinata', 'happy', 'Would you... hold my hand? The crowd is so big, I don\'t want to lose you again.'],
      ['naruto', 'love', 'I won\'t let go. Promise.'],
      ['hinata', 'love', 'Then... I\'ll hold on too. Forever, if you let me.'],
    ],
    sakura: [
      ['sakura', 'happy', 'You actually came! And you\'re not in that orange jacket for once.'],
      ['naruto', 'happy', 'You look amazing, Sakura-chan. That yukata really suits you.'],
      ['sakura', 'blush', 'D-don\'t say it so plainly, idiot... Thanks.'],
      ['sakura', 'love', 'When you were unconscious, all I could think was that I never told you how much you mean to me. So... I\'m telling you now.'],
      ['naruto', 'love', 'Sakura-chan...'],
      ['sakura', 'happy', 'Now buy me a candy apple before I change my mind!'],
    ],
    ino: [
      ['ino', 'flirty', 'Took you long enough. I was starting to think I\'d have to use my Mind Transfer to drag you here.'],
      ['naruto', 'happy', 'Your yukata has the same flowers as your shop!'],
      ['ino', 'happy', 'Plum blossoms. They mean "I\'ll wait for you through the winter". Look it up.'],
      ['ino', 'love', '...Or don\'t. Just come back, okay? I\'m not done teaching you the language of flowers.'],
    ],
    tenten: [
      ['tenten', 'happy', 'Naruto! I won three prizes at the shuriken stall. They banned me from playing.'],
      ['naruto', 'happy', 'Of course they did! You\'re the best shot in the village.'],
      ['tenten', 'blush', 'Here — I won this for you. A little fox charm. Don\'t laugh.'],
      ['tenten', 'love', 'I\'m not good at saying things. I\'m good at aiming. So I\'m aiming right at you. Understand?'],
    ],
    temari: [
      ['temari', 'flirty', 'Leaf festivals are so noisy. Suna festivals are quieter. Fewer people, more stars.'],
      ['naruto', 'happy', 'But you\'re still here.'],
      ['temari', 'blush', '...Because someone asked me to stay. Don\'t let it go to your head.'],
      ['temari', 'love', 'When you get back, show me your village from the Hokage Monument again. At night. Just us.'],
    ],
    tsunade: [
      ['tsunade', 'happy', 'Festivals, fireworks, cheap sake. Just like the old days with Jiraiya and... well. Old days.'],
      ['naruto', 'serious', 'Pervy Sage would\'ve loved tonight.'],
      ['tsunade', 'sad', 'He would. He\'d have been peeping at the girls in yukata and I\'d have punched him into the river.'],
      ['tsunade', 'love', 'You carry both of them in you, you know. His dream, her love. Come back to me, Naruto. That\'s not a Hokage\'s order. It\'s mine.'],
    ],
  };

  SC.south_road = async (E) => {
    if (S.qs('main4') === 3) return SC.departure(E);
    if (S.ch() >= 6) {
      await E.think('naruto', 'happy', 'The road to the coast. No missions out there today.');
      return;
    }
    await E.say('izumo', 'neutral', 'Sorry, Naruto. With the chakra-drain incidents, nobody leaves through the main gate without the Hokage\'s permission.', { name: 'Izumo' });
    E.move('player', 'u');
  };
  SC.guard_talk = async (E, self) => {
    if (NR.bondVisit && self && (await NR.bondVisit(E, self.char))) return;
    const l = S.ch() >= 6 ? 'Lord Seventh! ...Sorry, still getting used to that.' : S.ch() >= 4 ? 'We heard you\'re leaving for Uzushio. Come back in one piece, Naruto.' : 'All quiet at the gate. Well, except for Kotetsu\'s snoring.';
    await E.say(self.char, 'happy', l);
  };

  SC.departure = async (E) => {
    E.bgm('title');
    const sk = E.spawn({ key: 'sakura_d', char: 'sakura', x: 22, y: 32, dir: 'up' });
    const hn = E.spawn({ key: 'hinata_d', char: 'hinata', x: 25, y: 32, dir: 'up' });
    const kk = E.spawn({ key: 'kakashi_d', char: 'kakashi', x: 23, y: 29, dir: 'down' });
    const ts = E.spawn({ key: 'tsunade_d', char: 'tsunade', x: 24, y: 29, dir: 'down' });
    E.place('player', 23, 31, 'up');
    await E.say('kakashi', 'serious', 'Sasuke sent a hawk last night. He\'s already heading to Uzushio from the west. He\'ll meet you there.');
    await E.say('naruto', 'happy', 'Sasuke...! Heh. He always shows up at the last second.');
    await E.say('tsunade', 'serious', 'Listen well, all of you. Come back alive. That\'s an order from the Fifth Hokage.');
    await E.say('sakura', 'happy', 'Yes, ma\'am!');
    await E.say('hinata', 'serious', 'We\'ll bring Kurama home.');
    await E.say('naruto', 'battle', 'Let\'s go! Uzushiogakure, here we come!');
    await E.fadeOut(900);
    E.remove(sk);
    E.remove(hn);
    E.remove(kk);
    E.remove(ts);
    E.join('sakura', true);
    E.join('hinata', true);
    E.complete('main4');
    E.chapter(5);
    await E.title('Chapter 5', 'The Whirlpool\'s Heart', 2600);
    await E.narrate('Three days by road and one night by boat, across waters that spin like a slow storm...');
    E.quest('main5', 0);
    await E.transfer('ruins', 4, 28, 'up', { fade: false });
    NR.engine.fade.a = 1;
  };

  // ================= CHAPTER 5 =================
  SC.ruins_enter = async (E) => {
    E.flag('ruins_entered', true);
    await E.fadeIn(900);
    await E.narrate('The ruins of Uzushiogakure. The whirlpools that once guarded the Uzumaki clan still churn the sea around the island.');
    await E.say('hinata', 'serious', 'Byakugan... the fog is full of chakra. Sealing chakra.');
    await E.say('sakura', 'neutral', 'Look — the central plaza. Those spiral marks on the ground...');
    await E.say('naruto', 'sad', '(So this is where Mom came from...)');
  };
  SC.spiral_switch = async (E, self, ev) => {
    const n = ev.spiral;
    if (S.f('spiral' + n)) return;
    await E.say('naruto', 'serious', 'The spiral... it\'s reacting to me. To my blood.');
    E.sfx('charge');
    E.flash('#ff6a4a', 0.6);
    E.flag('spiral' + n, true);
    const c = [1, 2, 3].filter((i) => S.f('spiral' + i)).length;
    await E.narrate(`The spiral seal glows crimson. (${c} / 3)`);
    if (c === 3) {
      E.sfx('explosion');
      E.shake(12, 1);
      await E.say('hinata', 'surprised', 'The whirlpool barrier to the north — it\'s opening!');
      E.quest('main5', 1);
      E.refresh();
    }
  };
  SC.ruins_barrier = async (E) => {
    await E.think('naruto', 'serious', 'A barrier shaped like a whirlpool. Those spiral marks in the plaza must be the key.');
  };
  SC.ruins_altar = async (E) => {
    await E.narrate('A weathered altar. The inscription reads: "To the whirlpool that carries our children home."');
    E.sfx('heal');
    G().fullHeal();
    await E.narrate('A gentle warmth washes over the party. HP and chakra fully restored.');
    if (!S.f('altar_felt')) {
      E.flag('altar_felt', true);
      await E.say('naruto', 'sad', '...It feels like someone just ruffled my hair. Mom?');
    }
  };
  SC.chest_r1 = async (E) => {
    if (S.f('chest_r1')) return E.narrate('The chest is empty.');
    E.flag('chest_r1', true);
    NR.audio.sfx('open');
    E.refresh();
    E.give('med_scroll', 2);
  };
  SC.chest_r2 = async (E) => {
    if (S.f('chest_r2')) return E.narrate('The chest is empty.');
    E.flag('chest_r2', true);
    NR.audio.sfx('open');
    E.refresh();
    E.give('chakra_pill', 2);
    E.give('gift_perfume', 1);
  };
  SC.ruins_boat = async (E) => {
    if (S.f('kagen_defeated')) {
      const i = await E.choice(['Sail back to Konoha', 'Stay a while']);
      if (i === 0) {
        await E.transfer('konoha', 23, 29, 'up');
      }
      return;
    }
    await E.think('naruto', 'serious', 'The boat that brought us here. There\'s no turning back now.');
  };

  SC.sasuke_arrives = async (E) => {
    E.flag('sasuke_arrives', true);
    E.bgm('tension');
    const e1 = E.spawn({ key: 'amb1', char: 'hm_elite', x: 16, y: 22, dir: 'down' });
    const e2 = E.spawn({ key: 'amb2', char: 'hm_soldier', x: 19, y: 22, dir: 'down' });
    await E.say('hm_elite', 'angry', 'The vessel! Surround them!', { name: 'Hollow Moon Elite' });
    await E.move(e1, 'dd');
    await E.move(e2, 'dd');
    E.sfx('thunder');
    E.flash('#e8f6ff', 0.9);
    E.shake(12, 0.5);
    const sa = E.spawn({ key: 'sasuke_s', char: 'sasuke', x: 18, y: 25, dir: 'up' });
    E.poof(e1);
    E.remove(e1);
    E.poof(e2);
    E.remove(e2);
    await E.wait(400);
    E.faceEach('player', sa);
    E.bgm('title');
    await E.say('sasuke', 'neutral', 'You\'re slow, Naruto.');
    await E.say('naruto', 'happy', 'SASUKE!! Took you long enough, you jerk!');
    await E.say('sasuke', 'serious', 'I\'ve been tracking the Hollow Moon for months. Their leader, Kagen, was one of Danzo\'s. He\'s been collecting Uzumaki relics across the continent — for this place.');
    await E.say('sakura', 'happy', 'Sasuke-kun. It\'s good to see you.');
    await E.say('hinata', 'happy', 'Welcome, Sasuke-san.');
    await E.say('sasuke', 'neutral', 'Hn. I heard they sealed your fox.');
    await E.say('naruto', 'serious', 'Not for long.');
    await E.say('sasuke', 'happy', '...Then I\'ll lend you my strength. Just this once.');
    E.remove(sa);
    E.join('sasuke');
  };
  SC.sasuke_talk = async (E) => {
    await E.say('sasuke', 'neutral', 'The Moon Well is north. Stop wasting time.');
  };

  SC.final_confront = async (E) => {
    if (S.f('kagen_defeated')) return;
    E.bgm('tension');
    const kg = E.actor('kagen');
    await E.say('kagen', 'neutral', 'You came. Of course you came. The Uzumaki always return to the whirlpool.');
    await E.say('naruto', 'angry', 'Give Kurama back, Kagen!');
    await E.say('kagen', 'serious', 'Kurama was never yours. Chakra was never anyone\'s. It is a disease the Sage handed to humanity — a thousand years of war in a single gift.');
    await E.say('kagen', 'sad', 'I was nine when Root took me. Twelve when I killed my first child soldier. By the Fourth War I\'d buried everyone I\'d ever cared about. All for chakra.');
    await E.say('kagen', 'battle', 'With the Moon Well and your Uzumaki blood, I will drain every drop of chakra from this world. No more jutsu. No more war. Only quiet.');
    await E.say('sakura', 'angry', 'Quiet? Without chakra, every living thing dies! That\'s not peace — it\'s a graveyard!');
    await E.say('sasuke', 'serious', 'I tried to end the world\'s pain my way once. It doesn\'t work. Trust me.');
    await E.say('naruto', 'serious', 'I know what it\'s like to be alone, Kagen. But you\'re wrong. Pain doesn\'t come from chakra. It comes from people forgetting each other.');
    await E.say('kagen', 'angry', 'Then let us see whose conviction is stronger!');
    let r = await E.battle('boss_kagen');
    if (r !== 'win') return;
    E.bgm('boss');
    await E.say('kagen', 'hurt', 'Impressive... But the Moon Well is already awake. And now... it has me.');
    E.sfx('kurama');
    E.flash('#8a5aff', 1);
    E.shake(20, 1.4);
    await E.say('kagen', 'battle', 'BEHOLD — THE HOLLOW MOON!');
    r = await E.battle('boss_kagen2', { onTurn: NR.STORY.kuramaAwakens });
    if (r !== 'win') return;
    E.flag('kagen_defeated', true);
    E.flag('kurama_sealed', false);
    E.flag('kurama_awake', true);
    E.bgm('sad');
    await E.say('kagen', 'hurt', 'Why... does your chakra... keep burning...?');
    await E.say('naruto', 'serious', 'Because it\'s not just mine. It\'s everyone\'s. Every single person who ever believed in me.');
    await E.say('kagen', 'sad', 'Bonds... Danzo called them weakness...');
    await E.say('naruto', 'happy', 'Danzo was wrong. You don\'t have to be alone anymore either, Kagen.');
    await E.say('sasuke', 'serious', 'He\'ll face judgment in the Leaf. Not death. Judgment.');
    await E.say('naruto', 'serious', 'Now, the Moon Well. Everyone — together!');
    E.sfx('charge');
    E.flash('#ffffff', 1, 1.2);
    E.shake(10, 1);
    E.flag('moonwell_sealed', true);
    await E.narrate('Four hands on the ancient seal. Uzumaki blood, Uchiha fire, Hyuga sight and a medic\'s steady chakra — and the Moon Well falls silent at last.');
    if (kg) E.remove(kg);
    E.complete('main5');
    await NR.STORY.ending(E);
  };

  NR.STORY.kuramaAwakens = async function (B) {
    if (G().flag('kurama_awake')) return;
    const n = B.units.find((u) => u.side === 'party' && u.id === 'naruto');
    if (!n) return;
    if (B.turnCount < 4 && n.hp > n.mhp * 0.5) return;
    G().flag('kurama_awake', true);
    G().flag('kurama_sealed', false);
    const say = (who, emo, text, o) => NR.msg.say(who, emo, text, o);
    await say('naruto', 'hurt', 'Ugh... he\'s too strong... I can\'t feel Kurama at all...');
    await say('hinata', 'love', 'Naruto-kun! You\'re not alone! You were never alone!');
    await say('sakura', 'serious', 'Get up, Naruto! We\'re all right here!');
    for (const c of NR.ROMANCE) {
      if (G().aff(c) >= 60 && c !== 'hinata' && c !== 'sakura') await say(c, 'love', c === 'tsunade' ? '(Come back to me, brat...)' : c === 'ino' ? '(A very crowded head... that\'s a good thing.)' : c === 'tenten' ? '(I\'m aiming right at you. Don\'t miss.)' : '(Go win.)', { style: 'think' });
    }
    await say('naruto', 'serious', '...Everyone\'s voices. Iruka-sensei, Kakashi-sensei, Granny... Pervy Sage... Mom... Dad...');
    await say('kurama', 'happy', 'Oi. Brat. Took you long enough to call me.', { name: 'Kurama' });
    await say('naruto', 'battle', 'KURAMA!!');
    await say('kurama', 'battle', 'That seal was built on loneliness. You\'re the least lonely idiot I\'ve ever met. Now — let\'s show this fool what bonds can do!', { name: 'Kurama' });
    NR.audio.sfx('kurama');
    NR.engine.flash('#ffb040', 0.9);
    const m = G().member('naruto');
    m.kurama = 100;
    n.skills = G().skillsOf('naruto');
    for (const u of B.units) if (u.side === 'party' && u.alive) u.hp = Math.min(u.mhp, u.hp + Math.round(u.mhp * 0.5));
    for (const u of B.units) if (u.side === 'party' && !u.alive) {
      u.alive = true;
      u.alpha = 1;
      u.hp = Math.round(u.mhp * 0.4);
    }
    NR.msg.close();
  };

  // ================= EPILOGUE =================
  NR.STORY.ending = async (E) => {
    await E.fadeOut(1200);
    E.chapter(6);
    E.leave('sasuke', true);
    E.time('morning');
    await E.title('Epilogue', 'The Seventh Dawn', 2800);
    await E.backdrop('ending_dawn', { fade: false });
    await E.fadeIn(1200);
    E.bgm('title');
    await E.narrate('One month later.');
    await E.say('kakashi', 'happy', 'People of Konoha! Today I pass the hat to the man who never, ever gave up on any of us.');
    await E.say('kakashi', 'happy', 'The Seventh Hokage — Naruto Uzumaki!');
    E.sfx('explosion');
    E.flash('#ffe0a0', 0.3);
    await E.narrate('The cheer shakes the leaves from the trees.');
    await E.say('naruto', 'happy', 'I\'m not gonna make a long speech... Believe it! I\'ll protect this village and everyone in it. That\'s a promise of a lifetime!');
    await E.say('kurama', 'flirty', 'Hmph. Seventh Hokage. Don\'t let it go to your head, brat.', { name: 'Kurama' });
    await E.say('naruto', 'love', 'Welcome back, partner.');
    // romance ending
    let best = null, bestA = 59;
    for (const c of NR.ROMANCE) {
      const a = G().aff(c) + (G().qDone('r_' + c) ? 20 : 0);
      if (G().aff(c) >= 60 && a > bestA) {
        best = c;
        bestA = a;
      }
    }
    E.vr('ending_partner', best || '');
    await NR.STORY.endingPartner(E, best);
    E.unlock('ending');
    E.flag('game_clear', true);
    await E.fadeOut(1000);
    await new Promise((r) => {
      const c = new NR.Credits();
      const orig = c.update.bind(c);
      c.update = (dt, focus) => {
        const before = NR.ui.stack.includes(c);
        orig(dt, focus);
        if (before && !NR.ui.stack.includes(c)) r();
      };
      NR.ui.push(c);
    });
    await E.backdrop(null, { fade: false });
    E.heal();
    await E.transfer('konoha', 23, 14, 'down', { fade: false });
    await E.fadeIn(900);
    await E.narrate('Thank you for playing! You can keep exploring Konoha — unfinished stories and side quests are still waiting.');
  };

  NR.STORY.endingPartner = async (E, c, replay) => {
    if (!c) {
      await E.backdrop('festival_night');
      await E.say('teuchi', 'happy', 'The Seventh Special! On the house — for everyone!');
      await E.say('sakura', 'happy', 'Congratulations, Lord Seventh.');
      await E.say('hinata', 'happy', 'You did it, Naruto-kun.');
      await E.say('naruto', 'happy', 'WE did it. Now — ramen! Believe it!');
      return;
    }
    await E.backdrop('rooftop_night');
    E.bgm('romance');
    const L = ENDINGS[c];
    for (const [who, emo, text] of L) await E.say(who, emo, text);
    if (E.romanceOn()) {
      await E.narrate('Under the carved faces of six Hokage, the seventh kisses the person he loves — and the whole village of stars seems to hold its breath.');
    } else await E.narrate('Under the Hokage Monument, two hands find each other and hold on.');
  };
  SC.memory_ending = async (E) => {
    await NR.STORY.endingPartner(E, G().vr('ending_partner') || null, true);
  };
  const ENDINGS = {
    hinata: [
      ['hinata', 'love', 'The Seventh Hokage... I always knew. Since we were children, I knew.'],
      ['naruto', 'love', 'Hinata. You believed in me before anyone else did. Before I believed in myself.'],
      ['naruto', 'blush', 'So... will you stay by my side? Not as a teammate. As... my family?'],
      ['hinata', 'love', 'Yes. Yes — a thousand times, yes.'],
    ],
    sakura: [
      ['sakura', 'happy', 'Lord Seventh. It\'s going to take me years to stop laughing at that title.'],
      ['naruto', 'love', 'Sakura-chan... I\'ve loved you since the Academy. But the way I love you now is different. Bigger.'],
      ['sakura', 'love', 'I know. It took me a long time to see you. Really see you. But I do now, Naruto.'],
      ['sakura', 'blush', 'So stop talking and kiss me before I punch you.'],
    ],
    ino: [
      ['ino', 'flirty', 'I brought you a flower for your desk. A sunflower. It means "adoration". Don\'t make it weird.'],
      ['naruto', 'happy', 'Ino... what does it mean if I give you one back?'],
      ['ino', 'love', 'It means we\'re both idiots. Happy idiots. Come here.'],
    ],
    tenten: [
      ['tenten', 'blush', 'I forged something for you. The Seventh Hokage\'s kunai. Engraved and everything.'],
      ['naruto', 'love', 'Tenten... you\'re always there, steady, never missing. Stay with me? Always?'],
      ['tenten', 'love', 'Bullseye, Naruto. You finally hit it.'],
    ],
    temari: [
      ['temari', 'flirty', 'I told you to show me the village from up here again. You remembered.'],
      ['naruto', 'love', 'Stay in Konoha, Temari. Not as Suna\'s ambassador. As mine.'],
      ['temari', 'love', 'Hmph. Gaara will be insufferable about this. ...Yes. Obviously yes.'],
    ],
    tsunade: [
      ['tsunade', 'sad', 'Jiraiya would be crying like a baby if he saw you in that hat.'],
      ['naruto', 'love', 'Tsunade... I don\'t care how old anyone thinks you are. I care about who you are.'],
      ['tsunade', 'love', 'Brat. ...No. Naruto. My luck finally turned, didn\'t it?'],
    ],
  };

  // ================= world flavour =================
  SC.monument = async (E) => {
    await E.narrate('The Hokage Monument. Six faces carved into the cliff: Hashirama, Tobirama, Hiruzen, Minato, Tsunade and Kakashi.');
    if (S.ch() >= 6) await E.think('naruto', 'love', 'They\'re carving mine next to Kakashi-sensei\'s. I asked them to give me a big grin.');
    else await E.think('naruto', 'happy', 'I painted graffiti on all of them when I was a kid. Someday my face will be up there too.');
  };
  SC.noticeboard = async (E) => {
    const posts = {
      1: 'MISSING: Chunin patrol, Outer Forest. Report any information to the Hokage Tower.',
      2: 'NOTICE: Do not approach masked strangers. Report sightings immediately.',
      3: 'VOLUNTEERS WANTED: Lantern Festival preparations. Contact the village office.',
      4: 'TONIGHT: The Lantern Festival! Food stalls, fireworks and a dance in the square.',
      5: 'CLOSED: The Hokage is away on urgent business. (He\'ll be late anyway.)',
      6: 'CONGRATULATIONS TO THE SEVENTH HOKAGE! Ichiraku: half-price ramen all week!',
    };
    await E.narrate(posts[S.ch()] || 'Lost cat: answers to "Tora". Reward offered. (Again.)');
    await E.narrate('Also pinned up: "Moonrise Inn — dice hall open late. Legendary losers welcome."');
  };
  SC.well = async (E) => {
    await E.think('naruto', 'neutral', 'The old village well. Sasuke and I used to have contests over who could throw a pebble in from further away.');
  };
  SC.lookout_sign = async (E) => {
    await E.narrate('"Hokage Rock Lookout — best view of the village at night."');
  };
  SC.academy_door = async (E) => {
    await E.narrate('The Ninja Academy. The doors are closed — it\'s the holidays.');
  };
  SC.hyuga_house = async (E) => {
    await E.narrate('The main house of the Hyuga clan. It feels rude to barge in uninvited.');
  };
  SC.hyuga_guard = async (E) => {
    await E.say('vm2', 'neutral', 'Welcome to the Hyuga compound, Naruto-sama. Lady Hinata often trains in the garden.', { name: 'Hyuga Guard' });
  };
  SC.memorial = async (E) => {
    await E.narrate('The Memorial Stone. The names of shinobi who died protecting the village are carved into it. Neji\'s name is near the top.');
    await E.think('naruto', 'sad', 'Neji... we did it. Five years of peace. I wish you could see it.');
  };
  SC.posts = async (E) => {
    await E.think('naruto', 'happy', 'The three posts from the bell test. I got tied to that one. Kakashi-sensei is still the worst.');
  };
})();
