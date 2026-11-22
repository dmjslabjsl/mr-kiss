/**
 * A tiny, asset-free smooch synth. Audio only exists after a real gesture,
 * and it is muted by default — a love note should never make the first noise.
 */
const PREF_KEY = 'mrkiss:sound';

type AudioContextCtor = typeof AudioContext;

class Smooch {
  private context: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private resuming = false;
  private lastPlayAt = 0;
  enabled = false;
  private hydrated = false;

  hydrate(): boolean {
    if (this.hydrated || typeof window === 'undefined') return this.enabled;
    this.hydrated = true;
    try {
      this.enabled = window.localStorage.getItem(PREF_KEY) === 'on';
    } catch {
      this.enabled = false;
    }
    return this.enabled;
  }

  get supported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext
    );
  }

  async setEnabled(on: boolean): Promise<void> {
    this.enabled = on;
    this.hydrated = true;
    try {
      window.localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
    } catch {
      /* private mode can keep the preference for this visit only */
    }
    if (on) await this.unlock();
  }

  async unlock(): Promise<void> {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* a blocked context simply stays quiet */
      }
    }
  }

  play(strength = 1): void {
    if (!this.enabled || !this.supported) return;
    const wallClock = performance.now();
    if (wallClock - this.lastPlayAt < 50) return;
    this.lastPlayAt = wallClock;

    let ctx: AudioContext | null;
    try {
      ctx = this.ensureContext();
    } catch {
      return;
    }
    if (!ctx) return;
    if (ctx.state !== 'running') {
      if (!this.resuming) {
        this.resuming = true;
        void ctx
          .resume()
          .catch(() => {
            /* autoplay policies can keep us quiet; never noisy in the console */
          })
          .finally(() => {
            this.resuming = false;
          });
      }
      return;
    }
    if (!this.noise) this.noise = this.makeNoise(ctx);

    const now = ctx.currentTime;
    const pitch = 0.9 + Math.random() * 0.22;
    const amount = Math.min(1, Math.max(0.25, strength));
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = (Math.random() - 0.5) * 0.45;
      pan.connect(ctx.destination);
    }
    const out = pan ?? ctx.destination;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(1150 * pitch, now);
    band.frequency.exponentialRampToValueAtTime(620 * pitch, now + 0.11);
    band.Q.value = 0.9;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.075 * amount, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    noise.connect(band).connect(noiseGain).connect(out);
    noise.start(now);
    noise.stop(now + 0.2);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(370 * pitch, now + 0.015);
    osc.frequency.exponentialRampToValueAtTime(188 * pitch, now + 0.16);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now + 0.012);
    oscGain.gain.exponentialRampToValueAtTime(0.042 * amount, now + 0.04);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(oscGain).connect(out);
    osc.start(now + 0.01);
    osc.stop(now + 0.22);

    if (navigator.vibrate) {
      try {
        navigator.vibrate(9);
      } catch {
        /* haptics are a bonus, never a requirement */
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.supported) return null;
    if (!this.context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextCtor })
          .webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.context = new Ctor();
      } catch {
        return null;
      }
    }
    return this.context;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    return buffer;
  }
}

export const smooch = new Smooch();
