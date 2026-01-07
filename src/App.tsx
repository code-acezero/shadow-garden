import React, { useState } from 'react';
import Navigation from './components/Layout/Navigation';
import Index from './pages/Index';
import AuthModal from './components/Auth/AuthModal';
import OtakuVerse from './components/Social/OtakuVerse';
import ImageSearch from './components/AI/ImageSearch';
import AnimePlayer from './components/Player/AnimePlayer';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentAnime, setCurrentAnime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Index 
            setCurrentAnime={setCurrentAnime}
            setIsPlaying={setIsPlaying}
            setIsAuthModalOpen={setIsAuthModalOpen}
          />
        );
      case 'search':
        return <ImageSearch />;
      case 'social':
        return <OtakuVerse />;
      case 'watchlist':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-4">Your Watchlist</h2>
              <p className="text-gray-400">Your saved anime will appear here</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-4">Profile</h2>
              <p className="text-gray-400">User profile coming soon</p>
            </div>
          </div>
        );
      default:
        return <Index setCurrentAnime={setCurrentAnime} setIsPlaying={setIsPlaying} setIsAuthModalOpen={setIsAuthModalOpen} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950">
      {/* Main Content Area with bottom padding for navigation */}
      <main className="pb-20">
        {isPlaying && currentAnime ? (
          <AnimePlayer 
            anime={currentAnime} 
            onClose={() => setIsPlaying(false)} 
          />
        ) : (
          renderContent()
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default App;