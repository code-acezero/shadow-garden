"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, BookOpen, Layers, Globe, Calendar, User, 
  ArrowUpDown, Search, Bookmark, CheckCircle2, ChevronRight, Share2
} from 'lucide-react';
import MobileContainer from '@/components/Layout/MobileContainer';
import Footer from '@/components/Anime/Footer';
import { ReadingItem, ReadingChapter, SupportedReadingLanguage } from '@/lib/manga';
import { cn } from '@/lib/utils';

export default function MangaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<ReadingItem | null>(null);
  const [chapters, setChapters] = useState<ReadingChapter[]>([]);
  const [selectedLang, setSelectedLang] = useState<SupportedReadingLanguage>('en');
  const [searchChapter, setSearchChapter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check bookmark state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved = JSON.parse(localStorage.getItem('shadow_reading_bookmarks') || '[]');
        setIsBookmarked(saved.includes(id));
      } catch (e) {}
    }
  }, [id]);

  const toggleBookmark = () => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem('shadow_reading_bookmarks') || '[]');
        const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
        localStorage.setItem('shadow_reading_bookmarks', JSON.stringify(next));
        setIsBookmarked(!isBookmarked);
      } catch (e) {}
    }
  };

  // Fetch Details
  useEffect(() => {
    if (!id) return;
    let isSubscribed = true;

    async function loadDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/manga/details?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed && json.data) {
            setItem(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load details:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadDetails();
    return () => { isSubscribed = false; };
  }, [id]);

  // Fetch Chapters
  useEffect(() => {
    if (!id) return;
    let isSubscribed = true;

    async function loadChapters() {
      setLoadingChapters(true);
      try {
        const res = await fetch(`/api/manga/chapters?id=${encodeURIComponent(id)}&lang=${selectedLang}&order=${sortOrder}`);
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed && json.data) {
            setChapters(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load chapters:', err);
      } finally {
        if (isSubscribed) setLoadingChapters(false);
      }
    }

    loadChapters();
    return () => { isSubscribed = false; };
  }, [id, selectedLang, sortOrder]);

  // Filter Chapters
  const filteredChapters = useMemo(() => {
    if (!searchChapter.trim()) return chapters;
    const q = searchChapter.toLowerCase().trim();
    return chapters.filter(c => 
      c.chapter.includes(q) || (c.title && c.title.toLowerCase().includes(q))
    );
  }, [chapters, searchChapter]);

  const isNovel = item?.isNovel || item?.type === 'light_novel' || item?.type === 'web_novel';

  if (loading) {
    return (
      <MobileContainer hasBottomNav className="bg-[#050505] min-h-screen">
        <div className="p-4 md:p-8 animate-pulse flex flex-col gap-6">
          <div className="h-8 w-24 bg-white/5 rounded-full" />
          <div className="h-64 bg-white/5 rounded-3xl" />
          <div className="h-96 bg-white/5 rounded-3xl" />
        </div>
      </MobileContainer>
    );
  }

  if (!item) {
    return (
      <MobileContainer hasBottomNav className="bg-[#050505] min-h-screen">
        <div className="p-8 text-center flex flex-col items-center justify-center gap-4 py-20">
          <BookOpen size={48} className="text-zinc-600" />
          <h2 className="text-xl font-bold text-white">Chronicle Not Found</h2>
          <Link href="/manga" className="px-4 py-2 rounded-full bg-violet-600 text-white text-xs font-bold">
            Back to Library
          </Link>
        </div>
      </MobileContainer>
    );
  }

  const firstChapter = chapters[0];

  return (
    <MobileContainer hasBottomNav className="bg-[#050505] relative w-full">
      {/* Background Ambience Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
      <div className="shadow-light-top" />
      <div className="shadow-light-bottom" />

      <div className="min-h-full flex flex-col relative z-10 px-2 sm:px-4 pt-3 pb-20">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              className={cn(
                "p-2 rounded-full border text-xs font-bold transition-all active:scale-90",
                isBookmarked 
                  ? "bg-violet-600 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
              )}
              title={isBookmarked ? "Bookmarked in Grimoire" : "Add to Library"}
            >
              <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
            </button>
          </div>
        </div>

        {/* Hero Banner Card */}
        <div className="relative w-full rounded-3xl overflow-hidden mb-6 border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 backdrop-blur-md">
          {/* Cover Art */}
          <div className="relative w-44 md:w-56 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-white/10">
            <Image
              src={item.cover}
              alt={item.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 flex flex-col text-left">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-600 text-white shadow-sm">
                {item.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                {item.status}
              </span>
              {item.score && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  {item.score}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-white font-serif leading-tight mb-1">
              {item.title}
            </h1>
            {item.romajiTitle && item.romajiTitle !== item.title && (
              <p className="text-xs text-zinc-400 italic mb-3">{item.romajiTitle}</p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.genres?.map((g) => (
                <span key={g} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-300">
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl mb-6">
              {item.description}
            </p>

            {/* Quick Action Buttons */}
            {firstChapter && (
              <div className="flex items-center gap-3">
                <Link
                  href={isNovel ? `/novel/read/${item.id}/${firstChapter.id}` : `/manga/read/${item.id}/${firstChapter.id}`}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-95 flex items-center gap-2"
                >
                  <BookOpen size={16} />
                  <span>Read Chapter 1</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-4 md:p-6 backdrop-blur-md">
          {/* Section Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06] mb-4">
            <div className="flex items-center gap-3">
              <Layers className="text-violet-400" size={20} />
              <h2 className="text-lg font-bold text-white">
                Chronicle Chapters ({chapters.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Language Selector */}
              <div className="flex items-center rounded-xl bg-white/5 border border-white/5 p-1 text-xs">
                <button
                  onClick={() => setSelectedLang('en')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all",
                    selectedLang === 'en' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  )}
                >
                  EN
                </button>
                <button
                  onClick={() => setSelectedLang('hi')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all",
                    selectedLang === 'hi' ? "bg-orange-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  )}
                >
                  हिन्दी (HI)
                </button>
                <button
                  onClick={() => setSelectedLang('bn')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all",
                    selectedLang === 'bn' ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  )}
                >
                  বাংলা (BN)
                </button>
              </div>

              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={14} />
              </button>

              {/* Chapter Filter Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                <input
                  type="text"
                  value={searchChapter}
                  onChange={(e) => setSearchChapter(e.target.value)}
                  placeholder="Filter chapter..."
                  className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 w-32 md:w-40"
                />
              </div>
            </div>
          </div>

          {/* Chapters List */}
          {loadingChapters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-pulse py-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-2xl border border-white/5" />
              ))}
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No chapters found for {selectedLang.toUpperCase()} language. Try switching to English (EN).
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredChapters.map((chap) => {
                const targetUrl = isNovel 
                  ? `/novel/read/${item.id}/${chap.id}?lang=${selectedLang}`
                  : `/manga/read/${item.id}/${chap.id}?lang=${selectedLang}`;

                return (
                  <Link
                    key={chap.id}
                    href={targetUrl}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all group active:scale-[0.99]"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-violet-300">
                          Chapter {chap.chapter}
                        </span>
                        {chap.title && (
                          <span className="text-xs text-zinc-400 line-clamp-1">
                            - {chap.title}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {chap.scanlationGroup || 'Scanlation Archive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400">
                        {chap.language.toUpperCase()}
                      </span>
                      <ChevronRight size={14} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-14">
          <Footer />
        </div>
      </div>
    </MobileContainer>
  );
}
