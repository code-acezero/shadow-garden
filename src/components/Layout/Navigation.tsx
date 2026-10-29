"use client";

import React, { useState, useEffect, memo, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Home, User, Heart, MessageCircle, Search, Compass, Settings, Bell, Clapperboard, Flame, Film, Calendar, Scroll, BookOpen } from 'lucide-react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import WhisperIsland from '@/components/UIx/WhisperIsland';
import AuthModal from '@/components/Auth/AuthModal';
import MobileTabBar from './MobileTabBar';
import { playGummyTap } from '@/lib/audioManager';

// Memoized Island to prevent re-renders when Nav state changes
const MemoizedWhisperIsland = memo(WhisperIsland);

export default function Navigation() {
  const pathname = usePathname();
  
  // Optimistic pending tab for instantaneous switch without waiting for route completion
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState('ENTER'); 

  // Synchronously clear pending tab once pathname matches or navigates
  useEffect(() => {
    setPendingTab(null);
  }, [pathname]);

  useEffect(() => {
    // 1. Check for "Show Accounts" flag (Add Account Flow)
    if (typeof window !== 'undefined') {
        const shouldShowAccounts = sessionStorage.getItem('shadow_show_accounts');
        if (shouldShowAccounts) {
            setAuthView('ACCOUNTS');
            setShowAuthModal(true);
            sessionStorage.removeItem('shadow_show_accounts'); 
        }
    }

    // 2. Handle Opening Auth Modal via Events
    const handleOpenAuth = (e: any) => {
        if (e.detail?.view) setAuthView(e.detail.view);
        else setAuthView('ENTER');
        setShowAuthModal(true);
    };

    // 3. Handle Hard Reload 
    const handleForceReload = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/home'; 
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('shadow-open-auth', handleOpenAuth);
        window.addEventListener('shadow-force-reload', handleForceReload);
    }

    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('shadow-open-auth', handleOpenAuth);
            window.removeEventListener('shadow-force-reload', handleForceReload);
        }
    };
  }, []);

  const isReader = pathname?.startsWith('/manga/read') || pathname?.startsWith('/novel/read');
  if (pathname === '/' || pathname?.startsWith('/master') || isReader) return null;

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'manga', icon: BookOpen, label: 'Mangvels', path: '/manga' },
    { id: 'explore', icon: Search, label: 'Explore', path: '/explore' },
    { id: 'social', icon: MessageCircle, label: 'Otakuverse', path: '/social' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', path: '/schedule' },
    { id: 'shorts', icon: Flame, label: 'Shorts', path: '/shorts' },
    { id: 'cinema', icon: Clapperboard, label: 'Flix', path: '/cinema' },
  ];

  const isShortsWatch = pathname?.startsWith('/shorts/watch');

  return (
    <>
      <div className={isShortsWatch ? "hidden lg:block" : ""}>
        <Suspense fallback={null}>
          <MemoizedWhisperIsland />
        </Suspense>
      </div>

      <nav className="hidden md:block fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[99999] w-auto pointer-events-auto">
        <div className="relative bg-[#0c1322]/95 border border-white/[0.12] rounded-full shadow-[0_18px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] px-3 py-2 backdrop-blur-xl">
          <LayoutGroup id="desktop-bottom-nav">
            <div className="flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const current = pendingTab || pathname;
                const isActive = item.id === 'cinema'
                  ? (current.startsWith('/cinema') || current.startsWith('/drama') || current.startsWith('/movies') || current.startsWith('/stream'))
                  : item.id === 'shorts'
                  ? current.startsWith('/shorts')
                  : item.id === 'explore'
                  ? (current.startsWith('/explore') || current.startsWith('/search'))
                  : item.id === 'manga'
                  ? (current.startsWith('/manga') || current.startsWith('/novel'))
                  : item.id === 'social'
                  ? (current.startsWith('/social') || current.startsWith('/messages'))
                  : (current === item.path || current.startsWith(item.path));

                return (
                  <Link 
                    key={item.id} 
                    href={item.path} 
                    prefetch={true} 
                    onClick={() => {
                      playGummyTap();
                      setPendingTab(item.path);
                    }} 
                    className="relative group select-none"
                    aria-label={item.label}
                  >
                    <motion.div
                      layout
                      whileHover={{ 
                        scale: 1.06, 
                        transition: { type: "spring", stiffness: 450, damping: 16 } 
                      }}
                      whileTap={{ 
                        scale: 0.88, 
                        transition: { type: "spring", stiffness: 600, damping: 18 } 
                      }}
                      className={`relative isolate flex items-center justify-center h-10 rounded-full select-none ${
                        isActive ? 'text-white font-bold px-4' : 'text-zinc-400 hover:text-white px-3'
                      }`}
                    >
                      {/* Active Pill - ISOLATED at z-0 so it NEVER slips behind navbar background */}
                      {isActive && (
                        <motion.div 
                          layoutId="desktop-nav-active-pill"
                          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                          className="absolute inset-0 bg-primary-600 rounded-full shadow-[0_2px_14px_rgba(0,0,0,0.4)] z-0 pointer-events-none" 
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center gap-2 pointer-events-none">
                        <Icon 
                          size={18} 
                          strokeWidth={isActive ? 2.5 : 2} 
                          className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} 
                        />
                        <AnimatePresence mode="popLayout" initial={false}>
                          {isActive && (
                            <motion.span 
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ duration: 0.16, ease: "easeOut" }}
                              className="text-xs font-black uppercase tracking-wider whitespace-nowrap overflow-hidden"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      </nav>

      <MobileTabBar />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={() => setShowAuthModal(false)} 
        initialView={authView}
      />
    </>
  );
}