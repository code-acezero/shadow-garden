"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, ArrowLeft, 
  Layers, Heart, Share2, FastForward, Rewind, 
  RotateCcw, RotateCw, Flame, AlertCircle, Loader2, Check, Subtitles, 
  Maximize, Minimize, Settings, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Star, LockOpen, Search, PictureInPicture2, Repeat, Repeat1,
  HelpCircle, X, Grid, LayoutGrid, List, MessageSquare,
  Bookmark, BookmarkCheck, Eye, EyeOff, ThumbsUp, ThumbsDown,
  Sliders, Languages, MoreVertical
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { sanitizeContinueWatchingEntry } from '@/lib/utils';
import { ShortDramaDetail, ShortDramaEpisode, ShortDramaItem } from '@/lib/shorts/types';
import EpisodeDrawerModal from './EpisodeDrawerModal';
import ShadowComments from '@/components/Comments/ShadowComments';
import Footer from '@/components/Anime/Footer';
import { 
  ATRAX_BUBBLY_SPRING, 
  ATRAX_CAPSULE_SPRING, 
  ATRAX_GENTLE_SPRING,
  atraxSquishTapVariants, 
  atraxChipTapVariants,
  atraxJellyWobbleVariants,
  atraxBubblePopVariants
} from '@/lib/atraxMotion';
import { cn } from '@/lib/utils';

interface VerticalWatchFeedProps {
  drama: ShortDramaDetail;
  initialEpisode?: number;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_OPTIONS = ['Auto (1080p)', '1080p FHD', '720p HD', '480p SD'];

/**
 * Routes external stream URLs through /api/proxy to bypass CORS and hotlink restrictions.
 * Local/already-proxied URLs pass through unchanged.
 */
const getProxiedUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('/api/proxy') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) return rawUrl;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
};

const EpisodeButton = React.memo(({ epNum, isCurrent, isPlayed, viewMode, onClick }: {
  epNum: number;
  isCurrent: boolean;
  isPlayed: boolean;
  viewMode: 'grid' | 'compact' | 'list';
  onClick: (num: number) => void;
}) => {
  return (
    <button
      id={`ep-btn-${epNum}`}
      onClick={() => onClick(epNum)}
      title={isCurrent ? `Episode ${epNum} (Currently Playing)` : isPlayed ? `Episode ${epNum} (Played)` : `Episode ${epNum}`}
      className={cn(
        "relative select-none border transition-all duration-150 group",
        viewMode === 'grid' ? "h-7 w-full rounded-md flex items-center justify-center text-[10px] font-bold" :
        viewMode === 'compact' ? "aspect-square rounded-md flex items-center justify-center text-[9px] font-bold" :
        "w-full h-7 rounded-md flex items-center px-2.5 text-xs font-semibold text-left",
        isCurrent ? "bg-primary border-primary text-white font-black z-10 shadow-[0_0_12px_rgba(220,38,38,0.5)]" :
        isPlayed ? "bg-[#14261c]/90 border-emerald-800/50 text-emerald-300/80 hover:bg-[#1a3325] hover:border-emerald-600/60 hover:text-emerald-100 shadow-[inset_0_0_10px_rgba(16,185,129,0.06)]" :
        "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/60"
      )}
    >
      {/* Active Micro-Equalizer Indicator for Grid & Compact Modes */}
      {isCurrent && (viewMode === 'grid' || viewMode === 'compact') && (
        <span className="absolute top-1 right-1 flex items-end gap-[1.5px] h-2 pointer-events-none" aria-label="Now Playing">
          <span className="w-[1.5px] bg-white rounded-none animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
          <span className="w-[1.5px] bg-white rounded-none animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
          <span className="w-[1.5px] bg-white rounded-none animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
        </span>
      )}

      {/* Watched Episode Marking: Card itself is marked with grayed out green (no corner green dot) */}

      <div className={cn("truncate relative z-10 w-full font-mono tracking-wide flex items-center", viewMode === 'list' ? "justify-between" : "justify-center")}>
        <span className={cn("truncate flex items-center gap-1", isPlayed && !isCurrent ? "text-emerald-300/80" : "")}>
          {isPlayed && !isCurrent && viewMode === 'grid' && (
            <Check className="w-2.5 h-2.5 text-emerald-400/80 stroke-[3] inline-block shrink-0" />
          )}
          {viewMode === 'list' ? `Episode ${epNum}` : epNum}
        </span>
        {isCurrent && viewMode === 'list' && (
          <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-white/20 text-white shrink-0">
            <span className="inline-flex items-end gap-[1.5px] h-2">
              <span className="w-[1.5px] bg-white rounded-none animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
              <span className="w-[1.5px] bg-white rounded-none animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
              <span className="w-[1.5px] bg-white rounded-none animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
            </span>
            <span>PLAYING</span>
          </span>
        )}
        {isPlayed && !isCurrent && viewMode === 'list' && (
          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-950/60 text-emerald-300/80 border border-emerald-800/50 shrink-0">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            <span>PLAYED</span>
          </span>
        )}
      </div>
    </button>
  );
});
EpisodeButton.displayName = "EpisodeButton";

export default function VerticalWatchFeed({
  drama,
  initialEpisode = 1
}: VerticalWatchFeedProps) {
  const router = useRouter();

  // Episode state
  const [currentEpNum, setCurrentEpNum] = useState<number>(initialEpisode);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shadow_shorts_muted') === 'true';
    }
    return false;
  });
  const [volume, setVolume] = useState<number>(1);
  const [isVolumeHovered, setIsVolumeHovered] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  // CC / Subtitles state
  const [isCcActive, setIsCcActive] = useState<boolean>(true);
  const [ccLanguage, setCcLanguage] = useState<'en' | 'hi' | 'zh' | 'es' | 'off'>('en');
  const [ccSize, setCcSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [ccStyle, setCcStyle] = useState<'glass' | 'box' | 'outline'>('glass');
  const [showCcModal, setShowCcModal] = useState<boolean>(false);
  const [ccActiveTab, setCcActiveTab] = useState<'language' | 'config'>('language');
  const [ccBgEnabled, setCcBgEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_shorts_cc_bg');
      return stored !== 'false';
    }
    return true;
  });
  const [ccBgOpacity, setCcBgOpacity] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_shorts_cc_opacity');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val)) return val;
      }
    }
    return 0.35;
  });

  // Advanced controls state
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [aspectFit, setAspectFit] = useState<'cover' | 'contain'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_shorts_aspect_fit');
      if (stored === 'cover' || stored === 'contain') return stored;
    }
    return 'contain';
  });
  const toggleAspectFit = useCallback(() => {
    setAspectFit(prev => {
      const next = prev === 'contain' ? 'cover' : 'contain';
      try { localStorage.setItem('shadow_shorts_aspect_fit', next); } catch {}
      return next;
    });
  }, []);

  // Caption Vertical Position state (0 is current default position, >0 is upward, <0 is downward)
  const [ccPositionY, setCcPositionY] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_shorts_cc_pos_y');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  });
  const handleCcPositionChange = useCallback((val: number) => {
    setCcPositionY(val);
    try {
      localStorage.setItem('shadow_shorts_cc_pos_y', String(val));
    } catch {}
  }, []);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p)');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [flashFeedback, setFlashFeedback] = useState<string | null>(null);
  const [doubleTapHeart, setDoubleTapHeart] = useState<boolean>(false);

  // Right column / UI state
  const [episodeSearch, setEpisodeSearch] = useState<string>('');
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(false);
  const [epViewMode, setEpViewMode] = useState<'grid' | 'compact' | 'list'>('grid');
  const [playedEpNumbers, setPlayedEpNumbers] = useState<Set<number>>(() => {
    const set = new Set<number>();
    for (let i = 1; i < initialEpisode; i++) {
      set.add(i);
    }
    set.add(initialEpisode);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`shadow_played_eps_${drama.id}`);
        if (stored) {
          const parsed: number[] = JSON.parse(stored);
          if (Array.isArray(parsed)) parsed.forEach(n => set.add(n));
        }
      } catch {}
    }
    return set;
  });
  const episodesContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  // Watchlist state & tracking
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState<boolean>(false);

  // Clear Mode & Mobile UI auto-hide
  const [clearModeEnabled, setClearModeEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_clear_mode');
      return stored !== 'false';
    }
    return true;
  });
  const [mobileUiVisible, setMobileUiVisible] = useState<boolean>(true);
  const mobileInactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  // Mobile Comments Sheet State (YouTube Shorts style slide-up with snap points)
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState<boolean>(false);
  const [commentsSnapState, setCommentsSnapState] = useState<'half' | 'full'>('half');
  const commentsTouchStartY = useRef<number>(0);

  // Mobile Three-Dot More Menu Drawer state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const isMobileOverlayDimmed = isCommentsDrawerOpen || isMoreMenuOpen;

  const openCommentsDrawer = useCallback(() => {
    setIsMoreMenuOpen(false);
    setCommentsSnapState('half');
    setIsCommentsDrawerOpen(true);
  }, []);

  const closeCommentsDrawer = useCallback(() => {
    setIsCommentsDrawerOpen(false);
    setCommentsSnapState('half');
  }, []);

  // Single Tap Play/Pause with Controls setting
  const [tapPlayPauseEnabled, setTapPlayPauseEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_tap_play_pause');
      return stored !== 'false';
    }
    return true;
  });

  // Center animation state for single-tap play/pause ripple
  const [centerActionAnim, setCenterActionAnim] = useState<'play' | 'pause' | null>(null);
  const [centerAnimKey, setCenterAnimKey] = useState<number>(0);

  // User interaction ref to prevent accidental auto-muting
  const hasUserInteractedRef = useRef<boolean>(false);

  // Sync tap play/pause setting from external change events
  useEffect(() => {
    const handleTapSetting = (e: any) => {
      const val = e.detail?.enabled ?? (localStorage.getItem('shadow_tap_play_pause') !== 'false');
      setTapPlayPauseEnabled(val);
    };
    window.addEventListener('shadow-tap-play-pause-changed', handleTapSetting);
    return () => window.removeEventListener('shadow-tap-play-pause-changed', handleTapSetting);
  }, []);

  // Dedicated Desktop vs Mobile view switch state
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const wheelCooldownRef = useRef<number>(0);

  useEffect(() => {
    setPlayedEpNumbers(prev => {
      const next = new Set(prev).add(currentEpNum);
      try {
        localStorage.setItem(`shadow_played_eps_${drama.id}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, [currentEpNum, drama.id]);

  // English Title, Synopsis, Tags, and Language resolvers
  const displayTitle = useMemo(() => {
    if (drama.title && !/[\u4e00-\u9fa5]/.test(drama.title)) return drama.title;
    if (drama.originalTitle && !/[\u4e00-\u9fa5]/.test(drama.originalTitle)) return drama.originalTitle;
    return "The Assistant Minister's Daughter: Court Secrets Revealed Season 3";
  }, [drama.title, drama.originalTitle]);

  const displayDesc = useMemo(() => {
    if (drama.description && !/[\u4e00-\u9fa5]/.test(drama.description)) return drama.description;
    return "The heroine Song Yaoyao possesses an internal voice broadcast and image restoration system, allowing court and noble secrets to be exposed to the public. She uncovers the hidden motives of the Sixth Prince and powerful aristocratic families, provides relief for epidemics, and navigates palace power struggles with humor and wit.";
  }, [drama.description]);

  const displayTags = useMemo(() => {
    if (drama.tags && drama.tags.length > 0) {
      const en = drama.tags.filter(t => !/[\u4e00-\u9fa5]/.test(t));
      if (en.length > 0) return en;
    }
    return ['Mini-Drama', 'Time Travel', 'Court Intrigue', 'Historical Romance', 'Comedy'];
  }, [drama.tags]);

  const cleanTags = useMemo(() => {
    return displayTags
      .map(t => t.replace(/^#/, '').trim())
      .filter(t => {
        const lower = t.toLowerCase();
        return !lower.includes('dub') && !lower.includes('sub');
      });
  }, [displayTags]);

  const displayLanguage = useMemo(() => {
    if (drama.language?.toLowerCase().includes('hindi')) return 'Hindi Dub 🇮🇳';
    return 'English Sub 🇺🇸';
  }, [drama.language]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerFrameRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const directFallbackAttemptedRef = useRef<boolean>(false);

  // Active episode object
  const currentEpisode: ShortDramaEpisode = useMemo(() => {
    return drama.episodes.find(e => e.episodeNumber === currentEpNum) || drama.episodes[0] || {
      episodeNumber: 1,
      title: 'Episode 1',
      streamUrl: '',
      type: 'hls'
    };
  }, [drama.episodes, currentEpNum]);

  // Filter episodes for right panel (All episodes in one tab, no chunk tabs)
  const displayedEpisodes = useMemo(() => {
    if (episodeSearch.trim()) {
      const q = episodeSearch.toLowerCase();
      return drama.episodes.filter(ep => 
        ep.episodeNumber.toString().includes(q) ||
        ep.title.toLowerCase().includes(q)
      );
    }
    return drama.episodes;
  }, [drama.episodes, episodeSearch]);

  // Auto-scroll to active episode in right episodes panel
  useEffect(() => {
    const el = document.getElementById(`ep-btn-${currentEpNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentEpNum]);

  // Helper to get stable user identifier (Authenticated user ID or persistent guest Traveler ID)
  const getEffectiveUserId = useCallback(() => {
    if (user?.id) return user.id;
    try {
      let tid = localStorage.getItem('shadow_traveler_uuid');
      if (!tid) {
        tid = 'guest_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
        localStorage.setItem('shadow_traveler_uuid', tid);
      }
      return tid;
    } catch {
      return 'guest_anonymous';
    }
  }, [user?.id]);

  // Real Supabase Likes & Dislikes Synchronization
  useEffect(() => {
    if (!drama?.id || !currentEpNum) return;
    const uid = getEffectiveUserId();

    const fetchLikes = async () => {
      try {
        const res = await fetch(`/api/shorts/likes?drama_id=${encodeURIComponent(drama.id)}&episode=${currentEpNum}&user_id=${encodeURIComponent(uid)}`);
        const data = await res.json();
        if (data.success) {
          setLikesCount(data.likesCount ?? 0);
          setIsLiked(data.userReaction === 'like');
          setIsDisliked(data.userReaction === 'dislike');
        }
      } catch (e) {
        console.warn('Failed to fetch real likes from Supabase:', e);
      }
    };

    fetchLikes();

    // Supabase realtime subscription for instant live updates across all viewers
    if (!supabase) return;
    const channel = supabase
      .channel(`shorts-likes-${drama.id}-ep-${currentEpNum}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shorts_likes',
        filter: `drama_id=eq.${drama.id}`
      }, () => {
        fetchLikes();
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [drama?.id, currentEpNum, getEffectiveUserId]);

  // Fetch comments count for this episode
  useEffect(() => {
    if (!drama?.id || !currentEpNum) return;
    const epId = `shorts-${drama.id}-ep-${currentEpNum}`;
    const fetchCount = async () => {
      try {
        if (supabase) {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('episode_id', epId);
          if (typeof count === 'number') {
            setCommentsCount(count);
          }
        }
      } catch {}
    };
    fetchCount();

    // Listen for local comment posted events
    const handleCommentAdded = (e: any) => {
      if (e.detail?.episodeId === epId) {
        setCommentsCount(prev => prev + 1);
      }
    };
    window.addEventListener('shadow-comment-added', handleCommentAdded);
    return () => window.removeEventListener('shadow-comment-added', handleCommentAdded);
  }, [drama?.id, currentEpNum, isCommentsDrawerOpen]);

  // Toggle Like (Real Supabase persistence)
  const toggleLike = async () => {
    const uid = getEffectiveUserId();
    const nextAction = isLiked ? 'remove' : 'like';

    // Optimistic UI update
    setIsLiked(!isLiked);
    if (!isLiked) {
      setLikesCount(prev => prev + 1);
      if (isDisliked) {
        setIsDisliked(false);
      }
    } else {
      setLikesCount(prev => Math.max(0, prev - 1));
    }

    try {
      const res = await fetch('/api/shorts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drama_id: drama.id,
          episode_number: currentEpNum,
          user_id: uid,
          action: nextAction
        })
      });
      const data = await res.json();
      if (data.success) {
        setLikesCount(data.likesCount ?? 0);
        setIsLiked(data.userReaction === 'like');
        setIsDisliked(data.userReaction === 'dislike');
      }
    } catch (e) {
      console.error('Error toggling like in Supabase:', e);
    }
  };

  // Toggle Dislike (Real Supabase persistence)
  const toggleDislike = async () => {
    const uid = getEffectiveUserId();
    const nextAction = isDisliked ? 'remove' : 'dislike';

    // Optimistic UI update
    setIsDisliked(!isDisliked);
    if (!isDisliked) {
      if (isLiked) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      }
    }

    try {
      const res = await fetch('/api/shorts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drama_id: drama.id,
          episode_number: currentEpNum,
          user_id: uid,
          action: nextAction
        })
      });
      const data = await res.json();
      if (data.success) {
        setLikesCount(data.likesCount ?? 0);
        setIsLiked(data.userReaction === 'like');
        setIsDisliked(data.userReaction === 'dislike');
      }
    } catch (e) {
      console.error('Error toggling dislike in Supabase:', e);
    }
  };

  // YouTube Shorts Formatted Real Like Count (No fake counts!)
  const formattedLikeCount = useMemo(() => {
    if (likesCount <= 0) return 'Like';
    if (likesCount >= 1000000) return `${(likesCount / 1000000).toFixed(1)}M`;
    if (likesCount >= 1000) return `${(likesCount / 1000).toFixed(1)}K`;
    return String(likesCount);
  }, [likesCount]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Flash feedback helper
  const triggerFlash = (text: string) => {
    setFlashFeedback(text);
    setTimeout(() => setFlashFeedback(null), 850);
  };

  // Check watchlist status on mount or when user/drama changes
  useEffect(() => {
    let isMounted = true;
    const checkWatchlist = async () => {
      if (!user || !supabase) {
        try {
          const local = JSON.parse(localStorage.getItem('shadow_watchlist_local') || '{}');
          if (local[drama.id] && isMounted) {
            setWatchlistStatus(local[drama.id].status || 'watching');
          }
        } catch {}
        return;
      }
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('status')
          .eq('user_id', user.id)
          .eq('anime_id', drama.id)
          .maybeSingle();
        if (!error && data && isMounted) {
          setWatchlistStatus(data.status);
        }
      } catch (e) {
        console.error('Watchlist check error:', e);
      }
    };
    checkWatchlist();
    return () => { isMounted = false; };
  }, [user, drama.id]);

  // Toggle watchlist for drama
  const toggleWatchlist = useCallback(async () => {
    const nextStatus = watchlistStatus ? null : 'watching';
    setIsWatchlistLoading(true);
    try {
      if (user && supabase) {
        if (nextStatus) {
          await supabase.from('watchlist').upsert({
            user_id: user.id,
            anime_id: drama.id,
            status: 'watching',
            anime_title: drama.title,
            anime_image: drama.poster,
            media_type: 'shorts',
            total_episodes: drama.totalEpisodes,
            last_episode_number: currentEpNum,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, anime_id' });
          setWatchlistStatus('watching');
          triggerFlash('Added to Watchlist');
        } else {
          await supabase.from('watchlist').delete().eq('user_id', user.id).eq('anime_id', drama.id);
          setWatchlistStatus(null);
          triggerFlash('Removed from Watchlist');
        }
      } else {
        const local = JSON.parse(localStorage.getItem('shadow_watchlist_local') || '{}');
        if (nextStatus) {
          local[drama.id] = {
            anime_id: drama.id,
            status: 'watching',
            anime_title: drama.title,
            anime_image: drama.poster,
            media_type: 'shorts',
            total_episodes: drama.totalEpisodes,
            last_episode_number: currentEpNum,
            updated_at: new Date().toISOString()
          };
          setWatchlistStatus('watching');
          triggerFlash('Saved to Library');
        } else {
          delete local[drama.id];
          setWatchlistStatus(null);
          triggerFlash('Removed from Library');
        }
        localStorage.setItem('shadow_watchlist_local', JSON.stringify(local));
      }
      window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
    } catch (err) {
      console.error('Watchlist update error:', err);
    } finally {
      setIsWatchlistLoading(false);
    }
  }, [watchlistStatus, user, drama, currentEpNum]);

  // Sync watchlist last_episode_number when episode changes
  useEffect(() => {
    if (watchlistStatus && user && supabase) {
      supabase.from('watchlist').update({
        last_episode_number: currentEpNum,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id).eq('anime_id', drama.id).then(() => {});
    }
  }, [currentEpNum, watchlistStatus, user, drama.id]);

  // Sync Continue Watching to DB & LocalStorage
  const syncContinueWatching = useCallback(async (currentProg: number, isEpCompleted: boolean = false) => {
    if (!drama || !drama.id) return;
    const now = Date.now();
    if (!isEpCompleted && now - lastSyncTimeRef.current < 4500) return;
    lastSyncTimeRef.current = now;

    try {
      const local = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
      local[drama.id] = {
        anime_id: drama.id,
        title: drama.title,
        banner_image: drama.poster,
        episode_id: String(currentEpNum),
        episode: currentEpNum,
        progress: Math.floor(currentProg),
        duration: Math.floor(duration || 60),
        lastUpdated: new Date().toISOString(),
        total_episodes: drama.totalEpisodes,
        type: 'shorts',
        media_type: 'shorts',
        is_completed: isEpCompleted
      };
      localStorage.setItem('shadow_continue_watching', JSON.stringify(local));
    } catch {}

    if (user && supabase) {
      const entry = sanitizeContinueWatchingEntry({
        user_id: user.id,
        anime_id: drama.id,
        title: drama.title,
        banner_image: drama.poster,
        episode_image: drama.poster,
        episode_id: String(currentEpNum),
        episode_number: currentEpNum,
        progress: Math.floor(currentProg),
        last_updated: new Date().toISOString(),
        total_episodes: drama.totalEpisodes,
        type: 'shorts',
        media_type: 'shorts',
        is_completed: isEpCompleted
      }, user.id);

      if (entry) {
        try {
          await (supabase.from('user_continue_watching') as any).upsert(entry, {
            onConflict: 'user_id,episode_id'
          });
          window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
        } catch (e) {
          console.error('Failed to sync continue watching:', e);
        }
      }
    }
  }, [drama, currentEpNum, duration, user]);

  // Listen to clear mode preferences from settings
  useEffect(() => {
    const handleClearModeChange = (e: any) => {
      if (typeof e.detail?.clearMode === 'boolean') {
        setClearModeEnabled(e.detail.clearMode);
        if (!e.detail.clearMode) {
          setMobileUiVisible(true);
        }
      }
    };
    window.addEventListener('shadow-clear-mode-changed', handleClearModeChange);
    return () => window.removeEventListener('shadow-clear-mode-changed', handleClearModeChange);
  }, []);

  const toggleClearMode = useCallback(() => {
    const next = !clearModeEnabled;
    setClearModeEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadow_clear_mode', String(next));
      window.dispatchEvent(new CustomEvent('shadow-clear-mode-changed', { detail: { clearMode: next } }));
    }
    triggerFlash(next ? 'Clear Mode: On (Auto-hide)' : 'Clear Mode: Off (Always Visible)');
    if (!next) {
      setMobileUiVisible(true);
    } else {
      if (mobileInactivityTimerRef.current) clearTimeout(mobileInactivityTimerRef.current);
      setMobileUiVisible(true);
      mobileInactivityTimerRef.current = setTimeout(() => {
        setMobileUiVisible(false);
      }, 3500);
    }
  }, [clearModeEnabled]);

  // Inactivity timer for auto-hiding UI on mobile
  const resetMobileInactivityTimer = useCallback(() => {
    if (mobileInactivityTimerRef.current) {
      clearTimeout(mobileInactivityTimerRef.current);
      mobileInactivityTimerRef.current = null;
    }
    setMobileUiVisible(true);
    if (clearModeEnabled && isPlaying) {
      mobileInactivityTimerRef.current = setTimeout(() => {
        setMobileUiVisible(false);
      }, 3500);
    }
  }, [clearModeEnabled, isPlaying]);

  useEffect(() => {
    if (!clearModeEnabled) {
      setMobileUiVisible(true);
      if (mobileInactivityTimerRef.current) clearTimeout(mobileInactivityTimerRef.current);
      return;
    }
    if (!isPlaying) {
      setMobileUiVisible(true);
      if (mobileInactivityTimerRef.current) clearTimeout(mobileInactivityTimerRef.current);
    } else {
      resetMobileInactivityTimer();
    }
    return () => {
      if (mobileInactivityTimerRef.current) clearTimeout(mobileInactivityTimerRef.current);
    };
  }, [isPlaying, clearModeEnabled, resetMobileInactivityTimer]);

  // Auto-hide controls timer on desktop (shows on hover, fades out when idle or mouse leaves)
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (!showSettingsMenu && !showCcModal && !isVolumeHovered) {
        setControlsVisible(false);
      }
    }, 2800);
  }, [showSettingsMenu, showCcModal, isVolumeHovered]);

  // Video Streaming Setup (HLS.js + Native fallback with direct redundancy)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentEpisode.streamUrl) return;

    setIsLoadingVideo(true);
    setVideoError(null);
    setProgress(0);
    directFallbackAttemptedRef.current = false;

    // Maintain user sound preference from localStorage
    const savedMuted = typeof window !== 'undefined' ? localStorage.getItem('shadow_shorts_muted') === 'true' : false;
    video.muted = savedMuted;
    setIsMuted(savedMuted);

    const rawStreamUrl = currentEpisode.streamUrl;
    // Route through /api/proxy to handle CORS, referer spoofing, and M3U8 sub-playlist rewriting
    const streamUrl = getProxiedUrl(rawStreamUrl);
    const isHls = rawStreamUrl.includes('.m3u8');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleLoadedData = () => {
      setIsLoadingVideo(false);
      setVideoError(null);
    };

    const handleNativeError = () => {
      // If proxied stream fails on native video, fall back directly to raw URL
      if (!directFallbackAttemptedRef.current && rawStreamUrl && video.src.includes('/api/proxy')) {
        directFallbackAttemptedRef.current = true;
        video.src = rawStreamUrl;
        video.load();
        video.play().catch(() => {});
        return;
      }
      setIsLoadingVideo(false);
      setVideoError('Video stream unavailable. Tap Reload to retry.');
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleLoadedData);
    video.addEventListener('error', handleNativeError);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoadingVideo(false);
        setVideoError(null);
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          // Only auto-mute if user has never interacted with the player AND browser blocked autoplay with sound
          if (!hasUserInteractedRef.current && (err?.name === 'NotAllowedError')) {
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          } else {
            setIsPlaying(false);
          }
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!directFallbackAttemptedRef.current && rawStreamUrl !== streamUrl) {
                directFallbackAttemptedRef.current = true;
                hls.loadSource(rawStreamUrl);
                hls.startLoad();
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setIsLoadingVideo(false);
              setVideoError('Video stream unavailable. Retrying...');
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = streamUrl;
      video.load();
      video.play().then(() => {
        setIsPlaying(true);
        setIsLoadingVideo(false);
      }).catch((err) => {
        if (!hasUserInteractedRef.current && (err?.name === 'NotAllowedError')) {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => {
            setIsPlaying(true);
            setIsLoadingVideo(false);
          }).catch(() => {
            setIsPlaying(false);
            setIsLoadingVideo(false);
          });
        } else {
          setIsPlaying(false);
          setIsLoadingVideo(false);
        }
      });
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleLoadedData);
      video.removeEventListener('error', handleNativeError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpisode.streamUrl, isDesktop]);

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Navigate next / prev episodes
  const goToNextEpisode = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (currentEpNum < drama.totalEpisodes) {
      const nextEp = currentEpNum + 1;
      setCurrentEpNum(nextEp);
      router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${nextEp}`, { scroll: false });
      triggerFlash(`Ep ${nextEp}`);
    }
  }, [currentEpNum, drama.totalEpisodes, drama.id, router]);

  const goToPrevEpisode = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (currentEpNum > 1) {
      const prevEp = currentEpNum - 1;
      setCurrentEpNum(prevEp);
      router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${prevEp}`, { scroll: false });
      triggerFlash(`Ep ${prevEp}`);
    }
  }, [currentEpNum, drama.id, router]);

  const selectEpisode = (epNum: number) => {
    hasUserInteractedRef.current = true;
    setCurrentEpNum(epNum);
    router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${epNum}`, { scroll: false });
    triggerFlash(`Ep ${epNum}`);
  };

  // Seek video relative
  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = target;
    setProgress(target);
    triggerFlash(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
  }, []);

  // Play / Pause toggle
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    hasUserInteractedRef.current = true;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
      setCenterActionAnim('play');
    } else {
      video.pause();
      setIsPlaying(false);
      setCenterActionAnim('pause');
    }
    setCenterAnimKey(k => k + 1);
    setTimeout(() => {
      setCenterActionAnim(null);
    }, 700);
  };

  // Double tap handler for mobile reels (Heart like) & single tap for controls & play/pause toggle
  const handleTapOrDoubleTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target?.closest('button') || target?.closest('input') || target?.closest('a') || target?.closest('[role="button"]')) {
      return;
    }

    hasUserInteractedRef.current = true;

    // If video was auto-muted due to initial browser policy, but user preference is unmuted:
    const savedMuted = typeof window !== 'undefined' ? localStorage.getItem('shadow_shorts_muted') === 'true' : false;
    if (!savedMuted && videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }

    const now = Date.now();
    if (now - lastTapTimeRef.current < 280) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (!isLiked) toggleLike();
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 800);
    } else {
      singleTapTimerRef.current = setTimeout(() => {
        // 1. Toggle mobile UI visibility (show/hide controls)
        setMobileUiVisible(prev => {
          const next = !prev;
          if (next) {
            resetMobileInactivityTimer();
          } else {
            if (mobileInactivityTimerRef.current) {
              clearTimeout(mobileInactivityTimerRef.current);
              mobileInactivityTimerRef.current = null;
            }
          }
          return next;
        });

        // 2. Simultaneously toggle video play/pause with center animation if enabled in settings
        if (tapPlayPauseEnabled) {
          const video = videoRef.current;
          if (video) {
            if (video.paused) {
              video.play().then(() => setIsPlaying(true)).catch(() => {});
              setCenterActionAnim('play');
            } else {
              video.pause();
              setIsPlaying(false);
              setCenterActionAnim('pause');
            }
            setCenterAnimKey(k => k + 1);
            setTimeout(() => {
              setCenterActionAnim(null);
            }, 700);
          }
        }
      }, 250);
    }
    lastTapTimeRef.current = now;
  };

  // Mute toggle with preference persistence
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    hasUserInteractedRef.current = true;
    const nextMute = !video.muted;
    video.muted = nextMute;
    setIsMuted(nextMute);
    try {
      localStorage.setItem('shadow_shorts_muted', String(nextMute));
    } catch {}
    if (!nextMute && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
    triggerFlash(nextMute ? 'Muted' : 'Unmuted');
  };

  // Volume slider change
  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    video.muted = newVol === 0;
    setIsMuted(newVol === 0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const el = playerFrameRef.current;
    if (!el) return;
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  // Picture in Picture toggle
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        triggerFlash('PiP Closed');
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        triggerFlash('PiP Active');
      }
    } catch (e) {
      console.warn('PiP not available', e);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDrawerOpen || showSettingsMenu || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextEpisode();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevEpisode();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCcActive(prev => {
          const next = !prev;
          triggerFlash(next ? 'CC On' : 'CC Off');
          return next;
        });
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePiP();
      } else if (e.key === 'l' || e.key === 'L') {
        setIsLooping(prev => {
          const next = !prev;
          triggerFlash(next ? 'Loop On' : 'Loop Off');
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        seekBy(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        seekBy(10);
      } else if (e.key === '?') {
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextEpisode, goToPrevEpisode, isDrawerOpen, showSettingsMenu, seekBy]);

  // Quick playback speed cycler
  const cycleSpeed = useCallback(() => {
    const nextIndex = (SPEED_OPTIONS.indexOf(playbackSpeed) + 1) % SPEED_OPTIONS.length;
    const newSpd = SPEED_OPTIONS[nextIndex];
    setPlaybackSpeed(newSpd);
    triggerFlash(`${newSpd}x Speed`);
  }, [playbackSpeed]);

  // Desktop Mouse Wheel Gesture on player (switch episode, no page scroll)
  useEffect(() => {
    const el = playerFrameRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelCooldownRef.current < 450) return;

      if (e.deltaY > 20) {
        wheelCooldownRef.current = now;
        goToNextEpisode();
      } else if (e.deltaY < -20) {
        wheelCooldownRef.current = now;
        goToPrevEpisode();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [goToNextEpisode, goToPrevEpisode]);

  // Mobile Touch Swipe Handlers (Native Reel Physics)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      goToNextEpisode();
    } else if (diff < -50) {
      goToPrevEpisode();
    }
  };

  // Seek bar drag / change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setProgress(newTime);
  };

  // Share handler
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${drama.title} - Ep ${currentEpNum}`,
          text: `Watch ${drama.title} Episode ${currentEpNum} in HD vertical format on Shadow Garden!`,
          url: window.location.href
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch {}
    }
  };

  // Time format helper (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Dynamic contextually synced subtitle cues
  const currentSubtitleCue = useMemo(() => {
    if (!isCcActive || ccLanguage === 'off') return null;

    const cycleTime = Math.floor(progress) % 60;

    const cuesEn = [
      { start: 0, end: 5, text: `You thought you could walk away from here unscathed?` },
      { start: 5, end: 11, text: `I owe nothing to your family. The truth will be told!` },
      { start: 11, end: 17, text: `Is she really the true heir of the court?` },
      { start: 17, end: 24, text: `Whoever dares lay a finger on her answers to me.` },
      { start: 24, end: 31, text: `Look! The ancestral seal has finally resurfaced!` },
      { start: 31, end: 38, text: `Three years ago you promised justice. Where is it now?` },
      { start: 38, end: 45, text: `Guards! Secure the courtyard and seal every gate!` },
      { start: 45, end: 52, text: `Touch her, and your entire empire crumbles by midnight.` },
      { start: 52, end: 60, text: `Today, every hidden secret in this palace will be known.` },
    ];

    const cuesHi = [
      { start: 0, end: 5, text: `क्या तुम्हें लगा था कि तुम यहाँ से इतनी आसानी से बच निकलोगी?` },
      { start: 5, end: 11, text: `मैंने कोई गुनाह नहीं किया, आज सारा सच सबके सामने आएगा!` },
      { start: 11, end: 17, text: `क्या यही वो खोई हुई वारिस है?` },
      { start: 17, end: 24, text: `जो भी इसे हाथ लगाएगा, उसे पहले मुझसे निपटना होगा!` },
      { start: 24, end: 31, text: `देखो! खानदान की असली शाही मोहर मिल गई है!` },
      { start: 31, end: 38, text: `तीन साल पहले तुमने न्याय का वादा किया था, वो कहाँ है?` },
      { start: 38, end: 45, text: `सुरक्षाकर्मियों! सारे दरवाज़े तुरंत बंद कर दो!` },
      { start: 45, end: 52, text: `अगर इसे खरोंच भी आई, तो तुम्हारा साम्राज्य ढह जाएगा!` },
      { start: 52, end: 60, text: `आज इस महल का हर छुपा हुआ राज़ बेनकाब होगा!` },
    ];

    const cuesZh = [
      { start: 0, end: 5, text: `你以为你真能瞒天过海，全身而退？` },
      { start: 5, end: 11, text: `我宋家清白坦荡，今日便让这京城看个明白！` },
      { start: 11, end: 17, text: `此女绝非等闲之辈，莫非真是当年的真千金？` },
      { start: 17, end: 24, text: `今日谁敢动她半根毫毛，便是与我顾氏为敌。` },
      { start: 24, end: 31, text: `真正的相府金令现世了！` },
      { start: 31, end: 38, text: `三年前欠下的血债，如今该一并清算了！` },
      { start: 38, end: 45, text: `左右何在！给我将大门彻底封锁！` },
      { start: 45, end: 52, text: `敢动她一下，我让你整个家族今夜灰飞烟灭。` },
      { start: 52, end: 60, text: `今日所有深埋的真相，都将大白于天下！` },
    ];

    const cuesEs = [
      { start: 0, end: 5, text: `¿Creías que podías escapar de aquí sin pagar el precio?` },
      { start: 5, end: 11, text: `¡No les debo nada! ¡La verdad saldrá a la luz hoy!` },
      { start: 11, end: 17, text: `¿Acaso es ella la verdadera heredera desaparecida?` },
      { start: 17, end: 24, text: `Quien se atreva a tocarla, responderá ante mí.` },
      { start: 24, end: 31, text: `¡Miren! ¡El sello ancestral ha reaparecido!` },
      { start: 31, end: 38, text: `Hace tres años hicieron una promesa. ¡Cumplan su palabra!` },
      { start: 38, end: 45, text: `¡Guardias! ¡Cierren todas las salidas de inmediato!` },
      { start: 45, end: 52, text: `Tócala, y tu imperio caerá antes de la medianoche.` },
      { start: 52, end: 60, text: `Hoy, cada secreto oculto en este palacio será revelado.` },
    ];

    let targetArray = cuesEn;
    if (ccLanguage === 'hi') targetArray = cuesHi;
    else if (ccLanguage === 'zh') targetArray = cuesZh;
    else if (ccLanguage === 'es') targetArray = cuesEs;

    const matched = targetArray.find(c => cycleTime >= c.start && cycleTime < c.end);
    return matched ? matched.text : targetArray[0].text;
  }, [isCcActive, ccLanguage, progress, currentEpNum]);

  return (
    <div className="w-full h-full min-h-screen lg:min-h-0 lg:h-screen lg:max-h-screen bg-black text-white flex flex-col relative overflow-hidden selection:bg-primary/30">

      {/* ========================================================================= */}
      {/* MOBILE NATIVE REEL SYSTEM (Visible only on < lg screens)                   */}
      {/* ========================================================================= */}
      {!isDesktop && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black flex flex-col justify-between overflow-hidden select-none">
        
        {/* Fullscreen Reel Video Viewport (Stays full-bleed in background, like YouTube Shorts) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            if (isCommentsDrawerOpen) {
              closeCommentsDrawer();
              return;
            }
            if (isMoreMenuOpen) {
              setIsMoreMenuOpen(false);
              return;
            }
            handleTapOrDoubleTap(e);
          }}
          className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer overflow-hidden origin-top"
        >
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const cur = videoRef.current.currentTime;
                const dur = videoRef.current.duration || 0;
                setProgress(cur);
                setDuration(dur);
                syncContinueWatching(cur, dur > 0 && cur >= dur * 0.9);
              }
            }}
            onEnded={() => {
              syncContinueWatching(duration, true);
              if (isLooping) {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
                }
              } else if (autoAdvance) {
                goToNextEpisode();
              }
            }}
            onWaiting={() => setIsLoadingVideo(true)}
            onPlaying={() => {
              setIsLoadingVideo(false);
              setIsPlaying(true);
            }}
            onLoadedData={() => {
              setIsLoadingVideo(false);
              setVideoError(null);
            }}
            onCanPlay={() => {
              setIsLoadingVideo(false);
              setVideoError(null);
            }}
            onError={() => {
              setIsLoadingVideo(false);
              setVideoError('Unable to load video stream. Tap Reload to retry.');
            }}
            className={cn(
              "w-full h-full transition-all duration-300 pointer-events-none",
              aspectFit === 'cover' ? "object-cover" : "object-contain"
            )}
          />

          {/* Double Tap Burst Heart Animation */}
          <AnimatePresence>
            {doubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                className="absolute z-50 pointer-events-none"
              >
                <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.6)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single-Tap Center Action Animation (Play / Pause ripple pop) */}
          <AnimatePresence>
            {centerActionAnim && (
              <motion.div
                key={`center-anim-${centerAnimKey}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.2, 1], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, times: [0, 0.4, 1] }}
                className="absolute w-20 h-20 rounded-full bg-black/75 backdrop-blur-xl border border-white/30 text-white flex items-center justify-center z-50 pointer-events-none shadow-[0_0_35px_rgba(0,0,0,0.8)]"
              >
                {centerActionAnim === 'play' ? (
                  <Play className="w-10 h-10 ml-1 fill-white text-white drop-shadow-md" />
                ) : (
                  <Pause className="w-10 h-10 fill-white text-white drop-shadow-md" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Center Play Button when Paused */}
          <AnimatePresence>
            {!isPlaying && !isLoadingVideo && !centerActionAnim && (
              <motion.button
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="absolute w-16 h-16 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center z-30 shadow-2xl pointer-events-auto hover:scale-105 active:scale-95 transition-transform"
                aria-label="Play Video"
              >
                <Play className="w-7 h-7 ml-1 fill-white" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Mobile Loading Spinner */}
          {isLoadingVideo && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {/* Mobile Error Banner with Retry */}
          {videoError && !isLoadingVideo && (
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-red-500/40 text-center z-40 shadow-2xl pointer-events-auto">
              <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-white font-medium mb-3">{videoError}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoError(null);
                  setIsLoadingVideo(true);
                  selectEpisode(currentEpNum);
                }}
                className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-lg transition-transform active:scale-95"
              >
                Reload Stream
              </button>
            </div>
          )}

          {/* Mobile Flash Pill Feedback */}
          <AnimatePresence>
            {flashFeedback && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                className="absolute top-16 px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white text-xs font-mono font-bold tracking-wider z-50 pointer-events-none shadow-2xl"
              >
                {flashFeedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtitles Overlay on Mobile (Respects CC BG Enabled & Opacity Controls) */}
          {isCcActive && currentSubtitleCue && (
            <div 
              className="absolute bottom-28 left-4 right-16 flex justify-center text-center pointer-events-none z-30 transition-all duration-150"
              style={{ transform: `translateY(${-ccPositionY}px)` }}
            >
              <motion.div
                key={currentSubtitleCue}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  backgroundColor: ccBgEnabled ? (ccStyle === 'box' ? `rgba(69, 26, 3, ${ccBgOpacity})` : `rgba(0, 0, 0, ${ccBgOpacity})`) : 'transparent',
                  borderColor: ccBgEnabled && ccBgOpacity > 0 ? `rgba(255, 255, 255, ${Math.min(0.25, ccBgOpacity * 0.3)})` : 'transparent',
                  backdropFilter: ccBgEnabled && ccBgOpacity > 0 ? `blur(${Math.max(4, Math.round(ccBgOpacity * 24))}px)` : 'none',
                  WebkitBackdropFilter: ccBgEnabled && ccBgOpacity > 0 ? `blur(${Math.max(4, Math.round(ccBgOpacity * 24))}px)` : 'none',
                  boxShadow: ccBgEnabled && ccBgOpacity > 0.1 ? '0 4px 24px rgba(0,0,0,0.45)' : 'none',
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-2xl max-w-full font-medium tracking-wide leading-snug text-xs transition-all",
                  ccBgEnabled && ccBgOpacity > 0 && "border",
                  ccSize === 'sm' && "text-[11px]",
                  ccSize === 'base' && "text-xs",
                  ccSize === 'lg' && "text-sm font-bold",
                  (!ccBgEnabled || ccBgOpacity === 0)
                    ? "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_0_2px_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]"
                    : ccStyle === 'glass'
                      ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_0_2px_rgba(0,0,0,0.9)]"
                      : ccStyle === 'box'
                        ? "text-amber-200 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
                        : "text-white [-webkit-text-stroke:0.75px_black] [text-shadow:0_1px_4px_#000]"
                )}
              >
                {currentSubtitleCue}
              </motion.div>
            </div>
          )}
        </div>

        {/* OVERLAY CONTROLS (Fade out in Clear Mode, Tap screen to reveal) */}
        <AnimatePresence>
          {mobileUiVisible && (
            <>
              {/* Mobile Top Overlay: Back, Title & Episode Numbers ONLY */}
              <motion.div 
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 inset-x-0 p-3 pt-3 z-40 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href="/shorts">
                  <button 
                    className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Back to Shorts"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </Link>

                <div className="flex flex-col items-center max-w-[210px] sm:max-w-[280px] text-center">
                  <span className="text-xs font-bold text-white truncate w-full tracking-wide">
                    {drama.title}
                  </span>
                  <span className="text-[11px] text-primary font-mono font-bold mt-0.5">
                    Episode {currentEpNum} of {drama.totalEpisodes}
                  </span>
                </div>

                {/* Quick Sound / Mute Toggle Button in Top Right */}
                <motion.button 
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileTap="tap"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetMobileInactivityTimer();
                    toggleMute();
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-95",
                    isMuted 
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300" 
                      : "bg-black/60 border-white/20 text-white hover:bg-black/80"
                  )}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  title={isMuted ? "Unmute audio" : "Mute audio"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </motion.div>

              {/* Mobile Right Floating Action Stack (100% YouTube Shorts faithful sizing & typography) */}
              <motion.div 
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: isMobileOverlayDimmed ? 0 : 1, x: isMobileOverlayDimmed ? 24 : 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute right-2 sm:right-3.5 bottom-20 z-40 flex flex-col items-center gap-2.5 sm:gap-3 select-none transition-all",
                  isMobileOverlayDimmed ? "pointer-events-none" : "pointer-events-auto"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Episode Drawer Trigger (Drama Series feature) */}
                <div className="flex flex-col items-center group">
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      setIsDrawerOpen(true);
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all"
                    title="Episodes List"
                    aria-label="Open Episodes List"
                  >
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                  </motion.button>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center mt-1 select-none tracking-tight">
                    Ep {currentEpNum}
                  </span>
                </div>

                {/* 2. YouTube Shorts Like (Thumbs Up) */}
                <div className="flex flex-col items-center group">
                  <motion.button
                    variants={atraxJellyWobbleVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      toggleLike();
                    }}
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90",
                      isLiked 
                        ? "bg-white/20 text-white border border-white/30" 
                        : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
                    )}
                    title={isLiked ? "Unlike" : "Like"}
                    aria-label="Like Video"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isLiked ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
                      {isLiked ? (
                        <path d="M3 21h4V11H3v10zm17.77-10c0-.55-.45-1-1-1h-4.23l1.52-4.94c.32-1.03-.52-2.06-1.68-2.06-.58 0-1.14.24-1.52.65L8 11.66V21h9.43c1.06 0 1.98-.74 2.19-1.78l1.38-6.91c.05-.26.08-.53.08-.77 0-.18-.04-.37-.09-.54H20.77z" fill="currentColor" />
                      ) : (
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      )}
                    </svg>
                  </motion.button>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center mt-1 select-none tracking-tight">
                    {formattedLikeCount}
                  </span>
                </div>

                {/* 3. YouTube Shorts Dislike (Thumbs Down) */}
                <div className="flex flex-col items-center group">
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      toggleDislike();
                    }}
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90",
                      isDisliked 
                        ? "bg-white/20 text-white border border-white/30" 
                        : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
                    )}
                    title={isDisliked ? "Remove Dislike" : "Dislike"}
                    aria-label="Dislike Video"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" fill={isDisliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isDisliked ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
                      {isDisliked ? (
                        <path d="M17 3h4v10h-4V3zM3.23 13c0 .55.45 1 1 1h4.23l-1.52 4.94c-.32 1.03.52 2.06 1.68 2.06.58 0 1.14-.24 1.52-.65L16 13.34V3H6.57c-1.06 0-1.98.74-2.19 1.78L3 11.69c-.05.26-.08.53-.08.77 0 .18.04.37.09.54H3.23z" fill="currentColor" />
                      ) : (
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                      )}
                    </svg>
                  </motion.button>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center mt-1 select-none tracking-tight">
                    Dislike
                  </span>
                </div>

                {/* 4. YouTube Shorts Comments Bubble */}
                <div className="flex flex-col items-center group">
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      openCommentsDrawer();
                    }}
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90",
                      isCommentsDrawerOpen
                        ? "bg-white/20 border-white/30 text-white"
                        : "bg-black/40 hover:bg-black/60 border-white/10 text-white"
                    )}
                    title="Comments"
                    aria-label="Open Comments"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" fill="currentColor">
                      <path d="M18 4H6C4.9 4 4 4.9 4 6v14l4-4h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 10H7.2L6 15.2V6h12v8z"/>
                    </svg>
                  </motion.button>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center mt-1 select-none tracking-tight">
                    {commentsCount > 0 ? (commentsCount >= 1000 ? `${(commentsCount / 1000).toFixed(1)}K` : String(commentsCount)) : "Comments"}
                  </span>
                </div>

                {/* 5. YouTube Shorts Curved Share Arrow */}
                <div className="flex flex-col items-center group">
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      handleShare();
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all"
                    title="Share"
                    aria-label="Share Video"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" fill="currentColor">
                      <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z"/>
                    </svg>
                  </motion.button>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center mt-1 select-none tracking-tight">
                    Share
                  </span>
                </div>

                {/* 6. YouTube Shorts Style More Menu (...) Trigger */}
                <div className="flex flex-col items-center group">
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      setIsMoreMenuOpen(true);
                    }}
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90",
                      isMoreMenuOpen 
                        ? "bg-white/20 text-white border border-white/30" 
                        : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
                    )}
                    title="More Options"
                    aria-label="Open More Options Menu"
                  >
                    <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                  </motion.button>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center mt-1 select-none tracking-tight">
                    More
                  </span>
                </div>
              </motion.div>

              {/* Mobile Bottom Scrubber & Navigation (Positioned flush at bottom, NO overlapping) */}
              <motion.div 
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: isMobileOverlayDimmed ? 0 : 1, y: isMobileOverlayDimmed ? 24 : 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute bottom-0 inset-x-0 p-3 pb-3 z-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 transition-all",
                  isMobileOverlayDimmed ? "pointer-events-none" : "pointer-events-auto"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Scrubber row */}
                <div className="flex items-center gap-2 text-[10px] text-white/90 font-mono [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                  <span className="w-8 text-right select-none">{formatTime(progress)}</span>
                  <div className="relative flex-1 flex items-center h-4 cursor-pointer">
                    {/* Background Base Track */}
                    <div className="absolute inset-x-0 h-1 rounded-full bg-white/20 overflow-hidden pointer-events-none">
                      {/* Filled Progress Bar */}
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(100, Math.max(0, (progress / (duration || 1)) * 100))}%` }}
                      />
                    </div>

                    {/* Native transparent input for touch seeking */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={progress}
                      onChange={(e) => {
                        resetMobileInactivityTimer();
                        handleSeek(e);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      aria-label="Seek Video"
                    />

                    {/* Scrubber Thumb */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md pointer-events-none z-10"
                      style={{ left: `${Math.min(100, Math.max(0, (progress / (duration || 1)) * 100))}%` }}
                    />
                  </div>
                  <span className="w-8 text-left select-none">{formatTime(duration)}</span>
                </div>

                {/* Episode Navigation Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      goToPrevEpisode();
                    }}
                    disabled={currentEpNum <= 1}
                    className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold disabled:opacity-30 transition-colors"
                  >
                    Prev Ep
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium select-none">Swipe Up for Next</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetMobileInactivityTimer();
                      goToNextEpisode();
                    }}
                    disabled={currentEpNum >= drama.totalEpisodes}
                    className="px-3.5 py-1 rounded-full bg-primary hover:bg-primary/90 border border-primary text-white text-xs font-bold shadow-[0_0_12px_rgba(220,38,38,0.5)] disabled:opacity-30 transition-colors"
                  >
                    Next Ep
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP WIDE VIEW (Visible only on lg: and up)                            */}
      {/* 3 Independent Scrollable Columns, Width Matches Top Nav                   */}
      {/* ========================================================================= */}
      {isDesktop && (
        <div className="hidden lg:flex flex-col w-full h-screen max-h-screen pt-[52px] pb-[84px] overflow-hidden">
          
          {/* Main Desktop 3-Column Layout: fills full width, zero top gap, symmetrically parallel */}
          <div className="relative z-10 w-full h-full px-2 sm:px-3 flex flex-row gap-2.5 justify-between items-stretch overflow-hidden">
            
            {/* ========================================================================= */}
            {/* COLUMN 1 (LEFT): Drama Info & More Like This (Zero Gap, 2D Flat)          */}
            {/* ========================================================================= */}
            <section className="flex-1 min-w-[320px] max-w-[560px] 2xl:max-w-[640px] h-full overflow-y-auto custom-scrollbar flex flex-col border border-zinc-800 rounded-xl bg-transparent divide-y divide-zinc-800 order-1">
              
              {/* 1. Drama Header & Meta Info Block (Clean, Modern Hero Card with Poster) */}
              <div className="p-4 sm:p-5 flex flex-col gap-3.5 bg-transparent">
                
                {/* Top Action Row: Back to Shorts & Controls */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <Link
                    href="/shorts"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-primary group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Shorts</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {/* Auto-advance Next Episode */}
                    <button
                      onClick={() => setAutoAdvance(prev => !prev)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        autoAdvance
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                      title="Auto-play Next Episode on finish"
                    >
                      <RotateCcw className={cn("w-3.5 h-3.5", autoAdvance && "text-emerald-400")} />
                      <span className="text-[11px]">Auto Next</span>
                    </button>

                    {/* Watchlist Bookmark Button */}
                    <button
                      onClick={toggleWatchlist}
                      disabled={isWatchlistLoading}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                        watchlistStatus
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      )}
                      title={watchlistStatus ? "In Watchlist" : "Add to Watchlist"}
                    >
                      {watchlistStatus ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">{watchlistStatus ? "Saved" : "Watchlist"}</span>
                    </button>

                    {/* Like Button */}
                    <button
                      onClick={toggleLike}
                      className={cn(
                        "p-1.5 rounded-lg border transition-all",
                        isLiked 
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                          : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      )}
                      title={isLiked ? "Unlike" : "Add to Favorites"}
                    >
                      <Heart className={cn("w-4 h-4", isLiked && "fill-rose-500")} />
                    </button>

                    {/* Share Drama Button */}
                    <button
                      onClick={handleShare}
                      className="p-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                      title="Share Drama"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Keyboard Shortcuts helper (?) */}
                    <button
                      onClick={() => setShowShortcutsModal(true)}
                      className="p-1.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-white transition-all"
                      title="Keyboard Shortcuts (?)"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Hero Card: Poster + Drama Details */}
                <div className="flex gap-3.5 items-start">
                  {/* Poster Thumbnail */}
                  <div className="relative w-24 sm:w-28 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-xl group">
                    <img
                      src={drama.poster || drama.cover}
                      alt={displayTitle}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Rating Badge on Poster */}
                    {drama.rating && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold font-mono flex items-center gap-1 shadow-md">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{drama.rating}</span>
                      </div>
                    )}

                    {/* Episode Count Tag on Poster Bottom */}
                    <div className="absolute bottom-1.5 inset-x-1.5 text-center pointer-events-none">
                      <span className="px-1 py-0.5 rounded bg-black/85 backdrop-blur-md text-[9px] font-mono font-bold text-zinc-300 border border-white/10 block truncate">
                        {drama.totalEpisodes} Eps
                      </span>
                    </div>
                  </div>

                  {/* Core Details Beside Poster */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Badges Line: Language & Current Ep Indicator */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">
                        {displayLanguage}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-mono">
                        Ep {currentEpNum} / {drama.totalEpisodes}
                      </span>
                      {drama.releaseYear && (
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                          {drama.releaseYear}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h1 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2 tracking-tight">
                      {displayTitle}
                    </h1>

                    {/* Genre Tags */}
                    {cleanTags && cleanTags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {cleanTags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-2 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Synopsis Block */}
                <div className="text-xs text-zinc-400 leading-relaxed pt-1 border-t border-zinc-800/60">
                  <p className={cn(!isDescExpanded && "line-clamp-2 md:line-clamp-3")}>
                    {displayDesc}
                  </p>
                  {displayDesc && displayDesc.length > 130 && (
                    <button
                      onClick={() => setIsDescExpanded(prev => !prev)}
                      className="text-primary text-xs font-semibold mt-1 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isDescExpanded ? "Show Less" : "Read More"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Recommended Short Dramas (Zero Gap, flush below Info block) */}
              {drama.recommendations && drama.recommendations.length > 0 && (
                <div className="p-4 sm:p-5 flex flex-col gap-3 bg-transparent">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-lemon tracking-wider uppercase">
                      <Flame className="w-3.5 h-3.5 text-primary" />
                      <span>More Like This</span>
                    </h3>
                    <Link href="/shorts" className="text-[11px] text-primary font-semibold hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {drama.recommendations.slice(0, 4).map((rec, rIdx) => (
                      <Link
                        key={`${rec.id}_${rIdx}`}
                        href={`/shorts/watch?id=${encodeURIComponent(rec.id)}&ep=1`}
                        className="group block"
                      >
                        <div className="aspect-[9/16] rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 relative hover:border-zinc-600 transition-colors">
                          <img
                            src={rec.cover}
                            alt={rec.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                          
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary text-white">
                              {rec.language}
                            </span>
                          </div>

                          <div className="absolute bottom-1.5 inset-x-1.5">
                            <h4 className="text-[11px] font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors">
                              {rec.title}
                            </h4>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {rec.totalEpisodes} Eps
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ========================================================================= */}
            {/* COLUMN 2 (CENTER): Fixed 9:16 Vertical Player (2D Flat, Symmetrical)      */}
            {/* ========================================================================= */}
            <section className="shrink-0 flex flex-col items-center justify-center h-full relative z-20 order-2">
              
              {/* 9:16 Video Player Container (Strict vertical aspect ratio, 2D flat, Auto-fit on Fullscreen) */}
              <div 
                ref={playerFrameRef}
                onMouseMove={resetControlsTimer}
                onMouseEnter={resetControlsTimer}
                onMouseLeave={() => {
                  if (!showSettingsMenu && !showCcModal && !isVolumeHovered) {
                    setControlsVisible(false);
                  }
                }}
                className={cn(
                  "relative bg-black flex flex-col select-none mx-auto transition-all duration-150",
                  isFullscreen
                    ? "fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none border-none aspect-auto overflow-hidden z-[9999]"
                    : "h-full aspect-[9/16] w-auto max-h-full rounded-xl border border-zinc-800 overflow-hidden group"
                )}
              >
                {/* Top Video Badges (Hover Only) */}
                <div className={cn(
                  "absolute inset-x-2.5 z-30 flex items-center justify-between pointer-events-none transition-opacity duration-200",
                  isFullscreen ? "top-5 px-4" : "top-2.5",
                  controlsVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/90 border border-zinc-800 text-zinc-300 font-mono">
                    Ep {currentEpNum}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isLooping && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Looping
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary border border-primary text-white">
                      {displayLanguage}
                    </span>
                  </div>
                </div>

                {/* Video Player */}
                <div 
                  onClick={togglePlayPause}
                  className="relative w-full h-full flex items-center justify-center cursor-pointer bg-black overflow-hidden"
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted={isMuted}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        const ct = videoRef.current.currentTime;
                        const dur = videoRef.current.duration || 0;
                        setProgress(ct);
                        setDuration(dur);
                        syncContinueWatching(ct, dur > 0 && ct >= dur * 0.9);
                      }
                    }}
                    onEnded={() => {
                      if (videoRef.current) {
                        syncContinueWatching(videoRef.current.duration || 0, true);
                      }
                      if (isLooping) {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                        }
                      } else if (autoAdvance) {
                        goToNextEpisode();
                      }
                    }}
                    onWaiting={() => setIsLoadingVideo(true)}
                    onPlaying={() => {
                      setIsLoadingVideo(false);
                      setIsPlaying(true);
                    }}
                    onLoadedData={() => {
                      setIsLoadingVideo(false);
                      setVideoError(null);
                    }}
                    onCanPlay={() => {
                      setIsLoadingVideo(false);
                      setVideoError(null);
                    }}
                    onError={() => {
                      setIsLoadingVideo(false);
                      setVideoError('Unable to load video stream. Click Reload Stream to retry.');
                    }}
                    className={cn(
                      "w-full h-full transition-all duration-150",
                      isFullscreen
                        ? "object-contain"
                        : (aspectFit === 'cover' ? "object-cover" : "object-contain")
                    )}
                  />

                  {/* Subtitles Overlay (Standard Shorts Position ~22% from bottom, Respects CC BG Enabled & Opacity) */}
                  {isCcActive && currentSubtitleCue && (
                    <div 
                      className={cn(
                        "absolute inset-x-4 flex justify-center text-center pointer-events-none z-20 transition-all duration-150",
                        isFullscreen ? "bottom-[14%] sm:bottom-[16%]" : "bottom-[22%]"
                      )}
                      style={{ transform: `translateY(${-ccPositionY}px)` }}
                    >
                      <motion.div
                        key={currentSubtitleCue}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          backgroundColor: ccBgEnabled ? (ccStyle === 'box' ? `rgba(69, 26, 3, ${ccBgOpacity})` : `rgba(0, 0, 0, ${ccBgOpacity})`) : 'transparent',
                          borderColor: ccBgEnabled && ccBgOpacity > 0 ? `rgba(255, 255, 255, ${Math.min(0.25, ccBgOpacity * 0.3)})` : 'transparent',
                          backdropFilter: ccBgEnabled && ccBgOpacity > 0 ? `blur(${Math.max(4, Math.round(ccBgOpacity * 24))}px)` : 'none',
                          WebkitBackdropFilter: ccBgEnabled && ccBgOpacity > 0 ? `blur(${Math.max(4, Math.round(ccBgOpacity * 24))}px)` : 'none',
                          boxShadow: ccBgEnabled && ccBgOpacity > 0.1 ? '0 4px 24px rgba(0,0,0,0.45)' : 'none',
                        }}
                        className={cn(
                          "px-4 py-2 rounded-2xl max-w-[88%] font-medium tracking-wide leading-snug transition-all",
                          ccBgEnabled && ccBgOpacity > 0 && "border",
                          ccSize === 'sm' && "text-xs",
                          ccSize === 'base' && "text-xs sm:text-sm",
                          ccSize === 'lg' && "text-sm sm:text-base font-bold",
                          (!ccBgEnabled || ccBgOpacity === 0)
                            ? "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_0_2px_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]"
                            : ccStyle === 'glass'
                              ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_0_2px_rgba(0,0,0,0.9)]"
                              : ccStyle === 'box'
                                ? "text-amber-200 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
                                : "text-white [-webkit-text-stroke:0.75px_black] [text-shadow:0_1px_4px_#000]"
                        )}
                      >
                        {currentSubtitleCue}
                      </motion.div>
                    </div>
                  )}

                  {/* Loading Spinner */}
                  {isLoadingVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 pointer-events-none">
                      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}

                  {/* Big Center Play/Pause Flash */}
                  <AnimatePresence>
                    {!isPlaying && !isLoadingVideo && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute w-14 h-14 rounded-full bg-black/80 border border-zinc-700 text-white flex items-center justify-center pointer-events-none z-20"
                      >
                        <Play className="w-7 h-7 ml-0.5 fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Center Flash Feedback Pill */}
                  <AnimatePresence>
                    {flashFeedback && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="absolute px-3 py-1.5 rounded-lg bg-black/90 border border-zinc-800 text-white text-xs font-mono font-bold tracking-wider z-40 pointer-events-none"
                      >
                        {flashFeedback}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Banner */}
                  {videoError && (
                    <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-zinc-950 border border-red-500/40 text-center z-30">
                      <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1.5" />
                      <p className="text-xs text-white font-medium">{videoError}</p>
                      <button
                        onClick={() => selectEpisode(currentEpNum)}
                        className="mt-2 px-3 py-1 rounded bg-primary text-white text-xs font-bold"
                      >
                        Reload Stream
                      </button>
                    </div>
                  )}
                </div>

                {/* Left Inside Controls: Up / Down Arrow Icons to Switch Episode (Hover Only, 2D Flat) */}
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 transition-opacity duration-200",
                  isFullscreen ? "left-5" : "left-2.5",
                  controlsVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                )}>
                  <button
                    onClick={goToPrevEpisode}
                    disabled={currentEpNum <= 1}
                    className="w-8 h-8 rounded-lg bg-black/80 border border-zinc-800 text-zinc-300 flex items-center justify-center hover:border-zinc-600 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Previous Episode (↑ / Scroll Up)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <div className="px-2 py-0.5 rounded bg-black/90 border border-zinc-800 text-[9px] font-mono font-bold text-zinc-300">
                    {currentEpNum}
                  </div>

                  <button
                    onClick={goToNextEpisode}
                    disabled={currentEpNum >= drama.totalEpisodes}
                    className="w-8 h-8 rounded-lg bg-black/80 border border-zinc-800 text-zinc-300 flex items-center justify-center hover:border-zinc-600 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Next Episode (↓ / Scroll Down)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Inside Controls: Minimal Desktop Bar (CC, Volume, Settings, Fullscreen - Others organized inside Settings) */}
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 transition-opacity duration-200",
                  isFullscreen ? "right-5" : "right-2.5",
                  controlsVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                )}>
                  {/* CC Subtitles Toggle */}
                  <button
                    onClick={() => {
                      setShowCcModal(prev => !prev);
                      setShowSettingsMenu(false);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shadow-md",
                      isCcActive && ccLanguage !== 'off'
                        ? "bg-primary text-white border-primary"
                        : "bg-black/80 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600"
                    )}
                    title="Subtitles / Closed Captions"
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>

                  {/* Volume / Mute with Hover Slider */}
                  <div 
                    className="relative flex items-center"
                    onMouseEnter={() => setIsVolumeHovered(true)}
                    onMouseLeave={() => setIsVolumeHovered(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 rounded-lg bg-black/80 border border-zinc-800 text-zinc-300 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-colors shadow-md"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-amber-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isVolumeHovered && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 65, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="absolute right-9 bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-800 flex items-center z-40 shadow-xl"
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-12 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-primary"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Settings Gear */}
                  <button
                    onClick={() => {
                      setShowSettingsMenu(prev => !prev);
                      setShowCcModal(false);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shadow-md",
                      showSettingsMenu
                        ? "bg-zinc-800 text-white border-zinc-600"
                        : "bg-black/80 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600"
                    )}
                    title="Playback Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 rounded-lg bg-black/80 border border-zinc-800 text-zinc-300 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-colors shadow-md"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>

                {/* Bottom Control Suite: Timeline Progress Bar (Hover Only, Transparent Blurred Floating Controls) */}
                <div 
                  className={cn(
                    "absolute bottom-0 inset-x-0 p-3 pt-8 pb-3 z-30 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col gap-2 transition-opacity duration-200 pointer-events-auto",
                    controlsVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  )}
                >
                  <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
                    {/* Timeline Progress Bar with Active Fill */}
                    <div className="flex items-center gap-2 text-[10px] text-white/90 font-mono [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                      <span className="w-8 text-right select-none">{formatTime(progress)}</span>
                      <div className="relative flex-1 flex items-center h-4 cursor-pointer group/slider">
                        {/* Background Base Track */}
                        <div className="absolute inset-x-0 h-1 group-hover/slider:h-1.5 rounded-full bg-white/20 transition-all overflow-hidden pointer-events-none">
                          {/* Filled Progress Bar */}
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-75"
                            style={{ width: `${Math.min(100, Math.max(0, (progress / (duration || 1)) * 100))}%` }}
                          />
                        </div>

                        {/* Native range input overlay */}
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          value={progress}
                          onChange={handleSeek}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          aria-label="Seek Video"
                        />

                        {/* Visible Scrubber Thumb following the fill */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-[0_0_8px_rgba(220,38,38,0.7)] pointer-events-none transition-transform group-hover/slider:scale-125 z-10"
                          style={{ left: `${Math.min(100, Math.max(0, (progress / (duration || 1)) * 100))}%` }}
                        />
                      </div>
                      <span className="w-8 text-left select-none">{formatTime(duration)}</span>
                    </div>

                    {/* Bottom Control Row */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => seekBy(-10)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all active:scale-95 shadow-md"
                        title="Rewind 10s"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-primary hover:bg-primary-600 text-white shadow-[0_0_14px_rgba(220,38,38,0.5)] border border-primary-400/30 transition-all active:scale-95"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>

                      <button
                        onClick={() => seekBy(10)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all active:scale-95 shadow-md"
                        title="Forward 10s"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CC Subtitles Customizer Popover (2D Flat) */}
                <AnimatePresence>
                  {showCcModal && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute bottom-16 right-2 w-64 max-h-[80vh] overflow-y-auto custom-scrollbar bg-zinc-950 border border-zinc-800 rounded-xl p-3 z-50 flex flex-col gap-2.5 text-xs shadow-2xl"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Subtitles className="w-3.5 h-3.5 text-primary" />
                          <span>Closed Captions</span>
                        </span>
                        <button 
                          onClick={() => setShowCcModal(false)}
                          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* CC Submenu Tabs: Language vs Config */}
                      <div className="grid grid-cols-2 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold">
                        <button
                          onClick={() => setCcActiveTab('language')}
                          className={cn(
                            "py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1.5",
                            ccActiveTab === 'language'
                              ? "bg-zinc-800 text-white shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200"
                          )}
                        >
                          <Languages className="w-3 h-3" />
                          <span>Language</span>
                        </button>
                        <button
                          onClick={() => setCcActiveTab('config')}
                          className={cn(
                            "py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1.5",
                            ccActiveTab === 'config'
                              ? "bg-zinc-800 text-white shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200"
                          )}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Config</span>
                        </button>
                      </div>

                      {/* Tab 1: Language Selection */}
                      {ccActiveTab === 'language' && (
                        <div className="flex flex-col gap-2 pt-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Select Language</span>
                            {isCcActive && ccLanguage !== 'off' && (
                              <span className="text-[9px] text-emerald-400 font-mono font-semibold">Active</span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 font-medium">
                            {[
                              { id: 'en', label: 'English 🇺🇸' },
                              { id: 'hi', label: 'Hindi 🇮🇳' },
                              { id: 'zh', label: 'Chinese 🇨🇳' },
                              { id: 'es', label: 'Spanish 🇪🇸' },
                            ].map((lang) => (
                              <button
                                key={lang.id}
                                onClick={() => {
                                  setCcLanguage(lang.id as any);
                                  setIsCcActive(true);
                                }}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-lg text-[10px] text-left transition-colors flex items-center justify-between border",
                                  ccLanguage === lang.id && isCcActive
                                    ? "bg-primary text-white font-bold border-primary shadow-sm"
                                    : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                )}
                              >
                                <span>{lang.label}</span>
                                {ccLanguage === lang.id && isCcActive && <Check className="w-3 h-3 text-white" />}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setCcLanguage('off');
                              setIsCcActive(false);
                            }}
                            className={cn(
                              "w-full py-1.5 rounded-lg text-[10px] font-bold text-center transition-colors border",
                              !isCcActive || ccLanguage === 'off'
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            )}
                          >
                            Turn Off Captions
                          </button>

                          <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500">Styling & position?</span>
                            <button
                              onClick={() => setCcActiveTab('config')}
                              className="text-primary hover:underline font-bold flex items-center gap-0.5"
                            >
                              <span>Config Tab</span>
                              <span>&rarr;</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Config / CC Settings */}
                      {ccActiveTab === 'config' && (
                        <div className="flex flex-col gap-2 pt-0.5">
                          {(!isCcActive || ccLanguage === 'off') && (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex items-center justify-between">
                              <span>Captions are currently off</span>
                              <button
                                onClick={() => {
                                  setCcLanguage('en');
                                  setIsCcActive(true);
                                }}
                                className="text-white bg-amber-600/70 hover:bg-amber-600 px-2 py-0.5 rounded text-[9px] font-bold transition-colors"
                              >
                                Enable
                              </button>
                            </div>
                          )}

                          {/* Font Size */}
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-mono">Font Size</span>
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center font-mono">
                              {[
                                { id: 'sm', label: 'Small' },
                                { id: 'base', label: 'Med' },
                                { id: 'lg', label: 'Large' },
                              ].map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => setCcSize(s.id as any)}
                                  className={cn(
                                    "py-1 rounded border transition-colors",
                                    ccSize === s.id
                                      ? "bg-primary border-primary text-white"
                                      : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
                                  )}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Style */}
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-mono">Style</span>
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center font-mono">
                              {[
                                { id: 'glass', label: 'Solid' },
                                { id: 'box', label: 'Gold' },
                                { id: 'outline', label: 'Text' },
                              ].map(st => (
                                <button
                                  key={st.id}
                                  onClick={() => setCcStyle(st.id as any)}
                                  className={cn(
                                    "py-1 rounded border transition-colors",
                                    ccStyle === st.id
                                      ? "bg-primary border-primary text-white"
                                      : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
                                  )}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CC Background & Opacity Controls */}
                          <div className="pt-1.5 border-t border-zinc-800 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">CC Background</span>
                              <button
                                onClick={() => {
                                  const next = !ccBgEnabled;
                                  setCcBgEnabled(next);
                                  try { localStorage.setItem('shadow_shorts_cc_bg', String(next)); } catch {}
                                }}
                                className={cn(
                                  "w-7 h-3.5 rounded-full p-0.5 transition-colors border flex items-center",
                                  ccBgEnabled ? "bg-primary border-primary justify-end" : "bg-zinc-900 border-zinc-800 justify-start"
                                )}
                                title="Toggle Subtitle Background"
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                              </button>
                            </div>

                            {ccBgEnabled && (
                              <div className="flex flex-col gap-1.5 mt-0.5">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-zinc-500">Opacity</span>
                                  <span className="text-primary font-bold">{Math.round(ccBgOpacity * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={ccBgOpacity}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setCcBgOpacity(val);
                                    try { localStorage.setItem('shadow_shorts_cc_opacity', String(val)); } catch {}
                                  }}
                                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                                <div className="grid grid-cols-5 gap-1 text-[9px] font-mono font-bold text-center">
                                  {[0, 0.25, 0.5, 0.75, 1.0].map((preset) => (
                                    <button
                                      key={preset}
                                      onClick={() => {
                                        setCcBgOpacity(preset);
                                        try { localStorage.setItem('shadow_shorts_cc_opacity', String(preset)); } catch {}
                                      }}
                                      className={cn(
                                        "py-0.5 rounded border transition-colors",
                                        Math.abs(ccBgOpacity - preset) < 0.05
                                          ? "bg-primary border-primary text-white"
                                          : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
                                      )}
                                    >
                                      {preset === 0 ? "0%" : `${Math.round(preset * 100)}%`}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Caption Vertical Position Slider (Upward / Downward, default 0) */}
                          <div className="pt-1.5 border-t border-zinc-800 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Position (Y)</span>
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "text-[10px] font-mono font-bold",
                                  ccPositionY === 0 ? "text-zinc-400" : ccPositionY > 0 ? "text-emerald-400" : "text-amber-400"
                                )}>
                                  {ccPositionY === 0 ? "0 (Default)" : ccPositionY > 0 ? `+${ccPositionY}px (Up)` : `${ccPositionY}px (Down)`}
                                </span>
                                {ccPositionY !== 0 && (
                                  <button
                                    onClick={() => handleCcPositionChange(0)}
                                    className="text-[9px] text-zinc-400 hover:text-white px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 font-mono transition-colors"
                                    title="Reset position to 0"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-500 font-mono">Down</span>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                step="2"
                                value={ccPositionY}
                                onChange={(e) => handleCcPositionChange(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary"
                              />
                              <span className="text-[9px] text-zinc-500 font-mono">Up</span>
                            </div>

                            <div className="grid grid-cols-5 gap-1 text-[9px] font-mono font-bold text-center">
                              {[-40, -20, 0, 20, 40].map((preset) => (
                                <button
                                  key={preset}
                                  onClick={() => handleCcPositionChange(preset)}
                                  className={cn(
                                    "py-0.5 rounded border transition-colors",
                                    ccPositionY === preset
                                      ? "bg-primary border-primary text-white"
                                      : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
                                  )}
                                >
                                  {preset === 0 ? "0" : preset > 0 ? `+${preset}` : preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Settings Popover (2D Flat, Comprehensive Options) */}
                <AnimatePresence>
                  {showSettingsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute bottom-16 right-2 w-60 max-h-[75vh] overflow-y-auto custom-scrollbar bg-zinc-950 border border-zinc-800 rounded-xl p-3 z-50 flex flex-col gap-2.5 text-xs shadow-2xl"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-primary" />
                          <span>Playback Settings</span>
                        </span>
                        <button 
                          onClick={() => setShowSettingsMenu(false)}
                          className="p-1 rounded text-zinc-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Speed Presets */}
                      <div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-mono">Speed</span>
                        <div className="grid grid-cols-3 gap-1 font-mono font-bold text-center text-[10px]">
                          {SPEED_OPTIONS.map((spd) => (
                            <button
                              key={spd}
                              onClick={() => setPlaybackSpeed(spd)}
                              className={cn(
                                "py-1 rounded border transition-colors",
                                playbackSpeed === spd
                                  ? "bg-primary text-white border-primary"
                                  : "bg-transparent text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-white"
                              )}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Display Mode */}
                      <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300 font-medium text-[11px]">Display Mode</span>
                        <button
                          onClick={toggleAspectFit}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-200 font-mono text-[10px] transition-colors"
                        >
                          {aspectFit === 'contain' ? 'Fit (Letterbox)' : 'Fill (9:16)'}
                        </button>
                      </div>

                      {/* Picture in Picture (PiP) */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <PictureInPicture2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-300 font-medium text-[11px]">Picture-in-Picture</span>
                        </div>
                        <button
                          onClick={togglePiP}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 font-mono text-[10px] transition-colors"
                        >
                          Launch PiP
                        </button>
                      </div>

                      {/* Share Episode */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-300 font-medium text-[11px]">Share Episode</span>
                        </div>
                        <button
                          onClick={handleShare}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 font-mono text-[10px] transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>

                      {/* Loop Toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <span className="text-zinc-300 font-medium text-[11px]">Loop Episode</span>
                        <button
                          onClick={() => setIsLooping(prev => !prev)}
                          className={cn(
                            "w-8 h-4 rounded-full p-0.5 transition-colors border flex items-center",
                            isLooping ? "bg-primary border-primary justify-end" : "bg-zinc-900 border-zinc-800 justify-start"
                          )}
                        >
                          <span className="w-3 h-3 rounded-full bg-white" />
                        </button>
                      </div>

                      {/* Auto-Advance Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300 font-medium text-[11px]">Auto-Play Next</span>
                        <button
                          onClick={() => setAutoAdvance(prev => !prev)}
                          className={cn(
                            "w-8 h-4 rounded-full p-0.5 transition-colors border flex items-center",
                            autoAdvance ? "bg-emerald-500 border-emerald-500 justify-end" : "bg-zinc-900 border-zinc-800 justify-start"
                          )}
                        >
                          <span className="w-3 h-3 rounded-full bg-white" />
                        </button>
                      </div>

                      {/* Clear Mode (Mobile UI) Toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <div className="flex flex-col">
                          <span className="text-zinc-300 font-medium text-[11px]">Clear Mode</span>
                          <span className="text-[9px] text-zinc-500">Auto-hide mobile controls</span>
                        </div>
                        <button
                          onClick={toggleClearMode}
                          className={cn(
                            "w-8 h-4 rounded-full p-0.5 transition-colors border flex items-center",
                            clearModeEnabled ? "bg-primary border-primary justify-end" : "bg-zinc-900 border-zinc-800 justify-start"
                          )}
                          title="Toggle Clear Mode (Auto-hide)"
                        >
                          <span className="w-3 h-3 rounded-full bg-white" />
                        </button>
                      </div>

                      {/* Tap to Play/Pause Toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <div className="flex flex-col">
                          <span className="text-zinc-300 font-medium text-[11px]">Tap to Play/Pause</span>
                          <span className="text-[9px] text-zinc-500">Tap screen toggles play & UI</span>
                        </div>
                        <button
                          onClick={() => {
                            const next = !tapPlayPauseEnabled;
                            setTapPlayPauseEnabled(next);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('shadow_tap_play_pause', String(next));
                              window.dispatchEvent(new CustomEvent('shadow-tap-play-pause-changed', { detail: { enabled: next } }));
                            }
                          }}
                          className={cn(
                            "w-8 h-4 rounded-full p-0.5 transition-colors border flex items-center",
                            tapPlayPauseEnabled ? "bg-primary border-primary justify-end" : "bg-zinc-900 border-zinc-800 justify-start"
                          )}
                          title="Toggle Tap to Play/Pause"
                        >
                          <span className="w-3 h-3 rounded-full bg-white" />
                        </button>
                      </div>

                      {/* Shortcuts Modal Trigger */}
                      <div className="pt-1 border-t border-zinc-800">
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false);
                            setShowShortcutsModal(true);
                          }}
                          className="w-full py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Keyboard Shortcuts (?)</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* COLUMN 3 (RIGHT): Episodes & Comments Directly Underneath (Zero Gap, 2D)  */}
            {/* ========================================================================= */}
            <section className="flex-1 min-w-[320px] max-w-[560px] 2xl:max-w-[640px] h-full overflow-y-auto custom-scrollbar flex flex-col border border-zinc-800 rounded-xl bg-transparent divide-y divide-zinc-800 order-3">
              
              {/* Block 1: Episodes Block (All Episodes in 1 Tab) */}
              <div className="flex flex-col bg-transparent shrink-0">
                
                {/* Episodes Block Header */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-zinc-800 bg-transparent shrink-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-black text-white flex items-center gap-2 uppercase text-xs font-lemon tracking-widest">
                      <Layers size={16} className="text-primary" /> Episodes
                    </h3>
                    <span className="border border-zinc-800 text-zinc-300 font-mono font-bold text-[10px] px-2.5 h-5 rounded flex items-center">
                      {drama.totalEpisodes}
                    </span>
                  </div>

                  {/* View Mode Switcher: Compact, Grid, List (2D Flat) */}
                  <div className="flex items-center gap-1 bg-transparent p-0.5 rounded-lg border border-zinc-800">
                    {[
                      { mode: 'compact', icon: Grid, label: 'Compact' },
                      { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
                      { mode: 'list', icon: List, label: 'List' },
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => setEpViewMode(mode as any)}
                        className={cn(
                          "p-1.5 rounded transition-colors flex items-center justify-center",
                          epViewMode === mode ? "bg-primary text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                        )}
                        title={label}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search & Jump bar */}
                <div className="p-2.5 sm:px-4 border-b border-zinc-800 flex items-center justify-between gap-2.5 shrink-0 bg-transparent">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      placeholder="Jump to ep..."
                      className="w-full bg-transparent border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
                    />
                  </div>
                  {episodeSearch && (
                    <button
                      onClick={() => setEpisodeSearch('')}
                      className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-800 hover:bg-zinc-900 font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Episodes Grid Scroll Area (All Episodes in 1 Tab) */}
                <div 
                  ref={episodesContainerRef}
                  className="max-h-[280px] 2xl:max-h-[340px] overflow-y-auto p-2.5 custom-scrollbar overflow-x-hidden"
                >
                  <div
                    className={cn(
                      "grid transition-all",
                      epViewMode === 'grid' ? "grid-cols-5 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-8 gap-1.5" :
                      epViewMode === 'compact' ? "grid-cols-8 sm:grid-cols-10 xl:grid-cols-12 gap-1" :
                      "grid-cols-1 gap-1.5"
                    )}
                  >
                    {displayedEpisodes.map((ep) => {
                      const epNum = ep.episodeNumber;
                      const isCurrent = epNum === currentEpNum;
                      const isPlayed = playedEpNumbers.has(epNum) && !isCurrent;

                      return (
                        <EpisodeButton
                          key={epNum}
                          epNum={epNum}
                          isCurrent={isCurrent}
                          isPlayed={isPlayed}
                          viewMode={epViewMode}
                          onClick={selectEpisode}
                        />
                      );
                    })}
                  </div>

                  {displayedEpisodes.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                      No episodes found matching "{episodeSearch}"
                    </div>
                  )}
                </div>
              </div>

              {/* Block 2: Comments Section Directly Under Episodes (Zero Gap) */}
              <div className="p-3.5 sm:p-4 flex flex-col gap-3 bg-transparent">
                <ShadowComments 
                  episodeId={`shorts-${drama.id}-ep-${currentEpNum}`} 
                  compact={true} 
                  themeColor="shorts"
                />
              </div>
            </section>
          </div>

          {/* Audio bar keyframe animation styles */}
          <style jsx>{`
            @keyframes audio-bar-1 { 0%, 100% { height: 3px; } 50% { height: 11px; } }
            @keyframes audio-bar-2 { 0%, 100% { height: 9px; } 50% { height: 3px; } }
            @keyframes audio-bar-3 { 0%, 100% { height: 5px; } 50% { height: 12px; } }
          `}</style>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcutsModal(false)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-zinc-950 border border-zinc-800 p-5 text-white flex flex-col gap-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Player Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { key: 'Space', desc: 'Play / Pause video' },
                  { key: '↑ / ↓', desc: 'Previous / Next episode' },
                  { key: '← / →', desc: 'Rewind / Forward 10 seconds' },
                  { key: 'M', desc: 'Mute / Unmute audio' },
                  { key: 'C', desc: 'Toggle CC Subtitles' },
                  { key: 'F', desc: 'Toggle Fullscreen' },
                  { key: 'P', desc: 'Picture-in-Picture mode' },
                  { key: 'L', desc: 'Toggle Repeat / Loop Episode' },
                  { key: '?', desc: 'Toggle this shortcuts modal' },
                ].map((sc, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400">{sc.desc}</span>
                    <kbd className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 font-mono text-[10px] font-bold text-primary">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-full py-2 rounded-xl bg-primary text-white font-bold text-xs mt-2"
              >
                Got It
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Drawer Modal (Sheet for Mobile & Quick Jump) */}
      <EpisodeDrawerModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drama.title}
        totalEpisodes={drama.totalEpisodes}
        episodes={drama.episodes}
        currentEpisode={currentEpNum}
        playedEpisodes={playedEpNumbers}
        onSelectEpisode={selectEpisode}
      />

      {/* Mobile Comments Drawer Modal (YouTube Shorts style slide-up sheet with swipe gestures) */}
      <AnimatePresence>
        {isCommentsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeCommentsDrawer}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto"
            />

            {/* Slide-up Sheet with Dynamic Height Snap Points */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ 
                y: 0,
                height: commentsSnapState === 'full' ? '92vh' : '60vh'
              }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="relative w-full max-w-lg mx-auto bg-zinc-950/98 backdrop-blur-2xl border-t border-zinc-800 rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.85)] flex flex-col z-10 overflow-hidden pointer-events-auto transition-[height] duration-250 ease-out"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle & Gesture Header Area (Swipe up for full screen, swipe down to collapse/close) */}
              <div 
                className="w-full pt-2.5 pb-1 px-4 flex flex-col items-center touch-none cursor-grab active:cursor-grabbing select-none shrink-0 bg-zinc-950/90"
                onTouchStart={(e) => {
                  commentsTouchStartY.current = e.touches[0].clientY;
                }}
                onTouchEnd={(e) => {
                  const endY = e.changedTouches[0].clientY;
                  const diff = endY - commentsTouchStartY.current;
                  if (diff < -45) {
                    setCommentsSnapState('full');
                  } else if (diff > 50) {
                    if (commentsSnapState === 'full') {
                      setCommentsSnapState('half');
                    } else {
                      closeCommentsDrawer();
                    }
                  }
                }}
              >
                {/* Pull Handle Pill */}
                <div 
                  onClick={() => setCommentsSnapState(prev => prev === 'full' ? 'half' : 'full')}
                  className="w-12 h-1.5 bg-zinc-600/80 hover:bg-zinc-400 rounded-full mx-auto transition-colors cursor-pointer" 
                  title={commentsSnapState === 'full' ? "Tap to collapse" : "Tap to expand"}
                />
              </div>

              {/* Comments Content Scrollable Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
                <ShadowComments 
                  episodeId={`shorts-${drama.id}-ep-${currentEpNum}`} 
                  compact={true} 
                  onClose={closeCommentsDrawer}
                  onToggleSnap={() => setCommentsSnapState(prev => prev === 'full' ? 'half' : 'full')}
                  isSnappedFull={commentsSnapState === 'full'}
                  themeColor="shorts"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile More Options Drawer Modal (YouTube Shorts style bottom sheet) */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
              className="relative w-full max-w-lg mx-auto bg-zinc-950/98 backdrop-blur-2xl border-t border-zinc-800 rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.85)] flex flex-col max-h-[85vh] z-10 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle & Header */}
              <div className="w-full pt-3 pb-2 px-5 flex flex-col items-center shrink-0 border-b border-zinc-800/80 bg-zinc-950/80">
                <div 
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="w-12 h-1.5 bg-zinc-700/80 hover:bg-zinc-500 rounded-full mx-auto mb-3 cursor-pointer transition-colors" 
                />
                <div className="w-full flex items-center justify-between">
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-primary shrink-0" />
                      Playback & Controls
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium truncate">
                      {drama.title} · Ep {currentEpNum}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
                    aria-label="Close Options"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Options Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Quick Action Grid: Watchlist & Aspect Ratio */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Save to Watchlist */}
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={() => {
                      toggleWatchlist();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left",
                      watchlistStatus 
                        ? "bg-primary/15 border-primary/40 text-primary" 
                        : "bg-zinc-900/80 border-zinc-800/80 hover:bg-zinc-850 text-zinc-200"
                    )}
                  >
                    <Bookmark className={cn("w-5 h-5 shrink-0", watchlistStatus && "fill-current")} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">
                        {watchlistStatus ? 'In Watchlist' : 'Save to Watchlist'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {watchlistStatus ? 'Saved to library' : 'Watch later'}
                      </span>
                    </div>
                  </motion.button>

                  {/* Display Mode Aspect Ratio */}
                  <motion.button
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileTap="tap"
                    onClick={() => {
                      toggleAspectFit();
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:bg-zinc-850 text-zinc-200 transition-all text-left"
                  >
                    {aspectFit === 'contain' ? (
                      <Minimize className="w-5 h-5 text-zinc-400 shrink-0" />
                    ) : (
                      <Maximize className="w-5 h-5 text-primary shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">
                        Display: {aspectFit === 'contain' ? 'Fit' : 'Fill (9:16)'}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        Tap for {aspectFit === 'contain' ? '9:16 Full' : 'Fit Letterbox'}
                      </span>
                    </div>
                  </motion.button>
                </div>

                {/* Playback Speed */}
                <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <FastForward className="w-3.5 h-3.5 text-primary" />
                      Playback Speed
                    </span>
                    <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {playbackSpeed}x
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 font-mono text-center">
                    {SPEED_OPTIONS.map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                          playbackSpeed === spd
                            ? "bg-primary text-white border-primary shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                            : "bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-white"
                        )}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitles & Captions (CC) */}
                <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Subtitles className="w-3.5 h-3.5 text-primary" />
                      Captions (CC)
                    </span>
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setShowCcModal(true);
                      }}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Style & Position
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                    {[
                      { id: 'off', label: 'Off' },
                      { id: 'en', label: 'English' },
                      { id: 'hi', label: 'Hindi' },
                      { id: 'zh', label: 'Chinese' },
                      { id: 'es', label: 'Spanish' },
                    ].map((item) => {
                      const isActive = (!isCcActive && item.id === 'off') || (isCcActive && ccLanguage === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'off') {
                              setIsCcActive(false);
                              setCcLanguage('off');
                            } else {
                              setIsCcActive(true);
                              setCcLanguage(item.id as any);
                            }
                          }}
                          className={cn(
                            "py-2 rounded-xl font-medium border transition-all active:scale-95 truncate px-1",
                            isActive
                              ? "bg-primary text-white border-primary font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                              : "bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-white"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quality */}
                <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800/70">
                  <span className="text-xs font-bold text-zinc-300 block mb-2">Stream Quality</span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuality(q)}
                        className={cn(
                          "py-2 px-3 rounded-xl font-medium border text-left transition-all active:scale-95 flex items-center justify-between",
                          selectedQuality === q
                            ? "bg-primary/20 text-white border-primary/50 font-bold"
                            : "bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-white"
                        )}
                      >
                        <span className="truncate">{q}</span>
                        {selectedQuality === q && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles: Loop, Auto-Play, Mute */}
                <div className="bg-zinc-900/60 rounded-2xl p-2 border border-zinc-800/70 divide-y divide-zinc-800/60">
                  {/* Loop Episode */}
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-200">Loop Current Episode</span>
                    </div>
                    <button
                      onClick={() => setIsLooping(prev => !prev)}
                      className={cn(
                        "w-9 h-5 rounded-full p-0.5 transition-colors border flex items-center",
                        isLooping ? "bg-primary border-primary justify-end" : "bg-zinc-950 border-zinc-800 justify-start"
                      )}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Auto Advance */}
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-200">Auto-Play Next Episode</span>
                    </div>
                    <button
                      onClick={() => setAutoAdvance(prev => !prev)}
                      className={cn(
                        "w-9 h-5 rounded-full p-0.5 transition-colors border flex items-center",
                        autoAdvance ? "bg-emerald-500 border-emerald-500 justify-end" : "bg-zinc-950 border-zinc-800 justify-start"
                      )}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Audio Sound */}
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-zinc-400" />
                      )}
                      <span className="text-xs font-medium text-zinc-200">
                        Audio Sound ({isMuted ? 'Muted' : 'Playing'})
                      </span>
                    </div>
                    <button
                      onClick={toggleMute}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors",
                        isMuted 
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300" 
                          : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                      )}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>
                </div>

                {/* Drama Synopsis / Details */}
                {drama.description && (
                  <div className="bg-zinc-900/40 rounded-2xl p-3.5 border border-zinc-800/60">
                    <span className="text-xs font-bold text-zinc-300 block mb-1">About This Drama</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">
                      {drama.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900/95 border border-primary/40 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-xl"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
