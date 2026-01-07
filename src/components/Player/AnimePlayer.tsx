import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Settings, Download, Share2, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anime, Episode, WatchlistAPI, UserAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AnimePlayerProps {
  anime: Anime;
  episode?: Episode;
  episodes?: Episode[];
  onEpisodeChange?: (episode: Episode) => void;
  onClose?: () => void;
}

export default function AnimePlayer({ anime, episode, episodes = [], onEpisodeChange, onClose }: AnimePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentServer, setCurrentServer] = useState('server1');
  const [quality, setQuality] = useState('1080p');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<{id: string, user: string, text: string, time: number}>>([]);
  const [newComment, setNewComment] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const servers = [
    { id: 'server1', name: 'Zoro.to (Primary)', quality: '1080p' },
    { id: 'server2', name: 'GogoAnime (Backup)', quality: '720p' },
    { id: 'server3', name: 'AnimeFox (Alternative)', quality: '480p' }
  ];

  const qualities = ['1080p', '720p', '480p', '360p'];
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleVideoEnd = () => {
    // Auto-play next episode
    const currentIndex = episodes.findIndex(ep => ep.mal_id === episode?.mal_id);
    if (currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1];
      onEpisodeChange?.(nextEpisode);
      toast.success(`Now playing: ${nextEpisode.title}`);
    }
  };

  const handleServerChange = (serverId: string) => {
    setCurrentServer(serverId);
    const server = servers.find(s => s.id === serverId);
    toast.info(`Switched to ${server?.name}`);
  };

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    toast.info(`Quality changed to ${newQuality}`);
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    toast.info(`Playback speed: ${speed}x`);
  };

  const skipIntro = () => {
    skipTime(90); // Skip 90 seconds (typical intro length)
    toast.info('Intro skipped');
  };

  const skipOutro = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = video.duration - 30; // Go to last 30 seconds
    toast.info('Jumped to outro');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      user: 'Anonymous', // Replace with actual user
      text: newComment,
      time: currentTime
    };

    setComments([...comments, comment]);
    setNewComment('');
    toast.success('Comment added!');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={anime.images.jpg.large_image_url}
        onClick={togglePlay}
      >
        <source src="/api/placeholder/video" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {!duration && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading episode...</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  ← Back
                </Button>
                <div>
                  <h3 className="text-white font-semibold">
                    {anime.title_english || anime.title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {episode ? `Episode ${episode.episode}: ${episode.title}` : 'Episode 1'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
              >
                <Button
                  onClick={togglePlay}
                  size="lg"
                  className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Play className="w-8 h-8 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Skip Buttons */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-auto">
              <Button
                onClick={skipIntro}
                className="bg-gray-800/80 hover:bg-gray-700 text-white"
              >
                Skip Intro
              </Button>
            </div>

            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-auto">
              <Button
                onClick={skipOutro}
                className="bg-gray-800/80 hover:bg-gray-700 text-white"
              >
                Skip Outro
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4 pointer-events-auto">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-white text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => skipTime(-10)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>

                  <Button
                    onClick={() => skipTime(10)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select value={currentServer} onValueChange={handleServerChange}>
                    <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {servers.map((server) => (
                        <SelectItem key={server.id} value={server.id} className="text-white">
                          {server.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Player Settings</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="quality" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                          <TabsTrigger value="quality">Quality</TabsTrigger>
                          <TabsTrigger value="speed">Speed</TabsTrigger>
                        </TabsList>
                        <TabsContent value="quality" className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Video Quality</label>
                            <Select value={quality} onValueChange={handleQualityChange}>
                              <SelectTrigger className="bg-gray-800 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                {qualities.map((q) => (
                                  <SelectItem key={q} value={q} className="text-white">
                                    {q}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>
                        <TabsContent value="speed" className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Playback Speed</label>
                            <div className="grid grid-cols-4 gap-2">
                              {speeds.map((speed) => (
                                <Button
                                  key={speed}
                                  variant={playbackSpeed === speed ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSpeedChange(speed)}
                                  className={playbackSpeed === speed ? "bg-red-600" : ""}
                                >
                                  {speed}x
                                </Button>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => setShowComments(!showComments)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 w-80 h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-700 p-4 overflow-y-auto"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Comments</h3>
                <Button
                  onClick={() => setShowComments(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button
                  onClick={handleAddComment}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Add Comment
                </Button>
              </div>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{comment.user}</span>
                      <span className="text-gray-400 text-xs">{formatTime(comment.time)}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}