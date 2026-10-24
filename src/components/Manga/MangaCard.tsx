"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, BookOpen, Layers, Globe } from 'lucide-react';
import { ReadingItem } from '@/lib/manga';
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

export default function MangaCard({ item }: { item: ReadingItem }) {
  const typeStyle = TYPE_CONFIG[item.type] || TYPE_CONFIG.manga;
  const isNovel = item.isNovel || item.type === 'light_novel' || item.type === 'web_novel';

  return (
    <Link 
      href={`/manga/${item.id}`}
      className="group relative flex flex-col w-full h-full rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-violet-500/40 hover:bg-white/[0.06] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(139,92,246,0.2)] active:scale-[0.98]"
    >
      {/* Cover Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950 rounded-2xl">
        <Image
          src={item.cover || '/images/placeholder.jpg'}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transform-gpu transition-transform duration-500 group-hover:scale-105 will-change-transform"
          unoptimized={item.cover?.includes('mangadex.org') || item.cover?.includes('anilist.co')}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          <span className={cn(
            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md backdrop-blur-md border shadow-sm tracking-wider",
            typeStyle.color,
            typeStyle.border
          )}>
            {typeStyle.label}
          </span>
        </div>

        {/* Language Badges (Top Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {item.availableLanguages.includes('hi') && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-500/90 text-white border border-orange-400/50 shadow-sm" title="Hindi Available">
              HI
            </span>
          )}
          {item.availableLanguages.includes('bn') && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/90 text-white border border-emerald-400/50 shadow-sm" title="Bengali Available">
              BN
            </span>
          )}
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 border border-white/10 backdrop-blur-md" title="English Main">
            EN
          </span>
        </div>

        {/* Bottom Overlay Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

        {/* Rating and Chapter Floating Info */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-xs font-semibold z-10">
          {item.score && (
            <div className="flex items-center gap-1 text-amber-300 bg-black/60 px-2 py-0.5 rounded-full border border-amber-400/20 backdrop-blur-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold">{item.score}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-zinc-300 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm ml-auto">
            {isNovel ? <BookOpen size={11} className="text-cyan-400" /> : <Layers size={11} className="text-violet-400" />}
            <span className="text-[10px] font-bold">{item.latestChapter || 'Read'}</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
            {item.title}
          </h3>
          {item.genres && item.genres.length > 0 && (
            <p className="text-[11px] font-medium text-zinc-400 line-clamp-1">
              {item.genres.slice(0, 3).join(' • ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px] text-zinc-400">
          <span className="capitalize">{item.status}</span>
          {item.year && <span>{item.year}</span>}
        </div>
      </div>
    </Link>
  );
}
