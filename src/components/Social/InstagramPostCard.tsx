"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  BarChart2, CheckCircle2, XCircle, HelpCircle, Share2, Trash2, Flag,
  Repeat2, Play, Star, EyeOff, Eye, Smile, Film, Tv, Image as ImageIcon
} from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { formatDistanceToNow } from 'date-fns';
import { UserTitleBadge } from '@/components/ui/UserTitleBadge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';
import { RenderMentions } from '@/lib/mentions';
import PostShareModal from '@/components/Social/PostShareModal';
import { playGummyPop } from '@/lib/audioManager';
import { atraxSquishTapVariants, atraxChipTapVariants } from '@/lib/atraxMotion';
import ChibiAnimeIcon from '@/components/Social/ChibiAnimeIcon';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export interface PollOption {
  id: number;
  text: string;
  votes: string[]; // array of user_ids who voted for this option
}

export interface PollData {
  type: 'poll' | 'quiz';
  question: string;
  options: PollOption[];
  correctOptionIndex?: number; // for quiz
}

export interface AttachedMedia {
  id: string | number;
  title: string;
  image: string;
  type?: string;
  score?: string | number;
  episodes?: number;
}

export interface InstagramPostCardProps {
  post: any;
  highlightId?: string;
  onLike: () => void;
  onComment: () => void;
  onQuickComment?: (content: string) => Promise<void>;
  onShare?: (platform?: string) => void;
  onBookmark?: () => void;
  onDelete?: () => void;
  onImageClick?: (src: string) => void;
  currentUserId?: string;
  onVotePoll?: (postId: string, optionIndex: number) => void;
}

const ANIME_REACTIONS = [
  { id: 'heart', emoji: '❤️', label: 'Love' },
  { id: 'fire', emoji: '🔥', label: 'Hype' },
  { id: 'cry', emoji: '😭', label: 'Feels' },
  { id: 'laugh', emoji: '😂', label: 'Lmao' },
  { id: 'mindblown', emoji: '🤯', label: 'Peak' },
  { id: 'crown', emoji: '👑', label: 'GOAT' },
];

export default function InstagramPostCard({
  post,
  highlightId,
  onLike,
  onComment,
  onQuickComment,
  onShare,
  onBookmark,
  onDelete,
  onImageClick,
  currentUserId,
  onVotePoll
}: InstagramPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.is_bookmarked));
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [imgFallbacks, setImgFallbacks] = useState<Record<number, string>>({});

  useEffect(() => {
    setIsBookmarked(Boolean(post.is_bookmarked));
  }, [post.is_bookmarked]);

  const resolvePostImg = (idx: number) => {
    if (imgFallbacks[idx]) return imgFallbacks[idx];
    const raw = post.images?.[idx];
    return raw ? getOptimizedImageUrl(raw) : '';
  };

  const handlePostImgError = (idx: number) => {
    const raw = post.images?.[idx];
    if (!raw) {
      setFailedImages(prev => ({ ...prev, [idx]: true }));
      return;
    }
    const current = imgFallbacks[idx] || getOptimizedImageUrl(raw);
    if (!current.includes('images.weserv.nl')) {
      setImgFallbacks(prev => ({ ...prev, [idx]: `https://images.weserv.nl/?url=${encodeURIComponent(raw)}` }));
    } else if (current !== raw) {
      setImgFallbacks(prev => ({ ...prev, [idx]: raw }));
    } else {
      setFailedImages(prev => ({ ...prev, [idx]: true }));
    }
  };

  // Reaction state
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [repostCount, setRepostCount] = useState(0);
  const [hasReposted, setHasReposted] = useState(false);

  // Quick reply input state
  const [quickReply, setQuickReply] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);

  // Poll / Quiz state stored inside post or decoded from content
  const [localPoll, setLocalPoll] = useState<PollData | null>(() => {
    if (post.poll_data) return post.poll_data;
    if (post.content && post.content.includes('<!--POLL_DATA:')) {
      try {
        const match = post.content.match(/<!--POLL_DATA:(.*?)-->/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      } catch (e) {}
    }
    return null;
  });

  // Attached Anime / Manga Media Card state
  const [attachedMedia] = useState<AttachedMedia | null>(() => {
    if (post.content && post.content.includes('<!--MEDIA_ATTACH:')) {
      try {
        const match = post.content.match(/<!--MEDIA_ATTACH:(.*?)-->/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      } catch (e) {}
    }
    return null;
  });

  // Spoiler tag state
  const isSpoiler = (post.content && (post.content.includes('<!--SPOILER:true-->') || post.content.toLowerCase().includes('#spoiler'))) || false;
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  // Extract clean text content without metadata comments
  let cleanContent = post.content 
    ? post.content
        .replace(/<!--POLL_DATA:.*?-->/g, '')
        .replace(/<!--MEDIA_ATTACH:.*?-->/g, '')
        .replace(/<!--SPOILER:.*?-->/g, '')
        .trim() 
    : '';

  // Extract post metadata for header and caption position
  const [postMeta] = useState<{ header?: string; captionPos?: 'above' | 'below' } | null>(() => {
    if (post.content && post.content.includes('<!--POST_META:')) {
      try {
        const match = post.content.match(/<!--POST_META:(.*?)-->/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      } catch (e) {}
    }
    return null;
  });

  // Strip POST_META from cleanContent
  if (cleanContent.includes('<!--POST_META:')) {
    cleanContent = cleanContent.replace(/<!--POST_META:.*?-->/g, '').trim();
  }

  // Double tap to like handler
  const handleDoubleTap = () => {
    setShowHeartAnim(true);
    playGummyPop(0.35);
    if (!post.is_liked_by_user) {
      onLike();
    }
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  // Vote handler
  const handleVote = (optionIdx: number) => {
    if (!currentUserId || !localPoll) return;
    
    playGummyPop(0.3);
    const hasVoted = localPoll.options.some(opt => opt.votes?.includes(currentUserId));
    if (hasVoted) return;

    const updatedOptions = localPoll.options.map((opt, idx) => {
      if (idx === optionIdx) {
        return { ...opt, votes: [...(opt.votes || []), currentUserId] };
      }
      return opt;
    });

    const updatedPoll: PollData = { ...localPoll, options: updatedOptions };
    setLocalPoll(updatedPoll);

    if (onVotePoll) {
      onVotePoll(post.id, optionIdx);
    }
    toast.success(localPoll.type === 'quiz' ? 'Quiz answer submitted!' : 'Vote recorded!');
  };

  // Reaction select handler
  const handleSelectReaction = (reaction: typeof ANIME_REACTIONS[0]) => {
    playGummyPop(0.35);
    if (activeReaction === reaction.id) {
      setActiveReaction(null);
      if (post.is_liked_by_user) onLike();
    } else {
      setActiveReaction(reaction.id);
      if (!post.is_liked_by_user) onLike();
      toast.success(`Reacted with ${reaction.emoji} ${reaction.label}`);
    }
    setShowReactionTray(false);
  };

  // Repost handler
  const handleRepost = () => {
    playGummyPop(0.3);
    setHasReposted(!hasReposted);
    setRepostCount(prev => hasReposted ? prev - 1 : prev + 1);
    toast.success(hasReposted ? "Repost removed" : "Reposted to your OtakuVerse profile!");
  };

  // Quick reply submit handler
  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReply.trim()) return;
    if (!currentUserId) {
      toast.error("Please sign in to reply");
      return;
    }

    setIsSendingQuickReply(true);
    playGummyPop(0.35);
    try {
      if (onQuickComment) {
        await onQuickComment(quickReply.trim());
      } else {
        // Fallback to standard comment modal
        onComment();
      }
      setQuickReply('');
      toast.success("Reply posted!");
    } catch (err) {
      console.error(err);
      toast.error("Could not send reply");
    } finally {
      setIsSendingQuickReply(false);
    }
  };

  // Total poll votes
  const totalVotes = localPoll ? localPoll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0) : 0;
  const userVotedIdx = localPoll && currentUserId ? localPoll.options.findIndex(opt => opt.votes?.includes(currentUserId)) : -1;
  const hasUserVoted = userVotedIdx !== -1;

  const likesCount = post.likes_count || 0;
  const commentsCount = post.comments_count || 0;

  return (
    <div id={`post-${post.id}`} className={`w-full bg-[#0e0e13] border border-white/[0.08] sm:rounded-2xl overflow-hidden mb-3 transition-colors ${highlightId === post.id ? 'ring-2 ring-primary-500' : 'hover:border-white/15'}`}>
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/[0.06] bg-[#121218]">
        <div className="flex items-center gap-3 min-w-0">
          <ProfileAvatar profile={post.user || post.profiles} className="w-9 h-9 sm:w-10 sm:h-10 cursor-pointer" />
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span 
                onClick={(e) => { e.stopPropagation(); window.location.href = `/profile/${(post.user || post.profiles)?.username}`; }}
                className="font-bold text-xs sm:text-sm text-white hover:underline cursor-pointer truncate"
              >
                {(post.user || post.profiles)?.username || 'Otaku Explorer'}
              </span>
              <UserTitleBadge 
                user={post.user || post.profiles}
                className="shrink-0 ml-1" 
              />
            </div>
            <p className="text-[10px] text-zinc-500 truncate">
              @{(post.user || post.profiles)?.username?.toLowerCase().replace(/\s/g, '')} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 outline-none transition-colors cursor-pointer">
            <MoreHorizontal size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#14141c]/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl min-w-[150px] p-1.5">
            <DropdownMenuItem onClick={() => {
              if (typeof window !== 'undefined') {
                const shareUrl = `${window.location.origin}/social?post=${post.id}`;
                navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard");
              }
            }} className="text-xs font-semibold gap-2 py-2 px-3 hover:bg-white/10 rounded-xl cursor-pointer">
              <Share2 size={14} /> Copy Link
            </DropdownMenuItem>
            {currentUserId === post.user_id && onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-xs font-semibold text-red-400 gap-2 py-2 px-3 hover:bg-red-500/20 rounded-xl cursor-pointer">
                <Trash2 size={14} /> Delete Post
              </DropdownMenuItem>
            )}
            {currentUserId !== post.user_id && (
              <DropdownMenuItem onClick={() => toast.success("Post reported")} className="text-xs font-semibold text-zinc-400 gap-2 py-2 px-3 hover:bg-white/10 rounded-xl cursor-pointer">
                <Flag size={14} /> Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- OPTIONAL HEADER (from POST_META) --- */}
      {postMeta?.header && (
        <div className="px-3.5 sm:px-4 pt-3 pb-1">
          <h3 className="text-base sm:text-lg font-bold text-white leading-tight font-lemon tracking-wide">{postMeta.header}</h3>
        </div>
      )}

      {/* --- SPOILER WARNING SHIELD --- */}
      {isSpoiler && !spoilerRevealed ? (
        <div 
          onClick={() => { setSpoilerRevealed(true); playGummyPop(0.3); }}
          className="mx-3.5 sm:mx-4 my-3 p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-md flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-amber-950/30 transition-all select-none group/spoiler shadow-inner"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover/spoiler:scale-110 transition-transform">
            <EyeOff size={18} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-amber-300">Contains Spoilers</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">This post contains anime/manga spoilers. Tap to reveal.</p>
          </div>
          <span className="mt-1 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
            Click To Reveal
          </span>
        </div>
      ) : (
        <>
          {/* Re-hide button if spoiler was revealed */}
          {isSpoiler && spoilerRevealed && (
            <div className="px-3.5 sm:px-4 pt-2 flex justify-end">
              <button 
                onClick={() => setSpoilerRevealed(false)}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
              >
                <Eye size={11} /> Hide spoiler
              </button>
            </div>
          )}

          {/* --- CAPTION (ABOVE MEDIA) --- */}
          {postMeta?.captionPos === 'above' && cleanContent && (
            <div className="px-3.5 sm:px-4 pb-3 pt-1 text-xs sm:text-sm text-zinc-200 leading-relaxed">
              <span className="whitespace-pre-wrap">
                <RenderMentions content={isExpanded || cleanContent.length <= 160 ? cleanContent : `${cleanContent.slice(0, 160)}... `} />
              </span>
              {cleanContent.length > 160 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className="text-zinc-400 hover:text-zinc-200 font-bold ml-1 text-xs cursor-pointer"
                >
                  {isExpanded ? 'less' : 'more'}
                </button>
              )}
            </div>
          )}

          {/* --- MEDIA CAROUSEL / DOUBLE TAP HEART --- */}
          {post.images && post.images.length > 0 && (
            <div 
              className="relative w-full bg-black overflow-hidden select-none cursor-pointer group"
              onDoubleClick={handleDoubleTap}
            >
              {failedImages[activeImageIdx] ? (
                <div className="w-full aspect-video sm:aspect-[4/3] bg-zinc-900/90 flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2 border-y border-white/5">
                  <ImageIcon size={32} className="opacity-40 text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-400 font-semibold">Image Unavailable on Host</span>
                  <span className="text-[11px] text-zinc-600 max-w-xs">The hosting server (ImgBB) has expired or removed this image file.</span>
                </div>
              ) : (
                <img 
                  src={resolvePostImg(activeImageIdx)} 
                  alt="Post content" 
                  referrerPolicy="no-referrer"
                  onError={() => handlePostImgError(activeImageIdx)}
                  loading="lazy"
                  className="w-full object-cover max-h-[550px] aspect-square sm:aspect-auto"
                  onClick={() => onImageClick && onImageClick(resolvePostImg(activeImageIdx))}
                />
              )}

              {/* Double Tap Heart Animation Overlay */}
              <AnimatePresence>
                {showHeartAnim && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                  >
                    <Heart size={96} className="text-red-500 fill-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Multi-image indicators */}
              {post.images.length > 1 && (
                <>
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-white z-10 border border-white/10">
                    {activeImageIdx + 1}/{post.images.length}
                  </div>

                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
                    {post.images.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveImageIdx(idx); }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${activeImageIdx === idx ? 'w-5 bg-primary-500' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* --- ATTACHED ANIME / MANGA MEDIA CARD --- */}
          {attachedMedia && (
            <div className="mx-3.5 sm:mx-4 my-2.5 p-2.5 rounded-xl bg-[#14141d] border border-white/10 hover:border-primary-500/30 transition-all flex items-center justify-between gap-3 group/media">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={attachedMedia.image} 
                  alt={attachedMedia.title}
                  className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl object-cover border border-white/10 shrink-0 group-hover/media:scale-105 transition-transform" 
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-primary-600/20 border border-primary-500/30 text-primary-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <ChibiAnimeIcon size={13} className="text-primary-300 shrink-0" />
                      {attachedMedia.type || 'Anime'}
                    </span>
                    {attachedMedia.score && (
                      <span className="text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {attachedMedia.score}
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">{attachedMedia.title}</h5>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Attached Title</span>
                </div>
              </div>
              <Link 
                href={`/search?q=${encodeURIComponent(attachedMedia.title)}`}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Play size={12} className="fill-current" />
                <span className="hidden sm:inline">Stream</span>
              </Link>
            </div>
          )}

          {/* --- POLL OR QUIZ EMBEDDED WIDGET --- */}
          {localPoll && (
            <div className="p-4 mx-3 sm:mx-4 my-3 bg-[#111118] border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border backdrop-blur-md ${
                  localPoll.type === 'quiz' 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                }`}>
                  {localPoll.type === 'quiz' ? <HelpCircle size={13} className="text-purple-400" /> : <BarChart2 size={13} className="text-primary-400" />}
                  {localPoll.type === 'quiz' ? 'Trivia Quiz' : 'Opinion Poll'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono font-bold">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug px-1">{localPoll.question}</h4>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {localPoll.options.map((opt, idx) => {
                  const voteCount = opt.votes?.length || 0;
                  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  const isSelected = userVotedIdx === idx;
                  const isCorrect = localPoll.type === 'quiz' && localPoll.correctOptionIndex === idx;
                  const isWrongSelection = hasUserVoted && isSelected && !isCorrect && localPoll.type === 'quiz';

                  return (
                    <button
                      key={idx}
                      disabled={hasUserVoted}
                      onClick={() => handleVote(idx)}
                      className={`w-full relative overflow-hidden rounded-full p-3 px-4 text-left border transition-all flex items-center justify-between text-xs font-semibold backdrop-blur-md cursor-pointer ${
                        hasUserVoted 
                          ? isCorrect 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10' 
                            : isWrongSelection 
                            ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-md shadow-red-500/10' 
                            : 'bg-white/5 border-white/10 text-zinc-300'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white active:scale-[0.99]'
                      }`}
                    >
                      {hasUserVoted && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`absolute left-0 top-0 bottom-0 opacity-25 -z-0 ${
                            isCorrect ? 'bg-emerald-500' : isWrongSelection ? 'bg-red-500' : 'bg-primary-500'
                          }`}
                        />
                      )}

                      <div className="flex items-center gap-2 relative z-10 min-w-0 pr-2">
                        {hasUserVoted && isCorrect && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                        {hasUserVoted && isWrongSelection && <XCircle size={16} className="text-red-400 shrink-0" />}
                        <span className="truncate">{opt.text}</span>
                      </div>

                      {hasUserVoted && (
                        <span className="font-mono text-[11px] font-bold shrink-0 relative z-10">
                          {percentage}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- CAPTION (BELOW MEDIA OR TEXT-ONLY) --- */}
          {(postMeta?.captionPos !== 'above') && cleanContent && (
            <div className="px-3.5 sm:px-4 pt-3 pb-2 text-xs sm:text-sm text-zinc-200 leading-relaxed">
              {post.images && post.images.length > 0 && (
                <span 
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/profile/${(post.user || post.profiles)?.username}`; }}
                  className="font-bold text-white mr-2 hover:underline cursor-pointer"
                >
                  {(post.user || post.profiles)?.username || 'Otaku'}
                </span>
              )}

              <span className="whitespace-pre-wrap">
                <RenderMentions content={isExpanded || cleanContent.length <= 160 ? cleanContent : `${cleanContent.slice(0, 160)}... `} />
              </span>

              {cleanContent.length > 160 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className="text-zinc-400 hover:text-zinc-200 font-bold ml-1 text-xs cursor-pointer"
                >
                  {isExpanded ? 'less' : 'more'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* --- ACTION BAR WITH ANIME REACTIONS & JELLY PHYSICS --- */}
      <div className="relative flex items-center justify-between px-3.5 sm:px-4 py-2 text-zinc-400 border-t border-white/5">
        
        {/* Anime Reactions Floating Drawer */}
        <AnimatePresence>
          {showReactionTray && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: -48, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="absolute left-2 z-40 bg-[#161622]/95 backdrop-blur-xl border border-white/15 p-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-1.5 select-none"
            >
              {ANIME_REACTIONS.map((react) => (
                <motion.button
                  key={react.id}
                  whileHover={{ scale: 1.35, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelectReaction(react)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-lg transition-transform"
                  title={react.label}
                >
                  {react.emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Like / Reaction Button */}
          <div className="relative flex items-center">
            <motion.button 
              variants={atraxSquishTapVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                playGummyPop(0.35);
                onLike();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowReactionTray(!showReactionTray);
              }}
              className={cn(
                "p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1",
                post.is_liked_by_user ? 'text-red-500' : 'hover:text-white'
              )}
              title="Click to like, right click or long press for reactions"
            >
              <Heart size={20} className={post.is_liked_by_user ? 'fill-current text-red-500' : ''} />
              {activeReaction && (
                <span className="text-sm -ml-0.5">
                  {ANIME_REACTIONS.find(r => r.id === activeReaction)?.emoji}
                </span>
              )}
            </motion.button>

            {/* Quick Reaction Toggle Pill */}
            <button
              onClick={() => setShowReactionTray(!showReactionTray)}
              className="p-1 rounded-full text-zinc-500 hover:text-amber-400 hover:bg-white/5 transition-colors -ml-1"
              title="React with emojis"
            >
              <Smile size={13} />
            </button>
          </div>

          {/* Comment Button */}
          <motion.button 
            variants={atraxChipTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={onComment}
            className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            title="Comment on post"
          >
            <MessageCircle size={20} />
          </motion.button>

          {/* Repost Button */}
          <motion.button
            variants={atraxChipTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleRepost}
            className={cn(
              "p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1",
              hasReposted ? 'text-emerald-400' : 'hover:text-white'
            )}
            title="Repost"
          >
            <Repeat2 size={19} className={hasReposted ? 'stroke-[2.5]' : ''} />
            {repostCount > 0 && <span className="text-[11px] font-mono font-bold">{repostCount}</span>}
          </motion.button>

          {/* Share Button */}
          <PostShareModal 
            post={post}
            trigger={
              <motion.button 
                variants={atraxChipTapVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                title="Share post"
              >
                <Send size={19} />
              </motion.button>
            }
          />
        </div>

        {/* Save / Bookmark Button */}
        <motion.button 
          variants={atraxChipTapVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
            playGummyPop(0.3);
            setIsBookmarked(!isBookmarked);
            if (onBookmark) onBookmark();
            toast.success(isBookmarked ? 'Removed from saved' : 'Saved to collection');
          }}
          className={cn(
            "p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer",
            isBookmarked ? 'text-amber-400 fill-amber-400' : 'hover:text-white'
          )}
          title="Save post"
        >
          <Bookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
        </motion.button>
      </div>

      {/* --- LIKES & COMMENTS SUMMARY COUNTER --- */}
      <div className="px-3.5 sm:px-4 text-xs font-bold text-white flex items-center gap-2">
        {likesCount > 0 ? (
          <span>{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</span>
        ) : (
          <span className="text-zinc-500 font-normal">0 likes</span>
        )}
        <span className="text-zinc-600">•</span>
        {commentsCount > 0 ? (
          <span className="text-zinc-300">{commentsCount.toLocaleString()} {commentsCount === 1 ? 'comment' : 'comments'}</span>
        ) : (
          <span className="text-zinc-500 font-normal">0 comments</span>
        )}
      </div>

      {/* --- LATEST COMMENT PREVIEW --- */}
      {post.latest_comment && (
        <div className="px-3.5 sm:px-4 mt-1.5 mb-1 text-xs text-white flex flex-col items-start gap-1">
          {(() => {
            const contentLines = (post.latest_comment.content || '').split('\n');
            const mediaRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?)$/i;
            const textLines = contentLines.filter((line: string) => !mediaRegex.test(line.trim()));
            const mediaLines = contentLines.filter((line: string) => mediaRegex.test(line.trim()));

            return (
              <>
                <div className="flex items-start w-full">
                  <span className="font-bold mr-1.5 shrink-0">{post.latest_comment.user?.username || 'User'}</span>
                  {textLines.length > 0 && (
                    <span className="text-zinc-300 line-clamp-1 flex-1 break-words">
                      {textLines.join(' ')}
                    </span>
                  )}
                </div>
                {mediaLines.map((line: string, idx: number) => (
                  <img
                    key={idx}
                    src={line.trim()}
                    alt="Comment media"
                    className="max-h-16 w-auto rounded-lg object-contain"
                  />
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* --- COMMENTS LINK (full-width clickable row) --- */}
      <button 
        onClick={onComment}
        className="w-full text-left px-3.5 sm:px-4 py-1.5 text-xs text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer hover:bg-white/[0.03] active:bg-white/5"
      >
        {commentsCount > 0 
          ? `View all ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`
          : 'Add a comment...'}
      </button>

      {/* --- INLINE QUICK REPLY BAR --- */}
      <form onSubmit={handleSendQuickReply} className="px-3.5 sm:px-4 pb-3 pt-1 flex items-center gap-2">
        <input 
          type="text"
          value={quickReply}
          onChange={(e) => setQuickReply(e.target.value)}
          placeholder="Drop a quick comment..."
          className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-primary-500/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
        />
        {quickReply.trim() && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            disabled={isSendingQuickReply}
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            Reply
          </motion.button>
        )}
      </form>

    </div>
  );
}
