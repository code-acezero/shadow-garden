"use client";

import React, { useState, useEffect, memo, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Home, User, Heart, MessageCircle, Search, Settings, Bell, Clapperboard, Flame, Film, Calendar, Scroll, BookOpen } from 'lucide-react';
import WhisperIsland from '@/components/UIx/WhisperIsland';
import AuthModal from '@/components/Auth/AuthModal';
import MobileTabBar from './MobileTabBar';

// Memoized Island to prevent re-renders when Nav state changes
const MemoizedWhisperIsland = memo(WhisperIsland);

export default function Navigation() {
  const pathname = usePathname();
  
  const [activeTab, setActiveTab] = useState(pathname);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState('ENTER'); 

  useEffect(() => {
    setActiveTab(pathname);
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
    { id: 'manga', icon: BookOpen, label: 'Manga & Novels', path: '/manga' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
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
        <div className="relative bg-[#0c1322]/95 border border-white/[0.12] rounded-full shadow-[0_18px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] px-3 py-2">
          <div className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCinemaActive = pathname.startsWith('/cinema') || pathname.startsWith('/drama') || pathname.startsWith('/movies') || pathname.startsWith('/stream');
              const isShortsActive = pathname.startsWith('/shorts');
              const isActive = item.id === 'cinema' 
                ? isCinemaActive 
                : item.id === 'shorts' 
                ? isShortsActive 
                : (activeTab === item.path); 
              return (
                <Link 
                  key={item.id} 
                  href={item.path} 
                  prefetch={true} 
                  onClick={() => setActiveTab(item.path)} 
                  className={`relative group flex items-center justify-center h-10 rounded-full select-none transition-all duration-300 active:scale-95 ${isActive ? 'text-white font-bold px-4' : 'text-zinc-400 hover:text-white px-3'}`}
                  aria-label={item.label}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-primary-600 rounded-full shadow-[0_4px_16px_rgba(220,38,38,0.45)] -z-10 animate-in fade-in duration-200" />
                  )}
                  <div className="flex items-center gap-2">
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} />
                    {isActive && (
                      <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
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