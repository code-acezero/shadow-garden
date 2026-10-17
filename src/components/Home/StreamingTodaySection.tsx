"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Radio, ChevronRight, ChevronLeft, Clock, Play, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { getSafeImageUrl, slugifyTitle } from '@/lib/utils';

interface StreamingTodayProps {
  initialItems?: any[];
}

export default function StreamingTodaySection({ initialItems = [] }: StreamingTodayProps) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [audioTab, setAudioTab] = useState<'all' | 'sub' | 'hi'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);

  const nowSec = Math.floor(Date.now() / 1000);

  useEffect(() => {
    let isSubscribed = true;
    const fetchToday = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/anime/airing-today?page=${page}&perPage=12&releasedOnly=true&audio=${audioTab}`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok) {
            const list = Array.isArray(data.results) ? data.results : (data.results?.items || []);
            setItems(list);
            if (data.pageInfo) {
              setTotalPages(data.pageInfo.totalPages || 1);
              setHasNextPage(!!data.pageInfo.hasNextPage);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load episodes streaming today:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchToday();
    return () => { isSubscribed = false; };
  }, [page, audioTab]);

  // Strictly filter to only anime that has aired / been released today (allow items without airingAt or already aired)
  const rawSafeItems = (Array.isArray(items) ? items : []).filter(anime => !anime.airingAt || anime.airingAt <= nowSec);
  const seenKeys = new Set<string>();
  const safeItems = rawSafeItems.filter(anime => {
    const k = `${anime.id}-${anime.episode}-${anime.isHindi ? 'hi' : 'sub'}`;
    if (seenKeys.has(k)) return false;
    seenKeys.add(k);
    return true;
  });
  if (!loading && safeItems.length === 0 && audioTab === 'all') return null;

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <Radio className="w-7 h-7 md:w-9 md:h-9 text-emerald-400 shrink-0 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
          <h2 className="text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2">
            STREAMING <span className="text-emerald-400">TODAY</span>
          </h2>
        </div>

        {/* Audio Tabs & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setAudioTab('all'); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${audioTab === 'all' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => { setAudioTab('sub'); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${audioTab === 'sub' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
            >
              Sub Airing
            </button>
            <button
              onClick={() => { setAudioTab('hi'); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${audioTab === 'hi' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-zinc-400 hover:text-white'}`}
            >
              Hindi Dub
            </button>
          </div>

          {/* Simple Page Number & Arrow Buttons */}
          <span className="text-xs font-semibold text-zinc-400 select-none">
            <span className="text-white font-bold">{page}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading || !hasNextPage}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Link
            href="/schedule"
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Full Schedule</span>
            <ChevronRight size={12} className="text-emerald-400" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : safeItems.length === 0 ? (
        <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-400 text-xs font-mono">
          No releases recorded today for this category yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
          {safeItems.map((anime, idx) => {
            const airTime = anime.airingAt
              ? new Date(anime.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            const titleStr = typeof anime.title === 'string' ? anime.title : (anime.title?.english || anime.title?.romaji || anime.title?.native || 'Unknown Anime');
            const slug = slugifyTitle(titleStr);
            const routeId = (slug && !String(anime.id).includes('-')) ? `${anime.id}-${slug}` : anime.id;
            const targetHref = anime.watchUrl || `/watch/${routeId}?ep=${anime.episode || 1}&audio=${anime.isHindi ? 'hi' : 'jp'}`;

            return (
              <Link
                key={`${anime.id}-${anime.episode}-${anime.isHindi ? 'hi' : 'sub'}-${idx}`}
                href={targetHref}
                className="group relative flex flex-col rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 p-2.5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:-translate-y-1"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/40">
                  <img
                    src={getSafeImageUrl(anime.poster || anime.image)}
                    alt={titleStr}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top-Left: Anime Media Type */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-white font-mono font-black text-[9px] uppercase shadow-sm">
                      {(anime.type || 'TV').toUpperCase()}
                    </span>
                  </div>

                  {/* Top-Center: Rating */}
                  {anime.score && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-yellow-500/40 text-yellow-400 font-mono font-black text-[9px] shadow-sm select-none">
                        ★ {anime.score}
                      </span>
                    </div>
                  )}

                  {/* Bottom Badges: Episode and Hindi Dub Indicator */}
                  <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                    {anime.isHindi && (
                      <span className="px-1.5 py-0.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono font-black text-[9px] uppercase shadow-sm">
                        {anime.dubType === 'ORG' ? 'ORG' : 'HINDI'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-white font-mono font-black text-[10px] uppercase backdrop-blur-md">
                      EP {anime.episode || '?'}
                    </span>
                  </div>

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transform group-hover:scale-110 transition-transform">
                      <Play size={18} className="fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-2.5 flex flex-col flex-1 justify-between gap-1">
                  <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                    {titleStr}
                  </h3>

                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-zinc-500 font-mono">Today</span>
                    {airTime && (
                      <span className="text-zinc-400 font-mono text-[9px] flex items-center gap-1">
                        <Clock size={9} className="text-emerald-400" />
                        {airTime}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

