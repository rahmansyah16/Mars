# Naruto: Seventh Dawn

An unofficial, non-commercial **adult fan RPG** in the style of RPG Maker games, set in an
alternate timeline five years after the Fourth Great Ninja War. It runs entirely on your own
computer in a web browser: no install, no internet and no server needed.

> **Content notice (18+).** Every character in this game is an adult (ages are listed in
> `js/data/characters.js`). The romance side-quests contain mature, suggestive scenes;
> intimate moments fade to black. Romance scenes can be switched to short summaries in
> **Settings → Mature romance scenes**. Naruto and its characters belong to Masashi Kishimoto
> and Shueisha; this project is not affiliated with them.

---

## Playing

1. Download this folder (for example **Code → Download ZIP** on GitHub) and unzip it.
2. Put your art folders next to `index.html` (see below). This step is optional.
3. Start the game:
   - **Windows:** double-click `Play.bat`.
   - **macOS / Linux:** run `sh play.sh`.
   - **Any system:** open `index.html` in Chrome, Edge or Firefox, then add your art from
     the title screen's **Art Setup** (see "Adding your own art").

Saves are stored in your browser (8 slots plus an autosave). Use the same browser each time.

### Controls

| Action | Keyboard | Mouse / pad |
| --- | --- | --- |
| Move | Arrow keys / WASD | Click a tile to walk there · D-pad / left stick |
| Talk, examine, confirm | Z, Enter or Space | Left click · A |
| Menu / back | X, Esc or Backspace | Right click · B |
| Run | Hold Shift (or turn on "Always run") | — |
| Fast-forward text | Hold Ctrl | — |
| Conversation log | Tab or L | — |
| Switch tabs (shop buy/sell…) | Q / E | Shoulder buttons |

---

## Adding your own art

The game shows **your own character pictures** in conversations and **your own walking
sprites** on the map. Anyone without your art uses the built-in generated anime art.

### Option A: in the game (easiest)

On the title screen choose **Art Setup → 📁 Import folder…** and pick your
`naruto characters` folder, then do the same for your `sprite` folder. Imported files are kept
in your browser, so you only do this once.

### Option B: the game folder

Copy the folders next to `index.html` and start with `Play.bat` / `play.sh`:

```
Seventh Dawn/
├── index.html
├── Play.bat
├── naruto characters/     ← character pictures (avatars)
│   ├── Hinata/
│   │   ├── hinata smile.png
│   │   ├── hinata_blush.jpg
│   │   └── hinata onsen flirty.png
│   ├── sakura_angry.png
│   └── Tsunade - kimono.jpg
├── sprite/                ← walking sprite sheets
│   ├── $Naruto.png
│   └── Actor1.png
└── music/                 ← optional: village.mp3, battle.ogg, romance.mp3 …
```

The launcher lists the files for the game every time it starts, so you can keep adding art.

### How pictures are matched

- **Character:** from the file name or the sub-folder name, for example `Hinata/happy.png`,
  `hinata_blush_2.jpg` or `Sakura Haruno - angry.png`. Full names, first names and common
  nicknames all work.
- **Situation / emotion:** from words in the name. English and Indonesian are understood:

  | Situation | Example words |
  | --- | --- |
  | neutral | neutral, normal, default, biasa, tenang |
  | happy | happy, smile, laugh, senang, senyum, ketawa |
  | sad | sad, cry, tears, sedih, nangis |
  | angry | angry, mad, marah, kesal |
  | surprised | surprised, shock, kaget, terkejut |
  | blush | blush, shy, embarrassed, malu, tersipu |
  | flirty | flirty, wink, tease, seductive, genit, goda, menggoda |
  | love | love, romantic, kiss, cinta, sayang, mesra |
  | serious | serious, determined, serius, tegas |
  | hurt | hurt, injured, tired, sakit, luka, lelah |
  | battle | battle, fight, attack, jutsu, tarung, serang |

- **Outfit / scene (optional):** `onsen` (bath, towel, swimsuit, bikini, mandi), `kimono`
  (yukata, festival, dress), `night` (bed, pajama, lingerie, tidur), `casual` (date, santai).
  For example `tsunade_onsen_flirty.png` is used in the hot-spring scenes.

Pictures without a situation word are used for any situation, and the game varies between a
character's pictures from scene to scene. Missing situations fall back to the closest match
(for example *flirty → love → blush → happy → neutral*).

Anything that isn't recognised can be fixed by hand in **Art Setup**: pick the character, click
the situations and outfits, mark a file as a picture or a sprite sheet, or hide it. Your
choices are remembered.

Transparent PNG cut-outs stand directly on the dialogue stage; ordinary rectangular pictures
(screenshots, fan art) are shown on a framed card.

### Sprite sheets

RPG Maker sheets are detected automatically:

| Layout | Size example | Notes |
| --- | --- | --- |
| RPG Maker MV/MZ/VX single (3×4) | 144×192, 96×128 | name usually starts with `$` |
| RPG Maker 8-character sheet (12×8) | 576×384 | pick which of the 8 characters in Art Setup |
| RPG Maker XP (4×4) | 128×192 | |
| LPC (13×21) | 832×1344 | walk rows are used |

Rows are down, left, right, up (RPG Maker order). If a preview in Art Setup walks the wrong
way, choose another layout there; a size slider is also available.

Sprites saved as **one image per frame** also work: number the files and add a direction
word, for example `naruto_walk_down_1.png`, `naruto_walk_down_2.png`, `naruto_walk_left_1.png`
(direction words: down/front/depan, up/back/belakang, left/kiri, right/kanan/side). They are
combined into an animation automatically; a missing left or right side is mirrored from the
other one. Any other single picture is shown as a still figure.

### Music (optional)

Put audio files in a `music` folder and name them after the track they replace: `title`,
`village`, `forest`, `battle`, `boss`, `romance`, `night`, `onsen`, `dungeon`, `sad`,
`festival`, `tension`, `victory`, `gameover`. Otherwise the built-in synthesized soundtrack
plays.

---

## Generated sprites for every character

`generated-sprites/` contains the game's own sprites for all 43 characters, ready for RPG
Maker MV/MZ or any engine that reads the same format:

- `$Name.png`: 144×192 single-character walking sheet (3 frames × 4 directions).
- `2x/$Name.png`: the same at 288×384.
- `faces/Name.png`: 576×288 RPG Maker face set (neutral, happy, sad, angry, surprised, blush,
  flirty, serious).
- `characters.txt`: file name → character.

You can also drop them into the game's `sprite/` folder and edit them.

---

## What's in the game

- **Main story (5 chapters):** chakra-draining attacks in the Outer Forest, the masked Hollow
  Moon, a sealed hideout, the Lantern Festival, and the ruins of Uzushiogakure, ending with
  Naruto becoming the Seventh Hokage.
- **Romance side-quests:** three-part stories each for Hinata, Sakura, Ino, Tenten, Temari
  and Tsunade, with affection (♥), gifts (everyone has favourites), bond charms, sensual
  fade-to-black scenes and a gallery where finished scenes can be replayed.
- **Side quests:** Ichiraku ramen deliveries, finding Akamaru, Rock Lee's challenge, the
  stolen Academy scroll, Tenten's stolen weapons, herbs and moon lilies, and dice with Tsunade.
- **Battles:** side-view, speed-based turn order, elements (fire › wind › lightning › earth ›
  water › fire), jutsu with animated effects and cut-ins, statuses, Kurama mode, and bond
  combos with partners you are close to. Monsters are visible on the map, so you can avoid
  them.
- **Mini-games:** Gentle Fist sparring, target practice, flower arranging, a drinking
  contest and cho-han dice.
- Day and night cycle, lighting and weather, shops, an inn, save slots, a conversation log,
  mouse, touch and gamepad support.

---

## For tinkerers

Everything is plain JavaScript in `js/` (no build step):

- `js/data/`: characters (looks, ages), items, jutsu, enemies and quests.
- `js/maps/`: the maps. `js/story/`: all dialogue and event scripts.
- `js/gfx/`: procedural sprites, portraits, terrain, props and painted backdrops.
- `tools/scan-assets.*`: the art scanners used by the launchers.

## Troubleshooting

- **My pictures don't appear when I open `index.html` directly.** Use Art Setup → Import folder,
  or put the folders next to `index.html` and start with `Play.bat` / `play.sh`.
- **A picture is used for the wrong character or mood.** Fix it in Art Setup → Portraits.
- **A sprite walks strangely.** Art Setup → Sprites → choose another layout.
- **No sound.** Browsers start audio after your first key press or click.
