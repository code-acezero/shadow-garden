"use client";

import React from 'react';
import { Play } from 'lucide-react';
import Link from 'next/link';

export default function HindiAnimeCard({ anime }: { anime: any }) {
    // Tactical URL Cleaner for Hindi posters
    const cleanPoster = anime.poster ? anime.poster.replace(/([^:]\/)\/+/g, "$1") : "/placeholder.png";

    return (
        <Link href={`/watch/${anime.id}`} className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/20 shadow-xl transition-all duration-500 hover:border-red-500/30">
            {/* Full Poster Backdrop */}
            <img 
                src={cleanPoster} 
                alt={anime.title}
                className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                }}
            />

            {/* Bottom Fade Blend Container */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-[35%] z-10 pointer-events-none bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-[4px]"
                style={{
                    maskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent 100%)'
                }}
            />

            {/* HUD Content Stack */}
            <div className="absolute bottom-3 left-0 right-0 px-3 z-20 pointer-events-none flex flex-col gap-1.5">
                {/* Horizontal Type Capsule */}
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-950/70 border border-red-500/30 w-fit">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] font-black text-red-200 uppercase tracking-widest italic">
                        {anime.type || "HINDI"}
                    </span>
                </div>

                {/* Mission Title */}
                <h3 className="text-[11px] font-black text-white uppercase tracking-tighter truncate drop-shadow-md leading-none">
                    {anime.title}
                </h3>
            </div>

            {/* Hover Play State */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-40">
                <div className="bg-red-600 p-2.5 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.4)] transform scale-50 group-hover:scale-100 transition-transform duration-500">
                    <Play size={18} className="fill-white text-white ml-0.5" />
                </div>
            </div>
        </Link>
    );
}