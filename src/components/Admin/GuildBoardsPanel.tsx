'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Megaphone, Plus, Sparkles, Layers, Eye, Smartphone, Monitor, 
  Clock, Calendar, Trash2, Edit3, CheckCircle2, XCircle, Link2, 
  Upload, Sliders, Play, X, Shield, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

export interface GuildBoardPopup {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  target_page: string; // 'all' | '/' | '/social' | '/clans' | '/chat' | '/master'
  trigger_type: 'on_load' | 'delay' | 'scroll' | 'exit_intent';
  delay_seconds: number;
  placement: 'center_modal' | 'top_banner' | 'bottom_toast' | 'bottom_right_card';
  width_px: number;
  max_display_count: number;
  duration_seconds?: number;
  is_active: boolean;
  created_at?: string;
}

export default function GuildBoardsPanel() {
  const [popups, setPopups] = useState<GuildBoardPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [editingPopup, setEditingPopup] = useState<Partial<GuildBoardPopup> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Default empty form
  const defaultForm: Partial<GuildBoardPopup> = {
    title: 'Shadow Realm Special Notice',
    subtitle: 'Exclusive Announcement from High Command',
    content: 'Welcome to Shadow Garden! Explore the latest clan tournaments, earn rank badges, and climb the adventurer leaderboards.',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    button_text: 'Explore Now',
    button_url: '/social',
    target_page: 'all',
    trigger_type: 'delay',
    delay_seconds: 2,
    placement: 'center_modal',
    width_px: 480,
    max_display_count: 3,
    duration_seconds: 15,
    is_active: true
  };

  // Form state
  const [form, setForm] = useState<Partial<GuildBoardPopup>>(defaultForm);

  // Fetch popups from localStorage or Supabase
  const fetchPopups = async () => {
    setLoading(true);
    try {
      // 1. Attempt Supabase fetch
      const { data, error } = await supabase.from('guild_boards').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setPopups(data);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('shadow_guild_boards');
        if (saved) setPopups(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Supabase fetch fallback to local:', err);
      const saved = localStorage.getItem('shadow_guild_boards');
      if (saved) setPopups(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  // Save popup (Create / Edit)
  const handleSavePopup = async () => {
    if (!form.title?.trim()) {
      toast.error('Please enter a popup title');
      return;
    }

    const newPopup: GuildBoardPopup = {
      id: form.id || `popup_${Date.now()}`,
      title: form.title || 'Guild Notice',
      subtitle: form.subtitle || '',
      content: form.content || '',
      image_url: form.image_url || '',
      button_text: form.button_text || 'View',
      button_url: form.button_url || '/',
      target_page: form.target_page || 'all',
      trigger_type: form.trigger_type || 'delay',
      delay_seconds: form.delay_seconds ?? 2,
      placement: form.placement || 'center_modal',
      width_px: form.width_px || 480,
      max_display_count: form.max_display_count ?? 3,
      duration_seconds: form.duration_seconds ?? 15,
      is_active: form.is_active ?? true,
      created_at: form.created_at || new Date().toISOString()
    };

    let updatedList = [...popups];
    if (form.id) {
      updatedList = updatedList.map(p => p.id === form.id ? newPopup : p);
    } else {
      updatedList.unshift(newPopup);
    }

    setPopups(updatedList);
    localStorage.setItem('shadow_guild_boards', JSON.stringify(updatedList));

    // Try sync with Supabase
    try {
      await supabase.from('guild_boards').upsert(newPopup);
    } catch (e) {}

    toast.success(form.id ? 'Popup updated successfully!' : 'Guild Board Popup created!');
    setIsCreating(false);
    setEditingPopup(null);
    setForm(defaultForm);
  };

  // Toggle active status
  const handleToggleActive = async (popup: GuildBoardPopup) => {
    const updated = popups.map(p => p.id === popup.id ? { ...p, is_active: !p.is_active } : p);
    setPopups(updated);
    localStorage.setItem('shadow_guild_boards', JSON.stringify(updated));
    try {
      await supabase.from('guild_boards').update({ is_active: !popup.is_active }).eq('id', popup.id);
    } catch (e) {}
    toast.success(`Popup ${!popup.is_active ? 'Activated' : 'Deactivated'}`);
  };

  // Delete popup
  const handleDeletePopup = async (id: string) => {
    const updated = popups.filter(p => p.id !== id);
    setPopups(updated);
    localStorage.setItem('shadow_guild_boards', JSON.stringify(updated));
    try {
      await supabase.from('guild_boards').delete().eq('id', id);
    } catch (e) {}
    toast.success('Popup deleted');
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* --- HEADER BANNER --- */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-fuchsia-950/40 via-[#0c0a18]/80 to-black border border-fuchsia-500/30 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400">
                <Megaphone size={22} />
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-wider">Guild Boards & Popups Engine</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Design, configure, and deploy interactive modal popups, floating banners, and announcement toasts across specific pages with live device preview.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={fetchPopups} variant="ghost" className="h-11 w-11 p-0 text-zinc-400 hover:text-white bg-black/40 border border-white/10 rounded-2xl">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>

            <Button 
              onClick={() => {
                setForm(defaultForm);
                setEditingPopup(null);
                setIsCreating(true);
              }} 
              className="h-11 px-6 text-xs font-black bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl flex items-center gap-2 shadow-[0_0_25px_rgba(192,38,211,0.4)] transition-all hover:scale-105"
            >
              <Plus size={16} /> New Guild Board Popup
            </Button>
          </div>
        </div>
      </div>

      {/* --- CREATE / EDIT CONFIGURATION & LIVE PREVIEW WORKSPACE --- */}
      {(isCreating || editingPopup) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* LEFT: FORM CONTROLS (7 COLS) */}
          <div className="lg:col-span-7 space-y-6 bg-zinc-900/40 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders size={18} className="text-fuchsia-400" /> 
                {editingPopup ? 'Edit Popup Configuration' : 'Create Guild Board Popup'}
              </h3>
              <button 
                onClick={() => { setIsCreating(false); setEditingPopup(null); }} 
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. Title & Subtitle */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Popup Title *</label>
                <Input
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Tournament Announcement..."
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Subtitle / Subheader</label>
                <Input
                  value={form.subtitle || ''}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="e.g. Join the Seven Shadows Grand Battle"
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Body Content Text</label>
                <Textarea
                  value={form.content || ''}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Enter main announcement message..."
                  className="bg-black/70 border-white/15 text-white min-h-[90px] text-xs rounded-2xl"
                />
              </div>
            </div>

            {/* 2. Media & Action Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Banner Image URL</label>
                <Input
                  value={form.image_url || ''}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">CTA Button Text</label>
                <Input
                  value={form.button_text || ''}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  placeholder="e.g. Claim Reward"
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">CTA Redirect URL / Path</label>
                <Input
                  value={form.button_url || ''}
                  onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                  placeholder="e.g. /social or https://discord.gg/..."
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>
            </div>

            {/* 3. Page Targeting & Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Target Page</label>
                <select
                  value={form.target_page || 'all'}
                  onChange={(e) => setForm({ ...form, target_page: e.target.value })}
                  className="w-full bg-black/80 border border-white/15 text-white h-11 px-3 text-xs rounded-2xl cursor-pointer"
                >
                  <option value="all">All Pages (Global)</option>
                  <option value="/">Home Landing Page (/)</option>
                  <option value="/social">OtakuVerse Social Feed (/social)</option>
                  <option value="/clans">Clan Realm (/clans)</option>
                  <option value="/master">Master Admin Panel (/master)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Trigger Condition</label>
                <select
                  value={form.trigger_type || 'delay'}
                  onChange={(e) => setForm({ ...form, trigger_type: e.target.value as any })}
                  className="w-full bg-black/80 border border-white/15 text-white h-11 px-3 text-xs rounded-2xl cursor-pointer"
                >
                  <option value="on_load">Instant On Page Load</option>
                  <option value="delay">Time Delay (Seconds)</option>
                  <option value="scroll">Scroll Down 50%</option>
                  <option value="exit_intent">Exit Intent (Mouse Leave)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Placement Style</label>
                <select
                  value={form.placement || 'center_modal'}
                  onChange={(e) => setForm({ ...form, placement: e.target.value as any })}
                  className="w-full bg-black/80 border border-white/15 text-white h-11 px-3 text-xs rounded-2xl cursor-pointer"
                >
                  <option value="center_modal">Center Glass Modal</option>
                  <option value="top_banner">Top Ambient Banner</option>
                  <option value="bottom_toast">Bottom Slide Toast</option>
                  <option value="bottom_right_card">Bottom-Right Floating Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Delay Seconds ({form.delay_seconds || 0}s)</label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={form.delay_seconds || 0}
                  onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })}
                  className="w-full h-2 bg-black/80 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 mt-3"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Max Times Shown Per User</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.max_display_count || 3}
                  onChange={(e) => setForm({ ...form, max_display_count: Number(e.target.value) })}
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Auto Close Duration ({form.duration_seconds || 15}s)</label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={form.duration_seconds || 15}
                  onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}
                  className="bg-black/70 border-white/15 text-white h-11 text-xs rounded-2xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active ?? true}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <span className="text-xs font-bold text-white">Active Immediately</span>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { setIsCreating(false); setEditingPopup(null); }}
                  className="text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>

                <Button 
                  type="button" 
                  onClick={handleSavePopup}
                  className="text-xs font-black bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 h-11 rounded-2xl shadow-lg shadow-fuchsia-600/30"
                >
                  Save Guild Board
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT: REALTIME DUAL DEVICE PREVIEW (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-4 sticky top-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-fuchsia-400" />
                  <h4 className="text-sm font-black text-white">Realtime Live UI Preview</h4>
                </div>

                <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      previewDevice === 'desktop' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Monitor size={14} /> Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      previewDevice === 'mobile' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                </div>
              </div>

              {/* LIVE DEVICE CANVAS */}
              <div className="relative bg-[#050509] border border-white/10 rounded-3xl p-4 min-h-[420px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/20 via-black to-zinc-950 opacity-80 pointer-events-none" />

                {/* DESKTOP PREVIEW */}
                {previewDevice === 'desktop' ? (
                  <div className="relative w-full max-w-sm z-10 transition-all duration-300">
                    <div className="p-5 rounded-3xl bg-[#0e0c1a]/95 border border-fuchsia-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl space-y-4">
                      {form.image_url && (
                        <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10">
                          <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-black uppercase text-fuchsia-400 tracking-wider">
                          [{form.target_page === 'all' ? 'GLOBAL NOTICE' : form.target_page}]
                        </span>
                        <h4 className="text-base font-black text-white mt-1 leading-tight">{form.title || 'Popup Title'}</h4>
                        {form.subtitle && <p className="text-xs text-fuchsia-300 font-medium mt-0.5">{form.subtitle}</p>}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{form.content || 'Content text will render here.'}</p>
                      <div className="pt-2">
                        <button className="w-full py-2.5 px-4 rounded-xl bg-fuchsia-600 text-white text-xs font-black shadow-lg shadow-fuchsia-600/40 hover:bg-fuchsia-500 transition-colors">
                          {form.button_text || 'Action Button'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MOBILE MOCKUP FRAME */
                  <div className="relative w-64 h-[440px] bg-black border-4 border-zinc-700 rounded-[40px] shadow-2xl overflow-hidden flex flex-col items-center p-3 z-10">
                    <div className="w-20 h-4 bg-zinc-800 rounded-full mb-3 shrink-0" />
                    
                    <div className="w-full flex-1 flex items-center justify-center">
                      <div className="w-full p-3 rounded-2xl bg-[#0e0c1a]/95 border border-fuchsia-500/40 shadow-xl backdrop-blur-xl space-y-2.5">
                        {form.image_url && (
                          <div className="w-full h-24 rounded-xl overflow-hidden border border-white/10">
                            <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-white leading-tight">{form.title || 'Popup Title'}</h4>
                          {form.subtitle && <p className="text-[10px] text-fuchsia-300">{form.subtitle}</p>}
                        </div>
                        <p className="text-[10px] text-zinc-300 line-clamp-3">{form.content}</p>
                        <button className="w-full py-1.5 rounded-lg bg-fuchsia-600 text-white text-[10px] font-bold">
                          {form.button_text || 'View'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GUILD BOARDS POPUPS LIST TABLE --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="text-fuchsia-400" size={20} />
            <h3 className="text-lg font-black text-white">Active & Configured Guild Boards</h3>
            <Badge variant="outline" className="border-fuchsia-500/40 text-fuchsia-300 bg-fuchsia-950/40">
              {popups.length} Registered
            </Badge>
          </div>
        </div>

        {popups.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/30 border border-white/10 rounded-3xl backdrop-blur-xl space-y-3">
            <Megaphone size={36} className="text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-bold">No Guild Board Popups Created Yet</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">Click "New Guild Board Popup" above to design your first custom announcement popover.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popups.map((popup) => (
              <div 
                key={popup.id}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl ${
                  popup.is_active 
                    ? 'border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-950/20 via-zinc-900/60 to-black shadow-[0_10px_25px_rgba(192,38,211,0.15)]' 
                    : 'border-white/10 bg-zinc-900/30 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400 bg-fuchsia-950/80 border border-fuchsia-500/40 px-2.5 py-0.5 rounded-full">
                      {popup.target_page === 'all' ? 'GLOBAL' : popup.target_page}
                    </span>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleActive(popup)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all cursor-pointer ${
                          popup.is_active 
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' 
                            : 'bg-zinc-900 text-zinc-500 border-white/10'
                        }`}
                      >
                        {popup.is_active ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white truncate">{popup.title}</h4>
                    {popup.subtitle && <p className="text-xs text-fuchsia-300 truncate">{popup.subtitle}</p>}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2">{popup.content}</p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-2 border-t border-white/10">
                    <div>Trigger: <span className="text-white font-bold capitalize">{popup.trigger_type}</span></div>
                    <div>Placement: <span className="text-white font-bold capitalize">{popup.placement.replace('_', ' ')}</span></div>
                    <div>Delay: <span className="text-white font-bold">{popup.delay_seconds}s</span></div>
                    <div>Max Shows: <span className="text-white font-bold">{popup.max_display_count}x</span></div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 mt-4">
                  <Button
                    onClick={() => {
                      setForm(popup);
                      setEditingPopup(popup);
                      setIsCreating(false);
                    }}
                    variant="ghost"
                    className="h-8 px-3 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
                  >
                    <Edit3 size={14} className="mr-1" /> Edit
                  </Button>

                  <Button
                    onClick={() => handleDeletePopup(popup.id)}
                    variant="ghost"
                    className="h-8 px-3 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
