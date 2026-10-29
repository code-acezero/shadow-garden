"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup, Transition, Variants } from 'framer-motion';
import { 
  Search, X, Loader2, Filter, Calendar, Tv, Layers, 
  Bot, LogIn, LogOut, Settings, User, CircleUser, Cat, ChevronDown, ArrowRight, Dices, Wand2,
  Bell, CheckCircle, Info, Languages, Flag, Heart, AlertOctagon, 
  ArrowDownAZ, LayoutGrid, RotateCcw, ScanSearch, Users, Plus,
  ShieldAlert, MessageSquareWarning, Volume2, Mic2, Radio, Check, 
  Trash2, Play, Pause, AudioWaveform, Flame, Globe, AtSign, Hash, Shield,
  HelpCircle, SlidersHorizontal, BookOpen, Film, Clapperboard, CornerDownLeft, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragonIcon } from '@/components/UIx/DragonIcon';
import { useAuth } from '@/context/AuthContext'; 
import { supabase } from '@/lib/supabase'; 
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import Notifications from '@/components/Anime/Notifications'; 
import ShadowAvatar from '@/components/User/ShadowAvatar';
import ShadowLogo from '@/components/UIx/ShadowLogo';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import UserTitleBadge from '@/components/ui/UserTitleBadge';
import { useTravellerProfile } from '@/hooks/useTravellerProfile';

import { playVoice, refreshVoiceCache } from '@/lib/voice'; 
import { useSettings } from '@/hooks/useSettings'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hpi } from '@/lib/hpi';
import { AnimeService } from '@/lib/api'; // Ensure AnimeService is imported
import MascotPerch from '@/components/Mascot/MascotPerch';
import { getActivePetMeta, PetVoiceMeta } from '@/lib/petVoiceConfig';
import { ATRAX_CAPSULE_SPRING, ATRAX_BUBBLY_SPRING, atraxSquishTapVariants } from '@/lib/atraxMotion';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';
import { formatChapterBadge } from '@/lib/manga';

// --- UNIFIED SEARCH MODULES ---
import { 
  SEARCH_TARGETS, parseSearchQuery, SearchTargetConfig 
} from './search/SearchConfig';
import AnimatedSearchGuide from './search/AnimatedSearchGuide';
import SearchGuideModal from './search/SearchGuideModal';
import UnifiedFilterPanel from './search/UnifiedFilterPanel';
import UnifiedSuggestionsDropdown from './search/UnifiedSuggestionsDropdown';

// --- CONFIG ---
const PLACEHOLDERS = ["Summon Solo Leveling...", "Find One Piece...", "Search Jujutsu Kaisen...", "Explore Kagemi..."];
const ISLAND_HEIGHT = "h-11 md:h-12"; 
const FLUID_TRANSITION: Transition = ATRAX_CAPSULE_SPRING;

// --- ANIMATIONS ---
const JELLY_SPRING: Transition = {
    type: "spring",
    stiffness: 420,
    damping: 24,
    mass: 0.8,
};

const glitchVariants: Variants = {
    initial: { 
        opacity: 0, 
        filter: "blur(4px) drop-shadow(0 0 16px #a855f7)",
        scale: 0.94
    },
    animate: { 
        opacity: 1, 
        filter: "blur(0px) drop-shadow(0 0 6px rgba(168, 85, 247, 0.5))", 
        scale: 1,
        transition: { duration: 0.28, ease: "easeOut" } 
    },
    exit: { 
        opacity: 0, 
        filter: "blur(6px) drop-shadow(0 0 18px #7c3aed)",
        scale: 1.05,
        transition: { duration: 0.18, ease: "easeIn" } 
    }
};

const LightWave = ({ delay = 0, trigger }: { delay?: number, trigger: any }) => (
    <motion.div
        key={trigger} 
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ 
            x: "200%", 
            opacity: [0, 0.8, 0],
            transition: { duration: 1.2, delay: delay, ease: "easeInOut" }
        }}
        className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-overlay skew-x-12"
    />
);

// --- FILTERS & DATA ---
const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Isekai", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const TYPES = ["tv", "movie", "ova", "ona", "special"];
const STATUS = ["currently-airing", "finished-airing", "not-yet-aired"];
const YEARS = Array.from({ length: 2027 - 2000 }, (_, i) => (2027 - i).toString());

const HINDI_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"];
const HINDI_LANGUAGES = ["Hindi", "Tamil", "Telugu", "English"];
const HINDI_TYPES = ["Movie", "Series", "Drama"];
const HINDI_STATUS = ["Ongoing", "Completed"];

const DONGHUA_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Harem", "Historical", "Martial Arts", "Mecha", "Mystery", "Romance", "Sci-Fi", "Shounen", "Slice of Life"];
const DONGHUA_STATUS = ["ongoing", "completed"];

// --- MOCK LOCAL DATA FOR VOICES ---
const LOCAL_VOICE_PACKS = [
    { id: 'sys-alpha', name: 'Alpha', language: 'en', gender: 'Female', preview: '/audio/alpha_preview.mp3' },
    { id: 'sys-beta', name: 'Beta', language: 'en', gender: 'Female', preview: '/audio/beta_preview.mp3' },
    { id: 'sys-shadow', name: 'Shadow', language: 'en', gender: 'Male', preview: '/audio/shadow_preview.mp3' },
    { id: 'sys-delta', name: 'Delta', language: 'en', gender: 'Female', preview: '/audio/delta_preview.mp3' },
    { id: 'sys-zeta', name: 'Zeta', language: 'en', gender: 'Female', preview: '/audio/zeta_preview.mp3' },
    { id: 'sys-alpha-jp', name: 'Alpha', language: 'jp', gender: 'Female', preview: '/audio/alpha_jp_preview.mp3' },
];

interface SearchResult { id: string; title: string; image?: string; poster?: string; type?: string; duration?: string; releaseDate?: string; episodeCount?: string; episode?: string; }

// --- HELPER FUNCTIONS ---
const dispatchWhisper = (title: string, message: string) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-whisper', { detail: { id: Date.now(), type: 'system', title: title, message: message } }));
};

const getNotifIcon = (type: string) => {
    switch (type) {
        case 'watchlist': return <Flag className="text-yellow-500" size={16} />;
        case 'warning': return <ShieldAlert className="text-primary-600" size={18} />; 
        case 'GUILD_WARNING': return <ShieldAlert className="text-primary-600" size={18} />;
        case 'like': return <Heart className="text-pink-500" size={16} />;
        case 'anime_update': return <Tv className="text-purple-500" size={16} />;
        case 'error': return <MessageSquareWarning className="text-orange-500" size={16} />;
        default: return <Bell className="text-zinc-400" size={16} />;
    }
};

// --- UNIFIED SEARCH BAR SUB-COMPONENT ---
interface SearchBarContentProps {
  query: string;
  setQuery: (q: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  showGuideModal: boolean;
  setShowGuideModal: (show: boolean) => void;
  handleSearchSubmit: (e?: React.FormEvent) => void;
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  toggleGenre: (genre: string) => void;
  suggestions: any[];
  handleSuggestionClick: (item: any) => void;
  router: any;
  compact?: boolean;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  onReset: () => void;
  waveTrigger?: any;
  isLoadingSearch?: boolean;
  handleRandomSummon: () => void;
  isRandomLoading?: boolean;
  petSpeech?: {
    text: string;
    petName: string;
    petIcon: string;
    petColor: string;
    link?: string;
  } | null;
  activePetMeta?: PetVoiceMeta;
  onDismissPetSpeech?: () => void;
  onSwitchToSearch?: () => void;
  onBoopMascot?: (text: string) => void;
}

const SearchBarContent: React.FC<SearchBarContentProps> = ({ 
  query, 
  setQuery, 
  showFilters, 
  setShowFilters, 
  showGuideModal,
  setShowGuideModal,
  handleSearchSubmit, 
  filters, 
  setFilters, 
  toggleGenre, 
  suggestions, 
  handleSuggestionClick, 
  router, 
  compact = false, 
  isMobile = false,
  onCloseMobile, 
  onReset, 
  waveTrigger, 
  isLoadingSearch, 
  handleRandomSummon, 
  isRandomLoading = false,
  petSpeech,
  activePetMeta,
  onDismissPetSpeech,
  onSwitchToSearch,
  onBoopMascot
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseSearchQuery(query), [query]);
  const { target, cleanQuery } = parsed;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    playGummyTap();
    if (query) {
      setQuery('');
    } else if (onCloseMobile) {
      onCloseMobile();
    }
    setShowFilters(false);
  };

  const handleRemoveTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    playGummyTap();
    setQuery(cleanQuery);
    inputRef.current?.focus();
  };

  const handleSelectPrefixFromModal = (prefix: string) => {
    setQuery(prefix + ' ');
    inputRef.current?.focus();
  };

  const handleSwitchToSearch = () => {
    onSwitchToSearch?.();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        handleSwitchToSearch();
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, []);

  const hasActiveFilters = Boolean(
    (filters.genre && filters.genre.length > 0) ||
    filters.format ||
    filters.status ||
    filters.season ||
    filters.year ||
    filters.language ||
    (filters.target && filters.target !== 'all')
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.3 }}
      className="w-full h-full flex items-center relative pl-1.5 sm:pl-2 pr-1.5 gap-1.5 sm:gap-2"
    >
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
        <LightWave trigger={waveTrigger} delay={0.2} />
      </div>

      {/* Pet Mascot on left */}
      <div className="flex items-center gap-1.5 shrink-0 z-20" onClick={(e) => e.stopPropagation()}>
        <MascotPerch embedded noMessages className="shrink-0" onBoopSpeech={onBoopMascot} />
      </div>

      {/* Pet Message Pill: Expands to full available space on mobile/tablet so message shows fully; side-by-side on desktop */}
      <AnimatePresence>
        {petSpeech && (
          <motion.div
            key="pet-speech-pill"
            layout
            initial={{ opacity: 0, scale: 0.92, x: -16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.92, x: -16, filter: 'blur(4px)' }}
            transition={JELLY_SPRING}
            className={cn(
              "flex items-center gap-1 sm:gap-2 select-none min-w-0",
              // Mobile & Tablet: Take full available space so text is never prematurely truncated
              "flex-1 pr-1",
              // Desktop: Sits side-by-side with divider border
              "lg:flex-initial lg:max-w-[340px] lg:border-r lg:border-white/10 lg:pr-2.5"
            )}
          >
            {/* Pet Name Tag + Message text */}
            <div className="flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5 overflow-hidden whitespace-nowrap">
              <span className={cn("text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider shrink-0", petSpeech.petColor)}>
                {petSpeech.petName}
              </span>
              <span className="text-zinc-600 text-[8.5px] sm:text-[9px] shrink-0 select-none">•</span>
              <span className="text-[9.5px] sm:text-[10px] md:text-xs text-zinc-200 truncate font-medium">
                {petSpeech.text}
              </span>
            </div>

            {/* Quick Actions (Link & Dismiss) */}
            <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
              {petSpeech.link && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); router.push(petSpeech.link!); onDismissPetSpeech?.(); }}
                  className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white border border-primary-500/30 transition-all shrink-0 active:scale-95"
                >
                  View
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDismissPetSpeech?.(); }}
                className="flex items-center justify-center p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-colors shrink-0"
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Searchbar Stage: Pushed to the end on mobile/tablet when pet speaks, side-by-side on desktop */}
      <motion.div
        layout
        transition={JELLY_SPRING}
        className={cn(
          "h-full flex items-center justify-between gap-1 sm:gap-1.5",
          petSpeech 
            ? "shrink-0 lg:flex-1 lg:min-w-[140px]" 
            : "flex-1 min-w-0 sm:min-w-[140px]"
        )}
      >
        {/* Mobile & Tablet: When pet is speaking, push search to the end with just a clean search icon */}
        {petSpeech && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSwitchToSearch();
            }}
            className="lg:hidden w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 rounded-full hover:bg-white/5 active:scale-95"
            title="Tap to Search"
          >
            <Search size={14} className="text-zinc-400" />
          </button>
        )}

        {/* Search Icon (Desktop always, or Mobile/Tablet when pet is NOT speaking) */}
        <div className={cn(
          "w-4 h-4 sm:w-5 sm:h-5 items-center justify-center text-zinc-400 shrink-0 pointer-events-none",
          petSpeech ? "hidden lg:flex" : "flex"
        )}>
          {isLoadingSearch ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
          ) : (
            <Search size={14} className="text-zinc-400" />
          )}
        </div>

        {/* Search Input Form & Target Isolation Badge */}
        <form 
          onSubmit={handleSearchSubmit} 
          className={cn(
            "h-full items-center relative overflow-visible z-10 gap-1 sm:gap-1.5 pr-0.5 sm:pr-1 min-w-[50px]",
            petSpeech ? "hidden lg:flex lg:flex-1" : "flex flex-1"
          )}
        >
          {target.id !== 'all' && (
            <motion.div
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border shrink-0 transition-all shadow-sm select-none",
                target.badgeColor
              )}
              title={`Target: ${target.label}. Click '×' to search everything.`}
            >
              <span className="truncate max-w-[70px] sm:max-w-[90px]">{target.label}</span>
              <button
                type="button"
                onClick={handleRemoveTarget}
                className="hover:opacity-75 p-0.5 rounded-full transition-opacity ml-0.5"
              >
                <X size={9} />
              </button>
            </motion.div>
          )}

          <div className="relative flex-1 h-full flex items-center min-w-0">
            <input 
              ref={inputRef}
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onFocus={() => {
                if (isMobile) {
                  onSwitchToSearch?.();
                }
              }}
              placeholder={petSpeech ? "Search..." : ""}
              className="bg-transparent border-none outline-none focus:ring-0 text-white text-[11px] md:text-xs h-full w-full relative z-10 placeholder-zinc-500 font-medium min-w-0" 
              autoComplete="off"
              spellCheck={false}
            />
            {!query && !petSpeech && <AnimatedSearchGuide activeTargetId={target.id} />}
          </div>
        </form>

        {/* Right Actions */}
        <div className={cn(
          "items-center gap-0.5 sm:gap-1 shrink-0 z-10",
          petSpeech ? "hidden lg:flex" : "flex"
        )}>
          {query && (
            <button 
              type="button" 
              onClick={handleSearchSubmit} 
              className="p-1 bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-md transition-all active:scale-95"
              title="Search"
            >
              <ArrowRight size={11} />
            </button>
          )}
          {query ? (
            <button 
              type="button" 
              onClick={handleClear} 
              className="p-1 text-zinc-500 hover:text-white transition-colors"
              title="Clear input"
            >
              <X size={11} />
            </button>
          ) : null}

          <div className="flex items-center gap-0.5 border-l border-white/10 pl-1 ml-0.5">
            {/* Search Guide Button: ONLY desktop / md+, on mobile it lives inside the Filter Panel */}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); playGummyTap(); setShowGuideModal(!showGuideModal); }} 
              className={cn(
                "hidden md:flex p-1.5 rounded-full transition-all relative group",
                showGuideModal ? "text-primary-400 bg-primary-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Search Guide & Shortcuts"
            >
              <HelpCircle size={14} />
            </button>

            {/* Filter Toggle: Always accessible on both mobile and desktop */}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); playGummyTap(); setShowFilters(!showFilters); }} 
              className={cn(
                "p-1 sm:p-1.5 rounded-full transition-all relative",
                showFilters || hasActiveFilters 
                  ? "text-primary-400 bg-primary-500/20 ring-1 ring-primary-500/30" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Advanced Filters"
            >
              <Filter size={13} />
            </button>

            {/* AI Image Search: Accessible on both mobile and desktop */}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); playGummyTap(); router.push('/ai/imagesearch'); }} 
              className="flex p-1 sm:p-1.5 rounded-full text-zinc-400 hover:text-primary-500 hover:bg-white/5 transition-colors"
              title="AI Image Search"
            >
              <ScanSearch size={13} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search Guide Modal */}
      <SearchGuideModal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
        onSelectPrefix={handleSelectPrefixFromModal} 
      />

      {/* Unified Filter Panel */}
      <UnifiedFilterPanel 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        filters={filters} 
        setFilters={setFilters} 
        onReset={onReset} 
        onApply={handleSearchSubmit} 
        onRandomSummon={handleRandomSummon} 
        isRandomLoading={Boolean(isRandomLoading)} 
        onOpenGuideModal={() => setShowGuideModal(true)}
      />

      {/* Unified Suggestions Dropdown */}
      {query.length > 0 && !showFilters && (
        <UnifiedSuggestionsDropdown 
          suggestions={suggestions} 
          query={query} 
          activeTargetLabel={target.id !== 'all' ? target.label : undefined}
          onSuggestionClick={handleSuggestionClick} 
          onSeeAllClick={handleSearchSubmit} 
        />
      )}
    </motion.div>
  );
};


// --- WHISPER ISLAND CONTENT (Inner) ---
function WhisperIslandContent() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const [libraryModeOverride, setLibraryModeOverride] = useState<'watchlist' | 'readlist' | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const voiceLock = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null); 
  
  const { profile, isLoading, signOut } = useAuth();
  const isAuthenticated = !!(profile && profile.id && !profile.is_guest);
  const travellerProfile = useTravellerProfile();
  const { settings, updateSetting } = useSettings(); 
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoState, setLogoState] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live listener for library mode changes (Watchlist vs Readlist)
  useEffect(() => {
    const handleLibraryMode = (e: any) => {
      if (e.detail?.mode) {
        setLibraryModeOverride(e.detail.mode);
        setLogoState(1);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('shadow-library-mode', handleLibraryMode);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('shadow-library-mode', handleLibraryMode);
      }
    };
  }, []);

  // Clear library mode override when leaving library routes
  useEffect(() => {
    if (!pathname.startsWith('/library') && !pathname.startsWith('/watchlist')) {
      setLibraryModeOverride(null);
    }
  }, [pathname]);

  const currentPageInfo = useMemo(() => {
    if (pathname.startsWith('/library') || pathname.startsWith('/watchlist')) {
      const mode = libraryModeOverride || searchParams?.get('mode') || 'watchlist';
      if (mode === 'readlist') {
        return { name: 'READLIST', color: 'text-purple-400' };
      }
      return { name: 'WATCHLIST', color: 'text-primary-500' };
    }
    if (pathname.startsWith('/manga') || pathname.startsWith('/novel')) {
      return { name: 'MANGVELS', color: 'text-purple-400' };
    }
    if (pathname.startsWith('/hindi')) {
      return { name: 'HINDI', color: 'text-orange-400' };
    }
    if (pathname.startsWith('/donghua')) {
      return { name: 'DONGHUA', color: 'text-emerald-400' };
    }
    if (pathname.startsWith('/shorts')) {
      return { name: 'SHORTS', color: 'text-rose-400' };
    }
    if (pathname.startsWith('/cinema') || pathname.startsWith('/drama') || pathname.startsWith('/movies') || pathname.startsWith('/stream')) {
      return { name: 'FLIX', color: 'text-cyan-400' };
    }
    if (pathname.startsWith('/social')) {
      return { name: 'OTAKUVERSE', color: 'text-red-500' };
    }
    if (pathname.startsWith('/schedule')) {
      return { name: 'SCHEDULE', color: 'text-amber-400' };
    }
    if (pathname.startsWith('/search')) {
      return { name: 'SEARCH', color: 'text-zinc-300' };
    }
    return { name: 'ANIME', color: 'text-primary-500' };
  }, [pathname, searchParams, libraryModeOverride]);

  useEffect(() => {
    setLogoState(1);
  }, [pathname, searchParams, libraryModeOverride]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [filters, setFilters] = useState({
    target: 'all',
    genre: [] as string[],
    season: "",
    year: "",
    format: "",
    status: "",
    sort: "newest",
    language: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeNotif, setActiveNotif] = useState<any | null>(null);
  const [activePetMeta, setActivePetMeta] = useState<PetVoiceMeta>(getActivePetMeta);
  const [petSpeech, setPetSpeech] = useState<{
    text: string;
    petName: string;
    petIcon: string;
    petColor: string;
    link?: string;
  } | null>(null);

  const [centerMode, setCenterMode] = useState<any>('SEARCH_SOLO');
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [isSwitchingNotif, setIsSwitchingNotif] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);
  const petTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleBoopSpeech = (text: string) => {
    const pet = getActivePetMeta();
    setActivePetMeta(pet);
    setPetSpeech({
      text,
      petName: pet.name,
      petIcon: pet.icon,
      petColor: pet.textColor
    });
    if (petTimerRef.current) clearTimeout(petTimerRef.current);
    petTimerRef.current = setTimeout(() => {
      setPetSpeech(null);
      setActiveNotif(null);
      setIsMobileSearchExpanded(false);
      setCenterMode('ISLAND_FOCUSED');
    }, 8000);
  };

  const handleRandomSummon = async () => {
    setIsRandomLoading(true);
    try {
      const anime = await AnimeService.getRandomAnime();
      if (anime?.id) {
        setShowFilters(false);
        router.push(`/watch/${anime.id}`);
      }
    } catch (error) {
      console.error("Failed to summon random anime", error);
    } finally {
      setIsRandomLoading(false);
    }
  };

  // Voice State
  const [voices, setVoices] = useState<any[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('guild-pass')) {
            window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }));
        }

        const handleKey = (e: KeyboardEvent) => {
          if (e.altKey && e.key.toLowerCase() === 'n') {
            window.dispatchEvent(new CustomEvent('shadow-whisper', {
              detail: {
                id: Date.now(),
                type: 'system',
                title: 'Guild Transmission',
                message: 'Master Shadow, seven shadows stand ready!'
              }
            }));
          }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }
  }, []);

  // ✅ 1. STABLE LISTENER (INITIALIZE FIRST)
  const activeNotifRef = useRef(activeNotif);
  useEffect(() => { activeNotifRef.current = activeNotif; }, [activeNotif]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); window.addEventListener('resize', handleResize);
    const logoInterval = setTimeout(() => setLogoState(p => (p + 1) % 2), 4000);
    const handleClickOutside = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) { setShowFilters(false); setShowGuideModal(false); setIsMobileSearchExpanded(false); if (centerMode === 'ISLAND_DETAILS') setCenterMode('ISLAND_FOCUSED'); } };
    document.addEventListener("mousedown", handleClickOutside);

    return () => { 
        window.removeEventListener('resize', handleResize); 
        document.removeEventListener("mousedown", handleClickOutside); 
        clearTimeout(logoInterval); 
    };
  }, [logoState, centerMode]);

  useEffect(() => {
    const handleWhisper = async (e: any) => {
        const newNotif = { 
            id: (e.detail?.id || Date.now()).toString(), 
            type: e.detail?.type || 'system', 
            title: e.detail?.title || 'Notice', 
            content: e.detail?.message || '', 
            link: e.detail?.link 
        };
        
        if (newNotif.type === 'warning' || newNotif.type === 'GUILD_WARNING') {
            const audio = new Audio('/sfx/warning.mp3'); audio.volume = 0.5; audio.play().catch(() => {});
        }

        const currentPet = getActivePetMeta();
        setActivePetMeta(currentPet);
        const voicedText = currentPet.formatEvent(newNotif.title, newNotif.content, newNotif.type);
        setActiveNotif(newNotif);
        setPetSpeech({
            text: voicedText,
            petName: currentPet.name,
            petIcon: currentPet.icon,
            petColor: currentPet.textColor,
            link: newNotif.link
        });

        if (petTimerRef.current) clearTimeout(petTimerRef.current);
        petTimerRef.current = setTimeout(() => { 
            setPetSpeech(null);
            setActiveNotif(null); 
            setIsMobileSearchExpanded(false);
            setCenterMode('ISLAND_FOCUSED');
        }, 8000);
    };

    const handlePetSpeak = (e: any) => {
        const currentPet = getActivePetMeta();
        setActivePetMeta(currentPet);
        setPetSpeech({
            text: e.detail?.text || '',
            petName: currentPet.name,
            petIcon: currentPet.icon,
            petColor: currentPet.textColor
        });
        if (petTimerRef.current) clearTimeout(petTimerRef.current);
        petTimerRef.current = setTimeout(() => {
            setPetSpeech(null);
            setActiveNotif(null);
            setIsMobileSearchExpanded(false);
            setCenterMode('ISLAND_FOCUSED');
        }, 60000);
    };

    const handlePetConfigChange = () => {
        setActivePetMeta(getActivePetMeta());
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('shadow-whisper', handleWhisper);
        window.addEventListener('shadow_pet_speak', handlePetSpeak);
        window.addEventListener('shadow_mascot_config_changed', handlePetConfigChange);
        window.addEventListener('storage', handlePetConfigChange);
    }

    let channel: any = null;
    let msgChannel: any = null;
    if (profile?.id) {
        channel = supabase.channel('whisper-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload: any) => {
            const dbNotif = payload.new;
            let title = 'New Notification'; let type = 'system';
            if (dbNotif.type === 'GUILD_WARNING') { title = 'Guild Receptionist'; type = 'warning'; }
            window.dispatchEvent(new CustomEvent('shadow-whisper', { detail: { id: Date.now(), type: type, title: title, message: dbNotif.content } }));
        }).subscribe();

        msgChannel = supabase.channel('whisper-msg-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
            const msg = payload.new;
            if (msg && msg.sender_id !== profile.id) {
              const isInsideMessagesPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/messages');
              if (!isInsideMessagesPage) {
                window.dispatchEvent(new CustomEvent('shadow-whisper', { 
                  detail: { 
                    id: Date.now(), 
                    type: 'system', 
                    title: 'New Missive', 
                    message: msg.content || 'You received a new message' 
                  } 
                }));
                window.dispatchEvent(new CustomEvent('add_temp_notification', {
                  detail: {
                    id: msg.id || String(Date.now()),
                    user_id: profile.id,
                    type: 'unread_message',
                    content: msg.content || 'Sent a new message',
                    link: `/messages?chatId=${msg.conversation_id}`,
                    is_read: false,
                    created_at: msg.created_at || new Date().toISOString()
                  }
                }));
              }
            }
        }).subscribe();
    }

    return () => { 
        if (typeof window !== 'undefined') {
            window.removeEventListener('shadow-whisper', handleWhisper);
            window.removeEventListener('shadow_pet_speak', handlePetSpeak);
            window.removeEventListener('shadow_mascot_config_changed', handlePetConfigChange);
            window.removeEventListener('storage', handlePetConfigChange);
        }
        if (channel) supabase.removeChannel(channel);
        if (msgChannel) supabase.removeChannel(msgChannel);
    };
  }, [profile?.id]);

  // ✅ 2. WELCOME / GREETING LOGIC (With Cleanup)
  useEffect(() => {
    if (isLoading || voiceLock.current) return; 
    
    let timer: NodeJS.Timeout;

    if (typeof window !== 'undefined') {
        const hasVisitedHistory = localStorage.getItem('shadow_visited_history');
        const isJustRegistered = sessionStorage.getItem('shadow_just_registered');
        const welcomeShownSession = sessionStorage.getItem('shadow_welcome_shown');

        const delayedDispatch = (title: string, msg: string) => {
            timer = setTimeout(() => {
                dispatchWhisper(title, msg);
            }, 800); 
        };

        if (isJustRegistered && profile) {
            voiceLock.current = true;
            playVoice('REGISTER');
            delayedDispatch('Guild Receptionist', 'Thanks for registering at Kagemi. You are now registered as an adventurer. Go to profile for updating your guild card as you wish. And good luck with your adventurer journey.');
            sessionStorage.removeItem('shadow_just_registered');
            sessionStorage.setItem('shadow_welcome_shown', 'true');
            localStorage.setItem('shadow_visited_history', 'true');
        }
        else if (!profile && !hasVisitedHistory) {
            voiceLock.current = true;
            playVoice('WELCOME');
            delayedDispatch('Guild Receptionist', 'Welcome to Kagemi. This is a sanctuary for those who seek the wisdom of anime. What brings you here today, traveler? Want to register as an adventurer? Or you may look around for today.');
            localStorage.setItem('shadow_visited_history', 'true');
            sessionStorage.setItem('shadow_welcome_shown', 'true');
        }
        else if (!welcomeShownSession) {
            voiceLock.current = true;
            if (profile && !profile.is_guest) {
                const role = profile.role;
                if (role === 'admin' || role === 'moderator') {
                    playVoice('GREET_MASTER');
                    delayedDispatch('Guild Receptionist', 'Welcome back, Master. The shadows await your command.');
                } else {
                    playVoice('GREET_ADVENTURER');
                    delayedDispatch('Guild Receptionist', 'Welcome back, Adventurer. It is good to see you again.');
                }
            } else {
                playVoice('GREET_TRAVELER');
                delayedDispatch('Guild Receptionist', 'Greetings, Traveler. Do you wish to join our ranks today?');
            }
            sessionStorage.setItem('shadow_welcome_shown', 'true');
        }
    }

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [profile, isLoading]);

  // UNREAD MESSAGES NOTIFICATION
  useEffect(() => {
      const fetchUnread = async () => {
          if (!profile?.id) return;
          try {
              const { data, error } = await supabase
                 .from('messages')
                 .select('sender_id')
                 .eq('receiver_id', profile.id)
                 .is('read_at', null);
                 
              if (!error && data && data.length > 0) {
                  dispatchWhisper('Unread Messages', `${data.length} unread message${data.length > 1 ? 's' : ''}`);
              }
          } catch (e) {}
      };

      // Only fetch unread messages if user is not currently in the messages page
      if (profile?.id && typeof window !== 'undefined' && !window.location.pathname.includes('/messages')) {
          fetchUnread();
          
          // Set up realtime subscription for new messages
          const channel = supabase
              .channel(`messages_whisper_${profile.id}`)
              .on(
                  'postgres_changes',
                  {
                      event: 'INSERT',
                      schema: 'public',
                      table: 'messages',
                      filter: `receiver_id=eq.${profile.id}`
                  },
                  async (payload: any) => {
                      if (!window.location.pathname.includes('/messages')) {
                          // Fetch sender username
                          const { data } = await supabase
                              .from('profiles')
                              .select('username')
                              .eq('id', payload.new.sender_id)
                              .single();
                          const senderName = data?.username || 'Someone';
                          
                          dispatchWhisper('New Message', `You received a message from @${senderName}`);
                          
                          window.dispatchEvent(new CustomEvent('add_temp_notification', {
                              detail: {
                                  id: `temp_${Date.now()}_${Math.random()}`,
                                  type: 'unread_message',
                                  content: `New message from @${senderName}`,
                                  created_at: new Date().toISOString(),
                                  is_read: false
                              }
                          }));
                      }
                  }
              )
              .subscribe();

          return () => {
              supabase.removeChannel(channel);
          };
      }
  }, [profile?.id]);

  useEffect(() => { setMounted(true); refreshVoiceCache(); }, []);
  
  // Voice Fetching
  useEffect(() => {
      if (mounted && settingsOpen && !voicesLoaded) {
          const fetchAsync = async () => {
             const { data } = await supabase.from('voice_packs').select('*');
             const dbVoices = data || [];
             const normalizedDB = dbVoices.map((v: any) => ({
                 id: v.id, name: v.character || v.name, language: v.language || 'en', gender: 'Unknown', preview: v.file_url, is_db: true
             }));
             setVoices([...LOCAL_VOICE_PACKS, ...normalizedDB]);
             setVoicesLoaded(true);
          }
          fetchAsync();
      }
  }, [mounted, settingsOpen, voicesLoaded]);

  // Voice Preview
  const handleVoicePreview = (charName: string, clips: string[]) => {
      if (!clips || clips.length === 0) return;
      const randomUrl = clips[Math.floor(Math.random() * clips.length)];
      if (playingVoice === charName) { audioRef.current?.pause(); setPlayingVoice(null); } 
      else {
          if (audioRef.current) audioRef.current.pause();
          audioRef.current = new Audio(randomUrl);
          audioRef.current.volume = settings.whisperVolume || 0.8; 
          audioRef.current.onended = () => setPlayingVoice(null);
          audioRef.current.play().catch(() => {});
          setPlayingVoice(charName);
      }
  };

  const selectVoicePack = (name: string, lang: string) => {
      updateSetting('whisperVoice', name);
      dispatchWhisper('System', `Voice pact formed with ${name}.`);
  };

  const voiceLibrary = useMemo(() => {
      return voices.reduce((acc: any, v: any) => {
          const lang = v.language || 'en';
          if (!acc[lang]) acc[lang] = {};
          const charName = v.name || 'Unknown';
          if (!acc[lang][charName]) acc[lang][charName] = { name: charName, gender: v.gender, clips: [] };
          if (v.preview) acc[lang][charName].clips.push(v.preview);
          return acc;
      }, {});
  }, [voices]);

  // --- UNIFIED SEARCH EFFECT: Omnisearch & Prefix Target Isolation ---
  useEffect(() => {
    const delay = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        return;
      }

      // 1. Prefix Auto-Suggestions: user is typing a slash prefix (e.g. "/", "/m", "/d")
      if (q.startsWith('/') && !q.includes(' ')) {
        const partial = q.toLowerCase();
        const matches = SEARCH_TARGETS
          .filter(t => t.id !== 'all' && (t.prefix.toLowerCase().startsWith(partial) || t.aliases?.some(a => a.toLowerCase().startsWith(partial))))
          .map(t => ({
            id: `prefix_${t.id}`,
            title: `${t.prefix} — Target ${t.label}`,
            subtitle: t.description,
            isPrefixGuide: true,
            targetPrefix: t.prefix,
            type: t.label,
            badgeColor: t.badgeColor,
            badgeBg: t.badgeBg,
            icon: t.icon,
            _kind: 'prefix'
          }));
        setSuggestions(matches);
        setIsLoadingSearch(false);
        return;
      }

      const { target, prefix, cleanQuery } = parseSearchQuery(query);
      const term = cleanQuery;

      // 2. Target Isolation: Users & Clans (@username or /users)
      if (target.id === 'users' || q.startsWith('@')) {
        const lookupTerm = q.startsWith('@') ? q.slice(1).trim() : term;
        if (lookupTerm.length < 1) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const [{ data: users }, { data: clans }] = await Promise.all([
            supabase.from('profiles').select('id, username, avatar_url, role, frame_id, level, show_level, title, admin_title').ilike('username', `%${lookupTerm}%`).limit(5),
            supabase.from('clans').select('id, name, avatar_url').ilike('name', `%${lookupTerm}%`).limit(3),
          ]);
          const userResults = (users || []).map((u: any) => ({ 
            id: u.username || u.id, 
            title: u.username, 
            image: u.avatar_url, 
            type: u.role === 'admin' ? 'Guild Master' : 'Adventurer', 
            subtitle: `@${u.username} • Level ${u.level || 1}`,
            badgeColor: u.role === 'admin' ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30',
            badgeBg: u.role === 'admin' ? 'bg-red-500/10' : 'bg-emerald-500/10',
            _kind: 'user', 
            frame_id: u.frame_id, 
            level: u.level, 
            show_level: u.show_level, 
            admin_title: u.admin_title, 
            user_title: u.title, 
            rawUser: u 
          }));
          const clanResults = (clans || []).map((c: any) => ({ 
            id: c.name || c.id, 
            title: c.name, 
            image: c.avatar_url, 
            type: 'Guild Clan', 
            subtitle: `Shadow Clan`,
            badgeColor: 'text-purple-400 border-purple-500/30',
            badgeBg: 'bg-purple-500/10',
            _kind: 'clan' 
          }));
          setSuggestions([...userResults, ...clanResults]);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 3. Target Isolation: Posts & Community News (/posts)
      if (target.id === 'posts') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const anilistQuery = `
            query {
              Page(page: 1, perPage: 3) {
                threads(search: "${term}", sort: ID_DESC) {
                  id
                  title
                  user { name avatar { large } }
                }
              }
            }
          `;
          const [postsRes, aniRes] = await Promise.all([
            supabase.from('social_posts').select('id, content, user:profiles(username, avatar_url, role, admin_title, title, frame_id, level, show_level)').ilike('content', `%${term}%`).limit(4),
            fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ query: anilistQuery })
            }).then(res => res.json()).catch(() => null)
          ]);

          const postResults = (postsRes.data || []).map((p: any) => ({ 
            id: p.id, 
            title: (p.content || '').slice(0, 60) + ((p.content || '').length > 60 ? '...' : ''), 
            image: p.user?.avatar_url,
            frame_id: p.user?.frame_id,
            level: p.user?.level,
            show_level: p.user?.show_level, 
            type: 'Post',
            subtitle: `By @${p.user?.username || 'Unknown'}`,
            badgeColor: 'text-amber-400 border-amber-500/30',
            badgeBg: 'bg-amber-500/10',
            _kind: 'post' 
          }));

          const newsData = aniRes?.data?.Page?.threads || [];
          const newsResults = newsData.map((t: any) => ({
            id: t.id,
            title: t.title,
            image: t.user?.avatar?.large,
            type: 'News',
            subtitle: `AniList News Discussion`,
            badgeColor: 'text-sky-400 border-sky-500/30',
            badgeBg: 'bg-sky-500/10',
            _kind: 'news'
          }));

          setSuggestions([...postResults, ...newsResults]);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 4. Target Isolation: Manga & Webtoons & Novels (/manga, /novels)
      if (target.id === 'manga' || target.id === 'novels') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const { mangaService } = await import('@/lib/manga');
          const res = await mangaService.search({ query: term, limit: 6 });
          const mangaItems = (res?.items || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            image: m.cover || m.banner || m.coverImage,
            poster: m.cover || m.banner || m.coverImage,
            type: m.type ? m.type.toUpperCase() : 'MANGA',
            subtitle: `${m.status || 'Ongoing'} • ${m.latestChapter ? formatChapterBadge(m.latestChapter) : (m.genres?.[0] || 'Manga')}`,
            badgeColor: 'text-purple-400 border-purple-500/30',
            badgeBg: 'bg-purple-500/10',
            _kind: 'manga'
          }));
          setSuggestions(mangaItems);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 5. Target Isolation: Donghua (/donghua)
      if (target.id === 'donghua') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const { dpi } = await import('@/lib/dpi');
          const res = await dpi.search(term);
          const donghuaItems = (Array.isArray(res) ? res : []).slice(0, 6).map((d: any) => ({
            id: d.id,
            title: d.title,
            image: d.image || d.poster,
            poster: d.image || d.poster,
            type: 'DONGHUA',
            subtitle: `${d.type || 'Chinese Anime'} • ${d.episodeCount || d.episode || '?'} EPS`,
            badgeColor: 'text-red-400 border-red-500/30',
            badgeBg: 'bg-red-500/10',
            _kind: 'donghua'
          }));
          setSuggestions(donghuaItems);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 6. Target Isolation: Hindi Dubbed Anime (/hindi, /animehindi)
      if (target.id === 'hindi') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const data = await hpi.hindi.getSuggestions(term);
          const list = Array.isArray(data) ? data : ((data as any)?.items || []);
          const hindiItems = list.slice(0, 6).map((h: any) => ({
            id: h.id,
            title: h.title,
            image: h.image || h.poster,
            poster: h.image || h.poster,
            type: 'HINDI DUB',
            subtitle: `${h.type || 'Dubbed'} • ${h.episodeCount || h.episode || '?'} EPS`,
            badgeColor: 'text-orange-400 border-orange-500/30',
            badgeBg: 'bg-orange-500/10',
            _kind: 'hindi'
          }));
          setSuggestions(hindiItems);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 7. Target Isolation: HD Movies & Series (/movies, /series)
      if (target.id === 'movies' || target.id === 'series') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const { omni } = await import('@/lib/omni');
          const res = await omni.movies.search(term);
          const movieItems = (res?.items || []).slice(0, 6).map((m: any) => ({
            id: m.slug || m.id,
            title: m.title,
            image: m.poster || m.image,
            poster: m.poster || m.image,
            type: m.type ? m.type.toUpperCase() : 'MOVIE',
            subtitle: `${m.year || 'Cinema'} • ${m.rating ? `★ ${m.rating}` : 'HD'}`,
            badgeColor: 'text-emerald-400 border-emerald-500/30',
            badgeBg: 'bg-emerald-500/10',
            _kind: 'movie'
          }));
          setSuggestions(movieItems);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 8. Target Isolation: Asian Drama (/drama)
      if (target.id === 'drama') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const { omni } = await import('@/lib/omni');
          const res = await omni.drama.search(term);
          const dramaItems = (res?.items || []).slice(0, 6).map((d: any) => ({
            id: d.slug || d.id,
            title: d.title,
            image: d.poster || d.image,
            poster: d.poster || d.image,
            type: 'DRAMA',
            subtitle: `${d.country || 'Asian Drama'} • ${d.year || ''}`,
            badgeColor: 'text-pink-400 border-pink-500/30',
            badgeBg: 'bg-pink-500/10',
            _kind: 'drama'
          }));
          setSuggestions(dramaItems);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 9. Target Isolation: Shorts (/shorts)
      if (target.id === 'shorts') {
        if (term.length < 2) { setSuggestions([]); return; }
        setIsLoadingSearch(true);
        try {
          const res = await fetch(`/api/shorts/search?q=${encodeURIComponent(term)}`);
          const data = await res.json();
          const items = (data?.items || []).slice(0, 6).map((s: any) => ({
            id: s.id,
            title: s.title,
            image: s.cover || s.banner,
            poster: s.cover || s.banner,
            type: 'SHORTS',
            subtitle: `Shorts • ${s.totalEpisodes || '?'} EPS${s.language ? ` • ${s.language}` : ''}`,
            badgeColor: 'text-cyan-400 border-cyan-500/30',
            badgeBg: 'bg-cyan-500/10',
            _kind: 'shorts'
          }));
          setSuggestions(items);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
        return;
      }

      // 10. Default Global Mixed Omnisearch:
      // Concurrently searches Anime, Manga, Movies/Dramas (Flix), Shorts, Donghua, and Users all together!
      if (term.length > 1) {
        setIsLoadingSearch(true);
        try {
          const [
            { data: users },
            animeResults,
            mangaResults,
            dramaResults,
            shortsData,
            donghuaResults
          ] = await Promise.all([
            supabase.from('profiles').select('id, username, avatar_url, role, frame_id, level, show_level, title, admin_title').ilike('username', `%${term}%`).limit(2),
            AnimeService.getSearchSuggestions(term).catch(() => []),
            import('@/lib/manga').then(m => m.mangaService.search({ query: term, limit: 2 })).catch(() => null),
            import('@/lib/omni').then(o => o.omni.drama.search(term, 1)).catch(() => null),
            fetch(`/api/shorts/search?q=${encodeURIComponent(term)}`).then(r => r.json()).catch(() => null),
            import('@/lib/dpi').then(d => d.dpi.search(term, 1)).catch(() => null)
          ]);

          const userResults = (users || []).map((u: any) => ({
            id: u.username || u.id,
            title: u.username,
            image: u.avatar_url,
            type: u.role === 'admin' ? 'Guild Master' : 'Adventurer',
            subtitle: `@${u.username} • Level ${u.level || 1}`,
            badgeColor: 'text-emerald-400 border-emerald-500/30',
            badgeBg: 'bg-emerald-500/10',
            _kind: 'user',
            frame_id: u.frame_id,
            level: u.level,
            show_level: u.show_level,
            admin_title: u.admin_title,
            user_title: u.title,
            rawUser: u
          }));

          const animeItems = (animeResults || []).slice(0, 3).map((a: any) => ({
            ...a,
            type: a.type || 'ANIME',
            subtitle: `${a.type || 'Anime'} ${a.releaseDate ? `• ${a.releaseDate}` : ''}`,
            badgeColor: 'text-red-400 border-red-500/30',
            badgeBg: 'bg-red-500/10',
            _kind: 'anime'
          }));

          const mangaItems = (mangaResults?.items || []).slice(0, 2).map((m: any) => ({
            id: m.id,
            title: m.title,
            image: m.cover || m.banner || m.coverImage,
            poster: m.cover || m.banner || m.coverImage,
            type: 'MANGA',
            subtitle: `Manga • ${m.status || 'Ongoing'}`,
            badgeColor: 'text-purple-400 border-purple-500/30',
            badgeBg: 'bg-purple-500/10',
            _kind: 'manga'
          }));

          const dramaItems = (dramaResults?.items || []).slice(0, 2).map((d: any) => ({
            id: d.slug || d.id,
            title: d.title,
            image: d.poster || d.image,
            poster: d.poster || d.image,
            type: d.isMovie ? 'MOVIE' : (d.type ? d.type.toUpperCase() : 'FLIX'),
            subtitle: `${d.isMovie ? 'Movie' : (d.country || 'Flix')} ${d.year ? `• ${d.year}` : ''}`,
            badgeColor: 'text-pink-400 border-pink-500/30',
            badgeBg: 'bg-pink-500/10',
            _kind: 'stream',
            isMovie: Boolean(d.isMovie)
          }));

          const shortsItems = (shortsData?.items || []).slice(0, 2).map((s: any) => ({
            id: s.id,
            title: s.title,
            image: s.cover || s.banner,
            poster: s.cover || s.banner,
            type: 'SHORTS',
            subtitle: `Shorts • ${s.totalEpisodes || '?'} EPS${s.language ? ` • ${s.language}` : ''}`,
            badgeColor: 'text-cyan-400 border-cyan-500/30',
            badgeBg: 'bg-cyan-500/10',
            _kind: 'shorts'
          }));

          const donghuaItems = (donghuaResults || []).slice(0, 2).map((d: any) => ({
            id: d.slug || d.id,
            title: d.title,
            image: d.image,
            poster: d.image,
            type: 'DONGHUA',
            subtitle: `Donghua • ${d.episodes?.sub || d.episodes?.total || '?'} EPS`,
            badgeColor: 'text-amber-400 border-amber-500/30',
            badgeBg: 'bg-amber-500/10',
            _kind: 'donghua'
          }));

          setSuggestions([
            ...userResults,
            ...animeItems,
            ...mangaItems,
            ...dramaItems,
            ...shortsItems,
            ...donghuaItems
          ]);
        } catch { setSuggestions([]); } finally { setIsLoadingSearch(false); }
      } else {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    if (!activeNotif) setCenterMode('SEARCH_SOLO');
    else if (centerMode === 'SEARCH_SOLO') setCenterMode('ISLAND_FOCUSED');
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    if (activeNotif && centerMode !== 'ISLAND_DETAILS') notifTimerRef.current = setTimeout(() => setActiveNotif(null), 8000);
  }, [activeNotif, centerMode]);

  const handleSearchSubmit = (e?: React.FormEvent) => { 
    if (e) e.preventDefault(); 
    setSuggestions([]);
    const { target, cleanQuery } = parseSearchQuery(query);
    const params = new URLSearchParams(); 

    if (cleanQuery) params.set('keyword', cleanQuery); 
    if (filters.genre && filters.genre.length > 0) params.set('genres', filters.genre.join(',').toLowerCase()); 
    if (filters.sort) params.set('sort', filters.sort); 
    if (filters.format) params.set('type', filters.format.toLowerCase());
    if (filters.status) params.set('status', filters.status.toLowerCase());
    if (filters.season) params.set('season', filters.season.toLowerCase());
    if (filters.year) params.set('year', filters.year);
    if (filters.language) params.set('lang', filters.language.toLowerCase()); 

    const effectiveTarget = filters.target && filters.target !== 'all' ? filters.target : target.id;

    if (effectiveTarget === 'users' || query.trim().startsWith('@')) {
      router.push(`/social?search=${encodeURIComponent(cleanQuery || query.replace('@', ''))}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'posts' || query.trim().startsWith('/posts')) {
      router.push(`/social?postSearch=${encodeURIComponent(cleanQuery || '')}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'shorts') {
      router.push(`/shorts?search=${encodeURIComponent(cleanQuery || '')}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'manga' || effectiveTarget === 'novels') {
      params.set('library', effectiveTarget);
      router.push(`/explore/search?${params.toString()}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'donghua') {
      params.set('library', 'donghua');
      router.push(`/explore/search?${params.toString()}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'hindi') {
      params.set('library', 'hindi');
      router.push(`/explore/search?${params.toString()}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'movies') {
      params.set('library', 'movies');
      router.push(`/explore/search?${params.toString()}`);
      setShowFilters(false);
      return;
    }
    if (effectiveTarget === 'drama') {
      params.set('library', 'drama');
      router.push(`/explore/search?${params.toString()}`);
      setShowFilters(false);
      return;
    }

    // Default universal search
    router.push(`/explore/search?${params.toString()}`); 
    setShowFilters(false); 
  };

  const toggleGenre = (g: string) => setFilters((prev: any) => ({ 
    ...prev, 
    genre: prev.genre.includes(g) ? prev.genre.filter((i: string) => i !== g) : [...prev.genre, g] 
  }));

  const handleSuggestionClick = (itemOrId: any, kind?: string) => {
    const item = typeof itemOrId === 'object' ? itemOrId : { id: itemOrId, _kind: kind };

    if (item.isPrefixGuide && item.targetPrefix) {
      setQuery(`${item.targetPrefix} `);
      return;
    }

    setQuery('');
    setShowFilters(false);

    const k = item._kind || kind;
    const id = item.id;

    if (k === 'user') { router.push(`/profile/${id}`); return; }
    if (k === 'clan') { router.push(`/social?clan=${id}`); return; }
    if (k === 'post') { router.push(`/social?post=${id}`); return; }
    if (k === 'news') { router.push(`/social?news=${id}`); return; }
    if (k === 'shorts') { 
      if (id && !id.startsWith('shorts_')) {
        router.push(`/shorts/watch?id=${encodeURIComponent(id)}`);
      } else {
        router.push(`/shorts?search=${encodeURIComponent(query)}`);
      }
      return; 
    }
    if (k === 'manga' || k === 'manhwa' || k === 'comic' || k === 'webtoon' || k === 'novel') { router.push(`/manga/${id}`); return; }
    if (k === 'donghua') { router.push(`/donghua-watch/${id}`); return; }
    if (k === 'hindi') { router.push(`/hindi-watch/${id}`); return; }
    if (k === 'drama' || k === 'movie' || k === 'movies' || k === 'series' || k === 'stream') { 
      router.push(`/stream/${id}${item.isMovie ? '?type=movie' : ''}`); 
      return; 
    }
    
    router.push(`/watch/${id}`);
  };

  const activateSearchFocus = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setCenterMode('SEARCH_FOCUSED'); 
    if (isMobile) setIsMobileSearchExpanded(true); 
  };
  const activateIslandFocus = (e: React.MouseEvent) => { e.stopPropagation(); setCenterMode('ISLAND_FOCUSED'); };
  const activateIslandDetails = (e: React.MouseEvent) => { e.stopPropagation(); if(centerMode === 'ISLAND_DETAILS') setCenterMode('ISLAND_FOCUSED'); else setCenterMode('ISLAND_DETAILS'); };
  const dismissNotification = (e: React.MouseEvent) => { e.stopPropagation(); setActiveNotif(null); setCenterMode('SEARCH_SOLO'); };
  const closeMobileExpand = () => { 
    setIsMobileSearchExpanded(false); 
    setCenterMode('ISLAND_FOCUSED');
    setShowFilters(false);
  };
  const resetFilters = () => setFilters({ target: 'all', genre: [], season: "", year: "", format: "", status: "", sort: "newest", language: "" });
  const shouldHideExtras = isMobile && (isMobileSearchExpanded || centerMode === 'ISLAND_DETAILS' || activeNotif || Boolean(petSpeech));
  const circleDiameter = isMobile ? 44 : 48;

  const getBadge = (role: string | undefined) => {
      switch(role) {
          case 'admin': return { label: 'Guild Master', textColor: 'text-red-400' };
          case 'moderator': return { label: 'Guild Manager', textColor: 'text-blue-400' };
          case 'user': return { label: 'Adventurer', textColor: 'text-emerald-400' };
          default: return { label: 'Traveler', textColor: 'text-zinc-400' };
      }
  };
  const badge = getBadge(profile?.role);

  if (!mounted) return <div className="fixed top-0 h-16 w-full z-[9999]" />;

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-[9999] pt-[0.08rem] px-2 sm:px-4 pointer-events-none font-sans h-auto min-h-[64px]">
        <style>{`
            @keyframes title-electric-pulse {
                0%, 78%, 100% {
                    text-shadow: 0 0 6px rgba(192, 132, 252, 0.45), 0 0 14px rgba(147, 51, 234, 0.28);
                }
                80% {
                    text-shadow: 0 0 12px #d8b4fe, 0 0 24px #a855f7, 0 0 3px #ffffff, 0 0 36px #7c3aed;
                    filter: drop-shadow(0 0 6px #c084fc);
                }
                83% {
                    text-shadow: 0 0 4px rgba(168, 85, 247, 0.3);
                    filter: none;
                }
                87% {
                    text-shadow: 0 0 16px #f3e8ff, 0 0 28px #9333ea, 0 0 4px #ffffff, 0 0 42px #6b21a8;
                    filter: drop-shadow(0 0 8px #a855f7);
                }
                91% {
                    text-shadow: 0 0 8px rgba(192, 132, 252, 0.45);
                    filter: none;
                }
            }
            @keyframes title-lightning-arc-1 {
                0%, 78%, 100% { opacity: 0; }
                80% { opacity: 0.95; transform: scaleY(1.08) skewX(-2deg); }
                83% { opacity: 0.15; }
                86% { opacity: 0.9; transform: scaleY(0.94) skewX(2deg); }
                90% { opacity: 0; }
            }
            @keyframes title-lightning-arc-2 {
                0%, 72%, 100% { opacity: 0; }
                74% { opacity: 0.9; transform: scaleY(1.06) skewX(3deg); }
                77% { opacity: 0.15; }
                81% { opacity: 0.85; transform: scaleY(0.92) skewX(-2deg); }
                85% { opacity: 0; }
            }
        `}</style>

        {/* SVG Tesla Filter for Title Electric Spark Arcs */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
            <defs>
                <filter id="tesla_lightning_title" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>
        </svg>

        <div className="w-full flex items-center justify-between gap-1 sm:gap-1.5 pointer-events-none relative">
            
            {/* LOGO & GUILD MASCOT */}
            <div className="pointer-events-auto z-40 shrink-0 flex items-center gap-1.5">
               <motion.div 
                    initial={false} 
                    animate={{ 
                        width: shouldHideExtras ? (isMobile ? 40 : 44) : (isMobile ? 132 : 212)
                    }} 
                    transition={JELLY_SPRING} 
                    className={cn(
                        "liquid-glass rounded-full flex items-center cursor-pointer hover:bg-[#162035] active:scale-95 relative shrink-0 overflow-hidden",
                        shouldHideExtras ? "aspect-square justify-center p-0" : `${ISLAND_HEIGHT}`
                    )} 
                    onClick={() => { playGummyTap(); router.push('/home'); }}
               >
                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><LightWave trigger={logoState} delay={0} /></div>
                    
                    {/* ShadowLogo: centered when shrunk, left-aligned when expanded */}
                    <div className={cn(
                        "flex items-center justify-center z-50 transition-all",
                        shouldHideExtras 
                            ? "absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none" 
                            : "absolute left-[3px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] md:w-[38px] md:h-[38px]"
                    )}>
                        <ShadowLogo size={isMobile ? "w-[34px] h-[34px]" : "w-[38px] h-[38px]"} />
                    </div>

                    <div className={cn("w-full h-full flex items-center justify-center pl-[38px] md:pl-[44px] pr-1.5 md:pr-2 relative z-10 overflow-hidden", shouldHideExtras && "hidden")}>
                        {/* Purple Electric Sparks across Title Box */}
                        <div className="absolute inset-0 pointer-events-none z-20 overflow-visible flex items-center justify-center">
                            <svg viewBox="0 0 150 40" className="w-full h-full pointer-events-none overflow-visible">
                                <path 
                                    d="M6,18 L32,27 L60,11 L92,25 L120,13 L144,21" 
                                    fill="none" 
                                    stroke="#c084fc" 
                                    strokeWidth="1.6" 
                                    filter="url(#tesla_lightning_title)" 
                                    style={{ 
                                        animation: 'title-lightning-arc-1 2.2s infinite',
                                        filter: 'drop-shadow(0 0 4px #a855f7) drop-shadow(0 0 2px #ffffff)' 
                                    }} 
                                />
                                <path 
                                    d="M12,24 L44,13 L76,28 L110,14 L138,23" 
                                    fill="none" 
                                    stroke="#e9d5ff" 
                                    strokeWidth="1.3" 
                                    filter="url(#tesla_lightning_title)" 
                                    style={{ 
                                        animation: 'title-lightning-arc-2 2.9s infinite 0.6s',
                                        filter: 'drop-shadow(0 0 5px #7c3aed)' 
                                    }} 
                                />
                            </svg>
                        </div>

                        <AnimatePresence mode="popLayout">
                            <motion.div key={logoState} variants={glitchVariants} initial="initial" animate="animate" exit="exit" className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                {shouldHideExtras ? null : ( 
                                    <>
                                        {/* Desktop Logo Text */}
                                        <div className="hidden md:flex items-center gap-1 font-lemon font-black uppercase w-[155px] justify-center">
                                            {logoState === 0 && (
                                                <span 
                                                    className="text-white text-[23px] md:text-[25px] tracking-[0.16em] md:tracking-[0.18em] font-lemon font-black uppercase text-center leading-none"
                                                    style={{ animation: 'title-electric-pulse 3s infinite' }}
                                                >
                                                    KAGEMI
                                                </span>
                                            )}
                                            {logoState === 1 && (
                                                <span 
                                                    className={cn("text-[19.5px] md:text-[21.5px] tracking-[0.10em] md:tracking-[0.12em] font-lemon font-black uppercase text-center truncate leading-none", currentPageInfo.color)}
                                                    style={{ animation: 'title-electric-pulse 3s infinite' }}
                                                >
                                                    {currentPageInfo.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Mobile Logo Text */}
                                        <div className="md:hidden flex items-center justify-center font-lemon font-black uppercase w-[90px]">
                                            {logoState === 0 && (
                                                <span 
                                                    className="text-white text-[17px] sm:text-[18px] tracking-[0.10em] leading-none whitespace-nowrap font-lemon font-black uppercase text-center"
                                                    style={{ animation: 'title-electric-pulse 3s infinite' }}
                                                >
                                                    KAGEMI
                                                </span>
                                            )}
                                            {logoState === 1 && (
                                                <span 
                                                    className={cn("text-[14.5px] sm:text-[15.5px] tracking-[0.04em] leading-none font-lemon font-black uppercase text-center truncate", currentPageInfo.color)}
                                                    style={{ animation: 'title-electric-pulse 3s infinite' }}
                                                >
                                                    {currentPageInfo.name}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* MIDDLE (SEARCH & DYNAMIC NOTIFICATION ISLAND) */}
            <div className="flex-1 flex items-center pointer-events-auto z-50 min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 w-full h-full relative">
                    {/* Unified Dynamic Island Capsule */}
                    <div 
                        onClick={() => {
                            if (isMobile && !petSpeech) {
                                setIsMobileSearchExpanded(true);
                            }
                        }} 
                        className={cn(
                            `relative liquid-glass !overflow-visible rounded-[30px] ${ISLAND_HEIGHT} flex items-center flex-1 w-full min-w-0`
                        )}
                    >
                        <SearchBarContent 
                            query={query} 
                            setQuery={setQuery} 
                            showFilters={showFilters} 
                            setShowFilters={setShowFilters} 
                            showGuideModal={showGuideModal} 
                            setShowGuideModal={setShowGuideModal} 
                            isLoadingSearch={isLoadingSearch} 
                            handleSearchSubmit={handleSearchSubmit} 
                            filters={filters} 
                            setFilters={setFilters} 
                            toggleGenre={toggleGenre} 
                            suggestions={suggestions} 
                            handleSuggestionClick={handleSuggestionClick} 
                            router={router} 
                            compact={isMobile && !isMobileSearchExpanded} 
                            isMobile={isMobile}
                            onCloseMobile={closeMobileExpand} 
                            onReset={resetFilters} 
                            waveTrigger={logoState} 
                            handleRandomSummon={handleRandomSummon} 
                            isRandomLoading={isRandomLoading} 
                            petSpeech={petSpeech}
                            activePetMeta={activePetMeta}
                            onDismissPetSpeech={() => { 
                                setPetSpeech(null); 
                                setActiveNotif(null); 
                                setIsMobileSearchExpanded(false); 
                                setCenterMode('ISLAND_FOCUSED');
                            }}
                            onSwitchToSearch={() => { setPetSpeech(null); if (isMobile) setIsMobileSearchExpanded(true); }}
                            onBoopMascot={handleBoopSpeech}
                        />
                    </div>

                    {/* Notification Bell (Desktop only: sits immediately to the left of Alpha) */}
                    <div 
                        className={cn("hidden lg:flex relative w-11 h-11 md:w-12 md:h-12 aspect-square rounded-full shrink-0 z-50 items-center justify-center")}
                    >
                        <Notifications />
                    </div>
                </div>
            </div>

            {/* --- RIGHT SECTION: DESKTOP CONTROLS & MOBILE/TABLET MERGED PILL --- */}
            {(() => {
                const profileDropdownMenuContent = (
                    <DropdownMenuContent align="end" className="liquid-glass text-zinc-300 p-2.5 rounded-[22px] z-[9999] w-[168px] sm:w-[180px]">
                        {isAuthenticated ? (
                            <div className="space-y-2">
                                <div className="flex flex-col items-center justify-center text-center px-1.5 pt-1 pb-0.5">
                                    <span className="text-[15px] font-black text-white uppercase tracking-wider truncate w-full text-center leading-tight">{profile?.username || 'Adventurer'}</span>
                                    <span className={cn("text-[8px] font-bold tracking-[0.2em] uppercase mt-0.5 opacity-80 text-center leading-none", badge.textColor)}>{badge.label}</span>
                                </div>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <div className="space-y-0.5">
                                    <DropdownMenuItem asChild><Link href="/profile" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><User size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Profile</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/library" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Flag size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Library</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/avatar" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Cat size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Avatar</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/settings" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Settings size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Settings</Link></DropdownMenuItem>
                                    {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                                        <DropdownMenuItem asChild><Link href="/master" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold text-red-500"><Shield size={14} className="mr-2.5 shrink-0" /> Admin Panel</Link></DropdownMenuItem>
                                    )}
                                </div>

                                <DropdownMenuSeparator className="bg-white/5" />

                                <DropdownMenuItem onClick={(e) => { 
                                    e.preventDefault(); 
                                    const role = profile?.role;
                                    let goodbyeMessage = '';
                                    let voiceKey: "BYE_MASTER" | "BYE_ADVENTURER" = "BYE_ADVENTURER";
                                    if (role === 'admin' || role === 'moderator') {
                                        goodbyeMessage = 'See you again, Master. Have a nice day. Goodbye.';
                                        voiceKey = 'BYE_MASTER'; 
                                    } else {
                                        goodbyeMessage = 'See you again, Adventurer. Have a nice day. Goodbye.';
                                        voiceKey = 'BYE_ADVENTURER'; 
                                    }
                                    playVoice(voiceKey);
                                    dispatchWhisper('Guild Receptionist', goodbyeMessage);
                                    if (typeof window !== 'undefined') {
                                        sessionStorage.removeItem('shadow_welcome_shown'); 
                                        sessionStorage.removeItem('shadow_suppress_welcome');
                                    }
                                    signOut().catch(() => {});
                                    setTimeout(() => {
                                        if (typeof window !== 'undefined') {
                                            window.location.reload(); 
                                        }
                                    }, 4000);
                                }} className="text-red-500 cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs py-2 px-2 rounded-lg font-bold">
                                    <LogOut size={14} className="mr-2.5 shrink-0" /> Leave
                                </DropdownMenuItem>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex flex-col items-center justify-center text-center px-1.5 pt-1 pb-0.5">
                                    <span className="text-[15px] font-black text-white uppercase tracking-wider truncate w-full text-center leading-tight">Traveller</span>
                                    <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-zinc-400 mt-0.5 opacity-80 text-center leading-none">Guest</span>
                                </div>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <div className="space-y-0.5">
                                    <DropdownMenuItem asChild><Link href="/profile" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><User size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Traveller Profile</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/library" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Flag size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Library</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/settings" className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Settings size={14} className="mr-2.5 text-zinc-400 shrink-0" /> Settings</Link></DropdownMenuItem>
                                </div>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } })); }} className="flex items-center w-full text-xs py-2 px-2 cursor-pointer hover:bg-primary/20 text-primary-400 rounded-lg transition-colors font-bold">
                                    <LogIn size={14} className="mr-2.5 shrink-0" /> Enter
                                </DropdownMenuItem>
                            </div>
                        )}
                    </DropdownMenuContent>
                );

                return (
                    <div className="pointer-events-auto z-40 shrink-0 flex items-center gap-2">
                        {/* 1. DESKTOP CONTROLS (Hidden on mobile/tablet) */}
                        <div className="hidden lg:flex items-center gap-2 shrink-0">
                            <AnimatePresence mode="popLayout">
                                {!shouldHideExtras && (
                                    <motion.div 
                                        key="actions" 
                                        layout
                                        initial={{ width: 0, opacity: 0, scale: 0.6 }} 
                                        animate={{ width: "auto", opacity: 1, scale: 1 }} 
                                        exit={{ width: 0, opacity: 0, scale: 0.6 }} 
                                        transition={JELLY_SPRING} 
                                        className="overflow-hidden flex items-center shrink-0"
                                    >
                                        <button 
                                            onClick={() => {
                                                playGummyTap();
                                                window.dispatchEvent(new CustomEvent('shadow-toggle-alpha'));
                                            }} 
                                            className={cn(
                                                `relative overflow-hidden flex items-center justify-center group liquid-glass hover:bg-[#162035] text-white font-bold rounded-full transition-all shrink-0 active:scale-90`,
                                                `w-11 h-11 md:w-auto md:h-12 aspect-square md:aspect-auto p-0 md:px-3.5 md:py-1.5 md:gap-2`
                                            )}
                                            title="Chat with Alpha AI"
                                        >
                                            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full"><LightWave trigger={logoState} delay={0.6} /></div>
                                            <img src="/images/alpha/alpha-av.png" alt="Alpha" className="w-7 h-7 rounded-full object-cover shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            <span className="hidden md:inline-block text-xs font-bold tracking-wider text-white uppercase select-none font-sans pr-1">
                                                Alpha
                                            </span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="relative rounded-full shrink-0">
                                <DropdownMenu modal={false} onOpenChange={setSettingsOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <button 
                                            onClick={() => playGummyTap()} 
                                            className={cn(
                                                "relative outline-none aspect-square rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform p-0",
                                                ISLAND_HEIGHT
                                            )}
                                            title="User Profile"
                                        >
                                            <div className="relative z-10 w-full h-full shrink-0 flex items-center justify-center">
                                                <ProfileAvatar 
                                                    profile={profile} 
                                                    travellerAvatar={!isAuthenticated ? travellerProfile.avatar : undefined} 
                                                    className="w-full h-full" 
                                                />
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    {profileDropdownMenuContent}
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* 2. MOBILE & TABLETS UNIFIED SINGLE PILL: BELL + ALPHA + PROFILE */}
                        <motion.div 
                            layout
                            transition={JELLY_SPRING}
                            className={cn(
                                "lg:hidden flex items-center liquid-glass rounded-full pl-2.5 pr-1 gap-1 shrink-0 z-50 pointer-events-auto !overflow-visible",
                                ISLAND_HEIGHT
                            )}
                        >
                            {/* Bell Icon (Unboxed) */}
                            <div className="relative flex items-center justify-center shrink-0">
                                <Notifications unboxed bellSize={17} />
                            </div>

                            {/* Alpha AI Button with Divider: Jelly Morph Hide & Show */}
                            <AnimatePresence initial={false}>
                                {!shouldHideExtras && (
                                    <motion.div
                                        key="mobile-alpha-jelly"
                                        layout
                                        initial={{ width: 0, opacity: 0, scale: 0.3 }}
                                        animate={{ width: 38, opacity: 1, scale: 1 }}
                                        exit={{ width: 0, opacity: 0, scale: 0.3 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 360,
                                            damping: 25,
                                            mass: 0.8
                                        }}
                                        className="overflow-hidden flex items-center shrink-0 whitespace-nowrap"
                                    >
                                        <div className="w-[1px] h-3.5 bg-white/10 shrink-0 mr-1.5" />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                playGummyTap();
                                                window.dispatchEvent(new CustomEvent('shadow-toggle-alpha'));
                                            }} 
                                            className="relative p-0 flex items-center justify-center rounded-full hover:opacity-80 active:scale-90 transition-transform outline-none shrink-0"
                                            title="Chat with Alpha AI"
                                        >
                                            <img 
                                                src="/images/alpha/alpha-av.png" 
                                                alt="Alpha" 
                                                className="w-7 h-7 rounded-full object-cover shrink-0" 
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                            />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />

                            {/* Profile Avatar (Edge-to-Edge with Pill Container, uncropped aura) */}
                            <DropdownMenu modal={false} onOpenChange={setSettingsOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button 
                                        type="button"
                                        onClick={() => playGummyTap()} 
                                        className="relative p-0 flex items-center justify-center rounded-full hover:opacity-80 active:scale-90 transition-transform outline-none shrink-0"
                                        title="User Profile"
                                    >
                                        <div className="w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] shrink-0 flex items-center justify-center">
                                            <ProfileAvatar 
                                                profile={profile} 
                                                travellerAvatar={!isAuthenticated ? travellerProfile.avatar : undefined} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                {profileDropdownMenuContent}
                            </DropdownMenu>
                        </motion.div>
                    </div>
                );
            })()}
        </div>
    </div>
  );
}

export default function WhisperIsland() {
    return (
        <Suspense fallback={<div className="fixed top-0 h-16 w-full z-[9999]" />}>
            <WhisperIslandContent />
        </Suspense>
    );
}
