import React from 'react';
import { cn } from '@/lib/utils';

const PulseLayer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
);

export const PageSkeleton = () => (
  <div className="min-h-screen bg-[#020617] text-white flex flex-col p-4 sm:p-8 overflow-hidden relative">
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 mt-16">
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

export const PlayerSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("w-full aspect-video bg-black/40 backdrop-blur-2xl rounded-[30px] border border-white/5 overflow-hidden relative shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]", className)}>
    <PulseLayer />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-white/5" />
    </div>
  </div>
);

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
  <div className="min-h-screen bg-[#020617] text-white flex flex-col overflow-x-hidden relative p-4 mt-20">
    <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-6 items-stretch">
      <div className="xl:col-span-8 w-full flex flex-col gap-4">
        <PlayerSkeleton />
        <div className="h-16 w-full bg-white/5 rounded-[30px] relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="xl:col-span-4 w-full h-[300px] xl:h-full bg-white/5 rounded-[40px] relative overflow-hidden"><PulseLayer /></div>
      <div className="xl:col-span-12 w-full h-[300px] bg-white/5 rounded-[40px] relative overflow-hidden mt-6"><PulseLayer /></div>
    </div>
  </div>
);

export const SimpleGridSkeleton = () => (
  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 py-6">
    {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

export const HeroSliderSkeleton = () => (
  <div className="relative w-full h-[70vh] md:h-[90vh] bg-[#020617] overflow-hidden flex flex-col items-center justify-end p-6 border-b border-white/5">
    <PulseLayer />
    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />
    <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-3xl mb-12 text-center">
      <div className="w-36 h-5 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
      <div className="w-3/4 max-w-xl h-12 sm:h-16 bg-white/10 rounded-2xl relative overflow-hidden"><PulseLayer /></div>
      <div className="flex gap-2 justify-center w-full">
        <div className="w-20 h-6 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="w-16 h-6 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="w-24 h-6 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
      </div>
      <div className="w-full max-w-md h-12 bg-white/5 rounded-xl relative overflow-hidden"><PulseLayer /></div>
      <div className="flex gap-4 mt-2">
        <div className="w-36 h-12 bg-emerald-500/20 rounded-full relative overflow-hidden"><PulseLayer /></div>
        <div className="w-36 h-12 bg-white/10 rounded-full relative overflow-hidden"><PulseLayer /></div>
      </div>
    </div>
  </div>
);

export const MoviePageSkeleton = () => (
  <div className="min-h-screen bg-[#020617] text-white flex flex-col overflow-x-hidden relative">
    <HeroSliderSkeleton />
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
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
