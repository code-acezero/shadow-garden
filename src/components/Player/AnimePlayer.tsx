import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, FastForward, Loader2, Sparkles, Bug, Copy, AlertTriangle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnimePlayerProps {
  url: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean;
  headers?: Record<string, string>;
  onEnded?: () => void;
  onNext?: () => void;
}

// List of proxies to try sequentially
const PROXY_LIST = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=', 
  'https://thingproxy.freeboard.io/fetch/',
  '' // Final fallback: Try direct (no proxy)
];

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
  
  // Debug & Recovery State
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [proxyIndex, setProxyIndex] = useState(0); // Track current proxy
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const log = useCallback((msg: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    setDebugLogs(prev => [`[${time}] ${msg}${dataStr}`, ...prev]);
    console.log(`[PLAYER] ${msg}`, data || '');
  }, []);

  // --- HLS SETUP ---
  useEffect(() => {
    if (!videoRef.current || !url) return;
    const video = videoRef.current;

    log(`Initializing Player with Proxy #${proxyIndex}`, { proxy: PROXY_LIST[proxyIndex] || 'DIRECT' });
    setIsBuffering(true);
    // Do not clear logs here so we can see the history of retries

    // Timeout: If loading takes > 15s, show debug
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
        if (video.readyState < 3) {
            log("TIMEOUT: Video stuck buffering. Showing logs.");
            setShowDebug(true);
        }
    }, 15000);

    const initPlayer = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({ 
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          xhrSetup: (xhr, reqUrl) => {
             // 1. Get Current Proxy Base
             const currentProxy = PROXY_LIST[proxyIndex];
             
             // 2. Intercept Request
             // If we have a proxy, and the URL isn't already proxied, wrap it.
             if (currentProxy && !reqUrl.startsWith(currentProxy)) {
                // Ensure we handle absolute URLs correctly
                const targetUrl = currentProxy + encodeURIComponent(reqUrl);
                xhr.open('GET', targetUrl, true);
             }
             
             // 3. Try injecting headers (Best effort)
             if (headers && !currentProxy.includes('allorigins')) { 
                 // Some proxies like AllOrigins don't support custom headers well
                 Object.entries(headers).forEach(([k, v]) => {
                     if (k.toLowerCase() !== 'referer') { // Browser blocks Referer
                         try { xhr.setRequestHeader(k, v); } catch(e) {}
                     }
                 });
             }
          }
        });
        
        // Initial Load URL
        const currentProxy = PROXY_LIST[proxyIndex];
        const masterUrl = currentProxy ? (currentProxy + encodeURIComponent(url)) : url;
        
        log("Loading Source", masterUrl);
        hls.loadSource(masterUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          log("Manifest Parsed. Starting playback...");
          setIsBuffering(false);
          video.play().catch(e => log("Autoplay Blocked", e.message));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
           if (data.fatal) {
             switch (data.type) {
               case Hls.ErrorTypes.NETWORK_ERROR:
                 log("Fatal Network Error.", data.details);
                 // RETRY LOGIC: Switch Proxy
                 if (proxyIndex < PROXY_LIST.length - 1) {
                     log(`Switching to Proxy #${proxyIndex + 1}...`);
                     setProxyIndex(prev => prev + 1); // Trigger re-render with next proxy
                 } else {
                     log("All proxies failed.");
                     hls.destroy();
                 }
                 break;
               case Hls.ErrorTypes.MEDIA_ERROR:
                 log("Media Error. Recovering...");
                 hls.recoverMediaError();
                 break;
               default:
                 log("Unrecoverable Error.");
                 hls.destroy();
                 break;
             }
           }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        const currentProxy = PROXY_LIST[proxyIndex];
        const masterUrl = currentProxy ? (currentProxy + encodeURIComponent(url)) : url;
        video.src = masterUrl;
        video.addEventListener('loadedmetadata', () => {
           setIsBuffering(false);
           video.play();
        });
        video.addEventListener('error', () => {
            log("Native Video Error", video.error);
            // Simple retry for native
            if (proxyIndex < PROXY_LIST.length - 1) setProxyIndex(prev => prev + 1);
        });
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [url, proxyIndex]); // Re-run when url or proxyIndex changes

  // --- TIME & CONTROLS ---
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    setDuration(videoRef.current.duration || 0);

    if (intro && curr >= intro.start && curr < intro.end) {
      if (autoSkip) videoRef.current.currentTime = intro.end;
      else setShowSkipIntro(true);
    } else setShowSkipIntro(false);

    if (outro && curr >= outro.start && curr < outro.end) {
       if (autoSkip) videoRef.current.currentTime = outro.end;
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
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Keyboard Shortcuts
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

      {/* DEBUG BUTTON */}
      <div className="absolute top-4 right-4 z-50">
         <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }} className="bg-black/50 hover:bg-red-500/50 border-white/10 text-white rounded-full w-8 h-8">
            <Bug size={14} />
         </Button>
      </div>

      {/* DEBUG OVERLAY */}
      {showDebug && (
         <div className="absolute inset-4 z-50 bg-black/90 border border-red-500/50 rounded-xl p-4 flex flex-col font-mono text-xs text-zinc-300 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                <span className="text-red-500 font-bold flex items-center gap-2"><AlertTriangle size={14}/> PLAYER DIAGNOSTICS</span>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(debugLogs, null, 2))} className="h-6 text-[10px] gap-1 hover:bg-white/10"><Copy size={10}/> COPY</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowDebug(false)} className="h-6 w-6 p-0 hover:bg-white/10"><X size={14}/></Button>
                </div>
            </div>
            <ScrollArea className="flex-1">
                {debugLogs.map((l, i) => (
                    <div key={i} className="mb-1 break-all border-b border-white/5 pb-0.5 last:border-0">
                        {l.includes('ERROR') || l.includes('TIMEOUT') ? <span className="text-red-400 font-bold">{l}</span> : 
                         l.includes('Proxy') ? <span className="text-blue-400">{l}</span> : 
                         <span className="text-zinc-400">{l}</span>}
                    </div>
                ))}
            </ScrollArea>
         </div>
      )}

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
        {showControls && !showDebug && (
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