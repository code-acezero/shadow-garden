"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Clock, AlertCircle, Tv, Play, 
  Grid, List, Timer, Lightbulb, 
  ChevronDown, Heart, CheckCircle, XCircle,
  FastForward, Star, Info, MessageSquare, User,
  Loader2, Globe, Flame, Calendar, Copyright, Check, Mic, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// API Imports
import { AnimeService, AnimeAPI_V2, AnimeAPI_V3, supabase, UniversalAnime } from '@/lib/api'; 
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; 

import AnimePlayer, { AnimePlayerRef } from '@/components/Player/AnimePlayer'; 
import WatchListButton from '@/components/Watch/WatchListButton'; 
import ShadowComments from '@/components/Comments/ShadowComments'; 
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogTrigger, DialogTitle
} from "@/components/ui/dialog";

// --- CUSTOM SCROLL HOOK (Mouse Wheel + Drag) ---
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
             if (e.deltaY !== 0) {
                 slider.scrollLeft += e.deltaY;
             }
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

// --- HELPERS ---
interface V2EpisodeSchedule { airingISOTimestamp: string | null; airingTimestamp: number | null; secondsUntilAiring: number | null; }

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(res => setTimeout(res, delay));
        return retryOperation(operation, retries - 1, delay * 2);
    }
}

// --- SETTINGS HOOK ---
const useWatchSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ 
    autoPlay: true, autoNext: true, autoSkip: false, dimMode: false, 
    server: 'hd-1', category: 'sub' as 'sub' | 'dub' | 'raw', volume: 1, speed: 1 
  });

  useEffect(() => { 
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('shadow_watch_settings'); 
          if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); 
          else setSettings(prev => ({...prev, autoSkip: true})); 
      }
  }, []);

  const updateSetting = async (key: string, value: any) => { 
      setSettings(prev => { 
          const newSettings = { ...prev, [key]: value }; 
          localStorage.setItem('shadow_watch_settings', JSON.stringify(newSettings)); 
          if (user && supabase) { (supabase.from('profiles') as any).update({ player_settings: newSettings }).eq('id', user.id).then(); }
          return newSettings; 
      }); 
  };
  return { settings, updateSetting };
};

// --- SUB-COMPONENTS ---
const FantasyLoader = ({ text = "SUMMONING..." }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#050505]">
    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-red-500/20" />
    <h2 className="text-xl font-[Cinzel] text-red-500 animate-pulse tracking-[0.3em]">{text}</h2>
  </div>
);

const ChibiCry = ({ text = "UNKNOWN" }: { text?: string }) => (<div className="flex items-center gap-1 opacity-70 animate-pulse"><span className="text-xs text-red-500 font-black uppercase tracking-tighter">{text}</span></div>);

const NextEpisodeTimer = ({ schedule, status }: { schedule: V2EpisodeSchedule | null, status: string }) => { 
    const [displayText, setDisplayText] = useState<React.ReactNode>("..."); 
    useEffect(() => { 
        if (status?.toLowerCase().includes("finished")) { setDisplayText(<ChibiCry text="ENDED" />); return; } 
        if (!schedule || !schedule.airingISOTimestamp) { setDisplayText(<ChibiCry text="UNKNOWN" />); return; } 
        const updateTimer = () => { const now = new Date().getTime(); const target = new Date(schedule.airingISOTimestamp!).getTime(); const diff = target - now; if (diff <= 0) { setDisplayText("Aired"); return; } const hours = Math.floor((diff % 86400000) / 3600000); const minutes = Math.floor((diff % 3600000) / 60000); const days = Math.floor(diff / 86400000); setDisplayText(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`); }; 
        updateTimer(); const interval = setInterval(updateTimer, 30000); return () => clearInterval(interval); 
    }, [schedule, status]); 
    return (<div className="flex items-center gap-2 text-[10px] font-bold bg-white/5 text-zinc-300 px-3 h-8 rounded-full border border-white/5 justify-center min-w-fit max-w-full shadow-red-900/5"><Timer className="w-3 h-3 text-red-500 shrink-0" /><span className="truncate whitespace-nowrap">{displayText}</span></div>); 
};

const StarRating = ({ animeId, initialRating = 0 }: { animeId: string; initialRating?: string | number }) => { 
    const [userRating, setUserRating] = useState(0); const [avgRating, setAvgRating] = useState(0); const [hover, setHover] = useState(0); const { user } = useAuth(); 
    useEffect(() => { const fetchRatings = async () => { if (!supabase) return; try { const allRatings = await retryOperation(async () => { const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('anime_id', animeId); return data; }); if (allRatings && allRatings.length > 0) { const sum = allRatings.reduce((acc:any, curr:any) => acc + (curr.rating ?? 0), 0); setAvgRating(sum / allRatings.length); } else { setAvgRating(typeof initialRating === 'string' ? parseFloat(initialRating) : (typeof initialRating === 'number' ? initialRating : 0)); } if (user) { const myRating = await retryOperation(async () => { const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('user_id', user.id).eq('anime_id', animeId).single(); return data; }); if (myRating && (myRating as any).rating != null) setUserRating((myRating as any).rating); } } catch (e) {} }; fetchRatings(); }, [user, animeId, initialRating]); 
    const handleRate = async (score: number) => { if (!user) { toast.error("Shadow Agents only."); return; } setUserRating(score); try { await (supabase!.from('anime_ratings') as any).upsert({ user_id: user.id, anime_id: animeId, rating: score }, { onConflict: 'user_id, anime_id' }); toast.success(`Rated ${score} stars!`); } catch (err) {} }; 
    return (<div className="flex flex-col gap-1 items-end"><div className="flex items-center gap-2"><span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest text-right">{userRating > 0 ? "Your Rating" : "Rate This"}</span><span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">(AVG: {avgRating.toFixed(1)})</span></div><div className="flex items-center gap-2"><div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => handleRate(star)}><Star size={14} className={cn("transition-all duration-300", star <= (hover || userRating) ? "fill-red-600 text-red-600 shadow-red-500/50" : "text-zinc-700")} /></button>))}</div><div className="flex flex-col items-end leading-none"><span className="text-[12px] text-white font-black">{userRating > 0 ? userRating : "?"}<span className="text-zinc-500 text-[10px]">/5</span></span></div></div></div>); 
};

const TrailerSection = ({ videos }: { videos: any[] }) => { 
    const [activeVideo, setActiveVideo] = useState(videos?.[0]?.source); if (!videos || videos.length === 0) return null; const getYoutubeId = (url: string) => url?.split('v=')[1]?.split('&')[0] || url?.split('/').pop(); 
    return (<Dialog><DialogTrigger asChild><div className="inline-flex items-center gap-3 bg-red-600/10 border border-red-500/20 rounded-full px-8 py-2.5 cursor-pointer hover:bg-red-600 hover:border-red-500 transition-all group active:scale-95 shadow-lg shadow-red-900/10 w-full justify-center"><span className="flex items-center justify-center w-5 h-5 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform"><Play size={8} fill="currentColor" /></span><span className="text-[10px] font-black text-red-100 group-hover:text-white uppercase tracking-wider">Trailers ({videos.length})</span></div></DialogTrigger><DialogContent className="bg-black/95 border-red-500/40 max-w-4xl w-[95vw] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300"><DialogTitle className="sr-only">Trailers</DialogTitle><div className="flex flex-col h-full"><div className="aspect-video w-full bg-zinc-900"><iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /></div><div className="p-6 bg-[#0a0a0a]"><ScrollArea className="w-full whitespace-nowrap pb-4"><div className="flex gap-4 px-2">{videos.map((v: any, i: number) => (v && v.source ? <button key={i} onClick={() => setActiveVideo(v.source)} className={cn("flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-36 hover:scale-105 active:scale-95 group/pv", activeVideo === v.source ? "bg-red-600/10 border-red-600" : "bg-white/5 border-transparent hover:border-white/10")}><div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative shadow-lg"><img src={v.thumbnail || '/images/no-thumb.png'} className="w-full h-full object-cover opacity-60" alt="" /><div className="absolute inset-0 flex items-center justify-center bg-red-600/20 opacity-0 group-hover/pv:opacity-100 transition-opacity"><Play size={16} fill="white" className="text-white" /></div></div><span className="text-[9px] font-black text-center truncate w-full uppercase text-zinc-400 group-hover/pv:text-white">{v.title || `Promo ${i+1}`}</span></button> : null))}</div><ScrollBar orientation="horizontal" className="h-1 bg-white/5" /></ScrollArea></div></div></DialogContent></Dialog>); 
};

const MarqueeTitle = ({ text }: { text: string }) => { const containerRef = useRef<HTMLDivElement>(null); const textRef = useRef<HTMLSpanElement>(null); const [isOverflowing, setIsOverflowing] = useState(false); useEffect(() => { if (containerRef.current && textRef.current) { setIsOverflowing(textRef.current.offsetWidth > containerRef.current.offsetWidth); } }, [text]); return (<div className="flex items-center bg-white/5 rounded-full px-4 h-8 border border-white/5 w-full sm:w-[280px] overflow-hidden relative transition-all hover:border-red-500/20 active:scale-95 group shadow-inner shadow-red-900/5"><span className="text-[11px] text-red-500 font-black uppercase mr-2 flex-shrink-0 group-hover:animate-pulse">NOW:</span><div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center"><span ref={textRef} className={cn("text-[11px] font-black uppercase tracking-tighter text-zinc-300 whitespace-nowrap", isOverflowing && "animate-marquee-slow")}>{text}</span><style jsx>{` @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-marquee-slow { animation: marquee 10s linear infinite; } `}</style></div></div>); };

// --- POPUP 1: CHARACTER DETAILS (Stable V3 + Data Structure Fix) ---
const CharacterDetailsDialog = ({ isOpen, onClose, characterId }: { isOpen: boolean; onClose: () => void; characterId: string | null }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !characterId) return;
    setLoading(true);
    retryOperation(() => AnimeAPI_V3.getCharacterDetails(characterId)).then((res: any) => { 
        // [FIX] Handle { results: { data: [...] } } structure
        const item = res?.results?.data?.[0] || res?.data?.[0] || res;
        setData(item); 
        setLoading(false); 
    }).catch(() => setLoading(false));
  }, [isOpen, characterId]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-[40px] z-[60] [&>button]:hidden">
        <DialogTitle className="sr-only">Character Details</DialogTitle>
        <div className="w-full h-full relative backdrop-blur-2xl bg-[#050505]/60 border border-white/10 rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/10 via-transparent to-blue-600/5 pointer-events-none" />
           <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all active:scale-90"><X size={18} /></button>
           {loading ? <div className="w-full h-full flex items-center justify-center"><FantasyLoader text="ANALYZING..." /></div> : data ? (
             <>
               <div className="w-full md:w-[40%] h-[40%] md:h-full relative overflow-hidden group">
                  <img src={data.profile || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name || "Unknown"} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                  <div className="absolute bottom-6 left-6 z-10"><h2 className="text-3xl md:text-4xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-lg">{data.name}</h2><p className="text-red-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{data.japaneseName}</p></div>
               </div>
               <div className="w-full md:w-[60%] h-[60%] md:h-full relative z-10 flex flex-col">
                  <ScrollArea className="h-full p-8 custom-scrollbar">
                     <div className="space-y-8">
                        <div><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12}/> Biography</h3><div className="text-zinc-300 text-sm leading-relaxed font-medium opacity-90 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: data.about?.style || data.about?.description || "No Data" }} /></div>
                        <div><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Mic size={12}/> Voice Actors</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{data.voiceActors?.map((va: any) => (<div key={va.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"><img src={va.profile || '/images/non-non.png'} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={va.name} /><div className="flex flex-col"><span className="text-xs font-bold text-zinc-200">{va.name}</span><span className="text-[9px] text-zinc-500 uppercase tracking-wider">{va.language}</span></div></div>))}</div></div>
                     </div>
                  </ScrollArea>
               </div>
             </>
           ) : <div className="w-full h-full flex items-center justify-center text-red-500 font-bold">DATA CORRUPTED</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- POPUP 2: VOICE ACTOR DETAILS (Stable V3 + Data Structure Fix) ---
const VoiceActorDetailsDialog = ({ isOpen, onClose, actorId }: { isOpen: boolean; onClose: () => void; actorId: string | null }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !actorId) return;
    setLoading(true);
    retryOperation(() => AnimeAPI_V3.getVoiceActorDetails(actorId)).then((res: any) => { 
        // [FIX] Handle { results: { data: [...] } } structure
        const item = res?.results?.data?.[0] || res?.data?.[0] || res;
        setData(item); 
        setLoading(false); 
    }).catch(() => setLoading(false));
  }, [isOpen, actorId]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-[40px] z-[60] [&>button]:hidden">
        <DialogTitle className="sr-only">Actor Details</DialogTitle>
        <div className="w-full h-full relative backdrop-blur-2xl bg-[#050505]/60 border border-white/10 rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-transparent to-red-600/5 pointer-events-none" />
           <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-90"><X size={18} /></button>
           {loading ? <div className="w-full h-full flex items-center justify-center"><FantasyLoader text="IDENTIFYING..." /></div> : data ? (
             <>
               <div className="w-full md:w-[40%] h-[40%] md:h-full relative overflow-hidden group">
                  <img src={data.profile || '/images/non-non.png'} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt={data.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                  <div className="absolute bottom-6 left-6 z-10"><h2 className="text-3xl md:text-4xl font-black text-white font-[Cinzel] leading-none tracking-tighter drop-shadow-lg">{data.name}</h2><p className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{data.japaneseName}</p></div>
               </div>
               <div className="w-full md:w-[60%] h-[60%] md:h-full relative z-10 flex flex-col">
                  <ScrollArea className="h-full p-8 custom-scrollbar">
                     <div className="space-y-8">
                        <div><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12}/> Profile</h3><div className="text-zinc-300 text-sm leading-relaxed font-medium opacity-90 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: data.about?.style || data.about?.description || "No Data" }} /></div>
                        {data.roles && (
                             <div><h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12}/> Roles</h3>
                                <div className="flex flex-wrap gap-3">{data.roles.map((role:any, i:number) => (
                                     <div key={i} className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-black/40 border border-white/5 hover:border-blue-500/50 transition-all active:scale-95 group/ani">
                                        <img src={role.anime.poster || '/images/no-poster.png'} className="w-6 h-6 rounded-full object-cover" />
                                        <div className="flex flex-col"><span className="text-[9px] font-bold text-zinc-400 group-hover/ani:text-white truncate max-w-[150px]">{role.character.name}</span><span className="text-[8px] text-zinc-600">{role.anime.title}</span></div>
                                     </div>
                                   ))}</div>
                             </div>
                         )}
                     </div>
                  </ScrollArea>
               </div>
             </>
           ) : <div className="w-full h-full flex items-center justify-center text-red-500 font-bold">DATA CORRUPTED</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
//  MAIN CONTENT
// ==========================================

function WatchContent() {
  const router = useRouter(); 
  const params = useParams(); 
  const searchParams = useSearchParams(); 
  const animeId = params.id as string; 
  const urlEpId = searchParams.get('ep'); 
  const { user } = useAuth(); 
  const { settings, updateSetting } = useWatchSettings();

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
  const [selectedServerName, setSelectedServerName] = useState<string>('hd-1');
  const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
  
  const [hideInterface, setHideInterface] = useState(false);
  const interfaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [epViewMode, setEpViewMode] = useState<'capsule' | 'list'>('capsule');
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [watchedEpNumbers, setWatchedEpNumbers] = useState<number[]>([]);

  const [resumeTime, setResumeTime] = useState(0);
  const [isResumeLoaded, setIsResumeLoaded] = useState(false);
  const progressRef = useRef(0);
  const playerRef = useRef<AnimePlayerRef>(null);
  const authTokenRef = useRef<string | null>(null);

  // [HOOK] Drag & Wheel Refs for Horizontal Sections
  const seasonsRef = useDraggable();
  const relatedRef = useDraggable();
  const recommendationsRef = useDraggable();

  useEffect(() => { if(supabase) supabase.auth.getSession().then(({ data }) => { if(data.session) authTokenRef.current = data.session.access_token; }); }, []);

  // [FEATURE] Nav Visibility on Scroll
  useEffect(() => {
    const handleScroll = () => {
        setHideInterface(false);
        if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current);
        interfaceTimeoutRef.current = setTimeout(() => setHideInterface(true), 15000); 
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. INITIAL LOAD
  useEffect(() => {
    const init = async () => {
        setIsLoadingInfo(true);
        try {
            const v2Data: any = await retryOperation(() => AnimeAPI_V2.getAnimeInfo(animeId));
            
            const universalData = await AnimeService.getAnimeInfo(animeId);
            if (!universalData) throw new Error("Anime not found");

            if (v2Data) {
                if (v2Data.relatedAnimes?.length) universalData.related = v2Data.relatedAnimes.map((r:any) => ({ id: r.id, title: r.name, poster: r.poster, type: r.type, episodes: r.episodes.sub }));
                if (v2Data.recommendedAnimes?.length) universalData.recommendations = v2Data.recommendedAnimes.map((r:any) => ({ id: r.id, title: r.name, poster: r.poster, type: r.type, episodes: r.episodes.sub }));
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

  // 2. USER SYNC
  useEffect(() => {
      if (!anime) return;

      const syncUser = async () => {
          let targetEpId = urlEpId || (anime.episodes.length > 0 ? anime.episodes[0].id : null);
          
          if (user) {
              const { data: dbProgress } = await (supabase.from('user_continue_watching') as any).select('episode_id').eq('user_id', user.id).eq('anime_id', animeId).order('last_updated', {ascending:false}).limit(1).maybeSingle();
              if (dbProgress && !urlEpId) targetEpId = dbProgress.episode_id;
              
              const { data: history } = await (supabase.from('user_watched_history') as any).select('episode_number').eq('user_id', user.id).eq('anime_id', animeId);
              if (history) setWatchedEpNumbers(history.map((h:any) => h.episode_number));
          } else {
               const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
               if (localData[animeId] && !urlEpId) targetEpId = localData[animeId].episodeId;
          }
          
          if (targetEpId && targetEpId !== currentEpId) {
              setCurrentEpId(targetEpId);
              try { const svs = await AnimeAPI_V2.getEpisodeServers(targetEpId); setServers(svs); } catch {} 
          }
      };
      syncUser();
  }, [anime, user?.id, urlEpId]);

  // 3. CHARACTERS - [FIX] Fetch V3 directly for pagination
  useEffect(() => {
      const fetchChars = async () => {
          setIsLoadingChars(true);
          try {
              // Directly calling V3 to get total pages support
              const res: any = await retryOperation(() => AnimeAPI_V3.getAnimeCharacters(animeId, charPage));
              
              const results = res?.results || res;
              const list = results?.data || [];
              const pages = results?.totalPages || 1;

              if (Array.isArray(list) && list.length > 0) {
                  // Normalize locally since we are bypassing service for pagination data
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
    if (!currentEpId) return;
    const loadStream = async () => {
        setIsStreamLoading(true);
        setStreamError(null);
        setStreamUrl(null);
        
        let time = 0;
        if (user) { 
            const { data } = await (supabase.from('user_continue_watching') as any).select('progress').eq('user_id', user.id).eq('episode_id', currentEpId).maybeSingle(); 
            if (data) time = data.progress; 
        } else { 
            const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}'); 
            if (localData[animeId] && localData[animeId].episodeId === currentEpId) time = localData[animeId].progress; 
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
  }, [currentEpId, user?.id, settings.server, settings.category, animeId]);

  // 5. PROGRESS SAVING
  const saveProgress = useCallback(async () => {
      if (!currentEpId || !anime) return;
      const progress = Math.floor(progressRef.current);
      if (progress < 5) return;
      const ep = anime.episodes.find(e => e.id === currentEpId);
      if (!ep) return;
      
      if (user) {
          await (supabase.from('user_continue_watching') as any).upsert({ 
              user_id: user.id, anime_id: animeId, episode_id: currentEpId, episode_number: ep.number, progress, last_updated: new Date().toISOString() 
          });
          
          const duration = playerRef.current?.getDuration() || 1400;
          if (progress > duration * 0.85) {
              await (supabase.from('user_watched_history') as any).upsert(
                  { user_id: user.id, anime_id: animeId, episode_number: ep.number }, 
                  { onConflict: 'user_id, anime_id, episode_number'}
              );
              if (!watchedEpNumbers.includes(ep.number)) setWatchedEpNumbers(prev => [...prev, ep.number]);
          }
      } else {
          const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
          localData[animeId] = { animeId, episodeId: currentEpId, episodeNumber: ep.number, progress, lastUpdated: Date.now() };
          localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));
      }
  }, [anime, currentEpId, user, watchedEpNumbers, animeId]);

  useEffect(() => { const i = setInterval(saveProgress, 10000); return () => clearInterval(i); }, [saveProgress]);

  const handlePlayerInteraction = () => { setHideInterface(false); if(interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current); interfaceTimeoutRef.current = setTimeout(() => setHideInterface(true), 15000); };
  const handlePlayerClick = () => { if (!hideInterface) { setHideInterface(true); if (interfaceTimeoutRef.current) clearTimeout(interfaceTimeoutRef.current); } else { handlePlayerInteraction(); } };
  const handleEpisodeClick = (id: string) => { saveProgress(); setCurrentEpId(id); router.replace(`/watch/${animeId}?ep=${id}`, { scroll: false }); };

  const episodeChunks = useMemo(() => { if(!anime) return []; const chunks = []; for(let i=0; i<anime.episodes.length; i+=50) chunks.push(anime.episodes.slice(i, i+50)); return chunks; }, [anime]);
  const currentEpIndex = anime?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEpisode = anime?.episodes[currentEpIndex];
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < (anime?.episodes.length || 0) - 1 ? anime?.episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? anime?.episodes[currentEpIndex - 1] : null;

  if (isLoadingInfo || !anime) return <FantasyLoader text="MATERIALIZING..." />;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 pt-24 relative font-sans overflow-x-hidden">
      <style jsx global>{`
         .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; display: block; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; opacity: 0.8; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
         ${hideInterface ? `nav, header, footer, .bottom-navigation, div[class*="navbar"], div[class*="header"], div[class*="footer"], .fixed.top-0, .fixed.bottom-0 { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.5s ease-in-out; }` : ''}
         body { overflow-y: auto; } ::-webkit-scrollbar { width: 0px; display: none; } 
      `}</style>
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-700 pointer-events-none", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      {/* PLAYER */}
      <div className="w-full relative z-40 flex justify-center bg-[#050505]"><div className="w-full max-w-[1400px] px-4 md:px-8 mt-6"><div className="w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative shadow-red-900/10" onClick={handlePlayerClick} onMouseMove={handlePlayerInteraction}>{(isStreamLoading || !isResumeLoaded) ? <FantasyLoader text="CHANNELING..." /> : streamUrl ? <AnimePlayer key={`${currentEpId}-${streamUrl}`} ref={playerRef} url={streamUrl} subtitles={subtitles} intro={intro} outro={outro} title={currentEpisode?.title || anime.title} startTime={resumeTime} autoPlay={settings.autoPlay} autoSkip={settings.autoSkip} initialVolume={settings.volume} onProgress={(s:any) => progressRef.current = s.playedSeconds} onEnded={() => { saveProgress(); if(settings.autoNext && nextEpisode) handleEpisodeClick(nextEpisode.id); }} onInteract={handlePlayerInteraction} /> : <div className="w-full h-full flex items-center justify-center"><Tv size={48} className="text-zinc-900 opacity-50"/></div>}</div></div></div>

      {/* CONTROLS */}
      <div className={cn("w-full flex justify-center bg-[#0a0a0a] border-b border-white/5 relative z-40 shadow-red-900/10 shadow-lg transition-all duration-500", hideInterface ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}>
        <div className="w-full max-w-[1400px] px-4 md:px-8 py-3 flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex-1 min-w-0 flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                <MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} />
                <div className="hidden sm:block"><NextEpisodeTimer schedule={nextEpSchedule} status={anime.info.status} /></div>
                <WatchListButton animeId={anime.id} animeTitle={anime.title} animeImage={anime.poster} currentEp={currentEpisode?.number} />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide no-scrollbar">
                <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.id)} className={cn("flex items-center gap-2 px-4 h-8 rounded-full border text-[11px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40 whitespace-nowrap", prevEpisode ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-red-900/10" : "opacity-10 border-white/5 text-zinc-600")}><SkipBack size={12}/> PREV</button>
                <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><FastForward size={12} className={cn("transition-colors", settings.autoSkip ? "text-red-600 shadow-[0_0_10px_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP</span></button>
                <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><Play size={12} className={cn("transition-colors", settings.autoPlay ? "text-red-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span></button>
                <button onClick={() => updateSetting('autoNext', !settings.autoNext)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><SkipForward size={12} className={cn("transition-colors", settings.autoNext ? "text-red-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoNext ? "text-white" : "text-zinc-500")}>NEXT</span></button>
                <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 transition-all hover:scale-110 active:rotate-12 shadow-red-900/10 flex-shrink-0", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={16} /></Button>
                <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner flex-shrink-0">{(['sub', 'dub', 'raw'] as const).map((cat) => { const isAvailable = (servers?.[cat]?.length || 0) > 0; return (<button key={cat} disabled={!isAvailable} onClick={() => updateSetting('category', cat)} className={cn("px-3 py-0.5 rounded-full text-[10px] font-black uppercase transition-all relative active:scale-75 shadow-sm", settings.category === cat ? "bg-red-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300", !isAvailable && "opacity-10")}>{cat}{isAvailable && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]" />}</button>);})}</div>
                <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase transition-all hover:scale-105 active:scale-90 shadow-md shadow-red-900/5 whitespace-nowrap"><ServerIcon size={12}/> Portal <ChevronDown size={12}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[40] min-w-[140px] w-auto h-auto max-h-[200px] p-2"><ScrollArea className="h-auto max-h-[180px] custom-scrollbar"><div className="flex flex-col gap-1">{servers?.[settings.category]?.map((srv: any, idx: number) => (<DropdownMenuItem key={srv.serverId} onClick={() => updateSetting('server', srv.serverName)} className={cn("cursor-pointer focus:bg-red-600 focus:text-white px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-1 transition-all", selectedServerName === srv.serverName ? "bg-red-600 text-white shadow-lg" : "text-zinc-400 hover:text-white hover:bg-white/5")}>Portal {idx + 1}</DropdownMenuItem>))}</div></ScrollArea></DropdownMenuContent></DropdownMenu>
                {nextEpisode ? (<button onClick={() => handleEpisodeClick(nextEpisode.id)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[11px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-md whitespace-nowrap group">NEXT <SkipForward size={12} className="group-hover:translate-x-1 transition-transform" /></button>) : (<button disabled className="flex items-center gap-2 bg-white/5 border border-white/5 text-zinc-600 rounded-full px-5 h-8 text-[11px] font-black uppercase tracking-widest cursor-not-allowed opacity-50 shadow-inner whitespace-nowrap">NEXT <SkipForward size={12} /></button>)}
            </div>
        </div>
      </div>

      <div className="w-full flex justify-center mt-8 px-4 md:px-8"><div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* EPISODES */}
            <div className="xl:col-span-4 h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl shadow-red-900/20 order-2 xl:order-1"><div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center"><h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-[Cinzel]"><Layers size={16}/> Episodes</h3></div><div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 h-10 overflow-hidden px-4"><ScrollArea className="w-full h-full whitespace-nowrap custom-scrollbar"><div className="flex items-center py-2 gap-2 w-max">{episodeChunks[epChunkIndex]?.map((_, idx) => (<button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("px-4 py-1 text-[10px] font-black rounded-full transition-all active:scale-90 shadow-sm", epChunkIndex === idx ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-500')}>{(idx * 50) + 1}-{Math.min((idx + 1) * 50, anime.episodes.length)}</button>))}</div></ScrollArea></div><ScrollArea className="flex-1 p-5 shadow-inner custom-scrollbar"><div className={cn(epViewMode === 'capsule' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1.5')}>{episodeChunks[epChunkIndex]?.map((ep) => (<button key={ep.id} onClick={() => handleEpisodeClick(ep.id)} className={cn("h-9 w-12 rounded-full flex items-center justify-center border transition-all text-[11px] font-black relative overflow-hidden", ep.id===currentEpId ? "bg-red-600 text-white border-red-500 scale-110 z-10" : watchedEpNumbers.includes(ep.number) ? "bg-zinc-800 text-zinc-500 border-zinc-800 opacity-60" : "bg-zinc-900 border-zinc-800 text-zinc-600")}>{ep.number}</button>))}</div></ScrollArea></div>
            
            {/* ANIME INFO SECTION - ORIGINAL UI RESTORED */}
            <div className="xl:col-span-8 h-auto xl:h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20 order-1 xl:order-2">
                <div className="flex-shrink-0 relative p-8 pt-16 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-red-600/5 to-transparent">
                   <div className="relative shrink-0 mx-auto sm:mx-0 flex flex-col gap-6 w-full sm:w-auto">
                      <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] mx-auto sm:mx-0 w-fit">
                         <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#dc2626_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" />
                         <img src={anime.poster} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl shadow-black" alt={anime.title} />
                      </div>
                      <div className="flex justify-center w-full"><TrailerSection videos={anime.trailers} /></div>
                   </div>

                   <div className="flex-1 pt-2 text-center sm:text-left z-10 flex flex-col h-full">
                      <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] leading-none mb-2 tracking-tighter drop-shadow-2xl shadow-black">{anime.title}</h1>
                      {anime.jname && <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-6 opacity-60 drop-shadow-sm">{anime.jname}</p>}
                      
                      <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start items-center">
                         <Badge className="bg-red-600 text-white rounded-full px-5 py-1.5 text-[10px] font-black uppercase shadow-lg shadow-red-900/50">{anime.stats.rating}</Badge>
                         <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20">
                             <span className={cn(anime.info.status.includes('Airing') ? 'text-green-500 animate-pulse' : 'text-zinc-500')}>{anime.info.status}</span>
                             <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                             <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-600 shadow-red-900/20"/> {anime.stats.duration}</div>
                             <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                             <div className="flex items-center gap-1.5 text-yellow-500 uppercase font-black drop-shadow-sm">MAL: {anime.stats.malScore}</div>
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-6 justify-center sm:justify-start">
                         {anime.info.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-red-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-red-900/20 shadow-red-900/10">{g}</Link>))}
                      </div>
                      
                      <div className="mt-auto pt-6 w-full flex justify-center sm:justify-end"><StarRating animeId={animeId} initialRating={anime.stats.rating} /></div>
                   </div>
                </div>

                <div className="flex-1 min-h-0 relative px-10 mt-4 overflow-hidden flex flex-col">
                   <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2 shadow-sm shrink-0"><Info size={12} className="shadow-sm"/> Synopsis</h4>
                   <ScrollArea className="flex-1 pr-4 custom-scrollbar shadow-inner shadow-red-900/5">
                      <p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased font-medium opacity-90 drop-shadow-sm shadow-black" dangerouslySetInnerHTML={{ __html: anime.description }} />
                   </ScrollArea>
                </div>

                {/* Footer Metadata */}
                <div className="flex-shrink-0 p-6 border-t border-white/5 bg-[#0a0a0a] shadow-inner shadow-red-900/5">
                    <div className="flex w-full items-center gap-3">
                        <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 shrink-0 whitespace-nowrap group hover:border-red-500/30 transition-all shadow-inner shadow-black/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Aired</span>
                            <span className="text-[10px] font-bold text-zinc-300">{anime.info.aired}</span>
                        </div>
                        <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 shrink-0 whitespace-nowrap group hover:border-red-500/30 transition-all shadow-inner shadow-black/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Premiered</span>
                            <span className="text-[10px] font-bold text-zinc-300">{anime.info.premiered}</span>
                        </div>
                        
                        {anime.info.studios?.length > 0 && (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 flex-1 min-w-0 cursor-pointer group hover:border-red-600/50 hover:bg-white/10 transition-all active:scale-95 shadow-inner shadow-black/20 justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 shrink-0">Studio</span>
                                            <span className="text-[10px] font-bold text-zinc-300 truncate">{anime.info.studios[0]}</span>
                                        </div>
                                        <ChevronDown size={12} className="text-zinc-500 group-hover:text-white shrink-0"/>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-[#050505] border border-white/10 text-zinc-300 font-bold uppercase text-[9px] w-auto min-w-[160px] h-auto max-h-[200px] rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] p-2 z-[40]">
                                    <ScrollArea className="h-auto max-h-[180px] pr-2 custom-scrollbar">
                                        <div className="flex flex-col gap-1">
                                            {anime.info.studios.map((s: string) => (
                                                <DropdownMenuItem key={s} asChild>
                                                    <Link href={`/view/studios/${s}`} className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-white focus:bg-red-600 focus:text-white transition-all">
                                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]" />{s}
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        
                        {anime.info.producers?.length > 0 && (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 flex-1 min-w-0 cursor-pointer group hover:border-red-500/30 transition-all active:scale-95 shadow-inner shadow-black/20 justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 shrink-0">Producer</span>
                                            <span className="text-[10px] font-bold text-zinc-300 truncate">{anime.info.producers[0]}</span>
                                        </div>
                                        <ChevronDown size={12} className="text-zinc-500 group-hover:text-white shrink-0"/>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-[#050505] border border-white/10 text-zinc-300 font-bold uppercase text-[9px] w-auto min-w-[160px] h-auto max-h-[200px] rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] p-2 z-[40]">
                                    <ScrollArea className="h-auto max-h-[180px] pr-2 custom-scrollbar">
                                        <div className="flex flex-col gap-1">
                                            {anime.info.producers.map((p: string) => (
                                                <DropdownMenuItem key={p} asChild>
                                                    <Link href={`/view/producers/${p}`} className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-white focus:bg-red-600 focus:text-white transition-all">
                                                        <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-red-500" />{p}
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>
      </div></div>

      {/* SEASONS & RELATED */}
      {anime.seasons && anime.seasons.length > 0 && (<div className="flex items-center justify-center mt-12 px-4 md:px-8"><div className="w-full max-w-[1400px]"><div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/seasons shadow-red-900/20 shadow-md"><div className="absolute top-0 left-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/seasons:bg-red-600/10 transition-all duration-1000" /><div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Seasons</h4></div><ScrollArea className="w-full whitespace-nowrap pb-6 custom-scrollbar"><div className="flex gap-6 w-max" ref={seasonsRef} onWheel={(e:any) => e.stopPropagation()}>{anime.seasons.map((season: any) => season?.id ? (<Link key={season.id} href={`/watch/${season.id}`} className={cn("group/item flex items-center gap-5 p-2 pr-10 rounded-full border hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[280px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md", season.isCurrent ? "bg-red-600/10 border-red-600" : "bg-white/5 border-white/5")}><div className="relative shrink-0 overflow-hidden rounded-full w-14 h-14 border-2 border-white/5 group-hover/item:border-red-600 shadow-md shadow-black/50"><img src={season.poster || '/images/no-poster.png'} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125" alt={season.title} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[11px] font-black text-zinc-300 group-hover:text-white truncate w-[160px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{season.title}</span><span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">{season.isCurrent ? 'NOW PLAYING' : 'VIEW ARCHIVE'}</span></div></Link>) : null)}</div></ScrollArea></div></div></div>)}

      {anime.related && anime.related.length > 0 && (<div className="flex items-center justify-center mt-12 px-4 md:px-8"><div className="w-full max-w-[1400px]"><div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/related shadow-red-900/20 shadow-md"><div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/related:bg-red-600/10 transition-all duration-1000" /><div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Related Domains</h4></div><ScrollArea className="w-full whitespace-nowrap pb-6 custom-scrollbar"><div className="flex gap-6 w-max" ref={relatedRef} onWheel={(e:any) => e.stopPropagation()}>{anime.related.map((rel: any, idx: number) => rel?.id ? (<Link key={`${rel.id}-${idx}`} href={`/watch/${rel.id}`} className="group/item flex items-center gap-5 p-2 pr-10 rounded-full bg-white/5 border border-white/5 hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[320px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md"><div className="relative shrink-0 overflow-hidden rounded-full w-16 h-16 border-2 border-white/5 group-hover/item:border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-500 shadow-black/50 shadow-md"><img src={rel.poster || rel.image || '/images/no-poster.png'} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125 shadow-md shadow-red-900/5" alt={rel.name} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[13px] font-black text-zinc-300 group-hover:text-white truncate w-[180px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{rel.name || rel.title}</span><div className="flex items-center gap-3"><Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-600 rounded-md group-hover/item:border-red-500/50 group-hover/item:text-red-500 uppercase tracking-widest shadow-sm">{rel.type}</Badge><span className="text-[9px] text-zinc-700 font-black uppercase group-hover/item:text-zinc-400 shadow-sm">{rel.episodes?.sub || '?'} EPS</span></div></div></Link>) : null)}</div><ScrollBar orientation="horizontal" className="hidden" /></ScrollArea></div></div></div>)}

      <div className="w-full flex justify-center my-12 px-4 md:px-8"><div className="w-full max-w-[1400px]" onKeyDown={(e) => e.stopPropagation()}><ShadowComments key={user?.id || 'guest'} episodeId={currentEpId || "general"} /></div></div>
   
      {/* RECOMMENDED & CHARACTERS */}
      <div className="w-full flex justify-center mt-12 px-4 md:px-8 pb-12"><div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* RECOMMENDED */}
            <div className="xl:col-span-4 h-[750px] flex flex-col bg-[#0a0a0a] rounded-[50px] border border-white/5 shadow-2xl overflow-hidden relative group/paths shadow-red-900/20 shadow-md"><div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 relative z-10 shadow-red-900/5 shadow-md"><Heart size={20} className="text-red-600 fill-red-600 animate-pulse shadow-red-600/30 shadow-md" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Recommended</h3></div><div className="flex-1 overflow-hidden p-6 relative z-10 shadow-inner shadow-red-900/5"><ScrollArea className="h-full pr-4 custom-scrollbar"><div className="space-y-4" ref={recommendationsRef} onWheel={(e:any) => e.stopPropagation()}>{anime.recommendations?.length > 0 && anime.recommendations.map((rec: any, idx: number) => rec?.id ? (<Link key={`${rec.id}-${idx}`} href={`/watch/${rec.id}`} className="flex gap-5 p-4 rounded-[32px] hover:bg-red-600/5 group transition-all duration-500 active:scale-95 border border-transparent hover:border-red-600/20 shadow-inner shadow-red-900/5"><img src={rec.poster || rec.image || '/images/no-poster.png'} className="w-16 h-24 object-cover rounded-2xl shadow-3xl group-hover:rotate-1 transition-all duration-500 shadow-black shadow-md" alt={rec.name} /><div className="flex-1 py-1 flex flex-col justify-center"><h4 className="text-[12px] font-black text-zinc-500 group-hover:text-red-500 line-clamp-2 transition-all uppercase tracking-tight leading-tight mb-2 shadow-black drop-shadow-md">{rec.name || rec.title}</h4><div className="flex items-center gap-3"><span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] group-hover:text-zinc-500 transition-colors shadow-sm">{rec.type}</span><span className="w-1 h-1 bg-zinc-900 rounded-full shadow-sm"/><span className="text-[9px] text-zinc-800 font-black uppercase group-hover:text-red-900 transition-colors shadow-sm">{rec.episodes?.sub || '?'} EPS</span></div></div></Link>) : null)}</div></ScrollArea></div></div>
            
            {/* CHARACTERS PAGINATION SECTION - FIXED FLAT MAP */}
            <div className="xl:col-span-8 h-[750px] bg-[#0a0a0a] rounded-[50px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20 shadow-md">
                <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between shadow-red-900/5 shadow-md">
                    <div className="flex items-center gap-4"><User size={20} className="text-red-600 shadow-red-600/30" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase">Manifested Bloodlines</h3></div>
                </div>
                <div className="flex-1 p-10 overflow-hidden relative">
                    {isLoadingChars ? <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><FantasyLoader text="LOADING DATA..." /></div> : 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 h-full overflow-y-auto custom-scrollbar pb-16">
                        {charactersList.length > 0 ? charactersList.map((char: any, i: number) => (
                            <div key={i} className={cn("flex bg-white/5 border rounded-[30px] p-4 transition-all duration-500 group shadow-lg cursor-default", char.role === 'Main' ? "border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.25)] bg-red-600/5" : "border-white/5 hover:border-white/10 hover:shadow-red-900/10")}>
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedCharacter(char.id)}>
                                    <img src={char.poster || '/images/non-non.png'} className={cn("w-14 h-14 rounded-full object-cover border transition-colors shadow-lg", char.role === 'Main' ? "border-red-500 shadow-red-900/60" : "border-white/10 group-hover:border-red-500/50")} />
                                    <div className="flex flex-col"><span className={cn("text-[11px] font-black uppercase tracking-tighter line-clamp-1", char.role === 'Main' ? "text-red-400 text-shadow-sm" : "text-zinc-200")}>{char.name}</span><Badge variant="outline" className={cn("w-fit mt-1 text-[8px] font-bold px-2 py-0 h-4 rounded-full transition-colors", char.role === 'Main' ? "border-red-600 text-red-500 bg-red-600/10" : "border-zinc-800 text-zinc-500 group-hover:text-red-500 group-hover:border-red-500/30")}>{char.role}</Badge></div>
                                </div>
                                <div className="w-px bg-white/10 mx-2" />
                                <div className="flex items-center gap-4 flex-1 justify-end text-right cursor-pointer" onClick={() => char.voiceActor?.id && setSelectedActor(char.voiceActor.id)}>
                                    <div className="flex flex-col items-end">{char.voiceActor ? (<><span className="text-[11px] font-bold text-zinc-400 uppercase line-clamp-1 hover:text-white transition-colors">{char.voiceActor.name}</span><span className="text-[8px] font-bold text-zinc-600 uppercase">{char.voiceActor.language}</span></>) : <span className="text-[9px] text-zinc-600">Unknown</span>}</div>
                                    {char.voiceActor && <img src={char.voiceActor.poster || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/5 grayscale group-hover:grayscale-0 transition-all" />}
                                </div>
                            </div>
                        )) : <div className="col-span-full flex justify-center items-center opacity-50"><p className="text-[10px] font-black uppercase">No Bloodlines</p></div>}
                    </div>}
                    {/* PAGINATION CONTROLS */}
                    <div className="absolute bottom-4 left-0 w-full flex justify-between items-center px-10 pointer-events-none">
                        <button disabled={charPage <= 1} onClick={() => setCharPage(p => Math.max(1, p - 1))} className="pointer-events-auto p-3 rounded-full bg-white/5 text-zinc-300 hover:text-red-600 hover:bg-white/10 transition-all hover:scale-110 active:scale-90 shadow-lg disabled:opacity-0"><ChevronLeft size={20} /></button>
                        <div className="pointer-events-auto px-6 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest shadow-xl">{charPage} / {totalCharPages}</div>
                        <button disabled={charPage >= totalCharPages} onClick={() => setCharPage(p => p + 1)} className="pointer-events-auto p-3 rounded-full bg-white/5 text-zinc-300 hover:text-red-600 hover:bg-white/10 transition-all hover:scale-110 active:scale-90 shadow-lg disabled:opacity-0"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>
      </div></div>

      {/* POPUPS */}
      <CharacterDetailsDialog isOpen={!!selectedCharacter} onClose={() => setSelectedCharacter(null)} characterId={selectedCharacter} />
      <VoiceActorDetailsDialog isOpen={!!selectedActor} onClose={() => setSelectedActor(null)} actorId={selectedActor} />

      <div className="w-full h-20 border-t border-white/5 mt-20 flex items-center justify-center text-zinc-600 text-xs font-black uppercase tracking-widest"><div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-800 rounded-full" /> Shadow Garden 2025</div></div>
    </div>
  );
}

export default function WatchPage() { return <Suspense fallback={<FantasyLoader />}><WatchContent /></Suspense>; }