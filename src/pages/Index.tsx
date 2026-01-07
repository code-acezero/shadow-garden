import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Star, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import Navigation from '@/components/Layout/Navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import SpotlightSlider from '@/components/Anime/SpotlightSlider';
import AuthModal from '@/components/Auth/AuthModal';
import { AnimeAPI, WatchlistAPI, UserAPI, ConsumetAnime, AppUser } from '@/lib/api';

export default function Index() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [spotlightAnimes, setSpotlightAnimes] = useState<ConsumetAnime[]>([]);
  const [trendingAnimes, setTrendingAnimes] = useState<ConsumetAnime[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<ConsumetAnime[]>([]);
  const [schedule, setSchedule] = useState<ConsumetAnime[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const currentUser = await UserAPI.getCurrentUser();
      if (currentUser) setUser(currentUser);

      const [spotData, latestData, trendingData] = await Promise.all([
        AnimeAPI.getSpotlight(),
        AnimeAPI.getRecentlyUpdated(),
        AnimeAPI.getMostPopular()
      ]);

      if (spotData?.spotlightAnimes) setSpotlightAnimes(spotData.spotlightAnimes);
      if (latestData?.results) setLatestEpisodes(latestData.results);
      if (trendingData?.results) setTrendingAnimes(trendingData.results);

      const today = new Date().toISOString().split('T')[0];
      const scheduleData = await AnimeAPI.getSchedule(today);
      if (scheduleData?.scheduledAnimes) setSchedule(scheduleData.scheduledAnimes);

    } catch (error) {
      toast.error('Connection failed. Shadow Garden is offline.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigates to the professional watch page
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        user={user} 
        onAuthClick={() => setShowAuthModal(true)} 
      />

      <main className="pt-16 pb-20 md:pl-64 px-4 lg:px-8">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
              
              {/* Pro Spotlight Slider */}
              {spotlightAnimes.length > 0 && (
                <SpotlightSlider 
                  animes={spotlightAnimes} 
                  onWatch={(a) => handleWatchTransition(a.id)}
                  onInfo={(id) => navigate(`/watch/${id}`)}
                />
              )}

              {/* Recently Updated */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp className="text-red-600 h-8 w-8" /> Recently Updated
                  </h2>
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
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Star className="text-red-600 h-8 w-8 fill-red-600" /> Most Popular
                  </h2>
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
        </AnimatePresence>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={(u) => { setUser(u); setShowAuthModal(false); }} 
      />
    </div>
  );
}