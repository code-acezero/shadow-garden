import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Layout/Navigation';
import Index from './pages/Index';
import WatchPage from './app/watch/[id]/page'; 
import AuthModal from './components/Auth/AuthModal';
import OtakuVerse from './components/Social/OtakuVerse';
import ImageSearch from './components/AI/ImageSearch';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      
      {/* NAVIGATION:
         Contains the Sticky Top Header and the Floating Bottom Dock.
         It persists across all pages.
      */}
      <Navigation />

      {/* MAIN CONTENT AREA:
         This is where pages switch based on the URL.
      */}
      <main className="pb-24"> 
        <Routes location={location} key={location.pathname}>
          
          {/* HOME PAGE */}
          <Route 
            path="/" 
            element={
              <Index setIsAuthModalOpen={setIsAuthModalOpen} />
            } 
          />

          {/* WATCH PAGE (Dynamic Route) */}
          {/* Matches /watch/one-piece-100, /watch/naruto-2, etc. */}
          <Route 
            path="/watch/:id" 
            element={<WatchPage />} 
          />

          {/* SEARCH PAGE */}
          <Route 
            path="/search" 
            element={<ImageSearch />} 
          />

          {/* SOCIAL PAGE */}
          <Route 
            path="/social" 
            element={<OtakuVerse />} 
          />

          {/* WATCHLIST PAGE */}
          <Route 
            path="/watchlist" 
            element={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Your Watchlist</h2>
                  <p className="text-gray-400">Your saved anime will appear here.</p>
                </div>
              </div>
            } 
          />

          {/* PROFILE PAGE */}
          <Route 
            path="/profile" 
            element={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Profile</h2>
                  <p className="text-gray-400">User profile coming soon.</p>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full"
                  >
                    Open Login
                  </button>
                </div>
              </div>
            } 
          />

        </Routes>
      </main>

      {/* GLOBAL MODALS */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <Toaster />
    </div>
  );
}

export default App;