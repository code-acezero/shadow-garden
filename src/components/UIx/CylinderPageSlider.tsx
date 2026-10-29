"use client";

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CylinderPageSliderProps {
  page: number;
  loading: boolean;
  itemCount?: number;
  skeletonCount?: number;
  gridClassName?: string;
  withBottomInfo?: boolean;
  children: ReactNode;
}

const PulseLayer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
);

export const SectionCardSkeleton = ({ withBottomInfo = false }: { withBottomInfo?: boolean }) => (
  <div className="w-full flex flex-col group select-none">
    <div className="relative w-full aspect-[2/3] bg-white/[0.03] rounded-2xl md:rounded-[22px] overflow-hidden border border-white/[0.06] shadow-sm">
      <PulseLayer />
      {/* Top badges placeholder */}
      <div className="absolute top-2.5 left-2.5 h-4.5 w-10 bg-white/10 rounded-full" />
      <div className="absolute top-2.5 right-2.5 h-4.5 w-8 bg-white/10 rounded-full" />
      {/* Bottom title & pill placeholder */}
      <div className="absolute bottom-2.5 inset-x-2.5 flex flex-col gap-1.5 z-10">
        <div className="h-3 w-3/4 bg-white/15 rounded-md relative overflow-hidden"><PulseLayer /></div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-12 bg-white/10 rounded-full" />
          <div className="h-2.5 w-8 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
    {withBottomInfo && (
      <div className="mt-2.5 flex flex-col gap-1.5 px-1">
        <div className="h-3.5 w-4/5 bg-white/10 rounded relative overflow-hidden"><PulseLayer /></div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-1/3 bg-white/5 rounded" />
          <div className="h-2.5 w-1/4 bg-white/5 rounded" />
        </div>
      </div>
    )}
  </div>
);

/**
 * Isolated slide content component.
 * Maintains its own immutable snapshot of cards for its specific pageNumber.
 * When an outgoing page slides out, its cards NEVER snap or adopt the incoming page's cards.
 */
function SlideContentContainer({
  pageNumber,
  activePage,
  loading,
  children,
  pageCacheRef,
  skeletonCount,
  withBottomInfo
}: {
  pageNumber: number;
  activePage: number;
  loading: boolean;
  children: ReactNode;
  pageCacheRef: React.MutableRefObject<Map<number, ReactNode>>;
  skeletonCount: number;
  withBottomInfo?: boolean;
}) {
  const [content, setContent] = useState<ReactNode | null>(() => {
    // If cached from a previous visit, use it immediately
    const cached = pageCacheRef.current.get(pageNumber);
    if (cached) return cached;
    // If currently active and ready, use incoming children
    if (pageNumber === activePage && !loading && children) {
      pageCacheRef.current.set(pageNumber, children);
      return children;
    }
    return null;
  });

  useEffect(() => {
    // Update content ONLY when this slide matches activePage and data is loaded
    if (pageNumber === activePage && !loading && children) {
      pageCacheRef.current.set(pageNumber, children);
      setContent(children);
    }
  }, [pageNumber, activePage, loading, children, pageCacheRef]);

  // Show skeletons if no content yet or if actively loading on active page
  const showSkeleton = !content || (pageNumber === activePage && loading && !pageCacheRef.current.has(pageNumber));

  if (showSkeleton) {
    return (
      <>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SectionCardSkeleton key={`skel-${pageNumber}-${i}`} withBottomInfo={withBottomInfo} />
        ))}
      </>
    );
  }

  return <>{content}</>;
}

export default function CylinderPageSlider({
  page,
  loading,
  skeletonCount = 12,
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6",
  withBottomInfo = false,
  children
}: CylinderPageSliderProps) {
  const [direction, setDirection] = useState(1);
  const [prevPage, setPrevPage] = useState(page);
  const containerRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Global cache across page switches
  const pageCacheRef = useRef<Map<number, ReactNode>>(new Map());

  // Direction sync (1 = Next / Forward, -1 = Prev / Backward)
  if (page !== prevPage) {
    const newDir = page > prevPage ? 1 : -1;
    setDirection(newDir);
    setPrevPage(page);
  }

  // Lock minimum height during transitions so layout never jumps
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height || entry.target.clientHeight;
        if (height > 100) {
          setMinHeight(height);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading]);

  /**
   * Continuous Horizontal Card Scroll Transition:
   * - No zoom / scaling (scale: 1 at all times).
   * - No fade out / opacity drop (full opacity 1 throughout the entire transition).
   * - Exiting cards scroll smoothly off-screen (-100% or +100%).
   * - Entering cards scroll smoothly in from the opposite side (+100% or -100% to 0%).
   * - Synchronized duration (0.46s) with luxurious cubic-bezier deceleration curve.
   */
  const scrollVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 1
    }),
    center: {
      x: '0%',
      opacity: 1,
      transition: {
        x: { duration: 0.46, ease: [0.25, 1, 0.5, 1] }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 1,
      transition: {
        x: { duration: 0.46, ease: [0.25, 1, 0.5, 1] }
      }
    })
  };

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ 
        minHeight: minHeight ? `${minHeight}px` : undefined 
      }}
    >
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          ref={containerRef}
          key={`cylinder-page-${page}`}
          custom={direction}
          variants={scrollVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ 
            width: '100%',
            willChange: 'transform'
          }}
          className={gridClassName}
        >
          <SlideContentContainer
            pageNumber={page}
            activePage={page}
            loading={loading}
            children={children}
            pageCacheRef={pageCacheRef}
            skeletonCount={skeletonCount}
            withBottomInfo={withBottomInfo}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
