"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Zap, Radio, Loader2, ChevronDown, Layers, Captions, Mic, Shapes, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, slugifyTitle } from '@/lib/utils';
import AnimeCard from '@/components/Anime/AnimeCard';
import HindiAnimeCard from '@/components/Anime/HindiAnimeCard'; 
import { AnimeService } from '@/lib/api';
import { hpi } from '@/lib/hpi'; 
import { dpi } from '@/lib/dpi';
import Link from 'next/link';
import { SimpleGridSkeleton } from '@/components/UIx/SkeletonLoaders';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import { playGummyTap } from '@/lib/audioManager';

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

const FILTER_OPTIONS = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'sub', label: 'Subbed', icon: Captions },
    { id: 'dub', label: 'Eng Dub', icon: Mic },
    { id: 'hindi', label: 'Hindi Dub', icon: Radio },
    { id: 'chinese', label: 'Chinese', icon: Shapes },
] as const;

type FilterType = typeof FILTER_OPTIONS[number]['id'];

export default function RecentUpdatesSection({ initialData }: { initialData: any[] }) {
    const [data, setData] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<FilterType>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const filterRef = useRef<HTMLDivElement>(null);
    const cache = useRef<CacheData>({});

    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsMounted(true);
        if (initialData && initialData.length > 0) {
            cache.current['all_1'] = { data: initialData, timestamp: Date.now() };
        }
    }, [initialData]);

    const handlePageChange = (newPage: number) => {
        if (newPage === page || newPage < 1) return;
        const cacheKey = `${filter}_${newPage}`;
        const cached = cache.current[cacheKey];
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            setData(cached.data);
            setLoading(false);
        } else {
            setLoading(true);
        }
        setPage(newPage);
    };

    const handleFilterSelect = (newFilter: FilterType) => {
        if (newFilter === filter) {
            setIsFilterOpen(false);
            return;
        }
        playGummyTap();
        setFilter(newFilter);
        setPage(1);
        setIsFilterOpen(false);
    };

    useEffect(() => {
        if (!isMounted) return;

        const fetchTacticalData = async () => {
            const cacheKey = `${filter}_${page}`;
            const cached = cache.current[cacheKey];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                setData(cached.data);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                if (filter === 'all') {
                    // Parallel sync across all 4 realms: Sub, English Dub, Hindi, and Chinese Donghua
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

                    const finalResults = blendUnifiedFeeds(cleanSub, cleanDub, cleanHindi, cleanDonghua);

                    setData(finalResults);
                    cache.current[cacheKey] = { data: finalResults, timestamp: Date.now() };
                } else if (filter === 'sub') {
                    const res = await AnimeService.getSubbedAnime(page);
                    const items = (Array.isArray(res) ? res : []).map(i => sanitizeCard(i, 'sub'));
                    setData(items);
                    cache.current[cacheKey] = { data: items, timestamp: Date.now() };
                } else if (filter === 'dub') {
                    const res = await AnimeService.getDubbedAnime(page);
                    const items = (Array.isArray(res) ? res : []).map(i => sanitizeCard(i, 'english'));
                    setData(items);
                    cache.current[cacheKey] = { data: items, timestamp: Date.now() };
                } else if (filter === 'hindi') {
                    const res = await fetch(`/api/blakite/latest?page=${page}`).then(r => r.json()).then(d => d?.results || d?.data?.results || []).catch(() => []);
                    const items = (Array.isArray(res) ? res : []).map(i => sanitizeCard(i, 'hindi'));
                    setData(items);
                    cache.current[cacheKey] = { data: items, timestamp: Date.now() };
                } else if (filter === 'chinese') {
                    const res = await AnimeService.getDonghua(page);
                    const items = (Array.isArray(res) ? res : []).map(i => sanitizeCard(i, 'chinese'));
                    setData(items);
                    cache.current[cacheKey] = { data: items, timestamp: Date.now() };
                }
            } catch (error) {
                console.error("Tactical connection severed:", error);
                setData(page === 1 ? (initialData || []) : []);
            } finally {
                setLoading(false);
            }
        };

        fetchTacticalData();
    }, [page, filter, isMounted, initialData]);

    return (
        <section className="w-full relative z-10 animate-in fade-in duration-700 mt-2 md:mt-8 mb-6 md:mb-12">
            
            {/* --- HEADER (Clean, Professional Responsive Two-Row on Mobile) --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
                {/* Row 1: Title (left) & Mobile View All Button (right) */}
                <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3 w-full md:w-auto min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <MonetLineIcon icon={Zap} variant="primary" />
                        <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon tracking-wide uppercase leading-none truncate whitespace-nowrap">
                            RECENT UPDATES
                        </h2>
                    </div>

                    {/* Mobile Only: Symmetrical View All Button */}
                    <Link 
                        href="/explore?category=recent"
                        onClick={() => playGummyTap()}
                        className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
                    >
                        <span>View All</span>
                        <ChevronRight size={11} className="text-primary-400" />
                    </Link>
                </div>

                {/* Row 2 on Mobile (Filter on Left + Page Switcher on Right) / Right Controls on Desktop */}
                <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
                    {/* Containerless Dropdown Filter Button with Jelly Animation (Left on Row 2) */}
                    <div ref={filterRef} className="relative shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                playGummyTap();
                                setIsFilterOpen(!isFilterOpen);
                            }}
                            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider select-none py-1 group active:scale-95"
                            aria-label="Filter Releases"
                        >
                            {React.createElement(FILTER_OPTIONS.find(f => f.id === filter)?.icon || Layers, {
                                size: 13,
                                className: "text-primary-400 group-hover:scale-110 transition-transform"
                            })}
                            <span className="text-zinc-200 group-hover:text-white">
                                {FILTER_OPTIONS.find(f => f.id === filter)?.label || 'All'}
                            </span>
                            <ChevronDown 
                                size={12} 
                                className={cn("text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200", isFilterOpen && "rotate-180")} 
                            />
                        </motion.button>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.88, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                    transition={{ type: "spring", stiffness: 450, damping: 22 }}
                                    className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 min-w-[145px] p-1.5 rounded-2xl bg-[#090e1a]/95 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-0.5"
                                >
                                    {FILTER_OPTIONS.map(opt => {
                                        const Icon = opt.icon;
                                        const isSelected = filter === opt.id;
                                        return (
                                            <motion.button
                                                key={opt.id}
                                                whileTap={{ scale: 0.94 }}
                                                onClick={() => handleFilterSelect(opt.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                                                    isSelected
                                                        ? "bg-primary-600/20 text-primary-400 border border-primary-500/30"
                                                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon size={13} className={isSelected ? "text-primary-400" : "text-zinc-500"} />
                                                    <span>{opt.label}</span>
                                                </div>
                                                {isSelected && <BadgeCheck size={13} className="text-primary-400" />}
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cute < page number > Switcher in Header */}
                    <CutePageSwitcher
                        page={page}
                        loading={loading}
                        canPrev={page > 1 && !loading}
                        canNext={!loading && data.length >= 12}
                        onPageChange={handlePageChange}
                        variant="purple"
                        className="flex-1 md:flex-initial justify-between md:justify-center"
                    />

                    {/* Desktop Only: View All Link */}
                    <Link 
                        href="/explore?category=recent"
                        onClick={() => playGummyTap()}
                        className="group flex-shrink-0 hidden md:inline-flex items-center gap-1 text-[11px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-wider whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-primary-500/30 active:scale-95"
                    >
                        <span>View All</span>
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform text-primary-500" />
                    </Link>
                </div>
            </div>

            {/* --- GRID CONTENT WITH CONTINUOUS CARD SCROLL --- */}
            <CylinderPageSlider
                page={page}
                loading={loading}
                skeletonCount={24}
                gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-6 relative perf-contain"
            >
                {data.length > 0 ? (
                    data.slice(0, 24).map((anime, idx) => (
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
                    ))
                ) : (
                    <div className="col-span-full h-48 md:h-64 flex flex-col items-center justify-center rounded-[24px] md:rounded-[32px] border border-white/5 bg-white/5 backdrop-blur-md">
                        <Zap className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mb-4 opacity-50" />
                        <p className="text-zinc-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">No active intel found</p>
                    </div>
                )}
            </CylinderPageSlider>
            
            {/* --- BOTTOM CENTERED PAGE SWITCHER --- */}
            <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
                <CutePageSwitcher
                    page={page}
                    loading={loading}
                    canPrev={page > 1 && !loading}
                    canNext={!loading && data.length >= 12}
                    onPageChange={handlePageChange}
                    variant="rose"
                />
            </div>
        </section>
    );
}