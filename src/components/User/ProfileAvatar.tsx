import React from 'react';
import FantasyFrame from './FantasyFrame';
import { useTravellerProfile } from '@/hooks/useTravellerProfile';
import { isUserOnline } from '@/components/ui/UserTitleBadge';
import { getFrameForTitle } from '@/lib/userTitles';

interface ProfileAvatarProps {
  profile?: {
    id?: string;
    avatar_url?: string | null;
    frame_id?: string | null;
    level?: number;
    show_level?: boolean;
    is_online?: boolean;
    updated_at?: string;
    admin_title?: string | null;
    title?: string | null;
    role?: string | null;
    [key: string]: any;
  } | null;
  travellerAvatar?: string;
  className?: string;
  showLevel?: boolean;
}

const GOOGLE_AVATAR_FALLBACK = 'https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c';
const ANIME_FALLBACK = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';

function ProfileAvatar({ profile, travellerAvatar, className = "w-10 h-10", showLevel }: ProfileAvatarProps) {
  const travellerProfile = useTravellerProfile();

  const isDeadUrl = (url?: any): boolean => {
    if (!url || typeof url !== 'string') return true;
    return url.includes('imgbb.com') || url.trim() === '';
  };

  const candidates = [
    profile?.avatar_url,
    profile?.avatar,
    profile?.image,
    travellerAvatar,
    (!profile || !profile.id) ? travellerProfile?.avatar : null,
    (profile as any)?.user_metadata?.avatar_url,
    (profile as any)?.user_metadata?.picture,
    GOOGLE_AVATAR_FALLBACK
  ];

  const avatarUrl = candidates.find(c => !isDeadUrl(c)) || GOOGLE_AVATAR_FALLBACK;
  
  // Resolve frame: prioritize explicitly equipped frame, or auto-bestow based on staff title
  let frameId = profile?.frame_id;
  if (!frameId || frameId === 'none') {
    const staffBestowed = getFrameForTitle(profile?.admin_title || profile?.title, profile?.role);
    frameId = staffBestowed || 'none';
  }

  const level = profile?.level || 1;
  const showLevelTag = showLevel !== undefined ? showLevel : (profile ? profile.show_level !== false : false);
  const online = isUserOnline(profile);

  return (
    <div className={`shrink-0 relative ${className}`}>
      <FantasyFrame
        frameId={frameId}
        level={level}
        showLevelTag={showLevelTag}
        avatarUrl={avatarUrl}
        className="w-full h-full"
      >
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full rounded-full object-cover bg-black transition-all"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).src = ANIME_FALLBACK; }}
        />
      </FantasyFrame>
    </div>
  );
}

export default React.memo(ProfileAvatar);
