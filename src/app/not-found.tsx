"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Ghost, ShieldAlert } from 'lucide-react';
import { demoness, hunters } from '@/lib/fonts'; // Your custom fonts

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="relative min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden font-sans text-white selection:bg-primary-900/30">
            
            {/* --- Background Ambience --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Red Glow Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[4s]" />
                {/* Subtle Grid (Optional) */}
                <div 
                    className="absolute inset-0 opacity-[0.03]" 
                    style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="relative z-10 flex flex-col items-center text-center p-6"
            >
                {/* --- Animated Icon --- */}
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative mb-8"
                >
                     <div className="absolute inset-0 bg-primary-600/20 blur-3xl rounded-full" />
                     
                     {/* Glitch Effect Ghost */}
                     <div className="relative">
                        <Ghost size={100} className="text-zinc-800 absolute top-0 left-0 blur-sm translate-x-1 animate-pulse" />
                        <Ghost size={100} className="text-primary-600 relative z-10 drop-shadow-[0_0_25px_rgba(220,38,38,0.5)]" />
                     </div>
                </motion.div>

                {/* --- 404 Text --- */}
                <h1 className={`${demoness.className} text-[10rem] md:text-[12rem] leading-[0.8] text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 tracking-tighter drop-shadow-2xl select-none`}>
                    404
                </h1>

                {/* --- Text Content --- */}
                <div className="space-y-4 max-w-lg mx-auto mt-6">
                    <div className="flex items-center justify-center gap-3 text-primary-500/80">
                        <ShieldAlert size={14} />
                        <h2 className={`${hunters.className} text-xl md:text-2xl tracking-[0.2em] uppercase text-primary-500`}>
                            Signal Severed
                        </h2>
                        <ShieldAlert size={14} />
                    </div>
                    
                    <p className="text-zinc-500 text-sm md:text-base leading-relaxed font-medium">
                        The coordinates you seek do not exist within the Shadow Garden archives. 
                        This sector is void of intelligence.
                    </p>
                </div>

                {/* --- Action Button --- */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="mt-12 group relative flex items-center gap-3 px-10 py-4 rounded-full bg-white/5 border border-white/5 hover:border-primary-500/30 hover:bg-primary-900/10 transition-all duration-500 shadow-lg hover:shadow-primary-900/20"
                >
                    <ArrowLeft size={16} className="text-zinc-400 group-hover:text-primary-400 transition-colors group-hover:-translate-x-1 duration-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-white transition-colors">
                        Return to Base
                    </span>
                    
                    {/* Button Glow Effect */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)] pointer-events-none" />
                </motion.button>
            </motion.div>

            {/* --- Footer Decoration --- */}
            <div className="absolute bottom-8 left-0 right-0 text-center opacity-20 pointer-events-none">
                <span className={`${demoness.className} text-xl text-zinc-500 tracking-widest`}>
                    SHADOW GARDEN
                </span>
            </div>
        </div>
    );
}