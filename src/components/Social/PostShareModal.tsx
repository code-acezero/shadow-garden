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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Share</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 custom-scrollbar">
            {/* Snippet Card */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3">
              {post?.profiles ? (
                <ProfileAvatar profile={post.profiles} className="w-10 h-10 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-600/30 border border-primary-500/50 flex items-center justify-center text-primary-400 font-bold shrink-0">
                  <Share2 size={18} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate">{shareTitle}</span>
                <p className="text-xs text-zinc-400 line-clamp-1">{shareText}</p>
              </div>
            </div>

            {/* Quick Actions: Native Share & Copy Link */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleNativeShare}
                className="py-3 px-4 rounded-2xl bg-primary-600/20 border border-primary-500/40 text-primary-300 hover:bg-primary-600 hover:text-white transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 size={16} /> Device Share
              </button>
              <button
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-2xl bg-white/5 border border-white/15 text-zinc-200 hover:bg-white/10 transition-all font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Send in Private Message */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-primary-500" /> Send in Private Message
                </span>
              </div>

              {/* Search User Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search adventurer username..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>

              {/* User List */}
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loadingUsers ? (
                  <div className="text-center py-4 text-xs text-zinc-500">Searching agents...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-xs text-zinc-500">No adventurers found</div>
                ) : (
                  users.map((u) => {
                    const isSent = sentMap[u.id];
                    const isSending = sendingToId === u.id;

                    return (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all">
                        <div className="flex items-center gap-2.5">
                          <ProfileAvatar profile={u} className="w-8 h-8" />
                          <span className="text-xs font-bold text-zinc-200">{u.username}</span>
                        </div>
                        <button
                          disabled={isSent || isSending}
                          onClick={() => handleSendPrivateMessage(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                            isSent
                              ? 'bg-green-600/20 border border-green-500/40 text-green-400'
                              : 'bg-primary-600/30 border border-primary-500/40 text-primary-300 hover:bg-primary-600 hover:text-white'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <Check size={12} /> Sent
                            </>
                          ) : isSending ? (
                            'Sending...'
                          ) : (
                            <>
                              <Send size={12} /> Send
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
            <div className="space-y-3 pt-2 border-t border-white/10">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-primary-500" /> External Platforms
              </span>
              <div className="flex flex-wrap gap-2">
                {socialPlatforms.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-xl border text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5 ${platform.color}`}
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
