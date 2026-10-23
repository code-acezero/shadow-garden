"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Search, Flame, Clapperboard, Calendar, Scroll } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ATRAX_BUBBLY_SPRING } from '@/lib/atraxMotion';

export default function MobileTabBar() {
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    handleFsChange();
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [pathname]);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'donghua', icon: Scroll, label: 'Donghua', path: '/donghua' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'social', icon: MessageCircle, label: 'Social', path: '/social' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', path: '/schedule' },
    { id: 'shorts', icon: Flame, label: 'Shorts', path: '/shorts' },
    { id: 'cinema', icon: Clapperboard, label: 'Flix', path: '/cinema' },
  ];

  if (pathname === '/' || isFullscreen || pathname?.startsWith('/shorts/watch')) return null;

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-[99999] max-w-md mx-auto pointer-events-none">
      <nav 
        aria-label="Mobile Navigation"
        className="pointer-events-auto bg-[#0d1424]/95 border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-[32px] px-2 py-1.5 flex items-center justify-between"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === 'cinema' 
            ? (pathname.startsWith('/cinema') || pathname.startsWith('/drama') || pathname.startsWith('/movies') || pathname.startsWith('/stream'))
            : pathname.startsWith(tab.path);

          return (
            <Link 
              key={tab.id} 
              href={tab.path}
              aria-label={tab.label}
              className="relative flex-1 flex flex-col items-center justify-center h-11 select-none group"
            >
              <motion.div 
                whileTap={{ scaleX: 1.15, scaleY: 0.85, y: 1 }}
                whileHover={{ scale: 1.08 }}
                transition={ATRAX_BUBBLY_SPRING}
                className={cn(
                  "relative z-10 flex items-center justify-center w-full h-full rounded-2xl transition-colors duration-200",
                  isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}
              >
                {/* Active Bubbly Pill Indicator (One UI 8 Pill Slider) */}
                {isActive && (
                  <motion.div
                    layoutId="atrax-active-tab-pill"
                    transition={ATRAX_BUBBLY_SPRING}
                    className="absolute inset-0 bg-primary-600 rounded-[22px] shadow-[0_4px_16px_rgba(220,38,38,0.45)] -z-10"
                  />
                )}

                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.6 : 2} 
                  className={cn(
                    "transition-transform duration-200",
                    isActive ? "scale-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.35)]" : "scale-100"
                  )} 
                />
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
