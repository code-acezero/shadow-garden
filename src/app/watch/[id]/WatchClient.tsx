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
    Zap, PlayCircle, RotateCw, StepForward, Share2, ArrowRightToLine, Forward
} from 'lucide-react';

import { AnimeService, UniversalAnime } from '@/lib/api';
import { useJellyFlip } from '@/lib/useJellyFlip';
import { supabase } from '@/lib/supabase';
import { cn, getSimilarity, isRelatedAnime, getChunkLabel, sanitizeContinueWatchingEntry, getSafeImageUrl, slugifyTitle } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';
import { sfx } from '@/lib/audioManager';
import PostShareModal from '@/components/Social/PostShareModal';

import OmniPlayer, { OmniPlayerRef, OmniPlayer as AnimePlayer, OmniPlayerRef as AnimePlayerRef } from '@/components/Player/OmniPlayer';
import CastDetailModal, { CastModalData } from '@/components/Watch/CastDetailModal';
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

// --- 1. CUSTOM HOOKS & HELPERS ---

const formatHindiDubType = (type?: string) => {
    const clean = (type || '').trim();
    if (/fan/i.test(clean)) return '(Hindi Fan Dub)';
    return '(Official Hindi Dubbed)';
};

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
        server: 'MegaCloud', 
        category: 'sub' as 'sub' | 'dub' | 'raw',
        audio: 'jp' as 'jp' | 'en' | 'hi' | 'cn' | 'kr' | 'raw',
        volume: 1
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('shadow_watch_settings_anime');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (!parsed.audio && parsed.category) {
                        parsed.audio = parsed.category === 'dub' ? 'en' : 'jp';
                    }
                    if (parsed.audio && !parsed.category) {
                        parsed.category = (parsed.audio === 'en' || parsed.audio === 'hi') ? 'dub' : 'sub';
                    }
                    setSettings((prev: any) => ({ ...prev, ...parsed }));
                } catch (e) { }
            }
            setIsLoaded(true);
        }
    }, []);

    const updateSetting = useCallback((key: string, value: any) => {
        setSettings((prev: any) => {
            const newSettings = { ...prev, [key]: value };
            if (key === 'audio') {
                newSettings.category = (value === 'en' || value === 'hi') ? 'dub' : 'sub';
            } else if (key === 'category') {
                if (!newSettings.audio || newSettings.audio === 'jp' || newSettings.audio === 'en') {
                    newSettings.audio = value === 'dub' ? 'en' : 'jp';
                }
            }
            localStorage.setItem('shadow_watch_settings_anime', JSON.stringify(newSettings));
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

const FantasyLoader = memo(() => <WatchPageSkeleton />);
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
            <style>{`
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

const getCleanEpisodeTitle = (num: number | string, rawTitle?: string) => {
    const epNum = num || 1;
    if (!rawTitle) return `EP ${epNum}`;
    let title = rawTitle.trim();
    while (/^(?:(?:episode|ep\.?)\s*\d+|\b\d+\b)\s*[:\-–—•.]*\s*/i.test(title)) {
        title = title.replace(/^(?:(?:episode|ep\.?)\s*\d+|\b\d+\b)\s*[:\-–—•.]*\s*/i, '').trim();
    }
    title = title.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
    if (!title || title.toLowerCase() === `episode ${epNum}` || title.toLowerCase() === `ep ${epNum}` || title === `${epNum}`) {
        return `EP ${epNum}`;
    }
    return `EP ${epNum}: ${title}`;
};

const getEpisodeSubtitleOnly = (num: number | string, rawTitle?: string) => {
    if (!rawTitle) return '';
    const epNum = num || 1;
    let title = rawTitle.trim();
    while (/^(?:(?:episode|ep\.?)\s*\d+|\b\d+\b)\s*[:\-–—•.]*\s*/i.test(title)) {
        title = title.replace(/^(?:(?:episode|ep\.?)\s*\d+|\b\d+\b)\s*[:\-–—•.]*\s*/i, '').trim();
    }
    title = title.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
    if (!title || title.toLowerCase() === `episode ${epNum}` || title.toLowerCase() === `ep ${epNum}` || title === `${epNum}`) {
        return '';
    }
    return title;
};

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
                    : 1440; // 24-minute fallback for embed streams
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
        <button
            type="button"
            data-flip-id={ep.id}
            onClick={() => onClick(ep.id)}
            className={cn(
                "relative overflow-hidden group select-none transition-colors duration-200 transform-gpu active:scale-95 hover:scale-[1.03] shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
                viewMode === 'grid' ? "h-8 sm:h-9 w-full rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black" :
                    viewMode === 'compact' ? "h-7 sm:h-8 w-full aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" :
                        "w-full h-8 sm:h-9 rounded-2xl flex items-center px-3 sm:px-4 text-[10px] sm:text-[11px] font-bold text-left",
                isCurrent ? "bg-slate-900/60 backdrop-blur-md border-0 text-white z-20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                    isFullyPlayed ? "bg-[#101726]/80 border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white hover:bg-white/[0.08]" :
                        "bg-white/5 backdrop-blur-xl border border-white/10 text-zinc-400 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            )}
            style={{
                ...((!isCurrent && !isFullyPlayed && displayPercent > 0) ? { background: `linear-gradient(to right, rgba(16, 185, 129, 0.35) ${displayPercent}%, rgba(255, 255, 255, 0.05) ${displayPercent}%)` } : {}),
                ...(isFullyPlayed && !isCurrent ? {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    backdropFilter: 'blur(8px)'
                } : {})
            }}
        >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-full" />

            {!isCurrent && !isFullyPlayed && displayPercent > 0 && <div className="absolute inset-0 bg-primary-600/10 animate-liquid pointer-events-none" />}

            {isCurrent && (
                <div
                    className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none rounded-r-full backdrop-blur-sm transition-all duration-150"
                    style={{ width: `${Math.max(6, displayPercent)}%` }}
                >
                    {/* Seamless Metallic Liquid Fill: No stroke, pure metallic fluid sheen */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 via-teal-500/35 to-emerald-400/35" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25" />
                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-white/20 to-transparent" />
                </div>
            )}

            <div
                className={cn(
                    "relative z-10 w-full h-full flex items-center font-lemon tracking-wide overflow-hidden",
                    viewMode === 'list' ? "justify-between" : "justify-center"
                )}
            >
                <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="shrink-0 font-bold">
                        {ep.number}
                    </span>
                    {viewMode === 'list' && (
                        <span className="truncate text-[11px] font-sans font-medium text-zinc-300 transition-opacity duration-200">
                            {getEpisodeSubtitleOnly(ep.number, ep.title) ? `• ${getEpisodeSubtitleOnly(ep.number, ep.title)}` : ''}
                        </span>
                    )}
                </div>

                {/* Active Playing Badge for List Mode */}
                {isCurrent && viewMode === 'list' && (
                    <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[8px] font-black uppercase text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] shrink-0 transition-transform duration-200">
                        <span>PLAYING</span>
                    </span>
                )}
            </div>
        </button>
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

// --- SUB-COMPONENTS & HELPERS ---

const formatServerDisplayName = (name: string): string => {
    if (!name) return 'Server';
    return name
        .replace(/\s*(?:[-–—]\s*)?[\(\[]?\s*hindi(?:\s*dub)?\s*[\)\]]?/gi, '')
        .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Server';
};

const getRelationBadgeStyle = (relation?: string) => {
    const r = (relation || '').toUpperCase().replace(/_/g, ' ');
    if (r.includes('SEQUEL')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (r.includes('PREQUEL')) return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (r.includes('SIDE') || r.includes('SPIN')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    if (r.includes('ALTERNATIVE')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (r.includes('PARENT')) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    if (r.includes('SUMMARY')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (r.includes('MOVIE')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    return 'bg-white/10 text-zinc-300 border-white/15';
};

const NextEpisodeTimer = ({ schedule, status }: { schedule: any, status: string }) => {
    const [displayText, setDisplayText] = useState<React.ReactNode>("...");

    useEffect(() => {
        const isFinished = status?.toLowerCase().includes("finished") || status?.toLowerCase().includes("completed");
        if (isFinished) {
            setDisplayText(<span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider">AIRED</span>);
            return;
        }

        const rawTimestamp = schedule?.airingISOTimestamp 
            ? new Date(schedule.airingISOTimestamp).getTime()
            : (schedule?.airingAt ? Number(schedule.airingAt) * 1000 : (schedule?.airingTimestamp ? Number(schedule.airingTimestamp) * 1000 : null));

        if (!rawTimestamp || isNaN(rawTimestamp)) {
            if (status?.toLowerCase().includes("releasing")) {
                setDisplayText(<span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">NEXT EP: TBA</span>);
            } else {
                setDisplayText(<span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">UNKNOWN</span>);
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
                    <span className="text-primary-400">{epPrefix}</span>
                    <span className="text-zinc-200">{timeStr}</span>
                </span>
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [schedule, status]);

    return (
        <div className="flex items-center gap-2 text-[9px] font-bold bg-white/5 hover:bg-white/10 text-zinc-300 px-3 h-8 rounded-full border border-white/10 transition-colors justify-center min-w-fit shadow-md shadow-black/40">
            <Timer className="w-3 h-3 text-primary-500 shrink-0" />
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
        <div className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-500/20 rounded-full py-2 cursor-pointer hover:bg-primary-600 hover:border-primary-500 transition-all group active:scale-95 shadow-lg shadow-primary-900/10 w-full md:w-auto justify-center">
            <span className="flex items-center justify-center w-4 h-4 bg-primary-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
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
            <DialogContent className="bg-black/95 border-primary-500/40 w-[90vw] lg:max-w-2xl max-h-[70vh] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300 flex flex-col">
                <DialogTitle className="sr-only">Trailers</DialogTitle>
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="aspect-video w-full bg-zinc-900 shrink-0">
                        <iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                    </div>
                    <div className="p-4 md:p-6 bg-[#0a0a0a] flex-1 overflow-hidden flex flex-col">
                        <ScrollArea className="w-full whitespace-nowrap pb-4 h-full">
                            <div className="flex gap-4 px-2">
                                {videos.map((v: any, i: number) => (v && v.source ? <button key={i} onClick={() => setActiveVideo(v.source)} className={cn("flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-28 md:w-36 hover:scale-105 active:scale-95 group/pv", activeVideo === v.source ? "bg-primary-600/10 border-primary-600" : "bg-white/5 border-transparent hover:border-white/10")}><div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative shadow-lg"><img src={getSafeImageUrl(v.thumbnail || '/images/no-thumb.png')} onError={(e) => { e.currentTarget.src = '/images/no-thumb.png'; }} className="w-full h-full object-cover opacity-60" alt="" loading="lazy" decoding="async" /><div className="absolute inset-0 flex items-center justify-center bg-primary-600/20 opacity-0 group-hover/pv:opacity-100 transition-opacity"><Play size={16} fill="white" className="text-white" /></div></div><span className="text-[9px] font-black text-center truncate w-full uppercase text-zinc-400 group-hover/pv:text-white">{v.title || `Promo ${i + 1}`}</span></button> : null))}
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
        <div className="flex items-center bg-white/5 rounded-full h-8 px-3 border border-white/5 w-full flex-1 min-w-0 overflow-hidden relative transition-all hover:border-primary-500/20 active:scale-95 group shadow-inner shadow-primary-900/5">
            <span className="text-[10px] text-primary-500 font-black uppercase mr-2 flex-shrink-0">NOW:</span>
            <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center mask-image-gradient">
                <div className={cn("whitespace-nowrap inline-block", isOverflowing && "animate-marquee-pingpong")}>
                    <span ref={textRef} className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 block px-2">
                        {text}
                    </span>
                </div>
                <style>{`
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
                    const sum = allRatings.reduce((acc: any, curr: any) => acc + (curr.rating ?? 0), 0);
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
            } catch (e) { }
        };
        fetchRatings();
    }, [user, animeId, initialRating]);

    const handleRate = async (score: number) => {
        if (!user) { toast.error("Shadow Agents only."); return; }
        setUserRating(score);
        try {
            await (supabase!.from('anime_ratings') as any).upsert({ user_id: user.id, anime_id: animeId, rating: score }, { onConflict: 'user_id,anime_id' });
            toast.success(`Rated ${score} stars!`);
        } catch (err) { }
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
                            <Star size={14} className={cn("transition-all duration-300", star <= (hover || userRating) ? "fill-red-600 text-primary-600 shadow-primary-500/50" : "text-zinc-700")} />
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
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-900/10 via-transparent to-primary-900/5 pointer-events-none" />

                    <div className="absolute top-1 right-1 z-[100] flex gap-2 pointer-events-auto">
                        {onBack && canGoBack && (
                            <button onClick={onBack} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                                <ArrowLeft size={14} className="group-hover:text-primary-500 transition-colors" />
                            </button>
                        )}
                        {onForward && canGoForward && (
                            <button onClick={onForward} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                                <ArrowRight size={14} className="group-hover:text-primary-500 transition-colors" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-primary-600 hover:border-primary-500 transition-all active:scale-90 shadow-lg">
                            <X size={14} />
                        </button>
                    </div>

                    {loading ? <div className="w-full h-full flex items-center justify-center"><SimpleGridSkeleton /></div> : data ? (
                        <>
                            <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
                                <img src={data.profile || data.image || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} loading="lazy" decoding="async" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                                <div className="absolute bottom-6 left-6 z-10">
                                    <h2 className="text-2xl md:text-3xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                                    <p className="text-primary-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{data.japaneseName}</p>
                                </div>
                            </div>
                            <div className="w-full md:w-[65%] h-[60%] md:h-full relative z-10 flex flex-col bg-[#0a0a0a]/50">
                                <ScrollArea className="h-full p-6 custom-scrollbar">
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12} /> Profile</h3>
                                            <div className="text-zinc-300 text-sm leading-relaxed font-medium opacity-90 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: data.about?.style || data.about?.description || "No Data Available" }} />
                                        </div>

                                        <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Mic size={12} className="text-primary-500" /> Voice Artists</h3>
                                            {data.voiceActors && data.voiceActors.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {data.voiceActors.map((va: any, i: number) => (
                                                        <button key={i} onClick={() => va.id && onActorClick(va.id)} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary-500/30 transition-all group/va text-left active:scale-95">
                                                            <img src={va.profile || va.image || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md group-hover/va:border-primary-500/50" alt={va.name} loading="lazy" decoding="async" />
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
                                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12} className="text-yellow-500" /> Appearances</h3>
                                                <div className="flex flex-col gap-3">
                                                    {data.animeography.map((anime: any, i: number) => {
                                                        const aniSlug = slugifyTitle(anime.title);
                                                        const aniRouteId = (aniSlug && !String(anime.id).includes('-')) ? `${anime.id}-${aniSlug}` : anime.id;
                                                        return (
                                                            <Link key={i} href={`/watch/${aniRouteId}`} className="flex items-center gap-4 p-2 pr-4 rounded-xl bg-black/40 border border-white/5 hover:border-primary-500/50 hover:bg-white/5 transition-all active:scale-95 group/ani">
                                                                <img src={anime.poster || '/images/no-poster.png'} className="w-10 h-14 rounded-lg object-cover shadow-sm" loading="lazy" decoding="async" />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm font-bold text-zinc-300 group-hover/ani:text-white truncate">{anime.title}</span>
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover/ani:text-primary-400 transition-colors">{anime.role || 'Character'}</span>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </>) : <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold">DATA CORRUPTED</div>}
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
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/10 via-transparent to-primary-600/5 pointer-events-none" />

                    <div className="absolute top-1 right-1 z-[100] flex gap-2 pointer-events-auto">
                        {onBack && canGoBack && (
                            <button onClick={onBack} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                                <ArrowLeft size={14} className="group-hover:text-primary-500 transition-colors" />
                            </button>
                        )}
                        {onForward && canGoForward && (
                            <button onClick={onForward} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                                <ArrowRight size={14} className="group-hover:text-primary-500 transition-colors" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-primary-600 hover:border-primary-500 transition-all active:scale-90 shadow-lg">
                            <X size={14} />
                        </button>
                    </div>

                    {loading ? <div className="w-full h-full flex items-center justify-center"><SimpleGridSkeleton /></div> : data ? (
                        <>
                            <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
                                <img src={data.profile || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} loading="lazy" decoding="async" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                                <div className="absolute bottom-6 left-6 z-10">
                                    <h2 className="text-2xl md:text-3xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                                    <p className="text-primary-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{data.japaneseName}</p>
                                </div>
                            </div>
                            <div className="w-full md:w-[65%] h-[60%] md:h-full relative z-10 flex flex-col bg-[#0a0a0a]/50">
                                <ScrollArea className="h-full p-6 custom-scrollbar">
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12} /> Profile</h3>
                                            <div className="text-zinc-300 text-sm leading-relaxed font-medium opacity-90 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: data.about?.style || data.about?.description || "No Data" }} />
                                        </div>
                                        {data.roles && (
                                            <div>
                                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12} /> Roles</h3>
                                                <div className="flex flex-col gap-2">
                                                    {data.roles.map((role: any, i: number) => (
                                                        <div key={i} className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/row">
                                                            {/* Left: Anime Info (50% Width) */}
                                                            {(() => {
                                                                const roleSlug = slugifyTitle(role.anime.title);
                                                                const roleRouteId = (roleSlug && !String(role.anime.id).includes('-')) ? `${role.anime.id}-${roleSlug}` : role.anime.id;
                                                                return (
                                                                    <Link href={`/watch/${roleRouteId}`} className="flex items-center gap-2 min-w-0 group/ani overflow-hidden">
                                                                        <img src={role.anime.poster || '/images/no-poster.png'} className="w-8 h-12 rounded-md object-cover shadow-sm shrink-0" loading="lazy" decoding="async" />
                                                                        <div className="flex flex-col min-w-0 overflow-hidden">
                                                                            <PingPongScroll text={role.anime.title} className="text-[10px] font-bold text-zinc-300 group-hover/ani:text-white" />
                                                                            <span className="text-[9px] font-bold text-primary-500 uppercase tracking-wider group-hover/ani:underline truncate">Watch Now</span>
                                                                        </div>
                                                                    </Link>
                                                                );
                                                            })()}

                                                            {/* Right: Character Info (50% Width) */}
                                                            <button onClick={() => onCharacterClick(role.character.id)} className="flex items-center gap-2 justify-end min-w-0 group/char text-right overflow-hidden">
                                                                <div className="flex flex-col min-w-0 items-end overflow-hidden">
                                                                    <PingPongScroll text={role.character.name} className="text-[10px] font-bold text-zinc-300 group-hover/char:text-white text-right" />
                                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider truncate w-full text-right">{role.role || role.character.role || 'Main'}</span>
                                                                </div>
                                                                <img
                                                                    src={role.character.profile || role.character.image || role.character.poster || role.character.images?.jpg?.image_url || '/images/non-non.png'}
                                                                    className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover/char:border-primary-500 transition-colors shadow-md shrink-0"
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
                        </>) : <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold">DATA CORRUPTED</div>}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// ── Multi-Tab Anime Characters & Voice Cast Block (12 Characters Per Tab) ─────
const AnimeCharactersBlock = ({ characters }: { characters?: any[] }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedCharacter, setSelectedCharacter] = useState<CastModalData | null>(null);
    const itemsPerPage = 12;

    const list = characters || [];
    const totalTabs = Math.max(1, Math.ceil(list.length / itemsPerPage));

    useEffect(() => {
        if (activeTab >= totalTabs) setActiveTab(0);
    }, [list.length, totalTabs, activeTab]);

    if (!list || list.length === 0) return null;

    const currentChars = list.slice(activeTab * itemsPerPage, (activeTab + 1) * itemsPerPage);

    return (
        <div className="xl:col-span-12 w-full mt-4 bg-[#0a0a0a] rounded-[40px] border border-white/5 p-6 md:p-8 shadow-2xl relative shadow-primary-900/10 order-4 xl:order-5">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Users size={18} className="text-primary-600" />
                    <div>
                        <h3 className="font-black text-white text-sm font-lemon tracking-widest uppercase">Character & Voice Artists</h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Anime characters and voice artists</p>
                    </div>
                </div>

                {/* Top-Right Multi-Tab Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        {activeTab * itemsPerPage + 1}–{Math.min((activeTab + 1) * itemsPerPage, list.length)} of {list.length}
                    </span>

                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                            disabled={activeTab === 0}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-all active:scale-95"
                            title="Previous characters"
                            aria-label="Previous characters"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[10px] font-black text-primary-400 px-1.5 min-w-[28px] text-center">
                            {activeTab + 1}/{totalTabs}
                        </span>
                        <button
                            onClick={() => setActiveTab(prev => Math.min(totalTabs - 1, prev + 1))}
                            disabled={activeTab >= totalTabs - 1}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-all active:scale-95"
                            title="Next characters"
                            aria-label="Next characters"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {currentChars.map((char: any, idx: number) => {
                    const charName = char.name || 'Unknown Character';
                    const charRole = char.role ? (char.role === 'MAIN' ? 'Main Character' : (char.role === 'SUPPORTING' ? 'Supporting Role' : char.role)) : 'Character';
                    const charPoster = getSafeImageUrl(char.poster);
                    const va = char.voiceActor;

                    return (
                        <div 
                            key={char.id || `${charName}-${idx}`} 
                            onClick={() => setSelectedCharacter({
                                id: char.id,
                                name: charName,
                                role: charRole,
                                image: charPoster,
                                profileLarge: charPoster,
                                department: 'Character',
                                popularity: char.favorites,
                                mediaType: 'anime',
                                voiceActor: va ? {
                                    id: va.id,
                                    name: va.name,
                                    poster: getSafeImageUrl(va.poster),
                                    language: va.language || 'Japanese'
                                } : null
                            })}
                            className="cursor-pointer flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-primary-500/30 rounded-2xl p-2.5 transition-all duration-300 group shadow-sm active:scale-[0.99]"
                        >
                            {/* Character side */}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-11 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-900 shadow-md">
                                    <img
                                        src={charPoster}
                                        alt={charName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
                                    />
                                </div>
                                <div className="min-w-0 flex flex-col">
                                    <h4 className="text-xs font-black text-white truncate group-hover:text-primary-400 transition-colors">
                                        {charName}
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">
                                        {charRole}
                                    </p>
                                </div>
                            </div>

                            {/* Voice Actor side */}
                            {va && (
                                <div className="flex items-center gap-2 text-right shrink-0 pl-2 border-l border-white/5">
                                    <div className="min-w-0 max-w-[85px] sm:max-w-[95px]">
                                        <h5 className="text-[10px] font-bold text-zinc-300 truncate">
                                            {va.name}
                                        </h5>
                                        <span className="text-[8px] text-zinc-500 uppercase font-semibold">
                                            {va.language || 'Japanese'}
                                        </span>
                                    </div>
                                    <div className="w-9 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow-md">
                                        <img
                                            src={getSafeImageUrl(va.poster)}
                                            alt={va.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <CastDetailModal 
                isOpen={Boolean(selectedCharacter)} 
                onClose={() => setSelectedCharacter(null)} 
                data={selectedCharacter} 
            />
        </div>
    );
};

// ==========================================
//  4. MAIN COMPONENT (WatchContent)
// ==========================================

function WatchContent({ initialAnime }: { initialAnime?: UniversalAnime | null } = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const searchParams = useSearchParams();
    const rawAnimeId = (params?.id as string) || '';
    const cleanAnimeId = rawAnimeId ? (rawAnimeId.match(/^(\d+)/)?.[1] || rawAnimeId) : '';
    const animeId = initialAnime?.id || cleanAnimeId || rawAnimeId;
    const urlEpId = searchParams.get('ep') || searchParams.get('episode');
    const urlEpNumber = searchParams.get('episode') || searchParams.get('ep');
    const urlTimestamp = searchParams.get('timestamp') || searchParams.get('t');
    const urlType = searchParams.get('type');
    const urlAudio = searchParams.get('audio');

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
    const [popupHistory, setPopupHistory] = useState<{ type: 'character' | 'actor', id: string }[]>([]);
    const [popupIndex, setPopupIndex] = useState(-1);
    const activePopup = popupIndex >= 0 ? popupHistory[popupIndex] : null;

    const navigateToPopup = useCallback((type: 'character' | 'actor', id: string) => {
        setPopupHistory((prev: any[]) => { const n = prev.slice(0, popupIndex + 1); n.push({ type, id }); return n; });
        setPopupIndex((prev: number) => prev + 1);
    }, [popupIndex]);

    const openCharacter = useCallback((id: string) => navigateToPopup('character', id), [navigateToPopup]);
    const openActor = useCallback((id: string) => navigateToPopup('actor', id), [navigateToPopup]);
    const goBack = useCallback(() => setPopupIndex((prev: number) => Math.max(0, prev - 1)), []);
    const goForward = useCallback(() => setPopupIndex((prev: number) => Math.min(popupHistory.length - 1, prev + 1)), [popupHistory.length]);
    const closeAll = useCallback(() => { setPopupHistory([]); setPopupIndex(-1); }, []);

    // --- STATE ---
    const [anime, setAnime] = useState<UniversalAnime | null>(initialAnime || null);
    const [isLoadingInfo, setIsLoadingInfo] = useState(!initialAnime);
    const [currentEpId, setCurrentEpId] = useState<string | null>(null);
    const [playerAspectRatio, setPlayerAspectRatio] = useState<number | null>(null);

    useEffect(() => {
        setPlayerAspectRatio(null);
    }, [currentEpId]);
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [streamReferer, setStreamReferer] = useState<string | null>(null);
    const [subtitles, setSubtitles] = useState<any[]>([]);
    const [intro, setIntro] = useState<any>(null);
    const [outro, setOutro] = useState<any>(null);
    const [isStreamLoading, setIsStreamLoading] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [servers, setServers] = useState<any>(null);
    const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
    const [hideInterface, setHideInterface] = useState(false);
    const interfaceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showSkipNotification, setShowSkipNotification] = useState(false);
    const [skipNotificationText, setSkipNotificationText] = useState<'Skipped Intro' | 'Skipped Outro'>('Skipped Intro');
    const isSkipToastLocked = useRef(false);
    const isProgrammaticServerUpdate = useRef(false);
    const [epViewMode, setEpViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
    const [epChunkIndex, setEpChunkIndex] = useState(0);
    const [epProgress, setEpProgress] = useState<EpisodeProgress>({});
    const [resumeTime, setResumeTime] = useState(0);
    const [isResumeLoaded, setIsResumeLoaded] = useState(false);
    const progressRef = useRef(0);
    const playerRef = useRef<AnimePlayerRef>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const progressBuffer = useRef<{ [key: string]: any }>({});
    const isBufferDirty = useRef(false);
    const isSwitchingEpisode = useRef(false);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [serverChangeKey, setServerChangeKey] = useState(0);
    const urlAudioHandledRef = useRef(false);
    const activeFetchRef = useRef(0);
    const failedServersRef = useRef<string[]>([]);
    const programmaticServerRef = useRef<string | null>(null);
    const initialSettingsMount = useRef(true);
    const embedDurationRef = useRef<number>(1440);
    const lastAutoSkippedIntroRef = useRef<boolean>(false);
    const lastAutoSkippedOutroRef = useRef<boolean>(false);
    const lastAutoNextTriggeredRef = useRef<boolean>(false);
    const hasHindiDiscoveredRef = useRef<boolean>(false);
    const episodeSubtitlesRef = useRef<any[]>([]);

    const seasonsRef = useDraggable();
    const relatedRef = useDraggable();
    const recommendationsRef = useDraggable();
    const chunksRef = useDraggable();
    const epContainerRef = useRef<HTMLDivElement>(null);
    useJellyFlip(epViewMode, epContainerRef);

    // Hoisted Audio & Server State
    const rawOrigin = (anime?.countryOfOrigin || initialAnime?.countryOfOrigin || 'JP').toUpperCase();
    const currentTitle = (anime?.title || initialAnime?.title || '').toLowerCase();
    const isSoloLevelingOrJp = /(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test(currentTitle);
    const origin = isSoloLevelingOrJp ? 'JP' : rawOrigin;
    const isChinese = origin === 'CN';
    const isKorean = origin === 'KR';
    const primaryAudioId: 'jp' | 'cn' | 'kr' = isChinese ? 'cn' : (isKorean ? 'kr' : 'jp');
    const primaryAudioLabel = isChinese ? 'CN • Sub' : (isKorean ? 'KR • Sub' : 'JP • Sub');

    const currentAudio = (settings.category === 'dub' || settings.audio === 'en' || settings.audio === 'hi')
        ? (settings.audio === 'hi' ? 'hi' : 'en')
        : primaryAudioId;

    const currentAudioServers = useMemo(() => {
        if (!servers) return [];
        if (servers[currentAudio]?.length) return servers[currentAudio];
        if (currentAudio === 'jp' || currentAudio === 'cn' || currentAudio === 'kr') return servers[primaryAudioId] || servers['sub'] || [];
        if (currentAudio === 'en') return servers['dub'] || [];
        return [];
    }, [servers, currentAudio, primaryAudioId]);

    // --- HANDLERS (Hoisted) ---

    const handleServerChange = useCallback((srvName: string, isManual = false) => {
        if (isManual) {
            failedServersRef.current = [];
        }
        const pool: any[] = currentAudioServers || [];
        const srv = pool.find((s: any) => (s.serverName || '').toLowerCase() === srvName.toLowerCase());
        const canonicalName = srv ? srv.serverName : srvName;

        updateSetting('server', canonicalName);
        setServerChangeKey((prev: number) => prev + 1);

        if (srv && srv.url) {
            programmaticServerRef.current = canonicalName.toLowerCase();
            setStreamUrl(srv.url);
            setStreamReferer(srv.referer || null);
            if (srv.tracks && Array.isArray(srv.tracks)) {
                setSubtitles(srv.tracks.map((t: any) => ({
                    file: t.file || t.url,
                    label: t.label || 'English',
                    kind: 'captions',
                    default: !!t.default
                })));
            }
            if (srv.intro) setIntro(srv.intro);
            if (srv.outro) setOutro(srv.outro);
        } else {
            programmaticServerRef.current = null;
            setFetchTrigger((prev: number) => prev + 1);
        }
    }, [currentAudioServers, updateSetting]);

    const switchToNextServer = useCallback((failedServerName?: string) => {
        const failing = (failedServerName || settings.server || '').trim().toLowerCase();
        if (failing && !failedServersRef.current.includes(failing)) {
            failedServersRef.current.push(failing);
        }

        const pool: any[] = currentAudioServers || [];
        const next = pool.find((s: any) => !failedServersRef.current.includes((s.serverName || '').trim().toLowerCase()));

        if (next && next.serverName) {
            console.log(`[AutoFailover] Server "${failing}" failed. Auto-switching to "${next.serverName}"...`);
            toast.info(`Server "${failedServerName || settings.server}" failed. Switching to ${next.serverName}...`);
            handleServerChange(next.serverName, false);
        } else {
            console.warn(`[AutoFailover] All servers exhausted for track ${currentAudio}`);
            toast.error(`Portals unstable for ${currentAudio.toUpperCase()} track. Resetting and retrying...`);
            failedServersRef.current = [];
            setFetchTrigger((prev: number) => prev + 1);
        }
    }, [settings.server, currentAudioServers, currentAudio, handleServerChange]);

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

        const ep = anime.episodes.find((e: any) => e.id === targetEpId || String(e.number) === targetEpId);
        if (!ep) return;

        const rawDuration = playerRef.current?.getDuration();
        const duration = (rawDuration && !isNaN(rawDuration) && rawDuration > 0) ? rawDuration : (progressBuffer.current[targetEpId]?.duration || embedDurationRef.current || 1440);

        const percent = Math.min(100, Math.round((progress / duration) * 100));
        const isCompleted = forceFlush || percent >= 90;

        setEpProgress((prev: any) => ({
            ...prev,
            [ep.number]: isCompleted ? 100 : percent,
            [ep.id]: isCompleted ? 100 : percent
        }));

        const episodeImage = (ep as any).image || (ep as any).poster || anime.poster;
        const animeTitle = anime.title || (anime as any).name || 'Anime';
        const animeImage = anime.poster || (anime as any).image || episodeImage;
        const animeType = (anime as any).type || 'TV';

        if (user) {
            const genresList = Array.isArray((anime as any).genres) ? (anime as any).genres.map((g: any) => String(g).toLowerCase()) : [];
            const hasAdultGenre = genresList.some((g: string) => ['ecchi', 'erotica', 'hentai', 'adult'].includes(g));
            const isAdultVal = (anime as any).isAdult === true || hasAdultGenre || ["RX", "HENTAI", "18"].some((t: string) => ((anime as any).rating || "").toUpperCase().includes(t));
            const ageRatingVal = (anime as any).rating || (anime as any).ageRating || (isAdultVal ? '18+' : null);

            const entry = {
                user_id: user.id,
                anime_id: animeId,
                title: animeTitle,
                banner_image: animeImage,
                episode_id: ep.id,
                episode_number: ep.number,
                progress: progress,
                duration: duration,
                last_updated: new Date().toISOString(),
                last_server: settings.server,
                episode_image: episodeImage,
                total_episodes: anime.episodes?.length || 1,
                type: animeType,
                media_type: 'anime',
                is_completed: isCompleted,
                age_rating: ageRatingVal,
                is_adult: isAdultVal
            };
            progressBuffer.current[ep.id] = entry;
            isBufferDirty.current = true;
            localStorage.setItem(`shadow_sync_buffer_${animeId}`, JSON.stringify(progressBuffer.current));
            if (forceFlush || isCompleted) flushSyncBuffer();
        } else {
            const genresList = Array.isArray((anime as any).genres) ? (anime as any).genres.map((g: any) => String(g).toLowerCase()) : [];
            const hasAdultGenre = genresList.some((g: string) => ['ecchi', 'erotica', 'hentai', 'adult'].includes(g));
            const isAdultVal = (anime as any).isAdult === true || hasAdultGenre || ["RX", "HENTAI", "18"].some((t: string) => ((anime as any).rating || "").toUpperCase().includes(t));
            const ageRatingVal = (anime as any).rating || (anime as any).ageRating || (isAdultVal ? '18+' : null);
            const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
            localData[animeId] = {
                animeId,
                title: animeTitle,
                poster: animeImage,
                episodeId: ep.id,
                episodeNumber: ep.number,
                progress,
                duration,
                type: 'anime',
                ageRating: ageRatingVal,
                isAdult: isAdultVal,
                lastUpdated: Date.now()
            };
            localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));

            const epData = JSON.parse(localStorage.getItem(`shadow_ep_progress_${animeId}`) || '{}');
            epData[ep.id] = {
                episode_id: ep.id,
                episode_number: ep.number,
                progress,
                duration,
                is_completed: isCompleted,
                last_updated: new Date().toISOString()
            };
            localStorage.setItem(`shadow_ep_progress_${animeId}`, JSON.stringify(epData));
            progressBuffer.current[ep.id] = epData[ep.id];

            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
        }

        // Auto sync with watchlist and completed detection
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-sync-watching', {
                detail: {
                    anime_id: animeId,
                    title: animeTitle,
                    poster: animeImage,
                    episode_number: ep.number,
                    episode_id: ep.id,
                    total_episodes: anime.episodes?.length || (anime as any).totalEpisodes || 1,
                    is_completed: isCompleted,
                    type: animeType,
                    media_type: 'anime'
                }
            }));
        }
    }, [anime, currentEpId, user, animeId, settings.server, flushSyncBuffer]);

    // Instant Registration & Progress Restoration on Episode Visit
    useEffect(() => {
        if (anime && currentEpId) {
            const ep = anime.episodes?.find((e: any) => e.id === currentEpId || String(e.number) === currentEpId);
            if (ep && typeof window !== 'undefined') {
                const animeTitle = anime.title || (anime as any).name || 'Anime';
                const animeImage = anime.poster || (anime as any).image;
                window.dispatchEvent(new CustomEvent('shadow-sync-watching', {
                    detail: {
                        anime_id: animeId,
                        title: animeTitle,
                        poster: animeImage,
                        episode_number: ep.number,
                        episode_id: ep.id,
                        total_episodes: anime.episodes?.length || (anime as any).totalEpisodes || 1,
                        is_completed: false,
                        type: (anime as any).type || 'TV',
                        media_type: 'anime'
                    }
                }));
            }

            const record = progressBuffer.current[currentEpId];
            if (record && !record.is_completed && record.progress > 5) {
                progressRef.current = record.progress;
                setResumeTime(record.progress);
            }
        }
    }, [anime, currentEpId, animeId]);

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

        // Trigger episode switch ad (debounced)
        adManager.triggerEpisodeSwitch(id);

        const ep = anime?.episodes.find((e: any) =>
            String(e.id) === String(id) ||
            String(e.number) === String(id) ||
            Number(e.number) === Number(id) ||
            String(e.id).endsWith(`::${id}`) ||
            String(e.id).endsWith(`-${id}`)
        );
        const targetId = ep ? ep.id : id;

        const savedRecord = progressBuffer.current[targetId];
        if (savedRecord && !savedRecord.is_completed && savedRecord.progress > 5) {
            progressRef.current = savedRecord.progress;
            setResumeTime(savedRecord.progress);
        } else {
            progressRef.current = 0;
            setResumeTime(0);
        }

        isSwitchingEpisode.current = true;
        setCurrentEpId(targetId);
        setStreamUrl(null);
        isSkipToastLocked.current = false;
        const targetParam = ep ? String(ep.number) : targetId;
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('ep', targetParam);
            window.history.replaceState({}, '', url.toString());
        }
    }, [animeId, currentEpId, saveProgress, anime]);

    const resetInterfaceTimer = useCallback(() => { }, []);

    const handlePlayerClick = useCallback(() => {
        if (playerContainerRef.current) playerContainerRef.current.focus();
    }, []);

    const handlePlaybackStart = useCallback(() => { }, []);

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
                    title: anime?.title ? `${anime.title} Watch Room` : 'Anime Watch Room',
                    host_id: user.id,
                    media_id: animeId,
                    media_type: 'anime',
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

    // URL Auto Update: Ensure both anime title slug and episode number are present in address bar
    useEffect(() => {
        if (!isLoadingInfo && anime && typeof window !== 'undefined') {
            const cleanTitle = anime.title || (anime as any).name || '';
            const slug = slugifyTitle(cleanTitle);
            const canonicalId = slug ? `${anime.id}-${slug}` : String(anime.id);
            const targetPath = `/watch/${canonicalId}`;

            const url = new URL(window.location.href);
            let hasChanged = false;

            if (url.pathname !== targetPath) {
                url.pathname = targetPath;
                hasChanged = true;
            }

            if (currentEpId) {
                const currentEpObj = anime.episodes?.find((e: any) => e.id === currentEpId);
                const currentParamEp = url.searchParams.get('ep');
                const targetParam = currentEpObj ? String(currentEpObj.number) : currentEpId;
                if (currentParamEp !== targetParam) {
                    url.searchParams.set('ep', targetParam);
                    hasChanged = true;
                }
            }

            if (hasChanged) {
                window.history.replaceState({}, '', url.pathname + url.search + url.hash);
            }
        }
    }, [currentEpId, isLoadingInfo, anime]);

    // Chunk Auto-Select
    const chunkSize = 50;
    useEffect(() => {
        if (!currentEpId || !anime) return;
        const index = anime.episodes.findIndex((e: any) => e.id === currentEpId);
        if (index !== -1) {
            const targetChunk = Math.floor(index / chunkSize);
            setEpChunkIndex(targetChunk);
        }
    }, [currentEpId, anime, chunkSize]);

    // Initial Load
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            // Immediately hydrate from initialAnime if available
            if (initialAnime && (initialAnime.id === cleanAnimeId || initialAnime.id === rawAnimeId || !anime)) {
                setAnime(initialAnime);
                setIsLoadingInfo(false);
            } else if (!anime) {
                setIsLoadingInfo(true);
            }

            try {
                const universalData = await AnimeService.getAnimeInfo(cleanAnimeId || rawAnimeId).catch(() => null);
                if (!isMounted) return;

                const baseData = universalData || initialAnime || anime;
                if (!baseData) {
                    console.warn(`[WatchClient] Anime data not found for ${animeId}`);
                    setIsLoadingInfo(false);
                    return;
                }

                if (!baseData.episodes || baseData.episodes.length === 0) {
                    const epData = await AnimeService.getEpisodes(animeId).catch(() => []);
                    if (epData && Array.isArray(epData) && epData.length > 0) {
                        baseData.episodes = epData;
                    }
                }

                if ((!baseData.recommendations || baseData.recommendations.length === 0) && baseData.info?.genres && baseData.info.genres.length > 0) {
                    try {
                        const homeData = await AnimeService.getHomeSections();
                        if (homeData && homeData.recent) {
                            baseData.recommendations = homeData.recent
                                .filter((s: any) => s.id !== baseData.id)
                                .slice(0, 10)
                                .map((r: any) => ({
                                    id: r.id,
                                    title: r.name,
                                    poster: r.poster,
                                    type: typeof r.type === 'string' ? r.type : 'TV',
                                    date: ''
                                }));
                        }
                    } catch (e) { }
                }

                // Advanced Family Lineage matching
                if (!baseData.related || baseData.related.length === 0) {
                    try {
                        const baseTitle = baseData.title.split(/season|part|\d+/i)[0].trim();
                        const genreSearch = await AnimeService.getByGenre(baseData.info.genres[0], 1);
                        if (genreSearch && genreSearch.length > 0) {
                            baseData.related = genreSearch.filter((s: any) => {
                                if (baseData.related?.some((r: any) => r.id === s.id)) return false;
                                return isRelatedAnime(baseData.id, baseData.title, s.id, s.title || s.name);
                            }).slice(0, 8);
                        }
                    } catch (e) { }
                }

                // Hindi Dub Availability Synchronization
                try {
                    const checkRes = await fetch(`/api/blakite/check?title=${encodeURIComponent(baseData.title)}`);
                    if (checkRes.ok) {
                        const checkData = await checkRes.json();
                        if (checkData.available) {
                            (baseData as any).hindiDub = {
                                available: true,
                                dubType: checkData.dubType || 'Hindi Official Dub',
                                language: checkData.language,
                                blakiteId: checkData.id,
                                totalEpisodes: checkData.totalEpisodes,
                                score: checkData.score
                            };
                            hasHindiDiscoveredRef.current = true;
                        } else {
                            (baseData as any).hindiDub = { available: false };
                            hasHindiDiscoveredRef.current = false;
                        }
                    }
                } catch (e) {
                    console.warn("[WatchClient] Hindi dub check warning:", e);
                }

                if (isMounted) {
                    setAnime(baseData);
                }
            } catch (e) {
                console.warn("[WatchClient] Non-fatal init warning:", e);
            } finally {
                if (isMounted) setIsLoadingInfo(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, [animeId, initialAnime]);

    // Sync History
    useEffect(() => {
        if (!anime) return;
        const syncHistory = async () => {
            let progressMap: EpisodeProgress = {};
            let savedServer = null;
            const tempStorageKey = `shadow_sync_buffer_${animeId}`;
            let needsDbUpdate = false;
            let bufferToFlush: any[] = [];
            let localData: { [key: string]: any } = {};
            try {
                const raw = localStorage.getItem(tempStorageKey);
                if (raw) localData = JSON.parse(raw);
                const epRaw = localStorage.getItem(`shadow_ep_progress_${animeId}`);
                if (epRaw) {
                    const epParsed = JSON.parse(epRaw);
                    localData = { ...epParsed, ...localData };
                }
            } catch { }
            let dbData: { [key: string]: any } = {};
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
                } catch { }
            }
            const allEpIds = new Set([...Object.keys(localData), ...Object.keys(dbData)]);
            allEpIds.forEach(epId => {
                const local = localData[epId]; const db = dbData[epId]; let final = null;
                if (local && db) {
                    if (new Date(local.last_updated).getTime() > new Date(db.last_updated).getTime()) { final = local; needsDbUpdate = true; bufferToFlush.push(local); } else { final = db; }
                } else if (local) { final = local; needsDbUpdate = true; bufferToFlush.push(local); } else if (db) { final = db; }
                if (final) {
                    const targetId = final.episode_id || epId;
                    progressBuffer.current[targetId] = final;
                    progressBuffer.current[epId] = final;
                    const dur = final.duration || 1350;
                    const epNum = final.episode_number || final.episode;
                    const pVal = Number(final.progress || 0);
                    const pct = final.is_completed ? 100 : Math.min(100, Math.max(1, Math.round((pVal / dur) * 100)));

                    if (epNum) progressMap[epNum] = pct;
                    if (targetId) progressMap[targetId] = pct;

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

            if (paramEp && anime.episodes) {
                const paramStr = String(paramEp).trim();
                const paramNum = Number(paramStr);
                let urlMatch = anime.episodes.find((e: any) =>
                    String(e.id) === paramStr ||
                    (!isNaN(paramNum) && Number(e.number) === paramNum) ||
                    String(e.number) === paramStr ||
                    String(e.id).endsWith(`-${paramStr}`) ||
                    String(e.id).endsWith(`=${paramStr}`) ||
                    String(e.id).endsWith(`::${paramStr}`) ||
                    String(e.id).includes(`::${paramStr}`)
                );
                if (!urlMatch && !isNaN(paramNum) && paramNum > 0) {
                    const synthEp = {
                        id: `${anime.id}::${paramNum}`,
                        number: paramNum,
                        title: `Episode ${paramNum}`,
                        isFiller: false,
                        isDub: true,
                        isSub: true,
                        hasDub: true,
                        hasSub: true,
                        malId: anime.malId
                    };
                    anime.episodes.push(synthEp);
                    urlMatch = synthEp;
                }
                if (urlMatch) targetEpId = urlMatch.id;
            }

            if (!targetEpId) {
                let maxTime = 0;
                Object.values(progressBuffer.current).forEach((p: any) => {
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

            // Safety Check: Prevent older format 'episodeId' cache from failing lookup
            if (targetEpId && anime.episodes?.length > 0) {
                const epExists = anime.episodes.find((e: any) => e.id === targetEpId);
                if (!epExists) {
                    const oldData = Object.values(progressBuffer.current).find((p: any) => p.episode_id === targetEpId) as any;
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

            // Handle Custom Timestamp from URL
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
    // NOTE: Do NOT include currentEpId in deps — replaceState (used by handleEpisodeClick)
    // does NOT update useSearchParams, so if currentEpId is a dep the effect runs after
    // every click and reverts to the stale URL episode param, causing the bounce-back bug.
    const currentEpIdRef = useRef(currentEpId);
    useEffect(() => { currentEpIdRef.current = currentEpId; }, [currentEpId]);

    useEffect(() => {
        if (!anime?.episodes) return;
        const paramEp = urlEpId || urlEpNumber;
        if (!paramEp) return;

        const paramStr = String(paramEp).trim();
        const paramNum = Number(paramStr);

        let match = anime.episodes.find((e: any) =>
            String(e.id) === paramStr ||
            (!isNaN(paramNum) && Number(e.number) === paramNum) ||
            String(e.number) === paramStr ||
            String(e.id).endsWith(`-${paramStr}`) ||
            String(e.id).endsWith(`=${paramStr}`) ||
            String(e.id).endsWith(`::${paramStr}`) ||
            String(e.id).includes(`::${paramStr}`)
        );

        if (!match && !isNaN(paramNum) && paramNum > 0) {
            const synthEp = {
                id: `${anime.id}::${paramNum}`,
                number: paramNum,
                title: `Episode ${paramNum}`,
                isFiller: false,
                isDub: true,
                isSub: true,
                hasDub: true,
                hasSub: true,
                malId: anime.malId
            };
            anime.episodes.push(synthEp);
            match = synthEp;
        }

        if (match && match.id !== currentEpIdRef.current) {
            const savedRecord = progressBuffer.current[match.id];
            if (savedRecord && !savedRecord.is_completed && savedRecord.progress > 5) {
                progressRef.current = savedRecord.progress;
                setResumeTime(savedRecord.progress);
            } else {
                progressRef.current = 0;
                setResumeTime(0);
            }
            setCurrentEpId(match.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlEpId, urlEpNumber, anime]);

    // Stream Loading
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
                const requestedEp = anime.episodes.find((e: any) => e.number === Number(urlEpNumber));
                if (requestedEp && requestedEp.id === currentEpId) { time = Number(urlTimestamp); isUrlOverride = true; }
            }
            if (!isUrlOverride) {
                // Preserve active player position during audio / server track switches
                const isEpSwitch = isSwitchingEpisode.current;
                isSwitchingEpisode.current = false;
                if (isEpSwitch) {
                    setServers(null);
                }
                const activePlayerTime = (!isEpSwitch && playerRef.current) ? playerRef.current.getCurrentTime() : 0;

                if (activePlayerTime > 1) {
                    time = activePlayerTime;
                } else if (progressBuffer.current[currentEpId]) {
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
                let targetAudio = settings.audio;
                const origin = isSoloLevelingOrJp ? 'JP' : (anime?.countryOfOrigin || initialAnime?.countryOfOrigin || 'JP').toUpperCase();
                const nativeAudio: 'jp' | 'cn' | 'kr' = origin === 'CN' ? 'cn' : (origin === 'KR' ? 'kr' : 'jp');

                const currentEp = anime?.episodes?.find((e: any) => e.id === currentEpId || String(e.number) === currentEpId);
                const currentEpNum = Number(currentEp?.number || 1);

                const hasEnDub = Boolean(
                    currentEp?.hasDub || 
                    currentEp?.isDub || 
                    (anime as any)?.hasDub || 
                    ((anime as any)?.stats?.episodes?.dub > 0) || 
                    ((anime as any)?.episodes?.dub > 0) ||
                    ((servers as any)?.en?.length > 0) ||
                    ((servers as any)?.dub?.length > 0)
                );

                const hindiObj = (anime as any)?.hindiDub;
                const hindiTotalEps = Number(hindiObj?.totalEpisodes || 0);
                const isAnimeHindiAvailable = Boolean(hindiObj?.available);
                const hasHiServer = Boolean((servers as any)?.hi?.length > 0);
                const isHindiForEpisode = hasHiServer || (isAnimeHindiAvailable && (hindiTotalEps === 0 || currentEpNum <= hindiTotalEps));

                if (!urlAudioHandledRef.current && urlAudio && ['jp', 'en', 'hi', 'cn', 'kr', 'raw'].includes(urlAudio.toLowerCase())) {
                    urlAudioHandledRef.current = true;
                    targetAudio = urlAudio.toLowerCase() as any;
                    targetCategory = (targetAudio === 'en' || targetAudio === 'hi') ? 'dub' : 'sub';
                } else if (!urlAudioHandledRef.current && (urlType === 'dub' || urlType === 'sub') && settings.category !== urlType) {
                    urlAudioHandledRef.current = true;
                    targetCategory = urlType;
                    targetAudio = urlType === 'dub' ? (hasEnDub ? 'en' : nativeAudio) : nativeAudio;
                }

                // --- INTELLIGENT PRE-FLIGHT AUDIO FALLBACK ---
                if (targetAudio === 'hi' && !isHindiForEpisode) {
                    if (hasEnDub) {
                        console.log(`[WatchClient] Hindi dub not available for this anime. Falling back to English Dub.`);
                        toast.info("Hindi Dub not available for this anime. Switched to English Dub.");
                        targetAudio = 'en';
                        targetCategory = 'dub';
                    } else {
                        console.log(`[WatchClient] Hindi dub not available for this anime. Falling back to Sub.`);
                        toast.info("Hindi Dub not available for this anime. Switched to Sub.");
                        targetAudio = nativeAudio;
                        targetCategory = 'sub';
                    }
                    if (currentFetch === activeFetchRef.current) {
                        updateSetting('audio', targetAudio);
                        updateSetting('category', targetCategory);
                    }
                } else if (targetAudio === 'en' && anime && anime.episodes?.length > 0 && !hasEnDub) {
                    console.log(`[WatchClient] English dub not available for this anime. Falling back to Sub.`);
                    toast.info("English Dub not available for this anime. Switched to Sub.");
                    targetAudio = nativeAudio;
                    targetCategory = 'sub';
                    if (currentFetch === activeFetchRef.current) {
                        updateSetting('audio', targetAudio);
                        updateSetting('category', targetCategory);
                    }
                } else if (targetCategory === 'sub' || ['jp', 'cn', 'kr'].includes(targetAudio)) {
                    targetAudio = nativeAudio;
                    targetCategory = 'sub';
                    if (currentFetch === activeFetchRef.current && settings.audio !== nativeAudio) {
                        updateSetting('audio', nativeAudio);
                        updateSetting('category', 'sub');
                    }
                }

                const streamOpts = {
                    malId: currentEp?.malId || anime?.malId,
                    title: anime?.title,
                    countryOfOrigin: origin,
                    hasDub: !!currentEp?.hasDub || !!currentEp?.isDub,
                    excludeServers: failedServersRef.current
                };

                let streamData: any = null;
                let availableServers = [];
                if (Array.isArray(servers)) {
                    availableServers = servers;
                } else if (servers && typeof servers === 'object') {
                    availableServers = servers[targetAudio] || servers[targetCategory] || [];
                }

                let attemptList = availableServers.length > 0 ? availableServers.map((s: any) => s.serverName) : [settings.server];
                
                // Exclude already failed servers from primary attempts
                const healthyList = attemptList.filter((s: string) => !failedServersRef.current.includes(s.toLowerCase()));
                if (healthyList.length > 0) {
                    attemptList = healthyList;
                    if (attemptList.includes(settings.server)) {
                        attemptList = [settings.server, ...attemptList.filter((s: any) => s !== settings.server)];
                    }
                } else {
                    failedServersRef.current = [];
                }

                for (let srv of attemptList) {
                    if (currentFetch !== activeFetchRef.current) return;
                    try {
                        streamData = await AnimeService.getStream(currentEpId, srv, (targetAudio || targetCategory) as any, streamOpts);
                        if (streamData?.url) break;
                    } catch (e) {
                        console.warn(`Server ${srv} failed...`);
                        if (!failedServersRef.current.includes(srv.toLowerCase())) {
                            failedServersRef.current.push(srv.toLowerCase());
                        }
                    }
                }

                if (currentFetch !== activeFetchRef.current) return;

                // --- MULTI-TIER FAILOVER AUDIO CASCADE ---
                if (!streamData?.url) {
                    if (targetAudio === 'hi') {
                        const nextFallback = hasEnDub ? 'en' : nativeAudio;
                        const nextCat = hasEnDub ? 'dub' : 'sub';
                        const fallbackLabel = hasEnDub ? 'English Dub' : 'Sub';
                        console.warn(`[Stream] Hindi Dub stream unavailable. Cascading fallback to ${fallbackLabel}.`);
                        toast.info(`Hindi Dub unavailable. Switched to ${fallbackLabel}.`);

                        let fallbackServers = [];
                        if (servers && typeof servers === 'object') {
                            fallbackServers = servers[nextFallback] || servers[nextCat] || [];
                        }
                        let fbAttemptList = fallbackServers.length > 0 ? fallbackServers.map((s: any) => s.serverName) : [settings.server];
                        fbAttemptList = fbAttemptList.filter((s: string) => !failedServersRef.current.includes(s.toLowerCase()));
                        if (fbAttemptList.length === 0) fbAttemptList = [settings.server];

                        for (let srv of fbAttemptList) {
                            if (currentFetch !== activeFetchRef.current) return;
                            try {
                                streamData = await AnimeService.getStream(currentEpId, srv, nextFallback as any, streamOpts);
                                if (streamData?.url) {
                                    targetAudio = nextFallback;
                                    targetCategory = nextCat;
                                    updateSetting('audio', nextFallback);
                                    updateSetting('category', nextCat);
                                    break;
                                }
                            } catch (e) { console.warn(`Fallback ${srv} failed`); }
                        }

                        // If English Dub was tried and ALSO returned no URL, cascade further to native Sub
                        if (!streamData?.url && nextFallback === 'en') {
                            console.warn(`[Stream] English Dub also failed. Cascading fallback to Native Sub.`);
                            toast.info(`Dub unavailable. Switched to Sub.`);
                            let subServers = servers?.[nativeAudio] || servers?.['sub'] || [];
                            let subList = subServers.length > 0 ? subServers.map((s: any) => s.serverName) : [settings.server];
                            for (let srv of subList) {
                                if (currentFetch !== activeFetchRef.current) return;
                                try {
                                    streamData = await AnimeService.getStream(currentEpId, srv, nativeAudio as any, streamOpts);
                                    if (streamData?.url) {
                                        targetAudio = nativeAudio;
                                        targetCategory = 'sub';
                                        updateSetting('audio', nativeAudio);
                                        updateSetting('category', 'sub');
                                        break;
                                    }
                                } catch (e) {}
                            }
                        }
                    } else if (targetAudio === 'en' || targetCategory === 'dub') {
                        console.warn(`[Stream] English Dub stream unavailable. Cascading fallback to Native Sub.`);
                        toast.info(`English Dub unavailable. Switched to Sub.`);
                        let subServers = servers?.[nativeAudio] || servers?.['sub'] || [];
                        let subList = subServers.length > 0 ? subServers.map((s: any) => s.serverName) : [settings.server];
                        for (let srv of subList) {
                            if (currentFetch !== activeFetchRef.current) return;
                            try {
                                streamData = await AnimeService.getStream(currentEpId, srv, nativeAudio as any, streamOpts);
                                if (streamData?.url) {
                                    targetAudio = nativeAudio;
                                    targetCategory = 'sub';
                                    updateSetting('audio', nativeAudio);
                                    updateSetting('category', 'sub');
                                    break;
                                }
                            } catch (e) { console.warn(`Sub Server ${srv} failed`); }
                        }
                    }
                    failedServersRef.current = [];
                }

                if (streamData) {
                    if (streamData.servers) {
                        if (streamData.servers.hi?.length > 0) {
                            hasHindiDiscoveredRef.current = true;
                        }
                        setServers((prev: any) => {
                            const next = { ...(prev || {}), ...(streamData.servers || {}) };
                            next.hi = streamData.servers?.hi || [];
                            if (prev?.en?.length && (!streamData.servers?.en || streamData.servers.en.length === 0)) {
                                next.en = prev.en;
                            }
                            return next;
                        });
                    }

                    if (streamData.url) {
                        setStreamUrl(streamData.url);
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

                        if (streamData.server && streamData.server.toLowerCase() !== settings.server.toLowerCase()) {
                            programmaticServerRef.current = streamData.server.toLowerCase();
                            updateSetting('server', streamData.server);
                        }
                    } else {
                        throw new Error("No Stream Found");
                    }
                } else {
                    throw new Error("Portal Unstable");
                }
            } catch (e) {
                if (currentFetch === activeFetchRef.current) setStreamError("Portal Unstable");
            }
            if (currentFetch === activeFetchRef.current) setIsStreamLoading(false);
        };
        loadStream();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentEpId, user?.id, animeId, isSettingsLoaded, urlType, urlAudio, fetchTrigger]);

    // Handle explicit server/category/audio changes by the user
    useEffect(() => {
        if (initialSettingsMount.current) {
            initialSettingsMount.current = false;
            return;
        }
        if (programmaticServerRef.current && settings.server.toLowerCase() === programmaticServerRef.current) {
            programmaticServerRef.current = null;
            return;
        }

        if (isSettingsLoaded && currentEpId) {
            setFetchTrigger((prev: number) => prev + 1);
        }
    }, [settings.server, settings.category, settings.audio]);

    // Interval & Visibility: Local storage save every 15s, DB flush every 60s
    useEffect(() => {
        const localTimer = setInterval(() => saveProgress(false), 15000);
        const dbTimer = setInterval(() => flushSyncBuffer(), 60000);
        return () => { clearInterval(localTimer); clearInterval(dbTimer); };
    }, [saveProgress, flushSyncBuffer]);
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => { if (!ticking) { window.requestAnimationFrame(() => { if (window.scrollY > 100) { setHideInterface(false); if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current); } else { resetInterfaceTimer(); } ticking = false; }); ticking = true; } };
        window.addEventListener('scroll', handleScroll); handleScroll(); return () => window.removeEventListener('scroll', handleScroll);
    }, [resetInterfaceTimer]);
    useEffect(() => { const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') flushSyncBuffer(); }; document.addEventListener('visibilitychange', handleVisibilityChange); return () => document.removeEventListener('visibilitychange', handleVisibilityChange); }, [flushSyncBuffer]);

    const episodeChunks = useMemo(() => {
        if (!anime) return [];
        const chunks = [];
        for (let i = 0; i < anime.episodes.length; i += chunkSize) chunks.push(anime.episodes.slice(i, i + chunkSize));
        return chunks;
    }, [anime?.episodes, chunkSize]);

    const currentEpIndex = anime?.episodes ? anime.episodes.findIndex((e: any) => e.id === currentEpId) : -1;
    const currentEpisode = (anime && currentEpIndex >= 0) ? anime.episodes[currentEpIndex] : null;
    const nextEpisode = (anime && currentEpIndex >= 0 && currentEpIndex < anime.episodes.length - 1) ? anime.episodes[currentEpIndex + 1] : null;
    const prevEpisode = (anime && currentEpIndex > 0) ? anime.episodes[currentEpIndex - 1] : null;

    const currentChunkIndex = useMemo(() => {
        if (!currentEpId || !anime) return 0;
        const epIndex = anime.episodes.findIndex((e: any) => e.id === currentEpId);
        return epIndex === -1 ? 0 : Math.floor(epIndex / chunkSize);
    }, [currentEpId, anime, chunkSize]);

    // Active Embed Tracking: postMessage listener + 1-second playback heartbeat timer for iframe streams
    useEffect(() => {
        if (!streamUrl || !currentEpId) return;
        const isEmbed = !streamUrl.includes('.m3u8') && !streamUrl.includes('.mp4') && !streamUrl.includes('/api/proxy');
        if (!isEmbed) return;

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

        const timer = setInterval(() => {
            if (document.visibilityState !== 'visible') return;

            progressRef.current += 1;
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
            if ((settings.autoSkip) && intro?.start && intro?.end) {
                if (currentPos >= intro.start && currentPos < intro.end && !lastAutoSkippedIntroRef.current) {
                    lastAutoSkippedIntroRef.current = true;
                    progressRef.current = intro.end;
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

        return () => {
            window.removeEventListener('message', handleMessage);
            clearInterval(timer);
        };
    }, [streamUrl, currentEpId, anime?.episodes, settings.autoSkip, settings.autoSkipOutro, settings.autoNext, intro, outro, nextEpisode, saveProgress, handleEpisodeClick, handleSkipIntro, handleSkipOutro]);

    useEffect(() => {
        if (!currentEpId || !anime?.episodes?.length) return;
        const epIndex = anime.episodes.findIndex((e: any) =>
            e.id === currentEpId ||
            String(e.id) === String(currentEpId) ||
            String(e.number) === String(currentEpId) ||
            String(e.id).endsWith(`::${currentEpId}`) ||
            String(e.id).endsWith(`-${currentEpId}`)
        );
        if (epIndex !== -1) {
            setEpChunkIndex(Math.floor(epIndex / chunkSize));
        }
    }, [currentEpId, anime?.episodes, chunkSize]);

    const activeChunk = episodeChunks[epChunkIndex] || episodeChunks[currentChunkIndex] || [];

    const audioTrackOptions = useMemo(() => {
        const hasSub = true;
        const hasDub = !servers || (servers?.['en']?.length || servers?.['dub']?.length || 0) > 0 || !!currentEpisode?.hasDub || !!currentEpisode?.isDub || ((anime?.episodes as any)?.dub > 0);
        
        const currentEpNum = Number(currentEpisode?.number || 1);
        const hindiTotalEps = Number((anime as any)?.hindiDub?.totalEpisodes || 0);
        const isAnimeHindiAvailable = Boolean((anime as any)?.hindiDub?.available);

        // Hindi is available if servers['hi'] is populated for this episode, OR
        // if the anime has Hindi dub and this episode number is within the available Hindi episode count.
        const hasHindiForEpisode = (servers?.['hi']?.length || 0) > 0 || (
            isAnimeHindiAvailable && (
                hindiTotalEps === 0 || currentEpNum <= hindiTotalEps
            )
        );

        return [
            { id: primaryAudioId as 'jp' | 'cn' | 'kr' | 'en' | 'hi' | 'raw', label: primaryAudioLabel, available: hasSub },
            { id: 'en' as const, label: 'EN • Dub', available: hasDub },
            { id: 'hi' as const, label: 'HI • Dub', available: hasHindiForEpisode }
        ];
    }, [primaryAudioId, primaryAudioLabel, servers, currentEpisode, anime]);

    const handleAudioChange = useCallback((trackId: 'jp' | 'en' | 'hi' | 'cn' | 'kr' | 'raw') => {
        if (trackId === 'hi') {
            const currentEpNum = Number(currentEpisode?.number || 1);
            const hindiTotalEps = Number((anime as any)?.hindiDub?.totalEpisodes || 0);
            const isAnimeHindiAvailable = Boolean((anime as any)?.hindiDub?.available);
            const hasHiServer = (servers?.['hi']?.length || 0) > 0;
            const isEpAvailable = hasHiServer || (isAnimeHindiAvailable && (hindiTotalEps === 0 || currentEpNum <= hindiTotalEps));
            if (!isEpAvailable) {
                toast.info(`Hindi Dub is not available for Episode ${currentEpNum}.`);
                return;
            }
        }

        failedServersRef.current = [];
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('audio', trackId);
            url.searchParams.set('type', (trackId === 'en' || trackId === 'hi') ? 'dub' : 'sub');
            window.history.replaceState({}, '', url.toString());
        }

        const targetPool = servers?.[trackId] || (trackId === 'en' ? servers?.['dub'] : servers?.['sub']) || [];
        const serverExists = targetPool.some((s: any) => s.serverName?.toLowerCase() === settings.server?.toLowerCase());
        const targetServer = (serverExists ? settings.server : targetPool[0]?.serverName) || 'Vidstream';

        updateSetting('audio', trackId);
        updateSetting('category', (trackId === 'en' || trackId === 'hi') ? 'dub' : 'sub');
        if (targetServer !== settings.server) {
            updateSetting('server', targetServer);
        }

        const srv = targetPool.find((s: any) => (s.serverName || '').toLowerCase() === targetServer.toLowerCase()) || targetPool[0];
        if (srv && srv.url) {
            programmaticServerRef.current = (srv.serverName || targetServer).toLowerCase();
            setStreamUrl(srv.url);
            setStreamReferer(srv.referer || null);
            if (srv.tracks && Array.isArray(srv.tracks)) {
                setSubtitles(srv.tracks.map((t: any) => ({
                    file: t.file || t.url,
                    label: t.label || 'English',
                    kind: 'captions',
                    default: !!t.default
                })));
            }
            if (srv.intro) setIntro(srv.intro);
            if (srv.outro) setOutro(srv.outro);
            setServerChangeKey((prev: number) => prev + 1);
        } else {
            programmaticServerRef.current = null;
            setFetchTrigger((prev: number) => prev + 1);
        }
    }, [servers, settings.server, updateSetting]);

    if (!anime) return (<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

    const isDirectVideo = !!(streamUrl && (streamUrl.includes('.m3u8') || streamUrl.includes('.mp4') || streamUrl.includes('/api/proxy')));

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none selection:bg-primary-500/30">
            <style>{`
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
                    <div className="xl:col-span-8 w-full flex flex-col justify-start gap-3 order-1">
                        <div 
                            ref={playerContainerRef} 
                            tabIndex={0} 
                            style={playerAspectRatio ? { aspectRatio: `${playerAspectRatio}` } : undefined}
                            className={cn(
                                "w-full bg-black/40 backdrop-blur-2xl rounded-[30px] overflow-hidden border border-white/10 relative outline-none focus:ring-1 focus:ring-white/10 transition-all duration-300", 
                                !playerAspectRatio && "aspect-video",
                                settings.dimMode ? "z-[60] ring-2 ring-primary-500/50 shadow-[0_0_80px_rgba(0,0,0,0.9)]" : "z-10"
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
                                <AnimePlayer 
                                    key={`${currentEpId}-${settings.server}-${currentAudio}-${serverChangeKey}`} 
                                    ref={playerRef} 
                                    episodeId={currentEpId} 
                                    url={isDirectVideo ? (streamUrl || "") : ""} 
                                    iframeUrl={!isDirectVideo ? streamUrl : null}
                                    isEmbed={!isDirectVideo}
                                    referer={streamReferer} 
                                    subtitles={subtitles} 
                                    intro={intro} 
                                    outro={outro} 
                                    title={currentEpisode ? getCleanEpisodeTitle(currentEpisode.number, currentEpisode.title) : anime.title} 
                                    startTime={progressRef.current > 0 ? progressRef.current : resumeTime} 
                                    autoPlay={settings.autoPlay} 
                                    autoSkip={settings.autoSkip} 
                                    autoSkipOutro={settings.autoSkipOutro ?? settings.autoSkip}
                                    initialVolume={settings.volume} 
                                    onProgress={(s: any) => progressRef.current = s.playedSeconds} 
                                    onSeek={(seekTime: number) => { progressRef.current = seekTime; saveProgress(true); }} 
                                    onEnded={() => { saveProgress(true); if (settings.autoNext && nextEpisode) handleEpisodeClick(nextEpisode.id); }} 
                                    onNext={nextEpisode ? () => handleEpisodeClick(nextEpisode.id) : undefined}
                                     hasNext={!!nextEpisode}
                                    onInteract={() => { if (!hideInterface) resetInterfaceTimer(); }} 
                                    onPlay={handlePlaybackStart} 
                                    onPause={handlePause} 
                                    onSkipIntro={handleSkipIntro} 
                                    onSkipOutro={handleSkipOutro}
                                    onAspectRatioChange={setPlayerAspectRatio}
                                    onSettingsChange={updateSetting}
                                    onError={(err: any) => { 
                                        console.warn("Player Error, auto-switching server...", err); 
                                        switchToNextServer(settings.server); 
                                    }} 
                                />
                            ) : (<div className="w-full h-full flex items-center justify-center border-b border-white/5"><PlayerSkeleton /></div>)}
                        </div>

                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full transition-all duration-500 will-change-transform">
                            {/* ATRAX-UI DESKTOP CONTROL COCKPIT */}
                            <div className={cn("hidden lg:flex w-full bg-[#0c1322] border border-white/[0.12] rounded-[32px] shadow-[0_16px_45px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)] px-5 py-3.5 flex-col gap-3 overflow-visible mt-3 transition-all duration-500", settings.dimMode ? "z-[96] relative" : "relative z-10")}>
                                {/* ROW 1: Playback Navigation, Automations & Audio Selector */}
                                <div className="flex w-full justify-between items-center gap-3">
                                    {/* Left: Playback & Automation Buttons with Atrax Bubbly Spring */}
                                    <div className="flex items-center gap-1.5 md:gap-2 flex-nowrap shrink-0">
                                        <button
                                            disabled={!prevEpisode}
                                            onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)}
                                            className={cn(
                                                "flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md whitespace-nowrap atrax-bubbly-btn atrax-squish-tap",
                                                prevEpisode
                                                    ? "bg-[#141d30] border-white/10 text-zinc-300 hover:bg-primary-600 hover:border-primary-500 hover:text-white"
                                                    : "opacity-20 border-white/5 text-zinc-600 cursor-not-allowed"
                                            )}
                                        >
                                            <SkipBack size={12} /> PREV EP
                                        </button>
                                        <button
                                            onClick={() => updateSetting('autoSkip', !settings.autoSkip)}
                                            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/10 bg-[#141d30] text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap atrax-bubbly-btn atrax-squish-tap"
                                            title="Auto Skip Intro"
                                        >
                                            <FastForward size={12} className={cn("transition-colors", settings.autoSkip ? "text-amber-400" : "text-zinc-500")} />
                                            <span className={cn(settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP INTRO</span>
                                        </button>
                                        <button
                                            onClick={() => updateSetting('autoSkipOutro', !(settings.autoSkipOutro ?? settings.autoSkip))}
                                            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/10 bg-[#141d30] text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap atrax-bubbly-btn atrax-squish-tap"
                                            title="Auto Skip Outro"
                                        >
                                            <Forward size={12} className={cn("transition-colors", (settings.autoSkipOutro ?? settings.autoSkip) ? "text-indigo-400" : "text-zinc-500")} />
                                            <span className={cn((settings.autoSkipOutro ?? settings.autoSkip) ? "text-white" : "text-zinc-500")}>SKIP OUTRO</span>
                                        </button>
                                        <button
                                            onClick={() => updateSetting('autoPlay', !settings.autoPlay)}
                                            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/10 bg-[#141d30] text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap atrax-bubbly-btn atrax-squish-tap"
                                            title="Auto Play"
                                        >
                                            <Play size={12} className={cn("transition-colors", settings.autoPlay ? "text-violet-400" : "text-zinc-500")} />
                                            <span className={cn(settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span>
                                        </button>
                                        <button
                                            onClick={() => updateSetting('autoNext', !settings.autoNext)}
                                            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/10 bg-[#141d30] text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-white/10 whitespace-nowrap atrax-bubbly-btn atrax-squish-tap"
                                            title="Auto Next"
                                        >
                                            <SkipForward size={12} className={cn("transition-colors", settings.autoNext ? "text-violet-400" : "text-zinc-500")} />
                                            <span className={cn(settings.autoNext ? "text-white" : "text-zinc-500")}>NEXT</span>
                                        </button>
                                        {nextEpisode ? (
                                            <button
                                                onClick={() => handleEpisodeClick(nextEpisode.id)}
                                                className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-primary-500/30 bg-primary-600/20 text-primary-300 hover:bg-primary-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap group atrax-bubbly-btn atrax-squish-tap"
                                            >
                                                NEXT EP <SkipForward size={12} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-30 cursor-not-allowed"
                                            >
                                                NEXT EP <SkipForward size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Right: Theater Dim Mode + Audio Selection */}
                                    <div className="flex items-center gap-2.5 flex-shrink-0">
                                        <Button
                                            onClick={() => updateSetting('dimMode', !settings.dimMode)}
                                            variant="ghost"
                                            size="icon"
                                            className={cn("rounded-full w-8 h-8 transition-all hover:scale-110 flex-shrink-0 border atrax-bubbly-btn atrax-squish-tap", settings.dimMode ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/40" : "text-zinc-400 hover:text-zinc-200 bg-[#141d30] border-white/10 hover:bg-white/10")}
                                            title="Theater Dim Mode"
                                        >
                                            <Lightbulb size={13} />
                                        </Button>

                                        <div className="flex bg-[#090e18] rounded-full p-1 border border-white/[0.08] shadow-inner flex-shrink-0 relative">
                                            {audioTrackOptions.map((track) => {
                                                const isCurrent = currentAudio === track.id;
                                                return (
                                                    <button
                                                        key={track.id}
                                                        disabled={!track.available}
                                                        onClick={() => handleAudioChange(track.id)}
                                                        className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all relative flex items-center justify-center gap-1.5 overflow-hidden atrax-squish-tap",
                                                            isCurrent
                                                                ? "text-white shadow-lg z-10"
                                                                : track.available
                                                                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                                                                    : "opacity-25 pointer-events-none text-zinc-600"
                                                        )}
                                                        title={track.available ? `Switch to ${track.label}` : `${track.label} not available`}
                                                    >
                                                        {isCurrent && (
                                                            <motion.div
                                                                layoutId="activeAudioPillDesktop"
                                                                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full -z-10 shadow-[0_0_15px_rgba(124,58,237,0.35)]"
                                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                                            />
                                                        )}
                                                        {track.available && !isCurrent && (
                                                            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-full opacity-25">
                                                                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[available-sheen_3.5s_infinite]" />
                                                            </div>
                                                        )}
                                                        <span>{track.label}</span>
                                                        {track.available && isCurrent && (
                                                            <span className="inline-flex items-end gap-[2px] h-3 ml-0.5" aria-hidden="true">
                                                                <span className="w-[2px] bg-white rounded-full animate-[audio-bar-1_0.8s_ease-in-out_infinite]" />
                                                                <span className="w-[2px] bg-white rounded-full animate-[audio-bar-2_0.8s_ease-in-out_infinite]" />
                                                                <span className="w-[2px] bg-white rounded-full animate-[audio-bar-3_0.8s_ease-in-out_infinite]" />
                                                            </span>
                                                        )}
                                                        {track.available && !isCurrent && (
                                                            <span className="inline-flex items-end gap-[1.5px] h-2.5 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity" title="Audio track available">
                                                                <span className="w-[1.5px] bg-emerald-400 rounded-full animate-[available-wave-1_1.4s_ease-in-out_infinite]" />
                                                                <span className="w-[1.5px] bg-emerald-400 rounded-full animate-[available-wave-2_1.4s_ease-in-out_infinite]" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: Episode Context, Countdown Timer, Actions & Server Selector */}
                                <div className="flex w-full justify-between items-center gap-3 border-t border-white/[0.08] pt-2.5">
                                    {/* Left: Episode info & live countdown timer */}
                                    <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                                        <div className="min-w-0 max-w-[280px] xl:max-w-[380px] flex items-center">
                                            <MarqueeTitle text={getCleanEpisodeTitle(currentEpisode?.number || '1', currentEpisode?.title)} />
                                        </div>
                                        <div className="shrink-0">
                                            <NextEpisodeTimer
                                                schedule={(anime as any)?.nextAiringEpisode || (anime as any)?.info?.nextAiringEpisode || nextEpSchedule}
                                                status={anime.info.status}
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Actions + Server Selector at the right corner */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <WatchListButton
                                            animeId={anime.id}
                                            animeTitle={anime.title}
                                            animeImage={anime.poster}
                                            currentEp={currentEpisode?.number}
                                            totalEpisodes={anime.episodes?.length || 1}
                                            type={(anime as any).type || (anime.info as any)?.stats?.type || "TV"}
                                        />
                                        {currentEpId && (
                                            <Link
                                                href={`/download/anime/${anime.id}?ep=${currentEpId}`}
                                                className="flex items-center justify-center px-3.5 h-8 rounded-full border border-white/10 bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white whitespace-nowrap shadow-md gap-1.5 atrax-bubbly-btn atrax-squish-tap"
                                                title="Download Episode"
                                            >
                                                <Download size={12} /> <span className="hidden xl:inline">Download</span>
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => setShowShareModal(true)}
                                            className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/10 bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary-600 hover:border-primary-500 hover:text-white whitespace-nowrap shadow-md atrax-bubbly-btn atrax-squish-tap"
                                            title="Share Episode"
                                        >
                                            <Share2 size={12} /> Share
                                        </button>
                                        <button
                                            onClick={handleCreateWatchRoom}
                                            className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/10 bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary-600 hover:border-primary-500 hover:text-white whitespace-nowrap shadow-md cursor-pointer atrax-bubbly-btn atrax-squish-tap"
                                            title="Create Watch Room"
                                        >
                                            <Users size={12} /> Room
                                        </button>

                                        {/* Server Selector at right corner */}
                                        {mounted ? (
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-300 hover:text-white uppercase transition-all shadow-md whitespace-nowrap rounded-full border border-white/10 bg-[#141d30] hover:bg-white/15 px-3.5 atrax-bubbly-btn atrax-squish-tap">
                                                        <ServerIcon size={12} className="text-primary-500" />
                                                        {currentAudioServers && currentAudioServers.length > 0
                                                            ? (() => {
                                                                const active = currentAudioServers.find((s: any) => s.serverName.toLowerCase() === settings.server.toLowerCase());
                                                                return formatServerDisplayName(active ? active.serverName : currentAudioServers[0].serverName);
                                                            })()
                                                            : (isStreamLoading ? 'Loading...' : 'No Portals')}
                                                        <ChevronDown size={11} className="text-zinc-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0c1322] border border-white/15 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.12)] z-[40] min-w-[150px] w-auto h-auto max-h-[220px] p-2">
                                                    <ScrollArea className="h-auto max-h-[190px] custom-scrollbar">
                                                        <div className="flex flex-col gap-1">
                                                            {currentAudioServers.map((srv: any, idx: number) => (
                                                                <DropdownMenuItem
                                                                    key={srv.serverId || idx}
                                                                    onClick={() => handleServerChange(srv.serverName, true)}
                                                                    className={cn(
                                                                        "cursor-pointer focus:bg-primary-600 focus:text-white px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-1 transition-all atrax-squish-tap",
                                                                        settings.server.toLowerCase() === srv.serverName.toLowerCase()
                                                                            ? "bg-primary-600 text-white shadow-lg"
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
                                            <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-300 hover:text-white uppercase transition-all shadow-md whitespace-nowrap rounded-full border border-white/10 bg-[#141d30] px-3.5">
                                                <ServerIcon size={12} />
                                                {currentAudioServers && currentAudioServers.length > 0
                                                    ? (() => {
                                                        const active = currentAudioServers.find((s: any) => s.serverName.toLowerCase() === settings.server.toLowerCase());
                                                        return formatServerDisplayName(active ? active.serverName : currentAudioServers[0].serverName);
                                                    })()
                                                    : (isStreamLoading ? 'Loading...' : 'No Portals')}
                                                <ChevronDown size={11} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ATRAX-UI MOBILE CONTROLS COCKPIT */}
                            <div className={cn("flex lg:hidden w-full bg-[#0c1322] border border-white/[0.10] rounded-[26px] shadow-[0_16px_40px_rgba(0,0,0,0.7)] px-3 py-2.5 flex-col gap-2 overflow-hidden mt-3 transition-all duration-500", settings.dimMode ? "z-[96] relative" : "relative z-10")}>
                                {/* Row 1: Playback Navigation & Automation Toggles (Monet Material Tonal Pills - No Dots) */}
                                <div className="flex w-full justify-between items-center gap-1.5">
                                    <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className="flex-1 h-8 sm:h-9 rounded-full border-0 bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all atrax-bubbly-btn atrax-squish-tap" title="Previous Episode"><SkipBack size={13} /></button>
                                    <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className={cn("flex-1 h-8 sm:h-9 rounded-full border-0 flex items-center justify-center transition-all active:scale-95 atrax-bubbly-btn atrax-squish-tap", settings.autoSkip ? "bg-amber-400/20 text-amber-300 shadow-sm" : "bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-zinc-200")} title={`Auto Skip Intro: ${settings.autoSkip ? 'ON' : 'OFF'}`}>
                                        <FastForward size={13} className={cn("transition-transform", settings.autoSkip && "scale-110")} />
                                    </button>
                                    <button onClick={() => updateSetting('autoSkipOutro', !(settings.autoSkipOutro ?? settings.autoSkip))} className={cn("flex-1 h-8 sm:h-9 rounded-full border-0 flex items-center justify-center transition-all active:scale-95 atrax-bubbly-btn atrax-squish-tap", (settings.autoSkipOutro ?? settings.autoSkip) ? "bg-indigo-400/20 text-indigo-300 shadow-sm" : "bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-zinc-200")} title={`Auto Skip Outro: ${(settings.autoSkipOutro ?? settings.autoSkip) ? 'ON' : 'OFF'}`}>
                                        <Forward size={13} className={cn("transition-transform", (settings.autoSkipOutro ?? settings.autoSkip) && "scale-110")} />
                                    </button>
                                    <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className={cn("flex-1 h-8 sm:h-9 rounded-full border-0 flex items-center justify-center transition-all active:scale-95 atrax-bubbly-btn atrax-squish-tap", settings.autoPlay ? "bg-primary-500/20 text-primary-300 shadow-sm" : "bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-zinc-200")} title={`Auto Play: ${settings.autoPlay ? 'ON' : 'OFF'}`}>
                                        <PlayCircle size={13} className={cn("transition-transform", settings.autoPlay && "scale-110")} />
                                    </button>
                                    <button onClick={() => updateSetting('autoNext', !settings.autoNext)} className={cn("flex-1 h-8 sm:h-9 rounded-full border-0 flex items-center justify-center transition-all active:scale-95 atrax-bubbly-btn atrax-squish-tap", settings.autoNext ? "bg-primary-500/20 text-primary-300 shadow-sm" : "bg-white/[0.06] hover:bg-white/10 text-zinc-400 hover:text-zinc-200")} title={`Auto Next Episode: ${settings.autoNext ? 'ON' : 'OFF'}`}>
                                        <StepForward size={13} className={cn("transition-transform", settings.autoNext && "scale-110")} />
                                    </button>
                                    <button disabled={!nextEpisode} onClick={() => nextEpisode && handleEpisodeClick(nextEpisode.id)} className="flex-1 h-8 sm:h-9 rounded-full border-0 bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all atrax-bubbly-btn atrax-squish-tap" title="Next Episode"><SkipForward size={13} /></button>
                                </div>

                                {/* Row 2: Audio Track Selection & Server Menu */}
                                <div className="flex w-full items-center gap-2">
                                    <div className="flex bg-black/40 rounded-full p-1 border border-white/[0.06] flex-1 min-w-0 justify-center relative">
                                        {audioTrackOptions.map((track) => {
                                            const isCurrent = currentAudio === track.id;
                                            return (
                                                <button
                                                    key={track.id}
                                                    disabled={!track.available}
                                                    onClick={() => handleAudioChange(track.id)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all relative active:scale-95 shadow-sm flex-1 text-center flex items-center justify-center gap-1 overflow-hidden atrax-squish-tap",
                                                        isCurrent
                                                            ? "text-white shadow-lg z-10"
                                                            : track.available
                                                                ? "text-zinc-400 hover:text-white"
                                                                : "opacity-25 pointer-events-none text-zinc-600"
                                                    )}
                                                >
                                                    {isCurrent && (
                                                        <motion.div
                                                            layoutId="activeAudioPillMobile"
                                                            className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full -z-10 shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                                                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                                        />
                                                    )}
                                                    <span>{track.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {mounted ? (
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 gap-1.5 text-[9px] font-black text-zinc-300 bg-white/[0.06] hover:bg-white/10 rounded-full border-0 px-3 shrink-0 justify-between max-w-[130px] sm:max-w-[150px] atrax-bubbly-btn atrax-squish-tap">
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <ServerIcon size={11} className="text-primary-500 shrink-0" />
                                                        <span className="truncate">
                                                            {currentAudioServers && currentAudioServers.length > 0
                                                                ? (() => {
                                                                    const active = currentAudioServers.find((s: any) => s.serverName.toLowerCase() === settings.server.toLowerCase());
                                                                    return formatServerDisplayName(active ? active.serverName : currentAudioServers[0].serverName);
                                                                })()
                                                                : (isStreamLoading ? 'Loading...' : 'None')}
                                                        </span>
                                                    </span>
                                                    <ChevronDown size={10} className="text-zinc-500 shrink-0" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#0c1322] border border-white/15 rounded-[22px] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[70] min-w-[140px]">
                                                <ScrollArea className="h-auto max-h-[160px]">
                                                    <div className="flex flex-col gap-1">
                                                        {currentAudioServers.map((srv: any, idx: number) => (
                                                            <DropdownMenuItem
                                                                key={srv.serverId || idx}
                                                                onClick={() => handleServerChange(srv.serverName, true)}
                                                                className={cn(
                                                                    "text-[9px] uppercase font-bold px-2.5 py-1.5 rounded-full cursor-pointer atrax-squish-tap",
                                                                    settings.server.toLowerCase() === srv.serverName.toLowerCase() ? "bg-primary-600 text-white" : "text-zinc-400 hover:bg-white/10"
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
                                        <Button variant="ghost" className="h-8 gap-1.5 text-[9px] font-black text-zinc-400 bg-white/[0.06] rounded-full border-0 px-2.5 shrink-0">
                                            <ServerIcon size={11} />
                                            <span>Server</span>
                                        </Button>
                                    )}
                                </div>

                                {/* Row 3: Watchlist, Download, Share, Room & Theater Bulb Mode (Full width expanded, progressive right-to-left compaction) */}
                                <div className="flex w-full items-center gap-1.5 sm:gap-2">
                                    <div className="shrink-0">
                                        <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} totalEpisodes={anime.episodes?.length || 1} type={(anime as any).type || (anime.info as any)?.stats?.type || "TV"} />
                                    </div>

                                    {currentEpisode?.id && (
                                        <Link
                                            href={`/download/anime/${anime.id}?ep=${currentEpisode.id}`}
                                            className="flex-1 min-w-0 h-8 rounded-full border-0 bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 px-2 atrax-bubbly-btn atrax-squish-tap"
                                            title="Download Episode"
                                        >
                                            <Download size={12} className="shrink-0" />
                                            <span className="truncate hidden min-[320px]:inline">Download</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="flex-1 min-w-0 h-8 rounded-full border-0 bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 px-2 atrax-bubbly-btn atrax-squish-tap"
                                        title="Share Episode"
                                    >
                                        <Share2 size={12} className="shrink-0" />
                                        <span className="truncate hidden min-[390px]:inline">Share</span>
                                    </button>
                                    <button
                                        onClick={handleCreateWatchRoom}
                                        className="flex-1 min-w-0 h-8 rounded-full border-0 bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 px-2 atrax-bubbly-btn atrax-squish-tap"
                                        title="Create Watch Room"
                                    >
                                        <Users size={12} className="shrink-0" />
                                        <span className="truncate hidden min-[450px]:inline">Room</span>
                                    </button>
                                    <Button
                                        onClick={() => updateSetting('dimMode', !settings.dimMode)}
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "rounded-full w-8 h-8 shrink-0 border-0 atrax-bubbly-btn atrax-squish-tap",
                                            settings.dimMode ? "text-yellow-300 bg-yellow-400/20" : "text-zinc-400 bg-white/[0.06] hover:bg-white/10 hover:text-zinc-200"
                                        )}
                                        title="Theater Dim Mode"
                                    >
                                        <Lightbulb size={13} />
                                    </Button>
                                </div>

                                {/* Row 4: Now Playing Context & Schedule Timer */}
                                <div className="flex w-full items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                                    <div className="min-w-0 flex-1"><MarqueeTitle text={getCleanEpisodeTitle(currentEpisode?.number || '1', currentEpisode?.title)} /></div>
                                    <div className="shrink-0"><NextEpisodeTimer schedule={(anime as any)?.nextAiringEpisode || (anime as any)?.info?.nextAiringEpisode || nextEpSchedule} status={anime.info.status} /></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ATRAX-UI EPISODES SIDEBAR */}
                    <div className="xl:col-span-4 w-full h-[460px] sm:h-[520px] xl:h-auto xl:relative xl:self-stretch order-2">
                        <div className="w-full h-full xl:absolute xl:inset-0 bg-[#0c1322] rounded-[32px] border border-white/[0.12] shadow-[0_16px_45px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden flex flex-col relative z-20">
                        <div className="p-5 bg-[#0e1628] border-b border-white/[0.08] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-lemon tracking-widest"><Layers size={18} className="text-primary-600" /> Episodes</h3><span className="bg-[#162138] border border-white/15 text-white font-black text-[10px] px-3 h-5 rounded-full flex items-center shadow-sm">{anime.episodes.length}</span></div>
                            <div className="flex items-center gap-1 bg-[#090e18] p-1 rounded-full border border-white/[0.08] relative">
                                {[
                                    { mode: 'compact', icon: Grid, label: 'Compact' },
                                    { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
                                    { mode: 'list', icon: List, label: 'List' },
                                ].map(({ mode, icon: Icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setEpViewMode(mode as any)}
                                        className={cn(
                                            "relative p-1.5 rounded-lg transition-colors z-10 flex items-center justify-center",
                                            epViewMode === mode ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {epViewMode === mode && (
                                            <motion.div
                                                layoutId="epViewModeActivePill"
                                                className="absolute inset-0 bg-primary-600 rounded-lg shadow-[0_0_12px_rgba(220,38,38,0.5)] z-[-1]"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <Icon size={14} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="w-full border-b border-white/10 bg-white/5 backdrop-blur-md flex-shrink-0 py-3 relative group/chunks">
                            <div ref={chunksRef} className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing px-4">
                                {episodeChunks.map((chunk: any[], idx: number) => (
                                    <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full transition-all border shadow-sm uppercase tracking-wider backdrop-blur-md", epChunkIndex === idx ? "bg-primary-600 text-white border-primary-500 shadow-primary-900/20" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10")}>{getChunkLabel(chunk, (idx * chunkSize) + 1, Math.min((idx + 1) * chunkSize, anime.episodes.length))}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-2 custom-scrollbar overflow-x-hidden">
                            <div
                                ref={epContainerRef}
                                className={cn(
                                    "p-2 grid",
                                    epViewMode === 'grid' ? 'grid-cols-5 gap-2.5' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-2'
                                )}
                            >
                                {episodeChunks[epChunkIndex]?.map((ep: any) => {
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
                            </div></div>
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
                        <div className="flex-shrink-0 relative z-10 p-8 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-primary-600/5 to-transparent">
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
                                <div className="flex lg:hidden flex-col gap-2 w-full items-center text-center">
                                    <h1 className="text-2xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-2xl shadow-black scale-[0.85] origin-center">
                                        <span>{anime.title}</span>
                                    </h1>
                                    {(anime as any)?.hindiDub?.available && (
                                        <span className="text-xs font-semibold tracking-wide text-amber-400/90 font-sans">
                                            {formatHindiDubType((anime as any).hindiDub.dubType)}
                                        </span>
                                    )}
                                    {anime.jname && (
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] opacity-60">
                                            {anime.jname}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-3 mt-2 justify-center items-center">
                                        <div className="flex items-center flex-wrap justify-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20 max-w-full">
                                            {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult) && (
                                                <>
                                                    <span className={cn(formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('18') || formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('R') ? "text-primary-500 font-black" : "text-zinc-300 font-bold")}>
                                                        {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                                </>
                                            )}
                                            {/airing|releasing|ongoing/i.test(anime.info.status || '') ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-black tracking-wider text-[11px]">
                                                    <PlayCircle size={12} className="text-emerald-400" />
                                                    RELEASING
                                                </span>
                                            ) : /finished|completed|ended/i.test(anime.info.status || '') ? (
                                                <span className="inline-flex items-center gap-1 text-blue-400 font-black tracking-wider text-[11px]">
                                                    <CheckCircle size={12} className="text-blue-400" />
                                                    FINISHED
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400 font-bold uppercase">{anime.info.status}</span>
                                            )}
                                            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-600 shadow-primary-900/20" /> {anime.stats.duration}</div>
                                            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                            <div className="text-yellow-500">MAL: {anime.stats.malScore}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                                </div>
                                <div className="hidden lg:flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                            </div>
                            <div className="hidden lg:flex flex-1 pt-2 text-left z-10 flex-col h-full w-full">
                                <h1 className="text-3xl md:text-5xl font-black text-white font-lemon leading-none tracking-tighter drop-shadow-2xl shadow-black scale-[0.85] origin-left">
                                    <span>{anime.title}</span>
                                </h1>
                                {(anime as any)?.hindiDub?.available && (
                                    <div className="mt-1.5 mb-1">
                                        <span className="text-xs md:text-sm font-semibold tracking-wide text-amber-400/90 font-sans">
                                            {formatHindiDubType((anime as any).hindiDub.dubType)}
                                        </span>
                                    </div>
                                )}
                                {anime.jname && (
                                    <p className={cn("text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] opacity-60 drop-shadow-sm", (anime as any)?.hindiDub?.available ? "mb-5" : "mt-2 mb-6")}>
                                        {anime.jname}
                                    </p>
                                )}
                                {!anime.jname && (anime as any)?.hindiDub?.available && (
                                    <div className="mb-4" />
                                )}
                                <div className="flex flex-wrap gap-4 mt-1 justify-start items-center">
                                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20">
                                        {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult) && (
                                            <>
                                                <span className={cn(formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('18') || formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)?.includes('R') ? "text-primary-500 font-black" : "text-zinc-300 font-bold")}>
                                                    {formatRating(anime.stats.rating, anime.info.genres, anime.isAdult)}
                                                </span>
                                                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                            </>
                                        )}
                                        {/airing|releasing|ongoing/i.test(anime.info.status || '') ? (
                                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-black tracking-wider text-[11px]">
                                                <PlayCircle size={12} className="text-emerald-400" />
                                                RELEASING
                                            </span>
                                        ) : /finished|completed|ended/i.test(anime.info.status || '') ? (
                                            <span className="inline-flex items-center gap-1 text-blue-400 font-black tracking-wider text-[11px]">
                                                <CheckCircle size={12} className="text-blue-400" />
                                                FINISHED
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 font-bold uppercase">{anime.info.status}</span>
                                        )}
                                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-600 shadow-primary-900/20" /> {anime.stats.duration}</div>
                                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                        <div className="text-yellow-500">MAL: {anime.stats.malScore}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-6 justify-start">
                                    {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-primary-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-primary-900/20 shadow-primary-900/10">{g}</Link>))}
                                </div>
                                <div className="mt-auto pt-6 w-full flex justify-end"><StarRating animeId={animeId} initialRating={anime.stats.malScore && !isNaN(Number(anime.stats.malScore)) ? (parseFloat(anime.stats.malScore) / 2) : 0} /></div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative sm:px-10 mt-4 overflow-hidden flex flex-col">
                            <div className="lg:hidden flex flex-wrap gap-2 justify-center mb-6">
                                {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[8px] px-3 py-1 bg-white/5 rounded-full text-zinc-500 border border-white/5 uppercase font-bold">{g}</Link>))}
                            </div>
                            <div className="lg:hidden flex justify-center mb-6"><StarRating animeId={animeId} initialRating={anime.stats.malScore && !isNaN(Number(anime.stats.malScore)) ? (parseFloat(anime.stats.malScore) / 2) : 0} /></div>
                            <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2 shadow-sm shrink-0"><Info size={12} className="shadow-sm" /> Synopsis</h4>
                            <ScrollArea className="flex-1 pr-4 custom-scrollbar shadow-inner shadow-primary-900/5">
                                <p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased font-medium opacity-90 drop-shadow-sm shadow-black" dangerouslySetInnerHTML={{ __html: anime.description }} />
                            </ScrollArea>
                            {/* RESTORED AND VISIBLE ON PC */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-6 mb-6">
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Aired</span>
                                    <span className="text-[9px] font-bold text-zinc-300 text-center">{anime.info.aired}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Premiered</span>
                                    <span className="text-[9px] font-bold text-zinc-300">{anime.info.premiered}</span>
                                </div>
                                {mounted ? (
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Studios</span>
                                                <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.studios?.[0] || '?'} <ChevronDown size={8} /></span>
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.studios.map((s: string) => <DropdownMenuItem key={s} className="hover:bg-white/10 cursor-pointer rounded-lg">{s}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Studios</span>
                                        <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.studios?.[0] || '?'} <ChevronDown size={8} /></span>
                                    </div>
                                )}
                                {mounted ? (
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Producers</span>
                                                <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.producers?.[0] || '?'} <ChevronDown size={8} /></span>
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.producers.map((p: string) => <DropdownMenuItem key={p} className="hover:bg-white/10 cursor-pointer rounded-lg">{p}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Producers</span>
                                        <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.producers?.[0] || '?'} <ChevronDown size={8} /></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <div className="xl:col-span-4 w-full h-[500px] xl:h-auto xl:relative xl:self-stretch order-5">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="w-full h-full xl:absolute xl:inset-0 bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl shadow-primary-900/10">
                            <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-3 shrink-0"><Wand2 size={18} className="text-primary-600" /><h3 className="font-black text-white text-sm font-lemon tracking-widest uppercase">Suggestions</h3></div>
                            <ScrollArea className="flex-1 custom-scrollbar">
                                <div className="p-4 flex flex-col gap-3">
                                    {anime.recommendations && anime.recommendations.length > 0 ? (
                                        anime.recommendations.slice(0, 10).map((rec: any) => {
                                            const recSlug = slugifyTitle(rec.title);
                                            const recRouteId = (recSlug && !String(rec.id).includes('-')) ? `${rec.id}-${recSlug}` : rec.id;
                                            return (
                                                <Link key={rec.id} href={`/watch/${recRouteId}`} className="flex gap-4 bg-white/5 border border-white/5 rounded-2xl p-2 hover:bg-white/10 hover:border-white/10 transition-colors group shadow-sm">
                                                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-xl overflow-hidden relative shadow-md shadow-black/40"><img src={getSafeImageUrl(rec.poster)} onError={(e) => { if (e.currentTarget.src.startsWith('/api/proxy')) { e.currentTarget.src = '/images/placeholder-no-img.jpg'; } else if (e.currentTarget.src.startsWith('http')) { e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(e.currentTarget.src)}`; } else { e.currentTarget.src = '/images/placeholder-no-img.jpg'; } }} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rec.title} loading="lazy" decoding="async" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Play size={20} className="text-white" /></div></div>
                                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center gap-1">
                                                    <h4 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-tight group-hover:text-primary-500 transition-colors">{rec.title}</h4>
                                                    {rec.jname && <p className="text-[9px] text-zinc-500 truncate uppercase font-bold tracking-wider">{rec.jname}</p>}
                                                    <div className="flex items-center gap-2 mt-auto text-[9px] sm:text-[10px] text-zinc-400 font-black uppercase tracking-wider"><span className="text-primary-500 px-2 py-0.5 bg-primary-900/20 rounded-md border border-primary-900/30">{rec.type || 'TV'}</span><span className="w-1 h-1 bg-zinc-600 rounded-full" /><div className="flex items-center gap-1"><Clock size={10} className="text-primary-600" />{rec.duration || '?'}</div></div>
                                                </div>
                                                </Link>
                                            );
                                        })
                                    ) : (
                                        <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"><ServerIcon size={20} className="opacity-50" /></div>
                                            <span className="text-xs font-black uppercase tracking-widest">No Recommendations Found</span>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </motion.div>
                    </div>

                    {/* CHARACTERS & VOICE CAST */}
                    {anime.characters && anime.characters.length > 0 && (
                        <AnimeCharactersBlock characters={anime.characters} />
                    )}

                    {/* RELATED SECTION (FAMILY LINEAGE) */}
                    {anime.related && anime.related.length > 0 && (
                        <div className="xl:col-span-12 w-full mt-4 bg-[#0a0a0a] rounded-[36px] border border-white/5 p-5 md:p-7 shadow-2xl relative shadow-primary-900/10 order-4 xl:order-5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                                        <Layers size={16} className="text-primary-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-sm font-lemon tracking-widest uppercase">Family Lineage</h3>
                                        <p className="text-[10px] text-zinc-400">Prequels, sequels, spin-offs & alternative versions</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-black text-zinc-500 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                    {anime.related.length} entries
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {anime.related.map((rel: any) => {
                                    const relationLabel = (rel.relationType || rel.type || 'RELATED').replace(/_/g, ' ');
                                    const badgeStyle = getRelationBadgeStyle(rel.relationType || rel.type);
                                    const relSlug = slugifyTitle(rel.title);
                                    const relRouteId = (relSlug && !String(rel.id).includes('-')) ? `${rel.id}-${relSlug}` : rel.id;
                                    return (
                                        <Link
                                            key={rel.id}
                                            href={`/watch/${relRouteId}`}
                                            className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all duration-300 relative overflow-hidden"
                                        >
                                            {/* Compact thumbnail with play overlay */}
                                            <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 relative bg-zinc-900 border border-white/10 shadow-md">
                                                <img
                                                    src={getSafeImageUrl(rel.poster || '/images/no-thumb.png')}
                                                    alt={rel.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play size={16} fill="white" className="text-white drop-shadow-md" />
                                                </div>
                                            </div>

                                            {/* Metadata */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider", badgeStyle)}>
                                                        {relationLabel}
                                                    </span>
                                                    {rel.type && rel.type !== rel.relationType && (
                                                        <span className="text-[9px] font-bold text-zinc-400 px-1.5 py-0.5 rounded bg-white/5 uppercase">
                                                            {rel.type}
                                                        </span>
                                                    )}
                                                    {rel.status && (
                                                        <span className={cn(
                                                            "text-[9px] font-bold uppercase",
                                                            rel.status.toLowerCase().includes('releasing') ? "text-emerald-400" : "text-zinc-500"
                                                        )}>
                                                            • {rel.status.toLowerCase().includes('releasing') ? 'Airing' : 'Completed'}
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-1 truncate">
                                                    {rel.title}
                                                </h4>

                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                                    {rel.year && <span>{rel.year}</span>}
                                                    {rel.episodesCount && <span>• {rel.episodesCount} eps</span>}
                                                    {rel.score && (
                                                        <span className="flex items-center gap-0.5 text-amber-400 font-bold ml-auto">
                                                            ★ {rel.score}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* COMMENTS SECTION */}
                    <div className="xl:col-span-12 w-full mt-2 order-6">
                        <ShadowComments 
                            key={user?.id || 'guest'} 
                            episodeId={currentEpId || "general"} 
                            themeColor={urlAudio === 'hi' || currentAudio === 'hi' ? 'hindi' : undefined}
                        />
                    </div>

                    {/* BOTTOM ADS BANNER */}
                    <div className="xl:col-span-12 w-full mt-8 order-7">
                        <AdsterraNativeBanner location="watch" format="native" />
                    </div>
                </div>
            </motion.div>

            <Footer />
            <PostShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                customUrl={typeof window !== 'undefined' ? window.location.href : ''}
                customTitle={`${anime?.title || 'Anime'} - Episode ${currentEpisode?.number || '1'}`}
                customContent={`Watch ${anime?.title || 'Anime'} Episode ${currentEpisode?.number || '1'} on Kagemi!`}
            />
        </div>
    );
}

export default function WatchPage({ initialAnime }: { initialAnime?: UniversalAnime | null } = {}) { return <Suspense fallback={<WatchPageSkeleton />}><WatchContent initialAnime={initialAnime} /></Suspense>; }