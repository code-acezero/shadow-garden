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
    starter: { css: 'bg-gradient-to-br from-zinc-400 to-zinc-600', effects: null },
    crimson: { css: 'bg-gradient-to-tr from-red-600 via-red-500 to-red-900 animate-pulse', effects: 'shadow-[0_0_15px_rgba(220,38,38,0.5)]' },
    sapphire: { css: 'bg-gradient-to-bl from-blue-400 via-blue-600 to-indigo-800', effects: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
    emerald: { css: 'bg-gradient-to-tr from-emerald-400 via-green-500 to-green-800', effects: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
    golden: { css: 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 animate-[spin_4s_linear_infinite]', effects: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]' },
    shadow: { css: 'bg-gradient-to-b from-violet-600 via-black to-purple-900', effects: 'shadow-[0_0_25px_rgba(139,92,246,0.6)] animate-pulse' },
    celestial: { css: 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 animate-[spin_3s_linear_infinite]', effects: 'shadow-[0_0_30px_rgba(236,72,153,0.7)]' },
    divine: { css: 'bg-gradient-to-tr from-pink-400 via-yellow-400 to-red-500 animate-[spin_2s_linear_infinite]', effects: 'shadow-[0_0_40px_rgba(244,63,94,0.8)]' },
};

export default function FantasyFrame({ frameId = 'none', level, showLevelTag = true, children, className = '' }: FantasyFrameProps) {
    const frame = FRAMES[frameId as keyof typeof FRAMES] || FRAMES.none;

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            <div className={`relative p-1 rounded-full ${frame.effects || ''} ${frameId === 'none' ? '' : 'overflow-hidden'}`}>
                {/* Rotating/Animated background layer */}
                {frameId !== 'none' && (
                    <div className={`absolute inset-0 z-0 ${frame.css} w-[150%] h-[150%] -top-1/4 -left-1/4 rounded-full`} />
                )}
                
                {/* Content Layer */}
                <div className="relative z-10 w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {children}
                </div>
            </div>

            {/* Level Tag (Fantasy Style) */}
            {level !== undefined && showLevelTag && (
                <div className="absolute -bottom-2 z-20 flex items-center justify-center">
                    <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-white/20 px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 min-w-[3rem] justify-center">
                        <Star size={8} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-white">{level}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
