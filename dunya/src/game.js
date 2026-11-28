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
  const SEC = YD.Security;

  function makeEl(tag, opts, ...children) {
    const el = document.createElement(tag);
    if (opts) {
      if (opts.className) el.className = opts.className;
      if (opts.id) el.id = opts.id;
      if (opts.title) el.title = YD.tr ? YD.tr(opts.title) : opts.title;
      if (opts.disabled) el.disabled = true;
      if (opts.style) Object.assign(el.style, opts.style);
      if (opts.dataset) {
        for (const [k, v] of Object.entries(opts.dataset)) el.dataset[k] = v;
      }
      if (opts.onClick) el.addEventListener('click', opts.onClick);
    }
    for (const ch of children) {
      if (ch == null || ch === false) continue;
      if (typeof ch === 'string') {
        el.appendChild(document.createTextNode(YD.tr ? YD.tr(ch) : ch));
      } else if (typeof ch === 'number') {
        el.appendChild(document.createTextNode(String(ch)));
      } else {
        el.appendChild(ch);
      }
    }
    return el;
  }

  function makeTxt(text) {
    const raw = String(text);
    return document.createTextNode(YD.tr ? YD.tr(raw) : raw);
  }

  class YasamDunyaGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.miniCanvas = document.getElementById('minimapCanvas');
      this.renderer = new YD.WorldRenderer(this.canvas, this.miniCanvas);
      this.audio = new YD.CozyAudio();
      this.world = new YD.LifeWorld();

      this.started = false;
      this.scene = 'world'; // 'world' | 'home'
      this.keys = Object.create(null);
      this.shopOpen = false;
      this.homeOpen = false;
      this.questOpen = false;
      this.helpOpen = false;
      this.bagOpen = false;
      this.gardenOpen = false;
      this.cafeOpen = false;
      this.officeOpen = false;
      this.busOpen = false;
      this.busMode = 'bus';
      this.bankOpen = false;
      this.cookOpen = false;
      this.uniOpen = false;
      this.musicOpen = false;
      this.activePlotId = null;
      this.activeQuizIdx = null;
      this.quizDoneToday = false;
      this.fountainWishedToday = false;
      this.minimapVisible = true;
      this.audio.onTrackChange = (track) => {
        if (this.musicOpen) this.renderMusicModal();
        const toastEl = document.getElementById('eventToast');
        if (this.started && !this.musicOpen && this.audio.musicOn && !this.audio.muted && toastEl && toastEl.classList.contains('hidden')) {
          this.showToast(`🎵 ${track.icon} ${track.name}`);
        }
      };

      this.fishing = { active: false, pos: 0.5, dir: 1, speed: 1.55 };
      this.barista = { active: false, timeLeft: 25, score: 0, combo: 1, served: 0, order: null, patience: 4.5, maxPatience: 4.5 };
      this.delivery = { active: false, target: null, timeLeft: 45 };
      this.autoPilot = {
        active: false,
        role: '🤖 SWARM',
        task: 'Otonom karar hesaplanıyor...',
        targetX: null,
        targetY: null,
        actionCd: 0,
        baristaCd: 0,
        stuckTimer: 0,
        nudgeTimer: 0,
        nudgeSign: 1,
        lastX: 2062,
        lastY: 1525
      };

      this.playerName = 'Gezgin';
      this.player = {
        x: 2062, y: 1525, vx: 0, vy: 0, r: 16, angle: Math.PI / 2,
        color: YD.JACKET_COLORS[0].hex, walkCycle: 0,
        swimming: false, onBike: false, inCar: false, carSpeed: 0,
        inBoat: false, boatSpeed: 0,
        speech: '', speechTimer: 0
      };
      this.homePlayer = {
        x: 340, y: 350, vx: 0, vy: 0, r: 16, angle: -Math.PI / 2,
        color: YD.JACKET_COLORS[0].hex, walkCycle: 0
      };
      this.pet = null; // { kind: 'dog'|'cat', x, y, angle, petCd }
      this.homePet = null;
      this.parkedCar = null;
      this.parkedBoat = { x: 2435, y: 2975, angle: Math.PI / 2 };
      this.skidMarks = [];
      this.damageFlash = 0;
      this.carHitInvuln = 0;
      this.cameraFlash = 0;
      this.cameraCd = 0;
      this.lastPhotoLabel = '';

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
      this.bankBalance = 0;
      this.carBattery = 100;
      this.rainChillTimer = 0;
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
      this.uniCerts = new Set();
      this.photosTaken = new Set();
      this.bag = { berry: 0, mushroom: 0, fish: 0, goldfish: 0, grilled: 0, soup: 0, pie: 0, feast: 0, crystal: 0, tomato: 0, strawberry: 0, sunflower: 0, petfood: 2 };
      this.achievements = new Set();
      this.animalFriends = new Set();
      this.npcHearts = {};

      this.questProgress = {};
      this.questDone = new Set();
      this.starterDone = new Set();
      this.guideMinimized = false;
      this.guideCompass = true;

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
      this.activePetKind = null;
      this.resize();
      this.initWeatherParticles();
      if (YD.I18N) YD.I18N.applyDom();
      this.renderTitleScreen();
      this.bindEvents();

      this.lastTime = performance.now();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    peekSave() {
      const storage = SEC.getSafeStorage();
      if (!storage) return false;
      try { return !!storage.getItem(SAVE_KEY); } catch (_) { return false; }
    }

    switchLanguage(lang) {
      if (!YD.I18N) return;
      YD.I18N.setLang(lang);
      if (lang === 'en' && this.playerName === 'Gezgin') this.playerName = 'Traveler';
      else if (lang === 'tr' && this.playerName === 'Traveler') this.playerName = 'Gezgin';
      if (this.player && this.player.speechTimer > 0 && this.player.speech && this.player.speech.includes('Büyük Dünya')) {
        this.player.speech = `Merhaba ${this.playerName}! Büyük Dünya seni bekliyor! ✨`;
      }
      this.renderTitleScreen();
      if (this.started) {
        if (this.shopOpen) this.renderShop();
        if (this.bagOpen) this.renderBag();
        if (this.questOpen) this.renderQuests();
        if (this.homeOpen) this.renderHomeModal();
        if (this.musicOpen) this.renderMusicModal();
        if (this.bankOpen) this.renderBankModal();
        if (this.busOpen) this.renderBusModal();
        if (this.officeOpen) this.renderOfficeModal();
        if (this.cafeOpen) this.renderCafeModal();
        if (this.gardenOpen) this.renderGardenModal();
        if (this.cookOpen) this.renderCookModal();
        if (this.uniOpen) this.renderUniModal();
        const biome = this.scene === 'home' ? 'home' : this.world.getBiome(this.player.x, this.player.y);
        this.updateHUD(biome);
      }
    }

    renderTitleScreen() {
      const row = document.getElementById('colorPickerRow');
      if (row) {
        const allowedHexes = YD.JACKET_COLORS.map((c) => c.hex);
        const frag = document.createDocumentFragment();
        YD.JACKET_COLORS.forEach((c) => {
          const safeHex = SEC.sanitizeHexColor(c.hex, allowedHexes, allowedHexes[0]);
          frag.appendChild(makeEl('button', {
            className: `color-dot ${safeHex === this.player.color ? 'active' : ''}`,
            title: c.name,
            dataset: { hex: safeHex },
            style: { background: safeHex },
            onClick: () => {
              this.player.color = safeHex;
              this.renderTitleScreen();
            }
          }));
        });
        row.replaceChildren(frag);
      }
      const contBtn = document.getElementById('btnContinueGame');
      if (contBtn) {
        const en = YD.I18N && YD.I18N.getLang() === 'en';
        if (this.hasSave) {
          contBtn.classList.remove('hidden');
          document.getElementById('btnStartNewGame').textContent = en ? '↺ NEW LIFE' : '↺ YENİ HAYAT';
        } else {
          contBtn.classList.add('hidden');
          document.getElementById('btnStartNewGame').textContent = en ? '✨ START NEW LIFE' : '✨ OYUNA BAŞLA';
        }
      }
    }

    beginPlay(loadExisting) {
      this.audio.unlock();
      if (loadExisting) {
        this.loadSave();
      } else {
        const input = document.getElementById('inputPlayerName');
        const defName = (YD.I18N && YD.I18N.getLang() === 'en') ? 'Traveler' : 'Gezgin';
        this.playerName = SEC.sanitizePlayerName(input && input.value, defName, 16);
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
      this.syncMusicButton();
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
      if (this.player) { this.player.vx = 0; this.player.vy = 0; this.player.carSpeed = 0; this.player.boatSpeed = 0; }
      if (this.homePlayer) { this.homePlayer.vx = 0; this.homePlayer.vy = 0; }
    }

    hasOpenModal() {
      return this.shopOpen || this.homeOpen || this.questOpen || this.helpOpen || this.bagOpen || this.gardenOpen || this.cafeOpen || this.officeOpen || this.busOpen || this.bankOpen || this.cookOpen || this.uniOpen || this.musicOpen;
    }

    // Central input/state mode (v11). Single source of truth for "who owns input right now".
    // Priority: title > mini-game (fishing/barista) > open modal > home interior > open world.
    get mode() {
      if (!this.started) return 'title';
      if (this.fishing && this.fishing.active) return 'fishing';
      if (this.barista && this.barista.active) return 'barista';
      if (this.hasOpenModal()) return 'modal';
      if (this.scene === 'home') return 'home';
      return 'world';
    }

    isMiniGame() { const m = this.mode; return m === 'fishing' || m === 'barista'; }

    // Can the player trigger a free-roam action? scope 'world' = open world only, 'any' = world or home.
    canAct(scope = 'world') {
      const m = this.mode;
      return scope === 'any' ? (m === 'world' || m === 'home') : m === 'world';
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('blur', () => this.clearAllKeys());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearAllKeys(); });
      window.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
      window.addEventListener('wheel', (e) => {
        if (!this.started || this.scene !== 'world') return;
        this.cam.zoom = Math.max(0.62, Math.min(1.45, this.cam.zoom - Math.sign(e.deltaY) * 0.08));
      }, { passive: true });

      document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.audio.unlock();
          this.audio.uiClick();
          this.switchLanguage(btn.dataset.langBtn);
        });
      });

      document.querySelectorAll('.modal-backdrop').forEach((bd) => {
        if (bd.id === 'titleModal') return;
        bd.addEventListener('click', (ev) => {
          if (ev.target === bd) this.closeAllModals();
        });
      });

      document.getElementById('btnContinueGame').addEventListener('click', () => this.beginPlay(true));
      document.getElementById('btnStartNewGame').addEventListener('click', () => {
        const msg = (YD.I18N && YD.I18N.getLang() === 'en')
          ? 'Starting a new life will erase your current save. Continue?'
          : 'Mevcut kayıt silinip yeni hayata başlansın mı?';
        if (this.hasSave && !confirm(msg)) return;
        SEC.removeStorageKeySafe(SEC.getSafeStorage(), SAVE_KEY);
        this.hasSave = false;
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

        if (e.code === 'KeyO') { this.toggleAutoPilot(); return; }

        if (this.barista.active) {
          const match = YD.CAFE_ORDERS.find((o) => o.code === e.code || e.key === o.key);
          if (match) this.serveBarista(match.id);
          return;
        }

        if (this.fishing.active) {
          if (e.code === 'KeyE' || e.code === 'Space') this.resolveFishingAttempt();
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
        if (e.code === 'KeyN') {
          if (e.shiftKey) this.toggleMusic();
          else this.toggleMusicModal(!this.musicOpen);
          return;
        }

        if (this.hasOpenModal()) return;

        if (e.code === 'KeyE' || e.code === 'Space') {
          if (this.scene === 'home') {
            this.handleHomeInteract();
          } else if (this.player.inCar && e.code === 'Space') {
            this.honkPlayerHorn();
          } else {
            this.handleInteract();
          }
        }
        if (e.code === 'KeyP') this.petCompanion();
        if (e.code === 'KeyF') this.snapPhoto();
        if (this.scene === 'home') return;

        if (e.code === 'KeyH' && this.player.inCar) {
          this.honkPlayerHorn();
        }
        if (e.code === 'KeyB') this.toggleBike();
        if (e.code === 'KeyV') this.toggleCar();
        if (e.code === 'KeyU') this.toggleBoat();
        if (e.code === 'KeyT') this.useHourglass();
        if (e.code === 'KeyY') this.cycleWeather();
        if (e.code === 'Equal' || e.code === 'NumpadAdd') this.cam.zoom = Math.min(1.45, this.cam.zoom + 0.1);
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.cam.zoom = Math.max(0.62, this.cam.zoom - 0.1);
      });

      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

      document.getElementById('btnAutoPilot').addEventListener('click', () => { this.audio.unlock(); this.toggleAutoPilot(); });
      document.getElementById('btnStopSwarm').addEventListener('click', () => { this.audio.unlock(); this.toggleAutoPilot(false); });
      document.getElementById('btnGuideCompass')?.addEventListener('click', () => {
        this.audio.unlock(); this.audio.uiClick();
        this.guideCompass = !this.guideCompass;
        this.updateGuideHUD(); this.saveGame();
      });
      document.getElementById('btnGuideCollapse')?.addEventListener('click', () => {
        this.audio.unlock(); this.audio.uiClick();
        this.guideMinimized = true;
        this.updateGuideHUD(); this.saveGame();
      });
      document.getElementById('guideMiniBtn')?.addEventListener('click', () => {
        this.audio.unlock(); this.audio.uiClick();
        this.guideMinimized = false;
        this.updateGuideHUD(); this.saveGame();
      });
      document.getElementById('btnGuideSkip')?.addEventListener('click', () => {
        this.audio.unlock();
        this.skipActiveStarterTask();
      });
      const miniBusy = () => this.isMiniGame();
      document.getElementById('btnBag').addEventListener('click', () => { if (miniBusy()) return; this.audio.unlock(); this.toggleBag(!this.bagOpen); });
      document.getElementById('btnCloseBag').addEventListener('click', () => this.toggleBag(false));
      document.getElementById('btnOpenCookFromBag').addEventListener('click', () => { this.audio.unlock(); this.toggleCook(true); });
      document.getElementById('btnQuests').addEventListener('click', () => { if (miniBusy()) return; this.audio.unlock(); this.toggleQuests(!this.questOpen); });
      document.getElementById('btnCloseQuests').addEventListener('click', () => this.toggleQuests(false));
      document.getElementById('btnShop').addEventListener('click', () => { if (miniBusy()) return; this.audio.unlock(); this.toggleShop(!this.shopOpen); });
      document.getElementById('btnCloseShop').addEventListener('click', () => this.toggleShop(false));
      document.getElementById('btnCloseHome').addEventListener('click', () => this.toggleHome(false));
      document.getElementById('btnCloseGarden').addEventListener('click', () => this.toggleGarden(false));
      document.getElementById('btnCloseCafe').addEventListener('click', () => this.toggleCafe(false));
      document.getElementById('btnCloseOffice').addEventListener('click', () => this.toggleOffice(false));
      document.getElementById('btnCloseBus').addEventListener('click', () => this.toggleBus(false));
      document.getElementById('btnCloseBank').addEventListener('click', () => this.toggleBank(false));
      document.getElementById('btnCloseCook').addEventListener('click', () => this.toggleCook(false));
      document.getElementById('btnCloseUni').addEventListener('click', () => this.toggleUni(false));
      document.getElementById('btnCloseMusic').addEventListener('click', () => this.toggleMusicModal(false));
      document.getElementById('btnCancelDelivery').addEventListener('click', () => this.cancelDelivery('Teslimat iptal edildi.'));
      document.getElementById('btnStopBarista').addEventListener('click', () => this.finishBaristaShift(true));
      document.getElementById('btnHomeSleep').addEventListener('click', () => { this.toggleHome(false); this.startNextDay(false); });
      document.getElementById('btnMapToggle').addEventListener('click', () => { this.audio.unlock(); this.toggleMap(); });
      document.getElementById('btnHelp').addEventListener('click', () => { if (miniBusy()) return; this.audio.unlock(); this.toggleHelp(!this.helpOpen); });
      document.getElementById('btnCloseHelp').addEventListener('click', () => this.toggleHelp(false));
      document.getElementById('btnLangHud')?.addEventListener('click', () => {
        this.audio.unlock();
        const nextLang = (YD.I18N && YD.I18N.getLang() === 'en') ? 'tr' : 'en';
        this.switchLanguage(nextLang);
        this.showToast(nextLang === 'en' ? '🌐 Language switched to English!' : '🌐 Oyun dili Türkçe oldu!');
      });
      const worldOnly = () => !this.canAct('world');
      document.getElementById('btnBike').addEventListener('click', () => { if (worldOnly()) return; this.audio.unlock(); this.toggleBike(); });
      document.getElementById('btnCar').addEventListener('click', () => { if (worldOnly()) return; this.audio.unlock(); this.toggleCar(); });
      document.getElementById('btnBoat').addEventListener('click', () => { if (worldOnly()) return; this.audio.unlock(); this.toggleBoat(); });
      document.getElementById('btnPetAction').addEventListener('click', () => { if (!this.canAct('any')) return; this.audio.unlock(); this.petCompanion(); });
      document.getElementById('btnCamera').addEventListener('click', () => { if (miniBusy()) return; this.audio.unlock(); this.snapPhoto(); });
      document.getElementById('btnWeather').addEventListener('click', () => { if (worldOnly()) return; this.audio.unlock(); this.cycleWeather(); });
      document.getElementById('btnSeason').addEventListener('click', () => { if (worldOnly()) return; this.audio.unlock(); this.useHourglass(); });
      document.getElementById('btnMusic').addEventListener('click', () => { if (miniBusy()) return; this.audio.unlock(); this.toggleMusicModal(!this.musicOpen); });
      document.getElementById('btnToggleMusicPlay').addEventListener('click', () => { this.audio.unlock(); this.toggleMusic(); });
      document.getElementById('btnToggleMuteAll').addEventListener('click', () => {
        this.audio.unlock();
        this.audio.setMuted(!this.audio.muted);
        this.syncMusicButton();
        this.renderMusicModal();
      });
      document.getElementById('sliderMusicVol').addEventListener('input', (e) => {
        this.audio.unlock();
        this.audio.setMusicVolume(Number(e.target.value) / 100);
        document.getElementById('valMusicVol').textContent = `${e.target.value}%`;
      });
      document.getElementById('sliderAmbVol').addEventListener('input', (e) => {
        this.audio.unlock();
        this.audio.setAmbienceVolume(Number(e.target.value) / 100);
        document.getElementById('valAmbVol').textContent = `${e.target.value}%`;
      });
      document.getElementById('sliderSfxVol').addEventListener('input', (e) => {
        this.audio.unlock();
        this.audio.setSfxVolume(Number(e.target.value) / 100);
        document.getElementById('valSfxVol').textContent = `${e.target.value}%`;
      });
      document.getElementById('btnFishCatch').addEventListener('click', () => { this.audio.unlock(); this.resolveFishingAttempt(); });
      document.getElementById('btnResetSave').addEventListener('click', () => {
        const msg = (YD.I18N && YD.I18N.getLang() === 'en')
          ? 'Reset your saved game and start fresh?'
          : 'Kayıt sıfırlansın mı?';
        if (confirm(msg)) {
          SEC.removeStorageKeySafe(SEC.getSafeStorage(), SAVE_KEY);
          location.reload();
        }
      });

      document.querySelectorAll('.touch-btn').forEach((btn) => {
        const code = btn.dataset.key;
        const down = (ev) => {
          ev.preventDefault(); this.audio.unlock(); this.keys[code] = true;
          if (code === 'KeyE') {
            if (this.fishing.active) this.resolveFishingAttempt();
            else if (!this.canAct('any')) { /* mini-game / modal owns input */ }
            else if (this.scene === 'home') this.handleHomeInteract();
            else this.handleInteract();
          }
          if (code === 'KeyV' && this.canAct('world')) this.toggleCar();
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
      el.textContent = YD.tr ? YD.tr(text) : text;
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
      if ((this.money + this.bankBalance) >= 1000) this.unlockAchievement('ach_rich');
      if (this.inventory.has('car')) this.unlockAchievement('ach_car');
      if (this.inventory.has('pet_dog') || this.inventory.has('pet_cat')) this.unlockAchievement('ach_pet');
      if (this.homeDecor.size >= 3) this.unlockAchievement('ach_decor');
      if (this.ownsCafe) this.unlockAchievement('ach_barista');
      if (this.animalFriends.size >= 3) this.unlockAchievement('ach_animals');
      if (this.photosTaken.size >= 3) this.unlockAchievement('ach_photo');
      if (this.uniCerts.size >= 1) this.unlockAchievement('ach_grad');
    }

    syncPetFromInventory(preferKind = null) {
      if (preferKind) this.activePetKind = preferKind;
      let kind = this.activePetKind;
      if (kind === 'dog' && !this.inventory.has('pet_dog')) kind = null;
      if (kind === 'cat' && !this.inventory.has('pet_cat')) kind = null;
      if (!kind) {
        if (this.inventory.has('pet_dog')) kind = 'dog';
        else if (this.inventory.has('pet_cat')) kind = 'cat';
      }
      if (kind && (!this.pet || this.pet.kind !== kind)) {
        this.pet = { kind, x: this.player.x - 28, y: this.player.y + 18, angle: 0, petCd: 0 };
      }
    }

    petCompanion() {
      if (!this.pet) {
        this.say(this.player, 'Sokak hayvanlarına yaklaşıp [E] ile sevebilir veya Marketten [I] evcil hayvan sahiplenebilirsin! 🐾', 2.6);
        return;
      }
      if (this.pet.petCd > 0) return;
      this.pet.petCd = 3.0;
      this.happiness = Math.min(100, this.happiness + 12);
      if (this.pet.kind === 'dog') this.audio.bark();
      else this.audio.meow();
      const pRef = (this.scene === 'home' && this.homePet) ? this.homePet : this.pet;
      this.burst(pRef.x, pRef.y, '#f472b6', 14);
      this.popup(pRef.x, pRef.y - 24, this.pet.kind === 'dog' ? 'HAV HAV! ❤️ +12 Mutluluk' : 'MİYAV! ❤️ +12 Mutluluk', '#f9a8d4');
    }

    saveGame() {
      const storage = SEC.getSafeStorage();
      if (!storage) return;
      const data = {
        playerName: SEC.sanitizePlayerName(this.playerName, 'Gezgin', 16), color: this.player.color,
        day: this.day, age: this.age, seasonIdx: this.seasonIdx, weatherIdx: this.weatherIdx,
        dailyEventIdx: this.dailyEventIdx, timeMinutes: this.timeMinutes,
        money: this.money, bankBalance: this.bankBalance, carBattery: this.carBattery,
        health: this.health, energy: this.energy,
        hunger: this.hunger, happiness: this.happiness, xp: this.xp, level: this.level,
        ownsCafe: this.ownsCafe, cafeTotalEarned: this.cafeTotalEarned,
        gardenPlots: this.world.gardenPlots.map((g) => ({ crop: g.crop, growth: g.growth, watered: g.watered })),
        inventory: [...this.inventory], homeDecor: [...this.homeDecor],
        uniCerts: [...this.uniCerts], photosTaken: [...this.photosTaken],
        bag: this.bag, achievements: [...this.achievements], animalFriends: [...this.animalFriends],
        npcHearts: this.npcHearts,
        questProgress: this.questProgress, questDone: [...this.questDone],
        starterDone: [...this.starterDone],
        guideMinimized: this.guideMinimized,
        guideCompass: this.guideCompass,
        px: this.player.x, py: this.player.y
      };
      try { storage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (_) {}
    }

    loadSave() {
      const storage = SEC.getSafeStorage();
      if (!storage) return;
      try {
        const raw = storage.getItem(SAVE_KEY);
        if (!raw) return;
        const d = SEC.sanitizeSaveData(raw, YD);
        if (!d) return;
        this.playerName = d.playerName;
        this.player.color = d.color;
        this.day = d.day; this.age = d.age;
        this.seasonIdx = d.seasonIdx; this.weatherIdx = d.weatherIdx;
        this.dailyEventIdx = d.dailyEventIdx;
        this.timeMinutes = d.timeMinutes;
        this.money = d.money;
        this.bankBalance = d.bankBalance;
        this.carBattery = d.carBattery;
        this.health = d.health;
        this.energy = d.energy; this.hunger = d.hunger;
        this.happiness = d.happiness; this.xp = d.xp; this.level = d.level;
        this.ownsCafe = d.ownsCafe;
        this.cafeTotalEarned = d.cafeTotalEarned;
        d.gardenPlots.forEach((gp, idx) => {
          if (this.world.gardenPlots[idx]) {
            this.world.gardenPlots[idx].crop = gp.crop;
            this.world.gardenPlots[idx].growth = gp.growth;
            this.world.gardenPlots[idx].watered = gp.watered;
          }
        });
        this.inventory = d.inventory;
        this.homeDecor = d.homeDecor;
        this.uniCerts = d.uniCerts;
        this.photosTaken = d.photosTaken;
        this.bag = { ...d.bag };
        this.achievements = d.achievements;
        this.animalFriends = d.animalFriends;
        this.npcHearts = { ...d.npcHearts };
        this.questProgress = { ...d.questProgress };
        this.questDone = d.questDone;
        this.starterDone = d.starterDone || new Set();
        this.guideMinimized = Boolean(d.guideMinimized);
        this.guideCompass = d.guideCompass !== false;
        if (d.px !== null && d.py !== null) {
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
      if (id === 'q_animals') this.completeStarterTask('st_animal');
      else if (id === 'q_work' || id === 'q_delivery') this.completeStarterTask('st_work');
      else if (id === 'q_uni') this.completeStarterTask('st_campus');
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

    getActiveStarterTask() {
      const list = YD.STARTER_TASKS || [];
      for (let i = 0; i < list.length; i++) {
        if (!this.starterDone.has(list[i].id)) return { task: list[i], idx: i, total: list.length };
      }
      return null;
    }

    getStarterWaypoint() {
      const cur = this.getActiveStarterTask();
      if (!cur || !cur.task.waypoint) return null;
      const wp = cur.task.waypoint;
      if (wp.type === 'point') return { x: wp.x, y: wp.y };
      if (wp.type === 'stray' && this.world.strays && this.world.strays.length > 0) {
        let best = this.world.strays[0], bestD = Infinity;
        for (const s of this.world.strays) {
          const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
          if (d < bestD) { bestD = d; best = s; }
        }
        return { x: best.x, y: best.y };
      }
      if (wp.type === 'garden' && this.world.gardenPlots && this.world.gardenPlots.length > 0) {
        const empty = this.world.gardenPlots.find((p) => !p.crop) || this.world.gardenPlots[0];
        return { x: empty.x, y: empty.y };
      }
      if (wp.type === 'pier' && this.world.pier) {
        return { x: this.world.pier.x + this.world.pier.w / 2, y: this.world.pier.y + this.world.pier.h - 24 };
      }
      return null;
    }

    completeStarterTask(id, skipped = false) {
      if (!id || this.starterDone.has(id)) return;
      const list = YD.STARTER_TASKS || [];
      const t = list.find((x) => x.id === id);
      if (!t) return;
      this.starterDone.add(id);
      if (!skipped) {
        this.money += t.rewardMoney;
        this.addXp(t.rewardXp);
        this.happiness = Math.min(100, this.happiness + 8);
        this.audio.levelUp();
        const tTitle = YD.tr ? YD.tr(t.title) : t.title;
        const mStr = YD.fmtMoney ? YD.fmtMoney(t.rewardMoney) : `₺${t.rewardMoney}`;
        this.showToast(`🎯 ${tTitle} ✓ (+${mStr}, +${t.rewardXp} XP)`);
        this.burst(this.player.x, this.player.y, '#38bdf8', 16);
      }
      if (this.starterDone.size >= list.length && !skipped) {
        this.showToast('🏆 KEŞİF REHBERİ TAMAMLANDI! Artık Hazine Adası [U], Gurme Mutfak ve Kafe Sahipliği seni bekliyor!');
      }
      this.checkAchievements();
      this.updateGuideHUD();
      this.saveGame();
    }

    skipActiveStarterTask() {
      const cur = this.getActiveStarterTask();
      if (!cur) return;
      this.audio.uiClick();
      this.completeStarterTask(cur.task.id, true);
    }

    updateGuideHUD() {
      const card = document.getElementById('guideCard');
      const mini = document.getElementById('guideMiniBtn');
      if (!card || !mini) return;
      const cur = this.getActiveStarterTask();
      const busy = !cur || !this.canAct('any');
      if (busy) {
        card.classList.add('hidden');
        mini.classList.add('hidden');
        return;
      }
      const doneCount = Math.min(cur.total, this.starterDone.size);
      const stepLabel = `${doneCount}/${cur.total} ✓`;
      if (this.guideMinimized) {
        card.classList.add('hidden');
        mini.classList.remove('hidden');
        const mt = document.getElementById('guideMiniText');
        if (mt) mt.textContent = stepLabel;
        return;
      }
      mini.classList.add('hidden');
      card.classList.remove('hidden');

      const stepEl = document.getElementById('guideStepBadge');
      const fillEl = document.getElementById('guideProgressFill');
      const titleEl = document.getElementById('guideTaskTitle');
      const hintEl = document.getElementById('guideTaskHint');
      const metaEl = document.getElementById('guideTaskMeta');
      const distEl = document.getElementById('guideDistBadge');
      const cmpBtn = document.getElementById('btnGuideCompass');

      if (stepEl) stepEl.textContent = stepLabel;
      if (fillEl) fillEl.style.width = `${Math.round((doneCount / cur.total) * 100)}%`;
      const tTitle = YD.tr ? YD.tr(cur.task.title) : cur.task.title;
      const tHint = YD.tr ? YD.tr(cur.task.hint) : cur.task.hint;
      if (titleEl) titleEl.textContent = `${cur.task.icon} ${tTitle}`;
      if (hintEl) hintEl.textContent = tHint;
      const mStr = YD.fmtMoney ? YD.fmtMoney(cur.task.rewardMoney) : `₺${cur.task.rewardMoney}`;
      if (metaEl) metaEl.textContent = `+${mStr} · +${cur.task.rewardXp} XP`;
      if (cmpBtn) cmpBtn.classList.toggle('off', !this.guideCompass);

      if (distEl) {
        const wp = this.scene === 'world' ? this.getStarterWaypoint() : null;
        if (wp) {
          const distM = Math.max(1, Math.round(Math.hypot(wp.x - this.player.x, wp.y - this.player.y) / 4));
          distEl.textContent = `📍 ${distM}m`;
        } else {
          distEl.textContent = '';
        }
      }
    }

    syncMusicButton() {
      const btn = document.getElementById('btnMusic');
      if (!btn) return;
      const active = this.audio.musicOn && !this.audio.muted;
      btn.replaceChildren(
        document.createTextNode(active ? '🎵' : '🔇'),
        makeEl('span', null, 'N')
      );
    }

    toggleMusic() {
      this.audio.setMusicOn(!this.audio.musicOn);
      this.syncMusicButton();
      if (this.musicOpen) this.renderMusicModal();
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
      if (this.player.swimming || this.player.inBoat) { this.say(this.player, 'Suda bisiklet sürülmez! 😅', 1.8); return; }
      if (this.player.inCar) this.toggleCar();
      this.player.onBike = !this.player.onBike;
      this.audio.bikeBell();
      this.popup(this.player.x, this.player.y - 28, this.player.onBike ? '🚲 BİSİKLET AÇIK' : '🚶 YÜRÜYÜŞ', '#38bdf8');
    }

    toggleCar() {
      if (!this.inventory.has('car')) { this.say(this.player, 'Marketten [I] Elektrikli Araba (₺340) al! 🚗', 2.5); return; }
      if (this.player.swimming || this.player.inBoat) { this.say(this.player, 'Karaya çıkınca arabaya binebilirsin!', 2.2); return; }
      this.player.onBike = false;
      if (!this.player.inCar) {
        this.player.inCar = true; this.player.carSpeed = 0; this.parkedCar = null;
        this.audio.carStart();
        this.popup(this.player.x, this.player.y - 32, '🚗 ARABA MODU! ([H]/[Space] Korna)', '#22d3ee');
      } else {
        this.player.inCar = false;
        this.parkedCar = { x: this.player.x, y: this.player.y, angle: this.player.angle };
        const rx = this.player.x + Math.cos(this.player.angle + Math.PI / 2) * 32;
        const ry = this.player.y + Math.sin(this.player.angle + Math.PI / 2) * 32;
        const lx = this.player.x + Math.cos(this.player.angle - Math.PI / 2) * 32;
        const ly = this.player.y + Math.sin(this.player.angle - Math.PI / 2) * 32;
        if (!this.world.isInWater(rx, ry)) {
          this.player.x = rx; this.player.y = ry;
        } else if (!this.world.isInWater(lx, ly)) {
          this.player.x = lx; this.player.y = ly;
        }
        this.world.resolveCollisions(this.player, false);
        this.popup(this.player.x, this.player.y - 28, '🚶 ARABADAN İNDİN', '#cbd5e1');
      }
    }

    toggleBoat() {
      if (!this.inventory.has('boat')) { this.say(this.player, 'Marketten [I] Sürat Teknesi (₺280) al! 🚤', 2.5); return; }
      const p = this.player;
      if (!p.inBoat) {
        if (p.y < YD.BEACH_Y - 20) {
          this.say(p, 'Sürat teknesine sahilde veya denizde binebilirsin! 🏖️🚤', 2.4);
          return;
        }
        p.onBike = false; p.inCar = false; p.swimming = false;
        p.inBoat = true; p.boatSpeed = 0; this.parkedBoat = null;
        if (p.y < YD.SEA_Y + 32) p.y = YD.SEA_Y + 34;
        if (this.world.isOnPier(p.x, p.y)) p.x = this.world.pier.x + this.world.pier.w + 38;
        if (this.world.isOnIsland(p.x, p.y, 18)) p.y = this.world.island.y - this.world.island.ry - 34;
        this.audio.splash(); this.audio.carStart();
        this.burst(p.x, p.y, '#38bdf8', 16);
        this.popup(p.x, p.y - 34, '🚤 SÜRAT TEKNESİ AÇIK! (Güneybatıda Hazine Adası!)', '#38bdf8');
      } else {
        p.inBoat = false; p.boatSpeed = 0;
        this.parkedBoat = { x: p.x, y: p.y, angle: p.angle };
        if (this.world.isOnIsland(p.x, p.y, 75)) {
          p.x = this.world.island.x; p.y = this.world.island.y - this.world.island.ry + 28;
          this.popup(p.x, p.y - 28, '🏝️ HAZİNE ADASINA ÇIKTIN!', '#fde047');
        } else if (p.y < YD.SEA_Y + 90) {
          p.y = YD.SEA_Y - 26;
          this.popup(p.x, p.y - 28, '🏖️ SAHİLE ÇIKTIN', '#fde047');
        } else {
          p.swimming = true;
          this.popup(p.x, p.y - 28, '🏊 DENİZE ATLADIN', '#38bdf8');
        }
        this.audio.splash();
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
      this.shopOpen = this.homeOpen = this.questOpen = this.helpOpen = this.bagOpen = this.gardenOpen = this.cafeOpen = this.officeOpen = this.busOpen = this.bankOpen = this.cookOpen = this.uniOpen = this.musicOpen = false;
      ['shopModal', 'homeModal', 'questModal', 'helpModal', 'bagModal', 'gardenModal', 'cafeModal', 'officeModal', 'busModal', 'bankModal', 'cookModal', 'uniModal', 'musicModal', 'interactPrompt'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
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
    toggleOffice(open) {
      this.closeAllModals();
      this.officeOpen = open;
      document.getElementById('officeModal').classList.toggle('hidden', !open);
      if (open) this.renderOfficeModal();
    }
    toggleBus(open, mode = 'bus') {
      this.closeAllModals();
      this.busOpen = open;
      this.busMode = mode;
      document.getElementById('busModal').classList.toggle('hidden', !open);
      if (open) this.renderBusModal();
    }
    toggleBank(open) {
      this.closeAllModals();
      this.bankOpen = open;
      document.getElementById('bankModal').classList.toggle('hidden', !open);
      if (open) this.renderBankModal();
    }
    toggleCook(open) {
      this.closeAllModals();
      this.cookOpen = open;
      document.getElementById('cookModal').classList.toggle('hidden', !open);
      if (open) this.renderCookModal();
    }
    toggleUni(open) {
      this.closeAllModals();
      this.uniOpen = open;
      if (!open) this.activeQuizIdx = null;
      document.getElementById('uniModal').classList.toggle('hidden', !open);
      if (open) this.renderUniModal();
    }
    toggleMusicModal(open) {
      this.closeAllModals();
      this.musicOpen = open;
      document.getElementById('musicModal').classList.toggle('hidden', !open);
      if (open) {
        this.renderMusicModal();
        this.completeStarterTask('st_tech');
      }
    }

    renderMusicModal() {
      const a = this.audio;
      const track = a.getCurrentTrack();
      const playing = a.musicOn && !a.muted;

      const eq = document.getElementById('musicEq');
      if (eq) eq.classList.toggle('paused', !playing);

      const titleEl = document.getElementById('musicNowTitle');
      if (titleEl) {
        const tName = YD.tr ? YD.tr(track.name) : track.name;
        titleEl.textContent = `${track.icon} ${tName} (${track.bpm} BPM)`;
      }

      const descEl = document.getElementById('musicNowDesc');
      if (descEl) {
        const modeTxt = a.station === 'auto' ? '🧭 Otomatik (Biyom / Gece / Görev)' : '📻 Sabit Radyo Kanalı';
        const mTr = YD.tr ? YD.tr(modeTxt) : modeTxt;
        const dTr = YD.tr ? YD.tr(track.desc) : track.desc;
        descEl.textContent = `${mTr} · ${dTr}`;
      }

      const playBtn = document.getElementById('btnToggleMusicPlay');
      if (playBtn) {
        const pTxt = a.musicOn ? '⏸ Duraklat' : '▶ Çal';
        playBtn.textContent = YD.tr ? YD.tr(pTxt) : pTxt;
      }

      const muteBtn = document.getElementById('btnToggleMuteAll');
      if (muteBtn) muteBtn.textContent = a.muted ? '🔇' : '🔊';

      const mv = Math.round(a.musicVol * 100);
      const av = Math.round(a.ambienceVol * 100);
      const sv = Math.round(a.sfxVol * 100);
      const sm = document.getElementById('sliderMusicVol');
      const sa = document.getElementById('sliderAmbVol');
      const ss = document.getElementById('sliderSfxVol');
      if (sm) sm.value = mv;
      if (sa) sa.value = av;
      if (ss) ss.value = sv;
      const vm = document.getElementById('valMusicVol');
      const va = document.getElementById('valAmbVol');
      const vs = document.getElementById('valSfxVol');
      if (vm) vm.textContent = `${mv}%`;
      if (va) va.textContent = `${av}%`;
      if (vs) vs.textContent = `${sv}%`;

      const grid = document.getElementById('musicStationGrid');
      if (!grid) return;
      const tracks = a.getTracks();
      const order = a.getTrackOrder();
      const onSelectStation = (stationId) => {
        this.audio.unlock();
        if (!this.audio.musicOn) this.audio.setMusicOn(true);
        if (this.audio.muted) this.audio.setMuted(false);
        this.audio.setStation(stationId);
        this.audio.uiClick();
        this.syncMusicButton();
        this.renderMusicModal();
      };
      const frag = document.createDocumentFragment();
      frag.appendChild(makeEl('button', {
        className: `station-btn full-span ${a.station === 'auto' ? 'active' : ''}`,
        dataset: { station: 'auto' },
        onClick: () => onSelectStation('auto')
      },
        makeEl('span', { className: 'station-ico' }, '🧭'),
        makeEl('div', { style: { minWidth: '0' } },
          makeEl('div', { className: 'station-name' }, 'Otomatik Dinamik Müzik (Önerilen)'),
          makeEl('div', { className: 'station-desc' }, 'Şehir, Orman, Sahil, Dağ, Ev İçi, Gece ve Barista/Kurye\'ye göre otomatik geçiş yapar')
        )
      ));
      for (const id of order) {
        const t = tracks[id];
        if (!t) continue;
        const isActive = a.station === id;
        const dTr = YD.tr ? YD.tr(t.desc) : t.desc;
        frag.appendChild(makeEl('button', {
          className: `station-btn ${isActive ? 'active' : ''}`,
          dataset: { station: t.id },
          onClick: () => onSelectStation(t.id)
        },
          makeEl('span', { className: 'station-ico' }, t.icon),
          makeEl('div', { style: { minWidth: '0' } },
            makeEl('div', { className: 'station-name' }, t.name),
            makeEl('div', { className: 'station-desc' }, `${t.bpm} BPM · ${dTr}`)
          )
        ));
      }
      grid.replaceChildren(frag);
    }

    renderOfficeModal() {
      const career = YD.getCareer(this.level);
      const bonusMult = (this.inventory.has('sisyphus') ? 1.4 : 1.0) * (this.uniCerts.has('cert_fin') ? 1.25 : 1.0);
      const evMult = this.dailyEventIdx === 2 ? 1.5 : 1.0;
      const shiftPay = Math.round((80 + this.level * 18) * career.bonus * bonusMult * evMult);
      const cb = document.getElementById('officeCareerBanner');
      if (cb) {
        const extra = `${this.uniCerts.has('cert_fin') ? ' · 📈 Finans Diploması (+%25)' : ''}${this.dailyEventIdx === 2 ? ' · 🔥 +%50 Bonus Günü!' : ''}`;
        cb.replaceChildren(
          makeTxt('💼 Unvan: '),
          makeEl('b', null, career.title),
          makeTxt(` (Maaş x${career.bonus})${extra}`)
        );
      }
      const grid = document.getElementById('officeActionsGrid');
      if (!grid) return;
      const frag = document.createDocumentFragment();
      frag.appendChild(makeEl('div', { className: 'shop-item' },
        makeEl('div', { style: { fontSize: '24px' } }, '💼'),
        makeEl('div', { style: { flex: '1', minWidth: '0' } },
          makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, 'Ofis Vardiyası Çalış'),
          makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, `+₺${shiftPay} · +30 XP · -22 Enerji`)
        ),
        makeEl('button', {
          id: 'btnOfficeShift',
          className: 'shop-buy-btn',
          onClick: () => {
            this.toggleOffice(false);
            this.doOfficeShift();
          }
        }, 'ÇALIŞ')
      ));
      frag.appendChild(makeEl('div', { className: 'shop-item' },
        makeEl('div', { style: { fontSize: '24px' } }, '📦'),
        makeEl('div', { style: { flex: '1', minWidth: '0' } },
          makeEl('div', { style: { fontWeight: '800', color: '#fde047' } }, 'Ekspres Kurye Teslimatı (45sn Yarış!)'),
          makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, 'Bisiklet veya Arabanla hedefe yetiş — +₺140–₺320 + Hız Bonusu!')
        ),
        makeEl('button', {
          id: 'btnStartDelivery',
          className: 'shop-buy-btn',
          disabled: this.delivery.active,
          onClick: this.delivery.active ? null : () => {
            this.toggleOffice(false);
            this.startDelivery();
          }
        }, this.delivery.active ? 'AKTİF' : 'BAŞLAT ▶')
      ));
      grid.replaceChildren(frag);
    }

    doOfficeShift() {
      const p = this.player;
      if (this.energy < 22) { this.say(p, 'Çok yorgunum, önce uyu veya kahve iç! 😴', 2.2); return; }
      const career = YD.getCareer(this.level);
      const bonusMult = (this.inventory.has('sisyphus') ? 1.4 : 1.0) * (this.uniCerts.has('cert_fin') ? 1.25 : 1.0);
      const evMult = this.dailyEventIdx === 2 ? 1.5 : 1.0;
      const pay = Math.round((80 + this.level * 18) * career.bonus * bonusMult * evMult);
      this.energy -= 22; this.hunger = Math.max(0, this.hunger - 14);
      this.timeMinutes += 120; this.money += pay; this.addXp(30);
      this.audio.coin();
      this.popup(p.x, p.y - 34, `+₺${pay} (${career.title}) 💼`, '#facc15');
      this.advanceQuest('q_work', 1);
      this.checkAchievements();
      this.saveGame();
    }

    startDelivery() {
      if (this.energy < 12) { this.say(this.player, 'Kurye teslimatı için biraz enerji lazım!', 2.2); return; }
      const tgt = YD.DELIVERY_TARGETS[Math.floor(Math.random() * YD.DELIVERY_TARGETS.length)];
      this.delivery = { active: true, target: tgt, timeLeft: 45 };
      this.energy -= 10;
      document.getElementById('deliveryBanner').classList.remove('hidden');
      this.audio.pickup();
      this.showToast(`📦 EKSPRES KURYE: ${tgt.name} noktasına 45 saniyede yetiş!`);
    }

    cancelDelivery(msg) {
      if (!this.delivery.active) return;
      this.delivery = { active: false, target: null, timeLeft: 0 };
      document.getElementById('deliveryBanner').classList.add('hidden');
      if (msg) this.showToast(`📦 ${msg}`);
    }

    completeDelivery() {
      const tgt = this.delivery.target;
      const speedBonus = Math.round(this.delivery.timeLeft * 2);
      const finMult = this.uniCerts.has('cert_fin') ? 1.25 : 1.0;
      const total = Math.round((tgt.reward + speedBonus) * finMult);
      this.delivery = { active: false, target: null, timeLeft: 0 };
      document.getElementById('deliveryBanner').classList.add('hidden');
      this.money += total;
      this.addXp(38);
      this.happiness = Math.min(100, this.happiness + 15);
      this.audio.levelUp();
      this.burst(this.player.x, this.player.y, '#fde047', 24);
      this.popup(this.player.x, this.player.y - 36, `📦 TESLİM EDİLDİ! +₺${total}`, '#4ade80');
      this.showToast(`📦 Ekspres Teslimat Tamamlandı! (+₺${total}, Hız Bonusu +₺${speedBonus})`);
      this.unlockAchievement('ach_courier');
      this.advanceQuest('q_delivery', 1);
      this.checkAchievements();
      this.saveGame();
    }

    renderBusModal() {
      const isTaxi = this.busMode === 'taxi';
      const fare = isTaxi ? 35 : 15;
      const titleEl = document.getElementById('busModalTitle');
      const subEl = document.getElementById('busModalSub');
      if (titleEl) {
        const rawT = isTaxi ? '🚕 ŞEHİR TAKSİSİ' : '🚏 HIZLI OTOBÜS SEYAHATİ';
        titleEl.textContent = YD.tr ? YD.tr(rawT) : rawT;
      }
      if (subEl) {
        if (isTaxi) {
          subEl.replaceChildren(
            makeTxt('Taksi ücreti '),
            makeEl('b', null, '₺35'),
            makeTxt('! Seçtiğin bölgeye kapıdan kapıya hızlıca bırakır.')
          );
        } else {
          subEl.replaceChildren(
            makeTxt('Bilet sadece '),
            makeEl('b', null, '₺15'),
            makeTxt('! Haritanın dört bir yanına anında git.')
          );
        }
      }

      const grid = document.getElementById('busStopGrid');
      if (!grid) return;
      const frag = document.createDocumentFragment();
      YD.BUS_STOPS.forEach((bs) => {
        const here = Math.hypot(this.player.x - bs.x, this.player.y - bs.y) < 120;
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '22px' } }, isTaxi ? '🚕' : '🚏'),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, bs.name),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, here ? 'Şu an bu bölgedesin' : (isTaxi ? 'Konforlu taksi yolculuğu' : 'Anında hızlı seyahat'))
          ),
          makeEl('button', {
            className: `shop-buy-btn ${here ? 'owned' : ''}`,
            dataset: { bus: bs.id },
            disabled: here,
            onClick: here ? null : () => this.travelToBusStop(bs.id)
          }, here ? 'BURADA' : `GİT ₺${fare}`)
        ));
      });
      grid.replaceChildren(frag);
    }

    travelToBusStop(stopId) {
      const bs = YD.BUS_STOPS.find((b) => b.id === stopId);
      if (!bs) return;
      const isTaxi = this.busMode === 'taxi';
      const fare = isTaxi ? 35 : 15;
      if (this.money < fare) { this.popup(this.player.x, this.player.y - 30, `Ücret ₺${fare}!`, '#ef4444'); return; }
      this.money -= fare;
      if (this.delivery.active) this.cancelDelivery(`${isTaxi ? 'Taksi' : 'Otobüs'} kullanıldığı için kurye görevi iptal edildi.`);
      this.player.inCar = false; this.player.onBike = false; this.player.inBoat = false; this.player.swimming = false;
      this.player.x = bs.spawnX; this.player.y = bs.spawnY;
      this.cam.x = bs.spawnX; this.cam.y = bs.spawnY;
      if (this.pet) { this.pet.x = bs.spawnX - 28; this.pet.y = bs.spawnY + 14; }
      this.timeMinutes += isTaxi ? 8 : 15;
      if (isTaxi) this.audio.carHorn(1.18, true, 0.9);
      else this.audio.bikeBell();
      this.burst(bs.spawnX, bs.spawnY, '#fde047', 18);
      this.toggleBus(false);
      this.showToast(`${isTaxi ? '🚕 Taksi ile' : '🚏'} ${bs.name} noktasına ulaştın! (-₺${fare})`);
      this.saveGame();
    }

    renderBankModal() {
      const rate = this.uniCerts.has('cert_fin') ? 0.12 : 0.08;
      const pctTxt = this.uniCerts.has('cert_fin') ? '%12' : '%8';
      const banner = document.getElementById('bankBalanceBanner');
      if (banner) {
        const estInterest = Math.floor(this.bankBalance * rate);
        banner.replaceChildren(
          makeTxt('💵 Cüzdan: '),
          makeEl('b', null, `₺${Math.floor(this.money).toLocaleString()}`),
          makeTxt(' · 🏦 Banka: '),
          makeEl('b', { style: { color: '#4ade80' } }, `₺${Math.floor(this.bankBalance).toLocaleString()}`),
          makeTxt(' '),
          makeEl('span', { style: { color: '#fde047' } }, `(+₺${estInterest}/gün ${pctTxt} faiz)`)
        );
      }
      const grid = document.getElementById('bankActionsGrid');
      if (!grid) return;
      const acts = [
        { id: 'dep_50',  ico: '📥', title: '₺50 Yatır',        sub: `Birikimine günlük ${pctTxt} faiz işler`, dis: this.money < 50 },
        { id: 'dep_200', ico: '💰', title: '₺200 Yatır',       sub: 'Hızlı tasarruf + yüksek günlük faiz',   dis: this.money < 200 },
        { id: 'dep_all', ico: '🏦', title: 'Tüm Nakti Yatır',  sub: `₺${Math.floor(this.money)} hesaba aktar`, dis: this.money < 10 },
        { id: 'wdr_50',  ico: '📤', title: '₺50 Çek',          sub: 'Cüzdanına anında nakit al',             dis: this.bankBalance < 50 },
        { id: 'wdr_all', ico: '💵', title: 'Hepsini Çek',      sub: `₺${Math.floor(this.bankBalance)} cüzdana aktar`, dis: this.bankBalance < 1 }
      ];
      const frag = document.createDocumentFragment();
      acts.forEach((a) => {
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '22px' } }, a.ico),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, a.title),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, a.sub)
          ),
          makeEl('button', {
            className: 'shop-buy-btn',
            dataset: { bank: a.id },
            disabled: a.dis,
            style: a.dis ? { opacity: '0.38', cursor: 'not-allowed', filter: 'grayscale(0.7)' } : null,
            onClick: a.dis ? null : () => {
              const act = a.id;
              if (act === 'dep_50' && this.money >= 50) { this.money -= 50; this.bankBalance += 50; }
              else if (act === 'dep_200' && this.money >= 200) { this.money -= 200; this.bankBalance += 200; }
              else if (act === 'dep_all' && this.money >= 10) { const amt = Math.floor(this.money); this.money -= amt; this.bankBalance += amt; }
              else if (act === 'wdr_50' && this.bankBalance >= 50) { this.bankBalance -= 50; this.money += 50; }
              else if (act === 'wdr_all' && this.bankBalance >= 1) { const amt = Math.floor(this.bankBalance); this.bankBalance -= amt; this.money += amt; }
              this.audio.cashRegister();
              this.checkAchievements();
              this.renderBankModal();
              this.saveGame();
            }
          }, 'UYGULA')
        ));
      });
      grid.replaceChildren(frag);
    }

    renderCookModal() {
      const banner = document.getElementById('cookStatusBanner');
      const culBonus = this.uniCerts.has('cert_culinary');
      if (banner) {
        banner.replaceChildren(
          makeTxt('🧺 Malzemelerin: 🐟 '),
          makeEl('b', null, this.bag.fish || 0),
          makeTxt(' · 🍅 '),
          makeEl('b', null, this.bag.tomato || 0),
          makeTxt(' · 🍄 '),
          makeEl('b', null, this.bag.mushroom || 0),
          makeTxt(' · 🍓Böğürtlen '),
          makeEl('b', null, this.bag.berry || 0),
          makeTxt(' · 🍓Çilek '),
          makeEl('b', null, this.bag.strawberry || 0),
          makeTxt(culBonus ? ' · 👨‍🍳 +35% Şef Bonusu' : '')
        );
      }
      const grid = document.getElementById('cookRecipesGrid');
      if (!grid) return;
      const frag = document.createDocumentFragment();
      YD.RECIPES.forEach((r) => {
        const canCook = Object.entries(r.ingredients).every(([k, need]) => (this.bag[k] || 0) >= need);
        const haveQty = this.bag[r.id] || 0;
        const sellVal = Math.round(r.sell * (culBonus ? 1.35 : 1.0));
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, r.icon),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } },
              `${r.name} `,
              haveQty > 0 ? makeEl('span', { style: { color: '#fde047' } }, `(Çantada: x${haveQty})`) : null
            ),
            makeEl('div', { style: { fontSize: '11px', color: '#cbd5e1' } },
              'Gereken: ',
              makeEl('b', null, r.ingText)
            ),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } },
              `+${r.hunger} Tokluk · +${r.energy} Enerji · +${r.health} Sağlık · Satış: ₺${sellVal}`
            )
          ),
          makeEl('div', { className: 'btn-row' },
            haveQty > 0 ? makeEl('button', {
              className: 'hud-btn',
              dataset: { cookEat: r.id },
              onClick: () => {
                const info = YD.BAG_ITEMS[r.id];
                if (!info || !this.bag[r.id]) return;
                this.bag[r.id]--;
                this.hunger = Math.min(100, this.hunger + info.hunger);
                this.energy = Math.min(100, this.energy + info.energy);
                this.health = Math.min(100, this.health + info.health);
                this.happiness = Math.min(100, this.happiness + 18);
                this.audio.pickup();
                this.showToast(`🍽️ ${info.icon} ${info.name} afiyetle yendi! (+${info.hunger} Tokluk, +${info.energy} Enerji)`);
                this.renderCookModal();
                this.saveGame();
              }
            }, 'YE 🍽️') : null,
            makeEl('button', {
              className: 'shop-buy-btn',
              dataset: { cook: r.id },
              disabled: !canCook,
              style: !canCook ? { opacity: '0.38', cursor: 'not-allowed', filter: 'grayscale(0.7)' } : null,
              onClick: !canCook ? null : () => {
                for (const [k, need] of Object.entries(r.ingredients)) {
                  if ((this.bag[k] || 0) < need) return;
                }
                for (const [k, need] of Object.entries(r.ingredients)) {
                  this.bag[k] -= need;
                }
                this.bag[r.id] = (this.bag[r.id] || 0) + 1;
                this.happiness = Math.min(100, this.happiness + 12);
                this.addXp(r.xp);
                this.audio.cookSizzle();
                this.showToast(`🍳 ${r.icon} ${r.name} pişti! (+${r.xp} XP — Çantana eklendi)`);
                this.unlockAchievement('ach_chef');
                this.advanceQuest('q_cook', 1);
                this.checkAchievements();
                this.renderCookModal();
                this.saveGame();
              }
            }, 'PİŞİR 🍳')
          )
        ));
      });
      grid.replaceChildren(frag);
    }

    renderUniModal() {
      const banner = document.getElementById('uniStatusBanner');
      if (banner) {
        banner.replaceChildren(
          makeTxt('🎓 Akademik Diplomalar: '),
          makeEl('b', null, `${this.uniCerts.size}/${YD.UNI_CERTS.length}`),
          makeTxt(' · 🧠 Günlük Burs Sınavı: '),
          makeEl('b', null, this.quizDoneToday ? 'Tamamlandı ✓' : 'Hazır (+₺150 Burs!)')
        );
      }
      const qBox = document.getElementById('uniQuizBox');
      if (qBox) {
        if (this.activeQuizIdx !== null && YD.UNI_QUIZ[this.activeQuizIdx]) {
          const q = YD.UNI_QUIZ[this.activeQuizIdx];
          qBox.classList.remove('hidden');
          const optsGrid = makeEl('div', { className: 'shop-grid' });
          q.opts.forEach((opt, idx) => {
            optsGrid.appendChild(makeEl('button', {
              className: 'hud-btn',
              style: { textAlign: 'left' },
              dataset: { quizAns: String(idx) },
              onClick: () => {
                if (idx === q.ans) {
                  this.quizDoneToday = true;
                  this.activeQuizIdx = null;
                  this.money += 150;
                  this.addXp(55);
                  this.happiness = Math.min(100, this.happiness + 18);
                  this.audio.levelUp();
                  this.showToast('🎓 TEBRİKLER! Doğru cevap — +₺150 Akademik Burs & +55 XP kazandın!');
                  this.advanceQuest('q_uni', 1);
                  this.checkAchievements();
                  this.renderUniModal();
                  this.saveGame();
                } else {
                  this.audio.miss();
                  this.activeQuizIdx = (this.activeQuizIdx + 1) % YD.UNI_QUIZ.length;
                  this.showToast('❌ Yanlış cevap! Yeni soruyu dikkatlice oku.');
                  this.renderUniModal();
                }
              }
            }, makeEl('b', null, `${['A', 'B', 'C'][idx]})`), ` ${opt}`));
          });
          qBox.replaceChildren(
            makeEl('div', { style: { fontSize: '12px', color: '#fde047', marginBottom: '8px' } },
              '🧠 ',
              makeEl('b', null, 'BURS SINAVI SORUSU:'),
              ` ${q.q}`
            ),
            optsGrid
          );
        } else {
          qBox.classList.add('hidden');
        }
      }

      const grid = document.getElementById('uniActionsGrid');
      if (!grid) return;
      const bonusMult = this.inventory.has('sisyphus') ? 1.4 : 1.0;
      const studyXp = Math.round(50 * bonusMult);
      const frag = document.createDocumentFragment();
      frag.appendChild(makeEl('div', { className: 'shop-item' },
        makeEl('div', { style: { fontSize: '24px' } }, '📚'),
        makeEl('div', { style: { flex: '1', minWidth: '0' } },
          makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, 'Akademik Ders & Araştırma'),
          makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, `+${studyXp} XP · +12 Mutluluk · -18 Enerji`)
        ),
        makeEl('button', {
          id: 'btnUniStudy',
          className: 'shop-buy-btn',
          onClick: () => {
            if (this.energy < 18) { this.popup(this.player.x, this.player.y - 34, 'Çok yorgunsun, dinlen!', '#ef4444'); return; }
            this.energy -= 18;
            this.timeMinutes += 90;
            this.happiness = Math.min(100, this.happiness + 12);
            this.addXp(studyXp);
            this.audio.pickup();
            this.popup(this.player.x, this.player.y - 34, `🎓 +${studyXp} BİLGİ XP!`, '#38bdf8');
            this.toggleUni(false);
            this.saveGame();
          }
        }, 'ÇALIŞ')
      ));
      frag.appendChild(makeEl('div', { className: 'shop-item' },
        makeEl('div', { style: { fontSize: '24px' } }, '🧠'),
        makeEl('div', { style: { flex: '1', minWidth: '0' } },
          makeEl('div', { style: { fontWeight: '800', color: '#fde047' } }, 'Günlük Akademik Burs Sınavı'),
          makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, 'Soruyu doğru bil, anında +₺150 Burs ve +55 XP kazan!')
        ),
        makeEl('button', {
          id: 'btnUniQuiz',
          className: `shop-buy-btn ${this.quizDoneToday ? 'owned' : ''}`,
          disabled: this.quizDoneToday,
          onClick: this.quizDoneToday ? null : () => {
            this.activeQuizIdx = Math.floor(Math.random() * YD.UNI_QUIZ.length);
            this.audio.uiClick();
            this.renderUniModal();
          }
        }, this.quizDoneToday ? 'GEÇİLDİ ✓' : 'SINAVA GİR ▶')
      ));

      for (const c of YD.UNI_CERTS) {
        const owned = this.uniCerts.has(c.id);
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, c.icon),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, c.name),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, c.desc)
          ),
          makeEl('button', {
            className: `shop-buy-btn ${owned ? 'owned' : ''}`,
            dataset: { cert: c.id },
            disabled: owned,
            onClick: owned ? null : () => {
              if (this.money < c.price) { this.popup(this.player.x, this.player.y - 34, `₺${c.price} gerekiyor!`, '#ef4444'); return; }
              this.money -= c.price;
              this.uniCerts.add(c.id);
              this.addXp(45);
              this.audio.levelUp();
              this.showToast(`🎓 DİPLOMA ALINDI: ${c.icon} ${c.name}!`);
              this.advanceQuest('q_uni', 1);
              this.checkAchievements();
              this.renderUniModal();
              this.saveGame();
            }
          }, owned ? 'ALINDI ✓' : `₺${c.price}`)
        ));
      }
      grid.replaceChildren(frag);
    }

    snapPhoto() {
      if (!this.started || this.hasOpenModal() || this.cameraCd > 0) return;
      this.cameraCd = 1.4;
      this.cameraFlash = 1.0;
      this.audio.cameraShutter();

      if (this.scene === 'home') {
        const hp = this.homePlayer;
        this.lastPhotoLabel = `🏠 ${this.playerName} Evi Hatırası`;
        this.happiness = Math.min(100, this.happiness + 10);
        this.addXp(8);
        this.popup(hp.x, hp.y - 28, '📸 EV HATIRASI! +8 XP', '#fde047');
        return;
      }

      const p = this.player;
      // 1) Check if near one of the 8 iconic PHOTO_SPOTS
      for (const sp of YD.PHOTO_SPOTS) {
        if (Math.hypot(p.x - sp.x, p.y - sp.y) <= sp.r) {
          const isNew = !this.photosTaken.has(sp.id);
          this.photosTaken.add(sp.id);
          this.lastPhotoLabel = `${sp.name} (${this.photosTaken.size}/${YD.PHOTO_SPOTS.length})`;
          if (isNew) {
            this.money += sp.reward;
            this.addXp(sp.xp);
            this.happiness = Math.min(100, this.happiness + 18);
            this.burst(p.x, p.y, '#fde047', 18);
            this.popup(p.x, p.y - 38, `📸 YENİ MANZARA! +₺${sp.reward} Telif & +${sp.xp} XP`, '#fde047');
            this.showToast(`📸 Manzara Albümü (${this.photosTaken.size}/${YD.PHOTO_SPOTS.length}): ${sp.name} (+₺${sp.reward})`);
            this.advanceQuest('q_photo', 1);
            this.checkAchievements();
            this.saveGame();
          } else {
            this.happiness = Math.min(100, this.happiness + 10);
            this.addXp(10);
            this.popup(p.x, p.y - 36, `📸 ${sp.name} (+10 XP)`, '#38bdf8');
          }
          return;
        }
      }

      // 2) Check if photographing a cute stray cat/dog or forest deer/rabbit!
      for (const st of [...(this.world.strays || []), ...(this.world.wildlife || [])]) {
        if (Math.hypot(p.x - st.x, p.y - st.y) < 130) {
          const animalPhotoId = `ph_${st.id}`;
          const isNew = !this.photosTaken.has(animalPhotoId);
          this.photosTaken.add(animalPhotoId);
          this.lastPhotoLabel = `🐾 ${st.name} Portresi`;
          if (isNew) {
            this.money += 35;
            this.addXp(22);
            this.happiness = Math.min(100, this.happiness + 15);
            this.popup(p.x, p.y - 36, `📸 ${st.name.toUpperCase()} FOTOĞRAFI! +₺35 & +22 XP`, '#f472b6');
            this.advanceQuest('q_photo', 1);
            this.checkAchievements();
            this.saveGame();
          } else {
            this.addXp(8);
            this.popup(p.x, p.y - 34, `📸 Tatlı ${st.name}! +8 XP`, '#f9a8d4');
          }
          return;
        }
      }

      // 3) General open-world snapshot
      const biome = this.world.getBiome(p.x, p.y);
      this.lastPhotoLabel = `${this.world.getBiomeLabel(biome)} (Albüm: ${this.photosTaken.size}/${YD.PHOTO_SPOTS.length})`;
      this.happiness = Math.min(100, this.happiness + 8);
      this.addXp(8);
      this.popup(p.x, p.y - 34, '📸 FOTOĞRAF ÇEKİLDİ! +8 XP', '#fde047');
    }

    honkPlayerHorn() {
      const p = this.player;
      this.audio.carHorn(1.0, false, 1.0);
      this.popup(p.x, p.y - 34, 'DÜÜT! 📣🚗', '#fde047');
      // Nearby traffic cars playfully honk back!
      let replied = false;
      for (const c of this.world.cars) {
        const d = Math.hypot(c.x - p.x, c.y - p.y);
        if (d < 340 && !replied) {
          replied = true;
          c.hornFlash = 0.55;
          setTimeout(() => {
            if (!this.started) return;
            this.audio.carHorn(c.hornPitch || 1.15, true, Math.max(0.35, 1 - d / 420));
            this.popup(c.x, c.y - 26, c.isTaxi ? 'BİP BİP! 🚕' : 'DÜT DÜT! 📣', '#fef08a');
          }, 260);
        }
      }
      // Nearby NPCs react to your horn!
      const reactions = ['Hey yavaş sür! 😅', 'Güzel araba! 🚗✨', 'Dikkat et dostum! 👋', 'Selam! 📣'];
      for (const npc of this.npcs) {
        if (Math.hypot(npc.x - p.x, npc.y - p.y) < 220 && npc.speechTimer <= 0) {
          this.say(npc, reactions[Math.floor(Math.random() * reactions.length)], 2.2);
        }
      }
    }

    handleCarHonk(car, reason, dist) {
      if (!this.started || this.scene !== 'world') return;
      const volScale = Math.max(0.22, 1 - dist / 560);
      this.audio.carHorn(car.hornPitch || 1.0, car.isTaxi || reason === 'warn', volScale);
      const label = reason === 'warn'
        ? (car.isTaxi ? 'BİP BİP! YOLDAN ÇEKİL! 🚕' : 'DÜÜÜT! DİKKAT! 📣')
        : (car.isTaxi ? 'BİP BİP! 🚕' : 'DÜT! 📣');
      this.popup(car.x, car.y - 26, label, reason === 'warn' ? '#fb923c' : '#fef08a');
    }

    renderGardenModal() {
      const grid = document.getElementById('gardenSeedGrid');
      if (!grid) return;
      const frag = document.createDocumentFragment();
      Object.values(YD.CROPS).forEach((c) => {
        const subText = `Büyüme: ~${c.growSec}sn · Satış: ₺${c.sell}${c.xp ? ` · +${c.xp} XP` : ''}`;
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, c.icon),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, `${c.name} Tohumu`),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, subText)
          ),
          makeEl('button', {
            className: 'shop-buy-btn',
            dataset: { seed: c.id },
            onClick: () => this.plantSeed(c.id)
          }, `EK ₺${c.seedPrice}`)
        ));
      });
      grid.replaceChildren(frag);
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
      this.completeStarterTask('st_garden');
      this.toggleGarden(false);
      this.saveGame();
    }

    renderCafeModal() {
      const title = document.getElementById('cafeModalTitle');
      const banner = document.getElementById('cafeStatusBanner');
      const grid = document.getElementById('cafeActionsGrid');
      if (!grid) return;

      const onDrink = () => {
        const cost = this.ownsCafe ? 0 : 25;
        if (this.money < cost) { this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444'); return; }
        this.money -= cost;
        this.energy = Math.min(100, this.energy + 35);
        this.hunger = Math.min(100, this.hunger + 35);
        this.happiness = Math.min(100, this.happiness + 18);
        this.audio.pickup();
        this.popup(this.player.x, this.player.y - 34, this.ownsCafe ? '☕ Patron İkramı! +Enerji' : '☕ Latte & Simit! +Enerji', '#fb923c');
        this.completeStarterTask('st_campus');
        this.toggleCafe(false);
        this.saveGame();
      };

      const frag = document.createDocumentFragment();
      if (this.ownsCafe) {
        if (title) title.textContent = YD.tr ? YD.tr(`⭐ ${this.playerName.toUpperCase()} KAFE`) : `⭐ ${this.playerName.toUpperCase()} KAFE`;
        if (banner) {
          banner.replaceChildren(
            makeTxt('☕ '),
            makeEl('b', null, 'Kafe Sahibi Sensin!'),
            makeTxt(' · Her sabah pasif gelir: '),
            makeEl('b', null, '+₺95–145'),
            makeTxt(' · Toplam Kazanç: '),
            makeEl('b', null, `₺${this.cafeTotalEarned}`)
          );
        }
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, '🔥'),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#fde047' } }, 'Barista Vardiyası (25sn Mini-Oyun)'),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, '[1-4] tuşlarıyla siparişleri yetiştir, kombo yap, dev bahşiş topla!')
          ),
          makeEl('button', {
            id: 'btnStartBarista',
            className: 'shop-buy-btn',
            onClick: () => {
              this.toggleCafe(false);
              this.startBaristaShift();
            }
          }, 'BAŞLAT ▶')
        ));
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, '☕'),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, 'Patronun Özel Lattesi'),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, 'Kendi kafenden ücretsiz taze kahve & kruvasan! (+35 Enerji, +35 Tokluk)')
          ),
          makeEl('button', {
            id: 'btnCafeDrink',
            className: 'shop-buy-btn',
            onClick: onDrink
          }, 'ÜCRETSİZ')
        ));
      } else {
        if (title) title.textContent = YD.tr ? YD.tr('☕ KAFE & FIRIN') : '☕ KAFE & FIRIN';
        if (banner) {
          banner.replaceChildren(
            makeTxt('☕ Sıcak kahve iç veya '),
            makeEl('b', null, `₺${YD.CAFE_PRICE}`),
            makeTxt(' biriktirip bu kafeyi satın al!')
          );
        }
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, '☕'),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, 'Latte & Sıcak Simit'),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, '+35 Enerji · +35 Tokluk · +18 Mutluluk')
          ),
          makeEl('button', {
            id: 'btnCafeDrink',
            className: 'shop-buy-btn',
            onClick: onDrink
          }, '₺25')
        ));
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, '⭐'),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#fde047' } }, 'Kafeyi Satın Al & Patron Ol!'),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, 'Adın tabelaya yazılır, her gün pasif gelir + Barista Mini-Oyunu açılır!')
          ),
          makeEl('button', {
            id: 'btnBuyCafe',
            className: 'shop-buy-btn',
            onClick: () => {
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
            }
          }, `₺${YD.CAFE_PRICE}`)
        ));
      }
      grid.replaceChildren(frag);
    }

    startBaristaShift() {
      if (this.energy < 15) {
        this.say(this.player, 'Barista vardiyası için biraz enerji lazım! ☕', 2.2);
        return;
      }
      this.clearAllKeys();
      document.getElementById('interactPrompt').classList.add('hidden');
      this.barista = { active: true, timeLeft: 25, score: 0, combo: 1, served: 0, order: null, patience: 4.5, maxPatience: 4.5 };
      const btns = document.getElementById('baristaBtns');
      if (btns) {
        const frag = document.createDocumentFragment();
        YD.CAFE_ORDERS.forEach((o) => {
          frag.appendChild(makeEl('button', {
            className: 'barista-serve-btn',
            dataset: { serve: o.id },
            onClick: () => this.serveBarista(o.id)
          }, makeEl('kbd', null, o.key), ` ${o.icon} ${o.name}`));
        });
        btns.replaceChildren(frag);
      }
      this.nextBaristaOrder();
      document.getElementById('baristaWrap').classList.remove('hidden');
      this.audio.pickup();
    }

    nextBaristaOrder() {
      const pick = YD.CAFE_ORDERS[Math.floor(Math.random() * YD.CAFE_ORDERS.length)];
      this.barista.order = pick;
      const culMult = this.uniCerts.has('cert_culinary') ? 1.25 : 1.0;
      this.barista.maxPatience = Math.max(2.3, 4.4 - this.barista.served * 0.12) * culMult;
      this.barista.patience = this.barista.maxPatience;
      document.getElementById('baristaOrderIcon').textContent = pick.icon;
      document.getElementById('baristaOrderName').textContent = YD.tr ? YD.tr(`[${pick.key}] ${pick.name}`) : `[${pick.key}] ${pick.name}`;
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
      document.getElementById('baristaScore').textContent = YD.fmtMoney ? YD.fmtMoney(this.barista.score) : `₺${this.barista.score}`;
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
      this.player.swimming = false;
      this.player.inBoat = false;
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
      this.showToast('🏠 Evine Hoş Geldin! Odada gez, [E] ile mutfak/eşyaları kullan veya [ESC] ile çık.');
      this.completeStarterTask('st_home');
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
      } else if (k === 'kitchen') {
        this.toggleCook(true);
        return;
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

      if (this.autoPilot.active && !this.isManualMoveHeld()) {
        this.updateHomeAutoPilot(dt);
      } else {
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
      }

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
      const agriMult = this.uniCerts.has('cert_agri') ? 1.4 : 1.0;
      this.world.update(dt, this.player, null, YD.WEATHERS[this.weatherIdx].id, null, true, agriMult);

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

    getBagSellValue(k) {
      const info = YD.BAG_ITEMS[k];
      if (!info) return 0;
      let mult = 1.0;
      if (k === 'crystal' && this.dailyEventIdx === 3) mult *= 1.6;
      if (['tomato', 'strawberry', 'sunflower', 'berry', 'mushroom'].includes(k) && this.uniCerts.has('cert_agri')) mult *= 1.35;
      if (['grilled', 'soup', 'pie', 'feast'].includes(k) && this.uniCerts.has('cert_culinary')) mult *= 1.35;
      return Math.round(info.sell * mult);
    }

    renderBag() {
      const grid = document.getElementById('bagGrid');
      if (!grid) return;
      const nearFire = Math.hypot(this.player.x - this.world.campfire.x, this.player.y - this.world.campfire.y) < 110;
      const keys = Object.keys(YD.BAG_ITEMS).filter((k) => (this.bag[k] || 0) > 0);
      if (keys.length === 0) {
        grid.replaceChildren(makeEl(
          'div',
          { className: 'shop-item', style: { justifyContent: 'center', color: '#94a3b8' } },
          'Çantan boş! Ormandan böğürtlen, dağdan kristal, bahçenden ürün veya iskeleden balık topla!'
        ));
        return;
      }
      const frag = document.createDocumentFragment();
      keys.forEach((k) => {
        const info = YD.BAG_ITEMS[k];
        const qty = this.bag[k];
        const sellVal = this.getBagSellValue(k);
        const statText = k === 'petfood'
          ? 'Sokak & orman hayvanlarını [E] ile besle!'
          : `${info.hunger > 0 ? `+${info.hunger} Tokluk ` : ''}${info.energy > 0 ? `+${info.energy} Enerji` : ''}`;
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, info.icon),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800' } },
              `${info.name} `,
              makeEl('span', { style: { color: '#fde047' } }, `x${qty}`)
            ),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, statText)
          ),
          makeEl('div', { className: 'btn-row' },
            info.hunger > 0 ? makeEl('button', {
              className: 'hud-btn',
              dataset: { eat: k },
              onClick: () => {
                if (!this.bag[k]) return;
                this.bag[k]--;
                this.hunger = Math.min(100, this.hunger + info.hunger);
                this.health = Math.min(100, this.health + info.health);
                this.energy = Math.min(100, this.energy + info.energy);
                this.audio.pickup();
                this.renderBag(); this.saveGame();
              }
            }, 'YE') : null,
            (k === 'fish' && nearFire) ? makeEl('button', {
              className: 'hud-btn gold',
              dataset: { grill: 'fish' },
              onClick: () => {
                if (!this.bag.fish) return;
                this.bag.fish--; this.bag.grilled = (this.bag.grilled || 0) + 1;
                this.audio.cookSizzle(); this.showToast('🔥 Izgara Balık pişti! (+65 Tokluk)');
                this.unlockAchievement('ach_chef');
                this.advanceQuest('q_cook', 1);
                this.renderBag(); this.saveGame();
              }
            }, '🔥 PİŞİR') : null,
            makeEl('button', {
              className: 'shop-buy-btn',
              dataset: { sell: k },
              onClick: () => {
                if (!this.bag[k]) return;
                const val = this.getBagSellValue(k);
                this.bag[k]--; this.money += val;
                this.audio.coin(); this.checkAchievements();
                this.renderBag(); this.saveGame();
              }
            }, `SAT ₺${sellVal}`)
          )
        ));
      });
      grid.replaceChildren(frag);
    }

    renderShop() {
      const grid = document.getElementById('shopGrid');
      if (!grid) return;
      const frag = document.createDocumentFragment();
      YD.SHOP_ITEMS.forEach((item) => {
        const owned = !item.consumable && this.inventory.has(item.id);
        const countBadge = item.consumable ? ` (Çantada: ${this.bag[item.id] || 0})` : '';
        frag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '24px' } }, item.icon),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, `${item.name}${countBadge}`),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, item.desc)
          ),
          makeEl('button', {
            className: `shop-buy-btn ${owned ? 'owned' : ''}`,
            dataset: { item: item.id },
            disabled: owned,
            onClick: owned ? null : () => {
              if (this.money < item.price) { this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444'); return; }
              this.money -= item.price;
              if (item.consumable) {
                this.bag[item.id] = (this.bag[item.id] || 0) + 5;
                this.popup(this.player.x, this.player.y - 34, `${item.icon} +5 ${item.name} Çantada!`, '#4ade80');
              } else {
                this.inventory.add(item.id);
                this.syncPetFromInventory(item.id === 'pet_dog' ? 'dog' : (item.id === 'pet_cat' ? 'cat' : null));
                this.popup(this.player.x, this.player.y - 34, `${item.icon} ${item.name} ALINDI!`, '#4ade80');
              }
              this.audio.coin();
              this.completeStarterTask('st_shop');
              this.checkAchievements();
              this.renderShop(); this.saveGame();
            }
          }, owned ? 'ALINDI ✓' : `₺${item.price}`)
        ));
      });
      grid.replaceChildren(frag);
    }

    renderHomeModal() {
      const preview = document.getElementById('homeRoomPreview');
      if (preview) {
        const pFrag = document.createDocumentFragment();
        pFrag.appendChild(makeEl('div', { className: 'room-slot' }, '🛏️ Yatak'));
        YD.HOME_DECOR.forEach((d) => {
          pFrag.appendChild(makeEl(
            'div',
            { className: `room-slot ${this.homeDecor.has(d.id) ? 'unlocked' : 'locked'}` },
            `${d.icon} ${d.name}`
          ));
        });
        preview.replaceChildren(pFrag);
      }
      const acts = document.getElementById('homeActionsRow');
      if (acts) {
        const aFrag = document.createDocumentFragment();
        if (this.homeDecor.has('pc_desk')) {
          aFrag.appendChild(makeEl('button', {
            className: 'hud-btn gold',
            id: 'actRemoteWork',
            onClick: () => {
              if (this.energy < 18) { this.popup(this.player.x, this.player.y - 30, 'Çok yorgunsun, uyu!', '#ef4444'); return; }
              this.energy -= 18; this.money += 95; this.addXp(22); this.timeMinutes += 75;
              this.audio.coin(); this.popup(this.player.x, this.player.y - 34, '🖥️ Remote İş! +₺95', '#4ade80');
              this.advanceQuest('q_work', 1); this.checkAchievements(); this.saveGame();
            }
          }, '🖥️ Evden Çalış (+₺95)'));
        }
        if (this.homeDecor.has('sofa_tv')) {
          aFrag.appendChild(makeEl('button', {
            className: 'hud-btn',
            id: 'actWatchTv',
            onClick: () => {
              this.happiness = Math.min(100, this.happiness + 35); this.energy = Math.min(100, this.energy + 15);
              this.timeMinutes += 45; this.audio.pickup();
              this.popup(this.player.x, this.player.y - 34, '🛋️ Süper Film! +35 Mutluluk', '#38bdf8');
              this.saveGame();
            }
          }, '🛋️ Film Molası (+35 Mutluluk)'));
        }
        if (this.homeDecor.has('guitar')) {
          aFrag.appendChild(makeEl('button', {
            className: 'hud-btn',
            id: 'actPlayGuitar',
            onClick: () => {
              this.happiness = Math.min(100, this.happiness + 25); this.addXp(10);
              this.audio.guitar();
              this.popup(this.player.x, this.player.y - 34, '🎸 Akustik Ritim! +25 Mutluluk', '#facc15');
              this.saveGame();
            }
          }, '🎸 Gitar Çal (+25 Mutluluk)'));
        }
        acts.replaceChildren(aFrag);
      }

      const grid = document.getElementById('homeDecorGrid');
      if (!grid) return;
      const dFrag = document.createDocumentFragment();
      YD.HOME_DECOR.forEach((d) => {
        const owned = this.homeDecor.has(d.id);
        dFrag.appendChild(makeEl('div', { className: 'shop-item' },
          makeEl('div', { style: { fontSize: '22px' } }, d.icon),
          makeEl('div', { style: { flex: '1', minWidth: '0' } },
            makeEl('div', { style: { fontWeight: '800', color: '#f8fafc' } }, d.name),
            makeEl('div', { style: { fontSize: '11px', color: '#94a3b8' } }, d.desc)
          ),
          makeEl('button', {
            className: `shop-buy-btn ${owned ? 'owned' : ''}`,
            dataset: { decor: d.id },
            disabled: owned,
            onClick: owned ? null : () => {
              if (this.money < d.price) { this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444'); return; }
              this.money -= d.price; this.homeDecor.add(d.id);
              this.happiness = Math.min(100, this.happiness + 15);
              this.audio.coin(); this.checkAchievements();
              this.renderHomeModal(); this.saveGame();
            }
          }, owned ? 'ODADA ✓' : `₺${d.price}`)
        ));
      });
      grid.replaceChildren(dFrag);
    }

    renderQuests() {
      const career = YD.getCareer(this.level);
      const ev = YD.DAILY_EVENTS[this.dailyEventIdx];
      const cb = document.getElementById('careerBanner');
      if (cb) {
        cb.replaceChildren(
          makeTxt('👤 '),
          makeEl('b', null, this.playerName),
          makeTxt(' · 💼 '),
          makeEl('b', null, career.title),
          makeTxt(` (Maaş x${career.bonus}) · ${ev.icon} `),
          makeEl('b', null, ev.name)
        );
      }
      const box = document.getElementById('questList');
      if (box) {
        const qFrag = document.createDocumentFragment();
        YD.QUESTS.forEach((q) => {
          const done = this.questDone.has(q.id);
          const cur = Math.min(q.target, this.questProgress[q.id] || 0);
          qFrag.appendChild(makeEl('div', { className: `quest-row ${done ? 'done' : ''}` },
            makeEl('span', null, `${done ? '✅' : '⬜'} ${q.title}`),
            makeEl('b', null, `${cur}/${q.target}`)
          ));
        });
        box.replaceChildren(qFrag);
      }
      const ach = document.getElementById('achGrid');
      if (ach) {
        const aFrag = document.createDocumentFragment();
        YD.ACHIEVEMENTS.forEach((a) => {
          const ok = this.achievements.has(a.id);
          aFrag.appendChild(makeEl('div', { className: `ach-card ${ok ? 'unlocked' : ''}` },
            makeEl('b', null, `${a.icon} ${a.name}`),
            makeEl('br'),
            `${a.desc}${ok ? ' ✓' : ''}`
          ));
        });
        ach.replaceChildren(aFrag);
      }
    }

    startFishing() {
      if (this.energy < 10) { this.say(this.player, 'Olta sallayacak enerjin kalmadı!', 2.0); return; }
      this.clearAllKeys();
      document.getElementById('interactPrompt').classList.add('hidden');
      this.fishing.active = true;
      this.fishing.pos = 0.05; this.fishing.dir = 1;
      this.fishing.speed = this.inventory.has('rod') ? 1.25 : 1.65;
      document.getElementById('fishSweetZone').style.width = this.inventory.has('rod') ? '24%' : '15%';
      document.getElementById('fishingBarWrap').classList.remove('hidden');
      this.audio.splash();
      this.completeStarterTask('st_fish');
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
      // 1) Friendly Street Cats & Dogs!
      if (!p.inCar && !p.inBoat && this.world.strays) {
        for (const st of this.world.strays) {
          if (Math.hypot(p.x - st.x, p.y - st.y) < 58) {
            const ico = st.kind === 'cat' ? '🐱' : '🐶';
            const food = this.bag.petfood > 0 ? '🥫 Mama Ver' : (this.bag.fish > 0 ? '🐟 Balık Ver' : 'Sev');
            return { kind: 'stray', ref: st, text: `[E] ${ico} ${st.name} (${food})` };
          }
        }
      }
      // 2) Forest Deer & Rabbits!
      if (!p.inCar && !p.inBoat) {
        for (const w of this.world.wildlife) {
          if (Math.hypot(p.x - w.x, p.y - w.y) < 62) {
            const ico = w.kind === 'deer' ? '🦌' : '🐰';
            const food = this.bag.petfood > 0 ? '🥫 Besle' : (this.bag.berry > 0 ? '🍓 Böğürtlen Ver' : 'Sev');
            return { kind: 'wild', ref: w, text: `[E] ${ico} ${w.name} (${food})` };
          }
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
      // 3) Hail a passing Yellow Taxi on the street!
      if (!p.inCar && !p.inBoat && !p.swimming) {
        for (const c of this.world.cars) {
          if (c.isTaxi && Math.hypot(p.x - c.x, p.y - c.y) < 110) {
            return { kind: 'taxi', ref: c, text: '[E] 🚕 Taksiyi Durdur (₺35)' };
          }
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
        this.toggleOffice(true);
        return;
      } else if (target.kind === 'bus') {
        this.toggleBus(true);
        return;
      } else if (target.kind === 'treasure') {
        if (this.world.island.chestOpened) {
          this.say(p, 'Bugünkü hazineyi topladım! Yarın yeni bir sandık vurabilir. 🏝️', 2.4);
          return;
        }
        this.world.island.chestOpened = true;
        const loot = 210 + Math.floor(Math.random() * 60);
        this.money += loot;
        this.bag.crystal = (this.bag.crystal || 0) + 1;
        this.happiness = Math.min(100, this.happiness + 25);
        this.addXp(45);
        this.audio.levelUp();
        this.burst(this.world.island.chestX, this.world.island.chestY, '#fde047', 28);
        this.popup(p.x, p.y - 36, `🪙 HAZİNE! +₺${loot} & +1 💎 Kristal!`, '#fde047');
        this.showToast(`🏝️ Tropik Hazine Sandığı Açıldı! +₺${loot} + 💎 Zirve Kristali!`);
        this.unlockAchievement('ach_island');
        this.advanceQuest('q_island', 1);
      } else if (target.kind === 'cafe') {
        this.toggleCafe(true);
        return;
      } else if (target.kind === 'study') {
        this.toggleUni(true);
        return;
      } else if (target.kind === 'shop') {
        this.toggleShop(true);
      } else if (target.kind === 'campfire') {
        this.energy = Math.min(100, this.energy + 30);
        this.happiness = Math.min(100, this.happiness + 22);
        this.health = Math.min(100, this.health + 15);
        this.timeMinutes += 45; this.audio.pickup();
        this.burst(this.world.campfire.x, this.world.campfire.y, '#fb923c', 16);
        this.popup(p.x, p.y - 34, '🔥 Kamp Ateşi Huzuru! +30 Enerji', '#fb923c');
        const hasRawFood = (this.bag.fish || 0) > 0 || (this.bag.tomato || 0) > 0 || (this.bag.mushroom || 0) > 0 || (this.bag.berry || 0) > 0;
        if (hasRawFood) {
          this.toggleCook(true);
          return;
        }
      } else if (target.kind === 'fountain') {
        if (this.money < 10) {
          this.popup(p.x, p.y - 34, 'Dilek parası ₺10!', '#ef4444');
          return;
        }
        this.money -= 10;
        this.audio.fountainSplash();
        this.burst(this.world.fountain.x, this.world.fountain.y, '#38bdf8', 18);
        this.happiness = Math.min(100, this.happiness + 22);
        this.addXp(20);
        if (!this.fountainWishedToday) {
          this.fountainWishedToday = true;
          this.energy = Math.min(100, this.energy + 25);
          this.health = Math.min(100, this.health + 20);
          if (Math.random() < 0.45) {
            this.money += 45;
            this.popup(p.x, p.y - 36, '⛲ 4D ŞANS DİLEĞİ KABUL OLDU! +₺45 & +Enerji', '#fde047');
          } else {
            this.popup(p.x, p.y - 36, '⛲ DİLEK BEREKETİ! +25 Enerji & +22 Mutluluk', '#38bdf8');
          }
        } else {
          this.popup(p.x, p.y - 34, '⛲ Dilek Tutuldu! +22 Mutluluk & +20 XP', '#38bdf8');
        }
      } else if (target.kind === 'icecream') {
        if (this.money < 15) {
          this.popup(p.x, p.y - 34, 'Dondurma & Limonata ₺15!', '#ef4444');
          return;
        }
        this.money -= 15;
        this.energy = Math.min(100, this.energy + 32);
        this.happiness = Math.min(100, this.happiness + 28);
        this.hunger = Math.min(100, this.hunger + 22);
        this.addXp(14);
        this.audio.iceCreamChime();
        this.burst(this.world.icecream.x, this.world.icecream.y, '#f472b6', 18);
        this.popup(p.x, p.y - 36, '🍦 Soğuk Dondurma & Limonata! +32 Enerji', '#f472b6');
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
        this.timeMinutes += 30;
        this.audio.quack();
        let msg = '🦆 VAK VAK! Ördekleri Besledin (+Mutluluk)';
        if (this.bag.petfood > 0) {
          this.bag.petfood--;
          this.addXp(18);
          msg = '🦆🥫 Ördekler Mamaya Bayıldı! (+18 XP)';
        } else {
          this.addXp(10);
        }
        this.animalFriends.add('pond_ducks');
        this.burst(this.world.pond.x, this.world.pond.y + 85, '#fde047', 14);
        this.popup(p.x, p.y - 34, msg, '#38bdf8');
        this.advanceQuest('q_park', 1);
        this.advanceQuest('q_animals', 1);
      } else if (target.kind === 'stray') {
        const st = target.ref;
        if (st.petCd > 0) {
          this.popup(st.x, st.y - 24, st.kind === 'cat' ? 'Mırrr... 🐱❤️' : 'Hav! 🐶❤️', '#f9a8d4');
          return;
        }
        st.petCd = 2.5;
        st.heartTimer = 5.0;
        if (st.kind === 'cat') this.audio.meow();
        else this.audio.bark();
        let fed = false;
        if (this.bag.petfood > 0) { this.bag.petfood--; fed = true; }
        else if (this.bag.fish > 0) { this.bag.fish--; fed = true; }
        st.trust = (st.trust || 0) + (fed ? 2 : 1);
        this.animalFriends.add(st.id);
        this.happiness = Math.min(100, this.happiness + (fed ? 18 : 12));
        this.addXp(fed ? 22 : 12);
        this.burst(st.x, st.y, '#f472b6', 16);
        const voice = st.kind === 'cat' ? 'MİYAV! 🐱' : 'HAV HAV! 🐶';
        if (fed && st.trust >= 2 && Math.random() < 0.55) {
          const gift = 25 + Math.floor(Math.random() * 21);
          this.money += gift;
          this.popup(st.x, st.y - 28, `${voice} ${st.name} sana ₺${gift} buldu! ❤️`, '#fde047');
        } else {
          this.popup(st.x, st.y - 28, `${voice} ${st.name} ${fed ? 'karnını doyurdu' : 'çok sevindi'}! ❤️`, '#f9a8d4');
        }
        this.advanceQuest('q_animals', 1);
      } else if (target.kind === 'wild') {
        const w = target.ref;
        if (w.petCd > 0) {
          this.popup(w.x, w.y - 24, w.kind === 'deer' ? '🦌❤️' : '🐰❤️', '#bef264');
          return;
        }
        w.petCd = 3.0;
        w.heartTimer = 6.5;
        this.audio.animalHappy();
        let fed = false;
        if (this.bag.petfood > 0) { this.bag.petfood--; fed = true; }
        else if (this.bag.berry > 0) { this.bag.berry--; fed = true; }
        this.animalFriends.add(w.id);
        this.happiness = Math.min(100, this.happiness + (fed ? 22 : 14));
        this.addXp(fed ? 26 : 15);
        this.burst(w.x, w.y, '#4ade80', 16);
        this.popup(w.x, w.y - 28, `${w.kind === 'deer' ? '🦌' : '🐰'} ${w.name} ${fed ? 'elinden yedi!' : 'sana güvendi!'} ❤️`, '#bef264');
        this.advanceQuest('q_animals', 1);
      } else if (target.kind === 'taxi') {
        const car = target.ref;
        car.brakeTimer = 2.5;
        car.hornFlash = 0.55;
        this.audio.carHorn(1.18, true, 0.95);
        this.toggleBus(true, 'taxi');
        return;
      } else if (target.kind === 'bank') {
        this.toggleBank(true);
        return;
      } else if (target.kind === 'evcharge') {
        if (!this.inventory.has('car')) {
          this.say(p, 'Önce Marketten [I] Elektrikli Araba almalısın! 🚗⚡', 2.4);
          return;
        }
        if (this.carBattery >= 98) {
          this.popup(p.x, p.y - 34, '⚡ Batarya zaten %100 dolu!', '#4ade80');
          return;
        }
        if (this.money < 20) {
          this.popup(p.x, p.y - 34, 'Hızlı şarj ücreti ₺20!', '#ef4444');
          return;
        }
        this.money -= 20;
        this.carBattery = 100;
        this.audio.levelUp();
        this.burst(this.world.evCharger.x, this.world.evCharger.y, '#4ade80', 22);
        this.popup(p.x, p.y - 36, '⚡ %100 HIZLI ŞARJ TAMAM! (-₺20)', '#4ade80');
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
      this.carBattery = 100; // Home overnight EV charging!
      this.fountainWishedToday = false;
      this.quizDoneToday = false;
      this.activeQuizIdx = null;
      this.world.island.chestOpened = false;
      if (this.delivery.active) this.cancelDelivery('');
      if (this.fishing.active) this.stopFishing();
      if (this.barista.active) this.finishBaristaShift(true);
      if (this.hasOpenModal()) this.closeAllModals();
      this.audio.sleep();

      // Passive Daily Cafe Profit if player owns the cafe!
      let extraMsg = '';
      if (this.ownsCafe) {
        const profit = 95 + Math.floor(Math.random() * 51);
        this.money += profit;
        this.cafeTotalEarned += profit;
        extraMsg += ` • ☕ Kafe +₺${profit}`;
      }
      // Daily Bank Interest (8% base, 12% with Ekonomi & Finans Diploması)!
      if (this.bankBalance >= 15) {
        const rate = this.uniCerts.has('cert_fin') ? 0.12 : 0.08;
        const interest = Math.max(1, Math.floor(this.bankBalance * rate));
        this.bankBalance += interest;
        extraMsg += ` • 🏦 Faiz +₺${interest}`;
      }
      // Modest real-life utility bill every 3rd day (eco-discount if you own indoor plants!)
      if (this.day % 3 === 0) {
        const bill = this.homeDecor.has('plants') ? 25 : 45;
        if (this.money >= bill) {
          this.money -= bill;
          extraMsg += ` • 💡 Fatura -₺${bill}`;
        }
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
      this.player.onBike = false; this.player.inCar = false; this.player.inBoat = false; this.player.swimming = false;
      const s = YD.SEASONS[this.seasonIdx], ev = YD.DAILY_EVENTS[this.dailyEventIdx];
      this.showToast(`☀️ Gün ${this.day} (${s.icon} ${s.name}) • ${ev.icon} ${ev.name}${extraMsg}`);
      this.checkAchievements();
      this.saveGame();
    }

    // =========================================================================
    //  v10: 4-ROLE AUTONOMOUS LIFE SWARM / AUTO-PILOT AI ENGINE ([O])
    // =========================================================================

    isManualMoveHeld() {
      return !!(
        this.keys['KeyW'] || this.keys['KeyA'] || this.keys['KeyS'] || this.keys['KeyD'] ||
        this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.keys['ArrowLeft'] || this.keys['ArrowRight']
      );
    }

    toggleAutoPilot(force) {
      const next = typeof force === 'boolean' ? force : !this.autoPilot.active;
      this.autoPilot.active = next;
      this.autoPilot.targetX = null;
      this.autoPilot.targetY = null;
      this.autoPilot.actionCd = 0.2;
      if (next && this.hasOpenModal()) {
        this.closeAllModals();
      }
      if (next && this.fishing.active) this.stopFishing();
      if (next && this.barista.active) this.finishBaristaShift(true);
      const btn = document.getElementById('btnAutoPilot');
      if (btn) btn.classList.toggle('swarm-active', next);
      const banner = document.getElementById('swarmBanner');
      if (banner) banner.classList.toggle('hidden', !next);

      this.audio.uiClick();
      if (next) {
        this.autoPilot.role = '🤖 SWARM';
        this.autoPilot.task = '4 Ajan otonom kontrolü devraldı...';
        this.showToast('🤖 OTONOM YAŞAM SWARM AKTİF! (İhtiyaç · Çiftlik/Şef · Kariyer/Finans · Keşif/Fotoğraf)');
        this.completeStarterTask('st_tech');
      } else {
        this.player.vx = 0; this.player.vy = 0;
        this.showToast('🤖 Oto-Pilot kapatıldı — Manuel kontrol sende.');
      }
    }

    updateHomeAutoPilot(dt) {
      const hp = this.homePlayer;
      const hr = (this.timeMinutes / 60) % 24;
      const wantSleep = hr >= 21.5 || hr < 5.5 || this.energy < 42;
      const tgt = wantSleep ? { x: 110, y: 110 } : { x: 340, y: 405 };
      this.autoPilot.role = '🩺 İHTİYAÇ AJANI';
      this.autoPilot.task = wantSleep ? 'Evde yatağa gidip uyuyor...' : 'Dinlendi, şehre çıkıyor...';

      const dx = tgt.x - hp.x, dy = tgt.y - hp.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 28) {
        if (wantSleep) this.startNextDay(false);
        else this.exitHome();
        return;
      }
      const ang = Math.atan2(dy, dx);
      hp.angle = ang;
      hp.vx = Math.cos(ang) * 215;
      hp.vy = Math.sin(ang) * 215;
      hp.walkCycle += dt * 11;
      hp.x = Math.max(28, Math.min(YD.HOME_ROOM.w - 28, hp.x + hp.vx * dt));
      hp.y = Math.max(80, Math.min(YD.HOME_ROOM.h - 22, hp.y + hp.vy * dt));
    }

    steerAutoPilotTo(tx, ty, dt, role, task) {
      const p = this.player;
      this.autoPilot.role = role;
      this.autoPilot.task = task;
      this.autoPilot.targetX = tx;
      this.autoPilot.targetY = ty;

      if (p.inCar) {
        p.inCar = false;
        this.parkedCar = { x: p.x, y: p.y, angle: p.angle };
      }
      if (p.inBoat && ty < YD.SEA_Y) {
        p.inBoat = false;
        this.parkedBoat = { x: p.x, y: p.y, angle: p.angle };
      }

      const inWater = this.world.isInWater(p.x, p.y);
      p.swimming = inWater;
      const dist = Math.hypot(tx - p.x, ty - p.y);

      if (!inWater && this.inventory.has('bike')) {
        p.onBike = dist > 110;
      } else if (inWater) {
        p.onBike = false;
      }

      // Smart Building-Corner Waypoint Router: if a building blocks the path to (tx, ty), route around its nearest side corner!
      let navX = tx, navY = ty;
      for (const b of this.world.buildings) {
        const pad = 34;
        const leftX = b.x - pad, rightX = b.x + b.w + pad;
        const topY = b.y - pad, botY = b.y + b.h + pad;
        const xOverlap = Math.max(p.x, tx) > leftX && Math.min(p.x, tx) < rightX;
        if (!xOverlap) continue;
        // Player is north of building's south face and target is south of building's north face
        if (p.y < botY - 8 && ty >= b.y && p.x > leftX - 24 && p.x < rightX + 24) {
          navX = Math.abs(p.x - leftX) <= Math.abs(p.x - rightX) ? leftX : rightX;
          navY = botY;
          break;
        }
        // Player is south of building's north face and target is north of building's south face
        if (p.y > topY + 8 && ty <= b.y + b.h && p.x > leftX - 24 && p.x < rightX + 24) {
          navX = Math.abs(p.x - leftX) <= Math.abs(p.x - rightX) ? leftX : rightX;
          navY = topY;
          break;
        }
      }

      // Stuck detection & automatic sidestep recovery
      const moved = Math.hypot(p.x - this.autoPilot.lastX, p.y - this.autoPilot.lastY);
      this.autoPilot.lastX = p.x;
      this.autoPilot.lastY = p.y;
      if (moved < 55 * dt && dist > 35) {
        this.autoPilot.stuckTimer += dt;
        if (this.autoPilot.stuckTimer > 0.45) {
          this.autoPilot.stuckTimer = 0;
          this.autoPilot.nudgeTimer = 0.65;
          this.autoPilot.nudgeSign *= -1;
        }
      } else {
        this.autoPilot.stuckTimer = Math.max(0, this.autoPilot.stuckTimer - dt);
      }

      let baseAng = Math.atan2(navY - p.y, navX - p.x);
      if (this.autoPilot.nudgeTimer > 0) {
        this.autoPilot.nudgeTimer -= dt;
        baseAng += this.autoPilot.nudgeSign * 1.15;
      }

      // Multi-whisker obstacle & traffic avoidance
      const offsets = [0, 0.48, -0.48, 0.95, -0.95, 1.45, -1.45, 2.1, -2.1];
      let chosenAng = baseAng;
      for (const off of offsets) {
        const cand = baseAng + off;
        const probeX = p.x + Math.cos(cand) * 44;
        const probeY = p.y + Math.sin(cand) * 44;
        const hitBldg = this.world.isInsideBuilding(probeX, probeY, 24);
        const hitPond = ty < YD.SEA_Y && this.world.isInPond(probeX, probeY, 14);
        const hitFountain = (Math.hypot(tx - this.world.fountain.x, ty - this.world.fountain.y) > 45) &&
          Math.hypot(probeX - this.world.fountain.x, probeY - this.world.fountain.y) < this.world.fountain.r + 22;
        const hitCar = this.world.cars.some((c) => Math.hypot(probeX - c.x, probeY - c.y) < 52);
        if (!hitBldg && !hitPond && !hitFountain && !hitCar) {
          chosenAng = cand;
          break;
        }
      }

      const maxSpd = p.swimming ? 185 : (p.onBike ? 430 : (this.energy > 35 ? 320 : 255));
      p.angle = chosenAng;
      p.vx = Math.cos(chosenAng) * maxSpd;
      p.vy = Math.sin(chosenAng) * maxSpd;
      p.walkCycle += dt * (maxSpd * 0.055);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      this.world.resolveCollisions(p, false);
      this.energy = Math.max(0, this.energy - 0.35 * dt);
      return dist;
    }

    updateAutoPilot(dt) {
      if (!this.autoPilot.active) return false;
      if (this.isManualMoveHeld()) {
        this.autoPilot.role = '⌨️ MANUEL';
        this.autoPilot.task = 'Klavye kontrolü algılandı (Bırakınca Swarm devam eder)';
        this.autoPilot.targetX = null;
        this.autoPilot.targetY = null;
        return false;
      }

      const p = this.player;
      const hr = (this.timeMinutes / 60) % 24;
      this.autoPilot.actionCd = Math.max(0, this.autoPilot.actionCd - dt);

      // --- CONTINUOUS BACKGROUND SWARM SENSORS (Photo, Animal Petting, Auto-Chef & Upgrades) ---
      // 1) Exploration & Photography Sensor: Auto-snap unphotographed landmarks & animals in range!
      if (this.cameraCd <= 0) {
        const nearNewSpot = YD.PHOTO_SPOTS.some((sp) => !this.photosTaken.has(sp.id) && Math.hypot(p.x - sp.x, p.y - sp.y) <= sp.r - 10);
        const nearNewAnimal = [...(this.world.strays || []), ...(this.world.wildlife || [])].some(
          (st) => !this.photosTaken.has(`ph_${st.id}`) && Math.hypot(p.x - st.x, p.y - st.y) < 115
        );
        if (nearNewSpot || nearNewAnimal) {
          this.snapPhoto();
        }
      }

      // 2) Animal Friend Sensor: Auto-pet/feed any nearby cat, dog, deer, or companion pet!
      if (this.pet && this.pet.petCd <= 0 && this.happiness < 86) {
        this.petCompanion();
      }
      for (const st of (this.world.strays || [])) {
        if (st.petCd <= 0 && Math.hypot(p.x - st.x, p.y - st.y) < 55) {
          this.handleInteract();
          break;
        }
      }
      for (const w of (this.world.wildlife || [])) {
        if (w.petCd <= 0 && Math.hypot(p.x - w.x, p.y - w.y) < 58) {
          this.handleInteract();
          break;
        }
      }

      // 3) Auto-Chef, Auto-Eat, Surplus Market Sales & Smart Equipment/Diploma Upgrades!
      if (this.autoPilot.actionCd <= 0) {
        // A) Cook any gourmet recipe whose ingredients are ready in bag
        for (const r of [...YD.RECIPES].reverse()) {
          const canCook = Object.entries(r.ingredients).every(([k, need]) => (this.bag[k] || 0) >= need);
          if (canCook) {
            for (const [k, need] of Object.entries(r.ingredients)) this.bag[k] -= need;
            this.bag[r.id] = (this.bag[r.id] || 0) + 1;
            this.happiness = Math.min(100, this.happiness + 12);
            this.addXp(r.xp);
            this.audio.cookSizzle();
            this.popup(p.x, p.y - 36, `🤖🍳 ${r.icon} ${r.name} Pişirildi!`, '#fb923c');
            this.unlockAchievement('ach_chef');
            this.advanceQuest('q_cook', 1);
            this.autoPilot.actionCd = 0.6;
            break;
          }
        }

        // B) Eat from bag automatically when hunger < 62 or energy < 38
        if (this.hunger < 62 || this.energy < 38) {
          const foodPriority = ['feast', 'soup', 'pie', 'grilled', 'goldfish', 'tomato', 'strawberry', 'fish', 'mushroom', 'berry'];
          for (const fk of foodPriority) {
            if ((this.bag[fk] || 0) > 0) {
              const info = YD.BAG_ITEMS[fk];
              this.bag[fk]--;
              this.hunger = Math.min(100, this.hunger + info.hunger);
              this.energy = Math.min(100, this.energy + info.energy);
              this.health = Math.min(100, this.health + info.health);
              this.audio.pickup();
              this.popup(p.x, p.y - 34, `🤖🍽️ ${info.icon} ${info.name} Yendi!`, '#4ade80');
              this.autoPilot.actionCd = 0.5;
              break;
            }
          }
        }

        // C) Sell non-edible valuables (sunflower, crystal) or surplus cooked/foraged items (qty > 2)
        for (const [k, qty] of Object.entries(this.bag)) {
          if (k === 'petfood' || qty <= 0) continue;
          const isCashCrop = k === 'sunflower' || k === 'crystal';
          if (isCashCrop || qty > 2) {
            const sellQty = isCashCrop ? qty : (qty - 2);
            const unitVal = this.getBagSellValue(k);
            this.bag[k] -= sellQty;
            this.money += unitVal * sellQty;
            this.audio.coin();
            this.popup(p.x, p.y - 34, `🤖💰 ${YD.BAG_ITEMS[k].icon} x${sellQty} Satıldı (+₺${unitVal * sellQty})`, '#fde047');
            this.checkAchievements();
            this.autoPilot.actionCd = 0.5;
            break;
          }
        }

        // D) Smart Autonomous Upgrades (Shop Items, University Diplomas, Home Decor & Cafe Ownership!)
        const reserve = 110;
        for (const itemId of ['umbrella', 'bike', 'rod', 'pet_dog', 'sisyphus', 'car', 'boat', 'hourglass', 'lantern']) {
          if (!this.inventory.has(itemId)) {
            const item = YD.SHOP_ITEMS.find((i) => i.id === itemId);
            if (item && this.money >= item.price + reserve) {
              this.money -= item.price;
              this.inventory.add(item.id);
              this.syncPetFromInventory();
              this.audio.coin();
              this.showToast(`🤖 [Finans Ajanı]: ${item.icon} ${item.name} satın alındı!`);
              this.checkAchievements();
              this.autoPilot.actionCd = 0.6;
              break;
            }
          }
        }
        for (const cert of YD.UNI_CERTS) {
          if (!this.uniCerts.has(cert.id) && this.money >= cert.price + reserve) {
            this.money -= cert.price;
            this.uniCerts.add(cert.id);
            this.addXp(45);
            this.audio.levelUp();
            this.showToast(`🤖 [Akademi Ajanı]: ${cert.icon} ${cert.name} alındı!`);
            this.advanceQuest('q_uni', 1);
            this.checkAchievements();
            this.autoPilot.actionCd = 0.6;
            break;
          }
        }
        for (const dec of YD.HOME_DECOR) {
          if (!this.homeDecor.has(dec.id) && this.money >= dec.price + reserve + 120) {
            this.money -= dec.price;
            this.homeDecor.add(dec.id);
            this.audio.coin();
            this.showToast(`🤖 [Ev Ajanı]: 🏠 ${dec.icon} ${dec.name} eve yerleştirildi!`);
            this.checkAchievements();
            this.autoPilot.actionCd = 0.6;
            break;
          }
        }
        if (!this.ownsCafe && this.money >= YD.CAFE_PRICE + reserve + 100) {
          this.money -= YD.CAFE_PRICE;
          this.ownsCafe = true;
          this.audio.levelUp();
          this.showToast(`🤖 [Finans Ajanı]: ⭐ ${this.playerName} KAFE satın alındı!`);
          this.checkAchievements();
        }
      }

      // --- PRIORITY DECISION TREE ACROSS THE 4 SWARM ROLES ---

      // PRIORITY 1: Active Express Courier Delivery!
      if (this.delivery.active && this.delivery.target) {
        const tgt = this.delivery.target;
        this.steerAutoPilotTo(tgt.x, tgt.y, dt, '📦 KURYE AJANI', `${tgt.name} noktasına teslimat yapılıyor (${Math.ceil(this.delivery.timeLeft)}sn)...`);
        return true;
      }

      // PRIORITY 2: Urgent Health, Hunger, or Nighttime Sleep (İhtiyaç & Sağlık Ajanı)
      if (this.health < 55) {
        if (this.money >= 30) {
          const d = this.steerAutoPilotTo(2082, 1050, dt, '🩺 SAĞLIK AJANI', 'Şehir Hastanesine muayeneye gidiyor...');
          if (d < 46 && this.autoPilot.actionCd <= 0) {
            this.handleInteract();
            this.autoPilot.actionCd = 0.8;
          }
        } else {
          const d = this.steerAutoPilotTo(this.world.hotSpring.x, this.world.hotSpring.y + 40, dt, '🩺 SAĞLIK AJANI', 'Sıcak Kaplıcada şifa arıyor...');
          if (d < 52 && this.autoPilot.actionCd <= 0) {
            this.handleInteract();
            this.autoPilot.actionCd = 0.8;
          }
        }
        return true;
      }

      if (this.hunger < 45 && this.money >= 25) {
        const d = this.steerAutoPilotTo(2062, 2045, dt, '🩺 İHTİYAÇ AJANI', 'Kafede sıcak Latte & Simit molasına gidiyor...');
        if (d < 46 && this.autoPilot.actionCd <= 0) {
          const cost = this.ownsCafe ? 0 : 25;
          this.money -= cost;
          this.energy = Math.min(100, this.energy + 35);
          this.hunger = Math.min(100, this.hunger + 35);
          this.happiness = Math.min(100, this.happiness + 18);
          this.audio.pickup();
          this.popup(p.x, p.y - 34, '🤖☕ Kafe Molası! +35 Enerji & Tokluk', '#fb923c');
          this.autoPilot.actionCd = 0.8;
        }
        return true;
      }

      if (hr >= 22 || hr < 5.5 || this.energy < 24) {
        const distHome = Math.hypot(p.x - 2062, p.y - 1510);
        if (distHome > 1100 && this.money >= 15) {
          this.travelToBusStop('bus_city');
          return true;
        }
        const d = this.steerAutoPilotTo(2062, 1510, dt, '🩺 İHTİYAÇ AJANI', 'Eve dinlenmeye ve yeni güne hazırlanmaya gidiyor...');
        if (d < 46 && this.autoPilot.actionCd <= 0) {
          this.startNextDay(false);
          this.autoPilot.actionCd = 1.0;
        }
        return true;
      }

      // PRIORITY 3: Organic Garden Harvest, Watering & Planting (Çiftlik & Şef Ajanı)
      const ripePlot = this.world.gardenPlots.find((gp) => gp.crop && gp.growth >= 1);
      if (ripePlot) {
        const d = this.steerAutoPilotTo(ripePlot.x, ripePlot.y, dt, '🌱 ÇİFTLİK AJANI', `Olgunlaşan ${YD.CROPS[ripePlot.crop].name} hasat ediliyor...`);
        if (d < 36 && this.autoPilot.actionCd <= 0) {
          this.handleInteract();
          this.autoPilot.actionCd = 0.45;
        }
        return true;
      }

      const dryPlot = this.world.gardenPlots.find((gp) => gp.crop && !gp.watered);
      if (dryPlot) {
        const d = this.steerAutoPilotTo(dryPlot.x, dryPlot.y, dt, '🌱 ÇİFTLİK AJANI', `Bahçedeki ${YD.CROPS[dryPlot.crop].name} sulanıyor (2x hız)...`);
        if (d < 36 && this.autoPilot.actionCd <= 0) {
          this.handleInteract();
          this.autoPilot.actionCd = 0.45;
        }
        return true;
      }

      const emptyPlot = this.world.gardenPlots.find((gp) => !gp.crop);
      if (emptyPlot && this.money >= 35) {
        const d = this.steerAutoPilotTo(emptyPlot.x, emptyPlot.y, dt, '🌱 ÇİFTLİK AJANI', 'Organik bahçeye yeni tohum ekiliyor...');
        if (d < 36 && this.autoPilot.actionCd <= 0) {
          const seedId = (emptyPlot.id % 3 === 0 && this.money >= 90) ? 'sunflower' : (emptyPlot.id % 2 === 0 && this.money >= 55 ? 'strawberry' : 'tomato');
          this.activePlotId = emptyPlot.id;
          this.plantSeed(seedId);
          this.autoPilot.actionCd = 0.45;
        }
        return true;
      }

      // PRIORITY 4: Daily University Scholarship Quiz, Wishing Fountain & Bank ATM Compound Interest (Kariyer & Finans Ajanı)
      if (!this.quizDoneToday) {
        const d = this.steerAutoPilotTo(2762, 2060, dt, '🎓 AKADEMİ AJANI', 'Üniversite Günlük Burs Sınavına (+₺150) gidiyor...');
        if (d < 48 && this.autoPilot.actionCd <= 0) {
          this.quizDoneToday = true;
          this.money += 150;
          this.addXp(55);
          this.happiness = Math.min(100, this.happiness + 18);
          this.audio.levelUp();
          this.popup(p.x, p.y - 36, '🤖🎓 BURS SINAVI GEÇİLDİ! +₺150 & +55 XP', '#2dd4bf');
          this.advanceQuest('q_uni', 1);
          this.checkAchievements();
          this.autoPilot.actionCd = 0.8;
        }
        return true;
      }

      if (!this.fountainWishedToday && this.money >= 30) {
        const d = this.steerAutoPilotTo(this.world.fountain.x, this.world.fountain.y + 34, dt, '⛲ ŞANS AJANI', 'Şehir Dilek Çeşmesinde günlük 4D dilek tutuyor...');
        if (d < 46 && this.autoPilot.actionCd <= 0) {
          this.handleInteract();
          this.autoPilot.actionCd = 0.7;
        }
        return true;
      }

      if (this.money >= 360) {
        const d = this.steerAutoPilotTo(this.world.atm.x, this.world.atm.y, dt, '🏦 FİNANS AJANI', 'Fazla nakti Banka ATM\'ye (%8–%12 günlük faiz) yatırıyor...');
        if (d < 44 && this.autoPilot.actionCd <= 0) {
          const dep = Math.floor(this.money - 160);
          if (dep >= 50) {
            this.money -= dep;
            this.bankBalance += dep;
            this.audio.cashRegister();
            this.popup(p.x, p.y - 36, `🤖🏦 +₺${dep} Bankaya Yatırıldı!`, '#4ade80');
            this.checkAchievements();
          }
          this.autoPilot.actionCd = 0.8;
        }
        return true;
      }

      // PRIORITY 5: Nearby Forageables, Cafe Barista Shift, Express Courier & Office Career
      let nearestForage = null, bestForageD = 620;
      for (const fg of this.world.forageables) {
        if (!fg.collected) {
          const fd = Math.hypot(p.x - fg.x, p.y - fg.y);
          if (fd < bestForageD) { bestForageD = fd; nearestForage = fg; }
        }
      }
      if (nearestForage) {
        const d = this.steerAutoPilotTo(nearestForage.x, nearestForage.y, dt, '📸 KEŞİF AJANI', `${YD.BAG_ITEMS[nearestForage.kind].name} topluyor...`);
        if (d < 42 && this.autoPilot.actionCd <= 0) {
          this.handleInteract();
          this.autoPilot.actionCd = 0.45;
        }
        return true;
      }

      if (this.ownsCafe && !this.questDone.has('q_cafe') && this.energy >= 35) {
        const d = this.steerAutoPilotTo(2062, 2045, dt, '☕ BARİSTA AJANI', 'Kendi kafesinde Barista Vardiyası başlatıyor...');
        if (d < 48 && this.autoPilot.actionCd <= 0) {
          this.startBaristaShift();
          this.autoPilot.actionCd = 0.8;
        }
        return true;
      }

      if (this.energy >= 44) {
        const d = this.steerAutoPilotTo(2762, 1510, dt, '💼 KARİYER AJANI', 'İş Merkezinde vardiya & Ekspres Kurye görevine gidiyor...');
        if (d < 48 && this.autoPilot.actionCd <= 0) {
          if (!this.questDone.has('q_delivery') || Math.random() < 0.5) {
            this.startDelivery();
          } else {
            this.doOfficeShift();
          }
          this.autoPilot.actionCd = 0.8;
        }
        return true;
      }

      // PRIORITY 6: Moderate Energy Exploration — Fishing, Park Duck Feeding, or Scenic Photo Expedition
      if (!this.questDone.has('q_fish') && this.energy >= 26) {
        const fx = this.world.pier.x + this.world.pier.w / 2;
        const fy = this.world.pier.y + this.world.pier.h - 24;
        const d = this.steerAutoPilotTo(fx, fy, dt, '🎣 KEŞİF AJANI', 'Balık İskelesinde altın balık avına gidiyor...');
        if (d < 52 && this.autoPilot.actionCd <= 0) {
          this.startFishing();
          this.autoPilot.actionCd = 0.8;
        }
        return true;
      }

      const d = this.steerAutoPilotTo(3880, 1605, dt, '🌳 KEŞİF AJANI', 'Yeşil Park Göletinde ördekleri besleyip enerji topluyor...');
      if (d < 48 && this.autoPilot.actionCd <= 0) {
        this.handleInteract();
        this.autoPilot.actionCd = 0.9;
      }
      return true;
    }

    tickAudio(dt) {
      const biome = this.started ? this.world.getBiome(this.player.x, this.player.y) : 'city';
      const weatherId = YD.WEATHERS[this.weatherIdx] ? YD.WEATHERS[this.weatherIdx].id : 'clear';
      this.audio.updateAmbient(dt, biome, weatherId, {
        indoor: this.scene === 'home',
        hour: (this.timeMinutes % 1440) / 60,
        action: !!(this.barista.active || this.delivery.active),
      });
    }

    update(dt) {
      this.damageFlash = Math.max(0, this.damageFlash - dt * 2.2);
      this.carHitInvuln = Math.max(0, this.carHitInvuln - dt);
      this.cameraFlash = Math.max(0, this.cameraFlash - dt * 1.45);
      this.cameraCd = Math.max(0, this.cameraCd - dt);
      this.tickAudio(dt);

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
        if (this.autoPilot.active && this.barista.order) {
          this.autoPilot.baristaCd -= dt;
          if (this.autoPilot.baristaCd <= 0) {
            this.autoPilot.baristaCd = 0.42;
            this.serveBarista(this.barista.order.id);
          }
        }
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
        if (this.autoPilot.active && Math.abs(this.fishing.pos - 0.5) <= 0.045) {
          this.resolveFishingAttempt();
        }
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

      const swarmHandledMove = this.updateAutoPilot(dt);

      if (swarmHandledMove) {
        // Movement & collision already updated by Autonomous Life Swarm!
      } else if (p.inBoat) {
        const accelInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
        const steerInput = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
        if (accelInput !== 0) {
          p.boatSpeed += accelInput * 620 * dt;
          p.boatSpeed = Math.max(-160, Math.min(430, p.boatSpeed));
        } else {
          p.boatSpeed *= Math.pow(0.001, dt);
          if (Math.abs(p.boatSpeed) < 15) p.boatSpeed = 0;
        }
        if (Math.abs(p.boatSpeed) > 15 || steerInput !== 0) {
          p.angle += steerInput * 2.8 * (p.boatSpeed < -15 ? -1 : 1) * dt;
        }
        p.vx = Math.cos(p.angle) * p.boatSpeed; p.vy = Math.sin(p.angle) * p.boatSpeed;
        const nx = Math.max(55, Math.min(YD.WORLD_W - 55, p.x + p.vx * dt));
        const ny = Math.max(YD.SEA_Y + 26, Math.min(YD.WORLD_H - 45, p.y + p.vy * dt));
        // Keep speedboat cleanly in open sea (bounce gently off pier & island shore!)
        if (!this.world.isOnPier(nx, ny) && !this.world.isOnIsland(nx, ny, 14)) {
          p.x = nx; p.y = ny;
        } else {
          p.boatSpeed *= -0.25;
        }
        this.happiness = Math.min(100, this.happiness + dt * 2.5);
        this.advanceQuest('q_swim', 1);
      } else if (p.inCar) {
        const accelInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
        const steerInput = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
        const maxCarSpd = this.carBattery > 0 ? 540 : 185;
        if (accelInput !== 0) {
          p.carSpeed += accelInput * 760 * dt;
          p.carSpeed = Math.max(-220, Math.min(maxCarSpd, p.carSpeed));
        } else {
          p.carSpeed *= Math.pow(0.0004, dt);
          if (Math.abs(p.carSpeed) < 18) p.carSpeed = 0;
        }
        if (Math.abs(p.carSpeed) > 35 && this.carBattery > 0) {
          const prevBat = this.carBattery;
          this.carBattery = Math.max(0, this.carBattery - 1.35 * dt);
          if (prevBat > 18 && this.carBattery <= 18) {
            this.showToast('⚡ Araba şarjı azaldı! Market yanındaki EV Şarj İstasyonuna uğra.');
          } else if (prevBat > 0 && this.carBattery === 0) {
            this.showToast('🪫 Batarya bitti! Yavaş mod — EV Şarj İstasyonunda (₺20) veya evde şarj et.');
          }
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

      // Express Delivery countdown & automatic arrival detection!
      if (this.delivery.active && this.delivery.target) {
        this.delivery.timeLeft -= dt;
        const dTgt = Math.hypot(p.x - this.delivery.target.x, p.y - this.delivery.target.y);
        if (dTgt < 78) {
          this.completeDelivery();
        } else if (this.delivery.timeLeft <= 0) {
          this.audio.miss();
          this.cancelDelivery('Süre doldu! Tekrar dene.');
        }
      }

      // Loyal Pet Companion Follow Logic (walks around buildings cleanly!)
      if (this.pet && !p.inBoat) {
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

      // Rain / Storm chill realism (100% protected if holding Umbrella or inside Car!)
      const weatherId = YD.WEATHERS[this.weatherIdx].id;
      if ((weatherId === 'rain' || weatherId === 'storm') && !p.inCar && !this.inventory.has('umbrella')) {
        this.rainChillTimer += dt;
        if (this.rainChillTimer >= 13) {
          this.rainChillTimer = 0;
          this.energy = Math.max(5, this.energy - 3.5);
          this.popup(p.x, p.y - 36, '🌧️ Yağmurda ıslandın! (Market: ☂️ Şemsiye)', '#38bdf8');
        }
      } else {
        this.rainChillTimer = 0;
      }

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
        if (Math.hypot(nx - npc.homeX, ny - npc.homeY) < 90 && !this.world.isInsideBuilding(nx, ny, 24) && !this.world.isOnRoad(nx, ny, 10) && !this.world.isInWater(nx, ny)) {
          npc.x = nx; npc.y = ny; npc.walkCycle += dt * 5;
        } else npc.angle += Math.PI;
      }

      const playerCalm = !p.inCar && !p.inBoat && !(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
      const agriMult = this.uniCerts.has('cert_agri') ? 1.4 : 1.0;
      this.world.update(
        dt, p,
        (car) => this.handleCarHitPlayer(car),
        weatherId,
        (car, reason, dist) => this.handleCarHonk(car, reason, dist),
        playerCalm,
        agriMult
      );

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

      const targetZoom = (p.inCar || p.inBoat) ? 0.84 : 1.0;
      this.cam.zoom += (targetZoom - this.cam.zoom) * Math.min(1, dt * 2.5);
      this.cam.x += (p.x + p.vx * 0.16 - this.cam.x) * Math.min(1, dt * 7.5);
      this.cam.y += (p.y + p.vy * 0.16 - this.cam.y) * Math.min(1, dt * 7.5);

      // Clamp camera cleanly inside world boundaries (ZERO black void at map edges!)
      const halfVW = Math.min(YD.WORLD_W / 2, (this.viewW / 2) / this.cam.zoom);
      const halfVH = Math.min(YD.WORLD_H / 2, (this.viewH / 2) / this.cam.zoom);
      this.cam.x = Math.max(halfVW, Math.min(YD.WORLD_W - halfVW, this.cam.x));
      this.cam.y = Math.max(halfVH, Math.min(YD.WORLD_H - halfVH, this.cam.y));

      const biome = this.world.getBiome(p.x, p.y);

      this.saveTimer += dt;
      if (this.saveTimer >= 10) { this.saveTimer = 0; this.saveGame(); }

      this.updateHUD(biome);
    }

    updateHUD(biome) {
      document.getElementById('statHealthFill').style.width = `${this.health}%`;
      document.getElementById('statEnergyFill').style.width = `${this.energy}%`;
      document.getElementById('statHungerFill').style.width = `${this.hunger}%`;
      document.getElementById('statHappyFill').style.width = `${this.happiness}%`;

      document.getElementById('moneyBadge').textContent = YD.fmtMoney ? YD.fmtMoney(this.money) : `₺${Math.floor(this.money).toLocaleString()}`;
      document.getElementById('levelBadge').textContent = `LV ${this.level}`;

      const hrs = Math.floor(this.timeMinutes / 60) % 24;
      const mins = Math.floor(this.timeMinutes % 60);
      const s = YD.SEASONS[this.seasonIdx], w = YD.WEATHERS[this.weatherIdx];
      const clockTxt = `${s.icon} GÜN ${this.day} • YAŞ ${this.age} • ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} • ${w.icon}`;
      document.getElementById('clockBadge').textContent = YD.tr ? YD.tr(clockTxt) : clockTxt;
      const biomeTxt = biome === 'home' ? '🏠 EVİNİN İÇİ' : this.world.getBiomeLabel(biome);
      document.getElementById('biomeBadge').textContent = YD.tr ? YD.tr(biomeTxt) : biomeTxt;

      const bottomBar = document.querySelector('.hud-bottom');
      if (bottomBar) bottomBar.classList.toggle('hidden', this.scene === 'home');

      if (this.autoPilot.active) {
        const rEl = document.getElementById('swarmRoleBadge');
        const tEl = document.getElementById('swarmActionText');
        if (rEl) rEl.textContent = YD.tr ? YD.tr(this.autoPilot.role) : this.autoPilot.role;
        if (tEl) tEl.textContent = YD.tr ? YD.tr(this.autoPilot.task) : this.autoPilot.task;
      }

      if (this.delivery.active && this.delivery.target) {
        const distM = Math.round(Math.hypot(this.player.x - this.delivery.target.x, this.player.y - this.delivery.target.y) / 4);
        const delTxt = `📦 Hedef: ${this.delivery.target.name}`;
        document.getElementById('deliveryTargetText').textContent = YD.tr ? YD.tr(delTxt) : delTxt;
        document.getElementById('deliveryTimerText').textContent = `${Math.ceil(this.delivery.timeLeft)}s`;
        document.getElementById('deliveryDistText').textContent = `${distM}m`;
      }

      const prompt = this.scene === 'home' ? this.findNearestHomeInteraction() : this.findNearestInteraction();
      const promptEl = document.getElementById('interactPrompt');
      if (prompt && !this.fishing.active && !this.barista.active && !this.hasOpenModal() && !this.player.inBoat) {
        promptEl.textContent = YD.tr ? YD.tr(prompt.text) : prompt.text;
        promptEl.classList.remove('hidden');
      } else {
        promptEl.classList.add('hidden');
      }

      this.updateGuideHUD();
    }

    loop(ts) {
      // Fixed-timestep simulation (v11): game logic always advances in constant
      // FIXED_DT steps so movement, timers and physics feel identical on 60/144/240 Hz
      // screens. Rendering interpolates player & camera between the last two steps.
      const FIXED_DT = 1 / 60;
      const MAX_STEPS = 6; // ~0.1s of catch-up max; prevents spiral of death
      let frame = (ts - this.lastTime) / 1000;
      this.lastTime = ts;
      if (!(frame > 0)) frame = 0;
      if (frame > 0.25) frame = FIXED_DT; // returning from background tab: resume, don't fast-forward
      this.simAcc = (this.simAcc || 0) + frame;

      const p = this.player;
      const snap = () => ({ px: p.x, py: p.y, cx: this.cam.x, cy: this.cam.y });
      let steps = 0;
      while (this.simAcc >= FIXED_DT && steps < MAX_STEPS) {
        this.interpPrev = snap();
        this.update(FIXED_DT);
        this.simAcc -= FIXED_DT;
        steps++;
      }
      if (steps === MAX_STEPS) this.simAcc = 0;

      // Interpolate between previous and current sim state (skip big jumps: bus travel, scene change)
      const cur = snap();
      const prev = this.interpPrev || cur;
      const alpha = Math.max(0, Math.min(1, this.simAcc / FIXED_DT));
      const near = Math.abs(cur.px - prev.px) + Math.abs(cur.py - prev.py) < 60
        && Math.abs(cur.cx - prev.cx) + Math.abs(cur.cy - prev.cy) < 60;
      if (near) {
        p.x = prev.px + (cur.px - prev.px) * alpha;
        p.y = prev.py + (cur.py - prev.py) * alpha;
        this.cam.x = prev.cx + (cur.cx - prev.cx) * alpha;
        this.cam.y = prev.cy + (cur.cy - prev.cy) * alpha;
      }
      this.renderer.render(this);
      p.x = cur.px; p.y = cur.py; this.cam.x = cur.cx; this.cam.y = cur.cy;
      requestAnimationFrame((nextTs) => this.loop(nextTs));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.yasamDunyaGame = new YasamDunyaGame();
  });
})(window.YasamDunya);
