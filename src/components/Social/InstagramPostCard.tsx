"use client";

import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  ShieldCheck, BarChart2, CheckCircle2, XCircle, HelpCircle, Share2, Trash2, Flag
} from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { formatDistanceToNow } from 'date-fns';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';

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

export interface InstagramPostCardProps {
  post: any;
  highlightId?: string;
  onLike: () => void;
  onComment: () => void;
  onShare: (platform?: string) => void;
  onBookmark?: () => void;
  onDelete?: () => void;
  onImageClick?: (src: string) => void;
  currentUserId?: string;
  onVotePoll?: (postId: string, optionIndex: number) => void;
}

export default function InstagramPostCard({
  post,
  highlightId,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  onImageClick,
  currentUserId,
  onVotePoll
}: InstagramPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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

  // Extract clean text content without poll metadata comment
  let cleanContent = post.content ? post.content.replace(/<!--POLL_DATA:.*?-->/g, '').trim() : '';

  // Extract post metadata for header and caption position
  const [postMeta, setPostMeta] = useState<{ header?: string; captionPos?: 'above' | 'below' } | null>(() => {
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
    if (!post.is_liked_by_user) {
      onLike();
    }
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  // Vote handler
  const handleVote = (optionIdx: number) => {
    if (!currentUserId || !localPoll) return;
    
    // Check if user already voted in this poll
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

  // Total poll votes
  const totalVotes = localPoll ? localPoll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0) : 0;
  const userVotedIdx = localPoll && currentUserId ? localPoll.options.findIndex(opt => opt.votes?.includes(currentUserId)) : -1;
  const hasUserVoted = userVotedIdx !== -1;

  const likesCount = post.likes_count || 0;
  const commentsCount = post.comments_count || 0;

  return (
    <div className={`w-full bg-[#0a0a0e]/95 backdrop-blur-xl border border-white/10 sm:rounded-3xl overflow-hidden mb-4 shadow-2xl transition-all ${highlightId === post.id ? 'ring-2 ring-primary-500' : 'hover:border-white/20'}`}>
      
      {/* --- INSTAGRAM HEADER --- */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/5 bg-[#0d0d12]/90 backdrop-blur-md">
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
              {(post.user || post.profiles)?.role === 'admin' && (
                <ShieldCheck size={14} className="text-primary-500 shrink-0" />
              )}
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
          <DropdownMenuContent align="end" className="bg-[#14141c]/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl min-w-[140px] p-1.5">
            <DropdownMenuItem onClick={() => onShare('copy')} className="text-xs font-semibold gap-2 py-2 px-3 hover:bg-white/10 rounded-xl cursor-pointer">
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
          <h3 className="text-lg font-bold text-white leading-tight">{postMeta.header}</h3>
        </div>
      )}

      {/* --- CAPTION (ABOVE MEDIA) --- */}
      {postMeta?.captionPos === 'above' && cleanContent && (
        <div className="px-3.5 sm:px-4 pb-3 pt-1 text-xs sm:text-sm text-zinc-200 leading-relaxed">
          <span className="whitespace-pre-wrap">
            {isExpanded || cleanContent.length <= 120 
              ? cleanContent 
              : `${cleanContent.slice(0, 120)}... `}
          </span>
          {cleanContent.length > 120 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-zinc-500 hover:text-zinc-300 font-bold ml-1 text-xs cursor-pointer"
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
          <img 
            src={post.images[activeImageIdx]} 
            alt="Post content" 
            className="w-full object-cover max-h-[550px] aspect-square sm:aspect-auto"
            onClick={() => onImageClick && onImageClick(post.images[activeImageIdx])}
          />

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

      {/* --- POLL OR QUIZ EMBEDDED WIDGET --- */}
      {localPoll && (
        <div className="p-4 mx-3 sm:mx-4 my-3 bg-[#111118]/90 backdrop-blur-md border border-white/10 rounded-3xl shadow-inner space-y-3">
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

          {/* Options - Glassmorphism Pill Buttons */}
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
                  {/* Percentage Bar Overlay */}
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
          {/* Hide username if it's a text-only post (no media) or if requested.
              The request was to remove the username from text posts. */}
          {post.images && post.images.length > 0 && (
            <span 
              onClick={(e) => { e.stopPropagation(); window.location.href = `/profile/${(post.user || post.profiles)?.username}`; }}
              className="font-bold text-white mr-2 hover:underline cursor-pointer"
            >
              {(post.user || post.profiles)?.username || 'Otaku'}
            </span>
          )}

          <span className="whitespace-pre-wrap">
            {isExpanded || cleanContent.length <= 120 
              ? cleanContent 
              : `${cleanContent.slice(0, 120)}... `}
          </span>

          {cleanContent.length > 120 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-zinc-500 hover:text-zinc-300 font-bold ml-1 text-xs cursor-pointer"
            >
              {isExpanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}

      {/* --- INSTAGRAM ACTION BAR --- */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 text-zinc-400 border-t border-white/5">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button 
            onClick={onLike}
            className={`p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer active:scale-125 ${
              post.is_liked_by_user ? 'text-red-500' : 'hover:text-white'
            }`}
            title="Like post"
          >
            <Heart size={22} className={post.is_liked_by_user ? 'fill-current text-red-500' : ''} />
          </button>

          {/* Comment Button */}
          <button 
            onClick={onComment}
            className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-all cursor-pointer active:scale-110"
            title="Comment on post"
          >
            <MessageCircle size={22} />
          </button>

          {/* Share Button */}
          <button 
            onClick={() => onShare('copy')}
            className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-all cursor-pointer active:scale-110"
            title="Share post"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Save / Bookmark Button */}
        <button 
          onClick={() => {
            setIsBookmarked(!isBookmarked);
            if (onBookmark) onBookmark();
            toast.success(isBookmarked ? 'Removed from saved' : 'Saved to collection');
          }}
          className={`p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer active:scale-125 ${
            isBookmarked ? 'text-amber-400 fill-amber-400' : 'hover:text-white'
          }`}
        >
          <Bookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
        </button>
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
        <div className="px-3.5 sm:px-4 pt-1.5 pb-0.5 text-xs text-zinc-300 line-clamp-1">
          <span className="font-bold text-white mr-1.5">
            {post.latest_comment.user?.username || 'Otaku'}
          </span>
          {post.latest_comment.content}
        </div>
      )}

      {/* --- COMMENTS LINK (full-width clickable row) --- */}
      <button 
        onClick={onComment}
        className="w-full text-left px-3.5 sm:px-4 py-2.5 mb-1 text-xs text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer hover:bg-white/[0.03] active:bg-white/5"
      >
        {commentsCount > 0 
          ? `View all ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`
          : 'Add a comment...'}
      </button>
    </div>
  );
}
