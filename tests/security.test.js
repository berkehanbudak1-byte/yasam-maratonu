'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const Security = require(path.join(ROOT, 'dunya', 'src', 'security.js'));

const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

function loadDunyaConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(read('dunya', 'src', 'config.js'), sandbox, { filename: 'dunya/src/config.js' });
  return sandbox.window.YasamDunya;
}

function runOynaLauncher(search, hash, storageSeed = {}) {
  const html = read('oyna.html');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'oyna.html must contain inline launcher script');

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

  const store = new Map(Object.entries(storageSeed));
  const localStorageMock = {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };

  let replacedUrl = null;
  const timers = [];
  const doc = {
    getElementById: (id) => elements.get(id) || null,
    createElement: (tag) => ({ tag, id: '', textContent: '', getContext: () => ({}) }),
    createTextNode: (text) => ({ type: 'text', textContent: text })
  };
  const win = {
    location: {
      href: 'https://example.github.io/yasam-maratonu/oyna.html' + search + hash,
      search,
      hash,
      replace: (u) => { replacedUrl = u; }
    },
    matchMedia: () => ({ matches: false }),
    WebGL2RenderingContext: function () {},
    AudioContext: function () {},
    localStorage: localStorageMock,
    indexedDB: null,
    caches: null
  };
  const sandbox = {
    window: win,
    document: doc,
    navigator: { hardwareConcurrency: 8 },
    localStorage: localStorageMock,
    URL,
    URLSearchParams,
    setInterval: (fn) => { timers.push(fn); return timers.length; },
    clearInterval: () => {}
  };

  vm.runInNewContext(scriptMatch[1], sandbox, { filename: 'oyna.html' });
  return { elements, store, getReplacedUrl: () => replacedUrl };
}

test('all custom JS files in dunya/src/ pass Node syntax check', () => {
  const dir = path.join(ROOT, 'dunya', 'src');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  assert.ok(files.length >= 6, 'expected all dunya/src/*.js modules including security.js');
  for (const file of files) {
    execFileSync(process.execPath, ['--check', path.join(dir, file)], { stdio: 'pipe' });
  }
});

test('inline scripts in index.html and oyna.html are syntactically valid JS', () => {
  for (const name of ['index.html', 'oyna.html']) {
    const html = read(name);
    const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.ok(matches.length >= 1, `expected inline <script> in ${name}`);
    matches.forEach((m, i) => {
      assert.doesNotThrow(() => new vm.Script(m[1], { filename: `${name}#script${i}` }));
    });
  }
});

test('index.html has Referrer-Policy and Godot-WASM/AudioWorklet-compatible CSP without touching GODOT_CONFIG', () => {
  const html = read('index.html');
  assert.match(html, /<meta\s+name="referrer"\s+content="no-referrer"\s*\/?>/i);
  const cspMatch = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?>/i);
  assert.ok(cspMatch, 'index.html must include a CSP meta tag');
  const csp = cspMatch[1];
  assert.match(csp, /'wasm-unsafe-eval'/);
  assert.match(csp, /worker-src\s+'self'\s+blob:/);
  assert.match(csp, /connect-src\s+'self'\s+blob:\s+data:/);
  assert.match(csp, /object-src\s+'none'/);
  assert.match(csp, /base-uri\s+'self'/);
  assert.match(html, /const GODOT_CONFIG = \{/);
  assert.match(html, /"index\.wasm":35376909/);
  assert.match(html, /"index\.pck":343648/);
});

test('dunya.html has Referrer-Policy, strict script-src CSP, and loads dunya/src/security.js first', () => {
  const html = read('dunya.html');
  assert.match(html, /<meta\s+name="referrer"\s+content="no-referrer"\s*\/?>/i);
  const cspMatch = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?>/i);
  assert.ok(cspMatch, 'dunya.html must define a CSP meta tag');
  const csp = cspMatch[1];
  assert.match(csp, /script-src\s+'self';/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-eval'/);
  assert.match(csp, /object-src\s+'none'/);
  assert.match(csp, /base-uri\s+'self'/);
  assert.doesNotMatch(html, /\son(?:click|load|error|change|input|submit|keydown|keyup|mouseover)=/i);

  const secPos = html.indexOf('src="dunya/src/security.js');
  const gamePos = html.indexOf('src="dunya/src/game.js');
  assert.ok(secPos > -1 && gamePos > secPos, 'dunya/src/security.js must load before dunya/src/game.js');
});

test('no unsafe innerHTML/eval/Function sinks remain in custom dunya/src/*.js or oyna.html', () => {
  const dir = path.join(ROOT, 'dunya', 'src');
  const targets = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ name: `dunya/src/${f}`, content: read('dunya', 'src', f) }));
  targets.push({ name: 'oyna.html', content: read('oyna.html') });

  const forbidden = /\.(?:innerHTML|outerHTML)\s*=|\binsertAdjacentHTML\s*\(|\bdocument\.write\s*\(|\beval\s*\(|\bnew\s+Function\s*\(/;
  for (const { name, content } of targets) {
    assert.doesNotMatch(content, forbidden, `Unsafe sink detected in ${name}`);
  }
});

test('Security.sanitizePlayerName and escapeHtml defend against XSS and control chars', () => {
  assert.equal(Security.sanitizePlayerName('  <img src=x>  ', 'Gezgin', 16), '<img src=x>');
  assert.equal(Security.sanitizePlayerName('a'.repeat(50), 'Gezgin', 16).length, 16);
  assert.equal(Security.sanitizePlayerName('\u0000\u0007\n\t  ', 'Gezgin', 16), 'Gezgin');
  assert.equal(Security.sanitizePlayerName('Ali\u0000Veli', 'Gezgin', 16), 'AliVeli');
  assert.equal(
    Security.escapeHtml('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
  );
});

test('Security.sanitizeAudioPrefs clamps volumes, blocks NaN and prototype station lookups', () => {
  const raw = JSON.stringify({
    __proto__: { polluted: true },
    muted: false,
    musicOn: true,
    musicVol: 5.0,
    ambienceVol: -3.0,
    sfxVol: null,
    station: 'toString'
  });
  const prefs = Security.sanitizeAudioPrefs(raw, ['city', 'forest']);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(prefs.muted, false);
  assert.equal(prefs.musicOn, true);
  assert.equal(prefs.musicVol, 1);
  assert.equal(prefs.ambienceVol, 0);
  assert.equal(prefs.sfxVol, undefined);
  assert.equal(prefs.station, undefined);

  const valid = Security.sanitizeAudioPrefs('{"station":"forest","sfxVol":0.5}', ['city', 'forest']);
  assert.equal(valid.station, 'forest');
  assert.equal(valid.sfxVol, 0.5);
});

test('Security.sanitizeSaveData strips prototype pollution, clamps v10 bounds, and rejects invalid IDs', () => {
  const cfg = loadDunyaConfig();
  const maliciousRaw = JSON.stringify({
    __proto__: { polluted: true },
    constructor: { prototype: { hacked: true } },
    playerName: '  <svg onload=1>extra_long_name  ',
    color: 'red;background:url(javascript:alert(1))',
    day: -50,
    age: 999999,
    seasonIdx: 99,
    weatherIdx: -4,
    dailyEventIdx: 42,
    timeMinutes: 99999,
    money: -100,
    bankBalance: 9999999999,
    carBattery: 250,
    health: 500,
    energy: -20,
    hunger: NaN,
    happiness: Infinity,
    xp: -5,
    level: 0,
    ownsCafe: 1,
    cafeTotalEarned: 999999999999,
    gardenPlots: [
      { crop: 'tomato', growth: 5.5, watered: 1 },
      { crop: '__proto__', growth: -2, watered: 0 }
    ],
    inventory: ['bike', 'evil_item', '__proto__'],
    homeDecor: ['pc_desk', 'not_real'],
    uniCerts: ['cert_fin', 'fake_cert'],
    photosTaken: ['ph_summit', 'bad<script>', '__proto__'],
    animalFriends: ['pond_ducks', 'cat_1', 'bad space!'],
    bag: { berry: 999999, __proto__: { x: 1 }, hackedItem: 50, fish: -10 },
    achievements: ['ach_rich', 'fake_ach'],
    npcHearts: { 'Barista Ela': 500, '__proto__': 99, 'Evil NPC': 10 },
    questProgress: { q_work: 50000, constructor: 99, unknown: 3 },
    questDone: ['q_work', 'fake_q'],
    px: 999999,
    py: -999
  });

  const clean = Security.sanitizeSaveData(maliciousRaw, cfg);
  assert.ok(clean);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.prototype.hacked, undefined);

  assert.equal(clean.playerName, '<svg onload=1>ex');
  assert.equal(clean.color, cfg.JACKET_COLORS[0].hex);
  assert.equal(clean.day, 1);
  assert.equal(clean.age, 999);
  assert.equal(clean.seasonIdx, cfg.SEASONS.length - 1);
  assert.equal(clean.weatherIdx, 0);
  assert.equal(clean.dailyEventIdx, cfg.DAILY_EVENTS.length - 1);
  assert.equal(clean.timeMinutes, 1439);
  assert.equal(clean.money, 0);
  assert.equal(clean.bankBalance, 99999999);
  assert.equal(clean.carBattery, 100);
  assert.equal(clean.health, 100);
  assert.equal(clean.energy, 0);
  assert.equal(clean.hunger, 95);
  assert.equal(clean.happiness, 90);
  assert.equal(clean.level, 1);
  assert.equal(clean.ownsCafe, true);
  assert.equal(clean.cafeTotalEarned, 99999999);

  assert.deepEqual(clean.gardenPlots, [
    { crop: 'tomato', growth: 1, watered: true },
    { crop: null, growth: 0, watered: false }
  ]);
  assert.deepEqual([...clean.inventory], ['bike']);
  assert.deepEqual([...clean.homeDecor], ['pc_desk']);
  assert.deepEqual([...clean.uniCerts], ['cert_fin']);
  assert.deepEqual([...clean.photosTaken], ['ph_summit']);
  assert.deepEqual([...clean.animalFriends], ['pond_ducks', 'cat_1']);
  assert.equal(clean.bag.berry, 9999);
  assert.equal(clean.bag.fish, 0);
  assert.equal(clean.bag.petfood, 2);
  assert.equal(clean.bag.hackedItem, undefined);
  assert.deepEqual([...clean.achievements], ['ach_rich']);
  assert.equal(clean.npcHearts['Barista Ela'], 100);
  assert.equal(clean.npcHearts['Evil NPC'], undefined);
  assert.equal(clean.questProgress.q_work, 9999);
  assert.equal(clean.questProgress.unknown, undefined);
  assert.deepEqual([...clean.questDone], ['q_work']);
  assert.equal(clean.px, cfg.WORLD_W - 40);
  assert.equal(clean.py, 40);

  assert.equal(Security.sanitizeSaveData('{corrupt-json', cfg), null);
  assert.equal(Security.sanitizeSaveData('[]', cfg), null);
});

test('oyna.html launcher allowlists URL query/hash and resumes countdown without innerHTML', () => {
  const res = runOynaLauncher(
    '?profile=touch&stay=1&evil=<script>&redirect=https://evil.test&lang=tr',
    '#javascript:alert(1)'
  );
  const href = res.elements.get('playNow').getAttribute('href');
  assert.equal(href, './index.html?stay=1&lang=tr&profile=touch&touch=1');

  const safeHashRes = runOynaLauncher('?profile=desktop', '#section-1');
  assert.equal(safeHashRes.elements.get('playNow').getAttribute('href'), './index.html?profile=desktop&touch=0#section-1');

  const toggleBtn = res.elements.get('toggleTimer');
  toggleBtn.listeners.click();
  const timerChildren = res.elements.get('timerText').children;
  assert.equal(timerChildren.length, 3);
  assert.equal(timerChildren[1].tag, 'strong');
  assert.equal(timerChildren[1].id, 'countdown');
  assert.equal(timerChildren[1].textContent, '3');
});

test('pre-compiled Godot WebAssembly/PCK/engine files remain untouched', () => {
  for (const bin of ['index.wasm', 'index.pck', 'index.js', 'index.audio.worklet.js']) {
    assert.ok(fs.existsSync(path.join(ROOT, bin)), `${bin} must exist`);
  }
  const diff = execFileSync('git', ['diff', '--name-only'], { cwd: ROOT, encoding: 'utf8' });
  for (const bin of ['index.wasm', 'index.pck', 'index.js', 'index.audio.worklet.js']) {
    assert.ok(!diff.split('\n').includes(bin), `Godot export file ${bin} must NEVER be modified`);
  }
});
