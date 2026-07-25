import React, { useEffect, useRef } from 'react';
import { UserProfile } from '@/lib/types';
import UserTitleBadge from './UserTitleBadge';
import { RoleTitleBadge } from './RoleTitleBadge';
import { Loader2 } from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';

interface MentionDropdownProps {
  suggestions: UserProfile[];
  selectedIndex: number;
  onSelect: (username: string) => void;
  isFetching?: boolean;
  position?: 'top' | 'bottom';
}

export default function MentionDropdown({ suggestions, selectedIndex, onSelect, isFetching, position = 'bottom' }: MentionDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedEl = containerRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (suggestions.length === 0 && !isFetching) return null;

  return (
    <div 
      ref={containerRef}
      className={`absolute left-0 z-[9999] w-72 max-h-52 overflow-y-auto bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col gap-1 custom-scrollbar ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
    >
      {isFetching && suggestions.length === 0 && (
        <div className="flex items-center justify-center p-3 text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      
      {suggestions.map((user, idx) => (
        <button
          key={user.id}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(user.username);
          }}
          className={`flex items-center gap-3 w-full text-left px-3 py-2 transition-colors cursor-pointer ${
            idx === selectedIndex ? 'bg-primary-500/20 border-l-2 border-primary-500' : 'hover:bg-white/5 border-l-2 border-transparent'
          }`}
        >
          <div className="w-8 h-8 shrink-0">
            <ProfileAvatar profile={user} className="w-8 h-8" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white text-xs font-bold truncate">{user.username}</span>
              <UserTitleBadge user={user} variant="bracket" className="text-[10px]" />
            </div>
            {user.role && user.role !== 'user' && (
              <div className="mt-0.5">
                <RoleTitleBadge role={user.role} adminTitle={user.admin_title} className="scale-90 origin-left" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
