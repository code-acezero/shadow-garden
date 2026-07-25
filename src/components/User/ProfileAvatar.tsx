import React from 'react';
import FantasyFrame from './FantasyFrame';
import { useTravellerProfile } from '@/hooks/useTravellerProfile';
import { isUserOnline } from '@/components/ui/UserTitleBadge';

interface ProfileAvatarProps {
  profile?: {
    id?: string;
    avatar_url?: string | null;
    frame_id?: string | null;
    level?: number;
    show_level?: boolean;
    is_online?: boolean;
    updated_at?: string;
    [key: string]: any;
  } | null;
  travellerAvatar?: string;
  className?: string;
}

const FALLBACK = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';

export default function ProfileAvatar({ profile, travellerAvatar, className = "w-10 h-10" }: ProfileAvatarProps) {
  const travellerProfile = useTravellerProfile();

  let finalAvatarUrl = profile?.avatar_url || profile?.avatar || profile?.image || travellerAvatar;
  if (!finalAvatarUrl && (!profile || !profile.id)) {
    finalAvatarUrl = travellerProfile?.avatar;
  }
  const avatarUrl = finalAvatarUrl || FALLBACK;

  const frameId = profile?.frame_id || 'none';
  const level = profile?.level || 1;
  const showLevelTag = profile ? profile.show_level !== false : false;
  const online = isUserOnline(profile);

  return (
    <div className={`shrink-0 relative ${className}`}>
      <FantasyFrame
        frameId={frameId}
        level={level}
        showLevelTag={showLevelTag}
        className="w-full h-full"
      >
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full rounded-full object-cover bg-black"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
        />
      </FantasyFrame>

      {/* GLOBAL REALTIME ACTIVE GREEN PULSE DOT */}
      {online && (
        <span className="absolute bottom-0 right-0 z-30 flex h-3 w-3 -translate-x-0.5 -translate-y-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-black shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
        </span>
      )}
    </div>
  );
}
