"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  X, ShieldCheck, CornerDownRight, MessageSquare, Image as ImageIcon, Smile, Loader2, Search
} from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';
import { ImageAPI } from '@/lib/api';

export interface InstagramCommentsModalProps {
  post: any | null;
  comments: any[];
  onClose: () => void;
  onPostComment: (content: string, parentId?: string | null) => Promise<void>;
  user: any;
}

// Giphy public beta key (free, rate-limited, replace with your own key for production)
const GIPHY_API_KEY = 'dc6zaTOxFJmzC';

export default function InstagramCommentsModal({
  post,
  comments,
  onClose,
  onPostComment,
  user
}: InstagramCommentsModalProps) {
  const { profile } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [commentMedia, setCommentMedia] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Giphy state
  const [gifSearchQuery, setGifSearchQuery] = useState('anime');
  const [gifResults, setGifResults] = useState<Array<{ id: string; url: string; preview: string }>>([]);
  const [gifLoading, setGifLoading] = useState(false);

  const fetchGifs = useCallback(async (query: string) => {
    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
      const res = await fetch(endpoint);
      const json = await res.json();
      const gifs = (json.data || []).map((g: any) => ({
        id: g.id,
        url: g.images.fixed_height.url,
        preview: g.images.fixed_height_small.url,
      }));
      setGifResults(gifs);
    } catch {
      // Fallback to curated list if API fails
      setGifResults([
        { id: '1', url: 'https://media.giphy.com/media/13Zvh1URhmgW08/giphy.gif', preview: 'https://media.giphy.com/media/13Zvh1URhmgW08/giphy.gif' },
        { id: '2', url: 'https://media.giphy.com/media/26FmRaDmg8f6r9F04/giphy.gif', preview: 'https://media.giphy.com/media/26FmRaDmg8f6r9F04/giphy.gif' },
        { id: '3', url: 'https://media.giphy.com/media/CchzkJJ6UrJGw/giphy.gif', preview: 'https://media.giphy.com/media/CchzkJJ6UrJGw/giphy.gif' },
        { id: '4', url: 'https://media.giphy.com/media/L3vO8E2RzK0Zq/giphy.gif', preview: 'https://media.giphy.com/media/L3vO8E2RzK0Zq/giphy.gif' },
      ]);
    } finally {
      setGifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showStickerTray) {
      fetchGifs(gifSearchQuery);
    }
  }, [showStickerTray]);

  if (!post) return null;

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const url = await ImageAPI.uploadImage(file);
      setCommentMedia(url);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSubmit = async () => {
    if ((!commentText.trim() && !commentMedia) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let finalContent = commentText.trim();
      if (commentMedia) {
        finalContent = finalContent ? `${finalContent}\n${commentMedia}` : commentMedia;
      }
      await onPostComment(finalContent, replyTarget?.id || null);
      setCommentText('');
      setCommentMedia(null);
      setReplyTarget(null);
      setShowStickerTray(false);
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!post} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 text-white sm:rounded-3xl p-0 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[700px] [&>button]:right-4 [&>button]:top-4 [&>button]:text-zinc-400 hover:[&>button]:text-white z-[2000]">
        
        {/* --- LEFT SIDE: Post Media Preview (Desktop) --- */}
        <div className="hidden md:flex flex-1 bg-black/60 backdrop-blur-md items-center justify-center relative overflow-hidden border-r border-white/10">
          {post.images && post.images.length > 0 ? (
            <img 
              src={post.images[0]} 
              alt="Post attachment" 
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="p-8 text-center space-y-3 max-w-sm">
              <ProfileAvatar profile={post.user} className="w-16 h-16 mx-auto cursor-pointer" />
              <h4 className="font-bold text-sm text-white">{post.user?.username}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed italic">{post.content?.replace(/<!--POLL_DATA:.*?-->/g, '')}</p>
            </div>
          )}
        </div>

        {/* --- RIGHT SIDE: Header + Comments Feed + Sticky Input --- */}
        <div className="w-full md:w-[420px] flex flex-col h-full bg-[#0d0d12]/90 backdrop-blur-xl">
          
          {/* Header */}
          <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center gap-3 shrink-0 bg-[#0a0a0e]/90 backdrop-blur-md">
            <ProfileAvatar profile={post.user} className="w-8 h-8 cursor-pointer" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-xs text-white truncate">{post.user?.username}</span>
                {post.user?.role === 'admin' && <ShieldCheck size={12} className="text-primary-500" />}
              </div>
              <p className="text-[10px] text-zinc-500 truncate">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })} ago
              </p>
            </div>
          </DialogHeader>

          {/* Comments Stream */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Main Post Caption Bubble */}
            {post.content && (
              <div className="flex gap-3 pb-3 border-b border-white/10">
                <ProfileAvatar profile={post.user} className="w-8 h-8 shrink-0 cursor-pointer" />
                <div className="text-xs space-y-1">
                  <p className="text-zinc-200 leading-relaxed">
                    <span className="font-bold text-white mr-1.5">{post.user?.username}</span>
                    {post.content.replace(/<!--POLL_DATA:.*?-->/g, '')}
                  </p>
                  <span className="text-[10px] text-zinc-500 block">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
                  </span>
                </div>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-40 text-primary-400" />
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map(c => (
                <InstagramCommentBubble 
                  key={c.id} 
                  comment={c} 
                  onReply={(id, name) => setReplyTarget({ id, name })} 
                />
              ))
            )}
          </div>

          {/* Sticky Instagram Comment Input Bar */}
          <div className="p-3.5 border-t border-white/10 bg-[#0a0a0e]/95 backdrop-blur-md space-y-2 shrink-0">
            {replyTarget && (
              <div className="text-[10px] text-primary-400 flex items-center justify-between bg-primary-600/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary-500/20">
                <span className="flex items-center gap-1.5">
                  <CornerDownRight size={12} /> Replying to <strong>@{replyTarget.name}</strong>
                </span>
                <button onClick={() => setReplyTarget(null)} className="text-zinc-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Media Preview Attachment */}
            {commentMedia && (
              <div className="relative inline-block rounded-xl overflow-hidden border border-white/15 group shrink-0 max-w-[120px]">
                <img src={commentMedia} alt="Attachment" className="w-20 h-20 object-cover" />
                <button
                  type="button"
                  onClick={() => setCommentMedia(null)}
                  className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* GIF / Sticker Tray (Giphy-powered) */}
            {showStickerTray && (
              <div className="bg-[#121218] border border-white/10 rounded-2xl overflow-hidden">
                {/* Search bar */}
                <div className="flex items-center gap-2 p-2 border-b border-white/10">
                  <Search size={13} className="text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    value={gifSearchQuery}
                    onChange={e => setGifSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') fetchGifs(gifSearchQuery); }}
                    placeholder="Search GIFs (anime, react, etc)..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    onClick={() => fetchGifs(gifSearchQuery)}
                    className="text-[10px] font-bold text-primary-400 hover:text-primary-300 px-2 py-0.5 rounded-full border border-primary-500/30 hover:bg-primary-500/10 transition-colors cursor-pointer"
                  >
                    Go
                  </button>
                </div>
                {/* GIF Grid */}
                {gifLoading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 size={18} className="animate-spin text-primary-400" />
                  </div>
                ) : (
                  <div className="flex gap-1.5 p-2 overflow-x-auto no-scrollbar">
                    {gifResults.map(gif => (
                      <img
                        key={gif.id}
                        src={gif.preview}
                        alt="GIF"
                        onClick={() => {
                          setCommentMedia(gif.url);
                          setShowStickerTray(false);
                        }}
                        className="h-14 w-auto rounded-xl object-cover cursor-pointer hover:scale-105 transition-transform border border-white/10 shrink-0"
                      />
                    ))}
                  </div>
                )}
                <p className="text-center text-[9px] text-zinc-600 pb-1.5">Powered by GIPHY</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <ProfileAvatar profile={profile || user?.user_metadata || user} className="w-8 h-8 shrink-0 cursor-pointer" />
              
              <div className="flex-1 flex items-center bg-black/50 border border-white/15 rounded-full px-3 py-1.5 focus-within:border-primary-500 transition-colors">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder={`Add a comment for @${post.user?.username || 'user'}...`}
                  className="flex-1 bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none"
                />

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <label className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10">
                    {isUploadingMedia ? <Loader2 size={15} className="animate-spin text-primary-400" /> : <ImageIcon size={15} />}
                    <input type="file" accept="image/*" hidden onChange={handleMediaUpload} />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowStickerTray(!showStickerTray)}
                    className={`p-1 transition-colors cursor-pointer rounded-full hover:bg-white/10 ${showStickerTray ? 'text-primary-400' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <Smile size={15} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={(!commentText.trim() && !commentMedia) || isSubmitting}
                className="px-4 py-2 rounded-full bg-primary-600/90 hover:bg-primary-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 disabled:opacity-30 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                Post
              </button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function flattenReplies(replies: any[], parentUsername?: string): any[] {
  let flat: any[] = [];
  if (!replies || replies.length === 0) return flat;
  
  for (const r of replies) {
    const item = {
      ...r,
      replyToUser: parentUsername || r.reply_to_username || r.parent_username
    };
    flat.push(item);
    if (r.replies && r.replies.length > 0) {
      flat = flat.concat(flattenReplies(r.replies, r.user?.username || r.user?.name || 'User'));
    }
  }
  return flat;
}

function InstagramCommentBubble({ comment, onReply, isReply = false }: { comment: any; onReply: (id: string, name: string) => void; isReply?: boolean }) {
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);

  const flatChildReplies = useMemo(() => {
    if (isReply) return [];
    return flattenReplies(comment.replies || [], comment.user?.username || 'User');
  }, [comment.replies, comment.user?.username, isReply]);

  return (
    <div className="flex gap-2.5 items-start group text-xs">
      <ProfileAvatar 
        profile={comment.user} 
        className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} shrink-0 mt-0.5 cursor-pointer`} 
      />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-zinc-200 leading-relaxed">
          <span className="font-bold text-white mr-1.5 hover:underline cursor-pointer">
            {comment.user?.username || 'User'}
          </span>
          {comment.user?.role === 'admin' && <ShieldCheck size={12} className="inline text-primary-500 mr-1" />}
          {isReply && comment.replyToUser && (
            <span className="text-primary-400 font-semibold mr-1.5 hover:underline cursor-pointer">
              @{comment.replyToUser}
            </span>
          )}
          <span>
            {(comment.content || '').split('\n').map((line: string, idx: number) => {
              const isMedia = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?)$/i.test(line.trim());
              if (isMedia) {
                return (
                  <img
                    key={idx}
                    src={line.trim()}
                    alt="Comment media"
                    className="mt-1.5 max-h-44 max-w-[240px] rounded-xl border border-white/10 object-cover cursor-pointer hover:scale-[1.02] transition-transform shadow-md"
                    onClick={() => window.open(line.trim(), '_blank')}
                  />
                );
              }
              return <span key={idx} className="block">{line}</span>;
            })}
          </span>
        </div>

        {/* Action Buttons below comment */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold">
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}</span>
          
          <button 
            onClick={() => {
              setHasLiked(!hasLiked);
              setLikesCount((prev: number) => hasLiked ? prev - 1 : prev + 1);
            }} 
            className={`hover:text-white transition-colors cursor-pointer ${hasLiked ? 'text-red-400 font-bold' : ''}`}
          >
            {likesCount > 0 ? `${likesCount} likes` : 'Like'}
          </button>

          <button 
            onClick={() => onReply(comment.id, comment.user?.username || 'User')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Reply
          </button>
        </div>

        {/* Single Flat Linear Column for ALL Descendant Replies (Instagram Style) */}
        {!isReply && flatChildReplies.length > 0 && (
          <div className="pl-6 sm:pl-8 border-l border-white/10 mt-2.5 space-y-3">
            {flatChildReplies.map((reply: any) => (
              <InstagramCommentBubble 
                key={reply.id} 
                comment={reply} 
                onReply={onReply} 
                isReply={true} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
