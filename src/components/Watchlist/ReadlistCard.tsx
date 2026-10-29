"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn, getSafeImageUrl } from '@/lib/utils';
import { resolveAniListMedia, AniListMediaDetails } from '@/lib/anilistSync';
import { playGummyTap, playGummyPop } from '@/lib/audioManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PuffedBook,
  PuffedCheck,
  PuffedBookmark,
  PuffedPause,
  PuffedClock,
  PuffedTrash,
  PuffedPlus,
  PuffedStar,
  PuffedExternal
} from './PuffedIcons';
import { ChevronDown, Check } from 'lucide-react';

export interface ReadlistCardProps {
  item: {
    id: string;
    anime_id?: string;
    manga_id?: string;
    title?: string;
    anime_title?: string;
    poster?: string;
    anime_image?: string;
    cover_image?: string;
    cover?: string;
    status: 'reading' | 'plan_to_read' | 'completed' | 'on_hold' | 'dropped' | string;
    progress?: number;
    chapters_read?: number;
    total_chapters?: number | null;
    media_type?: string;
    score?: number;
    updated_at?: string;
  };
  viewMode?: 'grid' | 'list' | 'compact';
  onStatusChange: (mangaId: string, newStatus: string) => void;
  onRemove: (mangaId: string) => void;
  onProgressUpdate?: (mangaId: string, newChapter: number, totalChapters?: number) => void;
}

const statusConfig: Record<string, { label: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  reading: { label: 'Reading', icon: PuffedBook },
  plan_to_read: { label: 'Planned', icon: PuffedBookmark },
  completed: { label: 'Completed', icon: PuffedCheck },
  on_hold: { label: 'On Hold', icon: PuffedPause },
  dropped: { label: 'Dropped', icon: PuffedClock },
};

export default function ReadlistCard({
  item,
  viewMode = 'grid',
  onStatusChange,
  onRemove,
  onProgressUpdate,
}: ReadlistCardProps) {
  const router = useRouter();
  const mangaId = item.anime_id || item.manga_id || item.id;
  const initialTitle = item.title || item.anime_title || 'Untitled Work';
  const initialCover = item.poster || item.anime_image || item.cover_image || item.cover || '/images/placeholder.jpg';
  const mediaType = (item.media_type || 'manga').toUpperCase();

  const [aniDetails, setAniDetails] = useState<AniListMediaDetails | null>(null);
  const [currentChapter, setCurrentChapter] = useState(item.chapters_read ?? item.progress ?? 0);

  useEffect(() => {
    setCurrentChapter(item.chapters_read ?? item.progress ?? 0);
  }, [item.chapters_read, item.progress]);

  // Dynamically resolve live data from AniList so chapters, covers, and scores aren't stale
  useEffect(() => {
    let isMounted = true;
    async function loadDynamicInfo() {
      try {
        const details = await resolveAniListMedia(initialTitle, mangaId, 'MANGA');
        if (isMounted && details) {
          setAniDetails(details);
        }
      } catch (_) {}
    }
    loadDynamicInfo();
    return () => { isMounted = false; };
  }, [initialTitle, mangaId]);

  const displayTitle = aniDetails?.title?.english || aniDetails?.title?.romaji || aniDetails?.title?.userPreferred || initialTitle;
  const coverUrl = aniDetails?.coverImage?.extraLarge || aniDetails?.coverImage?.large || initialCover;
  const totalChapters = aniDetails?.chapters || item.total_chapters || null;
  const score = aniDetails?.averageScore 
    ? (aniDetails.averageScore / 10).toFixed(1) 
    : (item.score ? Number(item.score).toFixed(1) : null);
  const pubStatus = aniDetails?.status; // RELEASING, FINISHED
  const anilistId = aniDetails?.id;

  const currentStatus = statusConfig[item.status] ? item.status : 'reading';
  const StatusIcon = statusConfig[currentStatus].icon;

  const progressPercent = totalChapters && totalChapters > 0
    ? Math.min(Math.round((currentChapter / totalChapters) * 100), 100)
    : null;

  const handleCardClick = () => {
    playGummyTap();
    router.push(`/manga/${mangaId}`);
  };

  const handleIncrementChapter = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playGummyPop(0.35);
    const nextChapter = currentChapter + 1;
    setCurrentChapter(nextChapter);
    if (onProgressUpdate) {
      onProgressUpdate(mangaId, nextChapter, totalChapters || undefined);
    }
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
              alt={displayTitle} 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg'; }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-zinc-200">
              {displayTitle}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono">
              <span>Ch {currentChapter}{totalChapters ? ` / ${totalChapters}` : ''}</span>
              <span className="uppercase text-[9px] text-zinc-400">· {mediaType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {score && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-zinc-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <PuffedStar size={10} className="text-white" />
              {score}
            </span>
          )}

          <button
            onClick={handleIncrementChapter}
            title="Next chapter"
            className="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white border border-white/10 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none"
          >
            <PuffedPlus size={11} />
            <span className="hidden sm:inline">Ch</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none">
                <StatusIcon size={11} />
                <span className="hidden sm:inline">{statusConfig[currentStatus].label}</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-zinc-950 border border-white/10 p-1 rounded-xl text-xs select-none z-50 outline-none">
              {Object.entries(statusConfig).map(([key, conf]) => {
                const Icon = conf.icon;
                const isSelected = key === currentStatus;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onStatusChange(mangaId, key)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-medium outline-none",
                      isSelected ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={12} />
                      <span>{conf.label}</span>
                    </span>
                    {isSelected && <Check size={12} className="text-white" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="my-1 bg-white/10" />
              <DropdownMenuItem
                onClick={() => onRemove(mangaId)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] text-zinc-400 hover:text-white hover:bg-white/5 outline-none"
              >
                <PuffedTrash size={12} />
                <span>Remove</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className="group relative flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/10 transition-all select-none cursor-pointer"
      >
        <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
          <img 
            src={getSafeImageUrl(coverUrl)} 
            alt={displayTitle} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg'; }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent !== null ? progressPercent : (currentChapter > 0 ? 25 : 0)}%` }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              {mediaType}
            </span>
            {score && (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-zinc-300 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                <PuffedStar size={9} className="text-white" />
                {score}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
            {displayTitle}
          </h3>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400 font-mono">
            <span>Chapter <b className="text-white">{currentChapter}</b>{totalChapters ? ` / ${totalChapters}` : ''}</span>
            {progressPercent !== null && (
              <span className="text-[10px] text-zinc-400 font-medium">({progressPercent}%)</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleIncrementChapter}
            title="Mark next chapter read"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black border border-white/15 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none"
          >
            <PuffedPlus size={12} />
            <span className="hidden sm:inline">+1 Ch</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none">
                <StatusIcon size={12} />
                <span className="hidden sm:inline">{statusConfig[currentStatus].label}</span>
                <ChevronDown size={12} className="opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-zinc-950 border border-white/10 p-1.5 rounded-2xl shadow-2xl z-50 text-xs select-none">
              {Object.entries(statusConfig).map(([key, conf]) => {
                const Icon = conf.icon;
                const isSelected = key === currentStatus;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => {
                      playGummyTap();
                      onStatusChange(mangaId, key);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-[11px] font-bold transition-colors",
                      isSelected ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={12} />
                      <span>{conf.label}</span>
                    </span>
                    {isSelected && <Check size={12} className="text-white" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="my-1 bg-white/10" />
              <DropdownMenuItem
                onClick={() => {
                  playGummyTap();
                  onRemove(mangaId);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <PuffedTrash size={12} />
                <span>Remove from Library</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // ─── GRID VIEW (DEFAULT) ───────────────────────────────────────────────────
  return (
    <div 
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 select-none cursor-pointer"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 group-hover:border-white/25 transition-colors">
        <img 
          src={getSafeImageUrl(coverUrl)} 
          alt={displayTitle} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg'; }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* TOP BADGES */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/60 text-zinc-300 border border-white/15 backdrop-blur-md">
              {mediaType}
            </span>
            {pubStatus && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/60 text-zinc-400 border border-white/15 backdrop-blur-md">
                {pubStatus === 'RELEASING' ? 'Airing' : 'Ended'}
              </span>
            )}
          </div>

          {score && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 border border-white/15 text-white backdrop-blur-md">
              <PuffedStar size={10} className="text-white" />
              {score}
            </span>
          )}
        </div>

        {/* HOVER QUICK ACTIONS */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          {anilistId && (
            <a
              href={`https://anilist.co/manga/${anilistId}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="View on AniList"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-white text-zinc-300 hover:text-black border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 outline-none focus:outline-none focus:ring-0"
            >
              <PuffedExternal size={12} />
            </a>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(mangaId);
            }}
            title="Remove from Library"
            className="w-7 h-7 rounded-full bg-black/70 hover:bg-white text-zinc-300 hover:text-black border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 outline-none focus:outline-none focus:ring-0"
          >
            <PuffedTrash size={12} />
          </button>
        </div>

        {/* BOTTOM METADATA ON COVER */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end z-10">
          <h3 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-sm group-hover:text-zinc-200">
            {displayTitle}
          </h3>

          <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-zinc-400">
            <span>Ch <b>{currentChapter}</b>{totalChapters ? ` / ${totalChapters}` : ''}</span>
            {progressPercent !== null && (
              <span className="text-[10px] text-zinc-300">{progressPercent}%</span>
            )}
          </div>

          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent !== null ? progressPercent : (currentChapter > 0 ? 25 : 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* QUICK FOOTER: STEPPER & STATUS SELECTOR */}
      <div className="flex items-center justify-between gap-1.5 mt-2 px-0.5" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none">
              <span className="flex items-center gap-1.5 truncate">
                <StatusIcon size={11} />
                <span className="truncate">{statusConfig[currentStatus].label}</span>
              </span>
              <ChevronDown size={10} className="opacity-50 shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 bg-zinc-950 border border-white/10 p-1.5 rounded-2xl shadow-2xl z-50 text-xs select-none outline-none">
            {Object.entries(statusConfig).map(([key, conf]) => {
              const Icon = conf.icon;
              const isSelected = key === currentStatus;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    playGummyTap();
                    onStatusChange(mangaId, key);
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-[11px] font-bold transition-colors outline-none",
                    isSelected ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={12} />
                    <span>{conf.label}</span>
                  </span>
                  {isSelected && <Check size={12} className="text-white" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={handleIncrementChapter}
          title="Mark next chapter read"
          className="h-7 px-2.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black border border-white/15 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none"
        >
          <PuffedPlus size={11} />
          <span>1</span>
        </button>
      </div>
    </div>
  );
}
