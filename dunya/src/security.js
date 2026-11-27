/**
 * Yaşam Maratonu: Büyük Dünya v10 — Security, Sanitization & Safe Save Validation
 * Zero external dependencies; usable in both browser and Node.js test suites.
 */
(function (root) {
  'use strict';

  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;
  const SAFE_ID_RE = /^[A-Za-z0-9_-]{1,48}$/;
  const MAX_DEPTH = 12;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizePlayerName(name, fallback = 'Gezgin', maxLen = 16) {
    if (typeof name !== 'string') return fallback;
    const cleaned = name.replace(CONTROL_CHARS_RE, '').trim().slice(0, maxLen);
    return cleaned.length > 0 ? cleaned : fallback;
  }

  function sanitizeHexColor(color, allowedHexes = null, fallback = '#38bdf8') {
    if (typeof color !== 'string') return fallback;
    const trimmed = color.trim().toLowerCase();
    if (!HEX_COLOR_RE.test(trimmed)) return fallback;
    if (Array.isArray(allowedHexes) && allowedHexes.length > 0) {
      const normalized = allowedHexes.map((c) => String(c).trim().toLowerCase());
      if (!normalized.includes(trimmed)) return fallback;
    }
    return trimmed;
  }

  function stripDangerousKeys(value, depth = 0) {
    if (depth > MAX_DEPTH || value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => stripDangerousKeys(item, depth + 1));
    }
    const clean = Object.create(null);
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      clean[key] = stripDangerousKeys(value[key], depth + 1);
    }
    return clean;
  }

  function safeJsonParse(raw, fallback = null, maxBytes = 65536) {
    if (typeof raw !== 'string' || raw.length === 0 || raw.length > maxBytes) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw);
      return stripDangerousKeys(parsed, 0);
    } catch (_) {
      return fallback;
    }
  }

  function clampNum(value, fallback, min, max) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
      return fallback;
    }
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function clampInt(value, fallback, min, max) {
    return Math.trunc(clampNum(value, fallback, min, max));
  }

  function getSafeStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function removeStorageKeySafe(storage, key) {
    if (!storage || typeof storage.removeItem !== 'function') return false;
    try {
      storage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function filterAllowedIds(list, allowedSet) {
    const out = new Set();
    if (!Array.isArray(list)) return out;
    for (const item of list) {
      if (typeof item === 'string' && allowedSet.has(item)) {
        out.add(item);
      }
    }
    return out;
  }

  function filterSafeDynamicIds(list, maxItems = 64) {
    const out = new Set();
    if (!Array.isArray(list)) return out;
    for (const item of list) {
      if (out.size >= maxItems) break;
      if (typeof item === 'string' && SAFE_ID_RE.test(item) && !DANGEROUS_KEYS.has(item)) {
        out.add(item);
      }
    }
    return out;
  }

  function sanitizeAudioPrefs(rawOrObj, validStations) {
    const parsed = typeof rawOrObj === 'string'
      ? safeJsonParse(rawOrObj, null, 4096)
      : (rawOrObj && typeof rawOrObj === 'object' ? stripDangerousKeys(rawOrObj, 0) : null);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const stationSet = new Set(Array.isArray(validStations) ? validStations : []);
    const out = Object.create(null);
    if (typeof parsed.muted === 'boolean') out.muted = parsed.muted;
    if (typeof parsed.musicOn === 'boolean') out.musicOn = parsed.musicOn;
    if (typeof parsed.musicVol === 'number' && Number.isFinite(parsed.musicVol)) {
      out.musicVol = clampNum(parsed.musicVol, 0.55, 0, 1);
    }
    if (typeof parsed.ambienceVol === 'number' && Number.isFinite(parsed.ambienceVol)) {
      out.ambienceVol = clampNum(parsed.ambienceVol, 0.45, 0, 1);
    }
    if (typeof parsed.sfxVol === 'number' && Number.isFinite(parsed.sfxVol)) {
      out.sfxVol = clampNum(parsed.sfxVol, 0.7, 0, 1);
    }
    if (typeof parsed.station === 'string' && (parsed.station === 'auto' || stationSet.has(parsed.station))) {
      out.station = parsed.station;
    }
    return out;
  }

  function sanitizeSaveData(rawOrObj, cfg) {
    const parsed = typeof rawOrObj === 'string'
      ? safeJsonParse(rawOrObj, null, 65536)
      : (rawOrObj && typeof rawOrObj === 'object' ? stripDangerousKeys(rawOrObj, 0) : null);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const allowedColors = (cfg.JACKET_COLORS || []).map((c) => c.hex);
    const defaultColor = allowedColors[0] || '#38bdf8';
    const maxSeason = Math.max(0, (cfg.SEASONS || []).length - 1);
    const maxWeather = Math.max(0, (cfg.WEATHERS || []).length - 1);
    const maxEvent = Math.max(0, (cfg.DAILY_EVENTS || []).length - 1);

    const validShopIds = new Set((cfg.SHOP_ITEMS || []).map((i) => i.id));
    const validDecorIds = new Set((cfg.HOME_DECOR || []).map((i) => i.id));
    const validCertIds = new Set((cfg.UNI_CERTS || []).map((i) => i.id));
    const validAchIds = new Set((cfg.ACHIEVEMENTS || []).map((i) => i.id));
    const validQuestIds = new Set((cfg.QUESTS || []).map((i) => i.id));
    const validNpcNames = new Set((cfg.NPC_TEMPLATES || []).map((n) => n.name));
    const validCropIds = new Set(Object.keys(cfg.CROPS || {}));
    const validBagKeys = Object.keys(cfg.BAG_ITEMS || {});

    const bag = Object.create(null);
    const rawBag = (parsed.bag && typeof parsed.bag === 'object' && !Array.isArray(parsed.bag)) ? parsed.bag : null;
    for (const k of validBagKeys) {
      const defQty = k === 'petfood' ? 2 : 0;
      const v = rawBag && Object.prototype.hasOwnProperty.call(rawBag, k) ? rawBag[k] : defQty;
      bag[k] = clampInt(v, defQty, 0, 9999);
    }

    const npcHearts = Object.create(null);
    const rawHearts = (parsed.npcHearts && typeof parsed.npcHearts === 'object' && !Array.isArray(parsed.npcHearts))
      ? parsed.npcHearts : null;
    if (rawHearts) {
      for (const name of Object.keys(rawHearts)) {
        if (!validNpcNames.has(name)) continue;
        npcHearts[name] = clampInt(rawHearts[name], 0, 0, 100);
      }
    }

    const questProgress = Object.create(null);
    const rawQp = (parsed.questProgress && typeof parsed.questProgress === 'object' && !Array.isArray(parsed.questProgress))
      ? parsed.questProgress : null;
    if (rawQp) {
      for (const qid of Object.keys(rawQp)) {
        if (!validQuestIds.has(qid)) continue;
        questProgress[qid] = clampInt(rawQp[qid], 0, 0, 9999);
      }
    }

    const gardenPlots = [];
    if (Array.isArray(parsed.gardenPlots)) {
      const cap = Math.min(parsed.gardenPlots.length, 16);
      for (let i = 0; i < cap; i++) {
        const gp = parsed.gardenPlots[i];
        if (!gp || typeof gp !== 'object' || Array.isArray(gp)) {
          gardenPlots.push({ crop: null, growth: 0, watered: false });
          continue;
        }
        const crop = (typeof gp.crop === 'string' && validCropIds.has(gp.crop)) ? gp.crop : null;
        gardenPlots.push({
          crop,
          growth: crop ? clampNum(gp.growth, 0, 0, 1) : 0,
          watered: Boolean(gp.watered)
        });
      }
    }

    const worldW = Number.isFinite(cfg.WORLD_W) ? cfg.WORLD_W : 4600;
    const worldH = Number.isFinite(cfg.WORLD_H) ? cfg.WORLD_H : 3600;
    const hasPos = typeof parsed.px === 'number' && Number.isFinite(parsed.px)
      && typeof parsed.py === 'number' && Number.isFinite(parsed.py);

    return {
      playerName: sanitizePlayerName(parsed.playerName, 'Gezgin', 16),
      color: sanitizeHexColor(parsed.color, allowedColors, defaultColor),
      day: clampInt(parsed.day, 1, 1, 99999),
      age: clampInt(parsed.age, 20, 1, 999),
      seasonIdx: clampInt(parsed.seasonIdx, 0, 0, maxSeason),
      weatherIdx: clampInt(parsed.weatherIdx, 0, 0, maxWeather),
      dailyEventIdx: clampInt(parsed.dailyEventIdx, 0, 0, maxEvent),
      timeMinutes: clampNum(parsed.timeMinutes, 480, 0, 1439),
      money: clampInt(parsed.money, 160, 0, 99999999),
      bankBalance: clampInt(parsed.bankBalance, 0, 0, 99999999),
      carBattery: clampNum(parsed.carBattery, 100, 0, 100),
      health: clampNum(parsed.health, 100, 0, 100),
      energy: clampNum(parsed.energy, 100, 0, 100),
      hunger: clampNum(parsed.hunger, 95, 0, 100),
      happiness: clampNum(parsed.happiness, 90, 0, 100),
      xp: clampInt(parsed.xp, 0, 0, 9999999),
      level: clampInt(parsed.level, 1, 1, 999),
      ownsCafe: Boolean(parsed.ownsCafe),
      cafeTotalEarned: clampInt(parsed.cafeTotalEarned, 0, 0, 99999999),
      gardenPlots,
      inventory: filterAllowedIds(parsed.inventory, validShopIds),
      homeDecor: filterAllowedIds(parsed.homeDecor, validDecorIds),
      uniCerts: filterAllowedIds(parsed.uniCerts, validCertIds),
      photosTaken: filterSafeDynamicIds(parsed.photosTaken, 64),
      bag,
      achievements: filterAllowedIds(parsed.achievements, validAchIds),
      animalFriends: filterSafeDynamicIds(parsed.animalFriends, 64),
      npcHearts,
      questProgress,
      questDone: filterAllowedIds(parsed.questDone, validQuestIds),
      px: hasPos ? clampNum(parsed.px, 2062, 40, worldW - 40) : null,
      py: hasPos ? clampNum(parsed.py, 1525, 40, worldH - 40) : null
    };
  }

  const Security = Object.freeze({
    DANGEROUS_KEYS,
    escapeHtml,
    sanitizePlayerName,
    sanitizeHexColor,
    stripDangerousKeys,
    safeJsonParse,
    clampNum,
    clampInt,
    getSafeStorage,
    removeStorageKeySafe,
    sanitizeAudioPrefs,
    sanitizeSaveData
  });

  if (typeof root !== 'undefined' && root) {
    root.YasamDunya = root.YasamDunya || {};
    root.YasamDunya.Security = Security;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Security;
  }
})(typeof window !== 'undefined' ? window : globalThis);
