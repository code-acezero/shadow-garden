"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Bookmark, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { ShortDramaItem } from '@/lib/shorts/types';
import { cn } from '@/lib/utils';

interface ShortsHeroCarouselProps {
  items: ShortDramaItem[];
  savedIds: Set<string>;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export default function ShortsHeroCarousel({
  items,
  savedIds,
  onToggleSave
}: ShortsHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = items.length;
  const current = items[currentIndex];

  // Auto rotation
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % total);
    }, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, currentIndex]);

  if (!current) return null;

  const isSaved = savedIds.has(current.id);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % total);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0c0c0c] border border-white/10 shadow-2xl mb-6 group select-none"
    >
      {/* Background Banner Image with Smooth Crossfade */}
      <div className="relative h-[270px] sm:h-[290px] md:h-[310px] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img
              src={current.banner || current.cover}
              alt={current.title}
              className="w-full h-full object-cover object-center filter brightness-[0.45]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Soft Cinematic Vignettes and Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/75 via-40% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 via-50% to-transparent md:w-4/5" />

        {/* Content Container */}
        <div className="relative z-10 p-4 sm:p-5 md:p-6 flex flex-col justify-between h-full">
          {/* Top Row: Clean Single Badge & Navigation Chevrons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-zinc-200 border border-white/15 backdrop-blur-md">
                Featured Premiere
              </span>

              {current.language && (
                <span className="text-[11px] text-zinc-400 font-medium px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {current.language}
                </span>
              )}
            </div>

            {/* Prev/Next Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                title="Previous"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                title="Next"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Info Area: Title, Metadata, Synopsis, Buttons */}
          <div className="flex items-end justify-between gap-6 my-auto">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {/* Clean Headline */}
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight line-clamp-1 sm:line-clamp-2 leading-snug">
                    {current.title}
                  </h2>

                  {/* Clean Metadata Line */}
                  <div className="flex items-center gap-2 flex-wrap my-1.5 text-xs text-zinc-400">
                    {current.totalEpisodes && (
                      <span>{current.totalEpisodes} Episodes</span>
                    )}
                    {current.tags && current.tags[0] && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>{current.tags.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                    {current.rating && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1 text-zinc-300">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{current.rating}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-zinc-300/90 line-clamp-1 sm:line-clamp-2 max-w-xl leading-relaxed mb-3.5">
                    {current.description}
                  </p>

                  {/* Clean Action Buttons */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Primary Watch Action */}
                    <Link href={`/shorts/watch?id=${encodeURIComponent(current.id)}&ep=1`}>
                      <button className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-95">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Episode 1</span>
                      </button>
                    </Link>

                    {/* Secondary Swipe Feed */}
                    <Link href={`/shorts/watch?id=${encodeURIComponent(current.id)}&ep=1`}>
                      <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs sm:text-sm font-medium flex items-center gap-2 backdrop-blur-sm transition-all active:scale-95">
                        <Film className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Swipe Feed</span>
                      </button>
                    </Link>

                    {/* Save to Watchlist */}
                    <button
                      onClick={(e) => onToggleSave(current.id, e)}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border transition-all active:scale-95",
                        isSaved
                          ? "bg-white/15 text-white border-white/25"
                          : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10"
                      )}
                      title={isSaved ? "Saved to Watchlist" : "Save to Watchlist"}
                    >
                      <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current text-white")} />
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Side: Clean 9:16 Portrait Card Preview (md+ screens) */}
            <div className="hidden md:flex shrink-0 justify-end">
              <Link
                href={`/shorts/watch?id=${encodeURIComponent(current.id)}&ep=1`}
                className="block group/poster"
              >
                <div className="relative w-24 sm:w-28 md:w-32 aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 shadow-2xl transition-all duration-300 group-hover/poster:scale-105 group-hover/poster:border-white/30">
                  <img
                    src={current.cover}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                    <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 inset-x-2 text-center">
                    <span className="text-[10px] font-medium text-zinc-300 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                      Preview
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Bottom Pagination Dots & Slide Counter */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    idx === currentIndex
                      ? "w-6 bg-white"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  )}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="text-[11px] font-mono text-zinc-500">
              <span className="text-white font-medium">{currentIndex + 1}</span> / {total}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
