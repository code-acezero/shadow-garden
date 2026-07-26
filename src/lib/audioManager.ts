class AudioMatrix {
    private ctx: AudioContext | null = null;
    private sources: Map<string, HTMLAudioElement> = new Map();
    private active: boolean = false;
    private currentBgmIdx: number = -1;
    private bgmCount: number = 0;
    
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
    
    unlock() { 
        this.getCtx();
    }
    
    synthMetal(vol = 0.4) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const freqs = [1760, 2793, 4400];
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(vol * (0.35 / (idx + 1)), now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + (0.2 + idx * 0.08));
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (e) {}
    }
    
    synthCrystal(vol = 0.3) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(2093, now);
            osc1.frequency.exponentialRampToValueAtTime(2349, now + 0.15);
            osc2.frequency.setValueAtTime(3135, now);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.35);
            osc2.stop(now + 0.35);
        } catch (e) {}
    }

    synthWhoosh(vol = 0.5) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const bufferSize = Math.floor(ctx.sampleRate * 0.35);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource(); noise.buffer = buffer;
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
        } catch (e) {}
    }

    synthStep(vol = 0.4) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);
            gain.gain.setValueAtTime(vol * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.11);
        } catch (e) {}
    }

    synthBreath(vol = 0.3) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const bufferSize = Math.floor(ctx.sampleRate * 0.7);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource(); noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.linearRampToValueAtTime(700, now + 0.35);
            filter.frequency.linearRampToValueAtTime(250, now + 0.7);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.35, now + 0.35);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.7);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start(now); noise.stop(now + 0.7);
        } catch (e) {}
    }
    
    play(key: string, vol = 1, loop = false, fadeMs = 0) { 
        if(!this.active) this.init(); 
        
        if (key === 'metal' || key === 'click' || key === 'drop' || key === 'grind' || key === 'boom') { this.synthMetal(vol); return; }
        if (key === 'crystal' || key === 'hover') { this.synthCrystal(vol); return; }
        if (key === 'whoosh' || key === 'camera' || key === 'suction') { this.synthWhoosh(vol); return; }
        if (key === 'step') { this.synthStep(vol); return; }
        if (key === 'breath' || key === 'wind') { this.synthBreath(vol); return; }
        
        const a = this.sources.get(key); 
        if(!a) return; 
        a.loop = loop; 
        if(!loop) a.currentTime = 0; 
        a.volume = fadeMs > 0 ? 0 : vol; 
        a.play().catch(() => {}); 
        if(fadeMs > 0) { 
            let v = 0; 
            const step = vol / (fadeMs/50); 
            const i = setInterval(() => { 
                v = Math.min(vol, v + step); 
                a.volume = v; 
                if(v >= vol) clearInterval(i); 
            }, 50); 
        } 
    }
    
    playRandomBGM() { 
        if (!this.active) this.init(); 
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        this.currentBgmIdx = Math.floor(Math.random() * this.bgmCount);
        const bgmKey = `bgm_${this.currentBgmIdx}`;
        if (this.sources.has(bgmKey)) {
            this.play(bgmKey, 0.25, false, 2000);
        }
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
        const a = this.sources.get(key); 
        if (!a) return; 
        if (fadeMs > 0) { 
            const step = a.volume / (fadeMs/50); 
            const i = setInterval(() => { 
                a.volume = Math.max(0, a.volume - step); 
                if(a.volume <= 0) { 
                    a.pause(); 
                    clearInterval(i); 
                } 
            }, 50); 
        } else { 
            a.pause(); 
        } 
    }
    
    stopAll(fadeMs = 500) { 
        this.sources.forEach((_, key) => this.stop(key, fadeMs)); 
    }
}

export const sfx = new AudioMatrix();