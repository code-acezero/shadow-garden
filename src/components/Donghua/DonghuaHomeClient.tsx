"use client";

import React, { useMemo, memo } from "react";
import useSWR from "swr";
import MobileContainer from "@/components/Layout/MobileContainer";
import SpotlightSlider from "@/components/Anime/SpotlightSlider";
import AnimeCard from "@/components/Anime/AnimeCard";
import Footer from "@/components/Anime/Footer";
import { dpi } from "@/lib/dpi";

// Memoized dynamic section component for Donghua categories
const DonghuaSection = memo(function DonghuaSection({ title, items }: { title: string, items: any[] }) {
    if (!items || items.length === 0) return null;
    
    // Memoize sanitized results to avoid re-mapping on every parent re-render
    const sanitizedResults = useMemo(() => {
        return items.map(anime => {
            let rawUrl: string = anime.poster || anime.image || "";
            let finalUrl = rawUrl;
            
            if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
            const proxiedUrl = finalUrl ? `/api/proxy?url=${encodeURIComponent(finalUrl)}` : "/images/placeholder.jpg";
            
            const rawSub = (typeof anime.episodes === 'object' ? anime.episodes.sub : anime.sub) || 0;
            const rawTotal = anime.totalEpisodes || anime.episodes || 0;
            
            return {
                ...anime,
                dataId: anime.dataId || null, 
                poster: proxiedUrl,
                image: proxiedUrl,
                rating: anime.rating || null,
                isAdult: anime.isAdult || anime.nsfw || false, 
                episodes: {
                    sub: rawSub > 0 ? rawSub : null,
                    dub: null
                },
                sub: rawSub > 0 ? rawSub : null,
                dub: null,
                episode: rawSub || rawTotal || 0,
                targetRoute: `/donghua-watch/${anime.id}`
            };
        });
    }, [items]);

    return (
        <section className="w-full px-4">
            <div className="flex items-center justify-between mb-2 md:mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                    <h2 className="text-xl md:text-2xl font-black text-emerald-50 uppercase tracking-wider font-serif">
                        {title}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 relative perf-contain">
                {sanitizedResults.slice(0, 12).map((anime, index) => (
                    <div 
                        key={`${anime.id}-${index}`}
                        className="group relative z-10 transform-gpu will-change-transform transition-transform duration-300 hover:scale-[1.03] hover:z-50"
                    >
                        <AnimeCard anime={anime} />
                    </div>
                ))}
            </div>
        </section>
    );
});

export default function DonghuaHomeClient() {
  const { data, isLoading } = useSWR("donghua-home", () => dpi.getHome(1), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, 
    keepPreviousData: true,   
  });

  const spotlightData = useMemo(() => {
    return data?.sections?.find(s => s.title.toLowerCase().includes("spotlight"))?.items || [];
  }, [data]);

  const otherSections = useMemo(() => {
    return data?.sections?.filter(s => !s.title.toLowerCase().includes("spotlight")) || [];
  }, [data]);

  // Memoize spotlight items mapping
  const formattedSpotlight = useMemo(() => {
    return spotlightData.map(item => ({
        ...item,
        poster: item.image,
        jname: item.title,
        description: item.title,
        targetRoute: `/donghua-watch/${item.id}`
    }));
  }, [spotlightData]);

  return (
    <>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrolling-touch {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <MobileContainer
        hasBottomNav
        className="bg-gradient-to-br from-[#021008] via-[#041d13] to-[#010905] relative w-full"
      >
        <div className="absolute inset-0 bg-[url('/images/mystic-bg.png')] opacity-10 pointer-events-none transform-gpu" />
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        <div className="min-h-full flex flex-col relative z-10">
          
          {/* Spotlight Slider */}
          <div className="w-full mb-2 md:mb-10 px-0">
            {!isLoading && formattedSpotlight.length > 0 ? (
              <SpotlightSlider animes={formattedSpotlight} />
            ) : (
              <div className="h-48 md:h-[400px] bg-white/5 md:rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Donghua Sections */}
          <div className="flex-1 flex flex-col gap-4 md:gap-12">
            {!isLoading ? (
              otherSections.map((section, idx) => (
                  <DonghuaSection key={idx} title={section.title} items={section.items} />
              ))
            ) : (
              <div className="px-4 w-full flex flex-col gap-6">
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            )}
          </div>

          <Footer />
        </div>
      </MobileContainer>
    </>
  );
}
