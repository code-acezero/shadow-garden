"use client";

import React, { useState, useEffect, useRef, useCallback, memo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { SkipForward, SkipBack, Server as ServerIcon, Layers, Clock, Play, Grid, List, LayoutGrid, ChevronDown, Flame, Info, Loader2, Check, X, Download, AlertTriangle, Lightbulb, RotateCw, StepForward, Share2, Users } from 'lucide-react';
import { WatchPageSkeleton, LiquidPlayerSkeleton, SimpleGridSkeleton } from '@/components/UIx/SkeletonLoaders';
import { omni, DramaDetail, DramaServer, DramaStream } from '@/lib/omni';
import { cn, formatAnimeTitle } from '@/lib/utils';
import DramaPlayer, { DramaPlayerRef } from '@/components/Player/DramaPlayer';
import Footer from '@/components/Anime/Footer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import ShadowComments from '@/components/Comments/ShadowComments';
import WatchListButton from '@/components/Watch/WatchListButton';
import PostShareModal from '@/components/Social/PostShareModal';
import { sfx } from '@/lib/audioManager';
import { toast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import DCard from '@/components/Drama/DCard';
import CountryBadge from '@/components/Drama/CountryBadge';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface EpisodeButtonProps {
  ep: { id: string; number: number; title: string };
  isCurrent: boolean;
  isPlayed: boolean;
  percent: number;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: (id: string) => void;
}

const EpisodeButton = memo(({ ep, isCurrent, isPlayed, percent, viewMode, onClick }: EpisodeButtonProps) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: isCurrent ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
          layout: { type: "tween", duration: 0.3, ease: "easeInOut" },
          scale: { type: "spring", stiffness: 300, damping: 25 },
          opacity: { duration: 0.2 }
      }}
      onClick={() => onClick(ep.id)}
      className={cn(
        "relative overflow-hidden group border transition-all duration-300 transform-gpu shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
        viewMode === 'grid' ? "h-9 w-full rounded-2xl flex items-center justify-center text-[11px] font-black" :
          viewMode === 'compact' ? "aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" :
            "w-[98%] mx-auto h-10 rounded-2xl flex items-center px-4 text-[11px] font-bold text-left",
        isCurrent ? "bg-green-500/20 backdrop-blur-xl border-green-400/50 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] z-20" :
          isPlayed ? "bg-red-500/15 backdrop-blur-xl border-red-400/40 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.25)]" :
            "bg-white/5 backdrop-blur-xl border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-2xl" />
      
      {/* Current episode — animated green shimmer */}
      {isCurrent && (
          <>
              <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(74,222,128,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />
          </>
      )}

      {/* Played episode — animated red shimmer (same style, red palette) */}
      {isPlayed && !isCurrent && (
          <>
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 via-transparent to-red-400/15 animate-pulse pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.18)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none" />
          </>
      )}

      <motion.span layout="position" className={cn("truncate relative z-10 w-full font-lemon tracking-wide", viewMode === 'list' ? "text-left" : "text-center")}>
        {viewMode === 'list' ? `${ep.number}. ${ep.title}` : ep.number}
      </motion.span>
    </motion.button>
  );
});
EpisodeButton.displayName = "EpisodeButton";

// ── Main Component ────────────────────────────────────────────────────────────

export function DramaWatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.id as string;
  const urlEp = searchParams.get('ep');

  const { user } = useAuth();
  const { continueData } = useUserData();
  const [dimMode, setDimMode] = useState(false);
  const playerRef = useRef<DramaPlayerRef>(null);
  const progressRef = useRef(0);

  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [stream, setStream] = useState<DramaStream | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [activeServerIdx, setActiveServerIdx] = useState(0);
  const [epViewMode, setEpViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const [epProgress, setEpProgress] = useState<Record<number, number>>({});
  const [isAutoNext, setIsAutoNext] = useState(true);
  const chunkSize = 50;

  useEffect(() => {
    sfx.pauseBGM();
    return () => { sfx.resumeBGM(); };
  }, []);

  const handleCreateWatchRoom = async () => {
    if (!user || !supabase) {
      toast.error("Please log in to start a watch room!");
      return;
    }

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const currentEp = drama?.episodes.find(e => e.id === currentEpId);
      const { data: room, error: roomError } = await supabase
        .from('watch_rooms')
        .insert({
          code,
          title: drama?.title || 'Drama Room',
          host_id: user.id,
          media_id: drama?.id,
          media_type: 'drama',
          episode_number: currentEp?.number || 1,
          is_private: false
        })
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'host'
      });

      toast.success("Watch room created!");
      window.location.href = `/rooms/${code}`;
    } catch (err: any) {
      console.error("Failed to create room:", err);
      toast.error("Could not create watch room");
    }
  };

  // ── Played episodes tracking (tap-to-mark via invisible detector) ────────
  const [playedEpIds, setPlayedEpIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem(`shadow_drama_played_${slug}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const markEpPlayed = useCallback((id: string | null) => {
    if (!id) return;
    setPlayedEpIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(`shadow_drama_played_${slug}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [slug]);

  // Load drama info
  useEffect(() => {
    if (!slug) return;
    (async () => {
      setIsLoadingInfo(true);
      const data = await omni.drama.getDetail(slug);

      // Fetch Recommendations
      if (data && (!data.recommendations || data.recommendations.length === 0)) {
        try {
          let relatedData = null;
          if (data.country) {
            relatedData = await omni.drama.getByCountry(data.country, 1);
          } else if (data.genres && data.genres.length > 0) {
            relatedData = await omni.drama.getByGenre(data.genres[0], 1);
          }

          if (relatedData && relatedData.items && relatedData.items.length > 1) {
            data.recommendations = relatedData.items
              .filter((s: any) => s.id !== data.id)
              .slice(0, 10);
          } else {
            const homeData = await omni.drama.getHome();
            if (homeData && homeData.sections && homeData.sections.length > 0) {
              data.recommendations = homeData.sections[0].items
                .filter((s: any) => s.id !== data.id)
                .slice(0, 10);
            }
          }
        } catch (e) { }
      }

      setDrama(data);
      setIsLoadingInfo(false);
      if (data?.episodes?.length) {
        let target = data.episodes[data.episodes.length - 1].id;
        if (urlEp) {
          const paramStr = String(urlEp).trim();
          const paramNum = Number(paramStr);
          const found = data.episodes.find(e => 
            String(e.id) === paramStr || 
            String(e.number) === paramStr || 
            (!isNaN(paramNum) && Number(e.number) === paramNum)
          );
          if (found) target = found.id;
        }
        setCurrentEpId(target);
      }
    })();
  }, [slug]);

  // Sync currentEpId when URL ep param changes (browser back/forward only).
  // Do NOT include currentEpId in deps — replaceState does not update useSearchParams,
  // so having it in deps causes a bounce-back after every episode click.
  const currentEpIdRef = useRef(currentEpId);
  useEffect(() => { currentEpIdRef.current = currentEpId; }, [currentEpId]);

  useEffect(() => {
    if (!drama?.episodes?.length || !urlEp) return;
    const paramStr = String(urlEp).trim();
    const paramNum = Number(paramStr);
    const found = drama.episodes.find(e => 
      String(e.id) === paramStr || 
      String(e.number) === paramStr || 
      (!isNaN(paramNum) && Number(e.number) === paramNum)
    );
    if (found && found.id !== currentEpIdRef.current) {
      setCurrentEpId(found.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlEp, drama]);

  // Load stream when episode changes
  useEffect(() => {
    if (!currentEpId || !drama) return;
    const ep = drama.episodes.find(e => e.id === currentEpId);
    if (!ep?.embedUrl) return;

    (async () => {
      setIsStreamLoading(true);
      setStreamError(null);
      setStream(null);
      setActiveServerIdx(0);
      try {
        const result = await omni.drama.getStream(ep.embedUrl!);
        setStream(result);
        // Default to 'byse' server first, otherwise first HLS, otherwise first server
        const byseIdx = result.servers.findIndex((s: any) => s.name?.toLowerCase().includes('byse'));
        const hlsIdx = result.servers.findIndex((s: any) => s.type === 'hls');
        setActiveServerIdx(byseIdx >= 0 ? byseIdx : (hlsIdx >= 0 ? hlsIdx : 0));
      } catch {
        setStreamError('Failed to load stream');
      } finally {
        setIsStreamLoading(false);
      }
    })();
  }, [currentEpId, drama]);

  const currentEpIndex = drama?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEp = drama?.episodes[currentEpIndex];
  const currentServer = stream?.servers?.[activeServerIdx];

  const saveDramaProgress = useCallback(async () => {
    if (!drama || !currentEp) return;
    const epNum = currentEp.number || 1;
    const title = formatAnimeTitle(drama.title, slug);
    if (typeof window !== 'undefined' && title && !title.toLowerCase().includes('unknown')) {
        localStorage.setItem(`shadow_anime_title_${slug}`, title);
    }
    const poster = (drama as any).poster || (drama as any).cover || (drama as any).image || '/images/no-poster.png';
    const serverName = currentServer?.name || 'Standard';

    if (user && supabase) {
      const payload = {
        user_id: user.id,
        anime_id: slug,
        title: title,
        banner_image: poster,
        episode_id: currentEp.id,
        episode_number: epNum,
        progress: 100,
        last_updated: new Date().toISOString(),
        last_server: serverName,
        episode_image: poster,
        total_episodes: drama.episodes?.length || 1,
        type: 'drama',
        media_type: 'drama',
        is_completed: false
      };
      try {
        await (supabase.from('user_continue_watching') as any).upsert(payload, { onConflict: 'user_id,episode_id' });
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
      } catch (e) {}
    }

    const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
    localData[slug] = {
      animeId: slug,
      title: title,
      poster: poster,
      episodeId: currentEp.id,
      episodeNumber: epNum,
      progress: 100,
      type: 'drama',
      lastUpdated: Date.now()
    };
    localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
  }, [drama, currentEp, user, slug, currentServer]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentEp) {
      window.history.replaceState({}, '', `/drama-watch/${slug}?ep=${currentEp.number}`);
      saveDramaProgress();
    }
  }, [currentEpId, slug, currentEp, saveDramaProgress]);

  useEffect(() => {
    return () => {
      saveDramaProgress();
    };
  }, [saveDramaProgress]);
  const activeUrl = stream?.servers?.[activeServerIdx]?.url;
  const activeIframe = activeUrl || currentEp?.embedUrl || currentEp?.url;

  const nextEp = currentEpIndex >= 0 && drama && currentEpIndex < drama.episodes.length - 1 ? drama.episodes[currentEpIndex + 1] : null;
  const prevEp = currentEpIndex > 0 ? drama?.episodes[currentEpIndex - 1] : null;

  // Mark previous episode as played when switching, and update URL
  const handleEpClick = useCallback((id: string) => {
    markEpPlayed(currentEpId);   // mark what was playing before
    setCurrentEpId(id);
    setStream(null);
    if (typeof window !== 'undefined') {
      const ep = drama?.episodes.find(e => e.id === id);
      const url = new URL(window.location.href);
      url.searchParams.set('ep', ep ? String(ep.number) : id);
      window.history.replaceState({}, '', url.toString());
    }
  }, [drama, currentEpId, markEpPlayed]);

  // Handler: player area tapped → mark current ep as played
  const handlePlayerTap = useCallback(() => {
    markEpPlayed(currentEpId);
  }, [currentEpId, markEpPlayed]);

  const episodeChunks = drama ? (() => {
    const eps = drama.episodes || [];
    const c = []; for (let i = 0; i < eps.length; i += chunkSize) c.push(eps.slice(i, i + chunkSize)); return c;
  })() : [];

  useEffect(() => {
    if (!currentEpId || !drama) return;
    const idx = drama.episodes.findIndex(e => e.id === currentEpId);
    if (idx !== -1) setEpChunkIndex(Math.floor(idx / chunkSize));
  }, [currentEpId, drama]);

  if (isLoadingInfo) return <WatchPageSkeleton />;
  if (!drama) return (
    <div className="min-h-screen bg-[#050505] text-gray-100 flex items-center justify-center flex-col gap-4">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <h2 className="text-xl font-black tracking-widest uppercase">Failed to load data</h2>
      <p className="text-zinc-500 text-sm">Please try refreshing the page.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans overflow-x-hidden relative">
      <style jsx global>{`
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } } .animate-shimmer { animation: shimmer 3s infinite linear; }
      `}</style>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center relative z-10 px-4 mt-2">
      <div onClick={() => setDimMode(false)} className={cn("fixed inset-0 bg-black/95 transition-opacity duration-500 will-change-[opacity]", dimMode ? 'opacity-100 pointer-events-auto cursor-pointer z-[40]' : 'opacity-0 pointer-events-none z-[40]')} />

        <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-6 items-stretch">

          {/* Player Column */}
          <div className="xl:col-span-8 w-full flex flex-col gap-2 order-1">
            {/* Invisible touch detector wraps the player — pointer-events-none so it never blocks the iframe */}
            <div
              className={cn("w-full h-[250px] md:h-auto md:aspect-video bg-black/40 backdrop-blur-2xl rounded-[30px] overflow-hidden border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative outline-none focus:ring-1 focus:ring-white/10 transition-all duration-500", dimMode ? "z-[60] ring-2 ring-orange-500/50 shadow-[0_0_50px_rgba(0,0,0,0.9)]" : "z-10")}
              onClick={handlePlayerTap}
            >
              {/* Pass-through tap detector — sits above iframe but doesn't absorb pointer events */}
              <div className="absolute inset-0 z-[5] pointer-events-none" />
              {isStreamLoading ? (
                <div className="w-full h-full flex items-center justify-center border-b border-white/5">
                  <LiquidPlayerSkeleton text="INITIALIZING DRAMA STREAM..." />
                </div>
              ) : streamError ? (
                <div className="w-full h-full flex items-center justify-center bg-black text-zinc-500">
                  <div className="flex flex-col items-center gap-3">
                    <X size={32} className="text-orange-600" />
                    <p className="text-sm font-bold">{streamError}</p>
                  </div>
                </div>
              ) : (
                <DramaPlayer
                  key={`${currentEpId}-${activeServerIdx}`}
                  ref={playerRef}
                  url={activeUrl}
                  iframeUrl={activeIframe}
                  title={currentEp?.title || drama.title}
                  autoPlay
                  onProgress={(s) => { progressRef.current = s.playedSeconds; }}
                  episodes={drama.episodes}
                  currentEpId={currentEpId}
                  onEpisodeSelect={handleEpClick}
                  isAutoNext={isAutoNext}
                />
              )}
            </div>

             <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full transition-all duration-500 will-change-transform">
            <div className={cn("hidden lg:flex w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[30px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] px-5 py-3 items-center justify-between gap-4 mt-3 transition-all duration-500", dimMode ? "z-[60] relative" : "relative z-10")}>
              {/* Left: Prev / Next EP */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button disabled={!prevEp} onClick={() => prevEp && handleEpClick(prevEp.id)} className={cn("flex items-center justify-center gap-2 px-4 h-8 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40 whitespace-nowrap", prevEp ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-orange-600 hover:border-orange-500 hover:text-white" : "opacity-10 border-white/5 text-zinc-600")}><SkipBack size={12} /> PREV</button>
                {nextEp ? (
                  <button onClick={() => handleEpClick(nextEp.id)} className="flex items-center justify-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 whitespace-nowrap group">NEXT <SkipForward size={12} className="group-hover:translate-x-1 transition-transform" /></button>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-50 cursor-not-allowed">NEXT <SkipForward size={12} /></button>
                )}
                <Button onClick={() => setDimMode(v => !v)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 transition-all hover:scale-110 shadow-orange-900/10 flex-shrink-0", dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={14} /></Button>
              </div>

              {/* Middle: Now Playing + Auto Next */}
              <div className="flex-1 min-w-0 flex items-center justify-center gap-4 border-l border-white/5 pl-4 ml-2">
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] text-orange-500 font-black uppercase shrink-0">NOW:</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 truncate">
                    {currentEp ? `EP ${currentEp.number} — ${currentEp.title}` : drama.title}
                  </span>
                </div>
                <button onClick={() => setIsAutoNext(v => !v)} className={cn("flex items-center justify-center gap-2 px-5 h-8 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0", isAutoNext ? "bg-orange-600/20 border-orange-500/50 text-orange-500" : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10 hover:text-zinc-300")}>
                  <SkipForward size={14} /> AUTO
                </button>
              </div>

              {/* Right: Download + WatchList + Room + Share + Server */}
              <div className="flex items-center gap-2 flex-shrink-0 border-l border-white/5 pl-4">
                {currentEpId && (
                  <Link href={`/download/drama/${slug}?ep=${currentEpId}`} className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white whitespace-nowrap shadow-md shadow-orange-900/5">
                    <Download size={12} /> <span className="hidden md:inline">DOWNLOAD</span>
                  </Link>
                )}
                <WatchListButton animeId={drama.id} animeTitle={drama.title} animeImage={drama.image} currentEp={currentEp?.number} mediaType="drama" totalEpisodes={drama.episodes?.length || 1} type="Drama" />

                <button 
                  onClick={handleCreateWatchRoom}
                  className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-primary-600 hover:border-primary-500 hover:text-white shrink-0 cursor-pointer shadow-md"
                  title="Create Watch Room"
                >
                  <Users size={12} />
                  <span className="hidden sm:inline">Room</span>
                </button>

                <PostShareModal
                  mediaData={{
                    id: drama.id,
                    title: drama.title,
                    poster: (drama as any).poster || drama.image,
                    synopsis: drama.synopsis || (drama as any).description,
                    type: 'Drama',
                    rating: drama.rating || '16+',
                    totalEpisodes: drama.episodes?.length || 0,
                    episodeNumber: currentEp?.number || 1,
                    url: typeof window !== 'undefined' ? window.location.href : `/drama-watch/${drama.id}?ep=${currentEp?.number || 1}`
                  }}
                  trigger={
                    <button 
                      className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-primary-600 hover:border-primary-500 hover:text-white shrink-0 cursor-pointer shadow-md"
                      title="Share Drama"
                    >
                      <Share2 size={12} />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  }
                />

                {stream && stream.servers.length > 0 && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase transition-all shadow-md shadow-orange-900/5 whitespace-nowrap rounded-full border border-white/5 bg-white/5 px-4">
                        <ServerIcon size={12} />
                        {currentServer?.name || 'Server'}
                        <ChevronDown size={11} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-lg z-40 min-w-[160px] p-2">
                      <ScrollArea className="h-auto max-h-[180px]">
                        <div className="flex flex-col gap-1">
                          {stream.servers.map((srv, idx) => (
                            <DropdownMenuItem key={idx} onClick={() => setActiveServerIdx(idx)} className={cn("cursor-pointer focus:bg-orange-600 focus:text-white px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-1 transition-all", activeServerIdx === idx ? "bg-orange-600 text-white shadow-lg" : "text-zinc-400 hover:text-white hover:bg-white/5")}>{srv.name}</DropdownMenuItem>
                          ))}
                        </div>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Controls Bar — Mobile */}
            <div className={cn("flex lg:hidden w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[30px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] py-4 px-3 flex-col gap-3 overflow-hidden mt-3 transition-all duration-500", dimMode ? "z-[60] relative" : "relative z-10")}>
              {/* Row 1: Now Playing title */}
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] text-orange-500 font-black uppercase shrink-0">NOW:</span>
                <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 truncate">
                  {currentEp ? `EP ${currentEp.number} — ${currentEp.title}` : drama.title}
                </span>
              </div>
              {/* Row 2: Auto Next + WatchList */}
              <div className="grid grid-cols-2 gap-3 w-full items-center">
                <button onClick={() => setIsAutoNext(v => !v)} className={cn("w-full flex items-center justify-center gap-2 h-10 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95", isAutoNext ? "bg-orange-600/20 border-orange-500/60 text-orange-400 shadow-[0_0_12px_rgba(234,88,12,0.25)]" : "bg-white/5 border-white/10 text-zinc-500")} title={`Auto Next: ${isAutoNext ? 'ON' : 'OFF'}`}>
                  <div className="relative flex items-center gap-2">
                    <StepForward size={14} className={cn("transition-transform", isAutoNext && "scale-110")} />
                    <span>AUTO NEXT</span>
                    <span className={cn("w-1.5 h-1.5 rounded-full transition-all ml-0.5", isAutoNext ? "bg-orange-500 shadow-[0_0_6px_rgba(234,88,12,1)] animate-pulse" : "bg-zinc-600/40")} />
                  </div>
                </button>
                <WatchListButton animeId={drama.id} animeTitle={drama.title} animeImage={drama.image} currentEp={currentEp?.number} mediaType="drama" totalEpisodes={drama.episodes?.length || 1} type="Drama" />
              </div>
              {/* Row 3: PREV / NEXT */}
              <div className="flex w-full justify-between items-center gap-2 border-t border-white/5 pt-3">
                <button disabled={!prevEp} onClick={() => prevEp && handleEpClick(prevEp.id)} className="flex-1 bg-white/5 h-8 rounded-full border border-white/5 flex items-center justify-center gap-1 text-zinc-400 text-[10px] font-black uppercase hover:text-white active:bg-white/10"><SkipBack size={14} /> PREV</button>
                <button disabled={!nextEp} onClick={() => nextEp && handleEpClick(nextEp.id)} className="flex-1 bg-white/5 h-8 rounded-full border border-white/5 flex items-center justify-center gap-1 text-zinc-400 text-[10px] font-black uppercase hover:text-white active:bg-white/10">NEXT <SkipForward size={14} /></button>
              </div>
              {/* Row 4: Room + Share + Download + Server */}
              <div className="flex w-full justify-between items-center gap-1.5 border-t border-white/5 pt-3 overflow-x-auto custom-scrollbar">
                <Button onClick={() => setDimMode(v => !v)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 transition-all shadow-orange-900/10 flex-shrink-0", dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={14} /></Button>

                <button 
                  onClick={handleCreateWatchRoom}
                  className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-primary-600 shrink-0"
                  title="Create Watch Room"
                >
                  <Users size={12} />
                  <span>Room</span>
                </button>

                <PostShareModal
                  mediaData={{
                    id: drama.id,
                    title: drama.title,
                    poster: (drama as any).poster || drama.image,
                    synopsis: drama.synopsis || (drama as any).description,
                    type: 'Drama',
                    rating: drama.rating || '16+',
                    totalEpisodes: drama.episodes?.length || 0,
                    episodeNumber: currentEp?.number || 1,
                    url: typeof window !== 'undefined' ? window.location.href : `/drama-watch/${drama.id}?ep=${currentEp?.number || 1}`
                  }}
                  trigger={
                    <button 
                      className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-primary-600 shrink-0"
                      title="Share Drama"
                    >
                      <Share2 size={12} />
                      <span>Share</span>
                    </button>
                  }
                />
                {currentEpId && (
                  <Link href={`/download/drama/${slug}?ep=${currentEpId}`} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-400 text-[10px] font-black uppercase hover:text-white active:bg-white/10">
                    <Download size={14} /> DOWNLOAD
                  </Link>
                )}
                {stream && stream.servers.length > 0 && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 bg-white/5 rounded-full border border-white/5 px-4">
                        <ServerIcon size={12} />
                        {currentServer?.name || 'Server'}
                        <ChevronDown size={11} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-2 shadow-lg z-[70]">
                      <ScrollArea className="h-auto max-h-[150px]">
                        <div className="flex flex-col gap-1">
                          {stream.servers.map((srv, idx) => (
                            <DropdownMenuItem key={idx} onClick={() => setActiveServerIdx(idx)} className={cn("text-[10px] uppercase font-bold", activeServerIdx === idx ? "bg-orange-600 text-white" : "text-zinc-400 hover:bg-white/10")}>{srv.name}</DropdownMenuItem>
                          ))}
                        </div>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </motion.div>
          </div>

          {/* Right Column: Episodes */}
          <div className="xl:col-span-4 w-full h-full bg-black/40 backdrop-blur-2xl rounded-[40px] border border-white/10 overflow-hidden flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative z-20 order-2">
            <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-lemon tracking-widest"><Layers size={18} className="text-orange-600" /> Episodes</h3>
                <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white font-black text-[10px] px-3 h-5 rounded-full shadow-lg">{drama.episodes.length}</Badge>
              </div>
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                <button onClick={() => setEpViewMode('compact')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'compact' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}><Grid size={14} /></button>
                <button onClick={() => setEpViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}><LayoutGrid size={14} /></button>
                <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}><List size={14} /></button>
              </div>
            </div>

            {episodeChunks.length > 1 && (
              <div className="w-full border-b border-white/10 bg-white/5 backdrop-blur-md flex-shrink-0 py-3 relative group/chunks">
                <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar px-4">
                  {episodeChunks.map((_, idx) => (
                    <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full transition-all border shadow-sm uppercase tracking-wider backdrop-blur-md", epChunkIndex === idx ? "bg-orange-600 text-white border-orange-500 shadow-orange-900/20" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10")}>
                      {idx * chunkSize + 1}–{Math.min((idx + 1) * chunkSize, drama.episodes.length)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="xl:flex-1 xl:overflow-y-auto h-auto p-2">
              <div className={cn("p-2 grid", epViewMode === 'grid' ? 'grid-cols-5 gap-2.5' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-2')}>
                {episodeChunks[epChunkIndex]?.map((ep) => (
                  <EpisodeButton key={ep.id} ep={ep} isCurrent={ep.id === currentEpId} isPlayed={playedEpIds.has(ep.id) && ep.id !== currentEpId} percent={epProgress[ep.number] || 0} viewMode={epViewMode} onClick={handleEpClick} />
                ))}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-8 w-full h-auto bg-black/40 backdrop-blur-2xl rounded-[40px] border border-white/10 overflow-hidden flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative order-3">
            <div className="flex-shrink-0 p-8 flex flex-col sm:flex-row gap-8 bg-gradient-to-b from-orange-600/5 to-transparent">
              <div className="shrink-0">
                <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] w-fit sm:mx-0">
                  <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#f97316_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" />
                  <img src={drama.image || '/images/no-poster.png'} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl" alt={drama.title} loading="lazy" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <h1 className="text-3xl md:text-4xl font-black text-white font-lemon leading-none tracking-tighter">{drama.title}</h1>
                <div className="flex flex-wrap gap-3 items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <CountryBadge country={drama.country} type={drama.type} showFullname />
                  {drama.year && <span className="bg-white/5 border border-white/5 px-3 py-1 rounded-full">{drama.year}</span>}
                  {drama.status && <span className={cn("px-3 py-1 rounded-full border", drama.status.toLowerCase().includes('ongoing') ? "text-green-400 border-green-900/50 bg-green-900/20 animate-pulse" : "bg-white/5 border-white/5")}>{drama.status}</span>}
                  {drama.rating && <span className="text-yellow-500 bg-yellow-900/20 border border-yellow-900/30 px-3 py-1 rounded-full">⭐ {drama.rating}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {drama.genres.map(g => <span key={g} className="text-[9px] px-3 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 uppercase font-black tracking-widest">{g}</span>)}
                </div>
                {drama.synopsis && (
                  <div>
                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.5em] mb-2 flex items-center gap-2"><Info size={12} /> Synopsis</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed opacity-90">{drama.synopsis}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Suggestions (More Like This) */}
          <div className="xl:col-span-4 w-full h-[500px] xl:h-auto xl:relative xl:self-stretch order-4">
            {drama.recommendations.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="w-full h-full xl:absolute xl:inset-0 flex flex-col bg-[#0a0a0a] rounded-[40px] border border-white/5 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 shrink-0"><Flame size={18} className="text-orange-600" /><h3 className="font-black text-white text-sm font-lemon tracking-widest uppercase">More Like This</h3></div>
                <ScrollArea className="flex-1 min-h-0 h-[300px] xl:h-auto pr-4">
                  <div className="flex flex-col gap-3">
                    {drama.recommendations.map((rec: any) => (
                      <Link key={rec.id} href={`/drama-watch/${rec.id}`} className="flex items-center gap-4 bg-white/5 border border-white/5 hover:border-orange-500/50 hover:bg-white/10 rounded-2xl p-2 transition-all">
                        <img src={rec.image} alt={rec.title} className="w-16 h-24 object-cover rounded-xl shadow-md" loading="lazy" />
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight">{rec.title}</h4>
                          <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">{rec.country} {rec.year && `· ${rec.year}`}</p>
                          {rec.type && <span className="text-[9px] text-zinc-400 uppercase mt-1">{rec.type}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </div>

          {/* Comment Section */}
          <div className="xl:col-span-12 w-full mt-2 order-5">
            <ShadowComments episodeId={`drama_${drama.id}`} />
          </div>

        </div>
      </motion.div>

      <Footer />
    </div>
  );
}

export default function DramaWatchClient() {
  return <Suspense fallback={<WatchPageSkeleton />}><DramaWatchContent /></Suspense>;
}
