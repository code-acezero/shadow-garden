'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ShadowLogo from '@/components/UIx/ShadowLogo';

export default function GlobalLoading() {
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 w-full h-[100dvh] max-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center overflow-hidden select-none px-4">
      {/* Subtle Ambient Violet Core Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Rotating Metallic Yin-Yang with Top Nav Purple Electric Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-center"
      >
        <ShadowLogo size="w-20 h-20 sm:w-24 sm:h-24" spinDuration="3.5s" />
      </motion.div>

      {/* Simple, Clean 'Loading Kagemi' Text */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-xs sm:text-sm font-medium tracking-[0.3em] uppercase text-zinc-400 mt-5 select-none"
      >
        Loading Kagemi
      </motion.p>
    </div>
  );
}
