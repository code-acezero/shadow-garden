"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  MessageSquare, Send, Users, User, Image as ImageIcon, Search, Shield, 
  Loader2, MessageSquarePlus, Heart, ArrowLeft, Plus, Check, CheckCheck, X, Circle, MoreVertical, Trash2, Mic, Square, Ban, Smile, Globe, Play, Pause, Volume2, ChevronRight, Info, Edit3
} from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import ClanAvatar from '@/components/Social/Clans/ClanAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';
import { ImageAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/components/Auth/AuthModal';
import { RoleTitleBadge } from '@/components/ui/RoleTitleBadge';
import { getUserTitle } from '@/components/ui/UserTitleBadge';
import { useMentions } from '@/hooks/useMentions';
import MentionDropdown from '@/components/ui/MentionDropdown';
import { cn } from '@/lib/utils';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  audio_url?: string;
  gif_url?: string;
  created_at: string;
  updated_at?: string;
  reply_to_message?: any;
  reactions?: Record<string, string[]>;
  sender?: {
    username: string;
    avatar_url: string;
    frame_id?: string;
    level?: number;
    show_level?: boolean;
    role?: string;
    admin_title?: string;
  };
}

function VoiceMessagePlayer({ audioUrl, isMe }: { audioUrl: string; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([40, 75, 55, 90, 60, 85, 45, 100, 70, 50, 80, 65, 95, 40, 60, 30]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    let isMounted = true;

    const analyzeAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        try {
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          if (isMounted) {
            const exactDur = audioBuffer.duration;
            if (exactDur && !isNaN(exactDur) && isFinite(exactDur)) {
              setDuration(exactDur);
            }

            const channelData = audioBuffer.getChannelData(0);
            const samplesPerBar = Math.floor(channelData.length / 16);
            const peaks: number[] = [];

            for (let i = 0; i < 16; i++) {
              const start = i * samplesPerBar;
              let sum = 0;
              for (let j = start; j < start + samplesPerBar && j < channelData.length; j++) {
                sum += Math.abs(channelData[j]);
              }
              const avg = sum / (samplesPerBar || 1);
              const heightPct = Math.max(15, Math.min(100, Math.round(avg * 400)));
              peaks.push(heightPct);
            }

            if (peaks.length === 16 && peaks.some(p => p > 15)) {
              setWaveformPeaks(peaks);
            }
          }
        } finally {
          audioCtx.close().catch(() => {});
        }
      } catch (err) {
        audio.addEventListener('loadedmetadata', () => {
          if (!isMounted) return;
          if (audio.duration === Infinity) {
            audio.currentTime = 1e101;
            audio.ontimeupdate = () => {
              audio.ontimeupdate = null;
              if (isMounted && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
              }
              audio.currentTime = 0;
            };
          } else if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        });
      }
    };

    analyzeAudio();

    audio.ontimeupdate = () => {
      if (isMounted) setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      if (isMounted) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    return () => {
      isMounted = false;
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatSecs = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3.5 py-2 rounded-2xl select-none max-w-xs",
      isMe 
        ? "bg-white/10 text-white" 
        : "bg-white/[0.08] text-white"
    )}>
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95",
          isMe ? "bg-white text-primary-600 hover:bg-white/90" : "bg-primary-500 text-white hover:bg-primary-600"
        )}
      >
        {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-[120px] gap-1">
        <div className="flex items-center gap-0.5 h-6">
          {waveformPeaks.map((h, i) => {
            const barProgress = i / waveformPeaks.length;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-all duration-150",
                  isPlayed 
                    ? (isMe ? "bg-white" : "bg-primary-400") 
                    : (isMe ? "bg-white/30" : "bg-white/20")
                )}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] opacity-70 font-mono">
          <span>{formatSecs(currentTime)}</span>
          <span>{formatSecs(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function SharedMediaCard({ data, isMe }: { data: any; isMe: boolean }) {
  const router = useRouter();
  if (!data) return null;

  const isPost = data.kind === 'post' || data.type === 'POST';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPost && data.url) {
      router.push(data.url);
    } else if (data.url) {
      router.push(data.url);
    } else if (data.animeId) {
      router.push(`/watch/${data.animeId}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "cursor-pointer my-1 rounded-2xl border p-2.5 transition-all text-left max-w-sm group",
        isMe 
          ? "bg-white/10 border-white/20 text-white hover:bg-white/15" 
          : "bg-white/[0.06] border-white/10 hover:bg-white/[0.09] text-white"
      )}
    >
      <div className="flex gap-2.5 items-center">
        {data.poster ? (
          <div className="w-12 h-16 shrink-0 rounded-xl overflow-hidden relative border border-white/10 shadow-sm bg-zinc-900">
            <img 
              src={data.poster} 
              alt={data.title || ''} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          </div>
        ) : (
          <div className="w-12 h-16 shrink-0 rounded-xl bg-primary-950/40 border border-primary-500/30 flex items-center justify-center text-primary-400">
            <MessageSquare size={18} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary-400 block mb-0.5">
            {isPost ? 'Shared Post' : 'Shared Anime'}
          </span>
          <h4 className="text-xs font-bold text-white truncate group-hover:text-primary-300 transition-colors">
            {data.title || 'View Content'}
          </h4>
          {data.synopsis && (
            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
              {data.synopsis}
            </p>
          )}
          <span className="text-[10px] font-semibold text-primary-400 flex items-center gap-1 mt-1">
            <span>{isPost ? 'View Post' : 'Watch Now'}</span>
            <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChatSystem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get('chatId') || searchParams.get('id');
  const userIdParam = searchParams.get('userId') || searchParams.get('user');

  const { user, profile: rawProfile } = useAuth();
  const profile = rawProfile as any;
  const effectiveRole = profile?.role || user?.user_metadata?.role || (user as any)?.role || 'user';
  const isLeaderOrStaff = effectiveRole === 'admin' || effectiveRole === 'moderator' || profile?.username === 'Ace_Zero' || profile?.username === 'azim3070334';

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatIdParam || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // In-memory Message Cache for 0ms Instant Conversation Switching
  const messagesCacheRef = useRef<Record<string, ChatMessage[]>>({});
  const activeConvRef = useRef<any>(activeConv);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Liked Messages Set (Instagram Double-Tap Hearts)
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(() => new Set());

  // Realtime Presence State
  const [activeUsers, setActiveUsers] = useState<Record<string, any>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [chatChannel, setChatChannel] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([30, 45, 25, 60, 40, 80, 35, 70, 30, 65, 40, 50, 30, 55, 25, 40]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<any>(null);

  // Message Actions & Reply State
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [openMsgMenuId, setOpenMsgMenuId] = useState<string | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<any | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMsgMenuId(null);
    };
    if (openMsgMenuId) {
      document.addEventListener('click', handleGlobalClick);
    }
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [openMsgMenuId]);

  const [showGifTray, setShowGifTray] = useState(false);
  const [gifQuery, setGifQuery] = useState('anime');
  const [gifResults, setGifResults] = useState<Array<{id: string; url: string; preview: string}>>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const TENOR_KEY = 'LIVDSRZULELA';

  const fetchGifs = useCallback(async (query: string) => {
    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=16`
        : `https://g.tenor.com/v1/trending?key=${TENOR_KEY}&limit=16`;
      const res = await fetch(endpoint);
      const json = await res.json();
      setGifResults((json.results || []).map((g: any) => ({
        id: g.id,
        url: g.media[0].gif.url,
        preview: g.media[0].tinygif.url,
      })));
    } catch {
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  }, []);

  const {
    mentionState,
    handleKeyDown: handleMentionKeyDown,
    insertMention,
  } = useMentions(inputMsg, (username) => {
    setInputMsg(insertMention(username));
  });

  // Mark Conversation As Read
  const markAsRead = useCallback(async (convId: string) => {
    if (!user || !supabase || !convId) return;
    try {
      const now = new Date().toISOString();
      await supabase
        .from('chat_participants')
        .update({ last_read_at: now })
        .eq('conversation_id', convId)
        .eq('user_id', user.id);

      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return { ...c, unread_count: 0, participant_last_read: now };
        }
        return c;
      }));
    } catch (e) {
      console.error('Error marking conversation as read:', e);
    }
  }, [user]);

  // Fast Select Conversation (Instant 0ms Switch)
  const handleSelectConv = useCallback((conv: any) => {
    playGummyTap();
    setActiveConv(conv);
    const targetId = conv?.id || null;
    setSelectedChatId(targetId);

    if (conv) {
      markAsRead(conv.id);
      // Immediately render cached messages if present!
      if (messagesCacheRef.current[conv.id]) {
        setMessages(messagesCacheRef.current[conv.id]);
      }
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/messages?chatId=${conv.id}`);
      }
    } else if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/messages');
    }
  }, [markAsRead]);

  // 1. Fetch User Conversations (Single Fast Query - No Promise.all Flooding!)
  const fetchConversations = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversation:chat_conversations(
            id,
            type,
            clan_id,
            last_message_preview,
            updated_at,
            created_at,
            clan:clans(name, avatar_url, level),
            participants:chat_participants(
              user:profiles(id, username, avatar_url, last_seen_at, frame_id, level, show_level, title, role, admin_title)
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const rawConvs = (data || []).map((p: any) => {
        const conv = p.conversation;
        if (conv) {
          conv.participant_last_read = p.last_read_at;
          conv.unread_count = 0;
        }
        return conv;
      }).filter(Boolean).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // Deduplicate direct conversations by other user ID
      const uniqueConvs: any[] = [];
      const seenDirectUserIds = new Set<string>();

      for (const conv of rawConvs) {
        if (conv.type === 'direct') {
          const otherUser = conv.participants?.find((p: any) => p.user?.id !== user.id)?.user;
          const targetId = otherUser?.id || otherUser?.username;
          if (targetId) {
            if (seenDirectUserIds.has(targetId) && conv.id !== selectedChatId) {
              continue;
            }
            seenDirectUserIds.add(targetId);
          }
        }
        uniqueConvs.push(conv);
      }

      let convs = uniqueConvs;

      // If chatIdParam is specified in URL but missing from user's current conv list (e.g. newly created)
      const targetChatId = selectedChatId || chatIdParam;
      if (targetChatId && !convs.some((c: any) => c.id === targetChatId)) {
        const { data: targetConv } = await supabase
          .from('chat_conversations')
          .select(`
            id,
            type,
            clan_id,
            last_message_preview,
            updated_at,
            created_at,
            clan:clans(name, avatar_url, level),
            participants:chat_participants(
              user:profiles(id, username, avatar_url, last_seen_at, frame_id, level, show_level, title, role, admin_title)
            )
          `)
          .eq('id', targetChatId)
          .maybeSingle();

        if (targetConv) {
          convs.unshift(targetConv);
        }
      }

      setConversations(convs);

      // Auto-select on initial load
      if (!activeConvRef.current && convs.length > 0) {
        if (targetChatId) {
          const match = convs.find((c: any) => c.id === targetChatId);
          if (match) {
            setActiveConv(match);
            setSelectedChatId(match.id);
          }
        } else if (userIdParam) {
          const match = convs.find((c: any) => {
            if (c.type !== 'direct') return false;
            const otherUser = c.participants?.find((p: any) => p?.user && p.user.id !== user.id)?.user;
            return otherUser?.id === userIdParam || otherUser?.username?.toLowerCase() === userIdParam.toLowerCase();
          });
          if (match) {
            setActiveConv(match);
            setSelectedChatId(match.id);
          }
        } else if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveConv(convs[0]);
          setSelectedChatId(convs[0].id);
        }
      }
    } catch (err: any) {
      console.error('Fetch convs error:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, chatIdParam, userIdParam, selectedChatId]);

  // 2. Fetch Messages with In-Memory Caching (Zero Stutter!)
  const fetchMessages = useCallback(async (targetId?: string) => {
    const convId = targetId || activeConvRef.current?.id;
    if (!convId || !supabase) return;

    // Check cache first for 0ms instant display
    if (messagesCacheRef.current[convId] && messagesCacheRef.current[convId].length > 0) {
      setMessages(messagesCacheRef.current[convId]);
    }

    try {
      let { data, error } = await supabase
        .from('chat_messages')
        .select(`*, sender:profiles(*)`)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Primary fetch messages error, fallback select:', error.message);
        const fallback = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });
        data = fallback.data;
      }

      const loaded = data || [];
      messagesCacheRef.current[convId] = loaded;

      if (activeConvRef.current?.id === convId) {
        setMessages(loaded);
      }
      markAsRead(convId);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, [markAsRead]);

  // Initial Load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Active Chat Subscription & Presence
  useEffect(() => {
    const activeId = activeConv?.id;
    if (!activeId || !supabase) return;

    // Show cached messages instantly!
    if (messagesCacheRef.current[activeId]) {
      setMessages(messagesCacheRef.current[activeId]);
    } else {
      setMessages([]);
    }

    fetchMessages(activeId);

    const channel = supabase.channel(`chat-${activeId}`);
    setChatChannel(channel);

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const online: Record<string, any> = {};
        const typing: Record<string, boolean> = {};
        
        for (const id in newState) {
          // @ts-ignore
          const presences = newState[id] as any[];
          if (presences && presences.length > 0) {
            const p = presences[0];
            if (p?.user_id && p.user_id !== user?.id) {
              online[p.user_id] = p;
              if (p.typing) typing[p.user_id] = true;
            }
          }
        }
        setActiveUsers(online);
        setTypingUsers(typing);
      })
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }: { payload: any }) => {
          if (payload && payload.conversation_id === activeId) {
            setMessages(prev => {
              if (prev.some(m => m.id === payload.id)) return prev;
              const next = [...prev, payload];
              messagesCacheRef.current[activeId] = next;
              return next;
            });
            markAsRead(activeId);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'message_reaction' },
        ({ payload }: { payload: any }) => {
          if (payload?.messageId) {
            setLikedMessageIds(prev => {
              const next = new Set(prev);
              if (payload.liked) next.add(payload.messageId);
              else next.delete(payload.messageId);
              return next;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${activeId}` },
        (payload: any) => {
          // Only fetch if incoming message is from another sender to avoid overwriting optimistic updates
          if (payload.new && payload.new.sender_id !== user?.id) {
            fetchMessages(activeId);
          }
        }
      )
      .subscribe(async (status: any) => {
        if (status === 'SUBSCRIBED' && user) {
          try {
            await channel.track({
              user_id: user.id,
              username: user.user_metadata?.username,
              typing: false,
              online_at: new Date().toISOString()
            });
          } catch {}
        }
      });

    return () => {
      try { channel.untrack(); } catch {}
      supabase.removeChannel(channel);
      setChatChannel(null);
    };
  }, [activeConv?.id, fetchMessages, markAsRead, user]);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing Indicator Tracker
  useEffect(() => {
    if (!chatChannel || !user) return;
    const handleTyping = setTimeout(async () => {
      await chatChannel.track({
        user_id: user.id,
        username: user.user_metadata?.username,
        typing: inputMsg.trim().length > 0,
        online_at: new Date().toISOString()
      });
    }, 250);
    return () => clearTimeout(handleTyping);
  }, [inputMsg, chatChannel, user]);

  // Audio Upload Helper
  const uploadAudio = async (blob: Blob): Promise<string> => {
    if (!supabase || !user) throw new Error('Auth required');
    const fileExt = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `voice_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `voice-messages/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, blob, { contentType: blob.type, upsert: true });

    if (uploadError) {
      console.warn('Storage upload fallback, attempting direct upload:', uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Double-Tap Heart Reaction (Instagram Style)
  const handleHeartReaction = useCallback((msgId: string) => {
    playGummyPop(0.3);
    setLikedMessageIds(prev => {
      const next = new Set(prev);
      const isLiked = !next.has(msgId);
      if (isLiked) next.add(msgId);
      else next.delete(msgId);

      // Broadcast reaction to channel
      if (chatChannel) {
        chatChannel.send({
          type: 'broadcast',
          event: 'message_reaction',
          payload: { messageId: msgId, liked: isLiked }
        });
      }
      return next;
    });
  }, [chatChannel]);

  // Instant Send Heart Message (Instagram Heart Button)
  const sendHeartMessage = useCallback(() => {
    handleSendMessage(undefined, undefined, '❤️');
  }, [activeConv, user]);

  // Alpha AI Auto Response Trigger
  const triggerAlphaResponse = useCallback(async (currentConvId: string, lastUserMessage: string) => {
    setTypingUsers(prev => ({ ...prev, '5d38da6e-b568-4499-ab67-f588354add5d': true }));

    setTimeout(async () => {
      try {
        const { data: recentMsgs } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', currentConvId)
          .order('created_at', { ascending: true })
          .limit(20);

        const history = (recentMsgs || []).map((m: any) => ({
          role: m.sender_id === '5d38da6e-b568-4499-ab67-f588354add5d' ? 'model' : 'user',
          parts: [{ text: m.content || (m.image_url ? '[Sent an image]' : m.audio_url ? '[Sent a voice message]' : '[Sent a media file]') }]
        }));

        const currentUsername = profile?.username || user?.user_metadata?.username || 'Ace_Zero';
        const currentTitle = getUserTitle(profile);

        const res = await fetch('/api/alpha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            context: {
              userId: user?.id,
              username: currentUsername,
              userName: currentUsername,
              role: effectiveRole,
              userRole: effectiveRole,
              adminTitle: currentTitle,
              url: typeof window !== 'undefined' ? window.location.href : '/messages'
            }
          })
        });

        const data = await res.json();
        if (data.reply) {
          let cleanContent = (data.reply as string).replace(/\[state:\s*[^\]]+\]/gi, '').trim();

          const alphaMsgPayload: any = {
            conversation_id: currentConvId,
            sender_id: '5d38da6e-b568-4499-ab67-f588354add5d',
            content: cleanContent,
          };

          const { data: insertedAlphaMsg } = await supabase
            .from('chat_messages')
            .insert(alphaMsgPayload)
            .select(`*, sender:profiles(*)`)
            .maybeSingle();

          if (insertedAlphaMsg) {
            setMessages(prev => {
              if (prev.some(m => m.id === insertedAlphaMsg.id)) return prev;
              const next = [...prev, insertedAlphaMsg];
              messagesCacheRef.current[currentConvId] = next;
              return next;
            });

            if (chatChannel) {
              chatChannel.send({
                type: 'broadcast',
                event: 'new_message',
                payload: insertedAlphaMsg
              });
            }

            setConversations(prev => prev.map(c => {
              if (c.id === currentConvId) {
                return { ...c, last_message_preview: cleanContent, updated_at: new Date().toISOString() };
              }
              return c;
            }));
          }
        }
      } catch (e) {
        console.error('Alpha AI trigger error:', e);
      } finally {
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next['5d38da6e-b568-4499-ab67-f588354add5d'];
          return next;
        });
      }
    }, 700);
  }, [profile, user, effectiveRole, chatChannel]);

  // Optimistic Instant Message Send (Zero Reloads, Zero Delay!)
  const handleSendMessage = async (e?: React.FormEvent, gifUrl?: string, overrideTxt?: string) => {
    e?.preventDefault();
    if (!user || !supabase || !activeConv) return;

    const currentConvId = activeConv.id;
    const txt = (overrideTxt || inputMsg).trim();
    const img = imageUrl;
    const targetEditId = editingMessageId;
    const currentReplyObj = replyingTo ? {
      id: replyingTo.id,
      username: replyingTo.sender?.username || 'User',
      content: replyingTo.content || (replyingTo.image_url ? '[Image]' : replyingTo.audio_url ? '[Voice]' : '[Media]')
    } : null;

    if (!txt && !img && !audioBlob && !gifUrl) return;

    playGummyPop(0.2);

    // Reset inputs immediately
    setInputMsg('');
    setImageUrl('');
    setAudioBlob(null);
    setReplyingTo(null);
    setEditingMessageId(null);

    // If Editing Existing Message
    if (targetEditId) {
      setMessages(prev => prev.map(m => m.id === targetEditId ? { ...m, content: txt, updated_at: new Date().toISOString() } : m));
      try {
        await supabase.from('chat_messages').update({
          content: txt,
          updated_at: new Date().toISOString()
        }).eq('id', targetEditId);
        toast.success('Message updated');
      } catch (err) {
        toast.error('Failed to update message');
      }
      return;
    }

    // 1. Optimistic Message Insertion (Instant 0ms Screen Display)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: currentConvId,
      sender_id: user.id,
      content: txt,
      image_url: img || undefined,
      gif_url: gifUrl || undefined,
      created_at: new Date().toISOString(),
      reply_to_message: currentReplyObj,
      sender: {
        username: profile?.username || user.user_metadata?.username || 'You',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg',
        role: profile?.role,
        admin_title: profile?.admin_title,
        level: profile?.level
      }
    };

    setMessages(prev => {
      const next = [...prev, optimisticMsg];
      messagesCacheRef.current[currentConvId] = next;
      return next;
    });

    // 2. Optimistically update last message in conversation list & move to top
    const previewText = txt || (img ? 'Sent a photo' : gifUrl ? 'Sent a GIF' : 'Sent a voice message');
    setConversations(prev => {
      const match = prev.find(c => c.id === currentConvId);
      if (!match) return prev;
      const updated = { ...match, last_message_preview: previewText, updated_at: new Date().toISOString() };
      return [updated, ...prev.filter(c => c.id !== currentConvId)];
    });

    // Auto-scroll
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 20);

    // 3. Asynchronously upload media and save to database
    try {
      setUploadingImage(true);
      let uploadedAudioUrl: string | null = null;
      if (audioBlob) {
        uploadedAudioUrl = await uploadAudio(audioBlob);
        optimisticMsg.audio_url = uploadedAudioUrl;
      }

      const mainInsertPayload: any = {
        conversation_id: currentConvId,
        sender_id: user.id,
        content: txt,
        image_url: img || null,
      };

      if (uploadedAudioUrl) mainInsertPayload.audio_url = uploadedAudioUrl;
      if (gifUrl) mainInsertPayload.gif_url = gifUrl;
      if (currentReplyObj) mainInsertPayload.reply_to_message = currentReplyObj;

      const res = await supabase
        .from('chat_messages')
        .insert(mainInsertPayload)
        .select(`*, sender:profiles(*)`)
        .maybeSingle();

      let insertedMsg = res.data;
      let insertErr = res.error;

      if (insertErr) {
        const fallbackRes = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: currentConvId,
            sender_id: user.id,
            content: txt,
            image_url: img || null
          })
          .select(`*, sender:profiles(*)`)
          .maybeSingle();

        insertedMsg = fallbackRes.data;
        insertErr = fallbackRes.error;
      }

      if (insertedMsg) {
        // Swap temp message with real record
        setMessages(prev => {
          const next = prev.map(m => m.id === tempId ? insertedMsg : m);
          messagesCacheRef.current[currentConvId] = next;
          return next;
        });

        if (chatChannel) {
          chatChannel.send({
            type: 'broadcast',
            event: 'new_message',
            payload: insertedMsg
          });
        }
      }

      // Update preview in database quietly
      if (previewText) {
        supabase.from('chat_conversations').update({ 
          last_message_preview: previewText,
          updated_at: new Date().toISOString()
        }).eq('id', currentConvId).then();
      }

      // Check for Alpha AI response
      const isAlphaChat = activeConv.type === 'direct' && activeConv.participants?.some((p: any) => p.user?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || p.user?.username?.toLowerCase() === 'alpha');
      if (isAlphaChat && isLeaderOrStaff) {
        triggerAlphaResponse(currentConvId, txt);
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setUploadingImage(false);
      setShowGifTray(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await ImageAPI.uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream?.getTracks().forEach((track: any) => track.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioBlob(null);
  };

  const startRecording = async () => {
    if (typeof window === 'undefined') return;

    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWaveform = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          const peaks: number[] = [];
          const step = Math.floor(dataArray.length / 16) || 1;
          for (let i = 0; i < 16; i++) {
            const val = dataArray[i * step] || 0;
            const height = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
            peaks.push(height);
          }
          setLiveWaveform(peaks);
          animFrameRef.current = requestAnimationFrame(updateWaveform);
        };
        updateWaveform();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      toast.error('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const deleteMessage = async (msgId: string) => {
    if (!supabase || !confirm("Delete this message?")) return;
    try {
      await supabase.from('chat_messages').delete().eq('id', msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success('Message deleted');
    } catch (e: any) {
      toast.error('Failed to delete message');
    }
  };

  const handleClearChat = async () => {
    if (!activeConv || !supabase || !confirm("Are you sure you want to clear this entire chat?")) return;
    try {
      await supabase.from('chat_messages').delete().eq('conversation_id', activeConv.id);
      setMessages([]);
      messagesCacheRef.current[activeConv.id] = [];
      toast.success("Chat cleared");
      setShowOptions(false);
    } catch (e) {
      toast.error("Failed to clear chat");
    }
  };

  const handleViewProfile = () => {
    if (!activeConv) return;
    const otherUser = activeConv.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
    if (otherUser) {
      router.push(`/profile/${otherUser.username}`);
    }
  };

  // User Search to Start New DM
  const handleSearchUsers = async (query: string) => {
    setSearchUserQuery(query);
    if (!query.trim() || !supabase) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role, frame_id, level, show_level, title, admin_title')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id || '')
        .limit(6);
      setSearchResults(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const startDirectChat = async (targetUser: any) => {
    if (!user || !supabase) return;
    try {
      // 1. Check if direct chat already in memory
      const existingConv = conversations.find((c: any) => {
        if (c.type !== 'direct') return false;
        return c.participants?.some((p: any) => p.user?.id === targetUser.id || p.user?.username?.toLowerCase() === targetUser.username?.toLowerCase());
      });

      if (existingConv) {
        setShowNewChatModal(false);
        handleSelectConv(existingConv);
        return;
      }

      // 2. Create brand new conversation
      const { data: conv, error } = await supabase
        .from('chat_conversations')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('chat_participants').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: targetUser.id }
      ]);

      const newConv = {
        ...conv,
        participants: [
          { user: { id: user.id, username: user.user_metadata?.username, avatar_url: user.user_metadata?.avatar_url } },
          { user: { id: targetUser.id, username: targetUser.username, avatar_url: targetUser.avatar_url, level: targetUser.level, frame_id: targetUser.frame_id } }
        ]
      };

      setConversations(prev => [newConv, ...prev]);
      setShowNewChatModal(false);
      handleSelectConv(newConv);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start chat');
    }
  };

  // Filtered Conversations for Instant Search
  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return conversations;
    const q = searchFilter.toLowerCase();
    return conversations.filter(c => {
      if (c.type === 'clan') {
        return c.clan?.name?.toLowerCase().includes(q);
      }
      const other = c.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
      return other?.username?.toLowerCase().includes(q);
    });
  }, [conversations, searchFilter, user?.id]);

  if (!user) {
    return (
      <div className="w-full h-full bg-[#050508] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary-400 mb-4 shadow-xl">
          <MessageSquare size={28} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Direct Messages</h3>
        <p className="text-xs text-zinc-400 max-w-xs mb-6">Sign in to message your friends, send anime reviews, and chat with Clan members.</p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          Sign In
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#000000] sm:border sm:border-white/[0.08] sm:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
      
      {/* ===================== LEFT SIDEBAR: INBOX / DIRECT LIST ===================== */}
      <div className={cn(
        "w-full md:w-[340px] lg:w-[380px] border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col bg-[#050508] shrink-0 h-full",
        activeConv ? "hidden md:flex" : "flex"
      )}>
        
        {/* Instagram Direct Header */}
        <div className="h-16 px-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#050508]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/social"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors"
              title="Back to Otakuverse"
            >
              <ArrowLeft size={16} />
            </Link>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {profile?.username || user.user_metadata?.username || 'Messages'}
            </span>
          </div>

          <button
            onClick={() => {
              playGummyTap();
              setShowNewChatModal(true);
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="New Message"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Minimal Instagram Search Bar */}
        <div className="px-3.5 py-2.5 border-b border-white/[0.04]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.09] text-xs text-white placeholder-zinc-500 rounded-xl pl-9 pr-3 py-2 border border-white/5 focus:outline-none transition-colors"
            />
            {searchFilter && (
              <button 
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 text-zinc-400 hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span>Loading messages...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs space-y-3">
              <p>{searchFilter ? 'No conversations found' : 'No messages yet'}</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Send Message
              </button>
            </div>
          ) : (
            filteredConversations.map(c => {
              const isSelected = activeConv?.id === c.id;
              let title = 'Direct Message';
              let avatar = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
              let isUserOnline = false;
              let otherParticipant: any = null;
              let clanLevel: number | undefined = undefined;

              if (c.type === 'clan') {
                title = c.clan?.name || 'Clan Group';
                avatar = c.clan?.avatar_url || avatar;
                clanLevel = c.clan?.level || 1;
              } else if (c.type === 'direct') {
                otherParticipant = c.participants?.find((p: any) => p.user?.id !== user.id)?.user;
                if (otherParticipant) {
                  title = otherParticipant.username;
                  avatar = otherParticipant.avatar_url || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
                  isUserOnline = (otherParticipant?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || otherParticipant?.username?.toLowerCase() === 'alpha') 
                    ? true 
                    : Boolean(activeUsers[otherParticipant.id]);
                }
              }

              let timeFormatted = '';
              const timeSource = c.updated_at || otherParticipant?.last_seen_at;
              if (timeSource) {
                try {
                  timeFormatted = formatDistanceToNow(new Date(timeSource), { addSuffix: false })
                    .replace('about ', '')
                    .replace('less than a minute', '1m')
                    .replace(' minutes', 'm')
                    .replace(' minute', 'm')
                    .replace(' hours', 'h')
                    .replace(' hour', 'h')
                    .replace(' days', 'd')
                    .replace(' day', 'd');
                } catch (e) {
                  timeFormatted = '';
                }
              }

              const subtitle = c.last_message_preview || (isUserOnline ? 'Active Now' : 'Tap to start conversation');

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConv(c)}
                  className={cn(
                    "px-3.5 py-2.5 mx-2 my-0.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all",
                    isSelected 
                      ? "bg-white/[0.09]" 
                      : "hover:bg-white/[0.04]"
                  )}
                >
                  <div className="shrink-0 relative">
                    {c.type === 'direct' ? (
                      <ProfileAvatar profile={{...otherParticipant, avatar_url: avatar, is_online: isUserOnline}} className="w-12 h-12 rounded-full" />
                    ) : (
                      <ClanAvatar clan={{id: c.clan?.id, avatar_url: avatar, level: clanLevel}} className="w-12 h-12" />
                    )}
                    {isUserOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-white truncate">
                        {title}
                      </span>
                      {timeFormatted && (
                        <span className="text-[10px] text-zinc-500 shrink-0 font-medium">
                          {timeFormatted}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        "text-xs truncate leading-snug",
                        c.unread_count > 0 ? "text-white font-bold" : "text-zinc-400"
                      )}>
                        {subtitle}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===================== RIGHT COLUMN: ACTIVE CHAT THREAD ===================== */}
      <div className={cn(
        "flex-1 flex-col min-w-0 bg-[#000000] h-full",
        activeConv ? "flex" : "hidden md:flex"
      )}>
        {activeConv ? (
          <>
            {/* Instagram Style Header */}
            {(() => {
              const isClan = activeConv.type === 'clan';
              let headerTitle = isClan ? activeConv.clan?.name : 'Direct Message';
              let headerAvatar = isClan ? activeConv.clan?.avatar_url : '';
              let otherUser: any = null;

              if (!isClan) {
                otherUser = activeConv.participants?.find((p: any) => p.user?.id !== user.id)?.user;
                if (otherUser) {
                  headerTitle = otherUser.username;
                  headerAvatar = otherUser.avatar_url || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
                }
              }

              const isUserOnline = (otherUser?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || otherUser?.username?.toLowerCase() === 'alpha')
                ? true
                : (otherUser?.id ? Boolean(activeUsers[otherUser.id]) : false);

              const otherTitle = !isClan && otherUser ? getUserTitle(otherUser) : undefined;

              return (
                <div className="h-16 px-4 border-b border-white/[0.08] bg-[#050508] flex items-center justify-between shrink-0 z-20">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleSelectConv(null)}
                      className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center shrink-0 transition-colors"
                      title="Back to inbox"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    <div 
                      onClick={!isClan ? handleViewProfile : undefined}
                      className={cn(
                        "flex items-center gap-2.5 min-w-0",
                        !isClan && "cursor-pointer hover:opacity-85 transition-opacity"
                      )}
                    >
                      <div className="relative shrink-0">
                        {isClan ? (
                          <ClanAvatar clan={{...activeConv.clan, avatar_url: headerAvatar}} className="w-10 h-10" />
                        ) : (
                          <ProfileAvatar profile={{...otherUser, avatar_url: headerAvatar, is_online: isUserOnline}} className="w-10 h-10 rounded-full" />
                        )}
                        {isUserOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate">{headerTitle}</h3>
                          {otherTitle && (
                            <span className="text-[9px] text-zinc-400 font-mono hidden sm:inline">
                              • {otherTitle}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {isClan ? 'Clan Group' : isUserOnline ? 'Active now' : otherUser?.last_seen_at ? `Active ${formatDistanceToNow(new Date(otherUser.last_seen_at))} ago` : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="relative shrink-0" ref={optionsRef}>
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                      title="Details"
                    >
                      <Info size={18} />
                    </button>

                    {showOptions && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#121218] border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-medium text-zinc-300">
                        {!isClan && (
                          <>
                            <button
                              onClick={() => { handleViewProfile(); setShowOptions(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer text-white"
                            >
                              <User size={14} className="text-zinc-400" /> View Profile
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                          </>
                        )}
                        <button
                          onClick={handleClearChat}
                          className="w-full text-left px-4 py-2 hover:bg-red-500/10 flex items-center gap-2 text-rose-400 cursor-pointer"
                        >
                          <Trash2 size={14} /> Clear Messages
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Chat Stream (Instagram Style Message Thread) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 flex flex-col gap-1 select-text">
              
              {/* Instagram Top Profile Welcome Card */}
              {(() => {
                const isClan = activeConv.type === 'clan';
                if (isClan) return null;
                const otherUser = activeConv.participants?.find((p: any) => p.user?.id !== user.id)?.user;
                if (!otherUser) return null;
                const otherTitle = getUserTitle(otherUser);

                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center select-none">
                    <ProfileAvatar 
                      profile={otherUser} 
                      className="w-20 h-20 rounded-full border-2 border-white/10 shadow-2xl mb-3 cursor-pointer" 
                    />
                    <h2 className="text-base font-bold text-white tracking-tight">
                      {otherUser.username}
                    </h2>
                    {otherTitle && (
                      <p className="text-xs text-primary-400 font-medium mt-0.5">
                        {otherTitle}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Kagemi Community
                    </p>
                    <button
                      type="button"
                      onClick={handleViewProfile}
                      className="mt-3.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      View Profile
                    </button>
                    <div className="w-16 h-px bg-white/5 my-6" />
                  </div>
                );
              })()}

              {/* Messages Feed */}
              {messages.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Say hi! Send a message below.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  const prevMsg = messages[idx - 1];
                  const nextMsg = messages[idx + 1];
                  const isFirstInStack = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                  const isLastInStack = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                  const isLiked = likedMessageIds.has(msg.id);

                  const replyData = (msg as any).reply_to_message;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "group relative flex items-end gap-2",
                        isMe ? "justify-end" : "justify-start",
                        isLastInStack ? "mb-3" : "mb-0.5"
                      )}
                    >
                      {/* Incoming Avatar (only on last item of stack, Instagram style) */}
                      {!isMe && (
                        <div className="w-7 shrink-0 mb-0.5">
                          {isLastInStack ? (
                            <ProfileAvatar profile={msg.sender} className="w-7 h-7 rounded-full cursor-pointer" />
                          ) : <div className="w-7" />}
                        </div>
                      )}

                      {/* Bubble Container */}
                      <div className={cn(
                        "max-w-[78%] sm:max-w-[65%] flex flex-col relative",
                        isMe ? "items-end" : "items-start"
                      )}>
                        
                        {/* Nested Quote Reply Box */}
                        {replyData && (
                          <div className="mb-1 px-3 py-1 rounded-xl bg-white/10 border-l-2 border-primary-400 text-[10px] text-zinc-300 max-w-full truncate">
                            <span className="font-semibold text-primary-300">@{replyData.username}: </span>
                            <span className="italic">{replyData.content}</span>
                          </div>
                        )}

                        {/* Image Message */}
                        {msg.image_url && (
                          <div className="rounded-2xl overflow-hidden border border-white/10 my-1 max-w-xs shadow-md">
                            <img src={msg.image_url} alt="" className="w-full h-auto object-cover" />
                          </div>
                        )}

                        {/* GIF Message */}
                        {msg.gif_url && (
                          <div className="rounded-2xl overflow-hidden border border-white/10 my-1 max-w-[160px] shadow-md">
                            <img src={msg.gif_url} alt="GIF" className="w-full h-auto object-cover" />
                          </div>
                        )}

                        {/* Voice Message */}
                        {msg.audio_url && (
                          <VoiceMessagePlayer audioUrl={msg.audio_url} isMe={isMe} />
                        )}

                        {/* Shared Post or Anime Card */}
                        {msg.content && msg.content.includes('[SHADOW_SHARE]') && msg.content.includes('[/SHADOW_SHARE]') && (() => {
                          try {
                            const raw = msg.content.split('[SHADOW_SHARE]')[1].split('[/SHADOW_SHARE]')[0];
                            const parsedData = JSON.parse(raw);
                            return <SharedMediaCard data={parsedData} isMe={isMe} />;
                          } catch (e) {
                            return null;
                          }
                        })()}

                        {/* Text Message Bubble (Instagram Direct Styling) */}
                        {msg.content && (!msg.content.includes('[SHADOW_SHARE]') || !msg.content.includes('[/SHADOW_SHARE]')) && (
                          <div
                            onDoubleClick={() => handleHeartReaction(msg.id)}
                            className={cn(
                              "text-xs sm:text-sm px-4 py-2.5 leading-relaxed relative select-text transition-transform active:scale-[0.99]",
                              isMe 
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-[22px] rounded-br-[4px] shadow-sm"
                                : "bg-[#262626] text-white border border-white/[0.06] rounded-[22px] rounded-bl-[4px] shadow-sm"
                            )}
                          >
                            {msg.content}

                            {/* Floating Heart Reaction Badge */}
                            {isLiked && (
                              <div className="absolute -bottom-2 -right-1 bg-[#1a1a24] border border-white/15 rounded-full px-1.5 py-0.5 text-[11px] shadow-lg flex items-center justify-center animate-in zoom-in-75 duration-150">
                                ❤️
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hover Action Menu */}
                      <div className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                        isMe ? "order-first" : "order-last"
                      )}>
                        <button
                          type="button"
                          onClick={() => handleHeartReaction(msg.id)}
                          className="w-6 h-6 rounded-full hover:bg-white/10 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Heart"
                        >
                          <Heart size={13} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(msg);
                            document.getElementById('chat-composer-input')?.focus();
                          }}
                          className="w-6 h-6 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Reply"
                        >
                          ↩️
                        </button>
                        {(msg.sender_id === user.id || isLeaderOrStaff) && (
                          <button
                            type="button"
                            onClick={() => deleteMessage(msg.id)}
                            className="w-6 h-6 rounded-full hover:bg-red-500/10 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator Bubble */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-end gap-2 mb-2">
                  <div className="bg-[#262626] border border-white/[0.06] rounded-[20px] rounded-bl-[4px] px-3.5 py-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* ===================== COMPOSER BAR (Instagram Direct Style) ===================== */}
            <div className="p-3 sm:p-4 bg-[#050508] border-t border-white/[0.06] shrink-0">
              
              {/* Reply Quote Banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-xl text-xs text-zinc-300 mb-2 border border-white/5">
                  <span className="truncate">
                    Replying to <b className="text-white">@{replyingTo.sender?.username || 'User'}</b>
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-white">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Media Preview Attachment Banner */}
              {imageUrl && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 mb-2 group">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Voice Note Pending Banner */}
              {audioBlob && (
                <div className="flex items-center gap-2 mb-2">
                  <VoiceMessagePlayer audioUrl={URL.createObjectURL(audioBlob)} isMe={true} />
                  <button
                    type="button"
                    onClick={() => setAudioBlob(null)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* GIF Selector Tray */}
              <AnimatePresence>
                {showGifTray && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#121218] border border-white/10 rounded-2xl p-3 mb-2 space-y-2 overflow-hidden shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">GIFs & Stickers</span>
                      <button onClick={() => setShowGifTray(false)} className="text-zinc-400 hover:text-white p-1">
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={gifQuery}
                      onChange={e => {
                        setGifQuery(e.target.value);
                        fetchGifs(e.target.value);
                      }}
                      placeholder="Search anime GIFs..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
                      {gifResults.map(g => (
                        <img
                          key={g.id}
                          src={g.preview}
                          alt="gif"
                          onClick={() => handleSendMessage(undefined, g.url)}
                          className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instagram Direct All-In-One Capsule Input */}
              {isRecording ? (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-red-950/40 border border-red-500/30 rounded-full">
                  <span className="text-xs font-mono font-bold text-red-400">
                    {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                  </span>
                  <div className="flex-1 flex items-center justify-center gap-1 h-5 overflow-hidden">
                    {liveWaveform.map((h, i) => (
                      <div key={i} className="w-1 bg-red-400 rounded-full" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <button type="button" onClick={cancelRecording} className="text-zinc-400 hover:text-red-400 p-1">
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => handleSendMessage(e)}
                  className="bg-[#1a1a24] border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 focus-within:border-primary-500/50 transition-colors shadow-inner"
                >
                  {/* Photo / Image Icon Button */}
                  <button
                    type="button"
                    onClick={() => document.getElementById('chat-image-file-input')?.click()}
                    className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="Attach Image"
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin text-primary-400" /> : <ImageIcon size={18} />}
                  </button>
                  <input
                    id="chat-image-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {/* Text Input */}
                  <input
                    id="chat-composer-input"
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (handleMentionKeyDown(e)) return;
                    }}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />

                  {/* Right Action Buttons */}
                  {inputMsg.trim().length > 0 || imageUrl || audioBlob ? (
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className="px-3 py-1 text-sm font-bold text-primary-400 hover:text-primary-300 active:scale-95 transition-all cursor-pointer"
                    >
                      Send
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      {/* Voice Note Button */}
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Voice Note"
                      >
                        <Mic size={18} />
                      </button>

                      {/* GIF / Sticker Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !showGifTray;
                          setShowGifTray(next);
                          if (next && gifResults.length === 0) fetchGifs(gifQuery);
                        }}
                        className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="GIFs"
                      >
                        <Smile size={18} />
                      </button>

                      {/* Instagram Instant Heart Button */}
                      <button
                        type="button"
                        onClick={sendHeartMessage}
                        className="w-8 h-8 rounded-full hover:bg-white/10 text-red-500 flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
                        title="Send Heart"
                      >
                        <Heart size={18} className="fill-red-500 text-red-500" />
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </>
        ) : (
          /* Empty Chat Placeholder (Instagram Direct Style) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-20 h-20 rounded-full border border-white/15 flex items-center justify-center text-white mb-4 shadow-2xl bg-white/[0.04]">
              <MessageSquare size={36} className="text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Your Messages</h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-5">
              Send private photos and messages to a friend or clan member.
            </p>
            <button
              onClick={() => {
                playGummyTap();
                setShowNewChatModal(true);
              }}
              className="px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* ===================== NEW CHAT MODAL ===================== */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm bg-[#121218] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-sm font-bold text-white">New Message</span>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  placeholder="Search user by username..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1">
                {isSearching ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    {searchUserQuery ? 'No users found' : 'Search for a username to start chatting'}
                  </div>
                ) : (
                  searchResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => startDirectChat(u)}
                      className="p-2.5 hover:bg-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ProfileAvatar profile={u} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-xs font-semibold text-white">{u.username}</p>
                          {u.title && <p className="text-[10px] text-zinc-400">{u.title}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary-400">Chat</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
