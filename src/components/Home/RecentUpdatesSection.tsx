"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimeCard from '@/components/Anime/AnimeCard';
import { AnimeService } from '@/lib/api';

export default function RecentUpdatesSection({ initialData }: { initialData: any[] }) {
    const [filter, setFilter] = useState('all');
    const [data, setData] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(false);

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'sub', label: 'Sub' },
        { id: 'dub', label: 'Dub' },
        { id: 'hindi', label: 'Hindi' }
    ];

    useEffect(() => {
        const fetchTacticalData = async () => {
            if (filter === 'all' && initialData && data === initialData) return;

            setLoading(true);
            try {
                let results: any[] = [];
                switch (filter) {
                    case 'all': results = await AnimeService.getUniversalRecent(); break;
                    case 'sub': results = await AnimeService.getSubbedAnime(1); break;
                    case 'dub': results = await AnimeService.getDubbedAnime(1); break;
                    case 'hindi': results = await AnimeService.getHindiRecent(); break;
                }

                // ✅ ULTIMATE IMAGE RECONSTRUCTION PROTOCOL
                const sanitizedResults = results.map(anime => {
                    let rawUrl: string = anime.poster || anime.image || "";
                    let finalUrl = rawUrl;

                    if (rawUrl.includes('image.tmdb.org')) {
                        const match = rawUrl.match(/\/t\/p\/.*/);
                        if (match) {
                            finalUrl = `https://image.tmdb.org${match[0]}`;
                        }
                    } else if (rawUrl.includes('watchanimeworld')) {
                        finalUrl = rawUrl.replace(/([^:]\/)\/+/g, "$1");
                    }

                    if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
                    
                    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`;

                    return {
                        ...anime,
                        poster: proxiedUrl,
                        image: proxiedUrl 
                    };
                });

                setData(Array.isArray(sanitizedResults) ? sanitizedResults : []);
            } catch (error) {
                console.error("Shadow Garden Link Severed:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTacticalData();
    }, [filter]);

    return (
        <section className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Control Cluster */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-red-600 to-violet-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            Recent <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-violet-400">Updates</span>
                        </h2>
                        <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">Intelligence Feed</span>
                    </div>
                </div>

                {/* Filter Hub */}
                <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl w-fit self-center md:self-auto">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            disabled={loading}
                            onClick={() => setFilter(f.id)}
                            className={cn(
                                "px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50",
                                filter === f.id 
                                    ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" 
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-red-950/30 backdrop-blur-md border border-red-500/20 text-red-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95 group">
                    View All <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Tactical Grid */}
            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] animate-pulse">Filtering Intelligence...</p>
                </div>
            ) : data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                    {data.slice(0, 12).map((anime) => (
                        <div 
                            key={anime.id} 
                            // ✅ TACTICAL STACKING FIX: 
                            // 1. relative: allows z-index to work
                            // 2. z-10: default level
                            // 3. hover:z-50: Forces this card and its children (QTip) to the top of the stack
                            className="relative z-10 transition-all duration-300 hover:scale-[1.03] hover:z-50"
                        >
                            <AnimeCard anime={anime} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">No active intel found</p>
                </div>
            )}
        </section>
    );
}