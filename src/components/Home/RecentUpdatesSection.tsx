"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Zap, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimeCard from '@/components/Anime/AnimeCard';
import HindiAnimeCard from '@/components/Anime/HindiAnimeCard'; 
import { AnimeService } from '@/lib/api';
import Link from 'next/link';

// Cache Interface
interface CacheData {
    [key: string]: {
        data: any[];
        timestamp: number;
    }
}

const CACHE_DURATION = 30000; // 30 Seconds Cache

export default function RecentUpdatesSection({ initialData }: { initialData: any[] }) {
    const [filter, setFilter] = useState('all');
    const [data, setData] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    // Smart Cache Ref
    const cache = useRef<CacheData>({});

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'sub', label: 'Sub' },
        { id: 'dub', label: 'Dub' },
        { id: 'hindi', label: 'Hindi' }
    ];

    // 1. PERSISTENCE LOGIC
    useEffect(() => {
        setIsMounted(true);
        const savedFilter = localStorage.getItem('shadow_recent_filter');
        if (savedFilter && ['all', 'sub', 'dub', 'hindi'].includes(savedFilter)) {
            setFilter(savedFilter);
        }
    }, []);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        localStorage.setItem('shadow_recent_filter', newFilter);
    };

    // 2. DATA FETCHING LOGIC
    useEffect(() => {
        if (!isMounted) return;

        const fetchTacticalData = async () => {
            // ✅ CRITICAL FIX: If 'all', use initialData immediately. 
            // Do NOT fetch. Do NOT wait. Just restore the server data.
            if (filter === 'all') {
                setData(initialData || []);
                return;
            }

            // Check Cache for other tabs
            const cached = cache.current[filter];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                setData(cached.data);
                return;
            }

            setLoading(true);
            try {
                let results: any[] = [];
                switch (filter) {
                    // 'all' case removed from here because it's handled above
                    case 'sub': results = await AnimeService.getSubbedAnime(1); break;
                    case 'dub': results = await AnimeService.getDubbedAnime(1); break;
                    case 'hindi': results = await AnimeService.getHindiRecent(); break;
                }

                // IMAGE RECONSTRUCTION & "00" FIX
                const sanitizedResults = results.map(anime => {
                    let rawUrl: string = anime.poster || anime.image || "";
                    let finalUrl = rawUrl;

                    if (rawUrl.includes('image.tmdb.org')) {
                        const match = rawUrl.match(/\/t\/p\/.*/);
                        if (match) finalUrl = `https://image.tmdb.org${match[0]}`;
                    } else if (rawUrl.includes('watchanimeworld')) {
                        finalUrl = rawUrl.replace(/([^:]\/)\/+/g, "$1");
                    }
                    if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
                    const proxiedUrl = finalUrl ? `/api/proxy?url=${encodeURIComponent(finalUrl)}` : "/images/placeholder.jpg";

                    // Fix 0/00 issue by ensuring falsy/0 becomes null
                    const rawSub = (typeof anime.episodes === 'object' ? anime.episodes.sub : anime.sub) || 0;
                    const rawDub = (typeof anime.episodes === 'object' ? anime.episodes.dub : anime.dub) || 0;

                    return {
                        ...anime,
                        poster: proxiedUrl,
                        image: proxiedUrl,
                        episodes: {
                            sub: rawSub > 0 ? rawSub : null,
                            dub: rawDub > 0 ? rawDub : null
                        },
                        // Top level fallback for Card component
                        sub: rawSub > 0 ? rawSub : null,
                        dub: rawDub > 0 ? rawDub : null
                    };
                });

                const finalData = Array.isArray(sanitizedResults) ? sanitizedResults : [];
                setData(finalData);
                // Cache the result
                cache.current[filter] = { data: finalData, timestamp: Date.now() };

            } catch (error) {
                console.error("Link Severed:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTacticalData();
    }, [filter, isMounted, initialData]); // Added initialData to deps

    return (
        <section className="w-full relative z-10 animate-in fade-in duration-700 mt-12 mb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
            
            {/* --- HEADER (MATCHING EXACTLY WITH CONTINUE ADVENTURE) --- */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 relative">
                
                {/* Left: Title & Icon */}
                <div className="flex items-center gap-3 self-start md:self-auto z-10">
                    <div className="p-2 bg-red-600/10 rounded-xl border border-red-500/20 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-red-500" />
                    </div>
                     {/* Gradient Title */}
                        <h2 className="text-lg font-black tracking-[0.2em] uppercase font-sans drop-shadow-md bg-gradient-to-r from-red-500 via-violet-500 to-violet-600 bg-clip-text text-transparent">
                            Recent Updates
                        </h2>
                    
                </div>

                {/* Center: Toggles (Absolute Center) */}
                <div className="md:absolute md:left-1/2 md:-translate-x-1/2 z-10 w-full md:w-auto">
                    <div className="flex items-center justify-center p-1 rounded-full bg-[#0a0a0a] border border-white/10 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                disabled={loading}
                                onClick={() => handleFilterChange(f.id)}
                                className={cn(
                                    "flex-1 md:flex-none px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 whitespace-nowrap",
                                    filter === f.id 
                                        ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/20" 
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: View All */}
                <div className="z-10 self-end md:self-auto">
                    <Link 
                        href="/catalog" 
                        className="group flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        View All
                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* --- GRID CONTENT --- */}
            {loading ? (
                <div className="h-[400px] w-full flex flex-col items-center justify-center gap-4 rounded-[32px] border border-white/5 bg-white/5">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] animate-pulse">Syncing Intel...</p>
                </div>
            ) : data.length > 0 ? (
                // RESTORED GRID: lg:grid-cols-6 and sm:gap-6
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {data.slice(0, 12).map((anime, idx) => (
                        <div 
                            key={`${anime.id}-${idx}`}
                            // RESTORED WRAPPER: z-10, scale-[1.03], hover:z-50
                            className="group relative z-10 transition-all duration-300 hover:scale-[1.03] hover:z-50"
                        >
                            {filter === 'hindi' ? (
                                <HindiAnimeCard anime={anime} />
                            ) : (
                                <AnimeCard anime={anime} />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center rounded-[32px] border border-white/5 bg-white/5 backdrop-blur-md">
                    <Zap className="w-12 h-12 text-zinc-700 mb-4 opacity-50" />
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">No active intel found</p>
                </div>
            )}
            
            <div className="absolute -bottom-20 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
        </section>
    );
}