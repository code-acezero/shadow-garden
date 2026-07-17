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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Camera, Save, Twitter, Instagram, Github, MapPin, Globe, List,
    Users, Image as ImageIcon, Heart, Star, Flame, Settings,
    Trash2, Clock, Upload, CheckCircle, ChevronRight, Check
} from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile'; 

export default function ProfilePage() {
    const { user, profile: rawProfile, refreshSession, isLoading } = useAuth();
    const profile = rawProfile as any;
    const isMobile = useIsMobile();

    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);
    
    const [guestAvatars, setGuestAvatars] = useState<string[]>([]);
    const [showCoverAdjust, setShowCoverAdjust] = useState(false);
    const [tempCoverUrl, setTempCoverUrl] = useState("");
    const [coverPosition, setCoverPosition] = useState(50);

    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [gender, setGender] = useState("male");
    const [location, setLocation] = useState("");
    const [website, setWebsite] = useState("");
    const [twitter, setTwitter] = useState("");
    const [github, setGithub] = useState("");
    const [instagram, setInstagram] = useState("");

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const syncFields = () => {
        if (profile) {
            setFullName(profile.full_name || "");
            setBio(profile.bio || "");
            setGender(profile.gender || "male");
            setLocation(profile.location || "");
            setWebsite(profile.website || "");
            setTwitter(profile.twitter_url || "");
            setGithub(profile.github_url || "");
            setInstagram(profile.instagram_url || "");
            setCoverPosition(profile.banner_pos || 50);
        }
    };

    useEffect(() => { syncFields(); }, [profile]);

    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                const res = await fetch('/api/avatars');
                const data = await res.json();
                setGuestAvatars(data.images || []);
            } catch (err) { console.error(err); }
        };
        fetchAvatars();
    }, []);

    if (!hasMounted || isLoading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!profile) return null;

    const handleUpdateProfile = async () => {
        const payload = { 
            full_name: fullName, bio, gender, location, website, 
            twitter_url: twitter, github_url: github, instagram_url: instagram
        };
        
        if (!user) return setShowAuthModal(true);

        try {
            const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
            if (error) throw error;
            toast.success("Profile updated successfully");
            setIsEditing(false);
            refreshSession();
        } catch (e) { toast.error("Failed to update profile"); }
    };

    const handleCancelEditing = () => {
        syncFields();
        setIsEditing(false);
    };

    const handleImgBBUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (!user) return setShowAuthModal(true);
        const file = e.target.files?.[0];
        if (!file) return;

        const tid = toast.loading(`Uploading ${type}...`);
        try {
            const url = await ImageAPI.uploadImage(file);
            if (type === 'avatar') {
                const newHistory = [url, ...(profile.pfp_history || [])].slice(0, 15);
                await supabase.from('profiles').update({ avatar_url: url, pfp_history: newHistory }).eq('id', user.id);
                toast.success("Avatar updated");
            } else {
                setTempCoverUrl(url);
                setShowCoverAdjust(true);
                setShowCoverModal(false);
            }
            refreshSession();
        } catch (err) { toast.error("Upload failed"); } finally { toast.dismiss(tid); }
    };

    const saveCoverAdjustment = async () => {
        if (!user) return;
        const newHistory = [tempCoverUrl, ...(profile.banner_history || [])].slice(0, 15);
        await supabase.from('profiles').update({ 
            banner_url: tempCoverUrl, banner_pos: coverPosition, banner_history: newHistory 
        }).eq('id', user.id);
        setShowCoverAdjust(false);
        refreshSession();
        toast.success("Cover photo updated");
    };

    const deleteFromHistory = async (urlToDelete: string, field: 'pfp_history' | 'banner_history') => {
        if (!user) return;
        const newHistory = profile[field].filter((url: string) => url !== urlToDelete);
        await supabase.from('profiles').update({ [field]: newHistory }).eq('id', user.id);
        refreshSession();
        toast.info("Image removed from history");
    };

    // Calculate mock stats based on level
    const currentLvl = profile.level || 1;
    const mockAnimeWatched = Math.floor(currentLvl * 3.5);
    const mockEpisodesWatched = Math.floor(currentLvl * 42.8);
    const mockDaysWatched = (mockEpisodesWatched * 24 / 60 / 24).toFixed(1);

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32">
            
            {/* HERO BANNER SECTION */}
            <div className={`relative w-full ${isMobile ? 'h-[200px]' : 'h-[350px]'} bg-[#111] group overflow-hidden`}>
                <AnimatePresence mode='wait'>
                    {profile.banner_url ? (
                        <motion.img 
                            key={profile.banner_url} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            src={profile.banner_url} style={{ objectPosition: `50% ${profile.banner_pos || 50}%` }}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                            <ImageIcon className="text-zinc-700 w-16 h-16" />
                        </div>
                    )}
                </AnimatePresence>
                
                {/* Gradient Overlay for seamless blend */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
                
                {/* Edit Cover Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                    <Button onClick={() => setShowCoverModal(true)} className="bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full px-6 py-2 border border-white/10 text-white font-bold transition-all flex items-center gap-2 shadow-xl">
                        <Camera size={18}/> 
                        <span>Edit Cover</span>
                    </Button>
                </div>
            </div>

            {/* PROFILE HEADER CONTENT */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-30 -mt-16 md:-mt-24">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    
                    {/* AVATAR */}
                    <div className="relative group shrink-0 mx-auto md:mx-0">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full p-1.5 bg-[#050505] overflow-hidden relative z-10 shadow-2xl">
                            <Avatar className="w-full h-full rounded-full border-2 border-white/10 bg-zinc-900">
                                <AvatarImage src={profile.avatar_url} className="object-cover" />
                                <AvatarFallback><ShadowAvatar gender={gender}/></AvatarFallback>
                            </Avatar>
                        </div>
                        <div onClick={() => setShowAvatarModal(true)} className="absolute inset-1.5 bg-black/60 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center backdrop-blur-sm">
                            <Camera className="text-white" size={32} />
                        </div>
                        {/* Level Badge on Avatar */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-[#050505] z-30 whitespace-nowrap">
                            Level {profile.level || 1}
                        </div>
                    </div>

                    {/* USER INFO */}
                    <div className="flex-1 w-full pt-2 md:pt-24 text-center md:text-left flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black text-white">{profile.full_name || profile.username}</h1>
                            <p className="text-zinc-400 text-sm md:text-base mt-1 font-medium">@{profile.username}</p>
                            
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-4">
                                {profile.location && <span className="flex items-center gap-1.5 text-xs text-zinc-400"><MapPin size={14}/> {profile.location}</span>}
                                {profile.website && <span className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-primary-400 transition-colors cursor-pointer" onClick={()=>window.open(profile.website)}><Globe size={14}/> {new URL(profile.website).hostname.replace('www.','')}</span>}
                                {profile.twitter_url && <button onClick={() => window.open(profile.twitter_url)} className="text-zinc-400 hover:text-blue-400 transition-colors"><Twitter size={16}/></button>}
                                {profile.instagram_url && <button onClick={() => window.open(profile.instagram_url)} className="text-zinc-400 hover:text-pink-400 transition-colors"><Instagram size={16}/></button>}
                                {profile.github_url && <button onClick={() => window.open(profile.github_url)} className="text-zinc-400 hover:text-white transition-colors"><Github size={16}/></button>}
                            </div>
                        </div>

                        {/* Rank / Badges */}
                        <div className="flex flex-col items-center md:items-end gap-2">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Rank</span>
                            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-600/20 to-transparent border border-primary-500/30 text-primary-400 text-sm font-bold shadow-lg shadow-primary-600/10">
                                {profile.rank || 'Beginner'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABS NAVIGATION */}
                <Tabs defaultValue="overview" className="mt-12 w-full">
                    <TabsList className="bg-transparent border-b border-white/10 w-full justify-start h-auto p-0 rounded-none overflow-x-auto flex-nowrap scrollbar-hide">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-white rounded-none px-6 py-4 text-sm font-bold text-zinc-500 hover:text-zinc-300">Overview</TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-white rounded-none px-6 py-4 text-sm font-bold text-zinc-500 hover:text-zinc-300">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-8 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* LEFT COLUMN: ABOUT & STATS */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* About Box */}
                                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
                                    <h3 className="font-bold text-white mb-4">About</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                                        {profile.bio || "This user hasn't written a bio yet."}
                                    </p>
                                </div>

                                {/* Stats Box */}
                                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
                                    <h3 className="font-bold text-white mb-4">Anime Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-zinc-400"><Heart size={16} className="text-pink-500"/> Watched</span>
                                            <span className="font-bold text-white">{mockAnimeWatched}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-zinc-400"><List size={16} className="text-blue-500"/> Episodes</span>
                                            <span className="font-bold text-white">{mockEpisodesWatched}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-zinc-400"><Clock size={16} className="text-green-500"/> Days</span>
                                            <span className="font-bold text-white">{mockDaysWatched}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-zinc-400"><Star size={16} className="text-yellow-500"/> Mean Score</span>
                                            <span className="font-bold text-white">{(Math.random() * (9.5 - 7.5) + 7.5).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Level Progress */}
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Level {profile.level || 1}</span>
                                            <span className="text-xs font-bold text-primary-500">{(profile.level || 1) * 10}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                                            <div style={{ width: `${(profile.level || 1) * 10}%` }} className="h-full bg-primary-600 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: RECENT ACTIVITY */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl min-h-[400px]">
                                    <h3 className="font-bold text-white mb-6">Recent Activity</h3>
                                    
                                    {/* Empty State for Activity */}
                                    <div className="flex flex-col items-center justify-center h-[300px] text-zinc-500">
                                        <Flame size={48} className="mb-4 text-zinc-700" />
                                        <p className="font-medium text-zinc-400 text-center">No recent activity found.</p>
                                        <p className="text-sm mt-1 text-center">Start watching anime to see your history here.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-8 outline-none">
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-10 shadow-xl max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Profile Settings</h2>
                                    <p className="text-sm text-zinc-400 mt-1">Update your personal information and social links.</p>
                                </div>
                                <div className="flex gap-3">
                                    {isEditing && <Button onClick={handleCancelEditing} variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</Button>}
                                    <Button onClick={isEditing ? handleUpdateProfile : () => setIsEditing(true)} className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 px-6">
                                        {isEditing ? <><Save size={16} className="mr-2"/> Save Changes</> : <><Settings size={16} className="mr-2"/> Edit Profile</>}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-8 pointer-events-auto">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Display Name</label>
                                        <Input disabled={!isEditing} value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black border-white/10 text-white focus:border-primary-500" placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gender</label>
                                        <Select disabled={!isEditing} value={gender} onValueChange={setGender}>
                                            <SelectTrigger className="bg-black border-white/10 text-white"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#111] border-white/10 text-white">
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</label>
                                        <Input disabled={!isEditing} value={location} onChange={(e) => setLocation(e.target.value)} className="bg-black border-white/10 text-white focus:border-primary-500" placeholder="Tokyo, Japan" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Website</label>
                                        <Input disabled={!isEditing} value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-black border-white/10 text-white focus:border-primary-500" placeholder="https://..." />
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">About Me</label>
                                    <Textarea disabled={!isEditing} value={bio} onChange={(e) => setBio(e.target.value)} className="bg-black border-white/10 text-white min-h-[120px] resize-none focus:border-primary-500" placeholder="Write something about yourself..." />
                                </div>

                                {/* Social Links */}
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <h3 className="text-sm font-bold text-white mb-4">Social Profiles</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Twitter size={18} className="text-zinc-400"/></div>
                                            <Input disabled={!isEditing} value={twitter} onChange={(e) => setTwitter(e.target.value)} className="bg-black border-white/10 text-white focus:border-primary-500" placeholder="Twitter URL" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Instagram size={18} className="text-zinc-400"/></div>
                                            <Input disabled={!isEditing} value={instagram} onChange={(e) => setInstagram(e.target.value)} className="bg-black border-white/10 text-white focus:border-primary-500" placeholder="Instagram URL" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Github size={18} className="text-zinc-400"/></div>
                                            <Input disabled={!isEditing} value={github} onChange={(e) => setGithub(e.target.value)} className="bg-black border-white/10 text-white focus:border-primary-500" placeholder="GitHub URL" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* AVATAR GALLERY MODAL */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="bg-[#111] border border-white/10 text-white max-w-4xl w-[95vw] rounded-2xl p-6 md:p-8 shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-bold text-white">Update Avatar</DialogTitle></DialogHeader>
                    <div className="space-y-8 mt-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Default Avatars</h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                                {guestAvatars.map((url, i) => (
                                    <button key={i} onClick={async () => { if (!user) return; await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary-500 transition-all hover:scale-105 active:scale-95 bg-black">
                                        <img src={url} className="w-full h-full object-cover" />
                                        {profile.avatar_url === url && <div className="absolute inset-0 bg-primary-600/40 flex items-center justify-center backdrop-blur-[1px]"><CheckCircle size={24} className="text-white"/></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">Your Uploads</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                                <AnimatePresence>
                                    {profile.pfp_history?.map((url: string) => (
                                        <motion.div key={url} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }} className="relative aspect-square group">
                                            <img onClick={async () => { if (!user) return; await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} src={url} className="w-full h-full object-cover rounded-xl border-2 border-transparent hover:border-primary-500 cursor-pointer transition-all bg-black" />
                                            <button onClick={() => deleteFromHistory(url, 'pfp_history')} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-110 transition-transform shadow-lg"><Trash2 size={14}/></button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div onClick={() => avatarInputRef.current?.click()} className="aspect-square border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all bg-black">
                                    <Upload size={24}/>
                                    <span className="text-[10px] font-bold uppercase">Upload</span>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleImgBBUpload(e, 'avatar')} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* BANNER GALLERY MODAL */}
            <Dialog open={showCoverModal} onOpenChange={setShowCoverModal}>
                <DialogContent className="bg-[#111] border border-white/10 text-white max-w-4xl w-[95vw] rounded-2xl p-6 md:p-8 shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-bold text-white">Update Cover Photo</DialogTitle></DialogHeader>
                    <div className="space-y-8 mt-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">Your Uploads</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                                <AnimatePresence>
                                    {profile.banner_history?.map((url: string) => (
                                        <motion.div key={url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-[21/9] group">
                                            <img onClick={async () => { setTempCoverUrl(url); setShowCoverAdjust(true); setShowCoverModal(false); }} src={url} className="w-full h-full object-cover rounded-xl border-2 border-transparent hover:border-primary-500 cursor-pointer transition-all bg-black" />
                                            <button onClick={() => deleteFromHistory(url, 'banner_history')} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-110 transition-transform shadow-lg"><Trash2 size={14}/></button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div onClick={() => bannerInputRef.current?.click()} className="aspect-[21/9] border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all bg-black">
                                    <Upload size={28}/>
                                    <span className="text-xs font-bold uppercase">Upload New</span>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImgBBUpload(e, 'banner')} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* COVER ADJUST MODAL */}
            <Dialog open={showCoverAdjust} onOpenChange={setShowCoverAdjust}>
                <DialogContent className="bg-[#111] border border-white/10 text-white max-w-4xl w-[95vw] rounded-2xl p-6 shadow-2xl">
                    <DialogHeader><DialogTitle className="text-xl font-bold text-white">Adjust Cover Alignment</DialogTitle></DialogHeader>
                    <div className="space-y-8 mt-4">
                        <div className="relative w-full h-[250px] overflow-hidden rounded-xl border border-white/10">
                            <img src={tempCoverUrl} style={{ objectPosition: `50% ${coverPosition}%` }} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-4 space-y-4">
                            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                <span>Top</span>
                                <span>Bottom</span>
                            </div>
                            <Slider value={[coverPosition]} onValueChange={(val) => setCoverPosition(val[0])} max={100} step={1} className="py-2" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <Button onClick={() => setShowCoverAdjust(false)} variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</Button>
                            <Button onClick={saveCoverAdjustment} className="bg-primary-600 hover:bg-primary-700 text-white">Save Alignment</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
        </div>
    );
}