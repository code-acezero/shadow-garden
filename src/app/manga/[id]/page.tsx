"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Star, BookOpen, Layers, Globe, Calendar, User, 
  ArrowUpDown, Search, Bookmark, CheckCircle2, ChevronRight, Share2, 
  Sparkles, ExternalLink, ChevronDown, Check, Clock, Pause, XCircle, Trash2
} from 'lucide-react';
import MobileContainer from '@/components/Layout/MobileContainer';
import Footer from '@/components/Anime/Footer';
import { ReadingItem, ReadingChapter } from '@/lib/manga';
import { getLanguageMeta } from '@/lib/translator';
import { cn } from '@/lib/utils';
import { useUserData } from '@/context/UserDataContext';
import { playTapSound } from '@/lib/audioManager';

const READLIST_STATUSES = [
  { id: 'reading', label: 'Reading', color: 'text-violet-400', bg: 'bg-violet-500/20', icon: <BookOpen size={14} className="text-violet-400" /> },
  { id: 'plan_to_read', label: 'Planned', color: 'text-sky-400', bg: 'bg-sky-500/20', icon: <Clock size={14} className="text-sky-400" /> },
  { id: 'completed', label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: <CheckCircle2 size={14} className="text-emerald-400" /> },
  { id: 'on_hold', label: 'On Hold', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: <Pause size={14} className="text-amber-400" /> },
  { id: 'dropped', label: 'Dropped', color: 'text-rose-400', bg: 'bg-rose-500/20', icon: <XCircle size={14} className="text-rose-400" /> },
];

export default function MangaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { readlist, addToReadlist, updateReadlistStatus, removeFromReadlist } = useUserData();

  const [item, setItem] = useState<ReadingItem | null>(null);
  const [chapters, setChapters] = useState<ReadingChapter[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [searchChapter, setSearchChapter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(true);

  // Dropdown menus state
  const [showReadlistMenu, setShowReadlistMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showHeroLangMenu, setShowHeroLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  const readlistMenuRef = useRef<HTMLDivElement>(null);
  const topReadlistMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const heroLangMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        readlistMenuRef.current && !readlistMenuRef.current.contains(target) &&
        topReadlistMenuRef.current && !topReadlistMenuRef.current.contains(target)
      ) {
        setShowReadlistMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setShowLangMenu(false);
      }
      if (heroLangMenuRef.current && !heroLangMenuRef.current.contains(target)) {
        setShowHeroLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check readlist entry
  const currentReadlistItem = useMemo(() => {
    return readlist.find((r) => (r.anime_id || r.id) === id);
  }, [readlist, id]);

  const isBookmarked = !!currentReadlistItem;
  const currentStatus = currentReadlistItem?.status || 'reading';

  const handleSetReadlistStatus = async (newStatus: string) => {
    playTapSound();
    if (!item) return;
    if (!isBookmarked) {
      await addToReadlist({
        id,
        title: item.title,
        image: item.cover,
        poster: item.cover,
        status: newStatus,
        media_type: item.type || (isNovel ? 'light_novel' : 'manga'),
        progress: 0,
        total_chapters: chapters.length || 0,
      });
    } else {
      await updateReadlistStatus(id, newStatus);
    }
    setShowReadlistMenu(false);
  };

  const handleRemoveFromReadlist = async () => {
    playTapSound();
    await removeFromReadlist(id);
    setShowReadlistMenu(false);
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

  // Fetch All Readable Chapters
  useEffect(() => {
    if (!id) return;
    let isSubscribed = true;

    async function loadChapters() {
      setLoadingChapters(true);
      try {
        const res = await fetch(`/api/manga/chapters?id=${encodeURIComponent(id)}&order=${sortOrder}`);
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
  }, [id, sortOrder]);

  const isNovel = item?.isNovel || item?.type === 'light_novel' || item?.type === 'web_novel';

  // Compute languages that actually have loaded chapters
  const loadedLanguages = useMemo(() => {
    if (isNovel) {
      return ['en', 'hi', 'bn', 'es', 'fr', 'ja'];
    }

    const set = new Set<string>();
    for (const c of chapters) {
      if (c.language) set.add(c.language.toLowerCase());
    }

    return Array.from(set).sort((a, b) => {
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      if (a === 'hi') return -1;
      if (b === 'hi') return 1;
      if (a === 'bn') return -1;
      if (b === 'bn') return 1;
      return a.localeCompare(b);
    });
  }, [chapters, isNovel]);

  // Auto-select valid language if selectedLang has no chapters
  useEffect(() => {
    if (loadedLanguages.length > 0 && !loadedLanguages.includes(selectedLang)) {
      if (loadedLanguages.includes('en')) {
        setSelectedLang('en');
      } else {
        setSelectedLang(loadedLanguages[0]);
      }
    }
  }, [loadedLanguages, selectedLang]);

  // Count chapters per loaded language
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of chapters) {
      const l = (c.language || 'en').toLowerCase();
      counts[l] = (counts[l] || 0) + 1;
    }
    return counts;
  }, [chapters]);

  // Filter Chapters for currently selected language & search query
  const filteredChapters = useMemo(() => {
    let list = isNovel 
      ? chapters 
      : chapters.filter(c => (c.language || 'en').toLowerCase() === selectedLang.toLowerCase());

    if (searchChapter.trim()) {
      const q = searchChapter.toLowerCase().trim();
      list = list.filter(c => 
        c.chapter.includes(q) || (c.title && c.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [chapters, selectedLang, searchChapter, isNovel]);

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

  const firstChapter = filteredChapters[0] || chapters[0];
  const activeLangMeta = getLanguageMeta(selectedLang);
  const currentStatusConfig = READLIST_STATUSES.find(s => s.id === currentStatus);

  return (
    <MobileContainer hasBottomNav className="bg-[#050505] relative w-full">
      {/* Background Ambience Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
      <div className="shadow-light-top" />
      <div className="shadow-light-bottom" />

      <div className="min-h-full flex flex-col relative z-10 px-2 sm:px-4 pt-3 pb-6 md:pb-8">
        
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
            <div className="relative" ref={topReadlistMenuRef}>
              <button
                onClick={() => {
                  playTapSound();
                  setShowReadlistMenu(!showReadlistMenu);
                }}
                className={cn(
                  "p-2 rounded-full border text-xs font-bold transition-all active:scale-90 flex items-center justify-center",
                  isBookmarked 
                    ? "bg-violet-600 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                )}
                title={isBookmarked ? `In Readlist: ${currentStatusConfig?.label || 'Reading'}` : "Add to Read"}
              >
                <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Banner Card */}
        <div className="relative w-full rounded-3xl overflow-visible mb-6 border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 backdrop-blur-md">
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
              {loadedLanguages.length > 0 && (
                <div className="relative" ref={heroLangMenuRef}>
                  <button
                    onClick={() => {
                      playTapSound();
                      setShowHeroLangMenu(!showHeroLangMenu);
                    }}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all select-none active:scale-95 shadow-sm",
                      showHeroLangMenu || (selectedLang && selectedLang !== 'en')
                        ? "bg-violet-600 text-white border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.35)]"
                        : "bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border-white/10"
                    )}
                    title="Change Reading Language"
                  >
                    <span>{activeLangMeta?.flag || '🌐'}</span>
                    <span>
                      {selectedLang === 'en'
                        ? `${loadedLanguages.length} Languages`
                        : (activeLangMeta?.native || activeLangMeta?.label || selectedLang.toUpperCase())}
                    </span>
                    <ChevronDown size={10} className={cn("text-zinc-400 transition-transform duration-200", showHeroLangMenu && "rotate-180")} />
                  </button>

                  {/* Hero Language Dropdown Popover */}
                  <AnimatePresence>
                    {showHeroLangMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-h-[380px] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_24px_rgba(139,92,246,0.18)] border border-violet-500/25 bg-zinc-900/95 backdrop-blur-3xl z-50 flex flex-col p-3"
                      >
                        <div className="relative mb-2.5 shrink-0">
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
                          <input
                            type="text"
                            value={langSearch}
                            onChange={(e) => setLangSearch(e.target.value)}
                            placeholder="Search language..."
                            className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] border border-white/10 focus:border-violet-400/80 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-400 outline-none transition-all"
                          />
                        </div>

                        <div className="overflow-y-auto max-h-[260px] flex flex-col gap-1 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                          {loadedLanguages
                            .filter((langCode) => {
                              if (!langSearch.trim()) return true;
                              const meta = getLanguageMeta(langCode);
                              const q = langSearch.toLowerCase().trim();
                              return (
                                langCode.toLowerCase().includes(q) ||
                                meta.label.toLowerCase().includes(q) ||
                                meta.native.toLowerCase().includes(q)
                              );
                            })
                            .map((langCode) => {
                              const meta = getLanguageMeta(langCode);
                              const count = languageCounts[langCode] || 0;
                              const isSelected = selectedLang.toLowerCase() === langCode.toLowerCase();

                              return (
                                <button
                                  key={langCode}
                                  onClick={() => {
                                    playTapSound();
                                    setSelectedLang(langCode);
                                    setShowHeroLangMenu(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-2xl transition-all flex items-center justify-between text-xs",
                                    isSelected
                                      ? "bg-violet-600 text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] font-bold"
                                      : "bg-white/[0.04] hover:bg-violet-500/10 text-zinc-200 hover:text-white"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-base leading-none">{meta.flag || '🌐'}</span>
                                    <span className="font-semibold">{meta.native || meta.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-mono",
                                      isSelected ? "bg-white/20 text-white" : "bg-black/40 text-zinc-400"
                                    )}>
                                      {count > 0 ? `${count} ch` : langCode.toUpperCase()}
                                    </span>
                                    {isSelected && <Check size={13} className="stroke-[3]" />}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-white font-serif leading-tight mb-1">
              {item.title}
            </h1>
            {item.romajiTitle && item.romajiTitle !== item.title && (
              <p className="text-xs text-zinc-400 italic mb-3">{item.romajiTitle}</p>
            )}

            {/* Clickable Genres matching Anime Watch Page */}
            <div className="flex flex-wrap gap-2 mb-4">
              {item.genres?.map((g) => (
                <Link
                  key={g}
                  href={`/explore?library=manga&genre=${encodeURIComponent(g.toLowerCase())}`}
                  onClick={() => playTapSound()}
                  className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 hover:bg-violet-600 border border-white/10 hover:border-violet-500 text-zinc-300 hover:text-white transition-all uppercase tracking-wider active:scale-95 shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                  title={`Explore ${g} ${isNovel ? 'novels' : 'manga'}`}
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl mb-6">
              {item.description}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {firstChapter && (
                <Link
                  href={isNovel ? `/novel/read/${item.id}/${firstChapter.id}?lang=${selectedLang}` : `/manga/read/${item.id}/${firstChapter.id}?lang=${selectedLang}`}
                  onClick={() => playTapSound()}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-95 flex items-center gap-2"
                >
                  <BookOpen size={16} />
                  <span>Read Chapter {firstChapter.chapter}</span>
                </Link>
              )}

              {/* Add to Read Button with Dropdown Menu */}
              <div className="relative shrink-0" ref={readlistMenuRef}>
                <button
                  onClick={() => {
                    playTapSound();
                    setShowReadlistMenu(!showReadlistMenu);
                  }}
                  className={cn(
                    "px-5 py-3 rounded-full border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-md",
                    isBookmarked
                      ? "bg-violet-600/30 border-violet-500/60 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:bg-violet-600/40"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
                  )}
                >
                  <Bookmark size={15} className={isBookmarked ? "fill-violet-400 text-violet-400" : ""} />
                  <span>{isBookmarked ? (currentStatusConfig?.label || 'In Readlist') : 'Add to Read'}</span>
                  <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-200", showReadlistMenu && "rotate-180")} />
                </button>

                {/* Readlist Options Popover Menu */}
                <AnimatePresence>
                  {showReadlistMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#0d0d0e]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(139,92,246,0.2)] p-2 z-[100] flex flex-col gap-1"
                    >
                      <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 pb-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Reading Status
                        </span>
                        {isBookmarked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            Saved
                          </span>
                        )}
                      </div>
                      
                      {READLIST_STATUSES.map((statusItem) => {
                        const isCurrent = isBookmarked && currentStatus === statusItem.id;
                        return (
                          <button
                            key={statusItem.id}
                            onClick={() => handleSetReadlistStatus(statusItem.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                              isCurrent 
                                ? "bg-violet-600 text-white shadow-sm"
                                : "text-zinc-300 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {statusItem.icon}
                              <span>{statusItem.label}</span>
                            </div>
                            {isCurrent && <Check size={13} className="stroke-[3]" />}
                          </button>
                        );
                      })}

                      {isBookmarked && (
                        <>
                          <div className="h-px bg-white/10 my-1" />
                          <button
                            onClick={handleRemoveFromReadlist}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                          >
                            <Trash2 size={13} />
                            <span>Remove from Readlist</span>
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isBookmarked && (
                <Link
                  href="/library?mode=readlist"
                  onClick={() => playTapSound()}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all text-xs"
                  title="View in Readlist"
                >
                  <ExternalLink size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-4 md:p-6 backdrop-blur-md">
          {/* Section Header Controls: Sleek Single Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06] mb-5">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <Layers className="text-violet-400" size={20} />
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Chronicle Chapters</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                  {filteredChapters.length}
                </span>
              </h2>
            </div>

            {/* Actions: Language Filter Button, Sort Order & Chapter Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Single Language Filter Button with Bouncy Dropdown */}
              <div className="relative shrink-0" ref={langMenuRef}>
                <button
                  onClick={() => {
                    playTapSound();
                    setShowLangMenu(!showLangMenu);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border select-none shadow-sm backdrop-blur-md active:scale-95",
                    showLangMenu || (selectedLang && selectedLang !== 'en')
                      ? "bg-violet-600 text-white border-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.4)]"
                      : "bg-white/[0.05] hover:bg-white/[0.10] text-zinc-300 hover:text-white border-white/10"
                  )}
                  title="Language Filter"
                >
                  <span className="text-sm leading-none">{activeLangMeta?.flag || '🌐'}</span>
                  <span className="font-semibold tracking-wide">
                    {selectedLang === 'en'
                      ? 'English (Primary)'
                      : (activeLangMeta?.native || activeLangMeta?.label || selectedLang.toUpperCase())}
                  </span>
                  <ChevronDown size={13} className={cn("text-violet-300 transition-transform duration-200", showLangMenu && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-h-[380px] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_24px_rgba(139,92,246,0.18)] border border-violet-500/25 bg-zinc-900/95 backdrop-blur-3xl z-50 flex flex-col p-3"
                    >
                      <div className="relative mb-2.5 shrink-0">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
                        <input
                          type="text"
                          value={langSearch}
                          onChange={(e) => setLangSearch(e.target.value)}
                          placeholder="Search language..."
                          className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] border border-white/10 focus:border-violet-400/80 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-400 outline-none transition-all"
                        />
                      </div>

                      {/* List of languages */}
                      <div className="overflow-y-auto max-h-[280px] flex flex-col gap-1 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {loadedLanguages
                          .filter((langCode) => {
                            if (!langSearch.trim()) return true;
                            const meta = getLanguageMeta(langCode);
                            const q = langSearch.toLowerCase().trim();
                            return (
                              langCode.toLowerCase().includes(q) ||
                              meta.label.toLowerCase().includes(q) ||
                              meta.native.toLowerCase().includes(q)
                            );
                          })
                          .map((langCode) => {
                            const meta = getLanguageMeta(langCode);
                            const count = languageCounts[langCode] || 0;
                            const isSelected = selectedLang.toLowerCase() === langCode.toLowerCase();

                            return (
                              <button
                                key={langCode}
                                onClick={() => {
                                  playTapSound();
                                  setSelectedLang(langCode);
                                  setShowLangMenu(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-2xl transition-all flex items-center justify-between text-xs",
                                  isSelected
                                    ? "bg-violet-600 text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] font-bold"
                                    : "bg-white/[0.04] hover:bg-violet-500/10 text-zinc-200 hover:text-white"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-base leading-none">{meta.flag || '🌐'}</span>
                                  <span className="font-semibold">{meta.native || meta.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-mono",
                                    isSelected ? "bg-white/20 text-white" : "bg-black/40 text-zinc-400"
                                  )}>
                                    {count > 0 ? `${count} ch` : langCode.toUpperCase()}
                                  </span>
                                  {isSelected && <Check size={13} className="stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Order Toggle */}
              <button
                onClick={() => {
                  playTapSound();
                  setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={13} />
                <span className="text-[11px] font-bold">
                  {sortOrder === 'asc' ? 'Ch 1 → End' : 'End → Ch 1'}
                </span>
              </button>

              {/* Chapter Filter Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                <input
                  type="text"
                  value={searchChapter}
                  onChange={(e) => setSearchChapter(e.target.value)}
                  placeholder="Search chapter..."
                  className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 w-32 sm:w-40"
                />
              </div>
            </div>
          </div>

          {/* Chapters List Grid */}
          {loadingChapters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 animate-pulse py-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-2xl border border-white/5" />
              ))}
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs flex flex-col items-center gap-3">
              <BookOpen size={32} className="text-zinc-600" />
              <p className="font-semibold text-zinc-400">No chapters found for this selection.</p>
              {loadedLanguages.length > 0 && (
                <p className="text-zinc-500 text-[11px]">
                  Try switching languages using the Language Filter button above.
                </p>
              )}
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
                    onClick={() => playTapSound()}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all group active:scale-[0.99] shadow-sm"
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
                        {chap.scanlationGroup || 'Grimoire Archive'}
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

        <div className="mt-6 md:mt-8">
          <Footer />
        </div>
      </div>
    </MobileContainer>
  );
}
