/**
 * Yaşam Maratonu: Büyük Dünya v2 — 60 FPS Life Simulator Engine
 * Adds: Drivable Car ([V] + Drift + Horn [H]), Interactive Fishing Timing Mini-Game,
 * Home Interior Decoration & Upgrades, Dynamic Weather ([Y] Rain/Storm/Lightning/Snow),
 * and Snowy Mountain Peak + Hot Spring + Summit Crystals!
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  const SAVE_KEY = 'yasam_maratonu_dunya_save_v2';

  class YasamDunyaGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.miniCanvas = document.getElementById('minimapCanvas');
      this.renderer = new YD.WorldRenderer(this.canvas, this.miniCanvas);
      this.audio = new YD.CozyAudio();
      this.world = new YD.LifeWorld();

      this.keys = {};
      this.shopOpen = false;
      this.homeOpen = false;
      this.questOpen = false;
      this.helpOpen = false;
      this.minimapVisible = true;

      // Interactive Fishing Timing Mini-Game State
      this.fishing = { active: false, pos: 0.5, dir: 1, speed: 1.55 };

      this.player = {
        x: 2062, y: 1525, vx: 0, vy: 0, r: 16, angle: Math.PI / 2,
        color: '#38bdf8', walkCycle: 0,
        swimming: false, onBike: false, inCar: false, carSpeed: 0,
        speech: '', speechTimer: 0
      };
      this.parkedCar = null;
      this.skidMarks = [];
      this.damageFlash = 0;
      this.carHitInvuln = 0;

      // Life Stats
      this.day = 1;
      this.age = 20;
      this.seasonIdx = 0;
      this.weatherIdx = 0; // 0: clear, 1: rain, 2: storm, 3: snow
      this.weatherTimer = 55;
      this.lightningTimer = 6;
      this.lightningFlash = 0;
      this.timeMinutes = 8 * 60;
      this.money = 160;
      this.health = 100;
      this.energy = 100;
      this.hunger = 95;
      this.happiness = 90;
      this.xp = 0;
      this.level = 1;
      this.inventory = new Set();
      this.homeDecor = new Set();

      this.questProgress = {};
      this.questDone = new Set();

      this.todayPath = [];
      this.yesterdayPath = [];
      this.pathSampleTimer = 0;
      this.pastEcho = null;

      this.npcs = YD.NPC_TEMPLATES.map((n) => ({
        ...n, homeX: n.x, homeY: n.y, angle: 0, walkCycle: 0,
        timer: 1 + Math.random() * 3, speech: '', speechTimer: 0, lineIdx: 0
      }));

      this.cam = { x: this.player.x, y: this.player.y, zoom: 0.96 };
      this.particles = [];
      this.popups = [];
      this.weatherParticles = [];
      this.swimQuestTimer = 0;
      this.saveTimer = 0;

      this.loadSave();
      this.resize();
      this.initWeatherParticles();
      this.bindEvents();
      this.renderShop();
      this.renderHomeModal();
      this.renderQuests();

      this.say(this.player, 'Büyük Dünya v2! Karlı Zirve, Araba, Ev Dekoru & Balık Mini-Oyunu! ✨', 3.8);
      this.lastTime = performance.now();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.viewW = window.innerWidth;
      this.viewH = window.innerHeight;
      this.canvas.width = Math.floor(this.viewW * dpr);
      this.canvas.height = Math.floor(this.viewH * dpr);
      this.renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    initWeatherParticles() {
      this.weatherParticles = [];
      for (let i = 0; i < 65; i++) {
        this.weatherParticles.push({
          x: Math.random() * this.viewW,
          y: Math.random() * this.viewH,
          vx: -25 - Math.random() * 30,
          vy: 35 + Math.random() * 55,
          r: 2 + Math.random() * 2.4
        });
      }
    }

    clearAllKeys() {
      for (const k in this.keys) this.keys[k] = false;
      if (this.player) {
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.carSpeed = 0;
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('blur', () => this.clearAllKeys());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.clearAllKeys();
      });
      window.addEventListener('wheel', (e) => {
        this.cam.zoom = Math.max(0.62, Math.min(1.45, this.cam.zoom - Math.sign(e.deltaY) * 0.08));
      }, { passive: true });

      window.addEventListener('keydown', (e) => {
        this.audio.unlock();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        this.keys[e.code] = true;

        if (e.code === 'Escape') {
          this.closeAllModals();
          if (this.fishing.active) this.stopFishing();
          return;
        }

        if (e.code === 'KeyG') { this.toggleQuests(!this.questOpen); return; }
        if (e.code === 'KeyI') { this.toggleShop(!this.shopOpen); return; }
        if (e.code === 'KeyK') { this.toggleHelp(!this.helpOpen); return; }
        if (e.code === 'KeyM') { this.toggleMap(); return; }
        if (e.code === 'KeyN') { this.toggleMusic(); return; }

        if (this.shopOpen || this.homeOpen || this.questOpen || this.helpOpen) return;

        if (this.fishing.active) {
          if (e.code === 'KeyE' || e.code === 'Space') this.resolveFishingAttempt();
          return;
        }

        if (e.code === 'KeyE' || e.code === 'Space') {
          if (this.player.inCar && e.code === 'Space') {
            this.audio.carHorn();
            this.popup(this.player.x, this.player.y - 34, 'DÜÜT! 🚗', '#fde047');
          } else {
            this.handleInteract();
          }
        }
        if (e.code === 'KeyH' && this.player.inCar) {
          this.audio.carHorn();
          this.popup(this.player.x, this.player.y - 34, 'DÜÜT! 🚗', '#fde047');
        }
        if (e.code === 'KeyB') this.toggleBike();
        if (e.code === 'KeyV') this.toggleCar();
        if (e.code === 'KeyT') this.useHourglass();
        if (e.code === 'KeyY') this.cycleWeather();
        if (e.code === 'Equal' || e.code === 'NumpadAdd') this.cam.zoom = Math.min(1.45, this.cam.zoom + 0.1);
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.cam.zoom = Math.max(0.62, this.cam.zoom - 0.1);
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      document.getElementById('btnQuests').addEventListener('click', () => { this.audio.unlock(); this.toggleQuests(!this.questOpen); });
      document.getElementById('btnCloseQuests').addEventListener('click', () => this.toggleQuests(false));
      document.getElementById('btnShop').addEventListener('click', () => { this.audio.unlock(); this.toggleShop(!this.shopOpen); });
      document.getElementById('btnCloseShop').addEventListener('click', () => this.toggleShop(false));
      document.getElementById('btnCloseHome').addEventListener('click', () => this.toggleHome(false));
      document.getElementById('btnHomeSleep').addEventListener('click', () => { this.toggleHome(false); this.startNextDay(false); });
      document.getElementById('btnMapToggle').addEventListener('click', () => { this.audio.unlock(); this.toggleMap(); });
      document.getElementById('btnHelp').addEventListener('click', () => { this.audio.unlock(); this.toggleHelp(!this.helpOpen); });
      document.getElementById('btnCloseHelp').addEventListener('click', () => this.toggleHelp(false));
      document.getElementById('btnBike').addEventListener('click', () => { this.audio.unlock(); this.toggleBike(); });
      document.getElementById('btnCar').addEventListener('click', () => { this.audio.unlock(); this.toggleCar(); });
      document.getElementById('btnWeather').addEventListener('click', () => { this.audio.unlock(); this.cycleWeather(); });
      document.getElementById('btnSeason').addEventListener('click', () => { this.audio.unlock(); this.useHourglass(); });
      document.getElementById('btnMusic').addEventListener('click', () => { this.audio.unlock(); this.toggleMusic(); });
      document.getElementById('btnFishCatch').addEventListener('click', () => { this.audio.unlock(); this.resolveFishingAttempt(); });
      document.getElementById('btnResetSave').addEventListener('click', () => {
        if (confirm('Kayıt sıfırlansın mı?')) { localStorage.removeItem(SAVE_KEY); location.reload(); }
      });

      document.querySelectorAll('.touch-btn').forEach((btn) => {
        const code = btn.dataset.key;
        const down = (ev) => {
          ev.preventDefault(); this.audio.unlock(); this.keys[code] = true;
          if (code === 'KeyE') {
            if (this.fishing.active) this.resolveFishingAttempt();
            else this.handleInteract();
          }
          if (code === 'KeyV') this.toggleCar();
        };
        const up = (ev) => { ev.preventDefault(); this.keys[code] = false; };
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });
        btn.addEventListener('touchcancel', up, { passive: false });
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);
        btn.addEventListener('mouseleave', up);
      });
    }

    saveGame() {
      const data = {
        day: this.day, age: this.age, seasonIdx: this.seasonIdx, weatherIdx: this.weatherIdx,
        timeMinutes: this.timeMinutes, money: this.money,
        health: this.health, energy: this.energy, hunger: this.hunger,
        happiness: this.happiness, xp: this.xp, level: this.level,
        inventory: [...this.inventory], homeDecor: [...this.homeDecor],
        questProgress: this.questProgress, questDone: [...this.questDone],
        px: this.player.x, py: this.player.y
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (_) {}
    }

    loadSave() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        this.day = d.day || 1; this.age = d.age || 20;
        this.seasonIdx = d.seasonIdx || 0; this.weatherIdx = d.weatherIdx || 0;
        this.timeMinutes = d.timeMinutes || 480;
        this.money = d.money ?? 160; this.health = d.health ?? 100;
        this.energy = d.energy ?? 100; this.hunger = d.hunger ?? 95;
        this.happiness = d.happiness ?? 90; this.xp = d.xp || 0; this.level = d.level || 1;
        this.inventory = new Set(d.inventory || []);
        this.homeDecor = new Set(d.homeDecor || []);
        this.questProgress = d.questProgress || {};
        this.questDone = new Set(d.questDone || []);
        if (d.px && d.py) { this.player.x = d.px; this.player.y = d.py; }
      } catch (_) {}
    }

    say(ent, txt, dur = 2.6) { ent.speech = txt; ent.speechTimer = dur; }
    popup(x, y, text, color = '#ffe135') { this.popups.push({ x, y, text, color, life: 1.25, maxLife: 1.25 }); }
    burst(x, y, color, count = 10) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, spd = 40 + Math.random() * 110;
        this.particles.push({
          x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          size: 3 + Math.random() * 3.5, color, life: 0.45 + Math.random() * 0.3, maxLife: 0.75
        });
      }
    }

    addXp(amount) {
      this.xp += amount;
      const needed = this.level * 100;
      if (this.xp >= needed) {
        this.xp -= needed; this.level++;
        this.audio.levelUp();
        this.popup(this.player.x, this.player.y - 45, `SEVİYE ${this.level}! 🌟`, '#fde047');
        this.burst(this.player.x, this.player.y, '#fde047', 22);
      }
    }

    advanceQuest(id, amt = 1) {
      if (this.questDone.has(id)) return;
      this.questProgress[id] = (this.questProgress[id] || 0) + amt;
      const q = YD.QUESTS.find((x) => x.id === id);
      if (q && this.questProgress[id] >= q.target) {
        this.questDone.add(id);
        this.money += q.rewardMoney;
        this.addXp(q.rewardXp);
        this.happiness = Math.min(100, this.happiness + 15);
        this.audio.levelUp();
        this.popup(this.player.x, this.player.y - 54, `GÖREV TAMAM! +₺${q.rewardMoney}`, '#4ade80');
      }
      this.renderQuests();
    }

    toggleMusic() {
      this.audio.musicOn = !this.audio.musicOn;
      document.getElementById('btnMusic').innerHTML = this.audio.musicOn ? '🎵<span>N</span>' : '🔇<span>N</span>';
    }

    toggleMap() {
      this.minimapVisible = !this.minimapVisible;
      document.getElementById('minimapBox').classList.toggle('hidden', !this.minimapVisible);
    }

    cycleWeather() {
      this.weatherIdx = (this.weatherIdx + 1) % YD.WEATHERS.length;
      const w = YD.WEATHERS[this.weatherIdx];
      this.popup(this.player.x, this.player.y - 36, `${w.icon} HAVA: ${w.name.toUpperCase()}`, '#38bdf8');
      if (w.id === 'storm') { this.lightningFlash = 0.8; this.audio.thunder(); }
    }

    toggleBike() {
      if (!this.inventory.has('bike')) {
        this.say(this.player, 'Önce Marketten [I] Bisiklet (₺160) almalısın! 🚲', 2.4); return;
      }
      if (this.player.swimming) { this.say(this.player, 'Suda bisiklet sürülmez! 😅', 1.8); return; }
      if (this.player.inCar) this.toggleCar();
      this.player.onBike = !this.player.onBike;
      this.audio.bikeBell();
      this.popup(this.player.x, this.player.y - 28, this.player.onBike ? '🚲 BİSİKLET AÇIK' : '🚶 YÜRÜYÜŞ', '#38bdf8');
    }

    toggleCar() {
      if (!this.inventory.has('car')) {
        this.say(this.player, 'Marketten [I] Elektrikli Araba (₺340) al! 🚗', 2.5); return;
      }
      if (this.player.swimming) { this.say(this.player, 'Denizden karaya çıkınca arabaya binebilirsin!', 2.2); return; }
      this.player.onBike = false;
      if (!this.player.inCar) {
        this.player.inCar = true;
        this.player.carSpeed = 0;
        this.parkedCar = null;
        this.audio.carStart();
        this.popup(this.player.x, this.player.y - 32, '🚗 ARABA MODU! ([H]/[Space] Korna)', '#22d3ee');
      } else {
        this.player.inCar = false;
        this.parkedCar = { x: this.player.x, y: this.player.y, angle: this.player.angle };
        this.player.x += Math.cos(this.player.angle + Math.PI / 2) * 32;
        this.player.y += Math.sin(this.player.angle + Math.PI / 2) * 32;
        this.popup(this.player.x, this.player.y - 28, '🚶 ARABADAN İNDİN', '#cbd5e1');
      }
    }

    useHourglass() {
      if (!this.inventory.has('hourglass')) {
        this.say(this.player, '4D Kum Saati için Marketten [I] al! ⏳', 2.4); return;
      }
      this.seasonIdx = (this.seasonIdx + 1) % YD.SEASONS.length;
      this.audio.timeWarp();
      const s = YD.SEASONS[this.seasonIdx];
      this.burst(this.player.x, this.player.y, '#38bdf8', 24);
      this.popup(this.player.x, this.player.y - 36, `⏳ ${s.icon} ${s.name.toUpperCase()}!`, '#38bdf8');
      this.saveGame();
    }

    closeAllModals() {
      this.clearAllKeys();
      this.shopOpen = false;
      this.homeOpen = false;
      this.questOpen = false;
      this.helpOpen = false;
      document.getElementById('shopModal').classList.add('hidden');
      document.getElementById('homeModal').classList.add('hidden');
      document.getElementById('questModal').classList.add('hidden');
      document.getElementById('helpModal').classList.add('hidden');
    }

    toggleShop(open) {
      this.closeAllModals();
      this.shopOpen = open;
      document.getElementById('shopModal').classList.toggle('hidden', !open);
      if (open) this.renderShop();
    }

    toggleHome(open) {
      this.closeAllModals();
      this.homeOpen = open;
      document.getElementById('homeModal').classList.toggle('hidden', !open);
      if (open) this.renderHomeModal();
    }

    toggleQuests(open) {
      this.closeAllModals();
      this.questOpen = open;
      document.getElementById('questModal').classList.toggle('hidden', !open);
      if (open) this.renderQuests();
    }

    toggleHelp(open) {
      this.closeAllModals();
      this.helpOpen = open;
      document.getElementById('helpModal').classList.toggle('hidden', !open);
    }

    handleCarHitPlayer(car) {
      if (this.carHitInvuln > 0) return;
      this.carHitInvuln = 1.25;
      this.damageFlash = 0.85;
      this.audio.carHorn();
      this.audio.miss();

      const p = this.player;
      const dmg = p.inCar ? 6 : 18;
      this.health = Math.max(0, this.health - dmg);
      this.happiness = Math.max(0, this.happiness - 6);

      // Push player safely sideways out of the car's bumper path!
      const pushAng = Math.atan2(p.y - car.y, p.x - car.x);
      p.x += Math.cos(pushAng) * 44;
      p.y += Math.sin(pushAng) * 44;
      if (p.inCar) p.carSpeed = -120;
      this.world.resolveCollisions(p, p.inCar);

      this.burst(p.x, p.y, '#ef4444', 14);
      this.popup(p.x, p.y - 36, p.inCar ? `-${dmg} ❤️ ÇARPIŞMA!` : `-${dmg} ❤️ ARABA ÇARPTI!!`, '#ef4444');
      this.say(p, 'AHH!! Trafiğe dikkat etmeliyim! 🚗💥', 2.4);

      // If Health hits 0 -> Emergency Hospital Recovery at Home!
      if (this.health <= 0) {
        const fee = Math.min(this.money, 40);
        this.money -= fee;
        this.health = 80;
        this.energy = Math.max(50, this.energy);
        p.inCar = false;
        p.onBike = false;
        p.x = 2062; p.y = 1525;
        this.say(p, `🏥 Acil servisten taburcu oldun! (-₺${fee})`, 3.6);
      }
      this.saveGame();
    }

    renderShop() {
      const grid = document.getElementById('shopGrid');
      if (!grid) return;
      grid.innerHTML = YD.SHOP_ITEMS.map((item) => {
        const owned = this.inventory.has(item.id);
        return `
          <div class="shop-item">
            <div style="font-size:24px;">${item.icon}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; color:#f8fafc;">${item.name}</div>
              <div style="font-size:11px; color:#94a3b8;">${item.desc}</div>
            </div>
            <button class="shop-buy-btn ${owned ? 'owned' : ''}" data-item="${item.id}" ${owned ? 'disabled' : ''}>
              ${owned ? 'ALINDI ✓' : `₺${item.price}`}
            </button>
          </div>`;
      }).join('');

      grid.querySelectorAll('.shop-buy-btn:not(.owned)').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = YD.SHOP_ITEMS.find((i) => i.id === btn.dataset.item);
          if (!item) return;
          if (this.money < item.price) { this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444'); return; }
          this.money -= item.price;
          this.inventory.add(item.id);
          this.audio.coin();
          this.popup(this.player.x, this.player.y - 34, `${item.icon} ${item.name} ALINDI!`, '#4ade80');
          this.renderShop();
          this.saveGame();
        });
      });
    }

    renderHomeModal() {
      // Visual Room Preview showing unlocked cozy items!
      const preview = document.getElementById('homeRoomPreview');
      if (preview) {
        const itemsHtml = [
          `<div class="room-slot">🛏️ Yatak</div>`,
          ...YD.HOME_DECOR.map((d) => {
            const has = this.homeDecor.has(d.id);
            return `<div class="room-slot ${has ? 'unlocked' : 'locked'}">${d.icon} ${d.name}</div>`;
          })
        ].join('');
        preview.innerHTML = itemsHtml;
      }

      // Interactive Home Actions (Remote Work PC / Watch TV / Play Guitar!)
      const acts = document.getElementById('homeActionsRow');
      if (acts) {
        let html = '';
        if (this.homeDecor.has('pc_desk')) html += `<button class="hud-btn gold" id="actRemoteWork">🖥️ Evden Çalış (+₺95)</button>`;
        if (this.homeDecor.has('sofa_tv')) html += `<button class="hud-btn" id="actWatchTv">🛋️ Film Molası (+35 Mutluluk)</button>`;
        if (this.homeDecor.has('guitar'))  html += `<button class="hud-btn" id="actPlayGuitar">🎸 Gitar Çal (+25 Mutluluk)</button>`;
        acts.innerHTML = html;

        const rw = document.getElementById('actRemoteWork');
        if (rw) rw.addEventListener('click', () => {
          if (this.energy < 18) { this.popup(this.player.x, this.player.y - 30, 'Çok yorgunsun, uyu!', '#ef4444'); return; }
          this.energy -= 18; this.money += 95; this.addXp(22); this.timeMinutes += 75;
          this.audio.coin(); this.popup(this.player.x, this.player.y - 34, '🖥️ Remote İş! +₺95', '#4ade80');
          this.advanceQuest('q_work', 1); this.saveGame();
        });
        const tv = document.getElementById('actWatchTv');
        if (tv) tv.addEventListener('click', () => {
          this.happiness = Math.min(100, this.happiness + 35); this.energy = Math.min(100, this.energy + 15);
          this.timeMinutes += 45; this.audio.pickup();
          this.popup(this.player.x, this.player.y - 34, '🛋️ Süper Film! +35 Mutluluk', '#38bdf8');
          this.saveGame();
        });
        const gt = document.getElementById('actPlayGuitar');
        if (gt) gt.addEventListener('click', () => {
          this.happiness = Math.min(100, this.happiness + 25); this.addXp(10);
          this.audio.guitar();
          this.popup(this.player.x, this.player.y - 34, '🎸 Akustik Ritim! +25 Mutluluk', '#facc15');
          this.saveGame();
        });
      }

      const grid = document.getElementById('homeDecorGrid');
      if (!grid) return;
      grid.innerHTML = YD.HOME_DECOR.map((d) => {
        const owned = this.homeDecor.has(d.id);
        return `
          <div class="shop-item">
            <div style="font-size:22px;">${d.icon}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; color:#f8fafc;">${d.name}</div>
              <div style="font-size:11px; color:#94a3b8;">${d.desc}</div>
            </div>
            <button class="shop-buy-btn ${owned ? 'owned' : ''}" data-decor="${d.id}" ${owned ? 'disabled' : ''}>
              ${owned ? 'ODADA ✓' : `₺${d.price}`}
            </button>
          </div>`;
      }).join('');

      grid.querySelectorAll('.shop-buy-btn:not(.owned)').forEach((btn) => {
        btn.addEventListener('click', () => {
          const d = YD.HOME_DECOR.find((x) => x.id === btn.dataset.decor);
          if (!d) return;
          if (this.money < d.price) { this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444'); return; }
          this.money -= d.price;
          this.homeDecor.add(d.id);
          this.happiness = Math.min(100, this.happiness + 15);
          this.audio.coin();
          this.renderHomeModal();
          this.saveGame();
        });
      });
    }

    renderQuests() {
      const box = document.getElementById('questList');
      if (!box) return;
      box.innerHTML = YD.QUESTS.map((q) => {
        const done = this.questDone.has(q.id);
        const cur = Math.min(q.target, this.questProgress[q.id] || 0);
        return `<div class="quest-row ${done ? 'done' : ''}">${done ? '✅' : '⬜'} ${q.title} (${cur}/${q.target})</div>`;
      }).join('');
    }

    /* =======================================================================
       INTERACTIVE FISHING TIMING MINI-GAME
       ======================================================================= */
    startFishing() {
      if (this.energy < 10) { this.say(this.player, 'Olta sallayacak enerjin kalmadı!', 2.0); return; }
      this.fishing.active = true;
      this.fishing.pos = 0.05;
      this.fishing.dir = 1;
      this.fishing.speed = this.inventory.has('rod') ? 1.25 : 1.65;
      document.getElementById('fishSweetZone').style.width = this.inventory.has('rod') ? '24%' : '15%';
      document.getElementById('fishingBarWrap').classList.remove('hidden');
      this.audio.splash();
    }

    stopFishing() {
      this.fishing.active = false;
      document.getElementById('fishingBarWrap').classList.add('hidden');
    }

    resolveFishingAttempt() {
      if (!this.fishing.active) return;
      const distFromCenter = Math.abs(this.fishing.pos - 0.5);
      const sweetHalf = this.inventory.has('rod') ? 0.12 : 0.075;
      const rainBonus = (this.weatherIdx === 1 || this.weatherIdx === 2) ? 1.4 : 1.0;

      this.stopFishing();
      this.energy = Math.max(0, this.energy - 10);
      this.timeMinutes += 35;

      if (distFromCenter <= sweetHalf) {
        // GOLDEN PERFECT CATCH!
        const val = Math.round((this.inventory.has('rod') ? 185 : 125) * rainBonus);
        this.money += val;
        this.happiness = Math.min(100, this.happiness + 20);
        this.addXp(36);
        this.audio.levelUp();
        this.burst(this.player.x, this.player.y + 30, '#fde047', 22);
        this.popup(this.player.x, this.player.y - 38, `🌟 4D ALTIN BALIK! +₺${val}`, '#fde047');
        this.advanceQuest('q_fish', 1);
      } else if (distFromCenter <= 0.28) {
        // GOOD NORMAL CATCH
        const val = Math.round((this.inventory.has('rod') ? 85 : 55) * rainBonus);
        this.money += val;
        this.happiness = Math.min(100, this.happiness + 12);
        this.addXp(20);
        this.audio.coin();
        this.burst(this.player.x, this.player.y + 30, '#38bdf8', 14);
        this.popup(this.player.x, this.player.y - 34, `🐟 Taze Levrek! +₺${val}`, '#38bdf8');
        this.advanceQuest('q_fish', 1);
      } else {
        // MISSED!
        this.audio.miss();
        this.popup(this.player.x, this.player.y - 34, '🥾 Kaçtı! Tekrar dene!', '#fb7185');
      }
      this.saveGame();
    }

    findNearestInteraction() {
      const p = this.player;
      for (const fg of this.world.forageables) {
        if (!fg.collected && Math.hypot(p.x - fg.x, p.y - fg.y) < 52) {
          const lbl = fg.kind === 'crystal' ? '💎 Zirve Kristali Topla (+₺65)' : (fg.kind === 'berry' ? '🍓 Böğürtlen Topla' : '🍄 Mantar Topla');
          return { kind: 'forage', ref: fg, text: `[E] ${lbl}` };
        }
      }
      for (const npc of this.npcs) {
        if (Math.hypot(p.x - npc.x, p.y - npc.y) < 64) {
          return { kind: 'npc', ref: npc, text: `[E] 💬 ${npc.name} ile Konuş` };
        }
      }
      for (const it of this.world.interactables) {
        if (Math.hypot(p.x - it.x, p.y - it.y) < it.r + 24) {
          return { kind: it.kind, ref: it, text: `[E] ${it.label}` };
        }
      }
      return null;
    }

    handleInteract() {
      if (this.shopOpen || this.homeOpen) return;
      const target = this.findNearestInteraction();
      if (!target) return;
      const p = this.player;
      const bonusMult = this.inventory.has('sisyphus') ? 1.4 : 1.0;

      if (target.kind === 'forage') {
        target.ref.collected = true;
        target.ref.respawnTimer = 42;
        if (target.ref.kind === 'crystal') {
          const val = Math.round(65 * bonusMult);
          this.money += val; this.addXp(26);
          this.audio.coin();
          this.burst(target.ref.x, target.ref.y, '#38bdf8', 18);
          this.popup(p.x, p.y - 32, `💎 Zirve Kristali! +₺${val}`, '#38bdf8');
        } else {
          this.hunger = Math.min(100, this.hunger + 16);
          this.health = Math.min(100, this.health + 8);
          this.money += 20; this.addXp(14);
          this.audio.pickup();
          this.burst(target.ref.x, target.ref.y, '#4ade80', 12);
          this.popup(p.x, p.y - 30, '+16 Tokluk • +₺20 🍓', '#4ade80');
          this.advanceQuest('q_forest', 1);
        }
      } else if (target.kind === 'npc') {
        const npc = target.ref;
        this.say(npc, npc.lines[npc.lineIdx++ % npc.lines.length], 3.2);
        this.happiness = Math.min(100, this.happiness + 6);
        this.addXp(8); this.audio.pickup();
      } else if (target.kind === 'home') {
        this.toggleHome(true);
      } else if (target.kind === 'lodge' || target.kind === 'hotspring') {
        this.health = 100;
        this.energy = Math.min(100, this.energy + 45);
        this.happiness = Math.min(100, this.happiness + 30);
        this.timeMinutes += 40;
        this.audio.pickup();
        this.burst(p.x, p.y, '#2dd4bf', 20);
        this.popup(p.x, p.y - 36, '♨️ Karlı Zirve & Kaplıca Şifası! (+%100 Sağlık)', '#2dd4bf');
        this.advanceQuest('q_mountain', 1);
      } else if (target.kind === 'summit') {
        this.addXp(Math.round(50 * bonusMult));
        this.happiness = Math.min(100, this.happiness + 25);
        this.audio.levelUp();
        this.burst(this.world.summitRock.x, this.world.summitRock.y, '#fde047', 22);
        this.say(p, 'Sisyphos\'un Zirvesine ulaştın! (+50 XP) 🪨🏔️', 3.0);
        this.advanceQuest('q_mountain', 1);
      } else if (target.kind === 'work') {
        if (this.energy < 22) { this.say(p, 'Çok yorgunum, önce uyu veya kahve iç! 😴', 2.2); return; }
        const pay = Math.round((80 + this.level * 24) * bonusMult);
        this.energy -= 22; this.hunger = Math.max(0, this.hunger - 14);
        this.timeMinutes += 120; this.money += pay; this.addXp(28);
        this.audio.coin();
        this.popup(p.x, p.y - 34, `+₺${pay} MAAŞ! 💼`, '#facc15');
        this.advanceQuest('q_work', 1);
      } else if (target.kind === 'cafe') {
        if (this.money < 25) { this.say(p, 'Kahve için ₺25 gerekiyor!', 2.0); return; }
        this.money -= 25;
        this.energy = Math.min(100, this.energy + 35);
        this.hunger = Math.min(100, this.hunger + 35);
        this.happiness = Math.min(100, this.happiness + 18);
        this.audio.pickup();
        this.popup(p.x, p.y - 34, '☕ Latte & Simit! +Enerji +Tokluk', '#fb923c');
      } else if (target.kind === 'study') {
        if (this.energy < 18) { this.say(p, 'Kafam almıyor, dinlenmeliyim!', 2.0); return; }
        this.energy -= 18; this.timeMinutes += 90;
        this.addXp(Math.round(45 * bonusMult));
        this.audio.pickup();
        this.popup(p.x, p.y - 34, `🎓 +${Math.round(45 * bonusMult)} BİLGİ XP!`, '#38bdf8');
      } else if (target.kind === 'shop') {
        this.toggleShop(true);
      } else if (target.kind === 'campfire') {
        this.energy = Math.min(100, this.energy + 30);
        this.happiness = Math.min(100, this.happiness + 22);
        this.health = Math.min(100, this.health + 15);
        this.timeMinutes += 45; this.audio.pickup();
        this.burst(this.world.campfire.x, this.world.campfire.y, '#fb923c', 16);
        this.popup(p.x, p.y - 34, '🔥 Kamp Ateşi Huzuru! +Enerji', '#fb923c');
      } else if (target.kind === 'altar') {
        this.addXp(35); this.happiness = Math.min(100, this.happiness + 20);
        this.audio.timeWarp();
        this.burst(this.world.altar.x, this.world.altar.y, '#38bdf8', 20);
        this.say(p, 'Zaman bir nehir gibi akıyor... (+35 XP) ⏳', 2.8);
      } else if (target.kind === 'workout') {
        if (this.energy < 15) { this.say(p, 'Spor için biraz enerji lazım!', 2.0); return; }
        this.energy -= 15;
        this.health = Math.min(100, this.health + Math.round(24 * bonusMult));
        this.happiness = Math.min(100, this.happiness + 16);
        this.addXp(22); this.audio.pickup();
        this.popup(p.x, p.y - 34, '🏃 Harika Antrenman! +Sağlık', '#4ade80');
        this.advanceQuest('q_park', 1);
      } else if (target.kind === 'relax') {
        this.energy = Math.min(100, this.energy + 22);
        this.happiness = Math.min(100, this.happiness + 24);
        this.timeMinutes += 30; this.audio.pickup();
        this.popup(p.x, p.y - 34, '🦆 Ördekleri İzledin (+Mutluluk)', '#38bdf8');
        this.advanceQuest('q_park', 1);
      } else if (target.kind === 'fish') {
        this.startFishing();
      } else if (target.kind === 'lighthouse') {
        this.happiness = Math.min(100, this.happiness + 25);
        this.addXp(20); this.audio.pickup();
        this.say(p, 'Deniz Fenerinden tüm kıyı görünüyor! 🗼✨', 3.0);
      }
      this.saveGame();
    }

    startNextDay(fainted = false) {
      this.day++;
      if (this.day % 3 === 1) {
        this.seasonIdx = (this.seasonIdx + 1) % YD.SEASONS.length;
        this.age++;
      }
      this.timeMinutes = 7 * 60 + 30;
      this.energy = fainted ? 75 : 100;
      this.health = Math.min(100, this.health + 20 + (this.homeDecor.has('plants') ? 15 : 0));
      this.happiness = Math.min(100, this.happiness + (this.homeDecor.has('espresso_m') ? 15 : 0));
      this.hunger = Math.max(45, this.hunger - 12);
      this.audio.sleep();

      // Natural weather roll each morning
      const r = Math.random();
      this.weatherIdx = this.seasonIdx === 3 ? (r < 0.6 ? 3 : 0) : (r < 0.58 ? 0 : (r < 0.85 ? 1 : 2));

      if (this.todayPath.length > 5) {
        this.yesterdayPath = [...this.todayPath];
        this.todayPath = [];
        this.pastEcho = { x: this.yesterdayPath[0].x, y: this.yesterdayPath[0].y, idx: 0, claimed: false };
      }

      this.player.x = 2062; this.player.y = 1525;
      this.player.onBike = false; this.player.inCar = false;
      const s = YD.SEASONS[this.seasonIdx], w = YD.WEATHERS[this.weatherIdx];
      this.say(
        this.player,
        fainted
          ? `Enerjin bitti, eve taşındın! Gün ${this.day}`
          : `Günaydın! Gün ${this.day} • ${s.icon} ${s.name} • ${w.icon} ${w.name}`,
        3.5
      );
      this.saveGame();
    }

    update(dt) {
      this.damageFlash = Math.max(0, this.damageFlash - dt * 2.2);
      this.carHitInvuln = Math.max(0, this.carHitInvuln - dt);

      if (this.shopOpen || this.homeOpen || this.questOpen || this.helpOpen) return;

      // Update Fishing Timing Bar if active
      if (this.fishing.active) {
        this.fishing.pos += this.fishing.dir * this.fishing.speed * dt;
        if (this.fishing.pos >= 1) { this.fishing.pos = 1; this.fishing.dir = -1; }
        if (this.fishing.pos <= 0) { this.fishing.pos = 0; this.fishing.dir = 1; }
        document.getElementById('fishCursor').style.left = `${this.fishing.pos * 100}%`;
        return;
      }

      this.timeMinutes += dt * 2.4;
      if (this.timeMinutes >= 24 * 60) this.startNextDay(false);

      // Dynamic Weather & Storm Lightning!
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 50 + Math.random() * 45;
        const r = Math.random();
        this.weatherIdx = this.seasonIdx === 3 ? (r < 0.55 ? 3 : 0) : (r < 0.55 ? 0 : (r < 0.84 ? 1 : 2));
      }
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.8);
      if (this.weatherIdx === 2) {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          this.lightningTimer = 5 + Math.random() * 7;
          this.lightningFlash = 0.85;
          this.audio.thunder();
        }
      }

      const p = this.player;
      p.speechTimer = Math.max(0, p.speechTimer - dt);

      if (p.inCar) {
        // CRISP DRIVABLE CAR PHYSICS (Instant braking when gas released!)
        const accelInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
        const steerInput = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
        const maxCarSpd = 540;
        if (accelInput !== 0) {
          p.carSpeed += accelInput * 760 * dt;
          p.carSpeed = Math.max(-220, Math.min(maxCarSpd, p.carSpeed));
        } else {
          // Strong engine braking so releasing W stops quickly without coasting forever
          p.carSpeed *= Math.pow(0.0004, dt);
          if (Math.abs(p.carSpeed) < 18) p.carSpeed = 0;
        }
        if (Math.abs(p.carSpeed) > 20) {
          p.angle += steerInput * 3.1 * Math.sign(p.carSpeed) * dt;
          if (Math.abs(steerInput) > 0 && Math.abs(p.carSpeed) > 320 && Math.random() < dt * 22) {
            this.skidMarks.push({ x: p.x - Math.cos(p.angle) * 20, y: p.y - Math.sin(p.angle) * 20, alpha: 0.45 });
            if (this.skidMarks.length > 90) this.skidMarks.shift();
          }
        }
        p.vx = Math.cos(p.angle) * p.carSpeed;
        p.vy = Math.sin(p.angle) * p.carSpeed;
        p.x += p.vx * dt; p.y += p.vy * dt;
        this.world.resolveCollisions(p, true);
      } else {
        // Ultra-Responsive Foot / Bike / Swimming Movement (Instant stop on key release!)
        let ix = 0, iy = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) iy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) iy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
        const len = Math.hypot(ix, iy);
        if (len > 0) { ix /= len; iy /= len; }

        const inWater = this.world.isInWater(p.x, p.y);
        if (inWater && !p.swimming) {
          p.swimming = true; p.onBike = false;
          this.audio.splash(); this.burst(p.x, p.y, '#38bdf8', 12);
        } else if (!inWater && p.swimming) {
          p.swimming = false;
        }

        const sprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !p.swimming && this.energy > 8;
        const maxSpd = p.swimming ? 185 : (p.onBike ? 430 : (sprinting ? 335 : 255));
        if (len === 0) {
          p.vx = 0;
          p.vy = 0;
        } else {
          p.vx = ix * maxSpd;
          p.vy = iy * maxSpd;
          p.angle = Math.atan2(iy, ix);
          p.walkCycle += dt * (maxSpd * 0.055);
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        this.world.resolveCollisions(p, false);

        if (p.swimming) {
          this.happiness = Math.min(100, this.happiness + dt * 3.5);
          if (this.world.isInHotSpring(p.x, p.y)) {
            this.health = Math.min(100, this.health + dt * 6);
            this.energy = Math.min(100, this.energy + dt * 6);
            this.advanceQuest('q_mountain', 1);
          } else {
            this.swimQuestTimer += dt;
            if (this.swimQuestTimer >= 2.2) this.advanceQuest('q_swim', 1);
          }
        }
        this.energy = Math.max(0, this.energy - (sprinting ? 2.2 : (p.swimming ? 1.4 : 0.4)) * dt);
      }

      this.hunger = Math.max(0, this.hunger - 0.32 * dt);
      if (this.hunger <= 5) this.health = Math.max(5, this.health - 1.2 * dt);

      if (this.energy <= 0) {
        if (this.inventory.has('phoenix')) {
          this.energy = 65;
          this.popup(p.x, p.y - 38, '🪶 ANKA TÜYÜ DEVREDE! +65 Enerji', '#fb923c');
          this.burst(p.x, p.y, '#fb923c', 22);
        } else {
          this.startNextDay(true);
        }
      }

      // Past-Self 4D Echo
      this.pathSampleTimer += dt;
      if (this.pathSampleTimer >= 0.45 && this.todayPath.length < 300) {
        this.pathSampleTimer = 0; this.todayPath.push({ x: p.x, y: p.y });
      }
      if (this.pastEcho && !this.pastEcho.claimed && this.yesterdayPath.length > 1) {
        this.pastEcho.idx = (this.pastEcho.idx + dt * 2.4) % this.yesterdayPath.length;
        const pt = this.yesterdayPath[Math.floor(this.pastEcho.idx)];
        this.pastEcho.x += (pt.x - this.pastEcho.x) * Math.min(1, dt * 6);
        this.pastEcho.y += (pt.y - this.pastEcho.y) * Math.min(1, dt * 6);
        if (Math.hypot(p.x - this.pastEcho.x, p.y - this.pastEcho.y) < 36) {
          this.pastEcho.claimed = true; this.addXp(30);
          this.happiness = Math.min(100, this.happiness + 18);
          this.audio.timeWarp(); this.burst(this.pastEcho.x, this.pastEcho.y, '#fde047', 22);
          this.popup(p.x, p.y - 40, '✨ GEÇMİŞİNLE BARIŞTIN! +30 XP', '#fde047');
        }
      }

      for (const npc of this.npcs) {
        npc.speechTimer = Math.max(0, npc.speechTimer - dt);
        npc.timer -= dt;
        if (npc.timer <= 0) { npc.timer = 2.5 + Math.random() * 3.5; npc.angle = Math.random() * Math.PI * 2; }
        const nx = npc.x + Math.cos(npc.angle) * 24 * dt, ny = npc.y + Math.sin(npc.angle) * 24 * dt;
        if (Math.hypot(nx - npc.homeX, ny - npc.homeY) < 95 && !this.world.isInsideBuilding(nx, ny, 24)) {
          npc.x = nx; npc.y = ny; npc.walkCycle += dt * 5;
        } else npc.angle += Math.PI;
      }

      this.world.update(dt, p, (car) => this.handleCarHitPlayer(car));

      for (let i = this.skidMarks.length - 1; i >= 0; i--) {
        this.skidMarks[i].alpha -= dt * 0.08;
        if (this.skidMarks[i].alpha <= 0) this.skidMarks.splice(i, 1);
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i]; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
        if (pt.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const pp = this.popups[i]; pp.y -= 42 * dt; pp.life -= dt;
        if (pp.life <= 0) this.popups.splice(i, 1);
      }

      const rainSpeedMult = (this.weatherIdx === 1 || this.weatherIdx === 2) ? 6.5 : 1.0;
      for (const wp of this.weatherParticles) {
        wp.x += wp.vx * rainSpeedMult * dt;
        wp.y += wp.vy * rainSpeedMult * dt;
        if (wp.x < 0) wp.x = this.viewW;
        if (wp.y > this.viewH) { wp.y = 0; wp.x = Math.random() * this.viewW; }
      }

      // Smooth Camera with Velocity Look-Ahead + slight zoom-out when driving fast!
      const targetZoom = p.inCar ? 0.84 : 1.0;
      this.cam.zoom += (targetZoom - this.cam.zoom) * Math.min(1, dt * 2.5);
      this.cam.x += (p.x + p.vx * 0.16 - this.cam.x) * Math.min(1, dt * 7.5);
      this.cam.y += (p.y + p.vy * 0.16 - this.cam.y) * Math.min(1, dt * 7.5);

      const biome = this.world.getBiome(p.x, p.y);
      this.audio.updateAmbient(dt, biome, YD.WEATHERS[this.weatherIdx].id);

      this.saveTimer += dt;
      if (this.saveTimer >= 10) { this.saveTimer = 0; this.saveGame(); }

      this.updateHUD(biome);
    }

    updateHUD(biome) {
      document.getElementById('statHealthFill').style.width = `${this.health}%`;
      document.getElementById('statEnergyFill').style.width = `${this.energy}%`;
      document.getElementById('statHungerFill').style.width = `${this.hunger}%`;
      document.getElementById('statHappyFill').style.width = `${this.happiness}%`;

      document.getElementById('moneyBadge').textContent = `₺${Math.floor(this.money).toLocaleString()}`;
      document.getElementById('levelBadge').textContent = `LV ${this.level}`;

      const hrs = Math.floor(this.timeMinutes / 60) % 24;
      const mins = Math.floor(this.timeMinutes % 60);
      const s = YD.SEASONS[this.seasonIdx], w = YD.WEATHERS[this.weatherIdx];
      document.getElementById('clockBadge').textContent = `${s.icon} GÜN ${this.day} • YAŞ ${this.age} • ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} • ${w.icon}`;
      document.getElementById('biomeBadge').textContent = this.world.getBiomeLabel(biome);

      const prompt = this.findNearestInteraction();
      const promptEl = document.getElementById('interactPrompt');
      if (prompt && !this.fishing.active) {
        promptEl.textContent = prompt.text;
        promptEl.classList.remove('hidden');
      } else {
        promptEl.classList.add('hidden');
      }
    }

    loop(ts) {
      const dt = Math.min(0.05, (ts - this.lastTime) / 1000);
      this.lastTime = ts;
      this.update(dt);
      this.renderer.render(this);
      requestAnimationFrame((nextTs) => this.loop(nextTs));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.yasamDunyaGame = new YasamDunyaGame();
  });
})(window.YasamDunya);
