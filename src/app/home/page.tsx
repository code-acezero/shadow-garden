import React from 'react';
import { AnimeService, UniversalAnimeBase } from '@/lib/api'; 
import { consumetClient } from '@/lib/consumet'; 
import SpotlightSlider from '@/components/Anime/SpotlightSlider';
import Footer from '@/components/Anime/Footer'; 
import MobileContainer from "@/components/Layout/MobileContainer";
import RecentUpdatesSection from '@/components/Home/RecentUpdatesSection';
import ContinueWatching from '@/components/Home/ContinueWatching';

// --- CONFIGURATION ---
export const revalidate = 3600; 

export default async function Home() {
  let spotlightData = null;
  let initialRecent: UniversalAnimeBase[] = [];

  try {
    const homeData = await consumetClient.getHomePageData();
    spotlightData = homeData?.spotlight || [];

    const recentUpdates = await AnimeService.getRecentlyUpdated(1);
    initialRecent = recentUpdates || [];
  } catch (error) {
    console.error("Shadow Garden system breach:", error);
  }

  return (
    <MobileContainer hasBottomNav={true} className="bg-[#050505] min-h-screen relative overflow-x-hidden">
      {/* 1. GLOBAL UI STYLES & BACKGROUND GRADIENTS */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { display: none; }
        html, body { -ms-overflow-style: none; scrollbar-width: none; background: #050505; }
        
        .shadow-light-top {
          position: fixed;
          top: -10%;
          left: -10%;
          width: 50%;
          height: 60%;
          background: radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .shadow-light-bottom {
          position: fixed;
          bottom: -10%;
          right: -10%;
          width: 60%;
          height: 70%;
          background: radial-gradient(circle, rgba(153, 27, 27, 0.05) 0%, transparent 70%);
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
      `}} />

      {/* Background Red Light Effects */}
      <div className="shadow-light-top" />
      <div className="shadow-light-bottom" />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto border-x border-white/5 min-h-screen flex flex-col relative z-10">
        
        {/* ✅ TOP BLANK SPACE (Strategic Buffer) */}
        <div className="h-16 md:h-20 w-full" />

        {/* 3. HERO SECTION */}
        {spotlightData && spotlightData.length > 0 && (
          <SpotlightSlider animes={spotlightData} />
        )}

        <div className="px-4 md:px-8 space-y-12 pb-20 mt-6 flex-1">
            
            {/* 4. CONTINUE WATCHING */}
            <ContinueWatching />

            {/* 5. RECENT UPDATES */}
            <RecentUpdatesSection initialData={initialRecent} />

        </div>

        <Footer />
      </div>
    </MobileContainer>
  );
}