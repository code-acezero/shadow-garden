import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Layout/Navigation';
import Index from './pages/Index';
import WatchPage from './pages/Watch'; 
import AuthModal from './components/Auth/AuthModal';
import OtakuVerse from './components/Social/OtakuVerse';
import ImageSearch from './components/AI/ImageSearch';
import Settings from './components/Settings/Settings';
import { Toaster } from './components/ui/toaster';
import { UserAPI, AppUser } from '@/lib/api';
import './App.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const location = useLocation();

  // Check for user on mount
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await UserAPI.getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const handleAuthSuccess = async () => {
    const currentUser = await UserAPI.getCurrentUser();
    setUser(currentUser);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navigation />
      <main className="pb-24"> 
        <Routes location={location} key={location.pathname}>
          
          <Route 
            path="/" 
            element={<Index setIsAuthModalOpen={setIsAuthModalOpen} />} 
          />
          
          <Route path="/watch/:id" element={<WatchPage />} />

          <Route path="/search" element={<ImageSearch />} />
          
          {/* FIX: Pass required props to OtakuVerse */}
          <Route 
            path="/social" 
            element={
              <OtakuVerse 
                user={user} 
                onAuthRequired={() => setIsAuthModalOpen(true)} 
              />
            } 
          />
          
          <Route path="/settings" element={<Settings />} />
          
          <Route path="/watchlist" element={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Your Watchlist</h2>
                  <p className="text-gray-400">Your saved anime will appear here.</p>
                </div>
              </div>
            } 
          />
          
          <Route path="/profile" element={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Profile</h2>
                  <p className="text-gray-400">User profile coming soon.</p>
                  <button onClick={() => setIsAuthModalOpen(true)} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full">
                    Open Login
                  </button>
                </div>
              </div>
            } 
          />

        </Routes>
      </main>
      
      {/* FIX: Pass required onAuthSuccess */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
      />
      
      <Toaster />
    </div>
  );
}

export default App;