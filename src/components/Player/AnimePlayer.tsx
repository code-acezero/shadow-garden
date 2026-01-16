"use client";

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, 
  Settings, Maximize, Minimize, Subtitles, 
  Wand2, AudioWaveform, PictureInPicture, Gauge,
  ChevronRight, ChevronLeft, MousePointer2, 
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- 1. CONFIGURATION CONSTANTS ---
const SUB_COLORS = { 
    White: '#ffffff', 
    Yellow: '#fbbf24', 
    Cyan: '#22d3ee', 
    Red: '#f87171', 
    Green: '#4ade80', 
    Purple: '#c084fc', 
    Black: '#000000' 
};

const SUB_SIZES = { Small: '14px', Normal: '20px', Large: '28px', Huge: '36px' };

const SUB_FONTS = { 
    Sans: '"Inter", sans-serif', 
    Serif: '"Merriweather", serif', 
    Mono: '"JetBrains Mono", monospace', 
    Hand: '"BadUnicorn", sans-serif', 
    Anime: '"Monas", sans-serif' 
};

const SUB_LIFTS = { 
    Bottom: '0px', 
    Middle: '-5vh', 
    High: '-12vh' 
}; 

const SUB_BACKGROUNDS = { None: 'transparent', Outline: 'text-shadow', Box: 'smart', Blur: 'smart-blur' };

interface AnimePlayerProps {
  url: string;
  title?: string;
  poster?: string;
  subtitles?: any[]; 
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean;
  autoPlay?: boolean; 
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
  url, title, poster, intro, outro, autoSkip = false, autoPlay = true, startTime = 0, subtitles = [],
  onEnded, onNext, onProgress, onInteract, onPause, onBuffer, 
  controlsTimeout = 3000, onControlsChange, initialVolume = 1, initialSpeed = 1, onSettingsChange
}, ref) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  
  // Timers
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekOverlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seekAccumulatorRef = useRef(0);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const lastTapTimeRef = useRef(0);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  
  // UI State
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState<string | null>(null);

  // Settings State
  const [speed, setSpeed] = useState(initialSpeed);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [autoResolutionText, setAutoResolutionText] = useState('Auto');
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [currentAudio, setCurrentAudio] = useState(-1);
  const [currentSubtitle, setCurrentSubtitle] = useState(-1); 
  const [trackSubtitles, setTrackSubtitles] = useState<any[]>([]);
  
  // Preferences
  const [subStyle, setSubStyle] = useState({ color: 'White', size: 'Normal', bg: 'Box', font: 'Sans', lift: 'Middle' });
  const [doubleTapMode, setDoubleTapMode] = useState<'seek' | 'playpause' | 'fullscreen'>('seek');
  const [activeMenu, setActiveMenu] = useState<'none' | 'main' | 'quality' | 'speed' | 'audio' | 'subs' | 'subSettings' | 'gestures'>('none');

  const hasResumed = useRef(false);
  const [canSave, setCanSave] = useState(false); 

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

  // --- 2. PREFERENCE LOADING & FILTERING ---
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const savedPrefs = localStorage.getItem('shadow_player_prefs');
          if (savedPrefs) {
              const parsed = JSON.parse(savedPrefs);
              if (parsed.subStyle) setSubStyle(parsed.subStyle);
              if (parsed.doubleTapMode) setDoubleTapMode(parsed.doubleTapMode);
          }
      }

      // STRICT FILTER: Thumbnails
      const validSubs = subtitles?.filter(s => {
          const label = s.label?.toLowerCase() || '';
          const isThumb = label.includes('thumb') || s.kind === 'thumbnails' || label.includes('sprite');
          const hasUrl = !!(s.url || s.file);
          return !isThumb && hasUrl;
      }) || [];
      
      setTrackSubtitles(validSubs);
  }, [subtitles]);

  const updateLocalPrefs = (updates: any) => {
      if (updates.subStyle) setSubStyle(prev => ({...prev, ...updates.subStyle}));
      if (updates.doubleTapMode) setDoubleTapMode(updates.doubleTapMode);
      
      const current = JSON.parse(localStorage.getItem('shadow_player_prefs') || '{}');
      const newState = { ...current, ...updates };
      if (updates.subStyle) newState.subStyle = { ...current.subStyle, ...updates.subStyle };
      
      localStorage.setItem('shadow_player_prefs', JSON.stringify(newState));
  };

  // --- 3. DYNAMIC CSS GENERATOR ---
  useEffect(() => {
    const styleId = 'shadow-player-subs';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
    }
    
    const color = SUB_COLORS[subStyle.color as keyof typeof SUB_COLORS];
    const size = SUB_SIZES[subStyle.size as keyof typeof SUB_SIZES];
    const font = SUB_FONTS[subStyle.font as keyof typeof SUB_FONTS];
    const baseLift = SUB_LIFTS[subStyle.lift as keyof typeof SUB_LIFTS];
    
    const uiOffset = showControls ? '-80px' : '0px';

    const isDarkText = subStyle.color === 'Black';
    const smartBgColor = isDarkText ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    const smartBlurColor = isDarkText ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    const outlineColor = isDarkText ? '#ffffff' : '#000000'; 

    let bgRule = '';
    let shadowRule = 'text-shadow: none !important;';
    let backdropRule = 'backdrop-filter: none !important;';
    let borderRule = 'border-radius: 6px;'; 
    
    if (subStyle.bg === 'Outline') {
        bgRule = 'background-color: transparent !important;';
        shadowRule = `text-shadow: 2px 0 0 ${outlineColor}, -2px 0 0 ${outlineColor}, 0 2px 0 ${outlineColor}, 0 -2px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}, -1px -1px 0 ${outlineColor} !important;`;
    } else if (subStyle.bg === 'Box') {
        bgRule = `background-color: ${smartBgColor} !important;`;
        borderRule = 'border-radius: 8px;';
    } else if (subStyle.bg === 'Blur') {
        bgRule = `background-color: ${smartBlurColor} !important;`;
        backdropRule = 'backdrop-filter: blur(4px) !important;';
        borderRule = 'border-radius: 9999px;'; 
    } else {
        bgRule = 'background-color: transparent !important;';
    }
    
    styleTag.textContent = `
        @font-face { font-family: 'BadUnicorn'; src: url('/fonts/BadUnicornDemoRegular.ttf') format('truetype'); }
        @font-face { font-family: 'Monas'; src: url('/fonts/Monas.ttf') format('truetype'); }

        video::-webkit-media-text-track-display {
             transform: translateY(calc(${baseLift} + ${uiOffset}));
             transition: transform 0.3s ease-in-out;
        }

        video::cue {
            color: ${color} !important;
            font-size: ${size} !important;
            background-color: transparent !important; 
            font-family: ${font} !important;
            ${bgRule}
            ${shadowRule}
            ${backdropRule}
            ${borderRule}
            padding: 4px 8px;
        }
    `;
  }, [subStyle, showControls]);

  // --- 4. PLAYER & HLS SETUP ---
  useEffect(() => {
    if(videoRef.current) {
        videoRef.current.volume = initialVolume;
        videoRef.current.playbackRate = initialSpeed;
    }
    setVolume(initialVolume);
    setSpeed(initialSpeed);
  }, [initialVolume, initialSpeed]);

  useEffect(() => { onControlsChange?.(showControls); }, [showControls, onControlsChange]);

  useEffect(() => {
    if (titleContainerRef.current && titleTextRef.current) {
        setIsTitleOverflowing(titleTextRef.current.scrollWidth > titleContainerRef.current.clientWidth);
    }
  }, [title]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsBuffering(true);
    if (hlsRef.current) hlsRef.current.destroy();

    const finalUrl = url.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

    hasResumed.current = false;
    setCanSave(false);
    const timer = setTimeout(() => { setCanSave(true); }, 10000);

    if (Hls.isSupported()) {
      const hls = new Hls({ 
        capLevelToPlayerSize: true, 
        autoStartLoad: true,
        startLevel: -1, 
        startPosition: startTime > 0 ? startTime : -1 
      });

      hls.loadSource(finalUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({ height: l.height, index: i })).sort((a, b) => b.height - a.height);
        setQualities(levels);
        if (startTime > 0) {
            video.currentTime = startTime;
            hasResumed.current = true;
        }
        setIsBuffering(false);
        if (autoPlay) video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const height = hls.levels[data.level]?.height;
          if (hls.autoLevelEnabled) {
             setCurrentQuality(-1);
             setAutoResolutionText(`Auto (${height}p)`);
          } else {
             setCurrentQuality(data.level);
             setAutoResolutionText('Auto');
          }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => { 
          setAudioTracks(data.audioTracks); 
          setCurrentAudio(data.audioTracks.findIndex(t => t.default)); 
      });
      
      hls.on(Hls.Events.ERROR, () => setIsBuffering(false));
      hlsRef.current = hls;

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = finalUrl;
      video.addEventListener('loadedmetadata', () => { 
          if (startTime > 0) video.currentTime = startTime;
          setIsBuffering(false);
          if (autoPlay) video.play();
      });
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
      clearTimeout(timer);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  // --- 5. CC SYNC CHECK ---
  useEffect(() => {
     if (trackSubtitles.length > 0 && videoRef.current) {
         
         const tracks = videoRef.current.textTracks;
         if (tracks) {
             for (let i = 0; i < tracks.length; i++) {
                 tracks[i].mode = 'disabled';
             }
         }

         const engIndex = trackSubtitles.findIndex(t => 
             t.label?.toLowerCase().includes('eng') || t.lang?.toLowerCase().includes('eng')
         );
         
         const targetIndex = engIndex !== -1 ? engIndex : -1;
         
         if (targetIndex !== -1) {
             setCurrentSubtitle(targetIndex);
             setTimeout(() => {
                 if (videoRef.current?.textTracks[targetIndex]) {
                     videoRef.current.textTracks[targetIndex].mode = 'showing';
                 }
             }, 50);
         } else {
             setCurrentSubtitle(-1);
         }
     } else {
         setCurrentSubtitle(-1);
     }
  }, [trackSubtitles]); 

  // --- HANDLERS ---
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
    if (onProgress && canSave) {
        onProgress({ playedSeconds: video.currentTime, loadedSeconds: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0 });
    }
    if (intro && video.currentTime >= intro.start && video.currentTime <= intro.end) {
      if (autoSkip) {
          video.currentTime = intro.end;
          toast.success("Skipped Intro");
      } else {
          setShowSkipIntro(true);
      }
    } else setShowSkipIntro(false);
  };

  const changeQuality = (index: number) => { 
      if (hlsRef.current) {
          hlsRef.current.currentLevel = index; 
          if (index === -1) setAutoResolutionText("Auto");
      }
      setCurrentQuality(index); setActiveMenu('none'); if(canSave) onInteract?.(); onSettingsChange?.('quality', index); 
  };
  const changeSpeed = (rate: number) => { 
      if (videoRef.current) videoRef.current.playbackRate = rate; 
      setSpeed(rate); setActiveMenu('none'); if(canSave) onInteract?.(); onSettingsChange?.('speed', rate); 
  };
  const changeAudio = (index: number) => { 
      if (hlsRef.current) hlsRef.current.audioTrack = index; 
      setCurrentAudio(index); setActiveMenu('none'); if(canSave) onInteract?.(); 
  };
  
  const changeSubtitle = (index: number) => { 
      if (videoRef.current) {
          const tracks = videoRef.current.textTracks;
          for (let i = 0; i < tracks.length; i++) {
             tracks[i].mode = 'hidden';
          }
          if (index !== -1 && tracks[index]) {
             tracks[index].mode = 'showing';
          }
      }
      setCurrentSubtitle(index);
      setActiveMenu('none');
      if(canSave) onInteract?.(); 
  };

  const handleSeekStart = () => setIsScrubbing(true);
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentTime(parseFloat(e.target.value));
  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement>) => {
    const time = parseFloat(e.currentTarget.value);
    if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    }
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

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffY = touchStartRef.current.y - endY;
      const diffX = touchStartRef.current.x - endX;

      if (Math.abs(diffY) > 50 && Math.abs(diffX) < 30) {
          if (diffY > 0) toggleFullscreen(); 
          else if (document.fullscreenElement) document.exitFullscreen(); 
      }
      touchStartRef.current = null;
  };

  const handleGesture = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    if (activeMenu !== 'none') { setActiveMenu('none'); return; }

    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;
    
    if (doubleTapMode === 'seek' && timeDiff < 300) {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const delta = x > rect.width * 0.5 ? 10 : -10;
        
        seekAccumulatorRef.current += delta;
        setSeekOverlay(`${seekAccumulatorRef.current > 0 ? '+' : ''}${seekAccumulatorRef.current}s`);
        seek(delta);

        if (seekOverlayTimerRef.current) clearTimeout(seekOverlayTimerRef.current);
        seekOverlayTimerRef.current = setTimeout(() => {
            setSeekOverlay(null);
            seekAccumulatorRef.current = 0;
        }, 800);
        
        lastTapTimeRef.current = now;
        return;
    } 
    
    if (timeDiff < 300) {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        if (doubleTapMode === 'playpause') togglePlay();
        if (doubleTapMode === 'fullscreen') toggleFullscreen();
        lastTapTimeRef.current = now;
        return;
    }

    lastTapTimeRef.current = now;
    clickTimerRef.current = setTimeout(() => { 
        setShowControls(prev => !prev);
        clickTimerRef.current = null; 
    }, 250);
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full cursor-none object-contain"
        onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
        onPause={() => { setIsPlaying(false); onPause?.(); if(canSave) onInteract?.(); }}
        onWaiting={() => { if(!seekOverlay) setIsBuffering(true); }}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { if(canSave) onInteract?.(); onEnded?.(); }}
        crossOrigin="anonymous"
        playsInline
      >
        {trackSubtitles.map((sub, i) => (
            <track 
                key={i} 
                kind="captions" 
                src={sub.url || sub.file} 
                label={sub.label} 
                srcLang={sub.lang} 
                default={false} 
            />
        ))}
      </video>
      
      {seekOverlay && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200">
              <div className="bg-black/50 backdrop-blur-md px-8 py-4 rounded-full text-white font-black text-3xl tracking-widest border border-white/10 shadow-2xl">
                  {seekOverlay}
              </div>
          </div>
      )}

      {isBuffering && !seekOverlay && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"><div className="relative w-40 h-40 flex items-center justify-center"><img src="/run-happy.gif" alt="Loading..." className="w-32 h-32 object-contain relative z-10" /><div className="absolute bottom-4 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent animate-slide-fast" /></div><p className="mt-4 font-[Cinzel] text-red-500 animate-pulse tracking-[0.4em] text-[10px] font-bold uppercase">Loading Reality...</p></div>)}
      <div className={cn("absolute top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 max-w-[90%] w-auto", showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10")}>
        <div ref={titleContainerRef} className="bg-black/60 md:bg-black/80 border border-white/10 rounded-full px-4 py-1.5 md:px-6 md:py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 overflow-hidden">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red] shrink-0" />
            <div className="overflow-hidden w-full relative h-4 flex items-center">
                <span ref={titleTextRef} className={cn("text-[9px] md:text-[10px] font-black text-gray-200 uppercase tracking-widest whitespace-nowrap", isTitleOverflowing && "animate-marquee-slow")}>{title || "Shadow Garden Player"}</span>
            </div>
        </div>
      </div>
      
      {/* [FIX] Big Play Button - Now Clickable */}
      {!isBuffering && !seekOverlay && (
        <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300", !isPlaying || showControls ? "opacity-100 scale-100" : "opacity-0 scale-150")}>
            <div 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                className="w-12 h-12 md:w-16 md:h-16 bg-red-600/20 border border-red-500/50 rounded-full flex items-center justify-center backdrop-blur-sm text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 transition-all"
            >
                {isPlaying ? <Pause fill="white" size={24}/> : <Play fill="white" size={24} className="ml-1" />}
            </div>
        </div>
      )}

      <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end px-3 pb-3 md:px-6 md:pb-6 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className="group/seek relative w-full h-4 flex items-center cursor-pointer mb-1 md:mb-2" onMouseMove={handleSeekHover} onMouseLeave={() => setHoverTime(null)}>
           {hoverTime !== null && (<div className="absolute bottom-6 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded-md text-[10px] font-mono text-white shadow-lg pointer-events-none" style={{ left: `${hoverPos}%` }}>{formatTime(hoverTime)}</div>)}
           <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${(currentTime / duration) * 100}%` }} /></div>
           <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 border-2 border-white rounded-full shadow-[0_0_10px_white] scale-0 group-hover/seek:scale-100 transition-transform pointer-events-none" style={{ left: `calc(${Math.min(Math.max((currentTime / duration) * 100, 0), 100)}% - 7px)` }} />
           <input type="range" min={0} max={duration || 100} step="0.1" value={currentTime} onMouseDown={handleSeekStart} onChange={handleSeekChange} onMouseUp={handleSeekEnd} className="absolute inset-0 w-full opacity-0 cursor-pointer" onClick={(e) => e.stopPropagation()} />
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3 md:gap-6">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-red-500 transition-colors active:scale-90">{isPlaying ? <Pause size={20} className="md:w-6 md:h-6" /> : <Play size={20} className="md:w-6 md:h-6" />}</button>
              
              <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="flex items-center gap-0.5 group/btn px-2 py-1 rounded-full border border-white/20 hover:border-red-500 hover:bg-red-500/10 transition-all active:scale-95">
                      <ChevronsLeft size={14} className="text-white group-hover/btn:text-red-500 transition-colors"/>
                      <span className="text-[10px] font-black text-white group-hover/btn:text-red-500 transition-colors">10</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="flex items-center gap-0.5 group/btn px-2 py-1 rounded-full border border-white/20 hover:border-red-500 hover:bg-red-500/10 transition-all active:scale-95">
                      <span className="text-[10px] font-black text-white group-hover/btn:text-red-500 transition-colors">10</span>
                      <ChevronsRight size={14} className="text-white group-hover/btn:text-red-500 transition-colors"/>
                  </button>
              </div>

              <div className="hidden md:flex items-center gap-2 group/vol"><button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>{isMuted || volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button><div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 flex items-center"><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); if(videoRef.current) videoRef.current.volume = parseFloat(e.target.value); setIsMuted(parseFloat(e.target.value) === 0); onSettingsChange?.('volume', parseFloat(e.target.value)); }} className="w-full h-1 accent-red-600 cursor-pointer bg-white/20 rounded-full" onClick={(e) => e.stopPropagation()} /></div></div>
              <div className="text-[9px] md:text-[10px] font-bold text-zinc-400 font-mono"><span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}</div>
           </div>

           <div className="flex items-center gap-2 md:gap-5 relative">
              <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'main' ? 'none' : 'main'); }} className={cn("hover:text-red-500 transition-colors active:scale-90 group", activeMenu !== 'none' && activeMenu !== 'audio' && activeMenu !== 'subs' && "text-red-500")}><Settings size={18} className="md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-500" /></button>
                  {/* [FIX] Menus restricted to 35vh on mobile */}
                  {activeMenu === 'main' && (
                     <div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-48 md:w-56 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                        <button onClick={(e)=>{e.stopPropagation(); setActiveMenu('quality')}} className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-[10px] font-bold transition-all"><div className="flex items-center gap-2"><Settings size={12}/> Quality</div><span className="text-zinc-400">{autoResolutionText}</span></button>
                        <button onClick={(e)=>{e.stopPropagation(); setActiveMenu('speed')}} className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-[10px] font-bold transition-all"><div className="flex items-center gap-2"><Gauge size={12}/> Speed</div><span className="text-zinc-400">{speed}x</span></button>
                        <button onClick={(e)=>{e.stopPropagation(); setActiveMenu('gestures')}} className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-[10px] font-bold transition-all"><div className="flex items-center gap-2"><MousePointer2 size={12}/> Gestures</div><span className="text-zinc-400 uppercase">{doubleTapMode}</span></button>
                     </div>
                  )}
                  {activeMenu === 'quality' && (
                      <div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-36 md:w-40 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                          <button onClick={(e)=>{e.stopPropagation(); setActiveMenu('main')}} className="flex items-center gap-2 text-[10px] px-3 py-2 font-black text-zinc-400 border-b border-white/10 mb-1"><ChevronLeft size={12}/> BACK</button>
                          <button onClick={(e)=>{e.stopPropagation(); changeQuality(-1)}} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", currentQuality===-1?"bg-red-600 text-white":"hover:bg-white/10")}>Auto</button>
                          {qualities.map(q=>(<button key={q.index} onClick={(e)=>{e.stopPropagation(); changeQuality(q.index)}} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", currentQuality===q.index?"bg-red-600 text-white":"hover:bg-white/10")}>{q.height}p</button>))}
                      </div>
                  )}
                  {activeMenu === 'speed' && (
                      <div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-32 md:w-36 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                          <button onClick={(e)=>{e.stopPropagation(); setActiveMenu('main')}} className="flex items-center gap-2 text-[10px] px-3 py-2 font-black text-zinc-400 border-b border-white/10 mb-1"><ChevronLeft size={12}/> BACK</button>
                          {[0.5, 1, 1.25, 1.5, 2].map(r=>(<button key={r} onClick={(e)=>{e.stopPropagation(); changeSpeed(r)}} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all", speed===r?"bg-red-600 text-white":"hover:bg-white/10")}>{r}x</button>))}
                      </div>
                  )}
                  {activeMenu === 'gestures' && (
                      <div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-40 md:w-48 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                          <button onClick={(e)=>{e.stopPropagation(); setActiveMenu('main')}} className="flex items-center gap-2 text-[10px] px-3 py-2 font-black text-zinc-400 border-b border-white/10 mb-1"><ChevronLeft size={12}/> BACK</button>
                          {['seek', 'playpause', 'fullscreen'].map(m=>(<button key={m} onClick={(e)=>{e.stopPropagation(); updateLocalPrefs({doubleTapMode: m}); setActiveMenu('none')}} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold uppercase transition-all", doubleTapMode===m?"bg-red-600 text-white":"hover:bg-white/10")}>{m}</button>))}
                      </div>
                  )}
              </div>

              {audioTracks.length > 1 && (<div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio'); }} className={cn("hover:text-red-500 transition-colors active:scale-90", activeMenu === 'audio' && "text-red-500")}><AudioWaveform size={18} className="md:w-5 md:h-5" /></button>{activeMenu === 'audio' && (<div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-40 md:w-48 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">{audioTracks.map((t, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); changeAudio(i); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all truncate active:scale-95", currentAudio === i ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>{t.name || `Audio ${i+1}`}</button>))}</div>)}</div>)}

              {/* CC Logic (Hidden if empty) */}
              {trackSubtitles.length > 0 && (
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'subs' ? 'none' : 'subs'); }} className={cn("hover:text-red-500 transition-colors active:scale-90", (activeMenu === 'subs' || currentSubtitle !== -1) ? "text-red-500 fill-red-500" : "text-white")}><Subtitles size={18} className="md:w-5 md:h-5" /></button>
                    {activeMenu === 'subs' && (
                        <div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-48 md:w-56 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                             <button onClick={(e) => { e.stopPropagation(); setActiveMenu('subSettings'); }} className="flex items-center gap-2 text-[10px] px-3 py-2 rounded-full text-left font-black text-red-500 hover:bg-white/5 transition-all mb-1 border-b border-white/10"><Settings size={12}/> CAPTION SETTINGS</button>
                             <button onClick={(e) => { e.stopPropagation(); changeSubtitle(-1); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all active:scale-95", currentSubtitle === -1 ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>Off</button>
                             {trackSubtitles.map((t, i) => (
                                 <button key={i} onClick={(e) => { e.stopPropagation(); changeSubtitle(i); }} className={cn("text-[10px] px-3 py-1.5 rounded-full text-left font-bold transition-all truncate active:scale-95", currentSubtitle === i ? "bg-red-600 text-white" : "hover:bg-white/10 text-zinc-400")}>{t.label || t.name || t.lang}</button>
                             ))}
                        </div>
                    )}
                    {activeMenu === 'subSettings' && (
                        <div className="absolute bottom-12 right-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 w-56 md:w-64 max-h-[35vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide shadow-2xl z-50 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
                             <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 border-b border-white/10 pb-2"><button onClick={(e)=>{e.stopPropagation(); setActiveMenu('subs')}} className="hover:text-white"><ChevronLeft size={12}/></button> STYLE</div>
                             <div className="space-y-2"><span className="text-[9px] font-bold text-zinc-500 uppercase">Color</span><div className="flex gap-2 flex-wrap">{Object.keys(SUB_COLORS).map((c) => (<button key={c} onClick={(e) => {e.stopPropagation(); updateLocalPrefs({subStyle: { color: c }})}} className={cn("w-6 h-6 rounded-full border transition-all active:scale-90", subStyle.color === c ? "border-white scale-110" : "border-transparent opacity-50")} style={{background: SUB_COLORS[c as keyof typeof SUB_COLORS]}} />))}</div></div>
                             <div className="space-y-2"><span className="text-[9px] font-bold text-zinc-500 uppercase">Size</span><div className="flex gap-1 bg-white/5 rounded-full p-1">{Object.keys(SUB_SIZES).map((s) => (<button key={s} onClick={(e) => {e.stopPropagation(); updateLocalPrefs({subStyle: { size: s }})}} className={cn("flex-1 py-1 rounded-full text-[8px] font-bold transition-all active:scale-90", subStyle.size === s ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>{s}</button>))}</div></div>
                             <div className="space-y-2"><span className="text-[9px] font-bold text-zinc-500 uppercase">Background</span><div className="flex gap-1 bg-white/5 rounded-full p-1">{Object.keys(SUB_BACKGROUNDS).map((b) => (<button key={b} onClick={(e) => {e.stopPropagation(); updateLocalPrefs({subStyle: { bg: b }})}} className={cn("flex-1 py-1 rounded-full text-[8px] font-bold transition-all active:scale-90", subStyle.bg === b ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>{b}</button>))}</div></div>
                             <div className="space-y-2"><span className="text-[9px] font-bold text-zinc-500 uppercase">Position</span><div className="flex gap-1 bg-white/5 rounded-full p-1">{Object.keys(SUB_LIFTS).map((l) => (<button key={l} onClick={(e) => {e.stopPropagation(); updateLocalPrefs({subStyle: { lift: l }})}} className={cn("flex-1 py-1 rounded-full text-[8px] font-bold transition-all active:scale-90", subStyle.lift === l ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>{l}</button>))}</div></div>
                             <div className="space-y-2"><span className="text-[9px] font-bold text-zinc-500 uppercase">Font</span><div className="flex gap-1 bg-white/5 rounded-full p-1 overflow-x-auto scrollbar-hide">{Object.keys(SUB_FONTS).map((f) => (<button key={f} onClick={(e) => {e.stopPropagation(); updateLocalPrefs({subStyle: { font: f }})}} className={cn("px-3 py-1.5 rounded-full text-[8px] font-bold transition-all active:scale-90 whitespace-nowrap", subStyle.font === f ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>{f}</button>))}</div></div>
                        </div>
                    )}
                </div>
              )}

              <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="hover:text-red-500 transition-colors active:scale-90"><PictureInPicture size={20}/></button>
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:text-red-500 transition-colors active:scale-90"><Maximize size={18} className="md:w-5 md:h-5"/></button>
           </div>
        </div>
      </div>
      {showSkipIntro && (<button onClick={(e) => { e.stopPropagation(); if (videoRef.current && intro) { videoRef.current.currentTime = intro.end; setCurrentTime(intro.end); if(canSave) onInteract?.(); } }} className="absolute bottom-20 left-6 bg-black/80 hover:bg-white text-white hover:text-black border border-white/20 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-left duration-500 z-50 active:scale-95"><Wand2 size={12} /> Skip Intro</button>)}
      {!isPlaying && duration > 0 && Math.abs(currentTime - duration) < 1 && onNext && (<button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute bottom-24 right-6 bg-white text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_white] z-50 animate-bounce active:scale-95">Next Episode <ChevronRight size={14}/></button>)}
      <style jsx>{` @keyframes slide-fast { from { transform: translateX(-100%); } to { transform: translateX(100%); } } .animate-slide-fast { animation: slide-fast 1.5s infinite linear; } .animate-marquee-slow { animation: marquee 10s linear infinite; } @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } `}</style>
    </div>
  );
});
AnimePlayer.displayName = "AnimePlayer";
export default AnimePlayer;