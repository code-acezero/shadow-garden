"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { applyColorPalette, DEFAULT_THEME_ID, COLOR_PALETTES } from '@/lib/theme';
import { toast } from '@/lib/toast';

// --- TYPES & DEFAULTS ---
export interface AppSettings {
  twoFactor: boolean;
  loginAlerts: boolean;
  incognito: boolean;
  publicActivity: boolean;
  allowRequests: boolean;

  // Player
  autoPlay: boolean;
  autoSkip?: boolean;
  autoSkipOpEd: boolean;
  autoSkipOutro?: boolean;
  autoNext?: boolean;
  dimMode?: boolean;
  resumePlayback: boolean;
  volumeBoost: boolean;
  defaultServer: 'hd-1' | 'hd-2' | 'mirror-1' | 'mirror-2';
  server?: string;
  defaultQuality?: '1080p' | '720p' | '480p' | 'Auto';
  defaultAudio: 'jp' | 'en' | 'hi' | 'cn' | 'es' | 'pt';
  audio?: string;
  category?: 'sub' | 'dub' | 'raw';
  preferredAudio?: 'jp' | 'en' | 'hi' | 'cn';
  subLanguage: 'en' | 'es' | 'fr' | 'none';
  defaultVolume: number;
  haptics: boolean;
  pipMode: boolean;
  clearMode: boolean;
  tapPlayPauseWithControls: boolean;
  autoWatchlistTracking?: boolean;

  // Shorts & Reels
  shortsMuted?: boolean;
  shortsClearMode?: boolean;
  shortsTapPlayPause?: boolean;
  shortsAspectFit?: 'cover' | 'contain';
  shortsAutoAdvance?: boolean;
  shortsCcBg?: 'none' | 'solid' | 'blur';
  shortsCcOpacity?: number;
  shortsCcPosY?: number;

  // Sound & Haptics
  tapSound: boolean;
  tapSoundEffect: 'jelly' | 'switch' | 'taptic' | 'bubble' | 'pop' | 'wood';
  tapSoundVolume: number;

  // Appearance
  themeMode?: 'dark' | 'light';
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
  animeTitleLanguage: 'en' | 'jp' | 'romaji';

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

  // Privacy
  hideOnlineStatus: boolean;
  hideLevelBadge: boolean;

  // Integrations
  autoSyncAnilist: boolean;

  // Player Prefs Sync
  playerPrefs?: any;
}

export const DEFAULT_SETTINGS: AppSettings = {
  twoFactor: false, loginAlerts: true, incognito: false, publicActivity: true, allowRequests: true,
  autoPlay: true, autoSkip: true, autoSkipOpEd: true, autoSkipOutro: true, autoNext: true, dimMode: false, resumePlayback: true, volumeBoost: false,
  defaultServer: 'hd-1', server: 'MegaCloud', defaultQuality: '1080p', defaultAudio: 'jp', audio: 'jp', category: 'sub', subLanguage: 'en', defaultVolume: 100, haptics: true, pipMode: true, clearMode: true, tapPlayPauseWithControls: true,
  tapSound: true, tapSoundEffect: 'jelly', tapSoundVolume: 0.35,
  themeMode: 'dark',
  accentColor: 'violet', glassEffect: true, particles: true, reducedMotion: false, roundedUI: true, uiGlow: true, uiBorders: 'normal', cardVariant: 'default', fontFamily: 'inter',

  // ✅ ENABLED BY DEFAULT + SET TO ALPHA (ENGLISH)
  whisperEnabled: true,
  whisperVoice: 'alpha',
  whisperVolume: 0.8,

  homeLayout: 'trending', listView: 'grid', showNSFW: false, blurSpoilers: true, hideFillers: true, useJapaneseTitle: false, animeTitleLanguage: 'en',
  pushNotifs: true, emailNotifs: false, newEpAlerts: true, communityAlerts: true, systemAlerts: true,

  // ✅ ENABLED BY DEFAULT
  enableWhisper: true,

  // Shorts & Reels
  shortsMuted: false,
  shortsClearMode: false,
  shortsTapPlayPause: true,
  shortsAspectFit: 'cover',
  shortsAutoAdvance: true,
  shortsCcBg: 'blur',
  shortsCcOpacity: 75,
  shortsCcPosY: 20,

  autoBackup: true, bandwidthSaver: false,

  hideOnlineStatus: false,
  hideLevelBadge: false,
  autoSyncAnilist: true,
  autoWatchlistTracking: true,
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

    // Apply color palette from central theme engine
    let paletteId = DEFAULT_THEME_ID;
    const savedPalette = localStorage.getItem('shadow_color_palette');

    // Prioritize saved color palette if valid
    if (savedPalette && COLOR_PALETTES.some(p => p.id === savedPalette)) {
      paletteId = savedPalette;
    } else if (s.accentColor && s.accentColor !== 'red') {
      const colorToPaletteMap: Record<string, string> = {
        violet: 'sky-purple-violet',
        purple: 'amethyst-twilight',
        blue: 'midnight-sapphire',
        cyan: 'vortex-cyan',
        green: 'cyber-emerald',
        lime: 'toxic-lime',
        gold: 'solar-gold',
        orange: 'hyper-orange',
        rose: 'rose-quartz',
        pink: 'rose-quartz',
        mono: 'phantom-mono',
        indigo: 'deep-abyss',
        teal: 'cyber-emerald',
      };
      if (colorToPaletteMap[s.accentColor]) {
        paletteId = colorToPaletteMap[s.accentColor];
      } else if (COLOR_PALETTES.some(p => p.id === s.accentColor)) {
        paletteId = s.accentColor;
      }
    } else if (s.accentColor === 'red') {
      // Migrate away from legacy crimson to default material/matte purple-violet
      paletteId = 'sky-purple-violet';
    }

    const savedMode = (s.themeMode || localStorage.getItem('shadow_theme_mode') || 'dark') as 'dark' | 'light';
    applyColorPalette(paletteId, savedMode);

    const fontMap: Record<string, string> = {
      'inter': 'var(--font-sans)',
      'badUnicorn': 'var(--font-bad-unicorn)',
      'demoness': 'var(--font-gradvis)',
      'horrorshow': 'var(--font-above)',
      'hunters': 'var(--font-minomu)',
      'kareudon': 'var(--font-kareudon)',
      'monas': 'var(--font-monas)',
      'nyctophobia': 'var(--font-above)',
      'onePiece': 'var(--font-one-piece)',
    };

    const selectedFont = fontMap[s.fontFamily] || 'var(--font-sans)';

    root.style.setProperty('--font-primary', selectedFont);
    root.style.setProperty('--font-sans', selectedFont);

    root.style.setProperty('--radius', s.roundedUI ? '0.75rem' : '0rem');
    root.style.setProperty('--border-width', s.uiBorders === 'thick' ? '2px' : '1px');
    root.style.setProperty('--glow-opacity', s.uiGlow ? '1' : '0');
  });

  useEffect(() => {
    const currentUserId = user?.id || 'guest';
    const runId = ++effectRunCount;

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

    // Explicit check for anime title language override
    const savedAnimeTitleLang = localStorage.getItem('shadow_anime_title_language');
    if (savedAnimeTitleLang === 'en' || savedAnimeTitleLang === 'jp' || savedAnimeTitleLang === 'romaji') {
      currentSettings.animeTitleLanguage = savedAnimeTitleLang;
    } else if (currentSettings.useJapaneseTitle) {
      currentSettings.animeTitleLanguage = 'jp';
    }

    // 2. Profile Sync
    if (user && profile?.settings) {
      currentSettings = { ...currentSettings, ...profile.settings };

      // Preserve active local color palette if specifically chosen
      const activeLocalPalette = localStorage.getItem('shadow_color_palette');
      if (activeLocalPalette && COLOR_PALETTES.some(p => p.id === activeLocalPalette)) {
        currentSettings.accentColor = activeLocalPalette as any;
      }

      localStorage.setItem(key, JSON.stringify(currentSettings));

      // Override local shadow_player_prefs if DB has newer playerPrefs
      if (currentSettings.playerPrefs) {
        localStorage.setItem('shadow_player_prefs', JSON.stringify(currentSettings.playerPrefs));
      }
    }

    // Single-source player settings sync across player and watch pages
    try {
      const syncPlayer = {
        autoPlay: currentSettings.autoPlay,
        autoSkip: currentSettings.autoSkip ?? currentSettings.autoSkipOpEd ?? false,
        autoSkipOutro: currentSettings.autoSkipOutro ?? false,
        autoNext: currentSettings.autoNext ?? true,
        dimMode: currentSettings.dimMode ?? false,
        server: currentSettings.server || (currentSettings.defaultServer === 'hd-1' ? 'MegaCloud' : currentSettings.defaultServer) || 'MegaCloud',
        audio: currentSettings.audio || currentSettings.defaultAudio || 'jp',
        category: currentSettings.category || ((currentSettings.defaultAudio === 'en' || currentSettings.defaultAudio === 'hi') ? 'dub' : 'sub'),
        volume: currentSettings.defaultVolume ? currentSettings.defaultVolume / 100 : 1,
        ...(currentSettings.playerPrefs || {})
      };
      localStorage.setItem('shadow_player_prefs', JSON.stringify(syncPlayer));
      localStorage.setItem('shadow_watch_settings_anime', JSON.stringify(syncPlayer));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('update_player_prefs', { detail: { playerPrefs: syncPlayer } }));
      }
    } catch (e) { }

    // --- ✅ FORCE-ACTIVATE DEFAULT VOICE (ALPHA - EN) IF MISSING ---
    const voiceConfig = localStorage.getItem('shadow_voice_settings');
    if (!voiceConfig) {
      console.log("🔊 Injecting Default Voice Model: Alpha (EN)");
      const defaultVoice = {
        pack: 'alpha',
        language: 'en',
        volume: 0.8,
        speed: 1.0,
        pitch: 1.0,
        enabled: true
      };
      localStorage.setItem('shadow_voice_settings', JSON.stringify(defaultVoice));

      // Also sync it to our settings state just in case
      currentSettings.whisperVoice = 'alpha';
      currentSettings.whisperEnabled = true;
    }
    // ---------------------------------------------------

    setSettings(currentSettings);
    applyThemeRef.current(currentSettings);
    setIsLoaded(true);

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

      // Keep aliases in sync
      if (key === 'autoSkip') {
        newSettings.autoSkipOpEd = value;
      } else if (key === 'autoSkipOpEd') {
        newSettings.autoSkip = value;
      }

      if (key === 'audio') {
        newSettings.defaultAudio = value as any;
        newSettings.category = (value === 'en' || value === 'hi') ? 'dub' : 'sub';
      } else if (key === 'defaultAudio') {
        newSettings.audio = value;
        newSettings.category = (value === 'en' || value === 'hi') ? 'dub' : 'sub';
      } else if (key === 'category') {
        if (!newSettings.audio || newSettings.audio === 'jp' || newSettings.audio === 'en') {
          newSettings.audio = value === 'dub' ? 'en' : 'jp';
          newSettings.defaultAudio = newSettings.audio as any;
        }
      }

      const storageKey = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
      localStorage.setItem(storageKey, JSON.stringify(newSettings));

      if (['accentColor', 'fontFamily', 'uiGlow', 'uiBorders', 'roundedUI', 'themeMode'].includes(key)) {
        applyThemeRef.current(newSettings);
        localStorage.setItem('shadow_theme_cache', JSON.stringify({
          themeMode: newSettings.themeMode,
          accentColor: newSettings.accentColor,
          fontFamily: newSettings.fontFamily,
          uiGlow: newSettings.uiGlow,
          uiBorders: newSettings.uiBorders,
          roundedUI: newSettings.roundedUI
        }));
        if (key === 'accentColor') {
          localStorage.setItem('shadow_color_palette', String(value));
        }
        if (key === 'themeMode') {
          localStorage.setItem('shadow_theme_mode', String(value));
        }
      }

      if (key === 'tapSound') {
        localStorage.setItem('shadow_tap_sound', String(value));
      }
      if (key === 'tapSoundEffect') {
        localStorage.setItem('shadow_tap_effect', String(value));
      }
      if (key === 'tapSoundVolume') {
        localStorage.setItem('shadow_tap_volume', String(value));
      }
      if (key === 'animeTitleLanguage') {
        localStorage.setItem('shadow_anime_title_language', String(value));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('shadow_settings_changed'));
        }
      }

      // Synchronize Shorts & Reels preferences
      if (key === 'shortsMuted') {
        localStorage.setItem('shadow_shorts_muted', String(value));
      }
      if (key === 'shortsClearMode') {
        localStorage.setItem('shadow_clear_mode', String(value));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_clear_mode_toggle', { detail: { enabled: value } }));
        }
      }
      if (key === 'shortsTapPlayPause') {
        localStorage.setItem('shadow_tap_play_pause', String(value));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_tap_play_pause_toggle', { detail: { enabled: value } }));
        }
      }
      if (key === 'shortsAspectFit') {
        localStorage.setItem('shadow_shorts_aspect_fit', String(value));
      }
      if (key === 'shortsAutoAdvance') {
        localStorage.setItem('shadow_shorts_auto_advance', String(value));
      }
      if (key === 'shortsCcBg') {
        localStorage.setItem('shadow_shorts_cc_bg', String(value));
      }
      if (key === 'shortsCcOpacity') {
        localStorage.setItem('shadow_shorts_cc_opacity', String(value));
      }
      if (key === 'shortsCcPosY') {
        localStorage.setItem('shadow_shorts_cc_pos_y', String(value));
      }

      // Synchronize player settings globally across OmniPlayer, watch pages, and settings
      if (['autoPlay', 'autoSkip', 'autoSkipOpEd', 'autoSkipOutro', 'autoNext', 'dimMode', 'defaultServer', 'server', 'defaultAudio', 'audio', 'category', 'playerPrefs', 'defaultVolume'].includes(key as string)) {
        try {
          const curPrefs = JSON.parse(localStorage.getItem('shadow_player_prefs') || '{}');
          const updatedPlayerPrefs = {
            ...curPrefs,
            autoPlay: newSettings.autoPlay,
            autoSkip: newSettings.autoSkip ?? newSettings.autoSkipOpEd ?? false,
            autoSkipOutro: newSettings.autoSkipOutro ?? false,
            autoNext: newSettings.autoNext ?? true,
            dimMode: newSettings.dimMode ?? false,
            server: newSettings.server || (newSettings.defaultServer === 'hd-1' ? 'MegaCloud' : newSettings.defaultServer) || 'MegaCloud',
            audio: newSettings.audio || newSettings.defaultAudio || 'jp',
            category: newSettings.category || ((newSettings.defaultAudio === 'en' || newSettings.defaultAudio === 'hi') ? 'dub' : 'sub'),
            volume: newSettings.defaultVolume ? newSettings.defaultVolume / 100 : 1,
            ...(newSettings.playerPrefs || {})
          };
          localStorage.setItem('shadow_player_prefs', JSON.stringify(updatedPlayerPrefs));
          localStorage.setItem('shadow_watch_settings_anime', JSON.stringify(updatedPlayerPrefs));
          if (typeof window !== 'undefined' && key !== 'playerPrefs') {
            window.dispatchEvent(new CustomEvent('update_player_prefs', { detail: { playerPrefs: updatedPlayerPrefs, source: 'SettingsProvider' } }));
          }
        } catch (e) { }
      }

      // Single source of truth in Supabase for authenticated users
      if (user) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
          try {
            await supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id);
          } catch (err) {
            console.warn("Supabase player settings sync:", err);
          }
        }, 500);
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
      clearCache,
    };
  }, [settings, isLoaded, storageUsage, updateSetting, resetSettings, clearCache]);

  useEffect(() => {
    const handlePlayerPrefsUpdate = (e: any) => {
      if (e.detail?.source === 'SettingsProvider') return;
      if (e.detail && e.detail.playerPrefs) {
        updateSetting('playerPrefs', e.detail.playerPrefs);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('update_player_prefs', handlePlayerPrefsUpdate);
      return () => window.removeEventListener('update_player_prefs', handlePlayerPrefsUpdate);
    }
  }, [updateSetting]);

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
