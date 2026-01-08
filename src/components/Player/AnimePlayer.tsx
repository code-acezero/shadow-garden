import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, FastForward, Loader2, Sparkles, RefreshCw, AlertCircle
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

  // Player State
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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logger
  const addDebug = (message: string) => {
    console.log('[AnimePlayer]', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (!videoRef.current || !url) return;
    const video = videoRef.current;

    const PROXY_BASE = '/api/proxy?url=';

    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');
    addDebug(`Initializing player with URL: ${url.substring(0, 50)}...`);

    const initPlayer = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        addDebug('HLS.js is supported, initializing...');
        
        const hls = new Hls({ 
          debug: false,
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          // NO xhrSetup - let the proxy handle URL rewriting
        });
        
        const masterUrl = PROXY_BASE + encodeURIComponent(url);
        addDebug(`Loading master playlist: ${masterUrl.substring(0, 80)}...`);
        
        hls.loadSource(masterUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          addDebug(`Manifest parsed! ${data.levels.length} quality levels found`);
          setIsBuffering(false);
          video.play().catch(err => {
            addDebug(`Autoplay failed: ${err.message}`);
          });
        });

        hls.on(Hls.Events.MANIFEST_LOADED, () => {
          addDebug('Master manifest loaded successfully');
        });

        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          addDebug(`Level loaded: ${data.details.totalduration}s duration`);
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          addDebug(`Fragment loaded: ${data.frag.sn}`);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          addDebug(`HLS Error: ${data.type} - ${data.details}`);
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                addDebug('Fatal network error, attempting recovery...');
                setErrorMessage('Network error - retrying...');
                setTimeout(() => {
                  hls.startLoad();
                }, 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                addDebug('Fatal media error, attempting recovery...');
                setErrorMessage('Media error - recovering...');
                hls.recoverMediaError();
                break;
              default:
                addDebug('Unrecoverable error, destroying player');
                setErrorMessage(`Playback failed: ${data.details}`);
                hls.destroy();
                setHasError(true);
                break;
            }
          } else {
            // Non-fatal errors
            setErrorMessage(`Warning: ${data.details}`);
            setTimeout(() => setErrorMessage(''), 3000);
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        addDebug('Using native HLS support (Safari)');
        video.src = PROXY_BASE + encodeURIComponent(url);
        
        video.addEventListener('loadedmetadata', () => {
          addDebug('Metadata loaded');
          setIsBuffering(false);
          video.play().catch(err => addDebug(`Play failed: ${err.message}`));
        });
        
        video.addEventListener('error', (e) => {
          const error = video.error;
          addDebug(`Video error: ${error?.message || 'Unknown error'}`);
          setErrorMessage(`Video error: ${error?.message || 'Unknown'}`);
          setHasError(true);
        });
      } else {
        addDebug('HLS not supported in this browser');
        setErrorMessage('HLS playback not supported in this browser');
        setHasError(true);
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    setDuration(videoRef.current.duration || 0);

    if (intro && curr >= intro.start && curr < intro.end) {
      if(autoSkip) videoRef.current.currentTime = intro.end;
      else setShowSkipIntro(true);
    } else setShowSkipIntro(false);
    
    if (outro && curr >= outro.start && curr < outro.end) {
      if(autoSkip) videoRef.current.currentTime = outro.end;
      else setShowSkipOutro(true);
    } else setShowSkipOutro(false);
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
    if (videoRef.current.paused) {
      videoRef.current.play().catch(err => addDebug(`Play failed: ${err.message}`));
    } else {
      videoRef.current.pause();
    }
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
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleVolumeChange = (val: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = val[0];
      setVolume(val);
      setIsMuted(val[0] === 0);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group select-none overflow-hidden font-sans rounded-xl aspect-video"
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

      {/* Debug Info Overlay (top-left corner) */}
      {debugInfo.length > 0 && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded max-w-md z-50 font-mono">
          {debugInfo.map((info, i) => (
            <div key={i} className="opacity-80">{info}</div>
          ))}
        </div>
      )}

      {/* Error Message (non-fatal) */}
      {errorMessage && !hasError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-lg z-40 flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-600/30 rounded-full animate-ping absolute inset-0" />
            <Loader2 className="w-16 h-16 text-red-600 animate-spin drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] relative z-10" />
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 p-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Playback Error</h3>
          <p className="text-white/70 text-sm mb-4 max-w-md">{errorMessage || 'Failed to load video'}</p>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} variant="secondary" size="sm">
              <RefreshCw size={14} className="mr-2"/> Reload Page
            </Button>
            <Button onClick={() => {
              setHasError(false);
              setErrorMessage('');
              if (hlsRef.current) hlsRef.current.destroy();
              window.location.reload();
            }} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!autoSkip && showSkipIntro && intro && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }} 
            className="absolute bottom-24 left-6 z-40 pointer-events-auto"
          >
            <Button 
              onClick={(e) => { e.stopPropagation(); skipTo(intro.end); }} 
              className="bg-black/60 hover:bg-red-900/80 border border-red-500/50 backdrop-blur-xl text-white font-bold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)]"
            >
              <Sparkles className="mr-2 w-4 h-4 text-red-400 animate-pulse" /> SKIP OPENING
            </Button>
          </motion.div>
        )}
        {!autoSkip && showSkipOutro && outro && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 50 }} 
            className="absolute bottom-24 right-6 z-40 pointer-events-auto"
          >
            <Button 
              onClick={(e) => { e.stopPropagation(); skipTo(outro.end); }} 
              className="bg-black/60 hover:bg-purple-900/80 border border-purple-500/50 backdrop-blur-xl text-white font-bold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            >
              SKIP ENDING <FastForward className="ml-2 w-4 h-4 text-purple-400" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div 
                  className="bg-red-600/90 rounded-full p-6 shadow-[0_0_30px_rgba(220,38,38,0.6)] backdrop-blur-sm pointer-events-auto cursor-pointer hover:scale-110 transition-transform" 
                  onClick={togglePlay}
                >
                  <Play className="w-12 h-12 text-white translate-x-1" />
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
                    <button 
                      onClick={() => { 
                        if(videoRef.current) { 
                          videoRef.current.muted = !isMuted; 
                          setIsMuted(!isMuted); 
                        } 
                      }} 
                      className="hover:text-red-500 transition-colors"
                    >
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
                <div className="flex items-center gap-4 text-white">
                  {onNext && (
                    <button 
                      onClick={onNext} 
                      className="hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1 rounded hover:bg-white/20"
                    >
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