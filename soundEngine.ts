class SpaceSoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private musicMuted: boolean = false;
  private musicPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;

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

  public playShieldBlock(combo: number = 1) {
    this.triggerHaptic(combo > 3 ? [15, 10, 25] : 25);
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
    } catch {}
  }

  public playCoreHit() {
    this.triggerHaptic([30, 20, 70, 30, 40]);
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

  public playEMP() {
    this.triggerHaptic([20, 15, 40, 15, 80, 20, 40]);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
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

  public playLevelUp() {
    this.triggerHaptic([20, 20, 30, 20, 60]);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
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

  public playBossAlarm() {
    this.triggerHaptic([50, 40, 80, 40, 120]);
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

  public playLaserDeflect() {
    this.triggerHaptic([10, 8, 20]);
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  private buildMusicBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;

    const scale = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00];
    const pattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 7, 5, 3, 2, 0];
    const noteDur = 0.28;
    const noteGap = 0.28;
    const totalDur = pattern.length * noteGap;
    const sampleRate = this.ctx.sampleRate;
    const bufLen = Math.ceil(totalDur * sampleRate);
    const buffer = this.ctx.createBuffer(1, bufLen, sampleRate);
    const data = buffer.getChannelData(0);

    for (let n = 0; n < pattern.length; n++) {
      const freq = scale[pattern[n]];
      const startSample = Math.floor(n * noteGap * sampleRate);
      const endSample = Math.min(bufLen, Math.floor((n * noteGap + noteDur) * sampleRate));

      for (let s = startSample; s < endSample; s++) {
        const t = (s - startSample) / sampleRate;
        const env = Math.max(0, 0.05 * Math.exp(-t * 3.5));
        const saw = 2 * ((freq * t) % 1) - 1;
        const cutoff = 600 * Math.exp(-t * 5) + 250;
        const filtered = saw * Math.min(1, cutoff / (freq * 2));
        data[s] += env * filtered;
      }
    }

    return buffer;
  }

  public startMusic() {
    if (this.musicMuted || this.musicPlaying) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.musicPlaying = true;
    const buffer = this.buildMusicBuffer();
    if (!buffer) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.musicSource = this.ctx.createBufferSource();
    this.musicSource.buffer = buffer;
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGain);
    this.musicSource.start();
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch {}
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    if (this.musicGain) {
      this.musicGain.disconnect();
      this.musicGain = null;
    }
  }
}

export const soundEngine = new SpaceSoundEngine();
