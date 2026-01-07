import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, SkipBack, Settings, FastForward, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimePlayerProps {
  url: string; // The .m3u8 link passed from parent
  onEnded?: () => void; // Callback when video finishes
}

export default function AnimePlayer({ url, onEnded }: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. INITIALIZE HLS ---
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const initPlayer = () => {
      setIsBuffering(true);

      if (Hls.isSupported()) {
        // Destroy previous instance if exists
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
           enableWorker: true,
           lowLatencyMode: true,
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          video.play().catch(() => {
             // Autoplay blocked handling
             setIsPlaying(false);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
           if (data.fatal) {
              console.error("HLS Fatal Error", data);
              // Simple recovery logic
              switch (data.type) {
                 case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                 case Hls.ErrorTypes.MEDIA_ERROR:
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
        // Native HLS (Safari)
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
           setIsBuffering(false);
           video.play();
        });
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  // --- 2. EVENT HANDLERS ---

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (val: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = val[0];
      setCurrentTime(val[0]);
    }
  };

  const handleVolumeChange = (val: number[]) => {
    if (videoRef.current) {
      const newVol = val[0];
      videoRef.current.volume = newVol;
      setVolume([newVol]);
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume[0] || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Mouse Movement for Controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using Space/Arrows
      if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch(e.code) {
        case 'Space': togglePlay(); break;
        case 'ArrowRight': skipTime(10); break;
        case 'ArrowLeft': skipTime(-10); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyM': toggleMute(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen]);


  // --- RENDER ---

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group select-none overflow-hidden"
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
        onPlaying={() => {
           setIsBuffering(false);
           setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <Loader2 className="w-16 h-16 text-red-600 animate-spin drop-shadow-lg" />
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-end z-30"
            onClick={(e) => e.stopPropagation()} // Prevent playing when clicking controls
          >
            
            {/* Center Play Button (Only visible if paused) */}
            {!isPlaying && !isBuffering && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-600/90 rounded-full p-6 shadow-[0_0_30px_rgba(220,38,38,0.6)] backdrop-blur-sm pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                     <Play className="w-12 h-12 text-white fill-white translate-x-1" />
                  </div>
               </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="p-4 md:p-6 space-y-2">
              
              {/* Progress Bar */}
              <div className="group/slider relative flex items-center h-4 cursor-pointer">
                 <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={handleSeek}
                    className="z-10"
                 />
              </div>

              {/* Buttons Row */}
              <div className="flex items-center justify-between">
                
                {/* Left: Play/Vol/Time */}
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

                  <span className="text-sm font-medium font-mono tracking-wide">
                    {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                  </span>
                </div>

                {/* Right: Skips/Settings/Fullscreen */}
                <div className="flex items-center gap-4 text-white">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => skipTime(85)} 
                    className="hidden md:flex text-xs font-bold border border-white/20 hover:bg-white/10 hover:border-white/50"
                  >
                     SKIP INTRO
                  </Button>
                  
                  <button onClick={() => skipTime(-10)} className="hover:text-red-500 transition-colors" title="-10s">
                     <SkipBack size={20} />
                  </button>
                  <button onClick={() => skipTime(10)} className="hover:text-red-500 transition-colors" title="+10s">
                     <SkipForward size={20} />
                  </button>

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