"use client";

import React from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";

import MobileContainer from "@/components/Layout/MobileContainer";
import SpotlightSlider from "@/components/Anime/SpotlightSlider";
import Footer from "@/components/Anime/Footer";

// Lazy-loaded heavy sections with skeletons
const ContinueWatching = dynamic(
  () => import("@/components/Home/ContinueWatching"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0 max-w-[1440px] mx-auto">
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const RecentUpdatesSection = dynamic(
  () => import("@/components/Home/RecentUpdatesSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0 max-w-[1440px] mx-auto">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

// Simple fetcher
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Network error");
    return res.json();
  });

export default function Home() {
  const { data, isLoading } = useSWR("/api/home", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, 
    keepPreviousData: true,   
  });

  const spotlightData = data?.spotlight ?? [];
  const recentData = data?.recent ?? [];

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
        className="bg-[#050505] h-[100dvh] relative overflow-y-auto no-scrollbar scrolling-touch"
      >
        {/* Background effects */}
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        {/* Main Content Wrapper */}
        <div className="min-h-full flex flex-col relative z-10">
          
          {/* Top Spacing */}
          <div className="h-4 md:h-10 w-full flex-shrink-0" />

          {/* Spotlight Slider */}
          {/* UPDATED: Changed from max-w-[1600px] to max-w-[1440px] */}
          <div className="w-full max-w-[1440px] mx-auto mb-6 md:mb-10 px-0 md:px-8">
            {!isLoading && spotlightData.length > 0 ? (
              <SpotlightSlider animes={spotlightData} />
            ) : (
              <div className="h-48 md:h-[400px] bg-white/5 md:rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-8 md:gap-12 pb-24 md:pb-20">
            <ContinueWatching />

            {!isLoading ? (
              <RecentUpdatesSection initialData={recentData} />
            ) : (
              <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full">
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