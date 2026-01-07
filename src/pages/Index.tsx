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
import ImageSearch from '@/components/AI/ImageSearch';
import { AnimeAPI, WatchlistAPI, UserAPI, AniwatchAnime, AppUser, WatchlistItem, AniwatchEpisode, AniwatchScheduleItem } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ContinueWatchingItem {
  anime: AniwatchAnime;
  progress: number;
}

interface AppSettings {
  theme: string;
  autoplay: boolean;
  quality: string;
  subtitles: boolean;
  notifications: boolean;
  darkMode: boolean;
  volume: number[];
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AniwatchAnime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<AniwatchEpisode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Anime data states - simplified for home page
  const [spotlightAnimes, setSpotlightAnimes] = useState<AniwatchAnime[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<AniwatchAnime[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
  const [schedule, setSchedule] = useState<AniwatchScheduleItem[]>([]);

  // Settings states
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'shadow-garden',
    autoplay: true,
    quality: '1080p',
    subtitles: true,
    notifications: true,
    darkMode: true,
    volume: [80]
  });

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const initializeApp = async () => {
    setIsLoading(true);
    
    try {
      // Check for existing user
      const currentUser = await UserAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }

      // Fetch anime data from Aniwatch API - only what we need for home page
      const homeData = await AnimeAPI.getHomeData();
      if (homeData) {
        // Set spotlight animes for the slider
        setSpotlightAnimes(homeData.spotlightAnimes || []);
        // Set latest episodes
        setLatestEpisodes(homeData.latestEpisodeAnimes || []);
      }

      // Fetch today's schedule for other pages
      const today = new Date().toISOString().split('T')[0];
      const todaySchedule = await AnimeAPI.getSchedule(today);
      setSchedule(todaySchedule || []);

    } catch (error) {
      console.error('Error initializing app:', error);
      toast.error('Failed to load anime data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user) return;

    try {
      const watchlist = await WatchlistAPI.getUserWatchlist(user.id);
      setUserWatchlist(watchlist);

      // Load continue watching data
      const watching = watchlist.filter(item => item.status === 'watching' && item.progress > 0);
      const continueWatchingData: ContinueWatchingItem[] = [];
      
      for (const item of watching.slice(0, 6)) {
        // Find anime in our loaded data
        const anime = [...spotlightAnimes, ...latestEpisodes].find(a => a.id === item.anime_id);
        if (anime) {
          continueWatchingData.push({
            anime,
            progress: item.progress
          });
        }
      }
      
      setContinueWatching(continueWatchingData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAuthSuccess = (userData: AppUser) => {
    setUser(userData);
    setShowAuthModal(false);
    toast.success(`Welcome to Shadow Garden, ${userData.user_metadata.username}! 🎌`);
  };

  const handleAddToWatchlist = async (animeId: string, status: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const success = await WatchlistAPI.addToWatchlist(user.id, animeId, status as WatchlistItem['status']);
      if (success) {
        toast.success('Added to watchlist!');
        await loadUserData(); // Refresh user data
      } else {
        toast.error('Failed to add to watchlist');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const handleWatchAnime = async (anime: AniwatchAnime) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Get episodes for the anime
      const episodes = await AnimeAPI.getAnimeEpisodes(anime.id);
      
      setSelectedAnime(anime);
      setSelectedEpisode(episodes[0] || null);
      setShowPlayer(true);
      
      // Add to continue watching if not already there
      const isInWatchlist = userWatchlist.some(item => item.anime_id === anime.id);
      if (!isInWatchlist) {
        await handleAddToWatchlist(anime.id, 'watching');
      }
    } catch (error) {
      console.error('Error starting anime:', error);
      toast.error('Failed to start anime');
    }
  };

  const handleEpisodeChange = (episode: AniwatchEpisode) => {
    setSelectedEpisode(episode);
  };

  const isAnimeInWatchlist = (animeId: string) => {
    return userWatchlist.some(item => item.anime_id === animeId);
  };

  const handleSettingChange = (key: keyof AppSettings, value: string | boolean | number[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem('shadow_garden_settings', JSON.stringify({ ...settings, [key]: value }));
    toast.success('Settings updated!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <motion.h2 
            className="text-2xl font-bold text-white mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Shadow Garden
          </motion.h2>
          <p className="text-gray-400">Loading anime data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20">
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
      />

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pl-64">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 space-y-8"
            >
              <div className="container mx-auto space-y-8">
                {/* Hero Slider - Spotlight Anime */}
                <section className="relative h-96 rounded-2xl overflow-hidden group">
                  {spotlightAnimes.length > 0 && (
                    <>
                      <motion.img
                        src={spotlightAnimes[0].poster}
                        alt={spotlightAnimes[0].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.8 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                      <motion.div 
                        className="absolute bottom-8 left-8 max-w-2xl"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Badge className="mb-4 bg-red-600 text-white animate-pulse">
                          <Star className="w-3 h-3 mr-1" />
                          #{spotlightAnimes[0].rank || 1} Spotlight
                        </Badge>
                        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                          {spotlightAnimes[0].name}
                        </h1>
                        <p className="text-gray-300 mb-6 line-clamp-3 text-lg">
                          {spotlightAnimes[0].description || "Experience the ultimate anime streaming platform with cutting-edge AI features and social interactions."}
                        </p>
                        <div className="flex space-x-4">
                          <Button 
                            onClick={() => handleWatchAnime(spotlightAnimes[0])}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Watch Now
                          </Button>
                          <Button 
                            onClick={() => handleAddToWatchlist(spotlightAnimes[0].id, 'plan_to_watch')}
                            variant="outline" 
                            className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg"
                          >
                            Add to Watchlist
                          </Button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </section>

                {/* Continue Watching */}
                {user && continueWatching.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <Clock className="w-6 h-6 mr-2 text-red-500" />
                        Continue Watching
                      </h2>
                      <Button variant="ghost" className="text-red-400 hover:text-red-300">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {continueWatching.map((item, index) => (
                        <motion.div
                          key={item.anime.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AnimeCard
                            anime={item.anime}
                            variant="compact"
                            showProgress
                            progress={item.progress}
                            onWatch={() => handleWatchAnime(item.anime)}
                            onAddToWatchlist={(status) => handleAddToWatchlist(item.anime.id, status)}
                            isInWatchlist={isAnimeInWatchlist(item.anime.id)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Latest Episodes */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <TrendingUp className="w-6 h-6 mr-2 text-red-500" />
                      Latest Episodes
                    </h2>
                    <Button variant="ghost" className="text-red-400 hover:text-red-300">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {latestEpisodes.slice(0, 10).map((anime, index) => (
                      <motion.div
                        key={anime.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <AnimeCard
                          anime={anime}
                          onWatch={() => handleWatchAnime(anime)}
                          onAddToWatchlist={(status) => handleAddToWatchlist(anime.id, status)}
                          isInWatchlist={isAnimeInWatchlist(anime.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}

          {/* Settings Page */}
          {currentPage === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="container mx-auto px-4 py-6 max-w-4xl"
            >
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                  <p className="text-gray-400">Customize your Shadow Garden experience</p>
                </div>

                {/* Theme Settings */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-red-500" />
                      Appearance & Themes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-gray-300 text-sm font-medium">Theme</label>
                      <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="shadow-garden">Shadow Garden (Default)</SelectItem>
                          <SelectItem value="death-note">Death Note</SelectItem>
                          <SelectItem value="dragon-ball">Dragon Ball</SelectItem>
                          <SelectItem value="naruto">Naruto</SelectItem>
                          <SelectItem value="one-piece">One Piece</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Dark Mode</label>
                        <p className="text-gray-500 text-xs">Enable dark theme</p>
                      </div>
                      <Switch 
                        checked={settings.darkMode} 
                        onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Player Settings */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Play className="w-5 h-5 mr-2 text-red-500" />
                      Player Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Autoplay</label>
                        <p className="text-gray-500 text-xs">Automatically play next episode</p>
                      </div>
                      <Switch 
                        checked={settings.autoplay} 
                        onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-300 text-sm font-medium">Default Quality</label>
                      <Select value={settings.quality} onValueChange={(value) => handleSettingChange('quality', value)}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="480p">480p (SD)</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-300 text-sm font-medium">Volume</label>
                      <Slider
                        value={settings.volume}
                        onValueChange={(value) => handleSettingChange('volume', value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-right text-gray-400 text-sm">{settings.volume[0]}%</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Subtitles</label>
                        <p className="text-gray-500 text-xs">Show subtitles by default</p>
                      </div>
                      <Switch 
                        checked={settings.subtitles} 
                        onCheckedChange={(checked) => handleSettingChange('subtitles', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy & Security */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-red-500" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Notifications</label>
                        <p className="text-gray-500 text-xs">Receive notifications for new episodes</p>
                      </div>
                      <Switch 
                        checked={settings.notifications} 
                        onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                      />
                    </div>

                    <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-800">
                      Clear Watch History
                    </Button>

                    <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-800">
                      Export Watchlist
                    </Button>
                  </CardContent>
                </Card>

                {/* About */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <HelpCircle className="w-5 h-5 mr-2 text-red-500" />
                      About Shadow Garden
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-gray-300">
                      <p className="mb-2"><strong>Version:</strong> 2.0.0</p>
                      <p className="mb-2"><strong>API:</strong> Aniwatch API</p>
                      <p className="mb-4"><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">
                        Shadow Garden is an advanced anime streaming platform with AI-powered features, 
                        social community integration, and seamless streaming experience.
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                        Help & Support
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                        Privacy Policy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Schedule Page */}
          {currentPage === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="container mx-auto px-4 py-6"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">Anime Schedule</h1>
                  <p className="text-gray-400">Today's airing anime schedule</p>
                </div>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {schedule.length > 0 ? (
                        schedule.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <div>
                              <h3 className="text-white font-medium">{item.name}</h3>
                              <p className="text-gray-400 text-sm">{item.jname}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-400 font-medium">{item.time}</p>
                              <p className="text-gray-500 text-xs">
                                {Math.floor(item.secondsUntilAiring / 3600)}h {Math.floor((item.secondsUntilAiring % 3600) / 60)}m
                              </p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-white mb-2">No Schedule Available</h3>
                          <p className="text-gray-400">Check back later for today's anime schedule.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Trending Page */}
          {currentPage === 'trending' && (
            <motion.div
              key="trending"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="container mx-auto px-4 py-6"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">Trending Anime</h1>
                  <p className="text-gray-400">Most popular anime right now</p>
                </div>

                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                  <p className="text-gray-400">Trending anime section will be available soon.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upcoming Page */}
          {currentPage === 'upcoming' && (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="container mx-auto px-4 py-6"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">Upcoming Anime</h1>
                  <p className="text-gray-400">Get ready for the next big releases</p>
                </div>

                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                  <p className="text-gray-400">Upcoming anime section will be available soon.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* OtakuVerse Page */}
          {currentPage === 'otakuverse' && (
            <motion.div
              key="otakuverse"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OtakuVerse user={user} onAuthRequired={() => setShowAuthModal(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Anime Player Modal */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black border-0">
          {selectedAnime && (
            <AnimePlayer
              anime={selectedAnime}
              episode={selectedEpisode || undefined}
              onEpisodeChange={handleEpisodeChange}
              onClose={() => setShowPlayer(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}