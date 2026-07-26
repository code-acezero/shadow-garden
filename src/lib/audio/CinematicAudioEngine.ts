"use client";

class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private spaceDroneGain: GainNode | null = null;
  private spaceOsc1: OscillatorNode | null = null;
  private spaceOsc2: OscillatorNode | null = null;

  constructor() {
    // Lazy init Web Audio API context upon user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.spaceDroneGain) {
      this.spaceDroneGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx?.currentTime || 0);
    }
  }

  // --- PHASE 1: SPACE AMBIENT DRONE ---
  public startSpaceDrone() {
    this.initCtx();
    if (!this.ctx || this.isMuted || this.spaceOsc1) return;

    try {
      const now = this.ctx.currentTime;
      this.spaceDroneGain = this.ctx.createGain();
      this.spaceDroneGain.gain.setValueAtTime(0, now);
      this.spaceDroneGain.gain.linearRampToValueAtTime(0.15, now + 3);

      this.spaceOsc1 = this.ctx.createOscillator();
      this.spaceOsc2 = this.ctx.createOscillator();

      this.spaceOsc1.type = 'sine';
      this.spaceOsc1.frequency.setValueAtTime(55, now); // A1 deep drone

      this.spaceOsc2.type = 'triangle';
      this.spaceOsc2.frequency.setValueAtTime(110.5, now); // Slightly detuned A2

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      this.spaceOsc1.connect(filter);
      this.spaceOsc2.connect(filter);
      filter.connect(this.spaceDroneGain);
      this.spaceDroneGain.connect(this.ctx.destination);

      this.spaceOsc1.start();
      this.spaceOsc2.start();
    } catch (e) {
      console.warn("Audio Engine space drone error:", e);
    }
  }

  public stopSpaceDrone() {
    if (this.spaceDroneGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.spaceDroneGain.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
          this.spaceOsc1?.stop();
          this.spaceOsc2?.stop();
          this.spaceOsc1 = null;
          this.spaceOsc2 = null;
          this.spaceDroneGain = null;
        }, 1500);
      } catch (e) {}
    }
  }

  // --- SCI-FI UI HOVER & CLICK SOUNDS ---
  public playUIHover() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  public playUIClick() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // --- HYPER-TRAVEL WHOOSH (Phase 3) ---
  public playHyperWhoosh() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 1.2);
      filter.frequency.exponentialRampToValueAtTime(300, now + 2.0);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 2.0);
    } catch (e) {}
  }

  // --- LANDING IMPACT & HEARTBEAT (Phase 5) ---
  public playLandingThud() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Heartbeat pulse
      setTimeout(() => this.playHeartbeat(), 500);
      setTimeout(() => this.playHeartbeat(), 1200);
    } catch (e) {}
  }

  public playHeartbeat() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(70, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // --- FOOTSTEP (Phase 6) ---
  public playFootstep() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // --- STONE DOOR GRINDING & BASS DROP (Phase 7) ---
  public playDoorGrind() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.linearRampToValueAtTime(120, now + 2.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.001, now + 2.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 2.5);

      // Deep sub bass drop
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(120, now + 0.2);
      bassOsc.frequency.exponentialRampToValueAtTime(25, now + 2.0);

      bassGain.gain.setValueAtTime(0.35, now + 0.2);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now + 0.2);
      bassOsc.stop(now + 2.0);
    } catch (e) {}
  }

  // --- TIME WARP / VACUUM (Phase 8) ---
  public playTimeWarp() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(800, now + 1.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    } catch (e) {}
  }
}

export const cinematicAudio = new CinematicAudioEngine();
