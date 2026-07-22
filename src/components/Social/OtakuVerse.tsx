"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, 
  Smile, Send, Bookmark, Flag, Trash2, X, Repeat2, Menu,
  ShieldCheck, Eye, Flame, Link as LinkIcon, Home, Hash, Users, Bell, User as UserIcon, Settings,
  Facebook, MessageSquare, SendHorizontal, MessageCircleMore, Loader2, ThumbsUp, Newspaper, Shield, ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import ProfileAvatar from '@/components/User/ProfileAvatar';
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
import ShadowComments from '@/components/Comments/ShadowComments';
import Link from 'next/link';
import Footer from '@/components/Anime/Footer';
import { useAuth } from '@/context/AuthContext';
import InstagramPostCard from './InstagramPostCard';
import InstagramPostComposer from './InstagramPostComposer';
import InstagramCommentsModal from './InstagramCommentsModal';

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
  initialNewsId?: string;
}

export default function OtakuVerse({ user, onAuthRequired, highlightId, initialNewsId }: OtakuVerseProps) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // Layout states
  const [isInClan, setIsInClan] = useState(false);

  useEffect(() => {
     const handleEnter = () => setIsInClan(true);
     const handleExit = () => setIsInClan(false);
     window.addEventListener('shadow-clan-enter', handleEnter);
     window.addEventListener('shadow-clan-exit', handleExit);
     return () => {
       window.removeEventListener('shadow-clan-enter', handleEnter);
       window.removeEventListener('shadow-clan-exit', handleExit);
     }
  }, []);

  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'news' | 'clans'>('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowScrollTop(scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  useEffect(() => {
    if (user && supabase) {
      const checkUnread = async () => {
        const { data, error } = await supabase.from('chat_participants').select('conversation_id, last_read_at').eq('user_id', user.id);
        if (data && !error) {
           const convIds = data.map((d: any) => d.conversation_id);
           if (convIds.length === 0) return;
           const { data: convData } = await supabase.from('chat_conversations').select('id, updated_at').in('id', convIds);
           let unread = false;
           if (convData) {
              data.forEach((p: any) => {
                 const c = convData.find((x: any) => x.id === p.conversation_id);
                 if (c && c.updated_at && (!p.last_read_at || new Date(c.updated_at) > new Date(p.last_read_at))) {
                    unread = true;
                 }
              });
           }
           setHasUnreadMessages(unread);
        }
      };
      checkUnread();
    }
  }, [user]);

  // Feature States
  const [activePostForComments, setActivePostForComments] = useState<SocialPost | null>(null);
  const [activeNewsItem, setActiveNewsItem] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  
  // News Comment States
  const [newsComments, setNewsComments] = useState<Comment[]>([]);
  const [newsCommentText, setNewsCommentText] = useState('');
  const [newsReplyTarget, setNewsReplyTarget] = useState<{ id: string; name: string } | null>(null);

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

  // --- HANDLE INITIAL NEWS ID ---
  useEffect(() => {
    if (initialNewsId && aniListNews.length > 0 && !activeNewsItem) {
      const thread = aniListNews.find(t => t.id.toString() === initialNewsId);
      if (thread) {
        setActiveNewsItem(thread);
        fetchNewsComments(thread.id);
      } else {
        // If it's an older news item not in the first 8, we might need to fetch it specifically.
        // For now, just fetch the specific thread if not found.
        fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            query: `query { Thread(id: ${initialNewsId}) { id title body createdAt user { name avatar { large } } } }`
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.data?.Thread) {
            setActiveNewsItem(data.data.Thread);
            fetchNewsComments(data.data.Thread.id);
          }
        })
        .catch(console.error);
      }
    }
  }, [initialNewsId, aniListNews]);

  // --- FETCH POSTS LOGIC ---
  const fetchPosts = useCallback(async (showLoading = false) => {
    if (!supabase) return;

    if (showLoading) setIsLoading(true);
    try {
      let query = supabase
        .from('social_posts')
        .select(`
          *,
          user:profiles(username, avatar_url, role, level, frame_id, show_level)
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

        const { data: latestComment } = await supabase.from('social_comments')
          .select('content, user:profiles(username)')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...post,
          likes_count: lCount,
          comments_count: cCount,
          is_liked_by_user: isLiked,
          is_bookmarked: isBookmarked,
          latest_comment: latestComment || null,
          user: post.user || { username: 'Otaku Explorer', avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${post.user_id}` }
        };
      }));

      setPosts(postsWithMetadata);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeTab]);

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
        .select(`*, user:profiles(username, avatar_url, role, level, frame_id, show_level)`)
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
        .select(`*, user:profiles(username, avatar_url, role, level, frame_id, show_level)`)
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

  // Fetch News Comments (using general comments table with episode_id)
  const fetchNewsComments = async (newsId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`*, user:profiles(username, avatar_url, role, level, frame_id, show_level)`)
        .eq('episode_id', `news_${newsId}`)
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

      setNewsComments(rootComments);
    } catch (err) {
      console.error('Fetch news comments error:', err);
    }
  };

  const handlePostNewsComment = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (!newsCommentText.trim() || !activeNewsItem) return;

    try {
      const { error } = await supabase.from('comments').insert({
        episode_id: `news_${activeNewsItem.id}`,
        user_id: user.id,
        parent_id: newsReplyTarget?.id || null,
        content: newsCommentText
      });

      if (error) throw error;

      setNewsCommentText('');
      setNewsReplyTarget(null);
      fetchNewsComments(activeNewsItem.id);
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
    <div className="w-full bg-[#050505] text-white flex justify-center selection:bg-primary-500 selection:text-white min-h-screen">
      <div className="max-w-7xl w-full flex justify-center lg:justify-between px-0 md:px-2">
        
        {/* LEFT SIDEBAR (Desktop) */}
        <header className="hidden sm:flex w-20 lg:w-64 xl:w-72 flex-col justify-between h-[calc(100vh-160px)] sticky top-4 pt-0 px-2 lg:px-4 overflow-y-auto custom-scrollbar">
           <div className="flex flex-col gap-1 w-full items-center lg:items-start">
              <div className="flex items-center justify-center lg:justify-start w-12 h-12 lg:w-auto lg:p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors mb-2 text-primary-500">
                 <Hash size={28} />
                 <span className="hidden lg:block font-black text-xl ml-3 tracking-widest uppercase">OtakuVerse</span>
              </div>
              
              <NavButton icon={<Home size={24} />} label="Home" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
              <NavButton icon={<Users size={24} />} label="Following" active={activeTab === 'following'} onClick={() => setActiveTab('following')} />
              <div className="lg:hidden"><NavButton icon={<Newspaper size={24} />} label="News" active={activeTab === 'news'} onClick={() => setActiveTab('news')} /></div>
              <NavButton icon={<MessageSquare size={24} />} label="Messages" onClick={() => window.location.href = '/messages'} badge={hasUnreadMessages} />
              <NavButton icon={<Users size={24} />} label="Watch Rooms" onClick={() => window.location.href = '/rooms'} />
              <NavButton icon={<UserIcon size={24} />} label="Profile" onClick={() => user ? (window.location.href='/profile') : onAuthRequired()} />

              <button 
                type="button"
                onClick={() => user ? document.getElementById('composer-input')?.focus() : onAuthRequired()} 
                className="mt-4 w-12 h-12 lg:w-[90%] lg:h-14 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-[0px] lg:text-base transition-all shadow-lg shadow-primary-900/30 mx-auto lg:mx-0 flex items-center justify-center cursor-pointer"
              >
                 <span className="hidden lg:inline uppercase tracking-wider">Post</span>
                 <SendHorizontal size={22} className="lg:hidden" />
              </button>
           </div>

           {user && (
              <div className="flex items-center justify-center lg:justify-between gap-3 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors mb-4 w-full border border-white/5">
                 <ProfileAvatar 
                     profile={profile} 
                     className="w-10 h-10" 
                 />
                 <div className="hidden lg:block overflow-hidden flex-1">
                    <p className="font-bold text-white text-sm truncate leading-tight">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-zinc-500 text-xs truncate leading-tight">@{user.user_metadata?.preferred_username || 'shadow'}</p>
                 </div>
              </div>
           )}
        </header>

        {/* MIDDLE COLUMN (Feed & Mobile Header) */}
        <main className={`flex-1 ${activeTab === 'clans' ? 'w-full' : 'max-w-[580px]'} w-full min-h-screen border-x border-white/10 pb-4`}>
           
           {/* Sticky Top Header */}
           <div className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
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

              {/* iOS Segmented Tab Switcher */}
              <div className="p-2">
                <div className="bg-[#121218]/90 border border-white/10 p-1 rounded-2xl flex relative shadow-inner">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider relative z-10 transition-colors ${
                      activeTab === 'feed' ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {activeTab === 'feed' && (
                      <motion.div
                        layoutId="ios-active-tab"
                        className="absolute inset-0 bg-primary-600 rounded-xl shadow-md -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    Feed
                  </button>

                  <button
                    onClick={() => setActiveTab('news')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider relative z-10 transition-colors lg:hidden ${
                      activeTab === 'news' ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {activeTab === 'news' && (
                      <motion.div
                        layoutId="ios-active-tab"
                        className="absolute inset-0 bg-primary-600 rounded-xl shadow-md -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    News
                  </button>

                  <button
                    onClick={() => setActiveTab('clans')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider relative z-10 transition-colors ${
                      activeTab === 'clans' ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {activeTab === 'clans' && (
                      <motion.div
                        layoutId="ios-active-tab"
                        className="absolute inset-0 bg-primary-600 rounded-xl shadow-md -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    Clans
                  </button>
                </div>
              </div>
           </div>

           {/* Inline Instagram Composer (Only in feed tab) */}
           {activeTab === 'feed' && (
             <div className="p-2 sm:p-4">
               <InstagramPostComposer
                 user={user}
                 profile={profile}
                 onAuthRequired={onAuthRequired}
                 onPostCreated={async ({ content, images, pollData }) => {
                   const { error } = await supabase
                     .from('social_posts')
                     .insert({
                       user_id: user!.id,
                       content,
                       images,
                       tags: []
                     });
                   if (error) throw error;
                   fetchPosts();
                 }}
               />
             </div>
           )}

           {/* View Switching */}
           {activeTab === 'clans' ? (
                <div className="p-4"><ClanSystem onClanOpen={setIsInClan} /></div>
            ) : activeTab === 'news' ? (
                <div className="p-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-4">
                    <Newspaper size={16} className="text-primary-500" /> Anime Industry & Community News
                  </h3>
                  {isAniNewsLoading ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">Loading anime news...</div>
                  ) : (
                    aniListNews.map(thread => (
                      <div key={thread.id} onClick={() => setActiveNewsItem(thread)} className="p-5 bg-[#0a0a0d] border border-white/10 rounded-3xl space-y-3 hover:border-primary-500/40 transition-all shadow-lg cursor-pointer">
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
                <div className="pb-[30vh] space-y-2 px-0 sm:px-3">
                   {filteredPosts.map((post) => (
                      <InstagramPostCard 
                         key={post.id} 
                         post={post} 
                         highlightId={highlightId}
                         onLike={() => handleLike(post)}
                         onComment={() => { setActivePostForComments(post); fetchComments(post.id); }}
                         onShare={(platform?: string) => {
                            if (typeof window !== 'undefined') {
                               navigator.clipboard.writeText(window.location.href);
                               toast.success("Post link copied");
                            }
                         }}
                         onBookmark={() => toast.success("Post saved")}
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

        {/* RIGHT SIDEBAR — News or Clan Sidebar */}
        {activeTab === 'clans' && isInClan ? (
          <aside id="clan-sidebar-portal" className="hidden lg:flex flex-col w-80 xl:w-[400px] h-[calc(100vh-5rem)] sticky top-20 shrink-0 border-l border-white/5">
             {/* Portal Target for Clan Management */}
          </aside>
        ) : (
          <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-[calc(100vh-5rem)] sticky top-20 pt-4 pb-20 px-4 overflow-y-auto custom-scrollbar shrink-0">
            <div className="pb-3 bg-[#050505] z-10">
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
                <div key={thread.id} onClick={() => { setActiveNewsItem(thread); fetchNewsComments(thread.id); }} className="p-4 bg-[#0a0a0d] border border-white/5 rounded-2xl space-y-2 hover:border-primary-500/30 transition-all cursor-pointer group">
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
        )}
      </div>

      {/* Mobile Left Drawer Navigation */}
      {typeof window !== 'undefined' && isMobileMenuOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[20000] flex bg-black/90 backdrop-blur-2xl">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setIsMobileMenuOpen(false)} />

            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-80 max-w-[85vw] bg-[#0c0c12] border-r border-white/15 h-full p-5 sm:p-6 flex flex-col justify-between shadow-2xl relative z-10 rounded-r-[2.5rem] overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary-600/20 border border-primary-500/30 rounded-xl text-primary-400">
                      <Hash size={20} />
                    </div>
                    <div>
                      <span className="font-black text-sm text-white uppercase tracking-widest block leading-tight">OtakuVerse</span>
                      <span className="text-[9px] text-zinc-500 font-mono">Social Realm Navigation</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Profile Card if Logged In */}
                {user ? (
                  <div className="bg-[#14141c] border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-md">
                    <ProfileAvatar profile={user.user_metadata || user} className="w-11 h-11" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate leading-tight">{user.user_metadata?.full_name || 'Agent'}</p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">@{user.user_metadata?.preferred_username || 'shadow'}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono font-bold text-primary-400 bg-primary-600/20 px-2 py-0.5 rounded-full border border-primary-500/30">
                        Lv. {user.user_metadata?.level || 1}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); onAuthRequired(); }}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    Sign In / Register
                  </button>
                )}

                {/* Overhauled Navigation List */}
                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => { setActiveTab('feed'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === 'feed'
                        ? 'bg-primary-600/20 text-white border border-primary-500/40 shadow-sm'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Home size={18} className={activeTab === 'feed' ? 'text-primary-400' : 'text-zinc-400'} />
                    <span>Otaku Feed</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('clans'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === 'clans'
                        ? 'bg-primary-600/20 text-white border border-primary-500/40 shadow-sm'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Shield size={18} className={activeTab === 'clans' ? 'text-primary-400' : 'text-zinc-400'} />
                    <span>Guild Clans</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('news'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === 'news'
                        ? 'bg-primary-600/20 text-white border border-primary-500/40 shadow-sm'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Newspaper size={18} className={activeTab === 'news' ? 'text-primary-400' : 'text-zinc-400'} />
                    <span>Industry News</span>
                  </button>

                  <Link
                    href="/messages"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <MessageSquare size={18} className="text-zinc-400" />
                      <span>Direct Messages</span>
                    </div>
                    {hasUnreadMessages && (
                      <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-ping" />
                    )}
                  </Link>

                  <Link
                    href="/rooms"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Users size={18} className="text-zinc-400" />
                    <span>Watch Rooms</span>
                  </Link>

                  <Link
                    href={user ? "/profile" : "#"}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (!user) onAuthRequired();
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <UserIcon size={18} className="text-zinc-400" />
                    <span>Profile & Frames</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-xs font-bold text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Settings size={18} className="text-zinc-400" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (user) document.getElementById('composer-input')?.focus();
                    else onAuthRequired();
                  }}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <SendHorizontal size={16} />
                  <span>Create Post</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Instagram-Style Comments Modal & Drawer */}
      <InstagramCommentsModal
        post={activePostForComments}
        comments={comments}
        onClose={() => setActivePostForComments(null)}
        onPostComment={async (text, parentId) => {
          if (!user) {
            onAuthRequired();
            return;
          }
          const { error } = await supabase.from('social_comments').insert({
            post_id: activePostForComments!.id,
            user_id: user.id,
            parent_id: parentId || null,
            content: text
          });
          if (error) throw error;
          fetchComments(activePostForComments!.id);
          fetchPosts();
          toast.success("Comment posted");
        }}
        user={user}
      />

      {/* News View Dialog Modal */}
      <Dialog open={!!activeNewsItem} onOpenChange={() => setActiveNewsItem(null)}>
        <DialogContent className="max-w-2xl bg-[#0d0d10] border border-white/10 text-white rounded-3xl p-0 shadow-2xl flex flex-col overflow-hidden [&>button]:right-6 [&>button]:top-6 [&>button]:text-zinc-400 hover:[&>button]:text-white" style={{ maxHeight: "calc(100dvh - var(--nav-height-top) - var(--nav-height-bottom) - 30px)" }}>
          {activeNewsItem && (
            <>
              <DialogHeader className="border-b border-white/10 p-6 pb-4 shrink-0 bg-[#0a0a0d] z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 pr-4 min-w-0 flex-1">
                    <img src={activeNewsItem.user?.avatar?.large} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0" />
                    <div className="min-w-0">
                      <DialogTitle className="text-sm font-bold text-white leading-tight line-clamp-2">{activeNewsItem.title}</DialogTitle>
                      <span className="text-[10px] text-zinc-500 block mt-1">By {activeNewsItem.user?.name} on {new Date(activeNewsItem.createdAt * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNewsItem(null)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-colors cursor-pointer shrink-0"
                    title="Close news thread"
                  >
                    <X size={16} />
                  </button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <div 
                  className="prose prose-invert prose-sm max-w-none prose-a:text-primary-400 prose-img:rounded-xl prose-img:border prose-img:border-white/10 leading-relaxed text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: activeNewsItem.body }} 
                />
                
                <div className="pt-6 border-t border-white/10 flex flex-col h-full flex-1 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary-500 flex items-center gap-2">
                      <MessageSquare size={14} /> Comments ({newsComments.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveNewsItem(null)}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md"
                    >
                      <X size={12} /> Close
                    </button>
                  </div>
                  
                  {/* News Comment Threads */}
                  <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-4">
                    {newsComments.length === 0 ? (
                      <div className="text-center py-10 text-zinc-500 text-xs">Be the first to comment!</div>
                    ) : (
                      newsComments.map(c => (
                        <FacebookCommentBubble
                          key={c.id}
                          comment={c}
                          onReply={(id, name) => setNewsReplyTarget({ id, name })}
                        />
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="pt-3 border-t border-white/10 space-y-2 shrink-0 bg-[#0d0d10] pb-2">
                    {newsReplyTarget && (
                      <div className="text-[10px] text-primary-400 flex items-center justify-between bg-primary-600/10 p-2 rounded-xl border border-primary-500/20">
                        <span>Replying to <strong>@{newsReplyTarget.name}</strong></span>
                        <button onClick={() => setNewsReplyTarget(null)} className="text-zinc-400 hover:text-white"><X size={12} /></button>
                      </div>
                    )}
                    <div className="flex gap-2.5">
                      <ProfileAvatar profile={user?.user_metadata || user} className="w-8 h-8" />
                      <input
                        type="text"
                        value={newsCommentText}
                        onChange={e => setNewsCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                      />
                      <button
                        onClick={handlePostNewsComment}
                        disabled={!newsCommentText.trim()}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded-full text-xs font-bold uppercase transition-all shrink-0"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>



      <ImageLightbox isOpen={lightbox.isOpen} src={lightbox.src} onClose={() => setLightbox({ isOpen: false, src: '' })} />

      {/* Floating Glowing Arrow To Top (Portal to body for max z-index, hides when any modal/lightbox is active) */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showScrollTop && !activeNewsItem && !activePostForComments && !lightbox.isOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-24 right-5 sm:bottom-20 sm:right-7 z-[999999] p-2 text-primary-400 hover:text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.9)] active:scale-90 transition-all cursor-pointer flex items-center justify-center pointer-events-auto filter"
              title="Scroll to top"
            >
              <ArrowUp size={28} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavButton({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, badge?: number | boolean }) {
   return (
      <div onClick={onClick} className="flex items-center justify-center lg:justify-start gap-3.5 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors w-12 h-12 lg:w-auto lg:h-auto mx-auto lg:mx-0 group relative">
         <div className={`${active ? 'text-primary-500' : 'text-zinc-400 group-hover:text-white'}`}>
            {icon}
            {!!badge && (
               <span className="absolute top-2 right-2 lg:top-auto lg:right-auto lg:-mt-2 lg:-mr-2 flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[#050505]"></span>
               </span>
            )}
         </div>
         <span className={`hidden lg:flex items-center gap-2 text-sm uppercase tracking-wider ${active ? 'font-black text-white' : 'font-bold text-zinc-400 group-hover:text-white'}`}>
            {label}
         </span>
      </div>
   );
}

const PostItem = React.forwardRef<HTMLDivElement, any>(({ post, highlightId, onLike, onComment, onShare, onBookmark, onDelete, onImageClick, currentUserId }, ref) => {
   return (
      <div ref={ref} className={`flex gap-3.5 p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer ${highlightId === post.id ? 'bg-white/10' : ''}`} onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('.image-grid')) {
             onComment();
          }
      }}>
         <div className="w-10 h-10 shrink-0">
             <ProfileAvatar profile={post.user} className="w-10 h-10 cursor-pointer" />
         </div>

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

// --- FACEBOOK-STYLE COMMENT BUBBLE COMPONENT ---
function FacebookCommentBubble({ comment, onReply, isReply = false }: { comment: Comment; onReply: (id: string, name: string) => void; isReply?: boolean }) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const flatChildReplies = useMemo(() => {
    if (isReply) return [];
    return flattenReplies(comment.replies || [], comment.user?.username || 'User');
  }, [comment.replies, comment.user?.username, isReply]);

  return (
    <div className="flex gap-2.5 items-start group">
      <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} shrink-0 relative mt-1`}>
        <ProfileAvatar profile={comment.user} className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} cursor-pointer mt-0.5`} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Gray Comment Bubble */}
        <div className="bg-[#18191c] border border-white/5 p-3 rounded-2xl rounded-tl-xs shadow-md inline-block max-w-full">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-white hover:underline cursor-pointer">
              {comment.user?.username || 'User'}
            </span>
            {comment.user?.role === 'admin' && <ShieldCheck size={12} className="text-primary-500" />}
          </div>
          <p className="text-xs text-zinc-200 mt-1 whitespace-pre-wrap leading-relaxed">
            {isReply && (comment as any).replyToUser && (
              <span className="text-primary-400 font-semibold mr-1.5 hover:underline cursor-pointer">
                @{(comment as any).replyToUser}
              </span>
            )}
            {comment.content}
          </p>
        </div>

        {/* Action Buttons Below Bubble */}
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

        {/* Single Flat Linear Column for ALL Descendant Replies */}
        {!isReply && flatChildReplies.length > 0 && (
          <div className="pl-6 sm:pl-8 border-l border-white/10 mt-2.5 space-y-3">
            {flatChildReplies.map((reply: any) => (
              <FacebookCommentBubble key={reply.id} comment={reply} onReply={onReply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
