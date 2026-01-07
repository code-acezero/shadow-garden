import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Heart, Clock, AlertCircle, RefreshCw, Home,
  Tv, Play, Share2, Star, Calendar, Mic, User, 
  Grid, List, AlignJustify, Timer, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API IMPORTS ---
import { 
  AnimeAPI, 
  AnimeAPI_V2, 
  V2AnimeInfo,
  V2EpisodeSchedule 
} from '@/lib/api'; 

// COMPONENT IMPORTS
import AnimePlayer from '@/components/Player/AnimePlayer'; 
import AnimeCard from '@/components/Anime/AnimeCard';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/hooks/useSettings';
import { Separator } from '@/components/ui/separator';

// --- TYPES ---
interface LocalServerData {
  sub: Array<{ serverId: number; serverName: string }>;
  dub: Array<{ serverId: number; serverName: string }>;
  raw: Array<{ serverId: number; serverName: string }>;
}

type EpisodeViewMode = 'tile' | 'list' | 'detail';

// --- NEXT EPISODE COUNTDOWN ---
const NextEpisodeTimer = ({ schedule }: { schedule: V2EpisodeSchedule | null }) => {
  if (!schedule?.airingTimestamp) return null;

  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now() / 1000;
      const diff = schedule.airingTimestamp! - now;
      if (diff <= 0) { setTimeLeft("Airing Now"); return; }
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  }, [schedule]);

  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-red-900/20 text-red-400 px-3 py-1 rounded border border-red-900/30 ml-4 hidden lg:flex">
      <Timer className="w-3 h-3 animate-pulse" />
      <span>NEXT: {timeLeft}</span>
    </div>
  );
};

// --- FANTASY LOADER ---
const FantasyLoader = ({ text = "SUMMONING..." }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden bg-[#050505]">
    <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 to-purple-900/10 animate-pulse" />
    <div className="relative z-10 flex flex-col items-center">
      <div className="relative w-24 h-24 mb-8">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1], borderRadius: ["50%", "40%", "50%"] }} 
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-red-600 blur-md rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-2 h-2 bg-white rounded-full animate-ping" />
        </div>
      </div>
      <h2 className="text-xl md:text-2xl font-[Cinzel] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 tracking-[0.2em] animate-pulse">
        {text}
      </h2>
    </div>
  </div>
);

export default function WatchClient({ animeId: propAnimeId }: { animeId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();

  const animeId = propAnimeId || params.id || "";

  // --- STATE ---
  const [info, setInfo] = useState<V2AnimeInfo | null>(null);
  const [baseEpisodes, setBaseEpisodes] = useState<any[]>([]); 
  const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  const [intro, setIntro] = useState<{ start: number; end: number } | undefined>();
  const [outro, setOutro] = useState<{ start: number; end: number } | undefined>();
  const [servers, setServers] = useState<LocalServerData | null>(null);
  
  const [category, setCategory] = useState<'sub' | 'dub' | 'raw'>('sub');
  const [selectedServerName, setSelectedServerName] = useState<string>('hd-1'); 
  const [autoPlay, setAutoPlay] = useState(settings.autoPlay); 
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  
  const [epViewMode, setEpViewMode] = useState<EpisodeViewMode>('tile');

  // --- 1. INITIAL LOAD (Hybrid) ---
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      console.log(`[Watch] Initializing Hybrid Data for ID: ${animeId}`);
      setIsLoadingInfo(true);
      setInfoError(null);
      
      try {
        if (!animeId) throw new Error("No Anime ID provided");

        const [v2InfoData, baseData, scheduleData] = await Promise.all([
          AnimeAPI_V2.getAnimeInfo(animeId),
          AnimeAPI.getAnimeInfo(animeId), 
          AnimeAPI_V2.getNextEpisodeSchedule(animeId)
        ]);
        
        if (!isMounted) return;
        if (!v2InfoData) throw new Error("Anime info not found.");
        
        setInfo(v2InfoData);
        setNextEpSchedule(scheduleData);

        if (baseData?.episodes && baseData.episodes.length > 0) {
           setBaseEpisodes(baseData.episodes);
           const urlEp = searchParams.get('ep');
           const foundEp = baseData.episodes.find((e) => e.id === urlEp);
           if (foundEp) setCurrentEpId(foundEp.id);
           else setCurrentEpId(baseData.episodes[0].id);
        } else {
           const v2EpData = await AnimeAPI_V2.getEpisodes(animeId);
           if (v2EpData?.episodes) {
              setBaseEpisodes(v2EpData.episodes.map(e => ({
                 id: e.episodeId,
                 number: e.number,
                 title: e.title,
                 isFiller: e.isFiller
              })));
              if (v2EpData.episodes.length > 0) setCurrentEpId(v2EpData.episodes[0].episodeId);
           } else {
              setInfoError("No episodes found.");
           }
        }
      } catch (err: any) {
        console.error("[Watch] Init Failed:", err);
        if (isMounted) setInfoError(err.message || "Failed to load anime info.");
      } finally {
        if (isMounted) setIsLoadingInfo(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [animeId]);

  // --- 2. FETCH STREAM ---
  useEffect(() => {
    if (!currentEpId) return;
    setSearchParams(prev => { prev.set('ep', currentEpId); return prev; }, { replace: true });
    setStreamUrl(null);
    setStreamError(null);
    setIsStreamLoading(true);

    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted && isStreamLoading) {
        setIsStreamLoading(false);
        setStreamError("Server timed out.");
      }
    }, 20000);

    const loadStream = async () => {
      try {
        await new Promise(r => setTimeout(r, 100));
        const serverRes = await AnimeAPI_V2.getEpisodeServers(currentEpId);
        if (!isMounted) return;

        let activeServer = selectedServerName;
        let activeCategory = category;

        if (serverRes) {
           const localServers = serverRes as unknown as LocalServerData;
           setServers(localServers);
           const subList = localServers.sub || [];
           const dubList = localServers.dub || [];
           const rawList = localServers.raw || [];

           if (activeCategory === 'sub' && subList.length === 0) {
              if (dubList.length > 0) activeCategory = 'dub';
              else if (rawList.length > 0) activeCategory = 'raw';
           }
           if (activeCategory !== category) {
             setCategory(activeCategory);
             return; 
           }
           const currentList = localServers[activeCategory] || [];
           const serverExists = currentList.find(s => s.serverName === activeServer);
           if (!serverExists && currentList.length > 0) {
             activeServer = currentList[0].serverName;
             setSelectedServerName(activeServer);
           }
        }

        await new Promise(r => setTimeout(r, 200));
        const sourceRes = await AnimeAPI_V2.getEpisodeSources(currentEpId, activeServer, activeCategory);
        if (!isMounted) return;

        if (sourceRes?.sources && sourceRes.sources.length > 0) {
          const bestSource = sourceRes.sources.find((s) => s.type === 'hls') || sourceRes.sources[0];
          setStreamUrl(bestSource.url);
          setIntro(sourceRes.intro);
          setOutro(sourceRes.outro);
        } else {
          throw new Error("No video sources found.");
        }
      } catch (error: any) {
        console.error("[Watch] Stream Failed:", error);
        if (isMounted) setStreamError("Stream unavailable.");
      } finally {
        if (isMounted) {
          setIsStreamLoading(false);
          clearTimeout(timeout);
        }
      }
    };
    loadStream();
    return () => { isMounted = false; clearTimeout(timeout); };
  }, [currentEpId, selectedServerName, category]);

  // --- HELPERS ---
  const currentEpIndex = useMemo(() => baseEpisodes.findIndex(e => e.id === currentEpId), [baseEpisodes, currentEpId]);
  const currentEpisode = baseEpisodes[currentEpIndex];
  const prevEpisode = currentEpIndex > 0 ? baseEpisodes[currentEpIndex - 1] : null;
  const nextEpisode = currentEpIndex < baseEpisodes.length - 1 ? baseEpisodes[currentEpIndex + 1] : null;

  const episodeChunks = useMemo(() => {
    const chunks = [];
    const chunkSize = epViewMode === 'detail' ? 50 : 100; 
    for (let i = 0; i < baseEpisodes.length; i += chunkSize) chunks.push(baseEpisodes.slice(i, i + chunkSize));
    return chunks;
  }, [baseEpisodes, epViewMode]);

  const handleEpisodeClick = (id: string) => {
    if (id === currentEpId) return;
    setCurrentEpId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mapToCard = (item: any) => ({
    id: item.id,
    title: item.title || item.name,
    image: item.image || item.poster,
    type: item.type,
    duration: item.duration,
    episodes: item.episodes?.sub || item.episodes, 
  });

  if (isLoadingInfo) return <FantasyLoader text="SUMMONING ANIME..." />;

  if (infoError || !info) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Summoning Failed</h2>
        <p className="text-gray-400 mb-6 max-w-md font-mono text-sm">{infoError}</p>
        <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const { info: details, moreInfo } = info.anime;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20">
      
      {/* === PLAYER SECTION === */}
      {/* SHRUNK PAGE LAYOUT: Added padding and constrained width */}
      <div className="w-full bg-black relative shadow-2xl shadow-red-900/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 aspect-video md:aspect-[21/9] lg:aspect-[16/9] max-h-[85vh] relative z-10 bg-black my-6 rounded-xl overflow-hidden border border-white/5">
          {isStreamLoading ? (
             <FantasyLoader text="FETCHING STREAM..." />
          ) : streamError ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-center p-6 gap-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">Stream Unavailable</h3>
                <div className="grid grid-cols-2 gap-3">
                   <Button onClick={() => setSelectedServerName('vidstreaming')} variant="outline">Try Vidstreaming</Button>
                   <Button onClick={() => setSelectedServerName('megacloud')} variant="outline">Try MegaCloud</Button>
                </div>
             </div>
          ) : streamUrl ? (
            <AnimePlayer 
              url={streamUrl} 
              intro={intro}
              outro={outro}
              onEnded={() => { if(autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.id); }}
              onNext={nextEpisode ? () => handleEpisodeClick(nextEpisode.id) : undefined}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
               <Tv className="w-16 h-16 text-gray-700" />
               <p>SELECT AN EPISODE</p>
            </div>
          )}
        </div>
      </div>

      {/* === CONTROLS BAR (Not Sticky) === */}
      <div className="bg-[#0a0a0a] border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-white font-[Cinzel]">EP {currentEpisode?.number || '?'}</span>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                   <span className="text-[10px] text-red-500 font-bold uppercase">Now Playing</span>
                   <span className="text-sm text-gray-300 truncate max-w-[200px]">
                     {currentEpisode?.title || `Episode ${currentEpisode?.number || ''}`}
                   </span>
                </div>
                <NextEpisodeTimer schedule={nextEpSchedule} />
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5">
                <Button onClick={() => setAutoPlay(!autoPlay)} className={`rounded-full px-4 h-8 text-xs font-bold gap-2 ${autoPlay ? 'text-green-400 bg-green-900/20' : 'text-gray-400'}`}>
                   <div className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-600'}`} />
                   AUTOPLAY
                </Button>
             </div>
             {nextEpisode && (
               <Button onClick={() => handleEpisodeClick(nextEpisode.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                  Next <SkipForward className="ml-2 h-4 w-4" />
               </Button>
             )}
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                {(['sub', 'dub', 'raw'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    disabled={!servers?.[cat]?.length}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${category === cat ? 'bg-red-600 text-white' : 'text-gray-500'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* === TOP ROW: EPISODES (LEFT) & DETAILS (RIGHT) === */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* === LEFT: EPISODES (Fixed Height) === */}
        <div className="xl:col-span-4 h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
           <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-gray-100 flex items-center gap-2">
                 <Layers size={16} className="text-red-500"/> Episodes
                 <Badge className="ml-2 bg-white/10 text-[10px]">{baseEpisodes.length}</Badge>
              </h3>
              
              <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                 <button onClick={() => setEpViewMode('tile')} className={`p-1.5 rounded ${epViewMode === 'tile' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><Grid size={14}/></button>
                 <button onClick={() => setEpViewMode('list')} className={`p-1.5 rounded ${epViewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><List size={14}/></button>
                 <button onClick={() => setEpViewMode('detail')} className={`p-1.5 rounded ${epViewMode === 'detail' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><AlignJustify size={14}/></button>
              </div>
           </div>

           {episodeChunks.length > 1 && (
              <div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 h-10 overflow-hidden">
                 <ScrollArea className="w-full h-full whitespace-nowrap">
                    <div className="flex items-center p-2 gap-2 w-max">
                        {episodeChunks.map((_, idx) => (
                           <button
                              key={idx}
                              onClick={() => setEpChunkIndex(idx)}
                              className={`px-3 py-0.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${epChunkIndex === idx ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-500'}`}
                            >
                               {(idx * (epViewMode === 'detail' ? 50 : 100)) + 1} - {Math.min((idx + 1) * (epViewMode === 'detail' ? 50 : 100), baseEpisodes.length)}
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                 </ScrollArea>
              </div>
           )}

           <ScrollArea className="flex-1 p-2">
              <div className={`${epViewMode === 'tile' ? 'grid grid-cols-5 gap-2' : 'flex flex-col gap-1'}`}>
                 {episodeChunks[epChunkIndex]?.map((ep) => {
                    const isCurrent = ep.id === currentEpId;
                    
                    if (epViewMode === 'tile') {
                       return (
                          <button key={ep.id} onClick={() => handleEpisodeClick(ep.id)} className={`aspect-square rounded flex flex-col items-center justify-center border transition-all relative ${isCurrent ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                             <span className="text-xs font-bold">{ep.number}</span>
                             {ep.isFiller && <span className="absolute top-1 right-1 w-1 h-1 bg-orange-500 rounded-full"/>}
                          </button>
                       );
                    }
                    if (epViewMode === 'list') {
                       return (
                          <button key={ep.id} onClick={() => handleEpisodeClick(ep.id)} className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${isCurrent ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                             <span>Episode {ep.number}</span>
                             {ep.isFiller && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-1 rounded">FILLER</span>}
                          </button>
                       );
                    }
                    if (epViewMode === 'detail') {
                       return (
                          <button key={ep.id} onClick={() => handleEpisodeClick(ep.id)} className={`flex items-center gap-3 px-3 py-3 rounded text-left transition-all border border-transparent ${isCurrent ? 'bg-red-600/10 border-red-600/30' : 'bg-white/5 hover:bg-white/10'}`}>
                             <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-red-600 text-white' : 'bg-black/40 text-zinc-500'}`}>{ep.number}</div>
                             <div className="flex-1 min-w-0">
                                <div className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-zinc-300'}`}>{ep.title || `Episode ${ep.number}`}</div>
                                <div className="text-[10px] text-zinc-600">{ep.isFiller ? 'Filler Episode' : 'Canon'}</div>
                             </div>
                             <Play size={12} className={isCurrent ? 'text-red-500' : 'text-zinc-700'} />
                          </button>
                       );
                    }
                 })}
              </div>
           </ScrollArea>
        </div>

        {/* === RIGHT: DETAILS PANE (Fixed Height, Refactored Layout) === */}
        <div className="xl:col-span-8 h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl relative">
           {/* Background Banner */}
           <div className="absolute top-0 left-0 right-0 h-48 z-0">
              <img src={details.poster} className="w-full h-full object-cover opacity-20 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a]" />
           </div>

           {/* Scrollable Content */}
           <ScrollArea className="flex-1 z-10 p-6">
              {/* Header: Poster + Title Inline */}
              <div className="flex flex-col sm:flex-row gap-6 mt-12 mb-6">
                 {/* Floating Poster */}
                 <img 
                    src={details.poster} 
                    className="w-32 h-48 rounded-lg shadow-2xl border border-white/10 object-cover flex-shrink-0 mx-auto sm:mx-0 z-20 sm:-mt-8" 
                 />
                 
                 <div className="flex-1 pt-2 text-center sm:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-white font-[Cinzel] leading-tight">{details.name}</h1>
                    
                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                       <Badge className="bg-red-600 hover:bg-red-700">{details.stats.quality}</Badge>
                       <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-black/40">{details.stats.type}</Badge>
                       <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-black/40">{details.stats.rating}</Badge>
                       <div className="flex items-center gap-1 text-xs text-zinc-400 ml-2 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                          <Clock className="w-3 h-3"/> {details.stats.duration}
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3 justify-center sm:justify-start">
                       {moreInfo.genres.map(g => (
                          <span key={g} className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-zinc-400 border border-white/5">{g}</span>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Description */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                 <p className="text-gray-300 text-sm leading-relaxed">{details.description}</p>
              </div>

              <Separator className="my-6 bg-white/5" />

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-red-500 font-bold block mb-1">Studios</span>
                    <span className="text-zinc-300">{moreInfo.studios}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-red-500 font-bold block mb-1">Aired</span>
                    <span className="text-zinc-300">{moreInfo.aired}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-red-500 font-bold block mb-1">Status</span>
                    <span className="text-zinc-300 uppercase">{moreInfo.status}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-red-500 font-bold block mb-1">Score</span>
                    <span className="text-zinc-300">{details.stats.rating || 'N/A'}</span>
                 </div>
              </div>
           </ScrollArea>
        </div>

      </div>

      {/* === 2. MIDDLE SECTION: SEASONS & RELATED (Vertically & Horizontally Centered) === */}
      {(info.seasons.length > 0 || info.relatedAnimes.length > 0) && (
         <div className="flex items-center justify-center my-12 px-4 md:px-8 min-h-[150px]">
            <div className="w-full max-w-[1400px]">
               <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 overflow-hidden relative">
                  
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-purple-600" />

                  {/* SEASONS ROW */}
                  {info.seasons.length > 0 && (
                     <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                           <h4 className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Seasons</h4>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                           <div className="flex gap-4 w-max">
                              {info.seasons.map((season) => (
                                 <div 
                                    key={season.id} 
                                    onClick={() => navigate(`/watch/${season.id}`)}
                                    className={`
                                       group flex items-center gap-3 p-1.5 pr-6 rounded-full border cursor-pointer transition-all duration-300
                                       ${season.isCurrent 
                                          ? 'bg-red-600/10 border-red-500/50 hover:bg-red-600/20' 
                                          : 'bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30'
                                       }
                                    `}
                                 >
                                    <img src={season.poster} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                    <div className="flex flex-col">
                                       <span className={`text-xs font-bold ${season.isCurrent ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                                          {season.title || season.name}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <ScrollBar orientation="horizontal" className="bg-white/5 h-1.5" />
                        </ScrollArea>
                     </div>
                  )}

                  {/* RELATED ANIMES ROW */}
                  {info.relatedAnimes.length > 0 && (
                     <div>
                        <div className="flex items-center gap-2 mb-3">
                           <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                           <h4 className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Related</h4>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                           <div className="flex gap-4 w-max">
                              {info.relatedAnimes.map((rel) => (
                                 <div 
                                    key={rel.id} 
                                    onClick={() => navigate(`/watch/${rel.id}`)}
                                    className="group flex items-center gap-3 p-1.5 pr-6 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                                 >
                                    <img src={rel.poster} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold text-zinc-400 group-hover:text-white">
                                          {rel.name}
                                       </span>
                                       <span className="text-[9px] text-zinc-600 uppercase">{rel.type}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <ScrollBar orientation="horizontal" className="bg-white/5 h-1.5" />
                        </ScrollArea>
                     </div>
                  )}

               </div>
            </div>
         </div>
      )}

      {/* === BOTTOM ROW: RECOMMENDED & CAST (Fixed Height 600px) === */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
         
         {/* 7. RECOMMENDED (Left, Smaller) */}
         <div className="xl:col-span-4 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-1 h-5 bg-purple-600 rounded-full" />
               <h3 className="font-bold text-white">Recommended</h3>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl border border-white/5 flex-1 overflow-hidden shadow-xl p-2">
               <ScrollArea className="h-full pr-2">
                  <div className="space-y-2">
                     {info.recommendedAnimes.map((rec) => (
                        <div key={rec.id} onClick={() => navigate(`/watch/${rec.id}`)} className="flex gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                           <img src={rec.poster} className="w-16 h-20 object-cover rounded shadow-lg" />
                           <div className="flex-1 py-1">
                              <h4 className="text-xs font-bold text-gray-200 group-hover:text-purple-400 line-clamp-2 leading-tight">{rec.name}</h4>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                                 <span className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 border border-white/5">{rec.type}</span>
                                 <span>{rec.episodes?.sub} Eps</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </ScrollArea>
            </div>
         </div>

         {/* 6. CHARACTERS & VOICE ACTORS (Right, Side-by-Side) */}
         <div className="xl:col-span-8 h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
            <div className="p-4 bg-white/5 border-b border-white/5">
               <h3 className="font-bold text-white flex items-center gap-2">
                  <User size={16} className="text-blue-500"/> Characters & Voice Actors
               </h3>
            </div>
            <ScrollArea className="flex-1 p-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {details.characterVoiceActor?.map((cva, i) => (
                     <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                           <img src={cva.character.poster} className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                           <div className="text-left">
                              <div className="text-xs font-bold text-zinc-200">{cva.character.name}</div>
                              <div className="text-[10px] text-zinc-500">{cva.character.cast}</div>
                           </div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 mx-2" />
                        <div className="flex items-center gap-3 flex-row-reverse text-right">
                           <img src={cva.voiceActor.poster} className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                           <div>
                              <div className="text-xs font-bold text-zinc-200">{cva.voiceActor.name}</div>
                              <div className="text-[10px] text-zinc-500">{cva.voiceActor.cast}</div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </ScrollArea>
         </div>

      </div>
    </div>
  );
}