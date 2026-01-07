import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Play, SkipForward, Server as ServerIcon, 
  Layers, Heart, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AnimeAPI, WatchlistAPI, UserAPI, 
  ConsumetAnimeInfo, ServerData 
} from '@/lib/api';
import AnimePlayer from '@/components/Player/AnimePlayer'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { useSettings } from '@/hooks/useSettings';


  
// Constants
const CHUNK_SIZE = 100;

export default function WatchClient({ animeId }: { animeId: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- DATA STATE ---
  const [info, setInfo] = useState<ConsumetAnimeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('guest'); 

  // --- PLAYBACK STATE ---
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerData | null>(null);
  
  // Preferences
  const [category, setCategory] = useState<'sub' | 'dub' | 'raw'>('sub');
  const [selectedServerName, setSelectedServerName] = useState<string>('hd-1'); 
  const [autoPlay, setAutoPlay] = useState(true);
  
  // UI State
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);


  const { settings } = useSettings();
  
  // Initialize state with settings
  const [autoPlay, setAutoPlay] = useState(settings.autoPlay);


  // --- 1. INITIAL LOAD (Info & User) ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Fetch User
        const user = await UserAPI.getCurrentUser();
        if (user) setUserId(user.id);

        // Fetch Anime Info
        const data = await AnimeAPI.getAnimeInfo(animeId);
        setInfo(data);

        // Load Watch History
        const watchlist = await WatchlistAPI.getUserWatchlist(user ? user.id : 'guest');
        const currentItem = watchlist.find(i => i.anime_id === animeId);
        if (currentItem && currentItem.progress) {
             setWatchedEpisodes(new Set([currentItem.progress]));
        }

        // Set Initial Episode from URL or Default
        const urlEp = searchParams.get('ep');
        if (urlEp) {
          setCurrentEpId(urlEp);
        } else if (data?.episodes?.length) {
          setCurrentEpId(data.episodes[0].id);
        }

      } catch (err) {
        console.error("Failed to load anime info:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [animeId]);

  // --- 2. FETCH STREAM (When Episode/Server/Category Changes) ---
  useEffect(() => {
    if (!currentEpId) return;

    // Update URL query parameter without full reload
    setSearchParams(prev => {
        prev.set('ep', currentEpId);
        return prev;
    }, { replace: true });

    const loadStream = async () => {
      setStreamUrl(null); 
      
      try {
        // A. Get Servers (only if ID changed)
        const serverRes = await AnimeAPI.getEpisodeServers(currentEpId);
        if (serverRes?.data) {
           setServers(serverRes.data);
           if (category === 'sub' && !serverRes.data.sub.length && serverRes.data.dub.length) setCategory('dub');
        }

        // B. Get Stream Source
        const sourceRes = await AnimeAPI.getEpisodeSourcesV2(
            currentEpId, 
            selectedServerName, 
            category as 'sub' | 'dub'
        );

        if (sourceRes?.data?.sources) {
          const bestSource = sourceRes.data.sources.find(s => s.isM3U8) || sourceRes.data.sources[0];
          setStreamUrl(bestSource?.url);
        }

        // C. Update Progress
        if (info) {
            const epNum = info.episodes.find(e => e.id === currentEpId)?.number || 0;
            if (epNum > 0) {
                setWatchedEpisodes(prev => new Set(prev).add(epNum));
                await WatchlistAPI.updateProgress(userId, animeId, epNum);
            }
        }

      } catch (error) {
        console.error("Stream loading failed", error);
      }
    };

    loadStream();
  }, [currentEpId, selectedServerName, category, animeId]);

  // --- HELPERS ---

  const currentEpObj = useMemo(() => 
    info?.episodes.find(e => e.id === currentEpId), 
  [info, currentEpId]);

  const nextEpisode = useMemo(() => {
    if (!info?.episodes || !currentEpId) return null;
    const index = info.episodes.findIndex(e => e.id === currentEpId);
    return info.episodes[index + 1] || null;
  }, [info, currentEpId]);

  const episodeChunks = useMemo(() => {
    if (!info?.episodes) return [];
    const chunks = [];
    for (let i = 0; i < info.episodes.length; i += CHUNK_SIZE) {
      chunks.push(info.episodes.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  }, [info?.episodes]);

  const handleEpisodeClick = (epId: string) => {
    setCurrentEpId(epId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-gray-400 font-cinzel tracking-widest animate-pulse">CONNECTING TO SHADOW GARDEN...</p>
      </div>
    );
  }

  if (!info) return <div className="text-white p-20 text-center">Anime Data Not Found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20">
      
      {/* 1. PLAYER SECTION */}
      <div className="w-full bg-black relative shadow-2xl shadow-red-900/10">
        <div className="max-w-[1600px] mx-auto aspect-video md:aspect-[21/9] lg:aspect-[16/9] max-h-[85vh] relative z-10">
          {streamUrl ? (
            <AnimePlayer 
              url={streamUrl} 
              onEnded={() => {
                if(autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.id);
              }}
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 to-transparent animate-pulse" />
               <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4 relative z-10" />
               <p className="text-gray-400 font-mono text-sm relative z-10">
                 FETCHING STREAM FROM <span className="text-red-500 font-bold uppercase">{selectedServerName}</span>
               </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. CONTROL BAR (Server & Nav) */}
      <div className="bg-[#0a0a0a] border-b border-white/5 sticky top-[56px] z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Info Left */}
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
                <Play size={12} className="fill-current" /> Now Playing
             </div>
             <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white leading-none">EP {currentEpObj?.number}</span>
                <span className="text-sm text-gray-400 truncate border-l border-white/10 pl-3">
                  {currentEpObj?.title || `Episode ${currentEpObj?.number}`}
                </span>
             </div>
          </div>

          {/* Controls Center */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5 backdrop-blur-sm">
             <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAutoPlay(!autoPlay)}
                className={`rounded-full px-4 h-8 text-xs font-bold gap-2 ${autoPlay ? 'text-green-400 bg-green-900/20' : 'text-gray-400'}`}
             >
                <div className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-600'}`} />
                AUTOPLAY
             </Button>
             <div className="w-[1px] h-4 bg-white/10" />
             <Button 
                variant="ghost" 
                size="sm"
                disabled={!nextEpisode}
                onClick={() => nextEpisode && handleEpisodeClick(nextEpisode.id)}
                className="rounded-full px-4 h-8 text-xs font-bold text-white hover:bg-white/10 gap-2"
             >
                NEXT <SkipForward size={14} />
             </Button>
          </div>

          {/* Server Selector Right */}
          <div className="flex items-center gap-3">
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                {(['sub', 'dub', 'raw'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      category === cat 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>

             <div className="relative group">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:border-red-500/50 transition-colors">
                   <ServerIcon size={14} className="text-red-500" />
                   <select 
                      className="bg-transparent text-xs font-bold text-gray-200 outline-none appearance-none cursor-pointer min-w-[80px]"
                      value={selectedServerName}
                      onChange={(e) => setSelectedServerName(e.target.value)}
                   >
                      {servers?.[category as keyof ServerData]?.length ? (
                        (servers[category as keyof ServerData] as any[]).map((s) => (
                          <option key={s.serverId} value={s.serverName} className="bg-zinc-900 text-gray-300">
                             {s.serverName}
                          </option>
                        ))
                      ) : (
                        <option>Loading...</option>
                      )}
                   </select>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: EPISODE LIST */}
        <div className="lg:col-span-4 space-y-4">
           <div className="bg-[#0f0f0f] rounded-xl border border-white/5 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <h3 className="font-bold text-gray-100 flex items-center gap-2">
                    <Layers size={18} className="text-red-500"/> Episodes
                 </h3>
                 <Badge variant="outline" className="border-white/10 text-gray-400 text-[10px]">
                    {info.episodes.length} EPS
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
                             {(idx * CHUNK_SIZE) + 1} - {Math.min((idx + 1) * CHUNK_SIZE, info.episodes.length)}
                          </button>
                       ))}
                    </div>
                 </ScrollArea>
              )}

              <ScrollArea className="flex-1 p-2">
                 <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 p-2">
                    {episodeChunks[epChunkIndex]?.map((ep) => {
                       const isCurrent = ep.id === currentEpId;
                       const isWatched = watchedEpisodes.has(ep.number);

                       return (
                          <button
                             key={ep.id}
                             onClick={() => handleEpisodeClick(ep.id)}
                             className={`
                                relative aspect-square rounded-lg flex flex-col items-center justify-center border transition-all group
                                ${isCurrent 
                                   ? 'bg-red-600/10 border-red-500 text-red-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]' 
                                   : isWatched 
                                      ? 'bg-zinc-900/50 border-zinc-800 text-gray-600'
                                      : 'bg-zinc-900 border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:border-gray-600'
                                }
                             `}
                          >
                             <span className={`text-sm font-bold ${isCurrent ? 'scale-125' : ''} transition-transform`}>
                                {ep.number}
                             </span>
                             {isCurrent && (
                                <div className="absolute bottom-1.5 flex gap-0.5 items-end h-2">
                                   <motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-red-500 rounded-full" />
                                   <motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }} className="w-0.5 bg-red-500 rounded-full" />
                                   <motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-0.5 bg-red-500 rounded-full" />
                                </div>
                             )}
                          </button>
                       )
                    })}
                 </div>
              </ScrollArea>
           </div>
        </div>

        {/* RIGHT: INFO & RECS */}
        <div className="lg:col-span-8 space-y-8">
           
           {info.relatedAnime && info.relatedAnime.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Related:</span>
                 {info.relatedAnime.slice(0, 4).map((rel) => (
                    <div key={rel.id} className="cursor-pointer px-4 py-1.5 rounded-full bg-black/40 border border-white/10 hover:border-red-500/50 hover:bg-red-900/10 text-xs text-gray-300 transition-all flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${rel.id === animeId ? 'bg-green-500' : 'bg-gray-600'}`} />
                       {rel.title}
                    </div>
                 ))}
              </div>
           )}

           {/* INFO CARD */}
           <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/5 group">
              <div className="absolute inset-0 z-0">
                 <img src={info.image} className="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
              </div>

              <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-8">
                 <div className="w-full md:w-[220px] flex-shrink-0">
                    <img src={info.image} className="w-full rounded-xl shadow-2xl ring-1 ring-white/10 object-cover aspect-[2/3]" />
                    <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/20">
                       <Heart size={18} className="mr-2" /> Add to List
                    </Button>
                 </div>

                 <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 font-cinzel leading-none tracking-tight">
                       {info.title}
                    </h1>
                    <p className="text-red-400 font-medium mb-6 text-sm">{info.japaneseTitle || info.title}</p>

                    <div className="flex flex-wrap gap-3 mb-6">
                       <Badge className="bg-white/10 hover:bg-white/20 text-gray-200 border-none px-3 py-1">
                          {info.type}
                       </Badge>
                       <Badge className="bg-white/10 hover:bg-white/20 text-gray-200 border-none px-3 py-1">
                          {info.status}
                       </Badge>
                       <Badge variant="outline" className="border-red-500/30 text-red-400 px-3 py-1">
                          {info.subOrDub?.toUpperCase()}
                       </Badge>
                       {info.releaseDate && (
                          <Badge variant="outline" className="border-white/10 text-gray-400 px-3 py-1">
                             {info.releaseDate}
                          </Badge>
                       )}
                    </div>

                    <div className={`relative overflow-hidden transition-all duration-500 ${isDescriptionExpanded ? 'max-h-[500px]' : 'max-h-[100px]'}`}>
                       <p className="text-gray-300 text-sm leading-relaxed font-light">
                          {info.description}
                       </p>
                       {!isDescriptionExpanded && (
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                       )}
                    </div>
                    <button 
                       onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                       className="text-xs font-bold text-red-500 mt-2 hover:text-red-400 uppercase tracking-wide"
                    >
                       {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                    </button>
                 </div>
              </div>
           </div>

           {/* RECOMMENDATIONS */}
           {info.recommendations && info.recommendations.length > 0 && (
             <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                   <div className="w-1 h-6 bg-red-600 rounded-full" />
                   Recommended For You
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                   {info.recommendations.slice(0, 8).map((rec) => (
                      <div 
                         key={rec.id} 
                         onClick={() => navigate(`/watch/${rec.id}`)}
                         className="group cursor-pointer relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/5"
                      >
                         <img 
                            src={rec.image} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                         
                         <div className="absolute bottom-0 p-3 w-full">
                            <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
                               {rec.title}
                            </h4>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                               <span>{rec.type || 'TV'}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

        </div>

      </div>
    </div>
  );
}