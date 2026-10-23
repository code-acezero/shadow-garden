"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Play, Plus, Star, Info, Trash2, ExternalLink, 
  Check, Clock, Bookmark, Pause, AlertTriangle
} from 'lucide-react';
import { cn, getWatchRoute, getSafeImageUrl } from '@/lib/utils';
import { resolveAniListMedia, AniListMediaDetails } from '@/lib/anilistSync';
import { supabase } from '@/lib/supabase';

interface WatchlistCardProps {
  item: {
    id: string;
    anime_id: string;
    anime_title: string;
    anime_image?: string;
    banner_image?: string;
    status: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';
    progress?: number;
    last_episode_number?: number;
    total_episodes?: number;
    score?: number;
    updated_at: string;
  };
  viewMode?: 'grid' | 'list';
  onStatusChange: (animeId: string, newStatus: string) => void;
  onRemove: (animeId: string) => void;
  onOpenIntel: (animeId: string, fallbackTitle?: string, fallbackImage?: string) => void;
  onProgressUpdate?: (animeId: string, newEp: number) => void;
}

const statusConfig: Record<string, { label: string; color: string; border: string; bg: string }> = {
  watching: { label: 'Watching', color: 'text-primary-400', border: 'border-primary-500/40', bg: 'bg-primary-950/40' },
  plan_to_watch: { label: 'Plan to Watch', color: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-950/40' },
  completed: { label: 'Completed', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/40' },
  on_hold: { label: 'On Hold', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/40' },
  dropped: { label: 'Dropped', color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-950/40' },
};

export default function WatchlistCard({
  item,
  viewMode = 'grid',
  onStatusChange,
  onRemove,
  onOpenIntel,
  onProgressUpdate,
}: WatchlistCardProps) {
  const router = useRouter();
  const [aniDetails, setAniDetails] = useState<AniListMediaDetails | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(item.last_episode_number || item.progress || 0);
  const [isUpdatingEp, setIsUpdatingEp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAniData() {
      setLoadingMedia(true);
      try {
        const details = await resolveAniListMedia(item.anime_title, item.anime_id);
        if (isMounted && details) {
          setAniDetails(details);
        }
      } catch (err) {
        // Fallback to static
      } finally {
        if (isMounted) setLoadingMedia(false);
      }
    }
    loadAniData();
    return () => { isMounted = false; };
  }, [item.anime_title, item.anime_id]);

  // Derived media values
  const displayTitle = aniDetails?.title?.english || aniDetails?.title?.romaji || aniDetails?.title?.userPreferred || item.anime_title;
  const subTitle = (aniDetails?.title?.english && aniDetails?.title?.romaji !== aniDetails?.title?.english) ? aniDetails?.title?.romaji : null;
  const posterUrl = aniDetails?.coverImage?.extraLarge || aniDetails?.coverImage?.large || item.anime_image || '/images/placeholder-no-img.jpg';
  const totalEps = aniDetails?.episodes || item.total_episodes || null;
  const score = aniDetails?.averageScore ? (aniDetails.averageScore / 10).toFixed(1) : (item.score ? Number(item.score).toFixed(1) : null);
  const airingStatus = aniDetails?.status; // RELEASING, FINISHED, NOT_YET_RELEASED
  const anilistId = aniDetails?.id;

  const currentEp = currentProgress;
  const progressPercent = totalEps && totalEps > 0 ? Math.min(Math.round((currentEp / totalEps) * 100), 100) : null;

  const handleIncrementEp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdatingEp) return;
    setIsUpdatingEp(true);
    const newEp = currentEp + 1;
    setCurrentProgress(newEp);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Auto update completed if reached total episodes
        let newStatus = item.status;
        if (totalEps && newEp >= totalEps) {
          newStatus = 'completed';
          onStatusChange(item.anime_id, 'completed');
        }

        await supabase.from('watchlist').update({
          last_episode_number: newEp,
          status: newStatus,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id).eq('anime_id', item.anime_id);

        if (onProgressUpdate) onProgressUpdate(item.anime_id, newEp);

        // Also push to AniList in background if token exists
        const token = localStorage.getItem('anilist_token');
        if (token && anilistId) {
          fetch('/api/anime/anilist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              query: `
                mutation ($id: Int, $progress: Int, $status: MediaListStatus) {
                  SaveMediaListEntry (mediaId: $id, progress: $progress, status: $status) {
                    id progress status
                  }
                }
              `,
              variables: {
                id: anilistId,
                progress: newEp,
                status: newStatus === 'completed' ? 'COMPLETED' : 'CURRENT'
              }
            })
          }).catch(() => {});
        }
      }
    } catch {} finally {
      setIsUpdatingEp(false);
    }
  };

  const handleCardClick = () => {
    router.push(getWatchRoute(item.anime_id, undefined, 'anime', displayTitle));
  };

  const currentStatusConf = statusConfig[item.status] || statusConfig.watching;

  // --- GRID VIEW ---
  if (viewMode === 'grid') {
    return (
      <div 
        onClick={handleCardClick}
        className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-950/80 border border-white/5 hover:border-white/20 transition-all duration-300 shadow-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-pointer select-none"
      >
        {/* POSTER IMAGE CONTAINER */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
          <img 
            src={getSafeImageUrl(posterUrl)} 
            alt={displayTitle} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
          />

          {/* GRADIENT OVERLAYS */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />

          {/* TOP BADGES */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            {/* Airing / Format badge */}
            <div className="flex items-center gap-1">
              {airingStatus === 'RELEASING' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 backdrop-blur-md shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Airing
                </span>
              ) : airingStatus === 'FINISHED' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-900/80 text-zinc-400 border border-white/10 backdrop-blur-md">
                  Finished
                </span>
              ) : aniDetails?.format ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/10 backdrop-blur-md">
                  {aniDetails.format}
                </span>
              ) : null}
            </div>

            {/* Score Star badge */}
            {score && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-black/60 border border-yellow-500/30 text-yellow-400 backdrop-blur-md shadow-lg">
                <Star size={10} className="fill-yellow-400" />
                {score}
              </span>
            )}
          </div>

          {/* HOVER QUICK ACTION OVERLAY */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
            {/* Direct AniList link */}
            {anilistId && (
              <a
                href={`https://anilist.co/anime/${anilistId}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="View on AniList"
                className="w-7 h-7 rounded-full bg-[#02a9ff]/20 hover:bg-[#02a9ff] border border-[#02a9ff]/40 text-[#02a9ff] hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110"
              >
                <ExternalLink size={12} />
              </a>
            )}

            {/* Intel modal button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenIntel(item.anime_id, displayTitle, posterUrl);
              }}
              title="Intel Dossier"
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-white text-zinc-300 hover:text-black border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110"
            >
              <Info size={12} />
            </button>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.anime_id);
              }}
              title="Remove from Watchlist"
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-110"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* PLAY BUTTON IN CENTER ON HOVER */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="w-12 h-12 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.8)] scale-90 group-hover:scale-100 transition-transform">
              <Play size={20} className="fill-white translate-x-0.5" />
            </div>
          </div>

          {/* PROGRESS HUD BAR AT BOTTOM OF POSTER */}
          <div className="absolute bottom-0 inset-x-0 p-2.5 z-10 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span className="text-zinc-300 flex items-center gap-1 font-mono">
                Ep <b className="text-white text-xs">{currentEp}</b>
                <span className="text-zinc-500">/ {totalEps || '?'}</span>
              </span>

              {/* Quick +1 Ep Stepper */}
              <button
                onClick={handleIncrementEp}
                disabled={isUpdatingEp}
                title="Watch next episode (+1)"
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-black text-[9px] uppercase tracking-wider transition-transform active:scale-90 shadow-md"
              >
                <Plus size={10} /> 1
              </button>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 to-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent !== null ? progressPercent : (currentEp > 0 ? 30 : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* DETAILS SECTION UNDER POSTER */}
        <div className="p-3 flex flex-col justify-between gap-2 flex-1">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
              {displayTitle}
            </h3>
            {subTitle && (
              <p className="text-[10px] text-zinc-500 line-clamp-1 font-mono mt-0.5">
                {subTitle}
              </p>
            )}
          </div>

          {/* INLINE STATUS SELECTOR */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <select
              value={item.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onStatusChange(item.anime_id, e.target.value)}
              className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-colors bg-zinc-900",
                currentStatusConf.color,
                currentStatusConf.border
              )}
            >
              <option value="watching">Watching</option>
              <option value="plan_to_watch">Planning</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="dropped">Dropped</option>
            </select>

            {aniDetails && (
              <span className="text-[9px] text-[#02a9ff] font-bold uppercase tracking-widest flex items-center gap-1" title="Synced with AniList">
                <span className="w-1.5 h-1.5 rounded-full bg-[#02a9ff]" />
                AniList
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div 
      onClick={handleCardClick}
      className="group relative flex items-center gap-4 p-3 rounded-2xl bg-zinc-950/80 border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer select-none"
    >
      {/* POSTER */}
      <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
        <img 
          src={getSafeImageUrl(posterUrl)} 
          alt={displayTitle} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
          onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div 
            className="h-full bg-primary-600" 
            style={{ width: `${progressPercent !== null ? progressPercent : (currentEp > 0 ? 30 : 0)}%` }} 
          />
        </div>
      </div>

      {/* METADATA */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          {score && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-500/30 px-1.5 py-0.5 rounded-md">
              <Star size={9} className="fill-yellow-400" /> {score}
            </span>
          )}
          {airingStatus === 'RELEASING' && (
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Airing
            </span>
          )}
          {aniDetails && (
            <span className="text-[9px] text-[#02a9ff] font-bold uppercase tracking-widest hidden sm:inline-block">
              AniList Live
            </span>
          )}
        </div>

        <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-primary-400 transition-colors">
          {displayTitle}
        </h3>
        {subTitle && (
          <p className="text-xs text-zinc-500 truncate font-mono">{subTitle}</p>
        )}

        {/* PROGRESS INFO */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-zinc-400 font-mono">
            Ep <b className="text-white">{currentEp}</b> / {totalEps || '?'}
          </span>
          <button
            onClick={handleIncrementEp}
            disabled={isUpdatingEp}
            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-primary-600 text-white text-[10px] font-bold uppercase transition-colors"
          >
            +1 Ep
          </button>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={item.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(item.anime_id, e.target.value)}
          className={cn(
            "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-colors bg-zinc-900",
            currentStatusConf.color,
            currentStatusConf.border
          )}
        >
          <option value="watching">Watching</option>
          <option value="plan_to_watch">Planning</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="dropped">Dropped</option>
        </select>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenIntel(item.anime_id, displayTitle, posterUrl);
          }}
          title="Intel Dossier"
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <Info size={14} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.anime_id);
          }}
          title="Remove from Watchlist"
          className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
