"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Check,
  Maximize2, Minimize2, Scroll, BookOpen, Loader2, Globe, CheckCircle2, Layers
} from 'lucide-react';
import { ChapterPagesResult, ReadingChapter } from '@/lib/manga';
import { getLanguageMeta } from '@/lib/translator';
import { cn } from '@/lib/utils';
import { useUserData } from '@/context/UserDataContext';
import { playTapSound } from '@/lib/audioManager';
import Footer from '@/components/Anime/Footer';

export default function MangaReaderPage() {
  const { saveReadingProgress } = useUserData();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id as string;
  const chapterId = params?.chapterId as string;
  const lang = searchParams?.get('lang') || 'en';

  const [seriesTitle, setSeriesTitle] = useState<string>('');
  const [pagesData, setPagesData] = useState<ChapterPagesResult | null>(null);
  const [chapters, setChapters] = useState<ReadingChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingMode, setReadingMode] = useState<'webtoon' | 'single'>('webtoon');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chapterMenuRef = useRef<HTMLDivElement>(null);

  // Close chapter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (chapterMenuRef.current && !chapterMenuRef.current.contains(target)) {
        setShowChapterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch series title
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

  // Fetch chapters for navigation (filtered to current language)
  useEffect(() => {
    if (!id) return;
    async function loadChapters() {
      try {
        const res = await fetch(`/api/manga/chapters?id=${encodeURIComponent(id)}&order=asc`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const allChaps: ReadingChapter[] = json.data;
            const langChaps = allChaps.filter(c => (c.language || 'en').toLowerCase() === lang.toLowerCase());
            setChapters(langChaps.length > 0 ? langChaps : allChaps);
          }
        }
      } catch (err) {
        console.error('Failed to load navigation chapters:', err);
      }
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
    }, 4500);
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

  // Find next and previous chapters in the current language
  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const currentChapter = chapters[currentIndex] || chapters.find(c => c.id === chapterId);
  const currentChapterNum = currentChapter?.chapter || '1';
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const totalPages = pagesData?.pages.length || 0;
  const langMeta = getLanguageMeta(lang);

  // Track & Save Reading Progress for Continue Reading & Readlist Auto-Sync
  useEffect(() => {
    if (!id || !chapterId || !pagesData) return;
    const chapNum = parseFloat(currentChapterNum) || 1;
    const totalChaptersCount = chapters.length > 0 ? chapters.length : undefined;
    const isAtLastChapter = !nextChapter && chapters.length > 0;
    const isCompleted = isAtLastChapter && (currentPage >= (totalPages || 1) || readingMode === 'webtoon');

    saveReadingProgress({
      manga_id: id,
      title: seriesTitle || 'Manga',
      cover_image: pagesData.pages?.[0] || '',
      chapter_id: chapterId,
      chapter_number: chapNum,
      chapter_title: currentChapter?.title || `Chapter ${currentChapterNum}`,
      page_progress: currentPage,
      total_pages: totalPages || 1,
      total_chapters: totalChaptersCount,
      is_completed: isCompleted,
      media_type: 'manga'
    }).catch(() => {});
  }, [id, chapterId, seriesTitle, currentChapterNum, currentPage, pagesData, totalPages, chapters.length, nextChapter, readingMode, saveReadingProgress]);

  // Fallback image error handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl: string) => {
    const img = e.currentTarget;
    if (!img.src.includes('/api/proxy')) {
      img.src = `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#070707] text-white flex flex-col relative select-none"
    >
      {/* Top Header Bar */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 bg-[#070707]/95 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 h-14 flex items-center justify-between transition-transform duration-300 shadow-lg",
        !showControls && "-translate-y-full"
      )}>
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/manga/${id}`}
            className="p-2 rounded-full hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 shrink-0"
            title="Back to Series Overview"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="hidden sm:block w-[1px] h-5 bg-white/15 shrink-0" />

          <div className="min-w-0 flex flex-col justify-center">
            <Link
              href={`/manga/${id}`}
              className="text-xs sm:text-sm font-bold truncate hover:text-violet-400 transition-colors"
              title={seriesTitle || 'Series Overview'}
            >
              {seriesTitle || 'Manga Series'}
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
              <span>Chapter {currentChapterNum}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe size={11} className="text-violet-400" />
                <span>{langMeta.native}</span>
              </span>
              <span>•</span>
              <span>{totalPages} Pages</span>
            </div>
          </div>
        </div>

        {/* Center: Chapter Quick Jumper */}
        <div className="relative hidden md:flex items-center" ref={chapterMenuRef}>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 text-xs">
            <button
              onClick={() => {
                if (prevChapter) router.push(`/manga/read/${id}/${prevChapter.id}?lang=${lang}`);
              }}
              disabled={!prevChapter}
              className="p-1 rounded-full hover:bg-white/10 disabled:opacity-20 transition-all text-white"
              title="Previous Chapter"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={() => setShowChapterMenu(!showChapterMenu)}
              className="px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 text-zinc-200 hover:text-white transition-colors"
            >
              <span>Chapter {currentChapterNum}</span>
              <ChevronDown size={12} className={cn("transition-transform duration-200", showChapterMenu && "rotate-180")} />
            </button>

            <button
              onClick={() => {
                if (nextChapter) router.push(`/manga/read/${id}/${nextChapter.id}?lang=${lang}`);
              }}
              disabled={!nextChapter}
              className="p-1 rounded-full hover:bg-white/10 disabled:opacity-20 transition-all text-white"
              title="Next Chapter"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Chapter Selector Dropdown */}
          {showChapterMenu && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-80 overflow-y-auto rounded-2xl shadow-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-2 z-50 flex flex-col gap-1 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                Jump to Chapter ({lang.toUpperCase()})
              </div>
              {chapters.map((chap) => {
                const isCurrent = chap.id === chapterId;
                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      setShowChapterMenu(false);
                      router.push(`/manga/read/${id}/${chap.id}?lang=${lang}`);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-medium",
                      isCurrent 
                        ? "bg-violet-600 text-white font-bold shadow-sm" 
                        : "hover:bg-white/5 text-zinc-300 hover:text-white"
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

        {/* Right: Reading Mode & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 text-xs">
            <button
              onClick={() => setReadingMode('webtoon')}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all",
                readingMode === 'webtoon' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
              title="Continuous Scroll Mode"
            >
              <Scroll size={13} />
              <span className="hidden sm:inline">Webtoon</span>
            </button>
            <button
              onClick={() => setReadingMode('single')}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all",
                readingMode === 'single' ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
              title="Single Page Mode"
            >
              <BookOpen size={13} />
              <span className="hidden sm:inline">Page</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* Main Reader Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center pt-16 pb-16 w-full min-h-screen">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-36">
            <Loader2 size={36} className="animate-spin text-violet-500" />
            <p className="text-sm font-medium text-zinc-400">Loading chapter pages...</p>
          </div>
        ) : totalPages === 0 ? (
          <div className="text-center py-24 text-zinc-500 text-sm">
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
                  onError={(e) => handleImageError(e, imgUrl)}
                  className="w-full h-auto block select-none"
                />
                <span className="absolute bottom-2 right-2 text-[9px] bg-black/75 backdrop-blur-sm text-zinc-400 px-2 py-0.5 rounded-full pointer-events-none">
                  {idx + 1} / {totalPages}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Single Page Mode */
          <div className="relative max-w-4xl w-full flex flex-col items-center justify-center px-2">
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
                onError={(e) => handleImageError(e, pagesData?.pages[currentPage - 1] || '')}
                className="max-h-[85vh] w-auto object-contain block mx-auto select-none"
              />
            </div>
            <div className="mt-4 text-xs font-semibold text-zinc-400">
              Page {currentPage} of {totalPages} • Click left/right or use A/D keys
            </div>
          </div>
        )}

        {/* End of Chapter Section - Ultra Clean, Sleek, Professional (No Background Container) */}
        {!loading && totalPages > 0 && (
          <section aria-label="End of chapter navigation" className="relative w-full max-w-2xl mx-auto px-4 mt-16 sm:mt-24 mb-16 sm:mb-20 text-center flex flex-col items-center">
            {/* Ambient Background Glow (Subtle depth without any boxed container) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-48 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Subtle Gradient Transition Hairline */}
            <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-8 sm:mb-10" />

            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              <span>Chapter Completed</span>
            </div>

            {/* Chapter Headline */}
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Finished Chapter {currentChapterNum}
            </h3>

            {/* Chapter Title / Series Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
              {currentChapter?.title && !currentChapter.title.toLowerCase().startsWith('chapter') ? (
                <>
                  <span className="text-zinc-200 font-medium">"{currentChapter.title}"</span>
                  <span className="text-zinc-500 mx-1.5">•</span>
                </>
              ) : null}
              <span>You're caught up with this chapter of </span>
              <span className="text-zinc-200 font-semibold">{seriesTitle || 'the chronicle'}</span>.
            </p>

            {/* Action Buttons: Sleek Floating Group (No Boxed Container) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg mt-8 pt-2">
              {/* Previous Chapter Button */}
              <button
                onClick={() => {
                  playTapSound();
                  if (prevChapter) router.push(`/manga/read/${id}/${prevChapter.id}?lang=${lang}`);
                }}
                disabled={!prevChapter}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none text-zinc-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shadow-sm"
              >
                <ChevronLeft size={15} />
                <span>Previous Chapter</span>
              </button>

              {/* All Chapters (Chronicle Library) */}
              <Link
                href={`/manga/${id}`}
                onClick={() => playTapSound()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shadow-sm"
              >
                <Layers size={14} className="text-zinc-400" />
                <span>All Chapters</span>
              </Link>

              {/* Next Chapter Primary Action */}
              {nextChapter ? (
                <button
                  onClick={() => {
                    playTapSound();
                    router.push(`/manga/read/${id}/${nextChapter.id}?lang=${lang}`);
                  }}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:shadow-[0_0_36px_rgba(139,92,246,0.6)] active:scale-95 transition-all duration-200"
                >
                  <span>Next Chapter</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              ) : (
                <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 size={14} />
                  <span>Up to Date</span>
                </span>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav aria-label="Quick navigation bar" className={cn(
        "fixed bottom-4 inset-x-3 max-w-sm mx-auto z-40 bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-4 py-2 flex items-center justify-between transition-transform duration-300",
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
          <span>{readingMode === 'single' ? `Page ${currentPage} of ${totalPages}` : `Chapter ${currentChapterNum} • ${totalPages} Pages`}</span>
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
      </nav>

      {/* Global Site Footer */}
      <Footer />
    </div>
  );
}
