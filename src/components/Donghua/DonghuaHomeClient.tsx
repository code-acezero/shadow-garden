"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MobileContainer from "@/components/Layout/MobileContainer";
import SpotlightSlider from "@/components/Anime/SpotlightSlider";
import AnimeCard from "@/components/Anime/AnimeCard";
import Footer from "@/components/Anime/Footer";
import { dpi } from "@/lib/dpi";
import { cn } from "@/lib/utils";

// A dynamic section component for Donghua categories
function DonghuaSection({ title, items }: { title: string, items: any[] }) {
    if (!items || items.length === 0) return null;
    
    // We sanitize the results similarly to RecentUpdatesSection
    const sanitizedResults = items.map(anime => {
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

    return (
        <section className="w-full px-4 md:px-8 max-w-[1350px] mx-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                    <h2 className="text-xl md:text-2xl font-black text-emerald-50 uppercase tracking-wider font-serif">
                        {title}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 md:gap-4 lg:gap-5">
                {sanitizedResults.map((anime, index) => (
                    <AnimeCard key={`${anime.id}-${index}`} anime={anime} />
                ))}
            </div>
        </section>
    );
}

export default function DonghuaHomeClient() {
  const { data, isLoading } = useSWR("donghua-home", () => dpi.getHome(1), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, 
    keepPreviousData: true,   
  });

  const spotlightData = data?.sections?.find(s => s.title.toLowerCase().includes("spotlight"))?.items || [];
  const otherSections = data?.sections?.filter(s => !s.title.toLowerCase().includes("spotlight")) || [];

  // Map spotlight items to match SpotlightSlider requirements
  const formattedSpotlight = spotlightData.map(item => ({
      ...item,
      poster: item.image,
      jname: item.title,
      description: item.title,
      targetRoute: `/donghua-watch/${item.id}`
  }));

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
        className="bg-gradient-to-br from-[#021008] via-[#041d13] to-[#010905] h-[100dvh] relative overflow-y-auto no-scrollbar scrolling-touch"
      >
        <div className="absolute inset-0 bg-[url('/images/mystic-bg.png')] opacity-5 mix-blend-overlay pointer-events-none" />
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        <div className="min-h-full flex flex-col relative z-10">
          <div className="h-20 md:h-14 w-full flex-shrink-0" />

          {/* Spotlight Slider */}
          <div className="w-full max-w-[1350px] mx-auto mb-6 md:mb-10 px-0 md:px-8">
            {!isLoading && formattedSpotlight.length > 0 ? (
              <SpotlightSlider animes={formattedSpotlight} />
            ) : (
              <div className="h-48 md:h-[400px] bg-white/5 md:rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Donghua Sections */}
          <div className="flex-1 flex flex-col gap-8 md:gap-12 pb-24 md:pb-20">
            {!isLoading ? (
              otherSections.map((section, idx) => (
                  <DonghuaSection key={idx} title={section.title} items={section.items} />
              ))
            ) : (
              <div className="px-4 md:px-8 max-w-[1350px] mx-auto w-full flex flex-col gap-8">
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
