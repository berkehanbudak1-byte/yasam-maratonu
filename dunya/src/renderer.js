/**
 * Yaşam Maratonu: Büyük Dünya — Ultra-Fluid 60 FPS Cel-Shaded Open-World Renderer
 * Draws Forest, City, Park & Pond, Golden Beach, Animated Sea, Pier, Lighthouse,
 * 4D Past-Self Echo, Wildlife, Day/Night Glows, Seasons & Minimap!
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  class WorldRenderer {
    constructor(canvas, miniCanvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.miniCanvas = miniCanvas;
      this.miniCtx = miniCanvas.getContext('2d');
    }

    render(game) {
      const ctx = this.ctx;
      const vw = game.viewW, vh = game.viewH;
      ctx.clearRect(0, 0, vw, vh);

      const season = YD.SEASONS[game.seasonIdx];
      const now = performance.now() * 0.001;
      const nightAlpha = this.getNightAlpha(game.timeMinutes);

      ctx.save();
      ctx.translate(vw / 2, vh / 2);
      ctx.scale(game.cam.zoom, game.cam.zoom);
      ctx.translate(-game.cam.x, -game.cam.y);

      this.drawBiomes(ctx, game.world, season, now);
      this.drawRoadsAndPaths(ctx, game.world);
      this.drawPondAndPier(ctx, game.world, now);
      this.drawCampfireAndAltar(ctx, game.world, now);
      this.drawBenchesAndUmbrellas(ctx, game.world);
      this.drawForageables(ctx, game.world);
      this.drawInteractRings(ctx, game);
      this.drawWildlife(ctx, game.world, now);
      this.drawBoats(ctx, game.world, now);
      this.drawCars(ctx, game.world, nightAlpha > 0.18);

      // 4D Past-Self Echo (Geçmiş Benlik Yankısı!)
      if (game.pastEcho && !game.pastEcho.claimed) {
        this.drawPastEcho(ctx, game.pastEcho, now);
      }

      // Friendly Townsfolk NPCs
      for (const npc of game.npcs) this.drawCharacter(ctx, npc, false, false, false, now);

      // Player Character (Walking / Sprinting / Biking / Swimming!)
      this.drawCharacter(ctx, game.player, true, game.player.swimming, game.player.onBike, now);

      this.drawBuildings3D(ctx, game.world, game.cam);
      this.drawLighthouse(ctx, game.world, nightAlpha);
      this.drawTrees(ctx, game.world, season, now);
      this.drawParticles(ctx, game.particles);
      this.drawSpeechBubbles(ctx, game);
      this.drawPopups(ctx, game.popups);

      // Nighttime Warm Glows (Campfire, Streetlamps, Player Lantern)
      if (nightAlpha > 0.08) {
        this.drawNightGlows(ctx, game, nightAlpha);
      }

      ctx.restore();

      // Day/Sunset/Night Full-Screen Tint + Seasonal Weather Particles
      this.drawSkyLighting(ctx, vw, vh, game.timeMinutes);
      this.drawWeatherParticles(ctx, game.weatherParticles, season, nightAlpha);

      this.drawMinimap(game, season);
    }

    getNightAlpha(timeMinutes) {
      // 07:00..17:00 day (0), 17:00..20:30 dusk ramp, 20:30..24:00 night (0.48), 00:00..06:30 night
      const hr = (timeMinutes / 60) % 24;
      if (hr >= 7 && hr < 17) return 0;
      if (hr >= 17 && hr < 20.5) return ((hr - 17) / 3.5) * 0.44;
      if (hr >= 5 && hr < 7) return ((7 - hr) / 2) * 0.44;
      return 0.44;
    }

    drawBiomes(ctx, world, season, now) {
      // Forest Floor (West)
      ctx.fillStyle = season.forest;
      ctx.fillRect(0, 0, YD.CITY_X1, YD.BEACH_Y);

      // City Base Grass / Pavement (Center)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(YD.CITY_X1, 0, YD.CITY_X2 - YD.CITY_X1, YD.BEACH_Y);
      ctx.fillStyle = season.grass;
      ctx.fillRect(YD.CITY_X1, 0, YD.CITY_X2 - YD.CITY_X1, 610);

      // Green Park (East)
      ctx.fillStyle = season.park;
      ctx.fillRect(YD.CITY_X2, 0, YD.WORLD_W - YD.CITY_X2, YD.BEACH_Y);

      // Golden Beach Sand (South)
      ctx.fillStyle = season.id === 'winter' ? '#e5d9b6' : '#f6d78a';
      ctx.fillRect(0, YD.BEACH_Y, YD.WORLD_W, YD.SEA_Y - YD.BEACH_Y);

      // Shoreline wet sand band
      ctx.fillStyle = '#e6be6c';
      ctx.fillRect(0, YD.SEA_Y - 26, YD.WORLD_W, 26);

      // Animated Turquoise Sea!
      const seaGrad = ctx.createLinearGradient(0, YD.SEA_Y, 0, YD.WORLD_H);
      seaGrad.addColorStop(0, '#22d3ee');
      seaGrad.addColorStop(0.35, '#0284c7');
      seaGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, YD.SEA_Y, YD.WORLD_W, YD.WORLD_H - YD.SEA_Y);

      // Rolling White Animated Foam Waves along the entire coast!
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 4;
      for (let row = 0; row < 5; row++) {
        const wy = YD.SEA_Y + 12 + row * 125 + Math.sin(now * 2.1 + row) * 10;
        ctx.beginPath();
        for (let wx = 0; wx <= YD.WORLD_W; wx += 90) {
          const yOff = Math.sin(wx * 0.015 + now * 2.4 + row) * 8;
          if (wx === 0) ctx.moveTo(wx, wy + yOff);
          else ctx.lineTo(wx, wy + yOff);
        }
        ctx.stroke();
      }
    }

    drawRoadsAndPaths(ctx, world) {
      // Forest Dirt Trail (Campfire -> Altar -> City)
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 48;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(520, 420); ctx.lineTo(840, 860); ctx.lineTo(1130, 890); ctx.lineTo(1660, 1340);
      ctx.stroke();

      // City Paved Boulevards
      ctx.fillStyle = '#475569';
      ctx.fillRect(YD.CITY_X1, 1290, YD.CITY_X2 - YD.CITY_X1, 100);
      ctx.fillRect(YD.CITY_X1, 1790, YD.CITY_X2 - YD.CITY_X1, 100);
      ctx.fillRect(2160, 820, 100, YD.BEACH_Y - 820);

      // Dashed Road Markings
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 16]);
      ctx.beginPath();
      ctx.moveTo(YD.CITY_X1, 1340); ctx.lineTo(YD.CITY_X2, 1340);
      ctx.moveTo(YD.CITY_X1, 1840); ctx.lineTo(YD.CITY_X2, 1840);
      ctx.moveTo(2210, 840); ctx.lineTo(2210, YD.BEACH_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Beachfront Coastal Boardwalk Promenade
      ctx.fillStyle = '#d6c3a5';
      ctx.fillRect(100, YD.BEACH_Y - 26, YD.WORLD_W - 200, 32);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, YD.BEACH_Y - 26, YD.WORLD_W - 200, 32);

      // Park Stone Jogging Loop around the Pond!
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 38;
      ctx.beginPath();
      ctx.ellipse(world.pond.x, world.pond.y, world.pond.rx + 80, world.pond.ry + 80, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Park Fitness Mat Area
      ctx.fillStyle = '#fb923c';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.fillRect(3340, 1390, 160, 115);
      ctx.strokeRect(3340, 1390, 160, 115);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏃 PARK SPOR ALANI', 3420, 1452);
      ctx.textAlign = 'left';
    }

    drawPondAndPier(ctx, world, now) {
      // Park Pond
      const p = world.pond;
      ctx.fillStyle = '#0ea5e9';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Pond shimmer ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx * 0.65 + Math.sin(now * 2) * 5, p.ry * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Wooden Fishing Pier extending into the Sea!
      const pr = world.pier;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(pr.x + 8, pr.y + 8, pr.w, pr.h);
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
      ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);

      // Wooden Planks
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      for (let py = pr.y + 16; py < pr.y + pr.h; py += 18) {
        ctx.beginPath(); ctx.moveTo(pr.x, py); ctx.lineTo(pr.x + pr.w, py); ctx.stroke();
      }
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🎣 BALIK İSKELESİ', pr.x + pr.w / 2, pr.y + pr.h - 14);
      ctx.textAlign = 'left';
    }

    drawCampfireAndAltar(ctx, world, now) {
      // Forest Campfire
      const cf = world.campfire;
      ctx.fillStyle = '#57534e';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cf.x + Math.cos(a) * 18, cf.y + Math.sin(a) * 18, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      const flick = 1 + Math.sin(now * 14) * 0.16;
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.arc(cf.x, cf.y, 13 * flick, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(cf.x, cf.y, 7 * flick, 0, Math.PI * 2); ctx.fill();

      // Ancient 4D Relic Altar in Deep Forest!
      const al = world.altar;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(al.x, al.y, al.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(al.x, al.y, 20 + Math.sin(now * 3) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏳', al.x, al.y);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }

    drawBenchesAndUmbrellas(ctx, world) {
      for (const b of world.benches) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.2;
        ctx.fillRect(-26, -8, 52, 16);
        ctx.strokeRect(-26, -8, 52, 16);
        ctx.restore();
      }
      for (const u of world.umbrellas) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.arc(u.x + 6, u.y + 7, u.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = u.color;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.arc(u.x, u.y, u.r, i * Math.PI / 2, i * Math.PI / 2 + Math.PI / 4);
          ctx.closePath(); ctx.fill();
        }
        ctx.stroke();
      }
    }

    drawForageables(ctx, world) {
      for (const fg of world.forageables) {
        if (fg.collected) continue;
        ctx.fillStyle = fg.kind === 'berry' ? '#16a34a' : '#fef3c7';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fg.x, fg.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fg.kind === 'berry' ? '🍓' : '🍄', fg.x, fg.y + 1);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
      }
    }

    drawInteractRings(ctx, game) {
      const p = game.player;
      for (const it of game.world.interactables) {
        const near = Math.hypot(p.x - it.x, p.y - it.y) < it.r + 22;
        ctx.strokeStyle = near ? '#ffe135' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = near ? 3.5 : 2;
        ctx.beginPath(); ctx.arc(it.x, it.y, near ? 26 : 18, 0, Math.PI * 2); ctx.stroke();
      }
    }

    drawWildlife(ctx, world, now) {
      // Forest Deer & Rabbits
      for (const w of world.wildlife) {
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.angle);
        ctx.fillStyle = w.kind === 'deer' ? '#b45309' : '#f1f5f9';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, w.kind === 'deer' ? 14 : 8, w.kind === 'deer' ? 8 : 5.5, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.arc(w.kind === 'deer' ? 12 : 7, 0, w.kind === 'deer' ? 6 : 4, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      // Park Pond Swimming Ducks!
      for (const dk of world.ducks) {
        const dx = world.pond.x + Math.cos(dk.angle) * dk.orbitRx;
        const dy = world.pond.y + Math.sin(dk.angle) * dk.orbitRy;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(dx, dy, 10 + Math.sin(now * 5) * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(dx, dy, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }

    drawBoats(ctx, world, now) {
      for (const bt of world.boats) {
        const bob = Math.sin(now * 2.5 + bt.x * 0.01) * 4;
        ctx.save();
        ctx.translate(bt.x, bt.y + bob);
        ctx.scale(bt.dir, 1);
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.lineTo(18, 14); ctx.lineTo(-20, 14); ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Sail
        ctx.fillStyle = bt.sailColor;
        ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2, -34); ctx.lineTo(22, -4); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    drawCars(ctx, world, headlights) {
      for (const c of world.cars) {
        if (headlights) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
          ctx.beginPath();
          ctx.moveTo(c.x + c.dir * 30, c.y - 10);
          ctx.lineTo(c.x + c.dir * 110, c.y - 28);
          ctx.lineTo(c.x + c.dir * 110, c.y + 28);
          ctx.lineTo(c.x + c.dir * 30, c.y + 10);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = c.color;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.fillRect(c.x - 28, c.y - 15, 56, 30);
        ctx.strokeRect(c.x - 28, c.y - 15, 56, 30);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(c.x - 14, c.y - 11, 28, 22);
      }
    }

    drawPastEcho(ctx, echo, now) {
      ctx.save();
      ctx.globalAlpha = 0.62 + Math.sin(now * 5) * 0.16;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(echo.x, echo.y, 24 + Math.sin(now * 4) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(echo.x, echo.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe135';
      ctx.fillText('✨ GEÇMİŞ YANKIN', echo.x, echo.y - 26);
      ctx.restore();
    }

    drawCharacter(ctx, c, isPlayer, swimming, onBike, now) {
      ctx.save();
      ctx.translate(c.x, c.y);

      if (swimming) {
        // Swimming water ripples!
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
        const rip = 16 + Math.sin(now * 7) * 4;
        ctx.beginPath(); ctx.arc(0, 0, rip, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(c.angle);
        ctx.fillStyle = '#f5cfa0';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(2, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(0, 0, 9.5, Math.PI * 0.55, Math.PI * 1.45); ctx.fill();
        ctx.restore();
        return;
      }

      ctx.rotate(c.angle);

      // Bicycle under player!
      if (onBike) {
        ctx.fillStyle = '#111';
        ctx.fillRect(-20, -4, 14, 8);
        ctx.fillRect(10, -4, 14, 8);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(16, 0); ctx.stroke();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(14, 12); ctx.stroke();
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.beginPath(); ctx.ellipse(2, 5, 16, 13, 0, 0, Math.PI * 2); ctx.fill();

      const swing = Math.sin(c.walkCycle || 0) * 4;
      ctx.fillStyle = c.color || '#38bdf8';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.ellipse(0, 0, 12, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#f5cfa0';
      ctx.beginPath(); ctx.arc(8 + swing, -13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(8 - swing, 13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.beginPath(); ctx.arc(2, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isPlayer ? '#1e1b18' : '#78350f';
      ctx.beginPath(); ctx.arc(0, 0, 9.5, Math.PI * 0.52, Math.PI * 1.48); ctx.fill();

      ctx.restore();

      if (!isPlayer) {
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(15,23,42,0.75)';
        ctx.fillRect(c.x - 44, c.y - 32, 88, 13);
        ctx.fillStyle = '#fde047';
        ctx.fillText(c.name, c.x, c.y - 22);
        ctx.textAlign = 'left';
      }
    }

    drawBuildings3D(ctx, world, cam) {
      for (const b of world.buildings) {
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const ox = Math.max(-22, Math.min(22, (cx - cam.x) * 0.045));
        const oy = Math.max(-22, Math.min(22, (cy - cam.y) * 0.045));
        const rx = b.x + ox, ry = b.y + oy;

        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);
        ctx.fillStyle = b.color;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);

        ctx.fillStyle = b.roof;
        ctx.fillRect(rx, ry, b.w, b.h); ctx.strokeRect(rx, ry, b.w, b.h);

        ctx.font = '900 15px Impact, "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#111';
        ctx.fillText(b.label, rx + b.w / 2 + 1.5, ry + b.h / 2 + 1.5);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(b.label, rx + b.w / 2, ry + b.h / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
      }
    }

    drawLighthouse(ctx, world, nightAlpha) {
      const lh = world.lighthouse;
      // Rotating Lighthouse Beam (glows dramatically at sunset/night!)
      if (nightAlpha > 0.05) {
        ctx.save();
        ctx.translate(lh.x, lh.y);
        ctx.rotate(lh.beamAngle);
        ctx.fillStyle = `rgba(254, 240, 138, ${nightAlpha * 0.65})`;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(420, -90); ctx.lineTo(420, 90); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(lh.x, lh.y, lh.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(lh.x, lh.y, lh.r * 0.66, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(lh.x, lh.y, 10, 0, Math.PI * 2); ctx.fill();
    }

    drawTrees(ctx, world, season, now) {
      for (const tr of world.trees) {
        const sway = Math.sin(now * 1.8 + tr.x * 0.02) * 2.5;
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.beginPath(); ctx.arc(tr.x + 6, tr.y + 7, tr.r, 0, Math.PI * 2); ctx.fill();

        if (tr.kind === 'palm') {
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2;
          ctx.fillStyle = '#16a34a';
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + sway * 0.03;
            ctx.beginPath();
            ctx.ellipse(tr.x + Math.cos(a) * 14, tr.y + Math.sin(a) * 14, 15, 6, a, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
          }
          ctx.fillStyle = '#78350f';
          ctx.beginPath(); ctx.arc(tr.x, tr.y, 7, 0, Math.PI * 2); ctx.fill();
        } else {
          let col = '#15803d', hi = '#22c55e';
          if (tr.kind === 'blossom') { col = '#f472b6'; hi = '#fbcfe8'; }
          else if (season.id === 'autumn') { col = '#c2410c'; hi = '#fb923c'; }
          else if (season.id === 'winter') { col = '#64748b'; hi = '#f1f5f9'; }
          else if (tr.kind === 'pine') { col = '#14532d'; hi = '#16a34a'; }

          ctx.fillStyle = col;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.arc(tr.x + sway, tr.y, tr.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = hi;
          ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.22 + sway, tr.y - tr.r * 0.22, tr.r * 0.52, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    drawNightGlows(ctx, game, nightAlpha) {
      const glow = (x, y, r, rgba) => {
        const g = ctx.createRadialGradient(x, y, 4, x, y, r);
        g.addColorStop(0, rgba);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      };
      // Campfire warm glow
      glow(game.world.campfire.x, game.world.campfire.y, 170, `rgba(251, 146, 60, ${nightAlpha * 1.1})`);
      // City streetlamps
      for (const lm of game.world.streetlamps) {
        glow(lm.x, lm.y, 110, `rgba(254, 240, 138, ${nightAlpha * 0.9})`);
      }
      // Player Antik Fener lantern glow!
      const lanternR = game.inventory.has('lantern') ? 220 : 95;
      glow(game.player.x, game.player.y, lanternR, `rgba(253, 224, 71, ${nightAlpha * 0.85})`);
    }

    drawSkyLighting(ctx, vw, vh, timeMinutes) {
      const hr = (timeMinutes / 60) % 24;
      if (hr >= 17 && hr < 19.5) {
        const a = Math.sin(((hr - 17) / 2.5) * Math.PI) * 0.22;
        ctx.fillStyle = `rgba(249, 115, 22, ${a})`;
        ctx.fillRect(0, 0, vw, vh);
      }
      const nightA = this.getNightAlpha(timeMinutes);
      if (nightA > 0) {
        ctx.fillStyle = `rgba(15, 23, 42, ${nightA})`;
        ctx.fillRect(0, 0, vw, vh);
      }
    }

    drawWeatherParticles(ctx, list, season, nightAlpha) {
      for (const wp of list) {
        ctx.fillStyle = nightAlpha > 0.2 ? '#fef08a' : (season.particle || 'rgba(255,255,255,0.45)');
        ctx.beginPath(); ctx.arc(wp.x, wp.y, wp.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    drawParticles(ctx, particles) {
      for (const pt of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
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
        ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#111'; ctx.textAlign = 'center';
        ctx.fillText(s.speech, s.x, by + 16);
        ctx.textAlign = 'left';
      }
    }

    drawPopups(ctx, popups) {
      for (const pp of popups) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pp.life / pp.maxLife);
        ctx.font = '900 18px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = '#111';
        ctx.strokeText(pp.text, pp.x, pp.y);
        ctx.fillStyle = pp.color;
        ctx.fillText(pp.text, pp.x, pp.y);
        ctx.restore();
      }
    }

    drawMinimap(game, season) {
      const mctx = this.miniCtx;
      const mw = this.miniCanvas.width, mh = this.miniCanvas.height;
      const sx = mw / YD.WORLD_W, sy = mh / YD.WORLD_H;

      mctx.clearRect(0, 0, mw, mh);
      // Biomes
      mctx.fillStyle = season.forest;
      mctx.fillRect(0, 0, YD.CITY_X1 * sx, YD.BEACH_Y * sy);
      mctx.fillStyle = '#64748b';
      mctx.fillRect(YD.CITY_X1 * sx, 0, (YD.CITY_X2 - YD.CITY_X1) * sx, YD.BEACH_Y * sy);
      mctx.fillStyle = season.park;
      mctx.fillRect(YD.CITY_X2 * sx, 0, (YD.WORLD_W - YD.CITY_X2) * sx, YD.BEACH_Y * sy);
      mctx.fillStyle = '#f6d78a';
      mctx.fillRect(0, YD.BEACH_Y * sy, mw, (YD.SEA_Y - YD.BEACH_Y) * sy);
      mctx.fillStyle = '#0284c7';
      mctx.fillRect(0, YD.SEA_Y * sy, mw, (YD.WORLD_H - YD.SEA_Y) * sy);

      // Park Pond & Pier
      mctx.fillStyle = '#38bdf8';
      mctx.beginPath();
      mctx.ellipse(game.world.pond.x * sx, game.world.pond.y * sy, game.world.pond.rx * sx, game.world.pond.ry * sy, 0, 0, Math.PI * 2);
      mctx.fill();
      mctx.fillStyle = '#92400e';
      mctx.fillRect(game.world.pier.x * sx, game.world.pier.y * sy, Math.max(4, game.world.pier.w * sx), game.world.pier.h * sy);

      // Buildings
      mctx.fillStyle = '#1e293b';
      for (const b of game.world.buildings) mctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);

      // Past Echo Gold Dot
      if (game.pastEcho && !game.pastEcho.claimed) {
        mctx.fillStyle = '#facc15';
        mctx.beginPath(); mctx.arc(game.pastEcho.x * sx, game.pastEcho.y * sy, 3.5, 0, Math.PI * 2); mctx.fill();
      }

      // Player Dot
      mctx.fillStyle = '#ef4444';
      mctx.strokeStyle = '#fff';
      mctx.lineWidth = 1.8;
      mctx.beginPath();
      mctx.arc(game.player.x * sx, game.player.y * sy, 4.5, 0, Math.PI * 2);
      mctx.fill(); mctx.stroke();
    }
  }

  YD.WorldRenderer = WorldRenderer;
})(window.YasamDunya);
