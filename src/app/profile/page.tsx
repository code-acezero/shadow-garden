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
    Grid, Heart, Bookmark, Settings, Upload, Trash2, Link as LinkIcon, Camera, LayoutGrid, CheckCircle, MessageSquare, History, Users, Award, Star, Lock, ShieldAlert, Pencil, Save, X, Move, Image as ImageIcon, Check, Loader2, Sparkles, ChevronRight, Crop, Eye, EyeOff, Zap, Shield, Bell, Tv, AlertTriangle
} from 'lucide-react';
import { toast } from '@/lib/toast';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import ProfileAvatar from '@/components/User/ProfileAvatar';
import FantasyFrame from '@/components/User/FantasyFrame';
import UserTitleBadge from '@/components/ui/UserTitleBadge';
import Footer from '@/components/Anime/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AvatarSelectorModal, { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';
import AvatarCropperModal from '@/components/User/AvatarCropperModal';
import { getWatchRoute, formatAnimeTitle } from '@/lib/utils';

const PRESET_COVERS = [
    { name: 'Nebula Dreams', url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000' },
    { name: 'Sakura Night', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000' },
    { name: 'Cosmic Cyber', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000' },
    { name: 'Aetherial Mountains', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000' },
    { name: 'Anime Sunset Coast', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000' },
    { name: 'Celestial Aurora', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000' },
];

export default function ProfilePage() {
    const { user, profile: rawProfile, refreshSession, isLoading } = useAuth();
    const profile = rawProfile as any;
    const router = useRouter();

    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [avatarLibraryModalOpen, setAvatarLibraryModalOpen] = useState(false);
    const [cropperModalOpen, setCropperModalOpen] = useState(false);
    const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);
    const [showTitleState, setShowTitleState] = useState<boolean>(true);

    useEffect(() => {
        if (profile && typeof profile.show_title === 'boolean') {
            setShowTitleState(profile.show_title);
        } else if (user?.id && typeof window !== 'undefined') {
            const localVal = localStorage.getItem(`shadow_show_title_${user.id}`);
            if (localVal !== null) setShowTitleState(localVal !== 'false');
        }
    }, [profile, user]);

    // Traveller profile (localStorage-backed, no auth required)
    const [travellerName, setTravellerName] = useState('');
    const [travellerAvatar, setTravellerAvatar] = useState('');
    const [travellerAvatarModalOpen, setTravellerAvatarModalOpen] = useState(false);
    const [travellerEditing, setTravellerEditing] = useState(false);
    const [travellerDraft, setTravellerDraft] = useState('');

    useEffect(() => {
        if (!user) {
            const savedName = localStorage.getItem('shadow_traveller_name') || getRandomGuestName();
            const savedAvatar = localStorage.getItem('shadow_traveller_avatar') || getRandomAvatar(true);
            setTravellerName(savedName);
            setTravellerAvatar(savedAvatar);
            setTravellerDraft(savedName);
        }
    }, [user]);

    const handleSaveTraveller = () => {
        const name = travellerDraft.trim() || travellerName;
        localStorage.setItem('shadow_traveller_name', name);
        localStorage.setItem('shadow_traveller_avatar', travellerAvatar);
        setTravellerName(name);
        window.dispatchEvent(new CustomEvent('shadow-traveller-updated', { detail: { name, avatar: travellerAvatar } }));
        toast.success('Profile saved!');
        setTravellerEditing(false);
    };
    
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

    // Frame State
    const [activeFrame, setActiveFrame] = useState('none');

    // Cover Photo State & Drag Handlers
    const [coverYPercent, setCoverYPercent] = useState(50);
    const [isRepositioning, setIsRepositioning] = useState(false);
    const [isDraggingCover, setIsDraggingCover] = useState(false);
    const [coverDragStartY, setCoverDragStartY] = useState(0);
    const [initialCoverY, setInitialCoverY] = useState(50);
    const [tempCoverSrc, setTempCoverSrc] = useState<string | null>(null);
    const [coverMenuOpen, setCoverMenuOpen] = useState(false);
    const [presetCoverModalOpen, setPresetCoverModalOpen] = useState(false);
    const [savingCover, setSavingCover] = useState(false);
    const coverBannerRef = useRef<HTMLDivElement>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile?.banner_pos !== undefined && profile?.banner_pos !== null) {
            setCoverYPercent(Number(profile.banner_pos));
        }
    }, [profile?.banner_pos]);

    const handleCoverMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isRepositioning) return;
        setIsDraggingCover(true);
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setCoverDragStartY(clientY);
    };

    const handleCoverMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingCover || !coverBannerRef.current) return;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const deltaY = clientY - coverDragStartY;
        const bannerHeight = coverBannerRef.current.clientHeight || 240;
        
        const percentDelta = (deltaY / bannerHeight) * 100;
        const newPercent = Math.max(0, Math.min(100, coverYPercent - percentDelta));
        
        setCoverYPercent(newPercent);
        setCoverDragStartY(clientY);
    };

    const handleCoverMouseUp = () => {
        setIsDraggingCover(false);
    };

    const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading("Uploading cover photo...");
            const uploadedUrl = await ImageAPI.uploadImage(file);
            toast.dismiss();

            if (uploadedUrl) {
                setTempCoverSrc(uploadedUrl);
                setCoverYPercent(50);
                setIsRepositioning(true);
                toast.success("Cover uploaded! Drag vertically to reposition, then save.");
            } else {
                toast.error("Failed to upload cover photo.");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Upload failed. Try again.");
        }
    };

    const handleSaveCover = async () => {
        if (!user) return;
        setSavingCover(true);
        try {
            const updates: any = {
                banner_pos: Math.round(coverYPercent),
                updated_at: new Date().toISOString(),
            };
            if (tempCoverSrc) {
                updates.banner_url = tempCoverSrc;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            toast.success("Cover photo saved!");
            setIsRepositioning(false);
            setTempCoverSrc(null);
            refreshSession();
        } catch (error) {
            toast.error("Failed to save cover photo.");
        } finally {
            setSavingCover(false);
        }
    };

    const handleCancelCoverReposition = () => {
        setCoverYPercent(profile?.banner_pos !== undefined && profile?.banner_pos !== null ? Number(profile.banner_pos) : initialCoverY);
        setTempCoverSrc(null);
        setIsRepositioning(false);
    };

    const handleSelectPresetCover = (url: string) => {
        setTempCoverSrc(url);
        setCoverYPercent(50);
        setPresetCoverModalOpen(false);
        setIsRepositioning(true);
        toast.info("Preset chosen! Drag vertically to reposition, then click Save.");
    };

    const handleRemoveCover = async () => {
        if (!user) return;
        setCoverMenuOpen(false);
        try {
            toast.loading("Removing cover photo...");
            const { error } = await supabase
                .from('profiles')
                .update({ banner_url: null, banner_pos: 50, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            toast.dismiss();
            if (error) throw error;
            setTempCoverSrc(null);
            setCoverYPercent(50);
            toast.success("Cover photo removed.");
            refreshSession();
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to remove cover photo.");
        }
    };

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            setBio(profile.bio || "");
            setWebsite(profile.website || "");
            setGender(profile.gender || "male");
            if (profile.frame_id) setActiveFrame(profile.frame_id);
        }
    }, [profile]);



    const [userNotifications, setUserNotifications] = useState<any[]>([]);

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

            // Fetch Notifications
            const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

            setFollowersCount(f1 || 0);
            setFollowingCount(f2 || 0);
            setPosts(pData || []);
            if (likesData) setLikedPosts(likesData.map((l: any) => l.social_posts).filter(Boolean));
            if (historyData) setWatchHistory(historyData);
            if (notifData) setUserNotifications(notifData);
        };
        fetchData();
    }, [user]);

    const handleClearNotifications = async () => {
        if (!user || userNotifications.length === 0) return;
        const realIds = userNotifications.map(n => n.id).filter(Boolean);
        try {
            setUserNotifications([]);
            if (realIds.length > 0) {
                await supabase.from('notifications').delete().in('id', realIds);
            }
            toast.success("Notifications cleared");
        } catch (e) {
            toast.error("Failed to clear notifications");
        }
    };

    const handleMarkAllNotifsRead = async () => {
        if (!user || userNotifications.length === 0) return;
        try {
            setUserNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
            toast.success("All marked as read");
        } catch (e) {
            toast.error("Failed to mark notifications");
        }
    };

    const handleDeleteSingleNotif = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        try {
            setUserNotifications(prev => prev.filter(n => n.id !== id));
            await supabase.from('notifications').delete().eq('id', id);
        } catch (e) {
            console.error("Error deleting single notification:", e);
        }
    };

    const handleClearHistory = async () => {
        if (watchHistory.length === 0) return;
        try {
            setWatchHistory([]);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('shadow_continue_watching');
            }
            if (user) {
                await supabase.from('user_continue_watching').delete().eq('user_id', user.id);
            }
            toast.success("Watch history cleared");
        } catch (e) {
            toast.error("Failed to clear history");
        }
    };

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
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                setPendingAvatarSrc(reader.result as string);
                setShowAvatarModal(false);
                setCropperModalOpen(true);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSelectAvatarFromLibrary = (url: string) => {
        setPendingAvatarSrc(url);
        setAvatarLibraryModalOpen(false);
        setShowAvatarModal(false);
        setCropperModalOpen(true);
    };

    const handleCropComplete = async (croppedDataUrl: string) => {
        setCropperModalOpen(false);
        if (!user) {
            setTravellerAvatar(croppedDataUrl);
            localStorage.setItem('shadow_traveller_avatar', croppedDataUrl);
            toast.success("Guest avatar updated!");
            return;
        }

        const tid = toast.loading("Saving avatar...");
        try {
            let finalUrl = croppedDataUrl;
            try {
                const res = await fetch(croppedDataUrl);
                const blob = await res.blob();
                const file = new File([blob], `cropped_avatar_${Date.now()}.png`, { type: 'image/png' });
                finalUrl = await ImageAPI.uploadImage(file);
            } catch (uploadErr) {
                // If cloud upload fails, fallback to cropped data URL directly
                console.warn('Cloud upload fallback to DataURL:', uploadErr);
            }

            const newHistory = [finalUrl, ...(profile?.pfp_history || [])].slice(0, 15);
            await supabase.from('profiles').update({ avatar_url: finalUrl, pfp_history: newHistory }).eq('id', user.id);
            toast.success("Avatar updated!");
            refreshSession();
        } catch (err) {
            toast.error("Failed to save avatar.");
        } finally {
            toast.dismiss(tid);
        }
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
                    id, username, full_name, avatar_url, level, frame_id, show_level
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

    // Traveller (not logged-in) profile view
    if (!profile || !user) return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-between">
            <div className="px-4 pt-12 pb-16 w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-6 mb-8 w-full text-center">
                    <div className="relative group">
                        <div
                            className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/10 shadow-xl cursor-pointer"
                            onClick={() => setTravellerAvatarModalOpen(true)}
                        >
                            <img src={travellerAvatar} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <button
                            onClick={() => setTravellerAvatarModalOpen(true)}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <Camera size={24} className="text-white" />
                        </button>
                    </div>

                    {travellerEditing ? (
                        <div className="flex items-center gap-2 w-full max-w-xs mx-auto">
                            <input
                                autoFocus
                                value={travellerDraft}
                                onChange={e => setTravellerDraft(e.target.value)}
                                maxLength={30}
                                placeholder="Your name…"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none text-center"
                            />
                            <button onClick={handleSaveTraveller} className="p-2.5 bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors"><Save size={16} /></button>
                            <button onClick={() => setTravellerEditing(false)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><X size={16} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-2xl font-black text-white">{travellerName}</h1>
                            <button onClick={() => { setTravellerDraft(travellerName); setTravellerEditing(true); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                                <Pencil size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mx-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Traveller</span>
                    </div>
                </div>

                {/* Avatar selector shortcut */}
                <button
                    onClick={() => setTravellerAvatarModalOpen(true)}
                    className="w-full max-w-md flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors mb-6"
                >
                    <div className="flex items-center gap-3">
                        <img src={travellerAvatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Change Avatar</p>
                            <p className="text-xs text-zinc-500">Pick from curated anime characters</p>
                        </div>
                    </div>
                    <Camera size={16} className="text-zinc-500" />
                </button>

                {/* Sign-in prompt */}
                <div className="w-full max-w-md p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl text-center">
                    <h3 className="font-black text-white text-lg mb-1">Unlock your full profile</h3>
                    <p className="text-sm text-zinc-400 mb-5 leading-relaxed">Create an account to sync your progress, post in the community, and access all features.</p>
                    <Button
                        onClick={() => window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }))}
                        className="w-full max-w-xs h-12 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl mx-auto shadow-lg"
                    >
                        Create Account
                    </Button>
                </div>
            </div>

            <AvatarSelectorModal
                isOpen={travellerAvatarModalOpen}
                onClose={() => setTravellerAvatarModalOpen(false)}
                onSelect={(url) => {
                    setTravellerAvatar(url);
                    localStorage.setItem('shadow_traveller_avatar', url);
                    window.dispatchEvent(new CustomEvent('shadow-traveller-updated', { detail: { name: travellerName, avatar: url } }));
                }}
                currentUrl={travellerAvatar}
                isGuest={true}
            />
            {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />}
        </div>
    );

    return (
        <div className="bg-[#000] text-white w-full h-full pb-8">
            {/* PROFILE COVER BANNER CONTAINER */}
            <div className="relative w-full mb-2 group">
                <div 
                    ref={coverBannerRef}
                    onMouseDown={handleCoverMouseDown}
                    onMouseMove={handleCoverMouseMove}
                    onMouseUp={handleCoverMouseUp}
                    onTouchStart={handleCoverMouseDown}
                    onTouchMove={handleCoverMouseMove}
                    onTouchEnd={handleCoverMouseUp}
                    className={`w-full h-48 sm:h-64 md:h-80 rounded-b-3xl relative overflow-hidden bg-zinc-900 shadow-2xl border-b border-white/10 ${isRepositioning ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
                >
                    <img 
                        src={tempCoverSrc || profile.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"} 
                        alt="Cover Banner" 
                        className="w-full h-full object-cover pointer-events-none transition-all duration-75"
                        style={{ objectPosition: `center ${coverYPercent}%` }}
                    />
                    
                    {/* Ambient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* REPOSITION DIRECTIVE OVERLAY */}
                    {isRepositioning && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-20">
                            <div className="bg-black/80 border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-2xl animate-pulse">
                                <Move size={14} /> Drag vertically to reposition cover
                            </div>
                        </div>
                    )}

                    {/* COVER EDIT BUTTON & DROPDOWN MENU */}
                    {!isRepositioning && (
                        <div className="absolute top-4 right-4 z-30">
                            <button
                                type="button"
                                onClick={() => setCoverMenuOpen(!coverMenuOpen)}
                                className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 text-xs font-bold flex items-center gap-2 shadow-xl opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                                <Camera size={14} />
                                <span>Edit Cover</span>
                            </button>

                            {coverMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#0c0c12]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 z-40 space-y-1">
                                    <button
                                        onClick={() => { setCoverMenuOpen(false); coverFileInputRef.current?.click(); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Upload size={13} /> Upload Photo
                                    </button>
                                    <button
                                        onClick={() => { setCoverMenuOpen(false); setInitialCoverY(coverYPercent); setIsRepositioning(true); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Move size={13} /> Reposition Cover
                                    </button>
                                    <button
                                        onClick={() => { setCoverMenuOpen(false); setPresetCoverModalOpen(true); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <ImageIcon size={13} /> Choose Preset Cover
                                    </button>
                                    {profile.banner_url && (
                                        <button
                                            onClick={handleRemoveCover}
                                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={13} /> Remove Cover
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* REPOSITION SAVE / CANCEL CONTROL BAR */}
                    {isRepositioning && (
                        <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between bg-black/85 backdrop-blur-xl p-2.5 rounded-2xl border border-white/20 shadow-2xl">
                            <span className="text-xs font-bold text-white px-2 hidden sm:inline flex items-center gap-2">
                                <Move size={14} className="text-primary-400" /> Repositioning Cover Photo
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={handleCancelCoverReposition}
                                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCover}
                                    disabled={savingCover}
                                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5"
                                >
                                    {savingCover ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />} Save Position
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <input 
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="hidden"
                />
            </div>

            <div className="px-4 sm:px-8 w-full -mt-14 sm:-mt-20 md:-mt-24 relative z-20">
                
                {/* PROFILE HEADER */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                    {/* Avatar */}
                    <div className="shrink-0 relative group">
                        <ProfileAvatar 
                            profile={profile ? {...profile, frame_id: activeFrame || profile.frame_id} : null} 
                            className="w-32 h-32 md:w-40 md:h-40 cursor-pointer"
                        />
                        <div onClick={() => setShowAvatarModal(true)} className="absolute inset-1 bg-black/50 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center backdrop-blur-sm">
                            <Camera className="text-white" size={32} />
                        </div>
                    </div>

                    {/* Info & Stats */}
                    <div className="flex-1 flex flex-col items-center md:items-start w-full pt-4 md:pt-14">
                        {/* Header Content: Left Column (Username + Stats + Bio) & Right Column (Action Buttons + Level XP Bar) */}
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-4 w-full">
                            {/* Left Column: Username, Stats, and Bio tightly stacked */}
                            <div className="flex flex-col items-center md:items-start text-left flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap justify-center md:justify-start">
                                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{profile?.username || 'Shadow Member'}</h1>
                                    <UserTitleBadge user={profile} variant="bracket" />
                                </div>

                                {/* Stats directly under username */}
                                <div className="flex gap-6 mt-2 mb-2 text-sm md:text-base hidden md:flex items-center">
                                    <div><span className="font-bold text-white">{posts.length}</span> <span className="text-zinc-400">posts</span></div>
                                    <div onClick={()=>fetchFollowList('followers')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followersCount}</span> <span className="text-zinc-400">followers</span></div>
                                    <div onClick={()=>fetchFollowList('following')} className="cursor-pointer hover:text-zinc-300"><span className="font-bold text-white">{followingCount}</span> <span className="text-zinc-400">following</span></div>
                                </div>

                                {/* Bio directly under stats */}
                                <div className="flex flex-col items-center md:items-start text-sm">
                                    <span className="text-zinc-300 whitespace-pre-wrap text-center md:text-left">{profile?.bio}</span>
                                    {profile?.website && (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="text-[#E0F2FE] font-bold hover:underline flex items-center gap-1 mt-1">
                                            <LinkIcon size={14}/> {profile.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                            </div>
                            
                            {/* Right Column: Action Buttons & Level XP Bar */}
                            <div className="flex flex-col items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto">
                                {/* Right-Side Action Buttons with Liquid Glass styling */}
                                <div className="flex gap-2 flex-wrap justify-center md:justify-end items-center">
                                    <Button onClick={() => router.push('/messages')} variant="secondary" className="bg-primary-600/20 border border-primary-500/30 hover:bg-primary-600 text-primary-400 hover:text-white h-8.5 px-4 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"><MessageSquare size={14} /> Messages</Button>
                                    {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                                        <Button onClick={() => router.push('/manager')} variant="secondary" className="bg-red-600/20 border border-red-500/30 hover:bg-red-600 text-red-400 hover:text-white h-8.5 px-4 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"><ShieldAlert size={14} /> Admin Panel</Button>
                                    )}
                                    {(profile?.level || 0) >= 100 && profile?.role !== 'admin' && profile?.role !== 'moderator' && (
                                        <Button onClick={() => toast.success("Mod Application submitted! We will review your profile.")} variant="secondary" className="bg-yellow-600/20 border border-yellow-500/30 hover:bg-yellow-600 text-yellow-400 hover:text-white h-8.5 px-4 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"><Award size={14} /> Apply for Mod</Button>
                                    )}
                                    
                                    {/* 1. Archive (Liquid Glass) */}
                                    <Button 
                                        onClick={() => router.push('/watchlist')} 
                                        variant="secondary" 
                                        className="bg-gradient-to-b from-white/15 via-white/10 to-white/5 hover:from-white/25 hover:to-white/15 text-white h-8.5 px-4 font-extrabold text-xs rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        Archive
                                    </Button>

                                    {/* 2. Edit Profile (Between Archive and Settings - Liquid Glass) */}
                                    <Button 
                                        onClick={() => setIsEditing(true)} 
                                        variant="secondary" 
                                        className="bg-gradient-to-b from-white/15 via-white/10 to-white/5 hover:from-white/25 hover:to-white/15 text-white h-8.5 px-4 font-extrabold text-xs rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Pencil size={13} /> Edit profile
                                    </Button>

                                    {/* 3. Settings Gear (Liquid Glass) */}
                                    <Button 
                                        onClick={() => router.push('/settings')} 
                                        variant="ghost" 
                                        className="bg-gradient-to-b from-white/15 via-white/10 to-white/5 hover:from-white/25 hover:to-white/15 h-8.5 w-8.5 p-0 rounded-xl text-white border border-white/20 hover:border-white/40 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                                    >
                                        <Settings size={16}/>
                                    </Button>
                                </div>

                                {/* Level & XP Display directly UNDER right-side action buttons */}
                                {(() => {
                                    const level = profile.level || 1;
                                    const xp = profile.xp || 0;
                                    const isMaxLevel = level >= 100;
                                    const xpForNext = level * 100;
                                    const xpProgress = isMaxLevel ? 100 : Math.min((xp % xpForNext) / xpForNext * 100, 100);
                                    return (
                                        <div className="w-full max-w-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                                                        <Star size={11} className="text-white fill-white" />
                                                    </div>
                                                    <span className="text-xs font-black text-white tracking-wider">Lvl {level}</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500">
                                                    {isMaxLevel ? 'MAX XP' : `${xp % xpForNext} / ${xpForNext} XP`}
                                                </span>
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

                        {/* Mobile Stats */}
                        <div className="flex justify-around w-full border-t border-zinc-800 py-3 mt-6 md:hidden text-sm">
                            <div className="flex flex-col items-center"><span className="font-bold text-white">{posts.length}</span> <span className="text-zinc-500">posts</span></div>
                            <div onClick={()=>fetchFollowList('followers')} className="flex flex-col items-center cursor-pointer"><span className="font-bold text-white">{followersCount}</span> <span className="text-zinc-500">followers</span></div>
                            <div onClick={()=>fetchFollowList('following')} className="flex flex-col items-center cursor-pointer"><span className="font-bold text-white">{followingCount}</span> <span className="text-zinc-500">following</span></div>
                        </div>
                    </div>
                </div>

                {/* TABS (POSTS, FAVORITES, WATCH HISTORY, FRAMES) */}
                <Tabs defaultValue="posts" className="w-full border-t border-zinc-800">
                    <TabsList className="bg-transparent w-full justify-center h-auto p-0 rounded-none flex items-center gap-1 sm:gap-4 overflow-x-auto custom-scrollbar">
                        <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-5 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Grid size={14}/> Posts
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-5 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Heart size={14}/> Favorites
                        </TabsTrigger>
                        <TabsTrigger value="watchlist" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-5 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <History size={14}/> History
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-5 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors relative">
                            <Bell size={14}/> Notifications
                            {userNotifications.filter(n => !n.is_read).length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse ml-0.5" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="frames" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[2px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-3 sm:px-5 py-3.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Award size={14}/> Title & Frames
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
                    <TabsContent value="watchlist" className="mt-6 outline-none">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <History className="text-primary-400" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Watch History</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-zinc-300">
                                        {watchHistory.length}
                                    </span>
                                </div>
                                {watchHistory.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearHistory}
                                        className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-300 border border-red-500/30 transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-sm active:scale-95"
                                    >
                                        <Trash2 size={13} />
                                        Clear History
                                    </button>
                                )}
                            </div>

                            {watchHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                    <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md">
                                        <History size={32} className="text-zinc-600"/>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Watch History Empty</h3>
                                    <p className="text-xs text-zinc-400">Shows you've watched will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                    {watchHistory.map((item, idx) => {
                                        const route = getWatchRoute(item.anime_id, item.episode_id, item.type);
                                        const title = formatAnimeTitle(item.anime_title || item.title, item.anime_id);
                                        const poster = item.episode_image || item.anime_image || item.poster || '/images/no-poster.png';
                                        const epNum = item.episode_number || 1;
                                        const progressPct = item.duration > 0 ? Math.min((item.progress / item.duration) * 100, 100) : 0;

                                        return (
                                            <Link 
                                                href={route} 
                                                key={item.id || idx} 
                                                className="group relative flex flex-col rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-primary-500/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg backdrop-blur-md"
                                            >
                                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                                                    <img 
                                                        src={poster} 
                                                        alt={title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                                    
                                                    {/* Category Tag */}
                                                    {item.type && (
                                                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/70 border border-white/15 text-[9px] font-black text-primary-300 uppercase tracking-wider backdrop-blur-md">
                                                            {item.type}
                                                        </span>
                                                    )}

                                                    {/* Episode Badge */}
                                                    <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-md bg-primary-600/90 text-[10px] font-black text-white shadow-md">
                                                        EP {epNum}
                                                    </span>

                                                    {/* Playback Progress */}
                                                    {progressPct > 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                                                            <div className="h-full bg-primary-500" style={{ width: `${progressPct}%` }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Content with Anime Title */}
                                                <div className="p-2.5 flex flex-col gap-0.5 bg-zinc-900/80">
                                                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                                                        {title}
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-400 font-medium">
                                                        Episode {epNum}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* NOTIFICATIONS TAB */}
                    <TabsContent value="notifications" className="mt-6 outline-none">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <Bell className="text-primary-400" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">All Notifications</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-zinc-300">
                                        {userNotifications.length}
                                    </span>
                                </div>
                                {userNotifications.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleMarkAllNotifsRead}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                        >
                                            Mark Read
                                        </button>
                                        <button
                                            onClick={handleClearNotifications}
                                            className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-300 border border-red-500/30 transition-all cursor-pointer"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </div>

                            {userNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                    <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md">
                                        <Bell size={32} className="text-zinc-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">No Notifications</h3>
                                    <p className="text-xs text-zinc-400">You're all caught up! New alerts will show here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {userNotifications.map(notif => {
                                        let icon = <Bell size={16} className="text-primary-400" />;
                                        if (notif.type === 'EPISODE_ALERT' || notif.type === 'anime_update') icon = <Tv size={16} className="text-emerald-400" />;
                                        else if (notif.type === 'GUILD_WARNING') icon = <AlertTriangle size={16} className="text-yellow-400" />;
                                        else if (notif.type === 'REPLY') icon = <MessageSquare size={16} className="text-sky-400" />;

                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => {
                                                    if (notif.link) router.push(notif.link);
                                                }}
                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer backdrop-blur-xl ${
                                                    notif.is_read
                                                        ? 'bg-black/40 border-white/10 hover:border-white/20 text-zinc-400'
                                                        : 'bg-gradient-to-r from-primary-950/40 via-black to-zinc-950 border-primary-500/40 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="p-2.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                                                        {icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-bold text-white truncate">{notif.title || 'Notification'}</h4>
                                                            {!notif.is_read && (
                                                                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 animate-pulse" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2">{notif.message || notif.content}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => handleDeleteSingleNotif(notif.id, e)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* PROFILE FRAMES TAB */}
                    <TabsContent value="frames" className="mt-6 outline-none">
                        {(() => {
                            const currentLevel = profile.level || 1;
                            const role = profile.role || 'user';
                            
                            const FRAMES = [
                                { id: 'none', name: 'No Frame', minLevel: 0, gradient: '', description: 'Clean look, no frame' },
                                { id: 'iron', name: 'Iron Seal', minLevel: 1, gradient: 'from-zinc-400 to-zinc-600', description: 'Your first frame' },
                                { id: 'bronze', name: 'Bronze Crest', minLevel: 5, gradient: 'from-orange-700 to-orange-900', description: 'Gaining experience' },
                                { id: 'silver', name: 'Silver Knight', minLevel: 10, gradient: 'from-slate-300 to-slate-500', description: 'Proven warrior' },
                                { id: 'crimson', name: 'Crimson Blade', minLevel: 20, gradient: 'from-red-500 to-red-700', description: 'For the passionate' },
                                { id: 'sapphire', name: 'Sapphire Arc', minLevel: 30, gradient: 'from-blue-500 to-indigo-700', description: 'Cool and collected' },
                                { id: 'emerald', name: 'Emerald Wilds', minLevel: 40, gradient: 'from-emerald-400 to-green-700', description: 'Nature\'s champion' },
                                { id: 'golden', name: 'Golden Realm', minLevel: 50, gradient: 'from-yellow-400 to-amber-600', description: 'Glory and prestige' },
                                { id: 'shadow', name: 'Shadow Void', minLevel: 70, gradient: 'from-violet-600 to-black', description: 'Power from darkness' },
                                { id: 'celestial', name: 'Celestial Rift', minLevel: 90, gradient: 'from-cyan-400 via-purple-500 to-pink-500', description: 'Among the stars' },
                                { id: 'divine', name: 'Divine Archon', minLevel: 100, gradient: 'from-pink-400 via-yellow-400 to-red-500', description: 'The pinnacle' },
                                ...(role === 'admin' || role === 'moderator' ? [
                                    { id: 'moderator', name: 'The Warden', minLevel: 0, gradient: 'from-sky-500 to-blue-700', description: 'Council of Shadows' }
                                ] : []),
                                ...(role === 'admin' ? [
                                    { id: 'admin', name: 'The Eternal', minLevel: 0, gradient: 'from-yellow-300 to-orange-500', description: 'Board of Darkness' }
                                ] : [])
                            ];
                            const handleEquipFrame = async (frameId: string) => {
                                if (!user) return;
                                setActiveFrame(frameId); 
                                try {
                                    const { error } = await supabase.from('profiles').update({ frame_id: frameId }).eq('id', user.id);
                                    if (error) throw error;
                                    toast.success(frameId === 'none' ? 'Frame removed' : 'Frame equipped!');
                                    refreshSession();
                                } catch { 
                                    toast.error('Failed to equip frame'); 
                                    setActiveFrame(profile.frame_id || 'none');
                                }
                            };

                            const handleToggleShowTitle = async (newVal: boolean) => {
                                setShowTitleState(newVal);
                                if (!user) return;
                                try {
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem(`shadow_show_title_${user.id}`, String(newVal));
                                    }
                                    await supabase.from('profiles').update({ show_title: newVal }).eq('id', user.id);
                                    toast.success(newVal ? "Title visible on profile & chats" : "Title hidden globally");
                                    refreshSession();
                                } catch {
                                    toast.success(newVal ? "Title visible" : "Title hidden");
                                }
                            };

                            const TITLE_RANKS = [
                                { title: 'F-Novice', minLevel: 1, desc: 'Granted upon entering the Shadow realm.' },
                                { title: 'E-Pathfinder', minLevel: 5, desc: 'Beginning exploration into uncharted territory.' },
                                { title: 'D-Champion', minLevel: 10, desc: 'Battle-tested initiate displaying martial potential.' },
                                { title: 'C-Mercenary', minLevel: 20, desc: 'Skilled operative executing guild missions.' },
                                { title: 'B-Vanguard', minLevel: 35, desc: 'Frontline leader of Shadow expeditionary forces.' },
                                { title: 'A-Grandmaster', minLevel: 50, desc: 'Master of shadow magic and battlefield tactics.' },
                                { title: 'S-Sovereign', minLevel: 65, desc: 'Eradicator of high-level realm threats.' },
                                { title: 'SS-Conqueror', minLevel: 80, desc: 'Legendary warrior revered across kingdoms.' },
                                { title: 'SSS-Overlord', minLevel: 90, desc: 'Wielder of ancient dark arts & shadow domain.' },
                                { title: 'EX-Monarch', minLevel: 100, desc: 'The ultimate level 100 supreme peak of power.' },
                            ];

                            const nextRank = TITLE_RANKS.find(r => r.minLevel > currentLevel);
                            const currentRank = [...TITLE_RANKS].reverse().find(r => r.minLevel <= currentLevel) || TITLE_RANKS[0];
                            const isLeaderUser = profile?.role === 'leader' || profile?.role === 'admin' || profile?.admin_title === 'Shadow' || profile?.title === 'Shadow' || (typeof window !== 'undefined' && user?.id === profile?.id);
                            const isSpecialTitle = isLeaderUser || (typeof profile?.admin_title === 'string' && profile.admin_title.trim().length > 0);

                            return (
                                <div className="space-y-8">
                                    {/* 1. TITLE PROGRESSION & VISIBILITY SECTION */}
                                    <div className="bg-gradient-to-br from-purple-950/20 via-zinc-900/60 to-black p-5 sm:p-6 rounded-3xl border border-purple-500/20 shadow-2xl backdrop-blur-xl">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Award size={18} className="text-purple-400" />
                                                    <h3 className="text-base sm:text-lg font-black text-white">Title Progression & Rank</h3>
                                                </div>
                                                <p className="text-xs text-zinc-400">
                                                    Titles automatically upgrade as your level rises through participation.
                                                </p>
                                            </div>

                                            {/* Show / Hide Title Toggle Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleShowTitle(!showTitleState)}
                                                className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md ${
                                                    showTitleState 
                                                        ? 'bg-purple-900/40 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                                        : 'bg-zinc-800/80 border-white/10 text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {showTitleState ? <Eye size={14} className="text-purple-400" /> : <EyeOff size={14} />}
                                                <span>{showTitleState ? 'Title Visible' : 'Title Hidden'}</span>
                                            </button>
                                        </div>

                                        {/* Current & Next Title Banner */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {/* Current Title */}
                                            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Equipped Title</span>
                                                    {isLeaderUser ? (
                                                        <span className="text-[9px] font-extrabold text-amber-300 bg-amber-950/80 border border-amber-500/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                                                            👑 You're the Leader
                                                        </span>
                                                    ) : isSpecialTitle ? (
                                                        <span className="text-[9px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Zap size={10} /> Leader Assigned
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-zinc-400">Level {currentLevel}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <UserTitleBadge user={profile} variant="bracket" className="text-lg font-black" />
                                                </div>
                                            </div>

                                            {/* Next Target Title Progress */}
                                            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Next Title Rank Target</span>
                                                    {nextRank ? (
                                                        <span className="text-[10px] font-extrabold text-purple-400">Lv.{nextRank.minLevel}</span>
                                                    ) : (
                                                        <span className="text-[10px] font-extrabold text-amber-400">MAX RANK</span>
                                                    )}
                                                </div>
                                                {nextRank ? (
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
                                                            <span>[{nextRank.title}]</span>
                                                            <span className="text-zinc-400 text-[11px]">{currentLevel} / {nextRank.minLevel} Levels</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                                                                style={{ width: `${Math.min((currentLevel / nextRank.minLevel) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-bold text-amber-300">You have reached the highest rank tier!</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rank Titles Directory */}
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Rank Progression Track</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {TITLE_RANKS.map((r) => {
                                                const unlocked = currentLevel >= r.minLevel;
                                                const isCurrent = currentRank.title === r.title && !isSpecialTitle;
                                                return (
                                                    <div 
                                                        key={r.title}
                                                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                                                            isCurrent ? 'border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                                                            unlocked ? 'border-white/10 bg-zinc-900/40' :
                                                            'border-white/5 bg-zinc-900/10 opacity-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className={`text-xs font-black tracking-wide ${unlocked ? 'text-white' : 'text-zinc-500'}`}>
                                                                [{r.title}]
                                                            </span>
                                                            {isCurrent ? (
                                                                <span className="text-[9px] font-bold text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded">ACTIVE</span>
                                                            ) : unlocked ? (
                                                                <CheckCircle size={12} className="text-emerald-400" />
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-zinc-500">Lv.{r.minLevel}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-zinc-400 leading-tight">{r.desc}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 2. AVATAR FRAMES GALLERY */}
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles size={16} className="text-amber-400" />
                                            <h3 className="text-base font-bold text-white">Avatar Frames Gallery</h3>
                                        </div>
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
                                                        {!unlocked && <div className="absolute top-2 right-2 z-50"><Lock size={10} className="text-zinc-500" /></div>}
                                                        {isActive && <div className="absolute top-2 right-2 z-50"><CheckCircle size={12} className="text-primary-400" /></div>}
                                                        <div className="w-16 h-16 flex items-center justify-center">
                                                            <FantasyFrame frameId={frame.id} showLevelTag={false} size={50}>
                                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center rounded-full overflow-hidden">
                                                                    <img 
                                                                        src={profile?.avatar_url || (profile as any)?.avatar || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg'} 
                                                                        alt="" 
                                                                        className="w-full h-full object-cover rounded-full" 
                                                                    />
                                                                </div>
                                                            </FantasyFrame>
                                                        </div>
                                                        <div className="text-center relative z-50">
                                                            <p className="text-xs font-bold text-white">{frame.name}</p>
                                                            <p className="text-[9px] text-zinc-500 mt-0.5">{unlocked ? frame.description : `Unlocks at Lv.${frame.minLevel}`}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
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

            {/* AVATAR UPLOAD MODAL (Antigravity Redesign) */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="bg-[#0a0a12]/90 backdrop-blur-3xl border border-white/15 text-white max-w-[420px] rounded-[32px] p-0 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] top-[50%] -translate-y-[50%]" aria-describedby={undefined}>
                    {/* Header with background blur gradient */}
                    <div className="relative px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <Camera className="text-purple-400" size={18} /> Update Profile Avatar
                            </h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Customize your adventuring persona</p>
                        </div>
                    </div>

                    {/* Current Avatar Mini Preview */}
                    <div className="px-6 py-3.5 flex items-center gap-4 bg-white/[0.02] border-b border-white/5">
                        <div className="relative shrink-0">
                            <ProfileAvatar profile={{...profile, frame_id: activeFrame || profile?.frame_id}} className="w-12 h-12" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Identity</p>
                            <p className="text-sm font-bold text-white truncate">{profile?.username || 'Traveller'}</p>
                        </div>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="p-5 space-y-3">
                        {/* Option 1: Avatar Library */}
                        <button 
                            onClick={() => { setShowAvatarModal(false); setAvatarLibraryModalOpen(true); }}
                            className="group w-full p-3.5 bg-white/[0.04] hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/40 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <LayoutGrid size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Choose from Avatar Library</h4>
                                    <p className="text-xs text-zinc-400">Explore 500+ anime characters</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Option 2: Upload Custom Photo */}
                        <button 
                            onClick={() => avatarInputRef.current?.click()} 
                            className="group w-full p-3.5 bg-white/[0.04] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Upload Custom Photo</h4>
                                    <p className="text-xs text-zinc-400">PNG, JPG, WEBP from your device</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-500 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Option 3: Reposition & Resize Photo */}
                        <button 
                            onClick={() => {
                                const currentSrc = profile?.avatar_url || profile?.avatar || travellerAvatar || (typeof window !== 'undefined' ? localStorage.getItem('shadow_traveller_avatar') : null) || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
                                setPendingAvatarSrc(currentSrc);
                                setShowAvatarModal(false);
                                setCropperModalOpen(true);
                            }} 
                            className="group w-full p-3.5 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Crop size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Reposition & Resize Photo</h4>
                                    <p className="text-xs text-zinc-400">Zoom, drag & align in frame</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Option 4: Remove Current Photo */}
                        {profile?.avatar_url && (
                            <button 
                                onClick={async () => { if(!user)return; await supabase.from('profiles').update({avatar_url: null}).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} 
                                className="group w-full p-3.5 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md text-left"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Trash2 size={19} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-red-400">Remove Current Photo</h4>
                                        <p className="text-xs text-zinc-500">Reset back to default shadow avatar</p>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                    <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleImgBBUpload} />
                </DialogContent>
            </Dialog>

            {/* AVATAR SELECTOR LIBRARY MODAL FOR LOGGED IN USER */}
            <AvatarSelectorModal
                isOpen={avatarLibraryModalOpen}
                onClose={() => setAvatarLibraryModalOpen(false)}
                onSelect={handleSelectAvatarFromLibrary}
                onBack={() => { setAvatarLibraryModalOpen(false); setShowAvatarModal(true); }}
                currentUrl={profile?.avatar_url}
                isGuest={false}
            />

            {/* AVATAR CROPPER & REPOSITIONER MODAL */}
            <AvatarCropperModal
                isOpen={cropperModalOpen}
                imageSrc={pendingAvatarSrc}
                activeFrameId={activeFrame || profile?.frame_id}
                onClose={() => setCropperModalOpen(false)}
                onCropComplete={handleCropComplete}
            />

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
                                    <div className="w-10 h-10">
                                      <ProfileAvatar profile={u} className="w-10 h-10" />
                                    </div>
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
                                    <div className="w-10 h-10">
                                      <ProfileAvatar profile={u} className="w-10 h-10" />
                                    </div>
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

            {/* PRESET COVER GALLERY MODAL */}
            <Dialog open={presetCoverModalOpen} onOpenChange={setPresetCoverModalOpen}>
                <DialogContent className="bg-[#0c0c12] border-white/10 text-white max-w-2xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                            <ImageIcon size={18} className="text-primary-400" /> Choose Preset Cover
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 max-h-[60vh] overflow-y-auto">
                        {PRESET_COVERS.map((preset, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelectPresetCover(preset.url)}
                                className="group relative h-28 rounded-2xl overflow-hidden border border-white/10 hover:border-primary-500/50 cursor-pointer transition-all shadow-lg"
                            >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors">{preset.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
