"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, Calendar, MonitorPlay, 
  Captions, Mic, Info, X, ListVideo 
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AnimeService } from '@/lib/api';
import { cn, getSafeImageUrl, slugifyTitle } from '@/lib/utils';

// --- TYPES ---
interface UnifiedAnimeData {
  id: string;
  title?: string | { userPreferred?: string; english?: string; romaji?: string; native?: string };
  name?: string;
  image?: string; 
  poster?: string;
  cover?: string;
  type?: string;
  isAdult?: boolean;
  totalEpisodes?: number;
  sub?: number;
  dub?: number;
  episode?: number;
  episodeId?: string; 
  episodes?: { sub: number; dub: number } | number;
  releaseDate?: string;
  status?: string;
  rating?: string;
  source?: 'universal' | 'consumet' | 'hindi';
  isHindi?: boolean;
  targetRoute?: string; 
}

interface QTipData {
  jname?: string;
  rating?: string;
  quality?: string;
  description?: string;
  genres?: string[];
  studios?: string;
  duration?: string;
  synonyms?: string;
  season?: string;
  isAdult?: boolean;
}

interface AnimeCardProps {
  anime: UnifiedAnimeData | any; 
  progress?: number;
  isHindi?: boolean;
}

// --- ANIMATION VARIANTS (Fixed Typing) ---
const qtipVariants: Variants = {
  hidden: (direction: 'left' | 'right') => ({ 
    opacity: 0, 
    x: direction === 'right' ? -15 : 15, 
    scale: 0.95,
    filter: "blur(8px)"
  }),
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 20 } 
  },
  exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { duration: 0 } 
  }
};

const mobileOverlayVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } }
};

export default function AnimeCard({ anime, progress = 0, isHindi = false }: AnimeCardProps) {
  const router = useRouter(); 
  const cardRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [isHovered, setIsHovered] = useState(false);
  const [showQtip, setShowQtip] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('right');
  
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const hoverDelayTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. MEMOIZED NORMALIZATION ---
  const normalized = useMemo(() => {
    const displayImage = getSafeImageUrl(anime.poster || anime.image || anime.cover || "/images/placeholder-no-img.jpg");
    
    let displayTitle = "Unknown Title";
    if (typeof anime.title === 'object') {
        displayTitle = anime.title.userPreferred || anime.title.english || anime.title.romaji || anime.title.native || "Unknown";
    } else if (anime.title) displayTitle = anime.title;
    else if (anime.name) displayTitle = anime.name;

    const rawSub = typeof anime.episodes === 'object' ? anime.episodes?.sub : (anime.sub ?? anime.subCount ?? null);
    const rawDub = typeof anime.episodes === 'object' ? anime.episodes?.dub : (anime.dub ?? anime.dubCount ?? null);
    const totalEp = anime.totalEpisodes || anime.total_episodes || (typeof anime.episodes === 'object' ? anime.episodes?.eps : null) || (typeof anime.episodes === 'number' ? anime.episodes : null) || anime.subCount || null;

    const isHindiMedia = isHindi || anime.isHindi || anime.category === 'hindi' || anime.source === 'hindi' || anime.media_type === 'hindi' || anime.type?.toLowerCase() === 'hindi' || (typeof displayTitle === 'string' && /hindi/i.test(displayTitle));
    const isDubMedia = isHindiMedia || anime.media_type === 'dub' || anime.type?.toLowerCase() === 'dub';

    const subCount = rawSub !== null ? rawSub : (!isDubMedia && totalEp ? totalEp : null);
    const dubCount = rawDub !== null ? rawDub : (isDubMedia && totalEp ? totalEp : null);

    // Initial Adult & Rating Check
    const genresList = Array.isArray(anime.genres) ? anime.genres.map((g: any) => String(g).toLowerCase()) : [];
    const hasAdultGenre = genresList.some((g: string) => ['ecchi', 'erotica', 'hentai', 'adult'].includes(g));
    let rawRatingGiven = anime.ageRating || "";
    if (!rawRatingGiven && anime.rating && !/^\d+(\.\d+)?(\/10)?$/.test(String(anime.rating).trim())) {
      rawRatingGiven = anime.rating;
    }
    const rawUpper = rawRatingGiven.toUpperCase().trim();
    const isAdult = anime.isAdult === true || hasAdultGenre || 
        ["RX", "HENTAI", "18", "R+", "R -", "R-17", "R17", "NC-17", "MATURE", "SEX"].some((t: string) => rawUpper.includes(t)) ||
        rawUpper === "R" || rawUpper.startsWith("R");
    const rawRating = rawRatingGiven || (isAdult ? "18+" : "PG-13");

    // Route Logic
    let finalRoute = "";
    const titleSlug = slugifyTitle(displayTitle);
    const routeId = (titleSlug && !String(anime.id).includes('-')) ? `${anime.id}-${titleSlug}` : anime.id;

    if (anime.targetRoute) {
        finalRoute = anime.targetRoute;
        if (titleSlug && finalRoute.startsWith('/watch/') && !finalRoute.includes('-')) {
            finalRoute = finalRoute.replace(/^\/watch\/([^?&#]+)/, (_, rawId) => `/watch/${rawId}-${titleSlug}`);
        }
    } else {
        const isDonghua = (anime.type?.toLowerCase() === 'donghua') || anime.source === 'donghua';
        const isHindiItem = isHindiMedia;
        const baseUrl = isDonghua
            ? `/donghua-watch/${anime.id}`
            : `/watch/${routeId}`;

        const targetEp = anime.episodeId || anime.episode;
        if (targetEp) {
            const epParam = (typeof targetEp === 'string' && (targetEp.startsWith('/') || targetEp.includes('?'))) 
                ? targetEp 
                : `?ep=${targetEp}`;
            const audioParam = isHindiItem ? (epParam.includes('?') ? '&audio=hi' : '?audio=hi') : '';
            finalRoute = `${baseUrl}${epParam}${audioParam}`;
        } else {
            finalRoute = isHindiItem ? `${baseUrl}?audio=hi` : baseUrl;
        }
    }

    return { 
        displayImage, displayTitle, 
        subCount, dubCount, 
        totalEp, 
        isAdult, 
        rawRating,
        targetRoute: finalRoute, 
        type: anime.type || "TV",
        isHindiMedia
    };
  }, [anime, isHindi]);

  // --- MEMOIZED SCORE EXTRACTOR (Yellow text, no container) ---
  const score = useMemo(() => {
    if (anime.score !== undefined && anime.score !== null && anime.score !== '') {
      const s = String(anime.score).replace('/10', '').trim();
      if (!isNaN(Number(s)) && Number(s) > 0) return Number(s).toFixed(1);
    }
    if (anime.malScore !== undefined && anime.malScore !== null) {
      const s = String(anime.malScore).replace('/10', '').trim();
      if (!isNaN(Number(s)) && Number(s) > 0) return Number(s).toFixed(1);
    }
    if (anime.averageScore) {
      return (Number(anime.averageScore) / 10).toFixed(1);
    }
    if (anime.rank) {
      const r = Number(anime.rank);
      if (r > 10) return (r / 10).toFixed(1);
      if (r > 0) return r.toFixed(1);
    }
    if (typeof anime.rating === 'string' && /^\d+(\.\d+)?(\/10)?$/.test(anime.rating.trim())) {
      return Number(anime.rating.replace('/10', '').trim()).toFixed(1);
    }
    return null;
  }, [anime]);

  // --- SMART RATING SELECTOR ---
  const getDisplayRating = () => {
    if (!qtip) return { rating: normalized.rawRating, isAdult: normalized.isAdult };

    const initialUpper = normalized.rawRating ? normalized.rawRating.toUpperCase() : "";
    const hasStrongInitial = 
        normalized.isAdult || 
        initialUpper.includes("18") || 
        initialUpper.includes("RX") || 
        initialUpper.includes("HENTAI") ||
        initialUpper.includes("R+");

    if (hasStrongInitial) {
        return { rating: normalized.rawRating, isAdult: normalized.isAdult };
    }

    return { rating: qtip.rating || normalized.rawRating, isAdult: qtip.isAdult || normalized.isAdult };
  };

  // --- HELPER: AGE TAG ---
  const AgeTag = ({ adult, rating }: { adult: boolean, rating?: string }) => {
    const r = rating ? rating.toUpperCase().trim() : "";
    let label = "PG-13"; 
    let isRed = false;

    if (adult || r.includes("RX") || r.includes("HENTAI") || r.includes("R+") || r.includes("18") || r.includes("TV-MA") || r.includes("SEX") || r.includes("MATURE") || r.includes("NC-17")) {
        label = (r.includes("RX") || r.includes("HENTAI")) ? "Rx" : "18+";
        isRed = true;
    } 
    else if (r.includes("17") || r.includes("R-17") || r.includes("R17") || r === "R" || r.startsWith("R")) {
        label = "R-17";
        isRed = true;
    }
    else if (r.includes("13") || r.includes("PG-13") || r.includes("TEEN")) {
        label = "PG-13";
        isRed = false;
    }
    else if (r.includes("PG")) {
        label = "PG";
        isRed = false;
    }
    else if (r === "G" || r.includes("ALL")) {
        label = "G";
        isRed = false;
    }
    else if (rating && rating !== "?" && rating !== "Unknown" && !/^\d+(\.\d+)?$/.test(rating)) {
        label = rating.replace("PG-", "PG ").replace("R-", "").trim();
        isRed = false;
    }

    return (
      <span className={cn(
        "h-5 px-2 flex items-center justify-center rounded-full border text-[9px] font-black shadow-lg backdrop-blur-md transition-colors tracking-wide",
        isRed 
          ? "bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]" 
          : "bg-black/60 border-white/20 text-white shadow-black/50"
      )}>
        {label}
      </span>
    );
  };

  // --- HANDLERS ---
  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    if (hoverDelayTimeout.current) clearTimeout(hoverDelayTimeout.current);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      setPopupPosition(spaceRight < 340 ? 'left' : 'right');
    }
    setIsHovered(true);
    hoverDelayTimeout.current = setTimeout(() => setShowQtip(true), 600);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
        setIsHovered(false);
        setShowQtip(false);
    }, 100);
    if (hoverDelayTimeout.current) clearTimeout(hoverDelayTimeout.current);
  };

  const handleMobileInfoToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowMobileInfo(prev => !prev);
    if (!showMobileInfo && !qtip) fetchDataNow();
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    router.push(normalized.targetRoute);
  };

  const fetchDataNow = async () => {
    if (qtip || loading || isHindi) return;
    setLoading(true);
    try {
      const isDonghua = normalized.targetRoute.includes('/donghua-watch/') || normalized.type.toLowerCase() === 'donghua';
      
      let data: any;
      if (isDonghua) {
          data = await import('@/lib/dpi').then(m => m.dpi.bridge.getSmartDetails(anime.id)).catch(() => null);
      } else {
          data = await AnimeService.getAnimeInfo(anime.id).catch(() => null);
      }
      
      if (data) {
        if (isDonghua) {
            setQtip({
                jname: data.nativeTitle || normalized.displayTitle,
                rating: data.rating || "",
                quality: "HD",
                description: data.description || "Description unavailable.",
                genres: data.genres || [],
                studios: data.studios?.join(', ') || "",
                duration: "Unknown",
                synonyms: data.alternativeTitles?.join(', ') || "",
                season: "DONGHUA",
                isAdult: data.isAdult
            });
        } else {
            const statsRating = data.stats?.rating || "";
            const isAdult = data.info?.genres?.includes('Hentai') || ["Rx", "RX", "Hentai"].some((t: string) => statsRating.toUpperCase().includes(t));

            setQtip({
              jname: data.jname || data.info?.japanese || normalized.displayTitle,
              rating: data.stats?.rating || normalized.rawRating,
              quality: data.stats?.quality || "HD",
              description: data.description || "Description unavailable.",
              genres: data.info?.genres || [],
              studios: data.info?.studios?.join(', '),
              duration: data.stats?.duration || "",
              synonyms: data.info?.synonyms || "",
              season: data.info?.premiered || "ANIME",
              isAdult: isAdult || normalized.isAdult
            });
        }
      } else {
        // Safe fallback so qtip is populated and no repeated requests occur
        setQtip({
            jname: normalized.displayTitle,
            rating: normalized.rawRating || "?",
            quality: "HD",
            description: "Information currently being updated.",
            genres: [],
            studios: "Unknown",
            duration: "",
            synonyms: "",
            season: "ANIME",
            isAdult: normalized.isAdult
        });
      }
    } catch {
        setQtip({
            jname: normalized.displayTitle,
            rating: normalized.rawRating || "?",
            quality: "HD",
            description: "Details unavailable.",
            genres: [],
            studios: "Unknown",
            duration: "",
            synonyms: "",
            season: "UNKNOWN",
            isAdult: normalized.isAdult
        });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isHovered && !qtip && !loading) {
        fetchTimeout.current = setTimeout(fetchDataNow, 200); 
    }
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [isHovered, qtip, loading]);

  const currentRatingData = getDisplayRating();

  return (
    <div 
      ref={cardRef}
      className="relative w-full aspect-[2/3] group z-0 hover:z-50 touch-manipulation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full h-full relative rounded-[26px] md:rounded-[28px] overflow-hidden bg-[#0c1322] border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 hover:shadow-2xl hover:shadow-primary-900/30 hover:border-primary-500/40 will-change-transform">
        
        <Link href={normalized.targetRoute} className="block w-full h-full relative">
          
          <div className="absolute inset-0 overflow-hidden rounded-[26px] md:rounded-[28px]">
            <img
              src={normalized.displayImage}
              alt={normalized.displayTitle}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src.startsWith('/api/proxy')) {
                  e.currentTarget.src = '/images/placeholder-no-img.jpg';
                } else if (e.currentTarget.src.startsWith('http')) {
                  e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(e.currentTarget.src)}`;
                } else {
                  e.currentTarget.src = '/images/placeholder-no-img.jpg';
                }
              }}
              className="w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out group-hover:scale-110 will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/40 to-transparent opacity-85 group-hover:opacity-65 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 z-20">
              <div className="h-4 md:h-5 px-2 flex items-center justify-center rounded-full bg-[#0e1628]/95 border border-white/15 text-white text-[8px] md:text-[9px] font-black uppercase tracking-wider shadow-sm">
                {normalized.type || "TV"}
              </div>
          </div>


          {/* Top-Center: Prominent MAL Rating */}
          {score && (
            <div className="absolute top-2.5 md:top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="h-4 md:h-5 px-2 flex items-center justify-center gap-0.5 rounded-full bg-[#0c1322]/95 border border-yellow-500/40 text-yellow-400 font-black text-[9px] md:text-[10px] tracking-tight shadow-md select-none">
                <span className="text-[9px] md:text-[10px]">★</span>
                <span>{score}</span>
              </div>
            </div>
          )}

          <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 z-40 flex items-center gap-1.5 md:gap-2">
              <button onClick={handleMobileInfoToggle} className="md:hidden w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#131c30]/90 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/20 atrax-squish-tap">
                <Info size={10} className="md:w-3 md:h-3" />
              </button>
              <AgeTag adult={currentRatingData.isAdult || false} rating={currentRatingData.rating} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex">
              <div className="relative group/play">
                <div className="absolute inset-0 rounded-full bg-primary-600 blur-xl opacity-50 group-hover/play:opacity-80 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-primary-600 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform duration-200 group-hover/play:scale-110">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3 z-20 flex flex-col gap-1.5 md:gap-2">
            <h3 className="text-xs md:text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-md group-hover:text-primary-400 transition-colors duration-300">
               {normalized.displayTitle}
            </h3>

            <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
                <div className="flex-shrink-0 flex items-center gap-1 h-5 md:h-5.5 px-2 rounded-full bg-[#0e1628]/95 border border-white/15 shadow-sm min-w-0">
                   {normalized.isHindiMedia ? (
                       <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-yellow-400 uppercase tracking-wider">
                           <Mic size={9} className="text-yellow-400 shrink-0" />
                           <span>HINDI</span>
                           {(normalized.dubCount || normalized.totalEp) ? (
                             <span className="text-white font-bold ml-0.5">EP {normalized.dubCount || normalized.totalEp}</span>
                           ) : null}
                       </div>
                   ) : (normalized.subCount || normalized.dubCount) ? (
                       <>
                           {Number(normalized.subCount) > 0 && (
                             <div className="flex items-center gap-0.5 text-[8px] md:text-[9px] font-bold text-white">
                               <Captions size={8} className="text-zinc-300 md:w-3 md:h-3" /> 
                               <span>{normalized.subCount}</span>
                             </div>
                           )}
                           {Number(normalized.subCount) > 0 && Number(normalized.dubCount) > 0 && <div className="w-px h-2 bg-white/20" />}
                           {Number(normalized.dubCount) > 0 && (
                             <div className="flex items-center gap-0.5 text-[8px] md:text-[9px] font-bold text-white">
                               <Mic size={8} className="text-zinc-300 md:w-3 md:h-3" /> 
                               <span>{normalized.dubCount}</span>
                             </div>
                           )}
                       </>
                   ) : (
                       <div className="text-[8px] md:text-[9px] font-bold text-zinc-400">N/A</div>
                   )}
                </div>

                {/* Bottom right: Total episodes count */}
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <div className="flex-shrink-0 bg-[#0e1628]/95 border border-white/15 h-5 md:h-6 px-2 md:px-2.5 rounded-full flex items-center justify-center gap-1 shadow-sm">
                        <ListVideo size={10} className="text-zinc-300 md:w-3 md:h-3" />
                        <span className="text-[8px] md:text-[9px] font-bold text-white tracking-wide uppercase">
                           {normalized.totalEp || "?"}
                        </span>
                    </div>
                </div>
            </div>

            {progress > 0 && (
               <div className="w-full h-0.5 md:h-1 bg-white/20 rounded-full overflow-hidden mt-0.5">
                 <div style={{ width: `${progress}%` }} className="h-full bg-primary-600 shadow-[0_0_10px_red]" />
               </div>
            )}
          </div>
        </Link>

        {/* --- MOBILE INFO OVERLAY (ATRAX SQUIRCLE) --- */}
        <AnimatePresence>
          {showMobileInfo && (
            <motion.div variants={mobileOverlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 z-50 bg-[#0c1322] border border-white/[0.12] rounded-[26px] p-4 flex flex-col gap-3 md:hidden shadow-2xl">
               <button onClick={handleMobileInfoToggle} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[#141d30] border border-white/15 text-white active:bg-primary-600 transition-colors z-50 atrax-squish-tap">
                 <X size={16} />
               </button>
               <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                  <h4 className="text-white font-black text-lg leading-tight mb-1 pr-8">{normalized.displayTitle}</h4>
                  <p className="text-primary-400 text-xs italic mb-3">{qtip?.jname || "..."}</p>
                  <div className="flex flex-wrap gap-2 mb-3 items-center">
                      <AgeTag adult={currentRatingData.isAdult || false} rating={currentRatingData.rating} />
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                          <Calendar size={10} /> {anime.releaseDate?.split('-')[0] || "?"}
                      </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed opacity-90 line-clamp-[8]">
                      {loading ? "Loading details..." : (qtip?.description || "No description available.")}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(qtip?.genres || []).slice(0, 4).map(g => (
                      <span key={g} className="text-[9px] px-2.5 py-1 rounded-full bg-[#141d30] border border-white/10 text-zinc-300">{g}</span>
                    ))}
                  </div>
               </div>
               <button onClick={(e) => { handlePlay(e); }} className="w-full py-3 bg-primary-600 rounded-full font-black text-white text-sm uppercase tracking-widest shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2 active:scale-95 transition-transform atrax-bubbly-btn atrax-squish-tap">
                 <Play size={16} fill="currentColor" /> Watch Now
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- DESKTOP Q-TIP POPUP (HOVER) --- */}
      <AnimatePresence>
        {isHovered && showQtip && !isHindi && !showMobileInfo && qtip && !loading && (
          <motion.div
              custom={popupPosition}
              variants={qtipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseEnter={handleMouseEnter} 
              onMouseLeave={handleMouseLeave}
              className={`hidden md:block absolute top-0 w-[300px] lg:w-[330px] z-50 ${popupPosition === 'right' ? 'left-[105%]' : 'right-[105%]'}`}
          >
              <div className="bg-[#0c1322] border border-white/[0.14] rounded-[30px] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] relative overflow-hidden group/qtip">
                 {/* Ambient glowing backlight */}
                 <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-600/20 blur-[50px] rounded-full pointer-events-none" />
                 <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />

                 <div className="relative z-10 mb-2.5">
                    <Link href={normalized.targetRoute}>
                      <h4 className="text-white font-black text-base lg:text-lg leading-tight mb-1 cursor-pointer hover:text-primary-400 transition-colors line-clamp-2">
                        {normalized.displayTitle}
                      </h4>
                    </Link>
                    {qtip?.jname && (
                      <p className="text-primary-400/80 text-xs font-semibold italic line-clamp-1">{qtip.jname}</p>
                    )}
                 </div>

                 <div className="relative z-10 flex flex-wrap items-center gap-2 mb-3 text-xs">
                    <AgeTag adult={currentRatingData.isAdult || false} rating={currentRatingData.rating} />
                    
                    {score && (
                      <span className="text-yellow-400 font-extrabold text-xs flex items-center gap-0.5">
                        <span>★</span> {score}
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                       <MonitorPlay size={11} className="text-primary-400" />
                       <span>{qtip?.quality || "HD"}</span>
                    </div>

                    <div className="ml-auto text-zinc-400 font-mono text-[9px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                       {qtip?.season || normalized.type}
                    </div>
                 </div>

                 <div className="relative z-10 mb-3 min-h-[45px]">
                    <p className="text-[11.5px] text-zinc-300/90 leading-relaxed line-clamp-3">
                        {qtip?.description || "Description unavailable."}
                    </p>
                 </div>

                 <div className="relative z-10 flex flex-wrap gap-1.5 pt-2.5 border-t border-white/10 mb-3.5">
                    {(qtip?.genres || []).slice(0, 3).map(g => (
                       <span key={g} className="text-[9px] font-medium px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                           {g}
                       </span>
                    ))}
                    {qtip?.studios && (
                       <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-950/40 border border-primary-500/20 text-primary-300 ml-auto line-clamp-1 max-w-[120px]">
                           {qtip.studios}
                       </span>
                    )}
                 </div>

                 <div className="relative z-10">
                    <Link 
                      href={normalized.targetRoute}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-red-600 hover:from-primary-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary-900/30 active:scale-98 transition-all"
                    >
                      <Play size={13} fill="currentColor" /> Watch Now
                    </Link>
                 </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}