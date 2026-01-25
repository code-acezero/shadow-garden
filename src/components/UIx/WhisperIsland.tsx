"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Loader2, Bell, Heart, MessageCircle, Zap, 
  CheckCircle, AlertOctagon, ArrowRight, Crown, Info, 
  Filter, Sparkles, Image as ImageIcon, Calendar, Tag, Tv, Layers, 
  Bot, LogIn, LogOut, LayoutGrid, Settings, User, ChevronDown, SortAsc, ArrowLeft, Dices
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAPI, supabase, AnimeService } from '@/lib/api'; 
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import localFont from 'next/font/local';

// Custom Components
import Notifications from '@/components/Anime/Notifications';
import ShadowAvatar from '@/components/User/ShadowAvatar';

// --- FONTS ---
const demoness = localFont({ 
  src: '../../../public/fonts/Demoness-1GlYj.ttf', 
  variable: '--font-demoness',
  display: 'swap' 
});

const hunters = localFont({ 
  src: '../../../public/fonts/HuntersKpop.ttf', 
  variable: '--font-hunters',
  display: 'swap' 
});

// --- CONSTANTS ---
const PLACEHOLDERS = [
  "Summon Solo Leveling...", "Find One Piece...", "Search Jujutsu Kaisen...", 
  "Discover Chainsaw Man...", "Look for Bleach...", "Explore Shadow Garden..."
];

const GENRES = ["Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Drama", "Ecchi", "Fantasy", "Game", "Harem", "Hentai", "Historical", "Horror", "Isekai", "Josei", "Kids", "Magic", "Martial Arts", "Mecha", "Military", "Music", "Mystery", "Parody", "Police", "Psychological", "Romance", "Samurai", "School", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Space", "Sports", "Super Power", "Supernatural", "Thriller", "Vampire"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const TYPES = ["tv", "movie", "ova", "ona", "special", "music"];
const STATUS = ["currently_airing", "finished_airing", "not_yet_aired"];
const YEARS = Array.from({ length: 2027 - 1990 }, (_, i) => (2027 - i).toString());

// --- TYPES ---
interface SearchResult { id: string; title: string; image: string; releaseDate?: string; type?: string; duration?: string; }
interface Notification { id: string; type: string; title: string; content: string; link?: string; actor?: { username: string; avatar_url: string }; }

// --- CUSTOM SCROLLBAR CSS ---
const scrollbarStyle = `
  .custom-scroll::-webkit-scrollbar { width: 4px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 4px; }
`;

// --- GLITCH ANIMATION VARIANTS ---
const glitchVariants = {
  initial: { opacity: 0, scale: 0.9, filter: "blur(5px)" },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: "blur(0px)",
    x: 0,
    transition: { duration: 0.2 } 
  },
  exit: { 
    opacity: 0, 
    scale: 1.1, 
    filter: "blur(5px)",
    x: [0, -5, 5, -5, 5, 0], 
    transition: { duration: 0.2 } 
  }
};

// --- CUSTOM SELECT COMPONENT ---
const CustomSelect = ({ label, icon: Icon, options, value, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="space-y-1 relative" ref={ref}>
            <label className="text-[9px] text-zinc-400 font-bold uppercase ml-1 flex items-center gap-1"><Icon size={10}/> {label}</label>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl text-xs py-2 px-3 flex items-center justify-between transition-all backdrop-blur-md"
            >
                <span className="truncate uppercase">{value?.replace(/_/g, ' ') || "Any"}</span>
                <ChevronDown size={12} className={cn("transition-transform text-zinc-500", isOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-[110%] left-0 right-0 bg-black/80 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] z-[100] overflow-hidden backdrop-blur-xl"
                    >
                        <div className="max-h-40 overflow-y-auto custom-scroll p-1">
                            <button onClick={() => { onChange(""); setIsOpen(false); }} className="w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/10 rounded-lg hover:text-white transition-colors">Any</button>
                            {options.map((opt: string) => (
                                <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={cn("w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex justify-between items-center uppercase", value === opt ? "bg-red-600/20 text-red-500" : "text-zinc-300 hover:bg-white/10 hover:text-white")}>
                                    {opt.replace(/_/g, ' ')} {value === opt && <CheckCircle size={10} />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function WhisperIsland() {
  const router = useRouter();
  const pathname = usePathname(); 
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { profile, signOut } = useAuth();
  
  // State
  const [isMobile, setIsMobile] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [filters, setFilters] = useState({ genre: [] as string[], season: "", year: "", type: "", status: "", sort: "" });
  
  const [logoState, setLogoState] = useState(0);
  
  // Notification State
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- INIT ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); window.addEventListener('resize', handleResize);
    const interval = setInterval(() => setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length), 3500);
    
    const logoInterval = setTimeout(() => {
        setLogoState((prev) => {
            if (prev === 0) return 1;
            if (prev === 1) return 2;
            return 0;
        });
    }, logoState === 2 ? 15000 : 5000);

    // ✅ LOGIC: Close results/filters but keep text input on outside click
    const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
            setShowFilters(false);
            setIsSearchActive(false); 
        }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const init = async () => {
      const u = await UserAPI.getCurrentUser();
      if (u && supabase) {
        const channel = supabase.channel('whisper-island-global').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${u.id}` }, async (payload: any) => {
            let actorData = undefined;
            try { const { data }: any = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.actor_id).single(); if(data) actorData = data; } catch(e) {}
            triggerNotification({ id: payload.new.id, type: payload.new.type, title: actorData?.username || "System", content: payload.new.content, link: payload.new.link, actor: actorData });
        }).subscribe();
        return () => { supabase.removeChannel(channel); };
      }
    };
    init();

    const handleLocal = (e: any) => triggerNotification({ id: e.detail.id.toString(), type: e.detail.type, title: e.detail.title, content: e.detail.message, actor: { username: "System", avatar_url: "" } });
    if (typeof window !== 'undefined') window.addEventListener('shadow-whisper', handleLocal);

    return () => { 
        if (typeof window !== 'undefined') window.removeEventListener('shadow-whisper', handleLocal);
        window.removeEventListener('resize', handleResize); document.removeEventListener("mousedown", handleClickOutside); clearInterval(interval); clearTimeout(logoInterval);
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, [logoState]);

  const triggerNotification = (n: Notification) => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      setActiveNotif(n);
      setIsDetailsOpen(false);
  };

  useEffect(() => {
    if (activeNotif && !isHovered && !isDetailsOpen) {
        notifTimerRef.current = setTimeout(() => {
            setActiveNotif(null);
        }, 6000);
    }
    return () => {
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, [activeNotif, isHovered, isDetailsOpen]);

  // ✅ LOGIC: Data fetching for Suggestions (Correct mapping for aired, type, duration)
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoadingSearch(true);
        try {
          const data = await AnimeService.getSearchSuggestions(query);
          if (data) {
            setSuggestions(data.slice(0, 5).map((item: any) => ({ 
              id: item.id, 
              title: item.title, 
              image: item.poster, 
              releaseDate: item.date || 'TBA', 
              type: item.type || 'TV',
              duration: item.duration || '?'
            })));
          }
        } catch (e) { setSuggestions([]); } finally { setIsLoadingSearch(false); }
      } else setSuggestions([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  // --- HANDLERS ---
  const handleSuggestionClick = (id: string) => { setIsSearchActive(false); setQuery(''); router.push(`/watch/${id}`); };
  const toggleGenre = (g: string) => setFilters(prev => ({ ...prev, genre: prev.genre.includes(g) ? prev.genre.filter(i => i !== g) : [...prev.genre, g] }));
  
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault(); setIsSearchActive(false); setShowFilters(false);
    const params = new URLSearchParams(); 
    if (query) params.set('keyword', query); 
    if (filters.genre.length > 0) params.set('genres', filters.genre.join(',').toLowerCase());
    if (filters.season) params.set('season', filters.season);
    if (filters.year) params.set('year', filters.year);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    router.push(`/search?${params.toString()}`);
  };

  const handleRandomSummon = async () => {
    setIsRandomLoading(true);
    try {
      const anime = await AnimeService.getRandomAnime();
      if (anime?.id) {
        setShowFilters(false);
        setIsSearchActive(false);
        router.push(`/watch/${anime.id}`);
      }
    } catch (e) {} finally { setIsRandomLoading(false); }
  };

  const handleAZRedirect = () => { setIsSearchActive(false); setShowFilters(false); router.push('/az-list'); };

  const getGlow = (type?: string) => {
    switch (type) {
      case 'like': case 'error': return 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.6)] border-red-500/50 bg-black/80';
      case 'comment': return 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] border-blue-500/50 bg-black/80';
      case 'anime_update': case 'success': return 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)] border-green-500/50 bg-black/80';
      default: return 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] border-purple-500/50 bg-black/80';
    }
  };

  // UI State Vars
  const isSearchCollapsed = !!activeNotif && !isSearchActive;
  const isBusy = (!!activeNotif || isSearchActive);
  const shouldCollapseLogo = isMobile && isBusy;
  const shouldHideActions = isMobile && isBusy;
  const mainPaths = ['/home', '/social', '/watchlist', '/profile', '/'];
  const showBackButton = pathname ? !mainPaths.includes(pathname) : false;

  const standardHeight = "h-10 md:h-12";
  const standardWidth = "w-10 md:w-12";
  const logoWidth = isMobile ? (shouldCollapseLogo ? 40 : 180) : (shouldCollapseLogo ? 48 : 220);

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-b from-black/80 to-transparent pt-2 pb-1 md:pt-3 md:pb-2 px-2 sm:px-4 pointer-events-none transition-all duration-300 font-sans">
      <style>{scrollbarStyle}</style>
      <div className="flex items-start justify-center gap-2 w-full max-w-7xl mx-auto pointer-events-auto relative text-left">
        
        {/* LEFT CAPSULE */}
        <div className="flex items-center gap-2 shrink-0">
            <AnimatePresence>
                {showBackButton && !shouldCollapseLogo && (
                    <motion.button 
                        initial={{ width: 0, opacity: 0, scale: 0 }} animate={{ width: 'auto', opacity: 1, scale: 1 }} exit={{ width: 0, opacity: 0, scale: 0 }}
                        onClick={() => router.back()} 
                        className={cn(`${standardWidth} ${standardHeight} rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 hover:bg-white/10 transition-all shadow-lg`)}
                    >
                        <ArrowLeft size={isMobile ? 18 : 20} />
                    </motion.button>
                )}
            </AnimatePresence>

           <motion.div 
                layout
                className={cn(`bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] ${standardHeight} flex items-center shadow-lg overflow-hidden shrink-0 group cursor-pointer justify-center transition-colors hover:bg-black/50`)}
                onClick={() => router.push('/home')}
                animate={{ width: logoWidth, paddingLeft: shouldCollapseLogo ? 0 : 20, paddingRight: shouldCollapseLogo ? 0 : 20 }}
            >
                {!shouldCollapseLogo && (
                    <AnimatePresence mode="wait">
                        {logoState === 0 && <motion.h1 key="shadow" variants={glitchVariants} initial="initial" animate="animate" exit="exit" className={`text-xl md:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-800 flex items-center justify-center w-full ${demoness.className}`}>SHADOW</motion.h1>}
                        {logoState === 1 && <motion.h1 key="garden" variants={glitchVariants} initial="initial" animate="animate" exit="exit" className={`text-2xl md:text-4xl tracking-widest text-white flex items-center justify-center w-full drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] ${hunters.className}`}>GARDEN</motion.h1>}
                        {logoState === 2 && <motion.div key="full" variants={glitchVariants} initial="initial" animate="animate" exit="exit" className="flex items-center gap-2 justify-center w-full transform scale-90"><span className={`text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-800 ${demoness.className} tracking-widest`}>SHADOW</span><span className={`text-white text-lg md:text-xl tracking-widest drop-shadow-md ${hunters.className}`}>GARDEN</span></motion.div>}
                    </AnimatePresence>
                )}
                {shouldCollapseLogo && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]"><Crown className="w-4 h-4 text-white" /></motion.div>}
            </motion.div>
        </div>

        {/* MIDDLE CAPSULE */}
        <div className={cn("flex-1 flex gap-2 relative max-w-2xl justify-center transition-all duration-300", activeNotif ? "flex-row-reverse" : "flex-row")}>
            <motion.div
                layout
                className={cn(
                    `relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] transition-all duration-500 shadow-lg overflow-visible ${standardHeight} z-40 cursor-text hover:bg-black/50 hover:border-white/20`,
                    activeNotif ? `${standardWidth} border-white/5 bg-black/60 cursor-default` : "flex-1 w-full"
                )}
                onClick={() => { if (!isSearchActive) setIsSearchActive(true); }}
            >
                <div className={cn(`${standardWidth} h-full flex items-center justify-center shrink-0 transition-colors z-20 relative`, isSearchCollapsed ? "cursor-pointer hover:bg-white/10 text-zinc-500" : "text-zinc-400")}>
                    {isLoadingSearch ? <Loader2 className="w-4 h-4 animate-spin text-red-500"/> : <Search className="w-4 h-4" />}
                </div>

                {!isSearchCollapsed && (
                    <>
                        <form onSubmit={handleSearchSubmit} className="flex-1 h-full flex items-center relative z-10">
                            {/* Focus resumes suggestion visibility */}
                            <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setIsSearchActive(true)} className="bg-transparent border-none outline-none focus:ring-0 text-white placeholder-transparent text-sm h-full w-full pr-2" />
                            <AnimatePresence mode="wait">
                                {!query && <motion.span key={placeholderIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={cn("absolute left-0 pointer-events-none text-zinc-500 select-none truncate pr-2 w-full", isMobile ? "text-[10px]" : "text-sm")}>{PLACEHOLDERS[placeholderIndex]}</motion.span>}
                            </AnimatePresence>
                        </form>
                        <div className="flex items-center gap-1 pr-2 z-20 relative text-left">
                            {query && <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={handleSearchSubmit} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg shadow-red-900/50 mr-1"><ArrowRight className="w-4 h-4" /></motion.button>}
                            {(query || isSearchActive) && <button type="button" onClick={(e) => { e.stopPropagation(); setQuery(''); setIsSearchActive(false); setShowFilters(false); }} className="p-1.5 text-zinc-500 hover:text-white rounded-full hover:bg-white/10"><X className="w-4 h-4" /></button>}
                            <div className={cn("flex items-center gap-1", (isMobile && !isSearchActive) ? "hidden" : "flex")}>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }} className={cn("p-1.5 rounded-full transition-colors relative", showFilters ? "text-red-400 bg-red-500/10" : "text-zinc-400 hover:text-white hover:bg-white/10")}><Filter className="w-4 h-4" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); router.push('/ai/imagesearch'); }} className="group/ai relative p-1.5 rounded-full text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><ImageIcon className="w-4 h-4" /><Sparkles className="w-2.5 h-2.5 text-yellow-400 absolute -top-0.5 -right-0.5 animate-pulse pointer-events-none" /></button>
                            </div>
                        </div>
                    </>
                )}

                {/* FILTER PANEL */}
                <AnimatePresence>
                    {showFilters && !isSearchCollapsed && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }} className="absolute top-[120%] left-0 right-0 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] p-6 z-50 ring-1 ring-white/5">
                             <div className="relative z-10 space-y-6">
                                 <div className="space-y-2">
                                     <div className="flex items-center justify-between text-left"><div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest"><Tag size={12}/> Genres</div><button onClick={handleAZRedirect} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all"><SortAsc size={10} /> A-Z List</button></div>
                                     <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scroll p-1 pr-2">{GENRES.map(g => (<button key={g} onClick={() => toggleGenre(g)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-300", filters.genre.includes(g) ? "bg-red-600 border-red-500 text-white shadow-md" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white")}>{g}</button>))}</div>
                                 </div>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                                     <CustomSelect label="Season" icon={Calendar} options={SEASONS} value={filters.season} onChange={(v: string) => setFilters(p => ({...p, season: v}))} />
                                     <CustomSelect label="Year" icon={Layers} options={YEARS} value={filters.year} onChange={(v: string) => setFilters(p => ({...p, year: v}))} />
                                     <CustomSelect label="Format" icon={Tv} options={TYPES} value={filters.type} onChange={(v: string) => setFilters(p => ({...p, type: v}))} />
                                     <CustomSelect label="Status" icon={Info} options={STATUS} value={filters.status} onChange={(v: string) => setFilters(p => ({...p, status: v}))} />
                                 </div>
                             </div>
                             <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-4 text-left">
                                 <button onClick={() => setFilters({ genre: [], season: "", year: "", type: "", status: "", sort: "" })} className="text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors">Reset All</button>
                                 <div className="flex gap-2">
                                     {/* RANDOM BUTTON */}
                                     <Button size="sm" variant="outline" onClick={handleRandomSummon} disabled={isRandomLoading} className="h-9 px-4 text-xs font-bold text-zinc-300 bg-white/5 border-white/10 hover:bg-yellow-500/20 hover:text-yellow-500 rounded-full">{isRandomLoading ? <Loader2 size={14} className="animate-spin" /> : <><Dices size={14} className="mr-2"/> Random</>}</Button>
                                     <Button size="sm" onClick={handleSearchSubmit} className="h-9 px-6 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-lg shadow-red-900/20 rounded-full border border-red-500/20">Apply Filters</Button>
                                 </div>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SUGGESTIONS UI: Corrected mapping aired • type • duration */}
                <AnimatePresence>
                    {!activeNotif && isSearchActive && suggestions.length > 0 && !showFilters && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[110%] left-0 right-0 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl">
                            {suggestions.map(s => (
                                <div key={s.id} onClick={() => handleSuggestionClick(s.id)} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl cursor-pointer group transition-all text-left">
                                    <img src={s.image} className="w-10 h-14 object-cover rounded-lg bg-zinc-800 border border-white/5 group-hover:border-red-500/50" alt="" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-white truncate group-hover:text-red-500 transition-colors">{s.title}</div>
                                        <div className="text-[10px] text-zinc-500 font-medium uppercase">{s.releaseDate} • {s.type} • {s.duration}</div>
                                    </div>
                                    <ArrowRight size={14} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-all mr-2" />
                                </div>
                            ))}
                            <div onClick={() => handleSearchSubmit()} className="p-2 mt-1 border-t border-white/5 text-center text-[10px] font-bold text-zinc-500 hover:text-white cursor-pointer uppercase tracking-widest">See All Results</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* NOTIFICATION CAPSULE */}
            <AnimatePresence mode="popLayout">
                {activeNotif && (
                    <motion.div layout key={activeNotif.id} initial={{ opacity: 0, x: -20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.9 }} className={cn(`relative flex items-center backdrop-blur-2xl border transition-all duration-500 shadow-2xl z-[100] overflow-hidden`, getGlow(activeNotif.type), isDetailsOpen ? "w-full max-w-sm rounded-[2rem] p-4 flex-col items-start bg-black/60" : `${standardHeight} w-auto max-w-[70vw] md:max-w-[60vw] rounded-[2rem] px-3 bg-black/40`)} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={() => { if(isDetailsOpen && activeNotif.link) { router.push(activeNotif.link); setActiveNotif(null); } else setIsDetailsOpen(!isDetailsOpen); }}>
                       {!isDetailsOpen ? (
                           <div className="flex items-center gap-3 w-full text-left"><div className="relative shrink-0"><Avatar className="w-8 h-8 border border-white/20"><AvatarImage src={activeNotif.actor?.avatar_url} /><AvatarFallback className="bg-black/50 text-[9px] text-white">!</AvatarFallback></Avatar></div><div className="flex flex-col justify-center min-w-0 flex-1 text-left"><span className="text-[10px] font-black text-white/90 uppercase truncate">{activeNotif.title}</span><span className="text-[9px] text-white/60 truncate">{activeNotif.content}</span></div></div>
                       ) : (
                           <div className="flex flex-col gap-3 w-full text-left"><div className="flex justify-between items-start w-full text-left"><div className="flex items-center gap-2 text-left"><Avatar className="w-8 h-8 rounded-full border border-white/10"><AvatarImage src={activeNotif.actor?.avatar_url}/></Avatar><span className="text-sm font-bold text-white">{activeNotif.title}</span></div><X size={14} className="text-white/50 cursor-pointer hover:text-white" onClick={(e) => {e.stopPropagation(); setActiveNotif(null);}}/></div><p className="text-xs text-white/80 leading-relaxed text-left">{activeNotif.content}</p>{activeNotif.link && <Button size="sm" className="w-full h-8 text-xs bg-white/10 hover:bg-white/20">View Content</Button>}</div>
                       )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* ✅ AI BUTTON: Pill-style with Robot Icon */}
        <motion.div layout className="flex items-center gap-2 shrink-0 pointer-events-auto" animate={{ width: shouldHideActions ? 0 : 'auto', opacity: shouldHideActions ? 0 : 1, pointerEvents: shouldHideActions ? 'none' : 'auto' }}>
            <button onClick={() => router.push('/ai')} className={cn(`flex items-center justify-center bg-gradient-to-r from-red-950/80 to-black border border-red-500/30 hover:border-red-500 text-white font-bold rounded-full shadow-lg transition-all ${standardHeight} px-4 gap-2`)}>
                <Bot size={18} className="text-red-400" /> 
                <span className="hidden sm:inline text-[10px] tracking-widest uppercase">ALPHA</span>
            </button>
            <div className={cn(`bg-black/40 backdrop-blur-xl border border-white/10 rounded-full ${standardHeight} ${standardWidth} flex items-center justify-center shadow-lg hover:bg-black/50 transition-colors`)}><Notifications /></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="relative group outline-none"><div className={cn(`${standardHeight} ${standardWidth} rounded-full p-[2px] transition-all bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-center`)}><Avatar className="w-full h-full rounded-full border border-white/10 p-0.5">{profile?.avatar_url ? <AvatarImage src={profile.avatar_url} className="object-cover rounded-full" /> : <ShadowAvatar gender={profile?.gender}/>}</Avatar></div></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-zinc-300 p-2 rounded-2xl z-[101]">
                    {profile?.is_guest ? (<DropdownMenuItem onClick={() => router.push('/auth')} className="cursor-pointer bg-red-600/10 text-red-500 font-bold h-10 rounded-lg"><LogIn size={14} className="mr-2"/> Login</DropdownMenuItem>) : (
                      <>
                        <DropdownMenuItem asChild><Link href="/profile"><User size={14} className="mr-2"/> Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/watchlist"><LayoutGrid size={14} className="mr-2"/> Library</Link></DropdownMenuItem>
                        {/* ✅ RESTORED SETTINGS BUTTON */}
                        <DropdownMenuItem asChild><Link href="/settings"><Settings size={14} className="mr-2"/> Settings</Link></DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10"/>
                        <DropdownMenuItem onClick={() => signOut()} className="text-red-500"><LogOut size={14} className="mr-2"/> Logout</DropdownMenuItem>
                      </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.div>

      </div>
    </div>
  );
}