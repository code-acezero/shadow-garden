"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, ChevronRight, Loader2, Info, Plus, Check, Star } from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import DCard from '@/components/Drama/DCard';
import CountryBadge from '@/components/Drama/CountryBadge';

// ── Search Bar ────────────────────────────────────────────────────────────────

const DramaSearch = () => {
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
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className={cn("relative transition-all duration-300 z-30", isFocused || query ? "w-64 md:w-80" : "w-10 md:w-64")}>
      <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) window.location.href = `/search?library=drama&keyword=${encodeURIComponent(query.trim())}`; }} className="flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400/60 rounded-full px-3.5 py-2 focus-within:bg-[#0f172a] focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all group">
        <button 
          type="button" 
          onClick={() => {
            if (!isFocused && !query) {
              document.getElementById('drama-search-input')?.focus();
            } else if (query.trim()) {
              window.location.href = `/search?library=drama&keyword=${encodeURIComponent(query.trim())}`;
            }
          }}
          disabled={loading} 
          className="shrink-0 outline-none hover:scale-110 transition-transform"
        >
            {loading ? <Loader2 size={16} className="text-cyan-400 animate-spin" /> : <Search size={16} className="text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />}
        </button>
        <input
          id="drama-search-input"
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search dramas..."
          className={cn("bg-transparent text-white text-xs font-bold w-full outline-none placeholder:text-cyan-200/50 transition-all", !isFocused && !query && "md:block hidden")}
        />
        {query && (
          <div className="flex items-center shrink-0">
            <button type="button" onClick={() => setQuery('')} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors outline-none">
               <Plus size={16} className="rotate-45" />
            </button>
            <button type="button" onClick={() => window.location.href = `/search?library=drama&keyword=${encodeURIComponent(query.trim())}`} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors outline-none border-l border-cyan-500/30 ml-1 pl-2">
               <ChevronRight size={16} />
            </button>
          </div>
        )}
      </form>
      {results.length > 0 && (
        <div className="absolute top-full mt-3 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 flex flex-col gap-1 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {results.map(r => (
            <Link key={r.id} href={`/drama-watch/${r.id}`} onClick={() => setQuery('')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all group">
              {r.image && <img src={r.image} alt={r.title} className="w-10 h-14 object-cover rounded-md shadow-md" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-cyan-50 group-hover:text-cyan-300 truncate transition-colors">{r.title}</p>
                <p className="text-[9px] text-cyan-200/50 font-bold uppercase tracking-widest">{r.country} {r.year && `· ${r.year}`}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Section Row ───────────────────────────────────────────────────────────────

const DramaRow = ({ section, isFirst }: { section: DramaSection & { query?: string }, isFirst?: boolean }) => {
  if (!section.items.length) return null;
  return (
    <div className={cn("w-full relative z-20 px-4 md:px-8", isFirst ? "-mt-6 md:-mt-12" : "mt-8")}>
      <div className="mb-3 flex items-center justify-between w-full">
          <h2 className="text-[16px] md:text-[22px] font-black text-white tracking-tight flex items-center gap-2 group cursor-pointer w-fit drop-shadow-md">
             {section.title}
          </h2>
          <Link href={section.query ? `/search?library=drama&keyword=${section.query}` : `/search?library=drama`} className="text-[10px] md:text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-widest transition-colors bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            View All <ChevronRight size={14} />
          </Link>
      </div>
      <div className="w-full relative group/row">
          <div className="flex gap-4 md:gap-5 pb-6 pt-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
            {section.items.map(item => <div key={item.id} className="snap-start shrink-0 w-[140px] sm:w-[160px] md:w-[190px]"><DCard item={item} /></div>)}
          </div>
      </div>
    </div>
  );
};

// ── Section Grid ───────────────────────────────────────────────────────────────

const DramaGrid = ({ section }: { section: DramaSection & { query?: string } }) => {
  if (!section.items.length) return null;
  return (
    <div className="w-full relative z-20 mt-8 mb-8 px-4 md:px-8">
      <div className="mb-4 flex items-center justify-between w-full">
          <h2 className="text-[16px] md:text-[22px] font-black text-white tracking-tight flex items-center gap-2 w-fit drop-shadow-md">
             {section.title}
          </h2>
          <Link href={section.query ? `/search?library=drama&keyword=${section.query}` : `/search?library=drama`} className="text-[10px] md:text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-widest transition-colors bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            View All <ChevronRight size={14} />
          </Link>
      </div>
      <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {section.items.map(item => <DCard key={item.id} item={item} />)}
          </div>
      </div>
    </div>
  );
};

// ── Hero Slider (Prime Video Immersive Style) ─────────────────────────────────

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
          omni.drama.getDetail(item.id).then(res => {
              if (res) setDetails(prev => ({ ...prev, [item.id]: res }));
          }).catch(() => {});
      }
  }, [currentIndex, items, details]);

  if (!items || items.length === 0) return null;
  const item = items[currentIndex];
  const detail = details[item.id];

  return (
    <div className="relative w-full h-[85vh] md:h-[95vh] bg-[#020617] overflow-hidden">
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
            <img src={detail?.banner || item.image} alt={item.title} className="w-full h-full object-cover opacity-60 md:opacity-80 mix-blend-screen" loading="eager" />
          )}
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/85 to-transparent w-full md:w-[70%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent bottom-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80 h-32 top-0" />
          
          {/* Magical Flares */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Drama Search Bar positioned cleanly in Hero header area without overlapping top nav */}
      <div className="absolute top-28 right-4 md:right-8 z-30 flex items-center gap-4">
         <DramaSearch />
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-20 md:bottom-28 left-0 w-full px-4 md:px-12 flex flex-col justify-end z-10 pointer-events-none">
        <AnimatePresence mode="wait">
            <motion.div 
                key={`content-${item.id}`}
                initial={{ opacity: 0, x: -30 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.6, delay: 0.2 }} 
                className="pointer-events-auto max-w-3xl w-full"
            >
              <div className="flex items-center gap-2 mb-3">
                  <Check size={14} className="text-cyan-400 p-0.5 bg-cyan-400/20 rounded-full" />
                  <span className="text-[10px] md:text-xs font-black text-cyan-300 tracking-[0.2em] uppercase">Included with Shadow Prime</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[1.15] tracking-tight mb-4 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                {item.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 text-[10px] md:text-[11px] font-black text-cyan-100/80 mb-5 uppercase tracking-widest">
                  <span className="text-black bg-cyan-400 px-2.5 py-0.5 rounded-full font-black shadow-[0_0_10px_rgba(34,211,238,0.4)]">Top Rated</span>
                  <CountryBadge country={item.country} type={item.type} showFullname />
                  {item.year && <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/10">{item.year}</span>}
                  {item.episode && <span className="border border-white/20 px-2 py-0.5 rounded-full">{item.episode} Episodes</span>}
                  <span className="border border-white/20 px-2 py-0.5 rounded-full">HD</span>
              </div>

              <p className="text-xs md:text-sm text-cyan-50/80 leading-relaxed mb-7 line-clamp-3 md:line-clamp-4 font-medium max-w-2xl">
                 {detail?.synopsis || "Unveil the mysteries hidden within the shadows. Discover a world of magic, politics, and romance in this exclusive drama."}
              </p>
              
              {/* Rounded Buttons with proper padding & Play label */}
              <div className="flex items-center flex-wrap gap-3">
                <Link href={`/drama-watch/${item.id}`} className="flex items-center justify-center gap-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm md:text-base px-7 py-3 rounded-full transition-all active:scale-95 shadow-[0_0_25px_rgba(34,211,238,0.5)]">
                  <Play size={18} fill="black" /> Play
                </Link>
                <Link href={`/drama-watch/${item.id}`} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm md:text-base px-6 py-3 rounded-full transition-all backdrop-blur-md shadow-xl border border-white/20 active:scale-95">
                  <Info size={18} /> Details
                </Link>
                <button className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/20 active:scale-95">
                  <Plus size={20} />
                </button>
              </div>
            </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="flex items-center gap-2 mt-8 pointer-events-auto w-fit bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10">
            {items.map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => setCurrentIndex(i)} 
                    className={cn("h-1.5 rounded-full transition-all duration-300", currentIndex === i ? "w-6 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" : "w-1.5 bg-white/30 hover:bg-white/60")}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default function DramaHomePage() {
  const [sections, setSections] = useState<DramaSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const home = await omni.drama.getHome();
      let loadedSections = home?.sections?.filter((s:any) => s.items && s.items.length > 0) || [];
      
      // Fetch independent sections directly with Promise.all
      const [korean, chinese, japanese, turkish] = await Promise.all([
          omni.drama.getByCountry('korean'),
          omni.drama.getByCountry('chinese'),
          omni.drama.getByCountry('japanese'),
          omni.drama.getByCountry('turkish')
      ]);

      if (korean?.items?.length) loadedSections.push({ title: 'Top K-Dramas', items: korean.items.slice(0, 12), query: 'korean' });
      if (chinese?.items?.length) loadedSections.push({ title: 'Top C-Dramas', items: chinese.items.slice(0, 12), query: 'chinese' });
      if (japanese?.items?.length) loadedSections.push({ title: 'Top J-Dramas', items: japanese.items.slice(0, 12), query: 'japanese' });
      if (turkish?.items?.length) loadedSections.push({ title: 'Top Turkish Dramas', items: turkish.items.slice(0, 12), query: 'turkish' });

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
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-cyan-500/30">
      {loading ? (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#020617]">
           <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
        </div>
      ) : (
        <>
          {heroItems.length > 0 && <HeroSlider items={heroItems} />}
          
          <div className="flex flex-col gap-6 md:gap-8 relative z-20">
            {displaySections.map((section: any, i) => {
                if (i === 0) return <DramaRow key={section.title + i} section={section} isFirst={true} />;
                return <DramaGrid key={section.title + i} section={section} />;
            })}
          </div>

          {sections.length === 0 && (
             <div className="w-full flex flex-col items-center justify-center py-32 gap-4 text-cyan-500/50">
                <span className="text-6xl drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">🎭</span>
                <p className="font-black uppercase tracking-widest text-sm">No dramas found in the realm</p>
             </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}
