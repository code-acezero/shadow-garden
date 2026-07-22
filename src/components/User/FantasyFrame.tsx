import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';

interface FantasyFrameProps {
    frameId?: string;
    level?: number;
    showLevelTag?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const FRAMES = {
    none: { css: '', effects: null },
    starter: { css: 'bg-zinc-700/50 border-2 border-zinc-500', effects: 'shadow-inner' },
    crimson: { 
        css: 'bg-gradient-to-tr from-red-600 via-red-500 to-red-900 border-2 border-red-400', 
        effects: 'shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse' 
    },
    sapphire: { 
        css: 'bg-gradient-to-bl from-blue-400 via-blue-600 to-indigo-800 border-2 border-blue-400', 
        effects: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
    },
    emerald: { 
        css: 'bg-gradient-to-tr from-emerald-400 via-green-500 to-green-800 border-2 border-green-400', 
        effects: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
    },
    // Advanced Anime/Gaming Frames
    golden: { 
        css: 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 before:absolute before:inset-[-2px] before:rounded-full before:bg-gradient-to-r before:from-yellow-300 before:via-amber-500 before:to-yellow-300 before:animate-[spin_4s_linear_infinite]', 
        effects: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
    },
    shadow: { 
        css: 'bg-gradient-to-b from-violet-600 via-black to-purple-900 before:absolute before:inset-[-4px] before:rounded-full before:border-[2px] before:border-dashed before:border-purple-500 before:animate-[spin_8s_linear_infinite_reverse]', 
        effects: 'shadow-[0_0_30px_rgba(139,92,246,0.8)]' 
    },
    celestial: { 
        css: 'bg-black before:absolute before:inset-[-4px] before:rounded-full before:bg-gradient-to-tr before:from-cyan-400 before:via-purple-500 before:to-pink-500 before:animate-[spin_3s_linear_infinite]', 
        effects: 'shadow-[0_0_40px_rgba(236,72,153,0.7)]' 
    },
    divine: { 
        // Honkai / Genshin impact style 5-star frame
        css: 'bg-zinc-900 before:absolute before:inset-[-6px] before:rounded-full before:bg-gradient-to-r before:from-pink-500 before:via-yellow-400 before:to-red-500 before:animate-[spin_2s_linear_infinite] after:absolute after:inset-[-2px] after:rounded-full after:border-2 after:border-yellow-300', 
        effects: 'shadow-[0_0_50px_rgba(244,63,94,0.9)] ring-4 ring-yellow-500/30' 
    },
};

export function getLevelColors(lvl: number) {
  if (lvl < 10) return { stroke: '#d1d5db', from: '#9ca3af', via: '#4b5563', to: '#1f2937', shadow: 'rgba(156,163,175,0.8)' }; // Gray
  if (lvl < 25) return { stroke: '#86efac', from: '#4ade80', via: '#16a34a', to: '#14532d', shadow: 'rgba(74,222,128,0.8)' }; // Green
  if (lvl < 50) return { stroke: '#93c5fd', from: '#3b82f6', via: '#2563eb', to: '#1e3a8a', shadow: 'rgba(59,130,246,0.8)' }; // Blue
  if (lvl < 75) return { stroke: '#e9d5ff', from: '#a855f7', via: '#7e22ce', to: '#3b0764', shadow: 'rgba(168,85,247,0.8)' }; // Purple
  if (lvl < 100) return { stroke: '#fde047', from: '#eab308', via: '#ca8a04', to: '#713f12', shadow: 'rgba(234,179,8,0.8)' }; // Gold
  return { stroke: '#fca5a5', from: '#ef4444', via: '#b91c1c', to: '#7f1d1d', shadow: 'rgba(239,68,68,0.8)' }; // Red
}

function UserLevelPyramidBadge({ level, className = "w-4 h-4" }: { level: number | string; className?: string }) {
  const numLvl = typeof level === 'string' ? parseInt(level) || 1 : level;
  const colors = getLevelColors(numLvl);
  const gradId = `user_lvl_grad_${numLvl}_${Math.random().toString(36).substr(2, 5)}`;
  
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ filter: `drop-shadow(0 0 4px ${colors.shadow})` }}>
        <path
          d="M1 2L23 2L12 22L1 2Z"
          fill={`url(#${gradId})`}
          stroke={colors.stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id={gradId} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.from} />
            <stop offset="0.5" stopColor={colors.via} />
            <stop offset="1" stopColor={colors.to} />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white leading-none pb-1.5 tracking-tighter">
        {level}
      </span>
    </div>
  );
}

export default function FantasyFrame({ frameId = 'none', level, showLevelTag = true, children, className = '' }: FantasyFrameProps) {
    const frame = FRAMES[frameId as keyof typeof FRAMES] || FRAMES.none;
    const settingsContext = useSettings();
    const isHiddenBySetting = settingsContext?.settings?.hideLevelBadge;

    const shouldShowTag = level !== undefined && showLevelTag && !isHiddenBySetting;

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            <div className={`relative p-0.5 rounded-full w-full h-full ${frame.effects || ''} ${frameId === 'none' ? '' : 'overflow-visible'}`}>
                
                {/* Advanced Frame CSS Layer */}
                {frameId !== 'none' && (
                    <div className={`absolute inset-0 z-0 rounded-full ${frame.css} w-full h-full flex items-center justify-center`}>
                       <div className="absolute inset-0.5 bg-black rounded-full z-10" />
                    </div>
                )}
                
                {/* Content Layer (Avatar) */}
                <div className="relative z-20 w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {children}
                </div>
            </div>

            {/* Ultra-Small & Sleek Level Badge (Bottom Center) */}
            {shouldShowTag && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-none">
                    <UserLevelPyramidBadge level={level} className="w-[14px] h-[14px]" />
                </div>
            )}
        </div>
    );
}
