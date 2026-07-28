"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';

// --- PERFECT YIN-YANG LOGO FILL SVG ---
const PerfectYinYangLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <defs>
      <filter id="splash-glow">
        <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* RED SIDE */}
    <motion.path
      d="M 12 2 A 10 10 0 0 0 12 22 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 2 Z"
      fill="transparent"
      stroke="#dc2626"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#splash-glow)"
      initial={{ pathLength: 0, strokeOpacity: 0, fill: "rgba(220,38,38,0)" }}
      animate={{ 
        pathLength: 1, 
        strokeOpacity: 1,
        fill: "rgba(220,38,38,1)", 
        transition: { 
            strokeOpacity: { duration: 0.3 },
            pathLength: { duration: 1.2, ease: "easeInOut" }, 
            fill: { delay: 0.8, duration: 0.4 } 
        } 
      }}
    />

    {/* WHITE DOT */}
    <motion.circle 
      cx="12" cy="7" r="1.5" fill="#ffffff" 
      initial={{ scale: 0, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ delay: 1.2, type: "spring", stiffness: 300 }} 
    />

    {/* WHITE SIDE */}
    <motion.path
      d="M 12 22 A 10 10 0 0 0 12 2 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 22 Z"
      fill="transparent"
      stroke="#ffffff"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#splash-glow)"
      initial={{ pathLength: 0, strokeOpacity: 0, fill: "rgba(255,255,255,0)" }}
      animate={{ 
        pathLength: 1, 
        strokeOpacity: 1,
        fill: "rgba(255,255,255,1)", 
        transition: { 
            strokeOpacity: { duration: 0.3 },
            pathLength: { duration: 1.2, ease: "easeInOut" }, 
            fill: { delay: 0.8, duration: 0.4 } 
        } 
      }}
    />

    {/* RED DOT */}
    <motion.circle 
      cx="12" cy="17" r="1.5" fill="#dc2626" 
      initial={{ scale: 0, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ delay: 1.2, type: "spring", stiffness: 300 }} 
    />
    
    {/* Outer Ring */}
    <motion.circle 
      cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="0.2" fill="none" opacity="0.3" 
      initial={{ pathLength: 0, opacity: 0 }} 
      animate={{ pathLength: 1, opacity: 0.3, transition: { duration: 1.5, ease: "easeInOut" } }} 
    />
  </svg>
);

export default function LiquidGlassSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const iconControls = useAnimationControls();
  const glowControls = useAnimationControls();

  useEffect(() => {
    // Check if session splash already ran during current app lifecycle
    const hasSeenSplash = typeof window !== 'undefined' && sessionStorage.getItem('sg_pwa_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    const runSequence = async () => {
      // 1. Drawing phase
      glowControls.start({
        opacity: [0.1, 0.3, 0.1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      });

      await new Promise(resolve => setTimeout(resolve, 1400));

      // 2. Acceleration spin phase
      iconControls.start({
        rotate: 720,
        transition: {
          duration: 1.2,
          ease: [0.6, 0.05, 0.01, 0.99]
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1100));

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sg_pwa_splash_seen', 'true');
      }
      setIsVisible(false);
    };

    runSequence();
  }, [iconControls, glowControls]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
          className="fixed inset-0 z-[99999] bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden select-none"
        >
          {/* Ambient Glowing Background Orb */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-red-600/15 blur-[100px] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={glowControls}
          />

          {/* Logo Container */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <motion.div
              className="relative w-full h-full z-10"
              animate={iconControls}
            >
              <PerfectYinYangLogo />
            </motion.div>
          </div>

          {/* Title Text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 text-[10px] sm:text-xs font-lemon font-bold tracking-[0.5em] text-white/90 uppercase text-center"
          >
            SHADOW GARDEN
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
