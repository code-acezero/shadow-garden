import { useState, useEffect } from 'react';

// Define the shape of your settings
export interface AppSettings {
  // Appearance
  accentColor: 'red' | 'purple' | 'blue' | 'gold';
  cardVariant: 'default' | 'compact';
  
  // Player
  autoPlay: boolean;
  autoSkipIntro: boolean;
  defaultServer: 'hd-1' | 'hd-2';
  defaultQuality: '1080p' | '720p' | '360p';
  
  // Content
  showNSFW: boolean;
  useJapaneseTitle: boolean; // The feature you asked for earlier
  
  // Account
  username: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  accentColor: 'red',
  cardVariant: 'default',
  autoPlay: true,
  autoSkipIntro: false,
  defaultServer: 'hd-1',
  defaultQuality: '1080p',
  showNSFW: false,
  useJapaneseTitle: false,
  username: 'Shadow Monarch',
};

export function useSettings() {
  // Initialize state from localStorage or defaults
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem('shadow_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('shadow_settings', JSON.stringify(settings));
    
    // Apply accent color to document root (Optional advanced feature)
    document.documentElement.style.setProperty('--primary-color', settings.accentColor);
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_SETTINGS);
  };

  return { settings, updateSetting, resetSettings };
}