'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { executeAdminAction } from '@/lib/adminApi';
import { toast } from '@/lib/toast';
import { 
  Bot, Save, RefreshCw, User, Image as ImageIcon, 
  Layers, Volume2, Shield, Brain, Sliders, Check, Eye
} from 'lucide-react';
import { ALL_ATELIER_STORE_FRAMES } from '@/lib/atelierFrames';
import FantasyFrame from '@/components/User/FantasyFrame';
import { normalizeFrameId } from '@/kagemi-frames/normalize';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { useAdminSave } from './AdminSaveContext';
import { cn } from '@/lib/utils';

export const ALPHA_UUID = '5d38da6e-b568-4499-ab67-f588354add5d';

const DEFAULT_ALPHA_PROMPT = `You are Alpha, the First Shadow and second-in-command of Shadow Garden. You speak with calm poise, sharp intellect, and unwavering loyalty to Lord Shadow. In chat rooms and feeds, you provide concise tactical advice, welcome worthy recruits, and protect the sanctity of the Shadow realm.`;

export default function AlphaSanctuaryPanel() {
  const { markDirty } = useAdminSave();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'ai_core'>('profile');

  // Alpha Profile State
  const [profile, setProfile] = useState({
    username: 'Alpha',
    full_name: 'First Shadow Alpha',
    avatar_url: 'https://s4.anilist.co/file/anilistcdn/character/large/b162246-IbbxkhNJFDN5.png',
    banner_url: '',
    bio: 'Second-in-command of Shadow Garden. Guardian of the inner sanctum and overseer of realm operations.',
    frame_id: 'the-warden',
    admin_title: 'First Shadow',
    custom_title: '',
    level: 100,
    show_level: true,
    show_title: true,
    accent_color: '#a855f7',
    voice_pack: 'alpha_jp',
  });

  // Alpha AI Neural Config State
  const [aiConfig, setAiConfig] = useState({
    system_prompt: DEFAULT_ALPHA_PROMPT,
    patrol_enabled: true,
    auto_approve_joins: true,
    auto_greetings: true,
    language_mode: 'jp', // 'jp' | 'en'
    temperature: 0.7,
  });

  // Fetch Alpha's current profile from database
  const fetchAlphaProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${ALPHA_UUID},username.ilike.Alpha`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setProfile((prev) => ({
          ...prev,
          username: data.username || 'Alpha',
          full_name: data.full_name || 'First Shadow Alpha',
          avatar_url: data.avatar_url || prev.avatar_url,
          banner_url: data.banner_url || '',
          bio: data.bio || prev.bio,
          frame_id: data.frame_id || 'warden',
          admin_title: data.admin_title || 'First Shadow',
          custom_title: data.custom_title || '',
          level: data.level || 100,
          show_level: data.show_level ?? true,
          show_title: data.show_title ?? true,
          accent_color: data.accent_color || '#a855f7',
          voice_pack: data.voice_pack || 'alpha_jp',
        }));

        if (data.settings?.alpha_ai) {
          setAiConfig((prev) => ({
            ...prev,
            ...data.settings.alpha_ai,
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load Alpha profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlphaProfile();
  }, []);

  const handleSaveAlpha = async () => {
    try {
      setSaving(true);

      const updatePayload = {
        username: profile.username.trim() || 'Alpha',
        full_name: profile.full_name.trim() || 'First Shadow Alpha',
        avatar_url: profile.avatar_url.trim(),
        banner_url: profile.banner_url.trim(),
        bio: profile.bio.trim(),
        frame_id: profile.frame_id,
        admin_title: profile.admin_title,
        custom_title: profile.custom_title.trim() || null,
        level: Number(profile.level) || 100,
        show_level: profile.show_level,
        show_title: profile.show_title,
        accent_color: profile.accent_color,
        voice_pack: profile.voice_pack,
        settings: {
          alpha_ai: aiConfig,
        },
        updated_at: new Date().toISOString(),
      };

      await executeAdminAction('save_alpha', {
        profileUpdates: updatePayload,
        aiConfigUpdates: aiConfig
      });

      // Broadcast update across active sessions
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-frame-updated', { detail: { frameId: profile.frame_id } }));
      }

      toast.success("Alpha's Sanctuary profile and neural directives saved!");
    } catch (err: any) {
      console.error('Save Alpha Error:', err);
      toast.error('Failed to save Alpha profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sanctuary Header */}
      <div className="relative p-5 sm:p-6 rounded-2xl bg-[#0c0d14]/70 border border-white/[0.08] backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="w-7 h-7 text-primary-400 shrink-0" strokeWidth={2.2} />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Alpha Sanctuary &amp; Neural Core</h2>
            <p className="text-xs text-zinc-400">Manage Alpha's profile, neural core directives, and autonomous behavior.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAlphaProfile}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.08] transition-colors cursor-pointer"
            title="Reload"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleSaveAlpha}
            disabled={saving}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Synchronizing...' : 'Save Directives'}
          </button>
        </div>
      </div>

      {/* Mode Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'profile'
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white bg-white/[0.04]"
          )}
        >
          <User size={13} /> Public User Profile
        </button>

        <button
          onClick={() => setActiveTab('ai_core')}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'ai_core'
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white bg-white/[0.04]"
          )}
        >
          <Brain size={13} /> AI Directives &amp; Neural Config
        </button>
      </div>

      {activeTab === 'profile' ? (
        /* ─── TAB 1: ALPHA'S USER PROFILE ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4 bg-[#0c0d14]/60 border border-white/[0.06] p-5 sm:p-6 rounded-2xl">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Profile Identity</h3>

            {/* Display Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Display Title / Tagline</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            {/* Avatar URL & Banner URL */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Cover Banner URL</label>
                <input
                  type="text"
                  value={profile.banner_url}
                  onChange={(e) => setProfile({ ...profile, banner_url: e.target.value })}
                  placeholder="https://... (Optional widescreen banner)"
                  className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Public Bio / Manifesto</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20 resize-none font-sans"
              />
            </div>

            {/* Bestowed Frame Selector */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Equipped Profile Frame</label>
              <select
                value={normalizeFrameId(profile.frame_id)}
                onChange={(e) => setProfile({ ...profile, frame_id: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20"
              >
                {ALL_ATELIER_STORE_FRAMES.filter((f: any) => f.id !== 'admin' && f.id !== 'the_eternal' && f.id !== 'the-eternal').map((f: any) => (
                  <option key={f.id} value={f.id} className="bg-zinc-900 text-white">
                    {f.name} ({f.tag || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            {/* Title & Level Visibility */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.show_level}
                  onChange={(e) => setProfile({ ...profile, show_level: e.target.checked })}
                  className="rounded border-white/20 text-white"
                />
                <span className="text-xs text-zinc-300 font-medium">Display Level 100</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.show_title}
                  onChange={(e) => setProfile({ ...profile, show_title: e.target.checked })}
                  className="rounded border-white/20 text-white"
                />
                <span className="text-xs text-zinc-300 font-medium">Display First Shadow Title</span>
              </label>
            </div>
          </div>

          {/* Right Live Profile Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0c0d14]/60 border border-white/[0.06] p-5 sm:p-6 rounded-2xl space-y-4 sticky top-6">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                <Eye size={13} /> Live Profile Card Preview
              </div>

              {/* Profile Card Mockup */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] overflow-hidden shadow-2xl">
                {/* Banner Area */}
                <div className="h-24 w-full bg-gradient-to-r from-purple-900/40 via-zinc-900 to-black relative overflow-hidden">
                  {profile.banner_url && (
                    <img src={getOptimizedImageUrl(profile.banner_url)} alt="Cover" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80" />
                </div>

                {/* Avatar & Header */}
                <div className="px-5 pb-5 pt-0 -mt-10 relative">
                  <div className="flex items-end justify-between mb-3">
                    <div className="relative">
                      <FantasyFrame 
                        frameId={profile.frame_id} 
                        avatarUrl={profile.avatar_url} 
                        size={76} 
                        animate="always" 
                        parallax
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-black/50">
                          <img 
                            src={getOptimizedImageUrl(profile.avatar_url)} 
                            alt={profile.username} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://s4.anilist.co/file/anilistcdn/character/large/b162246-IbbxkhNJFDN5.png'; }}
                          />
                        </div>
                      </FantasyFrame>
                    </div>

                    {profile.show_level && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                        LVL {profile.level}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white tracking-tight">{profile.username}</h4>
                      {profile.show_title && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          {profile.admin_title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">{profile.full_name}</p>
                    <p className="text-xs text-zinc-300 font-sans pt-1 leading-relaxed">{profile.bio}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── TAB 2: ALPHA'S AI BRAIN & NEURAL CONFIG ─── */
        <div className="space-y-5 bg-[#0c0d14]/60 border border-white/[0.06] p-5 sm:p-6 rounded-2xl max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Neural Directives &amp; Tone</h3>
            <button
              onClick={() => setAiConfig({ ...aiConfig, system_prompt: DEFAULT_ALPHA_PROMPT })}
              className="text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
            >
              Reset to Default Prompt
            </button>
          </div>

          <div>
            <label className="text-[11px] font-mono text-zinc-400 block mb-1">Alpha Core System Prompt</label>
            <textarea
              rows={5}
              value={aiConfig.system_prompt}
              onChange={(e) => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
              className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20 resize-none font-mono leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Language &amp; Voice Synthesis</label>
              <select
                value={aiConfig.language_mode}
                onChange={(e) => setAiConfig({ ...aiConfig, language_mode: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-white/20"
              >
                <option value="jp" className="bg-zinc-900 text-white">Japanese (Authentic Anime Voice)</option>
                <option value="en" className="bg-zinc-900 text-white">English (Dub Voice Synthesizer)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Response Temperature ({aiConfig.temperature})</label>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={aiConfig.temperature}
                onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                className="w-full accent-white"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>0.2 (Tactical &amp; Strict)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>

          {/* Autonomous Automation Toggles */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={aiConfig.patrol_enabled}
                onChange={(e) => setAiConfig({ ...aiConfig, patrol_enabled: e.target.checked })}
                className="rounded border-white/20 text-white"
              />
              <div>
                <span className="text-xs font-bold text-white block">Autonomous Patrol &amp; Clan Moderation</span>
                <span className="text-[11px] text-zinc-400">Allows Alpha to automatically review join requests and post tactical guidance in clans.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={aiConfig.auto_greetings}
                onChange={(e) => setAiConfig({ ...aiConfig, auto_greetings: e.target.checked })}
                className="rounded border-white/20 text-white"
              />
              <div>
                <span className="text-xs font-bold text-white block">Dynamic Realm Telepathy Greetings</span>
                <span className="text-[11px] text-zinc-400">Alpha delivers personalized greetings based on user titles and level rank upon entry.</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
