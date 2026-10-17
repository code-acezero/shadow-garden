"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Play, Plus, Star } from 'lucide-react';
import { DramaCard } from '@/lib/omni';
import { getStreamUrl } from '@/lib/utils';
import CountryBadge from './CountryBadge';

function formatEpisode(ep?: string): string | null {
  if (!ep) return null;
  const clean = ep.trim();
  const lower = clean.toLowerCase();
  if (lower.includes('movie')) return 'MOVIE';
  if (lower.includes('dub')) return 'DUBBED';
  if (lower.startsWith('new') || lower.includes('new ep')) return 'NEW EP';
  if (lower.startsWith('ep')) return clean.toUpperCase();
  if (/^\d+$/.test(clean)) return `EP ${clean}`;
  return clean.toUpperCase();
}

const DCard = memo(({ item }: { item: DramaCard }) => {
  const isHindi = Boolean(item.isHindi || item.audio?.includes('Hindi') || item.country?.includes('Hindi') || /hindi/i.test(item.title));
  const isMovie = Boolean(item.isMovie || item.category === 'movie' || item.type === 'Movie' || item.episode?.toLowerCase().includes('movie'));
  const epValue = item.episode && !item.episode.toLowerCase().includes('movie') ? item.episode : undefined;
  const watchHref = getStreamUrl(item.id, item.title, isMovie ? 'movie' : (item.type || 'drama'), epValue);

  const isCountryHindi = Boolean(item.country && /hindi|india/i.test(item.country));
  const epTag = formatEpisode(item.episode);

  return (
    <div className="group relative flex flex-col shrink-0 w-full transition-all duration-300 hover:z-50 hover:scale-[1.03] origin-center touch-manipulation select-none">
      <Link 
        href={watchHref}
        className="aspect-[2/3] w-full overflow-hidden rounded-[22px] sm:rounded-[24px] bg-[#0c1322] border border-white/[0.08] relative shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.08)] group-hover:shadow-[0_18px_45px_rgba(0,0,0,0.95)] group-hover:border-white/20 transition-all duration-300 cursor-pointer block will-change-transform active:scale-[0.98]"
      >
        {/* Cover Poster Image with smooth zoom */}
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
            loading="lazy" 
            decoding="async" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-[#0e1628]">
            <Play size={24} />
          </div>
        )}
        
        {/* Top-Left: Media Type & Country Badge (One UI 8 Frosted Glass Pill) */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <CountryBadge country={item.country} type={item.type} />
        </div>

        {/* Top-Right: Unified One UI 8 Pill (No redundant tags) */}
        {isHindi && !isCountryHindi ? (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 px-2 py-0.5 rounded-full font-bold text-[9px] z-20 shadow-sm flex items-center gap-1 uppercase tracking-wider">
            <span>🇮🇳</span> HINDI
          </div>
        ) : epTag ? (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10 px-2 py-0.5 rounded-full font-bold text-[9px] z-20 shadow-sm uppercase tracking-wider">
            {epTag}
          </div>
        ) : isMovie ? (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10 px-2 py-0.5 rounded-full font-bold text-[9px] z-20 shadow-sm uppercase tracking-wider">
            MOVIE
          </div>
        ) : null}

        {/* Gradient Scrim: Subtle at rest for text legibility, smooth deepen on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/45 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none z-10" />

        {/* Bottom Content Area: Title ALWAYS visible, smoothly moves up on hover to reveal options */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 z-20 flex flex-col justify-end pointer-events-none">
          {/* Always Visible Title */}
          <div className="transform transition-transform duration-300 ease-out group-hover:-translate-y-1">
            <h3 className="text-xs sm:text-[13px] font-black text-white line-clamp-2 leading-snug drop-shadow-md">
              {item.title}
            </h3>
          </div>

          {/* Smoothly Revealed Secondary Info & Action Buttons on Hover */}
          <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-300 ease-out flex flex-col gap-2 pt-1.5 pointer-events-auto">
            {/* One UI 8 Clean Cohesive Meta Row */}
            <div className="flex flex-wrap items-center gap-1 text-[8.5px] font-bold text-zinc-300 uppercase tracking-wider">
              {item.year && (
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  {item.year}
                </span>
              )}
              <span className="bg-white/10 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-0.5">
                <Star size={8.5} className="fill-amber-400 text-amber-400" />
                {item.score || '8.2'}
              </span>
              {item.type && (
                <span className="bg-white/10 backdrop-blur-md text-zinc-300 px-2 py-0.5 rounded-full border border-white/10">
                  {item.type}
                </span>
              )}
            </div>

            {/* Quick Action Buttons (One UI 8 Pill Action) */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-black text-[11px] uppercase tracking-wider shadow-[0_2px_12px_rgba(220,38,38,0.45)] transition-all active:scale-95">
                <Play size={11} className="fill-current" />
                <span>Play</span>
              </div>
              <button 
                type="button"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all active:scale-90 shrink-0" 
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                title="Add to Watchlist"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});

DCard.displayName = "DCard";
export default DCard;
