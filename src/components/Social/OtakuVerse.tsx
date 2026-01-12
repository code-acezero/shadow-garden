"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, 
  Video, Smile, Send, Bookmark, Flag, UserPlus, Loader2, Trash2, X,
  ShieldCheck, CornerDownRight, Eye, Flame, Link as LinkIcon, 
  Facebook, MessageSquare, SendHorizontal, MessageCircleMore
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { AppUser, supabase, ImageAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import ImageLightbox from './ImageLightbox';

// --- TYPES ---
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user: { username: string; avatar_url: string; role?: string };
  replies?: Comment[];
}

interface SocialPost {
  id: string;
  content: string;
  images: string[];
  created_at: string;
  user_id: string;
  user: {
    username: string;
    avatar_url: string;
    role?: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  is_bookmarked: boolean;
  tags: string[];
}

interface OtakuVerseProps {
  user: AppUser | null;
  onAuthRequired: () => void;
  highlightId?: string;
}

export default function OtakuVerse({ user, onAuthRequired, highlightId }: OtakuVerseProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Feature States
  const [activePostForComments, setActivePostForComments] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' });

  const channelRef = useRef<any>(null);
  const isVisibleRef = useRef(true);
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- SCROLLBAR PERSISTENCE FIX ---
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === 'hidden' || document.body.hasAttribute('data-radix-scroll-lock')) {
        document.body.style.setProperty('overflow', 'auto', 'important');
        document.body.style.setProperty('padding-right', '0px', 'important');
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-radix-scroll-lock'] });
    
    return () => observer.disconnect();
  }, []);

  // --- HIGHLIGHT AUTO-SCROLL LOGIC ---
  useEffect(() => {
    if (!isLoading && highlightId && postRefs.current[highlightId]) {
      setTimeout(() => {
        postRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 600);
    }
  }, [isLoading, highlightId]);

  // --- 1. FETCH LOGIC ---
  const fetchPosts = useCallback(async (showLoading = false) => {
    if (!supabase) return;

    if (showLoading) setIsLoading(true);
    try {
      let query = supabase
        .from('social_posts')
        .select(`
          *,
          user:profiles(username, avatar_url, role)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'following' && user) {
        const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        const ids = (following as any)?.map((f: any) => f.following_id) || [];
        query = query.in('user_id', ids);
      } 

      const { data, error } = await query;
      if (error) throw error;

      const postsWithMetadata = await Promise.all(data.map(async (post: any) => {
        let isLiked = false;
        let isBookmarked = false;
        let lCount = 0;
        let cCount = 0;

        const { count: lc } = await supabase.from('social_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        const { count: cc } = await supabase.from('social_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        
        lCount = lc || 0;
        cCount = cc || 0;

        if (user) {
          const { data: likeData } = await supabase.from('social_likes').select('user_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
          const { data: bookmarkData } = await supabase.from('social_bookmarks').select('user_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
          isLiked = !!likeData;
          isBookmarked = !!bookmarkData;
        }

        return {
          ...post,
          likes_count: lCount,
          comments_count: cCount,
          is_liked_by_user: isLiked,
          is_bookmarked: isBookmarked,
          user: post.user || { username: 'Shadow Agent', avatar_url: '' }
        };
      }));

      if (activeTab === 'trending') {
        postsWithMetadata.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      setPosts(postsWithMetadata);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [activeTab, user]);

  // --- 2. CONNECTION MANAGER ---
  useEffect(() => {
    if (!supabase) return;
    fetchPosts(true);

    const subscribe = () => {
      if (channelRef.current || !supabase) return; 
      const channel = supabase.channel('otaku-verse-live')
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'social_posts' }, () => {
             fetchPosts(); 
        })
        .subscribe();
      channelRef.current = channel;
    };

    const unsubscribe = () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        unsubscribe();
      } else {
        isVisibleRef.current = true;
        fetchPosts(); 
        subscribe(); 
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (!document.hidden) subscribe();

    const pollingInterval = setInterval(() => {
      if (isVisibleRef.current) fetchPosts();
    }, 45000); 

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollingInterval);
      unsubscribe();
    };
  }, [fetchPosts]);

  // --- 3. COMMENT SYSTEM ---
  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase.from('social_comments').select(`*, user:profiles(username, avatar_url, role)`).eq('post_id', postId).order('created_at', { ascending: true });
    if (error) return;

    const buildTree = (flat: any[], parentId: string | null = null): Comment[] => {
      return flat.filter(c => c.parent_id === parentId).map(c => ({ ...c, replies: buildTree(flat, c.id) }));
    };
    setComments(buildTree(data));
  };

  const handlePostComment = async () => {
    if (!user) return onAuthRequired();
    if (!commentText.trim() || !activePostForComments) return;

    const { error } = await supabase.from('social_comments').insert({
      post_id: activePostForComments.id,
      user_id: user.id,
      content: commentText,
      parent_id: replyTarget?.id || null
    } as any);

    if (!error) {
      setCommentText(''); setReplyTarget(null);
      fetchComments(activePostForComments.id);
      fetchPosts();
    }
  };

  // --- 4. ACTIONS ---
  const handleCreatePost = async () => {
    if (!user) return onAuthRequired();
    if (!newPost.trim() && selectedImages.length === 0) return;

    setIsUploading(true);
    try {
      const imageUrls = [];
      for (const file of selectedImages) {
        const url = await ImageAPI.uploadImage(file);
        imageUrls.push(url);
      }
      await supabase.from('social_posts').insert({ user_id: user.id, content: newPost, images: imageUrls, tags: extractTags(newPost) } as any);
      setNewPost(''); setSelectedImages([]); setShowCreatePost(false);
      fetchPosts();
    } catch (e) { toast.error("Upload failed."); } finally { setIsUploading(false); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || !supabase) return onAuthRequired();
    if (!confirm("Erase this transmission permanently?")) return;

    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', postId);
      if (error) throw error;
      toast.success("Transmission erased.");
      setPosts(current => current.filter(p => p.id !== postId));
    } catch (err) {
      toast.error("Access denied.");
    }
  };

  const handleLike = async (post: SocialPost) => {
    if (!user) return onAuthRequired();
    const isLiking = !post.is_liked_by_user;
    setPosts(posts.map(p => p.id === post.id ? { ...p, is_liked_by_user: isLiking, likes_count: isLiking ? p.likes_count + 1 : p.likes_count - 1 } : p));
    if (isLiking) await supabase.from('social_likes').insert({ post_id: post.id, user_id: user.id } as any);
    else await supabase.from('social_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
  };

  const handleShare = (platform: string, post: SocialPost) => {
    const postUrl = `${window.location.origin}/social/post/${post.id}`;
    const text = `Check out this broadcast from ${post.user.username} on Shadow Garden!`;
    
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + postUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`,
      messenger: `fb-messenger://share/?link=${encodeURIComponent(postUrl)}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(postUrl);
      toast.success("Signal link copied.");
      return;
    }

    if (platform === 'discord') {
        navigator.clipboard.writeText(postUrl);
        toast.info("Link copied for Discord.");
        return;
    }

    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 4) return toast.error('Limit: 4 images');
    setSelectedImages([...selectedImages, ...files]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl min-h-screen pb-24">
      {/* Global CSS fix to force scrollbar visible regardless of Radix Dialog/Dropdown state */}
      <style jsx global>{`
        body {
          overflow: auto !important;
          padding-right: 0px !important;
        }
      `}</style>

      <ImageLightbox isOpen={lightbox.isOpen} src={lightbox.src} onClose={() => setLightbox({ ...lightbox, isOpen: false })} />

      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 font-[Cinzel] tracking-widest uppercase italic">
            Otaku<span className="text-red-600">Verse</span>
          </h1>
          <Badge variant="outline" className="border-red-900/40 text-zinc-500 uppercase tracking-tighter">Shadow Network Feed</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#0a0a0a] border border-white/10 p-1 rounded-xl">
            {['feed', 'trending', 'following', 'discover'].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize data-[state=active]:bg-red-600 data-[state=active]:text-white font-black rounded-lg text-xs">
                {tab === 'trending' && <Flame size={12} className="mr-1 text-orange-400" />}
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6 mt-6">
            <Card className="bg-[#0a0a0a] border-white/10 hover:border-red-500/30 transition-all cursor-pointer group" onClick={() => user ? setShowCreatePost(true) : onAuthRequired()}>
              <CardContent className="p-4 flex gap-4 items-center">
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-white/5 h-10 rounded-full flex items-center px-4 text-zinc-500 text-sm font-black italic">Start a transmission...</div>
                <Button size="icon" variant="ghost" className="text-red-600"><ImageIcon size={20} /></Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-20 text-zinc-500 animate-pulse font-black uppercase">Intercepting Signals...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600 font-black">NO SIGNALS FOUND.</div>
                ) : (
                    <AnimatePresence>
                        {posts.map((post) => (
                            <motion.div 
                              key={post.id} 
                              // ✅ Fixed: Wrapping in arrow function that returns void
                              ref={(el) => { postRefs.current[post.id] = el; }}
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              layout
                            >
                                <Card className={`bg-[#0a0a0a] border-white/5 overflow-hidden shadow-2xl transition-all duration-1000 ${highlightId === post.id ? 'ring-2 ring-red-600 shadow-[0_0_30px_rgba(220,38,38,0.25)] bg-zinc-900/50 scale-[1.01]' : ''}`}>
                                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                                        <div className="flex gap-3">
                                            <Avatar className="border border-white/10 w-11 h-11">
                                                <AvatarImage src={post.user?.avatar_url} />
                                                <AvatarFallback>?</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-white hover:text-red-500 cursor-pointer transition-colors uppercase tracking-tight">{post.user?.username}</p>
                                                    {post.user.role === 'admin' && <ShieldCheck size={14} className="text-red-600" />}
                                                </div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase">{formatDistanceToNow(new Date(post.created_at))} ago</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 text-zinc-500 hover:text-white"><MoreHorizontal size={16} /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-black border-white/10 text-zinc-300">
                                                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer font-bold"><Flag size={14} className="mr-2"/> Report</DropdownMenuItem>
                                                {user?.id === post.user_id && (
                                                    <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="focus:bg-red-900/20 text-red-500 font-bold cursor-pointer"><Trash2 size={14} className="mr-2"/> Delete</DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>

                                    <CardContent className="p-0">
                                        <p className="px-4 pb-4 text-zinc-300 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
                                        {post.images && post.images.length > 0 && (
                                            <div className={`grid gap-0.5 border-y border-white/5 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {post.images.map((img, i) => (
                                                    <div key={i} className="relative aspect-square overflow-hidden cursor-zoom-in group" onClick={() => setLightbox({ isOpen: true, src: img })}>
                                                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Post" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Badge className="bg-red-600 font-black tracking-widest text-[10px]">VIEW_HD</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex gap-8">
                                                <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-xs font-black transition-all ${post.is_liked_by_user ? 'text-red-500 scale-110' : 'text-zinc-500 hover:text-red-500'}`}>
                                                    <Heart size={20} className={post.is_liked_by_user ? "fill-current" : ""} /> {post.likes_count}
                                                </button>
                                                <button onClick={() => { setActivePostForComments(post); fetchComments(post.id); }} className="flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-blue-500">
                                                    <MessageCircle size={20} /> {post.comments_count}
                                                </button>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-green-500">
                                                            <Share2 size={20} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/10 text-zinc-300 w-48 shadow-2xl">
                                                        <DropdownMenuItem onClick={() => handleShare('facebook', post)} className="focus:bg-white/10 cursor-pointer font-bold"><Facebook size={14} className="mr-2 text-blue-500"/> Facebook</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleShare('messenger', post)} className="focus:bg-white/10 cursor-pointer font-bold"><MessageCircleMore size={14} className="mr-2 text-blue-400"/> Messenger</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleShare('whatsapp', post)} className="focus:bg-white/10 cursor-pointer font-bold"><MessageSquare size={14} className="mr-2 text-green-500"/> WhatsApp</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleShare('telegram', post)} className="focus:bg-white/10 cursor-pointer font-bold"><SendHorizontal size={14} className="mr-2 text-sky-500"/> Telegram</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleShare('discord', post)} className="focus:bg-white/10 cursor-pointer font-bold"><X size={14} className="mr-2 text-indigo-400"/> Discord</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleShare('copy', post)} className="focus:bg-white/10 cursor-pointer border-t border-white/5 mt-1 font-bold"><LinkIcon size={14} className="mr-2 text-red-500"/> Copy Link</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <button className="text-zinc-500 hover:text-yellow-500"><Bookmark size={20} /></button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CREATE POST DIALOG */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-[Cinzel] tracking-widest uppercase text-red-500">New Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea placeholder="What's happening?" value={newPost} onChange={(e) => setNewPost(e.target.value)} className="min-h-[150px] bg-white/5 border-none text-zinc-200 resize-none focus-visible:ring-1 ring-red-600 font-medium" />
            {selectedImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedImages.map((image, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img src={URL.createObjectURL(image)} className="w-20 h-20 object-cover" alt="Preview" />
                          <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-red-600 rounded-full text-white"><X size={10} /></button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <Button variant="ghost" onClick={() => document.getElementById('img-upload')?.click()}><ImageIcon size={20} /></Button>
                <input id="img-upload" type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                <Button onClick={handleCreatePost} disabled={isUploading} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 rounded-full">
                    {isUploading ? <Loader2 className="animate-spin" /> : "BROADCAST"}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* THREADED COMMENTS MODAL */}
      <Dialog open={!!activePostForComments} onOpenChange={() => { setActivePostForComments(null); setReplyTarget(null); }}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader>
            <VisuallyHidden.Root>
              <DialogTitle>Comment Thread</DialogTitle>
            </VisuallyHidden.Root>
          </DialogHeader>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
                <MessageCircle className="text-red-600" /> Neural_Log: {activePostForComments?.user.username}
            </h2>
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentNode key={comment.id} comment={comment} onReply={(id, name) => setReplyTarget({ id, name })} />
              ))}
            </div>
          </div>
          <div className="p-4 bg-black border-t border-white/5">
            {replyTarget && (
                <div className="flex items-center justify-between bg-red-600/10 border border-red-600/20 px-3 py-1.5 rounded-lg mb-2">
                    <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2"><CornerDownRight size={14}/> Replying to @{replyTarget.name}</span>
                    <button onClick={() => setReplyTarget(null)}><X size={14}/></button>
                </div>
            )}
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 border border-white/10"><AvatarImage src={user?.user_metadata?.avatar_url}/></Avatar>
              <div className="flex-1 relative">
                <Textarea placeholder="Intercept signal..." className="bg-white/5 border-none resize-none pr-12 min-h-[48px] max-h-32 rounded-2xl py-3 font-medium text-sm" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                <button onClick={handlePostComment} className="absolute right-3 bottom-2 text-red-600 p-1"><Send size={22}/></button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentNode({ comment, onReply }: { comment: Comment, onReply: (id: string, name: string) => void }) {
    return (
        <div className="flex gap-3">
            <Avatar className="w-8 h-8 shrink-0"><AvatarImage src={comment.user.avatar_url}/></Avatar>
            <div className="flex-1">
                <div className="bg-white/5 rounded-2xl p-3 inline-block max-w-full">
                    <p className="text-xs font-black text-red-500 uppercase">{comment.user.username}</p>
                    <p className="text-sm text-zinc-300 font-medium">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <span className="text-[10px] text-zinc-600 font-black uppercase">{formatDistanceToNow(new Date(comment.created_at))}</span>
                    <button onClick={() => onReply(comment.id, comment.user.username)} className="text-[10px] font-black text-zinc-400 hover:text-red-600 uppercase">Reply</button>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-2 pl-4 border-l-2 border-red-600/10 space-y-4">
                        {comment.replies.map(reply => <CommentNode key={reply.id} comment={reply} onReply={onReply} />)}
                    </div>
                )}
            </div>
        </div>
    );
}