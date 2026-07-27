"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Send, Search, Check, Globe, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { toast } from '@/lib/toast';

interface PostShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: {
    id: string;
    content?: string;
    image_url?: string;
    profiles?: {
      username?: string;
      avatar_url?: string;
    };
  } | null;
  customUrl?: string;
  customTitle?: string;
  customContent?: string;
  customImage?: string;
}

export default function PostShareModal({ isOpen, onClose, post, customUrl, customTitle, customContent, customImage }: PostShareModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const shareUrl = customUrl 
    ? customUrl 
    : (typeof window !== 'undefined' && post ? `${window.location.origin}/social?post=${post.id}` : (typeof window !== 'undefined' ? window.location.href : ''));

  const shareTitle = customTitle || (post ? `Post by ${post.profiles?.username || 'Shadow Agent'}` : 'Shadow Garden');
  const shareText = customContent || post?.content || 'Check this out on Shadow Garden!';

  // Fetch candidate users to share DM with
  useEffect(() => {
    if (!isOpen || !supabase || !user) return;

    let isMounted = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        let query = supabase
          .from('profiles')
          .select('id, username, avatar_url, frame_id, level')
          .neq('id', user.id)
          .limit(10);

        if (searchQuery.trim()) {
          query = query.ilike('username', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;
        if (!error && data && isMounted) {
          setUsers(data);
        }
      } catch (err) {
        console.error('Error searching profiles for share:', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery, user]);

  if (!isOpen) return null;

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
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendPrivateMessage = async (recipientId: string) => {
    if (!user || !supabase) return;
    setSendingToId(recipientId);

    try {
      // 1. Find or create conversation
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select('id, participant_ids')
        .contains('participant_ids', [user.id, recipientId]);

      let convId = existingConvs && existingConvs.length > 0 ? existingConvs[0].id : null;

      if (!convId) {
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({ participant_ids: [user.id, recipientId] })
          .select()
          .single();

        if (convErr) throw convErr;
        convId = newConv.id;
      }

      // 2. Send message with link
      const messageText = `Shared link: ${shareUrl}`;
      const { error: msgErr } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          content: messageText,
        });

      if (msgErr) throw msgErr;

      setSentMap(prev => ({ ...prev, [recipientId]: true }));
      toast.success("Link sent in private message!");
    } catch (err: any) {
      console.error("Failed to send DM:", err);
      toast.error(err.message || "Failed to send private message");
    } finally {
      setSendingToId(null);
    }
  };

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check this out on Shadow Garden: ${shareUrl}`)}`
    },
    {
      name: 'Telegram',
      color: 'bg-sky-600/20 text-sky-400 border-sky-500/30 hover:bg-sky-600 hover:text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Twitter / X',
      color: 'bg-zinc-800 text-white border-white/20 hover:bg-white hover:text-black',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600 hover:text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Reddit',
      color: 'bg-orange-600/20 text-orange-400 border-orange-500/30 hover:bg-orange-600 hover:text-white',
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`
    }
  ];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-full sm:max-w-md bg-[#0c0c0e] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
        >
          {/* Mobile Handle Indicator */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wider">Share</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-1 custom-scrollbar">
            {/* Snippet Card */}
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3">
              {post?.profiles ? (
                <ProfileAvatar profile={post.profiles} className="w-9 h-9 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-600/30 border border-primary-500/50 flex items-center justify-center text-primary-400 font-bold shrink-0">
                  <Share2 size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate">{shareTitle}</span>
                <p className="text-[11px] text-zinc-400 line-clamp-1">{shareText}</p>
              </div>
            </div>

            {/* Quick Actions: More & Copy Link */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl bg-primary-600/20 border border-primary-500/40 text-primary-300 hover:bg-primary-600 hover:text-white transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 size={15} /> More
              </button>
              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/15 text-zinc-200 hover:bg-white/10 transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Send in Private Message */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-primary-500" /> Send in Private Message
                </span>
              </div>

              {/* Search User Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search username..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>

              {/* User List */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {loadingUsers ? (
                  <div className="text-center py-3 text-[11px] text-zinc-500">Searching agents...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-3 text-[11px] text-zinc-500">No adventurers found</div>
                ) : (
                  users.map((u) => {
                    const isSent = sentMap[u.id];
                    const isSending = sendingToId === u.id;

                    return (
                      <div key={u.id} className="flex items-center justify-between p-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all">
                        <div className="flex items-center gap-2">
                          <ProfileAvatar profile={u} className="w-7 h-7" />
                          <span className="text-xs font-bold text-zinc-200">{u.username}</span>
                        </div>
                        <button
                          disabled={isSent || isSending}
                          onClick={() => handleSendPrivateMessage(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                            isSent
                              ? 'bg-green-600/20 border border-green-500/40 text-green-400'
                              : 'bg-primary-600/30 border border-primary-500/40 text-primary-300 hover:bg-primary-600 hover:text-white'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <Check size={11} /> Sent
                            </>
                          ) : isSending ? (
                            'Sending...'
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

            {/* Social Share Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={13} className="text-primary-500" /> External Platforms
              </span>
              <div className="flex flex-wrap gap-1.5">
                {socialPlatforms.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono tracking-wider transition-all flex items-center gap-1 ${platform.color}`}
                  >
                    {platform.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
