"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ IMPORT SINGLETON
import { AnimeService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Clock, CheckCircle, XCircle, 
    List as ListIcon, Search, LayoutGrid, Calendar,
    Trash2, History, LogIn, AlertCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- COMPONENTS ---
import AnimeCard from '@/components/Anime/AnimeCard';
import ContinueAnimeCard from '@/components/Anime/ContinueAnimeCard';
import Footer from '@/components/Anime/Footer';
import AuthModal from '@/components/Auth/AuthModal';
import { demoness, hunters } from '@/lib/fonts';

// --- TYPES ---
interface LibraryItem {
    id: string; 
    anime_id: string;
    anime_title: string;
    anime_image: string;
    status: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';
    progress: number;
    total_episodes: number; 
    score?: number;
    updated_at: string;
}

interface ContinueWatchingRow {
    anime_id: string;
    anime_title?: string;
    episode_id: string;
    episode_number: number;
    progress: number;
    duration?: number;
    last_updated: string;
    episode_image: string;
    total_episodes: number;
    type: string;
    is_completed: boolean;
}

interface ContinueItem {
    id: string;
    anime_id: string;
    title: string;
    poster: string;
    episode: number;
    episodeId: string;
    progress: number;
    totalEpisodes: number | string;
    type: string;
    sub?: number;
    dub?: number;
    ageRating: string | null;
    isAdult: boolean;
}

// --- NOTIFICATION HELPER ---
const notifyWhisper = (message: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', { 
            detail: { id: Date.now(), type, title: "Archive Update", message } 
        }));
    }
};

// --- SKELETON / LOADING UI ---
const WatchlistSkeleton = () => (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 animate-pulse px-4 md:px-8">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/5" />
        ))}
    </div>
);

// --- MAIN CONTENT COMPONENT ---
function WatchlistContent() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [continueData, setContinueData] = useState<ContinueItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    
    const [activeTab, setActiveTab] = useState<string>('all'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('updated_at');
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const isContinueItem = (item: any): item is ContinueItem => {
        return (item as ContinueItem).poster !== undefined;
    };

    useEffect(() => {
        if (authLoading) return;
        const tabParam = searchParams.get('tab');
        if (!user) setActiveTab('continue');
        else setActiveTab(tabParam || 'all');
    }, [authLoading, user, searchParams]);

    useEffect(() => {
        const syncShadowArchives = async () => {
            if (!user) {
                // If guest, maybe load local storage data here if you implemented local sync
                // For now just stop loading
                setLoadingData(false);
                return;
            }
            try {
                // ✅ Use Shared Client
                const [libRes, contRes] = await Promise.all([
                    supabase.from('watchlist').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
                    supabase.from('user_continue_watching').select('*').eq('user_id', user.id).eq('is_completed', false).order('last_updated', { ascending: false })
                ]);

                if (libRes.data) setLibrary(libRes.data);
                
                if (contRes.data) {
                    const dbData = contRes.data as ContinueWatchingRow[];
                    const uniqueMap = new Map<string, ContinueWatchingRow>();
                    dbData.forEach((item) => {
                        if (!uniqueMap.has(item.anime_id)) uniqueMap.set(item.anime_id, item);
                    });
                    
                    const enriched = await Promise.all(Array.from(uniqueMap.values()).map(async (item) => {
                        try {
                            const info: any = await AnimeService.getAnimeInfo(item.anime_id);
                            return {
                                id: item.anime_id,
                                anime_id: item.anime_id,
                                title: info?.title?.english || info?.title?.userPreferred || item.anime_title || "Unknown",
                                poster: item.episode_image || info?.poster || "/images/no-poster.png",
                                episode: item.episode_number,
                                episodeId: item.episode_id,
                                progress: Math.min(Math.round((item.progress / (item.duration || 1440)) * 100), 100),
                                totalEpisodes: info?.totalEpisodes || item.total_episodes || "?",
                                type: info?.type || item.type || "TV",
                                ageRating: info?.ageRating || null,
                                isAdult: info?.isAdult || false
                            };
                        } catch {
                            return {
                                id: item.anime_id, anime_id: item.anime_id, title: item.anime_title || "Unknown",
                                poster: item.episode_image || "/images/no-poster.png", episode: item.episode_number,
                                episodeId: item.episode_id, progress: 0, totalEpisodes: item.total_episodes || "?", 
                                type: item.type || "TV", ageRating: null, isAdult: false
                            };
                        }
                    }));
                    setContinueData(enriched);
                }
            } finally {
                setLoadingData(false);
            }
        };
        syncShadowArchives();
    }, [user]);

    const filteredData = useMemo(() => {
        let base: (LibraryItem | ContinueItem)[] = [];
        if (activeTab === 'continue') base = continueData;
        else if (activeTab === 'all') base = library;
        else base = library.filter(i => i.status === activeTab);
        
        if (searchQuery) {
            base = base.filter((i) => {
                const title = isContinueItem(i) ? i.title : i.anime_title;
                return (title || "").toLowerCase().includes(searchQuery.toLowerCase());
            });
        }
        
        return [...base].sort((a, b) => {
            if (activeTab === 'continue') return 0;
            if (sortOption === 'title') {
                const titleA = isContinueItem(a) ? a.title : a.anime_title;
                const titleB = isContinueItem(b) ? b.title : b.anime_title;
                return (titleA || "").localeCompare(titleB || "");
            }
            const dateA = isContinueItem(a) ? 0 : new Date(a.updated_at).getTime();
            const dateB = isContinueItem(b) ? 0 : new Date(b.updated_at).getTime();
            return dateB - dateA;
        });
    }, [library, continueData, activeTab, searchQuery, sortOption]);

    const activeCount = library.filter(i => i.status === 'watching').length;

    const handleTabChange = (tabId: string) => {
        if (!user && tabId !== 'continue') {
            setIsAuthOpen(true);
            return;
        }
        setActiveTab(tabId);
        router.push(`?tab=${tabId}`, { scroll: false });
    };

    const tabs = [
        { id: 'all', label: 'All', icon: <LayoutGrid size={14} />, count: library.length },
        { id: 'watching', label: 'Active', icon: <Play size={14} />, count: activeCount },
        { id: 'plan_to_watch', label: 'Planned', icon: <Calendar size={14} />, count: library.filter(i => i.status === 'plan_to_watch').length },
        { id: 'completed', label: 'Done', icon: <CheckCircle size={14} />, count: library.filter(i => i.status === 'completed').length },
        { id: 'on_hold', label: 'Paused', icon: <Clock size={14} />, count: library.filter(i => i.status === 'on_hold').length },
        { id: 'continue', label: 'History', icon: <History size={14} />, count: continueData.length, highlight: true },
    ];

    if (authLoading) return <div className="min-h-screen bg-[#050505]" />;

    return (
        <div className="flex-1 pt-24 pb-20">
            <div className="max-w-[1440px] mx-auto w-full">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col gap-6 mb-10 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="w-full md:w-auto flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-px w-6 bg-red-600" />
                                    <span className={`text-red-600 text-[10px] tracking-[0.2em] font-bold uppercase ${hunters.className}`}>Archives</span>
                                </div>
                                <h1 className={`text-2xl md:text-5xl text-white ${demoness.className}`}>
                                    SHADOW <span className="text-red-600">LIBRARY</span>
                                </h1>
                            </div>
                            {user && (
                                <div className="md:hidden flex gap-2">
                                    <div className="bg-white/5 border border-white/5 px-2 py-1 rounded-lg flex flex-col items-center min-w-[50px]">
                                        <span className="text-[7px] text-zinc-500 uppercase font-black">Entries</span>
                                        <span className="text-sm font-black text-white">{library.length}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 px-2 py-1 rounded-lg flex flex-col items-center min-w-[50px]">
                                        <span className="text-[7px] text-zinc-500 uppercase font-black">Active</span>
                                        <span className="text-sm font-black text-white">{activeCount}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-1 items-center justify-center gap-4 w-full md:max-w-4xl">
                            {user && (
                                <div className="hidden md:flex gap-3 shrink-0">
                                    <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-center min-w-[90px]">
                                        <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest">Entries</span>
                                        <span className="text-xl font-black text-white">{library.length}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-center min-w-[90px]">
                                        <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest">Active</span>
                                        <span className="text-xl font-black text-white">{activeCount}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <Input 
                                    placeholder="Search archives..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border-white/10 pl-9 h-12 rounded-xl focus:border-red-500/50 text-white w-full" 
                                />
                            </div>

                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-[120px] md:w-[160px] bg-white/5 border-white/10 h-12 rounded-xl text-[10px] font-black uppercase">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                    <SelectItem value="updated_at">Recently Updated</SelectItem>
                                    <SelectItem value="title">Alphabetical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="sticky top-16 md:top-20 z-40 bg-[#050505]/95 backdrop-blur-xl border-y border-white/5 py-3 mb-10 w-full flex items-center justify-between px-4 md:px-8">
                    <div className="flex overflow-x-auto no-scrollbar gap-2 items-center w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0",
                                    activeTab === tab.id 
                                        ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40 scale-105" 
                                        : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-white",
                                    tab.highlight && activeTab !== tab.id && "border-red-500/30 text-red-400"
                                )}
                            >
                                {tab.icon} {tab.label} {user && <span className="opacity-40">({tab.count})</span>}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'continue' && user && continueData.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-9 w-9 ml-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                                    <Trash2 size={16} />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Wipe History?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-zinc-400 italic">Clear all continue markers permanently.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white/5 text-white border-white/10">Abort</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => {
                                        await supabase.from('user_continue_watching').delete().eq('user_id', user.id);
                                        setContinueData([]);
                                    }} className="bg-red-600">Confirm Wipe</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                {/* --- GRID --- */}
                <div className="min-h-[500px] px-4 md:px-8">
                    {loadingData ? (
                        <WatchlistSkeleton />
                    ) : filteredData.length > 0 ? (
                        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredData.map((item) => (
                                    <motion.div 
                                        key={item.id || (isContinueItem(item) ? item.anime_id : item.anime_id)} 
                                        layout 
                                        initial={{ opacity: 0, scale: 0.9 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        exit={{ opacity: 0, scale: 0.9 }} 
                                        className="w-full flex"
                                    >
                                        <div className="w-full">
                                            {isContinueItem(item) ? (
                                                <ContinueAnimeCard 
                                                    anime={item} 
                                                    onClick={(id, ep) => router.push(`/watch/${id}?ep=${ep}`)}
                                                    onRemove={() => setContinueData(d => d.filter(x => x.id !== item.id))}
                                                    variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
                                                />
                                            ) : (
                                                <AnimeCard anime={{ 
                                                    id: item.anime_id, 
                                                    title: item.anime_title, 
                                                    poster: item.anime_image, 
                                                    type: "TV", 
                                                    episodes: { sub: item.total_episodes || 0, dub: 0 }
                                                }} />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                            <AlertCircle size={48} />
                            <p className="mt-4 font-bold uppercase tracking-widest text-sm">Operation Null</p>
                        </div>
                    )}
                </div>
            </div>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={() => window.location.reload()} />
        </div>
    );
}

// --- WRAPPER PAGE WITH SUSPENSE ---
export default function WatchlistPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-red-500/30 overflow-x-hidden">
            <style jsx global>{`
                html, body { overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; }
                body::-webkit-scrollbar { display: none; }
            `}</style>
            
            <Suspense fallback={<div className="min-h-screen bg-[#050505] pt-24"><WatchlistSkeleton /></div>}>
                <WatchlistContent />
            </Suspense>

            <Footer />
        </div>
    );
}