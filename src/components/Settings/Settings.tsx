"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User, Play, Monitor, Shield, Database,
  Trash2, LogOut, Server, Palette, 
  Bell, Lock, Eye, Download, FileJson,
  AlertTriangle, Layers, Type, Speaker, Fingerprint,
  HardDrive, Mail, Key, Crown, RefreshCw,
  SkipForward, FastForward, ChevronDown, Check, X,
  Volume2, Settings as SettingsIcon,
  LayoutTemplate, Brush, Sun, Moon, Sparkles, Sidebar,
  Mic2, Radio, Menu, ArrowLeft, ChevronRight, Zap,
  Globe, Pause, PanelLeftClose, PanelLeftOpen, AudioWaveform, Upload, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import AnimePlayer from '@/components/Player/AnimePlayer';
import Footer from '@/components/Anime/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { refreshVoiceCache, getVoiceSettings } from '@/lib/voice';
import AvatarSelectorModal, { getRandomAvatar } from '@/components/User/AvatarSelectorModal';

// --- CONSTANTS ---
const THEME_COLORS = [
  { id: 'red', hex: '#dc2626', label: 'Crimson' }, { id: 'rose', hex: '#e11d48', label: 'Rose' },
  { id: 'orange', hex: '#ea580c', label: 'Sunset' }, { id: 'gold', hex: '#d97706', label: 'Gold' },
  { id: 'lime', hex: '#84cc16', label: 'Lime' }, { id: 'green', hex: '#16a34a', label: 'Emerald' },
  { id: 'teal', hex: '#0d9488', label: 'Teal' }, { id: 'cyan', hex: '#0891b2', label: 'Neon' },
  { id: 'blue', hex: '#2563eb', label: 'Royal' }, { id: 'indigo', hex: '#4f46e5', label: 'Indigo' },
  { id: 'violet', hex: '#7c3aed', label: 'Violet' }, { id: 'purple', hex: '#9333ea', label: 'Amethyst' },
  { id: 'pink', hex: '#db2777', label: 'Magenta' }, { id: 'mono', hex: '#52525b', label: 'Mono' },
];

const SUB_STYLES = {
    colors: { White: '#ffffff', Yellow: '#fbbf24', Cyan: '#22d3ee', Red: '#f87171', Green: '#4ade80', Purple: '#c084fc', Black: '#000000' },
    sizes: { Small: '14px', Normal: '20px', Large: '28px', Huge: '36px' },
    backgrounds: { None: 'transparent', Outline: 'text-shadow', Box: 'smart', Blur: 'smart-blur' },
    fonts: { Sans: "'Inter', sans-serif", Serif: "'Merriweather', serif", Mono: "'JetBrains Mono', monospace", Hand: "'BadUnicorn', sans-serif", Anime: "'Monas', sans-serif" }
};

const APP_FONTS: Record<string, string> = {
    hunters: 'var(--font-hunters)', badUnicorn: 'BadUnicorn', demoness: 'Demoness', horrorshow: 'Horrorshow', kareudon: 'Kareudon', monas: 'Monas', nyctophobia: 'Nyctophobia', onePiece: 'One Piece', inter: '"Inter", sans-serif'
};

const MENU_ITEMS = [
  { id: 'general', label: 'Adventurer Card', icon: Fingerprint },
  { id: 'player', label: 'Crystal Ball', icon: Play },
  { id: 'whisper', label: 'Telepathy', icon: Mic2 },
  { id: 'notifications', label: 'Missives', icon: Bell },
  { id: 'data', label: 'Archive', icon: HardDrive },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

// --- HELPER: WHISPER NOTIFICATION ---
const notifyWhisper = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('shadow-whisper', { 
            detail: { id: Date.now(), type, title: "System Settings", message } 
        });
        window.dispatchEvent(event);
    }
};

export default function Settings() {
  const { profile, refreshSession } = useAuth();
  const { settings, updateSetting, resetSettings, storageUsage, clearCache } = useSettings();
  
  const [activeTab, setActiveTab] = useState('general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [passData, setPassData] = useState({ newPass: '', confirmPass: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Profile Identity States
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('male');
  const [website, setWebsite] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  
  const [voices, setVoices] = useState<any[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [subStyle, setSubStyle] = useState({ color: 'White', size: 'Normal', bg: 'Box', font: 'Sans', lift: 'Middle' });
  const [dummySubUrl, setDummySubUrl] = useState('');
  
  const [anilistUsername, setAnilistUsername] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isAuthenticated = !!(profile && profile.id && !profile.is_guest);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setGender(profile.gender || 'male');
      setWebsite(profile.website || '');
    }
  }, [profile]);

  useEffect(() => { setMounted(true); refreshVoiceCache(); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedSidebar = localStorage.getItem('shadow_sidebar_state');
        const savedTab = localStorage.getItem('shadow_settings_tab');
        const savedPlayer = localStorage.getItem('shadow_player_prefs');
        if (savedSidebar !== null) setIsSidebarExpanded(JSON.parse(savedSidebar));
        if (savedTab !== null) setActiveTab(savedTab);
        if (savedPlayer) { try { setSubStyle(JSON.parse(savedPlayer).subStyle); } catch(e){} }
    }
    const blob = new Blob([`WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nScales? I don't see any scales.\n\n00:00:04.500 --> 00:00:08.000\nThe world is changing. We must adapt or die.`], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    setDummySubUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  // ✅ DYNAMIC VOICE FETCHING (Merges DB + Public Folder)
  useEffect(() => {
      if (mounted && activeTab === 'whisper' && !voicesLoaded) {
          const fetchAsync = async () => {
             try {
                 // 1. Fetch DB Voices (User Uploaded)
                 const { data: dbData } = await supabase.from('voice_packs').select('*');
                 
                 // 2. Fetch Public Folder Voices (Scanner API)
                 let staticVoices = [];
                 try {
                     const res = await fetch('/api/system/voices');
                     if (res.ok) {
                         const json = await res.json();
                         staticVoices = json.staticVoices || [];
                     }
                 } catch (e) {
                     console.warn("System voice scanner unreachable:", e);
                 }

                 // 3. Merge & Normalize
                 const allVoices = [...(dbData || []), ...staticVoices].map(v => ({
                     id: v.id || v.name, // Fallback for static files
                     name: v.character || v.name, // Unify name
                     language: v.language || 'en',
                     gender: v.gender || 'Unknown', 
                     preview: v.file_url || v.preview || v.path, // Handle both DB url and file path
                     is_db: !!v.created_at
                 }));

                 // Deduplicate by name + lang
                 // We use a Map to ensure unique Name+Lang keys, preferring DB entries if duplicates exist
                 const uniqueMap = new Map();
                 allVoices.forEach(item => {
                    const key = `${item.name}-${item.language}`;
                    if(!uniqueMap.has(key)) uniqueMap.set(key, item);
                 });
                 
                 setVoices(Array.from(uniqueMap.values()));
                 setVoicesLoaded(true);
             } catch (e) {
                 console.error("Voice fetch failed", e);
             }
          }
          fetchAsync();
      }
  }, [mounted, activeTab, voicesLoaded]);

  // Grouping Logic: Language -> Character Name -> Array of Clips
  const voiceLibrary = useMemo(() => {
      return voices.reduce((acc: Record<string, any>, v: any) => {
          const lang = v.language || 'en';
          if (!acc[lang]) acc[lang] = {};
          
          const charName = v.name || 'Unknown';
          if (!acc[lang][charName]) {
              acc[lang][charName] = {
                  name: charName,
                  gender: v.gender,
                  clips: []
              };
          }
          // Add preview clip
          if (v.preview) acc[lang][charName].clips.push(v.preview);
          
          return acc;
      }, {});
  }, [voices]);

  // Preview Logic with Volume Boost
  const handleVoicePreview = (charName: string, clips: string[]) => {
      if (!clips || clips.length === 0) {
          notifyWhisper("No audio crystals found.", "error");
          return;
      }

      // Pick Random Clip
      const randomUrl = clips[Math.floor(Math.random() * clips.length)];
      
      if (playingVoice === charName) {
          audioRef.current?.pause();
          setPlayingVoice(null);
      } else {
          if (audioRef.current) { 
            audioRef.current.pause(); 
            audioRef.current = null;
          }
          
          const audio = new Audio(randomUrl);
          audio.crossOrigin = "anonymous";
          audioRef.current = audio;

          // VOLUME BOOST LOGIC
          if (settings.volumeBoost) {
              try {
                  if (!audioContextRef.current) {
                      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                      audioContextRef.current = new AudioCtx();
                  }
                  const ctx = audioContextRef.current;
                  if(ctx && ctx.state === 'suspended') ctx.resume();

                  if (ctx) {
                      const source = ctx.createMediaElementSource(audio);
                      const gainNode = ctx.createGain();
                      gainNode.gain.value = 2.0; 
                      source.connect(gainNode);
                      gainNode.connect(ctx.destination);
                  }
              } catch(e) { console.warn("Audio Context Error", e); }
          } else {
              audio.volume = 1.0;
          }

          audio.onended = () => setPlayingVoice(null);
          audio.play().catch(() => notifyWhisper("Audio artifact corrupted.", "error"));
          setPlayingVoice(charName);
      }
  };

  const selectVoicePack = (name: string, lang: string) => {
      const newSettings = { ...getVoiceSettings(), pack: name, language: lang };
      localStorage.setItem('shadow_voice_settings', JSON.stringify(newSettings));
      updateSetting('whisperVoice', name); 
      
      notifyWhisper(`Voice pact formed with ${name}.`, "success");
      
      if (profile) {
          supabase.from('profiles').update({ voice_pack: name }).eq('id', profile.id).then(() => {
              refreshSession();
          });
      }
  };

  const toggleSidebar = () => {
      setIsSidebarExpanded(!isSidebarExpanded);
      localStorage.setItem('shadow_sidebar_state', JSON.stringify(!isSidebarExpanded));
  };

  const changeTab = (id: string) => {
      setActiveTab(id);
      localStorage.setItem('shadow_settings_tab', id);
      setMobileMenuOpen(false);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updatePlayerPref = (key: string, value: any) => {
      const current = JSON.parse(localStorage.getItem('shadow_player_prefs') || '{}');
      const newState = { ...current, subStyle: { ...(current.subStyle || {}), ...value } };
      if (key === 'subStyle') setSubStyle(newState.subStyle);
      localStorage.setItem('shadow_player_prefs', JSON.stringify(newState));
  };

  const handleGlobalAction = (action: string) => {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(action));
  };

  const handleChangePassword = async () => {
      if (!isAuthenticated) return notifyWhisper("Log in required", "error");
      if (passData.newPass !== passData.confirmPass) return notifyWhisper("Mismatch", "error");
      setIsChangingPass(true);
      try {
          await supabase.auth.updateUser({ password: passData.newPass });
          notifyWhisper("Updated", "success");
          setPassData({ newPass: '', confirmPass: '' });
      } catch(e: any) { notifyWhisper(e.message, "error"); }
      finally { setIsChangingPass(false); }
  };

  const handleSaveAccount = async () => {
    if (!profile?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          gender,
          website,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      notifyWhisper('Identity Updated Successfully!', 'success');
      refreshSession();
    } catch (err: any) {
      console.error('Account save error:', err);
      notifyWhisper(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAniListSync = async () => {
    if (!anilistUsername.trim()) {
      notifyWhisper('Enter a valid AniList username', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const query = `
        query ($username: String) {
          MediaListCollection(userName: $username, type: ANIME) {
            lists {
              entries {
                status
                progress
                score
                media {
                  id
                  title { romaji english }
                  coverImage { large }
                }
              }
            }
          }
        }
      `;

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { username: anilistUsername } }),
      });

      const json = await res.json();
      const lists = json?.data?.MediaListCollection?.lists || [];
      let importedCount = 0;

      for (const list of lists) {
        for (const entry of list.entries) {
          const animeId = `anilist-${entry.media.id}`;
          const title = entry.media.title.english || entry.media.title.romaji;
          const image = entry.media.coverImage.large;
          const statusMap: Record<string, string> = {
            CURRENT: 'watching',
            COMPLETED: 'completed',
            PAUSED: 'on_hold',
            DROPPED: 'dropped',
            PLANNING: 'plan_to_watch',
          };

          if (profile && supabase) {
            await supabase.from('watchlist').upsert(
              {
                user_id: profile.id,
                anime_id: animeId,
                anime_title: title,
                anime_image: image,
                status: statusMap[entry.status] || 'watching',
                last_episode_number: entry.progress || 1,
                media_type: 'anime',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id, anime_id' }
            );
            importedCount++;
          }
        }
      }

      notifyWhisper(`Successfully imported ${importedCount} items from AniList!`, 'success');
    } catch (err: any) {
      console.error('AniList Sync Error:', err);
      notifyWhisper('Could not sync AniList profile. Verify username.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportWatchlist = async () => {
    if (!profile || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `shadow_garden_watchlist_${profile.id.slice(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notifyWhisper('Watchlist Vault Exported!', 'success');
    } catch (err) {
      notifyWhisper('Failed to export watchlist', 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !supabase) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const items = JSON.parse(event.target?.result as string);
        if (!Array.isArray(items)) throw new Error('Invalid JSON format');

        let count = 0;
        for (const item of items) {
          if (item.anime_id) {
            await supabase.from('watchlist').upsert(
              {
                user_id: profile.id,
                anime_id: item.anime_id,
                anime_title: item.anime_title || 'Imported Media',
                anime_image: item.anime_image || '',
                status: item.status || 'watching',
                media_type: item.media_type || 'anime',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id, anime_id' }
            );
            count++;
          }
        }
        notifyWhisper(`Successfully imported ${count} backup entries!`, 'success');
      } catch (err) {
        notifyWhisper('Invalid backup file format', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `shadow_config_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    notifyWhisper("Config Exported", "success");
  };

  const currentFont = APP_FONTS[settings.fontFamily || 'hunters'] || 'var(--font-hunters)';

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0f0f0f] shadow-2xl p-8 group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 rounded-full bg-black border-4 border-white/5 flex items-center justify-center overflow-hidden shadow-[0_0_40px_var(--primary-color)]">
                            <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow"} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md font-sans">{profile?.username || "Shadow Agent"}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{profile?.username || "Guest"}</span>
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${profile?.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                                <Crown size={10} /> {profile?.role === 'admin' ? 'Guild Master' : 'Adventurer'}
                            </span>
                            {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                                <Link href="/master" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border bg-primary-600/20 border-primary-500/50 text-primary-400 text-[10px] font-black uppercase tracking-wider hover:bg-primary-600 hover:text-white transition-all">
                                    <ShieldCheck size={12} /> Admin Panel
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isAuthenticated ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Identity & Account Form */}
                    <div className="bg-[#0f0f0f] rounded-[32px] border border-white/5 p-8 shadow-lg">
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <User size={14} className="text-primary"/> Profile Identity
                        </h3>
                        <div className="space-y-6">
                            {/* Avatar Picker & Preview */}
                            <div className="flex items-center gap-6 p-4 bg-black/40 border border-white/5 rounded-2xl">
                                <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={avatarUrl || getRandomAvatar(false)} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setAvatarModalOpen(true)}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider transition-opacity"
                                >
                                    Change
                                </button>
                                </div>
                                <div>
                                <button
                                    onClick={() => setAvatarModalOpen(true)}
                                    className="px-4 py-2 bg-primary-600/20 border border-primary-500/30 text-primary hover:bg-primary-600 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    Browse Library
                                </button>
                                <p className="text-[10px] text-zinc-500 mt-1.5">
                                    Select from 100+ sorted Anime characters
                                </p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Codename</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Shadow Warlord" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Legacy Note (Bio)</label>
                                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="I lurk in the shadows..." rows={3} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Gender</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none appearance-none">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Prefer not to say</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Website / Link</label>
                                        <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none" />
                                    </div>
                                </div>
                                <Button disabled={isSavingProfile} onClick={handleSaveAccount} className="w-full h-12 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-600 shadow-[0_0_15px_var(--primary-color)] transition-all uppercase tracking-widest mt-2">
                                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Verification */}
                    <div className="space-y-6">
                        <div className="bg-[#0f0f0f] rounded-[32px] border border-white/5 p-8 shadow-lg">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Mail size={14} className="text-primary"/> Contact</h3>
                            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                                <span className="text-sm font-mono text-zinc-300">{profile?.email}</span>
                                <div className="flex items-center gap-1 text-[9px] font-black text-green-400 bg-green-900/20 px-2 py-1 rounded-md border border-green-900/30 uppercase tracking-wider"><Check size={10}/> Verified</div>
                            </div>
                        </div>

                        <div className="bg-[#0f0f0f] rounded-[32px] border border-white/5 p-8 shadow-lg">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4"><Lock size={14} className="text-primary"/> Security</h3>
                            <ToggleRow title="Two-Factor Auth" desc="Secure via Authenticator" checked={settings.twoFactor} onChange={(v: boolean) => updateSetting('twoFactor', v)} />
                            <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Change Password</label>
                                <input type="password" placeholder="New Password" value={passData.newPass} onChange={e => setPassData({...passData, newPass: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none" />
                                <input type="password" placeholder="Confirm" value={passData.confirmPass} onChange={e => setPassData({...passData, confirmPass: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none" />
                                <Button disabled={isChangingPass} onClick={handleChangePassword} className="w-full h-10 rounded-xl text-xs font-bold bg-white/5 hover:bg-primary hover:text-white border border-white/5">Update Password</Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-blue-900/20 to-blue-900/5 border border-blue-500/20 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                    <div className="flex gap-6 items-center">
                        <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400"><User size={28} /></div>
                        <div><h4 className="font-bold text-white text-lg">Guest Mode</h4><p className="text-sm text-blue-200/60 mt-1 max-w-sm">Sign in to sync your data.</p></div>
                    </div>
                    <Button onClick={() => window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }))} className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 rounded-xl font-bold shadow-lg">Connect</Button>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-[#0f0f0f] rounded-[32px] border border-white/5 p-8 shadow-lg space-y-6">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Lock size={14} className="text-primary"/> Security</h3>
                    <ToggleRow title="Two-Factor Auth" desc="Secure via Authenticator" checked={settings.twoFactor} onChange={(v: boolean) => updateSetting('twoFactor', v)} />
                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Change Password</label>
                        <input type="password" placeholder="New Password" value={passData.newPass} onChange={e => setPassData({...passData, newPass: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none" />
                        <input type="password" placeholder="Confirm" value={passData.confirmPass} onChange={e => setPassData({...passData, confirmPass: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none" />
                        <Button disabled={isChangingPass} onClick={handleChangePassword} className="w-full h-10 rounded-xl text-xs font-bold bg-white/5 hover:bg-primary hover:text-white border border-white/5">Update</Button>
                    </div>
                </div>
                <div className="bg-[#0f0f0f] rounded-[32px] border border-white/5 p-8 shadow-lg space-y-6 h-fit">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 text-red-500"><AlertTriangle size={14}/> Danger Zone</h3>
                    <div className="space-y-3">
                        <Button variant="outline" onClick={() => handleGlobalAction('shadow-trigger-leave')} className="w-full h-12 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/5 text-zinc-400 font-bold justify-start px-4 text-xs"><LogOut size={14} className="mr-3"/> Disengage Session</Button>
                        <Button variant="destructive" onClick={() => { if(confirm('Are you sure you want to completely erase your account? This cannot be undone.')) { supabase.rpc('delete_user').then(()=>handleGlobalAction('shadow-trigger-leave')) } }} className="w-full h-12 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-bold justify-start px-4 text-xs"><Trash2 size={14} className="mr-3"/> Delete Account Data</Button>
                    </div>
                </div>
            </div>
          </div>
      );

      case 'whisper': return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <SectionHeader title="Telepathy" desc="Configure your AI system voices" font={currentFont} />
            <div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Mic2 size={14} className="text-primary"/> Voice Engine</h3>
                    <ToggleRow title="Enable Telepathy" desc="System Voice Assistant" checked={settings.whisperEnabled} onChange={(v: boolean) => updateSetting('whisperEnabled', v)} />
                </div>
                
                {settings.whisperEnabled && (
                    <>
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                                <Volume2 size={12}/> Output Volume
                            </label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    value={(settings as any).whisperVolume ? (settings as any).whisperVolume * 100 : 100} 
                                    onChange={e => updateSetting('whisperVolume', Number(e.target.value) / 100)} 
                                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary" 
                                />
                                <span className="text-xs font-bold text-zinc-400 w-12 text-right">
                                    {Math.round(((settings as any).whisperVolume || 1) * 100)}%
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Select Voice Agent</h4>
                                <Button size="sm" onClick={() => {
                                    // Hack to unlock audio context in browsers
                                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                                    const ctx = new AudioCtx();
                                    ctx.resume().then(() => notifyWhisper('Audio Engine Unlocked', 'success'));
                                }} className="bg-primary/20 text-primary hover:bg-primary/40 border border-primary/30 h-8 text-[10px] uppercase font-bold rounded-full">Unlock Audio Permissions</Button>
                            </div>
                            
                            <Tabs defaultValue="en" className="w-full">
                                <TabsList className="bg-zinc-900/50 p-1 rounded-full border border-white/5 mb-4 h-auto flex flex-wrap gap-1">
                                    {Object.keys(voiceLibrary).concat(['en']).filter((v,i,a)=>a.indexOf(v)===i).map(lang => (
                                        <TabsTrigger key={lang} value={lang} className="rounded-full px-4 py-2 data-[state=active]:bg-primary text-xs font-bold uppercase">{lang}</TabsTrigger>
                                    ))}
                                </TabsList>
                                
                                {Object.keys(voiceLibrary).map(lang => (
                                    <TabsContent key={lang} value={lang} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.keys(voiceLibrary[lang] || {}).map(char => {
                                            const v = voiceLibrary[lang][char];
                                            const isSelected = settings.whisperVoice === v.name;
                                            return (
                                                <button 
                                                    key={v.name}
                                                    onClick={() => updateSetting('whisperVoice', v.name)}
                                                    className={`p-4 rounded-2xl border transition-all text-left group ${isSelected ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_var(--primary-color)]' : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/10 hover:text-white'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                            <AudioWaveform size={14} />
                                                        </div>
                                                        {isSelected && <CheckCircle size={14} className="text-primary" />}
                                                    </div>
                                                    <h5 className="font-bold text-sm tracking-wide">{v.name}</h5>
                                                    <span className="text-[9px] uppercase tracking-widest opacity-50">{v.gender} • {lang.toUpperCase()}</span>
                                                    
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (v.clips && v.clips[0]) {
                                                                    const audio = new Audio(v.clips[0]);
                                                                    audio.volume = (settings as any).whisperVolume || 1.0;
                                                                    audio.play().catch(err => console.warn(err));
                                                                } else {
                                                                    toast.error("Preview unavailable");
                                                                }
                                                            }}
                                                            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Play size={10} /> Preview
                                                        </button>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </>
                )}
            </div>
          </div>
      );

      case 'player': return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <SectionHeader title="Crystal Ball" desc="Customize your viewing experience" font={currentFont} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 space-y-6 shadow-2xl hover:border-white/10 transition-colors">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Play size={14} className="text-primary"/> Automation</h3>
                    <div className="space-y-3">
                        <ToggleRow title="Auto-Play Next" desc="Start next episode immediately" checked={settings.autoPlay} onChange={(v: boolean) => updateSetting('autoPlay', v)} />
                        <ToggleRow title="Auto-Skip Intro" desc="Skip OP sequences automatically" checked={settings.autoSkipOpEd} onChange={(v: boolean) => updateSetting('autoSkipOpEd', v)} />
                        <ToggleRow title="Resume Playback" desc="Continue from last known position" checked={settings.resumePlayback} onChange={(v: boolean) => updateSetting('resumePlayback', v)} />
                        <ToggleRow title="Volume Boost" desc="Amplify audio output (Experimental)" checked={settings.volumeBoost || false} onChange={(v: boolean) => updateSetting('volumeBoost', v)} />
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 space-y-6 shadow-2xl hover:border-white/10 transition-colors">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Server size={14} className="text-primary"/> Preferences</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectCard icon={Server} label="Server" value={settings.defaultServer} options={['hd-1', 'hd-2', 'mirror-1']} displayOptions={['Portal 1', 'Portal 2', 'Portal 3']} onChange={(v: any) => updateSetting('defaultServer', v)} />
                        <SelectCard icon={Monitor} label="Quality" value={settings.defaultQuality} options={['1080p', '720p', '480p', 'Auto']} onChange={(v: any) => updateSetting('defaultQuality', v)} />
                        <SelectCard icon={Speaker} label="Audio" value={settings.defaultAudio} options={['Japanese', 'English']} onChange={(v: any) => updateSetting('defaultAudio', v)} />
                        <SelectCard icon={Type} label="Subtitles" value={settings.subLanguage} options={['English', 'Spanish', 'None']} onChange={(v: any) => updateSetting('subLanguage', v)} />
                    </div>
                </div>
            </div>
            <div className="space-y-6 pt-8 border-t border-white/5">
                <SectionHeader title="Caption Studio" desc="Visual customization preview" font={currentFont} />
                <div className="relative w-full aspect-video bg-black rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-end group ring-1 ring-white/5">
                    {dummySubUrl && (
                        <AnimePlayer 
                            url="https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" 
                            title="System Preview"
                            poster="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sintel_poster.jpg/800px-Sintel_poster.jpg"
                            autoPlay={false}
                            initialVolume={0.2}
                            startTime={0}
                            subtitles={[{ lang: 'en', label: 'English', url: dummySubUrl, default: true }]}
                        />
                    )}
                </div>
                <div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-8 shadow-lg">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Type size={14} className="text-primary"/> Style Controls</h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Text Color</span>
                            <div className="flex gap-3 flex-wrap">
                                {Object.keys(SUB_STYLES.colors).map((c) => (
                                    <button key={c} onClick={() => updatePlayerPref('subStyle', { color: c })} className={cn("w-10 h-10 rounded-full border-2 transition-all active:scale-90 hover:scale-110 shadow-lg", subStyle.color === c ? "border-white scale-110 shadow-xl" : "border-transparent opacity-50 hover:opacity-100")} style={{background: SUB_STYLES.colors[c as keyof typeof SUB_STYLES.colors]}} />
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Font Size</span>
                                <div className="flex gap-2 bg-black/40 rounded-full p-1.5 border border-white/5">
                                    {Object.keys(SUB_STYLES.sizes).map((s) => (
                                        <button key={s} onClick={() => updatePlayerPref('subStyle', { size: s })} className={cn("flex-1 py-2 rounded-full text-[10px] font-bold transition-all active:scale-95", subStyle.size === s ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Background Style</span>
                                <div className="flex gap-2 bg-black/40 rounded-full p-1.5 border border-white/5">
                                    {Object.keys(SUB_STYLES.backgrounds).map((b) => (
                                        <button key={b} onClick={() => updatePlayerPref('subStyle', { bg: b })} className={cn("flex-1 py-2 rounded-full text-[10px] font-bold transition-all active:scale-95", subStyle.bg === b ? "bg-primary text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}>{b}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Font Family</span>
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                {Object.keys(SUB_STYLES.fonts).map((f) => (
                                    <button key={f} onClick={() => updatePlayerPref('subStyle', { font: f })} className={cn("px-6 py-3 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap min-w-[120px] snap-center hover:scale-105 active:scale-95", subStyle.font === f ? "bg-white text-black border-white shadow-xl" : "bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:border-white/20")} style={{fontFamily: SUB_STYLES.fonts[f as keyof typeof SUB_STYLES.fonts]}}>{f}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      );



      case 'whisper': return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <SectionHeader title="Telepathy" desc="Configure your AI companion voice" font={currentFont} />
            
            {/* STATUS CARD */}
            <div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-8 shadow-lg">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Mic2 size={14} className="text-primary"/> Companion Status</h3>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${settings.whisperEnabled ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_var(--primary-color)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>{settings.whisperEnabled ? 'Online' : 'Offline'}</div>
                </div>
                <ToggleRow title="Enable Whisper Voice" desc="Allow system audio feedback" checked={settings.whisperEnabled} onChange={(v: boolean) => updateSetting('whisperEnabled', v)} />
                <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase ml-1"><span>Voice Volume</span><span>{Math.round((settings.whisperVolume || 0.8) * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.1" value={settings.whisperVolume ?? 0.8} onChange={(e) => updateSetting('whisperVolume', parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition-colors" />
                </div>
            </div>

            {/* VOICE PACKS */}
            <div className="space-y-6">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2"><Radio size={14} className="text-primary"/> Soul Echoes</h3>
                
                <Tabs defaultValue="en" className="w-full">
                    <TabsList className="bg-black/40 p-1 rounded-full border border-white/5 mb-6 h-auto flex flex-wrap gap-1 justify-start">
                        {Object.keys(voiceLibrary).map(lang => (
                            <TabsTrigger key={lang} value={lang} className="rounded-full px-5 py-2 data-[state=active]:bg-primary-600 data-[state=active]:text-white text-xs font-bold uppercase transition-all">
                                {lang === 'en' ? 'English' : lang === 'jp' ? 'Japanese' : lang}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {Object.entries(voiceLibrary).map(([lang, characters]: any) => (
                        <TabsContent key={lang} value={lang} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
                            {Object.values(characters).map((pack: any) => {
                                const currentSettings = getVoiceSettings();
                                const isActive = currentSettings.pack === pack.name;
                                const isPlaying = playingVoice === pack.name;
                                
                                return (
                                    <div 
                                        key={pack.name} 
                                        onClick={() => selectVoicePack(pack.name, lang)}
                                        className={cn(
                                            "relative p-5 rounded-[24px] border-[2px] transition-all cursor-pointer overflow-hidden group hover:scale-[1.02] active:scale-95 flex flex-col justify-between gap-4",
                                            isActive 
                                                ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(220,38,38,0.15)]' 
                                                : 'bg-[#0f0f0f] border-white/5 hover:border-white/20'
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors border",
                                                    isActive ? 'bg-primary text-white border-primary shadow-lg' : 'bg-zinc-900 text-zinc-600 border-white/5 group-hover:border-white/10'
                                                )}>
                                                    {isPlaying ? <AudioWaveform size={18} className="animate-pulse"/> : <Mic2 size={18} />}
                                                </div>
                                                <div>
                                                    <h4 className={cn("text-sm font-bold", isActive ? 'text-white' : 'text-zinc-300')}>{pack.name}</h4>
                                                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{pack.gender || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            {isActive && <div className="bg-primary text-white rounded-full p-1 shadow-lg"><Check size={12} strokeWidth={4} /></div>}
                                        </div>
                                        
                                        <div className="flex gap-2 mt-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className={cn(
                                                    "h-8 flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-white/10 hover:bg-white/10 hover:text-white transition-all",
                                                    isPlaying && "border-primary text-primary"
                                                )}
                                                onClick={(e) => { e.stopPropagation(); handleVoicePreview(pack.name, pack.clips); }}
                                            >
                                                {isPlaying ? <><Pause size={12} className="mr-2"/> Stop</> : <><Play size={12} className="mr-2"/> Preview</>}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
          </div>
      );

      case 'notifications': return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full"><SectionHeader title="Missives" desc="Control incoming signals" font={currentFont} /><div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-lg"><h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Bell size={14} className="text-primary"/> Alert Channels</h3><div className="space-y-3"><ToggleRow title="Push Notifications" desc="Browser alerts for new content" checked={settings.pushNotifs} onChange={(v: boolean) => updateSetting('pushNotifs', v)} /><ToggleRow title="Email Digests" desc="Weekly summary of activity" checked={settings.emailNotifs} onChange={(v: boolean) => updateSetting('emailNotifs', v)} /><ToggleRow title="Episode Alerts" desc="Notify when watchlist items update" checked={settings.newEpAlerts} onChange={(v: boolean) => updateSetting('newEpAlerts', v)} /><ToggleRow title="Guild Activity" desc="Replies and friend requests" checked={settings.communityAlerts} onChange={(v: boolean) => updateSetting('communityAlerts', v)} /><ToggleRow title="System Broadcasts" desc="Important updates from the Guild" checked={settings.systemAlerts} onChange={(v: boolean) => updateSetting('systemAlerts', v)} /></div></div></div>
      );
      case 'data': return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <SectionHeader title="Archive" desc="Manage browser storage" font={currentFont} />
            <div className="grid gap-6 md:grid-cols-3"><div className="bg-[#0f0f0f] p-6 rounded-[30px] border border-white/5 text-center hover:border-white/10 transition-colors cursor-default"><h3 className="text-3xl font-black text-white mb-2 tracking-tighter">{storageUsage}</h3><p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6 font-bold">App Cache</p><Button size="sm" onClick={clearCache} variant="secondary" className="w-full h-10 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 hover:text-white border border-white/5">Purge Data</Button></div><div className="bg-[#0f0f0f] p-6 rounded-[30px] border border-white/5 text-center opacity-60"><h3 className="text-3xl font-black text-white mb-2 tracking-tighter">--</h3><p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6 font-bold">Watchlist DB</p><Button size="sm" disabled variant="secondary" className="w-full h-10 rounded-xl text-xs font-bold bg-white/5 border border-white/5">Coming Soon</Button></div></div>
            <div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-lg"><h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><HardDrive size={14} className="text-primary"/> Backup Protocols</h3><div className="space-y-3"><ToggleRow title="Cloud Sync" desc="Sync settings to profile automatically" checked={settings.autoBackup} onChange={(v: boolean) => updateSetting('autoBackup', v)} /><ToggleRow title="Bandwidth Saver" desc="Limit data usage on cellular networks" checked={settings.bandwidthSaver} onChange={(v: boolean) => updateSetting('bandwidthSaver', v)} /></div></div>
            <div className="flex gap-4">
                <Button onClick={handleExportWatchlist} className="flex-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white outline-none h-12 rounded-2xl font-bold tracking-widest text-xs uppercase transition-all hover:scale-[1.02] active:scale-95"><Download size={16} className="mr-3" /> Export Watchlist Vault</Button>
                <div className="flex-1 relative">
                    <input type="file" accept=".json" onChange={handleImportBackup} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Button className="w-full bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/5 outline-none h-12 rounded-2xl font-bold tracking-widest text-xs uppercase transition-all"><Upload size={16} className="mr-3" /> Import Vault Backup</Button>
                </div>
            </div>
            <div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-lg"><h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 text-red-500"><AlertTriangle size={14}/> Reset Zone</h3><div className="space-y-3"><SettingRow icon={RefreshCw} title="Clear Watch History" desc="Remove all progress markers" action={<Button variant="outline" size="sm" className="h-9 rounded-xl border-white/10 hover:bg-white/10 text-zinc-300 font-bold">Clear</Button>} /><SettingRow icon={Trash2} title="Factory Reset" desc="Reset all settings to default" action={<Button variant="destructive" size="sm" onClick={() => { if(confirm('Reset all settings?')) resetSettings(); }} className="h-9 rounded-xl font-bold">Reset</Button>} /></div></div>
          </div>
        );

      case 'integrations': return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
            <SectionHeader title="Integrations" desc="Sync your progress with external services" font={currentFont} />
            <div className="bg-[#0f0f0f] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-lg">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Globe size={14} className="text-primary"/> AniList</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-black/40 border border-white/5 rounded-[24px]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#02A9FF] rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="font-black text-white text-xl">AL</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">AniList Sync</h4>
                            <p className="text-xs text-zinc-500">Import your AniList watch history into your vault.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1 md:max-w-[300px]">
                        <input
                            type="text"
                            placeholder="AniList Username"
                            value={anilistUsername}
                            onChange={(e) => setAnilistUsername(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                        />
                        <Button 
                            onClick={handleAniListSync}
                            disabled={isSyncing || !anilistUsername.trim()}
                            className="bg-[#02A9FF] hover:bg-[#02A9FF]/80 text-white rounded-xl shadow-[0_0_15px_rgba(2,169,255,0.4)] px-6"
                        >
                            {isSyncing ? 'Syncing...' : 'Sync'}
                        </Button>
                    </div>
                </div>
            </div>
          </div>
      );
      default: return null;
    }
  };

  if (!mounted) return <LoadingSkeleton />;

  return (
    <>
      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; -webkit-tap-highlight-color: transparent; outline: none !important; }
        ::selection { background: rgba(var(--primary-color), 0.3); color: white; }
        button:focus { outline: none !important; box-shadow: none !important; }
      `}</style>

      <div className="lg:hidden fixed top-[60px] left-0 w-full z-40 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-2xl transition-all">
          <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white border border-white/5 mr-2"><ArrowLeft size={18}/></button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-white flex items-center justify-center shadow-[0_0_15px_var(--primary-color)]"><SettingsIcon size={16} className="text-black" /></div>
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-white tracking-widest uppercase" style={{ fontFamily: currentFont }}>Magical Core</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white border border-white/5">{mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>

      <div className="h-12 lg:hidden w-full bg-[#050505]" />

      <div className="w-full bg-[#050505] text-white font-sans flex flex-col overflow-y-auto no-scrollbar" style={{ height: "calc(100dvh - var(--nav-height-top) - var(--nav-height-bottom))" }}>
        <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col lg:flex-row relative z-10 px-0 lg:px-6">
            <motion.div layout initial={false} animate={{ width: isSidebarExpanded ? 280 : 80 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="hidden lg:flex flex-col border border-white/5 bg-zinc-900/50 backdrop-blur-xl rounded-[32px] my-6 mr-6 shrink-0 h-[500px] sticky top-6 overflow-hidden z-30 shadow-2xl">
                <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col justify-between no-scrollbar">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2 h-10">
                            <div className="flex items-center gap-2">
                                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Go Back"><ArrowLeft size={18} /></button>
                                <AnimatePresence mode="wait">{isSidebarExpanded && (<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="overflow-hidden whitespace-nowrap"><h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-white tracking-widest uppercase" style={{ fontFamily: currentFont }}>Magical Core</h1><p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Control Center</p></motion.div>)}</AnimatePresence>
                            </div>
                            <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors ml-auto">{isSidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button>
                        </div>
                        <div className="space-y-2">
                            {MENU_ITEMS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button key={tab.id} onClick={() => changeTab(tab.id)} title={!isSidebarExpanded ? tab.label : ''} className={`w-full flex items-center gap-3 px-3 py-3 rounded-full transition-all duration-300 group relative overflow-hidden outline-none ${isActive ? 'bg-primary text-white shadow-[0_0_20px_var(--primary-color)]' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                                        <div className="flex shrink-0 items-center justify-center w-6"><Icon size={20} className="relative z-10" /></div>
                                        <AnimatePresence>{isSidebarExpanded && (<motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="block font-bold text-sm tracking-wide relative z-10 whitespace-nowrap overflow-hidden">{tab.label}</motion.span>)}</AnimatePresence>
                                        {isActive && <motion.div layoutId="glow" className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <AnimatePresence>{isSidebarExpanded && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="px-4 py-4 border-t border-white/5 text-center whitespace-nowrap overflow-hidden"><p className="text-[10px] text-zinc-600 font-mono">Shadow Garden v0.1.2 (Beta)</p></motion.div>)}</AnimatePresence>
                </div>
            </motion.div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-visible p-4 lg:py-6 lg:px-2 pb-12 w-full">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                        {renderContent()}
                    </motion.div>
                </div>
            </div>
        </div>

        {/* FOOTER - Spans full width of the screen */}
        <div className="w-full mt-auto bg-black/40 border-t border-white/5 py-12 px-6 relative z-10">
            <div className="w-full flex flex-col items-center justify-center space-y-4 opacity-70">
                <div className="flex items-center justify-center gap-3">
                    <img src="/icon.svg" alt="Seal" className="w-8 h-8 opacity-50 filter grayscale" />
                    <span className="font-minomu tracking-[0.3em] uppercase text-sm">Shadow Garden</span>
                </div>
                <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase">System Configured • Secure Connection</p>
            </div>
        </div>


        <AnimatePresence>
            {mobileMenuOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-md pt-20 px-6" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f0f0f] border border-white/10 rounded-[32px] p-4 w-full max-w-xs shadow-2xl space-y-2 flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between w-full px-2 mb-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest" style={{ fontFamily: currentFont }}>Magical Core</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400"><X size={16}/></button>
                        </div>
                        {MENU_ITEMS.map((tab) => (<button key={tab.id} onClick={() => changeTab(tab.id)} className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full border transition-all ${activeTab === tab.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'}`}><tab.icon size={16} /><span className="font-bold text-xs">{tab.label}</span></button>))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AvatarSelectorModal
            isOpen={avatarModalOpen}
            onClose={() => setAvatarModalOpen(false)}
            onSelect={(url) => {
                setAvatarUrl(url);
                setAvatarModalOpen(false);
            }}
        />
      </div>
    </>
  );
}

function SectionHeader({ title, desc, font }: { title: string, desc: string, font?: string }) { return (<div className="mb-8 pb-6 border-b border-white/5 flex flex-col gap-1 w-full"><h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3 uppercase" style={{ fontFamily: font }}><div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_var(--primary-color)]" />{title}</h2><p className="text-xs text-zinc-500 font-bold ml-5 uppercase tracking-widest">{desc}</p></div>); }
function ToggleRow({ title, desc, checked, onChange }: any) { return (<div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group w-full" onClick={() => onChange(!checked)}><div><h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{title}</h4><p className="text-[10px] text-zinc-500 font-medium">{desc}</p></div><div className={`w-14 h-8 flex items-center rounded-full p-1 transition-all duration-500 ${checked ? 'bg-primary shadow-[0_0_20px_var(--primary-color)]' : 'bg-zinc-900 border border-white/10'}`}><motion.div layout className="bg-white w-6 h-6 rounded-full shadow-lg" animate={{ x: checked ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} /></div></div>); }
function LoadingSkeleton() { return (<div className="w-full max-w-[1350px] mx-auto h-screen flex justify-center pt-24 px-8 space-y-8 animate-in fade-in"><div className="w-full max-w-5xl space-y-8"><SectionHeader title="System Identity" desc="Verifying security clearance..." /><div className="w-full h-48 bg-[#0f0f0f] rounded-[32px] animate-pulse border border-white/5" /><div className="grid gap-6 md:grid-cols-2"><div className="h-40 bg-[#0f0f0f] rounded-[32px] animate-pulse border border-white/5" /><div className="h-40 bg-[#0f0f0f] rounded-[32px] animate-pulse border border-white/5" /></div></div></div>); }
function SettingRow({ icon: Icon, title, desc, action }: any) { return (<div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-[24px] hover:border-white/10 transition-colors group w-full"><div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-2xl text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors"><Icon size={18} /></div><div><h4 className="text-sm font-bold text-zinc-200">{title}</h4><p className="text-[10px] text-zinc-500 font-medium">{desc}</p></div></div>{action}</div>); }
function SelectCard({ icon: Icon, label, value, options, onChange, displayOptions }: any) { return (<div className="p-6 bg-black/40 border border-white/5 rounded-[32px] flex flex-col gap-4 hover:border-white/10 transition-colors w-full"><div className="flex items-center gap-3 text-zinc-400 mb-1"><div className="p-2 bg-white/5 rounded-xl text-primary"><Icon size={16} /></div><span className="text-[10px] font-black uppercase tracking-widest">{label}</span></div><div className="flex flex-wrap gap-2">{options.map((opt: string, idx: number) => (<button key={opt} onClick={() => onChange(opt)} className={`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-full border transition-all uppercase whitespace-nowrap outline-none focus:ring-2 focus:ring-primary/50 ${value === opt ? 'bg-primary text-white border-primary shadow-lg' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300 hover:bg-white/10'}`}>{displayOptions ? displayOptions[idx] : opt}</button>))}</div></div>); }