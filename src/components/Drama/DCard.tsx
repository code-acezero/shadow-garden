import React, { memo } from 'react';
import Link from 'next/link';
import { Play, Info, Plus } from 'lucide-react';
import { DramaCard } from '@/lib/omni';

const DCard = memo(({ item }: { item: DramaCard }) => {
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

  return (
    <div className="group relative flex flex-col shrink-0 w-full transition-all duration-300 hover:z-50 hover:scale-110 origin-bottom touch-manipulation">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#0f172a] relative shadow-lg group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] group-hover:ring-2 group-hover:ring-cyan-400/50 transition-all cursor-pointer" onClick={() => window.location.href = `/drama-watch/${item.id}`}>
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cyan-900"><Play size={24} /></div>
        )}
        
        {countryTag && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 border border-white/10 z-10">
            <span className="text-[10px]">{flag}</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">{countryTag}</span>
          </div>
        )}

        {item.episode && (
          <div className="absolute top-2 right-2 bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black text-[9px] z-10 shadow-md">
            EP {item.episode}
          </div>
        )}

        <div className="absolute inset-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent pb-4">
          <div className="mb-3">
              <h3 className="text-xs md:text-sm font-black text-white line-clamp-2 leading-tight drop-shadow-md mb-1">{item.title}</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-cyan-200/80 uppercase tracking-widest">
                  {item.year && <span className="bg-white/10 px-1 rounded">{item.year}</span>}
                  {item.type && !item.type.includes(countryTag) && <span>{item.type}</span>}
              </div>
          </div>
          <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
                  <Play size={14} fill="black" className="ml-0.5" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DCard.displayName = "DCard";
export default DCard;
