"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, Info, ChevronLeft, ChevronRight, 
  Clock, Calendar, Captions, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ShadowAnime } from '@/lib/consumet';

// --- STYLES FOR SMOKE & SLIME ---
const smokeStyle = `
  @keyframes smoke {
    0% { transform: translateX(0) scale(1); opacity: 0.3; }
    50% { transform: translateX(-20px) scale(1.1); opacity: 0.5; }
    100% { transform: translateX(0) scale(1); opacity: 0.3; }
  }
  .animate-smoke { animation: smoke 8s ease-in-out infinite; }
`;

const slimeStyle = `
  @keyframes slime {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }
  .animate-slime { animation: slime 6s ease-in-out infinite; }
`;

interface SpotlightProps {
  animes: ShadowAnime[];
}

export default function SpotlightSlider({ animes }: SpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); 
  const router = useRouter(); 

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % animes.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? animes.length - 1 : prev - 1));
  };

  const handleWatch = (animeId: string) => {
    router.push(`/watch/${animeId}`);
  };

  if (!animes || animes.length === 0) return null;

  const currentAnime = animes[activeIndex];
  // Consumet sometimes puts the big image in 'cover' or 'image'
  const displayImage = currentAnime.cover || currentAnime.image;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <section className="relative w-full h-[600px] md:h-[650px] mb-12 group perspective-1000">
      {/* Inject Styles */}
      <style>{smokeStyle + slimeStyle}</style>

      <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10 ring-1 ring-white/5 bg-[#050505]">
        
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 }
            }}
            className="absolute inset-0 w-full h-full bg-[#050505]"
          >
            {/* Background Image */}
            <motion.img 
              src={displayImage} 
              alt={currentAnime.title}
              className="w-full h-full object-cover opacity-60"
            />

            {/* --- SMOKY FOG LAYERS --- */}
            <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-screen">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20 animate-smoke filter blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-1/2 h-1/2 bg-red-900/10 rounded-full blur-[100px] animate-pulse" />
            </div>

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10" />
            
            {/* --- SLIMY ECTOPLASM ORB --- */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 z-0 blur-[80px] animate-slime pointer-events-none" />

            {/* CONTENT */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 z-20">
              <div className="max-w-3xl relative">
                
                {/* Spotlight Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <span className="text-yellow-200 text-xs font-bold tracking-wider uppercase">
                      Spotlight #{activeIndex + 1}
                    </span>
                  </div>
                  <Badge className="border border-white/20 text-white/80 bg-white/5 backdrop-blur-sm">
                    {currentAnime.type || 'TV'}
                  </Badge>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[0.9] tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] line-clamp-2">
                    {currentAnime.title}
                  </h1>
                </motion.div>

                {/* Metadata */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300"
                >
                  {currentAnime.releaseDate && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>{currentAnime.releaseDate}</span>
                    </div>
                  )}
                  {/* Note: Consumet lists don't always have Duration/Dub info in the listing object */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>24m</span>
                  </div>
                  
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                      <Captions className="w-4 h-4 text-green-400" />
                      <span className="font-bold">Sub</span>
                    </div>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-300/90 mb-8 line-clamp-3 text-base md:text-lg font-light leading-relaxed max-w-2xl drop-shadow-md"
                >
                  {currentAnime.description || "Enter the shadow world and discover the secrets hidden within this anime."}
                </motion.p>

                {/* Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-4"
                >
                  <Button 
                    onClick={() => handleWatch(currentAnime.id)}
                    className="h-14 px-8 md:px-10 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all transform hover:-translate-y-1 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    <Play className="mr-2 h-6 w-6 fill-white relative z-10" />
                    <span className="relative z-10">Watch Now</span>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="h-14 px-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white backdrop-blur-xl transition-all"
                  >
                    <Info className="mr-2 h-5 w-5" />
                    Details
                  </Button>
                </motion.div>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

        {/* --- NAVIGATION DOTS & ARROWS --- */}
        <div className="absolute bottom-12 right-8 md:right-16 z-30 flex items-center gap-4">
          <div className="flex gap-2 mr-4">
            {animes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > activeIndex ? 1 : -1);
                  setActiveIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full h-1.5 ${
                  idx === activeIndex 
                    ? 'w-8 bg-purple-500 shadow-[0_0_10px_#a855f7]' 
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handlePrev} 
              className="p-3 rounded-full bg-black/30 hover:bg-purple-600/80 border border-white/10 hover:border-purple-500/50 backdrop-blur-md text-white transition-all duration-300 group"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button 
              onClick={handleNext}
              className="p-3 rounded-full bg-black/30 hover:bg-purple-600/80 border border-white/10 hover:border-purple-500/50 backdrop-blur-md text-white transition-all duration-300 group"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
}