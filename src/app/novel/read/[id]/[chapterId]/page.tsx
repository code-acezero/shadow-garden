"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Check,
  Settings2, Volume2, VolumeX, Globe, BookOpen, Loader2,
  CheckCircle2, ListFilter, Layers
} from 'lucide-react';
import { getLanguageMeta, SUPPORTED_LANGUAGES } from '@/lib/translator';
import { cn } from '@/lib/utils';
import { useUserData } from '@/context/UserDataContext';
import { playTapSound } from '@/lib/audioManager';
import Footer from '@/components/Anime/Footer';

type NovelTheme = 'abyss' | 'shadow' | 'sepia' | 'daylight';
type NovelFont = 'serif' | 'sans' | 'mono';

const THEME_CLASSES: Record<NovelTheme, { bg: string; text: string; bar: string; border: string; card: string }> = {
  abyss: { bg: 'bg-[#050505]', text: 'text-zinc-200', bar: 'bg-zinc-950/95', border: 'border-white/10', card: 'bg-zinc-900/60' },
  shadow: { bg: 'bg-[#0b1120]', text: 'text-slate-100', bar: 'bg-[#0f172a]/95', border: 'border-slate-800', card: 'bg-slate-900/60' },
  sepia: { bg: 'bg-[#fbf0d9]', text: 'text-[#382b1d]', bar: 'bg-[#f4e4c1]/95', border: 'border-[#dfcaa4]', card: 'bg-[#efe0be]/80' },
  daylight: { bg: 'bg-[#ffffff]', text: 'text-[#1e293b]', bar: 'bg-white/95', border: 'border-slate-200', card: 'bg-slate-50' },
};

const NOVEL_LANGUAGES = ['en', 'hi', 'bn', 'es', 'fr', 'ja'];

export default function NovelReaderPage() {
  const { saveReadingProgress } = useUserData();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id as string;
  const chapterId = params?.chapterId as string;
  const initialLang = searchParams?.get('lang') || 'en';

  const [currentLang, setCurrentLang] = useState<string>(initialLang);
  const [seriesTitle, setSeriesTitle] = useState<string>('');
  const [chapterList, setChapterList] = useState<Array<{ id: string; chapter: string; title: string }>>([]);
  const [chapterData, setChapterData] = useState<{
    title: string;
    chapterNumber: string;
    content: string;
    language: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [theme, setTheme] = useState<NovelTheme>('abyss');
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<NovelFont>('serif');
  const [showSettings, setShowSettings] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Text-To-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Click outside refs
  const langMenuRef = useRef<HTMLDivElement>(null);
  const chapterMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Extract raw chapter number from id e.g. "chap-1" -> "1"
  const chapterNum = chapterId?.replace(/^chap-/, '') || '1';

  // Sync currentLang if searchParams changes
  useEffect(() => {
    if (initialLang && initialLang !== currentLang) {
      setCurrentLang(initialLang);
    }
  }, [initialLang]);

  // Handle click outside to close dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setShowLangMenu(false);
      }
      if (chapterMenuRef.current && !chapterMenuRef.current.contains(target)) {
        setShowChapterMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Series Details (Title, etc.)
  useEffect(() => {
    if (!id) return;
    async function loadSeriesInfo() {
      try {
        const res = await fetch(`/api/manga/details?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.title) {
            setSeriesTitle(json.data.title);
          }
        }
      } catch (err) {
        console.error('Failed to load series details:', err);
      }
    }
    loadSeriesInfo();
  }, [id]);

  // Fetch Chapter list for quick jumping
  useEffect(() => {
    if (!id) return;
    async function loadChapters() {
      try {
        const res = await fetch(`/api/manga/chapters?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setChapterList(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load chapters:', err);
      }
    }
    loadChapters();
  }, [id]);

  // Fetch Chapter Content
  useEffect(() => {
    if (!id) return;
    let isSubscribed = true;

    async function loadContent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/manga/novel-chapter?id=${encodeURIComponent(id)}&chapter=${chapterNum}&lang=${currentLang}`);
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed && json.data) {
            setChapterData(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load novel chapter:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadContent();
    return () => { isSubscribed = false; };
  }, [id, chapterNum, currentLang]);

  // Track & Save Reading Progress for Continue Reading & Readlist Auto-Sync
  useEffect(() => {
    if (!id || !chapterId || !chapterData) return;
    const chapNumber = parseFloat(chapterNum) || 1;
    const maxChap = chapterList.length > 0 
      ? Math.max(...chapterList.map(c => parseFloat(c.chapter) || 0))
      : 0;
    const totalChaptersCount = maxChap > 0 ? maxChap : (chapterList.length > 0 ? chapterList.length : undefined);
    const isAtLastChapter = totalChaptersCount ? chapNumber >= totalChaptersCount : false;
    const isCompleted = isAtLastChapter && scrollProgress >= 85;

    saveReadingProgress({
      manga_id: id,
      title: seriesTitle || 'Light Novel',
      cover_image: '',
      chapter_id: chapterId,
      chapter_number: chapNumber,
      chapter_title: chapterData.title || `Chapter ${chapterNum}`,
      page_progress: 1,
      total_pages: 1,
      total_chapters: totalChaptersCount,
      is_completed: isCompleted,
      media_type: 'light_novel'
    }).catch(() => {});
  }, [id, chapterId, chapterNum, chapterData, seriesTitle, chapterList, scrollProgress, saveReadingProgress]);

  // Handle on-the-fly language switch
  const handleLanguageChange = async (newLang: string) => {
    setShowLangMenu(false);
    if (newLang === currentLang) return;
    setCurrentLang(newLang);
    setTranslating(true);
    try {
      const res = await fetch(`/api/manga/novel-chapter?id=${encodeURIComponent(id)}&chapter=${chapterNum}&lang=${newLang}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setChapterData(json.data);
      }
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setTranslating(false);
    }
  };

  // Text-to-Speech Narrator
  const toggleTTS = () => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    if (chapterData?.content) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(chapterData.content);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (currentLang === 'hi') utterance.lang = 'hi-IN';
      else if (currentLang === 'bn') utterance.lang = 'bn-BD';
      else if (currentLang === 'es') utterance.lang = 'es-ES';
      else if (currentLang === 'fr') utterance.lang = 'fr-FR';
      else if (currentLang === 'ja') utterance.lang = 'ja-JP';
      else utterance.lang = 'en-US';

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentTheme = THEME_CLASSES[theme];
  const nextChapterNum = parseInt(chapterNum, 10) + 1;
  const prevChapterNum = Math.max(1, parseInt(chapterNum, 10) - 1);
  const activeMeta = getLanguageMeta(currentLang);

  return (
    <div className={cn("min-h-screen transition-colors duration-300 flex flex-col relative", currentTheme.bg, currentTheme.text)}>
      {/* Scroll Progress Indicator Bar */}
      <div 
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 z-[60] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Professional Header Bar */}
      <header className={cn(
        "sticky top-0 inset-x-0 z-40 backdrop-blur-xl px-3 sm:px-6 h-14 flex items-center justify-between border-b shadow-sm transition-colors",
        currentTheme.bar,
        currentTheme.border
      )}>
        {/* Left: Back & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/manga/${id}`}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 shrink-0"
            title="Back to Series Overview"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="hidden sm:block w-[1px] h-5 bg-current opacity-15 shrink-0" />

          <div className="min-w-0 flex flex-col justify-center">
            <Link 
              href={`/manga/${id}`}
              className="text-xs sm:text-sm font-bold truncate hover:text-violet-500 transition-colors"
              title={seriesTitle || 'Series Overview'}
            >
              {seriesTitle || 'Novel Series'}
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] opacity-70 truncate">
              <span>Chapter {chapterNum}</span>
              <span>•</span>
              <span className="truncate">{chapterData?.title || 'Loading chapter...'}</span>
            </div>
          </div>
        </div>

        {/* Center: Chapter Quick Selector */}
        <div className="relative hidden md:flex items-center" ref={chapterMenuRef}>
          <div className="flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full p-0.5 text-xs">
            <button
              onClick={() => router.push(`/novel/read/${id}/chap-${prevChapterNum}?lang=${currentLang}`)}
              disabled={prevChapterNum === parseInt(chapterNum, 10)}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 transition-all"
              title="Previous Chapter"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={() => setShowChapterMenu(!showChapterMenu)}
              className="px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 hover:text-violet-400 transition-colors"
            >
              <span>Chapter {chapterNum}</span>
              <ChevronDown size={12} className={cn("transition-transform duration-200", showChapterMenu && "rotate-180")} />
            </button>

            <button
              onClick={() => router.push(`/novel/read/${id}/chap-${nextChapterNum}?lang=${currentLang}`)}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all"
              title="Next Chapter"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Chapter Selector Dropdown */}
          {showChapterMenu && (
            <div className={cn(
              "absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-80 overflow-y-auto rounded-2xl shadow-2xl border p-2 backdrop-blur-2xl z-50 flex flex-col gap-1 text-xs",
              currentTheme.bar,
              currentTheme.border
            )}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60 border-b border-black/5 dark:border-white/5">
                Jump to Chapter
              </div>
              {(chapterList.length > 0 ? chapterList : Array.from({ length: 60 }, (_, i) => ({ id: `chap-${i + 1}`, chapter: String(i + 1), title: `Chapter ${i + 1}` }))).map((chap) => {
                const isCurrent = chap.chapter === chapterNum;
                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      setShowChapterMenu(false);
                      router.push(`/novel/read/${id}/chap-${chap.chapter}?lang=${currentLang}`);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-medium",
                      isCurrent 
                        ? "bg-violet-600 text-white font-bold shadow-sm" 
                        : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
                    )}
                  >
                    <span className="truncate">Chapter {chap.chapter}</span>
                    {isCurrent && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Controls & Language Dropdown */}
        <div className="flex items-center gap-2">
          {/* Professional Language Dropdown Menu */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95",
                showLangMenu
                  ? "bg-violet-600 text-white border-violet-500 shadow-md"
                  : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-violet-500/40"
              )}
              title="Change reading language"
            >
              <Globe size={14} className={cn(showLangMenu ? "text-white" : "text-violet-400")} />
              <span className="font-bold">{activeMeta.native}</span>
              <span className="text-[10px] opacity-70 uppercase tracking-wider hidden sm:inline">
                ({currentLang})
              </span>
              <ChevronDown size={12} className={cn("transition-transform duration-200", showLangMenu && "rotate-180")} />
            </button>

            {/* Language Popover Menu */}
            {showLangMenu && (
              <div className={cn(
                "absolute top-full mt-2 right-0 w-52 rounded-2xl shadow-2xl border p-1.5 backdrop-blur-2xl z-50 flex flex-col gap-1 text-xs",
                currentTheme.bar,
                currentTheme.border
              )}>
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60 border-b border-black/5 dark:border-white/5">
                  Reading Language
                </div>
                {NOVEL_LANGUAGES.map((code) => {
                  const meta = getLanguageMeta(code);
                  const isSelected = currentLang.toLowerCase() === code.toLowerCase();
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-violet-600 text-white font-bold shadow-sm"
                          : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-current">
                          {code}
                        </span>
                        <div>
                          <div className="font-bold text-xs">{meta.native}</div>
                          <div className="text-[10px] opacity-70">{meta.label}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* TTS Audio Narrator Button */}
          <button
            onClick={toggleTTS}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold active:scale-95",
              isSpeaking 
                ? "bg-violet-600 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-pulse" 
                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-violet-500/40"
            )}
            title={isSpeaking ? "Pause Audio Narration" : "Listen via AI Audio Narrator"}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={14} />
                <span className="hidden md:inline font-bold">Pause</span>
              </>
            ) : (
              <>
                <Volume2 size={14} className="text-violet-400" />
                <span className="hidden md:inline font-bold">Listen</span>
              </>
            )}
          </button>

          {/* Typography Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-full border transition-all text-xs active:scale-95",
                showSettings
                  ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                  : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-violet-500/40"
              )}
              title="Reading Appearance & Typography"
            >
              <Settings2 size={15} />
            </button>

            {/* Typography & Theme Drawer Popup */}
            {showSettings && (
              <div className={cn(
                "absolute top-full mt-2 right-0 w-72 p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl flex flex-col gap-4 text-xs z-50",
                currentTheme.bar,
                currentTheme.border
              )}>
                {/* Theme Palette */}
                <div>
                  <span className="font-bold opacity-70 mb-2 block">Theme Palette</span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setTheme('abyss')}
                      className={cn("h-8 rounded-lg bg-[#050505] border border-white/20 text-white text-[10px] font-bold transition-all", theme === 'abyss' && "ring-2 ring-violet-500")}
                    >
                      Abyss
                    </button>
                    <button
                      onClick={() => setTheme('shadow')}
                      className={cn("h-8 rounded-lg bg-[#0b1120] border border-slate-700 text-white text-[10px] font-bold transition-all", theme === 'shadow' && "ring-2 ring-violet-500")}
                    >
                      Shadow
                    </button>
                    <button
                      onClick={() => setTheme('sepia')}
                      className={cn("h-8 rounded-lg bg-[#fbf0d9] border border-[#d6be96] text-[#382b1d] text-[10px] font-bold transition-all", theme === 'sepia' && "ring-2 ring-amber-600")}
                    >
                      Sepia
                    </button>
                    <button
                      onClick={() => setTheme('daylight')}
                      className={cn("h-8 rounded-lg bg-white border border-slate-300 text-slate-800 text-[10px] font-bold transition-all", theme === 'daylight' && "ring-2 ring-slate-800")}
                    >
                      Day
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold opacity-70">
                    <span>Text Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFontSize(s => Math.max(14, s - 2))}
                      className="flex-1 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 font-bold hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize(s => Math.min(26, s + 2))}
                      className="flex-1 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 font-bold hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <span className="font-bold opacity-70 mb-1.5 block">Font Family</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setFontFamily('serif')}
                      className={cn("py-1.5 rounded-lg bg-black/10 dark:bg-white/10 font-serif font-bold transition-colors", fontFamily === 'serif' && "bg-violet-600 text-white")}
                    >
                      Serif
                    </button>
                    <button
                      onClick={() => setFontFamily('sans')}
                      className={cn("py-1.5 rounded-lg bg-black/10 dark:bg-white/10 font-sans font-bold transition-colors", fontFamily === 'sans' && "bg-violet-600 text-white")}
                    >
                      Sans
                    </button>
                    <button
                      onClick={() => setFontFamily('mono')}
                      className={cn("py-1.5 rounded-lg bg-black/10 dark:bg-white/10 font-mono font-bold transition-colors", fontFamily === 'mono' && "bg-violet-600 text-white")}
                    >
                      Mono
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Reading Article Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        {loading || translating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-36 text-center">
            <Loader2 size={36} className="animate-spin text-violet-500" />
            <p className="text-sm font-medium opacity-70">
              {translating ? `Translating chapter into ${activeMeta.native}...` : 'Loading novel chapter...'}
            </p>
          </div>
        ) : (
          <article className="space-y-6 leading-relaxed">
            {/* Chapter Header */}
            <div className="text-center pb-8 border-b border-black/10 dark:border-white/10 mb-8">
              <span className="text-xs uppercase tracking-widest font-bold opacity-60 block mb-2">
                {seriesTitle || 'Novel Chapter'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-serif mb-3 tracking-tight">
                {chapterData?.title}
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs opacity-75">
                <Globe size={13} className="text-violet-400" />
                <span>{activeMeta.native} ({currentLang.toUpperCase()})</span>
              </div>
            </div>

            {/* Reading Paragraphs */}
            <div 
              className={cn(
                "space-y-6",
                fontFamily === 'serif' && "font-serif",
                fontFamily === 'sans' && "font-sans",
                fontFamily === 'mono' && "font-mono"
              )}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
            >
              {chapterData?.content.split('\n\n').map((para, i) => (
                <p key={i} className="indent-4 leading-relaxed tracking-normal">
                  {para}
                </p>
              ))}
            </div>

            {/* End of Chapter Section - Ultra Clean, Sleek, Professional (No Background Container) */}
            <section aria-label="End of chapter navigation" className="relative w-full max-w-2xl mx-auto px-4 mt-16 sm:mt-24 mb-16 sm:mb-20 text-center flex flex-col items-center">
              {/* Subtle ambient aura */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-48 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

              {/* Delicate Gradient Transition Hairline */}
              <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-current opacity-15 to-transparent mb-8 sm:mb-10" />

              {/* Status Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-semibold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                <span>Chapter Completed</span>
              </div>

              {/* Headline */}
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Finished Chapter {chapterNum}
              </h3>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm opacity-60 mt-2 max-w-md mx-auto leading-relaxed">
                Ready for the next chapter of <span className="font-semibold opacity-90">{seriesTitle || 'this chronicle'}</span>?
              </p>

              {/* Action Buttons: Floating Sleek Group (No Boxed Container) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg mt-8 pt-2">
                <button
                  onClick={() => {
                    playTapSound();
                    router.push(`/novel/read/${id}/chap-${prevChapterNum}?lang=${currentLang}`);
                  }}
                  disabled={prevChapterNum === parseInt(chapterNum, 10)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-current border-opacity-15 hover:border-opacity-30 bg-current/5 hover:bg-current/10 disabled:opacity-20 disabled:pointer-events-none text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <ChevronLeft size={15} />
                  <span>Previous Chapter</span>
                </button>

                <Link
                  href={`/manga/${id}`}
                  onClick={() => playTapSound()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-current border-opacity-15 hover:border-opacity-30 bg-current/5 hover:bg-current/10 text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <Layers size={14} className="opacity-70" />
                  <span>All Chapters</span>
                </Link>

                <button
                  onClick={() => {
                    playTapSound();
                    router.push(`/novel/read/${id}/chap-${nextChapterNum}?lang=${currentLang}`);
                  }}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:shadow-[0_0_36px_rgba(139,92,246,0.6)] active:scale-95 transition-all duration-200"
                >
                  <span>Next Chapter</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </section>
          </article>
        )}
      </main>

      {/* Floating Bottom Quick Bar */}
      <nav aria-label="Quick chapter navigation" className={cn(
        "sticky bottom-4 inset-x-3 max-w-sm mx-auto z-30 rounded-full px-4 py-2 flex items-center justify-between border shadow-2xl backdrop-blur-xl transition-colors",
        currentTheme.bar,
        currentTheme.border
      )}>
        <button
          onClick={() => router.push(`/novel/read/${id}/chap-${prevChapterNum}?lang=${currentLang}`)}
          disabled={prevChapterNum === parseInt(chapterNum, 10)}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold opacity-80 hover:opacity-100 disabled:opacity-20 transition-all active:scale-95"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <span className="text-xs font-bold">
          Chapter {chapterNum}
        </span>

        <button
          onClick={() => router.push(`/novel/read/${id}/chap-${nextChapterNum}?lang=${currentLang}`)}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold opacity-80 hover:opacity-100 transition-all active:scale-95"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </nav>

      {/* Global Site Footer */}
      <Footer />
    </div>
  );
}
