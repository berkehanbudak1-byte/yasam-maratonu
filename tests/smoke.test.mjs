import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const Security = require(path.join(ROOT, 'dunya', 'src', 'security.js'));

const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buf.length >= 24 && buf.subarray(0, 8).equals(sig), `${path.basename(filePath)} must be a valid PNG`);
  assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR', `${path.basename(filePath)} missing IHDR chunk`);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20)
  };
}

function createOynaHarness(options = {}) {
  const html = read('oyna.html');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'oyna.html must contain inline launcher script');

  const href = options.href || 'https://example.github.io/yasam-maratonu/oyna.html';
  const parsedUrl = new URL(href);
  const search = options.search ?? parsedUrl.search;
  const hash = options.hash ?? parsedUrl.hash;

  const elements = new Map();
  const makeEl = (id) => ({
    id,
    textContent: '',
    className: '',
    attrs: {},
    children: [],
    listeners: {},
    classList: {
      classes: new Set(),
      toggle(c, force) {
        if (force === undefined) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        } else if (force) this.classes.add(c);
        else this.classes.delete(c);
      },
      remove(c) { this.classes.delete(c); }
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(ev, fn) { this.listeners[ev] = fn; },
    replaceChildren(...nodes) { this.children = nodes; },
    getContext() { return {}; }
  });

  for (const id of [
    'playNow', 'toggleTimer', 'timerText', 'profileDesktop', 'profileTouch',
    'profileBadge', 'profileHint', 'diagWebgl', 'diagCpu', 'diagAudio',
    'telIdb', 'telQuota', 'telCache', 'telLocal', 'refreshTelemetry',
    'clearCacheBtn', 'resetSaveBtn', 'saveResetConfirm', 'confirmResetSaveBtn',
    'cancelResetSaveBtn', 'resetStatus', 'countdown'
  ]) {
    elements.set(id, makeEl(id));
  }
  elements.get('timerText').textContent = 'Oyun 3 saniye içinde otomatik başlatılıyor... (Redirecting to WebAssembly engine)';
  elements.get('toggleTimer').textContent = 'Otomatik Başlatmayı Durdur / Pause Auto-Launch';

  const store = new Map(Object.entries(options.storageSeed || {}));
  const localStorageMock = {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };

  const cacheSet = new Set(options.caches || []);
  const deletedCaches = [];
  const cachesMock = {
    keys: async () => Array.from(cacheSet),
    delete: async (k) => {
      deletedCaches.push(k);
      return cacheSet.delete(k);
    }
  };

  const unregisteredScopes = [];
  const swRegs = (options.swScopes || []).map((scope) => ({
    scope,
    unregister: async () => {
      unregisteredScopes.push(scope);
      return true;
    }
  }));

  const deletedDbs = [];
  const idbNames = options.idbNames || [];
  const indexedDBMock = options.withIdb
    ? {
        databases: async () => idbNames.map((name) => ({ name })),
        open: () => {
          const req = {};
          queueMicrotask(() => req.onerror && req.onerror());
          return req;
        },
        deleteDatabase: (name) => {
          deletedDbs.push(name);
          const req = {};
          queueMicrotask(() => req.onsuccess && req.onsuccess());
          return req;
        }
      }
    : null;

  let replacedUrl = null;
  const doc = {
    getElementById: (id) => elements.get(id) || null,
    createElement: (tag) => ({ tag, id: '', textContent: '', getContext: () => ({}) }),
    createTextNode: (text) => ({ type: 'text', textContent: text })
  };

  const win = {
    location: {
      href,
      search,
      hash,
      replace: (u) => { replacedUrl = u; }
    },
    matchMedia: () => ({ matches: false }),
    WebGL2RenderingContext: function () {},
    AudioContext: function () {},
    localStorage: localStorageMock,
    indexedDB: indexedDBMock,
    caches: cachesMock
  };

  const sandbox = {
    window: win,
    document: doc,
    navigator: {
      hardwareConcurrency: 8,
      serviceWorker: {
        getRegistrations: async () => swRegs
      }
    },
    localStorage: localStorageMock,
    caches: cachesMock,
    indexedDB: indexedDBMock,
    URL,
    URLSearchParams,
    setInterval: () => 1,
    clearInterval: () => {}
  };

  vm.runInNewContext(scriptMatch[1], sandbox, { filename: 'oyna.html' });
  return {
    elements,
    store,
    cacheSet,
    deletedCaches,
    unregisteredScopes,
    deletedDbs,
    getReplacedUrl: () => replacedUrl
  };
}

test('all JS/MJS files and inline HTML scripts pass syntax verification', () => {
  const jsDirs = [
    path.join(ROOT, 'dunya', 'src'),
    path.join(ROOT, 'tests')
  ];
  for (const dir of jsDirs) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).sort();
    assert.ok(files.length > 0, `expected JS/MJS files in ${dir}`);
    for (const file of files) {
      execFileSync(process.execPath, ['--check', path.join(dir, file)], { stdio: 'pipe' });
    }
  }
  for (const file of ['index.html', 'oyna.html']) {
    const html = read(file);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length > 0, `expected inline script in ${file}`);
    scripts.forEach((m, i) => {
      assert.doesNotThrow(() => new vm.Script(m[1], { filename: `${file}#${i}` }));
    });
  }
});

test('escapeHtml neutralizes XSS payload and playerName never enters innerHTML', () => {
  const payload = '<img src=x onerror=alert(1)>';
  const escaped = Security.escapeHtml(payload);
  assert.equal(escaped, '&lt;img src=x onerror=alert(1)&gt;');
  assert.ok(!escaped.includes('<') && !escaped.includes('>'));
  assert.equal(Security.escapeHtml(`&"'<>`), '&amp;&quot;&#39;&lt;&gt;');

  const gameJs = read('dunya', 'src', 'game.js');
  assert.doesNotMatch(gameJs, /\.innerHTML\s*=/, 'dunya/src/game.js must not assign innerHTML');
  assert.match(gameJs, /makeEl\('b',\s*null,\s*this\.playerName\)/, 'careerBanner must render playerName via text node');
});

test('localStorage access in dunya/src is safely guarded against throwing contexts', () => {
  const srcDir = path.join(ROOT, 'dunya', 'src');
  for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.js'))) {
    if (file === 'security.js') continue;
    const content = read('dunya', 'src', file);
    assert.doesNotMatch(content, /\blocalStorage\./, `${file} must route localStorage via SEC.getSafeStorage()`);
  }

  const throwingStorage = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  assert.equal(Security.removeStorageKeySafe(throwingStorage, 'yasam_maratonu_dunya_save_v4'), false);
  assert.equal(Security.removeStorageKeySafe(null, 'yasam_maratonu_dunya_save_v4'), false);
});

test('oyna.html scopes SW, cache, IndexedDB, and localStorage resets strictly to yasam-maratonu', async () => {
  const harness = createOynaHarness({
    href: 'https://example.github.io/yasam-maratonu/oyna.html?stay=1',
    swScopes: [
      'https://example.github.io/yasam-maratonu/',
      'https://example.github.io/yasam-maratonu/dunya/',
      'https://example.github.io/yasam-maratonu-4d/',
      'https://example.github.io/haber-web/',
      'https://example.github.io/'
    ],
    caches: [
      'yasam-maratonu-v1',
      'ym-dunya-v10',
      'workbox-precache-https://example.github.io/yasam-maratonu/',
      'yasam-maratonu-4d-v1',
      'ym4d-assets',
      'workbox-precache-https://example.github.io/yasam-maratonu-4d/',
      'haber-web-v1'
    ],
    storageSeed: {
      yasam_maratonu_launch_profile: 'touch',
      yasam_maratonu_dunya_save_v4: '{"day":5}',
      yasam_maratonu_audio_v7: '{"muted":false}',
      yasam_maratonu_4d_flags: 'on',
      ym4d_launch_profile: 'touch',
      ym4d_extra: 'sibling-4d',
      haber_web_pref: 'keep'
    },
    withIdb: true,
    idbNames: ['/userfs', 'yasam-maratonu-assets', 'yasam-maratonu-4d-cache', 'yasam_maratonu_4d_db', 'other-godot-project']
  });

  await new Promise((resolve) => setImmediate(resolve));

  // Initial telemetry counts only yasam-maratonu resources (excluding yasam_maratonu_4d_* and ym4d_*)
  assert.equal(harness.elements.get('telCache').textContent, 'Önbellek: 3 Cache · 2 SW');
  assert.equal(harness.elements.get('telLocal').textContent, 'LocalStorage: 3 / 7 anahtar');

  // Clear asset cache must only touch yasam-maratonu SWs and caches
  await harness.elements.get('clearCacheBtn').listeners.click();
  assert.deepEqual(harness.deletedCaches.sort(), [
    'workbox-precache-https://example.github.io/yasam-maratonu/',
    'yasam-maratonu-v1',
    'ym-dunya-v10'
  ]);
  assert.deepEqual(harness.unregisteredScopes.sort(), [
    'https://example.github.io/yasam-maratonu/',
    'https://example.github.io/yasam-maratonu/dunya/'
  ]);
  assert.ok(harness.cacheSet.has('yasam-maratonu-4d-v1'));
  assert.ok(harness.cacheSet.has('ym4d-assets'));
  assert.ok(harness.cacheSet.has('haber-web-v1'));

  // Confirmed save reset clears yasam_maratonu_* keys + /userfs/own DB without wiping sibling 4D keys or DBs
  await harness.elements.get('confirmResetSaveBtn').listeners.click();
  assert.equal(harness.store.has('yasam_maratonu_dunya_save_v4'), false);
  assert.equal(harness.store.has('yasam_maratonu_audio_v7'), false);
  assert.equal(harness.store.get('yasam_maratonu_launch_profile'), 'desktop');
  assert.equal(harness.store.get('yasam_maratonu_4d_flags'), 'on');
  assert.equal(harness.store.get('ym4d_launch_profile'), 'touch');
  assert.equal(harness.store.get('ym4d_extra'), 'sibling-4d');
  assert.equal(harness.store.get('haber_web_pref'), 'keep');
  assert.deepEqual(harness.deletedDbs.sort(), ['/userfs', 'yasam-maratonu-assets']);
});

test('oyna.html ?stay=1 invokes pauseCountdown so timer text and button update accurately', () => {
  const harness = createOynaHarness({
    href: 'https://example.github.io/yasam-maratonu/oyna.html?stay=1'
  });
  const timerText = harness.elements.get('timerText').textContent;
  const toggleText = harness.elements.get('toggleTimer').textContent;
  assert.doesNotMatch(timerText, /otomatik başlatılıyor/i);
  assert.match(timerText, /duraklatıldı/i);
  assert.match(toggleText, /Devam Ettir|Resume/i);
});

test('oyna.html targets ./index.html for both https and file:// launches', () => {
  const html = read('oyna.html');
  assert.match(html, /id="playNow"[^>]*href="\.\/index\.html"/);

  const fileHarness = createOynaHarness({
    href: 'file:///apps/yasam-maratonu/oyna.html?stay=1&profile=desktop'
  });
  assert.equal(
    fileHarness.elements.get('playNow').getAttribute('href'),
    './index.html?stay=1&profile=desktop&touch=0'
  );
});

test('manifest.json is valid and every declared icon exists with exact matching PNG dimensions', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.ok(manifest.start_url, 'manifest.json must declare start_url');
  const startPath = path.resolve(ROOT, manifest.start_url);
  assert.ok(fs.existsSync(startPath), `manifest start_url target must exist: ${manifest.start_url}`);

  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest.json must declare icons');
  const declaredSizes = new Set();
  for (const icon of manifest.icons) {
    assert.ok(icon.src && icon.sizes, 'each icon must specify src and sizes');
    const iconPath = path.resolve(ROOT, icon.src);
    assert.ok(fs.existsSync(iconPath), `icon file must exist: ${icon.src}`);
    const { width, height } = readPngDimensions(iconPath);
    assert.equal(`${width}x${height}`, icon.sizes, `icon ${icon.src} actual size ${width}x${height} must match declared ${icon.sizes}`);
    declaredSizes.add(icon.sizes);
  }
  assert.ok(declaredSizes.has('192x192'), 'manifest.json must include a valid 192x192 icon');
  assert.ok(declaredSizes.has('512x512'), 'manifest.json must include a valid 512x512 icon');
});
