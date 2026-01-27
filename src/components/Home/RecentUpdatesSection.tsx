"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sparkles, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimeCard from '@/components/Anime/AnimeCard';
import HindiAnimeCard from '@/components/Anime/HindiAnimeCard'; 
import { AnimeService } from '@/lib/api';
import Link from 'next/link';

// ... (Interface & Cache setup unchanged) ...
interface CacheData {
    [key: string]: {
        data: any[];
        timestamp: number;
    }
}

const CACHE_DURATION = 30000; 

export default function RecentUpdatesSection({ initialData }: { initialData: any[] }) {
    const [filter, setFilter] = useState('all');
    const [data, setData] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    const cache = useRef<CacheData>({});

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'sub', label: 'Sub' },
        { id: 'dub', label: 'Dub' },
        { id: 'hindi', label: 'Hindi' }
    ];

    // ... (Persistence Logic unchanged) ...
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

    // ... (Data Fetching Logic unchanged - ensure map uses rating as updated before) ...
    useEffect(() => {
        if (!isMounted) return;

        const fetchTacticalData = async () => {
            const cached = cache.current[filter];
            if (filter !== 'all' && cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                setData(cached.data);
                return;
            }

            if (filter !== 'all') setLoading(true);

            try {
                let results: any[] = [];
                
                if (filter === 'all') {
                    if (data.length > 0 && data === initialData) {
                       results = initialData;
                    } else {
                       results = initialData || []; 
                    }
                } else {
                    switch (filter) {
                        case 'sub': results = await AnimeService.getSubbedAnime(1); break;
                        case 'dub': results = await AnimeService.getDubbedAnime(1); break;
                        case 'hindi': results = await AnimeService.getHindiRecent(); break;
                    }
                }

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

                    const rawSub = (typeof anime.episodes === 'object' ? anime.episodes.sub : anime.sub) || 0;
                    const rawDub = (typeof anime.episodes === 'object' ? anime.episodes.dub : anime.dub) || 0;
                    const rawTotal = anime.totalEpisodes || anime.episodes || 0;

                    let watchParams = "";
                    let targetEp = 0;

                    if (filter === 'sub') {
                        targetEp = rawSub;
                        if (targetEp > 0) watchParams = `?ep=${targetEp}&type=sub`;
                    } else if (filter === 'dub') {
                        targetEp = rawDub;
                        if (targetEp > 0) watchParams = `?ep=${targetEp}&type=dub`;
                    } else if (filter === 'hindi') {
                        targetEp = anime.episode || rawTotal || 0; 
                        if (targetEp > 0) watchParams = `?ep=${targetEp}&type=hindi`;
                    } else {
                        targetEp = rawSub || anime.episode || 0;
                        if (targetEp > 0) watchParams = `?ep=${targetEp}`;
                    }

                    const baseRoute = (filter === 'hindi' || anime.isHindi) 
                        ? `/watch2/${anime.id}` 
                        : `/watch/${anime.id}`;

                    const finalRoute = `${baseRoute}${watchParams}`;

                    return {
                        ...anime,
                        poster: proxiedUrl,
                        image: proxiedUrl,
                        rating: anime.rating || null,
                        isAdult: anime.isAdult || anime.nsfw || false, 
                        episodes: {
                            sub: rawSub > 0 ? rawSub : null,
                            dub: rawDub > 0 ? rawDub : null
                        },
                        sub: rawSub > 0 ? rawSub : null,
                        dub: rawDub > 0 ? rawDub : null,
                        targetRoute: finalRoute 
                    };
                });

                const finalData = Array.isArray(sanitizedResults) ? sanitizedResults : [];
                setData(finalData);
                
                if (filter !== 'all') cache.current[filter] = { data: finalData, timestamp: Date.now() };

            } catch (error) {
                console.error("Link Severed:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTacticalData();
    }, [filter, isMounted, initialData]);

    return (
        // ✅ UPDATED: max-w-[1440px]
        <section className="w-full relative z-10 animate-in fade-in duration-700 mt-8 mb-12 px-4 md:px-8 max-w-[1440px] mx-auto">
            
            {/* --- HEADER --- */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between mb-6 gap-y-4 md:gap-4 relative">
                
                {/* 1. LEFT: Title */}
                <div className="flex items-center gap-2 md:gap-3 min-w-0 order-1">
                    <div className="p-1.5 md:p-2 bg-red-600/10 rounded-lg md:rounded-xl border border-red-500/20 backdrop-blur-md flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                    </div>
                    <h2 className="text-sm md:text-lg font-black tracking-[0.15em] md:tracking-[0.2em] uppercase font-sans drop-shadow-md bg-gradient-to-r from-red-500 via-violet-500 to-violet-600 bg-clip-text text-transparent truncate">
                        Recent Updates
                    </h2>
                </div>

                {/* 2. CENTER (Desktop) / BOTTOM (Mobile): Filter Toggles */}
                <div className="order-3 w-full md:w-auto md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 md:z-10 flex justify-start md:justify-center">
                     <div className="flex items-center p-1 rounded-full bg-[#0a0a0a] border border-white/10 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                disabled={loading}
                                onClick={() => handleFilterChange(f.id)}
                                className={cn(
                                    "flex-1 md:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 whitespace-nowrap",
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

                {/* 3. RIGHT: View All */}
                <Link 
                    href="/catalog" 
                    className="order-2 md:order-3 group flex-shrink-0 flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap"
                >
                    View All
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* --- GRID CONTENT --- */}
            {loading ? (
                <div className="h-[300px] md:h-[400px] w-full flex flex-col items-center justify-center gap-4 rounded-[24px] md:rounded-[32px] border border-white/5 bg-white/5">
                    <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-red-600 animate-spin drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                    <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Syncing Intel...</p>
                </div>
            ) : data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {data.slice(0, 12).map((anime, idx) => (
                        <div 
                            key={`${anime.id}-${idx}`}
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
                <div className="h-48 md:h-64 flex flex-col items-center justify-center rounded-[24px] md:rounded-[32px] border border-white/5 bg-white/5 backdrop-blur-md">
                    <Zap className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mb-4 opacity-50" />
                    <p className="text-zinc-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">No active intel found</p>
                </div>
            )}
            
            <div className="absolute -bottom-20 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
        </section>
    );
}