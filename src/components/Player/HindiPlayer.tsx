"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { 
  Maximize, Minimize, Loader2, Cast, 
  RotateCcw, ShieldAlert, ExternalLink // Fixed: Changed from externalLink to ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HindiPlayerProps {
  url: string; // This is the iframe/embed URL from desidub/hpi
  title?: string;
  onInteract?: () => void;
  onControlsChange?: (visible: boolean) => void;
}

export interface HindiPlayerRef {
  focus: () => void;
  reload: () => void;
}

const HindiPlayer = forwardRef<HindiPlayerRef, HindiPlayerProps>(({ 
  url, title, onInteract, onControlsChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => containerRef.current?.focus(),
    reload: () => {
        setIsBuffering(true);
        setError(false);
        // Force re-render of iframe if needed
    }
  }));

  // --- AUTO-HIDE UI ---
  const showUI = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    onControlsChange?.(showControls);
  }, [showControls, onControlsChange]);

  // --- FULLSCREEN LOGIC ---
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
        if(containerRef.current) await containerRef.current.requestFullscreen();
    } else {
        await document.exitFullscreen();
    }
  };

  // --- IFRAME EVENTS ---
  const handleLoad = () => {
    setIsBuffering(false);
    onInteract?.();
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0} 
      className={cn(
        "group relative w-full aspect-video bg-black overflow-hidden font-sans select-none rounded-2xl shadow-2xl ring-1 ring-white/10 outline-none",
        showControls ? "cursor-auto" : "cursor-none"
      )}
      onMouseMove={showUI}
      onMouseEnter={showUI}
    >
      {/* THE EMBED PLAYER */}
      <iframe
        src={url}
        className="w-full h-full border-0 z-10"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        onLoad={handleLoad}
        onError={() => setError(true)}
      />

      {/* SHADOW GARDEN LOADING SCREEN */}
      {isBuffering && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]">
              <div className="relative w-40 h-40 flex items-center justify-center">
                  <img src="/run-happy.gif" alt="Loading..." className="w-32 h-32 object-contain relative z-10" />
                  <div className="absolute bottom-4 w-full h-1 bg-gradient-to-r from-transparent via-primary-600/50 to-transparent animate-slide-fast" />
              </div>
              <p className="mt-4 font-[Cinzel] text-primary-500 animate-pulse tracking-[0.4em] text-[10px] font-bold uppercase">Decrypting Embed...</p>
          </div>
      )}

      {/* ERROR STATE */}
      {error && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
              <ShieldAlert className="w-12 h-12 text-primary-600 mb-4" />
              <p className="text-white font-black text-sm uppercase tracking-widest">Link Severed</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-primary-600 rounded-full text-white text-[10px] font-black uppercase tracking-tighter"
              >
                Retry Connection
              </button>
          </div>
      )}
      
      {/* TITLE ISLAND */}
      <div className={cn(
        "absolute top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 max-w-[90%] pointer-events-none", 
        showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
      )}>
          <div className="bg-black/80 border border-white/10 rounded-full px-6 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 overflow-hidden">
              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse shadow-[0_0_8px_red] shrink-0" />
              <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest whitespace-nowrap">
                {title || "Hindi Mirror Player"}
              </span>
          </div>
      </div>

      {/* MINIMAL OVERLAY CONTROLS */}
      <div className={cn(
        "absolute bottom-4 right-4 z-40 flex items-center gap-3 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-primary-500 transition-all hover:scale-110 active:scale-95 pointer-events-auto"
          >
            <Maximize size={18} />
          </button>
      </div>

      <style jsx>{` 
        @keyframes slide-fast { from { transform: translateX(-100%); } to { transform: translateX(100%); } } 
        .animate-slide-fast { animation: slide-fast 1.5s infinite linear; } 
      `}</style>
    </div>
  );
});

HindiPlayer.displayName = "HindiPlayer";
export default HindiPlayer;