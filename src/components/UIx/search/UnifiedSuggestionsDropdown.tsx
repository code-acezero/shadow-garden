"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Hash, ArrowRight, CornerDownLeft, 
  Terminal, Search
} from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import UserTitleBadge from '@/components/ui/UserTitleBadge';
import { cn } from '@/lib/utils';
import { playGummyTap } from '@/lib/audioManager';

interface UnifiedSuggestionsDropdownProps {
  suggestions: any[];
  query: string;
  activeTargetLabel?: string;
  onSuggestionClick: (item: any) => void;
  onSeeAllClick: () => void;
}

export const UnifiedSuggestionsDropdown: React.FC<UnifiedSuggestionsDropdownProps> = ({
  suggestions,
  query,
  activeTargetLabel,
  onSuggestionClick,
  onSeeAllClick,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: '#0c1322' }}
        className="!absolute top-full mt-3 left-0 right-0 bg-[#0c1322] border border-white/[0.14] rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] p-2 z-[100] ring-1 ring-white/10 max-h-[75vh] overflow-y-auto scrollbar-hide text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category Header */}
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/[0.06] mb-1">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <Search size={10} className="text-primary-500" />
            {activeTargetLabel ? `Target: ${activeTargetLabel}` : 'Search Results'}
          </span>
          <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">
            {suggestions.length} found
          </span>
        </div>

        {/* Suggestion Items */}
        <div className="space-y-1">
          {suggestions.map((item: any) => {
            // 1. Prefix Shortcut Guide Item
            if (item.isPrefixGuide) {
              const Icon = item.icon || Terminal;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playGummyTap();
                    onSuggestionClick(item);
                  }}
                  className="flex items-center gap-2.5 p-2 hover:bg-white/[0.07] rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-white/10"
                >
                  <div className={cn("p-1.5 rounded-xl shrink-0 border", item.badgeBg, item.badgeColor)}>
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white group-hover:text-primary-400 transition-colors">
                          {item.targetPrefix || item.title}
                        </span>
                        <span className="text-[11px] text-zinc-300 font-medium">
                          Target {item.type}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        ↵ Select
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all mr-1" />
                </div>
              );
            }

            // 2. User or Clan Item
            const isUser = item._kind === 'user' || item.type === 'User' || item.type === 'Guild Master' || item.type === 'Adventurer';
            const isClan = item._kind === 'clan' || item.type === 'Guild Clan';
            const isPost = item._kind === 'post';
            const isNews = item._kind === 'news';
            const raw = item.rawUser || {};

            return (
              <div
                key={item.id}
                onClick={() => {
                  playGummyTap();
                  onSuggestionClick(item);
                }}
                className="flex items-center gap-3 p-1.5 hover:bg-white/[0.08] rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-white/10"
              >
                {/* Media Poster or Avatar */}
                {isUser ? (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center my-1 ml-0.5">
                    <ProfileAvatar 
                      profile={{
                        ...raw,
                        id: raw.id || item.id,
                        username: raw.username || item.title,
                        avatar_url: raw.avatar_url || item.image,
                        frame_id: raw.frame_id || item.frame_id || 'none',
                        level: raw.level || item.level || 1,
                        show_level: raw.show_level ?? item.show_level ?? true
                      }} 
                      className="w-10 h-10" 
                    />
                  </div>
                ) : (item.image || item.poster) ? (
                  <img
                    src={item.image || item.poster || '/images/no-poster.png'}
                    className={cn(
                      "object-cover rounded-xl bg-zinc-800 shadow-md shrink-0",
                      isPost ? "w-8 h-8 rounded-full" : "w-9 h-12"
                    )}
                    alt=""
                    onError={(e) => { e.currentTarget.src = '/images/no-poster.png'; }}
                  />
                ) : (
                  <div className={cn(
                    "flex items-center justify-center bg-zinc-800/80 border border-white/10 rounded-xl shrink-0",
                    isPost ? "w-8 h-8 rounded-full" : "w-9 h-12"
                  )}>
                    {isClan ? <Users size={14} className="text-zinc-400" /> : <Hash size={14} className="text-zinc-400" />}
                  </div>
                )}

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors truncate max-w-[260px] md:max-w-[340px]">
                      {item.title}
                    </span>
                    {isUser && <UserTitleBadge user={item.rawUser || item} variant="bracket" className="shrink-0 text-[10px]" />}
                    {item.type && (
                      <span className={cn(
                        "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-wider shrink-0",
                        item.badgeColor || "text-zinc-400 border-white/10 bg-white/5",
                        item.badgeBg || "bg-white/5"
                      )}>
                        {item.type}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-medium uppercase mt-0.5 truncate">
                    {item.subtitle || `${item.duration || ''} ${item.releaseDate ? `• ${item.releaseDate}` : ''}`}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2 text-zinc-500 group-hover:text-white">
                  <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: See All Results */}
        <div
          onClick={() => {
            playGummyTap();
            onSeeAllClick();
          }}
          className="p-2.5 mt-1 border-t border-white/[0.08] text-center text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <span>See All Results for "{query}"</span>
          <CornerDownLeft size={11} className="text-primary-400" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedSuggestionsDropdown;
