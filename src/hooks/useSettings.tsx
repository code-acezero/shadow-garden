"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// --- TYPES & DEFAULTS ---
export interface AppSettings {
  username: string;
  avatar: string;
  twoFactor: boolean;
  loginAlerts: boolean;
  incognito: boolean;
  publicActivity: boolean;
  allowRequests: boolean;
  
  // Player
  autoPlay: boolean;
  autoSkipOpEd: boolean;
  resumePlayback: boolean;
  volumeBoost: boolean; 
  defaultServer: 'hd-1' | 'hd-2' | 'mirror-1' | 'mirror-2';
  defaultQuality: '1080p' | '720p' | '480p' | '360p' | 'Auto';
  defaultAudio: 'jp' | 'en' | 'es' | 'pt'; 
  subLanguage: 'en' | 'es' | 'fr' | 'none';
  defaultVolume: number;
  haptics: boolean;
  pipMode: boolean;

  // Appearance
  accentColor: 'red' | 'orange' | 'gold' | 'green' | 'lime' | 'teal' | 'cyan' | 'blue' | 'indigo' | 'violet' | 'purple' | 'pink' | 'rose' | 'mono';
  glassEffect: boolean;
  particles: boolean;
  reducedMotion: boolean;
  roundedUI: boolean;
  uiGlow: boolean; 
  uiBorders: 'thin' | 'normal' | 'thick';
  cardVariant: 'default' | 'compact' | 'minimal';
  fontFamily: 'hunters' | 'badUnicorn' | 'demoness' | 'horrorshow' | 'kareudon' | 'monas' | 'nyctophobia' | 'onePiece' | 'inter';
  
  // Whisper
  whisperEnabled: boolean;
  whisperVoice: string;
  whisperVolume: number;

  // Content
  homeLayout: 'trending' | 'seasonal' | 'classic' | 'personal';
  listView: 'grid' | 'list' | 'comfortable';
  showNSFW: boolean;
  blurSpoilers: boolean;
  hideFillers: boolean;
  useJapaneseTitle: boolean;

  // Notifications
  pushNotifs: boolean;
  emailNotifs: boolean;
  newEpAlerts: boolean;
  communityAlerts: boolean;
  systemAlerts: boolean;
  enableWhisper: boolean;

  // Data
  autoBackup: boolean;
  bandwidthSaver: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  username: 'Shadow', avatar: '', twoFactor: false, loginAlerts: true, incognito: false, publicActivity: true, allowRequests: true,
  autoPlay: true, autoSkipOpEd: true, resumePlayback: true, volumeBoost: false, 
  defaultServer: 'hd-1', defaultQuality: '1080p', defaultAudio: 'jp', subLanguage: 'en', defaultVolume: 100, haptics: true, pipMode: true,
  accentColor: 'red', glassEffect: true, particles: true, reducedMotion: false, roundedUI: true, uiGlow: true, uiBorders: 'normal', cardVariant: 'default', fontFamily: 'inter', // Default to Inter for speed
  whisperEnabled: false, whisperVoice: 'system-alpha', whisperVolume: 0.8,
  homeLayout: 'trending', listView: 'grid', showNSFW: false, blurSpoilers: true, hideFillers: true, useJapaneseTitle: false,
  pushNotifs: true, emailNotifs: false, newEpAlerts: true, communityAlerts: true, systemAlerts: true, enableWhisper: true,
  autoBackup: true, bandwidthSaver: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  resetSettings: () => void;
  isLoaded: boolean;
  storageUsage: string; 
  clearCache: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

let providerMountCount = 0;
let effectRunCount = 0;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const mountId = useRef(++providerMountCount);
  const { user, profile } = useAuth();
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageUsage, setStorageUsage] = useState("0 KB");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Apply Theme CSS Variables
  const applyThemeRef = useRef((s: AppSettings) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const palettes: Record<string, any> = {
      red:    { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
      orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
      gold:   { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
      lime:   { 50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314', 950: '#1a2e05' }, 
      green:  { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
      teal:   { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
      cyan:   { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' },
      blue:   { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
      indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
      violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
      purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
      pink:   { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be123c', 800: '#9d174d', 900: '#831843', 950: '#500724' },
      rose:   { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
      mono:   { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
    };

    const activePalette = palettes[s.accentColor] || palettes['red'];
    Object.keys(activePalette).forEach(shade => root.style.setProperty(`--primary-${shade}`, activePalette[shade]));
    root.style.setProperty('--primary-color', activePalette[600]);

    // ✅ UPDATED FONT MAPPING
    // Maps setting value to CSS Variable defined in fonts.ts
    const fontMap: Record<string, string> = {
        'inter': 'var(--font-inter)',
        'badUnicorn': 'var(--font-bad-unicorn)',
        'demoness': 'var(--font-demoness)',
        'horrorshow': 'var(--font-horrorshow)',
        'hunters': 'var(--font-hunters)',
        'kareudon': 'var(--font-kareudon)',
        'monas': 'var(--font-monas)',
        'nyctophobia': 'var(--font-nyctophobia)',
        'onePiece': 'var(--font-one-piece)',
    };

    const selectedFont = fontMap[s.fontFamily] || 'var(--font-inter)';

    // Apply to both custom variables and default tailwind sans stack
    root.style.setProperty('--font-primary', selectedFont);
    root.style.setProperty('--font-sans', selectedFont);
    
    // UI Density & Radius
    root.style.setProperty('--radius', s.roundedUI ? '0.75rem' : '0rem');
    root.style.setProperty('--border-width', s.uiBorders === 'thick' ? '2px' : '1px');
    root.style.setProperty('--glow-opacity', s.uiGlow ? '1' : '0');
  });

  useEffect(() => {
    const currentUserId = user?.id || 'guest';
    const runId = ++effectRunCount;
    
    // Only re-initialize if user ID changed or first mount
    if (hasInitialized.current && userIdRef.current === currentUserId) return;

    hasInitialized.current = true;
    userIdRef.current = currentUserId;

    const key = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
    let currentSettings = { ...DEFAULT_SETTINGS };
    
    // 1. Local Storage
    const localData = localStorage.getItem(key);
    if (localData) {
      try {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(localData) };
      } catch (e) { 
        console.error("Settings parse error"); 
      }
    }

    // 2. Profile Sync
    if (user && profile?.settings) {
      currentSettings = { ...currentSettings, ...profile.settings };
    }

    setSettings(currentSettings);
    applyThemeRef.current(currentSettings);
    setIsLoaded(true); 
    
    // Calculate storage
    let total = 0;
    for (let x in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    setStorageUsage((total / 1024).toFixed(2) + " KB");
  }, [user?.id, profile?.id]);

  const updateSetting = useCallback((key: keyof AppSettings, value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      const storageKey = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;

      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      
      if (['accentColor', 'fontFamily', 'uiGlow', 'uiBorders', 'roundedUI'].includes(key)) {
        applyThemeRef.current(newSettings);
        localStorage.setItem('shadow_theme_cache', JSON.stringify({
            accentColor: newSettings.accentColor, 
            fontFamily: newSettings.fontFamily,
            uiGlow: newSettings.uiGlow,
            uiBorders: newSettings.uiBorders,
            roundedUI: newSettings.roundedUI
        }));
      }

      if (user && newSettings.autoBackup) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
          await supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id);
        }, 1000); 
      }
      return newSettings;
    });
  }, [user]);

  const resetSettings = useCallback(() => {
    const key = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
    applyThemeRef.current(DEFAULT_SETTINGS);
    if (user) supabase.from('profiles').update({ settings: DEFAULT_SETTINGS }).eq('id', user.id);
    toast.success("Factory Reset Complete");
  }, [user]);

  const clearCache = useCallback(() => {
    const key = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
    Object.keys(localStorage).forEach((k) => {
        if (k !== key && !k.includes('sb-') && !k.includes('auth')) localStorage.removeItem(k);
    });
    toast.success("Cache Cleared");
  }, [user]);

  const value = useMemo(() => {
    return {
      settings,
      updateSetting,
      resetSettings,
      isLoaded,
      storageUsage,
      clearCache
    };
  }, [settings, isLoaded, storageUsage, updateSetting, resetSettings, clearCache]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}