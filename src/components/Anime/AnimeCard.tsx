import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Clock, Mic, Captions, Layers, Star, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConsumetAnime, AnimeAPI_V2 } from '@/lib/api'; // Added AnimeAPI_V2
import { useSettings } from '@/hooks/useSettings';

interface ExtendedAnime extends ConsumetAnime {
  episodeId?: string;
  episodeNumber?: number;
  nsfw?: boolean;
  sub?: number;
  dub?: number;
  episodes?: number;
  duration?: string;
  japaneseTitle?: string;
  rank?: number;
}

interface AnimeCardProps {
  anime: ConsumetAnime;
  isInWatchlist?: boolean;
  progress?: number;
  variant?: 'default' | 'compact';
  onAdd?: (id: string) => void;
}

export default function AnimeCard({ 
  anime, 
  isInWatchlist = false, 
  progress = 0, 
  onAdd,
}: AnimeCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { settings } = useSettings();
  
  // QTip State
  const [qtipData, setQtipData] = useState<any>(null);
  const [loadingQtip, setLoadingQtip] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const data = anime as ExtendedAnime;

  const displayTitle = settings.useJapaneseTitle 
    ? (data.japaneseTitle || data.title) 
    : data.title;

  // Handle QTip Fetching with Debounce
  useEffect(() => {
    if (isHovered && !qtipData && !loadingQtip) {
      // Fetch only if hovered for 300ms to prevent spam
      hoverTimeout.current = setTimeout(async () => {
        setLoadingQtip(true);
        try {
          // Use V2 API for the rich hover info
          const res = await AnimeAPI_V2.getQtipInfo(data.id);
          if (res) setQtipData(res.anime || res); // Adapt based on API response structure
        } catch (error) {
          console.error("QTip fetch failed", error);
        } finally {
          setLoadingQtip(false);
        }
      }, 300);
    } else if (!isHovered) {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    }
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [isHovered, data.id, qtipData, loadingQtip]);

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (data.episodeId) {
      navigate(`/watch/${data.id}?ep=${data.episodeId}`);
    } else {
      navigate(`/watch/${data.id}`);
    }
  };

  // Liquid Squishy Animation Variants
  const popupVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      x: 20, 
      filter: "blur(10px)",
      borderRadius: "40px" // Very round initially
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      x: 0, 
      filter: "blur(0px)",
      borderRadius: "12px", // Normal roundness
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25, 
        mass: 0.8 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      filter: "blur(10px)",
      transition: { duration: 0.2 } 
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
      className="relative w-full h-full group perspective-1000" // perspective for 3d effects
    >
      <Link to={`/watch/${data.id}`} className="block h-full">
        <Card
          className={`
            relative overflow-hidden cursor-pointer bg-[#0a0a0a] border-white/5 
            transition-all duration-300 h-full
            ${isHovered ? 'ring-1 ring-red-600/50 shadow-[0_0_25px_rgba(220,38,38,0.2)]' : 'shadow-lg'}
            aspect-[2/3] rounded-xl z-10
          `}
        >
          {/* --- Image Layer --- */}
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

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20 opacity-90" />

          {/* --- Badges (Top Left) --- */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
            {data.rank && (
              <Badge className="bg-red-600 text-white font-bold px-1.5 py-0 text-[10px] rounded-md shadow-lg border-none">
                #{data.rank}
              </Badge>
            )}
          </div>

          {/* --- Badges (Top Right) --- */}
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

          {/* --- Quick Play Button --- */}
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
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 hover:scale-110 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-white/20 transition-all p-0 flex items-center justify-center"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- Info Footer --- */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-100 line-clamp-1 leading-tight drop-shadow-md group-hover:text-red-500 transition-colors">
              {displayTitle}
            </h3>

            <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/5 rounded-lg p-1.5">
              <div className="flex items-center gap-2 text-[10px] text-gray-300 font-medium">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-red-500" />
                  {data.episodes || '?'}
                </span>
                {data.duration && (
                  <span className="flex items-center gap-1 border-l border-white/10 pl-2">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {data.duration}
                  </span>
                )}
              </div>

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

          {/* --- Progress Bar --- */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 z-30">
              <div style={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_8px_red]" />
            </div>
          )}
        </Card>
      </Link>

      {/* =========================================================
          LIQUID GLASS QTIP POPUP (Rendering Outside the Card)
          ========================================================= */}
      <AnimatePresence>
        {isHovered && qtipData && (
          <motion.div
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-0 bottom-0 left-[105%] w-[280px] z-50 pointer-events-none hidden lg:block"
            // The pointer-events-none ensures hovering the popup doesn't break the parent hover state
          >
            {/* Glass Container */}
            <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-3">
              
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <h4 className="text-white font-bold text-lg leading-tight line-clamp-2">
                   {qtipData.name || displayTitle}
                </h4>
                <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-white/80 whitespace-nowrap">
                   {qtipData.type || 'TV'}
                </div>
              </div>

              {/* Japanese Title */}
              {(qtipData.jname || data.japaneseTitle) && (
                <div className="text-xs text-white/50 italic -mt-1 line-clamp-1">
                  {qtipData.jname || data.japaneseTitle}
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap gap-2 text-xs font-medium text-white/80">
                 {qtipData.stats?.rating && (
                   <span className="flex items-center gap-1 text-yellow-400">
                     <Star className="w-3 h-3 fill-yellow-400" /> {qtipData.stats.rating}
                   </span>
                 )}
                 {qtipData.stats?.quality && (
                   <span className="bg-red-600/20 text-red-400 px-1.5 rounded border border-red-600/20">
                     {qtipData.stats.quality}
                   </span>
                 )}
                 <span className="flex items-center gap-1 text-blue-300">
                    <Clock className="w-3 h-3" /> {qtipData.stats?.duration || '24m'}
                 </span>
              </div>

              {/* Description */}
              <div className="flex-1 overflow-hidden relative">
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-6">
                  {qtipData.description || "No description available."}
                </p>
                {/* Fade at bottom of text */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Metadata Footer */}
              <div className="space-y-2 mt-auto pt-3 border-t border-white/5">
                {qtipData.genres && (
                  <div className="flex flex-wrap gap-1.5">
                    {qtipData.genres.slice(0, 3).map((g: string) => (
                      <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/5">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                   <span>{qtipData.moreInfo?.aired || 'Unknown Date'}</span>
                   <span className="uppercase tracking-wider">{qtipData.moreInfo?.status || 'Unknown'}</span>
                </div>
              </div>

              {/* Decorative Liquid Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-600/20 blur-[50px] rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}