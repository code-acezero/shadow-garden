'use client';

import React, { useId, memo } from 'react';
import { cn } from '@/lib/utils';

export interface AscendingOmniPlayerLoaderProps {
  /** Optional custom text; defaults to "Ascending Omni Player" */
  text?: string;
  className?: string;
  /** When true, renders a transparent backdrop suitable for live stream buffering */
  transparent?: boolean;
}

/**
 * AscendingOmniPlayerLoader
 * Monet-aesthetic Underwater Yin-Yang Player Loading Screen
 * Starts with calm flowing water rotation, then progressively accelerates into
 * a super high-speed vortex with escalating chaotic water shaking and Tesla purple arcs.
 */
export const AscendingOmniPlayerLoader = memo(({
  text = "Ascending Omni Player",
  className,
  transparent = false
}: AscendingOmniPlayerLoaderProps) => {
  const rawId = useId();
  const id = rawId.replace(/:/g, '_');

  return (
    <div
      className={cn(
        "w-full h-full absolute inset-0 select-none overflow-hidden flex flex-col items-center justify-center z-50",
        transparent
          ? "bg-transparent backdrop-blur-none"
          : "bg-gradient-to-b from-[#020512] via-[#04081c] to-[#01030a]",
        className
      )}
    >
      <style>{`
        /* Yin-Yang Rotation: Starts as tranquil flowing water, escalates into super high-speed chaotic vortex */
        /* Hardware accelerated, zero layout thrashing */
        @keyframes omni-yinyang-rotation {
          0% {
            transform: rotate(0deg);
          }
          20% {
            transform: rotate(180deg);
          }
          35% {
            transform: rotate(540deg);
          }
          50% {
            transform: rotate(1260deg);
          }
          65% {
            transform: rotate(2520deg);
          }
          78% {
            transform: rotate(4680deg);
          }
          88% {
            transform: rotate(7560deg);
          }
          95% {
            transform: rotate(10440deg);
          }
          100% {
            transform: rotate(11520deg);
          }
        }

        /* Underwater Chaotic Shaking: 0 tremor during calm flow, escalating violently into chaotic water tremor */
        @keyframes omni-chaotic-shake {
          0%, 25% {
            transform: translate3d(0, 0, 0);
          }
          35% {
            transform: translate3d(0.5px, -0.5px, 0);
          }
          45% {
            transform: translate3d(-0.8px, 0.6px, 0);
          }
          55% {
            transform: translate3d(1.2px, -1.1px, 0);
          }
          65% {
            transform: translate3d(-1.8px, 1.5px, 0);
          }
          75% {
            transform: translate3d(2.6px, -2.2px, 0);
          }
          82% {
            transform: translate3d(-3.4px, 2.9px, 0);
          }
          88% {
            transform: translate3d(4.2px, -3.6px, 0);
          }
          92% {
            transform: translate3d(-4.8px, 4.1px, 0);
          }
          95% {
            transform: translate3d(4.5px, -4.2px, 0);
          }
          97% {
            transform: translate3d(-2px, 1.8px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        /* Underwater Caustic Waves Light Shifts */
        @keyframes omni-underwater-caustics {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1) translate3d(0, 0, 0);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.06) translate3d(-1.5%, 2%, 0);
          }
        }

        /* Water Ripple Expanding Shockwaves */
        @keyframes omni-water-ripple-1 {
          0% {
            transform: scale(0.65);
            opacity: 0.7;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        @keyframes omni-water-ripple-2 {
          0% {
            transform: scale(0.65);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }

        /* Floating Ascending Underwater Bubbles */
        @keyframes omni-bubble-ascend-1 {
          0% {
            transform: translateY(60px) translateX(0px);
            opacity: 0;
          }
          30% {
            opacity: 0.7;
          }
          70% {
            opacity: 0.5;
            transform: translateY(-40px) translateX(12px);
          }
          100% {
            transform: translateY(-90px) translateX(-6px);
            opacity: 0;
          }
        }
        @keyframes omni-bubble-ascend-2 {
          0% {
            transform: translateY(50px) translateX(0px);
            opacity: 0;
          }
          40% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.4;
            transform: translateY(-35px) translateX(-14px);
          }
          100% {
            transform: translateY(-80px) translateX(8px);
            opacity: 0;
          }
        }

        /* Ascending Omni Player Text Shimmer & Float Wave */
        @keyframes omni-text-ascend {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.92;
            letter-spacing: 0.26em;
          }
          50% {
            transform: translateY(-3.5px);
            opacity: 1;
            letter-spacing: 0.28em;
          }
        }
        @keyframes omni-text-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Tesla Purple Lightning Surge (fires in sync with high-speed & chaotic water phase) */
        @keyframes omni-water-lightning {
          0%, 65% {
            opacity: 0;
            transform: scale(0.9);
          }
          67% {
            opacity: 0.95;
            transform: scale(1.08) rotate(5deg);
          }
          70% {
            opacity: 0.15;
          }
          78% {
            opacity: 0.9;
            transform: scale(1.06) rotate(-8deg);
          }
          82% {
            opacity: 0.2;
          }
          88% {
            opacity: 1;
            transform: scale(1.12) rotate(12deg);
          }
          93% {
            opacity: 0.1;
          }
          95% {
            opacity: 0.95;
            transform: scale(1.08) rotate(-4deg);
          }
          98%, 100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      `}</style>

      {/* SVG GRADIENTS: Polished Metallic Monet Palette */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* Chrome Polished White Metallic */}
          <linearGradient id={`omni_white_${id}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f8fafc" />
            <stop offset="70%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Royal Monet 3D Metallic Violet */}
          <linearGradient id={`omni_violet_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="30%" stopColor="#a855f7" />
            <stop offset="65%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>

          {/* Polished Specular Rim */}
          <linearGradient id={`omni_rim_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#c084fc" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#9333ea" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.95" />
          </linearGradient>

          {/* Specular Curvature Highlight */}
          <linearGradient id={`omni_sheen_${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* UNDERWATER CAUSTIC AMBIENT GLOW & WATER DEPTH RAYS */}
      {!transparent && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Deep Violet / Ocean Blue Radial Caustic Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,transparent_70%)]"
            style={{ animation: 'omni-underwater-caustics 6s ease-in-out infinite' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]"
            style={{ animation: 'omni-underwater-caustics 5s ease-in-out infinite reverse' }}
          />

          {/* Ethereal Water Caustic Shimmer Grid */}
          <div
            className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px]"
          />
        </div>
      )}

      {/* ASCENDING UNDERWATER MICRO-BUBBLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Bubble 1 */}
        <div
          className="absolute left-[38%] top-[55%] w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(216,180,254,0.8)]"
          style={{ animation: 'omni-bubble-ascend-1 3.2s ease-in-out infinite' }}
        />
        {/* Bubble 2 */}
        <div
          className="absolute left-[62%] top-[58%] w-2 h-2 rounded-full bg-violet-200/60 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
          style={{ animation: 'omni-bubble-ascend-2 3.8s ease-in-out infinite 0.6s' }}
        />
        {/* Bubble 3 */}
        <div
          className="absolute left-[45%] top-[62%] w-1 h-1 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          style={{ animation: 'omni-bubble-ascend-1 2.8s ease-in-out infinite 1.2s' }}
        />
        {/* Bubble 4 */}
        <div
          className="absolute left-[54%] top-[52%] w-1.5 h-1.5 rounded-full bg-purple-200/70 shadow-[0_0_8px_rgba(192,132,252,0.8)]"
          style={{ animation: 'omni-bubble-ascend-2 3.5s ease-in-out infinite 1.8s' }}
        />
        {/* Bubble 5 */}
        <div
          className="absolute left-[41%] top-[68%] w-1 h-1 rounded-full bg-white/60 shadow-[0_0_6px_rgba(216,180,254,0.6)]"
          style={{ animation: 'omni-bubble-ascend-1 4.1s ease-in-out infinite 2.2s' }}
        />
        {/* Bubble 6 */}
        <div
          className="absolute left-[58%] top-[64%] w-2.5 h-2.5 rounded-full bg-violet-300/40 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
          style={{ animation: 'omni-bubble-ascend-2 4.4s ease-in-out infinite 1.5s' }}
        />
      </div>

      {/* CENTRAL STAGE: WATER-CRESCENDO YIN-YANG SPHERE */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {/* Outer Vibrating / Shaking Container: Gradually escalates from still water to chaotic tremor */}
        <div
          className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28"
          style={{ animation: 'omni-chaotic-shake 5.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        >
          {/* Concentric Underwater Ripple Rings Radiating Outward */}
          <div
            className="absolute inset-0 rounded-full border border-violet-400/30 pointer-events-none"
            style={{ animation: 'omni-water-ripple-1 2.8s ease-out infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full border border-indigo-400/25 pointer-events-none"
            style={{ animation: 'omni-water-ripple-2 2.8s ease-out infinite 1.4s' }}
          />

          {/* Under-Water Vortex Glow Aura */}
          <div className="absolute inset-2 rounded-full bg-violet-500/20 blur-md pointer-events-none" />

          {/* ROTATING 3D METALLIC YIN-YANG: Low speed -> Super High Speed Vortex (GPU Optimized) */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center transform-gpu will-change-transform"
            style={{
              animation: 'omni-yinyang-rotation 5.6s cubic-bezier(0.5, 0.05, 0.2, 1) infinite',
              filter: 'drop-shadow(0 0 16px rgba(168, 85, 237, 0.75))'
            }}
          >
            <svg
              viewBox="0 0 32 32"
              className="w-full h-full overflow-visible"
            >
              {/* Yang Side (Polished Chrome White) */}
              <path
                d="M16 30 C23.732 30 30 23.732 30 16 S23.732 2 16 2 C12.134 2 8.634 3.567 6.1 6.1 A13.96 13.96 0 0 0 2 16 c0 7.732 6.268 14 14 14 Z"
                fill={`url(#omni_white_${id})`}
              />

              {/* Yin Side (Royal Monet Metallic Violet) */}
              <path
                d="M16 2 A14 14 0 0 0 16 30 A7 7 0 0 1 16 16 A7 7 0 0 0 16 2 Z"
                fill={`url(#omni_violet_${id})`}
              />

              {/* Complementary Embedded 3D Metal Dots */}
              {/* White Dot on Violet Half */}
              <circle cx="16" cy="9" r="2.2" fill={`url(#omni_white_${id})`} />
              <circle cx="15.3" cy="8.3" r="0.7" fill="#ffffff" />

              {/* Violet Dot on White Half */}
              <circle cx="16" cy="23" r="2.2" fill={`url(#omni_violet_${id})`} />
              <circle cx="15.3" cy="22.3" r="0.7" fill="#f3e8ff" />

              {/* 3D Specular Curvature Highlight */}
              <ellipse cx="16" cy="11" rx="10" ry="6" fill={`url(#omni_sheen_${id})`} pointerEvents="none" />

              {/* Polished Metallic Bevel Rim */}
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke={`url(#omni_rim_${id})`}
                strokeWidth="1.2"
              />
            </svg>
          </div>

          {/* TESLA PURPLE ELECTRIC ARCS IN CHAOTIC WATER PHASE */}
          <div
            className="absolute inset-[-20%] pointer-events-none z-20 overflow-visible opacity-0 transform-gpu will-change-transform"
            style={{ animation: 'omni-water-lightning 5.6s infinite' }}
          >
            {/* Electric Arc 1: White & Sky Violet Flash */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            >
              <path
                d="M10,24 L34,36 L40,14 L66,48 L92,26"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 6px #c084fc) drop-shadow(0 0 3px #ffffff)' }}
              />
            </svg>

            {/* Electric Arc 2: Royal Violet Spark */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            >
              <path
                d="M14,80 L36,60 L28,34 L62,20 L84,12"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 7px #7c3aed)' }}
              />
            </svg>
          </div>
        </div>

        {/* ASCENDING OMNI PLAYER TEXT */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-xs sm:text-sm font-black uppercase font-mono tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-violet-300 drop-shadow-[0_0_14px_rgba(168,85,247,0.5)] select-none text-center px-4"
            style={{
              animation: 'omni-text-ascend 3.2s ease-in-out infinite, omni-text-shimmer 4s linear infinite',
              backgroundSize: '200% auto'
            }}
          >
            {text}
          </span>

          {/* Minimal Water Flow Indicator Line (Zero AI slop, zero boxes, zero breathing dots) */}
          <div className="w-24 sm:w-28 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="w-full h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent rounded-full"
              style={{
                animation: 'omni-text-shimmer 2s ease-in-out infinite',
                backgroundSize: '200% auto'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

AscendingOmniPlayerLoader.displayName = "AscendingOmniPlayerLoader";

export default AscendingOmniPlayerLoader;
