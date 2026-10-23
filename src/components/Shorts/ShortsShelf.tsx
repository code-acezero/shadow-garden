"use client";

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Film } from 'lucide-react';
import { ShortDramaItem } from '@/lib/shorts/types';
import ShortDramaCard from './ShortDramaCard';
import { cn } from '@/lib/utils';

interface ShortsShelfProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  items: ShortDramaItem[];
  isLeaderboard?: boolean;
  savedIds: Set<string>;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onSeeAll?: () => void;
  className?: string;
}

export default function ShortsShelf({
  title,
  subtitle,
  icon,
  badge,
  items,
  isLeaderboard = false,
  savedIds,
  onToggleSave,
  onSeeAll,
  className
}: ShortsShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -460, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 460, behavior: 'smooth' });
    }
  };

  return (
    <section className={cn("relative mb-6 sm:mb-8 group/shelf", className)}>
      {/* Clean Modern Shelf Header */}
      <div className="flex items-center justify-between mb-3.5 px-0.5">
        <div className="flex items-center gap-3">
          {/* Subtle Icon Container */}
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
            {icon || <Film className="w-4 h-4 text-zinc-300" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{title}</span>
                {badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                    {badge}
                  </span>
                )}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Controls: Arrow Buttons & See All */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded-full hover:bg-white/5"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}

          {/* Desktop Scroll Chevron Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={scrollLeft}
              title="Previous"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              title="Next"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((drama, idx) => {
          const rank = idx + 1;
          const isSaved = savedIds.has(drama.id);

          return (
            <div
              key={`${drama.id}_${idx}`}
              className={cn(
                "shrink-0 snap-start transition-all",
                isLeaderboard
                  ? "w-[180px] sm:w-[220px] md:w-[250px]"
                  : "w-[145px] sm:w-[175px] md:w-[195px] lg:w-[210px]"
              )}
            >
              <ShortDramaCard
                drama={drama}
                priority={idx < 4}
                rank={isLeaderboard ? rank : undefined}
                showRankNumber={isLeaderboard}
                isSaved={isSaved}
                onToggleSave={onToggleSave}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
