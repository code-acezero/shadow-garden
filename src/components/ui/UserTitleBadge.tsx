import React from 'react';
import { getEquippedTitle, getTitleDefinition, isUserAdWhitelisted } from '@/lib/userTitles';

export interface UserTitleProfile {
  id?: string;
  username?: string | null;
  admin_title?: string | null;
  custom_title?: string | null;
  equipped_title?: string | null;
  title?: string | null;
  role?: string | null;
  level?: number | null;
  show_title?: boolean | null;
  [key: string]: any;
}

export function getUserTitle(profile?: UserTitleProfile | null): string {
  return getEquippedTitle(profile);
}

interface UserTitleBadgeProps {
  user?: UserTitleProfile | null;
  variant?: 'bracket' | 'badge' | 'text';
  className?: string;
  showPrefix?: boolean;
}

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
  if (user.is_online === true || user.online === true) return true;
  const timeSource = user.updated_at || user.last_seen_at || user.last_active;
  if (timeSource) {
    const lastActive = new Date(timeSource).getTime();
    if (!isNaN(lastActive) && Date.now() - lastActive < 15 * 60 * 1000) {
      return true;
    }
  }
  return false;
}

// Rule 4: No random green dots or status indicator dots anywhere
export function UserOnlinePulse({ user, className = '' }: { user?: UserTitleProfile | null; className?: string }) {
  return null;
}

export function UserTitleBadge({
  user,
  variant = 'bracket',
  className = '',
  showPrefix = true,
}: UserTitleBadgeProps) {
  if (user && user.show_title === false) return null;
  if (user && user.id && typeof window !== 'undefined' && localStorage.getItem(`shadow_show_title_${user.id}`) === 'false') return null;

  const title = getEquippedTitle(user);
  if (!title) return null;

  const titleDef = getTitleDefinition(title, user);
  const isShadow = title === 'Shadow' || title === 'Guild Master';
  const isWhitelisted = isUserAdWhitelisted(user);

  if (variant === 'badge') {
    const badgeBg = isWhitelisted ? 'bg-purple-950/70' : titleDef.badgeStyle.badgeBg;
    const badgeText = isWhitelisted ? 'text-purple-300 font-bold' : titleDef.badgeStyle.badgeText;
    const badgeBorder = isWhitelisted ? 'border-purple-500/50' : titleDef.badgeStyle.badgeBorder;
    const glow = isWhitelisted ? 'rgba(168,85,247,0.5)' : titleDef.badgeStyle.glow;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border backdrop-blur-sm ${badgeBg} ${badgeText} ${badgeBorder} ${className}`}
        style={glow ? { boxShadow: `0 0 12px ${glow}` } : undefined}
      >
        <UserOnlinePulse user={user} />
        {title}
      </span>
    );
  }

  if (variant === 'text') {
    const colorClass = isWhitelisted
      ? 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]'
      : (isShadow ? 'text-amber-400 font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : titleDef.badgeStyle.bracketColor);

    return (
      <span className={`inline-flex items-center ${colorClass} ${className}`}>
        <UserOnlinePulse user={user} />
        {title}
      </span>
    );
  }

  // Default: 'bracket' style: (Shadow)
  // Whitelisted users (and auto-whitelisted admins/mods) receive royal purple title color across the entire realm
  const hasExplicitSize = /\btext-(xs|sm|base|lg|xl|2xl|3xl|\[\d+px\])\b/.test(className);
  const sizeClass = hasExplicitSize ? '' : 'text-[11px]';
  const bracketColorClass = isWhitelisted
    ? 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]'
    : (isShadow ? 'text-amber-400 font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : titleDef.badgeStyle.bracketColor);

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClass} ${bracketColorClass} ${className}`}>
      <UserOnlinePulse user={user} />
      ({title})
    </span>
  );
}

export default UserTitleBadge;
