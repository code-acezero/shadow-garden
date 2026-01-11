"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, User, Heart, MessageCircle, 
  ArrowLeft, Bot, LogIn, LogOut, LayoutGrid, Sparkles, Settings 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Custom Components
import SearchBar from '@/components/Anime/SearchBar';
import Notifications from '@/components/Anime/Notifications';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  
  // Auth Context
  const { profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => router.back();

  // Navigation Items
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
          TOP DOCK (Sticky Header)
      ============================== */}
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled 
            ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-red-900/10 py-2 shadow-2xl shadow-black/50' 
            : 'bg-gradient-to-b from-black/80 to-transparent border-b border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* LEFT: Back Button & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            {!isHomePage && (
              <button 
                onClick={handleBack} 
                className="p-2 rounded-full bg-white/5 hover:bg-red-600/20 text-gray-300 hover:text-red-500 transition-colors border border-white/5 hover:border-red-500/30 group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            <Link href="/" className="flex flex-col cursor-pointer group">
              <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-800 font-[Cinzel] group-hover:scale-105 transition-transform flex items-center gap-2">
                SHADOW <span className="text-white text-[10px] bg-red-600 px-1 rounded transform -rotate-3">GARDEN</span>
              </h1>
            </Link>
          </div>

          {/* MIDDLE: SearchBar */}
          <div className="hidden md:block flex-1 max-w-lg mx-auto">
            <SearchBar /> 
          </div>

          {/* RIGHT: Actions & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* AI BUTTON */}
            <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-red-800 to-black border border-red-500/30 hover:border-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
                <Bot size={16} className="text-red-400" />
                <span>AI</span>
            </button>

            {/* Notifications */}
            <Notifications />

            {/* UNIVERSAL PROFILE BUTTON */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="relative group outline-none transition-transform active:scale-95">
                        <div className={`w-9 h-9 rounded-full p-[2px] transition-all ${
                            profile?.is_guest 
                                ? "bg-zinc-700 group-hover:bg-zinc-500" 
                                : "bg-gradient-to-tr from-red-600 to-red-900 group-hover:shadow-[0_0_15px_red]"
                        }`}>
                            <Avatar className="w-full h-full rounded-full border-2 border-black bg-zinc-900 overflow-hidden">
                                {profile?.avatar_url ? (
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                ) : (
                                    <ShadowAvatar gender={profile?.gender} />
                                )}
                                <AvatarFallback className="bg-black text-xs font-bold text-zinc-500">
                                    {profile?.username?.[0]?.toUpperCase() || "G"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-zinc-300 p-2 shadow-2xl shadow-red-900/20 rounded-2xl mt-2 z-[101]">
                    {/* Header Info */}
                    <div className="px-4 py-3 bg-white/5 rounded-xl mb-2 flex items-center gap-3 border border-white/5">
                        <Avatar className="w-10 h-10 border border-white/10 overflow-hidden bg-black">
                            {profile?.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} />
                            ) : (
                                <ShadowAvatar gender={profile?.gender} />
                            )}
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-white truncate">{profile?.username || "Unknown"}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{profile?.role || "Guest"}</p>
                        </div>
                    </div>

                    {profile?.is_guest ? (
                        <>
                            {/* GUEST ACTIONS */}
                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 font-medium h-9 rounded-lg transition-all mb-1">
                                <Link href="/settings">
                                    <Settings size={14} className="mr-2" /> Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10 my-1" />
                            <DropdownMenuItem onClick={() => setShowAuthModal(true)} className="cursor-pointer bg-red-600/10 text-red-500 focus:bg-red-600 focus:text-white font-bold h-10 rounded-lg mb-1 transition-all gap-2">
                                <LogIn size={14} /> Login / Register
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            {/* USER ACTIONS */}
                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 font-medium h-9 rounded-lg transition-all">
                                <Link href="/profile"><User size={14} className="mr-2" /> My Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 font-medium h-9 rounded-lg transition-all">
                                <Link href="/watchlist"><LayoutGrid size={14} className="mr-2" /> My Library</Link>
                            </DropdownMenuItem>
                            
                            {/* SETTINGS ADDED HERE */}
                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 font-medium h-9 rounded-lg transition-all">
                                <Link href="/settings">
                                    <Settings size={14} className="mr-2" /> Settings
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/10 my-1" />
                            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer focus:bg-red-900/20 text-red-500 focus:text-red-400 font-medium h-9 rounded-lg transition-all">
                                <LogOut size={14} className="mr-2" /> Logout
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
             </DropdownMenu>
            
          </div>
        </div>
      </header>

      {/* ==============================
          BOTTOM DOCK (Floating Island)
      ============================== */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[90] w-[90%] max-w-md">
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-6 py-4">
          
          {/* Red Glow behind the dock */}
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-red-900/10 to-transparent blur-xl -z-10" />

          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.id === 'home' && pathname === '/');
              
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className="relative group flex flex-col items-center justify-center w-12"
                >
                  {/* Icon */}
                  <div className={`transition-all duration-500 ease-out ${
                    isActive 
                      ? 'text-red-500 transform -translate-y-2 scale-110 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' 
                      : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    <Icon size={24} />
                  </div>

                  {/* Dot Indicator */}
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

      {/* GLOBAL AUTH MODAL */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}