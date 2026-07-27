'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Crown, Shield, Sword, Plus, X, UserCheck, Lock, Sparkles, UserMinus, RefreshCw, Bot, ChevronDown, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { UserOnlinePulse } from '@/components/ui/UserTitleBadge';
import { toast } from '@/lib/toast';
import { saveCustomTitleGreetings, deleteCustomTitleGreetings } from '@/lib/alphaGreetings';

interface MemberProfile {
  id: string;
  username: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  admin_title?: string | null;
  title?: string | null;
  level?: number;
  frame_id?: string | null;
}

// Shorter Board of Darkness Admin Titles
const DEFAULT_BOARD_OF_DARKNESS = [
  'Abyss Archon',
  'Void Monarch',
  'Eclipse Blade',
  'Umbral Lord',
  'Dark Primarch'
];

// Council of Shadows Role Titles (Seven Shadows + 3 Council Members)
const DEFAULT_COUNCIL_OF_SHADOWS = [
  'First Shadow',   // Pre-assigned to Alpha AI
  'Second Shadow',  // Beta
  'Third Shadow',   // Gamma
  'Fourth Shadow',  // Delta
  'Fifth Shadow',   // Epsilon
  'Sixth Shadow',   // Zeta
  'Seventh Shadow', // Eta
  'Eighth Shadow',  // Omega
  'Ninth Shadow',   // Phantom
  'Tenth Shadow'    // Mirage
];

const getCleanUsername = (memberOrName?: MemberProfile | string | null) => {
  if (!memberOrName) return 'Operative';
  
  let name = '';
  if (typeof memberOrName === 'string') {
    name = memberOrName;
  } else {
    name = memberOrName.username || memberOrName.full_name || (memberOrName as any).email || 'Operative';
  }

  if (name.includes('@')) {
    name = name.split('@')[0];
  }
  return name;
};

interface UserSelectorProps {
  members: MemberProfile[];
  placeholder: string;
  accentColor?: 'amber' | 'purple';
  isOpen?: boolean;
  onToggle?: () => void;
  onSelect: (memberId: string) => void;
}

function UserSelectorDropdown({ 
  members, 
  placeholder, 
  accentColor = 'purple', 
  isOpen: externalIsOpen,
  onToggle,
  onSelect 
}: UserSelectorProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleClose = () => {
    if (onToggle && isOpen) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  };

  const activeBorder = accentColor === 'amber' ? 'hover:border-amber-500/50 focus:border-amber-500' : 'hover:border-purple-500/50 focus:border-purple-500';
  const activeGlow = accentColor === 'amber' ? 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'shadow-[0_0_15px_rgba(168,85,247,0.2)]';

  return (
    <div className={`relative w-full ${isOpen ? 'z-[90]' : 'z-10'}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full bg-[#0a0a12]/95 border border-white/20 text-xs text-white p-2.5 rounded-2xl flex items-center justify-between cursor-pointer backdrop-blur-xl transition-all duration-200 ${activeBorder} ${isOpen ? activeGlow + ' border-white/40 ring-2 ring-purple-500/30' : ''}`}
      >
        <span className="truncate text-zinc-300 font-medium flex items-center gap-2">
          <UserPlus size={14} className={accentColor === 'amber' ? 'text-amber-400' : 'text-purple-400'} />
          {placeholder}
        </span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={handleClose} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0d0d16]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden max-h-56 overflow-y-auto divide-y divide-white/10 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10">
            {members.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-zinc-500 italic">
                No unassigned members available
              </div>
            ) : (
              members.map((m) => {
                const cleanName = getCleanUsername(m);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelect(m.id);
                      handleClose();
                    }}
                    className="w-full text-left p-2.5 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProfileAvatar profile={m} className="w-7 h-7 border border-white/10 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate flex items-center">
                          {cleanName}
                          <UserOnlinePulse user={m} />
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          Lvl {m.level || 1} • {m.role || 'Member'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 group-hover:border-purple-500/40 group-hover:text-purple-300 transition-all shrink-0">
                      Assign
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function RoleTitleManager() {
  const { user, profile: currentUserProfile, refreshSession } = useAuth();
  const currentRole = (currentUserProfile as any)?.role || 'user';
  const currentAdminTitle = (currentUserProfile as any)?.admin_title || '';
  
  const isLeader = currentRole === 'leader' || currentAdminTitle === 'Shadow' || (currentUserProfile as any)?.username === 'shadow.';
  const isAdmin = currentRole === 'admin' || isLeader;

  const [admins, setAdmins] = useState<MemberProfile[]>([]);
  const [mods, setMods] = useState<MemberProfile[]>([]);
  const [alphaAi, setAlphaAi] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom titles state
  const [customAdminTitles, setCustomAdminTitles] = useState<string[]>([]);
  const [customModTitles, setCustomModTitles] = useState<string[]>([]);

  const [newTitleName, setNewTitleName] = useState('');
  const [newTitleGroup, setNewTitleGroup] = useState<'admin' | 'mod'>('mod');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Single-active open title group state ('board' | 'council' | null)
  const [openGroup, setOpenGroup] = useState<'board' | 'council' | null>('board');
  // Single-active open user selector dropdown across all title cards
  const [activeOpenSelectorTitle, setActiveOpenSelectorTitle] = useState<string | null>(null);

  // Fetch all Admins, Mods, and ensure Alpha AI is pre-assigned to 'First Shadow'
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles safely
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.warn('Error fetching profiles for hierarchy:', error);
      }

      if (data && data.length > 0) {
        setAdmins(data.filter((m: MemberProfile) => m.role === 'admin' || m.role === 'leader'));
        setMods(data.filter((m: MemberProfile) => m.role === 'moderator'));

        const alphaMember = data.find((m: MemberProfile) => m.username && m.username.toLowerCase() === 'alpha');
        if (alphaMember) {
          setAlphaAi(alphaMember);
          if (alphaMember.admin_title !== 'First Shadow') {
            supabase.from('profiles').update({ admin_title: 'First Shadow' }).eq('id', alphaMember.id).then();
            alphaMember.admin_title = 'First Shadow';
          }
        } else {
          setAlphaAi({
            id: 'sys-alpha-ai',
            username: 'Alpha (First Shadow)',
            avatar_url: '/images/alpha/alpha-av.png',
            role: 'moderator',
            admin_title: 'First Shadow'
          });
        }
      } else {
        // Fallback for virtual Alpha AI
        setAlphaAi({
          id: 'sys-alpha-ai',
          username: 'Alpha (First Shadow)',
          avatar_url: '/images/alpha/alpha-av.png',
          role: 'moderator',
          admin_title: 'First Shadow'
        });
      }
    } catch (err) {
      console.warn('Hierarchy fetch error handled safely:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    if (typeof window !== 'undefined') {
      const savedCustomAdmin = localStorage.getItem('shadow_custom_admin_titles');
      const savedCustomMod = localStorage.getItem('shadow_custom_mod_titles');
      if (savedCustomAdmin) setCustomAdminTitles(JSON.parse(savedCustomAdmin));
      if (savedCustomMod) setCustomModTitles(JSON.parse(savedCustomMod));
    }
  }, []);

  const boardTitles = [...DEFAULT_BOARD_OF_DARKNESS, ...customAdminTitles];
  const councilTitles = [...DEFAULT_COUNCIL_OF_SHADOWS, ...customModTitles];
  // Alpha AI Autonomous Appointment Announcement Job
  const triggerAlphaAppointmentJob = async (member: MemberProfile, titleName: string) => {
    try {
      const ALPHA_ID = '5d38da6e-b568-4499-ab67-f588354add5d';
      const username = member.username || 'Operative';
      const avatarUrl = member.avatar_url || '/images/default-avatar.png';

      // 1. High-lore congratulatory announcement templates
      const templates = [
        `By official decree of Shadow Garden, @${username} has been bestowed the title of [${titleName}]! 🗡️\n\nWelcome to the official leadership tier of the realm. May your resolve be absolute and your shadow never flicker. All hail Lord Shadow! ✨`,
        `An official appointment from the shadows: @${username} is hereby elevated to [${titleName}]! 🔮\n\nCongratulations on attaining this feat of authority. Stand tall among the elite of Shadow Garden.`,
        `The Council of Shadows acknowledges the rise of @${username} as our new [${titleName}]! 📜\n\nYour dedication to the realm has been recognized by Lord Shadow. Welcome to your official duties!`,
        `By order of First Shadow Alpha, @${username} has stepped forth to claim the mantle of [${titleName}]! 🌟\n\nLet all operatives salute our newly appointed official.`
      ];

      const content = templates[Math.floor(Math.random() * templates.length)];

      // 2. Publish post to social_posts on behalf of Alpha AI with member's avatar attached
      await supabase.from('social_posts').insert({
        user_id: ALPHA_ID,
        content: content,
        images: avatarUrl ? [avatarUrl] : []
      });

      // 3. Send notification to all registered users
      const { data: profiles } = await supabase.from('profiles').select('id');
      if (profiles && profiles.length > 0) {
        const notifications = profiles.map((p: any) => ({
          user_id: p.id,
          type: 'ALPHA_ANNOUNCEMENT',
          content: `👑 Alpha AI: @${username} has been appointed as [${titleName}]!`
        }));
        await supabase.from('notifications').insert(notifications);
      }

      // 4. Dispatch realtime UI broadcast
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
          detail: {
            id: Date.now(),
            type: 'success',
            title: 'Alpha AI Announcement Published',
            message: `Alpha AI posted a global announcement & notified all users for @${username} as [${titleName}]!`
          }
        }));
      }
    } catch (err) {
      console.error('Error executing Alpha AI appointment job:', err);
    }
  };

  // Assign Title to Member
  const handleAssignTitle = async (memberId: string, titleName: string) => {
    try {
      toast.loading(`Assigning "${titleName}"...`);
      const { error } = await supabase
        .from('profiles')
        .update({ admin_title: titleName })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(`Assigned "${titleName}" successfully!`);

      // Find target member profile and trigger Alpha AI Job
      const targetMember = [...admins, ...mods].find(m => m.id === memberId);
      if (targetMember) {
        await triggerAlphaAppointmentJob(targetMember, titleName);
      }

      await fetchMembers();
      refreshSession();
    } catch (e) {
      toast.error('Failed to assign title');
    }
  };

  // Unassign Title from Member
  const handleUnassignTitle = async (memberId: string) => {
    try {
      toast.loading('Removing assigned title...');
      const { error } = await supabase
        .from('profiles')
        .update({ admin_title: null })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Title unassigned!');
      await fetchMembers();
      refreshSession();
    } catch (e) {
      toast.error('Failed to unassign title');
    }
  };

  // Add Custom Title & Automatically Generate 10 Alpha AI Greetings in Background
  const handleAddCustomTitle = async () => {
    const trimmed = newTitleName.trim();
    if (!trimmed) return;

    if (newTitleGroup === 'admin') {
      const updated = [...customAdminTitles, trimmed];
      setCustomAdminTitles(updated);
      localStorage.setItem('shadow_custom_admin_titles', JSON.stringify(updated));
    } else {
      const updated = [...customModTitles, trimmed];
      setCustomModTitles(updated);
      localStorage.setItem('shadow_custom_mod_titles', JSON.stringify(updated));
    }

    // Auto-generate 5 initial + 5 revisit greetings for Alpha AI in background
    await saveCustomTitleGreetings(trimmed);

    toast.success(`Custom title "${trimmed}" created with 10 Alpha AI greetings!`);
    setNewTitleName('');
    setIsAddingCustom(false);
  };

  // Delete Custom Title & Clean Up Greetings
  const handleDeleteCustomTitle = (titleName: string, group: 'admin' | 'mod') => {
    if (group === 'admin') {
      const updated = customAdminTitles.filter(t => t !== titleName);
      setCustomAdminTitles(updated);
      localStorage.setItem('shadow_custom_admin_titles', JSON.stringify(updated));
    } else {
      const updated = customModTitles.filter(t => t !== titleName);
      setCustomModTitles(updated);
      localStorage.setItem('shadow_custom_mod_titles', JSON.stringify(updated));
    }

    deleteCustomTitleGreetings(titleName);
    toast.success(`Custom title "${titleName}" deleted!`);
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* SECTION HEADER BANNER */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#0c0a15]/80 to-black border border-purple-500/20 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={24} />
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-wider">Hierarchy & Title Command</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Assign exclusive title designations to the Board of Darkness and Council of Shadows. Titles remain locked to assignees until liberated.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={fetchMembers} variant="ghost" className="h-10 w-10 p-0 text-zinc-400 hover:text-white bg-black/40 border border-white/10 rounded-2xl">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>

            {isAdmin && (
              <Button 
                onClick={() => setIsAddingCustom(true)} 
                className="h-10 px-5 text-xs font-black bg-purple-600 hover:bg-purple-500 text-white rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105"
              >
                <Plus size={16} /> Create Title
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM TITLE MODAL */}
      {isAddingCustom && (
        <div className="p-6 rounded-3xl bg-purple-950/30 border border-purple-500/30 space-y-4 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> Add Custom Hierarchy Designation
            </h4>
            <button onClick={() => setIsAddingCustom(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newTitleName}
              onChange={(e) => setNewTitleName(e.target.value)}
              placeholder="e.g. Eclipse Warden, Night Sentinel..."
              className="bg-black/60 border-white/15 text-white h-11 text-xs flex-1 rounded-2xl focus:border-purple-500/60"
            />
            <select
              value={newTitleGroup}
              onChange={(e) => setNewTitleGroup(e.target.value as any)}
              className="bg-black/80 border border-white/15 text-white h-11 px-4 text-xs rounded-2xl cursor-pointer"
            >
              {isLeader && <option value="admin">Board of Darkness (Admins)</option>}
              <option value="mod">Council of Shadows (Moderators)</option>
            </select>
            <Button onClick={handleAddCustomTitle} className="h-11 px-6 text-xs font-black bg-purple-600 hover:bg-purple-500 text-white rounded-2xl">
              Save Title
            </Button>
          </div>
        </div>
      )}

      {/* GROUP I: BOARD OF DARKNESS (ADMINS - SHORT TITLES) */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-5 transition-all duration-300">
        <div 
          onClick={() => setOpenGroup(openGroup === 'board' ? null : 'board')}
          className="flex items-center justify-between pb-1 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
              <Crown size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide group-hover:text-amber-300 transition-colors">Group I: Board of Darkness</h3>
                <span className="text-[10px] font-black uppercase bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                  Admins
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">High command designations reserved for admins & leader</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isLeader && (
              <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                <Lock size={12} /> Leader Only
              </span>
            )}
            <div className={`p-2 rounded-xl border border-white/10 text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 ${openGroup === 'board' ? 'rotate-180 bg-white/10 text-white' : ''}`}>
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {openGroup === 'board' && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
            {boardTitles.map((tName) => {
              const assignedMember = admins.find(m => m.admin_title === tName);
              const isTaken = !!assignedMember;

              return (
                <div 
                  key={tName}
                  className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl relative hover:z-40 focus-within:z-50 ${
                    isTaken 
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-zinc-900/60 to-black shadow-[0_10px_25px_rgba(251,191,36,0.1)]' 
                      : 'border-white/10 bg-zinc-900/30 hover:border-white/20 hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black text-amber-400 tracking-wide drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                        [{tName}]
                      </span>
                      {isTaken ? (
                        <span className="text-[9px] font-black uppercase bg-amber-950 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                          ASSIGNED
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase bg-zinc-900 text-zinc-400 px-2.5 py-0.5 rounded-full border border-white/10">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {assignedMember ? (
                      <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-black/60 border border-white/10">
                        <ProfileAvatar profile={assignedMember} className="w-10 h-10 border border-amber-500/40" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{getCleanUsername(assignedMember)}</p>
                          <p className="text-[10px] text-zinc-400 capitalize">{assignedMember.role}</p>
                        </div>
                        {isLeader && (
                          <button
                            onClick={() => handleUnassignTitle(assignedMember.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-white/5 transition-colors"
                            title="Unassign title"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 my-4 italic">No admin currently holds this title.</p>
                    )}
                  </div>

                  {/* Assignment Selector (Leader Only) */}
                  {isLeader && !isTaken && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <UserSelectorDropdown
                        members={admins.filter(a => !a.admin_title || a.admin_title === 'Shadow')}
                        placeholder="Assign to Admin..."
                        accentColor="amber"
                        isOpen={activeOpenSelectorTitle === tName}
                        onToggle={() => setActiveOpenSelectorTitle(activeOpenSelectorTitle === tName ? null : tName)}
                        onSelect={(memberId) => {
                          handleAssignTitle(memberId, tName);
                          setActiveOpenSelectorTitle(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GROUP II: COUNCIL OF SHADOWS (MODERATORS - ROLE TITLES) */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-5 transition-all duration-300">
        <div 
          onClick={() => setOpenGroup(openGroup === 'council' ? null : 'council')}
          className="flex items-center justify-between pb-1 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
              <Sword size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide group-hover:text-purple-300 transition-colors">Group II: Council of Shadows</h3>
                <span className="text-[10px] font-black uppercase bg-purple-950/80 border border-purple-500/40 text-purple-300 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  Seven Shadows & Council
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Operative designations assigned to moderators and Council</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && (
              <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                <Lock size={12} /> Admin Controlled
              </span>
            )}
            <div className={`p-2 rounded-xl border border-white/10 text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 ${openGroup === 'council' ? 'rotate-180 bg-white/10 text-white' : ''}`}>
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {openGroup === 'council' && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
            {councilTitles.map((tName) => {
              const isFirstShadow = tName === 'First Shadow';
              const assignedMember = isFirstShadow ? (alphaAi || mods.find(m => m.admin_title === tName)) : mods.find(m => m.admin_title === tName);
              const isTaken = isFirstShadow || !!assignedMember;

              return (
                <div 
                  key={tName}
                  className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl relative hover:z-40 focus-within:z-50 ${
                    isFirstShadow
                      ? 'border-purple-500/60 bg-gradient-to-br from-purple-950/40 via-zinc-900/80 to-black shadow-[0_10px_30px_rgba(168,85,247,0.2)]'
                      : isTaken 
                      ? 'border-purple-500/40 bg-purple-950/20 shadow-[0_10px_25px_rgba(168,85,247,0.1)]' 
                      : 'border-white/10 bg-zinc-900/30 hover:border-white/20 hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black text-purple-300 tracking-wide drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                        [{tName}]
                      </span>
                      {isFirstShadow ? (
                        <span className="text-[9px] font-black uppercase bg-purple-900/90 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/60 flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                          <Bot size={10} /> ALPHA AI
                        </span>
                      ) : isTaken ? (
                        <span className="text-[9px] font-black uppercase bg-purple-950 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                          ASSIGNED
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase bg-zinc-900 text-zinc-400 px-2.5 py-0.5 rounded-full border border-white/10">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {isFirstShadow ? (
                      <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-black/60 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <div className="relative">
                          <img 
                            src={alphaAi?.avatar_url || "/images/alpha/alpha-av.png"} 
                            alt="Alpha AI" 
                            className="w-10 h-10 rounded-full object-cover border border-purple-400 shadow-md"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-black flex items-center justify-center">
                            <Sparkles size={8} className="text-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-purple-200 truncate">{alphaAi?.username || 'Alpha (AI System)'}</p>
                          <p className="text-[10px] text-purple-400 font-bold tracking-wider uppercase">First Shadow • AI Leader</p>
                        </div>
                        <Lock size={16} className="text-purple-400" />
                      </div>
                    ) : assignedMember ? (
                      <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-black/60 border border-white/10">
                        <ProfileAvatar profile={assignedMember} className="w-10 h-10 border border-purple-500/40" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{getCleanUsername(assignedMember)}</p>
                          <p className="text-[10px] text-zinc-400 capitalize">{assignedMember.role}</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleUnassignTitle(assignedMember.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-white/5 transition-colors"
                            title="Unassign title"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 my-4 italic">No moderator assigned to this role title.</p>
                    )}
                  </div>

                  {/* Assignment Selector (Admin & Leader Access) */}
                  {isAdmin && !isTaken && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <UserSelectorDropdown
                        members={mods.filter(m => !m.admin_title)}
                        placeholder="Assign to Moderator..."
                        accentColor="purple"
                        isOpen={activeOpenSelectorTitle === tName}
                        onToggle={() => setActiveOpenSelectorTitle(activeOpenSelectorTitle === tName ? null : tName)}
                        onSelect={(memberId) => {
                          handleAssignTitle(memberId, tName);
                          setActiveOpenSelectorTitle(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
