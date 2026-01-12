"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, 
  Video, Smile, Send, Bookmark, Flag, UserPlus, Loader2, Trash2, X 
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
import { AppUser, supabase, ImageAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// --- TYPES ---
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
}

export default function OtakuVerse({ user, onAuthRequired }: OtakuVerseProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  const channelRef = useRef<any>(null);
  const isVisibleRef = useRef(true);

  // --- 1. FETCH LOGIC ---
  const fetchPosts = useCallback(async (showLoading = false) => {
    if (!supabase) return;

    if (showLoading) setIsLoading(true);
    try {
     let query = supabase
        .from('social_posts')
        .select(`
          *,
          user:profiles(username, avatar_url, role),
          likes:social_likes(count),
          comments:social_comments(count)
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

        if (user && supabase) {
          const { data: likeData } = await supabase.from('social_likes').select('user_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
          if (likeData) isLiked = true;
          
          const { data: bookmarkData } = await supabase.from('social_bookmarks').select('user_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
          if (bookmarkData) isBookmarked = true;
        }

        return {
          ...post,
          likes_count: (post as any).likes?.[0]?.count || 0,
          comments_count: (post as any).comments?.[0]?.count || 0,
          is_liked_by_user: isLiked,
          is_bookmarked: isBookmarked,
          user: post.user
        };
      }));

      if (activeTab === 'trending') {
        postsWithMetadata.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      setPosts(postsWithMetadata);
    } catch (err) {
      console.error("Fetch Error", err);
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
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'social_posts' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
             fetchPosts(); 
             toast("New signal detected.", { description: "Feed updated." });
          } else if (payload.eventType === 'DELETE') {
             setPosts(current => current.filter(p => p.id !== payload.old.id));
          }
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

  // --- 3. ACTIONS ---
  const handleCreatePost = async () => {
    if (!user) return onAuthRequired();
    if (!supabase) return;
    if (!newPost.trim() && selectedImages.length === 0) return toast.error("Transmission is empty.");

    setIsUploading(true);
    const imageUrls: string[] = [];

    try {
      // Sequential upload with toast updates
      for (let i = 0; i < selectedImages.length; i++) {
        toast.info(`Uploading image ${i + 1} of ${selectedImages.length}...`);
        const publicUrl = await ImageAPI.uploadImage(selectedImages[i]);
        imageUrls.push(publicUrl);
      }

      const { error } = await supabase.from('social_posts').insert({
        user_id: user.id,
        content: newPost,
        images: imageUrls,
        tags: extractTags(newPost)
      } as any);

      if (error) throw error;

      setNewPost('');
      setSelectedImages([]);
      setShowCreatePost(false);
      toast.success("Broadcast sent successfully.");
      fetchPosts();

    } catch (error: any) {
      console.error("Post Creation Error:", error);
      toast.error(error.message || "Failed to post.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (post: SocialPost) => {
    if (!user) return onAuthRequired();
    if (!supabase) return;

    const previousPosts = [...posts];
    setPosts(posts.map(p => p.id === post.id 
      ? { ...p, is_liked_by_user: !p.is_liked_by_user, likes_count: p.is_liked_by_user ? (p.likes_count - 1) : (p.likes_count + 1) } 
      : p
    ));

    try {
      if (post.is_liked_by_user) {
        await supabase.from('social_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        await supabase.from('social_likes').insert({ post_id: post.id, user_id: user.id } as any);
      }
    } catch (err) {
      setPosts(previousPosts);
      toast.error("Connection failed.");
    }
  };

  const handleBookmark = async (post: SocialPost) => {
    if (!user) return onAuthRequired();
    if (!supabase) return;

    setPosts(posts.map(p => p.id === post.id ? { ...p, is_bookmarked: !p.is_bookmarked } : p));

    try {
      if (post.is_bookmarked) {
        await supabase.from('social_bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id);
        toast.success("Removed from bookmarks.");
      } else {
        await supabase.from('social_bookmarks').insert({ post_id: post.id, user_id: user.id } as any);
        toast.success("Saved to memory.");
      }
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || !supabase) return;
    if (!confirm("Delete this transmission?")) return;

    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', postId);
      if (error) throw error;
      toast.success("Transmission erased.");
      setPosts(current => current.filter(p => p.id !== postId));
    } catch (err) {
      toast.error("Could not delete.");
    }
  };

  // --- UTILS ---
  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl min-h-screen">
      <div className="space-y-6">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 font-[Cinzel] tracking-widest">
            OTAKU<span className="text-red-600">VERSE</span>
          </h1>
          <p className="text-zinc-500 uppercase text-xs tracking-[0.3em] font-bold">The Global Neural Network</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#0a0a0a] border border-white/10 p-1 rounded-xl">
            {['feed', 'trending', 'following', 'discover'].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="capitalize data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold rounded-lg text-xs tracking-wider"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6 mt-6">
            
            <Card className="bg-[#0a0a0a] border-white/10 hover:border-red-500/30 transition-all cursor-pointer group">
              <CardContent className="p-4 flex gap-4 items-center" onClick={() => user ? setShowCreatePost(true) : onAuthRequired()}>
                <Avatar className="w-10 h-10 border border-white/10 group-hover:border-red-500 transition-colors">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-500 font-bold">{user?.user_metadata?.username?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-white/5 h-10 rounded-full flex items-center px-4 text-zinc-500 text-sm font-medium group-hover:bg-white/10 transition-colors">
                  Start a transmission...
                </div>
                <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-red-500"><ImageIcon size={20} /></Button>
              </CardContent>
            </Card>

            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-[Cinzel] tracking-widest uppercase">New Transmission</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-3">
                    <Avatar>
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-white">{user?.user_metadata?.username}</p>
                        <Badge variant="outline" className="text-[10px] h-5 border-red-500/30 text-red-400">Public Channel</Badge>
                    </div>
                  </div>

                  <Textarea
                    placeholder="What are you watching? #Anime #Manga"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[150px] bg-white/5 border-none text-zinc-200 placeholder:text-zinc-600 resize-none focus-visible:ring-0 text-base"
                  />

                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-white/10">
                          <img src={URL.createObjectURL(image)} className="w-full h-32 object-cover" alt="Preview" />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                        <Button type="button" size="icon" variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => document.getElementById('img-upload')?.click()}>
                            <ImageIcon size={20} />
                            <input id="img-upload" type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><Smile size={20} /></Button>
                    </div>
                    <Button 
                        onClick={handleCreatePost} 
                        disabled={isUploading || (!newPost && selectedImages.length === 0)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 rounded-full"
                    >
                        {isUploading ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> Broadcast</>}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-20 text-zinc-500 animate-pulse font-bold tracking-widest">CONNECTING TO NEURAL NETWORK...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600">
                        <p className="mb-4">Signal lost. No transmissions found.</p>
                        {activeTab === 'following' && <p className="text-xs">Try following more agents.</p>}
                    </div>
                ) : (
                    <AnimatePresence>
                        {posts.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                <Card className="bg-[#0a0a0a] border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                                        <div className="flex gap-3">
                                            <Avatar className="cursor-pointer border border-white/10">
                                                <AvatarImage src={post.user?.avatar_url} />
                                                <AvatarFallback className="bg-zinc-900 text-zinc-500">{post.user?.username?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-white hover:text-red-500 cursor-pointer transition-colors">{post.user?.username || "Unknown Agent"}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">{formatDistanceToNow(new Date(post.created_at))} ago</p>
                                            </div>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-black border-white/10 text-zinc-300">
                                                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer"><Flag size={14} className="mr-2"/> Report</DropdownMenuItem>
                                                {user?.id === post.user_id && (
                                                    <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="focus:bg-red-900/20 text-red-500 focus:text-red-400 cursor-pointer">
                                                        <Trash2 size={14} className="mr-2"/> Delete
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                        
                                        {post.images && post.images.length > 0 && (
                                            <div className={`grid gap-1 rounded-xl overflow-hidden ${
                                                post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                            }`}>
                                                {post.images.map((img, i) => (
                                                    <img key={i} src={img} className="w-full h-auto object-cover max-h-[400px] hover:scale-105 transition-transform duration-500 cursor-zoom-in bg-zinc-900" alt="Post" />
                                                ))}
                                            </div>
                                        )}

                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">#{tag}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex gap-6">
                                                <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-xs font-bold transition-colors ${post.is_liked_by_user ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}>
                                                    <Heart size={18} className={post.is_liked_by_user ? "fill-current" : ""} /> {post.likes_count}
                                                </button>
                                                <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-blue-400 transition-colors">
                                                    <MessageCircle size={18} /> {post.comments_count}
                                                </button>
                                                <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-green-400 transition-colors">
                                                    <Share2 size={18} /> Share
                                                </button>
                                            </div>
                                            <button onClick={() => handleBookmark(post)} className={`text-zinc-500 hover:text-yellow-400 transition-colors ${post.is_bookmarked ? 'text-yellow-400' : ''}`}>
                                                <Bookmark size={18} className={post.is_bookmarked ? "fill-current" : ""} />
                                            </button>
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
    </div>
  );
}