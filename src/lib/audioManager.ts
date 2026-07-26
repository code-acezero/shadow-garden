class AudioMatrix {
    private ctx: AudioContext | null = null;
    private sources: Map<string, HTMLAudioElement> = new Map();
    private active: boolean = false;
    private currentBgmIdx: number = -1;
    private bgmCount: number = 0;
    private loopNodes: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
    private fadeIntervals: Map<string, NodeJS.Timeout | number> = new Map();

    private getCtx(): AudioContext | null {
        if (!this.ctx && typeof window !== 'undefined') {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            if (Ctx) this.ctx = new Ctx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    // ─── NOISE BUFFER HELPER ────────────────────────────────────────────────────
    private makeNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
        const size = Math.floor(ctx.sampleRate * durationSec);
        const buf = ctx.createBuffer(1, size, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    // ─── STOP SYNTH LOOP ────────────────────────────────────────────────────────
    stopLoop(key: string, fadeMs = 300) {
        const node = this.loopNodes.get(key);
        if (!node) return;
        const ctx = this.getCtx();
        if (ctx) {
            const now = ctx.currentTime;
            node.gain.gain.setValueAtTime(node.gain.gain.value, now);
            node.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
            setTimeout(() => { try { node.source.stop(); } catch (_) {} }, fadeMs + 50);
        }
        this.loopNodes.delete(key);
    }

    init() {
        if (this.active || typeof window === 'undefined') return;
        this.getCtx();

        const bgmTracks = [
            "/bgm/Bleach OST 3 - Soundscape to Ardor.mp3",
            "/bgm/Columbina Nod-Krai Leitmotif Vocal 2 - Silvermoon Hall (Red)  Genshin Impact 6.0 OST.mp3",
            "/bgm/Dawn Winery Theme.mp3",
            "/bgm/Hiisi Island Day OST 3  Genshin Impact 6.0 OST.mp3",
            "/bgm/Hiisi Island Night OST 1 (To Light the Aeon Dark Motif)  Genshin Impact Luna I OST.mp3",
            "/bgm/Homecoming to Port.mp3",
            "/bgm/Lingering Bitterness.mp3",
            "/bgm/Lullaby of the New Moon (III)_ Petala ceciderunt - Silvermoon Hall (White)  Genshin Impact 6.0 OST.mp3",
            "/bgm/Mahou Shoujo Madoka Magica Rebellion OST - Take Your Hands.mp3",
            "/bgm/Naruto Shippuuden Sountrack (Man of the world).mp3",
            "/bgm/Nod-Krai - AURORA x HOYO-MiX Official Latin Lyrics  Genshin Impact Columbina OST.mp3",
            "/bgm/Overture of Falling Stars.mp3",
            "/bgm/Rapture of the Chaos.mp3",
            "/bgm/Sad Anime Ost _ Eye Water - Guitar.mp3",
            "/bgm/The Imminent Triumph.mp3",
            "/bgm/The Outlander Who Caught the Wind.mp3",
            "/bgm/[Final V4] Columbina's Lullaby Vocal - Maiden Flowerbed (Blue)  Genshin Impact 6.0 OST.mp3",
            "/bgm/[Finalized] Through the Silent Frostbound Night - Hiisi Island OST 2  Genshin Impact 6.0 OST.mp3"
        ];
        this.bgmCount = bgmTracks.length;

        bgmTracks.forEach((url, idx) => {
            const a = new Audio(url);
            a.preload = 'none';
            a.crossOrigin = 'anonymous';
            a.onended = () => { this.playNextBGM(); };
            this.sources.set(`bgm_${idx}`, a);
        });

        this.active = true;
        if (typeof window !== 'undefined') {
            (window as any).stopShadowBGM = () => this.stopAll(1500);
            (window as any).sfx = this;
        }
    }

    unlock() { this.getCtx(); }

    // ─── SYNTH: METAL CLICK ─────────────────────────────────────────────────────
    synthMetal(vol = 0.4) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            [1760, 2793, 4400].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(vol * (0.35 / (idx + 1)), now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2 + idx * 0.08);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(now); osc.stop(now + 0.35);
            });
        } catch (_) {}
    }

    // ─── SYNTH: CRYSTAL CHIME ───────────────────────────────────────────────────
    synthCrystal(vol = 0.3) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine'; osc2.type = 'sine';
            osc1.frequency.setValueAtTime(2093, now);
            osc1.frequency.exponentialRampToValueAtTime(2349, now + 0.15);
            osc2.frequency.setValueAtTime(3135, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
            osc1.start(now); osc2.start(now); osc1.stop(now + 0.35); osc2.stop(now + 0.35);
        } catch (_) {}
    }

    // ─── SYNTH: WHOOSH ──────────────────────────────────────────────────────────
    synthWhoosh(vol = 0.5) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, 0.35);
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(250, now);
            filter.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.35);
            filter.Q.value = 2.5;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start(now); noise.stop(now + 0.35);
        } catch (_) {}
    }

    // ─── SYNTH: FOOTSTEP (stone) ─────────────────────────────────────────────────
    synthFootstep(vol = 0.4) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            // Low thud
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120 + Math.random() * 20, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 0.11);
            gain.gain.setValueAtTime(vol * 0.55, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.13);
            // Stone texture
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, 0.06);
            const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 1.5;
            const g2 = ctx.createGain(); g2.gain.setValueAtTime(vol * 0.18, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            noise.connect(f); f.connect(g2); g2.connect(ctx.destination); noise.start(now); noise.stop(now + 0.06);
        } catch (_) {}
    }

    // ─── SYNTH: BREATH ──────────────────────────────────────────────────────────
    synthBreath(vol = 0.25) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 0.7;
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280, now);
            filter.frequency.linearRampToValueAtTime(650, now + 0.35);
            filter.frequency.linearRampToValueAtTime(240, now + dur);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.35);
            gain.gain.linearRampToValueAtTime(0.001, now + dur);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start(now); noise.stop(now + dur);
        } catch (_) {}
    }

    // ─── SYNTH: DRONE FLYBY WIND (loop) ────────────────────────────────────────
    synthDroneWhooshLoop(vol = 0.35) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            this.stopLoop('droneWind');
            const dur = 2.0;
            const buf = this.makeNoiseBuffer(ctx, dur);
            const source = ctx.createBufferSource(); source.buffer = buf; source.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 1.2;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);
            source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
            this.loopNodes.set('droneWind', { source, gain });
        } catch (_) {}
    }

    // ─── SYNTH: DOOR CREAK ──────────────────────────────────────────────────────
    synthDoorCreak(vol = 0.6) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 2.8;
            // Metallic groan: slow freq sweep
            [0, 0.3, 0.8].forEach((delay, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                const baseFreq = 80 - i * 15;
                osc.frequency.setValueAtTime(baseFreq, now + delay);
                osc.frequency.linearRampToValueAtTime(baseFreq * 0.4, now + delay + 1.2);
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(vol * (0.35 - i * 0.08), now + delay + 0.1);
                gain.gain.linearRampToValueAtTime(vol * (0.15 - i * 0.03), now + delay + 0.9);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.4);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(now + delay); osc.stop(now + delay + 1.5);
            });
            // Scrape noise
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol * 0.25, now + 0.2);
            g.gain.linearRampToValueAtTime(vol * 0.1, now + 1.5); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(f); f.connect(g); g.connect(ctx.destination); noise.start(now); noise.stop(now + dur);
        } catch (_) {}
    }

    // ─── SYNTH: BLINDING LIGHT SWELL ────────────────────────────────────────────
    synthBlindingLight(vol = 0.5) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            [4000, 6000, 8000, 12000].forEach((freq, i) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.3 / (i + 1)), now + 0.8);
                gain.gain.linearRampToValueAtTime(0.001, now + 2.5);
                osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 2.5);
            });
        } catch (_) {}
    }

    // ─── SYNTH: BLACK HOLE HUM (loop) ───────────────────────────────────────────
    synthBlackHoleHumLoop(vol = 0.35) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            this.stopLoop('bhHum');
            const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 28;
            const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.18;
            const lfoGain = ctx.createGain(); lfoGain.gain.value = 6;
            lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); lfo.start();
            // We store osc as source with a fake stop
            const fakeSource = { stop: () => { osc.stop(); lfo.stop(); } } as any;
            this.loopNodes.set('bhHum', { source: fakeSource, gain });
        } catch (_) {}
    }

    // ─── SYNTH: SUCK IN (Doppler rising sweep) ──────────────────────────────────
    synthSuckIn(vol = 0.7) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 2.5;
            // Rising pitched noise
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const filter = ctx.createBiquadFilter(); filter.type = 'bandpass';
            filter.frequency.setValueAtTime(100, now);
            filter.frequency.exponentialRampToValueAtTime(8000, now + dur);
            filter.Q.value = 3.0;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol * 0.3, now);
            gain.gain.linearRampToValueAtTime(vol * 1.0, now + dur * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start(now); noise.stop(now + dur);
            // Low rumble
            const osc = ctx.createOscillator(); osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(40, now); osc.frequency.linearRampToValueAtTime(8, now + dur);
            const og = ctx.createGain();
            og.gain.setValueAtTime(vol * 0.4, now); og.gain.exponentialRampToValueAtTime(0.001, now + dur);
            osc.connect(og); og.connect(ctx.destination); osc.start(now); osc.stop(now + dur);
        } catch (_) {}
    }

    // ─── SYNTH: SCREAM (female) ──────────────────────────────────────────────────
    synthScreamFemale(vol = 0.55) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 3.2;
            // High formant screech sweep
            [700, 1200, 2100, 3500].forEach((startFreq, i) => {
                const osc = ctx.createOscillator(); osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
                osc.frequency.setValueAtTime(startFreq, now + 0.05);
                osc.frequency.linearRampToValueAtTime(startFreq * 1.35 + Math.sin(i) * 80, now + dur * 0.6);
                osc.frequency.linearRampToValueAtTime(startFreq * 0.7, now + dur);
                const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
                filt.frequency.value = 1800 + i * 400; filt.Q.value = 4.0;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.22 / (i * 0.5 + 1)), now + 0.08);
                gain.gain.setValueAtTime(vol * (0.18 / (i * 0.5 + 1)), now + dur * 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
                osc.start(now); osc.stop(now + dur);
            });
            // Breathiness
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 2.0;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol * 0.08, now + 0.1);
            g.gain.linearRampToValueAtTime(vol * 0.04, now + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(f); f.connect(g); g.connect(ctx.destination); noise.start(now); noise.stop(now + dur);
        } catch (_) {}
    }

    // ─── SYNTH: SCREAM (male) ────────────────────────────────────────────────────
    synthScreamMale(vol = 0.55) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 3.5;
            [220, 440, 880, 1400].forEach((startFreq, i) => {
                const osc = ctx.createOscillator(); osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(startFreq, now + 0.05);
                osc.frequency.linearRampToValueAtTime(startFreq * 1.4 + Math.sin(i * 1.3) * 40, now + dur * 0.5);
                osc.frequency.linearRampToValueAtTime(startFreq * 0.6, now + dur);
                const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
                filt.frequency.value = 600 + i * 300; filt.Q.value = 3.5;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.28 / (i * 0.4 + 1)), now + 0.1);
                gain.gain.setValueAtTime(vol * (0.22 / (i * 0.4 + 1)), now + dur * 0.6);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
                osc.start(now); osc.stop(now + dur);
            });
            // Low rumble overlay
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol * 0.1, now + 0.12);
            g.gain.linearRampToValueAtTime(vol * 0.05, now + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(f); f.connect(g); g.connect(ctx.destination); noise.start(now); noise.stop(now + dur);
        } catch (_) {}
    }

    // ─── SYNTH: TUNNEL GLITCH BURST ─────────────────────────────────────────────
    synthTunnelGlitch(vol = 0.5) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            // Random burst of high freq pings
            for (let i = 0; i < 8; i++) {
                const delay = i * 0.06 + Math.random() * 0.04;
                const osc = ctx.createOscillator(); osc.type = 'square';
                const freq = 800 + Math.random() * 3200;
                osc.frequency.setValueAtTime(freq, now + delay);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + delay + 0.05);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.18, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(now + delay); osc.stop(now + delay + 0.07);
            }
            // Static crackle
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, 0.5);
            const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
            const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            noise.connect(f); f.connect(g); g.connect(ctx.destination); noise.start(now); noise.stop(now + 0.5);
        } catch (_) {}
    }

    // ─── SYNTH: TUNNEL WIND (loop) ───────────────────────────────────────────────
    synthTunnelWindLoop(vol = 0.5) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            this.stopLoop('tunnelWind');
            const buf = this.makeNoiseBuffer(ctx, 3.0);
            const source = ctx.createBufferSource(); source.buffer = buf; source.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 0.8;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
            source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
            this.loopNodes.set('tunnelWind', { source, gain });
        } catch (_) {}
    }

    // ─── SYNTH: TUNNEL END SWELL ─────────────────────────────────────────────────
    synthTunnelEnd(vol = 0.6) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 2.0;
            // Rising harmonic swell
            [200, 400, 600, 800, 1200].forEach((freq, i) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.linearRampToValueAtTime(freq * 1.5, now + dur);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.25 / (i + 1)), now + 0.6);
                gain.gain.linearRampToValueAtTime(vol * (0.3 / (i + 1)), now + dur * 0.7);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + dur);
            });
            // White flash noise
            const noise = ctx.createBufferSource(); noise.buffer = this.makeNoiseBuffer(ctx, 0.4);
            const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            noise.connect(g); g.connect(ctx.destination); noise.start(now); noise.stop(now + 0.4);
        } catch (_) {}
    }

    // ─── SYNTH: ARRIVAL CHIME ────────────────────────────────────────────────────
    synthArrival(vol = 0.45) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            // Gentle descending chime melody
            const notes = [1047, 880, 784, 659, 523]; // C6 A5 G5 E5 C5
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.28);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now + i * 0.28);
                gain.gain.linearRampToValueAtTime(vol * 0.3, now + i * 0.28 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.28 + 1.2);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(now + i * 0.28); osc.stop(now + i * 0.28 + 1.2);
            });
        } catch (_) {}
    }

    // ─── SYNTH: POPUP CHIME ──────────────────────────────────────────────────────
    synthPopupChime(vol = 0.35) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            [1047, 1319, 1568].forEach((freq, i) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(vol * 0.35, now + i * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.5);
            });
        } catch (_) {}
    }

    // ─── SYNTH: STEP (alias footstep) ────────────────────────────────────────────
    synthStep(vol = 0.4) { this.synthFootstep(vol); }

    // ─── SYNTH: GLASS ────────────────────────────────────────────────────────────
    synthGlass(vol = 0.5) {
        try {
            const ctx = this.getCtx(); if (!ctx) return;
            const now = ctx.currentTime;
            [2500, 3100, 4200, 5800].forEach((freq, i) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.3 / (i + 1)), now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.05);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(now); osc.stop(now + 0.3);
            });
        } catch (_) {}
    }

    // ─── PLAY ROUTER ─────────────────────────────────────────────────────────────
    play(key: string, vol = 1, loop = false, fadeMs = 0) {
        if (!this.active) this.init();

        // Synthesized sounds
        if (key === 'glass') { this.synthGlass(vol); return; }
        if (key === 'metal' || key === 'click' || key === 'drop' || key === 'grind' || key === 'boom') { this.synthMetal(vol); return; }
        if (key === 'crystal' || key === 'hover') { this.synthCrystal(vol); return; }
        if (key === 'whoosh' || key === 'camera') { this.synthWhoosh(vol); return; }
        if (key === 'step') { this.synthFootstep(vol); return; }
        if (key === 'breath' || key === 'wind') { this.synthBreath(vol); return; }
        if (key === 'suction') { this.synthSuckIn(vol); return; }
        if (key === 'door_creak') { this.synthDoorCreak(vol); return; }
        if (key === 'blinding_light') { this.synthBlindingLight(vol); return; }
        if (key === 'bh_hum') { this.synthBlackHoleHumLoop(vol); return; }
        if (key === 'tunnel_glitch') { this.synthTunnelGlitch(vol); return; }
        if (key === 'tunnel_wind') { this.synthTunnelWindLoop(vol); return; }
        if (key === 'tunnel_end') { this.synthTunnelEnd(vol); return; }
        if (key === 'arrival') { this.synthArrival(vol); return; }
        if (key === 'popup_chime') { this.synthPopupChime(vol); return; }
        if (key === 'scream_female') { this.synthScreamFemale(vol); return; }
        if (key === 'scream_male') { this.synthScreamMale(vol); return; }
        if (key === 'drone_wind') { this.synthDroneWhooshLoop(vol); return; }

        // HTML Audio sources (BGM)
        const a = this.sources.get(key);
        if (!a) return;
        a.loop = loop;
        if (!loop) a.currentTime = 0;
        a.volume = fadeMs > 0 ? 0 : vol;
        a.play().catch(() => {});
        if (fadeMs > 0) {
            let v = 0; const step = vol / (fadeMs / 50);
            if (this.fadeIntervals.has(key)) clearInterval(this.fadeIntervals.get(key) as any);
            const id = setInterval(() => { v = Math.min(vol, v + step); a.volume = v; if (v >= vol) clearInterval(id as any); }, 50);
            this.fadeIntervals.set(key, id);
        }
    }

    playRandomBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        let nextIdx = Math.floor(Math.random() * this.bgmCount);
        if (this.bgmCount > 1 && nextIdx === this.currentBgmIdx) {
            nextIdx = (nextIdx + 1) % this.bgmCount;
        }
        this.currentBgmIdx = nextIdx;
        this.play(`bgm_${this.currentBgmIdx}`, 0.25, false, 2000);
    }

    playNextBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        this.currentBgmIdx = (this.currentBgmIdx + 1) % this.bgmCount;
        this.play(`bgm_${this.currentBgmIdx}`, 0.25, false, 2000);
    }

    playPrevBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        this.currentBgmIdx = (this.currentBgmIdx - 1 + this.bgmCount) % this.bgmCount;
        this.play(`bgm_${this.currentBgmIdx}`, 0.25, false, 2000);
    }

    stop(key: string, fadeMs = 0) {
        // Synth loops
        if (key === 'bh_hum') { this.stopLoop('bhHum', fadeMs); return; }
        if (key === 'tunnel_wind') { this.stopLoop('tunnelWind', fadeMs); return; }
        if (key === 'drone_wind') { this.stopLoop('droneWind', fadeMs); return; }

        const a = this.sources.get(key);
        if (!a) return;
        if (this.fadeIntervals.has(key)) {
            clearInterval(this.fadeIntervals.get(key) as any);
            this.fadeIntervals.delete(key);
        }
        if (fadeMs > 0 && a.volume > 0) {
            const step = a.volume / (fadeMs / 50);
            const id = setInterval(() => { 
                a.volume = Math.max(0, a.volume - step); 
                if (a.volume <= 0.01) { 
                    a.volume = 0;
                    a.pause(); 
                    clearInterval(id as any); 
                    this.fadeIntervals.delete(key);
                } 
            }, 50);
            this.fadeIntervals.set(key, id);
        } else {
            a.volume = 0;
            a.pause();
        }
    }

    stopAll(fadeMs = 500) {
        this.sources.forEach((_, key) => this.stop(key, fadeMs));
        this.stopLoop('bhHum', fadeMs);
        this.stopLoop('tunnelWind', fadeMs);
        this.stopLoop('droneWind', fadeMs);
        this.currentBgmIdx = -1; // Reset BGM index so it doesn't resume
    }
}

export const sfx = new AudioMatrix();