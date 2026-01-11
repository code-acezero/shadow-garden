"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, 
  Settings, Maximize, SkipForward, Subtitles, 
  Wand2, ChevronUp, X, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimePlayerProps {
  url: string;
  title?: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean;
  onEnded?: () => void;
  onNext?: () => void;
}

export default function AnimePlayer({ 
  url, title, intro, outro, autoSkip = false, onEnded, onNext 
}: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref used to manage the delay for play/pause to allow for double-clicks
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- UI & MEDIA STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  
  // Menu states
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [subtitles, setSubtitles] = useState<TextTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<number>(-1);
  const [activeMenu, setActiveMenu] = useState<'none' | 'quality' | 'subs'>('none');

  // --- INITIALIZATION ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    if (hlsRef.current) hlsRef.current.destroy();

    // Use Proxy to bypass CORS/Referer checks
    const finalUrl = url.startsWith('http') 
      ? `/api/proxy?url=${encodeURIComponent(url)}` 
      : url;

    if (Hls.isSupported()) {
      const hls = new Hls({ 
        capLevelToPlayerSize: true, 
        autoStartLoad: true,
        startLevel: -1 
      });

      hls.loadSource(finalUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const availableLevels = data.levels.map((l, i) => ({ 
          height: l.height, 
          index: i 
        })).sort((a, b) => b.height - a.height);
        
        setQualities(availableLevels);
        setIsLoading(false);
        // Autoplay attempt
        video.play().catch(() => console.log("User interaction required for play."));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari/iOS
      video.src = finalUrl;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === 'ArrowRight') seek(10);
      if (e.code === 'ArrowLeft') seek(-10);
      if (e.code === 'KeyF') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  // --- ACTIONS ---
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const seek = (amount: number) => {
    if (videoRef.current) videoRef.current.currentTime += amount;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // --- GESTURE LOGIC (FIXED) ---
  const handleGesture = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Close any active settings menu first
    if (activeMenu !== 'none') {
      setActiveMenu('none');
      return;
    }

    // Double Click Logic
    if (e.detail === 2) {
      // Clear the single click play/pause trigger
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const width = rect.width;

      if (x < width * 0.3) {
        seek(-10); // Left 30%
      } else if (x > width * 0.7) {
        seek(10);  // Right 30%
      } else {
        toggleFullscreen(); // Middle 40%
      }
      return;
    }

    // Single Click Logic
    if (e.detail === 1) {
      clickTimerRef.current = setTimeout(() => {
        togglePlay();
        clickTimerRef.current = null;
      }, 250); // Delay to verify if it's a double click
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Magical Skip Logic
    if (intro && video.currentTime >= intro.start && video.currentTime <= intro.end) {
      if (autoSkip) {
        video.currentTime = intro.end;
      } else {
        setShowSkipIntro(true);
      }
    } else {
      setShowSkipIntro(false);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && activeMenu === 'none') setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div 
      ref={containerRef}
      className="group relative w-full aspect-video bg-black overflow-hidden font-sans select-none rounded-xl shadow-2xl ring-1 ring-white/10"
      onClick={handleGesture}
      onMouseMove={showControlsTemporarily}
    >
      {/* VIDEO ELEMENT */}
      <video
        ref={videoRef}
        className="w-full h-full cursor-none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedMetadata={() => {
          setDuration(videoRef.current?.duration || 0);
          setSubtitles(Array.from(videoRef.current?.textTracks || []));
        }}
        onEnded={onEnded}
        crossOrigin="anonymous"
        playsInline
      />
{/* --- MAGIC LOADING SCREEN (Chibi Witch) --- */}
{isLoading && (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className="absolute inset-0 border-4 border-dashed border-red-500/40 rounded-full animate-[spin_8s_linear_infinite]" />
      <div className="absolute inset-2 border-2 border-double border-red-600/60 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
      {/* GIF slightly bigger */}
      <img
        src="/run-happy.gif"
        alt="Running Witch"
        className="w-20 h-20 relative z-10 object-contain animate-bounce"
      />
    </div>
    <p className="mt-6 font-[Cinzel] text-red-500 animate-pulse tracking-[0.3em] text-[10px] font-bold uppercase">
      Summoning Content...
    </p>
  </div>
)}


      {/* --- DYNAMIC ISLAND HEADER --- */}
      <div className={cn(
        "absolute top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 transform-gpu",
        showControls ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 -translate-y-8"
      )}>
        <div className="bg-black/90 border border-red-500/20 rounded-full px-6 py-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] backdrop-blur-md flex items-center gap-3">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]" />
          <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest whitespace-nowrap overflow-hidden max-w-[350px]">
            {title || "Now Playing"}
          </span>
        </div>
      </div>

      {/* --- BIG MIDDLE PLAY/PAUSE POP --- */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300",
        !isPlaying || showControls ? "opacity-100 scale-100" : "opacity-0 scale-150"
      )}>
        <div className="w-20 h-20 bg-red-600/10 border border-red-600/40 rounded-full flex items-center justify-center backdrop-blur-sm text-white shadow-[0_0_40px_rgba(220,38,38,0.2)]">
          {isPlaying ? <Pause fill="currentColor" size={32}/> : <Play fill="currentColor" size={32} className="ml-2" />}
        </div>
      </div>

      {/* --- PLAYER CONTROLS OVERLAY --- */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 flex flex-col justify-end p-6 transition-opacity duration-500",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        
        {/* SEEK BAR */}
        <div className="group/seek relative w-full h-1.5 mb-6 flex items-center">
          <div className="absolute w-full h-full bg-white/10 rounded-full" />
          <div 
            className="absolute h-full bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] scale-0 group-hover/seek:scale-100 transition-transform" />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = val;
            }}
            className="absolute w-full h-4 opacity-0 cursor-pointer z-10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-red-500 transition-colors">
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>

            <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="relative text-white hover:text-red-500 transition-colors group/seekbtn">
                <RotateCcw size={22} />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-1">10</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="relative text-white hover:text-red-500 transition-colors group/seekbtn">
                <RotateCw size={22} />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-1">10</span>
              </button>
            </div>

            <div className="flex items-center gap-3 group/vol">
              <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>
                {isMuted || volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
              </button>
              <div className="w-0 group-hover/vol:w-24 transition-all overflow-hidden">
                <input 
                  type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                    setIsMuted(v === 0);
                  }}
                  className="w-24 accent-red-600 h-1 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="text-[10px] font-mono text-gray-400 tracking-wider">
              {formatTime(currentTime)} <span className="mx-1 text-zinc-600">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* SUBTITLES MENU */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'subs' ? 'none' : 'subs'); }}
                className={cn("hover:text-red-500 transition-colors", activeMenu === 'subs' && "text-red-500")}
              >
                <Subtitles size={20} />
              </button>
              {activeMenu === 'subs' && (
                <div className="absolute bottom-12 right-0 bg-black/90 border border-white/10 rounded-xl p-2 min-w-[150px] shadow-2xl backdrop-blur-md z-50">
                   <p className="text-[8px] font-bold text-zinc-500 uppercase px-3 py-2 border-b border-white/5 mb-1">Subtitles</p>
                   <button 
                      onClick={() => { Array.from(videoRef.current?.textTracks || []).forEach(t => t.mode = 'hidden'); setActiveSubtitle(-1); setActiveMenu('none'); }}
                      className={cn("w-full text-left px-3 py-2 text-[10px] font-bold rounded-md transition-colors", activeSubtitle === -1 ? "text-red-500 bg-red-500/10" : "hover:bg-white/5")}
                   >Off</button>
                   {subtitles.map((track, i) => (
                    <button key={i} onClick={() => { Array.from(videoRef.current?.textTracks || []).forEach((t, idx) => t.mode = idx === i ? 'showing' : 'hidden'); setActiveSubtitle(i); setActiveMenu('none'); }} className={cn("w-full text-left px-3 py-2 text-[10px] font-bold rounded-md transition-colors", activeSubtitle === i ? "text-red-500 bg-red-500/10" : "hover:bg-white/5")}>
                      {track.label || `Track ${i + 1}`}
                    </button>
                   ))}
                </div>
              )}
            </div>

            {/* QUALITY MENU */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'quality' ? 'none' : 'quality'); }}
                className={cn("hover:text-red-500 transition-colors", activeMenu === 'quality' && "text-red-500")}
              >
                <Settings size={20} />
              </button>
              {activeMenu === 'quality' && (
                <div className="absolute bottom-12 right-0 bg-black/90 border border-white/10 rounded-xl p-2 min-w-[120px] shadow-2xl backdrop-blur-md z-50">
                   <p className="text-[8px] font-bold text-zinc-500 uppercase px-3 py-2 border-b border-white/5 mb-1">Quality</p>
                   <button onClick={() => { if(hlsRef.current) hlsRef.current.currentLevel = -1; setActiveMenu('none'); }} className={cn("w-full text-left px-3 py-2 text-[10px] font-bold rounded-md", currentQuality === -1 ? "text-red-500 bg-red-500/10" : "hover:bg-white/5")}>Auto</button>
                   {qualities.map((q) => (
                    <button key={q.index} onClick={() => { if(hlsRef.current) hlsRef.current.currentLevel = q.index; setActiveMenu('none'); }} className={cn("w-full text-left px-3 py-2 text-[10px] font-bold rounded-md transition-colors", currentQuality === q.index ? "text-red-500 bg-red-500/10" : "hover:bg-white/5")}>
                      {q.height}p
                    </button>
                   ))}
                </div>
              )}
            </div>

            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:text-red-500 transition-colors">
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* SKIP INTRO POP */}
      {showSkipIntro && (
        <button 
          onClick={(e) => { e.stopPropagation(); if (videoRef.current && intro) videoRef.current.currentTime = intro.end; }}
          className="absolute bottom-24 left-8 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-black text-xs flex items-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-in slide-in-from-left duration-500"
        >
          <Wand2 size={16} /> SKIP INTRO
        </button>
      )}

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 0px; width: 0px; }
      `}</style>
    </div>
  );
}