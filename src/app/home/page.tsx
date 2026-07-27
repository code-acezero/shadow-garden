"use client";

import React, { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner"; // If they use sonner, otherwise custom notify

import MobileContainer from "@/components/Layout/MobileContainer";
import SpotlightSlider from "@/components/Anime/SpotlightSlider";
import Footer from "@/components/Anime/Footer";
import { AnimeService } from "@/lib/api";
import { sfx } from "@/lib/audioManager";

import CuteShareBar from "@/components/Home/CuteShareBar";

// Lazy-loaded heavy sections with skeletons
const ContinueWatching = dynamic(
  () => import("@/components/Home/ContinueWatching"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
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
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data, isLoading } = useSWR("home-sections", () => AnimeService.getHomeSections(), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, 
    keepPreviousData: true,   
  });

  useEffect(() => {
    // Fade out and stop any playing portal BGM after reaching home
    if (typeof window !== 'undefined') {
      sfx.stopAll(1500);
      if ((window as any).stopShadowBGM) {
        (window as any).stopShadowBGM();
      }
    }
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Exchange code for token
      const exchangeToken = async () => {
        try {
          const res = await fetch('/api/auth/anilist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          const data = await res.json();
          if (data.access_token) {
            localStorage.setItem('anilist_token', data.access_token);
            // Optionally dispatch event for user feedback
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('shadow-whisper', { 
                    detail: { id: Date.now(), type: 'success', title: "Integration", message: "AniList connected successfully!" } 
                }));
            }
            router.replace('/home'); // Remove code from URL
          }
        } catch (e) {
          console.error("AniList exchange failed", e);
        }
      };
      exchangeToken();
    }
  }, [searchParams, router]);

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
        className="bg-[#050505] relative w-full"
      >
        {/* Background effects */}
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        {/* Main Content Wrapper */}
        <div className="min-h-full flex flex-col relative z-10">
          
          {/* Top Spacing - Increased by ~10-15% (h-20 on mobile, h-14 on desktop) */}
          

          {/* Spotlight Slider */}
          <div className="w-full mb-2 md:mb-10 px-0">
            {!isLoading && spotlightData.length > 0 ? (
              <SpotlightSlider animes={spotlightData} />
            ) : (
              <div className="h-48 md:h-[400px] bg-white/5 md:rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-3 md:gap-12">
            <ContinueWatching />

            {!isLoading ? (
              <RecentUpdatesSection initialData={recentData} />
            ) : (
              <div className="px-4 w-full">
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            )}
          </div>

          <CuteShareBar />
          <Footer />
        </div>
      </MobileContainer>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <HomeContent />
    </Suspense>
  );
}