"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Play, ChevronRight, ChevronLeft, Info, Loader2, Plus,
  Star, Film, Clapperboard, Tv, Crown, Flame, Radio, Heart,
  Zap, Globe
} from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import CuteShareBar from '@/components/Home/CuteShareBar';
import DCard from '@/components/Drama/DCard';
import CountryBadge, { getCountryInfo } from '@/components/Drama/CountryBadge';
import { MoviePageSkeleton } from '@/components/UIx/SkeletonLoaders';
import { playGummyTap } from '@/lib/audioManager';


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

      {/* Centered Content Hero Body */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4 pb-8 sm:pb-6 text-center max-w-4xl mx-auto pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-2 sm:gap-2.5 pointer-events-auto"
          >
            {/* Title */}
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-wider font-lemon drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-3xl line-clamp-2">
              {current.title}
            </h2>

            {/* Clean Typographic Metadata Row (Containerless - Anti-Container Rule #6) */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs sm:text-[13px] font-medium text-zinc-300 drop-shadow-md">
              <span className="font-semibold text-cyan-400 tracking-wide">
                {current.isMovie 
                  ? 'Cinema Movie' 
                  : (getCountryInfo(current.country, current.type).shortName || current.type || 'Series')}
              </span>

              {current.year && (
                <>
                  <span className="text-zinc-600 select-none">•</span>
                  <span className="text-zinc-300 font-medium">{current.year}</span>
                </>
              )}

              {current.score && current.score !== 'N/A' && (
                <>
                  <span className="text-zinc-600 select-none">•</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {current.score}
                  </span>
                </>
              )}

              {current.isHindi && (
                <>
                  <span className="text-zinc-600 select-none">•</span>
                  <span className="text-amber-300 font-semibold tracking-wide">Hindi Dub</span>
                </>
              )}
            </div>

            {/* Synopsis Overview */}
            <p className="text-[11px] sm:text-xs text-zinc-300 max-w-2xl line-clamp-2 font-medium drop-shadow-md px-2">
              {detail?.overview || detail?.synopsis || current.overview || current.synopsis || "Stream this blockbuster on Shadow Cinema with crystal clear HD and multi-audio support."}
            </p>

            {/* Action Buttons (One UI 8 Pill Style) */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/stream/${current.id}${current.isMovie ? '?type=movie' : ''}`}
                onClick={() => playGummyTap()}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs sm:text-sm px-5 py-2 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.45)] transition-all transform hover:scale-105 active:scale-95"
              >
                <Play size={15} className="fill-current" /> Watch Now
              </Link>

              <Link
                href={`/stream/${current.id}${current.isMovie ? '?type=movie' : ''}`}
                onClick={() => playGummyTap()}
                className="flex items-center justify-center gap-2 bg-[#0d1527]/80 hover:bg-[#131f38] text-white font-bold text-xs sm:text-sm px-4.5 py-2 rounded-full transition-all backdrop-blur-sm border border-white/15 active:scale-95 shadow-md"
              >
                <Info size={15} /> Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Centered Carousel Controls (Left Arrow + Indicator Dots + Right Arrow) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto bg-[#0a0f1d]/85 backdrop-blur-md px-2 py-1 sm:px-2.5 sm:py-1 rounded-full border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playGummyTap();
            setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
          }}
          aria-label="Previous slide"
          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-85 transition-all outline-none"
        >
          <ChevronLeft size={14} className="stroke-[2.5]" />
        </button>

        {/* Indicator Dots */}
        <div className="flex items-center gap-1.5 px-0.5">
          {items.map((_, i) => (
            <button 
              key={i} 
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                playGummyTap();
                setCurrentIndex(i);
              }} 
              className={cn(
                "h-1.5 shrink-0 rounded-full transition-all duration-300 border-0 outline-none p-0 cursor-pointer block", 
                currentIndex === i 
                  ? "w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" 
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playGummyTap();
            setCurrentIndex(prev => (prev + 1) % items.length);
          }}
          aria-label="Next slide"
          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-85 transition-all outline-none"
        >
          <ChevronRight size={14} className="stroke-[2.5]" />
        </button>
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
      className="w-full relative z-30 px-2 sm:px-4 group/row scroll-mt-24"
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
          {(() => {
            const isMovieSection = section.title.toLowerCase().includes('movie') || 
                                   section.title.toLowerCase().includes('cinema') || 
                                   section.title.toLowerCase().includes('hollywood') || 
                                   section.title.toLowerCase().includes('bollywood');
            const targetLib = isMovieSection ? 'movies' : 'drama';
            const exploreHref = section.query 
              ? `/explore?library=${targetLib}&keyword=${encodeURIComponent(section.query)}` 
              : `/explore?library=${targetLib}`;

            return (
              <Link 
                href={exploreHref} 
                className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-zinc-300 md:text-zinc-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 md:border-white/5 hover:border-cyan-500/40 transition-all inline-flex items-center gap-1 whitespace-nowrap active:scale-95"
              >
                <span className="md:hidden">Explore</span>
                <span className="hidden md:inline">Explore More</span>
                <ChevronRight size={12} className="text-cyan-400" />
              </Link>
            );
          })()}

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
  if (t.includes('korean') || t.includes('k-drama')) return { icon: Crown, accentColor: 'text-pink-400 border-pink-500/30', id: 'section-kdrama' };
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

          {/* CUTE SHARE BAR */}
          <CuteShareBar 
            badgeText="Share Cinema"
            badgeSubtext="Movies & Dramas"
            title="Invite your Friends to Shadow Cinema!"
            description="Share Hollywood blockbusters, Asian dramas, Korean/Chinese/Turkish series & Bollywood hits in crystal clear HD."
          />

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
