"use client";

import React, { useState, useEffect, useRef, useCallback, memo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SkipForward, SkipBack, Server as ServerIcon, Layers, Clock, Play, Grid, List, LayoutGrid, ChevronDown, Flame, Info, Loader2, Check, X } from 'lucide-react';
import { omni, DramaDetail, DramaServer, DramaStream } from '@/lib/omni';
import { cn } from '@/lib/utils';
import DramaPlayer, { DramaPlayerRef } from '@/components/Player/DramaPlayer';
import Footer from '@/components/Anime/Footer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

// ── Helpers ──────────────────────────────────────────────────────────────────

const FantasyLoader = memo(({ text = "LOADING..." }: { text?: string }) => (
  <div className="w-full min-h-[500px] flex flex-col items-center justify-center bg-[#050505]">
    <div className="w-14 h-14 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
    <h2 className="text-lg font-[Cinzel] text-orange-500 animate-pulse tracking-[0.3em]">{text}</h2>
  </div>
));
FantasyLoader.displayName = "FantasyLoader";

const EpisodeButton = memo(({ ep, isCurrent, percent, viewMode, onClick }: any) => (
  <motion.button
    layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    onClick={() => onClick(ep.id)}
    className={cn(
      "relative overflow-hidden group border transition-all duration-300",
      viewMode === 'grid' ? "h-9 w-full rounded-full flex items-center justify-center text-[11px] font-black shadow-lg" :
      viewMode === 'compact' ? "aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" :
      "w-[95%] mx-auto h-9 rounded-full flex items-center px-4 text-[11px] font-bold text-left",
      isCurrent ? "bg-orange-600/90 border-orange-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] scale-105" :
      percent >= 80 ? "bg-[#000] border border-orange-900/30 text-white shadow-[inset_0_0_15px_rgba(220,38,38,0.5)]" :
      "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white"
    )}
    style={!isCurrent && percent > 0 && percent < 80 ? { background: `linear-gradient(to right, rgba(220,38,38,0.4) ${percent}%, transparent ${percent}%)` } : {}}
  >
    <span className={cn("truncate relative z-10 w-full", viewMode === 'list' ? "text-left" : "text-center")}>
      {viewMode === 'list' ? `${ep.number}. ${ep.title}` : ep.number}
    </span>
  </motion.button>
));
EpisodeButton.displayName = "EpisodeButton";

// ── Main Component ────────────────────────────────────────────────────────────

function DramaWatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.id as string;
  const urlEp = searchParams.get('ep');

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
  const chunkSize = 50;

  // Load drama info
  useEffect(() => {
    if (!slug) return;
    (async () => {
      setIsLoadingInfo(true);
      const data = await omni.drama.getDetail(slug);
      setDrama(data);
      setIsLoadingInfo(false);
      if (data?.episodes?.length) {
        let target = data.episodes[0].id;
        if (urlEp) {
          const found = data.episodes.find(e => String(e.number) === urlEp || e.id === urlEp);
          if (found) target = found.id;
        }
        setCurrentEpId(target);
      }
    })();
  }, [slug]);

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
        // Default to first HLS server index
        const hlsIdx = result.servers.findIndex(s => s.type === 'hls');
        setActiveServerIdx(hlsIdx >= 0 ? hlsIdx : 0);
      } catch {
        setStreamError('Failed to load stream');
      } finally {
        setIsStreamLoading(false);
      }
    })();
    // Update URL
    if (typeof window !== 'undefined') {
      if (ep) window.history.replaceState({}, '', `/drama-watch/${slug}?ep=${ep.number}`);
    }
  }, [currentEpId, drama]);

  const currentServer: DramaServer | undefined = stream?.servers[activeServerIdx];
  const isHlsActive = currentServer?.type === 'hls';
  const activeUrl = isHlsActive ? currentServer?.url : undefined;
  const activeIframe = !isHlsActive ? currentServer?.url : stream?.iframeUrl;

  const currentEpIndex = drama?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEp = drama?.episodes[currentEpIndex];
  const nextEp = currentEpIndex >= 0 && drama && currentEpIndex < drama.episodes.length - 1 ? drama.episodes[currentEpIndex + 1] : null;
  const prevEp = currentEpIndex > 0 ? drama?.episodes[currentEpIndex - 1] : null;

  const handleEpClick = useCallback((id: string) => {
    setCurrentEpId(id);
    setStream(null);
  }, []);

  const episodeChunks = drama ? (() => {
    const c = []; for (let i = 0; i < drama.episodes.length; i += chunkSize) c.push(drama.episodes.slice(i, i + chunkSize)); return c;
  })() : [];

  useEffect(() => {
    if (!currentEpId || !drama) return;
    const idx = drama.episodes.findIndex(e => e.id === currentEpId);
    if (idx !== -1) setEpChunkIndex(Math.floor(idx / chunkSize));
  }, [currentEpId]);

  if (isLoadingInfo || !drama) return <FantasyLoader text="LOADING DRAMA..." />;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-24 pt-[env(safe-area-inset-top)] font-sans overflow-x-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center bg-[#050505] relative z-40 px-4 md:px-8 mt-6">
        <div className="w-full max-w-[1500px] flex flex-col xl:grid xl:grid-cols-12 gap-8 items-start">

          {/* Player Column */}
          <div className="xl:col-span-8 w-full flex flex-col gap-2">
            <div className="w-full aspect-video bg-black rounded-[30px] overflow-hidden border border-white/5 shadow-2xl relative">
              {isStreamLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                    <p className="text-[10px] font-[Cinzel] text-orange-500 animate-pulse tracking-widest uppercase">Opening Portal...</p>
                  </div>
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
                  onEnded={() => { if (nextEp) handleEpClick(nextEp.id); }}
                />
              )}
            </div>

            {/* Controls Bar */}
            <div className="w-full bg-[#0a0a0a] border border-white/5 rounded-[30px] shadow-lg px-5 py-3 flex flex-col gap-2 mt-3">
              <div className="flex w-full justify-between items-center gap-3">
                <div className="flex items-center gap-2 w-full">
                  <button disabled={!prevEp} onClick={() => prevEp && handleEpClick(prevEp.id)} className={cn("flex items-center gap-2 px-4 h-8 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all flex-1 whitespace-nowrap", prevEp ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-orange-600 hover:border-orange-500 hover:text-white" : "opacity-10 border-white/5 text-zinc-600")}>
                    <SkipBack size={12} /> PREV
                  </button>
                  {nextEp ? (
                    <button onClick={() => handleEpClick(nextEp.id)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 flex-1 whitespace-nowrap">
                      NEXT EP <SkipForward size={12} />
                    </button>
                  ) : (
                    <button disabled className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-600 text-[10px] font-black uppercase flex-1 whitespace-nowrap opacity-50 cursor-not-allowed">
                      NEXT EP <SkipForward size={12} />
                    </button>
                  )}
                </div>

                {/* Server Switcher */}
                {stream && stream.servers.length > 0 && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase rounded-full border border-white/5 bg-white/5 px-4 whitespace-nowrap">
                        <ServerIcon size={12} />
                        {currentServer?.name || 'Server'} {currentServer?.type === 'hls' ? '(HLS)' : '(Embed)'}
                        <ChevronDown size={11} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-lg z-40 min-w-[180px] p-2">
                      {stream.servers.map((srv, idx) => (
                        <DropdownMenuItem key={idx} onClick={() => setActiveServerIdx(idx)} className={cn("cursor-pointer focus:bg-orange-600 focus:text-white px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider mb-1 transition-all flex items-center gap-2", activeServerIdx === idx ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
                          {activeServerIdx === idx && <Check size={10} />}
                          {srv.name}
                          <span className={cn("ml-auto text-[8px] px-2 py-0.5 rounded-full", srv.type === 'hls' ? "bg-green-900/50 text-green-400" : "bg-zinc-800 text-zinc-400")}>
                            {srv.type === 'hls' ? 'HLS' : 'Embed'}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Episode title */}
              <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] text-orange-500 font-black uppercase shrink-0">NOW:</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 truncate">
                    {currentEp ? `EP ${currentEp.number} — ${currentEp.title}` : drama.title}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Episodes Column */}
          <div className="xl:col-span-4 w-full h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm font-[Cinzel] tracking-widest"><Layers size={18} className="text-orange-600" /> Episodes</h3>
                <Badge className="bg-white/10 border border-white/10 text-white font-black text-[10px] px-3 h-5 rounded-full">{drama.episodes.length}</Badge>
              </div>
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                <button onClick={() => setEpViewMode('compact')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'compact' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}><Grid size={14} /></button>
                <button onClick={() => setEpViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}><LayoutGrid size={14} /></button>
                <button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-md transition-all", epViewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}><List size={14} /></button>
              </div>
            </div>

            {episodeChunks.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 overflow-x-auto no-scrollbar">
                {episodeChunks.map((_, idx) => (
                  <button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full border shadow-sm uppercase tracking-wider transition-all", epChunkIndex === idx ? "bg-orange-600 text-white border-orange-500" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300")}>
                    {idx * chunkSize + 1}–{Math.min((idx + 1) * chunkSize, drama.episodes.length)}
                  </button>
                ))}
              </div>
            )}

            <ScrollArea className="flex-1 p-2">
              <div className={cn("p-2 grid", epViewMode === 'grid' ? 'grid-cols-5 gap-2.5' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-2')}>
                {episodeChunks[epChunkIndex]?.map((ep) => (
                  <EpisodeButton key={ep.id} ep={ep} isCurrent={ep.id === currentEpId} percent={epProgress[ep.number] || 0} viewMode={epViewMode} onClick={handleEpClick} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.div>

      {/* Info Section */}
      <div className="w-full flex justify-center mt-8 px-4 md:px-8 pb-12">
        <div className="w-full max-w-[1500px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-shrink-0 p-8 flex flex-col sm:flex-row gap-8 bg-gradient-to-b from-orange-600/5 to-transparent">
              <div className="shrink-0">
                <div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] w-fit mx-auto sm:mx-0">
                  <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#f97316_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" />
                  <img src={drama.image || '/images/no-poster.png'} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl" alt={drama.title} loading="lazy" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <h1 className="text-3xl md:text-4xl font-black text-white font-[Cinzel] leading-none tracking-tighter">{drama.title}</h1>
                <div className="flex flex-wrap gap-3 items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {drama.country && <span className="bg-white/5 border border-white/5 px-3 py-1 rounded-full">{drama.country}</span>}
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

            {/* Recommendations */}
            {drama.recommendations.length > 0 && (
              <div className="p-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6"><Flame size={18} className="text-orange-600" /><h3 className="font-black text-white text-sm font-[Cinzel] tracking-widest uppercase">More Like This</h3></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {drama.recommendations.slice(0, 6).map(rec => (
                    <Link key={rec.id} href={`/drama-watch/${rec.id}`} className="group flex flex-col gap-2">
                      <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 relative shadow-md">
                        <img src={rec.image || '/images/no-poster.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={rec.title} loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Play size={20} className="text-white" /></div>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors line-clamp-2">{rec.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function DramaWatchClient() {
  return <Suspense fallback={<FantasyLoader text="LOADING..." />}><DramaWatchContent /></Suspense>;
}
