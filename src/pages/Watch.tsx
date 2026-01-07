import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AnimeAPI, WatchlistAPI, UserAPI, ConsumetAnimeInfo, ConsumetStreamingLinks } from '@/lib/api';
import AnimePlayer from '@/components/Player/AnimePlayer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimeCard from '@/components/Anime/AnimeCard';
import { toast } from 'sonner';

export default function WatchPage() {
  const { id } = useParams<{ id: string }>(); // Anime ID
  const location = useLocation();
  const [info, setInfo] = useState<ConsumetAnimeInfo | null>(null);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadAnimeDetails(id);
  }, [id]);

  const loadAnimeDetails = async (animeId: string) => {
    setIsLoading(true);
    const data = await AnimeAPI.getAnimeInfo(animeId);
    if (data) {
      setInfo(data);
      
      // LOGIC: Check Supabase history first, then check if user clicked a specific episode, 
      // else default to episode 1.
      const user = await UserAPI.getCurrentUser();
      let startEpId = data.episodes[0].id;

      if (user) {
        const userHistory = await WatchlistAPI.getUserWatchlist(user.id);
        const record = userHistory.find(h => h.anime_id === animeId);
        if (record?.last_episode_id) {
          startEpId = record.last_episode_id;
          setHistory(record);
        }
      }

      // If redirected from "Latest Episodes" section with a specific epId
      const params = new URLSearchParams(location.search);
      const epParam = params.get('ep');
      if (epParam) startEpId = epParam;

      setCurrentEpId(startEpId);
    }
    setIsLoading(false);
  };

  const handleProgressSave = async (seconds: number) => {
    const user = await UserAPI.getCurrentUser();
    if (user && id && currentEpId) {
      await WatchlistAPI.updateProgress(user.id, id, currentEpId, seconds);
    }
  };

  if (isLoading) return <div className="h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 px-4 lg:px-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Player & Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl overflow-hidden border border-white/5 bg-black aspect-video">
            {currentEpId && info && (
              <AnimePlayer 
                anime={info} 
                episodeId={currentEpId} 
                onProgress={handleProgressSave}
                initialTime={history?.watched_seconds || 0}
                onNext={() => {
                   const next = info.episodes.find((_, i) => info.episodes[i-1]?.id === currentEpId);
                   if(next) setCurrentEpId(next.id);
                }}
              />
            )}
          </div>

          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
            <h1 className="text-3xl font-bold mb-2">{info?.title}</h1>
            <div className="flex gap-3 mb-4">
              <span className="text-red-500">{info?.type}</span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">{info?.status}</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">{info?.description}</p>
          </div>
        </div>

        {/* RIGHT: Episode List & Related */}
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="episodes" className="w-full">
            <TabsList className="w-full bg-zinc-900 border border-white/5">
              <TabsTrigger value="episodes" className="flex-1">Episodes</TabsTrigger>
              <TabsTrigger value="related" className="flex-1">Related</TabsTrigger>
            </TabsList>

            <TabsContent value="episodes" className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid grid-cols-1 gap-2">
                  {info?.episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => setCurrentEpId(ep.id)}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                        currentEpId === ep.id 
                        ? 'bg-red-600/20 border border-red-600/50' 
                        : 'bg-zinc-900/50 border border-transparent hover:bg-zinc-800'
                      }`}
                    >
                      <span className={`text-sm font-bold ${currentEpId === ep.id ? 'text-red-500' : 'text-zinc-500'}`}>
                        {ep.number}
                      </span>
                      <span className="text-sm font-medium truncate">{ep.title || `Episode ${ep.number}`}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="related">
               <p className="text-zinc-500 text-center py-10">Fetching related anime...</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}