import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Heart, Clock, AlertCircle, RefreshCw, Home,
  Tv, Play, Share2, Star, Calendar, Mic, User, 
  Grid, List, AlignJustify, Timer, ArrowRight,
  Lightbulb, LightbulbOff, ChevronDown, Gem, Bug, X, Terminal,
  FastForward, Users, Copy, Check, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API IMPORTS ---
import { 
  AnimeAPI, 
  AnimeAPI_V2, 
  V2AnimeInfo,
  V2EpisodeSchedule,
  V2Episode 
} from '@/lib/api'; 

// COMPONENT IMPORTS
import AnimePlayer from '@/components/Player/AnimePlayer'; 
import AnimeCard from '@/components/Anime/AnimeCard';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/hooks/useSettings';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

// --- TYPES ---
interface LocalServer {
  serverId: number;
  serverName: string;
}

interface LocalServerData {
  sub: LocalServer[];
  dub: LocalServer[];
  raw: LocalServer[];
}

interface ApiLog {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  data?: string;
  timestamp: string;
}

type EpisodeViewMode = 'tile' | 'list' | 'detail';

// --- SUB-COMPONENTS ---

const NextEpisodeTimer = ({ schedule }: { schedule: V2EpisodeSchedule | null }) => {
  const [timeLeft, setTimeLeft] = useState<string>("Unknown");

  useEffect(() => {
    if (!schedule?.airingTimestamp) {
        setTimeLeft("Unknown"); 
        return;
    }
    const updateTimer = () => {
      const now = Date.now() / 1000;
      const diff = schedule.airingTimestamp! - now;
      if (diff <= 0) { setTimeLeft("Aired"); return; }
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
    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/5 text-zinc-300 px-3 py-1 rounded-full border border-white/5">
      <Timer className="w-3 h-3 text-red-500" />
      <span>NEXT: {timeLeft}</span>
    </div>
  );
};

const WatchPartyButton = () => {
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  const createRoom = () => setRoomId(Math.random().toString(36).substring(7).toUpperCase());
  const copyLink = () => {
    navigator.clipboard.writeText(`https://shadow-garden.com/party/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 rounded-full px-3 h-8 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors">
            <Users size={12} />
            <span className="text-[10px] font-bold">PARTY</span>
        </div>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-center font-[Cinzel] text-xl text-blue-400">Summon Friends</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!roomId ? (
            <Button onClick={createRoom} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">Create Room</Button>
          ) : (
            <div className="flex items-center space-x-2">
                <Input value={`https://shadow-garden.com/party/${roomId}`} readOnly className="bg-white/5 border-white/10" />
                <Button size="icon" onClick={copyLink} className="bg-white/10">
                    {copied ? <Check className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4"/>}
                </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MagicStoneRating = () => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 w-fit mt-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Rate:</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(rating)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Gem size={14} className={`transition-colors duration-300 ${star <= (hover || rating) ? 'fill-purple-500 text-purple-500 shadow-[0_0_10px_purple]' : 'text-zinc-700'}`} />
                    </button>
                ))}
            </div>
        </div>
    );
};

const FantasyLoader = ({ text = "SUMMONING..." }) => (
  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#050505]">
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-[Cinzel] text-red-500 animate-pulse">{text}</h2>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function WatchClient({ animeId: propAnimeId }: { animeId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();

  const animeId = propAnimeId || params.id || "";

  // --- STATE ---
  const [info, setInfo] = useState<V2AnimeInfo | null>(null);
  const [episodes, setEpisodes] = useState<V2Episode[]>([]); // Use V2 Episodes
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
  const [autoSkip, setAutoSkip] = useState(true); 
  const [lightMode, setLightMode] = useState(true); 
  
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [epViewMode, setEpViewMode] = useState<EpisodeViewMode>('tile');

  // Debug Logs
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const addLog = (type: ApiLog['type'], message: string, data?: any) => {
    setLogs(prev => [{
      id: Date.now(), type, message,
      data: data ? JSON.stringify(data).slice(0, 100) : undefined,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 49)]);
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoadingInfo(true);
      addLog('info', 'Starting Initialization', { animeId });
      
      try {
        if (!animeId) throw new Error("No Anime ID provided");

        // 1. Fetch Info (V2) & Schedule (V2) & Episodes (V2)
        const [v2InfoData, v2EpData, scheduleData] = await Promise.all([
          AnimeAPI_V2.getAnimeInfo(animeId),
          AnimeAPI_V2.getEpisodes(animeId),
          AnimeAPI_V2.getNextEpisodeSchedule(animeId)
        ]);
        
        if (!isMounted) return;
        if (!v2InfoData) throw new Error("Anime info not found.");
        
        setInfo(v2InfoData);
        setNextEpSchedule(scheduleData);
        addLog('success', 'Info Loaded', v2InfoData.anime.info.name);

        // 2. Set Episodes
        if (v2EpData?.episodes && v2EpData.episodes.length > 0) {
           setEpisodes(v2EpData.episodes);
           addLog('success', 'V2 Episodes Loaded', `${v2EpData.episodes.length} eps`);
           
           // Determine current episode
           const urlEp = searchParams.get('ep');
           const foundEp = v2EpData.episodes.find((e) => e.episodeId === urlEp);
           
           if (foundEp) setCurrentEpId(foundEp.episodeId);
           else setCurrentEpId(v2EpData.episodes[0].episodeId);
        } else {
           throw new Error("No episodes found.");
        }
      } catch (err: any) {
        addLog('error', 'Init Failed', err.message);
        if (isMounted) setInfoError(err.message);
      } finally {
        if (isMounted) setIsLoadingInfo(false);
        setTimeout(() => setShowLogs(true), 5000); 
      }
    };
    init();
    return () => { isMounted = false; };
  }, [animeId]);

  // --- STREAM FETCH LOGIC (Auto-Retry) ---
  useEffect(() => {
    if (!currentEpId) return;
    setSearchParams(prev => { prev.set('ep', currentEpId); return prev; }, { replace: true });
    setStreamUrl(null);
    setIsStreamLoading(true);
    setStreamError(null);

    let isMounted = true;

    const fetchSource = async (serverName: string, categoryName: string) => {
       addLog('info', `Trying server: ${serverName} (${categoryName})`);
       const res = await AnimeAPI_V2.getEpisodeSources(currentEpId, serverName, categoryName as any);
       return res;
    };

    const loadStream = async () => {
      try {
        await new Promise(r => setTimeout(r, 200));
        
        const serverRes = await AnimeAPI_V2.getEpisodeServers(currentEpId);
        if (!isMounted) return;

        if (!serverRes) throw new Error("Failed to load server list");

        addLog('success', 'Servers Found', { sub: serverRes.sub.length, dub: serverRes.dub.length });
        
        const localServers = serverRes as unknown as LocalServerData;
        setServers(localServers);

        let activeCategory = category;
        const currentList = localServers[activeCategory] || [];
        
        if (currentList.length === 0) {
           if (localServers.sub.length > 0) activeCategory = 'sub';
           else if (localServers.dub.length > 0) activeCategory = 'dub';
           else if (localServers.raw.length > 0) activeCategory = 'raw';
           else throw new Error("No servers available for any category");
           
           addLog('info', `Switched category to ${activeCategory}`);
           setCategory(activeCategory);
        }

        const targetList = localServers[activeCategory];
        let foundSource = false;

        for (const server of targetList) {
           try {
              const sourceRes = await fetchSource(server.serverName, activeCategory);
              
              if (sourceRes?.sources?.length > 0) {
                 addLog('success', 'Stream Acquired', { server: server.serverName, url: sourceRes.sources[0].url });
                 
                 const bestSource = sourceRes.sources.find((s) => s.type === 'hls') || sourceRes.sources[0];
                 setStreamUrl(bestSource.url);
                 setIntro(sourceRes.intro);
                 setOutro(sourceRes.outro);
                 setSelectedServerName(server.serverName);
                 foundSource = true;
                 break;
              }
           } catch (e) {
              addLog('error', `Failed ${server.serverName}`, e);
           }
        }

        if (!foundSource) {
           throw new Error("All servers failed to return a stream.");
        }

      } catch (error: any) {
        addLog('error', 'Stream Error', error.message);
        if (isMounted) setStreamError("Stream unavailable. Try another server manually.");
      } finally {
        if (isMounted) setIsStreamLoading(false);
      }
    };

    loadStream();
    return () => { isMounted = false; };
  }, [currentEpId, category]);

  // --- HELPERS ---
  const currentEpIndex = useMemo(() => episodes.findIndex(e => e.episodeId === currentEpId), [episodes, currentEpId]);
  const currentEpisode = episodes[currentEpIndex];
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEpisode = currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  const episodeChunks = useMemo(() => {
    const chunks = [];
    const chunkSize = epViewMode === 'detail' ? 50 : 100; 
    for (let i = 0; i < episodes.length; i += chunkSize) chunks.push(episodes.slice(i, i + chunkSize));
    return chunks;
  }, [episodes, epViewMode]);

  const handleEpisodeClick = (id: string) => {
    if (id === currentEpId) return;
    setCurrentEpId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingInfo) return <FantasyLoader text="SUMMONING ANIME..." />;
  if (infoError || !info) return <div>Error: {infoError}</div>;

  const { info: details, moreInfo } = info.anime;
  const producersList = moreInfo.producers || moreInfo.studios?.split(',').map(s => s.trim()) || ["Unknown"];
  const studiosList = moreInfo.studios?.split(',').map(s => s.trim()) || ["Unknown"];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 relative font-sans">
      
      {/* LIGHTS OFF OVERLAY */}
      <div className={`fixed inset-0 bg-black z-40 transition-opacity duration-500 pointer-events-none ${lightMode ? 'opacity-0' : 'opacity-95'}`} />

      {/* DEBUG POPUP */}
      {showLogs && (
        <div className="fixed top-20 right-4 z-[100] w-96 bg-black/95 border border-red-500/30 rounded-lg p-4 font-mono text-[10px] shadow-2xl animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                <span className="text-red-500 font-bold flex items-center gap-2"><Bug size={14}/> API DEBUGGER</span>
                <button onClick={() => setShowLogs(false)}><X size={14} className="hover:text-white"/></button>
            </div>
            <ScrollArea className="h-64 pr-2">
               {logs.map(log => (
                  <div key={log.id} className="mb-2 border-b border-white/5 pb-1">
                     <div className={`font-bold ${log.type==='success'?'text-green-400':log.type==='error'?'text-red-400':'text-blue-400'}`}>
                        [{log.type.toUpperCase()}] {log.timestamp}
                     </div>
                     <div className="text-zinc-300">{log.message}</div>
                     {log.data && <div className="text-zinc-600 truncate">{log.data}</div>}
                  </div>
               ))}
            </ScrollArea>
        </div>
      )}

      {/* === PLAYER SECTION === */}
      <div className="w-full relative z-50 flex justify-center bg-[#050505]">
        <div className="w-full max-w-[1400px] px-4 md:px-8 mt-6">
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl relative">
                {isStreamLoading ? (
                    <FantasyLoader text="CONNECTING..." />
                ) : streamError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                        <AlertCircle className="text-red-500 w-12 h-12" />
                        <span>Stream Unavailable</span>
                        <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
                    </div>
                ) : streamUrl ? (
                    <AnimePlayer 
                        url={streamUrl} 
                        intro={intro} 
                        outro={outro} 
                        autoSkip={autoSkip} 
                        onEnded={() => { if(autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.episodeId); }}
                        onNext={nextEpisode ? () => handleEpisodeClick(nextEpisode.episodeId) : undefined}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><Tv size={48} className="text-zinc-800"/></div>
                )}
            </div>
        </div>
      </div>

      {/* === CONTROLS BAR === */}
      <div className="w-full flex justify-center bg-[#0a0a0a] border-b border-white/5 relative z-50">
        <div className="w-full max-w-[1400px] px-4 md:px-8 py-3 flex flex-col lg:flex-row gap-4 justify-between items-center">
          
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

          <div className="flex items-center gap-4">
             {currentEpisode?.number > 1 && prevEpisode && (
                <Button onClick={() => handleEpisodeClick(prevEpisode.episodeId)} className="rounded-full px-4 h-8 text-xs font-bold bg-white/5 text-zinc-400 hover:bg-red-600 hover:text-white transition-all duration-300 group">
                    <SkipBack size={12} className="mr-2 group-hover:fill-white" /> Prev
                </Button>
             )}

             <Button onClick={() => setLightMode(!lightMode)} variant="ghost" size="icon" className="rounded-full w-8 h-8 hover:bg-white/10 text-yellow-500">
                {lightMode ? <Lightbulb size={16} /> : <LightbulbOff size={16} />}
             </Button>

             <WatchPartyButton />

             <div onClick={() => setAutoSkip(!autoSkip)} className="flex items-center gap-2 bg-white/5 rounded-full px-3 h-8 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <FastForward size={12} className={autoSkip ? 'text-blue-400' : 'text-zinc-600'} />
                <span className={`text-[10px] font-bold ${autoSkip ? 'text-white' : 'text-zinc-500'}`}>SKIP</span>
             </div>

             <div onClick={() => setAutoPlay(!autoPlay)} className="flex items-center gap-2 bg-white/5 rounded-full px-3 h-8 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <div className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-600'}`} />
                <span className={`text-[10px] font-bold ${autoPlay ? 'text-white' : 'text-zinc-500'}`}>AUTO</span>
             </div>

             {nextEpisode && (
                <Button onClick={() => handleEpisodeClick(nextEpisode.episodeId)} className="rounded-full px-5 h-8 text-xs font-bold bg-white/5 text-zinc-200 hover:bg-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300 group">
                    Next <SkipForward size={12} className="ml-2 group-hover:fill-white" />
                </Button>
             )}

             <div className="flex bg-black/40 rounded-full p-1 border border-white/10 ml-2">
                {(['sub', 'dub', 'raw'] as const).map((cat) => (
                   <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${category === cat ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>
                      {cat}
                   </button>
                ))}
             </div>
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="h-8 gap-2 text-xs font-bold text-zinc-400 hover:text-white">
                      <ServerIcon size={12}/> Server <ChevronDown size={12}/>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-zinc-300">
                   {servers?.[category]?.map((srv, idx) => (
                      <DropdownMenuItem 
                        key={srv.serverId} 
                        onClick={() => setSelectedServerName(srv.serverName)}
                        className={`text-xs cursor-pointer ${selectedServerName === srv.serverName ? 'text-red-500 bg-white/5' : ''}`}
                      >
                         Portal-{idx + 1} ({srv.serverName})
                      </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
             </DropdownMenu>

          </div>
        </div>
      </div>

      {/* === TOP GRID === */}
      <div className="w-full flex justify-center mt-8">
        <div className="w-full max-w-[1400px] px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
           
           {/* LEFT: EPISODES */}
           <div className="xl:col-span-4 h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
              <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                 <h3 className="font-bold text-gray-100 flex items-center gap-2">
                    <Layers size={16} className="text-red-500"/> Episodes
                    <Badge className="ml-2 bg-white text-black hover:bg-white text-[10px]">{episodes.length}</Badge>
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
                              <button key={idx} onClick={() => setEpChunkIndex(idx)} className={`px-3 py-0.5 text-[10px] font-bold rounded transition-all whitespace-nowrap ${epChunkIndex === idx ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-500'}`}>
                                 {(idx * (epViewMode === 'detail' ? 50 : 100)) + 1} - {Math.min((idx + 1) * (epViewMode === 'detail' ? 50 : 100), episodes.length)}
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
                       const isCurrent = ep.episodeId === currentEpId;
                       
                       // 1. TILE VIEW
                       if (epViewMode === 'tile') {
                          return (
                             <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={`aspect-square rounded flex flex-col items-center justify-center border transition-all relative ${isCurrent ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                                <span className="text-xs font-bold">{ep.number}</span>
                                {ep.isFiller && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full"/>}
                             </button>
                          );
                       }
                       
                       // 2. COMPACT LIST VIEW
                       if (epViewMode === 'list') {
                          return (
                             <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${isCurrent ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                                <span>Episode {ep.number}</span>
                                {ep.isFiller && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-1 rounded">FILLER</span>}
                             </button>
                          );
                       }

                       // 3. DETAILED LIST VIEW (Added Back)
                       if (epViewMode === 'detail') {
                          return (
                             <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={`flex items-center gap-3 px-3 py-3 rounded text-left transition-all border border-transparent ${isCurrent ? 'bg-red-600/10 border-red-600/30' : 'bg-white/5 hover:bg-white/10'}`}>
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

           {/* RIGHT: DETAILS */}
           <div className="xl:col-span-8 h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl relative">
              <div className="flex-shrink-0 relative p-6 pt-10 flex flex-col sm:flex-row gap-6 bg-gradient-to-b from-white/5 to-transparent">
                 <img src={details.poster} className="w-32 h-48 rounded-lg shadow-2xl border border-white/10 object-cover flex-shrink-0 mx-auto sm:mx-0 z-20 -mt-2" />
                 <div className="flex-1 pt-2 text-center sm:text-left z-10">
                    <h1 className="text-2xl md:text-3xl font-black text-white font-[Cinzel] leading-tight">{details.name}</h1>
                    {details.jname && <p className="text-xs text-zinc-500 mt-1 italic line-clamp-1">{details.jname}</p>}
                    
                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start items-center">
                       <Badge className="bg-red-600 hover:bg-red-700">{details.stats.quality}</Badge>
                       <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-black/40">{details.stats.type}</Badge>
                       <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-black/40">{details.stats.rating}</Badge>
                       <div className="flex items-center gap-1 text-xs text-zinc-400 ml-2 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                          <Clock className="w-3 h-3"/> {details.stats.duration}
                       </div>
                       <div className="flex items-center gap-1 text-[10px] text-zinc-500 border-l border-zinc-700 pl-2 ml-1">
                          Premiered: {moreInfo.aired?.split('to')[0]}
                       </div>
                       <div className="flex items-center gap-1 text-xs text-green-400 ml-2 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-900/30 font-bold">
                          MAL: {info.anime.info.stats.rating || 'N/A'}
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3 justify-center sm:justify-start">
                       {moreInfo.genres.map(g => (
                          <span key={g} className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-zinc-400 border border-white/5 hover:text-white transition-colors">{g}</span>
                       ))}
                    </div>
                    
                    <MagicStoneRating />
                 </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                 <ScrollArea className="h-full px-6">
                    <p className="text-gray-300 text-sm leading-relaxed pb-4">{details.description}</p>
                    
                    {/* ADDED PROMOTIONAL VIDEOS SECTION */}
                    {details.promotionalVideos.length > 0 && (
                        <div className="mt-6 mb-4">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Video size={14} className="text-red-500" /> Promotional Videos
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {details.promotionalVideos.map((pv, idx) => (
                                    <a key={idx} href={pv.source} target="_blank" rel="noopener noreferrer" className="block relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                        <img src={pv.thumbnail} alt={pv.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/50 p-2 rounded-full border border-white/20 group-hover:scale-110 transition-transform">
                                                <Play size={16} className="text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1 text-[10px] truncate">
                                            {pv.title}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                 </ScrollArea>
              </div>

              <div className="flex-shrink-0 p-4 border-t border-white/5 bg-[#0a0a0a]">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                       <span className="text-red-500 font-bold block mb-1">Studios</span>
                       {studiosList.length > 1 ? (
                           <DropdownMenu>
                               <DropdownMenuTrigger className="flex items-center gap-1 text-zinc-300 hover:text-white">
                                   {studiosList[0]} <ChevronDown size={10}/>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent className="bg-black border-white/10">
                                   {studiosList.map(s => <DropdownMenuItem key={s}>{s}</DropdownMenuItem>)}
                               </DropdownMenuContent>
                           </DropdownMenu>
                       ) : <span className="text-zinc-300 truncate block">{studiosList[0]}</span>}
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                       <span className="text-red-500 font-bold block mb-1">Aired</span>
                       <span className="text-zinc-300 truncate block">{moreInfo.aired}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                       <span className="text-red-500 font-bold block mb-1">Status</span>
                       <span className="text-zinc-300 uppercase">{moreInfo.status}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                       <span className="text-red-500 font-bold block mb-1">Producers</span>
                       {producersList.length > 1 ? (
                           <DropdownMenu>
                               <DropdownMenuTrigger className="flex items-center gap-1 text-zinc-300 hover:text-white">
                                   {producersList[0]} <ChevronDown size={10}/>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent className="bg-black border-white/10">
                                   {producersList.map(p => <DropdownMenuItem key={p}>{p}</DropdownMenuItem>)}
                               </DropdownMenuContent>
                           </DropdownMenu>
                       ) : <span className="text-zinc-300 truncate block">{producersList[0]}</span>}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* === MIDDLE SECTION === */}
      {(info.seasons.length > 0 || (info.relatedAnimes.length > 0 && info.relatedAnimes[0].id !== info.mostPopularAnimes?.[0]?.id)) && (
         <div className="flex items-center justify-center my-12 px-4 md:px-8 min-h-[150px]">
            <div className="w-full max-w-[1400px]">
               <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-purple-600" />
                  
                  {info.seasons.length > 0 && (
                     <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                           <h4 className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Seasons</h4>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                           <div className="flex gap-4 w-max">
                              {info.seasons.map((season) => (
                                 <div key={season.id} onClick={() => navigate(`/watch/${season.id}`)} className={`group flex items-center gap-3 p-1.5 pr-6 rounded-full border cursor-pointer transition-all duration-300 ${season.isCurrent ? 'bg-red-600/10 border-red-500/50' : 'bg-black/40 border-white/10'}`}>
                                    <img src={season.poster} className="w-10 h-10 rounded-full object-cover" />
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white">{season.title || season.name}</span>
                                 </div>
                              ))}
                           </div>
                           <ScrollBar orientation="horizontal"/>
                        </ScrollArea>
                     </div>
                  )}

                  {info.relatedAnimes.length > 0 && (
                     <div>
                        <div className="flex items-center gap-2 mb-3">
                           <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                           <h4 className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Related</h4>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                           <div className="flex gap-4 w-max">
                              {info.relatedAnimes.map((rel) => (
                                 <div key={rel.id} onClick={() => navigate(`/watch/${rel.id}`)} className="group flex items-center gap-3 p-1.5 pr-6 rounded-full bg-black/40 border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300">
                                    <img src={rel.poster} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold text-zinc-400 group-hover:text-white">{rel.name}</span>
                                       <span className="text-[9px] text-zinc-600 uppercase">{rel.type}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <ScrollBar orientation="horizontal"/>
                        </ScrollArea>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* === BOTTOM ROW === */}
      <div className="w-full flex justify-center mt-8">
        <div className="w-full max-w-[1400px] px-4 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
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
                                <h4 className="text-xs font-bold text-gray-200 group-hover:text-purple-400 line-clamp-2">{rec.name}</h4>
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

    </div>
  );
}