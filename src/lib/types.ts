// src/lib/types.ts

export interface AppSettings {
  // General
  username?: string;
  avatar?: string;
  twoFactor: boolean;
  loginAlerts: boolean;
  incognito: boolean;
  publicActivity: boolean;
  allowRequests: boolean;

  // Player
  autoPlay: boolean;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  resumePlayback: boolean;
  defaultServer: string;
  defaultQuality: string;
  defaultAudio: string;
  subLanguage: string;
  defaultVolume: number;
  haptics: boolean;
  pipMode: boolean;

  // Appearance
  accentColor: 'red' | 'purple' | 'blue' | 'gold' | 'green' | 'pink' | 'mono' | 'neon';
  glassEffect: boolean;
  particles: boolean;
  reducedMotion: boolean;
  roundedUI: boolean;
  cardVariant: 'default' | 'compact' | 'minimal';
  fontFamily: 'cinzel' | 'inter' | 'roboto' | 'mono';

  // Content
  showNSFW: boolean;
  blurSpoilers: boolean;
  hideFillers: boolean;
  useJapaneseTitle: boolean;
  homeLayout: 'trending' | 'seasonal' | 'classic' | 'personal';
  listView: 'grid' | 'list' | 'comfortable';

  // Notifications
  pushNotifs: boolean;
  emailNotifs: boolean;
  newEpAlerts: boolean;
  communityAlerts: boolean;
  systemAlerts: boolean;

  // Data
  autoBackup: boolean;
  bandwidthSaver: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  username: 'Shadow',
  avatar: '',
  twoFactor: false,
  loginAlerts: true,
  incognito: false,
  publicActivity: true,
  allowRequests: true,
  autoPlay: true,
  autoSkipIntro: true,
  autoSkipOutro: false,
  resumePlayback: true,
  defaultServer: 'hd-1',
  defaultQuality: '1080p',
  defaultAudio: 'jp',
  subLanguage: 'en',
  defaultVolume: 100,
  haptics: true,
  pipMode: true,
  accentColor: 'red',
  glassEffect: true,
  particles: true,
  reducedMotion: false,
  roundedUI: true,
  cardVariant: 'default',
  fontFamily: 'cinzel',
  showNSFW: false,
  blurSpoilers: true,
  hideFillers: true,
  useJapaneseTitle: false,
  homeLayout: 'trending',
  listView: 'grid',
  pushNotifs: true,
  emailNotifs: false,
  newEpAlerts: true,
  communityAlerts: true,
  systemAlerts: true,
  autoBackup: true,
  bandwidthSaver: false,
};