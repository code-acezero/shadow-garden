"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Shield, Users, Lock, Globe, MessageSquare, ChevronLeft, Settings, Image as ImageIcon, Flame, X, ArrowUp, UserCheck, Check, Sparkles, Loader2, Trash2, Camera, Move, Upload, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { Clan } from './ClanSystem';
import ClanEmblemModal, { ANIME_CLAN_EMBLEMS } from './ClanEmblemModal';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import ClanLevelBadge, { getClanBadgeInfo, ClanShieldBadge, ClanXPProgressBar, addClanXP, CLAN_RANKS } from './ClanLevelBadge';
import { getLevelColors } from '@/components/User/FantasyFrame';
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
  const [rankListModalOpen, setRankListModalOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 100) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  // Slide-Over Panel States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'about' | 'members' | 'manage'>('about');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [emblemModalOpen, setEmblemModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: clan.description || '',
    privacy: clan.privacy || 'public',
    alpha_settings: (clan as any)?.alpha_settings || {
      enabled: false,
      auto_approve_joins: false,
      moderation_rules: ''
    }
  });

  // Cover Photo Repositioning & Update State
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverYPercent, setCoverYPercent] = useState<number>((clan as any).cover_position || 50);
  const [initialCoverY, setInitialCoverY] = useState<number>(50);
  const [tempCoverSrc, setTempCoverSrc] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [coverDragStartY, setCoverDragStartY] = useState(0);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverBannerRef = useRef<HTMLDivElement>(null);

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempCoverSrc(reader.result as string);
        setInitialCoverY(coverYPercent);
        setIsRepositioning(true);
        setCoverMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isRepositioning) return;
    setIsDraggingCover(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setCoverDragStartY(clientY);
  };

  const handleCoverMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingCover || !isRepositioning || !coverBannerRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - coverDragStartY;
    const bannerHeight = coverBannerRef.current.clientHeight || 300;
    
    // Calculate percentage delta
    const percentDelta = (deltaY / bannerHeight) * -100;
    let newPercent = coverYPercent + percentDelta;
    if (newPercent < 0) newPercent = 0;
    if (newPercent > 100) newPercent = 100;

    setCoverYPercent(newPercent);
    setCoverDragStartY(clientY);
  };

  const handleCoverMouseUp = () => {
    setIsDraggingCover(false);
  };

  const handleSaveCover = async () => {
    setSaving(true);
    let finalBannerUrl = tempCoverSrc || localClan.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000";

    // If new image uploaded, convert cropped viewport to clean canvas PNG or save data URL
    if (tempCoverSrc && coverBannerRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        if (ctx) {
          ctx.clearRect(0, 0, 1200, 400);
          const aspect = img.height / img.width;
          const drawWidth = 1200;
          const drawHeight = drawWidth * aspect;
          const overflowY = Math.max(0, drawHeight - 400);
          const offsetY = -1 * (overflowY * (coverYPercent / 100));
          ctx.drawImage(img, 0, offsetY, drawWidth, drawHeight);
          finalBannerUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        const { error } = await supabase.from('clans').update({ 
          banner_url: finalBannerUrl,
          cover_position: Math.round(coverYPercent)
        }).eq('id', clan.id);

        setSaving(false);
        if (error) {
          toast.error("Failed to update cover photo");
        } else {
          toast.success("Cover photo updated!");
          setLocalClan(prev => ({ ...prev, banner_url: finalBannerUrl, cover_position: Math.round(coverYPercent) } as any));
          setIsRepositioning(false);
          setTempCoverSrc(null);
          onUpdate();
        }
      };
      img.src = tempCoverSrc;
      return;
    }

    const { error } = await supabase.from('clans').update({ 
      banner_url: finalBannerUrl,
      cover_position: Math.round(coverYPercent)
    }).eq('id', clan.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update cover position");
    } else {
      toast.success("Cover position saved!");
      setLocalClan(prev => ({ ...prev, cover_position: Math.round(coverYPercent) } as any));
      setIsRepositioning(false);
      setTempCoverSrc(null);
      onUpdate();
    }
  };

  const handleCancelCoverReposition = () => {
    setIsRepositioning(false);
    setTempCoverSrc(null);
    setCoverYPercent(initialCoverY);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const findPortal = () => {
      const el = document.getElementById('clan-sidebar-portal');
      if (el) setPortalTarget(el);
      return !!el;
    };

    if (!findPortal()) {
      const interval = setInterval(() => {
        if (findPortal()) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

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
    setFormData({
      description: clan.description || '',
      privacy: clan.privacy || 'public',
      alpha_settings: (clan as any)?.alpha_settings || {
        enabled: false,
        auto_approve_joins: false,
        moderation_rules: ''
      }
    });
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
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-clan-enter'));
    }

    if (supabase) {
      const channel = supabase
        .channel(`clan_details_${clan.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts', filter: `clan_id=eq.${clan.id}` }, () => fetchDetails())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_members', filter: `clan_id=eq.${clan.id}` }, () => fetchDetails())
        .subscribe();
      return () => { 
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow-clan-exit'));
        }
        supabase.removeChannel(channel); 
      };
    } else {
      return () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow-clan-exit'));
        }
      };
    }
  }, [clan.id]);

  const [requests, setRequests] = useState<any[]>([]);

  const handleSelectEmblem = async (url: string) => {
    setSaving(true);
    const { error } = await supabase.from('clans').update({ avatar_url: url }).eq('id', clan.id);
    setSaving(false);
    if (error) {
        toast.error("Failed to update emblem");
    } else {
        toast.success("Clan emblem updated");
        setLocalClan(prev => ({...prev, avatar_url: url}));
        onUpdate();
    }
  };

  const [alphaProfile, setAlphaProfile] = useState<any>(null);

  useEffect(() => {
    const loadAlpha = async () => {
      const { data } = await supabase.from('profiles').select('*').ilike('username', 'Alpha').single();
      if (data) setAlphaProfile(data);
    };
    loadAlpha();
  }, []);

  const handleInstallAlpha = async () => {
    setSaving(true);
    const { data: alphaUser } = await supabase.from('profiles').select('*').ilike('username', 'Alpha').single();

    const updatedAlpha = {
      enabled: true,
      auto_approve_joins: false,
      moderation_rules: 'First Shadow protocol active. Moderating discourse and preserving order.'
    };

    if (alphaUser) {
      setAlphaProfile(alphaUser);
      await supabase.from('clan_members').upsert({
        clan_id: clan.id,
        user_id: alphaUser.id,
        role: 'admin'
      });
    }

    const { error } = await supabase.from('clans')
      .update({ 
        alpha_settings: updatedAlpha,
        alpha_id: alphaUser?.id || null 
      })
      .eq('id', clan.id);
      
    setSaving(false);
    if (error) {
      toast.error("Failed to recruit Alpha AI");
    } else {
      toast.success("Alpha AI recruited to clan!");
      const newClan = { ...localClan, alpha_settings: updatedAlpha, alpha_id: alphaUser?.id };
      setLocalClan(newClan as any);
      setFormData(prev => ({ ...prev, alpha_settings: updatedAlpha }));
      fetchDetails();
      onUpdate();
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const { error } = await supabase.from('clans')
      .update({
        description: formData.description,
        privacy: formData.privacy,
        alpha_settings: formData.alpha_settings,
      })
      .eq('id', clan.id);
      
    setSaving(false);
    if (error) {
        toast.error("Failed to update clan settings");
    } else {
        toast.success("Clan settings saved successfully");
        setLocalClan(prev => ({...prev, ...formData}));
        onUpdate();
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    await supabase.from('clan_members').update({ role: newRole }).eq('clan_id', clan.id).eq('user_id', userId);
    toast.success("Member role updated");
    fetchDetails();
  };

  const kickMember = async (userId: string) => {
    if(!confirm("Are you sure you want to remove this member from the clan?")) return;
    await supabase.from('clan_members').delete().eq('clan_id', clan.id).eq('user_id', userId);
    toast.success("Member removed");
    fetchDetails();
  };

  const handleRequest = async (reqId: string, userId: string, action: 'approved' | 'rejected') => {
    await supabase.from('clan_requests').update({ status: action }).eq('id', reqId);
    if (action === 'approved') {
        await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: userId, role: 'member' });
        toast.success("Member accepted into clan");
        onUpdate();
    } else {
        toast.success("Request rejected");
    }
    fetchDetails();
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Members & Profiles robustly
      const { data: rawMemData } = await supabase
        .from('clan_members')
        .select('*')
        .eq('clan_id', clan.id);
      
      if (rawMemData && rawMemData.length > 0) {
        const uIds = rawMemData.map((m: any) => m.user_id);
        const { data: pData } = await supabase.from('profiles').select('*').in('user_id', uIds);
        const { data: pDataId } = await supabase.from('profiles').select('*').in('id', uIds);
        const allProfs = [...(pData || []), ...(pDataId || [])];

        const mappedMembers = rawMemData.map((m: any) => ({
          ...m,
          profiles: allProfs.find((p: any) => p.user_id === m.user_id || p.id === m.user_id) || { username: 'Otaku Explorer', level: 1 }
        }));
        setMembers(mappedMembers);
      } else {
        setMembers([]);
      }

      // 2. Fetch Pending Join Requests & Profiles robustly
      const { data: rawReqData } = await supabase
        .from('clan_requests')
        .select('*')
        .eq('clan_id', clan.id)
        .eq('status', 'pending');

      if (rawReqData && rawReqData.length > 0) {
        const reqUIds = rawReqData.map((r: any) => r.user_id);
        const { data: rpData } = await supabase.from('profiles').select('*').in('user_id', reqUIds);
        const { data: rpDataId } = await supabase.from('profiles').select('*').in('id', reqUIds);
        const allReqProfs = [...(rpData || []), ...(rpDataId || [])];

        const mappedRequests = rawReqData.map((r: any) => ({
          ...r,
          profiles: allReqProfs.find((p: any) => p.user_id === r.user_id || p.id === r.user_id) || { username: 'Applicant', level: 1 }
        }));
        setRequests(mappedRequests);
      } else {
        setRequests([]);
      }

      // 3. Fetch Clan Feed Posts
      const { data: postData } = await supabase
        .from('social_posts')
        .select(`*, profiles(username, avatar_url, level, role, admin_title, title, frame_id, show_level)`)
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

  const headerClanLevel = (localClan as any).level || 1;
  const headerBadgeInfo = getClanBadgeInfo(headerClanLevel);
  const headerColors = headerBadgeInfo.color;

  return (
    <div className="w-full flex flex-col h-full bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/10 relative shadow-2xl">
        <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-black/60 p-2 rounded-full border border-white/15 hover:bg-white/15 text-white transition-all backdrop-blur-md shadow-lg"><ChevronLeft size={20}/></button>
        
        {/* Combined Cover & Header Area with Continuous Upward Black Gradient Blend */}
        <div className="w-full relative shrink-0 overflow-hidden bg-[#0a0a0a]">
            {/* Cover Photo Container (Facebook Group Repositioning Style) */}
            <div 
              ref={coverBannerRef}
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768 && isAdmin && !isRepositioning) {
                  setCoverMenuOpen(prev => !prev);
                }
              }}
              onMouseDown={handleCoverMouseDown}
              onMouseMove={handleCoverMouseMove}
              onMouseUp={handleCoverMouseUp}
              onTouchStart={handleCoverMouseDown}
              onTouchMove={handleCoverMouseMove}
              onTouchEnd={handleCoverMouseUp}
              className={`w-full relative overflow-hidden min-h-[300px] sm:min-h-[360px] flex flex-col justify-end select-none group ${
                isRepositioning ? 'cursor-grab active:cursor-grabbing ring-2 ring-primary-500 z-40' : ''
              }`}
            >
                <img
                  src={tempCoverSrc || localClan.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"}
                  alt="Clan Cover"
                  draggable={false}
                  style={{ objectPosition: `center ${coverYPercent}%` }}
                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-all duration-75 pointer-events-none"
                />

                {/* Repositioning Instruction Overlay Bar (Facebook Style) */}
                {isRepositioning && (
                  <div className="absolute top-4 inset-x-4 z-50 bg-black/85 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-white pl-2">
                      <Move size={16} className="text-primary-400 animate-pulse" />
                      <span>Drag cover photo up or down to adjust position</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelCoverReposition}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCover}
                        disabled={saving}
                        className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-white/10 flex items-center gap-1.5"
                      >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} strokeWidth={3} />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Cover Photo Dropdown Trigger (For Admins Only: Hover on Desktop, Tap on Mobile) */}
                {isAdmin && !isRepositioning && (
                  <div className="absolute top-4 right-4 z-40 transition-all duration-300 md:opacity-0 md:group-hover:opacity-100">
                    <input
                      type="file"
                      ref={coverFileInputRef}
                      onChange={handleCoverFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverMenuOpen(prev => !prev);
                        }}
                        className="px-3.5 py-2 bg-black/75 hover:bg-black/90 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Camera size={15} className="text-primary-400" />
                        <span>Edit Cover Photo</span>
                      </button>

                      {coverMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0c0c12] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              coverFileInputRef.current?.click();
                              setCoverMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Upload size={14} className="text-primary-400" />
                            Upload Photo
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInitialCoverY(coverYPercent);
                              setIsRepositioning(true);
                              setCoverMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Move size={14} className="text-primary-400" />
                            Reposition Cover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTINUOUS GRADIENT: Solid Black growing upward from bottom over cover image */}
                <div className="absolute inset-x-0 bottom-0 h-[120%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] via-25% to-transparent pointer-events-none z-10" />

                {/* Profile Info Header sitting INSIDE the gradient container for a SEAMLESS blend */}
                <div className="px-4 sm:px-8 pb-5 sm:pt-20 flex flex-row items-end gap-3.5 sm:gap-5 relative z-20 bg-transparent">
                    {/* BIG EMBLEM ON THE LEFT WITH DYNAMIC GRADIENT SLIM FRAME */}
                    <div
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl bg-[#0c0c10] overflow-visible shadow-2xl relative group shrink-0 z-30 transition-all transform hover:scale-105 p-[3px]"
                      style={{
                        background: `linear-gradient(135deg, ${headerColors.from || headerColors.secondary}, ${headerColors.primary}, ${headerColors.stroke})`,
                        boxShadow: `0 14px 40px -8px ${headerColors.glow}, 0 0 25px ${headerColors.glow}`
                      }}
                    >
                        <img src={localClan.avatar_url || 'https://cdn.myanimelist.net/images/characters/8/422170.jpg'} className="w-full h-full object-cover rounded-[22px] bg-black" />
                        
                        {/* Level Shield Badge at Bottom Center of Emblem */}
                        <div 
                          className="absolute left-1/2 bottom-0 z-40 flex items-center justify-center pointer-events-none -translate-x-1/2 translate-y-1/2"
                          style={{ width: '40px', height: '44px' }}
                        >
                          <ClanShieldBadge level={headerClanLevel} size={40} className="drop-shadow-2xl" />
                        </div>
                    </div>

                    {/* TITLE, LEVEL MARK & TWIN SYMMETRICAL ACTION BUTTONS */}
                    <div className="flex-1 flex flex-col justify-end text-left min-w-0 pb-1">
                        {/* ROW 1: Title on Left, LEVEL NAME TITLE (e.g. Celestial Realm, Bronze Novice) on Right */}
                        <div className="flex items-center justify-between gap-2.5 w-full flex-wrap sm:flex-nowrap">
                            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight truncate tracking-tight drop-shadow-md">
                                {localClan.name} 
                            </h1>

                            {/* Level Name Title on Right Side Inline with Title */}
                            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                                <span 
                                  className="px-3.5 py-1 bg-black/60 rounded-full border text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md font-mono"
                                  style={{
                                    borderColor: `${headerColors.stroke}80`,
                                    color: headerColors.stroke,
                                    boxShadow: `0 0 12px ${headerColors.glow}`
                                  }}
                                >
                                  <span>{headerBadgeInfo.title}</span>
                                </span>
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
                                    onClick={() => { setPanelTab('manage'); setIsPanelOpen(true); }}
                                    className="w-[84px] h-7 bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white rounded-full font-bold text-[10px] uppercase tracking-wider flex md:hidden items-center justify-center border border-white/20 shadow-sm transition-all cursor-pointer"
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
        <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative">
            <div className="space-y-4 w-full">
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
                <div className="space-y-3">
                    {posts.length === 0 ? (
                        <div className="text-center bg-black/40 rounded-2xl border border-white/10 p-8">
                            <MessageSquare size={28} className="text-zinc-600 mb-2 w-full" />
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

        {/* SLIDE-OVER RIGHT SIDE PANEL (Desktop Sidebar Portal or Mobile Drawer) */}
        {typeof window !== 'undefined' && (() => {
          const hasAlpha = (localClan as any)?.alpha_settings?.enabled || (localClan as any)?.alpha_id;

          const renderPanelTabs = () => (
            <div className="pb-3 shrink-0">
              <div className="bg-[#14141c] border border-white/10 p-1 rounded-2xl flex relative shadow-inner">
                <button
                  onClick={() => setPanelTab('about')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-1 cursor-pointer ${
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
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-1 cursor-pointer ${
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
                    onClick={() => setPanelTab('manage')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      panelTab === 'manage' ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {panelTab === 'manage' && (
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
          );

          const renderPanelContent = () => (
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
              <AnimatePresence mode="wait">
                {/* ABOUT TAB */}
                {panelTab === 'about' && (
                  <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 pb-12 font-sans">
                    <ClanXPProgressBar level={(localClan as any).level || 1} xp={(localClan as any).xp || 0} themeColor={themeColor} />
                    
                    {/* CLAN RANK & PROGRESSION OVERVIEW */}
                    {(() => {
                      const currLevel = (localClan as any).level || 1;
                      const currInfo = getClanBadgeInfo(currLevel);
                      const currentRankIndex = CLAN_RANKS.findIndex(r => r.title === currInfo.title);
                      const nextRankObj = CLAN_RANKS[currentRankIndex + 1] || null;

                      return (
                        <div className="bg-[#0c0c12]/90 border border-white/10 p-4 rounded-2xl space-y-3 shadow-xl backdrop-blur-xl">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                              <Shield size={15} className="text-amber-400" /> Rank Intelligence & Progression
                            </h4>
                            <button
                              type="button"
                              onClick={() => setRankListModalOpen(true)}
                              className="text-[10px] font-bold text-primary-400 hover:text-primary-300 underline uppercase tracking-wider cursor-pointer"
                            >
                              View All Ranks
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                            {/* CURRENT RANK */}
                            <div className="bg-black/40 border border-white/10 p-2.5 rounded-xl flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider">Current Rank</span>
                              <div className="mt-1 flex items-center gap-1">
                                <ClanShieldBadge level={currLevel} size={18} showLevel={false} />
                                <span className="text-xs font-black text-white truncate max-w-[80px]">{currInfo.title}</span>
                              </div>
                            </div>

                            {/* NEXT RANK (CLICKABLE TO OPEN RANK PROGRESSION LIST VIEW) */}
                            <button
                              type="button"
                              onClick={() => setRankListModalOpen(true)}
                              className="bg-black/40 border border-primary-500/30 hover:border-primary-500 p-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group active:scale-95"
                            >
                              <span className="text-[9px] font-bold uppercase text-primary-400 tracking-wider flex items-center gap-0.5">
                                Next Rank <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                              </span>
                              <div className="mt-1 flex items-center gap-1">
                                {nextRankObj ? (
                                  <>
                                    <ClanShieldBadge level={nextRankObj.level} size={18} showLevel={false} />
                                    <span className="text-xs font-black text-primary-300 group-hover:underline truncate max-w-[80px]">{nextRankObj.title}</span>
                                  </>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-400">MAX RANK</span>
                                )}
                              </div>
                            </button>

                            {/* TOTAL RANKS */}
                            <div className="bg-black/40 border border-white/10 p-2.5 rounded-xl flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider">Total Ranks</span>
                              <span className="text-xs font-mono font-black text-white mt-1">10 Ranks Total</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* MEMBER CP CONTRIBUTION LEADERBOARD */}
                    <div className="bg-[#0c0c12]/90 border border-white/10 p-4 rounded-2xl space-y-3 shadow-xl backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                          <Trophy size={15} className="text-amber-400" /> Operative CP Leaderboard
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">{members.length} Members</span>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                        {members.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 py-1 font-mono">No member activity recorded yet.</p>
                        ) : (
                          members
                            .map((m) => {
                              const mUserId = m.user_id || m.profiles?.user_id || m.profiles?.id;
                              const memberPostCount = posts.filter(p => {
                                const pUserId = p.user_id || p.profiles?.user_id || p.profiles?.id;
                                return pUserId && mUserId && pUserId === mUserId;
                              }).length;
                              const actualContribution = Number((m as any).contribution_cp || (m as any).cp || (m as any).xp || 0) + (memberPostCount * 50);

                              return {
                                ...m,
                                contribution: actualContribution
                              };
                            })
                            .sort((a, b) => b.contribution - a.contribution)
                            .map((m, rankIdx) => {
                              const isOwner = localClan.owner_id === m.user_id || m.role === 'owner' || m.role === 'admin';
                              const isMod = m.role === 'moderator' || m.role === 'mod';

                              return (
                                <div
                                  key={m.user_id}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                    rankIdx === 0
                                      ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                      : rankIdx === 1
                                      ? 'bg-slate-300/10 border-slate-300/30'
                                      : rankIdx === 2
                                      ? 'bg-amber-800/10 border-amber-700/30'
                                      : 'bg-black/40 border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-5 h-5 shrink-0 flex items-center justify-center font-mono font-black text-xs">
                                      {rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `#${rankIdx + 1}`}
                                    </div>

                                    <ProfileAvatar profile={m.profiles} className="w-8 h-8 shrink-0" />

                                    <div className="min-w-0">
                                      <h5 className={`text-xs truncate ${
                                        isOwner
                                          ? 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                          : isMod
                                          ? 'text-red-400 font-bold drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                                          : 'text-white font-semibold'
                                      }`}>
                                        {m.profiles?.username || 'Operative'}
                                      </h5>
                                      <span className="text-[9px] font-mono text-zinc-400 uppercase">
                                        {m.role === 'owner' ? 'Leader' : m.role || 'Member'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 font-mono font-black text-xs text-emerald-400">
                                    +{m.contribution} <span className="text-[9px] text-zinc-400 font-normal">CP</span>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                    
                    {/* SECTOR INTEL / ABOUT THIS CLAN */}
                    <div className="bg-[#0c0c12]/90 border border-white/10 p-4.5 rounded-2xl space-y-2 shadow-xl backdrop-blur-xl">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                        <Flame size={14} className="text-primary-400" /> Sector Overview & Philosophy
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-medium">{localClan.description || "No description provided for this sector."}</p>
                    </div>

                    {/* SECTOR STATISTICS GRID */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0c0c12]/90 border border-white/10 p-3.5 rounded-2xl shadow-xl backdrop-blur-xl">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Users size={12} className="text-primary-400" /> Operatives
                        </div>
                        <div className="text-base font-black text-white font-mono">{members.length} Members</div>
                      </div>

                      <div className="bg-[#0c0c12]/90 border border-white/10 p-3.5 rounded-2xl shadow-xl backdrop-blur-xl">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <MessageSquare size={12} className="text-primary-400" /> Transmissions
                        </div>
                        <div className="text-base font-black text-white font-mono">{posts.length} Posts</div>
                      </div>
                    </div>

                    {/* SECURITY PROTOCOL MATRIX */}
                    <div className="bg-[#0c0c12]/90 border border-white/10 p-4 rounded-2xl space-y-3 shadow-xl backdrop-blur-xl">
                      <div className="flex items-center gap-3 text-xs text-zinc-300">
                        <div className="p-2.5 bg-primary-600/15 border border-primary-500/30 rounded-xl text-primary-400 shrink-0">
                          <Lock size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-white block uppercase tracking-wider text-[11px]">{localClan.privacy === 'private' ? 'Private Sector' : 'Public Domain'}</span>
                          <span className="text-[10px] text-zinc-400">{localClan.privacy === 'private' ? 'Only verified operatives can view posts and roster.' : 'Anyone in OtakuVerse can view posts and roster.'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ClanEmblemModal
                      isOpen={emblemModalOpen}
                      onClose={() => setEmblemModalOpen(false)}
                      onSelectEmblem={handleSelectEmblem}
                      currentUrl={localClan.avatar_url || ''}
                    />
                  </motion.div>
                )}

                {/* MEMBERS TAB */}
                {panelTab === 'members' && (
                  <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 pb-12 font-sans">
                    
                    {/* ALPHA AI MEMBER RECRUITMENT SECTION */}
                    {!hasAlpha ? (
                      <div className="bg-gradient-to-r from-primary-950/40 via-black to-[#0c0c12] border border-primary-500/30 p-4 rounded-2xl space-y-3 shadow-xl backdrop-blur-xl relative overflow-hidden">
                        <div className="flex items-center gap-3">
                          <ProfileAvatar 
                            profile={alphaProfile || { 
                              username: 'Alpha', 
                              avatar_url: '/images/alpha/alpha-av.png',
                              admin_title: 'First Shadow',
                              role: 'moderator'
                            }} 
                            className="w-11 h-11 shrink-0" 
                          />
                          <div>
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                              Recruit Alpha <span className="bg-primary-500/20 text-primary-300 text-[9px] px-2 py-0.5 rounded-full border border-primary-500/30 font-mono">FIRST SHADOW</span>
                            </h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Deploy Alpha AI to auto-moderate discourse and process entry requests autonomously.</p>
                          </div>
                        </div>
                        {isAdmin ? (
                          <button
                            onClick={handleInstallAlpha}
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border border-white/10 active:scale-98"
                          >
                            {saving ? <Loader2 className="animate-spin" size={14}/> : 'Recruit Alpha AI to Clan'}
                          </button>
                        ) : (
                          <div className="text-[10px] text-zinc-500 font-mono text-center py-1">Leader/Admin authorization required for Alpha recruitment.</div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-primary-950/40 via-black to-[#0c0c12] border border-primary-500/40 p-4 rounded-2xl shadow-xl space-y-2 backdrop-blur-xl relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar 
                              profile={alphaProfile || { 
                                username: 'Alpha', 
                                avatar_url: '/images/alpha/alpha-av.png',
                                admin_title: 'First Shadow',
                                role: 'moderator'
                              }} 
                              className="w-11 h-11 shrink-0" 
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-white text-xs">Alpha</h5>
                                <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">First Shadow</span>
                              </div>
                              <span className="text-[10px] text-primary-400/90 font-medium">AI Co-Leader & Moderator</span>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => setPanelTab('manage')}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Settings size={12} /> Directives
                            </button>
                          )}
                        </div>
                        {formData.alpha_settings?.moderation_rules && (
                          <p className="text-[10px] text-zinc-400 bg-black/40 p-2.5 rounded-xl border border-white/5 italic font-mono mt-1">
                            "{formData.alpha_settings.moderation_rules}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* PENDING JOIN REQUESTS (FOR ADMIN / OWNER) */}
                    {isAdmin && (
                      <div className="bg-[#0c0c12]/90 border border-white/10 p-4 rounded-2xl shadow-xl space-y-3 backdrop-blur-xl">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-2"><UserCheck size={14} className="text-primary-400" /> Pending Join Requests</span>
                          <span className="bg-primary-600/30 text-primary-300 border border-primary-500/40 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">{requests.length}</span>
                        </h4>
                        
                        {requests.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 py-1">No pending membership requests right now.</p>
                        ) : (
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                            {requests.map(r => (
                              <div key={r.id} className="flex justify-between items-center bg-[#050508] p-2.5 rounded-xl border border-white/5 text-xs hover:border-white/15 transition-all">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <ProfileAvatar profile={r.profiles} className="w-8 h-8 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-xs text-white font-bold truncate block">{r.profiles?.username}</span>
                                    <span className="text-[9px] font-mono text-zinc-500">Lv. {r.profiles?.level || 1}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <button onClick={() => handleRequest(r.id, r.user_id, 'approved')} className="bg-green-500/15 text-green-400 hover:bg-green-500 hover:text-white p-2 rounded-xl transition-all border border-green-500/20 active:scale-95 cursor-pointer"><Check size={13}/></button>
                                  <button onClick={() => handleRequest(r.id, r.user_id, 'rejected')} className="bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all border border-red-500/20 active:scale-95 cursor-pointer"><X size={13}/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CLAN ROSTER */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users size={14} className="text-primary-400" /> Operative Roster</span>
                        <span className="text-[10px] font-mono text-zinc-500">{members.length} members</span>
                      </h4>
                      <div className="space-y-2">
                        {members.map(m => (
                          <div key={m.user_id} className="flex items-center justify-between p-3 rounded-2xl bg-[#0c0c12]/90 border border-white/10 shadow-md hover:border-white/20 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                              <ProfileAvatar profile={m.profiles} className="w-9 h-9 shrink-0" />
                              <div className="min-w-0">
                                <h5 className="font-bold text-white text-xs truncate">{m.profiles?.username}</h5>
                                <span className="text-[9px] font-mono text-zinc-400">Lv. {m.profiles?.level || 1}</span>
                              </div>
                            </div>
                            {isAdmin && m.role !== 'owner' ? (
                              <div className="flex items-center gap-2 shrink-0">
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
                            ) : (
                              <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${m.role === 'owner' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]' : m.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'}`}>
                                {m.role === 'owner' ? 'Leader' : m.role}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* MANAGE TAB */}
                {panelTab === 'manage' && isAdmin && (
                  <motion.div key="manage" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 pb-12 font-sans">
                    
                    {/* CLAN GENERAL SETTINGS */}
                    <div className="bg-[#0c0c12]/90 border border-white/10 p-4.5 rounded-2xl space-y-4 shadow-xl backdrop-blur-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                          <Settings size={14} className="text-primary-400" /> General Clan Settings
                        </h4>
                      </div>

                      {/* ACTIVE EMBLEM MANAGEMENT CARD */}
                      <div className="space-y-3 pt-1 border-b border-white/5 pb-4">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1">
                          Clan Sigil & Emblem
                        </label>
                        <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 shadow-inner text-center gap-3">
                          <div className="relative mb-1">
                            <img 
                              src={localClan.avatar_url || '/emblems/sg_emblem.png'} 
                              alt="Clan Emblem" 
                              className="w-20 h-20 rounded-2xl border-2 border-primary-500/50 object-cover shadow-[0_0_25px_rgba(220,38,38,0.3)]" 
                            />
                            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 uppercase tracking-wider font-mono shadow-md whitespace-nowrap">
                              Active Sigil
                            </span>
                          </div>

                          <div className="pt-1">
                            <p className="text-[10px] text-zinc-400">Select from verified presets or crop a custom upload</p>
                          </div>

                          {/* Button positioned under the active emblem */}
                          <button 
                            type="button"
                            onClick={() => setEmblemModalOpen(true)} 
                            className="w-full max-w-xs py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-white/10 flex items-center justify-center gap-2"
                          >
                            <ImageIcon size={14} /> Change / Crop Emblem
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1">Description</label>
                          <textarea 
                            value={formData.description} 
                            onChange={e => setFormData({ ...formData, description: e.target.value })} 
                            placeholder="State the clan's purpose, rules, or philosophy..."
                            className="w-full bg-black/40 border border-white/5 focus:border-primary-500/50 rounded-[16px] p-3 text-xs text-white placeholder-zinc-700 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary-500/10 transition-all font-medium custom-scrollbar shadow-inner" 
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1 flex items-center gap-1.5">
                            <Lock size={12} className="text-primary-500" /> Privacy Matrix
                          </label>
                          <select 
                            value={formData.privacy} 
                            onChange={e => setFormData({ ...formData, privacy: e.target.value })} 
                            className="w-full bg-black/40 border border-white/5 rounded-[16px] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer font-medium appearance-none shadow-inner"
                          >
                              <option value="public">Public (Open for discovery)</option>
                              <option value="private">Private (Invite & approval only)</option>
                          </select>
                      </div>

                      <button 
                        onClick={handleSaveConfig} 
                        disabled={saving} 
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-500 hover:to-primary-700 text-white font-black py-3 rounded-[14px] mt-2 flex justify-center items-center text-xs uppercase tracking-[0.2em] shadow-md transition-all cursor-pointer border border-white/10"
                      >
                          {saving ? <Loader2 className="animate-spin" size={16}/> : 'Save General Settings'}
                      </button>
                    </div>

                    {/* ALPHA MANAGEMENT & RULES SECTION (ONLY IF ALPHA IS ADDED) */}
                    {hasAlpha && (
                      <div className="bg-[#0c0c12]/90 border border-primary-500/30 p-4.5 rounded-2xl space-y-4 shadow-xl backdrop-blur-xl relative overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={14} className="text-primary-400" /> Alpha AI Directives & Rules
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/5">
                            <div>
                              <h5 className="text-white font-bold text-xs">Autonomous Entry</h5>
                              <p className="text-[9px] text-zinc-400">Alpha reviews and processes join requests automatically.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, alpha_settings: { ...formData.alpha_settings, auto_approve_joins: !formData.alpha_settings?.auto_approve_joins }})}
                              className={`w-11 h-6 rounded-full relative transition-all border ${formData.alpha_settings?.auto_approve_joins ? 'bg-primary-600 border-primary-400' : 'bg-zinc-800 border-white/10'}`}
                            >
                              <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform ${formData.alpha_settings?.auto_approve_joins ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest block pl-1">Primary Directives & Rules</label>
                            <textarea 
                              value={formData.alpha_settings?.moderation_rules || ''} 
                              onChange={e => setFormData({ ...formData, alpha_settings: { ...formData.alpha_settings, moderation_rules: e.target.value }})}
                              placeholder="e.g., 'Delete spoiler posts.', 'Reject users below level 3.', 'Keep discussions respectful.'"
                              className="w-full bg-black/40 border border-primary-500/20 rounded-[16px] p-3 text-xs text-white placeholder-zinc-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors custom-scrollbar font-medium shadow-inner" 
                            />
                          </div>

                          <button 
                            onClick={handleSaveConfig} 
                            disabled={saving} 
                            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3 rounded-[14px] flex justify-center items-center text-xs uppercase tracking-[0.2em] shadow-lg transition-all cursor-pointer"
                          >
                            {saving ? <Loader2 className="animate-spin" size={16}/> : 'Transmit Directives'}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );

          return (
            <>
              {/* Desktop Portal View */}
              {portalTarget && createPortal(
                <div className="w-full h-full bg-[#050505] p-4 flex flex-col relative z-10 overflow-y-auto custom-scrollbar font-sans">
                  {renderPanelTabs()}
                  {renderPanelContent()}
                </div>,
                portalTarget
              )}

              {/* Mobile Slide-Over Drawer View */}
              {isPanelOpen && createPortal(
                <AnimatePresence>
                  <div className="fixed inset-0 z-[20000] flex justify-end bg-black/80 backdrop-blur-xl font-sans">
                    <div className="absolute inset-0" onClick={() => setIsPanelOpen(false)} />

                    <motion.div
                      initial={{ x: "100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: "100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 280 }}
                      className="w-full max-w-md sm:max-w-lg md:max-w-2xl h-full bg-[#0c0c10] border-l border-white/15 shadow-2xl p-4 sm:p-6 flex flex-col relative z-10 overflow-y-auto custom-scrollbar"
                    >
                      <div className="flex items-center justify-between pb-2 shrink-0 border-b border-white/10 mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Clan Operations</span>
                        <button
                          onClick={() => setIsPanelOpen(false)}
                          className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {renderPanelTabs()}
                      {renderPanelContent()}
                    </motion.div>
                  </div>
                </AnimatePresence>,
                document.body
              )}
            </>
          );
        })()}
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

        {/* Clean White Scroll To Top Arrow Button for Clan Posts Feed */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={() => feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-20 right-6 lg:right-[340px] xl:right-[420px] z-[9999] p-3.5 rounded-full bg-white/25 hover:bg-white/40 text-white shadow-[0_4px_25px_rgba(255,255,255,0.35)] backdrop-blur-xl border border-white/50 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-2xl"
              title="Scroll to top of feed"
            >
              <ArrowUp size={22} className="text-white" strokeWidth={2.8} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Global Emblem Library & Studio Modal */}
        <ClanEmblemModal
          isOpen={emblemModalOpen}
          onClose={() => setEmblemModalOpen(false)}
          onSelectEmblem={handleSelectEmblem}
          currentUrl={localClan.avatar_url || ''}
        />

        {/* RANK PROGRESSION LIST VIEW MODAL */}
        {rankListModalOpen && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0d0d14] border border-white/15 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  <Shield className="text-amber-400" size={22} />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Clan Rank Progression</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">10 Total Clan Ranks</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRankListModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Ranks List */}
              <div className="p-4 overflow-y-auto space-y-2.5 custom-scrollbar flex-1">
                {CLAN_RANKS.map((rk) => {
                  const rkInfo = getClanBadgeInfo(rk.level);
                  const isCurrent = rkInfo.title === getClanBadgeInfo((localClan as any).level || 1).title;

                  return (
                    <div
                      key={rk.level}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-primary-950/50 border-primary-500/80 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-primary-500'
                          : 'bg-black/40 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <ClanShieldBadge level={rk.level} size={38} showLevel={false} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">{rk.title}</h4>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40 flex items-center gap-1">
                                <Check size={10} /> Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 font-medium leading-snug">{rk.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono font-black text-xs text-amber-400">
                        {rk.cpRequired.toLocaleString()} <span className="text-[9px] text-zinc-400 font-normal">CP</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black/40 text-center">
                <button
                  type="button"
                  onClick={() => setRankListModalOpen(false)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider border border-white/15 transition-all cursor-pointer"
                >
                  Close Rank Intelligence
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
