"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { playGummyPop } from '@/lib/audioManager';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MonetLineIconProps {
  icon: LucideIcon;
  variant?: 'violet' | 'amber' | 'rose' | 'cyan' | 'purple' | 'emerald' | 'orange' | 'blue' | 'primary';
  className?: string;
  sizeClassName?: string;
  strokeWidth?: number;
}

// Clean Monet Vector Color Profiles (Clean vector line art, NO blurry glow halo)
const PUFFED_BALLOON_VARIANTS = {
  primary: {
    text: 'text-primary-400',
    fill: 'rgba(139, 92, 246, 0.16)',
  },
  violet: {
    text: 'text-violet-400',
    fill: 'rgba(167, 139, 250, 0.16)',
  },
  amber: {
    text: 'text-amber-400',
    fill: 'rgba(251, 191, 36, 0.16)',
  },
  rose: {
    text: 'text-rose-400',
    fill: 'rgba(251, 113, 133, 0.16)',
  },
  cyan: {
    text: 'text-cyan-400',
    fill: 'rgba(34, 211, 238, 0.16)',
  },
  purple: {
    text: 'text-purple-400',
    fill: 'rgba(192, 132, 252, 0.16)',
  },
  emerald: {
    text: 'text-emerald-400',
    fill: 'rgba(52, 211, 153, 0.16)',
  },
  orange: {
    text: 'text-orange-400',
    fill: 'rgba(251, 146, 60, 0.16)',
  },
  blue: {
    text: 'text-blue-400',
    fill: 'rgba(96, 165, 250, 0.16)',
  },
};

/**
 * MonetLineIcon: Clean vector line art, NO container background box,
 * NO glow/blur effect, styled with clean modern lines and elastic jelly squish.
 */
export default function MonetLineIcon({
  icon: Icon,
  variant = 'violet',
  className,
  sizeClassName = "w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9",
  strokeWidth = 2.4,
}: MonetLineIconProps) {
  const styles = PUFFED_BALLOON_VARIANTS[variant] || PUFFED_BALLOON_VARIANTS.violet;

  return (
    <motion.div
      whileHover={{ 
        scale: 1.15, 
        rotate: [-1.5, 2.5, -0.5, 0],
        transition: { type: "spring", stiffness: 450, damping: 14 } 
      }}
      whileTap={{ 
        scale: 0.84, 
        scaleX: 1.2, 
        scaleY: 0.8,
        transition: { type: "spring", stiffness: 600, damping: 16 } 
      }}
      onClick={() => playGummyPop()}
      className={cn(
        "relative shrink-0 inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200",
        sizeClassName,
        className
      )}
      title="Monet Vector Icon"
    >
      {/* Clean Vector Line Art */}
      <Icon 
        strokeWidth={strokeWidth}
        className={cn(
          "w-full h-full transition-colors duration-200 relative z-10",
          styles.text
        )}
        style={{
          fill: styles.fill,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />
    </motion.div>
  );
}
