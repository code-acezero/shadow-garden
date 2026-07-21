"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Settings, Save, X, Check, Upload, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { Clan } from './ClanSystem';
import { ImageAPI } from '@/lib/api';

export default function ClanSettings({ clan, onUpdate, members }: { clan: Clan, onUpdate: () => void, members: any[] }) {
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

  useEffect(() => {
    fetchRequests();
  }, [clan.id]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const { data } = await supabase
      .from('clan_requests')
      .select('*, profiles(username, avatar_url)')
      .eq('clan_id', clan.id)
      .eq('status', 'pending');
    setRequests(data || []);
    setLoadingRequests(false);
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
        onUpdate();
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
          else setAvatarUrl(url);
      } catch(e) {
          toast.error("Upload failed");
      }
      
      if(type === 'banner') setUploadingBanner(false);
      else setUploadingAvatar(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Settings size={18}/> Clan Configuration</h3>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Clan Name</label>
                    <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white resize-none h-24" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Privacy</label>
                        <select value={formData.privacy} onChange={e=>setFormData({...formData, privacy: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Auto Join</label>
                        <select value={formData.is_auto_join ? 'true' : 'false'} onChange={e=>setFormData({...formData, is_auto_join: e.target.value === 'true'})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white">
                            <option value="false">Require Approval</option>
                            <option value="true">Auto Join</option>
                        </select>
                    </div>
                </div>

                {/* Assets */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Avatar Profile</label>
                        <div className="h-20 bg-black/40 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 relative overflow-hidden" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            {avatarUrl ? <img src={avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-50"/> : <Upload size={16} className="mb-1 text-zinc-500" />}
                            <span className="text-[10px] text-zinc-400 relative z-10">{uploadingAvatar ? 'Uploading...' : 'Change Avatar'}</span>
                        </div>
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')} />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Cover Banner</label>
                        <div className="h-20 bg-black/40 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 relative overflow-hidden" onClick={() => document.getElementById('banner-upload')?.click()}>
                            {bannerUrl ? <img src={bannerUrl} className="absolute inset-0 w-full h-full object-cover opacity-50"/> : <Upload size={16} className="mb-1 text-zinc-500" />}
                            <span className="text-[10px] text-zinc-400 relative z-10">{uploadingBanner ? 'Uploading...' : 'Change Banner'}</span>
                        </div>
                        <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner')} />
                    </div>
                </div>

                <button onClick={handleSaveConfig} disabled={saving} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-full mt-4 flex justify-center items-center">
                    {saving ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18} className="mr-2"/> Save Changes</>}
                </button>
            </div>
        </div>

        {/* Requests & Members Management */}
        <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl">
                <h3 className="font-bold text-white mb-4">Join Requests {!formData.is_auto_join && <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{requests.length}</span>}</h3>
                
                {formData.is_auto_join ? (
                    <p className="text-sm text-zinc-500">Auto-join is enabled. Users join automatically.</p>
                ) : requests.length === 0 ? (
                    <p className="text-sm text-zinc-500">No pending requests.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {requests.map(r => (
                            <div key={r.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <img src={r.profiles?.avatar_url} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm text-white font-bold">{r.profiles?.username}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={()=>handleRequest(r.id, r.user_id, 'approved')} className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white p-2 rounded-full transition-colors"><Check size={14}/></button>
                                    <button onClick={()=>handleRequest(r.id, r.user_id, 'rejected')} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-full transition-colors"><X size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl">
                <h3 className="font-bold text-white mb-4">Manage Members</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {members.map(m => (
                        <div key={m.user_id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <img src={m.profiles?.avatar_url} className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm text-white font-bold leading-tight">{m.profiles?.username}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase">{m.role}</p>
                                </div>
                            </div>
                            {m.role !== 'owner' && (
                                <div className="flex items-center gap-2">
                                    <select value={m.role} onChange={e => updateRole(m.user_id, e.target.value)} className="bg-zinc-800 text-[10px] text-white rounded px-2 py-1 border border-white/10">
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button onClick={() => kickMember(m.user_id)} className="text-zinc-500 hover:text-primary-500 p-1"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
