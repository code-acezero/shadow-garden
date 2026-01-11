"use client";

import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Flag, Trash2, Send, X 
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

// Types (You can also move this to a types.ts file later)
interface SocialPostCardProps {
  post: any; // Using 'any' for flexibility with the join data, or import strict type
  currentUserId?: string;
  onLike: (post: any) => void;
  onBookmark: (post: any) => void;
  onDelete: (postId: string) => void;
  onPostComment: (postId: string, text: string) => Promise<void>;
}

export default function SocialPostCard({ 
  post, 
  currentUserId, 
  onLike, 
  onBookmark, 
  onDelete,
  onPostComment 
}: SocialPostCardProps) {
  
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    await onPostComment(post.id, commentText);
    setIsSubmitting(false);
    setCommentText("");
    setIsCommentOpen(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Card className="bg-[#0a0a0a] border-white/5 hover:border-white/10 transition-colors overflow-hidden">
          
          {/* HEADER */}
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex gap-3">
              <Avatar className="cursor-pointer border border-white/10">
                <AvatarImage src={post.user?.avatar_url} />
                <AvatarFallback className="bg-zinc-900 text-zinc-500">
                  {post.user?.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-white hover:text-red-500 cursor-pointer transition-colors">
                  {post.user?.username || "Unknown Agent"}
                </p>
                <p className="text-[10px] text-zinc-500 font-medium">
                  {formatDistanceToNow(new Date(post.created_at))} ago
                </p>
              </div>
            </div>
            
            {/* MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-white/10 text-zinc-300">
                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer">
                  <Flag size={14} className="mr-2"/> Report
                </DropdownMenuItem>
                {currentUserId === post.user_id && (
                  <DropdownMenuItem onClick={() => onDelete(post.id)} className="focus:bg-red-900/20 text-red-500 focus:text-red-400 cursor-pointer">
                    <Trash2 size={14} className="mr-2"/> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* TEXT */}
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {post.content}
            </p>
            
            {/* IMAGES GRID (Clean Logic) */}
            {post.images && post.images.length > 0 && (
              <div className={`grid gap-1 rounded-xl overflow-hidden ${
                post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {post.images.map((img: string, i: number) => {
                  if (i > 3) return null; // Only show max 4
                  return (
                    <div key={i} className={`relative ${post.images.length === 3 && i === 0 ? 'col-span-2' : ''}`}>
                      <img 
                        src={img} 
                        className="w-full h-auto object-cover max-h-[400px] min-h-[200px] hover:scale-105 transition-transform duration-500 cursor-zoom-in bg-zinc-900" 
                      />
                      {/* Overlay for +More images */}
                      {i === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">+{post.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAGS */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* ACTION BAR */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex gap-4">
                <button 
                  onClick={() => onLike(post)} 
                  className={`flex items-center gap-2 text-xs font-bold transition-all active:scale-95 ${
                    post.is_liked_by_user ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'
                  }`}
                >
                  <Heart size={18} className={post.is_liked_by_user ? "fill-current" : ""} /> 
                  {post.likes_count}
                </button>
                
                <button 
                  onClick={() => setIsCommentOpen(true)}
                  className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-blue-400 transition-colors active:scale-95"
                >
                  <MessageCircle size={18} /> {post.comments_count}
                </button>
                
                <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-green-400 transition-colors active:scale-95">
                  <Share2 size={18} /> Share
                </button>
              </div>
              
              <button 
                onClick={() => onBookmark(post)} 
                className={`transition-all active:scale-95 ${
                  post.is_bookmarked ? 'text-yellow-400' : 'text-zinc-500 hover:text-yellow-400'
                }`}
              >
                <Bookmark size={18} className={post.is_bookmarked ? "fill-current" : ""} />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* COMMENT DIALOG */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-center">Reply to Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Original Post Snippet */}
            <div className="bg-white/5 p-3 rounded-lg border-l-2 border-red-500">
                <p className="text-xs text-zinc-400 line-clamp-2 italic">"{post.content}"</p>
            </div>

            <Textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Transmit your message..."
              className="bg-black/50 border-white/10 focus:border-red-500/50 min-h-[100px] resize-none"
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCommentOpen(false)} className="text-zinc-400">Cancel</Button>
            <Button 
                onClick={handleSubmitComment} 
                disabled={!commentText.trim() || isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white"
            >
               {isSubmitting ? "Sending..." : <><Send size={14} className="mr-2"/> Reply</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}