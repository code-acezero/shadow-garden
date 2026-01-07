import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Star, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConsumetAnime } from '@/lib/api';

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

  // Smart Navigation Logic
  const handleCardClick = () => {
    // Navigate to general watch page (Resumes from history or Ep 1)
    navigate(`/watch/${anime.id}`);
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate directly to the current latest episode if available
    const epId = (anime as any).episodeId;
    navigate(`/watch/${anime.id}${epId ? `?ep=${epId}` : ''}`);
  };

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full"
    >
      <Card
        onClick={handleCardClick}
        className={`relative overflow-hidden cursor-pointer bg-zinc-900 border-zinc-800 transition-all duration-500 
          ${isHovered ? 'ring-2 ring-red-600 shadow-2xl shadow-red-900/20 -translate-y-2' : ''}
          ${variant === 'compact' ? 'aspect-[2/3]' : 'aspect-[2/3]'}
        `}
      >
        {/* Poster Image */}
        <img
          src={anime.image}
          alt={anime.title}
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110 blur-[2px]' : 'scale-100'}`}
          loading="lazy"
        />

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        
        {/* Dynamic Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {anime.rank && (
            <Badge className="bg-red-600 text-white font-bold border-none shadow-lg">
              #{anime.rank}
            </Badge>
          )}
          {anime.subOrDub && (
            <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white border-white/10 text-[10px] uppercase">
              {anime.subOrDub}
            </Badge>
          )}
        </div>

        {/* Action Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px] z-20"
            >
              <Button
                onClick={handleQuickPlay}
                size="icon"
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/40"
              >
                <Play className="w-7 h-7 fill-white ml-1" />
              </Button>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="rounded-full bg-zinc-800 hover:bg-zinc-700"
                  onClick={(e) => { e.stopPropagation(); onAdd?.(anime.id); }}
                >
                  {isInWatchlist ? <Check className="w-4 h-4 text-green-500" /> : <Plus className="w-4 h-4" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="rounded-full bg-zinc-800 hover:bg-zinc-700"
                  onClick={(e) => { e.stopPropagation(); navigate(`/watch/${anime.id}`); }}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title & Info Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-red-500 transition-colors leading-tight">
            {anime.title}
          </h3>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {anime.releaseDate || 'TV'}
            </span>
            {anime.type && <span>{anime.type}</span>}
          </div>
        </div>

        {/* Progress Bar (Professional Visual for History) */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" 
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
}