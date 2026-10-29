"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Search, Flame, Clapperboard, Calendar, Scroll, BookOpen } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ATRAX_BUBBLY_SPRING } from '@/lib/atraxMotion';
import { playGummyTap } from '@/lib/audioManager';

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

  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'manga', icon: BookOpen, label: 'Mangvels', path: '/manga' },
    { id: 'explore', icon: Search, label: 'Explore', path: '/explore' },
    { id: 'social', icon: MessageCircle, label: 'Social', path: '/social' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', path: '/schedule' },
    { id: 'shorts', icon: Flame, label: 'Shorts', path: '/shorts' },
    { id: 'cinema', icon: Clapperboard, label: 'Flix', path: '/cinema' },
  ];

  const isReader = pathname?.startsWith('/manga/read') || pathname?.startsWith('/novel/read');
  if (pathname === '/' || isFullscreen || pathname?.startsWith('/shorts/watch') || isReader) return null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 w-full z-[99999] pointer-events-none">
      <nav 
        aria-label="Mobile Navigation"
        className="pointer-events-auto w-full bg-[#080d1a]/95 border-t border-white/[0.12] shadow-[0_-8px_32px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.12)] rounded-t-[22px] sm:rounded-t-[26px] rounded-b-none px-2 pt-1.5 pb-2 pb-safe flex items-center justify-between backdrop-blur-2xl"
      >
        <LayoutGroup id="mobile-tab-bar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const pathMatches = tab.id === 'cinema' 
              ? (pathname.startsWith('/cinema') || pathname.startsWith('/drama') || pathname.startsWith('/movies') || pathname.startsWith('/stream'))
              : tab.id === 'explore'
              ? (pathname.startsWith('/explore') || pathname.startsWith('/search'))
              : tab.id === 'manga'
              ? (pathname.startsWith('/manga') || pathname.startsWith('/novel'))
              : tab.id === 'social'
              ? (pathname.startsWith('/social') || pathname.startsWith('/messages'))
              : tab.id === 'shorts'
              ? pathname.startsWith('/shorts')
              : (pathname === tab.path || pathname.startsWith(tab.path));
            
            const isActive = optimisticTab !== null ? optimisticTab === tab.id : pathMatches;

            return (
              <Link 
                key={tab.id} 
                href={tab.path}
                aria-label={tab.label}
                onClick={() => {
                  playGummyTap();
                  setOptimisticTab(tab.id);
                }}
                className="relative flex-1 flex flex-col items-center justify-center h-10 select-none group"
              >
                <motion.div 
                  whileHover={{ 
                    scale: 1.12, 
                    rotate: [-1, 1.5, 0],
                    transition: { type: "spring", stiffness: 450, damping: 14 } 
                  }}
                  whileTap={{ 
                    scale: 0.84, 
                    scaleX: 1.22, 
                    scaleY: 0.8,
                    transition: { type: "spring", stiffness: 600, damping: 15 } 
                  }}
                  className={cn(
                    "relative isolate flex items-center justify-center w-full h-full rounded-2xl select-none",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                >
                  {/* Active Bubbly/Jelly Pill Indicator (Gradient Violet Material Metallic) */}
                  {isActive && (
                    <motion.div
                      layoutId="atrax-active-tab-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 24, mass: 0.8 }}
                      className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[18px] shadow-[0_2px_16px_rgba(139,92,246,0.6),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-violet-400/40 z-0 pointer-events-none"
                    />
                  )}

                  <Icon 
                    size={19} 
                    strokeWidth={isActive ? 2.6 : 2} 
                    className={cn(
                      "relative z-10 transition-transform duration-200 pointer-events-none",
                      isActive ? "scale-105 drop-shadow-[0_2px_8px_rgba(255,255,255,0.35)]" : "scale-100"
                    )} 
                  />
                </motion.div>
              </Link>
            );
          })}
        </LayoutGroup>
      </nav>
    </div>
  );
}
