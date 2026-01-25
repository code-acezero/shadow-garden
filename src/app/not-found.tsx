"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ghost } from 'lucide-react';
import { demoness } from '@/lib/fonts'; // Pulling from your Font Armory

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
            {/* The Shadow Portal Visual */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full animate-pulse" />
                <Ghost size={80} className="text-red-600 relative z-10 animate-bounce" />
            </div>

            <h1 className={`${demoness.className} text-8xl md:text-9xl text-white tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]`}>
                404
            </h1>

            <div className="mt-4 space-y-2">
                <h2 className="text-xl font-black text-zinc-200 uppercase tracking-[0.3em]">
                    Signal Severed
                </h2>
                <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                    You have wandered into the forbidden sector. This intelligence does not exist within the Shadow Garden archives.
                </p>
            </div>

            {/* Tactical Retreat Button */}
            <button 
                onClick={() => router.back()}
                className="mt-12 group relative flex items-center gap-3 px-10 py-4 rounded-full bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] overflow-hidden transition-all hover:bg-red-700 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Fall Back to Safety
            </button>

            {/* Background Decorative Element */}
            <div className="fixed bottom-10 left-10 opacity-10 pointer-events-none">
                <span className={`${demoness.className} text-4xl text-white uppercase`}>
                    Shadow Garden
                </span>
            </div>
        </div>
    );
}