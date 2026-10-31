/**
 * Retro Arcade Sound Synthesizer & Tactile Haptic Engine (Web Audio + Vibration API)
 * Procedural 100% original audio & physical haptic feedback for Bounce Rolling: 3D Adventure.
 */
const STORAGE_HAPTICS_KEY = 'bounce_haptics_enabled';
const STORAGE_BGM_VOL_KEY = 'bounce_bgm_volume';
const STORAGE_SFX_VOL_KEY = 'bounce_sfx_volume';

class RetroBounceAudio {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private hapticsEnabled: boolean = true;
  private bgmVolume: number = 0.7;
  private sfxVolume: number = 0.85;
  private lastBounceTime: number = 0;
  private lastHapticTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_HAPTICS_KEY);
      if (saved === 'false') {
        this.hapticsEnabled = false;
      }
      const savedBgm = parseFloat(localStorage.getItem(STORAGE_BGM_VOL_KEY) || '');
      if (Number.isFinite(savedBgm)) {
        this.bgmVolume = Math.max(0, Math.min(1, savedBgm));
      }
      const savedSfx = parseFloat(localStorage.getItem(STORAGE_SFX_VOL_KEY) || '');
      if (Number.isFinite(savedSfx)) {
        this.sfxVolume = Math.max(0, Math.min(1, savedSfx));
      }
    } catch {
      // ignore storage errors
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(STORAGE_BGM_VOL_KEY, String(this.bgmVolume));
    } catch {
      // ignore
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(STORAGE_SFX_VOL_KEY, String(this.sfxVolume));
    } catch {
      // ignore
    }
  }

  public init() {
    if (this.muted) return;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_HAPTICS_KEY, String(enabled));
    } catch {
      // ignore storage errors
    }
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  /**
   * Triggers subtle physical feedback via the Navigator Vibration API.
   * Works independently of audio mute state so silent-mode mobile players still feel tactile impacts.
   */
  public vibrate(pattern: number | number[], minIntervalMs: number = 0) {
    if (!this.hapticsEnabled) return;
    if (minIntervalMs > 0) {
      const now = performance.now();
      if (now - this.lastHapticTime < minIntervalMs) return;
      this.lastHapticTime = now;
    }
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.vibrate === 'function'
      ) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore on unsupported browsers or restricted contexts
    }
  }

  /**
   * Velocity-scaled bounce audio & tactile pulse.
   * @param pitchMultiplier < 1 for heavy BIG ball, 1 for NORMAL ball, > 1.2 for Blue Rubber Trampoline
   * @param impactSpeed optional physical impact speed (m/s) to scale vibration duration
   */
  public playBounce(pitchMultiplier: number = 1, impactSpeed: number = 10) {
    const nowMs = performance.now();
    if (nowMs - this.lastBounceTime < 45) return;
    this.lastBounceTime = nowMs;

    if (pitchMultiplier >= 1.25) {
      // Springy double-pulse for Blue Rubber Bouncy Floor launch
      this.vibrate([12, 18, 22]);
    } else {
      // Subtle velocity-proportional pulse (8ms light hop -> 22ms heavy drop)
      const baseMs = Math.min(22, Math.max(8, Math.round(impactSpeed * 1.15)));
      const weightBonus = pitchMultiplier < 0.85 ? 5 : 0;
      this.vibrate(baseMs + weightBonus);
    }

    this.init();
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(
      360 * pitchMultiplier,
      now + 0.11
    );

    gain.gain.setValueAtTime(0.32 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Subtle tactile micro-tap when grazing or rebounding off brick walls, ceilings, or slopes.
   */
  public playSurfaceBump(impactSpeed: number) {
    const duration = Math.min(14, Math.max(6, Math.round(impactSpeed * 0.8)));
    this.vibrate(duration, 55);
  }

  /**
   * Soft hydrodynamic ripple vibration when plunging into a water pool.
   */
  public playWaterSplash() {
    this.vibrate([10, 22, 14], 90);
  }

  /**
   * Crisp tactile chime when passing through a Gold Ring Hoop.
   */
  public playRingCollect(unlocksGate: boolean = false) {
    if (unlocksGate) {
      this.vibrate([16, 24, 24, 28, 38]);
    } else {
      this.vibrate([12, 20, 18]);
    }
    this.init();
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.05 + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.11);
    });
  }

  public playCheckpoint() {
    this.vibrate([14, 24, 22]);
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 783.99, 1174.66];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.22, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.055 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.12);
    });
  }

  public playPump(inflate: boolean = true) {
    this.vibrate(inflate ? [12, 18, 20, 18, 28] : [26, 18, 12]);
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const startFreq = inflate ? 140 : 420;
    const endFreq = inflate ? 420 : 140;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBrickSmash() {
    this.vibrate(25);
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * High-impact hazard damage / ball pop vibration & sound.
   */
  public playPop() {
    this.vibrate([50, 28, 80, 24, 38]);
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playWinTune() {
    this.vibrate([22, 35, 22, 35, 55]);
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.16, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  public playExtraLife() {
    this.vibrate([20, 25, 20, 25, 45]);
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const chime = [440, 554.37, 659.25, 880, 1108.73];
    chime.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.24, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.18);
    });
  }

  private bgmInterval: any = null;

  public startBgm() {
    if (this.muted) return;
    this.init();
    if (this.bgmInterval) return;

    const melody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 440.00, 349.23];
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.ctx || this.bgmVolume <= 0.01) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melody[step % melody.length], now);

        gain.gain.setValueAtTime(0.045 * this.bgmVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        step++;
      } catch {}
    }, 420);
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  /**
   * Sparkling C-E-G-B arpeggio chime played when Invincibility Star is active.
   */
  public playStarChimeLoop() {
    this.init();
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.12);
    });
  }

  /**
   * Low-frequency growling pitch-drop impact sound when Polar Bear gets hit-stunned.
   */
  public playBearHitStun() {
    this.vibrate([30, 20, 40]);
    this.init();
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Joyful victory fanfare chime when final gold ring is collected and exit gate unlocks.
   */
  public playFinalRingFanfare() {
    this.vibrate([20, 30, 20, 40, 60]);
    this.init();
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.065 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.18);
    });
  }
  public playButtonPop() {
    this.vibrate(12);
    this.init();
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Playful 'pop' synthesis
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const soundFX = new RetroBounceAudio();


