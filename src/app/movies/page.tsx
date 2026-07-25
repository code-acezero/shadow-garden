"use client";

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, ChevronRight, Loader2, Info, Plus, Check, Star } from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import { MoviePageSkeleton } from '@/components/UIx/SkeletonLoaders';

// ── Search Bar ────────────────────────────────────────────────────────────────

const MoviesSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DramaCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await omni.movies.search(query.trim());
      setResults(r.items.slice(0, 8));
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const expanded = isFocused || query.length > 0;

  return (
    <div className={cn("relative transition-all duration-300 z-50", expanded ? "w-[calc(100vw-2.5rem)] max-w-sm sm:w-64 md:w-80" : "w-10 sm:w-44 md:w-72")}>
      <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) window.location.href = `/search?library=movies&keyword=${encodeURIComponent(query.trim())}`; }} className="flex items-center gap-2 bg-[#080d1a]/90 backdrop-blur-xl border border-white/15 hover:border-emerald-500/40 rounded-full px-3 py-2 focus-within:bg-[#0a1020] focus-within:border-emerald-400 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all group">
        <button 
          type="button" 
          onClick={() => {
            if (!isFocused && !query) {
              document.getElementById('movies-search-input')?.focus();
            } else if (query.trim()) {
              window.location.href = `/search?library=movies&keyword=${encodeURIComponent(query.trim())}`;
            }
          }}
          disabled={loading} 
          className="shrink-0 outline-none hover:scale-110 transition-transform p-0.5"
        >
            {loading ? <Loader2 size={16} className="text-emerald-400 animate-spin" /> : <Search size={16} className="text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />}
        </button>
        <input
          id="movies-search-input"
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & series..."
          className={cn("bg-transparent text-white text-xs font-bold w-full outline-none placeholder:text-zinc-400/70 transition-all", !expanded && "hidden sm:block")}
        />
        {query && (
          <div className="flex items-center shrink-0">
            <button type="button" onClick={() => setQuery('')} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors outline-none">
               <Plus size={15} className="rotate-45" />
            </button>
            <button type="button" onClick={() => window.location.href = `/search?library=movies&keyword=${encodeURIComponent(query.trim())}`} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors outline-none border-l border-white/10 ml-1 pl-2">
               <ChevronRight size={15} />
            </button>
          </div>
        )}
      </form>
      {results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-[calc(100vw-2.5rem)] max-w-sm md:w-full md:left-0 bg-[#0a0f1d]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.9)] z-50 p-2 flex flex-col gap-1 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {results.map(r => (
            <Link key={r.id} href={`/movies-watch/${r.id}`} onClick={() => setQuery('')} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30 transition-all group">
              {r.image && <img src={r.image} alt={r.title} className="w-9 h-12 object-cover rounded-lg shadow-md shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-emerald-300 truncate transition-colors">{r.title}</p>
                <p className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-widest">{r.country} {r.year && `· ${r.year}`}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Cinematic Movie Card ────────────────────────────────────────────────────

const DCard = memo(({ item }: { item: DramaCard }) => {
  // Determine a country tag
  let countryTag = item.country || '';
  if (!countryTag && item.type) {
    if (item.type.toLowerCase().includes('korea')) countryTag = 'South Korea';
    else if (item.type.toLowerCase().includes('china') || item.type.toLowerCase().includes('chinese')) countryTag = 'China';
    else if (item.type.toLowerCase().includes('japan')) countryTag = 'Japan';
    else if (item.type.toLowerCase().includes('turkey') || item.type.toLowerCase().includes('turkish')) countryTag = 'Turkey';
    else if (item.type.toLowerCase().includes('thai')) countryTag = 'Thailand';
  }

  // Choose flag based on country
  let flag = '🌍';
  const cLower = countryTag.toLowerCase();
  if (cLower.includes('korea')) flag = '🇰🇷';
  else if (cLower.includes('china')) flag = '🇨🇳';
  else if (cLower.includes('japan')) flag = '🇯🇵';
  else if (cLower.includes('turkey')) flag = '🇹🇷';
  else if (cLower.includes('thai')) flag = '🇹🇭';

  return (
    <Link href={`/movies-watch/${item.id}`} className="group relative flex flex-col shrink-0 w-full transition-all duration-300 hover:z-50 hover:scale-105 origin-center touch-manipulation block">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#0f172a] relative shadow-lg group-hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] group-hover:ring-2 group-hover:ring-emerald-400/60 transition-all">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-900"><Play size={24} /></div>
        )}
        
        {/* Country Badge */}
        {countryTag && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 z-20">
            <span className="text-[10px]">{flag}</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">{countryTag}</span>
          </div>
        )}

        {/* Episode Badge (Top Right) */}
        {item.episode && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black text-[9px] z-20 shadow-md">
            EP {item.episode}
          </div>
        )}

        {/* Permanent Bottom Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col justify-end bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent h-2/3 md:h-1/2 transition-all z-10">
          <div className="mt-auto group-hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-[11px] md:text-sm font-black text-white line-clamp-2 leading-tight drop-shadow-md mb-1.5 font-gradvis">{item.title}</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-emerald-200/80 uppercase tracking-widest">
                  {item.year && <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/5">{item.year}</span>}
                  {item.type && !item.type.includes(countryTag) && <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{item.type}</span>}
                  <span className="text-yellow-400 flex items-center gap-0.5"><Star size={8} fill="currentColor"/> 8.5</span>
              </div>
          </div>

          {/* Action Buttons (Only visible on Hover, sliding up) */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 absolute bottom-3 md:bottom-4 left-3 right-3 md:left-4 md:right-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">
                  <Play size={14} fill="black" className="ml-0.5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all ml-auto" onClick={(e) => { e.preventDefault(); }}>
                  <Plus size={14} />
              </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
DCard.displayName = "DCard";

// ── Section Row ───────────────────────────────────────────────────────────────

const MoviesRow = ({ section, isFirst }: { section: DramaSection & { query?: string }, isFirst?: boolean }) => {
  if (!section.items.length) return null;
  return (
    <div className={cn("w-full relative z-30 px-4 md:px-8", isFirst ? "mt-3 md:-mt-10" : "mt-4")}>
      <div className="mb-2 flex items-center justify-between w-full">
          <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-black text-white tracking-tight flex items-center gap-2 group cursor-pointer w-fit drop-shadow-md">
             {section.title}
          </h2>
          <Link href={section.query ? `/search?library=movies&genres=${section.query}` : `/search?library=movies`} className="text-[10px] md:text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full px-3 py-1 flex items-center gap-1 uppercase tracking-widest transition-all">
            View All <ChevronRight size={13} />
          </Link>
      </div>
      <div className="w-full relative group/row">
          <div className="flex gap-3.5 sm:gap-4 md:gap-5 pt-4 pb-6 pr-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
            {section.items.map(item => (
              <div key={item.id} className="snap-start shrink-0 w-[130px] sm:w-[160px] md:w-[195px] relative hover:z-50">
                <DCard item={item} />
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

// ── Section Grid ───────────────────────────────────────────────────────────────

const MoviesGrid = ({ section }: { section: DramaSection & { query?: string } }) => {
  if (!section.items.length) return null;
  return (
    <div className="w-full relative z-30 mt-6 mb-8 px-4 md:px-8">
      <div className="mb-3 flex items-center justify-between w-full">
          <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-black text-white tracking-tight flex items-center gap-2 w-fit drop-shadow-md">
             {section.title}
          </h2>
          <Link href={section.query ? `/search?library=movies&genres=${section.query}` : `/search?library=movies`} className="text-[10px] md:text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full px-3 py-1 flex items-center gap-1 uppercase tracking-widest transition-all">
            View All <ChevronRight size={13} />
          </Link>
      </div>
      <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-6">
            {section.items.map(item => <DCard key={item.id} item={item} />)}
          </div>
      </div>
    </div>
  );
};

// ── Cinematic Hero Slider ─────────────────────────────────────────────────────

const HeroSlider = ({ items }: { items: DramaCard[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [details, setDetails] = useState<Record<string, any>>({});
  
  useEffect(() => {
      if (!items || items.length === 0) return;
      const interval = setInterval(() => {
          setCurrentIndex(prev => (prev + 1) % items.length);
      }, 8000); 
      return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
      const item = items[currentIndex];
      if (item && !details[item.id]) {
          omni.movies.getDetail(item.id).then(res => {
              if (res) setDetails(prev => ({ ...prev, [item.id]: res }));
          }).catch(() => {});
      }
  }, [currentIndex, items, details]);

  if (!items || items.length === 0) return null;
  const item = items[currentIndex];
  const detail = details[item.id];

  return (
    <div className="relative w-full h-[46vh] sm:h-[55vh] md:h-[65vh] lg:h-[70vh] bg-[#020617] overflow-hidden flex items-center justify-center z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {item.image && (
            <img src={detail?.banner || item.image} alt={item.title} className="w-full h-full object-cover opacity-60 md:opacity-70 mix-blend-screen" loading="eager" />
          )}
          
          {/* Centered Vignette Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#020617_100%)] opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-transparent to-[#020617] bottom-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80 h-24 sm:h-40 top-0" />
          
          {/* Cinematic Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Desktop Search Bar positioned cleanly in Hero header */}
      <div className="hidden md:flex absolute top-6 right-8 z-40 items-center gap-3">
         <MoviesSearch />
      </div>

      {/* Centered Hero Content */}
      <div className="absolute bottom-4 sm:bottom-10 md:bottom-16 left-0 right-0 px-4 sm:px-6 flex flex-col items-center text-center z-20 pointer-events-none">
        <AnimatePresence mode="wait">
            <motion.div 
                key={`content-${item.id}`}
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.15 }} 
                className="pointer-events-auto flex flex-col items-center w-full max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1.5 sm:mb-2">
                  <Check size={11} className="text-emerald-400 p-0.5 bg-emerald-400/20 rounded-full" />
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-emerald-300 tracking-[0.2em] uppercase font-lemon">Shadow Exclusives</span>
              </div>
              
              <h1 className="text-lg sm:text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] font-gradvis line-clamp-2 px-2 max-w-xl">
                {item.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9px] sm:text-[10px] md:text-[11px] font-black text-emerald-100/80 mb-2.5 sm:mb-4 uppercase tracking-widest">
                  <span className="text-black bg-emerald-400 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]">Premium</span>
                  {item.year && <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/10">{item.year}</span>}
                  {item.country && <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/10">{item.country}</span>}
                  {item.episode && <span className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full">{item.episode} EP</span>}
                  <span className="border border-white/20 px-2 py-0.5 rounded-full">HD</span>
              </div>

              <p className="hidden sm:block text-xs md:text-sm text-emerald-50/80 leading-relaxed mb-4 line-clamp-2 font-medium max-w-xl">
                 {detail?.synopsis || "Immerse yourself in a world of high-definition cinematic experiences. Watch unlimited movies and series."}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <Link href={`/movies-watch/${item.id}`} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5 rounded-full transition-all active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)]">
                  <Play size={15} fill="black" /> Watch Now
                </Link>
                <Link href={`/movies-watch/${item.id}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5 rounded-full transition-all backdrop-blur-md shadow-xl border border-white/20 hover:border-white/40 active:scale-95">
                  <Info size={15} /> More Info
                </Link>
              </div>
            </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-2 sm:mt-4 pointer-events-auto w-fit bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {items.map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => setCurrentIndex(i)} 
                    className={cn("h-1.5 rounded-full transition-all duration-300", currentIndex === i ? "w-5 sm:w-6 bg-emerald-400 shadow-[0_0_10px_#34d399]" : "w-1.5 bg-white/30 hover:bg-white/60")}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default function MoviesHomePage() {
  const [sections, setSections] = useState<DramaSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const home = await omni.movies.getHome();
      
      const properTitles = ['Recent Updates', 'Trending Movies', 'Popular Right Now', 'Must Watch', 'New Additions', 'Top Rated'];
      
      let loadedSections = home?.sections?.filter((s:any) => s.items && s.items.length > 0).map((s:any, idx:number) => {
          s.title = properTitles[idx] || `More Suggestions ${idx}`;
          return s;
      }) || [];
      
      const [bollywood, hollywood, action, animation] = await Promise.all([
          omni.movies.getByCountry('bollywood'),
          omni.movies.getByCountry('hollywood'),
          omni.movies.getByGenre('action'),
          omni.movies.getByGenre('animation')
      ]);

      if (bollywood?.items?.length) loadedSections.push({ title: 'Bollywood Hits', items: bollywood.items.slice(0, 12), query: 'bollywood' });
      if (hollywood?.items?.length) loadedSections.push({ title: 'Hollywood Blockbusters', items: hollywood.items.slice(0, 12), query: 'hollywood' });
      if (action?.items?.length) loadedSections.push({ title: 'Action Movies', items: action.items.slice(0, 12), query: 'action' });
      if (animation?.items?.length) loadedSections.push({ title: 'Animation & Cartoons', items: animation.items.slice(0, 12), query: 'animation' });

      setSections(loadedSections);
      setLoading(false);
    })();
  }, []);

  const heroItems = sections[0]?.items?.slice(0, 5) || [];
  const displaySections = sections.map((s, i) => {
      if (i === 0 && heroItems.length > 0) return { ...s, items: s.items.slice(5) };
      return s;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-emerald-500/30">
      {loading ? (
        <MoviePageSkeleton />
      ) : (
        <>
          {heroItems.length > 0 && <HeroSlider items={heroItems} />}
          
          <div className="flex flex-col gap-6 md:gap-8 relative z-20">
            {displaySections.map((section: any, i) => {
                if (i === 0) return <MoviesRow key={section.title + i} section={section} isFirst={true} />;
                return <MoviesGrid key={section.title + i} section={section} />;
            })}
          </div>

          {sections.length === 0 && (
             <div className="w-full flex flex-col items-center justify-center py-32 gap-4 text-emerald-500/50">
                <span className="text-6xl drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">🎭</span>
                <p className="font-black uppercase tracking-widest text-sm">No movies found in the realm</p>
             </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}

