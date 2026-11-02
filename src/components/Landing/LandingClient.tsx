"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Play, Film, Tv, Flame, BookOpen, Compass, 
  MessageCircle, ShieldCheck, Download, ArrowRight, 
  ChevronRight, Zap, Globe, Layers, Smartphone, Users,
  Star, Clock, Crown, Shield, Activity, Share2, Eye,
  CheckCircle2
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AnimeService, UserAPI, UniversalAnimeBase } from '@/lib/api';
import { CURATED_ENGLISH_DRAMAS, CURATED_HINDI_DRAMAS } from '@/lib/shorts/curated';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/Auth/AuthModal';
import SearchBar from '@/components/Anime/SearchBar';
import AdsterraNativeBanner from '@/components/Ads/AdsterraNativeBanner';
import CuteShareBar from '@/components/Home/CuteShareBar';
import dynamic from 'next/dynamic';
import { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';
import { Capacitor } from '@capacitor/core';
import { formatAnimeTitle, slugifyTitle, cn } from '@/lib/utils';

// Dynamic 3D WebGL Portal with safe fallback
const ShadowGardenPortal = dynamic(
  () =>
    import('@/components/Portal/ShadowGardenPortal').catch((err) => {
      console.warn('[Landing] Chunk load failed for ShadowGardenPortal, self-healing:', err);
      return { default: () => null };
    }),
  { 
    ssr: false, 
    loading: () => null 
  }
);

// High-resolution thematic backgrounds
const HERO_BG_IMAGES = [
  "/images/index/bg-1.jpg", 
  "/images/index/bg-2.jpg", 
  "/images/index/bg-3.jpg",
  "/images/index/bg-4.jpg", 
  "/images/index/bg-5.jpg"
];

// Error Boundary for 3D Portal
interface PortalErrorBoundaryProps {
  children: React.ReactNode;
  onError?: () => void;
}

interface PortalErrorBoundaryState {
  hasError: boolean;
}

class PortalErrorBoundary extends React.Component<PortalErrorBoundaryProps, PortalErrorBoundaryState> {
  constructor(props: PortalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PortalErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("Portal 3D scene caught by boundary, falling back gracefully:", error, errorInfo);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function LandingClient() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  // Adaptive UI state: returning/skip users get instant UI, first-time users see intro
  const [showLandingUI, setShowLandingUI] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasAudio = localStorage.getItem('shadow_audio_permitted') === 'true' || localStorage.getItem('guild_audio_permit') === 'true';
      const isSkip = localStorage.getItem('anim_never_ask') === 'true' || localStorage.getItem('anim_preference') === 'skip' || localStorage.getItem('sg_portal_seen') === 'true';
      return hasAudio && isSkip;
    }
    return false;
  });

  const [triggerEntry, setTriggerEntry] = useState(false);
  const [bgImage, setBgImage] = useState(HERO_BG_IMAGES[0]);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Real dynamic data
  const [trending, setTrending] = useState<UniversalAnimeBase[]>([]);
  const [stats, setStats] = useState({ users: 28450, titles: 15400, shorts: 35000 });
  const [socialPosts, setSocialPosts] = useState<any[]>([]);

  // Parallax scroll effects
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 450], [1, 0.15]);
  const heroScale = useTransform(scrollY, [0, 450], [1, 1.05]);

  // Curated Shorts for showcase
  const featuredShorts = useMemo(() => {
    return [
      ...CURATED_ENGLISH_DRAMAS.slice(0, 2),
      ...CURATED_HINDI_DRAMAS.slice(0, 2)
    ];
  }, []);

  // When 3D portal intro finishes or scene is ready, reveal landing UI smoothly
  const handleSceneReady = useCallback(() => {
    setShowLandingUI(true);
  }, []);

  useEffect(() => {
    // 1. Random Hero Backdrop
    const randomIdx = Math.floor(Math.random() * HERO_BG_IMAGES.length);
    setBgImage(HERO_BG_IMAGES[randomIdx]);

    // 2. Safety timer: reveal landing UI after 5s if user hasn't seen it yet
    const fallbackTimer = setTimeout(() => {
      setShowLandingUI(true);
    }, 5000);

    // 3. PWA Handler
    const pwaHandler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', pwaHandler);

    // 4. Auth & Dynamic Data Fetching
    const init = async () => {
      const isAndroidAPK = typeof window !== 'undefined' && (
        Capacitor.isNativePlatform() || 
        /wv|Android.*Version\/[0-9.]+/i.test(navigator.userAgent || '') ||
        (window.matchMedia('(display-mode: standalone)').matches && /Android/i.test(navigator.userAgent || '')) ||
        typeof (window as any).AndroidInterface !== 'undefined' ||
        document.referrer.includes('android-app://')
      );
      const isNativeContainer = isAndroidAPK || (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches);
      const hasSeenPortal = typeof window !== 'undefined' && localStorage.getItem('shadow_apk_intro_completed') === 'true';

      if (isNativeContainer && hasSeenPortal) {
        router.replace('/home');
        return;
      }

      try {
        const user = await UserAPI.getCurrentUser();
        if (user) {
          if (typeof window !== 'undefined') localStorage.setItem('shadow_auth_hint', 'true');
          router.replace('/home');
          return;
        } else {
          if (typeof window !== 'undefined') localStorage.removeItem('shadow_auth_hint');
        }
      } catch (authErr) {
        console.warn("Auth initialization check failed:", authErr);
      } finally {
        setIsCheckingAuth(false);
      }

      // Fetch Trending Airing Anime
      try {
        const data = await AnimeService.getTopAiring(1);
        if (data && data.length > 0) {
          setTrending(data.slice(0, 12));
        }
      } catch (err) {
        console.error("Failed to load trending:", err);
      }

      // Fetch Community Stats & Posts
      try {
        const [profileRes, postRes, postsData] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('social_posts').select('*', { count: 'exact', head: true }),
          supabase
            .from('social_posts')
            .select('id, content, created_at, profiles:user_id(username, avatar_url, role), social_likes(count), social_comments(count)')
            .order('created_at', { ascending: false })
            .limit(4)
        ]);

        if (profileRes.count) {
          setStats(prev => ({ ...prev, users: profileRes.count || prev.users }));
        }

        if (postsData.data && postsData.data.length > 0) {
          setSocialPosts(postsData.data);
        } else {
          // Clean fallback community items
          setSocialPosts([
            {
              id: '1',
              content: 'The 1080p stream on Kagemi for Solo Leveling Season 2 is astonishing. Zero buffer delay and the Japanese audio is crystal clear.',
              created_at: new Date(Date.now() - 3600000).toISOString(),
              likes_count: 154,
              comments_count: 32,
              profiles: { username: 'ShadowMonarch', avatar_url: '/images/index/bg-1.jpg', role: 'ADMIN' }
            },
            {
              id: '2',
              content: 'Just discovered the vertical shorts catalog! 1-minute episodes of billionaire drama with English audio is my new addiction.',
              created_at: new Date(Date.now() - 7200000).toISOString(),
              likes_count: 118,
              comments_count: 24,
              profiles: { username: 'Valkyrie', avatar_url: '/images/index/bg-2.jpg', role: 'MEMBER' }
            },
            {
              id: '3',
              content: 'The dual subtitle engine is top notch. Smooth sync and great font rendering across all donghua series.',
              created_at: new Date(Date.now() - 14400000).toISOString(),
              likes_count: 89,
              comments_count: 19,
              profiles: { username: 'KitsuneSage', avatar_url: '/images/index/bg-3.jpg', role: 'MODERATOR' }
            },
            {
              id: '4',
              content: 'Grimoire watchlist synced all 48 shows from my AniList seamlessly. Best platform update yet.',
              created_at: new Date(Date.now() - 21600000).toISOString(),
              likes_count: 142,
              comments_count: 27,
              profiles: { username: 'AuraKnight', avatar_url: '/images/index/bg-4.jpg', role: 'MEMBER' }
            }
          ]);
        }
      } catch (e) {
        console.warn("Community feed error:", e);
      }
    };

    init();

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', pwaHandler);
    };
  }, [router]);

  // Audio & Interaction SFX
  const initializeAudio = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        ctx.resume();
      }
    } catch (e) {
      console.warn("Audio Context init failed:", e);
    }
    localStorage.setItem('shadow_audio_permitted', 'true');
    localStorage.setItem('guild_audio_permit', 'true');
  }, []);

  const handlePortalComplete = useCallback(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('sg_portal_seen', 'true');
      localStorage.setItem('shadow_apk_intro_completed', 'true');
    }
    router.push('/home'); 
  }, [router]);

  /**
   * Triggers the full 3D interactive transmigration sequence:
   * 1. Fades out the landing page UI overlay
   * 2. Sets triggerEntry=true to launch performEntrySequence() in ShadowGardenPortal
   * 3. Plays Drop -> Crouch -> Stand -> Confusion -> Walk -> Dimension Alert BracePopup -> Push -> Suction -> Wormhole Tunnel -> Arrival -> /home
   */
  const handleEnterClick = useCallback((e?: React.MouseEvent) => { 
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    initializeAudio();

    // Check if user has explicitly chosen 'always skip'
    const isAlwaysSkip = typeof window !== 'undefined' && localStorage.getItem('anim_never_ask') === 'true';
    if (isAlwaysSkip) {
      handlePortalComplete();
      return;
    }

    // Smoothly dissolve the landing UI to unveil the full-screen 3D Portal sequence
    setShowLandingUI(false);
    setTriggerEntry(true); 
  }, [initializeAudio, handlePortalComplete]);

  // Extended safety timeout during 3D sequence (allowing full drop -> brace popup -> tunnel walkthrough)
  useEffect(() => {
    if (triggerEntry) {
      const timer = setTimeout(() => {
        handlePortalComplete();
      }, 35000); // 35s safety net
      return () => clearTimeout(timer);
    }
  }, [triggerEntry, handlePortalComplete]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#050508]" />;
  }

  return (
    <main className="relative min-h-screen w-full bg-[#050508] text-white selection:bg-purple-900/40 selection:text-white overflow-x-hidden">
      
      {/* 3D PORTAL ENGINE (Background ambience during browsing, Full-Screen 100% focus during entry sequence) */}
      <PortalErrorBoundary onError={() => {
        setShowLandingUI(true);
        if (triggerEntry) handlePortalComplete();
      }}>
        <div 
          className={cn(
            "fixed inset-0 transition-all duration-1000",
            triggerEntry 
              ? "z-[99990] opacity-100 pointer-events-auto bg-black" 
              : "z-0 opacity-40 pointer-events-auto mix-blend-screen"
          )}
        >
          <Suspense fallback={null}>
            <ShadowGardenPortal 
              startTransition={triggerEntry}
              onComplete={handlePortalComplete}
              onSceneReady={handleSceneReady}
            />
          </Suspense>
        </div>
      </PortalErrorBoundary>

      {/* SKIP ANIMATION CONTROLLER (Prominently available whenever entry transition is running) */}
      {triggerEntry && (
        <div className="fixed top-6 right-6 z-[100000] pointer-events-auto">
          <button
            onClick={() => handlePortalComplete()}
            className="px-5 py-2.5 rounded-full bg-black/85 hover:bg-black text-white border border-purple-500/50 hover:border-purple-400 backdrop-blur-xl text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Skip To Home</span>
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      )}

      {/* LANDING PAGE INTERFACE (Fades in on mount/intro complete, dissolves when portal entry begins) */}
      <AnimatePresence mode="wait">
        {showLandingUI && !triggerEntry && (
          <motion.div
            key="landing-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 w-full"
          >
            {/* FIXED GLASSMORPHIC LANDING NAVBAR (Strict w-full px-2 sm:px-4 md:px-6 alignment) */}
            <header className="fixed top-0 inset-x-0 z-50 w-full px-2 sm:px-4 md:px-6 py-3 transition-all duration-300">
              <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                {/* Left: Brand Identity */}
                <Link href="/home" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                    <Shield className="w-4 h-4 fill-purple-500/30 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold tracking-widest text-sm text-white font-lemon leading-none">
                      KAGEMI
                    </span>
                    <span className="text-[8.5px] font-mono tracking-widest text-purple-300/80 uppercase">
                      Streaming Platform
                    </span>
                  </div>
                </Link>

                {/* Center: Realm Links (Desktop) */}
                <nav className="hidden md:flex items-center gap-1 text-xs font-semibold tracking-wide text-zinc-300">
                  <Link 
                    href="/home" 
                    className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-400" />
                    <span>Anime</span>
                  </Link>
                  <Link 
                    href="/donghua" 
                    className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Donghua</span>
                  </Link>
                  <Link 
                    href="/cinema" 
                    className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cinema</span>
                  </Link>
                  <Link 
                    href="/shorts" 
                    className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Shorts</span>
                  </Link>
                  <Link 
                    href="/manga" 
                    className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mangvels</span>
                  </Link>
                  <Link 
                    href="/social" 
                    className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>OtakuVerse</span>
                  </Link>
                </nav>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      initializeAudio();
                      setShowAuth(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all active:scale-95"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleEnterClick}
                    className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Enter App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </header>

            {/* MAIN CONTENT WRAPPER */}
            <div className="relative pt-20 sm:pt-24 space-y-16 sm:space-y-24">
              
              {/* 1. CINEMATIC HERO SECTION */}
              <section className="relative w-full px-2 sm:px-4 md:px-6 min-h-[85vh] flex flex-col justify-center items-center text-center">
                {/* Subtle Dynamic Ambient Glow */}
                <motion.div 
                  style={{ opacity: heroOpacity, scale: heroScale }}
                  className="absolute inset-0 pointer-events-none z-0"
                >
                  <img 
                    src={bgImage} 
                    alt="Atmospheric Backdrop" 
                    className="w-full h-full object-cover opacity-15 filter blur-sm" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-[#050508]/85 to-[#050508]" />
                </motion.div>

                <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                  {/* Top Typographic Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/15 backdrop-blur-md mb-6">
                    <span className="text-[11px] font-mono font-bold tracking-widest text-purple-300 uppercase">
                      Next-Gen High-Fidelity Streaming
                    </span>
                  </div>

                  {/* Headline with Luminous Gradient */}
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4 leading-[1.1] font-gradvis">
                    Where Stories <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-300 to-purple-400">Ascend.</span>
                  </h1>

                  {/* Value Proposition */}
                  <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-normal leading-relaxed max-w-2xl mb-8">
                    Stream 15,000+ anime & donghua episodes in pristine 1080p 60fps, alongside 35,000+ unlocked vertical mini-dramas and manga. Zero interruptions, zero lag.
                  </p>

                  {/* Instant Search Bar */}
                  <div className="w-full max-w-xl mx-auto mb-6">
                    <div className="p-1 rounded-2xl bg-gradient-to-r from-purple-600/30 via-white/10 to-sky-600/30 border border-white/15 shadow-2xl backdrop-blur-xl">
                      <SearchBar />
                    </div>
                    {/* Quick Suggestion Chips */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3 text-[11px] text-zinc-400">
                      <span className="text-zinc-500 font-medium">Trending:</span>
                      {['Solo Leveling', 'Bleach TYBW', 'Demon Slayer', 'Frieren', 'Omniscient Reader'].map((name) => (
                        <Link
                          key={name}
                          href={`/search?q=${encodeURIComponent(name)}`}
                          className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/15 hover:text-white transition-colors"
                        >
                          {name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleEnterClick}
                      className="w-full sm:w-auto px-7 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Watching Free</span>
                    </button>

                    <Link href="/explore" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 text-sm font-medium flex items-center justify-center gap-2 backdrop-blur-md transition-all active:scale-95">
                        <Compass className="w-4 h-4 text-zinc-300" />
                        <span>Explore Catalog</span>
                      </button>
                    </Link>

                    {installPrompt && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full sm:w-auto px-5 py-3 rounded-full bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install App</span>
                      </button>
                    )}
                  </div>

                  {/* Platform Metrics Row (Strictly aligned, typographic counts, NO breathing dots) */}
                  <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10 text-center">
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-white">15,000+</div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Anime & Donghua</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-purple-300">35,000+</div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Vertical Shorts</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-sky-300">1080p 60fps</div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Ultra HD Quality</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">Zero Lag</div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Global Edge CDN</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. EXPLORE REALMS (4 Multi-Universe Pillars) */}
              <section className="w-full px-2 sm:px-4 md:px-6">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold mb-1">
                      Unified Ecosystem
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-gradvis">
                      EXPLORE ALL REALMS
                    </h2>
                  </div>
                  <Link href="/explore" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Realm 1: Anime & Donghua */}
                  <Link 
                    href="/home" 
                    className="group relative p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-all" />
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                        <Tv className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
                        Anime & Donghua
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Broadcast simultaneously from Japan & China. High-definition Sub & Dub episodes updated daily.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 pt-6">
                      <span>Browse Series</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  {/* Realm 2: Shorts & Mini-Dramas */}
                  <Link 
                    href="/shorts" 
                    className="group relative p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/10 hover:border-rose-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl group-hover:bg-rose-600/20 transition-all" />
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-105 transition-transform">
                        <Flame className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-rose-300 transition-colors">
                        Vertical Mini-Dramas
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Fast-paced 1-minute episodes. Billionaire, CEO, Werewolf, and Martial Arts stories with English & Hindi audio.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 pt-6">
                      <span>Watch Shorts</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  {/* Realm 3: Cinema & Movies */}
                  <Link 
                    href="/cinema" 
                    className="group relative p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/10 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-all" />
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                        <Film className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-amber-300 transition-colors">
                        Cinema & Theatrical
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Feature-length blockbuster anime movies, Asian theatricals, and Hollywood releases in full theatrical master quality.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 pt-6">
                      <span>Stream Cinema</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  {/* Realm 4: Mangvels */}
                  <Link 
                    href="/manga" 
                    className="group relative p-6 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all" />
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                        Mangvels Reader
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        High-resolution digital reader for manga, manhwa, and translated web novels with vertical infinite scroll.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 pt-6">
                      <span>Open Reader</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </section>

              {/* 3. TOP AIRING ANIME SPOTLIGHT (Real-time Broadcasts) */}
              {trending.length > 0 && (
                <section className="w-full px-2 sm:px-4 md:px-6">
                  <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6 text-purple-400" />
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-gradvis">
                          TOP AIRING BROADCASTS
                        </h2>
                        <p className="text-xs text-zinc-400">Most streamed releases across Kagemi this week</p>
                      </div>
                    </div>
                    <Link href="/home" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                      <span>Browse All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {trending.map((anime, idx) => {
                      const titleStr = formatAnimeTitle(anime.title, anime.id);
                      const slug = slugifyTitle(titleStr);
                      const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;

                      return (
                        <Link
                          key={anime.id || idx}
                          href={`/watch/${routeId}`}
                          className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 select-none"
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                            <img 
                              src={anime.poster} 
                              alt={titleStr} 
                              loading="lazy" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            
                            {/* Metallic Rank Counter Badge */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white shadow">
                              #{idx + 1}
                            </div>

                            {/* Play Action Hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 ml-0.5 fill-current" />
                              </div>
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                              {titleStr}
                            </h3>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 font-mono">
                              <span>1080p HD</span>
                              <span className="text-purple-400">Sub & Dub</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 4. VERTICAL SHORTS SHOWCASE */}
              <section className="w-full px-2 sm:px-4 md:px-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-950/20 via-zinc-950 to-purple-950/20 border border-white/10 shadow-2xl">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-mono uppercase tracking-wider mb-2">
                        <Flame className="w-3.5 h-3.5" />
                        <span>35,000+ Unlocked Titles</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-gradvis">
                        VERTICAL MINI-DRAMAS
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        Reels & TikTok format. High-octane micro-series designed for immersive vertical playback.
                      </p>
                    </div>

                    <Link href="/shorts">
                      <button className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all active:scale-95">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Explore Shorts Feed</span>
                      </button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {featuredShorts.map((short) => (
                      <Link
                        key={short.id}
                        href={`/shorts/watch?id=${encodeURIComponent(short.id)}&ep=1`}
                        className="group relative flex flex-col rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-rose-500/50 transition-all duration-300 shadow-xl"
                      >
                        <div className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-900">
                          <img 
                            src={short.cover} 
                            alt={short.title} 
                            loading="lazy" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                          
                          {/* Language Badge */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-medium text-rose-300">
                            {short.language}
                          </div>

                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300">
                            {short.totalEpisodes} eps
                          </div>

                          <div className="absolute bottom-2 inset-x-2 text-center">
                            <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-rose-300 transition-colors">
                              {short.title}
                            </h4>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              {/* 5. ARCHITECTURAL SUPERPOWERS (Minimalist, No Heavy AI-Slop Boxes) */}
              <section className="w-full px-2 sm:px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold mb-1">
                    Engineering Advantage
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-gradvis">
                    BUILT FOR SUPREME PERFORMANCE
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                    Next.js 15 Turbo architecture combined with distributed edge caching ensures zero stalls and instant start.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/10 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Zero Buffer Delivery</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Video fragments are precached across redundant edge servers for instant start times and zero playback pauses.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/10 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Multi-Track Dual Audio</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Switch dynamically between original Japanese, English Dub, and Hindi Dub with perfectly matched synchronized subtitles.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/10 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Cloud Watchlist Sync</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Bidirectional AniList & MyAnimeList integration. Resume playback from any phone, tablet, or desktop instantly.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/10 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Native PWA & Mobile APK</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Installable directly onto Android and iOS home screens with full offline audio caching and background audio support.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/10 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Synchronized Watch Parties</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Create private rooms to watch episodes together in exact sync with low-latency live community chat.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/10 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Private & Frictionless</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        No mandatory credit cards or invasive tracking. Guest access is fully supported with encrypted user sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. OTAKUVERSE COMMUNITY BROADCAST */}
              <section className="w-full px-2 sm:px-4 md:px-6">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold mb-1">
                      Live Community Intel
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-gradvis">
                      OTAKUVERSE DISCUSSIONS
                    </h2>
                  </div>
                  <Link href="/social" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                    <span>Join Feed</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {socialPosts.map((post) => {
                    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                    const likes = post.social_likes?.[0]?.count ?? post.likes_count ?? 0;
                    const comments = post.social_comments?.[0]?.count ?? post.comments_count ?? 0;
                    const formattedDate = post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent';

                    return (
                      <div 
                        key={post.id} 
                        className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <img 
                              src={profile?.avatar_url || '/images/index/bg-1.jpg'} 
                              alt={profile?.username || 'Member'} 
                              className="w-9 h-9 rounded-full object-cover border border-purple-500/30"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/index/bg-1.jpg'; }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white font-mono">{profile?.username || 'Community Agent'}</span>
                                {profile?.role && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-mono">
                              {profile.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{formattedDate}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 mb-4">
                      {post.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1.5 hover:text-purple-300 transition-colors">
                      <Flame className="w-3.5 h-3.5 text-purple-400" /> {likes} Likes
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-sky-300 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 text-sky-400" /> {comments} Comments
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. CONVERSION CALL TO ACTION BANNER */}
        <section className="w-full px-2 sm:px-4 md:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900/40 via-zinc-950 to-sky-900/40 border border-white/15 p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-2xl">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 font-gradvis">
              START YOUR JOURNEY TODAY
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mb-6 leading-relaxed">
              Join thousands of viewers enjoying buffer-free anime, donghua, cinema, and short dramas without subscription walls.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleEnterClick}
                className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Enter Kagemi Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link href="/explore">
                <button className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 text-sm font-medium transition-all active:scale-95">
                  Browse Catalog
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* CUTE SHARE BAR */}
        <div className="w-full px-2 sm:px-4 md:px-6">
          <CuteShareBar />
        </div>

        {/* SPONSORED BANNER (Strictly aligned) */}
        <div className="w-full px-2 sm:px-4 md:px-6">
          <AdsterraNativeBanner location="general" format="native" />
        </div>

        {/* FOOTER */}
        <footer className="w-full px-2 sm:px-4 md:px-6 py-12 border-t border-white/10 text-center bg-black/40">
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="font-extrabold tracking-widest text-base text-white font-lemon">
                KAGEMI
              </span>
            </div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-6">
              The Sovereign Anime & Cinema Portal • Est. 2026
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-400 font-medium uppercase tracking-wider mb-8">
              <Link href="#" className="hover:text-purple-400 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-purple-400 transition-colors">DMCA Notice</Link>
              <a href="https://discord.gg/kagemi" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Discord</a>
              <a href="https://github.com/code-acezero/shadow-garden" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">GitHub</a>
            </div>
            <p className="text-[11px] text-zinc-600 max-w-xl leading-relaxed">
              Kagemi does not store any files on its servers. All contents are provided by non-affiliated third parties.
            </p>
          </div>
        </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTH MODAL */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onAuthSuccess={() => handleEnterClick()} 
      />
    </main>
  );
}
