import { useState, useEffect } from 'react';

// --- FULL SETTINGS INTERFACE ---
export interface AppSettings {
  // 1. GENERAL & ACCOUNT
  username: string;
  avatar: string;
  twoFactor: boolean;
  loginAlerts: boolean;
  incognito: boolean;
  publicActivity: boolean;
  allowRequests: boolean;

  // 2. PLAYER & AUDIO
  autoPlay: boolean;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  resumePlayback: boolean;
  defaultServer: 'hd-1' | 'hd-2' | 'mirror-1' | 'mirror-2';
  defaultQuality: '4K' | '1080p' | '720p' | '480p' | 'Auto';
  defaultAudio: 'Japanese' | 'English' | 'Spanish' | 'Portuguese';
  subLanguage: 'English' | 'Spanish' | 'French' | 'None';
  defaultVolume: number;
  haptics: boolean;
  pipMode: boolean;

  // 3. APPEARANCE
  accentColor: 'red' | 'purple' | 'blue' | 'gold' | 'green' | 'pink' | 'mono' | 'neon';
  glassEffect: boolean;
  particles: boolean;
  reducedMotion: boolean;
  roundedUI: boolean;
  cardVariant: 'default' | 'compact' | 'minimal';
  fontFamily: 'cinzel' | 'inter' | 'roboto' | 'mono';

  // 4. CONTENT
  showNSFW: boolean;
  blurSpoilers: boolean;
  hideFillers: boolean;
  useJapaneseTitle: boolean;
  homeLayout: 'trending' | 'seasonal' | 'classic' | 'personal';
  listView: 'grid' | 'list' | 'comfortable';

  // 5. NOTIFICATIONS
  pushNotifs: boolean;
  emailNotifs: boolean;
  newEpAlerts: boolean;
  communityAlerts: boolean;
  systemAlerts: boolean;

  // 6. DATA
  autoBackup: boolean;
  bandwidthSaver: boolean;
}

// --- DEFAULT VALUES ---
const DEFAULT_SETTINGS: AppSettings = {
  // General
  username: 'Shadow Monarch',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow',
  twoFactor: false,
  loginAlerts: true,
  incognito: false,
  publicActivity: true,
  allowRequests: true,

  // Player
  autoPlay: true,
  autoSkipIntro: false,
  autoSkipOutro: false,
  resumePlayback: true,
  defaultServer: 'hd-1',
  defaultQuality: '1080p',
  defaultAudio: 'Japanese',
  subLanguage: 'English',
  defaultVolume: 100,
  haptics: true,
  pipMode: false,

  // Appearance
  accentColor: 'red',
  glassEffect: true,
  particles: true,
  reducedMotion: false,
  roundedUI: true,
  cardVariant: 'default',
  fontFamily: 'cinzel',

  // Content
  showNSFW: false,
  blurSpoilers: true,
  hideFillers: false,
  useJapaneseTitle: false,
  homeLayout: 'trending',
  listView: 'grid',

  // Notifications
  pushNotifs: true,
  emailNotifs: false,
  newEpAlerts: true,
  communityAlerts: true,
  systemAlerts: true,

  // Data
  autoBackup: false,
  bandwidthSaver: false,
};

export function useSettings() {
  // Initialize state from localStorage or defaults
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem('shadow_settings');
      // Merge saved settings with defaults to ensure new keys are present
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error("Failed to load settings", e);
      return DEFAULT_SETTINGS;
    }
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('shadow_settings', JSON.stringify(settings));
    
    // Apply dynamic styles to root
    const root = document.documentElement;
    root.style.setProperty('--primary-color', `var(--color-${settings.accentColor}-600)`);
    
    // Apply font family
    if (settings.fontFamily === 'cinzel') root.style.setProperty('--font-primary', 'Cinzel');
    if (settings.fontFamily === 'inter') root.style.setProperty('--font-primary', 'Inter');
    if (settings.fontFamily === 'mono') root.style.setProperty('--font-primary', 'monospace');

  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_SETTINGS);
    localStorage.removeItem('shadow_settings');
  };

  return { settings, updateSetting, resetSettings };
}