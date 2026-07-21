import React, { memo } from 'react';
import Link from 'next/link';
import { Play, Info, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MediaCard = memo(({ item, theme }: { item: any, theme: string }) => {
  let countryTag = item.country || '';
  if (!countryTag && item.type) {
    if (item.type.toLowerCase().includes('korea')) countryTag = 'South Korea';
    else if (item.type.toLowerCase().includes('china') || item.type.toLowerCase().includes('chinese')) countryTag = 'China';
    else if (item.type.toLowerCase().includes('japan')) countryTag = 'Japan';
    else if (item.type.toLowerCase().includes('turkey') || item.type.toLowerCase().includes('turkish')) countryTag = 'Turkey';
    else if (item.type.toLowerCase().includes('thai')) countryTag = 'Thailand';
  }

  let flag = '🌍';
  const cLower = countryTag.toLowerCase();
  if (cLower.includes('korea')) flag = '🇰🇷';
  else if (cLower.includes('china')) flag = '🇨🇳';
  else if (cLower.includes('japan')) flag = '🇯🇵';
  else if (cLower.includes('turkey')) flag = '🇹🇷';
  else if (cLower.includes('thai')) flag = '🇹🇭';
  else if (cLower.includes('india') || cLower.includes('bollywood')) flag = '🇮🇳';
  else if (cLower.includes('us') || cLower.includes('hollywood')) flag = '🇺🇸';

  const isDrama = theme === 'cyan';
  const themeColors = isDrama ? {
      ringHover: 'group-hover:ring-cyan-400/50',
      shadowHover: 'group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]',
      textMain: 'text-cyan-200/80',
      typeBadge: 'bg-cyan-500/20 text-cyan-300',
      btnBg: 'bg-cyan-500 hover:bg-cyan-400',
      btnShadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]'
  } : {
      ringHover: 'group-hover:ring-emerald-400/50',
      shadowHover: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
      textMain: 'text-emerald-200/80',
      typeBadge: 'bg-emerald-500/20 text-emerald-300',
      btnBg: 'bg-emerald-500 hover:bg-emerald-400',
      btnShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]'
  };

  const href = isDrama ? `/drama-watch/${item.id}` : `/movies-watch/${item.id}`;

  return (
    <Link href={href} className="group relative flex flex-col shrink-0 w-full sm:w-[160px] md:w-[200px] transition-all duration-300 hover:z-50 hover:scale-110 origin-bottom touch-manipulation block mx-auto">
      <div className={cn("aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#0f172a] relative shadow-lg transition-all", themeColors.shadowHover, "group-hover:ring-2", themeColors.ringHover)}>
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-800"><Play size={24} /></div>
        )}
        
        {countryTag && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 border border-white/10 z-10">
            <span className="text-[10px]">{flag}</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">{countryTag}</span>
          </div>
        )}

        {item.episode && (
          <div className={cn("absolute top-2 right-2 text-black px-1.5 py-0.5 rounded font-black text-[9px] z-10 shadow-md", isDrama ? "bg-cyan-500" : "bg-emerald-500")}>
            EP {item.episode}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col justify-end bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent h-2/3 md:h-1/2 transition-all">
          <div className="mt-auto group-hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-[11px] md:text-sm font-black text-white line-clamp-2 leading-tight drop-shadow-md mb-1.5 font-gradvis">{item.title}</h3>
              <div className={cn("flex flex-wrap items-center gap-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest", themeColors.textMain)}>
                  {item.year && <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">{item.year}</span>}
                  {item.type && !item.type.includes(countryTag) && <span className={cn("px-1.5 py-0.5 rounded", themeColors.typeBadge)}>{item.type}</span>}
                  {item.rating ? (
                     <span className="text-yellow-400 flex items-center gap-0.5"><Star size={8} fill="currentColor"/> {item.rating}</span>
                  ) : (
                     <span className="text-yellow-400 flex items-center gap-0.5"><Star size={8} fill="currentColor"/> 8.5</span>
                  )}
              </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 absolute bottom-3 md:bottom-4 left-3 right-3 md:left-4 md:right-4">
              <div className={cn("w-8 h-8 rounded-full text-black flex items-center justify-center transition-all", themeColors.btnBg, themeColors.btnShadow)}>
                  <Play size={14} fill="black" className="ml-0.5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all ml-auto" onClick={(e) => { e.preventDefault(); }}>
                  <Plus size={14} />
              </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
MediaCard.displayName = "MediaCard";
