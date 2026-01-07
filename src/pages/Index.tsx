import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Star, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// COMPONENT IMPORTS
import AnimeCard from '@/components/Anime/AnimeCard';
import SpotlightSlider from '@/components/Anime/SpotlightSlider';

// API IMPORTS (V1 BASE API)
import { 
  AnimeAPI,          // <--- V1 API Class
  WatchlistAPI, 
  UserAPI, 
  ConsumetAnime,     // <--- V1 Type
  AppUser, 
  ConsumetAnimeInfo  // <--- V1 Info Type
} from '@/lib/api';

// Interface for the local state
// We allow both types to ensure compatibility with the Card component
export interface ContinueWatchingItem {
  anime: ConsumetAnime | ConsumetAnimeInfo;
  progress: number;
  totalDuration: number;
  episodeId: string;
  episodeNumber: number;
  timestamp: number;
}

interface IndexProps {
  setIsAuthModalOpen: (isOpen: boolean) => void;
}

export default function Index({ setIsAuthModalOpen }: IndexProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States (All using V1 Types)
  const [spotlightAnimes, setSpotlightAnimes] = useState<ConsumetAnime[]>([]);
  const [trendingAnimes, setTrendingAnimes] = useState<ConsumetAnime[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<ConsumetAnime[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch User & Personal Data
      const currentUser = await UserAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Load Continue Watching from Supabase/Local
        const watchlist = await WatchlistAPI.getUserWatchlist(currentUser.id);
        const watching = watchlist.filter(item => item.status === 'watching' && item.progress > 0);
        
        if (watching.length > 0) {
           const historyItems: ContinueWatchingItem[] = [];
           // Limit to 5 items to prevent V1 API rate limits/spam
           for (const item of watching.slice(0, 5)) {
             try {
               // FETCH DETAILS USING V1 BASE API
               const animeInfo = await AnimeAPI.getAnimeInfo(item.anime_id);
               
               if (animeInfo) {
                 // Calculate estimated duration (V1 often returns "24 min" string)
                 const durationStr = animeInfo.duration || "24";
                 const durationNum = parseInt(durationStr.replace(/\D/g, '')) || 24;
                 
                 historyItems.push({
                   anime: animeInfo,
                   progress: item.progress, 
                   totalDuration: animeInfo.totalEpisodes || 12, // Fallback if totalEpisodes missing
                   episodeId: item.episode_id || '', 
                   episodeNumber: item.progress,
                   timestamp: Date.now() 
                 });
               }
             } catch (e) { console.error("Failed to load history item", e); }
           }
           setContinueWatching(historyItems);
        }
      }

      // 2. Fetch Public Content (STRICTLY V1 API)
      const [spotData, latestData, trendingData] = await Promise.all([
        AnimeAPI.getSpotlight(),
        AnimeAPI.getRecentlyUpdated(),
        AnimeAPI.getMostPopular()
      ]);

      // V1 API returns data inside a 'results' array
      if (spotData?.results) setSpotlightAnimes(spotData.results);
      if (latestData?.results) setLatestEpisodes(latestData.results);
      if (trendingData?.results) setTrendingAnimes(trendingData.results);

    } catch (error) {
      console.error("Init failed:", error);
      toast.error('Connection failed. Shadow Garden is offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchTransition = (animeId: string, episodeId?: string) => {
    // Navigate to Watch page (which will then pick up V2 API)
    const path = episodeId ? `/watch/${animeId}?ep=${episodeId}` : `/watch/${animeId}`;
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 lg:px-8 space-y-16 pt-8">
      <AnimatePresence mode="wait">
        <motion.div 
          key="home"
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="space-y-16"
        >
          {/* Spotlight Slider */}
          {spotlightAnimes.length > 0 && (
            <SpotlightSlider 
              animes={spotlightAnimes} 
              onWatch={(a: any) => handleWatchTransition(a.id)}
              onInfo={(id: string) => navigate(`/watch/${id}`)}
            />
          )}

          {/* Continue Watching */}
          {user && continueWatching.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-600/10 rounded-lg">
                  <Clock className="text-red-600 h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Continue Watching</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {continueWatching.map((item) => (
                  <AnimeCard 
                    key={item.anime.id} 
                    anime={item.anime} 
                    // Calculate visual progress percentage roughly
                    progress={(item.progress / (item.totalDuration || 12)) * 100} 
                    variant="compact"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recently Updated */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/10 rounded-lg">
                  <TrendingUp className="text-red-600 h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Recently Updated</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {latestEpisodes.map((anime) => (
                <AnimeCard 
                  key={anime.id} 
                  anime={anime} 
                />
              ))}
            </div>
          </section>

          {/* Trending / Popular */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/10 rounded-lg">
                  <Star className="text-red-600 h-6 w-6 fill-red-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Most Popular</h2>
              </div>
              <button 
                onClick={() => navigate('/search?sort=popular')}
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {trendingAnimes.map((anime) => (
                <AnimeCard 
                  key={anime.id} 
                  anime={anime} 
                />
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}