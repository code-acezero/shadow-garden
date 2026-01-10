import React from 'react';
import { consumetClient } from '@/lib/consumet'; // Direct Engine Access
import SpotlightSlider from '@/components/Anime/SpotlightSlider';
import AnimeCard from '@/components/Anime/AnimeCard';
import { Flame, Clock, Calendar, Star, TrendingUp } from 'lucide-react';

// Helper for Section Headers
const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex items-center gap-2 mb-4 mt-8 px-4 md:px-8">
    <Icon className="text-red-500 w-6 h-6" />
    <h2 className="text-2xl font-bold text-white font-[Cinzel]">{title}</h2>
  </div>
);

// This is now an ASYNC Server Component
// No 'use client', no 'useEffect', no Loading Spinners!
export default async function Home() {
  
  // 1. Fetch Data directly from the Shadow Garden Engine
  // This runs on the server, bypassing API latency
  const data = await consumetClient.getHomePageData();

  if (!data) return <div className="text-center text-red-500 mt-20">Shadow Garden systems are offline.</div>;

  return (
    <div className="bg-[#050505] min-h-screen pb-20">
      
      {/* 1. SPOTLIGHT SLIDER (Hero Section) */}
      {/* Maps 'spotlight' from engine to your slider */}
      {data.spotlight && data.spotlight.length > 0 && (
        <SpotlightSlider animes={data.spotlight} />
      )}

      {/* 2. TRENDING NOW */}
      {data.trending && data.trending.length > 0 && (
        <section>
            <SectionHeader title="Trending Now" icon={Flame} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4 md:px-8">
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4 md:px-8">
                {data.recent.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

      {/* 4. TOP UPCOMING */}
      {data.upcoming && data.upcoming.length > 0 && (
        <section>
            <SectionHeader title="Top Upcoming" icon={Calendar} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4 md:px-8">
                {data.upcoming.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}
      
      {/* 5. TOP AIRING (New Section from AnimeKai data) */}
      {data.topAiring && data.topAiring.length > 0 && (
        <section>
            <SectionHeader title="Top Airing" icon={TrendingUp} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4 md:px-8">
                {data.topAiring.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

      {/* 6. MOST POPULAR */}
      {data.popular && data.popular.length > 0 && (
        <section>
            <SectionHeader title="All Time Popular" icon={Star} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4 md:px-8">
                {data.popular.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>
        </section>
      )}

    </div>
  );
}