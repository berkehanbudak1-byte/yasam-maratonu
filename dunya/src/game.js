/**
 * Yaşam Maratonu: Büyük Dünya — Main 60 FPS Life Simulator Engine
 * Handles smooth acceleration movement, swimming, biking, foraging, fishing,
 * career/study, 4D Seasons & Past-Self Echo, quests, shop, and localStorage auto-save!
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  const SAVE_KEY = 'yasam_maratonu_dunya_save_v1';

  class YasamDunyaGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.miniCanvas = document.getElementById('minimapCanvas');
      this.renderer = new YD.WorldRenderer(this.canvas, this.miniCanvas);
      this.audio = new YD.CozyAudio();
      this.world = new YD.LifeWorld();

      this.keys = {};
      this.shopOpen = false;
      this.paused = false;

      this.player = {
        x: 1950, y: 1255, vx: 0, vy: 0, r: 16, angle: Math.PI / 2,
        color: '#38bdf8', walkCycle: 0,
        swimming: false, onBike: false,
        speech: '', speechTimer: 0
      };

      // Life Simulator Stats
      this.day = 1;
      this.age = 20;
      this.seasonIdx = 0; // 0: Spring, 1: Summer, 2: Autumn, 3: Winter
      this.timeMinutes = 8 * 60; // 08:00 AM
      this.money = 120;
      this.health = 100;
      this.energy = 100;
      this.hunger = 95;
      this.happiness = 90;
      this.xp = 0;
      this.level = 1;
      this.inventory = new Set();

      // Quest Progress
      this.questProgress = {};
      this.questDone = new Set();

      // 4D Past-Self Echo (records today's positions for tomorrow's golden ghost!)
      this.todayPath = [];
      this.yesterdayPath = [];
      this.pathSampleTimer = 0;
      this.pastEcho = null;

      this.npcs = YD.NPC_TEMPLATES.map((n) => ({
        ...n, homeX: n.x, homeY: n.y, angle: 0, walkCycle: 0,
        timer: 1 + Math.random() * 3, speech: '', speechTimer: 0, lineIdx: 0
      }));

      this.cam = { x: this.player.x, y: this.player.y, zoom: 1.0 };
      this.particles = [];
      this.popups = [];
      this.weatherParticles = [];
      this.currentPrompt = null;
      this.swimQuestTimer = 0;
      this.saveTimer = 0;

      this.loadSave();
      this.resize();
      this.initWeatherParticles();
      this.bindEvents();
      this.renderShop();
      this.renderQuests();

      this.say(this.player, 'Yeni bir gün! Ormanı, parkı ve denizi keşfet! ✨', 3.6);
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
      for (let i = 0; i < 42; i++) {
        this.weatherParticles.push({
          x: Math.random() * this.viewW,
          y: Math.random() * this.viewH,
          vx: -18 - Math.random() * 24,
          vy: 22 + Math.random() * 32,
          r: 2 + Math.random() * 2.5
        });
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('wheel', (e) => {
        this.cam.zoom = Math.max(0.65, Math.min(1.45, this.cam.zoom - Math.sign(e.deltaY) * 0.08));
      }, { passive: true });

      window.addEventListener('keydown', (e) => {
        this.audio.unlock();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        this.keys[e.code] = true;

        if (e.code === 'Escape' && this.shopOpen) { this.toggleShop(false); return; }
        if (e.code === 'KeyE' || e.code === 'Space') this.handleInteract();
        if (e.code === 'KeyB') this.toggleBike();
        if (e.code === 'KeyT') this.useHourglass();
        if (e.code === 'KeyM') this.toggleMusic();
        if (e.code === 'Equal' || e.code === 'NumpadAdd') this.cam.zoom = Math.min(1.45, this.cam.zoom + 0.1);
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.cam.zoom = Math.max(0.65, this.cam.zoom - 0.1);
      });

      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

      document.getElementById('btnShop').addEventListener('click', () => { this.audio.unlock(); this.toggleShop(!this.shopOpen); });
      document.getElementById('btnCloseShop').addEventListener('click', () => this.toggleShop(false));
      document.getElementById('btnBike').addEventListener('click', () => { this.audio.unlock(); this.toggleBike(); });
      document.getElementById('btnSeason').addEventListener('click', () => { this.audio.unlock(); this.useHourglass(); });
      document.getElementById('btnMusic').addEventListener('click', () => { this.audio.unlock(); this.toggleMusic(); });
      document.getElementById('btnResetSave').addEventListener('click', () => {
        if (confirm('Kayıt sıfırlansın mı?')) {
          localStorage.removeItem(SAVE_KEY);
          location.reload();
        }
      });

      // Touch controls
      document.querySelectorAll('.touch-btn').forEach((btn) => {
        const code = btn.dataset.key;
        const down = (ev) => {
          ev.preventDefault(); this.audio.unlock(); this.keys[code] = true;
          if (code === 'KeyE') this.handleInteract();
          if (code === 'KeyB') this.toggleBike();
        };
        const up = (ev) => { ev.preventDefault(); this.keys[code] = false; };
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);
      });
    }

    saveGame() {
      const data = {
        day: this.day, age: this.age, seasonIdx: this.seasonIdx,
        timeMinutes: this.timeMinutes, money: this.money,
        health: this.health, energy: this.energy, hunger: this.hunger,
        happiness: this.happiness, xp: this.xp, level: this.level,
        inventory: [...this.inventory],
        questProgress: this.questProgress,
        questDone: [...this.questDone],
        px: this.player.x, py: this.player.y
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (_) {}
    }

    loadSave() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        this.day = d.day || 1;
        this.age = d.age || 20;
        this.seasonIdx = d.seasonIdx || 0;
        this.timeMinutes = d.timeMinutes || 480;
        this.money = d.money ?? 120;
        this.health = d.health ?? 100;
        this.energy = d.energy ?? 100;
        this.hunger = d.hunger ?? 95;
        this.happiness = d.happiness ?? 90;
        this.xp = d.xp || 0;
        this.level = d.level || 1;
        this.inventory = new Set(d.inventory || []);
        this.questProgress = d.questProgress || {};
        this.questDone = new Set(d.questDone || []);
        if (d.px && d.py) { this.player.x = d.px; this.player.y = d.py; }
      } catch (_) {}
    }

    say(ent, txt, dur = 2.6) { ent.speech = txt; ent.speechTimer = dur; }

    popup(x, y, text, color = '#ffe135') {
      this.popups.push({ x, y, text, color, life: 1.25, maxLife: 1.25 });
    }

    burst(x, y, color, count = 10) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 110;
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
        this.xp -= needed;
        this.level++;
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
      document.getElementById('btnMusic').textContent = this.audio.musicOn ? '🎵 MÜZİK: AÇIK' : '🎵 MÜZİK: KAPALI';
    }

    toggleBike() {
      if (!this.inventory.has('bike')) {
        this.say(this.player, 'Önce Marketten Bisiklet (₺220) almalısın! 🚲', 2.4);
        return;
      }
      if (this.player.swimming) {
        this.say(this.player, 'Denizde bisiklet sürülmez! 😅', 1.8);
        return;
      }
      this.player.onBike = !this.player.onBike;
      this.audio.bikeBell();
      this.popup(this.player.x, this.player.y - 28, this.player.onBike ? '🚲 BİSİKLET AÇIK' : '🚶 YÜRÜYÜŞ', '#38bdf8');
    }

    useHourglass() {
      if (!this.inventory.has('hourglass')) {
        this.say(this.player, '4D Kum Saati için Antikacıya uğra! ⏳', 2.4);
        return;
      }
      this.seasonIdx = (this.seasonIdx + 1) % YD.SEASONS.length;
      this.audio.timeWarp();
      const s = YD.SEASONS[this.seasonIdx];
      this.burst(this.player.x, this.player.y, '#38bdf8', 24);
      this.popup(this.player.x, this.player.y - 36, `⏳ ${s.icon} ${s.name.toUpperCase()}!`, '#38bdf8');
      this.saveGame();
    }

    toggleShop(open) {
      this.shopOpen = open;
      document.getElementById('shopModal').classList.toggle('hidden', !open);
      if (open) this.renderShop();
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
          if (this.money < item.price) {
            this.popup(this.player.x, this.player.y - 30, 'Yetersiz Bakiye!', '#ef4444');
            return;
          }
          this.money -= item.price;
          this.inventory.add(item.id);
          this.audio.coin();
          this.popup(this.player.x, this.player.y - 34, `${item.icon} ${item.name} ALINDI!`, '#4ade80');
          this.renderShop();
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

    findNearestInteraction() {
      const p = this.player;
      // Check forageables first
      for (const fg of this.world.forageables) {
        if (!fg.collected && Math.hypot(p.x - fg.x, p.y - fg.y) < 48) {
          return { kind: 'forage', ref: fg, text: `[E] ${fg.kind === 'berry' ? '🍓 Böğürtlen Topla' : '🍄 Mantar Topla'}` };
        }
      }
      // Check NPCs
      for (const npc of this.npcs) {
        if (Math.hypot(p.x - npc.x, p.y - npc.y) < 62) {
          return { kind: 'npc', ref: npc, text: `[E] 💬 ${npc.name} ile Konuş` };
        }
      }
      // Check World Interactables (Home, Office, Cafe, University, Shop, Pier, Campfire, Park Gym, Altar)
      for (const it of this.world.interactables) {
        if (Math.hypot(p.x - it.x, p.y - it.y) < it.r + 22) {
          return { kind: it.kind, ref: it, text: `[E] ${it.label}` };
        }
      }
      return null;
    }

    handleInteract() {
      if (this.shopOpen) return;
      const target = this.findNearestInteraction();
      if (!target) return;
      const p = this.player;
      const bonusMult = this.inventory.has('sisyphus') ? 1.4 : 1.0;

      if (target.kind === 'forage') {
        target.ref.collected = true;
        target.ref.respawnTimer = 40;
        this.hunger = Math.min(100, this.hunger + 16);
        this.health = Math.min(100, this.health + 8);
        this.money += 18;
        this.addXp(14);
        this.audio.pickup();
        this.burst(target.ref.x, target.ref.y, '#4ade80', 12);
        this.popup(p.x, p.y - 30, '+16 Tokluk • +₺18 🍓', '#4ade80');
        this.advanceQuest('q_forest', 1);
      } else if (target.kind === 'npc') {
        const npc = target.ref;
        const line = npc.lines[npc.lineIdx % npc.lines.length];
        npc.lineIdx++;
        this.say(npc, line, 3.2);
        this.happiness = Math.min(100, this.happiness + 6);
        this.addXp(8);
        this.audio.pickup();
      } else if (target.kind === 'sleep') {
        this.startNextDay(false);
      } else if (target.kind === 'work') {
        if (this.energy < 22) { this.say(p, 'Çok yorgunum, önce uyu veya kahve iç! 😴', 2.2); return; }
        const pay = Math.round((75 + this.level * 22) * bonusMult);
        this.energy = Math.max(0, this.energy - 22);
        this.hunger = Math.max(0, this.hunger - 14);
        this.timeMinutes += 120;
        this.money += pay;
        this.addXp(28);
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
        this.energy = Math.max(0, this.energy - 18);
        this.timeMinutes += 90;
        this.addXp(Math.round(45 * bonusMult));
        this.audio.pickup();
        this.popup(p.x, p.y - 34, `🎓 +${Math.round(45 * bonusMult)} BİLGİ XP!`, '#38bdf8');
      } else if (target.kind === 'shop') {
        this.toggleShop(true);
      } else if (target.kind === 'campfire') {
        this.energy = Math.min(100, this.energy + 30);
        this.happiness = Math.min(100, this.happiness + 22);
        this.health = Math.min(100, this.health + 15);
        this.timeMinutes += 45;
        this.audio.pickup();
        this.burst(this.world.campfire.x, this.world.campfire.y, '#fb923c', 16);
        this.popup(p.x, p.y - 34, '🔥 Kamp Ateşi Huzuru! +Enerji', '#fb923c');
      } else if (target.kind === 'altar') {
        this.addXp(35);
        this.happiness = Math.min(100, this.happiness + 20);
        this.audio.timeWarp();
        this.burst(this.world.altar.x, this.world.altar.y, '#38bdf8', 20);
        this.say(p, 'Zaman bir nehir gibi akıyor... (+35 XP) ⏳', 2.8);
      } else if (target.kind === 'workout') {
        if (this.energy < 15) { this.say(p, 'Spor için biraz enerji lazım!', 2.0); return; }
        this.energy = Math.max(0, this.energy - 15);
        this.health = Math.min(100, this.health + Math.round(24 * bonusMult));
        this.happiness = Math.min(100, this.happiness + 16);
        this.addXp(22);
        this.audio.pickup();
        this.popup(p.x, p.y - 34, '🏃 Harika Antrenman! +Sağlık', '#4ade80');
        this.advanceQuest('q_park', 1);
      } else if (target.kind === 'relax') {
        this.energy = Math.min(100, this.energy + 22);
        this.happiness = Math.min(100, this.happiness + 24);
        this.timeMinutes += 30;
        this.audio.pickup();
        this.popup(p.x, p.y - 34, '🦆 Ördekleri İzledin (+Mutluluk)', '#38bdf8');
        this.advanceQuest('q_park', 1);
      } else if (target.kind === 'fish') {
        if (this.energy < 12) { this.say(p, 'Olta sallayacak halim kalmadı!', 2.0); return; }
        this.energy = Math.max(0, this.energy - 12);
        this.timeMinutes += 40;
        const pro = this.inventory.has('rod');
        const fishes = pro
          ? [{ n: 'Altın Levrek 🐟', v: 95 }, { n: 'Dev Lüfer 🐠', v: 130 }, { n: '4D Zaman Balığı ✨', v: 185 }]
          : [{ n: 'İstavrit 🐟', v: 42 }, { n: 'Çipura 🐠', v: 64 }, { n: 'Eski Çizme 🥾', v: 12 }];
        const caught = fishes[Math.floor(Math.random() * fishes.length)];
        this.money += caught.v;
        this.happiness = Math.min(100, this.happiness + 14);
        this.addXp(24);
        this.audio.splash();
        this.audio.coin();
        this.burst(p.x, p.y + 30, '#38bdf8', 16);
        this.popup(p.x, p.y - 34, `🎣 ${caught.n} (+₺${caught.v})!`, '#38bdf8');
        this.advanceQuest('q_fish', 1);
      } else if (target.kind === 'lighthouse') {
        this.happiness = Math.min(100, this.happiness + 25);
        this.addXp(20);
        this.audio.pickup();
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
      this.health = Math.min(100, this.health + 20);
      this.hunger = Math.max(45, this.hunger - 12);
      this.audio.sleep();

      // Spawn 4D Past-Self Echo from yesterday's journey!
      if (this.todayPath.length > 5) {
        this.yesterdayPath = [...this.todayPath];
        this.todayPath = [];
        this.pastEcho = {
          x: this.yesterdayPath[0].x,
          y: this.yesterdayPath[0].y,
          idx: 0,
          claimed: false
        };
      }

      this.player.x = 1950;
      this.player.y = 1245;
      this.player.onBike = false;
      const s = YD.SEASONS[this.seasonIdx];
      this.say(
        this.player,
        fainted
          ? `Enerjin bitti, eve taşındın! Gün ${this.day} (${s.icon} ${s.name})`
          : `Günaydın! Gün ${this.day} • Yaş ${this.age} (${s.icon} ${s.name})`,
        3.5
      );
      this.saveGame();
    }

    update(dt) {
      if (this.shopOpen) return;

      // In-game clock advances smoothly (1 real sec = 2.4 in-game mins)
      this.timeMinutes += dt * 2.4;
      if (this.timeMinutes >= 24 * 60) {
        this.startNextDay(false);
      }

      const p = this.player;
      p.speechTimer = Math.max(0, p.speechTimer - dt);

      // Ultra-Fluid 60 FPS Acceleration & Damping Movement!
      let ix = 0, iy = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) iy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) iy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
      const len = Math.hypot(ix, iy);
      if (len > 0) { ix /= len; iy /= len; }

      const inWater = this.world.isInWater(p.x, p.y);
      if (inWater && !p.swimming) {
        p.swimming = true;
        p.onBike = false;
        this.audio.splash();
        this.burst(p.x, p.y, '#38bdf8', 12);
      } else if (!inWater && p.swimming) {
        p.swimming = false;
      }

      const sprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !p.swimming && this.energy > 8;
      let maxSpd = p.swimming ? 175 : (p.onBike ? 430 : (sprinting ? 330 : 240));

      // Smooth spring acceleration!
      const accel = p.onBike ? 9 : 14;
      p.vx += (ix * maxSpd - p.vx) * Math.min(1, dt * accel);
      p.vy += (iy * maxSpd - p.vy) * Math.min(1, dt * accel);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const curSpeed = Math.hypot(p.vx, p.vy);
      if (curSpeed > 18) {
        p.angle = Math.atan2(p.vy, p.vx);
        p.walkCycle += dt * (curSpeed * 0.055);
      }

      this.world.resolveCollisions(p);

      // Swimming refreshes Happiness & completes Sea Quest!
      if (p.swimming) {
        this.happiness = Math.min(100, this.happiness + dt * 3.5);
        this.swimQuestTimer += dt;
        if (this.swimQuestTimer >= 2.2) {
          this.advanceQuest('q_swim', 1);
        }
      }

      // Gentle Life Needs Drain
      this.energy = Math.max(0, this.energy - (sprinting ? 2.4 : (p.swimming ? 1.5 : 0.45)) * dt);
      this.hunger = Math.max(0, this.hunger - 0.35 * dt);
      if (this.hunger <= 5) this.health = Math.max(5, this.health - 1.2 * dt);

      // Fainting / Anka Tüyü Auto-Revive!
      if (this.energy <= 0) {
        if (this.inventory.has('phoenix')) {
          this.energy = 65;
          this.popup(p.x, p.y - 38, '🪶 ANKA TÜYÜ DEVREDE! +65 Enerji', '#fb923c');
          this.burst(p.x, p.y, '#fb923c', 22);
        } else {
          this.startNextDay(true);
        }
      }

      // Record player's path for tomorrow's 4D Past-Self Echo
      this.pathSampleTimer += dt;
      if (this.pathSampleTimer >= 0.45 && this.todayPath.length < 300) {
        this.pathSampleTimer = 0;
        this.todayPath.push({ x: p.x, y: p.y });
      }

      // Animate 4D Past-Self Echo
      if (this.pastEcho && !this.pastEcho.claimed && this.yesterdayPath.length > 1) {
        this.pastEcho.idx = (this.pastEcho.idx + dt * 2.4) % this.yesterdayPath.length;
        const pt = this.yesterdayPath[Math.floor(this.pastEcho.idx)];
        this.pastEcho.x += (pt.x - this.pastEcho.x) * Math.min(1, dt * 6);
        this.pastEcho.y += (pt.y - this.pastEcho.y) * Math.min(1, dt * 6);
        if (Math.hypot(p.x - this.pastEcho.x, p.y - this.pastEcho.y) < 34) {
          this.pastEcho.claimed = true;
          this.addXp(30);
          this.happiness = Math.min(100, this.happiness + 18);
          this.audio.timeWarp();
          this.burst(this.pastEcho.x, this.pastEcho.y, '#fde047', 22);
          this.popup(p.x, p.y - 40, '✨ GEÇMİŞİNLE BARIŞTIN! +30 XP', '#fde047');
        }
      }

      // Update NPCs gently strolling near their home spots
      for (const npc of this.npcs) {
        npc.speechTimer = Math.max(0, npc.speechTimer - dt);
        npc.timer -= dt;
        if (npc.timer <= 0) {
          npc.timer = 2.5 + Math.random() * 3.5;
          npc.angle = Math.random() * Math.PI * 2;
        }
        const nx = npc.x + Math.cos(npc.angle) * 24 * dt;
        const ny = npc.y + Math.sin(npc.angle) * 24 * dt;
        if (Math.hypot(nx - npc.homeX, ny - npc.homeY) < 95 && !this.world.isInsideBuilding(nx, ny, 24)) {
          npc.x = nx; npc.y = ny; npc.walkCycle += dt * 5;
        } else {
          npc.angle += Math.PI;
        }
      }

      // Update world wildlife, ducks, boats, cars, lighthouse
      this.world.update(dt, p);

      // Update Particles & Popups & Weather
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
        if (pt.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const pp = this.popups[i];
        pp.y -= 42 * dt; pp.life -= dt;
        if (pp.life <= 0) this.popups.splice(i, 1);
      }
      for (const wp of this.weatherParticles) {
        wp.x += wp.vx * dt; wp.y += wp.vy * dt;
        if (wp.x < 0) wp.x = this.viewW;
        if (wp.y > this.viewH) { wp.y = 0; wp.x = Math.random() * this.viewW; }
      }

      // Smooth Camera Follow with subtle velocity look-ahead
      const targetX = p.x + p.vx * 0.14;
      const targetY = p.y + p.vy * 0.14;
      this.cam.x += (targetX - this.cam.x) * Math.min(1, dt * 7.5);
      this.cam.y += (targetY - this.cam.y) * Math.min(1, dt * 7.5);

      const biome = this.world.getBiome(p.x, p.y);
      this.audio.updateAmbient(dt, biome);

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
      document.getElementById('levelBadge').textContent = `LV ${this.level} • ${this.xp}/${this.level * 100} XP`;

      const hrs = Math.floor(this.timeMinutes / 60) % 24;
      const mins = Math.floor(this.timeMinutes % 60);
      const s = YD.SEASONS[this.seasonIdx];
      document.getElementById('clockBadge').textContent = `${s.icon} GÜN ${this.day} • YAŞ ${this.age} • ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      document.getElementById('biomeBadge').textContent = this.world.getBiomeLabel(biome);

      const prompt = this.findNearestInteraction();
      const promptEl = document.getElementById('interactPrompt');
      if (prompt) {
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
