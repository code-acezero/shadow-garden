import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, FastForward, Loader2, Sparkles, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimePlayerProps {
  url: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean; // New Prop
  onEnded?: () => void;
  onNext?: () => void;
}

export default function AnimePlayer({ url, intro, outro, autoSkip = false, onEnded, onNext }: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Skip Button State
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. INITIALIZE PLAYER (HLS Support) ---
  useEffect(() => {
    if (!videoRef.current || !url) return;
    const video = videoRef.current;

    const initPlayer = () => {
      setIsBuffering(true);

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Check for HLS support
      if (Hls.isSupported()) {
        const hls = new Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          backBufferLength: 90
        });
        
        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          // Auto-play usually blocked by browser until interaction, but we try
          video.play().catch(() => {
             setIsPlaying(false);
             setIsMuted(true); // Retry muted if autoplay blocked
             video.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
           if (data.fatal) {
             switch (data.type) {
               case Hls.ErrorTypes.NETWORK_ERROR:
                 console.error("Network error, trying to recover...");
                 hls.startLoad();
                 break;
               case Hls.ErrorTypes.MEDIA_ERROR:
                 console.error("Media error, trying to recover...");
                 hls.recoverMediaError();
                 break;
               default:
                 hls.destroy();
                 break;
             }
           }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari/iOS)
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
           setIsBuffering(false);
           video.play().catch(() => setIsPlaying(false));
        });
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  // --- 2. TIME UPDATE & SKIP LOGIC ---
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    setDuration(videoRef.current.duration || 0);

    // INTRO LOGIC
    if (intro && curr >= intro.start && curr < intro.end) {
      if (autoSkip) {
         videoRef.current.currentTime = intro.end;
         // toast.info("Intro Skipped"); // Optional feedback
      } else {
         setShowSkipIntro(true);
      }
    } else {
      setShowSkipIntro(false);
    }

    // OUTRO LOGIC
    if (outro && curr >= outro.start && curr < outro.end) {
       if (autoSkip) {
          videoRef.current.currentTime = outro.end;
       } else {
          setShowSkipOutro(true);
       }
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

  // --- 3. CONTROLS ---
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    setIsPlaying(!videoRef.current.paused);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
       containerRef.current.requestFullscreen();
       setIsFullscreen(true);
    } else {
       document.exitFullscreen();
       setIsFullscreen(false);
    }
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleVolumeChange = (val: number[]) => {
    if (videoRef.current) {
        const newVol = val[0];
        videoRef.current.volume = newVol;
        setVolume(val);
        setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
     if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
        if (!isMuted) setVolume([0]);
        else setVolume([videoRef.current.volume || 1]);
     }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Keyboard Shortcuts
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (!showControls) setShowControls(true);
        
        switch(e.key.toLowerCase()) {
           case ' ':
           case 'k':
              e.preventDefault();
              togglePlay();
              break;
           case 'f':
              toggleFullscreen();
              break;
           case 'arrowright':
              if (videoRef.current) videoRef.current.currentTime += 5;
              break;
           case 'arrowleft':
              if (videoRef.current) videoRef.current.currentTime -= 5;
              break;
           case 'm':
              toggleMute();
              break;
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group select-none overflow-hidden font-sans rounded-xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay} // Click video to play/pause
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
        crossOrigin="anonymous"
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

      {/* MANUAL SKIP BUTTONS (If AutoSkip is OFF) */}
      <AnimatePresence>
        {!autoSkip && showSkipIntro && intro && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
            className="absolute bottom-24 left-6 z-40 pointer-events-auto"
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
        {!autoSkip && showSkipOutro && outro && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            className="absolute bottom-24 right-6 z-40 pointer-events-auto"
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

      {/* CONTROLS OVERLAY */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-end z-30"
            onClick={(e) => e.stopPropagation()} // Prevent play/pause when clicking controls
          >
            {/* Center Play Button */}
            {!isPlaying && !isBuffering && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-600/90 rounded-full p-6 shadow-[0_0_30px_rgba(220,38,38,0.6)] backdrop-blur-sm pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                     <Play className="w-12 h-12 text-white fill-white translate-x-1" />
                  </div>
               </div>
            )}

            <div className="p-4 md:p-6 space-y-2">
              {/* Progress Bar */}
              <div className="group/slider relative flex items-center h-4 cursor-pointer">
                 <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={(val) => { if (videoRef.current) videoRef.current.currentTime = val[0]; }}
                    className="z-10"
                 />
              </div>

              {/* Bottom Bar */}
              <div className="flex items-center justify-between">
                
                {/* Left Controls */}
                <div className="flex items-center gap-4 text-white">
                  <button onClick={togglePlay} className="hover:text-red-500 transition-colors">
                    {isPlaying ? <Pause size={24} className="fill-current"/> : <Play size={24} className="fill-current"/>}
                  </button>
                  
                  <div className="flex items-center gap-2 group/vol">
                    <button onClick={toggleMute} className="hover:text-red-500 transition-colors">
                       {isMuted || volume[0] === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                       <Slider value={volume} max={1} step={0.01} onValueChange={handleVolumeChange} />
                    </div>
                  </div>
                  
                  <span className="text-sm font-medium font-mono tracking-wide select-none">
                    {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4 text-white">
                  {/* Settings Icon (Placeholder for Quality Selector) */}
                  <Settings size={20} className="hover:text-white text-white/70 cursor-pointer transition-colors" />

                  {onNext && (
                    <button onClick={onNext} className="hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1 rounded hover:bg-white/20">
                       NEXT <SkipForward size={16} />
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