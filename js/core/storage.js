// Save slots, settings (localStorage) and imported art blobs (IndexedDB).
(function () {
  'use strict';
  const NR = window.NR;

  const PREFIX = 'nr7_';
  const S = (NR.storage = {});

  S.get = (key, def) => {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) {
      return def;
    }
  };
  S.set = (key, val) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn('storage failed', e);
      return false;
    }
  };
  S.remove = (key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {}
  };

  // ---------- settings ----------
  const DEFAULTS = {
    musicVol: 0.55,
    sfxVol: 0.7,
    textSpeed: 2, // 0 slow .. 3 instant
    alwaysDash: false,
    romance: true, // mature romance scenes
    showHeroPortrait: true,
    spritePref: 'user', // 'user' = your sprites first, 'generated' = generated only
    portraitStyle: 'auto', // auto | framed | clean
    voiceBlips: true,
    battleSpeed: 1,
    adultConfirmed: false,
  };
  NR.settings = Object.assign({}, DEFAULTS, S.get('settings', {}));
  S.saveSettings = () => S.set('settings', NR.settings);
  S.defaults = DEFAULTS;

  // ---------- save slots ----------
  S.SLOTS = 8; // slot 0 = autosave
  S.saveSlot = (slot, data) => S.set('save_' + slot, data);
  S.loadSlot = (slot) => S.get('save_' + slot, null);
  S.deleteSlot = (slot) => S.remove('save_' + slot);
  S.slotInfo = (slot) => {
    const d = S.loadSlot(slot);
    return d ? d.info || null : null;
  };
  S.anySave = () => {
    for (let i = 0; i < S.SLOTS; i++) if (S.slotInfo(i)) return true;
    return false;
  };
  S.latestSlot = () => {
    let best = -1, t = 0;
    for (let i = 0; i < S.SLOTS; i++) {
      const inf = S.slotInfo(i);
      if (inf && inf.savedAt > t) {
        t = inf.savedAt;
        best = i;
      }
    }
    return best;
  };

  // ---------- IndexedDB for imported images ----------
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('no indexedDB'));
      const req = indexedDB.open('nr7_art', 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files', { keyPath: 'path' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  S.blobPutMany = async (records) => {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('files', 'readwrite');
      const st = tx.objectStore('files');
      for (const r of records) st.put(r);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };
  S.blobAll = async () => {
    try {
      const d = await db();
      return await new Promise((resolve, reject) => {
        const tx = d.transaction('files', 'readonly');
        const req = tx.objectStore('files').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB unavailable', e);
      return [];
    }
  };
  S.blobClear = async () => {
    const d = await db();
    return new Promise((resolve) => {
      const tx = d.transaction('files', 'readwrite');
      tx.objectStore('files').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  };
  S.blobDelete = async (path) => {
    const d = await db();
    return new Promise((resolve) => {
      const tx = d.transaction('files', 'readwrite');
      tx.objectStore('files').delete(path);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  };
})();
