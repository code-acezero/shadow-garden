"use client";

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Play, ChevronRight, Loader2, Info } from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className={cn("relative transition-all duration-300 z-50", isFocused || query ? "w-64 md:w-80" : "w-10 md:w-64")}>
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-full px-3 py-2 focus-within:bg-black/80 focus-within:border-white/40 transition-all shadow-lg">
        {loading ? <Loader2 size={16} className="text-white animate-spin shrink-0" /> : <Search size={16} className="text-white shrink-0" />}
        <input
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={e => setQuery(e.target.value)}
          placeholder="Titles, people, genres"
          className={cn("bg-transparent text-white text-xs font-bold w-full outline-none placeholder:text-white/60 transition-all", !isFocused && !query && "md:block hidden")}
        />
      </div>
      {results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {results.map(r => (
            <Link key={r.id} href={`/drama-watch/${r.id}`} onClick={() => setQuery('')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group">
              {r.image && <img src={r.image} alt={r.title} className="w-10 h-14 object-cover rounded-md shadow-md" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-300 group-hover:text-white truncate transition-colors">{r.title}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase">{r.country} {r.year && `· ${r.year}`}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Drama Card (Netflix Hover Style) ───────────────────────────────────────────

const DCard = memo(({ item }: { item: DramaCard }) => (
  <Link href={`/drama-watch/${item.id}`} className="group relative flex flex-col shrink-0 w-[110px] sm:w-[130px] md:w-[160px] rounded-md transition-all duration-300 hover:scale-[1.10] hover:z-50 hover:shadow-2xl hover:ring-1 hover:ring-white/20 origin-center">
    <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900 relative">
      {item.image ? (
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-700"><Play size={24} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Hover Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
        <p className="text-[10px] md:text-xs font-bold text-white line-clamp-2 mb-1 shadow-black drop-shadow-md leading-tight">{item.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-[7px] md:text-[8px] font-black text-zinc-300 uppercase tracking-widest">
            {item.year && <span>{item.year}</span>}
            {item.episode && <span className="text-green-500">EP {item.episode}</span>}
            {item.country && <span className="flex items-center gap-0.5"><Globe size={8}/>{item.country}</span>}
        </div>
      </div>
      
      {/* Mini Play Button Center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110">
             <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
      </div>
    </div>
  </Link>
));
DCard.displayName = "DCard";

// ── Section Row ───────────────────────────────────────────────────────────────

const DramaRow = ({ section, isFirst }: { section: DramaSection, isFirst?: boolean }) => {
  if (!section.items.length) return null;
  return (
    <div className={cn("w-full relative z-10", isFirst ? "-mt-16 md:-mt-32" : "mt-6")}>
      <h2 className="text-[14px] md:text-[18px] font-bold text-white px-4 md:px-12 mb-2 tracking-wide flex items-center gap-2 group cursor-pointer w-fit">
         {section.title}
         <span className="text-[10px] font-bold text-cyan-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 flex items-center">Explore All <ChevronRight size={12}/></span>
      </h2>
      <div className="px-4 md:px-12 w-full pb-4 relative group/row">
          <ScrollArea className="w-full" type="scroll">
            <div className="flex gap-2 pb-6 pt-2 pr-12 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {section.items.map(item => <DCard key={item.id} item={item} />)}
            </div>
          </ScrollArea>
      </div>
    </div>
  );
};

// ── Netflix-Style Hero Banner ─────────────────────────────────────────────────

const HeroBanner = ({ item }: { item: DramaCard }) => {
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
     omni.drama.getDetail(item.id).then(res => {
         if (res) setDetail(res);
     }).catch(() => {});
  }, [item.id]);

  return (
    <div className="relative w-full h-[85vh] md:h-[100vh] bg-[#050505]">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        {item.image && (
          <img src={detail?.banner || item.image} alt={item.title} className="w-full h-full object-cover opacity-90 scale-105" loading="eager" />
        )}
        {/* Netflix Edge Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent w-full md:w-[60%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent h-64 bottom-0" />
      </div>

      {/* Floating Top Nav Search Override (Only for Desktop really, mobile gets it too) */}
      <div className="absolute top-20 md:top-24 right-4 md:right-12 z-50">
         <DramaSearch />
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-24 md:bottom-32 left-0 w-full px-4 md:px-12 flex flex-col justify-end z-10 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl pointer-events-auto">
          {item.country && (
            <div className="flex items-center gap-2 mb-2 md:mb-4">
              <span className="text-red-600 text-2xl md:text-4xl font-black leading-[0] tracking-tighter">N</span>
              <span className="text-[8px] md:text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">{item.country} SERIES</span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-4 drop-shadow-2xl font-serif">
            {item.title}
          </h1>

          <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold text-zinc-300 mb-4 drop-shadow-lg uppercase tracking-widest">
              <span className="text-green-500">{Math.floor(Math.random() * 20 + 80)}% Match</span>
              {item.year && <span>{item.year}</span>}
              {detail?.status && <span className="border border-zinc-500/50 px-1 py-0.5 rounded">{detail.status}</span>}
              {item.episode && <span>{item.episode} EPS</span>}
          </div>

          <p className="text-xs md:text-sm text-white/90 leading-relaxed mb-6 drop-shadow-lg line-clamp-3 md:line-clamp-4 font-medium max-w-xl">
             {detail?.synopsis || "Loading synopsis details from the Shadow Garden archives..."}
          </p>
          
          <div className="flex gap-3">
            <Link href={`/drama-watch/${item.id}`} className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-black text-sm md:text-base px-6 py-2.5 rounded transition-all active:scale-95 shadow-xl">
              <Play size={20} fill="black" /> Play
            </Link>
            <button onClick={() => window.location.href = `/drama-watch/${item.id}`} className="flex items-center gap-2 bg-zinc-500/40 hover:bg-zinc-500/60 text-white font-bold text-sm md:text-base px-6 py-2.5 rounded transition-all backdrop-blur-sm shadow-xl border border-white/10">
              <Info size={20} /> More Info
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ── Categories Filter ─────────────────────────────────────────────────────────

const Categories = ({ onSelect }: { onSelect: (cat: string) => void }) => {
  const categories = [
    { name: 'K-Drama', query: 'korean' },
    { name: 'C-Drama', query: 'chinese' },
    { name: 'J-Drama', query: 'japanese' },
    { name: 'T-Drama', query: 'taiwanese' },
    { name: 'Thai', query: 'thai' }
  ];

  return (
    <div className="w-full px-4 md:px-12 mb-8 -mt-8 relative z-20">
      <div className="flex items-center gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2 shrink-0">Explore By Region</span>
        {categories.map(cat => (
          <button 
            key={cat.name}
            onClick={() => onSelect(cat.query)}
            className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold transition-all shrink-0 active:scale-95"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────

export default function DramaHomePage() {
  const [sections, setSections] = useState<DramaSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredResults, setFilteredResults] = useState<DramaCard[] | null>(null);
  const [filterTitle, setFilterTitle] = useState('');
  const [loadingFilter, setLoadingFilter] = useState(false);

  useEffect(() => {
    (async () => {
      const home = await omni.drama.getHome();
      if (home && home.sections) {
          setSections(home.sections.filter((s:any) => s.items && s.items.length > 0));
      }
      setLoading(false);
    })();
  }, []);

  const handleCategorySelect = async (query: string) => {
    setLoadingFilter(true);
    setFilterTitle(query.charAt(0).toUpperCase() + query.slice(1) + " Dramas");
    const r = await omni.drama.search(query);
    setFilteredResults(r.items);
    setLoadingFilter(false);
    window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' });
  };

  const hero = sections[0]?.items[0] || null;
  const displaySections = sections.map((s, i) => {
      if (i === 0 && hero) return { ...s, items: s.items.slice(1) };
      return s;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 overflow-x-hidden">
      {loading ? (
        <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4">
           <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {hero && <HeroBanner item={hero} />}
          
          <Categories onSelect={handleCategorySelect} />

          <div className="flex flex-col gap-8 md:gap-10 relative z-20">
            {loadingFilter ? (
              <div className="w-full flex justify-center py-20"><Loader2 className="animate-spin text-white opacity-50" /></div>
            ) : filteredResults ? (
              <div className="w-full">
                <h2 className="text-[14px] md:text-[18px] font-bold text-white px-4 md:px-12 mb-4 tracking-wide flex items-center gap-2">
                  {filterTitle}
                  <button onClick={() => setFilteredResults(null)} className="text-[10px] text-red-500 hover:text-red-400 ml-4 font-black uppercase">Clear Filter</button>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 px-4 md:px-12">
                  {filteredResults.map(item => <DCard key={item.id} item={item} />)}
                </div>
                {filteredResults.length === 0 && (
                  <p className="px-4 md:px-12 text-zinc-500 text-sm">No dramas found for this category.</p>
                )}
              </div>
            ) : (
              displaySections.map((section, i) => (
                <DramaRow key={section.title} section={section} isFirst={i === 0} />
              ))
            )}
          </div>

          {sections.length === 0 && (
             <div className="w-full flex flex-col items-center justify-center py-32 gap-4 text-zinc-500">
                <span className="text-6xl">🎬</span>
                <p className="font-black uppercase tracking-widest text-sm">No dramas found</p>
                <p className="text-xs text-zinc-600">The drama portal may be temporarily unavailable</p>
             </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}
