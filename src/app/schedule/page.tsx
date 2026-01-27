"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, ChevronLeft, ChevronRight, 
  PlayCircle, Timer, AlertCircle, Layers, Star, 
  CheckCircle, PlusCircle, Flame, Clock, Captions, Mic, Info, X 
} from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimeService, AnimeAPI_V4 } from '@/lib/api';
import Footer from '@/components/Anime/Footer';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { demoness, hunters } from '@/lib/fonts';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 12 } }
};

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title, icon: Icon, subtitle }: { title: string, icon: any, subtitle?: string }) => (
    <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/10 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                <Icon size={18} className="text-red-500" />
            </div>
            <h3 className={`text-xl md:text-2xl text-white tracking-widest ${hunters.className}`}>
                {title}
            </h3>
        </div>
        {subtitle && <p className="text-xs text-zinc-500 font-mono pl-12 uppercase tracking-wider">{subtitle}</p>}
    </div>
);

// --- SHARED TOOLTIP CONTENT (UI) ---
const AnimeTooltipContent = ({ displayData, isLoading }: { displayData: any, isLoading: boolean }) => (
    <>
        <div className="relative h-44 w-full">
            <img 
                src={displayData.poster || displayData.image || '/images/no-poster.png'} 
                className="w-full h-full object-cover opacity-80" 
                alt={displayData.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
                <span className="inline-block px-2 py-0.5 mb-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm font-sans">
                    {displayData.type || 'TV'}
                </span>
                <h4 className="text-xl font-black text-white leading-none line-clamp-2 drop-shadow-md font-sans">
                    {typeof displayData.title === 'string' ? displayData.title : displayData.title?.userPreferred}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 italic font-sans">
                    {displayData.jname || displayData.japaneseTitle}
                </p>
            </div>
        </div>
        <div className="p-5 space-y-4 bg-[#080808] relative font-sans">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-zinc-300">
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-red-500" /> {displayData.stats?.duration || displayData.duration || '? min'}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {displayData.stats?.malScore || displayData.malScore || 'N/A'}</span>
                </div>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 rounded uppercase">
                    {displayData.stats?.quality || 'HD'}
                </span>
            </div>
            <p className={cn("text-xs leading-relaxed text-zinc-400 line-clamp-4", isLoading && "opacity-50")}>
                {displayData.description || "Classified Intel."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                    <Captions size={12} className="text-zinc-500" />
                    <span className="text-xs font-bold text-white">{displayData.episodes?.sub || '?'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                    <Mic size={12} className="text-zinc-500" />
                    <span className="text-xs font-bold text-white">{displayData.episodes?.dub || '?'}</span>
                </div>
            </div>
        </div>
    </>
);

// --- MOBILE INFO BUTTON (With Close X) ---
const MobileInfoBtn = ({ anime }: { anime: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: details, isLoading } = useSWR(
        anime?.id && isOpen ? `anime-details-${anime.id}` : null,
        () => AnimeService.getAnimeInfo(anime.id),
        { revalidateOnFocus: false, shouldRetryOnError: false }
    );
    const displayData = details || anime;

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
                        className="absolute top-3 right-3 z-50 p-1.5 bg-black/50 hover:bg-red-600/80 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors"
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
    () => AnimeService.getAnimeInfo(anime.id),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const displayData = details || anime;

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
    return (
        <motion.div variants={itemVariants} layoutId={`schedule-${anime.id}`} className="relative group">
            <MobileInfoBtn anime={anime} />
            <QTip anime={anime} trigger={
                <Link href={`/watch/${anime.id}`} className="flex w-full items-stretch h-20 md:h-24 rounded-2xl bg-[#0f0f0f] border border-white/5 hover:border-red-500/30 transition-all active:scale-[0.98] overflow-hidden">
                    <div className="w-16 md:w-20 bg-white/5 flex flex-col items-center justify-center border-r border-white/5 group-hover:bg-red-600/10 group-hover:border-red-500/20 transition-colors">
                        <span className="text-sm md:text-lg font-black text-white">{anime.time}</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-red-400">JST</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center px-4 py-2 min-w-0">
                        <h3 className="text-xs md:text-sm font-bold text-zinc-200 group-hover:text-white transition-colors line-clamp-1 mb-1 pr-6">
                            {anime.name}
                        </h3>
                        <p className="text-[10px] text-zinc-500 line-clamp-1 italic mb-2">{anime.jname}</p>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold text-zinc-400 border border-white/5 group-hover:border-red-500/20 group-hover:text-red-400 transition-colors">
                                EP {anime.episode || '?'}
                            </span>
                            <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <PlayCircle size={10} className="text-white fill-white" />
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
            } />
        </motion.div>
    );
};

const CompactAnimeCard = ({ anime, rank }: { anime: any, rank?: number }) => (
    <motion.div variants={itemVariants} className="relative group">
        <div className="absolute right-1 top-1 z-30">
            <MobileInfoBtn anime={anime} />
        </div>
        <Link href={`/watch/${anime.id}`} className="flex items-center gap-3 p-2 rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
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
                <h4 className="text-[11px] md:text-xs font-bold text-zinc-300 truncate group-hover:text-red-400 transition-colors">
                    {anime.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 uppercase">{anime.type || 'TV'}</span>
                    <span className="text-[9px] text-zinc-500">{anime.episodes?.sub || anime.episodes || '?'} EPS</span>
                </div>
            </div>
            <ChevronRight size={14} className="text-zinc-700 group-hover:text-white transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
        </Link>
    </motion.div>
);

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
                    demoness.className
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

            <QTip anime={anime} side={isRightEdge ? "left" : "right"} trigger={
                <Link href={`/watch/${anime.id}`} className={cn(
                    "block w-full h-full relative bg-[#0a0a0a] rounded-xl overflow-hidden shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)] transition-all ring-1 ring-white/10",
                    isMobileActive ? "ring-red-500/50 shadow-[0_20px_50px_rgba(220,38,38,0.3)]" : "group-hover:ring-red-500/50 group-hover:shadow-[0_20px_50px_rgba(220,38,38,0.3)]"
                )}>
                    <div className="absolute inset-0 rounded-xl border-r border-t border-white/20 z-20 pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/90 to-transparent z-20 pointer-events-none mix-blend-multiply" />
                    <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                    <div className={cn("absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none z-30", isMobileActive ? "opacity-100" : "group-hover:opacity-100")} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                    <div className={cn("absolute bottom-0 left-0 w-full p-3 md:p-4 transform transition-transform duration-300 z-30", isMobileActive ? "translate-y-0" : "translate-y-2 group-hover:translate-y-0")}>
                        <h3 className={cn("text-xs md:text-sm font-bold text-white line-clamp-2 leading-tight transition-colors drop-shadow-md pr-2", isMobileActive ? "text-red-200" : "group-hover:text-red-200")}>
                            {anime.title}
                        </h3>
                        <div className={cn("flex items-center gap-2 mt-2 transition-opacity duration-300 delay-75", isMobileActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                            <span className="text-[9px] text-zinc-300 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                                EPS {anime.episodes?.sub || '?'}
                            </span>
                            {isMobileActive && (
                                <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
                                    Watch
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            } />
        </motion.div>
    );
};

// --- STICKY DAY SELECTOR ---
const DaySelector = ({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) => {
    const days = useMemo(() => Array.from({ length: 21 }, (_, i) => subDays(new Date(), 14 - i)), []);
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-40 sticky top-0 transition-all">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
                <button 
                    onClick={() => onSelect(new Date())}
                    className="hidden md:flex flex-col items-center justify-center h-[60px] px-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0"
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
                            <button key={i} onClick={() => onSelect(date)} className={cn("flex flex-col items-center justify-center min-w-[50px] md:min-w-[56px] h-[56px] md:h-[60px] rounded-xl border transition-all duration-300 snap-center shrink-0 relative overflow-hidden group", isSelected ? "bg-white text-black border-white scale-100 z-10 font-bold shadow-lg shadow-white/10" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300")}>
                                <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">{format(date, 'EEE')}</span>
                                <span className={cn("text-lg md:text-xl font-black font-[Cinzel] leading-none mt-0.5", isSelected ? "text-black" : "text-zinc-400 group-hover:text-white")}>{format(date, 'dd')}</span>
                                {isToday && !isSelected && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    ['schedule', format(selectedDate, 'yyyy-MM-dd')],
    ([_, date]) => AnimeService.getSchedule(date),
    { keepPreviousData: true }
  );
  
  const schedule = scheduleData?.scheduledAnimes || [];

  interface UpcomingResponse { response: any[]; pageInfo?: { totalPages?: number; }; }
  const { data: upcomingData } = useSWR<UpcomingResponse>(
    ['upcoming', upcomingPage],
    // @ts-ignore
    ([_, page]) => AnimeAPI_V4.getTopUpcoming(page),
    { keepPreviousData: true }
  );

  const upcoming = upcomingData?.response || [];
  const upcomingTotalPages = upcomingData?.pageInfo?.totalPages || 1;

  const { data: dashboard } = useSWR('dashboard-all', async () => {
    const [completed, newAdded, released, popular, topTen] = await Promise.all([
        AnimeService.getCompleted(),
        AnimeService.getRecentlyAdded(),
        AnimeService.getRecentlyUpdated(),
        AnimeService.getMostPopular(),
        AnimeService.getTopTen()
    ]);
    return { 
        completed: completed?.slice(0, 5) || [],
        newAdded: newAdded?.slice(0, 5) || [],
        released: released?.slice(0, 5) || [],
        popular: popular?.slice(0, 5) || [],
        topTen: topTen || null
    };
  }, { revalidateOnFocus: false });

  const topChartData = useMemo(() => {
    if (!dashboard?.topTen) return [];
    return dashboard.topTen[topTab] || [];
  }, [dashboard?.topTen, topTab]);

  const handleUpcomingPage = (dir: number) => setUpcomingPage(p => Math.max(1, Math.min(p + dir, upcomingTotalPages)));

  return (
    <div className="min-h-screen w-full bg-[#050505] font-sans text-zinc-100 overflow-x-hidden selection:bg-red-500/30">
      <style jsx global>{`
        html, body { overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        body::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/10 blur-[120px] rounded-full mix-blend-screen opacity-30" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full pb-20">
          
          <div className="w-full max-w-[1440px] px-4 md:px-8 mt-24 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-3">
                      <div className="h-px w-8 bg-red-600" />
                      <span className={`text-red-600 text-xs tracking-[0.3em] font-bold uppercase ${hunters.className}`}>Guild Operations</span>
                  </div>
                  <h1 className={`text-4xl md:text-6xl text-white ${demoness.className} leading-none`}>
                      CHRONO<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-900">SPHERE</span>
                  </h1>
              </motion.div>
              <div className="hidden md:block text-right">
                  <span className="block text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Current Cycle</span>
                  <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-3xl font-black text-white font-[Cinzel]">{format(new Date(), 'dd')}</span>
                      <span className="text-sm text-zinc-400 uppercase font-medium">{format(new Date(), 'MMMM yyyy')}</span>
                  </div>
              </div>
          </div>

          <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

          <div className="w-full max-w-[1440px] px-4 md:px-8 mt-12 space-y-20">

              {/* SECTION 1: SCHEDULE GRID */}
              <section>
                  <SectionHeader title="Broadcast Schedule" icon={Calendar} subtitle={`Operations for ${format(selectedDate, 'EEEE, MMMM do')}`} />
                  <div className="min-h-[300px]">
                      <AnimatePresence mode="wait">
                          {loadingSchedule ? (
                              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />)}
                              </motion.div>
                          ) : schedule.length > 0 ? (
                              <motion.div key="grid" variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {schedule.map((anime: any, idx: number) => <ScheduleCard key={`${anime.id}-${idx}`} anime={anime} />)}
                              </motion.div>
                          ) : (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                  <AlertCircle size={48} className="text-zinc-700 mb-4" />
                                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No Intel Available</p>
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
                              <button key={tab} onClick={() => setTopTab(tab)} className={cn("px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", topTab === tab ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-zinc-500 hover:text-white")}>{tab}</button>
                          ))}
                      </div>
                  </div>
                  
                  {/* OVERLAP CONTAINER - 20% Overlap Effect */}
                  <div ref={deckRef} className="w-full overflow-visible pb-20 pt-10 px-4 md:px-0">
                      <motion.div 
                        key={topTab}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        // MOBILE: Grid 3 Cols. DESKTOP: Flex Row Centered
                        className="grid grid-cols-3 gap-x-3 gap-y-12 md:flex md:flex-row md:items-center md:justify-start md:gap-0"
                      >
                          {topChartData.length > 0 ? topChartData.map((anime: any, i: number) => (
                              <div key={anime.id} className="md:contents last:col-start-2">
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
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-900/20 rounded-lg text-green-500"><CheckCircle size={16} /></div><h4 className={`text-lg text-white ${hunters.className}`}>COMPLETED</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.completed.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a} rank={i+1}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-900/20 rounded-lg text-blue-500"><PlusCircle size={16} /></div><h4 className={`text-lg text-white ${hunters.className}`}>NEWLY ADDED</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.newAdded.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-900/20 rounded-lg text-purple-500"><Layers size={16} /></div><h4 className={`text-lg text-white ${hunters.className}`}>JUST UPDATED</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.released.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-500"><Star size={16} /></div><h4 className={`text-lg text-white ${hunters.className}`}>FAN FAVORITES</h4></div>
                          <div className="space-y-3">{dashboard ? dashboard.popular.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a} rank={i+1}/>) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}</div>
                      </div>
                  </div>
              </section>

              {/* SECTION 4: UPCOMING (5 Columns Grid) */}
              <section>
                  <div className="flex justify-between items-center mb-6">
                      <SectionHeader title="Incoming Recruits" icon={Timer} subtitle="Next generation operations" />
                      <div className="flex gap-2">
                          <button onClick={() => handleUpcomingPage(-1)} disabled={upcomingPage<=1} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5 transition-colors"><ChevronLeft size={16}/></button>
                          <button onClick={() => handleUpcomingPage(1)} disabled={upcomingPage>=upcomingTotalPages} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"><ChevronRight size={16}/></button>
                      </div>
                  </div>
                  {/* Updated to 5 Columns on LG */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {upcoming.length > 0 ? upcoming.map((anime: any, idx: number) => (
                          <div key={`${anime.id}-${idx}`} className="relative group">
                              <MobileInfoBtn anime={anime} />
                              <QTip anime={anime} trigger={
                                  <Link href={`/watch/${anime.id}`} className="group relative aspect-[2/3] block rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all">
                                      <img src={anime.poster} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0" loading="lazy" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                      <div className="absolute bottom-0 left-0 w-full p-3">
                                          <h4 className="text-xs font-bold text-white line-clamp-2">{anime.title}</h4>
                                          <span className="text-[10px] text-zinc-400 mt-1 block">{anime.duration || 'TBA'}</span>
                                      </div>
                                  </Link>
                              } />
                          </div>
                      )) : [...Array(5)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse border border-white/5"/>)}
                  </div>
              </section>

          </div>

          <div className="w-full mt-24">
              <Footer />
          </div>

      </div>
    </div>
  );
}