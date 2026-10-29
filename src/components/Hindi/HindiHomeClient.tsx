"use client";

import React, { useMemo, memo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronRight, Mic, Flame } from "lucide-react";
import MobileContainer from "@/components/Layout/MobileContainer";
import SpotlightSlider from "@/components/Anime/SpotlightSlider";
import HindiAnimeCard from "@/components/Anime/HindiAnimeCard";
import Footer from "@/components/Anime/Footer";
import CuteShareBar from "@/components/Home/CuteShareBar";
import MonetLineIcon from "@/components/UIx/MonetLineIcon";
import { hpi } from "@/lib/hpi";
import { slugifyTitle } from "@/lib/utils";

// Memoized dynamic section component for Hindi categories
const HindiSection = memo(function HindiSection({ title, items }: { title: string; items: any[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-4">
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <MonetLineIcon icon={Mic} variant="orange" />
          <h2 className="text-base sm:text-xl md:text-2xl font-black text-orange-50 uppercase tracking-wide font-lemon flex items-center gap-2 truncate leading-none">
            {title}
          </h2>
        </div>
        <Link
          href="/search/hindi"
          className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-zinc-300 md:text-zinc-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 md:border-white/5 hover:border-orange-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap active:scale-95 shrink-0"
        >
          <span className="md:hidden">Explore</span>
          <span className="hidden md:inline">Explore All</span>
          <ChevronRight size={11} className="text-orange-400" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5 relative perf-contain">
        {items.slice(0, 18).map((anime, index) => (
          <div
            key={`${anime.id || anime.slug || index}-${index}`}
            className="group relative z-10 transform-gpu will-change-transform transition-transform duration-300 hover:scale-[1.02] hover:z-50"
          >
            <HindiAnimeCard anime={anime} />
          </div>
        ))}
      </div>
    </section>
  );
});

export default function HindiHomeClient() {
  const { data, isLoading } = useSWR("hindi-home", () => hpi.hindi.getHome(), {
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

  // Fallback spotlight if empty
  const rawSpotlightItems = useMemo(() => {
    if (spotlightData.length > 0) return spotlightData;
    return otherSections[0]?.items?.slice(0, 8) || [];
  }, [spotlightData, otherSections]);

  // Memoize spotlight items mapping
  const formattedSpotlight = useMemo(() => {
    return rawSpotlightItems.map(item => {
      const cleanTitle = (item.title || "").replace(/\(Hindi Dubbed\)/i, '').replace(/\(Hindi Dub\)/i, '').replace(/\[Hindi Dub\]/i, '').trim();
      const titleSlug = slugifyTitle(cleanTitle || item.title);
      const routeId = (titleSlug && !String(item.id).includes('-')) ? `${item.id}-${titleSlug}` : item.id;
      const img = item.backdrop || item.cover || item.banner || item.poster || item.image;

      return {
        ...item,
        title: item.title,
        poster: img,
        image: img,
        cover: img,
        banner: img,
        jname: item.title,
        description: item.description || item.synopsis || "Stream the finest Hindi dubbed anime online in ultra high definition.",
        type: item.type || "HINDI DUB",
        targetRoute: `/watch/${routeId}?audio=hi`
      };
    });
  }, [rawSpotlightItems]);

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
        className="bg-gradient-to-br from-[#0a0502] via-[#140803] to-[#050201] relative w-full min-h-screen text-white"
      >
        {/* Ambient atmospheric layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/25 via-transparent to-black/40 opacity-40 pointer-events-none transform-gpu" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-600/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="shadow-light-top" />
        <div className="shadow-light-bottom" />

        <div className="min-h-full flex flex-col relative z-10">
          
          {/* Spotlight Hero Section */}
          <div className="w-full mb-2 md:mb-10 px-0">
            {!isLoading && formattedSpotlight.length > 0 ? (
              <SpotlightSlider animes={formattedSpotlight} />
            ) : (
              <div className="h-48 md:h-[400px] bg-white/5 md:rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Quick Header Badge */}
          <div className="px-2 sm:px-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
              <Mic className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-200">
                Hindi Dubbed Anime Sanctuary
              </span>
            </div>
            <Link
              href="/search/hindi"
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 group"
            >
              <span>Search Catalog</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Dynamic Hindi Catalog Sections */}
          <div className="flex-1 flex flex-col gap-6 md:gap-14">
            {!isLoading ? (
              otherSections.map((section, idx) => (
                <HindiSection key={idx} title={section.title} items={section.items} />
              ))
            ) : (
              <div className="px-4 w-full flex flex-col gap-6">
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            )}
          </div>

          {/* CUTE SHARE BAR */}
          <CuteShareBar 
            badgeText="Share Hindi Dub"
            badgeSubtext="Desi Anime Fans"
            title="Invite your Otaku Friends to Kagemi!"
            description="Share 1,000+ Hindi dubbed anime series & movies in 1080p Full HD with zero ads and high speed servers."
          />

          <Footer />
        </div>
      </MobileContainer>
    </>
  );
}
