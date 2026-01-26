"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Search, X, Loader2, Crown, Filter, Image as ImageIcon, Calendar, Tv, Layers, 
  Bot, LogIn, LogOut, Settings, User, ChevronDown, ArrowRight, Dices, 
  Bell, CheckCircle, Info, Languages, Flag, Heart, MessageCircle, AlertOctagon, ArrowDownAZ
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { AnimeService } from '@/lib/api'; 
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Notifications from '@/components/Anime/Notifications';
import ShadowAvatar from '@/components/User/ShadowAvatar';
import HindiSearchBar from '@/components/Anime/HindiSearchBar';
import { demoness, hunters } from '@/lib/fonts';

// --- CONFIG ---
const PLACEHOLDERS = ["Summon Solo Leveling...", "Find One Piece...", "Search Jujutsu Kaisen...", "Explore Shadow Garden..."];
const ISLAND_HEIGHT = "h-10 md:h-12"; // Slightly taller for better touch targets
const FLUID_SPRING = { type: "spring", stiffness: 400, damping: 30, mass: 0.8 };

const GENRES = ["Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Drama", "Ecchi", "Fantasy", "Game", "Harem", "Hentai", "Historical", "Horror", "Isekai", "Josei", "Kids", "Magic", "Martial Arts", "Mecha", "Military", "Music", "Mystery", "Parody", "Police", "Psychological", "Romance", "Samurai", "School", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Space", "Sports", "Super Power", "Supernatural", "Thriller", "Vampire"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const TYPES = ["tv", "movie", "ova", "ona", "special", "music"];
const STATUS = ["currently_airing", "finished_airing", "not_yet_aired"];
const YEARS = Array.from({ length: 2027 - 1990 }, (_, i) => (2027 - i).toString());

// --- TYPES ---
interface SearchResult { id: string; title: string; image: string; type?: string; episodes?: string | number; }
interface Notification { id: string; type: string; title: string; content: string; link?: string; }
type CenterMode = 'SEARCH_SOLO' | 'ISLAND_FOCUSED' | 'SEARCH_FOCUSED' | 'ISLAND_DETAILS';

// --- ICONS ---
const getNotifIcon = (type: string) => {
    switch (type) {
        case 'watchlist': return <Flag className="text-yellow-500" size={16} />;
        case 'warning': return <AlertOctagon className="text-red-500" size={16} />;
        case 'like': return <Heart className="text-pink-500" size={16} />;
        case 'anime_update': return <Tv className="text-purple-500" size={16} />;
        default: return <Bell className="text-zinc-400" size={16} />;
    }
};

// --- COMPONENTS ---

const PlaceholderRotator = () => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setIndex(prev => (prev + 1) % PLACEHOLDERS.length), 3500);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.span 
                    key={index} 
                    initial={{opacity:0, y:15}} 
                    animate={{opacity:1, y:0}} 
                    exit={{opacity:0, y:-15}} 
                    className="text-zinc-500 select-none truncate w-full text-[10px] md:text-xs pl-1"
                >
                    {PLACEHOLDERS[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

const CustomSelect = ({ label, icon: Icon, options, value, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="space-y-1 relative">
            <label className="text-[8px] text-zinc-500 font-bold uppercase ml-1 flex items-center gap-1"><Icon size={9}/> {label}</label>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-lg text-[10px] py-1.5 px-2 flex items-center justify-between transition-all">
                <span className="truncate uppercase">{value?.replace(/_/g, ' ') || "Any"}</span>
                <ChevronDown size={10} className={cn("transition-transform text-zinc-500", isOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-[110%] left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden">
                        <div className="max-h-32 overflow-y-auto custom-scroll p-1">
                            <button onClick={() => { onChange(""); setIsOpen(false); }} className="w-full text-left px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/10 rounded transition-colors">Any</button>
                            {options.map((opt: string) => (
                                <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={cn("w-full text-left px-2 py-1 text-[10px] rounded transition-colors flex justify-between items-center uppercase", value === opt ? "bg-red-600/20 text-red-500" : "text-zinc-300 hover:bg-white/10")}>
                                    {opt.replace(/_/g, ' ')} {value === opt && <CheckCircle size={8} />}
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { profile, signOut } = useAuth();

  // --- STATES ---
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoState, setLogoState] = useState(0);

  // Search Data
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [filters, setFilters] = useState({ genre: [] as string[], season: "", year: "", type: "", status: "", sort: "newest" });
  const [showFilters, setShowFilters] = useState(false);
  const [isHindiMode, setIsHindiMode] = useState(false);

  // Logic Flags
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const [centerMode, setCenterMode] = useState<CenterMode>('SEARCH_SOLO');
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  
  // Notification Switching Logic
  const [isSwitchingNotif, setIsSwitchingNotif] = useState(false);
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // --- LOGIC ENGINE ---

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); window.addEventListener('resize', handleResize);
    const logoInterval = setTimeout(() => setLogoState(p => (p + 1) % 3), logoState === 2 ? 15000 : 5000);

    const handleClickOutside = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
            setShowFilters(false);
            setIsMobileSearchExpanded(false);
            if (centerMode === 'ISLAND_DETAILS') setCenterMode('ISLAND_FOCUSED');
        }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Whisper Listener (Queue System with Smooth Transition)
    const handleWhisper = async (e: any) => {
        const newNotif = { 
            id: e.detail.id.toString(), type: e.detail.type, title: e.detail.title, content: e.detail.message, link: e.detail.link 
        };

        if (activeNotif) {
            setIsSwitchingNotif(true);
            await new Promise(r => setTimeout(r, 600)); // Allow shrink
            setActiveNotif(newNotif);
            await new Promise(r => setTimeout(r, 100)); // Swap content
            setIsSwitchingNotif(false); // Expand
        } else {
            setActiveNotif(newNotif);
        }
        
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
        notifTimerRef.current = setTimeout(() => {
            setActiveNotif(null);
        }, 8000);
    };

    if (typeof window !== 'undefined') window.addEventListener('shadow-whisper', handleWhisper);

    return () => { 
        window.removeEventListener('resize', handleResize); 
        document.removeEventListener("mousedown", handleClickOutside); 
        clearTimeout(logoInterval);
        if (typeof window !== 'undefined') window.removeEventListener('shadow-whisper', handleWhisper);
    };
  }, [logoState, activeNotif]);

  // Sync Mode
  useEffect(() => {
    if (!activeNotif) {
        setCenterMode('SEARCH_SOLO');
    } else if (centerMode === 'SEARCH_SOLO') {
        setCenterMode('ISLAND_FOCUSED');
    }
  }, [activeNotif]);

  // Search Fetching
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoadingSearch(true);
        try {
            let data;
            if (isHindiMode) {
                 // Mocking Hindi API if method doesn't exist, replace with actual call
                 // data = await AnimeService.getHindiSuggestions(query);
                 data = await AnimeService.getSearchSuggestions(query); // Fallback
            } else {
                 data = await AnimeService.getSearchSuggestions(query);
            }
            
            if (data) {
                setSuggestions(data.slice(0, 5).map((item: any) => ({ 
                    id: item.id, 
                    title: item.title, 
                    image: item.poster, 
                    type: item.type || 'TV',
                    // Original Logic Recovery
                    episodes: item.episodes?.sub || item.stats?.episodes?.sub || item.episodes || '?'
                })));
            }
        } catch (e) { setSuggestions([]); } finally { setIsLoadingSearch(false); }
      } else setSuggestions([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [query, isHindiMode]);

  // --- HANDLERS ---
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    const params = new URLSearchParams(); 
    if (query) params.set('keyword', query); 
    if (filters.genre.length > 0) params.set('genres', filters.genre.join(',').toLowerCase());
    if (filters.sort) params.set('sort', filters.sort);
    router.push(`/search?${params.toString()}`);
    setShowFilters(false);
  };

  const toggleGenre = (g: string) => setFilters(prev => ({ ...prev, genre: prev.genre.includes(g) ? prev.genre.filter(i => i !== g) : [...prev.genre, g] }));
  const handleSuggestionClick = (id: string) => { setQuery(''); router.push(`/watch/${id}`); };

  const activateSearchFocus = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCenterMode('SEARCH_FOCUSED');
  };

  const activateIslandFocus = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCenterMode('ISLAND_FOCUSED');
  };

  const activateIslandDetails = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(centerMode === 'ISLAND_DETAILS') setCenterMode('ISLAND_FOCUSED'); 
      else setCenterMode('ISLAND_DETAILS'); 
  };

  const dismissNotification = (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveNotif(null);
  };

  const shouldHideExtras = isMobile && (isMobileSearchExpanded || centerMode === 'ISLAND_DETAILS' || activeNotif);

  if (!mounted) return <div className="fixed top-0 h-16 w-full z-[9999]" />;

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-[9999] pt-2 px-2 sm:px-4 pointer-events-none font-sans h-auto min-h-[64px]">
        
        {/* LAYOUT: Tightened Max Width to 7xl to bring items closer */}
        <div className="w-full max-w-7xl mx-auto flex items-start justify-between gap-2 pointer-events-none relative">

            {/* --- LEFT: LOGO --- */}
            <motion.div layout className="pointer-events-auto z-40 shrink-0">
                <div 
                    className={cn(`bg-black/40 backdrop-blur-xl border border-white/10 rounded-full ${ISLAND_HEIGHT} flex items-center shadow-lg overflow-hidden cursor-pointer justify-center hover:bg-black/50 transition-all duration-500`)}
                    onClick={() => router.push('/home')}
                    style={{ width: shouldHideExtras ? 40 : (isMobile ? 120 : 160) }}
                >
                    {shouldHideExtras ? (
                        <Crown size={16} className="text-red-500" />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={logoState}
                                initial={{opacity:0, skewX: -20}} 
                                animate={{opacity:1, skewX: 0}} 
                                exit={{opacity:0, skewX: 20}}
                                transition={{duration: 0.3}}
                                className="flex items-center gap-1.5 transform glitch-anim"
                            >
                                 {logoState === 0 && <span className={`text-xl md:text-2xl tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-800 ${demoness.className}`}>SHADOW</span>}
                                 {logoState === 1 && <span className={`text-2xl md:text-3xl tracking-widest text-white drop-shadow-red-glow ${hunters.className}`}>GARDEN</span>}
                                 {logoState === 2 && <><span className={`text-lg text-red-600 ${demoness.className}`}>SHADOW</span><span className={`text-lg text-white ${hunters.className}`}>GARDEN</span></>}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>

            {/* --- CENTER: LIQUID STAGE --- */}
            <div className="flex-1 flex justify-center pointer-events-auto z-50 min-w-0">
                <LayoutGroup>
                    <AnimatePresence mode="popLayout" custom={centerMode}>
                        <motion.div layout transition={FLUID_SPRING} className="flex items-start justify-center gap-2 w-full max-w-2xl relative">
                            
                            {/* 1. SEARCH SOLO */}
                            {centerMode === 'SEARCH_SOLO' && (
                                <motion.div
                                    layoutId="search-bar"
                                    onClick={() => isMobile && setIsMobileSearchExpanded(true)}
                                    className={cn(
                                        `relative bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] ${ISLAND_HEIGHT} transition-all`,
                                        isMobile && !isMobileSearchExpanded ? "w-36" : "w-full"
                                    )}
                                >
                                    <SearchBarContent 
                                        query={query} setQuery={setQuery} 
                                        isHindiMode={isHindiMode} setIsHindiMode={setIsHindiMode}
                                        showFilters={showFilters} setShowFilters={setShowFilters}
                                        isLoadingSearch={isLoadingSearch}
                                        handleSearchSubmit={handleSearchSubmit}
                                        filters={filters} setFilters={setFilters} toggleGenre={toggleGenre}
                                        suggestions={suggestions} handleSuggestionClick={handleSuggestionClick}
                                        router={router}
                                        compact={isMobile && !isMobileSearchExpanded}
                                    />
                                </motion.div>
                            )}

                            {/* 2. ISLAND FOCUSED / DETAILS */}
                            {(centerMode === 'ISLAND_FOCUSED' || centerMode === 'ISLAND_DETAILS') && activeNotif && (
                                <>
                                    {/* Anchored Icon - Self-start prevents dragging down */}
                                    <motion.div
                                        layoutId="search-bar"
                                        onClick={activateSearchFocus}
                                        className={cn(`self-start flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)] ${ISLAND_HEIGHT} w-10 md:w-12 shrink-0 cursor-pointer z-40`)}
                                    >
                                        <motion.div layout="position"><Search size={16} className="text-zinc-300" /></motion.div>
                                    </motion.div>

                                    {/* Island */}
                                    <motion.div
                                        layoutId="island-body"
                                        onClick={activateIslandDetails}
                                        className={cn(
                                            "relative overflow-hidden bg-[#0a0a0a]/95 border-red-500/30 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] rounded-[2rem] cursor-pointer z-50 transition-all",
                                            isSwitchingNotif ? `${ISLAND_HEIGHT} w-10 md:w-12 flex items-center justify-center` : 
                                            centerMode === 'ISLAND_DETAILS' ? "w-[95vw] max-w-lg p-5 flex flex-col gap-3 h-auto" : `${ISLAND_HEIGHT} px-4 min-w-[140px] flex items-center justify-center`
                                        )}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isSwitchingNotif ? (
                                                <motion.div key="loader" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                                            ) : centerMode === 'ISLAND_DETAILS' ? (
                                                <motion.div 
                                                    key="details" 
                                                    initial={{opacity:0, y:10}} 
                                                    animate={{opacity:1, y:0}} 
                                                    exit={{opacity:0, y:-10, transition:{duration:0.1}}} 
                                                    className="w-full"
                                                >
                                                    <div className="flex justify-between items-start w-full mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-full bg-white/5 border border-white/10">{getNotifIcon(activeNotif.type)}</div>
                                                            <span className={`text-lg text-white ${hunters.className} tracking-wide`}>{activeNotif.title}</span>
                                                        </div>
                                                        <div role="button" onClick={dismissNotification} className="p-2 hover:bg-white/10 rounded-full bg-white/5 border border-white/5 transition-colors">
                                                            <X size={16} className="text-white/70 hover:text-white"/>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-zinc-300 leading-relaxed mb-4 font-normal normal-case">{activeNotif.content}</p>
                                                    {activeNotif.link && <Button size="sm" onClick={(e)=>{e.stopPropagation(); router.push(activeNotif.link!)}} className="w-full h-9 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 font-bold uppercase tracking-wider text-xs">View Intel</Button>}
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    key="compact" 
                                                    initial={{opacity:0}} 
                                                    animate={{opacity:1}} 
                                                    exit={{opacity:0}} 
                                                    className="flex items-center gap-3 max-w-[220px]"
                                                >
                                                    <div className="shrink-0">{getNotifIcon(activeNotif.type)}</div>
                                                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                                                        <span className={`text-xs text-white truncate ${hunters.className} tracking-wider`}>{activeNotif.title}</span>
                                                        <span className="text-[10px] text-zinc-400 truncate normal-case">{activeNotif.content}</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </>
                            )}

                            {/* 3. SEARCH FOCUSED */}
                            {centerMode === 'SEARCH_FOCUSED' && activeNotif && (
                                <>
                                    <motion.div
                                        layoutId="search-bar"
                                        className={cn(`relative bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] w-full ${ISLAND_HEIGHT}`)}
                                    >
                                        <SearchBarContent 
                                            query={query} setQuery={setQuery} 
                                            isHindiMode={isHindiMode} setIsHindiMode={setIsHindiMode}
                                            showFilters={showFilters} setShowFilters={setShowFilters}
                                            isLoadingSearch={isLoadingSearch}
                                            handleSearchSubmit={handleSearchSubmit}
                                            filters={filters} setFilters={setFilters} toggleGenre={toggleGenre}
                                            suggestions={suggestions} handleSuggestionClick={handleSuggestionClick}
                                            router={router}
                                        />
                                    </motion.div>

                                    <motion.div
                                        layoutId="island-body"
                                        onClick={activateIslandFocus}
                                        className={cn(`flex items-center justify-center rounded-full bg-[#0a0a0a]/95 border border-red-500/30 hover:border-red-500 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] ${ISLAND_HEIGHT} w-10 md:w-12 shrink-0 cursor-pointer`)}
                                    >
                                        <motion.div layout="position">{getNotifIcon(activeNotif.type)}</motion.div>
                                    </motion.div>
                                </>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </LayoutGroup>
            </div>

            {/* --- RIGHT: ACTIONS --- */}
            <motion.div layout className="pointer-events-auto z-40 shrink-0">
                <div className="flex items-center gap-2">
                    <AnimatePresence>
                        {!shouldHideExtras && (
                            <motion.div initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} className="flex items-center gap-2">
                                <button onClick={() => router.push('/ai')} className={cn(`flex items-center justify-center bg-gradient-to-r from-red-950/80 to-black border border-red-500/30 hover:border-red-500 text-white font-bold rounded-full shadow-lg transition-all ${ISLAND_HEIGHT} px-3 gap-2`)}>
                                    <Bot size={16} className="text-red-400" /> 
                                    <span className="hidden sm:inline text-[9px] tracking-widest uppercase">ALPHA</span>
                                </button>
                                <div className={cn(`bg-black/40 backdrop-blur-xl border border-white/10 rounded-full ${ISLAND_HEIGHT} w-10 md:w-12 flex items-center justify-center hover:bg-black/50`)}>
                                    <Notifications />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="outline-none">
                                <div className={cn(`${ISLAND_HEIGHT} w-10 md:w-12 rounded-full p-[2px] bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center`)}>
                                    <Avatar className="w-full h-full rounded-full border border-white/10 p-0.5">
                                        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} className="object-cover rounded-full" /> : <ShadowAvatar gender={profile?.gender}/>}
                                    </Avatar>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-zinc-300 p-1.5 rounded-xl z-[101]">
                            <DropdownMenuItem onClick={() => signOut()} className="text-red-500 cursor-pointer hover:bg-red-600/10 transition-colors text-xs py-2"><LogOut size={12} className="mr-2"/> Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.div>

        </div>
    </div>
  );
}

// --- SUB-COMPONENT ---
const SearchBarContent = ({ 
    query, setQuery, isHindiMode, setIsHindiMode, showFilters, setShowFilters, 
    isLoadingSearch, handleSearchSubmit, filters, setFilters, toggleGenre, 
    suggestions, handleSuggestionClick, router, compact = false
}: any) => {
    return (
        <div className="w-full h-full flex items-center relative px-1">
             {isHindiMode ? (
                 <div className="flex w-full h-full items-center">
                    <HindiSearchBar onClose={() => setShowFilters(false)} isActive={true} setIsActive={()=>{}} onToggleMode={() => setIsHindiMode(false)} />
                    {/* Image Search Visible on Mobile too */}
                    <button onClick={() => router.push('/ai/imagesearch')} className="p-1.5 rounded-full text-zinc-400 hover:text-blue-400 ml-1"><ImageIcon size={14} /></button>
                 </div>
             ) : (
                 <>
                     <div className="h-full w-10 flex items-center justify-center shrink-0 text-zinc-400">
                         {isLoadingSearch ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500"/> : <Search className="w-3.5 h-3.5" />}
                     </div>
                     <form onSubmit={handleSearchSubmit} className="flex-1 h-full relative overflow-visible">
                         <input 
                             value={query} 
                             onChange={(e) => setQuery(e.target.value)} 
                             className="bg-transparent border-none outline-none focus:ring-0 text-white text-[11px] md:text-xs h-full w-full relative z-10 placeholder-transparent" 
                         />
                         {!query && <PlaceholderRotator />}
                     </form>
                     
                     {!compact && (
                         <div className="flex items-center gap-1 pr-1.5">
                             {query && <button onClick={handleSearchSubmit} className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"><ArrowRight size={12} /></button>}
                             {query && <button onClick={(e) => { e.stopPropagation(); setQuery(''); setShowFilters(false); }} className="p-1 text-zinc-500 hover:text-white"><X size={12} /></button>}
                             
                             <div className="flex items-center gap-1">
                                 <div className="w-px h-3 bg-white/10 mx-1" />
                                 <button onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }} className={cn("p-1.5 rounded-full transition-colors", showFilters ? "text-red-400 bg-red-500/10" : "text-zinc-400 hover:text-white")}><Filter size={12} /></button>
                                 <button onClick={(e) => { e.stopPropagation(); router.push('/ai/imagesearch'); }} className="p-1.5 rounded-full text-zinc-400 hover:text-blue-400 block"><ImageIcon size={12} /></button>
                             </div>
                         </div>
                     )}
                 </>
             )}

             <AnimatePresence>
                 {showFilters && !compact && (
                     <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl z-50 ring-1 ring-white/5">
                         <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Filters</span>
                             <div className="flex gap-2">
                                <button onClick={() => router.push('/search?mode=az')} className="flex items-center gap-1 text-[9px] px-2 py-1.5 rounded-full bg-transparent text-zinc-500 border border-transparent hover:bg-white/5 transition-all">
                                    <ArrowDownAZ size={10}/> A-Z
                                </button>
                                {/* Toggle Hindi Mode instead of simple set */}
                                <button onClick={() => setIsHindiMode(!isHindiMode)} className={cn("flex items-center gap-1 text-[9px] px-3 py-1.5 rounded-full border transition-all", isHindiMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10")}><Languages size={10}/> {isHindiMode ? 'Hindi On' : 'Hindi Off'}</button>
                             </div>
                         </div>
                         <div className="space-y-4">
                             <div>
                                 <span className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block ml-1">Genres</span>
                                 <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-hide [&::-webkit-scrollbar]:hidden">
                                     {GENRES.map(g => (<button key={g} onClick={() => toggleGenre(g)} className={cn("px-2.5 py-1 rounded-md text-[9px] font-bold border transition-all", filters.genre.includes(g) ? "bg-red-600 border-red-500 text-white shadow-red-900/20 shadow-lg" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10")}>{g}</button>))}
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                 <CustomSelect label="Season" icon={Calendar} options={SEASONS} value={filters.season} onChange={(v: string) => setFilters((p:any) => ({...p, season: v}))} />
                                 <CustomSelect label="Year" icon={Layers} options={YEARS} value={filters.year} onChange={(v: string) => setFilters((p:any) => ({...p, year: v}))} />
                                 <CustomSelect label="Format" icon={Tv} options={TYPES} value={filters.type} onChange={(v: string) => setFilters((p:any) => ({...p, type: v}))} />
                                 <CustomSelect label="Status" icon={Info} options={STATUS} value={filters.status} onChange={(v: string) => setFilters((p:any) => ({...p, status: v}))} />
                             </div>
                             <div className="flex justify-between pt-3 border-t border-white/10">
                                 <Button size="sm" variant="ghost" className="h-8 text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 rounded-full border border-white/5"><Dices size={12} className="mr-1.5"/> Random</Button>
                                 <Button size="sm" onClick={handleSearchSubmit} className="h-8 text-[10px] bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white px-6 rounded-full shadow-lg shadow-red-900/30">Apply</Button>
                             </div>
                         </div>
                     </motion.div>
                 )}
                 {query.length > 1 && suggestions.length > 0 && !showFilters && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl p-1 z-50">
                         {suggestions.map((s: { id: React.Key | null | undefined; image: string | undefined; title: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; type: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; episodes: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }) => (
                             <div key={s.id} onClick={() => handleSuggestionClick(s.id)} className="flex items-center gap-3 p-1.5 hover:bg-white/10 rounded-xl cursor-pointer group transition-all">
                                 <img src={s.image} className="w-9 h-12 object-cover rounded-lg bg-zinc-800 shadow-md" alt="" />
                                 <div className="min-w-0 flex-1">
                                     <div className="text-xs font-bold text-white truncate group-hover:text-red-500">{s.title}</div>
                                     <div className="text-[9px] text-zinc-500 font-medium uppercase mt-0.5">{s.type} • {s.episodes} EPS</div>
                                 </div>
                             </div>
                         ))}
                         <div onClick={() => handleSearchSubmit()} className="p-2 mt-1 border-t border-white/5 text-center text-[9px] font-bold text-zinc-500 hover:text-white cursor-pointer uppercase tracking-widest">See All Results</div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
};