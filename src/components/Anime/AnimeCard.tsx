import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Info, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConsumetAnime } from '@/lib/api';

// Extended interface to handle "Recent Episode" data safely
interface ExtendedAnime extends ConsumetAnime {
  episodeId?: string;
  episodeNumber?: number;
}

interface AnimeCardProps {
  anime: ConsumetAnime;
  isInWatchlist?: boolean;
  progress?: number; // 0 to 100
  variant?: 'default' | 'compact' | 'large';
  onAdd?: (id: string) => void;
}

export default function AnimeCard({ 
  anime, 
  isInWatchlist = false, 
  progress = 0, 
  variant = 'default',
  onAdd 
}: AnimeCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // Safe cast to access optional episode data
  const data = anime as ExtendedAnime;

  // Smart Navigation Logic
  const handleCardClick = () => {
    navigate(`/watch/${data.id}`);
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Prioritize jumping to the specific episode (common in "Latest Updates")
    if (data.episodeId) {
      navigate(`/watch/${data.id}?ep=${data.episodeId}`);
    } else {
      navigate(`/watch/${data.id}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full"
    >
      <Card
        onClick={handleCardClick}
        className={`
          relative overflow-hidden cursor-pointer bg-zinc-900 border-zinc-800 
          transition-all duration-300 group
          ${isHovered ? 'ring-2 ring-red-600/80 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'shadow-md'}
          ${variant === 'compact' ? 'aspect-[2/3]' : 'aspect-[2/3]'}
        `}
      >
        {/* Poster Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={data.image}
            alt={data.title}
            className={`
              w-full h-full object-cover transition-transform duration-700 ease-out
              ${isHovered ? 'scale-110 blur-[3px] brightness-50' : 'scale-100'}
            `}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/18181b/ffffff?text=Shadow+Garden';
            }}
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 opacity-90" />

        {/* --- TOP BADGES --- */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {/* Rank Badge for Trending */}
          {data.rank && (
            <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold border-none shadow-md px-2">
              #{data.rank}
            </Badge>
          )}
          {/* Sub/Dub Quality Badge */}
          {data.subOrDub && (
            <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white border-white/20 text-[10px] uppercase font-bold px-2">
              {data.subOrDub}
            </Badge>
          )}
        </div>

        {/* --- EPISODE BADGE (Top Right) --- */}
        {data.episodeNumber && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-white text-black hover:bg-white font-extrabold border-none shadow-lg px-2">
              EP {data.episodeNumber}
            </Badge>
          </div>
        )}

        {/* --- HOVER ACTIONS (Center) --- */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30"
            >
              {/* Big Play Button */}
              <Button
                onClick={handleQuickPlay}
                size="icon"
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 hover:scale-110 transition-all shadow-[0_0_20px_rgba(220,38,38,0.6)]"
              >
                <Play className="w-8 h-8 fill-white ml-1" />
              </Button>

              {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
                  onClick={(e) => { e.stopPropagation(); onAdd?.(data.id); }}
                >
                  {isInWatchlist ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Plus className="w-5 h-5 text-white" />
                  )}
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
                  onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                >
                  <Info className="w-5 h-5 text-white" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- BOTTOM INFO --- */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md group-hover:text-red-500 transition-colors">
            {data.title}
          </h3>
          
          <div className="flex items-center justify-between mt-2 text-[11px] font-medium text-zinc-300 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-red-500" /> 
              {data.releaseDate || 'N/A'}
            </span>
            {data.type && (
              <span className="opacity-80 px-1.5 py-0.5 rounded bg-white/10">
                {data.type}
              </span>
            )}
          </div>
        </div>

        {/* --- PROGRESS BAR (For History) --- */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" 
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
}