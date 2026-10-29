"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn, getSafeImageUrl } from '@/lib/utils';
import { playGummyTap } from '@/lib/audioManager';
import { ContinueReadingItem } from '@/context/UserDataContext';
import { PuffedBook, PuffedTrash, PuffedPlay, PuffedExternal } from './PuffedIcons';
import { X } from 'lucide-react';

export interface ContinueReadingCardProps {
  item: ContinueReadingItem | any;
  viewMode?: 'grid' | 'list' | 'compact';
  onRemove?: (mangaId: string) => void;
  className?: string;
  variants?: any;
}

export default memo(function ContinueReadingCard({
  item,
  viewMode = 'grid',
  onRemove,
  className,
  variants,
}: ContinueReadingCardProps) {
  const router = useRouter();
  const [showRemove, setShowRemove] = useState(false);
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = useRef<boolean | null>(null);

  useEffect(() => {
    isTouchRef.current = window.matchMedia('(hover: none)').matches;
  }, []);

  const mangaId = item.manga_id || item.id;
  const chapterId = item.chapter_id;
  const rawMediaType = (item.media_type || 'MANGA').toLowerCase();
  const isNovel = rawMediaType === 'light_novel' || rawMediaType === 'web_novel' || rawMediaType === 'novel';
  
  const readUrl = chapterId
    ? (isNovel ? `/novel/read/${mangaId}/${chapterId}` : `/manga/read/${mangaId}/${chapterId}`)
    : (isNovel ? `/novel/${mangaId}` : `/manga/${mangaId}`);

  const coverUrl = item.cover_image || item.poster || '/images/placeholder.jpg';
  
  const progressPercent = typeof item.page_progress === 'number' && item.page_progress > 0
    ? Math.min(Math.max(item.page_progress, 5), 100)
    : (item.chapter_number > 0 ? 50 : 0);

  const displayType = rawMediaType === 'light_novel' ? 'NOVEL'
    : rawMediaType === 'web_novel' ? 'WEB NOVEL'
    : rawMediaType.toUpperCase();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    playGummyTap();
    if (onRemove) onRemove(mangaId);
  };

  const handleCardClick = () => {
    playGummyTap();
    router.push(readUrl);
  };

  const handleSmartClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      setShowRemove((prev) => !prev);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        handleCardClick();
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  // ─── COMPACT VIEW ──────────────────────────────────────────────────────────
  if (viewMode === 'compact') {
    return (
      <div 
        onClick={handleCardClick}
        className="group flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all select-none cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
            <img 
              src={getSafeImageUrl(coverUrl)} 
              alt={item.title} 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-zinc-200">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono">
              <span>Ch {item.chapter_number}</span>
              <span className="uppercase text-[9px] text-zinc-400">· {displayType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Link
            href={readUrl}
            onClick={() => playGummyTap()}
            className="h-7 px-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
          >
            <PuffedPlay size={10} />
            <span>Resume</span>
          </Link>

          {onRemove && (
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Remove from history"
            >
              <PuffedTrash size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        variants={variants}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        onClick={handleCardClick}
        className={cn(
          "group relative flex items-center gap-3.5 sm:gap-4 p-3 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/10 transition-all select-none cursor-pointer",
          className
        )}
      >
        <div className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
          <img
            src={getSafeImageUrl(coverUrl)}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/placeholder.jpg';
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              {displayType}
            </span>
            {item.last_read && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {new Date(item.last_read).toLocaleDateString()}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
            {item.title}
          </h3>

          <p className="text-xs text-zinc-400 font-mono mt-1">
            Chapter {item.chapter_number} {item.chapter_title ? `· ${item.chapter_title}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Link
            href={readUrl}
            onClick={() => playGummyTap()}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <PuffedPlay size={11} />
            <span className="hidden sm:inline">Resume</span>
          </Link>

          {onRemove && (
            <button
              onClick={handleRemove}
              className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Remove from history"
            >
              <PuffedTrash size={14} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── GRID VIEW ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={variants}
      whileHover={isTouchRef.current ? undefined : { scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleSmartClick}
      className={cn(
        "group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/25 select-none touch-manipulation transition-all duration-200",
        className || "w-full"
      )}
    >
      <div className="absolute inset-0 overflow-hidden bg-zinc-900">
        <img
          src={getSafeImageUrl(coverUrl)}
          alt={item.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      <div className="absolute top-2.5 left-2.5 z-20">
        <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/15 rounded-full text-[8px] font-bold text-zinc-300 uppercase tracking-wider">
          {displayType}
        </div>
      </div>

      {onRemove && (
        <div
          className={cn(
            "absolute top-2.5 right-2.5 z-30 transition-opacity duration-200",
            showRemove ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            onClick={handleRemove}
            className="p-1.5 bg-black/70 hover:bg-white text-zinc-300 hover:text-black border border-white/20 rounded-full transition-all active:scale-95"
            title="Remove from Continue Reading"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col gap-1">
        <h3 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-sm group-hover:text-zinc-200">
          {item.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Chapter <b>{item.chapter_number}</b></span>
          <span className="text-[10px] text-zinc-300">{progressPercent}%</span>
        </div>

        <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
});
