"use client";

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Flame, Clock, Globe, Play, ChevronRight, Loader2 } from 'lucide-react';
import { omni, DramaSection, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// ── Drama Card ────────────────────────────────────────────────────────────────

const DCard = memo(({ item }: { item: DramaCard }) => (
  <Link href={`/drama-watch/${item.id}`} className="group flex flex-col gap-2 shrink-0 w-32 sm:w-36">
    <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 relative shadow-lg ring-1 ring-white/5">
      {item.image ? (
        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-700"><Play size={24} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-orange-600 rounded-full w-9 h-9 flex items-center justify-center shadow-lg shadow-orange-900/50">
          <Play size={14} fill="white" className="text-white ml-0.5" />
        </div>
      </div>
      {item.episode && (
        <div className="absolute top-2 right-2 bg-orange-600/90 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          EP {item.episode}
        </div>
      )}
      {item.country && (
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-zinc-300 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
          <Globe size={8} /> {item.country}
        </div>
      )}
    </div>
    <div className="px-0.5">
      <p className="text-[10px] font-bold text-zinc-300 group-hover:text-white transition-colors line-clamp-2 leading-tight">{item.title}</p>
      {item.year && <p className="text-[9px] text-zinc-600 font-bold mt-0.5">{item.year}</p>}
    </div>
  </Link>
));
DCard.displayName = "DCard";

// ── Section ───────────────────────────────────────────────────────────────────

const DramaRow = ({ section }: { section: DramaSection }) => {
  if (!section.items.length) return null;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-[Cinzel]">
          <Flame size={16} className="text-orange-600" /> {section.title}
        </h2>
        <ChevronRight size={16} className="text-zinc-600" />
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {section.items.map(item => <DCard key={item.id} item={item} />)}
        </div>
        <ScrollBar orientation="horizontal" className="h-1 bg-white/5" />
      </ScrollArea>
    </div>
  );
};

// ── Hero Banner ───────────────────────────────────────────────────────────────

const HeroBanner = ({ item }: { item: DramaCard }) => (
  <div className="relative w-full h-[50vh] md:h-[60vh] rounded-[30px] overflow-hidden mb-10 shadow-2xl ring-1 ring-white/5">
    {item.image && (
      <>
        <img src={item.image} alt={item.title} className="w-full h-full object-cover scale-105" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      </>
    )}
    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
      {item.country && (
        <div className="flex items-center gap-2 mb-3">
          <Globe size={12} className="text-orange-500" />
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{item.country} Drama</span>
        </div>
      )}
      <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] leading-none tracking-tighter mb-4 drop-shadow-2xl max-w-2xl">
        {item.title}
      </h1>
      <div className="flex gap-3">
        <Link href={`/drama-watch/${item.id}`} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm px-6 py-3 rounded-full transition-all active:scale-95 shadow-lg shadow-orange-900/40">
          <Play size={16} fill="white" /> Watch Now
        </Link>
      </div>
    </div>
  </div>
);

// ── Search Bar ────────────────────────────────────────────────────────────────

const DramaSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DramaCard[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="relative w-full max-w-xl mx-auto mb-10">
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-colors">
        {loading ? <Loader2 size={18} className="text-orange-500 animate-spin shrink-0" /> : <Search size={18} className="text-zinc-500 shrink-0" />}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search dramas..."
          className="bg-transparent text-white text-sm font-bold w-full outline-none placeholder:text-zinc-600"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1">
          {results.map(r => (
            <Link key={r.id} href={`/drama-watch/${r.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
              {r.image && <img src={r.image} alt={r.title} className="w-8 h-11 object-cover rounded-lg" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-300 group-hover:text-white truncate transition-colors">{r.title}</p>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">{r.country} {r.year && `· ${r.year}`}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DramaHomePage() {
  const [sections, setSections] = useState<DramaSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const home = await omni.drama.getHome();
      setSections(home.sections);
      setLoading(false);
    })();
  }, []);

  const hero = sections[0]?.items[0] || null;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 pt-[env(safe-area-inset-top)] overflow-x-hidden">
      {/* Header */}
      <div className="w-full px-4 md:px-8 pt-6 pb-2 max-w-[1500px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[9px] font-black text-orange-600 uppercase tracking-[0.5em] mb-1">Shadow Garden</p>
            <h1 className="text-2xl md:text-3xl font-black font-[Cinzel] text-white tracking-tight leading-none">
              Drama<span className="text-orange-600">no</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">K · C · J · Hindi Dubbed</p>
          </div>
          <div className="w-12 h-12 bg-orange-600/10 border border-orange-600/30 rounded-2xl flex items-center justify-center">
            <span className="text-xl">🎬</span>
          </div>
        </motion.div>

        {/* Search */}
        <DramaSearch />

        {/* Loading */}
        {loading ? (
          <div className="w-full flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-orange-500 font-[Cinzel] animate-pulse tracking-widest text-sm uppercase">Loading Dramas...</p>
          </div>
        ) : (
          <>
            {/* Hero */}
            {hero && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <HeroBanner item={hero} />
              </motion.div>
            )}

            {/* Sections */}
            <div className="flex flex-col gap-10">
              {sections.map((section, i) => (
                <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                  <DramaRow section={section} />
                </motion.div>
              ))}
            </div>

            {/* Empty state */}
            {sections.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center py-32 gap-4 text-zinc-500">
                <span className="text-6xl">🎬</span>
                <p className="font-black uppercase tracking-widest text-sm">No dramas found</p>
                <p className="text-xs text-zinc-600">The drama portal may be temporarily unavailable</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
