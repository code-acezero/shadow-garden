"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Shield, Users, Lock, Globe, MessageSquare, ChevronLeft, Settings, Image as ImageIcon, Flame, X, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { Clan } from './ClanSystem';
import ClanSettings from './ClanSettings';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import ClanLevelBadge, { ClanXPProgressBar, addClanXP } from './ClanLevelBadge';
import InstagramPostCard from '../InstagramPostCard';
import InstagramPostComposer from '../InstagramPostComposer';
import InstagramCommentsModal from '../InstagramCommentsModal';

export default function ClanDetails({ clan, onBack, onUpdate }: { clan: Clan, onBack: () => void, onUpdate: () => void }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [localClan, setLocalClan] = useState<Clan>(clan);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePostForComments, setActivePostForComments] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  // Slide-Over Panel States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'about' | 'members' | 'settings'>('about');

  // Automatic Emblem Color Theme Extraction
  const themeColor = React.useMemo(() => {
    const url = localClan.avatar_url || '';
    if (!url) return '#6366f1';
    
    // Extract vibrant hex color from SVG Data URI or image
    if (url.includes('svg')) {
      const hexes = url.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
      if (hexes && hexes.length > 0) {
        const vibrant = hexes.find(c => {
          const h = c.toLowerCase();
          return h !== '#000' && h !== '#000000' && h !== '#fff' && h !== '#ffffff' && h !== '#0a0a0a' && h !== '#0b0b0e' && h !== '#14141c' && h !== '#111' && h !== '#050505';
        });
        if (vibrant) return vibrant;
      }
    }
    return '#6366f1';
  }, [localClan.avatar_url]);

  useEffect(() => {
    setLocalClan(clan);
  }, [clan]);

  useEffect(() => {
    const handleLevelUp = (e: any) => {
      if (e.detail?.clanId === localClan.id) {
        toast.success(`🎉 CLAN LEVEL UP! Reached Level ${e.detail.level} (${e.detail.title})!`);
        fetchDetails();
      }
    };
    window.addEventListener('clan-level-up', handleLevelUp);
    return () => window.removeEventListener('clan-level-up', handleLevelUp);
  }, [localClan.id]);

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
        .select(`*, profiles(username, avatar_url, level, frame_id)`)
        .eq('clan_id', clan.id);
      
      setMembers(memData || []);

      const { data: postData } = await supabase
        .from('social_posts')
        .select(`*, profiles(username, avatar_url, level, frame_id)`)
        .eq('clan_id', clan.id)
        .order('created_at', { ascending: false });

      const postsWithMetadata = await Promise.all((postData || []).map(async (post: any) => {
        const { count: lc } = await supabase.from('social_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        const { count: cc } = await supabase.from('social_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        let isLiked = false;
        if (user) {
          const { data: likeData } = await supabase.from('social_likes').select('user_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
          isLiked = !!likeData;
        }

        const { data: latestComment } = await supabase.from('social_comments')
          .select('content, user:profiles(username)')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...post,
          likes_count: lc || 0,
          comments_count: cc || 0,
          is_liked_by_user: isLiked,
          latest_comment: latestComment || null,
          user: post.profiles || post.user
        };
      }));

      const { data: updatedClanData } = await supabase
        .from('clans')
        .select('*')
        .eq('id', clan.id)
        .single();
      if (updatedClanData) setLocalClan(prev => ({ ...prev, ...updatedClanData }));

      setPosts(postsWithMetadata);

      if (user) {
          const { data: conv } = await supabase.from('chat_conversations').select('id').eq('clan_id', clan.id).single();
          if (conv) {
              const { data: participant } = await supabase.from('chat_participants').select('last_read_at').eq('conversation_id', conv.id).eq('user_id', user.id).single();
              if (participant) {
                  const { count } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id).gt('created_at', participant.last_read_at || '1970-01-01T00:00:00Z');
                  setUnreadCount(count || 0);
              }
          }
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLike = async (post: any) => {
    if (!user) {
      return toast.error("Please login to like posts");
    }
    if (post.is_liked_by_user) {
      await supabase.from('social_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('social_likes').insert({ post_id: post.id, user_id: user.id });
    }
    fetchDetails();
  };

  const handleJoinRequest = async () => {
    if (!user) return toast.error("Please login to join");
    if ((clan as any).is_auto_join) {
        await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, role: 'member' });
        await addClanXP(supabase, localClan.id, 100);
        toast.success("Joined Clan! +100 CP");
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
    await addClanXP(supabase, localClan.id, 50);
    toast.success("+50 CP (Clan Points)!");
    setNewPost('');
    fetchDetails();
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/10 relative shadow-2xl">
        <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-black/60 p-2 rounded-full border border-white/15 hover:bg-white/15 text-white transition-all backdrop-blur-md shadow-lg"><ChevronLeft size={20}/></button>
        
        {/* Combined Cover & Header Area with Continuous Upward Black Gradient Blend */}
        <div className="w-full relative shrink-0 overflow-hidden bg-[#0a0a0a]">
            {/* Cover Photo Container */}
            <div className="w-full relative overflow-hidden min-h-[300px] sm:min-h-[360px] flex flex-col justify-end">
                <img
                  src={localClan.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"}
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
                
                {/* CONTINUOUS GRADIENT: Solid Black growing upward from bottom over cover image */}
                <div className="absolute inset-x-0 bottom-0 h-[120%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] via-25% to-transparent pointer-events-none z-10" />

                {/* Profile Info Header sitting INSIDE the gradient container for a SEAMLESS blend */}
                <div className="px-4 sm:px-8 pb-5 pt-16 sm:pt-20 flex flex-row items-end gap-3.5 sm:gap-5 relative z-20 bg-transparent">
                    {/* BIG EMBLEM ON THE LEFT */}
                    <div
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl border-4 border-[#0a0a0a] bg-[#0c0c10] overflow-hidden shadow-2xl relative group shrink-0 z-30 transition-all transform hover:scale-105 p-1 flex items-center justify-center"
                      style={{ boxShadow: `0 14px 40px -8px ${themeColor}75, 0 0 25px ${themeColor}40` }}
                    >
                        <img src={localClan.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${localClan.name}`} className="w-full h-full object-cover rounded-2xl" />
                    </div>

                    {/* TITLE, LEVEL MARK & TWIN SYMMETRICAL ACTION BUTTONS */}
                    <div className="flex-1 flex flex-col justify-end text-left min-w-0 pb-1">
                        {/* ROW 1: Title on Left, LEVEL BADGE WITH MARK (Bronze Novice, Celestial Realm, etc.) on Right */}
                        <div className="flex items-center justify-between gap-2.5 w-full flex-wrap sm:flex-nowrap">
                            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight truncate tracking-tight drop-shadow-md">
                                {localClan.name} 
                            </h1>

                            {/* Level Badge with Mark Title on Right Side Inline with Title */}
                            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                                <ClanLevelBadge level={(localClan as any).level || 1} showTitle={true} />
                            </div>
                        </div>

                        {/* ROW 2 (BOTTOM): Privacy & Members on Left, MANAGE & JOINED TWIN SYMMETRICAL PILLS Parallel on Right */}
                        <div className="mt-3 flex items-center justify-between gap-2 w-full flex-wrap">
                            <p className="text-zinc-300 text-[11px] sm:text-xs flex items-center gap-2 font-medium drop-shadow-sm">
                                <span className="flex items-center gap-1">
                                  {localClan.privacy === 'private' ? <Lock size={12} className="text-yellow-400"/> : <Globe size={12} className="text-emerald-400"/>} 
                                  {localClan.privacy === 'private' ? 'Private Clan' : 'Public Clan'}
                                </span>
                                <span>•</span>
                                <span>{members.length} Members</span>
                            </p>

                            {/* Action Bar Buttons: IDENTICAL TWIN SYMMETRICAL PILLS (w-[80px] h-7 px-0 text-[10px]) */}
                            <div className="flex items-center gap-2 shrink-0 ml-auto">
                                {isMember && (
                                  <div className="relative">
                                    <button
                                      onClick={async () => {
                                          const { data: conv } = await supabase.from('chat_conversations').select('id').eq('clan_id', localClan.id).single();
                                          if (conv) router.push(`/messages?chatId=${conv.id}`);
                                      }}
                                      className="w-7 h-7 bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white rounded-full flex items-center justify-center border border-white/20 shadow-sm transition-all"
                                      title="Clan Chat"
                                    >
                                      <MessageSquare size={12} />
                                    </button>
                                    {unreadCount > 0 && (
                                      <span className="absolute -top-1.5 -right-1.5 bg-primary-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full shadow-sm shadow-primary-500/50">
                                          {unreadCount > 99 ? '99+' : unreadCount}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => { setPanelTab('settings'); setIsPanelOpen(true); }}
                                    className="w-[84px] h-7 bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center justify-center border border-white/20 shadow-sm transition-all"
                                    style={{ borderColor: `${themeColor}60` }}
                                  >
                                    Manage
                                  </button>
                                )}

                                {!isMember ? (
                                  <button
                                    onClick={handleJoinRequest}
                                    className="w-[84px] h-7 text-white rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center justify-center shadow-md transition-all"
                                    style={{ backgroundColor: themeColor }}
                                  >
                                    Join
                                  </button>
                                ) : (
                                  <span className="w-[84px] h-7 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center justify-center shadow-sm">
                                    Joined
                                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Default Main Feed Container */}
        <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            <div className="max-w-2xl mx-auto space-y-4">
                {/* Create Post Input */}
                {isMember && (
                  <InstagramPostComposer
                    user={user}
                    profile={profile}
                    onAuthRequired={() => toast.error("Login required")}
                    clanThemeColor={themeColor}
                    onPostCreated={async ({ content, images }) => {
                      await supabase.from('social_posts').insert({
                        clan_id: clan.id,
                        user_id: user!.id,
                        content,
                        images
                      });
                      await addClanXP(supabase, localClan.id, 50);
                      toast.success("+50 CP (Clan Points)!");
                      fetchDetails();
                    }}
                  />
                )}
                
                {/* Feed List */}
                <div className="space-y-3 pb-20">
                    {posts.length === 0 ? (
                        <div className="text-center bg-black/40 rounded-2xl border border-white/10 p-8">
                            <MessageSquare size={28} className="mx-auto text-zinc-600 mb-2" />
                            <p className="text-zinc-400 font-bold text-xs">No posts yet</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Start the conversation in the clan!</p>
                        </div>
                    ) : (
                        posts.map(post => {
                          const normalizedPost = {
                            ...post,
                            user: post.profiles || post.user
                          };
                          return (
                            <InstagramPostCard
                              key={post.id}
                              post={normalizedPost}
                              onLike={() => handleLike(post)}
                              onComment={async () => {
                                setActivePostForComments(normalizedPost);
                                const { data } = await supabase.from('social_comments').select('*, user:profiles(*)').eq('post_id', post.id);
                                setComments(data || []);
                              }}
                              onShare={() => {
                                if (typeof window !== 'undefined') {
                                  navigator.clipboard.writeText(window.location.href);
                                  toast.success("Link copied");
                                }
                              }}
                              onDelete={() => {
                                supabase.from('social_posts').delete().eq('id', post.id).then(() => fetchDetails());
                              }}
                              currentUserId={user?.id}
                            />
                          );
                        })
                    )}
                </div>
            </div>
        </div>

        {/* SLIDE-OVER RIGHT SIDE PANEL (Slides in from right when Manage is clicked) */}
        {typeof window !== 'undefined' && isPanelOpen && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[20000] flex justify-end bg-black/80 backdrop-blur-xl">
              {/* Backdrop Click to Close */}
              <div className="absolute inset-0" onClick={() => setIsPanelOpen(false)} />

              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                className="w-full max-w-md sm:max-w-lg h-full bg-[#0c0c10] border-l border-white/15 shadow-2xl p-4 sm:p-6 flex flex-col relative z-10 overflow-y-auto custom-scrollbar"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-zinc-900 shrink-0">
                      <img src={localClan.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${localClan.name}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-white truncate leading-tight">{localClan.name}</h3>
                      <ClanLevelBadge level={(localClan as any).level || 1} showTitle={true} />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Segmented Control Tabs inside Panel */}
                <div className="py-3 shrink-0">
                  <div className="bg-[#14141c] border border-white/10 p-1 rounded-2xl flex relative shadow-inner">
                    <button
                      onClick={() => setPanelTab('about')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-1 ${
                        panelTab === 'about' ? 'text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {panelTab === 'about' && (
                        <motion.div
                          layoutId="ios-panel-tab"
                          className="absolute inset-0 bg-primary-600 rounded-xl shadow-md -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Flame size={14} /> About
                    </button>

                    <button
                      onClick={() => setPanelTab('members')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-1 ${
                        panelTab === 'members' ? 'text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {panelTab === 'members' && (
                        <motion.div
                          layoutId="ios-panel-tab"
                          className="absolute inset-0 bg-primary-600 rounded-xl shadow-md -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Users size={14} /> Members
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setPanelTab('settings')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-1 ${
                          panelTab === 'settings' ? 'text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {panelTab === 'settings' && (
                          <motion.div
                            layoutId="ios-panel-tab"
                            className="absolute inset-0 bg-primary-600 rounded-xl shadow-md -z-10"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Settings size={14} /> Manage
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel Body Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pt-2">
                  {panelTab === 'about' && (
                    <div className="space-y-4">
                      <ClanXPProgressBar level={(localClan as any).level || 1} xp={(localClan as any).xp || 0} themeColor={themeColor} />
                      <div className="bg-[#14141c] border border-white/10 p-4 rounded-2xl space-y-2 shadow-md">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">About this Clan</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">{localClan.description || "No description provided."}</p>
                      </div>
                      <div className="bg-[#14141c] border border-white/10 p-4 rounded-2xl space-y-3 shadow-md">
                        <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                          <Lock size={16} className="text-primary-400" />
                          <div>
                            <span className="font-bold text-white block">{localClan.privacy === 'private' ? 'Private Group' : 'Public Group'}</span>
                            <span className="text-[10px] text-zinc-400">{localClan.privacy === 'private' ? 'Only members can view posts and members.' : 'Anyone can view posts and members.'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {panelTab === 'members' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">Clan Roster ({members.length})</h4>
                      <div className="space-y-2">
                        {members.map(m => (
                          <div key={m.user_id} className="flex items-center justify-between p-3 rounded-2xl bg-[#14141c] border border-white/10 shadow-sm">
                            <div className="flex items-center gap-3">
                              <ProfileAvatar profile={m.profiles} className="w-9 h-9" />
                              <div>
                                <h5 className="font-bold text-white text-xs">{m.profiles?.username}</h5>
                                <span className="text-[9px] font-mono text-zinc-400">Lv. {m.profiles?.level || 1}</span>
                              </div>
                            </div>
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${m.role === 'owner' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : m.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'}`}>
                              {m.role === 'owner' ? 'Leader' : m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {panelTab === 'settings' && isAdmin && (
                    <ClanSettings
                      clan={localClan}
                      onUpdate={(updatedClan) => {
                        if (updatedClan) setLocalClan(prev => ({ ...prev, ...updatedClan }));
                        onUpdate();
                        fetchDetails();
                      }}
                      members={members}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
        {/* Instagram Comments Modal for Clan Posts */}
        <InstagramCommentsModal
          post={activePostForComments}
          comments={comments}
          onClose={() => setActivePostForComments(null)}
          onPostComment={async (text, parentId) => {
            if (!user) return;
            await supabase.from('social_comments').insert({
              post_id: activePostForComments!.id,
              user_id: user.id,
              parent_id: parentId || null,
              content: text
            });
            const { data } = await supabase.from('social_comments').select('*, user:profiles(*)').eq('post_id', activePostForComments!.id);
            setComments(data || []);
            fetchDetails();
            toast.success("Comment posted");
          }}
          user={user}
        />

        {/* Floating Glassmorphic Scroll To Top Button for Clan Feed */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={() => feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-20 right-6 z-[999] p-3 rounded-full bg-primary-600/90 hover:bg-primary-500 text-white shadow-[0_4px_25px_rgba(99,102,241,0.5)] backdrop-blur-xl border border-primary-400/40 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
              title="Scroll to top"
            >
              <ArrowUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>
    </div>
  );
}
