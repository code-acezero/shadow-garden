import React, { useState, useEffect } from 'react';
import { ChevronRight, Play, Clock, TrendingUp, Calendar, Star, Palette, Shield, Download, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Layout/Navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import AuthModal from '@/components/Auth/AuthModal';
import AnimePlayer from '@/components/Player/AnimePlayer';
import OtakuVerse from '@/components/Social/OtakuVerse';
import { AnimeAPI, WatchlistAPI, UserAPI, ConsumetAnime, AppUser, WatchlistItem, ConsumetAnimeInfo } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ContinueWatchingItem {
  anime: ConsumetAnime;
  progress: number;
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<ConsumetAnime | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Updated data states for Consumet API
  const [spotlightAnimes, setSpotlightAnimes] = useState<ConsumetAnime[]>([]);
  const [trendingAnimes, setTrendingAnimes] = useState<ConsumetAnime[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<ConsumetAnime[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
  const [schedule, setSchedule] = useState<ConsumetAnime[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const currentUser = await UserAPI.getCurrentUser();
      if (currentUser) setUser(currentUser);

      // Fetch Spotlight
      const spotlightData = await AnimeAPI.getSpotlight();
      if (spotlightData?.spotlightAnimes) setSpotlightAnimes(spotlightData.spotlightAnimes);

      // Fetch Recently Updated (Latest Episodes)
      const latestData = await AnimeAPI.getRecentlyUpdated();
      if (latestData?.results) setLatestEpisodes(latestData.results);

      // Fetch Trending (Most Popular)
      const trendingData = await AnimeAPI.getMostPopular();
      if (trendingData?.results) setTrendingAnimes(trendingData.results);

      // Fetch Schedule
      const today = new Date().toISOString().split('T')[0];
      const scheduleData = await AnimeAPI.getSchedule(today);
      if (scheduleData?.scheduledAnimes) setSchedule(scheduleData.scheduledAnimes);

    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('Failed to connect to Shadow Garden API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchAnime = async (anime: ConsumetAnime) => {
    setSelectedAnime(anime);
    setShowPlayer(true);
    if (user && !isAnimeInWatchlist(anime.id)) {
      await WatchlistAPI.addToWatchlist(user.id, anime.id, 'watching');
    }
  };

  const isAnimeInWatchlist = (animeId: string) => userWatchlist.some(item => item.anime_id === animeId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} user={user} onAuthClick={() => setShowAuthModal(true)} />

      <main className="pt-16 pb-20 md:pl-64">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 space-y-12">
              
              {/* Hero Spotlight */}
              {spotlightAnimes.length > 0 && (
                <section className="relative h-[450px] rounded-3xl overflow-hidden group">
                  <img src={spotlightAnimes[0].image} alt={spotlightAnimes[0].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-10 left-10 max-w-2xl">
                    <Badge className="mb-4 bg-red-600">#{spotlightAnimes[0].rank} Spotlight</Badge>
                    <h1 className="text-5xl font-bold text-white mb-4 line-clamp-2">{spotlightAnimes[0].title}</h1>
                    <p className="text-gray-300 mb-6 line-clamp-3">{spotlightAnimes[0].description}</p>
                    <Button onClick={() => handleWatchAnime(spotlightAnimes[0])} className="bg-red-600 hover:bg-red-700 h-12 px-8 text-lg">
                      <Play className="mr-2 h-5 w-5" /> Watch Now
                    </Button>
                  </div>
                </section>
              )}

              {/* Recently Updated */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-red-600" /> Recently Updated
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {latestEpisodes.slice(0, 10).map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} onWatch={() => handleWatchAnime(anime)} />
                  ))}
                </div>
              </section>

              {/* Trending Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Star className="text-red-600 fill-red-600" /> Most Popular
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {trendingAnimes.slice(0, 10).map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} variant="compact" onWatch={() => handleWatchAnime(anime)} />
                  ))}
                </div>
              </section>

            </motion.div>
          )}

          {/* Schedule Page Mapping */}
          {currentPage === 'schedule' && (
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-3xl font-bold text-white mb-8 text-center">Airing Schedule</h1>
              <div className="grid gap-4">
                {schedule.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-4">
                      <img src={item.image} className="w-12 h-16 object-cover rounded" />
                      <div>
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <p className="text-gray-500 text-xs">{item.releaseDate}</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-500" onClick={() => handleWatchAnime(item)}>View</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth & Player Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={(u) => setUser(u)} />
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black border-0">
          {selectedAnime && <AnimePlayer anime={selectedAnime} onClose={() => setShowPlayer(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}