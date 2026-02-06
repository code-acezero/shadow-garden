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
  FastForward, Star, Info, MessageSquare, User,
  Loader2, Globe, Flame, Calendar, Copyright, Check, Mic, X,
  ChevronLeft, ChevronRight, Pause, ArrowLeft, ArrowRight, Download,
  Eye, ThumbsUp
} from 'lucide-react';

import { AnimeAPI_V3, UniversalAnime } from '@/lib/api'; 
import { hpi, DesiDubStream, DesiDubDetails } from '@/lib/hpi';          
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

import HindiPlayer, { HindiPlayerRef } from '@/components/Player/HindiPlayer';
import WatchListButton from '@/components/Watch/WatchListButton';
import ShadowComments from '@/components/Comments/ShadowComments';
import Footer from '@/components/Anime/Footer';
import { Button } from '@/components/ui/button';
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
        const onMouseDown = (e: MouseEvent) => { isDown = true; slider.style.cursor = 'grabbing'; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; };
        const onMouseLeave = () => { isDown = false; slider.style.cursor = 'grab'; };
        const onMouseUp = () => { isDown = false; slider.style.cursor = 'grab'; };
        const onMouseMove = (e: MouseEvent) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 2; slider.scrollLeft = scrollLeft - walk; };
        slider.addEventListener('mousedown', onMouseDown); slider.addEventListener('mouseleave', onMouseLeave); slider.addEventListener('mouseup', onMouseUp); slider.addEventListener('mousemove', onMouseMove);
        return () => { slider.removeEventListener('mousedown', onMouseDown); slider.removeEventListener('mouseleave', onMouseLeave); slider.removeEventListener('mouseup', onMouseUp); slider.removeEventListener('mousemove', onMouseMove); };
    }, []);
    return ref;
}

const useWatchSettings = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState({
    autoPlay: true, autoNext: true, autoSkip: false, dimMode: false,
    server: 'Portal 1', category: 'dub' as 'dub' | 'sub', volume: 1
  });
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('shadow_watch_settings_in');
          if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
          setIsLoaded(true);
      }
  }, []);
  const updateSetting = useCallback((key: string, value: any) => {
      setSettings(prev => {
          const newSettings = { ...prev, [key]: value };
          localStorage.setItem('shadow_watch_settings_in', JSON.stringify(newSettings));
          return newSettings;
      });
  }, []);
  return { settings, updateSetting, isSettingsLoaded: isLoaded };
};

// --- 2. HELPERS ---

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try { return await operation(); } 
    catch (error) { if (retries <= 0) throw error; await new Promise(res => setTimeout(res, delay)); return retryOperation(operation, retries - 1, delay * 2); }
}

const formatRating = (rating?: string) => {
    if (!rating) return null;
    const r = rating.toString().toUpperCase();
    if (r.includes('R') || r.includes('RX') || r.includes('18+') || r.includes('17+')) return '18+';
    return rating;
};

const formatDuration = (raw: string) => {
    if (!raw) return "24m";
    const num = raw.match(/\d+/);
    return num ? `${num[0]}m` : "24m";
};

// --- 3. SUB-COMPONENTS ---

// Page Loader - Simple Circular Percentage
const SimpleCircularLoader = () => {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPercentage((prev) => {
                if (prev >= 100) { clearInterval(interval); return 100; }
                return Math.min(100, prev + Math.floor(Math.random() * 8) + 2);
            });
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const radius = 40;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#050505] z-[9999] fixed inset-0 pointer-events-none">
            <div className="relative flex items-center justify-center">
                <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                    <circle stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} fill="transparent" />
                    <circle stroke="#dc2626" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} fill="transparent" className="transition-all duration-100 ease-out" />
                </svg>
                <span className="absolute text-lg font-black text-white font-[Cinzel]">{percentage}%</span>
            </div>
             <span className="mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Summoning...</span>
        </div>
    );
};

// Local Component Loader (Static)
const FantasyLoader = memo(({ text = "SUMMONING..." }: { text?: string }) => (
  <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center relative bg-transparent">
    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4 shadow-primary-500/20" />
    <h2 className="text-[10px] font-[Cinzel] text-primary-500 animate-pulse tracking-[0.3em]">{text}</h2>
  </div>
));
FantasyLoader.displayName = "FantasyLoader";

const NextEpisodeTimer = ({ date }: { date: string | null }) => {
   const [timeLeft, setTimeLeft] = useState("...");
   useEffect(() => {
     if (!date) return;
     const target = new Date(date).getTime();
     if (isNaN(target)) { setTimeLeft("Soon"); return; }
     const interval = setInterval(() => {
       const now = new Date().getTime();
       const diff = target - now;
       if (diff <= 0) { setTimeLeft("Aired"); clearInterval(interval); } 
       else {
         const d = Math.floor(diff / (1000 * 60 * 60 * 24));
         const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
         setTimeLeft(`${d}d ${h}h ${m}m`);
       }
     }, 60000);
     return () => clearInterval(interval);
   }, [date]);
   if (!date) return (<div className="flex items-center gap-2 text-[9px] font-bold bg-white/5 text-green-400 px-3 h-8 rounded-full border border-green-900/20 justify-center min-w-fit shadow-primary-900/5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/><span>ONGOING</span></div>);
   return (<div className="flex items-center gap-2 text-[9px] font-bold bg-white/5 text-zinc-300 px-3 h-8 rounded-full border border-white/5 justify-center min-w-fit shadow-primary-900/5"><Timer size={11} className="text-primary-500"/><span>{timeLeft}</span></div>);
};

const DownloadDialog = ({ downloads }: { downloads: any[] }) => {
    if (!downloads || downloads.length === 0) return null;
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex-none shrink-0 flex items-center gap-2 px-4 h-7 lg:h-8 rounded-full border border-white/10 bg-white/5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-90 group shadow-lg shadow-black/40 whitespace-nowrap text-zinc-400 hover:text-white hover:bg-green-600/10 hover:border-green-500/50">
                    <Download size={12} className="group-hover:text-green-500 transition-colors" />
                    <span>DOWNLOAD</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-primary-500/20 max-w-md">
                <DialogTitle className="text-white font-[Cinzel] tracking-widest uppercase text-center mb-4">Secure Extract</DialogTitle>
                <div className="flex flex-col gap-2">
                    {downloads.map((dl, i) => (
                        <a key={i} href={dl.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary-500/30 transition-all group">
                            <span className="text-xs font-bold text-zinc-300 group-hover:text-white">{dl.host || "Direct"}</span>
                            <Badge variant="outline" className="text-[10px] border-primary-500/40 text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">{dl.resolution || "HD"}</Badge>
                        </a>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}

const MarqueeTitle = ({ text }: { text: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    useEffect(() => { if (containerRef.current && textRef.current) setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth); }, [text]);
    return (
        <div className="flex items-center bg-white/5 rounded-full px-5 h-8 lg:h-9 border border-white/5 w-full flex-1 min-w-0 overflow-hidden relative transition-all hover:border-primary-500/20 group shadow-inner shadow-black/40">
            <span className="text-[10px] text-primary-500 font-black uppercase mr-3 flex-shrink-0 group-hover:animate-pulse">NOW:</span>
            {/* Expanded width to 32 (8rem) to fit text better */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center mask-image-gradient w-32 lg:w-40">
                <div className={cn("whitespace-nowrap inline-block", isOverflowing && "animate-marquee-pingpong")}>
                    <span ref={textRef} className="text-[11px] font-black uppercase tracking-tighter text-zinc-300 block px-2">
                        {text}
                    </span>
                </div>
                <style jsx>{` @keyframes pingpong { 0% { transform: translateX(0); } 15% { transform: translateX(0); } 50% { transform: translateX(calc(-100% + 100%)); } 65% { transform: translateX(calc(-100% + 100%)); } 100% { transform: translateX(0); } } .animate-marquee-pingpong { min-width: 100%; animation: pingpong 12s ease-in-out infinite; } `}</style>
            </div>
        </div>
    );
};

const PingPongScroll = memo(({ text, className }: { text: string, className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    useEffect(() => { if (containerRef.current && textRef.current) setShouldAnimate(textRef.current.scrollWidth > containerRef.current.clientWidth); }, [text]);
    return (
        <div ref={containerRef} className="w-full overflow-hidden relative group/pp">
            <span ref={textRef} className={cn("whitespace-nowrap inline-block will-change-transform", className, shouldAnimate && "animate-pingpong-scroll")}>{text}</span>
            <style jsx>{` @keyframes pingpong-scroll { 0% { transform: translateX(0); } 50% { transform: translateX(calc(-100% + 100%)); } 100% { transform: translateX(0); } } .animate-pingpong-scroll { display: inline-block; min-width: 100%; animation: pingpong-scroll 10s linear infinite; } `}</style>
        </div>
    );
});
PingPongScroll.displayName = "PingPongScroll";

const EpisodeButton = memo(({ ep, isCurrent, isFullyPlayed, percent, viewMode, onClick, id }: any) => {
    return (
        <motion.button 
            id={id} 
            layout 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8 }} 
            transition={{ type: "spring", stiffness: 400, damping: 25 }} 
            onClick={() => onClick(ep.id)} 
            className={cn("relative overflow-hidden group border transition-all duration-300 transform-gpu", viewMode === 'grid' ? "h-9 w-full rounded-full flex items-center justify-center text-[11px] font-black shadow-lg" : viewMode === 'compact' ? "aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" : "w-full mx-auto h-9 rounded-full flex items-center px-4 text-[11px] font-bold text-left", isCurrent ? "bg-primary-600/90 backdrop-blur-md border-primary-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] z-20 scale-105" : isFullyPlayed ? "bg-[#000] border border-primary-900/30 text-white shadow-[inset_0_0_15px_rgba(220,38,38,0.5)] drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white")} 
            style={!isCurrent && !isFullyPlayed && percent > 0 ? { background: `linear-gradient(to right, rgba(220, 38, 38, 0.4) ${percent}%, transparent ${percent}%)`, } : {}}
        >
            {!isCurrent && !isFullyPlayed && percent > 0 && <div className="absolute inset-0 bg-primary-600/10 animate-liquid pointer-events-none" />}
            <span className={cn("truncate relative z-10 w-full", viewMode === 'list' ? "text-left" : "text-center")}>{viewMode === 'list' ? `${ep.number}. ${ep.title}` : ep.number}</span>
        </motion.button>
    );
});
EpisodeButton.displayName = "EpisodeButton";

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
                        const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('user_id', user.id).eq('anime_id', animeId).single();
                        return data;
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
            await (supabase!.from('anime_ratings') as any).upsert({ user_id: user.id, anime_id: animeId, rating: score }, { onConflict: 'user_id, anime_id' });
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
      // Using V3 from api for characters
      retryOperation(() => AnimeAPI_V3.getCharacterDetails(characterId))
        .then((res: any) => {
            const item = res?.results?.data?.[0] || res?.data?.[0] || res;
            setData(item);
            setLoading(false);
        })
        .catch(() => setLoading(false));
  }, [isOpen, characterId]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-4xl w-[90vw] h-[65vh] md:h-[550px] p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-[30px] z-[60] [&>button]:hidden">
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

                {loading ? <div className="w-full h-full flex items-center justify-center"><FantasyLoader text="ANALYZING..." /></div> : data ? (
                <>
                    <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
                        <img src={data.profile || data.image || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} loading="lazy" decoding="async"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                        <div className="absolute bottom-6 left-6 z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                            <p className="text-primary-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{data.japaneseName}</p>
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
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Mic size={12} className="text-primary-500"/> Voice Artists</h3>
                                    {data.voiceActors && data.voiceActors.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {data.voiceActors.map((va: any, i: number) => (
                                                    <button key={i} onClick={() => va.id && onActorClick(va.id)} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary-500/30 transition-all group/va text-left active:scale-95">
                                                        <img src={va.profile || va.image || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md group-hover/va:border-primary-500/50" alt={va.name} loading="lazy" decoding="async"/>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-zinc-200 group-hover/va:text-white truncate">{va.name}</span>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{va.language}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-start h-full pt-[30%] opacity-40">
                                            <img src="/images/non-non.png" className="w-24 h-24 rounded-full grayscale mb-4 border border-white/10" />
                                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">No Bloodlines Found</span>
                                        </div>
                                    )}
                                </div>

                                {data.animeography && data.animeography.length > 0 && (
                                    <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12} className="text-yellow-500"/> Appearances</h3>
                                            <div className="flex flex-col gap-3">
                                                {data.animeography.map((anime:any, i:number) => (
                                                    <Link key={i} href={`/hindi-watch/${anime.id}`} className="flex items-center gap-4 p-2 pr-4 rounded-xl bg-black/40 border border-white/5 hover:border-primary-500/50 hover:bg-white/5 transition-all active:scale-95 group/ani">
                                                        <img src={anime.poster || '/images/no-poster.png'} className="w-10 h-14 rounded-lg object-cover shadow-sm" loading="lazy" decoding="async"/>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-zinc-300 group-hover/ani:text-white truncate">{anime.title}</span>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover/ani:text-primary-400 transition-colors">{anime.role || 'Character'}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </> ) : <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold">DATA CORRUPTED</div>}
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
      // Using V3 from api for voice actors
      retryOperation(() => AnimeAPI_V3.getVoiceActorDetails(actorId))
        .then((res: any) => {
            const item = res?.results?.data?.[0] || res?.data?.[0] || res;
            setData(item);
            setLoading(false);
        })
        .catch(() => setLoading(false));
  }, [isOpen, actorId]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-4xl w-[95vw] h-[65vh] md:h-[550px] p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-[30px] z-[60] [&>button]:hidden">
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

                {loading ? <div className="w-full h-full flex items-center justify-center"><FantasyLoader text="IDENTIFYING..." /></div> : data ? (
                <>
                    <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
                        <img src={data.profile || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} loading="lazy" decoding="async"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                        <div className="absolute bottom-6 left-6 z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                            <p className="text-primary-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{data.japaneseName}</p>
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
                                                                <span className="text-[9px] font-bold text-primary-500 uppercase tracking-wider group-hover/ani:underline truncate">Watch Now</span>
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
                </> ) : <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold">DATA CORRUPTED</div>}
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
  const searchParams = useSearchParams();
  const params = useParams();
  const animeId = params.id as string;
  const urlEpId = searchParams.get('ep'); // Can be ID or Number

  const { user } = useAuth();
  const { settings, updateSetting, isSettingsLoaded } = useWatchSettings();

  // --- POPUP STATE ---
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
  const [anime, setAnime] = useState<any | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingChars, setIsLoadingChars] = useState(false);
  const [charPage, setCharPage] = useState(1);
  const [totalCharPages, setTotalCharPages] = useState(1);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [charactersList, setCharactersList] = useState<any[]>([]);
  const [nextEpDate, setNextEpDate] = useState<string | null>(null);
   
  // Streaming State
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [availableServers, setAvailableServers] = useState<any[]>([]);

  const [hideInterface, setHideInterface] = useState(false);
  const interfaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [epViewMode, setEpViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [epProgress, setEpProgress] = useState<{[key: number]: number}>({});
   
  const playerRef = useRef<HindiPlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBuffer = useRef<{[key: string]: any}>({});

  const seasonsRef = useDraggable();
  const relatedRef = useDraggable();
  const chunksRef = useDraggable();
  const recommendationsRef = useDraggable();

  // Defined here so it is available in render
  const chunkSize = epViewMode === 'compact' ? 100 : 50;

  // --- HANDLERS ---
  const handleServerChange = useCallback((srvName: string, url: string) => { updateSetting('server', srvName); setStreamUrl(url); }, [updateSetting]);

  // PROGRESS LOGIC: "Trick" saving by setting random progress but completed=true
  const saveProgress = useCallback(async (episodeId: string | null = currentEpId) => {
      if (!episodeId || !anime) return;
      const ep = anime.episodes.find((e:any) => e.id === episodeId);
      if (!ep) return;
      
      // INSTANTLY MARK COMPLETE IN STATE
      setEpProgress(prev => ({ ...prev, [ep.number]: 100 })); 

      if (user) {
          // Generate "Fake" progress data (random duration between 1400 and 2000s)
          const fakeDuration = Math.floor(Math.random() * (2000 - 1400 + 1) + 1400);
          
          // STRICTLY MATCH DB SCHEMA
          const entry = { 
            user_id: user.id, 
            anime_id: animeId, 
            episode_id: episodeId, 
            episode_number: Number(ep.number), 
            progress: fakeDuration, 
            last_updated: new Date().toISOString(), 
            last_server: settings.server, 
            episode_image: anime.poster, 
            total_episodes: Number(anime.episodes.length), 
            type: 'TV', 
            is_completed: true // FORCE TRUE
            // removed duration as it was causing error
          };
          
          try { 
              // FORCE UPSERT IMMEDIATELY
              const { error } = await (supabase!.from('user_continue_watching') as any).upsert([entry], { onConflict: 'user_id, episode_id' }); 
              
              if (error) console.error("Supabase Save Error:", error);
              else console.log("Progress Saved Successfully:", entry);

          } catch(e) { console.error("Trick Save Exception:", e); } 
      }
  }, [anime, currentEpId, user, animeId, settings.server]);

  // EPISODE CLICK - Logic restored to handle Numbers or IDs
  const handleEpisodeClick = useCallback((id: string) => {
      setCurrentEpId(id);
      setStreamUrl(null);
      
      // Determine if we should push ID or Number to URL
      const ep = anime?.episodes.find((e: any) => e.id === id);
      const valToPush = ep ? ep.number : id;
      
      window.history.pushState({}, '', `/hindi-watch/${animeId}?ep=${valToPush}`);
      
      // Trigger "Trick" Save immediately on click
      saveProgress(id);

      // Auto Scroll List
      setTimeout(() => {
          const el = document.getElementById(`ep-btn-${id}`);
          if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);

  }, [animeId, saveProgress, anime]);

  const resetInterfaceTimer = useCallback(() => {
      if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current);
      interfaceTimeoutRef.current = setTimeout(() => setHideInterface(true), 15000);
  }, []);

  const handlePlayerClick = useCallback(() => {
      if (playerContainerRef.current) playerContainerRef.current.focus();
      if (hideInterface) { setHideInterface(false); resetInterfaceTimer(); } else { setHideInterface(true); }
  }, [hideInterface, resetInterfaceTimer]);

  // --- INITIAL LOAD & SMART CHARACTERS ---
  useEffect(() => {
    const init = async () => {
        setIsLoadingInfo(true);
        try {
            // 1. Fetch Details from HPI
            const data: any = await retryOperation(() => hpi.bridge.getSmartDetails(animeId));
            if (!data) throw new Error("Anime not found");

            // 3. Normalize Data
            const universalData = {
                id: data.id,
                title: data.title,
                jname: data.nativeTitle,
                poster: data.image || data.banner || '/images/no-poster.png',
                description: data.synopsis,
                stats: {
                    rating: data.rating || 'R',
                    quality: 'HD',
                    duration: data.duration, // Raw duration string
                    views: data.views || '?',
                    likes: data.likes || '?'
                },
                info: { 
                    status: data.status, 
                    genres: data.genres || [], 
                    tags: data.tags || [], 
                    studios: data.studios || [], 
                    producers: data.producers || [], 
                    aired: data.aired ? data.aired.replace(':', '').trim() : '?', 
                    premiered: data.premiered ? data.premiered.replace(':', '').trim() : '?' 
                },
                episodes: (data.episodes || []).map((e:any) => ({ 
                    id: e.id, 
                    number: parseFloat(e.number) || 0, 
                    title: e.title || `Episode ${e.number}`, 
                    image: e.image || data.image 
                })).sort((a:any, b:any) => a.number - b.number),
                recommendations: data.recommendations || [],
                seasons: data.seasons || [], 
                downloads: data.downloads || []
            };
            
            setAnime(universalData);
            
            // --- SYNC HISTORY: AUTO-MARK COMPLETED ---
            const syncHistory = async () => {
              if (user && supabase) {
                const { data: dbData } = await (supabase.from('user_continue_watching') as any)
                  .select('episode_number, is_completed')
                  .eq('user_id', user.id)
                  .eq('anime_id', animeId);
                
                if (dbData) {
                  const progressMap: any = {};
                  dbData.forEach((row: any) => {
                    if (row.is_completed) progressMap[row.episode_number] = 100;
                  });
                  setEpProgress(prev => ({ ...prev, ...progressMap }));
                }
              }
            };
            syncHistory();

            setIsLoadingInfo(false); // Stop main loading

            // 2. BACKGROUND: Smart Character Fetch
            const loadCharacters = async () => {
                setIsLoadingChars(true);
                let searchId = data.satoruId;
                
                // If no Satoru ID, try to find one by Title
                if (!searchId) {
                    try {
                        const searchRes: any = await retryOperation(() => AnimeAPI_V3.search(data.title));
                        if (searchRes?.results?.[0]?.id) searchId = searchRes.results[0].id;
                    } catch(e) {}
                }

                // If found, fetch characters
                if (searchId) {
                    try {
                        const charData: any = await retryOperation(() => AnimeAPI_V3.getAnimeCharacters(searchId));
                        if (charData?.results?.data) {
                            const chars = charData.results.data.map((c: any) => ({ 
                                id: c.character?.id, 
                                name: c.character?.name, 
                                poster: c.character?.poster?.jpg?.image_url || c.character?.images?.jpg?.image_url, 
                                role: c.role 
                            }));
                            setCharactersList(chars);
                        }
                    } catch(e) { console.log("Background char fetch failed", e); }
                }
                setIsLoadingChars(false);
            };
            loadCharacters();

            // LOGIC: URL Parameter Selection (Corrected)
            if (urlEpId && universalData.episodes.length > 0) {
                const isNumber = !isNaN(Number(urlEpId));
                if (isNumber) {
                     const found = universalData.episodes.find((e:any) => e.number === Number(urlEpId));
                     const targetId = found ? found.id : universalData.episodes[0].id;
                     setCurrentEpId(targetId);
                     
                     // Auto-switch chunk
                     const idx = universalData.episodes.findIndex((e:any) => e.id === targetId);
                     if (idx !== -1) setEpChunkIndex(Math.floor(idx / (epViewMode === 'compact' ? 100 : 50)));

                } else {
                     // Assume it's an ID string
                     const found = universalData.episodes.find((e:any) => e.id === urlEpId);
                     const targetId = found ? found.id : universalData.episodes[0].id;
                     setCurrentEpId(targetId);

                     const idx = universalData.episodes.findIndex((e:any) => e.id === targetId);
                     if (idx !== -1) setEpChunkIndex(Math.floor(idx / (epViewMode === 'compact' ? 100 : 50)));
                }
            } else if (universalData.episodes.length > 0) {
                setCurrentEpId(universalData.episodes[0].id);
            }

        } catch(e) { console.error(e); } 
    };
    init();
  }, [animeId, user]);

  // --- STREAM LOADING ---
  useEffect(() => {
    if (!currentEpId || !isSettingsLoaded) return;
    const loadStream = async () => {
        setStreamUrl(null); setIsStreamLoading(true); setStreamError(null);
        try {
            const streamData: DesiDubStream = await hpi.desidub.getStream(currentEpId);
            if (!streamData) throw new Error("No Stream Found");
            if (streamData.nextEpDate) setNextEpDate(streamData.nextEpDate);

            // INSTANT PROGRESS MARK ON LOAD (TRICK SAVE)
            saveProgress(currentEpId);

            const rawServers = streamData.servers || [];
            const vmoly = rawServers.find(s => s.name.toLowerCase().includes('vmoly'));
            const mirror = rawServers.find(s => s.name.toLowerCase().includes('mirror') || s.name.toLowerCase().includes('streamtape'));
            const others = rawServers.filter(s => !s.name.toLowerCase().includes('vmoly') && !s.name.toLowerCase().includes('mirror') && !s.name.toLowerCase().includes('streamtape'));

            const organizedServers = [];
            if (vmoly) organizedServers.push({ ...vmoly, label: "Portal 1" });
            if (mirror) organizedServers.push({ ...mirror, label: "Portal 2 (Ads)" });
            others.forEach((s) => { organizedServers.push({ ...s, label: `Portal ${organizedServers.length + 1} (Ads)` }); });

            if (organizedServers.length === 0 && streamData.iframe) organizedServers.push({ name: 'Default', url: streamData.iframe, label: 'Portal 1' });
            setAvailableServers(organizedServers);

            if (organizedServers.length > 0) {
                const preferred = organizedServers.find(s => s.label === settings.server);
                if (preferred) setStreamUrl(preferred.url);
                else {
                    const fallback = organizedServers[0];
                    updateSetting('server', fallback.label);
                    setStreamUrl(fallback.url);
                }
            } else throw new Error("No Playable Portals");
        } catch(e) { setStreamError("Portal Unstable"); setAvailableServers([]); }
        setIsStreamLoading(false);
    };
    loadStream();
  }, [currentEpId, animeId, isSettingsLoaded]);

  // UI Visibility
  useEffect(() => {
      let ticking = false;
      const handleScroll = () => { if (!ticking) { window.requestAnimationFrame(() => { if (window.scrollY > 100) { setHideInterface(false); if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current); } else { resetInterfaceTimer(); } ticking = false; }); ticking = true; } };
      window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll);
  }, [resetInterfaceTimer]);

  const episodeChunks = useMemo(() => {
      if(!anime) return [];
      const chunks = [];
      const size = epViewMode === 'compact' ? 100 : 50;
      for(let i=0; i<anime.episodes.length; i+=size) chunks.push(anime.episodes.slice(i, i+size));
      return chunks;
  }, [anime?.episodes, chunkSize]);

  const currentEpIndex = anime?.episodes.findIndex((e:any) => e.id === currentEpId) ?? -1;
  const currentEpisode = anime?.episodes[currentEpIndex];
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < (anime?.episodes.length || 0) - 1 ? anime?.episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? anime?.episodes[currentEpIndex - 1] : null;

  if (!anime) return (<SimpleCircularLoader />);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 pt-10 relative font-sans overflow-x-hidden">
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-700 pointer-events-none will-change-[opacity]", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="w-full flex flex-col items-center bg-[#050505] relative z-40 px-4 md:px-8 mt-6">
        <div className="w-full max-w-[1350px]">
            <div ref={playerContainerRef} tabIndex={0} className="w-full aspect-video bg-black rounded-[30px] overflow-hidden border border-white/5 shadow-2xl relative shadow-primary-900/10 outline-none focus-visible:ring-0 focus-visible:outline-none ring-0" onClick={handlePlayerClick} onKeyDown={(e) => { if (e.code === 'Space') { e.preventDefault(); } }}>
                {streamUrl ? ( 
                    <HindiPlayer 
                        key={streamUrl} 
                        ref={playerRef} 
                        url={streamUrl} 
                        title={currentEpisode?.title || anime.title}
                        onInteract={() => { if(!hideInterface) { if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current); interfaceTimeoutRef.current = setTimeout(() => setHideInterface(true), 15000); } }} 
                    /> 
                ) : ( 
                    <div className="w-full h-full flex items-center justify-center border-b border-white/5">
                          {streamError ? <div className="flex flex-col items-center gap-2"><AlertCircle className="w-10 h-10 text-primary-500" /><span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{streamError}</span><Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2 text-[10px] uppercase border-primary-500/50 hover:bg-primary-500/20">Retry Connection</Button></div> : <FantasyLoader text="OPENING PORTAL..." />}
                    </div> 
                )}
            </div>

            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className={cn("w-full transition-all duration-500 will-change-transform", hideInterface ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}>
                
                {/* DESKTOP CONTROLS */}
                <div className="hidden lg:flex w-full bg-[#0a0a0a] border border-white/5 rounded-[30px] shadow-primary-900/10 shadow-lg px-5 py-2 flex-row gap-4 justify-between items-center overflow-visible mt-3 h-14">
                    <div className="flex-1 min-w-0 flex items-center gap-4 w-full sm:w-auto overflow-hidden max-w-[85%] h-9">
                        <MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} />
                        <div className="hidden sm:block"><NextEpisodeTimer date={nextEpDate} /></div>
                        <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} />
                    </div>
                    {/* Fixed Height (h-9) for desktop control bar buttons */}
                    <div className="flex items-center gap-3 overflow-visible w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide no-scrollbar scale-90 origin-right h-9">
                        <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className={cn("flex items-center gap-2 px-3 h-9 rounded-full border text-[9px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40 whitespace-nowrap", prevEpisode ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-primary-600 hover:border-primary-500 hover:text-white hover:scale-105 active:scale-90 shadow-primary-900/10" : "opacity-10 border-white/5 text-zinc-600")}><SkipBack size={11}/> PREV</button>
                        <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className="flex items-center gap-2 px-3 h-9 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-primary-900/5 whitespace-nowrap"><FastForward size={11} className={cn("transition-colors", settings.autoSkip ? "text-primary-600" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP</span></button>
                        <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className="flex items-center gap-2 px-3 h-9 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-primary-900/5 whitespace-nowrap"><Play size={11} className={cn("transition-colors", settings.autoPlay ? "text-primary-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span></button>
                        <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-9 h-9 transition-all hover:scale-110 active:rotate-12 shadow-primary-900/10 flex-shrink-0", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={14} /></Button>
                        
                        {anime.downloads && anime.downloads.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-4 h-9 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-primary-900/5 whitespace-nowrap text-zinc-500 hover:text-white hover:border-green-500/50">
                                        <Download size={11} className="group-hover:text-green-500 transition-colors" />
                                        <span>DOWNLOAD</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[70] min-w-[140px] p-2">
                                    {anime.downloads.map((dl: any, i: number) => (
                                        <DropdownMenuItem key={i} asChild className="cursor-pointer">
                                            <a href={dl.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 text-[10px] font-bold text-zinc-300 hover:text-white">
                                                <span>{dl.host || "Direct"}</span>
                                                <Badge variant="outline" className="text-[8px] h-4 px-1">{dl.resolution || "HD"}</Badge>
                                            </a>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner flex-shrink-0 h-9 items-center">
                            <button disabled className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase text-zinc-700 cursor-not-allowed">SUB</button>
                            <button className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase relative shadow-sm bg-primary-600 text-white shadow-lg">DUB<span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse shadow-[0_0_5px_red]" /></button>
                        </div>

                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 gap-2 text-[9px] font-black text-zinc-500 hover:text-white uppercase transition-all hover:scale-105 active:scale-90 shadow-md shadow-primary-900/5 whitespace-nowrap rounded-full border border-white/5 bg-white/5">
                                    <ServerIcon size={11}/>
                                    {availableServers.find(s => s.url === streamUrl)?.label || 'Portal'}
                                    <ChevronDown size={11}/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[70] min-w-[140px] p-2">
                                {availableServers.map((srv: any, idx: number) => (
                                    <DropdownMenuItem key={idx} onClick={() => handleServerChange(srv.label, srv.url)} className={cn("text-[10px] uppercase font-bold cursor-pointer", streamUrl === srv.url ? "bg-primary-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10")}>{srv.label}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {nextEpisode ? (<button onClick={() => handleEpisodeClick(nextEpisode.id)} className="flex items-center gap-2 px-3 h-9 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[9px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-primary-600 hover:border-primary-500 hover:text-white hover:scale-105 active:scale-90 shadow-md whitespace-nowrap group">NEXT <SkipForward size={11} className="group-hover:translate-x-1 transition-transform" /></button>) : (<button disabled className="flex items-center gap-2 bg-white/5 border border-white/5 text-zinc-600 rounded-full px-5 h-9 text-[9px] font-black uppercase tracking-widest cursor-not-allowed opacity-50 shadow-inner whitespace-nowrap">NEXT <SkipForward size={11} /></button>)}
                    </div>
                </div>

                {/* MOBILE CONTROLS */}
                <div className="flex lg:hidden w-full bg-[#0a0a0a] border border-white/5 rounded-[30px] shadow-primary-900/10 shadow-lg px-4 py-4 flex-col gap-3 overflow-visible relative z-[60] mt-3">
                    <div className="flex w-full justify-between items-center gap-2">
                        <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className="flex-1 bg-white/5 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:bg-white/10"><SkipBack size={14}/></button>
                        <button disabled={!nextEpisode} onClick={() => nextEpisode && handleEpisodeClick(nextEpisode.id)} className="flex-1 bg-white/5 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:bg-white/10"><SkipForward size={14}/></button>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 w-full items-center">
                        <div className="min-w-0"><MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} /></div>
                        <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} />
                    </div>
                    <div className="flex w-full justify-between items-center gap-2">
                        <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 bg-white/5")}><Lightbulb size={16} /></Button>
                        
                        {anime.downloads && anime.downloads.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex-none flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all whitespace-nowrap shrink-0">
                                        <Download size={11} /> <span>DL</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-2 shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[70]">
                                    {anime.downloads.map((dl: any, i: number) => (
                                        <DropdownMenuItem key={i} asChild><a href={dl.url} target="_blank" className="text-[10px] uppercase font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 flex justify-between"><span>{dl.host}</span><Badge className="ml-2 h-4 text-[8px]" variant="outline">DL</Badge></a></DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner flex-none items-center">
                            <button disabled className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase text-zinc-700 cursor-not-allowed">SUB</button>
                            <button className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary-600 text-white shadow-lg">DUB</button>
                        </div>
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 bg-white/5 rounded-full border border-white/5 flex-auto min-w-0"><ServerIcon size={12}/> <span className="truncate">{availableServers.find(s => s.url === streamUrl)?.label || 'Portal'}</span></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-2 shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[70]">
                                <ScrollArea className="h-auto max-h-[150px]"><div className="flex flex-col gap-1">{availableServers.map((srv: any, idx: number) => (<DropdownMenuItem key={idx} onClick={() => handleServerChange(srv.label, srv.url)} className={cn("text-[10px] uppercase font-bold", streamUrl === srv.url ? "bg-primary-600 text-white" : "text-zinc-400 hover:bg-white/10")}>{srv.label}</DropdownMenuItem>))}</div></ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </motion.div>
        </div>
      </motion.div>

      {/* PAGE CONTENT */}
      <div className="w-full flex justify-center mt-8 px-4 md:px-8"><div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-8 max-w-[1350px]">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="order-2 xl:order-1 xl:col-span-4 h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative z-20">
                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"><h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-[Cinzel] tracking-widest"><Layers size={18} className="text-primary-600"/> Episodes</h3><Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white font-black text-[10px] px-3 h-5 rounded-full shadow-lg">{anime.episodes.length}</Badge></div>
                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                        <button onClick={() => setEpViewMode('compact')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'compact' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><Grid size={14}/></button>
                        <button onClick={() => setEpViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'grid' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><LayoutGrid size={14}/></button>
                        <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'list' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><List size={14}/></button>
                    </div>
                </div>
                <div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 py-3 px-4 relative group/chunks">
                    <div ref={chunksRef} className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
                        {episodeChunks.map((_, idx) => (
                            <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full transition-all border shadow-sm uppercase tracking-wider", epChunkIndex === idx ? "bg-primary-600 text-white border-primary-500 shadow-primary-900/20" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700")}>{(idx * chunkSize) + 1}-{Math.min((idx + 1) * chunkSize, anime.episodes.length)}</button>
                        ))}
                    </div>
                </div>
                <ScrollArea className="flex-1 p-2 shadow-inner custom-scrollbar overflow-x-hidden">
                    <LayoutGroup>
                        <motion.div layout className={cn("p-2 transition-all duration-500 ease-in-out grid", epViewMode === 'grid' ? 'grid-cols-5 gap-2.5' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-2')}>
                            <AnimatePresence mode="popLayout">
                                {episodeChunks[epChunkIndex]?.map((ep: any) => {
                                    const percent = epProgress[ep.number] || 0;
                                    const isFullyPlayed = percent >= 80 || percent === 100;
                                    const isCurrent = ep.id === currentEpId;
                                    return (
                                        <EpisodeButton 
                                            key={ep.id} 
                                            id={`ep-btn-${ep.id}`} 
                                            ep={ep} 
                                            isCurrent={isCurrent} 
                                            isFullyPlayed={isFullyPlayed} 
                                            percent={percent} 
                                            viewMode={epViewMode} 
                                            onClick={handleEpisodeClick} 
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    </LayoutGroup>
                </ScrollArea>
            </motion.div>

            <div className="contents xl:contents">
                <div className="order-3 xl:order-3 xl:col-span-12 w-full" onKeyDown={(e) => e.stopPropagation()}>
                    <ShadowComments key={user?.id || 'guest'} episodeId={currentEpId || "general"} />
                </div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="order-4 xl:order-2 xl:col-span-8 h-auto xl:h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-primary-900/20">
                    <div className="flex-shrink-0 relative p-8 pt-16 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-primary-600/5 to-transparent">
                        <div className="relative shrink-0 mx-auto lg:mx-0 flex flex-col gap-6 w-full lg:w-auto items-center lg:items-start text-center lg:text-left">
                            <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] mx-auto sm:mx-0 w-fit">
                                <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#dc2626_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" />
                                <img src={anime.poster || '/images/no-poster.png'} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl shadow-black" alt={anime.title} loading="lazy" decoding="async"/>
                            </div>
                            <div className="flex lg:hidden flex-col gap-3 w-full items-center text-center">
                                <h1 className="text-2xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-2xl shadow-black scale-[0.85] origin-center">{anime.title}</h1>
                                <div className="flex flex-wrap gap-3 mt-3 justify-center items-center">
                                    <div className="flex items-center flex-wrap justify-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20 max-w-full">
                                            {formatRating(anime.stats.rating) && (<><span className="text-primary-500">{formatRating(anime.stats.rating)}</span><span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/></>)}
                                            <span className="text-zinc-500">{anime.info.status}</span>
                                            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-600 shadow-primary-900/20"/> {formatDuration(anime.stats.duration)}</div>
                                            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                            <div className="flex items-center gap-1.5 text-red-500"><ThumbsUp size={12}/> {anime.stats.likes}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-1 pt-2 text-left z-10 flex-col h-full w-full">
                            <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] leading-none mb-2 tracking-tighter drop-shadow-2xl shadow-black scale-[0.85] origin-left">{anime.title}</h1>
                            {anime.jname && <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-6 opacity-60 drop-shadow-sm">{anime.jname}</p>}
                            <div className="flex flex-wrap gap-4 mt-3 justify-start items-center">
                                <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20">
                                     {formatRating(anime.stats.rating) && (<><span className="text-primary-500">{formatRating(anime.stats.rating)}</span><span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/></>)}
                                     <span className="text-zinc-500">{anime.info.status ? anime.info.status.replace(':', '').trim() : '?'}</span>
                                     <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                     <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-600 shadow-primary-900/20"/> {formatDuration(anime.stats.duration)}</div>
                                     <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                     <div className="flex items-center gap-1.5 text-red-500"><ThumbsUp size={12}/> {anime.stats.likes}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-6 justify-start">
                                {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-primary-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-primary-900/20 shadow-primary-900/10">{g}</Link>))}
                                {anime.info.tags.map((t: string) => (<span key={t} className="text-[9px] px-4 py-1.5 bg-primary-900/20 rounded-full text-primary-400 border border-primary-500/20 font-black uppercase tracking-widest shadow-sm">{t}</span>))}
                            </div>
                            <div className="mt-auto pt-6 w-full flex justify-end"><StarRating animeId={animeId} initialRating={anime.stats.rating} /></div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative px-6 sm:px-10 mt-4 overflow-hidden flex flex-col">
                        <div className="lg:hidden flex flex-wrap gap-2 justify-center mb-6">
                             {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[8px] px-3 py-1 bg-white/5 rounded-full text-zinc-500 border border-white/5 uppercase font-bold">{g}</Link>))}
                        </div>
                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2 shadow-sm shrink-0"><Info size={12} className="shadow-sm"/> Synopsis</h4>
                        <ScrollArea className="flex-1 pr-4 custom-scrollbar shadow-inner shadow-primary-900/5">
                           <p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased font-medium opacity-90 drop-shadow-sm shadow-black" dangerouslySetInnerHTML={{ __html: anime.description || "No description available." }} />
                        </ScrollArea>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-6 mb-6">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Aired</span>
                                <span className="text-[9px] font-bold text-zinc-300 text-center">{anime.info.aired}</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Premiered</span>
                                <span className="text-[9px] font-bold text-zinc-300">{anime.info.premiered}</span>
                            </div>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Studios</span>
                                        <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.studios?.[0] || '?'} <ChevronDown size={8}/></span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.studios.map((s:string)=><DropdownMenuItem key={s} className="hover:bg-white/10 cursor-pointer rounded-lg">{s}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 mb-1">Producers</span>
                                        <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.producers?.[0] || '?'} <ChevronDown size={8}/></span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.producers.map((p:string)=><DropdownMenuItem key={p} className="hover:bg-white/10 cursor-pointer rounded-lg">{p}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </motion.div>
            </div>
      </div></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="w-full flex flex-col gap-12 mt-12 px-4 md:px-8">
        
        {/* SEASONS */}
        {anime.seasons && anime.seasons.length > 0 && (
            <div className="w-full max-w-[1350px] mx-auto order-5">
                <div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/seasons shadow-primary-900/20 shadow-md">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-primary-600/5 blur-[150px] pointer-events-none group-hover/seasons:bg-primary-600/10 transition-all duration-1000" />
                    <div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-primary-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-primary-900/10 shadow-sm">Seasons</h4></div>
                    <ScrollArea className="w-full whitespace-nowrap pb-6 custom-scrollbar">
                        <div className="flex gap-6 w-max" ref={seasonsRef} onWheel={(e:any) => e.stopPropagation()}>{anime.seasons.map((season: any) => season?.id ? (<Link key={season.id} href={`/hindi-watch/${season.id}`} className={cn("group/item flex items-center gap-5 p-2 pr-10 rounded-full border hover:border-primary-600/40 hover:bg-primary-600/10 transition-all duration-500 min-w-[280px] active:scale-95 shadow-inner shadow-primary-900/5 shadow-md", season.isCurrent ? "bg-primary-600/10 border-primary-600" : "bg-white/5 border-white/5")}><div className="relative shrink-0 overflow-hidden rounded-full w-14 h-14 border-2 border-white/5 group-hover/item:border-primary-600 shadow-md shadow-black/50"><img src={season.poster || '/images/no-poster.png'} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125" alt={season.title} loading="lazy" decoding="async"/></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[11px] font-black text-zinc-300 group-hover:text-white truncate w-[160px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{season.title}</span><span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">{season.isCurrent ? 'NOW PLAYING' : 'VIEW ARCHIVE'}</span></div></Link>) : null)}</div><ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        )}

        <div className="w-full max-w-[1350px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* RECOMMENDED SECTION (LEFT COLUMN) */}
            <div className={cn(
                "order-6 xl:order-1 col-span-1 xl:col-span-4 h-[750px] flex flex-col bg-[#0a0a0a] rounded-[50px] border border-white/5 shadow-2xl overflow-hidden relative group/paths shadow-primary-900/20 shadow-md",
                (!anime.recommendations || anime.recommendations.length === 0) ? "hidden xl:flex" : "flex"
            )}>
                <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 relative z-10 shadow-primary-900/5 shadow-md">
                    <Heart size={20} className="text-primary-600 fill-red-600 animate-pulse shadow-primary-600/30 shadow-md" />
                    <h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Recommended</h3>
                </div>
                <div className="flex-1 overflow-hidden p-6 relative z-10 shadow-inner shadow-primary-900/5">
                    {(!anime.recommendations || anime.recommendations.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                            <img src="/images/non-non.png" className="w-24 h-24 rounded-full grayscale mb-4 border border-white/10" alt="No Data" />
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">No Recommendations Found</span>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4 custom-scrollbar">
                            <div className="space-y-4" ref={recommendationsRef} onWheel={(e: any) => e.stopPropagation()}>
                                {anime.recommendations.map((rec: any, idx: number) => rec?.id ? (
                                    <Link key={`${rec.id}-${idx}`} href={`/hindi-watch/${rec.id}`} className="flex gap-5 p-4 rounded-[32px] hover:bg-primary-600/5 group transition-all duration-500 active:scale-95 border border-transparent hover:border-primary-600/20 shadow-inner shadow-primary-900/5">
                                        <img src={rec.image || rec.poster || '/images/no-poster.png'} className="w-16 h-24 object-cover rounded-2xl shadow-3xl group-hover:rotate-1 transition-all duration-500 shadow-black shadow-md shrink-0" alt={rec.title || rec.name} loading="lazy" decoding="async"/>
                                        <div className="flex-1 py-1 flex flex-col justify-center min-w-0">
                                            <h4 className="text-[12px] font-black text-zinc-500 group-hover:text-primary-500 line-clamp-2 transition-all uppercase tracking-tight leading-tight mb-2 shadow-black drop-shadow-md">{rec.title || rec.name}</h4>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-600 rounded-md group-hover:border-primary-500/50 group-hover:text-primary-500 uppercase tracking-widest shadow-sm">{rec.type || 'TV'}</Badge>
                                                <span className="w-1 h-1 bg-zinc-900 rounded-full shadow-sm shrink-0"/>
                                                <span className="text-[9px] text-zinc-800 font-black uppercase group-hover:text-primary-900 transition-colors shadow-sm whitespace-nowrap">
                                                    {rec.episode || rec.episodeCount || (typeof rec.episodes === 'object' ? (rec.episodes?.sub || rec.episodes?.dub) : rec.episodes) || '?'} EPS
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ) : null)}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>

            {/* CHARACTERS (MANIFESTED BLOODLINES) (RIGHT COLUMN) */}
            <div className={cn(
                "order-7 xl:order-2 col-span-1 xl:col-span-8 h-auto xl:h-[750px] bg-[#0a0a0a] rounded-[50px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-primary-900/20 shadow-md",
                charactersList.length === 0 ? "hidden xl:flex" : "flex" 
             )}>
                <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between shadow-primary-900/5 shadow-md">
                    <div className="flex items-center gap-4">
                    <User size={20} className="text-primary-600 shadow-primary-600/30" />
                    <h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase">
                        Manifested Bloodlines
                    </h3>
                    </div>
                </div>
                <div className="flex-1 p-6 md:p-10 overflow-hidden relative">
                     {isLoadingChars && charactersList.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><FantasyLoader text="SUMMONING..." /></div>
                     ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full xl:overflow-y-auto custom-scrollbar pb-4">
                            {charactersList.length > 0 ? charactersList.map((char: any, i: number) => (
                                <div key={i} className={cn("flex bg-white/5 border rounded-[30px] p-4 transition-all duration-500 group shadow-lg cursor-default", char.role === 'Main' ? "border-primary-500/30 shadow-[0_0_20px_rgba(20, 20, 20, 0.4)] bg-primary-600/5" : "border-white/5 hover:border-white/10 hover:shadow-primary-900/10")}>
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => openCharacter(char.id)}>
                                    <img src={char.poster || '/images/non-non.png'} className={cn("w-14 h-14 rounded-full object-cover border transition-colors shadow-lg", char.role === 'Main' ? "border-primary-500 shadow-primary-900/60" : "border-white/10 group-hover:border-primary-500/50")} loading="lazy" decoding="async" />
                                    <div className="flex flex-col">
                                    <span className={cn("text-[11px] font-black uppercase tracking-tighter line-clamp-1", char.role === 'Main' ? "text-primary-400 text-shadow-sm" : "text-zinc-200")}>{char.name}</span>
                                    <Badge variant="outline" className={cn("w-fit mt-1 text-[8px] font-bold px-2 py-0 h-4 rounded-full transition-colors", char.role === 'Main' ? "border-primary-600 text-primary-500 bg-primary-600/10" : "border-zinc-800 text-zinc-500 group-hover:text-primary-500 group-hover:border-primary-500/30")}>{char.role}</Badge>
                                    </div>
                                </div>
                                </div>
                            )) : (
                                <div className="col-span-full flex flex-col items-center justify-center h-full pt-[10%] opacity-40">
                                    <img src="/images/non-non.png" className="w-24 h-24 rounded-full grayscale mb-4 border border-white/10" />
                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">No Bloodlines Found</span>
                                </div>
                            )}
                         </div>
                     )}
                </div>
            </div>

        </div>

      </motion.div>
      <CharacterDetailsDialog
        isOpen={activePopup?.type === 'character'}
        onClose={closeAll}
        onBack={popupIndex > 0 ? goBack : undefined}
        onForward={popupIndex < popupHistory.length - 1 ? goForward : undefined}
        canGoBack={popupIndex > 0}
        canGoForward={popupIndex < popupHistory.length - 1}
        characterId={activePopup?.type === 'character' ? activePopup.id : null}
        onActorClick={openActor}
      />
      <VoiceActorDetailsDialog
        isOpen={activePopup?.type === 'actor'}
        onClose={closeAll}
        onBack={popupIndex > 0 ? goBack : undefined}
        onForward={popupIndex < popupHistory.length - 1 ? goForward : undefined}
        canGoBack={popupIndex > 0}
        canGoForward={popupIndex < popupHistory.length - 1}
        actorId={activePopup?.type === 'actor' ? activePopup.id : null}
        onCharacterClick={openCharacter}
      />
      <Footer />
    </div>
  );
}

export default function WatchPage() { return <Suspense fallback={<SimpleCircularLoader />}><WatchContent /></Suspense>; }