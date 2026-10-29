"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Clapperboard, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeService } from '@/lib/api';
import AnimeCard from '@/components/Anime/AnimeCard';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import { omni, DramaCard } from '@/lib/omni';
import { getStreamUrl } from '@/lib/utils';
import { playGummyTap } from '@/lib/audioManager';

export default function MultiverseShowcase() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);
  const cacheRef = useRef<Record<number, any[]>>({});

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1) return;
    const cached = cacheRef.current[newPage];
    if (cached && cached.length > 0) {
      setMovies(cached);
      setIsPaginating(false);
      setLoading(false);
    } else {
      setIsPaginating(true);
    }
    setPage(newPage);
  };

  // Fetch Asian dramas, cinema movies, global series, and feature films for FlixVerse
  const fetchMovies = useCallback(async (targetPage: number) => {
    try {
      const [dramaSourceRes, movieSourceRes, seriesSourceRes, animeMovieList] = await Promise.all([
        omni.drama.getDramas('all', targetPage).catch(() => ({ items: [] })),
        omni.drama.getMovies('all', targetPage).catch(() => ({ items: [] })),
        omni.drama.getSeries('all', targetPage).catch(() => ({ items: [] })),
        AnimeService.getMovies(targetPage).catch(() => [])
      ]);

      const mappedDramas = (dramaSourceRes.items || []).map((item: DramaCard) => ({
        ...item,
        targetRoute: getStreamUrl(item.id, item.title, 'drama', item.episode),
        type: item.type || 'K-Drama',
        category: 'drama',
        rating: item.score || '8.7',
        score: item.score || '8.7',
        ratingSource: 'IMDb',
        source: 'universal'
      }));

      const mappedMovies = (movieSourceRes.items || []).map((item: DramaCard) => ({
        ...item,
        targetRoute: getStreamUrl(item.id, item.title, 'movie', item.episode),
        type: 'Movie',
        category: 'movie',
        rating: item.score || '8.2',
        score: item.score || '8.2',
        ratingSource: 'IMDb',
        source: 'universal'
      }));

      const mappedSeries = (seriesSourceRes.items || []).map((item: DramaCard) => ({
        ...item,
        targetRoute: getStreamUrl(item.id, item.title, 'series', item.episode),
        type: item.type || 'Series',
        category: 'series',
        rating: item.score || '8.5',
        score: item.score || '8.5',
        ratingSource: 'IMDb',
        source: 'universal'
      }));

      const safeAnimeMovies = (Array.isArray(animeMovieList) ? animeMovieList : []).map((item: any) => ({
        ...item,
        ratingSource: item.ratingSource || 'MAL'
      }));

      // Richly interleave Asian dramas, cinema movies, web series, and anime films
      const combined: any[] = [];
      const dQueue = [...mappedDramas];
      const mQueue = [...mappedMovies];
      const sQueue = [...mappedSeries];
      const aQueue = [...safeAnimeMovies];

      const maxLen = Math.max(dQueue.length, mQueue.length, sQueue.length, aQueue.length);
      for (let i = 0; i < maxLen; i++) {
        if (dQueue.length > 0) combined.push(dQueue.shift());
        if (mQueue.length > 0) combined.push(mQueue.shift());
        if (dQueue.length > 0) combined.push(dQueue.shift());
        if (sQueue.length > 0) combined.push(sQueue.shift());
        if (aQueue.length > 0) combined.push(aQueue.shift());
      }

      return combined.length > 0 ? combined.slice(0, 18) : (mappedDramas.length > 0 ? mappedDramas : mappedMovies);
    } catch (err) {
      console.error('Failed to fetch Flixverse titles:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const cached = cacheRef.current[page];
      if (cached && cached.length > 0) {
        setMovies(cached);
        setLoading(false);
        setIsPaginating(false);
        return;
      }

      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setIsPaginating(true);
        }

        const movieList = await fetchMovies(page);
        if (isMounted) {
          setMovies(movieList);
          cacheRef.current[page] = movieList;
        }
      } catch (err) {
        console.error('Failed to load Flixverse:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsPaginating(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [page, fetchMovies]);

  if (!loading && movies.length === 0) return null;

  return (
    <section className="w-full my-4 md:my-8 relative z-10">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile Explore Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <MonetLineIcon icon={Clapperboard} variant="rose" />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate">
              FLIXVERSE
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Explore Button */}
          <Link
            href="/cinema"
            onClick={() => playGummyTap()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>Explore</span>
            <ChevronRight size={11} className="text-red-400" />
          </Link>
        </div>

        {/* Row 2 on Mobile (Full Width Page Switcher) / Right Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto">
          <CutePageSwitcher
            page={page}
            loading={loading || isPaginating}
            canPrev={page > 1 && !isPaginating}
            canNext={!isPaginating && movies.length >= 12}
            onPageChange={handlePageChange}
            variant="red"
            className="w-full md:w-auto justify-between md:justify-start"
          />

          {/* Desktop Only: Full Button Name */}
          <Link
            href="/cinema"
            onClick={() => playGummyTap()}
            className="hidden md:inline-flex text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-red-500/30 transition-all items-center gap-1.5 whitespace-nowrap shrink-0 group active:scale-95"
          >
            <span>Explore Flixverse</span>
            <ChevronRight size={12} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Content Grid with Continuous Card Scroll */}
      <CylinderPageSlider
        page={page}
        loading={loading || isPaginating}
        skeletonCount={18}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5"
      >
        {movies.map((item, idx) => (
          <div key={`${item.id || item.slug || idx}-${idx}`} className="transform-gpu transition-transform duration-300 hover:scale-[1.03]">
            <AnimeCard anime={item} />
          </div>
        ))}
      </CylinderPageSlider>

      {/* Bottom Center-Aligned Page Switcher */}
      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
        <CutePageSwitcher
          page={page}
          loading={loading || isPaginating}
          canPrev={page > 1 && !isPaginating}
          canNext={!isPaginating && movies.length >= 12}
          onPageChange={handlePageChange}
          variant="red"
        />
      </div>
    </section>
  );
}
