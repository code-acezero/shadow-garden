"use client";

import React, { useState } from 'react';
import { Shield, Settings, Save, Sparkles, Sliders, Lock, Globe, Users, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { Clan } from './ClanSystem';
import ProfileAvatar from '@/components/User/ProfileAvatar';

export default function ClanSettings({ clan, onUpdate, members }: { clan: Clan, onUpdate: (updatedClan?: Partial<Clan>) => void, members: any[] }) {
  const [formData, setFormData] = useState({
    description: clan.description,
    privacy: clan.privacy,
    is_auto_join: (clan as any).is_auto_join || false,
    alpha_settings: (clan as any).alpha_settings || {
      enabled: true,
      auto_approve_joins: false,
      moderation_rules: ''
    }
  });
  const [activeTab, setActiveTab] = useState<'general' | 'alpha' | 'members'>('general');
  const [saving, setSaving] = useState(false);

  const handleSaveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('clans')
      .update({
        ...formData,
      })
      .eq('id', clan.id);
      
    setSaving(false);
    if (error) {
        toast.error("Failed to update clan settings");
    } else {
        toast.success("Clan settings saved successfully");
        onUpdate({ ...formData });
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    await supabase.from('clan_members').update({ role: newRole }).eq('clan_id', clan.id).eq('user_id', userId);
    toast.success("Member role updated");
    onUpdate();
  };

  const kickMember = async (userId: string) => {
    if(!confirm("Are you sure you want to remove this member from the clan?")) return;
    await supabase.from('clan_members').delete().eq('clan_id', clan.id).eq('user_id', userId);
    toast.success("Member removed");
    onUpdate();
  };

  return (
    <div className="flex flex-col space-y-6 w-full text-xs font-sans perspective-1000">
        
        {/* --- PREMIUM HERO BAR --- */}
        <motion.div 
          initial={{ opacity: 0, rotateX: 15, y: -20 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-[#050508]/60 backdrop-blur-2xl border border-white/5 p-5 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-600/30 to-primary-900/10 border border-primary-500/20 rounded-[18px] text-primary-400 shadow-[0_0_30px_rgba(220,38,38,0.15)] shrink-0">
                <Shield size={22} className="drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-widest leading-tight flex items-center gap-2">
                  Command Center
                  <span className="text-[9px] font-mono bg-white/5 text-primary-300 border border-white/10 px-2 py-0.5 rounded-full font-bold shadow-inner">Admin</span>
                </h2>
                <p className="text-[11px] text-zinc-400 mt-1 font-medium">Manage directives, privacy, and Alpha AI integration.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- 3D TABS --- */}
        <div className="bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/5 p-1.5 rounded-[20px] flex relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          {[
            { id: 'general', icon: <Sliders size={14} />, label: 'General' },
            { id: 'members', icon: <Users size={14} />, label: 'Roster' },
            { id: 'alpha', icon: <Sparkles size={14} />, label: 'Alpha AI' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] rounded-[14px] transition-all relative z-10 flex justify-center items-center gap-2 ${
                activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="manage-tab-indicator" 
                  className="absolute inset-0 bg-primary-600/80 border border-white/10 rounded-[14px] shadow-[0_4px_15px_rgba(220,38,38,0.3)] -z-10" 
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT --- */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div 
                key="general" 
                initial={{ opacity: 0, y: 15, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -15, scale: 0.98 }} 
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-5"
              >
                {/* Configuration Card */}
                <div className="bg-[#0c0c12]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[24px] space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <h3 className="font-bold text-white/90 flex items-center gap-2 text-xs uppercase tracking-wider">
                        <Settings size={15} className="text-primary-400"/> Operational Rules
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono bg-black/40 px-2 py-1 rounded-lg border border-white/5">ID: {clan.id.slice(0, 8)}</span>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1">Directive / Description</label>
                        <textarea 
                          value={formData.description} 
                          onChange={e => setFormData({ ...formData, description: e.target.value })} 
                          placeholder="State the clan's purpose, rules, or philosophy..."
                          className="w-full bg-black/40 border border-white/5 focus:border-primary-500/50 rounded-[16px] p-4 text-xs text-white placeholder-zinc-700 resize-none h-24 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium custom-scrollbar shadow-inner" 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1 flex items-center gap-1.5">
                              <Lock size={12} className="text-primary-500" /> Privacy Matrix
                            </label>
                            <select 
                              value={formData.privacy} 
                              onChange={e => setFormData({ ...formData, privacy: e.target.value })} 
                              className="w-full bg-black/40 border border-white/5 rounded-[16px] px-4 py-3 text-xs text-white focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer font-medium appearance-none shadow-inner"
                            >
                                <option value="public">Public (Open for discovery)</option>
                                <option value="private">Private (Invite & approval only)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1 flex items-center gap-1.5">
                              <Users size={12} className="text-primary-500" /> Entry Protocol
                            </label>
                            <select 
                              value={formData.is_auto_join ? 'true' : 'false'} 
                              onChange={e => setFormData({ ...formData, is_auto_join: e.target.value === 'true' })} 
                              className="w-full bg-black/40 border border-white/5 rounded-[16px] px-4 py-3 text-xs text-white focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer font-medium appearance-none shadow-inner"
                            >
                                <option value="false">Manual Review Required</option>
                                <option value="true">Auto-Join (Instant Access)</option>
                            </select>
                        </div>
                    </div>

                    <button 
                      onClick={handleSaveConfig} 
                      disabled={saving} 
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-500 hover:to-primary-700 text-white font-black py-3.5 rounded-[16px] mt-6 flex justify-center items-center text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(220,38,38,0.2)] hover:shadow-[0_15px_30px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-white/10"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16}/> : 'Initialize Configuration'}
                    </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div 
                key="members" 
                initial={{ opacity: 0, y: 15, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -15, scale: 0.98 }} 
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="bg-[#0c0c12]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[24px] shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col h-[400px]"
              >
                  <h3 className="font-bold text-white/90 text-xs mb-4 pb-3 border-b border-white/5 flex items-center justify-between uppercase tracking-wider">
                    <span className="flex items-center gap-2"><Users size={14} className="text-primary-400" /> Administrative Roster</span>
                    <span className="bg-white/5 text-zinc-300 border border-white/10 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold">{members.length} Total</span>
                  </h3>
                  
                  <div className="space-y-2.5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                      {members.map((m, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={m.user_id} 
                            className="flex justify-between items-center bg-black/40 p-3 rounded-[16px] border border-white/5 hover:border-white/15 transition-all shadow-sm hover:shadow-md hover:bg-black/60 group"
                          >
                              <div className="flex items-center gap-3 min-w-0">
                                  <ProfileAvatar profile={m.profiles} className="w-9 h-9 shrink-0 shadow-md ring-1 ring-white/10 group-hover:ring-white/20 transition-all" />
                                  <div className="min-w-0">
                                      <p className="text-xs text-white font-bold truncate leading-tight">{m.profiles?.username}</p>
                                      <p className={`text-[9px] uppercase font-mono font-black mt-0.5 ${m.role === 'owner' ? 'text-yellow-500' : m.role === 'admin' ? 'text-primary-400' : 'text-zinc-500'}`}>{m.role}</p>
                                  </div>
                              </div>
                              {m.role !== 'owner' && (
                                  <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                      <select 
                                        value={m.role} 
                                        onChange={e => updateRole(m.user_id, e.target.value)} 
                                        className="bg-[#1a1a24] text-[10px] text-white font-bold rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-primary-500/50 cursor-pointer hover:bg-[#252535] transition-colors appearance-none"
                                      >
                                          <option value="member">Member</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                      <button 
                                        onClick={() => kickMember(m.user_id)} 
                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={14}/>
                                      </button>
                                  </div>
                              )}
                          </motion.div>
                      ))}
                  </div>
              </motion.div>
            )}

            {activeTab === 'alpha' && (
              <motion.div 
                key="alpha" 
                initial={{ opacity: 0, y: 15, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -15, scale: 0.98 }} 
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="bg-[#0c0c12]/80 backdrop-blur-xl border border-primary-500/20 p-6 rounded-[24px] shadow-[0_20px_50px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-[-30%] right-[-20%] w-64 h-64 bg-primary-600/15 rounded-full blur-[90px] pointer-events-none" />
                
                <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Sparkles size={16} className="text-primary-400" /> Alpha Protocol
                  </h3>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed relative z-10 w-full font-medium">
                  Configure Alpha's autonomous directives. As First Shadow, she moderates discourse and manages entry based on your commands.
                </p>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-[16px] border border-white/5 shadow-inner">
                    <div>
                      <h4 className="text-white/90 font-black text-[10px] uppercase tracking-widest">System Integration</h4>
                      <p className="text-[9px] text-zinc-500 mt-1">Allow Alpha to operate within this sector.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, alpha_settings: { ...formData.alpha_settings, enabled: !formData.alpha_settings.enabled }})}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner border ${formData.alpha_settings.enabled ? 'bg-primary-600/40 border-primary-500/50' : 'bg-zinc-900 border-white/5'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform duration-300 shadow-md ${formData.alpha_settings.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {formData.alpha_settings.enabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-[16px] border border-white/5 shadow-inner">
                        <div>
                          <h4 className="text-white/90 font-black text-[10px] uppercase tracking-widest">Autonomous Entry</h4>
                          <p className="text-[9px] text-zinc-500 mt-1">Alpha reviews and processes join requests.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, alpha_settings: { ...formData.alpha_settings, auto_approve_joins: !formData.alpha_settings.auto_approve_joins }})}
                          className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner border ${formData.alpha_settings.auto_approve_joins ? 'bg-primary-600/40 border-primary-500/50' : 'bg-zinc-900 border-white/5'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform duration-300 shadow-md ${formData.alpha_settings.auto_approve_joins ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest block pl-1">Primary Directives</label>
                        <textarea 
                          value={formData.alpha_settings.moderation_rules} 
                          onChange={e => setFormData({ ...formData, alpha_settings: { ...formData.alpha_settings, moderation_rules: e.target.value }})}
                          placeholder="e.g., 'Delete spoiler messages.', 'Ban spammers.', 'Only approve Level 5+ applicants.'"
                          className="w-full bg-black/40 border border-primary-500/20 rounded-[16px] p-4 text-xs text-white placeholder-zinc-700 resize-none h-28 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-colors custom-scrollbar font-medium shadow-inner" 
                        />
                      </div>
                    </motion.div>
                  )}

                  <button 
                    onClick={handleSaveConfig} 
                    disabled={saving} 
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3.5 rounded-[16px] mt-6 flex justify-center items-center text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.15)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-white/10"
                  >
                      {saving ? <Loader2 className="animate-spin" size={16}/> : 'Transmit Directives'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}

