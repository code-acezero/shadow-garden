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
  autoSkip?: boolean;
  headers?: Record<string, string>;
  onEnded?: () => void;
  onNext?: () => void;
}

export default function AnimePlayer({ url, intro, outro, autoSkip = false, headers, onEnded, onNext }: AnimePlayerProps) {
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
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoRef.current || !url) return;
    const video = videoRef.current;

    const initPlayer = () => {
      setIsBuffering(true);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          backBufferLength: 90
        });
        
        // Attempt direct load first
        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          video.play().catch(() => {
             setIsPlaying(false);
             setIsMuted(true);
             video.play().catch(() => {});
          });
        });

        // Error Recovery & Proxy Fallback
        hls.on(Hls.Events.ERROR, (event, data) => {
           if (data.fatal) {
             switch (data.type) {
               case Hls.ErrorTypes.NETWORK_ERROR:
                 console.warn("Network error, attempting proxy fallback...");
                 // If direct fails, try via proxy
                 if (!url.includes('corsproxy.io')) {
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    hls.loadSource(proxyUrl);
                 } else {
                    hls.startLoad(); 
                 }
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
  }, [url]); // Headers removed from dep array as we handle them via proxy logic if needed

  // ... (Time Update Logic same as before) ...
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    setDuration(videoRef.current.duration || 0);

    if (intro && curr >= intro.start && curr < intro.end) {
      if (autoSkip) videoRef.current.currentTime = intro.end;
      else setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }

    if (outro && curr >= outro.start && curr < outro.end) {
       if (autoSkip) videoRef.current.currentTime = outro.end;
       else setShowSkipOutro(true);
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
        videoRef.current.volume = val[0];
        setVolume(val);
        setIsMuted(val[0] === 0);
    }
  };

  const toggleMute = () => {
     if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
        setVolume([isMuted ? (videoRef.current.volume || 1) : 0]);
     }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (!showControls) setShowControls(true);
        switch(e.key.toLowerCase()) {
           case ' ': case 'k': e.preventDefault(); togglePlay(); break;
           case 'f': toggleFullscreen(); break;
           case 'arrowright': if (videoRef.current) videoRef.current.currentTime += 5; break;
           case 'arrowleft': if (videoRef.current) videoRef.current.currentTime -= 5; break;
           case 'm': toggleMute(); break;
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group select-none overflow-hidden font-sans rounded-xl aspect-video" // Ensure aspect ratio here too
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
        crossOrigin="anonymous"
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <div className="relative">
             <div className="w-16 h-16 border-4 border-red-600/30 rounded-full animate-ping absolute inset-0" />
             <Loader2 className="w-16 h-16 text-red-600 animate-spin drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] relative z-10" />
           </div>
        </div>
      )}

      <AnimatePresence>
        {!autoSkip && showSkipIntro && intro && (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="absolute bottom-24 left-6 z-40 pointer-events-auto">
            <Button onClick={(e) => { e.stopPropagation(); skipTo(intro.end); }} className="bg-black/60 hover:bg-red-900/80 border border-red-500/50 backdrop-blur-xl text-white font-bold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)]">
              <Sparkles className="mr-2 w-4 h-4 text-red-400 animate-pulse" /> SKIP OPENING
            </Button>
          </motion.div>
        )}
        {!autoSkip && showSkipOutro && outro && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="absolute bottom-24 right-6 z-40 pointer-events-auto">
            <Button onClick={(e) => { e.stopPropagation(); skipTo(outro.end); }} className="bg-black/60 hover:bg-purple-900/80 border border-purple-500/50 backdrop-blur-xl text-white font-bold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)]">
              SKIP ENDING <FastForward className="ml-2 w-4 h-4 text-purple-400" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-end z-30" onClick={(e) => e.stopPropagation()}>
            {!isPlaying && !isBuffering && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-600/90 rounded-full p-6 shadow-[0_0_30px_rgba(220,38,38,0.6)] backdrop-blur-sm pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                     <Play className="w-12 h-12 text-white translate-x-1" />
                  </div>
               </div>
            )}
            <div className="p-4 md:p-6 space-y-2">
              <div className="group/slider relative flex items-center h-4 cursor-pointer">
                 <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={(val) => { if (videoRef.current) videoRef.current.currentTime = val[0]; }} className="z-10" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-white">
                  <button onClick={togglePlay} className="hover:text-red-500 transition-colors">{isPlaying ? <Pause size={24} className="fill-current"/> : <Play size={24} className="fill-current"/>}</button>
                  <div className="flex items-center gap-2 group/vol">
                    <button onClick={toggleMute} className="hover:text-red-500 transition-colors">{isMuted || volume[0] === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
                    <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300"><Slider value={volume} max={1} step={0.01} onValueChange={handleVolumeChange} /></div>
                  </div>
                  <span className="text-sm font-medium font-mono tracking-wide">{formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-4 text-white">
                  {onNext && <button onClick={onNext} className="hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1 rounded hover:bg-white/20">NEXT <SkipForward size={16} /></button>}
                  <button onClick={toggleFullscreen} className="hover:text-red-500 transition-colors">{isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}