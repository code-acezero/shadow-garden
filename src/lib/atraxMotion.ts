/**
 * ATRAX-UI SYSTEM: Motion & Kinetic Physics Engine
 * Inspired by Samsung One UI 8 & Cute Rubbery/Bubbly Micro-interactions
 * 
 * Provides spring configurations, squash-and-stretch gestures, and
 * morphing squircle physics for delight and zero GPU-overhead feel.
 */

import { Transition, Variants } from 'framer-motion';

// ── 1. CUTE BUBBLY SPRING PHYSICS ─────────────────────────────────────────────

/**
 * Highly responsive underdamped spring for snappy, playful bounce
 */
export const ATRAX_BUBBLY_SPRING: Transition = {
  type: "spring",
  stiffness: 460,
  damping: 24,
  mass: 0.75,
};

/**
 * Fluid organic spring for morphing capsules & dynamic island transitions
 */
export const ATRAX_CAPSULE_SPRING: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
  mass: 0.9,
};

/**
 * Gentle squishy spring for cards, dialogs, and large squircles
 */
export const ATRAX_GENTLE_SPRING: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 26,
  mass: 1.0,
};

// ── 2. SQUASH & STRETCH TAP VARIANTS ──────────────────────────────────────────

/**
 * Rubber button: Squashes horizontally on press, pops up on release
 */
export const atraxSquishTapVariants: Variants = {
  initial: { scale: 1, scaleX: 1, scaleY: 1, y: 0 },
  hover: { 
    scale: 1.04, 
    y: -2,
    transition: { type: "spring", stiffness: 420, damping: 18 } 
  },
  tap: { 
    scaleX: 1.08, 
    scaleY: 0.88, 
    y: 2,
    transition: { duration: 0.08, ease: "easeOut" } 
  },
};

/**
 * Pill chip tap: Soft marshmallow compression
 */
export const atraxChipTapVariants: Variants = {
  initial: { scale: 1, scaleX: 1, scaleY: 1 },
  hover: { 
    scale: 1.05, 
    transition: { type: "spring", stiffness: 500, damping: 20 } 
  },
  tap: { 
    scaleX: 1.06, 
    scaleY: 0.92, 
    transition: { duration: 0.06 } 
  },
};

/**
 * Jelly wobble: Playful jiggle for mascot badges, alerts, or active counters
 */
export const atraxJellyWobbleVariants: Variants = {
  initial: { rotate: 0, scale: 1 },
  hover: { 
    rotate: [0, -6, 5, -3, 2, 0],
    scale: [1, 1.12, 1.05, 1.08, 1.02, 1.05],
    transition: { duration: 0.5, ease: "easeInOut" }
  },
  tap: { 
    scale: 0.92, 
    rotate: 0,
    transition: { duration: 0.08 } 
  }
};

/**
 * Bubble pop dialog entry: Expands from a miniature bubble into a One UI squircle
 */
export const atraxBubblePopVariants: Variants = {
  initial: { opacity: 0, scale: 0.82, y: 15 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: ATRAX_BUBBLY_SPRING
  },
  exit: { 
    opacity: 0, 
    scale: 0.88, 
    y: 10,
    transition: { duration: 0.15, ease: "easeIn" } 
  }
};

// ── 3. ATRAX MONET COLOR EXTRACTOR TYPES ───────────────────────────────────────

export interface AtraxMonetPalette {
  primary: string;
  surfaceDim: string;
  surface: string;
  surfaceLow: string;
  surfaceCard: string;
  surfaceHigh: string;
  surfaceHighest: string;
  accentCyan: string;
  outline: string;
}

export const ATRAX_DEFAULT_MONET: AtraxMonetPalette = {
  primary: '#ff4b60',
  surfaceDim: '#06080d',
  surface: '#0a0e17',
  surfaceLow: '#0f1422',
  surfaceCard: '#131a2b',
  surfaceHigh: '#182136',
  surfaceHighest: '#1e2944',
  accentCyan: '#06b6d4',
  outline: 'rgba(255, 255, 255, 0.08)',
};
