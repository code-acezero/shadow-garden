"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Play, Star, Bookmark, MoreVertical, Share2, Check, Eye } from 'lucide-react';
import { ShortDramaItem } from '@/lib/shorts/types';
import { cn } from '@/lib/utils';

interface ShortDramaCardProps {
  drama: ShortDramaItem;
  priority?: boolean;
  rank?: number;
  showRankNumber?: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
  className?: string;
}

export default function ShortDramaCard({
  drama,
  priority = false,
  rank,
  showRankNumber = false,
  isSaved = false,
  onToggleSave,
  className
}: ShortDramaCardProps) {
  const isHindi = drama.language === 'Hindi Dub';
  const isEnglish = drama.language === 'English Dub';
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deduplicate and filter out language-like tags that already appear in the card
  const cleanTag = useMemo(() => {
    if (!drama.tags || !Array.isArray(drama.tags)) return null;
    const langLower = (drama.language || '').toLowerCase().trim();

    const seen = new Set<string>();
    const uniqueTags: string[] = [];

    for (const rawTag of drama.tags) {
      const tag = String(rawTag).trim();
      const lower = tag.toLowerCase();
      if (!lower || seen.has(lower)) continue;
      seen.add(lower);

      // Skip redundant tags that duplicate language, dub, or sub
      if (lower === langLower) continue;
      if (lower.includes('hindi') && langLower.includes('hindi')) continue;
      if (lower.includes('english') && langLower.includes('english')) continue;
      if (['dub', 'sub', 'hindi dub', 'english dub', 'raw'].includes(lower)) continue;

      uniqueTags.push(tag);
    }

    return uniqueTags[0] || null;
  }, [drama.tags, drama.language]);

  // Fallback cover if image fails
  const coverUrl = imgError || !drama.cover
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'
    : drama.cover;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=1`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1800);
  };

  return (
    <div className={cn("group relative flex flex-col select-none", className)}>
      <Link
        href={`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=1`}
        className="block w-full focus:outline-none"
      >
        {/* Top Section: Optional Side-by-side Rank Number + 9:16 Portrait Thumbnail */}
        <div className="relative flex items-end">
          {/* Top 10 Giant Metallic Outline Rank Number */}
          {showRankNumber && rank !== undefined && (
            <div className="shrink-0 w-8 sm:w-11 md:w-13 -mr-1 sm:-mr-2 z-10 pointer-events-none select-none flex items-end justify-center pb-2">
              <span
                className="text-6xl sm:text-7xl md:text-8xl font-black italic tracking-tighter leading-none"
                style={{
                  WebkitTextStroke: '2px rgba(255, 255, 255, 0.5)',
                  color: 'transparent',
                  textShadow: '0 4px 18px rgba(0, 0, 0, 0.95)'
                }}
              >
                {rank}
              </span>
            </div>
          )}

          {/* 9:16 Portrait Thumbnail with Clean Rounded Styling */}
          <div className="relative aspect-[9/16] flex-1 min-w-0 overflow-hidden rounded-2xl bg-[#141414] border border-white/5 shadow-md shadow-black/50 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-black/80">
            {/* Poster Image with smooth hover scale */}
            <img
              src={coverUrl}
              alt={drama.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04] filter brightness-95 group-hover:brightness-105"
              loading={priority ? 'eager' : 'lazy'}
            />

            {/* Ambient Dark Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 via-45% to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Top Bar: Clean Rounded Badges & Sleek Bookmark */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
              {/* Language Tag */}
              <div className="flex items-center gap-1">
                {isHindi && (
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/25 uppercase tracking-wide">
                    Hindi Dub
                  </span>
                )}
                {isEnglish && (
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-black/60 backdrop-blur-md text-sky-300 border border-sky-500/25 uppercase tracking-wide">
                    English Dub
                  </span>
                )}
                {!isHindi && !isEnglish && (
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-black/60 backdrop-blur-md text-zinc-300 border border-white/15 uppercase tracking-wide">
                    {drama.language?.slice(0, 3) || 'SUB'}
                  </span>
                )}

                {/* Free / Unlocked Chip */}
                {drama.isUnlocked && (
                  <span className="px-2 py-0.5 text-[8px] font-medium rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/25 uppercase">
                    Free
                  </span>
                )}
              </div>

              {/* Bookmark Button */}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSave(drama.id, e);
                  }}
                  title={isSaved ? "Remove from Saved" : "Save to Watchlist"}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md border active:scale-95",
                    isSaved
                      ? "bg-white text-zinc-950 border-white shadow-md shadow-white/10"
                      : "bg-black/50 text-zinc-300 border-white/10 hover:text-white hover:bg-black/80 hover:border-white/20"
                  )}
                >
                  <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-zinc-950 text-zinc-950")} />
                </button>
              )}
            </div>

            {/* Center Play Icon on Hover (Clean White Circle) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white/95 text-zinc-950 flex items-center justify-center shadow-xl shadow-black/80 transform scale-90 group-hover:scale-100 transition-transform duration-200">
                <Play className="w-4 h-4 ml-0.5 fill-zinc-950 text-zinc-950" />
              </div>
            </div>

            {/* Bottom-left View Count Pill Overlay */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-200">
              <Eye className="w-3 h-3 text-zinc-400" />
              <span>{drama.views || '1.2M'}</span>
            </div>

            {/* Bottom-right Episode Count Pill */}
            <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
              {drama.totalEpisodes} Eps
            </div>
          </div>
        </div>

        {/* Video Details Section */}
        <div className="mt-2.5 px-0.5 flex items-start justify-between gap-1.5">
          <div className="flex-1 min-w-0">
            {/* Title (2 lines clamp) */}
            <h3 className="text-[13px] sm:text-[14px] font-medium text-zinc-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {drama.title}
            </h3>

            {/* Sub-meta: Views • Dub Language • Rating */}
            <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-[12px] text-zinc-400 flex-wrap">
              <span>{drama.language || 'English Dub'}</span>
              <span>•</span>
              {drama.rating ? (
                <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{drama.rating}</span>
                </span>
              ) : (
                <span>8.8</span>
              )}
              {cleanTag && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[85px] text-zinc-500 font-medium">
                    #{cleanTag}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 3-dots Menu Button */}
          <div className="relative shrink-0 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-[#1c1c1c]/95 backdrop-blur-xl border border-white/10 shadow-2xl py-1 text-xs text-zinc-200 flex flex-col"
              >
                {onToggleSave && (
                  <button
                    type="button"
                    onClick={(e) => {
                      onToggleSave(drama.id, e);
                      setShowMenu(false);
                    }}
                    className="px-3 py-2 flex items-center gap-2 hover:bg-white/10 text-left transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Remove from List' : 'Save to Watchlist'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 flex items-center gap-2 hover:bg-white/10 text-left transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Drama Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
