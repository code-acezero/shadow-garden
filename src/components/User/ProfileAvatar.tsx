import React from 'react';
import FantasyFrame from './FantasyFrame';
import { useTravellerProfile } from '@/hooks/useTravellerProfile';
import { isUserOnline } from '@/components/ui/UserTitleBadge';
import { getFrameForTitle, isGuildMaster } from '@/lib/userTitles';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

interface ProfileAvatarProps {
  profile?: {
    id?: string;
    username?: string | null;
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
  animate?: 'always' | 'inview' | 'hover' | 'never';
  parallax?: boolean;
}

const GUILD_MASTER_GOOGLE_AVATAR = 'https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c';
const ANIME_FALLBACK = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
const ALPHA_AVATAR = '/images/alpha/alpha-av.png';

function ProfileAvatar({ profile, travellerAvatar, className = "w-10 h-10", showLevel, animate, parallax }: ProfileAvatarProps) {
  const travellerProfile = useTravellerProfile();
  const isGM = isGuildMaster(profile);
  const isAlpha = profile?.username?.toLowerCase() === 'alpha' || 
                  profile?.admin_title === 'First Shadow' || 
                  profile?.id === 'sys-alpha-ai';

  const defaultFallback = isGM 
    ? GUILD_MASTER_GOOGLE_AVATAR 
    : isAlpha 
      ? ALPHA_AVATAR 
      : ANIME_FALLBACK;

  const isDeadOrDisallowedUrl = (url?: any): boolean => {
    if (!url || typeof url !== 'string') return true;
    const trimmed = url.trim();
    if (!trimmed || trimmed.includes('imgbb.com') || trimmed.includes('ibb.co')) return true;
    // Disallow non-Guild Masters from inheriting or defaulting to the Guild Master's personal photo
    if (!isGM && trimmed.includes('ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4')) {
      return true;
    }
    return false;
  };

  const candidates = [
    profile?.avatar_url,
    profile?.avatar,
    profile?.image,
    travellerAvatar,
    (!profile || !profile.id) ? travellerProfile?.avatar : null,
    (profile as any)?.user_metadata?.avatar_url,
    (profile as any)?.user_metadata?.picture,
    defaultFallback
  ];

  const rawAvatar = candidates.find(c => !isDeadOrDisallowedUrl(c)) || defaultFallback;
  const avatarUrl = getOptimizedImageUrl(rawAvatar) || defaultFallback;
  
  // Resolve frame: prioritize explicitly equipped frame, or auto-bestow based on staff title
  let frameId = profile?.frame_id;
  if (!frameId || frameId === 'none') {
    const staffBestowed = getFrameForTitle(profile?.admin_title || profile?.title, profile?.role);
    frameId = staffBestowed || 'none';
  }

  const level = profile?.level || 1;
  const showLevelTag = showLevel !== undefined ? showLevel : (profile ? profile.show_level !== false : false);
  const online = isUserOnline(profile as any);

  return (
    <div className={`shrink-0 relative ${className}`}>
      <FantasyFrame
        frameId={frameId}
        level={level}
        showLevelTag={showLevelTag}
        avatarUrl={avatarUrl}
        className="w-full h-full"
        animate={animate}
        parallax={parallax}
      >
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full rounded-full object-cover bg-black transition-all"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).src = defaultFallback; }}
        />
      </FantasyFrame>
    </div>
  );
}

export default React.memo(ProfileAvatar);
