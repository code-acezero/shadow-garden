"use client";

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ArrowDownToLine, ArrowUpFromLine, 
  Settings, CheckCircle2, AlertCircle, Key, ExternalLink, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { pullFromAniList, pushToAniList, twoWaySync } from '@/lib/anilistSync';

interface WatchlistSyncCockpitProps {
  onSyncComplete: () => void;
}

const AnilistLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M6.361 2.841 0 18.26h4.03l1.197-2.973h5.589l1.198 2.973H16.05L9.689 2.841H6.361zm.39 9.176 1.272-3.158 1.271 3.158H6.751zM13.92 5.093h4.031v10.198h5.969V18.26H13.92V5.093z" />
  </svg>
);

export default function WatchlistSyncCockpit({ onSyncComplete }: WatchlistSyncCockpitProps) {
  const { user, profile } = useAuth();
  const [username, setUsername] = useState('codeacezero');
  const [hasToken, setHasToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState<'pull' | 'push' | 'two-way' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check saved username and token in profile or localStorage
    const savedUser = profile?.settings?.anilist_username || localStorage.getItem('anilist_username') || 'codeacezero';
    const savedToken = profile?.settings?.anilist_token || localStorage.getItem('anilist_token');
    setUsername(savedUser);
    setHasToken(!!savedToken);
  }, [profile]);

  const notifyWhisper = (title: string, message: string, type: 'success' | 'error' | 'system' = 'system') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow-whisper', {
        detail: { id: Date.now(), type, title, message }
      }));
    }
  };

  const handleOAuthConnect = () => {
    const clientId = '46235';
    try {
      localStorage.setItem('anilist_auth_redirect', '/watchlist');
      localStorage.setItem('anilist_username', username.trim());
    } catch {}
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=code`;
  };

  const handleSaveManualSettings = async () => {
    const trimmedUser = username.trim() || 'codeacezero';
    localStorage.setItem('anilist_username', trimmedUser);
    if (manualToken.trim()) {
      localStorage.setItem('anilist_token', manualToken.trim());
      setHasToken(true);
    }

    if (user && profile) {
      const updatedSettings = {
        ...(profile.settings || {}),
        anilist_username: trimmedUser,
        ...(manualToken.trim() ? { anilist_token: manualToken.trim() } : {})
      };
      await supabase.from('profiles').update({ settings: updatedSettings }).eq('id', user.id);
    }

    setIsModalOpen(false);
    notifyWhisper('AniList Link', `Configuration saved for @${trimmedUser}`, 'success');
  };

  const handleDisconnect = async () => {
    localStorage.removeItem('anilist_token');
    setHasToken(false);
    setManualToken('');
    if (user && profile) {
      const updatedSettings = { ...(profile.settings || {}) };
      delete updatedSettings.anilist_token;
      await supabase.from('profiles').update({ settings: updatedSettings }).eq('id', user.id);
    }
    notifyWhisper('AniList Link', 'AniList token unlinked.', 'system');
  };

  const runPull = async () => {
    if (!user) {
      notifyWhisper('Auth Required', 'Please enter the Guild to sync library.', 'error');
      return;
    }
    setIsSyncing('pull');
    setStatusMessage('Pulling watchlist from AniList...');
    try {
      const result = await pullFromAniList(username, user.id);
      notifyWhisper('AniList Sync', `Imported ${result.importedCount} entries from @${username}!`, 'success');
      onSyncComplete();
    } catch (e: any) {
      notifyWhisper('Sync Failed', e.message || 'Could not pull from AniList', 'error');
    } finally {
      setIsSyncing(null);
      setStatusMessage(null);
    }
  };

  const runPush = async () => {
    if (!user) {
      notifyWhisper('Auth Required', 'Please enter the Guild to push library.', 'error');
      return;
    }
    const token = localStorage.getItem('anilist_token') || profile?.settings?.anilist_token;
    if (!token) {
      setIsModalOpen(true);
      notifyWhisper('Authorization Required', 'Connect your AniList account or enter token to push changes.', 'system');
      return;
    }

    setIsSyncing('push');
    setStatusMessage('Pushing watchlist to AniList...');
    try {
      const result = await pushToAniList(user.id, token);
      notifyWhisper('AniList Push', `Pushed ${result.pushedCount} items to AniList! (${result.failedCount} skipped)`, 'success');
      onSyncComplete();
    } catch (e: any) {
      notifyWhisper('Push Failed', e.message || 'Could not push to AniList', 'error');
    } finally {
      setIsSyncing(null);
      setStatusMessage(null);
    }
  };

  const runTwoWay = async () => {
    if (!user) {
      notifyWhisper('Auth Required', 'Please enter the Guild to sync library.', 'error');
      return;
    }
    const token = localStorage.getItem('anilist_token') || profile?.settings?.anilist_token;
    setIsSyncing('two-way');
    setStatusMessage('Executing two-way sync...');
    try {
      const result = await twoWaySync(user.id, username, token || undefined);
      if (token && result.pushed) {
        notifyWhisper(
          'Two-Way Sync Complete',
          `Pulled ${result.pulled.importedCount} from AniList. Pushed ${result.pushed.pushedCount} to AniList.`,
          'success'
        );
      } else {
        notifyWhisper(
          'Pulled from AniList',
          `Imported ${result.pulled.importedCount} items. (Connect AniList token for push)`,
          'success'
        );
      }
      onSyncComplete();
    } catch (e: any) {
      notifyWhisper('Sync Error', e.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(null);
      setStatusMessage(null);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-zinc-950 via-[#001f3f]/20 to-zinc-950 border border-white/5 rounded-2xl p-3 sm:p-4 mb-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#02a9ff]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        {/* LEFT: ACCOUNT IDENTIFIER */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#02a9ff]/15 border border-[#02a9ff]/30 text-[#02a9ff] flex items-center justify-center shrink-0 shadow-lg shadow-[#02a9ff]/10">
            <AnilistLogo />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                AniList Sync
              </span>
              <span className="text-[10px] font-mono text-[#02a9ff] font-bold px-2 py-0.5 rounded-full bg-[#02a9ff]/10 border border-[#02a9ff]/20">
                @{username}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasToken ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-sky-400'}`} />
              {hasToken ? 'Two-Way Sync Ready (Push + Pull)' : 'Public Sync Active (Pull Only)'}
            </p>
          </div>
        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* TWO-WAY SYNC */}
          <Button
            onClick={runTwoWay}
            disabled={isSyncing !== null}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg shadow-sky-900/30 gap-1.5 border border-sky-400/30"
          >
            {isSyncing === 'two-way' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Two-Way Sync
          </Button>

          {/* PULL */}
          <Button
            onClick={runPull}
            disabled={isSyncing !== null}
            variant="outline"
            className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200 hover:text-white font-black text-[10px] uppercase tracking-wider gap-1.5"
          >
            {isSyncing === 'pull' ? <Loader2 size={13} className="animate-spin" /> : <ArrowDownToLine size={13} />}
            Pull
          </Button>

          {/* PUSH */}
          <Button
            onClick={runPush}
            disabled={isSyncing !== null}
            variant="outline"
            className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200 hover:text-white font-black text-[10px] uppercase tracking-wider gap-1.5"
          >
            {isSyncing === 'push' ? <Loader2 size={13} className="animate-spin" /> : <ArrowUpFromLine size={13} />}
            Push
          </Button>

          {/* SETTINGS / CONFIG MODAL TRIGGER */}
          <button
            onClick={() => setIsModalOpen(true)}
            title="Configure AniList Sync"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* SYNC PROGRESS STATUS BAR IF ACTIVE */}
      {statusMessage && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-sky-400 font-mono animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* CONFIGURATION MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#0c0c0e] border border-white/10 text-white p-6 rounded-3xl shadow-2xl">
          <DialogTitle className="text-base font-black tracking-wide text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#02a9ff]/20 text-[#02a9ff] flex items-center justify-center">
              <AnilistLogo />
            </div>
            AniList Integration Config
          </DialogTitle>

          <div className="space-y-4 mt-4">
            {/* USERNAME INPUT */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                AniList Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. codeacezero"
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl font-mono text-xs focus:border-[#02a9ff]"
              />
              <p className="text-[9px] text-zinc-500 mt-1">
                Used to pull public watchlists and synchronize library titles.
              </p>
            </div>

            {/* OAUTH CONNECT BUTTON */}
            <div className="p-3.5 rounded-2xl bg-[#02a9ff]/10 border border-[#02a9ff]/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white">OAuth Authorization</h4>
                  <p className="text-[10px] text-zinc-400">Required for pushing and two-way sync.</p>
                </div>
                {hasToken ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 size={10} /> Active
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Unlinked
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleOAuthConnect}
                  className="flex-1 bg-[#02a9ff] hover:bg-[#0284c7] text-white font-black text-xs uppercase tracking-wider rounded-xl h-9 gap-1.5"
                >
                  <ExternalLink size={12} /> {hasToken ? 'Re-Authorize' : 'Connect Account'}
                </Button>
                {hasToken && (
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl h-9"
                  >
                    Unlink
                  </Button>
                )}
              </div>
            </div>

            {/* OPTIONAL MANUAL ACCESS TOKEN */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                <Key size={11} /> Manual Access Token (Optional)
              </label>
              <Input
                type="password"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste Bearer Token from AniList Developer Settings"
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl font-mono text-xs focus:border-[#02a9ff]"
              />
              <p className="text-[9px] text-zinc-500 mt-1">
                You can generate a personal token in your AniList settings (Developer &gt; Create App) if you prefer direct tokens.
              </p>
            </div>

            {/* SAVE BUTTON */}
            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-10 rounded-xl bg-white/5 border-white/10 text-zinc-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveManualSettings}
                className="h-10 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-wider px-5"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
