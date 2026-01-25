"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef, useCallback } from 'react';
// Corrected Imports: Link belongs in next/link, hooks belong in next/navigation
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import Link from 'next/link'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Clock, AlertCircle, Tv, Play, 
  Grid, List, Timer, Lightbulb, LayoutGrid,
  ChevronDown, Heart, CheckCircle, XCircle,
  FastForward, Star, Info, MessageSquare, User,
  Loader2, Globe, Flame, Calendar, Copyright, Check, Mic, X,
  ChevronLeft, ChevronRight, Pause, ArrowLeft, ArrowRight
} from 'lucide-react';

import { AnimeService, AnimeAPI_V2, AnimeAPI_V3, supabase, UniversalAnime } from '@/lib/api'; 
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; 

import AnimePlayer, { AnimePlayerRef } from '@/components/Player/AnimePlayer'; 
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
    autoPlay: true, autoNext: true, autoSkip: false, dimMode: false, 
    server: 'hd-1', category: 'sub' as 'sub' | 'dub' | 'raw', volume: 1
  });

  useEffect(() => { 
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('shadow_watch_settings'); 
          if (saved) {
             setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); 
          }
          setIsLoaded(true);
      }
  }, []);

  const updateSetting = async (key: string, value: any) => { 
      setSettings(prev => { 
          const newSettings = { ...prev, [key]: value }; 
          localStorage.setItem('shadow_watch_settings', JSON.stringify(newSettings)); 
          return newSettings; 
      }); 
  };
  return { settings, updateSetting, isSettingsLoaded: isLoaded };
};

// --- 2. HELPERS ---

interface V2EpisodeSchedule { airingISOTimestamp: string | null; airingTimestamp: number | null; secondsUntilAiring: number | null; }
interface EpisodeProgress { [key: number]: number; }

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(res => setTimeout(res, delay));
        return retryOperation(operation, retries - 1, delay * 2);
    }
}

const formatRating = (rating?: string) => {
    if (!rating) return null;
    const r = rating.toString().toUpperCase();
    if (r.includes('R') || r.includes('RX') || r.includes('18+') || r.includes('17+')) return '18+';
    return rating;
};

// --- 3. SUB-COMPONENTS ---

const FantasyLoader = ({ text = "SUMMONING..." }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#050505]">
    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-red-500/20" />
    <h2 className="text-xl font-[Cinzel] text-red-500 animate-pulse tracking-[0.3em]">{text}</h2>
  </div>
);

const NextEpisodeTimer = ({ schedule, status }: { schedule: any, status: string }) => { 
    const [displayText, setDisplayText] = useState<React.ReactNode>("..."); 
    useEffect(() => { 
        if (status?.toLowerCase().includes("finished")) { setDisplayText(<span className="text-[9px] text-red-500 font-black">ENDED</span>); return; } 
        if (!schedule?.airingISOTimestamp) { setDisplayText(<span className="text-[9px] text-red-500 font-black">UNKNOWN</span>); return; } 
        const updateTimer = () => { 
            const now = new Date().getTime(); 
            const target = new Date(schedule.airingISOTimestamp!).getTime(); 
            const diff = target - now; 
            if (diff <= 0) { setDisplayText("Aired"); return; } 
            const hours = Math.floor((diff % 86400000) / 3600000); 
            const minutes = Math.floor((diff % 3600000) / 60000); 
            const days = Math.floor(diff / 86400000); 
            setDisplayText(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`); 
        }; 
        updateTimer(); const interval = setInterval(updateTimer, 30000); return () => clearInterval(interval); 
    }, [schedule, status]); 
    return (<div className="flex items-center gap-2 text-[9px] font-bold bg-white/5 text-zinc-300 px-3 h-7 rounded-full border border-white/5 justify-center min-w-fit max-w-full shadow-red-900/5"><Timer className="w-2.5 h-2.5 text-red-500 shrink-0" /><span className="truncate whitespace-nowrap">{displayText}</span></div>); 
};

const TrailerSection = ({ videos }: { videos: any[] }) => { 
    const [activeVideo, setActiveVideo] = useState(videos?.[0]?.source); if (!videos || videos.length === 0) return null; const getYoutubeId = (url: string) => url?.split('v=')[1]?.split('&')[0] || url?.split('/').pop(); 
    return (<Dialog><DialogTrigger asChild><div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-500/20 rounded-full px-6 py-2 cursor-pointer hover:bg-red-600 hover:border-red-500 transition-all group active:scale-95 shadow-lg shadow-red-900/10 w-full md:w-auto justify-center"><span className="flex items-center justify-center w-4 h-4 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform"><Play size={8} fill="currentColor" /></span><span className="text-[9px] font-black text-red-100 group-hover:text-white uppercase tracking-wider">Trailers ({videos.length})</span></div></DialogTrigger><DialogContent className="bg-black/95 border-red-500/40 max-w-4xl w-[90vw] lg:max-w-2xl max-h-[70vh] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300 flex flex-col"><DialogTitle className="sr-only">Trailers</DialogTitle><div className="flex-1 flex flex-col min-h-0"><div className="aspect-video w-full bg-zinc-900 shrink-0"><iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /></div><div className="p-4 md:p-6 bg-[#0a0a0a] flex-1 overflow-hidden flex flex-col"><ScrollArea className="w-full whitespace-nowrap pb-4 h-full"><div className="flex gap-4 px-2">{videos.map((v: any, i: number) => (v && v.source ? <button key={i} onClick={() => setActiveVideo(v.source)} className={cn("flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-28 md:w-36 hover:scale-105 active:scale-95 group/pv", activeVideo === v.source ? "bg-red-600/10 border-red-600" : "bg-white/5 border-transparent hover:border-white/10")}><div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative shadow-lg"><img src={v.thumbnail || '/images/no-thumb.png'} className="w-full h-full object-cover opacity-60" alt="" /><div className="absolute inset-0 flex items-center justify-center bg-red-600/20 opacity-0 group-hover/pv:opacity-100 transition-opacity"><Play size={16} fill="white" className="text-white" /></div></div><span className="text-[9px] font-black text-center truncate w-full uppercase text-zinc-400 group-hover/pv:text-white">{v.title || `Promo ${i+1}`}</span></button> : null))}</div><ScrollBar orientation="horizontal" className="h-1 bg-white/5" /></ScrollArea></div></div></DialogContent></Dialog>); 
};

// --- IMPROVED PING PONG SCROLL (Pause -> Scroll -> Pause -> Return) ---
const PingPongScroll = ({ text, className }: { text: string, className?: string }) => {
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
                    "whitespace-nowrap inline-block", 
                    className,
                    shouldAnimate && "animate-pingpong-scroll"
                )}
            >
                {text}
            </span>
            <style jsx>{`
                @keyframes pingpong-scroll {
                    0% { transform: translateX(0); }
                    15% { transform: translateX(0); } /* Pause Start */
                    50% { transform: translateX(calc(-100% + 100%)); } /* Scroll to End */
                    65% { transform: translateX(calc(-100% + 100%)); } /* Pause End */
                    100% { transform: translateX(0); } /* Return */
                }
                .animate-pingpong-scroll {
                    display: inline-block;
                    min-width: 100%;
                    animation: pingpong-scroll 10s linear infinite;
                }
            `}</style>
        </div>
    );
};

// MARQUEE TITLE
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
        <div className="flex items-center bg-white/5 rounded-full px-4 h-7 border border-white/5 w-full flex-1 min-w-0 overflow-hidden relative transition-all hover:border-red-500/20 active:scale-95 group shadow-inner shadow-red-900/5">
            <span className="text-[10px] text-red-500 font-black uppercase mr-2 flex-shrink-0 group-hover:animate-pulse">NOW:</span>
            <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center mask-image-gradient">
                <div className={cn("whitespace-nowrap inline-block", isOverflowing && "animate-marquee-pingpong")}>
                    <span ref={textRef} className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 block px-2">
                        {text}
                    </span>
                </div>
                <style jsx>{` 
                    @keyframes pingpong { 
                        0% { transform: translateX(0); }
                        45% { transform: translateX(calc(-100% + 100%)); } 
                        55% { transform: translateX(calc(-100% + 100%)); }
                        100% { transform: translateX(0); }
                    } 
                    .animate-marquee-pingpong { 
                        min-width: 100%;
                        animation: pingpong 12s linear infinite; 
                    } 
                `}</style>
            </div>
        </div>
    ); 
};

// --- STAR RATING ---
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
                            <Star size={14} className={cn("transition-all duration-300", star <= (hover || userRating) ? "fill-red-600 text-red-600 shadow-red-500/50" : "text-zinc-700")} />
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

// --- UPDATED CHARACTER DETAILS DIALOG ---
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
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-900/10 via-transparent to-red-900/5 pointer-events-none" /> 
                
                {/* NAVIGATION BUTTONS */}
                <div className="absolute top-1 right-1 z-[100] flex gap-2 pointer-events-auto">
                    {onBack && canGoBack && (
                      <button onClick={onBack} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowLeft size={14} className="group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                    {onForward && canGoForward && (
                      <button onClick={onForward} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowRight size={14} className="group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all active:scale-90 shadow-lg">
                      <X size={14} />
                    </button> 
                </div>

                {loading ? <div className="w-full h-full flex items-center justify-center"><FantasyLoader text="ANALYZING..." /></div> : data ? ( 
                <> 
                    <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5"> 
                        <img src={data.profile || data.image || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} /> 
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" /> 
                        <div className="absolute bottom-6 left-6 z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                            <p className="text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{data.japaneseName}</p>
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
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Mic size={12} className="text-red-500"/> Voice Artists</h3>
                                    {data.voiceActors && data.voiceActors.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {data.voiceActors.map((va: any, i: number) => (
                                                <button key={i} onClick={() => va.id && onActorClick(va.id)} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-red-500/30 transition-all group/va text-left active:scale-95">
                                                    <img src={va.profile || va.image || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md group-hover/va:border-red-500/50" alt={va.name} />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-zinc-200 group-hover/va:text-white truncate">{va.name}</span>
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{va.language}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 opacity-40">
                                            <img src="/images/non-non.png" className="w-12 h-12 rounded-full grayscale mb-2 border border-white/10" />
                                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">No Bloodlines Found</span>
                                        </div>
                                    )}
                                </div>

                                {data.animeography && data.animeography.length > 0 && ( 
                                    <div>
                                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12} className="text-yellow-500"/> Appearances</h3> 
                                            <div className="flex flex-col gap-3">
                                                {data.animeography.map((anime:any, i:number) => ( 
                                                    <Link key={i} href={`/watch/${anime.id}`} className="flex items-center gap-4 p-2 pr-4 rounded-xl bg-black/40 border border-white/5 hover:border-red-500/50 hover:bg-white/5 transition-all active:scale-95 group/ani"> 
                                                        <img src={anime.poster || '/images/no-poster.png'} className="w-10 h-14 rounded-lg object-cover shadow-sm" /> 
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-zinc-300 group-hover/ani:text-white truncate">{anime.title}</span>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover/ani:text-red-400 transition-colors">{anime.role || 'Character'}</span>
                                                        </div> 
                                                    </Link> 
                                                ))}
                                            </div> 
                                    </div> 
                                )} 
                            </div> 
                        </ScrollArea> 
                    </div> 
                </> ) : <div className="w-full h-full flex items-center justify-center text-red-500 font-bold">DATA CORRUPTED</div>} 
            </div> 
        </DialogContent> 
    </Dialog> 
  );
};

// --- UPDATED VOICE ACTOR DETAILS DIALOG ---
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
                {/* RED THEME GRADIENT */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/10 via-transparent to-red-600/5 pointer-events-none" /> 
                
                {/* NAVIGATION BUTTONS */}
                <div className="absolute top-1 right-1 z-[100] flex gap-2 pointer-events-auto">
                    {onBack && canGoBack && (
                      <button onClick={onBack} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowLeft size={14} className="group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                    {onForward && canGoForward && (
                      <button onClick={onForward} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg group">
                        <ArrowRight size={14} className="group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all active:scale-90 shadow-lg">
                      <X size={14} />
                    </button> 
                </div>

                {loading ? <div className="w-full h-full flex items-center justify-center"><FantasyLoader text="IDENTIFYING..." /></div> : data ? ( 
                <> 
                    <div className="w-full md:w-[35%] h-[40%] md:h-full relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5"> 
                        <img src={data.profile || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} /> 
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" /> 
                        <div className="absolute bottom-6 left-6 z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-lg">{data.name}</h2>
                            <p className="text-red-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{data.japaneseName}</p>
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
                                                            <img src={role.anime.poster || '/images/no-poster.png'} className="w-8 h-12 rounded-md object-cover shadow-sm shrink-0" /> 
                                                            <div className="flex flex-col min-w-0 overflow-hidden">
                                                                <PingPongScroll text={role.anime.title} className="text-[10px] font-bold text-zinc-300 group-hover/ani:text-white" />
                                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider group-hover/ani:underline truncate">Watch Now</span>
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
                                                                className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover/char:border-red-500 transition-colors shadow-md shrink-0" 
                                                                alt={role.character.name}
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
                </> ) : <div className="w-full h-full flex items-center justify-center text-red-500 font-bold">DATA CORRUPTED</div>} 
            </div> 
        </DialogContent> 
    </Dialog> 
  );
};



// ==========================================
//  4. MAIN COMPONENT
// ==========================================

function WatchContent() {
  const router = useRouter(); 
  const pathname = usePathname();
  const params = useParams(); 
  const searchParams = useSearchParams(); 
  const animeId = params.id as string; 
  const urlEpId = searchParams.get('ep'); 
  // ✅ FIX: Image Search Params
  const urlEpNumber = searchParams.get('episode');
  const urlTimestamp = searchParams.get('timestamp');

  const { user } = useAuth(); 
  const { settings, updateSetting, isSettingsLoaded } = useWatchSettings();

  // --- POPUP STACK MANAGEMENT ---
  const [popupHistory, setPopupHistory] = useState<{type: 'character'|'actor', id: string}[]>([]);
  const [popupIndex, setPopupIndex] = useState(-1);
  
  const activePopup = popupIndex >= 0 ? popupHistory[popupIndex] : null;

  const navigateToPopup = (type: 'character'|'actor', id: string) => {
    const newHistory = popupHistory.slice(0, popupIndex + 1);
    newHistory.push({ type, id });
    setPopupHistory(newHistory);
    setPopupIndex(newHistory.length - 1);
  };

  const openCharacter = (id: string) => navigateToPopup('character', id);
  const openActor = (id: string) => navigateToPopup('actor', id);
  
  const goBack = () => setPopupIndex(prev => Math.max(0, prev - 1));
  const goForward = () => setPopupIndex(prev => Math.min(popupHistory.length - 1, prev + 1));
  
  const closeAll = () => {
      setPopupHistory([]);
      setPopupIndex(-1);
  };

  const [anime, setAnime] = useState<UniversalAnime | null>(null); 
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  
  const [charPage, setCharPage] = useState(1);
  const [totalCharPages, setTotalCharPages] = useState(1);
  const [charactersList, setCharactersList] = useState<any[]>([]);
  const [isLoadingChars, setIsLoadingChars] = useState(false);

  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [intro, setIntro] = useState<any>(null); 
  const [outro, setOutro] = useState<any>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [servers, setServers] = useState<any>(null);
  const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
  
  const [hideInterface, setHideInterface] = useState(false);
  const interfaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [showSkipNotification, setShowSkipNotification] = useState(false);
  const isSkipToastLocked = useRef(false);

  const [epViewMode, setEpViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  
  const [epProgress, setEpProgress] = useState<EpisodeProgress>({}); 

  const [resumeTime, setResumeTime] = useState(0);
  const [isResumeLoaded, setIsResumeLoaded] = useState(false);
  const progressRef = useRef(0);
  const playerRef = useRef<AnimePlayerRef>(null);
  // ✅ Player Container Ref for Focus
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const progressBuffer = useRef<{[key: string]: any}>({});
  const isBufferDirty = useRef(false);

  const seasonsRef = useDraggable();
  const relatedRef = useDraggable();
  const recommendationsRef = useDraggable();
  const chunksRef = useDraggable();

  // --- INTERFACE HIDING LOGIC ---
  const resetInterfaceTimer = useCallback(() => {
      if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current);
      interfaceTimeoutRef.current = setTimeout(() => setHideInterface(true), 15000);
  }, []);

  useEffect(() => {
      const handleScroll = () => {
          const currentY = window.scrollY;
          if (currentY > 100) {
              setHideInterface(false);
              if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current);
          } else {
              if (currentY <= 100) resetInterfaceTimer();
          }
          setLastScrollY(currentY);
      };
      window.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
  }, [resetInterfaceTimer]);

  const handlePlayerClick = () => {
      // ✅ Focus the player container explicitly on click to enable Spacebar
      if (playerContainerRef.current) {
          playerContainerRef.current.focus();
      }

      if (hideInterface) {
          setHideInterface(false);
          resetInterfaceTimer();
      } else {
          setHideInterface(true);
          if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current);
      }
  };

  const handlePlaybackStart = () => {
      resetInterfaceTimer();
  };

  const handleSkipIntro = useCallback(() => {
      if (isSkipToastLocked.current || showSkipNotification) return; 
      
      setShowSkipNotification(true);
      isSkipToastLocked.current = true;
      setTimeout(() => {
          setShowSkipNotification(false);
          setTimeout(() => { isSkipToastLocked.current = false; }, 1000);
      }, 3000);
  }, [showSkipNotification]);

  // --- URL AUTO UPDATE LOGIC ---
  useEffect(() => {
    if (currentEpId && !isLoadingInfo) {
         const url = new URL(window.location.href);
         const currentParamEp = url.searchParams.get('ep');
         if (currentParamEp !== currentEpId) {
             url.searchParams.set('ep', currentEpId);
             window.history.replaceState({}, '', url.toString());
         }
    }
  }, [currentEpId, isLoadingInfo]);

  // 1. INITIAL LOAD
  useEffect(() => {
    const init = async () => {
        setIsLoadingInfo(true);
        try {
            const v2Data: any = await retryOperation(() => AnimeAPI_V2.getAnimeInfo(animeId));
            const universalData = await AnimeService.getAnimeInfo(animeId);
            if (!universalData) throw new Error("Anime not found");

            if (v2Data) {
                if (v2Data.relatedAnimes?.length) universalData.related = v2Data.relatedAnimes.map((r:any) => ({ 
                    id: r.id, 
                    title: r.name, 
                    poster: r.poster, 
                    type: r.type, 
                    // ✅ EPISODE OBJECT FIX
                    episodes: typeof r.episodes === 'object' 
                        ? (r.episodes.sub || r.episodes.eps || 0) 
                        : (r.episodes?.sub || r.episodes?.eps || r.episodes) 
                }));
                if (v2Data.recommendedAnimes?.length) universalData.recommendations = v2Data.recommendedAnimes.map((r:any) => ({ 
                    id: r.id, 
                    title: r.name, 
                    poster: r.poster, 
                    type: r.type, 
                    // ✅ EPISODE OBJECT FIX
                    episodes: typeof r.episodes === 'object' 
                        ? (r.episodes.sub || r.episodes.eps || 0) 
                        : (r.episodes?.sub || r.episodes?.eps || r.episodes)
                }));
                if (v2Data.seasons?.length) universalData.seasons = v2Data.seasons.map((s:any) => ({ id: s.id, title: s.title, poster: s.poster, isCurrent: s.isCurrent }));
                if (v2Data.anime?.info?.promotionalVideos?.length) universalData.trailers = v2Data.anime.info.promotionalVideos;
            }

            if (!universalData.episodes || universalData.episodes.length === 0) {
                const epData = await AnimeService.getEpisodes(animeId);
                if (epData && Array.isArray(epData) && epData.length > 0) {
                    universalData.episodes = epData;
                }
            }
            setAnime(universalData);
            try { 
                const s = await AnimeAPI_V2.getNextEpisodeSchedule(animeId); 
                setNextEpSchedule(s as V2EpisodeSchedule | null); 
            } catch {}

        } catch(e) { console.error(e); } finally { setIsLoadingInfo(false); }
    };
    init();
  }, [animeId]);

  // 2. SMART SYNC
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
          } catch {}

          let dbData: {[key: string]: any} = {};
          if (user && supabase) {
              try {
                  const { data } = await (supabase.from('user_continue_watching') as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('anime_id', animeId);
                  
                  if (data) {
                      data.forEach((row: any) => {
                          dbData[row.episode_id] = row;
                      });
                  }
              } catch {}
          }

          const allEpIds = new Set([...Object.keys(localData), ...Object.keys(dbData)]);
          
          allEpIds.forEach(epId => {
              const local = localData[epId];
              const db = dbData[epId];
              let final = null;

              if (local && db) {
                  const localTime = new Date(local.last_updated).getTime();
                  const dbTime = new Date(db.last_updated).getTime();
                  if (localTime > dbTime) {
                      final = local;
                      needsDbUpdate = true;
                      bufferToFlush.push(local);
                  } else {
                      final = db;
                  }
              } else if (local) {
                  final = local;
                  needsDbUpdate = true;
                  bufferToFlush.push(local);
              } else if (db) {
                  final = db;
              }

              if (final) {
                  progressBuffer.current[epId] = final;
                  const dur = final.duration || 1440;
                  if (final.is_completed) {
                      progressMap[final.episode_number] = 100;
                  } else {
                      progressMap[final.episode_number] = Math.min(100, Math.round((final.progress / dur) * 100));
                  }
                  if (final.last_server) savedServer = final.last_server;
              }
          });

          setEpProgress(progressMap);
          if (savedServer && savedServer !== settings.server) updateSetting('server', savedServer);
          localStorage.setItem(tempStorageKey, JSON.stringify(progressBuffer.current));

          if (user && needsDbUpdate && bufferToFlush.length > 0) {
              const sanitized = bufferToFlush.map(p => {
                  const { duration, ...clean } = p;
                  return clean;
              });
              
              (supabase!.from('user_continue_watching') as any)
                  .upsert(sanitized, { onConflict: 'user_id, episode_id' });
          }

          let targetEpId = urlEpId;
          
          // ✅ FIX: Priority to Image Search Params (episode number)
          if (urlEpNumber && anime.episodes) {
              const foundEp = anime.episodes.find(e => e.number === Number(urlEpNumber));
              if (foundEp) {
                  targetEpId = foundEp.id;
              }
          }

          if (!targetEpId) {
              let maxTime = 0;
              Object.values(progressBuffer.current).forEach((p:any) => {
                  const t = new Date(p.last_updated).getTime();
                  if (t > maxTime) {
                      maxTime = t;
                      targetEpId = p.episode_id;
                  }
              });
          }
          if (!targetEpId && anime.episodes.length > 0) targetEpId = anime.episodes[0].id;

          if (targetEpId && targetEpId !== currentEpId) {
              setCurrentEpId(targetEpId);
              try { const svs = await AnimeAPI_V2.getEpisodeServers(targetEpId); setServers(svs); } catch {} 
          }
      };

      syncHistory();
  }, [anime, user?.id, animeId]);

  // 3. CHARACTERS
  useEffect(() => {
      const fetchChars = async () => {
          setIsLoadingChars(true);
          try {
              const res: any = await retryOperation(() => AnimeAPI_V3.getAnimeCharacters(animeId, charPage));
              const results = res?.results || res;
              const list = results?.data || [];
              const pages = results?.totalPages || 1;

              if (Array.isArray(list) && list.length > 0) {
                  const normalized = list.map((c: any) => ({
                      id: c.character?.id || c.id,
                      name: c.character?.name || c.name,
                      poster: c.character?.poster || c.imageUrl || c.poster,
                      role: c.character?.cast || c.role || c.cast,
                      voiceActor: (c.voiceActors?.[0] || c.voiceActor) ? {
                          id: c.voiceActors?.[0]?.id || c.voiceActor?.id,
                          name: c.voiceActors?.[0]?.name || c.voiceActor?.name,
                          poster: c.voiceActors?.[0]?.poster || c.voiceActor?.poster,
                          language: c.voiceActors?.[0]?.type || c.voiceActor?.language
                      } : undefined
                  }));
                  setCharactersList(normalized); 
                  setTotalCharPages(pages); 
              } else {
                  setCharactersList([]);
              }
          } catch(e) { console.error("Char fetch failed", e); setCharactersList([]); }
          setIsLoadingChars(false);
      };
      fetchChars();
  }, [animeId, charPage]);

  // 4. STREAM LOADING
  useEffect(() => {
    if (!currentEpId || !isSettingsLoaded) return;
    
    const loadStream = async () => {
        setStreamUrl(null); 
        setIsStreamLoading(true);
        setStreamError(null);
        
        let time = 0;
        
        // ✅ Determine Start Time
        let isUrlOverride = false;
        if (urlTimestamp && urlEpNumber && anime) {
             const requestedEp = anime.episodes.find(e => e.number === Number(urlEpNumber));
             if (requestedEp && requestedEp.id === currentEpId) {
                 time = Number(urlTimestamp);
                 isUrlOverride = true;
             }
        }

        if (!isUrlOverride) {
            if (progressBuffer.current[currentEpId]) {
                time = progressBuffer.current[currentEpId].progress;
            } else if (!user) {
                const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}'); 
                if (localData[animeId] && localData[animeId].episodeId === currentEpId) time = localData[animeId].progress; 
            }
        }

        setResumeTime(time);
        progressRef.current = time;
        setIsResumeLoaded(true);

        try {
            const streamData: any = await AnimeService.getStream(currentEpId, settings.server, settings.category);
            if (streamData) {
                setStreamUrl(streamData.url);
                setSubtitles(streamData.subtitles || []);
                setIntro(streamData.intro);
                setOutro(streamData.outro);
            } else {
                throw new Error("No Stream Found");
            }
        } catch(e) { setStreamError("Portal Unstable"); }
        setIsStreamLoading(false);
    };
    loadStream();
  }, [currentEpId, user?.id, settings.server, settings.category, animeId, isSettingsLoaded]);

  // --- FORCE FLUSH TO DB ---
  const flushSyncBuffer = useCallback(async () => {
      if (!user || !supabase || !isBufferDirty.current) return;
      
      const payload = Object.values(progressBuffer.current);
      if (payload.length === 0) return;

      console.log("🔥 Flushing Sync Buffer to Supabase...", payload.length, "items");
      isBufferDirty.current = false;

      const sanitizedPayload = payload.map(p => {
          const { duration, ...clean } = p;
          return clean;
      });

      try {
          await (supabase.from('user_continue_watching') as any)
              .upsert(sanitizedPayload, { onConflict: 'user_id, episode_id' });
      } catch (e) {
          console.error("Flush Failed", e);
          isBufferDirty.current = true; 
      }
  }, [user, animeId]);

  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') flushSyncBuffer();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [flushSyncBuffer]);

  // 5. PROGRESS SAVING
  const saveProgress = useCallback(async (forceFlush = false) => {
      if (!currentEpId || !anime) return;
      
      const progress = Math.floor(progressRef.current);
      if (progress < 5) return;

      const ep = anime.episodes.find(e => e.id === currentEpId);
      if (!ep) return;

      const duration = playerRef.current?.getDuration() || 1440; 
      const percent = Math.min(100, Math.round((progress / duration) * 100));
      const isCompleted = percent >= 80;

      setEpProgress(prev => ({ ...prev, [ep.number]: isCompleted ? 100 : percent }));
      
      if (user) {
          const episodeImage = (ep as any).image || (ep as any).poster || anime.poster;
          const animeType = (anime as any).type || 'TV';

          const entry = { 
              user_id: user.id, 
              anime_id: animeId, 
              episode_id: currentEpId, 
              episode_number: ep.number, 
              progress: progress, 
              duration: duration, 
              last_updated: new Date().toISOString(),
              last_server: settings.server,         
              episode_image: episodeImage, 
              total_episodes: anime.episodes.length,
              type: animeType,               
              is_completed: isCompleted
          };

          progressBuffer.current[currentEpId] = entry;
          isBufferDirty.current = true;
          localStorage.setItem(`shadow_sync_buffer_${animeId}`, JSON.stringify(progressBuffer.current));

          if (forceFlush || isCompleted) {
              flushSyncBuffer();
          }

      } else {
          const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
          localData[animeId] = { 
             animeId, 
             episodeId: currentEpId, 
             episodeNumber: ep.number, 
             progress, 
             lastUpdated: Date.now() 
          };
          localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));
      }
  }, [anime, currentEpId, user, animeId, settings.server, flushSyncBuffer]);

  useEffect(() => { const i = setInterval(() => saveProgress(false), 10000); return () => clearInterval(i); }, [saveProgress]);

  const handlePause = () => {
      saveProgress(true);
  };

  const handleEpisodeClick = (id: string) => { 
      saveProgress(true); 
      setCurrentEpId(id); 
      setStreamUrl(null); 
      isSkipToastLocked.current = false;
      
      const newUrl = `/watch/${animeId}?ep=${id}`;
      window.history.pushState({}, '', newUrl);
  };

  const handleServerChange = (srvName: string) => {
      updateSetting('server', srvName);
      setStreamUrl(null); 
      setIsStreamLoading(true);
  };

  const chunkSize = epViewMode === 'compact' ? 100 : 50;
  const episodeChunks = useMemo(() => { 
      if(!anime) return []; 
      const chunks = []; 
      for(let i=0; i<anime.episodes.length; i+=chunkSize) chunks.push(anime.episodes.slice(i, i+chunkSize)); 
      return chunks; 
  }, [anime, chunkSize]);

  const currentEpIndex = anime?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEpisode = anime?.episodes[currentEpIndex];
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < (anime?.episodes.length || 0) - 1 ? anime?.episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? anime?.episodes[currentEpIndex - 1] : null;


useEffect(() => {
      if (anime) {
          const epPrefix = currentEpisode ? `Ep ${currentEpisode.number} - ` : '';
          document.title = `${epPrefix}${anime.title} | Shadow Garden`;
      }
  }, [anime, currentEpisode]);


  if (!anime) return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 pt-12 relative font-sans overflow-x-hidden">
      <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; display: block; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; opacity: 0.8; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
          
          @media (min-width: 1024px) {
              ${hideInterface ? `nav, header, footer, .bottom-navigation, div[class*="navbar"], div[class*="header"], div[class*="footer"], .fixed.top-0, .fixed.bottom-0 { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.5s ease-in-out; }` : ''}
              div[class*="navbar"]:hover, header:hover { opacity: 1 !important; pointer-events: auto !important; }
          }

          body { overflow-y: auto; } ::-webkit-scrollbar { width: 0px; display: none; } 
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes liquid {
             0% { background-position: 0% 50%; }
             50% { background-position: 100% 50%; }
             100% { background-position: 0% 50%; }
          }
          .animate-liquid {
             background-size: 200% 200%;
             animation: liquid 4s ease infinite;
          }
      `}</style>
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-700 pointer-events-none", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      {/* PLAYER WRAPPER */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center bg-[#050505] relative z-40 px-4 md:px-8 mt-6"
      >
        <div className="w-full max-w-[1300px] 2xl:max-w-[1680px]">
            <div 
                ref={playerContainerRef}
                tabIndex={0} 
                className="w-full aspect-video bg-black rounded-t-[30px] rounded-b-none overflow-hidden border-t border-l border-r border-white/5 shadow-2xl relative shadow-red-900/10 outline-none focus:ring-1 focus:ring-white/10" 
                onClick={handlePlayerClick}
                onKeyDown={(e) => {
                    if (e.code === 'Space') {
                        e.preventDefault();
                    }
                }}
            >
                <AnimatePresence>
                    {showSkipNotification && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-32 lg:bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-black/60 backdrop-blur-md border border-white/10 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none"
                        >
                            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                                <Check size={8} className="text-black stroke-[4]" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Skipped Intro</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {streamUrl ? (
                    <AnimePlayer 
                        key={currentEpId}
                        ref={playerRef} 
                        url={streamUrl || ""} 
                        subtitles={subtitles} 
                        intro={intro} 
                        outro={outro} 
                        title={currentEpisode?.title || anime.title} 
                        startTime={resumeTime} 
                        autoPlay={settings.autoPlay} 
                        autoSkip={settings.autoSkip} 
                        initialVolume={settings.volume} 
                        onProgress={(s:any) => progressRef.current = s.playedSeconds} 
                        onEnded={() => { saveProgress(true); if(settings.autoNext && nextEpisode) handleEpisodeClick(nextEpisode.id); }} 
                        onInteract={() => { if(!hideInterface) resetInterfaceTimer(); }} 
                        onPlay={handlePlaybackStart}
                        onPause={handlePause}
                        onSkipIntro={handleSkipIntro}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center border-b border-white/5">
                        <FantasyLoader text="OPENING PORTAL..." />
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                className={cn("w-full transition-all duration-500", hideInterface ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}
            >
                <div className="hidden lg:flex w-full bg-[#0a0a0a] border-b border-l border-r border-t-0 border-white/5 rounded-b-[30px] rounded-t-none shadow-red-900/10 shadow-lg px-5 py-2 flex-row gap-4 justify-between items-center overflow-hidden">
                    <div className="flex-1 min-w-0 flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                        <MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} />
                        <div className="hidden sm:block"><NextEpisodeTimer schedule={nextEpSchedule} status={anime.info.status} /></div>
                        <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide no-scrollbar">
                        <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className={cn("flex items-center gap-2 px-3 h-7 rounded-full border text-[9px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40 whitespace-nowrap", prevEpisode ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-red-900/10" : "opacity-10 border-white/5 text-zinc-600")}><SkipBack size={11}/> PREV</button>
                        <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className="flex items-center gap-2 px-3 h-7 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><FastForward size={11} className={cn("transition-colors", settings.autoSkip ? "text-red-600 shadow-[0_0_10px_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP</span></button>
                        <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className="flex items-center gap-2 px-3 h-7 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><Play size={11} className={cn("transition-colors", settings.autoPlay ? "text-red-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span></button>
                        <button onClick={() => updateSetting('autoNext', !settings.autoNext)} className="flex items-center gap-2 px-3 h-7 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><SkipForward size={11} className={cn("transition-colors", settings.autoNext ? "text-red-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoNext ? "text-white" : "text-zinc-500")}>NEXT</span></button>
                        <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-7 h-7 transition-all hover:scale-110 active:rotate-12 shadow-red-900/10 flex-shrink-0", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={14} /></Button>
                        <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner flex-shrink-0">{(['sub', 'dub', 'raw'] as const).map((cat) => { const isAvailable = (servers?.[cat]?.length || 0) > 0; return (<button key={cat} disabled={!isAvailable} onClick={() => updateSetting('category', cat)} className={cn("px-3 py-0.5 rounded-full text-[9px] font-black uppercase transition-all relative active:scale-75 shadow-sm", settings.category === cat ? "bg-red-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300", !isAvailable && "opacity-10")}>{cat}{isAvailable && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]" />}</button>);})}</div>
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 gap-2 text-[9px] font-black text-zinc-500 hover:text-white uppercase transition-all hover:scale-105 active:scale-90 shadow-md shadow-red-900/5 whitespace-nowrap rounded-full border border-white/5 bg-white/5">
                                    <ServerIcon size={11}/> 
                                    {servers?.[settings.category] 
                                        ? `Portal ${Math.max(1, servers[settings.category].findIndex((s:any) => s.serverName === settings.server) + 1)}` 
                                        : 'Loading...'} 
                                    <ChevronDown size={11}/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[40] min-w-[140px] w-auto h-auto max-h-[200px] p-2">
                                <ScrollArea className="h-auto max-h-[180px] custom-scrollbar">
                                    <div className="flex flex-col gap-1">
                                        {servers?.[settings.category]?.map((srv: any, idx: number) => (
                                            <DropdownMenuItem 
                                                key={srv.serverId} 
                                                onClick={() => handleServerChange(srv.serverName)} 
                                                className={cn(
                                                    "cursor-pointer focus:bg-red-600 focus:text-white px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-1 transition-all", 
                                                    settings.server === srv.serverName 
                                                        ? "bg-red-600 text-white shadow-lg" 
                                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                Portal {idx + 1}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {nextEpisode ? (<button onClick={() => handleEpisodeClick(nextEpisode.id)} className="flex items-center gap-2 px-3 h-7 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[9px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-md whitespace-nowrap group">NEXT <SkipForward size={11} className="group-hover:translate-x-1 transition-transform" /></button>) : (<button disabled className="flex items-center gap-2 bg-white/5 border border-white/5 text-zinc-600 rounded-full px-5 h-7 text-[9px] font-black uppercase tracking-widest cursor-not-allowed opacity-50 shadow-inner whitespace-nowrap">NEXT <SkipForward size={11} /></button>)}
                    </div>
                </div>

                {/* MOBILE CONTROLS */}
                <div className="flex lg:hidden w-full bg-[#0a0a0a] border-b border-l border-r border-t-0 border-white/5 rounded-b-[30px] rounded-t-none shadow-red-900/10 shadow-lg px-4 py-4 flex-col gap-3 overflow-hidden relative z-[60]">
                    <div className="flex w-full justify-between items-center gap-2">
                        <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className="flex-1 bg-white/5 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:bg-white/10"><SkipBack size={14}/></button>
                        <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className={cn("flex-1 h-8 rounded-full border flex items-center justify-center gap-0.5 transition-colors relative", settings.autoSkip ? "bg-red-600/20 border-red-500 text-red-500" : "bg-white/5 border-white/5 text-zinc-400")}>
                            <FastForward size={14}/>
                            <sup className="font-bold text-[8px] top-[-2px] text-inherit">A</sup>
                        </button>
                        <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className={cn("flex-1 h-8 rounded-full border flex items-center justify-center gap-0.5 transition-colors relative", settings.autoPlay ? "bg-red-600/20 border-red-500 text-red-500" : "bg-white/5 border-white/5 text-zinc-400")}>
                            <Play size={14}/>
                            <sup className="font-bold text-[8px] top-[-2px] text-inherit">A</sup>
                        </button>
                        <button onClick={() => updateSetting('autoNext', !settings.autoNext)} className={cn("flex-1 h-8 rounded-full border flex items-center justify-center gap-0.5 transition-colors relative", settings.autoNext ? "bg-red-600/20 border-red-500 text-red-500" : "bg-white/5 border-white/5 text-zinc-400")}>
                            <SkipForward size={14}/>
                            <sup className="font-bold text-[8px] top-[-2px] text-inherit">A</sup>
                        </button>
                        <button disabled={!nextEpisode} onClick={() => nextEpisode && handleEpisodeClick(nextEpisode.id)} className="flex-1 bg-white/5 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:bg-white/10"><SkipForward size={14}/></button>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 w-full items-center">
                        <div className="min-w-0"><MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} /></div>
                        <NextEpisodeTimer schedule={nextEpSchedule} status={anime.info.status} />
                        <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} />
                    </div>

                    <div className="flex w-full justify-between items-center gap-2">
                        <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 bg-white/5")}><Lightbulb size={16} /></Button>
                        <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner flex-1 justify-center">{(['sub', 'dub', 'raw'] as const).map((cat) => { const isAvailable = (servers?.[cat]?.length || 0) > 0; return (<button key={cat} disabled={!isAvailable} onClick={() => updateSetting('category', cat)} className={cn("px-3 py-0.5 rounded-full text-[10px] font-black uppercase transition-all relative active:scale-75 shadow-sm flex-1", settings.category === cat ? "bg-red-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300", !isAvailable && "opacity-10")}>{cat}</button>);})}</div>
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 bg-white/5 rounded-full border border-white/5 w-24">
                                    <ServerIcon size={12}/> Portal {servers?.[settings.category] ? Math.max(1, servers[settings.category].findIndex((s:any) => s.serverName === settings.server) + 1) : '?'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-2 shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[70]">
                                <ScrollArea className="h-auto max-h-[150px]"><div className="flex flex-col gap-1">{servers?.[settings.category]?.map((srv: any, idx: number) => (<DropdownMenuItem key={srv.serverId} onClick={() => handleServerChange(srv.serverName)} className={cn("text-[10px] uppercase font-bold", settings.server === srv.serverName ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-white/10")}>Portal {idx + 1}</DropdownMenuItem>))}</div></ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </motion.div>
        </div>
      </motion.div>

      {/* PAGE CONTENT */}
      <div className="w-full flex justify-center mt-8 px-4 md:px-8"><div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-8 max-w-[1300px] 2xl:max-w-[1680px]">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="order-2 xl:order-1 xl:col-span-4 h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative z-20">
                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-[Cinzel] tracking-widest"><Layers size={18} className="text-red-600"/> Episodes</h3>
                        <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white font-black text-[10px] px-3 h-5 rounded-full shadow-lg">{anime.episodes.length}</Badge>
                    </div>
                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                        <button onClick={() => setEpViewMode('compact')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'compact' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><Grid size={14}/></button>
                        <button onClick={() => setEpViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'grid' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><LayoutGrid size={14}/></button>
                        <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'list' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><List size={14}/></button>
                    </div>
                </div>
                <div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 py-3 px-4 relative group/chunks">
                    <div ref={chunksRef} className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
                        {episodeChunks.map((_, idx) => (
                            <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full transition-all border shadow-sm uppercase tracking-wider", epChunkIndex === idx ? "bg-red-600 text-white border-red-500 shadow-red-900/20" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700")}>{(idx * chunkSize) + 1}-{Math.min((idx + 1) * chunkSize, anime.episodes.length)}</button>
                        ))}
                    </div>
                </div>
                <ScrollArea className="flex-1 p-2 shadow-inner custom-scrollbar overflow-x-hidden">
                    <motion.div layout className={cn("p-2 transition-all duration-500 ease-in-out grid", epViewMode === 'grid' ? 'grid-cols-5 gap-2.5' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-2')}>
                        <AnimatePresence mode="popLayout">
                        {episodeChunks[epChunkIndex]?.map((ep) => {
                            const percent = epProgress[ep.number] || 0;
                            const isFullyPlayed = percent >= 80 || percent === 100;
                            const isCurrent = ep.id === currentEpId;
                            return (
                                <motion.button key={ep.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleEpisodeClick(ep.id)} className={cn("relative overflow-hidden group border transition-all duration-300", epViewMode === 'grid' ? "h-9 w-full rounded-full flex items-center justify-center text-[11px] font-black shadow-lg" : epViewMode === 'compact' ? "aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" : "w-[95%] mx-auto h-9 rounded-full flex items-center px-4 text-[11px] font-bold text-left", isCurrent ? "bg-red-600/90 backdrop-blur-md border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] z-20 scale-105" : isFullyPlayed ? "bg-[#000] border border-red-900/30 text-white shadow-[inset_0_0_15px_rgba(220,38,38,0.5)] drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white")} style={!isCurrent && !isFullyPlayed && percent > 0 ? { background: `linear-gradient(to right, rgba(220, 38, 38, 0.4) ${percent}%, transparent ${percent}%)`, } : {}}>
                                    {!isCurrent && !isFullyPlayed && percent > 0 && <div className="absolute inset-0 bg-red-600/10 animate-liquid pointer-events-none" />}
                                    <span className={cn("truncate relative z-10 w-full", epViewMode === 'list' ? "text-left" : "text-center")}>{epViewMode === 'list' ? `${ep.number}. ${ep.title}` : ep.number}</span>
                                </motion.button>
                            );
                        })}
                        </AnimatePresence>
                    </motion.div>
                </ScrollArea>
            </motion.div>
            
            <div className="contents xl:contents">
                <div className="order-3 xl:order-3 xl:col-span-12 w-full" onKeyDown={(e) => e.stopPropagation()}>
                    <ShadowComments key={user?.id || 'guest'} episodeId={currentEpId || "general"} />
                </div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="order-4 xl:order-2 xl:col-span-8 h-auto xl:h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20">
                    <div className="flex-shrink-0 relative p-8 pt-16 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-red-600/5 to-transparent">
                        <div className="relative shrink-0 mx-auto lg:mx-0 flex flex-col gap-6 w-full lg:w-auto items-center lg:items-start text-center lg:text-left">
                            <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] mx-auto sm:mx-0 w-fit">
                                <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#dc2626_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" />
                                <img src={anime.poster} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl shadow-black" alt={anime.title} />
                            </div>
                            <div className="flex lg:hidden flex-col gap-3 w-full items-center text-center">
                                <h1 className="text-2xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-2xl shadow-black">{anime.title}</h1>
                                <div className="flex flex-wrap gap-3 mt-3 justify-center items-center">
                                    <div className="flex items-center flex-wrap justify-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20 max-w-full">
                                         {formatRating(anime.stats.rating) && (<><span className={cn(formatRating(anime.stats.rating)?.includes('18') || formatRating(anime.stats.rating)?.includes('R') ? "text-red-500" : "text-zinc-400")}>{formatRating(anime.stats.rating)}</span><span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/></>)}
                                        <span className={cn(anime.info.status.includes('Airing') ? 'text-green-500 animate-pulse' : 'text-zinc-500')}>{anime.info.status}</span>
                                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-600 shadow-red-900/20"/> {anime.stats.duration}</div>
                                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                        <div className="text-yellow-500">MAL: {anime.stats.malScore}</div>
                                    </div>
                                </div>
                                <div className="flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                            </div>
                            <div className="hidden lg:flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                        </div>
                        <div className="hidden lg:flex flex-1 pt-2 text-left z-10 flex-col h-full w-full">
                            <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] leading-none mb-2 tracking-tighter drop-shadow-2xl shadow-black">{anime.title}</h1>
                            {anime.jname && <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-6 opacity-60 drop-shadow-sm">{anime.jname}</p>}
                            <div className="flex flex-wrap gap-4 mt-3 justify-start items-center">
                                <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20">
                                    {formatRating(anime.stats.rating) && (<><span className={cn(formatRating(anime.stats.rating)?.includes('18') || formatRating(anime.stats.rating)?.includes('R') ? "text-red-500" : "text-zinc-400")}>{formatRating(anime.stats.rating)}</span><span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/></>)}
                                    <span className={cn(anime.info.status.includes('Airing') ? 'text-green-500 animate-pulse' : 'text-zinc-500')}>{anime.info.status}</span>
                                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-600 shadow-red-900/20"/> {anime.stats.duration}</div>
                                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                                    <div className="text-yellow-500">MAL: {anime.stats.malScore}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-6 justify-start">
                                {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-red-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-red-900/20 shadow-red-900/10">{g}</Link>))}
                            </div>
                            <div className="mt-auto pt-6 w-full flex justify-end"><StarRating animeId={animeId} initialRating={anime.stats.rating} /></div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative px-6 sm:px-10 mt-4 overflow-hidden flex flex-col">
                        <div className="lg:hidden flex flex-wrap gap-2 justify-center mb-6">
                             {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[8px] px-3 py-1 bg-white/5 rounded-full text-zinc-500 border border-white/5 uppercase font-bold">{g}</Link>))}
                        </div>
                        <div className="lg:hidden flex justify-center mb-6"><StarRating animeId={animeId} initialRating={anime.stats.rating} /></div>
                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2 shadow-sm shrink-0"><Info size={12} className="shadow-sm"/> Synopsis</h4>
                        <ScrollArea className="flex-1 pr-4 custom-scrollbar shadow-inner shadow-red-900/5">
                           <p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased font-medium opacity-90 drop-shadow-sm shadow-black" dangerouslySetInnerHTML={{ __html: anime.description }} />
                        </ScrollArea>
                        <div className="grid lg:hidden grid-cols-2 gap-3 w-full mt-6 mb-6">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-1">Aired</span>
                                <span className="text-[9px] font-bold text-zinc-300 text-center">{anime.info.aired}</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-1">Premiered</span>
                                <span className="text-[9px] font-bold text-zinc-300">{anime.info.premiered}</span>
                            </div>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-1">Studios</span>
                                        <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center flex items-center justify-center gap-1">{anime.info.studios?.[0] || '?'} <ChevronDown size={8}/></span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 text-zinc-300 text-[10px] rounded-xl shadow-lg"><ScrollArea className="h-20"><div className="flex flex-col p-1">{anime.info.studios.map((s:string)=><DropdownMenuItem key={s} className="hover:bg-white/10 cursor-pointer rounded-lg">{s}</DropdownMenuItem>)}</div></ScrollArea></DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-1">Producers</span>
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
        {anime.seasons && anime.seasons.length > 0 && (
            <div className="w-full max-w-[1300px] 2xl:max-w-[1680px] mx-auto order-5">
                <div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/seasons shadow-red-900/20 shadow-md">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/seasons:bg-red-600/10 transition-all duration-1000" />
                    <div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Seasons</h4></div>
                    <ScrollArea className="w-full whitespace-nowrap pb-6 custom-scrollbar">
                        <div className="flex gap-6 w-max" ref={seasonsRef} onWheel={(e:any) => e.stopPropagation()}>{anime.seasons.map((season: any) => season?.id ? (<Link key={season.id} href={`/watch/${season.id}`} className={cn("group/item flex items-center gap-5 p-2 pr-10 rounded-full border hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[280px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md", season.isCurrent ? "bg-red-600/10 border-red-600" : "bg-white/5 border-white/5")}><div className="relative shrink-0 overflow-hidden rounded-full w-14 h-14 border-2 border-white/5 group-hover/item:border-red-600 shadow-md shadow-black/50"><img src={season.poster || '/images/no-poster.png'} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125" alt={season.title} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[11px] font-black text-zinc-300 group-hover:text-white truncate w-[160px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{season.title}</span><span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">{season.isCurrent ? 'NOW PLAYING' : 'VIEW ARCHIVE'}</span></div></Link>) : null)}</div><ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        )}
        {anime.related && anime.related.length > 0 && (
            <div className="w-full max-w-[1300px] 2xl:max-w-[1680px] mx-auto order-6">
                <div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/related shadow-red-900/20 shadow-md">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/related:bg-red-600/10 transition-all duration-1000" />
                    <div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Related Domains</h4></div>
                    <ScrollArea className="w-full whitespace-nowrap pb-6 custom-scrollbar">
                        <div className="flex gap-6 w-max" ref={relatedRef} onWheel={(e:any) => e.stopPropagation()}>{anime.related.map((rel: any, idx: number) => rel?.id ? (<Link key={`${rel.id}-${idx}`} href={`/watch/${rel.id}`} className="group/item flex items-center gap-5 p-2 pr-10 rounded-full bg-white/5 border border-white/5 hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[320px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md"><div className="relative shrink-0 overflow-hidden rounded-full w-16 h-16 border-2 border-white/5 group-hover/item:border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-500 shadow-black/50 shadow-md"><img src={rel.poster || rel.image || '/images/no-poster.png'} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125 shadow-md shadow-red-900/5" alt={rel.name} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[13px] font-black text-zinc-300 group-hover:text-white truncate w-[180px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{rel.name || rel.title}</span><div className="flex items-center gap-3"><Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-600 rounded-md group-hover/item:border-red-500/50 group-hover/item:text-red-500 uppercase tracking-widest shadow-sm">{rel.type}</Badge><span className="w-1 h-1 bg-zinc-900 rounded-full shadow-sm shrink-0"/><span className="text-[9px] text-zinc-700 font-black uppercase group-hover/item:text-zinc-400 shadow-sm">
                            {typeof rel.episodes === 'object' ? (rel.episodes.sub || rel.episodes.dub || '?') : (rel.episodes || '?')} EPS
                        </span></div></div></Link>) : null)}</div><ScrollBar orientation="horizontal" className="hidden" />
                    </ScrollArea>
                </div>
            </div>
        )}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="w-full flex justify-center mt-12 px-4 md:px-8 pb-12"><div className="w-full max-w-[1300px] 2xl:max-w-[1680px] grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="order-7 xl:order-2 xl:col-span-8 h-auto xl:h-[750px] bg-[#0a0a0a] rounded-[50px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20 shadow-md">
                <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between shadow-red-900/5 shadow-md">
                    <div className="flex items-center gap-4"><User size={20} className="text-red-600 shadow-red-600/30" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase">Manifested Bloodlines</h3></div>
                </div>
                <div className="flex-1 p-6 md:p-10 overflow-hidden relative">
                    {isLoadingChars ? <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><FantasyLoader text="LOADING DATA..." /></div> : 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 h-full xl:overflow-y-auto custom-scrollbar pb-16">
                        {charactersList.length > 0 ? charactersList.map((char: any, i: number) => (
                            <div key={i} className={cn("flex bg-white/5 border rounded-[30px] p-4 transition-all duration-500 group shadow-lg cursor-default", char.role === 'Main' ? "border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.25)] bg-red-600/5" : "border-white/5 hover:border-white/10 hover:shadow-red-900/10")}>
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => openCharacter(char.id)}>
                                    <img src={char.poster || '/images/non-non.png'} className={cn("w-14 h-14 rounded-full object-cover border transition-colors shadow-lg", char.role === 'Main' ? "border-red-500 shadow-red-900/60" : "border-white/10 group-hover:border-red-500/50")} />
                                    <div className="flex flex-col"><span className={cn("text-[11px] font-black uppercase tracking-tighter line-clamp-1", char.role === 'Main' ? "text-red-400 text-shadow-sm" : "text-zinc-200")}>{char.name}</span><Badge variant="outline" className={cn("w-fit mt-1 text-[8px] font-bold px-2 py-0 h-4 rounded-full transition-colors", char.role === 'Main' ? "border-red-600 text-red-500 bg-red-600/10" : "border-zinc-800 text-zinc-500 group-hover:text-red-500 group-hover:border-red-500/30")}>{char.role}</Badge></div>
                                </div>
                                <div className="w-px bg-white/10 mx-2" />
                                <div className="flex items-center gap-4 flex-1 justify-end text-right cursor-pointer" onClick={() => char.voiceActor?.id && openActor(char.voiceActor.id)}>
                                    <div className="flex flex-col items-end">{char.voiceActor ? (<><span className="text-[11px] font-bold text-zinc-400 uppercase line-clamp-1 hover:text-white transition-colors">{char.voiceActor.name}</span><span className="text-[8px] font-bold text-zinc-600 uppercase">{char.voiceActor.language}</span></>) : <span className="text-[9px] text-zinc-600">Unknown</span>}</div>
                                    {char.voiceActor && <img src={char.voiceActor.poster || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/5 grayscale group-hover:grayscale-0 transition-all" />}
                                </div>
                            </div>
                        )) : <div className="col-span-full flex flex-col items-center justify-center opacity-50"><img src="/images/non-non.png" alt="No Bloodlines" className="w-16 h-16 rounded-full grayscale opacity-50 mb-2 border border-white/10" /><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">No Bloodlines Found</p></div>}
                    </div>}
                    <div className="absolute bottom-4 left-0 w-full flex justify-between items-center px-10 pointer-events-none">
                        <button disabled={charPage <= 1} onClick={() => setCharPage(p => Math.max(1, p - 1))} className="pointer-events-auto p-3 rounded-full bg-white/5 text-zinc-300 hover:text-red-600 hover:bg-white/10 transition-all hover:scale-110 active:scale-90 shadow-lg disabled:opacity-0"><ChevronLeft size={20} /></button>
                        <div className="pointer-events-auto px-6 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest shadow-xl">{charPage} / {totalCharPages}</div>
                        <button disabled={charPage >= totalCharPages} onClick={() => setCharPage(p => p + 1)} className="pointer-events-auto p-3 rounded-full bg-white/5 text-zinc-300 hover:text-red-600 hover:bg-white/10 transition-all hover:scale-110 active:scale-90 shadow-lg disabled:opacity-0"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>
            <div className="order-8 xl:order-1 xl:col-span-4 h-[750px] flex flex-col bg-[#0a0a0a] rounded-[50px] border border-white/5 shadow-2xl overflow-hidden relative group/paths shadow-red-900/20 shadow-md"><div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 relative z-10 shadow-red-900/5 shadow-md"><Heart size={20} className="text-red-600 fill-red-600 animate-pulse shadow-red-600/30 shadow-md" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Recommended</h3></div><div className="flex-1 overflow-hidden p-6 relative z-10 shadow-inner shadow-red-900/5"><ScrollArea className="h-full pr-4 custom-scrollbar"><div className="space-y-4" ref={recommendationsRef} onWheel={(e:any) => e.stopPropagation()}>{anime.recommendations?.length > 0 && anime.recommendations.map((rec: any, idx: number) => rec?.id ? (<Link key={`${rec.id}-${idx}`} href={`/watch/${rec.id}`} className="flex gap-5 p-4 rounded-[32px] hover:bg-red-600/5 group transition-all duration-500 active:scale-95 border border-transparent hover:border-red-600/20 shadow-inner shadow-red-900/5"><img src={rec.poster || rec.image || '/images/no-poster.png'} className="w-16 h-24 object-cover rounded-2xl shadow-3xl group-hover:rotate-1 transition-all duration-500 shadow-black shadow-md shrink-0" alt={rec.name} /><div className="flex-1 py-1 flex flex-col justify-center min-w-0"><h4 className="text-[12px] font-black text-zinc-500 group-hover:text-red-500 line-clamp-2 transition-all uppercase tracking-tight leading-tight mb-2 shadow-black drop-shadow-md">{rec.name || rec.title}</h4><div className="flex items-center gap-3"><span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] group-hover:text-zinc-500 transition-colors shadow-sm whitespace-nowrap">{rec.type || 'TV'}</span><span className="w-1 h-1 bg-zinc-900 rounded-full shadow-sm shrink-0"/><span className="text-[9px] text-zinc-800 font-black uppercase group-hover:text-red-900 transition-colors shadow-sm whitespace-nowrap">
                            {typeof rec.episodes === 'object' ? (rec.episodes.sub || rec.episodes.dub || '?') : (rec.episodes || '?')} EPS
                        </span></div></div></Link>) : null)}</div></ScrollArea></div></div>
      </div></motion.div>
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

export default function WatchPage() { return <Suspense fallback={<FantasyLoader />}><WatchContent /></Suspense>; }