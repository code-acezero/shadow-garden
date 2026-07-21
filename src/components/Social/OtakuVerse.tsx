"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, 
  Smile, Send, Bookmark, Flag, Trash2, X, Repeat2, Menu,
  ShieldCheck, Eye, Flame, Link as LinkIcon, Home, Hash, Users, Bell, User as UserIcon, Settings,
  Facebook, MessageSquare, SendHorizontal, MessageCircleMore, Loader2, ThumbsUp, Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { AppUser, ImageAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';
import ImageLightbox from './ImageLightbox';
import ClanSystem from './Clans/ClanSystem';
import Link from 'next/link';

// --- TYPES ---
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  likes_count?: number;
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
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'news' | 'clans' | 'following'
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Feature States
  const [activePostForComments, setActivePostForComments] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTags, setTrendingTags] = useState<{tag: string, count: number, cat: string}[]>([]);
  const [aniListNews, setAniListNews] = useState<any[]>([]);
  const [isAniNewsLoading, setIsAniNewsLoading] = useState(true);

  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- SCROLLBAR FIX ---
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

  // --- ANILIST NEWS LOGIC ---
  useEffect(() => {
    const fetchAniListNews = async () => {
      try {
        const query = `
          query {
            Page(page: 1, perPage: 8) {
              threads(sort: ID_DESC) {
                id
                title
                body
                createdAt
                user {
                  name
                  avatar { large }
                }
                categories { name }
                replyCount
                viewCount
              }
            }
          }
        `;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        if (data.data?.Page?.threads) {
          setAniListNews(data.data.Page.threads);
        }
      } catch (e) {
        console.error('AniList News fetch error:', e);
      } finally {
        setIsAniNewsLoading(false);
      }
    };
    fetchAniListNews();
  }, []);

  // --- FETCH POSTS LOGIC ---
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
          const { data: bmData } = await supabase.from('social_bookmarks').select('user_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
          isLiked = !!likeData;
          isBookmarked = !!bmData;
        }

        return {
          ...post,
          likes_count: lCount,
          comments_count: cCount,
          is_liked_by_user: isLiked,
          is_bookmarked: isBookmarked,
          user: post.user || { username: 'Otaku Explorer', avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${post.user_id}` }
        };
      }));

      setPosts(postsWithMetadata);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (selectedImages.length + filesArray.length > 4) {
        toast.error("Maximum 4 images allowed per post");
        return;
      }
      setSelectedImages(prev => [...prev, ...filesArray]);
    }
  };

  // Submit Post
  const handleCreatePost = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (!newPost.trim() && selectedImages.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedImages) {
        const url = await ImageAPI.uploadImage(file);
        uploadedUrls.push(url);
      }

      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: newPost,
          images: uploadedUrls,
          tags: []
        })
        .select(`*, user:profiles(username, avatar_url, role)`)
        .single();

      if (error) throw error;

      toast.success("Post published!");
      setNewPost('');
      setSelectedImages([]);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setIsUploading(false);
    }
  };

  // Like Toggle
  const handleLike = async (post: SocialPost) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          is_liked_by_user: !p.is_liked_by_user,
          likes_count: p.is_liked_by_user ? p.likes_count - 1 : p.likes_count + 1
        };
      }
      return p;
    }));

    try {
      if (post.is_liked_by_user) {
        await supabase.from('social_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        await supabase.from('social_likes').insert({ post_id: post.id, user_id: user.id });
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Fetch Comments
  const fetchComments = async (postId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('social_comments')
        .select(`*, user:profiles(username, avatar_url, role)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      (data || []).forEach((c: any) => {
        const item: Comment = { 
          ...c, 
          replies: [],
          user: c.user || { username: 'Adventurer', avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user_id}` } 
        };
        commentMap.set(c.id, item);
      });

      commentMap.forEach(item => {
        if (item.parent_id && commentMap.has(item.parent_id)) {
          commentMap.get(item.parent_id)!.replies!.push(item);
        } else {
          rootComments.push(item);
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Fetch comments error:', err);
    }
  };

  // Submit Comment
  const handlePostComment = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (!commentText.trim() || !activePostForComments) return;

    try {
      const { error } = await supabase.from('social_comments').insert({
        post_id: activePostForComments.id,
        user_id: user.id,
        parent_id: replyTarget?.id || null,
        content: commentText
      });

      if (error) throw error;

      setCommentText('');
      setReplyTarget(null);
      fetchComments(activePostForComments.id);
      fetchPosts();
      toast.success("Comment posted");
    } catch (err) {
      toast.error("Failed to post comment");
    }
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    return p.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full h-full bg-[#050505] text-white flex justify-center selection:bg-primary-500 selection:text-white">
      <div className="max-w-7xl w-full h-full flex justify-center lg:justify-between px-0 md:px-2 pt-16 md:pt-20">
        
        {/* LEFT SIDEBAR (Desktop) */}
        <header className="hidden sm:flex w-20 lg:w-64 xl:w-72 flex-col justify-between h-full pt-0 pb-20 px-2 lg:px-4 overflow-y-auto custom-scrollbar">
           <div className="flex flex-col gap-1 w-full items-center lg:items-start">
              <div className="flex items-center justify-center lg:justify-start w-12 h-12 lg:w-auto lg:p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors mb-2 text-primary-500">
                 <Hash size={28} />
                 <span className="hidden lg:block font-black text-xl ml-3 tracking-widest uppercase">OtakuVerse</span>
              </div>
              
              <NavButton icon={<Home size={24} />} label="Home" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
              <NavButton icon={<Users size={24} />} label="Following" active={activeTab === 'following'} onClick={() => setActiveTab('following')} />
              <NavButton icon={<Newspaper size={24} />} label="News" active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
              <NavButton icon={<MessageSquare size={24} />} label="Messages" onClick={() => window.location.href = '/messages'} />
              <NavButton icon={<Users size={24} />} label="Watch Rooms" onClick={() => window.location.href = '/rooms'} />
              <NavButton icon={<UserIcon size={24} />} label="Profile" onClick={() => user ? (window.location.href='/profile') : onAuthRequired()} />

              <Button 
                onClick={() => user ? document.getElementById('composer-input')?.focus() : onAuthRequired()} 
                className="mt-4 w-12 h-12 lg:w-[90%] lg:h-14 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-[0px] lg:text-base transition-all p-0 shadow-lg shadow-primary-900/30 mx-auto lg:mx-0"
              >
                 <span className="hidden lg:inline uppercase tracking-wider">Post</span>
                 <SendHorizontal size={22} className="lg:hidden" />
              </Button>
           </div>

           {user && (
              <div className="flex items-center justify-center lg:justify-between gap-3 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors mb-4 w-full border border-white/5">
                 <img 
                   src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} 
                   alt="" 
                   className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                   onError={(e) => { (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`); }}
                 />
                 <div className="hidden lg:block overflow-hidden flex-1">
                    <p className="font-bold text-white text-sm truncate leading-tight">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-zinc-500 text-xs truncate leading-tight">@{user.user_metadata?.preferred_username || 'shadow'}</p>
                 </div>
              </div>
           )}
        </header>

        {/* MIDDLE COLUMN (Feed & Mobile Header) */}
        <main className="flex-1 max-w-[620px] w-full h-full overflow-y-auto custom-scrollbar border-x border-white/10 pb-[120px] md:pb-20">
           
           {/* Sticky Top Header */}
           <div className="relative z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center justify-between p-3.5 sm:hidden border-b border-white/5">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 text-zinc-300 hover:text-white rounded-full bg-white/5 border border-white/10"
                >
                  <Menu size={20} />
                </button>
                <h2 className="text-base font-black font-lemon text-primary-500 tracking-widest uppercase">
                  OtakuVerse
                </h2>
                <Link href="/messages" className="p-2 text-primary-400 rounded-full bg-primary-600/10 border border-primary-500/20">
                  <MessageSquare size={18} />
                </Link>
              </div>

              {/* Tab Selector — Feed & Clans (News moved to right sidebar on desktop) */}
              <div className="flex">
                  <button onClick={() => setActiveTab('feed')} className="flex-1 hover:bg-white/5 transition-colors pt-3.5 pb-0 relative flex justify-center">
                     <div className={`pb-3 font-bold text-xs uppercase tracking-wider ${activeTab === 'feed' ? 'text-white' : 'text-zinc-500'}`}>
                        Otaku Feed
                        {activeTab === 'feed' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 rounded-t-full" />}
                     </div>
                  </button>
                  {/* News tab only on mobile — on desktop it's in the right sidebar */}
                  <button onClick={() => setActiveTab('news')} className="flex-1 hover:bg-white/5 transition-colors pt-3.5 pb-0 relative flex justify-center lg:hidden">
                     <div className={`pb-3 font-bold text-xs uppercase tracking-wider ${activeTab === 'news' ? 'text-white' : 'text-zinc-500'}`}>
                        News
                        {activeTab === 'news' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 rounded-t-full" />}
                     </div>
                  </button>
                  <button onClick={() => setActiveTab('clans')} className="flex-1 hover:bg-white/5 transition-colors pt-3.5 pb-0 relative flex justify-center">
                     <div className={`pb-3 font-bold text-xs uppercase tracking-wider ${activeTab === 'clans' ? 'text-white' : 'text-zinc-500'}`}>
                        Clans
                        {activeTab === 'clans' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 rounded-t-full" />}
                     </div>
                  </button>
              </div>
           </div>

           {/* Inline Composer (Only in feed tab) */}
           {activeTab === 'feed' && (
             <div className="p-4 border-b border-white/10 flex gap-3.5 bg-black/40">
                <img 
                  src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0 cursor-pointer"
                  onError={(e) => { (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`); }}
                />
                <div className="flex-1">
                   <Textarea 
                     id="composer-input"
                     placeholder="What's on your mind, Otaku?" 
                     value={newPost}
                     onChange={(e) => setNewPost(e.target.value)}
                     className="min-h-[60px] max-h-[300px] w-full bg-transparent border-none text-base text-white resize-none focus-visible:ring-0 placeholder:text-zinc-600 p-1 twitter-scrollbar"
                     onClick={() => !user && onAuthRequired()}
                   />
                   
                   {selectedImages.length > 0 && (
                       <div className="flex gap-2 overflow-x-auto pb-3 mt-2">
                           {selectedImages.map((image, index) => (
                               <div key={index} className="relative group rounded-2xl overflow-hidden border border-white/10 shrink-0 w-28 h-28">
                                 <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" alt="Preview" />
                                 <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-black/70 backdrop-blur-md rounded-full text-white p-1 hover:bg-black transition-colors"><X size={12} /></button>
                               </div>
                           ))}
                       </div>
                   )}

                   <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-3">
                      <div className="flex gap-1 text-primary-500">
                         <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-500/10 w-8 h-8 text-primary-400" onClick={() => document.getElementById('img-upload-inline')?.click()}>
                            <ImageIcon size={18} />
                         </Button>
                         <input id="img-upload-inline" type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                      </div>

                      <Button 
                        onClick={handleCreatePost} 
                        disabled={isUploading || (!newPost.trim() && selectedImages.length === 0)}
                        className="bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-full px-5 py-1.5 h-8 text-xs uppercase tracking-wider shadow-md disabled:opacity-40 transition-all"
                      >
                         {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                      </Button>
                   </div>
                </div>
             </div>
           )}

           {/* View Switching */}
           {activeTab === 'clans' ? (
                <div className="p-4"><ClanSystem /></div>
            ) : activeTab === 'news' ? (
                <div className="p-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-4">
                    <Newspaper size={16} className="text-primary-500" /> Anime Industry & Community News
                  </h3>
                  {isAniNewsLoading ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">Loading anime news...</div>
                  ) : (
                    aniListNews.map(thread => (
                      <div key={thread.id} className="p-5 bg-[#0a0a0d] border border-white/10 rounded-3xl space-y-3 hover:border-primary-500/40 transition-all shadow-lg">
                        <div className="flex items-center gap-3">
                          <img src={thread.user?.avatar?.large} alt="" className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                          <div>
                            <span className="text-xs font-bold text-white">{thread.user?.name}</span>
                            <span className="text-[10px] text-zinc-500 block">{new Date(thread.createdAt * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-primary-400">{thread.title}</h4>
                        <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">{thread.body?.replace(/<[^>]*>?/gm, '')}</p>
                      </div>
                    ))
                  )}
                </div>
            ) : isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-500 w-8 h-8" /></div>
            ) : filteredPosts.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-xs font-bold">{searchQuery ? "No results found." : "No posts published yet."}</div>
            ) : (
                <div className="pb-[30vh]">
                   {filteredPosts.map((post) => (
                      <PostItem 
                         key={post.id} 
                         post={post} 
                         highlightId={highlightId}
                         ref={(el: any) => { postRefs.current[post.id] = el; }}
                         onLike={() => handleLike(post)}
                         onComment={() => { setActivePostForComments(post); fetchComments(post.id); }}
                         onShare={(platform: string) => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success("Post link copied");
                            }
                         }}
                         onBookmark={() => toast.success("Post bookmarked")}
                         onDelete={() => {
                            supabase.from('social_posts').delete().eq('id', post.id).then(() => fetchPosts());
                         }}
                         onImageClick={(src: string) => setLightbox({ isOpen: true, src })}
                         currentUserId={user?.id}
                      />
                   ))}
                </div>
            )}
        </main>

        {/* RIGHT SIDEBAR — News (Desktop only, always visible) */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-full pt-4 pb-20 px-4 overflow-y-auto custom-scrollbar shrink-0">
          <div className="sticky top-0 pb-3 bg-[#050505] z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Newspaper size={14} className="text-primary-500" /> Anime Industry News
            </h3>
          </div>
          <div className="space-y-3">
            {isAniNewsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-[#0a0a0d] border border-white/5 rounded-2xl space-y-2 animate-pulse">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                  <div className="h-2 bg-white/5 rounded w-2/3" />
                </div>
              ))
            ) : (
              aniListNews.map(thread => (
                <div key={thread.id} className="p-4 bg-[#0a0a0d] border border-white/5 rounded-2xl space-y-2 hover:border-primary-500/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <img src={thread.user?.avatar?.large} alt="" className="w-6 h-6 rounded-full border border-white/10 object-cover" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-white truncate block">{thread.user?.name}</span>
                      <span className="text-[9px] text-zinc-600">{new Date(thread.createdAt * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-primary-400 group-hover:text-primary-300 transition-colors line-clamp-2">{thread.title}</h4>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{thread.body?.replace(/<[^>]*>?/gm, '')}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="w-72 bg-[#0c0c0e] border-r border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="font-black text-lg text-primary-500 uppercase tracking-widest">OtakuVerse</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <Link href="/home" className="flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5">
                    <Home size={18} /> Home
                  </Link>
                  <Link href="/messages" className="flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-primary-400 bg-primary-600/10 border border-primary-500/20">
                    <MessageSquare size={18} /> Direct Messages
                  </Link>
                  <Link href="/rooms" className="flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5">
                    <Users size={18} /> Watch Rooms
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5">
                    <UserIcon size={18} /> Profile
                  </Link>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <img
                    src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-xs truncate">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-[10px] text-zinc-500 truncate">@{user.user_metadata?.preferred_username}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Facebook-Style Comments Dialog Modal */}
      <Dialog open={!!activePostForComments} onOpenChange={() => setActivePostForComments(null)}>
        <DialogContent className="max-w-xl bg-[#0d0d10] border border-white/10 text-white rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-xs font-black uppercase tracking-widest text-zinc-300">
              Comments ({comments.length})
            </DialogTitle>
          </DialogHeader>

          {/* Facebook-Style Comment Threads Stream */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">Be the first to comment!</div>
            ) : (
              comments.map(c => (
                <FacebookCommentBubble
                  key={c.id}
                  comment={c}
                  onReply={(id, name) => setReplyTarget({ id, name })}
                />
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            {replyTarget && (
              <div className="text-[10px] text-primary-400 flex items-center justify-between bg-primary-600/10 p-2 rounded-xl border border-primary-500/20">
                <span>Replying to <strong>@{replyTarget.name}</strong></span>
                <button onClick={() => setReplyTarget(null)} className="text-zinc-400 hover:text-white"><X size={12} /></button>
              </div>
            )}

            <div className="flex gap-2.5">
              <img
                src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                onError={(e) => { (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'guest'}`); }}
              />
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded-full text-xs font-bold uppercase transition-all shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageLightbox isOpen={lightbox.isOpen} src={lightbox.src} onClose={() => setLightbox({ isOpen: false, src: '' })} />
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
   return (
      <div onClick={onClick} className="flex items-center justify-center lg:justify-start gap-3.5 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors w-12 h-12 lg:w-auto lg:h-auto mx-auto lg:mx-0 group">
         <div className={`${active ? 'text-primary-500' : 'text-zinc-400 group-hover:text-white'}`}>
            {icon}
         </div>
         <span className={`hidden lg:block text-sm uppercase tracking-wider ${active ? 'font-black text-white' : 'font-bold text-zinc-400 group-hover:text-white'}`}>{label}</span>
      </div>
   );
}

const PostItem = React.forwardRef<HTMLDivElement, any>(({ post, highlightId, onLike, onComment, onShare, onBookmark, onDelete, onImageClick, currentUserId }, ref) => {
   const avatarUrl = post.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.user?.username || post.user_id}`;

   return (
      <div ref={ref} className={`flex gap-3.5 p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer ${highlightId === post.id ? 'bg-white/10' : ''}`} onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('.image-grid')) {
             onComment();
          }
      }}>
         <img 
            src={avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onError={(e) => { (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${post.user_id}`); }}
            onClick={(e) => { e.stopPropagation(); window.location.href = `/profile/${post.user?.username}`; }}
         />

         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5 truncate">
                  <span 
                      className="font-bold text-sm text-white hover:underline cursor-pointer truncate"
                      onClick={(e) => { e.stopPropagation(); window.location.href = `/profile/${post.user?.username}`; }}
                  >{post.user?.username || 'Otaku Explorer'}</span>
                  {post.user?.role === 'admin' && <ShieldCheck size={14} className="text-primary-500 shrink-0" />}
                  <span className="text-zinc-500 text-xs truncate">@{post.user?.username?.toLowerCase().replace(/\s/g, '')}</span>
                  <span className="text-zinc-500 text-xs">·</span>
                  <span className="text-zinc-500 text-xs shrink-0">{formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}</span>
               </div>
            </div>

            <p className="text-xs sm:text-sm text-white mt-1.5 whitespace-pre-wrap leading-relaxed">{post.content}</p>

            {post.images && post.images.length > 0 && (
                <div className={`mt-3 rounded-2xl overflow-hidden border border-white/10 image-grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} grid gap-1`}>
                    {post.images.map((img: string, i: number) => (
                        <div key={i} className="relative bg-zinc-900 cursor-pointer hover:brightness-110 transition-all" onClick={(e) => { e.stopPropagation(); onImageClick(img); }}>
                           <img src={img} className="w-full h-full object-cover aspect-video sm:aspect-square" alt="Post media" />
                        </div>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-between items-center mt-3 text-zinc-500 max-w-md">
                <button onClick={(e) => { e.stopPropagation(); onComment(); }} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                   <MessageCircle size={16} />
                   <span className="text-xs font-bold">{post.comments_count > 0 ? post.comments_count : ''}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onLike(); }} className={`flex items-center gap-1.5 transition-colors ${post.is_liked_by_user ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                   <Heart size={16} className={post.is_liked_by_user ? 'fill-current' : ''} />
                   <span className="text-xs font-bold">{post.likes_count > 0 ? post.likes_count : ''}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onShare('copy'); }} className="hover:text-white transition-colors">
                   <Share2 size={16} />
                </button>
            </div>
         </div>
      </div>
   );
});

// --- FACEBOOK-STYLE COMMENT BUBBLE COMPONENT ---
function FacebookCommentBubble({ comment, onReply }: { comment: Comment; onReply: (id: string, name: string) => void }) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const avatarUrl = comment.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user?.username || comment.user_id}`;

  return (
    <div className="flex gap-2.5 items-start group">
      <img
        src={avatarUrl}
        alt=""
        className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 mt-1"
        onError={(e) => { (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user_id}`); }}
      />

      <div className="flex-1 min-w-0 space-y-1">
        {/* Facebook Gray Comment Bubble */}
        <div className="bg-[#18191c] border border-white/5 p-3 rounded-2xl rounded-tl-xs shadow-md inline-block max-w-full">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-white hover:underline cursor-pointer">
              {comment.user?.username || 'User'}
            </span>
            {comment.user?.role === 'admin' && <ShieldCheck size={12} className="text-primary-500" />}
          </div>
          <p className="text-xs text-zinc-200 mt-1 whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>
        </div>

        {/* Facebook Style Action Buttons Below Bubble */}
        <div className="flex items-center gap-4 text-[10px] text-zinc-400 pl-2 font-bold">
          <button
            onClick={() => {
              setHasLiked(!hasLiked);
              setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);
            }}
            className={`hover:underline ${hasLiked ? 'text-primary-400' : 'hover:text-white'}`}
          >
            Like {likesCount > 0 && `(${likesCount})`}
          </button>

          <button
            onClick={() => onReply(comment.id, comment.user?.username || 'User')}
            className="hover:underline hover:text-white"
          >
            Reply
          </button>

          <span className="text-zinc-600 font-normal">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}
          </span>
        </div>

        {/* Nested Child Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-4 border-l border-white/10 mt-2 space-y-3">
            {comment.replies.map(reply => (
              <FacebookCommentBubble key={reply.id} comment={reply} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
