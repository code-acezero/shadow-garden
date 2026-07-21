"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Server as ServerIcon, Play, Download, AlertTriangle, Layers,
  Check, ChevronDown, Grid, LayoutGrid, List, Star, Film, Clapperboard, X,
  SkipBack, SkipForward, Repeat1, Globe
} from 'lucide-react';
import { omni, MovieDetail } from '@/lib/omni';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import WatchListButton from '@/components/Watch/WatchListButton';
import SafeEmbed from '@/components/SafeEmbed';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ShadowComments from '@/components/Comments/ShadowComments';
import { toast } from 'sonner';

// ── Star Rating (same as anime watch page) ───────────────────────────────────

const retryOp = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  try { return await fn(); } catch (e) {
    if (retries > 0) return retryOp(fn, retries - 1);
    throw e;
  }
};

const StarRating = ({ movieId, initialRating = 0 }: { movieId: string; initialRating?: string | number }) => {
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRatings = async () => {
      if (!supabase) return;
      try {
        const allRatings = await retryOp(async () => {
          const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('anime_id', movieId);
          return data;
        });
        if (allRatings && allRatings.length > 0) {
          const sum = allRatings.reduce((acc: any, curr: any) => acc + (curr.rating ?? 0), 0);
          setAvgRating(sum / allRatings.length);
        } else {
          setAvgRating(typeof initialRating === 'string' ? parseFloat(initialRating) : (initialRating as number) || 0);
        }
        if (user) {
          const myRating = await retryOp(async () => {
            const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('user_id', user.id).eq('anime_id', movieId).single();
            return data;
          });
          if (myRating && (myRating as any).rating != null) setUserRating((myRating as any).rating);
        }
      } catch (e) {}
    };
    fetchRatings();
  }, [user, movieId, initialRating]);

  const handleRate = async (score: number) => {
    if (!user) { toast.error("Shadow Agents only."); return; }
    setUserRating(score);
    try {
      await (supabase!.from('anime_ratings') as any).upsert({ user_id: user.id, anime_id: movieId, rating: score }, { onConflict: 'user_id, anime_id' });
      toast.success(`Rated ${score} stars!`);
    } catch (err) {}
  };

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest text-right">{userRating > 0 ? "Your Rating" : "Rate This"}</span>
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">(AVG: {isNaN(avgRating) ? '?' : avgRating.toFixed(1)})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => handleRate(star)}>
              <Star size={14} className={cn("transition-all duration-300", star <= (hover || userRating) ? "fill-emerald-500 text-emerald-500" : "text-zinc-700")} />
            </button>
          ))}
        </div>
        <div className="flex flex-col items-end leading-none">
          <span className="text-[12px] text-white font-black">{userRating > 0 ? userRating : "?"}<span className="text-zinc-500 text-[10px]">/5</span></span>
        </div>
      </div>
    </div>
  );
};

// ── Trailer Viewer ────────────────────────────────────────────────────────────

const TrailerViewer = ({ title, imdbId }: { title: string; imdbId?: string }) => {
  const [open, setOpen] = useState(false);
  // Use YouTube embed search as fallback — no API key needed
  const searchQuery = encodeURIComponent(`${title} official trailer`);
  const trailerUrl = `https://www.youtube.com/embed?listType=search&list=${searchQuery}`;

  if (!imdbId && !title) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900/50 hover:text-white transition-all shadow-md"
      >
        <Clapperboard size={13} />
        Watch Trailer
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/30" onClick={e => e.stopPropagation()}>
            <iframe
              src={trailerUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={`${title} Trailer`}
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white z-10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ── Loader ────────────────────────────────────────────────────────────────────

const PremiumLoader = memo(({ text = "INITIALIZING..." }: { text?: string }) => (
  <div className="w-full min-h-[500px] flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#020617_100%)] opacity-80" />
    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10" />
    <h2 className="text-xl text-emerald-400 animate-pulse tracking-[0.3em] font-black z-10 font-lemon">{text}</h2>
  </div>
));
PremiumLoader.displayName = "PremiumLoader";

type EpViewMode = 'compact' | 'grid' | 'list';

// ── Main Component ────────────────────────────────────────────────────────────

export default function WatchClient() {
  const params = useParams();
  const slug = params.id as string;

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [activeServerUrl, setActiveServerUrl] = useState<string | null>(null);
  const [activeServerName, setActiveServerName] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<number>(1);
  const [epViewMode, setEpViewMode] = useState<EpViewMode>('compact');
  const [autoNext, setAutoNext] = useState(true);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string>('All');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setIsLoadingInfo(true);
      const data = await omni.movies.getDetail(slug);
      if (data) {
        // Fallback: If related movies are empty, fetch from category or Hollywood catalogue
        if (!data.related || data.related.length === 0) {
          try {
            const genreSlug = data.genres?.[0]
              ? data.genres[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
              : 'films';
            const catData = await omni.movies.getCategory(genreSlug, 1).catch(() => null);
            if (catData && catData.items && catData.items.length > 0) {
              data.related = catData.items.filter((item: any) => item.id !== data.id && item.slug !== data.slug).slice(0, 10);
            } else {
              const holliData = await omni.movies.getCategory('films', 1).catch(() => null);
              if (holliData && holliData.items) {
                data.related = holliData.items.filter((item: any) => item.id !== data.id && item.slug !== data.slug).slice(0, 10);
              }
            }
          } catch {}
        }

        setMovie(data);
        if (data.languages && data.languages.length > 0) {
          setActiveLanguage(data.languages[0]);
        }
        if (data.streams && data.streams.length > 0) {
          setActiveServerUrl(data.streams[0].url);
          setActiveServerName(data.streams[0].name);
        }
      }
      setIsLoadingInfo(false);
    })();
  }, [slug]);

  const getUpdatedServerUrl = useCallback((baseUrl: string, seasonNum: number, epNum: number) => {
    if (baseUrl.includes('episode=')) {
      return baseUrl.replace(/episode=\d+/, `episode=${epNum}`);
    }
    if (baseUrl.includes('e=')) {
      return baseUrl.replace(/e=\d+/, `e=${epNum}`);
    }
    return baseUrl.replace(/-(\d+)-(\d+)$/, `-${seasonNum}-${epNum}`);
  }, []);

  // When season or episode changes, update the URL for the current server
  const handleEpisodeClick = useCallback((seasonNum: number, epNum: number, serverName: string | null) => {
    if (!movie?.seasons) return;
    const season = movie.seasons.find(s => s.seasonNumber === seasonNum);
    if (!season) return;
    const src = season.sources.find(s => s.name === (serverName || '')) || season.sources[0];
    if (!src) return;
    
    const updatedUrl = getUpdatedServerUrl(src.url, seasonNum, epNum);
    setActiveSeason(seasonNum);
    setActiveEpisode(epNum);
    setActiveServerUrl(updatedUrl);
    setActiveServerName(src.name);
    setAutoNextCountdown(null); // cancel any pending auto-next
  }, [movie, getUpdatedServerUrl]);

  // Prev episode
  const goToPrevEpisode = useCallback(() => {
    if (!movie?.seasons) return;
    const season = movie.seasons.find(s => s.seasonNumber === activeSeason);
    const episodes = season?.episodes || [];
    const idx = episodes.findIndex(e => e.episodeNumber === activeEpisode);
    if (idx > 0) handleEpisodeClick(activeSeason, episodes[idx - 1].episodeNumber, activeServerName);
  }, [movie, activeSeason, activeEpisode, activeServerName, handleEpisodeClick]);

  // Next episode (advances season if at end)
  const goToNextEpisode = useCallback(() => {
    if (!movie?.seasons) return;
    const season = movie.seasons.find(s => s.seasonNumber === activeSeason);
    const episodes = season?.episodes || [];
    const idx = episodes.findIndex(e => e.episodeNumber === activeEpisode);
    if (idx !== -1 && idx < episodes.length - 1) {
      handleEpisodeClick(activeSeason, episodes[idx + 1].episodeNumber, activeServerName);
    } else {
      const nextSeason = movie.seasons.find(s => s.seasonNumber === activeSeason + 1);
      if (nextSeason?.episodes && nextSeason.episodes.length > 0) {
        handleEpisodeClick(nextSeason.seasonNumber, nextSeason.episodes[0].episodeNumber, activeServerName);
      }
    }
  }, [movie, activeSeason, activeEpisode, activeServerName, handleEpisodeClick]);

  // Auto-next: 5s countdown after episode switch
  useEffect(() => {
    if (autoNextCountdown === null) return;
    if (autoNextCountdown <= 0) {
      setAutoNextCountdown(null);
      goToNextEpisode();
      return;
    }
    const t = setTimeout(() => setAutoNextCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [autoNextCountdown, goToNextEpisode]);

  if (isLoadingInfo) return <PremiumLoader text="LOADING THEATER" />;
  if (!movie) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center text-red-500 bg-[#020617]">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-xl font-black">Content Not Found</h2>
      </div>
    );
  }

  const isSeries = !!(movie.seasons && movie.seasons.length > 0);
  const coverImg = movie.cover || movie.image;

  // For the episodes panel, build a list of episodes for the active season
  const currentSeasonData = isSeries ? movie.seasons!.find(s => s.seasonNumber === activeSeason) : null;
  
  interface LocalEpisode {
    episodeNumber: number;
    title: string;
    image?: string | null;
    summary?: string | null;
    airdate?: string | null;
  }

  const episodesList: LocalEpisode[] = currentSeasonData?.episodes && currentSeasonData.episodes.length > 0
    ? currentSeasonData.episodes
    : [];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col pb-20 md:pb-0 overflow-x-hidden selection:bg-emerald-500/30 pt-[calc(env(safe-area-inset-top)+64px)] md:pt-[calc(env(safe-area-inset-top)+72px)]">

      {/* Background glow */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-emerald-900/10 blur-[150px] -z-10 pointer-events-none" />
      {/* Cover image blurred backdrop */}
      {coverImg && (
        <div
          className="fixed top-0 left-0 w-full h-[40vh] -z-10 pointer-events-none opacity-20"
          style={{ backgroundImage: `url(${coverImg})`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'blur(40px)' }}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="w-full flex flex-col items-center relative z-40 px-3 md:px-6 mt-0"
      >
        <div className="w-full max-w-[1500px] flex flex-col gap-6 pb-12">

          {/* ── ROW 1: Player & Episodes/Suggestions ── */}
          <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            
            {/* Player & Controls Wrapper */}
            <div className={cn(
              "w-full flex flex-col gap-4",
              (isSeries || (movie.related && movie.related.length > 0)) ? "xl:col-span-8" : "xl:col-span-12"
            )}>
              {/* Player */}
              <div className="w-full bg-black rounded-[24px] overflow-hidden border border-emerald-900/30 shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
                <div className="w-full aspect-video relative">
                  {activeServerUrl ? (
                    <SafeEmbed url={activeServerUrl} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0f1c] text-emerald-900/40 gap-4">
                      <Play size={60} className="opacity-20" />
                      <p className="font-bold tracking-widest text-xs">NO STREAMS AVAILABLE</p>
                    </div>
                  )}

                  {/* Auto-Next Countdown Overlay */}
                  {isSeries && autoNextCountdown !== null && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-end justify-between gap-4 z-30">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Up Next</span>
                        <span className="text-white text-xs font-bold">
                          {(() => {
                            const season = movie.seasons?.find(s => s.seasonNumber === activeSeason);
                            const episodes = season?.episodes || [];
                            const idx = episodes.findIndex(e => e.episodeNumber === activeEpisode);
                            const next = episodes[idx + 1];
                            return next ? `Ep ${next.episodeNumber}: ${next.title || `Episode ${next.episodeNumber}`}` : 'Next Episode';
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setAutoNextCountdown(null)}
                          className="h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { setAutoNextCountdown(null); goToNextEpisode(); }}
                          className="h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                        >
                          <SkipForward size={11} />
                          Play Now ({autoNextCountdown}s)
                        </button>
                      </div>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-1000"
                          style={{ width: `${((5 - autoNextCountdown) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex w-full bg-[#0a0f1c] border border-emerald-900/30 rounded-[20px] shadow-lg p-2.5 sm:px-4 sm:py-3 items-center justify-between gap-2.5 flex-row">
                <div className="flex flex-1 sm:flex-initial items-center gap-1.5 sm:gap-2 min-w-0">
                  {/* Server selector */}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex-1 sm:flex-initial h-8 gap-1.5 text-[10px] font-black text-emerald-300 hover:text-white uppercase rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2.5 sm:px-3 min-w-0">
                        <ServerIcon size={11} className="shrink-0" />
                        <span className="truncate">{activeServerName || 'Server'}</span>
                        <ChevronDown size={10} className="shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-[#020617] border border-emerald-900/30 rounded-2xl shadow-2xl z-[80] p-1.5 min-w-[150px]">
                      {movie.streams
                        .filter((server: any) => activeLanguage === 'All' || !server.lang || server.lang === activeLanguage)
                        .map((server: any) => {
                        const serverUrl = isSeries
                          ? (() => {
                              const sd = movie.seasons!.find(s => s.seasonNumber === activeSeason);
                              const match = sd?.sources.find(src => src.name === server.name);
                              return match ? getUpdatedServerUrl(match.url, activeSeason, activeEpisode) : server.url;
                            })()
                          : server.url;
                        return (
                          <DropdownMenuItem key={server.name} onClick={() => { setActiveServerUrl(serverUrl); setActiveServerName(server.name); }}
                            className={cn("cursor-pointer px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-all",
                              activeServerName === server.name ? "bg-emerald-500 text-black" : "text-emerald-100/60 hover:text-emerald-300")}>
                            {server.name} {server.lang ? `(${server.lang})` : ''}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Audio Language Selector (Right side of Server selector) */}
                  {movie.languages && movie.languages.length > 0 && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex-1 sm:flex-initial h-8 gap-1.5 text-[10px] font-black text-emerald-300 hover:text-white uppercase rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 sm:px-3 min-w-0">
                          <Globe size={11} className="shrink-0 text-emerald-400" />
                          <span className="truncate">{activeLanguage}</span>
                          <ChevronDown size={10} className="shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-[#020617] border border-emerald-900/30 rounded-2xl shadow-2xl z-[80] p-1.5 min-w-[130px]">
                        <DropdownMenuItem
                          onClick={() => setActiveLanguage('All')}
                          className={cn("cursor-pointer px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-all",
                            activeLanguage === 'All' ? "bg-emerald-500 text-black" : "text-emerald-100/60 hover:text-emerald-300")}
                        >
                          All Audio
                        </DropdownMenuItem>
                        {movie.languages.map((lang) => (
                          <DropdownMenuItem
                            key={lang}
                            onClick={() => {
                              setActiveLanguage(lang);
                              // Auto switch to first stream matching language
                              const match = movie.streams.find((s: any) => s.lang === lang);
                              if (match && match.url) {
                                setActiveServerUrl(match.url);
                                setActiveServerName(match.name);
                              }
                            }}
                            className={cn("cursor-pointer px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-all",
                              activeLanguage === lang ? "bg-emerald-500 text-black" : "text-emerald-100/60 hover:text-emerald-300")}
                          >
                            {lang} Audio
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Season picker */}
                  {isSeries && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex-1 sm:flex-initial h-8 gap-1 text-[10px] font-black text-emerald-300 hover:text-white uppercase rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2 sm:px-3 min-w-0">
                          <span className="truncate">S{activeSeason}</span> <ChevronDown size={10} className="shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-[#020617] border border-emerald-900/30 rounded-2xl shadow-2xl z-[80] p-1.5 min-w-[130px]">
                        {movie.seasons!.map((season) => (
                          <DropdownMenuItem key={season.seasonNumber}
                            onClick={() => handleEpisodeClick(season.seasonNumber, 1, activeServerName)}
                            className={cn("cursor-pointer px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold mb-0.5 transition-all",
                              activeSeason === season.seasonNumber ? "bg-emerald-500 text-black" : "text-emerald-100/60 hover:text-emerald-300")}>
                            Season {season.seasonNumber}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex flex-1 sm:flex-initial items-center gap-1.5 sm:gap-2 justify-end min-w-0">

                  {/* Prev / Next / AutoNext (Series only) */}
                  {isSeries && episodesList.length > 0 && (() => {
                    const season = movie.seasons?.find(s => s.seasonNumber === activeSeason);
                    const episodes = season?.episodes || [];
                    const currentIdx = episodes.findIndex(e => e.episodeNumber === activeEpisode);
                    const hasPrev = currentIdx > 0;
                    const hasNext = currentIdx !== -1 && currentIdx < episodes.length - 1;
                    return (
                      <>
                        <button
                          onClick={goToPrevEpisode}
                          disabled={!hasPrev}
                          title="Previous Episode"
                          className="h-8 w-8 flex items-center justify-center rounded-full border border-emerald-900/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-500/20 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                        >
                          <SkipBack size={13} />
                        </button>
                        <button
                          onClick={goToNextEpisode}
                          disabled={!hasNext}
                          title="Next Episode"
                          className="h-8 w-8 flex items-center justify-center rounded-full border border-emerald-900/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-500/20 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                        >
                          <SkipForward size={13} />
                        </button>
                        <button
                          onClick={() => setAutoNext(v => !v)}
                          title={autoNext ? 'Auto-Next: ON' : 'Auto-Next: OFF'}
                          className={cn(
                            "h-8 px-2 flex items-center gap-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                            autoNext
                              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                              : "border-emerald-900/40 bg-emerald-950/20 text-zinc-500"
                          )}
                        >
                          <Repeat1 size={11} />
                          <span className="hidden sm:inline">Auto</span>
                        </button>
                      </>
                    );
                  })()}

                  <Link href={`/download/movie/${movie.id || slug}${isSeries ? `?season=${activeSeason}&ep=${activeEpisode}` : ''}`}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2 sm:px-3 h-8 rounded-full border border-emerald-500/20 bg-[#0a0f1c] hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest transition-all hover:text-white whitespace-nowrap min-w-0">
                    <Download size={11} className="shrink-0" /> <span className="sm:inline hidden">Download</span>
                  </Link>
                  <div className="flex-1 sm:flex-initial flex min-w-0 justify-end">
                    <WatchListButton animeId={movie.id} animeTitle={movie.title} animeImage={movie.image} />
                  </div>
                </div>
              </div>

              {/* Mobile Episodes Panel (Series Only) */}
              {isSeries && (
                <div className="xl:hidden w-full">
                  <div className="w-full h-auto bg-[#0a0f1c] rounded-[28px] border border-emerald-900/30 overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-5 bg-white/5 border-b border-emerald-900/30 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <Layers size={16} className="text-emerald-500" />
                        <h3 className="font-black text-white text-xs font-lemon tracking-widest uppercase">
                          S{activeSeason} Episodes
                        </h3>
                        <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] px-2 h-4 rounded-full">
                          {episodesList.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-0.5 bg-black/50 p-1 rounded-lg border border-emerald-900/30">
                        {(['compact', 'grid', 'list'] as EpViewMode[]).map((mode) => (
                          <button key={mode} onClick={() => setEpViewMode(mode)}
                            className={cn("p-1.5 rounded-md transition-all", epViewMode === mode ? "bg-emerald-900/60 text-emerald-300" : "text-zinc-500 hover:text-zinc-300")}>
                            {mode === 'compact' ? <Grid size={12} /> : mode === 'grid' ? <LayoutGrid size={12} /> : <List size={12} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-auto p-3 no-scrollbar max-h-[300px] overflow-y-auto">
                      <div className={cn(
                        "grid gap-1.5 transition-all",
                        epViewMode === 'grid' ? 'grid-cols-5' :
                        epViewMode === 'compact' ? 'grid-cols-8' :
                        'grid-cols-1'
                      )}>
                        {episodesList.map((ep) => {
                          const epNum = ep.episodeNumber;
                          const isActive = activeEpisode === epNum && true;
                          if (epViewMode === 'list') {
                            return (
                              <button key={epNum} onClick={() => handleEpisodeClick(activeSeason, epNum, activeServerName)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all text-[10px] font-bold",
                                  isActive ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                    : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                )}>
                                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
                                  isActive ? "bg-emerald-500 text-black" : "bg-white/10 text-zinc-300"
                                )}>{epNum}</span>
                                <span className="truncate">{ep.title || `Episode ${epNum}`}</span>
                              </button>
                            );
                          }
                          return (
                            <button key={epNum} onClick={() => handleEpisodeClick(activeSeason, epNum, activeServerName)}
                              className={cn(
                                "rounded-xl flex items-center justify-center font-black transition-all border text-[9px]",
                                epViewMode === 'grid' ? "aspect-square" : "h-7",
                                isActive
                                  ? "bg-emerald-500 border-emerald-400 text-black shadow-md"
                                  : "bg-white/5 border-white/5 text-zinc-400 hover:bg-emerald-900/30 hover:border-emerald-700/50 hover:text-emerald-300"
                              )}>
                              {epNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Right Panel: Episodes for Series / Suggestions for Movies */}
            {isSeries ? (
              <div className="xl:col-span-4 w-full flex flex-col">
                <div className="w-full h-full bg-[#0a0f1c] rounded-[28px] border border-emerald-900/30 overflow-hidden flex flex-col shadow-2xl xl:max-h-[calc(100%)]">
                  <div className="p-5 bg-white/5 border-b border-emerald-900/30 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-emerald-500" />
                      <h3 className="font-black text-white text-xs font-lemon tracking-widest uppercase">
                        S{activeSeason} Episodes
                      </h3>
                      <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] px-2 h-4 rounded-full">
                        {episodesList.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-0.5 bg-black/50 p-1 rounded-lg border border-emerald-900/30">
                      {(['compact', 'grid', 'list'] as EpViewMode[]).map((mode) => (
                        <button key={mode} onClick={() => setEpViewMode(mode)}
                          className={cn("p-1.5 rounded-md transition-all", epViewMode === mode ? "bg-emerald-900/60 text-emerald-300" : "text-zinc-500 hover:text-zinc-300")}>
                          {mode === 'compact' ? <Grid size={12} /> : mode === 'grid' ? <LayoutGrid size={12} /> : <List size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="xl:flex-1 xl:overflow-y-auto h-auto p-3 no-scrollbar">
                    <div className={cn(
                      "grid gap-1.5 transition-all",
                      epViewMode === 'grid' ? 'grid-cols-5' :
                      epViewMode === 'compact' ? 'grid-cols-8' :
                      'grid-cols-1'
                    )}>
                      {episodesList.map((ep) => {
                        const epNum = ep.episodeNumber;
                        const isActive = activeEpisode === epNum && true;
                        if (epViewMode === 'list') {
                          return (
                            <button key={epNum} onClick={() => handleEpisodeClick(activeSeason, epNum, activeServerName)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all text-[10px] font-bold",
                                isActive ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                  : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                              )}>
                              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
                                isActive ? "bg-emerald-500 text-black" : "bg-white/10 text-zinc-300"
                              )}>{epNum}</span>
                              <span className="truncate">{ep.title || `Episode ${epNum}`}</span>
                            </button>
                          );
                        }
                        return (
                          <button key={epNum} onClick={() => handleEpisodeClick(activeSeason, epNum, activeServerName)}
                            className={cn(
                              "rounded-xl flex items-center justify-center font-black transition-all border text-[9px]",
                              epViewMode === 'grid' ? "aspect-square" : "h-7",
                              isActive
                                ? "bg-emerald-500 border-emerald-400 text-black shadow-md"
                                : "bg-white/5 border-white/5 text-zinc-400 hover:bg-emerald-900/30 hover:border-emerald-700/50 hover:text-emerald-300"
                            )}>
                            {epNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              movie.related && movie.related.length > 0 && (
                <div className="xl:col-span-4 w-full flex flex-col">
                  <div className="w-full h-full bg-[#0a0f1c] rounded-[28px] border border-emerald-900/30 p-5 shadow-2xl flex flex-col">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                      <div className="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <h2 className="text-xs font-black uppercase tracking-[0.12em] text-white">More Like This</h2>
                    </div>
                    <ScrollArea className="flex-1 pr-1 max-h-[420px] xl:max-h-none">
                      <div className="flex flex-col gap-2.5">
                        {movie.related.map((item) => (
                          <Link key={item.id} href={`/movies-watch/${item.id}`}
                            className="flex items-center gap-3 bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-white/10 rounded-2xl p-2 transition-all group">
                            <img src={item.image} alt={item.title} className="w-12 h-[72px] object-cover rounded-xl shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            <div className="flex flex-col min-w-0 gap-1">
                              <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">{item.title}</h4>
                              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">{item.country} {item.year && `· ${item.year}`}</p>
                              {item.type && <span className="text-[9px] text-zinc-500 uppercase">{item.type}</span>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )
            )}
        </div>

        {/* ── ROW 2: Movie Info Section & (Series-only Suggestions) ── */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Info Section */}
          <div className={cn(
            "w-full flex flex-col",
            (isSeries && movie.related && movie.related.length > 0) ? "xl:col-span-8" : "xl:col-span-12"
          )}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full h-full bg-[#0a0f1c] rounded-[28px] border border-emerald-900/30 overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Poster + cover hero top */}
              <div className="relative flex flex-col sm:flex-row gap-0 min-h-[160px] sm:min-h-[200px]">
                {/* Cover backdrop */}
                {coverImg && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
                    style={{ backgroundImage: `url(${coverImg})` }}
                  />
                )}
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#0a0f1c] to-transparent pointer-events-none z-10" />

                {/* Poster */}
                <div className="relative z-20 p-5 pb-0 sm:pb-5 shrink-0">
                  <div className="relative w-28 sm:w-36 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-emerald-900/30">
                    <img src={movie.image} alt={movie.title} className="w-full h-auto object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>

                {/* Title + meta */}
                <div className="relative z-20 flex-1 p-5 flex flex-col justify-end gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Check size={12} className="text-emerald-400 p-0.5 bg-emerald-400/20 rounded-full shrink-0" />
                    <span className="text-[9px] font-bold text-emerald-300 tracking-[0.2em] uppercase font-lemon">Shadow Theater</span>
                    {isSeries && <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] px-2 h-4">SERIES</Badge>}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight line-clamp-2 font-gradvis drop-shadow-lg">
                    {movie.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-emerald-100/50 uppercase tracking-widest">
                    {movie.imdbId && <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[9px]">IMDB</Badge>}
                    {movie.rating && <span className="text-yellow-400">⭐ {movie.rating}</span>}
                    {movie.contentRating && <span className="border border-white/20 px-1.5 py-0.5 rounded text-[9px]">{movie.contentRating}</span>}
                    {movie.country && <span>{movie.country}</span>}
                    {movie.year && <span>{movie.year}</span>}
                    {movie.runtime && <span>{movie.runtime}</span>}
                  </div>
                </div>
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-5 pt-3">
                  {movie.genres.map(g => (
                    <span key={g} className="text-[9px] uppercase font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/30">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {(movie.synopsis || movie.description) && (
                <p className="text-[11px] md:text-xs text-emerald-50/60 leading-relaxed px-5 pt-3 pb-4 flex-1 line-clamp-6">
                  {movie.synopsis || movie.description}
                </p>
              )}

              {/* Trailer + Rating row */}
              <div className="flex items-center justify-between gap-4 px-5 pb-5 pt-2 border-t border-emerald-900/20 mt-auto">
                <TrailerViewer title={movie.title} imdbId={movie.imdbId} />
                <StarRating movieId={movie.id} initialRating={movie.rating ? parseFloat(movie.rating) / 2 : 0} />
              </div>
            </motion.div>
          </div>

          {/* Right part: More Like This (Suggestions) - ONLY for Series in ROW 2 */}
          {isSeries && movie.related && movie.related.length > 0 && (
            <div className="xl:col-span-4 w-full flex flex-col">
              <div className="w-full h-full min-h-[350px] bg-[#0a0f1c] rounded-[28px] border border-emerald-900/30 p-5 shadow-2xl flex flex-col">
                <div className="flex items-center gap-3 mb-4 shrink-0">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <h2 className="text-xs font-black uppercase tracking-[0.12em] text-white">More Like This</h2>
                </div>
                <ScrollArea className="flex-1 pr-1 xl:max-h-[350px]">
                  <div className="flex flex-col gap-2.5">
                    {movie.related.map((item) => (
                      <Link key={item.id} href={`/movies-watch/${item.id}`}
                        className="flex items-center gap-3 bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-white/10 rounded-2xl p-2 transition-all group">
                        <img src={item.image} alt={item.title} className="w-12 h-[72px] object-cover rounded-xl shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="flex flex-col min-w-0 gap-1">
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">{item.title}</h4>
                          <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">{item.country} {item.year && `· ${item.year}`}</p>
                          {item.type && <span className="text-[9px] text-zinc-500 uppercase">{item.type}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

        </div>

        {/* ── ROW 3: Comments (full width) ── */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <h3 className="text-base font-black text-white flex items-center gap-2">Comments</h3>
          </div>
          <ShadowComments episodeId={`movie-${movie.id}`} />
        </div>

      </div>
    </motion.div>

    <Footer />
  </div>
);
}
