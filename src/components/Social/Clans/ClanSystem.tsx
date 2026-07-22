"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Shield, Plus, Users, Lock, Globe, MessageSquare, ChevronRight, X, Compass, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import ClanDetails from './ClanDetails';
import ClanEmblemModal, { getRandomClanEmblem } from './ClanEmblemModal';
import ClanLevelBadge, { addClanXP } from './ClanLevelBadge';
import ClanAvatar from './ClanAvatar';

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

export default function ClanSystem({ onClanOpen }: { onClanOpen?: (isOpen: boolean) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clanIdParam = searchParams.get('clanId');

  const { user } = useAuth();
  const [clans, setClans] = useState<Clan[]>([]);
  const [userClanIds, setUserClanIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'myclans'>('discover');
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);

  useEffect(() => {
    onClanOpen?.(!!selectedClan);
  }, [selectedClan, onClanOpen]);

  // Form states
  const [clanName, setClanName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emblemModalOpen, setEmblemModalOpen] = useState(false);
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
      
      const mappedData = (data || []).map((clan: any) => ({
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
      const finalAvatar = avatarUrl.trim() || getRandomClanEmblem();
      const { data: clan, error } = await supabase
        .from('clans')
        .insert({
          name: clanName,
          description,
          avatar_url: finalAvatar,
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

  useEffect(() => {
    if (clans.length > 0) {
      if (clanIdParam && !selectedClan) {
        const clan = clans.find(c => c.id === clanIdParam);
        if (clan) setSelectedClan(clan);
      } else if (!clanIdParam && selectedClan) {
        setSelectedClan(null);
      }
    }
  }, [clanIdParam, clans, selectedClan]);

  const handleClanSelect = (clan: Clan | null) => {
    setSelectedClan(clan);
    if (clan) {
      window.history.pushState(null, '', `?clanId=${clan.id}`);
    } else {
      window.history.pushState(null, '', `?`);
    }
  };

  if (selectedClan) {
    return <ClanDetails clan={selectedClan} onBack={() => handleClanSelect(null)} onUpdate={fetchClans} />;
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

      await addClanXP(supabase, clanId, 100);
      toast.success('Joined Clan! +100 CP');
      setUserClanIds(prev => [...prev, clanId]);
      fetchClans();
    } catch (err) {
      toast.error('Could not join clan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Glassmorphism Header bar with Rounded-Full Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0a0a0d]/90 backdrop-blur-xl border border-white/10 sm:rounded-3xl gap-3.5 shadow-2xl">
        {/* Title & Subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-500/10 backdrop-blur-md border border-primary-500/20 flex items-center justify-center shrink-0 shadow-md">
            <Shield size={18} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 leading-none">
              Guild Clans
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1 hidden sm:block leading-none">Form alliances, post clan feeds, and chat.</p>
          </div>
        </div>

        {/* Action Controls: Glassmorphism Rounded-Full Segmented Tab Switcher + Create Clan Pill Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Glassmorphism Segmented Tab Control */}
          <div className="bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10 flex items-center gap-1 shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'discover'
                  ? 'bg-white/15 backdrop-blur-md text-white shadow-md border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass size={13} />
              <span>Discover</span>
            </button>
            <button
              onClick={() => setActiveTab('myclans')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'myclans'
                  ? 'bg-white/15 backdrop-blur-md text-white shadow-md border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List size={13} />
              <span>My Clans</span>
            </button>
          </div>

          {/* Create Clan Glassmorphism Pill Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 sm:px-5 py-2 bg-primary-600/90 hover:bg-primary-500 text-white rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Clan</span>
          </button>
        </div>
      </div>

      {/* Clan Grid */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : clans.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl text-zinc-500 text-xs font-bold">
          No Clans found. Be the first to found a clan!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clans.filter(c => activeTab === 'discover' ? true : userClanIds.includes(c.id)).map(clan => {
            const isMember = userClanIds.includes(clan.id);
            return (
              <div
                key={clan.id}
                onClick={() => handleClanSelect(clan)}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 hover:bg-white/[0.03] hover:border-white/20 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-xl"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <ClanAvatar clan={clan} className="w-14 h-14" />
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-primary-400 transition-colors truncate">
                        {clan.name}
                      </h3>
                      {clan.privacy === 'private' ? (
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <Globe size={10} /> Public
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Users size={12} className="text-primary-400" />
                        <span className="text-white font-bold">{clan.member_count || 1}</span> members
                      </span>
                      <span className="opacity-30">•</span>
                      <span>Leader: <span className="text-white font-bold">{clan.owner?.username || 'Unknown'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isMember ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleClanSelect(clan); }}
                      className="w-full sm:w-[100px] h-9 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all flex justify-center items-center gap-1 border border-white/15 backdrop-blur-md shadow-md cursor-pointer active:scale-95"
                    >
                      Enter <ChevronRight size={14} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleJoinClan(clan.id); }}
                      className="w-full sm:w-[100px] h-9 bg-primary-600/90 hover:bg-primary-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 cursor-pointer active:scale-95"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Clan Modal */}
      {typeof window !== 'undefined' && createModalOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[20000] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              style={{ maxHeight: "calc(100dvh - var(--nav-height-top, 64px) - var(--nav-height-bottom, 64px) - 10px)" }}
              className="w-full max-w-lg bg-[#0c0c10]/95 border-t sm:border border-white/15 rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl space-y-4 my-0 sm:my-auto overflow-y-auto custom-scrollbar"
            >
              {/* iOS Top Drag Indicator Bar */}
              <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto mb-2 shrink-0" />

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Shield size={18} className="text-primary-500" /> Found A Clan
                </h3>
                <button onClick={() => setCreateModalOpen(false)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">Clan Name</label>
                  <input
                    type="text"
                    value={clanName}
                    onChange={e => setClanName(e.target.value)}
                    placeholder="Shadow Legion..."
                    className="w-full bg-black/50 border border-white/15 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Clan purpose, rules, and realm goals..."
                    rows={3}
                    className="w-full bg-black/50 border border-white/15 rounded-3xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">Clan Emblem / Avatar</label>
                  <div className="flex items-center gap-3 bg-black/50 border border-white/15 p-3 rounded-3xl">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                      <img src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + (clanName || 'Random')} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-zinc-400 mb-1.5">{avatarUrl ? 'Selected emblem' : 'Random anime emblem will be assigned if unselected.'}</p>
                      <button
                        type="button"
                        onClick={() => setEmblemModalOpen(true)}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all border border-white/15 backdrop-blur-md cursor-pointer"
                      >
                        Choose Emblem
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateClan}
                className="w-full py-3 bg-primary-600/90 hover:bg-primary-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-[0_4px_20px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 active:scale-95 transition-all cursor-pointer"
              >
                Establish Clan
              </button>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Emblem Library Modal */}
      <ClanEmblemModal
        isOpen={emblemModalOpen}
        onClose={() => setEmblemModalOpen(false)}
        onSelectEmblem={(url) => setAvatarUrl(url)}
        currentUrl={avatarUrl}
      />
    </div>
  );
}
