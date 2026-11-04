'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ExternalLink 
} from 'lucide-react';

export default function PortalExperimentClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  }, []);

  // Reload the 3D scene
  const reloadScene = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = '/experiments/floating-island.html';
    }
  }, []);

  // Focus iframe on load so keyboard controls (WASD) work immediately
  const handleIframeLoad = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.focus();
    } catch {
      // Ignore cross-origin error if any
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#03040c] select-none text-zinc-100"
      onClick={() => {
        // Keep focus inside iframe for WASD controls
        try {
          iframeRef.current?.contentWindow?.focus();
        } catch {
          // ignore
        }
      }}
    >
      {/* 3D Scene Iframe */}
      <iframe
        ref={iframeRef}
        src="/experiments/floating-island.html"
        title="Floating Island – Shrine Gate to Mana Portal"
        className="absolute inset-0 w-full h-full border-0 z-0"
        allow="pointer-lock; fullscreen; autoplay; xr-spatial-tracking"
        onLoad={handleIframeLoad}
      />

      {/* Top Floating Control Toolbar (Positioned Top-Right to prevent overlap with #t at top-left) */}
      <header className="absolute top-3 right-3 sm:top-4 sm:right-6 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a0c1c]/80 border border-indigo-400/30 backdrop-blur-md shadow-lg shadow-black/50">
          {/* Back to Shadow Garden */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Return to Shadow Garden Home"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to Hub</span>
          </Link>

          <div className="w-px h-4 bg-white/15" />

          {/* Reset / Reload Scene */}
          <button
            type="button"
            onClick={reloadScene}
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Reload 3D Realm"
          >
            <RotateCcw size={14} />
          </button>

          {/* Toggle Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Open Standalone in New Tab */}
          <a
            href="/experiments/floating-island.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Open in Full Window"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </header>
    </div>
  );
}
