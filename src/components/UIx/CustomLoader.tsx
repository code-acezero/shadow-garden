'use client';

import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// --- 1. PERFECT YIN-YANG SVG ---
const PerfectYinYang = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
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
      filter="url(#glow)"
      initial={{ pathLength: 0, strokeOpacity: 0, fill: "rgba(220,38,38,0)" }}
      animate={{ 
        pathLength: 1, 
        strokeOpacity: 1,
        fill: "rgba(220,38,38,1)", 
        transition: { 
            strokeOpacity: { duration: 0.4 },
            pathLength: { duration: 1.5, ease: "easeInOut" }, 
            fill: { delay: 1.0, duration: 0.5 } 
        } 
      }}
    />

    {/* WHITE DOT */}
    <motion.circle 
      cx="12" cy="7" r="1.5" fill="#ffffff" 
      initial={{ scale: 0, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ delay: 1.6, type: "spring", stiffness: 300 }} 
    />

    {/* WHITE SIDE */}
    <motion.path
      d="M 12 22 A 10 10 0 0 0 12 2 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 22 Z"
      fill="transparent"
      stroke="#ffffff"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#glow)"
      initial={{ pathLength: 0, strokeOpacity: 0, fill: "rgba(255,255,255,0)" }}
      animate={{ 
        pathLength: 1, 
        strokeOpacity: 1,
        fill: "rgba(255,255,255,1)", 
        transition: { 
            strokeOpacity: { duration: 0.4 },
            pathLength: { duration: 1.5, ease: "easeInOut" }, 
            fill: { delay: 1.0, duration: 0.5 } 
        } 
      }}
    />

    {/* RED DOT */}
    <motion.circle 
      cx="12" cy="17" r="1.5" fill="#dc2626" 
      initial={{ scale: 0, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ delay: 1.6, type: "spring", stiffness: 300 }} 
    />
    
    {/* Outer Ring */}
    <motion.circle 
      cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="0.2" fill="none" opacity="0.3" 
      initial={{ pathLength: 0, opacity: 0 }} 
      animate={{ pathLength: 1, opacity: 0.3, transition: { duration: 2, ease: "easeInOut" } }} 
    />
  </svg>
);

export default function CustomLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const iconControls = useAnimationControls();
    const glowControls = useAnimationControls();
    const pathname = usePathname();

    useEffect(() => {
        // --- TRIGGER LOGIC ---
        const hasSeenSplash = sessionStorage.getItem("shadow_splash_seen");
        const fromLanding = document.referrer.includes('/landing');

        if (hasSeenSplash || fromLanding) {
            sessionStorage.setItem("shadow_splash_seen", "true");
            return; 
        }

        setIsLoading(true);

        const sequence = async () => {
            // 1. DRAW PHASE (2s)
            // Gentle breathing (Very subtle)
            glowControls.start({
                scale: [1, 1.15, 1],
                opacity: [0.1, 0.25, 0.1], // Max 25% opacity
                transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
            sessionStorage.setItem("shadow_splash_seen", "true");

            // 2. ACCELERATION PHASE (1.8s)
            // Custom Bezier for "Slow Start -> High Speed"
            iconControls.start({
                rotate: 1080, 
                transition: { 
                    duration: 1.8, 
                    ease: [0.6, 0.05, 0.01, 0.99] // Deep curve for heavy acceleration
                }
            });

            // Mist breathes slightly faster but stays dim
            glowControls.start({
                scale: [1.1, 1.3, 1.1],
                opacity: [0.2, 0.4, 0.2], // slightly brighter
                transition: { duration: 0.3, repeat: Infinity, ease: "linear" }
            });

            // 3. EXIT PHASE
            await new Promise(resolve => setTimeout(resolve, 1700));
            setIsLoading(false); 
        };
        sequence();
    }, [iconControls, glowControls, pathname]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[50000] flex items-center justify-center bg-[#050505]"
                    initial={{ opacity: 1 }}
                    exit={{ 
                        opacity: 0, 
                        transition: { duration: 0.8, ease: "easeOut", delay: 0.1 } 
                    }}
                >
                    <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
                        
                        {/* --- GLOSSY SHINE MIST --- */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
                                filter: "blur(20px)"
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={glowControls}
                            exit={{ 
                                opacity: 0, 
                                scale: 20, // Expands to cover screen like a reflection
                                transition: { duration: 1.2, ease: "easeOut" } 
                            }}
                        />

                        {/* --- ICON (NO ZOOM) --- */}
                        <motion.div
                            className="relative w-full h-full z-10"
                            animate={iconControls}
                            exit={{ 
                                opacity: 0, 
                                scale: 1, // STRICTLY 1
                                transition: { duration: 0.2 } 
                            }}
                        >
                            <PerfectYinYang />
                        </motion.div>
                    </div>

                    {/* TEXT */}
                    <motion.p
                        className="absolute bottom-[35%] md:bottom-[30%] text-[10px] uppercase tracking-[0.6em] text-red-600/80 font-bold whitespace-nowrap z-20"
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, filter: "blur(5px)", transition: { duration: 0.3 } }} 
                        transition={{ delay: 1 }}
                    >
                        Shadow Garden Opening
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}