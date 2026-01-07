import React, { useState } from 'react';
import { Star, Plus, Check, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConsumetAnime } from '@/lib/api'; // Updated import

interface AnimeCardProps {
  anime: ConsumetAnime; // Use the new interface
  onWatch?: () => void;
  onAddToWatchlist?: (status: string) => void;
  isInWatchlist?: boolean;
  showProgress?: boolean;
  progress?: number;
  variant?: 'default' | 'large' | 'compact';
}

export default function AnimeCard({
  anime,
  onWatch,
  onAddToWatchlist,
  isInWatchlist = false,
  showProgress = false,
  progress = 0,
  variant = 'default'
}: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const cardClasses = {
    default: 'w-full max-w-sm',
    large: 'w-full max-w-md',
    compact: 'w-full max-w-xs'
  };

  const imageClasses = {
    default: 'h-72',
    large: 'h-80',
    compact: 'h-60'
  };

  return (
    <Card
      className={`${cardClasses[variant]} bg-gray-900/50 border-gray-700 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20 backdrop-blur-sm group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Anime Poster - Updated to anime.image */}
        <div className={`relative ${imageClasses[variant]} overflow-hidden`}>
          <img
            src={anime.image}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/000000/FFFFFF?text=Shadow+Garden';
            }}
          />
          
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-60'
          }`} />

          {/* Rank Badge (New for Spotlight) */}
          {anime.rank && (
            <Badge className="absolute top-2 right-2 bg-red-600 text-white">
              #{anime.rank}
            </Badge>
          )}

          {/* Sub/Dub Badge - Updated for Consumet schema */}
          {anime.subOrDub && (
            <Badge className="absolute top-2 left-2 bg-black/80 text-white border-none uppercase text-[10px]">
              {anime.subOrDub}
            </Badge>
          )}

          {/* Progress Bar logic */}
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {/* Hover Actions */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex space-x-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onWatch?.();
                }}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white rounded-full h-10 w-10 p-0"
              >
                <Play className="w-5 h-5 fill-current" />
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWatchlist?.('plan_to_watch');
                }}
                size="sm"
                variant="outline"
                className={`rounded-full h-10 w-10 p-0 border-white/20 ${
                  isInWatchlist ? 'bg-green-600 text-white border-none' : 'bg-gray-800/80 text-white'
                }`}
              >
                {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          {/* Title - Updated to anime.title */}
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1 group-hover:text-red-500 transition-colors">
            {anime.title}
          </h3>

          {/* Info - Simplified for Consumet lists */}
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {anime.releaseDate || 'TV'}
            </span>
            {/* Displaying Episode count if available from Info API */}
            {anime.subOrDub && (
              <span className="text-red-500 font-medium">
                {anime.subOrDub.toUpperCase()}
              </span>
            )}
          </div>

          {/* Large variant Description - Updated to anime.description */}
          {variant === 'large' && anime.description && (
            <p className="text-gray-400 text-xs mt-2 line-clamp-2 italic">
              {anime.description}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  );
}