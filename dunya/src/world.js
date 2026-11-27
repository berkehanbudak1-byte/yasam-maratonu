/**
 * Yaşam Maratonu: Büyük Dünya v3 — 5-Biome Open World with Closed City Ring-Road Traffic!
 * Cars continuously loop around the 4-sided City Ring Avenue (turning corners smoothly,
 * NEVER disappearing at road ends!) and can collide with careless pedestrians.
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  class LifeWorld {
    constructor() {
      this.buildings = [];
      this.interactables = [];
      this.trees = [];
      this.forageables = [];
      this.wildlife = [];
      this.ducks = [];
      this.boats = [];
      this.cars = [];
      this.benches = [];
      this.umbrellas = [];
      this.streetlamps = [];

      // Closed 4-Sided City Ring Road Coordinates
      this.ring = { left: 1800, right: 3200, top: 1140, mid: 1720, bottom: 2220 };

      // Iconic Natural Landmarks across all 5 Biomes
      this.hotSpring = { x: 2560, y: 390, rx: 115, ry: 72 };
      this.summitRock = { x: 2040, y: 240, r: 40 };
      this.pond = { x: 3880, y: 1420, rx: 195, ry: 135 };
      this.pier = { x: 2240, y: 2860, w: 124, h: 360 };
      this.campfire = { x: 890, y: 1240, r: 22 };
      this.altar = { x: 520, y: 920, r: 34 };
      this.lighthouse = { x: 4220, y: 2830, r: 38, beamAngle: 0 };

      this.buildWorld();
    }

    buildWorld() {
      const addBldg = (id, x, y, w, h, color, roof, label, actionKind, doorX, doorY) => {
        this.buildings.push({ id, x, y, w, h, color, roof, label });
        if (actionKind) {
          this.interactables.push({
            id, kind: actionKind, label,
            x: doorX ?? (x + w / 2),
            y: doorY ?? (y + h + 26),
            r: 54
          });
        }
      };

      // Mountain Lodge
      addBldg('lodge', 1520, 290, 210, 130, '#78350f', '#e2e8f0', '🏔️ DAĞ KULÜBESİ', 'lodge', 1625, 445);

      // City Buildings positioned cleanly INSIDE the closed Ring Road blocks!
      addBldg('home',   1950, 1340, 225, 145, '#b45309', '#f59e0b', '🏠 EVİN', 'home',  2062, 1510);
      addBldg('office', 2620, 1310, 285, 175, '#1d4ed8', '#38bdf8', '🏢 İŞ MERKEZİ', 'work',  2762, 1510);
      addBldg('cafe',   1950, 1875, 225, 145, '#be123c', '#fb7185', '☕ KAFE & FIRIN', 'cafe', 2062, 2045);
      addBldg('uni',    2620, 1875, 285, 160, '#0f766e', '#2dd4bf', '🎓 ÜNİVERSİTE', 'study', 2762, 2060);
      addBldg('shop',   2450, 880,  265, 145, '#6b21a8', '#c084fc', '🛍️ MARKET & GALERİ', 'shop', 2582, 1050);

      // Forest Cabin
      addBldg('cabin', 1100, 1120, 180, 125, '#78350f', '#b45309', '🪵 ORMAN KULÜBESİ', 'campfire', 1190, 1270);

      this.interactables.push(
        { id: 'hotspring',  kind: 'hotspring',  label: '♨️ SICAK KAPLICA (+Sağlık & Enerji)', x: this.hotSpring.x, y: this.hotSpring.y + 88, r: 72 },
        { id: 'summit',     kind: 'summit',     label: '🪨 SİSYPHOS ZİRVE KAYASI (+50 XP)',   x: this.summitRock.x, y: this.summitRock.y + 44, r: 64 },
        { id: 'camp',       kind: 'campfire',   label: '🔥 KAMP ATEŞİ (Dinlen)',              x: this.campfire.x, y: this.campfire.y, r: 58 },
        { id: 'altar',      kind: 'altar',      label: '⏳ ANTİK 4D SUNAK (İlham Al)',         x: this.altar.x, y: this.altar.y, r: 62 },
        { id: 'park_gym',   kind: 'workout',    label: '🏃 PARK SPOR ALANI (+Sağlık)',         x: 3640, y: 1860, r: 66 },
        { id: 'park_bench', kind: 'relax',      label: '🪑 GÖLET BANKI (+Mutluluk)',           x: 3880, y: 1605, r: 58 },
        { id: 'pier_fish',  kind: 'fish',       label: '🎣 İSKELE — BALIK TUT',               x: this.pier.x + this.pier.w / 2, y: this.pier.y + this.pier.h - 24, r: 68 },
        { id: 'lighthouse', kind: 'lighthouse', label: '🗼 DENİZ FENERİ (Manzara)',            x: this.lighthouse.x, y: this.lighthouse.y + 44, r: 58 }
      );

      const lampSpots = [
        [1880, 1190], [2280, 1190], [2780, 1190], [3120, 1190],
        [1880, 1660], [2280, 1660], [2780, 1660], [3120, 1660],
        [1880, 2160], [2280, 2160], [2780, 2160], [3120, 2160],
        [1600, 2540], [2120, 2540], [2640, 2540], [3220, 2540],
        [3560, 1420], [4180, 1420], [2330, 620]
      ];
      for (const [lx, ly] of lampSpots) this.streetlamps.push({ x: lx, y: ly });

      this.benches = [
        { x: 3880, y: 1595, angle: 0 },
        { x: 3650, y: 1420, angle: Math.PI / 2 },
        { x: 4110, y: 1420, angle: Math.PI / 2 },
        { x: 2120, y: 2555, angle: 0 },
        { x: 2720, y: 2555, angle: 0 }
      ];

      const umbColors = ['#ef4444', '#38bdf8', '#facc15', '#ec4899', '#22c55e', '#f97316'];
      for (let i = 0; i < 16; i++) {
        const ux = 280 + i * 265 + (i % 2) * 30;
        if (Math.abs(ux - 2300) < 180) continue;
        this.umbrellas.push({ x: ux, y: 2710 + (i % 3) * 44, r: 30, color: umbColors[i % umbColors.length] });
      }

      let seed = 2026;
      const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

      // Snowy Mountain Pines
      for (let i = 0; i < 75; i++) {
        const tx = 100 + rand() * (YD.WORLD_W - 200);
        const ty = 85 + rand() * 590;
        if (Math.hypot(tx - this.hotSpring.x, ty - this.hotSpring.y) < 165) continue;
        if (Math.hypot(tx - this.summitRock.x, ty - this.summitRock.y) < 110) continue;
        if (Math.abs(tx - 2330) < 95) continue;
        if (this.isInsideBuilding(tx, ty, 52)) continue;
        this.trees.push({ x: tx, y: ty, r: 22 + rand() * 12, kind: 'snow_pine' });
      }

      // Forest Trees (keep West Ring Road x=1800 clear!)
      for (let i = 0; i < 120; i++) {
        const tx = 90 + rand() * 1580;
        const ty = 780 + rand() * 1640;
        if (Math.hypot(tx - this.campfire.x, ty - this.campfire.y) < 135) continue;
        if (Math.hypot(tx - this.altar.x, ty - this.altar.y) < 125) continue;
        if (Math.abs(ty - 1720) < 95) continue;
        if (this.isInsideBuilding(tx, ty, 52)) continue;
        this.trees.push({ x: tx, y: ty, r: 24 + rand() * 14, kind: rand() < 0.65 ? 'pine' : 'oak' });
      }

      // Park Trees (keep East Ring Road x=3200 clear!)
      for (let i = 0; i < 66; i++) {
        const tx = 3340 + rand() * 1140;
        const ty = 780 + rand() * 1620;
        if (this.isInPond(tx, ty, 68)) continue;
        if (Math.hypot(tx - 3640, ty - 1860) < 115) continue;
        if (Math.hypot(tx - 3880, ty - 1605) < 85) continue;
        this.trees.push({ x: tx, y: ty, r: 22 + rand() * 12, kind: rand() < 0.45 ? 'blossom' : 'oak' });
      }

      // Beach Palms
      for (let i = 0; i < 22; i++) {
        const px = 140 + i * 205;
        if (Math.abs(px - 2300) < 150) continue;
        this.trees.push({ x: px, y: 2605 + (i % 2) * 35, r: 24, kind: 'palm' });
      }

      this.spawnForageables();

      for (let i = 0; i < 10; i++) {
        this.wildlife.push({
          kind: i < 4 ? 'deer' : 'rabbit',
          x: 240 + rand() * 1320, y: 860 + rand() * 1450,
          angle: rand() * Math.PI * 2, speed: i < 4 ? 52 : 68, timer: 1 + rand() * 3
        });
      }
      for (let i = 0; i < 7; i++) {
        this.ducks.push({
          angle: (i / 7) * Math.PI * 2,
          orbitRx: 52 + rand() * 90, orbitRy: 38 + rand() * 58,
          speed: (0.25 + rand() * 0.25) * (i % 2 === 0 ? 1 : -1)
        });
      }
      for (let i = 0; i < 5; i++) {
        this.boats.push({
          x: 280 + i * 920, y: 3140 + (i % 2) * 195,
          dir: i % 2 === 0 ? 1 : -1, speed: 36 + i * 9,
          sailColor: ['#ffffff', '#fde047', '#fb7185', '#38bdf8', '#a7f3d0'][i]
        });
      }

      // --- CONTINUOUS CLOSED-LOOP CITY TRAFFIC (NEVER DISAPPEARS!) ---
      const R = this.ring;
      // Outer Clockwise Loop (Right-hand lane offset +22px)
      const cwOuter = [
        { x: R.left + 22,  y: R.top + 22 },
        { x: R.right - 22, y: R.top + 22 },
        { x: R.right - 22, y: R.bottom - 22 },
        { x: R.left + 22,  y: R.bottom - 22 }
      ];
      // Inner Counter-Clockwise Loop (Opposite lane offset -22px)
      const ccwInner = [
        { x: R.left - 22,  y: R.bottom + 22 },
        { x: R.right + 22, y: R.bottom + 22 },
        { x: R.right + 22, y: R.top - 22 },
        { x: R.left - 22,  y: R.top - 22 }
      ];
      // Mid-City Figure Loop (uses Middle Blvd y=1720!)
      const midLoop = [
        { x: R.left + 22,  y: R.mid + 20 },
        { x: R.right - 22, y: R.mid + 20 },
        { x: R.right - 22, y: R.bottom - 22 },
        { x: R.left + 22,  y: R.bottom - 22 }
      ];

      const carConfigs = [
        { route: cwOuter,  wp: 0, t: 0.2, color: '#ef4444', speed: 165, isTaxi: false },
        { route: cwOuter,  wp: 1, t: 0.5, color: '#facc15', speed: 185, isTaxi: true  },
        { route: cwOuter,  wp: 2, t: 0.3, color: '#3b82f6', speed: 155, isTaxi: false },
        { route: ccwInner, wp: 0, t: 0.4, color: '#22c55e', speed: 170, isTaxi: false },
        { route: ccwInner, wp: 2, t: 0.6, color: '#f97316', speed: 160, isTaxi: false },
        { route: midLoop,  wp: 0, t: 0.5, color: '#facc15', speed: 175, isTaxi: true  },
        { route: midLoop,  wp: 2, t: 0.2, color: '#a855f7', speed: 150, isTaxi: false }
      ];

      this.cars = carConfigs.map((cfg) => {
        const a = cfg.route[cfg.wp];
        const b = cfg.route[(cfg.wp + 1) % cfg.route.length];
        return {
          route: cfg.route,
          wpIdx: (cfg.wp + 1) % cfg.route.length,
          x: a.x + (b.x - a.x) * cfg.t,
          y: a.y + (b.y - a.y) * cfg.t,
          angle: Math.atan2(b.y - a.y, b.x - a.x),
          speed: cfg.speed,
          curSpeed: cfg.speed,
          color: cfg.color,
          isTaxi: cfg.isTaxi,
          brakeTimer: 0,
          hitCd: 0
        };
      });
    }

    spawnForageables() {
      this.forageables = [];
      const spots = [
        [340, 1020, 'berry'], [520, 1380, 'mushroom'], [720, 960, 'berry'],
        [980, 1580, 'mushroom'], [1320, 960, 'berry'], [1460, 1480, 'mushroom'],
        [660, 1980, 'berry'], [1220, 2080, 'mushroom'], [420, 1590, 'berry'],
        [1500, 1920, 'berry'], [3520, 1020, 'berry'], [4040, 2020, 'berry'],
        [1240, 380, 'crystal'], [2880, 320, 'crystal'], [3440, 420, 'crystal'], [1840, 210, 'crystal']
      ];
      for (const [x, y, kind] of spots) {
        this.forageables.push({ x, y, kind, collected: false, respawnTimer: 0 });
      }
    }

    getBiome(x, y) {
      if (y < YD.MOUNTAIN_Y) return 'mountain';
      if (y >= YD.SEA_Y) return 'sea';
      if (y >= YD.BEACH_Y) return 'beach';
      if (x < YD.CITY_X1) return 'forest';
      if (x > YD.CITY_X2) return 'park';
      return 'city';
    }

    getBiomeLabel(biome) {
      const map = {
        mountain: '🏔️ KARLI ZİRVE & KAPLICA',
        forest:   '🌲 KUZEY ORMANI',
        city:     '🏙️ ŞEHİR MERKEZİ',
        park:     '🌳 YEŞİL PARK & GÖLET',
        beach:    '🏖️ ALTIN SAHİL',
        sea:      '🌊 TURKUAZ DENİZ'
      };
      return map[biome] || 'BÜYÜK DÜNYA';
    }

    isOnPier(x, y) {
      const p = this.pier;
      return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
    }

    isInHotSpring(x, y) {
      const hs = this.hotSpring;
      const dx = (x - hs.x) / hs.rx, dy = (y - hs.y) / hs.ry;
      return dx * dx + dy * dy <= 1;
    }

    isInWater(x, y) {
      if (y >= YD.SEA_Y && !this.isOnPier(x, y)) return true;
      if (this.isInPond(x, y, 0)) return true;
      return this.isInHotSpring(x, y);
    }

    isInPond(x, y, pad = 0) {
      const dx = (x - this.pond.x) / (this.pond.rx + pad);
      const dy = (y - this.pond.y) / (this.pond.ry + pad);
      return dx * dx + dy * dy <= 1;
    }

    isInsideBuilding(x, y, pad = 0) {
      for (const b of this.buildings) {
        if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) return b;
      }
      return null;
    }

    resolveCollisions(ent, isCar = false) {
      ent.x = Math.max(40, Math.min(YD.WORLD_W - 40, ent.x));
      ent.y = Math.max(40, Math.min(isCar ? YD.SEA_Y - 34 : YD.WORLD_H - 60, ent.y));

      for (const b of this.buildings) {
        const cx = Math.max(b.x, Math.min(ent.x, b.x + b.w));
        const cy = Math.max(b.y, Math.min(ent.y, b.y + b.h));
        const dx = ent.x - cx, dy = ent.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < ent.r * ent.r) {
          const d = Math.sqrt(d2) || 0.01;
          ent.x += (dx / d) * (ent.r - d);
          ent.y += (dy / d) * (ent.r - d);
        }
      }

      for (const tr of this.trees) {
        const trunkR = 10;
        const dx = ent.x - tr.x, dy = ent.y - tr.y;
        const minR = ent.r + trunkR;
        const d2 = dx * dx + dy * dy;
        if (d2 < minR * minR) {
          const d = Math.sqrt(d2) || 0.01;
          ent.x = tr.x + (dx / d) * minR;
          ent.y = tr.y + (dy / d) * minR;
        }
      }

      if (isCar && (this.isInPond(ent.x, ent.y, 18) || this.isInHotSpring(ent.x, ent.y))) {
        ent.y += 16;
      }

      for (const solid of [this.lighthouse, this.summitRock]) {
        const dx = ent.x - solid.x, dy = ent.y - solid.y;
        const minR = ent.r + solid.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < minR * minR) {
          const d = Math.sqrt(d2) || 0.01;
          ent.x = solid.x + (dx / d) * minR;
          ent.y = solid.y + (dy / d) * minR;
        }
      }
    }

    update(dt, player, onCarHitPlayer) {
      this.lighthouse.beamAngle += dt * 0.9;
      for (const fg of this.forageables) {
        if (fg.collected) {
          fg.respawnTimer -= dt;
          if (fg.respawnTimer <= 0) fg.collected = false;
        }
      }
      for (const w of this.wildlife) {
        w.timer -= dt;
        const dPlayer = Math.hypot(player.x - w.x, player.y - w.y);
        if (dPlayer < 130) {
          w.angle = Math.atan2(w.y - player.y, w.x - player.x);
          w.x += Math.cos(w.angle) * (w.speed * 1.9) * dt;
          w.y += Math.sin(w.angle) * (w.speed * 1.9) * dt;
        } else {
          if (w.timer <= 0) { w.timer = 2 + Math.random() * 3.5; w.angle += (Math.random() - 0.5) * 2.2; }
          w.x += Math.cos(w.angle) * w.speed * dt; w.y += Math.sin(w.angle) * w.speed * dt;
        }
        w.x = Math.max(90, Math.min(YD.CITY_X1 - 80, w.x));
        w.y = Math.max(YD.MOUNTAIN_Y + 60, Math.min(YD.BEACH_Y - 110, w.y));
      }
      for (const dk of this.ducks) dk.angle += dk.speed * dt;
      for (const bt of this.boats) {
        bt.x += bt.dir * bt.speed * dt;
        if (bt.x > YD.WORLD_W + 140) bt.x = -140;
        if (bt.x < -140) bt.x = YD.WORLD_W + 140;
      }

      // --- CONTINUOUS RING-ROAD TRAFFIC + PLAYER COLLISION DAMAGE! ---
      for (const c of this.cars) {
        c.brakeTimer = Math.max(0, c.brakeTimer - dt);
        c.hitCd = Math.max(0, c.hitCd - dt);

        const target = c.route[c.wpIdx];
        const dx = target.x - c.x;
        const dy = target.y - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 26) {
          c.wpIdx = (c.wpIdx + 1) % c.route.length;
        } else {
          // Smooth corner turning angle interpolation!
          const desiredAngle = Math.atan2(dy, dx);
          let diff = desiredAngle - c.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          c.angle += diff * Math.min(1, dt * 8);
        }

        // Check if another car is directly ahead to prevent overlapping
        let blockedByCar = false;
        const frontX = c.x + Math.cos(c.angle) * 64;
        const frontY = c.y + Math.sin(c.angle) * 64;
        for (const other of this.cars) {
          if (other !== c && Math.hypot(other.x - frontX, other.y - frontY) < 42) {
            blockedByCar = true; break;
          }
        }

        const wantSpeed = (c.brakeTimer > 0 || blockedByCar) ? 0 : c.speed;
        c.curSpeed += (wantSpeed - c.curSpeed) * Math.min(1, dt * 7);

        c.x += Math.cos(c.angle) * c.curSpeed * dt;
        c.y += Math.sin(c.angle) * c.curSpeed * dt;

        // Player Collision Check (Car hits player if player steps into moving traffic!)
        const hitDist = player.inCar ? 48 : 36;
        if (c.hitCd <= 0 && c.curSpeed > 45 && Math.hypot(player.x - c.x, player.y - c.y) < hitDist) {
          c.hitCd = 1.4;
          c.brakeTimer = 0.85; // Car slams brakes & flashes hazards after hitting you!
          if (onCarHitPlayer) onCarHitPlayer(c);
        }
      }
    }
  }

  YD.LifeWorld = LifeWorld;
})(window.YasamDunya);
