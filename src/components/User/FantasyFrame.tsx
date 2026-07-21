import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

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

export default function FantasyFrame({ frameId = 'none', level, showLevelTag = true, children, className = '' }: FantasyFrameProps) {
    const frame = FRAMES[frameId as keyof typeof FRAMES] || FRAMES.none;

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            <div className={`relative p-1 rounded-full w-full h-full ${frame.effects || ''} ${frameId === 'none' ? '' : 'overflow-visible'}`}>
                
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

            {/* Level Tag (Fantasy Style) */}
            {level !== undefined && showLevelTag && (
                <div className="absolute -bottom-2 z-30 flex items-center justify-center">
                    <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-white/20 px-2 py-0.5 rounded-full shadow-xl flex items-center gap-1 min-w-[3rem] justify-center backdrop-blur-md">
                        <Star size={10} className="text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,1)]" />
                        <span className="text-[10px] font-black text-white">{level}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
