import React, { useState } from 'react';
import { Star, Plus, Check, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AniwatchAnime } from '@/lib/api';

interface AnimeCardProps {
  anime: AniwatchAnime;
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
      className={`${cardClasses[variant]} bg-gray-900/50 border-gray-700 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20 backdrop-blur-sm`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Anime Poster */}
        <div className={`relative ${imageClasses[variant]} overflow-hidden`}>
          <img
            src={anime.poster}
            alt={anime.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-60'
          }`} />

          {/* Rating Badge */}
          {anime.rating && (
            <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
              <Star className="w-3 h-3 mr-1" />
              {anime.rating}
            </Badge>
          )}

          {/* Type Badge */}
          <Badge 
            className={`absolute top-2 left-2 ${
              anime.type === 'TV' ? 'bg-green-600' : 
              anime.type === 'Movie' ? 'bg-blue-600' : 
              anime.type === 'OVA' ? 'bg-purple-600' : 'bg-gray-600'
            } text-white`}
          >
            {anime.type}
          </Badge>

          {/* Progress Bar */}
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(progress / (anime.episodes?.sub || 1)) * 100}%` }}
              />
            </div>
          )}

          {/* Hover Actions */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex space-x-2">
              <Button
                onClick={onWatch}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Play className="w-4 h-4 mr-1" />
                Watch
              </Button>
              <Button
                onClick={() => onAddToWatchlist?.('plan_to_watch')}
                size="sm"
                variant="outline"
                className={`border-gray-600 ${
                  isInWatchlist ? 'bg-green-600 text-white' : 'bg-gray-800/80 text-white hover:bg-gray-700'
                }`}
              >
                {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">
            {anime.name}
          </h3>

          {/* Info */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {anime.type}
            </span>
            {anime.episodes && (
              <span>
                {anime.episodes.sub > 0 ? `${anime.episodes.sub} Sub` : ''}
                {anime.episodes.sub > 0 && anime.episodes.dub > 0 ? ' • ' : ''}
                {anime.episodes.dub > 0 ? `${anime.episodes.dub} Dub` : ''}
              </span>
            )}
          </div>

          {/* Duration and Rating */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            {anime.duration && (
              <span>{anime.duration}</span>
            )}
            {anime.rating && (
              <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                {anime.rating}
              </Badge>
            )}
          </div>

          {/* Description Preview */}
          {variant === 'large' && anime.description && (
            <p className="text-gray-400 text-xs mt-2 line-clamp-3">
              {anime.description}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  );
}