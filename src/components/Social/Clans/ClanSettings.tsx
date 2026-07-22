"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Settings, Save, X, Check, Upload, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { Clan } from './ClanSystem';
import { ImageAPI } from '@/lib/api';
import ClanEmblemModal from './ClanEmblemModal';
import ProfileAvatar from '@/components/User/ProfileAvatar';

export default function ClanSettings({ clan, onUpdate, members }: { clan: Clan, onUpdate: (updatedClan?: Partial<Clan>) => void, members: any[] }) {
  const [formData, setFormData] = useState({
    name: clan.name,
    description: clan.description,
    privacy: clan.privacy,
    is_auto_join: (clan as any).is_auto_join || false
  });
  const [saving, setSaving] = useState(false);
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Uploading states
  const [bannerUrl, setBannerUrl] = useState(clan.banner_url || '');
  const [avatarUrl, setAvatarUrl] = useState(clan.avatar_url || '');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [emblemModalOpen, setEmblemModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [clan.id]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const { data } = await supabase
      .from('clan_requests')
      .select('*, profiles(username, avatar_url, level, frame_id, show_level)')
      .eq('clan_id', clan.id)
      .eq('status', 'pending');
    setRequests(data || []);
    setLoadingRequests(false);
  };

  const handleSelectEmblem = (url: string) => {
    setAvatarUrl(url);
    // Instant update
    onUpdate({ avatar_url: url });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('clans')
      .update({
        ...formData,
        banner_url: bannerUrl,
        avatar_url: avatarUrl
      })
      .eq('id', clan.id);
      
    setSaving(false);
    if (error) {
        toast.error("Failed to update config");
    } else {
        toast.success("Clan updated");
        onUpdate({ ...formData, banner_url: bannerUrl, avatar_url: avatarUrl });
    }
  };

  const handleRequest = async (reqId: string, userId: string, action: 'approved' | 'rejected') => {
    await supabase.from('clan_requests').update({ status: action }).eq('id', reqId);
    if (action === 'approved') {
        await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: userId, role: 'member' });
        toast.success("Member accepted");
        onUpdate();
    } else {
        toast.success("Request rejected");
    }
    fetchRequests();
  };

  const updateRole = async (userId: string, newRole: string) => {
    await supabase.from('clan_members').update({ role: newRole }).eq('clan_id', clan.id).eq('user_id', userId);
    toast.success("Role updated");
    onUpdate();
  };

  const kickMember = async (userId: string) => {
    if(!confirm("Kick member?")) return;
    await supabase.from('clan_members').delete().eq('clan_id', clan.id).eq('user_id', userId);
    toast.success("Member kicked");
    onUpdate();
  };

  const handleUpload = async (file: File, type: 'banner' | 'avatar') => {
      if(type === 'banner') setUploadingBanner(true);
      else setUploadingAvatar(true);

      try {
          const url = await ImageAPI.uploadImage(file);
          if (type === 'banner') setBannerUrl(url);
          else {
            setAvatarUrl(url);
            onUpdate({ avatar_url: url });
          }
      } catch(e) {
          toast.error("Upload failed");
      }
      
      if(type === 'banner') setUploadingBanner(false);
      else setUploadingAvatar(false);
  };

  return (
    <div className="flex flex-col space-y-5 w-full text-xs">
        {/* Admin Group Management Panel Header */}
        <div className="bg-[#0e0e14] border border-white/15 p-4 sm:p-5 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-600/20 border border-primary-500/40 rounded-2xl text-primary-400 shadow-inner">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest leading-tight flex items-center gap-2">
                  Clan Management Panel
                  <span className="text-[9px] font-mono bg-primary-600/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full font-bold">Admin Tools</span>
                </h2>
                <p className="text-[10px] text-zinc-400 mt-0.5">Manage membership requests, clan branding, roles, and settings.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-black/50 p-2 rounded-xl border border-white/10">
              <span>Pending Requests: <strong className="text-primary-400 font-bold">{requests.length}</strong></span>
              <span>•</span>
              <span>Members: <strong className="text-white font-bold">{members.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
            <div className="bg-[#0b0b0e] border border-white/10 p-4 sm:p-5 rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Settings size={16} className="text-primary-400"/> Clan Configuration & Branding
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {clan.id.slice(0, 8)}</span>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Clan Name</label>
                    <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-500 transition-colors" />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Description</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white resize-none h-20 focus:outline-none focus:border-primary-500 transition-colors" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Privacy</label>
                        <select value={formData.privacy} onChange={e=>setFormData({...formData, privacy: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-500">
                            <option value="public">Public (Anyone can see)</option>
                            <option value="private">Private (Invite only)</option>
                        </select>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Membership Approval</label>
                        <select value={formData.is_auto_join ? 'true' : 'false'} onChange={e=>setFormData({...formData, is_auto_join: e.target.value === 'true'})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-500">
                            <option value="false">Require Leader Approval</option>
                            <option value="true">Auto Join (Instant)</option>
                        </select>
                    </div>
                </div>

                {/* Assets Area */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Clan Assets & Insignia</label>
                        <button
                            type="button"
                            onClick={() => setEmblemModalOpen(true)}
                            className="px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600 border border-primary-500/40 text-primary-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Shield size={14} className="text-primary-400" /> Emblem Library
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-mono">Current Emblem</span>
                            <div className="h-20 bg-black/60 rounded-xl border border-dashed border-white/20 flex items-center gap-3 p-2.5 relative overflow-hidden group">
                                <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/10 flex items-center gap-1"
                                    >
                                        <Upload size={12} /> {uploadingAvatar ? 'Uploading...' : 'Custom Upload'}
                                    </button>
                                </div>
                            </div>
                            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')} />
                        </div>
                        
                        <div className="space-y-1.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-mono">Cover Banner</span>
                            <div className="h-20 bg-black/60 rounded-xl border border-dashed border-white/20 flex items-center gap-3 p-2.5 relative overflow-hidden group" onClick={() => document.getElementById('banner-upload')?.click()}>
                                {bannerUrl ? <img src={bannerUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"/> : null}
                                <button
                                    type="button"
                                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/10 flex items-center gap-1 relative z-10 mx-auto"
                                >
                                    <Upload size={12} /> {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                                </button>
                            </div>
                            <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner')} />
                        </div>
                    </div>
                </div>

                <button onClick={handleSaveConfig} disabled={saving} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-2.5 rounded-xl mt-3 flex justify-center items-center text-xs uppercase tracking-wider shadow-lg transition-all">
                    {saving ? <Loader2 className="animate-spin" size={16}/> : <><Save size={15} className="mr-1.5"/> Save Changes</>}
                </button>
            </div>
        </div>

        {/* Requests & Members Management */}
        <div className="space-y-4">
            <div className="bg-[#0b0b0e] border border-white/10 p-4 rounded-2xl shadow-md">
                <h3 className="font-bold text-white text-xs mb-3 flex items-center justify-between">
                  Join Requests {!formData.is_auto_join && <span className="bg-primary-600 text-white text-[9px] px-2 py-0.5 rounded-full">{requests.length}</span>}
                </h3>
                
                {formData.is_auto_join ? (
                    <p className="text-xs text-zinc-500">Auto-join is enabled. Users join automatically.</p>
                ) : requests.length === 0 ? (
                    <p className="text-xs text-zinc-500">No pending requests.</p>
                ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {requests.map(r => (
                            <div key={r.id} className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5 text-xs">
                                <div className="flex items-center gap-2.5">
                                      <ProfileAvatar profile={r.profiles} className="w-7 h-7" />
                                    <span className="text-xs text-white font-bold">{r.profiles?.username}</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={()=>handleRequest(r.id, r.user_id, 'approved')} className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white p-1.5 rounded-full transition-colors"><Check size={13}/></button>
                                    <button onClick={()=>handleRequest(r.id, r.user_id, 'rejected')} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-1.5 rounded-full transition-colors"><X size={13}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-[#0b0b0e] border border-white/10 p-4 rounded-2xl shadow-md">
                <h3 className="font-bold text-white text-xs mb-3">Manage Members</h3>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {members.map(m => (
                        <div key={m.user_id} className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5 text-xs">
                            <div className="flex items-center gap-2.5">
                                  <ProfileAvatar profile={m.profiles} className="w-7 h-7" />
                                <div>
                                    <p className="text-xs text-white font-bold leading-tight">{m.profiles?.username}</p>
                                    <p className="text-[9px] text-zinc-500 uppercase">{m.role}</p>
                                </div>
                            </div>
                            {m.role !== 'owner' && (
                                <div className="flex items-center gap-1.5">
                                    <select value={m.role} onChange={e => updateRole(m.user_id, e.target.value)} className="bg-zinc-800 text-[10px] text-white rounded px-2 py-0.5 border border-white/10">
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button onClick={() => kickMember(m.user_id)} className="text-zinc-500 hover:text-primary-400 p-1"><Trash2 size={13}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <ClanEmblemModal
            isOpen={emblemModalOpen}
            onClose={() => setEmblemModalOpen(false)}
            onSelectEmblem={handleSelectEmblem}
            currentUrl={avatarUrl}
        />
    </div>
  );
}
