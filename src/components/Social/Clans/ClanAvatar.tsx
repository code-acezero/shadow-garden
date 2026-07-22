import React from 'react';
import { getLevelColors } from '@/components/User/FantasyFrame';

export function ClanShieldBadge({ level, className = "w-4 h-4" }: { level: number | string; className?: string }) {
  const numLvl = typeof level === 'string' ? parseInt(level) || 1 : level;
  const colors = getLevelColors(numLvl);
  const gradId = `clan_shield_grad_${numLvl}_${Math.random().toString(36).substr(2, 5)}`;
  
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${colors.shadow})` }}>
        <path
          d="M12 1L2 5V12C2 18.5 6.5 24.5 12 27C17.5 24.5 22 18.5 22 12V5L12 1Z"
          fill={`url(#${gradId})`}
          stroke={colors.stroke}
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id={gradId} x1="2" y1="1" x2="22" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.from} />
            <stop offset="0.5" stopColor={colors.via} />
            <stop offset="1" stopColor={colors.to} />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white leading-none pt-0.5 tracking-tighter">
        {level}
      </span>
    </div>
  );
}

interface ClanAvatarProps {
  clan?: {
    id?: string;
    avatar_url?: string | null;
    level?: number;
    name?: string;
    [key: string]: any;
  } | null;
  className?: string;
}

export default function ClanAvatar({ clan, className = "w-11 h-11" }: ClanAvatarProps) {
  const seed = clan?.id || 'default';
  const avatarUrl = clan?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
  const clanLevel = clan?.level || 1;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <img 
        src={avatarUrl} 
        alt="" 
        className="w-full h-full rounded-full object-cover border border-purple-500/40 shadow-md bg-black" 
        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}` }}
      />
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none">
        <ClanShieldBadge level={clanLevel} className="w-[16px] h-[18px]" />
      </div>
    </div>
  );
}
