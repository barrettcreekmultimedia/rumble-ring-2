export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.muted = false;
    this.ctx = null;
  }

  setMuted(value) {
    this.muted = Boolean(value);
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      this.ctx = new AudioCtx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  tone(type, frequency, duration = 0.08, volume = 0.035, slideTo = null) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  dash() { this.tone('sawtooth', 150, 0.055, 0.018, 240); }
  bump(heavy = false) { this.tone('square', heavy ? 95 : 140, heavy ? 0.11 : 0.06, heavy ? 0.05 : 0.025, 55); }
  warning() { this.tone('triangle', 520, 0.08, 0.025, 760); }
  fall() { this.tone('sawtooth', 180, 0.22, 0.035, 55); }
  start() { this.tone('square', 420, 0.09, 0.025, 620); }
  win() { this.tone('triangle', 460, 0.30, 0.045, 920); }
}
