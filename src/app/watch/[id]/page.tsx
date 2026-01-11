"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Clock, AlertCircle, Tv, Play, 
  Grid, List, Timer, Lightbulb, 
  ChevronDown, Heart, Eye, CheckCircle, XCircle,
  FastForward, Star, Info, MessageSquare, User,
  Loader2 
} from 'lucide-react';

// --- API & LIBS ---
import { AnimeAPI_V2, supabase } from '@/lib/api'; 
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; 

// --- COMPONENTS ---
import AnimePlayer from '@/components/Player/AnimePlayer'; 
import WatchListButton from '@/components/Watch/WatchListButton'; // <--- USING YOUR BUTTON HERE
import ShadowComments from '@/components/Comments/ShadowComments'; 
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

// --- TYPES ---
interface V2EpisodeSchedule { 
    airingISOTimestamp: string | null;
    airingTimestamp: number | null; 
    secondsUntilAiring: number | null;
}

// ==========================================
//  HOOKS
// ==========================================

const useWatchSettings = () => {
  const [settings, setSettings] = useState({
    autoPlay: true,
    autoSkip: true,
    dimMode: false,
    server: 'hd-1',
    category: 'sub' as 'sub' | 'dub' | 'raw',
  });

  useEffect(() => {
    const saved = localStorage.getItem('shadow_watch_settings');
    if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
  }, []);

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('shadow_watch_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };
  return { settings, updateSetting };
};

// ==========================================
//  SUB-COMPONENTS
// ==========================================

const ChibiCry = ({ text = "UNKNOWN" }: { text?: string }) => (
    <div className="flex items-center gap-1 opacity-70 animate-pulse">
        <span className="text-xs text-red-500 font-black uppercase tracking-tighter">{text}</span>
    </div>
);

const NextEpisodeTimer = ({ schedule, status }: { schedule: V2EpisodeSchedule | null, status: string }) => {
  const [displayText, setDisplayText] = useState<React.ReactNode>("...");

  useEffect(() => {
    if (status?.toLowerCase().includes("finished")) {
        setDisplayText(<ChibiCry text="ENDED" />);
        return;
    }
    if (!schedule || !schedule.airingISOTimestamp) {
        setDisplayText(<ChibiCry text="UNKNOWN" />); 
        return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(schedule.airingISOTimestamp!).getTime();
      const diff = target - now;
      
      if (diff <= 0) { setDisplayText("Aired"); return; }
      
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setDisplayText(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); 
    return () => clearInterval(interval);
  }, [schedule, status]);

  return (
    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/5 text-zinc-300 px-3 h-8 rounded-full border border-white/5 justify-center min-w-fit max-w-full shadow-red-900/5">
      <Timer className="w-3 h-3 text-red-500 shrink-0" />
      <span className="truncate whitespace-nowrap">{displayText}</span>
    </div>
  );
};

// --- REAL STAR RATING CONNECTED TO DB ---
interface StarRatingProps { animeId: string; initialRating?: string | number; }
const StarRating = ({ animeId, initialRating = 0 }: StarRatingProps) => {
    const numericInitial = typeof initialRating === 'string' ? parseFloat(initialRating) : initialRating;
    const [rating, setRating] = useState(numericInitial || 0);
    const [hover, setHover] = useState(0);
    
    // Get Auth Context to check if Guest
    const { user, profile } = useAuth();

    const handleRate = async (score: number) => {
        // GUEST CHECK
        if (!user || profile?.is_guest) {
            toast.error("Shadow Agents only. Please login to rate.");
            return;
        }

        setRating(score);
        if (supabase) {
            try {
                await supabase.from('anime_ratings').upsert({ 
                    user_id: user.id, 
                    anime_id: animeId, 
                    rating: score 
                }, { onConflict: 'user_id, anime_id' });
                toast.success(`Rated ${score} stars!`);
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
                console.error(err);
            }
        }
    };

    return (
        <div className="flex flex-col gap-1 items-end">
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest text-right">Rate This</span>
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => handleRate(star)} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                        <Star size={14} className={cn("transition-all duration-300", star <= (hover || rating) ? "fill-red-600 text-red-600 shadow-red-500/50" : "text-zinc-700")} />
                    </button>
                ))}
                <span className="text-[10px] text-zinc-300 ml-1.5 font-black">{Number(rating || 0).toFixed(1)}</span>
            </div>
        </div>
    );
};

const TrailerSection = ({ videos, animeName }: { videos: any[], animeName: string }) => {
    const [activeVideo, setActiveVideo] = useState(videos?.[0]?.source);
    if (!videos || videos.length === 0) return null;
    const getYoutubeId = (url: string) => url?.split('v=')[1]?.split('&')[0] || url?.split('/').pop();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="inline-flex items-center gap-3 bg-red-600/10 border border-red-500/20 rounded-full px-8 py-2.5 cursor-pointer hover:bg-red-600 hover:border-red-500 transition-all group active:scale-95 shadow-lg shadow-red-900/10 w-full justify-center">
                    <span className="flex items-center justify-center w-5 h-5 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform"><Play size={8} fill="currentColor" /></span>
                    <span className="text-[10px] font-black text-red-100 group-hover:text-white uppercase tracking-wider">Trailers ({videos.length})</span>
                </div>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-red-500/40 max-w-4xl w-[95vw] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300">
                <div className="sr-only"><DialogTitle>{animeName} Trailers</DialogTitle><DialogDescription>Promotional clips</DialogDescription></div>
                <div className="flex flex-col h-full">
                    <div className="aspect-video w-full bg-zinc-900"><iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /></div>
                    <div className="p-6 bg-[#0a0a0a]">
                        <ScrollArea className="w-full whitespace-nowrap pb-4">
                            <div className="flex gap-4 px-2">
                                {videos.map((v: any, i: number) => (
                                    <button key={i} onClick={() => setActiveVideo(v.source)} className={cn("flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-36 hover:scale-105 active:scale-95 group/pv", activeVideo === v.source ? "bg-red-600/10 border-red-600" : "bg-white/5 border-transparent hover:border-white/10")}>
                                        <div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative shadow-lg"><img src={v.thumbnail} className="w-full h-full object-cover opacity-60" alt="" /><div className="absolute inset-0 flex items-center justify-center bg-red-600/20 opacity-0 group-hover/pv:opacity-100 transition-opacity"><Play size={16} fill="white" className="text-white" /></div></div>
                                        <span className="text-[9px] font-black text-center truncate w-full uppercase text-zinc-400 group-hover/pv:text-white">{v.title || `Promo ${i+1}`}</span>
                                    </button>))}
                            </div>
                            <ScrollBar orientation="horizontal" className="h-1 bg-white/5" />
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const FantasyLoader = ({ text = "SUMMONING..." }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#050505]">
    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-red-500/20" />
    <h2 className="text-xl font-[Cinzel] text-red-500 animate-pulse tracking-[0.3em]">{text}</h2>
  </div>
);

const MarqueeTitle = ({ text }: { text: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    useEffect(() => { if (containerRef.current && textRef.current) setIsOverflowing(textRef.current.offsetWidth > containerRef.current.offsetWidth); }, [text]);
    return (
        <div className="flex items-center bg-white/5 rounded-full px-4 h-8 border border-white/5 w-full sm:w-[280px] overflow-hidden relative transition-all hover:border-red-500/20 active:scale-95 group shadow-inner shadow-red-900/5">
             <span className="text-[11px] text-red-500 font-black uppercase mr-2 flex-shrink-0 group-hover:animate-pulse">NOW:</span>
             <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center">
                <span ref={textRef} className={cn("text-[11px] font-black uppercase tracking-tighter text-zinc-300 whitespace-nowrap", isOverflowing ? 'animate-marquee-slow' : '')}>{text}</span>
             </div>
        </div>
    );
};

// ==========================================
//  MAIN PAGE CONTENT
// ==========================================

function WatchContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const animeId = params.id as string;
  const urlEpId = searchParams.get('ep');

  const { settings, updateSetting } = useWatchSettings();
  const [info, setInfo] = useState<any | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]); 
  const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [intro, setIntro] = useState<{start:number; end:number}>();
  const [outro, setOutro] = useState<{start:number; end:number}>();
  const [servers, setServers] = useState<any>(null);
  const [selectedServerName, setSelectedServerName] = useState<string>('hd-1');
  
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [epViewMode, setEpViewMode] = useState<'capsule' | 'list'>('capsule');

  // --- EFFECT 1: FETCH INFO (Fixed for AbortError) ---
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const init = async () => {
      setIsLoadingInfo(true);
      try {
        if (!animeId) throw new Error("No ID");
        
        const [v2InfoRaw, v2EpData, scheduleData] = await Promise.all([
             AnimeAPI_V2.getAnimeInfo(animeId),
             AnimeAPI_V2.getEpisodes(animeId),
             AnimeAPI_V2.getNextEpisodeSchedule(animeId)
        ]);

        if (controller.signal.aborted) return;
        if (!isMounted) return;

        const v2Data = v2InfoRaw as any; 
        const hybridInfo = {
            anime: {
                id: v2Data.anime.info.id,
                name: v2Data.anime.info.name,
                jname: v2Data.anime.moreInfo.japanese || v2Data.anime.info.jname,
                poster: v2Data.anime.info.poster,
                description: v2Data.anime.info.description,
                stats: {
                    rating: v2Data.anime.info.stats.rating,
                    malScore: v2Data.anime.moreInfo.malscore || '?',
                    quality: v2Data.anime.info.stats.quality,
                    type: v2Data.anime.info.stats.type,
                    duration: v2Data.anime.info.stats.duration
                },
                moreInfo: {
                    aired: v2Data.anime.moreInfo.aired,
                    premiered: v2Data.anime.moreInfo.premiered,
                    status: v2Data.anime.moreInfo.status,
                    genres: v2Data.anime.moreInfo.genres || [],
                    studios: typeof v2Data.anime.moreInfo.studios === 'string' ? [v2Data.anime.moreInfo.studios] : v2Data.anime.moreInfo.studios, 
                    producers: v2Data.anime.moreInfo.producers || [] 
                },
                trailers: v2Data.anime.info.promotionalVideos || [] 
            },
            recommendations: v2Data.recommendedAnimes || [],
            related: v2Data.relatedAnimes || [],
            characters: (v2Data.anime.info.charactersVoiceActors || v2Data.anime.info.characterVoiceActor || []).map((item: any) => ({
                name: item.character.name,
                image: item.character.poster,
                role: item.character.cast, 
                voiceActor: {
                    name: item.voiceActor.name,
                    image: item.voiceActor.poster,
                    language: item.voiceActor.cast
                }
            }))
        };
        setInfo(hybridInfo);
        setNextEpSchedule(scheduleData);
        setEpisodes(v2EpData?.episodes || []);
        const foundEp = urlEpId ? v2EpData?.episodes.find((e: any) => e.episodeId === urlEpId) : null;
        setCurrentEpId(foundEp ? foundEp.episodeId : (v2EpData?.episodes[0]?.episodeId || null));
      } catch (err: any) { 
        if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
        console.error("Init Error:", err); 
      } finally { 
        if (isMounted && !controller.signal.aborted) setIsLoadingInfo(false); 
      }
    };

    init();

    return () => { 
        isMounted = false; 
        controller.abort(); 
    };
  }, [animeId, urlEpId]);

  // --- EFFECT 2: LOAD STREAM (Fixed for AbortError) ---
  useEffect(() => {
    if (!currentEpId) return;
    const newUrl = `/watch/${animeId}?ep=${currentEpId}`;
    if (window.location.pathname + window.location.search !== newUrl) router.replace(newUrl, { scroll: false });
    
    setStreamUrl(null);
    setIsStreamLoading(true);
    setStreamError(null);
    
    let isMounted = true;
    const controller = new AbortController();

    const loadStream = async () => {
      try {
        const serverRes = await AnimeAPI_V2.getEpisodeServers(currentEpId);
        
        if (controller.signal.aborted) return;
        if (!isMounted || !serverRes) return;
        
        setServers(serverRes);
        let activeCat = settings.category;
        const sData = serverRes as any;
        if (!sData[activeCat]?.length) {
              activeCat = sData.sub?.length ? 'sub' : (sData.dub?.length ? 'dub' : 'raw');
              updateSetting('category', activeCat);
        }
        const list = sData[activeCat] || [];
        const targetServer = list.find((s:any) => s.serverName === settings.server) || list[0];
        if (!targetServer) throw new Error("Portal Shut");
        setSelectedServerName(targetServer.serverName);
        const sourceRes = await AnimeAPI_V2.getEpisodeSources(currentEpId, targetServer.serverName, activeCat);
        
        if (controller.signal.aborted) return;

        if (sourceRes?.sources?.length) {
            const src = sourceRes.sources.find((s: any) => s.type === 'hls') || sourceRes.sources[0];
            setStreamUrl(src.url);
            if(sourceRes.intro) setIntro(sourceRes.intro);
            if(sourceRes.outro) setOutro(sourceRes.outro);
        }
      } catch (error: any) { 
        if (error.name === 'AbortError' || error.message?.includes('aborted')) return;
        if (isMounted) setStreamError("Portal Unstable"); 
      } finally { 
        if (isMounted && !controller.signal.aborted) setIsStreamLoading(false); 
      }
    };

    loadStream();

    return () => { 
        isMounted = false; 
        controller.abort(); 
    };
  }, [currentEpId, animeId, router, settings.category, settings.server]); 

  const currentEpIndex = useMemo(() => episodes.findIndex(e => e.episodeId === currentEpId), [episodes, currentEpId]);
  const currentEpisode = episodes[currentEpIndex];
  const nextEpisode = currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;

  const episodeChunks = useMemo(() => {
    const size = 50; 
    const chunks = [];
    for (let i = 0; i < episodes.length; i += 50) chunks.push(episodes.slice(i, i + 50));
    return chunks;
  }, [episodes]);

  const handleEpisodeClick = (id: string) => { if (id === currentEpId) return; setCurrentEpId(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (isLoadingInfo) return <FantasyLoader text="MATERIALIZING..." />;
  if (!info) return <div className="p-20 text-center text-red-500 font-black uppercase">Connection Lost</div>;

  const { anime, recommendations, related, characters } = info;
  
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 relative font-sans overflow-x-hidden">
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-700 pointer-events-none", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      {/* PLAYER SECTION */}
      <div className="w-full relative z-40 flex justify-center bg-[#050505]">
        <div className="w-full max-w-[1400px] px-4 md:px-8 mt-6">
            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative shadow-red-900/10">
                {isStreamLoading ? <FantasyLoader text="CHANNELING..." /> : 
                 streamError ? <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4"><AlertCircle className="text-red-500 w-12 h-12 shadow-sm" /><span className="font-black text-[10px] uppercase tracking-[0.3em]">Portal Unstable</span><Button variant="outline" className="rounded-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => window.location.reload()}>Retry</Button></div> : 
                 streamUrl ? <AnimePlayer url={streamUrl} title={currentEpisode?.title || anime.name} intro={intro} outro={outro} autoSkip={settings.autoSkip} onEnded={() => { if(settings.autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.episodeId); }} onNext={nextEpisode ? () => handleEpisodeClick(nextEpisode.episodeId) : undefined} /> : 
                 <div className="w-full h-full flex items-center justify-center"><Tv size={48} className="text-zinc-900 opacity-50"/></div>}
            </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="w-full flex justify-center bg-[#0a0a0a] border-b border-white/5 relative z-40 shadow-red-900/10 shadow-lg">
        <div className="w-full max-w-[1400px] px-4 md:px-8 py-3 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex-1 min-w-0 flex items-center gap-4 w-full sm:w-auto">
             <MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} />
             <NextEpisodeTimer schedule={nextEpSchedule} status={anime.moreInfo.status} />
             
             {/* EXTERNAL WATCHLIST BUTTON */}
             <WatchListButton 
                animeId={anime.id} 
                animeTitle={anime.name} 
                animeImage={anime.poster} 
                currentEp={currentEpisode?.number} 
             />
          </div>
          <div className="flex items-center gap-3">
             <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.episodeId)} className={cn("flex items-center gap-2 px-4 h-8 rounded-full border text-[11px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40", prevEpisode ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-red-900/10" : "opacity-10 border-white/5 text-zinc-600")}><SkipBack size={12}/> PREV</button>
             <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5"><FastForward size={12} className={cn("transition-colors", settings.autoSkip ? "text-red-600 shadow-[0_0_10px_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP</span></button>
             <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5"><Play size={12} className={cn("transition-colors", settings.autoPlay ? "text-red-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span></button>
             <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 transition-all hover:scale-110 active:rotate-12 shadow-red-900/10", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={16} /></Button>
             <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner shadow-black/50">{(['sub', 'dub', 'raw'] as const).map((cat) => { const isAvailable = (servers?.[cat]?.length || 0) > 0; return (<button key={cat} disabled={!isAvailable} onClick={() => updateSetting('category', cat)} className={cn("px-3 py-0.5 rounded-full text-[10px] font-black uppercase transition-all relative active:scale-75 shadow-sm", settings.category === cat ? "bg-red-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300", !isAvailable && "opacity-10")}>{cat}{isAvailable && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]" />}</button>);})}</div>
             <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase transition-all hover:scale-105 active:scale-90 shadow-md shadow-red-900/5"><ServerIcon size={12}/> Portal <ChevronDown size={12}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-[#050505] border-white/5 text-zinc-400 z-[100] rounded-xl font-bold uppercase text-[10px] shadow-2xl shadow-red-900/10"><ScrollArea className="h-48">{servers?.[settings.category]?.map((srv: any, idx: number) => (<DropdownMenuItem key={srv.serverId} onClick={() => updateSetting('server', srv.serverName)} className={cn("cursor-pointer focus:bg-red-600 focus:text-white px-4 transition-colors", selectedServerName === srv.serverName && "text-red-500")}>Portal {idx + 1}</DropdownMenuItem>))}</ScrollArea></DropdownMenuContent></DropdownMenu>
             {nextEpisode ? (<button onClick={() => handleEpisodeClick(nextEpisode.episodeId)} className="flex items-center gap-2 bg-red-600 text-white rounded-full px-5 h-8 text-[11px] font-black uppercase tracking-widest transition-all duration-500 hover:scale-110 active:scale-90 shadow-lg shadow-red-900/40 group">NEXT <SkipForward size={12} className="group-hover:translate-x-1 transition-transform" /></button>) : (<button disabled className="flex items-center gap-2 bg-white/5 border border-white/5 text-zinc-600 rounded-full px-5 h-8 text-[11px] font-black uppercase tracking-widest cursor-not-allowed opacity-50 shadow-inner">NEXT <SkipForward size={12} /></button>)}
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center mt-8 px-4 md:px-8">
        <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-12 gap-8">
           <div className="xl:col-span-4 h-[700px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl shadow-red-900/20">
              <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0"><h3 className="font-black text-white flex items-center gap-2 uppercase tracking-tight text-sm font-[Cinzel]"><Layers size={16} className="text-red-600 shadow-sm"/> Episodes <span className="text-[10px] bg-white text-black px-2 rounded-full font-black ml-1 shadow-md">{episodes.length}</span></h3>
                 <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner"><button onClick={() => setEpViewMode('capsule')} className={cn("p-1.5 rounded-full transition-all active:scale-75", epViewMode==='capsule'?'bg-white/10 text-white shadow-lg shadow-red-900/10':'text-zinc-600 shadow-none')}><Grid size={14}/></button><button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-full transition-all active:scale-75", epViewMode==='list'?'bg-white/10 text-white shadow-lg shadow-red-900/10':'text-zinc-600 shadow-none')}><List size={14}/></button></div>
              </div>
              {episodeChunks.length > 1 && (<div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 h-10 overflow-hidden px-4 shadow-inner"><ScrollArea className="w-full h-full whitespace-nowrap"><div className="flex items-center py-2 gap-2 w-max">{episodeChunks.map((_, idx) => (<button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("px-4 py-1 text-[10px] font-black rounded-full transition-all active:scale-90 shadow-sm", epChunkIndex === idx ? 'bg-red-600 text-white shadow-red-900/40' : 'bg-white/5 text-zinc-500 hover:text-zinc-300')}>{(idx * 50) + 1}-{Math.min((idx + 1) * 50, episodes.length)}</button>))}</div></ScrollArea></div>)}
              <ScrollArea className="flex-1 p-5 scrollbar-thin scrollbar-thumb-red-600/50 shadow-inner"><div className={cn(epViewMode === 'capsule' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1.5')}>
                    {episodeChunks[epChunkIndex]?.map((ep) => { const isCurrent = ep.episodeId === currentEpId;
                       if (epViewMode === 'capsule') return (<button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("h-9 w-12 rounded-full flex items-center justify-center border transition-all text-[11px] font-black relative overflow-hidden active:scale-75 shadow-md", isCurrent ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-110 z-10" : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-red-500/50 hover:text-white shadow-none")}>{ep.number}{ep.isFiller && <span className="absolute top-1 right-2 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_5px_orange] animate-pulse"/>}</button>);
                       return (<button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all group active:translate-x-1 shadow-sm", isCurrent ? 'bg-red-600 text-white shadow-red-900/30' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300 shadow-none')}><span className="truncate flex-1 text-left mr-2 tracking-tighter">{ep.number}. {ep.title}</span>{ep.isFiller && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-2 rounded-full font-black uppercase tracking-widest">Filler</span>}</button>);})}
                 </div></ScrollArea>
           </div>

           <div className="xl:col-span-8 h-[700px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20">
              <div className="flex-shrink-0 relative p-8 pt-16 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-red-600/5 to-transparent">
                 <div className="relative shrink-0 mx-auto sm:mx-0 flex flex-col gap-6 w-full sm:w-auto">
                    {/* POSTER */}
                    <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] mx-auto sm:mx-0 w-fit">
                        <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#dc2626_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" />
                        <img src={anime.poster} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl shadow-black" alt={anime.name} />
                    </div>
                    {/* TRAILER BUTTON */}
                    <div className="flex justify-center w-full">
                        <TrailerSection videos={anime.trailers} animeName={anime.name} />
                    </div>
                 </div>
                 
                 <div className="flex-1 pt-2 text-center sm:text-left z-10 flex flex-col h-full">
                    <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] leading-none mb-2 tracking-tighter drop-shadow-2xl shadow-black">{anime.name}</h1>
                    {anime.jname && <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-6 opacity-60 drop-shadow-sm">{anime.jname}</p>}
                    
                    <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start items-center">
                       <Badge className="bg-red-600 text-white rounded-full px-5 py-1.5 text-[10px] font-black uppercase shadow-lg shadow-red-900/50">{anime.stats.quality}</Badge>
                       <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20">
                           <span className={cn(anime.moreInfo.status.includes('Airing') ? 'text-green-500 animate-pulse' : 'text-zinc-500')}>{anime.moreInfo.status}</span>
                           <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                           <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-600 shadow-red-900/20"/> {anime.stats.duration}</div>
                           <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/>
                           <div className="flex items-center gap-1.5 text-yellow-500 uppercase font-black drop-shadow-sm">MAL: {anime.stats.malScore}</div>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-6 justify-center sm:justify-start">
                        {anime.moreInfo.genres.map((g: string) => (
                            <Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-red-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-red-900/20 shadow-red-900/10">{g}</Link>
                        ))}
                    </div>

                    {/* RATING SYSTEM - CONNECTED TO DB */}
                    <div className="mt-auto pt-6 w-full flex justify-end">
                        <StarRating animeId={animeId} initialRating={anime.stats.rating} />
                    </div>
                 </div>
              </div>

              <div className="flex-1 min-h-0 relative px-10 mt-4 overflow-hidden flex flex-col">
                 <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2 shadow-sm shrink-0"><Info size={12} className="shadow-sm"/> Synopsis</h4>
                 <ScrollArea className="flex-1 pr-4 scrollbar-thin scrollbar-thumb-zinc-900 shadow-inner shadow-red-900/5">
                    <p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased font-medium opacity-90 drop-shadow-sm shadow-black">{anime.description}</p>
                 </ScrollArea>
              </div>

              {/* METADATA ROW */}
              <div className="flex-shrink-0 p-8 border-t border-white/5 bg-[#0a0a0a] shadow-inner shadow-red-900/5">
                 <div className="flex flex-nowrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] overflow-hidden">
                    
                    <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 shrink-0 group hover:border-red-500/30 transition-all shadow-inner shadow-black/20">
                        <span className="text-red-600">Aired</span>
                        <span className="text-zinc-300 font-bold whitespace-nowrap">{anime.moreInfo.aired || 'N/A'}</span>
                    </div>

                    <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 shrink-0 group hover:border-red-500/30 transition-all shadow-inner shadow-black/20">
                        <span className="text-red-600">Premiered</span>
                        <span className="text-zinc-300 font-bold whitespace-nowrap">{anime.moreInfo.premiered || 'N/A'}</span>
                    </div>

                    {/* STUDIOS */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 hover:border-red-600/50 hover:bg-white/10 transition-all active:scale-95 min-w-0 shrink flex-1 shadow-inner shadow-black/20 group">
                                <span className="text-red-600 shrink-0">Studios</span>
                                <span className="text-zinc-300 truncate">{anime.moreInfo.studios[0] || 'N/A'}</span>
                                <ChevronDown size={12} className="text-zinc-600 group-hover:text-red-600 transition-colors shadow-sm shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#050505] border-white/10 rounded-2xl p-2 z-[100] shadow-2xl shadow-red-900/40">
                            {anime.moreInfo.studios.map((s:string) => (
                                <DropdownMenuItem key={s} className="text-[10px] font-black uppercase text-zinc-500 focus:bg-red-600 focus:text-white cursor-pointer px-5 py-2 rounded-xl transition-all"><Link href={`/search?studio=${s}`}>{s}</Link></DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* PRODUCERS */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 hover:border-red-600/50 hover:bg-white/10 transition-all active:scale-95 min-w-0 shrink flex-1 shadow-inner shadow-black/20 group">
                                <span className="text-red-600 shrink-0">Producers</span>
                                <span className="text-zinc-300 truncate">{anime.moreInfo.producers[0] || 'N/A'}</span>
                                <ChevronDown size={12} className="text-zinc-600 group-hover:text-red-600 transition-colors shadow-sm shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#050505] border-white/10 rounded-2xl p-2 z-[100] shadow-2xl shadow-red-900/40">
                            {anime.moreInfo.producers.map((p:string) => (
                                <DropdownMenuItem key={p} className="text-[10px] font-black uppercase text-zinc-500 focus:bg-red-600 focus:text-white cursor-pointer px-5 py-2 rounded-xl transition-all shadow-sm">{p}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* NEW COMMENT SECTION */}
      <div className="w-full flex justify-center my-12 px-4 md:px-8">
        <div className="w-full max-w-[1400px]">
           <ShadowComments episodeId={currentEpId || "general"} />
        </div>
      </div>

      {(related.length > 0) && (<div className="flex items-center justify-center my-12 px-4 md:px-8"><div className="w-full max-w-[1400px]"><div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/related shadow-red-900/10 shadow-lg"><div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/related:bg-red-600/10 transition-all duration-1000" /><div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Related Domains</h4></div>
          <ScrollArea className="w-full whitespace-nowrap pb-6 [&>[data-orientation=horizontal]]:bg-black [&>[data-orientation=horizontal]_[data-state=visible]]:bg-red-600 scrollbar-hide group-hover:scrollbar-default">
              <div className="flex gap-6 w-max">{related.map((rel: any, idx: number) => (<Link key={`${rel.id}-${idx}`} href={`/watch/${rel.id}`} className="group/item flex items-center gap-5 p-2 pr-10 rounded-full bg-white/5 border border-white/5 hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[320px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md"><div className="relative shrink-0 overflow-hidden rounded-full w-16 h-16 border-2 border-white/5 group-hover/item:border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-500 shadow-black/50 shadow-md"><img src={rel.poster || rel.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125 shadow-md shadow-red-900/5" alt={rel.name} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[13px] font-black text-zinc-300 group-hover:text-white truncate w-[180px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{rel.name || rel.title}</span><div className="flex items-center gap-3"><Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-600 rounded-md group-hover/item:border-red-500/50 group-hover/item:text-red-500 uppercase tracking-widest shadow-sm">{rel.type}</Badge><span className="text-[9px] text-zinc-700 font-black uppercase group-hover/item:text-zinc-400 shadow-sm">{rel.episodes?.sub || '?'} EPS</span></div></div></Link>))}</div>
              <ScrollBar orientation="horizontal" className="h-1.5 rounded-full shadow-red-900/40 shadow-lg shadow-md" />
          </ScrollArea></div></div></div>)}

      <div className="w-full flex justify-center mt-12 px-4 md:px-8">
        <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
           <div className="xl:col-span-4 h-[750px] flex flex-col bg-[#0a0a0a] rounded-[50px] border border-white/5 shadow-2xl overflow-hidden relative group/paths shadow-red-900/20 shadow-md"><div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 relative z-10 shadow-red-900/5 shadow-md"><Heart size={20} className="text-red-600 fill-red-600 animate-pulse shadow-red-600/30 shadow-md" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Materialized Paths</h3></div><div className="flex-1 overflow-hidden p-6 relative z-10 shadow-inner shadow-red-900/5"><ScrollArea className="h-full pr-4 scrollbar-thin scrollbar-thumb-zinc-900 shadow-inner"><div className="space-y-4">{recommendations.map((rec: any, idx: number) => (<Link key={`${rec.id}-${idx}`} href={`/watch/${rec.id}`} className="flex gap-5 p-4 rounded-[32px] hover:bg-red-600/5 group transition-all duration-500 active:scale-95 border border-transparent hover:border-red-600/20 shadow-inner shadow-red-900/5"><img src={rec.poster || rec.image} className="w-16 h-24 object-cover rounded-2xl shadow-3xl group-hover:rotate-1 transition-all duration-500 shadow-black shadow-md" alt={rec.name} /><div className="flex-1 py-1 flex flex-col justify-center"><h4 className="text-[12px] font-black text-zinc-500 group-hover:text-red-500 line-clamp-2 transition-all uppercase tracking-tight leading-tight mb-2 shadow-black drop-shadow-md">{rec.name || rec.title}</h4><div className="flex items-center gap-3"><span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] group-hover:text-zinc-500 transition-colors shadow-sm">{rec.type}</span><span className="w-1 h-1 bg-zinc-900 rounded-full shadow-sm"/><span className="text-[9px] text-zinc-800 font-black uppercase group-hover:text-red-900 transition-colors shadow-sm">{rec.episodes?.sub || rec.duration || '?'} UNIT</span></div></div></Link>))}</div></ScrollArea></div></div>
           <div className="xl:col-span-8 bg-[#0a0a0a] rounded-[50px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative min-h-[750px] shadow-red-900/20 shadow-md"><div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 shadow-red-900/5 shadow-md"><User size={20} className="text-red-600 shadow-red-600/30 shadow-md" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Manifested Bloodlines</h3></div>
              <ScrollArea className="flex-1 p-10 scrollbar-thin scrollbar-thumb-zinc-900 shadow-inner shadow-red-900/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                     {characters.map((char: any, i: number) => (
                        <div key={i} className={cn("flex items-center justify-between p-5 rounded-[35px] transition-all duration-700 group relative active:scale-95 shadow-red-900/5 shadow-md", char.role?.toLowerCase() === 'main' ? "bg-red-600/5 border border-red-500/20 shadow-[0_0_50px_-20px_rgba(220,38,38,0.4)]" : "bg-white/5 border border-white/5 hover:border-white/10 shadow-inner")}>
                           {/* ANIMATION: ROTATING GLOW BORDER FOR MAIN CHARACTERS */}
                           {char.role?.toLowerCase() === 'main' && (<div className="absolute inset-[-2px] rounded-[inherit] bg-[conic-gradient(from_0deg,transparent,30%,#dc2626_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 -z-10 blur-[1px] shadow-md" />)}
                           <div className="flex items-center justify-between relative z-10 w-full bg-[#0a0a0a] rounded-[inherit] p-1 shadow-inner shadow-red-900/5 shadow-md">
                             <div className="flex items-center gap-5 relative z-10"><div className="relative shrink-0"><img src={char.image || '/placeholder.png'} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-900 group-hover:border-red-600/50 group-hover:scale-105 transition-all duration-500 shadow-2xl shadow-black shadow-md" alt={char.name} /></div><div className="text-left flex flex-col justify-center gap-0.5"><div className="text-[12px] font-black text-zinc-200 group-hover:text-red-500 transition-all uppercase tracking-tighter leading-none shadow-black drop-shadow-md">{char.name}</div><div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1 group-hover:text-zinc-500 transition-colors shadow-sm">{char.role}</div></div></div>
                             {char.voiceActor && (<div className="flex items-center gap-5 flex-row-reverse text-right pl-6 border-l border-white/5 relative z-10 group/va transition-all shadow-sm"><img src={char.voiceActor.image || '/placeholder.png'} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-900 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:border-red-600/30 transition-all duration-700 shadow-md shadow-red-900/10" alt={char.voiceActor.name} /><div className="flex flex-col justify-center gap-0.5"><div className="text-[11px] font-black text-zinc-500 group-hover:text-zinc-300 transition-all uppercase tracking-tighter leading-none shadow-black drop-shadow-md">{char.voiceActor.name}</div><div className="text-[8px] text-zinc-800 font-black uppercase tracking-[0.3em] mt-1 group-hover:text-red-900 transition-colors shadow-sm">VA</div></div></div>)}
                           </div></div>))}
                  </div>
              </ScrollArea>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
    return <Suspense fallback={<FantasyLoader />}><WatchContent /></Suspense>;
}