"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Play, Captions, Mic, X } from "lucide-react";
import { cn, formatAnimeTitle } from "@/lib/utils";

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
  onClick: (id: string, episodeId: string, type?: string) => void;
  onRemove?: (id: string) => void;
  variants?: any;
  className?: string;
}

export default memo(function ContinueAnimeCard({ anime, onClick, onRemove, variants, className }: ContinueAnimeCardProps) {
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = useRef<boolean | null>(null);

  useEffect(() => {
    isTouchRef.current = window.matchMedia('(hover: none)').matches;
  }, []);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onRemove) onRemove(anime.id);
  };

  const handleSmartClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    clickTimeoutRef.current = setTimeout(() => {
      onClick(anime.id, anime.episodeId, anime.type);
    }, DOUBLE_TAP_DELAY);

    lastTapRef.current = now;
  };

  const ageTag = (() => {
    const raw = anime.ageRating || (anime.isAdult ? "18+" : "");
    if (!raw && !anime.isAdult) return null;
    
    const rUpper = raw.toUpperCase().trim();
    const isRed = anime.isAdult || rUpper.includes("18") || rUpper.includes("RX") || rUpper.includes("HENTAI") || rUpper.includes("R+") || rUpper === "R" || rUpper.startsWith("R");
    
    let label = raw;
    if (rUpper.includes("RX") || rUpper.includes("HENTAI")) label = "Rx";
    else if (isRed) label = "18+";
    else if (rUpper.includes("13") || rUpper.includes("PG-13")) label = "PG-13";
    else if (rUpper.includes("PG")) label = "PG";
    else if (rUpper === "G" || rUpper.includes("ALL")) label = "G";

    return (
      <span className={cn(
        "h-5 px-1.5 flex items-center justify-center rounded-[6px] text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border",
        isRed 
          ? "bg-red-600/90 border-red-500/80 text-white" 
          : "bg-black/70 border-white/10 text-white"
      )}>
        {label}
      </span>
    );
  })();

  return (
    <motion.div
      variants={variants}
      whileHover={isTouchRef.current ? undefined : { scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleSmartClick}
      style={{ willChange: 'transform' }}
      className={cn(
        "group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-xl shadow-black/60 ring-1 ring-white/10 hover:ring-primary-500/30 bg-[#090d16] transform-gpu z-0 hover:z-10 select-none touch-manipulation transition-all duration-300",
        className || "flex-shrink-0 w-[42%] sm:w-[28%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] snap-start"
      )}
    >
      {/* 1. Background Poster Image */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <img
          src={anime.poster && anime.poster.trim() !== '' ? anime.poster : "/images/no-poster.png"}
          alt={anime.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/no-poster.png";
          }}
          className="w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Sleek multi-stop gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
      </div>

      {/* 2. Top-Left Labels: Type Badge & Age Rating */}
      <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 z-30 flex items-center gap-1.5 pointer-events-none">
        <span className="h-5 px-1.5 sm:px-2 flex items-center justify-center rounded-[6px] bg-black/70 border border-white/10 text-white text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
          {anime.type}
        </span>
        {ageTag}
      </div>

      {/* 3. Top-Right: Sleek Repositioned X (Remove) Button */}
      {onRemove && (
        <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 z-40">
          <button
            onClick={handleRemove}
            className="w-6 h-6 rounded-full bg-black/75 hover:bg-red-600/90 border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-md active:scale-90 group/btn"
            title="Remove from history"
            aria-label="Remove"
          >
            <X size={11} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* 4. Center Play Button (Sleek Glassmorphic Floating Orb) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-75 group-hover:scale-100 hidden md:flex pointer-events-none">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary-600/95 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_24px_rgba(139,92,246,0.6)] transition-transform duration-200 group-hover:scale-105">
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* 5. Bottom Metadata (Anti-Container Minimal Layout) */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 z-20 flex flex-col gap-1 sm:gap-1.5 justify-end pointer-events-none">
        {/* Title */}
        <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate drop-shadow-md group-hover:text-primary-300 transition-colors">
          {formatAnimeTitle(anime.title, anime.id)}
        </h3>

        {/* Episode & Audio Meta Row */}
        <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-zinc-300">
          <span className="flex items-center gap-1.5 text-zinc-100">
            <Play size={8} className="fill-primary-400 text-primary-400 shrink-0" />
            <span>Ep {anime.episode}</span>
          </span>

          {(anime.sub || anime.dub) && (
            <div className="flex items-center gap-1 text-[9.5px] text-zinc-400 font-mono">
              {anime.sub && <span>SUB {anime.sub}</span>}
              {anime.sub && anime.dub && <span className="text-zinc-600">•</span>}
              {anime.dub && <span>DUB {anime.dub}</span>}
            </div>
          )}
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full flex items-center gap-2 pt-0.5">
          <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(0, anime.progress))}%` }}
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-zinc-400 shrink-0">
            {anime.progress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
});