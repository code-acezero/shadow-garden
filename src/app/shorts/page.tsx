"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Play, Search, Film, Sparkles, Languages, 
  LockOpen, RefreshCw, Layers, Compass 
} from 'lucide-react';
import { ShortDramaItem, ShortsCategoryTab } from '@/lib/shorts/types';
import ShortDramaCard from '@/components/Shorts/ShortDramaCard';
import ShortsCategoryBar from '@/components/Shorts/ShortsCategoryBar';
import { 
  ATRAX_BUBBLY_SPRING, 
  ATRAX_CAPSULE_SPRING, 
  ATRAX_GENTLE_SPRING, 
  atraxSquishTapVariants 
} from '@/lib/atraxMotion';
import { cn } from '@/lib/utils';

export default function ShortsDiscoveryPage() {
  const [activeTab, setActiveTab] = useState<ShortsCategoryTab>('trending');
  const [dramas, setDramas] = useState<ShortDramaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

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
    if (searchQuery.trim()) return;
    fetchFeed(activeTab, 1, false);
  }, [activeTab, fetchFeed, searchQuery]);

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/shorts/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setDramas(data.items);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hero Featured Drama (first item)
  const heroDrama = dramas[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28 pt-28 md:pt-32 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Vertical Drama Hub
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              100% Unlocked Free
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Shorts & Mini-Dramas
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Over 67,000+ micro-dramas in Hindi Dub, English Dub, CEO, Werewolf & Chinese originals.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Hindi, CEO, Billionaire..."
            className="w-full bg-slate-900/90 border border-white/10 rounded-full py-2.5 pl-10 pr-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                fetchFeed(activeTab, 1, false);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Hero Highlight Banner (When not searching) */}
      {!searchQuery && heroDrama && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ATRAX_GENTLE_SPRING}
          className="relative w-full rounded-[32px] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl mb-8 group"
        >
          {/* Banner Backing with Ambient Backdrop */}
          <div className="relative h-[220px] md:h-[320px] w-full overflow-hidden">
            <img
              src={heroDrama.banner || heroDrama.cover}
              alt={heroDrama.title}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent md:w-2/3" />
          </div>

          {/* Banner Content Overlay */}
          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white font-mono uppercase tracking-wider">
                Featured Release
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-slate-200 backdrop-blur-md">
                {heroDrama.language}
              </span>
              <span className="text-xs text-amber-400 font-bold ml-1">
                ★ {heroDrama.rating || '9.6'}
              </span>
            </div>

            <h2 className="text-xl md:text-3xl font-extrabold text-white line-clamp-1 max-w-2xl drop-shadow-md">
              {heroDrama.title}
            </h2>

            <p className="text-xs md:text-sm text-slate-300 line-clamp-2 max-w-xl mt-1.5 leading-relaxed">
              {heroDrama.description}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <Link href={`/shorts/watch?id=${encodeURIComponent(heroDrama.id)}&ep=1`}>
                <motion.button
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Episode 1</span>
                </motion.button>
              </Link>
              <span className="text-xs text-slate-400 font-medium">
                {heroDrama.totalEpisodes} Full Episodes
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Pills Bar */}
      {!searchQuery && (
        <div className="mb-6">
          <ShortsCategoryBar
            activeTab={activeTab}
            onChangeTab={(t) => {
              setActiveTab(t);
              setPage(1);
            }}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Search Header Result */}
      {searchQuery && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Results for <strong className="text-white">"{searchQuery}"</strong> ({dramas.length} found)
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[9/16] rounded-3xl bg-slate-900/60 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : dramas.length > 0 ? (
        /* Short Dramas Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-5">
          {dramas.map((drama, idx) => (
            <ShortDramaCard
              key={`${drama.id}_${idx}`}
              drama={drama}
              priority={idx < 5}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Film className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No mini-dramas found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Try checking another category or searching for keywords like "CEO", "Hindi", "Billionaire", or "Revenge".
          </p>
        </div>
      )}

      {/* Load More Button for 67k+ Unlocked / Trending */}
      {hasMore && !isLoading && !searchQuery && (
        <div className="flex justify-center mt-10">
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            disabled={isLoadingMore}
            onClick={() => fetchFeed(activeTab, page + 1, true)}
            className="px-6 py-2.5 rounded-full bg-slate-900 border border-white/15 text-white text-xs font-bold hover:bg-slate-800 hover:border-primary/40 transition-colors flex items-center gap-2 shadow-lg"
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Loading more dramas...</span>
              </>
            ) : (
              <span>Load More Titles</span>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
