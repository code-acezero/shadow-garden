"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Play, Monitor, Shield, Database,
  Trash2, LogOut, Server, Palette,
  Bell, Lock, Eye, Download, FileJson,
  AlertTriangle, Layers, Type, Speaker, Fingerprint,
  HardDrive, Mail, Key, Crown, RefreshCw,
  SkipForward, FastForward, ChevronDown, Check, X,
  Volume2, Settings as SettingsIcon,
  LayoutTemplate, Brush, Sun, Moon, Sidebar,
  Mic2, Radio, Menu, ArrowLeft, ChevronRight, Zap,
  Globe, Pause, PanelLeftClose, PanelLeftOpen, AudioWaveform, Upload, CheckCircle, ShieldCheck,
  PawPrint, SlidersHorizontal, Sliders, Smartphone, Flame, BadgeCheck, EyeOff,
  ChevronLeft, Plus, VolumeX, CheckCircle2, Instagram, Twitter, MessageCircle, Youtube, Github, Music2,
  BookOpen, Film, Tv, BookCheck, FileText, CheckSquare, FileCode, HelpCircle, Search, FileUp, FileDown,
  DoorOpen, DoorClosed
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { useTravellerProfile, saveTravellerProfile } from '@/hooks/useTravellerProfile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { MASCOT_ROSTER, STYLE_OPTIONS, DEFAULT_CONFIG, MascotConfig } from '@/components/Mascot/MascotPerch';
import PageMascot from '@/components/Mascot/PageMascot';
import Footer from '@/components/Anime/Footer';
import { refreshVoiceCache, getVoiceSettings, dispatchTelepathy, getCharacterLine, triggerTelepathy, playVoiceSample, CHARACTER_META, CHARACTER_SCRIPTS } from '@/lib/voice';
import AvatarSelectorModal, { getRandomAvatar } from '@/components/User/AvatarSelectorModal';
import { playTapSound, playGummyTap, playSquishyJelly } from '@/lib/audioManager';
import { pullFromAniList, twoWaySync } from '@/lib/anilistSync';
import { PuffedAnilist, PuffedRefresh, PuffedBookmark, PuffedPlay, PuffedCheck } from '@/components/Watchlist/PuffedIcons';
import { COLOR_PALETTES, applyColorPalette } from '@/lib/theme';
import OmniPlayer from '@/components/Player/OmniPlayer';

// --- SOCIAL PROFILE LINK TYPES ---
export type SocialPlatform = 'instagram' | 'twitter' | 'discord' | 'youtube' | 'tiktok' | 'github' | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

const parseSocialLinks = (raw?: string | null): SocialLink[] => {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  const clean = raw.trim();
  if (clean.startsWith('[') || clean.startsWith('{')) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.url && item.url.trim().length > 0);
      }
    } catch (_) {}
  }
  let platform: SocialPlatform = 'website';
  const lower = clean.toLowerCase();
  if (lower.includes('instagram.com')) platform = 'instagram';
  else if (lower.includes('twitter.com') || lower.includes('x.com')) platform = 'twitter';
  else if (lower.includes('discord.gg') || lower.includes('discord.com')) platform = 'discord';
  else if (lower.includes('youtube.com') || lower.includes('youtu.be')) platform = 'youtube';
  else if (lower.includes('tiktok.com')) platform = 'tiktok';
  else if (lower.includes('github.com')) platform = 'github';

  return [{ platform, url: clean }];
};

// --- MENU NAVIGATION & iOS GROUPED SETTINGS SYSTEM ---
interface MenuItem {
  id: string;
  label: string;
  desc: string;
  icon: any;
  group: 'identity' | 'media' | 'companion' | 'system';
  gradient: string;
}

const MENU_GROUPS = [
  { id: 'identity', title: 'Account' },
  { id: 'media', title: 'Playback & Media' },
  { id: 'companion', title: 'Telepathy & Companions' },
  { id: 'system', title: 'System & Archive' },
];

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'general',
    label: 'Adventurer Card',
    desc: 'Profile identity, username, socials & vault credentials',
    icon: Fingerprint,
    group: 'identity',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'player',
    label: 'Video Player',
    desc: 'Omni calibration studio, automations & captions',
    icon: Play,
    group: 'media',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'mangvels',
    label: 'Mangvels & Novels',
    desc: 'Reading directions, webtoon mode & page preloading',
    icon: BookOpen,
    group: 'media',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'flixverse',
    label: 'Flixverse & Cinema',
    desc: 'Cinema stream routes, ambient mode & recap skip',
    icon: Film,
    group: 'media',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'donghua',
    label: 'Donghua Sanctuary',
    desc: 'Mandarin voice priority & dual Hanzi/Pinyin subtitles',
    icon: Tv,
    group: 'media',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'sound',
    label: 'Sound & Haptics',
    desc: '6 interactive UI audio profiles & vibrations',
    icon: Volume2,
    group: 'media',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'whisper',
    label: 'Telepathy & Voice',
    desc: 'Companion voice packs & sound frequency',
    icon: Mic2,
    group: 'companion',
    gradient: 'from-cyan-500 to-sky-600',
  },
  {
    id: 'mascot',
    label: 'Pet Companion',
    desc: 'Perch behavior, persona & reactions',
    icon: PawPrint,
    group: 'companion',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'notifications',
    label: 'Missives & Alerts',
    desc: 'Push notifications & episode releases',
    icon: Bell,
    group: 'system',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'integrations',
    label: 'AniList & Sync',
    desc: 'Cloud binding & two-way progress mirroring',
    icon: Globe,
    group: 'system',
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'data',
    label: 'Archive & Storage',
    desc: 'Android-style XML backup & restore, history & cache',
    icon: HardDrive,
    group: 'system',
    gradient: 'from-zinc-500 to-slate-600',
  },
  {
    id: 'guide',
    label: 'Sanctuary Manual',
    desc: 'Full documentation guide for every setting & option',
    icon: BookCheck,
    group: 'system',
    gradient: 'from-teal-500 to-cyan-600',
  },
];

const APP_FONTS = [
  { id: 'inter', label: 'Inter Modern', desc: 'Clean, legible UI standard', style: '"Inter", sans-serif' },
  { id: 'hunters', label: 'Hunters Blade', desc: 'Heroic, sharp edge display', style: 'var(--font-hunters, sans-serif)' },
  { id: 'badUnicorn', label: 'Bad Unicorn', desc: 'Playful anime sketch style', style: 'BadUnicorn, cursive' },
  { id: 'demoness', label: 'Demoness Gothic', desc: 'Dark occult fantasy', style: 'Demoness, serif' },
  { id: 'horrorshow', label: 'Horrorshow Void', desc: 'Aggressive shadow aesthetic', style: 'Horrorshow, display' },
  { id: 'monas', label: 'Monas Cinematic', desc: 'Futuristic wide title font', style: 'Monas, sans-serif' },
  { id: 'onePiece', label: 'Grand Line', desc: 'Adventure title typography', style: '"One Piece", display' },
];

const SOUND_PRESETS = [
  { id: 'jelly', label: 'Squishy Jelly', desc: 'Rubbery playful pop with low acoustic body' },
  { id: 'switch', label: 'Tactile Snap', desc: 'Crisp mechanical tactile feedback' },
  { id: 'taptic', label: 'Kagemi Pulse', desc: 'Subterranean resonance impulse' },
  { id: 'bubble', label: 'Liquid Drop', desc: 'Gentle organic aquatic drop' },
  { id: 'pop', label: 'Air Burst', desc: 'Bright airy bubble snap' },
  { id: 'wood', label: 'Acoustic Clack', desc: 'Warm organic hollow strike' },
];

export interface MediaPreferences {
  mangvels: {
    readingDirection: 'webtoon' | 'rtl' | 'ltr';
    pageLayout: 'single' | 'double' | 'fit-width';
    preloadChapters: number;
    readerTheme: 'oled-black' | 'dark-slate' | 'sepia' | 'paper';
    imageQuality: 'original' | 'compressed' | 'data-saver';
    volumePageTurn: boolean;
  };
  flixverse: {
    defaultCinemaServer: string;
    audioTrackLanguage: string;
    ambientTheaterMode: boolean;
    autoSkipRecap: boolean;
    surroundSound: boolean;
    aspectRatio: '16:9' | '21:9' | 'fill';
  };
  donghua: {
    audioPriority: 'mandarin' | 'english' | 'hindi';
    hanziSubtitles: boolean;
    pinyinGuide: boolean;
    introSkipOffset: number;
    serverRegion: string;
  };
}

const DEFAULT_MEDIA_PREFS: MediaPreferences = {
  mangvels: {
    readingDirection: 'webtoon',
    pageLayout: 'fit-width',
    preloadChapters: 3,
    readerTheme: 'oled-black',
    imageQuality: 'original',
    volumePageTurn: true,
  },
  flixverse: {
    defaultCinemaServer: 'auto',
    audioTrackLanguage: 'en',
    ambientTheaterMode: true,
    autoSkipRecap: true,
    surroundSound: false,
    aspectRatio: '16:9',
  },
  donghua: {
    audioPriority: 'mandarin',
    hanziSubtitles: true,
    pinyinGuide: false,
    introSkipOffset: 90,
    serverRegion: 'asia-pacific',
  },
};

const SITE_GUIDES = [
  {
    category: 'identity',
    title: 'Username',
    desc: 'Your unique operative codename displayed across leaderboards, guild chats, and public profile badges.',
    defaultValue: 'Chosen on registration',
    proTip: 'Username is unique and cannot be duplicated by other operatives in the realm.',
    badge: 'CORE'
  },
  {
    category: 'identity',
    title: 'Gender Identity',
    desc: 'Select your preferred identity (Male, Female, Rather not say, None) to configure community title address.',
    defaultValue: 'Male',
    proTip: 'Only authentic standard options are supported to maintain clean sanctuary records.',
    badge: 'ACCOUNT'
  },
  {
    category: 'identity',
    title: 'Avatar Atelier',
    desc: 'Choose from 170+ official character avatars or upload custom portraits from the Atelier.',
    defaultValue: 'Default Shadow Crest',
    proTip: 'Equipping an Eternal or Ascendant frame grants active animated electric and ether auras.',
    badge: 'COSMETIC'
  },
  {
    category: 'identity',
    title: 'Social & Guild Connections',
    desc: 'Attach verified links to Instagram, X (Twitter), Discord, YouTube, GitHub, and personal webs.',
    defaultValue: 'None',
    proTip: 'Connected links appear on your public Adventurer Card for other operatives to follow.',
    badge: 'PROFILE'
  },
  {
    category: 'identity',
    title: 'Danger Zone & Account Eradication',
    desc: 'Permanently purge your operative account and all related bookmarks, history, and records from the database.',
    defaultValue: 'Active',
    proTip: 'Requires typing DELETE in capital letters to prevent accidental loss. Irreversible.',
    badge: 'SECURITY'
  },
  {
    category: 'playback',
    title: 'Omni Player Engine',
    desc: 'Next-gen streaming player supporting adaptive HLS streaming, MP4 direct video, multi-track audio, and gesture controls.',
    defaultValue: 'Active',
    proTip: 'Double tap left or right to skip 10 seconds. Swipe vertically on the right half to adjust volume.',
    badge: 'PLAYBACK'
  },
  {
    category: 'playback',
    title: 'Auto-Skip OP / ED',
    desc: 'Automatically skips anime opening and ending themes using precise frame timestamps.',
    defaultValue: 'Enabled',
    proTip: 'Can be manually triggered via the on-screen skip pill if automatic trigger is bypassed.',
    badge: 'AUTOMATION'
  },
  {
    category: 'playback',
    title: 'Auto-Play Next Episode',
    desc: 'Continuously advances to the next chapter or episode upon credit completion.',
    defaultValue: 'Enabled',
    proTip: 'Ideal for binge-watching marathons without needing to touch your controller or keyboard.',
    badge: 'AUTOMATION'
  },
  {
    category: 'playback',
    title: 'Resume Playback',
    desc: 'Preserves timestamp stamps so you can pause on mobile and resume on desktop exactly where you left off.',
    defaultValue: 'Enabled',
    proTip: 'Synced with Continue Watching row on the Home sanctuary.',
    badge: 'SYNC'
  },
  {
    category: 'playback',
    title: 'Caption Customization Studio',
    desc: 'Customize subtitle font size, color palette, outline contrast, and frosted glass background box.',
    defaultValue: 'Medium · White · Semi-Black Box',
    proTip: 'Yellow captions offer highest legibility against high-brightness action anime scenes.',
    badge: 'SUBTITLES'
  },
  {
    category: 'sound',
    title: 'Sound & Haptics Engine',
    desc: 'Synthesized low-latency Web Audio sound effects for taps, clicks, switches, and sliders.',
    defaultValue: 'Squishy Jelly · 35% Volume',
    proTip: 'Test permissions using the Grant Sound Permission button if browser autoplay muted audio.',
    badge: 'AUDIO'
  },
  {
    category: 'telepathy',
    title: 'Telepathy Voice System',
    desc: 'Hear whispered anime voice greetings and status announcements from your chosen companion character.',
    defaultValue: 'Enabled · Hana',
    proTip: 'Click the Preview button on any card in the Companion Roster to hear their greeting line.',
    badge: 'VOICE'
  },
  {
    category: 'mascot',
    title: 'Pet Mascot Perch',
    desc: 'An animated interactive pet that perches atop the Whisper Island navigation bar.',
    defaultValue: 'Enabled · Cid Kagenou',
    proTip: 'Click the pet anytime on the search island to boop them and hear their reactions.',
    badge: 'MASCOT'
  },
  {
    category: 'mangvels',
    title: 'Reading Direction & Mode',
    desc: 'Toggle between Vertical Webtoon (continuous scroll for Manhwa/Webtoons) and RTL (Right-to-Left traditional Manga).',
    defaultValue: 'Vertical Webtoon',
    proTip: 'Use RTL mode for traditional Japanese tankobon manga to read in authentic orientation.',
    badge: 'MANGA'
  },
  {
    category: 'mangvels',
    title: 'Chapter Preloading',
    desc: 'Caches the next 1 to 5 chapters in browser memory so pages load instantly as you scroll.',
    defaultValue: '3 Chapters',
    proTip: 'Reduces wait times on slower mobile internet connections.',
    badge: 'PERFORMANCE'
  },
  {
    category: 'mangvels',
    title: 'OLED Reader Theme',
    desc: 'Renders the reading stage in pure pitch black (#000000) to maximize battery savings and contrast on OLED displays.',
    defaultValue: 'OLED Pitch Black',
    proTip: 'Warm Sepia is also available for night reading without eye fatigue.',
    badge: 'THEME'
  },
  {
    category: 'flixverse',
    title: 'Cinema Stream Routing',
    desc: 'Dedicated high-bandwidth stream server routes optimized for full-length movies and western series.',
    defaultValue: 'Multi-CDN Auto',
    proTip: 'Switch to VIP Stream Direct if you experience peak evening buffering.',
    badge: 'CINEMA'
  },
  {
    category: 'flixverse',
    title: 'Ambient Theater Mode',
    desc: 'Projects a soft dynamic glow outside the video container matching scene lighting.',
    defaultValue: 'Enabled',
    proTip: 'Best experienced in a darkened room on wide desktop displays.',
    badge: 'CINEMA'
  },
  {
    category: 'donghua',
    title: 'Mandarin Voice Priority',
    desc: 'Ensures original Chinese Mandarin audio is selected first, with fallback to English or Hindi dubs.',
    defaultValue: 'Mandarin (Original)',
    proTip: 'Cultivation and wuxia titles deliver their fullest impact in the original voice acting.',
    badge: 'DONGHUA'
  },
  {
    category: 'donghua',
    title: 'Dual Hanzi & Pinyin Subtitles',
    desc: 'Displays traditional/simplified Hanzi characters and pinyin pronunciation alongside English subtitles.',
    defaultValue: 'Hanzi Enabled · Pinyin Disabled',
    proTip: 'Invaluable for learners practicing Chinese cultivation terminology.',
    badge: 'SUBTITLES'
  },
  {
    category: 'system',
    title: 'Library & Account Migration (XML)',
    desc: 'Android-style portable XML archive. Export or restore your entire library, history, settings, and companion.',
    defaultValue: 'Portable XML',
    proTip: 'Your username is never overwritten on restore, guaranteeing account safety across devices.',
    badge: 'BACKUP'
  },
  {
    category: 'system',
    title: 'AniList Two-Way Mirror',
    desc: 'Bi-directionally synchronize episode progress and watch status with your AniList.co profile.',
    defaultValue: 'Available',
    proTip: 'Run 2-Way Sync to merge recent activity without losing episode milestones.',
    badge: 'SYNC'
  }
];

// Helper: Custom Whisper Toast
const notifyWhisper = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('shadow-whisper', {
      detail: { id: Date.now(), type, title: "Magical Core", message }
    });
    window.dispatchEvent(event);
  }
};

export default function Settings() {
  const { profile, refreshSession, signOut } = useAuth();
  const { settings, updateSetting, resetSettings, storageUsage, clearCache } = useSettings();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('general');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shadow_settings_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    playSquishyJelly(0.35);
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('shadow_settings_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  // Profile Identity States
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('male');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Account Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Password Update
  const [passData, setPassData] = useState({ newPass: '', confirmPass: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Audio Permission Engine & Checker
  const [audioPermission, setAudioPermission] = useState<'granted' | 'needs_interaction' | 'unsupported'>('needs_interaction');
  const [isCheckingAudio, setIsCheckingAudio] = useState(false);

  const checkAudioPermission = useCallback(() => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      setAudioPermission('unsupported');
      return;
    }
    if ((navigator as any).userActivation?.hasBeenActive) {
      setAudioPermission('granted');
    } else {
      try {
        const testCtx = new AudioCtx();
        if (testCtx.state === 'running') {
          setAudioPermission('granted');
        } else {
          setAudioPermission('needs_interaction');
        }
        testCtx.close().catch(() => {});
      } catch (_) {
        setAudioPermission('needs_interaction');
      }
    }
  }, []);

  useEffect(() => {
    checkAudioPermission();
  }, [checkAudioPermission]);

  const requestAndTestSoundPermission = async () => {
    setIsCheckingAudio(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        toast.error('Web Audio API not supported in this browser.');
        setAudioPermission('unsupported');
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 400);

      setAudioPermission('granted');
      toast.success('Sound permission verified! Audio feedback active.');
      notifyWhisper('Audio engine initialized and permitted by browser.', 'success');
    } catch (err: any) {
      toast.error('Could not activate audio. Please interact with the page.');
    } finally {
      setIsCheckingAudio(false);
    }
  };

  // Traveller Profile (Guest)
  const traveller = useTravellerProfile();
  const [travellerName, setTravellerName] = useState('');
  const [travellerAvatar, setTravellerAvatar] = useState('');
  const [isSavingTraveller, setIsSavingTraveller] = useState(false);

  // Voice Preview State
  const [voiceLanguageTab, setVoiceLanguageTab] = useState<'en' | 'jp'>('en');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  // Pet Mascot Configuration
  const [mascotConfig, setMascotConfig] = useState<MascotConfig>(DEFAULT_CONFIG);

  // AniList Sync
  const [anilistUsername, setAnilistUsername] = useState('');
  const [hasAnilistToken, setHasAnilistToken] = useState(false);
  const [syncActionType, setSyncActionType] = useState<'two-way' | 'pull-override' | 'push-override' | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Storage and Watchlist stats
  const [watchlistCount, setWatchlistCount] = useState<number>(0);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Media Preferences (Mangvels, Flixverse, Donghua)
  const [mediaPrefs, setMediaPrefs] = useState<MediaPreferences>(DEFAULT_MEDIA_PREFS);

  // XML Backup & Account Migration States
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupModules, setBackupModules] = useState({
    library: true,
    history: true,
    settings: true,
    companion: true,
    profile: true,
    mediaPrefs: true,
  });
  const [restoreModules, setRestoreModules] = useState({
    library: true,
    history: true,
    settings: true,
    companion: true,
    profile: true,
    mediaPrefs: true,
  });
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Guide Section States
  const [guideQuery, setGuideQuery] = useState('');
  const [guideCategory, setGuideCategory] = useState<string>('all');

  // Active Voice Audio Ref
  const activeVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const isAuthenticated = !!(profile && profile.id && !profile.is_guest);

  useEffect(() => {
    setMounted(true);
    refreshVoiceCache();

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || hash;
      const savedTab = localStorage.getItem('shadow_settings_tab');
      const targetTab = tabParam || savedTab;
      if (targetTab && MENU_ITEMS.some(m => m.id === targetTab)) {
        setActiveTab(targetTab);
      }
      try {
        const savedMascot = localStorage.getItem('shadow_mascot_config');
        if (savedMascot) setMascotConfig(prev => ({ ...prev, ...JSON.parse(savedMascot) }));
      } catch {}

      try {
        const savedMedia = localStorage.getItem('kagemi_media_preferences');
        if (savedMedia) setMediaPrefs(prev => ({ ...prev, ...JSON.parse(savedMedia) }));
      } catch {}

      // Calculate watchlist count & history
      try {
        const rawHistory = localStorage.getItem('shadow_continue_watching') || '[]';
        setHistoryCount(JSON.parse(rawHistory).length || 0);
      } catch {}
      try {
        const rawWl = localStorage.getItem('shadow_watchlist_v1') || '[]';
        setWatchlistCount(JSON.parse(rawWl).length || 0);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setGender(profile.gender || 'male');
      setSocialLinks(parseSocialLinks(profile.website));
      if (profile.media_preferences && typeof profile.media_preferences === 'object') {
        setMediaPrefs(prev => ({ ...prev, ...profile.media_preferences }));
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTravellerName(traveller.name);
      setTravellerAvatar(traveller.avatar);
    }
  }, [isAuthenticated, traveller.name, traveller.avatar]);

  useEffect(() => {
    const savedUser = profile?.settings?.anilist_username || localStorage.getItem('shadow_anilist_username') || '';
    const savedToken = profile?.settings?.anilist_token || localStorage.getItem('shadow_anilist_token') || '';
    if (savedUser) setAnilistUsername(savedUser);
    setHasAnilistToken(!!savedToken && isAuthenticated);
  }, [profile, isAuthenticated]);

  const changeTab = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
    playSquishyJelly(0.35);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadow_settings_tab', id);
    }
  };

  const getItemValueSnippet = (itemId: string): string => {
    switch (itemId) {
      case 'general':
        return isAuthenticated ? (username || profile?.username || 'Member') : (travellerName || traveller.name || 'Traveller');
      case 'player':
        return `${settings.defaultQuality || '1080p'} • ${settings.defaultServer || 'HD-1'}`;
      case 'mangvels':
        return `${mediaPrefs.mangvels.readingDirection === 'rtl' ? 'RTL' : mediaPrefs.mangvels.readingDirection === 'webtoon' ? 'Webtoon' : 'LTR'} • ${mediaPrefs.mangvels.readerTheme}`;
      case 'flixverse':
        return `${mediaPrefs.flixverse.defaultCinemaServer} • ${mediaPrefs.flixverse.audioTrackLanguage.toUpperCase()}`;
      case 'donghua':
        return `${mediaPrefs.donghua.audioPriority === 'mandarin' ? 'Mandarin' : 'Dub'} • ${mediaPrefs.donghua.introSkipOffset}s`;
      case 'sound':
        return SOUND_PRESETS.find(s => s.id === settings.tapSoundEffect)?.label || 'Squishy Jelly';
      case 'whisper':
        return CHARACTER_META[settings.whisperVoice]?.name || 'Fern';
      case 'mascot':
        return !mascotConfig.hidden ? (MASCOT_ROSTER.find(m => m.id === mascotConfig.characterId)?.name || 'Active') : 'Hidden';
      case 'notifications':
        return settings.newEpAlerts ? 'Enabled' : 'Muted';
      case 'integrations':
        return hasAnilistToken ? (anilistUsername || 'Synced') : 'Off';
      case 'data':
        return `${historyCount} watched`;
      case 'guide':
        return 'Docs & Specs';
      default:
        return '';
    }
  };

  const updateMediaPref = <K extends keyof MediaPreferences, F extends keyof MediaPreferences[K]>(
    category: K,
    field: F,
    value: MediaPreferences[K][F]
  ) => {
    setMediaPrefs(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value
        }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('kagemi_media_preferences', JSON.stringify(updated));
      }
      if (isAuthenticated && profile?.id) {
        supabase.from('profiles').update({
          media_preferences: updated,
          updated_at: new Date().toISOString()
        }).eq('id', profile.id).then(() => {});
      }
      return updated;
    });
    playSquishyJelly(0.2);
    toast.success('Media preference saved');
  };

  const handleSaveProfile = async () => {
    if (!isAuthenticated) {
      setIsSavingTraveller(true);
      saveTravellerProfile({ name: travellerName, avatar: travellerAvatar });
      notifyWhisper('Traveller profile saved!', 'success');
      setTimeout(() => setIsSavingTraveller(false), 500);
      return;
    }

    setIsSavingProfile(true);
    try {
      const validSocialLinks = socialLinks.filter(l => l.url && l.url.trim().length > 0);
      const serializedWebsite = validSocialLinks.length > 0 ? JSON.stringify(validSocialLinks) : '';

      const { error } = await supabase.from('profiles').update({
        username,
        bio,
        avatar_url: avatarUrl,
        gender,
        website: serializedWebsite,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (error) throw error;
      await refreshSession();
      toast.success("Adventurer Card updated successfully!");
      notifyWhisper("Profile record synchronized with the Vault.", "success");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm account eradication.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('No active operative session detected.');
      }

      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to erase account.');
      }

      // Purge client storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}

      await supabase.auth.signOut();
      if (signOut) {
        try { await signOut(); } catch (_) {}
      }

      toast.success('Your operative identity has been permanently erased.');
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passData.newPass || passData.newPass !== passData.confirmPass) {
      toast.error("Passwords do not match or are empty!");
      return;
    }
    setIsChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passData.newPass });
      if (error) throw error;
      toast.success("Security Key updated successfully!");
      setPassData({ newPass: '', confirmPass: '' });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSelectPalette = (paletteId: string) => {
    playSquishyJelly(0.35);
    applyColorPalette(paletteId);
    updateSetting('accentColor', paletteId as any);
    toast.success(`Theme switched to ${paletteId.replace(/-/g, ' ')}`);
  };

  const handleSelectFont = (fontId: string) => {
    playSquishyJelly(0.35);
    updateSetting('fontFamily', fontId as any);
    toast.success(`Font family updated`);
  };

  const handlePlayVoicePreview = (charId: string) => {
    if (activeVoiceAudioRef.current) {
      try {
        activeVoiceAudioRef.current.pause();
        activeVoiceAudioRef.current.currentTime = 0;
      } catch (_) {}
    }
    setPreviewingVoice(charId);
    try {
      const audio = playVoiceSample(charId, voiceLanguageTab);
      if (audio) {
        activeVoiceAudioRef.current = audio;
        audio.onended = () => setPreviewingVoice(null);
      } else {
        setTimeout(() => setPreviewingVoice(null), 2500);
      }
    } catch (err) {
      console.error('Failed to play voice sample:', err);
      setTimeout(() => setPreviewingVoice(null), 2500);
    }
  };

  const handleGenerateXmlBackup = () => {
    try {
      const rawWatchlist = localStorage.getItem('shadow_watchlist_v1') || '[]';
      const rawHistory = localStorage.getItem('shadow_continue_watching') || '[]';
      const rawMascot = localStorage.getItem('shadow_mascot_config') || '{}';
      const voicePack = settings.whisperVoice || 'hana';

      const cleanUsername = username || profile?.username || 'traveller';
      const dateStr = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<kagemi_backup version="2.4" timestamp="${timestamp}">\n`;
      xml += `  <metadata>\n`;
      xml += `    <app>Kagemi Shadow Garden Sanctuary</app>\n`;
      xml += `    <version>2.4</version>\n`;
      xml += `    <username>${cleanUsername.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</username>\n`;
      xml += `    <created_at>${timestamp}</created_at>\n`;
      xml += `  </metadata>\n`;
      xml += `  <modules>\n`;

      if (backupModules.library) {
        xml += `    <library>\n`;
        xml += `      <![CDATA[${rawWatchlist}]]>\n`;
        xml += `    </library>\n`;
      }

      if (backupModules.history) {
        xml += `    <history>\n`;
        xml += `      <![CDATA[${rawHistory}]]>\n`;
        xml += `    </history>\n`;
      }

      if (backupModules.settings) {
        xml += `    <settings>\n`;
        xml += `      <![CDATA[${JSON.stringify(settings)}]]>\n`;
        xml += `    </settings>\n`;
      }

      if (backupModules.companion) {
        xml += `    <companion>\n`;
        xml += `      <![CDATA[${JSON.stringify({ mascot: JSON.parse(rawMascot), voice: voicePack, volume: settings.whisperVolume })}]]>\n`;
        xml += `    </companion>\n`;
      }

      if (backupModules.profile) {
        // NOTE: Username is explicitly EXCLUDED to safeguard recipient operative's account username
        xml += `    <profile_config>\n`;
        xml += `      <bio><![CDATA[${bio || ''}]]></bio>\n`;
        xml += `      <gender>${gender || 'male'}</gender>\n`;
        xml += `      <avatar_url><![CDATA[${avatarUrl || ''}]]></avatar_url>\n`;
        xml += `      <socials><![CDATA[${JSON.stringify(socialLinks)}]]></socials>\n`;
        xml += `    </profile_config>\n`;
      }

      if (backupModules.mediaPrefs) {
        xml += `    <media_preferences>\n`;
        xml += `      <![CDATA[${JSON.stringify(mediaPrefs)}]]>\n`;
        xml += `    </media_preferences>\n`;
      }

      xml += `  </modules>\n`;
      xml += `</kagemi_backup>`;

      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kagemi_backup_${cleanUsername}_${dateStr}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsBackupModalOpen(false);
      toast.success(`Backup archive saved: kagemi_backup_${cleanUsername}_${dateStr}.xml`);
      notifyWhisper('Portable Android-style XML archive exported.', 'success');
    } catch (err: any) {
      toast.error('Failed to generate XML backup: ' + (err.message || ''));
    }
  };

  const handleFileSelectForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlStr = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'text/xml');

        if (doc.querySelector('parsererror')) {
          throw new Error('Invalid XML document syntax.');
        }

        const root = doc.querySelector('kagemi_backup');
        if (!root) {
          throw new Error('Not a valid Kagemi backup archive.');
        }

        const sourceUser = doc.querySelector('metadata > username')?.textContent || 'Operative';
        const createdAt = doc.querySelector('metadata > created_at')?.textContent || '';

        const libraryNode = doc.querySelector('modules > library');
        const historyNode = doc.querySelector('modules > history');
        const settingsNode = doc.querySelector('modules > settings');
        const companionNode = doc.querySelector('modules > companion');
        const profileNode = doc.querySelector('modules > profile_config');
        const mediaPrefsNode = doc.querySelector('modules > media_preferences');

        const parsed: any = {
          metadata: { sourceUser, createdAt },
          hasLibrary: !!libraryNode,
          hasHistory: !!historyNode,
          hasSettings: !!settingsNode,
          hasCompanion: !!companionNode,
          hasProfile: !!profileNode,
          hasMediaPrefs: !!mediaPrefsNode,
        };

        if (libraryNode) {
          try {
            parsed.library = JSON.parse(libraryNode.textContent || '[]');
          } catch {}
        }
        if (historyNode) {
          try {
            parsed.history = JSON.parse(historyNode.textContent || '[]');
          } catch {}
        }
        if (settingsNode) {
          try {
            parsed.settings = JSON.parse(settingsNode.textContent || '{}');
          } catch {}
        }
        if (companionNode) {
          try {
            parsed.companion = JSON.parse(companionNode.textContent || '{}');
          } catch {}
        }
        if (profileNode) {
          // EXCLUDING USERNAME!
          parsed.profile = {
            bio: profileNode.querySelector('bio')?.textContent || '',
            gender: profileNode.querySelector('gender')?.textContent || 'male',
            avatar_url: profileNode.querySelector('avatar_url')?.textContent || '',
            socials: []
          };
          try {
            const socialsText = profileNode.querySelector('socials')?.textContent;
            if (socialsText) parsed.profile.socials = JSON.parse(socialsText);
          } catch {}
        }
        if (mediaPrefsNode) {
          try {
            parsed.mediaPrefs = JSON.parse(mediaPrefsNode.textContent || '{}');
          } catch {}
        }

        setParsedBackupData(parsed);
        setRestoreModules({
          library: !!parsed.hasLibrary,
          history: !!parsed.hasHistory,
          settings: !!parsed.hasSettings,
          companion: !!parsed.hasCompanion,
          profile: !!parsed.hasProfile,
          mediaPrefs: !!parsed.hasMediaPrefs,
        });
        setIsRestoreModalOpen(true);
      } catch (err: any) {
        toast.error('XML parse error: ' + (err.message || 'Invalid format'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackupData) return;
    setIsRestoring(true);

    try {
      let restoredCount = 0;

      // 1. Library / Watchlist
      if (restoreModules.library && parsedBackupData.library) {
        localStorage.setItem('shadow_watchlist_v1', JSON.stringify(parsedBackupData.library));
        setWatchlistCount(parsedBackupData.library.length || 0);
        restoredCount++;
      }

      // 2. History & Progress
      if (restoreModules.history && parsedBackupData.history) {
        localStorage.setItem('shadow_continue_watching', JSON.stringify(parsedBackupData.history));
        setHistoryCount(parsedBackupData.history.length || 0);
        window.dispatchEvent(new Event('shadow_continue_watching_updated'));
        restoredCount++;
      }

      // 3. Settings
      if (restoreModules.settings && parsedBackupData.settings) {
        Object.entries(parsedBackupData.settings).forEach(([key, val]) => {
          updateSetting(key as any, val as any);
        });
        restoredCount++;
      }

      // 4. Companion
      if (restoreModules.companion && parsedBackupData.companion) {
        if (parsedBackupData.companion.mascot) {
          updateMascot(parsedBackupData.companion.mascot);
        }
        if (parsedBackupData.companion.voice) {
          updateSetting('whisperVoice', parsedBackupData.companion.voice);
        }
        if (parsedBackupData.companion.volume !== undefined) {
          updateSetting('whisperVolume', parsedBackupData.companion.volume);
        }
        restoredCount++;
      }

      // 5. Profile (EXCLUDING USERNAME!)
      if (restoreModules.profile && parsedBackupData.profile) {
        const { bio: rBio, gender: rGender, avatar_url: rAvatar, socials: rSocials } = parsedBackupData.profile;
        if (rBio !== undefined) setBio(rBio);
        if (rGender !== undefined) setGender(rGender);
        if (rAvatar !== undefined) setAvatarUrl(rAvatar);
        if (Array.isArray(rSocials)) setSocialLinks(rSocials);

        if (isAuthenticated && profile?.id) {
          await supabase.from('profiles').update({
            bio: rBio || '',
            gender: rGender || 'male',
            avatar_url: rAvatar || '',
            website: rSocials?.length ? JSON.stringify(rSocials) : '',
            updated_at: new Date().toISOString()
          }).eq('id', profile.id);
          await refreshSession();
        }
        restoredCount++;
      }

      // 6. Media Prefs
      if (restoreModules.mediaPrefs && parsedBackupData.mediaPrefs) {
        setMediaPrefs(prev => ({ ...prev, ...parsedBackupData.mediaPrefs }));
        localStorage.setItem('kagemi_media_preferences', JSON.stringify(parsedBackupData.mediaPrefs));
        if (isAuthenticated && profile?.id) {
          await supabase.from('profiles').update({
            media_preferences: parsedBackupData.mediaPrefs,
            updated_at: new Date().toISOString()
          }).eq('id', profile.id);
        }
        restoredCount++;
      }

      toast.success(`Account migration restored successfully (${restoredCount} modules)!`);
      notifyWhisper('Library and preferences synchronized from XML backup.', 'success');
      setIsRestoreModalOpen(false);
      setParsedBackupData(null);
    } catch (err: any) {
      toast.error('Restoration failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRestoring(false);
    }
  };

  const updateMascot = (patch: Partial<MascotConfig>) => {
    setMascotConfig(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('shadow_mascot_config', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('shadow_mascot_config_changed', { detail: next }));
      } catch {}
      return next;
    });
    toast.success("Pet Companion updated");
  };

  const handleClearWatchHistory = () => {
    if (typeof window === 'undefined') return;
    if (!confirm('Clear all episode progress and continue watching history? This cannot be undone.')) return;
    localStorage.removeItem('shadow_continue_watching');
    localStorage.removeItem('shadow_watch_history');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('shadow_progress_') || key.startsWith('kagemi_progress_')) {
        localStorage.removeItem(key);
      }
    });
    setHistoryCount(0);
    window.dispatchEvent(new Event('shadow_continue_watching_updated'));
    toast.success('Watch history cleared successfully.');
  };

  const handleExportWatchlist = () => {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        kagemi_export: true,
        version: "2.0",
        timestamp: new Date().toISOString(),
        watchlist: JSON.parse(localStorage.getItem('shadow_watchlist_v1') || '[]'),
        history: JSON.parse(localStorage.getItem('shadow_continue_watching') || '[]'),
        settings
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kagemi_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Watchlist Vault exported successfully!");
    } catch {
      toast.error("Failed to export vault data.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.watchlist) localStorage.setItem('shadow_watchlist_v1', JSON.stringify(json.watchlist));
        if (json.history) localStorage.setItem('shadow_continue_watching', JSON.stringify(json.history));
        window.dispatchEvent(new Event('shadow_continue_watching_updated'));
        toast.success("Vault backup restored successfully!");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error("Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // AniList Handlers
  const handleTwoWaySync = async () => {
    if (!anilistUsername) {
      toast.error('Please enter your AniList username');
      return;
    }
    setSyncActionType('two-way');
    setSyncStatusMsg('Running intelligent two-way library mirror...');
    try {
      const token = profile?.settings?.anilist_token || localStorage.getItem('shadow_anilist_token') || undefined;
      const result = await twoWaySync(profile?.id || 'guest', anilistUsername, token);
      if (result.success) {
        toast.success(result.message || 'Two-way sync complete!');
      } else {
        toast.error(result.message || 'Sync failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Sync error.');
    } finally {
      setSyncActionType(null);
      setSyncStatusMsg(null);
    }
  };

  const handlePullOverride = async () => {
    if (!anilistUsername) {
      toast.error('Please enter your AniList username');
      return;
    }
    setSyncActionType('pull-override');
    setSyncStatusMsg('Pulling complete library from AniList...');
    try {
      const result = await pullFromAniList(anilistUsername, profile?.id);
      if (result.success) {
        toast.success(`Imported ${result.totalAnime} anime and ${result.totalManga} manga from AniList!`);
      } else {
        toast.error('Pull failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Pull error.');
    } finally {
      setSyncActionType(null);
      setSyncStatusMsg(null);
    }
  };

  const currentTheme = settings.accentColor || 'sky-purple-violet';

  const renderSectionContent = () => (
    <div className="w-full min-w-0">
          {activeTab === 'general' && (
            <SectionBlock title="Adventurer Card" desc="Manage your explorer identity, username, and vault credentials.">
              {/* Profile Identity Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-8 border-b border-white/[0.06]">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary shadow-xl shadow-black/60 relative">
                      <img
                        src={isAuthenticated ? (avatarUrl || '/images/default-avatar.png') : (travellerAvatar || '/images/default-avatar.png')}
                        alt="Avatar"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold uppercase tracking-wider">
                        Change
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAvatarModalOpen(true)}
                      className="h-7 text-[10px] rounded-full border-white/10 hover:bg-white/10 font-bold"
                    >
                      Browse 170+
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const rand = getRandomAvatar();
                        if (isAuthenticated) setAvatarUrl(rand);
                        else setTravellerAvatar(rand);
                        toast.success("Random avatar selected!");
                      }}
                      className="h-7 text-[10px] rounded-full text-zinc-400 hover:text-white"
                    >
                      Random
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  {isAuthenticated ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="Username"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                            Gender Identity
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-primary outline-none cursor-pointer"
                          >
                            <option value="male" className="bg-zinc-900">Male</option>
                            <option value="female" className="bg-zinc-900">Female</option>
                            <option value="rather_not_say" className="bg-zinc-900">Rather not say</option>
                            <option value="none" className="bg-zinc-900">None</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Adventurer Bio
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={2}
                          className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-primary outline-none transition-all resize-none"
                          placeholder="Lurking in the dark, watching the abyss..."
                        />
                      </div>

                      {/* Social & Guild Links (Unified with Profile Page) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            Social & Guild Connections
                          </label>
                          {socialLinks.length < 6 && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              transition={{ type: "spring", stiffness: 450, damping: 18 }}
                              onClick={() => {
                                playSquishyJelly(0.2);
                                setSocialLinks([...socialLinks, { platform: 'instagram', url: '' }]);
                              }}
                              className="text-[11px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus size={12} strokeWidth={2.5} /> Add Link
                            </motion.button>
                          )}
                        </div>

                        {socialLinks.length === 0 ? (
                          <div className="py-4 px-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center justify-center gap-1">
                            <p className="text-xs text-zinc-400">No social links connected to your card yet.</p>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              transition={{ type: "spring", stiffness: 450, damping: 18 }}
                              onClick={() => {
                                playSquishyJelly(0.2);
                                setSocialLinks([{ platform: 'instagram', url: '' }]);
                              }}
                              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer mt-0.5"
                            >
                              <Plus size={12} strokeWidth={2.5} /> Add your first link
                            </motion.button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {socialLinks.map((link, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                <div className="w-28 sm:w-32 shrink-0">
                                  <select
                                    value={link.platform}
                                    onChange={(e) => {
                                      playGummyTap();
                                      const updated = [...socialLinks];
                                      updated[idx].platform = e.target.value as SocialPlatform;
                                      setSocialLinks(updated);
                                    }}
                                    className="w-full h-8 px-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                                  >
                                    <option value="instagram" className="bg-zinc-900">Instagram</option>
                                    <option value="twitter" className="bg-zinc-900">X / Twitter</option>
                                    <option value="discord" className="bg-zinc-900">Discord</option>
                                    <option value="youtube" className="bg-zinc-900">YouTube</option>
                                    <option value="tiktok" className="bg-zinc-900">TikTok</option>
                                    <option value="github" className="bg-zinc-900">GitHub</option>
                                    <option value="website" className="bg-zinc-900">Website</option>
                                  </select>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={link.url}
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[idx].url = e.target.value;
                                      setSocialLinks(updated);
                                    }}
                                    placeholder={
                                      link.platform === 'instagram' ? '@username' :
                                      link.platform === 'twitter' ? '@handle' :
                                      link.platform === 'discord' ? 'discord.gg/invite' :
                                      link.platform === 'youtube' ? '@channel' :
                                      link.platform === 'github' ? 'username' :
                                      link.platform === 'tiktok' ? '@handle' :
                                      'https://...'
                                    }
                                    className="w-full h-8 px-2.5 rounded-lg bg-transparent text-white text-xs placeholder:text-zinc-500 outline-none border border-transparent focus:border-white/20"
                                  />
                                </div>

                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.9 }}
                                  transition={{ type: "spring", stiffness: 450, damping: 18 }}
                                  onClick={() => {
                                    playGummyTap();
                                    setSocialLinks(socialLinks.filter((_, i) => i !== idx));
                                  }}
                                  className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 active:scale-95 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                  title="Remove link"
                                >
                                  <Trash2 size={13} />
                                </motion.button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                        You are currently in <strong>Traveller Guest Mode</strong>. Your data is stored locally in this browser. Create an account to sync progress across all your devices.
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Traveller Name
                        </label>
                        <input
                          type="text"
                          value={travellerName}
                          onChange={(e) => setTravellerName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-primary outline-none"
                          placeholder="Shadow Walker"
                        />
                      </div>
                    </div>
                  )}

                  {/* Centered Save Card Action Button */}
                  <div className="pt-3 flex justify-center">
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 450, damping: 18 }}
                      onClick={() => {
                        playSquishyJelly(0.35);
                        handleSaveProfile();
                      }}
                      disabled={isSavingProfile || isSavingTraveller}
                      className="h-10 px-8 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-colors"
                    >
                      {(isSavingProfile || isSavingTraveller) ? "Saving..." : "Save Card"}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Security & Access Section */}
              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-primary" /> Security & Privacy
                </h4>
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Display Online Presence"
                    desc="Show an online presence status indicator on your public card."
                    checked={!settings.hideOnlineStatus}
                    onChange={(v) => updateSetting('hideOnlineStatus', !v)}
                  />
                  <ToggleItem
                    title="Public Activity Stream"
                    desc="Allow other operatives to view your recent bookmarks and badges."
                    checked={settings.publicActivity}
                    onChange={(v) => updateSetting('publicActivity', v)}
                  />
                  <ToggleItem
                    title="Login Alerts"
                    desc="Notify me when a new login is detected from an unrecognized device."
                    checked={settings.loginAlerts}
                    onChange={(v) => updateSetting('loginAlerts', v)}
                  />
                  <ToggleItem
                    title="Two-Factor Verification (2FA)"
                    desc="Require a one-time authorization code on sign-in."
                    checked={settings.twoFactor}
                    onChange={(v) => updateSetting('twoFactor', v)}
                  />
                </div>
              </div>

              {/* Password Update (if authenticated) */}
              {isAuthenticated && (
                <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Key size={14} className="text-primary" /> Update Security Key
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <input
                      type="password"
                      placeholder="New Secret Key"
                      value={passData.newPass}
                      onChange={(e) => setPassData(p => ({ ...p, newPass: e.target.value }))}
                      className="h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-primary outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Key"
                      value={passData.confirmPass}
                      onChange={(e) => setPassData(p => ({ ...p, confirmPass: e.target.value }))}
                      className="h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isChangingPass || !passData.newPass}
                    className="h-9 px-5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  >
                    {isChangingPass ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              )}

              {/* Sign Out / Danger Zone */}
              <div className="pt-8 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <AlertTriangle size={14} /> Danger Zone
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut && signOut()}
                        className="h-9 rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold text-xs"
                      >
                        <LogOut size={13} className="mr-1.5" /> Sign Out
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          playSquishyJelly(0.25);
                          setIsDeleteModalOpen(true);
                          setDeleteConfirmText('');
                        }}
                        className="h-9 rounded-full border-red-600/40 text-red-500 hover:bg-red-600/15 font-bold text-xs"
                      >
                        <Trash2 size={13} className="mr-1.5" /> Delete Account
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/login')}
                      className="h-9 rounded-full border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs"
                    >
                      Sign In / Register
                    </Button>
                  )}
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'player' && (
            <SectionBlock title="Video Player & Omni Studio" desc="Calibrate playback automations, stream qualities, and subtitle styling with the live Omni player.">
              {/* Live Omni Player Calibration Canvas */}
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Live Omni Player Calibration Studio
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Live Omni engine running with adaptive controls, skip gestures, and hardware acceleration.
                  </p>
                </div>

                <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative">
                  <OmniPlayer
                    url="/videos/demo.mp4"
                    title="Omni Calibration Studio"
                    isM3U8={false}
                    autoPlay={false}
                    autoSkip={settings.autoSkipOpEd}
                    autoSkipOutro={settings.autoSkipOutro}
                  />
                </div>
              </div>

              {/* Subtitle Customization Controls */}
              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Caption Customization
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Caption Size */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Text Size
                    </label>
                    <div className="flex gap-1.5">
                      {(['small', 'medium', 'large', 'x-large'] as const).map(sz => {
                        const cur = settings.playerPrefs?.captionSize || 'medium';
                        return (
                          <button
                            key={sz}
                            onClick={() => updateSetting('playerPrefs', { ...settings.playerPrefs, captionSize: sz })}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                              cur === sz ? "bg-primary text-white" : "bg-white/[0.05] text-zinc-400 hover:text-white"
                            )}
                          >
                            {sz === 'x-large' ? 'XL' : sz[0].toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Caption Color */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Text Color
                    </label>
                    <div className="flex gap-1.5">
                      {[
                        { label: 'White', color: '#ffffff' },
                        { label: 'Gold', color: '#fbbf24' },
                        { label: 'Cyan', color: '#22d3ee' },
                        { label: 'Green', color: '#4ade80' }
                      ].map(c => {
                        const cur = settings.playerPrefs?.captionColor || '#ffffff';
                        return (
                          <button
                            key={c.color}
                            onClick={() => updateSetting('playerPrefs', { ...settings.playerPrefs, captionColor: c.color })}
                            className={cn(
                              "w-7 h-7 rounded-full border transition-transform",
                              cur === c.color ? "scale-110 border-white ring-2 ring-primary" : "border-white/20 hover:scale-105"
                            )}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Caption Background */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Background Style
                    </label>
                    <select
                      value={settings.playerPrefs?.captionBg || 'semi-black'}
                      onChange={(e) => updateSetting('playerPrefs', { ...settings.playerPrefs, captionBg: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="transparent" className="bg-zinc-900">None (Outline Only)</option>
                      <option value="semi-black" className="bg-zinc-900">Semi-Black Box</option>
                      <option value="solid-black" className="bg-zinc-900">Solid Black Box</option>
                      <option value="blur" className="bg-zinc-900">Frosted Glass Blur</option>
                    </select>
                  </div>

                  {/* Caption Font */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Subtitle Font
                    </label>
                    <select
                      value={settings.playerPrefs?.captionFont || 'sans'}
                      onChange={(e) => updateSetting('playerPrefs', { ...settings.playerPrefs, captionFont: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="sans" className="bg-zinc-900">Sans-Serif (Modern)</option>
                      <option value="serif" className="bg-zinc-900">Serif (Literary)</option>
                      <option value="mono" className="bg-zinc-900">Monospace (Terminal)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Playback Automations */}
              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Playback Automations & Flow
                </h4>
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Auto-Play Next Episode"
                    desc="Automatically advance to the next episode when current episode credits conclude."
                    checked={settings.autoNext ?? true}
                    onChange={(v) => updateSetting('autoNext', v)}
                  />
                  <ToggleItem
                    title="Auto-Skip Intro (OP)"
                    desc="Automatically jump past opening themes when skip markers are detected."
                    checked={settings.autoSkipOpEd ?? true}
                    onChange={(v) => updateSetting('autoSkipOpEd', v)}
                  />
                  <ToggleItem
                    title="Auto-Skip Outro (ED)"
                    desc="Automatically jump past ending themes straight to the post-credits preview."
                    checked={settings.autoSkipOutro ?? true}
                    onChange={(v) => updateSetting('autoSkipOutro', v)}
                  />
                  <ToggleItem
                    title="Resume Playback"
                    desc="Pick up playback exactly at your last watched timestamp."
                    checked={settings.resumePlayback ?? true}
                    onChange={(v) => updateSetting('resumePlayback', v)}
                  />
                  <ToggleItem
                    title="Mobile Tap Play/Pause"
                    desc="Tapping the player center toggles play and pause immediately."
                    checked={settings.tapPlayPauseWithControls ?? true}
                    onChange={(v) => updateSetting('tapPlayPauseWithControls', v)}
                  />
                  <ToggleItem
                    title="Theater Dim Mode"
                    desc="Dim surrounding page lights when video player is active."
                    checked={settings.dimMode ?? false}
                    onChange={(v) => updateSetting('dimMode', v)}
                  />
                </div>
              </div>

              {/* Stream Defaults */}
              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Default Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Preferred Audio Track
                    </label>
                    <select
                      value={settings.defaultAudio || 'jp'}
                      onChange={(e) => updateSetting('defaultAudio', e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="jp" className="bg-zinc-900">Japanese (Original Sub)</option>
                      <option value="en" className="bg-zinc-900">English (Dub)</option>
                      <option value="hi" className="bg-zinc-900">Hindi (Official Dub)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Target Resolution
                    </label>
                    <select
                      value={settings.defaultQuality || '1080p'}
                      onChange={(e) => updateSetting('defaultQuality', e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="1080p" className="bg-zinc-900">1080p Full HD</option>
                      <option value="720p" className="bg-zinc-900">720p HD</option>
                      <option value="480p" className="bg-zinc-900">480p SD</option>
                      <option value="Auto" className="bg-zinc-900">Adaptive (Auto)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Primary Server
                    </label>
                    <select
                      value={settings.defaultServer || 'hd-1'}
                      onChange={(e) => updateSetting('defaultServer', e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="hd-1" className="bg-zinc-900">MegaCloud (HD-1)</option>
                      <option value="hd-2" className="bg-zinc-900">Vidcloud (HD-2)</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'mangvels' && (
            <SectionBlock title="Mangvels & Novels Studio" desc="Configure manga reading orientation, chapter caching, and display themes.">
              {/* Reading Direction & Mode */}
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Reading Mode & Orientation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'webtoon', label: 'Vertical Webtoon', desc: 'Continuous vertical scroll for Manhwa and Webtoons' },
                    { id: 'rtl', label: 'Right-to-Left (RTL)', desc: 'Standard Japanese manga format, flips right to left' },
                    { id: 'ltr', label: 'Left-to-Right (LTR)', desc: 'Western comic book orientation, flips left to right' },
                  ].map((mode) => {
                    const isSelected = mediaPrefs.mangvels.readingDirection === mode.id;
                    return (
                      <motion.button
                        key={mode.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateMediaPref('mangvels', 'readingDirection', mode.id as any)}
                        className={cn(
                          "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-zinc-400"
                        )}
                      >
                        <span className="text-xs font-bold text-white">{mode.label}</span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{mode.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Reader Theme & Appearance */}
              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Reader Theme Palette
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'oled-black', label: 'OLED Pure Black', bg: '#000000', text: '#ffffff' },
                    { id: 'dark-slate', label: 'Deep Slate', bg: '#0f172a', text: '#cbd5e1' },
                    { id: 'sepia', label: 'Warm Sepia', bg: '#fbf0d9', text: '#5f4b32' },
                    { id: 'paper', label: 'Soft Paper', bg: '#f4f4f0', text: '#18181b' },
                  ].map((theme) => {
                    const isSelected = mediaPrefs.mangvels.readerTheme === theme.id;
                    return (
                      <motion.button
                        key={theme.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateMediaPref('mangvels', 'readerTheme', theme.id as any)}
                        className={cn(
                          "p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer",
                          isSelected ? "border-primary ring-1 ring-primary" : "border-white/10 hover:border-white/20"
                        )}
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: theme.text }} />
                        <span className="text-xs font-bold truncate" style={{ color: theme.text }}>{theme.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Performance & Layout Toggles */}
              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Preload & Hardware Controls
                </h4>
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Volume Rocker Page Turn"
                    desc="Use device physical volume buttons to turn manga pages on mobile and tablet."
                    checked={mediaPrefs.mangvels.volumePageTurn}
                    onChange={(v) => updateMediaPref('mangvels', 'volumePageTurn', v)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Chapter Memory Preloading
                    </label>
                    <select
                      value={mediaPrefs.mangvels.preloadChapters}
                      onChange={(e) => updateMediaPref('mangvels', 'preloadChapters', parseInt(e.target.value))}
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-zinc-900">1 Chapter in Advance</option>
                      <option value={3} className="bg-zinc-900">3 Chapters (Recommended)</option>
                      <option value={5} className="bg-zinc-900">5 Chapters (Fastest Scroll)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Image Quality Profile
                    </label>
                    <select
                      value={mediaPrefs.mangvels.imageQuality}
                      onChange={(e) => updateMediaPref('mangvels', 'imageQuality', e.target.value as any)}
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="original" className="bg-zinc-900">Original (Lossless Clarity)</option>
                      <option value="compressed" className="bg-zinc-900">Adaptive WebP (Balanced)</option>
                      <option value="data-saver" className="bg-zinc-900">Data Saver (Metered Mobile)</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'flixverse' && (
            <SectionBlock title="Flixverse & Cinema" desc="Tune high-bandwidth streaming pipes, surround audio virtualization, and cinema presets.">
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Cinema Stream Architecture
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'auto', label: 'Multi-CDN Auto', desc: 'Fastest latency route selected automatically per session' },
                    { id: 'vip-stream', label: 'VIP Stream Direct', desc: 'High-bitrate unthrottled pipe for 4K and 1080p movies' },
                    { id: 'p2p-mirror', label: 'Edge Global Mirror', desc: 'Decentralized caching mirror with failover redundancy' },
                  ].map((server) => {
                    const isSelected = mediaPrefs.flixverse.defaultCinemaServer === server.id;
                    return (
                      <motion.button
                        key={server.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateMediaPref('flixverse', 'defaultCinemaServer', server.id)}
                        className={cn(
                          "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-zinc-400"
                        )}
                      >
                        <span className="text-xs font-bold text-white">{server.label}</span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{server.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Cinema Audio & Aspect Ratio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Default Audio Language
                    </label>
                    <select
                      value={mediaPrefs.flixverse.audioTrackLanguage}
                      onChange={(e) => updateMediaPref('flixverse', 'audioTrackLanguage', e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="en" className="bg-zinc-900">English (Original / Dub)</option>
                      <option value="hi" className="bg-zinc-900">Hindi (Cinematic Dub)</option>
                      <option value="es" className="bg-zinc-900">Spanish (Español)</option>
                      <option value="fr" className="bg-zinc-900">French (Français)</option>
                      <option value="multi" className="bg-zinc-900">Multi-Audio (Prompt per Film)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Display Aspect Ratio
                    </label>
                    <select
                      value={mediaPrefs.flixverse.aspectRatio}
                      onChange={(e) => updateMediaPref('flixverse', 'aspectRatio', e.target.value as any)}
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="16:9" className="bg-zinc-900">16:9 Standard Television</option>
                      <option value="21:9" className="bg-zinc-900">21:9 Ultrawide CinemaScope</option>
                      <option value="fill" className="bg-zinc-900">Fill Screen (Crop Black Bars)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Playback Automations
                </h4>
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Ambient Theater Lighting"
                    desc="Project soft reactive luminous aura around the video stage."
                    checked={mediaPrefs.flixverse.ambientTheaterMode}
                    onChange={(v) => updateMediaPref('flixverse', 'ambientTheaterMode', v)}
                  />
                  <ToggleItem
                    title="Auto-Skip Studio Logos & Recaps"
                    desc="Automatically skip past introductory production cards and previous episode summaries."
                    checked={mediaPrefs.flixverse.autoSkipRecap}
                    onChange={(v) => updateMediaPref('flixverse', 'autoSkipRecap', v)}
                  />
                  <ToggleItem
                    title="Dolby 5.1 Virtualization"
                    desc="Simulate multi-channel spatial audio field when using standard stereo headphones."
                    checked={mediaPrefs.flixverse.surroundSound}
                    onChange={(v) => updateMediaPref('flixverse', 'surroundSound', v)}
                  />
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'donghua' && (
            <SectionBlock title="Donghua Sanctuary" desc="Dedicated Chinese animation playback controls, Mandarin voice priority, and Hanzi/Pinyin subtitle layers.">
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Voice Track Priority
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'mandarin', label: 'Mandarin Chinese (Original)', desc: 'Original voice acting for authentic cultivation and wuxia experience' },
                    { id: 'english', label: 'English Dub Priority', desc: 'English localized voice track when available from studio' },
                    { id: 'hindi', label: 'Hindi Dub Priority', desc: 'Hindi localized voice track when available from studio' },
                  ].map((track) => {
                    const isSelected = mediaPrefs.donghua.audioPriority === track.id;
                    return (
                      <motion.button
                        key={track.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateMediaPref('donghua', 'audioPriority', track.id as any)}
                        className={cn(
                          "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-zinc-400"
                        )}
                      >
                        <span className="text-xs font-bold text-white">{track.label}</span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{track.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Donghua Subtitle Layers
                </h4>
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Dual Subtitles (Hanzi + English)"
                    desc="Display simplified Chinese Hanzi characters above English translated captions."
                    checked={mediaPrefs.donghua.hanziSubtitles}
                    onChange={(v) => updateMediaPref('donghua', 'hanziSubtitles', v)}
                  />
                  <ToggleItem
                    title="Pinyin Pronunciation Overlay"
                    desc="Include romanized phonetic pinyin spelling above Chinese cultivation martial arts techniques."
                    checked={mediaPrefs.donghua.pinyinGuide}
                    onChange={(v) => updateMediaPref('donghua', 'pinyinGuide', v)}
                  />
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Opening Jump Offset
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Cultivation Intro Skip Offset
                    </label>
                    <select
                      value={mediaPrefs.donghua.introSkipOffset}
                      onChange={(e) => updateMediaPref('donghua', 'introSkipOffset', parseInt(e.target.value))}
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value={90} className="bg-zinc-900">90 Seconds (Standard Donghua Opening)</option>
                      <option value={100} className="bg-zinc-900">100 Seconds (Extended Theme)</option>
                      <option value={120} className="bg-zinc-900">120 Seconds (Full Recap + Song)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Edge Network Pipe
                    </label>
                    <select
                      value={mediaPrefs.donghua.serverRegion}
                      onChange={(e) => updateMediaPref('donghua', 'serverRegion', e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="asia-pacific" className="bg-zinc-900">Asia-Pacific Direct Edge (Lowest Latency)</option>
                      <option value="global-cdn" className="bg-zinc-900">Global Cloud CDN</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'whisper' && (
            <SectionBlock title="Telepathy & Voice Packs" desc="Choose your personal companion spirit, listen to preview greetings, and calibrate volume.">
              {/* Telepathy Controls */}
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Enable Telepathy System"
                    desc="Receive spoken whispers, greetings, and mission alerts from your active companion."
                    checked={settings.whisperEnabled ?? true}
                    onChange={(v) => updateSetting('whisperEnabled', v)}
                  />
                </div>

                <div className="pt-2 max-w-md">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-2">
                    <span>Telepathy Volume</span>
                    <span className="font-mono text-primary">{Math.round((settings.whisperVolume ?? 0.8) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.whisperVolume ?? 0.8}
                    onChange={(e) => updateSetting('whisperVolume', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Companion Roster */}
              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                      Companion Roster (16 Voice Personas)
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Select your companion and click to preview their voice.
                    </p>
                  </div>

                  {/* Language Switcher */}
                  <div className="flex items-center p-1 rounded-full bg-white/[0.05] border border-white/10">
                    <button
                      onClick={() => setVoiceLanguageTab('en')}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all",
                        voiceLanguageTab === 'en' ? "bg-primary text-white" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setVoiceLanguageTab('jp')}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all",
                        voiceLanguageTab === 'jp' ? "bg-primary text-white" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      Japanese
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(CHARACTER_META).map((char) => {
                    const isSelected = (settings.whisperVoice || 'alpha').toLowerCase() === char.id;
                    const isPreviewing = previewingVoice === char.id;
                    return (
                      <div
                        key={char.id}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative group",
                          isSelected
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{char.name}</h5>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{char.title}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                          <Button
                            size="sm"
                            onClick={() => {
                              updateSetting('whisperVoice', char.id);
                              toast.success(`${char.name} is now your active companion`);
                            }}
                            className={cn(
                              "flex-1 h-7 text-[10px] rounded-lg font-bold uppercase transition-all shadow-none",
                              isSelected ? "bg-primary text-white" : "bg-white/[0.05] text-zinc-300 hover:bg-white/10"
                            )}
                          >
                            {isSelected ? "Active" : "Select"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePlayVoicePreview(char.id)}
                            className="h-7 px-2.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 shrink-0 text-[10px] font-bold uppercase tracking-wider"
                            title="Preview Voice"
                          >
                            {isPreviewing ? "Playing..." : "Preview"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'mascot' && (
            <SectionBlock title="Pet Companion" desc="Configure your interactive pet on the Whisper Island, customize its reactions and appearance.">
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Perch on Search Bar"
                    desc="Allow your mascot companion to sit atop the search bar island."
                    checked={!mascotConfig.hidden}
                    onChange={(v) => updateMascot({ hidden: !v })}
                  />
                  <ToggleItem
                    title="Tap Sound Effects"
                    desc="Play cute reactions and voices when the mascot is clicked or tapped."
                    checked={mascotConfig.soundEnabled}
                    onChange={(v) => updateMascot({ soundEnabled: v })}
                  />
                </div>
              </div>

              {/* Character Selection */}
              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Select Mascot Character
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {MASCOT_ROSTER.map((char) => {
                    const isSelected = mascotConfig.characterId === char.id;
                    return (
                      <button
                        key={char.id}
                        onClick={() => updateMascot({ characterId: char.id })}
                        className={cn(
                          "p-3 rounded-2xl text-center border transition-all flex flex-col items-center gap-2",
                          isSelected
                            ? "bg-white/[0.08] border-primary shadow-md ring-1 ring-primary"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-black/40 text-2xl">
                          {char.icon}
                        </div>
                        <span className="text-xs font-bold text-white truncate w-full">{char.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Art Style */}
              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Visual Art Style
                </h4>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = mascotConfig.styleId === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => updateMascot({ styleId: style.id })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white"
                        )}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'sound' && (
            <SectionBlock title="Sound & Haptics" desc="Choose tactile sound effects for clicks, sliders, and navigation taps.">
              {/* Browser Audio Permission Checker & Activation */}
              <div className="pb-6 border-b border-white/[0.06]">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      audioPermission === 'granted'
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    )}>
                      {audioPermission === 'granted' ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-white">Browser Sound Permission</h5>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          audioPermission === 'granted' ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                        )}>
                          {audioPermission === 'granted' ? 'Allowed' : 'Awaiting Interaction'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {audioPermission === 'granted'
                          ? "Web Audio engine is active and permitted by browser autoplay policy."
                          : "Browsers require initial user interaction before allowing synthesized audio feedback."}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 450, damping: 18 }}
                    onClick={requestAndTestSoundPermission}
                    disabled={isCheckingAudio}
                    className="h-8 px-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    {isCheckingAudio ? "Testing..." : (audioPermission === 'granted' ? "Test Audio Output" : "Grant Sound Permission")}
                  </motion.button>
                </div>
              </div>

              <div className="pt-6 pb-8 border-b border-white/[0.06] space-y-4">
                <div className="divide-y divide-white/[0.04]">
                  <ToggleItem
                    title="Master Tap Sounds"
                    desc="Auditory feedback for button presses, tabs, and toggles across Kagemi."
                    checked={settings.tapSound ?? true}
                    onChange={(v) => updateSetting('tapSound', v)}
                  />
                  <ToggleItem
                    title="Haptic Vibrations (Mobile)"
                    desc="Subtle haptic motor impulses on touch interactions."
                    checked={settings.haptics ?? true}
                    onChange={(v) => updateSetting('haptics', v)}
                  />
                </div>

                <div className="pt-2 max-w-md">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-2">
                    <span>Tap Sound Volume</span>
                    <span className="font-mono text-primary">{Math.round((settings.tapSoundVolume ?? 0.35) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.tapSoundVolume ?? 0.35}
                    onChange={(e) => updateSetting('tapSoundVolume', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Sound Presets */}
              <div className="pt-8 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Audio Feedback Profiles (Click to test)
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Click any preset to hear its synthesized acoustic signature.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {SOUND_PRESETS.map((preset) => {
                    const isSelected = (settings.tapSoundEffect || 'jelly') === preset.id;
                    return (
                      <motion.button
                        key={preset.id}
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 450, damping: 18 }}
                        onClick={() => {
                          updateSetting('tapSoundEffect', preset.id as any);
                          playTapSound(preset.id as any);
                        }}
                        className={cn(
                          "p-4 rounded-2xl text-left border transition-all flex flex-col gap-1.5 relative group",
                          isSelected
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">{preset.label}</span>
                          <Volume2 size={14} className={isSelected ? "text-primary" : "text-zinc-500 group-hover:text-white"} />
                        </div>
                        <p className="text-[10px] text-zinc-400">{preset.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'notifications' && (
            <SectionBlock title="Missives & Alerts" desc="Configure alert channels for new episode releases, community activity, and system notices.">
              <div className="divide-y divide-white/[0.04]">
                <ToggleItem
                  title="Push Notifications"
                  desc="Browser notifications for new episode uploads and direct mentions."
                  checked={settings.pushNotifs}
                  onChange={(v) => {
                    updateSetting('pushNotifs', v);
                    if (v && typeof window !== 'undefined' && 'Notification' in window) {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          new Notification('Kagemi', { body: 'Push alerts initialized successfully!', icon: '/icon.png' });
                        }
                      });
                    }
                  }}
                />
                <ToggleItem
                  title="Episode Airing Releases"
                  desc="Instant notice when an anime on your watchlist drops a new episode."
                  checked={settings.newEpAlerts}
                  onChange={(v) => updateSetting('newEpAlerts', v)}
                />
                <ToggleItem
                  title="Guild & Social Activity"
                  desc="Alerts for replies, room invites, and community interactions."
                  checked={settings.communityAlerts}
                  onChange={(v) => updateSetting('communityAlerts', v)}
                />
                <ToggleItem
                  title="Email Weekly Digest"
                  desc="A curated weekend summary of top rated releases and recommendations."
                  checked={settings.emailNotifs}
                  onChange={(v) => updateSetting('emailNotifs', v)}
                />
                <ToggleItem
                  title="System Broadcasts"
                  desc="Important guild news, maintenance schedules, and server status."
                  checked={settings.systemAlerts}
                  onChange={(v) => updateSetting('systemAlerts', v)}
                />
              </div>
            </SectionBlock>
          )}

          {activeTab === 'integrations' && (
            <SectionBlock title="AniList & Cloud Sync" desc="Connect your AniList account to mirror episode progress and watch status in real time.">
              {/* AniList Connection */}
              <div className="pb-8 border-b border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#02A9FF]/10 text-[#02A9FF] border border-[#02A9FF]/20 flex items-center justify-center">
                      <PuffedAnilist size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">AniList Account Link</h4>
                      <p className="text-[11px] text-zinc-500">
                        {hasAnilistToken ? `Linked as @${anilistUsername}` : 'Connect your account to enable cloud library sync.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {hasAnilistToken ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Connected
                      </span>
                    ) : (
                      <Link
                        href="/settings/anilist"
                        className="h-8 px-4 rounded-full bg-[#02A9FF] hover:bg-[#02A9FF]/90 text-white text-xs font-bold inline-flex items-center shadow-md shadow-[#02A9FF]/20"
                      >
                        Connect AniList
                      </Link>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <ToggleItem
                    title="Auto-Sync Library"
                    desc="Automatically update AniList watch counts whenever you complete an episode."
                    checked={settings.autoSyncAnilist ?? true}
                    onChange={(v) => updateSetting('autoSyncAnilist', v)}
                  />
                </div>
              </div>

              {/* Sync Protocols */}
              <div className="pt-8 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Sync & Override Actions
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Manual actions to synchronize or align your Kagemi Vault with AniList.
                  </p>
                </div>

                {syncStatusMsg && (
                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-zinc-300 flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    <span>{syncStatusMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-white mb-1">Two-Way Smart Sync</h5>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Merges newer progress from both AniList and Kagemi without losing data.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={!!syncActionType}
                      onClick={handleTwoWaySync}
                      className="w-full h-8 rounded-lg bg-primary text-white text-xs font-bold"
                    >
                      {syncActionType === 'two-way' ? 'Syncing...' : 'Run 2-Way Sync'}
                    </Button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-white mb-1">Pull & Override Vault</h5>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Replaces local Kagemi watch counts with your current AniList records.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!syncActionType}
                      onClick={handlePullOverride}
                      className="w-full h-8 rounded-lg border-white/10 text-xs font-bold hover:bg-white/10"
                    >
                      {syncActionType === 'pull-override' ? 'Pulling...' : 'Override Vault'}
                    </Button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-white mb-1">Push & Override AniList</h5>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Pushes Kagemi progress up to AniList, overwriting remote counts.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!syncActionType || !isAuthenticated}
                      className="w-full h-8 rounded-lg border-white/10 text-xs font-bold hover:bg-white/10"
                    >
                      Push to AniList
                    </Button>
                  </div>
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'data' && (
            <SectionBlock title="Archive & Storage" desc="Inspect local browser storage, export vault backups, or clear watch history markers.">
              {/* Storage Meter Stats */}
              <div className="pb-8 border-b border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Browser Cache</span>
                    <div className="text-xl font-black text-white mt-1 font-mono">{storageUsage || "32 KB"}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearCache}
                    className="h-7 text-[10px] rounded-full border-white/10 hover:bg-white/10"
                  >
                    Purge
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Watchlist Titles</span>
                  <div className="text-xl font-black text-white mt-1 font-mono">{watchlistCount}</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">History Episodes</span>
                  <div className="text-xl font-black text-white mt-1 font-mono">{historyCount}</div>
                </div>
              </div>

              {/* Import / Export Library & Account Migration (Android-style XML) */}
              <div className="pt-8 pb-8 border-b border-white/[0.06] space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Import / Export Library & Account Migration
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Android-style portable XML archive. Backup or restore your watchlist, continue watching milestones, settings, companions, and profile.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => {
                      playSquishyJelly(0.25);
                      setIsBackupModalOpen(true);
                    }}
                    className="h-10 px-5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <FileDown size={14} className="mr-2" /> Create XML Backup
                  </Button>

                  <label className="h-10 px-5 rounded-full bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 text-xs font-bold inline-flex items-center cursor-pointer transition-colors">
                    <FileUp size={14} className="mr-2" /> Restore from XML
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleFileSelectForRestore}
                      className="hidden"
                    />
                  </label>

                  <Button
                    variant="ghost"
                    onClick={handleExportWatchlist}
                    className="h-10 px-4 rounded-full text-zinc-400 hover:text-white text-xs font-medium"
                  >
                    Legacy JSON Export
                  </Button>
                </div>
              </div>

              {/* Reset Zone */}
              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <AlertTriangle size={14} /> Clear Zone
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div>
                      <h5 className="text-xs font-bold text-white">Clear Watch History</h5>
                      <p className="text-[10px] text-zinc-500">Remove all continue watching markers and episode progress stamps.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearWatchHistory}
                      className="h-8 rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold"
                    >
                      Clear History
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div>
                      <h5 className="text-xs font-bold text-white">Factory Reset Settings</h5>
                      <p className="text-[10px] text-zinc-500">Restore all player, appearance, and audio settings to default configuration.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Reset all settings to default configuration?')) {
                          resetSettings();
                        }
                      }}
                      className="h-8 rounded-full text-xs font-bold"
                    >
                      Reset All
                    </Button>
                  </div>
                </div>
              </div>
            </SectionBlock>
          )}

          {activeTab === 'guide' && (
            <SectionBlock title="Sanctuary Manual & Documentation" desc="Comprehensive guide for every setting, automation, and engine option across Kagemi.">
              {/* Search & Category Filter Toolbar */}
              <div className="pb-6 border-b border-white/[0.06] space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={guideQuery}
                    onChange={(e) => setGuideQuery(e.target.value)}
                    placeholder="Search options, skip markers, telepathy, audio profiles..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 outline-none focus:border-primary transition-all"
                  />
                  {guideQuery && (
                    <button
                      onClick={() => setGuideQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: 'all', label: 'All Manuals' },
                    { id: 'identity', label: 'Identity & Card' },
                    { id: 'playback', label: 'Omni Playback' },
                    { id: 'sound', label: 'Sound & Haptics' },
                    { id: 'telepathy', label: 'Telepathy' },
                    { id: 'mascot', label: 'Pet Companion' },
                    { id: 'mangvels', label: 'Mangvels' },
                    { id: 'flixverse', label: 'Flixverse' },
                    { id: 'donghua', label: 'Donghua' },
                    { id: 'system', label: 'Sync & Backup' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setGuideCategory(cat.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                        guideCategory === cat.id
                          ? "bg-primary text-white"
                          : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guide Item Cards */}
              <div className="pt-6 space-y-3">
                {SITE_GUIDES.filter((g) => {
                  const matchesCat = guideCategory === 'all' || g.category === guideCategory;
                  const matchesQuery = !guideQuery || 
                    g.title.toLowerCase().includes(guideQuery.toLowerCase()) || 
                    g.desc.toLowerCase().includes(guideQuery.toLowerCase()) || 
                    g.proTip.toLowerCase().includes(guideQuery.toLowerCase());
                  return matchesCat && matchesQuery;
                }).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.title}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/10">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Default: <span className="text-zinc-300 font-medium">{item.defaultValue}</span>
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>

                    <div className="pt-1.5 flex items-start gap-1.5 text-[11px] text-primary/90 font-medium">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1 rounded bg-primary/10 border border-primary/20 shrink-0 mt-0.5">Tip</span>
                      <span>{item.proTip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}
    </div>
  );

  if (!mounted) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <RefreshCw size={24} className="animate-spin text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest">Initializing Core...</span>
        </div>
      </div>
    );
  }

  const currentMenuItem = MENU_ITEMS.find(m => m.id === activeTab) || MENU_ITEMS[0];
  const CurrentIcon = currentMenuItem.icon;

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 md:py-6 text-white min-h-screen">
      {/* ── MOBILE EXPERIENCE (< md): Permanent Top-Left Menu & Section Navigation ── */}
      <div className="block md:hidden w-full mb-6">
        {/* Sticky Compact Top-Left Toolbar Bar (2D Monet UI, Unboxed) */}
        <div className="sticky top-14 z-30 -mx-2 px-3 py-1.5 bg-[#070b14]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between gap-2 mb-3">
          <motion.button
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            onClick={() => {
              playSquishyJelly(0.3);
              setIsMobileMenuOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Open Settings Menu"
          >
            <Menu size={16} className="text-primary shrink-0" />
            <span className="font-lemon text-[11px] tracking-wide">Sections</span>
          </motion.button>

          <div className="flex items-center gap-1.5 pr-1 min-w-0">
            <CurrentIcon size={12} className="text-zinc-400 shrink-0" />
            <span className="text-[11px] font-bold text-white/90 truncate max-w-[170px]">
              {currentMenuItem.label}
            </span>
          </div>
        </div>

        {/* Mobile Direct Section Content */}
        <div className="w-full">
          {renderSectionContent()}
        </div>
      </div>

      {/* ── TABLET & DESKTOP EXPERIENCE (>= md): Master-Detail Split View (Locked Position & Collapsible) ── */}
      <div className="hidden md:flex w-full gap-6 lg:gap-8 items-start">
        {/* Navigation Sidebar (Individually Scrollable, Locked Position, Collapsible with Door Icon) */}
        <motion.aside
          layout
          initial={false}
          animate={{ width: isSidebarCollapsed ? 76 : 288 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className={cn(
            "shrink-0 sticky top-20 max-h-[calc(100vh-theme(spacing.24))] overflow-y-auto overscroll-contain no-scrollbar rounded-2xl bg-[#090d16]/85 border border-white/[0.08] p-3 backdrop-blur-md space-y-3 select-none transition-all",
            isSidebarCollapsed && "px-2 py-3"
          )}
        >
          {/* Settings Header with Door Collapse / Expand Toggle */}
          <div className={cn(
            "pb-3 border-b border-white/[0.06] flex items-center transition-all",
            isSidebarCollapsed ? "justify-center px-0 pt-0.5" : "justify-between px-2 pt-1"
          )}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <SlidersHorizontal size={18} className="text-primary shrink-0" />
                <span className="text-sm font-black uppercase tracking-wider text-white font-lemon truncate">Settings</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.06] text-zinc-400 uppercase">v2.4</span>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              onClick={toggleSidebarCollapsed}
              className={cn(
                "p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0 flex items-center justify-center",
                isSidebarCollapsed && "w-10 h-10 bg-white/[0.04] text-primary"
              )}
              title={isSidebarCollapsed ? "Expand sidebar (Open gate)" : "Collapse sidebar (Close gate)"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <DoorOpen size={20} className="text-primary" />
              ) : (
                <DoorClosed size={17} />
              )}
            </motion.button>
          </div>

          {/* Grouped Sidebar Items */}
          <div className="space-y-3.5">
            {MENU_GROUPS.map((group) => {
              const groupItems = MENU_ITEMS.filter((item) => item.group === group.id);
              return (
                <div key={group.id} className="space-y-1">
                  {!isSidebarCollapsed ? (
                    <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {group.title}
                    </div>
                  ) : (
                    <div className="w-6 h-px bg-white/[0.06] mx-auto my-2" />
                  )}
                  <nav className="flex flex-col gap-0.5">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const valueSnippet = getItemValueSnippet(item.id);
                      return (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.92 }}
                          whileHover={{ scale: 1.04 }}
                          transition={{ type: "spring", stiffness: 450, damping: 18 }}
                          onClick={() => changeTab(item.id)}
                          title={isSidebarCollapsed ? `${item.label} (${group.title})` : undefined}
                          className={cn(
                            "flex items-center rounded-xl text-left text-xs font-semibold transition-all group relative cursor-pointer",
                            isSidebarCollapsed 
                              ? "w-10 h-10 mx-auto justify-center p-0" 
                              : "w-full justify-between px-2.5 py-2",
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                          )}
                        >
                          <div className={cn("flex items-center min-w-0", isSidebarCollapsed ? "justify-center" : "gap-2.5")}>
                            <div className={cn(
                              "w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                              isActive ? "bg-white/20 text-white" : cn("bg-gradient-to-br text-white", item.gradient)
                            )}>
                              <Icon size={13} />
                            </div>
                            {!isSidebarCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>
                          {!isSidebarCollapsed && valueSnippet && !isActive && (
                            <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[75px] text-right">
                              {valueSnippet}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>
        </motion.aside>

        {/* Master-Detail Active Section Content */}
        <main className="flex-1 w-full min-w-0">
          {renderSectionContent()}
        </main>
      </div>

      {/* Mobile OtakuVerse-Style Slide-Out Drawer Menu (2D Monet UI) */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[20000] flex bg-black/85 backdrop-blur-xl md:hidden">
              {/* Backdrop dismiss */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Side Panel Drawer */}
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="w-80 max-w-[85vw] bg-[#0c101c] border-r border-white/15 h-full p-5 flex flex-col justify-between relative z-10 rounded-r-[2rem] overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-4">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-primary/20 border border-primary/30 rounded-xl text-primary">
                        <SlidersHorizontal size={18} />
                      </div>
                      <div>
                        <span className="font-black text-sm text-white uppercase tracking-wider block font-lemon leading-tight">
                          Settings
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Core v2.4</span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        playSquishyJelly(0.25);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      aria-label="Close Menu"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>

                  {/* Categorized Menu Groups */}
                  <div className="space-y-4 pt-1">
                    {MENU_GROUPS.map((group) => {
                      const groupItems = MENU_ITEMS.filter((item) => item.group === group.id);
                      return (
                        <div key={group.id} className="space-y-1">
                          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {group.title}
                          </div>
                          <div className="space-y-0.5">
                            {groupItems.map((item) => {
                              const Icon = item.icon;
                              const isActive = activeTab === item.id;
                              const valueSnippet = getItemValueSnippet(item.id);
                              return (
                                <motion.button
                                  key={item.id}
                                  whileTap={{ scale: 0.95 }}
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ type: "spring", stiffness: 450, damping: 18 }}
                                  onClick={() => {
                                    playSquishyJelly(0.3);
                                    changeTab(item.id);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all",
                                    isActive
                                      ? "bg-primary text-white"
                                      : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={cn(
                                      "w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0",
                                      isActive ? "bg-white/20 text-white" : cn("bg-gradient-to-br text-white", item.gradient)
                                    )}>
                                      <Icon size={13} />
                                    </div>
                                    <span className="truncate">{item.label}</span>
                                  </div>
                                  {valueSnippet && !isActive && (
                                    <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[85px] text-right">
                                      {valueSnippet}
                                    </span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer branding */}
                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                    Shadow Garden Sanctuary
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Account Deletion Confirmation Modal (2D Monet UI) */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="w-full max-w-md rounded-2xl bg-[#0d111d] border border-red-500/30 p-6 space-y-5 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Operative Account</h3>
                  <p className="text-xs text-red-400/90 font-medium">Irreversible vault purge</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Warning: Erasing your operative identity is permanent. All your bookmarked anime, watch progress stamps, account credentials, and comments will be completely destroyed.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Type <span className="text-red-400 font-mono font-black">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-red-500/30 text-white text-sm focus:border-red-500 outline-none font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingAccount}
                  className="h-9 px-4 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="h-9 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-40"
                >
                  {isDeletingAccount ? "Purging Vault..." : "Erase Identity"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* XML Backup Modal (Android-style Granular Module Selection) */}
      <AnimatePresence>
        {isBackupModalOpen && (
          <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="w-full max-w-lg rounded-2xl bg-[#0d111d] border border-white/10 p-6 space-y-5 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <FileDown size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Create Portable XML Backup</h3>
                    <p className="text-[11px] text-zinc-400">Android-style granular archive</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBackupModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">File:</span>
                <span className="text-primary truncate max-w-[280px]">
                  kagemi_backup_{username || travellerName || 'user'}_{new Date().toISOString().split('T')[0]}.xml
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                  <span>Select Modules to Package</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBackupModules({ library: true, history: true, settings: true, companion: true, profile: true, mediaPrefs: true })}
                      className="text-primary hover:underline"
                    >
                      All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setBackupModules({ library: false, history: false, settings: false, companion: false, profile: false, mediaPrefs: false })}
                      className="text-zinc-400 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.04] rounded-xl bg-white/[0.02] border border-white/[0.06] p-2">
                  {[
                    { id: 'library', label: 'Watchlist & Library', desc: `${watchlistCount} bookmarked titles & scores` },
                    { id: 'history', label: 'Continue Watching & History', desc: `${historyCount} episode progress markers` },
                    { id: 'settings', label: 'Core Preferences & Video Studio', desc: 'Audio profiles, caption styles, automations' },
                    { id: 'companion', label: 'Pet Companion & Telepathy Spirit', desc: 'Active mascot perch, voice pack & volume' },
                    { id: 'profile', label: 'Profile Configurations', desc: 'Bio, avatar, gender, socials (Username excluded)' },
                    { id: 'mediaPrefs', label: 'Media Preferences', desc: 'Mangvels reader, Flixverse cinema, Donghua' },
                  ].map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="pr-3 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{mod.label}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{mod.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={(backupModules as any)[mod.id]}
                        onChange={(e) => setBackupModules({ ...backupModules, [mod.id]: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary accent-primary cursor-pointer shrink-0"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="h-9 px-4 rounded-full text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateXmlBackup}
                  className="h-9 px-6 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md"
                >
                  Download XML Backup
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* XML Restore Modal (Android-style Granular Restoration) */}
      <AnimatePresence>
        {isRestoreModalOpen && parsedBackupData && (
          <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="w-full max-w-lg rounded-2xl bg-[#0d111d] border border-white/10 p-6 space-y-5 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Restore from XML Archive</h3>
                    <p className="text-[11px] text-zinc-400">
                      From operative @{parsedBackupData.metadata.sourceUser || 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsRestoreModalOpen(false);
                    setParsedBackupData(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                Account Protection: Your current username (<strong>@{username || travellerName || 'user'}</strong>) will remain untouched during this restoration.
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1 block">
                  Select Modules to Restore
                </span>

                <div className="divide-y divide-white/[0.04] rounded-xl bg-white/[0.02] border border-white/[0.06] p-2 max-h-60 overflow-y-auto">
                  {parsedBackupData.hasLibrary && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">Watchlist & Library</span>
                        <span className="text-[10px] text-zinc-400 block">{parsedBackupData.library?.length || 0} titles</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restoreModules.library}
                        onChange={(e) => setRestoreModules({ ...restoreModules, library: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  )}

                  {parsedBackupData.hasHistory && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">Continue Watching & History</span>
                        <span className="text-[10px] text-zinc-400 block">{parsedBackupData.history?.length || 0} progress markers</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restoreModules.history}
                        onChange={(e) => setRestoreModules({ ...restoreModules, history: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  )}

                  {parsedBackupData.hasSettings && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">Core Preferences & Video Studio</span>
                        <span className="text-[10px] text-zinc-400 block">Player automations, audio profiles</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restoreModules.settings}
                        onChange={(e) => setRestoreModules({ ...restoreModules, settings: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  )}

                  {parsedBackupData.hasCompanion && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">Pet Companion & Voice Spirit</span>
                        <span className="text-[10px] text-zinc-400 block">Mascot configuration & companion</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restoreModules.companion}
                        onChange={(e) => setRestoreModules({ ...restoreModules, companion: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  )}

                  {parsedBackupData.hasProfile && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">Profile Identity & Social Connections</span>
                        <span className="text-[10px] text-zinc-400 block">Bio, avatar, gender, socials (Username preserved)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restoreModules.profile}
                        onChange={(e) => setRestoreModules({ ...restoreModules, profile: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  )}

                  {parsedBackupData.hasMediaPrefs && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">Media Preferences</span>
                        <span className="text-[10px] text-zinc-400 block">Mangvels, Flixverse, Donghua settings</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restoreModules.mediaPrefs}
                        onChange={(e) => setRestoreModules({ ...restoreModules, mediaPrefs: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsRestoreModalOpen(false);
                    setParsedBackupData(null);
                  }}
                  disabled={isRestoring}
                  className="h-9 px-4 rounded-full text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="h-9 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  {isRestoring ? "Restoring..." : "Execute Restore"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelect={(url) => {
          if (isAuthenticated) setAvatarUrl(url);
          else setTravellerAvatar(url);
          setAvatarModalOpen(false);
        }}
      />
    </div>
  );
}

// ── REUSABLE UI PRIMITIVES (Clean & Minimal, Anti-Container Compliant) ──────────────

function SectionBlock({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-white/[0.08]">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleItem({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      onClick={() => {
        playSquishyJelly(0.28);
        onChange(!checked);
      }}
      className="flex items-center justify-between py-3.5 group cursor-pointer select-none"
    >
      <div className="pr-4">
        <h5 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
          {title}
        </h5>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <motion.div
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={cn(
          "w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center",
          checked ? "bg-primary" : "bg-white/10"
        )}
      >
        <motion.div
          layout
          className="w-5 h-5 rounded-full bg-white"
          animate={{
            x: checked ? 20 : 0,
            scaleX: [1, 1.25, 0.92, 1],
            scaleY: [1, 0.8, 1.1, 1]
          }}
          transition={{
            type: "spring",
            stiffness: 550,
            damping: 22
          }}
        />
      </motion.div>
    </motion.div>
  );
}
