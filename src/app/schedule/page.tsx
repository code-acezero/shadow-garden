"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Calendar, ChevronLeft, ChevronRight, 
  PlayCircle, Timer, AlertCircle, Layers, Star, 
  CheckCircle, PlusCircle, Flame, Clock, Captions, Mic, Info, X,
  Compass, Film
} from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { cn, slugifyTitle } from '@/lib/utils';
import { AnimeService } from '@/lib/api';
import Footer from '@/components/Anime/Footer';
import CuteShareBar from '@/components/Home/CuteShareBar';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


// --- ANIMATION VARIANTS (Fixed TS Errors) ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 12 } }
};

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any, subtitle?: string }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-600/10 rounded-lg border border-primary-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <Icon size={18} className="text-primary-500" />
        </div>
        <h3 className={`text-xl md:text-2xl text-white tracking-widest font-lemon`}>
            {title}
        </h3>
    </div>
);

// --- SHARED TOOLTIP CONTENT (UI) ---
const AnimeTooltipContent = ({ displayData, isLoading }: { displayData: any, isLoading: boolean }) => {
    const data = displayData || {};
    return (
    <>
        <div className="relative h-44 w-full">
            <img 
                src={data.poster || data.image || '/images/no-poster.png'} 
                className="w-full h-full object-cover opacity-80" 
                alt={typeof data.title === 'string' ? data.title : 'Anime'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
                <span className="inline-block px-2 py-0.5 mb-2 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm font-sans">
                    {data.type || 'TV'}
                </span>
                <h4 className="text-xl font-black text-white leading-none line-clamp-2 drop-shadow-md font-sans">
                    {typeof data.title === 'string' ? data.title : data.title?.userPreferred || 'Unknown Title'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 italic font-sans">
                    {data.jname || data.japaneseTitle || ''}
                </p>
            </div>
        </div>
        <div className="p-5 space-y-4 bg-[#080808] relative font-sans">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-zinc-300">
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary-500" /> {data.stats?.duration || data.duration || '? min'}</span>
                    <span className="w-px h-3 bg-zinc-800" />
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {data.score || data.stats?.malScore || data.malScore || 'N/A'}</span>
                </div>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 rounded uppercase">
                    {data.stats?.quality || 'HD'}
                </span>
            </div>
            <p className={cn("text-xs leading-relaxed text-zinc-400 line-clamp-4", isLoading && "opacity-50")}>
                {data.description || "Classified Intel."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                    <Captions size={12} className="text-zinc-500" />
                    <span className="text-xs font-bold text-white">{data.episodes?.sub ?? '?'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                    <Mic size={12} className="text-zinc-500" />
                    <span className="text-xs font-bold text-white">{data.episodes?.dub ?? '?'}</span>
                </div>
            </div>
        </div>
    </>
    );
};

// --- MOBILE INFO BUTTON (With Close X) ---
const MobileInfoBtn = ({ anime }: { anime: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: details, isLoading } = useSWR(
        anime?.id && isOpen ? `anime-details-${anime.id}` : null,
        () => AnimeService.getAnimeInfo(anime.id).catch(() => null),
        { revalidateOnFocus: false, shouldRetryOnError: false }
    );
    const displayData = details || anime || {};

    return (
        <div 
            className="md:hidden absolute z-40 p-2" 
            style={{ top: 0, right: 0 }} 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button className="w-6 h-6 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-90 transition-transform">
                        <Info size={12} />
                    </button>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-[300px] p-0 bg-[#080808] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative" 
                    side="left" 
                    align="start"
                    sideOffset={5}
                >
                    {/* CLOSE BUTTON */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-3 right-3 z-50 p-1.5 bg-black/50 hover:bg-primary-600/80 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors"
                    >
                        <X size={14} />
                    </button>

                    <AnimeTooltipContent displayData={displayData} isLoading={isLoading} />
                </PopoverContent>
            </Popover>
        </div>
    );
};

// --- DESKTOP HOVER QTIP ---
const QTip = ({ trigger, anime, side = "right" }: { trigger: React.ReactNode, anime: any, side?: "left" | "right" | "top" | "bottom" }) => {
  const { data: details, isLoading } = useSWR(
    anime?.id ? `anime-details-${anime.id}` : null,
    () => AnimeService.getAnimeInfo(anime.id).catch(() => null),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const displayData = details || anime || {};

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent 
        className="hidden md:block w-[340px] p-0 bg-[#080808] border border-white/10 rounded-2xl shadow-[0_0_50px_-10px_rgba(220,38,38,0.15)] z-50 ring-1 ring-white/5 overflow-hidden" 
        side={side} 
        align="start" 
        sideOffset={15}
        avoidCollisions={true}
      >
        <AnimeTooltipContent displayData={displayData} isLoading={isLoading} />
      </HoverCardContent>
    </HoverCard>
  )
}

const ScheduleCard = ({ anime }: { anime: any }) => {
    const isHindi = anime.isHindi || !!anime.dubType;
    const isDonghua = anime.category === 'donghua' || anime.countryOfOrigin === 'CN';
    const isMovie = anime.category === 'movie' || anime.format === 'MOVIE' || anime.type === 'Movie';

    return (
        <motion.div variants={itemVariants} className="relative group">
            <MobileInfoBtn anime={anime} />
            <QTip anime={anime} trigger={
                (() => {
                    const slug = slugifyTitle(anime.name || anime.title);
                    const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;
                    const targetHref = anime.watchUrl || `/watch/${routeId}${anime.episode ? `?ep=${anime.episode}` : ''}${anime.dubType ? `&audio=hi&type=dub` : ''}`;
                    return (
                        <Link href={targetHref} className="flex w-full items-stretch h-20 md:h-24 rounded-2xl bg-[#0f0f0f] border border-white/5 hover:border-primary-500/30 transition-all active:scale-[0.98] overflow-hidden group">
                            {/* Time / Timezone */}
                            <div className="w-16 md:w-20 bg-white/5 flex flex-col items-center justify-center border-r border-white/5 group-hover:bg-primary-600/10 group-hover:border-primary-500/20 transition-colors shrink-0">
                                <span className="text-sm md:text-base font-black text-white">{anime.time || '12:00'}</span>
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-primary-400">
                                    {anime.timezone || (isHindi ? 'IST' : 'JST')}
                                </span>
                            </div>

                            {/* Poster thumbnail if available */}
                            {anime.poster && (
                                <div className="relative w-12 md:w-16 h-full shrink-0 overflow-hidden bg-zinc-900 border-r border-white/5 hidden sm:block">
                                    <img 
                                        src={anime.poster} 
                                        alt="" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100" 
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f0f0f]/40 pointer-events-none" />
                                </div>
                            )}

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-center px-3 md:px-4 py-2 min-w-0">
                                <h3 className="text-xs md:text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate mb-1 pr-6">
                                    {anime.name || anime.title}
                                </h3>
                                <p className="text-[10px] text-zinc-500 line-clamp-1 italic mb-1.5">
                                    {anime.jname || anime.status || ''}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Category pill */}
                                    {isDonghua ? (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                            DONGHUA
                                        </span>
                                    ) : isMovie ? (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                            MOVIE
                                        </span>
                                    ) : isHindi ? (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
                                            {anime.dubType === 'ORG' ? 'HINDI DUB' : anime.dubType === 'FanDub' ? 'HINDI (FAN)' : 'HINDI DUB'}
                                        </span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary-500/15 text-primary-300 border border-primary-500/30">
                                            ANIME
                                        </span>
                                    )}

                                    <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold text-zinc-400 border border-white/5 group-hover:border-primary-500/20 group-hover:text-primary-400 transition-colors">
                                        {isMovie ? 'FILM' : `EP ${anime.episode || '?'}`}
                                    </span>

                                    {anime.score && (
                                        <span className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded text-[9px] font-bold text-zinc-400 border border-white/5">
                                            <Star size={9} className="text-yellow-500 fill-yellow-500/30" />
                                            {anime.score}
                                        </span>
                                    )}

                                    <div className="w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ml-auto shrink-0">
                                        <PlayCircle size={10} className="text-white fill-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Link>
                    );
                })()
            } />
        </motion.div>
    );
};

const CompactAnimeCard = ({ anime, rank }: { anime: any, rank?: number }) => {
    const epDisplay = typeof anime?.episodes === 'object'
        ? (anime.episodes?.sub || anime.episodes?.eps || anime.episodes?.dub || '?')
        : (anime?.episodes || '?');
    const slug = slugifyTitle(anime.title || anime.name);
    const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;

    return (
        <motion.div variants={itemVariants} className="relative group">
            <div className="absolute right-1 top-1 z-30">
                <MobileInfoBtn anime={anime} />
            </div>
            <Link href={`/watch/${routeId}`} className="flex items-center gap-3 p-2 rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                <div className="relative w-10 h-14 md:w-12 md:h-16 shrink-0 rounded-lg overflow-hidden shadow-lg">
                    <img src={anime.poster} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                    {rank && (
                        <div className={cn(
                            "absolute top-0 left-0 w-5 h-5 flex items-center justify-center text-[9px] font-black text-white rounded-br-lg",
                            rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-zinc-400" : rank === 3 ? "bg-amber-700" : "bg-zinc-800"
                        )}>
                            {rank}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-[11px] md:text-xs font-bold text-zinc-300 truncate group-hover:text-primary-400 transition-colors">
                        {anime.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 uppercase">{anime.type || 'TV'}</span>
                        <span className="text-[9px] text-zinc-500">{epDisplay} EPS</span>
                    </div>
                </div>
                <ChevronRight size={14} className="text-zinc-700 group-hover:text-white transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
        </motion.div>
    );
};

// --- TOP CHART CARD ---
interface TopChartCardProps { 
    anime: any; rank: number; index: number; 
    mobileActiveIndex: number | null; 
    onMobileClick: (index: number) => void; 
}

const TopChartCard = ({ anime, rank, index, mobileActiveIndex, onMobileClick }: TopChartCardProps) => {
    // 3D Rotations (Desktop Only)
    const cardRotation = (index % 2 === 0 ? 1 : -1) * (1.5 + (index % 2));
    const numberRotation = (index % 2 !== 0 ? 1 : -1) * (5 + (index % 3) * 3);
    
    // Position Logic
    const isMobileActive = mobileActiveIndex === index;
    const isRightEdge = (index + 1) % 3 === 0;
    const isLeftEdge = index % 3 === 0;

    let popX = 0;
    if (isRightEdge) popX = -30;
    else if (isLeftEdge) popX = 30;
    else popX = 0;

    const handleCardClick = (e: React.MouseEvent) => {
        if (window.innerWidth < 768) {
            if (!isMobileActive) {
                e.preventDefault(); 
                onMobileClick(index); 
            }
        }
    };

    const animateState = isMobileActive ? {
        x: popX, y: -40, scale: 1.15, rotate: 0, zIndex: 100, opacity: 1
    } : {
        opacity: 1, x: 0, rotate: 0, zIndex: 20 - index, y: 0, scale: 1
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={animateState}
            whileHover={{ 
                x: popX, y: -40, scale: 1.15, rotate: 0, zIndex: 100,
                transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "relative aspect-[2/3] rounded-xl overflow-visible transition-all duration-300 ease-out group w-full",
                "md:flex-shrink md:w-[14%] md:min-w-[140px] md:max-w-[180px]",
                "md:-ml-[40px] md:first:ml-0",
                "md:rotate-[var(--desktop-rotate)]"
            )}
            style={{ 
                zIndex: 20 - index, 
                transformOrigin: "bottom center",
                // @ts-ignore
                "--desktop-rotate": `${cardRotation}deg`
            }}
            onClick={handleCardClick}
        >
            {/* Mobile Info Button - Top Right of the CARD (not container) */}
            <div className="absolute top-2 right-2 z-[60]">
                <MobileInfoBtn anime={anime} />
            </div>

            <div 
                className={cn(
                    "absolute -top-8 -right-4 z-50 text-5xl md:text-8xl leading-none select-none pointer-events-none transition-transform duration-300",
                    isMobileActive ? "scale-110 -translate-y-4 rotate-0" : "group-hover:scale-110 group-hover:-translate-y-4 group-hover:rotate-0",
                    "font-gradvis"
                )}
                style={{
                    transform: `rotate(${numberRotation}deg)`,
                    color: rank <= 3 ? '#b91c1c' : '#52525b',
                    filter: rank <= 3 
                        ? `drop-shadow(2px 2px 0px #7f1d1d) drop-shadow(-1px -1px 0 #fff) drop-shadow(0px 5px 10px rgba(220,38,38,0.5))`
                        : `drop-shadow(2px 2px 0px #27272a) drop-shadow(-1px -1px 0 #a1a1aa) drop-shadow(0px 5px 5px rgba(0,0,0,0.8))`
                }}
            >
                {rank}
            </div>

            {/* QTip Removed for Top 10 List - Direct Link Used */}
            {(() => {
                const slug = slugifyTitle(anime.title || anime.name);
                const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;
                return (
                    <Link href={`/watch/${routeId}`} className={cn(
                        "block w-full h-full relative bg-[#0a0a0a] rounded-xl overflow-hidden shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)] transition-all ring-1 ring-white/10",
                        isMobileActive ? "ring-red-500/50 shadow-[0_20px_50px_rgba(220,38,38,0.3)]" : "group-hover:ring-red-500/50 group-hover:shadow-[0_20px_50px_rgba(220,38,38,0.3)]"
                    )}>
                        <div className="absolute inset-0 rounded-xl border-r border-t border-white/20 z-20 pointer-events-none" />
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/90 to-transparent z-20 pointer-events-none mix-blend-multiply" />
                        <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                        <div className={cn("absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none z-30", isMobileActive ? "opacity-100" : "group-hover:opacity-100")} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                        <div className={cn("absolute bottom-0 left-0 w-full p-3 md:p-4 transform transition-transform duration-300 z-30", isMobileActive ? "translate-y-0" : "translate-y-2 group-hover:translate-y-0")}>
                            <h3 className={cn("text-xs md:text-sm font-bold text-white line-clamp-2 leading-tight transition-colors drop-shadow-md pr-2", isMobileActive ? "text-primary-200" : "group-hover:text-primary-200")}>
                                {anime.title}
                            </h3>
                            <div className={cn("flex items-center gap-2 mt-2 transition-opacity duration-300 delay-75", isMobileActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                <span className="text-[9px] text-zinc-300 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                                    EPS {typeof anime.episodes === 'object' ? (anime.episodes?.sub || anime.episodes?.eps || anime.episodes?.dub || '?') : (anime.episodes || '?')}
                                </span>
                                {isMobileActive && (
                                    <span className="text-[9px] text-primary-400 font-bold uppercase tracking-wider">
                                        Watch
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })()}
        </motion.div>
    );
};

// --- STICKY DAY SELECTOR ---
const DaySelector = ({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) => {
    const days = useMemo(() => Array.from({ length: 21 }, (_, i) => subDays(new Date(), 14 - i)), []);
    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (selectedBtnRef.current) {
            selectedBtnRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [selectedDate]);

    return (
        <div className="w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-40 sticky top-14 md:top-16 transition-all">
            <div className="px-4 py-3 flex items-center gap-4 w-full">
                <button 
                    onClick={() => onSelect(new Date())}
                    className="hidden md:flex flex-col items-center justify-center h-[60px] px-4 rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-all shrink-0"
                >
                    <span className="text-[8px] font-black uppercase tracking-widest">Jump To</span>
                    <span className="text-sm font-bold">TODAY</span>
                </button>
                <div className="w-px h-10 bg-white/10 hidden md:block" />
                <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x w-full">
                    {days.map((date, i) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        return (
                            <button 
                                key={i} 
                                ref={isSelected ? selectedBtnRef : null}
                                onClick={() => onSelect(date)} 
                                className={cn("flex flex-col items-center justify-center min-w-[50px] md:min-w-[56px] h-[56px] md:h-[60px] rounded-xl border transition-all duration-300 snap-center shrink-0 relative overflow-hidden group", isSelected ? "bg-white text-black border-white scale-100 z-10 font-bold shadow-lg shadow-white/10" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300")}
                            >
                                <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">{format(date, 'EEE')}</span>
                                <span className={cn("text-lg md:text-xl font-black font-lemon leading-none mt-0.5", isSelected ? "text-black" : "text-zinc-400 group-hover:text-white")}>{format(date, 'dd')}</span>
                                {isToday && !isSelected && <span className="absolute top-0 inset-x-2 h-0.5 bg-primary-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

type FilterCategory = 'all' | 'anime' | 'donghua' | 'hindi' | 'movie';

const FILTER_TABS: { id: FilterCategory; label: string; icon: any; activeClass: string }[] = [
  { id: 'all', label: 'All Releases', icon: Layers, activeClass: 'bg-primary-600 text-white shadow-md shadow-primary-900/40' },
  { id: 'anime', label: 'Anime', icon: Flame, activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-900/40' },
  { id: 'donghua', label: 'Donghua', icon: Compass, activeClass: 'bg-teal-600 text-white shadow-md shadow-teal-900/40' },
  { id: 'hindi', label: 'Hindi Dub', icon: Mic, activeClass: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30' },
  { id: 'movie', label: 'Movies', icon: Film, activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-900/40' },
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [topTab, setTopTab] = useState<'today'|'week'|'month'>('week');
  const [mobileActiveIndex, setMobileActiveIndex] = useState<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (deckRef.current && !deckRef.current.contains(event.target as Node)) {
            setMobileActiveIndex(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: scheduleData, isLoading: loadingSchedule } = useSWR(
    ['unified-schedule', format(selectedDate, 'yyyy-MM-dd')],
    async ([_, date]) => {
      try {
        const [aniRes, blakiteRes] = await Promise.all([
          AnimeService.getSchedule(date).catch(() => ({ scheduledAnimes: [] })),
          fetch(`/api/blakite/schedule?date=${date}`).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        const anilistItems = (aniRes?.scheduledAnimes || []).map((item: any) => ({
          ...item,
          source: 'anilist',
          timezone: 'JST',
          category: item.category || (item.countryOfOrigin === 'CN' ? 'donghua' : (item.format === 'MOVIE' ? 'movie' : 'anime'))
        }));

        let hindiItems: any[] = [];
        let isHindiFallback = false;
        if (blakiteRes && blakiteRes.ok && blakiteRes.data) {
          const hasDirect = Array.isArray(blakiteRes.data.scheduledAnimes) && blakiteRes.data.scheduledAnimes.length > 0;
          const rawHindi = hasDirect
            ? blakiteRes.data.scheduledAnimes
            : (isSameDay(selectedDate, new Date()) ? (blakiteRes.data.allRecent || []).slice(0, 15) : []);
          
          isHindiFallback = !hasDirect && isSameDay(selectedDate, new Date()) && rawHindi.length > 0;

          hindiItems = rawHindi.map((h: any) => ({
            id: h.id,
            name: h.name || h.title,
            title: h.title || h.name,
            jname: h.jname || '',
            poster: h.poster || h.backdrop || '',
            image: h.poster || h.backdrop || '',
            time: h.time || '18:00',
            timestamp: h.timestamp || Math.floor(new Date(selectedDate).setHours(18, 0, 0, 0) / 1000),
            episode: h.episode || 1,
            seasonNumber: h.seasonNumber,
            dubType: h.dubType || 'ORG',
            category: (h.type === 'Movie' ? 'movie' : 'hindi') as FilterCategory,
            isHindi: true,
            format: h.type || 'TV',
            type: h.type || 'TV',
            score: h.score,
            description: h.description || '',
            status: h.status || 'Ongoing',
            timezone: 'IST',
            source: 'blakite',
            watchUrl: h.watchUrl || `/watch/${h.id}?ep=${h.episode || 1}&audio=hi&type=dub`
          }));
        }

        const combined = [...anilistItems, ...hindiItems].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        return {
          items: combined,
          isHindiFallback,
          hasHindiToday: hindiItems.length > 0
        };
      } catch (err) {
        console.error("Failed to load unified schedule", err);
        return { items: [], isHindiFallback: false, hasHindiToday: false };
      }
    },
    { keepPreviousData: true, shouldRetryOnError: false }
  );

  const scheduleItems = scheduleData?.items || [];

  const counts = useMemo(() => {
    return {
      all: scheduleItems.length,
      anime: scheduleItems.filter((x: any) => (x.category === 'anime' || !x.category) && !x.isHindi && x.countryOfOrigin !== 'CN' && x.format !== 'MOVIE' && x.type !== 'Movie').length,
      donghua: scheduleItems.filter((x: any) => x.category === 'donghua' || x.countryOfOrigin === 'CN').length,
      hindi: scheduleItems.filter((x: any) => x.category === 'hindi' || x.isHindi || x.dubType).length,
      movie: scheduleItems.filter((x: any) => x.category === 'movie' || x.format === 'MOVIE' || x.type === 'Movie').length,
    };
  }, [scheduleItems]);

  const filteredSchedule = useMemo(() => {
    if (filterCategory === 'all') return scheduleItems;
    if (filterCategory === 'donghua') {
      return scheduleItems.filter((x: any) => x.category === 'donghua' || x.countryOfOrigin === 'CN');
    }
    if (filterCategory === 'movie') {
      return scheduleItems.filter((x: any) => x.category === 'movie' || x.format === 'MOVIE' || x.type === 'Movie');
    }
    if (filterCategory === 'hindi') {
      return scheduleItems.filter((x: any) => x.category === 'hindi' || x.isHindi || x.dubType);
    }
    if (filterCategory === 'anime') {
      return scheduleItems.filter((x: any) => 
        (x.category === 'anime' || !x.category) && 
        !x.isHindi && 
        x.countryOfOrigin !== 'CN' && 
        x.format !== 'MOVIE' && 
        x.type !== 'Movie'
      );
    }
    return scheduleItems;
  }, [scheduleItems, filterCategory]);

  interface UpcomingResponse { response: any[]; pageInfo?: { totalPages?: number; }; }
  const { data: upcomingData } = useSWR<UpcomingResponse>(
    ['upcoming', upcomingPage],
    async ([_, page]) => {
        try {
            const res = await AnimeService.getTopUpcoming(page as number);
            return { response: Array.isArray(res) ? res : [], pageInfo: { totalPages: 1 } };
        } catch (err) {
            return { response: [], pageInfo: { totalPages: 1 } };
        }
    },
    { keepPreviousData: true, shouldRetryOnError: false }
  );

  const upcoming = upcomingData?.response || [];
  const upcomingTotalPages = upcomingData?.pageInfo?.totalPages || 1;

  const { data: dashboard } = useSWR('dashboard-all', async () => {
    try {
        const [completed, newAdded, released, popular, topTen] = await Promise.all([
            AnimeService.getCompleted().catch(() => []),
            AnimeService.getRecentlyAdded().catch(() => []),
            AnimeService.getRecentlyUpdated().catch(() => []),
            AnimeService.getMostPopular().catch(() => []),
            AnimeService.getTopTen().catch(() => null)
        ]);
        return { 
            completed: Array.isArray(completed) ? completed.slice(0, 5) : [],
            newAdded: Array.isArray(newAdded) ? newAdded.slice(0, 5) : [],
            released: Array.isArray(released) ? released.slice(0, 5) : [],
            popular: Array.isArray(popular) ? popular.slice(0, 5) : [],
            topTen: topTen || null
        };
    } catch (err) {
        console.error("Dashboard error:", err);
        return { completed: [], newAdded: [], released: [], popular: [], topTen: null };
    }
  }, { revalidateOnFocus: false, shouldRetryOnError: false });

  const topChartData = useMemo(() => {
    if (!dashboard?.topTen) return [];
    return dashboard.topTen[topTab] || [];
  }, [dashboard?.topTen, topTab]);

  const handleUpcomingPage = (dir: number) => setUpcomingPage(p => Math.max(1, Math.min(p + dir, upcomingTotalPages)));

  return (
    <div className="min-h-screen w-full pb-[68px] md:pb-0 bg-[#050505] font-sans text-zinc-100 overflow-x-hidden selection:bg-primary-500/30">
      <style jsx global>{`
        html, body { overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        body::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-900/10 blur-[120px] rounded-full mix-blend-screen opacity-30" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full">
          
          <div className="w-full px-2 sm:px-4 pt-2 sm:pt-4 pb-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-3">
                      <div className="h-px w-8 bg-primary-600" />
                      <span className={`text-primary-600 text-xs tracking-[0.3em] font-bold uppercase font-lemon`}>Guild Operations</span>
                  </div>
                  <h1 className={`text-4xl md:text-6xl text-white font-gradvis leading-none`}>
                      CHRONO<span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-primary-900">SPHERE</span>
                  </h1>
              </motion.div>
              <div className="hidden md:block text-right">
                  <span className="block text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Current Cycle</span>
                  <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-3xl font-black text-white font-lemon">{format(new Date(), 'dd')}</span>
                      <span className="text-sm text-zinc-400 uppercase font-medium">{format(new Date(), 'MMMM yyyy')}</span>
                  </div>
              </div>
          </div>

          <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

          <div className="w-full px-2 sm:px-4 mt-8 space-y-16">

              {/* SECTION 1: UNIFIED SCHEDULE GRID */}
              <section>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <SectionHeader 
                          title="Unified Schedule" 
                          icon={Calendar} 
                          subtitle={`Broadcasting lineup for ${format(selectedDate, 'EEEE, MMMM do, yyyy')}`}
                      />

                      {/* CATEGORY FILTER BUTTONS */}
                      <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar self-start lg:self-auto max-w-full">
                          {FILTER_TABS.map((tab) => {
                              const Icon = tab.icon;
                              const count = counts[tab.id];
                              const isActive = filterCategory === tab.id;
                              return (
                                  <button
                                      key={tab.id}
                                      onClick={() => setFilterCategory(tab.id)}
                                      className={cn(
                                          "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95",
                                          isActive 
                                              ? tab.activeClass 
                                              : "text-zinc-400 hover:text-white hover:bg-white/5"
                                      )}
                                  >
                                      <Icon size={13} className={isActive ? "text-white" : "text-zinc-500"} />
                                      <span>{tab.label}</span>
                                      <span className={cn(
                                          "px-1.5 py-0.2 rounded-md text-[10px] font-mono",
                                          isActive ? "bg-black/30 text-white font-black" : "bg-white/5 text-zinc-500"
                                      )}>
                                          {count}
                                      </span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  {filterCategory === 'hindi' && scheduleData?.isHindiFallback && (
                      <div className="mb-4 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
                          <Info size={14} className="shrink-0 text-orange-400" />
                          <span>No exact Hindi dub broadcast logged for this date. Showing active ongoing and recent Hindi dub updates:</span>
                      </div>
                  )}

                  {filterCategory === 'hindi' && counts.hindi === 0 && !scheduleData?.isHindiFallback && (
                      <div className="mb-4 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
                          <Info size={14} className="shrink-0 text-orange-400" />
                          <span>No Hindi dub releases found for this calendar date. Select &quot;All Releases&quot; or choose another day.</span>
                      </div>
                  )}

                  <div className="min-h-[300px]">
                      <AnimatePresence mode="wait">
                          {loadingSchedule ? (
                              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />)}
                              </motion.div>
                          ) : filteredSchedule.length > 0 ? (
                              <motion.div key={`${filterCategory}-${format(selectedDate, 'yyyy-MM-dd')}`} variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {filteredSchedule.map((anime: any, idx: number) => <ScheduleCard key={`${anime.id || 'sched'}-${anime.category}-${idx}`} anime={anime} />)}
                              </motion.div>
                          ) : (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                  <AlertCircle size={48} className="text-zinc-700 mb-4" />
                                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No scheduled releases found for this filter</p>
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </section>

              {/* SECTION 2: TOP CHARTS (OVERLAPPING DECK) */}
              <section className="relative">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                      <SectionHeader title="Dominating Charts" icon={Flame} subtitle="Most active operations currently engaged" />
                      <div className="flex p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                          {(['today', 'week', 'month'] as const).map((tab) => (
                              <button key={tab} onClick={() => setTopTab(tab)} className={cn("px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", topTab === tab ? "bg-primary-600 text-white shadow-lg shadow-primary-900/40" : "text-zinc-500 hover:text-white")}>{tab}</button>
                          ))}
                      </div>
                  </div>
                  
                  {/* OVERLAP CONTAINER - 20% Overlap Effect */}
                  <div ref={deckRef} className="w-full overflow-visible pt-10 px-4 md:px-0">
                      <motion.div 
                        key={topTab}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        // MOBILE: Grid 3 Cols. DESKTOP: Flex Row Centered
                        className="grid grid-cols-3 gap-x-3 gap-y-12 md:flex md:flex-row md:items-center md:justify-start md:gap-0"
                      >
                          {topChartData.length > 0 ? topChartData.map((anime: any, i: number) => (
                              <div key={`${anime.id || 'top'}-${i}`} className="md:contents [&:nth-child(3n+1):last-child]:col-start-2">
                                <TopChartCard 
                                    anime={anime} 
                                    rank={i + 1} 
                                    index={i}
                                    mobileActiveIndex={mobileActiveIndex}
                                    onMobileClick={setMobileActiveIndex}
                                />
                              </div>
                          )) : (
                              [...Array(10)].map((_, i) => (
                                  <div key={i} className={cn("w-full md:w-[180px] aspect-[2/3] bg-white/5 animate-pulse rounded-xl border border-white/5 md:-ml-[40px] md:first:ml-0 flex-shrink")} style={{ zIndex: 10 - i }} />
                              ))
                          )}
                      </motion.div>
                  </div>
              </section>

              {/* SECTION 3: DASHBOARD GRID */}
              <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-900/20 rounded-lg text-green-500"><CheckCircle size={16} /></div><h4 className={`text-lg text-white font-lemon`}>COMPLETED</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.completed.map((a: any, i: number) => <CompactAnimeCard key={`${a.id || 'comp'}-${i}`} anime={a} rank={i+1}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-900/20 rounded-lg text-blue-500"><PlusCircle size={16} /></div><h4 className={`text-lg text-white font-lemon`}>NEWLY ADDED</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.newAdded.map((a: any, i: number) => <CompactAnimeCard key={`${a.id || 'new'}-${i}`} anime={a}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-900/20 rounded-lg text-purple-500"><Layers size={16} /></div><h4 className={`text-lg text-white font-lemon`}>JUST UPDATED</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.released.map((a: any, i: number) => <CompactAnimeCard key={`${a.id || 'rel'}-${i}`} anime={a}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-500"><Star size={16} /></div><h4 className={`text-lg text-white font-lemon`}>FAN FAVORITES</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.popular.map((a: any, i: number) => <CompactAnimeCard key={`${a.id || 'pop'}-${i}`} anime={a} rank={i+1}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                  </div>
              </section>

              {/* SECTION 4: UPCOMING (5 Columns Grid) */}
              <section>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
                      {/* Row 1: Title (left) */}
                      <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3 w-full md:w-auto min-w-0">
                          <SectionHeader title="Incoming Recruits" icon={Timer} />
                      </div>

                      {/* Row 2 on Mobile (Full Width Page Switcher) / Right Controls on Desktop */}
                      <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
                          <CutePageSwitcher
                              page={upcomingPage}
                              maxPage={upcomingTotalPages > 1 ? upcomingTotalPages : undefined}
                              canPrev={upcomingPage > 1}
                              canNext={upcomingPage < upcomingTotalPages}
                              onPageChange={(p) => setUpcomingPage(p)}
                              variant="primary"
                              className="w-full md:w-auto justify-between md:justify-start"
                          />
                      </div>
                  </div>
                  {/* Updated to 5 Columns on LG */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-6">
                      {upcoming.length > 0 ? upcoming.map((anime: any, idx: number) => (
                          <div key={`${anime.id}-${idx}`} className="relative group">
                              <MobileInfoBtn anime={anime} />
                              <QTip anime={anime} trigger={
                                  (() => {
                                      const slug = slugifyTitle(anime.title);
                                      const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;
                                      return (
                                          <Link href={`/watch/${routeId}`} className="group relative aspect-[2/3] block rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all">
                                              <img src={anime.poster} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0" loading="lazy" />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                              <div className="absolute bottom-0 left-0 w-full p-3">
                                                  <h4 className="text-xs font-bold text-white line-clamp-2">{anime.title}</h4>
                                                  <span className="text-[10px] text-zinc-400 mt-1 block">{anime.duration || 'TBA'}</span>
                                              </div>
                                          </Link>
                                      );
                                  })()
                              } />
                          </div>
                      )) : [...Array(5)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse border border-white/5"/>)}
                  </div>

                  {/* --- BOTTOM CENTERED PAGE SWITCHER --- */}
                  {upcomingTotalPages > 1 && (
                      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
                          <CutePageSwitcher
                              page={upcomingPage}
                              maxPage={upcomingTotalPages}
                              canPrev={upcomingPage > 1}
                              canNext={upcomingPage < upcomingTotalPages}
                              onPageChange={(p) => setUpcomingPage(p)}
                              variant="primary"
                          />
                      </div>
                  )}
              </section>

          </div>

          {/* CUTE SHARE BAR */}
          <CuteShareBar 
            badgeText="Share Timetable"
            badgeSubtext="Broadcast Schedule"
            title="Invite your Friends to Track Releases on Kagemi!"
            description="Share real-time airing schedules across anime, donghua, Hindi dubs, and cinema movies with localized countdowns."
          />

          <div className="w-full mt-12 md:mt-16">
              <Footer />
          </div>

      </div>
    </div>
  );
}