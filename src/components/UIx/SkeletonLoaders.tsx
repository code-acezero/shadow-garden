import React from 'react';
import { cn } from '@/lib/utils';
import { AscendingOmniPlayerLoader } from '@/components/Player/AscendingOmniPlayerLoader';

// ─── HARDWARE-ACCELERATED SHIMMER LAYER ───
export const PulseLayer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full animate-shimmer pointer-events-none" />
);

export const ShimmerBar = PulseLayer;

// ─── ATOMIC SKELETON BLOCKS ───
export const SkeletonBox = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={cn("relative overflow-hidden bg-white/[0.04] border border-white/[0.05] rounded-xl", className)} style={style}>
    <PulseLayer />
  </div>
);

export const SkeletonText = ({ className, width = "w-full", height = "h-4" }: { className?: string; width?: string; height?: string }) => (
  <div className={cn("relative overflow-hidden bg-white/[0.05] rounded-lg", height, width, className)}>
    <PulseLayer />
  </div>
);

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative w-full aspect-[2/3] bg-white/[0.03] rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.05]", className)}>
    <PulseLayer />
    <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1.5">
      <div className="h-3.5 w-4/5 bg-white/[0.06] rounded-md relative overflow-hidden"><PulseLayer /></div>
      <div className="h-2.5 w-1/2 bg-white/[0.04] rounded-md relative overflow-hidden"><PulseLayer /></div>
    </div>
  </div>
);

export const LandscapeCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative w-full aspect-video bg-white/[0.03] rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.05]", className)}>
    <PulseLayer />
    <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
      <div className="h-4 w-3/4 bg-white/[0.08] rounded-md relative overflow-hidden"><PulseLayer /></div>
      <div className="h-3 w-1/3 bg-white/[0.04] rounded-md relative overflow-hidden"><PulseLayer /></div>
    </div>
  </div>
);

// ─── LEGACY PLAYER LOADERS (PRESERVED FOR COMPATIBILITY) ───
export const RunHappyPlayerLoader = ({ text = "LOADING STREAM...", className, transparent = false }: { text?: string; className?: string; transparent?: boolean }) => (
  <div className={cn(
    "w-full h-full flex flex-col items-center justify-center select-none overflow-hidden relative",
    transparent
      ? "bg-transparent backdrop-blur-none border-none shadow-none"
      : "bg-black/85 rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] min-h-[190px]",
    className
  )}>
    <style>{`
      @keyframes grass-scrolling {
        0% { transform: translate3d(-50%, 0, 0); }
        100% { transform: translate3d(0, 0, 0); }
      }
    `}</style>
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative z-20 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center -translate-x-1.5 sm:-translate-x-2">
        <img src="/run-happy.gif" alt="Loading..." className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(168,85,247,0.7)]" />
      </div>
      <div className="relative -mt-2.5 w-36 sm:w-44 h-4 overflow-hidden pointer-events-none z-10 flex items-end [mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]">
        <div className="absolute inset-x-4 bottom-1 h-2 rounded-full bg-black/60 blur-[2px] -translate-x-1.5 sm:-translate-x-2" />
        <div className="flex w-[200%] h-full shrink-0 transform-gpu will-change-transform" style={{ animation: 'grass-scrolling 1.8s linear infinite' }}>
          <svg className="w-1/2 h-full text-violet-500/80" viewBox="0 0 160 16" preserveAspectRatio="none">
            <path d="M0,16 L0,8 Q5,2 8,8 Q12,0 16,8 Q20,3 24,9 Q28,1 32,8 Q36,4 40,9 Q44,0 48,8 Q52,3 56,9 Q60,1 64,8 Q68,4 72,9 Q76,0 80,8 Q84,3 88,9 Q92,1 96,8 Q100,4 104,9 Q108,0 112,8 Q116,3 120,9 Q124,1 128,8 Q132,4 136,9 Q140,0 144,8 Q148,3 152,9 Q156,2 160,8 L160,16 Z" fill="currentColor" />
          </svg>
          <svg className="w-1/2 h-full text-violet-500/80" viewBox="0 0 160 16" preserveAspectRatio="none">
            <path d="M0,16 L0,8 Q5,2 8,8 Q12,0 16,8 Q20,3 24,9 Q28,1 32,8 Q36,4 40,9 Q44,0 48,8 Q52,3 56,9 Q60,1 64,8 Q68,4 72,9 Q76,0 80,8 Q84,3 88,9 Q92,1 96,8 Q100,4 104,9 Q108,0 112,8 Q116,3 120,9 Q124,1 128,8 Q132,4 136,9 Q140,0 144,8 Q148,3 152,9 Q156,2 160,8 L160,16 Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
    <p className="mt-3 font-lemon text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 tracking-[0.28em] text-[9.5px] sm:text-[10.5px] font-bold uppercase drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] text-center px-4">
      {text}
    </p>
  </div>
);

export const LiquidPlayerSkeleton = ({ text = "Ascending Omni Player", className }: { text?: string; className?: string }) => (
  <div className={cn("w-full h-full absolute inset-0 bg-[#020512] overflow-hidden flex flex-col items-center justify-center", className)}>
    <AscendingOmniPlayerLoader text={text} />
  </div>
);

export const CinemaPlayerStageSkeleton = ({ text = "Ascending Omni Player" }: { text?: string }) => (
  <div className="w-full aspect-video rounded-2xl md:rounded-3xl border border-white/[0.08] bg-[#020512] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center">
    <AscendingOmniPlayerLoader text={text} />
  </div>
);

export const PlayerSkeleton = CinemaPlayerStageSkeleton;

export const TextSkeleton = ({ className, lines = 3 }: { className?: string; lines?: number }) => (
  <div className={cn("flex flex-col gap-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={cn("h-4 bg-white/5 rounded-lg relative overflow-hidden", i === lines - 1 ? "w-2/3" : "w-full")}>
        <PulseLayer />
      </div>
    ))}
  </div>
);

export const SimpleGridSkeleton = () => (
  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 py-6">
    {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

export const HeroSliderSkeleton = () => (
  <div className="relative w-full aspect-[21/9] max-h-[460px] min-h-[220px] rounded-2xl md:rounded-3xl bg-white/[0.03] border border-white/[0.06] overflow-hidden flex flex-col justify-end p-4 sm:p-8">
    <PulseLayer />
    <div className="space-y-3 max-w-xl">
      <div className="h-5 w-32 bg-white/[0.08] rounded-full relative overflow-hidden"><PulseLayer /></div>
      <div className="h-8 sm:h-12 w-3/4 bg-white/[0.08] rounded-2xl relative overflow-hidden"><PulseLayer /></div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-white/[0.05] rounded-md relative overflow-hidden"><PulseLayer /></div>
        <div className="h-5 w-20 bg-white/[0.05] rounded-md relative overflow-hidden"><PulseLayer /></div>
        <div className="h-5 w-14 bg-white/[0.05] rounded-md relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-10 w-32 bg-white/[0.1] rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="h-10 w-28 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>
  </div>
);

export const MoviePageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 flex flex-col gap-8">
    <HeroSliderSkeleton />
    <div className="flex flex-col gap-4">
      <div className="w-48 h-7 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 flex flex-col gap-6">
    <div className="w-1/3 h-9 bg-white/[0.06] rounded-2xl relative overflow-hidden"><PulseLayer /></div>
    <SimpleGridSkeleton />
  </div>
);

export const SimpleLoader = () => (
  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
  </div>
);

// =========================================================================
// 1. WATCH / STREAMING PAGE SKELETON (Anime, Donghua, General Stream)
// =========================================================================
export const WatchPageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-0 pb-20 select-none">
    {/* Main 12-Column Layout matching WatchClient.tsx */}
    <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      
      {/* Left 8 Cols: 16:9 Video Player Stage + Action Bar + Meta */}
      <div className="xl:col-span-8 w-full flex flex-col gap-4">
        {/* 16:9 Player Screen */}
        <div className="w-full aspect-video rounded-2xl md:rounded-3xl bg-black/60 border border-white/[0.06] relative overflow-hidden shadow-2xl flex items-center justify-center">
          <PulseLayer />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
            <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white/20 translate-x-0.5" />
          </div>
        </div>

        {/* Player Action Controls Bar */}
        <div className="w-full p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <PulseLayer />
          {/* Sub / Dub + Server Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-16 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="h-8 w-16 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <div className="h-8 w-24 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="h-8 w-24 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          </div>
          {/* Navigation Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="h-8 w-8 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="h-8 w-20 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="h-8 w-8 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>

        {/* Series Title & Meta Banner */}
        <div className="w-full p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-3 relative overflow-hidden">
          <PulseLayer />
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-7 w-64 sm:w-96 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="h-5 w-16 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
          </div>
          <div className="h-4 w-48 bg-white/[0.04] rounded-lg relative overflow-hidden"><PulseLayer /></div>
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-6 w-20 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
            <div className="h-6 w-16 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
            <div className="h-6 w-24 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>
      </div>

      {/* Right 4 Cols: Episode Navigation Drawer */}
      <div className="xl:col-span-4 w-full h-[480px] xl:h-[620px] rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 flex flex-col gap-3.5 relative overflow-hidden">
        <PulseLayer />
        {/* Drawer Header: Search + Range */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div className="h-9 flex-1 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          <div className="h-9 w-28 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        </div>
        {/* Episode Items List */}
        <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full h-14 rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 flex items-center gap-3 relative overflow-hidden">
              <PulseLayer />
              <div className="w-10 h-9 rounded-lg bg-white/[0.06] shrink-0 relative overflow-hidden"><PulseLayer /></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-4/5 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
                <div className="h-2.5 w-1/3 bg-white/[0.03] rounded relative overflow-hidden"><PulseLayer /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 12 Cols: Detailed Synopsis + Related Seasons + Comments */}
      <div className="xl:col-span-12 w-full flex flex-col gap-6 mt-4">
        {/* Synopsis & Metadata Card */}
        <div className="w-full p-6 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row gap-5 relative overflow-hidden">
          <PulseLayer />
          <div className="w-28 sm:w-36 aspect-[2/3] rounded-2xl bg-white/[0.06] shrink-0 relative overflow-hidden"><PulseLayer /></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
              <div className="h-3.5 w-5/6 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
              <div className="h-3.5 w-2/3 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
            </div>
          </div>
        </div>

        {/* Related Seasons / Franchise Carousel */}
        <div className="space-y-3">
          <div className="h-6 w-40 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>

    </div>
  </div>
);

// =========================================================================
// 2. MOVIE & DRAMA WATCH SKELETON (Widescreen Stage, Audio Tracks, Cast)
// =========================================================================
export const MovieWatchSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-0 pb-20 select-none">
    <div className="w-full flex flex-col gap-6">
      {/* Cinema Widescreen Stage */}
      <div className="w-full aspect-video max-h-[640px] rounded-2xl md:rounded-3xl bg-black/60 border border-white/[0.06] relative overflow-hidden shadow-2xl flex items-center justify-center">
        <PulseLayer />
        <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
          <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white/20 translate-x-0.5" />
        </div>
      </div>

      {/* Audio Tracks & Server Bar */}
      <div className="w-full p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <PulseLayer />
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-8 w-28 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          <div className="h-8 w-24 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          <div className="h-8 w-24 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          <div className="h-8 w-24 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        </div>
      </div>

      {/* Movie Details Banner */}
      <div className="w-full p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row gap-6 relative overflow-hidden">
        <PulseLayer />
        <div className="w-36 sm:w-44 aspect-[2/3] rounded-2xl bg-white/[0.06] shrink-0 relative overflow-hidden shadow-lg"><PulseLayer /></div>
        <div className="flex-1 space-y-3.5">
          <div className="h-8 sm:h-10 w-3/4 max-w-lg bg-white/[0.08] rounded-2xl relative overflow-hidden"><PulseLayer /></div>
          <div className="flex flex-wrap gap-2.5">
            <div className="h-6 w-14 bg-white/[0.06] rounded-md relative overflow-hidden"><PulseLayer /></div>
            <div className="h-6 w-16 bg-white/[0.06] rounded-md relative overflow-hidden"><PulseLayer /></div>
            <div className="h-6 w-20 bg-white/[0.06] rounded-md relative overflow-hidden"><PulseLayer /></div>
            <div className="h-6 w-24 bg-white/[0.06] rounded-md relative overflow-hidden"><PulseLayer /></div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
            <div className="h-4 w-5/6 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
            <div className="h-4 w-2/3 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>
      </div>

      {/* Cast & Crew Carousel */}
      <div className="space-y-3">
        <div className="h-6 w-32 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-16 h-16 rounded-full bg-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
              <div className="h-3 w-16 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Movies */}
      <div className="space-y-3">
        <div className="h-6 w-44 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  </div>
);

// =========================================================================
// 3. LIBRARY / WATCHLIST SKELETON
// =========================================================================
export const LibraryPageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    {/* Page Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="space-y-2">
        <div className="h-8 w-44 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="h-4 w-64 bg-white/[0.04] rounded-lg relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="h-10 w-full sm:w-64 bg-white/[0.04] border border-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
    </div>

    {/* Primary Mode Tabs (Watchlist vs Readlist) */}
    <div className="flex items-center gap-2 mb-6">
      <div className="h-10 w-32 bg-white/[0.08] rounded-full relative overflow-hidden"><PulseLayer /></div>
      <div className="h-10 w-32 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
    </div>

    {/* Filter Toolbar (Status Chips + Dropdown Selectors) */}
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] mb-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {['All', 'Watching', 'Completed', 'Planned', 'On Hold', 'Dropped'].map((_, i) => (
          <div key={i} className={cn("h-8 rounded-full relative overflow-hidden shrink-0", i === 0 ? "w-14 bg-white/[0.1]" : "w-20 bg-white/[0.04]")}>
            <PulseLayer />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-9 w-28 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="h-9 w-32 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>

    {/* Continue Watching Section */}
    <div className="mb-8 space-y-3">
      <div className="h-5 w-40 bg-white/[0.06] rounded-lg relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-3 flex gap-3 relative overflow-hidden">
            <PulseLayer />
            <div className="w-16 h-full rounded-xl bg-white/[0.06] shrink-0 relative overflow-hidden"><PulseLayer /></div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-1.5">
                <div className="h-3.5 w-4/5 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
                <div className="h-2.5 w-1/2 bg-white/[0.03] rounded relative overflow-hidden"><PulseLayer /></div>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Library Content Grid */}
    <div className="space-y-3">
      <div className="h-5 w-32 bg-white/[0.06] rounded-lg relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

// =========================================================================
// 4. SETTINGS PAGE SKELETON (Sidebar + Section Settings Stage)
// =========================================================================
export const SettingsPageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    {/* Mobile Section Header Bar */}
    <div className="block md:hidden w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-4 relative overflow-hidden">
      <PulseLayer />
    </div>

    {/* Desktop 2-Column iOS-Style Layout */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar Menu (3 Cols) */}
      <div className="hidden md:flex md:col-span-4 xl:col-span-3 flex-col gap-6">
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-5 relative overflow-hidden">
          <PulseLayer />
          <div className="space-y-1.5 pb-2 border-b border-white/[0.06]">
            <div className="h-6 w-28 bg-white/[0.08] rounded-lg relative overflow-hidden"><PulseLayer /></div>
            <div className="h-3 w-16 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
          </div>
          {/* Section Items */}
          {[1, 2, 3, 4].map(g => (
            <div key={g} className="space-y-2">
              <div className="h-3 w-20 bg-white/[0.04] rounded uppercase tracking-wider text-[9px]" />
              <div className="space-y-1.5">
                {[1, 2].map(item => (
                  <div key={item} className="h-11 w-full rounded-xl bg-white/[0.03] border border-white/[0.04] p-2 flex items-center gap-2.5 relative overflow-hidden">
                    <PulseLayer />
                    <div className="w-6 h-6 rounded-lg bg-white/[0.06] shrink-0" />
                    <div className="h-3 w-3/4 bg-white/[0.06] rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Stage (8-9 Cols) */}
      <div className="md:col-span-8 xl:col-span-9 flex flex-col gap-6">
        {/* Section Header */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-2 relative overflow-hidden">
          <PulseLayer />
          <div className="h-7 w-48 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          <div className="h-4 w-72 bg-white/[0.04] rounded-lg relative overflow-hidden"><PulseLayer /></div>
        </div>

        {/* Adventurer Card / Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-6 relative overflow-hidden">
          <PulseLayer />
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/[0.06]">
            <div className="w-20 h-20 rounded-full bg-white/[0.08] relative overflow-hidden shrink-0"><PulseLayer /></div>
            <div className="space-y-2 flex-1 w-full sm:w-auto">
              <div className="h-5 w-40 bg-white/[0.08] rounded-lg relative overflow-hidden"><PulseLayer /></div>
              <div className="h-3.5 w-60 bg-white/[0.04] rounded-lg relative overflow-hidden"><PulseLayer /></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>

        {/* Appearance Mode Card */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-4 relative overflow-hidden">
          <PulseLayer />
          <div className="h-5 w-36 bg-white/[0.08] rounded-lg relative overflow-hidden"><PulseLayer /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <div className="h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
            <div className="h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>

        {/* Toggles Container */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-4 relative overflow-hidden">
          <PulseLayer />
          {[1, 2, 3].map(t => (
            <div key={t} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-none">
              <div className="space-y-1">
                <div className="h-4 w-40 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
                <div className="h-3 w-56 bg-white/[0.03] rounded relative overflow-hidden"><PulseLayer /></div>
              </div>
              <div className="w-11 h-6 rounded-full bg-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// =========================================================================
// 5. BROADCAST SCHEDULE SKELETON
// =========================================================================
export const SchedulePageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    {/* Page Title & Controls */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="space-y-1.5">
        <div className="h-8 w-56 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="h-4 w-40 bg-white/[0.04] rounded-lg relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-24 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="h-9 w-24 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>

    {/* 7-Day Picker Ribbon Strip */}
    <div className="w-full p-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-none mb-6">
      {[1, 2, 3, 4, 5, 6, 7].map(d => (
        <div key={d} className={cn("h-16 rounded-xl flex-1 min-w-[76px] relative overflow-hidden", d === 1 ? "bg-white/[0.1] border border-white/20" : "bg-white/[0.03] border border-white/[0.04]")}>
          <PulseLayer />
        </div>
      ))}
    </div>

    {/* Category Filters */}
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
      {['All', 'Subbed', 'Dubbed', 'Donghua', 'Hindi'].map((_, i) => (
        <div key={i} className={cn("h-8 rounded-full relative overflow-hidden shrink-0", i === 0 ? "w-14 bg-white/[0.1]" : "w-20 bg-white/[0.04]")}>
          <PulseLayer />
        </div>
      ))}
    </div>

    {/* Schedule Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-3 flex gap-3 relative overflow-hidden">
          <PulseLayer />
          <div className="w-16 h-full rounded-xl bg-white/[0.06] shrink-0 relative overflow-hidden"><PulseLayer /></div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-white/[0.08] rounded relative overflow-hidden"><PulseLayer /></div>
              <div className="h-4 w-4/5 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-14 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
              <div className="h-3.5 w-16 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =========================================================================
// 6. PROFILE PAGE SKELETON
// =========================================================================
export const ProfilePageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    {/* Cover Header Banner */}
    <div className="w-full aspect-[21/9] max-h-[300px] min-h-[160px] rounded-3xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden mb-6">
      <PulseLayer />
    </div>

    {/* Avatar & User Strip */}
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 px-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-white/[0.08] relative overflow-hidden shadow-2xl shrink-0">
          <PulseLayer />
        </div>
        <div className="space-y-2 pb-2">
          <div className="h-7 w-44 bg-white/[0.08] rounded-xl relative overflow-hidden mx-auto sm:mx-0"><PulseLayer /></div>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <div className="h-5 w-20 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
            <div className="h-5 w-28 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 justify-center sm:justify-end pb-2">
        <div className="h-10 w-28 bg-white/[0.06] rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="h-10 w-10 bg-white/[0.04] rounded-full relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>

    {/* Stats Strip */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 relative overflow-hidden">
          <PulseLayer />
          <div className="h-3 w-16 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
          <div className="h-6 w-20 bg-white/[0.08] rounded-lg relative overflow-hidden"><PulseLayer /></div>
        </div>
      ))}
    </div>

    {/* Profile Tab Navigation */}
    <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-3 overflow-x-auto scrollbar-none">
      {['Overview', 'Watchlist', 'Favorites', 'Badges', 'Activity'].map((_, i) => (
        <div key={i} className={cn("h-8 rounded-full relative overflow-hidden shrink-0", i === 0 ? "w-20 bg-white/[0.1]" : "w-20 bg-white/[0.04]")}>
          <PulseLayer />
        </div>
      ))}
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  </div>
);

// =========================================================================
// 7. MANGA DETAILS SKELETON
// =========================================================================
export const MangaDetailsSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    {/* Back Button */}
    <div className="h-8 w-24 bg-white/[0.05] rounded-full mb-6 relative overflow-hidden"><PulseLayer /></div>

    {/* Manga Hero Container */}
    <div className="p-5 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row gap-6 mb-8 relative overflow-hidden">
      <PulseLayer />
      <div className="w-48 sm:w-56 aspect-[2/3] rounded-2xl bg-white/[0.06] shrink-0 relative overflow-hidden shadow-2xl mx-auto md:mx-0"><PulseLayer /></div>
      <div className="flex-1 space-y-4">
        <div className="h-8 sm:h-10 w-3/4 bg-white/[0.08] rounded-2xl relative overflow-hidden"><PulseLayer /></div>
        <div className="flex flex-wrap gap-2.5">
          <div className="h-6 w-24 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
          <div className="h-6 w-16 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
          <div className="h-6 w-20 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3.5 w-full bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
          <div className="h-3.5 w-5/6 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
          <div className="h-3.5 w-4/6 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
        </div>
        <div className="flex gap-3 pt-3">
          <div className="h-11 w-40 bg-white/[0.1] rounded-full relative overflow-hidden"><PulseLayer /></div>
          <div className="h-11 w-36 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
        </div>
      </div>
    </div>

    {/* Chapters Section Toolbar */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
      <div className="h-6 w-36 bg-white/[0.06] rounded-lg relative overflow-hidden"><PulseLayer /></div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-32 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="h-9 w-44 bg-white/[0.04] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>

    {/* Chapter Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 flex items-center justify-between relative overflow-hidden">
          <PulseLayer />
          <div className="space-y-1">
            <div className="h-3.5 w-32 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
            <div className="h-2.5 w-20 bg-white/[0.03] rounded relative overflow-hidden"><PulseLayer /></div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-white/[0.04] relative overflow-hidden"><PulseLayer /></div>
        </div>
      ))}
    </div>
  </div>
);

// =========================================================================
// 8. MANGA & NOVEL READER SKELETON
// =========================================================================
export const MangaReaderSkeleton = () => (
  <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between select-none">
    {/* Fixed Top HUD */}
    <div className="w-full h-14 bg-black/90 border-b border-white/[0.08] px-4 flex items-center justify-between z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/[0.06] relative overflow-hidden"><PulseLayer /></div>
        <div className="h-4 w-36 bg-white/[0.08] rounded relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-28 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>

    {/* Reading Canvas Pages */}
    <div className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-4">
      <div className="w-full aspect-[2/3] rounded-2xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden flex items-center justify-center">
        <PulseLayer />
      </div>
      <div className="w-full aspect-[2/3] rounded-2xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden flex items-center justify-center">
        <PulseLayer />
      </div>
    </div>

    {/* Fixed Bottom HUD */}
    <div className="w-full h-14 bg-black/90 border-t border-white/[0.08] px-4 flex items-center justify-between z-30">
      <div className="h-4 w-20 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white/[0.04] relative overflow-hidden"><PulseLayer /></div>
        <div className="h-8 w-8 rounded-lg bg-white/[0.04] relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>
  </div>
);

// =========================================================================
// 9. SEARCH & EXPLORE SKELETON
// =========================================================================
export const SearchPageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    {/* Top Search Bar */}
    <div className="w-full h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 flex items-center gap-3 mb-6 relative overflow-hidden">
      <PulseLayer />
      <div className="w-5 h-5 rounded-full bg-white/[0.08] relative overflow-hidden"><PulseLayer /></div>
      <div className="h-4 w-48 bg-white/[0.05] rounded relative overflow-hidden"><PulseLayer /></div>
    </div>

    {/* Filter Dropdown Controls */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[1, 2, 3, 4].map(f => (
        <div key={f} className="h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden"><PulseLayer /></div>
      ))}
    </div>

    {/* Genre Chips Ribbon */}
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
      {['Action', 'Adventure', 'Fantasy', 'Romance', 'Sci-Fi', 'Comedy', 'Supernatural', 'Mystery'].map((_, i) => (
        <div key={i} className="h-8 w-20 rounded-full bg-white/[0.04] border border-white/[0.04] relative overflow-hidden shrink-0"><PulseLayer /></div>
      ))}
    </div>

    {/* Results Meta */}
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-36 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
      <div className="h-4 w-20 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
    </div>

    {/* Results Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: 18 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  </div>
);

// =========================================================================
// 10. CINEMA & MOVIES DIRECTORY SKELETON
// =========================================================================
export const CinemaDirectorySkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none space-y-8">
    <HeroSliderSkeleton />

    {/* Category Tabs */}
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {['All Cinema', 'Hollywood Movies', 'Asian Dramas', 'Anime Movies', 'Top Box Office'].map((_, i) => (
        <div key={i} className={cn("h-9 rounded-full relative overflow-hidden shrink-0", i === 0 ? "w-28 bg-white/[0.1]" : "w-32 bg-white/[0.04]")}>
          <PulseLayer />
        </div>
      ))}
    </div>

    {/* Trending Movies Row (Widescreen) */}
    <div className="space-y-3">
      <div className="h-6 w-44 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <LandscapeCardSkeleton key={i} />)}
      </div>
    </div>

    {/* Full Cinema Grid */}
    <div className="space-y-3">
      <div className="h-6 w-36 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

// =========================================================================
// 11. HOME PAGE SKELETON (Anime, Donghua, Hindi Home)
// =========================================================================
export const HomePageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-0 sm:pt-1 pb-20 select-none space-y-8">
    <HeroSliderSkeleton />

    {/* Quick Navigation Chips */}
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {['Trending', 'Top Airing', 'Most Popular', 'Movies', 'OVA', 'Completed'].map((_, i) => (
        <div key={i} className="h-9 w-28 rounded-full bg-white/[0.04] border border-white/[0.04] relative overflow-hidden shrink-0"><PulseLayer /></div>
      ))}
    </div>

    {/* Section 1: Trending Now */}
    <div className="space-y-3">
      <div className="h-6 w-40 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>

    {/* Section 2: Top Airing */}
    <div className="space-y-3">
      <div className="h-6 w-36 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>

    {/* Section 3: Latest Updates */}
    <div className="space-y-3">
      <div className="h-6 w-44 bg-white/[0.06] rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

// =========================================================================
// 12. WATCH PARTY / ROOMS SKELETON
// =========================================================================
export const RoomsPageSkeleton = () => (
  <div className="w-full px-2 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-20 select-none">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="space-y-2">
        <div className="h-8 w-52 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="h-4 w-72 bg-white/[0.04] rounded-lg relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="h-10 w-36 bg-white/[0.08] rounded-full relative overflow-hidden"><PulseLayer /></div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 rounded-3xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col justify-between relative overflow-hidden">
          <PulseLayer />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] relative overflow-hidden shrink-0"><PulseLayer /></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-3/4 bg-white/[0.06] rounded relative overflow-hidden"><PulseLayer /></div>
              <div className="h-3 w-1/2 bg-white/[0.04] rounded relative overflow-hidden"><PulseLayer /></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="h-5 w-20 bg-white/[0.05] rounded-full relative overflow-hidden"><PulseLayer /></div>
            <div className="h-8 w-24 bg-white/[0.08] rounded-xl relative overflow-hidden"><PulseLayer /></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
