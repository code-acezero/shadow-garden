"use client";

/**
 * SHADOW GARDEN: WATCH TOWER (VER 93.0 - STABLE BASE)
 * =============================================================================
 * * [FIX: RESUME & SWITCHING]
 * - Fetches resume data specifically for the active episode ID every time it changes.
 * - Sets 'initialTime' to force the player to seek.
 * * [FIX: WATCHED HISTORY]
 * - Upserts to 'user_watched_history' immediately when an episode loads.
 * * [FIX: DATA SAVING]
 * - Saves continuously every 5s + on Page Close (Beacon).
 * - 10s Safety Lock prevents overwriting resume data on load.
 * * [UI]
 * - Immersive Mode (15s hide).
 * - Red Glow on Main Characters.
 */

import React, { useState, useEffect, useMemo, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  SkipForward, SkipBack, Server as ServerIcon, 
  Layers, Clock, AlertCircle, Tv, Play, 
  Grid, List, Timer, Lightbulb, 
  ChevronDown, Heart, CheckCircle, XCircle,
  FastForward, Star, Info, MessageSquare, User,
  Loader2, Globe, Flame, Calendar, Copyright, Check, Mic
} from 'lucide-react';

import { AnimeAPI_V2, supabase, WatchlistAPI } from '@/lib/api'; 
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; 

import AnimePlayer, { AnimePlayerRef } from '@/components/Player/AnimePlayer'; 
import WatchListButton from '@/components/Watch/WatchListButton'; 
import ShadowComments from '@/components/Comments/ShadowComments'; 
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

// --- TYPES & UTILS ---
interface V2EpisodeSchedule { airingISOTimestamp: string | null; airingTimestamp: number | null; secondsUntilAiring: number | null; }
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> { try { return await operation(); } catch (error) { if (retries <= 0) throw error; await new Promise(res => setTimeout(res, delay)); return retryOperation(operation, retries - 1, delay * 2); } }

// --- SETTINGS HOOK ---
const useWatchSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ autoPlay: true, autoSkip: true, dimMode: false, server: 'hd-1', category: 'sub' as 'sub' | 'dub' | 'raw', volume: 1, speed: 1, quality: -1 });
  useEffect(() => { const saved = localStorage.getItem('shadow_watch_settings'); if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); }, []);
  useEffect(() => {
    if (!user || !supabase) return;
    const fetchProfileSettings = async () => { try { const { data } = await (supabase.from('profiles') as any).select('player_settings').eq('id', user.id).single(); if (data?.player_settings) { const merged = { ...settings, ...data.player_settings }; setSettings(merged); localStorage.setItem('shadow_watch_settings', JSON.stringify(merged)); } } catch (e) { } }; fetchProfileSettings();
  }, [user]);
  const updateSetting = async (key: string, value: any) => { setSettings(prev => { const newSettings = { ...prev, [key]: value }; localStorage.setItem('shadow_watch_settings', JSON.stringify(newSettings)); if (user && supabase) { (supabase.from('profiles') as any).update({ player_settings: newSettings }).eq('id', user.id).then(); } return newSettings; }); };
  return { settings, updateSetting };
};

// --- SUB-COMPONENTS ---
const ChibiCry = ({ text = "UNKNOWN" }: { text?: string }) => (<div className="flex items-center gap-1 opacity-70 animate-pulse"><span className="text-xs text-red-500 font-black uppercase tracking-tighter">{text}</span></div>);
const NextEpisodeTimer = ({ schedule, status }: { schedule: V2EpisodeSchedule | null, status: string }) => { const [displayText, setDisplayText] = useState<React.ReactNode>("..."); useEffect(() => { if (status?.toLowerCase().includes("finished")) { setDisplayText(<ChibiCry text="ENDED" />); return; } if (!schedule || !schedule.airingISOTimestamp) { setDisplayText(<ChibiCry text="UNKNOWN" />); return; } const updateTimer = () => { const now = new Date().getTime(); const target = new Date(schedule.airingISOTimestamp!).getTime(); const diff = target - now; if (diff <= 0) { setDisplayText("Aired"); return; } const hours = Math.floor((diff % 86400000) / 3600000); const minutes = Math.floor((diff % 3600000) / 60000); const days = Math.floor(diff / 86400000); setDisplayText(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`); }; updateTimer(); const interval = setInterval(updateTimer, 30000); return () => clearInterval(interval); }, [schedule, status]); return (<div className="flex items-center gap-2 text-[10px] font-bold bg-white/5 text-zinc-300 px-3 h-8 rounded-full border border-white/5 justify-center min-w-fit max-w-full shadow-red-900/5"><Timer className="w-3 h-3 text-red-500 shrink-0" /><span className="truncate whitespace-nowrap">{displayText}</span></div>); };
const StarRating = ({ animeId, initialRating = 0 }: { animeId: string; initialRating?: string | number }) => { const [userRating, setUserRating] = useState(0); const [avgRating, setAvgRating] = useState(0); const [hover, setHover] = useState(0); const { user } = useAuth(); useEffect(() => { const fetchRatings = async () => { if (!supabase) return; try { const allRatings = await retryOperation(async () => { const { data, error } = await (supabase.from('anime_ratings') as any).select('rating').eq('anime_id', animeId); if (error) throw error; return data; }); if (allRatings && allRatings.length > 0) { const sum = allRatings.reduce((acc:any, curr:any) => acc + (curr.rating ?? 0), 0); setAvgRating(sum / allRatings.length); } else { setAvgRating(typeof initialRating === 'string' ? parseFloat(initialRating) : (typeof initialRating === 'number' ? initialRating : 0)); } if (user) { const myRating = await retryOperation(async () => { const { data } = await (supabase.from('anime_ratings') as any).select('rating').eq('user_id', user.id).eq('anime_id', animeId).single(); return data; }); if (myRating && (myRating as any).rating != null) setUserRating((myRating as any).rating); } } catch (e) {} }; fetchRatings(); }, [user, animeId, initialRating]); const handleRate = async (score: number) => { if (!user) { toast.error("Shadow Agents only. Please login to rate."); return; } setUserRating(score); if (supabase) { try { await (supabase.from('anime_ratings') as any).upsert({ user_id: user.id, anime_id: animeId, rating: score }, { onConflict: 'user_id, anime_id' }); toast.success(`Rated ${score} stars!`); const { data: allRatings } = await (supabase.from('anime_ratings') as any).select('rating').eq('anime_id', animeId); if (allRatings?.length) { const sum = allRatings.reduce((acc:any, curr:any) => acc + curr.rating, 0); setAvgRating(sum / allRatings.length); } } catch (err) { console.error(err); } } }; return (<div className="flex flex-col gap-1 items-end"><div className="flex items-center gap-2"><span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest text-right">{userRating > 0 ? "Your Rating" : "Rate This"}</span><span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">(AVG: {avgRating.toFixed(1)})</span></div><div className="flex items-center gap-2"><div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => handleRate(star)} className="focus:outline-none transition-transform hover:scale-110 active:scale-95"><Star size={14} className={cn("transition-all duration-300", star <= (hover || userRating) ? "fill-red-600 text-red-600 shadow-red-500/50" : "text-zinc-700")} /></button>))}</div><div className="flex flex-col items-end leading-none"><span className="text-[12px] text-white font-black">{userRating > 0 ? userRating : "?"}<span className="text-zinc-500 text-[10px]">/5</span></span></div></div></div>); };
const TrailerSection = ({ videos, animeName }: { videos: any[], animeName: string }) => { const [activeVideo, setActiveVideo] = useState(videos?.[0]?.source); if (!videos || videos.length === 0) return null; const getYoutubeId = (url: string) => url?.split('v=')[1]?.split('&')[0] || url?.split('/').pop(); return (<Dialog><DialogTrigger asChild><div className="inline-flex items-center gap-3 bg-red-600/10 border border-red-500/20 rounded-full px-8 py-2.5 cursor-pointer hover:bg-red-600 hover:border-red-500 transition-all group active:scale-95 shadow-lg shadow-red-900/10 w-full justify-center"><span className="flex items-center justify-center w-5 h-5 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform"><Play size={8} fill="currentColor" /></span><span className="text-[10px] font-black text-red-100 group-hover:text-white uppercase tracking-wider">Trailers ({videos.length})</span></div></DialogTrigger><DialogContent className="bg-black/95 border-red-500/40 max-w-4xl w-[95vw] p-0 overflow-hidden rounded-3xl shadow-[0_0_100px_-20px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300"><div className="flex flex-col h-full"><div className="aspect-video w-full bg-zinc-900"><iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /></div><div className="p-6 bg-[#0a0a0a]"><ScrollArea className="w-full whitespace-nowrap pb-4"><div className="flex gap-4 px-2">{videos.map((v: any, i: number) => (<button key={i} onClick={() => setActiveVideo(v.source)} className={cn("flex flex-col gap-1 p-2 rounded-2xl border transition-all shrink-0 w-36 hover:scale-105 active:scale-95 group/pv", activeVideo === v.source ? "bg-red-600/10 border-red-600" : "bg-white/5 border-transparent hover:border-white/10")}><div className="aspect-video w-full bg-zinc-800 rounded-lg overflow-hidden relative shadow-lg"><img src={v.thumbnail} className="w-full h-full object-cover opacity-60" alt="" /><div className="absolute inset-0 flex items-center justify-center bg-red-600/20 opacity-0 group-hover/pv:opacity-100 transition-opacity"><Play size={16} fill="white" className="text-white" /></div></div><span className="text-[9px] font-black text-center truncate w-full uppercase text-zinc-400 group-hover/pv:text-white">{v.title || `Promo ${i+1}`}</span></button>))}</div><ScrollBar orientation="horizontal" className="h-1 bg-white/5" /></ScrollArea></div></div></DialogContent></Dialog>); };
const FantasyLoader = ({ text = "SUMMONING..." }) => (<div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#050505]"><div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-red-500/20" /><h2 className="text-xl font-[Cinzel] text-red-500 animate-pulse tracking-[0.3em]">{text}</h2></div>);
const MarqueeTitle = ({ text }: { text: string }) => { const containerRef = useRef<HTMLDivElement>(null); const textRef = useRef<HTMLSpanElement>(null); const [isOverflowing, setIsOverflowing] = useState(false); useEffect(() => { if (containerRef.current && textRef.current) { const containerWidth = containerRef.current.offsetWidth; const textWidth = textRef.current.offsetWidth; setIsOverflowing(textWidth > containerWidth); } }, [text]); return (<div className="flex items-center bg-white/5 rounded-full px-4 h-8 border border-white/5 w-full sm:w-[280px] overflow-hidden relative transition-all hover:border-red-500/20 active:scale-95 group shadow-inner shadow-red-900/5"><span className="text-[11px] text-red-500 font-black uppercase mr-2 flex-shrink-0 group-hover:animate-pulse">NOW:</span><div ref={containerRef} className="flex-1 overflow-hidden relative h-full flex items-center"><span ref={textRef} className={cn("text-[11px] font-black uppercase tracking-tighter text-zinc-300 whitespace-nowrap", isOverflowing && "animate-marquee-slow")}>{text}</span><style jsx>{` @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-marquee-slow { animation: marquee 10s linear infinite; } `}</style></div></div>); };

// ==========================================
//  MAIN CONTENT
// ==========================================

function WatchContent() {
  const router = useRouter(); const params = useParams(); const searchParams = useSearchParams(); const animeId = params.id as string; const urlEpId = searchParams.get('ep'); const { user } = useAuth(); 
  const { settings, updateSetting } = useWatchSettings(); const [info, setInfo] = useState<any | null>(null); const [episodes, setEpisodes] = useState<any[]>([]); const [nextEpSchedule, setNextEpSchedule] = useState<V2EpisodeSchedule | null>(null); const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null); const [streamUrl, setStreamUrl] = useState<string | null>(null); const [subtitles, setSubtitles] = useState<any[]>([]); const [isStreamLoading, setIsStreamLoading] = useState(false); const [streamError, setStreamError] = useState<string | null>(null); const [intro, setIntro] = useState<{start:number; end:number}>(); const [outro, setOutro] = useState<{start:number; end:number}>(); const [servers, setServers] = useState<any>(null); const [selectedServerName, setSelectedServerName] = useState<string>('hd-1');
  const [epChunkIndex, setEpChunkIndex] = useState(0); const [epViewMode, setEpViewMode] = useState<'capsule' | 'list'>('capsule');
  
  // Tracking & Refs
  const [initialTime, setInitialTime] = useState(0); 
  const [watchedEpNumbers, setWatchedEpNumbers] = useState<number[]>([]);
  const progressRef = useRef(0); 
  const lastSavedRef = useRef(0);
  const playerRef = useRef<AnimePlayerRef>(null); 
  const [hideInterface, setHideInterface] = useState(false);
  const authTokenRef = useRef<string | null>(null);
  const [canSave, setCanSave] = useState(false);
  
  // Manual Seek Debouncer
  const seekSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. CAPTURE AUTH
  useEffect(() => { if(supabase) supabase.auth.getSession().then(({ data }) => { if(data.session) authTokenRef.current = data.session.access_token; }); }, []);

  // 2. BEACON FLUSH
  const flushData = useCallback(() => {
    if (!animeId || !authTokenRef.current) return;
    const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
    const entry = localData[animeId];
    if (!entry) return;

    const payload = {
        user_id: user?.id, anime_id: entry.animeId, episode_id: entry.episodeId,
        episode_number: entry.episodeNumber, progress: entry.progress, last_updated: new Date().toISOString()
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && user) {
        fetch(`${supabaseUrl}/rest/v1/user_continue_watching`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${authTokenRef.current}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify(payload), keepalive: true
        }).catch(err => console.error("Beacon Failed", err));
    }
  }, [animeId, user]);

  // 3. MAIN SAVE LOGIC
  const saveProgress = useCallback(async (force = false) => {
      // Guard: Data must be ready
      if (!currentEpId || !info || !episodes.length) return;

      // Logic: Get Time
      let currentSeconds = progressRef.current;
      if (playerRef.current) { const t = playerRef.current.getCurrentTime(); if (t > 0) currentSeconds = t; }
      const cleanSeconds = Math.floor(currentSeconds);

      // SAFETY: 10s Grace Period + 0-Check
      if (!canSave && !force && cleanSeconds < 10) return;
      if (cleanSeconds === 0 && !force) return;
      if (!force && Math.abs(cleanSeconds - lastSavedRef.current) < 2) return;
      
      const currentEpObj = episodes.find(e => e.episodeId === currentEpId);
      let epNum = 0;
      if (currentEpObj) {
          if (typeof currentEpObj.number === 'number') epNum = currentEpObj.number;
          else if (typeof currentEpObj.number === 'string') epNum = parseFloat(currentEpObj.number);
      }
      if (isNaN(epNum)) epNum = 0;
      const epImage = currentEpObj?.image || info.anime.poster; 
      
      lastSavedRef.current = cleanSeconds;

      // Local Storage
      const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
      localData[animeId] = { animeId, episodeId: currentEpId, episodeNumber: epNum, progress: cleanSeconds, lastUpdated: Date.now() };
      localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));

      // Supabase
      if (user && supabase) {
         try {
             await (supabase.from('user_continue_watching') as any).upsert({
                 user_id: user.id, anime_id: animeId, episode_id: currentEpId,
                 episode_number: epNum, episode_image: epImage,
                 total_episodes: episodes.length, type: info.anime.stats.type,
                 progress: cleanSeconds, last_updated: new Date().toISOString()
             });

             // Completion Check > 80%
             let durationSec = 1440; 
             if (playerRef.current) { const d = playerRef.current.getDuration(); if (d > 0) durationSec = d; }
             else if (info.anime.stats.duration) { const durationVal = parseInt(info.anime.stats.duration.replace(/\D/g, '')) || 24; durationSec = durationVal * 60; }

             if (cleanSeconds > (durationSec * 0.80) || cleanSeconds > 1200) { 
                  await (supabase.from('user_watched_history') as any).upsert({
                      user_id: user.id, anime_id: animeId, episode_number: epNum
                  }, { onConflict: 'user_id, anime_id, episode_number' });
             }
         } catch (err) {}
      }
  }, [animeId, currentEpId, episodes, info, user, canSave]);

  // Manual Seek Handler (Debounce 1s)
  const handleManualSeek = () => {
      setCanSave(true); // Unlock save instantly on manual interaction
      if (seekSaveTimeout.current) clearTimeout(seekSaveTimeout.current);
      seekSaveTimeout.current = setTimeout(() => { saveProgress(true); }, 1000);
  };

  // --- LOGIC 1 & 5: EPISODE LOAD HANDLER ---
  // Triggers whenever currentEpId changes
  useEffect(() => {
      if (!currentEpId || !animeId) return;

      // A. Lock Saving (Prevent 0:00 overwrite)
      setCanSave(false); 

      // B. Load Resume Data for THIS EPISODE
      const fetchResumeAndMark = async () => {
          let resume = 0;
          if (user) {
             const { data } = await (supabase.from('user_continue_watching') as any)
                .select('progress')
                .eq('user_id', user.id).eq('anime_id', animeId).eq('episode_id', currentEpId)
                .maybeSingle();
             if (data && data.progress > 0) resume = data.progress;
          } else {
             const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
             if (localData[animeId] && localData[animeId].episodeId === currentEpId) resume = localData[animeId].progress;
          }

          // C. Trigger Seek
          setInitialTime(resume);
          progressRef.current = resume;

          // D. Unlock Logic
          // If resume is 0 (New Ep), unlock after 2s. If resuming deep (e.g. 15:00), wait 10s to ensure seek happens.
          const unlockDelay = resume > 0 ? 10000 : 2000;
          setTimeout(() => setCanSave(true), unlockDelay);

          // E. [Logic 5] Mark as Watched Immediately
          if (user && episodes.length > 0) {
              const ep = episodes.find(e => e.episodeId === currentEpId);
              if (ep) {
                  let epNum = parseFloat(String(ep.number));
                  if (!isNaN(epNum)) {
                     try {
                        await (supabase!.from('user_watched_history') as any).upsert({
                            user_id: user.id, anime_id: animeId, episode_number: epNum
                        }, { onConflict: 'user_id, anime_id, episode_number' });
                        setWatchedEpNumbers(prev => prev.includes(epNum) ? prev : [...prev, epNum]);
                     } catch(e){}
                  }
              }
          }
      };

      fetchResumeAndMark();
  }, [currentEpId, user, animeId, episodes]);

  // Interval Save
  useEffect(() => {
      const interval = setInterval(() => saveProgress(), 5000); 
      const handleUnload = () => flushData();
      const handleVisibility = () => { if (document.hidden) { saveProgress(true); flushData(); } };
      window.addEventListener('beforeunload', handleUnload); document.addEventListener('visibilitychange', handleVisibility);
      return () => { clearInterval(interval); window.removeEventListener('beforeunload', handleUnload); document.removeEventListener('visibilitychange', handleVisibility); flushData(); };
  }, [saveProgress, flushData]);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    let isMounted = true; const controller = new AbortController();
    const init = async () => {
      if (!info) setIsLoadingInfo(true);
      try {
        if (!animeId) throw new Error("No ID");
        const [v2InfoRaw, v2EpData, scheduleData] = await Promise.all([
             retryOperation(() => AnimeAPI_V2.getAnimeInfo(animeId)), retryOperation(() => AnimeAPI_V2.getEpisodes(animeId)), retryOperation(() => AnimeAPI_V2.getNextEpisodeSchedule(animeId))
        ]);
        if (controller.signal.aborted || !isMounted) return;

        const v2Data = v2InfoRaw as any; 
        const hybridInfo = {
            anime: { ...v2Data.anime.info, moreInfo: v2Data.anime.moreInfo, stats: v2Data.anime.info.stats, trailers: v2Data.anime.info.promotionalVideos || [] },
            recommendations: v2Data.recommendedAnimes || [], related: v2Data.relatedAnimes || [], seasons: v2Data.seasons || [], 
            characters: (v2Data.anime.info.charactersVoiceActors || v2Data.anime.info.characterVoiceActor || []).map((item: any) => ({
                name: item.character.name, image: item.character.poster, role: item.character.cast, 
                voiceActor: { name: item.voiceActor.name, image: item.voiceActor.poster, language: item.voiceActor.cast }
            }))
        };
        // Array Normalize
        hybridInfo.anime.moreInfo.studios = Array.isArray(v2Data.anime.moreInfo.studios) ? v2Data.anime.moreInfo.studios : (v2Data.anime.moreInfo.studios ? [v2Data.anime.moreInfo.studios] : []);
        hybridInfo.anime.moreInfo.producers = Array.isArray(v2Data.anime.moreInfo.producers) ? v2Data.anime.moreInfo.producers : (v2Data.anime.moreInfo.producers ? [v2Data.anime.moreInfo.producers] : []);
        setInfo(hybridInfo); setNextEpSchedule(scheduleData); setEpisodes(v2EpData?.episodes || []);
        
        // Find Target EP
        let targetEpId: string | null = urlEpId || (v2EpData?.episodes[0]?.episodeId) || null;
        
        if (user) {
             const [progressData, historyData] = await Promise.all([
                 (supabase.from('user_continue_watching') as any).select('*').eq('user_id', user.id).eq('anime_id', animeId).order('last_updated', { ascending: false }).limit(1).maybeSingle(),
                 (supabase.from('user_watched_history') as any).select('episode_number').eq('user_id', user.id).eq('anime_id', animeId)
             ]);
             if (historyData.data) setWatchedEpNumbers(historyData.data.map((r: any) => r.episode_number));
             // If no specific URL, default to Last Played
             if (progressData.data && !urlEpId) targetEpId = progressData.data.episode_id;
        } else {
             const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
             if (localData[animeId] && !urlEpId) targetEpId = localData[animeId].episodeId;
        }
        
        // Set ID (The useEffect above will handle resume time fetching)
        setCurrentEpId(targetEpId);

      } catch (err: any) { if (err.name !== 'AbortError') console.error("Init Error:", err); } finally { if (isMounted) setIsLoadingInfo(false); }
    };
    init(); return () => { isMounted = false; controller.abort(); };
  }, [animeId, urlEpId, user]);

  // Stream Load
  useEffect(() => {
    if (!currentEpId) return;
    const newUrl = `/watch/${animeId}?ep=${currentEpId}`; window.history.replaceState(null, '', newUrl);
    setStreamUrl(null); setSubtitles([]); setIsStreamLoading(true); setStreamError(null); progressRef.current = 0; 
    let isMounted = true; const controller = new AbortController();
    const loadStream = async () => {
      try {
        const serverRes = await retryOperation(() => AnimeAPI_V2.getEpisodeServers(currentEpId));
        if (controller.signal.aborted || !isMounted || !serverRes) return;
        setServers(serverRes);
        let activeCat = settings.category; const sData = serverRes as any;
        if (!sData[activeCat]?.length) { activeCat = sData.sub?.length ? 'sub' : (sData.dub?.length ? 'dub' : 'raw'); updateSetting('category', activeCat); }
        const list = sData[activeCat] || []; const targetServer = list.find((s:any) => s.serverName === settings.server) || list[0];
        setSelectedServerName(targetServer.serverName);
        const sourceRes = await retryOperation(() => AnimeAPI_V2.getEpisodeSources(currentEpId, targetServer.serverName, activeCat));
        if (controller.signal.aborted) return;
        if (sourceRes?.sources?.length) {
            const src = sourceRes.sources.find((s: any) => s.type === 'hls') || sourceRes.sources[0];
            setStreamUrl(src.url); if (sourceRes.tracks) setSubtitles(sourceRes.tracks.filter((t: any) => t.kind === 'captions'));
            if(sourceRes.intro) setIntro(sourceRes.intro); if(sourceRes.outro) setOutro(sourceRes.outro);
        } else { setStreamError("No sources found"); }
      } catch (error: any) { if (isMounted) setStreamError("Portal Unstable"); } finally { if (isMounted) setIsStreamLoading(false); }
    };
    loadStream(); return () => { isMounted = false; controller.abort(); };
  }, [currentEpId, settings.category, settings.server]); 

  // Handlers
  const currentEpIndex = useMemo(() => episodes.findIndex(e => e.episodeId === currentEpId), [episodes, currentEpId]);
  const currentEpisode = episodes[currentEpIndex];
  const nextEpisode = currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const episodeChunks = useMemo(() => { const chunks = []; for (let i = 0; i < episodes.length; i += 50) chunks.push(episodes.slice(i, i + 50)); return chunks; }, [episodes]);

  const handleEpisodeClick = (id: string) => { saveProgress(true); if (id === currentEpId) return; setCurrentEpId(id); setInitialTime(0); };
  
  const handlePlayerProgress = (state: any) => { 
      const played = state.playedSeconds ?? state.target?.currentTime ?? state; 
      if (typeof played === 'number') {
          progressRef.current = played;
          // Local Buffer (Instant)
          const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
          if (localData[animeId]) { localData[animeId].progress = Math.floor(played); localStorage.setItem('shadow_continue_watching', JSON.stringify(localData)); }
      }
  };

  if (isLoadingInfo) return <FantasyLoader text="MATERIALIZING..." />;
  if (!info) return <div className="p-20 text-center text-red-500 font-black uppercase">Connection Lost</div>;
  const { anime, recommendations, related, seasons, characters } = info;
  
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 pb-20 pt-24 relative font-sans overflow-x-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar { display: none; } * { scrollbar-width: none; }
        ${hideInterface ? `
           nav, header, footer, .bottom-navigation, div[class*="navbar"], 
           div[class*="header"], div[class*="footer"], .fixed.top-0, .fixed.bottom-0 { 
              opacity: 0 !important; pointer-events: none !important; transition: opacity 0.5s ease-in-out;
           }
        ` : ''}
      `}</style>
      <div className={cn("fixed inset-0 bg-black/90 z-[39] transition-opacity duration-700 pointer-events-none", settings.dimMode ? 'opacity-100' : 'opacity-0')} />

      {/* PLAYER SECTION */}
      <div className="w-full relative z-40 flex justify-center bg-[#050505]">
        <div className="w-full max-w-[1400px] px-4 md:px-8 mt-6">
            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative shadow-red-900/10">
                {isStreamLoading ? <FantasyLoader text="CHANNELING..." /> : 
                 streamError ? <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4"><AlertCircle className="text-red-500 w-12 h-12 shadow-sm" /><span className="font-black text-[10px] uppercase tracking-[0.3em]">Portal Unstable</span><Button variant="outline" className="rounded-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => window.location.reload()}>Retry</Button></div> : 
                 streamUrl ? <AnimePlayer {...({
                    ref: playerRef, url: streamUrl, subtitles, title: currentEpisode?.title || anime.name, intro, outro,
                    autoSkip: settings.autoSkip, startTime: initialTime, 
                    controlsTimeout: 15000, 
                    onProgress: handlePlayerProgress, 
                    onEnded: () => { saveProgress(true); if (settings.autoPlay && nextEpisode) handleEpisodeClick(nextEpisode.episodeId); },
                    onInteract: handleManualSeek, // [LOGIC 2] Instant Save
                    onPause: () => saveProgress(true),
                    onBuffer: () => saveProgress(true),
                    onControlsChange: (visible: boolean) => setHideInterface(!visible),
                    onNext: nextEpisode ? () => handleEpisodeClick(nextEpisode.episodeId) : undefined,
                    initialVolume: settings.volume, initialSpeed: settings.speed, onSettingsChange: (key: string, val: any) => updateSetting(key, val)
                  } as any)} /> : <div className="w-full h-full flex items-center justify-center"><Tv size={48} className="text-zinc-900 opacity-50"/></div>}
            </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="w-full flex justify-center bg-[#0a0a0a] border-b border-white/5 relative z-40 shadow-red-900/10 shadow-lg">
        <div className="w-full max-w-[1400px] px-4 md:px-8 py-3 flex flex-col lg:flex-row gap-4 justify-between items-center">
             <div className="flex-1 min-w-0 flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                  <MarqueeTitle text={currentEpisode?.title || `Episode ${currentEpisode?.number}`} />
                  <div className="hidden sm:block"><NextEpisodeTimer schedule={nextEpSchedule} status={anime.moreInfo.status} /></div>
                  <WatchListButton animeId={anime.id} animeTitle={anime.name} animeImage={anime.poster} currentEp={currentEpisode?.number} />
             </div>
             <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide no-scrollbar">
                  <button disabled={!prevEpisode} onClick={() => prevEpisode && handleEpisodeClick(prevEpisode.episodeId)} className={cn("flex items-center gap-2 px-4 h-8 rounded-full border text-[11px] font-black uppercase tracking-tighter transition-all duration-300 shadow-md shadow-black/40 whitespace-nowrap", prevEpisode ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-red-900/10" : "opacity-10 border-white/5 text-zinc-600")}><SkipBack size={12}/> PREV</button>
                  <button onClick={() => updateSetting('autoSkip', !settings.autoSkip)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><FastForward size={12} className={cn("transition-colors", settings.autoSkip ? "text-red-600 shadow-[0_0_10px_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoSkip ? "text-white" : "text-zinc-500")}>SKIP</span></button>
                  <button onClick={() => updateSetting('autoPlay', !settings.autoPlay)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-tighter transition-all duration-300 hover:scale-105 active:scale-90 group shadow-md shadow-red-900/5 whitespace-nowrap"><Play size={12} className={cn("transition-colors", settings.autoPlay ? "text-red-600 shadow-[0_0_100_red]" : "text-zinc-500")}/><span className={cn("transition-all duration-300", settings.autoPlay ? "text-white" : "text-zinc-500")}>AUTO</span></button>
                  <Button onClick={() => updateSetting('dimMode', !settings.dimMode)} variant="ghost" size="icon" className={cn("rounded-full w-8 h-8 transition-all hover:scale-110 active:rotate-12 shadow-red-900/10 flex-shrink-0", settings.dimMode ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:bg-white/5 shadow-none")}><Lightbulb size={16} /></Button>
                  <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner flex-shrink-0">{(['sub', 'dub', 'raw'] as const).map((cat) => { const isAvailable = (servers?.[cat]?.length || 0) > 0; return (<button key={cat} disabled={!isAvailable} onClick={() => updateSetting('category', cat)} className={cn("px-3 py-0.5 rounded-full text-[10px] font-black uppercase transition-all relative active:scale-75 shadow-sm", settings.category === cat ? "bg-red-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-300", !isAvailable && "opacity-10")}>{cat}{isAvailable && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]" />}</button>);})}</div>
                  <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase transition-all hover:scale-105 active:scale-90 shadow-md shadow-red-900/5 whitespace-nowrap"><ServerIcon size={12}/> Portal <ChevronDown size={12}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-[#050505] border border-white/10 rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] z-[40] min-w-[140px] w-auto h-auto max-h-[200px] p-2"><ScrollArea className="h-auto max-h-[180px]"><div className="flex flex-col gap-1">{servers?.[settings.category]?.map((srv: any, idx: number) => (<DropdownMenuItem key={srv.serverId} onClick={() => updateSetting('server', srv.serverName)} className={cn("cursor-pointer focus:bg-red-600 focus:text-white px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-wider mb-1 transition-all", selectedServerName === srv.serverName ? "bg-red-600 text-white shadow-lg" : "text-zinc-400 hover:text-white hover:bg-white/5")}>Portal {idx + 1}</DropdownMenuItem>))}</div></ScrollArea></DropdownMenuContent></DropdownMenu>
                  {nextEpisode ? (<button onClick={() => handleEpisodeClick(nextEpisode.episodeId)} className="flex items-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[11px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-105 active:scale-90 shadow-md whitespace-nowrap group">NEXT <SkipForward size={12} className="group-hover:translate-x-1 transition-transform" /></button>) : (<button disabled className="flex items-center gap-2 bg-white/5 border border-white/5 text-zinc-600 rounded-full px-5 h-8 text-[11px] font-black uppercase tracking-widest cursor-not-allowed opacity-50 shadow-inner whitespace-nowrap">NEXT <SkipForward size={12} /></button>)}
             </div>
          </div>
      </div>

      <div className="w-full flex justify-center mt-8 px-4 md:px-8">
        <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-12 gap-8">
           
           {/* EPISODES & LEFT SIDEBAR */}
           <div className="xl:col-span-4 h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl shadow-red-900/20 order-2 xl:order-1">
              <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0"><h3 className="font-black text-white flex items-center gap-2 uppercase tracking-tight text-sm font-[Cinzel]"><Layers size={16} className="text-red-600 shadow-sm"/> Episodes <span className="text-[10px] bg-white text-black px-2 rounded-full font-black ml-1 shadow-md">{episodes.length}</span></h3><div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner"><button onClick={() => setEpViewMode('capsule')} className={cn("p-1.5 rounded-full transition-all active:scale-75", epViewMode==='capsule'?'bg-white/10 text-white shadow-lg shadow-red-900/10':'text-zinc-600 shadow-none')}><Grid size={14}/></button><button onClick={() => setEpViewMode('list')} className={cn("p-1.5 rounded-full transition-all active:scale-75", epViewMode==='list'?'bg-white/10 text-white shadow-lg shadow-red-900/10':'text-zinc-600 shadow-none')}><List size={14}/></button></div></div>
              {episodeChunks.length > 1 && (<div className="w-full border-b border-white/5 bg-black/20 flex-shrink-0 h-10 overflow-hidden px-4 shadow-inner"><ScrollArea className="w-full h-full whitespace-nowrap"><div className="flex items-center py-2 gap-2 w-max">{episodeChunks.map((_, idx) => (<button key={idx} onClick={() => setEpChunkIndex(idx)} className={cn("px-4 py-1 text-[10px] font-black rounded-full transition-all active:scale-90 shadow-sm", epChunkIndex === idx ? 'bg-red-600 text-white shadow-red-900/40' : 'bg-white/5 text-zinc-500 hover:text-zinc-300')}>{(idx * 50) + 1}-{Math.min((idx + 1) * 50, episodes.length)}</button>))}</div></ScrollArea></div>)}
              <ScrollArea className="flex-1 p-5 scrollbar-hide shadow-inner">
                  <div className={cn(epViewMode === 'capsule' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1.5')}>
                    {episodeChunks[epChunkIndex]?.map((ep) => { 
                       const isCurrent = ep.episodeId === currentEpId;
                       const isWatched = watchedEpNumbers.includes(Number(ep.number));
                       if (epViewMode === 'capsule') return (
                            <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("h-9 w-12 rounded-full flex items-center justify-center border transition-all text-[11px] font-black relative overflow-hidden active:scale-75 shadow-md group", isCurrent ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-110 z-10" : isWatched ? "border-red-500/60 shadow-[inset_0_0_10px_rgba(220,38,38,0.5)] text-red-100 bg-black" : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-red-500/50 hover:text-white shadow-none")}>
                               {ep.number}
                               {ep.isFiller && <span className="absolute top-1 right-2 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_5px_orange] animate-pulse"/>}
                            </button>
                        );
                       return (
                           <button key={ep.episodeId} onClick={() => handleEpisodeClick(ep.episodeId)} className={cn("flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all group active:translate-x-1 shadow-sm", isCurrent ? 'bg-red-600 text-white shadow-red-900/30' : isWatched ? "border border-red-500/30 shadow-[inset_0_0_15px_rgba(220,38,38,0.2)] bg-black text-red-100" : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300 shadow-none')}>
                               <span className="truncate flex-1 text-left mr-2 tracking-tighter flex items-center gap-2">{ep.number}. {ep.title}</span>
                               {ep.isFiller && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-2 rounded-full font-black uppercase tracking-widest">Filler</span>}
                           </button>
                       );
                    })}
                 </div>
              </ScrollArea>
           </div>

           {/* INFO PANEL */}
           <div className="xl:col-span-8 h-auto xl:h-[650px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20 order-1 xl:order-2">
              <div className="flex-shrink-0 relative p-8 pt-16 flex flex-col sm:flex-row gap-10 bg-gradient-to-b from-red-600/5 to-transparent">
                 {/* ... (Header) ... */}
                 <div className="relative shrink-0 mx-auto sm:mx-0 flex flex-col gap-6 w-full sm:w-auto"><div className="relative p-[3px] rounded-3xl overflow-hidden group/poster shadow-[0_0_40px_rgba(220,38,38,0.2)] mx-auto sm:mx-0 w-fit"><div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,30%,#dc2626_50%,transparent_70%)] animate-[spin_3s_linear_infinite] opacity-60 blur-[1px]" /><img src={anime.poster} className="w-44 h-60 rounded-3xl border border-white/10 object-cover relative z-10 shadow-2xl shadow-black" alt={anime.name} /></div><div className="flex justify-center w-full"><TrailerSection videos={anime.trailers} animeName={anime.name} /></div></div><div className="flex-1 pt-2 text-center sm:text-left z-10 flex flex-col h-full"><h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] leading-none mb-2 tracking-tighter drop-shadow-2xl shadow-black">{anime.name}</h1>{anime.jname && <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-6 opacity-60 drop-shadow-sm">{anime.jname}</p>}<div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start items-center"><Badge className="bg-red-600 text-white rounded-full px-5 py-1.5 text-[10px] font-black uppercase shadow-lg shadow-red-900/50">{anime.stats.quality}</Badge><div className="flex items-center gap-4 text-[11px] text-zinc-400 font-black bg-white/5 border border-white/5 px-5 py-2 rounded-full uppercase tracking-widest shadow-inner shadow-black/20"><span className={cn(anime.moreInfo.status.includes('Airing') ? 'text-green-500 animate-pulse' : 'text-zinc-500')}>{anime.moreInfo.status}</span><span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-600 shadow-red-900/20"/> {anime.stats.duration}</div><span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"/><div className="flex items-center gap-1.5 text-yellow-500 uppercase font-black drop-shadow-sm">MAL: {anime.stats.malScore}</div></div></div><div className="flex flex-wrap gap-2 mt-6 justify-center sm:justify-start">{anime.moreInfo.genres.map((g: string) => (<Link key={g} href={`/search?type=${g}`} className="text-[9px] px-4 py-1.5 bg-white/5 rounded-full text-zinc-500 border border-white/5 hover:text-white hover:bg-red-600 transition-all font-black uppercase tracking-widest active:scale-90 shadow-sm hover:shadow-red-900/20 shadow-red-900/10">{g}</Link>))}</div><div className="mt-auto pt-6 w-full flex justify-center sm:justify-end"><StarRating animeId={animeId} initialRating={anime.stats.rating} /></div></div>
              </div>
              <div className="flex-1 min-h-0 relative px-10 mt-4 overflow-hidden flex flex-col"><h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2 shadow-sm shrink-0"><Info size={12} className="shadow-sm"/> Synopsis</h4><ScrollArea className="flex-1 pr-4 scrollbar-hide shadow-inner shadow-red-900/5"><p className="text-zinc-400 text-sm leading-relaxed pb-8 antialiased font-medium opacity-90 drop-shadow-sm shadow-black">{anime.description}</p></ScrollArea></div>
              <div className="flex-shrink-0 p-6 border-t border-white/5 bg-[#0a0a0a] shadow-inner shadow-red-900/5">
                   <div className="flex w-full items-center gap-3">
                       <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 shrink-0 whitespace-nowrap group hover:border-red-500/30 transition-all shadow-inner shadow-black/20"><span className="text-[10px] font-black uppercase tracking-widest text-red-600">Aired</span><span className="text-[10px] font-bold text-zinc-300">{anime.moreInfo.aired || 'N/A'}</span></div>
                       <div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 shrink-0 whitespace-nowrap group hover:border-red-500/30 transition-all shadow-inner shadow-black/20"><span className="text-[10px] font-black uppercase tracking-widest text-red-600">Premiered</span><span className="text-[10px] font-bold text-zinc-300">{anime.moreInfo.premiered || 'N/A'}</span></div>
                       {anime.moreInfo.studios?.length > 0 && (<DropdownMenu modal={false}><DropdownMenuTrigger asChild><div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 flex-1 min-w-0 cursor-pointer group hover:border-red-600/50 hover:bg-white/10 transition-all active:scale-95 shadow-inner shadow-black/20 justify-between"><div className="flex items-center gap-3 overflow-hidden"><span className="text-[10px] font-black uppercase tracking-widest text-red-600 shrink-0">Studio</span><span className="text-[10px] font-bold text-zinc-300 truncate">{anime.moreInfo.studios[0]}</span></div><ChevronDown size={12} className="text-zinc-500 group-hover:text-white shrink-0"/></div></DropdownMenuTrigger><DropdownMenuContent align="start" className="bg-[#050505] border border-white/10 text-zinc-300 font-bold uppercase text-[9px] w-auto min-w-[160px] h-auto max-h-[200px] rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] p-2 z-[40]"><ScrollArea className="h-auto max-h-[180px] pr-2"><div className="flex flex-col gap-1">{anime.moreInfo.studios.map((s: string) => (<DropdownMenuItem key={s} asChild><Link href={`/view/studios/${s}`} className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-white focus:bg-red-600 focus:text-white transition-all"><div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]" />{s}</Link></DropdownMenuItem>))}</div></ScrollArea></DropdownMenuContent></DropdownMenu>)}
                       {anime.moreInfo.producers?.length > 0 && (<DropdownMenu modal={false}><DropdownMenuTrigger asChild><div className="bg-white/5 p-2 px-5 rounded-full border border-white/5 flex items-center gap-3 flex-1 min-w-0 cursor-pointer group hover:border-red-500/30 transition-all active:scale-95 shadow-inner shadow-black/20 justify-between"><div className="flex items-center gap-3 overflow-hidden"><span className="text-[10px] font-black uppercase tracking-widest text-red-600 shrink-0">Producer</span><span className="text-[10px] font-bold text-zinc-300 truncate">{anime.moreInfo.producers[0]}</span></div><ChevronDown size={12} className="text-zinc-500 group-hover:text-white shrink-0"/></div></DropdownMenuTrigger><DropdownMenuContent align="start" className="bg-[#050505] border border-white/10 text-zinc-300 font-bold uppercase text-[9px] w-auto min-w-[160px] h-auto max-h-[200px] rounded-[24px] shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] p-2 z-[40]"><ScrollArea className="h-auto max-h-[180px] pr-2"><div className="flex flex-col gap-1">{anime.moreInfo.producers.map((p: string) => (<DropdownMenuItem key={p} asChild><Link href={`/view/producers/${p}`} className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-white focus:bg-red-600 focus:text-white transition-all"><div className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-red-500" />{p}</Link></DropdownMenuItem>))}</div></ScrollArea></DropdownMenuContent></DropdownMenu>)}
                   </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* SEASONS & RELATED & COMMENTS (Standard) */}
      {/* ... (Same as before) ... */}
      {seasons.length > 0 && (<div className="flex items-center justify-center mt-12 px-4 md:px-8"><div className="w-full max-w-[1400px]"><div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/seasons shadow-red-900/20 shadow-md"><div className="absolute top-0 left-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/seasons:bg-red-600/10 transition-all duration-1000" /><div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Seasons</h4></div><ScrollArea className="w-full whitespace-nowrap pb-6 scrollbar-hide"><div className="flex gap-6 w-max">{seasons.map((season: any) => (<Link key={season.id} href={`/watch/${season.id}`} className={cn("group/item flex items-center gap-5 p-2 pr-10 rounded-full border hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[280px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md", season.isCurrent ? "bg-red-600/10 border-red-600" : "bg-white/5 border-white/5")}><div className="relative shrink-0 overflow-hidden rounded-full w-14 h-14 border-2 border-white/5 group-hover/item:border-red-600 shadow-md shadow-black/50"><img src={season.poster} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125" alt={season.title} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[11px] font-black text-zinc-300 group-hover:text-white truncate w-[160px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{season.title}</span><span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">{season.isCurrent ? 'NOW PLAYING' : 'VIEW ARCHIVE'}</span></div></Link>))}</div><ScrollBar orientation="horizontal" className="hidden" /></ScrollArea></div></div></div>)}
      {(related.length > 0) && (<div className="flex items-center justify-center mt-12 px-4 md:px-8"><div className="w-full max-w-[1400px]"><div className="bg-[#0a0a0a] border border-white/10 shadow-3xl rounded-[50px] p-12 overflow-hidden relative group/related shadow-red-900/20 shadow-md"><div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[150px] pointer-events-none group-hover/related:bg-red-600/10 transition-all duration-1000" /><div className="flex items-center gap-4 mb-8"><span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shadow-[0_0_15px_red] shadow-red-900/10" /><h4 className="text-[12px] text-white font-black uppercase tracking-[0.5em] font-[Cinzel] opacity-80 shadow-red-900/10 shadow-sm">Related Domains</h4></div><ScrollArea className="w-full whitespace-nowrap pb-6 scrollbar-hide"><div className="flex gap-6 w-max">{related.map((rel: any, idx: number) => (<Link key={`${rel.id}-${idx}`} href={`/watch/${rel.id}`} className="group/item flex items-center gap-5 p-2 pr-10 rounded-full bg-white/5 border border-white/5 hover:border-red-600/40 hover:bg-red-600/10 transition-all duration-500 min-w-[320px] active:scale-95 shadow-inner shadow-red-900/5 shadow-md"><div className="relative shrink-0 overflow-hidden rounded-full w-16 h-16 border-2 border-white/5 group-hover/item:border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-500 shadow-black/50 shadow-md"><img src={rel.poster || rel.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-125 shadow-md shadow-red-900/5" alt={rel.name} /></div><div className="flex flex-col overflow-hidden gap-1"><span className="text-[13px] font-black text-zinc-300 group-hover:text-white truncate w-[180px] uppercase tracking-tighter transition-colors shadow-black drop-shadow-md">{rel.name || rel.title}</span><div className="flex items-center gap-3"><Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-600 rounded-md group-hover/item:border-red-500/50 group-hover/item:text-red-500 uppercase tracking-widest shadow-sm">{rel.type}</Badge><span className="text-[9px] text-zinc-700 font-black uppercase group-hover/item:text-zinc-400 shadow-sm">{rel.episodes?.sub || '?'} EPS</span></div></div></Link>))}</div><ScrollBar orientation="horizontal" className="hidden" /></ScrollArea></div></div></div>)}
      <div className="w-full flex justify-center my-12 px-4 md:px-8"><div className="w-full max-w-[1400px]" onKeyDown={(e) => e.stopPropagation()}><ShadowComments key={user?.id || 'guest'} episodeId={currentEpId || "general"} /></div></div>

      {/* CHARACTERS (Updated with GLOW for Main) */}
      <div className="w-full flex justify-center mt-12 px-4 md:px-8 pb-12">
        <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
             <div className="xl:col-span-4 h-[750px] flex flex-col bg-[#0a0a0a] rounded-[50px] border border-white/5 shadow-2xl overflow-hidden relative group/paths shadow-red-900/20 shadow-md">
                 <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 relative z-10 shadow-red-900/5 shadow-md"><Heart size={20} className="text-red-600 fill-red-600 animate-pulse shadow-red-600/30 shadow-md" /><h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Recommended</h3></div>
                 <div className="flex-1 overflow-hidden p-6 relative z-10 shadow-inner shadow-red-900/5"><ScrollArea className="h-full pr-4 scrollbar-hide"><div className="space-y-4">{recommendations.map((rec: any, idx: number) => (<Link key={`${rec.id}-${idx}`} href={`/watch/${rec.id}`} className="flex gap-5 p-4 rounded-[32px] hover:bg-red-600/5 group transition-all duration-500 active:scale-95 border border-transparent hover:border-red-600/20 shadow-inner shadow-red-900/5"><img src={rec.poster || rec.image} className="w-16 h-24 object-cover rounded-2xl shadow-3xl group-hover:rotate-1 transition-all duration-500 shadow-black shadow-md" alt={rec.name} /><div className="flex-1 py-1 flex flex-col justify-center"><h4 className="text-[12px] font-black text-zinc-500 group-hover:text-red-500 line-clamp-2 transition-all uppercase tracking-tight leading-tight mb-2 shadow-black drop-shadow-md">{rec.name || rec.title}</h4><div className="flex items-center gap-3"><span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] group-hover:text-zinc-500 transition-colors shadow-sm">{rec.type}</span><span className="w-1 h-1 bg-zinc-900 rounded-full shadow-sm"/><span className="text-[9px] text-zinc-800 font-black uppercase group-hover:text-red-900 transition-colors shadow-sm">{rec.episodes?.sub || '?'} EPS</span></div></div></Link>))}</div></ScrollArea></div>
             </div>
             
             {/* [FIX] MAIN CHARACTER GLOW APPLIED */}
             <div className="xl:col-span-8 h-[750px] bg-[#0a0a0a] rounded-[50px] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative shadow-red-900/20 shadow-md">
                 <div className="p-8 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center gap-4 shadow-red-900/5 shadow-md">
                    <User size={20} className="text-red-600 shadow-red-600/30 shadow-md" />
                    <h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase shadow-sm shadow-black">Manifested Bloodlines</h3>
                  </div>
                  <ScrollArea className="flex-1 p-10 scrollbar-hide shadow-inner shadow-red-900/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                          {characters.length > 0 ? characters.map((char: any, i: number) => (
                             <div key={i} className={cn("flex bg-white/5 border rounded-[30px] p-4 transition-all duration-500 group shadow-lg", char.role === 'Main' ? "border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.25)] bg-red-600/5" : "border-white/5 hover:border-white/10 hover:shadow-red-900/10")}>
                                <div className="flex items-center gap-4 flex-1">
                                    <img src={char.image || '/images/non-non.png'} className={cn("w-14 h-14 rounded-full object-cover border transition-colors shadow-lg", char.role === 'Main' ? "border-red-500 shadow-red-900/60" : "border-white/10 group-hover:border-red-500/50")} alt={char.name} onError={(e) => (e.currentTarget.src = '/images/non-non.png')} />
                                    <div className="flex flex-col">
                                        <span className={cn("text-[11px] font-black uppercase tracking-tighter line-clamp-1", char.role === 'Main' ? "text-red-400 text-shadow-sm" : "text-zinc-200")}>{char.name}</span>
                                        <Badge variant="outline" className={cn("w-fit mt-1 text-[8px] font-bold px-2 py-0 h-4 rounded-full transition-colors", char.role === 'Main' ? "border-red-600 text-red-500 bg-red-600/10" : "border-zinc-800 text-zinc-500 group-hover:text-red-500 group-hover:border-red-500/30")}>{char.role}</Badge>
                                    </div>
                                </div>
                                <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />
                                <div className="flex items-center gap-4 flex-1 justify-end text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter line-clamp-1 group-hover:text-white transition-colors">{char.voiceActor.name}</span>
                                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{char.voiceActor.language}</span>
                                    </div>
                                    <img src={char.voiceActor.image || '/images/non-non.png'} className="w-12 h-12 rounded-full object-cover border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-md" alt={char.voiceActor.name} onError={(e) => (e.currentTarget.src = '/images/non-non.png')} />
                                </div>
                             </div>
                          )) : (
                              <div className="col-span-full flex flex-col items-center justify-center opacity-50 py-20 h-full"><img src="/images/non-non.gif" className="w-72 h-32 opacity-80 mb-4 grayscale" alt="No Data" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">No Bloodlines Detected</p></div>
                          )}
                      </div>
                  </ScrollArea>
             </div>
        </div>
      </div>
      
      <div className="w-full h-20 border-t border-white/5 mt-20 flex items-center justify-center text-zinc-600 text-xs font-black uppercase tracking-widest"><div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-800 rounded-full" /> Shadow Garden 2025</div></div>
    </div>
  );
}

export default function WatchPage() {
    return <Suspense fallback={<FantasyLoader />}><WatchContent /></Suspense>;
}