"use client";

import React, { useState, useEffect, useRef, useCallback, memo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Flame, Info, Loader2, X, Download } from 'lucide-react';
import { omni, DramaDetail, DramaStream } from '@/lib/omni';
import { cn } from '@/lib/utils';
import DramaPlayer, { DramaPlayerRef } from '@/components/Player/DramaPlayer';
import Footer from '@/components/Anime/Footer';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Helpers ──────────────────────────────────────────────────────────────────

const FantasyLoader = memo(({ text = "LOADING..." }: { text?: string }) => (
  <div className="w-full min-h-[500px] flex flex-col items-center justify-center bg-[#050505]">
    <div className="w-14 h-14 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
    <h2 className="text-lg font-[Cinzel] text-orange-500 animate-pulse tracking-[0.3em]">{text}</h2>
  </div>
));
FantasyLoader.displayName = "FantasyLoader";

// ── Main Component ────────────────────────────────────────────────────────────

function DramaWatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.id as string;
  const urlEp = searchParams.get('ep');

  const playerRef = useRef<DramaPlayerRef>(null);

  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [stream, setStream] = useState<DramaStream | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [activeServerIdx, setActiveServerIdx] = useState(0);

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
        const byseIdx = result.servers.findIndex((s: any) => s.name?.toLowerCase().includes('byse'));
        const hlsIdx = result.servers.findIndex((s: any) => s.type === 'hls');
        setActiveServerIdx(byseIdx >= 0 ? byseIdx : (hlsIdx >= 0 ? hlsIdx : 0));
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

  const currentServer = stream?.servers[activeServerIdx];
  const isHlsActive = currentServer?.type === 'hls';
  const activeUrl = isHlsActive ? currentServer?.url : undefined;
  const activeIframe = !isHlsActive ? currentServer?.url : stream?.iframeUrl;

  const currentEpIndex = drama?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEp = drama?.episodes[currentEpIndex];
  const nextEp = currentEpIndex >= 0 && drama && currentEpIndex < drama.episodes.length - 1 ? drama.episodes[currentEpIndex + 1] : null;

  const handleEpClick = useCallback((id: string) => {
    setCurrentEpId(id);
    setStream(null);
  }, []);

  if (isLoadingInfo || !drama) return <FantasyLoader text="LOADING DRAMA..." />;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-24 font-sans overflow-x-hidden">
      
      {/* Dynamic Hero Section */}
      <div className="relative w-full h-[60vh] md:h-[75vh] bg-[#050505] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={drama.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {drama.image && (
              <img src={drama.image} alt={drama.title} className="w-full h-full object-cover opacity-80" loading="eager" />
            )}
            {/* Futuristic Gradients & Grid */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-transparent w-full md:w-[65%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent h-72 bottom-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-16 md:bottom-24 left-0 w-full px-4 md:px-12 flex flex-col justify-end z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }} 
            className="max-w-2xl pointer-events-auto"
          >
            {drama.country && (
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] animate-pulse" />
                <span className="text-[9px] md:text-[11px] font-black text-orange-400 uppercase tracking-[0.5em]">{drama.country} ORIGINAL</span>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-4 drop-shadow-2xl font-[Cinzel]">
              {drama.title}
            </h1>
            <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold text-zinc-300 mb-5 drop-shadow-lg uppercase tracking-widest">
                {drama.year && <span>{drama.year}</span>}
                {drama.status && <span className="border border-orange-500/50 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{drama.status}</span>}
                <span>{drama.episodes.length} EPS</span>
            </div>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed mb-6 drop-shadow-lg line-clamp-3 md:line-clamp-4 font-medium max-w-xl">
               {drama.synopsis}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content Grid (Player & Sticky Sidebar) */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 mt-[-40px] relative z-20 flex flex-col xl:grid xl:grid-cols-12 gap-8 items-start">
        
        {/* Player Column */}
        <div className="xl:col-span-8 w-full flex flex-col gap-4">
          <div className="w-full aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative group">
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
                title={currentEp?.title ? `EP ${currentEp.number}: ${currentEp.title}` : drama.title}
                autoPlay
                onEnded={() => { if (nextEp) handleEpClick(nextEp.id); }}
                // Pass episodes and servers for integrated menus
                episodes={drama.episodes}
                currentEpId={currentEpId}
                onEpisodeSelect={handleEpClick}
                servers={stream?.servers}
                activeServerIdx={activeServerIdx}
                onServerSelect={setActiveServerIdx}
              />
            )}
          </div>

          <div className="flex items-center justify-between w-full bg-[#0a0a0a] border border-white/5 rounded-3xl p-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-orange-500 font-black uppercase">NOW PLAYING</span>
              <span className="text-sm font-black text-zinc-200">
                {currentEp ? `EP ${currentEp.number} — ${currentEp.title}` : drama.title}
              </span>
            </div>
            {currentEpId && (
              <Link href={`/download/drama/${slug}?ep=${currentEpId}`} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-all hover:bg-orange-600 hover:border-orange-500 hover:text-white shadow-md">
                  <Download size={16} />
                  <span className="text-[10px] font-black uppercase">Download</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Recommendations Carousel */}
        <div className="xl:col-span-4 w-full xl:sticky xl:top-24 flex flex-col gap-6">
          {drama.recommendations.length > 0 && (
            <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-xl rounded-[40px] border border-white/5 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6"><Flame size={18} className="text-orange-600" /><h3 className="font-black text-white text-sm font-[Cinzel] tracking-widest uppercase">More Like This</h3></div>
              <ScrollArea className="h-[60vh] xl:h-[650px] pr-4">
                <div className="flex flex-col gap-4">
                  {drama.recommendations.map((rec, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={rec.id}
                    >
                      <Link href={`/drama-watch/${rec.id}`} className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 p-2.5 rounded-2xl border border-white/5 transition-all">
                        <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-zinc-900 relative shadow-md">
                          <img src={rec.image || '/images/no-poster.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rec.title} loading="lazy" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Play size={16} className="text-white" /></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors line-clamp-2 mb-1">{rec.title}</p>
                          <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase">
                            <span>{rec.country || 'Drama'}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
}

export default function DramaWatchClient() {
  return <Suspense fallback={<FantasyLoader text="LOADING..." />}><DramaWatchContent /></Suspense>;
}
