// 100% Procedural Web Audio API 3D Spatial Horror Soundscape, Song & Combat Audio Engine

class HorrorSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted = false;
  private isRunning = false;
  private songIntervalId: number | null = null;
  private whisperIntervalId: number | null = null;
  private crackleIntervalId: number | null = null;
  private intensityLevel: 'whisper' | 'chant' | 'crescendo' | 'requiem' = 'whisper';
  private stepCounter = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent)) {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.75;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.45;
      this.ambientGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.38;
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setIntensity(intensity: 'whisper' | 'chant' | 'crescendo' | 'requiem') {
    this.intensityLevel = intensity;
  }

  public startSoundscape() {
    const ctx = this.ensureContext();
    if (!ctx || this.isRunning) return;
    this.isRunning = true;

    // 1. Continuous Palace Ruins Wind & Hearth Rumble
    this.startWindAndHearthLoop(ctx);

    // 2. Crackling Wood-Fire Embers
    this.crackleIntervalId = window.setInterval(() => {
      if (!this.isRunning || this.isMuted) return;
      this.triggerFireCrackle();
    }, 380);

    // 3. Spatial Whispers & Distant Stone Footsteps from Wandering Courtiers
    this.whisperIntervalId = window.setInterval(() => {
      if (!this.isRunning || this.isMuted) return;
      if (Math.random() < 0.55) {
        this.triggerSpatialWhisper((Math.random() - 0.5) * 1.8);
      } else {
        this.triggerStoneFootstep((Math.random() - 0.5) * 1.6);
      }
    }, 2600);

    // 4. Original Spine-Chilling Horror Song ("The Crown of Ash & Root")
    // D minor / D Phrygian dominant haunting sequence
    const melodyNotes = [146.83, 155.56, 174.61, 164.81, 146.83, 130.81, 110.0, 116.54]; // D3, Eb3, F3, E3, D3, C3, A2, Bb2
    this.songIntervalId = window.setInterval(() => {
      if (!this.isRunning || this.isMuted) return;
      const note = melodyNotes[this.stepCounter % melodyNotes.length];
      this.playHorrorSongStep(note, this.stepCounter);
      this.stepCounter++;
    }, 950);
  }

  public pauseSoundscape() {
    this.isRunning = false;
    if (this.songIntervalId !== null) {
      clearInterval(this.songIntervalId);
      this.songIntervalId = null;
    }
    if (this.whisperIntervalId !== null) {
      clearInterval(this.whisperIntervalId);
      this.whisperIntervalId = null;
    }
    if (this.crackleIntervalId !== null) {
      clearInterval(this.crackleIntervalId);
      this.crackleIntervalId = null;
    }
  }

  private startWindAndHearthLoop(ctx: AudioContext) {
    if (!this.ambientGain) return;
    // Create 3-second noise buffer for howling wind + fire rumble
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 260;
    windFilter.Q.value = 3.5;

    // LFO to sweep wind howling through palace arches
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(windFilter.frequency);
    lfo.start();

    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;

    noise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);
    noise.start();
  }

  private triggerFireCrackle() {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600 + Math.random() * 2200, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

    filter.type = 'highpass';
    filter.frequency.value = 1100;

    gain.gain.setValueAtTime(0.035 * Math.random(), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  public triggerSpatialWhisper(panValue = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || this.isMuted) return;
    const now = ctx.currentTime;

    // Formant-filtered breathy whisper circling behind the player
    const duration = 0.9 + Math.random() * 0.7;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * (0.5 + 0.5 * Math.sin(i * 0.015));
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(620 + Math.random() * 380, now);
    formant1.frequency.linearRampToValueAtTime(420 + Math.random() * 250, now + duration);
    formant1.Q.value = 7;

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    src.connect(formant1);
    formant1.connect(panner);
    panner.connect(gain);
    gain.connect(this.ambientGain);

    src.start(now);
  }

  public triggerStoneFootstep(panValue = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || this.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.16);

    osc.connect(panner);
    panner.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  private playHorrorSongStep(freq: number, step: number) {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    const now = ctx.currentTime;

    // Haunting chime / cursed harpsichord note
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    const mult =
      this.intensityLevel === 'requiem'
        ? 1.45
        : this.intensityLevel === 'crescendo'
        ? 1.25
        : this.intensityLevel === 'chant'
        ? 1.1
        : 0.9;

    osc.type = this.intensityLevel === 'requiem' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq * 2, now);
    // Slight eerie pitch detune
    osc.detune.setValueAtTime(Math.sin(step) * 14, now);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.intensityLevel === 'requiem' ? 1800 : 950;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.065 * mult, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.88);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.9);
    subOsc.stop(now + 0.9);

    // Every 2 beats in high intensity, add a deep war-heartbeat thud
    if (step % 2 === 0 && (this.intensityLevel === 'crescendo' || this.intensityLevel === 'requiem')) {
      const drum = ctx.createOscillator();
      const drumGain = ctx.createGain();
      drum.type = 'sine';
      drum.frequency.setValueAtTime(68, now);
      drum.frequency.exponentialRampToValueAtTime(26, now + 0.28);
      drumGain.gain.setValueAtTime(0.14 * mult, now);
      drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      drum.connect(drumGain);
      drumGain.connect(this.musicGain);
      drum.start(now);
      drum.stop(now + 0.35);
    }
  }

  // Visceral Combat Audio: Heavy stone-grinding slide vs spectral levitation
  public playPieceSlide(isGhostPiece: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const duration = 0.42;

    if (!isGhostPiece) {
      // Heavy marble grinding on ancient stone
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i * 0.08));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.linearRampToValueAtTime(140, now + duration);

      const thud = ctx.createOscillator();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(92, now + duration - 0.08);
      thud.frequency.exponentialRampToValueAtTime(32, now + duration + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      thud.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      thud.start(now + duration - 0.08);
      thud.stop(now + duration + 0.1);
    } else {
      // Ghost King levitating obsidian piece with eerie spectral trail
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(190, now);
      osc1.frequency.exponentialRampToValueAtTime(340, now + duration * 0.6);
      osc1.frequency.exponentialRampToValueAtTime(130, now + duration);

      osc2.frequency.setValueAtTime(95, now);
      osc2.frequency.exponentialRampToValueAtTime(64, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.12);
      osc2.stop(now + duration + 0.12);
    }
  }

  // Visceral Combat Audio: Blood-curdling spectral shriek + bone-crushing shatter
  public playPieceCaptureShatter(attackerIsGhost: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;

    // 1. Blood-curdling spectral shriek
    const shriek = ctx.createOscillator();
    const shriekMod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const shriekGain = ctx.createGain();

    shriek.type = 'sawtooth';
    shriek.frequency.setValueAtTime(attackerIsGhost ? 780 : 620, now);
    shriek.frequency.exponentialRampToValueAtTime(1480, now + 0.12);
    shriek.frequency.exponentialRampToValueAtTime(290, now + 0.48);

    shriekMod.frequency.value = 48;
    modGain.gain.value = 160;
    shriekMod.connect(modGain);
    modGain.connect(shriek.frequency);

    shriekGain.gain.setValueAtTime(0.24, now);
    shriekGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    shriek.connect(shriekGain);
    shriekGain.connect(this.masterGain);
    shriekMod.start(now);
    shriek.start(now);
    shriekMod.stop(now + 0.52);
    shriek.stop(now + 0.52);

    // 2. Bone-crushing stone/obsidian shatter impact + cascading debris shards
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impact.type = 'triangle';
    impact.frequency.setValueAtTime(140, now + 0.05);
    impact.frequency.exponentialRampToValueAtTime(22, now + 0.45);
    impactGain.gain.setValueAtTime(0.48, now + 0.05);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    impact.connect(impactGain);
    impactGain.connect(this.masterGain);
    impact.start(now + 0.05);
    impact.stop(now + 0.5);

    // 6 cascading stone/glass shard bounces
    for (let i = 0; i < 6; i++) {
      const delay = 0.08 + i * 0.055 + Math.random() * 0.03;
      const shardOsc = ctx.createOscillator();
      const shardGain = ctx.createGain();
      shardOsc.type = 'square';
      shardOsc.frequency.setValueAtTime(900 + Math.random() * 1800, now + delay);
      shardOsc.frequency.exponentialRampToValueAtTime(280, now + delay + 0.06);
      shardGain.gain.setValueAtTime(0.12 / (i + 1), now + delay);
      shardGain.gain.exponentialRampToValueAtTime(0.0005, now + delay + 0.07);
      shardOsc.connect(shardGain);
      shardGain.connect(this.masterGain);
      shardOsc.start(now + delay);
      shardOsc.stop(now + delay + 0.075);
    }
  }

  // 4. "War with the Ghost King" — Horrific Defeat Bloom Sound
  // Sub-bass shockwave + demonic royal brass horns + ghostly roar echoing off palace walls
  public playHorrificDefeatBloom() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const duration = 2.6;

    // Layer A: Massive Sub-Bass Shockwave (45Hz -> 16Hz)
    const subBass = ctx.createOscillator();
    const subGain = ctx.createGain();
    subBass.type = 'sine';
    subBass.frequency.setValueAtTime(52, now);
    subBass.frequency.exponentialRampToValueAtTime(16, now + duration);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.75, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    subBass.connect(subGain);
    subGain.connect(this.masterGain);
    subBass.start(now);
    subBass.stop(now + duration);

    // Layer B: Demonic Royal Brass Horns (D1, Eb1, G#1, D2 cluster with waveshaper brass growl)
    const hornFreqs = [36.71, 38.89, 51.91, 73.42, 110.0];
    for (const freq of hornFreqs) {
      const horn = ctx.createOscillator();
      const hornFilter = ctx.createBiquadFilter();
      const hornGain = ctx.createGain();

      horn.type = 'sawtooth';
      horn.frequency.setValueAtTime(freq * 1.02, now);
      horn.frequency.linearRampToValueAtTime(freq * 0.96, now + duration);

      hornFilter.type = 'lowpass';
      hornFilter.frequency.setValueAtTime(180, now);
      hornFilter.frequency.linearRampToValueAtTime(920, now + 0.45);
      hornFilter.frequency.exponentialRampToValueAtTime(140, now + duration);

      hornGain.gain.setValueAtTime(0.001, now);
      hornGain.gain.linearRampToValueAtTime(0.16, now + 0.25);
      hornGain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      horn.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(this.masterGain);
      horn.start(now);
      horn.stop(now + duration);
    }

    // Layer C: Ghostly Roar Echoing off Palace Walls
    const bufferSize = Math.floor(ctx.sampleRate * 2.0);
    const roarBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = roarBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.9));
    }
    const roarSrc = ctx.createBufferSource();
    roarSrc.buffer = roarBuf;

    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'bandpass';
    roarFilter.frequency.setValueAtTime(480, now);
    roarFilter.frequency.exponentialRampToValueAtTime(140, now + 2.0);
    roarFilter.Q.value = 3.0;

    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.38, now);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    roarSrc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.masterGain);
    roarSrc.start(now);
  }

  public playVictoryFanfare() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const chord = [146.83, 185.0, 220.0, 293.66]; // D major triumphant resolution
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + 1.65);
    });
  }
}

export const horrorAudio = new HorrorSoundscapeEngine();
