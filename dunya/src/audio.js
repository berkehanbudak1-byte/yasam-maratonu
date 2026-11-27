/**
 * Yaşam Maratonu: Büyük Dünya v2 — Cozy Procedural Audio + Rain, Thunder, Car Horn & Guitar SFX
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  class CozyAudio {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.musicOn = true;
      this.accum = 0;
      this.step = 0;
    }

    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    tone(freq, endFreq, dur, type = 'sine', vol = 0.08, delay = 0) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + dur + 0.01);
    }

    noise(dur, vol = 0.06, freq = 800) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(freq, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(f); f.connect(g); g.connect(this.ctx.destination);
      src.start(now);
    }

    updateAmbient(dt, biome, weatherId) {
      if (this.muted || !this.musicOn || !this.ctx || this.ctx.state !== 'running') return;
      this.accum += dt;
      const interval = biome === 'sea' || biome === 'beach' ? 0.55 : (biome === 'mountain' ? 0.50 : 0.44);
      if (this.accum < interval) return;
      this.accum -= interval;
      const s = this.step++ % 16;

      const scale = biome === 'mountain'
        ? [329.6, 392.0, 440.0, 523.3, 659.3, 784.0]
        : (biome === 'forest'
            ? [293.7, 329.6, 392.0, 440.0, 523.3, 587.3]
            : [261.6, 293.7, 329.6, 392.0, 440.0, 523.3]);
      const pattern = [0, -1, 2, 4, -1, 3, 2, -1, 1, -1, 3, 5, -1, 4, 2, -1];
      const idx = pattern[s];
      if (idx >= 0) this.tone(scale[idx], scale[idx] * 0.998, 0.36, 'triangle', 0.026);
      if (s % 8 === 0) this.tone(scale[0] * 0.5, scale[0] * 0.5, 0.7, 'sine', 0.022);

      // Rain hiss / Sea waves / Forest birds
      if (weatherId === 'rain' || weatherId === 'storm') {
        if (s % 2 === 0) this.noise(0.55, 0.018, 1200);
      } else if ((biome === 'beach' || biome === 'sea') && s === 0) {
        this.noise(0.9, 0.022, 460);
      } else if ((biome === 'forest' || biome === 'park') && s === 6 && Math.random() < 0.45) {
        this.tone(1800, 2350, 0.07, 'sine', 0.018);
        this.tone(2200, 1900, 0.08, 'sine', 0.016, 0.08);
      }
    }

    thunder() { this.noise(1.1, 0.14, 180); this.tone(75, 28, 0.85, 'sawtooth', 0.09); }
    carHorn() { this.tone(370, 370, 0.16, 'sawtooth', 0.08); this.tone(466, 466, 0.16, 'sawtooth', 0.07); }
    carStart(){ this.tone(90, 240, 0.22, 'sawtooth', 0.07); }
    guitar()  { [329.6, 392.0, 493.9, 659.3].forEach((n, i) => this.tone(n, n * 0.99, 0.35, 'triangle', 0.07, i * 0.07)); }
    coin()    { this.tone(880, 1175, 0.09, 'triangle', 0.11); this.tone(1175, 1760, 0.14, 'triangle', 0.10, 0.07); }
    pickup()  { this.tone(523, 659, 0.08, 'triangle', 0.10); this.tone(659, 880, 0.12, 'triangle', 0.10, 0.06); }
    splash()  { this.noise(0.18, 0.08, 1200); this.tone(320, 180, 0.12, 'sine', 0.06); }
    miss()    { this.tone(240, 140, 0.18, 'sawtooth', 0.09); }
    sleep()   { this.tone(440, 330, 0.25, 'sine', 0.08); this.tone(330, 261, 0.35, 'sine', 0.08, 0.2); }
    levelUp() { [523, 659, 784, 1046].forEach((n, i) => this.tone(n, n, 0.15, 'triangle', 0.11, i * 0.08)); }
    bikeBell(){ this.tone(1568, 1568, 0.10, 'sine', 0.10); this.tone(1568, 1568, 0.16, 'sine', 0.10, 0.11); }
    timeWarp(){ this.tone(240, 960, 0.35, 'sine', 0.10); this.tone(960, 320, 0.35, 'triangle', 0.09, 0.15); }
  }

  YD.CozyAudio = CozyAudio;
})(window.YasamDunya);
