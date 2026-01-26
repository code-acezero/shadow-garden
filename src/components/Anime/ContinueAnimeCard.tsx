"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Captions, Mic } from "lucide-react";

// Shared Interface
export interface ContinueWatchingItem {
  id: string;
  title: string;
  poster: string;
  episode: number;
  totalEpisodes: number | string;
  progress: number;
  type: string;
  ageRating: string | null;
  isAdult: boolean;
  episodeId: string;
  sub?: number | string;
  dub?: number | string;
}

interface ContinueAnimeCardProps {
  anime: ContinueWatchingItem;
  onClick: (id: string, episodeId: string) => void;
  variants: any;
}

export default function ContinueAnimeCard({ anime, onClick, variants }: ContinueAnimeCardProps) {
  return (
    <motion.div
      variants={variants}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(anime.id, anime.episodeId)}
      className="flex-shrink-0 w-[42%] sm:w-[30%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] snap-start group relative aspect-[3/4] rounded-[32px] overflow-hidden cursor-pointer shadow-2xl shadow-black/50 ring-1 ring-white/10 bg-[#050505] transform-gpu transition-all duration-300 z-0 hover:z-10"
    >
      {/* 1. Background Image */}
      <div className="absolute inset-0 overflow-hidden rounded-[32px]">
        <motion.img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Enhanced Shadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* 2. Top Labels */}
      <div className="absolute top-3 left-3 z-30">
        <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black text-white uppercase tracking-wider shadow-lg">
          {anime.type}
        </div>
      </div>

      {/* Age Rating Tag */}
      {anime.ageRating && (
        <div className="absolute top-3 right-3 z-30">
          <div
            className={`px-2 py-1 backdrop-blur-md border rounded-lg text-[8px] font-black text-white uppercase tracking-wider shadow-lg ${
              anime.isAdult
                ? "bg-red-600/90 border-red-500/50 shadow-red-900/20"
                : "bg-black/60 border-white/10"
            }`}
          >
            {anime.ageRating}
          </div>
        </div>
      )}

      {/* 3. Center Play Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-50 group-hover:scale-100 -translate-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-600 blur-xl opacity-70 animate-pulse" />
          <div className="relative w-10 h-10 rounded-full bg-red-600 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.6)]">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* 4. Bottom Metadata */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 z-20 flex flex-col gap-1.5">
        {/* Title */}
        <h3 className="text-sm font-black text-white leading-tight truncate drop-shadow-xl filter group-hover:text-red-400 transition-colors">
          {anime.title}
        </h3>

        {/* Adaptive Info Row */}
        <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
          {/* Left: Episode Count (Flexible) */}
          <div className="flex-1 min-w-0 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md flex items-center justify-center">
            <span className="text-[8.5px] font-bold text-white tracking-tight uppercase whitespace-nowrap">
              EP {anime.episode}
              <span className="text-white/50 mx-0.5">/</span>
              {anime.totalEpisodes}
            </span>
          </div>

          {/* Right: Sub/Dub (Compact) */}
          {(anime.sub || anime.dub) && (
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md min-w-0">
              {anime.sub && (
                <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-white tracking-tight whitespace-nowrap">
                  <Captions size={9} className="text-zinc-300 flex-shrink-0" />
                  <span>{anime.sub}</span>
                </div>
              )}
              {anime.sub && anime.dub && (
                <div className="w-px h-2.5 bg-white/20 flex-shrink-0" />
              )}
              {anime.dub && (
                <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-white tracking-tight whitespace-nowrap">
                  <Mic size={9} className="text-zinc-300 flex-shrink-0" />
                  <span>{anime.dub}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar & Percentage */}
        <div className="flex flex-col gap-1 w-full mt-0.5">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${anime.progress}%` }}
              transition={{ duration: 1.2, ease: "circOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            />
          </div>
          <span className="text-[8px] font-black text-zinc-300 tracking-widest uppercase opacity-90 text-center drop-shadow-md">
            {anime.progress}% Complete
          </span>
        </div>
      </div>

      {/* 5. Glass Border Shine */}
      <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/10 pointer-events-none z-30 group-hover:ring-red-500/30 transition-all duration-500" />
    </motion.div>
  );
}