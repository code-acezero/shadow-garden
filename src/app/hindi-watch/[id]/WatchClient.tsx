"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef, useCallback, memo } from 'react';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  SkipForward, SkipBack, Server as ServerIcon,
  Layers, Clock, AlertCircle, Tv, Play,
  Grid, List, Timer, Lightbulb, LayoutGrid,
  ChevronDown, Heart, CheckCircle, XCircle,
  FastForward, Star, Info, MessageSquare, User, Users,
  Loader2, Globe, Flame, Calendar, Copyright, Check, Mic, X,
  ChevronLeft, ChevronRight, Pause, ArrowLeft, ArrowRight, Download, Wand2,
  Zap, PlayCircle, RotateCw, StepForward, Share2
} from 'lucide-react';

import { AnimeService, UniversalAnime } from '@/lib/api';
import { hpi } from '@/lib/hpi';
import { cn, getSimilarity, isRelatedAnime, getChunkLabel, formatAnimeTitle, sanitizeContinueWatchingEntry, getSafeImageUrl } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';
import { sfx } from '@/lib/audioManager';
import PostShareModal from '@/components/Social/PostShareModal';

import HindiPlayer, { HindiPlayerRef } from '@/components/Player/HindiPlayer';
import { adManager } from '@/lib/adManager';
import WatchListButton from '@/components/Watch/WatchListButton';
import ShadowComments from '@/components/Comments/ShadowComments';
import AdsterraNativeBanner from '@/components/Ads/AdsterraNativeBanner';
import Footer from '@/components/Anime/Footer';
import AnimeCard from '@/components/Anime/AnimeCard';
import AuthModal from '@/components/Auth/AuthModal';
import { useUserData } from '@/context/UserDataContext';
import { Button } from '@/components/ui/button';
import { WatchPageSkeleton, PlayerSkeleton, SimpleGridSkeleton } from '@/components/UIx/SkeletonLoaders';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogTrigger, DialogTitle
} from "@/components/ui/dialog";

// --- 1. CUSTOM HOOKS ---

const useDraggable = () => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const slider = ref.current;
        if (!slider) return;
        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        const onMouseDown = (e: MouseEvent) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        };
        const onMouseLeave = () => { isDown = false; slider.style.cursor = 'grab'; };
        const onMouseUp = () => { isDown = false; slider.style.cursor = 'grab'; };
        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        };
        const onWheel = (e: WheelEvent) => {
             if (e.deltaY !== 0) slider.scrollLeft += e.deltaY;
        };

        slider.addEventListener('mousedown', onMouseDown);
        slider.addEventListener('mouseleave', onMouseLeave);
        slider.addEventListener('mouseup', onMouseUp);
        slider.addEventListener('mousemove', onMouseMove);
        slider.addEventListener('wheel', onWheel, { passive: true });

        return () => {
            slider.removeEventListener('mousedown', onMouseDown);
            slider.removeEventListener('mouseleave', onMouseLeave);
            slider.removeEventListener('mouseup', onMouseUp);
            slider.removeEventListener('mousemove', onMouseMove);
            slider.removeEventListener('wheel', onWheel);
        };
    }, []);
    return ref;
}

const useWatchSettings = () => {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState({
    autoPlay: true, autoNext: true, autoSkip: false, autoSkipOutro: false, dimMode: false,
    server: 'VidPlay-1', category: 'dub' as 'sub' | 'dub' | 'raw', volume: 1
  });

  useEffect(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('shadow_watch_settings_hindi');
          if (saved) {
             setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
          }
          setIsLoaded(true);
      }
  }, []);

  const updateSetting = useCallback((key: string, value: any) => {
      setSettings(prev => {
          const newSettings = { ...prev, [key]: value };
          localStorage.setItem('shadow_watch_settings_hindi', JSON.stringify(newSettings));
          return newSettings;
      });

      // Synchronize player preferences across video player and page controls
      if (key === 'autoSkip' || key === 'autoSkipOutro' || key === 'autoPlay') {
          try {
              const currentPrefs = JSON.parse(localStorage.getItem('shadow_player_prefs') || '{}');
              const updatedPrefs = { ...currentPrefs, [key]: value };
              localStorage.setItem('shadow_player_prefs', JSON.stringify(updatedPrefs));
              if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('update_player_prefs', { detail: { playerPrefs: updatedPrefs } }));
              }
          } catch (e) {}
      }
  }, []);
  return { settings, updateSetting, isSettingsLoaded: isLoaded };
};

// --- 2. MEMOIZED PERFORMANCE COMPONENTS ---

const FantasyLoader = memo(() => (
  <WatchPageSkeleton />
));
FantasyLoader.displayName = "FantasyLoader";

const PingPongScroll = memo(({ text, className }: { text: string, className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            setShouldAnimate(textRef.current.scrollWidth > containerRef.current.clientWidth);
        }
    }, [text]);

    return (
        <div ref={containerRef} className="w-full overflow-hidden relative group/pp">
            <span
                ref={textRef}
                className={cn(
                    "whitespace-nowrap inline-block will-change-transform",
                    className,
                    shouldAnimate && "animate-pingpong-scroll"
                )}
            >
                {text}
            </span>
            <style jsx>{`
                @keyframes pingpong-scroll {
                    0% { transform: translateX(0); }
                    15% { transform: translateX(0); }
                    50% { transform: translateX(calc(-100% + 100%)); }
                    65% { transform: translateX(calc(-100% + 100%)); }
                    100% { transform: translateX(0); }
                }
                .animate-pingpong-scroll {
                    display: inline-block;
                    min-width: 100%;
                    animation: pingpong-scroll 10s linear infinite;
                }
            `}</style>
        </div>
    );
});
PingPongScroll.displayName = "PingPongScroll";

const EpisodeButton = memo(({ ep, isCurrent, isFullyPlayed, percent, viewMode, onClick, category, progressRef, playerRef }: any) => {
    const [realPercent, setRealPercent] = useState(percent);
    
    useEffect(() => {
        setRealPercent(percent);
    }, [percent]);

    useEffect(() => {
        if (!isCurrent) return;
        let animationFrameId: number;
        const updateProgress = () => {
             if (progressRef?.current !== undefined) {
                  const duration = (playerRef?.current?.getDuration && playerRef.current.getDuration() > 0)
                      ? playerRef.current.getDuration()
                      : 1440;
                  const p = Math.min(100, Math.max(0, (progressRef.current / duration) * 100));
                  setRealPercent(p);
             }
             animationFrameId = requestAnimationFrame(updateProgress);
        };
        animationFrameId = requestAnimationFrame(updateProgress);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isCurrent, progressRef, playerRef]);
    
    const displayPercent = isCurrent ? realPercent : percent;

    return (
        <motion.button
            layout
            layoutId={`ep-tile-hi-${ep.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: isCurrent ? 1.05 : 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                layout: { type: "spring", stiffness: 350, damping: 30 },
                scale: { type: "spring", stiffness: 300, damping: 25 },
                opacity: { duration: 0.2 }
            }}
            onClick={() => onClick(ep.id)}
            className={cn(
                "relative overflow-hidden group border transition-all duration-300 transform-gpu shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
                viewMode === 'grid' ? "h-8 sm:h-9 w-full rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black" :
                viewMode === 'compact' ? "h-7 sm:h-8 aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" :
                "w-[98%] mx-auto h-8 sm:h-9 rounded-full flex items-center px-3 sm:px-4 text-[10px] sm:text-[11px] font-bold text-left",
                isCurrent ? "bg-green-950/40 backdrop-blur-md border-green-400 text-white ring-1 ring-green-400/50 shadow-[inset_0_0_15px_rgba(74,222,128,0.25),0_0_20px_rgba(34,197,94,0.4)] z-20" :
                isFullyPlayed ? "border border-red-500/60 text-white shadow-[inset_0_0_25px_rgba(220,38,38,0.8)] drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] overflow-hidden" :
                "bg-white/5 backdrop-blur-xl border-white/10 text-zinc-400 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            )}
            style={{
                ...( (!isCurrent && !isFullyPlayed && displayPercent > 0) ? { background: `linear-gradient(to right, rgba(220, 38, 38, 0.45) ${displayPercent}%, rgba(255, 255, 255, 0.05) ${displayPercent}%)` } : {} ),
                ...( isFullyPlayed && !isCurrent ? { 
                     background: `linear-gradient(135deg, transparent 48%, rgba(255,255,255,0.4) 50%, transparent 52%), linear-gradient(45deg, transparent 38%, rgba(255,255,255,0.4) 40%, transparent 42%), linear-gradient(75deg, transparent 68%, rgba(255,255,255,0.3) 70%, transparent 72%), rgba(220, 38, 38, 0.8)`,
                     backdropFilter: 'blur(10px)'
                } : {} )
            }}
        >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-full" />
            
            {!isCurrent && !isFullyPlayed && displayPercent > 0 && <div className="absolute inset-0 bg-orange-600/10 animate-liquid pointer-events-none" />}
            
            {isCurrent && (
                <motion.div 
                    className="absolute bottom-0 left-0 h-full bg-green-500/35 overflow-hidden pointer-events-none rounded-r-2xl border-r border-green-300/50 shadow-[4px_0_15px_rgba(74,222,128,0.5)] backdrop-blur-sm"
                    initial={{ width: '4%' }}
                    animate={{ width: `${Math.max(4, displayPercent)}%` }}
                    transition={{ ease: "linear", duration: 0.15 }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-300/30 via-transparent to-transparent opacity-80" />
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-green-300/40 to-transparent" />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-green-300/70 shadow-[0_0_5px_rgba(134,239,172,0.8)]" />
                </motion.div>
            )}

            {/* Active Micro-Equalizer Indicator for Grid & Compact Modes */}
            {isCurrent && (viewMode === 'grid' || viewMode === 'compact') && (
                <span className="absolute top-1 right-1.5 flex items-end gap-[1.5px] h-2 pointer-events-none z-20" aria-label="Now Playing">
                    <span className="w-[1.5px] bg-green-300 rounded-full animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
                    <span className="w-[1.5px] bg-green-300 rounded-full animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
                    <span className="w-[1.5px] bg-green-300 rounded-full animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
                </span>
            )}

            <div className={cn("truncate relative z-10 w-full flex items-center font-lemon tracking-wide", viewMode === 'list' ? "justify-between" : "justify-center")}>
                <span className="truncate">
                    {viewMode === 'list' ? `${ep.number}. ${ep.title}` : ep.number}
                </span>

                {/* Active Playing Badge for List Mode */}
                {isCurrent && viewMode === 'list' && (
                    <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/50 text-[8px] font-black uppercase text-green-300 shadow-[0_0_10px_rgba(74,222,128,0.3)] shrink-0">
                        <span className="inline-flex items-end gap-[1.5px] h-2">
                            <span className="w-[1.5px] bg-green-300 rounded-full animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
                            <span className="w-[1.5px] bg-green-300 rounded-full animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
                            <span className="w-[1.5px] bg-green-300 rounded-full animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
                        </span>
                        <span>PLAYING</span>
                    </span>
                )}
            </div>
        </motion.button>
    );
});
EpisodeButton.displayName = "EpisodeButton";

// --- HELPERS ---

interface V2EpisodeSchedule { airingISOTimestamp: string | null; airingTimestamp: number | null; secondsUntilAiring: number | null; }
interface EpisodeProgress { [key: number]: number; }

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000, timeoutMs = 15000): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    try {
        return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(res => setTimeout(res, delay));
        return retryOperation(operation, retries - 1, delay * 2, timeoutMs);
    }
}

const formatRating = (rating?: string, genres?: string[], isAdult?: boolean) => {
    const isAdultFlag = !!isAdult || genres?.some((g: string) => typeof g === 'string' && ['hentai', 'rx', 'adult', 'erotica'].includes(g.toLowerCase()));
    const isEcchi = genres?.some((g: string) => typeof g === 'string' && ['ecchi', 'fanservice'].includes(g.toLowerCase()));
    const defaultRating = isAdultFlag ? '18+' : (isEcchi ? 'R-17' : 'PG-13');

    if (!rating) return defaultRating;
    const r = rating.toString().trim();
    const rUpper = r.toUpperCase();

    // Intercept any numeric score, MAL score, rating out of 10, or unhelpful placeholders
    if (
        rUpper.includes('/10') ||
        rUpper.includes('MAL') ||
        rUpper.includes('SCORE') ||
        rUpper === 'N/A' ||
        rUpper === '?' ||
        rUpper === 'UNKNOWN' ||
        rUpper === 'NONE' ||
        (/^\d+(\.\d+)?/.test(rUpper) && !rUpper.includes('18') && !rUpper.includes('17') && !rUpper.includes('13'))
    ) {
        return defaultRating;
    }

    if (rUpper.includes('RX') || rUpper.includes('18+') || rUpper.includes('R-18') || rUpper.includes('R18') || rUpper.includes('TV-MA') || rUpper.includes('ADULT')) return '18+';
    if (rUpper.includes('R-17') || rUpper.includes('R17') || rUpper.includes('R+') || rUpper === 'R' || rUpper.startsWith('R-') || rUpper.startsWith('R ')) return 'R-17';
    if (rUpper.includes('PG-13') || rUpper.includes('PG13') || rUpper.includes('TV-14') || rUpper.includes('TEEN')) return 'PG-13';
    if (rUpper.includes('TV-PG') || rUpper === 'PG' || rUpper.startsWith('PG')) return 'PG';
    if (rUpper.includes('TV-G') || rUpper.includes('TV-Y') || rUpper === 'G') return 'G';

    return defaultRating;
};

// --- SUB-COMPONENTS ---

const formatServerDisplayName = (name: string): string => {
    if (!name) return 'Server';
    return name
        .replace(/\s*(?:[-–—]\s*)?[\(\[]?\s*hindi(?:\s*dub)?\s*[\)\]]?/gi, '')
        .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Server';
};

const NextEpisodeTimer = ({ schedule, status }: { schedule: any, status: string }) => {
    const [displayText, setDisplayText] = useState<React.ReactNode>("...");

    useEffect(() => {
        const isFinished = status?.toLowerCase().includes("finished") || status?.toLowerCase().includes("completed");
        if (isFinished) {
            setDisplayText(<span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider">COMPLETED</span>);
            return;
        }

        const rawTimestamp = schedule?.airingISOTimestamp 
            ? new Date(schedule.airingISOTimestamp).getTime()
            : (schedule?.airingAt ? Number(schedule.airingAt) * 1000 : (schedule?.airingTimestamp ? Number(schedule.airingTimestamp) * 1000 : null));

        if (!rawTimestamp || isNaN(rawTimestamp)) {
            if (status?.toLowerCase().includes("releasing")) {
                setDisplayText(<span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">NEXT EP: TBA</span>);
            } else {
                setDisplayText(<span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">NEXT EP: TBA</span>);
            }
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = rawTimestamp - now;
            if (diff <= 0) {
                setDisplayText(<span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">AIRED</span>);
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            const epPrefix = schedule?.episode ? `EP ${schedule.episode}: ` : 'NEXT EP: ';
            const timeStr = days > 0
                ? `${days}d ${hours}h ${minutes}m`
                : `${hours}h ${minutes}m ${seconds}s`;

            setDisplayText(
                <span className="text-[9.5px] font-black uppercase tracking-tight flex items-center gap-1">
                    <span className="text-orange-400">{epPrefix}</span>
                    <span className="text-zinc-200">{timeStr}</span>
                </span>
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [schedule, status]);

    return (
        <div className="flex items-center gap-2 text-[9px] font-bold bg-white/5 hover:bg-white/10 text-zinc-300 px-3.5 h-8 rounded-full border border-white/10 transition-colors justify-center min-w-fit shadow-md shadow-black/40">
            <Timer className="w-3 h-3 text-orange-500 shrink-0 animate-pulse" />
            <span className="truncate whitespace-nowrap">{displayText}</span>
        </div>
    );
};

const TrailerSection = ({ videos }: { videos: any[] }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const [activeVideo, setActiveVideo] = useState(videos?.[0]?.source); 
    if (!videos || videos.length === 0) return null; 
    const getYoutubeId = (url: string) => url?.split('v=')[1]?.split('&')[0] || url?.split('/').pop();

    const triggerEl = (
        <div className="inline-flex items-center gap-2 bg-orange-600/10 border border-orange-500/20 rounded-full py-2 cursor-pointer hover:bg-orange-600 hover:border-orange-500 transition-all group active:scale-95 shadow-lg shadow-orange-900/10 w-full md:w-auto justify-center">
            <span className="flex items-center justify-center w-4 h-4 bg-orange-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                <Play size={8} fill="currentColor" />
            </span>
            <span className="text-[9px] font-black text-primary-100 group-hover:text-white uppercase tracking-wider">
                Trailers ({videos.length})
            </span>
        </div>
    );

    if (!mounted) return triggerEl;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {triggerEl}
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-orange-500/40 w-[90vw] lg:max-w-2xl max-h-[70vh] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300 flex flex-col">
                <DialogTitle className="sr-only">Trailers</DialogTitle>
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="aspect-video w-full bg-zinc-900 shrink-0">
                        <iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                    </div>
                    <div className="p-4 md:p-6 bg-[#0a0a0a] flex-1 overflow-hidden flex flex-col">
                        <ScrollArea className="w-full whitespace-nowrap pb-4 h-full">
                            <div className="flex gap-4 px-2">
                                {videos.map((v: any, i: number) => (v && v.source ? <button key={i} onClick={() => setActiveVideo(v.source)} className={cn("flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-28 md:w-36 hover:scale-105 active:scale-95 group/pv", activeVideo === v.source ? "bg-orange-600/10 border-orange-600" : "bg-white/5 border-transparent hover:border-white/10")}><div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative shadow-lg"><img src={v.thumbnail || '/images/no-thumb.png'} className="w-full h-full object-cover opacity-60" alt="" loading="lazy" decoding="async"/><div className="absolute inset-0 flex items-center justify-center bg-orange-600/20 opacity-0 group-hover/pv:opacity-100 transition-opacity"><Play size={16} fill="white" className="text-white" /></div></div><span className="text-[9px] font-black text-center truncate w-full uppercase text-zinc-400 group-hover/pv:text-white">{v.title || `Promo ${i+1}`}</span></button> : null))}
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1 bg-white/5" />
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MarqueeTitle = ({ text }: { text: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
        }
    }, [text]);

    return (
        <div className="flex items-center bg-white/5 rounded-full h-8 px-3 border border-white/5 w-full flex-1 min-w-0 overflow-hidden relative transition-all hover:border-orange-500/20 active:scale-95 group shadow-inner shadow-orange-900/5">
            <span className="text-[10px] text-orange-500 font-black uppercase mr-2 flex-shrink-0 group-hover:animate-pulse">NOW:</span>
            <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center mask-image-gradient">
                <div className={cn("whitespace-nowrap inline-block", isOverflowing && "animate-marquee-pingpong")}>
                    <span ref={textRef} className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 block px-2">
                        {text}
                    </span>
                </div>
                <style jsx>{`
                    @keyframes pingpong {
                        0% { transform: translateX(0); }
                        10% { transform: translateX(0); }
                        45% { transform: translateX(calc(-100% + 100%)); }
                        55% { transform: translateX(calc(-100% + 100%)); }
                        90% { transform: translateX(0); }
                        100% { transform: translateX(0); }
                    }
                    .animate-marquee-pingpong {
                        min-width: 100%;
                        animation: pingpong 12s ease-in-out infinite;
                    }
                `}</style>
            </div>
        </div>
    );
};

const StarRating = ({ animeId, initialRating = 0 }: { animeId: string; initialRating?: string | number }) => {
    const [userRating, setUserRating] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [hover, setHover] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchRatings = async () => {
            if (!supabase) return;
            try {
                const allRatings = await retryOperation(async () => {
                    const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('anime_id', animeId);
                    return data;
                });
                if (allRatings && allRatings.length > 0) {
                    const sum = allRatings.reduce((acc:any, curr:any) => acc + (curr.rating ?? 0), 0);
                    setAvgRating(sum / allRatings.length);
                } else {
                    setAvgRating(typeof initialRating === 'string' ? parseFloat(initialRating) : (typeof initialRating === 'number' ? initialRating : 0));
                }
                if (user) {
                    const myRating = await retryOperation(async () => {
                        const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('user_id', user.id).eq('anime_id', animeId).limit(1);
                        return data?.[0] || null;
                    });
                    if (myRating && (myRating as any).rating != null) setUserRating((myRating as any).rating);
                }
            } catch (e) {}
        };
        fetchRatings();
    }, [user, animeId, initialRating]);

    const handleRate = async (score: number) => {
        if (!user) { toast.error("Shadow Agents only."); return; }
        setUserRating(score);
        try {
            await (supabase!.from('anime_ratings') as any).upsert({ user_id: user.id, anime_id: animeId, rating: score }, { onConflict: 'user_id,anime_id' });
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
                            <Star size={14} className={cn("transition-all duration-300", star <= (hover || userRating) ? "fill-red-600 text-orange-600 shadow-orange-500/50" : "text-zinc-700")} />
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

const CharacterDetailsDialog = ({
  isOpen, onClose, characterId, onActorClick, onBack, onForward, canGoBack, canGoForward
}: {
  isOpen: boolean; onClose: () => void; characterId: string | null, onActorClick: (id: string) => void, onBack?: () => void, onForward?: () => void, canGoBack?: boolean, canGoForward?: boolean
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (!isOpen || !characterId) return;
      setLoading(true);
      retryOperation(() => Promise.resolve(null))
        .then((res: any) => {
            const item = res?.results?.data?.[0] || res?.data?.[0] || res;
            setData(item);
            setLoading(false);
        })
        .catch(() => setLoading(false));
  }, [isOpen, characterId]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="w-[90vw] h-[65vh] md:h-[550px] p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-[30px] z-[60] [&>button]:hidden">
            <DialogTitle className="sr-only">Character Details</DialogTitle>
            <div className="w-full h-full relative backdrop-blur-2xl bg-[#050505]/95 border border-white/10 rounded-[30px] shadow-[0_0_80px_rgba(220,38,38,0.15)] overflow-hidden flex flex-col md:flex-row">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-900/10 via-transparent to-orange-900/5 pointer-events-none" />

                <div className="absolute top-1 right-1 z-[100] flex gap-2 pointer-events-auto">
                    {onBack && canGoBack && (
                      <button onClick={onBack} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowLeft size={14} className="group-hover:text-orange-500 transition-colors" />
                      </button>
                    )}
                    {onForward && canGoForward && (
                      <button onClick={onForward} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowRight size={14} className="group-hover:text-orange-500 transition-colors" />
                      </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-orange-600 hover:border-orange-500 transition-all active:scale-90 shadow-lg">
                      <X size={14} />
                    </button>
                </div>

                {loading ? <div className="w-full h-full flex items-center justify-center"><SimpleGridSkeleton /></div> : data ? (
                <>
                    <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
                        <img src={data.profile || data.image || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} loading="lazy" decoding="async"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                        <div className="absolute bottom-6 left-6 z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                            <p className="text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{data.japaneseName}</p>
                        </div>
                    </div>
                    <div className="w-full md:w-[65%] h-[60%] md:h-full relative z-10 flex flex-col bg-[#0a0a0a]/50">
                        <ScrollArea className="h-full p-6 custom-scrollbar">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12}/> Profile</h3>
                                    <div className="text-zinc-300 text-sm leading-relaxed font-medium opacity-90 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: data.about?.style || data.about?.description || "No Data Available" }} />
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Mic size={12} className="text-orange-500"/> Voice Artists</h3>
                                    {data.voiceActors && data.voiceActors.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {data.voiceActors.map((va: any, i: number) => (
                                                    <button key={i} onClick={() => va.id && onActorClick(va.id)} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all group/va text-left active:scale-95">
                                                        <img src={va.profile || va.image || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md group-hover/va:border-orange-500/50" alt={va.name} loading="lazy" decoding="async"/>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-zinc-200 group-hover/va:text-white truncate">{va.name}</span>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{va.language}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                    ) : (

<div className="flex flex-col items-center justify-start h-full pt-[30%] opacity-40">
    <img 
        src="/images/non-non.png" 
        // Increased size to w-24 h-24 (approx 90-100% bigger than w-12)
        className="w-24 h-24 rounded-full grayscale mb-4 border border-white/10" 
    />
    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
        No Bloodlines Found
    </span>
</div>
                                    )}
                                </div>

                                {data.animeography && data.animeography.length > 0 && (
                                    <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12} className="text-yellow-500"/> Appearances</h3>
                                            <div className="flex flex-col gap-3">
                                                {data.animeography.map((anime:any, i:number) => (
                                                    <Link key={i} href={`/watch/${anime.id}`} className="flex items-center gap-4 p-2 pr-4 rounded-xl bg-black/40 border border-white/5 hover:border-orange-500/50 hover:bg-white/5 transition-all active:scale-95 group/ani">
                                                        <img src={anime.poster || '/images/no-poster.png'} className="w-10 h-14 rounded-lg object-cover shadow-sm" loading="lazy" decoding="async"/>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-zinc-300 group-hover/ani:text-white truncate">{anime.title}</span>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover/ani:text-orange-400 transition-colors">{anime.role || 'Character'}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </> ) : <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold">DATA CORRUPTED</div>}
            </div>
        </DialogContent>
    </Dialog>
  );
};

const VoiceActorDetailsDialog = ({
  isOpen, onClose, actorId, onCharacterClick, onBack, onForward, canGoBack, canGoForward
}: {
  isOpen: boolean; onClose: () => void; actorId: string | null, onCharacterClick: (id: string) => void, onBack?: () => void, onForward?: () => void, canGoBack?: boolean, canGoForward?: boolean
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (!isOpen || !actorId) return;
      setLoading(true);
      retryOperation(() => Promise.resolve(null))
        .then((res: any) => {
            const item = res?.results?.data?.[0] || res?.data?.[0] || res;
            setData(item);
            setLoading(false);
        })
        .catch(() => setLoading(false));
  }, [isOpen, actorId]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="w-[95vw] h-[65vh] md:h-[550px] p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-[30px] z-[60] [&>button]:hidden">
            <DialogTitle className="sr-only">Actor Details</DialogTitle>
            <div className="w-full h-full relative backdrop-blur-2xl bg-[#050505]/95 border border-white/10 rounded-[30px] shadow-[0_0_80px_rgba(220,38,38,0.3)] overflow-hidden flex flex-col md:flex-row">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600/10 via-transparent to-orange-600/5 pointer-events-none" />

                <div className="absolute top-1 right-1 z-[100] flex gap-2 pointer-events-auto">
                    {onBack && canGoBack && (
                      <button onClick={onBack} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowLeft size={14} className="group-hover:text-orange-500 transition-colors" />
                      </button>
                    )}
                    {onForward && canGoForward && (
                      <button onClick={onForward} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowRight size={14} className="group-hover:text-orange-500 transition-colors" />
                      </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-orange-600 hover:border-orange-500 transition-all active:scale-90 shadow-lg">
                      <X size={14} />
                    </button>
                </div>

                {loading ? <div className="w-full h-full flex items-center justify-center"><SimpleGridSkeleton /></div> : data ? (
                <>
                    <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
                        <img src={data.profile || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} loading="lazy" decoding="async"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                        <div className="absolute bottom-6 left-6 z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                            <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{data.japaneseName}</p>
                        </div>
                    </div>
                    <div className="w-full md:w-[65%] h-[60%] md:h-full relative z-10 flex flex-col bg-[#0a0a0a]/50">
                        <ScrollArea className="h-full p-6 custom-scrollbar">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12}/> Profile</h3>
                                    <div className="text-zinc-300 text-sm leading-relaxed font-medium opacity-90 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: data.about?.style || data.about?.description || "No Data" }} />
                                </div>
                                {data.roles && (
                                    <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12}/> Roles</h3>
                                            <div className="flex flex-col gap-2">
                                                {data.roles.map((role:any, i:number) => (
                                                    <div key={i} className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/row">
                                                        {/* Left: Anime Info (50% Width) */}
                                                        <Link href={`/watch/${role.anime.id}`} className="flex items-center gap-2 min-w-0 group/ani overflow-hidden">
                                                            <img src={role.anime.poster || '/images/no-poster.png'} className="w-8 h-12 rounded-md object-cover shadow-sm shrink-0" loading="lazy" decoding="async"/>
                                                            <div className="flex flex-col min-w-0 overflow-hidden">
                                                                <PingPongScroll text={role.anime.title} className="text-[10px] font-bold text-zinc-300 group-hover/ani:text-white" />
                                                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider group-hover/ani:underline truncate">Watch Now</span>
                                                            </div>
                                                        </Link>

                                                        {/* Right: Character Info (50% Width) */}
                                                        <button onClick={() => onCharacterClick(role.character.id)} className="flex items-center gap-2 justify-end min-w-0 group/char text-right overflow-hidden">
                                                            <div className="flex flex-col min-w-0 items-end overflow-hidden">
                                                                <PingPongScroll text={role.character.name} className="text-[10px] font-bold text-zinc-300 group-hover/char:text-white text-right" />
                                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider truncate w-full text-right">{role.role || role.character.role || 'Main'}</span>
                                                            </div>
                                                            <img
                                                                src={role.character.profile || role.character.image || role.character.poster || role.character.images?.jpg?.image_url || '/images/non-non.png'}
                                                                className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover/char:border-orange-500 transition-colors shadow-md shrink-0"
                                                                alt={role.character.name}
                                                                loading="lazy" decoding="async"
                                                            />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </> ) : <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold">DATA CORRUPTED</div>}
            </div>
        </DialogContent>
    </Dialog>
  );
};

// ==========================================
//  4. MAIN COMPONENT (WatchContent)
// ==========================================

function WatchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const animeId = params.id as string;
  const urlEpId = searchParams.get('ep');
  const urlEpNumber = searchParams.get('episode');
  const urlTimestamp = searchParams.get('timestamp');
  const urlType = searchParams.get('type'); 

  const { user } = useAuth();
  const { continueData } = useUserData();
  const { settings, updateSetting, isSettingsLoaded } = useWatchSettings();
  const [showShareModal, setShowShareModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Pause BGM when entering Watch Page, resume when leaving
  useEffect(() => {
    if (typeof window !== 'undefined') sfx.pauseBGM();
    return () => {
      if (typeof window !== 'undefined') sfx.resumeBGM();
    };
  }, []);

  // --- POPUP STACK ---
  const [popupHistory, setPopupHistory] = useState<{type: 'character'|'actor', id: string}[]>([]);
  const [popupIndex, setPopupIndex] = useState(-1);
  const activePopup = popupIndex >= 0 ? popupHistory[popupIndex] : null;

  const navigateToPopup = useCallback((type: 'character'|'actor', id: string) => {
    setPopupHistory(prev => { const n = prev.slice(0, popupIndex + 1); n.push({ type, id }); return n; });
    setPopupIndex(prev => prev + 1);
  }, [popupIndex]);

  const openCharacter = useCallback((id: string) => navigateToPopup('character', id), [navigateToPopup]);
  const openActor = useCallback((id: string) => navigateToPopup('actor', id), [navigateToPopup]);
  const goBack = useCallback(() => setPopupIndex(prev => Math.max(0, prev - 1)), []);
  const goForward = useCallback(() => setPopupIndex(prev => Math.min(popupHistory.length - 1, prev + 1)), [popupHistory.length]);
  const closeAll = useCallback(() => { setPopupHistory([]); setPopupIndex(-1); }, []);

  // --- STATE ---
  const [anime, setAnime] = useState<UniversalAnime | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [playerAspectRatio, setPlayerAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    setPlayerAspectRatio(null);
    episodeSubtitlesRef.current = [];
  }, [currentEpId]);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamIsEmbed, setStreamIsEmbed] = useState<boolean>(false);
  const [streamReferer, setStreamReferer] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [intro, setIntro] = useState<any>(null);
  const [outro, setOutro] = useState<any>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [servers, setServers] = useState<any>(null);
  const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
  const [hideInterface, setHideInterface] = useState(false);
  const interfaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSkipNotification, setShowSkipNotification] = useState(false);
  const [skipNotificationText, setSkipNotificationText] = useState<'Skipped Intro' | 'Skipped Outro'>('Skipped Intro');
  const isSkipToastLocked = useRef(false);
  const lastAutoSkippedIntroRef = useRef(false);
  const lastAutoSkippedOutroRef = useRef(false);
  const lastAutoNextTriggeredRef = useRef(false);
  const embedDurationRef = useRef<number>(1440);
  const [epViewMode, setEpViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [epProgress, setEpProgress] = useState<EpisodeProgress>({});
  const [resumeTime, setResumeTime] = useState(0);
  const [isResumeLoaded, setIsResumeLoaded] = useState(false);
  const progressRef = useRef(0);
  // For iframe streams where we can't read the video element's currentTime
  const iframeElapsedRef = useRef(0);
  const iframeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<HindiPlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBuffer = useRef<{[key: string]: any}>({});
  const isBufferDirty = useRef(false);
  const isSwitchingEpisode = useRef(false);
  const episodeSubtitlesRef = useRef<any[]>([]);

  const seasonsRef = useDraggable();
  const relatedRef = useDraggable();
  const recommendationsRef = useDraggable();
  const chunksRef = useDraggable();
  const isProgrammaticServerUpdate = useRef(false);

  // --- HANDLERS (Hoisted) ---

  const handleServerChange = useCallback((srvName: string) => {
      setServers((prev: any) => {
          if (!prev) { updateSetting('server', srvName); return prev; }
          const srvList = [...(prev.sub || []), ...(prev.dub || []), ...(prev.raw || [])];
          const srv = srvList.find((s: any) => s.serverName === srvName);
          if (srv && srv.url) {
              setStreamUrl(srv.url);
              setStreamIsEmbed(Boolean(srv.isEmbed));
              isProgrammaticServerUpdate.current = true;
              updateSetting('server', srvName);
              if (srv.tracks && Array.isArray(srv.tracks)) {
                  const incoming = srv.tracks.map((t: any) => ({
                      file: t.file || t.url,
                      label: t.label || 'English',
                      kind: 'captions',
                      default: !!t.default
                  }));
                  if (incoming.length > 0) {
                      episodeSubtitlesRef.current = incoming;
                      setSubtitles(incoming);
                  }
              } else if (episodeSubtitlesRef.current.length > 0) {
                  setSubtitles(episodeSubtitlesRef.current);
              }
              if (srv.intro) setIntro(srv.intro);
              if (srv.outro) setOutro(srv.outro);
          } else {
              updateSetting('server', srvName);
          }
          return prev;
      });
  }, [updateSetting]);

  const flushSyncBuffer = useCallback(async () => {
      if (!user || !supabase || !isBufferDirty.current) return;
      const payload = Object.values(progressBuffer.current);
      if (payload.length === 0) return;
      isBufferDirty.current = false;
      const sanitizedPayload = payload.map(p => sanitizeContinueWatchingEntry(p, user.id)).filter(Boolean);
      try {
          // ✅ Shared Client Used Here
          await (supabase.from('user_continue_watching') as any).upsert(sanitizedPayload, { onConflict: 'user_id,episode_id' });
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
      } catch (e) {
          isBufferDirty.current = true;
      }
  }, [user, animeId]);

  const saveProgress = useCallback(async (forceFlush = false, overrideEpId?: string) => {
      const targetEpId = overrideEpId || currentEpId;
      if (!targetEpId || !anime) return;
      const playerTime = playerRef.current?.getCurrentTime() || 0;
      const currentSavedProgress = progressBuffer.current[targetEpId]?.progress || 0;
      
      let progress = Math.max(playerTime, progressRef.current);
      if (progress <= 1 && currentSavedProgress > 5) {
          progress = currentSavedProgress;
      }
      if (progress <= 0) return;

      const ep = anime.episodes.find(e => e.id === targetEpId || String(e.number) === targetEpId);
      if (!ep) return;
      
      const rawDuration = playerRef.current?.getDuration();
      const duration = (rawDuration && !isNaN(rawDuration) && rawDuration > 0) ? rawDuration : (progressBuffer.current[targetEpId]?.duration || 1440);
      
      const percent = Math.min(100, Math.round((progress / duration) * 100));
      const isCompleted = percent >= 98;

      setEpProgress(prev => ({
          ...prev,
          [ep.number]: isCompleted ? 100 : percent,
          [ep.id]: isCompleted ? 100 : percent
      }));

      if (user) {
          const episodeImage = (ep as any).image || (ep as any).poster || anime.poster;
          const rawTitle = anime.title || (anime as any).name || (anime as any).jname;
          const animeTitle = formatAnimeTitle(rawTitle, animeId);
          if (typeof window !== 'undefined' && animeTitle && !animeTitle.toLowerCase().includes('unknown')) {
              localStorage.setItem(`shadow_anime_title_${animeId}`, animeTitle);
          }
          const animeImage = anime.poster || (anime as any).image || episodeImage;
          const animeType = 'hindi';
          const isAdultVal = false;
          const ageRatingVal = null;
          const entry = {
              user_id: user.id,
              anime_id: animeId,
              title: animeTitle,
              banner_image: animeImage,
              episode_id: targetEpId,
              episode_number: ep.number,
              progress: progress,
              last_updated: new Date().toISOString(),
              last_server: settings.server,
              episode_image: episodeImage,
              total_episodes: anime.episodes?.length || 1,
              type: animeType,
              media_type: 'hindi',
              is_completed: isCompleted,
              age_rating: ageRatingVal,
              is_adult: isAdultVal
          };
          progressBuffer.current[targetEpId] = entry;
          isBufferDirty.current = true;
          localStorage.setItem(`shadow_sync_buffer_${animeId}`, JSON.stringify(progressBuffer.current));
          if (forceFlush || isCompleted) flushSyncBuffer();
      } else {
          const rawTitle = anime.title || (anime as any).name || (anime as any).jname;
          const animeTitle = formatAnimeTitle(rawTitle, animeId);
          if (typeof window !== 'undefined' && animeTitle && !animeTitle.toLowerCase().includes('unknown')) {
              localStorage.setItem(`shadow_anime_title_${animeId}`, animeTitle);
          }
          const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
          localData[animeId] = { 
            animeId, 
            title: animeTitle,
            poster: anime.poster || (anime as any).image,
            episodeId: targetEpId, 
            episodeNumber: ep.number, 
            progress, 
            type: 'hindi',
            lastUpdated: Date.now() 
          };
          localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));

          const epData = JSON.parse(localStorage.getItem(`shadow_ep_progress_${animeId}`) || '{}');
          epData[targetEpId] = {
              episode_id: targetEpId,
              episode_number: ep.number,
              progress,
              duration,
              is_completed: isCompleted,
              last_updated: new Date().toISOString()
          };
          localStorage.setItem(`shadow_ep_progress_${animeId}`, JSON.stringify(epData));
          progressBuffer.current[targetEpId] = epData[targetEpId];

          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
      }
  }, [anime, user, animeId, settings.server, flushSyncBuffer]);

  // Instant Registration & Progress Restoration on Episode Visit

  useEffect(() => {
      if (anime && currentEpId) {
          const record = progressBuffer.current[currentEpId];
          if (record && !record.is_completed && record.progress > 0) {
              progressRef.current = record.progress;
              setResumeTime(record.progress);
          }
      }
  }, [anime, currentEpId]);

  // Save progress on unmount (when leaving watch page)
  useEffect(() => {
      const epToSave = currentEpId;
      return () => {
          if (isSwitchingEpisode.current) {
              isSwitchingEpisode.current = false;
              return;
          }
          if (epToSave && progressRef.current > 5) {
              saveProgress(true, epToSave);
          }
      };
  }, [currentEpId, saveProgress]);

  const handlePause = useCallback(() => saveProgress(true), [saveProgress]);

  const handleEpisodeClick = useCallback((id: string) => {
      isSwitchingEpisode.current = true;
      lastAutoSkippedIntroRef.current = false;
      lastAutoSkippedOutroRef.current = false;
      lastAutoNextTriggeredRef.current = false;
      if (currentEpId && progressRef.current > 5) {
          saveProgress(true);
      }
      failedServersRef.current = [];
      iframeElapsedRef.current = 0;
      if (iframeTimerRef.current) { clearInterval(iframeTimerRef.current); iframeTimerRef.current = null; }

      // Trigger episode switch ad
      adManager.triggerEpisodeSwitch(id);
      
      const ep = anime?.episodes.find(e => 
          String(e.id) === String(id) || 
          String(e.number) === String(id) || 
          Number(e.number) === Number(id) ||
          String(e.id).endsWith(`::${id}`) ||
          String(e.id).endsWith(`-${id}`)
      );
      const targetId = ep ? ep.id : id;

      if (ep) {
          const savedRecord = progressBuffer.current[targetId];
          const savedProgress = savedRecord?.progress || 0;
          const isCompleted = savedRecord?.is_completed || (epProgress[ep.number] === 100);
          
          if (isCompleted) {
              progressRef.current = 0;
              setResumeTime(0);
          } else {
              progressRef.current = savedProgress;
              setResumeTime(savedProgress);
          }
      } else {
          progressRef.current = 0;
          setResumeTime(0);
      }
      
      setCurrentEpId(targetId);
      setStreamUrl(null);
      isSkipToastLocked.current = false;
      const targetParam = ep ? String(ep.number) : targetId;
      if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('ep', targetParam);
          window.history.replaceState({}, '', url.toString());
      }
  }, [animeId, saveProgress, anime, epProgress, currentEpId]);

  const resetInterfaceTimer = useCallback(() => {}, []);

  const handlePlayerClick = useCallback(() => {
      if (playerContainerRef.current) playerContainerRef.current.focus();
  }, []);

  const handlePlaybackStart = useCallback(() => {}, []);

  const handleSkipIntro = useCallback(() => {
      setSkipNotificationText('Skipped Intro');
      if (isSkipToastLocked.current || showSkipNotification) return;
      setShowSkipNotification(true);
      isSkipToastLocked.current = true;
      setTimeout(() => {
          setShowSkipNotification(false);
          setTimeout(() => { isSkipToastLocked.current = false; }, 1000);
      }, 3000);
  }, [showSkipNotification]);

  const handleSkipOutro = useCallback(() => {
      setSkipNotificationText('Skipped Outro');
      if (isSkipToastLocked.current || showSkipNotification) return;
      setShowSkipNotification(true);
      isSkipToastLocked.current = true;
      setTimeout(() => {
          setShowSkipNotification(false);
          setTimeout(() => { isSkipToastLocked.current = false; }, 1000);
      }, 3000);
  }, [showSkipNotification]);

  const handleCreateWatchRoom = async () => {
      if (!user) {
          toast.error("Log in to create a watch room.");
          return;
      }
      try {
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: room, error: roomError } = await supabase
              .from('watch_rooms')
              .insert({
                  code,
                  title: anime?.title ? `${anime.title} Watch Room` : 'Hindi Anime Watch Room',
                  host_id: user.id,
                  media_id: animeId,
                  media_type: 'hindi',
                  episode_number: currentEpisode?.number || 1,
                  is_private: false
              })
              .select()
              .single();

          if (roomError) throw roomError;

          await supabase.from('room_members').insert({
              room_id: room.id,
              user_id: user.id,
              role: 'host'
          });

          toast.success("Watch room created!");
          window.location.href = `/rooms/${code}`;
      } catch (err: any) {
          console.error("Failed to create room:", err);
          toast.error("Could not create watch room");
      }
  };

  // --- EFFECTS ---

  // URL Auto Update
  useEffect(() => {
    if (currentEpId && !isLoadingInfo && anime) {
         const currentEpObj = anime.episodes.find(e => e.id === currentEpId);
         const url = new URL(window.location.href);
         const currentParamEp = url.searchParams.get('ep');
         const targetParam = currentEpObj ? String(currentEpObj.number) : currentEpId;
         if (currentParamEp !== targetParam) {
             url.searchParams.set('ep', targetParam);
             window.history.replaceState({}, '', url.toString());
         }
    }
  }, [currentEpId, isLoadingInfo, anime]);

  // Chunk Auto-Select
  const chunkSize = epViewMode === 'compact' ? 100 : 50;
  useEffect(() => {
      if (!currentEpId || !anime) return;
      const index = anime.episodes.findIndex(e => e.id === currentEpId);
      if (index !== -1) {
          const targetChunk = Math.floor(index / chunkSize);
          setEpChunkIndex(targetChunk);
      }
  }, [currentEpId, anime, chunkSize]);

  // Initial Load
  useEffect(() => {
    const init = async () => {
        setIsLoadingInfo(true);
        try {
            const details = await hpi.bridge.getSmartDetails(animeId);
            if (!details) {
                console.warn("[HindiWatchClient] Anime details not found for", animeId);
                return;
            }

            const universalData: UniversalAnime = {
                id: details.id,
                title: details.title,
                jname: details.nativeTitle,
                poster: details.image,
                description: details.synopsis,
                isAdult: false,
                stats: {
                    rating: (details.rating && !details.rating.includes('/10') && !/^\d+(\.\d+)?$/.test(String(details.rating).trim()) && !/mal|score/i.test(String(details.rating))) ? details.rating : 'PG-13',
                    quality: 'HD',
                    episodes: { sub: 0, dub: details.episodes?.length || 0 },
                    type: details.type || 'TV',
                    duration: '?',
                    malScore: (details as any).malScore || details.rating || '?'
                },
                info: {
                    premiered: details.premiered || '?',
                    aired: details.aired || '?',
                    status: details.status || '?',
                    genres: details.genres || [],
                    studios: details.studios || [],
                    producers: details.producers || [],
                    japanese: details.nativeTitle || '?',
                    synonyms: (details.synonyms || []).join(', ')
                },
                episodes: (() => {
                    const seenEpKeys = new Set<string>();
                    const parsed: any[] = [];
                    (details.episodes || []).forEach(e => {
                        const epNum = parseInt(e.number, 10) || 1;
                        const uniqueKey = `${e.id}_${epNum}`;
                        const numKey = `num_${epNum}`;
                        if (!seenEpKeys.has(uniqueKey) && !seenEpKeys.has(numKey)) {
                            seenEpKeys.add(uniqueKey);
                            seenEpKeys.add(numKey);
                            parsed.push({
                                id: e.id,
                                number: epNum,
                                title: e.title,
                                url: e.url,
                                isFiller: false
                            });
                        }
                    });
                    return parsed;
                })(),
                trailers: [],
                seasons: [],
                recommendations: details.recommendations.map((r: any) => ({
                    id: r.id,
                    title: r.title,
                    poster: r.image,
                    type: r.type,
                    episodes: { sub: 0, dub: parseInt(r.episode || '0', 10) }
                })) as any[],
                related: [], 
                characters: []
            };

            if (!universalData.related || universalData.related.length === 0) {
                try {
                    const baseTitle = details.title.split(/season|part|\d+/i)[0].trim();
                    const searchData = await hpi.hindi.search(baseTitle, 1);
                    if (searchData && searchData.items) {
                        universalData.related = searchData.items
                            .filter((s: any) => {
                                if (universalData.related?.some((r: any) => r.id === s.id)) return false;
                                return isRelatedAnime(details.id, details.title, s.id, s.title);
                            })
                            .slice(0, 8)
                            .map((r: any) => ({
                                id: r.id,
                                title: r.title,
                                poster: r.image,
                                type: r.type,
                                episodes: { sub: 0, dub: parseInt(r.episode || '0', 10) }
                            }));
                    }
                } catch(e) {}
            }

            if (universalData.recommendations.length === 0 && details.genres && details.genres.length > 0) {
                try {
                    const genreSearch = await hpi.hindi.search(details.genres[0], 1);
                    if (genreSearch && genreSearch.items) {
                        universalData.recommendations = genreSearch.items
                            .filter((s: any) => s.id !== details.id)
                            .slice(0, 10)
                            .map((r: any) => ({
                                id: r.id,
                                title: r.title,
                                poster: r.image,
                                type: r.type,
                                episodes: { sub: 0, dub: parseInt(r.episode || '0', 10) }
                            }));
                    }
                } catch(e) {}
            }

            setAnime(universalData);

        } catch(e) { console.error(e); } finally { setIsLoadingInfo(false); }
    };
    init();
  }, [animeId]);

  useEffect(() => {
      if (!anime) return;
      const syncHistory = async () => {
          let progressMap: EpisodeProgress = {};
          let savedServer = null;
          const tempStorageKey = `shadow_sync_buffer_${animeId}`;
          let needsDbUpdate = false;
          let bufferToFlush: any[] = [];
          let localData: {[key: string]: any} = {};
          try { 
              const raw = localStorage.getItem(tempStorageKey); 
              if (raw) localData = JSON.parse(raw); 
              const epRaw = localStorage.getItem(`shadow_ep_progress_${animeId}`);
              if (epRaw) {
                  const epParsed = JSON.parse(epRaw);
                  localData = { ...epParsed, ...localData };
              }
          } catch {}
          let dbData: {[key: string]: any} = {};
          if (user && supabase) {
              try { 
                  const { data: dbRows } = await (supabase.from('user_continue_watching') as any)
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('anime_id', animeId);
                  if (dbRows && Array.isArray(dbRows)) {
                      dbRows.forEach((row: any) => {
                          if (row.episode_id) dbData[row.episode_id] = row;
                      });
                  }
              } catch (e) {
                  console.error("Failed to fetch direct user anime watch history:", e);
              }
          } else if (continueData) {
              try { 
                  continueData.forEach((row: any) => { 
                      if (row.anime_id === animeId) dbData[row.episode_id] = row; 
                  }); 
              } catch {}
          }
          const allEpIds = new Set([...Object.keys(localData), ...Object.keys(dbData)]);
          allEpIds.forEach(epId => {
              const local = localData[epId]; const db = dbData[epId]; let final = null;
              if (local && db) {
                  if (new Date(local.last_updated).getTime() > new Date(db.last_updated).getTime()) { final = local; needsDbUpdate = true; bufferToFlush.push(local); } else { final = db; }
              } else if (local) { final = local; needsDbUpdate = true; bufferToFlush.push(local); } else if (db) { final = db; }
              if (final) {
                  progressBuffer.current[epId] = final;
                  const dur = final.duration || 1350;
                  const epNum = final.episode_number || final.episode;
                  if (epNum) {
                      if (final.is_completed) {
                          progressMap[epNum] = 100;
                      } else {
                          const pVal = final.progress || 0;
                          const pct = (pVal <= 100 && !final.duration) ? pVal : Math.min(100, Math.round((pVal / dur) * 100));
                          progressMap[epNum] = pct;
                      }
                  }
                  if (final.last_server) savedServer = final.last_server;
              }
          });
          setEpProgress(progressMap);
          if (savedServer && savedServer !== settings.server) updateSetting('server', savedServer);
          localStorage.setItem(tempStorageKey, JSON.stringify(progressBuffer.current));
          if (user && needsDbUpdate && bufferToFlush.length > 0) {
              const sanitized = bufferToFlush.map(p => sanitizeContinueWatchingEntry(p, user.id)).filter(Boolean);
              (supabase!.from('user_continue_watching') as any).upsert(sanitized, { onConflict: 'user_id,episode_id' });
          }

          // Robust URL Episode Resolution
          const paramEp = urlEpId || urlEpNumber;
          let targetEpId: string | null = null;

          if (paramEp && anime.episodes?.length) {
              const paramStr = String(paramEp).trim();
              const paramNum = Number(paramStr);
              const urlMatch = anime.episodes.find(e => 
                  String(e.id) === paramStr || 
                  (!isNaN(paramNum) && Number(e.number) === paramNum) ||
                  String(e.number) === paramStr ||
                  String(e.id).endsWith(`-${paramStr}`) ||
                  String(e.id).endsWith(`=${paramStr}`) ||
                  String(e.id).endsWith(`::${paramStr}`) ||
                  String(e.id).includes(`::${paramStr}`)
              );
              if (urlMatch) targetEpId = urlMatch.id;
          }

          if (!targetEpId) {
              let maxTime = 0;
              Object.values(progressBuffer.current).forEach((p:any) => {
                  const t = new Date(p.last_updated).getTime();
                  if (t > maxTime) { maxTime = t; targetEpId = p.episode_id; }
              });
          }
          
          // If found from history and completed, advance to next episode if user didn't specify ?ep= in URL
          if (targetEpId && !paramEp && progressBuffer.current[targetEpId]?.is_completed && anime.episodes?.length > 0) {
              const curIdx = anime.episodes.findIndex((e: any) => e.id === targetEpId || String(e.number) === targetEpId);
              if (curIdx !== -1 && curIdx < anime.episodes.length - 1) {
                  targetEpId = anime.episodes[curIdx + 1].id;
              }
          }

          if (targetEpId && anime.episodes?.length > 0) {
              const epExists = anime.episodes.find((e: any) => e.id === targetEpId);
              if (!epExists) {
                  const oldData = Object.values(progressBuffer.current).find((p:any) => p.episode_id === targetEpId);
                  if (oldData && oldData.episode_number) {
                      const match = anime.episodes.find((e: any) => Number(e.number) === Number(oldData.episode_number));
                      targetEpId = match ? match.id : anime.episodes[0].id;
                  } else {
                      targetEpId = anime.episodes[0].id;
                  }
              }
          } else if (!targetEpId && anime.episodes?.length > 0) {
              targetEpId = anime.episodes[0].id;
          }

          if (targetEpId && !currentEpId) setCurrentEpId(targetEpId);
          setIsResumeLoaded(true);

          const urlTime = searchParams.get('timestamp') || searchParams.get('t');
          if (urlTime && !isNaN(Number(urlTime))) {
              setResumeTime(Number(urlTime));
          } else if (targetEpId && progressBuffer.current[targetEpId] && !progressBuffer.current[targetEpId].is_completed) {
              setResumeTime(progressBuffer.current[targetEpId].progress || 0);
          } else {
              setResumeTime(0);
          }
      };
      syncHistory();
  }, [anime, user?.id, animeId]);

  // Sync currentEpId when URL search params change (browser back/forward navigation only).
  // NOTE: Do NOT include currentEpId in deps — replaceState does NOT update useSearchParams.
  const currentEpIdRef = useRef(currentEpId);
  useEffect(() => { currentEpIdRef.current = currentEpId; }, [currentEpId]);

  useEffect(() => {
    if (!anime?.episodes?.length) return;
    const paramEp = urlEpId || urlEpNumber;
    if (!paramEp) return;
    const paramStr = String(paramEp).trim();
    const paramNum = Number(paramStr);
    const match = anime.episodes.find(e => 
      String(e.id) === paramStr || 
      (!isNaN(paramNum) && Number(e.number) === paramNum) ||
      String(e.number) === paramStr ||
      String(e.id).endsWith(`-${paramStr}`) ||
      String(e.id).endsWith(`=${paramStr}`) ||
      String(e.id).endsWith(`::${paramStr}`) ||
      String(e.id).includes(`::${paramStr}`)
    );
    if (match && match.id !== currentEpIdRef.current) {
      setCurrentEpId(match.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlEpId, urlEpNumber, anime]);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  const activeFetchRef = useRef(0);
  const failedServersRef = useRef<string[]>([]);
  const programmaticServerRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!currentEpId || !isSettingsLoaded) return;
    
    activeFetchRef.current += 1;
    const currentFetch = activeFetchRef.current;

    const loadStream = async () => {
        setStreamUrl(null); 
        setIsStreamLoading(true); 
        setStreamError(null);
        
        let time = 0; let isUrlOverride = false;
        if (urlTimestamp && urlEpNumber && anime) {
             const requestedEp = anime.episodes.find(e => e.number === Number(urlEpNumber));
             if (requestedEp && requestedEp.id === currentEpId) { time = Number(urlTimestamp); isUrlOverride = true; }
        }
        if (!isUrlOverride) {
            if (progressBuffer.current[currentEpId]) {
                const epRec = progressBuffer.current[currentEpId];
                time = epRec.is_completed ? 0 : (epRec.progress || 0);
            } else if (!user) {
                const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
                if (localData[animeId] && localData[animeId].episodeId === currentEpId) {
                    const epRec = localData[animeId];
                    time = epRec.is_completed ? 0 : (epRec.progress || 0);
                }
            }
        }
        setResumeTime(time); progressRef.current = time; setIsResumeLoaded(true);
        
        try {
            let targetCategory = settings.category;
            let streamData = await hpi.hindi.getStream(currentEpId);

            const hasStream = (data: any) => data && (data.url || data.iframe || data.targetUrl || data.stream?.file);

            if (streamData) { 
                let finalUrl = (streamData as any).url || (streamData as any).targetUrl || (streamData as any).iframe || (streamData as any).stream?.file;
                const mapServerArray = (arr: any[]) => {
                    const baseNames = arr.map(s => formatServerDisplayName(s.name || s.serverName || 'Server'));
                    const counts = baseNames.reduce((acc: any, val: string) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
                    const currentCounts: Record<string, number> = {};
                    return arr.map((s: any, idx: number) => {
                        let baseName = formatServerDisplayName(s.name || s.serverName || 'Server');
                        currentCounts[baseName] = (currentCounts[baseName] || 0) + 1;
                        if (counts[baseName] > 1) baseName = `${baseName} ${currentCounts[baseName]}`;
                        return { serverName: baseName, serverId: baseName + idx, url: s.url, isEmbed: s.isEmbed };
                    });
                };

                let subServers: any[] = [];
                let dubServers: any[] = [];
                let rawServers: any[] = [];

                const serversByCategory = (streamData as any).serversByCategory;
                if (serversByCategory) {
                    if (Array.isArray(serversByCategory.sub)) subServers = mapServerArray(serversByCategory.sub);
                    if (Array.isArray(serversByCategory.dub)) dubServers = mapServerArray(serversByCategory.dub);
                    if (Array.isArray(serversByCategory.raw)) rawServers = mapServerArray(serversByCategory.raw);
                }

                if (subServers.length === 0 && dubServers.length === 0 && rawServers.length === 0 && Array.isArray((streamData as any).servers)) {
                    dubServers = mapServerArray((streamData as any).servers);
                }

                const serverObj: Record<string, any[]> = { sub: subServers, dub: dubServers, raw: rawServers };
                setServers(serverObj);

                // Determine active category with available servers
                let activeCategory = settings.category;
                if (!serverObj[activeCategory] || serverObj[activeCategory].length === 0) {
                    if (dubServers.length > 0) activeCategory = 'dub';
                    else if (subServers.length > 0) activeCategory = 'sub';
                    else if (rawServers.length > 0) activeCategory = 'raw';

                    if (activeCategory !== settings.category) {
                        updateSetting('category', activeCategory as 'sub' | 'dub' | 'raw');
                    }
                }

                const activeList = serverObj[activeCategory] || [];
                const currentServer = activeList.find((s: any) => s.serverName.toLowerCase() === settings.server.toLowerCase()) || activeList[0];

                if (currentServer) {
                    finalUrl = currentServer.url;
                    setStreamIsEmbed(Boolean(currentServer.isEmbed));

                    if (finalUrl && currentServer && currentServer.serverName) {
                        if (currentServer.serverName.toLowerCase() !== settings.server.toLowerCase()) {
                            programmaticServerRef.current = currentServer.serverName.toLowerCase();
                            updateSetting('server', currentServer.serverName);
                        }
                    }
                    
                    setStreamUrl(finalUrl); 
                    setStreamReferer(streamData.referer || null); 

                    const incomingSubs = streamData.subtitles || [];
                    const hasCaptions = incomingSubs.some((s: any) => {
                        const lbl = (s.label || '').toLowerCase();
                        return !lbl.includes('thumb') && s.kind !== 'thumbnails';
                    });
                    if (hasCaptions) {
                        episodeSubtitlesRef.current = incomingSubs;
                        setSubtitles(incomingSubs);
                    } else if (episodeSubtitlesRef.current.length > 0) {
                        setSubtitles(episodeSubtitlesRef.current);
                    } else {
                        setSubtitles(incomingSubs);
                    }

                    setIntro(streamData.intro); 
                    setOutro(streamData.outro);
                    
                } else if (finalUrl) {
                    setStreamUrl(finalUrl);
                    setStreamIsEmbed(false);
                    setStreamReferer(streamData.referer || null);

                    const incomingSubs = streamData.subtitles || [];
                    const hasCaptions = incomingSubs.some((s: any) => {
                        const lbl = (s.label || '').toLowerCase();
                        return !lbl.includes('thumb') && s.kind !== 'thumbnails';
                    });
                    if (hasCaptions) {
                        episodeSubtitlesRef.current = incomingSubs;
                        setSubtitles(incomingSubs);
                    } else if (episodeSubtitlesRef.current.length > 0) {
                        setSubtitles(episodeSubtitlesRef.current);
                    } else {
                        setSubtitles(incomingSubs);
                    }

                    setIntro(streamData.intro);
                    setOutro(streamData.outro);
                } else {
                    throw new Error("No Stream Found");
                }
            } else { 
                throw new Error("Portal Unstable"); 
            }
        } catch(e) { 
            if (currentFetch === activeFetchRef.current) setStreamError("Portal Unstable"); 
        }
        if (currentFetch === activeFetchRef.current) setIsStreamLoading(false);
    };
    loadStream();
  }, [currentEpId, user?.id, animeId, isSettingsLoaded, urlType, fetchTrigger]);

  const initialSettingsMount = useRef(true);
  useEffect(() => {
      if (initialSettingsMount.current) {
          initialSettingsMount.current = false;
          return;
      }
      if (programmaticServerRef.current === settings.server.toLowerCase()) {
          programmaticServerRef.current = null;
          return;
      }
      if (isSettingsLoaded && currentEpId) {
          setFetchTrigger(prev => prev + 1);
      }
  }, [settings.server, settings.category]);

  useEffect(() => { const i = setInterval(() => saveProgress(true), 10000); return () => clearInterval(i); }, [saveProgress]);

  useEffect(() => {
      let ticking = false;
      const handleScroll = () => { if (!ticking) { window.requestAnimationFrame(() => { if (window.scrollY > 100) { setHideInterface(false); if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current); } else { resetInterfaceTimer(); } ticking = false; }); ticking = true; } };
      window.addEventListener('scroll', handleScroll); handleScroll(); return () => window.removeEventListener('scroll', handleScroll);
  }, [resetInterfaceTimer]);
  useEffect(() => { const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') flushSyncBuffer(); }; document.addEventListener('visibilitychange', handleVisibilityChange); return () => document.removeEventListener('visibilitychange', handleVisibilityChange); }, [flushSyncBuffer]);

  const episodeChunks = useMemo(() => {
      if(!anime) return [];
      const chunks = [];
      for(let i=0; i<anime.episodes.length; i+=chunkSize) chunks.push(anime.episodes.slice(i, i+chunkSize));
      return chunks;
  }, [anime?.episodes, chunkSize]);

  const currentEpIndex = anime?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEpisode = anime?.episodes[currentEpIndex];
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < (anime?.episodes.length || 0) - 1 ? anime?.episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? anime?.episodes[currentEpIndex - 1] : null;

  // ✅ Iframe elapsed-time tracker + postMessage listener:
  // Tracks playback for embed streams, updates episode markers, and triggers auto skip & auto next
  useEffect(() => {
      if (iframeTimerRef.current) {
          clearInterval(iframeTimerRef.current);
          iframeTimerRef.current = null;
      }
      if (!streamUrl || !currentEpId) return;

      const handleMessage = (e: MessageEvent) => {
          try {
              let data = e.data;
              if (typeof data === 'string') {
                  try { data = JSON.parse(data); } catch { return; }
              }
              if (!data || typeof data !== 'object') return;

              const time = data.time ?? data.currentTime ?? data.seconds ?? data.value;
              const dur = data.duration ?? data.total;

              if (typeof dur === 'number' && dur > 0) {
                  embedDurationRef.current = dur;
              }

              if (typeof time === 'number' && time >= 0) {
                  progressRef.current = time;
                  const ep = anime?.episodes.find((epItem: any) => epItem.id === currentEpId);
                  const epDur = embedDurationRef.current || 1440;
                  const pct = Math.min(100, Math.round((time / epDur) * 100));
                  if (ep) {
                      setEpProgress((prev: any) => ({ ...prev, [ep.number]: pct, [ep.id]: pct }));
                  }
              }

              if (data.event === 'ended' || data.type === 'ended') {
                  saveProgress(true);
                  if (settings.autoNext && nextEpisode) {
                      handleEpisodeClick(nextEpisode.id);
                  }
              }
          } catch { }
      };

      window.addEventListener('message', handleMessage);

      if (streamIsEmbed) {
          iframeElapsedRef.current = resumeTime || progressRef.current || 0;
          iframeTimerRef.current = setInterval(() => {
              if (document.visibilityState !== 'visible') return;

              iframeElapsedRef.current += 1;
              progressRef.current = iframeElapsedRef.current;
              const currentPos = progressRef.current;
              const epDur = embedDurationRef.current || 1440;
              const pct = Math.min(100, Math.round((currentPos / epDur) * 100));

              const ep = anime?.episodes.find((epItem: any) => epItem.id === currentEpId);
              if (ep) {
                  setEpProgress((prev: any) => ({
                      ...prev,
                      [ep.number]: pct >= 98 ? 100 : pct,
                      [ep.id]: pct >= 98 ? 100 : pct
                  }));
              }

              // Auto-skip intro if markers exist
              if (settings.autoSkip && intro?.start && intro?.end) {
                  if (currentPos >= intro.start && currentPos < intro.end && !lastAutoSkippedIntroRef.current) {
                      lastAutoSkippedIntroRef.current = true;
                      progressRef.current = intro.end;
                      iframeElapsedRef.current = intro.end;
                      handleSkipIntro();
                      playerRef.current?.seekTo(intro.end);
                  }
              }

              // Auto-skip outro if markers exist
              if ((settings.autoSkipOutro ?? settings.autoSkip) && outro?.start !== undefined) {
                  const epOutroEnd = outro.end || epDur;
                  if (currentPos >= outro.start && currentPos <= epOutroEnd && !lastAutoSkippedOutroRef.current) {
                      lastAutoSkippedOutroRef.current = true;
                      progressRef.current = epOutroEnd;
                      iframeElapsedRef.current = epOutroEnd;
                      handleSkipOutro();
                      playerRef.current?.seekTo(epOutroEnd);
                      if (settings.autoNext && nextEpisode) {
                          handleEpisodeClick(nextEpisode.id);
                      }
                  }
              }

              // Auto-next episode near completion
              if (settings.autoNext && nextEpisode && !lastAutoNextTriggeredRef.current) {
                  if (currentPos >= epDur - 15 || pct >= 98) {
                      lastAutoNextTriggeredRef.current = true;
                      saveProgress(true);
                      handleEpisodeClick(nextEpisode.id);
                  }
              }
          }, 1000);
      } else {
          iframeElapsedRef.current = 0;
      }

      return () => {
          window.removeEventListener('message', handleMessage);
          if (iframeTimerRef.current) {
              clearInterval(iframeTimerRef.current);
              iframeTimerRef.current = null;
          }
      };
  }, [streamIsEmbed, streamUrl, currentEpId, anime?.episodes, settings.autoSkip, settings.autoSkipOutro, settings.autoNext, intro, outro, nextEpisode, saveProgress, handleEpisodeClick, handleSkipIntro, handleSkipOutro, resumeTime]);

  useEffect(() => {
      if (anime) {
          const epPrefix = currentEpisode ? `Ep ${currentEpisode.number} - ` : '';
          document.title = `${epPrefix}${anime.title} | Shadow Garden`;
      }
  }, [anime, currentEpisode]);

  if (!anime) return (<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none selection:bg-primary-500/30">
      <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; display: block; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; opacity: 0.8; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
          body { overflow-y: auto; } ::-webkit-scrollbar { width: 0px; display: none; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes liquid { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-liquid { background-size: 200% 200%; animation: liquid 4s ease infinite; } .will-change-transform { will-change: transform; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } } .animate-shimmer { animation: shimmer 3s infinite linear; }
          @keyframes audio-bar-1 { 0%, 100% { height: 3px; } 50% { height: 11px; } }
          @keyframes audio-bar-2 { 0%, 100% { height: 9px; } 50% { height: 3px; } }
          @keyframes audio-bar-3 { 0%, 100% { height: 5px; } 50% { height: 12px; } }
          @keyframes available-wave-1 { 0%, 100% { height: 2.5px; opacity: 0.45; } 50% { height: 7px; opacity: 1; } }
          @keyframes available-wave-2 { 0%, 100% { height: 7px; opacity: 1; } 50% { height: 2.5px; opacity: 0.45; } }
          @keyframes available-sheen { 0% { transform: translateX(-150%); } 100% { transform: translateX(250%); } }
      `}</style>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className={cn("w-full flex flex-col items-center relative px-4 pt-0 mt-0 z-10")}>
        <div onClick={() => updateSetting('dimMode', false)} className={cn("fixed inset-0 bg-black/95 transition-opacity duration-500 will-change-[opacity]", settings.dimMode ? 'opacity-100 pointer-events-auto cursor-pointer z-[40]' : 'opacity-0 pointer-events-none z-[40]')} />
        <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-8 xl:items-stretch">
            <div className="xl:col-span-8 w-full flex flex-col justify-between gap-2 order-1">
                <div 
                    ref={playerContainerRef} 
                    tabIndex={0} 
                    style={playerAspectRatio ? { aspectRatio: `${playerAspectRatio}` } : undefined}
                    className={cn(
                        "w-full bg-black/40 backdrop-blur-2xl rounded-[30px] overflow-hidden border border-white/10 relative outline-none focus:ring-1 focus:ring-white/10 transition-all duration-300", 
                        !playerAspectRatio && "aspect-video",
                        settings.dimMode ? "z-[60] ring-2 ring-orange-500/50 shadow-[0_0_80px_rgba(0,0,0,0.9)]" : "z-10"
                    )} 
                    onClick={handlePlayerClick} 
                    onKeyDown={(e) => { if (e.code === 'Space') { e.preventDefault(); } }}
                >
                <AnimatePresence>
                    {showSkipNotification && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-32 lg:bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-black/60 backdrop-blur-md border border-white/10 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none">
                            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center"><Check size={8} className="text-black stroke-[4]" /></div><span className="text-[9px] font-bold uppercase tracking-wider">{skipNotificationText}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                {streamUrl ? ( 
                    <HindiPlayer 
                        key={currentEpId} 
                        ref={playerRef} 
                        episodeId={currentEpId}
                        url={streamUrl || ""} 
                        isEmbed={streamIsEmbed}
                        isM3U8={!streamIsEmbed && !streamUrl.toLowerCase().includes('.mp4')}
                        iframeUrl={streamUrl.includes('/api/proxy?url=') ? decodeURIComponent(streamUrl.split('/api/proxy?url=')[1].split('&')[0]) : streamUrl}
                        referer={streamReferer} 
                        subtitles={subtitles} 
                        intro={intro} 
                        outro={outro} 
                        title={currentEpisode?.title || anime.title} 
                        startTime={resumeTime} 
                        autoPlay={settings.autoPlay} 
                        autoSkip={settings.autoSkip} 
                        autoSkipOutro={settings.autoSkipOutro ?? settings.autoSkip}
                        initialVolume={settings.volume} 
                        onProgress={(s:any) => progressRef.current = s.playedSeconds} 
                        onEnded={() => { saveProgress(true); if(settings.autoNext && nextEpisode) handleEpisodeClick(nextEpisode.id); }} 
                        onNext={() => { if(nextEpisode) handleEpisodeClick(nextEpisode.id); }}
                        onInteract={() => { if(!hideInterface) resetInterfaceTimer(); }} 
                        onPlay={handlePlaybackStart} 
                        onPause={handlePause} 
                        onSkipIntro={handleSkipIntro} 
                        onSkipOutro={handleSkipOutro}
                        onAspectRatioChange={setPlayerAspectRatio}
                        onSettingsChange={updateSetting}
                        onError={(err) => { console.warn("Player Error, forcing reload..."); failedServersRef.current.push(settings.server.toLowerCase()); setFetchTrigger(prev => prev + 1); }} 
                    /> 
                ) : streamError ? ( <div className="w-full h-full flex items-center justify-center border-b border-white/5"><div className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{streamError}</div></div> ) : ( <div className="w-full h-full flex items-center justify-center border-b border-white/5"><PlayerSkeleton /></div> )}
            </div>

            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full transition-all duration-500 will-change-transform">
                <div className={cn("hidden lg:flex w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[30px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] px-5 py-3.5 flex-col gap-3 overflow-visible mt-3 transition-all duration-500", settings.dimMode ? "z-[96] relative" : "relative z-10")}>
                    {/* ROW 1: Playback Navigation, Automations & Stream Config */}
                    <div className="flex w-full justify-between items-center gap-3">
                        {/* Left: Playback & Automation Buttons */}
                        <div className="flex items-center gap-1.5 md:gap-2 flex-nowrap shrink-0">
                            <button
                                disabled={!prevEpisode}
                                onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40 whitespace-nowrap",
                                    prevEpisode
                                        ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-orange-600 hover:border-orange-500 hover:text-white"
                                        : "opacity-20 border-white/5 text-zinc-600 cursor-not-allowed"
                                )}
                            >
                                <SkipBack size={12}/> PREV EP
                            </button>
                            <button
                                onClick={() => updateSetting('autoSkip', !settings.autoSkip)}
                                className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap"
                                title="Auto Skip Intro"
                            >
                                <FastForward size={12} className={cn("transition-colors", settings.autoSkip ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "text-zinc-500")}/>
                                <span className={cn(settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP INTRO</span>
                            </button>
                            <button
                                onClick={() => updateSetting('autoSkipOutro', !(settings.autoSkipOutro ?? settings.autoSkip))}
                                className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap"
                                title="Auto Skip Outro"
                            >
                                <SkipForward size={12} className={cn("transition-colors", (settings.autoSkipOutro ?? settings.autoSkip) ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "text-zinc-500")}/>
                                <span className={cn((settings.autoSkipOutro ?? settings.autoSkip) ? "text-white" : "text-zinc-500")}>SKIP OUTRO</span>
                            </button>
                            <button
                                onClick={() => updateSetting('autoPlay', !settings.autoPlay)}
                                className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap"
                                title="Auto Play"
                            >
                                <Play size={12} className={cn("transition-colors", settings.autoPlay ? "text-orange-500 shadow-[0_0_10px_orange]" : "text-zinc-500")}/>
                                <span className={cn(settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span>
                            </button>
                            <button
                                onClick={() => updateSetting('autoNext', !settings.autoNext)}
                                className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap"
                                title="Auto Next"
                            >
                                <SkipForward size={12} className={cn("transition-colors", settings.autoNext ? "text-orange-500 shadow-[0_0_10px_orange]" : "text-zinc-500")}/>
                                <span className={cn(settings.autoNext ? "text-white" : "text-zinc-500")}>NEXT</span>
                            </button>
                            {nextEpisode ? (
                                <button
                                    onClick={() => handleEpisodeClick(nextEpisode.id)}
                                    className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 whitespace-nowrap group"
                                >
                                    NEXT EP <SkipForward size={12} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-30 cursor-not-allowed"
                                >
                                    NEXT EP <SkipForward size={12}/>
                                </button>
                            )}
                        </div>

                        {/* Right: Category selection + Dim Mode */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                            <div className="flex bg-black/50 rounded-full p-1 border border-white/10 shadow-inner flex-shrink-0 relative">
                                {(['sub', 'dub', 'raw'] as const).map((cat) => {
                                    const isAvailable = (servers?.[cat]?.length || 0) > 0;
                                    const isCurrent = settings.category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            disabled={!isAvailable}
                                            onClick={() => updateSetting('category', cat)}
                                            className={cn(
                                                "px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all relative active:scale-95 flex items-center justify-center gap-1.5 overflow-hidden",
                                                isCurrent
                                                    ? "text-white shadow-lg z-10"
                                                    : isAvailable
                                                        ? "text-zinc-400 hover:text-white hover:bg-white/5"
                                                        : "opacity-25 pointer-events-none text-zinc-600"
                                            )}
                                            title={isAvailable ? `Switch to ${cat}` : `${cat} not available`}
                                        >
                                            {isCurrent && (
                                                <motion.div
                                                    layoutId="activeAudioPillHindiDesktop"
                                                    className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full -z-10 shadow-[0_0_15px_rgba(234,88,12,0.5)]"
                                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                                />
                                            )}
                                            {isAvailable && !isCurrent && (
                                                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-full opacity-25">
                                                    <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[available-sheen_3.5s_infinite]" />
                                                </div>
                                            )}
                                            <span>{cat}</span>
                                            {isAvailable && isCurrent && (
                                                <span className="inline-flex items-end gap-[2px] h-3 ml-0.5" aria-hidden="true">
                                                    <span className="w-[2px] bg-white rounded-full animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
                                                    <span className="w-[2px] bg-white rounded-full animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
                                                    <span className="w-[2px] bg-white rounded-full animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
                                                </span>
                                            )}
                                            {isAvailable && !isCurrent && (
                                                <span className="inline-flex items-end gap-[1.5px] h-2.5 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity" title="Available">
                                                    <span className="w-[1.5px] bg-orange-400 rounded-full animate-[available-wave-1_1.4s_ease-in-out_infinite]" />
                                                    <span className="w-[1.5px] bg-orange-400 rounded-full animate-[available-wave-2_1.4s_ease-in-out_infinite]" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <Button
                                onClick={() => updateSetting('dimMode', !settings.dimMode)}
                                variant="ghost"
                                size="icon"
                                className={cn("rounded-full w-8 h-8 transition-all hover:scale-110 flex-shrink-0 border", settings.dimMode ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/40" : "text-zinc-500 hover:text-zinc-200 bg-white/5 border-white/5 hover:bg-white/10")}
                                title="Theater Dim Mode"
                            >
                                <Lightbulb size={13} />
                            </Button>
                        </div>
                    </div>

                    {/* ROW 2: Episode Context, Countdown Timer, Server Selector & Quick Actions */}
                    <div className="flex w-full justify-between items-center gap-3 border-t border-white/5 pt-2.5">
                        {/* Left: Episode info & live countdown timer */}
                        <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                            <div className="min-w-0 max-w-[280px] xl:max-w-[380px] flex items-center">
                                <MarqueeTitle text={currentEpisode?.title ? `EP ${currentEpisode.number}: ${currentEpisode.title}` : `Episode ${currentEpisode?.number || '1'}`} />
                            </div>
                            <div className="shrink-0">
                                <NextEpisodeTimer schedule={nextEpSchedule} status={anime.info.status} />
                            </div>
                        </div>

                        {/* Right: Server Selector + Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {mounted ? (
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-300 hover:text-white uppercase transition-all shadow-md shadow-orange-900/5 whitespace-nowrap rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3.5">
                                            <ServerIcon size={12} className="text-orange-500" />
                                            {servers?.[settings.category] && servers[settings.category].length > 0
                                                ? (() => {
                                                    const active = servers[settings.category].find((s: any) => s.serverName.toLowerCase() === settings.server.toLowerCase());
                                                    return formatServerDisplayName(active ? active.serverName : servers[settings.category][0].serverName);
                                                })()
                                                : (isStreamLoading ? 'Loading...' : 'No Portals')}
                                            <ChevronDown size={11} className="text-zinc-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-[0_0_25px_-5px_rgba(234,88,12,0.4)] z-[40] min-w-[140px] w-auto h-auto max-h-[220px] p-2">
                                        <ScrollArea className="h-auto max-h-[190px] custom-scrollbar">
                                            <div className="flex flex-col gap-1">
                                                {servers?.[settings.category]?.map((srv: any, idx: number) => (
                                                    <DropdownMenuItem
                                                        key={srv.serverId || idx}
                                                        onClick={() => handleServerChange(srv.serverName)}
                                                        className={cn(
                                                            "cursor-pointer focus:bg-orange-600 focus:text-white px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-1 transition-all",
                                                            settings.server.toLowerCase() === srv.serverName.toLowerCase()
                                                                ? "bg-orange-600 text-white shadow-lg"
                                                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                                                        )}
                                                    >
                                                        {formatServerDisplayName(srv.serverName)}
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-300 hover:text-white uppercase transition-all shadow-md shadow-orange-900/5 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3.5">
                                    <ServerIcon size={12}/>
                                    {servers?.[settings.category] && servers[settings.category].length > 0
                                        ? (() => {
                                            const active = servers[settings.category].find((s: any) => s.serverName.toLowerCase() === settings.server.toLowerCase());
                                            return formatServerDisplayName(active ? active.serverName : servers[settings.category][0].serverName);
                                        })()
                                        : (isStreamLoading ? 'Loading...' : 'No Portals')}
                                    <ChevronDown size={11}/>
                                </Button>
                            )}

                            <WatchListButton
                                animeId={anime.id}
                                animeTitle={anime.title}
                                animeImage={anime.poster}
                                currentEp={currentEpisode?.number}
                                mediaType="hindi"
                                totalEpisodes={anime.episodes?.length || 1}
                                type={(anime as any).type || (anime.info as any)?.stats?.type || "TV"}
                            />
                            {currentEpId && (
                                <Link
                                    href={`/download/hindi/${anime.id}?ep=${currentEpId}`}
                                    className="flex items-center justify-center px-3.5 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white whitespace-nowrap shadow-md shadow-orange-900/5 gap-1.5"
                                    title="Download Episode"
                                >
                                    <Download size={12} /> <span className="hidden xl:inline">Download</span>
                                </Link>
                            )}
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white whitespace-nowrap shadow-md"
                                title="Share Episode"
                            >
                                <Share2 size={12} /> Share
                            </button>
                            <button
                                onClick={handleCreateWatchRoom}
                                className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white whitespace-nowrap shadow-md cursor-pointer"
                                title="Create Watch Room"
                            >
                                <Users size={12} /> <span className="hidden sm:inline">Room</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MOBILE CONTROLS */}
                <div className={cn("flex lg:hidden w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] px-3 py-3 flex-col gap-2.5 overflow-hidden mt-3 transition-all duration-500", settings.dimMode ? "z-[96] relative" : "relative z-10")}>
                    {/* Row 1: Playback Navigation & Automation Toggles */}
                    <div className="flex w-full justify-between items-center gap-1.5">
                        <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className="flex-1 bg-white/5 h-8 sm:h-9 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all" title="Previous Episode"><SkipBack size={13}/></button>
                        <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className={cn("flex-1 h-8 sm:h-9 rounded-full border flex items-center justify-center transition-all relative active:scale-95", settings.autoSkip ? "bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]" : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200")} title={`Auto Skip Intro: ${settings.autoSkip ? 'ON' : 'OFF'}`}>
                            <div className="relative flex items-center justify-center">
                                <FastForward size={13} className={cn("transition-transform", settings.autoSkip && "scale-110")} />
                                <span className={cn("absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full transition-all", settings.autoSkip ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,1)] animate-pulse" : "bg-zinc-600/40")} />
                            </div>
                        </button>
                        <button onClick={() => updateSetting('autoSkipOutro', !(settings.autoSkipOutro ?? settings.autoSkip))} className={cn("flex-1 h-8 sm:h-9 rounded-full border flex items-center justify-center transition-all relative active:scale-95", (settings.autoSkipOutro ?? settings.autoSkip) ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.25)]" : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200")} title={`Auto Skip Outro: ${(settings.autoSkipOutro ?? settings.autoSkip) ? 'ON' : 'OFF'}`}>
                            <div className="relative flex items-center justify-center">
                                <SkipForward size={13} className={cn("transition-transform", (settings.autoSkipOutro ?? settings.autoSkip) && "scale-110")} />
                                <span className={cn("absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full transition-all", (settings.autoSkipOutro ?? settings.autoSkip) ? "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,1)] animate-pulse" : "bg-zinc-600/40")} />
                            </div>
                        </button>
                        <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className={cn("flex-1 h-8 sm:h-9 rounded-full border flex items-center justify-center transition-all relative active:scale-95", settings.autoPlay ? "bg-orange-600/20 border-orange-500/60 text-orange-400 shadow-[0_0_12px_rgba(234,88,12,0.25)]" : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200")} title={`Auto Play: ${settings.autoPlay ? 'ON' : 'OFF'}`}>
                            <div className="relative flex items-center justify-center">
                                <PlayCircle size={13} className={cn("transition-transform", settings.autoPlay && "scale-110")} />
                                <span className={cn("absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full transition-all", settings.autoPlay ? "bg-orange-500 shadow-[0_0_6px_rgba(234,88,12,1)] animate-pulse" : "bg-zinc-600/40")} />
                            </div>
                        </button>
                        <button onClick={() => updateSetting('autoNext', !settings.autoNext)} className={cn("flex-1 h-8 sm:h-9 rounded-full border flex items-center justify-center transition-all relative active:scale-95", settings.autoNext ? "bg-orange-600/20 border-orange-500/60 text-orange-400 shadow-[0_0_12px_rgba(234,88,12,0.25)]" : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200")} title={`Auto Next Episode: ${settings.autoNext ? 'ON' : 'OFF'}`}>
                            <div className="relative flex items-center justify-center">
                                <StepForward size={13} className={cn("transition-transform", settings.autoNext && "scale-110")} />
                                <span className={cn("absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full transition-all", settings.autoNext ? "bg-orange-500 shadow-[0_0_6px_rgba(234,88,12,1)] animate-pulse" : "bg-zinc-600/40")} />
                            </div>
                        </button>
                        <button disabled={!nextEpisode} onClick={() => nextEpisode && handleEpisodeClick(nextEpisode.id)} className="flex-1 bg-white/5 h-8 sm:h-9 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all" title="Next Episode"><SkipForward size={13}/></button>
                    </div>

                    {/* Row 2: Category selection & Theater Dim Mode */}
                    <div className="flex w-full items-center gap-2">
                        <div className="flex bg-black/50 rounded-full p-1 border border-white/10 shadow-inner flex-1 justify-center relative">
                            {(['sub', 'dub', 'raw'] as const).map((cat) => {
                                const isAvailable = (servers?.[cat]?.length || 0) > 0;
                                const isCurrent = settings.category === cat;
                                return (
                                    <button
                                        key={cat}
                                        disabled={!isAvailable}
                                        onClick={() => updateSetting('category', cat)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all relative active:scale-95 shadow-sm flex-1 text-center flex items-center justify-center gap-1 overflow-hidden",
                                            isCurrent
                                                ? "text-white shadow-lg z-10"
                                                : isAvailable
                                                    ? "text-zinc-400 hover:text-white"
                                                    : "opacity-25 pointer-events-none text-zinc-600"
                                        )}
                                    >
                                        {isCurrent && (
                                            <motion.div
                                                layoutId="activeAudioPillHindiMobile"
                                                className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full -z-10 shadow-[0_0_12px_rgba(234,88,12,0.5)]"
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        {isAvailable && !isCurrent && (
                                            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-full opacity-25">
                                                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[available-sheen_3.5s_infinite]" />
                                            </div>
                                        )}
                                        <span>{cat}</span>
                                        {isAvailable && isCurrent && (
                                            <span className="inline-flex items-end gap-[1.5px] h-2.5" aria-hidden="true">
                                                <span className="w-[1.5px] bg-white rounded-full animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
                                                <span className="w-[1.5px] bg-white rounded-full animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
                                                <span className="w-[1.5px] bg-white rounded-full animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
                                            </span>
                                        )}
                                        {isAvailable && !isCurrent && (
                                            <span className="inline-flex items-end gap-[1.5px] h-2 ml-0.5 opacity-60" title="Available">
                                                <span className="w-[1.5px] bg-orange-400 rounded-full animate-[available-wave-1_1.4s_ease-in-out_infinite]" />
                                                <span className="w-[1.5px] bg-orange-400 rounded-full animate-[available-wave-2_1.4s_ease-in-out_infinite]" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 shrink-0 border", settings.dimMode ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/40" : "text-zinc-400 bg-white/5 border-white/5")} title="Theater Dim Mode">
                            <Lightbulb size={14} />
                        </Button>
                    </div>

                    {/* Row 3: Now Playing Context & Schedule Timer */}
                    <div className="flex w-full items-center gap-2">
                        <div className="min-w-0 flex-1"><MarqueeTitle text={currentEpisode?.title ? `EP ${currentEpisode.number}: ${currentEpisode.title}` : `Episode ${currentEpisode?.number || '1'}`} /></div>
                        <NextEpisodeTimer schedule={nextEpSchedule} status={anime.info.status} />
                    </div>

                    {/* Row 4: Server Selector & Actions */}
                    <div className="flex w-full items-center justify-between gap-2 pt-1 border-t border-white/5">
                        {mounted ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 gap-1.5 text-[9px] font-black text-zinc-300 bg-white/5 rounded-full border border-white/10 px-3 flex-1 justify-between max-w-[170px]">
                                        <span className="flex items-center gap-1.5 truncate">
                                            <ServerIcon size={11} className="text-orange-500 shrink-0"/> 
                                            <span className="truncate">
                                                {servers?.[settings.category] && servers[settings.category].length > 0
                                                ? (() => { const active = servers[settings.category].find((s:any) => s.serverName.toLowerCase() === settings.server.toLowerCase()); return formatServerDisplayName(active ? active.serverName : servers[settings.category][0].serverName); })()
                                                : (isStreamLoading ? 'Loading...' : 'None')}
                                            </span>
                                        </span>
                                        <ChevronDown size={10} className="text-zinc-500 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-[#0a0a0a] border border-white/10 rounded-[20px] p-1.5 shadow-[0_0_25px_-5px_rgba(234,88,12,0.4)] z-[70] min-w-[140px]">
                                    <ScrollArea className="h-auto max-h-[160px]">
                                        <div className="flex flex-col gap-1">
                                            {servers?.[settings.category]?.map((srv: any, idx: number) => (
                                                <DropdownMenuItem
                                                    key={srv.serverId || idx}
                                                    onClick={() => handleServerChange(srv.serverName)}
                                                    className={cn(
                                                        "text-[9px] uppercase font-bold px-2.5 py-1.5 rounded-full cursor-pointer",
                                                        settings.server.toLowerCase() === srv.serverName.toLowerCase() ? "bg-orange-600 text-white" : "text-zinc-400 hover:bg-white/10"
                                                    )}
                                                >
                                                    {formatServerDisplayName(srv.serverName)}
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button variant="ghost" className="h-8 gap-1.5 text-[9px] font-black text-zinc-400 bg-white/5 rounded-full border border-white/5 px-2.5">
                                <ServerIcon size={11} className="text-orange-500 shrink-0"/> 
                                <span>Server</span>
                            </Button>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                            <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} mediaType="hindi" totalEpisodes={anime.episodes?.length || 1} type={(anime as any).type || (anime.info as any)?.stats?.type || "TV"} />
                            {currentEpId && (
                                <Link
                                    href={`/download/hindi/${anime.id}?ep=${currentEpId}`}
                                    className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 flex items-center justify-center transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white"
                                    title="Download Episode"
                                >
                                    <Download size={13} />
                                </Link>
                            )}
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 flex items-center justify-center transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white"
                                title="Share Episode"
                            >
                                <Share2 size={13} />
                            </button>
                            <button
                                onClick={handleCreateWatchRoom}
                                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 flex items-center justify-center transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white"
                                title="Create Watch Room"
                            >
                                <Users size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
            </div>
            
            <div className="xl:col-span-4 w-full h-full min-h-[420px] max-h-[520px] xl:max-h-none bg-black/40 backdrop-blur-2xl rounded-[30px] border border-white/10 overflow-hidden flex flex-col relative z-20 order-2">
                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"><h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-lemon tracking-widest"><Layers size={18} className="text-orange-600"/> Episodes</h3><Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white font-black text-[10px] px-3 h-5 rounded-full">{anime.episodes.length}</Badge></div>
                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                        <button onClick={() => setEpViewMode('compact')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'compact' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><Grid size={14}/></button>
                        <button onClick={() => setEpViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'grid' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><LayoutGrid size={14}/></button>
                        <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'list' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><List size={14}/></button>
                    </div>
                </div>
                <div className="w-full border-b border-white/10 bg-white/5 backdrop-blur-md flex-shrink-0 py-3 relative group/chunks">
                    <div ref={chunksRef} className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing px-4">
                        {episodeChunks.map((chunk, idx) => (
                            <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full transition-all border shadow-sm uppercase tracking-wider backdrop-blur-md", epChunkIndex === idx ? "bg-orange-600 text-white border-orange-500 shadow-orange-900/20" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10")}>{getChunkLabel(chunk, (idx * chunkSize) + 1, Math.min((idx + 1) * chunkSize, anime.episodes.length))}</button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-2 custom-scrollbar overflow-x-hidden">
                    <LayoutGroup>
                        <motion.div layout className={cn("p-2 transition-all duration-500 ease-in-out grid", epViewMode === 'grid' ? 'grid-cols-5 gap-2.5' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-2')}>
                            <AnimatePresence mode="popLayout">
                                {episodeChunks[epChunkIndex]?.map((ep) => {
                                    const percent = epProgress[ep.number] || 0;
                                    const isFullyPlayed = percent >= 98;
                                    const isCurrent = ep.id === currentEpId ||
                                        String(ep.id) === String(currentEpId) ||
                                        String(ep.number) === String(currentEpId) ||
                                        String(ep.id).endsWith(`::${currentEpId}`) ||
                                        String(ep.id).endsWith(`-${currentEpId}`) ||
                                        String(ep.id).endsWith(`=${currentEpId}`);
                                    return (
                                        <EpisodeButton key={ep.id} ep={ep} isCurrent={isCurrent} isFullyPlayed={isFullyPlayed} percent={percent} viewMode={epViewMode} onClick={handleEpisodeClick} category="anime" progressRef={progressRef} playerRef={playerRef} />
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    </LayoutGroup>
                </div>
            </div>

            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="xl:col-span-8 w-full h-auto bg-black/40 backdrop-blur-2xl rounded-[40px] border border-white/10 overflow-hidden flex flex-col relative order-4">
                    {/* Banner backdrop foreshadow: clear upwards, smoothly darkened towards bottom */}
                    {((anime as any).banner || anime.poster) && (
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[40px]">
                            <div
                                className="absolute inset-0 bg-cover bg-top sm:bg-center opacity-30 sm:opacity-40 scale-105 transition-all duration-700"
                                style={{ 
                                    backgroundImage: `url(${getSafeImageUrl((anime as any).banner || anime.poster)})`, 
                                    filter: 'blur(2px)' 
                                }}
                            />
                            {/* Clear to upwards, smoothly darkened to the bottom */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 via-35% to-[#020617]" />
                            {/* Soft side feathering */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/60 via-transparent to-[#020617]/60" />
                        </div>
                    )}
                    <div className="flex-shrink-0 relative z-10 p-8 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-orange-600/5 to-transparent">
                        <div className="relative shrink-0 lg:mx-0 flex flex-col gap-6 w-full lg:w-auto items-center lg:items-start text-center lg:text-left">
                            <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] sm:mx-0 w-fit">
                                <img
                                    src={getSafeImageUrl(anime.poster)}
                                    onError={(e) => {
                                        if (e.currentTarget.src.startsWith('/api/proxy')) {
                                            e.currentTarget.src = '/images/placeholder-no-img.jpg';
                                        } else if (e.currentTarget.src.startsWith('http')) {
                                            e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(e.currentTarget.src)}`;
                                        } else {
                                            e.currentTarget.src = '/images/placeholder-no-img.jpg';
                                        }
                                    }}
                                    className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl shadow-black"
                                    alt={anime.title}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className="flex lg:hidden flex-col gap-3 w-full items-center text-center">
                                <h1 className="text-2xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-2xl shadow-black scale-[0.85] origin-center">{anime.title}</h1>
                                <div className="flex flex-wrap gap-3 mt-3 justify-center items-center">
                                    <div className="flex items-center flex-wrap justify-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20 max-w-full">
                                        {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult) && (
                                            <>
                                                <span className={cn(formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('18') || formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('R') ? "text-orange-500 font-black" : "text-zinc-300 font-bold")}>
                                                    {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)}
                                                </span>
                                                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                            </>
                                        )}
                                        {/airing|releasing|ongoing/i.test(anime.info.status || '') ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black tracking-wider text-[10px] shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                RELEASING
                                            </span>
                                        ) : /finished|completed|ended/i.test(anime.info.status || '') ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black tracking-wider text-[10px]">
                                                <CheckCircle size={10} className="text-blue-400" />
                                                FINISHED
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 font-bold uppercase">{anime.info.status}</span>
                                        )}
                                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-600 shadow-orange-900/20"/> {anime.stats.duration}</div>
                                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                        <div className="text-yellow-500">MAL: {anime.stats.malScore}</div>
                                    </div>
                                </div>
                                <div className="flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                            </div>
                            <div className="hidden lg:flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                        </div>
                        <div className="hidden lg:flex flex-1 pt-2 text-left z-10 flex-col h-full w-full">
                            <h1 className="text-3xl md:text-5xl font-black text-white font-lemon leading-none mb-2 tracking-tighter drop-shadow-2xl shadow-black scale-[0.85] origin-left">{anime.title}</h1>
                            {anime.jname && <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-6 opacity-60 drop-shadow-sm">{anime.jname}</p>}
                            <div className="flex flex-wrap gap-4 mt-3 justify-start items-center">
                                <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20">
                                    {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult) && (
                                        <>
                                            <span className={cn(formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('18') || formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('R') ? "text-orange-500 font-black" : "text-zinc-300 font-bold")}>
                                                {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)}
                                            </span>
                                            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                        </>
                                    )}
                                    {/airing|releasing|ongoing/i.test(anime.info.status || '') ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black tracking-wider text-[10px] shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            RELEASING
                                        </span>
                                    ) : /finished|completed|ended/i.test(anime.info.status || '') ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black tracking-wider text-[10px]">
                                            <CheckCircle size={10} className="text-blue-400" />
                                            FINISHED
                                        </span>
                                    ) : (
                                        <span className="text-zinc-400 font-bold uppercase">{anime.info.status}</span>
                                    )}
                                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-600 shadow-orange-900/20"/> {anime.stats.duration}</div>
                                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                    <div className="text-yellow-500">MAL: {anime.stats.malScore}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-6 justify-start">
                                {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-orange-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-orange-900/20 shadow-orange-900/10">{g}</Link>))}
                            </div>
                            <div className="mt-auto pt-6 w-full flex justify-end"><StarRating animeId={animeId} initialRating={anime.stats.malScore && !isNaN(Number(anime.stats.malScore)) ? (parseFloat(anime.stats.malScore) / 2) : 0} /></div>
                        </div>
                    </div>

                    <div className="p-8 pt-0 border-t border-white/5 mt-auto flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-wider mb-1"><Info size={14} className="text-orange-600"/> Synopsis</div>
                             <p className="text-sm text-zinc-300 font-medium leading-relaxed font-sans line-clamp-3">{anime.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-1">Premiered</span>
                                <span className="text-[10px] font-bold text-zinc-300 truncate w-full text-center">{anime.info.premiered || '?'}</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-1">Status</span>
                                <span className="text-[10px] font-bold text-zinc-300 truncate w-full text-center">{anime.info.status || '?'}</span>
                            </div>
                            {mounted ? (
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-1">Studios</span>
                                            <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.studios?.[0] || '?'} <ChevronDown size={8}/></span>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.studios.map((s:string)=><DropdownMenuItem key={s} className="hover:bg-white/10 cursor-pointer rounded-lg">{s}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-1">Studios</span>
                                    <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.studios?.[0] || '?'} <ChevronDown size={8}/></span>
                                </div>
                            )}
                            {mounted ? (
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-1">Producers</span>
                                            <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.producers?.[0] || '?'} <ChevronDown size={8}/></span>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.producers.map((p:string)=><DropdownMenuItem key={p} className="hover:bg-white/10 cursor-pointer rounded-lg">{p}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-1">Producers</span>
                                    <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.producers?.[0] || '?'} <ChevronDown size={8}/></span>
                                </div>
                            )}
                        </div>
                    </div>
            </motion.div>
                  
            <div className="xl:col-span-4 w-full h-[500px] xl:h-auto xl:relative xl:self-stretch mt-8 xl:mt-0 order-5">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="w-full h-full xl:absolute xl:inset-0 bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl shadow-orange-900/10">
                     <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-3 shrink-0"><Wand2 size={18} className="text-orange-600"/><h3 className="font-black text-white text-sm font-lemon tracking-widest uppercase">Suggestions</h3></div>
                     <ScrollArea className="flex-1 custom-scrollbar">
                         <div className="p-4 flex flex-col gap-3">
                             {anime.recommendations && anime.recommendations.length > 0 ? (
                                 anime.recommendations.slice(0, 10).map((rec: any) => (
                                     <Link key={rec.id} href={`/hindi-watch/${rec.id}`} className="flex gap-4 bg-white/5 border border-white/5 rounded-2xl p-2 hover:bg-white/10 hover:border-white/10 transition-colors group shadow-sm">
                                         <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-xl overflow-hidden relative shadow-md shadow-black/40"><img src={getSafeImageUrl(rec.poster)} onError={(e) => { if (e.currentTarget.src.startsWith('/api/proxy')) { e.currentTarget.src = '/images/placeholder-no-img.jpg'; } else if (e.currentTarget.src.startsWith('http')) { e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(e.currentTarget.src)}`; } else { e.currentTarget.src = '/images/placeholder-no-img.jpg'; } }} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rec.title} loading="lazy" decoding="async"/><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Play size={20} className="text-white"/></div></div>
                                         <div className="flex-1 min-w-0 py-1 flex flex-col justify-center gap-1">
                                             <h4 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">{rec.title}</h4>
                                             {rec.jname && <p className="text-[9px] text-zinc-500 truncate uppercase font-bold tracking-wider">{rec.jname}</p>}
                                             <div className="flex items-center gap-2 mt-auto text-[9px] sm:text-[10px] text-zinc-400 font-black uppercase tracking-wider"><span className="text-orange-500 px-2 py-0.5 bg-orange-900/20 rounded-md border border-orange-900/30">{rec.type || 'TV'}</span><span className="w-1 h-1 bg-zinc-600 rounded-full"/><div className="flex items-center gap-1"><Clock size={10} className="text-orange-600"/>{rec.duration || '?'}</div></div>
                                         </div>
                                     </Link>
                                 ))
                             ) : (
                                 <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
                                     <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"><ServerIcon size={20} className="opacity-50"/></div>
                                     <span className="text-xs font-black uppercase tracking-widest">No Recommendations Found</span>
                                 </div>
                             )}
                         </div>
                     </ScrollArea>
                </motion.div>
            </div>
              
            {/* RELATED SECTION */}
            {anime.related && anime.related.length > 0 && (
                <div className="xl:col-span-12 w-full mt-4 bg-[#0a0a0a] rounded-[40px] border border-white/5 p-6 md:p-8 shadow-2xl relative shadow-orange-900/10 order-6">
                      <div className="flex items-center gap-3 mb-6">
                          <Layers size={18} className="text-orange-600"/>
                          <h3 className="font-black text-white text-sm font-lemon tracking-widest uppercase">Family Lineage</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                          {anime.related.map((rel: any) => (
                             <AnimeCard key={rel.id} anime={{ ...rel, targetRoute: `/hindi-watch/${rel.id}` }} />
                          ))}
                      </div>
                  </div>
            )}

            {/* COMMENTS SECTION */}
            <div className="xl:col-span-12 w-full mt-4 order-7">
                <ShadowComments key={user?.id || 'guest'} episodeId={currentEpId || "general"} />
            </div>

            {/* BOTTOM ADS BANNER */}
            <div className="xl:col-span-12 w-full mt-8 order-8">
                <AdsterraNativeBanner location="watch" format="native" />
            </div>
        </div>
      </motion.div>

      <Footer />
      <PostShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        customUrl={typeof window !== 'undefined' ? window.location.href : ''}
        customTitle={`${anime?.title || 'Hindi Anime'} - Episode ${currentEpisode?.number || '1'}`}
        customContent={`Watch ${anime?.title || 'Hindi Anime'} Episode ${currentEpisode?.number || '1'} on Shadow Garden!`}
      />
    </div>
  );
}

export default function WatchPage() { return <Suspense fallback={<WatchPageSkeleton />}><WatchContent /></Suspense>; }