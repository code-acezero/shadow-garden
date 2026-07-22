import React from 'react';
import FantasyFrame from './FantasyFrame';

interface ProfileAvatarProps {
  profile?: {
    id?: string;
    avatar_url?: string | null;
    frame_id?: string | null;
    level?: number;
    show_level?: boolean;
    [key: string]: any;
  } | null;
  className?: string;
}

export default function ProfileAvatar({ profile, className = "w-10 h-10" }: ProfileAvatarProps) {
  const seed = profile?.id || 'default';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
  
  return (
    <div className={`shrink-0 ${className}`}>
      <FantasyFrame 
        frameId={profile?.frame_id || 'none'} 
        level={profile?.level || 1} 
        showLevelTag={profile?.show_level !== false} 
      >
        <img 
          src={avatarUrl}
          alt=""
          className="w-full h-full rounded-full object-cover bg-black"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}` }}
        />
      </FantasyFrame>
    </div>
  );
}
