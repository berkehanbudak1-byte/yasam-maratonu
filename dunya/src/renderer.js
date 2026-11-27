/**
 * Yaşam Maratonu: Büyük Dünya v2.5 — Illustrated Ghibli-Inspired 60 FPS HD 2D Renderer
 * Features: Wildflowers & Grass Tufts, Scalloped Wavy Coastline + Water Sun-Glints,
 * Pitched Tiled Roofs with Smoking Chimneys, Multi-Tier Canopy Trees, Drifting Cloud Shadows,
 * Night Fireflies, Detailed Backpack Character, Spoked Bicycle, Glossy Car & Vignette!
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  class WorldRenderer {
    constructor(canvas, miniCanvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      if (this.ctx) {
        const rawFill = this.ctx.fillText.bind(this.ctx);
        const rawMeasure = this.ctx.measureText.bind(this.ctx);
        this.ctx.fillText = (text, x, y, maxW) => {
          const out = (YD.tr && typeof text === 'string') ? YD.tr(text) : text;
          return maxW !== undefined ? rawFill(out, x, y, maxW) : rawFill(out, x, y);
        };
        this.ctx.measureText = (text) => rawMeasure((YD.tr && typeof text === 'string') ? YD.tr(text) : text);
      }
      this.miniCanvas = miniCanvas;
      this.miniCtx = miniCanvas.getContext('2d');

      // Pre-seeded deterministic decorative details for buttery 60 FPS
      this.flowers = [];
      this.grassTufts = [];
      this.rocks = [];
      this.seaSparkles = [];
      this.fireflies = [];
      this.clouds = [];
      this.initDecorations();
    }

    initDecorations() {
      let s = 90210;
      const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

      const flowerCols = ['#fef08a', '#f9a8d4', '#ffffff', '#c4b5fd', '#fdba74'];
      for (let i = 0; i < 240; i++) {
        const inPark = i % 2 === 0;
        const fx = inPark ? (YD.CITY_X2 + 40 + rnd() * 1260) : (60 + rnd() * (YD.CITY_X1 - 120));
        const fy = YD.MOUNTAIN_Y + 40 + rnd() * (YD.BEACH_Y - YD.MOUNTAIN_Y - 90);
        this.flowers.push({ x: fx, y: fy, color: flowerCols[i % flowerCols.length], r: 3 + rnd() * 2.5 });
      }
      for (let i = 0; i < 320; i++) {
        const gx = 60 + rnd() * (YD.WORLD_W - 120);
        const gy = YD.MOUNTAIN_Y + 30 + rnd() * (YD.BEACH_Y - YD.MOUNTAIN_Y - 60);
        if (gx > YD.CITY_X1 && gx < YD.CITY_X2 && gy > 1000) continue;
        this.grassTufts.push({ x: gx, y: gy, size: 5 + rnd() * 5 });
      }
      for (let i = 0; i < 55; i++) {
        const rx = 80 + rnd() * (YD.WORLD_W - 160);
        const ry = 80 + rnd() * (YD.MOUNTAIN_Y - 120);
        if (Math.hypot(rx - 2560, ry - 390) < 160) continue; // Hot Spring
        if (Math.hypot(rx - 2040, ry - 240) < 88) continue;  // Summit Rock
        if (Math.abs(rx - 2330) < 105) continue;             // Mountain Highway & Roundabout
        if (rx > 1480 && rx < 1770 && ry > 250 && ry < 460) continue; // Mountain Lodge
        this.rocks.push({
          x: rx, y: ry,
          rx: 12 + rnd() * 18, ry: 8 + rnd() * 12
        });
      }
      for (let i = 0; i < 95; i++) {
        this.seaSparkles.push({
          x: 60 + rnd() * (YD.WORLD_W - 120),
          y: YD.SEA_Y + 25 + rnd() * (YD.WORLD_H - YD.SEA_Y - 60),
          phase: rnd() * Math.PI * 2
        });
      }
      for (let i = 0; i < 45; i++) {
        const inPark = i % 3 === 0;
        this.fireflies.push({
          x: inPark ? (YD.CITY_X2 + 80 + rnd() * 1150) : (100 + rnd() * (YD.CITY_X1 - 200)),
          y: YD.MOUNTAIN_Y + 80 + rnd() * (YD.BEACH_Y - YD.MOUNTAIN_Y - 160),
          phase: rnd() * Math.PI * 2
        });
      }
      for (let i = 0; i < 10; i++) {
        this.clouds.push({
          x: rnd() * YD.WORLD_W,
          y: 250 + rnd() * (YD.WORLD_H - 500),
          rx: 150 + rnd() * 170,
          ry: 70 + rnd() * 65,
          speed: 14 + rnd() * 14
        });
      }
    }

    render(game) {
      if (game.scene === 'home') {
        this.renderHomeInterior(game);
        return;
      }

      const ctx = this.ctx;
      const vw = game.viewW, vh = game.viewH;
      ctx.clearRect(0, 0, vw, vh);

      const season = YD.SEASONS[game.seasonIdx];
      const weather = YD.WEATHERS[game.weatherIdx];
      const now = performance.now() * 0.001;
      const nightAlpha = this.getNightAlpha(game.timeMinutes);

      // Compute visible world bounds for ultra-fast culling (steady 60 FPS!)
      const halfW = (vw / 2) / game.cam.zoom + 160;
      const halfH = (vh / 2) / game.cam.zoom + 160;
      const viewBox = {
        x1: game.cam.x - halfW, x2: game.cam.x + halfW,
        y1: game.cam.y - halfH, y2: game.cam.y + halfH
      };

      ctx.save();
      ctx.translate(vw / 2, vh / 2);
      ctx.scale(game.cam.zoom, game.cam.zoom);
      ctx.translate(-game.cam.x, -game.cam.y);

      this.drawBiomes(ctx, game.world, season, now, viewBox);
      this.drawIsland(ctx, game.world, now);
      this.drawGroundDetails(ctx, season, now, viewBox);
      this.drawRoadsAndPaths(ctx, game.world);
      this.drawGarden(ctx, game.world, now);
      this.drawBusStops(ctx);
      this.drawCityKiosks(ctx, game.world, now);
      this.drawSkidMarks(ctx, game.skidMarks);
      this.drawHotSpringAndSummit(ctx, game.world, now);
      this.drawPondAndPier(ctx, game.world, now);
      this.drawCampfireAndAltar(ctx, game.world, now);
      this.drawBenchesAndUmbrellas(ctx, game.world);
      this.drawForageables(ctx, game.world, now);
      this.drawInteractRings(ctx, game, now);
      this.drawWildlife(ctx, game.world, now);
      this.drawBoats(ctx, game.world, now);
      this.drawCars(ctx, game.world, nightAlpha > 0.14 || weather.id !== 'clear');

      if (game.pastEcho && !game.pastEcho.claimed) this.drawPastEcho(ctx, game.pastEcho, now);

      if (game.inventory.has('car') && !game.player.inCar && game.parkedCar) {
        this.drawPlayerCar(ctx, game.parkedCar.x, game.parkedCar.y, game.parkedCar.angle, false);
      }
      if (game.inventory.has('boat') && !game.player.inBoat && game.parkedBoat) {
        this.drawPlayerBoat(ctx, game.parkedBoat.x, game.parkedBoat.y, game.parkedBoat.angle, false, now);
      }

      for (const npc of game.npcs) this.drawCharacter(ctx, npc, false, false, false, now);

      if (game.pet && !game.player.inBoat) this.drawPet(ctx, game.pet, game.world, now);

      if (game.player.inBoat) {
        this.drawPlayerBoat(ctx, game.player.x, game.player.y, game.player.angle, Math.abs(game.player.boatSpeed) > 35, now);
      } else if (game.player.inCar) {
        this.drawPlayerCar(ctx, game.player.x, game.player.y, game.player.angle, nightAlpha > 0.12 || weather.id !== 'clear');
        // Sleek tiny EV battery gauge directly under car (zero permanent HUD clutter!)
        const bat = Math.max(0, Math.min(100, game.carBattery ?? 100));
        ctx.save();
        ctx.fillStyle = 'rgba(15,23,42,0.82)';
        ctx.fillRect(game.player.x - 22, game.player.y + 28, 44, 7);
        ctx.fillStyle = bat > 35 ? '#4ade80' : (bat > 15 ? '#facc15' : '#ef4444');
        ctx.fillRect(game.player.x - 20, game.player.y + 30, 40 * (bat / 100), 3);
        ctx.restore();
      } else {
        this.drawCharacter(ctx, game.player, true, game.player.swimming, game.player.onBike, now);
        // Open colorful Umbrella automatically held above player in rain/storm!
        if ((weather.id === 'rain' || weather.id === 'storm') && !game.player.swimming && game.inventory.has('umbrella')) {
          ctx.save();
          ctx.translate(game.player.x, game.player.y - 4);
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.beginPath(); ctx.arc(3, 5, 22, 0, Math.PI * 2); ctx.fill();
          const slices = ['#ef4444', '#facc15', '#38bdf8', '#22c55e', '#a855f7', '#fb923c'];
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = slices[i];
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.arc(0, 0, 22, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2);
            ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fde047';
          ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }

      this.drawBuildings3D(ctx, game.world, game.cam, now, nightAlpha, game);
      this.drawLighthouse(ctx, game.world, nightAlpha);
      this.drawTrees(ctx, game.world, season, now, viewBox);
      this.drawBirds(ctx, game.world, now, viewBox);
      this.drawParticles(ctx, game.particles);

      if (game.delivery && game.delivery.active) {
        this.drawDeliveryBeacon(ctx, game, now);
      } else if (game.guideCompass && game.getStarterWaypoint) {
        this.drawGuideBeacon(ctx, game, now);
      }
      if (game.autoPilot && game.autoPilot.active) {
        this.drawSwarmBeacon(ctx, game, now);
      }

      // Soft drifting cloud shadows on sunny days!
      if (weather.id === 'clear' && nightAlpha < 0.25) {
        this.drawCloudShadows(ctx, now, viewBox);
      }

      // Forest & Park Fireflies at dusk/night!
      if (nightAlpha > 0.12) {
        this.drawFireflies(ctx, now, nightAlpha, viewBox);
        this.drawNightGlows(ctx, game, nightAlpha);
      }

      this.drawSpeechBubbles(ctx, game);
      this.drawPopups(ctx, game.popups);

      ctx.restore();

      this.drawSkyLighting(ctx, vw, vh, game.timeMinutes, weather.id);
      this.drawWeatherParticles(ctx, game, season, weather.id, nightAlpha);
      if (game.lightningFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${game.lightningFlash * 0.72})`;
        ctx.fillRect(0, 0, vw, vh);
      }
      if (game.damageFlash > 0) {
        ctx.fillStyle = `rgba(220, 38, 38, ${game.damageFlash * 0.45})`;
        ctx.fillRect(0, 0, vw, vh);
      }
      if (game.cameraFlash > 0) {
        this.drawCameraFlashOverlay(ctx, game, vw, vh);
      }

      // Subtle cinematic warm vignette framing
      const vig = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.38, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(2,6,23,0.28)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, vw, vh);

      this.drawMinimap(game, season);
    }

    drawCameraFlashOverlay(ctx, game, vw, vh) {
      const f = Math.min(1, game.cameraFlash);
      ctx.save();
      if (f > 0.45) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(f - 0.45) * 1.35})`;
        ctx.fillRect(0, 0, vw, vh);
      }
      // Sleek Polaroid Viewfinder Corner Brackets & Caption Pill
      ctx.strokeStyle = `rgba(255, 255, 255, ${f * 0.92})`;
      ctx.lineWidth = 3.5;
      const mx = Math.max(44, vw * 0.14), my = Math.max(54, vh * 0.14);
      const x1 = mx, y1 = my, x2 = vw - mx, y2 = vh - my, cl = 28;
      ctx.beginPath();
      ctx.moveTo(x1, y1 + cl); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cl, y1);
      ctx.moveTo(x2 - cl, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + cl);
      ctx.moveTo(x1, y2 - cl); ctx.lineTo(x1, y2); ctx.lineTo(x1 + cl, y2);
      ctx.moveTo(x2 - cl, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - cl);
      ctx.stroke();

      if (game.lastPhotoLabel) {
        ctx.fillStyle = `rgba(15, 23, 42, ${f * 0.88})`;
        ctx.strokeStyle = `rgba(253, 224, 71, ${f * 0.95})`;
        ctx.lineWidth = 2;
        const pw = 290, ph = 32, px = vw / 2 - pw / 2, py = y2 - 48;
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeRect(px, py, pw, ph);
        ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(254, 240, 138, ${f})`;
        ctx.fillText(`📸 ${game.lastPhotoLabel}`, vw / 2, py + 21);
        ctx.textAlign = 'left';
      }
      ctx.restore();
    }

    getNightAlpha(timeMinutes) {
      const hr = (timeMinutes / 60) % 24;
      if (hr >= 7 && hr < 17) return 0;
      if (hr >= 17 && hr < 20.5) return ((hr - 17) / 3.5) * 0.44;
      if (hr >= 5 && hr < 7) return ((7 - hr) / 2) * 0.44;
      return 0.44;
    }

    drawBiomes(ctx, world, season, now, viewBox) {
      // North Snowy Mountain Peak
      const mtGrad = ctx.createLinearGradient(0, 0, 0, YD.MOUNTAIN_Y);
      mtGrad.addColorStop(0, '#ffffff');
      mtGrad.addColorStop(0.55, '#e0f2fe');
      mtGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = mtGrad;
      ctx.fillRect(0, 0, YD.WORLD_W, YD.MOUNTAIN_Y);

      // Layered Scalloped Mountain Foothill Cliff Border
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(0, YD.MOUNTAIN_Y - 22);
      for (let x = 0; x <= YD.WORLD_W; x += 120) {
        ctx.quadraticCurveTo(x + 60, YD.MOUNTAIN_Y + 14, x + 120, YD.MOUNTAIN_Y - 14);
      }
      ctx.lineTo(YD.WORLD_W, YD.MOUNTAIN_Y + 26);
      ctx.lineTo(0, YD.MOUNTAIN_Y + 26);
      ctx.closePath();
      ctx.fill();

      // Forest Meadow (Rich sunlit gradient!)
      const forGrad = ctx.createLinearGradient(0, YD.MOUNTAIN_Y, YD.CITY_X1, YD.BEACH_Y);
      forGrad.addColorStop(0, season.forest);
      forGrad.addColorStop(1, season.grass);
      ctx.fillStyle = forGrad;
      ctx.fillRect(0, YD.MOUNTAIN_Y, YD.CITY_X1, YD.BEACH_Y - YD.MOUNTAIN_Y);

      // City Plaza Stone Tiles
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(YD.CITY_X1, YD.MOUNTAIN_Y, YD.CITY_X2 - YD.CITY_X1, YD.BEACH_Y - YD.MOUNTAIN_Y);
      // Subtle cobblestone tile pattern in city
      ctx.strokeStyle = 'rgba(15,23,42,0.06)';
      ctx.lineWidth = 1.5;
      const sx1 = Math.max(YD.CITY_X1, Math.floor(viewBox.x1 / 64) * 64);
      const sx2 = Math.min(YD.CITY_X2, viewBox.x2);
      for (let x = sx1; x <= sx2; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, Math.max(YD.MOUNTAIN_Y, viewBox.y1)); ctx.lineTo(x, Math.min(YD.BEACH_Y, viewBox.y2)); ctx.stroke();
      }
      const sy1 = Math.max(YD.MOUNTAIN_Y, Math.floor(viewBox.y1 / 64) * 64);
      const sy2 = Math.min(YD.BEACH_Y, viewBox.y2);
      for (let y = sy1; y <= sy2; y += 64) {
        ctx.beginPath(); ctx.moveTo(YD.CITY_X1, y); ctx.lineTo(YD.CITY_X2, y); ctx.stroke();
      }
      // Clean foothill green parkway buffer above Hospital & Shop (y=740..835) with crisp stone curb
      ctx.fillStyle = season.grass;
      ctx.fillRect(YD.CITY_X1, YD.MOUNTAIN_Y, YD.CITY_X2 - YD.CITY_X1, 95);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(YD.CITY_X1, YD.MOUNTAIN_Y + 95, YD.CITY_X2 - YD.CITY_X1, 6);

      // Green Park (Lush Meadow!)
      const parkGrad = ctx.createLinearGradient(YD.CITY_X2, YD.MOUNTAIN_Y, YD.WORLD_W, YD.BEACH_Y);
      parkGrad.addColorStop(0, season.park);
      parkGrad.addColorStop(1, season.grass);
      ctx.fillStyle = parkGrad;
      ctx.fillRect(YD.CITY_X2, YD.MOUNTAIN_Y, YD.WORLD_W - YD.CITY_X2, YD.BEACH_Y - YD.MOUNTAIN_Y);

      // Golden Sandy Beach with Curved Natural Sand Transition
      const beachGrad = ctx.createLinearGradient(0, YD.BEACH_Y, 0, YD.SEA_Y);
      beachGrad.addColorStop(0, season.id === 'winter' ? '#e5d9b6' : '#fde68a');
      beachGrad.addColorStop(0.75, '#f5cc74');
      beachGrad.addColorStop(1, '#d9a441');
      ctx.fillStyle = beachGrad;
      ctx.fillRect(0, YD.BEACH_Y, YD.WORLD_W, YD.SEA_Y - YD.BEACH_Y);

      // Deep Layered Turquoise Ocean!
      const seaGrad = ctx.createLinearGradient(0, YD.SEA_Y, 0, YD.WORLD_H);
      seaGrad.addColorStop(0, '#5eead4');
      seaGrad.addColorStop(0.14, '#22d3ee');
      seaGrad.addColorStop(0.45, '#0284c7');
      seaGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, YD.SEA_Y, YD.WORLD_W, YD.WORLD_H - YD.SEA_Y);

      // Animated Lapping Shoreline Foam Curve!
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.beginPath();
      ctx.moveTo(0, YD.SEA_Y);
      for (let wx = 0; wx <= YD.WORLD_W; wx += 80) {
        const lap = Math.sin(wx * 0.012 + now * 2.2) * 11;
        ctx.lineTo(wx, YD.SEA_Y + 12 + lap);
      }
      ctx.lineTo(YD.WORLD_W, YD.SEA_Y - 4);
      ctx.lineTo(0, YD.SEA_Y - 4);
      ctx.closePath();
      ctx.fill();

      // Secondary Ocean Wave Ripples
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 3.5;
      for (let row = 1; row <= 5; row++) {
        const wy = YD.SEA_Y + row * 125 + Math.sin(now * 1.9 + row) * 9;
        if (wy < viewBox.y1 || wy > viewBox.y2) continue;
        ctx.beginPath();
        for (let wx = Math.max(0, Math.floor(viewBox.x1 / 90) * 90); wx <= Math.min(YD.WORLD_W, viewBox.x2 + 90); wx += 90) {
          const yOff = Math.sin(wx * 0.014 + now * 2.3 + row) * 8;
          if (wx <= viewBox.x1) ctx.moveTo(wx, wy + yOff);
          else ctx.lineTo(wx, wy + yOff);
        }
        ctx.stroke();
      }
    }

    drawGroundDetails(ctx, season, now, viewBox) {
      // Mountain Alpine Boulders
      for (const rk of this.rocks) {
        if (rk.x < viewBox.x1 || rk.x > viewBox.x2 || rk.y < viewBox.y1 || rk.y > viewBox.y2) continue;
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(rk.x, rk.y, rk.rx, rk.ry, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.ellipse(rk.x - 3, rk.y - 3, rk.rx * 0.65, rk.ry * 0.5, 0.2, 0, Math.PI * 2); ctx.fill();
      }

      // Soft Grass Tufts
      ctx.strokeStyle = season.id === 'winter' ? 'rgba(100,116,139,0.28)' : 'rgba(20, 83, 45, 0.28)';
      ctx.lineWidth = 2;
      for (const gt of this.grassTufts) {
        if (gt.x < viewBox.x1 || gt.x > viewBox.x2 || gt.y < viewBox.y1 || gt.y > viewBox.y2) continue;
        const sway = Math.sin(now * 2 + gt.x * 0.03) * 1.6;
        ctx.beginPath();
        ctx.moveTo(gt.x, gt.y); ctx.lineTo(gt.x - 3 + sway, gt.y - gt.size);
        ctx.moveTo(gt.x, gt.y); ctx.lineTo(gt.x + 3 + sway, gt.y - gt.size * 0.85);
        ctx.stroke();
      }

      // Blooming Wildflowers in Forest & Park!
      if (season.id !== 'winter') {
        for (const fl of this.flowers) {
          if (fl.x < viewBox.x1 || fl.x > viewBox.x2 || fl.y < viewBox.y1 || fl.y > viewBox.y2) continue;
          ctx.fillStyle = fl.color;
          ctx.beginPath(); ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath(); ctx.arc(fl.x, fl.y, fl.r * 0.42, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Glistening Sun Sparkles on the Sea!
      for (const sp of this.seaSparkles) {
        if (sp.x < viewBox.x1 || sp.x > viewBox.x2 || sp.y < viewBox.y1 || sp.y > viewBox.y2) continue;
        const gl = Math.max(0, Math.sin(now * 3.4 + sp.phase));
        if (gl > 0.4) {
          ctx.fillStyle = `rgba(255, 255, 255, ${gl * 0.85})`;
          const sz = gl * 5;
          ctx.fillRect(sp.x - sz, sp.y - 1, sz * 2, 2);
          ctx.fillRect(sp.x - 1, sp.y - sz, 2, sz * 2);
        }
      }
    }

    drawRoadsAndPaths(ctx, world) {
      const R = world.ring;
      const rw = 100, hrw = rw / 2;

      // Forest Warm Dirt Trail (stops cleanly at West Ring Road curb x=1750 — never paints over asphalt!)
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 54; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(520, 920); ctx.lineTo(890, 1240); ctx.lineTo(1190, 1270); ctx.lineTo(R.left - hrw, R.mid); ctx.stroke();
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 44;
      ctx.stroke();

      // North–South Center Highway + Circular Mountain Lookout & Beachfront Roundabouts (NO dead-end chop-off!)
      ctx.fillStyle = '#334155';
      ctx.fillRect(2280, 460, 100, 2005);
      // Mountain Lookout Roundabout (north end y=460)
      ctx.beginPath(); ctx.arc(2330, 460, 62, 0, Math.PI * 2); ctx.fill();
      // Beachfront Promenade Roundabout (south end y=2465)
      ctx.beginPath(); ctx.arc(2330, 2465, 62, 0, Math.PI * 2); ctx.fill();

      // COMPLETE 4-SIDED CLOSED CITY RING ROAD (Top, Mid, Bottom + Left & Right Avenues!)
      ctx.fillStyle = '#334155';
      // Horizontal boulevards
      ctx.fillRect(R.left - hrw, R.top - hrw,    (R.right - R.left) + rw, rw);
      ctx.fillRect(R.left - hrw, R.mid - hrw,    (R.right - R.left) + rw, rw);
      ctx.fillRect(R.left - hrw, R.bottom - hrw, (R.right - R.left) + rw, rw);
      // Vertical West & East Ring Streets connecting all corners seamlessly!
      ctx.fillRect(R.left - hrw,  R.top - hrw, rw, (R.bottom - R.top) + rw);
      ctx.fillRect(R.right - hrw, R.top - hrw, rw, (R.bottom - R.top) + rw);

      // Crisp Road Curbs along outer Ring boundary
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 5;
      ctx.strokeRect(R.left - hrw, R.top - hrw, (R.right - R.left) + rw, (R.bottom - R.top) + rw);

      // Dashed Yellow Center Lane Markings around the entire closed ring & highway!
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.setLineDash([22, 16]);
      ctx.beginPath();
      ctx.moveTo(R.left, R.top);    ctx.lineTo(R.right, R.top);
      ctx.moveTo(R.left, R.mid);    ctx.lineTo(R.right, R.mid);
      ctx.moveTo(R.left, R.bottom); ctx.lineTo(R.right, R.bottom);
      ctx.moveTo(R.left, R.top);    ctx.lineTo(R.left, R.bottom);
      ctx.moveTo(R.right, R.top);   ctx.lineTo(R.right, R.bottom);
      ctx.moveTo(2330, 490);        ctx.lineTo(2330, 2435);
      ctx.stroke(); ctx.setLineDash([]);

      // Roundabout Decorative Central Islands
      for (const [rx, ry, col] of [[2330, 460, '#e0f2fe'], [2330, 2465, '#86efac']]) {
        ctx.fillStyle = col; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(rx, ry, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // Zebra Crosswalks at key intersections!
      ctx.fillStyle = '#f8fafc';
      for (let s = R.mid - 42; s < R.mid + 42; s += 16) {
        ctx.fillRect(2262, s, 14, 9);
        ctx.fillRect(2384, s, 14, 9);
      }

      // Seamless Stone Apron linking Beachfront Roundabout (y=2465) cleanly to Boardwalk (y=2532)!
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2288, 2516, 84, 20);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(2294, 2518, 72, 16);

      // Stepping Stones connecting Organic Garden south entrance down to Mid Blvd sidewalk!
      ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
      for (let sy = 1554; sy <= 1646; sy += 23) {
        ctx.beginPath(); ctx.ellipse(2496, sy, 16, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // Seamless Wooden Beach Walkway connecting Boardwalk straight down to the Fishing Pier!
      ctx.fillStyle = '#b45309';
      ctx.fillRect(world.pier.x + 18, YD.BEACH_Y, world.pier.w - 36, world.pier.y - YD.BEACH_Y + 6);
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
      for (let py = YD.BEACH_Y + 12; py < world.pier.y; py += 16) {
        ctx.beginPath(); ctx.moveTo(world.pier.x + 18, py); ctx.lineTo(world.pier.x + world.pier.w - 18, py); ctx.stroke();
      }

      // Beachfront Wooden Boardwalk (runs seamlessly edge-to-edge across the entire coast!)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, YD.BEACH_Y - 28, YD.WORLD_W, 36);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, YD.BEACH_Y - 24, YD.WORLD_W, 28);
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2;
      ctx.strokeRect(0, YD.BEACH_Y - 28, YD.WORLD_W, 36);

      // Park Stone Jogging Loop
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 44;
      ctx.beginPath(); ctx.ellipse(world.pond.x, world.pond.y, world.pond.rx + 80, world.pond.ry + 80, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 34;
      ctx.stroke();

      // Park Fitness Area
      ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(3540, 1790, 160, 115, 14);
      else ctx.rect(3540, 1790, 160, 115);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.font = 'bold 13px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillText('🏃 PARK SPOR ALANI', 3620, 1852);
      ctx.textAlign = 'left';
    }

    drawSkidMarks(ctx, marks) {
      for (const m of marks) {
        ctx.save(); ctx.globalAlpha = m.alpha; ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(m.x, m.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    drawHotSpringAndSummit(ctx, world, now) {
      const hs = world.hotSpring;
      // Natural Rocky Rim around Hot Spring
      ctx.fillStyle = '#64748b'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(hs.x + Math.cos(a) * (hs.rx + 8), hs.y + Math.sin(a) * (hs.ry + 8), 16, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      const poolG = ctx.createRadialGradient(hs.x, hs.y, 12, hs.x, hs.y, hs.rx);
      poolG.addColorStop(0, '#99f6e4');
      poolG.addColorStop(1, '#0d9488');
      ctx.fillStyle = poolG;
      ctx.beginPath(); ctx.ellipse(hs.x, hs.y, hs.rx, hs.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      for (let i = 0; i < 7; i++) {
        const sy = hs.y - 10 - ((now * 26 + i * 16) % 56);
        const sx = hs.x - 72 + i * 24 + Math.sin(now * 2 + i) * 10;
        ctx.fillStyle = 'rgba(255,255,255,0.48)';
        ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillText('♨️ SICAK KAPLICA', hs.x, hs.y + 4);

      const sr = world.summitRock;
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(sr.x + 8, sr.y + 9, sr.r, 0, Math.PI * 2); ctx.fill();
      const rockG = ctx.createRadialGradient(sr.x - 10, sr.y - 10, 6, sr.x, sr.y, sr.r);
      rockG.addColorStop(0, '#d6d3d1'); rockG.addColorStop(1, '#57534e');
      ctx.fillStyle = rockG; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sr.x, sr.y, sr.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('🪨 SİSYPHOS ZİRVESİ', sr.x, sr.y - sr.r - 10);
      ctx.textAlign = 'left';
    }

    drawPondAndPier(ctx, world, now) {
      const p = world.pond;
      const pondG = ctx.createRadialGradient(p.x - 30, p.y - 20, 20, p.x, p.y, p.rx);
      pondG.addColorStop(0, '#38bdf8'); pondG.addColorStop(1, '#0369a1');
      ctx.fillStyle = pondG; ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Lily pads!
      ctx.fillStyle = '#16a34a'; ctx.strokeStyle = '#14532d'; ctx.lineWidth = 1.5;
      for (const [lx, ly] of [[p.x - 95, p.y - 45], [p.x + 105, p.y + 38], [p.x - 70, p.y + 58]]) {
        ctx.beginPath(); ctx.arc(lx, ly, 12, 0.25, Math.PI * 1.9); ctx.lineTo(lx, ly); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * 0.65 + Math.sin(now * 2) * 5, p.ry * 0.65, 0, 0, Math.PI * 2); ctx.stroke();

      // Detailed Wooden Pier with Corner Bollard Posts!
      const pr = world.pier;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(pr.x + 10, pr.y + 10, pr.w, pr.h);
      ctx.fillStyle = '#92400e'; ctx.strokeStyle = '#291509'; ctx.lineWidth = 3;
      ctx.fillRect(pr.x, pr.y, pr.w, pr.h); ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);
      for (let py = pr.y + 16; py < pr.y + pr.h; py += 18) {
        ctx.fillStyle = py % 36 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(pr.x + 2, py, pr.w - 4, 16);
        ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pr.x, py); ctx.lineTo(pr.x + pr.w, py); ctx.stroke();
      }
      // Corner timber posts
      ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
      for (let py = pr.y + 14; py <= pr.y + pr.h - 10; py += 84) {
        ctx.beginPath(); ctx.arc(pr.x + 8, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(pr.x + pr.w - 8, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#fef08a'; ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillText('🎣 BALIK İSKELESİ', pr.x + pr.w / 2, pr.y + pr.h - 14);
      ctx.textAlign = 'left';
    }

    drawCampfireAndAltar(ctx, world, now) {
      const cf = world.campfire;
      ctx.fillStyle = '#57534e'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cf.x + Math.cos(a) * 19, cf.y + Math.sin(a) * 19, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      const flick = 1 + Math.sin(now * 14) * 0.16;
      ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(cf.x, cf.y, 15 * flick, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(cf.x, cf.y, 9 * flick, 0, Math.PI * 2); ctx.fill();
      // Rising campfire sparks
      for (let i = 0; i < 4; i++) {
        const ey = cf.y - ((now * 34 + i * 14) % 44);
        const ex = cf.x + Math.sin(now * 5 + i * 2) * 8;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, Math.PI * 2); ctx.fill();
      }

      const al = world.altar;
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(al.x, al.y, al.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(al.x, al.y, 21 + Math.sin(now * 3) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⏳', al.x, al.y);
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    }

    drawBenchesAndUmbrellas(ctx, world) {
      for (const b of world.benches) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-24, -4, 52, 16);
        ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2;
        ctx.fillRect(-26, -8, 52, 16); ctx.strokeRect(-26, -8, 52, 16);
        ctx.fillStyle = '#78350f'; ctx.fillRect(-26, -8, 52, 5);
        ctx.restore();
      }
      for (const u of world.umbrellas) {
        // Beach towel next to umbrella!
        ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
        ctx.fillRect(u.x + 18, u.y - 12, 20, 36); ctx.strokeRect(u.x + 18, u.y - 12, 20, 36);
        ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.beginPath(); ctx.arc(u.x + 7, u.y + 8, u.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = u.color; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.arc(u.x, u.y, u.r, i * Math.PI / 2, i * Math.PI / 2 + Math.PI / 4); ctx.closePath(); ctx.fill();
        }
        ctx.stroke();
      }
    }

    drawForageables(ctx, world, now) {
      for (const fg of world.forageables) {
        if (fg.collected) continue;
        const bg = fg.kind === 'crystal' ? '#38bdf8' : (fg.kind === 'berry' ? '#16a34a' : '#fef3c7');
        const icon = fg.kind === 'crystal' ? '💎' : (fg.kind === 'berry' ? '🍓' : '🍄');
        const pulse = fg.kind === 'crystal' ? (1 + Math.sin(now * 6) * 0.14) : 1;
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(fg.x + 2, fg.y + 3, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = bg; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fg.x, fg.y, 13 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, fg.x, fg.y + 1);
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      }
    }

    drawInteractRings(ctx, game, now) {
      const p = game.player;
      for (const it of game.world.interactables) {
        const near = Math.hypot(p.x - it.x, p.y - it.y) < it.r + 22;
        const pulse = near ? (25 + Math.sin(now * 7) * 3) : 17;
        ctx.strokeStyle = near ? '#fde047' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = near ? 3.5 : 2;
        ctx.beginPath(); ctx.arc(it.x, it.y, pulse, 0, Math.PI * 2); ctx.stroke();
      }
    }

    drawPlayerCar(ctx, x, y, angle, headlights) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      if (headlights) {
        const beam = ctx.createLinearGradient(32, 0, 195, 0);
        beam.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
        beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath(); ctx.moveTo(32, -12); ctx.lineTo(195, -54); ctx.lineTo(195, 54); ctx.lineTo(32, 12); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-31, -14, 68, 36, 9);
      else ctx.rect(-31, -14, 68, 36);
      ctx.fill();

      // Side mirrors
      ctx.fillStyle = '#0891b2'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.fillRect(6, -22, 6, 5); ctx.strokeRect(6, -22, 6, 5);
      ctx.fillRect(6, 17, 6, 5); ctx.strokeRect(6, 17, 6, 5);

      const bodyG = ctx.createLinearGradient(0, -18, 0, 18);
      bodyG.addColorStop(0, '#22d3ee'); bodyG.addColorStop(0.5, '#06b6d4'); bodyG.addColorStop(1, '#0e7490');
      ctx.fillStyle = bodyG; ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-34, -18, 68, 36, 10);
      else ctx.rect(-34, -18, 68, 36);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fef08a'; ctx.fillRect(-32, -2.5, 64, 5);
      // Windshield + glossy reflection stripe
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-16, -13, 30, 26); ctx.strokeRect(-16, -13, 30, 26);
      ctx.fillStyle = '#67e8f9'; ctx.fillRect(-10, -10, 15, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(6, -11, 5, 22);

      ctx.fillStyle = '#fef08a'; ctx.fillRect(30, -14, 4, 7); ctx.fillRect(30, 7, 4, 7);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-34, -14, 4, 7); ctx.fillRect(-34, 7, 4, 7);
      ctx.restore();
    }

    drawCityKiosks(ctx, world, now) {
      // 1) Sleek Bank ATM Kiosk beside İş Merkezi
      if (world.atm) {
        const ax = world.atm.x, ay = world.atm.y;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(ax - 17, ay - 14, 40, 34);
        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.4;
        ctx.fillRect(ax - 18, ay - 18, 36, 36); ctx.strokeRect(ax - 18, ay - 18, 36, 36);
        ctx.fillStyle = '#22d3ee'; ctx.fillRect(ax - 11, ay - 11, 22, 13);
        ctx.fillStyle = '#fde047'; ctx.fillRect(ax - 7, ay + 6, 14, 5);
        ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#e0f2fe'; ctx.fillText('ATM', ax, ay - 22);
        ctx.restore();
      }
      // 2) Green EV Charging Station beside Market & Galeri
      if (world.evCharger) {
        const ex = world.evCharger.x, ey = world.evCharger.y;
        ctx.save();
        // Green EV parking bay paint
        ctx.fillStyle = 'rgba(34, 197, 94, 0.22)'; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2;
        ctx.fillRect(ex - 28, ey - 16, 56, 40); ctx.strokeRect(ex - 28, ey - 16, 56, 40);
        // Sleek EV supercharger pillar
        ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#14532d'; ctx.lineWidth = 2;
        ctx.fillRect(ex - 11, ey - 24, 22, 20); ctx.strokeRect(ex - 11, ey - 24, 22, 20);
        ctx.fillStyle = `rgba(74, 222, 128, ${0.55 + Math.sin(now * 5) * 0.4})`;
        ctx.fillRect(ex - 6, ey - 19, 12, 8);
        ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#bbf7d0'; ctx.fillText('⚡ EV ŞARJ', ex, ey - 28);
        ctx.restore();
      }
      // 3) Grand Marble City Wishing Fountain in University & Cafe Courtyard!
      if (world.fountain) {
        const fx = world.fountain.x, fy = world.fountain.y, fr = world.fountain.r;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.arc(fx + 5, fy + 6, fr + 4, 0, Math.PI * 2); ctx.fill();
        // Carved stone outer rim
        ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(fx, fy, fr + 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Turquoise shimmering water pool
        const fg = ctx.createRadialGradient(fx - 6, fy - 6, 4, fx, fy, fr - 2);
        fg.addColorStop(0, '#a5f3fc'); fg.addColorStop(1, '#0284c7');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(fx, fy, fr - 3, 0, Math.PI * 2); ctx.fill();
        // Glinting golden wish coins at the bottom
        ctx.fillStyle = '#fde047';
        for (const [cx, cy] of [[-13, -10], [14, -8], [-11, 13], [12, 12], [2, -16]]) {
          ctx.beginPath(); ctx.arc(fx + cx, fy + cy, 2.2, 0, Math.PI * 2); ctx.fill();
        }
        // Animated water ripple rings + center sculpture + water jets
        ctx.strokeStyle = 'rgba(255,255,255,0.62)'; ctx.lineWidth = 1.6;
        const rip = 12 + ((now * 16) % 16);
        ctx.beginPath(); ctx.arc(fx, fy, rip, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fx, fy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(fx, fy, 4 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.fillText('⛲ DİLEK ÇEŞMESİ', fx, fy - fr - 10);
        ctx.restore();
      }
      // 4) Colorful Beachfront Ice-Cream & Lemonade Cart on Boardwalk!
      if (world.icecream) {
        const ix = world.icecream.x, iy = world.icecream.y;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(ix - 22, iy - 10, 50, 30);
        // Cart wheels
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(ix - 14, iy + 16, 6, 0, Math.PI * 2); ctx.arc(ix + 14, iy + 16, 6, 0, Math.PI * 2); ctx.fill();
        // Pastel cream & strawberry cart body
        ctx.fillStyle = '#fff1f2'; ctx.strokeStyle = '#be123c'; ctx.lineWidth = 2.2;
        ctx.fillRect(ix - 22, iy - 12, 44, 26); ctx.strokeRect(ix - 22, iy - 12, 44, 26);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(ix - 22, iy + 3, 44, 11);
        // 3 Ice cream tubs inside glass display
        [['#f472b6', -11], ['#fde047', 0], ['#4ade80', 11]].forEach(([col, ox]) => {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(ix + ox, iy - 4, 4.2, 0, Math.PI * 2); ctx.fill();
        });
        // Striped umbrella canopy overhang
        for (let s = 0; s < 4; s++) {
          ctx.fillStyle = s % 2 === 0 ? '#f43f5e' : '#ffffff';
          ctx.fillRect(ix - 24 + s * 12, iy - 22, 12, 9);
        }
        ctx.strokeStyle = '#881337'; ctx.lineWidth = 1.6;
        ctx.strokeRect(ix - 24, iy - 22, 48, 9);
        ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('🍦 DONDURMA', ix, iy - 27);
        ctx.restore();
      }
    }

    drawWildlife(ctx, world, now) {
      // 1) Forest Deer & Rabbits (detailed top-down art!)
      for (const w of world.wildlife) {
        ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(2, 4, w.kind === 'deer' ? 15 : 8, 6, 0, 0, Math.PI * 2); ctx.fill();
        if (w.kind === 'deer') {
          // Cinnamon coat, white spotted back, antlers & tail
          ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#291002'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath(); ctx.arc(-4, -2.5, 1.8, 0, Math.PI * 2); ctx.arc(-1, 2.5, 1.6, 0, Math.PI * 2); ctx.arc(-13, 0, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#92400e';
          ctx.beginPath(); ctx.arc(13, 0, 5.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          // Cute branching antlers
          ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(12, -4); ctx.lineTo(16, -11); ctx.moveTo(14, -8); ctx.lineTo(19, -9);
          ctx.moveTo(12, 4);  ctx.lineTo(16, 11);  ctx.moveTo(14, 8);  ctx.lineTo(19, 9);
          ctx.stroke();
        } else {
          // Fluffy white rabbit with long pink-lined ears & cotton tail
          ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.ellipse(0, 0, 8, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(-8, 0, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(7, 0, 4.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath(); ctx.ellipse(4, -5.5, 4.5, 1.8, -0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(4, 5.5, 4.5, 1.8, 0.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        if (w.heartTimer > 0) {
          ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('❤️', w.x, w.y - 16 - Math.sin(now * 6) * 3);
        }
      }

      // 2) Friendly Interactive Street Cats & Dogs!
      if (world.strays) {
        for (const st of world.strays) {
          const wag = Math.sin(now * (st.heartTimer > 0 ? 18 : 9) + st.x) * (st.kind === 'dog' ? 0.55 : 0.25);
          ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.angle);
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath(); ctx.ellipse(1, 4, st.kind === 'dog' ? 12 : 9.5, 6, 0, 0, Math.PI * 2); ctx.fill();
          // Wagging tail
          ctx.strokeStyle = st.color; ctx.lineWidth = st.kind === 'dog' ? 3.5 : 2.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-17, Math.sin(wag) * 7); ctx.stroke();
          // Body & Head
          ctx.fillStyle = st.color; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.ellipse(0, 0, st.kind === 'dog' ? 11 : 8.5, st.kind === 'dog' ? 6.8 : 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(st.kind === 'dog' ? 10 : 8, 0, st.kind === 'dog' ? 6 : 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (st.kind === 'cat') {
            // Pointy triangular cat ears
            ctx.beginPath();
            ctx.moveTo(6, -4); ctx.lineTo(11, -8); ctx.lineTo(11, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(6, 4);  ctx.lineTo(11, 8);  ctx.lineTo(11, 2);  ctx.closePath(); ctx.fill(); ctx.stroke();
          } else {
            // Floppy cute dog ears + tiny collar
            ctx.fillStyle = '#78350f';
            ctx.beginPath(); ctx.ellipse(8, -6, 4.2, 2.4, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(8, 6, 4.2, 2.4, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(5, -5); ctx.lineTo(5, 5); ctx.stroke();
          }
          ctx.restore();
          if (st.heartTimer > 0) {
            ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('❤️', st.x, st.y - 16 - Math.sin(now * 6) * 3);
          }
        }
      }

      // 3) Park Pond Mallard Ducks with ripples & bright beaks!
      for (const dk of world.ducks) {
        const dx = world.pond.x + Math.cos(dk.angle) * dk.orbitRx;
        const dy = world.pond.y + Math.sin(dk.angle) * dk.orbitRy;
        const heading = dk.angle + (dk.speed >= 0 ? Math.PI / 2 : -Math.PI / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.48)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(dx, dy, 11 + Math.sin(now * 5 + dk.angle) * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.save(); ctx.translate(dx, dy); ctx.rotate(heading);
        ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 7.5, 5.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.beginPath(); ctx.arc(6.5, 0, 3.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(14, 0); ctx.lineTo(10, 2); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    drawBoats(ctx, world, now) {
      for (const bt of world.boats) {
        const bob = Math.sin(now * 2.5 + bt.x * 0.01) * 4;
        ctx.save(); ctx.translate(bt.x, bt.y + bob); ctx.scale(bt.dir, 1);
        // Water wake behind sailboat!
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-30, 8); ctx.lineTo(-65, 2); ctx.moveTo(-30, 8); ctx.lineTo(-65, 16); ctx.stroke();
        ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.lineTo(18, 14); ctx.lineTo(-20, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = bt.sailColor;
        ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2, -36); ctx.lineTo(24, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    drawCars(ctx, world, headlights) {
      const now = performance.now() * 0.001;
      for (const c of world.cars) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle || 0);

        if (headlights) {
          const beam = ctx.createLinearGradient(28, 0, 140, 0);
          beam.addColorStop(0, 'rgba(254, 240, 138, 0.34)');
          beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(28, -10); ctx.lineTo(140, -34); ctx.lineTo(140, 34); ctx.lineTo(28, 10);
          ctx.closePath(); ctx.fill();
        }

        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        ctx.fillRect(-25, -12, 58, 30);

        ctx.fillStyle = c.color; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-29, -15, 58, 30, 7);
        else ctx.rect(-29, -15, 58, 30);
        ctx.fill(); ctx.stroke();

        // Roof & Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-14, -11, 28, 22);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(6, -9, 6, 18);

        if (c.isTaxi) {
          ctx.fillStyle = '#111'; ctx.fillRect(-4, -5, 8, 10);
          ctx.fillStyle = '#fef08a'; ctx.fillRect(-2, -3, 4, 6);
        }

        // Headlights & glowing brake lights + amber hazard blinkers when emergency braking!
        const blinkOn = Math.floor(now * 8) % 2 === 0;
        ctx.fillStyle = (c.brakeTimer > 0 && blinkOn) ? '#fb923c' : '#fef08a';
        ctx.fillRect(25, -12, 4, 6); ctx.fillRect(25, 6, 4, 6);
        ctx.fillStyle = (c.brakeTimer > 0 || c.yielding) ? '#ff1e1e' : '#991b1b';
        ctx.fillRect(-29, -12, 4, 6); ctx.fillRect(-29, 6, 4, 6);

        // Visual Horn Sound-Wave Arcs when honking!
        if (c.hornFlash > 0) {
          const p = 1 - Math.min(1, c.hornFlash / 0.55);
          ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0.15, 1 - p)})`;
          ctx.lineWidth = 2.4;
          for (let k = 0; k < 2; k++) {
            const rad = 16 + p * 26 + k * 10;
            ctx.beginPath();
            ctx.arc(26, 0, rad, -0.58, 0.58);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    drawPastEcho(ctx, echo, now) {
      ctx.save();
      ctx.globalAlpha = 0.65 + Math.sin(now * 5) * 0.16;
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(echo.x, echo.y, 24 + Math.sin(now * 4) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(echo.x, echo.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe135';
      ctx.fillText('✨ GEÇMİŞ YANKIN', echo.x, echo.y - 26);
      ctx.restore();
    }

    drawCharacter(ctx, c, isPlayer, swimming, onBike, now) {
      ctx.save(); ctx.translate(c.x, c.y);
      if (swimming) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 17 + Math.sin(now * 7) * 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(0, 0, 26 + Math.cos(now * 6) * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(c.angle);
        ctx.fillStyle = '#f5cfa0'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(2, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, 9.5, Math.PI * 0.55, Math.PI * 1.45); ctx.fill();
        ctx.restore(); return;
      }
      ctx.rotate(c.angle);

      if (onBike) {
        ctx.fillStyle = '#111'; ctx.fillRect(-22, -4, 15, 8); ctx.fillRect(10, -4, 15, 8);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(16, 0); ctx.stroke();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -13); ctx.lineTo(14, 13); ctx.stroke();
        // Cute front basket!
        ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.8;
        ctx.fillRect(18, -7, 8, 14); ctx.strokeRect(18, -7, 8, 14);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.24)'; ctx.beginPath(); ctx.ellipse(2, 5, 16, 13, 0, 0, Math.PI * 2); ctx.fill();
      const swing = Math.sin(c.walkCycle || 0) * 4.5;

      // Traveler Backpack on Player!
      if (isPlayer) {
        ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-17, -10, 11, 20, 4);
        else ctx.rect(-17, -10, 11, 20);
        ctx.fill(); ctx.stroke();
      }

      ctx.fillStyle = c.color || '#38bdf8'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.ellipse(0, 0, 12, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Scarf collar accent
      if (isPlayer) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(1, 0, 11, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = '#f5cfa0';
      ctx.beginPath(); ctx.arc(8 + swing, -13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(8 - swing, 13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(2, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isPlayer ? '#1e1b18' : '#78350f';
      ctx.beginPath(); ctx.arc(0, 0, 9.5, Math.PI * 0.52, Math.PI * 1.48); ctx.fill();
      // Hair highlight sheen
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.arc(-2, -3, 3.2, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

      if (!isPlayer) {
        ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(15,23,42,0.78)'; ctx.fillRect(c.x - 44, c.y - 32, 88, 13);
        ctx.fillStyle = '#fde047'; ctx.fillText(c.name, c.x, c.y - 22); ctx.textAlign = 'left';
      }
    }

    drawBuildings3D(ctx, world, cam, now, nightAlpha, game) {
      for (const b of world.buildings) {
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const ox = Math.max(-22, Math.min(22, (cx - cam.x) * 0.045));
        const oy = Math.max(-22, Math.min(22, (cy - cam.y) * 0.045));
        const rx = b.x + ox, ry = b.y + oy;
        const isOwnedCafe = !!(game && game.ownsCafe && b.id === 'cafe');

        // Soft drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(b.x + 12, b.y + 14, b.w, b.h);
        // Base walls
        ctx.fillStyle = b.color; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
        ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Warm glowing doorway mat
        ctx.fillStyle = nightAlpha > 0.15 ? '#fde047' : '#78350f';
        ctx.fillRect(b.x + b.w / 2 - 18, b.y + b.h - 2, 36, 10);

        // Elevated Roof Surface with Architectural Details!
        const roofG = ctx.createLinearGradient(rx, ry, rx, ry + b.h);
        roofG.addColorStop(0, isOwnedCafe ? '#fde047' : b.roof);
        roofG.addColorStop(1, isOwnedCafe ? '#d97706' : b.color);
        ctx.fillStyle = roofG;
        ctx.fillRect(rx, ry, b.w, b.h); ctx.strokeRect(rx, ry, b.w, b.h);

        // Pitched Roof Center Ridge + Shingle Stripes on cozy buildings
        if (b.id === 'home' || b.id === 'cabin' || b.id === 'lodge') {
          ctx.strokeStyle = 'rgba(17,17,17,0.35)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(rx + 12, ry + b.h / 2); ctx.lineTo(rx + b.w - 12, ry + b.h / 2); ctx.stroke();
          // Brick Chimney + Animated Puffing Smoke!
          const chX = rx + b.w - 38, chY = ry + 18;
          ctx.fillStyle = '#7c2d12'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
          ctx.fillRect(chX, chY, 20, 20); ctx.strokeRect(chX, chY, 20, 20);
          for (let s = 0; s < 3; s++) {
            const p = ((now * 0.45 + s * 0.33) % 1);
            ctx.fillStyle = `rgba(255,255,255,${(1 - p) * 0.5})`;
            ctx.beginPath(); ctx.arc(chX + 10 + p * 18, chY - p * 34, 6 + p * 10, 0, Math.PI * 2); ctx.fill();
          }
        } else if (b.id === 'office') {
          // Glass Skylight & Helipad H!
          ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(rx + b.w - 46, ry + 42, 24, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fde047'; ctx.font = '900 18px Impact, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('H', rx + b.w - 46, ry + 48);
        } else if (b.id === 'hospital') {
          // Crisp Medical Cross Badge cleanly above signboard!
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
          ctx.fillRect(rx + b.w - 38, ry + 10, 26, 26); ctx.strokeRect(rx + b.w - 38, ry + 10, 26, 26);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(rx + b.w - 28, ry + 14, 6, 18);
          ctx.fillRect(rx + b.w - 34, ry + 20, 18, 6);
        } else if (b.id === 'cafe' || b.id === 'shop') {
          // Striped Shop Awning overhang!
          for (let ax = rx + 6; ax < rx + b.w - 12; ax += 22) {
            ctx.fillStyle = ((ax - rx) / 22) % 2 === 0 ? '#ffffff' : (isOwnedCafe ? '#f59e0b' : b.roof);
            ctx.fillRect(ax, ry + b.h - 14, 18, 14);
          }
        }

        // Bold Readable Signboard
        const signText = isOwnedCafe ? `⭐ ${(game.playerName || 'SENİN').toUpperCase()} KAFE` : b.label;
        ctx.font = '900 15px Impact, "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = isOwnedCafe ? 'rgba(120,53,15,0.92)' : 'rgba(15,23,42,0.75)';
        ctx.fillRect(rx + 18, ry + b.h / 2 - 14, b.w - 36, 28);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(signText, rx + b.w / 2, ry + b.h / 2);
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      }
    }

    drawPet(ctx, pet, world, now) {
      const inWater = world.isInWater(pet.x, pet.y);
      ctx.save();
      ctx.translate(pet.x, pet.y);

      if (inWater) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 12 + Math.sin(now * 9) * 3, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.beginPath(); ctx.ellipse(2, 4, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      }

      ctx.rotate(pet.angle);
      const wag = Math.sin(now * 16) * 5;
      const bodyCol = pet.kind === 'dog' ? '#f59e0b' : '#cbd5e1';
      const earCol  = pet.kind === 'dog' ? '#b45309' : '#64748b';

      // Wagging tail
      ctx.strokeStyle = earCol; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-17, wag); ctx.stroke();

      // Body
      ctx.fillStyle = bodyCol; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 7.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Head + cute ears
      ctx.beginPath(); ctx.arc(9, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = earCol;
      ctx.beginPath(); ctx.arc(7, -6, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 6, 3.2, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

      ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(pet.kind === 'dog' ? '🐶 Paşa' : '🐱 Pamuk', pet.x, pet.y - 16);
      ctx.textAlign = 'left';
    }

    drawLighthouse(ctx, world, nightAlpha) {
      const lh = world.lighthouse;
      if (nightAlpha > 0.05) {
        ctx.save(); ctx.translate(lh.x, lh.y); ctx.rotate(lh.beamAngle);
        const bg = ctx.createLinearGradient(0, 0, 440, 0);
        bg.addColorStop(0, `rgba(254, 240, 138, ${nightAlpha * 0.8})`);
        bg.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(440, -95); ctx.lineTo(440, 95); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(lh.x + 8, lh.y + 8, lh.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(lh.x, lh.y, lh.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(lh.x, lh.y, lh.r * 0.66, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(lh.x, lh.y, 11, 0, Math.PI * 2); ctx.fill();
    }

    drawTrees(ctx, world, season, now, viewBox) {
      for (const tr of world.trees) {
        if (tr.x < viewBox.x1 || tr.x > viewBox.x2 || tr.y < viewBox.y1 || tr.y > viewBox.y2) continue;
        const sway = Math.sin(now * 1.8 + tr.x * 0.02) * 2.5;
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(tr.x + 7, tr.y + 9, tr.r * 1.05, 0, Math.PI * 2); ctx.fill();

        if (tr.kind === 'palm') {
          ctx.strokeStyle = '#14532d'; ctx.lineWidth = 2; ctx.fillStyle = '#16a34a';
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + sway * 0.03;
            ctx.beginPath(); ctx.ellipse(tr.x + Math.cos(a) * 15, tr.y + Math.sin(a) * 15, 16, 6.5, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(tr.x, tr.y, 7, 0, Math.PI * 2); ctx.fill();
        } else {
          let dark = '#14532d', mid = '#15803d', hi = '#4ade80';
          if (tr.kind === 'snow_pine') { dark = '#0f2942'; mid = '#1e3a5f'; hi = '#f8fafc'; }
          else if (tr.kind === 'blossom') { dark = '#be185d'; mid = '#f472b6'; hi = '#fce7f3'; }
          else if (season.id === 'autumn') { dark = '#9a3412'; mid = '#ea580c'; hi = '#fdba74'; }
          else if (season.id === 'winter') { dark = '#475569'; mid = '#94a3b8'; hi = '#f8fafc'; }
          else if (tr.kind === 'pine') { dark = '#052e16'; mid = '#14532d'; hi = '#22c55e'; }

          // 3-Tier Lush Illustrated Foliage Puffs!
          ctx.fillStyle = dark; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.arc(tr.x + sway, tr.y, tr.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = mid;
          ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.16 + sway, tr.y - tr.r * 0.16, tr.r * 0.78, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = hi;
          ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.30 + sway, tr.y - tr.r * 0.30, tr.r * 0.44, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    drawCloudShadows(ctx, now, viewBox) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      for (const cl of this.clouds) {
        const cx = (cl.x + now * cl.speed) % (YD.WORLD_W + 400) - 200;
        if (cx + cl.rx < viewBox.x1 || cx - cl.rx > viewBox.x2 || cl.y + cl.ry < viewBox.y1 || cl.y - cl.ry > viewBox.y2) continue;
        ctx.beginPath(); ctx.ellipse(cx, cl.y, cl.rx, cl.ry, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    drawFireflies(ctx, now, nightAlpha, viewBox) {
      for (const ff of this.fireflies) {
        const fx = ff.x + Math.sin(now * 1.4 + ff.phase) * 28;
        const fy = ff.y + Math.cos(now * 1.1 + ff.phase) * 22;
        if (fx < viewBox.x1 || fx > viewBox.x2 || fy < viewBox.y1 || fy > viewBox.y2) continue;
        const glow = (0.4 + 0.6 * Math.abs(Math.sin(now * 3 + ff.phase))) * Math.min(1, nightAlpha * 2.5);
        ctx.fillStyle = `rgba(254, 240, 138, ${glow})`;
        ctx.beginPath(); ctx.arc(fx, fy, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }

    drawNightGlows(ctx, game, nightAlpha) {
      const glow = (x, y, r, rgba) => {
        const g = ctx.createRadialGradient(x, y, 4, x, y, r);
        g.addColorStop(0, rgba); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      };
      glow(game.world.campfire.x, game.world.campfire.y, 175, `rgba(251, 146, 60, ${nightAlpha * 1.1})`);
      glow(game.world.hotSpring.x, game.world.hotSpring.y, 155, `rgba(45, 212, 191, ${nightAlpha * 0.85})`);
      if (game.world.fountain) glow(game.world.fountain.x, game.world.fountain.y, 130, `rgba(56, 189, 248, ${nightAlpha * 0.85})`);
      for (const lm of game.world.streetlamps) glow(lm.x, lm.y, 115, `rgba(254, 240, 138, ${nightAlpha * 0.9})`);
      const lanternR = game.inventory.has('lantern') ? 240 : 95;
      glow(game.player.x, game.player.y, lanternR, `rgba(253, 224, 71, ${nightAlpha * 0.85})`);
    }

    drawSkyLighting(ctx, vw, vh, timeMinutes, weatherId) {
      const hr = (timeMinutes / 60) % 24;
      if (hr >= 17 && hr < 19.5) {
        const a = Math.sin(((hr - 17) / 2.5) * Math.PI) * 0.22;
        ctx.fillStyle = `rgba(249, 115, 22, ${a})`; ctx.fillRect(0, 0, vw, vh);
      }
      const nightA = this.getNightAlpha(timeMinutes);
      if (nightA > 0) {
        ctx.fillStyle = `rgba(15, 23, 42, ${nightA})`; ctx.fillRect(0, 0, vw, vh);
      }
      if (weatherId === 'rain') {
        ctx.fillStyle = 'rgba(30, 58, 138, 0.14)'; ctx.fillRect(0, 0, vw, vh);
      } else if (weatherId === 'storm') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)'; ctx.fillRect(0, 0, vw, vh);
      }
    }

    drawWeatherParticles(ctx, game, season, weatherId, nightAlpha) {
      const inMountain = game.player.y < YD.MOUNTAIN_Y;
      if (weatherId === 'rain' || weatherId === 'storm') {
        ctx.strokeStyle = weatherId === 'storm' ? 'rgba(186, 230, 253, 0.72)' : 'rgba(147, 197, 253, 0.58)';
        ctx.lineWidth = weatherId === 'storm' ? 2.2 : 1.5;
        ctx.beginPath();
        for (const wp of game.weatherParticles) { ctx.moveTo(wp.x, wp.y); ctx.lineTo(wp.x - 10, wp.y + 24); }
        ctx.stroke();
        return;
      }
      const snowing = weatherId === 'snow' || season.id === 'winter' || inMountain;
      if (!snowing && (nightAlpha > 0.2 || !season.particle)) return;
      for (const wp of game.weatherParticles) {
        ctx.fillStyle = snowing ? '#ffffff' : season.particle;
        ctx.beginPath(); ctx.arc(wp.x, wp.y, snowing ? wp.r * 1.15 : wp.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    drawParticles(ctx, particles) {
      for (const pt of particles) {
        ctx.save(); ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    drawSpeechBubbles(ctx, game) {
      const speakers = [game.player, ...game.npcs].filter((s) => s.speechTimer > 0 && s.speech);
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      for (const s of speakers) {
        const tw = ctx.measureText(s.speech).width;
        const bw = tw + 18, bh = 24;
        const bx = s.x - bw / 2, by = s.y - 48;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 8);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#111'; ctx.textAlign = 'center';
        ctx.fillText(s.speech, s.x, by + 16); ctx.textAlign = 'left';
      }
    }

    drawPopups(ctx, popups) {
      for (const pp of popups) {
        ctx.save(); ctx.globalAlpha = Math.max(0, pp.life / pp.maxLife);
        ctx.font = '900 18px Impact, sans-serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.strokeText(pp.text, pp.x, pp.y);
        ctx.fillStyle = pp.color; ctx.fillText(pp.text, pp.x, pp.y);
        ctx.restore();
      }
    }

    drawGarden(ctx, world, now) {
      const gb = world.gardenBounds;
      if (!gb) return;

      // Lush green garden yard pad & wooden picket fence (open southern entrance!)
      ctx.save();
      ctx.fillStyle = '#5ea83a';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(gb.x, gb.y, gb.w, gb.h, 14);
      else ctx.rect(gb.x, gb.y, gb.w, gb.h);
      ctx.fill();

      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Left, Top, Right fence + two short bottom wings leaving wide south entrance
      ctx.moveTo(gb.x + 56, gb.y + gb.h);
      ctx.lineTo(gb.x, gb.y + gb.h);
      ctx.lineTo(gb.x, gb.y);
      ctx.lineTo(gb.x + gb.w, gb.y);
      ctx.lineTo(gb.x + gb.w, gb.y + gb.h);
      ctx.lineTo(gb.x + gb.w - 56, gb.y + gb.h);
      ctx.stroke();

      // Cute wooden fence posts
      ctx.fillStyle = '#d97706';
      for (let fx = gb.x; fx <= gb.x + gb.w; fx += 26) {
        ctx.fillRect(fx - 3, gb.y - 4, 6, 8);
      }

      // Signboard above garden
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(gb.x + gb.w / 2 - 62, gb.y - 24, 124, 19);
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#bef264';
      ctx.fillText('🌱 ORGANİK BAHÇEN', gb.x + gb.w / 2, gb.y - 10);

      // Draw each of the 6 soil beds + crop stage!
      for (const plot of world.gardenPlots) {
        const px = plot.x - plot.w / 2;
        const py = plot.y - plot.h / 2;

        // Tilled soil (darker rich soil when watered!)
        ctx.fillStyle = plot.watered ? '#451a03' : '#78350f';
        ctx.strokeStyle = plot.watered ? '#38bdf8' : '#292524';
        ctx.lineWidth = plot.watered ? 2.5 : 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px, py, plot.w, plot.h, 8);
        else ctx.rect(px, py, plot.w, plot.h);
        ctx.fill();
        ctx.stroke();

        // Soil furrows
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 1.5;
        for (let r = 10; r < plot.h - 6; r += 11) {
          ctx.beginPath(); ctx.moveTo(px + 8, py + r); ctx.lineTo(px + plot.w - 8, py + r); ctx.stroke();
        }

        if (!plot.crop) {
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('+ EK', plot.x, plot.y + 4);
        } else {
          const info = YD.CROPS[plot.crop];
          if (plot.growth >= 1) {
            // Ripe glowing harvestable crop!
            const bob = Math.sin(now * 5 + plot.id) * 3;
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(plot.x, plot.y, 20 + Math.sin(now * 6) * 2.5, 0, Math.PI * 2); ctx.stroke();
            ctx.font = '24px sans-serif';
            ctx.fillText(info.icon, plot.x, plot.y + 8 + bob);
          } else {
            // Sprout / growing bush + tiny progress bar
            const sz = plot.growth < 0.45 ? 13 : 19;
            ctx.font = `${sz}px sans-serif`;
            ctx.fillText(plot.growth < 0.45 ? '🌱' : '🌿', plot.x, plot.y + 4);

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(px + 8, py + plot.h - 9, plot.w - 16, 5);
            ctx.fillStyle = plot.watered ? '#38bdf8' : '#4ade80';
            ctx.fillRect(px + 8, py + plot.h - 9, (plot.w - 16) * plot.growth, 5);
          }
        }
      }
      ctx.textAlign = 'left';
      ctx.restore();
    }

    renderHomeInterior(game) {
      const ctx = this.ctx;
      const vw = game.viewW, vh = game.viewH;
      const now = performance.now() * 0.001;
      const room = YD.HOME_ROOM;
      const scale = Math.min((vw - 60) / room.w, (vh - 140) / room.h, 1.35);

      // Cozy warm ambient dark backdrop outside room walls
      const bg = ctx.createRadialGradient(vw / 2, vh / 2, 80, vw / 2, vh / 2, Math.max(vw, vh) * 0.7);
      bg.addColorStop(0, '#1e1b2e');
      bg.addColorStop(1, '#090b12');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, vw, vh);

      ctx.save();
      ctx.translate(vw / 2, vh / 2 + 12);
      ctx.scale(scale, scale);
      ctx.translate(-room.w / 2, -room.h / 2);

      // Outer shadow + timber walls
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(10, 14, room.w, room.h);

      // Hardwood Plank Floor
      ctx.fillStyle = '#9a6b42';
      ctx.fillRect(0, 0, room.w, room.h);
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.25)';
      ctx.lineWidth = 1.5;
      for (let y = 24; y < room.h; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(room.w, y); ctx.stroke();
      }
      for (let y = 0; y < room.h; y += 24) {
        const off = (y % 48 === 0) ? 0 : 48;
        for (let x = off; x < room.w; x += 96) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 24); ctx.stroke();
        }
      }

      // North Wall Panel (gives cozy 2.5D depth!)
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, room.w, 64);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 58, room.w, 8);

      // Sunlit / Starry Window reflecting real time of day outside!
      const nightAlpha = this.getNightAlpha(game.timeMinutes);
      const winX = room.w / 2 - 58, winY = 10, winW = 116, winH = 42;
      ctx.fillStyle = nightAlpha > 0.25 ? '#0f172a' : '#38bdf8';
      ctx.fillRect(winX, winY, winW, winH);
      if (nightAlpha > 0.25) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.arc(winX + 26, winY + 16, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(winX + 74, winY + 12, 3, 3);
        ctx.fillRect(winX + 92, winY + 24, 2, 2);
      } else {
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.arc(winX + 88, winY + 15, 9, 0, Math.PI * 2); ctx.fill();
        // Warm sunbeam shaft onto floor!
        ctx.fillStyle = 'rgba(254, 240, 138, 0.14)';
        ctx.beginPath();
        ctx.moveTo(winX, 64); ctx.lineTo(winX + winW, 64);
        ctx.lineTo(winX + winW + 45, 220); ctx.lineTo(winX - 45, 220);
        ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.beginPath(); ctx.moveTo(winX + winW / 2, winY); ctx.lineTo(winX + winW / 2, winY + winH); ctx.stroke();

      // Framed Cozy Wall Art on North Wall (flanking the window)
      const drawFrame = (fx, fy, fw, fh, skyCol, hillCol) => {
        ctx.fillStyle = '#78350f'; ctx.fillRect(fx - 3, fy - 3, fw + 6, fh + 6);
        ctx.fillStyle = skyCol; ctx.fillRect(fx, fy, fw, fh);
        ctx.fillStyle = hillCol;
        ctx.beginPath(); ctx.moveTo(fx, fy + fh); ctx.lineTo(fx + fw * 0.4, fy + fh * 0.45); ctx.lineTo(fx + fw, fy + fh); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(fx + fw * 0.72, fy + fh * 0.3, 3.5, 0, Math.PI * 2); ctx.fill();
      };
      drawFrame(218, 15, 40, 28, '#bae6fd', '#16a34a');
      drawFrame(422, 15, 40, 28, '#fecdd3', '#0284c7');

      // Cozy Woven Living-Room Rug in center
      ctx.fillStyle = '#9f1239';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(room.w / 2 - 125, room.h / 2 - 62, 250, 136, 12);
      else ctx.rect(room.w / 2 - 125, room.h / 2 - 62, 250, 136);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)'; ctx.lineWidth = 2;
      ctx.strokeRect(room.w / 2 - 110, room.h / 2 - 48, 220, 108);

      // Helper for rounded rects inside room
      const rrect = (x, y, w, h, r) => {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
        else ctx.rect(x, y, w, h);
      };

      // Draw every furniture spot (Clean illustrated 2D props — ZERO silly text labels!)
      const hp = game.homePlayer;
      for (const sp of room.spots) {
        const unlocked = !sp.decor || game.homeDecor.has(sp.decor);
        const near = Math.hypot(hp.x - sp.x, hp.y - sp.y) < 76;
        const sx = sp.x - sp.w / 2, sy = sp.y - sp.h / 2;

        ctx.save();
        if (!unlocked) {
          // Subtle empty blueprint outline on hardwood floor
          ctx.setLineDash([5, 5]);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
          ctx.lineWidth = 1.6;
          rrect(sx + 4, sy + 4, sp.w - 8, sp.h - 8, 8);
          ctx.fill(); ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255,255,255,0.42)';
          ctx.fillText('+', sp.x, sp.y + 5);
          ctx.restore();
          continue;
        }

        // Subtle golden selection aura ONLY when standing close
        if (near) {
          ctx.strokeStyle = `rgba(253, 224, 71, ${0.55 + Math.sin(now * 5.5) * 0.25})`;
          ctx.lineWidth = 3;
          rrect(sx - 5, sy - 5, sp.w + 10, sp.h + 10, 11);
          ctx.stroke();
        }

        // Ground shadow under furniture
        if (sp.kind !== 'exit' && sp.kind !== 'guitar') {
          ctx.fillStyle = 'rgba(15, 10, 5, 0.26)';
          rrect(sx + 4, sy + 6, sp.w, sp.h, 8);
          ctx.fill();
        }

        if (sp.kind === 'bed') {
          // Solid walnut bed frame + headboard
          ctx.fillStyle = '#5c2d16'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 2;
          rrect(sx, sy, sp.w, sp.h, 8); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#78350f';
          rrect(sx + 2, sy + 2, sp.w - 4, 12, 5); ctx.fill();
          // Crisp mattress & two plump pillows
          ctx.fillStyle = '#f8fafc';
          rrect(sx + 6, sy + 12, sp.w - 12, sp.h - 18, 5); ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          rrect(sx + 10, sy + 15, (sp.w - 28) / 2, 18, 6); ctx.fill();
          rrect(sx + sp.w / 2 + 4, sy + 15, (sp.w - 28) / 2, 18, 6); ctx.fill();
          ctx.fillStyle = '#ffffff';
          rrect(sx + 12, sy + 16, (sp.w - 32) / 2, 14, 5); ctx.fill();
          rrect(sx + sp.w / 2 + 6, sy + 16, (sp.w - 32) / 2, 14, 5); ctx.fill();
          // Cozy quilted duvet + folded white sheet trim
          ctx.fillStyle = '#0284c7';
          rrect(sx + 6, sy + 35, sp.w - 12, sp.h - 41, 4); ctx.fill();
          ctx.fillStyle = '#38bdf8';
          rrect(sx + 6, sy + 35, sp.w - 12, 10, 3); ctx.fill();
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(sx + 6, sy + 33, sp.w - 12, 4);
          // Subtle quilt seam lines
          ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(sx + 10, sy + 52); ctx.lineTo(sx + sp.w - 10, sy + 52);
          ctx.moveTo(sx + 10, sy + 64); ctx.lineTo(sx + sp.w - 10, sy + 64);
          ctx.stroke();
          // Bedpost finials
          ctx.fillStyle = '#92400e';
          for (const [px, py] of [[sx + 4, sy + 4], [sx + sp.w - 4, sy + 4], [sx + 4, sy + sp.h - 4], [sx + sp.w - 4, sy + sp.h - 4]]) {
            ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
          }
        } else if (sp.kind === 'kitchen') {
          // Warm oak kitchen counter + 2-burner stove + simmering copper pot + cutting board
          ctx.fillStyle = '#6b3a1c'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 2;
          rrect(sx, sy, sp.w, sp.h, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#d6b48c';
          rrect(sx + 4, sy + 4, sp.w - 8, sp.h - 8, 4); ctx.fill();
          // Dark glass 2-burner stove plate on top half
          ctx.fillStyle = '#1e293b';
          rrect(sx + 8, sy + 7, sp.w - 16, 26, 3); ctx.fill();
          // Glowing burner + simmering copper saucepan
          ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(sx + 22, sy + 20, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(sx + 45, sy + 20, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fde047';
          ctx.beginPath(); ctx.arc(sx + 45, sy + 20, 5.5, 0, Math.PI * 2); ctx.fill();
          // Pot handle & rising steam
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(sx + 53, sy + 20); ctx.lineTo(sx + 61, sy + 20); ctx.stroke();
          const st = (now * 13) % 9;
          ctx.strokeStyle = `rgba(255,255,255,${0.55 - st * 0.05})`; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(sx + 43, sy + 14 - st); ctx.quadraticCurveTo(sx + 47, sy + 10 - st, ctx.lineTo ? sx + 44 : sx + 44, sy + 6 - st); ctx.stroke();
          // Wooden cutting board with fresh tomato & basil on bottom half
          ctx.fillStyle = '#b45309';
          rrect(sx + 10, sy + 37, 30, 18, 3); ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.arc(sx + 19, sy + 46, 4.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#22c55e';
          ctx.beginPath(); ctx.arc(sx + 29, sy + 45, 3.2, 0, Math.PI * 2); ctx.fill();
          // Stainless steel mini-sink on bottom-right
          ctx.fillStyle = '#94a3b8';
          rrect(sx + 44, sy + 37, 16, 18, 3); ctx.fill();
          ctx.fillStyle = '#38bdf8';
          rrect(sx + 46, sy + 39, 12, 14, 2); ctx.fill();
        } else if (sp.kind === 'espresso') {
          // Warm walnut coffee bar counter
          ctx.fillStyle = '#6b3a1c'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 2;
          rrect(sx, sy, sp.w, sp.h, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#d6b48c';
          rrect(sx + 4, sy + 4, sp.w - 8, sp.h - 8, 4); ctx.fill();
          // Brushed steel espresso machine
          ctx.fillStyle = '#334155';
          rrect(sx + 10, sy + 7, 34, 28, 4); ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(sx + 13, sy + 10, 28, 12);
          ctx.fillStyle = '#22c55e';
          ctx.beginPath(); ctx.arc(sx + 37, sy + 14, 2, 0, Math.PI * 2); ctx.fill();
          // Coffee cup + gentle rising steam
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath(); ctx.arc(sx + 60, sy + 24, 7.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#78350f';
          ctx.beginPath(); ctx.arc(sx + 60, sy + 24, 5, 0, Math.PI * 2); ctx.fill();
          const stY = (now * 14) % 10;
          ctx.strokeStyle = `rgba(255,255,255,${0.55 - stY * 0.045})`; ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sx + 58, sy + 16 - stY); ctx.quadraticCurveTo(sx + 61, sy + 12 - stY, sx + 59, sy + 8 - stY);
          ctx.stroke();
        } else if (sp.kind === 'plants') {
          // Wooden botanical shelf + two terracotta pots with lush swaying leaves
          ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 1.8;
          rrect(sx + 2, sy + 12, sp.w - 4, sp.h - 16, 6); ctx.fill(); ctx.stroke();
          const sway = Math.sin(now * 2.1) * 2;
          for (const [px, py, sc] of [[sx + 23, sy + 28, 1.0], [sx + 54, sy + 26, 0.85]]) {
            ctx.fillStyle = '#c2410c';
            ctx.beginPath(); ctx.arc(px, py, 12 * sc, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath(); ctx.arc(px, py, 9 * sc, 0, Math.PI * 2); ctx.fill();
            for (let a = 0; a < 6; a++) {
              const ang = a * (Math.PI / 3) + sway * 0.04;
              ctx.fillStyle = a % 2 === 0 ? '#16a34a' : '#22c55e';
              ctx.beginPath();
              ctx.ellipse(px + Math.cos(ang) * 9 * sc, py + Math.sin(ang) * 8 * sc, 7 * sc, 4 * sc, ang, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (sp.kind === 'pc') {
          // Oak home-office desk + monitor + keyboard + mouse + mug + chair
          ctx.fillStyle = '#7c4a26'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 2;
          rrect(sx, sy, sp.w, sp.h - 12, 6); ctx.fill(); ctx.stroke();
          // Curved dark monitor with glowing screen
          ctx.fillStyle = '#0f172a';
          rrect(sx + 18, sy + 5, sp.w - 36, 20, 3); ctx.fill();
          ctx.fillStyle = '#0ea5e9';
          ctx.fillRect(sx + 21, sy + 8, sp.w - 42, 13);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(sx + 24, sy + 11, 22, 2);
          ctx.fillRect(sx + 24, sy + 15, 34, 2);
          // Keyboard & mouse
          ctx.fillStyle = '#1e293b';
          rrect(sx + 24, sy + 30, 44, 11, 2); ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sx + 27, sy + 33, 38, 5);
          ctx.fillStyle = '#334155';
          rrect(sx + 74, sy + 31, 9, 12, 4); ctx.fill();
          // Tiny desk mug
          ctx.fillStyle = '#fef08a';
          ctx.beginPath(); ctx.arc(sx + 12, sy + 36, 5, 0, Math.PI * 2); ctx.fill();
          // Swivel chair tucked at bottom of desk
          ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.6;
          rrect(sx + sp.w / 2 - 16, sy + sp.h - 14, 32, 15, 6); ctx.fill(); ctx.stroke();
        } else if (sp.kind === 'sofa') {
          // Sleek TV stand + animated flat-screen TV at top
          ctx.fillStyle = '#451a03'; ctx.strokeStyle = '#1c0a00'; ctx.lineWidth = 1.8;
          rrect(sx + 18, sy, sp.w - 36, 18, 4); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#0f172a';
          rrect(sx + 26, sy + 2, sp.w - 52, 12, 2); ctx.fill();
          ctx.fillStyle = `hsl(${(now * 38) % 360}, 72%, 58%)`;
          ctx.fillRect(sx + 30, sy + 4, sp.w - 60, 7);
          // Small wooden coffee table between TV & couch
          ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.5;
          rrect(sx + 42, sy + 23, sp.w - 84, 13, 4); ctx.fill(); ctx.stroke();
          // Cozy 3-cushion tufted sofa with armrests & throw pillows
          ctx.fillStyle = '#7c2d12'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 2;
          rrect(sx, sy + 40, sp.w, sp.h - 40, 9); ctx.fill(); ctx.stroke();
          // Seat cushions
          ctx.fillStyle = '#c2410c';
          const cw = (sp.w - 28) / 3;
          for (let i = 0; i < 3; i++) {
            rrect(sx + 11 + i * (cw + 3), sy + 44, cw, sp.h - 52, 5); ctx.fill();
          }
          // Backrest & cozy throw pillow
          ctx.fillStyle = '#9a3412';
          rrect(sx + 8, sy + sp.h - 12, sp.w - 16, 10, 4); ctx.fill();
          ctx.fillStyle = '#fde047';
          rrect(sx + 14, sy + 47, 16, 14, 4); ctx.fill();
        } else if (sp.kind === 'guitar') {
          // Small woven corner mat + illustrated acoustic guitar on wooden stand
          ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
          ctx.beginPath(); ctx.ellipse(sp.x, sp.y + 4, 34, 24, 0, 0, Math.PI * 2); ctx.fill();
          ctx.save();
          ctx.translate(sp.x, sp.y + 2);
          ctx.rotate(-0.42);
          // Guitar neck & headstock
          ctx.fillStyle = '#451a03';
          ctx.fillRect(-3, -27, 6, 26);
          ctx.fillStyle = '#78350f';
          rrect(-5, -33, 10, 8, 2); ctx.fill();
          // Acoustic spruce body (figure-8)
          ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.arc(0, 12, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 1, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#d97706'; ctx.fillRect(-9, 0, 18, 13);
          // Soundhole + bridge + strings
          ctx.fillStyle = '#291002';
          ctx.beginPath(); ctx.arc(0, 4, 4.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(-5, 13, 10, 2.5);
          ctx.strokeStyle = 'rgba(254,243,199,0.75)'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(-1.5, -26); ctx.lineTo(-1.5, 13); ctx.moveTo(1.5, -26); ctx.lineTo(1.5, 13); ctx.stroke();
          ctx.restore();
        } else if (sp.kind === 'catalog') {
          // Cozy side bookcase / architect table with colorful books & rolled floorplan
          ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#2b1307'; ctx.lineWidth = 2;
          rrect(sx, sy, sp.w, sp.h, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#a16207';
          rrect(sx + 5, sy + 5, sp.w - 10, sp.h - 10, 4); ctx.fill();
          // Open floorplan sketchbook
          ctx.fillStyle = '#fefce8';
          rrect(sx + 9, sy + 10, sp.w - 18, 22, 2); ctx.fill();
          ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.2;
          ctx.strokeRect(sx + 13, sy + 14, sp.w - 26, 14);
          // Colorful book spines below
          const bookCols = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
          bookCols.forEach((c, idx) => {
            ctx.fillStyle = c;
            ctx.fillRect(sx + 9 + idx * 9, sy + 38, 7, 17);
          });
        } else if (sp.kind === 'exit') {
          // Cozy striped woven doormat + warm wooden doorway threshold (no text!)
          ctx.fillStyle = '#5c2d16';
          ctx.fillRect(sx - 6, sy + sp.h - 6, sp.w + 12, 10);
          ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2;
          rrect(sx, sy, sp.w, sp.h - 4, 5); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(254, 243, 199, 0.45)'; ctx.lineWidth = 2;
          ctx.strokeRect(sx + 6, sy + 5, sp.w - 12, sp.h - 14);
          // Subtle warm down-chevron indicating door exit
          const bob = Math.sin(now * 4) * 2;
          ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(sp.x - 8, sp.y - 2 + bob);
          ctx.lineTo(sp.x, sp.y + 6 + bob);
          ctx.lineTo(sp.x + 8, sp.y - 2 + bob);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw indoor Pet curling/following inside!
      if (game.pet && game.homePet) {
        this.drawPet(ctx, game.homePet, { isInWater: () => false }, now);
      }

      // Draw Player walking inside the room!
      this.drawCharacter(ctx, hp, true, false, false, now);

      // Room border frame + cozy plaque neatly on the north wall (never clipped by top toast!)
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, room.w, room.h);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(16, 16, 176, 26);
      ctx.font = '900 12px Impact, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fde047';
      ctx.fillText(`🏠 ${(game.playerName || 'SENİN').toUpperCase()} EVİ`, 26, 34);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(room.w - 178, 16, 162, 26);
      ctx.textAlign = 'right'; ctx.fillStyle = '#cbd5e1';
      ctx.fillText('[I] DEKOR · [ESC] ÇIK', room.w - 26, 34);
      ctx.textAlign = 'left';

      // Indoor popups & particles
      this.drawParticles(ctx, game.particles);
      this.drawPopups(ctx, game.popups);
      ctx.restore();

      if (game.cameraFlash > 0) {
        this.drawCameraFlashOverlay(ctx, game, vw, vh);
      }
    }

    drawIsland(ctx, world, now) {
      const isl = world.island;
      if (!isl) return;
      ctx.save();
      // Lapping shallow turquoise surf foam halo around Tropical Treasure Island!
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.ellipse(isl.x, isl.y, isl.rx + 18 + Math.sin(now * 2.5) * 4, isl.ry + 14 + Math.cos(now * 2.5) * 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5eead4';
      ctx.beginPath();
      ctx.ellipse(isl.x, isl.y, isl.rx + 10, isl.ry + 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden sandy beach island
      ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(isl.x, isl.y, isl.rx, isl.ry, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Lush central tropical grass knoll
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.ellipse(isl.x, isl.y, isl.rx * 0.62, isl.ry * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ancient Treasure Chest!
      const cx = isl.chestX, cy = isl.chestY;
      if (!isl.chestOpened) {
        ctx.strokeStyle = `rgba(253, 224, 71, ${0.55 + Math.sin(now * 6) * 0.35})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 26 + Math.sin(now * 5) * 3, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = isl.chestOpened ? '#78350f' : '#b45309';
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
      ctx.fillRect(cx - 17, cy - 12, 34, 24); ctx.strokeRect(cx - 17, cy - 12, 34, 24);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 17, cy - 2, 34, 4);
      ctx.fillRect(cx - 4, cy - 5, 8, 9);

      ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(cx - 62, cy - 34, 124, 15);
      ctx.fillStyle = isl.chestOpened ? '#94a3b8' : '#fde047';
      ctx.fillText(isl.chestOpened ? '🏝️ SANDIK AÇILDI ✓' : '🪙 HAZİNE ADASI', cx, cy - 23);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    drawBusStops(ctx) {
      for (const bs of YD.BUS_STOPS) {
        ctx.save();
        ctx.translate(bs.x, bs.y);
        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(-26, -10, 56, 26);
        // Glass & steel bus shelter roof
        ctx.fillStyle = '#0284c7'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-28, -14, 56, 24, 6);
        else ctx.rect(-28, -14, 56, 24);
        ctx.fill(); ctx.stroke();
        // Glossy glass reflection strip
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(-22, -10, 44, 6);
        // Yellow bus stop pole sign
        ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(28, -12, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#111';
        ctx.fillText('B', 28, -8.5);
        // Compact label
        ctx.fillStyle = 'rgba(15,23,42,0.82)';
        ctx.fillRect(-34, -30, 68, 13);
        ctx.font = 'bold 9px "Courier New", monospace'; ctx.fillStyle = '#fde047';
        ctx.fillText('🚏 DURAK', 0, -20.5);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }

    drawPlayerBoat(ctx, x, y, angle, moving, now) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Dramatic Foamy V-Wake Trail behind hull when cruising!
      if (moving) {
        const wLen = 46 + Math.sin(now * 16) * 8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'; ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-26, -5); ctx.lineTo(-26 - wLen, -24);
        ctx.moveTo(-26, 5);  ctx.lineTo(-26 - wLen, 24);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-28, 0); ctx.lineTo(-28 - wLen * 0.85, 0);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.ellipse(0, 0, 38 + Math.sin(now * 3) * 3, 21 + Math.sin(now * 3) * 2, 0, 0, Math.PI * 2); ctx.stroke();
      }

      // Glossy White & Crimson Speedboat Hull
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.quadraticCurveTo(16, -19, -28, -15);
      ctx.lineTo(-30, 15);
      ctx.quadraticCurveTo(16, 19, 34, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Racing crimson side stripe
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(28, 0); ctx.lineTo(-24, -10); ctx.lineTo(-24, -5); ctx.lineTo(18, 0);
      ctx.lineTo(-24, 5); ctx.lineTo(-24, 10); ctx.closePath(); ctx.fill();

      // Tinted curved cockpit windshield & captain seat
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-14, -9, 20, 18);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(0, -8, 8, 16);
      // Outboard engine block
      ctx.fillStyle = '#334155'; ctx.fillRect(-35, -6, 8, 12); ctx.strokeRect(-35, -6, 8, 12);
      ctx.restore();
    }

    drawDeliveryBeacon(ctx, game, now) {
      const tgt = game.delivery.target;
      if (!tgt) return;
      ctx.save();
      // Pulsing golden landing zone at destination!
      const pulse = 36 + Math.sin(now * 7) * 9;
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(tgt.x, tgt.y, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctx.beginPath(); ctx.arc(tgt.x, tgt.y, pulse, 0, Math.PI * 2); ctx.fill();

      ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15,23,42,0.88)';
      ctx.fillRect(tgt.x - 68, tgt.y - 54, 136, 18);
      ctx.fillStyle = '#fde047';
      ctx.fillText('📦 TESLİMAT NOKTASI', tgt.x, tgt.y - 41);

      // Orbiting directional compass arrow around player pointing straight to destination!
      const p = game.player;
      const dist = Math.hypot(tgt.x - p.x, tgt.y - p.y);
      if (dist > 95) {
        const ang = Math.atan2(tgt.y - p.y, tgt.x - p.x);
        const ax = p.x + Math.cos(ang) * 62;
        const ay = p.y + Math.sin(ang) * 62;
        ctx.translate(ax, ay);
        ctx.rotate(ang);
        ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }

    drawGuideBeacon(ctx, game, now) {
      if (game.scene !== 'world') return;
      const wp = game.getStarterWaypoint();
      if (!wp) return;
      const p = game.player;
      const dist = Math.hypot(wp.x - p.x, wp.y - p.y);
      ctx.save();
      // Gentle pulsing sky-blue ring at destination
      const pulse = 26 + Math.sin(now * 5.2) * 6;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.88)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wp.x, wp.y, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.beginPath(); ctx.arc(wp.x, wp.y, pulse, 0, Math.PI * 2); ctx.fill();

      // Small floating GOAL label above waypoint when nearby or visible
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.fillRect(wp.x - 44, wp.y - 46, 88, 17);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('🎯 HEDEF', wp.x, wp.y - 34);

      // Orbiting directional compass arrow around player when >95px away
      if (dist > 95) {
        const ang = Math.atan2(wp.y - p.y, wp.x - p.x);
        const ax = p.x + Math.cos(ang) * 56;
        const ay = p.y + Math.sin(ang) * 56;
        ctx.translate(ax, ay);
        ctx.rotate(ang);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(12, 0); ctx.lineTo(-7, -7.5); ctx.lineTo(-3.5, 0); ctx.lineTo(-7, 7.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }

    drawSwarmBeacon(ctx, game, now) {
      const p = game.player;
      const ap = game.autoPilot;
      ctx.save();
      // Glowing emerald AI autopilot halo around player
      const r = 24 + Math.sin(now * 6) * 2.5;
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.78)';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      const orbAng = now * 3.5;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.arc(p.x + Math.cos(orbAng) * r, p.y + Math.sin(orbAng) * r, 3.6, 0, Math.PI * 2); ctx.fill();

      // Dashed trajectory line & waypoint ring when heading to an autonomous target
      if (typeof ap.targetX === 'number' && typeof ap.targetY === 'number') {
        const dist = Math.hypot(ap.targetX - p.x, ap.targetY - p.y);
        if (dist > 36) {
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.48)';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(ap.targetX, ap.targetY);
          ctx.stroke();
          ctx.setLineDash([]);

          const tr = 20 + Math.sin(now * 7) * 4;
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2.8;
          ctx.beginPath(); ctx.arc(ap.targetX, ap.targetY, tr, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawBirds(ctx, world, now, viewBox) {
      if (!world.birds) return;
      ctx.save();
      for (const bd of world.birds) {
        if (bd.x < viewBox.x1 || bd.x > viewBox.x2 || bd.y < viewBox.y1 || bd.y > viewBox.y2) continue;
        const flap = Math.sin(now * 9 + bd.phase) * 5;
        // Soft ground shadow below soaring bird
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.16)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bd.x + 14 - 8, bd.y + 38 + flap * 0.5);
        ctx.quadraticCurveTo(bd.x + 14, bd.y + 34, bd.x + 14 + 8, bd.y + 38 + flap * 0.5);
        ctx.stroke();
        // Crisp white soaring seagull wings
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bd.x - 10, bd.y + flap);
        ctx.quadraticCurveTo(bd.x - 4, bd.y - 5, bd.x, bd.y);
        ctx.quadraticCurveTo(bd.x + 4, bd.y - 5, bd.x + 10, bd.y + flap);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawMinimap(game, season) {
      const mctx = this.miniCtx;
      const mw = this.miniCanvas.width, mh = this.miniCanvas.height;
      const sx = mw / YD.WORLD_W, sy = mh / YD.WORLD_H;

      mctx.clearRect(0, 0, mw, mh);
      mctx.fillStyle = '#e2e8f0'; mctx.fillRect(0, 0, mw, YD.MOUNTAIN_Y * sy);
      mctx.fillStyle = season.forest; mctx.fillRect(0, YD.MOUNTAIN_Y * sy, YD.CITY_X1 * sx, (YD.BEACH_Y - YD.MOUNTAIN_Y) * sy);
      mctx.fillStyle = '#64748b'; mctx.fillRect(YD.CITY_X1 * sx, YD.MOUNTAIN_Y * sy, (YD.CITY_X2 - YD.CITY_X1) * sx, (YD.BEACH_Y - YD.MOUNTAIN_Y) * sy);
      mctx.fillStyle = season.park; mctx.fillRect(YD.CITY_X2 * sx, YD.MOUNTAIN_Y * sy, (YD.WORLD_W - YD.CITY_X2) * sx, (YD.BEACH_Y - YD.MOUNTAIN_Y) * sy);
      mctx.fillStyle = '#f6d78a'; mctx.fillRect(0, YD.BEACH_Y * sy, mw, (YD.SEA_Y - YD.BEACH_Y) * sy);
      mctx.fillStyle = '#0284c7'; mctx.fillRect(0, YD.SEA_Y * sy, mw, (YD.WORLD_H - YD.SEA_Y) * sy);

      // Tropical Treasure Island on minimap!
      if (game.world.island) {
        const isl = game.world.island;
        mctx.fillStyle = '#fde68a';
        mctx.beginPath(); mctx.ellipse(isl.x * sx, isl.y * sy, Math.max(5, isl.rx * sx), Math.max(3.5, isl.ry * sy), 0, 0, Math.PI * 2); mctx.fill();
      }

      mctx.fillStyle = '#2dd4bf';
      mctx.beginPath(); mctx.ellipse(game.world.hotSpring.x * sx, game.world.hotSpring.y * sy, game.world.hotSpring.rx * sx, game.world.hotSpring.ry * sy, 0, 0, Math.PI * 2); mctx.fill();
      mctx.fillStyle = '#38bdf8';
      mctx.beginPath(); mctx.ellipse(game.world.pond.x * sx, game.world.pond.y * sy, game.world.pond.rx * sx, game.world.pond.ry * sy, 0, 0, Math.PI * 2); mctx.fill();
      mctx.fillStyle = '#92400e';
      mctx.fillRect(game.world.pier.x * sx, game.world.pier.y * sy, Math.max(4, game.world.pier.w * sx), game.world.pier.h * sy);

      if (game.world.gardenBounds) {
        const gb = game.world.gardenBounds;
        mctx.fillStyle = '#84cc16';
        mctx.fillRect(gb.x * sx, gb.y * sy, Math.max(5, gb.w * sx), Math.max(4, gb.h * sy));
      }

      mctx.fillStyle = '#1e293b';
      for (const b of game.world.buildings) mctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);

      if (game.delivery && game.delivery.active && game.delivery.target) {
        const dt = game.delivery.target;
        mctx.fillStyle = '#fde047'; mctx.strokeStyle = '#111'; mctx.lineWidth = 1.4;
        mctx.beginPath(); mctx.arc(dt.x * sx, dt.y * sy, 4.5, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
      } else if (game.guideCompass && game.getStarterWaypoint) {
        const gw = game.getStarterWaypoint();
        if (gw) {
          mctx.fillStyle = '#38bdf8'; mctx.strokeStyle = '#0f172a'; mctx.lineWidth = 1.4;
          mctx.beginPath(); mctx.arc(gw.x * sx, gw.y * sy, 4, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
        }
      }
      if (game.autoPilot && game.autoPilot.active && typeof game.autoPilot.targetX === 'number') {
        mctx.strokeStyle = '#4ade80'; mctx.lineWidth = 1.6;
        mctx.beginPath(); mctx.arc(game.autoPilot.targetX * sx, game.autoPilot.targetY * sy, 4, 0, Math.PI * 2); mctx.stroke();
      }

      if (game.pastEcho && !game.pastEcho.claimed) {
        mctx.fillStyle = '#facc15'; mctx.beginPath(); mctx.arc(game.pastEcho.x * sx, game.pastEcho.y * sy, 3.5, 0, Math.PI * 2); mctx.fill();
      }
      if (game.inventory.has('car') && !game.player.inCar && game.parkedCar) {
        mctx.fillStyle = '#06b6d4'; mctx.fillRect(game.parkedCar.x * sx - 3, game.parkedCar.y * sy - 3, 6, 6);
      }

      mctx.fillStyle = '#ef4444'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.8;
      mctx.beginPath(); mctx.arc(game.player.x * sx, game.player.y * sy, 4.5, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
    }
  }

  YD.WorldRenderer = WorldRenderer;
})(window.YasamDunya);
