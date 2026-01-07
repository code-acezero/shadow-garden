import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, FastForward, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimePlayerProps {
  url: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  onEnded?: () => void;
  onNext?: () => void;
}

export default function AnimePlayer({ url, intro, outro, onEnded, onNext }: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Skip Button State
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- HLS SETUP ---
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const initPlayer = () => {
      setIsBuffering(true);
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          video.play().catch(() => setIsPlaying(false));
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
           setIsBuffering(false);
           video.play();
        });
      }
    };
    initPlayer();
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [url]);

  // --- TIME UPDATE & SKIP LOGIC ---
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    setDuration(videoRef.current.duration || 0);

    // Check Intro
    if (intro && curr >= intro.start && curr <= intro.end) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }

    // Check Outro
    if (outro && curr >= outro.start && curr <= outro.end) {
        setShowSkipOutro(true);
    } else {
        setShowSkipOutro(false);
    }
  };

  const skipTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setShowSkipIntro(false);
      setShowSkipOutro(false);
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    setIsPlaying(!videoRef.current.paused);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen();
    setIsFullscreen(!document.fullscreenElement);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleVolumeChange = (val: number[]) => {
    if (videoRef.current) {
        videoRef.current.volume = val[0];
        setVolume(val);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group select-none overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
      onDoubleClick={toggleFullscreen}
    >
      <video 
        ref={videoRef} 
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <div className="relative">
             <div className="w-16 h-16 border-4 border-red-600/30 rounded-full animate-ping absolute inset-0" />
             <Loader2 className="w-16 h-16 text-red-600 animate-spin drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] relative z-10" />
           </div>
        </div>
      )}

      {/* MAGICAL SKIP BUTTONS */}
      <AnimatePresence>
        {showSkipIntro && intro && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
            className="absolute bottom-24 left-6 z-40"
          >
            <Button 
              onClick={(e) => { e.stopPropagation(); skipTo(intro.end); }}
              className="bg-black/60 hover:bg-red-900/80 border border-red-500/50 backdrop-blur-xl text-white font-bold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)] group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent translate-x-[-100%] group-hover/btn:animate-shimmer" />
              <Sparkles className="mr-2 w-4 h-4 text-red-400 fill-red-400 animate-pulse" />
              SKIP OPENING
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSkipOutro && outro && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            className="absolute bottom-24 right-6 z-40"
          >
            <Button 
              onClick={(e) => { e.stopPropagation(); skipTo(outro.end); }}
              className="bg-black/60 hover:bg-purple-900/80 border border-purple-500/50 backdrop-blur-xl text-white font-bold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)] group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent translate-x-[-100%] group-hover/btn:animate-shimmer" />
              SKIP ENDING
              <FastForward className="ml-2 w-4 h-4 text-purple-400 fill-purple-400" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-end z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {!isPlaying && !isBuffering && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-600/90 rounded-full p-6 shadow-[0_0_30px_rgba(220,38,38,0.6)] backdrop-blur-sm pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                     <Play className="w-12 h-12 text-white fill-white translate-x-1" />
                  </div>
               </div>
            )}

            <div className="p-4 md:p-6 space-y-2">
              <div className="group/slider relative flex items-center h-4 cursor-pointer">
                 <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={(val) => { if (videoRef.current) videoRef.current.currentTime = val[0]; }}
                    className="z-10"
                 />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-white">
                  <button onClick={togglePlay} className="hover:text-red-500 transition-colors">
                    {isPlaying ? <Pause size={24} className="fill-current"/> : <Play size={24} className="fill-current"/>}
                  </button>
                  <div className="flex items-center gap-2 group/vol">
                    <Volume2 size={24} />
                    <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                       <Slider value={volume} max={1} step={0.01} onValueChange={handleVolumeChange} />
                    </div>
                  </div>
                  <span className="text-sm font-medium font-mono tracking-wide">
                    {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-white">
                  {onNext && (
                    <button onClick={onNext} className="hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-bold">
                       NEXT EP <SkipForward size={20} />
                    </button>
                  )}
                  <button onClick={toggleFullscreen} className="hover:text-red-500 transition-colors">
                     {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}