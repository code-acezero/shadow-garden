import React from 'react';
import { consumetClient } from '@/lib/consumet'; // Your custom service
import SpotlightSlider from '@/components/Anime/SpotlightSlider';
import AnimeCard from '@/components/Anime/AnimeCard';
import { Flame, Clock, Calendar, Star, TrendingUp } from 'lucide-react';
import MobileContainer from "@/components/Layout/MobileContainer";

// --- CONFIGURATION ---
// Revalidate this page every 1 hour (3600s) to keep data fresh but minimize scraping
export const revalidate = 3600; 

// Helper for Section Headers
const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex items-center gap-2 mb-4 mt-8 px-4 md:px-8">
    <Icon className="text-red-500 w-6 h-6" />
    <h2 className="text-2xl font-bold text-white font-[Cinzel]">{title}</h2>
  </div>
);

export default async function Home() {
  // 1. Fetch Data using your custom ConsumetService
  // This calls: consumetClient.getHomePageData() which uses Hianime on the server
  let data;

  try {
    data = await consumetClient.getHomePageData();
  } catch (error) {
    console.error("Shadow Garden connection failed:", error);
  }

  // Handle Error/Offline State
  if (!data) return (
    <MobileContainer hasBottomNav={true} className="bg-[#050505]">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-500 font-bold gap-4">
            <span className="text-3xl">⚠️</span>
            Shadow Garden systems are offline.
        </div>
    </MobileContainer>
  );

  return (
    // 'hasBottomNav={true}' ensures content isn't hidden behind the menu
    <MobileContainer hasBottomNav={true} className="bg-[#050505] min-h-screen pb-20">
      
      {/* 1. SPOTLIGHT SLIDER (Hero) */}
      {data.spotlight && data.spotlight.length > 0 && (
        <SpotlightSlider animes={data.spotlight} />
      )}

      {/* 2. TRENDING NOW */}
      {data.trending && data.trending.length > 0 && (
        <section>
            <SectionHeader title="Trending Now" icon={Flame} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-2 sm:px-4 md:px-8">
                {data.trending.map((anime: any) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

      {/* 3. LATEST EPISODES */}
      {data.recent && data.recent.length > 0 && (
        <section>
            <SectionHeader title="Latest Episodes" icon={Clock} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-2 sm:px-4 md:px-8">
                {data.recent.map((anime: any) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

      {/* 4. TOP AIRING */}
      {data.topAiring && data.topAiring.length > 0 && (
        <section>
            <SectionHeader title="Top Airing" icon={TrendingUp} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-2 sm:px-4 md:px-8">
                {data.topAiring.map((anime: any) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

      {/* 5. TOP UPCOMING */}
      {data.upcoming && data.upcoming.length > 0 && (
        <section>
            <SectionHeader title="Top Upcoming" icon={Calendar} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-2 sm:px-4 md:px-8">
                {data.upcoming.map((anime: any) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}
      
      {/* 6. MOST POPULAR */}
      {data.popular && data.popular.length > 0 && (
        <section className="mb-8">
            <SectionHeader title="All Time Popular" icon={Star} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-2 sm:px-4 md:px-8">
                {data.popular.map((anime: any) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

    </MobileContainer>
  );
}