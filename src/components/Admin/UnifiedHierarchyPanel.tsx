'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { executeAdminAction } from '@/lib/adminApi';
import { 
  Crown, Shield, Sword, Plus, X, UserCheck, Lock, UserMinus, RefreshCw, 
  ChevronDown, Search, Award, Gift, ArrowUpCircle, AlertTriangle, 
  Check, Sliders, Coins, Eye, Ban, CheckCircle, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import FantasyFrame from '@/components/User/FantasyFrame';
import { ALL_ATELIER_STORE_FRAMES } from '@/lib/atelierFrames';
import { 
  ALL_TITLES, 
  getFrameForTitle, 
  isGuildMaster, 
  addFormerTitle 
} from '@/lib/userTitles';
import { saveCustomTitleGreetings } from '@/lib/alphaGreetings';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export interface MemberProfile {
  id: string;
  username: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  admin_title?: string | null;
  title?: string | null;
  equipped_title?: string | null;
  level?: number;
  xp?: number;
  coins?: number;
  frame_id?: string | null;
  purchased_frames?: string[];
  unlocked_titles?: string[];
  settings?: Record<string, any>;
  banned_until?: string | null;
  is_banned?: boolean;
}

const DEFAULT_BOARD_TITLES = [
  'Abyss Archon',
  'Void Monarch',
  'Eclipse Blade',
  'Umbral Lord',
  'Dark Primarch'
];

const DEFAULT_COUNCIL_TITLES = [
  'First Shadow',
  'Second Shadow',
  'Third Shadow',
  'Fourth Shadow',
  'Fifth Shadow',
  'Sixth Shadow',
  'Seventh Shadow',
  'Eighth Shadow',
  'Ninth Shadow',
  'Tenth Shadow'
];

export default function UnifiedHierarchyPanel() {
  const { user: currentUser, profile: currentUserProfile, refreshSession } = useAuth();
  const amIGuildMaster = isGuildMaster(currentUserProfile || currentUser);
  const isAdmin = currentUserProfile?.role === 'admin' || amIGuildMaster;

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'roster'>('hierarchy');
  const [staffSubFilter, setStaffSubFilter] = useState<'all' | 'admin' | 'mod'>('all');
  const [rosterRoleFilter, setRosterRoleFilter] = useState<'ALL' | 'ADMIN' | 'MOD' | 'MEMBER' | 'BANNED'>('ALL');

  // Custom titles
  const [customAdminTitles, setCustomAdminTitles] = useState<string[]>([]);
  const [customModTitles, setCustomModTitles] = useState<string[]>([]);

  // Modals state
  const [successionOpen, setSuccessionOpen] = useState(false);
  const [successionTarget, setSuccessionTarget] = useState<MemberProfile | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Appoint / Promote Official Modal
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<MemberProfile | null>(null);
  const [promoteRole, setPromoteRole] = useState<'admin' | 'moderator'>('admin');
  const [assignedStaffTitle, setAssignedStaffTitle] = useState('Void Monarch');
  const [customStaffTitle, setCustomStaffTitle] = useState('');
  const [giftedFrameId, setGiftedFrameId] = useState('void_monarch');
  const [isPromotingStaff, setIsPromotingStaff] = useState(false);

  // Level Up Modal
  const [levelOpen, setLevelOpen] = useState(false);
  const [levelTarget, setLevelTarget] = useState<MemberProfile | null>(null);
  const [targetLevel, setTargetLevel] = useState(1);
  const [isSavingLevel, setIsSavingLevel] = useState(false);

  // Gift Coins Modal
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [coinsTarget, setCoinsTarget] = useState<MemberProfile | null>(null);
  const [giftCoinsAmount, setGiftCoinsAmount] = useState(1000);
  const [giftCoinsNote, setGiftCoinsNote] = useState('');
  const [isGiftingCoins, setIsGiftingCoins] = useState(false);

  // Bestow Title Modal
  const [titleOpen, setTitleOpen] = useState(false);
  const [titleTarget, setTitleTarget] = useState<MemberProfile | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('Void Monarch');
  const [customTitleText, setCustomTitleText] = useState('');
  const [isBestowingTitle, setIsBestowingTitle] = useState(false);

  // Gift Profile Frame Modal
  const [frameOpen, setFrameOpen] = useState(false);
  const [frameTarget, setFrameTarget] = useState<MemberProfile | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState('iron');
  const [frameSearch, setFrameSearch] = useState('');
  const [isGiftingFrame, setIsGiftingFrame] = useState(false);

  // Warn / Moderation Modal
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTarget, setWarnTarget] = useState<MemberProfile | null>(null);
  const [warnMsg, setWarnMsg] = useState('');

  // Fetch all profiles
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(600);

      if (error) {
        console.warn('Error fetching profiles:', error);
      }

      if (data) {
        const sorted = data.sort((a: any, b: any) => {
          if (a.id === currentUser?.id) return -1;
          if (b.id === currentUser?.id) return 1;
          const roleWeight = (r: string) => r === 'leader' || r === 'master' ? 4 : r === 'admin' ? 3 : r === 'moderator' ? 2 : 1;
          return roleWeight(b.role) - roleWeight(a.role);
        });
        setMembers(sorted);
      }
    } catch (err) {
      console.warn('Hierarchy fetch error handled:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    if (typeof window !== 'undefined') {
      const savedAdminTitles = localStorage.getItem('shadow_custom_admin_titles');
      const savedModTitles = localStorage.getItem('shadow_custom_mod_titles');
      if (savedAdminTitles) setCustomAdminTitles(JSON.parse(savedAdminTitles));
      if (savedModTitles) setCustomModTitles(JSON.parse(savedModTitles));
    }
  }, [currentUser]);

  // Derived groups
  const guildMaster = useMemo(() => {
    return members.find(m => isGuildMaster(m) || m.username === 'Ace_Zero') || members.find(m => m.role === 'leader');
  }, [members]);

  const admins = useMemo(() => {
    return members.filter(m => m.role === 'admin' && !isGuildMaster(m) && m.username !== 'Ace_Zero');
  }, [members]);

  const moderators = useMemo(() => {
    return members.filter(m => m.role === 'moderator');
  }, [members]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return members.filter(m => {
      // Role filter
      if (rosterRoleFilter === 'ADMIN' && m.role !== 'admin' && !isGuildMaster(m)) return false;
      if (rosterRoleFilter === 'MOD' && m.role !== 'moderator') return false;
      if (rosterRoleFilter === 'MEMBER' && (m.role === 'admin' || m.role === 'moderator' || isGuildMaster(m))) return false;
      if (rosterRoleFilter === 'BANNED' && !m.is_banned && !m.banned_until) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const usernameMatch = m.username?.toLowerCase().includes(q);
        const titleMatch = (m.admin_title || m.equipped_title || m.title || '').toLowerCase().includes(q);
        const emailMatch = m.email?.toLowerCase().includes(q);
        return usernameMatch || titleMatch || emailMatch;
      }
      return true;
    });
  }, [members, rosterRoleFilter, search]);

  // Available Store Frames (exclusives filtered for general gifting)
  const availableStoreFrames = useMemo(() => {
    return ALL_ATELIER_STORE_FRAMES.filter(f => {
      // The Eternal is reserved strictly for active Guild Master
      if (f.id === 'admin' || f.id === 'eternal' || f.id === 'the_eternal' || f.id === 'the-eternal') return false;
      if (!frameSearch.trim()) return true;
      return f.name.toLowerCase().includes(frameSearch.toLowerCase()) || f.id.toLowerCase().includes(frameSearch.toLowerCase());
    });
  }, [frameSearch]);

  // --- ACTIONS ---

  // 1. Pass Down Mantle (Succession Protocol)
  const handlePassSuccession = async () => {
    if (!successionTarget || !currentUser) return;
    setIsTransferring(true);
    try {
      // Former Guild Master keeps permanent honor
      await addFormerTitle(currentUser.id, 'Former Guild Master');
      
      const { data: currP } = await supabase.from('profiles').select('settings, unlocked_titles').eq('id', currentUser.id).single();
      const currSettings = currP?.settings || {};
      const currTitles = Array.isArray(currP?.unlocked_titles) ? currP.unlocked_titles : [];

      await executeAdminAction('update_profile', {
        userId: currentUser.id,
        updates: {
          role: 'admin',
          title: 'Former Guild Master',
          admin_title: 'Former Guild Master',
          equipped_title: 'Former Guild Master',
          unlocked_titles: Array.from(new Set([...currTitles, 'Former Guild Master'])),
          settings: { ...currSettings, is_guild_master: false, equipped_title: 'Former Guild Master' }
        }
      });

      // New Guild Master receives Supreme Authority
      const { data: succP } = await supabase.from('profiles').select('settings, unlocked_titles, purchased_frames').eq('id', successionTarget.id).single();
      const succSettings = succP?.settings || {};
      const succTitles = Array.isArray(succP?.unlocked_titles) ? succP.unlocked_titles : [];
      const succFrames = Array.isArray(succP?.purchased_frames) ? succP.purchased_frames : ['none'];

      await executeAdminAction('update_profile', {
        userId: successionTarget.id,
        updates: {
          role: 'leader',
          title: 'Shadow',
          admin_title: 'Shadow',
          equipped_title: 'Shadow',
          level: 100,
          xp: 999999,
          frame_id: 'admin',
          purchased_frames: Array.from(new Set([...succFrames, 'admin'])),
          unlocked_titles: Array.from(new Set([...succTitles, 'Shadow', 'Guild Master'])),
          settings: { ...succSettings, is_guild_master: true, equipped_title: 'Shadow' }
        }
      });

      // Global announcement
      await supabase.from('social_posts').insert({
        user_id: '5d38da6e-b568-4499-ab67-f588354add5d', // Alpha AI
        content: `👑 The Mantle of Lord Shadow has been officially passed down!\n\nAll operatives salute our new sovereign Guild Master: @${successionTarget.username}! May the shadows remain eternal under their reign.`,
        images: successionTarget.avatar_url ? [successionTarget.avatar_url] : []
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(`shadow_equipped_title_${currentUser.id}`, 'Former Guild Master');
        localStorage.setItem(`shadow_equipped_title_${successionTarget.id}`, 'Shadow');
        window.dispatchEvent(new CustomEvent('shadow-title-updated', { detail: { title: 'Former Guild Master' } }));
      }

      toast.success(`Guild Master mantle passed down to @${successionTarget.username}!`);
      setSuccessionOpen(false);
      await fetchMembers();
      refreshSession();
    } catch (err: any) {
      toast.error(err.message || 'Succession protocol failed');
    } finally {
      setIsTransferring(false);
    }
  };

  // 2. Appoint / Promote Official
  const handlePromoteOfficial = async () => {
    if (!promoteTarget) return;
    setIsPromotingStaff(true);
    try {
      const isPromotingToAdmin = promoteRole === 'admin';
      const finalTitle = assignedStaffTitle === 'custom' ? customStaffTitle.trim() : assignedStaffTitle;
      const finalFrame = assignedStaffTitle === 'custom' 
        ? giftedFrameId 
        : (getFrameForTitle(finalTitle, promoteRole) || giftedFrameId || 'none');
      const bonusCoins = isPromotingToAdmin ? 10000 : 5000;

      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('settings, coins, level, xp, purchased_frames, unlocked_titles')
        .eq('id', promoteTarget.id)
        .single();

      const currentSettings = memberProfile?.settings || {};
      const currentFrames = Array.isArray(memberProfile?.purchased_frames) ? memberProfile.purchased_frames : ['none'];
      const currentTitles = Array.isArray(memberProfile?.unlocked_titles) ? memberProfile.unlocked_titles : [];

      const newFrames = Array.from(new Set([...currentFrames, finalFrame]));
      const newTitles = Array.from(new Set([...currentTitles, finalTitle]));
      const newCoins = (Number(memberProfile?.coins) || 0) + bonusCoins;

      const updateData: any = {
        role: promoteRole,
        admin_title: finalTitle,
        title: finalTitle,
        equipped_title: finalTitle,
        coins: newCoins,
        frame_id: finalFrame,
        purchased_frames: newFrames,
        unlocked_titles: newTitles,
        settings: { ...currentSettings, equipped_title: finalTitle }
      };

      if (isPromotingToAdmin) {
        updateData.level = 100;
        updateData.xp = 999999;
      }

      await executeAdminAction('update_profile', {
        userId: promoteTarget.id,
        updates: updateData
      });

      // Dispatched promotion notification from Alpha with claim link
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: promoteTarget.id,
          type: 'system',
          content: `Promotion Gift from Guild Master: You have been appointed to ${isPromotingToAdmin ? 'Board of Darkness' : 'Council of Shadows'} with the sacred title "${finalTitle}"! Claim your ${bonusCoins.toLocaleString()} Coins and Profile Frame.`,
          link: `#claim:${JSON.stringify({
            coins: bonusCoins,
            frame_id: finalFrame,
            title: finalTitle
          })}`,
          is_read: false
        }]
      });

      // Congratulatory announcement post from Alpha
      await supabase.from('social_posts').insert({
        user_id: '5d38da6e-b568-4499-ab67-f588354add5d',
        content: `By decree of Shadow Garden, @${promoteTarget.username} has been elevated to ${isPromotingToAdmin ? 'the Board of Darkness' : 'the Council of Shadows'} with the title [${finalTitle}]! 🗡️`,
        images: promoteTarget.avatar_url ? [promoteTarget.avatar_url] : []
      });

      // If custom title, save Alpha greetings
      if (assignedStaffTitle === 'custom' && customStaffTitle.trim()) {
        await saveCustomTitleGreetings(customStaffTitle.trim());
      }

      toast.success(`Promoted @${promoteTarget.username} to ${promoteRole.toUpperCase()} with ${bonusCoins.toLocaleString()} coins!`);
      setPromoteOpen(false);
      setCustomStaffTitle('');
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Promotion failed');
    } finally {
      setIsPromotingStaff(false);
    }
  };

  // 3. Demote Official (Preserves former honor)
  const handleDemoteOfficial = async (member: MemberProfile) => {
    try {
      const formerTitleName = member.admin_title ? `Former ${member.admin_title}` : (member.role === 'admin' ? 'Former Admin' : 'Former Moderator');
      await addFormerTitle(member.id, formerTitleName);

      const { data: p } = await supabase.from('profiles').select('settings, unlocked_titles').eq('id', member.id).single();
      const currSettings = p?.settings || {};
      const currTitles = Array.isArray(p?.unlocked_titles) ? p.unlocked_titles : [];

      await executeAdminAction('update_profile', {
        userId: member.id,
        updates: {
          role: 'user',
          admin_title: null,
          title: formerTitleName,
          equipped_title: formerTitleName,
          unlocked_titles: Array.from(new Set([...currTitles, formerTitleName])),
          settings: { ...currSettings, equipped_title: formerTitleName }
        }
      });

      toast.success(`Demoted @${member.username}. Title preserved as "${formerTitleName}" in vault.`);
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Demotion failed');
    }
  };

  // 4. Level & XP Update
  const handleSaveLevel = async () => {
    if (!levelTarget) return;
    setIsSavingLevel(true);
    try {
      const calculatedXp = targetLevel === 100 ? 999999 : 50 * (targetLevel - 1) * targetLevel;
      await executeAdminAction('update_profile', {
        userId: levelTarget.id,
        updates: {
          level: targetLevel,
          xp: calculatedXp
        }
      });

      toast.success(`Set @${levelTarget.username} to Level ${targetLevel} (${calculatedXp.toLocaleString()} XP)`);
      setLevelOpen(false);
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update level');
    } finally {
      setIsSavingLevel(false);
    }
  };

  // 5. Gift Treasury Coins
  const handleGiftCoins = async () => {
    if (!coinsTarget || giftCoinsAmount <= 0) return;
    setIsGiftingCoins(true);
    try {
      const newCoins = (Number(coinsTarget.coins) || 0) + giftCoinsAmount;
      await executeAdminAction('update_profile', {
        userId: coinsTarget.id,
        updates: { coins: newCoins }
      });

      // Dispatched notification from Alpha
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: coinsTarget.id,
          type: 'system',
          content: `A gift from Guild Master: You have received ${giftCoinsAmount.toLocaleString()} Coins! ${giftCoinsNote ? `"${giftCoinsNote}"` : ''}`,
          link: `#claim:${JSON.stringify({ coins: giftCoinsAmount })}`,
          is_read: false
        }]
      });

      toast.success(`Gifted ${giftCoinsAmount.toLocaleString()} coins to @${coinsTarget.username}`);
      setCoinsOpen(false);
      setGiftCoinsNote('');
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to gift coins');
    } finally {
      setIsGiftingCoins(false);
    }
  };

  // 6. Bestow Title
  const handleBestowTitle = async () => {
    if (!titleTarget) return;
    const finalTitle = selectedTitle === 'custom' ? customTitleText.trim() : selectedTitle;
    if (!finalTitle) {
      toast.error('Please enter a valid title');
      return;
    }
    setIsBestowingTitle(true);
    try {
      const currentUnlocked = Array.isArray(titleTarget.unlocked_titles) ? titleTarget.unlocked_titles : [];
      const newUnlocked = Array.from(new Set([...currentUnlocked, finalTitle]));

      const { data: p } = await supabase.from('profiles').select('settings').eq('id', titleTarget.id).single();
      const currentSettings = p?.settings || {};

      await executeAdminAction('update_profile', {
        userId: titleTarget.id,
        updates: {
          admin_title: finalTitle,
          title: finalTitle,
          equipped_title: finalTitle,
          unlocked_titles: newUnlocked,
          settings: { ...currentSettings, equipped_title: finalTitle }
        }
      });

      // Alpha notification with claim button
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: titleTarget.id,
          type: 'system',
          content: `A gift from Guild Master: You have been bestowed the title "${finalTitle}"! Claim to equip.`,
          link: `#claim:${JSON.stringify({ title: finalTitle })}`,
          is_read: false
        }]
      });

      if (selectedTitle === 'custom') {
        await saveCustomTitleGreetings(finalTitle);
      }

      toast.success(`Bestowed "${finalTitle}" to @${titleTarget.username}`);
      setTitleOpen(false);
      setCustomTitleText('');
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to bestow title');
    } finally {
      setIsBestowingTitle(false);
    }
  };

  // 7. Gift Profile Frame
  const handleGiftFrame = async () => {
    if (!frameTarget || !selectedFrameId) return;
    setIsGiftingFrame(true);
    try {
      const currentFrames = Array.isArray(frameTarget.purchased_frames) ? frameTarget.purchased_frames : ['none'];
      const newFrames = Array.from(new Set([...currentFrames, selectedFrameId]));

      await executeAdminAction('update_profile', {
        userId: frameTarget.id,
        updates: {
          purchased_frames: newFrames,
          frame_id: selectedFrameId
        }
      });

      const frameObj = ALL_ATELIER_STORE_FRAMES.find(f => f.id === selectedFrameId);
      const frameName = frameObj?.name || selectedFrameId;

      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: frameTarget.id,
          type: 'system',
          content: `A gift from Guild Master: You have received the "${frameName}" Profile Frame! Claim to equip.`,
          link: `#claim:${JSON.stringify({ frame_id: selectedFrameId })}`,
          is_read: false
        }]
      });

      toast.success(`Gifted "${frameName}" frame to @${frameTarget.username}`);
      setFrameOpen(false);
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to gift frame');
    } finally {
      setIsGiftingFrame(false);
    }
  };

  // 8. Administrative Moderation (Ban / Unban / Warn)
  const handleToggleBan = async (member: MemberProfile) => {
    const willBan = !member.is_banned;
    try {
      await executeAdminAction('update_profile', {
        userId: member.id,
        updates: {
          is_banned: willBan,
          banned_until: willBan ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
        }
      });

      toast.success(willBan ? `@${member.username} has been exiled` : `@${member.username} exile revoked`);
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleSendWarning = async () => {
    if (!warnTarget || !warnMsg.trim()) return;
    try {
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: warnTarget.id,
          type: 'warning',
          content: `Guild Disciplinary Notice: ${warnMsg.trim()}`,
          is_read: false
        }]
      });
      toast.success(`Disciplinary notice sent to @${warnTarget.username}`);
      setWarnOpen(false);
      setWarnMsg('');
    } catch (err: any) {
      toast.error('Failed to dispatch warning');
    }
  };

  return (
    <div className="w-full space-y-6 select-none font-sans">
      {/* ─── APEX SOVEREIGN HEADER: THE GUILD MASTER ─── */}
      <div className="relative w-full rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ProfileAvatar profile={guildMaster} className="w-14 h-14 rounded-2xl border border-amber-500/40" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  Apex Sovereign • 1 Worldwide
                </span>
                <span className="text-xs text-zinc-500 font-mono">Level 100</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-lemon font-bold text-white tracking-wide flex items-center gap-2">
                {guildMaster?.username || 'Ace_Zero'}
                <Crown size={20} className="text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Title: <span className="text-amber-300 font-semibold">{guildMaster?.admin_title || guildMaster?.title || 'Shadow'}</span> • Frame: <span className="text-purple-300 font-medium">The Eternal (Exclusive)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <Button
              onClick={fetchMembers}
              variant="ghost"
              className="h-10 w-10 p-0 text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.06] rounded-xl cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </Button>

            {amIGuildMaster && (
              <Button
                onClick={() => setSuccessionOpen(true)}
                className="h-10 px-4 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.12] rounded-xl cursor-pointer transition-all"
              >
                Pass Down Mantle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── PRIMARY TABS: HIERARCHY COMMAND vs ADVENTURERS ROSTER ─── */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={cn(
              "px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer",
              activeTab === 'hierarchy'
                ? "bg-purple-600/20 text-purple-200 border border-purple-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            Staff Command
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={cn(
              "px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'roster'
                ? "bg-purple-600/20 text-purple-200 border border-purple-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <span>All Adventurers</span>
            <span className="text-[10px] text-zinc-500 font-mono">({members.length})</span>
          </button>
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or title..."
            className="pl-9 h-9 text-xs bg-zinc-950/60 border-white/[0.08] text-white rounded-xl focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* ─── TAB 1: STAFF COMMAND (BOARD OF DARKNESS & COUNCIL OF SHADOWS) ─── */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setStaffSubFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  staffSubFilter === 'all' ? "bg-white/10 text-white font-medium" : "text-zinc-400 hover:text-white"
                )}
              >
                All Staff ({admins.length + moderators.length})
              </button>
              <button
                type="button"
                onClick={() => setStaffSubFilter('admin')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  staffSubFilter === 'admin' ? "bg-white/10 text-white font-medium" : "text-zinc-400 hover:text-white"
                )}
              >
                Board of Darkness ({admins.length})
              </button>
              <button
                type="button"
                onClick={() => setStaffSubFilter('mod')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  staffSubFilter === 'mod' ? "bg-white/10 text-white font-medium" : "text-zinc-400 hover:text-white"
                )}
              >
                Council of Shadows ({moderators.length})
              </button>
            </div>

            {amIGuildMaster && (
              <Button
                onClick={() => {
                  setPromoteTarget(null);
                  setPromoteRole('admin');
                  setAssignedStaffTitle('Void Monarch');
                  setPromoteOpen(true);
                }}
                className="h-9 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
              >
                <Plus size={14} /> Appoint Official
              </Button>
            )}
          </div>

          {/* Staff Roster Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...admins, ...moderators]
              .filter(m => {
                if (staffSubFilter === 'admin') return m.role === 'admin';
                if (staffSubFilter === 'mod') return m.role === 'moderator';
                return true;
              })
              .map(staff => {
                const isAdminRole = staff.role === 'admin';
                const isAlphaAi = staff.username?.toLowerCase() === 'alpha';

                return (
                  <div
                    key={staff.id}
                    className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <ProfileAvatar profile={staff} className="w-10 h-10 rounded-xl border border-white/10" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                              {staff.username}
                              {isAlphaAi && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">AI CORE</span>}
                            </h4>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Lvl {staff.level || 1} • {isAdminRole ? 'Board of Darkness' : 'Council of Shadows'}
                            </span>
                          </div>
                        </div>

                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                          isAdminRole 
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20" 
                            : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                        )}>
                          {staff.admin_title || staff.title || 'Official'}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="text-[11px] text-zinc-400 space-y-1 font-mono pt-2 border-t border-white/[0.04]">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Coins Treasury:</span>
                          <span className="text-zinc-200">{(staff.coins || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Profile Frame:</span>
                          <span className="text-zinc-200 capitalize">{staff.frame_id || 'Default'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    {amIGuildMaster && !isAlphaAi && (
                      <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => {
                              setLevelTarget(staff);
                              setTargetLevel(staff.level || 1);
                              setLevelOpen(true);
                            }}
                            variant="ghost"
                            className="h-8 px-2.5 text-[11px] text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg cursor-pointer"
                            title="Adjust Level"
                          >
                            Level
                          </Button>
                          <Button
                            onClick={() => {
                              setCoinsTarget(staff);
                              setGiftCoinsAmount(1000);
                              setCoinsOpen(true);
                            }}
                            variant="ghost"
                            className="h-8 px-2.5 text-[11px] text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg cursor-pointer"
                            title="Gift Coins"
                          >
                            Coins
                          </Button>
                          <Button
                            onClick={() => {
                              setTitleTarget(staff);
                              setSelectedTitle(staff.admin_title || 'Void Monarch');
                              setTitleOpen(true);
                            }}
                            variant="ghost"
                            className="h-8 px-2.5 text-[11px] text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg cursor-pointer"
                            title="Change Title"
                          >
                            Title
                          </Button>
                        </div>

                        <Button
                          onClick={() => handleDemoteOfficial(staff)}
                          variant="ghost"
                          className="h-8 px-2 text-[11px] text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
                          title="Relieve from command (retains former honor)"
                        >
                          Relieve
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: ALL ADVENTURERS DIRECTORY ─── */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Sub Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {(['ALL', 'ADMIN', 'MOD', 'MEMBER', 'BANNED'] as const).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setRosterRoleFilter(role)}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 text-xs",
                  rosterRoleFilter === role
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300 bg-white/[0.02]"
                )}
              >
                {role === 'ALL' ? 'All Roles' : role === 'ADMIN' ? 'Admins' : role === 'MOD' ? 'Moderators' : role === 'MEMBER' ? 'Adventurers' : 'Exiled'}
              </button>
            ))}
          </div>

          {/* Members Table */}
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/40 backdrop-blur-xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {filteredRoster.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No adventurers found matching the search criteria.
                </div>
              ) : (
                filteredRoster.map(m => {
                  const isGM = isGuildMaster(m) || m.username === 'Ace_Zero';
                  const isAlpha = m.username?.toLowerCase() === 'alpha';

                  return (
                    <div
                      key={m.id}
                      className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Left: Avatar + Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <ProfileAvatar profile={m} className="w-9 h-9 rounded-xl border border-white/10 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{m.username}</span>
                            {isGM && <Crown size={12} className="text-amber-400 shrink-0" />}
                            {m.is_banned && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-mono">BANNED</span>}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">
                            Lvl {m.level || 1} • {m.admin_title || m.equipped_title || m.title || 'Novice'} • {(m.coins || 0).toLocaleString()} Coins
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {amIGuildMaster && !isAlpha && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setLevelTarget(m);
                                setTargetLevel(m.level || 1);
                                setLevelOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                              title="Set Level"
                            >
                              Level
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCoinsTarget(m);
                                setGiftCoinsAmount(1000);
                                setCoinsOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                              title="Gift Coins"
                            >
                              Coins
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTitleTarget(m);
                                setSelectedTitle(m.admin_title || m.equipped_title || 'Void Monarch');
                                setTitleOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                              title="Bestow Title"
                            >
                              Title
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFrameTarget(m);
                                setSelectedFrameId(m.frame_id || 'iron');
                                setFrameOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                              title="Gift Frame"
                            >
                              Frame
                            </button>
                            {!isGM && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPromoteTarget(m);
                                  setPromoteRole('moderator');
                                  setPromoteOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] rounded-lg text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 transition-colors cursor-pointer"
                                title="Promote to Staff"
                              >
                                Promote
                              </button>
                            )}
                          </>
                        )}

                        {isAdmin && !isGM && !isAlpha && (
                          <button
                            type="button"
                            onClick={() => handleToggleBan(m)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              m.is_banned ? "text-emerald-400 hover:bg-emerald-500/10" : "text-zinc-500 hover:text-red-400 hover:bg-white/5"
                            )}
                            title={m.is_banned ? "Revoke Exile" : "Exile User"}
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: GUILD MASTER PASS DOWN SUCCESSION ─── */}
      {successionOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d0c16] border border-amber-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Crown size={20} className="text-amber-400" />
                <h3 className="text-base font-lemon font-bold text-white">Pass Down Mantle</h3>
              </div>
              <button onClick={() => setSuccessionOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              Passing down the mantle transfers supreme Guild Master authority, the supreme title &quot;Shadow&quot;, and The Eternal frame to your chosen successor. You will permanently step into the senior advisory role with the immutable title &quot;Former Guild Master&quot;.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Select Successor Operative</label>
              <select
                value={successionTarget?.id || ''}
                onChange={(e) => {
                  const target = members.find(m => m.id === e.target.value);
                  setSuccessionTarget(target || null);
                }}
                className="w-full h-11 px-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs cursor-pointer focus:border-amber-500"
              >
                <option value="">-- Choose an operative --</option>
                {members.filter(m => !isGuildMaster(m) && m.username?.toLowerCase() !== 'alpha').map(m => (
                  <option key={m.id} value={m.id}>
                    @{m.username} ({m.role || 'Member'} • Lvl {m.level || 1})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                onClick={() => setSuccessionOpen(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={!successionTarget || isTransferring}
                onClick={handlePassSuccession}
                className="h-10 px-5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl cursor-pointer"
              >
                {isTransferring ? 'Passing Mantle...' : 'Confirm Succession'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: APPOINT / PROMOTE OFFICIAL ─── */}
      {promoteOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d0c16] border border-purple-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Shield size={18} className="text-purple-400" />
                <h3 className="text-base font-bold text-white">Appoint Official</h3>
              </div>
              <button onClick={() => setPromoteOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Target Select if not preselected */}
            {!promoteTarget && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Select Operative</label>
                <select
                  onChange={(e) => {
                    const target = members.find(m => m.id === e.target.value);
                    setPromoteTarget(target || null);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs cursor-pointer"
                >
                  <option value="">-- Choose operative --</option>
                  {members.filter(m => !isGuildMaster(m) && m.username?.toLowerCase() !== 'alpha').map(m => (
                    <option key={m.id} value={m.id}>@{m.username} (Lvl {m.level || 1})</option>
                  ))}
                </select>
              </div>
            )}

            {promoteTarget && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <ProfileAvatar profile={promoteTarget} className="w-9 h-9 rounded-xl border border-white/10" />
                <div>
                  <h4 className="text-xs font-bold text-white">@{promoteTarget.username}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono">Current: {promoteTarget.role || 'Member'} • Lvl {promoteTarget.level || 1}</p>
                </div>
              </div>
            )}

            {/* Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Leadership Tier</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPromoteRole('admin');
                    setAssignedStaffTitle('Void Monarch');
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all",
                    promoteRole === 'admin'
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                      : "bg-zinc-900/40 border-white/[0.06] text-zinc-400 hover:text-white"
                  )}
                >
                  <div className="text-xs font-bold">Board of Darkness</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Admin • Max Lvl 100 • 10k Coins</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromoteRole('moderator');
                    setAssignedStaffTitle('Second Shadow');
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all",
                    promoteRole === 'moderator'
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-200"
                      : "bg-zinc-900/40 border-white/[0.06] text-zinc-400 hover:text-white"
                  )}
                >
                  <div className="text-xs font-bold">Council of Shadows</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Moderator • 5k Coins</div>
                </button>
              </div>
            </div>

            {/* Title Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Sacred Title</label>
              <select
                value={assignedStaffTitle}
                onChange={(e) => setAssignedStaffTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs cursor-pointer"
              >
                {(promoteRole === 'admin' ? DEFAULT_BOARD_TITLES : DEFAULT_COUNCIL_TITLES).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="custom">+ Custom Designation...</option>
              </select>

              {assignedStaffTitle === 'custom' && (
                <div className="space-y-2 pt-2">
                  <Input
                    value={customStaffTitle}
                    onChange={(e) => setCustomStaffTitle(e.target.value)}
                    placeholder="Enter custom title name..."
                    className="h-10 text-xs bg-zinc-900 border-white/10 text-white rounded-xl"
                  />
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Select Profile Frame Gift for Custom Title:</label>
                    <select
                      value={giftedFrameId}
                      onChange={(e) => setGiftedFrameId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs cursor-pointer"
                    >
                      {availableStoreFrames.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.rarity || f.tag || 'Store'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                onClick={() => setPromoteOpen(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={!promoteTarget || isPromotingStaff}
                onClick={handlePromoteOfficial}
                className="h-10 px-5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
              >
                {isPromotingStaff ? 'Appointing...' : 'Bestow Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADJUST LEVEL & AUTO-CALC XP ─── */}
      {levelOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d0c16] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white">Adjust Level: @{levelTarget?.username}</h3>
              <button onClick={() => setLevelOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Target Level:</span>
                <span className="text-lg font-mono font-black text-purple-400">Level {targetLevel}</span>
              </div>
              <Slider
                value={[targetLevel]}
                min={1}
                max={100}
                step={1}
                onValueChange={([val]) => setTargetLevel(val)}
                className="py-2"
              />
              <div className="text-[11px] text-zinc-500 font-mono text-center">
                Calculated XP: {targetLevel === 100 ? '999,999 (MAX)' : (50 * (targetLevel - 1) * targetLevel).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" onClick={() => setLevelOpen(false)} className="text-xs text-zinc-400 hover:text-white cursor-pointer">
                Cancel
              </Button>
              <Button
                disabled={isSavingLevel}
                onClick={handleSaveLevel}
                className="h-9 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
              >
                {isSavingLevel ? 'Saving...' : 'Set Level'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: GIFT TREASURY COINS ─── */}
      {coinsOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d0c16] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Gift Coins: @{coinsTarget?.username}</h3>
              </div>
              <button onClick={() => setCoinsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Coin Amount</label>
                <Input
                  type="number"
                  value={giftCoinsAmount}
                  onChange={(e) => setGiftCoinsAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="h-10 text-xs bg-zinc-900 border-white/10 text-white rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[500, 1000, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGiftCoinsAmount(amt)}
                    className="px-2.5 py-1 text-[10px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 cursor-pointer"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Alpha Message Note (Optional)</label>
                <Input
                  value={giftCoinsNote}
                  onChange={(e) => setGiftCoinsNote(e.target.value)}
                  placeholder="e.g. For exemplary service to the realm"
                  className="h-10 text-xs bg-zinc-900 border-white/10 text-white rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" onClick={() => setCoinsOpen(false)} className="text-xs text-zinc-400 hover:text-white cursor-pointer">
                Cancel
              </Button>
              <Button
                disabled={isGiftingCoins || giftCoinsAmount <= 0}
                onClick={handleGiftCoins}
                className="h-9 px-4 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-xl cursor-pointer"
              >
                {isGiftingCoins ? 'Dispatching...' : 'Dispatch Coins'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: BESTOW TITLE ─── */}
      {titleOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d0c16] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white">Bestow Title: @{titleTarget?.username}</h3>
              <button onClick={() => setTitleOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Select Title</label>
                <select
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs cursor-pointer"
                >
                  <optgroup label="Board of Darkness">
                    {DEFAULT_BOARD_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Council of Shadows">
                    {DEFAULT_COUNCIL_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Standard Milestones">
                    {ALL_TITLES.slice(0, 12).map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                  </optgroup>
                  <option value="custom">+ Custom Title Name...</option>
                </select>
              </div>

              {selectedTitle === 'custom' && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Custom Title</label>
                  <Input
                    value={customTitleText}
                    onChange={(e) => setCustomTitleText(e.target.value)}
                    placeholder="Enter unique title..."
                    className="h-10 text-xs bg-zinc-900 border-white/10 text-white rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" onClick={() => setTitleOpen(false)} className="text-xs text-zinc-400 hover:text-white cursor-pointer">
                Cancel
              </Button>
              <Button
                disabled={isBestowingTitle}
                onClick={handleBestowTitle}
                className="h-9 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
              >
                {isBestowingTitle ? 'Bestowing...' : 'Bestow Title'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: GIFT PROFILE FRAME ─── */}
      {frameOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d0c16] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white">Gift Profile Frame: @{frameTarget?.username}</h3>
              <button onClick={() => setFrameOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <Input
              value={frameSearch}
              onChange={(e) => setFrameSearch(e.target.value)}
              placeholder="Search store frames..."
              className="h-9 text-xs bg-zinc-900 border-white/10 text-white rounded-xl"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {availableStoreFrames.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFrameId(f.id)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                    selectedFrameId === f.id
                      ? "bg-purple-500/20 border-purple-500 text-white"
                      : "bg-zinc-900/40 border-white/[0.06] text-zinc-400 hover:text-white"
                  )}
                >
                  <div className="w-12 h-12 flex items-center justify-center relative">
                    <FantasyFrame frameId={f.id} size={44}>
                      <div className="w-8 h-8 rounded-full bg-zinc-800" />
                    </FantasyFrame>
                  </div>
                  <span className="text-[11px] font-medium text-center truncate max-w-full">{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" onClick={() => setFrameOpen(false)} className="text-xs text-zinc-400 hover:text-white cursor-pointer">
                Cancel
              </Button>
              <Button
                disabled={isGiftingFrame || !selectedFrameId}
                onClick={handleGiftFrame}
                className="h-9 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
              >
                {isGiftingFrame ? 'Gifting...' : 'Gift Frame'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
