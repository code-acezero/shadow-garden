'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import ShadowLogo from '@/components/UIx/ShadowLogo';

export default function CustomLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only run splash once per browser session
    const hasSeenSplash = sessionStorage.getItem("kagemi_splash_seen");
    const fromLanding = typeof document !== 'undefined' && document.referrer.includes('/landing');

    if (hasSeenSplash || fromLanding) {
      sessionStorage.setItem("kagemi_splash_seen", "true");
      sessionStorage.setItem("shadow_splash_seen", "true");
      sessionStorage.setItem("sg_pwa_splash_seen", "true");
      return; 
    }

    setIsLoading(true);
    document.body.style.overflow = 'hidden';

    // Fast, elegant duration (1.4s) before smoothly dissolving
    const timer = setTimeout(() => {
      sessionStorage.setItem("kagemi_splash_seen", "true");
      sessionStorage.setItem("shadow_splash_seen", "true");
      sessionStorage.setItem("sg_pwa_splash_seen", "true");
      document.body.style.overflow = '';
      setIsLoading(false);
    }, 1400);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.35, ease: "easeOut" } 
          }}
          className="fixed inset-0 z-[99999] w-full h-[100dvh] max-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center overflow-hidden select-none px-4"
        >
          {/* Subtle Ambient Violet Core Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

          {/* Rotating Metallic Yin-Yang with Top Nav Purple Electric Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
