"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, Settings, Loader2, Link2, AtSign, AlertCircle, 
  ChevronDown, Check, LogOut, RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTravellerProfile } from '@/hooks/useTravellerProfile';
import { pullFromAniList, twoWaySync } from '@/lib/anilistSync';
import { PuffedAnilist, PuffedRefresh } from './PuffedIcons';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WatchlistSyncCockpitProps {
  onSyncComplete: () => void;
  mediaType?: 'anime' | 'manga';
}

export default function WatchlistSyncCockpit({ onSyncComplete, mediaType = 'anime' }: WatchlistSyncCockpitProps) {
  const { user, profile } = useAuth();
  const traveller = useTravellerProfile();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState<'pull' | 'push' | 'two-way' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shadowGardenName = user 
    ? (profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Adventurer')
    : (traveller?.name || 'Local Traveller');

  useEffect(() => {
    // Resolve saved username: check profile settings first, then localStorage
    const savedUser = profile?.settings?.anilist_username 
      || (typeof window !== 'undefined' ? (localStorage.getItem('shadow_anilist_username') || localStorage.getItem('anilist_username') || '') : '');
    
    // Resolve saved OAuth token
    const savedToken = profile?.settings?.anilist_token 
      || (typeof window !== 'undefined' ? (localStorage.getItem('shadow_anilist_token') || localStorage.getItem('anilist_token') || '') : '');

    setUsername(savedUser);
    setTempUsername(savedUser);
    setHasToken(!!savedToken);
  }, [profile, user]);

  const notifyWhisper = (title: string, message: string, type: 'success' | 'error' | 'system' = 'system') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-whisper', {
        detail: { id: Date.now(), type, title, message }
      }));
    }
  };

  const persistUsername = (newUsername: string) => {
    const clean = newUsername.trim().replace(/^@+/, '');
    setUsername(clean);
    setTempUsername(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadow_anilist_username', clean);
      localStorage.setItem('anilist_username', clean);
    }
    if (user && supabase) {
      supabase.from('profiles').update({
        settings: {
          ...(profile?.settings || {}),
          anilist_username: clean
        }
      }).eq('id', user.id).then(null, (err: any) => console.warn('Failed to sync username to profile:', err));
    }
    return clean;
  };

  const handleOAuthConnect = () => {
    const clientId = '46235';
    try {
      localStorage.setItem('anilist_auth_redirect', '/library');
      if (username.trim()) {
        localStorage.setItem('shadow_anilist_username', username.trim());
      }
    } catch {}
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=code`;
  };

  const handleUnbind = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shadow_anilist_token');
        localStorage.removeItem('anilist_token');
        localStorage.removeItem('shadow_anilist_username');
        localStorage.removeItem('anilist_username');
      }
      if (user && supabase) {
        const { data: curr } = await supabase.from('profiles').select('settings').eq('id', user.id).single();
        const updated = { ...(curr?.settings || {}) };
        delete updated.anilist_token;
        delete updated.anilist_username;
        delete updated.anilist_connected_at;
        await supabase.from('profiles').update({ settings: updated }).eq('id', user.id);
      }
      setHasToken(false);
      setUsername('');
      setTempUsername('');
      notifyWhisper('AniList Disconnected', 'Unlinked AniList account from your library.', 'system');
      onSyncComplete();
    } catch (err: any) {
      notifyWhisper('Unlink Notice', err.message || 'Failed to disconnect', 'error');
    }
  };

  const runPull = async (targetOverride?: string) => {
    const targetUser = (targetOverride || username || '').trim().replace(/^@+/, '');
    if (!targetUser) {
      setIsModalOpen(true);
      return;
    }

    persistUsername(targetUser);
    setIsSyncing('pull');
    setStatusMessage(`Importing @${targetUser}...`);
    try {
      const result = await pullFromAniList(targetUser, user?.id);
      notifyWhisper('AniList Sync Complete', `Imported ${result.totalAnime} anime & ${result.totalManga} manga titles from @${targetUser}!`, 'success');
      onSyncComplete();
    } catch (err: any) {
      notifyWhisper('AniList Sync Notice', err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(null);
      setStatusMessage(null);
      setIsModalOpen(false);
    }
  };

  const runTwoWaySync = async () => {
    if (!user) {
      notifyWhisper('Sign In Required', 'Sign in to Kagemi to run 2-way cloud synchronization with AniList.', 'system');
      return;
    }
    const token = profile?.settings?.anilist_token 
      || (typeof window !== 'undefined' ? (localStorage.getItem('shadow_anilist_token') || localStorage.getItem('anilist_token')) : undefined);
    
    if (!token) {
      handleOAuthConnect();
      return;
    }

    setIsSyncing('two-way');
    setStatusMessage('Synchronizing 2-way updates with AniList...');
    try {
      const res = await twoWaySync(user.id, username, token, { targetMediaType: mediaType });
      notifyWhisper('2-Way Sync Complete', `Synced ${res.pulledCount || 0} incoming updates · ${res.pushedCount || 0} pushed to AniList!`, 'success');
      onSyncComplete();
    } catch (err: any) {
      notifyWhisper('2-Way Sync Error', err.message || 'Synchronization failed', 'error');
    } finally {
      setIsSyncing(null);
      setStatusMessage(null);
    }
  };

  return (
    <>
      {/* COMPACT MINI DROPDOWN TRIGGER */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all text-xs flex items-center gap-2 select-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:scale-95 shrink-0",
              isSyncing && "border-white/30"
            )}
            title={username ? `AniList: @${username} • ${user ? `User: ${shadowGardenName}` : `Traveller: ${shadowGardenName}`}` : 'Connect AniList'}
          >
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
              <PuffedAnilist size={13} className="text-white" />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-white font-semibold tracking-tight">
                {username ? `@${username}` : 'AniList Sync'}
              </span>
              
              <span className="text-zinc-600 font-sans">·</span>
              
              <span className="text-zinc-400 font-sans font-medium text-[10px] truncate max-w-[120px] sm:max-w-none">
                {user ? `User: ${shadowGardenName}` : `Traveller: ${shadowGardenName}`}
              </span>

              {isSyncing && (
                <Loader2 size={10} className="animate-spin text-white ml-0.5 shrink-0" />
              )}
            </div>

            <ChevronDown size={11} className="text-zinc-500 shrink-0 ml-0.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-2 shadow-2xl z-[100] outline-none"
        >
          {/* Header Card with Accurate Status Badge */}
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <PuffedAnilist size={14} />
                <span className="font-bold text-xs text-white">AniList Vault</span>
              </div>
              
              {hasToken ? (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  2-Way Synced
                </span>
              ) : username ? (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  Connected
                </span>
              ) : (
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  Not Linked
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between font-mono">
                <span className="text-zinc-500 text-[10px]">AniList:</span>
                <span className="text-white font-semibold">
                  {username ? `@${username}` : 'Not connected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-mono">
                  {user ? 'Adventurer:' : 'Traveller:'}
                </span>
                <span className="text-zinc-200 font-medium">
                  {shadowGardenName}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-0.5">
                <span className="text-zinc-500 font-mono">Sync Mode:</span>
                <span className="text-zinc-300 font-mono text-[9.5px]">
                  {hasToken ? '2-Way Cloud Sync' : username ? (user ? 'Cloud Database Mirror' : 'Local Device Mirror') : 'None'}
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-mono text-zinc-300">
                <Loader2 size={10} className="animate-spin text-white shrink-0" />
                <span className="truncate">{statusMessage}</span>
              </div>
            )}
          </div>

          {/* ─── ACTION OPTIONS ─── */}
          {username ? (
            <>
              {/* PRIMARY ACTION: PULL / SYNC LIBRARY */}
              <DropdownMenuItem
                onSelect={() => runPull()}
                onClick={() => runPull()}
                disabled={isSyncing !== null}
                className="rounded-xl px-3 py-2 text-xs font-bold cursor-pointer bg-white text-black hover:bg-zinc-200 focus:bg-zinc-200 flex items-center gap-2.5 outline-none mb-1"
              >
                <ArrowDownToLine size={14} className="text-black shrink-0" />
                <div className="flex-1">
                  <div>Sync Library from @{username}</div>
                  <div className="text-[10px] text-zinc-700 font-normal">
                    {user ? 'Import and refresh your cloud library' : 'Import and refresh titles on this device'}
                  </div>
                </div>
              </DropdownMenuItem>

              {/* 2-WAY OAUTH SYNC OPTION */}
              {hasToken ? (
                <DropdownMenuItem
                  onSelect={() => runTwoWaySync()}
                  onClick={() => runTwoWaySync()}
                  disabled={isSyncing !== null}
                  className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
                >
                  <PuffedRefresh size={14} className={cn("text-white shrink-0", isSyncing === 'two-way' && "animate-spin")} />
                  <div className="flex-1">
                    <div>Two-Way Cloud Sync Now</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Push and pull progress with AniList</div>
                  </div>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={handleOAuthConnect}
                  onClick={handleOAuthConnect}
                  className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
                >
                  <Link2 size={14} className="text-zinc-400 shrink-0" />
                  <div className="flex-1">
                    <div>Enable 2-Way Sync (OAuth)</div>
                    <div className="text-[10px] text-zinc-500 font-normal">Authorize to push progress back to AniList</div>
                  </div>
                </DropdownMenuItem>
              )}

              {/* SWITCH / CHANGE TARGET USERNAME */}
              <DropdownMenuItem
                onSelect={() => setIsModalOpen(true)}
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <AtSign size={14} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Change Target Username...</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Switch linked AniList profile</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10 my-1" />

              {/* SETTINGS */}
              <DropdownMenuItem
                onSelect={() => router.push('/settings?tab=integrations')}
                onClick={() => router.push('/settings?tab=integrations')}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <Settings size={14} className="text-zinc-400 shrink-0" />
                <span>Integration Settings</span>
              </DropdownMenuItem>

              {/* UNLINK / DISCONNECT */}
              <DropdownMenuItem
                onSelect={handleUnbind}
                onClick={handleUnbind}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 flex items-center gap-2.5 outline-none"
              >
                <LogOut size={14} className="text-red-400 shrink-0" />
                <span>Disconnect AniList</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {/* CONNECT FLOW WHEN NOT YET LINKED */}
              <DropdownMenuItem
                onSelect={() => setIsModalOpen(true)}
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl px-3 py-2 text-xs font-bold cursor-pointer bg-white text-black hover:bg-zinc-200 focus:bg-zinc-200 flex items-center gap-2.5 outline-none mb-1"
              >
                <AtSign size={14} className="text-black shrink-0" />
                <div className="flex-1">
                  <div>Connect AniList Username</div>
                  <div className="text-[10px] text-zinc-700 font-normal">Enter your username to mirror your library</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={handleOAuthConnect}
                onClick={handleOAuthConnect}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <Link2 size={14} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Authorize AniList Account</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Sign in with AniList for 2-way cloud syncing</div>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* SYNC / BIND CONFIG MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0c] border border-white/10 text-white rounded-2xl p-6 shadow-2xl outline-none">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <PuffedAnilist size={18} />
            <span>AniList Vault Configuration</span>
          </DialogTitle>

          <div className="space-y-4 mt-3 text-xs">
            {/* 1. STATUS SUMMARY */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Connection Status</span>
                <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  {hasToken ? '2-Way Synced' : username ? 'Connected (Mirror Active)' : 'Not Connected'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {user 
                  ? 'Your watchlist and readlist are securely stored in your personal Supabase database and sync seamlessly with AniList.'
                  : 'You are browsing as a Local Traveller. Your AniList titles will be stored safely on this device.'}
              </p>
            </div>

            {/* 2. USERNAME INPUT & SYNC */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
                AniList Username
              </label>
              <div className="flex gap-2">
                <Input
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="e.g. codeacezero"
                  className="h-9 bg-white/5 border-white/10 text-xs text-white rounded-xl focus:border-white/30 font-mono outline-none focus:outline-none focus:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      runPull(tempUsername);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => runPull(tempUsername)}
                  disabled={isSyncing !== null || !tempUsername.trim()}
                  className="h-9 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shrink-0 outline-none focus:outline-none focus:ring-0"
                >
                  {isSyncing ? <Loader2 size={12} className="animate-spin" /> : 'Save & Sync'}
                </Button>
              </div>
            </div>

            {/* 3. OAUTH UPGRADE CALLOUT */}
            {!hasToken && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-400">
                  <span className="text-white font-semibold">Want 2-Way Sync?</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Authorize AniList OAuth to push progress automatically.</p>
                </div>
                <Button
                  type="button"
                  onClick={handleOAuthConnect}
                  className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 outline-none focus:outline-none focus:ring-0"
                >
                  <Link2 size={11} className="mr-1" />
                  Authorize
                </Button>
              </div>
            )}

            {/* 4. SETTINGS REDIRECT & CLOSE */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  router.push('/settings?tab=integrations');
                }}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px] outline-none focus:outline-none"
              >
                <span>Integration Hub</span>
                <span>↗</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="h-8 px-3 rounded-xl text-zinc-400 hover:text-white text-xs outline-none focus:outline-none focus:ring-0"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
