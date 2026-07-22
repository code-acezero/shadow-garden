"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Grid, Heart, Bookmark, MoreHorizontal, Camera, Link as LinkIcon, MessageSquare, History, ArrowLeft, Send, Shield, AlertTriangle, MoreVertical, Flag, Ban, UserMinus, ShieldAlert
} from 'lucide-react';
import { toast } from '@/lib/toast';
import AuthModal from '@/components/Auth/AuthModal';
import Footer from '@/components/Anime/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import ProfileAvatar from '@/components/User/ProfileAvatar';
import Link from 'next/link';

export default function PublicProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const targetUserId = params.id as string;
    
    const { user, isLoading } = useAuth();
    
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    const [profile, setProfile] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isPartner, setIsPartner] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileOptions, setShowProfileOptions] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Stats State
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [posts, setPosts] = useState<any[]>([]);
    const [likedPosts, setLikedPosts] = useState<any[]>([]);
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);

    useEffect(() => {
        if (!targetUserId) return;
        if (user && user.id === targetUserId) {
            router.push('/profile');
            return;
        }

        const fetchProfileData = async () => {
            // Detect if param is a UUID or a username
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);

            let pData: any = null;
            if (isUUID) {
                const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
                pData = data;
            } else {
                // Lookup by username
                const { data } = await supabase.from('profiles').select('*').eq('username', targetUserId).single();
                pData = data;
            }

            if (!pData) return; // Profile not found
            setProfile(pData);

            // Redirect if this is own profile
            if (user && user.id === pData.id) {
                router.push('/profile');
                return;
            }

            const resolvedId = pData.id;
            
            // Fetch Followers Count
            const { count: f1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', resolvedId);
            // Fetch Following Count
            const { count: f2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', resolvedId);
            // Fetch Posts
            const { data: postsData } = await supabase.from('social_posts').select('*').eq('user_id', resolvedId).order('created_at', { ascending: false });
            
            // Fetch Liked Posts
            const { data: likesData } = await supabase.from('social_likes').select('post_id, social_posts(*)').eq('user_id', resolvedId);
            
            // Fetch Watch History
            const { data: historyData } = await supabase.from('user_continue_watching').select('*').eq('user_id', resolvedId).order('last_updated', { ascending: false });

            setFollowersCount(f1 || 0);
            setFollowingCount(f2 || 0);
            setPosts(postsData || []);
            if (likesData) setLikedPosts(likesData.map((l: any) => l.social_posts).filter(Boolean));
            if (historyData) setWatchHistory(historyData);

            // Check if current user is following
            if (user) {
                const { data: followStatus } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', resolvedId).single();
                setIsFollowing(!!followStatus);

                const { data: followBackStatus } = await supabase.from('follows').select('id').eq('follower_id', resolvedId).eq('following_id', user.id).single();
                setIsPartner(!!followStatus && !!followBackStatus);

                const { data: existingConvs } = await supabase.from('chat_participants').select('conversation_id, last_read_at').eq('user_id', user.id);
                if (existingConvs && existingConvs.length > 0) {
                    const convIds = existingConvs.map((c: any) => c.conversation_id);
                    const { data: mutuals } = await supabase.from('chat_participants').select('conversation_id').in('conversation_id', convIds).eq('user_id', resolvedId);
                    if (mutuals && mutuals.length > 0) {
                        const mutualConvId = mutuals[0].conversation_id;
                        const myParticipant = existingConvs.find((c:any) => c.conversation_id === mutualConvId);
                        if (myParticipant) {
                            const { count } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('conversation_id', mutualConvId).gt('created_at', myParticipant.last_read_at || '1970-01-01T00:00:00Z');
                            setUnreadCount(count || 0);
                        }
                    }
                }
            }
        };
        
        fetchProfileData();
    }, [targetUserId, user, router]);

    const handleFollowToggle = async () => {
        if (!user || !profile) { setShowAuthModal(true); return; }
        
        try {
            if (isFollowing) {
                await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
                setFollowersCount(prev => Math.max(0, prev - 1));
                setIsPartner(false);
            } else {
                await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
                setFollowersCount(prev => prev + 1);

                const { data: followBack } = await supabase.from('follows').select('id').eq('follower_id', profile.id).eq('following_id', user.id).single();
                if (followBack) {
                    setIsPartner(true);
                    toast.success(`You and ${profile.username} are now Partners!`);

                    const { data: existingConvs } = await supabase.from('chat_participants').select('conversation_id').eq('user_id', user.id);
                    const convIds = existingConvs?.map((c: any) => c.conversation_id) || [];
                    
                    let mutualConv = null;
                    if (convIds.length > 0) {
                        const { data: matches } = await supabase.from('chat_participants').select('conversation_id').in('conversation_id', convIds).eq('user_id', profile.id);
                        mutualConv = matches;
                    }

                    if (!mutualConv || mutualConv.length === 0) {
                        const { data: newConv } = await supabase.from('chat_conversations').insert({ type: 'direct' }).select().single();
                        if (newConv) {
                            await supabase.from('chat_participants').insert([
                                { conversation_id: newConv.id, user_id: user.id },
                                { conversation_id: newConv.id, user_id: profile.id }
                            ]);
                        }
                    }
                }
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            toast.error("Failed to update follow status.");
        }
    };
    
    const fetchFollowList = async (type: 'followers'|'following') => {
        const targetField = type === 'followers' ? 'following_id' : 'follower_id';
        const joinField = type === 'followers' ? 'follower_id' : 'following_id';
        
        const { data } = await supabase
            .from('follows')
            .select(`
                ${joinField},
                profiles!follows_${joinField}_fkey (
                    id, username, full_name, avatar_url, level, frame_id, show_level
                )
            `)
            .eq(targetField, targetUserId);
            
        if (data) {
            const list = data.map((d: any) => d.profiles);
            if (type === 'followers') { setFollowersList(list); setShowFollowersModal(true); }
            else { setFollowingList(list); setShowFollowingModal(true); }
        }
    };

    const handleMessageClick = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        
        try {
            // Check for existing direct conversation
            const { data: existingConvs } = await supabase
                .from('chat_participants')
                .select(`conversation_id, chat_conversations!inner(type)`)
                .eq('user_id', user.id)
                .eq('chat_conversations.type', 'direct');
            
            const convIds = existingConvs?.map((c: any) => c.conversation_id) || [];
            
            let mutualConv = null;
            if (convIds.length > 0) {
                const { data: matches } = await supabase.from('chat_participants').select('conversation_id').in('conversation_id', convIds).eq('user_id', profile.id);
                if (matches && matches.length > 0) {
                    mutualConv = matches[0];
                }
            }

            if (mutualConv) {
                router.push(`/messages?chatId=${mutualConv.conversation_id}`);
            } else {
                // Create new one
                const { data: newConv } = await supabase.from('chat_conversations').insert({ type: 'direct' }).select().single();
                if (newConv) {
                    await supabase.from('chat_participants').insert([
                        { conversation_id: newConv.id, user_id: user.id },
                        { conversation_id: newConv.id, user_id: profile.id }
                    ]);
                    router.push(`/messages?chatId=${newConv.id}`);
                }
            }
        } catch (error) {
            toast.error("Failed to start chat.");
        }
    };

    if (!hasMounted || isLoading || !profile) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[#000] text-white pt-24 pb-32">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                
                {/* INSTAGRAM HEADER */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                    {/* Avatar */}
                    <div className="shrink-0 relative">
                        <ProfileAvatar 
                            profile={profile} 
                            className="w-32 h-32 md:w-40 md:h-40 cursor-pointer"
                        />
                    </div>

                    {/* Info & Stats */}
                    <div className="flex-1 flex flex-col items-center md:items-start w-full">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-5 w-full">
                            <h1 className="text-2xl md:text-xl font-medium text-white">{profile.username}</h1>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleFollowToggle} 
                                    variant={isPartner ? "secondary" : isFollowing ? "secondary" : "default"} 
                                    className={
                                        isPartner ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 h-8 px-6 font-bold text-sm rounded-lg" : 
                                        isFollowing ? "bg-zinc-800 hover:bg-zinc-700 text-white h-8 px-6 font-bold text-sm rounded-lg" : 
                                        "bg-blue-500 hover:bg-blue-600 text-white h-8 px-6 font-bold text-sm rounded-lg"
                                    }
                                >
                                    {isPartner ? "Partner" : isFollowing ? "Following" : "Follow"}
                                </Button>
                                <div className="relative">
                                    <Button onClick={handleMessageClick} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white h-8 px-4 font-bold text-sm rounded-lg">Message</Button>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm shadow-primary-500/50">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-white hover:bg-zinc-800"><MoreHorizontal size={20}/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#14141a] border-white/10 text-white rounded-xl shadow-2xl py-1 z-[100]">
                                        {isFollowing && (
                                            <DropdownMenuItem onClick={handleFollowToggle} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 font-medium text-xs">
                                                <UserMinus size={14} className="mr-2" /> Unfollow
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => toast.success("User blocked")} className="cursor-pointer text-red-400 hover:text-red-500 focus:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 font-medium text-xs">
                                            <Ban size={14} className="mr-2" /> Block
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toast.success("User reported")} className="cursor-pointer text-red-400 hover:text-red-500 focus:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 font-medium text-xs">
                                            <Flag size={14} className="mr-2" /> Report
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex gap-8 mb-5 text-sm md:text-base hidden md:flex">
                            <div><span className="font-bold text-white">{posts.length}</span> posts</div>
                            <div onClick={()=>fetchFollowList('followers')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followersCount}</span> followers</div>
                            <div onClick={()=>fetchFollowList('following')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followingCount}</span> following</div>
                        </div>

                        <div className="flex flex-col items-center md:items-start text-sm">
                            {profile.full_name && profile.full_name.toLowerCase() !== profile.username.toLowerCase() && <span className="font-bold text-white">{profile.full_name}</span>}
                            <span className="text-zinc-300 whitespace-pre-wrap text-center md:text-left mt-1">{profile.bio}</span>
                            {profile.website && (
                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="text-[#E0F2FE] font-bold hover:underline flex items-center gap-1 mt-1">
                                    <LinkIcon size={14}/> {profile.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                        </div>

                        {/* Mobile Stats */}
                        <div className="flex justify-around w-full border-t border-zinc-800 py-3 mt-6 md:hidden text-sm">
                            <div className="flex flex-col items-center"><span className="font-bold text-white">{posts.length}</span> <span className="text-zinc-500">posts</span></div>
                            <div onClick={()=>fetchFollowList('followers')} className="flex flex-col items-center cursor-pointer"><span className="font-bold text-white">{followersCount}</span> <span className="text-zinc-500">followers</span></div>
                            <div onClick={()=>fetchFollowList('following')} className="flex flex-col items-center cursor-pointer"><span className="font-bold text-white">{followingCount}</span> <span className="text-zinc-500">following</span></div>
                        </div>
                    </div>
                </div>

                {/* TABS (POSTS, FAVORITES, WATCH HISTORY) */}
                <Tabs defaultValue="posts" className="w-full border-t border-zinc-800">
                    <TabsList className="bg-transparent w-full justify-center h-auto p-0 rounded-none flex">
                        <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px]">
                            <Grid size={14}/> Posts
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px]">
                            <Heart size={14}/> Favorites
                        </TabsTrigger>
                        <TabsTrigger value="watchlist" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px]">
                            <History size={14}/> Watch History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-4 outline-none">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <Camera size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">No Posts Yet</h2>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {posts.map(post => (
                                    <Link href={`/social/post/${post.id}`} key={post.id} className="relative aspect-square bg-zinc-900 group overflow-hidden cursor-pointer">
                                        {post.images && post.images.length > 0 ? (
                                            <img src={post.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-900 border border-white/5">
                                                <p className="text-xs md:text-sm text-white line-clamp-4 overflow-hidden break-words">{post.content}</p>
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 z-10">
                                            <div className="flex items-center gap-2 font-bold"><Heart className="fill-white text-white" size={20}/> {post.likes_count || 0}</div>
                                            <div className="flex items-center gap-2 font-bold"><MessageSquare className="fill-white text-white" size={20}/> {post.comments_count || 0}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* LIKED POSTS / FAVORITES */}
                    <TabsContent value="favorites" className="mt-4 outline-none">
                        {likedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <Heart size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">No Favorites Yet</h2>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {likedPosts.map(post => (
                                    <Link href={`/social/post/${post.id}`} key={post.id} className="relative aspect-square bg-zinc-900 group overflow-hidden cursor-pointer">
                                        {post.images && post.images.length > 0 ? (
                                            <img src={post.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-900 border border-white/5">
                                                <p className="text-xs md:text-sm text-white line-clamp-4 overflow-hidden break-words">{post.content}</p>
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 z-10">
                                            <div className="flex items-center gap-2 font-bold"><Heart className="fill-white text-white" size={20}/> {post.likes_count || 0}</div>
                                            <div className="flex items-center gap-2 font-bold"><MessageSquare className="fill-white text-white" size={20}/> {post.comments_count || 0}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* WATCH HISTORY */}
                    <TabsContent value="watchlist" className="mt-4 outline-none">
                        {watchHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <History size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Watch History Empty</h2>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {watchHistory.map((item, idx) => (
                                    <Link href={`/${item.type || 'watch'}/${item.anime_id}?ep=${item.episode_id}`} key={idx} className="relative aspect-square bg-zinc-900 group overflow-hidden cursor-pointer">
                                        <img src={item.episode_image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2 md:p-3 z-10">
                                            <span className="text-white text-xs md:text-sm font-bold line-clamp-1">{item.anime_title}</span>
                                            <span className="text-zinc-400 text-[10px] md:text-xs">Ep {item.episode_number}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* FOLLOWERS MODAL */}
            <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
                <DialogContent className="bg-[#262626] border-none text-white max-w-sm rounded-xl p-0 overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-700">
                        <DialogTitle className="text-center font-bold text-base">Followers</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {followersList.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500">No followers yet.</div>
                        ) : followersList.map(u => (
                            <a key={u.id} href={`/profile/${u.id}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10">
                                      <ProfileAvatar profile={u} className="w-10 h-10" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white">{u.username}</span>
                                        <span className="text-xs text-zinc-400">{u.full_name}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* FOLLOWING MODAL */}
            <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
                <DialogContent className="bg-[#262626] border-none text-white max-w-sm rounded-xl p-0 overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-700">
                        <DialogTitle className="text-center font-bold text-base">Following</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {followingList.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500">Not following anyone yet.</div>
                        ) : followingList.map(u => (
                            <a key={u.id} href={`/profile/${u.id}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10">
                                      <ProfileAvatar profile={u} className="w-10 h-10" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white">{u.username}</span>
                                        <span className="text-xs text-zinc-400">{u.full_name}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
            
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
            
            <Footer />
        </div>
    );
}
