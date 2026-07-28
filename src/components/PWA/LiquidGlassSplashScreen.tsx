"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Radio, Zap } from 'lucide-react';

export default function LiquidGlassSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING PWA MATRIX...");

  useEffect(() => {
    // Check if session splash already ran during current tab lifecycle
    const hasSeenSplash = typeof window !== 'undefined' && sessionStorage.getItem('sg_pwa_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('sg_pwa_splash_seen', 'true');
            }
          }, 300);
          return 100;
        }

        const next = prev + 5;
        if (next > 30 && next < 60) {
          setStatusText("CONNECTING TO SHADOW REALM...");
        } else if (next >= 60 && next < 90) {
          setStatusText("TUNING LIQUID DIMENSION...");
        } else if (next >= 90) {
          setStatusText("SANCTUARY READY");
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden select-none"
        >
          {/* Ambient Background Glowing Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-rose-500/15 rounded-full blur-[100px] pointer-events-none" />

          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

          {/* Central Dark Liquid Glass Capsule */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-[90%] max-w-md p-8 sm:p-10 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.4)] flex flex-col items-center gap-6 text-center"
          >
            {/* Top Gloss Shine Highlight Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            {/* Dark Liquid Glass Logo Container */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing Outer Gradient Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-purple-600 via-cyan-400 to-rose-500 p-[2px] shadow-[0_0_40px_rgba(168,85,247,0.5)]"
              >
                <div className="w-full h-full bg-[#020617] rounded-full" />
              </motion.div>

              {/* Running GIF Emblem */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <img
                  src="/run-happy.gif"
                  alt="Shadow Garden"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]"
                />
              </div>
            </div>

            {/* App Title & Subtitle */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-300 uppercase font-bold">PWA APP EDITION</span>
                <Sparkles size={14} className="text-purple-400 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-lemon font-black tracking-[0.25em] bg-gradient-to-r from-white via-purple-200 to-cyan-300 bg-clip-text text-transparent uppercase drop-shadow-lg">
                SHADOW GARDEN
              </h1>
              <p className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.35em] text-zinc-400 uppercase">
                SANCTUARY OF REALITY
              </p>
            </div>

            {/* Liquid Glass Wave Progress Bar */}
            <div className="w-full flex flex-col items-center gap-2.5 mt-4">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-[1px] border border-white/15 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-rose-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              {/* Status Text & Progress Percentage */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 tracking-wider">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Radio size={12} className="animate-pulse text-cyan-400" />
                  {statusText}
                </span>
                <span className="text-cyan-300 font-mono">{progress}%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
