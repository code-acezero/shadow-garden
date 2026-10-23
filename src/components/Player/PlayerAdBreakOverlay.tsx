"use client";

import React from 'react';
import { Play, Heart, Server, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAdBreakOverlayProps {
  isOpen: boolean;
  onResume: () => void;
  title?: string;
  className?: string;
}

export default function PlayerAdBreakOverlay({
  isOpen,
  onResume,
  title,
  className,
}: PlayerAdBreakOverlayProps) {
  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Outer Card - YouTube/Modern Media Inspired */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0f0f12]/95 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(220,38,38,0.12)] flex flex-col items-center text-center gap-4 sm:gap-5 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-red-600/15 blur-2xl rounded-full pointer-events-none" />

        {/* YouTube-style pill badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 text-[10px] font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>Intermission · System Support</span>
        </div>

        {/* Icon & Title */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-1 shadow-inner">
            <Server size={22} />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Keeping Shadow Garden Online
          </h3>
          <p className="text-xs text-zinc-300/85 leading-relaxed font-sans max-w-xs sm:max-w-sm">
            This brief sponsor break helps us afford high-speed streaming servers, bandwidth, and fast CDNs so you can watch anime completely free in 1080p Ultra HD.
          </p>
        </div>

        {/* Donate / Support Box (Redirects to Telegram @code_atrax) */}
        <a
          href="https://t.me/code_atrax"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 hover:from-amber-500/15 hover:via-orange-500/15 hover:to-red-500/15 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Heart size={15} fill="currentColor" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-white group-hover:text-amber-300 transition-colors">
                  Support Our System
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Donate
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                Direct message & support: <span className="text-amber-300 font-mono">@code_atrax</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0 pr-1">
            <Send size={12} />
          </div>
        </a>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {/* Primary Resume Button (YouTube style rounded pill) */}
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.15)] cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>Resume Episode</span>
          </button>

          {/* Subtext info */}
          <span className="text-[10px] text-zinc-500 font-mono">
            Resume opens a sponsor in a background tab · Thank you for your support!
          </span>
        </div>

      </div>
    </div>
  );
}
