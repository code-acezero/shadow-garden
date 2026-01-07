'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, User, Heart, MessageCircle, 
  ArrowLeft, Bot 
} from 'lucide-react';

// Importing your custom logic components as requested
import SearchBar from '@/components/Anime/SearchBar';
import Notifications from '@/components/Anime/Notifications';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for the glass transparency
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Back Navigation
  // Triggers browser history back, compatible with mouse/keyboard shortcuts
  const handleBack = () => {
    router.back();
  };

  // Define Navigation Items with real Routes
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'social', icon: MessageCircle, label: 'Otakuverse', path: '/social' },
    { id: 'watchlist', icon: Heart, label: 'Watchlist', path: '/watchlist' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const isHomePage = pathname === '/';

  return (
    <>
      {/* ==============================
          TOP DOCK (Sticky)
          'sticky' prevents content from hiding behind the navbar
      ============================== */}
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-red-900/20 py-2 shadow-lg shadow-red-900/5' 
            : 'bg-[#050505] border-b border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* LEFT: Back Button & Logo */}
          <div className="flex items-center gap-3">
            {/* Back Button: Hides on Home Page */}
            {!isHomePage && (
              <button 
                onClick={handleBack} 
                className="p-2 rounded-full bg-white/5 hover:bg-red-600/20 text-gray-300 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/30 group"
                aria-label="Go Back"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Logo */}
            <Link href="/" className="flex flex-col cursor-pointer group">
              <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-800 font-[Cinzel] group-hover:scale-105 transition-transform">
                SHADOW GARDEN
              </h1>
              <span className="text-[9px] text-gray-500 tracking-[0.4em] uppercase opacity-60 group-hover:text-red-500/50 transition-colors">
                Ultimate Anime
              </span>
            </Link>
          </div>

          {/* MIDDLE: Integrated SearchBar */}
          <div className="hidden md:block flex-1 max-w-lg mx-auto">
            <SearchBar /> 
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3">
            
            {/* AI Button */}
            <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-red-800 to-black border border-red-500/30 hover:border-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
              <Bot size={16} className="text-red-400" />
              <span>AI</span>
            </button>

            {/* Integrated Notifications Component */}
            <Notifications />
            
          </div>
        </div>
      </header>

      {/* ==============================
          BOTTOM DOCK (Floating Island)
      ============================== */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="relative bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-6 py-4">
          
          {/* Red Glow behind the dock */}
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-red-900/20 to-transparent blur-xl -z-10" />

          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check active state via Pathname
              const isActive = pathname === item.path || (item.id === 'home' && pathname === '/');
              
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className="relative group flex flex-col items-center justify-center w-12"
                >
                  {/* Icon */}
                  <div className={`transition-all duration-300 ${
                    isActive 
                      ? 'text-red-500 transform -translate-y-2 scale-110 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' 
                      : 'text-gray-500 group-hover:text-gray-300'
                  }`}>
                    <Icon size={24} />
                  </div>

                  {/* Dot Indicator (Replaces text for cleaner cinematic look) */}
                  <span className={`absolute -bottom-2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_5px_red] transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`} />
                  
                  {/* Hover Splash */}
                  <div className="absolute inset-0 -top-1 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-150 transition-all duration-300 -z-10" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}