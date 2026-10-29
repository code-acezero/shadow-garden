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
  const [username, setUsername] = useState('codeacezero');
  const [hasToken, setHasToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState<'pull' | 'push' | 'two-way' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shadowGardenName = user 
    ? (profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User')
    : (traveller?.name || 'Shadow Traveller');

  useEffect(() => {
    const savedUser = profile?.settings?.anilist_username || localStorage.getItem('shadow_anilist_username') || localStorage.getItem('anilist_username') || 'codeacezero';
    const savedToken = profile?.settings?.anilist_token || localStorage.getItem('shadow_anilist_token') || localStorage.getItem('anilist_token');
    setUsername(savedUser);
    setHasToken(!!savedToken && !!user);
  }, [profile, user]);

  const notifyWhisper = (title: string, message: string, type: 'success' | 'error' | 'system' = 'system') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-whisper', {
        detail: { id: Date.now(), type, title, message }
      }));
    }
  };

  const handleOAuthConnect = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }));
      }
      return;
    }
    const clientId = '46235';
    try {
      localStorage.setItem('anilist_auth_redirect', '/library');
      localStorage.setItem('shadow_anilist_username', username.trim());
    } catch {}
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=code`;
  };

  const handleUnbind = async () => {
    try {
      localStorage.removeItem('shadow_anilist_token');
      localStorage.removeItem('anilist_token');
      if (user) {
        await supabase.from('profiles').update({
          settings: {
            ...profile?.settings,
            anilist_token: null,
          }
        }).eq('id', user.id);
      }
      setHasToken(false);
      notifyWhisper('AniList Disconnected', 'Unlinked AniList token from your Vault.', 'system');
    } catch (err: any) {
      notifyWhisper('Unlink Notice', err.message || 'Failed to unbind', 'error');
    }
  };

  const runPull = async (overrideUser?: string) => {
    const targetUser = overrideUser || username.trim();
    if (!targetUser) return;
    setIsSyncing('pull');
    setStatusMessage(`Importing @${targetUser}...`);
    try {
      const result = await pullFromAniList(targetUser, user?.id);
      notifyWhisper('AniList Sync', `Synced ${result.totalAnime} anime & ${result.totalManga} manga titles from @${targetUser}!`, 'success');
      onSyncComplete();
    } catch (err: any) {
      notifyWhisper('AniList Pull Notice', err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(null);
      setStatusMessage(null);
      setIsModalOpen(false);
    }
  };

  const runTwoWaySync = async () => {
    if (!user) {
      notifyWhisper('Binding Required', 'Sign in to Kagemi to run 2-way cloud synchronization.', 'system');
      return;
    }
    setIsSyncing('two-way');
    setStatusMessage('Synchronizing 2-way updates with AniList...');
    try {
      const token = profile?.settings?.anilist_token || localStorage.getItem('shadow_anilist_token') || localStorage.getItem('anilist_token') || undefined;
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
            title={`AniList: @${username} • ${user ? `User: ${shadowGardenName}` : `Traveller: ${shadowGardenName}`}`}
          >
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
              <PuffedAnilist size={13} className="text-white" />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-white font-semibold tracking-tight">@{username || 'anilist'}</span>
              
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
          {/* Header Card tailored by User Role */}
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <PuffedAnilist size={14} />
                <span className="font-bold text-xs text-white">AniList Vault</span>
              </div>
              
              {user && hasToken ? (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  2-Way Sync
                </span>
              ) : user ? (
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  Unbound
                </span>
              ) : (
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  Public Sync
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between font-mono">
                <span className="text-zinc-500 text-[10px]">AniList:</span>
                <span className="text-white font-semibold">@{username}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-mono">
                  {user ? 'User:' : 'Traveller:'}
                </span>
                <span className="text-zinc-200 font-medium">
                  {shadowGardenName}
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

          {/* ─── ROLE-BASED OPTIONS ─── */}
          
          {/* CASE 1: SIGNED IN & BOUND TO ANILIST (FULL 2-WAY SYNC) */}
          {user && hasToken && (
            <>
              <DropdownMenuItem
                onSelect={() => runTwoWaySync()}
                onClick={() => runTwoWaySync()}
                disabled={isSyncing !== null}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer bg-white/10 text-white hover:bg-white/15 focus:bg-white/15 flex items-center gap-2.5 outline-none"
              >
                <PuffedRefresh size={14} className={cn("text-white shrink-0", isSyncing === 'two-way' && "animate-spin")} />
                <div className="flex-1">
                  <div>Two-Way Cloud Sync</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Sync watch/read progress both ways</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => runPull()}
                onClick={() => runPull()}
                disabled={isSyncing !== null}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <ArrowDownToLine size={14} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Force Pull from AniList</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Import newest cloud library</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={handleOAuthConnect}
                onClick={handleOAuthConnect}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <RefreshCw size={13} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Re-authorize / Switch Account</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Refresh OAuth or switch AniList</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => router.push('/settings?tab=integrations')}
                onClick={() => router.push('/settings?tab=integrations')}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <Settings size={14} className="text-zinc-400 shrink-0" />
                <span>Integration Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10 my-1" />

              <DropdownMenuItem
                onSelect={handleUnbind}
                onClick={handleUnbind}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 flex items-center gap-2.5 outline-none"
              >
                <LogOut size={14} className="text-red-400 shrink-0" />
                <div className="flex-1">
                  <div>Unbind AniList Account</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Disconnect 2-way cloud synchronization</div>
                </div>
              </DropdownMenuItem>
            </>
          )}

          {/* CASE 2: SIGNED IN BUT UNBOUND (CAN BIND OR PUBLIC PULL) */}
          {user && !hasToken && (
            <>
              <DropdownMenuItem
                onSelect={handleOAuthConnect}
                onClick={handleOAuthConnect}
                className="rounded-xl px-3 py-2 text-xs font-bold cursor-pointer bg-white text-black hover:bg-zinc-200 focus:bg-zinc-200 flex items-center gap-2.5 outline-none"
              >
                <Link2 size={14} className="text-black shrink-0" />
                <div className="flex-1">
                  <div>Bind AniList Account</div>
                  <div className="text-[10px] text-zinc-700 font-normal">Authorize for 2-way cloud syncing</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => runPull()}
                onClick={() => runPull()}
                disabled={isSyncing !== null}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <ArrowDownToLine size={14} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Pull Public Library</div>
                  <div className="text-[10px] text-zinc-500 font-normal">One-way import from @{username}</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setIsModalOpen(true)}
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <AtSign size={14} className="text-zinc-400 shrink-0" />
                <span>Change Target Username...</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10 my-1" />

              <DropdownMenuItem
                onSelect={() => router.push('/settings?tab=integrations')}
                onClick={() => router.push('/settings?tab=integrations')}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <Settings size={14} className="text-zinc-400 shrink-0" />
                <span>Integration Settings</span>
              </DropdownMenuItem>
            </>
          )}

          {/* CASE 3: TRAVELLER (NOT SIGNED IN TO KAGEMI) */}
          {!user && (
            <>
              <DropdownMenuItem
                onSelect={() => runPull()}
                onClick={() => runPull()}
                disabled={isSyncing !== null}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <ArrowDownToLine size={14} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Pull Public Library</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Import public titles to this device</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setIsModalOpen(true)}
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10 focus:bg-white/10 flex items-center gap-2.5 outline-none"
              >
                <AtSign size={14} className="text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <div>Switch Public Username</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Currently targeted: @{username}</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10 my-1" />

              <DropdownMenuItem
                onSelect={handleOAuthConnect}
                onClick={handleOAuthConnect}
                className="rounded-xl px-3 py-2 text-xs font-bold cursor-pointer bg-white/[0.08] hover:bg-white/15 focus:bg-white/15 text-white flex items-center gap-2.5 outline-none"
              >
                <Link2 size={14} className="text-white shrink-0" />
                <div className="flex-1">
                  <div>Sign In to Bind Vault</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Unlock 2-way cloud synchronization</div>
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
            <span>AniList Configuration</span>
          </DialogTitle>

          <div className="space-y-4 mt-3 text-xs">
            {/* 1. SIGNED IN USER BINDING SECTION */}
            {user ? (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">Direct Account Binding</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {hasToken ? 'Your vault is bound for live 2-way synchronization.' : 'Bind your AniList account to enable 2-way cloud syncing.'}
                    </p>
                  </div>
                  {hasToken && (
                    <span className="text-[10px] font-bold text-white bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">
                      Bound
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleOAuthConnect}
                    className="flex-1 h-9 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs outline-none focus:outline-none focus:ring-0"
                  >
                    <Link2 size={12} className="mr-1.5" />
                    {hasToken ? 'Re-authorize Account' : 'Connect AniList OAuth'}
                  </Button>
                </div>
              </div>
            ) : (
              /* GUEST USER INFORMATION BOX */
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Traveller Public Import</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      You can pull any public AniList watchlist & readlist without an access token.
                    </p>
                  </div>
                </div>

                <div className="pt-1.5 flex items-center justify-between border-t border-white/5">
                  <span className="text-[10px] text-zinc-500">Want live 2-way cloud syncing?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }));
                      }
                    }}
                    className="text-[10px] font-bold text-white hover:underline outline-none focus:outline-none"
                  >
                    Sign In to Bind
                  </button>
                </div>
              </div>
            )}

            {/* 2. PUBLIC USERNAME INPUT FOR PULL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Target AniList Username
              </label>
              <div className="flex gap-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. codeacezero"
                  className="h-9 bg-white/5 border-white/10 text-xs text-white rounded-xl focus:border-white/30 font-mono outline-none focus:outline-none focus:ring-0"
                />
                <Button
                  type="button"
                  onClick={() => runPull(username)}
                  disabled={isSyncing !== null || !username.trim()}
                  className="h-9 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shrink-0 outline-none focus:outline-none focus:ring-0"
                >
                  Pull
                </Button>
              </div>
            </div>

            {/* 3. SETTINGS REDIRECT FOR ADVANCED CONTROLS */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  router.push('/settings?tab=integrations');
                }}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px] outline-none focus:outline-none"
              >
                <span>Open Settings Hub for Auto-Sync & Overrides</span>
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
