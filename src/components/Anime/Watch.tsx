import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Heart, Clock, Loader2, AlertCircle, RefreshCw, Home,
  Tv, Film
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimeV2API, UserAPI } from '@/lib/api'; 
import AnimePlayer from '@/components/Player/AnimePlayer'; 
import AnimeCard from '@/components/Anime/AnimeCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/hooks/useSettings';

// --- SAFETY TYPES ---
interface LocalEpisode {
  number: number;
  title: string;
  episodeId: string;
  isFiller: boolean;
}

interface LocalServerData {
  sub: Array<{ serverId: number; serverName: string }>;
  dub: Array<{ serverId: number; serverName: string }>;
  raw: Array<{ serverId: number; serverName: string }>;
}

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
        <motion.div 
          animate={{ rotate: -360, scale: [1, 0.9, 1] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-4 border-purple-600 blur-sm rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-2 h-2 bg-white rounded-full animate-ping shadow-[0_0_20px_white]" />
        </div>
      </div>
      <h2 className="text-xl md:text-2xl font-[Cinzel] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 tracking-[0.2em] animate-pulse">
        {text}
      </h2>
    </div>
  </div>
);

export default function WatchClient({ animeId }: { animeId: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();

  // --- STATE ---
  const [data, setData] = useState<any | null>(null);
  const [episodes, setEpisodes] = useState<LocalEpisode[]>([]);
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

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      console.log(`[Watch] Initializing for ID: ${animeId}`);
      setIsLoadingInfo(true);
      setInfoError(null);
      try {
        if (!animeId) throw new Error("No Anime ID provided");

        // Info
        const infoData = await AnimeV2API.getAnimeInfo(animeId);
        if (!isMounted) return;
        if (!infoData) throw new Error("Anime info not found. ID might be invalid.");
        setData(infoData);

        // Episodes
        const epData = await AnimeV2API.getEpisodes(animeId);
        if (!isMounted) return;

        if (epData?.episodes && epData.episodes.length > 0) {
          console.log(`[Watch] Found ${epData.episodes.length} episodes`);
          setEpisodes(epData.episodes as unknown as LocalEpisode[]);
          
          const urlEp = searchParams.get('ep');
          const foundEp = epData.episodes.find((e: any) => e.episodeId === urlEp);
          
          if (foundEp) {
            setCurrentEpId(foundEp.episodeId);
          } else {
            console.log(`[Watch] Defaulting to first episode: ${epData.episodes[0].episodeId}`);
            setCurrentEpId(epData.episodes[0].episodeId);
          }
        } else {
          console.warn("[Watch] No episodes found");
          setInfoError("No episodes found for this anime.");
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

    console.log(`[Watch] Fetching Stream for EP: ${currentEpId} | Server: ${selectedServerName} | Cat: ${category}`);
    
    // Update URL
    setSearchParams(prev => { prev.set('ep', currentEpId); return prev; }, { replace: true });
    
    // Reset Stream
    setStreamUrl(null);
    setStreamError(null);
    setIsStreamLoading(true);

    let isMounted = true;
    
    // Timeout Safety
    const timeout = setTimeout(() => {
      if (isMounted && isStreamLoading) {
        setIsStreamLoading(false);
        setStreamError("Server timed out. Try switching servers.");
      }
    }, 20000); // 20s timeout

    const loadStream = async () => {
      try {
        // 1. Get Servers (Only if we haven't loaded them for this EP yet, or forcing refresh)
        // Note: We refetch servers on every ep change to be safe
        const serverRes = await AnimeV2API.getEpisodeServers(currentEpId);
        if (!isMounted) return;

        if (serverRes) {
           const localServers = serverRes as unknown as LocalServerData;
           setServers(localServers);
           
           // Auto-switch to Dub if Sub is empty
           const subList = localServers.sub || [];
           const dubList = localServers.dub || [];
           
           console.log("[Watch] Servers loaded:", { sub: subList.length, dub: dubList.length });

           if (category === 'sub' && subList.length === 0 && dubList.length > 0) {
             console.log("[Watch] Auto-switching to DUB");
             setCategory('dub');
             return; // Let effect re-run with new category
           }
        }

        // 2. Get Source
        const sourceRes = await AnimeV2API.getEpisodeSources(currentEpId, selectedServerName, category);
        if (!isMounted) return;

        console.log("[Watch] Source response:", sourceRes);

        if (sourceRes?.sources && sourceRes.sources.length > 0) {
          const bestSource = sourceRes.sources.find((s: any) => s.quality === 'auto') || sourceRes.sources[0];
          setStreamUrl(bestSource.url);
          setIntro((sourceRes as any).intro);
          setOutro((sourceRes as any).outro);
        } else {
          throw new Error("No video sources found.");
        }
      } catch (error: any) {
        console.error("[Watch] Stream Failed:", error);
        if (isMounted) setStreamError("Stream unavailable. Try changing the server.");
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
  const currentEpIndex = useMemo(() => episodes.findIndex(e => e.episodeId === currentEpId), [episodes, currentEpId]);
  const currentEpisode = episodes[currentEpIndex];
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEpisode = currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  const episodeChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < episodes.length; i += 100) chunks.push(episodes.slice(i, i + 100));
    return chunks;
  }, [episodes]);

  const handleEpisodeClick = (id: string) => {
    if (id === currentEpId) return;
    setCurrentEpId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mapToCard = (item: any) => ({
    id: item.id,
    title: item.name,
    image: item.poster,
    type: item.type,
    duration: item.duration,
    episodes: item.episodes?.sub,
    sub: item.episodes?.sub,
    dub: item.episodes?.dub,
  });

  // --- UI ---

  if (isLoadingInfo) return <FantasyLoader text="SUMMONING ANIME..." />;

  if (infoError || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Summoning Failed</h2>
        <p className="text-gray-400 mb-6 max-w-md font-mono text-sm">{infoError}</p>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20">
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const { info: anime } = data.anime;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20">
      
      {/* PLAYER */}
      <div className="w-full bg-black relative shadow-2xl shadow-red-900/10">
        <div className="max-w-[1600px] mx-auto aspect-video md:aspect-[21/9] lg:aspect-[16/9] max-h-[85vh] relative z-10 bg-black">
          
          {isStreamLoading ? (
             <FantasyLoader text="FETCHING STREAM..." />
          ) : streamError ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-center p-6 gap-6">
                <div className="space-y-2">
                   <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                   <h3 className="text-xl font-bold text-white">Stream Unavailable</h3>
                   <p className="text-gray-400 text-sm max-w-sm mx-auto">{streamError}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <Button onClick={() => setSelectedServerName('vidstreaming')} variant="outline" className="border-white/10 hover:bg-red-600/20 hover:text-red-500 hover:border-red-500/50">
                      Switch to Vidstreaming
                   </Button>
                   <Button onClick={() => setSelectedServerName('megacloud')} variant="outline" className="border-white/10 hover:bg-red-600/20 hover:text-red-500 hover:border-red-500/50">
                      Switch to MegaCloud
                   </Button>
                </div>
             </div>
          ) : streamUrl ? (
            <AnimePlayer 
              url={streamUrl} 
              intro={intro}
              outro={outro}
              onEnded={() => { if(autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.episodeId); }}
              onNext={nextEpisode ? () => handleEpisodeClick(nextEpisode.episodeId) : undefined}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
               <Tv className="w-16 h-16 text-gray-700" />
               <p className="text-gray-500 font-mono tracking-widest">SELECT AN EPISODE TO BEGIN</p>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-[#0a0a0a] border-b border-white/5 sticky top-[56px] z-30 shadow-lg backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-none font-[Cinzel]">
                  EP {currentEpisode?.number || '?'}
                </span>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                   <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Now Playing</span>
                   <span className="text-sm text-gray-300 truncate max-w-[200px]">
                     {currentEpisode?.title || `Episode ${currentEpisode?.number || ''}`}
                   </span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {prevEpisode && (
               <Button 
                  onClick={() => handleEpisodeClick(prevEpisode.episodeId)}
                  variant="ghost"
                  className="text-gray-400 hover:text-white border border-white/10 hover:bg-white/5"
               >
                  <SkipBack className="mr-2 h-4 w-4" /> Prev
               </Button>
             )}
             
             <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5">
                <Button 
                   onClick={() => setAutoPlay(!autoPlay)}
                   className={`rounded-full px-4 h-8 text-xs font-bold gap-2 ${autoPlay ? 'text-green-400 bg-green-900/20' : 'text-gray-400'}`}
                >
                   <div className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-600'}`} />
                   AUTOPLAY
                </Button>
             </div>

             {nextEpisode && (
               <Button 
                  onClick={() => handleEpisodeClick(nextEpisode.episodeId)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20"
               >
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
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      category === cat ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
             
             <div className="relative group">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 hover:border-red-500/50 transition-colors cursor-pointer">
                   <ServerIcon size={14} className="text-red-500" />
                   <select 
                      className="bg-transparent text-xs font-bold text-gray-200 outline-none appearance-none cursor-pointer min-w-[80px]"
                      value={selectedServerName}
                      onChange={(e) => setSelectedServerName(e.target.value)}
                   >
                      {/* Safety Check: Only map if servers exist */}
                      {servers?.[category as keyof LocalServerData]?.length ? (
                        (servers[category as keyof LocalServerData] as any[]).map((s) => (
                          <option key={s.serverId} value={s.serverName} className="bg-zinc-900 text-gray-300">
                             {s.serverName}
                          </option>
                        ))
                      ) : (
                        <option value="hd-1">Loading...</option>
                      )}
                   </select>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* LISTS */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-4">
           <div className="bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col h-[600px] shadow-xl">
              <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <h3 className="font-bold text-gray-100 flex items-center gap-2">
                    <Layers size={18} className="text-red-500"/> Episodes
                 </h3>
                 <Badge className="border border-white/10 text-gray-400 text-[10px] bg-transparent">
                    {episodes.length} EPS
                 </Badge>
              </div>

              {episodeChunks.length > 1 && (
                 <ScrollArea className="w-full whitespace-nowrap border-b border-white/5 bg-black/20">
                    <div className="flex p-2 gap-2">
                       {episodeChunks.map((_, idx) => (
                          <button
                             key={idx}
                             onClick={() => setEpChunkIndex(idx)}
                             className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                epChunkIndex === idx ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                             }`}
                          >
                             {(idx * 100) + 1} - {Math.min((idx + 1) * 100, episodes.length)}
                          </button>
                       ))}
                    </div>
                 </ScrollArea>
              )}

              <ScrollArea className="flex-1 p-2">
                 <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-2">
                    {episodeChunks[epChunkIndex]?.map((ep) => {
                       const isCurrent = ep.episodeId === currentEpId;
                       return (
                          <button
                             key={ep.episodeId}
                             onClick={() => handleEpisodeClick(ep.episodeId)}
                             className={`
                                relative aspect-square rounded-lg flex flex-col items-center justify-center border transition-all group
                                ${isCurrent 
                                   ? 'bg-red-600/10 border-red-500 text-red-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]' 
                                   : 'bg-zinc-900 border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:border-gray-600'
                                }
                             `}
                          >
                             <span className={`text-sm font-bold ${isCurrent ? 'scale-125' : ''} transition-transform`}>
                                {ep.number}
                             </span>
                             {ep.isFiller && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" title="Filler" />}
                          </button>
                       )
                    })}
                 </div>
              </ScrollArea>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/5 group p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl">
              <div className="absolute inset-0 z-0">
                 <img src={anime.poster} className="w-full h-full object-cover opacity-10 blur-3xl scale-110 grayscale" />
                 <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
              </div>

              <div className="relative z-10 w-full md:w-[220px] flex-shrink-0">
                 <img src={anime.poster} className="w-full rounded-xl shadow-2xl ring-1 ring-white/10 object-cover aspect-[2/3]" />
                 <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all hover:scale-105">
                    <Heart className="mr-2 h-4 w-4" /> Add to List
                 </Button>
              </div>

              <div className="relative z-10 flex-1">
                 <h1 className="text-3xl md:text-5xl font-black text-white mb-4 font-[Cinzel] tracking-tight">{anime.name}</h1>
                 
                 <div className="flex flex-wrap gap-3 mb-6">
                    <Badge className="bg-white/10 text-gray-200 border-none px-3 py-1">{anime.stats.rating}</Badge>
                    <Badge className="bg-white/10 text-gray-200 border-none px-3 py-1">{anime.stats.quality}</Badge>
                    <Badge className="border border-red-500/30 text-red-400 bg-transparent px-3 py-1">{anime.stats.type}</Badge>
                    <div className="flex items-center gap-2 text-xs text-gray-400 border border-white/10 px-3 py-1 rounded-full">
                       <Clock size={12} /> {anime.stats.duration}
                    </div>
                 </div>

                 <div className={`relative overflow-hidden transition-all duration-500 ${isDescExpanded ? 'max-h-[500px]' : 'max-h-[80px]'}`}>
                    <p className="text-gray-300 text-sm leading-relaxed font-light">{anime.description}</p>
                    {!isDescExpanded && <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a0a] to-transparent" />}
                 </div>
                 <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)} 
                    className="text-xs text-red-500 font-bold mt-2 uppercase hover:text-red-400 transition-colors"
                 >
                    {isDescExpanded ? 'Show Less' : 'Read More'}
                 </button>
              </div>
           </div>

           {/* RELATED */}
           {data.relatedAnimes && data.relatedAnimes.length > 0 && (
              <div>
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-red-600 rounded-full" />
                    Related Anime
                 </h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {data.relatedAnimes.map((rel: any) => (
                       <AnimeCard key={rel.id} anime={mapToCard(rel) as any} variant="compact" />
                    ))}
                 </div>
              </div>
           )}

           {/* RECOMMENDED */}
           {data.recommendedAnimes && data.recommendedAnimes.length > 0 && (
              <div>
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-purple-600 rounded-full" />
                    Recommended For You
                 </h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {data.recommendedAnimes.map((rec: any) => (
                       <AnimeCard key={rec.id} anime={mapToCard(rec) as any} />
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}