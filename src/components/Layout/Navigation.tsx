import React, { useState, useEffect } from 'react';
import { 
  Home, Search, User, Heart, MessageCircle, 
  Bell, Bot, ArrowLeft, Menu 
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Handle scroll effect for the top bar transparency
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Back Navigation (Point 6 fix)
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'social', icon: MessageCircle, label: 'Otakuverse' },
    { id: 'watchlist', icon: Heart, label: 'Watchlist' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* ==============================
          TOP BAR (Permanent Header)
          Covers Points: 2, 3, 4, 5, 6
      ============================== */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-[#050505]/80 backdrop-blur-xl border-purple-500/20 py-3' 
            : 'bg-gradient-to-b from-black/90 to-transparent border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* LEFT: Logo & Back Button */}
          <div className="flex items-center gap-3">
            {/* Point 6: Back Button (Visible if not on home) */}
            {activeTab !== 'home' && (
              <button 
                onClick={handleBack} 
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            {/* Point 3: Logo Text */}
            <div 
              className="flex flex-col cursor-pointer" 
              onClick={() => setActiveTab('home')}
            >
              <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-[Cinzel]">
                SHADOW GARDEN
              </h1>
              <span className="text-[10px] text-gray-400 tracking-[0.3em] uppercase">
                Ultimate Anime
              </span>
            </div>
          </div>

          {/* MIDDLE: Search Bar (Desktop/Tablet) */}
          {/* Point 2: Glass Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className="relative w-full group">
              <input 
                type="text" 
                placeholder="Search anime..." 
                className="w-full bg-white/5 border border-white/10 text-gray-200 text-sm rounded-full py-2.5 pl-10 pr-12 
                           focus:outline-none focus:bg-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 
                           transition-all backdrop-blur-md shadow-lg shadow-black/50 placeholder-gray-500"
              />
              <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
              <div className="absolute right-1 top-1 bg-white/10 rounded-full px-2 py-1.5">
                <span className="text-[10px] text-gray-400">CTRL+K</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Actions (AI, Notification, Mobile Search Toggle) */}
          <div className="flex items-center gap-3">
            
            {/* Point 5: AI Button */}
            <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(129,140,248,0.3)] hover:shadow-[0_0_25px_rgba(129,140,248,0.5)] transition-all transform hover:-translate-y-0.5">
              <Bot size={16} />
              <span>ASK AI</span>
            </button>

            {/* Mobile Search Toggle (Visible only on mobile) */}
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Search size={20} />
            </button>

            {/* Point 4: Notification */}
            <button className="relative p-2 group">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
              <Bell size={20} className="text-gray-300 group-hover:text-white relative z-10 transition-colors" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-black" />
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Area */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-4 animate-in slide-in-from-top-2">
            <input 
              type="text" 
              placeholder="Search..." 
              autoFocus
              className="w-full bg-white/10 border border-white/10 text-white rounded-lg py-2 px-4 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        )}
      </header>

      {/* ==============================
          BOTTOM DOCK (Modernized)
          Modern, floating "Island" style
      ============================== */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] px-2 py-3">
          
          {/* Glowing background effect behind the dock */}
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-xl -z-10" />

          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative group flex flex-col items-center justify-center w-12 h-12"
                >
                  {/* Active Indicator (Glowing Dot) */}
                  {isActive && (
                    <span className="absolute -top-1 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_10px_#a855f7]" />
                  )}

                  {/* Icon with glow effect on active */}
                  <div className={`transition-all duration-300 ${
                    isActive 
                      ? 'text-white transform -translate-y-1' 
                      : 'text-gray-500 group-hover:text-gray-300'
                  }`}>
                    <Icon 
                      size={20} 
                      className={isActive ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''} 
                    />
                  </div>

                  {/* Label (Only visible when active for cleaner look, or always visible if you prefer) */}
                  <span className={`text-[9px] font-medium mt-1 transition-all duration-300 ${
                    isActive 
                      ? 'text-purple-300 opacity-100' 
                      : 'text-gray-500 opacity-0 h-0 overflow-hidden'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Hover splash effect */}
                  <div className="absolute inset-0 rounded-xl bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-200" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;