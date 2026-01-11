"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, Zap, ShieldCheck, Smartphone, 
  Ghost, Terminal, Globe, Crown, Sword 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAPI } from '@/lib/api';
import AuthModal from '@/components/Auth/AuthModal';
import SearchBar from '@/components/Anime/SearchBar';

// --- 🟢 LOCAL ASSETS CONFIGURATION ---
// Ensure you have created 'public/index/' and added these files.

const WAIFU_BG_LIST = [
  "/index/bg-1.jpg", 
  "/index/bg-2.jpg",
  "/index/bg-3.jpg",
  "/index/bg-4.jpg",
  "/index/bg-5.jpg",
  "/index/bg-6.png",
  "/index/bg-7.png",
  "/index/bg-8.png",
  "/index/bg-9.png",
  "/index/bg-10.png"

];

const FLOATING_STICKERS = [
  { src: "/index/sticker-1.gif", x: "85%", y: "15%", delay: 1 }, // Top Right
  { src: "/index/sticker-2.gif", x: "5%", y: "60%", delay: 2 },  // Bottom Left
  { src: "/index/sticker-3.gif", x: "80%", y: "70%", delay: 3 }, // Bottom Right
];

const FEATURE_GIF = "/index/feature-main.gif";
const FOOTER_GIF = "/index/footer.gif";

export default function LandingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  // Default to first image to prevent hydration mismatch, then randomize
  const [bgImage, setBgImage] = useState(WAIFU_BG_LIST[0]);
  
  // Parallax Effects
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);

  useEffect(() => {
    // 1. Randomize Background on client load
    const randomIdx = Math.floor(Math.random() * WAIFU_BG_LIST.length);
    setBgImage(WAIFU_BG_LIST[randomIdx]);

    // 2. Check Auth
    const checkUser = async () => {
      const user = await UserAPI.getCurrentUser();
      if (user) {
        router.push('/home');
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  // Prevent flash while checking auth
  if (isCheckingAuth) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <main className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-red-900/50 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
         
         {/* Dynamic Background */}
         <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#050505]/80 to-[#050505] z-10" />
            {/* Darker overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40 z-10" /> 
            
            <img 
              src={bgImage} 
              className="w-full h-full object-cover object-top opacity-50 transition-opacity duration-1000" 
              alt="Waifu Background" 
            />
            
            {/* Grain Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-10" />
         </motion.div>

         {/* Floating Stickers (Decorations) */}
         {FLOATING_STICKERS.map((s, i) => (
            <motion.img 
              key={i}
              src={s.src} 
              className="absolute w-24 h-24 md:w-32 md:h-32 object-contain opacity-0 md:opacity-80 pointer-events-none z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
              style={{ left: s.x, top: s.y }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8, y: [0, -15, 0] }}
              transition={{ 
                scale: { delay: s.delay, duration: 0.5 },
                opacity: { delay: s.delay, duration: 0.5 },
                y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: s.delay }
              }}
            />
         ))}

         {/* Hero Content */}
         <div className="relative z-20 text-center px-4 max-w-4xl w-full">
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
               
               {/* System Online Badge */}
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/20 border border-red-500/30 backdrop-blur-md mb-6 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_red]" />
                  <span className="text-red-200 text-[10px] font-bold tracking-widest uppercase">System Online</span>
               </div>
               
               {/* Scaled Down Header */}
               <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 font-[Cinzel] drop-shadow-[0_0_40px_rgba(220,38,38,0.4)] leading-none">
                 SHADOW <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900">GARDEN</span>
               </h1>
               
               <p className="text-base md:text-xl text-gray-300 font-light max-w-xl mx-auto mb-10 leading-relaxed drop-shadow-md">
                 The ultimate sanctuary for the awakened. <br className="hidden md:block" />
                 Stream anime in turbo speed, zero ads, completely free.
               </p>

               {/* ✅ SEARCH BAR (Imported) */}
               <div className="w-full max-w-lg mx-auto mb-10 transform hover:scale-105 transition-transform duration-300">
                  <div className="relative p-1 rounded-full bg-gradient-to-r from-red-900/50 via-red-600/50 to-red-900/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    <div className="bg-black rounded-full">
                        <SearchBar />
                    </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                 <Button 
                   onClick={() => setShowAuth(true)}
                   className="h-14 px-8 rounded-full bg-red-700 hover:bg-red-600 text-white font-bold text-lg shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:scale-105 transition-all duration-300 border border-red-500/50"
                 >
                   <Crown className="mr-2 h-5 w-5" /> Join The Secret Order
                 </Button>
                 
                 <Link href="/home">
                    <Button variant="ghost" className="h-14 px-8 rounded-full text-white/70 hover:text-white hover:bg-white/5 border border-white/10 text-lg hover:border-red-500/30 transition-all">
                       Enter as Guest <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                 </Link>
               </div>

            </motion.div>
         </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section className="py-24 px-6 relative z-10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-black text-white mb-4">THE SHADOW ADVANTAGE</h2>
             <div className="w-16 h-1 bg-red-600 mx-auto rounded-full shadow-[0_0_10px_red]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <FeatureCard 
               icon={Zap} title="Hyper Velocity" 
               desc="Built on Next.js 15 Turbo. Pages load instantly. Video streams start in milliseconds." 
             />
             <FeatureCard 
               icon={ShieldCheck} title="Zero Intrusion" 
               desc="No popups. No banners. No tracking. Just pure, unadulterated anime consumption." 
             />
             <FeatureCard 
               icon={Smartphone} title="Mobile Native" 
               desc="Designed for your thumb. The interface feels like a native app installed on your phone." 
             />
             <FeatureCard 
               icon={Terminal} title="Developer API" 
               desc="Access our Shadow Engine API to build your own tools or fetch metadata programmatically." 
             />
             <FeatureCard 
               icon={Globe} title="Global Nodes" 
               desc="Our CDN routes through 50+ locations worldwide to ensure buffer-free 1080p streaming." 
             />
             <FeatureCard 
               icon={Ghost} title="Anonymous" 
               desc="We don't ask for your phone number. Sign up with just an email, or don't sign up at all." 
             />
          </div>
        </div>
      </section>

      {/* --- KNOWLEDGE BANNER --- */}
      <section className="py-20 relative overflow-hidden bg-black">
         <div className="absolute inset-0 bg-red-900/10" />
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="flex-1 space-y-6">
               <h3 className="text-3xl font-bold text-red-500 font-[Cinzel]">THE SHADOW ARCHIVES</h3>
               <p className="text-gray-300 text-lg leading-relaxed">
                 Shadow Garden isn't just a website; it's a repository of otaku culture. 
                 We index over 15,000 series, automatically sync with MyAnimeList and AniList, 
                 and provide AI-powered recommendations based on your unique taste profile.
               </p>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "AI-Powered Recommendations", "Auto-Sync Tracking",
                    "Custom Watchlists", "Community Discussions",
                    "Release Calendar", "Character Database"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80 font-medium text-sm">
                       <Sword className="w-4 h-4 text-red-500" /> {item}
                    </li>
                  ))}
               </ul>
            </div>
            {/* Decorative GIF Frame */}
            <div className="flex-1 relative w-full flex justify-center">
               <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full" />
               <img 
                 src={FEATURE_GIF} 
                 className="relative rounded-lg border border-red-500/20 shadow-2xl w-full max-w-sm object-cover" 
                 alt="Archive Feature" 
               />
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/5 text-center bg-[#050505] relative overflow-hidden">
         <div className="relative z-10">
            <div className="mb-8">
                <h4 className="text-xl font-[Cinzel] text-red-600 font-bold mb-2">SHADOW GARDEN</h4>
                <p className="text-gray-600 text-xs uppercase tracking-widest">Created by Ace Zero • Est. 2025</p>
            </div>
            <div className="flex justify-center gap-6 text-xs text-gray-500 font-medium uppercase tracking-wider">
                <Link href="#" className="hover:text-red-500 transition-colors">Terms</Link>
                <Link href="#" className="hover:text-red-500 transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-red-500 transition-colors">Discord</Link>
            </div>
         </div>
         
         {/* Footer Ambient GIF */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 opacity-30 pointer-events-none">
            <img src={FOOTER_GIF} className="w-full h-full object-contain" alt="Footer Ambience" />
         </div>
      </footer>

      {/* --- AUTH MODAL WRAPPER --- */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onAuthSuccess={() => router.push('/home')} 
      />
    </main>
  );
}

// --- SUB COMPONENTS ---

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-white/10 transition-all group backdrop-blur-sm">
      <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(220,38,38,0.1)] border border-white/5">
        <Icon className="w-6 h-6 text-red-500 group-hover:text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-500 transition-colors">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed font-light">{desc}</p>
    </div>
  );
}