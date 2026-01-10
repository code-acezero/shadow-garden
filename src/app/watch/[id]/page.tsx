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
interface V2EpisodeSchedule { airingTimestamp: number | null; }

// ==========================================
//  HOOKS
// ==========================================

const useWatchSettings = () => {
  const [settings, setSettings] = useState({
    autoPlay: true,
    autoSkip: true,
    dimMode: false, // Default OFF (Lights On)
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

const ChibiCry = () => (
    <div className="flex flex-col items-center justify-center gap-1 opacity-50">
        <span className="text-2xl">｡ﾟ(ﾟ∩´﹏`∩ﾟ)ﾟ｡</span>
        <span className="text-[8px] font-bold">UNKNOWN</span>
    </div>
);

const NextEpisodeTimer = ({ schedule }: { schedule: V2EpisodeSchedule | null }) => {
  const [displayText, setDisplayText] = useState<React.ReactNode>("Loading...");

  useEffect(() => {
    if (!schedule || !schedule.airingTimestamp) {
        setDisplayText(<ChibiCry />); 
        return;
    }
    const updateTimer = () => {
      const now = Date.now() / 1000;
      const diff = schedule.airingTimestamp! - now;
      if (diff <= 0) { setDisplayText("Aired"); return; }
      
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setDisplayText(`${days}d ${hours}h ${minutes}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  }, [schedule]);

  return (
    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/5 text-zinc-300 px-3 py-1 rounded-full border border-white/5 h-8 min-w-[100px] justify-center">
      {typeof displayText === 'string' && <Timer className="w-3 h-3 text-red-500" />}
      <span>{displayText}</span>
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
        // Supabase Save Logic
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('anime_ratings').upsert({ 
                    user_id: user.id, 
                    anime_id: animeId, 
                    rating: score 
                });
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
                    className="focus:outline-none transition-transform hover:scale-110"
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
    const trailer = videos?.find((v:any) => v.source === 'youtube' || v.site === 'youtube');
    if(!trailer) return null;

    return (
        <div className="my-4">
            <Dialog>
                <DialogTrigger asChild>
                    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600/20 hover:border-red-500/50 transition-all group">
                        <span className="flex items-center justify-center w-6 h-6 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={10} fill="currentColor" />
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">Watch Trailer</span>
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-black/95 border-red-500/20 max-w-3xl w-full aspect-video p-0 overflow-hidden rounded-xl shadow-2xl shadow-red-900/20">
                     <iframe 
                        src={`https://www.youtube.com/embed/${trailer.id}?autoplay=1`} 
                        className="w-full h-full" 
                        allow="autoplay; encrypted-media" 
                        allowFullScreen
                     />
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
        <div className="flex items-center bg-white/5 rounded-full px-4 h-8 border border-white/5 w-[250px] overflow-hidden relative">
             <span className="text-[10px] text-red-500 font-bold uppercase mr-2 flex-shrink-0">NOW:</span>
             <div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center">
                <span ref={textRef} className={`text-sm font-bold text-gray-300 whitespace-nowrap ${isOverflowing ? 'animate-marquee' : ''}`}>
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

  // STATE
  const { settings, updateSetting } = useWatchSettings();
  const [info, setInfo] = useState<any | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]); 
  const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // STREAM STATE
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [intro, setIntro] = useState<{start:number; end:number}>();
  const [outro, setOutro] = useState<{start:number; end:number}>();
  const [servers, setServers] = useState<any>(null);
  const [selectedServerName, setSelectedServerName] = useState<string>('hd-1');
  
  // UI STATE
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [epViewMode, setEpViewMode] = useState<'capsule' | 'list'>('capsule');

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoadingInfo(true);
      try {
        if (!animeId) throw new Error("No Anime ID");

        // Fetch Data Parallel
        const [v1Info, v2EpData, scheduleData] = await Promise.all([
             AnimeAPI.getAnimeInfo(animeId),
             AnimeAPI_V2.getEpisodes(animeId),
             AnimeAPI_V2.getNextEpisodeSchedule(animeId)
        ]);

        if (!isMounted) return;
        
        const v1 = v1Info as any; 
        
        // --- NORMALIZE DATA ---
        const hybridInfo = {
            anime: {
                id: v1.id,
                name: v1.title?.english || v1.title?.romaji || v1.title,
                jname: v1.title?.native || v1.japaneseTitle,
                poster: v1.image,
                description: v1.description,
                stats: {
                    rating: v1.rating || 0, // For Star Component
                    malScore: v1.malScore || v1.rating || '?',
                    quality: v1.type || 'HD',
                    type: v1.type || 'TV',
                    duration: v1.duration || '24m'
                },
                moreInfo: {
                    aired: v1.releaseDate || v1.startDate,
                    premiered: v1.season ? `${v1.season} ${v1.releaseDate?.split(',')[1] || ''}` : 'Unknown',
                    status: v1.status,
                    genres: v1.genres || [],
                    studios: v1.studios || [], 
                    producers: v1.producers || [] 
                },
                trailers: v1.trailers || v1.promotionalVideos || [] 
            },
            recommendations: v1.recommendations || [],
            related: v1.related || v1.relatedAnime || [],
            characters: v1.characters || []
        };
        
        setInfo(hybridInfo);
        setNextEpSchedule(scheduleData);
        setEpisodes(v2EpData?.episodes || []);

        const foundEp = urlEpId ? v2EpData?.episodes.find((e: any) => e.episodeId === urlEpId) : null;
        setCurrentEpId(foundEp ? foundEp.episodeId : (v2EpData?.episodes[0]?.episodeId || null));

      } catch (err) { console.error(err); } 
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
        if (!isMounted) return;
        if (!serverRes) throw new Error("No servers");

        setServers(serverRes);

        // Auto Category Selection
        let activeCat = settings.category;
        const sData = serverRes as any;
        if (!sData[activeCat] || sData[activeCat].length === 0) {
             if (sData.sub?.length) activeCat = 'sub';
             else if (sData.dub?.length) activeCat = 'dub';
             else activeCat = 'raw';
             updateSetting('category', activeCat);
        }

        // Server Selection
        const list = sData[activeCat] || [];
        const targetServer = list.find((s:any) => s.serverName === settings.server) || 
                             list.find((s:any) => s.serverName === 'hd-1') || 
                             list[0];

        if (!targetServer) throw new Error("Server unavailable");
        setSelectedServerName(targetServer.serverName);

        const sourceRes = await AnimeAPI_V2.getEpisodeSources(currentEpId, targetServer.serverName, activeCat);
        
        if (sourceRes?.sources?.length) {
            const src = sourceRes.sources.find((s: any) => s.type === 'hls') || sourceRes.sources[0];
            setStreamUrl(src.url);
            if(sourceRes.intro) setIntro(sourceRes.intro);
            if(sourceRes.outro) setOutro(sourceRes.outro);
        } else { throw new Error("Source failed"); }

      } catch (error) {
        if (isMounted) setStreamError("Stream unavailable");
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

  // Adaptive Chunking (1-50, 51-100)
  const episodeChunks = useMemo(() => {
    const size = 50; // Always 50 for capsules
    const chunks = [];
    for (let i = 0; i < episodes.length; i += size) chunks.push(episodes.slice(i, i + size));
    return chunks;
  }, [episodes]);

  const handleEpisodeClick = (id: string) => {
    if (id === currentEpId) return;
    setCurrentEpId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingInfo) return <FantasyLoader text="SUMMONING..." />;
  if (!info) return <div className="p-20 text-center text-red-500">Failed to load Anime.</div>;

  const { anime, recommendations, related, characters } = info;
  
  return (
    // Fixed: Correct scrolling behavior and dark dim overlay
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 relative font-sans overflow-x-hidden">
      
      {/* Dim Overlay (Click through disabled) */}
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-500 pointer-events-none", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      {/* PLAYER SECTION */}
      <div className="w-full relative z-40 flex justify-center bg-[#050505]">
        <div className="w-full max-w-[1400px] px-4 md:px-8 mt-6">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl relative">
                {isStreamLoading ? (
                    <FantasyLoader text="CONNECTING..." />
                ) : streamError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                        <AlertCircle className="text-red-500 w-12 h-12" />
                        <span>Stream Unavailable</span>
                        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                ) : streamUrl ? (
                    <AnimePlayer 
                        url={streamUrl}
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
          
          <div className="flex-1 min-w-0 flex items-center gap-4">
             <div className="hidden md:block w-[250px]"><MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} /></div>
             <NextEpisodeTimer schedule={nextEpSchedule} />
             <WatchListToggle />
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className={cn("flex items-center gap-2 px-3 h-8 rounded-full border text-[10px] font-bold transition-all", settings.autoSkip ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/5 text-zinc-500")}>
                 <FastForward size={12}/> SKIP
             </button>
             <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className={cn("flex items-center gap-2 px-3 h-8 rounded-full border text-[10px] font-bold transition-all", settings.autoPlay ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/5 text-zinc-500")}>
                 <Play size={12}/> AUTO
             </button>

             <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 hover:bg-white/10", settings.dimMode ? "text-yellow-500" : "text-zinc-500")}>
                {settings.dimMode ? <Lightbulb size={16} /> : <LightbulbOff size={16} />}
             </Button>
             
             {/* Audio Lang Switch */}
             <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
                {(['sub', 'dub', 'raw'] as const).map((cat) => {
                   const isAvailable = (servers?.[cat]?.length || 0) > 0;
                   return (
                      <button key={cat} disabled={!isAvailable} onClick={() => updateSetting('category', cat)} className={cn("px-3 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all relative", settings.category === cat ? "bg-red-600 text-white" : "text-zinc-500", !isAvailable && "opacity-30 cursor-not-allowed")}>
                         {cat}
                         {isAvailable && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse" />}
                      </button>
                   );
                })}
             </div>

             {/* Server Portal Select */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="h-8 gap-2 text-xs font-bold text-zinc-400 hover:text-white">
                      <ServerIcon size={12}/> <span className="hidden sm:inline">Server</span> <ChevronDown size={12}/>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-zinc-300 max-h-64 overflow-y-auto z-[100]">
                   {servers?.[settings.category]?.map((srv: any, idx: number) => (
                      <DropdownMenuItem key={srv.serverId} onClick={() => updateSetting('server', srv.serverName)} className={cn("text-xs cursor-pointer", selectedServerName === srv.serverName && "text-red-500 bg-white/5")}>
                         Portal {idx + 1}
                      </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
             </DropdownMenu>

             {nextEpisode && (
                <div onClick={() => handleEpisodeClick(nextEpisode.episodeId)} className="flex items-center gap-2 bg-white/5 rounded-full px-4 h-8 border border-white/5 cursor-pointer hover:bg-red-600 hover:border-red-500 transition-all duration-300 group">
                    <span className="text-[10px] font-bold text-white group-hover:text-white">NEXT</span>
                    <SkipForward size={12} className="text-zinc-400 group-hover:text-white" />
                </div>
             )}
          </div>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="w-full flex justify-center mt-8">
        <div className="w-full max-w-[1400px] px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
           
           {/* LEFT COLUMN: EPISODES */}
           <div className="xl:col-span-4 h-[700px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
              <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                 <h3 className="font-bold text-gray-100 flex items-center gap-2">
                    <Layers size={16} className="text-red-500"/> Episodes <Badge className="ml-2 bg-white text-black hover:bg-white text-[10px]">{episodes.length}</Badge>
                 </h3>
                 <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button onClick={() => setEpViewMode('capsule')} className={cn("p-1.5 rounded", epViewMode==='capsule'?'bg-white/10 text-white':'text-zinc-500')}><Grid size={14}/></button>
                    <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded", epViewMode==='list'?'bg-white/10 text-white':'text-zinc-500')}><List size={14}/></button>
                 </div>
              </div>
              
              {/* Chunk Selector */}
              {episodeChunks.length > 1 && (
                 <div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 h-10 overflow-hidden">
                    <ScrollArea className="w-full h-full whitespace-nowrap">
                       <div className="flex items-center p-2 gap-2 w-max">
                          {episodeChunks.map((_, idx) => (
                             <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("px-3 py-0.5 text-[10px] font-bold rounded-full transition-all whitespace-nowrap", epChunkIndex === idx ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-500')}>
                                {(idx * 50) + 1} - {Math.min((idx + 1) * 50, episodes.length)}
                             </button>
                          ))}
                       </div>
                       <ScrollBar orientation="horizontal" className="h-1.5" />
                    </ScrollArea>
                 </div>
              )}

              <ScrollArea className="flex-1 p-2">
                 <div className={cn(epViewMode === 'capsule' ? 'grid grid-cols-4 gap-2' : 'flex flex-col gap-1')}>
                    {episodeChunks[epChunkIndex]?.map((ep) => {
                       const isCurrent = ep.episodeId === currentEpId;
                       if (epViewMode === 'capsule') return (
                          <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("h-10 rounded-lg flex items-center justify-center border transition-all text-xs font-bold relative", isCurrent ? "bg-red-600/20 border-red-500 text-red-500" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800")}>
                             {ep.number}
                             {ep.isFiller && <span className="absolute top-0 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full"/>}
                          </button>
                       );
                       return (
                          <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("flex items-center justify-between px-4 py-3 rounded-md text-xs font-medium transition-all", isCurrent ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10')}>
                             <span className="truncate flex-1 text-left mr-2">{ep.number}. {ep.title}</span>
                             {ep.isFiller && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-1 rounded">FILLER</span>}
                          </button>
                       );
                    })}
                 </div>
              </ScrollArea>
           </div>

           {/* RIGHT COLUMN: ANIME INFO */}
           <div className="xl:col-span-8 h-[700px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl relative">
              <div className="flex-shrink-0 relative p-6 pt-10 flex flex-col sm:flex-row gap-6 bg-gradient-to-b from-white/5 to-transparent">
                 <img src={anime.poster} className="w-32 h-48 rounded-lg shadow-2xl border border-white/10 object-cover flex-shrink-0 mx-auto sm:mx-0 z-20 -mt-2" />
                 <div className="flex-1 pt-2 text-center sm:text-left z-10">
                    <h1 className="text-2xl md:text-3xl font-black text-white font-[Cinzel] leading-tight">{anime.name}</h1>
                    {anime.jname && <p className="text-xs text-zinc-500 mt-1 italic line-clamp-1">{anime.jname}</p>}
                    
                    <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start items-center">
                       <Badge className="bg-red-600 hover:bg-red-700">{anime.stats.quality}</Badge>
                       <div className="flex items-center gap-2 text-xs text-zinc-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                           <span className={cn(anime.moreInfo.status === 'Ongoing' ? 'text-green-400' : 'text-zinc-400')}>{anime.moreInfo.status}</span>
                           <span className="w-1 h-1 bg-zinc-600 rounded-full"/>
                           <Clock className="w-3 h-3"/> {anime.stats.duration}
                       </div>
                       <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 font-bold">
                           MAL: {anime.stats.malScore}
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3 justify-center sm:justify-start">
                        {anime.moreInfo.genres.map((g: string) => (
                            <Link key={g} href={`/search?type=${g}`} className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-zinc-400 border border-white/5 hover:text-white hover:bg-red-600 transition-colors cursor-pointer">{g}</Link>
                        ))}
                    </div>

                    <StarRating animeId={animeId} initialRating={anime.stats.rating} />
                 </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                 <ScrollArea className="h-full px-6">
                    <TrailerSection videos={anime.trailers} />
                    <p className="text-gray-300 text-sm leading-relaxed pb-4 mt-2">{anime.description}</p>
                 </ScrollArea>
              </div>

              {/* DETAILS GRID */}
              <div className="flex-shrink-0 p-4 border-t border-white/5 bg-[#0a0a0a]">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {/* Swapped: Premiered Left, Status Top (Handled above), so here we put Premiered */}
                    <div className="bg-white/5 p-2 rounded-full border border-white/5 flex items-center justify-between px-4">
                        <span className="text-red-500 font-bold">Premiered</span>
                        <span className="text-zinc-300 truncate">{anime.moreInfo.premiered}</span>
                    </div>
                    {/* Studios */}
                    <div className="bg-white/5 p-2 rounded-full border border-white/5 flex items-center justify-between px-4 relative group">
                        <span className="text-red-500 font-bold">Studios</span>
                        <span className="text-zinc-300 truncate max-w-[80px]">{Array.isArray(anime.moreInfo.studios) ? anime.moreInfo.studios[0] : 'N/A'}</span>
                        {/* Popup */}
                        {Array.isArray(anime.moreInfo.studios) && anime.moreInfo.studios.length > 1 && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-black border border-white/10 rounded p-2 hidden group-hover:block z-50 shadow-xl">
                                {anime.moreInfo.studios.map((s:string) => <Link key={s} href={`/search?studio=${s}`} className="block text-xs text-zinc-400 hover:text-white py-1">{s}</Link>)}
                            </div>
                        )}
                    </div>
                     {/* Producers */}
                     <div className="bg-white/5 p-2 rounded-full border border-white/5 flex items-center justify-between px-4 relative group">
                        <span className="text-red-500 font-bold">Producers</span>
                        <span className="text-zinc-300 truncate max-w-[80px]">{Array.isArray(anime.moreInfo.producers) ? anime.moreInfo.producers[0] : 'N/A'}</span>
                        {Array.isArray(anime.moreInfo.producers) && anime.moreInfo.producers.length > 1 && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-black border border-white/10 rounded p-2 hidden group-hover:block z-50 shadow-xl">
                                {anime.moreInfo.producers.map((p:string) => <div key={p} className="text-xs text-zinc-400 hover:text-white py-1">{p}</div>)}
                            </div>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RELATED & SEASONS (Inline Width Fix) */}
      {(related.length > 0) && (
         <div className="flex items-center justify-center my-8 px-4 md:px-8">
            <div className="w-full max-w-[1400px] grid grid-cols-1">
               <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 overflow-hidden relative">
                  <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" /><h4 className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Related Anime</h4></div>
                  <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-red-600/50 scrollbar-track-transparent">
                      <div className="flex gap-4 w-max">
                         {related.map((rel: any, idx: number) => (
                            <div key={`${rel.id}-${idx}`} onClick={() => router.push(`/watch/${rel.id}`)} className="group flex items-center gap-3 p-2 pr-6 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300 min-w-[220px]">
                                <img src={rel.image || rel.poster} className="w-12 h-16 rounded-md object-cover shadow-md" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-red-400 truncate w-[140px]">{rel.title}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase mt-1">{rel.type} • {rel.totalEpisodes || '?'} eps</span>
                                </div>
                            </div>
                         ))}
                      </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* BOTTOM GRID */}
      <div className="w-full flex justify-center mt-8">
        <div className="w-full max-w-[1400px] px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
           {/* Recommended */}
           <div className="xl:col-span-4 h-[600px] flex flex-col bg-[#0a0a0a] rounded-xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/5"><h3 className="font-bold text-white flex items-center gap-2"><Heart size={16} className="text-pink-500"/> Recommended</h3></div>
              <div className="flex-1 overflow-hidden p-2">
                 <ScrollArea className="h-full pr-2">
                    <div className="space-y-2">
                       {recommendations.map((rec: any, idx: number) => (
                          <div key={`${rec.id}-${idx}`} onClick={() => router.push(`/watch/${rec.id}`)} className="flex gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                              <img src={rec.image || rec.poster} className="w-16 h-24 object-cover rounded shadow-lg" />
                              <div className="flex-1 py-1">
                                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-red-400 line-clamp-2">{rec.title}</h4>
                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 border border-white/5">{rec.type}</span>
                                      <span>{rec.totalEpisodes} Eps</span>
                                  </div>
                              </div>
                          </div>
                       ))}
                    </div>
                 </ScrollArea>
              </div>
           </div>

           {/* Characters */}
           <div className="xl:col-span-8 h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 bg-white/5 border-b border-white/5"><h3 className="font-bold text-white flex items-center gap-2"><User size={16} className="text-blue-500"/> Characters & Voice Actors</h3></div>
              <ScrollArea className="flex-1 p-4">
                 {characters.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {characters.map((char: any, i: number) => (
                           <Link href={`/search?q=${char.name}`} key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                  <img src={char.image || '/placeholder.png'} className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                                  <div className="text-left">
                                      <div className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">{char.name}</div>
                                      <div className="text-[10px] text-zinc-500">{char.role}</div>
                                  </div>
                              </div>
                              {char.voiceActor && (
                                  <div className="flex items-center gap-3 flex-row-reverse text-right pl-4 border-l border-white/10">
                                      <img src={char.voiceActor.image || '/placeholder.png'} className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                                      <div>
                                          <div className="text-xs font-bold text-zinc-200">{char.voiceActor.name}</div>
                                          <div className="text-[10px] text-zinc-500">Voice Actor</div>
                                      </div>
                                  </div>
                              )}
                           </Link>
                        ))}
                     </div>
                 ) : (
                     <div className="h-full flex flex-col items-center justify-center opacity-50 text-zinc-500">
                         <User size={32} />
                         <span className="text-xs mt-2">No Character Data Summoned</span>
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