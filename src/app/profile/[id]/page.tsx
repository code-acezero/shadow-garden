"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Grid, Heart, Bookmark, MoreHorizontal, Camera, Link as LinkIcon, MessageSquare, 
    History, ArrowLeft, Send, Shield, AlertTriangle, MoreVertical, Flag, Ban, 
    UserMinus, ShieldAlert, Edit3, Eye, Save, Crown, Upload, Crop, 
    Image as ImageIcon, CheckCircle, RefreshCw, Layers, Search, Check, Users, 
    UserCheck, Share2, Compass, MessageCircle, LogOut, ChevronDown, Award, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { playGummyTap, playGummyPop, playSquishyJelly } from '@/lib/audioManager';
import AuthModal from '@/components/Auth/AuthModal';
import Footer from '@/components/Anime/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import UserTitleBadge from '@/components/ui/UserTitleBadge';
import FantasyFrame from '@/components/User/FantasyFrame';
import AvatarSelectorModal from '@/components/User/AvatarSelectorModal';
import AvatarCropperModal from '@/components/User/AvatarCropperModal';
import Link from 'next/link';
import { parseSocialLinks, formatSocialHref, formatSocialLabel, renderSocialIcon, SocialLink } from '@/lib/socialLinks';
import { getEquippedTitle } from '@/lib/userTitles';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

const ProfilePostGridItem = React.memo(function ProfilePostGridItem({ post }: { post: any }) {
    const rawImage = post.images && post.images.length > 0 ? post.images[0] : null;
    const [imgFailed, setImgFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [imgSrc, setImgSrc] = useState<string | null>(rawImage ? getOptimizedImageUrl(rawImage) : null);

    useEffect(() => {
        setImgSrc(rawImage ? getOptimizedImageUrl(rawImage) : null);
        setAttempt(0);
        setImgFailed(false);
    }, [rawImage]);
    
    const hasImage = !!imgSrc && !imgFailed;

    const handleImgError = () => {
        if (!rawImage) {
            setImgFailed(true);
            return;
        }
        if (attempt === 0) {
            setAttempt(1);
            setImgSrc(`https://images.weserv.nl/?url=${encodeURIComponent(rawImage)}`);
        } else if (attempt === 1) {
            setAttempt(2);
            setImgSrc(rawImage);
        } else {
            setImgFailed(true);
        }
    };

    const likes = post.social_likes?.[0]?.count ?? post.likes_count ?? 0;
    const comments = post.social_comments?.[0]?.count ?? post.comments_count ?? 0;

    return (
        <Link 
            href={`/social/post/${post.id}`} 
            key={post.id} 
            className="relative aspect-square bg-[#0e0e12] group overflow-hidden cursor-pointer rounded-lg border border-white/5 hover:border-white/20 transition-all select-none"
        >
            {hasImage ? (
                <img 
                    src={imgSrc!} 
                    alt="Post image"
                    referrerPolicy="no-referrer"
                    onError={handleImgError}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-[#131318] to-[#0a0a0d] text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.03),_transparent_70%)] pointer-events-none" />
                    {post.content ? (
                        <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-4 overflow-hidden break-words relative z-10 leading-relaxed px-1">
                            {post.content}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-zinc-500 relative z-10">
                            <ImageIcon size={22} className="opacity-40" />
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Post Media</span>
                        </div>
                    )}
                </div>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 sm:gap-6 z-10 backdrop-blur-[2px]">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
                    <Heart className="fill-rose-500 text-rose-500" size={15} /> 
                    <span>{likes}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
                    <MessageSquare className="fill-white text-white" size={15} /> 
                    <span>{comments}</span>
                </div>
            </div>
        </Link>
    );
});

export default function PublicProfilePage() {
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
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Stats State
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [posts, setPosts] = useState<any[]>([]);
    const [likedPosts, setLikedPosts] = useState<any[]>([]);
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    
    // Followers / Following Modals & Search
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [followerSearchQuery, setFollowerSearchQuery] = useState('');
    const [followingSearchQuery, setFollowingSearchQuery] = useState('');
    const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());

    // Mutual Friends ("Followed by ace_zero and 3 others")
    const [mutualSummary, setMutualSummary] = useState<{ count: number; samples: any[] }>({ count: 0, samples: [] });

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

    const avatarFileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

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
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);

            let pData: any = null;
            if (isUUID) {
                const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
                pData = data;
            } else {
                const { data } = await supabase.from('profiles').select('*').eq('username', targetUserId).single();
                pData = data;
            }

            if (!pData) return;
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

            if (user && user.id === pData.id) {
                router.push('/profile');
                return;
            }

            const resolvedId = pData.id;
            
            // Fetch Followers Count
            const { count: f1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', resolvedId);
            // Fetch Following Count
            const { count: f2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', resolvedId);
            // Fetch Posts with counts
            const { data: postsData } = await supabase
                .from('social_posts')
                .select('*, social_likes(count), social_comments(count)')
                .eq('user_id', resolvedId)
                .order('created_at', { ascending: false });
            // Fetch Liked Posts with counts
            const { data: likesData } = await supabase
                .from('social_likes')
                .select('post_id, social_posts(*, social_likes(count), social_comments(count))')
                .eq('user_id', resolvedId);
            // Fetch Watch History
            const { data: historyData } = await supabase.from('user_continue_watching').select('*').eq('user_id', resolvedId).order('last_updated', { ascending: false });

            setFollowersCount(f1 || 0);
            setFollowingCount(f2 || 0);
            setPosts(postsData || []);
            if (likesData) setLikedPosts(likesData.map((l: any) => l.social_posts).filter(Boolean));
            if (historyData) setWatchHistory(historyData);

            // Check if current user is following and if mutual partner
            if (user) {
                const { data: followStatus } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', resolvedId).single();
                setIsFollowing(!!followStatus);

                const { data: followBackStatus } = await supabase.from('follows').select('id').eq('follower_id', resolvedId).eq('following_id', user.id).single();
                setIsPartner(!!followStatus && !!followBackStatus);

                // Fetch current user's follow list for instant mutual tag calculations
                const { data: myFollows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
                const myIds = new Set<string>((myFollows || []).map((f: any) => String(f.following_id)));
                setMyFollowingIds(myIds);

                // Fetch Mutual Friends Summary: people I follow who also follow this profile
                if (myIds.size > 0) {
                    const myIdArr = Array.from(myIds);
                    const { data: mutualFollowers } = await supabase
                        .from('follows')
                        .select(`
                            follower_id,
                            profiles!follows_follower_id_fkey (id, username, avatar_url, frame_id)
                        `)
                        .eq('following_id', resolvedId)
                        .in('follower_id', myIdArr);

                    if (mutualFollowers && mutualFollowers.length > 0) {
                        const samples = mutualFollowers.slice(0, 2).map((m: any) => m.profiles).filter(Boolean);
                        setMutualSummary({
                            count: mutualFollowers.length,
                            samples,
                        });
                    }
                }

                // Unread messages count
                const { data: existingConvs } = await supabase.from('chat_participants').select('conversation_id, last_read_at').eq('user_id', user.id);
                if (existingConvs && existingConvs.length > 0) {
                    const convIds = existingConvs.map((c: any) => c.conversation_id);
                    const { data: mutuals } = await supabase.from('chat_participants').select('conversation_id').in('conversation_id', convIds).eq('user_id', resolvedId);
                    if (mutuals && mutuals.length > 0) {
                        const mutualConvId = mutuals[0].conversation_id;
                        const myParticipant = existingConvs.find((c: any) => c.conversation_id === mutualConvId);
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
        playGummyPop();
        
        try {
            if (isFollowing) {
                await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
                setFollowersCount(prev => Math.max(0, prev - 1));
                setIsFollowing(false);
                setIsPartner(false);
                setMyFollowingIds(prev => {
                    const next = new Set(prev);
                    next.delete(profile.id);
                    return next;
                });
                toast.info(`Unfollowed ${profile.username}`);
            } else {
                await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
                setFollowersCount(prev => prev + 1);
                setIsFollowing(true);
                setMyFollowingIds(prev => new Set(prev).add(profile.id));

                const { data: followBack } = await supabase.from('follows').select('id').eq('follower_id', profile.id).eq('following_id', user.id).single();
                if (followBack) {
                    setIsPartner(true);
                    toast.success(`🤝 You and ${profile.username} are now Friends!`);

                    // Ensure direct conversation exists
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
                } else {
                    toast.success(`Following ${profile.username}`);
                }
            }
        } catch (error) {
            toast.error("Failed to update follow status.");
        }
    };
    
    const fetchFollowList = async (type: 'followers' | 'following') => {
        if (!profile?.id) return;
        const targetField = type === 'followers' ? 'following_id' : 'follower_id';
        const joinField = type === 'followers' ? 'follower_id' : 'following_id';
        
        const { data } = await supabase
            .from('follows')
            .select(`
                ${joinField},
                profiles!follows_${joinField}_fkey (
                    id, username, full_name, avatar_url, level, frame_id, show_level,
                    equipped_title, title, admin_title, custom_title, role, show_title
                )
            `)
            .eq(targetField, profile.id);
            
        if (data) {
            const list = data.map((d: any) => d.profiles).filter(Boolean);
            if (type === 'followers') { 
                setFollowersList(list); 
                setFollowerSearchQuery('');
                setShowFollowersModal(true); 
            } else { 
                setFollowingList(list); 
                setFollowingSearchQuery('');
                setShowFollowingModal(true); 
            }
        }
    };

    const toggleFollowInModal = async (targetUser: any) => {
        if (!user) { setShowAuthModal(true); return; }
        playGummyTap();
        const targetId = targetUser.id;
        const currentlyFollowing = myFollowingIds.has(targetId);

        try {
            if (currentlyFollowing) {
                await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
                setMyFollowingIds(prev => {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                });
                if (targetId === profile.id) {
                    setIsFollowing(false);
                    setIsPartner(false);
                    setFollowersCount(c => Math.max(0, c - 1));
                }
                toast.info(`Unfollowed ${targetUser.username}`);
            } else {
                await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
                setMyFollowingIds(prev => new Set(prev).add(targetId));
                if (targetId === profile.id) {
                    setIsFollowing(true);
                    setFollowersCount(c => c + 1);
                }
                toast.success(`Following ${targetUser.username}`);
            }
        } catch {
            toast.error("Action failed");
        }
    };

    const handleMessageClick = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        playSquishyJelly();
        
        try {
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

    const handleShareProfile = () => {
        playGummyTap();
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Profile link copied to clipboard!");
        }
    };

    const socialLinks = useMemo<SocialLink[]>(() => {
        if (!profile) return [];
        if (profile.social_links) return parseSocialLinks(profile.social_links);
        if (profile.website) return parseSocialLinks(profile.website);
        return [];
    }, [profile]);

    const filteredFollowers = useMemo(() => {
        if (!followerSearchQuery.trim()) return followersList;
        const q = followerSearchQuery.toLowerCase();
        return followersList.filter(u => 
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.full_name && u.full_name.toLowerCase().includes(q))
        );
    }, [followersList, followerSearchQuery]);

    const filteredFollowing = useMemo(() => {
        if (!followingSearchQuery.trim()) return followingList;
        const q = followingSearchQuery.toLowerCase();
        return followingList.filter(u => 
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.full_name && u.full_name.toLowerCase().includes(q))
        );
    }, [followingList, followingSearchQuery]);

    if (!hasMounted || isLoading || !profile) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentLevel = profile?.level || 1;
    const isAlphaUser = profile?.username?.toLowerCase() === 'alpha' || profile?.role === 'ai_leader';

    return (
        <div className="min-h-screen bg-[#000] text-white pb-16">
            {/* ── 1. PUBLIC PROFILE COVER BANNER ── */}
            <div className="relative w-full mb-2">
                <div className="w-full h-44 sm:h-60 md:h-72 rounded-b-3xl relative overflow-hidden bg-zinc-900 shadow-2xl border-b border-white/10">
                    <img 
                        src={profile.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"} 
                        alt={`${profile.username}'s Cover`} 
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `center ${profile.banner_pos !== undefined && profile.banner_pos !== null ? profile.banner_pos : 50}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                </div>
            </div>

            {/* ── 2. INSTAGRAM-GRADE PROFILE CONTAINER (Strict Page Width: w-full px-2 sm:px-4 md:px-6) ── */}
            <div className="w-full px-2 sm:px-4 md:px-6 -mt-12 sm:-mt-16 md:-mt-20 relative z-20">
                
                {/* ── DESKTOP INSTAGRAM HEADER (Parallel Aligned) ── */}
                <div className="hidden md:flex items-start gap-8 lg:gap-12 mb-8 pb-4">
                    {/* Avatar on Left with Active Fantasy Frame */}
                    <div className="shrink-0 relative group">
                        <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full flex items-center justify-center cursor-pointer">
                            <ProfileAvatar 
                                profile={profile} 
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    {/* Details Column on Right (Parallel aligned with avatar top) */}
                    <div className="flex-1 flex flex-col gap-3.5 min-w-0 pt-0">
                        {/* Line 1: Username + Title Badge + Flat Action Buttons */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl lg:text-2xl font-normal text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                {profile.username}
                            </h1>
                            <UserTitleBadge user={profile} variant="bracket" />

                            {/* Flat Instagram Action Buttons */}
                            <div className="flex items-center gap-2 ml-2">
                                {(profile.settings?.allowRequests !== false || isFollowing) && (
                                    <motion.button 
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                        onClick={handleFollowToggle} 
                                        className={cn(
                                            "h-8 px-5 font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95",
                                            isPartner
                                                ? "bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-bold"
                                                : isFollowing
                                                ? "bg-[#363636] hover:bg-[#262626] text-white"
                                                : "bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold"
                                        )}
                                    >
                                        {isPartner ? (
                                            <>
                                                <span>🤝</span> Friends
                                            </>
                                        ) : isFollowing ? (
                                            "Following"
                                        ) : (
                                            "Follow"
                                        )}
                                    </motion.button>
                                )}

                                <motion.button 
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                    onClick={handleMessageClick} 
                                    className="h-8 px-4 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <MessageSquare size={13} />
                                    <span>Message</span>
                                    {unreadCount > 0 && (
                                        <span className="bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </motion.button>

                                {/* Leader / Admin Edit Alpha Profile Access */}
                                {(currentUserProfile?.role === 'leader' || currentUserProfile?.role === 'admin' || currentUserProfile?.username === 'Ace_Zero') && isAlphaUser && (
                                    <motion.button 
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                        onClick={() => setIsEditAlphaMode(!isEditAlphaMode)} 
                                        className="h-8 px-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/50 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        {isEditAlphaMode ? <Eye size={13} /> : <Edit3 size={13} />}
                                        <span>{isEditAlphaMode ? "Public View" : "Edit Alpha"}</span>
                                    </motion.button>
                                )}

                                {/* Instagram 3-Dots Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button 
                                            className="h-8 w-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                                            title="More Options"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#262626] border border-zinc-700/80 text-white rounded-xl p-1.5 min-w-[190px] shadow-2xl z-[9999]">
                                        <DropdownMenuItem onClick={handleShareProfile} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                            <Share2 size={15} className="text-zinc-400" /> Share Profile
                                        </DropdownMenuItem>
                                        {isFollowing && (
                                            <DropdownMenuItem onClick={handleFollowToggle} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                <UserMinus size={15} className="text-zinc-400" /> Unfollow
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator className="bg-zinc-700/50 my-1" />
                                        <DropdownMenuItem onClick={() => toast.success("User blocked")} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                                            <Ban size={15} /> Block @{profile.username}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toast.success("Report submitted to Shadow Council")} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                                            <Flag size={15} /> Report Profile
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Line 2: Instagram Unboxed Stats */}
                        <div className="flex items-center gap-7 text-sm md:text-base">
                            <div>
                                <span className="font-semibold text-white">{posts.length}</span> <span className="text-zinc-300">posts</span>
                            </div>
                            <div onClick={() => fetchFollowList('followers')} className="cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="font-semibold text-white">{followersCount}</span> <span className="text-zinc-300">followers</span>
                            </div>
                            <div onClick={() => fetchFollowList('following')} className="cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="font-semibold text-white">{followingCount}</span> <span className="text-zinc-300">following</span>
                            </div>
                            <div>
                                <span className="font-semibold text-white">Lvl {currentLevel}</span>
                            </div>
                        </div>

                        {/* Line 3: Bio Block & Clean Social Links */}
                        <div className="flex flex-col text-sm max-w-xl">
                            {profile.full_name && profile.full_name.trim().toLowerCase() !== profile.username.trim().toLowerCase() && (
                                <span className="font-semibold text-white">{profile.full_name}</span>
                            )}
                            {profile.bio && (
                                <span className="text-zinc-300 whitespace-pre-line mt-0.5 leading-relaxed">{profile.bio}</span>
                            )}

                            {/* Clean Social Links (Zero Container Box) */}
                            {socialLinks.length > 0 && (
                                <div className="flex items-center gap-3.5 flex-wrap mt-2">
                                    {socialLinks.map((link, idx) => {
                                        const href = formatSocialHref(link);
                                        const label = formatSocialLabel(link);
                                        return (
                                            <motion.a 
                                                key={idx}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                onClick={() => playGummyTap()}
                                                href={href} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer group"
                                                title={`${link.platform}: ${link.url}`}
                                            >
                                                {renderSocialIcon(link.platform, 13)}
                                                <span className="truncate max-w-[160px] group-hover:underline underline-offset-2">{label}</span>
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Mutual Friends Line ("Followed by ace_zero and 3 others") */}
                            {mutualSummary.count > 0 && (
                                <div className="flex items-center gap-2 mt-3 pt-2 text-xs text-zinc-400">
                                    <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                        {mutualSummary.samples.map(m => (
                                            <div key={m.id} className="w-5 h-5 rounded-full overflow-hidden border border-black bg-zinc-800">
                                                <img src={m.avatar_url || '/images/alpha/alpha-av.png'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <span>
                                        Followed by <strong className="text-zinc-200">{mutualSummary.samples[0]?.username}</strong>
                                        {mutualSummary.samples.length > 1 && <>, <strong className="text-zinc-200">{mutualSummary.samples[1]?.username}</strong></>}
                                        {mutualSummary.count > mutualSummary.samples.length && (
                                            <> and <strong className="text-zinc-200">{mutualSummary.count - mutualSummary.samples.length} others</strong></>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── MOBILE & TABLET INSTAGRAM HEADER (md:hidden) ── */}
                <div className="flex md:hidden flex-col mb-6 pb-2">
                    {/* Top Row: Avatar overlapping Banner, Stats on right */}
                    <div className="flex items-end gap-4 sm:gap-7 mb-3">
                        <div className="shrink-0 relative group -mt-10 sm:-mt-14">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center cursor-pointer">
                                <ProfileAvatar 
                                    profile={profile} 
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* 4 Equal Stat Columns */}
                        <div className="flex-1 grid grid-cols-4 gap-1 text-center pt-2 pb-1">
                            <div className="flex flex-col">
                                <span className="font-bold text-base text-white">{posts.length}</span>
                                <span className="text-xs text-zinc-400">posts</span>
                            </div>
                            <div onClick={() => fetchFollowList('followers')} className="flex flex-col cursor-pointer active:opacity-70">
                                <span className="font-bold text-base text-white">{followersCount}</span>
                                <span className="text-xs text-zinc-400">followers</span>
                            </div>
                            <div onClick={() => fetchFollowList('following')} className="flex flex-col cursor-pointer active:opacity-70">
                                <span className="font-bold text-base text-white">{followingCount}</span>
                                <span className="text-xs text-zinc-400">following</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base text-amber-300">Lvl {currentLevel}</span>
                                <span className="text-xs text-zinc-400">rank</span>
                            </div>
                        </div>
                    </div>

                    {/* Bio Block */}
                    <div className="flex flex-col mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white">{profile.username}</span>
                            <UserTitleBadge user={profile} variant="bracket" />
                        </div>
                        {profile.full_name && profile.full_name.trim().toLowerCase() !== profile.username.trim().toLowerCase() && (
                            <span className="font-medium text-xs text-zinc-300 mt-0.5">{profile.full_name}</span>
                        )}
                        {profile.bio && (
                            <span className="text-xs sm:text-sm text-zinc-300 whitespace-pre-line mt-1 leading-snug">{profile.bio}</span>
                        )}

                        {/* Clean Social Links */}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-3 flex-wrap mt-2">
                                {socialLinks.map((link, idx) => {
                                    const href = formatSocialHref(link);
                                    const label = formatSocialLabel(link);
                                    return (
                                        <motion.a 
                                            key={idx}
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.96 }}
                                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                            onClick={() => playGummyTap()}
                                            href={href} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer group"
                                            title={`${link.platform}: ${link.url}`}
                                        >
                                            {renderSocialIcon(link.platform, 12)}
                                            <span className="truncate max-w-[130px] group-hover:underline underline-offset-2">{label}</span>
                                        </motion.a>
                                    );
                                })}
                            </div>
                        )}

                        {/* Mutual Friends Line */}
                        {mutualSummary.count > 0 && (
                            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-zinc-400">
                                <span>
                                    Followed by <strong className="text-zinc-200">{mutualSummary.samples[0]?.username}</strong>
                                    {mutualSummary.count > 1 && <> and <strong className="text-zinc-200">{mutualSummary.count - 1} others</strong></>}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Flat Instagram Button Row */}
                    <div className="flex items-center gap-2 w-full">
                        <motion.button 
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            onClick={handleFollowToggle} 
                            className={cn(
                                "flex-1 h-8 font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm",
                                isPartner
                                    ? "bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-bold"
                                    : isFollowing
                                    ? "bg-[#363636] hover:bg-[#262626] text-white"
                                    : "bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold"
                            )}
                        >
                            {isPartner ? "🤝 Friends" : isFollowing ? "Following" : "Follow"}
                        </motion.button>
                        
                        <motion.button 
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            onClick={handleMessageClick} 
                            className="flex-1 h-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <MessageSquare size={13} />
                            <span>Message</span>
                        </motion.button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button 
                                    className="h-8 w-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                                    title="More Options"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#262626] border border-zinc-700/80 text-white rounded-xl p-1.5 min-w-[190px] shadow-2xl z-[9999]">
                                <DropdownMenuItem onClick={handleShareProfile} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                    <Share2 size={15} className="text-zinc-400" /> Share Profile
                                </DropdownMenuItem>
                                {isFollowing && (
                                    <DropdownMenuItem onClick={handleFollowToggle} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                        <UserMinus size={15} className="text-zinc-400" /> Unfollow
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-zinc-700/50 my-1" />
                                <DropdownMenuItem onClick={() => toast.success("User blocked")} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                                    <Ban size={15} /> Block @{profile.username}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Report submitted to Shadow Council")} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                                    <Flag size={15} /> Report Profile
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* ── ALPHA NATIVE EDITING DASHBOARD FOR LEADER/ADMIN ── */}
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
                                <Crown className="text-amber-400" size={20} />
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
                            {/* Avatar selector */}
                            <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col gap-4">
                                <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                    <Camera size={14} /> Profile Avatar & Frame
                                </span>

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
                                            <Crown size={13} /> Browse Anime Avatars
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

                            {/* Banner selector */}
                            <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col gap-4">
                                <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                    <ImageIcon size={14} /> Cover Banner Background
                                </span>

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

                        {/* Title metadata */}
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

                        {/* Bio / System Directive */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Bio / System Directive</label>
                            <Textarea 
                                value={alphaBio} 
                                onChange={(e) => setAlphaBio(e.target.value)} 
                                placeholder="First Member and Commander of Shadow Garden. Devoted to Lord Shadow..." 
                                className="bg-black/50 border-zinc-800 text-white text-xs rounded-xl h-24 resize-none leading-relaxed"
                            />
                        </div>

                        {/* Save Alpha */}
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
                                            equipped_title: alphaAdminTitle || alphaTitle || 'First Shadow',
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
                                            equipped_title: alphaAdminTitle || alphaTitle || 'First Shadow',
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

                {/* ── 3. INSTAGRAM CONTENT TABS ── */}
                <Tabs defaultValue="posts" className="w-full border-t border-zinc-800">
                    <TabsList className="bg-transparent w-full justify-center h-auto p-0 rounded-none flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
                        <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 sm:px-8 py-3.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors cursor-pointer">
                            <Grid size={14}/> Posts
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 sm:px-8 py-3.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors cursor-pointer">
                            <Heart size={14}/> Favorites
                        </TabsTrigger>
                        <TabsTrigger value="watchlist" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 sm:px-8 py-3.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors cursor-pointer">
                            <History size={14}/> History
                        </TabsTrigger>
                    </TabsList>

                    {/* Posts Grid */}
                    <TabsContent value="posts" className="mt-4 outline-none">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-20 h-20 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
                                    <Camera size={36} className="text-zinc-700"/>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">No Posts Yet</h3>
                                <p className="text-xs text-zinc-500">When {profile.username} shares posts, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-3">
                                {posts.map(post => (
                                    <ProfilePostGridItem key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Favorites / Liked */}
                    <TabsContent value="favorites" className="mt-4 outline-none">
                        {likedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-20 h-20 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
                                    <Heart size={36} className="text-zinc-700"/>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">No Favorites Yet</h3>
                                <p className="text-xs text-zinc-500">Liked community posts will show up here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-3">
                                {likedPosts.map(post => (
                                    <ProfilePostGridItem key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Watch History */}
                    <TabsContent value="watchlist" className="mt-4 outline-none">
                        {profile.settings?.publicActivity === false ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-20 h-20 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
                                    <ShieldAlert size={36} className="text-zinc-700"/>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">History is Private</h3>
                                <p className="text-xs text-zinc-500">This member has kept their watch history private.</p>
                            </div>
                        ) : watchHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-20 h-20 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
                                    <History size={36} className="text-zinc-700"/>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Watch History Empty</h3>
                                <p className="text-xs text-zinc-500">No watched episodes recorded yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {watchHistory.map((item, idx) => (
                                    <Link href={`/${item.type || 'watch'}/${item.anime_id}?ep=${item.episode_id}`} key={idx} className="relative aspect-video bg-zinc-900 group overflow-hidden cursor-pointer rounded-xl border border-white/5">
                                        <img src={item.episode_image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5 z-10">
                                            <span className="text-white text-xs font-bold line-clamp-1">{item.anime_title}</span>
                                            <span className="text-zinc-400 text-[10px]">Episode {item.episode_number}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── FOLLOWERS MODAL (INSTAGRAM-STYLE) ── */}
            <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
                <DialogContent className="bg-[#1c1c20] border border-white/10 text-white max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle className="text-center font-bold text-base text-white">Followers</DialogTitle>
                    </DialogHeader>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5">
                            <Search size={14} className="text-zinc-400" />
                            <input 
                                value={followerSearchQuery}
                                onChange={(e) => setFollowerSearchQuery(e.target.value)}
                                placeholder="Search followers..."
                                className="w-full bg-transparent border-0 text-white text-xs focus:outline-none placeholder:text-zinc-500"
                            />
                            {followerSearchQuery && (
                                <button onClick={() => setFollowerSearchQuery('')} className="text-zinc-500 hover:text-white text-xs">✕</button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-zinc-800/40">
                        {filteredFollowers.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 text-xs">
                                {followerSearchQuery ? "No matching followers found." : "No followers yet."}
                            </div>
                        ) : filteredFollowers.map(u => {
                            const isMe = user?.id === u.id;
                            const amFollowingUser = myFollowingIds.has(u.id);

                            return (
                                <div key={u.id} className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-xl transition-colors">
                                    <Link href={`/profile/${u.username || u.id}`} onClick={() => setShowFollowersModal(false)} className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 shrink-0">
                                            <ProfileAvatar profile={u} className="w-10 h-10" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs sm:text-sm text-white truncate">{u.username}</span>
                                                <UserTitleBadge user={u} variant="bracket" className="shrink-0 text-[10px]" />
                                            </div>
                                            <span className="text-[11px] text-zinc-400 truncate">{u.full_name || `@${u.username}`}</span>
                                        </div>
                                    </Link>

                                    {!isMe && user && (
                                        <button
                                            type="button"
                                            onClick={() => toggleFollowInModal(u)}
                                            className={cn(
                                                "h-7 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 ml-2 active:scale-95 cursor-pointer",
                                                amFollowingUser
                                                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                                                    : "bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold"
                                            )}
                                        >
                                            {amFollowingUser ? "Following" : "Follow"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── FOLLOWING MODAL (INSTAGRAM-STYLE) ── */}
            <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
                <DialogContent className="bg-[#1c1c20] border border-white/10 text-white max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle className="text-center font-bold text-base text-white">Following</DialogTitle>
                    </DialogHeader>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5">
                            <Search size={14} className="text-zinc-400" />
                            <input 
                                value={followingSearchQuery}
                                onChange={(e) => setFollowingSearchQuery(e.target.value)}
                                placeholder="Search following..."
                                className="w-full bg-transparent border-0 text-white text-xs focus:outline-none placeholder:text-zinc-500"
                            />
                            {followingSearchQuery && (
                                <button onClick={() => setFollowingSearchQuery('')} className="text-zinc-500 hover:text-white text-xs">✕</button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-zinc-800/40">
                        {filteredFollowing.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 text-xs">
                                {followingSearchQuery ? "No matching following found." : "Not following anyone yet."}
                            </div>
                        ) : filteredFollowing.map(u => {
                            const isMe = user?.id === u.id;
                            const amFollowingUser = myFollowingIds.has(u.id);

                            return (
                                <div key={u.id} className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-xl transition-colors">
                                    <Link href={`/profile/${u.username || u.id}`} onClick={() => setShowFollowingModal(false)} className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 shrink-0">
                                            <ProfileAvatar profile={u} className="w-10 h-10" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs sm:text-sm text-white truncate">{u.username}</span>
                                                <UserTitleBadge user={u} variant="bracket" className="shrink-0 text-[10px]" />
                                            </div>
                                            <span className="text-[11px] text-zinc-400 truncate">{u.full_name || `@${u.username}`}</span>
                                        </div>
                                    </Link>

                                    {!isMe && user && (
                                        <button
                                            type="button"
                                            onClick={() => toggleFollowInModal(u)}
                                            className={cn(
                                                "h-7 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 ml-2 active:scale-95 cursor-pointer",
                                                amFollowingUser
                                                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                                                    : "bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold"
                                            )}
                                        >
                                            {amFollowingUser ? "Following" : "Follow"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
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
