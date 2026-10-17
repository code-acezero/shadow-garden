"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Tv, Sparkles, ChevronRight, Radio } from 'lucide-react';
import AnimeCard from '@/components/Anime/AnimeCard';
import { cn } from '@/lib/utils';

interface HomeCategoryShowcaseProps {
  topAiring: any[];
  upcoming: any[];
}

export default function HomeCategoryShowcase({ topAiring, upcoming }: HomeCategoryShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'airing' | 'upcoming'>('airing');

  const currentItems = activeTab === 'airing' ? (topAiring || []) : (upcoming || []);
  const viewAllRoute = activeTab === 'airing' ? '/view/ongoing' : '/view/upcoming';

  if ((!topAiring || topAiring.length === 0) && (!upcoming || upcoming.length === 0)) {
    return null;
  }

  return (
    <section className="w-full px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-600/30 to-purple-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 shadow-lg shadow-primary-950/30">
            {activeTab === 'airing' ? (
              <Radio size={18} className="text-primary-400 animate-pulse" />
            ) : (
              <Sparkles size={18} className="text-purple-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500 font-lemon">
                Seasonal Directives
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white font-gradvis tracking-tight">
              {activeTab === 'airing' ? (
                <>TOP AIRING <span className="text-primary-600">TRANSMISSIONS</span></>
              ) : (
                <>ANTICIPATED <span className="text-purple-400">RADAR</span></>
              )}
            </h2>
          </div>
        </div>

        {/* Tab Switcher & View All */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center bg-[#0c1322] border border-white/[0.12] rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('airing')}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 atrax-bubbly-btn atrax-squish-tap",
                activeTab === 'airing'
                  ? "bg-primary-600 text-white shadow-md shadow-primary-900/40"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Airing Now</span>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 atrax-bubbly-btn atrax-squish-tap",
                activeTab === 'upcoming'
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Sparkles size={11} />
              <span>Upcoming Hype</span>
            </button>
          </div>

          <Link
            href={viewAllRoute}
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-[#0c1322] border border-white/[0.12] hover:border-white/20 transition-all atrax-bubbly-btn atrax-squish-tap hidden md:inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>View All</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Grid of anime items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {currentItems.slice(0, 12).map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </section>
  );
}
