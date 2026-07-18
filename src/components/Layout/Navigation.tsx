"use client";

import React, { useState, useEffect, memo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Home, User, Heart, MessageCircle, CalendarDays, Search, Settings, Bell } from 'lucide-react';
import WhisperIsland from '@/components/UIx/WhisperIsland';
import AuthModal from '@/components/Auth/AuthModal';
import MobileTabBar from './MobileTabBar';
import { DragonIcon } from '@/components/UIx/DragonIcon';

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

  if (pathname === '/') return null;

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'donghua', icon: DragonIcon, label: 'Donghua', path: '/donghua' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'schedule', icon: CalendarDays, label: 'Schedule', path: '/schedule' },
    { id: 'social', icon: MessageCircle, label: 'Otakuverse', path: '/social' },
    { id: 'notifications', icon: Bell, label: 'Alerts', path: '/notifications' },
    { id: 'watchlist', icon: Heart, label: 'Watchlist', path: '/watchlist' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      <MemoizedWhisperIsland />

      <nav className="hidden md:block fixed bottom-3 left-1/2 transform -translate-x-1/2 z-[90] w-[95%] max-w-2xl">
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-8 py-4">
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-primary-900/10 to-transparent blur-xl -z-10" />
          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.path; 
              return (
                <Link key={item.id} href={item.path} prefetch={true} onClick={() => setActiveTab(item.path)} className="relative group flex flex-col items-center justify-center w-10 sm:w-12">
                  <div className={`transition-all duration-500 ease-out ${isActive ? 'text-primary-500 transform -translate-y-2 scale-110 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    <Icon size={24} />
                  </div>
                  <span className={`absolute -bottom-2 w-1 h-1 bg-primary-500 rounded-full shadow-[0_0_5px_red] transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
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