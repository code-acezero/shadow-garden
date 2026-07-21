"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ImageAPI } from '@/lib/api'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Grid, Heart, Bookmark, Settings, Upload, Trash2, Link as LinkIcon, Camera, LayoutGrid, CheckCircle, MessageSquare, History, Users, Award, Star, Lock, ShieldAlert
} from 'lucide-react';
import { toast } from '@/lib/toast';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import FantasyFrame from '@/components/User/FantasyFrame';
import Footer from '@/components/Anime/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, profile: rawProfile, refreshSession, isLoading } = useAuth();
    const profile = rawProfile as any;
    const router = useRouter();

    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    
    // Form State
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [gender, setGender] = useState("male");
    const avatarInputRef = useRef<HTMLInputElement>(null);

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
        if (profile) {
            setFullName(profile.full_name || "");
            setBio(profile.bio || "");
            setWebsite(profile.website || "");
            setGender(profile.gender || "male");
        }
    }, [profile]);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            // Fetch Followers Count
            const { count: f1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
            // Fetch Following Count
            const { count: f2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
            // Fetch Posts
            const { data: pData } = await supabase.from('social_posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            
            // Fetch Liked Posts
            const { data: likesData } = await supabase.from('social_likes').select('post_id, social_posts(*)').eq('user_id', user.id);
            
            // Fetch Watch History
            const { data: historyData } = await supabase.from('user_continue_watching').select('*').eq('user_id', user.id).order('last_updated', { ascending: false });

            setFollowersCount(f1 || 0);
            setFollowingCount(f2 || 0);
            setPosts(pData || []);
            if (likesData) setLikedPosts(likesData.map((l: any) => l.social_posts).filter(Boolean));
            if (historyData) setWatchHistory(historyData);
        };
        fetchData();
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            const { error } = await supabase.from('profiles').update({ full_name: fullName, bio, website, gender }).eq('id', user.id);
            if (error) throw error;
            toast.success("Profile updated");
            setIsEditing(false);
            refreshSession();
        } catch (e) { toast.error("Failed to update profile"); }
    };

    const handleImgBBUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const tid = toast.loading(`Uploading avatar...`);
        try {
            const url = await ImageAPI.uploadImage(file);
            const newHistory = [url, ...(profile.pfp_history || [])].slice(0, 15);
            await supabase.from('profiles').update({ avatar_url: url, pfp_history: newHistory }).eq('id', user.id);
            toast.success("Avatar updated");
            refreshSession();
        } catch (err) { toast.error("Upload failed"); } finally { toast.dismiss(tid); }
    };
    
    const fetchFollowList = async (type: 'followers'|'following') => {
        if (!user) return;
        const targetField = type === 'followers' ? 'following_id' : 'follower_id';
        const joinField = type === 'followers' ? 'follower_id' : 'following_id';
        
        const { data } = await supabase
            .from('follows')
            .select(`
                ${joinField},
                profiles!follows_${joinField}_fkey (
                    id, username, full_name, avatar_url
                )
            `)
            .eq(targetField, user.id);
            
        if (data) {
            const list = data.map((d: any) => d.profiles);
            if (type === 'followers') { setFollowersList(list); setShowFollowersModal(true); }
            else { setFollowingList(list); setShowFollowingModal(true); }
        }
    };

    if (!hasMounted || isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

    if (!profile) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
            <h2 className="text-2xl font-black text-white tracking-wide">Instagram Profile</h2>
            <p className="text-sm text-zinc-500 text-center max-w-xs">Sign in to view your profile.</p>
            <button onClick={() => setShowAuthModal(true)} className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg">Sign In</button>
            {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#000] text-white pt-24 pb-32">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                
                {/* INSTAGRAM HEADER */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                    {/* Avatar */}
                    <div className="shrink-0 relative group">
                        <FantasyFrame 
                            frameId={profile.frame_id} 
                            level={profile.level || 1} 
                            showLevelTag={profile.show_level !== false}
                            className="w-32 h-32 md:w-40 md:h-40"
                        >
                            <Avatar className="w-full h-full rounded-full border-4 border-black bg-zinc-900 cursor-pointer">
                                <AvatarImage src={profile.avatar_url} className="object-cover" />
                                <AvatarFallback><ShadowAvatar gender={gender}/></AvatarFallback>
                            </Avatar>
                        </FantasyFrame>
                        <div onClick={() => setShowAvatarModal(true)} className="absolute inset-1 bg-black/50 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center backdrop-blur-sm">
                            <Camera className="text-white" size={32} />
                        </div>
                    </div>

                    {/* Info & Stats */}
                    <div className="flex-1 flex flex-col items-center md:items-start w-full">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-5 w-full">
                            <h1 className="text-2xl md:text-xl font-medium text-white">{profile.username}</h1>
                            <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                                <Button onClick={() => setIsEditing(true)} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white h-8 px-4 font-bold text-xs rounded-lg">Edit profile</Button>
                                <Button onClick={() => router.push('/messages')} variant="secondary" className="bg-primary-600/20 border border-primary-500/30 hover:bg-primary-600 text-primary-400 hover:text-white h-8 px-4 font-bold text-xs rounded-lg flex items-center gap-1.5"><MessageSquare size={14} /> Messages</Button>
                                {(profile.role === 'admin' || profile.role === 'moderator') && (
                                    <Button onClick={() => router.push('/manager')} variant="secondary" className="bg-red-600/20 border border-red-500/30 hover:bg-red-600 text-red-400 hover:text-white h-8 px-4 font-bold text-xs rounded-lg flex items-center gap-1.5"><ShieldAlert size={14} /> Admin Panel</Button>
                                )}
                                {profile.level >= 100 && profile.role !== 'admin' && profile.role !== 'moderator' && (
                                    <Button onClick={() => toast.success("Mod Application submitted! We will review your profile.")} variant="secondary" className="bg-yellow-600/20 border border-yellow-500/30 hover:bg-yellow-600 text-yellow-400 hover:text-white h-8 px-4 font-bold text-xs rounded-lg flex items-center gap-1.5"><Award size={14} /> Apply for Mod</Button>
                                )}
                                <Button onClick={() => router.push('/watchlist')} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white h-8 px-4 font-bold text-xs rounded-lg hidden md:flex">Archive</Button>
                                <Button onClick={() => router.push('/settings')} variant="ghost" className="h-8 w-8 p-0 rounded-lg text-white hover:bg-zinc-800"><Settings size={18}/></Button>
                            </div>
                        </div>

                        <div className="flex gap-8 mb-5 text-sm md:text-base hidden md:flex">
                            <div><span className="font-bold text-white">{posts.length}</span> posts</div>
                            <div onClick={()=>fetchFollowList('followers')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followersCount}</span> followers</div>
                            <div onClick={()=>fetchFollowList('following')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followingCount}</span> following</div>
                        </div>

                        <div className="flex flex-col items-center md:items-start text-sm">
                            <span className="font-bold text-white">{profile.full_name || profile.username}</span>
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
                        {/* Level & XP Display */}
                        {(() => {
                            const level = profile.level || 1;
                            const xp = profile.xp || 0;
                            const xpForNext = level * 100;
                            const xpProgress = Math.min((xp % xpForNext) / xpForNext * 100, 100);
                            return (
                                <div className="mt-4 w-full md:max-w-xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                                                <Star size={11} className="text-white fill-white" />
                                            </div>
                                            <span className="text-xs font-black text-white tracking-wider">Lvl {level}</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500">{xp % xpForNext} / {xpForNext} XP</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${xpProgress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* TABS (POSTS, FAVORITES, WATCH HISTORY) */}
                <Tabs defaultValue="posts" className="w-full border-t border-zinc-800">
                    <TabsList className="bg-transparent w-full justify-center h-auto p-0 rounded-none flex overflow-x-auto">
                        <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 md:px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px] shrink-0">
                            <Grid size={14}/> Posts
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 md:px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px] shrink-0">
                            <Heart size={14}/> Favorites
                        </TabsTrigger>
                        <TabsTrigger value="watchlist" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 md:px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px] shrink-0">
                            <History size={14}/> Watch History
                        </TabsTrigger>
                        <TabsTrigger value="frames" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 md:px-6 py-4 text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 -mt-[1px] shrink-0">
                            <Award size={14}/> Frames
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-4 outline-none">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <Camera size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Share Photos</h2>
                                <p className="text-sm text-zinc-400">When you share photos, they will appear on your profile.</p>
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
                                <p className="text-sm text-zinc-400">Posts you like will appear here.</p>
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
                                <p className="text-sm text-zinc-400">Shows you've watched will appear here.</p>
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

                    {/* PROFILE FRAMES TAB */}
                    <TabsContent value="frames" className="mt-6 outline-none">
                        {(() => {
                            const currentLevel = profile.level || 1;
                            const activeFrame = profile.frame_id || 'none';
                            const FRAMES = [
                                { id: 'none', name: 'No Frame', minLevel: 0, gradient: '', description: 'Clean look, no frame' },
                                { id: 'starter', name: 'Starter Ring', minLevel: 1, gradient: 'from-zinc-400 to-zinc-600', description: 'Your first frame' },
                                { id: 'crimson', name: 'Crimson Seal', minLevel: 5, gradient: 'from-red-500 to-red-700', description: 'For the passionate' },
                                { id: 'sapphire', name: 'Sapphire Crest', minLevel: 10, gradient: 'from-blue-500 to-indigo-700', description: 'Cool and collected' },
                                { id: 'emerald', name: 'Emerald Mantle', minLevel: 15, gradient: 'from-emerald-400 to-green-700', description: 'Nature\'s champion' },
                                { id: 'golden', name: 'Golden Halo', minLevel: 25, gradient: 'from-yellow-400 to-amber-600', description: 'Glory and prestige' },
                                { id: 'shadow', name: 'Shadow Aura', minLevel: 40, gradient: 'from-violet-600 to-black', description: 'Power from darkness' },
                                { id: 'celestial', name: 'Celestial Ring', minLevel: 60, gradient: 'from-cyan-400 via-purple-500 to-pink-500', description: 'Among the stars' },
                                { id: 'divine', name: 'Divine Throne', minLevel: 99, gradient: 'from-pink-400 via-yellow-400 to-red-500', description: 'The pinnacle' },
                            ];
                            const handleEquipFrame = async (frameId: string) => {
                                if (!user) return;
                                try {
                                    await supabase.from('profiles').update({ frame_id: frameId }).eq('id', user.id);
                                    toast.success(frameId === 'none' ? 'Frame removed' : 'Frame equipped!');
                                    refreshSession();
                                } catch { toast.error('Failed to equip frame'); }
                            };
                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {FRAMES.map(frame => {
                                        const unlocked = currentLevel >= frame.minLevel;
                                        const isActive = activeFrame === frame.id;
                                        return (
                                            <div
                                                key={frame.id}
                                                onClick={() => unlocked && handleEquipFrame(frame.id)}
                                                className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                    isActive ? 'border-primary-500 bg-primary-600/10' :
                                                    unlocked ? 'border-white/10 bg-zinc-900/50 hover:border-white/30 cursor-pointer' :
                                                    'border-white/5 bg-zinc-900/20 opacity-50'
                                                }`}
                                            >
                                                {!unlocked && <div className="absolute top-2 right-2"><Lock size={10} className="text-zinc-500" /></div>}
                                                {isActive && <div className="absolute top-2 right-2"><CheckCircle size={12} className="text-primary-400" /></div>}
                                                <div className={`w-14 h-14 rounded-full p-1 ${ frame.gradient ? `bg-gradient-to-br ${frame.gradient}` : 'bg-zinc-800 border border-white/10' }`}>
                                                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                                                        <Star size={18} className={unlocked ? 'text-white' : 'text-zinc-600'} />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-white">{frame.name}</p>
                                                    <p className="text-[9px] text-zinc-500 mt-0.5">{unlocked ? frame.description : `Unlocks at Lv.${frame.minLevel}`}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </TabsContent>
                </Tabs>
            </div>

            {/* EDIT PROFILE MODAL */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="bg-[#262626] border-none text-white max-w-md rounded-xl p-0 overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-700">
                        <DialogTitle className="text-center font-bold text-base">Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Name</label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-transparent border-zinc-700 text-white h-12" placeholder="Full Name" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Website</label>
                            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-transparent border-zinc-700 text-white h-12" placeholder="Website" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Bio</label>
                            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-transparent border-zinc-700 text-white resize-none" placeholder="Bio" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Gender</label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="bg-transparent border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#262626] border-zinc-700 text-white">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="p-4 border-t border-zinc-700 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-zinc-800">Cancel</Button>
                        <Button onClick={handleUpdateProfile} className="bg-blue-500 hover:bg-blue-600 text-white font-bold">Done</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AVATAR UPLOAD MODAL */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="bg-[#262626] border-none text-white max-w-sm rounded-xl p-0 overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-center font-bold text-xl">Change Profile Photo</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col">
                        <button onClick={() => avatarInputRef.current?.click()} className="py-3 border-t border-zinc-700 text-blue-500 font-bold hover:bg-white/5 transition-colors">Upload Photo</button>
                        <button onClick={async () => { if(!user)return; await supabase.from('profiles').update({avatar_url: null}).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} className="py-3 border-t border-zinc-700 text-red-500 font-bold hover:bg-white/5 transition-colors">Remove Current Photo</button>
                        <button onClick={() => setShowAvatarModal(false)} className="py-3 border-t border-zinc-700 text-zinc-300 hover:bg-white/5 transition-colors">Cancel</button>
                    </div>
                    <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleImgBBUpload} />
                </DialogContent>
            </Dialog>

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
                            <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url}/><AvatarFallback className="bg-zinc-800 text-white text-xs">{u.username?.[0]}</AvatarFallback></Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white">{u.username}</span>
                                        <span className="text-xs text-zinc-400">{u.full_name}</span>
                                    </div>
                                </div>
                            </Link>
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
                            <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url}/><AvatarFallback className="bg-zinc-800 text-white text-xs">{u.username?.[0]}</AvatarFallback></Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white">{u.username}</span>
                                        <span className="text-xs text-zinc-400">{u.full_name}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
