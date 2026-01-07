import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Clock, Mic, Captions, Layers, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConsumetAnime } from '@/lib/api';

// --- INTERFACE UPDATE ---
interface ExtendedAnime extends ConsumetAnime {
  episodeId?: string;
  episodeNumber?: number;
  // New fields based on your request
  nsfw?: boolean;
  sub?: number;
  dub?: number;
  episodes?: number;
  duration?: string;
  japaneseTitle?: string;
}

interface AnimeCardProps {
  anime: ConsumetAnime;
  isInWatchlist?: boolean;
  progress?: number;
  variant?: 'default' | 'compact';
  onAdd?: (id: string) => void;
  // Prop to force title language, or you can use a global store inside
  useJapaneseTitle?: boolean; 
}

export default function AnimeCard({ 
  anime, 
  isInWatchlist = false, 
  progress = 0, 
  variant = 'default',
  onAdd,
  useJapaneseTitle = false // Default to English, change based on your Settings
}: AnimeCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const data = anime as ExtendedAnime;

  // --- TITLE LOGIC ---
  // Switches between English and Japanese based on your setting
  const displayTitle = useJapaneseTitle 
    ? (data.japaneseTitle || data.title) 
    : data.title;

  const handleCardClick = () => {
    navigate(`/watch/${data.id}`);
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.episodeId) {
      navigate(`/watch/${data.id}?ep=${data.episodeId}`);
    } else {
      navigate(`/watch/${data.id}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full"
    >
      <Card
        onClick={handleCardClick}
        className={`
          relative overflow-hidden cursor-pointer bg-[#0a0a0a] border-white/5 
          transition-all duration-300 group
          ${isHovered ? 'ring-1 ring-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.2)]' : 'shadow-lg'}
          aspect-[2/3] rounded-xl
        `}
      >
        {/* --- IMAGE --- */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={data.image}
            alt={displayTitle}
            className={`
              w-full h-full object-cover transition-transform duration-700 ease-out
              ${isHovered ? 'scale-110 blur-[2px] brightness-[0.4]' : 'scale-100'}
            `}
            loading="lazy"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20 opacity-90" />

        {/* --- TOP BADGES --- */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
          {data.rank && (
            <Badge className="bg-red-600 text-white font-bold px-1.5 py-0 text-[10px] rounded-md shadow-lg">
              #{data.rank}
            </Badge>
          )}
        </div>

        {/* --- NSFW & STATUS TAGS (Top Right) --- */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {data.nsfw === true && (
            <Badge className="bg-red-600 text-white font-extrabold px-1.5 py-0 text-[10px] border border-red-400 rounded-sm">
              18+
            </Badge>
          )}
          {data.episodeNumber && (
            <Badge className="bg-white/90 text-black font-bold px-1.5 py-0 text-[10px] rounded-sm">
              EP {data.episodeNumber}
            </Badge>
          )}
        </div>

        {/* --- HOVER PLAY BUTTON --- */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-30"
            >
              <Button
                onClick={handleQuickPlay}
                size="icon"
                className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-pink-600 hover:scale-110 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-white/20"
              >
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- BOTTOM INFO AREA --- */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col gap-2">
          
          {/* Title */}
          <h3 className="text-sm font-bold text-gray-100 line-clamp-1 leading-tight drop-shadow-md group-hover:text-purple-400 transition-colors">
            {displayTitle}
          </h3>

          {/* --- GLOSSY DOCK STATS --- */}
          {/* This renders the stats provided in the prompt */}
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/5 rounded-lg p-1.5">
            
            {/* Left: Episodes & Duration */}
            <div className="flex items-center gap-2 text-[10px] text-gray-300 font-medium">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" />
                {data.episodes || '?'}
              </span>
              {data.duration && (
                <span className="flex items-center gap-1 border-l border-white/10 pl-2">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {data.duration}
                </span>
              )}
            </div>

            {/* Right: Sub/Dub Counts */}
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-1 rounded">
                <Captions className="w-3 h-3" />
                <span>{data.sub || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-1 rounded">
                <Mic className="w-3 h-3" />
                <span>{data.dub || 0}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 z-30">
            <div style={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_8px_red]" />
          </div>
        )}
      </Card>
    </motion.div>
  );
}