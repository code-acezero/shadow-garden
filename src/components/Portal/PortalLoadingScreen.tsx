"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Terminal } from 'lucide-react';

interface Props {
    progress: number;
}

export default function PortalLoadingScreen({ progress }: Props) {
    // Force clamp to ensure it never exceeds limits but hits 100 cleanly
    const safeProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black text-primary-600 z-[200]">
            {/* LOGO */}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8 relative"
            >
                <div className="absolute inset-0 bg-primary-600/20 blur-xl rounded-full" />
                <ShieldAlert className="w-16 h-16 relative z-10 text-primary-500" />
            </motion.div>

            {/* TITLE */}
            <h2 
                className="text-4xl md:text-5xl mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-primary-500 to-primary-900 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                style={{ fontFamily: 'var(--font-demoness), serif' }}
            >
                SHADOW GARDEN
            </h2>

            {/* STATUS TEXT */}
            <div className="flex items-center gap-2 mb-8 opacity-70">
                <Terminal className="w-4 h-4" />
                <span 
                    className="text-sm tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-nyctophobia), monospace' }}
                >
                    System Initialization... {Math.round(safeProgress)}%
                </span>
            </div>

            {/* BAR CONTAINER */}
            <div className="relative w-64 md:w-96 h-2 bg-[#1a0505] rounded-full overflow-hidden border border-primary-900/30 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                {/* FILL BAR */}
                <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-900 via-primary-600 to-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${safeProgress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
                
                {/* GLOW HEAD */}
                <motion.div 
                    className="absolute top-0 h-full w-2 bg-white blur-[2px] z-10"
                    style={{ left: `${safeProgress}%`, x: '-100%' }}
                />
            </div>

            {/* BOTTOM TEXT */}
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: safeProgress > 80 ? 1 : 0 }}
                className="mt-4 text-[10px] text-primary-900/60 font-mono tracking-widest"
            >
                ESTABLISHING NEURAL LINK
            </motion.p>
        </div>
    );
}