"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Settings2, Volume2, 
  VolumeX, Languages, Type, BookOpen, Sparkles, Loader2
} from 'lucide-react';
import { SupportedReadingLanguage } from '@/lib/manga';
import { cn } from '@/lib/utils';

type NovelTheme = 'abyss' | 'shadow' | 'sepia' | 'daylight';
type NovelFont = 'serif' | 'sans' | 'mono';

const THEME_CLASSES: Record<NovelTheme, { bg: string; text: string; bar: string; border: string }> = {
  abyss: { bg: 'bg-[#050505]', text: 'text-zinc-200', bar: 'bg-zinc-950/90', border: 'border-white/10' },
  shadow: { bg: 'bg-[#0b1120]', text: 'text-slate-100', bar: 'bg-[#0f172a]/95', border: 'border-slate-800' },
  sepia: { bg: 'bg-[#fbf0d9]', text: 'text-[#382b1d]', bar: 'bg-[#f4e4c1]/95', border: 'border-[#dfcaa4]' },
  daylight: { bg: 'bg-[#ffffff]', text: 'text-[#1e293b]', bar: 'bg-white/95', border: 'border-slate-200' },
};

export default function NovelReaderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id as string;
  const chapterId = params?.chapterId as string;
  const initialLang = (searchParams?.get('lang') || 'en') as SupportedReadingLanguage;

  const [currentLang, setCurrentLang] = useState<SupportedReadingLanguage>(initialLang);
  const [chapterData, setChapterData] = useState<{
    title: string;
    chapterNumber: string;
    content: string;
    language: SupportedReadingLanguage;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [theme, setTheme] = useState<NovelTheme>('abyss');
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<NovelFont>('serif');
  const [showSettings, setShowSettings] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Text-To-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Extract raw chapter number from id e.g. "chap-1" -> "1"
  const chapterNum = chapterId?.replace(/^chap-/, '') || '1';

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

  // Handle on-the-fly language switch (English -> Hindi or Bengali)
  const handleLanguageChange = async (newLang: SupportedReadingLanguage) => {
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

  return (
    <div className={cn("min-h-screen transition-colors duration-300 flex flex-col relative", currentTheme.bg, currentTheme.text)}>
      {/* Scroll Progress Indicator Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-500 z-[60] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Header Bar */}
      <header className={cn(
        "sticky top-0 inset-x-0 z-50 backdrop-blur-md px-3 py-2.5 flex items-center justify-between border-b shadow-sm transition-colors",
        currentTheme.bar,
        currentTheme.border
      )}>
        <div className="flex items-center gap-3">
          <Link
            href={`/manga/${id}`}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
            title="Exit Reader"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xs font-bold line-clamp-1 max-w-[200px] sm:max-w-md">
              {chapterData?.title || `Chapter ${chapterNum}`}
            </h1>
            <span className="text-[10px] opacity-70">
              {currentLang.toUpperCase()} • Light Novel Reading Chamber
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full p-0.5 text-xs">
            <button
              onClick={() => handleLanguageChange('en')}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                currentLang === 'en' ? "bg-violet-600 text-white shadow-sm" : "opacity-70 hover:opacity-100"
              )}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                currentLang === 'hi' ? "bg-orange-500 text-white shadow-sm" : "opacity-70 hover:opacity-100"
              )}
            >
              HI
            </button>
            <button
              onClick={() => handleLanguageChange('bn')}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                currentLang === 'bn' ? "bg-emerald-500 text-white shadow-sm" : "opacity-70 hover:opacity-100"
              )}
            >
              BN
            </button>
          </div>

          {/* TTS Audio Button */}
          <button
            onClick={toggleTTS}
            className={cn(
              "p-2 rounded-full border transition-all text-xs",
              isSpeaking 
                ? "bg-violet-600 border-violet-400 text-white animate-pulse" 
                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
            )}
            title={isSpeaking ? "Pause Narration" : "Listen via Audio Narrator"}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all text-xs"
            title="Reading Typography Settings"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </header>

      {/* Typography & Theme Drawer Popup */}
      {showSettings && (
        <div className={cn(
          "fixed top-12 right-3 z-50 w-72 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex flex-col gap-4 text-xs transition-all",
          currentTheme.bar,
          currentTheme.border
        )}>
          {/* Theme Palette */}
          <div>
            <span className="font-bold opacity-70 mb-2 block">Theme Palette</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setTheme('abyss')}
                className={cn("h-8 rounded-lg bg-[#050505] border border-white/20 text-white text-[10px] font-bold", theme === 'abyss' && "ring-2 ring-violet-500")}
              >
                Abyss
              </button>
              <button
                onClick={() => setTheme('shadow')}
                className={cn("h-8 rounded-lg bg-[#0b1120] border border-slate-700 text-white text-[10px] font-bold", theme === 'shadow' && "ring-2 ring-violet-500")}
              >
                Shadow
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={cn("h-8 rounded-lg bg-[#fbf0d9] border border-[#d6be96] text-[#382b1d] text-[10px] font-bold", theme === 'sepia' && "ring-2 ring-amber-600")}
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme('daylight')}
                className={cn("h-8 rounded-lg bg-white border border-slate-300 text-slate-800 text-[10px] font-bold", theme === 'daylight' && "ring-2 ring-slate-800")}
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
                className="flex-1 py-1 rounded bg-black/10 dark:bg-white/10 font-bold"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(s => Math.min(26, s + 2))}
                className="flex-1 py-1 rounded bg-black/10 dark:bg-white/10 font-bold"
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
                className={cn("py-1 rounded bg-black/10 dark:bg-white/10 font-serif", fontFamily === 'serif' && "bg-violet-600 text-white")}
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily('sans')}
                className={cn("py-1 rounded bg-black/10 dark:bg-white/10 font-sans", fontFamily === 'sans' && "bg-violet-600 text-white")}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily('mono')}
                className={cn("py-1 rounded bg-black/10 dark:bg-white/10 font-mono", fontFamily === 'mono' && "bg-violet-600 text-white")}
              >
                Mono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Article Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        {loading || translating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
            <Loader2 size={32} className="animate-spin text-violet-500" />
            <p className="text-xs opacity-70">
              {translating ? `Translating chapter into ${currentLang === 'hi' ? 'Hindi' : 'Bengali'}...` : 'Summoning novel text...'}
            </p>
          </div>
        ) : (
          <article className="space-y-6 leading-relaxed">
            <div className="text-center pb-6 border-b border-black/10 dark:border-white/10 mb-8">
              <h1 className="text-2xl sm:text-3xl font-black font-serif mb-2">
                {chapterData?.title}
              </h1>
              <p className="text-xs opacity-60">
                Language: {currentLang === 'hi' ? 'हिन्दी (Hindi)' : currentLang === 'bn' ? 'বাংলা (Bengali)' : 'English (Original)'}
              </p>
            </div>

            <div 
              className={cn(
                "space-y-6",
                fontFamily === 'serif' && "font-serif",
                fontFamily === 'sans' && "font-sans",
                fontFamily === 'mono' && "font-mono"
              )}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
            >
              {chapterData?.content.split('\n\n').map((para, i) => (
                <p key={i} className="indent-4 leading-relaxed tracking-normal">
                  {para}
                </p>
              ))}
            </div>
          </article>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <footer className={cn(
        "sticky bottom-3 inset-x-3 max-w-md mx-auto z-50 rounded-full px-4 py-2 flex items-center justify-between border shadow-xl backdrop-blur-md transition-colors",
        currentTheme.bar,
        currentTheme.border
      )}>
        <button
          onClick={() => router.push(`/novel/read/${id}/chap-${prevChapterNum}?lang=${currentLang}`)}
          disabled={prevChapterNum === parseInt(chapterNum, 10)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold opacity-80 hover:opacity-100 disabled:opacity-20 transition-all active:scale-95"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <span className="text-xs font-bold">
          Chapter {chapterNum}
        </span>

        <button
          onClick={() => router.push(`/novel/read/${id}/chap-${nextChapterNum}?lang=${currentLang}`)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold opacity-80 hover:opacity-100 transition-all active:scale-95"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}
