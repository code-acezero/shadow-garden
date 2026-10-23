import React from 'react';
import { cn } from '@/lib/utils';

const PulseLayer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
);

export const PageSkeleton = () => (
  <div className="min-h-screen bg-[#020617] text-white flex flex-col px-2 sm:px-4 py-4 overflow-hidden relative">
    <div className="w-full flex flex-col gap-8 mt-2">
      <div className="w-1/3 h-10 bg-white/5 rounded-2xl relative overflow-hidden"><PulseLayer /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative w-full aspect-[2/3] bg-white/5 rounded-[24px] overflow-hidden border border-white/5 shadow-lg", className)}>
    <PulseLayer />
  </div>
);

import { MagicalWaveParticlesPlayerLoader } from '@/components/Watch/LiquidWatchLoaders';

export const RunHappyPlayerLoader = ({ text = "LOADING REALITY...", className, transparent = false }: { text?: string; className?: string; transparent?: boolean }) => (
  <div className={cn(
    "w-full h-full flex flex-col items-center justify-center select-none overflow-hidden relative",
    transparent
      ? "bg-transparent backdrop-blur-none border-none shadow-none"
      : "bg-black/80 backdrop-blur-2xl rounded-[30px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] min-h-[180px]",
    className
  )}>
    <div className="relative w-[clamp(3.5rem,25%,8rem)] h-[clamp(3.5rem,25%,8rem)] flex items-center justify-center">
      <img src="/run-happy.gif" alt="Loading..." className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
      <div className="absolute bottom-2 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
    </div>
    <p className="mt-2 font-lemon text-red-500 animate-pulse tracking-[0.3em] text-[9px] sm:text-[10px] font-bold uppercase drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] text-center px-4">
      {text}
    </p>
  </div>
);

export const LiquidPlayerSkeleton = ({ text = "INITIALIZING STREAM...", className }: { text?: string; className?: string }) => (
  <div className={cn("w-full h-full absolute inset-0 bg-[#030712] overflow-hidden flex flex-col items-center justify-center", className)}>
    <PulseLayer />
    <MagicalWaveParticlesPlayerLoader text={text} />
  </div>
);

export const CinemaPlayerStageSkeleton = ({ text = "LOADING CINEMA PLAYER..." }: { text?: string }) => (
  <div className="w-full aspect-video rounded-2xl md:rounded-3xl border border-white/[0.08] bg-[#030712] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center">
    <PulseLayer />
    {/* Subtle radial cinema spotlight */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
    <MagicalWaveParticlesPlayerLoader text={text} />
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
          <CinemaPlayerStageSkeleton text="INITIALIZING CINEMA PLAYER..." />
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
