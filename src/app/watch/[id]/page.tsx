"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Clock, AlertCircle, Tv, Play, 
  Grid, List, Timer, Lightbulb, LightbulbOff, 
  ChevronDown, Gem, Video, User, Heart, Plus, Eye, CheckCircle, XCircle,
  FastForward, Star, Info
} from 'lucide-react';

// --- API & LIBS ---
import { AnimeAPI, AnimeAPI_V2, supabase } from '@/lib/api'; 
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- COMPONENTS ---
import AnimePlayer from '@/components/Player/AnimePlayer'; 
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogTrigger,
} from "@/components/ui/dialog";

// --- TYPES ---
interface LocalServer { serverId: number; serverName: string; }
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
    <div className="flex items-center gap-1 opacity-70">
        <span className="text-xs text-red-500 font-bold uppercase tracking-tighter">{text}</span>
    </div>
);

const NextEpisodeTimer = ({ schedule, status }: { schedule: V2EpisodeSchedule | null, status: string }) => {
  const [displayText, setDisplayText] = useState<React.ReactNode>("...");

  useEffect(() => {
    if (status?.toLowerCase() === "finished airing") {
        setDisplayText(<ChibiCry text="ENDED" />);
        return;
    }
    if (!schedule || !schedule.airingTimestamp) {
        setDisplayText(<ChibiCry text="UNKNOWN" />); 
        return;
    }

    const updateTimer = () => {
      const now = Date.now(); // local time
      const diff = (schedule.airingTimestamp! * 1000) - now;
      
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
    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/5 text-zinc-300 px-3 h-8 rounded-full border border-white/5 justify-center min-w-fit max-w-full">
      <Timer className="w-3 h-3 text-red-500 shrink-0" />
      <span className="truncate whitespace-nowrap">{displayText}</span>
    </div>
  );
};

const WatchListToggle = () => {
    const [status, setStatus] = useState<string>("Add to List");
    const icons: any = { "Add to List": <Plus size={14}/>, "Watching": <Eye size={14}/>, "Completed": <CheckCircle size={14}/>, "Dropped": <XCircle size={14}/> };
    const colors: any = { "Add to List": "text-zinc-400", "Watching": "text-green-400", "Completed": "text-blue-400", "Dropped": "text-red-400" };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn("flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 h-8 text-[10px] font-bold hover:bg-white/10 transition-colors", colors[status])}>
                    {icons[status]} {status}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-zinc-300 z-[100]">
                {["Watching", "Plan to Watch", "Completed", "Dropped", "On Hold"].map(s => (
                    <DropdownMenuItem key={s} onClick={() => setStatus(s)} className="text-xs cursor-pointer hover:bg-white/5">{s}</DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const StarRating = ({ animeId, initialRating = 0 }: { animeId: string, initialRating?: number }) => {
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);

    const handleRate = async (score: number) => {
        setRating(score);
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('anime_ratings').upsert({ 
                    user_id: user.id, 
                    anime_id: animeId, 
                    rating: score 
                }, { onConflict: 'user_id, anime_id' });
                toast.success(`Rated ${score} stars!`);
            } else {
                toast.error("Please login to rate!");
            }
        }
    };

    return (
        <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => handleRate(star)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                    <Star 
                        size={14} 
                        className={cn(
                            "transition-all duration-300", 
                            star <= (hover || rating) ? "fill-red-600 text-red-600 shadow-red-500/50 drop-shadow-md" : "text-zinc-700"
                        )} 
                    />
                </button>
            ))}
            <span className="text-[10px] text-zinc-500 ml-2 font-bold">{rating > 0 ? rating.toFixed(1) : "?"}</span>
        </div>
    );
};

const TrailerSection = ({ videos }: { videos: any[] }) => {
    const [activeVideo, setActiveVideo] = useState(videos?.[0]?.source);
    if (!videos || videos.length === 0) return null;

    const getYoutubeId = (url: string) => url?.split('v=')[1]?.split('&')[0] || url?.split('/').pop();

    return (
        <div className="my-4">
            <Dialog>
                <DialogTrigger asChild>
                    <div className="inline-flex items-center gap-3 bg-red-600/10 border border-red-500/20 rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600 hover:border-red-500 transition-all group">
                        <span className="flex items-center justify-center w-6 h-6 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={10} fill="currentColor" />
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-red-100 group-hover:text-white uppercase tracking-wider">Trailers ({videos.length})</span>
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-black/95 border-red-500/40 max-w-4xl w-[95vw] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col h-full">
                        <div className="aspect-video w-full bg-zinc-900">
                             <iframe 
                                src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} 
                                className="w-full h-full" 
                                allow="autoplay; encrypted-media" 
                                allowFullScreen
                             />
                        </div>
                        <div className="p-6 bg-[#0a0a0a]">
                             <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Available Promos</h4>
                             <ScrollArea className="w-full whitespace-nowrap pb-4">
                                <div className="flex gap-2">
                                    {videos.map((v: any, i: number) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setActiveVideo(v.source)}
                                            className={cn(
                                                "flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-32",
                                                activeVideo === v.source ? "bg-red-600 border-red-500" : "bg-white/5 border-white/5 hover:border-white/20"
                                            )}
                                        >
                                            <div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative">
                                                <img src={v.thumbnail} className="w-full h-full object-cover opacity-60" />
                                                <Play size={12} className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                            <span className="text-[9px] font-bold text-center truncate w-full uppercase">{v.title || `PV ${i+1}`}</span>
                                        </button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" className="h-1" />
                             </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const FantasyLoader = ({ text = "SUMMONING..." }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#050505]">
    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
    <h2 className="text-xl font-[Cinzel] text-red-500 animate-pulse">{text}</h2>
  </div>
);


const MarqueeTitle = ({ text }: { text: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            setIsOverflowing(textRef.current.offsetWidth > containerRef.current.offsetWidth);
        }
    }, [text]);

    return (
        <div className="flex items-center bg-white/5 rounded-full px-4 h-8 border border-white/5 w-full sm:w-[280px] overflow-hidden relative">
             <span className="text-[11px] text-red-500 font-black uppercase mr-2 flex-shrink-0">NOW:</span>
             <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center">
                <span ref={textRef} className={cn(
                    "text-[11px] font-bold text-gray-300 whitespace-nowrap transition-transform",
                    isOverflowing ? 'animate-marquee-slow' : ''
                )}>
                    {text}
                </span>
             </div>
        </div>
    );
};

// ==========================================
//  MAIN PAGE
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

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoadingInfo(true);
      try {
        if (!animeId) throw new Error("No Anime ID");

        const [v2InfoRaw, v2EpData, scheduleData] = await Promise.all([
             AnimeAPI_V2.getAnimeInfo(animeId),
             AnimeAPI_V2.getEpisodes(animeId),
             AnimeAPI_V2.getNextEpisodeSchedule(animeId)
        ]);

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

      } catch (err) { 
        console.error("Materialization Error:", err);
      } 
      finally { if (isMounted) setIsLoadingInfo(false); }
    };
    init();
    return () => { isMounted = false; };
  }, [animeId]);

  // --- 2. STREAM LOAD ---
  useEffect(() => {
    if (!currentEpId) return;
    
    const newUrl = `/watch/${animeId}?ep=${currentEpId}`;
    if (window.location.pathname + window.location.search !== newUrl) {
        router.replace(newUrl, { scroll: false });
    }

    setStreamUrl(null);
    setIsStreamLoading(true);
    setStreamError(null);

    let isMounted = true;

    const loadStream = async () => {
      try {
        const serverRes = await AnimeAPI_V2.getEpisodeServers(currentEpId);
        if (!isMounted || !serverRes) return;

        setServers(serverRes);

        let activeCat = settings.category;
        const sData = serverRes as any;
        if (!sData[activeCat] || sData[activeCat].length === 0) {
             if (sData.sub?.length) activeCat = 'sub';
             else if (sData.dub?.length) activeCat = 'dub';
             else activeCat = 'raw';
             updateSetting('category', activeCat);
        }

        const list = sData[activeCat] || [];
        const targetServer = list.find((s:any) => s.serverName === settings.server) || 
                             list.find((s:any) => s.serverName === 'hd-1') || 
                             list[0];

        if (!targetServer) throw new Error("Portal Shut");
        setSelectedServerName(targetServer.serverName);

        const sourceRes = await AnimeAPI_V2.getEpisodeSources(currentEpId, targetServer.serverName, activeCat);
        
        if (sourceRes?.sources?.length) {
            const src = sourceRes.sources.find((s: any) => s.type === 'hls') || sourceRes.sources[0];
            setStreamUrl(src.url);
            if(sourceRes.intro) setIntro(sourceRes.intro);
            if(sourceRes.outro) setOutro(sourceRes.outro);
        } else { throw new Error("Link Severed"); }

      } catch (error) {
        if (isMounted) setStreamError("Portal Unstable");
      } finally {
        if (isMounted) setIsStreamLoading(false);
      }
    };

    loadStream();
    return () => { isMounted = false; };
  }, [currentEpId, settings.category, settings.server]); 

  // --- HELPERS ---
  const currentEpIndex = useMemo(() => episodes.findIndex(e => e.episodeId === currentEpId), [episodes, currentEpId]);
  const currentEpisode = episodes[currentEpIndex];
  const nextEpisode = currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;

  const episodeChunks = useMemo(() => {
    const size = 50; 
    const chunks = [];
    for (let i = 0; i < episodes.length; i += size) chunks.push(episodes.slice(i, i + size));
    return chunks;
  }, [episodes]);

  const handleEpisodeClick = (id: string) => {
    if (id === currentEpId) return;
    setCurrentEpId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingInfo) return <FantasyLoader text="MATERIALIZING..." />;
  if (!info) return <div className="p-20 text-center text-red-500 font-bold uppercase">Abyssal Link Severed.</div>;

  const { anime, recommendations, related, characters } = info;
  
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 relative font-sans overflow-x-hidden">
      
      {/* Dim Overlay */}
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-500 pointer-events-none", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      {/* PLAYER SECTION */}
      <div className="w-full relative z-40 flex justify-center bg-[#050505]">
        <div className="w-full max-w-[1400px] px-4 md:px-8 mt-6">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl relative shadow-red-900/10">
                {isStreamLoading ? (
                    <FantasyLoader text="CONNECTING..." />
                ) : streamError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                        <AlertCircle className="text-red-500 w-12 h-12" />
                        <span className="font-bold text-sm tracking-widest">Portal Unstable</span>
                        <Button variant="outline" className="rounded-full border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                ) : streamUrl ? (
                    <AnimePlayer 
                        url={streamUrl}
                        title={currentEpisode?.title || `${anime.name} - Ep ${currentEpisode?.number}`}
                        intro={intro}
                        outro={outro}
                        autoSkip={settings.autoSkip}
                        onEnded={() => { if(settings.autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.episodeId); }}
                        onNext={nextEpisode ? () => handleEpisodeClick(nextEpisode.episodeId) : undefined}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><Tv size={48} className="text-zinc-800"/></div>
                )}
            </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="w-full flex justify-center bg-[#0a0a0a] border-b border-white/5 relative z-40">
        <div className="w-full max-w-[1400px] px-4 md:px-8 py-3 flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          <div className="flex-1 min-w-0 flex items-center gap-4 w-full sm:w-auto">
             <MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} />
             <NextEpisodeTimer schedule={nextEpSchedule} status={anime.moreInfo.status} />
             <WatchListToggle />
          </div>

          <div className="flex items-center gap-3">
             {/* PREV BUTTON WITH HOVER */}
             <button 
                disabled={!prevEpisode}
                onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.episodeId)}
                className={cn(
                    "flex items-center gap-2 px-3 h-8 rounded-full border text-[10px] font-bold transition-all duration-300",
                    prevEpisode 
                      ? "bg-white/5 border-white/5 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-95" 
                      : "opacity-20 cursor-not-allowed border-white/5 text-zinc-500"
                )}
             >
                 <SkipBack size={12}/> PREV
             </button>

             <button 
                onClick={() => updateSetting('autoSkip', !settings.autoSkip)} 
                className={cn(
                    "flex items-center gap-2 px-3 h-8 rounded-full border text-[10px] font-bold transition-all duration-300 hover:scale-105 active:scale-95", 
                    settings.autoSkip ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                )}
             >
                 <FastForward size={12}/> SKIP
             </button>
             <button 
                onClick={() => updateSetting('autoPlay', !settings.autoPlay)} 
                className={cn(
                    "flex items-center gap-2 px-3 h-8 rounded-full border text-[10px] font-bold transition-all duration-300 hover:scale-105 active:scale-95", 
                    settings.autoPlay ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/20" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                )}
             >
                 <Play size={12}/> AUTO
             </button>

             <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 transition-all hover:scale-110", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-500 hover:bg-white/5")}>
                {settings.dimMode ? <Lightbulb size={16} /> : <LightbulbOff size={16} />}
             </Button>
             
             {/* Sub/Dub Switcher */}
             <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
                {(['sub', 'dub', 'raw'] as const).map((cat) => {
                   const isAvailable = (servers?.[cat]?.length || 0) > 0;
                   return (
                      <button 
                        key={cat} 
                        disabled={!isAvailable} 
                        onClick={() => updateSetting('category', cat)} 
                        className={cn(
                            "px-3 py-0.5 rounded-full text-[10px] font-black uppercase transition-all relative", 
                            settings.category === cat ? "bg-red-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300", 
                            !isAvailable && "opacity-20 cursor-not-allowed"
                        )}
                      >
                         {cat}
                         {isAvailable && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a] animate-pulse" />}
                      </button>
                   );
                })}
             </div>

             {/* Server Select Dropdown */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-400 hover:text-white uppercase transition-all hover:bg-white/5 rounded-full">
                      <ServerIcon size={12}/> <span className="hidden sm:inline">Portal</span> <ChevronDown size={12}/>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-zinc-300 max-h-64 overflow-y-auto z-[100] rounded-xl shadow-2xl">
                   {servers?.[settings.category]?.map((srv: any, idx: number) => (
                      <DropdownMenuItem key={srv.serverId} onClick={() => updateSetting('server', srv.serverName)} className={cn("text-xs cursor-pointer font-bold px-4 py-2", selectedServerName === srv.serverName && "text-red-500 bg-red-500/5")}>
                         Portal {idx + 1}
                      </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
             </DropdownMenu>

             {nextEpisode && (
                <div onClick={() => handleEpisodeClick(nextEpisode.episodeId)} className="flex items-center gap-2 bg-red-600 text-white rounded-full px-4 h-8 cursor-pointer hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20 group">
                    <span className="text-[10px] font-black uppercase tracking-widest">NEXT</span>
                    <SkipForward size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
             )}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="w-full flex justify-center mt-8">
        <div className="w-full max-w-[1400px] px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
           
           {/* EPISODE CAPSULE LISTING */}
           <div className="xl:col-span-4 h-[700px] bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                 <h3 className="font-bold text-gray-100 flex items-center gap-2 uppercase tracking-tighter text-sm font-[Cinzel]">
                    <Layers size={16} className="text-red-500"/> Episodes <Badge className="ml-2 bg-white text-black hover:bg-white text-[10px] rounded-full">{episodes.length}</Badge>
                 </h3>
                 <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
                    <button onClick={() => setEpViewMode('capsule')} className={cn("p-1.5 rounded-full transition-all", epViewMode==='capsule'?'bg-white/10 text-white':'text-zinc-500')}><Grid size={14}/></button>
                    <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-full transition-all", epViewMode==='list'?'bg-white/10 text-white':'text-zinc-500')}><List size={14}/></button>
                 </div>
              </div>
              
              {episodeChunks.length > 1 && (
                 <div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 h-10">
                    <ScrollArea className="w-full h-full whitespace-nowrap">
                       <div className="flex items-center p-2 gap-2 w-max px-4">
                          {episodeChunks.map((_, idx) => (
                             <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("px-4 py-1 text-[10px] font-black rounded-full transition-all uppercase", epChunkIndex === idx ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10')}>
                                {(idx * 50) + 1}-{Math.min((idx + 1) * 50, episodes.length)}
                             </button>
                          ))}
                       </div>
                    </ScrollArea>
                 </div>
              )}

              <ScrollArea className="flex-1 p-4 scrollbar-thin scrollbar-thumb-red-600/50">
                 <div className={cn(epViewMode === 'capsule' ? 'flex flex-wrap gap-2 justify-start' : 'flex flex-col gap-1.5')}>
                    {episodeChunks[epChunkIndex]?.map((ep) => {
                       const isCurrent = ep.episodeId === currentEpId;
                       if (epViewMode === 'capsule') return (
                          <button 
                            key={ep.episodeId} 
                            onClick={() => handleEpisodeClick(ep.episodeId)} 
                            className={cn(
                                "h-9 w-12 rounded-full flex items-center justify-center border transition-all text-[11px] font-black relative group", 
                                isCurrent 
                                  ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] scale-110 z-10" 
                                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-red-500/50 hover:text-red-400 hover:bg-red-600/5"
                            )}
                          >
                              {ep.number}
                              {ep.isFiller && <span className="absolute top-1 right-2 w-1 h-1 bg-orange-500 rounded-full animate-pulse"/>}
                          </button>
                       );
                       return (
                          <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all group border", isCurrent ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10')}>
                             <span className="truncate flex-1 text-left mr-2 tracking-tight">{ep.number}. {ep.title}</span>
                             {ep.isFiller && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-2 rounded-full uppercase font-black tracking-widest">Filler</span>}
                          </button>
                       );
                    })}
                 </div>
              </ScrollArea>
           </div>

           {/* DETAILS & METADATA SECTION */}
           <div className="xl:col-span-8 h-[700px] bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
              <div className="flex-shrink-0 relative p-6 pt-12 flex flex-col sm:flex-row gap-8 bg-gradient-to-b from-red-600/5 to-transparent">
                 <div className="relative shrink-0 mx-auto sm:mx-0">
                    <img src={anime.poster} className="w-40 h-56 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 object-cover z-20 relative" />
                    <div className="absolute inset-0 bg-red-600/10 rounded-2xl blur-2xl opacity-20 -z-10" />
                 </div>
                 
                 <div className="flex-1 pt-2 text-center sm:text-left z-10">
                    <h1 className="text-3xl md:text-4xl font-black text-white font-[Cinzel] leading-none mb-2 drop-shadow-xl">{anime.name}</h1>
                    {anime.jname && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mb-4 opacity-70">{anime.jname}</p>}
                    
                    <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start items-center">
                       <Badge className="bg-red-600 hover:bg-red-700 rounded-full px-4 py-1 text-[10px] font-black uppercase shadow-lg shadow-red-900/20">{anime.stats.quality}</Badge>
                       <div className="flex items-center gap-3 text-[10px] text-zinc-300 font-black bg-white/5 border border-white/5 px-4 py-1.5 rounded-full uppercase tracking-tighter">
                           <span className={cn(anime.moreInfo.status.includes('Airing') ? 'text-green-500' : 'text-zinc-400')}>{anime.moreInfo.status}</span>
                           <span className="w-1 h-1 bg-zinc-800 rounded-full"/>
                           <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-red-500"/> {anime.stats.duration}</div>
                           <span className="w-1 h-1 bg-zinc-800 rounded-full"/>
                           <div className="flex items-center gap-1 text-yellow-500"><Star size={12} fill="currentColor"/> {anime.stats.malScore}</div>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-5 justify-center sm:justify-start">
                        {anime.moreInfo.genres.map((g: string) => (
                            <Link key={g} href={`/search?type=${g}`} className="text-[9px] px-3 py-1 bg-white/5 rounded-full text-zinc-400 border border-white/5 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all font-black uppercase tracking-tight">{g}</Link>
                        ))}
                    </div>

                    <StarRating animeId={animeId} initialRating={anime.stats.rating} />
                 </div>
              </div>

              <div className="flex-1 min-h-0 relative px-8 mt-4">
                 <ScrollArea className="h-full pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
                    <TrailerSection videos={anime.trailers} />
                    <p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased">{anime.description}</p>
                 </ScrollArea>
              </div>

              {/* DYNAMIC CAPSULE FOOTER WITH POP-MENUS */}
              <div className="flex-shrink-0 p-6 border-t border-white/5 bg-[#0a0a0a]">
                 <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
                    
                    <div className="bg-white/5 p-2 px-4 rounded-full border border-white/5 flex items-center gap-3 shrink-0">
                        <span className="text-red-500">Aired</span>
                        <span className="text-zinc-300">{anime.moreInfo.aired || 'N/A'}</span>
                    </div>

                    <div className="bg-white/5 p-2 px-4 rounded-full border border-white/5 flex items-center gap-3 shrink-0">
                        <span className="text-red-500">Premiered</span>
                        <span className="text-zinc-300">{anime.moreInfo.premiered || 'N/A'}</span>
                    </div>

                    {/* STUDIOS WITH POPUP */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="bg-white/5 p-2 px-4 rounded-full border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer group">
                                <span className="text-red-500">Studios</span>
                                <span className="text-zinc-300 truncate max-w-[100px]">{anime.moreInfo.studios[0] || 'N/A'}</span>
                                {anime.moreInfo.studios.length > 1 && <ChevronDown size={10} className="text-zinc-500 group-hover:text-white" />}
                            </button>
                        </DropdownMenuTrigger>
                        {anime.moreInfo.studios.length > 1 && (
                            <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 rounded-xl p-2 z-[100]">
                                {anime.moreInfo.studios.map((s:string) => (
                                    <DropdownMenuItem key={s} className="text-[10px] font-bold uppercase text-zinc-400 focus:bg-red-600 focus:text-white cursor-pointer px-4">
                                        <Link href={`/search?studio=${s}`}>{s}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>

                    {/* PRODUCERS WITH POPUP */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="bg-white/5 p-2 px-4 rounded-full border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer group">
                                <span className="text-red-500">Producers</span>
                                <span className="text-zinc-300 truncate max-w-[100px]">{anime.moreInfo.producers[0] || 'N/A'}</span>
                                {anime.moreInfo.producers.length > 1 && <ChevronDown size={10} className="text-zinc-500 group-hover:text-white" />}
                            </button>
                        </DropdownMenuTrigger>
                        {anime.moreInfo.producers.length > 1 && (
                            <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 rounded-xl p-2 z-[100]">
                                {anime.moreInfo.producers.map((p:string) => (
                                    <DropdownMenuItem key={p} className="text-[10px] font-bold uppercase text-zinc-400 focus:bg-red-600 focus:text-white cursor-pointer px-4">
                                        {p}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>

                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RELATED SECTION - FIXED WIDTH TO MARGIN */}
      {(related.length > 0) && (
         <div className="flex items-center justify-center my-12 px-4 md:px-8">
            <div className="w-full max-w-[1400px]">
               <div className="bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-[40px] p-10 overflow-hidden relative group/related">
                  {/* Glow animation in background */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[120px] pointer-events-none group-hover/related:bg-red-600/10 transition-all duration-1000" />
                  
                  <div className="flex items-center gap-3 mb-8">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_red]" />
                    <h4 className="text-[11px] text-white font-black uppercase tracking-[0.4em] font-[Cinzel]">Related Dimensions</h4>
                  </div>

                  <ScrollArea className="w-full whitespace-nowrap pb-6 [&>[data-orientation=horizontal]]:bg-black [&>[data-orientation=horizontal]_[data-state=visible]]:bg-red-600">
                      <div className="flex gap-6 w-max">
                         {related.map((rel: any, idx: number) => (
                            <Link 
                                key={`${rel.id}-${idx}`} 
                                href={`/watch/${rel.id}`} 
                                className="group/item flex items-center gap-4 p-2 pr-8 rounded-full bg-white/5 border border-white/5 hover:border-red-600/40 hover:bg-red-600/5 transition-all duration-500 min-w-[280px] active:scale-95"
                            >
                                <div className="relative shrink-0 overflow-hidden rounded-full w-14 h-14 border-2 border-white/10 group-hover/item:border-red-500/50 transition-all">
                                    <img src={rel.poster || rel.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                </div>
                                <div className="flex flex-col overflow-hidden gap-0.5">
                                    <span className="text-xs font-black text-zinc-300 group-hover/item:text-white truncate w-[160px] uppercase tracking-tighter">{rel.name || rel.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{rel.type}</span>
                                        <span className="w-1 h-1 bg-zinc-800 rounded-full"/>
                                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">{rel.episodes?.sub || '?'} EPS</span>
                                    </div>
                                </div>
                            </Link>
                         ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="h-1.5" />
                  </ScrollArea>
               </div>
            </div>
         </div>
      )}

      {/* CHARACTERS & REC SECTION */}
      <div className="w-full flex justify-center mt-12">
        <div className="w-full max-w-[1400px] px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
           
           <div className="xl:col-span-4 h-[750px] flex flex-col bg-[#0a0a0a] rounded-[40px] border border-white/5 shadow-2xl overflow-hidden relative">
              <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-3">
                  <Heart size={18} className="text-red-500 fill-red-500 animate-pulse" />
                  <h3 className="font-black text-white text-[10px] font-[Cinzel] tracking-[0.3em] uppercase">Chosen Paths</h3>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                 <ScrollArea className="h-full pr-3 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="space-y-4">
                       {recommendations.map((rec: any, idx: number) => (
                          <Link key={`${rec.id}-${idx}`} href={`/watch/${rec.id}`} className="flex gap-4 p-4 rounded-3xl hover:bg-white/5 group transition-all duration-500 active:scale-95 border border-transparent hover:border-white/5">
                              <img src={rec.poster || rec.image} className="w-16 h-24 object-cover rounded-2xl shadow-2xl group-hover:scale-105 transition-all" />
                              <div className="flex-1 py-1 flex flex-col justify-center">
                                  <h4 className="text-xs font-black text-zinc-400 group-hover:text-red-500 line-clamp-2 transition-colors uppercase tracking-tight leading-tight mb-2">{rec.name || rec.title}</h4>
                                  <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-600 rounded-md group-hover:border-red-600/30 group-hover:text-red-600 transition-all">{rec.type}</Badge>
                                      <span className="text-[9px] text-zinc-700 font-bold uppercase">{rec.episodes?.sub || rec.duration || '?'}</span>
                                  </div>
                              </div>
                          </Link>
                       ))}
                    </div>
                 </ScrollArea>
              </div>
           </div>

           <div className="xl:col-span-8 bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative min-h-[750px]">
              <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-3">
                <User size={18} className="text-red-500" />
                <h3 className="font-black text-white text-[10px] font-[Cinzel] tracking-[0.3em] uppercase">Shadow Lineage</h3>
              </div>
              
              <ScrollArea className="flex-1 p-8 scrollbar-thin scrollbar-thumb-zinc-800">
                 {characters.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {characters.map((char: any, i: number) => (
                           <div 
                              key={i} 
                              className={cn(
                                "flex items-center justify-between p-4 rounded-3xl transition-all duration-500 group relative",
                                char.role?.toLowerCase() === 'main' 
                                  ? "bg-red-600/5 border border-red-500/20 shadow-[0_0_40px_-15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_-10px_rgba(220,38,38,0.5)]" 
                                  : "bg-white/5 border border-white/5 hover:border-white/10"
                              )}
                            >
                              {/* GLOW BORDER ANIMATION FOR MAIN CHARACTERS */}
                              {char.role?.toLowerCase() === 'main' && (
                                  <div className="absolute inset-[-1px] rounded-[inherit] bg-[conic-gradient(from_0deg,transparent_20%,#dc2626_50%,transparent_80%)] animate-[spin_6s_linear_infinite] opacity-40 -z-10 blur-[1px]" />
                              )}

                              <div className="flex items-center gap-4 relative z-10">
                                  <div className="relative shrink-0">
                                      <img src={char.image || '/placeholder.png'} className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-800 group-hover:border-red-500/50 transition-all duration-500" />
                                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent" />
                                  </div>
                                  <div className="text-left flex flex-col justify-center">
                                      <div className="text-[11px] font-black text-zinc-200 group-hover:text-red-400 transition-colors uppercase tracking-tighter leading-tight">{char.name}</div>
                                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-60">{char.role}</div>
                                  </div>
                              </div>

                              {char.voiceActor && (
                                  <div className="flex items-center gap-4 flex-row-reverse text-right pl-4 border-l border-white/10 relative z-10">
                                      <img src={char.voiceActor.image || '/placeholder.png'} className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-800 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:border-red-500/50 transition-all duration-700" />
                                      <div className="flex flex-col justify-center">
                                          <div className="text-[10px] font-black text-zinc-400 group-hover:text-white transition-all uppercase tracking-tighter leading-tight">{char.voiceActor.name}</div>
                                          <div className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">VA</div>
                                      </div>
                                  </div>
                              )}
                           </div>
                        ))}
                     </div>
                 ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 text-zinc-600 space-y-4">
                         <User size={40} className="animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-[0.5em] font-[Cinzel]">Bloodline Hidden</span>
                     </div>
                 )}
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