"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { Flame, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import AnimeCard from '@/components/Anime/AnimeCard';

interface TrendingCarouselProps {
  items: any[];
}

export default function TrendingCarousel({ items }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full px-4 md:px-0">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-600/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/30">
            <Flame size={18} className="fill-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 font-lemon">
                Hall of Eminence
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white font-gradvis tracking-tight">
              TRENDING <span className="text-primary-600">APEX</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/view/trending"
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-white/10 transition-colors hidden sm:inline-flex items-center gap-1.5"
          >
            <span>View All</span>
            <ChevronRight size={12} />
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-transform active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-transform active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3"
      >
        {items.map((anime, index) => (
          <div
            key={anime.id || index}
            className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0 relative group"
          >
            {/* Prominent Ranking Number */}
            <div className="absolute -top-2 -left-2 z-30 pointer-events-none select-none">
              <span
                className={`text-2xl md:text-4xl font-black font-lemon italic tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                  index === 0
                    ? 'text-amber-400'
                    : index === 1
                    ? 'text-zinc-200'
                    : index === 2
                    ? 'text-amber-600'
                    : 'text-zinc-500'
                }`}
              >
                #{index + 1}
              </span>
            </div>

            <AnimeCard anime={anime} />
          </div>
        ))}
      </div>
    </section>
  );
}
