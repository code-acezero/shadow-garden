"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/api';
import { processImage } from '@/lib/imageUtils'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Save, Edit3, Lock, Upload, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 

export default function ProfilePage() {
    const { user, profile, refreshProfile, updateGuestProfile, isLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    
    // Form State
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [gender, setGender] = useState("male");
    
    const [guestAvatars, setGuestAvatars] = useState<string[]>([]);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Sync profile data to local state
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            setBio(profile.bio || "");
            setGender(profile.gender || "male");
        }
    }, [profile]);

    // Fetch Avatars Safely
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchAvatars = async () => {
            try {
                const res = await fetch('/api/avatars', { signal });
                if (!res.ok) throw new Error("Failed to fetch avatars");
                const data = await res.json();
                if (!signal.aborted) {
                    setGuestAvatars(data.images || []);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return; 
                console.error("Avatar fetch error:", err);
            }
        };

        fetchAvatars();

        return () => {
            controller.abort(); 
        };
    }, []);

    if (isLoading) return <div className="min-h-screen bg-[#050505] p-20 text-center text-red-600 animate-pulse font-black tracking-widest">LOADING...</div>;
    if (!profile) return null; 

    const handleRestrictedAction = () => {
        toast.error("Access Restricted: Agent Login Required");
        setShowAuthModal(true);
    };

    const handleUpdateProfile = async () => {
        // GUEST: Update Local Storage
        if (profile.is_guest) {
            updateGuestProfile({ full_name: fullName, bio, gender }); 
            setIsEditing(false);
            toast.success("Guest identity updated locally.");
            return; 
        }

        // USER: Update Database
        if (!supabase || !user) return;
        
        try {
            const { error } = await supabase.from('profiles').update({ full_name: fullName, bio: bio, gender: gender }).eq('id', user.id);
            if (error) throw error;
            
            toast.success("Identity re-encrypted."); 
            setIsEditing(false); 
            refreshProfile();
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            toast.error("Update failed.");
        }
    };

    const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners') => {
        if (profile.is_guest) return handleRestrictedAction();
        if (!supabase || !user) return;

        const file = event.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading("Encrypting asset...");

        try {
            const processedFile = await processImage(file);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage.from(bucket).upload(fileName, processedFile);
            if (error) throw error;
            
            // Explicitly assert supabase exists here as we checked above, 
            // but for TS safety we can reuse the variable or just rely on the check.
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
            
            const updateData = bucket === 'avatars' ? { avatar_url: publicUrl } : { banner_url: publicUrl };
            const { error: dbError } = await supabase.from('profiles').update(updateData).eq('id', user.id);
            if (dbError) throw dbError;
            
            toast.success("Asset integrated.");
            refreshProfile();
        } catch (error: any) { 
            if (error.name === 'AbortError') return;
            toast.error(error.message || "Upload failed"); 
        } finally { 
            toast.dismiss(toastId); 
        }
    };

    const selectGuestAvatar = (url: string) => {
        updateGuestProfile({ avatar_url: url });
        setShowAvatarModal(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
            {/* BANNER */}
            <div className="relative w-full h-[300px] group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/20 to-[#050505]" />
                {profile.banner_url ? <img src={profile.banner_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 tracking-widest font-bold">NO SIGNAL</div>}
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-black/50 border-white/10 backdrop-blur-md" 
                        onClick={() => profile.is_guest ? handleRestrictedAction() : bannerInputRef.current?.click()}>
                        {profile.is_guest ? <Lock size={14} className="mr-2 text-red-500"/> : <Camera size={14} className="mr-2"/>} Edit Cover
                    </Button>
                    <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleCustomUpload(e, 'banners')} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 relative -mt-24 z-10">
                <div className="flex flex-col md:flex-row gap-8 items-end md:items-start">
                    
                    {/* AVATAR */}
                    <div className="relative group shrink-0">
                        <div className="w-40 h-40 rounded-[40px] p-1 bg-[#050505] shadow-2xl shadow-red-900/20">
                            <Avatar className="w-full h-full rounded-[36px] border-4 border-[#0a0a0a] overflow-hidden bg-black">
                                {profile.avatar_url ? (
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                ) : (
                                    <ShadowAvatar gender={gender} />
                                )}
                                <AvatarFallback className="bg-zinc-800 text-3xl font-black">{profile.username[0]}</AvatarFallback>
                            </Avatar>
                            <div 
                                onClick={() => setShowAvatarModal(true)}
                                className="absolute inset-0 bg-black/60 rounded-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-[#0a0a0a]"
                            >
                                <Camera className="text-white w-8 h-8" />
                            </div>
                        </div>
                        {profile.is_guest && <Badge className="absolute -bottom-3 -right-3 bg-zinc-700 text-xs">GUEST</Badge>}
                    </div>

                    {/* INFO & EDIT FORM */}
                    <div className="flex-1 w-full pt-6 md:pt-24 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                                {isEditing ? (
                                    <div className="flex gap-4">
                                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="text-3xl font-black bg-transparent border-b border-white/20 rounded-none px-0 h-auto mb-2 w-full md:w-1/2" placeholder="Codename" />
                                        
                                        {/* GENDER SELECTOR */}
                                        <Select value={gender} onValueChange={setGender}>
                                            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
                                                <SelectValue placeholder="Gender" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#111] border-white/10 text-white">
                                                <SelectItem value="male">Male Shadow</SelectItem>
                                                <SelectItem value="female">Female Shadow</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <h1 className="text-4xl font-black text-white font-[Cinzel] tracking-tight flex items-center gap-3">
                                        {profile.full_name || profile.username}
                                        {profile.is_guest && <Lock size={20} className="text-zinc-600" />}
                                    </h1>
                                )}
                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    @{profile.username}
                                    <span className="w-1 h-1 bg-zinc-600 rounded-full"/>
                                    <span className="text-red-500">{gender}</span>
                                </p>
                            </div>
                            
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <Button onClick={handleUpdateProfile} className="bg-red-600 hover:bg-red-700 text-white gap-2"><Save size={16} /> Save</Button>
                                ) : (
                                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => setIsEditing(true)}>
                                        <Edit3 size={16} className="mr-2"/> Edit
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* BIO */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative shadow-inner">
                            {isEditing ? (
                                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-transparent border-none text-zinc-300 resize-none min-h-[100px]" placeholder="Write your legend..." />
                            ) : (
                                <p className="text-zinc-400 leading-relaxed text-sm">{profile.bio || "No bio established."}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AVATAR SELECTION MODAL */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-[Cinzel] text-xl font-bold">Select Identification</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* Guest Library */}
                        <div>
                            <h4 className="text-xs uppercase font-bold text-zinc-500 mb-3 tracking-widest">Standard Issue (Free)</h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                {guestAvatars.map((url, i) => (
                                    <button key={i} onClick={() => selectGuestAvatar(url)} className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-red-500 hover:scale-105 transition-all group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        {profile.avatar_url === url && <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-full" /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Upload Section */}
                        <div className="pt-4 border-t border-white/10">
                            <h4 className="text-xs uppercase font-bold text-zinc-500 mb-3 tracking-widest flex items-center gap-2">
                                Custom Upload {profile.is_guest && <Lock size={12} className="text-red-500"/>}
                            </h4>
                            <div 
                                onClick={() => profile.is_guest ? handleRestrictedAction() : avatarInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 hover:border-red-500/30 transition-all text-zinc-500 hover:text-white"
                            >
                                {profile.is_guest ? <Lock size={24} className="text-red-600"/> : <Upload size={24} />}
                                <span className="text-xs font-bold uppercase">{profile.is_guest ? "Login to Upload Custom Image" : "Upload Custom (Max 500px)"}</span>
                            </div>
                            <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleCustomUpload(e, 'avatars')} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
        </div>
    );
}