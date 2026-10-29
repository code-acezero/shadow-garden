"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Radio, ChevronRight, Clock, Play, CheckCircle2, Loader2, Calendar, Star, ChevronDown, Layers, Captions, Mic, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getSafeImageUrl, slugifyTitle } from '@/lib/utils';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import AnimeHoverCard from '@/components/Anime/AnimeHoverCard';
import { playGummyTap } from '@/lib/audioManager';

interface StreamingTodayProps {
  initialItems?: any[];
}

const STREAMING_FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'sub', label: 'Subbed', icon: Captions },
  { id: 'dub', label: 'Eng Dub', icon: Mic },
  { id: 'hi', label: 'Hindi Dub', icon: Radio },
] as const;

type StreamingFilterType = typeof STREAMING_FILTER_OPTIONS[number]['id'];

export default function StreamingTodaySection({ initialItems = [] }: StreamingTodayProps) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<StreamingFilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const pageCache = useRef<Record<string, { items: any[]; totalPages: number; hasNextPage: boolean }>>({});
  const nowSec = Math.floor(Date.now() / 1000);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1) return;
    const cacheKey = `${filter}_${newPage}`;
    const cached = pageCache.current[cacheKey];
    if (cached) {
      setItems(cached.items);
      setTotalPages(cached.totalPages);
      setHasNextPage(cached.hasNextPage);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setPage(newPage);
  };

  const handleFilterSelect = (newFilter: StreamingFilterType) => {
    if (newFilter === filter) {
      setIsFilterOpen(false);
      return;
    }
    playGummyTap();
    setFilter(newFilter);
    setPage(1);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    if (initialItems && initialItems.length > 0 && page === 1 && filter === 'all' && !pageCache.current['all_1']) {
      pageCache.current['all_1'] = { items: initialItems, totalPages: 1, hasNextPage: true };
    }
  }, [initialItems]);

  useEffect(() => {
    const cacheKey = `${filter}_${page}`;
    const cached = pageCache.current[cacheKey];
    if (cached) {
      setItems(cached.items);
      setTotalPages(cached.totalPages);
      setHasNextPage(cached.hasNextPage);
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchToday = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/anime/airing-today?page=${page}&perPage=12&releasedOnly=true&audio=${filter}`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok) {
            const list = Array.isArray(data.results) ? data.results : (data.results?.items || []);
            const tPages = data.pageInfo?.totalPages || 1;
            const hasNext = !!data.pageInfo?.hasNextPage;
            setItems(list);
            setTotalPages(tPages);
            setHasNextPage(hasNext);
            pageCache.current[cacheKey] = { items: list, totalPages: tPages, hasNextPage: hasNext };
          }
        }
      } catch (err) {
        console.error("Failed to load episodes streaming today:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchToday();
    return () => { isSubscribed = false; };
  }, [page, filter]);

  // Strictly filter to only anime that has aired / been released today (allow items without airingAt or already aired)
  const rawSafeItems = (Array.isArray(items) ? items : []).filter(anime => !anime.airingAt || anime.airingAt <= nowSec);
  const seenKeys = new Set<string>();
  const safeItems = rawSafeItems.filter(anime => {
    const k = `${anime.id}-${anime.episode}-${anime.isHindi ? 'hi' : (anime.isDub ? 'dub' : 'sub')}`;
    if (seenKeys.has(k)) return false;
    seenKeys.add(k);
    return true;
  });
  if (!loading && safeItems.length === 0 && filter === 'all') return null;

  const currentOption = STREAMING_FILTER_OPTIONS.find(f => f.id === filter) || STREAMING_FILTER_OPTIONS[0];

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile Schedule / Explore Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <MonetLineIcon icon={Radio} variant="emerald" />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate whitespace-nowrap">
              STREAMING TODAY
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Schedule Button */}
          <Link
            href="/schedule"
            onClick={() => playGummyTap()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>Schedule</span>
            <ChevronRight size={11} className="text-emerald-400" />
          </Link>
        </div>

        {/* Row 2 on Mobile (Filter on Left + Page Switcher on Right) / Right Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          {/* Containerless Dropdown Filter Button with Jelly Animation (Left on Row 2) */}
          <div ref={filterRef} className="relative shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                playGummyTap();
                setIsFilterOpen(!isFilterOpen);
              }}
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider select-none py-1 group active:scale-95"
              aria-label="Filter Airing Today"
            >
              {React.createElement(currentOption.icon, {
                size: 13,
                className: "text-emerald-400 group-hover:scale-110 transition-transform"
              })}
              <span className="text-zinc-200 group-hover:text-white">
                {currentOption.label}
              </span>
              <ChevronDown 
                size={12} 
                className={cn("text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200", isFilterOpen && "rotate-180")} 
              />
            </motion.button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 min-w-[140px] p-1.5 rounded-2xl bg-[#080d19]/95 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-0.5"
                >
                  {STREAMING_FILTER_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = filter === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleFilterSelect(opt.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                          isSelected
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={13} className={isSelected ? "text-emerald-400" : "text-zinc-500"} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <BadgeCheck size={13} className="text-emerald-400" />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <CutePageSwitcher
            currentPage={page}
            hasNextPage={hasNextPage}
            onPrev={() => handlePageChange(Math.max(1, page - 1))}
            onNext={() => handlePageChange(page + 1)}
            loading={loading}
            variant="emerald"
            className="flex-1 md:flex-initial justify-between md:justify-center"
          />

          {/* Desktop Only: Full Schedule Link */}
          <Link
            href="/schedule"
            onClick={() => playGummyTap()}
            className="hidden md:inline-flex text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <span>Full Schedule</span>
            <ChevronRight size={12} className="text-emerald-400" />
          </Link>
        </div>
      </div>

      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={12}
        withBottomInfo={true}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5"
      >
        {safeItems.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-400 text-xs font-mono">
            No releases recorded today for this category yet. Check back soon!
          </div>
        ) : (
          safeItems.map((anime, idx) => {
            const airTime = anime.airingAt
              ? new Date(anime.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            const titleStr = typeof anime.title === 'string' ? anime.title : (anime.title?.english || anime.title?.romaji || anime.title?.native || 'Unknown Anime');
            const slug = slugifyTitle(titleStr);
            const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;
            const targetHref = anime.watchUrl || `/watch/${routeId}?ep=${anime.episode || 1}&audio=${anime.isHindi ? 'hi' : 'jp'}`;

            return (
              <AnimeHoverCard
                key={`${anime.id}-${anime.episode}-${anime.isHindi ? 'hi' : 'sub'}-${idx}`}
                anime={anime}
                themeVariant="emerald"
                side="right"
                align="start"
              >
                <Link
                  href={targetHref}
                  className="group relative flex flex-col rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 p-2.5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:-translate-y-1"
                >
                  {/* Poster */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/40">
                    <img
                      src={getSafeImageUrl(anime.poster || anime.image)}
                      alt={titleStr}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Top-Left: Anime Media Type */}
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0e1628]/95 border border-white/15 text-white font-mono font-black text-[9px] uppercase shadow-sm backdrop-blur-md">
                        {(anime.type || 'TV').toUpperCase()}
                      </span>
                    </div>

                    {/* Top-Right: Rating (Miruro Clean Realignment) */}
                    {anime.score && (
                      <div className="absolute top-2 right-2 z-10 pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-black/80 border border-[#2e51a2]/40 text-white font-mono shadow-sm select-none backdrop-blur-md">
                          <span className="text-[#4e85ff] font-black text-[11px] tracking-wider">
                            {anime.ratingSource || (anime.source === 'donghua' || anime.type?.toLowerCase() === 'donghua' ? 'DONGHUA' : (anime.source === 'universal' || anime.media_type === 'movie' || anime.type?.toLowerCase() === 'movie' ? 'IMDb' : 'MAL'))}
                          </span>
                          <span className="font-bold text-zinc-100 text-[11px]">{anime.score}</span>
                        </span>
                      </div>
                    )}

                    {/* Bottom Badges: Episode and Hindi Dub Indicator (Miruro Sleek Pills) */}
                    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 pointer-events-none">
                      {anime.isHindi && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[8.5px] uppercase shadow-sm">
                          {anime.dubType === 'FanDub' || anime.dubType === 'Hindi Fan Dub' ? 'HINDI (FAN)' : 'HINDI'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#0e1628]/95 border border-white/15 text-white font-bold text-[9.5px] uppercase backdrop-blur-md shadow-sm">
                        EP {anime.episode || '?'}
                      </span>
                    </div>

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transform group-hover:scale-110 transition-transform">
                        <Play size={18} className="fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-2.5 flex flex-col flex-1 justify-between gap-1">
                    <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                      {titleStr}
                    </h3>

                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-zinc-500 font-mono">Today</span>
                      {airTime && (
                        <span className="text-zinc-400 font-mono text-[9px] flex items-center gap-1">
                          <Clock size={9} className="text-emerald-400" />
                          {airTime}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </AnimeHoverCard>
            );
          })
        )}
      </CylinderPageSlider>

      {/* Bottom Center-Aligned Cute Page Switcher */}
      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
        <CutePageSwitcher
          currentPage={page}
          hasNextPage={hasNextPage}
          onPrev={() => handlePageChange(Math.max(1, page - 1))}
          onNext={() => handlePageChange(page + 1)}
          loading={loading}
          variant="emerald"
        />
      </div>
    </section>
  );
}

