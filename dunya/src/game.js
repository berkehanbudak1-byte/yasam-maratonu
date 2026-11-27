/**
 * Yaşam Maratonu: Büyük Dünya v4 — Play Store / Reddit Launch Edition
 * Features:
 *  - Title & Character Customizer (Name + Jacket Color + Continue/New Life)
 *  - Loyal Pet Companion (Dog/Cat follows, swims, sniffs items, [P] to Pet!)
 *  - Backpack Inventory ([C] Eat / Sell / Grill Fish at Campfire!)
 *  - 5-Tier Career Ladder + 6 Life Achievements + Daily World Events
 *  - City Hospital (Checkups + Car-Crash Emergency Recovery)
 *  - NPC Friendship Hearts + Surprise Gifts
 *  - Closed 4-Sided City Ring-Road Traffic + Car Collision Damage
 *  - Crisp Instant-Stop Movement + Ultra-Clean On-Demand Hotkey HUD
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  const SAVE_KEY = 'yasam_maratonu_dunya_save_v4';

  class YasamDunyaGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.miniCanvas = document.getElementById('minimapCanvas');
      this.renderer = new YD.WorldRenderer(this.canvas, this.miniCanvas);
      this.audio = new YD.CozyAudio();
      this.world = new YD.LifeWorld();

      this.started = false;
      this.scene = 'world'; // 'world' | 'home'
      this.keys = {};
      this.shopOpen = false;
      this.homeOpen = false;
      this.questOpen = false;
      this.helpOpen = false;
      this.bagOpen = false;
      this.gardenOpen = false;
      this.cafeOpen = false;
      this.activePlotId = null;
      this.minimapVisible = true;

      this.fishing = { active: false, pos: 0.5, dir: 1, speed: 1.55 };
      this.barista = { active: false, timeLeft: 25, score: 0, combo: 1, served: 0, order: null, patience: 4.5, maxPatience: 4.5 };

      this.playerName = 'Gezgin';
      this.player = {
        x: 2062, y: 1525, vx: 0, vy: 0, r: 16, angle: Math.PI / 2,
        color: YD.JACKET_COLORS[0].hex, walkCycle: 0,
        swimming: false, onBike: false, inCar: false, carSpeed: 0,
        speech: '', speechTimer: 0
      };
      this.homePlayer = {
        x: 340, y: 350, vx: 0, vy: 0, r: 16, angle: -Math.PI / 2,
        color: YD.JACKET_COLORS[0].hex, walkCycle: 0
      };
      this.pet = null; // { kind: 'dog'|'cat', x, y, angle, petCd }
      this.homePet = null;
      this.parkedCar = null;
      this.skidMarks = [];
      this.damageFlash = 0;
      this.carHitInvuln = 0;

      // Life Stats
      this.day = 1;
      this.age = 20;
      this.seasonIdx = 0;
      this.weatherIdx = 0;
      this.dailyEventIdx = 0;
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
      this.ownsCafe = false;
      this.cafeTotalEarned = 0;
      this.inventory = new Set();
      this.homeDecor = new Set();
      this.bag = { berry: 0, mushroom: 0, fish: 0, goldfish: 0, grilled: 0, crystal: 0, tomato: 0, strawberry: 0, sunflower: 0 };
      this.achievements = new Set();
      this.npcHearts = {};

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

      this.cam = { x: 2300, y: 1650, zoom: 0.94 };
      this.particles = [];
      this.popups = [];
      this.weatherParticles = [];
      this.swimQuestTimer = 0;
      this.saveTimer = 0;
      this.toastTimeout = null;

      this.hasSave = this.peekSave();
      this.resize();
      this.initWeatherParticles();
      this.renderTitleScreen();
      this.bindEvents();

      this.lastTime = performance.now();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    peekSave() {
      try { return !!localStorage.getItem(SAVE_KEY); } catch (_) { return false; }
    }

    renderTitleScreen() {
      const row = document.getElementById('colorPickerRow');
      if (row) {
        row.innerHTML = YD.JACKET_COLORS.map((c) =>
          `<button class="color-dot ${c.hex === this.player.color ? 'active' : ''}" data-hex="${c.hex}" title="${c.name}" style="background:${c.hex};"></button>`
        ).join('');
        row.querySelectorAll('.color-dot').forEach((btn) => {
          btn.addEventListener('click', () => {
            this.player.color = btn.dataset.hex;
            this.renderTitleScreen();
          });
        });
      }
      const contBtn = document.getElementById('btnContinueGame');
      if (contBtn) {
        if (this.hasSave) {
          contBtn.classList.remove('hidden');
          document.getElementById('btnStartNewGame').textContent = '↺ YENİ HAYAT';
        } else {
          contBtn.classList.add('hidden');
        }
      }
    }

    beginPlay(loadExisting) {
      this.audio.unlock();
      if (loadExisting) {
        this.loadSave();
      } else {
        const input = document.getElementById('inputPlayerName');
        this.playerName = (input && input.value.trim()) || 'Gezgin';
        this.saveGame();
      }
      this.syncPetFromInventory();
      this.started = true;
      document.getElementById('titleModal').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.renderShop();
      this.renderHomeModal();
      this.renderQuests();
      this.renderBag();
      const ev = YD.DAILY_EVENTS[this.dailyEventIdx];
      this.showToast(`${ev.icon} ${ev.name} — ${ev.desc}`);
      this.say(this.player, `Merhaba ${this.playerName}! Büyük Dünya seni bekliyor! ✨`, 3.4);
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
          x: Math.random() * this.viewW, y: Math.random() * this.viewH,
          vx: -25 - Math.random() * 30, vy: 35 + Math.random() * 55, r: 2 + Math.random() * 2.4
        });
      }
    }

    clearAllKeys() {
      for (const k in this.keys) this.keys[k] = false;
      if (this.player) { this.player.vx = 0; this.player.vy = 0; this.player.carSpeed = 0; }
      if (this.homePlayer) { this.homePlayer.vx = 0; this.homePlayer.vy = 0; }
    }

    hasOpenModal() {
      return this.shopOpen || this.homeOpen || this.questOpen || this.helpOpen || this.bagOpen || this.gardenOpen || this.cafeOpen;
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('blur', () => this.clearAllKeys());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearAllKeys(); });
      window.addEventListener('wheel', (e) => {
        if (!this.started || this.scene !== 'world') return;
        this.cam.zoom = Math.max(0.62, Math.min(1.45, this.cam.zoom - Math.sign(e.deltaY) * 0.08));
      }, { passive: true });

      document.getElementById('btnContinueGame').addEventListener('click', () => this.beginPlay(true));
      document.getElementById('btnStartNewGame').addEventListener('click', () => {
        if (this.hasSave && !confirm('Mevcut kayıt silinip yeni hayata başlansın mı?')) return;
        localStorage.removeItem(SAVE_KEY);
        this.beginPlay(false);
      });

      window.addEventListener('keydown', (e) => {
        if (!this.started) return;
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

        this.audio.unlock();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        this.keys[e.code] = true;

        if (e.code === 'Escape') {
          if (this.hasOpenModal()) { this.closeAllModals(); return; }
          if (this.fishing.active) { this.stopFishing(); return; }
          if (this.barista.active) { this.finishBaristaShift(true); return; }
          if (this.scene === 'home') { this.exitHome(); return; }
          return;
        }

        if (this.barista.active) {
          const match = YD.CAFE_ORDERS.find((o) => o.code === e.code || e.key === o.key);
          if (match) this.serveBarista(match.id);
          return;
        }

        if (e.code === 'KeyC') { this.toggleBag(!this.bagOpen); return; }
        if (e.code === 'KeyG') { this.toggleQuests(!this.questOpen); return; }
        if (e.code === 'KeyI') {
          if (this.scene === 'home') this.toggleHome(!this.homeOpen);
          else this.toggleShop(!this.shopOpen);
          return;
        }
        if (e.code === 'KeyK') { this.toggleHelp(!this.helpOpen); return; }
        if (e.code === 'KeyM') { this.toggleMap(); return; }
        if (e.code === 'KeyN') { this.toggleMusic(); return; }

        if (this.hasOpenModal()) return;

        if (this.fishing.active) {
          if (e.code === 'KeyE' || e.code === 'Space') this.resolveFishingAttempt();
          return;
        }

        if (e.code === 'KeyE' || e.code === 'Space') {
          if (this.scene === 'home') {
            this.handleHomeInteract();
          } else if (this.player.inCar && e.code === 'Space') {
            this.audio.carHorn();
            this.popup(this.player.x, this.player.y - 34, 'DÜÜT! 🚗', '#fde047');
          } else {
            this.handleInteract();
          }
        }
        if (e.code === 'KeyP') this.petCompanion();
        if (this.scene === 'home') return;

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

      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

      document.getElementById('btnBag').addEventListener('click', () => { this.audio.unlock(); this.toggleBag(!this.bagOpen); });
      document.getElementById('btnCloseBag').addEventListener('click', () => this.toggleBag(false));
      document.getElementById('btnQuests').addEventListener('click', () => { this.audio.unlock(); this.toggleQuests(!this.questOpen); });
      document.getElementById('btnCloseQuests').addEventListener('click', () => this.toggleQuests(false));
      document.getElementById('btnShop').addEventListener('click', () => { this.audio.unlock(); this.toggleShop(!this.shopOpen); });
      document.getElementById('btnCloseShop').addEventListener('click', () => this.toggleShop(false));
      document.getElementById('btnCloseHome').addEventListener('click', () => this.toggleHome(false));
      document.getElementById('btnCloseGarden').addEventListener('click', () => this.toggleGarden(false));
      document.getElementById('btnCloseCafe').addEventListener('click', () => this.toggleCafe(false));
      document.getElementById('btnStopBarista').addEventListener('click', () => this.finishBaristaShift(true));
      document.getElementById('btnHomeSleep').addEventListener('click', () => { this.toggleHome(false); this.startNextDay(false); });
      document.getElementById('btnMapToggle').addEventListener('click', () => { this.audio.unlock(); this.toggleMap(); });
      document.getElementById('btnHelp').addEventListener('click', () => { this.audio.unlock(); this.toggleHelp(!this.helpOpen); });
      document.getElementById('btnCloseHelp').addEventListener('click', () => this.toggleHelp(false));
      document.getElementById('btnBike').addEventListener('click', () => { this.audio.unlock(); this.toggleBike(); });
      document.getElementById('btnCar').addEventListener('click', () => { this.audio.unlock(); this.toggleCar(); });
      document.getElementById('btnPetAction').addEventListener('click', () => { this.audio.unlock(); this.petCompanion(); });
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
            else if (this.scene === 'home') this.handleHomeInteract();
            else this.handleInteract();
          }
          if (code === 'KeyV' && this.scene === 'world') this.toggleCar();
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

    showToast(text) {
      const el = document.getElementById('eventToast');
      if (!el) return;
      el.textContent = text;
      el.classList.remove('hidden');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => el.classList.add('hidden'), 4200);
    }

    unlockAchievement(id) {
      if (this.achievements.has(id)) return;
      this.achievements.add(id);
      const a = YD.ACHIEVEMENTS.find((x) => x.id === id);
      if (a) {
        this.audio.levelUp();
        this.money += 100;
        this.showToast(`🏆 BAŞARIM AÇILDI: ${a.icon} ${a.name} (+₺100)!`);
      }
      this.saveGame();
    }

    checkAchievements() {
      if (this.money >= 1000) this.unlockAchievement('ach_rich');
      if (this.inventory.has('car')) this.unlockAchievement('ach_car');
      if (this.inventory.has('pet_dog') || this.inventory.has('pet_cat')) this.unlockAchievement('ach_pet');
      if (this.homeDecor.size >= 3) this.unlockAchievement('ach_decor');
      if (this.ownsCafe) this.unlockAchievement('ach_barista');
    }

    syncPetFromInventory() {
      if (this.inventory.has('pet_dog')) {
        if (!this.pet || this.pet.kind !== 'dog') {
          this.pet = { kind: 'dog', x: this.player.x - 28, y: this.player.y + 18, angle: 0, petCd: 0 };
        }
      } else if (this.inventory.has('pet_cat')) {
        if (!this.pet || this.pet.kind !== 'cat') {
          this.pet = { kind: 'cat', x: this.player.x - 28, y: this.player.y + 18, angle: 0, petCd: 0 };
        }
      }
    }

    petCompanion() {
      if (!this.pet) {
        this.say(this.player, 'Marketten [I] Köpek veya Kedi sahiplenebilirsin! 🐾', 2.4);
        return;
      }
      if (this.pet.petCd > 0) return;
      this.pet.petCd = 3.0;
      this.happiness = Math.min(100, this.happiness + 12);
      this.audio.pickup();
      const pRef = (this.scene === 'home' && this.homePet) ? this.homePet : this.pet;
      this.burst(pRef.x, pRef.y, '#f472b6', 14);
      this.popup(pRef.x, pRef.y - 24, this.pet.kind === 'dog' ? 'HAV! ❤️ +12 Mutluluk' : 'MİYAV! ❤️ +12 Mutluluk', '#f9a8d4');
    }

    saveGame() {
      const data = {
        playerName: this.playerName, color: this.player.color,
        day: this.day, age: this.age, seasonIdx: this.seasonIdx, weatherIdx: this.weatherIdx,
        dailyEventIdx: this.dailyEventIdx, timeMinutes: this.timeMinutes,
        money: this.money, health: this.health, energy: this.energy,
        hunger: this.hunger, happiness: this.happiness, xp: this.xp, level: this.level,
        ownsCafe: this.ownsCafe, cafeTotalEarned: this.cafeTotalEarned,
        gardenPlots: this.world.gardenPlots.map((g) => ({ crop: g.crop, growth: g.growth, watered: g.watered })),
        inventory: [...this.inventory], homeDecor: [...this.homeDecor],
        bag: this.bag, achievements: [...this.achievements], npcHearts: this.npcHearts,
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
        this.playerName = d.playerName || 'Gezgin';
        if (d.color) this.player.color = d.color;
        this.day = d.day || 1; this.age = d.age || 20;
        this.seasonIdx = d.seasonIdx || 0; this.weatherIdx = d.weatherIdx || 0;
        this.dailyEventIdx = d.dailyEventIdx || 0;
        this.timeMinutes = d.timeMinutes || 480;
        this.money = d.money ?? 160; this.health = d.health ?? 100;
        this.energy = d.energy ?? 100; this.hunger = d.hunger ?? 95;
        this.happiness = d.happiness ?? 90; this.xp = d.xp || 0; this.level = d.level || 1;
        this.ownsCafe = !!d.ownsCafe;
        this.cafeTotalEarned = d.cafeTotalEarned || 0;
        if (Array.isArray(d.gardenPlots)) {
          d.gardenPlots.forEach((gp, idx) => {
            if (this.world.gardenPlots[idx]) {
              this.world.gardenPlots[idx].crop = gp.crop || null;
              this.world.gardenPlots[idx].growth = gp.growth || 0;
              this.world.gardenPlots[idx].watered = !!gp.watered;
            }
          });
        }
        this.inventory = new Set(d.inventory || []);
        this.homeDecor = new Set(d.homeDecor || []);
        this.bag = { berry: 0, mushroom: 0, fish: 0, goldfish: 0, grilled: 0, crystal: 0, tomato: 0, strawberry: 0, sunflower: 0, ...(d.bag || {}) };
        this.achievements = new Set(d.achievements || []);
        this.npcHearts = d.npcHearts || {};
        this.questProgress = d.questProgress || {};
        this.questDone = new Set(d.questDone || []);
        if (d.px && d.py) {
          this.player.x = d.px; this.player.y = d.py;
          this.world.resolveCollisions(this.player, false);
        }
        this.homePlayer.color = this.player.color;
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
        const career = YD.getCareer(this.level);
        this.audio.levelUp();
        this.popup(this.player.x, this.player.y - 45, `SEVİYE ${this.level}! 🌟`, '#fde047');
        this.showToast(`🌟 Seviye ${this.level} • Unvan: ${career.title}!`);
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
        this.showToast(`✅ GÖREV TAMAM: ${q.title} (+₺${q.rewardMoney})`);
        this.checkAchievements();
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
      if (!this.inventory.has('bike')) { this.say(this.player, 'Önce Marketten [I] Bisiklet (₺160) almalısın! 🚲', 2.4); return; }
      if (this.player.swimming) { this.say(this.player, 'Suda bisiklet sürülmez! 😅', 1.8); return; }
      if (this.player.inCar) this.toggleCar();
      this.player.onBike = !this.player.onBike;
      this.audio.bikeBell();
      this.popup(this.player.x, this.player.y - 28, this.player.onBike ? '🚲 BİSİKLET AÇIK' : '🚶 YÜRÜYÜŞ', '#38bdf8');
    }

    toggleCar() {
      if (!this.inventory.has('car')) { this.say(this.player, 'Marketten [I] Elektrikli Araba (₺340) al! 🚗', 2.5); return; }
      if (this.player.swimming) { this.say(this.player, 'Karaya çıkınca arabaya binebilirsin!', 2.2); return; }
      this.player.onBike = false;
      if (!this.player.inCar) {
        this.player.inCar = true; this.player.carSpeed = 0; this.parkedCar = null;
        this.audio.carStart();
        this.popup(this.player.x, this.player.y - 32, '🚗 ARABA MODU! ([H]/[Space] Korna)', '#22d3ee');
      } else {
        this.player.inCar = false;
        this.parkedCar = { x: this.player.x, y: this.player.y, angle: this.player.angle };
        this.player.x += Math.cos(this.player.angle + Math.PI / 2) * 32;
        this.player.y += Math.sin(this.player.angle + Math.PI / 2) * 32;
        this.world.resolveCollisions(this.player, false);
        this.popup(this.player.x, this.player.y - 28, '🚶 ARABADAN İNDİN', '#cbd5e1');
      }
    }

    useHourglass() {
      if (!this.inventory.has('hourglass')) { this.say(this.player, '4D Kum Saati için Marketten [I] al! ⏳', 2.4); return; }
      this.seasonIdx = (this.seasonIdx + 1) % YD.SEASONS.length;
      this.audio.timeWarp();
      const s = YD.SEASONS[this.seasonIdx];
      this.burst(this.player.x, this.player.y, '#38bdf8', 24);
      this.popup(this.player.x, this.player.y - 36, `⏳ ${s.icon} ${s.name.toUpperCase()}!`, '#38bdf8');
      this.saveGame();
    }

    closeAllModals() {
      this.clearAllKeys();
      this.shopOpen = this.homeOpen = this.questOpen = this.helpOpen = this.bagOpen = this.gardenOpen = this.cafeOpen = false;
      ['shopModal', 'homeModal', 'questModal', 'helpModal', 'bagModal', 'gardenModal', 'cafeModal'].forEach((id) => {
        document.getElementById(id).classList.add('hidden');
      });
    }

    toggleShop(open)   { this.closeAllModals(); this.shopOpen = open;   document.getElementById('shopModal').classList.toggle('hidden', !open);   if (open) this.renderShop(); }
    toggleHome(open)   { this.closeAllModals(); this.homeOpen = open;   document.getElementById('homeModal').classList.toggle('hidden', !open);   if (open) this.renderHomeModal(); }
    toggleQuests(open) { this.closeAllModals(); this.questOpen = open;  document.getElementById('questModal').classList.toggle('hidden', !open);  if (open) this.renderQuests(); }
    toggleBag(open)    { this.closeAllModals(); this.bagOpen = open;    document.getElementById('bagModal').classList.toggle('hidden', !open);    if (open) this.renderBag(); }
    toggleHelp(open)   { this.closeAllModals(); this.helpOpen = open;   document.getElementById('helpModal').classList.toggle('hidden', !open); }
    toggleGarden(open, plotId = null) {
      this.closeAllModals();
      this.gardenOpen = open;
      this.activePlotId = plotId;
      document.getElementById('gardenModal').classList.toggle('hidden', !open);
      if (open) this.renderGardenModal();
    }
    toggleCafe(open) {
      this.closeAllModals();
      this.cafeOpen = open;
      document.getElementById('cafeModal').classList.toggle('hidden', !open);
      if (open) this.renderCafeModal();
    }

    renderGardenModal() {
      const grid = document.getElementById('gardenSeedGrid');
      if (!grid) return;
      grid.innerHTML = Object.values(YD.CROPS).map((c) => `
        <div class="shop-item">
          <div style="font-size:24px;">${c.icon}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:800; color:#f8fafc;">${c.name} Tohumu</div>
            <div style="font-size:11px; color:#94a3b8;">Büyüme: ~${c.growSec}sn · Satış: ₺${c.sell}${c.xp ? ` · +${c.xp} XP` : ''}</div>
          </div>
          <button class="shop-buy-btn" data-seed="${c.id}">EK ₺${c.seedPrice}</button>
        </div>
      `).join('');

      grid.querySelectorAll('[data-seed]').forEach((btn) => {
        btn.addEventListener('click', () => this.plantSeed(btn.dataset.seed));
      });
    }

    plantSeed(cropId) {
      const plot = this.world.gardenPlots.find((p) => p.id === this.activePlotId);
      const c = YD.CROPS[cropId];
      if (!plot || !c || plot.crop) return;
      if (this.money < c.seedPrice) {
        this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444');
        return;
      }
      this.money -= c.seedPrice;
      plot.crop = cropId;
      plot.growth = 0.02;
      plot.watered = (this.weatherIdx === 1 || this.weatherIdx === 2);
      this.audio.pickup();
      this.burst(plot.x, plot.y, '#84cc16', 14);
      this.popup(plot.x, plot.y - 24, `🌱 ${c.name} Ekildi! ([E] Sula)`, '#bef264');
      this.toggleGarden(false);
      this.saveGame();
    }

    renderCafeModal() {
      const title = document.getElementById('cafeModalTitle');
      const banner = document.getElementById('cafeStatusBanner');
      const grid = document.getElementById('cafeActionsGrid');
      if (!grid) return;

      if (this.ownsCafe) {
        if (title) title.textContent = `⭐ ${this.playerName.toUpperCase()} KAFE`;
        if (banner) banner.innerHTML = `☕ <b>Kafe Sahibi Sensin!</b> · Her sabah pasif gelir: <b>+₺95–145</b> · Toplam Kazanç: <b>₺${this.cafeTotalEarned}</b>`;
        grid.innerHTML = `
          <div class="shop-item">
            <div style="font-size:24px;">🔥</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; color:#fde047;">Barista Vardiyası (25sn Mini-Oyun)</div>
              <div style="font-size:11px; color:#94a3b8;">[1-4] tuşlarıyla siparişleri yetiştir, kombo yap, dev bahşiş topla!</div>
            </div>
            <button id="btnStartBarista" class="shop-buy-btn">BAŞLAT ▶</button>
          </div>
          <div class="shop-item">
            <div style="font-size:24px;">☕</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; color:#f8fafc;">Patronun Özel Lattesi</div>
              <div style="font-size:11px; color:#94a3b8;">Kendi kafenden ücretsiz taze kahve &amp; kruvasan! (+35 Enerji, +35 Tokluk)</div>
            </div>
            <button id="btnCafeDrink" class="shop-buy-btn">ÜCRETSİZ</button>
          </div>`;
        document.getElementById('btnStartBarista').addEventListener('click', () => {
          this.toggleCafe(false);
          this.startBaristaShift();
        });
      } else {
        if (title) title.textContent = '☕ KAFE & FIRIN';
        if (banner) banner.innerHTML = `☕ Sıcak kahve iç veya <b>₺${YD.CAFE_PRICE}</b> biriktirip bu kafeyi satın al!`;
        grid.innerHTML = `
          <div class="shop-item">
            <div style="font-size:24px;">☕</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; color:#f8fafc;">Latte &amp; Sıcak Simit</div>
              <div style="font-size:11px; color:#94a3b8;">+35 Enerji · +35 Tokluk · +18 Mutluluk</div>
            </div>
            <button id="btnCafeDrink" class="shop-buy-btn">₺25</button>
          </div>
          <div class="shop-item">
            <div style="font-size:24px;">⭐</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; color:#fde047;">Kafeyi Satın Al &amp; Patron Ol!</div>
              <div style="font-size:11px; color:#94a3b8;">Adın tabelaya yazılır, her gün pasif gelir + Barista Mini-Oyunu açılır!</div>
            </div>
            <button id="btnBuyCafe" class="shop-buy-btn">₺${YD.CAFE_PRICE}</button>
          </div>`;
        document.getElementById('btnBuyCafe').addEventListener('click', () => {
          if (this.money < YD.CAFE_PRICE) {
            this.popup(this.player.x, this.player.y - 34, `₺${YD.CAFE_PRICE} gerekiyor!`, '#ef4444');
            return;
          }
          this.money -= YD.CAFE_PRICE;
          this.ownsCafe = true;
          this.audio.levelUp();
          this.burst(this.player.x, this.player.y, '#fde047', 26);
          this.showToast(`⭐ TEBRİKLER! ${this.playerName} KAFE artık senin!`);
          this.checkAchievements();
          this.renderCafeModal();
          this.saveGame();
        });
      }

      const drinkBtn = document.getElementById('btnCafeDrink');
      if (drinkBtn) {
        drinkBtn.addEventListener('click', () => {
          const cost = this.ownsCafe ? 0 : 25;
          if (this.money < cost) { this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444'); return; }
          this.money -= cost;
          this.energy = Math.min(100, this.energy + 35);
          this.hunger = Math.min(100, this.hunger + 35);
          this.happiness = Math.min(100, this.happiness + 18);
          this.audio.pickup();
          this.popup(this.player.x, this.player.y - 34, this.ownsCafe ? '☕ Patron İkramı! +Enerji' : '☕ Latte & Simit! +Enerji', '#fb923c');
          this.toggleCafe(false);
          this.saveGame();
        });
      }
    }

    startBaristaShift() {
      if (this.energy < 15) {
        this.say(this.player, 'Barista vardiyası için biraz enerji lazım! ☕', 2.2);
        return;
      }
      this.clearAllKeys();
      this.barista = { active: true, timeLeft: 25, score: 0, combo: 1, served: 0, order: null, patience: 4.5, maxPatience: 4.5 };
      const btns = document.getElementById('baristaBtns');
      if (btns) {
        btns.innerHTML = YD.CAFE_ORDERS.map((o) =>
          `<button class="barista-serve-btn" data-serve="${o.id}"><kbd>${o.key}</kbd> ${o.icon} ${o.name}</button>`
        ).join('');
        btns.querySelectorAll('[data-serve]').forEach((b) => {
          b.addEventListener('click', () => this.serveBarista(b.dataset.serve));
        });
      }
      this.nextBaristaOrder();
      document.getElementById('baristaWrap').classList.remove('hidden');
      this.audio.pickup();
    }

    nextBaristaOrder() {
      const pick = YD.CAFE_ORDERS[Math.floor(Math.random() * YD.CAFE_ORDERS.length)];
      this.barista.order = pick;
      this.barista.maxPatience = Math.max(2.3, 4.4 - this.barista.served * 0.12);
      this.barista.patience = this.barista.maxPatience;
      document.getElementById('baristaOrderIcon').textContent = pick.icon;
      document.getElementById('baristaOrderName').textContent = `[${pick.key}] ${pick.name}`;
      this.updateBaristaUI();
    }

    serveBarista(id) {
      if (!this.barista.active || !this.barista.order) return;
      if (id === this.barista.order.id) {
        const gain = 20 * Math.min(4, this.barista.combo);
        this.barista.score += gain;
        this.barista.served++;
        this.barista.combo = Math.min(4, this.barista.combo + 1);
        this.audio.coin();
        this.nextBaristaOrder();
      } else {
        this.barista.combo = 1;
        this.audio.miss();
        this.updateBaristaUI();
      }
    }

    updateBaristaUI() {
      document.getElementById('baristaTimer').textContent = `${Math.ceil(this.barista.timeLeft)}s`;
      document.getElementById('baristaScore').textContent = `₺${this.barista.score}`;
      document.getElementById('baristaCombo').textContent = `x${this.barista.combo}${this.barista.combo >= 3 ? ' 🔥' : ''}`;
      const pct = Math.max(0, (this.barista.patience / this.barista.maxPatience) * 100);
      document.getElementById('baristaPatienceFill').style.width = `${pct}%`;
    }

    finishBaristaShift(early = false) {
      if (!this.barista.active) return;
      this.barista.active = false;
      document.getElementById('baristaWrap').classList.add('hidden');
      const earned = this.barista.score;
      const served = this.barista.served;
      this.energy = Math.max(0, this.energy - 14);
      this.timeMinutes += 60;
      if (earned > 0) {
        this.money += earned;
        this.cafeTotalEarned += earned;
        this.happiness = Math.min(100, this.happiness + 16);
        this.addXp(20 + served * 4);
        this.audio.levelUp();
        this.burst(this.player.x, this.player.y, '#fde047', 22);
        this.showToast(`☕ Barista Vardiyası Bitti! ${served} sipariş · +₺${earned}!`);
        this.advanceQuest('q_cafe', 1);
      } else if (!early) {
        this.showToast('☕ Vardiya bitti — bir dahaki sefere daha hızlı servis et!');
      }
      this.checkAchievements();
      this.saveGame();
    }

    // --- WALKABLE COZY HOME INTERIOR ---
    enterHome() {
      this.clearAllKeys();
      this.player.onBike = false;
      if (this.player.inCar) {
        this.player.inCar = false;
        this.parkedCar = { x: 2062, y: 1560, angle: 0 };
      }
      this.scene = 'home';
      this.homePlayer.x = 340;
      this.homePlayer.y = 355;
      this.homePlayer.angle = -Math.PI / 2;
      this.homePlayer.color = this.player.color;
      this.homePet = this.pet ? { kind: this.pet.kind, x: 300, y: 360, angle: -Math.PI / 2 } : null;
      this.audio.pickup();
      this.showToast('🏠 Evine Hoş Geldin! Odada gez, [E] ile eşyaları kullan veya [ESC] ile çık.');
    }

    exitHome() {
      this.clearAllKeys();
      this.closeAllModals();
      this.scene = 'world';
      this.player.x = 2062;
      this.player.y = 1525;
      this.player.angle = Math.PI / 2;
      this.audio.pickup();
    }

    findNearestHomeInteraction() {
      const hp = this.homePlayer;
      let best = null, bestD = 76;
      for (const sp of YD.HOME_ROOM.spots) {
        const d = Math.hypot(hp.x - sp.x, hp.y - sp.y);
        if (d < bestD) {
          bestD = d;
          const unlocked = !sp.decor || this.homeDecor.has(sp.decor);
          best = {
            spot: sp,
            unlocked,
            text: unlocked ? `[E] ${sp.icon} ${sp.label}` : `[E] 🔒 ${sp.icon} Katalogdan Satın Al`
          };
        }
      }
      return best;
    }

    handleHomeInteract() {
      const hit = this.findNearestHomeInteraction();
      if (!hit) return;
      const hp = this.homePlayer;
      if (!hit.unlocked) {
        this.toggleHome(true);
        return;
      }
      const k = hit.spot.kind;
      if (k === 'exit') {
        this.exitHome();
      } else if (k === 'catalog') {
        this.toggleHome(true);
      } else if (k === 'bed') {
        this.startNextDay(false);
      } else if (k === 'espresso') {
        this.energy = Math.min(100, this.energy + 25);
        this.happiness = Math.min(100, this.happiness + 10);
        this.audio.pickup();
        this.burst(hp.x, hp.y, '#fb923c', 12);
        this.popup(hp.x, hp.y - 26, '☕ Taze Ev Espressosu! +25 Enerji', '#fb923c');
      } else if (k === 'plants') {
        this.health = Math.min(100, this.health + 12);
        this.happiness = Math.min(100, this.happiness + 10);
        this.audio.pickup();
        this.burst(hp.x, hp.y, '#4ade80', 12);
        this.popup(hp.x, hp.y - 26, '🪴 Bitkilerle Huzur! +12 Sağlık', '#4ade80');
      } else if (k === 'pc') {
        if (this.energy < 18) { this.popup(hp.x, hp.y - 26, 'Çok yorgunsun, yatağa git! 🛏️', '#ef4444'); return; }
        this.energy -= 18; this.money += 95; this.addXp(22); this.timeMinutes += 75;
        this.audio.coin(); this.burst(hp.x, hp.y, '#38bdf8', 14);
        this.popup(hp.x, hp.y - 26, '🖥️ Remote İş Tamam! +₺95', '#4ade80');
        this.advanceQuest('q_work', 1);
      } else if (k === 'sofa') {
        this.happiness = Math.min(100, this.happiness + 35);
        this.energy = Math.min(100, this.energy + 15);
        this.timeMinutes += 45; this.audio.pickup();
        this.popup(hp.x, hp.y - 26, '🛋️ Süper Film Molası! +35 Mutluluk', '#38bdf8');
      } else if (k === 'guitar') {
        this.happiness = Math.min(100, this.happiness + 25);
        this.addXp(10); this.audio.guitar();
        this.burst(hp.x, hp.y, '#fde047', 12);
        this.popup(hp.x, hp.y - 26, '🎸 Akustik Ritim! +25 Mutluluk', '#fde047');
      }
      this.checkAchievements();
      this.saveGame();
    }

    updateHome(dt) {
      const hp = this.homePlayer;
      hp.color = this.player.color;

      let ix = 0, iy = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) iy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) iy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
      const len = Math.hypot(ix, iy);
      if (len === 0) {
        hp.vx = 0; hp.vy = 0;
      } else {
        ix /= len; iy /= len;
        const spd = 215;
        hp.vx = ix * spd; hp.vy = iy * spd;
        hp.angle = Math.atan2(iy, ix);
        hp.walkCycle += dt * 11;
      }
      hp.x = Math.max(28, Math.min(YD.HOME_ROOM.w - 28, hp.x + hp.vx * dt));
      hp.y = Math.max(80, Math.min(YD.HOME_ROOM.h - 22, hp.y + hp.vy * dt));

      if (this.pet && this.homePet) {
        this.pet.petCd = Math.max(0, this.pet.petCd - dt);
        const dx = hp.x - this.homePet.x, dy = hp.y - this.homePet.y;
        const d = Math.hypot(dx, dy);
        if (d > 42) {
          const ang = Math.atan2(dy, dx);
          this.homePet.angle = ang;
          this.homePet.x += Math.cos(ang) * Math.min(260, d * 4) * dt;
          this.homePet.y += Math.sin(ang) * Math.min(260, d * 4) * dt;
        }
      }

      // Keep world crops growing while you relax inside!
      this.world.update(dt, this.player, null, YD.WEATHERS[this.weatherIdx].id);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i]; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
        if (pt.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const pp = this.popups[i]; pp.y -= 36 * dt; pp.life -= dt;
        if (pp.life <= 0) this.popups.splice(i, 1);
      }

      this.updateHUD('home');
    }

    handleCarHitPlayer(car) {
      if (this.carHitInvuln > 0) return;
      this.carHitInvuln = 1.25;
      this.damageFlash = 0.85;
      this.audio.carHorn(); this.audio.miss();

      const p = this.player;
      const dmg = p.inCar ? 6 : 18;
      this.health = Math.max(0, this.health - dmg);
      this.happiness = Math.max(0, this.happiness - 6);

      const pushAng = Math.atan2(p.y - car.y, p.x - car.x);
      p.x += Math.cos(pushAng) * 44; p.y += Math.sin(pushAng) * 44;
      if (p.inCar) p.carSpeed = -120;
      this.world.resolveCollisions(p, p.inCar);

      this.burst(p.x, p.y, '#ef4444', 14);
      this.popup(p.x, p.y - 36, p.inCar ? `-${dmg} ❤️ ÇARPIŞMA!` : `-${dmg} ❤️ ARABA ÇARPTI!!`, '#ef4444');
      this.say(p, 'AHH!! Trafiğe dikkat etmeliyim! 🚗💥', 2.4);

      if (this.health <= 0) {
        const fee = Math.min(this.money, 40);
        this.money -= fee;
        this.health = 85;
        this.energy = Math.max(55, this.energy);
        p.inCar = false; p.onBike = false;
        // Wake up right outside Şehir Hastanesi!
        p.x = 2082; p.y = 1068;
        this.showToast(`🏥 Şehir Hastanesinden taburcu oldun! (-₺${fee})`);
      }
      this.saveGame();
    }

    renderBag() {
      const grid = document.getElementById('bagGrid');
      if (!grid) return;
      const nearFire = Math.hypot(this.player.x - this.world.campfire.x, this.player.y - this.world.campfire.y) < 110;
      const keys = Object.keys(YD.BAG_ITEMS).filter((k) => (this.bag[k] || 0) > 0);
      if (keys.length === 0) {
        grid.innerHTML = `<div class="shop-item" style="justify-content:center; color:#94a3b8;">Çantan boş! Ormandan böğürtlen, dağdan kristal veya iskeleden balık topla!</div>`;
        return;
      }
      const crystalMult = this.dailyEventIdx === 3 ? 1.6 : 1.0;
      grid.innerHTML = keys.map((k) => {
        const info = YD.BAG_ITEMS[k];
        const qty = this.bag[k];
        const sellVal = Math.round(info.sell * (k === 'crystal' ? crystalMult : 1));
        return `
          <div class="shop-item">
            <div style="font-size:24px;">${info.icon}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800;">${info.name} <span style="color:#fde047;">x${qty}</span></div>
              <div style="font-size:11px; color:#94a3b8;">${info.hunger > 0 ? `+${info.hunger} Tokluk ` : ''}${info.energy > 0 ? `+${info.energy} Enerji` : ''}</div>
            </div>
            <div class="btn-row">
              ${info.hunger > 0 ? `<button class="hud-btn" data-eat="${k}">YE</button>` : ''}
              ${k === 'fish' && nearFire ? `<button class="hud-btn gold" data-grill="fish">🔥 PİŞİR</button>` : ''}
              <button class="shop-buy-btn" data-sell="${k}">SAT ₺${sellVal}</button>
            </div>
          </div>`;
      }).join('');

      grid.querySelectorAll('[data-eat]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.eat, info = YD.BAG_ITEMS[k];
        if (!this.bag[k]) return;
        this.bag[k]--;
        this.hunger = Math.min(100, this.hunger + info.hunger);
        this.health = Math.min(100, this.health + info.health);
        this.energy = Math.min(100, this.energy + info.energy);
        this.audio.pickup();
        this.renderBag(); this.saveGame();
      }));
      grid.querySelectorAll('[data-grill]').forEach((b) => b.addEventListener('click', () => {
        if (!this.bag.fish) return;
        this.bag.fish--; this.bag.grilled = (this.bag.grilled || 0) + 1;
        this.audio.pickup(); this.showToast('🔥 Izgara Balık pişti! (+65 Tokluk)');
        this.renderBag(); this.saveGame();
      }));
      grid.querySelectorAll('[data-sell]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.sell, info = YD.BAG_ITEMS[k];
        if (!this.bag[k]) return;
        const sellVal = Math.round(info.sell * (k === 'crystal' && this.dailyEventIdx === 3 ? 1.6 : 1));
        this.bag[k]--; this.money += sellVal;
        this.audio.coin(); this.checkAchievements();
        this.renderBag(); this.saveGame();
      }));
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
          this.syncPetFromInventory();
          this.audio.coin();
          this.popup(this.player.x, this.player.y - 34, `${item.icon} ${item.name} ALINDI!`, '#4ade80');
          this.checkAchievements();
          this.renderShop(); this.saveGame();
        });
      });
    }

    renderHomeModal() {
      const preview = document.getElementById('homeRoomPreview');
      if (preview) {
        preview.innerHTML = [
          `<div class="room-slot">🛏️ Yatak</div>`,
          ...YD.HOME_DECOR.map((d) => `<div class="room-slot ${this.homeDecor.has(d.id) ? 'unlocked' : 'locked'}">${d.icon} ${d.name}</div>`)
        ].join('');
      }
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
          this.advanceQuest('q_work', 1); this.checkAchievements(); this.saveGame();
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
          this.money -= d.price; this.homeDecor.add(d.id);
          this.happiness = Math.min(100, this.happiness + 15);
          this.audio.coin(); this.checkAchievements();
          this.renderHomeModal(); this.saveGame();
        });
      });
    }

    renderQuests() {
      const career = YD.getCareer(this.level);
      const ev = YD.DAILY_EVENTS[this.dailyEventIdx];
      const cb = document.getElementById('careerBanner');
      if (cb) {
        cb.innerHTML = `👤 <b>${this.playerName}</b> · 💼 <b>${career.title}</b> (Maaş x${career.bonus}) · ${ev.icon} <b>${ev.name}</b>`;
      }
      const box = document.getElementById('questList');
      if (box) {
        box.innerHTML = YD.QUESTS.map((q) => {
          const done = this.questDone.has(q.id);
          const cur = Math.min(q.target, this.questProgress[q.id] || 0);
          return `<div class="quest-row ${done ? 'done' : ''}"><span>${done ? '✅' : '⬜'} ${q.title}</span><b>${cur}/${q.target}</b></div>`;
        }).join('');
      }
      const ach = document.getElementById('achGrid');
      if (ach) {
        ach.innerHTML = YD.ACHIEVEMENTS.map((a) => {
          const ok = this.achievements.has(a.id);
          return `<div class="ach-card ${ok ? 'unlocked' : ''}"><b>${a.icon} ${a.name}</b><br/>${a.desc} ${ok ? '✓' : ''}</div>`;
        }).join('');
      }
    }

    startFishing() {
      if (this.energy < 10) { this.say(this.player, 'Olta sallayacak enerjin kalmadı!', 2.0); return; }
      this.clearAllKeys();
      this.fishing.active = true;
      this.fishing.pos = 0.05; this.fishing.dir = 1;
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
      const dist = Math.abs(this.fishing.pos - 0.5);
      const sweetHalf = this.inventory.has('rod') ? 0.12 : 0.075;
      const bonus = ((this.weatherIdx === 1 || this.weatherIdx === 2) ? 1.35 : 1.0) * (this.dailyEventIdx === 1 ? 2.0 : 1.0);

      this.stopFishing();
      this.energy = Math.max(0, this.energy - 10);
      this.timeMinutes += 35;

      if (dist <= sweetHalf) {
        this.bag.goldfish = (this.bag.goldfish || 0) + 1;
        const instantBonus = Math.round(70 * bonus);
        this.money += instantBonus;
        this.happiness = Math.min(100, this.happiness + 22);
        this.addXp(38);
        this.audio.levelUp();
        this.burst(this.player.x, this.player.y + 30, '#fde047', 22);
        this.popup(this.player.x, this.player.y - 38, `🌟 4D ALTIN BALIK ÇANTANDA! (+₺${instantBonus})`, '#fde047');
        this.advanceQuest('q_fish', 1);
      } else if (dist <= 0.28) {
        this.bag.fish = (this.bag.fish || 0) + 1;
        this.happiness = Math.min(100, this.happiness + 12);
        this.addXp(20);
        this.audio.coin();
        this.burst(this.player.x, this.player.y + 30, '#38bdf8', 14);
        this.popup(this.player.x, this.player.y - 34, '🐟 Taze Levrek Çantana Eklendi! [C]', '#38bdf8');
        this.advanceQuest('q_fish', 1);
      } else {
        this.audio.miss();
        this.popup(this.player.x, this.player.y - 34, '🥾 Kaçtı! Tekrar dene!', '#fb7185');
      }
      this.checkAchievements();
      this.saveGame();
    }

    findNearestInteraction() {
      const p = this.player;
      for (const plot of this.world.gardenPlots) {
        if (Math.hypot(p.x - plot.x, p.y - plot.y) < 46) {
          if (!plot.crop) return { kind: 'garden', ref: plot, text: '[E] 🌱 Tohum Ek (Bahçen)' };
          const info = YD.CROPS[plot.crop];
          if (plot.growth >= 1) return { kind: 'garden', ref: plot, text: `[E] 🧺 ${info.icon} ${info.name} Hasat Et!` };
          const pct = Math.floor(plot.growth * 100);
          if (!plot.watered) return { kind: 'garden', ref: plot, text: `[E] 💧 ${info.name} Sula (2x Hız — %${pct})` };
          return { kind: 'garden', ref: plot, text: `🌿 ${info.icon} ${info.name} Büyüyor (%${pct})` };
        }
      }
      for (const fg of this.world.forageables) {
        if (!fg.collected && Math.hypot(p.x - fg.x, p.y - fg.y) < 52) {
          const lbl = fg.kind === 'crystal' ? '💎 Zirve Kristali Topla' : (fg.kind === 'berry' ? '🍓 Böğürtlen Topla' : '🍄 Mantar Topla');
          return { kind: 'forage', ref: fg, text: `[E] ${lbl}` };
        }
      }
      for (const npc of this.npcs) {
        if (Math.hypot(p.x - npc.x, p.y - npc.y) < 64) {
          const hearts = this.npcHearts[npc.name] || 0;
          return { kind: 'npc', ref: npc, text: `[E] 💬 ${npc.name} (${hearts > 0 ? '❤️'.repeat(Math.min(5, hearts)) : 'Tanış'})` };
        }
      }
      for (const it of this.world.interactables) {
        if (Math.hypot(p.x - it.x, p.y - it.y) < it.r + 24) {
          if (it.kind === 'home') return { kind: 'home', ref: it, text: '[E] 🏠 EVİNİN İÇİNE GİR' };
          if (it.kind === 'cafe') return { kind: 'cafe', ref: it, text: this.ownsCafe ? `[E] ⭐ ${this.playerName} KAFE (Barista & İkram)` : '[E] ☕ KAFE & FIRIN (İç / Satın Al)' };
          return { kind: it.kind, ref: it, text: `[E] ${it.label}` };
        }
      }
      return null;
    }

    handleInteract() {
      if (this.hasOpenModal()) return;
      const target = this.findNearestInteraction();
      if (!target) return;
      const p = this.player;
      const bonusMult = this.inventory.has('sisyphus') ? 1.4 : 1.0;

      if (target.kind === 'garden') {
        const plot = target.ref;
        if (!plot.crop) {
          this.toggleGarden(true, plot.id);
          return;
        }
        const info = YD.CROPS[plot.crop];
        if (plot.growth >= 1) {
          this.bag[plot.crop] = (this.bag[plot.crop] || 0) + 1;
          this.addXp(info.xp || 20);
          this.happiness = Math.min(100, this.happiness + (info.happy || 10));
          plot.crop = null; plot.growth = 0; plot.watered = false;
          this.audio.levelUp();
          this.burst(plot.x, plot.y, '#fde047', 18);
          this.popup(plot.x, plot.y - 26, `🧺 ${info.icon} ${info.name} Çantada! [C]`, '#fde047');
          this.unlockAchievement('ach_farmer');
          this.advanceQuest('q_garden', 1);
        } else if (!plot.watered) {
          plot.watered = true;
          this.audio.splash();
          this.burst(plot.x, plot.y, '#38bdf8', 14);
          this.popup(plot.x, plot.y - 24, '💧 Sulandı! 2x Hızlı Büyüyecek!', '#38bdf8');
        } else {
          this.popup(plot.x, plot.y - 24, `🌿 Büyüyor (%${Math.floor(plot.growth * 100)})`, '#4ade80');
        }
      } else if (target.kind === 'forage') {
        target.ref.collected = true;
        target.ref.respawnTimer = 42;
        const k = target.ref.kind;
        this.bag[k] = (this.bag[k] || 0) + 1;
        this.addXp(k === 'crystal' ? 24 : 14);
        this.audio.pickup();
        this.burst(target.ref.x, target.ref.y, k === 'crystal' ? '#38bdf8' : '#4ade80', 14);
        this.popup(p.x, p.y - 32, `${YD.BAG_ITEMS[k].icon} ${YD.BAG_ITEMS[k].name} Çantada! [C]`, '#4ade80');
        if (k !== 'crystal') this.advanceQuest('q_forest', 1);
      } else if (target.kind === 'npc') {
        const npc = target.ref;
        const curH = this.npcHearts[npc.name] || 0;
        const nextH = Math.min(5, curH + 1);
        this.npcHearts[npc.name] = nextH;
        const line = npc.lines[Math.min(npc.lines.length - 1, nextH - 1)];
        this.say(npc, line, 3.2);
        this.happiness = Math.min(100, this.happiness + 8);
        this.addXp(10); this.audio.pickup();
        if (nextH === 3 && curH < 3) {
          this.money += 50;
          this.popup(npc.x, npc.y - 34, '❤️ Dostluk Hediyesi: +₺50!', '#f472b6');
        }
      } else if (target.kind === 'hospital') {
        if (this.health >= 99) { this.say(p, 'Turp gibiyim, sağlığım tam! ❤️', 2.0); return; }
        if (this.money < 30) { this.say(p, 'Muayene için ₺30 gerekiyor!', 2.0); return; }
        this.money -= 30; this.health = 100;
        this.audio.levelUp();
        this.popup(p.x, p.y - 34, '🏥 %100 SAĞLIK! (-₺30)', '#4ade80');
      } else if (target.kind === 'home') {
        this.enterHome();
        return;
      } else if (target.kind === 'lodge' || target.kind === 'hotspring') {
        this.health = 100; this.energy = Math.min(100, this.energy + 45);
        this.happiness = Math.min(100, this.happiness + 30); this.timeMinutes += 40;
        this.audio.pickup(); this.burst(p.x, p.y, '#2dd4bf', 20);
        this.popup(p.x, p.y - 36, '♨️ Karlı Zirve & Kaplıca Şifası!', '#2dd4bf');
        this.advanceQuest('q_mountain', 1);
      } else if (target.kind === 'summit') {
        this.addXp(Math.round(50 * bonusMult));
        this.happiness = Math.min(100, this.happiness + 25);
        this.audio.levelUp();
        this.burst(this.world.summitRock.x, this.world.summitRock.y, '#fde047', 22);
        this.say(p, 'Sisyphos\'un Zirvesine ulaştın! (+50 XP) 🪨🏔️', 3.0);
        this.unlockAchievement('ach_summit');
        this.advanceQuest('q_mountain', 1);
      } else if (target.kind === 'work') {
        if (this.energy < 22) { this.say(p, 'Çok yorgunum, önce uyu veya kahve iç! 😴', 2.2); return; }
        const career = YD.getCareer(this.level);
        const evMult = this.dailyEventIdx === 2 ? 1.5 : 1.0;
        const pay = Math.round((80 + this.level * 18) * career.bonus * bonusMult * evMult);
        this.energy -= 22; this.hunger = Math.max(0, this.hunger - 14);
        this.timeMinutes += 120; this.money += pay; this.addXp(30);
        this.audio.coin();
        this.popup(p.x, p.y - 34, `+₺${pay} (${career.title}) 💼`, '#facc15');
        this.advanceQuest('q_work', 1);
      } else if (target.kind === 'cafe') {
        this.toggleCafe(true);
        return;
      } else if (target.kind === 'study') {
        if (this.energy < 18) { this.say(p, 'Kafam almıyor, dinlenmeliyim!', 2.0); return; }
        this.energy -= 18; this.timeMinutes += 90;
        this.addXp(Math.round(48 * bonusMult));
        this.audio.pickup();
        this.popup(p.x, p.y - 34, `🎓 +${Math.round(48 * bonusMult)} BİLGİ XP!`, '#38bdf8');
      } else if (target.kind === 'shop') {
        this.toggleShop(true);
      } else if (target.kind === 'campfire') {
        this.energy = Math.min(100, this.energy + 30);
        this.happiness = Math.min(100, this.happiness + 22);
        this.health = Math.min(100, this.health + 15);
        this.timeMinutes += 45; this.audio.pickup();
        this.burst(this.world.campfire.x, this.world.campfire.y, '#fb923c', 16);
        this.popup(p.x, p.y - 34, '🔥 Kamp Ateşi Huzuru! ([C] Balık Pişir)', '#fb923c');
      } else if (target.kind === 'altar') {
        this.addXp(35); this.happiness = Math.min(100, this.happiness + 20);
        this.audio.timeWarp();
        this.burst(this.world.altar.x, this.world.altar.y, '#38bdf8', 20);
        this.say(p, 'Zaman bir nehir gibi akıyor... (+35 XP) ⏳', 2.8);
      } else if (target.kind === 'workout') {
        if (this.energy < 15) { this.say(p, 'Spor için biraz enerji lazım!', 2.0); return; }
        this.energy -= 15; this.health = Math.min(100, this.health + Math.round(24 * bonusMult));
        this.happiness = Math.min(100, this.happiness + 16); this.addXp(22);
        this.audio.pickup();
        this.popup(p.x, p.y - 34, '🏃 Harika Antrenman! +Sağlık', '#4ade80');
        this.advanceQuest('q_park', 1);
      } else if (target.kind === 'relax') {
        this.energy = Math.min(100, this.energy + 22); this.happiness = Math.min(100, this.happiness + 24);
        this.timeMinutes += 30; this.audio.pickup();
        this.popup(p.x, p.y - 34, '🦆 Ördekleri İzledin (+Mutluluk)', '#38bdf8');
        this.advanceQuest('q_park', 1);
      } else if (target.kind === 'fish') {
        this.startFishing();
      } else if (target.kind === 'lighthouse') {
        this.happiness = Math.min(100, this.happiness + 25); this.addXp(20);
        this.audio.pickup();
        this.say(p, 'Deniz Fenerinden tüm kıyı görünüyor! 🗼✨', 3.0);
      }
      this.checkAchievements();
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

      // Passive Daily Cafe Profit if player owns the cafe!
      let cafeMsg = '';
      if (this.ownsCafe) {
        const profit = 95 + Math.floor(Math.random() * 51);
        this.money += profit;
        this.cafeTotalEarned += profit;
        cafeMsg = ` • ☕ Kafe Geliri +₺${profit}`;
      }

      const r = Math.random();
      this.weatherIdx = this.seasonIdx === 3 ? (r < 0.6 ? 3 : 0) : (r < 0.58 ? 0 : (r < 0.85 ? 1 : 2));
      this.dailyEventIdx = Math.floor(Math.random() * YD.DAILY_EVENTS.length);

      if (this.todayPath.length > 5) {
        this.yesterdayPath = [...this.todayPath];
        this.todayPath = [];
        this.pastEcho = { x: this.yesterdayPath[0].x, y: this.yesterdayPath[0].y, idx: 0, claimed: false };
      }

      this.scene = 'world';
      this.player.x = 2062; this.player.y = 1525;
      this.player.onBike = false; this.player.inCar = false;
      const s = YD.SEASONS[this.seasonIdx], ev = YD.DAILY_EVENTS[this.dailyEventIdx];
      this.showToast(`☀️ Gün ${this.day} (${s.icon} ${s.name}) • ${ev.icon} ${ev.name}${cafeMsg}`);
      this.checkAchievements();
      this.saveGame();
    }

    update(dt) {
      this.damageFlash = Math.max(0, this.damageFlash - dt * 2.2);
      this.carHitInvuln = Math.max(0, this.carHitInvuln - dt);

      // Live scenic world pan behind Title Screen!
      if (!this.started) {
        this.world.update(dt, this.player, null, YD.WEATHERS[this.weatherIdx].id);
        this.cam.x = 2300 + Math.sin(performance.now() * 0.00018) * 750;
        this.cam.y = 1750 + Math.cos(performance.now() * 0.00015) * 650;
        return;
      }

      if (this.hasOpenModal()) return;

      if (this.barista.active) {
        this.barista.timeLeft -= dt;
        this.barista.patience -= dt;
        if (this.barista.patience <= 0) {
          this.barista.combo = 1;
          this.audio.miss();
          this.nextBaristaOrder();
        }
        this.updateBaristaUI();
        if (this.barista.timeLeft <= 0) this.finishBaristaShift(false);
        return;
      }

      if (this.fishing.active) {
        this.fishing.pos += this.fishing.dir * this.fishing.speed * dt;
        if (this.fishing.pos >= 1) { this.fishing.pos = 1; this.fishing.dir = -1; }
        if (this.fishing.pos <= 0) { this.fishing.pos = 0; this.fishing.dir = 1; }
        document.getElementById('fishCursor').style.left = `${this.fishing.pos * 100}%`;
        return;
      }

      if (this.scene === 'home') {
        this.updateHome(dt);
        return;
      }

      this.timeMinutes += dt * 2.4;
      if (this.timeMinutes >= 24 * 60) this.startNextDay(false);

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
          this.lightningFlash = 0.85; this.audio.thunder();
        }
      }

      const p = this.player;
      p.speechTimer = Math.max(0, p.speechTimer - dt);

      if (p.inCar) {
        const accelInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
        const steerInput = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
        if (accelInput !== 0) {
          p.carSpeed += accelInput * 760 * dt;
          p.carSpeed = Math.max(-220, Math.min(540, p.carSpeed));
        } else {
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
        p.vx = Math.cos(p.angle) * p.carSpeed; p.vy = Math.sin(p.angle) * p.carSpeed;
        p.x += p.vx * dt; p.y += p.vy * dt;
        this.world.resolveCollisions(p, true);
      } else {
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
        } else if (!inWater && p.swimming) p.swimming = false;

        const sprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !p.swimming && this.energy > 8;
        const maxSpd = p.swimming ? 185 : (p.onBike ? 430 : (sprinting ? 335 : 255));
        if (len === 0) { p.vx = 0; p.vy = 0; }
        else { p.vx = ix * maxSpd; p.vy = iy * maxSpd; p.angle = Math.atan2(iy, ix); p.walkCycle += dt * (maxSpd * 0.055); }
        p.x += p.vx * dt; p.y += p.vy * dt;
        this.world.resolveCollisions(p, false);

        if (p.swimming) {
          this.happiness = Math.min(100, this.happiness + dt * (this.dailyEventIdx === 1 ? 6 : 3.5));
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

      // Loyal Pet Companion Follow Logic (walks around buildings cleanly!)
      if (this.pet) {
        this.pet.petCd = Math.max(0, this.pet.petCd - dt);
        const dx = p.x - this.pet.x, dy = p.y - this.pet.y;
        const d = Math.hypot(dx, dy);
        if (d > 48) {
          const ang = Math.atan2(dy, dx);
          this.pet.angle = ang;
          const pSpd = Math.min(540, Math.max(210, d * 3.8));
          this.pet.x += Math.cos(ang) * pSpd * dt;
          this.pet.y += Math.sin(ang) * pSpd * dt;
          this.pet.r = 10;
          this.world.resolveCollisions(this.pet, false);
        }
      }

      this.hunger = Math.max(0, this.hunger - 0.32 * dt);
      if (this.hunger <= 5) this.health = Math.max(5, this.health - 1.2 * dt);

      if (this.energy <= 0) {
        if (this.inventory.has('phoenix')) {
          this.energy = 65;
          this.popup(p.x, p.y - 38, '🪶 ANKA TÜYÜ DEVREDE! +65 Enerji', '#fb923c');
          this.burst(p.x, p.y, '#fb923c', 22);
        } else this.startNextDay(true);
      }

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
          this.pastEcho.claimed = true; this.addXp(35);
          this.happiness = Math.min(100, this.happiness + 18);
          this.audio.timeWarp(); this.burst(this.pastEcho.x, this.pastEcho.y, '#fde047', 22);
          this.popup(p.x, p.y - 40, '✨ GEÇMİŞİNLE BARIŞTIN! +35 XP', '#fde047');
          this.unlockAchievement('ach_echo');
        }
      }

      for (const npc of this.npcs) {
        npc.speechTimer = Math.max(0, npc.speechTimer - dt);
        npc.timer -= dt;
        if (npc.timer <= 0) { npc.timer = 2.5 + Math.random() * 3.5; npc.angle = Math.random() * Math.PI * 2; }
        const nx = npc.x + Math.cos(npc.angle) * 24 * dt, ny = npc.y + Math.sin(npc.angle) * 24 * dt;
        if (Math.hypot(nx - npc.homeX, ny - npc.homeY) < 90 && !this.world.isInsideBuilding(nx, ny, 24) && !this.world.isOnRoad(nx, ny, 10)) {
          npc.x = nx; npc.y = ny; npc.walkCycle += dt * 5;
        } else npc.angle += Math.PI;
      }

      this.world.update(dt, p, (car) => this.handleCarHitPlayer(car), YD.WEATHERS[this.weatherIdx].id);

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
        wp.x += wp.vx * rainSpeedMult * dt; wp.y += wp.vy * rainSpeedMult * dt;
        if (wp.x < 0) wp.x = this.viewW;
        if (wp.y > this.viewH) { wp.y = 0; wp.x = Math.random() * this.viewW; }
      }

      const targetZoom = p.inCar ? 0.84 : 1.0;
      this.cam.zoom += (targetZoom - this.cam.zoom) * Math.min(1, dt * 2.5);
      this.cam.x += (p.x + p.vx * 0.16 - this.cam.x) * Math.min(1, dt * 7.5);
      this.cam.y += (p.y + p.vy * 0.16 - this.cam.y) * Math.min(1, dt * 7.5);

      // Clamp camera cleanly inside world boundaries (ZERO black void at map edges!)
      const halfVW = Math.min(YD.WORLD_W / 2, (this.viewW / 2) / this.cam.zoom);
      const halfVH = Math.min(YD.WORLD_H / 2, (this.viewH / 2) / this.cam.zoom);
      this.cam.x = Math.max(halfVW, Math.min(YD.WORLD_W - halfVW, this.cam.x));
      this.cam.y = Math.max(halfVH, Math.min(YD.WORLD_H - halfVH, this.cam.y));

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
      document.getElementById('biomeBadge').textContent = biome === 'home' ? '🏠 EVİNİN İÇİ' : this.world.getBiomeLabel(biome);

      const bottomBar = document.querySelector('.hud-bottom');
      if (bottomBar) bottomBar.classList.toggle('hidden', this.scene === 'home');

      const prompt = this.scene === 'home' ? this.findNearestHomeInteraction() : this.findNearestInteraction();
      const promptEl = document.getElementById('interactPrompt');
      if (prompt && !this.fishing.active && !this.barista.active) {
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
