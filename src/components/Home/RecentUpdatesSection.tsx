"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Zap, Radio, Loader2 } from 'lucide-react';
import { cn, slugifyTitle } from '@/lib/utils';
import AnimeCard from '@/components/Anime/AnimeCard';
import HindiAnimeCard from '@/components/Anime/HindiAnimeCard'; 
import { AnimeService } from '@/lib/api';
import { hpi } from '@/lib/hpi'; 
import { dpi } from '@/lib/dpi';
import Link from 'next/link';
import { SimpleGridSkeleton } from '@/components/UIx/SkeletonLoaders';

interface CacheData {
    [key: string]: {
        data: any[];
        timestamp: number;
    }
}

const CACHE_DURATION = 60000; // 1 min

function sanitizeCard(item: any, category: 'sub' | 'english' | 'hindi' | 'chinese') {
    let rawUrl: string = item.poster || item.image || "";
    let finalUrl = rawUrl;
    
    if (rawUrl.includes('image.tmdb.org')) {
        const match = rawUrl.match(/\/t\/p\/.*/);
        if (match) finalUrl = `https://image.tmdb.org${match[0]}`;
    } else if (rawUrl.includes('watchanimeworld')) {
        finalUrl = rawUrl.replace(/([^:]\/)\/+/g, "$1");
    }
    
    if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
    const proxiedUrl = finalUrl ? `/api/proxy?url=${encodeURIComponent(finalUrl)}` : "/images/no-poster.png";

    const safeEpisodes = item.episodes || {};
    const rawSub = (typeof safeEpisodes === 'object' && safeEpisodes !== null ? safeEpisodes.sub : item.sub) || 0;
    const rawDub = (typeof safeEpisodes === 'object' && safeEpisodes !== null ? safeEpisodes.dub : item.dub) || 0;
    const rawTotal = item.totalEpisodes || (typeof safeEpisodes === 'object' && safeEpisodes !== null ? (safeEpisodes.total || safeEpisodes.eps) : 0) || 0;

    let epValue = item.episode;
    if (typeof epValue === 'object' && epValue !== null) {
        epValue = epValue.total || epValue.sub || epValue.dub || 0;
    }
    if (typeof epValue === 'string') {
        const match = epValue.match(/\d+/);
        epValue = match ? parseInt(match[0], 10) : 0;
    }

    const id = item.id || item.slug || '';
    const slug = slugifyTitle(item.title || item.name);
    const routeId = (slug && !String(id).includes('-')) ? `${id}-${slug}` : id;

    let targetRoute = item.targetRoute || '';
    if (!targetRoute) {
        if (category === 'hindi') {
            targetRoute = `/watch/${routeId}?audio=hi`;
        } else if (category === 'chinese') {
            targetRoute = `/donghua-watch/${id}`;
        } else if (category === 'english') {
            const ep = rawDub || epValue || 1;
            targetRoute = `/watch/${routeId}?ep=${ep}&type=dub`;
        } else {
            const ep = rawSub || epValue || 1;
            targetRoute = `/watch/${routeId}?ep=${ep}&type=sub`;
        }
    } else if (slug && targetRoute.startsWith('/watch/') && !targetRoute.includes('-')) {
        targetRoute = targetRoute.replace(/^\/watch\/([^?&#]+)/, (_: string, rawId: string) => `/watch/${rawId}-${slug}`);
    }

    let timestamp = 0;
    if (item.airingAt) {
        timestamp = item.airingAt * 1000;
    } else if (item.dateToUse) {
        timestamp = item.dateToUse;
    } else if (item.updatedAt || item.createdAt || item.date) {
        timestamp = new Date(item.updatedAt || item.createdAt || item.date).getTime();
    }
    if (isNaN(timestamp) || timestamp <= 0) {
        timestamp = Date.now();
    }

    const isHindiItem = category === 'hindi' || item.isHindi === true || (typeof item.title === 'string' && /hindi/i.test(item.title));
    const finalDubCount = rawDub > 0 ? rawDub : (isHindiItem ? (epValue || rawTotal || 1) : (category === 'english' ? (epValue || 1) : null));

    let displayTitle = item.title || item.name || 'Unknown Title';
    if (isHindiItem && !/hindi/i.test(displayTitle)) {
        displayTitle = `${displayTitle} (Hindi Dub)`;
    }

    return {
        ...item,
        id,
        title: displayTitle,
        dataId: item.dataId || id || null,
        poster: proxiedUrl,
        image: proxiedUrl,
        rating: item.rating || null,
        score: item.score || item.rating || null,
        isAdult: item.isAdult || item.nsfw || false,
        episodes: {
            sub: isHindiItem ? null : (category === 'english' ? null : (rawSub > 0 ? rawSub : epValue || null)),
            dub: finalDubCount,
            total: rawTotal || epValue || null
        },
        sub: isHindiItem ? null : (rawSub > 0 ? rawSub : epValue || null),
        dub: finalDubCount,
        episode: epValue || rawTotal || 1,
        totalEpisodes: rawTotal || epValue || null,
        category,
        isHindi: isHindiItem,
        isDonghua: category === 'chinese',
        isDub: category === 'english',
        targetRoute,
        timestamp
    };
}

function blendUnifiedFeeds(
    subList: any[],
    dubList: any[],
    hindiList: any[],
    donghuaList: any[]
): any[] {
    const s = [...subList];
    const d = [...dubList];
    const h = [...hindiList];
    const c = [...donghuaList];

    const blended: any[] = [];
    const seenIds = new Set<string>();

    const pushUnique = (item: any) => {
        if (!item) return;
        const key = `${item.category}-${item.id}`;
        if (!seenIds.has(key)) {
            seenIds.add(key);
            blended.push(item);
        }
    };

    // Perfectly blended interleave pattern: 2 Sub, 1 English Dub, 1 Hindi, 1 Donghua...
    const maxLen = Math.max(s.length, d.length, h.length, c.length);
    for (let i = 0; i < maxLen; i++) {
        if (s.length > 0) pushUnique(s.shift());
        if (d.length > 0) pushUnique(d.shift());
        if (s.length > 0) pushUnique(s.shift());
        if (h.length > 0) pushUnique(h.shift());
        if (c.length > 0) pushUnique(c.shift());
    }

    return blended.slice(0, 30);
}

export default function RecentUpdatesSection({ initialData }: { initialData: any[] }) {
    const [filter, setFilter] = useState<'all' | 'sub' | 'english' | 'hindi' | 'chinese'>('all');
    const [data, setData] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    const cache = useRef<CacheData>({});

    const filters = [
        { id: 'all' as const, label: 'All' },
        { id: 'sub' as const, label: 'Sub' },
        { id: 'english' as const, label: 'English' },
        { id: 'hindi' as const, label: 'Hindi' },
        { id: 'chinese' as const, label: 'Chinese' }
    ];

    const [page, setPage] = useState(1);

    useEffect(() => {
        setIsMounted(true);
        const savedFilter = localStorage.getItem('shadow_recent_filter');
        if (savedFilter && ['all', 'sub', 'english', 'hindi', 'chinese'].includes(savedFilter)) {
            setFilter(savedFilter as any);
        } else if (savedFilter === 'dub') {
            setFilter('english');
        } else if (savedFilter === 'donghua') {
            setFilter('chinese');
        }
    }, []);

    const handleFilterChange = (newFilter: 'all' | 'sub' | 'english' | 'hindi' | 'chinese') => {
        setFilter(newFilter);
        setPage(1);
        localStorage.setItem('shadow_recent_filter', newFilter);
    };

    useEffect(() => {
        if (!isMounted) return;

        const fetchTacticalData = async () => {
            const cacheKey = `${filter}_${page}`;
            const cached = cache.current[cacheKey];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                setData(cached.data);
                return;
            }

            setLoading(true);

            try {
                let finalResults: any[] = [];

                if (filter === 'all') {
                    // Parallel sync across all 4 realms: Sub, English, Hindi, Chinese
                    const [subRes, dubRes, hindiRes, donghuaRes] = await Promise.allSettled([
                        AnimeService.getSubbedAnime(page),
                        AnimeService.getDubbedAnime(page),
                        fetch(`/api/blakite/latest?page=${page}`).then(r => r.json()).then(d => d?.results || d?.data?.results || []).catch(() => []),
                        AnimeService.getDonghua(page)
                    ]);

                    const rawSub = subRes.status === 'fulfilled' && Array.isArray(subRes.value) ? subRes.value : (page === 1 ? (initialData || []) : []);
                    const rawDub = dubRes.status === 'fulfilled' && Array.isArray(dubRes.value) ? dubRes.value : [];
                    const rawHindi = hindiRes.status === 'fulfilled' && Array.isArray(hindiRes.value) ? hindiRes.value : [];
                    const rawDonghua = donghuaRes.status === 'fulfilled' && Array.isArray(donghuaRes.value) ? donghuaRes.value : [];

                    const cleanSub = rawSub.map(item => sanitizeCard(item, 'sub'));
                    const cleanDub = rawDub.map(item => sanitizeCard(item, 'english'));
                    const cleanHindi = rawHindi.map(item => sanitizeCard(item, 'hindi'));
                    const cleanDonghua = rawDonghua.map(item => sanitizeCard(item, 'chinese'));

                    finalResults = blendUnifiedFeeds(cleanSub, cleanDub, cleanHindi, cleanDonghua);

                } else if (filter === 'sub') {
                    const res = await AnimeService.getSubbedAnime(page);
                    const list = Array.isArray(res) ? res : (page === 1 ? (initialData || []) : []);
                    finalResults = list.map(item => sanitizeCard(item, 'sub'));

                } else if (filter === 'english') {
                    const res = await AnimeService.getDubbedAnime(page);
                    const list = Array.isArray(res) ? res : [];
                    finalResults = list.map(item => sanitizeCard(item, 'english'));

                } else if (filter === 'hindi') {
                    try {
                        const hRes = await fetch(`/api/blakite/latest?page=${page}`);
                        const hData = await hRes.json();
                        const list = hData?.results || hData?.data?.results || [];
                        finalResults = list.map((item: any) => sanitizeCard(item, 'hindi'));
                    } catch (e) {
                        console.error("Hindi latest fetch failed", e);
                        finalResults = [];
                    }

                } else if (filter === 'chinese') {
                    try {
                        const list = await AnimeService.getDonghua(page);
                        finalResults = (list || []).map(item => sanitizeCard(item, 'chinese'));
                    } catch (e) {
                        console.error("Donghua fetch failed", e);
                        finalResults = [];
                    }
                }

                setData(finalResults);
                cache.current[cacheKey] = { data: finalResults, timestamp: Date.now() };

            } catch (error) {
                console.error("Tactical connection severed:", error);
                setData(page === 1 ? (initialData || []) : []);
            } finally {
                setLoading(false);
            }
        };

        fetchTacticalData();
    }, [filter, page, isMounted, initialData]);

    const getViewAllLink = () => {
        switch (filter) {
            case 'hindi': return '/search/hindi';
            case 'chinese': return '/search/donghua';
            case 'english': return '/search?language=dub';
            case 'sub': return '/search?language=sub';
            default: return '/search?sort=recent';
        }
    };

    return (
        <section className="w-full relative z-10 animate-in fade-in duration-700 mt-2 md:mt-8 mb-6 md:mb-12">
            
            {/* --- HEADER --- */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between mb-3 md:mb-6 gap-y-3 md:gap-4 relative">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 order-1">
                    <Zap className="w-7 h-7 md:w-9 md:h-9 text-primary-500 fill-primary-500 shrink-0 drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]" />
                    <h2 className="text-xl md:text-3xl font-black text-white font-lemon tracking-wide uppercase flex items-center gap-2">
                        RECENT <span className="text-primary-500">UPDATES</span>
                    </h2>
                </div>

                {/* Filter Tabs */}
                <div className="order-3 w-full md:w-auto md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 md:z-10 flex justify-start md:justify-center">
                     <div className="flex items-center p-1 rounded-full bg-[#0a0a0a] border border-white/10 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                disabled={loading}
                                onClick={() => handleFilterChange(f.id)}
                                className={cn(
                                    "flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 whitespace-nowrap",
                                    filter === f.id 
                                        ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-900/40" 
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="order-2 md:order-3 flex items-center gap-3">
                    {/* Simple Page Number & Arrow Buttons */}
                    <span className="text-xs font-semibold text-zinc-400 select-none">
                        <span className="text-white font-bold">{page}</span>
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary-600/20 hover:border-primary-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                            aria-label="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={loading || data.length < 12}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary-600/20 hover:border-primary-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                            aria-label="Next Page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <Link 
                        href={getViewAllLink()}
                        className="group flex-shrink-0 flex items-center gap-1 text-[11px] font-black text-zinc-400 hover:text-white transition-colors uppercase tracking-wider whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-primary-500/30"
                    >
                        <span>View All</span>
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform text-primary-500" />
                    </Link>
                </div>
            </div>

            {/* --- GRID CONTENT --- */}
            {loading ? (
                <SimpleGridSkeleton />
            ) : data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 relative perf-contain">
                    {data.slice(0, 24).map((anime, idx) => (
                        <div 
                            key={`${anime.id}-${anime.category || 'all'}-${idx}`}
                            className="group relative z-10 transform-gpu will-change-transform transition-transform duration-300 hover:scale-[1.03] hover:z-50"
                        >
                            {anime.isHindi ? (
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