import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsumetAnime } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotlightProps {
  animes: ConsumetAnime[];
  onWatch: (anime: ConsumetAnime) => void;
  onInfo: (id: string) => void;
}

export default function SpotlightSlider({ animes, onWatch, onInfo }: SpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % animes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [animes.length]);

  const next = () => setActiveIndex((prev) => (prev + 1) % animes.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + animes.length) % animes.length);

  return (
    <section className="relative h-[500px] w-full rounded-3xl overflow-hidden mb-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img 
            src={animes[activeIndex].image} 
            className="w-full h-full object-cover"
            alt={animes[activeIndex].title}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          
          <div className="absolute bottom-12 left-10 max-w-2xl z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 bg-red-600 text-white border-none px-3 py-1">
                #{animes[activeIndex].rank} Spotlight
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 line-clamp-2 uppercase italic tracking-tighter">
                {animes[activeIndex].title}
              </h1>
              <p className="text-gray-300 mb-8 line-clamp-3 text-lg font-medium leading-relaxed">
                {animes[activeIndex].description}
              </p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => onWatch(animes[activeIndex])}
                  className="bg-red-600 hover:bg-red-700 h-14 px-10 text-xl font-bold rounded-xl"
                >
                  <Play className="mr-2 h-6 w-6 fill-current" /> Watch Now
                </Button>
                <Button 
                  onClick={() => onInfo(animes[activeIndex].id)}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-14 px-8 text-xl font-bold rounded-xl backdrop-blur-md"
                >
                  <Info className="mr-2 h-6 w-6" /> Details
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute bottom-12 right-12 flex gap-3 z-20">
        <Button onClick={prev} size="icon" variant="outline" className="rounded-full bg-black/40 border-white/10 text-white hover:bg-red-600">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button onClick={next} size="icon" variant="outline" className="rounded-full bg-black/40 border-white/10 text-white hover:bg-red-600">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}