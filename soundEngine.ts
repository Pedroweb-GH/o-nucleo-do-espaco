// Web Audio API Synthesizer for Space Nucleus Sound Effects & Dynamic Background Synth

class SpaceSoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private musicMuted: boolean = false;
  private musicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private noteIndex: number = 0;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy audio context initialization upon user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public initAudio() {
    this.initContext();
  }

  public setMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted && this.musicPlaying) {
      this.stopMusic();
    } else if (!muted && !this.musicPlaying) {
      this.startMusic();
    }
  }

  public playGameMusic() {
    this.startMusic();
  }

  public stopGameMusic() {
    this.stopMusic();
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public triggerHaptic(pattern: number | number[]) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  // SFX: Shield Block / Deflect
  public playShieldBlock(combo: number = 1) {
    this.triggerHaptic(25);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 380 + Math.min(combo * 40, 400);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, t + 0.08);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // Audio fallback
    }
  }

  // SFX: Core Damage Taken
  public playCoreHit() {
    this.triggerHaptic(70);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  }

  // SFX: EMP Shockwave Activated
  public playEMP() {
    this.triggerHaptic([40, 30, 80]);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      // High sweeping whoosh
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, t);
      osc1.frequency.exponentialRampToValueAtTime(120, t + 0.6);
      gain1.gain.setValueAtTime(0.4, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.6);

      // Deep sub bass blast
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(90, t);
      osc2.frequency.exponentialRampToValueAtTime(30, t + 0.8);
      gain2.gain.setValueAtTime(0.5, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.8);
    } catch {}
  }

  // SFX: Level Up / Boss Defeated Fanfare
  public playLevelUp() {
    this.triggerHaptic([30, 30, 60]);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const t = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.2, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  // SFX: Roulette Tick
  public playRouletteTick() {
    this.triggerHaptic(12);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }

  // SFX: Boss Warning Alarm
  public playBossAlarm() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t + i * 0.25);
        osc.frequency.setValueAtTime(450, t + i * 0.25 + 0.12);
        gain.gain.setValueAtTime(0.25, t + i * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.25 + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + i * 0.25);
        osc.stop(t + i * 0.25 + 0.22);
      }
    } catch {}
  }

  // Background Synth Ambient Loop
  public startMusic() {
    if (this.musicMuted || this.musicPlaying) return;
    this.initContext();
    this.musicPlaying = true;

    // Arpeggiated Space Bassline Scale (D Dorian Synthwave)
    const scale = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00]; // D3 to G4
    const melodyPattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 7, 5, 3, 2, 0];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.musicMuted) return;
      try {
        const t = this.ctx.currentTime;
        const noteFreq = scale[melodyPattern[this.noteIndex % melodyPattern.length]];
        this.noteIndex++;

        // Bass/Pad Synth Note
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(noteFreq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.25);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.3);
      } catch {}
    }, 280);
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SpaceSoundEngine();
