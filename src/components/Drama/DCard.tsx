"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Play, Plus, Star } from 'lucide-react';
import { DramaCard } from '@/lib/omni';
import CountryBadge from './CountryBadge';

const DCard = memo(({ item }: { item: DramaCard }) => {
  return (
    <div className="group relative flex flex-col shrink-0 w-full transition-all duration-300 hover:z-50 hover:scale-105 origin-center touch-manipulation">
      <div 
        className="aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#0f172a] relative shadow-lg group-hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] group-hover:ring-2 group-hover:ring-cyan-400/60 transition-all cursor-pointer" 
        onClick={() => window.location.href = `/drama-watch/${item.id}`}
      >
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cyan-900"><Play size={24} /></div>
        )}
        
        {/* Country Badge with crisp vector SVG flag */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <CountryBadge country={item.country} type={item.type} />
        </div>

        {/* Episode Badge (Top Right) */}
        {item.episode && (
          <div className="absolute top-2.5 right-2.5 bg-cyan-500 text-black px-2 py-0.5 rounded-full font-black text-[9px] z-20 shadow-md">
            EP {item.episode}
          </div>
        )}

        {/* Permanent & Hover Info Overlay */}
        <div className="absolute inset-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent pb-4 z-10">
          <div className="mb-3">
            <h3 className="text-xs md:text-sm font-black text-white line-clamp-2 leading-tight drop-shadow-md mb-1">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-cyan-200/80 uppercase tracking-widest">
              {item.year && <span className="bg-white/10 px-1.5 py-0.5 rounded-full border border-white/5">{item.year}</span>}
              <span className="text-yellow-400 flex items-center gap-0.5"><Star size={9} fill="currentColor"/> 8.5</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all active:scale-90">
              <Play size={14} fill="black" className="ml-0.5" />
            </button>
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all ml-auto active:scale-90" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DCard.displayName = "DCard";
export default DCard;
