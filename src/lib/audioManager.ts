/**
 * Audio Manager for Shadow Garden Portal
 * Handles voice randomization and spatial audio
 */

export type VoiceType = 'male' | 'female';
export type AccentType = 'japanese' | 'chinese' | 'korean' | 'us' | 'uk' | 'indian';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async init() {
    if (this.initialized) return;
    
    // Preload sound effects (placeholder paths)
    const sfxPaths = [
      '/audio/sfx/camera_whoosh.mp3',
      '/audio/sfx/door_open.mp3',
      '/audio/sfx/footsteps.mp3',
      '/audio/sfx/ambient_wind.mp3',
      '/audio/sfx/fire_crackle.mp3'
    ];

    // Create placeholder audio elements
    sfxPaths.forEach(path => {
      const audio = new Audio();
      audio.preload = 'auto';
      // For now, use a silent data URL as placeholder
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      this.sounds.set(path, audio);
    });

    this.initialized = true;
  }

  getRandomWelcomeAudio(): string {
    // Random selection from welcome-1.mp3 to welcome-10.mp3
    const randomNum = Math.floor(Math.random() * 10) + 1;
    return `/audio/welcome-${randomNum}.mp3`;
  }

  playWelcomeVoice() {
    const audioPath = this.getRandomWelcomeAudio();
    const audio = new Audio(audioPath);
    audio.volume = 0.8;
    audio.play().catch(err => console.log('Audio play failed:', err));
  }

  playSFX(name: string, volume: number = 0.5, loop: boolean = false) {
    const path = `/audio/sfx/${name}.mp3`;
    const audio = this.sounds.get(path);
    
    if (audio) {
      audio.volume = volume;
      audio.loop = loop;
      audio.currentTime = 0;
      audio.play().catch(err => console.log('SFX play failed:', err));
    }
  }

  stopSFX(name: string) {
    const path = `/audio/sfx/${name}.mp3`;
    const audio = this.sounds.get(path);
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  stopAll() {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  setMasterVolume(volume: number) {
    this.sounds.forEach(audio => {
      audio.volume = volume;
    });
  }
}

export const audioManager = new AudioManager();