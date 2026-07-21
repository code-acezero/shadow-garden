"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Users, Lock, Globe, MessageSquare, ChevronRight, X, Compass, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import ClanDetails from './ClanDetails';

export interface Clan {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  banner_url: string;
  owner_id: string;
  privacy: string;
  created_at: string;
  owner?: { username: string; avatar_url: string };
  member_count?: number;
}

export default function ClanSystem() {
  const { user } = useAuth();
  const [clans, setClans] = useState<Clan[]>([]);
  const [userClanIds, setUserClanIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'myclans'>('discover');
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);

  // Form states
  const [clanName, setClanName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [privacy, setPrivacy] = useState('public');

  const fetchClans = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clans')
        .select(`*, profiles!clans_owner_id_fkey(username, avatar_url)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(clan => ({
        ...clan,
        owner: clan.profiles
      }));
      setClans(mappedData);

      if (user) {
        const { data: memData } = await supabase
          .from('clan_members')
          .select('clan_id')
          .eq('user_id', user.id);
        setUserClanIds((memData || []).map((m: any) => m.clan_id));
      }
    } catch (err) {
      console.error('Fetch clans error:', JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClans();

    if (supabase) {
      const channel = supabase
        .channel('public:clans_and_members')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clans' }, () => fetchClans())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_members' }, () => fetchClans())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleCreateClan = async () => {
    if (!user || !supabase) {
      toast.error('Log in to create a Clan');
      return;
    }

    if (!clanName.trim()) {
      toast.error('Clan name is required');
      return;
    }

    try {
      const { data: clan, error } = await supabase
        .from('clans')
        .insert({
          name: clanName,
          description,
          avatar_url: avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + clanName,
          owner_id: user.id,
          privacy,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as member
      await supabase.from('clan_members').insert({
        clan_id: clan.id,
        user_id: user.id,
        role: 'owner',
      });

      // Auto-create Clan Group Chat
      const { data: conv } = await supabase
        .from('chat_conversations')
        .insert({
          type: 'clan',
          clan_id: clan.id,
        })
        .select()
        .single();

      if (conv) {
        await supabase.from('chat_participants').insert({
          conversation_id: conv.id,
          user_id: user.id,
        });
      }

      toast.success(`Clan "${clan.name}" Founded!`);
      setCreateModalOpen(false);
      fetchClans();
    } catch (err: any) {
      console.error('Create clan error:', err);
      toast.error(err.message || 'Failed to create Clan');
    }
  };

  if (selectedClan) {
    return <ClanDetails clan={selectedClan} onBack={() => setSelectedClan(null)} onUpdate={fetchClans} />;
  }

  const handleJoinClan = async (clanId: string) => {
    if (!user || !supabase) {
      toast.error('Log in to join a Clan');
      return;
    }

    try {
      await supabase.from('clan_members').insert({
        clan_id: clanId,
        user_id: user.id,
        role: 'member',
      });

      // Auto-add to Clan Chat
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('clan_id', clanId)
        .single();

      if (conv) {
        await supabase.from('chat_participants').upsert(
          { conversation_id: conv.id, user_id: user.id },
          { onConflict: 'conversation_id, user_id' }
        );
      }

      toast.success('Joined Clan!');
      setUserClanIds(prev => [...prev, clanId]);
    } catch (err) {
      toast.error('Could not join clan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/10 rounded-3xl">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Shield size={16} className="text-primary-500" /> Guild Clans
          </h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">Form alliances, post clan feeds, and group chat.</p>
        </div>

        <div className="flex gap-4 items-center">
            <button onClick={() => setActiveTab('discover')} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${activeTab === 'discover' ? 'text-primary-500' : 'text-zinc-500 hover:text-white'}`}><Compass size={14}/> Discover</button>
            <button onClick={() => setActiveTab('myclans')} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${activeTab === 'discover' ? 'text-zinc-500 hover:text-white' : 'text-primary-500'}`}><List size={14}/> My Clans</button>
            <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ml-4"
            >
            <Plus size={14} /> Create Clan
            </button>
        </div>
      </div>

      {/* Clan Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : clans.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-white/5 rounded-3xl text-zinc-500 text-xs">
          No Clans found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clans.filter(c => activeTab === 'discover' ? true : userClanIds.includes(c.id)).map(clan => {
            const isMember = userClanIds.includes(clan.id);
            return (
              <div
                key={clan.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 hover:border-primary-500/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={clan.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-2xl border border-white/10 object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-white group-hover:text-primary-400 transition-colors truncate">
                        {clan.name}
                      </h3>
                      {clan.privacy === 'private' ? (
                        <span className="text-[9px] text-yellow-400 flex items-center gap-1">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                          <Globe size={10} /> Public
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{clan.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                    Leader: <strong className="text-white">{clan.owner?.username || 'Owner'}</strong>
                  </span>
                  
                  {isMember ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedClan(clan); }}
                      className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      Enter Clan <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinClan(clan.id)}
                      className="px-4 py-1.5 bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Join Clan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Clan Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Shield size={16} className="text-primary-500" /> Found A Clan
                </h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">Clan Name</label>
                  <input
                    type="text"
                    value={clanName}
                    onChange={e => setClanName(e.target.value)}
                    placeholder="Shadow Legion..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Clan purpose, rules, and realm goals..."
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateClan}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Establish Clan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
