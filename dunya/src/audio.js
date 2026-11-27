/**
 * Yaşam Maratonu: Büyük Dünya v7.0 — Studio-Grade Dynamic Procedural Soundtrack & Ambient Audio Engine
 * Zero external assets · 100% offline Web Audio synthesis:
 * - Master DynamicsCompressor + Stereo Warm Algorithmic Reverb + Filtered Echo Delay
 * - 7 Musical Instruments: Felt Piano, Warm String Pad, Nylon Pluck/Harp, Breathy Flute, Upright Bass, Tropical Marimba, Soft Lo-Fi Percussion
 * - 8 Multi-Bar Composed Soundtracks (City, Forest, Beach/Island, Mountain, Park, Cozy Home Lo-Fi, Starry Night, Action Rush)
 * - Automatic seamless cross-context switching (Biome, Indoor Home, Nighttime, Barista/Delivery Rush) + Manual Radio Lock
 * - Continuous Environmental Ambience (Rolling Ocean Waves, Cozy Rain/Storm, Forest Birds, Night Crickets, Mountain Breeze)
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  const AUDIO_STORAGE_KEY = 'yasam_maratonu_audio_v7';

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // 8 Full Composed Soundtracks (each has 4-bar A + 4-bar B progression, 32 eighth-note steps per loop!)
  const TRACKS = {
    city: {
      id: 'city',
      icon: '🏙️',
      name: 'Güneşli Şehir',
      desc: 'Ghibli tarzı sıcak piyano ve flüt yürüyüşü',
      bpm: 102,
      leadInst: 'piano',
      secInst: 'flute',
      arpInst: 'pluck',
      percStyle: 'light',
      // 4 chords x 8 steps = 32 steps (Fmaj7 - Dm7 - Bbmaj7 - C9)
      chordsA: [
        [53, 57, 60, 64], // Fmaj7
        [50, 53, 57, 60], // Dm7
        [46, 50, 53, 57], // Bbmaj7
        [48, 52, 55, 62], // C9
      ],
      chordsB: [
        [57, 60, 64, 67], // Am7
        [50, 53, 57, 60], // Dm7
        [55, 58, 62, 65], // Gm7
        [48, 52, 55, 58], // C7
      ],
      bassA: [41, 38, 34, 36],
      bassB: [45, 38, 43, 36],
      melA: [
        72, -1, 74, 76, 77, -1, 76, 72,
        74, -1, 72, 69, 65, -1, -1, 69,
        70, -1, 72, 74, 77, -1, 74, 72,
        76, -1, 74, 72, 74, -1, -1, -1,
      ],
      melB: [
        76, -1, 79, 77, 76, -1, 72, -1,
        74, -1, 77, 76, 74, -1, 69, -1,
        70, -1, 74, 72, 70, -1, 67, 69,
        72, -1, 74, 76, 72, -1, -1, -1,
      ],
    },

    forest: {
      id: 'forest',
      icon: '🌲',
      name: 'Kuzey Ormanı',
      desc: 'Huzurlu arp, ney/flüt ve orman esintisi',
      bpm: 84,
      leadInst: 'flute',
      secInst: 'piano',
      arpInst: 'pluck',
      percStyle: 'none',
      // D Dorian / Ghibli woodland (Dm9 - Cmaj7 - Bbmaj7 - Asus4)
      chordsA: [
        [50, 53, 57, 64],
        [48, 52, 55, 59],
        [46, 50, 53, 57],
        [45, 50, 52, 57],
      ],
      chordsB: [
        [55, 58, 62, 65],
        [57, 60, 64, 67],
        [46, 50, 53, 57],
        [45, 49, 52, 57],
      ],
      bassA: [38, 36, 34, 33],
      bassB: [43, 45, 34, 33],
      melA: [
        74, -1, -1, 76, 77, -1, 76, 74,
        72, -1, 67, -1, 69, -1, -1, -1,
        70, -1, 72, 74, 77, -1, 76, 74,
        76, -1, -1, 74, 72, -1, 69, -1,
      ],
      melB: [
        79, -1, 77, 74, 77, -1, 74, -1,
        76, -1, 74, 72, 76, -1, -1, -1,
        74, -1, 70, 72, 74, -1, 77, 76,
        73, -1, 76, -1, 74, -1, -1, -1,
      ],
    },

    beach: {
      id: 'beach',
      icon: '🏖️',
      name: 'Tropik Sahil',
      desc: 'Güneşli marimba, bossa gitar ve dalga ritmi',
      bpm: 110,
      leadInst: 'marimba',
      secInst: 'flute',
      arpInst: 'pluck',
      percStyle: 'bossa',
      // Cmaj7 - Am7 - Dm9 - G13
      chordsA: [
        [48, 52, 55, 59],
        [45, 48, 52, 55],
        [50, 53, 57, 64],
        [43, 47, 53, 64],
      ],
      chordsB: [
        [53, 57, 60, 64],
        [52, 55, 59, 62],
        [50, 53, 57, 60],
        [43, 47, 50, 57],
      ],
      bassA: [36, 33, 38, 43],
      bassB: [41, 40, 38, 43],
      melA: [
        76, -1, 79, -1, 76, 74, 72, -1,
        76, -1, 72, -1, 69, -1, 72, 74,
        76, -1, 77, -1, 76, 74, 72, 69,
        71, -1, 74, -1, 79, -1, 76, -1,
      ],
      melB: [
        77, -1, 81, -1, 79, 77, 76, -1,
        76, -1, 79, -1, 76, 74, 71, -1,
        74, -1, 77, -1, 76, 74, 72, -1,
        74, -1, 79, 76, 72, -1, -1, -1,
      ],
    },

    mountain: {
      id: 'mountain',
      icon: '🏔️',
      name: 'Karlı Zirve',
      desc: 'Kristal çanlar, gökyüzü yaylıları ve derin huzur',
      bpm: 74,
      leadInst: 'flute',
      secInst: 'marimba',
      arpInst: 'piano',
      percStyle: 'none',
      // Em9 - Cmaj7 - Gmaj7 - Dadd9
      chordsA: [
        [52, 55, 59, 66],
        [48, 52, 55, 59],
        [43, 47, 50, 54],
        [50, 54, 57, 64],
      ],
      chordsB: [
        [48, 52, 55, 62],
        [50, 54, 57, 61],
        [52, 55, 59, 66],
        [47, 50, 54, 57],
      ],
      bassA: [40, 36, 43, 38],
      bassB: [36, 38, 40, 35],
      melA: [
        79, -1, -1, 78, 76, -1, 71, -1,
        76, -1, -1, 74, 71, -1, -1, -1,
        74, -1, 78, -1, 79, -1, 78, 74,
        76, -1, -1, -1, 74, -1, -1, -1,
      ],
      melB: [
        83, -1, 81, -1, 79, -1, 76, -1,
        78, -1, 81, -1, 78, -1, 74, -1,
        76, -1, 79, 78, 76, -1, 71, -1,
        74, -1, 71, -1, -1, -1, -1, -1,
      ],
    },

    park: {
      id: 'park',
      icon: '🌳',
      name: 'Yeşil Park',
      desc: 'Akustik gitar, neşeli piyano ve bahçe tınısı',
      bpm: 94,
      leadInst: 'pluck',
      secInst: 'piano',
      arpInst: 'pluck',
      percStyle: 'light',
      // Gmaj7 - Em9 - Cmaj7 - D9
      chordsA: [
        [55, 59, 62, 66],
        [52, 55, 59, 66],
        [48, 52, 55, 59],
        [50, 54, 57, 64],
      ],
      chordsB: [
        [57, 60, 64, 67],
        [50, 54, 57, 60],
        [55, 59, 62, 66],
        [52, 55, 59, 62],
      ],
      bassA: [43, 40, 36, 38],
      bassB: [45, 38, 43, 40],
      melA: [
        74, -1, 76, 79, 78, -1, 74, -1,
        76, -1, 74, 71, 67, -1, 71, -1,
        72, -1, 74, 76, 79, -1, 76, 74,
        78, -1, 76, 74, 74, -1, -1, -1,
      ],
      melB: [
        76, -1, 79, 81, 79, -1, 76, -1,
        78, -1, 81, 79, 78, -1, 74, -1,
        79, -1, 78, 74, 76, -1, 74, 71,
        74, -1, 71, 67, -1, -1, -1, -1,
      ],
    },

    home: {
      id: 'home',
      icon: '🏠',
      name: 'Ev Lo-Fi Piyano',
      desc: 'Sıcacık Rhodes piyano ve yumuşak lo-fi ritim',
      bpm: 74,
      leadInst: 'piano',
      secInst: 'piano',
      arpInst: 'piano',
      percStyle: 'lofi',
      // Ebmaj7 - Cm9 - Fm9 - Bb13
      chordsA: [
        [51, 55, 58, 62],
        [48, 51, 55, 62],
        [53, 56, 60, 67],
        [46, 50, 56, 67],
      ],
      chordsB: [
        [56, 60, 63, 67],
        [55, 58, 62, 65],
        [53, 56, 60, 63],
        [46, 50, 53, 60],
      ],
      bassA: [39, 36, 41, 34],
      bassB: [44, 43, 41, 34],
      melA: [
        74, -1, 75, -1, 70, -1, -1, 67,
        70, -1, 74, 72, 67, -1, -1, -1,
        72, -1, 74, 75, 79, -1, 75, 74,
        72, -1, 70, -1, 67, -1, -1, -1,
      ],
      melB: [
        79, -1, 77, 75, 74, -1, 72, -1,
        74, -1, 75, 74, 70, -1, -1, -1,
        72, -1, 75, 74, 72, -1, 68, 70,
        72, -1, 70, -1, 75, -1, -1, -1,
      ],
    },

    night: {
      id: 'night',
      icon: '🌙',
      name: 'Gece Yıldızları',
      desc: 'Rüya gibi müzik kutusu, yumuşak pad ve yıldızlar',
      bpm: 66,
      leadInst: 'piano',
      secInst: 'flute',
      arpInst: 'pluck',
      percStyle: 'none',
      // Fmaj7 - G6 - Em7 - Am9
      chordsA: [
        [53, 57, 60, 64],
        [55, 59, 62, 64],
        [52, 55, 59, 62],
        [45, 48, 52, 59],
      ],
      chordsB: [
        [50, 53, 57, 64],
        [55, 59, 62, 67],
        [48, 52, 55, 59],
        [45, 48, 52, 57],
      ],
      bassA: [41, 43, 40, 33],
      bassB: [38, 43, 36, 33],
      melA: [
        76, -1, -1, 72, 74, -1, -1, -1,
        76, -1, 79, -1, 76, -1, 74, -1,
        71, -1, -1, 74, 72, -1, 69, -1,
        72, -1, -1, -1, 69, -1, -1, -1,
      ],
      melB: [
        77, -1, 76, -1, 74, -1, 72, -1,
        79, -1, 76, -1, 74, -1, -1, -1,
        76, -1, 74, 72, 71, -1, 67, -1,
        69, -1, 72, -1, 69, -1, -1, -1,
      ],
    },

    action: {
      id: 'action',
      icon: '⚡',
      name: 'Kurye & Barista Rush',
      desc: 'Enerjik tempo! Teslimat ve kafe vardiyası ritmi',
      bpm: 126,
      leadInst: 'marimba',
      secInst: 'piano',
      arpInst: 'pluck',
      percStyle: 'upbeat',
      // Dmaj7 - Bm7 - Gmaj7 - A9
      chordsA: [
        [50, 54, 57, 61],
        [47, 50, 54, 57],
        [43, 47, 50, 54],
        [45, 49, 52, 59],
      ],
      chordsB: [
        [55, 59, 62, 66],
        [54, 57, 61, 64],
        [52, 55, 59, 62],
        [45, 49, 52, 55],
      ],
      bassA: [38, 35, 43, 45],
      bassB: [43, 42, 40, 45],
      melA: [
        74, 78, 81, -1, 78, 76, 74, -1,
        78, 81, 83, -1, 81, 78, 74, -1,
        79, 78, 74, 71, 74, -1, 78, -1,
        76, -1, 78, 81, 76, -1, -1, -1,
      ],
      melB: [
        83, -1, 81, 79, 78, 74, 79, -1,
        81, -1, 78, 76, 74, 73, 76, -1,
        79, 76, 74, 71, 76, -1, 79, 81,
        81, -1, 78, 76, 74, -1, -1, -1,
      ],
    },
  };

  const TRACK_ORDER = ['city', 'forest', 'beach', 'mountain', 'park', 'home', 'night', 'action'];

  class CozyAudio {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.ambienceBus = null;
      this.sfxBus = null;
      this.reverbSend = null;
      this.delaySend = null;
      this.noiseBuf = null;

      // Continuous ambience nodes
      this.rainNode = null;
      this.rainFilter = null;
      this.rainGain = null;
      this.seaNode = null;
      this.seaFilter = null;
      this.seaGain = null;
      this.windNode = null;
      this.windFilter = null;
      this.windGain = null;

      // User preferences (persisted)
      this.muted = false;
      this.musicOn = true;
      this.musicVol = 0.78;
      this.ambienceVol = 0.65;
      this.sfxVol = 0.85;
      this.station = 'auto'; // 'auto' or any TRACKS key

      // Sequencer state
      this.accum = 0;
      this.step = 0;
      this.section = 0; // 0 = A, 1 = B
      this.currentTrackId = 'city';
      this.pendingTrackId = 'city';
      this.trackHoldTimer = 0;
      this.lastNotifyTrack = null;
      this.onTrackChange = null;
      this.ambTimer = 0;

      this.loadPrefs();
    }

    loadPrefs() {
      try {
        const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (typeof d.muted === 'boolean') this.muted = d.muted;
        if (typeof d.musicOn === 'boolean') this.musicOn = d.musicOn;
        if (typeof d.musicVol === 'number') this.musicVol = Math.max(0, Math.min(1, d.musicVol));
        if (typeof d.ambienceVol === 'number') this.ambienceVol = Math.max(0, Math.min(1, d.ambienceVol));
        if (typeof d.sfxVol === 'number') this.sfxVol = Math.max(0, Math.min(1, d.sfxVol));
        if (typeof d.station === 'string' && (d.station === 'auto' || TRACKS[d.station])) {
          this.station = d.station;
        }
      } catch (_) {}
    }

    savePrefs() {
      try {
        localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
          muted: this.muted,
          musicOn: this.musicOn,
          musicVol: this.musicVol,
          ambienceVol: this.ambienceVol,
          sfxVol: this.sfxVol,
          station: this.station,
        }));
      } catch (_) {}
    }

    getTracks() { return TRACKS; }
    getTrackOrder() { return TRACK_ORDER; }
    getCurrentTrack() { return TRACKS[this.currentTrackId] || TRACKS.city; }

    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this._buildGraph();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.applyVolumes();
    }

    _buildGraph() {
      const ctx = this.ctx;

      // Soft warm master warmth filter + glue compressor
      const warmth = ctx.createBiquadFilter();
      warmth.type = 'lowpass';
      warmth.frequency.value = 11500;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 18;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.008;
      comp.release.value = 0.22;

      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.92;

      this.musicBus = ctx.createGain();
      this.ambienceBus = ctx.createGain();
      this.sfxBus = ctx.createGain();

      // Algorithmic Stereo Studio Reverb (silky 1.85s warm hall impulse)
      const irLen = Math.floor(ctx.sampleRate * 1.85);
      const irBuf = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = irBuf.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < irLen; i++) {
          const env = Math.pow(1 - i / irLen, 2.6);
          const white = Math.random() * 2 - 1;
          lp = lp * 0.72 + white * 0.28; // warm lowpass damping
          data[i] = lp * env * 0.55;
        }
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = irBuf;
      this.reverbSend = ctx.createGain();
      this.reverbSend.gain.value = 0.34;
      this.reverbSend.connect(convolver);
      convolver.connect(this.musicBus);

      // Warm Stereo Echo Delay (cozy 0.29s tap)
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.29;
      const delayFilter = ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 2200;
      const delayFb = ctx.createGain();
      delayFb.gain.value = 0.24;
      this.delaySend = ctx.createGain();
      this.delaySend.gain.value = 0.18;
      this.delaySend.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(delayFb);
      delayFb.connect(delay);
      delayFilter.connect(this.musicBus);

      // Connect all buses -> warmth -> compressor -> master -> destination
      this.musicBus.connect(warmth);
      this.ambienceBus.connect(warmth);
      this.sfxBus.connect(warmth);
      warmth.connect(comp);
      comp.connect(this.master);
      this.master.connect(ctx.destination);

      // Shared 3-second seamless pink-ish noise buffer (reused for rain, ocean, wind, percussion)
      const nLen = Math.floor(ctx.sampleRate * 3.0);
      this.noiseBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
      const nd = this.noiseBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < nLen; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        nd[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }

      this._initContinuousAmbience();
      this.applyVolumes();
    }

    _initContinuousAmbience() {
      const ctx = this.ctx;
      // 1) Continuous Rain Layer
      this.rainNode = ctx.createBufferSource();
      this.rainNode.buffer = this.noiseBuf;
      this.rainNode.loop = true;
      this.rainFilter = ctx.createBiquadFilter();
      this.rainFilter.type = 'bandpass';
      this.rainFilter.frequency.value = 1400;
      this.rainFilter.Q.value = 0.65;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0.0001;
      this.rainNode.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ambienceBus);
      this.rainNode.start();

      // 2) Continuous Ocean Surf Layer (modulated by slow wave LFO!)
      this.seaNode = ctx.createBufferSource();
      this.seaNode.buffer = this.noiseBuf;
      this.seaNode.loop = true;
      this.seaFilter = ctx.createBiquadFilter();
      this.seaFilter.type = 'lowpass';
      this.seaFilter.frequency.value = 420;
      const seaLfo = ctx.createOscillator();
      seaLfo.type = 'sine';
      seaLfo.frequency.value = 0.15; // gentle 6.6-second ocean wave cycle
      const seaLfoGain = ctx.createGain();
      seaLfoGain.gain.value = 210;
      seaLfo.connect(seaLfoGain);
      seaLfoGain.connect(this.seaFilter.frequency);
      this.seaGain = ctx.createGain();
      this.seaGain.gain.value = 0.0001;
      this.seaNode.connect(this.seaFilter);
      this.seaFilter.connect(this.seaGain);
      this.seaGain.connect(this.ambienceBus);
      this.seaNode.start();
      seaLfo.start();

      // 3) Mountain / Forest Soft Breeze Layer
      this.windNode = ctx.createBufferSource();
      this.windNode.buffer = this.noiseBuf;
      this.windNode.loop = true;
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.value = 540;
      this.windFilter.Q.value = 2.4;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.0001;
      this.windNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ambienceBus);
      this.windNode.start();
    }

    applyVolumes() {
      if (!this.ctx || !this.master) return;
      const now = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.92, now, 0.04);
      this.musicBus.gain.setTargetAtTime(this.musicOn ? this.musicVol * 0.85 : 0, now, 0.06);
      this.ambienceBus.gain.setTargetAtTime(this.ambienceVol * 0.72, now, 0.08);
      this.sfxBus.gain.setTargetAtTime(this.sfxVol * 0.95, now, 0.03);
    }

    setMusicVolume(v) { this.musicVol = Math.max(0, Math.min(1, v)); this.applyVolumes(); this.savePrefs(); }
    setAmbienceVolume(v) { this.ambienceVol = Math.max(0, Math.min(1, v)); this.applyVolumes(); this.savePrefs(); }
    setSfxVolume(v) { this.sfxVol = Math.max(0, Math.min(1, v)); this.applyVolumes(); this.savePrefs(); }

    setMusicOn(on) {
      this.musicOn = !!on;
      this.applyVolumes();
      this.savePrefs();
    }

    setMuted(m) {
      this.muted = !!m;
      this.applyVolumes();
      this.savePrefs();
    }

    setStation(stationId) {
      if (stationId !== 'auto' && !TRACKS[stationId]) return;
      this.station = stationId;
      if (stationId !== 'auto') {
        this._switchTrackNow(stationId, true);
      }
      this.savePrefs();
    }

    _switchTrackNow(trackId, forceNotify = false) {
      if (!TRACKS[trackId]) return;
      const changed = this.currentTrackId !== trackId;
      this.currentTrackId = trackId;
      this.pendingTrackId = trackId;
      this.trackHoldTimer = 0;
      if (changed) {
        this.step = 0;
        this.section = 0;
        this.accum = 0;
      }
      if ((changed || forceNotify) && typeof this.onTrackChange === 'function') {
        this.onTrackChange(TRACKS[trackId], this.station);
      }
    }

    // =========================================================================
    //  STUDIO SYNTH INSTRUMENTS (Routed through Music Bus + Reverb + Echo)
    // =========================================================================

    playPiano(midi, vel = 0.14, dur = 0.9, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const f = midiToFreq(midi);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + 0.012);
      env.gain.exponentialRampToValueAtTime(vel * 0.42, t + Math.min(0.24, dur * 0.45));
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(Math.min(3400, f * 5.2), t);
      filt.frequency.exponentialRampToValueAtTime(Math.max(460, f * 1.65), t + dur * 0.85);

      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(f, t);

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(f * 2, t);
      const o2g = ctx.createGain();
      o2g.gain.setValueAtTime(0.24, t);
      o2g.gain.exponentialRampToValueAtTime(0.02, t + Math.min(0.25, dur * 0.5));

      o1.connect(filt);
      o2.connect(o2g);
      o2g.connect(filt);
      filt.connect(env);
      env.connect(this.musicBus);
      env.connect(this.reverbSend);

      o1.start(t); o2.start(t);
      o1.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
    }

    playPluck(midi, vel = 0.12, dur = 0.65, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const f = midiToFreq(midi);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.Q.value = 1.4;
      filt.frequency.setValueAtTime(Math.min(3600, f * 6.0), t);
      filt.frequency.exponentialRampToValueAtTime(Math.max(380, f * 1.25), t + 0.16);

      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(f, t);

      const o2 = ctx.createOscillator();
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(f * 1.002, t);
      const o2g = ctx.createGain();
      o2g.gain.value = 0.18;

      o1.connect(filt);
      o2.connect(o2g);
      o2g.connect(filt);
      filt.connect(env);
      env.connect(this.musicBus);
      env.connect(this.reverbSend);
      env.connect(this.delaySend);

      o1.start(t); o2.start(t);
      o1.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
    }

    playFlute(midi, vel = 0.11, dur = 0.72, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const f = midiToFreq(midi);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + 0.075);
      env.gain.setValueAtTime(vel * 0.85, t + Math.max(0.09, dur * 0.65));
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(f, t);

      // Gentle expressive vibrato
      const vib = ctx.createOscillator();
      vib.type = 'sine';
      vib.frequency.value = 5.2;
      const vibG = ctx.createGain();
      vibG.gain.setValueAtTime(0.5, t);
      vibG.gain.linearRampToValueAtTime(f * 0.0065, t + 0.25);
      vib.connect(vibG);
      vibG.connect(o1.frequency);

      const o2 = ctx.createOscillator();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(f * 2, t);
      const o2g = ctx.createGain();
      o2g.gain.value = 0.07;

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 2600;

      o1.connect(filt);
      o2.connect(o2g);
      o2g.connect(filt);
      filt.connect(env);
      env.connect(this.musicBus);
      env.connect(this.reverbSend);
      env.connect(this.delaySend);

      o1.start(t); o2.start(t); vib.start(t);
      o1.stop(t + dur + 0.04); o2.stop(t + dur + 0.04); vib.stop(t + dur + 0.04);
    }

    playMarimba(midi, vel = 0.14, dur = 0.38, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const f = midiToFreq(midi);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(f, t);

      // Wooden mallet overtone (4x harmonic, ultra short)
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(f * 3.98, t);
      const o2g = ctx.createGain();
      o2g.gain.setValueAtTime(vel * 0.35, t);
      o2g.gain.exponentialRampToValueAtTime(0.0005, t + 0.032);

      o1.connect(env);
      o2.connect(o2g);
      o2g.connect(this.musicBus);
      env.connect(this.musicBus);
      env.connect(this.reverbSend);

      o1.start(t); o2.start(t);
      o1.stop(t + dur + 0.02); o2.stop(t + 0.05);
    }

    playPad(midis, vel = 0.036, dur = 2.4, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(720, t);
      filt.frequency.linearRampToValueAtTime(1180, t + dur * 0.45);
      filt.frequency.linearRampToValueAtTime(640, t + dur);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + Math.min(0.45, dur * 0.3));
      env.gain.setValueAtTime(vel * 0.85, t + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      filt.connect(env);
      env.connect(this.musicBus);
      env.connect(this.reverbSend);

      for (const m of midis) {
        const f = midiToFreq(m);
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f * (1 + (Math.random() - 0.5) * 0.004), t);
        o.connect(filt);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }

    playBass(midi, vel = 0.14, dur = 0.85, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);
      const f = midiToFreq(midi);

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 340;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + 0.018);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);

      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(f, t);

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(f, t);

      o1.connect(filt); o2.connect(filt);
      filt.connect(env);
      env.connect(this.musicBus);

      o1.start(t); o2.start(t);
      o1.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
    }

    playPerc(type, vel = 0.07, when = 0) {
      if (!this.ctx || !this.musicBus) return;
      const ctx = this.ctx;
      const t = Math.max(ctx.currentTime, when || ctx.currentTime);

      if (type === 'kick') {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(118, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
        g.gain.setValueAtTime(vel * 1.45, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.connect(g); g.connect(this.musicBus);
        o.start(t); o.stop(t + 0.16);
      } else if (type === 'rim') {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(680, t);
        o.frequency.exponentialRampToValueAtTime(340, t + 0.035);
        g.gain.setValueAtTime(vel * 0.75, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        o.connect(g); g.connect(this.musicBus);
        o.start(t); o.stop(t + 0.05);
      } else if (this.noiseBuf) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const filt = ctx.createBiquadFilter();
        filt.type = type === 'hat' ? 'highpass' : 'bandpass';
        filt.frequency.value = type === 'hat' ? 5600 : 1900;
        const g = ctx.createGain();
        const dur = type === 'hat' ? 0.045 : 0.11;
        g.gain.setValueAtTime(vel * (type === 'hat' ? 0.55 : 0.8), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(filt); filt.connect(g); g.connect(this.musicBus);
        src.start(t, Math.random() * 1.5, dur + 0.02);
      }
    }

    _playInst(inst, midi, vel, dur, when) {
      if (inst === 'flute') this.playFlute(midi, vel, dur, when);
      else if (inst === 'marimba') this.playMarimba(midi, vel, dur, when);
      else if (inst === 'pluck') this.playPluck(midi, vel, dur, when);
      else this.playPiano(midi, vel, dur, when);
    }

    // =========================================================================
    //  DYNAMIC SOUNDTRACK & AMBIENCE LOOP (Called every frame from game.js)
    // =========================================================================

    resolveDesiredTrack(biome, meta) {
      if (this.station !== 'auto' && TRACKS[this.station]) return this.station;
      const m = meta || {};
      if (m.action) return 'action';
      if (m.indoor) return 'home';
      const hr = typeof m.hour === 'number' ? m.hour : 12;
      const isNight = hr >= 21 || hr < 5.5;
      if (isNight) return 'night';
      if (biome === 'beach' || biome === 'sea' || biome === 'island') return 'beach';
      if (biome === 'forest') return 'forest';
      if (biome === 'mountain') return 'mountain';
      if (biome === 'park') return 'park';
      return 'city';
    }

    updateAmbient(dt, biome, weatherId, meta) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const cdt = Math.min(0.08, Math.max(0, dt)); // prevent tab-switch note bursts!
      const m = meta || {};

      // 1) Continuous Environmental Ambience Levels
      const now = this.ctx.currentTime;
      const isRain = weatherId === 'rain' || weatherId === 'storm';
      const isStorm = weatherId === 'storm';
      const indoorMuffle = m.indoor ? 0.35 : 1.0;

      if (this.rainGain && this.rainFilter) {
        const targetRain = isRain ? (isStorm ? 0.22 : 0.13) * indoorMuffle : 0.0001;
        this.rainGain.gain.setTargetAtTime(targetRain, now, 0.35);
        this.rainFilter.frequency.setTargetAtTime(m.indoor ? 520 : (isStorm ? 1850 : 1350), now, 0.35);
      }

      if (this.seaGain) {
        const nearSea = !m.indoor && (biome === 'beach' || biome === 'sea' || biome === 'island');
        this.seaGain.gain.setTargetAtTime(nearSea ? 0.17 : 0.0001, now, 0.45);
      }

      if (this.windGain && this.windFilter) {
        const windy = !m.indoor && (biome === 'mountain' || isStorm);
        this.windGain.gain.setTargetAtTime(windy ? 0.09 : 0.0001, now, 0.45);
        this.windFilter.frequency.setTargetAtTime(biome === 'mountain' ? 680 : 420, now, 0.5);
      }

      // Occasional wildlife calls (daytime birds in forest/park, soft crickets at night)
      this.ambTimer += cdt;
      if (this.ambTimer >= 2.2) {
        this.ambTimer = 0;
        const hr = typeof m.hour === 'number' ? m.hour : 12;
        const isNight = hr >= 21 || hr < 5.5;
        if (!m.indoor && !isRain && !this.muted && this.ambienceVol > 0.05) {
          if (!isNight && (biome === 'forest' || biome === 'park') && Math.random() < 0.42) {
            this._chirpBird();
          } else if (isNight && biome !== 'sea' && Math.random() < 0.38) {
            this._chirpCricket();
          }
        }
      }

      // 2) Smooth Dynamic Track Selection (1.2s debounce on biome transitions; instant for action/indoor)
      const desired = this.resolveDesiredTrack(biome, m);
      if (desired !== this.currentTrackId) {
        const urgent = desired === 'action' || this.currentTrackId === 'action' || desired === 'home' || this.currentTrackId === 'home';
        if (urgent) {
          this._switchTrackNow(desired);
        } else if (desired === this.pendingTrackId) {
          this.trackHoldTimer += cdt;
          if (this.trackHoldTimer >= 1.1) this._switchTrackNow(desired);
        } else {
          this.pendingTrackId = desired;
          this.trackHoldTimer = 0;
        }
      } else {
        this.pendingTrackId = desired;
        this.trackHoldTimer = 0;
      }

      // 3) Multi-Track Musical Sequencer (Eighth-note resolution)
      if (this.muted || !this.musicOn) return;
      const track = TRACKS[this.currentTrackId] || TRACKS.city;
      const stepDur = 60 / track.bpm / 2; // eighth note
      this.accum += cdt;
      if (this.accum < stepDur) return;
      this.accum -= stepDur;

      const s = this.step;
      this.step = (this.step + 1) % 32;
      if (this.step === 0) this.section = (this.section + 1) % 2;

      const bar = Math.floor(s / 8); // 0..3
      const beatInBar = s % 8;       // 0..7
      const chords = this.section === 0 ? track.chordsA : track.chordsB;
      const basses = this.section === 0 ? track.bassA : track.bassB;
      const melody = this.section === 0 ? track.melA : track.melB;
      const chord = chords[bar];
      const bassNote = basses[bar];
      const when = this.ctx.currentTime + 0.015;

      // A) Lush Warm Pad & Chord Comping on Bar Downbeat
      if (beatInBar === 0) {
        this.playPad(chord, 0.032, stepDur * 8.4, when);
        this.playBass(bassNote, 0.15, stepDur * 3.6, when);
        // Gentle rolled piano/guitar chord on downbeat
        chord.forEach((n, i) => {
          this.playPiano(n, 0.048, stepDur * 4.5, when + i * 0.022);
        });
      }

      // B) Secondary Bass Movement (fifth / octave bounce)
      if (beatInBar === 4) {
        this.playBass(bassNote + (track.percStyle === 'bossa' ? 7 : 0), 0.11, stepDur * 3.0, when);
      } else if (beatInBar === 6 && (track.percStyle === 'bossa' || track.percStyle === 'upbeat')) {
        this.playBass(bassNote + 7, 0.09, stepDur * 1.6, when);
      }

      // C) Flowing Arpeggio Accompaniment
      if (beatInBar === 2 || beatInBar === 5 || beatInBar === 7) {
        const arpIdx = beatInBar === 2 ? 1 : (beatInBar === 5 ? 2 : 3);
        this._playInst(track.arpInst, chord[arpIdx % chord.length] + 12, 0.052, stepDur * 2.1, when);
      }

      // D) Expressive Lead Melody (alternates lead & secondary instrument in Section B for freshness!)
      const melNote = melody[s];
      if (melNote > 0) {
        const inst = (this.section === 1 && track.secInst) ? track.secInst : track.leadInst;
        const vel = inst === 'flute' ? 0.10 : 0.125;
        // Look ahead to see if next step is rest -> sustain longer!
        const nextRest = melody[(s + 1) % 32] < 0;
        const dur = stepDur * (nextRest ? 2.6 : 1.35);
        this._playInst(inst, melNote, vel, dur, when);
      }

      // E) Soft Cozy Percussion Groove
      if (track.percStyle === 'light') {
        if (beatInBar === 0) this.playPerc('kick', 0.055, when);
        if (beatInBar === 4) this.playPerc('brush', 0.032, when);
        if (beatInBar % 2 === 1) this.playPerc('hat', 0.022, when);
      } else if (track.percStyle === 'lofi') {
        if (beatInBar === 0 || beatInBar === 5) this.playPerc('kick', 0.068, when);
        if (beatInBar === 4) this.playPerc('brush', 0.042, when);
        if (beatInBar === 2 || beatInBar === 6) this.playPerc('hat', 0.024, when);
      } else if (track.percStyle === 'bossa') {
        if (beatInBar === 0 || beatInBar === 3 || beatInBar === 6) this.playPerc('rim', 0.045, when);
        if (beatInBar === 0 || beatInBar === 4) this.playPerc('kick', 0.06, when);
        if (beatInBar % 2 === 1) this.playPerc('hat', 0.026, when);
      } else if (track.percStyle === 'upbeat') {
        if (beatInBar === 0 || beatInBar === 4) this.playPerc('kick', 0.085, when);
        if (beatInBar === 2 || beatInBar === 6) this.playPerc('brush', 0.05, when);
        if (beatInBar % 2 === 1) this.playPerc('hat', 0.038, when);
        if (beatInBar === 7) this.playPerc('rim', 0.04, when);
      }
    }

    _chirpBird() {
      if (!this.ctx || !this.ambienceBus) return;
      const now = this.ctx.currentTime;
      const base = 1750 + Math.random() * 550;
      const note = (f1, f2, dur, delay) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f1, now + delay);
        o.frequency.exponentialRampToValueAtTime(f2, now + delay + dur);
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.linearRampToValueAtTime(0.024, now + delay + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0005, now + delay + dur);
        o.connect(g); g.connect(this.ambienceBus);
        o.start(now + delay); o.stop(now + delay + dur + 0.02);
      };
      note(base, base * 1.28, 0.07, 0);
      note(base * 1.22, base * 0.96, 0.08, 0.09);
      if (Math.random() < 0.5) note(base * 1.08, base * 1.35, 0.07, 0.20);
    }

    _chirpCricket() {
      if (!this.ctx || !this.ambienceBus) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const d = i * 0.065;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 4150 + Math.random() * 140;
        g.gain.setValueAtTime(0.0001, now + d);
        g.gain.linearRampToValueAtTime(0.011, now + d + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0004, now + d + 0.04);
        o.connect(g); g.connect(this.ambienceBus);
        o.start(now + d); o.stop(now + d + 0.045);
      }
    }

    // =========================================================================
    //  WARM HARMONIC SFX (Routed through SFX Bus)
    // =========================================================================

    tone(freq, endFreq, dur, type = 'sine', vol = 0.08, delay = 0) {
      if (this.muted || !this.ctx || !this.sfxBus) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc.connect(g); g.connect(this.sfxBus);
      osc.start(now); osc.stop(now + dur + 0.02);
    }

    noise(dur, vol = 0.06, freq = 800) {
      if (this.muted || !this.ctx || !this.sfxBus || !this.noiseBuf) return;
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(freq, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxBus);
      src.start(now, Math.random(), dur + 0.02);
    }

    thunder() { this.noise(1.25, 0.22, 160); this.tone(68, 26, 0.95, 'sawtooth', 0.11); }
    carHorn(pitch = 1.0, doubleBeep = false, volScale = 1.0) {
      if (this.muted || !this.ctx || !this.sfxBus) return;
      const ctx = this.ctx;
      const burst = (delay, dur) => {
        const t = ctx.currentTime + delay;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 1750;
        const g = ctx.createGain();
        const peak = 0.068 * Math.max(0.15, Math.min(1.15, volScale));
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.014);
        g.gain.setValueAtTime(peak * 0.9, t + Math.max(0.02, dur - 0.03));
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        filt.connect(g); g.connect(this.sfxBus);
        // Authentic dual-tone automotive horn (minor/major 3rd interval!)
        [370 * pitch, 466 * pitch].forEach((freq) => {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(freq, t);
          o.connect(filt);
          o.start(t); o.stop(t + dur + 0.02);
        });
      };
      if (doubleBeep) {
        burst(0, 0.12);
        burst(0.16, 0.18);
      } else {
        burst(0, 0.24);
      }
    }
    meow() {
      if (this.muted || !this.ctx || !this.sfxBus) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(580, t);
      o.frequency.exponentialRampToValueAtTime(920, t + 0.12);
      o.frequency.exponentialRampToValueAtTime(480, t + 0.36);
      f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2.0;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.connect(f); f.connect(g); g.connect(this.sfxBus);
      o.start(t); o.stop(t + 0.40);
    }
    bark() {
      if (this.muted || !this.ctx || !this.sfxBus) return;
      const ctx = this.ctx;
      const woof = (delay, base) => {
        const t = ctx.currentTime + delay;
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(base * 1.45, t);
        o.frequency.exponentialRampToValueAtTime(base, t + 0.09);
        f.type = 'bandpass'; f.frequency.value = 640; f.Q.value = 1.6;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.14, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(f); f.connect(g); g.connect(this.sfxBus);
        o.start(t); o.stop(t + 0.13);
      };
      woof(0, 210);
      woof(0.15, 235);
    }
    quack() {
      if (this.muted || !this.ctx || !this.sfxBus) return;
      const ctx = this.ctx;
      const q = (delay) => {
        const t = ctx.currentTime + delay;
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(360, t);
        o.frequency.exponentialRampToValueAtTime(240, t + 0.11);
        f.type = 'bandpass';
        f.frequency.setValueAtTime(1600, t);
        f.frequency.exponentialRampToValueAtTime(850, t + 0.11);
        f.Q.value = 3.2;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.15, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        o.connect(f); f.connect(g); g.connect(this.sfxBus);
        o.start(t); o.stop(t + 0.14);
      };
      q(0); q(0.15);
    }
    animalHappy() {
      this.tone(720, 980, 0.08, 'sine', 0.09);
      this.tone(980, 1280, 0.11, 'triangle', 0.08, 0.07);
    }
    cashRegister() {
      this.tone(1046.5, 1046.5, 0.07, 'triangle', 0.11);
      this.tone(1318.5, 1568.0, 0.15, 'triangle', 0.11, 0.065);
    }
    cameraShutter() {
      this.noise(0.045, 0.13, 3200);
      this.tone(1800, 720, 0.04, 'triangle', 0.10);
      this.tone(1250, 2400, 0.09, 'sine', 0.08, 0.045);
    }
    cookSizzle() {
      this.noise(0.34, 0.09, 2600);
      this.tone(880, 1174.7, 0.10, 'triangle', 0.11, 0.12);
      this.tone(1174.7, 1760, 0.16, 'triangle', 0.10, 0.21);
    }
    fountainSplash() {
      this.noise(0.18, 0.07, 1600);
      [72, 76, 79, 84].forEach((m, i) => this.tone(midiToFreq(m), midiToFreq(m) * 1.02, 0.16, 'sine', 0.08, i * 0.055));
    }
    iceCreamChime() {
      [76, 79, 84, 79, 84].forEach((m, i) => this.tone(midiToFreq(m), midiToFreq(m), 0.13, 'triangle', 0.09, i * 0.075));
    }
    carStart(){ this.tone(85, 220, 0.24, 'sawtooth', 0.075); this.noise(0.16, 0.05, 500); }
    guitar()  {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [60, 64, 67, 71, 76].forEach((m, i) => this.playPluck(m, 0.13, 0.85, now + i * 0.065));
    }
    coin()    { this.tone(987.8, 1318.5, 0.085, 'triangle', 0.12); this.tone(1318.5, 1975.5, 0.15, 'triangle', 0.11, 0.065); }
    pickup()  { this.tone(587.3, 784.0, 0.08, 'triangle', 0.11); this.tone(784.0, 1046.5, 0.13, 'triangle', 0.10, 0.06); }
    splash()  { this.noise(0.22, 0.10, 1100); this.tone(310, 140, 0.15, 'sine', 0.07); }
    miss()    { this.tone(245, 148, 0.19, 'sawtooth', 0.09); }
    sleep()   { [72, 67, 64, 60].forEach((m, i) => this.playPiano(m, 0.12, 0.9, (this.ctx ? this.ctx.currentTime : 0) + i * 0.16)); }
    levelUp() { [60, 64, 67, 72, 76].forEach((m, i) => this.tone(midiToFreq(m), midiToFreq(m), 0.18, 'triangle', 0.12, i * 0.075)); }
    bikeBell(){ this.tone(1568, 1568, 0.10, 'sine', 0.10); this.tone(1568, 1568, 0.17, 'sine', 0.10, 0.105); }
    timeWarp(){ this.tone(240, 960, 0.35, 'sine', 0.10); this.tone(960, 320, 0.35, 'triangle', 0.09, 0.15); }
    uiClick() { this.tone(660, 880, 0.04, 'sine', 0.05); }
  }

  YD.CozyAudio = CozyAudio;
})(window.YasamDunya);
