// "Art Setup" overlay (HTML): import your folders and fix how pictures, sprites and
// music are matched to characters and situations.
(function () {
  'use strict';
  const NR = window.NR, U = NR.U;
  const AM = (NR.artManager = { open: false, tab: 'chars', filter: 'all' });
  const EMOS = Object.keys(NR.EMOTIONS);
  const OUTFITS = Object.keys(NR.OUTFITS);
  const TRACKS = ['title', 'village', 'forest', 'battle', 'boss', 'romance', 'night', 'onsen', 'dungeon', 'sad', 'festival', 'tension', 'victory', 'gameover'];
  const MAIN_CHARS = () => Object.keys(NR.CHARS).filter((id) => !/^v[mf]\d$/.test(id));
  let root, body, anim;

  const el = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of [].concat(kids)) if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return e;
  };

  function kindSelect(it) {
    const cur = NR.art.eff(it).kind;
    const s = el('select', { class: 'am-sel', title: 'What kind of picture is this?', onchange: (e) => (NR.art.setOverride(it.path, { kind: e.target.value }), render()) });
    for (const [v, t] of [['portrait', 'Type: character picture'], ['sprite', 'Type: walking sprite sheet']]) {
      const o = el('option', { value: v, text: t });
      if (v === cur) o.selected = true;
      s.appendChild(o);
    }
    return s;
  }

  function charSelect(value, onChange) {
    const s = el('select', { class: 'am-sel', onchange: (e) => onChange(e.target.value || null) });
    s.appendChild(el('option', { value: '', text: '— not assigned —' }));
    for (const id of MAIN_CHARS()) {
      const o = el('option', { value: id, text: NR.CHARS[id].full || NR.CHARS[id].name });
      if (id === value) o.selected = true;
      s.appendChild(o);
    }
    return s;
  }

  function chips(all, active, onToggle, cls) {
    const wrap = el('div', { class: 'am-chips' });
    for (const t of all) {
      const on = active.includes(t);
      wrap.appendChild(
        el('button', {
          class: 'am-chip ' + (cls || '') + (on ? ' on' : ''),
          text: t,
          onclick: () => {
            const next = on ? active.filter((x) => x !== t) : [...active, t];
            onToggle(next);
          },
        })
      );
    }
    return wrap;
  }

  function build() {
    root = el('div', { id: 'artmgr', class: 'am hidden' });
    const fileDir = el('input', { type: 'file', multiple: '', style: 'display:none' });
    fileDir.setAttribute('webkitdirectory', '');
    fileDir.setAttribute('directory', '');
    const fileMany = el('input', { type: 'file', multiple: '', accept: 'image/*,audio/*', style: 'display:none' });
    const doImport = async (files) => {
      if (!files || !files.length) return;
      status('Importing ' + files.length + ' files…');
      const n = await NR.art.importFiles(files, (i, t) => status(`Importing ${i}/${t}…`));
      status(`Imported ${n} file(s). They are saved in this browser, so you only need to do this once.`);
      render();
    };
    fileDir.addEventListener('change', () => doImport(fileDir.files).then(() => (fileDir.value = '')));
    fileMany.addEventListener('change', () => doImport(fileMany.files).then(() => (fileMany.value = '')));

    const head = el('div', { class: 'am-head' }, [
      el('div', { class: 'am-title' }, [el('b', { text: 'Character Art Setup' }), el('span', { text: 'Use your own pictures & sprites' })]),
      el('div', { class: 'am-tools' }, [
        el('button', { class: 'am-btn main', text: '📁 Import folder…', onclick: () => fileDir.click() }),
        el('button', { class: 'am-btn', text: '🖼 Import files…', onclick: () => fileMany.click() }),
        el('button', {
          class: 'am-btn warn',
          text: '🗑 Clear imported',
          onclick: async () => {
            if (!confirm('Remove all pictures imported into the browser? (Files in your game folder are not touched.)')) return;
            await NR.art.clearImported();
            render();
          },
        }),
        el('button', { class: 'am-btn close', text: '✕ Close', onclick: () => AM.hide() }),
      ]),
    ]);
    const tabs = el('div', { class: 'am-tabs' });
    for (const [id, label] of [['chars', 'Characters'], ['portrait', 'Portraits'], ['sprite', 'Sprites'], ['music', 'Music'], ['help', 'How it works']]) {
      tabs.appendChild(el('button', { class: 'am-tab', 'data-tab': id, text: label, onclick: () => ((AM.tab = id), render()) }));
    }
    const st = el('div', { class: 'am-status', id: 'am-status' });
    body = el('div', { class: 'am-body' });
    root.append(head, tabs, st, body, fileDir, fileMany);
    document.body.appendChild(root);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') AM.hide();
    });
  }

  function status(t) {
    const s = document.getElementById('am-status');
    if (s) s.textContent = t;
  }

  function summary() {
    const p = NR.art.list('portrait').length, s = NR.art.list('sprite').length, m = NR.art.list('music').length;
    const un = NR.art.list('portrait').filter((i) => !NR.art.eff(i).char && !NR.art.eff(i).ignore).length;
    return `${p} picture(s), ${s} sprite sheet(s), ${m} music file(s) found` + (un ? ` · ${un} picture(s) not assigned to a character yet` : '');
  }

  function render() {
    if (!root) return;
    for (const b of root.querySelectorAll('.am-tab')) b.classList.toggle('on', b.dataset.tab === AM.tab);
    status(summary());
    body.innerHTML = '';
    clearInterval(anim);
    ({ chars: renderChars, portrait: renderPortraits, sprite: renderSprites, music: renderMusic, help: renderHelp }[AM.tab] || renderChars)();
  }

  function thumbFor(id) {
    const it = NR.art.portraitFor(id, 'neutral');
    if (it) return el('img', { src: it.url, class: 'am-thumbimg', loading: 'lazy' });
    const c = NR.portraitgen.get(id, 'neutral', null, 0.4);
    const cv = el('canvas', { class: 'am-thumbimg' });
    cv.width = c.width;
    cv.height = c.height;
    cv.getContext('2d').drawImage(c, 0, 0);
    return cv;
  }

  function renderChars() {
    const grid = el('div', { class: 'am-grid chars' });
    const ids = MAIN_CHARS().filter((id) => NR.CHARS[id].bio || NR.ROMANCE.includes(id) || ['kurama', 'akamaru', 'kagen', 'mizuchi', 'nue'].includes(id));
    for (const id of ids) {
      const c = NR.CHARS[id];
      const mine = NR.art.list('portrait').filter((i) => NR.art.eff(i).char === id && !NR.art.eff(i).ignore);
      const emoHave = new Set(mine.flatMap((i) => (NR.art.eff(i).emotions.length ? NR.art.eff(i).emotions : ['neutral'])));
      const spr = NR.art.list('sprite').some((i) => NR.art.eff(i).char === id && !NR.art.eff(i).ignore);
      const card = el('div', { class: 'am-card char', onclick: () => ((AM.tab = 'portrait'), (AM.filter = id), render()) }, [
        el('div', { class: 'am-thumb' }, [thumbFor(id)]),
        el('div', { class: 'am-name', text: c.full || c.name }),
        el('div', { class: 'am-sub', text: `${c.age >= 1000 ? 'Ancient' : 'Age ' + c.age}${c.romance ? ' · ♥ romance' : ''}` }),
        el('div', { class: 'am-sub', text: `${mine.length} picture(s) · sprite: ${spr ? 'yours' : 'generated'}` }),
        el('div', { class: 'am-emos' }, EMOS.map((e) => el('span', { class: 'am-dot' + (emoHave.has(e) ? ' on' : ''), title: e, text: e.slice(0, 2).replace(/^./, (c) => c.toUpperCase()) }))),
      ]);
      grid.appendChild(card);
    }
    body.appendChild(el('p', { class: 'am-note', text: 'Click a character to see and edit their pictures. The small tags show which situations have a picture (Ne neutral, Ha happy, Sa sad, An angry, Su surprised, Bl blush, Fl flirty, Lo love, Se serious, Hu hurt, Ba battle). Missing ones use the closest match, then generated art.' }));
    body.appendChild(grid);
  }

  function renderPortraits() {
    const bar = el('div', { class: 'am-bar' });
    const fsel = el('select', { class: 'am-sel', onchange: (e) => ((AM.filter = e.target.value), render()) });
    for (const [v, t] of [['all', 'All pictures'], ['none', 'Not assigned'], ...MAIN_CHARS().map((id) => [id, NR.CHARS[id].full || NR.CHARS[id].name])]) {
      const o = el('option', { value: v, text: t });
      if (v === AM.filter) o.selected = true;
      fsel.appendChild(o);
    }
    bar.append(el('span', { text: 'Show: ' }), fsel);
    body.appendChild(bar);
    let items = NR.art.list('portrait');
    if (AM.filter === 'none') items = items.filter((i) => !NR.art.eff(i).char);
    else if (AM.filter !== 'all') items = items.filter((i) => NR.art.eff(i).char === AM.filter);
    if (!items.length) {
      body.appendChild(el('p', { class: 'am-empty', text: 'No pictures here yet. Use “Import folder…” and pick your “naruto characters” folder, or run Play.bat / play.sh after copying the folder next to index.html.' }));
      return;
    }
    const grid = el('div', { class: 'am-grid' });
    for (const it of items) {
      const e = NR.art.eff(it);
      const card = el('div', { class: 'am-card' + (e.ignore ? ' ignored' : '') }, [
        el('div', { class: 'am-thumb big' }, [el('img', { src: it.url, loading: 'lazy' })]),
        el('div', { class: 'am-file', title: it.path, text: it.path }),
        charSelect(e.char, (v) => (NR.art.setOverride(it.path, { char: v }), render())),
        kindSelect(it),
        el('div', { class: 'am-lbl', text: 'Situation / emotion' }),
        chips(EMOS, e.emotions, (v) => (NR.art.setOverride(it.path, { emotions: v }), render())),
        el('div', { class: 'am-lbl', text: 'Outfit / scene (optional)' }),
        chips(OUTFITS, e.outfits, (v) => (NR.art.setOverride(it.path, { outfits: v }), render()), 'alt'),
        el('div', { class: 'am-row' }, [
          el('label', {}, [
            el('input', { type: 'checkbox', ...(e.ignore ? { checked: '' } : {}), onchange: (ev) => (NR.art.setOverride(it.path, { ignore: ev.target.checked }), render()) }),
            ' Don’t use',
          ]),
          el('button', { class: 'am-link', text: 'reset', onclick: () => (NR.art.resetOverride(it.path), render()) }),
        ]),
      ]);
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }

  function renderSprites() {
    const items = NR.art.list('sprite');
    body.appendChild(el('p', { class: 'am-note', text: 'Walking sprites. RPG Maker sheets are detected automatically (3×4 single, 12×8 with 8 characters, XP 4×4, LPC). Numbered frame files (naruto_walk_down_1.png, naruto_walk_down_2.png…), frame strips and animated GIFs are combined into an animation. If the preview walks wrong, pick another layout. Characters without a sprite use the generated ones (also exported in generated-sprites/).' }));
    const pref = el('label', { class: 'am-row', style: 'justify-content:flex-start;margin:0 0 12px;cursor:pointer' }, [
      el('input', {
        type: 'checkbox',
        ...(NR.settings.spritePref === 'generated' ? { checked: '' } : {}),
        onchange: (ev) => {
          NR.settings.spritePref = ev.target.checked ? 'generated' : 'user';
          NR.storage.saveSettings();
          NR.art.spriteCache = {};
        },
      }),
      ' Use generated sprites for everyone (consistent look)',
    ]);
    body.appendChild(pref);
    if (!items.length) {
      body.appendChild(el('p', { class: 'am-empty', text: 'No sprite sheets found. Import your “sprite” folder with “Import folder…”.' }));
    }
    const grid = el('div', { class: 'am-grid' });
    const previews = [];
    for (const it of items) {
      const e = NR.art.eff(it);
      const cv = el('canvas', { class: 'am-sprite' });
      cv.width = 96;
      cv.height = 96;
      previews.push({ cv, it });
      const lay = el('select', { class: 'am-sel', onchange: (ev) => (NR.art.setOverride(it.path, { layout: ev.target.value }), render()) });
      for (const ln of NR.art.layoutNames) {
        const label = ln === 'auto' ? `Auto (${NR.art.detectLayout(it)})` : ln === 'rm' ? 'RPG Maker single (3×4)' : ln === 'xp' ? 'RPG Maker XP (4×4)' : ln === 'lpc' ? 'LPC (13×21)' : ln === 'strip' ? 'Frame strip (frames side by side)' : ln === 'frames' ? 'Animation frames (numbered files or animated GIF)' : ln === 'still' ? 'Single picture (no animation)' : `RPG Maker 8-sheet, character #${+ln.split('-')[1] + 1}`;
        const o = el('option', { value: ln, text: label });
        if (ln === e.layout) o.selected = true;
        lay.appendChild(o);
      }
      const scale = el('input', { type: 'range', min: '0.5', max: '2', step: '0.05', value: String(e.scale), oninput: (ev) => NR.art.setOverride(it.path, { scale: +ev.target.value }) });
      grid.appendChild(
        el('div', { class: 'am-card' + (e.ignore ? ' ignored' : '') }, [
          el('div', { class: 'am-thumb' }, [el('img', { src: it.url, loading: 'lazy' })]),
          cv,
          el('div', { class: 'am-file', title: it.path, text: `${it.path} (${it.w}×${it.h})` }),
          charSelect(e.char, (v) => (NR.art.setOverride(it.path, { char: v }), render())),
          kindSelect(it),
          el('div', { class: 'am-lbl', text: 'Sheet layout' }),
          lay,
          ...(e.layout === 'strip' || (e.layout === 'auto' && NR.art.detectLayout(it) === 'strip')
            ? [el('div', { class: 'am-lbl', text: 'Frames in the strip' }), el('input', { type: 'number', class: 'am-sel', min: '2', max: '16', value: String(NR.art.stripCols(it) || 4), onchange: (ev) => (NR.art.setOverride(it.path, { frames: Math.max(2, Math.min(16, +ev.target.value || 0)) }), render()) })]
            : []),
          el('div', { class: 'am-lbl', text: 'Size' }),
          scale,
          el('label', { class: 'am-row' }, [
            el('input', { type: 'checkbox', ...(e.ignore ? { checked: '' } : {}), onchange: (ev) => (NR.art.setOverride(it.path, { ignore: ev.target.checked }), render()) }),
            ' Don’t use',
          ]),
        ])
      );
    }
    body.appendChild(grid);
    let t = 0;
    anim = setInterval(() => {
      t++;
      for (const { cv, it } of previews) {
        const sh = it._preview && it._previewV === NR.art.version ? it._preview : ((it._previewV = NR.art.version), (it._preview = NR.art.previewSheet(it)));
        const x = cv.getContext('2d');
        x.clearRect(0, 0, 96, 96);
        x.imageSmoothingEnabled = sh.smooth;
        const dirs = ['down', 'left', 'up', 'right'];
        const dir = dirs[Math.floor(t / 8) % 4];
        const col = sh.layout.cycle[t % sh.layout.cycle.length];
        const row = sh.layout.dirs[dir];
        const s = Math.min(90 / sh.fw, 90 / sh.fh);
        x.drawImage(sh.img, sh.bx + col * sh.fw, sh.by + row * sh.fh, sh.fw, sh.fh, 48 - (sh.fw * s) / 2, 93 - sh.fh * s, sh.fw * s, sh.fh * s);
      }
    }, 150);
  }

  function renderMusic() {
    const items = NR.art.list('music');
    body.appendChild(el('p', { class: 'am-note', text: 'Optional: put music files in a “music” folder (e.g. village.mp3, battle.ogg, romance.mp3) to replace the built-in synth tracks.' }));
    if (!items.length) {
      body.appendChild(el('p', { class: 'am-empty', text: 'No music files found.' }));
      return;
    }
    const list = el('div', { class: 'am-list' });
    for (const it of items) {
      const e = NR.art.eff(it);
      const s = el('select', { class: 'am-sel', onchange: (ev) => (NR.art.setOverride(it.path, { track: ev.target.value || null }), NR.art.applyMusic()) });
      s.appendChild(el('option', { value: '', text: '— not used —' }));
      for (const tr of TRACKS) {
        const o = el('option', { value: tr, text: tr });
        if (tr === e.track) o.selected = true;
        s.appendChild(o);
      }
      list.appendChild(el('div', { class: 'am-mrow' }, [el('span', { class: 'am-file', text: it.path }), s, el('audio', { src: it.url, controls: '', preload: 'none' })]));
    }
    body.appendChild(list);
  }

  function renderHelp() {
    const html = `
      <h3>Two ways to add your art</h3>
      <ol>
        <li><b>Import in the game (easiest):</b> click <i>📁 Import folder…</i> and choose your <code>naruto characters</code> folder. Do it again for your <code>sprite</code> folder. Imported files are kept in this browser.</li>
        <li><b>Game folder:</b> copy the <code>naruto characters</code> and <code>sprite</code> folders next to <code>index.html</code>, then start the game with <code>Play.bat</code> (Windows) or <code>play.sh</code> (Mac/Linux). The script lists the files for the game every time you start it.</li>
      </ol>
      <h3>How pictures are matched</h3>
      <p>The character comes from the file or sub-folder name: <code>Hinata/happy.png</code>, <code>hinata_blush_2.jpg</code>, <code>Sakura Haruno - angry.png</code> all work.
      The situation comes from words in the name (English or Indonesian):</p>
      <table>${EMOS.map((e) => `<tr><td><b>${e}</b></td><td>${NR.EMOTIONS[e].slice(0, 9).join(', ')}</td></tr>`).join('')}</table>
      <p>Optional outfit/scene words: ${OUTFITS.map((o) => `<b>${o}</b> (${NR.OUTFITS[o].slice(0, 5).join(', ')})`).join(' · ')}. Example: <code>tsunade_onsen_flirty.png</code> is used in hot-spring scenes.</p>
      <p>Pictures without a situation word are used for any situation. When a character has several matching pictures, the game varies between them. Anything it can’t match can be set by hand in the <i>Portraits</i> tab.</p>
      <h3>Sprites</h3>
      <p>Name sprite sheets after the character (<code>$Naruto.png</code>, <code>sasuke_walk.png</code>). RPG Maker MV/MZ/VX/XP and LPC layouts are supported. Characters without a sheet use the game’s generated sprites.</p>
      <p class="am-note">All characters in this game are adults (18+).</p>`;
    body.appendChild(el('div', { class: 'am-help' }));
    body.lastChild.innerHTML = html;
  }

  AM.show = function (tab) {
    if (!root) build();
    if (tab) AM.tab = tab;
    AM.open = true;
    root.classList.remove('hidden');
    document.body.classList.add('dom-overlay');
    render();
  };
  AM.hide = function () {
    if (!root) return;
    AM.open = false;
    root.classList.add('hidden');
    document.body.classList.remove('dom-overlay');
    clearInterval(anim);
    NR.art.spriteCache = {};
    if (NR.game && NR.game.onArtChanged) NR.game.onArtChanged();
    NR.input.down = {};
  };
})();
