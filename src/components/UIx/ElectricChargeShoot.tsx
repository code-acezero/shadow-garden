"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ElectricChargeShootProps {
  pathname?: string;
  isMobile?: boolean;
}

export default function ElectricChargeShoot({ pathname = '', isMobile = false }: ElectricChargeShootProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shootKey, setShootKey] = useState(0);
  const lastTriggerRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialMountRef = useRef<boolean>(true);

  const triggerShoot = useCallback(() => {
    const now = Date.now();
    // Enforce minimum 14-second cooldown so it's never too aggressive or annoying
    if (now - lastTriggerRef.current < 14000) return;
    lastTriggerRef.current = now;
    setShootKey(prev => prev + 1);
    setIsPlaying(true);

    // Complete after 1150ms
    setTimeout(() => {
      setIsPlaying(false);
    }, 1150);
  }, []);

  // 1. Trigger when page is switched (not on immediate first render, with 450ms settle delay)
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      // Trigger once gracefully 2.2s after initial page load
      const initTimer = setTimeout(() => {
        triggerShoot();
      }, 2200);
      return () => clearTimeout(initTimer);
    }

    const switchTimer = setTimeout(() => {
      triggerShoot();
    }, 450);

    return () => clearTimeout(switchTimer);
  }, [pathname, triggerShoot]);

  // 2. Random periodic triggers: between 38s and 65s (infrequent, organic feel)
  useEffect(() => {
    const scheduleNext = () => {
      const randomDelay = Math.floor(Math.random() * (65000 - 38000 + 1)) + 38000;
      timerRef.current = setTimeout(() => {
        if (typeof document !== 'undefined' && !document.hidden) {
          triggerShoot();
        }
        scheduleNext();
      }, randomDelay);
    };

    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerShoot]);

  // 3. Custom event listener for manual trigger
  useEffect(() => {
    const handleManual = () => triggerShoot();
    if (typeof window !== 'undefined') {
      window.addEventListener('shadow-electric-charge-shoot', handleManual);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('shadow-electric-charge-shoot', handleManual);
      }
    };
  }, [triggerShoot]);

  if (!isPlaying) return null;

  // SVG Normalized Coordinates:
  // Origin (Yin-Yang logo center): x = 22, y = 30
  // Destination (Profile avatar center): x = 978, y = 30
  const primaryBolt = "M 22,30 L 65,24 L 110,38 L 155,22 L 200,35 L 245,26 L 290,39 L 335,21 L 380,36 L 425,25 L 470,38 L 515,22 L 560,37 L 605,24 L 650,38 L 695,23 L 740,36 L 785,25 L 830,38 L 875,23 L 920,35 L 955,27 L 978,30";
  const secondaryBolt = "M 22,30 L 60,36 L 105,23 L 150,37 L 195,24 L 240,38 L 285,23 L 330,37 L 375,22 L 420,35 L 465,24 L 510,38 L 555,23 L 600,36 L 645,25 L 690,38 L 735,22 L 780,36 L 825,24 L 870,37 L 915,25 L 950,34 L 978,30";
  
  // Branched discharge arcs
  const branch1 = "M 245,26 L 265,14 L 285,18 L 305,10 L 320,13";
  const branch2 = "M 515,22 L 535,11 L 555,16 L 575,8 L 590,12";
  const branch3 = "M 695,23 L 715,36 L 735,46 L 755,42 L 775,52 L 790,48";
  const branch4 = "M 875,23 L 895,12 L 915,16 L 935,9";

  return (
    <div key={shootKey} className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {/* 1. SVG Tesla Lightning Bolts */}
      <svg 
        viewBox="0 0 1000 60" 
        preserveAspectRatio="none" 
        className="w-full h-full pointer-events-none overflow-visible"
      >
        <defs>
          <filter id="tesla_charge_shoot_filter" x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* --- STAGE 1: LOGO TESLA CHARGE COIL (0ms - 280ms) --- */}
        <g>
          {/* Outer Tesla Induction Ring */}
          <motion.circle
            cx="22"
            cy="30"
            r="19"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1.8"
            strokeDasharray="6 4"
            initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 1, 0],
              scale: [0.6, 1.25, 1.1, 1.3, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            style={{ filter: 'drop-shadow(0 0 6px #a855f7)' }}
          />

          {/* Micro Arc 1 */}
          <motion.path
            d="M 6,30 A 16 16 0 0 1 38,30"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.2, 0.9, 0] }}
            transition={{ duration: 0.28 }}
            style={{ filter: 'drop-shadow(0 0 4px #e9d5ff)' }}
          />

          {/* Micro Arc 2 */}
          <motion.path
            d="M 38,30 A 16 16 0 0 1 6,30"
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="1.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 1, 0.1, 0] }}
            transition={{ duration: 0.28, delay: 0.04 }}
            style={{ filter: 'drop-shadow(0 0 4px #c084fc)' }}
          />

          {/* Core Charge Plasma Burst Flash */}
          <motion.circle
            cx="22"
            cy="30"
            r="7"
            fill="#ffffff"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.4, 0.8, 2.2, 0],
              opacity: [0, 0.9, 0.7, 1, 0]
            }}
            transition={{ duration: 0.3, ease: "easeIn" }}
            style={{ filter: 'drop-shadow(0 0 12px #c084fc) drop-shadow(0 0 24px #9333ea)' }}
          />
        </g>

        {/* --- STAGE 2: MAIN TESLA BOLT SHOOT ACROSS NAV (260ms - 740ms) --- */}
        <g filter="url(#tesla_charge_shoot_filter)">
          {/* Broad Ionization Violet Aura */}
          <motion.path
            d={primaryBolt}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 0.45, 0.75, 0.95, 0.4, 0],
              pathOffset: [0, 0, 0.2, 0.45, 0.75, 1],
              opacity: [0, 0.8, 0.95, 0.85, 0.6, 0]
            }}
            transition={{ duration: 0.48, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 12px #9333ea)' }}
          />

          {/* Violet Electric Arc Layer */}
          <motion.path
            d={primaryBolt}
            fill="none"
            stroke="#c084fc"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 0.5, 0.8, 1, 0.45, 0],
              pathOffset: [0, 0, 0.18, 0.42, 0.72, 1],
              opacity: [0, 1, 1, 1, 0.7, 0]
            }}
            transition={{ duration: 0.46, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 6px #e9d5ff)' }}
          />

          {/* White-Hot Core Plasma Filament */}
          <motion.path
            d={primaryBolt}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 0.4, 0.7, 0.9, 0.35, 0],
              pathOffset: [0, 0, 0.22, 0.48, 0.78, 1],
              opacity: [0, 1, 1, 0.9, 0.5, 0]
            }}
            transition={{ duration: 0.45, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }}
          />

          {/* Secondary Jitter Bolt */}
          <motion.path
            d={secondaryBolt}
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 0.35, 0.65, 0.85, 0.3, 0],
              pathOffset: [0, 0.05, 0.25, 0.52, 0.8, 1],
              opacity: [0, 0.9, 0.3, 0.85, 0.2, 0]
            }}
            transition={{ duration: 0.44, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 5px #a855f7)' }}
          />

          {/* Branched Forks */}
          {[branch1, branch2, branch3, branch4].map((branchPath, idx) => (
            <motion.path
              key={`branch-${idx}`}
              d={branchPath}
              fill="none"
              stroke="#d8b4fe"
              strokeWidth="1.1"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.9, 0]
              }}
              transition={{ duration: 0.24, delay: 0.34 + idx * 0.07, ease: "easeOut" }}
              style={{ filter: 'drop-shadow(0 0 4px #c084fc)' }}
            />
          ))}
        </g>

        {/* --- STAGE 3: DESTINATION PROFILE IMPACT & ABSORPTION (680ms - 1050ms) --- */}
        <g>
          {/* Radial Expanding Energy Shockwave 1 */}
          <motion.circle
            cx="978"
            cy="30"
            r="16"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1.8"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ 
              scale: [0.4, 1.6, 2.1],
              opacity: [0, 0.9, 0]
            }}
            transition={{ duration: 0.38, delay: 0.68, ease: "easeOut" }}
            style={{ filter: 'drop-shadow(0 0 8px #a855f7)' }}
          />

          {/* Intense White-Hot Core Shockwave 2 */}
          <motion.circle
            cx="978"
            cy="30"
            r="12"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ 
              scale: [0.3, 1.3, 1.8],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 0.32, delay: 0.72, ease: "easeOut" }}
            style={{ filter: 'drop-shadow(0 0 5px #e9d5ff)' }}
          />

          {/* Perimeter Impact Sparks */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x2 = 978 + Math.cos(rad) * 22;
            const y2 = 30 + Math.sin(rad) * 22;
            return (
              <motion.line
                key={`spark-${i}`}
                x1="978"
                y1="30"
                x2={x2}
                y2={y2}
                stroke="#e9d5ff"
                strokeWidth="1.2"
                strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  pathLength: [0, 1, 0]
                }}
                transition={{ duration: 0.25, delay: 0.70 + i * 0.02, ease: "easeOut" }}
                style={{ filter: 'drop-shadow(0 0 3px #c084fc)' }}
              />
            );
          })}
        </g>
      </svg>

      {/* 2. Leading Traveling Electric Plasma Charge Head (HTML Particle Layer) */}
      <motion.div
        initial={{ left: "22px", opacity: 0 }}
        animate={{ 
          left: ["22px", "calc(100% - 24px)"],
          opacity: [0, 1, 1, 0.9, 0]
        }}
        transition={{ duration: 0.48, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center justify-center"
      >
        {/* Ambient Illumination Flare */}
        <div className="absolute w-36 h-14 bg-purple-500/20 blur-xl rounded-full pointer-events-none" />

        {/* Comet Plasma Tail */}
        <div className="absolute w-20 h-3 right-1 bg-gradient-to-l from-white via-purple-300/80 to-transparent blur-[1.5px] rounded-full" />

        {/* High-Voltage White Plasma Nucleus */}
        <div className="relative w-4 h-4 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_16px_#c084fc,0_0_28px_#9333ea] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      </motion.div>
    </div>
  );
}
