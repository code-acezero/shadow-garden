"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, Search, Sparkles, Filter, ChevronLeft, ChevronRight, 
  Languages, Flame, Star, BookMarked, Layers, X
} from 'lucide-react';
import MobileContainer from '@/components/Layout/MobileContainer';
import Footer from '@/components/Anime/Footer';
import MangaCard from '@/components/Manga/MangaCard';
import { ReadingItem, ReadingMediaType, SupportedReadingLanguage } from '@/lib/manga';
import { cn } from '@/lib/utils';

const TYPE_TABS: { id: ReadingMediaType; label: string; icon: string }[] = [
  { id: 'all', label: 'All Realms', icon: '📚' },
  { id: 'manga', label: 'Manga', icon: '🇯🇵' },
  { id: 'manhwa', label: 'Manhwa', icon: '🇰🇷' },
  { id: 'light_novel', label: 'Light Novels', icon: '📖' },
  { id: 'webtoon', label: 'Webtoons', icon: '🎨' },
  { id: 'web_novel', label: 'Web Novels', icon: '🌐' },
  { id: 'manhua', label: 'Manhua', icon: '🇨🇳' },
  { id: 'comic', label: 'Comics', icon: '🇺🇸' },
];

const LANGUAGE_TABS: { id: SupportedReadingLanguage | 'all'; label: string; flag: string }[] = [
  { id: 'all', label: 'All Languages', flag: '🌐' },
  { id: 'en', label: 'English (Main)', flag: '🇺🇸' },
  { id: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { id: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
];

export default function MangaHomeClient() {
  const [activeType, setActiveType] = useState<ReadingMediaType>('all');
  const [activeLang, setActiveLang] = useState<SupportedReadingLanguage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [featuredItem, setFeaturedItem] = useState<ReadingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Items
  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      setLoading(true);
      try {
        let endpoint = `/api/manga/trending?type=${activeType}&page=${page}&limit=18`;
        if (debouncedQuery.trim()) {
          const langParam = activeLang !== 'all' ? `&lang=${activeLang}` : '';
          endpoint = `/api/manga/search?q=${encodeURIComponent(debouncedQuery)}&type=${activeType}${langParam}&page=${page}&limit=18`;
        }

        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          let dataList: ReadingItem[] = json.data || [];

          // Language filter on client if selected
          if (activeLang !== 'all' && !debouncedQuery.trim()) {
            dataList = dataList.filter(item => item.availableLanguages.includes(activeLang as SupportedReadingLanguage));
          }

          if (isSubscribed) {
            setItems(dataList);
            if (page === 1 && dataList.length > 0 && !featuredItem) {
              setFeaturedItem(dataList[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load manga library:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadData();
    return () => { isSubscribed = false; };
  }, [activeType, activeLang, debouncedQuery, page]);

  return (
    <MobileContainer hasBottomNav className="bg-[#050505] relative w-full">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="shadow-light-top" />
      <div className="shadow-light-bottom" />

      <div className="min-h-full flex flex-col relative z-10 px-2 sm:px-4 pt-3 pb-16">
        
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white font-lemon tracking-wide flex items-center gap-2">
                SHADOW <span className="text-violet-400">ARCHIVE</span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                Manga, Manhwa, Light Novels, Comics, Webtoons & Web Novels in English, Hindi & Bengali
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search titles, authors, novels..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Featured Masterpiece Banner (Hero) */}
        {!debouncedQuery && featuredItem && (
          <div className="relative w-full rounded-3xl overflow-hidden mb-6 border border-white/10 bg-gradient-to-r from-violet-950/40 via-black to-zinc-950 p-4 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
            <div className="relative w-36 md:w-48 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white/10">
              <Image
                src={featuredItem.cover}
                alt={featuredItem.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex-1 flex flex-col justify-center text-left">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-600 text-white shadow-md">
                  FEATURED MASTERPIECE
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {featuredItem.type.replace('_', ' ')}
                </span>
                {featuredItem.score && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    {featuredItem.score}
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-3xl font-black text-white font-serif line-clamp-1 mb-2">
                {featuredItem.title}
              </h2>

              <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed mb-4 max-w-2xl">
                {featuredItem.description}
              </p>

              <div className="flex items-center gap-3">
                <Link
                  href={`/manga/${featuredItem.id}`}
                  className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-95 flex items-center gap-2"
                >
                  <BookMarked size={14} />
                  <span>Start Reading</span>
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Languages size={14} className="text-violet-400" />
                  <span>English • हिन्दी • বাংলা</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Navigation Bar */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {TYPE_TABS.map((tab) => {
              const isActive = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveType(tab.id);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 select-none",
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/40"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5"
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Language Selection Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 shrink-0 px-1">
              <Languages size={13} className="text-violet-400" />
              <span>Language:</span>
            </span>
            {LANGUAGE_TABS.map((lang) => {
              const isActive = activeLang === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => {
                    setActiveLang(lang.id);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1 border active:scale-95 select-none",
                    isActive
                      ? "bg-white/15 text-white border-violet-500/60 shadow-sm"
                      : "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/5"
                  )}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 animate-pulse">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <BookOpen size={48} className="text-zinc-600 stroke-[1.5]" />
            <h3 className="text-lg font-bold text-white">No chronicles found</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Try refining your search keyword, switching media realms, or clearing the language filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
            {items.map((item) => (
              <MangaCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {items.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-violet-600/20 hover:border-violet-500/40 border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90 flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-zinc-400">
              Page <span className="text-white font-bold">{page}</span>
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || items.length < 18}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-violet-600/20 hover:border-violet-500/40 border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90 flex items-center gap-1.5"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="mt-14">
          <Footer />
        </div>
      </div>
    </MobileContainer>
  );
}
