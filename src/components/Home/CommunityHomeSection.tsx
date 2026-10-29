"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MessageSquare, ChevronRight, Eye, ShieldCheck, 
  Clapperboard, Tv, Flame, Compass, Languages, Layers,
  LucideIcon 
} from 'lucide-react';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import { playGummyTap, playGummyPop } from '@/lib/audioManager';
import { cn } from '@/lib/utils';

export interface GlobalComment {
  id: string;
  content: string;
  created_at: string;
  episode_id: string;
  is_spoiler: boolean;
  user_name: string;
  user_avatar: string;
  user_role: string;
  is_traveler: boolean;
  media_title?: string;
  media_type?: 'Anime' | 'Donghua' | 'Hindi Anime' | 'Movie' | 'Series' | 'Drama';
  episode_number?: number | string;
  watch_url?: string;
}

// Fallback comments if remote database returns empty, representing all media realms
const FALLBACK_COMMENTS: GlobalComment[] = [
  {
    id: 'sg-c1',
    content: "The plot twists in this season are completely unhinged! Master Shadow's nuclear incantation scene had me screaming at 2 AM.",
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    episode_id: 'the-eminence-in-shadow-ep-20',
    media_title: 'The Eminence in Shadow',
    media_type: 'Anime',
    episode_number: 20,
    watch_url: '/watch/the-eminence-in-shadow?ep=20',
    is_spoiler: false,
    user_name: 'Alpha_Zero',
    user_avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b161715-6XG3kQxS667Y.jpg',
    user_role: 'Guild Master',
    is_traveler: false,
  },
  {
    id: 'sg-c2',
    content: "The Hindi dub quality on this release is peak cinema. Props to the voice actors for nailing the emotional nuances in this turning point!",
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    episode_id: 'mushoku-tensei-jobless-reincarnation-ep-12',
    media_title: 'Mushoku Tensei',
    media_type: 'Hindi Anime',
    episode_number: 12,
    watch_url: '/hindi-watch/mushoku-tensei-jobless-reincarnation?ep=12',
    is_spoiler: false,
    user_name: 'CidKagenou',
    user_avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b185874-9bC623uMhG9n.jpg',
    user_role: 'Operative',
    is_traveler: false,
  },
  {
    id: 'sg-c3',
    content: "The cinematography in this Korean drama is hauntingly beautiful. The courtroom confrontation in episode 2 gave me chills.",
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    episode_id: 'drama-teach-you-a-lesson-ep-2',
    media_title: 'Teach You a Lesson',
    media_type: 'Drama',
    episode_number: 2,
    watch_url: '/drama-watch/teach-you-a-lesson?ep=2',
    is_spoiler: false,
    user_name: 'K_Drifter',
    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
    user_role: 'Traveler',
    is_traveler: true,
  },
  {
    id: 'sg-c4',
    content: "The sound design during the sword clashes with Dolby Atmos headphone simulation is mindblowing on the new player.",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    episode_id: 'donghua-renegade-immortal-ep-45',
    media_title: 'Renegade Immortal',
    media_type: 'Donghua',
    episode_number: 45,
    watch_url: '/donghua-watch/renegade-immortal?ep=45',
    is_spoiler: false,
    user_name: 'DeltaBlade',
    user_avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b207191-8W94f0J1oPqQ.jpg',
    user_role: 'Operative',
    is_traveler: false,
  },
  {
    id: 'sg-c5',
    content: "WARNING: Do NOT skip the post-credit sequence. The foreshadowing for the next arc connects right to the light novel volume 6.",
    created_at: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    episode_id: 'solo-leveling-ep-12',
    media_title: 'Solo Leveling',
    media_type: 'Anime',
    episode_number: 12,
    watch_url: '/watch/solo-leveling?ep=12',
    is_spoiler: true,
    user_name: 'ShadowFang',
    user_avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b204436-xO1pG2Q4xH2P.png',
    user_role: 'Traveler',
    is_traveler: true,
  },
  {
    id: 'sg-c6',
    content: "This movie broke me in the best way possible. That VHS tape rewind montage at the ending had everyone in tears.",
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    episode_id: 'movie-20th-century-girl',
    media_title: '20th Century Girl',
    media_type: 'Movie',
    watch_url: '/movies-watch/20th-century-girl',
    is_spoiler: false,
    user_name: 'CinemaLover',
    user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop',
    user_role: 'Traveler',
    is_traveler: true,
  },
  {
    id: 'sg-c7',
    content: "The hospital blackout episode was so intense! Classic high-stakes medical drama tension at its finest.",
    created_at: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    episode_id: 'series-greys-anatomy-ep-4',
    media_title: "Grey's Anatomy",
    media_type: 'Series',
    episode_number: 4,
    watch_url: '/series-watch/greys-anatomy?ep=4',
    is_spoiler: false,
    user_name: 'NightOwl',
    user_avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b205177-hLV4nVQjoBIC.png',
    user_role: 'Operative',
    is_traveler: false,
  },
  {
    id: 'sg-c8',
    content: "10/10 adaptation. They actually fixed the pacing issue from chapter 45 and expanded the lore beautifully.",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    episode_id: 'blue-box-ep-8',
    media_title: 'Blue Box',
    media_type: 'Anime',
    episode_number: 8,
    watch_url: '/watch/blue-box?ep=8',
    is_spoiler: false,
    user_name: 'GammaTactics',
    user_avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b209895-7hN6pW1qXzZa.jpg',
    user_role: 'Operative',
    is_traveler: false,
  },
];

function timeAgo(dateString: string): string {
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

function parseCommentSource(comment: GlobalComment): {
  title: string;
  type: string;
  epLabel: string | null;
  watchUrl: string;
  Icon: LucideIcon;
} {
  if (comment.media_title) {
    const type = comment.media_type || 'Anime';
    const isMovie = type === 'Movie';
    const epLabel = comment.episode_number ? `Ep ${comment.episode_number}` : (isMovie ? 'Movie' : null);
    
    let Icon = Flame;
    if (type === 'Movie') Icon = Clapperboard;
    else if (type === 'Drama') Icon = Tv;
    else if (type === 'Series') Icon = Layers;
    else if (type === 'Donghua') Icon = Compass;
    else if (type === 'Hindi Anime') Icon = Languages;

    return {
      title: comment.media_title,
      type,
      epLabel,
      watchUrl: comment.watch_url || (comment.episode_id.startsWith('/') ? comment.episode_id : `/watch/${comment.episode_id}`),
      Icon
    };
  }

  const rawId = comment.episode_id || '';
  let cleanId = rawId;
  let epNum: string | null = null;

  // Extract :: delimiter (e.g. 184694::1 or 1::1)
  if (rawId.includes('::')) {
    const parts = rawId.split('::');
    cleanId = parts[0];
    epNum = parts[1] || '1';
  }

  // Extract ?ep= or -ep- or &ep=
  const epMatch = rawId.match(/[?&]ep=(\d+)/i) || rawId.match(/-ep-(\d+)/i) || rawId.match(/episode[_-](\d+)/i);
  if (epMatch) {
    epNum = epMatch[1];
    cleanId = cleanId.replace(/[?&]ep=\d+/i, '').replace(/-ep-\d+/i, '').replace(/episode[_-]\d+/i, '');
  }

  // Determine media type & route
  let type = 'Anime';
  let routePrefix = '/watch/';
  let Icon = Flame;

  if (cleanId.startsWith('movie-') || cleanId.includes('movie')) {
    type = 'Movie';
    routePrefix = '/movies-watch/';
    cleanId = cleanId.replace(/^movie-/, '');
    Icon = Clapperboard;
  } else if (cleanId.startsWith('drama-') || cleanId.includes('kdrama') || cleanId.includes('cdrama')) {
    type = 'Drama';
    routePrefix = '/drama-watch/';
    cleanId = cleanId.replace(/^drama-/, '');
    Icon = Tv;
  } else if (cleanId.startsWith('series-')) {
    type = 'Series';
    routePrefix = '/series-watch/';
    cleanId = cleanId.replace(/^series-/, '');
    Icon = Layers;
  } else if (cleanId.startsWith('donghua-') || ['renegade-immortal', 'lord-of-mysteries', 'link-click', 'dawang-raoming', 'super-cube'].some(s => cleanId.includes(s))) {
    type = 'Donghua';
    routePrefix = '/donghua-watch/';
    cleanId = cleanId.replace(/^donghua-/, '');
    Icon = Compass;
  } else if (cleanId.startsWith('hindi-') || cleanId.includes('hindi')) {
    type = 'Hindi Anime';
    routePrefix = '/hindi-watch/';
    cleanId = cleanId.replace(/^hindi-/, '');
    Icon = Languages;
  }

  // Format slug to readable title
  let title = cleanId
    .replace(/_/g, ' ')
    .split('?')[0]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim() || 'Featured Title';

  if (cleanId === '184694' || title === '184694') {
    title = 'Dan Da Dan';
  } else if (title === '1:1' || title === '1' || /^\d+$/.test(title)) {
    title = 'Solo Leveling';
  }

  const isMovie = type === 'Movie';
  const epLabel = epNum ? `Ep ${epNum}` : (isMovie ? 'Movie' : null);
  const watchUrl = `${routePrefix}${cleanId}${epNum ? `?ep=${epNum}` : ''}`;

  return { title, type, epLabel, watchUrl, Icon };
}

export default function CommunityHomeSection() {
  const [allComments, setAllComments] = useState<GlobalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const PER_PAGE = 6;
  const maxPage = Math.max(1, Math.ceil(allComments.length / PER_PAGE));
  const currentPageComments = allComments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    let isSubscribed = true;
    async function fetchGlobalComments() {
      try {
        const res = await fetch('/api/comments/global?limit=24');
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok && Array.isArray(data.comments) && data.comments.length > 0) {
            setAllComments(data.comments);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load live comments, using sanctuary archives:', err);
      }
      if (isSubscribed) {
        setAllComments(FALLBACK_COMMENTS);
        setLoading(false);
      }
    }
    fetchGlobalComments();
    return () => { isSubscribed = false; };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > maxPage) return;
    setPage(newPage);
  };

  const toggleSpoiler = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playGummyPop();
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="w-full my-4 md:my-8 relative z-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile Explore Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3.5 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <MonetLineIcon icon={MessageSquare} variant="purple" />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate">
              COMMUNITY
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Explore Button */}
          <Link
            href="/social"
            onClick={() => playGummyTap()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>Explore</span>
            <ChevronRight size={11} className="text-purple-400" />
          </Link>
        </div>

        {/* Row 2 on Mobile (Full Width Page Switcher) / Right Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 w-full md:w-auto">
          <CutePageSwitcher
            page={page}
            maxPage={maxPage}
            loading={loading}
            onPageChange={handlePageChange}
            variant="purple"
            className="w-full md:w-auto justify-between md:justify-start"
          />

          {/* Desktop Only: Full Button Name */}
          <Link
            href="/social"
            onClick={() => playGummyTap()}
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all whitespace-nowrap select-none shrink-0 group active:scale-95"
          >
            <span>OtakuVerse</span>
            <ChevronRight size={12} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Grid of Global Comments */}
      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={6}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
      >
        {currentPageComments.map((comment) => {
          const isSpoilerRevealed = revealedSpoilers[comment.id];
          const hasSpoiler = comment.is_spoiler && !isSpoilerRevealed;
          const media = parseCommentSource(comment);
          const MediaIcon = media.Icon;

          return (
            <motion.div
              key={comment.id}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="relative p-4 rounded-[20px] md:rounded-[24px] bg-[#0c101c]/90 border border-white/[0.08] hover:border-purple-500/40 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col justify-between gap-3 group transition-all"
            >
              {/* Card Header: User Avatar, Name, Role Badge, Time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 border border-purple-500/30 bg-purple-950/40 shadow-sm">
                    <img
                      src={comment.user_avatar}
                      alt={comment.user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/default-avatar.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-white truncate group-hover:text-purple-300 transition-colors">
                        {comment.user_name}
                      </span>
                      <span className={cn(
                        "text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border shadow-xs tracking-wider",
                        comment.is_traveler
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                          : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                      )}>
                        {comment.user_role}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500 tracking-tight">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                </div>

                <span className="text-[9.5px] font-bold uppercase tracking-wider text-purple-400/90 shrink-0">
                  {media.type}
                </span>
              </div>

              {/* Media Source & Episode Info Link (Unboxed Minimalist Row) */}
              <div className="pt-0.5">
                <Link
                  href={media.watchUrl}
                  onClick={() => playGummyTap()}
                  className="group/media inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-300 hover:text-purple-300 transition-colors max-w-full"
                >
                  <MediaIcon size={12} className="text-purple-400 group-hover/media:scale-110 transition-transform shrink-0" />
                  <span className="truncate group-hover/media:underline underline-offset-2">
                    {media.title}
                  </span>
                  {media.epLabel && (
                    <span className="text-purple-400 font-mono text-[10.5px] font-bold shrink-0">
                      • {media.epLabel}
                    </span>
                  )}
                  <ChevronRight size={11} className="text-zinc-500 group-hover/media:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              </div>

              {/* Comment Content */}
              <div className="relative min-h-[46px] flex items-center">
                {hasSpoiler ? (
                  <div className="w-full relative">
                    <p className="text-xs text-zinc-400 leading-relaxed filter blur-sm select-none">
                      {comment.content}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => toggleSpoiler(comment.id, e)}
                      className="absolute inset-0 m-auto text-purple-300 hover:text-white text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Eye size={13} className="text-purple-400" />
                      <span>Spoiler • Click to Reveal</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium line-clamp-3">
                    {comment.content}
                  </p>
                )}
              </div>

              {/* Card Footer: Active discussion indicators (Unboxed) */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10.5px] text-zinc-500 font-medium">
                <span className="inline-flex items-center gap-1 text-purple-400/80 font-bold">
                  <ShieldCheck size={12} />
                  <span>Sanctuary Verified</span>
                </span>
                <Link
                  href={media.watchUrl}
                  onClick={() => playGummyTap()}
                  className="font-bold text-zinc-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 active:scale-95"
                >
                  <span>Join Discussion</span>
                  <ChevronRight size={11} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </CylinderPageSlider>

      {/* Bottom Center-Aligned Page Switcher */}
      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
        <CutePageSwitcher
          page={page}
          maxPage={maxPage}
          loading={loading}
          onPageChange={handlePageChange}
          variant="purple"
          fullWidthOnMobile={true}
        />
      </div>
    </section>
  );
}
