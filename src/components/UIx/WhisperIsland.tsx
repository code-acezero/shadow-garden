"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup, Transition, Variants } from 'framer-motion';
import { 
  Search, X, Loader2, Filter, Calendar, Tv, Layers, 
  Bot, LogIn, LogOut, Settings, User, ChevronDown, ArrowRight, Dices, 
  Bell, CheckCircle, Info, Languages, Flag, Heart, AlertOctagon, 
  ArrowDownAZ, LayoutGrid, RotateCcw, ScanSearch, Users, Plus,
  ShieldAlert, MessageSquareWarning, Volume2, Mic2, Radio, Check, 
  Trash2, Play, Pause, AudioWaveform
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext'; 
import { supabase } from '@/lib/supabase'; 
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import Notifications from '@/components/Anime/Notifications'; 
import ShadowAvatar from '@/components/User/ShadowAvatar';
import ShadowLogo from '@/components/UIx/ShadowLogo';
import { demoness, hunters } from '@/lib/fonts';
import { playVoice, refreshVoiceCache } from '@/lib/voice'; 
import { useSettings } from '@/hooks/useSettings'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hpi } from '@/lib/hpi';
import { AnimeService } from '@/lib/api'; // Ensure AnimeService is imported

// --- CONFIG ---
const PLACEHOLDERS = ["Summon Solo Leveling...", "Find One Piece...", "Search Jujutsu Kaisen...", "Explore Shadow Garden..."];
const ISLAND_HEIGHT = "h-11 md:h-12"; 
const FLUID_TRANSITION: Transition = { type: "spring", stiffness: 320, damping: 30, mass: 1 };

// --- ANIMATIONS ---
const glitchVariants: Variants = {
    initial: { opacity: 0, filter: "blur(8px)", y: 10 },
    animate: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.3, ease: "circOut" } },
    exit: { opacity: 0, filter: "blur(12px)", scale: 1.5, x: 10, transition: { duration: 0.2, ease: "easeIn" } }
};

const LightWave = ({ delay = 0, trigger }: { delay?: number, trigger: any }) => (
    <motion.div
        key={trigger} 
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ 
            x: "200%", 
            opacity: [0, 0.8, 0],
            transition: { duration: 1.2, delay: delay, ease: "easeInOut" }
        }}
        className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-overlay skew-x-12"
    />
);

// --- FILTERS & DATA ---
const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Isekai", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const TYPES = ["tv", "movie", "ova", "ona", "special"];
const STATUS = ["currently_airing", "finished_airing", "not_yet_aired"];
const HINDI_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller"];
const HINDI_LANGUAGES = ["Hindi", "Tamil", "Telugu", "English"];
const YEARS = Array.from({ length: 2027 - 2000 }, (_, i) => (2027 - i).toString());

// --- MOCK LOCAL DATA FOR VOICES ---
const LOCAL_VOICE_PACKS = [
    { id: 'sys-alpha', name: 'Alpha', language: 'en', gender: 'Female', preview: '/audio/alpha_preview.mp3' },
    { id: 'sys-beta', name: 'Beta', language: 'en', gender: 'Female', preview: '/audio/beta_preview.mp3' },
    { id: 'sys-shadow', name: 'Shadow', language: 'en', gender: 'Male', preview: '/audio/shadow_preview.mp3' },
    { id: 'sys-delta', name: 'Delta', language: 'en', gender: 'Female', preview: '/audio/delta_preview.mp3' },
    { id: 'sys-zeta', name: 'Zeta', language: 'en', gender: 'Female', preview: '/audio/zeta_preview.mp3' },
    { id: 'sys-alpha-jp', name: 'Alpha', language: 'jp', gender: 'Female', preview: '/audio/alpha_jp_preview.mp3' },
];

interface SearchResult { id: string; title: string; image?: string; poster?: string; type?: string; duration?: string; releaseDate?: string; episodeCount?: string; episode?: string; }

// --- HELPER FUNCTIONS ---
const dispatchWhisper = (title: string, message: string) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-whisper', { detail: { id: Date.now(), type: 'system', title: title, message: message } }));
};

const getNotifIcon = (type: string) => {
    switch (type) {
        case 'watchlist': return <Flag className="text-yellow-500" size={16} />;
        case 'warning': return <ShieldAlert className="text-primary-600 animate-pulse" size={18} />; 
        case 'GUILD_WARNING': return <ShieldAlert className="text-primary-600 animate-pulse" size={18} />;
        case 'like': return <Heart className="text-pink-500" size={16} />;
        case 'anime_update': return <Tv className="text-purple-500" size={16} />;
        case 'error': return <MessageSquareWarning className="text-orange-500" size={16} />;
        default: return <Bell className="text-zinc-400" size={16} />;
    }
};

// --- SUB COMPONENTS ---
const PlaceholderRotator = () => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setIndex(prev => (prev + 1) % PLACEHOLDERS.length), 3500);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden pl-2">
            <AnimatePresence mode="wait">
                <motion.span key={index} initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-15}} className="text-zinc-500 select-none truncate w-full text-[10px] md:text-xs">
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
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-lg text-[10px] py-1.5 px-2 flex items-center justify-between">
                <span className="truncate uppercase">{value?.replace(/_/g, ' ') || "Any"}</span>
                <ChevronDown size={10} className={cn("transition-transform text-zinc-500", isOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-[110%] left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden">
                        <div className="max-h-32 overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            <button onClick={() => { onChange(""); setIsOpen(false); }} className="w-full text-left px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/10 rounded transition-colors">Any</button>
                            {options.map((opt: string) => (
                                <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={cn("w-full text-left px-2 py-1 text-[10px] rounded transition-colors flex justify-between items-center uppercase", value === opt ? "bg-primary-600/20 text-primary-500" : "text-zinc-300 hover:bg-white/10")}>
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

// --- NEW HINDI SEARCH BAR (INLINED WITH HPI) ---
const HindiSearchBar = ({ onClose, isActive, setIsActive, onToggleMode }: { onClose: () => void; isActive: boolean; setIsActive: (active: boolean) => void; onToggleMode: () => void; }) => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
  
    useEffect(() => {
      const delay = setTimeout(async () => {
        if (query.trim().length > 1) {
          setIsLoading(true);
          try {
            // Using HPI Client - Suggestions Endpoint
            const data = await hpi.desidub.getSuggestions(query);
            if (Array.isArray(data)) {
                setSuggestions(data.slice(0, 5));
            } else if ((data as any)?.items) {
                setSuggestions((data as any).items.slice(0, 5));
            }
          } catch (e) { setSuggestions([]); } finally { setIsLoading(false); }
        } else setSuggestions([]);
      }, 400);
      return () => clearTimeout(delay);
    }, [query]);
  
    const handleSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsActive(false);
      const params = new URLSearchParams();
      if (query) params.set('keyword', query);
      router.push(`/search/hindi?${params.toString()}`);
    };
  
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQuery('');
        setIsActive(false);
        onClose(); 
    };
  
    return (
      <div 
          className="w-full h-full flex items-center relative group"
          onClick={() => !isActive && setIsActive(true)}
      >
        <div className="h-full w-10 flex items-center justify-center shrink-0 text-orange-500">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Languages className="w-4 h-4" />}
        </div>
  
        <form onSubmit={handleSubmit} className="flex-1 h-full flex items-center relative">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onFocus={() => setIsActive(true)} 
            placeholder="Search Hindi/Dubbed Anime..."
            className="bg-transparent border-none outline-none focus:ring-0 text-white placeholder-zinc-500 text-[11px] md:text-xs h-full w-full pr-2 font-medium" 
          />
        </form>
  
        <div className="flex items-center gap-1 pr-1.5">
          {query && <button onClick={handleSubmit} className="p-1 bg-orange-600 text-white rounded-full hover:bg-orange-700 shadow-lg"><ArrowRight size={12} /></button>}
          {(query || isActive) && (
              <button 
                  onClick={handleClose} 
                  className={cn("p-1 text-zinc-500 hover:text-white", !query && "md:hidden")}
              >
                  <X size={12} />
              </button>
          )}
        </div>
  
        <AnimatePresence>
          {isActive && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/95 border border-orange-500/20 rounded-2xl shadow-2xl p-1 z-50">
                  {suggestions.map((s: any) => (
                      <div key={s.id} onClick={() => router.push(`/hindi-watch/${s.id}`)} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-xl cursor-pointer group transition-all">
                          {/* HPI Data Mapping */}
                          <img src={s.image || s.poster || '/images/no-poster.png'} className="w-8 h-10 object-cover rounded bg-zinc-800" alt="" />
                          <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white truncate group-hover:text-orange-500">{s.title}</div>
                              <div className="text-[9px] text-zinc-500 font-medium uppercase">
                                  Hindi • {s.type || "TV"} • {s.episodeCount || s.episode || '?'} EPS
                              </div>
                          </div>
                      </div>
                  ))}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
};

const SearchBarContent = ({ query, setQuery, isHindiMode, setIsHindiMode, showFilters, setShowFilters, handleSearchSubmit, filters, setFilters, toggleGenre, suggestions, handleSuggestionClick, router, compact = false, onCloseMobile, onReset, waveTrigger, isLoadingSearch }: any) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center relative pl-10 pr-1"
        >
             <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                <LightWave trigger={waveTrigger} delay={0.2} />
             </div>

             {isHindiMode ? (
                 <div className="flex w-full h-full items-center pl-1 relative z-10">
                    <HindiSearchBar onClose={() => { setShowFilters(false); if (onCloseMobile) onCloseMobile(); }} isActive={!compact} setIsActive={()=>{}} onToggleMode={() => setIsHindiMode(false)} />
                    {!compact && (
                        <div className="flex items-center ml-auto gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }} className={cn("p-1.5 rounded-full transition-colors", showFilters ? "text-primary-400 bg-primary-500/10" : "text-zinc-400 hover:text-white")}><Filter size={14} /></button>
                            <button onClick={() => router.push('/ai/imagesearch')} className="p-1.5 rounded-full text-zinc-400 hover:text-primary-500 transition-colors"><ScanSearch size={14} /></button>
                        </div>
                    )}
                 </div>
             ) : (
                 <>
                     <form onSubmit={handleSearchSubmit} className="flex-1 h-full relative overflow-visible z-10">
                         <input value={query} onChange={(e) => setQuery(e.target.value)} className="bg-transparent border-none outline-none focus:ring-0 text-white text-[11px] md:text-xs h-full w-full relative z-10 placeholder-transparent" />
                         {!query && <PlaceholderRotator />}
                     </form>
                     <div className="flex items-center gap-1 pr-1.5 shrink-0 z-10">
                         {query && <button onClick={handleSearchSubmit} className="p-1 bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-lg"><ArrowRight size={12} /></button>}
                         {(query || (!compact && typeof window !== 'undefined' && window.innerWidth < 768)) && (
                            <button onClick={(e) => { e.stopPropagation(); if(query) setQuery(''); else if(onCloseMobile) onCloseMobile(); setShowFilters(false); }} className="p-1 text-zinc-500 hover:text-white"><X size={12} /></button>
                         )}
                         {!compact && (
                             <div className="flex items-center gap-1">
                                 <button onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }} className={cn("p-1.5 rounded-full transition-colors", showFilters ? "text-primary-400 bg-primary-500/10" : "text-zinc-400 hover:text-white")}><Filter size={14} /></button>
                                 <button onClick={(e) => { e.stopPropagation(); router.push('/ai/imagesearch'); }} className="p-1.5 rounded-full text-zinc-400 hover:text-primary-500 transition-colors block"><ScanSearch size={14} /></button>
                             </div>
                         )}
                     </div>
                 </>
             )}

             <AnimatePresence>
                 {showFilters && !compact && (
                     <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl z-[100] ring-1 ring-white/5">
                         <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{isHindiMode ? 'Hindi Filters' : 'Filters'}</span>
                             <div className="flex gap-2 items-center">
                                {!isHindiMode && (
                                    <button onClick={() => router.push('/search?mode=az')} className="flex items-center gap-1 text-[9px] px-2 py-1.5 rounded-full bg-transparent text-zinc-500 border border-transparent hover:bg-white/5 transition-all"><ArrowDownAZ size={10}/> A-Z</button>
                                )}
                                <button onClick={() => { setIsHindiMode(!isHindiMode); }} className={cn("flex items-center gap-1 text-[9px] px-3 py-1.5 rounded-full border transition-all", isHindiMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10")}>
                                    <Languages size={10}/> {isHindiMode ? 'Global' : 'Hindi'}
                                </button>
                             </div>
                         </div>
                         <div className="space-y-4">
                             {isHindiMode ? (
                                 <>
                                     <div>
                                         <span className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block ml-1">Genres</span>
                                         <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                             {HINDI_GENRES.map(g => (<button key={g} onClick={() => toggleGenre(g)} className={cn("px-2.5 py-1 rounded-md text-[9px] font-bold border transition-all", filters.genre.includes(g) ? "bg-orange-600 border-orange-500 text-white" : "bg-white/5 border-white/5 text-zinc-400")}>{g}</button>))}
                                         </div>
                                     </div>
                                     <div>
                                         <span className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block ml-1">Audio</span>
                                         <div className="flex flex-wrap gap-2">
                                             {HINDI_LANGUAGES.map(lang => (
                                                 <button key={lang} onClick={() => setFilters((p:any) => ({...p, language: p.language === lang ? "" : lang}))} className={cn("flex items-center justify-between px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase", filters.language === lang ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-white/10 bg-white/5 text-zinc-400")}>
                                                     {lang} {filters.language === lang && <CheckCircle size={10} />}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </>
                             ) : (
                                 <>
                                     <div>
                                         <span className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block ml-1">Genres</span>
                                         <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                             {GENRES.map(g => (<button key={g} onClick={() => toggleGenre(g)} className={cn("px-2.5 py-1 rounded-md text-[9px] font-bold border transition-all", filters.genre.includes(g) ? "bg-primary-600 border-primary-500 text-white" : "bg-white/5 border-white/5 text-zinc-400")}>{g}</button>))}
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                         <CustomSelect label="Season" icon={Calendar} options={SEASONS} value={filters.season} onChange={(v: string) => setFilters((p:any) => ({...p, season: v}))} />
                                         <CustomSelect label="Year" icon={Layers} options={YEARS} value={filters.year} onChange={(v: string) => setFilters((p:any) => ({...p, year: v}))} />
                                         <CustomSelect label="Format" icon={Tv} options={TYPES} value={filters.type} onChange={(v: string) => setFilters((p:any) => ({...p, type: v}))} />
                                         <CustomSelect label="Status" icon={Info} options={STATUS} value={filters.status} onChange={(v: string) => setFilters((p:any) => ({...p, status: v}))} />
                                     </div>
                                 </>
                             )}
                             <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                 <button onClick={onReset} className="flex items-center gap-1.5 text-[9px] text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"><RotateCcw size={10} /> Reset</button>
                                 <div className="flex gap-2">
                                     <Button size="sm" variant="ghost" className="h-8 text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 rounded-full border border-white/5"><Dices size={12} className="mr-1.5"/> Random</Button>
                                     <Button size="sm" onClick={handleSearchSubmit} className={cn("h-8 text-[10px] text-white px-6 rounded-full shadow-lg", isHindiMode ? "bg-orange-600 hover:bg-orange-700" : "bg-primary-600 hover:bg-primary-700")}>Apply</Button>
                                 </div>
                             </div>
                         </div>
                     </motion.div>
                 )}
                 {query.length > 1 && suggestions.length > 0 && !showFilters && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl p-1 z-[100]">
                         {suggestions.map((s: SearchResult) => (
                             <div key={s.id} onClick={() => handleSuggestionClick(s.id)} className="flex items-center gap-3 p-1.5 hover:bg-white/10 rounded-xl cursor-pointer group transition-all">
                                 <img src={s.image || s.poster || '/images/no-poster.png'} className="w-9 h-12 object-cover rounded-lg bg-zinc-800 shadow-md" alt="" />
                                 <div className="min-w-0 flex-1">
                                     <div className="text-xs font-bold text-white truncate group-hover:text-primary-500">{s.title}</div>
                                     <div className="text-[9px] text-zinc-500 font-medium uppercase mt-0.5">{s.duration || '?'} • {s.type} • {s.releaseDate || '?'}</div>
                                 </div>
                             </div>
                         ))}
                         <div onClick={() => handleSearchSubmit()} className="p-2 mt-1 border-t border-white/5 text-center text-[9px] font-bold text-zinc-500 hover:text-white cursor-pointer uppercase tracking-widest">See All Results</div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </motion.div>
    );
};

// --- WHISPER ISLAND CONTENT (Inner) ---
function WhisperIslandContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const wrapperRef = useRef<HTMLDivElement>(null);
  const voiceLock = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null); 
  
  const { profile, savedAccounts, isLoading, signOut } = useAuth(); // Import signOut here
  const isAuthenticated = !!(profile && profile.id && !profile.is_guest);   
  const { settings, updateSetting } = useSettings(); 
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoState, setLogoState] = useState(0);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [filters, setFilters] = useState({ genre: [] as string[], season: "", year: "", type: "", status: "", sort: "newest", language: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [isHindiMode, setIsHindiMode] = useState(false);
  const [activeNotif, setActiveNotif] = useState<any | null>(null);
  const [centerMode, setCenterMode] = useState<any>('SEARCH_SOLO');
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [isSwitchingNotif, setIsSwitchingNotif] = useState(false);
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice State
  const [voices, setVoices] = useState<any[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false); 

  useEffect(() => {
    if (searchParams.has('guild-pass')) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }));
    }
  }, [searchParams]);

  // ✅ 1. STABLE LISTENER (INITIALIZE FIRST)
  const activeNotifRef = useRef(activeNotif);
  useEffect(() => { activeNotifRef.current = activeNotif; }, [activeNotif]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); window.addEventListener('resize', handleResize);
    const logoInterval = setTimeout(() => setLogoState(p => (p + 1) % 3), logoState === 2 ? 15000 : 5000);
    const handleClickOutside = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) { setShowFilters(false); setIsMobileSearchExpanded(false); if (centerMode === 'ISLAND_DETAILS') setCenterMode('ISLAND_FOCUSED'); } };
    document.addEventListener("mousedown", handleClickOutside);

    const handleWhisper = async (e: any) => {
        const newNotif = { 
            id: e.detail.id.toString(), type: e.detail.type, title: e.detail.title, content: e.detail.message, link: e.detail.link 
        };
        
        if (newNotif.type === 'warning' || newNotif.type === 'GUILD_WARNING') {
            const audio = new Audio('/sfx/warning.mp3'); audio.volume = 0.5; audio.play().catch(() => {});
        }

        if (activeNotifRef.current) { 
            setIsSwitchingNotif(true); 
            await new Promise(r => setTimeout(r, 400)); 
            setActiveNotif(newNotif); 
            setIsSwitchingNotif(false); 
        } else { 
            setActiveNotif(newNotif); 
        }

        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
        notifTimerRef.current = setTimeout(() => { setActiveNotif(null); }, 8000);
    };

    if (typeof window !== 'undefined') window.addEventListener('shadow-whisper', handleWhisper);

    let channel: any = null;
    if (profile?.id) {
        channel = supabase.channel('whisper-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload: any) => {
            const dbNotif = payload.new;
            let title = 'New Notification'; let type = 'system';
            if (dbNotif.type === 'GUILD_WARNING') { title = 'Guild Receptionist'; type = 'warning'; }
            window.dispatchEvent(new CustomEvent('shadow-whisper', { detail: { id: Date.now(), type: type, title: title, message: dbNotif.content } }));
        }).subscribe();
    }

    return () => { 
        window.removeEventListener('resize', handleResize); 
        document.removeEventListener("mousedown", handleClickOutside); 
        clearTimeout(logoInterval); 
        if (typeof window !== 'undefined') window.removeEventListener('shadow-whisper', handleWhisper);
        if (channel) supabase.removeChannel(channel);
    };
  }, [profile, logoState]); 

  // ✅ 2. WELCOME / GREETING LOGIC (With Cleanup)
  useEffect(() => {
    if (isLoading || voiceLock.current) return; 
    
    let timer: NodeJS.Timeout;

    if (typeof window !== 'undefined') {
        const hasVisitedHistory = localStorage.getItem('shadow_visited_history');
        const isJustRegistered = sessionStorage.getItem('shadow_just_registered');
        const welcomeShownSession = sessionStorage.getItem('shadow_welcome_shown');

        const delayedDispatch = (title: string, msg: string) => {
            timer = setTimeout(() => {
                dispatchWhisper(title, msg);
            }, 800); 
        };

        if (isJustRegistered && profile) {
            voiceLock.current = true;
            playVoice('REGISTER');
            delayedDispatch('Guild Receptionist', 'Thanks for registering at Shadow Garden. You are now registered as an adventurer. Go to profile for updating your guild card as you wish. And good luck with your adventurer journey.');
            sessionStorage.removeItem('shadow_just_registered');
            sessionStorage.setItem('shadow_welcome_shown', 'true');
            localStorage.setItem('shadow_visited_history', 'true');
        }
        else if (!profile && !hasVisitedHistory) {
            voiceLock.current = true;
            playVoice('WELCOME');
            delayedDispatch('Guild Receptionist', 'Welcome to Shadow Garden. This is a sanctuary for those who seek the wisdom of anime. What brings you here today, traveler? Want to register as an adventurer? Or you may look around for today.');
            localStorage.setItem('shadow_visited_history', 'true');
            sessionStorage.setItem('shadow_welcome_shown', 'true');
        }
        else if (!welcomeShownSession) {
            voiceLock.current = true;
            if (profile && !profile.is_guest) {
                const role = profile.role;
                if (role === 'admin' || role === 'moderator') {
                    playVoice('GREET_MASTER');
                    delayedDispatch('Guild Receptionist', 'Welcome back, Master. The shadows await your command.');
                } else {
                    playVoice('GREET_ADVENTURER');
                    delayedDispatch('Guild Receptionist', 'Welcome back, Adventurer. It is good to see you again.');
                }
            } else {
                playVoice('GREET_TRAVELER');
                delayedDispatch('Guild Receptionist', 'Greetings, Traveler. Do you wish to join our ranks today?');
            }
            sessionStorage.setItem('shadow_welcome_shown', 'true');
        }
    }

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [profile, isLoading]);

  useEffect(() => { setMounted(true); refreshVoiceCache(); }, []);
  
  // Voice Fetching
  useEffect(() => {
      if (mounted && settingsOpen && !voicesLoaded) {
          const fetchAsync = async () => {
             const { data } = await supabase.from('voice_packs').select('*');
             const dbVoices = data || [];
             const normalizedDB = dbVoices.map((v: any) => ({
                 id: v.id, name: v.character || v.name, language: v.language || 'en', gender: 'Unknown', preview: v.file_url, is_db: true
             }));
             setVoices([...LOCAL_VOICE_PACKS, ...normalizedDB]);
             setVoicesLoaded(true);
          }
          fetchAsync();
      }
  }, [mounted, settingsOpen, voicesLoaded]);

  // Voice Preview
  const handleVoicePreview = (charName: string, clips: string[]) => {
      if (!clips || clips.length === 0) return;
      const randomUrl = clips[Math.floor(Math.random() * clips.length)];
      if (playingVoice === charName) { audioRef.current?.pause(); setPlayingVoice(null); } 
      else {
          if (audioRef.current) audioRef.current.pause();
          audioRef.current = new Audio(randomUrl);
          audioRef.current.volume = settings.whisperVolume || 0.8; 
          audioRef.current.onended = () => setPlayingVoice(null);
          audioRef.current.play().catch(() => {});
          setPlayingVoice(charName);
      }
  };

  const selectVoicePack = (name: string, lang: string) => {
      updateSetting('whisperVoice', name);
      dispatchWhisper('System', `Voice pact formed with ${name}.`);
  };

  const voiceLibrary = useMemo(() => {
      return voices.reduce((acc: any, v: any) => {
          const lang = v.language || 'en';
          if (!acc[lang]) acc[lang] = {};
          const charName = v.name || 'Unknown';
          if (!acc[lang][charName]) acc[lang][charName] = { name: charName, gender: v.gender, clips: [] };
          if (v.preview) acc[lang][charName].clips.push(v.preview);
          return acc;
      }, {});
  }, [voices]);

  // --- MISSING GLOBAL SEARCH EFFECT RESTORED ---
  useEffect(() => {
    if (isHindiMode) return; 
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoadingSearch(true);
        try {
          const results = await AnimeService.getSearchSuggestions(query);
          setSuggestions(results || []);
        } catch (e) {
          setSuggestions([]);
        } finally {
          setIsLoadingSearch(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query, isHindiMode]);

  useEffect(() => {
    if (!activeNotif) setCenterMode('SEARCH_SOLO');
    else if (centerMode === 'SEARCH_SOLO') setCenterMode('ISLAND_FOCUSED');
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    if (activeNotif && centerMode !== 'ISLAND_DETAILS') notifTimerRef.current = setTimeout(() => setActiveNotif(null), 8000);
  }, [activeNotif, centerMode]);

  const handleSearchSubmit = (e?: React.FormEvent) => { if(e) e.preventDefault(); const params = new URLSearchParams(); if (query) params.set('keyword', query); if (filters.genre.length > 0) params.set('genres', filters.genre.join(',').toLowerCase()); if (filters.sort) params.set('sort', filters.sort); if (filters.language) params.set('lang', filters.language.toLowerCase()); const route = isHindiMode ? '/search/hindi' : '/search'; router.push(`${route}?${params.toString()}`); setShowFilters(false); };
  const toggleGenre = (g: string) => setFilters(prev => ({ ...prev, genre: prev.genre.includes(g) ? prev.genre.filter(i => i !== g) : [...prev.genre, g] }));
  const handleSuggestionClick = (id: string) => { setQuery(''); router.push(`/watch/${id}`); };
  const activateSearchFocus = (e: React.MouseEvent) => { e.stopPropagation(); setCenterMode('SEARCH_FOCUSED'); };
  const activateIslandFocus = (e: React.MouseEvent) => { e.stopPropagation(); setCenterMode('ISLAND_FOCUSED'); };
  const activateIslandDetails = (e: React.MouseEvent) => { e.stopPropagation(); if(centerMode === 'ISLAND_DETAILS') setCenterMode('ISLAND_FOCUSED'); else setCenterMode('ISLAND_DETAILS'); };
  const dismissNotification = (e: React.MouseEvent) => { e.stopPropagation(); setActiveNotif(null); };
  const handleHindiToggle = () => { setIsHindiMode(!isHindiMode); setShowFilters(false); };
  const closeMobileExpand = () => { setIsMobileSearchExpanded(false); };
  const resetFilters = () => setFilters({ genre: [], season: "", year: "", type: "", status: "", sort: "newest", language: "" });
  const shouldHideExtras = isMobile && (isMobileSearchExpanded || centerMode === 'ISLAND_DETAILS' || activeNotif);

  const getBadge = (role: string | undefined) => {
      switch(role) {
          case 'admin': return { label: 'Guild Master', color: 'bg-red-500/20 text-red-500 border-red-500/30' };
          case 'moderator': return { label: 'Guild Manager', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' };
          case 'user': return { label: 'Adventurer', color: 'bg-green-500/20 text-green-500 border-green-500/30' };
          default: return { label: 'Traveler', color: 'bg-zinc-500/20 text-zinc-500 border-zinc-500/30' };
      }
  };
  const badge = getBadge(profile?.role);

  if (!mounted) return <div className="fixed top-0 h-16 w-full z-[9999]" />;

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-[9999] pt-2 px-2 sm:px-4 pointer-events-none font-sans h-auto min-h-[64px]">
        <div className="w-full md:w-[90%] max-w-6xl md:max-w-none mx-auto flex items-start justify-between gap-2 pointer-events-none relative transition-all duration-500 ease-in-out">
            
            {/* LOGO */}
            <motion.div className="pointer-events-auto z-40 shrink-0">
               <motion.div layout initial={false} animate={{ width: shouldHideExtras ? 48 : (isMobile ? 120 : 230) }} transition={FLUID_TRANSITION} className={cn(`bg-black/40 backdrop-blur-xl border border-white/10 rounded-full ${ISLAND_HEIGHT} flex items-center shadow-lg overflow-hidden cursor-pointer hover:bg-black/50 relative`)} onClick={() => router.push('/home')}>
                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><LightWave trigger={logoState} delay={0} /></div>
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center z-50 bg-[#0a0a0a] rounded-full border border-white/10"><ShadowLogo size="w-8 h-8" /></div>
                    <div className="w-full h-full flex items-center justify-center pl-11 pr-2 relative z-10 overflow-hidden">
                        <AnimatePresence mode="popLayout">
                            <motion.div key={logoState} variants={glitchVariants} initial="initial" animate="animate" exit="exit" className="flex items-center gap-1.5 whitespace-nowrap">
                                {shouldHideExtras ? null : ( 
                                    <>
                                        <div className="hidden md:flex items-center gap-1.5">{logoState === 0 && <span className={`text-xl tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-800 ${demoness.className}`}>SHADOW</span>}{logoState === 1 && <span className={`text-2xl tracking-widest text-white drop-shadow-primary-glow ${hunters.className}`}>GARDEN</span>}{logoState === 2 && <><span className={`text-lg text-primary-600 ${demoness.className}`}>SHADOW</span><span className={`text-lg text-white ${hunters.className}`}>GARDEN</span></>}</div>
                                        <div className="md:hidden flex items-center">{logoState === 2 ? <span className={`text-sm tracking-widest text-primary-600 ${demoness.className}`}>SHADOW</span> : <>{logoState === 0 && <span className={`text-sm tracking-widest text-primary-600 ${demoness.className}`}>SHADOW</span>}{logoState === 1 && <span className={`text-base tracking-widest text-white ${hunters.className}`}>GARDEN</span>}</>}</div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>

            {/* MIDDLE (SEARCH) */}
            <div className="flex-1 flex items-start justify-center pointer-events-auto z-50 min-w-0 w-full">
                <LayoutGroup>
                    <div className="flex items-start justify-center gap-2 w-full h-full relative">
                        {centerMode === 'SEARCH_SOLO' && (<motion.div layoutId="main-capsule" transition={FLUID_TRANSITION} onClick={() => isMobile && setIsMobileSearchExpanded(true)} className={cn(`relative bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] ${ISLAND_HEIGHT} flex items-center w-full`)}><div className="absolute left-1 h-full w-10 flex items-center justify-center z-10 pointer-events-none">{isLoadingSearch ? <Loader2 className="w-4 h-4 animate-spin text-primary-500"/> : <Search size={16} className="text-zinc-400" />}</div><SearchBarContent query={query} setQuery={setQuery} isHindiMode={isHindiMode} setIsHindiMode={handleHindiToggle} showFilters={showFilters} setShowFilters={setShowFilters} isLoadingSearch={isLoadingSearch} handleSearchSubmit={handleSearchSubmit} filters={filters} setFilters={setFilters} toggleGenre={toggleGenre} suggestions={suggestions} handleSuggestionClick={handleSuggestionClick} router={router} compact={isMobile && !isMobileSearchExpanded} onCloseMobile={closeMobileExpand} onReset={resetFilters} waveTrigger={logoState} /></motion.div>)}
                        {(centerMode === 'ISLAND_FOCUSED' || centerMode === 'ISLAND_DETAILS') && activeNotif && (
                            <>
                                <motion.div layoutId="search-bubble" transition={FLUID_TRANSITION} onClick={activateSearchFocus} className={cn(`flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)] ${ISLAND_HEIGHT} w-10 md:w-12 shrink-0 cursor-pointer z-40`)}><Search size={16} className="text-zinc-300" /></motion.div>
                                <motion.div layoutId="main-capsule" transition={FLUID_TRANSITION} onClick={activateIslandDetails} className={cn("relative overflow-hidden bg-[#0a0a0a]/95 border-primary-500/30 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] rounded-[2rem] cursor-pointer z-50", isSwitchingNotif ? `${ISLAND_HEIGHT} w-10 md:w-12 flex items-center justify-center` : centerMode === 'ISLAND_DETAILS' ? "w-[95vw] max-w-lg p-5 flex flex-col gap-3 h-auto" : `${ISLAND_HEIGHT} px-4 w-fit min-w-[250px] max-w-full flex items-center justify-center`)}>
                                    <AnimatePresence mode="wait">
                                        {isSwitchingNotif ? <motion.div key="switch-icon" initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.8, opacity:0}}>{getNotifIcon(activeNotif.type)}</motion.div> : centerMode === 'ISLAND_DETAILS' ? (<motion.div key="details" layout="position" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-5}} className="w-full"><div className="flex justify-between items-start w-full mb-3"><div className="flex items-center gap-3"><div className="p-2 rounded-full bg-white/5 border border-white/10">{getNotifIcon(activeNotif.type)}</div><span className={`text-lg text-white ${hunters.className} tracking-wide`}>{activeNotif.title}</span></div><div role="button" onClick={dismissNotification} className="p-2 hover:bg-white/10 rounded-full bg-white/5 border border-white/5 transition-colors"><X size={16} className="text-white/70 hover:text-white"/></div></div><p className="text-sm text-zinc-300 leading-relaxed mb-4 font-normal normal-case text-center">{activeNotif.content}</p>{activeNotif.link && <Button size="sm" onClick={(e)=>{e.stopPropagation(); router.push(activeNotif.link!)}} className="w-full h-9 bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white border border-primary-500/20 font-bold uppercase tracking-wider text-xs">View Intel</Button>}</motion.div>) : (<motion.div key="compact" layout="position" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center justify-center gap-3 w-full whitespace-nowrap"><div className="shrink-0">{getNotifIcon(activeNotif.type)}</div><div className="flex flex-col min-w-0 flex-1 overflow-hidden items-center"><span className={`text-xs text-white truncate ${hunters.className} tracking-wider`}>{activeNotif.title}</span><span className="text-[10px] text-zinc-400 truncate normal-case">{activeNotif.content}</span></div></motion.div>)}
                                    </AnimatePresence>
                                </motion.div>
                            </>
                        )}
                        {centerMode === 'SEARCH_FOCUSED' && activeNotif && (
                            <>
                                <motion.div layoutId="main-capsule" transition={FLUID_TRANSITION} className={cn(`relative bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] w-full ${ISLAND_HEIGHT} flex items-center`)}>
                                    <div className="absolute left-1 h-full w-10 flex items-center justify-center z-10 pointer-events-none">{isLoadingSearch ? <Loader2 className="w-4 h-4 animate-spin text-primary-500"/> : <Search size={16} className="text-zinc-400" />}</div>
                                    <SearchBarContent query={query} setQuery={setQuery} isHindiMode={isHindiMode} setIsHindiMode={handleHindiToggle} showFilters={showFilters} setShowFilters={setShowFilters} isLoadingSearch={isLoadingSearch} handleSearchSubmit={handleSearchSubmit} filters={filters} setFilters={setFilters} toggleGenre={toggleGenre} suggestions={suggestions} handleSuggestionClick={handleSuggestionClick} router={router} onReset={resetFilters} waveTrigger={logoState} />
                                </motion.div>
                                <motion.div layoutId="island-body" transition={FLUID_TRANSITION} onClick={activateIslandFocus} className={cn(`flex items-center justify-center rounded-full bg-[#0a0a0a]/95 border border-primary-500/30 hover:border-primary-500 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] ${ISLAND_HEIGHT} w-10 md:w-12 shrink-0 cursor-pointer`)}><motion.div layout="position">{getNotifIcon(activeNotif.type)}</motion.div></motion.div>
                            </>
                        )}
                    </div>
                </LayoutGroup>
            </div>

            {/* --- RIGHT SECTION (ACTIONS + PROFILE + GOODBYE LOGIC) --- */}
            <motion.div layout className="pointer-events-auto z-40 shrink-0 flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                    {!shouldHideExtras && (
                        <motion.div key="actions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: "circOut" }} className="flex items-center gap-2">
                            {/* Alpha Button */}
                            <button onClick={() => router.push('/ai')} className={cn(`relative overflow-hidden flex items-center justify-center bg-gradient-to-r from-primary-950/80 to-black border border-primary-500/30 hover:border-primary-500 text-white font-bold rounded-full shadow-lg transition-all ${ISLAND_HEIGHT} px-3 gap-2 shrink-0`)}>
                                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full"><LightWave trigger={logoState} delay={0.6} /></div>
                                <Bot size={16} className="text-primary-400" /> 
                                <span className="hidden sm:inline text-[9px] tracking-widest uppercase">ALPHA</span>
                            </button>
                            
                            {/* Notification Button */}
                            <div className={cn(`relative ${ISLAND_HEIGHT} w-10 md:w-12 shrink-0 z-50`)}>
                                <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/50 overflow-hidden">
                                    <LightWave trigger={logoState} delay={0.7} />
                                </div>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <Notifications />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <motion.div layout transition={FLUID_TRANSITION} className="relative overflow-hidden rounded-full">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"><LightWave trigger={logoState} delay={0.8} /></div>
                    <DropdownMenu modal={false} onOpenChange={setSettingsOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="outline-none">
                                <div className={cn(`${ISLAND_HEIGHT} w-10 md:w-12 rounded-full p-[2px] bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center`)}>
                                    <Avatar className="w-full h-full rounded-full border border-white/10 p-0.5">
                                        {profile?.avatar_url ? (
                                            <AvatarImage src={profile.avatar_url} className="object-cover rounded-full" />
                                        ) : (
                                            <ShadowAvatar gender={profile?.gender || 'male'} />
                                        )}
                                    </Avatar>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-zinc-300 p-3 rounded-2xl z-[101] shadow-2xl">
                            {isAuthenticated ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-2 py-1">
                                        <div className="relative">
                                            <Avatar className="w-10 h-10 border border-white/10">
                                                <AvatarImage src={profile?.avatar_url} className="object-cover" />
                                                <ShadowAvatar gender={profile?.gender || 'male'} />
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-white uppercase tracking-widest">{profile?.username || 'Shadow Agent'}</span>
                                            <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border w-fit mt-1 ${badge.color}`}>{badge.label}</div>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <div className="space-y-1">
                                        <DropdownMenuItem asChild><Link href="/profile" className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><User size={14} className="mr-3 text-zinc-400" /> Profile</Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link href="/watchlist" className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><LayoutGrid size={14} className="mr-3 text-zinc-400" /> Avatar</Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link href="/settings" className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Settings size={14} className="mr-3 text-zinc-400" /> Settings</Link></DropdownMenuItem>
                                    </div>

                                    <DropdownMenuSeparator className="bg-white/5" />
                                    
                                    {savedAccounts.length < 2 ? (
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } })); }} className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-zinc-400 font-bold">
                                            <Plus size={14} className="mr-3" /> Add Profile
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={async (e) => { 
                                            e.preventDefault(); 
                                            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ACCOUNTS' } })); 
                                        }} className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-zinc-400 font-bold">
                                            <Users size={14} className="mr-3" /> Switch Profile
                                        </DropdownMenuItem>
                                    )}

                                    {/* ✅ FIXED: GUARANTEED RELOAD LOGIC */}
                                    <DropdownMenuItem onClick={(e) => { 
                                        e.preventDefault(); 
                                        
                                        const role = profile?.role;
                                        let goodbyeMessage = '';
                                        let voiceKey: "BYE_MASTER" | "BYE_ADVENTURER" = "BYE_ADVENTURER";
                                        
                                        if (role === 'admin' || role === 'moderator') {
                                            goodbyeMessage = 'See you again, Master. Have a nice day. Goodbye.';
                                            voiceKey = 'BYE_MASTER'; 
                                        } else {
                                            goodbyeMessage = 'See you again, Adventurer. Have a nice day. Goodbye.';
                                            voiceKey = 'BYE_ADVENTURER'; 
                                        }
                                        
                                        // 1. Play Voice
                                        playVoice(voiceKey);
                                        dispatchWhisper('Guild Receptionist', goodbyeMessage);
                                        
                                        // 2. Prepare for next user (CLEAR THE FLAG)
                                        // This ensures the next user sees their welcome message
                                        if (typeof window !== 'undefined') {
                                            sessionStorage.removeItem('shadow_welcome_shown'); 
                                            // Ensure we DON'T suppress the next welcome
                                            sessionStorage.removeItem('shadow_suppress_welcome');
                                        }

                                        // 3. Trigger Background SignOut (Fire & Forget)
                                        signOut().catch(() => {});

                                        // 4. Force Reload Timer (Starts immediately)
                                        setTimeout(() => {
                                            if (typeof window !== 'undefined') {
                                                window.location.reload(); 
                                            }
                                        }, 4000);

                                    }} className="text-red-500 cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs py-2 rounded-lg font-bold">
                                        <LogOut size={14} className="mr-3" /> Leave
                                    </DropdownMenuItem>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="px-2 py-1.5">
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Status</div>
                                        <div className="text-sm font-black text-white">Traveler</div>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem asChild><Link href="/settings" className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-bold"><Settings size={14} className="mr-3 text-zinc-400" /> Settings</Link></DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } })); }} className="flex items-center w-full text-xs py-2 cursor-pointer hover:bg-primary/20 text-primary-400 rounded-lg transition-colors font-bold">
                                        <LogIn size={14} className="mr-3" /> Enter
                                    </DropdownMenuItem>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </motion.div>
            </motion.div>
        </div>
    </div>
  );
}

export default function WhisperIsland() {
    return (
        <Suspense fallback={<div className="fixed top-0 h-16 w-full z-[9999]" />}>
            <WhisperIslandContent />
        </Suspense>
    );
}