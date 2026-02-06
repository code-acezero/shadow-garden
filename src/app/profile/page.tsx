"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase'; // ✅ IMPORT SINGLETON
import { ImageAPI } from '@/lib/api'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
    Camera, Save, Edit3, Lock, Upload, Globe, Twitter, Instagram, 
    Github, MapPin, Zap, Shield, Trophy, Users, Image as ImageIcon, 
    Heart, Star, Flame, Sword, Sparkles, Trash2, Send, Wand2, Skull, XCircle,
    Activity, Brain, Crown, Dumbbell, Move, Check
} from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile'; 

export default function ProfilePage() {
    const { user, profile: rawProfile, refreshSession, isLoading } = useAuth(); // Changed refreshProfile to refreshSession
    const profile = rawProfile as any;
    const isMobile = useIsMobile();

    // HYDRATION FIX: Ensure component has mounted on client
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
    const [affinity, setAffinity] = useState("Darkness");

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
            setAffinity(profile.affinity || "Darkness");
            setCoverPosition(profile.banner_pos || 50);
        }
    };

    useEffect(() => { syncFields(); }, [profile]);

    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                // Keep using fetch for external/local APIs if needed, or switch to supabase storage if you have a bucket
                const res = await fetch('/api/avatars');
                const data = await res.json();
                setGuestAvatars(data.images || []);
            } catch (err) { console.error(err); }
        };
        fetchAvatars();
    }, []);

    // Hydration Loading State
    if (!hasMounted || isLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-primary-600 font-[Cinzel] text-xl tracking-widest animate-pulse uppercase italic">
            Synchronizing Guild Record...
        </div>
    );

    if (!profile) return null;

    const handleUpdateProfile = async () => {
        const payload = { 
            full_name: fullName, bio, gender, location, website, 
            twitter_url: twitter, github_url: github, instagram_url: instagram,
            affinity
        };
        
        // Guest Logic Removed/Simplified - If guest needs updating, it should be handled via local storage or specific guest API, 
        // but typically profile pages require auth. Assuming logged in user for Supabase update.
        if (!user) return setShowAuthModal(true);

        try {
            // ✅ Use Shared Client
            const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
            if (error) throw error;
            toast.success("Guild Intel Re-encrypted");
            setIsEditing(false);
            refreshSession();
        } catch (e) { toast.error("Database Link Failure"); }
    };

    const handleCancelEditing = () => {
        syncFields();
        setIsEditing(false);
        toast.info("Ritual Aborted");
    };

    const handleImgBBUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (!user) return setShowAuthModal(true);
        const file = e.target.files?.[0];
        if (!file) return;

        const tid = toast.loading(`Communing with Repository...`);
        try {
            const url = await ImageAPI.uploadImage(file);
            if (type === 'avatar') {
                const newHistory = [url, ...(profile.pfp_history || [])].slice(0, 15);
                await supabase.from('profiles').update({ avatar_url: url, pfp_history: newHistory }).eq('id', user.id);
                toast.success("Vessel Synchronized");
            } else {
                setTempCoverUrl(url);
                setShowCoverAdjust(true);
                setShowCoverModal(false);
            }
            refreshSession();
        } catch (err) { toast.error("Ritual Broken"); } finally { toast.dismiss(tid); }
    };

    const saveCoverAdjustment = async () => {
        if (!user) return;
        const newHistory = [tempCoverUrl, ...(profile.banner_history || [])].slice(0, 15);
        await supabase.from('profiles').update({ 
            banner_url: tempCoverUrl, banner_pos: coverPosition, banner_history: newHistory 
        }).eq('id', user.id);
        setShowCoverAdjust(false);
        refreshSession();
        toast.success("Atmosphere Anchored");
    };

    const deleteFromHistory = async (urlToDelete: string, field: 'pfp_history' | 'banner_history') => {
        if (!user) return;
        const newHistory = profile[field].filter((url: string) => url !== urlToDelete);
        await supabase.from('profiles').update({ [field]: newHistory }).eq('id', user.id);
        refreshSession();
        toast.info("Fragment Erased");
    };

    const currentLvl = profile.level || 1;
    const xpProgress = (currentLvl / 100) * 100;

    return (
        <div className="min-h-screen bg-[#020202] text-white pb-32 overflow-x-hidden selection:bg-primary-600/30 font-sans">
            <style jsx global>{`
                body { overflow: auto !important; padding-right: 0px !important; }
                @keyframes heartbeat-glow {
                    0% { box-shadow: inset 0 0 40px rgba(0,0,0,1), inset 0 0 20px rgba(220,38,38,0.1); }
                    50% { box-shadow: inset 0 0 100px rgba(127,29,29,0.4), inset 0 0 50px rgba(220,38,38,0.3); }
                    100% { box-shadow: inset 0 0 40px rgba(0,0,0,1), inset 0 0 20px rgba(220,38,38,0.1); }
                }
                @keyframes outer-pulse-glow {
                    0% { box-shadow: 0 0 15px rgba(220,38,38,0.3); border-color: rgba(220,38,38,0.4); }
                    50% { box-shadow: 0 0 45px rgba(220,38,38,0.7); border-color: rgba(220,38,38,0.9); }
                    100% { box-shadow: 0 0 15px rgba(220,38,38,0.3); border-color: rgba(220,38,38,0.4); }
                }
                .guild-inner-glow::after {
                    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 15;
                    animation: heartbeat-glow 6s ease-in-out infinite;
                }
                .avatar-pulse-glow { animation: outer-pulse-glow 3s ease-in-out infinite; }
                .glass-ios { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.1); }
                .fantasy-title { font-family: 'Cinzel', serif; text-shadow: 0 0 20px rgba(220, 38, 38, 0.5); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
            `}</style>

            {/* 1. COVER PHOTO */}
            <div className={`group relative w-full ${isMobile ? 'h-[250px]' : 'h-[450px]'} overflow-hidden guild-inner-glow ${!profile.banner_url ? 'bg-[#050505]' : ''}`}>
                <AnimatePresence mode='wait'>
                    {profile.banner_url ? (
                        <motion.img 
                            key={profile.banner_url} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            src={profile.banner_url} style={{ objectPosition: `50% ${profile.banner_pos || 50}%` }}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative"><Skull className="text-primary-900/10 w-20 h-20 animate-pulse" /></div>
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#020202] z-10 pointer-events-none" />
                
                <div className="absolute inset-0 flex items-center justify-center z-[50] opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <Button onClick={() => setShowCoverModal(true)} className="glass-ios hover:bg-primary-600/30 rounded-full px-6 py-4 md:px-10 md:py-8 h-auto transition-all shadow-2xl border border-white/20 active:scale-95 flex flex-col gap-2">
                        <Camera className="text-white drop-shadow-[0_0_8px_rgba(220,38,38,1)]" size={isMobile ? 24 : 32}/> 
                        <span className="font-[Cinzel] font-black text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-white">Modify Atmosphere</span>
                    </Button>
                </div>
            </div>

            <div className={`max-w-7xl mx-auto px-4 md:px-6 relative ${isMobile ? '-mt-20' : '-mt-36'} z-40`}>
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* 2. SIDEBAR */}
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-80 shrink-0">
                        <div className="glass-ios rounded-[40px] md:rounded-[60px] p-6 md:p-8 shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
                            <div className="relative group mx-auto w-40 h-40 md:w-56 md:h-56 mb-6 md:mb-8">
                                <div className="w-full h-full rounded-[40px] md:rounded-[70px] p-1.5 avatar-pulse-glow bg-black border-2 border-primary-600/50 overflow-hidden relative z-10">
                                    <Avatar className="w-full h-full rounded-[36px] md:rounded-[65px] border-4 border-[#020202] bg-black">
                                        <AvatarImage src={profile.avatar_url} className="object-cover" />
                                        <AvatarFallback><ShadowAvatar gender={gender}/></AvatarFallback>
                                    </Avatar>
                                </div>
                                <div onClick={() => setShowAvatarModal(true)} className="absolute inset-0 bg-black/60 rounded-[40px] md:rounded-[70px] z-20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center backdrop-blur-md">
                                    <Sparkles className="text-white drop-shadow-[0_0_15px_white]" size={isMobile ? 30 : 40} />
                                </div>
                            </div>
                            <div className="text-center space-y-3 relative z-10">
                                <h2 className="text-2xl md:text-3xl font-black font-[Cinzel] text-white uppercase tracking-tighter">{profile.full_name || 'Classified'}</h2>
                                <p className="text-primary-500 font-mono text-[9px] md:text-[10px] tracking-[0.4em] font-bold">Node_ID: {profile.username}</p>
                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between items-end px-1">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Level</span>
                                        <span className="text-md md:text-lg font-black font-[Cinzel] text-primary-500">{profile.level || 1} <span className="text-zinc-600 text-[10px]">/ 100</span></span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${((profile.level || 1) / 100) * 100}%` }} className="h-full bg-gradient-to-r from-primary-600 via-primary-500 to-zinc-600" />
                                    </div>
                                </div>
                                <div className="flex justify-center pt-4 md:pt-6"><Badge className="glass-ios text-primary-500 border border-primary-500/30 px-5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{profile.rank}</Badge></div>
                            </div>
                        </div>

                        <div className="mt-4 md:mt-6 glass-ios rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {profile.twitter_url && <button onClick={() => window.open(profile.twitter_url)} className="p-3 md:p-4 bg-white/5 rounded-full hover:bg-blue-500/20 text-white transition-all border border-white/5 flex items-center justify-center"><Twitter size={18}/></button>}
                                {profile.instagram_url && <button onClick={() => window.open(profile.instagram_url)} className="p-3 md:p-4 bg-white/5 rounded-full hover:bg-pink-500/20 text-white transition-all border border-white/5 flex items-center justify-center"><Instagram size={18}/></button>}
                                {profile.github_url && <button onClick={() => window.open(profile.github_url)} className="p-3 md:p-4 bg-white/5 rounded-full hover:bg-zinc-100/10 text-white transition-all border border-white/5 flex items-center justify-center"><Github size={18}/></button>}
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. MAIN CONTENT */}
                    <div className={`flex-1 space-y-8 md:space-y-12 ${isMobile ? 'pt-8' : 'pt-40 md:pt-48'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
                            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white fantasy-title uppercase leading-none italic">Guild Card</h1>
                                <p className="text-primary-900 mt-2 md:mt-4 font-black tracking-[0.4em] md:tracking-[0.6em] uppercase text-[8px] md:text-[10px] flex items-center gap-3"><Shield size={12}/> Identity Database Matrix // CLEAR: SSS</p>
                            </motion.div>
                            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                                {isEditing ? (
                                    <>
                                        <Button onClick={handleCancelEditing} variant="outline" className="flex-1 md:flex-none glass-ios rounded-full px-6 md:px-10 h-12 md:h-14 font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] text-white"><XCircle size={16} className="mr-2"/> Void</Button>
                                        <Button onClick={handleUpdateProfile} className="flex-1 md:flex-none bg-primary-600 hover:bg-primary-700 rounded-full px-6 md:px-10 h-12 md:h-14 font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] shadow-2xl text-white"><Sword size={16} className="mr-2"/> Commit</Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)} className="w-full md:w-auto glass-ios hover:bg-primary-600/20 rounded-full px-12 h-12 md:h-14 font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all group text-white shadow-2xl"><Wand2 size={18} className="mr-2 text-primary-600 group-hover:rotate-12 transition-transform"/> Recalibrate Intel</Button>
                                )}
                            </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-white">
                            {[{ l: 'STR', v: 85, i: Dumbbell, c: 'text-primary-500' }, { l: 'AGI', v: 92, i: Move, c: 'text-green-500' }, { l: 'INT', v: 78, i: Brain, c: 'text-blue-500' }, { l: 'LUK', v: 64, i: Crown, c: 'text-yellow-500' }].map((stat) => (
                                <div key={stat.l} className="glass-ios rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-1 md:gap-2 border border-white/5 hover:bg-white/[0.08] transition-all">
                                    <stat.i size={isMobile ? 16 : 20} className={`${stat.c} opacity-80`} />
                                    <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.l}</span>
                                    <span className="text-lg md:text-xl font-black font-[Cinzel]">{stat.v}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="glass-ios rounded-[30px] md:rounded-[50px] p-6 md:p-10 space-y-6 md:space-y-8 border border-white/10 shadow-2xl">
                                <h3 className="font-black uppercase tracking-widest text-[12px] md:text-sm text-white font-[Cinzel] flex items-center gap-4"><Skull size={24} className="text-primary-500"/> Physical Vessel</h3>
                                <div className="space-y-4 md:space-y-6">
                                    <Input disabled={!isEditing} value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black/60 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold focus:ring-red-600" placeholder="Archive Name" />
                                    <Select disabled={!isEditing} value={gender} onValueChange={setGender}>
                                        <SelectTrigger className="bg-black/60 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl font-bold text-white text-xs md:text-sm uppercase"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl text-white"><SelectItem value="male">Male Agent</SelectItem><SelectItem value="female">Female Agent</SelectItem></SelectContent>
                                    </Select>
                                    <Input disabled={!isEditing} value={affinity} onChange={(e) => setAffinity(e.target.value)} className="bg-black/60 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold focus:ring-red-600" placeholder="Elemental Affinity" />
                                </div>
                            </div>
                            <div className="glass-ios rounded-[30px] md:rounded-[50px] p-6 md:p-10 space-y-6 md:space-y-8 border border-white/10 shadow-2xl">
                                <h3 className="font-black uppercase tracking-widest text-[12px] md:text-sm text-white font-[Cinzel] flex items-center gap-4"><Send size={24} className="text-blue-500"/> Connectivity</h3>
                                <div className="space-y-4 md:space-y-5">
                                    <Input disabled={!isEditing} value={location} onChange={(e) => setLocation(e.target.value)} className="bg-black/60 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold" placeholder="Deployment Zone" />
                                    <Input disabled={!isEditing} value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-black/60 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold" placeholder="Personal Nexus" />
                                </div>
                            </div>
                        </div>

                        <div className="glass-ios rounded-[30px] md:rounded-[50px] p-8 md:p-12 border-primary-900/10 shadow-2xl relative overflow-hidden">
                            <label className="text-[9px] md:text-[10px] font-black text-primary-900 uppercase tracking-[0.5em] md:tracking-[0.8em] mb-6 md:mb-10 block text-center">Neural Autobiography</label>
                            <Textarea disabled={!isEditing} value={bio} onChange={(e) => setBio(e.target.value)} className="bg-transparent border-none text-xl md:text-2xl font-medium text-white text-center resize-none min-h-[250px] md:min-h-[300px] focus:ring-0 italic font-[Cinzel] custom-scrollbar" placeholder="Establish your legend..." />
                        </div>
                    </div>
                </div>
            </div>

            {/* IDENTITY CUSTOMIZER (PFP) */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="bg-black/95 backdrop-blur-3xl border-white/10 text-white max-w-4xl w-[95vw] rounded-[40px] md:rounded-[60px] p-6 md:p-12 shadow-[0_0_150px_rgba(220,38,38,0.3)] custom-scrollbar overflow-y-auto max-h-[90vh]">
                    <DialogHeader><DialogTitle className="font-[Cinzel] text-3xl md:text-5xl font-black text-center text-primary-600 uppercase tracking-[0.3em]">Identity_Gallery</DialogTitle></DialogHeader>
                    <div className="space-y-12 md:space-y-16 mt-8 md:mt-12">
                        <div className="space-y-6 md:space-y-8">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.6em] flex items-center justify-center gap-4"><Users size={16}/> Standard Issue</h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 md:gap-4">
                                {guestAvatars.map((url, i) => (
                                    <button key={i} onClick={async () => { if (!user) return; await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} className="relative aspect-square rounded-[20px] md:rounded-[25px] overflow-hidden border-2 border-transparent hover:border-primary-600 transition-all hover:scale-110 active:scale-95 shadow-lg">
                                        <img src={url} className="w-full h-full object-cover" />
                                        {profile.avatar_url === url && <div className="absolute inset-0 bg-primary-600/40 flex items-center justify-center backdrop-blur-[1px]"><Check size={20}/></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6 md:space-y-8 pt-10 border-t border-white/5">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.6em] flex items-center justify-center gap-4"><Activity size={16}/> Memory Fragments</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 md:gap-8">
                                <AnimatePresence>
                                    {profile.pfp_history?.map((url: string) => (
                                        <motion.div key={url} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }} className="relative aspect-square group">
                                            <img onClick={async () => { if (!user) return; await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} src={url} className="w-full h-full object-cover rounded-[20px] md:rounded-[35px] border-2 border-transparent hover:border-primary-600 cursor-pointer transition-all shadow-lg" />
                                            <button onClick={() => deleteFromHistory(url, 'pfp_history')} className="absolute -top-2 -right-2 bg-primary-600 p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-110 transition-transform"><Trash2 size={12}/></button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div onClick={() => avatarInputRef.current?.click()} className="aspect-square border-2 border-dashed border-primary-900/20 rounded-[20px] md:rounded-[35px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary-600/10 hover:border-primary-600 text-white active:scale-95 group transition-all">
                                    <Upload size={isMobile ? 24 : 32}/><span className="text-[7px] font-black uppercase text-center tracking-tighter">Inject Essence</span>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleImgBBUpload(e, 'avatar')} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* ATMOSPHERE VAULT (Banners) */}
            <Dialog open={showCoverModal} onOpenChange={setShowCoverModal}>
                <DialogContent className="bg-black/95 backdrop-blur-3xl border-white/10 text-white max-w-4xl w-[95vw] rounded-[40px] md:rounded-[60px] p-6 md:p-12 shadow-[0_0_150px_rgba(220,38,38,0.3)] custom-scrollbar overflow-y-auto max-h-[90vh]">
                    <DialogHeader><DialogTitle className="font-[Cinzel] text-3xl md:text-5xl font-black text-center text-zinc-400 uppercase tracking-[0.3em]">Atmosphere_Vault</DialogTitle></DialogHeader>
                    <div className="space-y-12 md:space-y-16 mt-8 md:mt-12">
                        <div className="space-y-6 md:space-y-8">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.6em] flex items-center justify-center gap-4"><ImageIcon size={16}/> Memory Fragments</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                <AnimatePresence>
                                    {profile.banner_history?.map((url: string) => (
                                        <motion.div key={url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-video group">
                                            <img onClick={async () => { setTempCoverUrl(url); setShowCoverAdjust(true); setShowCoverModal(false); }} src={url} className="w-full h-full object-cover rounded-[20px] md:rounded-[30px] border-2 border-transparent hover:border-primary-600 cursor-pointer transition-all shadow-xl" />
                                            <button onClick={() => deleteFromHistory(url, 'banner_history')} className="absolute -top-2 -right-2 bg-primary-600 p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-110 transition-transform"><Trash2 size={12}/></button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div onClick={() => bannerInputRef.current?.click()} className="aspect-video border-2 border-dashed border-zinc-800 rounded-[20px] md:rounded-[30px] flex flex-col items-center justify-center cursor-pointer hover:bg-primary-600/10 hover:border-primary-600 text-white active:scale-95 group transition-all">
                                    <Upload size={32}/><span className="text-[9px] font-black uppercase tracking-widest mt-2">New Atmosphere</span>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImgBBUpload(e, 'banner')} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* COVER RITUAL ADJUSTER */}
            <Dialog open={showCoverAdjust} onOpenChange={setShowCoverAdjust}>
                <DialogContent className="bg-black/95 border-primary-900/20 text-white max-w-4xl w-[95vw] rounded-[40px] md:rounded-[50px] p-6 md:p-10 shadow-[0_0_100px_rgba(220,38,38,0.3)]">
                    <DialogHeader><DialogTitle className="font-[Cinzel] text-xl md:text-2xl font-black text-center text-primary-600 tracking-widest uppercase">Atmosphere Ritual: Alignment</DialogTitle></DialogHeader>
                    <div className="space-y-8 md:space-y-10 mt-6">
                        <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden rounded-[30px] md:rounded-[40px] border-2 border-white/10 shadow-2xl">
                            <img src={tempCoverUrl} style={{ objectPosition: `50% ${coverPosition}%` }} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-primary-600/30 h-10 pointer-events-none flex items-center justify-center"><Move className="text-primary-600 animate-pulse" size={24}/></div>
                        </div>
                        <div className="px-4 md:px-10 space-y-4">
                            <div className="flex justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500"><span>Lower Orbit</span><span>Upper Orbit</span></div>
                            <Slider value={[coverPosition]} onValueChange={(val) => setCoverPosition(val[0])} max={100} step={1} className="py-4" />
                        </div>
                        <div className="flex justify-center gap-3 md:gap-4">
                            <Button onClick={() => setShowCoverAdjust(false)} variant="outline" className="flex-1 md:flex-none rounded-full px-8 md:px-10 glass-ios text-[10px] font-black uppercase tracking-widest h-12 md:h-14 text-white">Abort</Button>
                            <Button onClick={saveCoverAdjustment} className="flex-1 md:flex-none rounded-full px-8 md:px-12 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest h-12 md:h-14 shadow-lg shadow-primary-900/40 text-white"><Check size={18} className="mr-2"/> Anchor Alignment</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
        </div>
    );
}