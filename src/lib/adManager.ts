"use client";

import { supabase } from '@/lib/supabase';

export interface AdsConfig {
  enabled: boolean;
  domainId: string;
  
  // Units & Scripts from Adsterra
  smartlinkUrl: string;
  adScriptUrl: string;
  popunderScriptUrl: string;
  socialBarScriptUrl: string;
  nativeBannerScriptUrl: string;
  popunderUnitId: string;
  nativeBannerUnitId: string;
  socialBarUnitId: string;
  smartlinkUnitId: string;

  // Smartlink / Direct Link Triggers
  smartlinkEnabled: boolean;
  smartlinkCooldownMinutes: number;
  smartlinkOnDownload: boolean;
  smartlinkOnServerChange: boolean;

  // Episode & Video Monetization Triggers
  smartlinkOnFirstPlay: boolean;        // 1st ad: First play of an episode
  smartlinkOnMidRoll: boolean;          // 2nd ad: After middle part (~50%)
  midRollPercent: number;               // Mid-roll percentage trigger (default 50)
  smartlinkOnEpisodeClick: boolean;     // Ad when switching episode/anime tile
  episodeSwitchCooldownSeconds: number; // Debounce between episode click ads

  // Social Bar
  socialBarEnabled: boolean;
  socialBarDelaySeconds: number;

  // Popunder
  popunderEnabled: boolean;
  popunderCooldownHours: number;

  // Native Banners
  nativeBannerEnabled: boolean;
  showOnWatchPage: boolean;
  showOnDownloadPage: boolean;
  showOnOtakuVerse: boolean;

  // Anti-Adblock & Exemptions
  antiAdblockEnabled: boolean;
  vipExempt: boolean;
}

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  enabled: true,
  domainId: '6041728',

  // Anti-Adblock links & scripts from user Adsterra account
  smartlinkUrl: 'https://divinglibrary.com/xp6sjxn0?key=3733a0e6bbae7d93e3f83caaab956f86',
  adScriptUrl: 'https://divinglibrary.com/70/10/05/70100569fb256cc9e16e5631a53f9905.js',
  popunderScriptUrl: 'https://divinglibrary.com/70/10/05/70100569fb256cc9e16e5631a53f9905.js',
  socialBarScriptUrl: 'https://divinglibrary.com/c3/9b/d7/c39bd7bee74d0bb41da0c29f683939d8.js',
  nativeBannerScriptUrl: 'https://divinglibrary.com/d0b85e11abfe70f8bf477f8ec122a128/invoke.js',
  popunderUnitId: '70100569fb256cc9e16e5631a53f9905',
  nativeBannerUnitId: 'd0b85e11abfe70f8bf477f8ec122a128',
  socialBarUnitId: 'c39bd7bee74d0bb41da0c29f683939d8',
  smartlinkUnitId: '3733a0e6bbae7d93e3f83caaab956f86',

  // Smartlink frequency & trigger settings
  smartlinkEnabled: true,
  smartlinkCooldownMinutes: 15, // max 1 generic trigger every 15 minutes
  smartlinkOnDownload: true,    // Highest converting trigger
  smartlinkOnServerChange: false,

  // Episode-level ads: 2 per episode (1st play + middle part) + episode switch
  smartlinkOnFirstPlay: true,
  smartlinkOnMidRoll: true,
  midRollPercent: 50,           // 50% through episode
  smartlinkOnEpisodeClick: true,
  episodeSwitchCooldownSeconds: 30, // 30s debounce to avoid browser spam

  // Social Bar (In-page push notification)
  socialBarEnabled: false,
  socialBarDelaySeconds: 3,

  // Popunder (strictly capped if enabled)
  popunderEnabled: false,       // Keep false by default for maximum clean UI
  popunderCooldownHours: 12,

  // Native Banners
  nativeBannerEnabled: true,
  showOnWatchPage: true,
  showOnDownloadPage: true,
  showOnOtakuVerse: false,

  // Protection
  antiAdblockEnabled: true,
  vipExempt: true,              // Donators, VIPs, Admins see 0 ads
};

const STORAGE_KEY = 'shadow_ads_config';
const LAST_SMARTLINK_TRIGGER_KEY = 'shadow_last_smartlink_trigger';
const LAST_POPUNDER_TRIGGER_KEY = 'shadow_last_popunder_trigger';
const LAST_EP_SWITCH_TRIGGER_KEY = 'shadow_last_ep_switch_trigger';

export const adManager = {
  /**
   * Retrieves active ads configuration (localStorage -> defaults)
   */
  getConfig(): AdsConfig {
    if (typeof window === 'undefined') return DEFAULT_ADS_CONFIG;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_ADS_CONFIG, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Failed to parse ads config from localStorage:', e);
    }
    return DEFAULT_ADS_CONFIG;
  },

  /**
   * Fetches latest config from Supabase site_config (if available)
   */
  async syncFromDatabase(): Promise<AdsConfig> {
    if (typeof window === 'undefined') return DEFAULT_ADS_CONFIG;
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'ads_config')
        .maybeSingle();

      if (data?.value && !error) {
        const parsed = JSON.parse(data.value);
        const merged = { ...DEFAULT_ADS_CONFIG, ...parsed };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('shadow-ads-config-changed', { detail: merged }));
        return merged;
      }
    } catch (e) {
      // Fallback silently
    }
    return this.getConfig();
  },

  /**
   * Saves new configuration to both Supabase and localStorage
   */
  async saveConfig(newConfig: Partial<AdsConfig>): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const current = this.getConfig();
    const merged: AdsConfig = { ...current, ...newConfig };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('shadow-ads-config-changed', { detail: merged }));

      // Persist to Supabase site_config
      await supabase.from('site_config').upsert({
        key: 'ads_config',
        value: JSON.stringify(merged),
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (e) {
      console.error('Failed to save ads config:', e);
      return false;
    }
  },

  /**
   * Checks if current user is exempt from ads
   */
  isExempt(): boolean {
    if (typeof window === 'undefined') return false;
    const config = this.getConfig();
    if (!config.enabled) return true;

    if (config.vipExempt) {
      if (localStorage.getItem('sg_ad_free') === 'true') return true;
      try {
        const userProfile = localStorage.getItem('shadow_user_profile');
        if (userProfile) {
          const p = JSON.parse(userProfile);
          if (p?.role === 'admin' || p?.role === 'moderator' || p?.is_vip || p?.is_donator) {
            return true;
          }
        }
      } catch {}
    }
    return false;
  },

  /**
   * Helper to open ad URL in a background tab and retain focus on Shadow Garden
   */
  openDirectLink(customUrl?: string): boolean {
    if (typeof window === 'undefined') return false;
    const config = this.getConfig();
    const url = customUrl || config.smartlinkUrl || DEFAULT_ADS_CONFIG.smartlinkUrl;
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win) {
        win.blur();
        window.focus();
        return true;
      }
    } catch (e) {
      console.warn('Direct link open blocked:', e);
    }
    return false;
  },

  /**
   * Triggers the Anti-Adblock Smartlink in a background tab if cooldown has passed.
   * Keeps current tab completely focused on Shadow Garden.
   */
  triggerSmartlink(source: string = 'general'): boolean {
    if (typeof window === 'undefined') return false;
    const config = this.getConfig();

    if (!config.enabled || !config.smartlinkEnabled) return false;
    if (this.isExempt()) return false;

    const now = Date.now();
    const lastTrigger = localStorage.getItem(LAST_SMARTLINK_TRIGGER_KEY);
    const cooldownMs = (config.smartlinkCooldownMinutes || 15) * 60 * 1000;

    if (lastTrigger && now - parseInt(lastTrigger, 10) < cooldownMs) {
      return false; // Still on cooldown
    }

    localStorage.setItem(LAST_SMARTLINK_TRIGGER_KEY, now.toString());
    return this.openDirectLink();
  },

  /**
   * 1st Episode Ad: Fires on the very first play action of an episode.
   * Capped to exactly once per episode per session.
   */
  triggerFirstPlay(episodeId: string = 'current'): boolean {
    if (typeof window === 'undefined') return false;
    const config = this.getConfig();
    if (!config.enabled || !config.smartlinkEnabled || !config.smartlinkOnFirstPlay) return false;
    if (this.isExempt()) return false;

    const sessionKey = `sg_first_play_ad_${episodeId}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        return false; // Already triggered for this episode in this browser session
      }
      sessionStorage.setItem(sessionKey, 'true');
      return this.openDirectLink();
    } catch (e) {
      return false;
    }
  },

  /**
   * Checks whether mid-roll ad was already shown for this episode.
   */
  hasShownMidRoll(episodeId: string = 'current'): boolean {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem(`sg_mid_roll_ad_${episodeId}`) === 'true';
    } catch {
      return false;
    }
  },

  /**
   * 2nd Episode Ad: Fires after the middle part (~50% of the episode duration).
   * Capped to exactly once per episode per session.
   */
  triggerMidRoll(episodeId: string = 'current'): boolean {
    if (typeof window === 'undefined') return false;
    const config = this.getConfig();
    if (!config.enabled || !config.smartlinkEnabled || !config.smartlinkOnMidRoll) return false;
    if (this.isExempt()) return false;

    const sessionKey = `sg_mid_roll_ad_${episodeId}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        return false;
      }
      sessionStorage.setItem(sessionKey, 'true');
      return this.openDirectLink();
    } catch (e) {
      return false;
    }
  },

  /**
   * Episode Switch Ad: Fires when the user clicks an episode tile to switch episodes/anime.
   * Debounced by episodeSwitchCooldownSeconds (default: 30s) to prevent browser popup throttling.
   */
  triggerEpisodeSwitch(episodeId: string = 'next'): boolean {
    if (typeof window === 'undefined') return false;
    const config = this.getConfig();
    if (!config.enabled || !config.smartlinkEnabled || !config.smartlinkOnEpisodeClick) return false;
    if (this.isExempt()) return false;

    const now = Date.now();
    const lastTrigger = localStorage.getItem(LAST_EP_SWITCH_TRIGGER_KEY);
    const cooldownMs = (config.episodeSwitchCooldownSeconds || 30) * 1000;

    if (lastTrigger && now - parseInt(lastTrigger, 10) < cooldownMs) {
      return false; // Debounced
    }

    localStorage.setItem(LAST_EP_SWITCH_TRIGGER_KEY, now.toString());
    return this.openDirectLink();
  },

  /**
   * Reset cooldowns for immediate testing in admin panel
   */
  resetCooldowns() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LAST_SMARTLINK_TRIGGER_KEY);
    localStorage.removeItem(LAST_POPUNDER_TRIGGER_KEY);
    localStorage.removeItem(LAST_EP_SWITCH_TRIGGER_KEY);
    try {
      // Clear session ad flags
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('sg_first_play_ad_') || k.startsWith('sg_mid_roll_ad_')) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {}
  },

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(): number {
    if (typeof window === 'undefined') return 0;
    const config = this.getConfig();
    const lastTrigger = localStorage.getItem(LAST_SMARTLINK_TRIGGER_KEY);
    if (!lastTrigger) return 0;
    const cooldownMs = (config.smartlinkCooldownMinutes || 15) * 60 * 1000;
    const elapsed = Date.now() - parseInt(lastTrigger, 10);
    const remaining = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
    return remaining;
  }
};

if (typeof window !== 'undefined') {
  (window as any).adManager = adManager;
}

