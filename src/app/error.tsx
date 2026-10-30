'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PageMascot, { MascotReaction } from '@/components/Mascot/PageMascot';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [mascotPaths, setMascotPaths] = useState({
    directions: '/mascots/fox-directions.webp',
    reactions: '/mascots/fox-reactions.webp',
  });

  useEffect(() => {
    console.error("Shadow Garden error caught:", error);
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('shadow_mascot_character');
        if (stored) {
          const char = JSON.parse(stored);
          if (char?.id) {
            setMascotPaths({
              directions: `/mascots/${char.id}-directions.webp`,
              reactions: `/mascots/${char.id}-reactions.webp`,
            });
          }
        }
      }
    } catch (_) {}
  }, [error]);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const handleBoop = (info: { count: number; reaction: MascotReaction | null; isDizzy: boolean }) => {
    playGummyPop();
  };

  const handleRetry = () => {
    playGummyTap();
    reset();
  };

  return (
    <div className="fixed inset-0 z-40 w-full h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#050508] text-white select-none overflow-hidden">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[300px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[440px] h-[220px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Wide Layout — No Containers, Clean, Airy */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl flex flex-col items-center text-center relative z-10 px-4"
      >
        {/* Interactive Pet (Height-optimized) */}
        <div className="relative mb-3 sm:mb-4 flex flex-col items-center">
          <div className="transform-gpu hover:scale-105 active:scale-95 transition-transform duration-300 cursor-pointer">
            <PageMascot
              directions={mascotPaths.directions}
              reactions={mascotPaths.reactions}
              size={120}
              onBoop={handleBoop}
              enableSound={true}
              className="select-none"
            />
          </div>
        </div>

        {/* Clean, Professional Title & Typography */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          Something went wrong
        </h1>

        <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-5 sm:mb-6 leading-relaxed">
          An unexpected issue occurred while loading this page. You can try reloading or return to the sanctuary feed.
        </p>

        {/* Refined Flat Action Buttons */}
        <div className="flex flex-row items-center gap-3 justify-center mb-4 sm:mb-5">
          <button
            type="button"
            onClick={handleRetry}
            className="h-10 px-5 sm:px-6 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw size={15} />
            <span>Try Again</span>
          </button>

          <Link
            href="/home"
            onClick={() => playGummyTap()}
            className="h-10 px-5 sm:px-6 rounded-xl bg-[#1c1c1f] hover:bg-[#28282b] border border-white/10 active:scale-95 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={15} />
            <span>Sanctuary Home</span>
          </Link>
        </div>

        {/* Collapsible Error Diagnostics (Contained scroll, zero page expansion) */}
        {error && (
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
            >
              <AlertCircle size={13} />
              <span>Technical details</span>
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2 text-left"
                >
                  <div className="p-3 rounded-xl bg-black/70 border border-zinc-800 font-mono text-[11px] text-zinc-400 break-words leading-relaxed select-text max-h-24 sm:max-h-32 overflow-y-auto">
                    {error.message && (
                      <p className="text-rose-400 mb-1 font-semibold">
                        {error.message}
                      </p>
                    )}
                    {error.digest && (
                      <p className="text-zinc-500 text-[10px]">
                        Digest: {error.digest}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
