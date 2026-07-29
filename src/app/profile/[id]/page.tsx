"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Grid, Heart, Bookmark, MoreHorizontal, Camera, Link as LinkIcon, MessageSquare, History, ArrowLeft, Send, Shield, AlertTriangle, MoreVertical, Flag, Ban, UserMinus, ShieldAlert, Edit3, Eye, Save, Sparkles, Upload, Crop, Image as ImageIcon, CheckCircle, RefreshCw, Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import AuthModal from '@/components/Auth/AuthModal';
import Footer from '@/components/Anime/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import ProfileAvatar from '@/components/User/ProfileAvatar';
import UserTitleBadge from '@/components/ui/UserTitleBadge';
import FantasyFrame from '@/components/User/FantasyFrame';
import AvatarSelectorModal from '@/components/User/AvatarSelectorModal';
import AvatarCropperModal from '@/components/User/AvatarCropperModal';
import Link from 'next/link';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const routeParams = useParams();
    const targetUserId = (routeParams?.id as string) || '';
    
    const { user, profile: currentUserProfile, isLoading } = useAuth();
    
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

    // Alpha Editing States (For Leader/Admin)
    const [isEditAlphaMode, setIsEditAlphaMode] = useState(false);
    const [alphaAvatar, setAlphaAvatar] = useState('');
    const [alphaBanner, setAlphaBanner] = useState('');
    const [alphaBio, setAlphaBio] = useState('');
    const [alphaTitle, setAlphaTitle] = useState('');
    const [alphaAdminTitle, setAlphaAdminTitle] = useState('');
    const [alphaFrame, setAlphaFrame] = useState('none');
    const [alphaGender, setAlphaGender] = useState('female');
    const [alphaWebsite, setAlphaWebsite] = useState('');
    const [alphaShowLevel, setAlphaShowLevel] = useState(true);

    // Alpha Image Picker & Cropper Modal States
    const [showAlphaAvatarModal, setShowAlphaAvatarModal] = useState(false);
    const [showAlphaCropperModal, setShowAlphaCropperModal] = useState(false);
    const [alphaCropperSrc, setAlphaCropperSrc] = useState<string | null>(null);
    const [alphaCropperTarget, setAlphaCropperTarget] = useState<'avatar' | 'banner'>('avatar');

    const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
    const bannerFileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                setAlphaCropperSrc(ev.target?.result as string);
                setAlphaCropperTarget('avatar');
                setShowAlphaCropperModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                setAlphaCropperSrc(ev.target?.result as string);
                setAlphaCropperTarget('banner');
                setShowAlphaCropperModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

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
            setAlphaAvatar(pData.avatar_url || '/images/alpha/alpha-av.png');
            setAlphaBanner(pData.banner_url || '');
            setAlphaBio(pData.bio || '');
            setAlphaTitle(pData.title || '');
            setAlphaAdminTitle(pData.admin_title || '');
            setAlphaFrame(pData.frame_id || 'none');
            setAlphaGender(pData.gender || 'female');
            setAlphaWebsite(pData.website || '');
            setAlphaShowLevel(pData.show_level !== false);

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
        <div className="min-h-screen bg-[#000] text-white pb-8">
            {/* PUBLIC PROFILE COVER BANNER */}
            <div className="relative w-full mb-2">
                <div className="w-full h-48 sm:h-64 md:h-80 rounded-b-3xl relative overflow-hidden bg-zinc-900 shadow-2xl border-b border-white/10">
                    <img 
                        src={profile.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"} 
                        alt={`${profile.username}'s Cover`} 
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `center ${profile.banner_pos !== undefined && profile.banner_pos !== null ? profile.banner_pos : 50}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </div>
            </div>

            <div className="px-4 sm:px-8 w-full -mt-14 sm:-mt-20 md:-mt-24 relative z-20">
                
                {/* PROFILE HEADER */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                    {/* Avatar */}
                    <div className="shrink-0 relative">
                        <ProfileAvatar 
                            profile={profile} 
                            className="w-32 h-32 md:w-40 md:h-40 cursor-pointer"
                        />
                    </div>

                    {/* Info & Stats */}
                    <div className="flex-1 flex flex-col items-center md:items-start w-full pt-4 md:pt-14">
                        {/* Username & Title */}
                        <div className="flex items-baseline gap-2 flex-wrap justify-center md:justify-start mb-4">
                            <h1 className="text-2xl md:text-xl font-medium text-white">{profile.username}</h1>
                            <UserTitleBadge user={profile} variant="bracket" />
                        </div>

                        {/* Stats on Left & Action Buttons on Right (Same Row) */}
                        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-5">
                            <div className="flex gap-8 text-sm md:text-base hidden md:flex">
                                <div><span className="font-bold text-white">{posts.length}</span> posts</div>
                                <div onClick={()=>fetchFollowList('followers')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followersCount}</span> followers</div>
                                <div onClick={()=>fetchFollowList('following')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followingCount}</span> following</div>
                            </div>

                            <div className="flex gap-2 md:ml-auto">
                                {(profile.settings?.allowRequests !== false || isFollowing) && (
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
                                )}
                                <div className="relative">
                                    <Button onClick={handleMessageClick} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white h-8 px-4 font-bold text-sm rounded-lg">Message</Button>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm shadow-primary-500/50">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </div>

                                {/* LEADER / ADMIN EDIT ALPHA PROFILE ACCESS */}
                                {(currentUserProfile?.role === 'leader' || currentUserProfile?.role === 'admin' || currentUserProfile?.username === 'Shadow' || (user as any)?.user_metadata?.username === 'Shadow') && (profile?.username === 'Alpha' || profile?.role === 'ai_leader') && (
                                    <Button 
                                        onClick={() => setIsEditAlphaMode(!isEditAlphaMode)} 
                                        className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/50 h-8 px-3 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95 cursor-pointer ml-1"
                                    >
                                        {isEditAlphaMode ? <Eye size={13} /> : <Edit3 size={13} />}
                                        {isEditAlphaMode ? "Switch to Public View" : "Edit Profile"}
                                    </Button>
                                )}
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

                        {/* ALPHA NATIVE EDITING DASHBOARD FOR LEADER/ADMIN (FULL USER-LEVEL EDITING SUITE) */}
                        {isEditAlphaMode && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full bg-[#0c0c14]/95 border border-purple-500/30 p-4 sm:p-6 rounded-3xl backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] mb-8"
                            >
                                <input 
                                    type="file" 
                                    ref={avatarFileInputRef} 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarFileChange} 
                                />
                                <input 
                                    type="file" 
                                    ref={bannerFileInputRef} 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleBannerFileChange} 
                                />

                                <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="text-purple-400" size={20} />
                                        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">EDIT ALPHA PROFILE (LEADER ACCESS)</h3>
                                    </div>
                                    <Button 
                                        onClick={() => setIsEditAlphaMode(false)} 
                                        variant="outline" 
                                        className="bg-transparent border-white/20 hover:bg-white/10 text-xs font-bold gap-1.5 h-8 px-3"
                                    >
                                        <Eye size={13} /> Switch to Public View
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* 1. AVATAR SELECTION & CROPPER CARD */}
                                    <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                                <Camera size={14} /> Profile Avatar & Frame
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                                                <FantasyFrame frameId={alphaFrame} size={96} transparentBg={true}>
                                                    <img 
                                                        src={alphaAvatar || '/images/alpha/alpha-av.png'} 
                                                        alt="Alpha Avatar" 
                                                        className="w-full h-full object-cover rounded-full"
                                                        onError={(e) => { (e.currentTarget.src = '/images/alpha/alpha-av.png'); }}
                                                    />
                                                </FantasyFrame>
                                            </div>

                                            <div className="flex flex-col gap-2 flex-1 min-w-0">
                                                <Button 
                                                    type="button"
                                                    onClick={() => setShowAlphaAvatarModal(true)}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30"
                                                >
                                                    <Sparkles size={13} /> Browse Anime Avatars
                                                </Button>

                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        type="button"
                                                        onClick={() => avatarFileInputRef.current?.click()}
                                                        variant="outline"
                                                        className="flex-1 bg-white/5 hover:bg-white/10 border-white/15 text-white text-[11px] font-bold h-8 px-2 rounded-lg flex items-center justify-center gap-1"
                                                    >
                                                        <Upload size={12} /> Upload File
                                                    </Button>

                                                    <Button 
                                                        type="button"
                                                        onClick={() => {
                                                            setAlphaCropperSrc(alphaAvatar || '/images/alpha/alpha-av.png');
                                                            setAlphaCropperTarget('avatar');
                                                            setShowAlphaCropperModal(true);
                                                        }}
                                                        variant="outline"
                                                        className="flex-1 bg-white/5 hover:bg-white/10 border-white/15 text-white text-[11px] font-bold h-8 px-2 rounded-lg flex items-center justify-center gap-1"
                                                    >
                                                        <Crop size={12} /> Crop Image
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Or Direct Avatar Image URL</label>
                                            <Input 
                                                value={alphaAvatar} 
                                                onChange={(e) => setAlphaAvatar(e.target.value)} 
                                                placeholder="https://..." 
                                                className="bg-black/50 border-zinc-800 text-white text-xs h-9 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    {/* 2. COVER BANNER SELECTION & CROPPER CARD */}
                                    <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                                <ImageIcon size={14} /> Cover Banner Background
                                            </span>
                                        </div>

                                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-zinc-950 flex items-center justify-center group">
                                            {alphaBanner ? (
                                                <img src={alphaBanner} alt="Alpha Banner" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-xs text-zinc-500 font-mono">No cover banner set</div>
                                            )}

                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button 
                                                    type="button"
                                                    onClick={() => bannerFileInputRef.current?.click()}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold h-8 px-3 rounded-lg flex items-center gap-1"
                                                >
                                                    <Upload size={12} /> Upload Banner
                                                </Button>

                                                {alphaBanner && (
                                                    <Button 
                                                        type="button"
                                                        onClick={() => {
                                                            setAlphaCropperSrc(alphaBanner);
                                                            setAlphaCropperTarget('banner');
                                                            setShowAlphaCropperModal(true);
                                                        }}
                                                        variant="outline"
                                                        className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-bold h-8 px-3 rounded-lg flex items-center gap-1"
                                                    >
                                                        <Crop size={12} /> Crop Banner
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Or Direct Cover Banner URL</label>
                                            <Input 
                                                value={alphaBanner} 
                                                onChange={(e) => setAlphaBanner(e.target.value)} 
                                                placeholder="https://..." 
                                                className="bg-black/50 border-zinc-800 text-white text-xs h-9 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. FANTASY FRAME VISUAL TIER SELECTOR */}
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                            <Layers size={14} /> Fantasy Frame Badge Tier
                                        </span>
                                        <span className="text-xs text-purple-400 font-bold uppercase">Active: {alphaFrame}</span>
                                    </div>

                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-13 gap-2 overflow-x-auto p-1 custom-scrollbar">
                                        {['none', 'iron', 'bronze', 'silver', 'crimson', 'sapphire', 'emerald', 'golden', 'shadow', 'celestial', 'divine', 'admin', 'moderator'].map(f => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setAlphaFrame(f)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer",
                                                    alphaFrame === f 
                                                        ? "bg-purple-900/50 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105" 
                                                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="w-10 h-10 flex items-center justify-center mb-1">
                                                    <FantasyFrame frameId={f} size={40} transparentBg={true}>
                                                        <img src={alphaAvatar || '/images/alpha/alpha-av.png'} alt="preview" className="w-full h-full object-cover rounded-full" />
                                                    </FantasyFrame>
                                                </div>
                                                <span className="text-[9px] font-bold uppercase truncate w-full text-center text-zinc-300">{f}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. TITLES, LEVEL, GENDER & LORE LINK METADATA */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Admin Title</label>
                                        <Input 
                                            value={alphaAdminTitle} 
                                            onChange={(e) => setAlphaAdminTitle(e.target.value)} 
                                            placeholder="First Shadow / AI Leader" 
                                            className="bg-black/50 border-zinc-800 text-white text-xs h-10 rounded-xl"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">User Title</label>
                                        <Input 
                                            value={alphaTitle} 
                                            onChange={(e) => setAlphaTitle(e.target.value)} 
                                            placeholder="First Member of Shadow Garden" 
                                            className="bg-black/50 border-zinc-800 text-white text-xs h-10 rounded-xl"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Gender Identity</label>
                                        <select 
                                            value={alphaGender} 
                                            onChange={(e) => setAlphaGender(e.target.value)}
                                            className="w-full bg-black/50 border border-zinc-800 text-white text-xs h-10 rounded-xl px-3 focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="female" className="bg-zinc-900">Female</option>
                                            <option value="male" className="bg-zinc-900">Male</option>
                                            <option value="other" className="bg-zinc-900">Other</option>
                                            <option value="hidden" className="bg-zinc-900">Hidden</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Website / Lore Link</label>
                                        <Input 
                                            value={alphaWebsite} 
                                            onChange={(e) => setAlphaWebsite(e.target.value)} 
                                            placeholder="https://shadow-garden.site" 
                                            className="bg-black/50 border-zinc-800 text-white text-xs h-10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* 5. BIO / SYSTEM DIRECTIVE */}
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Bio / System Directive</label>
                                    <Textarea 
                                        value={alphaBio} 
                                        onChange={(e) => setAlphaBio(e.target.value)} 
                                        placeholder="First Member and Commander of Shadow Garden. Devoted to Lord Shadow..." 
                                        className="bg-black/50 border-zinc-800 text-white text-xs rounded-xl h-24 resize-none leading-relaxed"
                                    />
                                </div>

                                {/* 6. SAVE & ACTION BUTTONS */}
                                <div className="flex justify-end gap-3 border-t border-purple-500/20 pt-4">
                                    <Button 
                                        onClick={() => setIsEditAlphaMode(false)} 
                                        variant="ghost" 
                                        className="text-zinc-400 hover:text-white hover:bg-white/10 text-xs font-bold h-9 px-4"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from('profiles')
                                                .update({
                                                    avatar_url: alphaAvatar,
                                                    banner_url: alphaBanner,
                                                    bio: alphaBio,
                                                    title: alphaTitle,
                                                    admin_title: alphaAdminTitle,
                                                    frame_id: alphaFrame,
                                                    gender: alphaGender,
                                                    website: alphaWebsite,
                                                    show_level: alphaShowLevel,
                                                    updated_at: new Date().toISOString()
                                                })
                                                .eq('id', profile.id);

                                            if (error) {
                                                toast.error("Failed to update Alpha's profile");
                                            } else {
                                                toast.success("Alpha's profile updated successfully!");
                                                setProfile((prev: any) => ({
                                                    ...prev,
                                                    avatar_url: alphaAvatar,
                                                    banner_url: alphaBanner,
                                                    bio: alphaBio,
                                                    title: alphaTitle,
                                                    admin_title: alphaAdminTitle,
                                                    frame_id: alphaFrame,
                                                    gender: alphaGender,
                                                    website: alphaWebsite,
                                                    show_level: alphaShowLevel
                                                }));
                                                setIsEditAlphaMode(false);
                                            }
                                        }} 
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                                    >
                                        <Save size={14} /> Save Alpha Profile
                                    </Button>
                                </div>
                            </motion.div>
                        )}

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
                    <TabsList className="bg-transparent w-full justify-center h-auto p-0 rounded-none flex items-center gap-2 sm:gap-6 overflow-x-auto custom-scrollbar">
                        <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-6 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Grid size={14}/> Posts
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-6 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Heart size={14}/> Favorites
                        </TabsTrigger>
                        <TabsTrigger value="watchlist" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-6 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <History size={14}/> History
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
                        {profile.settings?.publicActivity === false ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <ShieldAlert size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">History is Private</h2>
                            </div>
                        ) : watchHistory.length === 0 ? (
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
                            <a key={u.id} href={`/profile/${u.username}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
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
                            <a key={u.id} href={`/profile/${u.username}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
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
            
            {/* ALPHA AVATAR SELECTOR MODAL */}
            <AvatarSelectorModal
                isOpen={showAlphaAvatarModal}
                onClose={() => setShowAlphaAvatarModal(false)}
                onSelect={(url) => {
                    setAlphaAvatar(url);
                    setShowAlphaAvatarModal(false);
                }}
                currentUrl={alphaAvatar}
            />

            {/* ALPHA AVATAR & BANNER CROPPER MODAL */}
            <AvatarCropperModal
                isOpen={showAlphaCropperModal}
                imageSrc={alphaCropperSrc}
                activeFrameId={alphaCropperTarget === 'avatar' ? alphaFrame : 'none'}
                onClose={() => setShowAlphaCropperModal(false)}
                onCropComplete={(croppedUrl) => {
                    if (alphaCropperTarget === 'avatar') {
                        setAlphaAvatar(croppedUrl);
                    } else {
                        setAlphaBanner(croppedUrl);
                    }
                    setShowAlphaCropperModal(false);
                }}
            />

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
            
            <Footer />
        </div>
    );
}
