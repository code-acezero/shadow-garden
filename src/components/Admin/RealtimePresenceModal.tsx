'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search, Globe, User, Shield, Compass, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isGuildMaster } from '@/lib/userTitles';

export interface PresenceUser {
  key: string;
  user_id?: string | null;
  username: string;
  role?: string;
  admin_title?: string | null;
  avatar_url?: string | null;
  current_page?: string;
  is_traveller?: boolean;
  online_at?: string;
}

interface RealtimePresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCount?: number;
}

export const RealtimePresenceModal: React.FC<RealtimePresenceModalProps> = ({
  isOpen,
  onClose,
  initialCount = 1,
}) => {
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'signed_in' | 'travellers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const readCurrentPresence = () => {
      try {
        const channels = supabase.getChannels();
        const globalChan = channels.find((c: any) => c.topic && c.topic.includes('shadow_presence_global'));
        const state = globalChan ? globalChan.presenceState() : {};
        const users: PresenceUser[] = [];

        Object.entries(state).forEach(([key, presences]: [string, any]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const latest = presences[presences.length - 1];
            users.push({
              key,
              user_id: latest.user_id || null,
              username: latest.username || (latest.user_id ? 'Adventurer' : `Traveller #${key.slice(-4).toUpperCase()}`),
              role: latest.role || (latest.user_id ? 'user' : 'traveller'),
              admin_title: latest.admin_title || null,
              avatar_url: latest.avatar_url || null,
              current_page: latest.current_page || '/',
              is_traveller: Boolean(latest.is_traveller || !latest.user_id),
              online_at: latest.online_at || new Date().toISOString(),
            });
          }
        });

        // If list is empty, include at least the current admin viewer so it's never completely blank
        if (users.length === 0) {
          users.push({
            key: 'current_admin_viewer',
            username: 'Guild Master (You)',
            role: 'master',
            admin_title: 'Shadow',
            current_page: '/master',
            is_traveller: false,
            online_at: new Date().toISOString(),
          });
        }

        if (isMounted) {
          setPresenceList(users);
          setIsConnected(true);
        }
      } catch (err) {
        console.warn('Failed to parse presence state:', err);
      }
    };

    readCurrentPresence();
    const interval = setInterval(readCurrentPresence, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  const signedInUsers = useMemo(() => presenceList.filter(u => !u.is_traveller), [presenceList]);
  const travellerUsers = useMemo(() => presenceList.filter(u => u.is_traveller), [presenceList]);

  const filteredUsers = useMemo(() => {
    let base = presenceList;
    if (activeFilter === 'signed_in') base = signedInUsers;
    if (activeFilter === 'travellers') base = travellerUsers;

    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(u => 
      u.username.toLowerCase().includes(q) ||
      (u.current_page && u.current_page.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.admin_title && u.admin_title.toLowerCase().includes(q))
    );
  }, [presenceList, activeFilter, signedInUsers, travellerUsers, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/[0.08] rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient top border */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
              <Radio size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Active Realtime Presence</h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  {presenceList.length} Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">Live adventurers and visitors currently browsing the realm.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-white/[0.06] bg-[#0c0d14]/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeFilter === 'all' 
                  ? "bg-white/[0.12] text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              All ({presenceList.length})
            </button>
            <button
              onClick={() => setActiveFilter('signed_in')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeFilter === 'signed_in' 
                  ? "bg-white/[0.12] text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Adventurers ({signedInUsers.length})
            </button>
            <button
              onClick={() => setActiveFilter('travellers')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeFilter === 'travellers' 
                  ? "bg-white/[0.12] text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Travellers ({travellerUsers.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or page..."
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Active Users Roster */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-white/[0.04] space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No active users matching the current filter.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isGM = isGuildMaster({ username: u.username, role: u.role, admin_title: u.admin_title });
              const isAdmin = u.role === 'admin' || isGM;
              const isMod = u.role === 'moderator';

              return (
                <div key={u.key} className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition-colors">
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      ) : u.is_traveller ? (
                        <Compass size={14} className="text-zinc-400" />
                      ) : (
                        <User size={14} className="text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{u.username}</span>
                        {isGM ? (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Guild Master
                          </span>
                        ) : isAdmin ? (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            Admin
                          </span>
                        ) : isMod ? (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            Mod
                          </span>
                        ) : u.is_traveller ? (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                            Visitor
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-300 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                            Adventurer
                          </span>
                        )}
                        {u.admin_title && !isGM && (
                          <span className="text-[10px] text-zinc-400 hidden sm:inline truncate">
                            ({u.admin_title})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5 truncate">
                        <span className="truncate">Page: <span className="text-zinc-200">{u.current_page || '/'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Tag */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                      Browsing
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0c0d14]/40 flex items-center justify-between text-xs text-zinc-400 px-5">
          <span>Realtime presence synchronized via Supabase fabric</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealtimePresenceModal;
