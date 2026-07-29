import React from 'react';

export interface UserTitleProfile {
  admin_title?: string | null;
  title?: string | null;
  role?: string | null;
  level?: number | null;
  [key: string]: any;
}

const isAnonymousTitle = (val?: string | null) => {
  if (!val || typeof val !== 'string') return true;
  const clean = val.trim().toLowerCase();
  return !clean || clean.includes('anonymous') || clean.includes('anonnymous');
};

export function getUserTitle(profile?: UserTitleProfile | null): string {
  if (!profile || typeof profile !== 'object') return 'F-Novice';

  // 0. Special recognition for Alpha
  if (profile.id === '5d38da6e-b568-4499-ab67-f588354add5d' || (profile.username && profile.username.toLowerCase() === 'alpha')) {
    return 'First Shadow';
  }

  // 1. Prioritize explicit admin_title if set and not anonymous
  if (!isAnonymousTitle(profile.admin_title)) {
    return profile.admin_title!.trim();
  }

  // 2. Custom DB title if set and not anonymous (e.g. Dark Primarch, Shadow, etc.)
  if (!isAnonymousTitle(profile.title)) {
    return profile.title!.trim();
  }

  // 3. Supreme Leader of Shadow Garden
  if (profile.role === 'leader') {
    return 'Shadow';
  }

  // 4. Adventurer Rank Progression (Level-based title for all other users)

  // 5. Adventurer Rank Progression (Level-based title)
  const lvl = typeof profile.level === 'number' ? profile.level : 1;
  if (lvl >= 100) return 'EX-Monarch';
  if (lvl >= 90) return 'SSS-Overlord';
  if (lvl >= 80) return 'SS-Conqueror';
  if (lvl >= 65) return 'S-Sovereign';
  if (lvl >= 50) return 'A-Grandmaster';
  if (lvl >= 35) return 'B-Vanguard';
  if (lvl >= 20) return 'C-Mercenary';
  if (lvl >= 10) return 'D-Champion';
  if (lvl >= 5) return 'E-Pathfinder';
  return 'F-Novice';
}

interface UserTitleBadgeProps {
  user?: UserTitleProfile | null;
  variant?: 'bracket' | 'badge' | 'text';
  className?: string;
  showPrefix?: boolean;
}

// Internal helper for raw online status
export function isUserOnline(user?: UserTitleProfile | null): boolean {
  if (!user || typeof user !== 'object') return false;
  // Always force Alpha (First Shadow) to be online 24/7!
  if (
    user.id === '5d38da6e-b568-4499-ab67-f588354add5d' || 
    (user.username && user.username.toLowerCase() === 'alpha') ||
    user.role === 'ai_leader' ||
    user.role === 'ai'
  ) {
    return true;
  }
  // If explicitly set (like in realtime presence), use it
  if (user.is_online === true || user.online === true) return true;
  // Otherwise, fallback to heartbeat (updated_at, last_seen_at, last_active)
  const timeSource = user.updated_at || user.last_seen_at || user.last_active;
  if (timeSource) {
    const lastActive = new Date(timeSource).getTime();
    if (!isNaN(lastActive) && Date.now() - lastActive < 15 * 60 * 1000) {
      return true;
    }
  }
  return false;
}

import { useAuth } from '@/context/AuthContext';

export function UserOnlinePulse({ user, className = '' }: { user?: UserTitleProfile | null; className?: string }) {
  const { profile: currentUser } = useAuth();
  const online = isUserOnline(user);
  
  if (!online) return null;

  // Check privacy settings
  const hideOnlineStatus = user?.settings?.hideOnlineStatus === true;
  const isViewerAdminOrMod = currentUser?.role === 'admin' || currentUser?.role === 'moderator' || currentUser?.role === 'leader';
  const isSelf = currentUser?.id === user?.id;

  // If user hides status, only show it to admins/mods or themselves
  if (hideOnlineStatus && !isViewerAdminOrMod && !isSelf) {
    return null;
  }

  return (
    <span className={`inline-flex items-center shrink-0 ml-1 ${className}`} title="Active Real-time">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
      </span>
    </span>
  );
}

export function UserTitleBadge({
  user,
  variant = 'bracket',
  className = '',
  showPrefix = true,
}: UserTitleBadgeProps) {
  if (user && user.show_title === false) return null;
  if (user && user.id && typeof window !== 'undefined' && localStorage.getItem(`shadow_show_title_${user.id}`) === 'false') return null;

  const title = getUserTitle(user);
  if (!title) return null;

  const isShadow = title === 'Shadow' || user?.role === 'leader' || user?.role === 'admin';
  const lvl = typeof user?.level === 'number' ? user.level : 1;

  if (variant === 'badge') {
    const badgeColor = isShadow
      ? 'bg-purple-950/80 text-purple-300 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.8)]'
      : user?.role === 'moderator'
      ? 'bg-blue-900/40 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
      : 'bg-amber-950/40 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.3)]';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border backdrop-blur-sm ${badgeColor} ${className}`}>
        {title}
        <UserOnlinePulse user={user} />
      </span>
    );
  }

  if (variant === 'text') {
    const colorClass = isShadow
      ? 'text-amber-400 font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]'
      : 'text-amber-400/90 font-bold';

    return (
      <span className={`inline-flex items-center ${colorClass} ${className}`}>
        {title}
        <UserOnlinePulse user={user} />
      </span>
    );
  }

  // Default: 'bracket' style [Shadow]
  const colorClass = isShadow
    ? 'text-amber-400 font-black tracking-wide drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
    : lvl >= 100
    ? 'text-amber-300 font-black drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]'
    : lvl >= 90
    ? 'text-purple-400 font-black drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]'
    : lvl >= 80
    ? 'text-rose-400 font-extrabold'
    : lvl >= 65
    ? 'text-violet-400 font-extrabold'
    : lvl >= 50
    ? 'text-cyan-400 font-bold'
    : lvl >= 35
    ? 'text-emerald-400 font-bold'
    : lvl >= 20
    ? 'text-blue-400 font-semibold'
    : lvl >= 10
    ? 'text-sky-400 font-medium'
    : 'text-zinc-400 font-medium';

  const hasExplicitSize = /\btext-(xs|sm|base|lg|xl|2xl|3xl|\[\d+px\])\b/.test(className);
  const sizeClass = hasExplicitSize ? '' : 'text-[11px]';

  return (
    <span className={`inline-flex items-center ${sizeClass} ${colorClass} ${className}`}>
      [{title}]
      <UserOnlinePulse user={user} />
    </span>
  );
}

export default UserTitleBadge;
