"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Heart, User, Search, Clapperboard, Settings, Flame, Film, Users, MessageSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'donghua', icon: Flame, label: 'Donghua', path: '/donghua' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'social', icon: MessageCircle, label: 'Social', path: '/social' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', path: '/schedule' },
    { id: 'drama', icon: Clapperboard, label: 'Drama', path: '/drama' },
    { id: 'movies', icon: Film, label: 'Movies', path: '/movies' },
  ];

  if (pathname === '/') return null;
  if (pathname.includes('/watch/') || pathname.includes('/drama-watch/')) return null;

  return (
    <div className="md:hidden !fixed bottom-0 left-0 w-full z-[100] pb-safe liquid-glass shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between px-4 py-1.5 overflow-x-auto no-scrollbar w-full gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.path);
          return (
              <Link 
              key={tab.id} 
              href={tab.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-w-[46px] h-12 transition-all active:scale-90 relative",
                isActive ? "text-primary-500" : "text-zinc-400 hover:text-white"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-[transform,opacity] duration-200", isActive ? "-translate-y-2" : "translate-y-0")} />
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest transition-[opacity,transform] duration-200 absolute bottom-1 origin-center",
                isActive ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-1 pointer-events-none"
              )}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
