import React from 'react';
import { getClanBadgeInfo, ClanShieldBadge } from './ClanLevelBadge';

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

export default function ClanAvatar({ clan, className = "w-12 h-12" }: ClanAvatarProps) {
  const CLAN_FALLBACK = 'https://cdn.myanimelist.net/images/characters/8/422170.jpg';
  const avatarUrl = clan?.avatar_url || CLAN_FALLBACK;
  const clanLevel = clan?.level || 1;
  const badgeInfo = getClanBadgeInfo(clanLevel);
  const colors = badgeInfo.color;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Dynamic Gradient Slim Frame - Matched exactly to Clan Rank */}
      <div 
        className="w-full h-full p-[2.5px] rounded-2xl bg-black relative shadow-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.from || colors.secondary}, ${colors.primary}, ${colors.stroke})`,
          boxShadow: `0 0 16px ${colors.glow}, inset 0 0 10px rgba(0,0,0,0.8)`
        }}
      >
        <img 
          src={avatarUrl} 
          alt="" 
          className="w-full h-full rounded-[14px] object-cover bg-black" 
          onError={(e) => { (e.target as HTMLImageElement).src = CLAN_FALLBACK; }}
        />
      </div>

      {/* Level Shield Badge at Bottom Center */}
      <div 
        className="absolute left-1/2 bottom-0 z-20 flex items-center justify-center pointer-events-none -translate-x-1/2 translate-y-1/2 w-[0.8rem] h-[0.8rem]"
      >
        <ClanShieldBadge level={clanLevel} className="w-full h-full drop-shadow-md" />
      </div>
    </div>
  );
}
