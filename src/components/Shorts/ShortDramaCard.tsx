"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Sparkles, Film, Eye, Star, LockOpen } from 'lucide-react';
import { ShortDramaItem } from '@/lib/shorts/types';
import { ATRAX_GENTLE_SPRING, atraxSquishTapVariants } from '@/lib/atraxMotion';
import { cn } from '@/lib/utils';

interface ShortDramaCardProps {
  drama: ShortDramaItem;
  priority?: boolean;
}

export default function ShortDramaCard({ drama, priority = false }: ShortDramaCardProps) {
  // Determine badge styling based on language
  const isHindi = drama.language === 'Hindi Dub';
  const isEnglish = drama.language === 'English Dub';

  return (
    <motion.div
      variants={atraxSquishTapVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className="group relative flex flex-col cursor-pointer select-none"
    >
      <Link href={`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=1`} className="block w-full">
        {/* 9:16 Portrait Poster Frame */}
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-slate-900 border border-white/10 shadow-lg shadow-black/40 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/20">
          {/* Cover Image */}
          <img
            src={drama.cover}
            alt={drama.title}
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40" />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            {/* Language Pill */}
            <span
              className={cn(
                "px-2.5 py-1 text-[11px] font-bold rounded-full backdrop-blur-md shadow-sm border",
                isHindi && "bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-amber-500/20",
                isEnglish && "bg-cyan-500/25 text-cyan-300 border-cyan-500/40 shadow-cyan-500/20",
                !isHindi && !isEnglish && "bg-slate-900/80 text-slate-200 border-white/15"
              )}
            >
              {isHindi ? '🇮🇳 Hindi Dub' : isEnglish ? '🇺🇸 Eng Dub' : '🇨🇳 ' + (drama.language || 'Shorts')}
            </span>

            {/* Unlocked / Free Pill */}
            {drama.isUnlocked && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-md">
                <LockOpen className="w-2.5 h-2.5" />
                Free
              </span>
            )}
          </div>

          {/* Center Play Button Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <motion.div
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-xl shadow-primary/40 backdrop-blur-md border border-white/30"
            >
              <Play className="w-6 h-6 ml-0.5 fill-white" />
            </motion.div>
          </div>

          {/* Bottom Card Info Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 flex flex-col gap-1.5">
            {/* Episode Count & Views Pill */}
            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 font-mono text-white">
                {drama.totalEpisodes} Eps
              </span>
              {drama.views && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {drama.views}
                </span>
              )}
              {drama.rating && (
                <span className="flex items-center gap-0.5 text-amber-400 font-semibold ml-auto">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {drama.rating}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {drama.title}
            </h3>

            {/* Tags preview */}
            {drama.tags && drama.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                {drama.tags.slice(0, 2).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
