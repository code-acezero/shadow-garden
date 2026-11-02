"use client";

import React from 'react';
import { Play, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAdBreakOverlayProps {
  isOpen: boolean;
  onResume: () => void;
  onSkip?: () => void;
  title?: string;
  className?: string;
}

export default function PlayerAdBreakOverlay({
  isOpen,
  onResume,
  onSkip,
  title,
  className,
}: PlayerAdBreakOverlayProps) {
  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300 select-none",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Simplified, Faded Stroke-Free Container */}
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-[#0c0a1a]/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col items-center text-center gap-4 overflow-hidden animate-in zoom-in-95 duration-200 border-0 ring-0">
        
        {/* Soft, Stroke-Free Faded Badge */}
        <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 text-[10px] font-bold tracking-widest uppercase border-0 ring-0">
          <span>Intermission</span>
        </div>

        {/* Title & Concise Copy */}
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Keeping Kagemi Online
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px]">
            A brief sponsor break that keeps streaming fast, servers stable, and free in HD.
          </p>
        </div>

        {/* Stroke-Free Faded Support Link */}
        <a
          href="https://t.me/code_atrax"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all text-[11px] group border-0 ring-0"
        >
          <Heart size={12} className="text-rose-400/80 group-hover:scale-110 transition-transform" fill="currentColor" />
          <span>Support via <span className="text-zinc-300 font-mono">@code_atrax</span></span>
        </a>

        {/* Actions Area */}
        <div className="w-full flex flex-col items-center gap-2 pt-1">
          {/* Primary Resume Button */}
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-none border-0 ring-0 cursor-pointer"
          >
            <Play size={13} fill="currentColor" />
            <span>Resume Episode</span>
          </button>

          {/* Clean, minimalist Skip button */}
          <button
            type="button"
            onClick={onSkip || onResume}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer pt-0.5 select-none border-0 ring-0 bg-transparent"
          >
            Skip ad break
          </button>
        </div>

      </div>
    </div>
  );
}
