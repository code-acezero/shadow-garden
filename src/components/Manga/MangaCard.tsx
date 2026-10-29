"use client";

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, BookOpen, Layers } from 'lucide-react';
import { ReadingItem, formatChapterBadge } from '@/lib/manga';
import { playGummyTap } from '@/lib/audioManager';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  manga: { label: 'MANGA', color: 'bg-rose-500/80 text-white', border: 'border-rose-400/40' },
  manhwa: { label: 'MANHWA', color: 'bg-indigo-500/80 text-white', border: 'border-indigo-400/40' },
  manhua: { label: 'MANHUA', color: 'bg-emerald-500/80 text-white', border: 'border-emerald-400/40' },
  comic: { label: 'COMIC', color: 'bg-amber-500/80 text-white', border: 'border-amber-400/40' },
  webtoon: { label: 'WEBTOON', color: 'bg-purple-500/80 text-white', border: 'border-purple-400/40' },
  light_novel: { label: 'NOVEL', color: 'bg-cyan-500/80 text-white', border: 'border-cyan-400/40' },
  web_novel: { label: 'WEB NOVEL', color: 'bg-blue-500/80 text-white', border: 'border-blue-400/40' },
};

function MangaCardComponent({ item, activeLang }: { item: ReadingItem; activeLang?: string }) {
  const typeStyle = TYPE_CONFIG[item.type] || TYPE_CONFIG.manga;
  const isNovel = item.isNovel || item.type === 'light_novel' || item.type === 'web_novel';

  const rawCover = item.cover || (item as any).coverImage || '/images/no-poster.png';
  const coverSrc = rawCover.includes('mangadex.org')
    ? `/api/proxy?url=${encodeURIComponent(rawCover)}&referer=https://mangadex.org/`
    : rawCover;

  const [imgSrc, setImgSrc] = useState(coverSrc);

  useEffect(() => {
    setImgSrc(coverSrc);
  }, [coverSrc]);

  return (
    <div className="relative w-full aspect-[2/3] group z-0 hover:z-50 touch-manipulation">
      <div className="w-full h-full relative rounded-[22px] sm:rounded-[24px] overflow-hidden bg-[#0c1322] border border-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.95)] hover:border-violet-500/40 will-change-transform">
        <Link 
          href={`/manga/${item.id}`}
          onClick={() => playGummyTap()}
          className="block w-full h-full relative select-none"
        >
          {/* Cover Poster Image with smooth hover zoom */}
          <div className="absolute inset-0 overflow-hidden rounded-[22px] sm:rounded-[24px]">
            <Image
              src={imgSrc}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover transform-gpu transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
              unoptimized={imgSrc.includes('mangadex.org') || imgSrc.includes('/api/proxy') || imgSrc.includes('anilist.co')}
              onError={() => {
                if (imgSrc !== '/images/no-poster.png') {
                  setImgSrc('/images/no-poster.png');
                }
              }}
            />
            {/* Deep Sleek Gradient Overlays for optimal readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>

          {/* Top-Left: Type Badge (MANGA, MANHWA, NOVEL, etc.) */}
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className={cn(
              "h-5 px-2 flex items-center justify-center rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border shadow-sm",
              typeStyle.color,
              typeStyle.border
            )}>
              {typeStyle.label}
            </span>
          </div>

          {/* Top-Right: Language / Format badges */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 pointer-events-none">
            {activeLang && activeLang !== 'all' && activeLang !== 'en' && item.availableLanguages?.includes(activeLang) && (
              <span className="h-5 px-1.5 flex items-center justify-center rounded-full bg-violet-600 text-white border border-violet-400 text-[9px] font-black uppercase tracking-wider shadow-sm">
                {activeLang.toUpperCase()}
              </span>
            )}
            {item.availableLanguages?.includes('hi') && activeLang !== 'hi' && (
              <span className="h-5 px-1.5 flex items-center justify-center rounded-full bg-orange-500/90 text-white border border-orange-400 text-[9px] font-black uppercase tracking-wider shadow-sm" title="Hindi Available">
                HI
              </span>
            )}
            {item.availableLanguages?.includes('bn') && activeLang !== 'bn' && (
              <span className="h-5 px-1.5 flex items-center justify-center rounded-full bg-emerald-500/90 text-white border border-emerald-400 text-[9px] font-black uppercase tracking-wider shadow-sm" title="Bengali Available">
                BN
              </span>
            )}
            <span className="h-5 px-1.5 flex items-center justify-center rounded-full bg-[#0c1322]/90 text-zinc-300 border border-white/15 text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm" title="English Available">
              EN
            </span>
          </div>

          {/* Center Hover Action: Sleek Read/Open Glassmorphic Capsule */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-violet-600/90 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-transform duration-200 group-hover:scale-105">
              {isNovel ? <BookOpen size={20} className="text-white" /> : <Layers size={20} className="text-white" />}
            </div>
          </div>

          {/* Bottom Content Area */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 z-20 flex flex-col gap-1.5 justify-end pointer-events-none">
            <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug line-clamp-2 drop-shadow-md group-hover:text-violet-300 transition-colors duration-200">
              {item.title}
            </h3>

            <div className="flex items-center justify-between gap-1 w-full overflow-hidden text-[9px] font-bold">
              {/* Left: Latest chapter or read status */}
              <div className="flex items-center gap-1 h-5 px-2 rounded-full bg-[#0e1628]/95 border border-white/15 shadow-sm text-zinc-300 min-w-0">
                {isNovel ? <BookOpen size={10} className="text-cyan-400 shrink-0" /> : <Layers size={10} className="text-violet-400 shrink-0" />}
                <span className="text-white font-bold truncate">{formatChapterBadge(item.latestChapter)}</span>
              </div>

              {/* Right: Score or Status / Year */}
              <div className="flex items-center gap-1.5 shrink-0">
                {item.score && (
                  <div className="flex items-center gap-0.5 h-5 px-2 rounded-full bg-[#0c1322]/95 border border-amber-400/30 text-amber-300 font-black shadow-sm">
                    <Star size={9} className="fill-amber-400 text-amber-400" />
                    <span>{item.score}</span>
                  </div>
                )}
                <div className="h-5 px-2 rounded-full bg-[#0e1628]/95 border border-white/15 text-zinc-400 uppercase text-[8.5px] flex items-center justify-center">
                  {item.year || item.status}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

const MangaCard = memo(MangaCardComponent);
export default MangaCard;

