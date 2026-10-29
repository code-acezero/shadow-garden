"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AnimeService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn, getWatchRoute, getSafeImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Trash2, AlertCircle, Loader2,
  ChevronDown
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- COMPONENTS ---
import Footer from '@/components/Anime/Footer';
import AuthModal from '@/components/Auth/AuthModal';
import WatchlistCard from '@/components/Watchlist/WatchlistCard';
import ReadlistCard from '@/components/Watchlist/ReadlistCard';
import ContinueAnimeCard from '@/components/Anime/ContinueAnimeCard';
import ContinueReadingCard from '@/components/Watchlist/ContinueReadingCard';
import WatchlistSyncCockpit from '@/components/Watchlist/WatchlistSyncCockpit';
import { useUserData, ContinueReadingItem } from '@/context/UserDataContext';
import { playTapSound, playGummyTap } from '@/lib/audioManager';
import {
  PuffedTv,
  PuffedBook,
  PuffedPlay,
  PuffedCheck,
  PuffedBookmark,
  PuffedPause,
  PuffedClock,
  PuffedGrid,
  PuffedList,
  PuffedCompact,
  PuffedStar,
  PuffedInfo
} from '@/components/Watchlist/PuffedIcons';

interface ContinueItem {
  id: string;
  anime_id: string;
  title: string;
  poster: string;
  episode: number;
  episodeId: string;
  progress: number;
  totalEpisodes: number | string;
  type: string;
  media_type?: string;
  sub?: number;
  dub?: number;
  ageRating: string | null;
  isAdult: boolean;
}

const WatchlistSkeleton = () => (
  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5 animate-pulse">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="aspect-[2/3] bg-white/[0.03] rounded-2xl border border-white/5" />
    ))}
  </div>
);

function isFormatMatch(item: any, formatId: string, libraryMode: 'watchlist' | 'readlist'): boolean {
  if (!formatId || formatId === 'all') return true;

  const mType = (item.media_type || item.type || '').toLowerCase();
  const rawId = String(item.anime_id || item.manga_id || item.id || '').toLowerCase();
  const formatStr = String(item.format || '').toLowerCase();

  const isMovie = Boolean(
    item.isMovie ||
    mType === 'movie' ||
    mType === 'movies' ||
    mType === 'film' ||
    mType === 'cinema' ||
    formatStr === 'movie' ||
    rawId.startsWith('movie-')
  );

  const isDonghua = mType === 'donghua' || rawId.startsWith('donghua-');
  const isDrama = !isMovie && (mType === 'drama' || mType === 'kdrama' || mType === 'cdrama' || mType === 'jdrama' || rawId.startsWith('drama-'));
  const isShorts = mType === 'shorts' || mType === 'short' || mType === 'short-drama' || rawId.startsWith('short-');
  const isHindi = mType === 'hindi' || mType === 'hindi-anime' || mType.includes('hindi') || rawId.startsWith('hindi-');
  const isSeries = !isMovie && !isDrama && (mType === 'series' || mType === 'tv_show' || mType === 'show' || mType === 'tvseries' || rawId.startsWith('series-') || rawId.startsWith('tv-'));

  if (libraryMode === 'watchlist') {
    if (formatId === 'movie') return isMovie;
    if (formatId === 'drama') return isDrama;
    if (formatId === 'series') return isSeries;
    if (formatId === 'donghua') return isDonghua;
    if (formatId === 'shorts') return isShorts;
    if (formatId === 'hindi') return isHindi;
    if (formatId === 'anime' || formatId === 'tv') {
      return !isMovie && !isDrama && !isShorts && !isDonghua && (mType === 'anime' || mType === 'tv' || (!mType && !isSeries && !isHindi));
    }
    return true;
  } else {
    // Readlist
    if (formatId === 'manga') return mType === 'manga' || (!mType && !mType.includes('novel') && mType !== 'manhwa' && mType !== 'manhua');
    if (formatId === 'manhwa') return mType === 'manhwa' || mType === 'webtoon';
    if (formatId === 'manhua') return mType === 'manhua';
    if (formatId === 'novel') return mType.includes('novel') || mType === 'light_novel' || mType === 'web_novel';
    return true;
  }
}

function WatchlistContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { 
    watchlist, 
    readlist, 
    continueData, 
    continueReadingData, 
    loadingData, 
    refreshData, 
    updateLibraryStatus, 
    updateLibraryProgress,
    removeFromLibrary, 
    removeFromContinue, 
    clearContinueData,
    updateReadlistStatus,
    updateReadlistProgress,
    removeFromReadlist,
    removeFromContinueReading
  } = useUserData();

  const [libraryMode, setLibraryMode] = useState<'watchlist' | 'readlist'>('watchlist');
  const [activeTab, setActiveTab] = useState<string>('all'); 
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('updated_at');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [intelData, setIntelData] = useState<any | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  // Sync mode, tab and format from URL
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const resolvedMode = modeParam === 'readlist' ? 'readlist' : 'watchlist';
    setLibraryMode(resolvedMode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-library-mode', { detail: { mode: resolvedMode } }));
    }

    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);

    const formatParam = searchParams.get('format');
    if (formatParam) setFormatFilter(formatParam);
  }, [searchParams]);

  // Sync document title with active mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = libraryMode === 'readlist' ? 'Readlist | Shadow Garden' : 'Watchlist | Shadow Garden';
    }
  }, [libraryMode]);

  const handleModeChange = (mode: 'watchlist' | 'readlist') => {
    playTapSound();
    setLibraryMode(mode);
    setFormatFilter('all');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-library-mode', { detail: { mode } }));
    }
    const nextTab = !user ? (mode === 'watchlist' ? 'continue' : 'continue_reading') : 'all';
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    params.set('tab', nextTab);
    params.delete('format');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tabId: string) => {
    playTapSound();
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', libraryMode);
    params.set('tab', tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOpenIntel = async (animeId: string, fallbackTitle?: string, fallbackImage?: string) => {
    setSelectedAnimeId(animeId);
    setIntelLoading(true);
    setIntelData({
      id: animeId,
      title: fallbackTitle || 'Loading...',
      poster: fallbackImage || '',
      description: 'Retrieving anime intelligence dossier...',
      info: { genres: [], status: 'Analyzing...' },
      stats: { rating: 'PG-13', episodes: { sub: 0, dub: 0 } },
      characters: []
    });
    try {
      const info = await AnimeService.getAnimeInfo(animeId);
      if (info) setIntelData(info);
    } catch (e) {
      console.error("Failed to load intel", e);
    } finally {
      setIntelLoading(false);
    }
  };

  const handleCloseIntel = () => {
    setSelectedAnimeId(null);
    setIntelData(null);
  };

  const handleStatusChange = async (animeId: string, newStatus: string) => {
    if (libraryMode === 'readlist') {
      await updateReadlistStatus(animeId, newStatus);
    } else {
      updateLibraryStatus(animeId, newStatus);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-whisper', {
        detail: { id: Date.now(), type: 'success', title: "Library", message: `Status updated to ${newStatus.replace('_', ' ')}` }
      }));
    }
  };

  const handleRemove = async (id: string, isContinue: boolean = false) => {
    if (isContinue) {
      if (libraryMode === 'readlist') {
        await removeFromContinueReading(id);
      } else {
        if (user) {
          const { error } = await supabase.from('user_continue_watching').delete().eq('user_id', user.id).eq('anime_id', id);
          if (!error) removeFromContinue(id);
        } else {
          try {
            const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
            delete localData[id];
            localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));
            removeFromContinue(id);
          } catch (e) {}
        }
      }
    } else {
      if (libraryMode === 'readlist') {
        await removeFromReadlist(id);
      } else {
        removeFromLibrary(id);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-whisper', {
        detail: { id: Date.now(), type: 'system', title: "Library", message: 'Removed from library' }
      }));
    }
  };

  const isContinueItem = (item: any): item is ContinueItem => {
    return (item as ContinueItem)?.episodeId !== undefined;
  };

  const activeAnimeCount = watchlist.filter(i => i.status === 'watching').length;
  const activeReadingCount = readlist.filter(i => i.status === 'reading').length;

  // Format Filter Options
  const animeFormats = [
    { id: 'all', label: 'All Formats' },
    { id: 'anime', label: 'Anime' },
    { id: 'movie', label: 'Movies' },
    { id: 'series', label: 'Series' },
    { id: 'drama', label: 'Drama' },
    { id: 'donghua', label: 'Donghua' },
    { id: 'shorts', label: 'Shorts' },
    { id: 'hindi', label: 'Hindi Dubs' },
  ];

  const readingFormats = [
    { id: 'all', label: 'All Formats' },
    { id: 'manga', label: 'Manga' },
    { id: 'manhwa', label: 'Manhwa' },
    { id: 'manhua', label: 'Manhua' },
    { id: 'novel', label: 'Light Novel' },
  ];

  const currentFormats = libraryMode === 'watchlist' ? animeFormats : readingFormats;

  // Format counts for current tab base list
  const formatCounts = useMemo(() => {
    let baseList: any[] = [];
    if (libraryMode === 'watchlist') {
      if (activeTab === 'continue') baseList = continueData;
      else if (activeTab === 'all') baseList = watchlist;
      else baseList = watchlist.filter((i) => i.status === activeTab);
    } else {
      if (activeTab === 'continue_reading') baseList = continueReadingData;
      else if (activeTab === 'all') baseList = readlist;
      else baseList = readlist.filter((i) => i.status === activeTab);
    }

    const counts: Record<string, number> = { all: baseList.length };
    currentFormats.forEach((fmt) => {
      if (fmt.id === 'all') return;
      counts[fmt.id] = baseList.filter((item) => isFormatMatch(item, fmt.id, libraryMode)).length;
    });
    return counts;
  }, [libraryMode, activeTab, watchlist, readlist, continueData, continueReadingData, currentFormats]);

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    let base: any[] = [];
    if (libraryMode === 'watchlist') {
      if (activeTab === 'continue') base = continueData;
      else if (activeTab === 'all') base = watchlist;
      else base = watchlist.filter(i => i.status === activeTab);
    } else {
      if (activeTab === 'continue_reading') base = continueReadingData;
      else if (activeTab === 'all') base = readlist;
      else base = readlist.filter(i => i.status === activeTab);
    }

    // Format filter
    if (formatFilter !== 'all') {
      base = base.filter((i) => isFormatMatch(i, formatFilter, libraryMode));
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter((i) => {
        const title = i.title || i.anime_title || '';
        return title.toLowerCase().includes(q);
      });
    }

    // Sort
    return [...base].sort((a, b) => {
      if (activeTab === 'continue' || activeTab === 'continue_reading') return 0;
      if (sortOption === 'title') {
        const titleA = a.title || a.anime_title || '';
        const titleB = b.title || b.anime_title || '';
        return titleA.localeCompare(titleB);
      }
      if (sortOption === 'score') {
        const scoreA = Number(a.score || 0);
        const scoreB = Number(b.score || 0);
        return scoreB - scoreA;
      }
      if (sortOption === 'progress') {
        const progA = a.last_episode_number ?? a.chapters_read ?? a.progress ?? 0;
        const progB = b.last_episode_number ?? b.chapters_read ?? b.progress ?? 0;
        return progB - progA;
      }
      const dateA = new Date(a.updated_at || a.last_read || 0).getTime();
      const dateB = new Date(b.updated_at || b.last_read || 0).getTime();
      return dateB - dateA;
    });
  }, [libraryMode, watchlist, readlist, continueData, continueReadingData, activeTab, formatFilter, searchQuery, sortOption]);

  const primaryTabs = useMemo(() => {
    if (libraryMode === 'watchlist') {
      return [
        { id: 'all', label: 'All', icon: PuffedTv, count: watchlist.length },
        { id: 'watching', label: 'Watching', icon: PuffedPlay, count: activeAnimeCount },
        { id: 'continue', label: 'Continue', icon: PuffedClock, count: continueData.length },
        { id: 'plan_to_watch', label: 'Planned', icon: PuffedBookmark, count: watchlist.filter(i => i.status === 'plan_to_watch').length },
      ];
    }
    return [
      { id: 'all', label: 'All', icon: PuffedBook, count: readlist.length },
      { id: 'reading', label: 'Reading', icon: PuffedPlay, count: activeReadingCount },
      { id: 'continue_reading', label: 'Continue', icon: PuffedClock, count: continueReadingData.length },
      { id: 'plan_to_read', label: 'Planned', icon: PuffedBookmark, count: readlist.filter(i => i.status === 'plan_to_read').length },
    ];
  }, [libraryMode, watchlist, readlist, activeAnimeCount, activeReadingCount, continueData, continueReadingData]);

  const secondaryTabs = useMemo(() => {
    if (libraryMode === 'watchlist') {
      return [
        { id: 'completed', label: 'Completed', icon: PuffedCheck, count: watchlist.filter(i => i.status === 'completed').length },
        { id: 'on_hold', label: 'On Hold', icon: PuffedPause, count: watchlist.filter(i => i.status === 'on_hold').length },
        { id: 'dropped', label: 'Dropped', icon: PuffedClock, count: watchlist.filter(i => i.status === 'dropped').length },
      ];
    }
    return [
      { id: 'completed', label: 'Completed', icon: PuffedCheck, count: readlist.filter(i => i.status === 'completed').length },
      { id: 'on_hold', label: 'On Hold', icon: PuffedPause, count: readlist.filter(i => i.status === 'on_hold').length },
      { id: 'dropped', label: 'Dropped', icon: PuffedClock, count: readlist.filter(i => i.status === 'dropped').length },
    ];
  }, [libraryMode, watchlist, readlist]);

  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);
  const activeSecondary = secondaryTabs.find(t => t.id === activeTab);
  const currentTotalCount = libraryMode === 'watchlist' ? watchlist.length : readlist.length;

  if (authLoading) return <div className="min-h-screen bg-[#050507]" />;

  return (
    <div className="flex-1 pb-16 pt-2">
      {/* Container width strictly matches top nav WhisperIsland (px-2 sm:px-4) */}
      <div className="w-full px-2 sm:px-4">
        
        {/* ─── HEADER: CLEAN & MONOCHROMATIC ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-zinc-400 font-bold">
                Shadow Vault
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">/</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {currentTotalCount} {libraryMode === 'watchlist' ? 'titles' : 'books'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              Library
            </h1>
          </div>

          {/* Right Header: Compact AniList Mini Dropdown + Watchlist/Readlist Switcher */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <WatchlistSyncCockpit onSyncComplete={() => refreshData()} mediaType={libraryMode === 'watchlist' ? 'anime' : 'manga'} />

            {/* Seamless Watchlist / Readlist Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => handleModeChange('watchlist')}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0 select-none",
                  libraryMode === 'watchlist'
                    ? "bg-white text-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <PuffedTv size={13} />
                <span>Watchlist</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                  libraryMode === 'watchlist' ? "bg-black/10 text-black" : "bg-white/5 text-zinc-500"
                )}>
                  {watchlist.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('readlist')}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0 select-none",
                  libraryMode === 'readlist'
                    ? "bg-white text-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <PuffedBook size={13} />
                <span>Readlist</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                  libraryMode === 'readlist' ? "bg-black/10 text-black" : "bg-white/5 text-zinc-500"
                )}>
                  {readlist.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── CONTROLS: MINIMIZED TABS, COMPACT FORMATS & SEARCH TOOLBAR ─── */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Row 1: Minimized Primary Status Tabs + Readlist Format Dropdown + Right Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Left: Minimized Tabs & Status Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {primaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "h-8 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border select-none active:scale-95 flex items-center gap-1.5 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0",
                      isActive
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    <Icon size={12} />
                    <span>{tab.label}</span>
                    <span className={cn(
                      "text-[10px] font-mono",
                      isActive ? "text-zinc-700" : "text-zinc-500"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}

              {/* Status Dropdown Menu (Completed, On Hold, Dropped) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "h-8 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border select-none active:scale-95 flex items-center gap-1.5 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0",
                      isSecondaryActive
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    {activeSecondary ? (
                      <>
                        <activeSecondary.icon size={12} />
                        <span>{activeSecondary.label}</span>
                        <span className="text-[10px] font-mono text-zinc-700">{activeSecondary.count}</span>
                      </>
                    ) : (
                      <>
                        <span>Status</span>
                      </>
                    )}
                    <ChevronDown size={11} className={isSecondaryActive ? "text-zinc-700" : "text-zinc-500"} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-44 bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 text-white rounded-xl p-1 shadow-2xl z-50 outline-none"
                >
                  {secondaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isTabActive = activeTab === tab.id;
                    return (
                      <DropdownMenuItem
                        key={tab.id}
                        onSelect={() => handleTabChange(tab.id)}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors outline-none",
                          isTabActive ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={12} />
                          <span>{tab.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{tab.count}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Compact Dropdown Filter for Formats (Watchlist & Readlist) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "h-8 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border select-none active:scale-95 flex items-center gap-1.5 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0",
                      formatFilter !== 'all'
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    {libraryMode === 'watchlist' ? <PuffedTv size={12} /> : <PuffedBook size={12} />}
                    <span>
                      {formatFilter === 'all' 
                        ? 'Format' 
                        : currentFormats.find(f => f.id === formatFilter)?.label || 'Format'}
                    </span>
                    {formatFilter !== 'all' && formatCounts[formatFilter] !== undefined && (
                      <span className="text-[10px] font-mono text-zinc-700">{formatCounts[formatFilter]}</span>
                    )}
                    <ChevronDown size={11} className={formatFilter !== 'all' ? "text-zinc-700" : "text-zinc-500"} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48 bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 text-white rounded-xl p-1 shadow-2xl z-50 outline-none"
                >
                  {currentFormats.map((fmt) => {
                    const count = formatCounts[fmt.id] ?? 0;
                    const isSelected = formatFilter === fmt.id;
                    return (
                      <DropdownMenuItem
                        key={fmt.id}
                        onSelect={() => {
                          playGummyTap();
                          setFormatFilter(fmt.id);
                          const params = new URLSearchParams(searchParams.toString());
                          if (fmt.id === 'all') params.delete('format');
                          else params.set('format', fmt.id);
                          router.push(`?${params.toString()}`, { scroll: false });
                        }}
                        onClick={() => {
                          playGummyTap();
                          setFormatFilter(fmt.id);
                          const params = new URLSearchParams(searchParams.toString());
                          if (fmt.id === 'all') params.delete('format');
                          else params.set('format', fmt.id);
                          router.push(`?${params.toString()}`, { scroll: false });
                        }}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors outline-none",
                          isSelected ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <span>{fmt.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{count}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear History Button for continue tabs with Safe Confirmation */}
              {((activeTab === 'continue' && continueData.length > 0) || (activeTab === 'continue_reading' && continueReadingData.length > 0)) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      type="button"
                      className="h-8 px-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0"
                      title="Clear playback progress markers"
                    >
                      <Trash2 size={12} />
                      <span className="hidden sm:inline text-[11px]">Clear Progress</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0c0c0e] border border-white/10 text-white rounded-2xl max-w-sm p-6 outline-none flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1">
                      <Trash2 size={20} className="text-white" />
                    </div>

                    <AlertDialogHeader className="flex flex-col items-center text-center space-y-1.5 w-full">
                      <AlertDialogTitle className="text-base font-bold text-white text-center">
                        Clear Continue Progress?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400 text-xs text-center leading-relaxed">
                        This resets your in-progress resume bookmarks. Your saved {libraryMode === 'watchlist' ? 'Watchlist' : 'Readlist'} titles will stay safe and untouched.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="mt-5 w-full grid grid-cols-2 gap-2.5 sm:space-x-0">
                      <AlertDialogCancel className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold m-0 transition-colors outline-none focus:outline-none focus:ring-0">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={async () => {
                          if (activeTab === 'continue') {
                            if (user) await supabase.from('user_continue_watching').delete().eq('user_id', user.id);
                            clearContinueData();
                          } else {
                            if (user) await supabase.from('user_continue_reading').delete().eq('user_id', user.id);
                            if (typeof window !== 'undefined') localStorage.removeItem('shadow_continue_reading');
                            await refreshData();
                          }
                        }}
                        className="w-full h-9 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold m-0 transition-colors outline-none focus:outline-none focus:ring-0"
                      >
                        Clear Progress
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Right Tools: Search, Sort, View Modes */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-48 md:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                <Input
                  placeholder="Filter by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.03] border-white/10 pl-7 pr-7 h-8 rounded-xl focus:border-white/30 text-xs text-white placeholder:text-zinc-600 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white outline-none focus:outline-none"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-28 sm:w-32 bg-white/[0.03] border-white/10 h-8 rounded-xl text-[11px] font-bold text-zinc-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 ring-0 ring-offset-0">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-xl text-xs z-50 outline-none">
                  <SelectItem value="updated_at">Recent</SelectItem>
                  <SelectItem value="score">Rating</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>

              {/* View Modes (Grid, List, Compact) */}
              <div className="flex items-center bg-white/[0.03] rounded-xl border border-white/10 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => { playGummyTap(); setViewMode('grid'); }}
                  title="Grid view"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0",
                    viewMode === 'grid' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <PuffedGrid size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => { playGummyTap(); setViewMode('list'); }}
                  title="List view"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0",
                    viewMode === 'list' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <PuffedList size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => { playGummyTap(); setViewMode('compact'); }}
                  title="Compact view"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0",
                    viewMode === 'compact' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <PuffedCompact size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CONTENT GRID / LIST / COMPACT ─── */}
        <div className="min-h-[450px]">
          {loadingData ? (
            <WatchlistSkeleton />
          ) : filteredData.length > 0 ? (
            viewMode === 'grid' ? (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredData.map((item) => (
                    <motion.div
                      key={item.id || (isContinueItem(item) ? item.anime_id : (item.anime_id || item.manga_id))}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {libraryMode === 'watchlist' ? (
                        isContinueItem(item) ? (
                          <div className="relative group">
                            <ContinueAnimeCard
                              anime={item}
                              className="w-full h-full"
                              onClick={(id, episodeId, type) => router.push(getWatchRoute(id, episodeId, item.media_type || type))}
                            />
                            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-30">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenIntel(item.anime_id, item.title, item.poster);
                                }}
                                title="Anime Intel"
                                className="w-7 h-7 rounded-full bg-black/70 hover:bg-white text-zinc-300 hover:text-black border border-white/20 flex items-center justify-center backdrop-blur-md transition-all"
                              >
                                <PuffedInfo size={12} />
                              </button>
                              <button
                                onClick={() => handleRemove(item.anime_id, true)}
                                className="w-7 h-7 rounded-full bg-black/70 hover:bg-white text-zinc-300 hover:text-black border border-white/20 flex items-center justify-center backdrop-blur-md transition-all"
                                title="Remove from Continue"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <WatchlistCard
                            item={item as any}
                            viewMode="grid"
                            onStatusChange={handleStatusChange}
                            onRemove={(id) => handleRemove(id, false)}
                            onOpenIntel={handleOpenIntel}
                            onProgressUpdate={(animeId, newEp) => updateLibraryProgress(animeId, newEp, (item as any).total_episodes ? parseInt(String((item as any).total_episodes), 10) : undefined)}
                          />
                        )
                      ) : (
                        activeTab === 'continue_reading' ? (
                          <ContinueReadingCard
                            item={item as any}
                            viewMode="grid"
                            onRemove={removeFromContinueReading}
                          />
                        ) : (
                          <ReadlistCard
                            item={item}
                            viewMode="grid"
                            onStatusChange={updateReadlistStatus}
                            onRemove={removeFromReadlist}
                            onProgressUpdate={updateReadlistProgress}
                          />
                        )
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : viewMode === 'list' ? (
              <motion.div layout className="flex flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                  {filteredData.map((item) => (
                    <motion.div
                      key={item.id || (isContinueItem(item) ? item.anime_id : (item.anime_id || item.manga_id))}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      {libraryMode === 'watchlist' ? (
                        isContinueItem(item) ? (
                          <div className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/10 transition-all select-none cursor-pointer">
                            <div 
                              className="w-16 h-22 sm:w-20 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 relative cursor-pointer"
                              onClick={() => router.push(getWatchRoute(item.anime_id, item.episodeId, item.media_type || item.type))}
                            >
                              <img src={getSafeImageUrl(item.poster)} alt="poster" className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                                <div className="h-full bg-white" style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>

                            <div 
                              className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer"
                              onClick={() => router.push(getWatchRoute(item.anime_id, item.episodeId, item.media_type || item.type))}
                            >
                              <h3 className="font-bold text-white text-sm sm:text-base truncate group-hover:text-zinc-200">
                                {item.title}
                              </h3>
                              <p className="text-xs text-zinc-400 font-mono mt-1">
                                Episode {item.episode}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => router.push(getWatchRoute(item.anime_id, item.episodeId, item.media_type || item.type))}
                                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                              >
                                <PuffedPlay size={11} />
                                <span className="hidden sm:inline">Resume</span>
                              </button>

                              <button 
                                onClick={() => handleOpenIntel(item.anime_id, item.title, item.poster)}
                                title="Intel Dossier"
                                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <PuffedInfo size={14} />
                              </button>

                              <button
                                onClick={() => handleRemove(item.anime_id, true)}
                                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                title="Remove from Continue"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <WatchlistCard
                            item={item as any}
                            viewMode="list"
                            onStatusChange={handleStatusChange}
                            onRemove={(id) => handleRemove(id, false)}
                            onOpenIntel={handleOpenIntel}
                            onProgressUpdate={(animeId, newEp) => updateLibraryProgress(animeId, newEp, (item as any).total_episodes ? parseInt(String((item as any).total_episodes), 10) : undefined)}
                          />
                        )
                      ) : (
                        activeTab === 'continue_reading' ? (
                          <ContinueReadingCard
                            item={item as any}
                            viewMode="list"
                            onRemove={removeFromContinueReading}
                          />
                        ) : (
                          <ReadlistCard
                            item={item}
                            viewMode="list"
                            onStatusChange={updateReadlistStatus}
                            onRemove={removeFromReadlist}
                            onProgressUpdate={updateReadlistProgress}
                          />
                        )
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* COMPACT TABLE/ROW VIEW */
              <div className="flex flex-col divide-y divide-white/5 border-y border-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredData.map((item) => (
                    <motion.div
                      key={item.id || (isContinueItem(item) ? item.anime_id : (item.anime_id || item.manga_id))}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {libraryMode === 'watchlist' ? (
                        isContinueItem(item) ? (
                          <div className="flex items-center justify-between py-2.5 px-2 hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => router.push(getWatchRoute(item.anime_id, item.episodeId, item.media_type || item.type))}>
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img src={getSafeImageUrl(item.poster)} alt="poster" className="w-8 h-10 object-cover rounded-md bg-zinc-900 border border-white/10 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                <span className="text-[10px] text-zinc-500 font-mono">Episode {item.episode}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => router.push(getWatchRoute(item.anime_id, item.episodeId, item.media_type || item.type))} className="h-7 px-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-[10px] font-bold flex items-center gap-1">
                                <PuffedPlay size={10} />
                                <span>Play</span>
                              </button>
                              <button onClick={() => handleRemove(item.anime_id, true)} className="p-1.5 text-zinc-500 hover:text-white">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <WatchlistCard
                            item={item as any}
                            viewMode="compact"
                            onStatusChange={handleStatusChange}
                            onRemove={(id) => handleRemove(id, false)}
                            onOpenIntel={handleOpenIntel}
                            onProgressUpdate={(animeId, newEp) => updateLibraryProgress(animeId, newEp, (item as any).total_episodes ? parseInt(String((item as any).total_episodes), 10) : undefined)}
                          />
                        )
                      ) : (
                        activeTab === 'continue_reading' ? (
                          <ContinueReadingCard
                            item={item as any}
                            viewMode="compact"
                            onRemove={removeFromContinueReading}
                          />
                        ) : (
                          <ReadlistCard
                            item={item}
                            viewMode="compact"
                            onStatusChange={updateReadlistStatus}
                            onRemove={removeFromReadlist}
                            onProgressUpdate={updateReadlistProgress}
                          />
                        )
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center select-none">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
                {libraryMode === 'watchlist' ? <PuffedTv size={22} /> : <PuffedBook size={22} />}
              </div>
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                {libraryMode === 'watchlist' ? 'No Anime in this collection' : 'No Books in this collection'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                {libraryMode === 'watchlist'
                  ? 'Titles you track or watch will appear here.'
                  : 'Chapters and series you read will be cataloged here.'}
              </p>
              <Link
                href={libraryMode === 'watchlist' ? '/home' : '/manga'}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-xs font-bold transition-all border border-white/15"
              >
                {libraryMode === 'watchlist' ? 'Explore Anime' : 'Explore Manga & Novels'}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── ANIME INTEL MODAL ─── */}
      <AnimatePresence>
        {selectedAnimeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
            onClick={handleCloseIntel}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0b0b0e] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <PuffedInfo size={15} className="text-white" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Archive Intelligence
                  </span>
                </div>
                <button
                  onClick={handleCloseIntel}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 mx-auto sm:mx-0">
                    <img
                      src={getSafeImageUrl(intelData?.poster || intelData?.image || '/images/placeholder-no-img.jpg')}
                      alt="poster"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/placeholder-no-img.jpg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                        {typeof intelData?.title === 'object' 
                          ? (intelData.title.english || intelData.title.userPreferred || intelData.title.romaji) 
                          : (intelData?.title || 'Unknown Title')}
                      </h2>
                      {intelData?.jname && (
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                          {intelData.jname}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {intelData?.stats?.rating && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase text-zinc-300">
                            {intelData.stats.rating}
                          </span>
                        )}
                        {intelData?.info?.status && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase text-zinc-300">
                            {intelData.info.status}
                          </span>
                        )}
                        {(intelData?.stats?.malScore || intelData?.score) && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono font-bold text-white flex items-center gap-1">
                            <PuffedStar size={10} className="text-white" />
                            {intelData?.stats?.malScore || intelData?.score}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5">
                      <Button
                        onClick={() => {
                          handleCloseIntel();
                          router.push(getWatchRoute(selectedAnimeId!, undefined, intelData?.media_type || intelData?.type));
                        }}
                        className="w-full h-9 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-xs gap-1.5"
                      >
                        <PuffedPlay size={12} />
                        <span>Watch Now</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Synopsis */}
                {intelData?.description && (
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Synopsis
                    </h4>
                    <p 
                      className="text-xs text-zinc-400 leading-relaxed max-h-28 overflow-y-auto pr-1"
                      dangerouslySetInnerHTML={{ __html: intelData.description }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={() => window.location.reload()} />
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-sans selection:bg-white/20 overflow-x-hidden">
      <Suspense fallback={<div className="min-h-screen bg-[#050507]"><WatchlistSkeleton /></div>}>
        <WatchlistContent />
      </Suspense>
      <Footer />
    </div>
  );
}