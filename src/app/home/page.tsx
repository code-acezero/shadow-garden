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
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

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

const AllTimeFavoriteCarousel = dynamic(
  () => import("@/components/Home/AllTimeFavoriteCarousel"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const StreamingTodaySection = dynamic(
  () => import("@/components/Home/StreamingTodaySection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const MultiverseShowcase = dynamic(
  () => import("@/components/Home/MultiverseShowcase"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const HindiHomeSection = dynamic(
  () => import("@/components/Home/HindiHomeSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const DonghuaHomeSection = dynamic(
  () => import("@/components/Home/DonghuaHomeSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const CommunityHomeSection = dynamic(
  () => import("@/components/Home/CommunityHomeSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const ShortsHomeSection = dynamic(
  () => import("@/components/Home/ShortsHomeSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-0">
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }
);

const MangvelsHomeSection = dynamic(
  () => import("@/components/Home/MangvelsHomeSection"),
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

  const { user } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Exchange code for token & handle direct AniList sign in
      const exchangeToken = async () => {
        try {
          const res = await fetch('/api/auth/anilist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, currentUserId: user?.id })
          });
          const data = await res.json();
          if (data.access_token) {
            localStorage.setItem('anilist_token', data.access_token);
            if (data.viewer?.name) {
              localStorage.setItem('anilist_username', data.viewer.name);
            }
            // If user wasn't signed in, log in with generated magic link token
            if (data.magic_token && !user) {
              try {
                await supabase.auth.verifyOtp({ token_hash: data.magic_token, type: 'magiclink' });
              } catch (otpErr) {
                console.warn('AniList auto-login OTP error:', otpErr);
              }
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('shadow-whisper', { 
                detail: { 
                  id: Date.now(), 
                  type: 'success', 
                  title: "AniList Connected", 
                  message: `Welcome, ${data.viewer?.name || 'Operative'}! AniList sync online.` 
                } 
              }));
            }
            const returnUrl = localStorage.getItem('anilist_auth_redirect') || '/home';
            localStorage.removeItem('anilist_auth_redirect');
            if (returnUrl !== '/home') {
              router.replace(returnUrl);
            } else {
              router.replace('/home');
            }
          }
        } catch (e) {
          console.error("AniList exchange failed", e);
        }
      };
      exchangeToken();
    }
  }, [searchParams, router, user]);

  const spotlightData = data?.spotlight ?? [];
  const recentData = data?.recent ?? [];
  const trendingData = data?.trending ?? [];
  const topAiringData = data?.topAiring ?? [];
  const upcomingData = data?.upcoming ?? [];

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
        className="relative w-full"
      >
        {/* Background effects */}
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        {/* Main Content Wrapper */}
        <div className="min-h-full flex flex-col relative z-10">
          
          {/* Spotlight Slider */}
          <div className="w-full mb-2 md:mb-6 px-2 sm:px-4">
            {!isLoading && spotlightData.length > 0 ? (
              <SpotlightSlider animes={spotlightData} />
            ) : (
              <div className="h-48 md:h-[400px] bg-white/5 md:rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Main Content Area with Rich Staggered Sections */}
          <div className="flex-1 flex flex-col gap-6 md:gap-14 px-2 sm:px-4 w-full">
            <ContinueWatching />

            {/* All Time Favorite Hall */}
            <AllTimeFavoriteCarousel />

            {/* Streaming Today (Broadcast Radar) */}
            <StreamingTodaySection />

            {/* Recent Episode Updates with Synchronized Tabs */}
            {!isLoading ? (
              <RecentUpdatesSection initialData={recentData} />
            ) : (
              <div className="w-full">
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            )}

            {/* Dedicated Hindi Realm */}
            <HindiHomeSection />

            {/* Dedicated Donghua Realm */}
            <DonghuaHomeSection />

            {/* Community Global Discussions */}
            <CommunityHomeSection />

            {/* Mangvels Reading Hub (On Top of Flixverse) */}
            <MangvelsHomeSection />

            {/* Flixverse Showcase (Cinema, Asian Dramas, Feature Films) */}
            <MultiverseShowcase />

            {/* Shadow Shorts Section (Under Flixverse) */}
            <ShortsHomeSection />

            <div className="mt-2 md:mt-4">
              <CuteShareBar />
            </div>
          </div>

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