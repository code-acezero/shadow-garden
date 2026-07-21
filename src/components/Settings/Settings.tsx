"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, Shield, Download, Upload, RefreshCw, LogOut, ArrowLeft,
  X, Check, Lock, Wand2, Database, FileText, Smartphone, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import AvatarSelectorModal, { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';
import Footer from '@/components/Anime/Footer';

const MENU_ITEMS = [
  { id: 'account', label: 'Identity & Account', icon: User },
  { id: 'notifications', label: 'Missives & Alerts', icon: Bell },
  { id: 'anilist', label: 'AniList Sync', icon: RefreshCw },
  { id: 'data', label: 'Vault Export & Import', icon: Database },
];

export default function Settings() {
  const router = useRouter();
  const { user, profile: rawProfile, refreshSession, signOut } = useAuth();
  const profile = rawProfile as any;
  const { settings, updateSetting, isLoaded } = useSettings();

  const [activeTab, setActiveTab] = useState('account');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [anilistUsername, setAnilistUsername] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Save Account Identity Changes
  const handleSaveAccount = async () => {
    if (!user || !supabase) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Account Identity Updated!');
      refreshSession();
    } catch (err: any) {
      console.error('Account save error:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // AniList Import Handler
  const handleAniListSync = async () => {
    if (!anilistUsername.trim()) {
      toast.error('Enter a valid AniList username');
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

          if (user && supabase) {
            await supabase.from('watchlist').upsert(
              {
                user_id: user.id,
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

      toast.success(`Successfully imported ${importedCount} items from AniList!`);
    } catch (err: any) {
      console.error('AniList Sync Error:', err);
      toast.error('Could not sync AniList profile. Verify username.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export Watchlist Data (JSON)
  const handleExportWatchlist = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `shadow_garden_watchlist_${user.id.slice(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Watchlist Vault Exported!');
    } catch (err) {
      toast.error('Failed to export watchlist');
    }
  };

  // Import Watchlist Data (JSON)
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

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
                user_id: user.id,
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
        toast.success(`Successfully imported ${count} backup entries!`);
      } catch (err) {
        toast.error('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const isGuestUser = !user;

  return (
    <>
      <div className="min-h-screen bg-[#050505] text-white flex flex-col pt-20">
        <div className="w-full max-w-[1350px] mx-auto px-4 flex-1 flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className={`shrink-0 transition-all ${isSidebarExpanded ? 'w-full lg:w-64' : 'w-full lg:w-20'}`}>
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-4 sticky top-24 space-y-4">
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft size={18} />
                </button>
                {isSidebarExpanded && (
                  <span className="text-xs font-black uppercase tracking-widest text-primary-500">
                    Vault Core
                  </span>
                )}
                <button
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white hidden lg:block"
                >
                  {isSidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
              </div>

              <div className="space-y-1">
                {MENU_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      {isSidebarExpanded && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 pb-16">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 sm:p-8 min-h-[600px] shadow-2xl">
              {/* TAB 1: IDENTITY & ACCOUNT */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <User className="text-primary-500" /> Identity & Account
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Manage your avatar, codename, and profile identity.</p>
                  </div>

                  {isGuestUser && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 text-yellow-400 text-xs">
                      <Lock size={18} className="shrink-0" />
                      <span>You are browsing as a Guest Traveler. You have access to guest meme avatars. Create a free account to unlock 100+ Anime avatars and sync data!</span>
                    </div>
                  )}

                  {/* Avatar Picker & Preview */}
                  <div className="flex items-center gap-6 p-4 bg-black/40 border border-white/5 rounded-2xl">
                    <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <img src={avatarUrl || getRandomAvatar(isGuestUser)} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setAvatarModalOpen(true)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider transition-opacity"
                      >
                        Change Avatar
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={() => setAvatarModalOpen(true)}
                        className="px-4 py-2 bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Browse Avatar Library
                      </button>
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        {isGuestUser ? 'Guest Mode: Limited to Funny & Meme avatars' : 'Select from 100+ sorted Anime characters'}
                      </p>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Username / Codename</label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Shadow Warlord"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Bio / Legacy Note</label>
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="I lurk in the shadows to serve the light..."
                        rows={3}
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>

                    {!isGuestUser && (
                      <button
                        onClick={handleSaveAccount}
                        disabled={isSaving}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-all"
                      >
                        {isSaving ? 'Saving...' : 'Save Identity Changes'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MISSIVES & ALERTS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Bell className="text-primary-500" /> Missives & Notifications
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Configure live alerts for tracked anime, donghua, drama, and system broadcasts.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-white">Tracked Series Episode Alerts</h4>
                        <p className="text-[10px] text-zinc-500">Receive live notifications when new episodes air for items in your Watchlist.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('newEpAlerts', !settings.newEpAlerts)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.newEpAlerts ? 'bg-primary-600' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.newEpAlerts ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-white">Guild & Clan Activity</h4>
                        <p className="text-[10px] text-zinc-500">Alerts for replies, clan posts, and direct message requests.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('communityAlerts', !settings.communityAlerts)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.communityAlerts ? 'bg-primary-600' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.communityAlerts ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-white">System & Broadcast Alerts</h4>
                        <p className="text-[10px] text-zinc-500">Important system notifications from the Admin Realm.</p>
                      </div>
                      <button
                        onClick={() => updateSetting('systemAlerts', !settings.systemAlerts)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.systemAlerts ? 'bg-primary-600' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.systemAlerts ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANILIST SYNC */}
              {activeTab === 'anilist' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <RefreshCw className="text-primary-500" /> AniList Vault Migration
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Import your complete anime library, scores, and watching progress directly from AniList.</p>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">AniList Username</label>
                      <input
                        type="text"
                        value={anilistUsername}
                        onChange={e => setAnilistUsername(e.target.value)}
                        placeholder="Enter your AniList username..."
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <button
                      onClick={handleAniListSync}
                      disabled={isSyncing}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Migrating Vault...' : 'Sync From AniList'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: VAULT EXPORT & IMPORT */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Database className="text-primary-500" /> Vault Export & Import
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Export your watchlist backup or restore library data from a JSON file.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div>
                        <Download className="text-primary-500 mb-2" size={24} />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Export Watchlist Vault</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Download your full watchlist and progress as a JSON backup file.</p>
                      </div>
                      <button
                        onClick={handleExportWatchlist}
                        className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Download JSON Backup
                      </button>
                    </div>

                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div>
                        <Upload className="text-emerald-500 mb-2" size={24} />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Restore Vault Backup</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Upload a JSON backup file to restore your media library.</p>
                      </div>
                      <label className="w-full py-2.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center cursor-pointer block">
                        Upload Backup File
                        <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Avatar Selection Modal */}
      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelect={url => setAvatarUrl(url)}
        currentUrl={avatarUrl}
        isGuest={isGuestUser}
      />
    </>
  );
}
