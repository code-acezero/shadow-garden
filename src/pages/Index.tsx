import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Star, Calendar, Clock, Play, ArrowRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import Navigation from '@/components/Layout/Navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import SpotlightSlider from '@/components/Anime/SpotlightSlider';
import AuthModal from '@/components/Auth/AuthModal';
import OtakuVerse from '@/components/Social/OtakuVerse'; // Assuming you have this from previous steps
import { AnimeAPI, WatchlistAPI, UserAPI, ConsumetAnime, AppUser, WatchlistItem } from '@/lib/api';

// Interface for the local state
interface ContinueWatchingItem {
  anime: ConsumetAnime;
  progress: number;
  totalDuration: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [spotlightAnimes, setSpotlightAnimes] = useState<ConsumetAnime[]>([]);
  const [trendingAnimes, setTrendingAnimes] = useState<ConsumetAnime[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<ConsumetAnime[]>([]);
  const [schedule, setSchedule] = useState<ConsumetAnime[]>([]);
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
        // Load Continue Watching
        const watchlist = await WatchlistAPI.getUserWatchlist(currentUser.id);
        const watching = watchlist.filter(item => item.status === 'watching' && item.watched_seconds > 0);
        
        // We need full anime details for the cards, so we fetch info for these items
        // Note: In a real app, you might want to cache this or store basic metadata in the watchlist table
        if (watching.length > 0) {
           const historyItems: ContinueWatchingItem[] = [];
           // Limit to 5 to prevent massive API spam on load
           for (const item of watching.slice(0, 5)) {
             try {
               const animeInfo = await AnimeAPI.getAnimeInfo(item.anime_id);
               if (animeInfo) {
                 historyItems.push({
                   anime: animeInfo,
                   progress: item.watched_seconds,
                   totalDuration: item.total_duration || 1 // Avoid division by zero
                 });
               }
             } catch (e) { console.error("Failed to load history item", e); }
           }
           setContinueWatching(historyItems);
        }
      }

      // 2. Fetch Public Content
      const [spotData, latestData, trendingData] = await Promise.all([
        AnimeAPI.getSpotlight(),
        AnimeAPI.getRecentlyUpdated(),
        AnimeAPI.getMostPopular()
      ]);

      if (spotData?.spotlightAnimes) setSpotlightAnimes(spotData.spotlightAnimes);
      if (latestData?.results) setLatestEpisodes(latestData.results);
      if (trendingData?.results) setTrendingAnimes(trendingData.results);

      // 3. Fetch Schedule
      const today = new Date().toISOString().split('T')[0];
      const scheduleData = await AnimeAPI.getSchedule(today);
      if (scheduleData?.scheduledAnimes) setSchedule(scheduleData.scheduledAnimes);

    } catch (error) {
      console.error("Init failed:", error);
      toast.error('Connection failed. Shadow Garden is offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchTransition = (animeId: string, episodeId?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const path = episodeId ? `/watch/${animeId}?ep=${episodeId}` : `/watch/${animeId}`;
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-red-600/20 rounded-full"></div>
          <div className="w-20 h-20 border-t-2 border-red-600 rounded-full animate-spin absolute top-0"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-red-600 text-xs tracking-widest animate-pulse">
            LOADING
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600/30">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        user={user} 
        onAuthClick={() => setShowAuthModal(true)} 
      />

      <main className="pt-20 pb-20 md:pl-64 px-4 lg:px-8 max-w-[1920px] mx-auto">
        <AnimatePresence mode="wait">
          
          {/* --- HOME PAGE --- */}
          {currentPage === 'home' && (
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
                  onWatch={(a) => handleWatchTransition(a.id)}
                  onInfo={(id) => navigate(`/watch/${id}`)}
                />
              )}

              {/* Continue Watching (Only if User Logged In & Has Data) */}
              {user && continueWatching.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-600/10 rounded-lg">
                      <Clock className="text-red-600 h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Continue Watching</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {continueWatching.map((item) => (
                      <AnimeCard 
                        key={item.anime.id} 
                        anime={item.anime} 
                        progress={(item.progress / item.totalDuration) * 100}
                        onWatch={() => handleWatchTransition(item.anime.id)} 
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
                    <h2 className="text-2xl font-bold tracking-tight">Recently Updated</h2>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('trending')}
                    className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {latestEpisodes.map((anime) => (
                    <AnimeCard 
                      key={anime.id} 
                      anime={anime} 
                      onWatch={() => handleWatchTransition(anime.id, (anime as any).episodeId)} 
                    />
                  ))}
                </div>
              </section>

              {/* Trending */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600/10 rounded-lg">
                      <Star className="text-red-600 h-6 w-6 fill-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Most Popular</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {trendingAnimes.map((anime) => (
                    <AnimeCard 
                      key={anime.id} 
                      anime={anime} 
                      onWatch={() => handleWatchTransition(anime.id)} 
                    />
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* --- SCHEDULE PAGE --- */}
          {currentPage === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-8">
                <Calendar className="w-8 h-8 text-red-600" />
                <h1 className="text-3xl font-bold">Airing Schedule (Today)</h1>
              </div>
              
              <div className="grid gap-4">
                {schedule.length > 0 ? schedule.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-colors group"
                  >
                    <div className="relative w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white group-hover:text-red-500 transition-colors truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.releaseDate || "TBA"}</span>
                        <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                        <span>{item.type || "TV"}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleWatchTransition(item.id)}
                      className="px-4 py-2 bg-red-600/10 text-red-500 font-medium rounded-lg hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
                    >
                      Watch
                    </button>
                  </motion.div>
                )) : (
                  <div className="text-center py-20 text-zinc-500">
                    No schedule data available for today.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* --- TRENDING / BROWSE PAGE --- */}
          {currentPage === 'trending' && (
            <motion.div
              key="trending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <Activity className="w-8 h-8 text-red-600" />
                <h1 className="text-3xl font-bold">Trending Now</h1>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* Combining trending and latest for a fuller "Browse" feel */}
                {[...trendingAnimes, ...latestEpisodes].map((anime, idx) => (
                  <AnimeCard 
                    key={`${anime.id}-${idx}`} 
                    anime={anime} 
                    onWatch={() => handleWatchTransition(anime.id)} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* --- OTAKUVERSE (Community) --- */}
          {currentPage === 'otakuverse' && (
             <motion.div
               key="otakuverse"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <OtakuVerse user={user} onAuthRequired={() => setShowAuthModal(true)} />
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- MODALS --- */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={(u) => { setUser(u); setShowAuthModal(false); }} 
      />
    </div>
  );
}