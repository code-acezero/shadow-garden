"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, Zap, Layers, Crown, Film,
  Radio, Tv, BadgeCheck
} from 'lucide-react';
import { omni, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import DCard from '@/components/Drama/DCard';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import { playGummyTap } from '@/lib/audioManager';

interface CacheData {
  [key: string]: {
    data: DramaCard[];
    timestamp: number;
  };
}

const CACHE_DURATION = 60000; // 1 minute

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'dramas', label: 'Dramas', icon: Crown },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'hindi', label: 'Hindi Dub', icon: Radio },
  { id: 'series', label: 'Series', icon: Tv },
] as const;

type FilterType = typeof FILTER_OPTIONS[number]['id'];

interface FlixverseRecentUpdatesSectionProps {
  initialData?: DramaCard[];
}

export default function FlixverseRecentUpdatesSection({ initialData = [] }: FlixverseRecentUpdatesSectionProps) {
  const [data, setData] = useState<DramaCard[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const cache = useRef<CacheData>({});

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page || newPage < 1) return;
    const cacheKey = `${filter}_${newPage}`;
    const cached = cache.current[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      setData(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setPage(newPage);
  }, [page, filter]);

  const handleFilterSelect = useCallback((newFilter: FilterType) => {
    if (newFilter === filter) {
      setIsFilterOpen(false);
      return;
    }
    playGummyTap();
    setFilter(newFilter);
    setPage(1);
    setIsFilterOpen(false);
  }, [filter]);

  useEffect(() => {
    if (!isMounted) return;

    const fetchTacticalData = async () => {
      const cacheKey = `${filter}_${page}`;
      const cached = cache.current[cacheKey];
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        if (filter === 'all') {
          if (page === 1 && initialData && initialData.length >= 18) {
            setData(initialData);
            cache.current[cacheKey] = { data: initialData, timestamp: Date.now() };
          } else {
            // Parallel sync across all 4 realms: Asian Dramas, Movies, Hindi Dub, and Web Series
            const [dramaRes, movieRes, hindiRes, seriesRes] = await Promise.allSettled([
              omni.drama.getDramas('all', page),
              omni.drama.getMovies('all', page),
              omni.drama.getHindi('all', page),
              omni.drama.getSeries('all', page),
            ]);

            const dItems = dramaRes.status === 'fulfilled' ? dramaRes.value.items : [];
            const mItems = movieRes.status === 'fulfilled' ? movieRes.value.items : [];
            const hItems = hindiRes.status === 'fulfilled' ? hindiRes.value.items : [];
            const sItems = seriesRes.status === 'fulfilled' ? seriesRes.value.items : [];

            const blended: DramaCard[] = [];
            const seen = new Set<string>();
            const pushU = (it: DramaCard) => {
              if (!it || !it.id) return;
              if (!seen.has(it.id)) {
                seen.add(it.id);
                blended.push(it);
              }
            };

            const maxLen = Math.max(dItems.length, mItems.length, hItems.length, sItems.length);
            for (let i = 0; i < maxLen; i++) {
              if (dItems[i]) pushU(dItems[i]);
              if (mItems[i]) pushU(mItems[i]);
              if (hItems[i]) pushU(hItems[i]);
              if (sItems[i]) pushU(sItems[i]);
              if (blended.length >= 24) break;
            }

            const finalData = blended.length > 0 ? blended : (initialData || []);
            setData(finalData);
            cache.current[cacheKey] = { data: finalData, timestamp: Date.now() };
          }
        } else if (filter === 'dramas') {
          const res = await omni.drama.getDramas('all', page);
          setData(res.items);
          cache.current[cacheKey] = { data: res.items, timestamp: Date.now() };
        } else if (filter === 'movies') {
          const res = await omni.drama.getMovies('all', page);
          setData(res.items);
          cache.current[cacheKey] = { data: res.items, timestamp: Date.now() };
        } else if (filter === 'hindi') {
          const res = await omni.drama.getHindi('all', page);
          setData(res.items);
          cache.current[cacheKey] = { data: res.items, timestamp: Date.now() };
        } else if (filter === 'series') {
          const res = await omni.drama.getSeries('all', page);
          setData(res.items);
          cache.current[cacheKey] = { data: res.items, timestamp: Date.now() };
        }
      } catch (error) {
        console.error("[Flixverse Recent Updates] Error fetching data:", error);
        setData(page === 1 ? (initialData || []) : []);
      } finally {
        setLoading(false);
      }
    };

    fetchTacticalData();
  }, [page, filter, isMounted, initialData]);

  const activeOption = FILTER_OPTIONS.find(f => f.id === filter) || FILTER_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <section className="w-full relative z-10 animate-in fade-in duration-700 mt-2 md:mt-4 mb-4 md:mb-8">

      {/* --- HEADER (Clean, Professional Responsive Two-Row on Mobile, One-Row on Desktop) --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile View All Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-2xl bg-[#0e1629]/90 border border-white/[0.08] shadow-sm shrink-0 text-amber-300 border-amber-400/40">
              <Zap size={18} />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-black text-white uppercase tracking-wider font-lemon drop-shadow-sm truncate whitespace-nowrap">
              LATEST
            </h2>
          </div>

          {/* Mobile Only: Symmetrical View All Button */}
          <Link
            href="/explore?library=drama&keyword=recent"
            onClick={() => playGummyTap()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>View All</span>
            <ChevronRight size={11} className="text-cyan-400" />
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
              aria-label="Filter Releases"
            >
              <ActiveIcon
                size={13}
                className="text-cyan-400 group-hover:scale-110 transition-transform"
              />
              <span className="text-zinc-200 group-hover:text-white">
                {activeOption.label}
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
                  className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 min-w-[145px] p-1.5 rounded-2xl bg-[#090e1a]/95 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-0.5"
                >
                  {FILTER_OPTIONS.map(opt => {
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
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black"
                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={13} className={isSelected ? "text-cyan-400" : "text-zinc-500"} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <BadgeCheck size={13} className="text-cyan-400" />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cute < page number > Switcher in Header */}
          <CutePageSwitcher
            page={page}
            loading={loading}
            canPrev={page > 1}
            canNext={data.length >= 12}
            onPageChange={handlePageChange}
            variant="primary"
            className="w-full flex-1 md:flex-initial justify-between md:justify-center"
          />

          {/* Desktop Only: View All Link */}
          <Link
            href="/explore?library=drama&keyword=recent"
            onClick={() => playGummyTap()}
            className="group flex-shrink-0 hidden md:inline-flex items-center gap-1 text-[11px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-wider whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-cyan-500/30 active:scale-95"
          >
            <span>View All</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform text-cyan-400" />
          </Link>
        </div>
      </div>

      {/* --- GRID CONTENT WITH CONTINUOUS CARD SCROLL (CylinderPageSlider) --- */}
      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={24}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-6 relative perf-contain"
      >
        {data.length > 0 ? (
          data.slice(0, 24).map((drama, idx) => (
            <div
              key={`${drama.id}-${filter}-${idx}`}
              className="group relative z-10 transform-gpu will-change-transform transition-transform duration-300 hover:scale-[1.03] hover:z-50"
            >
              <DCard item={drama} />
            </div>
          ))
        ) : (
          <div className="col-span-full h-48 md:h-64 flex flex-col items-center justify-center rounded-[24px] md:rounded-[32px] border border-white/5 bg-white/5 backdrop-blur-md">
            <Zap className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mb-4 opacity-50" />
            <p className="text-zinc-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">No active releases found</p>
          </div>
        )}
      </CylinderPageSlider>

      {/* --- BOTTOM CENTERED PAGE SWITCHER --- */}
      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
        <CutePageSwitcher
          page={page}
          loading={loading}
          canPrev={page > 1}
          canNext={data.length >= 12}
          onPageChange={handlePageChange}
          variant="primary"
          className="w-full sm:w-auto justify-between sm:justify-center"
        />
      </div>

    </section>
  );
}
