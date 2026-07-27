"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Share2, Send, Search, Check, Globe, MessageSquare, Play, X, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { toast } from '@/lib/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

export interface MediaShareData {
  id: string;
  title: string;
  poster?: string;
  synopsis?: string;
  type?: string;
  rating?: string;
  totalEpisodes?: number;
  episodeNumber?: number;
  url: string;
}

interface PostShareModalProps {
  post?: {
    id: string;
    content?: string;
    image_url?: string;
    profiles?: {
      username?: string;
      avatar_url?: string;
    };
  } | null;
  mediaData?: MediaShareData | null;
  customUrl?: string;
  customTitle?: string;
  customContent?: string;
  customImage?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PostShareModal({
  post,
  mediaData,
  customUrl,
  customTitle,
  customContent,
  customImage,
  trigger,
  isOpen,
  onClose
}: PostShareModalProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (val: boolean) => {
    setInternalOpen(val);
    if (!val && onClose) onClose();
  };

  const shareUrl = customUrl 
    ? customUrl 
    : (mediaData?.url 
      ? (mediaData.url.startsWith('http') ? mediaData.url : (typeof window !== 'undefined' ? `${window.location.origin}${mediaData.url}` : mediaData.url))
      : (typeof window !== 'undefined' && post ? `${window.location.origin}/social?post=${post.id}` : (typeof window !== 'undefined' ? window.location.href : '')));

  const shareTitle = customTitle || mediaData?.title || (post ? `Post by ${post.profiles?.username || 'Shadow Agent'}` : 'Shadow Garden');
  const shareText = customContent || mediaData?.synopsis || post?.content || 'Check this out on Shadow Garden!';
  const sharePoster = customImage || mediaData?.poster || post?.image_url || post?.profiles?.avatar_url;

  // Auto-load recent chat partners when opening, or search username suggestions when typing
  useEffect(() => {
    if (!open || !supabase || !user) return;

    let isMounted = true;

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const queryTerm = searchQuery.trim().replace(/^@/, '');

        if (!queryTerm) {
          // 1. Auto-load recent chat partners from chat_participants
          const { data: myParts } = await supabase
            .from('chat_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

          if (myParts && myParts.length > 0) {
            const convIds = myParts.map((p: any) => p.conversation_id);
            const { data: recentParts } = await supabase
              .from('chat_participants')
              .select('user_id, profile:profiles(id, username, avatar_url, frame_id, level)')
              .in('conversation_id', convIds)
              .neq('user_id', user.id)
              .limit(12);

            if (recentParts && recentParts.length > 0 && isMounted) {
              const fetchedProfiles = recentParts.map((rp: any) => rp.profile).filter(Boolean);
              // Deduplicate by profile id
              const unique = Array.from(new Map(fetchedProfiles.map((p: any) => [p.id, p])).values());
              setUsers(unique);
              setRecentUsers(unique);
            } else if (isMounted) {
              // Fallback to top profiles if no recent chats exist
              const { data: fallbackProfiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, frame_id, level')
                .neq('id', user.id)
                .limit(8);
              setUsers(fallbackProfiles || []);
            }
          } else if (isMounted) {
            const { data: fallbackProfiles } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, frame_id, level')
              .neq('id', user.id)
              .limit(8);
            setUsers(fallbackProfiles || []);
          }
        } else {
          // 2. Live username search suggestions (same as mention suggestions)
          const { data: searchResults } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, frame_id, level')
            .neq('id', user.id)
            .ilike('username', `%${queryTerm}%`)
            .limit(10);

          if (isMounted) {
            setUsers(searchResults || []);
          }
        }
      } catch (err) {
        console.error('Error fetching share users:', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    const timer = setTimeout(loadUsers, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [open, searchQuery, user]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {}
    } else {
      handleCopyLink();
    }
  };

  const handleSendPrivateMessage = async (recipientId: string) => {
    if (!user || !supabase) {
      toast.error("Please log in to send private messages");
      return;
    }
    setSendingToId(recipientId);

    try {
      // 1. Check for existing direct conversation
      const { data: myParts } = await supabase
        .from('chat_participants')
        .select('conversation_id, conversation:chat_conversations(id, type)')
        .eq('user_id', user.id);

      let convId: string | null = null;
      if (myParts && myParts.length > 0) {
        const directIds = myParts
          .filter((p: any) => p.conversation?.type === 'direct')
          .map((p: any) => p.conversation_id);

        if (directIds.length > 0) {
          const { data: targetParts } = await supabase
            .from('chat_participants')
            .select('conversation_id')
            .in('conversation_id', directIds)
            .eq('user_id', recipientId)
            .limit(1);

          if (targetParts && targetParts.length > 0) {
            convId = targetParts[0].conversation_id;
          }
        }
      }

      // 2. Create direct conversation if missing
      if (!convId) {
        const { data: newConv, error: convErr } = await supabase
          .from('chat_conversations')
          .insert({ type: 'direct' })
          .select()
          .single();

        if (convErr) throw convErr;
        convId = newConv.id;

        await supabase.from('chat_participants').insert([
          { conversation_id: convId, user_id: user.id },
          { conversation_id: convId, user_id: recipientId }
        ]);
      }

      // 3. Construct structured share payload or link
      const sharePayload: MediaShareData = mediaData ? {
        ...mediaData,
        url: shareUrl
      } : {
        id: post?.id || 'post',
        title: shareTitle,
        poster: sharePoster,
        synopsis: shareText,
        type: 'Post',
        url: shareUrl
      };

      const messageContent = `[SHADOW_SHARE]${JSON.stringify(sharePayload)}[/SHADOW_SHARE]`;

      // 4. Send message in chat_messages
      const { error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          content: messageContent,
        });

      if (msgErr) throw msgErr;

      // 5. Update conversation status
      await supabase.from('chat_conversations').update({
        updated_at: new Date().toISOString(),
        last_message_preview: `Shared ${shareTitle}`
      }).eq('id', convId);

      setSentMap(prev => ({ ...prev, [recipientId]: true }));
      toast.success("Shared in chat inbox!");
    } catch (err: any) {
      console.error("Failed to send DM:", err);
      toast.error(err.message || "Failed to send private message");
    } finally {
      setSendingToId(null);
    }
  };

  const content = (
    <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 custom-scrollbar w-full">
      {/* Sleek Preview Card */}
      <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3 shadow-inner">
        {sharePoster ? (
          <div className="w-12 h-16 rounded-xl overflow-hidden relative border border-white/10 shrink-0 shadow-md">
            <img src={sharePoster} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-primary-600/30 border border-primary-500/50 flex items-center justify-center text-primary-400 shrink-0">
            <Share2 size={18} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-black text-white truncate">{shareTitle}</span>
            {mediaData?.type && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary-600/30 text-primary-300 border border-primary-500/30 shrink-0">
                {mediaData.type}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">{shareText}</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleNativeShare}
          className="py-2.5 px-3 rounded-xl bg-primary-600/20 border border-primary-500/40 text-primary-300 hover:bg-primary-600 hover:text-white transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Share2 size={14} /> Native Share
        </button>
        <button
          onClick={handleCopyLink}
          className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/15 text-zinc-200 hover:bg-white/10 transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Send via Direct Message */}
      <div className="space-y-2.5 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={13} className="text-primary-500" /> Send via Chat Inbox
          </span>
          <span className="text-[10px] text-zinc-500 font-semibold">
            {!searchQuery ? 'Recent Chats' : 'User Suggestions'}
          </span>
        </div>

        {/* Search Username Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type @username to search..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* User Suggestions List */}
        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {loadingUsers ? (
            <div className="text-center py-4 text-[11px] text-zinc-500 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Loading suggestions...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-zinc-500">
              {searchQuery ? 'No matching usernames found' : 'No recent chats found'}
            </div>
          ) : (
            users.map((u) => {
              const isSent = sentMap[u.id];
              const isSending = sendingToId === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProfileAvatar profile={u} className="w-8 h-8 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        @{u.username}
                      </span>
                      {u.level !== undefined && (
                        <span className="text-[9px] text-zinc-400 font-mono">Lvl {u.level}</span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isSent || isSending}
                    onClick={() => handleSendPrivateMessage(u.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer",
                      isSent
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-900/30 active:scale-95"
                    )}
                  >
                    {isSending ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isSent ? (
                      <>
                        <Check size={12} /> Sent
                      </>
                    ) : (
                      <>
                        <Send size={11} /> Send
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  if (trigger) {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent className="bg-[#0a0a0d]/95 backdrop-blur-2xl border-t border-white/15 text-white p-4 max-h-[85vh] rounded-t-[32px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Share2 size={16} className="text-primary-500" /> Share Media
              </span>
            </div>
            {content}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-96 bg-[#0a0a0d]/95 backdrop-blur-2xl border border-white/15 text-white p-4 rounded-3xl shadow-2xl z-50">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
            <span className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Share2 size={16} className="text-primary-500" /> Share Media
            </span>
          </div>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // Direct modal trigger mode (via isOpen & onClose)
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0a0d]/95 backdrop-blur-2xl border border-white/15 text-white p-5 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2 shrink-0">
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Share2 size={16} className="text-primary-500" /> Share Media
          </span>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}
