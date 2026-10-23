"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Flame, Search, Film, 
  LockOpen, RefreshCw, Bookmark,
  ArrowUpDown, X, Check, Trash2,
  Trophy, Languages, Crown, Moon
} from 'lucide-react';
import { ShortDramaItem, ShortsCategoryTab } from '@/lib/shorts/types';
import { CURATED_HINDI_DRAMAS, CURATED_ENGLISH_DRAMAS } from '@/lib/shorts/curated';
import ShortDramaCard from '@/components/Shorts/ShortDramaCard';
import ShortsHeroCarousel from '@/components/Shorts/ShortsHeroCarousel';
import ShortsShelf from '@/components/Shorts/ShortsShelf';
import ShortsCategoryBar, { ShortsNavTab } from '@/components/Shorts/ShortsCategoryBar';
import { cn } from '@/lib/utils';

// Helper to convert curated detail items into ShortDramaItem
const toItem = (d: any): ShortDramaItem => ({
  id: d.id,
  source: d.source,
  title: d.title,
  originalTitle: d.originalTitle,
  cover: d.cover,
  banner: d.banner,
  description: d.description,
  totalEpisodes: d.totalEpisodes,
  language: d.language,
  tags: d.tags,
  views: d.views,
  rating: d.rating,
  releaseYear: d.releaseYear,
  status: d.status,
  isUnlocked: d.isUnlocked,
  firstEpisodeStream: d.episodes?.[0]?.streamUrl
});

const QUICK_SUGGESTIONS = ['Hindi Dub', 'CEO', 'Billionaire', 'Werewolf', 'Revenge', 'Secret Heiress'];

export default function ShortsDiscoveryPage() {
  const [activeTab, setActiveTab] = useState<ShortsNavTab>('trending');
  const [dramas, setDramas] = useState<ShortDramaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'episodes'>('popular');

  // Watchlist state (saved in localStorage)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Watchlist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yt_shorts_watchlist');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          setSavedIds(new Set(arr));
        }
      }
    } catch (e) {
      console.warn('Failed to parse yt_shorts_watchlist', e);
    }
  }, []);

  // Toggle Save handler
  const handleToggleSave = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSavedIds(prev => {
      const next = new Set(prev);
      const willSave = !next.has(id);
      if (willSave) {
        next.add(id);
        showToast('Saved to Watchlist');
      } else {
        next.delete(id);
        showToast('Removed from Watchlist');
      }
      try {
        localStorage.setItem('yt_shorts_watchlist', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Failed to save watchlist to localStorage', err);
      }
      return next;
    });
  }, []);

  // Clear all saved items
  const handleClearSaved = () => {
    setSavedIds(new Set());
    try {
      localStorage.removeItem('yt_shorts_watchlist');
    } catch (err) {
      console.warn('Failed to remove watchlist from localStorage', err);
    }
    showToast('Watchlist cleared');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2400);
  };

  // Pre-compiled curated lists for fast rendering
  const curatedHindi = useMemo(() => CURATED_HINDI_DRAMAS.map(toItem), []);
  const curatedEnglish = useMemo(() => CURATED_ENGLISH_DRAMAS.map(toItem), []);
  const allCurated = useMemo(() => [...curatedEnglish, ...curatedHindi], [curatedEnglish, curatedHindi]);

  // Featured Hero Blockbusters
  const heroItems = useMemo(() => {
    return [
      curatedEnglish[0], // The Double Life of My Billionaire Husband (2.4M)
      curatedHindi[2],   // The Fake Daughter & The Billionaire (1.2M)
      curatedEnglish[2], // The Alpha's Unwanted Mate (1.9M)
      curatedHindi[0],   // My Heart Belongs to His Bodyguard (840k)
    ].filter(Boolean);
  }, [curatedEnglish, curatedHindi]);

  // Curated Shelf collections
  const top10Leaderboard = useMemo(() => {
    const list = [
      curatedEnglish[0], // Double Life of Billionaire Husband
      curatedHindi[2],   // Fake Daughter & Billionaire
      curatedEnglish[2], // Alpha's Unwanted Mate
      curatedEnglish[1], // Never Divorce Secret Heiress
      curatedHindi[0],   // Heart Belongs to Bodyguard
      curatedHindi[1],   // The Magician Choomantar
      ...dramas.slice(0, 4)
    ].filter(Boolean);

    // Deduplicate by ID
    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 10);
  }, [curatedEnglish, curatedHindi, dramas]);

  const ceoCollection = useMemo(() => {
    return allCurated.filter(d => 
      d.tags.some(t => {
        const lower = t.toLowerCase();
        return lower.includes('ceo') || lower.includes('billionaire') || lower.includes('revenge');
      })
    );
  }, [allCurated]);

  const werewolfCollection = useMemo(() => {
    return allCurated.filter(d => 
      d.tags.some(t => {
        const lower = t.toLowerCase();
        return lower.includes('werewolf') || lower.includes('alpha') || lower.includes('supernatural');
      })
    );
  }, [allCurated]);

  // Fetch feed by category tab
  const fetchFeed = useCallback(async (tab: ShortsCategoryTab, pageNum: number, append: boolean = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const res = await fetch(`/api/shorts/feed?category=${tab}&page=${pageNum}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        if (append) {
          setDramas(prev => {
            const seen = new Set(prev.map(d => d.id));
            const newItems = data.items.filter((d: ShortDramaItem) => !seen.has(d.id));
            return [...prev, ...newItems];
          });
        } else {
          setDramas(data.items);
        }
        setHasMore(data.hasMore ?? false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load shorts feed:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Fetch on category tab change
  useEffect(() => {
    if (searchQuery.trim() || activeTab === 'saved') return;
    fetchFeed(activeTab as ShortsCategoryTab, 1, false);
  }, [activeTab, fetchFeed, searchQuery]);

  // Search handler with instant local match + debounced API query
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim().toLowerCase();
    // Instant local match on all curated items
    const localMatches = allCurated.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    );
    if (localMatches.length > 0) {
      setDramas(localMatches);
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/shorts/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          // Merge local matches with API items, deduplicating
          const seen = new Set<string>();
          const combined = [...localMatches, ...data.items].filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          setDramas(combined);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, allCurated]);

  // Filtered/Sorted Dramas for Grid Display
  const displayedGridDramas = useMemo(() => {
    let list = [...dramas];

    if (!searchQuery.trim() && activeTab === 'saved') {
      list = [...allCurated, ...dramas].filter(d => savedIds.has(d.id));
      // Deduplicate
      const seen = new Set<string>();
      list = list.filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
    } else if (sortBy === 'episodes') {
      list.sort((a, b) => b.totalEpisodes - a.totalEpisodes);
    }

    return list;
  }, [dramas, activeTab, savedIds, allCurated, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] pb-32 pt-1 sm:pt-2 px-2 sm:px-4 w-full selection:bg-[#ff0000] selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. YOUTUBE STICKY CATEGORY PILLS BAR */}
      {/* ============================================================== */}
      <ShortsCategoryBar
        activeTab={activeTab}
        onChangeTab={(t) => {
          setActiveTab(t);
          setPage(1);
          setSearchQuery('');
          setIsSearching(false);
        }}
        isLoading={isLoading}
        savedCount={savedIds.size}
        rightAction={
          <div className="flex items-center gap-2">
            {/* Minimal In-Page Search Toggle */}
            {isSearching ? (
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter shorts..."
                  className="w-36 sm:w-48 bg-white/5 border border-white/10 rounded-full py-1 pl-7 pr-7 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                    if (activeTab !== 'saved') fetchFeed(activeTab as ShortsCategoryTab, 1, false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearching(true)}
                title="Search within Shorts"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      />

      {/* Quick Search Suggestions when searching */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-4 px-0.5 flex-wrap">
          <span className="text-xs text-[#aaaaaa]">Suggestions:</span>
          {QUICK_SUGGESTIONS.map(term => (
            <button
              key={term}
              onClick={() => setSearchQuery(term)}
              className="text-xs px-2.5 py-1 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] transition-colors"
            >
              #{term}
            </button>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CINEMATIC HERO SPOTLIGHT (Trending Tab Only) */}
      {/* ============================================================== */}
      {!searchQuery && activeTab === 'trending' && (
        <ShortsHeroCarousel
          items={heroItems}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* ============================================================== */}
      {/* 4. HORIZONTAL SHELVES (Trending Tab Only) */}
      {/* ============================================================== */}
      {!searchQuery && activeTab === 'trending' && (
        <>
          {/* Shelf 1: 🏆 Top 10 Micro-Dramas Today */}
          <ShortsShelf
            title="Top 10 Micro-Dramas Today"
            subtitle="The most-watched short drama episodes across all languages"
            badge="Leaderboard"
            icon={<Trophy className="w-4 h-4 text-amber-400" />}
            items={top10Leaderboard}
            isLeaderboard={true}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />

          {/* Shelf 2: 🇮🇳 Trending in Hindi Dub */}
          <ShortsShelf
            title="Popular in Hindi Dub"
            subtitle="Full professional Hindi voice casts & high-stakes twists"
            badge="Full Audio"
            icon={<Languages className="w-4 h-4 text-emerald-400" />}
            items={curatedHindi}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSeeAll={() => setActiveTab('hindi')}
          />

          {/* Shelf 3: 👑 Billionaire, CEO & Revenge */}
          <ShortsShelf
            title="Billionaire, CEO & Revenge"
            subtitle="Hidden identities, contractual weddings, and ruthless comebacks"
            badge="Viral Tropes"
            icon={<Crown className="w-4 h-4 text-yellow-400" />}
            items={ceoCollection}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSeeAll={() => setActiveTab('western_ceo')}
          />

          {/* Shelf 4: 🐺 Werewolf & Forbidden Romance */}
          <ShortsShelf
            title="Werewolf & Forbidden Romance"
            subtitle="Alpha bloodlines, rejected luna mates, and nocturnal empires"
            badge="Top Fantasy"
            icon={<Moon className="w-4 h-4 text-purple-400" />}
            items={werewolfCollection}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSeeAll={() => setActiveTab('western_ceo')}
          />
        </>
      )}

      {/* ============================================================== */}
      {/* 5. EXPLORE ALL DRAMAS GRID (With Clean Sort & Filter) */}
      {/* ============================================================== */}
      <div className="mt-8 pt-5 border-t border-white/5">
        {/* Section Header with Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
              <Film className="w-4 h-4 text-zinc-300" />
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {searchQuery ? (
                <>
                  <span>Search Results for</span>
                  <span className="text-sky-400">"{searchQuery}"</span>
                </>
              ) : activeTab === 'saved' ? (
                <>
                  <span>My Watchlist</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    ({displayedGridDramas.length} saved titles)
                  </span>
                </>
              ) : activeTab === 'hindi' ? (
                <>
                  <span>Hindi Dubbed Micro-Series</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    ({displayedGridDramas.length} titles)
                  </span>
                </>
              ) : activeTab === 'english' ? (
                <>
                  <span>English Dubbed Originals</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    ({displayedGridDramas.length} titles)
                  </span>
                </>
              ) : activeTab === 'western_ceo' ? (
                <>
                  <span>Billionaire CEO & Werewolf Sagas</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    ({displayedGridDramas.length} titles)
                  </span>
                </>
              ) : activeTab === 'unlocked_67k' ? (
                <>
                  <span>Unlocked Multi-Source Vault</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    (Direct HD streaming across all providers)
                  </span>
                </>
              ) : (
                <>
                  <span>Explore All Micro-Dramas</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    ({displayedGridDramas.length}+ titles available)
                  </span>
                </>
              )}
            </h2>
          </div>

          {/* Sort Selector & Clear Watchlist (if on saved tab) */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {activeTab === 'saved' && displayedGridDramas.length > 0 && (
              <button
                onClick={handleClearSaved}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1 mr-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-500" />
              Sort:
            </span>
            <button
              onClick={() => setSortBy('popular')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                sortBy === 'popular'
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              Popular
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                sortBy === 'rating'
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              Rating
            </button>
            <button
              onClick={() => setSortBy('episodes')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                sortBy === 'episodes'
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              Episodes
            </button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 sm:gap-x-4 gap-y-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="aspect-[9/16] rounded-xl bg-[#212121]" />
                <div className="h-4 bg-[#212121] rounded w-5/6" />
                <div className="h-3 bg-[#212121] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedGridDramas.length > 0 ? (
          /* Cards Grid with YouTube 9:16 layout */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 sm:gap-x-4 gap-y-7">
            {displayedGridDramas.map((drama, idx) => (
              <ShortDramaCard
                key={`${drama.id}_${idx}`}
                drama={drama}
                priority={idx < 6}
                isSaved={savedIds.has(drama.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        ) : (
          /* Clean YouTube-style Empty State */
          <div className="py-20 text-center flex flex-col items-center justify-center bg-[#141414] rounded-2xl border border-[#272727] my-4">
            {activeTab === 'saved' ? (
              <>
                <Bookmark className="w-12 h-12 text-[#555555] mb-3" />
                <h3 className="text-base font-bold text-[#f1f1f1]">Your Watchlist is Empty</h3>
                <p className="text-xs text-[#aaaaaa] mt-1 max-w-sm">
                  Click the bookmark ribbon on any Short or mini-drama to save it here for quick binge-watching anytime.
                </p>
                <button
                  onClick={() => setActiveTab('trending')}
                  className="mt-4 px-4 py-2 rounded-full bg-[#ff0000] text-white text-xs font-bold hover:bg-[#cc0000] transition-colors"
                >
                  Browse Trending Shorts
                </button>
              </>
            ) : (
              <>
                <Film className="w-12 h-12 text-[#555555] mb-3" />
                <h3 className="text-base font-bold text-[#f1f1f1]">No mini-dramas found</h3>
                <p className="text-xs text-[#aaaaaa] mt-1 max-w-sm">
                  Try checking another category or searching for keywords like "CEO", "Hindi", "Billionaire", or "Revenge".
                </p>
              </>
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && !searchQuery && activeTab !== 'saved' && (
          <div className="flex justify-center mt-12">
            <button
              disabled={isLoadingMore}
              onClick={() => fetchFeed(activeTab as ShortsCategoryTab, page + 1, true)}
              className="px-8 py-2.5 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] text-xs font-bold transition-colors flex items-center gap-2 active:scale-95"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#ff0000]" />
                  <span>Loading more...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-zinc-300" />
                  <span>Load More Titles</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Direct-Feed Action Button */}
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <Link href="/shorts/watch?id=hindi_billionaire_bodyguard&ep=1">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl text-xs sm:text-sm font-medium shadow-2xl transition-all hover:scale-105 active:scale-95">
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span className="hidden sm:inline">Watch Short Reel</span>
            <span className="sm:hidden">Reel</span>
          </button>
        </Link>
      </div>

      {/* ============================================================== */}
      {/* 7. TOAST NOTIFICATION FOR WATCHLIST */}
      {/* ============================================================== */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#212121] text-[#f1f1f1] border border-[#3f3f3f] shadow-2xl flex items-center gap-2 text-xs font-semibold"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
