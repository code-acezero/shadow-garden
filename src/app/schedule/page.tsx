"use client";

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, ChevronLeft, ChevronRight, 
  PlayCircle, Timer, AlertCircle, Layers, Star, 
  CheckCircle, PlusCircle, Flame, Clock, Captions, Mic, Search 
} from 'lucide-react';
import { format, subDays, isSameDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimeService, AnimeAPI_V4 } from '@/lib/api';
import Footer from '@/components/Anime/Footer';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { demoness, hunters } from '@/lib/fonts';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
};

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-600/10 rounded-lg border border-red-500/20">
            <Icon size={16} className="text-red-500" />
        </div>
        <h3 className={`text-base md:text-lg text-white tracking-widest ${hunters.className}`}>
            {title}
        </h3>
    </div>
);

// Optimized QTip with internal fetcher handling
const QTip = ({ trigger, anime }: { trigger: React.ReactNode, anime: any }) => {
  // Only fetch details on hover if data is missing, using SWR for caching
  const { data: details, isLoading } = useSWR(
    anime?.id ? `anime-details-${anime.id}` : null,
    () => AnimeService.getAnimeInfo(anime.id),
    { 
        revalidateOnFocus: false, 
        shouldRetryOnError: false,
        isPaused: () => !anime?.id // Lazy fetch controlled by interaction in a real scenario, but SWR dedupes well
    }
  );

  const displayData = details || anime;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent 
        className="hidden md:block w-80 p-0 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)] z-50 ring-1 ring-white/5 overflow-hidden" 
        side="right" 
        align="start" 
        sideOffset={20}
      >
        <div className="relative h-40 w-full bg-zinc-900">
            <img 
                src={displayData.poster || displayData.image || '/images/no-poster.png'} 
                className="w-full h-full object-cover opacity-60" 
                alt={displayData.title}
                loading="lazy" 
                decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            
            <div className="absolute top-3 right-3 flex gap-2">
                {displayData.stats?.rating && (
                    <span className="px-1.5 py-0.5 bg-white/20 backdrop-blur-md text-[10px] font-bold text-white rounded border border-white/10 uppercase">
                        {displayData.stats.rating}
                    </span>
                )}
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-left">
                <div className="flex flex-col">
                    <span className="text-xl font-black text-white leading-none line-clamp-1 drop-shadow-md">
                        {displayData.title || displayData.name}
                    </span>
                    <span className="text-[10px] text-zinc-300 line-clamp-1">
                        {displayData.jname || displayData.japaneseTitle}
                    </span>
                </div>
            </div>
        </div>
        <div className="p-4 space-y-3 bg-[#0a0a0a] text-left">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-red-500" /> {displayData.stats?.duration || displayData.duration || '? min'}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    <span>{displayData.stats?.type || displayData.type || 'TV'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-black">
                        <Star size={12} fill="currentColor" />
                        <span>{displayData.stats?.malScore || 'N/A'}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-red-600 text-[9px] font-black text-white rounded uppercase">
                        {displayData.stats?.quality || 'HD'}
                    </span>
                </div>
            </div>
            <div className="relative">
                <p className={cn("text-[11px] leading-relaxed text-zinc-400 line-clamp-3", isLoading ? "opacity-50 blur-[2px]" : "opacity-100")}>
                    {displayData.description || displayData.synopsis || "No tactical data available for this operation."}
                </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 border-t border-white/5 pt-3">
                <div className="flex items-center gap-1"><Captions size={10} /> <span>{displayData.episodes?.sub || '?'}</span></div>
                <div className="w-px h-3 bg-zinc-800" />
                <div className="flex items-center gap-1"><Mic size={10} /> <span>{displayData.episodes?.dub || '?'}</span></div>
                <div className="w-px h-3 bg-zinc-800" />
                <span>{displayData.info?.status || 'Airing'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
                {(displayData.info?.genres || displayData.genres)?.slice(0, 3).map((g: string) => (
                    <span key={g} className="text-[9px] px-2 py-0.5 rounded-full border border-white/5 text-zinc-400 bg-white/5">{g}</span>
                ))}
            </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const ScheduleCard = ({ anime }: { anime: any }) => {
    return (
        <motion.div variants={itemVariants} layoutId={`schedule-${anime.id}`}>
            <QTip anime={anime} trigger={
                <Link href={`/watch/${anime.id}`} className="flex w-full items-center gap-4 p-3 md:p-4 rounded-xl bg-[#0a0a0a] border border-white/10 hover:bg-white/5 transition-all active:scale-[0.98] shadow-md overflow-hidden relative box-border group/card">
                    <div className="flex flex-col items-center justify-center w-12 md:w-14 shrink-0 border-r border-white/10 pr-3 md:pr-4">
                        <span className="text-xs md:text-sm font-black text-zinc-400 group-hover/card:text-red-500 transition-colors whitespace-nowrap">{anime.time}</span>
                        <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-wider group-hover/card:text-red-900/80">JST</span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-left">
                        <div className="w-full relative overflow-hidden h-5">
                            <h3 className="block md:hidden text-xs font-bold text-zinc-200 group-hover/card:text-white transition-colors truncate">{anime.name}</h3>
                            <div className="hidden md:block w-full h-full relative overflow-hidden">
                                <div className="absolute whitespace-nowrap group-hover/card:animate-marquee">
                                    <h3 className="text-sm font-bold text-zinc-200 group-hover/card:text-white transition-colors">{anime.name}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-md bg-red-600/10 border border-red-600/20 text-[8px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1 shrink-0"><PlayCircle size={8} className="shrink-0"/> Engage</span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase truncate">EP {anime.episode || '?'}</span>
                        </div>
                    </div>
                </Link>
            } />
        </motion.div>
    );
};

const CompactAnimeCard = ({ anime, rank }: { anime: any, rank?: number }) => (
    <motion.div variants={itemVariants}>
        <Link href={`/watch/${anime.id}`} className="flex items-center gap-4 group p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 w-full overflow-hidden text-left">
            <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 group-hover:border-red-500/50 transition-colors bg-zinc-900">
                <img src={anime.poster} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                {rank && rank <= 3 && <div className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-br-lg">{rank}</div>}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-zinc-300 truncate group-hover:text-white transition-colors">{anime.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{anime.type || 'TV'}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[9px] text-zinc-500">{anime.episodes?.sub || anime.episodes || '?'} EPS</span>
                </div>
            </div>
        </Link>
    </motion.div>
);

const DaySelector = ({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) => {
    // Memoize days generation
    const days = useMemo(() => Array.from({ length: 21 }, (_, i) => subDays(new Date(), 14 - i)), []);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to center selected date on mount could be added here
    
    return (
        <div className="w-full border-b border-white/5 bg-black/20 backdrop-blur-md z-30 shrink-0 sticky top-0 transition-all duration-300">
            <div ref={scrollRef} className="flex items-center gap-2 md:gap-3 overflow-x-auto p-3 md:p-4 no-scrollbar snap-x px-4 max-w-7xl mx-auto">
                {days.map((date, i) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    return (
                        <button key={i} onClick={() => onSelect(date)} className={cn("flex flex-col items-center justify-center min-w-[50px] md:min-w-[60px] h-[60px] md:h-[70px] rounded-2xl border transition-all duration-300 snap-center shrink-0 relative overflow-hidden group", isSelected ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-105 z-10" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300")}>
                            {isSelected && <motion.div layoutId="activeDay" className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">{format(date, 'EEE')}</span>
                            <span className={cn("text-lg md:text-xl font-black font-[Cinzel]", isSelected ? "text-white" : "text-zinc-400 group-hover:text-white transition-colors")}>{format(date, 'dd')}</span>
                            {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [topTab, setTopTab] = useState<'today'|'week'|'month'>('week');

  // --- SWR DATA FETCHING (Much Faster & Cached) ---
  
  // 1. Schedule Data
  const { data: scheduleData, isLoading: loadingSchedule } = useSWR(
    ['schedule', format(selectedDate, 'yyyy-MM-dd')],
    ([_, date]) => AnimeService.getSchedule(date),
    { keepPreviousData: true } // Prevents flicker when switching dates
  );
  
  const schedule = scheduleData?.scheduledAnimes || [];

  // Define the expected shape of the API response
  interface UpcomingResponse {
    response: any[];
    pageInfo?: {
      totalPages?: number;
    };
  }

  // 2. Upcoming Data (Now with explicit typing)
  const { data: upcomingData } = useSWR<UpcomingResponse>(
    ['upcoming', upcomingPage],
    // @ts-ignore - Ignores if the library type definition is conflicting
    ([_, page]) => AnimeAPI_V4.getTopUpcoming(page),
    { keepPreviousData: true }
  );

  const upcoming = upcomingData?.response || [];
  const upcomingTotalPages = upcomingData?.pageInfo?.totalPages || 1;

  // 3. Dashboard Data (Fetched in parallel, cached)
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
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 10s linear infinite; }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full mix-blend-screen opacity-40 will-change-transform" />
          <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-purple-900/10 blur-[150px] rounded-full mix-blend-screen opacity-40 will-change-transform" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full pb-20">
          
          {/* HEADER */}
          <div className="w-full max-w-[76rem] px-4 md:px-8 mt-24 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="text-left"
              >
                  <div className="flex items-center gap-3 mb-2">
                      <Calendar className="text-red-600 animate-pulse" size={18} />
                      <span className={`text-red-600 text-xs tracking-[0.3em] font-bold ${hunters.className}`}>GUILD AGENDA</span>
                  </div>
                  <h1 className={`text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-600 ${demoness.className}`}>
                      CHRONO<span className="text-red-600">SPHERE</span>
                  </h1>
              </motion.div>
              <div className="hidden md:flex gap-4">
                  <div className="text-right">
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold">System Date</span>
                      <span className="text-white font-mono text-sm">{format(new Date(), 'yyyy.MM.dd')}</span>
                  </div>
              </div>
          </div>

          <div className="w-full max-w-[72rem] mb-12 sticky top-4 z-40">
              <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>

          {/* SCHEDULE GRID */}
          <div className="w-full max-w-[76rem] px-4 md:px-8 mb-16 min-h-[400px]">
              <AnimatePresence mode="wait">
                  {loadingSchedule ? (
                      <motion.div 
                        key="skeleton"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                          {[...Array(9)].map((_, i) => (
                             <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                          ))}
                      </motion.div>
                  ) : schedule.length > 0 ? (
                      <motion.div 
                        key="grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
                      >
                          {schedule.map((anime: any, idx: number) => (
                              <ScheduleCard key={`${anime.id}-${idx}`} anime={anime} />
                          ))}
                      </motion.div>
                  ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 mx-4 w-full"
                      >
                          <AlertCircle size={40} className="text-zinc-600 mb-4" />
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">No Operations Scheduled</p>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          {/* UPCOMING */}
          <div className="w-full max-w-[76rem] px-4 md:px-8 mb-16">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600/10 rounded-lg border border-red-500/20"><Timer size={16} className="text-red-500" /></div>
                      <h3 className={`text-base md:text-lg text-white tracking-widest ${hunters.className}`}>INCOMING RECRUITS</h3>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handleUpcomingPage(-1)} disabled={upcomingPage<=1} className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5 transition-colors"><ChevronLeft size={16}/></button>
                      <button onClick={() => handleUpcomingPage(1)} disabled={upcomingPage>=upcomingTotalPages} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"><ChevronRight size={16}/></button>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {upcoming.length > 0 ? upcoming.map((anime: any, idx: number) => (
                      <QTip key={`${anime.id}-${idx}`} anime={anime} trigger={
                          <Link href={`/watch/${anime.id}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 hover:border-red-500/50 transition-all">
                              <img src={anime.poster} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" loading="lazy" decoding="async"/>
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                              <div className="absolute bottom-0 left-0 w-full p-4 text-left">
                                  <h4 className="text-xs md:text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-md">{anime.title}</h4>
                                  <div className="flex items-center gap-2 mt-2">
                                      <span className="px-1.5 py-0.5 bg-red-600 text-white text-[7px] md:text-[8px] font-bold rounded-sm uppercase">TBA</span>
                                      <span className="text-[8px] md:text-[10px] text-zinc-400 truncate">{anime.duration || 'TBA'}</span>
                                  </div>
                              </div>
                          </Link>
                      } />
                  )) : [...Array(5)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse"/>)}
              </div>
          </div>

          {/* 4 COLUMNS DASHBOARD */}
          <div className="w-full max-w-[76rem] px-4 md:px-8 mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Reuse components for brevity, wrapping mapped items in variants */}
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[30px] p-6 shadow-xl h-fit">
                      <SectionHeader title="MISSION COMPLETE" icon={CheckCircle} />
                      <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-4">
                        {dashboard ? dashboard.completed.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a} rank={i+1} />) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}
                      </motion.div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[30px] p-6 shadow-xl h-fit">
                      <SectionHeader title="NEW INTEL" icon={PlusCircle} />
                      <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-4">
                        {dashboard ? dashboard.newAdded.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a} />) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}
                      </motion.div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[30px] p-6 shadow-xl h-fit">
                      <SectionHeader title="DEPLOYED" icon={Layers} />
                      <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-4">
                        {dashboard ? dashboard.released.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a} />) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}
                      </motion.div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[30px] p-6 shadow-xl h-fit">
                      <SectionHeader title="ELITE RANKINGS" icon={Star} />
                      <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-4">
                        {dashboard ? dashboard.popular.map((a: any, i: number) => <CompactAnimeCard key={i} anime={a} rank={i+1} />) : <div className="h-40 bg-white/5 animate-pulse rounded-xl"/>}
                      </motion.div>
                  </div>
              </div>
          </div>

          {/* TOP RATED CHARTS */}
          <div className="w-full max-w-[76rem] px-4 md:px-8 mb-20">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-6 md:p-12 relative overflow-hidden shadow-2xl shadow-red-900/10">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[120px] pointer-events-none" />
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-10">
                      <div className="text-left">
                          <div className="flex items-center gap-3 mb-2">
                              <Flame className="text-red-600 animate-pulse" size={24} />
                              <span className={`text-red-600 text-xs tracking-[0.3em] font-bold ${hunters.className}`}>DOMINATING</span>
                          </div>
                          <h2 className={`text-3xl text-white ${demoness.className}`}>TOP CHARTS</h2>
                      </div>
                      <div className="flex p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-md overflow-x-auto max-w-full">
                          {(['today', 'week', 'month'] as const).map((tab) => (
                              <button key={tab} onClick={() => setTopTab(tab)} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", topTab === tab ? "bg-red-600 text-white shadow-lg shadow-red-900/50" : "text-zinc-500 hover:text-white")}>{tab}</button>
                          ))}
                      </div>
                  </div>
                  <motion.div 
                    key={topTab}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10"
                  >
                      {topChartData.length > 0 ? topChartData.map((anime: any, i: number) => (
                          <motion.div variants={itemVariants} key={`${anime.id}-${i}`}>
                              <QTip anime={anime} trigger={
                                  <Link href={`/watch/${anime.id}`} className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 hover:border-red-500/50 transition-all shadow-xl">
                                      <div className="absolute top-2 left-2 z-20 w-8 h-8 flex items-center justify-center bg-red-600 text-white font-black text-sm rounded-lg shadow-lg shadow-black/50">#{i + 1}</div>
                                      <img src={anime.poster} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" loading="lazy" decoding="async"/>
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                      <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform text-left">
                                          <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight drop-shadow-md">{anime.title}</h3>
                                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <span className="text-[10px] text-zinc-300 font-mono">{anime.episodes?.sub || '?'} EPS</span>
                                              <span className="text-[10px] text-red-400 font-bold uppercase">Watch</span>
                                          </div>
                                      </div>
                                  </Link>
                              } />
                          </motion.div>
                      )) : [...Array(5)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse"/>)}
                  </motion.div>
              </div>
          </div>

          <div className="w-full mt-auto">
              <Footer />
          </div>

      </div>
    </div>
  );
}