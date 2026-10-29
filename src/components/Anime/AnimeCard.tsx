"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Captions, Mic, ListVideo } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { AnimeService } from '@/lib/api';
import { playGummyPop } from '@/lib/audioManager';
import { cn, getSafeImageUrl, slugifyTitle } from '@/lib/utils';

export interface UnifiedAnimeData {
  id: string;
  title?: string | { userPreferred?: string; english?: string; romaji?: string; native?: string };
  name?: string;
  image?: string; 
  poster?: string;
  cover?: string;
  type?: string;
  format?: string;
  isAdult?: boolean;
  totalEpisodes?: number | string;
  total_episodes?: number | string;
  sub?: number;
  dub?: number;
  subCount?: number;
  dubCount?: number;
  episode?: number | string;
  episodeId?: string; 
  episodes?: { sub?: number; dub?: number; eps?: number } | number;
  releaseDate?: string;
  year?: string | number;
  status?: string;
  score?: string | number;
  malScore?: string | number;
  averageScore?: string | number;
  imdbScore?: string | number;
  rating?: string | number;
  ageRating?: string;
  rank?: string | number;
  category?: string;
  media_type?: string;
  source?: 'universal' | 'consumet' | 'hindi' | 'donghua' | string;
  isHindi?: boolean;
  targetRoute?: string;
  genres?: string[];
}

export interface AnimeCardProps {
  anime: UnifiedAnimeData | any; 
  progress?: number;
  isHindi?: boolean;
  hideType?: boolean;
  hideRating?: boolean;
  className?: string;
  aspectRatio?: string;
  rank?: number | string;
}

interface QTipData {
  jname?: string;
  rating?: string;
  quality?: string;
  description?: string;
  genres?: string[];
  studios?: string;
  duration?: string;
  synonyms?: string;
  season?: string;
  isAdult?: boolean;
  totalEpisodes?: number | string;
}

const mobileOverlayVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 20 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } }
};

function AnimeCardComponent({ 
  anime, 
  progress = 0, 
  isHindi = false, 
  hideType = false, 
  hideRating = false,
  className,
  aspectRatio,
  rank
}: AnimeCardProps) {
  const router = useRouter(); 
  const cardRef = useRef<HTMLDivElement>(null);

  // Hover State
  const [isHovered, setIsHovered] = useState(false);
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Normalization of title, image, routes, and audio metadata
  const normalized = useMemo(() => {
    const displayImage = getSafeImageUrl(
      anime.poster || anime.image || anime.cover || "/images/no-poster.png"
    );
    
    let displayTitle = "Unknown Title";
    if (typeof anime.title === 'object' && anime.title !== null) {
      displayTitle = anime.title.userPreferred || anime.title.english || anime.title.romaji || anime.title.native || "Unknown";
    } else if (anime.title) {
      displayTitle = anime.title;
    } else if (anime.name) {
      displayTitle = anime.name;
    }

    const rawSub = typeof anime.episodes === 'object' ? anime.episodes?.sub : (anime.sub ?? anime.subCount ?? null);
    const rawDub = typeof anime.episodes === 'object' ? anime.episodes?.dub : (anime.dub ?? anime.dubCount ?? null);

    // Estimated total episodes set to premier for this anime (never fallback to released subCount)
    const totalEp = anime.totalEpisodes || 
      anime.total_episodes || 
      (typeof anime.episodes === 'object' ? (anime.episodes?.eps || anime.episodes?.total) : null) || 
      (typeof anime.episodes === 'number' ? anime.episodes : null) || 
      anime.total || 
      (typeof anime.type === 'string' && anime.type.toLowerCase() === 'movie' ? 1 : null);

    const isHindiMedia = Boolean(
      isHindi || 
      anime.isHindi || 
      anime.category === 'hindi' || 
      anime.source === 'hindi' || 
      anime.media_type === 'hindi' || 
      anime.type?.toLowerCase() === 'hindi' || 
      (typeof displayTitle === 'string' && /hindi/i.test(displayTitle))
    );
    const isDubMedia = isHindiMedia || anime.media_type === 'dub' || anime.type?.toLowerCase() === 'dub';

    const subCount = rawSub !== null ? rawSub : (!isDubMedia && anime.episode ? anime.episode : null);
    const dubCount = rawDub !== null ? rawDub : (isDubMedia && anime.episode ? anime.episode : null);

    // Adult Rating Check
    const genresList = Array.isArray(anime.genres) ? anime.genres.map((g: any) => String(g).toLowerCase()) : [];
    const hasAdultGenre = genresList.some((g: string) => ['ecchi', 'erotica', 'hentai', 'adult'].includes(g));
    let rawRatingGiven = anime.ageRating || "";
    if (!rawRatingGiven && anime.rating && !/^\d+(\.\d+)?(\/10)?$/.test(String(anime.rating).trim())) {
      rawRatingGiven = anime.rating;
    }
    const rawUpper = String(rawRatingGiven || '').toUpperCase().trim();
    const isAdult = Boolean(
      anime.isAdult === true || 
      hasAdultGenre || 
      ["RX", "HENTAI", "18", "R+", "R -", "R-17", "R17", "NC-17", "MATURE", "SEX"].some(t => rawUpper.includes(t)) ||
      rawUpper === "R" || rawUpper.startsWith("R")
    );
    const rawRating = rawRatingGiven || (isAdult ? "18+" : "PG-13");

    // Extract Release Year
    let releaseYear = '';
    if (anime.year) {
      releaseYear = String(anime.year);
    } else if (anime.releaseDate) {
      const match = String(anime.releaseDate).match(/\b(19\d\d|20\d\d)\b/);
      if (match) releaseYear = match[1];
    }

    // Target Watch Route Logic
    let finalRoute = "";
    const titleSlug = slugifyTitle(displayTitle);
    const routeId = (titleSlug && !String(anime.id).includes('-')) ? `${anime.id}-${titleSlug}` : anime.id;

    if (anime.targetRoute) {
      finalRoute = anime.targetRoute;
      if (titleSlug && finalRoute.startsWith('/watch/') && !finalRoute.includes('-')) {
        finalRoute = finalRoute.replace(/^\/watch\/([^?&#]+)/, (_, rawId) => `/watch/${rawId}-${titleSlug}`);
      }
    } else {
      const isDonghua = (anime.type?.toLowerCase() === 'donghua') || anime.source === 'donghua';
      const baseUrl = isDonghua ? `/donghua-watch/${anime.id}` : `/watch/${routeId}`;
      const targetEp = anime.episodeId || anime.episode;
      if (targetEp) {
        const epParam = (typeof targetEp === 'string' && (targetEp.startsWith('/') || targetEp.includes('?'))) 
          ? targetEp 
          : `?ep=${targetEp}`;
        const audioParam = isHindiMedia ? (epParam.includes('?') ? '&audio=hi' : '?audio=hi') : '';
        finalRoute = `${baseUrl}${epParam}${audioParam}`;
      } else {
        finalRoute = isHindiMedia ? `${baseUrl}?audio=hi` : baseUrl;
      }
    }

    const rawType = (anime.type || anime.format || "TV").toUpperCase().replace(/_/g, ' ');

    return { 
      displayImage, 
      displayTitle, 
      subCount, 
      dubCount, 
      totalEp, 
      isAdult, 
      rawRating,
      targetRoute: finalRoute, 
      type: rawType,
      isHindiMedia,
      releaseYear,
      status: anime.status || ""
    };
  }, [anime, isHindi]);

  // Normalized Numeric Score
  const score = useMemo(() => {
    if (anime.score !== undefined && anime.score !== null && anime.score !== '') {
      const s = String(anime.score).replace('/10', '').trim();
      if (!isNaN(Number(s)) && Number(s) > 0) return Number(s).toFixed(1);
    }
    if (anime.malScore !== undefined && anime.malScore !== null) {
      const s = String(anime.malScore).replace('/10', '').trim();
      if (!isNaN(Number(s)) && Number(s) > 0) return Number(s).toFixed(1);
    }
    if (anime.averageScore) {
      const num = Number(anime.averageScore);
      if (!isNaN(num) && num > 0) return (num > 10 ? num / 10 : num).toFixed(1);
    }
    if (typeof anime.rating === 'string' && /^\d+(\.\d+)?(\/10)?$/.test(anime.rating.trim())) {
      return Number(anime.rating.replace('/10', '').trim()).toFixed(1);
    }
    return null;
  }, [anime]);

  // Rating Source (MAL vs IMDb vs DONGHUA)
  const ratingSource = useMemo(() => {
    if (anime.ratingSource) return anime.ratingSource;
    if (anime.scoreSource) return anime.scoreSource;

    // Donghua Source
    if (
      anime.source === 'donghua' ||
      (typeof anime.type === 'string' && anime.type.toLowerCase() === 'donghua') ||
      (typeof anime.targetRoute === 'string' && anime.targetRoute.includes('/donghua-watch/'))
    ) {
      return 'DONGHUA';
    }

    // Cinema / Movie / Drama / Western Series Source (TMDB / IMDb)
    const rawType = (typeof anime.type === 'string' ? anime.type.toLowerCase() : '');
    const rawCategory = (typeof anime.category === 'string' ? anime.category.toLowerCase() : '');
    const targetRoute = (typeof anime.targetRoute === 'string' ? anime.targetRoute : '');

    const isLiveActionOrFlix = 
      Boolean(anime.imdbScore) ||
      anime.source === 'universal' ||
      anime.source === 'drama' ||
      anime.source === 'flix' ||
      anime.source === 'cinema' ||
      anime.source === 'tmdb' ||
      anime.source === 'imdb' ||
      targetRoute.includes('/movies-watch/') ||
      targetRoute.includes('/drama-watch/') ||
      targetRoute.includes('/series-watch/') ||
      rawCategory === 'movie' ||
      rawCategory === 'drama' ||
      rawCategory === 'series' ||
      ['drama', 'k-drama', 'c-drama', 'j-drama', 'thai drama', 'turkish drama', 'series', 'tv show'].includes(rawType) ||
      (rawType === 'movie' && (anime.country === 'Hollywood' || anime.country === 'Bollywood' || anime.source === 'universal' || targetRoute.includes('/movies-watch/')));

    if (isLiveActionOrFlix) {
      return 'IMDb';
    }

    return 'MAL';
  }, [anime]);

  // Lazily fetch full anime metadata on hover only for desktop popup
  const fetchDataNow = async () => {
    if (qtip || loading || isHindi) return;
    setLoading(true);
    try {
      const isDonghua = normalized.targetRoute.includes('/donghua-watch/') || normalized.type.toLowerCase() === 'donghua';
      
      let data: any;
      if (isDonghua) {
        data = await import('@/lib/dpi').then(m => m.dpi.bridge.getSmartDetails(anime.id)).catch(() => null);
      } else {
        data = await AnimeService.getAnimeInfo(anime.id).catch(() => null);
      }

      if (data) {
        if (isDonghua) {
          setQtip({
            jname: data.nativeTitle || normalized.displayTitle,
            rating: data.rating || "",
            quality: "HD",
            description: data.description || "Description unavailable.",
            genres: data.genres || [],
            studios: data.studios?.join(', ') || "",
            duration: "Unknown",
            synonyms: data.alternativeTitles?.join(', ') || "",
            season: "DONGHUA",
            isAdult: data.isAdult,
            totalEpisodes: data.totalEpisodes || normalized.totalEp
          });
        } else {
          const statsRating = data.stats?.rating || "";
          const isAdult = data.info?.genres?.includes('Hentai') || ["Rx", "RX", "Hentai"].some((t: string) => statsRating.toUpperCase().includes(t));

          setQtip({
            jname: data.jname || data.info?.japanese || normalized.displayTitle,
            rating: data.stats?.rating || normalized.rawRating,
            quality: data.stats?.quality || "HD",
            description: data.description || data.info?.description || "Description unavailable.",
            genres: data.info?.genres || [],
            studios: data.info?.studios?.join(', ') || "",
            duration: data.stats?.duration || "",
            synonyms: data.info?.synonyms || "",
            season: data.info?.premiered || "ANIME",
            isAdult: isAdult || normalized.isAdult,
            totalEpisodes: data.stats?.episodes?.sub || data.totalEpisodes || normalized.totalEp
          });
        }
      } else {
        setQtip({
          jname: normalized.displayTitle,
          rating: normalized.rawRating || "?",
          quality: "HD",
          description: "Information currently being updated.",
          genres: [],
          studios: "Unknown",
          duration: "",
          synonyms: "",
          season: "ANIME",
          isAdult: normalized.isAdult,
          totalEpisodes: normalized.totalEp
        });
      }
    } catch {
      setQtip({
        jname: normalized.displayTitle,
        rating: normalized.rawRating || "?",
        quality: "HD",
        description: "Details unavailable.",
        genres: [],
        studios: "Unknown",
        duration: "",
        synonyms: "",
        season: "UNKNOWN",
        isAdult: normalized.isAdult,
        totalEpisodes: normalized.totalEp
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHovered && !qtip && !loading) {
      fetchTimeout.current = setTimeout(fetchDataNow, 200); 
    }
    return () => { 
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current); 
    };
  }, [isHovered, qtip, loading]);

  // Combined Rating Data from Card or QTip
  const currentRatingData = useMemo(() => {
    if (!qtip) return { rating: normalized.rawRating, isAdult: normalized.isAdult };

    const initialUpper = normalized.rawRating ? normalized.rawRating.toUpperCase() : "";
    const hasStrongInitial = 
      normalized.isAdult || 
      initialUpper.includes("18") || 
      initialUpper.includes("RX") || 
      initialUpper.includes("HENTAI") ||
      initialUpper.includes("R+");

    if (hasStrongInitial) {
      return { rating: normalized.rawRating, isAdult: normalized.isAdult };
    }

    return { rating: qtip.rating || normalized.rawRating, isAdult: qtip.isAdult || normalized.isAdult };
  }, [qtip, normalized]);

  // Helper: Age Tag (18+, R-17, PG-13, PG, etc.)
  const AgeTag = ({ adult, rating }: { adult: boolean, rating?: string }) => {
    const r = rating ? rating.toUpperCase().trim() : "";
    let label = "PG-13"; 
    let isRed = false;

    if (adult || r.includes("RX") || r.includes("HENTAI") || r.includes("R+") || r.includes("18") || r.includes("TV-MA") || r.includes("SEX") || r.includes("MATURE") || r.includes("NC-17")) {
      label = (r.includes("RX") || r.includes("HENTAI")) ? "Rx" : "18+";
      isRed = true;
    } 
    else if (r.includes("17") || r.includes("R-17") || r.includes("R17") || r === "R" || r.startsWith("R")) {
      label = "R-17";
      isRed = true;
    }
    else if (r.includes("13") || r.includes("PG-13") || r.includes("TEEN")) {
      label = "PG-13";
      isRed = false;
    }
    else if (r.includes("PG")) {
      label = "PG";
      isRed = false;
    }
    else if (r === "G" || r.includes("ALL")) {
      label = "G";
      isRed = false;
    }
    else if (rating && rating !== "?" && rating !== "Unknown" && !/^\d+(\.\d+)?$/.test(rating)) {
      label = rating.replace("PG-", "PG ").replace("R-", "").trim();
      isRed = false;
    }

    return (
      <span className={cn(
        "h-5 px-1.5 sm:px-2 flex items-center justify-center rounded-[6px] border text-[8.5px] sm:text-[9px] font-mono font-bold shadow-sm backdrop-blur-md tracking-wider select-none shrink-0",
        isRed 
          ? "bg-rose-600/90 border-rose-500/50 text-white shadow-[0_0_10px_rgba(225,29,72,0.35)]" 
          : "bg-black/65 border-white/10 text-zinc-300"
      )}>
        {label}
      </span>
    );
  };

  const handleCardClick = () => {
    playGummyPop();
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    router.push(normalized.targetRoute);
  };

  return (
    <HoverCard
      openDelay={140}
      closeDelay={100}
      onOpenChange={(open) => {
        setIsHovered(open);
        if (open && !qtip) fetchDataNow();
      }}
    >
      <HoverCardTrigger asChild>
        <div 
          ref={cardRef} 
          className={cn(
            "relative w-full group z-0 hover:z-50 touch-manipulation select-none cursor-pointer",
            aspectRatio || "aspect-[2/3]",
            className
          )}
        >
          <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#070b14] border border-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.06)] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.9)] hover:border-primary-500/40 hover:-translate-y-1 will-change-transform">
            <Link 
              href={normalized.targetRoute} 
              onClick={handleCardClick}
              className="block w-full h-full relative"
            >
              {/* Cover Poster Image with smooth hover zoom */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img
                  src={normalized.displayImage}
                  alt={normalized.displayTitle}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src.startsWith('/api/proxy')) {
                      e.currentTarget.src = '/images/no-poster.png';
                    } else if (e.currentTarget.src.startsWith('http')) {
                      e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(e.currentTarget.src)}`;
                    } else {
                      e.currentTarget.src = '/images/no-poster.png';
                    }
                  }}
                  className="w-full h-full object-cover transform-gpu transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
                />
                {/* Deep Sleek Gradient Overlays for optimal readability and art clarity */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent opacity-40 pointer-events-none" />
              </div>

              {/* Top-Left: Rank Badge (if provided) + Media Format Badge */}
              <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
                {rank !== undefined && rank !== null && (
                  <span
                    className={cn(
                      "font-lemon font-black italic tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] pr-0.5 select-none",
                      "text-base sm:text-lg md:text-xl",
                      Number(rank) === 1
                        ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]"
                        : Number(rank) === 2
                        ? "text-slate-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                        : Number(rank) === 3
                        ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        : "text-zinc-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                    )}
                  >
                    #{rank}
                  </span>
                )}
                {!hideType && normalized.type && (
                  <span className="h-5 px-1.5 sm:px-2 flex items-center justify-center rounded-[6px] bg-black/65 border border-white/10 text-white text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                    {normalized.type}
                  </span>
                )}
              </div>

              {/* Top-Right: Rating Badge & AgeTag (Miruro Minimal Realignment) */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 pointer-events-auto">
                {/* Branded Source Rating Badge (e.g. MAL 8.4) */}
                {!hideRating && score && (
                  <span className="h-[22px] px-2.5 flex items-center gap-1.5 rounded-[6px] bg-black/80 border border-[#2e51a2]/40 text-white font-mono backdrop-blur-md shadow-sm select-none pointer-events-none">
                    <span className="text-[#4e85ff] font-black text-[11px] sm:text-[11.5px] tracking-wider">{ratingSource}</span>
                    <span className="font-bold text-zinc-100 text-[11px] sm:text-[11.5px]">{score}</span>
                  </span>
                )}

                {/* Age Rating Tag */}
                <AgeTag adult={currentRatingData.isAdult} rating={currentRatingData.rating} />
              </div>

              {/* Center Hover Action: Sleek Glassmorphic Play Capsule */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-primary-600/95 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_24px_rgba(220,38,38,0.55)] transition-transform duration-200 group-hover:scale-105">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Bottom Content Area */}
              <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 z-20 flex flex-col gap-1.5 justify-end pointer-events-none">
                <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug line-clamp-2 drop-shadow-md group-hover:text-primary-400 transition-colors duration-200">
                  {normalized.displayTitle}
                </h3>

                <div className="flex items-center justify-between gap-1 w-full overflow-hidden text-[9px]">
                  {/* Left: Audio/Episode Info (Miruro Clean Minimal - Unboxed HINDI) */}
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    {normalized.isHindiMedia ? (
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 text-[9px] uppercase tracking-wide">
                        <Mic size={9.5} className="text-amber-400 shrink-0" />
                        <span>HINDI</span>
                        {(normalized.dubCount || anime.episode) ? (
                          <span className="text-zinc-200 ml-0.5">EP {normalized.dubCount || anime.episode}</span>
                        ) : null}
                      </div>
                    ) : (normalized.subCount || normalized.dubCount) ? (
                      <div className="flex items-center gap-1 text-[9px] font-bold">
                        {Number(normalized.subCount) > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-white/10 text-white">
                            <Captions size={9.5} className="text-zinc-300 shrink-0" />
                            <span>{normalized.subCount}</span>
                          </span>
                        )}
                        {Number(normalized.dubCount) > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-white/10 text-zinc-300">
                            <Mic size={8.5} className="text-zinc-300 shrink-0" />
                            <span>{normalized.dubCount}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-medium">HD</span>
                    )}
                  </div>

                  {/* Right: Estimated Total Episodes to Premier (Anti-Container) */}
                  <div className="flex items-center gap-1 text-[9px] font-mono font-medium text-zinc-300 shrink-0">
                    <ListVideo size={9.5} className="text-zinc-400 shrink-0" />
                    <span>{(normalized.totalEp || (qtip as any)?.totalEpisodes) ? `${normalized.totalEp || (qtip as any)?.totalEpisodes} EPS` : (normalized.releaseYear || 'ANIME')}</span>
                  </div>
                </div>

                {/* Optional Progress Bar */}
                {progress > 0 && (
                  <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden mt-0.5">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
                      className="h-full bg-primary-500 shadow-[0_0_8px_rgba(220,38,38,0.8)]" 
                    />
                  </div>
                )}
              </div>
            </Link>

          </div>
        </div>
      </HoverCardTrigger>

      {/* Desktop Q-Tip Popup (Hover) */}
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={14}
        avoidCollisions={true}
        className="hidden md:block w-[300px] lg:w-[330px] p-0 bg-transparent border-0 shadow-none outline-none z-[9999]"
      >
        <div className="bg-[#090d16]/95 backdrop-blur-2xl border border-white/10 border-t-primary-500/40 rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] relative overflow-hidden">
          {/* Title & Japanese Subtitle */}
          <div className="mb-2.5">
            <Link href={normalized.targetRoute}>
              <h4 className="text-white font-black text-base lg:text-lg leading-tight mb-1 cursor-pointer hover:text-primary-400 transition-colors line-clamp-2">
                {normalized.displayTitle}
              </h4>
            </Link>
            {qtip?.jname && (
              <p className="text-primary-400/80 text-xs font-semibold italic line-clamp-1">{qtip.jname}</p>
            )}
          </div>

          {/* Metric Chips Bar */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {/* Branded Source Rating */}
            {score && (
              <div className="flex items-center gap-1.5 font-mono select-none">
                <span className="text-[#4e85ff] text-[11px] font-black tracking-wider uppercase">{ratingSource}</span>
                <span className="text-zinc-100 font-bold text-[12px]">{score}</span>
              </div>
            )}

            {/* Age Tag */}
            <AgeTag adult={currentRatingData.isAdult} rating={currentRatingData.rating} />

            {/* Quality Badge */}
            <span className="px-1.5 py-0.5 rounded-[6px] bg-white/5 border border-white/10 text-zinc-300 text-[9px] font-bold font-mono">
              {qtip?.quality || "HD"}
            </span>

            {/* Season or Format */}
            <span className="ml-auto text-zinc-400 font-mono text-[9px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-[6px] border border-white/5 truncate max-w-[110px]">
              {qtip?.season || normalized.type}
            </span>
          </div>

          {/* Synopsis Paragraph */}
          <div className="mb-3 min-h-[48px]">
            {loading || !qtip ? (
              <div className="space-y-1.5 py-1">
                <div className="h-2 bg-white/10 rounded w-full" />
                <div className="h-2 bg-white/10 rounded w-5/6" />
                <div className="h-2 bg-white/10 rounded w-4/6" />
              </div>
            ) : (
              <p className="text-[11.5px] text-zinc-300/90 leading-relaxed line-clamp-3">
                {qtip.description}
              </p>
            )}
          </div>

          {/* Genres & Studios */}
          <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/10 mb-3.5">
            {(qtip?.genres || []).slice(0, 3).map((g: string) => (
              <span key={g} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                {g}
              </span>
            ))}
            {qtip?.studios && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-950/40 border border-primary-500/20 text-primary-300 ml-auto line-clamp-1 max-w-[120px]">
                {qtip.studios}
              </span>
            )}
          </div>

          {/* Watch Now CTA */}
          <div>
            <Link 
              href={normalized.targetRoute}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-red-600 hover:from-primary-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary-900/30 active:scale-98 transition-all"
            >
              <Play size={13} fill="currentColor" /> Watch Now
            </Link>
          </div>

          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-600/15 blur-[50px] rounded-full pointer-events-none" />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

const AnimeCard = memo(AnimeCardComponent);
export default AnimeCard;