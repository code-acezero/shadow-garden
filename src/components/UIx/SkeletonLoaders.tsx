import React from 'react';
import { cn } from '@/lib/utils';
import { AscendingOmniPlayerLoader } from '@/components/Player/AscendingOmniPlayerLoader';

const PulseLayer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
);

export const PageSkeleton = () => (
  <div className="h-[100dvh] max-h-[100dvh] bg-[#020617] text-white flex flex-col px-2 sm:px-4 py-4 overflow-hidden relative">
    <div className="w-full flex flex-col gap-6 mt-2">
      <div className="w-1/3 h-9 bg-white/5 rounded-2xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative w-full aspect-[2/3] bg-white/5 rounded-[24px] overflow-hidden border border-white/5 shadow-lg", className)}>
    <PulseLayer />
  </div>
);

export const RunHappyPlayerLoader = ({ text = "LOADING STREAM...", className, transparent = false }: { text?: string; className?: string; transparent?: boolean }) => (
  <div className={cn(
    "w-full h-full flex flex-col items-center justify-center select-none overflow-hidden relative",
    transparent
      ? "bg-transparent backdrop-blur-none border-none shadow-none"
      : "bg-black/85 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] min-h-[190px]",
    className
  )}>
    <style>{`
      @keyframes grass-scrolling {
        0% { transform: translate3d(-50%, 0, 0); }
        100% { transform: translate3d(0, 0, 0); }
      }
      @keyframes firefly-rise-1 {
        0%, 100% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
        25% { opacity: 0.9; }
        70% { transform: translate3d(-14px, -35px, 0) scale(1); opacity: 0.7; }
        90% { opacity: 0; }
      }
      @keyframes firefly-rise-2 {
        0%, 100% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
        30% { opacity: 1; }
        75% { transform: translate3d(18px, -45px, 0) scale(0.6); opacity: 0.8; }
        95% { opacity: 0; }
      }
      @keyframes firefly-rise-3 {
        0%, 100% { transform: translate3d(0, 0, 0) scale(0.5); opacity: 0; }
        40% { opacity: 0.85; }
        80% { transform: translate3d(-8px, -40px, 0) scale(1.1); opacity: 0.6; }
        95% { opacity: 0; }
      }
    `}</style>

    {/* Subtle Purple-Violet Atmospheric Depth */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.18)_0%,transparent_70%)] pointer-events-none" />
    </div>

    {/* Happy Run Character & Animated Purple Grass Floor with Firefly Motes */}
    <div className="relative flex flex-col items-center justify-center">
      {/* 5 Delicate Red-Violet-Purple Firefly Motes */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <div className="absolute bottom-5 left-1/4 w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c084fc]" style={{ animation: 'firefly-rise-1 3.5s ease-in-out infinite' }} />
        <div className="absolute bottom-4 right-1/4 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" style={{ animation: 'firefly-rise-2 4.2s ease-in-out infinite 0.7s' }} />
        <div className="absolute bottom-6 left-1/3 w-1 h-1 rounded-full bg-purple-300 shadow-[0_0_6px_#a855f7]" style={{ animation: 'firefly-rise-3 3.8s ease-in-out infinite 1.4s' }} />
        <div className="absolute bottom-5 right-1/3 w-1 h-1 rounded-full bg-fuchsia-400 shadow-[0_0_7px_#e879f9]" style={{ animation: 'firefly-rise-1 4.5s ease-in-out infinite 2.1s' }} />
        <div className="absolute bottom-3 left-1/2 w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" style={{ animation: 'firefly-rise-2 3.9s ease-in-out infinite 1.8s' }} />
      </div>

      {/* Running Character - Centered horizontally to compensate for left transparent padding */}
      <div className="relative z-20 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center -translate-x-1.5 sm:-translate-x-2">
        <img
          src="/run-happy.gif"
          alt="Loading Stream..."
          className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(168,85,247,0.7)]"
        />
      </div>

      {/* Moving Purple Anime Grass Floor Strip with Faded Left and Right Edges */}
      <div className="relative -mt-2.5 w-36 sm:w-44 h-4 overflow-hidden pointer-events-none z-10 flex items-end [mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]">
        {/* Shadow under feet - aligned with visually centered character */}
        <div className="absolute inset-x-4 bottom-1 h-2 rounded-full bg-black/60 blur-[2px] -translate-x-1.5 sm:-translate-x-2" />
        
        {/* Seamless scrolling anime grass pattern (loops infinitely at 60fps) */}
        <div
          className="flex w-[200%] h-full shrink-0 transform-gpu will-change-transform"
          style={{ animation: 'grass-scrolling 1.8s linear infinite' }}
        >
          {/* Half 1 */}
          <svg className="w-1/2 h-full text-violet-500/80" viewBox="0 0 160 16" preserveAspectRatio="none">
            <path d="M0,16 L0,8 Q5,2 8,8 Q12,0 16,8 Q20,3 24,9 Q28,1 32,8 Q36,4 40,9 Q44,0 48,8 Q52,3 56,9 Q60,1 64,8 Q68,4 72,9 Q76,0 80,8 Q84,3 88,9 Q92,1 96,8 Q100,4 104,9 Q108,0 112,8 Q116,3 120,9 Q124,1 128,8 Q132,4 136,9 Q140,0 144,8 Q148,3 152,9 Q156,2 160,8 L160,16 Z" fill="url(#purpleGrassGrad)" />
            <defs>
              <linearGradient id="purpleGrassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="35%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>
          </svg>
          {/* Half 2 (identical for seamless 100% loop) */}
          <svg className="w-1/2 h-full text-violet-500/80" viewBox="0 0 160 16" preserveAspectRatio="none">
            <path d="M0,16 L0,8 Q5,2 8,8 Q12,0 16,8 Q20,3 24,9 Q28,1 32,8 Q36,4 40,9 Q44,0 48,8 Q52,3 56,9 Q60,1 64,8 Q68,4 72,9 Q76,0 80,8 Q84,3 88,9 Q92,1 96,8 Q100,4 104,9 Q108,0 112,8 Q116,3 120,9 Q124,1 128,8 Q132,4 136,9 Q140,0 144,8 Q148,3 152,9 Q156,2 160,8 L160,16 Z" fill="url(#purpleGrassGrad)" />
          </svg>
        </div>
      </div>
    </div>

    {/* Text: Purple-Violet Theme */}
    <p className="mt-3 font-lemon text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 tracking-[0.28em] text-[9.5px] sm:text-[10.5px] font-bold uppercase drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] text-center px-4">
      {text}
    </p>
  </div>
);

export const LiquidPlayerSkeleton = ({ text = "Ascending Omni Player", className }: { text?: string; className?: string }) => (
  <div className={cn("w-full h-full absolute inset-0 bg-[#020512] overflow-hidden flex flex-col items-center justify-center", className)}>
    <AscendingOmniPlayerLoader text="Ascending Omni Player" />
  </div>
);

export const CinemaPlayerStageSkeleton = ({ text = "Ascending Omni Player" }: { text?: string }) => (
  <div className="w-full aspect-video rounded-2xl md:rounded-3xl border border-white/[0.08] bg-[#020512] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center">
    <AscendingOmniPlayerLoader text="Ascending Omni Player" />
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

export const WatchPageSkeleton = () => (
  <div className="min-h-screen bg-[#020617] text-white flex flex-col overflow-x-hidden relative selection:bg-cyan-500/30">
    <div className="w-full max-w-[1520px] mx-auto px-3 sm:px-4 md:px-8 pt-2 pb-16 flex flex-col items-center">
      <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 8-Column: Player + Controls Skeleton */}
        <div className="xl:col-span-8 w-full flex flex-col gap-3">
          <CinemaPlayerStageSkeleton text="Ascending Omni Player" />
          {/* Controls Bar Skeleton */}
          <div className="w-full bg-[#0a0f1d]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl md:rounded-3xl p-5 flex flex-col gap-3 shadow-xl relative overflow-hidden">
            <PulseLayer />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-24 h-6 bg-white/10 rounded-full" />
                <div className="w-16 h-6 bg-white/5 rounded-full" />
                <div className="w-12 h-6 bg-white/5 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/5 rounded-xl" />
                <div className="w-8 h-8 bg-white/5 rounded-xl" />
                <div className="w-32 h-8 bg-white/10 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
              <div className="w-48 h-6 bg-white/10 rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="w-20 h-8 bg-white/5 rounded-full" />
                <div className="w-20 h-8 bg-white/5 rounded-full" />
                <div className="w-28 h-8 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 4-Column: Sidebar Skeleton */}
        <div className="xl:col-span-4 w-full h-[520px] bg-[#0a0f1d]/85 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/[0.08] p-5 shadow-xl relative overflow-hidden flex flex-col gap-3">
          <PulseLayer />
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="w-28 h-6 bg-white/10 rounded-xl" />
            <div className="w-16 h-5 bg-white/5 rounded-full" />
          </div>
          <div className="flex flex-col gap-2.5 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-16 bg-white/[0.03] rounded-2xl flex items-center gap-3 p-2 border border-white/5">
                <div className="w-12 h-full bg-white/10 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="w-3/4 h-3.5 bg-white/10 rounded" />
                  <div className="w-1/2 h-2.5 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 12-Column: Details Card Skeleton */}
        <div className="xl:col-span-12 w-full h-[220px] bg-[#0a0f1d]/85 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/[0.08] p-6 shadow-xl relative overflow-hidden flex gap-6">
          <PulseLayer />
          <div className="w-36 h-full bg-white/10 rounded-2xl shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            <div className="w-1/3 h-7 bg-white/10 rounded-xl" />
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-white/5 rounded-full" />
              <div className="w-16 h-5 bg-white/5 rounded-full" />
              <div className="w-20 h-5 bg-white/5 rounded-full" />
            </div>
            <div className="w-full h-12 bg-white/5 rounded-xl mt-2" />
          </div>
        </div>

      </div>
    </div>
  </div>
);

export const SimpleGridSkeleton = () => (
  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 py-6">
    {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

export const HeroSliderSkeleton = () => (
  <div className="relative w-full h-[56vh] sm:h-[62vh] md:h-[68vh] lg:h-[72vh] bg-[#020617] overflow-hidden flex flex-col items-center justify-end p-4 sm:p-6 border-b border-white/5">
    <PulseLayer />
    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />
    <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3 w-full max-w-3xl mb-4 sm:mb-8 md:mb-12 text-center">
      <div className="w-32 sm:w-36 h-4 sm:h-5 bg-white/10 rounded-full relative overflow-hidden mb-1"><PulseLayer /></div>
      <div className="w-3/4 max-w-xl h-8 sm:h-10 md:h-14 bg-white/10 rounded-2xl relative overflow-hidden mb-1"><PulseLayer /></div>
      <div className="flex gap-1.5 sm:gap-2 justify-center w-full mb-2">
        <div className="w-16 sm:w-20 h-5 sm:h-6 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="w-12 sm:w-16 h-5 sm:h-6 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="w-20 sm:w-24 h-5 sm:h-6 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="hidden sm:block w-full max-w-md h-10 sm:h-12 bg-white/5 rounded-xl relative overflow-hidden mb-2"><PulseLayer /></div>
      <div className="flex gap-2.5 sm:gap-4 mt-1">
        <div className="w-28 sm:w-36 h-10 sm:h-11 bg-emerald-500/20 rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="w-28 sm:w-36 h-10 sm:h-11 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>
  </div>
);

export const MoviePageSkeleton = () => (
  <div className="min-h-screen bg-[#020617] text-white flex flex-col overflow-x-hidden relative">
    <HeroSliderSkeleton />
    <div className="w-full px-2 sm:px-4 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="w-48 h-8 bg-white/5 rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-48 h-8 bg-white/5 rounded-xl relative overflow-hidden"><PulseLayer /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  </div>
);

export const SimpleLoader = () => (
  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
    <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-emerald-500/50 animate-spin" />
  </div>
);
