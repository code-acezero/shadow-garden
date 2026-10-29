import React, { memo } from 'react';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playGummyTap } from '@/lib/audioManager';

export const MediaCard = memo(({ item, theme }: { item: any; theme: string }) => {
  let countryTag = item.country || '';
  if (!countryTag && item.type) {
    if (item.type.toLowerCase().includes('korea')) countryTag = 'South Korea';
    else if (item.type.toLowerCase().includes('china') || item.type.toLowerCase().includes('chinese')) countryTag = 'China';
    else if (item.type.toLowerCase().includes('japan')) countryTag = 'Japan';
    else if (item.type.toLowerCase().includes('turkey') || item.type.toLowerCase().includes('turkish')) countryTag = 'Turkey';
    else if (item.type.toLowerCase().includes('thai')) countryTag = 'Thailand';
  }

  const isDrama = theme === 'cyan';
  const themeColors = isDrama ? {
    ringHover: 'group-hover:border-cyan-500/40',
    shadowHover: 'group-hover:shadow-[0_16px_40px_rgba(34,211,238,0.25)]',
    textMain: 'text-cyan-200/80',
    typeBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    btnBg: 'bg-cyan-500 hover:bg-cyan-400',
    btnShadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]'
  } : {
    ringHover: 'group-hover:border-emerald-500/40',
    shadowHover: 'group-hover:shadow-[0_16px_40px_rgba(16,185,129,0.25)]',
    textMain: 'text-emerald-200/80',
    typeBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400',
    btnShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]'
  };

  const href = isDrama ? `/stream/${item.id}` : `/stream/${item.id}?type=movie`;

  return (
    <div className="relative w-full aspect-[2/3] group z-0 hover:z-50 touch-manipulation select-none">
      <div className={cn("w-full h-full relative rounded-[22px] sm:rounded-[24px] overflow-hidden bg-[#0c1322] border border-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300 will-change-transform", themeColors.shadowHover, themeColors.ringHover)}>
        <Link 
          href={href} 
          onClick={() => playGummyTap()}
          className="block w-full h-full relative"
        >
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover transform-gpu transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform" 
              loading="lazy" 
              decoding="async" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-[#0e1628]"><Play size={24} /></div>
          )}
          
          {/* Dual subtle gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Top-Left: Country / Category badge */}
          {countryTag && (
            <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
              <span className="h-5 px-2 flex items-center justify-center rounded-full bg-[#0e1628]/95 border border-white/15 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
                <span>{countryTag}</span>
              </span>
            </div>
          )}

          {/* Top-Right: Episode badge */}
          {item.episode && (
            <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
              <span className={cn("h-5 px-2 flex items-center justify-center rounded-full text-black font-black text-[9px] uppercase tracking-wider shadow-sm", isDrama ? "bg-cyan-400" : "bg-emerald-400")}>
                EP {item.episode}
              </span>
            </div>
          )}

          {/* Center Hover Action */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex pointer-events-none">
            <div className={cn("w-12 h-12 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center text-black transition-transform duration-200 group-hover:scale-105", themeColors.btnBg, themeColors.btnShadow)}>
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Content Area */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 z-20 flex flex-col gap-1.5 justify-end pointer-events-none">
            <h3 className="text-xs sm:text-[13px] font-black text-white leading-snug line-clamp-2 drop-shadow-md group-hover:text-cyan-300 transition-colors duration-200">
              {item.title}
            </h3>

            <div className="flex items-center justify-between gap-1 w-full overflow-hidden text-[9px] font-bold">
              <div className="flex items-center gap-1.5">
                {item.year && (
                  <span className="h-5 px-2 rounded-full bg-[#0e1628]/95 border border-white/15 text-zinc-300 uppercase text-[8.5px] flex items-center justify-center">
                    {item.year}
                  </span>
                )}
                {item.type && !item.type.includes(countryTag) && (
                  <span className={cn("h-5 px-2 rounded-full border text-[8.5px] uppercase flex items-center justify-center", themeColors.typeBadge)}>
                    {item.type}
                  </span>
                )}
              </div>

              {item.rating && (
                <div className="flex items-center gap-0.5 h-5 px-2 rounded-full bg-[#0c1322]/95 border border-amber-400/30 text-amber-300 font-black shadow-sm shrink-0">
                  <Star size={9} className="fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
});
MediaCard.displayName = "MediaCard";
