"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Settings2, Scroll, BookOpen, Layers, Check, Loader2, Sparkles
} from 'lucide-react';
import { ChapterPagesResult, ReadingChapter } from '@/lib/manga';
import { cn } from '@/lib/utils';

export default function MangaReaderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id as string;
  const chapterId = params?.chapterId as string;
  const lang = searchParams?.get('lang') || 'en';

  const [pagesData, setPagesData] = useState<ChapterPagesResult | null>(null);
  const [chapters, setChapters] = useState<ReadingChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingMode, setReadingMode] = useState<'webtoon' | 'single'>('webtoon');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chapter pages
  useEffect(() => {
    if (!chapterId) return;
    let isSubscribed = true;

    async function loadPages() {
      setLoading(true);
      try {
        const res = await fetch(`/api/manga/pages?chapterId=${encodeURIComponent(chapterId)}`);
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed && json.data) {
            setPagesData(json.data);
            setCurrentPage(1);
          }
        }
      } catch (err) {
        console.error('Failed to load chapter pages:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadPages();
    return () => { isSubscribed = false; };
  }, [chapterId]);

  // Fetch all chapters to enable next/previous navigation
  useEffect(() => {
    if (!id) return;
    async function loadChapters() {
      try {
        const res = await fetch(`/api/manga/chapters?id=${encodeURIComponent(id)}&lang=${lang}&order=asc`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) setChapters(json.data);
        }
      } catch (err) {}
    }
    loadChapters();
  }, [id, lang]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Auto hide controls in fullscreen or on idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        if (readingMode === 'single') {
          setCurrentPage(p => Math.min((pagesData?.pages.length || 1), p + 1));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (readingMode === 'single') {
          setCurrentPage(p => Math.max(1, p - 1));
        }
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pagesData, readingMode]);

  // Find next and previous chapters
  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const totalPages = pagesData?.pages.length || 0;

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#070707] text-white flex flex-col relative select-none"
    >
      {/* Top Header Bar */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 bg-[#070707]/90 backdrop-blur-md border-b border-white/10 px-3 py-2.5 flex items-center justify-between transition-transform duration-300",
        !showControls && "-translate-y-full"
      )}>
        <div className="flex items-center gap-3">
          <Link
            href={`/manga/${id}`}
            className="p-1.5 rounded-full hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95"
            title="Exit Reader"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xs font-bold text-white line-clamp-1 max-w-[200px] sm:max-w-md">
              Chapter {chapters.find(c => c.id === chapterId)?.chapter || 'Reading'}
            </h1>
            <span className="text-[10px] text-zinc-400">
              {lang.toUpperCase()} • {totalPages} Pages
            </span>
          </div>
        </div>

        {/* Reader Mode & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/5 rounded-full p-0.5 text-xs">
            <button
              onClick={() => setReadingMode('webtoon')}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all",
                readingMode === 'webtoon' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Scroll size={12} />
              <span className="hidden sm:inline">Webtoon</span>
            </button>
            <button
              onClick={() => setReadingMode('single')}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all",
                readingMode === 'single' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <BookOpen size={12} />
              <span className="hidden sm:inline">Page</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* Main Reader Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center pt-14 pb-20 w-full min-h-screen">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32">
            <Loader2 size={32} className="animate-spin text-violet-400" />
            <p className="text-xs text-zinc-400">Summoning grimoire pages...</p>
          </div>
        ) : totalPages === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs">
            No pages could be rendered for this chapter.
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Continuous Scroll Mode */
          <div className="w-full max-w-3xl flex flex-col items-center gap-0">
            {pagesData?.pages.map((imgUrl, idx) => (
              <div key={idx} className="relative w-full min-h-[300px] bg-zinc-950">
                <img
                  src={imgUrl}
                  alt={`Page ${idx + 1}`}
                  loading={idx < 3 ? 'eager' : 'lazy'}
                  className="w-full h-auto block select-none"
                />
                <span className="absolute bottom-2 right-2 text-[9px] bg-black/70 text-zinc-400 px-2 py-0.5 rounded-full pointer-events-none">
                  {idx + 1} / {totalPages}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Single Page Mode */
          <div className="relative max-w-4xl w-full flex flex-col items-center justify-center">
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width / 2) {
                  setCurrentPage(p => Math.max(1, p - 1));
                } else {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                }
              }}
              className="relative aspect-auto max-h-[85vh] w-auto max-w-full cursor-pointer overflow-hidden rounded-xl shadow-2xl border border-white/5"
            >
              <img
                src={pagesData?.pages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="max-h-[85vh] w-auto object-contain block mx-auto select-none"
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <footer className={cn(
        "fixed bottom-3 inset-x-3 max-w-md mx-auto z-50 bg-[#0d1424]/95 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-full px-4 py-2 flex items-center justify-between transition-transform duration-300",
        !showControls && "translate-y-24"
      )}>
        {/* Previous Chapter */}
        <button
          onClick={() => {
            if (prevChapter) router.push(`/manga/read/${id}/${prevChapter.id}?lang=${lang}`);
          }}
          disabled={!prevChapter}
          className="p-1.5 rounded-full hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-90"
          title="Previous Chapter"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page / Progress Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        {/* Next Chapter */}
        <button
          onClick={() => {
            if (nextChapter) router.push(`/manga/read/${id}/${nextChapter.id}?lang=${lang}`);
          }}
          disabled={!nextChapter}
          className="p-1.5 rounded-full hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-90"
          title="Next Chapter"
        >
          <ChevronRight size={18} />
        </button>
      </footer>
    </div>
  );
}
