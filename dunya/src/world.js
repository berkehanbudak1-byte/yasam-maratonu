/**
 * Yaşam Maratonu: Büyük Dünya — Multi-Biome Open World Generator (4200 x 3200)
 * Biomes:
 *  - Kuzey Ormanı (Forest, Cabins, Campfire, Berries, Mushrooms, Deer, Ancient Relic Altar)
 *  - Şehir Merkezi (Home, Office, Cafe, University, Antique Shop, Roads, Cars)
 *  - Yeşil Park (Park Pond, Ducks, Jogging Track, Gym Zone, Benches, Cherry Trees)
 *  - Güney Sahili & Deniz (Golden Beach, Palms, Umbrellas, Swimmable Sea, Fishing Pier, Lighthouse, Sailboats)
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

      // Key natural landmarks
      this.pond = { x: 3640, y: 1020, rx: 185, ry: 130 };
      this.pier = { x: 2140, y: 2460, w: 120, h: 340 }; // Extends out into the Sea!
      this.campfire = { x: 840, y: 860, r: 22 };
      this.altar = { x: 520, y: 420, r: 34 }; // Ancient 4D Relic Altar in deep forest
      this.lighthouse = { x: 3880, y: 2440, r: 36, beamAngle: 0 };

      this.buildWorld();
    }

    buildWorld() {
      // --- CITY BUILDINGS (Central District x: 1660..3060, y: 650..2050) ---
      const addBldg = (id, x, y, w, h, color, roof, label, actionKind, doorX, doorY) => {
        this.buildings.push({ id, x, y, w, h, color, roof, label });
        if (actionKind) {
          this.interactables.push({
            id, kind: actionKind, label,
            x: doorX ?? (x + w / 2),
            y: doorY ?? (y + h + 26),
            r: 52
          });
        }
      };

      // Player's Cozy Home
      addBldg('home', 1840, 1040, 220, 150, '#b45309', '#f59e0b', '🏠 EVİN', 'sleep', 1950, 1215);
      // Tech Office / Career Building
      addBldg('office', 2480, 960, 290, 180, '#1d4ed8', '#38bdf8', '🏢 İŞ MERKEZİ', 'work', 2625, 1165);
      // City Cafe & Bakery
      addBldg('cafe', 1840, 1460, 230, 150, '#be123c', '#fb7185', '☕ KAFE & FIRIN', 'cafe', 1955, 1635);
      // University & Library
      addBldg('uni', 2480, 1460, 290, 165, '#0f766e', '#2dd4bf', '🎓 ÜNİVERSİTE', 'study', 2625, 1650);
      // Market & 4D Antique Shop
      addBldg('shop', 2160, 680, 260, 145, '#6b21a8', '#c084fc', '🛍️ MARKET & ANTİKACI', 'shop', 2290, 850);
      // Forest Ranger Cabin
      addBldg('cabin', 1040, 740, 180, 125, '#78350f', '#b45309', '🪵 ORMAN KULÜBESİ', 'campfire', 1130, 890);

      // Extra Interactive Spots across Forest, Park & Sea!
      this.interactables.push(
        { id: 'camp',       kind: 'campfire',   label: '🔥 KAMP ATEŞİ (Dinlen)',        x: this.campfire.x, y: this.campfire.y, r: 58 },
        { id: 'altar',      kind: 'altar',      label: '⏳ ANTİK 4D SUNAK (İlham Al)',   x: this.altar.x,    y: this.altar.y,    r: 62 },
        { id: 'park_gym',   kind: 'workout',    label: '🏃 PARK SPOR ALANI (+Sağlık)',   x: 3420, y: 1450, r: 65 },
        { id: 'park_bench', kind: 'relax',      label: '🪑 GÖLET BANKI (+Mutluluk)',     x: 3640, y: 1200, r: 58 },
        { id: 'pier_fish',  kind: 'fish',       label: '🎣 İSKELE — BALIK TUT',          x: this.pier.x + this.pier.w / 2, y: this.pier.y + this.pier.h - 24, r: 66 },
        { id: 'lighthouse', kind: 'lighthouse', label: '🗼 DENİZ FENERİ (Manzara)',      x: this.lighthouse.x, y: this.lighthouse.y + 42, r: 58 }
      );

      // Streetlamps along City & Beach Promenade
      const lampSpots = [
        [1760, 1340], [2120, 1340], [2440, 1340], [2820, 1340],
        [1760, 1820], [2120, 1820], [2440, 1820], [2820, 1820],
        [1500, 2140], [2020, 2140], [2540, 2140], [3120, 2140],
        [3320, 1020], [3940, 1020]
      ];
      for (const [lx, ly] of lampSpots) this.streetlamps.push({ x: lx, y: ly });

      // Park Benches
      this.benches = [
        { x: 3640, y: 1190, angle: 0 },
        { x: 3430, y: 1020, angle: Math.PI / 2 },
        { x: 3860, y: 1020, angle: Math.PI / 2 },
        { x: 2020, y: 2155, angle: 0 },
        { x: 2620, y: 2155, angle: 0 }
      ];

      // Beach Umbrellas along the Golden Sand!
      const umbColors = ['#ef4444', '#38bdf8', '#facc15', '#ec4899', '#22c55e', '#f97316'];
      for (let i = 0; i < 14; i++) {
        const ux = 320 + i * 260 + (i % 2) * 35;
        if (Math.abs(ux - 2200) < 170) continue; // Keep pier clear
        this.umbrellas.push({
          x: ux,
          y: 2310 + (i % 3) * 45,
          r: 30,
          color: umbColors[i % umbColors.length]
        });
      }

      // --- FOREST PINE & OAK TREES (Dense lush Kuzey Ormanı!) ---
      let seed = 1337;
      const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

      for (let i = 0; i < 120; i++) {
        const tx = 90 + rand() * 1490;
        const ty = 90 + rand() * 1950;
        // Keep campfire clearing, altar, forest cabin, and forest road clear
        if (Math.hypot(tx - this.campfire.x, ty - this.campfire.y) < 135) continue;
        if (Math.hypot(tx - this.altar.x, ty - this.altar.y) < 125) continue;
        if (Math.abs(ty - 1340) < 95) continue; // Main West-East forest road
        if (this.isInsideBuilding(tx, ty, 52)) continue;
        this.trees.push({ x: tx, y: ty, r: 24 + rand() * 14, kind: rand() < 0.65 ? 'pine' : 'oak' });
      }

      // --- PARK TREES (Blossom & Oak around Green Park & Pond!) ---
      for (let i = 0; i < 62; i++) {
        const tx = 3130 + rand() * 980;
        const ty = 110 + rand() * 1900;
        if (this.isInPond(tx, ty, 65)) continue;
        if (Math.hypot(tx - 3420, ty - 1450) < 115) continue; // Keep park gym open
        if (Math.hypot(tx - 3640, ty - 1200) < 85) continue;
        this.trees.push({ x: tx, y: ty, r: 22 + rand() * 12, kind: rand() < 0.42 ? 'blossom' : 'oak' });
      }

      // --- BEACH PALM TREES ---
      for (let i = 0; i < 20; i++) {
        const px = 160 + i * 205;
        if (Math.abs(px - 2200) < 140) continue;
        this.trees.push({ x: px, y: 2205 + (i % 2) * 35, r: 24, kind: 'palm' });
      }

      // --- FORAGEABLE BERRIES & MUSHROOMS IN THE FOREST ---
      this.spawnForageables();

      // --- LIVING WILDLIFE: FOREST DEER/RABBITS, PARK DUCKS, SEA SAILBOATS, CITY CARS ---
      for (let i = 0; i < 9; i++) {
        this.wildlife.push({
          kind: i < 4 ? 'deer' : 'rabbit',
          x: 240 + rand() * 1200,
          y: 260 + rand() * 1550,
          angle: rand() * Math.PI * 2,
          speed: i < 4 ? 52 : 68,
          timer: 1 + rand() * 3
        });
      }
      for (let i = 0; i < 6; i++) {
        this.ducks.push({
          angle: (i / 6) * Math.PI * 2,
          orbitRx: 50 + rand() * 85,
          orbitRy: 35 + rand() * 55,
          speed: (0.25 + rand() * 0.25) * (i % 2 === 0 ? 1 : -1)
        });
      }
      for (let i = 0; i < 4; i++) {
        this.boats.push({
          x: 300 + i * 1000,
          y: 2740 + (i % 2) * 190,
          dir: i % 2 === 0 ? 1 : -1,
          speed: 36 + i * 10,
          sailColor: ['#ffffff', '#fde047', '#fb7185', '#38bdf8'][i]
        });
      }

      // Ambient City Road Cars (along y = 1340 and y = 1840)
      const carCols = ['#ef4444', '#facc15', '#3b82f6', '#22c55e', '#f97316'];
      for (let i = 0; i < 6; i++) {
        const roadY = i % 2 === 0 ? 1340 : 1840;
        const dir = i < 3 ? 1 : -1;
        this.cars.push({
          x: 1680 + (i * 230) % 1350,
          y: roadY + (dir === 1 ? 22 : -22),
          dir,
          speed: 120 + (i % 3) * 25,
          color: carCols[i % carCols.length]
        });
      }
    }

    spawnForageables() {
      this.forageables = [];
      const spots = [
        [320, 620, 'berry'], [480, 980, 'mushroom'], [690, 540, 'berry'],
        [920, 1180, 'mushroom'], [1240, 560, 'berry'], [1380, 1080, 'mushroom'],
        [620, 1580, 'berry'], [1150, 1680, 'mushroom'], [390, 1190, 'berry'],
        [1420, 1520, 'berry'], [3340, 620, 'berry'], [3820, 1620, 'berry']
      ];
      for (const [x, y, kind] of spots) {
        this.forageables.push({ x, y, kind, collected: false, respawnTimer: 0 });
      }
    }

    getBiome(x, y) {
      if (y >= YD.SEA_Y) return 'sea';
      if (y >= YD.BEACH_Y) return 'beach';
      if (x < YD.CITY_X1) return 'forest';
      if (x > YD.CITY_X2) return 'park';
      return 'city';
    }

    getBiomeLabel(biome) {
      const map = {
        forest: '🌲 KUZEY ORMANI',
        city:   '🏙️ ŞEHİR MERKEZİ',
        park:   '🌳 YEŞİL PARK & GÖLET',
        beach:  '🏖️ ALTIN SAHİL',
        sea:    '🌊 TURKUAZ DENİZ'
      };
      return map[biome] || 'DÜNYA';
    }

    isOnPier(x, y) {
      const p = this.pier;
      return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
    }

    isInWater(x, y) {
      if (y >= YD.SEA_Y && !this.isOnPier(x, y)) return true;
      return this.isInPond(x, y, 0);
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

    resolveCollisions(ent) {
      ent.x = Math.max(36, Math.min(YD.WORLD_W - 36, ent.x));
      ent.y = Math.max(36, Math.min(YD.WORLD_H - 60, ent.y));

      // Solid Buildings
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

      // Tree trunks (small solid center so walking through forest feels super fluid!)
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

      // Lighthouse solid tower
      {
        const dx = ent.x - this.lighthouse.x, dy = ent.y - this.lighthouse.y;
        const minR = ent.r + this.lighthouse.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < minR * minR) {
          const d = Math.sqrt(d2) || 0.01;
          ent.x = this.lighthouse.x + (dx / d) * minR;
          ent.y = this.lighthouse.y + (dy / d) * minR;
        }
      }
    }

    update(dt, player) {
      this.lighthouse.beamAngle += dt * 0.9;

      // Respawn forageables over time
      for (const fg of this.forageables) {
        if (fg.collected) {
          fg.respawnTimer -= dt;
          if (fg.respawnTimer <= 0) fg.collected = false;
        }
      }

      // Forest Wildlife (Deer & Rabbits hop away softly if player gets very close)
      for (const w of this.wildlife) {
        w.timer -= dt;
        const dPlayer = Math.hypot(player.x - w.x, player.y - w.y);
        if (dPlayer < 130) {
          w.angle = Math.atan2(w.y - player.y, w.x - player.x);
          w.x += Math.cos(w.angle) * (w.speed * 1.9) * dt;
          w.y += Math.sin(w.angle) * (w.speed * 1.9) * dt;
        } else {
          if (w.timer <= 0) {
            w.timer = 2 + Math.random() * 3.5;
            w.angle += (Math.random() - 0.5) * 2.2;
          }
          w.x += Math.cos(w.angle) * w.speed * dt;
          w.y += Math.sin(w.angle) * w.speed * dt;
        }
        w.x = Math.max(90, Math.min(YD.CITY_X1 - 80, w.x));
        w.y = Math.max(90, Math.min(YD.BEACH_Y - 110, w.y));
      }

      // Park Pond Ducks
      for (const dk of this.ducks) dk.angle += dk.speed * dt;

      // Sea Sailboats
      for (const bt of this.boats) {
        bt.x += bt.dir * bt.speed * dt;
        if (bt.x > YD.WORLD_W + 140) bt.x = -140;
        if (bt.x < -140) bt.x = YD.WORLD_W + 140;
      }

      // City Cars
      for (const c of this.cars) {
        const stopForPlayer = Math.hypot(player.x - (c.x + c.dir * 48), player.y - c.y) < 42;
        if (!stopForPlayer) {
          c.x += c.dir * c.speed * dt;
          if (c.x > YD.CITY_X2 + 40) c.x = YD.CITY_X1 - 40;
          if (c.x < YD.CITY_X1 - 40) c.x = YD.CITY_X2 + 40;
        }
      }
    }
  }

  YD.LifeWorld = LifeWorld;
})(window.YasamDunya);
