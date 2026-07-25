"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, Zap, ShieldCheck, Smartphone, 
  Ghost, Terminal, Globe, Crown, Sword, 
  MessageCircle, Flame, Users, Scroll as ScrollIcon, Activity
} from 'lucide-react';

// ✅ FIXED IMPORTS
import { Button } from '@/components/ui/button';
import { UserAPI, AnimeService, UniversalAnimeBase } from '@/lib/api'; 
import { supabase } from '@/lib/supabase'; // ✅ CRITICAL: Import Singleton directly
import AuthModal from '@/components/Auth/AuthModal';
import SearchBar from '@/components/Anime/SearchBar';
import ShadowGardenPortal from '@/components/Portal/ShadowGardenPortal';
import { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';


// --- ASSETS ---
const WAIFU_BG_LIST = [
  "/images/index/bg-1.jpg", "/images/index/bg-2.jpg", "/images/index/bg-3.jpg",
  "/images/index/bg-4.jpg", "/images/index/bg-5.jpg", "/images/index/bg-6.png",
  "/images/index/bg-7.png", "/images/index/bg-8.png", "/images/index/bg-9.png", "/images/index/bg-10.png"
];

const FEATURE_GIF = "/images/index/feature-main.gif";
const FOOTER_GIF = "/images/footer.gif";

const FLOATING_STICKERS = [
  { src: "/images/index/sticker-1.gif", x: "85%", y: "15%", delay: 1 },
  { src: "/images/index/sticker-2.gif", x: "5%", y: "60%", delay: 2 },
  { src: "/images/index/sticker-3.gif", x: "80%", y: "70%", delay: 3 },
];

const BOARD_OF_DARKNESS = [
  { title: "Shadow", role: "Leader" },
  { title: "The Mask", role: "Admin" },
  { title: "Viking", role: "Admin" },
  { title: "Assassin", role: "Admin" },
  { title: "Phantom", role: "Admin" }
];

const COUNCIL_OF_SHADOWS = [
  { title: "First Shadow", role: "Alpha" },
  { title: "Second Shadow", role: "Moderator" },
  { title: "Third Shadow", role: "Moderator" },
  { title: "Fourth Shadow", role: "Moderator" },
  { title: "Fifth Shadow", role: "Moderator" },
  { title: "Sixth Shadow", role: "Moderator" },
  { title: "Seventh Shadow", role: "Moderator" },
  { title: "Eighth Shadow", role: "Moderator" },
  { title: "Ninth Shadow", role: "Moderator" },
  { title: "Tenth Shadow", role: "Moderator" }
];

// --- COMPONENTS ---

const GuildStats = React.memo(() => {
  const [stats, setStats] = useState({ users: 15420, posts: 8540 });
  const [liveUsers, setLiveUsers] = useState(1200);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: postCount } = await supabase.from('social_posts').select('*', { count: 'exact', head: true });
        
        if (isMounted) {
          setStats({ 
            users: userCount || 15420,
            posts: postCount || 8540 
          });
          setLiveUsers(Math.floor((userCount || 15420) * 0.08));
        }
      } catch (e) {
        console.warn("Guild Stats Error - Using Fallback", e);
      }
    };
    fetchStats();

    const interval = setInterval(() => {
      setLiveUsers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + change);
      });
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-12 px-4">
      <StatCard icon={Users} label="Awakened Agents" value={stats.users.toLocaleString()} sub="Total Registered" />
      <StatCard icon={Activity} label="Souls Online" value={liveUsers.toLocaleString()} sub="Currently Active" isLive />
      <StatCard icon={ScrollIcon} label="Intel Reports" value={stats.posts.toLocaleString()} sub="Community Posts" />
    </div>
  );
});
GuildStats.displayName = 'GuildStats';

const StatCard = React.memo(({ icon: Icon, label, value, sub, isLive }: any) => (
  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:bg-primary-950/20 hover:border-primary-500/30 transition-all group">
    <div className={`p-3 rounded-lg ${isLive ? 'bg-green-900/20' : 'bg-primary-900/20'} border ${isLive ? 'border-green-500/30' : 'border-primary-500/30'}`}>
      <Icon className={`w-6 h-6 ${isLive ? 'text-green-500' : 'text-primary-500'}`} />
    </div>
    <div>
      <div className="text-2xl font-bold font-gradvis text-white flex items-center gap-2">
        {value}
        {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
      </div>
      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</div>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const FloatingParticles = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-primary-500/40 rounded-full blur-[1px]"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{
          y: [-20, -50, -20],
          x: [0, Math.random() * 20 - 10, 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3, ease: "easeInOut" }}
      />
    ))}
  </div>
));
FloatingParticles.displayName = 'FloatingParticles';

const FeatureCard = React.memo(({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="p-8 rounded-xl bg-black/40 border border-white/5 hover:border-primary-500/40 transition-all group backdrop-blur-md hover:bg-primary-950/10 hover:-translate-y-1 duration-300" style={{ willChange: 'transform' }}>
    <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center mb-6 border border-white/10 group-hover:border-primary-500/50 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all">
      <Icon className="w-7 h-7 text-primary-700 group-hover:text-primary-500 transition-colors" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 font-above tracking-wide">{title}</h3>
    <p className="text-sm text-gray-400 font-light leading-relaxed">{desc}</p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// --- MAIN COMPONENT ---

export default function LandingClient() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showLandingUI, setShowLandingUI] = useState(false);   
  const [triggerEntry, setTriggerEntry] = useState(false);     
  const [bgImage, setBgImage] = useState(WAIFU_BG_LIST[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl' | 'neutral' | null>(null);
  
  const [trending, setTrending] = useState<UniversalAnimeBase[]>([]); 
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);

  useEffect(() => {
    const mobileCheck = window.innerWidth < 768;
    setIsMobile(mobileCheck);
    if (mobileCheck) {
      setShowLandingUI(true);
    }
    // 1. Random BG (Client-side only)
    const randomIdx = Math.floor(Math.random() * WAIFU_BG_LIST.length);
    setBgImage(WAIFU_BG_LIST[randomIdx]);

    // 2. Auth & Data
    const init = async () => {
      // ✅ HANDOVER PROTOCOL (CRITICAL FIX)
      // Check for the "Pass" in local storage instantly (0ms)
      const hasAuthHint = typeof window !== 'undefined' && localStorage.getItem('shadow_auth_hint') === 'true';

      if (hasAuthHint) {
        // Assume logged in, redirect immediately
        router.replace('/home');
        return;
      }

      // If no hint, do the full API check (Fallback)
      const user = await UserAPI.getCurrentUser();
      if (user) {
        if (typeof window !== 'undefined') localStorage.setItem('shadow_auth_hint', 'true');
        router.replace('/home'); 
        return;
      } else {
        // Confirmed Guest
        setIsCheckingAuth(false);
      }

      // Fetch Trending (Only if we stay)
      try {
        const data = await AnimeService.getTopAiring(1);
        if (data && data.length > 0) {
          setTrending(data.slice(0, 6)); 
        }
      } catch (err) {
        console.error("Failed to load trending:", err);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    init();
  }, [router]);

  // Handlers
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
    // Always mark audio as permitted — user clicked, that satisfies the browser gate
    localStorage.setItem('shadow_audio_permitted', 'true');
    localStorage.setItem('guild_audio_permit', 'true');
  }, []);

  const handleSceneReady = useCallback(() => { setShowLandingUI(true); }, []);
  const processGenderSelection = useCallback(() => {
    if (selectedGender) {
      localStorage.setItem('shadow_traveller_gender', selectedGender);
      const genderArg = selectedGender === 'neutral' ? undefined : selectedGender;
      const avatar = getRandomAvatar(true, genderArg);
      localStorage.setItem('shadow_traveller_avatar', avatar);
      localStorage.setItem('shadow_traveller_name', getRandomGuestName());
    }
  }, [selectedGender]);

  const handleEnterClick = useCallback(() => { 
    initializeAudio();
    processGenderSelection();
    setShowLandingUI(false); 
    setTriggerEntry(true); 
  }, [initializeAudio, processGenderSelection]);
  
  const handleJoinGuildClick = useCallback(() => {
    initializeAudio();
    processGenderSelection();
    setShowAuth(true);
  }, [initializeAudio, processGenderSelection]);

  const handlePortalComplete = useCallback(() => { router.push('/home'); }, [router]);

  // Prevent Flash
  if (isCheckingAuth) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <main className={`relative min-h-screen w-full bg-[#050505] text-white overflow-x-hidden selection:bg-primary-900/50   `}>
      
      {/* 1. PORTAL BACKGROUND */}
      {!isMobile && (
        <div className="fixed inset-0 z-0">
          <ShadowGardenPortal 
            startTransition={triggerEntry}
            onComplete={handlePortalComplete}
            onSceneReady={handleSceneReady}
          />
        </div>
      )}

      {/* 2. OVERLAY */}
      <AnimatePresence mode="wait">
        {showLandingUI && (
          <motion.div 
            // ✅ FIXED JSX ERROR: Replaced <style jsx> with Tailwind
            className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50, filter: "blur(20px)" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            {/* Static Background */}
            <motion.div 
              style={{ opacity: heroOpacity, scale: heroScale, willChange: 'transform, opacity' }} 
              className="absolute inset-0 z-0 pointer-events-none h-screen fixed"
            >
               <img src={bgImage} alt="Background" loading="eager" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#050505]/90 to-[#050505]" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
            </motion.div>

            <FloatingParticles />

            {/* HERO SECTION */}
            <section className="relative min-h-screen flex flex-col items-center justify-center p-4 py-20">
               {FLOATING_STICKERS.map((s, i) => (
                 <motion.img 
                   key={i} src={s.src} alt="Sticker" loading="lazy"
                   className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 object-contain pointer-events-none drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                   style={{ left: s.x, top: s.y, willChange: 'transform, opacity' }}
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 0.6, y: [0, -15, 0] }}
                   transition={{ scale: { delay: s.delay, duration: 0.5 }, opacity: { delay: s.delay, duration: 0.5 }, y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: s.delay } }}
                 />
               ))}

               <div className="relative z-20 text-center px-4 w-full">
                 <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
                   
                   <div className="relative inline-block mb-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-900/30 border border-primary-500/30 backdrop-blur-md mb-4 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_red]" />
                        <span className="text-primary-200 text-[10px] font-bold tracking-widest uppercase font-mono">Guild System Online • v0.1 (beta)</span>
                     </div>
                     <h1 className="text-5xl md:text-8xl font-normal tracking-wide font-gradvis text-primary-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] relative z-10" style={{ fontFamily: 'var(--font-gradvis), serif' }}>SHADOW GARDEN</h1>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-50 z-0 pointer-events-none mix-blend-screen">
                        <div className="w-full h-full bg-primary-500/20 blur-[60px] rounded-full animate-pulse" />
                     </div>
                   </div>
                   
                   <p className="text-base md:text-xl text-gray-400 font-light mb-10 leading-relaxed font-above tracking-wide w-full">
                      The ultimate sanctuary for the awakened. <br/>
                      Join the guild. Access the archives. Become legend.
                   </p>

                   <div className="w-full mb-10 transform hover:scale-105 transition-transform duration-300 relative z-20">
                      <div className="relative p-1 rounded-full bg-gradient-to-r from-primary-900/50 via-primary-600/50 to-primary-900/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                        <div className="bg-black/90 backdrop-blur-xl rounded-full"><SearchBar /></div>
                      </div>
                   </div>

                   <div className="flex justify-center items-center gap-4 mb-6 relative z-20">
                     <span className="text-gray-400 font-above tracking-wider text-sm uppercase">Select Form:</span>
                     <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
                       <button onClick={() => setSelectedGender('boy')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${selectedGender === 'boy' ? 'bg-blue-600/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-white'}`}>Boy</button>
                       <button onClick={() => setSelectedGender('girl')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${selectedGender === 'girl' ? 'bg-pink-600/50 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]' : 'text-gray-500 hover:text-white'}`}>Girl</button>
                       <button onClick={() => setSelectedGender('neutral')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${selectedGender === 'neutral' ? 'bg-purple-600/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'text-gray-500 hover:text-white'}`}>Random</button>
                     </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-5 justify-center items-center relative z-20">
                      <Button onClick={handleJoinGuildClick} className="h-14 rounded-full bg-primary-800 hover:bg-primary-700 text-white font-bold text-lg shadow-[0_0_35px_rgba(220,38,38,0.4)] border border-primary-500/50 backdrop-blur-md font-above tracking-wider">
                        <Crown className="mr-3 h-5 w-5" /> Join The Guild
                      </Button>
                      <Button onClick={handleEnterClick} variant="ghost" className="h-14 rounded-full text-white/70 hover:text-white hover:bg-white/10 border border-white/10 text-lg hover:border-primary-500/50 backdrop-blur-md transition-all font-above tracking-wider w-full">
                        Enter as Visitor <ArrowRight className="ml-3 w-5 h-5" />
                      </Button>
                   </div>

                   <GuildStats />
                 </motion.div>
               </div>
            </section>

            {/* EXTENDED CONTENT */}
            <div className="relative bg-gradient-to-b from-transparent via-[#050505] to-[#050505] pt-12 space-y-32 z-10">
               
               {/* TOP RANKING */}
               <section className="w-full py-4">
                  <div className=" w-full">
                     <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                        <Flame className="w-6 h-6 text-primary-600" />
                        <h3 className="text-3xl font-normal font-gradvis text-white tracking-widest">TOP BOUNTIES</h3>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {isLoadingTrending ? (
                           [...Array(6)].map((_, i) => (<div key={i} className="w-full aspect-[2/3] rounded-3xl bg-white/5 animate-pulse border border-white/10" />))
                        ) : (
                           trending.map((anime, i) => (
                              <Link key={anime.id} href={`/watch/${anime.id}`} className="relative w-full aspect-[2/3] rounded-3xl overflow-hidden cursor-pointer group border border-white/10 hover:border-primary-500/50 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                                 <img src={anime.poster} alt={anime.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                 <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-600/90 backdrop-blur-md flex items-center justify-center font-black text-xs border border-primary-400 shadow-[0_0_10px_red] z-10">{i + 1}</div>
                                 <div className="absolute bottom-0 w-full p-3 text-center">
                                    <h4 className="text-xs font-bold text-white mb-1 leading-tight drop-shadow-md line-clamp-2 group-hover:text-primary-400 transition-colors">{anime.title}</h4>
                                 </div>
                              </Link>
                           ))
                        )}
                     </div>
                  </div>
               </section>

               {/* ARCHIVES */}
               <section className="py-20 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 w-full">
                     <div className="flex-1 space-y-8">
                        <h3 className="text-4xl font-normal text-primary-600 font-gradvis border-l-4 border-primary-600 pl-6" style={{ fontFamily: 'var(--font-above), serif' }}>THE FORBIDDEN LIBRARY</h3>
                        <p className="text-gray-400 text-lg leading-relaxed font-above tracking-wide">
                           Shadow Garden isn't just a website; it's a repository of otaku culture. 
                           We index over 15,000 series, automatically sync with MyAnimeList and AniList.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {["Soul-Link Sync", "Oracle Recommendations", "Personal Grimoire (Watchlist)", "Guild Chat (Comments)"].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 text-white/80 font-medium text-sm p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary-500/30 transition-colors">
                                 <Sword className="w-4 h-4 text-primary-500" /> {item}
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1 relative w-full flex justify-center">
                        <div className="absolute inset-0 bg-primary-600/10 blur-[80px] rounded-full" />
                        <motion.img 
                          src={FEATURE_GIF} alt="Archive Feature" loading="lazy"
                          initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
                          className="relative rounded-2xl border border-primary-500/20 shadow-2xl w-full max-w-sm object-cover hover:scale-105 transition-transform duration-500" 
                        />
                     </div>
                  </div>
               </section>

               {/* ADVANTAGE */}
               <section className="relative z-10 w-full">
                 <div className=" w-full">
                   <div className="text-center mb-16">
                      <h2 className="text-4xl md:text-5xl font-normal text-white mb-4 font-gradvis text-primary-600" style={{ fontFamily: 'var(--font-above), serif' }}>GUILD PERKS</h2>
                      <div className="w-24 h-1.5 bg-primary-600 rounded-full shadow-[0_0_15px_red]" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FeatureCard icon={Zap} title="Hyper Velocity" desc="Built on Next.js 15 Turbo. Intel loads instantly." />
                      <FeatureCard icon={ShieldCheck} title="Zero Intrusion" desc="No popups. No banners. Just pure content." />
                      <FeatureCard icon={Smartphone} title="Mobile Native" desc="Designed for your thumb. PWA Ready." />
                      <FeatureCard icon={Terminal} title="Developer API" desc="Access our Shadow Engine API for stats." />
                      <FeatureCard icon={Globe} title="Global Nodes" desc="Buffer-free 1080p streaming worldwide." />
                      <FeatureCard icon={Ghost} title="Incognito Mode" desc="No phone number required. Encrypted logs." />
                   </div>
                 </div>
               </section>

               {/* COMMUNITY HIERARCHY */}
               <section className="py-20 relative overflow-hidden bg-black/40 border-y border-white/5">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent" />
                 <div className="relative z-10 w-full">
                   <div className="text-center mb-16">
                     <h2 className="text-4xl md:text-5xl font-normal text-white mb-4 font-gradvis text-primary-600 tracking-wider">GUILD HIERARCHY</h2>
                     <p className="text-gray-400 text-lg font-above w-full">The structure of the sanctuary. Ascend the ranks and earn your title among the elites.</p>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     {/* Board of Darkness */}
                     <div className="p-8 rounded-3xl bg-primary-950/20 border border-primary-500/20 backdrop-blur-md">
                       <div className="flex items-center gap-4 mb-8">
                         <div className="p-3 bg-primary-900/40 rounded-xl border border-primary-500/50"><Crown className="w-8 h-8 text-primary-500" /></div>
                         <div>
                           <h3 className="text-2xl font-gradvis text-primary-500 tracking-widest">BOARD OF DARKNESS</h3>
                           <p className="text-xs text-primary-400/80 font-mono uppercase tracking-widest">The Administrators</p>
                         </div>
                       </div>
                       <div className="flex flex-wrap gap-3">
                         {BOARD_OF_DARKNESS.map((member, i) => (
                           <div key={i} className={`px-4 py-3 rounded-xl border ${i === 0 ? 'bg-primary-900/40 border-primary-500 text-white' : 'bg-black/50 border-white/10 text-gray-300'} flex flex-col`}>
                             <span className="font-bold text-sm tracking-wider">{member.title}</span>
                             <span className={`text-[10px] uppercase tracking-widest ${i === 0 ? 'text-primary-300' : 'text-gray-500'}`}>{member.role}</span>
                           </div>
                         ))}
                       </div>
                     </div>

                     {/* Council of Shadows */}
                     <div className="p-8 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md">
                       <div className="flex items-center gap-4 mb-8">
                         <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/20"><ShieldCheck className="w-8 h-8 text-zinc-400" /></div>
                         <div>
                           <h3 className="text-2xl font-gradvis text-zinc-300 tracking-widest">COUNCIL OF SHADOWS</h3>
                           <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">The Moderators</p>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {COUNCIL_OF_SHADOWS.map((member, i) => (
                           <div key={i} className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-white/5 flex flex-col">
                             <span className="font-bold text-sm text-zinc-200">{member.title}</span>
                             <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{member.role}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               </section>

               {/* COMMUNITY CTA */}
               <section className=" w-full">
                  <div className="relative rounded-3xl overflow-hidden border border-primary-900/30 bg-gradient-to-br from-primary-950/20 to-black p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-12 group">
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                     <div className="flex-1 relative z-10">
                        <h3 className="text-3xl font-normal text-white mb-4 font-gradvis text-primary-500" style={{ fontFamily: 'var(--font-above), serif' }}>VISIT THE GARDEN LOBBY</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed font-above">
                           Connect with thousands of other agents. Discuss theories, get recommendation, and participate in weekly watch parties.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          <a href="https://discord.gg/YOUR_INVITE_CODE" target="_blank" rel="noopener noreferrer">
                            <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0 h-12 shadow-lg shadow-indigo-500/20">
                              <MessageCircle className="mr-2 w-5 h-5" /> Join Discord
                            </Button>
                          </a>
                          <a href="https://github.com/code-acezero/shadow-garden" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 h-12 w-full">
                              <Terminal className="mr-2 w-5 h-5" /> View Changelog
                            </Button>
                          </a>
                        </div>
                     </div>
                     <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 animate-float hidden md:block">
                        <div className="absolute inset-0 bg-primary-600/20 blur-[50px] rounded-full group-hover:bg-primary-600/30 transition-all duration-500" />
                        <Sword className="w-full h-full text-primary-800 opacity-80 rotate-45" />
                     </div>
                  </div>
               </section>

               {/* FOOTER */}
               <footer className="py-12 border-t border-white/5 text-center relative overflow-hidden bg-black">
                  <div className="relative z-20">
                      <h4 className="text-2xl font-gradvis text-primary-600 font-normal mb-3" style={{ fontFamily: 'var(--font-gradvis), serif' }}>SHADOW GARDEN</h4>
                      <p className="text-gray-600 text-xs uppercase tracking-widest mb-8">Created by Ace Zero • Est. 2026</p>
                      <div className="flex justify-center gap-8 text-xs text-gray-500 font-medium uppercase tracking-wider">
                         <Link href="#" className="hover:text-primary-500 transition-colors">Terms of Service</Link>
                         <Link href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</Link>
                         <Link href="#" className="hover:text-primary-500 transition-colors">DMCA</Link>
                      </div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-24 sm:w-96 sm:h-32 opacity-10 pointer-events-none mix-blend-screen z-10">
                      <img src={FOOTER_GIF} alt="Footer Ambience" loading="lazy" className="w-full h-full object-contain" />
                  </div>
               </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onAuthSuccess={handleEnterClick} />
    </main>
  );
}