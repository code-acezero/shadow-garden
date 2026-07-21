"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Globe, MessageSquare, ChevronLeft, Settings, Image as ImageIcon, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { Clan } from './ClanSystem';
import ClanSettings from './ClanSettings';

export default function ClanDetails({ clan, onBack, onUpdate }: { clan: Clan, onBack: () => void, onUpdate: () => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'settings'>('feed');
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is admin/owner
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);
  const isMember = !!currentUserMember;

  useEffect(() => {
    fetchDetails();

    if (supabase) {
      const channel = supabase
        .channel(`clan_details_${clan.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts', filter: `clan_id=eq.${clan.id}` }, () => fetchDetails())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_members', filter: `clan_id=eq.${clan.id}` }, () => fetchDetails())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [clan.id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data: memData } = await supabase
        .from('clan_members')
        .select(`*, profiles(username, avatar_url)`)
        .eq('clan_id', clan.id);
      
      setMembers(memData || []);

      const { data: postData } = await supabase
        .from('social_posts')
        .select(`*, profiles(username, avatar_url)`)
        .eq('clan_id', clan.id)
        .order('created_at', { ascending: false });

      setPosts(postData || []);
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleJoinRequest = async () => {
    if (!user) return toast.error("Please login to join");
    if ((clan as any).is_auto_join) {
        await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, role: 'member' });
        toast.success("Joined Clan!");
        onUpdate();
        fetchDetails();
    } else {
        await supabase.from('clan_requests').insert({ clan_id: clan.id, user_id: user.id });
        toast.success("Request sent!");
    }
  };

  const [newPost, setNewPost] = useState('');
  const handlePost = async () => {
    if(!newPost.trim() || !user) return;
    await supabase.from('social_posts').insert({
        clan_id: clan.id,
        user_id: user.id,
        content: newPost
    });
    setNewPost('');
    fetchDetails();
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/5 relative">
        <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-black/50 p-2 rounded-full border border-white/10 hover:bg-white/10 text-white transition-all"><ChevronLeft size={20}/></button>
        
        {/* Banner */}
        <div className="h-48 md:h-64 w-full bg-zinc-900 relative group">
            <img src={clan.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="px-6 md:px-12 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 relative z-10 border-b border-white/5">
            <div className="w-32 h-32 rounded-full border-4 border-[#0a0a0a] bg-zinc-800 overflow-hidden shadow-2xl relative group">
                <img src={clan.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${clan.name}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left mb-2">
                <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                    {clan.name} 
                    <span className="bg-primary-500/20 text-primary-500 text-xs px-2 py-1 rounded-full border border-primary-500/30 ml-2 font-mono">Lv. {(clan as any).level || 1}</span>
                </h1>
                <p className="text-zinc-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                    {clan.privacy === 'private' ? <Lock size={14}/> : <Globe size={14}/>} {clan.privacy === 'private' ? 'Private Clan' : 'Public Clan'} • {members.length} Members
                </p>
            </div>
            <div className="flex gap-3 mb-2">
                {!isMember && (
                    <button onClick={handleJoinRequest} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full font-bold shadow-lg">Join Clan</button>
                )}
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 md:px-12 border-b border-white/5 overflow-x-auto no-scrollbar">
            <button onClick={()=>setActiveTab('feed')} className={`py-4 font-bold border-b-2 transition-colors ${activeTab === 'feed' ? 'border-primary-500 text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}>Discussion</button>
            <button onClick={()=>setActiveTab('members')} className={`py-4 font-bold border-b-2 transition-colors ${activeTab === 'members' ? 'border-primary-500 text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}>Members</button>
            {isAdmin && <button onClick={()=>setActiveTab('settings')} className={`py-4 font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-primary-500 text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}>Manage Group</button>}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto min-h-[500px]">
            {activeTab === 'feed' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Create Post */}
                    {isMember && (
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex gap-4">
                            <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`} className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Write something to the clan..." className="w-full bg-transparent border-none text-white resize-none outline-none h-12 pt-2" />
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                    <button className="text-zinc-500 hover:text-primary-500 transition-colors"><ImageIcon size={18}/></button>
                                    <button onClick={handlePost} disabled={!newPost.trim()} className="bg-primary-600 disabled:opacity-50 px-6 py-1.5 rounded-full text-white font-bold text-sm">Post</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Feed */}
                    <div className="space-y-4">
                        {posts.length === 0 ? (
                            <p className="text-center text-zinc-500 py-10">No posts yet. Start the conversation!</p>
                        ) : (
                            posts.map(post => (
                                <div key={post.id} className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <img src={post.profiles?.avatar_url} className="w-10 h-10 rounded-full bg-zinc-800" />
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{post.profiles?.username}</h4>
                                            <span className="text-[10px] text-zinc-500">{new Date(post.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{post.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'members' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
                            <img src={m.profiles?.avatar_url} className="w-12 h-12 rounded-full" />
                            <div>
                                <h4 className="font-bold text-white text-sm">{m.profiles?.username}</h4>
                                <span className={`text-[10px] uppercase font-bold ${m.role === 'owner' ? 'text-yellow-500' : m.role === 'admin' ? 'text-red-500' : 'text-zinc-500'}`}>{m.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'settings' && isAdmin && (
                <ClanSettings clan={clan} onUpdate={() => { onUpdate(); fetchDetails(); }} members={members} />
            )}
        </div>
    </div>
  );
}
