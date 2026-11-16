class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private lastClickAt = 0;

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playClickHit(isCrit = false) {
    try {
      const now = performance.now();
      if (now - this.lastClickAt < 45) return;
      this.lastClickAt = now;

      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCrit ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isCrit ? 320 : 190, t);
      osc.frequency.exponentialRampToValueAtTime(isCrit ? 110 : 75, t + 0.08);
      gain.gain.setValueAtTime(isCrit ? 0.09 : 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch {
      // Ignore blocked audio context in restricted iframes
    }
  }

  playShellBreak() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.35);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    } catch {
      // Ignore
    }
  }

  playCannonFire() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.28);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch {
      // Ignore
    }
  }

  playBurst() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      [220, 330, 440].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + idx * 0.04 + 0.2);
        gain.gain.setValueAtTime(0.06, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.22);
      });
    } catch {
      // Ignore
    }
  }

  playVictory() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      [261.63, 329.63, 392.0, 523.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.09);
        gain.gain.setValueAtTime(0.08, t + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.09);
        osc.stop(t + idx * 0.09 + 0.46);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();
