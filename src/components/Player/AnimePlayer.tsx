"use client";

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, 
  Settings, Maximize, Minimize, Subtitles, 
  Wand2, AudioWaveform, PictureInPicture, Gauge,
  ChevronRight, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimePlayerProps {
  url: string;
  title?: string;
  poster?: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean;
  startTime?: number; 
  onEnded?: () => void;
  onNext?: () => void;
  onProgress?: (state: { playedSeconds: number; loadedSeconds: number }) => void;
  onInteract?: () => void; 
  onPause?: () => void;
  onBuffer?: () => void;
  controlsTimeout?: number; 
  onControlsChange?: (visible: boolean) => void;
  initialVolume?: number;
  initialSpeed?: number;
  onSettingsChange?: (key: string, value: any) => void;
}

export interface AnimePlayerRef {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (time: number) => void;
}

const AnimePlayer = forwardRef<AnimePlayerRef, AnimePlayerProps>(({ 
  url, title, poster, intro, outro, autoSkip = false, startTime = 0,
  onEnded, onNext, onProgress, onInteract, onPause, onBuffer, 
  controlsTimeout = 3000, onControlsChange, initialVolume = 1, initialSpeed = 1, onSettingsChange
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

  // LOGIC 1 & 4: Resume State & Save Guard
  const hasResumed = useRef(false);
  const [canSave, setCanSave] = useState(false); // Blocks saving for first 10s

  const [speed, setSpeed] = useState(initialSpeed);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [currentAudio, setCurrentAudio] = useState(-1);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(-1);
  const [activeMenu, setActiveMenu] = useState<'none' | 'quality' | 'speed' | 'audio' | 'subs'>('none');

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    seekTo: (time: number) => { 
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            if(canSave) onInteract?.();
        }
    }
  }));

  // Initial Sync
  useEffect(() => {
      if(videoRef.current) {
          videoRef.current.volume = initialVolume;
          videoRef.current.playbackRate = initialSpeed;
      }
      setVolume(initialVolume);
      setSpeed(initialSpeed);
  }, [initialVolume, initialSpeed]);

  useEffect(() => {
      onControlsChange?.(showControls);
  }, [showControls, onControlsChange]);

  useEffect(() => {
    if (titleContainerRef.current && titleTextRef.current) {
        setIsTitleOverflowing(titleTextRef.current.scrollWidth > titleContainerRef.current.clientWidth);
    }
  }, [title]);

  // LOGIC 4: Grace Period Reset on new Start Time
  useEffect(() => {
      hasResumed.current = false;
      setCanSave(false);
      // Wait 10 seconds after a new startTime is received before allowing saves
      const timer = setTimeout(() => {
          setCanSave(true);
      }, 10000);
      return () => clearTimeout(timer);
  }, [startTime, url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsBuffering(true);
    if (hlsRef.current) hlsRef.current.destroy();

    const finalUrl = url.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

    if (Hls.isSupported()) {
      const hls = new Hls({ 
        capLevelToPlayerSize: true, 
        autoStartLoad: true,
        startLevel: -1,
      });

      hls.loadSource(finalUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({ height: l.height, index: i })).sort((a, b) => b.height - a.height);
        setQualities(levels);
        video.play().catch(() => console.log("Autoplay blocked"));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setCurrentQuality(data.level));
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => { setAudioTracks(data.audioTracks); setCurrentAudio(data.audioTracks.findIndex(t => t.default)); });
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => setSubtitles(data.subtitleTracks));

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = finalUrl;
      video.addEventListener('loadedmetadata', () => { video.play(); });
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') seek(10);
      if (e.code === 'ArrowLeft') seek(-10);
      if (e.code === 'KeyF') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  // LOGIC 3: Force Seek when playing actually starts
  const handlePlaying = () => {
      setIsBuffering(false);
      const video = videoRef.current;
      if (startTime > 0 && !hasResumed.current && video) {
          // Force jump to saved time
          video.currentTime = startTime;
          hasResumed.current = true;
      }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
        videoRef.current.play();
    } else {
        videoRef.current.pause();
        if(canSave) onInteract?.(); 
    }
  }, [onInteract, canSave]);

  const seek = (amount: number) => {
    if (videoRef.current) {
        videoRef.current.currentTime += amount;
        if(canSave) onInteract?.(); 
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await videoRef.current.requestPictureInPicture();
    } catch (e) { console.error("PiP failed", e); }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isScrubbing) return;
    
    setCurrentTime(video.currentTime);
    
    // LOGIC 4: Only emit progress if grace period passed
    if (onProgress && canSave) {
        onProgress({ playedSeconds: video.currentTime, loadedSeconds: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0 });
    }

    if (intro && video.currentTime >= intro.start && video.currentTime <= intro.end) {
      if (autoSkip) video.currentTime = intro.end;
      else setShowSkipIntro(true);
    } else setShowSkipIntro(false);
  };

  const changeQuality = (index: number) => { if (hlsRef.current) hlsRef.current.currentLevel = index; setCurrentQuality(index); setActiveMenu('none'); if(canSave) onInteract?.(); onSettingsChange?.('quality', index); };
  const changeSpeed = (rate: number) => { if (videoRef.current) videoRef.current.playbackRate = rate; setSpeed(rate); setActiveMenu('none'); if(canSave) onInteract?.(); onSettingsChange?.('speed', rate); };
  const changeAudio = (index: number) => { if (hlsRef.current) hlsRef.current.audioTrack = index; setCurrentAudio(index); setActiveMenu('none'); if(canSave) onInteract?.(); };
  const changeSubtitle = (index: number) => { if (hlsRef.current) hlsRef.current.subtitleTrack = index; setCurrentSubtitle(index); setActiveMenu('none'); if(canSave) onInteract?.(); };

  const handleSeekStart = () => setIsScrubbing(true);
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentTime(parseFloat(e.target.value));
  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement>) => {
    const time = parseFloat(e.currentTarget.value);
    if (videoRef.current) videoRef.current.currentTime = time;
    setIsScrubbing(false);
    if(canSave) onInteract?.(); 
  };
  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setHoverTime(percent * duration);
    setHoverPos(percent * 100);
  };

  const formatTime = (t: number) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleGesture = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeMenu !== 'none') { setActiveMenu('none'); return; }
    if (e.detail === 2) {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if ((e.clientX - rect.left) < rect.width * 0.3) seek(-10);
      else if ((e.clientX - rect.left) > rect.width * 0.7) seek(10);
      else toggleFullscreen();
    } else {
      clickTimerRef.current = setTimeout(() => { togglePlay(); clickTimerRef.current = null; }, 250);
    }
  };

  const showUI = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (isPlaying && activeMenu === 'none') setShowControls(false); }, controlsTimeout);
  };

  return (
    <div 
      ref={containerRef}
      className="group relative w-full aspect-video bg-black overflow-hidden font-sans select-none rounded-2xl shadow-2xl ring-1 ring-white/10"
      onClick={handleGesture}
      onMouseMove={showUI}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full cursor-none object-contain"
        onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
        onPause={() => { setIsPlaying(false); onPause?.(); if(canSave) onInteract?.(); }}
        onWaiting={() => { setIsBuffering(true); onBuffer?.(); }}
        // [CRITICAL] Resume happens here
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { if(canSave) onInteract?.(); onEnded?.(); }}
        crossOrigin="anonymous"
        playsInline
      />
      {isBuffering && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"><div className="relative w-40 h-40 flex items-center justify-center"><img src="/run-happy.gif" alt="Loading..." className="w-32 h-32 object-contain relative z-10" /><div className="absolute bottom-4 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent animate-slide-fast" /></div><p className="mt-4 font-[Cinzel] text-red-500 animate-pulse tracking-[0.4em] text-[10px] font-bold uppercase">Loading Reality...</p></div>)}
      <div className={cn("absolute top-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 max-w-[80%] w-auto", showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10")}><div ref={titleContainerRef} className="bg-black/80 border border-white/10 rounded-full px-6 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 overflow-hidden"><div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red] shrink-0" /><div className="overflow-hidden w-full relative h-4 flex items-center"><span ref={titleTextRef} className={cn("text-[10px] font-black text-gray-200 uppercase tracking-widest whitespace-nowrap", isTitleOverflowing && "animate-marquee-slow")}>{title || "Shadow Garden Player"}</span></div></div></div>
      {!isBuffering && (<div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300", !isPlaying || showControls ? "opacity-100 scale-100" : "opacity-0 scale-150")}><div className="w-16 h-16 bg-red-600/20 border border-red-500/50 rounded-full flex items-center justify-center backdrop-blur-sm text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]">{isPlaying ? <Pause fill="white" size={24}/> : <Play fill="white" size={24} className="ml-1" />}</div></div>)}

      <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end px-4 pb-4 md:px-6 md:pb-6 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className="group/seek relative w-full h-4 flex items-center cursor-pointer mb-2" onMouseMove={handleSeekHover} onMouseLeave={() => setHoverTime(null)}>
           {hoverTime !== null && (<div className="absolute bottom-6 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded-md text-[10px] font-mono text-white shadow-lg pointer-events-none" style={{ left: `${hoverPos}%` }}>{formatTime(hoverTime)}</div>)}
           <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${(currentTime / duration) * 100}%` }} /></div>
           <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 border-2 border-white rounded-full shadow-[0_0_10px_white] scale-0 group-hover/seek:scale-100 transition-transform pointer-events-none" style={{ left: `calc(${Math.min(Math.max((currentTime / duration) * 100, 0), 100)}% - 7px)` }} />
           <input type="range" min={0} max={duration || 100} step="0.1" value={currentTime} onMouseDown={handleSeekStart} onChange={handleSeekChange} onMouseUp={handleSeekEnd} className="absolute inset-0 w-full opacity-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
        </div>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4 md:gap-6">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-red-500 transition-colors">{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
              <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="relative group/btn w-8 h-8 rounded-full border border-white/20 hover:border-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"><RotateCcw size={14} className="text-white/80 group-hover/btn:text-white absolute" style={{ clipPath: 'inset(0 0 50% 0)' }} /><span className="text-[9px] font-black text-white mt-1">10</span></button>
                  <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="relative group/btn w-8 h-8 rounded-full border border-white/20 hover:border-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"><RotateCw size={14} className="text-white/80 group-hover/btn:text-white absolute" style={{ clipPath: 'inset(0 0 50% 0)' }} /><span className="text-[9px] font-black text-white mt-1">10</span></button>
              </div>
              <div className="hidden md:flex items-center gap-2 group/vol"><button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>{isMuted || volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button><div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 flex items-center"><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); if(videoRef.current) videoRef.current.volume = parseFloat(e.target.value); setIsMuted(parseFloat(e.target.value) === 0); onSettingsChange?.('volume', parseFloat(e.target.value)); }} className="w-full h-1 accent-red-600 cursor-pointer bg-white/20 rounded-full" onClick={(e) => e.stopPropagation()} /></div></div>
              <div className="text-[10px] font-bold text-zinc-400 font-mono"><span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}</div>
           </div>
           <div className="flex items-center gap-3 md:gap-5 relative">
              <div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'speed' ? 'none' : 'speed'); }} className={cn("hover:text-red-500 transition-colors", activeMenu === 'speed' && "text-red-500")}><Gauge size={18} /></button>{activeMenu === 'speed' && (<div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-2xl p-2 min-w-[100px] shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">{[0.5, 1, 1.25, 1.5, 2].map(r => (<button key={r} onClick={(e) => { e.stopPropagation(); changeSpeed(r); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", speed === r ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>{r}x</button>))}</div>)}</div>
              {audioTracks.length > 1 && (<div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio'); }} className={cn("hover:text-red-500 transition-colors", activeMenu === 'audio' && "text-red-500")}><AudioWaveform size={18} /></button>{activeMenu === 'audio' && (<div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-2xl p-2 min-w-[140px] shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">{audioTracks.map((t, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); changeAudio(i); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all truncate", currentAudio === i ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>{t.name || `Audio ${i+1}`}</button>))}</div>)}</div>)}
              {subtitles.length > 0 && (<div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'subs' ? 'none' : 'subs'); }} className={cn("hover:text-red-500 transition-colors", activeMenu === 'subs' && "text-red-500")}><Subtitles size={20} /></button>{activeMenu === 'subs' && (<div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-2xl p-2 min-w-[140px] shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2 max-h-48 overflow-y-auto scrollbar-hide"><button onClick={(e) => { e.stopPropagation(); changeSubtitle(-1); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", currentSubtitle === -1 ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>Off</button>{subtitles.map((t, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); changeSubtitle(i); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all truncate", currentSubtitle === i ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>{t.name || `Lang ${i+1}`}</button>))}</div>)}</div>)}
              {qualities.length > 0 && (<div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'quality' ? 'none' : 'quality'); }} className={cn("hover:text-red-500 transition-colors", activeMenu === 'quality' && "text-red-500")}><Settings size={20} /></button>{activeMenu === 'quality' && (<div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-2xl p-2 min-w-[100px] shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2"><button onClick={(e) => { e.stopPropagation(); changeQuality(-1); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", currentQuality === -1 ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>Auto</button>{qualities.map((q) => (<button key={q.index} onClick={(e) => { e.stopPropagation(); changeQuality(q.index); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", currentQuality === q.index ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>{q.height}p</button>))}</div>)}</div>)}
              <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="hidden md:block hover:text-red-500 transition-colors"><PictureInPicture size={20}/></button><button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:text-red-500 transition-colors"><Maximize size={20}/></button>
           </div>
        </div>
      </div>
      {showSkipIntro && (<button onClick={(e) => { e.stopPropagation(); if (videoRef.current && intro) videoRef.current.currentTime = intro.end; }} className="absolute bottom-20 left-6 bg-black/80 hover:bg-white text-white hover:text-black border border-white/20 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-left duration-500 z-50"><Wand2 size={12} /> Skip Intro</button>)}
      {!isPlaying && duration > 0 && Math.abs(currentTime - duration) < 1 && onNext && (<button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute bottom-24 right-6 bg-white text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_white] z-50 animate-bounce">Next Episode <ChevronRight size={14}/></button>)}
      <style jsx>{` @keyframes slide-fast { from { transform: translateX(-100%); } to { transform: translateX(100%); } } .animate-slide-fast { animation: slide-fast 1.5s infinite linear; } .animate-marquee-slow { animation: marquee 10s linear infinite; } @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } `}</style>
    </div>
  );
});
AnimePlayer.displayName = "AnimePlayer";
export default AnimePlayer;