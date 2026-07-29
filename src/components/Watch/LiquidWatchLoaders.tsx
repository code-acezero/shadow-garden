"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Radio, ShieldAlert } from 'lucide-react';

interface LoaderProps {
  text?: string;
}

/**
 * 3D Liquid Glass Cube Loader for Page-Level Loading
 */
export const LiquidGlass3DCubeLoader = memo(({ text = "INITIALIZING REALITY..." }: LoaderProps) => {
  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center relative bg-[#050505] overflow-hidden select-none">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Container - Clean & Minimal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center justify-center gap-10 max-w-md w-[90%]"
      >
        {/* Loading Text & Wave */}
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center gap-2 text-white/80 font-black tracking-[0.2em] text-[11px] sm:text-xs uppercase"
          >
            {text}
          </motion.div>

          {/* Linear Wave Line Loading */}
          <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
              animate={{
                x: ["-100%", "300%"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* Ad Warning Instruction */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="flex items-center gap-1.5 text-orange-400/80 mb-1">
            <Radio size={12} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Important Notice</span>
          </div>
          <p className="text-zinc-500 text-[10px] sm:text-[11px] leading-relaxed max-w-[280px]">
            Third-party video servers may contain invisible pop-up ads on the first few clicks.
          </p>
          <p className="text-primary-400/80 text-[10px] sm:text-[11px] font-medium leading-relaxed max-w-[280px]">
            Tip: We highly recommend using an ad blocker extension like <span className="text-primary-400 font-bold">uBlock Origin</span> or <span className="text-primary-400 font-bold">AdBlock Plus</span> for a flawless, zero-ad experience.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
});

LiquidGlass3DCubeLoader.displayName = "LiquidGlass3DCubeLoader";

/**
 * Magical Wave Particles Loader for Player Panel
 */
export const MagicalWaveParticlesPlayerLoader = memo(({ text = "TUNING DIMENSIONAL PORTAL..." }: LoaderProps) => {
  const d1 = "M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z";
  const d2 = "M0,128L48,149.3C96,171,192,213,288,208C384,203,480,149,576,133.3C672,117,768,139,864,165.3C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z";

  return (
    <div className="w-full h-full min-h-[300px] aspect-video bg-white/[0.04] backdrop-blur-3xl border border-white/20 shadow-[0_12px_40px_0_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.2)] rounded-[28px] overflow-hidden flex flex-col items-center justify-center relative select-none">
      {/* Liquid Glass Highlight Shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
      {/* Background Magical Wave Gradients */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave-gradient-1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="wave-gradient-2" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <motion.path
            d={d1}
            animate={{ opacity: [0.4, 0.8, 0.4], scaleY: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave-gradient-1)"
          />
          <motion.path
            d={d2}
            animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [1.05, 1, 1.05] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave-gradient-2)"
            className="opacity-60"
          />
        </svg>
      </div>

      {/* Floating Light Wave Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: `${12 + i * 11}%`,
              y: '85%',
              opacity: 0,
              scale: 0.4
            }}
            animate={{
              y: ['85%', '15%'],
              opacity: [0, 0.9, 0],
              scale: [0.4, 1.3, 0.4]
            }}
            transition={{
              duration: 2.8 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className="absolute w-3.5 h-3.5 bg-gradient-to-tr from-white via-cyan-300 to-purple-400 rounded-full blur-[1px] shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          />
        ))}
      </div>

      {/* Central Liquid Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-4 px-8 py-6"
      >
        <div className="relative flex items-center justify-center">
          {/* Rotating gradient ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(217,70,239,0.5)]"
          >
            <div className="w-full h-full bg-[#050814] rounded-full" />
          </motion.div>

          <div className="w-11 h-11 rounded-full bg-primary-600/30 border border-white/20 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10">
            <Radio size={20} className="animate-pulse text-cyan-300" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] font-black tracking-[0.3em] text-white uppercase font-lemon drop-shadow-md">
            {text}
          </span>
          <div className="w-28 h-1 bg-white/10 rounded-full overflow-hidden relative border border-white/10">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});
MagicalWaveParticlesPlayerLoader.displayName = "MagicalWaveParticlesPlayerLoader";
