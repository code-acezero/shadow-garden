"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Radio, ShieldAlert } from 'lucide-react';
import { AscendingOmniPlayerLoader } from '@/components/Player/AscendingOmniPlayerLoader';

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
 * Ascending Omni Player Loader for Player Panel
 */
export const MagicalWaveParticlesPlayerLoader = memo(({ text = "Ascending Omni Player" }: LoaderProps) => {
  return <AscendingOmniPlayerLoader text={text} />;
});
MagicalWaveParticlesPlayerLoader.displayName = "MagicalWaveParticlesPlayerLoader";
