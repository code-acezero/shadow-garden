"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Play, ChevronRight, ChevronLeft, Info,
  Star, Film, Clapperboard, Tv, Sparkles, Flame, Radio, Heart,
  Zap, Globe
} from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import DCard from '@/components/Drama/DCard';
import CountryBadge from '@/components/Drama/CountryBadge';
import { MoviePageSkeleton } from '@/components/UIx/SkeletonLoaders';

// ── Search Bar ────────────────────────────────────────────────────────────────

const UnifiedSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DramaCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await omni.drama.search(query.trim());
      setResults(r.items.slice(0, 8));
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const expanded = isFocused || query.length > 0;

  return (
    <div className={cn("relative transition-all duration-300 z-50", expanded ? "w-[calc(100vw-2.5rem)] max-w-sm sm:w-64 md:w-80" : "w-32 sm:w-44 md:w-64")}>
      <form 
        onSubmit={(e) => { 
          e.preventDefault(); 
          if (query.trim()) window.location.href = `/search?library=drama&keyword=${encodeURIComponent(query.trim())}`; 
        }} 
        className="flex items-center h-8 sm:h-9 gap-1.5 sm:gap-2 bg-[#0b101e]/90 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400/60 rounded-full px-3 py-1.5 sm:py-2 focus-within:bg-[#0b101e] focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all group"
      >
        <button 
          type="button" 
          onClick={() => {
            if (!isFocused && !query) {
              document.getElementById('cinema-search-input')?.focus();
            } else if (query.trim()) {
              window.location.href = `/search?library=drama&keyword=${encodeURIComponent(query.trim())}`;
            }
          }} 
          disabled={loading} 
          className="shrink-0 outline-none hover:scale-110 transition-transform p-0.5"
        >
          {loading ? <Loader2 size={15} className="text-cyan-400 animate-spin" /> : <Search size={15} className="text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />}
        </button>
        <input
          id="cinema-search-input"
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search cinema, movies, dramas..."
          className="bg-transparent text-white text-[11px] sm:text-xs font-bold w-full outline-none placeholder:text-cyan-200/50 transition-all truncate"
        />
        {query && (
          <div className="flex items-center shrink-0">
            <button type="button" onClick={() => setQuery('')} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors outline-none">
              <Plus size={15} className="rotate-45" />
            </button>
            <button type="button" onClick={() => window.location.href = `/search?library=drama&keyword=${encodeURIComponent(query.trim())}`} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors outline-none border-l border-cyan-500/30 ml-1 pl-2">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </form>
      {results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-[calc(100vw-2.5rem)] max-w-sm md:w-full md:left-0 bg-[#0b101e]/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 flex flex-col gap-1 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {results.map(r => (
            <Link key={r.id} href={`/stream/${r.id}${r.isMovie ? '?type=movie' : ''}`} onClick={() => setQuery('')} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all group">
              {r.image && <img src={r.image} alt={r.title} className="w-9 h-12 object-cover rounded-md shadow-md shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-cyan-50 group-hover:text-cyan-300 truncate transition-colors">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">{r.type || r.country}</span>
                  {r.year && <span className="text-[9px] text-zinc-500">· {r.year}</span>}
                  {r.isHindi && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-black">🇮🇳 HINDI</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Hero Slider (Center Aligned, Android Monet Glass Style) ───────────────────

const HeroSlider = ({ items }: { items: DramaCard[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [details, setDetails] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 7500); 
    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    const item = items[currentIndex];
    if (item && !details[item.id]) {
      omni.drama.getDetail(item.id).then(d => {
        if (d) setDetails(prev => ({ ...prev, [item.id]: d }));
      }).catch(() => {});
    }
  }, [currentIndex, items, details]);

  if (!items || items.length === 0) return null;
  const current = items[currentIndex] || items[0];
  const detail = details[current.id];

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] md:h-[430px] overflow-hidden bg-black select-none">
      {/* Background Backdrop with Dynamic Vignette */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={current.backdrop || current.image}
            alt={current.title}
            className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-transparent to-[#020617]/90" />
        </motion.div>
      </AnimatePresence>

      {/* Top Floating Glass Header Bar with Search & Brand */}
      <div className="absolute top-4 sm:top-5 left-0 right-0 z-40 px-4 md:px-8 max-w-[1440px] mx-auto flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-xl flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Film size={18} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-black text-white tracking-wider font-lemon flex items-center gap-1.5 drop-shadow-md">
              <span>SHADOW</span>
              <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">CINEMA</span>
            </h1>
            <p className="text-[8.5px] sm:text-[9.5px] text-cyan-300/80 font-bold tracking-widest uppercase">
              Movies · Dramas · Series
            </p>
          </div>
        </div>

        <UnifiedSearch />
      </div>

      {/* Centered Content Hero Body (Moved up & Vertically Center Aligned) */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4 pt-10 sm:pt-12 pb-4 text-center max-w-4xl mx-auto pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-2 sm:gap-2.5 pointer-events-auto"
          >
            {/* One UI 8 Badges / Pill Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {current.isMovie ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wider bg-black/50 text-zinc-200 border border-white/10 backdrop-blur-md shadow-sm">
                  🎬 Cinema Movie
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wider bg-black/50 text-zinc-200 border border-white/10 backdrop-blur-md shadow-sm">
                  🎭 {current.type || current.country || 'Series'}
                </span>
              )}

              {current.country && <CountryBadge country={current.country} />}
              
              {current.isHindi && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wider bg-black/50 text-amber-300 border border-white/10 backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <span>🇮🇳</span> HINDI DUB
                </span>
              )}

              {current.score && current.score !== 'N/A' && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-black/50 text-amber-300 border border-white/10 backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {current.score}
                </span>
              )}

              {current.year && (
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                  {current.year}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-wider font-lemon drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] max-w-3xl line-clamp-2">
              {current.title}
            </h2>

            {/* Synopsis Overview */}
            <p className="text-[11px] sm:text-xs text-zinc-300 max-w-2xl line-clamp-2 font-medium drop-shadow-md px-2">
              {detail?.overview || detail?.synopsis || current.overview || current.synopsis || "Stream this blockbuster on Shadow Cinema with crystal clear HD and multi-audio support."}
            </p>

            {/* Action Buttons (One UI 8 Pill Style) */}
            <div className="flex items-center gap-3 pt-0.5">
              <Link
                href={`/stream/${current.id}${current.isMovie ? '?type=movie' : ''}`}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs sm:text-sm px-5 py-2 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.45)] transition-all transform hover:scale-105 active:scale-95"
              >
                <Play size={15} className="fill-current" /> Watch Now
              </Link>

              <Link
                href={`/stream/${current.id}${current.isMovie ? '?type=movie' : ''}`}
                className="flex items-center justify-center gap-2 bg-[#0d1527]/80 hover:bg-[#131f38] text-white font-bold text-xs sm:text-sm px-4.5 py-2 rounded-full transition-all backdrop-blur-sm border border-white/15 active:scale-95 shadow-md"
              >
                <Info size={15} /> Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Centered Carousel Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-1.5 pointer-events-auto bg-[#0a0f1d]/85 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/[0.08]">
        {items.map((_, i) => (
          <div 
            key={i} 
            role="button"
            tabIndex={0}
            onClick={() => setCurrentIndex(i)} 
            className={cn("h-1.5 shrink-0 rounded-full transition-all duration-200 border-0 outline-none p-0 min-h-[6px] max-h-[6px] cursor-pointer block appearance-none", currentIndex === i ? "w-6 bg-cyan-400" : "w-1.5 bg-white/30 hover:bg-white/60")}
          />
        ))}
      </div>
    </div>
  );
};

// ── Horizontal Scroll Row (Netflix Carousel with Android Monet Glass UI) ───────

const ContentRow = ({ 
  section, 
  icon: Icon = Film,
  accentColor = "text-cyan-400",
  id
}: { 
  section: DramaSection & { query?: string };
  icon?: any;
  accentColor?: string;
  id?: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -550 : 550;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  useEffect(() => {
    checkScroll();
  }, [section.items, checkScroll]);

  if (!section.items?.length) return null;

  return (
    <section 
      id={id} 
      className="w-full relative z-30 px-4 md:px-8 max-w-[1440px] mx-auto group/row scroll-mt-24"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 360px' }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-2 rounded-2xl bg-[#0e1629]/90 border border-white/[0.08] shadow-sm", accentColor)}>
            <Icon size={18} />
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-wider font-lemon drop-shadow-sm">
            {section.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href={section.query ? `/search?library=drama&keyword=${section.query}` : `/search?library=drama`} 
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-xl bg-[#0e1629]/80 border border-white/[0.08] hover:border-cyan-500/40 transition-all inline-flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <span>Explore More</span>
            <ChevronRight size={13} className="text-cyan-400" />
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-xl bg-[#0e1629]/90 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/[0.08] text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-xl bg-[#0e1629]/90 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/[0.08] text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3.5 sm:gap-4 md:gap-5 pb-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {section.items.map(item => (
          <div key={item.id} className="snap-start shrink-0 w-[135px] sm:w-[165px] md:w-[190px] relative hover:z-50">
            <DCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Section Icon & Color Mapping ──────────────────────────────────────────────

function getSectionMeta(title: string) {
  const t = title.toLowerCase();
  if (t.includes('recent') || t.includes('update') || t.includes('airing')) return { icon: Zap, accentColor: 'text-amber-300 border-amber-400/40', id: 'section-recent' };
  if (t.includes('hindi')) return { icon: Radio, accentColor: 'text-amber-400 border-amber-500/30', id: 'section-hindi' };
  if (t.includes('trending')) return { icon: Flame, accentColor: 'text-orange-400 border-orange-500/30', id: 'section-trending' };
  if (t.includes('turkish') || t.includes('dizi')) return { icon: Globe, accentColor: 'text-rose-400 border-rose-500/30', id: 'section-turkish' };
  if (t.includes('movie') || t.includes('cinema')) return { icon: Film, accentColor: 'text-cyan-400 border-cyan-500/30', id: 'section-movies' };
  if (t.includes('korean') || t.includes('k-drama')) return { icon: Sparkles, accentColor: 'text-pink-400 border-pink-500/30', id: 'section-kdrama' };
  if (t.includes('chinese') || t.includes('c-drama')) return { icon: Heart, accentColor: 'text-red-400 border-red-500/30', id: 'section-cdrama' };
  if (t.includes('japanese') || t.includes('j-drama')) return { icon: Clapperboard, accentColor: 'text-emerald-400 border-emerald-500/30', id: 'section-jdrama' };
  if (t.includes('series')) return { icon: Tv, accentColor: 'text-purple-400 border-purple-500/30', id: 'section-series' };
  if (t.includes('bollywood')) return { icon: Film, accentColor: 'text-yellow-400 border-yellow-500/30', id: 'section-bollywood' };
  if (t.includes('hollywood')) return { icon: Film, accentColor: 'text-sky-400 border-sky-500/30', id: 'section-hollywood' };
  if (t.includes('masterpiece') || t.includes('critically')) return { icon: Star, accentColor: 'text-yellow-400 border-yellow-500/30', id: 'section-top' };
  return { icon: Film, accentColor: 'text-cyan-400 border-cyan-500/30', id: undefined };
}

// ── Main Page Component ───────────────────────────────────────────────────────

function CinemaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [homeSections, setHomeSections] = useState<DramaSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync category with URL query param if present
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && ['all', 'movies', 'drama', 'series', 'hindi'].includes(cat)) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const url = categoryId === 'all' ? '/cinema' : `/cinema?category=${categoryId}`;
    window.history.replaceState(null, '', url);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const home = await omni.drama.getHome();
      setHomeSections(home?.sections || []);
      setLoading(false);
    })();
  }, []);

  // Filter sections dynamically based on active category
  const filteredSections = useMemo(() => {
    if (!homeSections || homeSections.length === 0) return [];
    if (activeCategory === 'all') return homeSections;

    return homeSections.filter(section => {
      const t = section.title.toLowerCase();
      if (activeCategory === 'movies') {
        return t.includes('movie') || t.includes('cinema') || t.includes('hollywood') || t.includes('bollywood') || t.includes('blockbuster');
      }
      if (activeCategory === 'drama') {
        return t.includes('korean') || t.includes('chinese') || t.includes('japanese') || t.includes('turkish') || t.includes('k-drama') || t.includes('c-drama') || t.includes('j-drama') || t.includes('dizi');
      }
      if (activeCategory === 'series') {
        return t.includes('series') || t.includes('show') || t.includes('season');
      }
      if (activeCategory === 'hindi') {
        return t.includes('hindi') || section.items.some(i => i.isHindi);
      }
      return true;
    });
  }, [homeSections, activeCategory]);

  // Curate Spotlight items for Hero Slider: Adapts to chosen category
  const heroItems = useMemo(() => {
    if (!homeSections || homeSections.length === 0) return [];

    const trendingDrama = homeSections.find(s => s.title.toLowerCase().includes('trending') || s.title.toLowerCase().includes('korean'))?.items || [];
    const blockbusterMovies = homeSections.find(s => s.title.toLowerCase().includes('movie') || s.title.toLowerCase().includes('blockbuster'))?.items || [];
    const turkishSpotlight = homeSections.find(s => s.title.toLowerCase().includes('turkish'))?.items || [];
    const hindiSpotlight = homeSections.find(s => s.title.toLowerCase().includes('hindi'))?.items || [];

    if (activeCategory === 'movies') {
      return blockbusterMovies.length > 0 ? blockbusterMovies.slice(0, 8) : [];
    }
    if (activeCategory === 'drama') {
      const allDramas = [...trendingDrama, ...turkishSpotlight];
      return allDramas.length > 0 ? allDramas.slice(0, 8) : [];
    }
    if (activeCategory === 'hindi') {
      return hindiSpotlight.length > 0 ? hindiSpotlight.slice(0, 8) : [];
    }

    const mixed: DramaCard[] = [];
    const maxIdx = Math.max(trendingDrama.length, blockbusterMovies.length, turkishSpotlight.length, hindiSpotlight.length);

    for (let i = 0; i < maxIdx; i++) {
      if (trendingDrama[i]) mixed.push(trendingDrama[i]);
      if (blockbusterMovies[i]) mixed.push(blockbusterMovies[i]);
      if (turkishSpotlight[i]) mixed.push(turkishSpotlight[i]);
      if (hindiSpotlight[i]) mixed.push(hindiSpotlight[i]);
      if (mixed.length >= 8) break;
    }

    return mixed.length > 0 ? mixed.slice(0, 8) : (homeSections[0]?.items?.slice(0, 8) || []);
  }, [homeSections, activeCategory]);

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-cyan-500/30">
      {loading ? (
        <MoviePageSkeleton />
      ) : (
        <>
          {/* Center-Aligned Hero Slider (Movies + Dramas) */}
          {heroItems.length > 0 && <HeroSlider items={heroItems} />}

          {/* Full Page Body with Staggered Horizontal Sections (Netflix Style) */}
          <div className="flex flex-col gap-8 md:gap-11 relative z-20 py-4 pb-20">
            {filteredSections.map((section) => {
              const meta = getSectionMeta(section.title);
              return (
                <ContentRow 
                  key={section.title} 
                  section={section} 
                  icon={meta.icon} 
                  accentColor={meta.accentColor}
                  id={meta.id}
                />
              );
            })}

            {filteredSections.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center py-20 gap-3 text-cyan-500/50">
                <span className="text-5xl">🎬</span>
                <p className="font-black uppercase tracking-widest text-xs">No matching titles in this category</p>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all border border-cyan-400/30"
                >
                  View All Titles
                </button>
              </div>
            )}
          </div>

          <Footer />
        </>
      )}
    </div>
  );
}

export default function CinemaPage() {
  return (
    <Suspense fallback={<MoviePageSkeleton />}>
      <CinemaContent />
    </Suspense>
  );
}
