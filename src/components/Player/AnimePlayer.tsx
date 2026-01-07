import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Settings, MessageCircle, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimeAPI, ConsumetAnime, ConsumetStreamingLinks } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AnimePlayerProps {
  anime: ConsumetAnime;
  episodeId: string;
  onClose?: () => void;
  onNextEpisode?: () => void;
}

export default function AnimePlayer({ anime, episodeId, onClose, onNextEpisode }: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [sources, setSources] = useState<ConsumetStreamingLinks | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState([0.8]);

  // Load Streaming Sources
  useEffect(() => {
    const loadVideo = async () => {
      const data = await AnimeAPI.getEpisodeSources(episodeId);
      if (data && data.sources.length > 0) {
        setSources(data);
        initHls(data.sources[0].url);
      } else {
        toast.error("Failed to load stream. Try another server.");
      }
    };
    loadVideo();
  }, [episodeId]);

  // Initialize HLS.js
  const initHls = (url: string) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
  };

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (val: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = val[0];
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden group cursor-none"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video 
        ref={videoRef} 
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 p-6 flex flex-col justify-between"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h2 className="text-white font-bold text-xl">{anime.title}</h2>
                <span className="text-gray-400 text-sm">Streaming now in HD</span>
              </div>
              <Button onClick={onClose} variant="ghost" className="text-white">✕</Button>
            </div>

            {/* Middle Action */}
            <div className="flex justify-center items-center gap-12">
              <Button onClick={() => (videoRef.current!.currentTime -= 10)} variant="ghost" className="text-white hover:scale-110">
                <SkipBack size={32} />
              </Button>
              <Button onClick={togglePlay} className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/40">
                {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
              </Button>
              <Button onClick={() => (videoRef.current!.currentTime += 10)} variant="ghost" className="text-white hover:scale-110">
                <SkipForward size={32} />
              </Button>
            </div>

            {/* Bottom Bar */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider 
                  value={[currentTime]} max={duration} step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Volume2 size={20} />
                    <Slider value={volume} max={1} step={0.01} onValueChange={setVolume} className="w-24" />
                  </div>
                  <span className="text-xs font-mono">
                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2,'0')} / 
                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2,'0')}
                  </span>
                </div>

                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => (videoRef.current!.currentTime += 85)} className="text-xs bg-white/10">Skip Intro</Button>
                  <Button variant="ghost" onClick={onNextEpisode} className="hover:text-red-500">
                    <FastForward size={20} />
                  </Button>
                  <Maximize size={20} className="cursor-pointer hover:text-red-500" onClick={() => containerRef.current?.requestFullscreen()} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}