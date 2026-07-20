"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, 
  Smile, Send, Bookmark, Flag, Trash2, X, Repeat2,
  ShieldCheck, Eye, Flame, Link as LinkIcon, Home, Hash, Users, Bell, User as UserIcon, Settings,
  Facebook, MessageSquare, SendHorizontal, MessageCircleMore, Loader2
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

  // --- ANILIST NEWS LOGIC ---
  useEffect(() => {
    const fetchAniListNews = async () => {
      try {
        const query = `
          query {
            Page(page: 1, perPage: 5) {
              threads(sort: ID_DESC) {
                id
                title
                createdAt
                replyCount
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
        if (data?.data?.Page?.threads) setAniListNews(data.data.Page.threads);
      } catch (e) {
        console.error("Failed to fetch AniList news", e);
      } finally {
        setIsAniNewsLoading(false);
      }
    };
    fetchAniListNews();
  }, []);

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

      // Calculate trending tags from the raw data
      if (activeTab === 'feed') {
          const tagCounts: Record<string, number> = {};
          data.forEach((p: any) => {
             if (p.tags && Array.isArray(p.tags)) {
                 p.tags.forEach((tag: string) => {
                     tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                 });
             }
          });
          const topTags = Object.entries(tagCounts)
             .sort((a,b) => b[1] - a[1])
             .slice(0, 5)
             .map(([tag, count]) => ({ tag, count, cat: "Community · Trending" }));
          setTrendingTags(topTags);
      }

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
      setNewPost(''); setSelectedImages([]);
      fetchPosts();
    } catch (e) { toast.error("Upload failed."); } finally { setIsUploading(false); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || !supabase) return onAuthRequired();
    if (!confirm("Delete this post permanently?")) return;

    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', postId);
      if (error) throw error;
      toast.success("Post deleted.");
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
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard.");
      return;
    }

    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  const handleBookmark = async (post: SocialPost) => {
    if (!user) return onAuthRequired();
    const isBookmarking = !post.is_bookmarked;
    setPosts(posts.map(p => p.id === post.id ? { ...p, is_bookmarked: isBookmarking } : p));
    if (isBookmarking) await supabase.from('social_bookmarks').insert({ post_id: post.id, user_id: user.id } as any);
    else await supabase.from('social_bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id);
    toast.success(isBookmarking ? "Added to Bookmarks" : "Removed from Bookmarks");
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

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.content.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
  });

  return (
    <div className="w-full h-full overflow-hidden bg-[#050505] flex justify-center pb-20 md:pb-0 pt-20 md:pt-0">
      <style jsx global>{`
        body {
          overflow: auto !important;
          padding-right: 0px !important;
        }
        .twitter-scrollbar::-webkit-scrollbar { width: 6px; }
        .twitter-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
      `}</style>

      <ImageLightbox isOpen={lightbox.isOpen} src={lightbox.src} onClose={() => setLightbox({ ...lightbox, isOpen: false })} />

      <div className="max-w-7xl w-full h-full flex justify-center lg:justify-between px-0 md:px-4">
        
        {/* LEFT SIDEBAR (Desktop) */}
        <header className="hidden sm:flex w-20 lg:w-64 xl:w-72 flex-col justify-between sticky top-0 h-full pt-4 pb-20 px-2 lg:px-4">
           <div className="flex flex-col gap-1 w-full items-center lg:items-start">
              <div className="flex items-center justify-center lg:justify-start w-12 h-12 lg:w-auto lg:p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors mb-2 text-primary-500">
                 <Hash size={28} />
                 <span className="hidden lg:block font-bold text-xl ml-4 font-[Cinzel] tracking-widest uppercase">OtakuVerse</span>
              </div>
              
              <NavButton icon={<Home size={26} />} label="Home" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
              <NavButton icon={<Users size={26} />} label="Following" active={activeTab === 'following'} onClick={() => setActiveTab('following')} />
              <NavButton icon={<Flame size={26} />} label="Trending" active={activeTab === 'trending'} onClick={() => setActiveTab('trending')} />
              <NavButton icon={<Bell size={26} />} label="Notifications" onClick={() => user ? toast("No new notifications") : onAuthRequired()} />
              <NavButton icon={<UserIcon size={26} />} label="Profile" onClick={() => user ? (window.location.href='/profile') : onAuthRequired()} />

              <Button 
                onClick={() => user ? document.getElementById('composer-input')?.focus() : onAuthRequired()} 
                className="mt-4 w-12 h-12 lg:w-[90%] lg:h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-[0px] lg:text-[17px] transition-colors p-0 shadow-lg mx-auto lg:mx-0"
              >
                 <span className="hidden lg:inline">Post</span>
                 <SendHorizontal size={22} className="lg:hidden" />
              </Button>
           </div>

           {user && (
              <div className="flex items-center justify-center lg:justify-between gap-3 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors mb-4 w-full">
                 <Avatar className="w-10 h-10 shrink-0"><AvatarImage src={user.user_metadata?.avatar_url}/><AvatarFallback>?</AvatarFallback></Avatar>
                 <div className="hidden lg:block overflow-hidden flex-1">
                    <p className="font-bold text-white text-[15px] truncate leading-tight">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-zinc-500 text-[15px] truncate leading-tight">@{user.user_metadata?.preferred_username || user.user_metadata?.name || 'shadow'}</p>
                 </div>
                 <MoreHorizontal className="hidden lg:block text-zinc-500 shrink-0" />
              </div>
           )}
        </header>

        {/* MIDDLE COLUMN (Feed) */}
        <main className="flex-1 max-w-[600px] w-full h-full overflow-y-auto custom-scrollbar border-x border-white/10 pb-[100px] md:pb-0">
           {/* Sticky Header */}
           <div className="sticky top-0 z-20 bg-black/70 backdrop-blur-md border-b border-white/10">
              <h2 className="text-xl font-bold p-4 sm:hidden font-[Cinzel] text-primary-500 tracking-widest uppercase">OtakuVerse</h2>
              <div className="flex">
                 <button onClick={() => setActiveTab('feed')} className="flex-1 hover:bg-white/5 transition-colors pt-4 pb-0 relative flex justify-center">
                    <div className={`pb-4 font-bold text-[15px] ${activeTab === 'feed' ? 'text-white' : 'text-zinc-500'}`}>
                       For you
                       {activeTab === 'feed' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 rounded-t-full" />}
                    </div>
                 </button>
                 <button onClick={() => setActiveTab('following')} className="flex-1 hover:bg-white/5 transition-colors pt-4 pb-0 relative flex justify-center">
                    <div className={`pb-4 font-bold text-[15px] ${activeTab === 'following' ? 'text-white' : 'text-zinc-500'}`}>
                       Following
                       {activeTab === 'following' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 rounded-t-full" />}
                    </div>
                 </button>
              </div>
           </div>

           {/* Inline Composer */}
           <div className="p-4 border-b border-white/10 flex gap-4">
              <Avatar className="w-10 h-10 shrink-0 cursor-pointer">
                 <AvatarImage src={user?.user_metadata?.avatar_url} />
                 <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                 <Textarea 
                   id="composer-input"
                   placeholder="What is happening?!" 
                   value={newPost}
                   onChange={(e) => setNewPost(e.target.value)}
                   className="min-h-[60px] max-h-[400px] w-full bg-transparent border-none text-xl text-white resize-none focus-visible:ring-0 placeholder:text-zinc-500 p-2 twitter-scrollbar"
                   onClick={() => !user && onAuthRequired()}
                 />
                 
                 {selectedImages.length > 0 && (
                     <div className="flex gap-2 overflow-x-auto pb-3 mt-2">
                         {selectedImages.map((image, index) => (
                             <div key={index} className="relative group rounded-2xl overflow-hidden border border-white/10 shrink-0 w-32 h-32">
                               <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" alt="Preview" />
                               <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-black/60 backdrop-blur-md rounded-full text-white p-1 hover:bg-black/80 transition-colors"><X size={14} /></button>
                             </div>
                         ))}
                     </div>
                 )}

                 <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-3">
                    <div className="flex gap-1 text-primary-500">
                       <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-500/10 w-9 h-9" onClick={() => document.getElementById('img-upload-inline')?.click()}>
                          <ImageIcon size={20} />
                       </Button>
                       <input id="img-upload-inline" type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                       <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-500/10 w-9 h-9">
                          <Smile size={20} />
                       </Button>
                    </div>
                    <Button 
                      onClick={handleCreatePost} 
                      disabled={isUploading || (!newPost.trim() && selectedImages.length === 0)} 
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full px-6 disabled:opacity-50"
                    >
                       {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : "Post"}
                    </Button>
                 </div>
              </div>
           </div>

           {/* Feed */}
           {isLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500 w-8 h-8" /></div>
           ) : filteredPosts.length === 0 ? (
               <div className="p-8 text-center text-zinc-500 font-bold">{searchQuery ? "No results found." : "No posts found."}</div>
           ) : (
               <div className="pb-[30vh]">
                  {filteredPosts.map((post) => (
                     <PostItem 
                        key={post.id} 
                        post={post} 
                        highlightId={highlightId}
                        ref={(el) => { postRefs.current[post.id] = el; }}
                        onLike={() => handleLike(post)}
                        onComment={() => { setActivePostForComments(post); fetchComments(post.id); }}
                        onShare={(platform: string) => handleShare(platform, post)}
                        onBookmark={() => handleBookmark(post)}
                        onDelete={() => handleDeletePost(post.id)}
                        onImageClick={(src: string) => setLightbox({ isOpen: true, src })}
                        currentUserId={user?.id}
                     />
                  ))}
               </div>
           )}
        </main>

        {/* RIGHT SIDEBAR (Desktop Only) */}
        <aside className="hidden lg:block w-[350px] pl-8 py-4 sticky top-0 h-full overflow-y-auto twitter-scrollbar">
            {/* Search */}
            <div className="relative group mb-4">
                <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#16181c] border border-transparent rounded-full py-3 px-12 text-white text-[15px] focus:outline-none focus:border-primary-500 focus:bg-black transition-colors" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary-500 transition-colors">
                   <Hash size={18} />
                </div>
            </div>

            {/* Trending Box */}
            <div className="bg-[#16181c] rounded-2xl overflow-hidden border border-white/5 mb-4">
                <h3 className="font-black text-xl p-4 text-white">What's happening</h3>
                
                {trendingTags.length > 0 ? trendingTags.map((trend, i) => (
                   <div key={i} onClick={() => setSearchQuery(trend.tag)} className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-start">
                      <div>
                         <p className="text-[13px] text-zinc-500">{trend.cat}</p>
                         <p className="font-bold text-[15px] text-white">#{trend.tag}</p>
                         <p className="text-[13px] text-zinc-500">{trend.count} posts</p>
                      </div>
                      <MoreHorizontal className="text-zinc-500 w-5 h-5 hover:text-primary-500 rounded-full hover:bg-primary-500/10 transition-colors" />
                   </div>
                )) : (
                   <div className="px-4 py-3 text-zinc-500 text-[13px]">No trending topics yet.</div>
                )}
                
                <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors text-primary-500 text-[15px] rounded-b-2xl">
                   Show more
                </div>
            </div>

            {/* AniList News Box */}
            <div className="bg-[#16181c] rounded-2xl overflow-hidden border border-white/5 mb-4">
                <h3 className="font-black text-xl p-4 text-white flex items-center justify-between">
                   Anime News
                   {isAniNewsLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                </h3>
                
                {aniListNews.length > 0 ? aniListNews.map((news) => (
                   <div key={news.id} onClick={() => window.open(`https://anilist.co/forum/thread/${news.id}`, '_blank')} className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-start">
                      <div>
                         <p className="text-[13px] text-zinc-500">AniList Community</p>
                         <p className="font-bold text-[14px] text-white line-clamp-2 leading-tight mt-0.5">{news.title}</p>
                         <p className="text-[13px] text-zinc-500 mt-1">{news.replyCount} replies</p>
                      </div>
                      <MoreHorizontal className="text-zinc-500 w-5 h-5 shrink-0 hover:text-primary-500 rounded-full hover:bg-primary-500/10 transition-colors" />
                   </div>
                )) : !isAniNewsLoading && (
                   <div className="px-4 py-3 text-zinc-500 text-[13px]">No news available right now.</div>
                )}
                
                <div onClick={() => window.open('https://anilist.co/forum/recent', '_blank')} className="p-4 hover:bg-white/5 cursor-pointer transition-colors text-primary-500 text-[15px] rounded-b-2xl">
                   View more on AniList
                </div>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-zinc-500 px-4">
               <a href="#" className="hover:underline">Terms of Service</a>
               <a href="#" className="hover:underline">Privacy Policy</a>
               <a href="#" className="hover:underline">Cookie Policy</a>
               <span>© 2026 Shadow Garden</span>
            </div>
        </aside>

      </div>

      {/* THREADED COMMENTS MODAL (X-STYLE) */}
      <Dialog open={!!activePostForComments} onOpenChange={(open) => { if(!open){ setActivePostForComments(null); setReplyTarget(null); } }}>
        <DialogContent className="bg-black border border-white/20 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 sm:rounded-2xl shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex flex-row items-center justify-between">
            <VisuallyHidden.Root><DialogTitle>Post</DialogTitle></VisuallyHidden.Root>
            <h2 className="text-xl font-bold text-white">Post</h2>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {activePostForComments && (
                <div className="p-4 border-b border-white/10">
                   {/* Main Post in Thread */}
                   <div className="flex gap-3 mb-3">
                      <Avatar className="w-10 h-10 shrink-0"><AvatarImage src={activePostForComments.user.avatar_url} /><AvatarFallback>?</AvatarFallback></Avatar>
                      <div className="flex flex-col justify-center">
                         <span className="font-bold text-[15px] text-white hover:underline cursor-pointer leading-none">{activePostForComments.user.username}</span>
                         <span className="text-zinc-500 text-[15px] mt-0.5">@{activePostForComments.user.username?.toLowerCase().replace(/\s/g, '')}</span>
                      </div>
                   </div>
                   <p className="text-[17px] text-white leading-normal whitespace-pre-wrap">{activePostForComments.content}</p>
                   {activePostForComments.images && activePostForComments.images.length > 0 && (
                       <div className={`mt-3 rounded-2xl overflow-hidden border border-white/10 image-grid grid gap-0.5 ${activePostForComments.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                           {activePostForComments.images.map((img: string, i: number) => (
                               <img key={i} src={img} className="w-full h-full object-cover aspect-video sm:aspect-square" alt="Post media" />
                           ))}
                       </div>
                   )}
                   <div className="py-4 text-[15px] text-zinc-500 flex gap-2">
                      <span>{formatDistanceToNow(new Date(activePostForComments.created_at))} ago</span>
                   </div>
                   <div className="py-3 border-y border-white/10 flex items-center gap-1 text-[15px] text-zinc-500">
                      <span className="font-bold text-white">{activePostForComments.likes_count}</span> Likes
                   </div>
                </div>
            )}
            
            {/* Threaded Comments */}
            <div className="p-4 pt-0">
               <div className="flex gap-3 py-4 border-b border-white/10">
                  <Avatar className="w-10 h-10 shrink-0"><AvatarImage src={user?.user_metadata?.avatar_url}/></Avatar>
                  <div className="flex-1 pt-1">
                     {replyTarget && (
                         <div className="text-[15px] text-zinc-500 mb-2">Replying to <span className="text-primary-500">@{replyTarget.name}</span> <button onClick={() => setReplyTarget(null)} className="hover:text-white ml-1">×</button></div>
                     )}
                     <Textarea placeholder="Post your reply" className="bg-transparent border-none resize-none text-xl p-0 min-h-[40px] text-white focus-visible:ring-0 placeholder:text-zinc-500 twitter-scrollbar" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                     <div className="flex justify-end mt-2">
                        <Button onClick={handlePostComment} disabled={!commentText.trim()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full px-5 disabled:opacity-50">Reply</Button>
                     </div>
                  </div>
               </div>
               
               <div className="pt-4">
                  {comments.map((comment, i) => (
                    <CommentNode key={comment.id} comment={comment} onReply={(id, name) => setReplyTarget({ id, name })} isLast={i === comments.length - 1} />
                  ))}
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
   return (
      <div onClick={onClick} className="flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-4 lg:py-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors w-12 h-12 lg:w-auto lg:h-auto mx-auto lg:mx-0 group">
         <div className={`${active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
            {icon}
         </div>
         <span className={`hidden lg:block text-xl ${active ? 'font-bold text-white' : 'font-normal text-zinc-300 group-hover:text-white'}`}>{label}</span>
      </div>
   )
}

const PostItem = React.forwardRef<HTMLDivElement, any>(({ post, highlightId, onLike, onComment, onShare, onBookmark, onDelete, onImageClick, currentUserId }, ref) => {
   return (
      <div ref={ref} className={`flex gap-3 p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer ${highlightId === post.id ? 'bg-white/10' : ''}`} onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('.image-grid')) {
             onComment();
          }
      }}>
         <Avatar className="w-10 h-10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={post.user?.avatar_url} />
            <AvatarFallback>?</AvatarFallback>
         </Avatar>

         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-[15px] text-white hover:underline cursor-pointer truncate">{post.user?.username}</span>
                  {post.user?.role === 'admin' && <ShieldCheck size={14} className="text-primary-500 shrink-0" />}
                  <span className="text-zinc-500 text-[15px] truncate">@{post.user?.username?.toLowerCase().replace(/\s/g, '')}</span>
                  <span className="text-zinc-500 text-[15px]">·</span>
                  <span className="text-zinc-500 text-[15px] hover:underline shrink-0">{formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}</span>
               </div>
               
               <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <button className="text-zinc-500 hover:text-primary-500 hover:bg-primary-500/10 p-1.5 rounded-full transition-colors group">
                           <MoreHorizontal size={18} className="group-hover:text-primary-500" />
                       </button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="bg-black border-white/10 text-zinc-300 shadow-2xl rounded-xl">
                       <DropdownMenuItem className="focus:bg-white/10 cursor-pointer font-bold py-2"><Flag size={16} className="mr-3"/> Report post</DropdownMenuItem>
                       {currentUserId === post.user_id && (
                           <DropdownMenuItem onClick={onDelete} className="focus:bg-red-500/10 text-red-500 font-bold cursor-pointer py-2"><Trash2 size={16} className="mr-3"/> Delete</DropdownMenuItem>
                       )}
                   </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <p className="text-[15px] text-white mt-1 whitespace-pre-wrap leading-tight">{post.content}</p>

            {post.images && post.images.length > 0 && (
                <div className={`mt-3 rounded-2xl overflow-hidden border border-white/10 image-grid ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} grid gap-0.5`}>
                    {post.images.map((img: string, i: number) => (
                        <div key={i} className={`relative bg-zinc-900 cursor-pointer hover:brightness-110 transition-all ${post.images.length === 3 && i === 0 ? 'row-span-2' : ''}`} onClick={(e) => { e.stopPropagation(); onImageClick(img); }}>
                           <img src={img} className="w-full h-full object-cover aspect-video sm:aspect-square" alt="Post media" />
                        </div>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-between items-center mt-3 text-zinc-500 max-w-md">
                <button onClick={(e) => { e.stopPropagation(); onComment(); }} className="flex items-center gap-0 group">
                   <div className="p-2 rounded-full group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                      <MessageCircle size={18} />
                   </div>
                   <span className="text-[13px] group-hover:text-blue-500 transition-colors px-1">{post.comments_count > 0 ? post.comments_count : ''}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-0 group">
                   <div className="p-2 rounded-full group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
                      <Repeat2 size={18} />
                   </div>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onLike(); }} className="flex items-center gap-0 group">
                   <div className={`p-2 rounded-full transition-colors ${post.is_liked_by_user ? 'text-pink-600' : 'group-hover:bg-pink-600/10 group-hover:text-pink-600'}`}>
                      <Heart size={18} className={post.is_liked_by_user ? 'fill-current' : ''} />
                   </div>
                   <span className={`text-[13px] transition-colors px-1 ${post.is_liked_by_user ? 'text-pink-600' : 'group-hover:text-pink-600'}`}>{post.likes_count > 0 ? post.likes_count : ''}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-0 group">
                   <div className="p-2 rounded-full group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
                      <Eye size={18} />
                   </div>
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                       <button className="flex items-center gap-0 group">
                          <div className="p-2 rounded-full group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
                             <Share2 size={18} />
                          </div>
                       </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-black border-white/10 text-zinc-300 rounded-xl shadow-2xl">
                        <DropdownMenuItem onClick={() => onShare('copy')} className="focus:bg-white/10 cursor-pointer font-bold py-2"><LinkIcon size={16} className="mr-3 text-white"/> Copy link</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare('twitter')} className="focus:bg-white/10 cursor-pointer font-bold py-2"><X size={16} className="mr-3 text-white"/> X</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={(e) => { e.stopPropagation(); onBookmark(); }} className="flex items-center gap-0 group">
                   <div className={`p-2 rounded-full transition-colors ${post.is_bookmarked ? 'text-primary-500' : 'group-hover:bg-primary-500/10 group-hover:text-primary-500'}`}>
                      <Bookmark size={18} className={post.is_bookmarked ? 'fill-current' : ''} />
                   </div>
                </button>
            </div>
         </div>
      </div>
   );
});

function CommentNode({ comment, onReply, isLast, level = 0 }: { comment: Comment, onReply: (id: string, name: string) => void, isLast?: boolean, level?: number }) {
    return (
        <div className="flex gap-3 group pt-3 relative">
            <div className="flex flex-col items-center">
                <Avatar className="w-10 h-10 shrink-0 z-10"><AvatarImage src={comment.user.avatar_url}/><AvatarFallback>?</AvatarFallback></Avatar>
                {(!isLast || (comment.replies && comment.replies.length > 0)) && <div className="w-[2px] flex-1 bg-white/10 mt-2 rounded-full" />}
            </div>
            
            <div className="flex-1 pb-2">
                <div className="flex items-center gap-1.5">
                   <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">{comment.user.username}</span>
                   <span className="text-zinc-500 text-[15px]">·</span>
                   <span className="text-zinc-500 text-[15px] hover:underline">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h')}</span>
                </div>
                <p className="text-[15px] text-white leading-tight mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                
                {/* Meta Threads style action bar */}
                <div className="flex items-center gap-4 mt-2 mb-2 text-zinc-500">
                    <button className="flex items-center gap-1.5 hover:bg-white/10 p-1.5 rounded-full transition-colors hover:text-pink-500 active:scale-95">
                        <Heart size={16} />
                    </button>
                    <button onClick={() => onReply(comment.id, comment.user.username)} className="flex items-center gap-1.5 hover:bg-white/10 p-1.5 rounded-full transition-colors hover:text-white active:scale-95">
                        <MessageCircle size={16} />
                    </button>
                    <button className="flex items-center gap-1.5 hover:bg-white/10 p-1.5 rounded-full transition-colors hover:text-white active:scale-95">
                        <Repeat2 size={16} />
                    </button>
                    <button className="flex items-center gap-1.5 hover:bg-white/10 p-1.5 rounded-full transition-colors hover:text-white active:scale-95">
                        <Send size={16} />
                    </button>
                </div>

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-1 space-y-0">
                        {comment.replies.map((reply, i) => <CommentNode key={reply.id} comment={reply} onReply={onReply} isLast={i === comment.replies!.length - 1} level={level + 1} />)}
                    </div>
                )}
            </div>
        </div>
    );
}