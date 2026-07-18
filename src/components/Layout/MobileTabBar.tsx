"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Heart, User, Search, CalendarDays, Clapperboard, Settings, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'donghua', icon: Flame, label: 'Donghua', path: '/donghua' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'schedule', icon: CalendarDays, label: 'Schedule', path: '/schedule' },
    { id: 'social', icon: MessageCircle, label: 'Social', path: '/social' },
    { id: 'drama', icon: Clapperboard, label: 'Drama', path: '/drama' },
    { id: 'watchlist', icon: Heart, label: 'Saved', path: '/watchlist' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  if (pathname === '/') return null;
  if (pathname.includes('/watch/') || pathname.includes('/drama-watch/')) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-[100] pb-safe bg-[#050505]/80 backdrop-blur-2xl border-t border-white/5">
      <div className="flex items-center px-4 py-2 overflow-x-auto no-scrollbar gap-2 sm:gap-4 w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.path);
          return (
            <Link 
              key={tab.id} 
              href={tab.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] h-12 transition-all active:scale-90 flex-shrink-0",
                isActive ? "text-primary-500" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]")} />
              <span className={cn(
                "text-[9px] font-bold mt-1 transition-all",
                isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
              )}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
