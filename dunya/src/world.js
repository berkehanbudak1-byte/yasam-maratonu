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
      this.pier = { x: 2268, y: 2860, w: 124, h: 360 };
      this.campfire = { x: 890, y: 1240, r: 22 };
      this.altar = { x: 520, y: 920, r: 34 };
      this.lighthouse = { x: 4220, y: 2830, r: 38, beamAngle: 0 };
      this.island = { x: 920, y: 3395, rx: 140, ry: 85, chestX: 920, chestY: 3378, chestOpened: false };
      this.birds = [];

      // Personal 6-Plot Organic Garden (Dedicated sunny yard between Center Hwy x=2380 and Office x=2620!)
      this.gardenBounds = { x: 2404, y: 1278, w: 184, h: 256 };
      this.gardenPlots = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          this.gardenPlots.push({
            id: row * 2 + col,
            x: 2452 + col * 88,
            y: 1326 + row * 78,
            w: 68,
            h: 50,
            crop: null,
            growth: 0,
            watered: false
          });
        }
      }

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
      addBldg('hospital', 1950, 880,  265, 145, '#dc2626', '#f8fafc', '🏥 ŞEHİR HASTANESİ', 'hospital', 2082, 1050);
      addBldg('shop',     2450, 880,  265, 145, '#6b21a8', '#c084fc', '🛍️ MARKET & GALERİ', 'shop',     2582, 1050);
      addBldg('home',     1950, 1340, 225, 145, '#b45309', '#f59e0b', '🏠 EVİN',            'home',     2062, 1510);
      addBldg('office',   2620, 1310, 285, 175, '#1d4ed8', '#38bdf8', '🏢 İŞ MERKEZİ',      'work',     2762, 1510);
      addBldg('cafe',     1950, 1875, 225, 145, '#be123c', '#fb7185', '☕ KAFE & FIRIN',     'cafe',     2062, 2045);
      addBldg('uni',      2620, 1875, 285, 160, '#0f766e', '#2dd4bf', '🎓 ÜNİVERSİTE',       'study',    2762, 2060);

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
        { id: 'lighthouse', kind: 'lighthouse', label: '🗼 DENİZ FENERİ (Manzara)',            x: this.lighthouse.x, y: this.lighthouse.y + 44, r: 58 },
        { id: 'treasure',   kind: 'treasure',   label: '🪙 ANTİK HAZİNE SANDIĞI',              x: this.island.chestX, y: this.island.chestY, r: 58 }
      );
      for (const bs of YD.BUS_STOPS) {
        this.interactables.push({ id: bs.id, kind: 'bus', label: `🚏 OTOBÜS DURAĞI (${bs.name})`, x: bs.x, y: bs.y, r: 52 });
      }

      const lampSpots = [
        [1880, 1198], [2266, 1198], [2780, 1198], [3120, 1198],
        [1880, 1658], [2266, 1658], [2780, 1658], [3120, 1658],
        [1880, 2158], [2266, 2158], [2780, 2158], [3120, 2158],
        [1600, 2520], [2120, 2520], [2640, 2520], [3220, 2520],
        [3560, 1420], [4180, 1420], [2266, 620],  [2394, 620]
      ];
      for (const [lx, ly] of lampSpots) this.streetlamps.push({ x: lx, y: ly });

      this.benches = [
        { x: 3880, y: 1595, angle: 0 },
        { x: 3650, y: 1420, angle: Math.PI / 2 },
        { x: 4110, y: 1420, angle: Math.PI / 2 },
        { x: 2120, y: 2586, angle: 0 },
        { x: 2720, y: 2586, angle: 0 }
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
        if (Math.hypot(tx - 2215, ty - 515) < 80) continue; // Keep Mountain Bus Stop clear
        if (Math.abs(tx - 2330) < 95) continue;
        if (this.isInsideBuilding(tx, ty, 52)) continue;
        this.trees.push({ x: tx, y: ty, r: 22 + rand() * 12, kind: 'snow_pine' });
      }

      // Forest Trees (keep West Ring Road, Forest Dirt Trail & Forest Bus Stop completely clear!)
      const trailSegs = [[520, 920, 890, 1240], [890, 1240, 1190, 1270], [1190, 1270, 1750, 1720]];
      const onForestTrail = (px, py, pad = 62) => trailSegs.some(([x1, y1, x2, y2]) => {
        const dx = x2 - x1, dy = y2 - y1;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) < pad;
      });
      for (let i = 0; i < 120; i++) {
        const tx = 90 + rand() * 1580;
        const ty = 780 + rand() * 1640;
        if (Math.hypot(tx - this.campfire.x, ty - this.campfire.y) < 135) continue;
        if (Math.hypot(tx - this.altar.x, ty - this.altar.y) < 125) continue;
        if (Math.hypot(tx - 1055, ty - 1365) < 75) continue; // Keep Forest Bus Stop clear
        if (onForestTrail(tx, ty, 64)) continue;
        if (this.isInsideBuilding(tx, ty, 52)) continue;
        this.trees.push({ x: tx, y: ty, r: 24 + rand() * 14, kind: rand() < 0.65 ? 'pine' : 'oak' });
      }

      // Park Trees (keep East Ring Road & Pond Jogging Loop completely clear!)
      for (let i = 0; i < 66; i++) {
        const tx = 3340 + rand() * 1140;
        const ty = 780 + rand() * 1620;
        if (this.isInPond(tx, ty, 124)) continue;
        if (Math.hypot(tx - 3640, ty - 1860) < 120) continue;
        if (Math.hypot(tx - 3880, ty - 1605) < 85) continue;
        this.trees.push({ x: tx, y: ty, r: 22 + rand() * 12, kind: rand() < 0.45 ? 'blossom' : 'oak' });
      }

      // Beach Palms + Tropical Treasure Island Palms!
      for (let i = 0; i < 22; i++) {
        const px = 140 + i * 205;
        if (Math.abs(px - 2330) < 160) continue;
        this.trees.push({ x: px, y: 2605 + (i % 2) * 35, r: 24, kind: 'palm' });
      }
      for (const [ix, iy] of [[835, 3365], [1005, 3375], [925, 3442]]) {
        this.trees.push({ x: ix, y: iy, r: 24, kind: 'palm' });
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
      // Sailboat shipping lanes strictly clear of Pier (y<=3220) AND Treasure Island (y: 3310..3480)!
      for (let i = 0; i < 5; i++) {
        this.boats.push({
          x: 280 + i * 920, y: i % 2 === 0 ? 3262 : 3535,
          dir: i % 2 === 0 ? 1 : -1, speed: 36 + i * 9,
          sailColor: ['#ffffff', '#fde047', '#fb7185', '#38bdf8', '#a7f3d0'][i]
        });
      }
      // Soaring Ghibli-style Seagulls & Forest Birds!
      for (let i = 0; i < 9; i++) {
        this.birds.push({
          x: 200 + rand() * (YD.WORLD_W - 400),
          y: 900 + rand() * 2400,
          vx: (i % 2 === 0 ? 1 : -1) * (42 + rand() * 32),
          vy: (rand() - 0.5) * 14,
          phase: rand() * Math.PI * 2
        });
      }

      // --- CONTINUOUS PARAMETRIC CLOSED-LOOP CITY TRAFFIC (DISJOINT LANES + SMART YIELD!) ---
      const R = this.ring;
      const cx = 2330; // Center Main Highway centerline (asphalt 2280..2380)

      const makeTrack = (pts) => {
        const segs = [];
        let total = 0;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          segs.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, len, start: total, angle });
          total += len;
        }
        return { segs, total };
      };

      const sampleTrack = (track, dist) => {
        const d = ((dist % track.total) + track.total) % track.total;
        for (const s of track.segs) {
          if (d <= s.start + s.len) {
            const t = (d - s.start) / (s.len || 1);
            return { x: s.ax + (s.bx - s.ax) * t, y: s.ay + (s.by - s.ay) * t, angle: s.angle };
          }
        }
        const first = track.segs[0];
        return { x: first.ax, y: first.ay, angle: first.angle };
      };
      this.sampleTrack = sampleTrack;

      // 1) Outer Clockwise Ring Loop (4 evenly spaced cars)
      const cwOuter = makeTrack([
        { x: R.left + 22,  y: R.top + 22 },
        { x: R.right - 22, y: R.top + 22 },
        { x: R.right - 22, y: R.bottom - 22 },
        { x: R.left + 22,  y: R.bottom - 22 }
      ]);
      // 2) Outer Counter-Clockwise Ring Loop (4 evenly spaced cars, opposite lane — 100% disjoint from cwOuter!)
      const ccwOuter = makeTrack([
        { x: R.left - 22,  y: R.bottom + 22 },
        { x: R.right + 22, y: R.bottom + 22 },
        { x: R.right + 22, y: R.top - 22 },
        { x: R.left - 22,  y: R.top - 22 }
      ]);
      // 3) Center Highway Scenic Loop (Mountain Lookout Roundabout y=460 <-> Beachfront Roundabout y=2460!)
      const hwyLoop = makeTrack([
        { x: cx - 22, y: 470 },
        { x: cx - 22, y: 2455 },
        { x: cx,      y: 2478 },
        { x: cx + 22, y: 2455 },
        { x: cx + 22, y: 470 },
        { x: cx,      y: 448 }
      ]);
      // 4) Mid Boulevard Two-Way Shuttle Loop (x=1890 <-> x=3110 on y=1720 ± 20!)
      const midShuttle = makeTrack([
        { x: 1895, y: R.mid + 20 },
        { x: 3105, y: R.mid + 20 },
        { x: 3128, y: R.mid },
        { x: 3105, y: R.mid - 20 },
        { x: 1895, y: R.mid - 20 },
        { x: 1872, y: R.mid }
      ]);

      const loopSpecs = [
        { id: 'cw',  priority: 1, track: cwOuter,    speed: 160, cars: [['#ef4444', false], ['#facc15', true], ['#3b82f6', false], ['#a855f7', false]] },
        { id: 'ccw', priority: 1, track: ccwOuter,   speed: 160, cars: [['#22c55e', false], ['#f97316', false], ['#ec4899', false], ['#06b6d4', false]] },
        { id: 'hwy', priority: 2, track: hwyLoop,    speed: 155, cars: [['#facc15', true],  ['#10b981', false], ['#ef4444', false]] },
        { id: 'mid', priority: 3, track: midShuttle, speed: 145, cars: [['#facc15', true],  ['#38bdf8', false]] }
      ];

      this.cars = [];
      let carId = 0;
      for (const spec of loopSpecs) {
        spec.cars.forEach(([color, isTaxi], i) => {
          const loopDist = (i / spec.cars.length) * spec.track.total;
          const pos = sampleTrack(spec.track, loopDist);
          this.cars.push({
            id: carId++,
            loopId: spec.id,
            priority: spec.priority,
            track: spec.track,
            loopDist,
            x: pos.x,
            y: pos.y,
            angle: pos.angle,
            speed: spec.speed,
            curSpeed: spec.speed,
            color,
            isTaxi,
            brakeTimer: 0,
            hitCd: 0
          });
        });
      }
    }

    spawnForageables() {
      this.forageables = [];
      const spots = [
        [340, 1020, 'berry'], [520, 1380, 'mushroom'], [720, 960, 'berry'],
        [980, 1580, 'mushroom'], [1320, 960, 'berry'], [1410, 1610, 'mushroom'],
        [660, 1980, 'berry'], [1220, 2080, 'mushroom'], [420, 1590, 'berry'],
        [1500, 1920, 'berry'], [3520, 1020, 'berry'], [4040, 2020, 'berry'],
        [1240, 380, 'crystal'], [2880, 320, 'crystal'], [3440, 420, 'crystal'], [1840, 210, 'crystal']
      ];
      for (const [x, y, kind] of spots) {
        this.forageables.push({ x, y, kind, collected: false, respawnTimer: 0 });
      }
    }

    getBiome(x, y) {
      if (this.isOnIsland(x, y)) return 'island';
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
        sea:      '🌊 TURKUAZ DENİZ',
        island:   '🏝️ TROPİK HAZİNE ADASI'
      };
      return map[biome] || 'BÜYÜK DÜNYA';
    }

    isOnPier(x, y) {
      const p = this.pier;
      return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
    }

    isOnIsland(x, y, pad = 0) {
      const isl = this.island;
      const dx = (x - isl.x) / (isl.rx + pad), dy = (y - isl.y) / (isl.ry + pad);
      return dx * dx + dy * dy <= 1;
    }

    isInHotSpring(x, y) {
      const hs = this.hotSpring;
      const dx = (x - hs.x) / hs.rx, dy = (y - hs.y) / hs.ry;
      return dx * dx + dy * dy <= 1;
    }

    isInWater(x, y) {
      if (y >= YD.SEA_Y && !this.isOnPier(x, y) && !this.isOnIsland(x, y)) return true;
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

    isOnRoad(x, y, pad = 0) {
      const R = this.ring, hrw = 50 + pad;
      // Center Highway (x: 2280..2380, y: 420..2560)
      if (x >= 2280 - pad && x <= 2380 + pad && y >= 420 - pad && y <= YD.BEACH_Y + pad) return true;
      // Horizontal Ring Boulevards
      if (x >= R.left - hrw && x <= R.right + hrw) {
        if (Math.abs(y - R.top) <= hrw || Math.abs(y - R.mid) <= hrw || Math.abs(y - R.bottom) <= hrw) return true;
      }
      // Vertical Ring Avenues
      if (y >= R.top - hrw && y <= R.bottom + hrw) {
        if (Math.abs(x - R.left) <= hrw || Math.abs(x - R.right) <= hrw) return true;
      }
      return false;
    }

    resolveCollisions(ent, isCar = false) {
      ent.x = Math.max(40, Math.min(YD.WORLD_W - 40, ent.x));
      ent.y = Math.max(40, Math.min(isCar ? YD.SEA_Y - 34 : YD.WORLD_H - 60, ent.y));

      const pushBox = (bx, by, bw, bh, extraR = 0) => {
        const rad = (ent.r || 16) + extraR;
        const cx = Math.max(bx, Math.min(ent.x, bx + bw));
        const cy = Math.max(by, Math.min(ent.y, by + bh));
        const dx = ent.x - cx, dy = ent.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < rad * rad) {
          const d = Math.sqrt(d2) || 0.01;
          ent.x += (dx / d) * (rad - d);
          ent.y += (dy / d) * (rad - d);
        }
      };

      for (const b of this.buildings) pushBox(b.x, b.y, b.w, b.h);
      if (isCar && this.gardenBounds) {
        pushBox(this.gardenBounds.x, this.gardenBounds.y, this.gardenBounds.w, this.gardenBounds.h, 8);
      }

      for (const tr of this.trees) {
        const trunkR = 10;
        const dx = ent.x - tr.x, dy = ent.y - tr.y;
        const minR = (ent.r || 16) + trunkR;
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
        const minR = (ent.r || 16) + solid.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < minR * minR) {
          const d = Math.sqrt(d2) || 0.01;
          ent.x = solid.x + (dx / d) * minR;
          ent.y = solid.y + (dy / d) * minR;
        }
      }
    }

    update(dt, player, onCarHitPlayer, weatherId) {
      this.lighthouse.beamAngle += dt * 0.9;

      // Grow organic garden crops (2x speed when watered; rain auto-waters!)
      const raining = weatherId === 'rain' || weatherId === 'storm';
      for (const plot of this.gardenPlots) {
        if (!plot.crop) continue;
        if (raining) plot.watered = true;
        if (plot.growth < 1) {
          const info = YD.CROPS[plot.crop];
          const rate = (plot.watered ? 2.0 : 1.0) / (info ? info.growSec : 40);
          plot.growth = Math.min(1, plot.growth + dt * rate);
        }
      }

      for (const fg of this.forageables) {
        if (fg.collected) {
          fg.respawnTimer -= dt;
          if (fg.respawnTimer <= 0) fg.collected = false;
        }
      }
      for (const w of this.wildlife) {
        w.timer -= dt;
        const dPlayer = Math.hypot(player.x - w.x, player.y - w.y);
        let nx = w.x, ny = w.y;
        if (dPlayer < 130) {
          w.angle = Math.atan2(w.y - player.y, w.x - player.x);
          nx += Math.cos(w.angle) * (w.speed * 1.9) * dt;
          ny += Math.sin(w.angle) * (w.speed * 1.9) * dt;
        } else {
          if (w.timer <= 0) { w.timer = 2 + Math.random() * 3.5; w.angle += (Math.random() - 0.5) * 2.2; }
          nx += Math.cos(w.angle) * w.speed * dt; ny += Math.sin(w.angle) * w.speed * dt;
        }
        if (this.isInsideBuilding(nx, ny, 22) || Math.hypot(nx - this.campfire.x, ny - this.campfire.y) < 55) {
          w.angle += Math.PI * 0.75;
        } else {
          w.x = Math.max(90, Math.min(YD.CITY_X1 - 80, nx));
          w.y = Math.max(YD.MOUNTAIN_Y + 60, Math.min(YD.BEACH_Y - 110, ny));
        }
      }
      for (const dk of this.ducks) dk.angle += dk.speed * dt;
      for (const bt of this.boats) {
        bt.x += bt.dir * bt.speed * dt;
        if (bt.x > YD.WORLD_W + 140) bt.x = -140;
        if (bt.x < -140) bt.x = YD.WORLD_W + 140;
      }
      for (const bd of this.birds) {
        bd.x += bd.vx * dt;
        bd.y += bd.vy * dt + Math.sin(bd.phase + bd.x * 0.008) * 10 * dt;
        if (bd.x > YD.WORLD_W + 120) bd.x = -120;
        if (bd.x < -120) bd.x = YD.WORLD_W + 120;
        if (bd.y < 760 || bd.y > YD.WORLD_H - 120) bd.vy *= -1;
      }

      // --- CONTINUOUS PARAMETRIC CLOSED-LOOP TRAFFIC + SMART CROSSWALK YIELD + PLAYER DAMAGE! ---
      for (const c of this.cars) {
        c.brakeTimer = Math.max(0, c.brakeTimer - dt);
        c.hitCd = Math.max(0, c.hitCd - dt);

        let yielding = false;
        const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
        for (const other of this.cars) {
          if (other === c) continue;
          const dx = other.x - c.x, dy = other.y - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 140) continue;

          // Project other car onto our forward & lateral axes
          const fwd = dx * fx + dy * fy;
          const lat = Math.abs(-dx * fy + dy * fx);
          const sameDir = (fx * Math.cos(other.angle) + fy * Math.sin(other.angle)) > 0.5;

          if (other.loopId === c.loopId) {
            // Same loop: only keep safe following distance behind a car moving in the SAME direction
            if (sameDir && fwd > 12 && fwd < 84 && lat < 24) { yielding = true; break; }
          } else {
            // Different loop (perpendicular crossing!): stop cleanly BEFORE the intersection box!
            if (c.priority > other.priority && fwd > 12 && fwd < 122 && lat < 86) {
              yielding = true; break;
            }
            // Even higher-priority cars brake ONLY if a crossing car is actively moving directly across their bumper (zero deadlock!)
            if (c.priority < other.priority && other.curSpeed > 20 && fwd > 18 && fwd < 72 && lat < 34) {
              yielding = true; break;
            }
          }
        }
        c.yielding = yielding;

        const wantSpeed = (c.brakeTimer > 0 || yielding) ? 0 : c.speed;
        c.curSpeed += (wantSpeed - c.curSpeed) * Math.min(1, dt * (yielding ? 22 : 10));
        if (yielding && c.curSpeed < 12) c.curSpeed = 0;

        c.loopDist = (c.loopDist + c.curSpeed * dt) % c.track.total;
        const pos = this.sampleTrack(c.track, c.loopDist);
        c.x = pos.x;
        c.y = pos.y;

        // Smooth visual turning around corners while locked cleanly onto asphalt!
        let diff = pos.angle - c.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        c.angle += diff * Math.min(1, dt * 16);

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
