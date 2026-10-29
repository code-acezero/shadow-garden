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
        "absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Sleek, Minimal Modal */}
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-[#0c0d12]/95 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col items-center text-center gap-3.5 sm:gap-4 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Subtle top ambient sheen */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Clean static pill badge */}
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-400 text-[10px] font-semibold tracking-wider uppercase">
          <span>Intermission</span>
        </div>

        {/* Title & Concise Copy */}
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Keeping Kagemi Online
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px]">
            A brief sponsor break that keeps streaming fast, servers stable, and free in HD.
          </p>
        </div>

        {/* Minimal Support Link */}
        <a
          href="https://t.me/code_atrax"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white transition-all text-[11px] group"
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
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Play size={13} fill="currentColor" />
            <span>Resume Episode</span>
          </button>

          {/* Tiny, slightly noticeable Skip button to bypass ad and continue playback */}
          <button
            type="button"
            onClick={onSkip || onResume}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer pt-0.5 underline-offset-4 hover:underline select-none"
          >
            Skip ad break
          </button>
        </div>

      </div>
    </div>
  );
}
