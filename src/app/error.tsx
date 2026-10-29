'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Heart, ChevronDown, ChevronUp, Cpu, Smile } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PageMascot from '@/components/Mascot/PageMascot';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [boopCount, setBoopCount] = useState(0);

  useEffect(() => {
    console.error("Shadow Garden error caught:", error);
  }, [error]);

  const handleBoop = () => {
    playGummyPop();
    setBoopCount(c => c + 1);
  };

  const handleRetry = () => {
    playGummyTap();
    reset();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#050508] text-white select-none relative overflow-hidden">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full flex flex-col items-center text-center relative z-10"
      >
        {/* Cute Mascot Pedestal with Speech Bubble */}
        <div className="relative mb-3 flex flex-col items-center">
          {/* Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-2 px-3.5 py-1.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-bold text-purple-200 shadow-lg flex items-center gap-1.5"
          >
            <Heart size={12} className="text-rose-400 fill-rose-400/40" />
            <span>
              {boopCount > 3 ? "Nyaa~! Full mana restored! Tap retry!" : "Gomen ne, Master! Mana stream tripped!"}
            </span>
          </motion.div>

          {/* Interactive Mascot in Frosted Aura */}
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-rose-500/20 blur-xl group-hover:scale-110 transition-transform duration-500" />
            <div className="relative w-28 h-28 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:border-purple-400/40 transition-colors">
              <PageMascot
                directions="/mascots/cat/directions.webp"
                reactions="/mascots/cat/reactions.webp"
                size={80}
                onBoop={handleBoop}
                enableSound={true}
                className="transform-gpu transition-transform active:scale-90"
              />
            </div>
            {/* Boop Hint */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider text-purple-300/70 bg-[#0c0a14] px-2 py-0.5 rounded-full border border-purple-500/30 whitespace-nowrap">
              {boopCount > 0 ? `Booped x${boopCount}!` : "Tap to Boop"}
            </span>
          </div>
        </div>

        {/* Cute Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-[10px] font-black uppercase tracking-widest text-purple-300 mb-3 shadow-sm">
          <Smile size={12} className="text-purple-400" />
          <span>(｡•́︿•̀｡) Spell Disrupted</span>
        </div>

        {/* Playful Cute Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase font-lemon mb-2">
          Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-rose-400">Tripped Over!</span>
        </h1>

        {/* Soft Description */}
        <p className="text-zinc-400 text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
          The magic circuits got a little tangled up. Don&apos;t worry, your anime sanctuary is safe! Cast heal below to refresh the realm.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center mb-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_24px_rgba(168,85,247,0.35)] cursor-pointer flex items-center justify-center gap-2 transition-all border border-purple-400/30"
          >
            <RotateCcw size={14} className="animate-spin-slow" />
            <span>Cast Heal & Retry</span>
          </motion.button>

          <Link
            href="/home"
            onClick={() => playGummyTap()}
            className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Home size={14} className="text-zinc-400" />
            <span>Sanctuary Home</span>
          </Link>
        </div>

        {/* Technical Spell Diagnostics Toggle */}
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1 cursor-pointer py-1"
          >
            <Cpu size={11} />
            <span>Spell Diagnostics</span>
            {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-2 text-left"
              >
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-zinc-400 break-words leading-relaxed">
                  <div className="text-rose-400 font-bold mb-1">Error Trace:</div>
                  <div className="text-zinc-300">{error?.message || 'Unknown spell interruption'}</div>
                  {error?.digest && (
                    <div className="text-zinc-500 mt-1.5 text-[10px]">
                      Digest: {error.digest}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}