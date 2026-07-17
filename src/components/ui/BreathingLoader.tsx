'use client';

import { motion } from 'framer-motion';

// A loop: Nothing -> Line -> Fill In -> Fill Out -> Line -> Nothing
export const BreathingLoader = () => (
  // ✅ Opacity set to 70%
  <svg viewBox="0 0 24 24" className="w-16 h-16 opacity-70 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">
    
    {/* Subtle Glow Filter */}
    <defs>
      <filter id="glow-loading">
        <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
        <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Rotation removed, kept as a group for centering if needed */}
    <g style={{ transformOrigin: "12px 12px" }}>
        {/* --- RED SIDE --- */}
        <motion.path
            d="M 12 2 A 10 10 0 0 0 12 22 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 2 Z"
            fill="#dc2626"
            stroke="#dc2626"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-loading)"
            initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 0 }}
            animate={{
                pathLength: [0, 1, 1, 1, 0, 0],
                fillOpacity: [0, 0, 1, 0, 0, 0],
                strokeOpacity: [1, 1, 1, 1, 1, 0]
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.2, 0.45, 0.7, 0.9, 1]
            }}
        />

        {/* --- WHITE SIDE --- */}
        <motion.path
            d="M 12 22 A 10 10 0 0 0 12 2 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 22 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-loading)"
            initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 0 }}
            animate={{
                pathLength: [0, 1, 1, 1, 0, 0],
                fillOpacity: [0, 0, 1, 0, 0, 0],
                strokeOpacity: [1, 1, 1, 1, 1, 0]
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.2, 0.45, 0.7, 0.9, 1]
            }}
        />
        
        {/* --- DOTS --- */}
        <motion.circle
            cx="12" cy="7" r="1.5" fill="#ffffff"
            animate={{ opacity: [0, 0, 1, 0, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.45, 0.7, 0.9, 1] }}
        />
        <motion.circle
            cx="12" cy="17" r="1.5" fill="#dc2626"
            animate={{ opacity: [0, 0, 1, 0, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.45, 0.7, 0.9, 1] }}
        />
    </g>
  </svg>
);