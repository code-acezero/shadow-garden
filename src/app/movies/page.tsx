"use client";

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, ChevronRight, Loader2, Info, Plus, Check, Star } from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';

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

  return (
    <div className={cn("relative transition-all duration-300 z-[99]", isFocused || query ? "w-64 md:w-80" : "w-10 md:w-64")}>
      <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) window.location.href = `/search?library=movies&keyword=${encodeURIComponent(query.trim())}`; }} className="flex items-center gap-2 bg-[#0f172a]/80 backdrop-blur-md border border-emerald-500/20 hover:border-emerald-400/50 rounded-full px-3 py-2 focus-within:bg-[#0f172a] focus-within:border-emerald-400 focus-within:shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all group">
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
          className="shrink-0 outline-none hover:scale-110 transition-transform"
        >
            {loading ? <Loader2 size={16} className="text-emerald-400 animate-spin" /> : <Search size={16} className="text-emerald-500 group-focus-within:text-emerald-300 transition-colors" />}
        </button>
        <input
          id="movies-search-input"
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & series..."
          className={cn("bg-transparent text-white text-xs font-bold w-full outline-none placeholder:text-emerald-200/50 transition-all", !isFocused && !query && "md:block hidden")}
        />
        {query && (
          <div className="flex items-center shrink-0">
            <button type="button" onClick={() => setQuery('')} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors outline-none">
               <Plus size={16} className="rotate-45" />
            </button>
            <button type="button" onClick={() => window.location.href = `/search?library=movies&keyword=${encodeURIComponent(query.trim())}`} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors outline-none border-l border-emerald-500/30 ml-1 pl-2">
               <ChevronRight size={16} />
            </button>
          </div>
        )}
      </form>
      {results.length > 0 && (
        <div className="absolute top-full mt-3 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 flex flex-col gap-1 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {results.map(r => (
            <Link key={r.id} href={`/movies-watch/${r.id}`} onClick={() => setQuery('')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all group">
              {r.image && <img src={r.image} alt={r.title} className="w-10 h-14 object-cover rounded-md shadow-md" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-50 group-hover:text-emerald-300 truncate transition-colors">{r.title}</p>
                <p className="text-[9px] text-emerald-200/50 font-bold uppercase tracking-widest">{r.country} {r.year && `· ${r.year}`}</p>
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
    <Link href={`/movies-watch/${item.id}`} className="group relative flex flex-col shrink-0 w-[140px] sm:w-[160px] md:w-[200px] transition-all duration-300 hover:z-50 hover:scale-110 origin-bottom touch-manipulation block">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#0f172a] relative shadow-lg group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:ring-2 group-hover:ring-emerald-400/50 transition-all">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-900"><Play size={24} /></div>
        )}
        
        {/* Country Badge */}
        {countryTag && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 border border-white/10 z-10">
            <span className="text-[10px]">{flag}</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">{countryTag}</span>
          </div>
        )}

        {/* Episode Badge (Top Right) */}
        {item.episode && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-black px-1.5 py-0.5 rounded font-black text-[9px] z-10 shadow-md">
            EP {item.episode}
          </div>
        )}

        {/* Permanent Bottom Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col justify-end bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent h-2/3 md:h-1/2 transition-all">
          <div className="mt-auto group-hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-[11px] md:text-sm font-black text-white line-clamp-2 leading-tight drop-shadow-md mb-1.5 font-gradvis">{item.title}</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-emerald-200/80 uppercase tracking-widest">
                  {item.year && <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">{item.year}</span>}
                  {item.type && !item.type.includes(countryTag) && <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">{item.type}</span>}
                  {/* Fake rating if rating isn't explicitly provided but available in some objects */}
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
    <div className={cn("w-full relative z-20", isFirst ? "-mt-6 md:-mt-12" : "mt-8")}>
      <div className="px-4 md:px-12 mb-3 flex items-center justify-between">
          <h2 className="text-[16px] md:text-[20px] font-black text-white tracking-tight flex items-center gap-2 group cursor-pointer w-fit drop-shadow-md">
             {section.title}
          </h2>
          <Link href={section.query ? `/search?library=movies&genres=${section.query}` : `/search?library=movies`} className="text-[10px] md:text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 uppercase tracking-widest transition-colors">
            View All <ChevronRight size={14} />
          </Link>
      </div>
      <div className="px-4 md:px-12 w-full pb-4 relative group/row">
          <div className="flex gap-4 md:gap-5 pb-6 pt-2 pr-12 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
            {section.items.map(item => <div key={item.id} className="snap-start shrink-0"><DCard item={item} /></div>)}
          </div>
      </div>
    </div>
  );
};

// ── Section Grid ───────────────────────────────────────────────────────────────

const MoviesGrid = ({ section }: { section: DramaSection & { query?: string } }) => {
  if (!section.items.length) return null;
  return (
    <div className="w-full relative z-20 mt-8 mb-8">
      <div className="px-4 md:px-12 mb-4 flex items-center justify-between">
          <h2 className="text-[16px] md:text-[20px] font-black text-white tracking-tight flex items-center gap-2 w-fit drop-shadow-md">
             {section.title}
          </h2>
          <Link href={section.query ? `/search?library=movies&genres=${section.query}` : `/search?library=movies`} className="text-[10px] md:text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 uppercase tracking-widest transition-colors">
            View All <ChevronRight size={14} />
          </Link>
      </div>
      <div className="px-4 md:px-12 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
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
    <div className="relative w-full h-[70vh] md:h-[90vh] bg-[#020617] overflow-hidden flex items-center justify-center">
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80 h-40 top-0" />
          
          {/* Cinematic Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Top Nav Overlay */}
      <div className="absolute top-24 right-4 md:right-12 z-50 flex items-center gap-4">
         <MoviesSearch />
      </div>

      {/* Centered Hero Content */}
      <div className="absolute bottom-20 md:bottom-32 left-0 w-full px-4 md:px-12 flex flex-col items-center text-center z-10 pointer-events-none">
        <AnimatePresence mode="wait">
            <motion.div 
                key={`content-${item.id}`}
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, delay: 0.2 }} 
                className="max-w-4xl pointer-events-auto flex flex-col items-center"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                  <Check size={16} className="text-emerald-400 p-0.5 bg-emerald-400/20 rounded-full" />
                  <span className={`text-[10px] md:text-xs font-bold text-emerald-200 tracking-[0.2em] uppercase font-lemon`}>Shadow Exclusives</span>
              </div>
              
              <h1 className={`text-5xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter mb-4 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] font-gradvis`}>
                {item.title}
              </h1>

              <div className="flex items-center justify-center gap-3 text-[10px] md:text-[11px] font-black text-emerald-100/80 mb-6 uppercase tracking-widest">
                  <span className="text-black bg-emerald-400 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.4)]">Premium</span>
                  {item.year && <span>{item.year}</span>}
                  {item.country && <span>{item.country}</span>}
                  {item.episode && <span className="border border-white/20 px-1.5 py-0.5 rounded">{item.episode} Episodes</span>}
                  <span className="border border-white/20 px-1.5 py-0.5 rounded">HD</span>
              </div>

              <p className="text-xs md:text-sm text-emerald-50/80 leading-relaxed mb-8 line-clamp-2 md:line-clamp-3 font-medium max-w-2xl">
                 {detail?.synopsis || "Immerse yourself in a world of high-definition cinematic experiences. Watch unlimited movies and series."}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link href={`/movies-watch/${item.id}`} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm md:text-lg px-10 py-4 rounded-xl transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  <Play size={24} fill="black" /> Watch Now
                </Link>
                <button onClick={() => window.location.href = `/movies-watch/${item.id}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm md:text-lg px-8 py-4 rounded-xl transition-all backdrop-blur-md shadow-xl border border-white/20 hover:border-white/40">
                  <Info size={24} /> More Info
                </button>
              </div>
            </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="flex items-center justify-center gap-2 mt-12 pointer-events-auto w-fit bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
            {items.map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => setCurrentIndex(i)} 
                    className={cn("h-1.5 rounded-full transition-all duration-300", currentIndex === i ? "w-6 bg-emerald-400 shadow-[0_0_10px_#34d399]" : "w-1.5 bg-white/30 hover:bg-white/60")}
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
          // The scraped titles are sometimes weird (e.g., 'haq', 'tadaq'), map them to clean UI titles
          s.title = properTitles[idx] || `More Suggestions ${idx}`;
          return s;
      }) || [];
      
      // Fetch independent sections directly with Promise.all
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
    <div className="min-h-screen bg-[#020617] text-white pb-24 overflow-x-hidden selection:bg-emerald-500/30 pt-[calc(env(safe-area-inset-top)+80px)] md:pt-[calc(env(safe-area-inset-top)+56px)]">
      {loading ? (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#020617]">
           <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        </div>
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
