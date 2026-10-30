"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import PageMascot, { MascotReaction } from '@/components/Mascot/PageMascot';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';

export default function NotFound() {
    const router = useRouter();
    const [mascotPaths, setMascotPaths] = useState({
        directions: '/mascots/cat-directions.webp',
        reactions: '/mascots/cat-reactions.webp',
    });

    useEffect(() => {
        const orig = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        try {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('shadow_mascot_character');
                if (stored) {
                    const char = JSON.parse(stored);
                    if (char?.id) {
                        setMascotPaths({
                            directions: `/mascots/${char.id}-directions.webp`,
                            reactions: `/mascots/${char.id}-reactions.webp`,
                        });
                    }
                }
            }
        } catch (_) {}

        return () => {
            document.body.style.overflow = orig;
        };
    }, []);

    const handleBoop = (info: { count: number; reaction: MascotReaction | null; isDizzy: boolean }) => {
        playGummyPop();
    };

    const handleBack = () => {
        playGummyTap();
        router.back();
    };

    return (
        <div className="fixed inset-0 z-40 w-full h-[100dvh] max-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center overflow-hidden font-sans text-white selection:bg-red-900/30 select-none px-4 sm:px-6 md:px-8">
            
            {/* Soft Ambient Background Glow (Zero Containers) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[300px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
            </div>

            {/* Expansive, Widen Layout Without Box Enclosures */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl mx-auto"
            >
                {/* Kuro Pet (Interactive PageMascot) */}
                <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
                    <div 
                        onClick={() => playGummyPop()}
                        className="transform-gpu hover:scale-105 active:scale-95 transition-transform duration-300 cursor-pointer"
                        title="Tap Kuro to boop!"
                    >
                        <PageMascot
                            directions={mascotPaths.directions}
                            reactions={mascotPaths.reactions}
                            size={125}
                            onBoop={handleBoop}
                            enableSound={true}
                            className="select-none"
                        />
                    </div>
                </div>

                {/* Minimalist 404 Headline */}
                <h1 className="font-gradvis text-7xl sm:text-8xl md:text-9xl leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 tracking-tighter drop-shadow-2xl select-none">
                    404
                </h1>

                {/* Clean, Simple Typography */}
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-4 mb-2">
                    Lost in the Shadows
                </h2>

                <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                    Kuro searched through every corridor of the sanctuary, but couldn't find this page. It may have vanished or moved.
                </p>

                {/* Clean Action Buttons (No Containers, Sleek Flat Styling) */}
                <div className="flex items-center gap-3 justify-center mt-6 sm:mt-7">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="h-10 sm:h-11 px-6 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                        <ArrowLeft size={15} />
                        <span>Go Back</span>
                    </button>

                    <Link
                        href="/home"
                        onClick={() => playGummyTap()}
                        className="h-10 sm:h-11 px-6 rounded-xl bg-[#1c1c1f] hover:bg-[#28282b] border border-white/10 active:scale-95 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Home size={15} />
                        <span>Sanctuary Home</span>
                    </Link>
                </div>
            </motion.div>

            {/* Subtle Brand Watermark */}
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center opacity-20 pointer-events-none">
                <span className="font-gradvis text-xs sm:text-sm text-zinc-500 tracking-[0.3em]">
                    KAGEMI
                </span>
            </div>
        </div>
    );
}
