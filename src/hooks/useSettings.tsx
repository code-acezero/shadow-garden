"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  enableWhisper: boolean;

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
  enableWhisper: true,

  // Data
  autoBackup: false,
  bandwidthSaver: false,
};

// --- CONTEXT SETUP ---
interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// --- PROVIDER COMPONENT ---
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load from LocalStorage on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shadow_settings');
        if (saved) {
          setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
      setIsLoaded(true);
    }
  }, []);

  // 2. Save to LocalStorage & Apply Styles on Change
  useEffect(() => {
    if (!isLoaded) return; 

    localStorage.setItem('shadow_settings', JSON.stringify(settings));

    const root = document.documentElement;
    
    // Accent Colors
    const colors: Record<string, string> = {
        red: '#dc2626', purple: '#9333ea', blue: '#2563eb', gold: '#ca8a04',
        green: '#16a34a', pink: '#db2777', mono: '#52525b', neon: '#22d3ee'
    };
    root.style.setProperty('--primary-color', colors[settings.accentColor] || '#dc2626');

    // Fonts
    if (settings.fontFamily === 'cinzel') root.style.setProperty('--font-primary', 'Cinzel');
    else if (settings.fontFamily === 'inter') root.style.setProperty('--font-primary', 'Inter');
    else if (settings.fontFamily === 'mono') root.style.setProperty('--font-primary', 'monospace');
    else root.style.setProperty('--font-primary', 'Roboto');

  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

// --- HOOK ---
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}