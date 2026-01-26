"use client";

import React from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";

import MobileContainer from "@/components/Layout/MobileContainer";
import SpotlightSlider from "@/components/Anime/SpotlightSlider";
import Footer from "@/components/Anime/Footer";

// Lazy-loaded heavy sections with immediate skeletons for smoother/faster feel
const ContinueWatching = dynamic(
  () => import("@/components/Home/ContinueWatching"),
  { 
    ssr: false,
    loading: () => <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
  }
);

const RecentUpdatesSection = dynamic(
  () => import("@/components/Home/RecentUpdatesSection"),
  { 
    ssr: false,
    loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
  }
);

// Simple fetcher
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Network error");
    return res.json();
  });

export default function Home() {
  // HOME DATA (spotlight, recent, etc.)
  const { data, isLoading } = useSWR("/api/home", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, // 1 min cache
    keepPreviousData: true,   // Prevents flickering during background updates
  });

  const spotlightData = data?.spotlight ?? [];
  const recentData = data?.recent ?? [];

  return (
    <>
      {/* Global styles for this page to handle scrollbars and mobile physics */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scrolling-touch {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <MobileContainer
        hasBottomNav
        // Changed min-h-screen to h-[100dvh] for better mobile stability (no address bar jumps)
        className="bg-[#050505] h-[100dvh] relative overflow-y-auto no-scrollbar scrolling-touch"
      >
        {/* Background effects */}
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        <div className="max-w-7xl mx-auto border-x border-white/5 min-h-full flex flex-col relative z-10">
          {/* Top spacing */}
<div className="h-10 md:h-15 w-full flex-shrink-0" />
          {/* Spotlight */}
          {!isLoading && spotlightData.length > 0 ? (
            <SpotlightSlider animes={spotlightData} />
          ) : (
            <div className="h-64 bg-white/5 rounded-xl animate-pulse mx-4 md:mx-8 flex-shrink-0" />
          )}

          {/* Main content */}
          <div className="px-4 md:px-8 space-y-12 pb-20 mt-6 flex-1">
            <ContinueWatching />

            {!isLoading ? (
              <RecentUpdatesSection initialData={recentData} />
            ) : (
              <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
            )}
          </div>

          <Footer />
        </div>
      </MobileContainer>
    </>
  );
}