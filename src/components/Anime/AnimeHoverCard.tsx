"use client";

import React, { useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { 
  Clock, Star, Captions, Mic, 
  Play, Radio 
} from 'lucide-react';
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from '@/components/ui/hover-card';
import { cn, getSafeImageUrl, slugifyTitle } from '@/lib/utils';
import { AnimeService } from '@/lib/api';

export interface AnimeHoverCardProps {
  anime: any;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  themeVariant?: 'primary' | 'emerald' | 'orange';
}

export default function AnimeHoverCard({
  anime,
  children,
  side = 'right',
  align = 'start',
  themeVariant = 'primary'
}: AnimeHoverCardProps) {
  const animeId = anime?.id || anime?.slug;

  // Lazily fetch full anime metadata on hover only if synopsis / full details aren't already present
  const shouldFetch = Boolean(
    animeId && 
    (!anime?.description || anime?.description === "Classified Intel." || !anime?.stats)
  );

  const { data: details, isLoading } = useSWR(
    shouldFetch ? `anime-hover-details-${animeId}` : null,
    () => AnimeService.getAnimeInfo(String(animeId)).catch(() => null),
    { revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 60000 }
  );

  const merged = useMemo(() => {
    const raw = (details || {}) as any;
    const titleStr = typeof anime?.title === 'string' 
      ? anime.title 
      : (anime?.title?.english || anime?.title?.userPreferred || anime?.title?.romaji || raw?.title || raw?.name || anime?.name || 'Unknown Title');
    
    const japaneseTitle = anime?.title?.native || anime?.jname || anime?.japaneseTitle || raw?.jname || raw?.info?.japanese || '';

    const poster = getSafeImageUrl(
      raw?.poster || anime?.poster || anime?.image || raw?.image || '/images/placeholder-no-img.jpg'
    );

    const type = (anime?.type || raw?.type || raw?.stats?.type || 'TV').toUpperCase();
    const duration = anime?.duration || raw?.duration || raw?.stats?.duration || '24 min';
    
    // Normalize score
    let score = anime?.score || anime?.malScore || raw?.stats?.malScore || raw?.malScore || raw?.score || null;
    if (typeof score === 'string') score = score.replace('/10', '').trim();
    if (score && !isNaN(Number(score))) {
      score = Number(score).toFixed(1);
    } else {
      score = null;
    }

    const quality = anime?.quality || raw?.stats?.quality || 'HD';
    const subCount = anime?.episodes?.sub ?? anime?.subCount ?? anime?.sub ?? raw?.stats?.episodes?.sub ?? anime?.episode ?? null;
    const dubCount = anime?.episodes?.dub ?? anime?.dubCount ?? anime?.dub ?? raw?.stats?.episodes?.dub ?? (anime?.isHindi ? (anime?.episode || 1) : null);

    const description = raw?.synopsis || raw?.description || anime?.description || anime?.synopsis || "No classified synopsis recorded yet for this operation.";

    const genres = Array.isArray(raw?.info?.genres) 
      ? raw.info.genres.slice(0, 3) 
      : Array.isArray(anime?.genres) 
        ? anime.genres.slice(0, 3) 
        : [];

    const isHindi = Boolean(
      anime?.isHindi || 
      anime?.category === 'hindi' || 
      anime?.dubType?.toLowerCase().includes('hindi')
    );

    const airTime = anime?.airingAt
      ? new Date(anime.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;

    const slug = slugifyTitle(titleStr);
    const routeId = (slug && !String(animeId).includes('-')) ? `${animeId}-${slug}` : animeId;
    const watchRoute = anime?.watchUrl || `/watch/${routeId}?ep=${anime?.episode || 1}${isHindi ? '&audio=hi' : ''}`;

    return {
      titleStr,
      japaneseTitle,
      poster,
      type,
      duration,
      score,
      quality,
      subCount,
      dubCount,
      description,
      genres,
      isHindi,
      airTime,
      watchRoute
    };
  }, [anime, details, animeId]);

  // Color theme classes
  const themeClasses = useMemo(() => {
    switch (themeVariant) {
      case 'emerald':
        return {
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          badge: 'bg-emerald-500 text-black',
          subBadge: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
          accentText: 'text-emerald-400',
          btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30',
          ambient: 'bg-emerald-500/10'
        };
      case 'orange':
        return {
          border: 'border-orange-500/20 hover:border-orange-500/40',
          badge: 'bg-orange-500 text-black',
          subBadge: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
          accentText: 'text-orange-400',
          btnBg: 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/30',
          ambient: 'bg-orange-500/10'
        };
      case 'primary':
      default:
        return {
          border: 'border-white/10 hover:border-primary-500/30',
          badge: 'bg-primary-600 text-white',
          subBadge: 'border-primary-500/30 text-primary-400 bg-primary-500/10',
          accentText: 'text-primary-400',
          btnBg: 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-900/40',
          ambient: 'bg-primary-600/10'
        };
    }
  }, [themeVariant]);

  const ratingSource = useMemo(() => {
    if (anime?.ratingSource) return anime.ratingSource;
    if (anime?.scoreSource) return anime.scoreSource;

    const route = merged.watchRoute || '';
    const typeLower = (merged.type || '').toLowerCase();
    const sourceLower = (anime?.source || '').toLowerCase();

    if (
      anime?.imdbScore ||
      sourceLower === 'universal' ||
      sourceLower === 'drama' ||
      sourceLower === 'flix' ||
      sourceLower === 'cinema' ||
      route.includes('/movies-watch/') ||
      route.includes('/drama-watch/') ||
      route.includes('/series-watch/') ||
      ['movie', 'drama', 'series', 'k-drama', 'c-drama', 'j-drama', 'thai drama', 'turkish drama', 'tv show'].includes(typeLower)
    ) {
      return 'IMDb';
    }

    if (sourceLower === 'donghua' || typeLower === 'donghua' || route.includes('/donghua-watch/')) {
      return 'DONGHUA';
    }

    return 'MAL';
  }, [anime, merged]);

  return (
    <HoverCard openDelay={140} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={12}
        avoidCollisions={true}
        className={cn(
          "hidden md:block w-[320px] lg:w-[340px] p-0 bg-[#090d16]/95 backdrop-blur-2xl border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden outline-none pointer-events-auto",
          themeClasses.border
        )}
      >
        {/* Top Header with Backdrop Poster Image */}
        <div className="relative h-40 w-full overflow-hidden bg-black/60">
          <img 
            src={merged.poster} 
            alt={merged.titleStr}
            className="w-full h-full object-cover transform scale-105 filter brightness-75"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md shadow-sm", themeClasses.badge)}>
              {merged.type}
            </span>

            <div className="flex items-center gap-1.5">
              {merged.isHindi && (
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  HINDI DUB
                </span>
              )}
              {merged.score && (
                <div className="flex items-center gap-1.5 font-mono select-none">
                  <span className="text-[#4e85ff] text-[11px] font-black tracking-wider uppercase">{ratingSource}</span>
                  <span className="text-zinc-100 font-bold text-[11.5px]">{merged.score}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Japanese Subtitle pinned to bottom of banner */}
          <div className="absolute bottom-2.5 left-3.5 right-3.5 z-10">
            <h4 className="text-white font-black text-sm lg:text-base leading-snug line-clamp-2 drop-shadow-md">
              {merged.titleStr}
            </h4>
            {merged.japaneseTitle && (
              <p className="text-[10px] text-zinc-400 italic line-clamp-1 mt-0.5">
                {merged.japaneseTitle}
              </p>
            )}
          </div>
        </div>

        {/* Card Body Details */}
        <div className="p-4 space-y-3 relative">
          {/* Quick Metrics Bar */}
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 pb-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-zinc-400">
                <Clock size={11} className={themeClasses.accentText} />
                <span>{merged.duration}</span>
              </span>
              {merged.airTime && (
                <span className="flex items-center gap-1 text-zinc-400 font-mono text-[10px]">
                  <Radio size={11} className="text-emerald-400" />
                  <span>{merged.airTime}</span>
                </span>
              )}
            </div>

            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] uppercase font-mono text-zinc-300">
              {merged.quality}
            </span>
          </div>

          {/* Synopsis Paragraph */}
          <div className="min-h-[50px]">
            {isLoading ? (
              <div className="space-y-1.5 animate-pulse py-1">
                <div className="h-2 bg-white/10 rounded w-full" />
                <div className="h-2 bg-white/10 rounded w-5/6" />
                <div className="h-2 bg-white/10 rounded w-4/6" />
              </div>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4 font-normal">
                {merged.description}
              </p>
            )}
          </div>

          {/* Audio Tracks & Genres Pill Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[10px]">
              {merged.subCount !== null && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-bold">
                  <Captions size={10} className="text-zinc-400" />
                  <span>EP {merged.subCount}</span>
                </div>
              )}
              {merged.dubCount !== null && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-bold">
                  <Mic size={10} className="text-yellow-400" />
                  <span>EP {merged.dubCount}</span>
                </div>
              )}
            </div>

            {merged.genres.length > 0 && (
              <div className="flex items-center gap-1 overflow-hidden">
                {merged.genres.map((g: string) => (
                  <span 
                    key={g} 
                    className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[9px] text-zinc-400 font-medium whitespace-nowrap"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Watch Direct CTA Button */}
          <div className="pt-2">
            <Link
              href={merged.watchRoute}
              className={cn(
                "w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95",
                themeClasses.btnBg
              )}
            >
              <Play size={13} className="fill-current" />
              <span>Watch Now</span>
            </Link>
          </div>

          {/* Ambient Corner Glow */}
          <div className={cn("absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none", themeClasses.ambient)} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
