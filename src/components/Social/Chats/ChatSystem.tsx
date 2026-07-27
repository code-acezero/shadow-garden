"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Send, Users, User, Image as ImageIcon, Search, Shield, 
  Loader2, MessageSquarePlus, Heart, ArrowLeft, Plus, Check, CheckCheck, X, Circle, MoreVertical, Trash2, Mic, Square, Ban, Smile, Globe, Play, Pause, Volume2
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

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  audio_url?: string;
  gif_url?: string;
  created_at: string;
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

    // 1. Precise Duration & Real Waveform Extraction via Web Audio API
    const analyzeAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        if (isMounted) {
          const exactDur = audioBuffer.duration;
          if (exactDur && !isNaN(exactDur) && isFinite(exactDur)) {
            setDuration(exactDur);
          }

          // Extract real waveform peak amplitudes for 16 bars
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
            // Normalize volume amplitude to percentage (15% to 100%)
            const heightPct = Math.max(15, Math.min(100, Math.round(avg * 400)));
            peaks.push(heightPct);
          }

          if (peaks.length === 16 && peaks.some(p => p > 15)) {
            setWaveformPeaks(peaks);
          }
        }
      } catch (err) {
        // Fallback: Seek trick for WebM blobs in Chrome
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

    const handleTimeUpdate = () => {
      if (isMounted) setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      if (isMounted) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      isMounted = false;
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-xl transition-all shadow-xl min-w-[220px] max-w-[300px] ${
      isMe 
        ? 'bg-gradient-to-r from-primary-950/90 via-primary-900/80 to-primary-950/90 border-primary-500/40 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
        : 'bg-zinc-950/90 border-white/15 text-zinc-200'
    }`}>
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
          isPlaying
            ? 'bg-primary-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
        }`}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-1 h-6 px-1 justify-between overflow-hidden">
          {waveformPeaks.map((height, idx) => {
            const progress = duration > 0 ? (currentTime / duration) : 0;
            const barProgress = idx / waveformPeaks.length;
            const isActive = barProgress <= progress;

            return (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isActive 
                    ? isMe ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-primary-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'bg-white/20'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(25, Math.sin((currentTime * 8) + idx) * 30 + height * 0.7)}%` : `${height}%`
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChatSystem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get('chatId');

  const { user, profile: rawProfile } = useAuth();
  const profile = rawProfile as any;
  const effectiveRole = profile?.role || user?.user_metadata?.role || (user as any)?.role || 'user';
  const isLeaderOrStaff = effectiveRole === 'admin' || effectiveRole === 'moderator' || profile?.username === 'Ace_Zero' || profile?.username === 'azim3070334';

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
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

  // New Chat Features State

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
  const [selectedMsgForMenu, setSelectedMsgForMenu] = useState<any | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<any | null>(null);

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
    handleKeyDown,
    insertMention,
  } = useMentions(inputMsg, (username) => {
    setInputMsg(insertMention(username));
  });

  useEffect(() => {
    if (conversations.length > 0) {
      if (chatIdParam) {
        const conv = conversations.find((c: any) => c.id === chatIdParam);
        if (conv && conv.id !== activeConv?.id) {
          setActiveConv(conv);
        }
      } else if (!chatIdParam && activeConv) {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setActiveConv(null);
        }
      }
    }
  }, [chatIdParam, conversations, activeConv?.id]);

  // 1. Fetch User Conversations
  const fetchConversations = useCallback(async () => {
    if (!user || !supabase) return;
    if (conversations.length === 0) {
      setLoading(true);
    }
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
        if (conv) conv.participant_last_read = p.last_read_at;
        return conv;
      }).filter(Boolean).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // Deduplicate direct conversations by target user ID (Messenger Style)
      const uniqueConvs: any[] = [];
      const seenDirectUserIds = new Set<string>();

      for (const conv of rawConvs) {
        if (conv.type === 'direct') {
          const otherUser = conv.participants?.find((p: any) => p.user?.id !== user.id)?.user;
          const targetId = otherUser?.id || otherUser?.username;
          if (targetId) {
            if (seenDirectUserIds.has(targetId)) {
              continue; // Skip duplicate direct conversation entry
            }
            seenDirectUserIds.add(targetId);
          }
        }
        uniqueConvs.push(conv);
      }

      const convs = uniqueConvs;

      await Promise.all(convs.map(async (conv: any) => {
        // Fetch last message for preview if not set
        if (!conv.last_message_preview) {
          const { data: lastM } = await supabase
            .from('chat_messages')
            .select('content, image_url, audio_url, gif_url, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastM) {
            if (lastM.content) conv.last_message_preview = lastM.content;
            else if (lastM.image_url) conv.last_message_preview = 'Sent an image';
            else if (lastM.audio_url) conv.last_message_preview = 'Sent a voice message';
            else if (lastM.gif_url) conv.last_message_preview = 'Sent a GIF';
          }
        }

        // Fetch unread count
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', conv.participant_last_read || '1970-01-01T00:00:00Z');
        
        // Force unread_count = 0 if this conversation is currently open
        if (activeConv?.id === conv.id) {
          conv.unread_count = 0;
        } else {
          conv.unread_count = count || 0;
        }
      }));

      setConversations(convs);
      if (convs.length > 0 && !activeConv) {
        if (chatIdParam) {
          const match = convs.find((c: any) => c.id === chatIdParam);
          if (match) setActiveConv(match);
        } else if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveConv(convs[0]);
        }
      }
    } catch (err: any) {
      console.error('Fetch convs error:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [user, chatIdParam, activeConv, conversations.length]);

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

  const handleSelectConv = useCallback((conv: any) => {
    setActiveConv(conv);
    if (conv) {
      markAsRead(conv.id);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/messages?chatId=${conv.id}`);
      }
    } else if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/messages');
    }
  }, [markAsRead]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConv || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`*, sender:profiles(username, avatar_url, frame_id, level, show_level, role, admin_title)`)
        .eq('conversation_id', activeConv.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      markAsRead(activeConv.id);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, [activeConv, markAsRead]);

  useEffect(() => {
    fetchConversations();
    
    if (supabase) {
      const channel = supabase.channel('public:chat_conversations')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_conversations' }, () => {
           fetchConversations();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (activeConv) {
      // Clear stale messages immediately to prevent flash of previous chat
      setMessages([]);
      fetchMessages();

      const channel = supabase.channel(`chat-${activeConv.id}`);
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
              if (p.user_id !== user?.id) {
                online[p.user_id] = p;
                if (p.typing) typing[p.user_id] = true;
              }
            }
          }
          setActiveUsers(online);
          setTypingUsers(typing);
        })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${activeConv.id}` },
          () => fetchMessages()
        )
        .subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED' && user) {
            await channel.track({
              user_id: user.id,
              username: user.user_metadata?.username,
              typing: false,
              online_at: new Date().toISOString()
            });
          }
        });

      return () => {
        channel.untrack();
        supabase.removeChannel(channel);
        setChatChannel(null);
      };
    }
  }, [activeConv, fetchMessages, user]);

  // Scroll persistence & Read Receipts
  useEffect(() => {
    if (activeConv && scrollRef.current) {
      const savedPosition = sessionStorage.getItem(`chat_scroll_${activeConv.id}`);
      if (savedPosition) {
        scrollRef.current.scrollTop = parseInt(savedPosition, 10);
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [activeConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeConv) {
      sessionStorage.setItem(`chat_scroll_${activeConv.id}`, e.currentTarget.scrollTop.toString());
    }
  };

  useEffect(() => {
    if (activeConv && user && messages.length > 0) {
      supabase.from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', activeConv.id)
        .eq('user_id', user.id)
        .then();
    }
  }, [activeConv, messages, user]);

  // Update last_seen_at
  useEffect(() => {
    if (user && supabase) {
      supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id).then();
    }
  }, [user]);

  // Handle typing indicator
  useEffect(() => {
    if (!chatChannel || !user) return;
    
    const handleTyping = setTimeout(async () => {
      await chatChannel.track({
        user_id: user.id,
        username: user.user_metadata?.username,
        typing: inputMsg.trim().length > 0,
        online_at: new Date().toISOString()
      });
    }, 300);

    return () => clearTimeout(handleTyping);
  }, [inputMsg, chatChannel, user]);

  // Search user to start DM
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
        .limit(5);
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
      // 1. Check if a conversation already exists with targetUser
      const existingConv = conversations.find((c: any) => {
        if (c.type !== 'direct') return false;
        return c.participants?.some((p: any) => p.user?.id === targetUser.id || p.user?.username?.toLowerCase() === targetUser.username?.toLowerCase());
      });

      if (existingConv) {
        setShowNewChatModal(false);
        handleSelectConv(existingConv);
        toast.info(`Opened conversation with @${targetUser.username}`);
        return;
      }

      // 2. Query database for existing direct conversation ID if not in memory
      const { data: myParts } = await supabase
        .from('chat_participants')
        .select('conversation_id, conversation:chat_conversations(id, type)')
        .eq('user_id', user.id);

      let matchedConvId: string | null = null;
      if (myParts && myParts.length > 0) {
        const directConvIds = myParts
          .filter((p: any) => p.conversation?.type === 'direct')
          .map((p: any) => p.conversation_id);

        if (directConvIds.length > 0) {
          const { data: targetParts } = await supabase
            .from('chat_participants')
            .select('conversation_id')
            .in('conversation_id', directConvIds)
            .eq('user_id', targetUser.id)
            .limit(1);

          if (targetParts && targetParts.length > 0) {
            matchedConvId = targetParts[0].conversation_id;
          }
        }
      }

      if (matchedConvId) {
        setShowNewChatModal(false);
        await fetchConversations();
        const found = conversations.find(c => c.id === matchedConvId);
        if (found) handleSelectConv(found);
        toast.info(`Opened conversation with @${targetUser.username}`);
        return;
      }

      // 3. Otherwise create a brand new conversation
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

      setShowNewChatModal(false);
      await fetchConversations();
      const newConv = {
        ...conv,
        participants: [
          { user: { id: user.id, username: user.user_metadata?.username, avatar_url: user.user_metadata?.avatar_url } },
          { user: { id: targetUser.id, username: targetUser.username, avatar_url: targetUser.avatar_url, level: targetUser.level, frame_id: targetUser.frame_id } }
        ]
      };
      handleSelectConv(newConv);
      toast.success(`Chat started with @${targetUser.username}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start chat');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, gifUrl?: string) => {
    e?.preventDefault();
    if (!user || !supabase || !activeConv || (!inputMsg.trim() && !imageUrl && !audioBlob && !gifUrl)) return;

    try {
      setUploadingImage(true);
      let uploadedAudioUrl = null;
      if (audioBlob) {
         uploadedAudioUrl = await uploadAudio(audioBlob);
      }

      const txt = inputMsg;
      const img = imageUrl;
      const targetEditId = editingMessageId;
      const currentReplyObj = replyingTo ? {
        id: replyingTo.id,
        username: replyingTo.sender?.username || 'User',
        content: replyingTo.content || (replyingTo.image_url ? '[Image]' : replyingTo.audio_url ? '[Voice]' : '[Media]')
      } : null;

      setInputMsg('');
      setImageUrl('');
      setAudioBlob(null);
      setReplyingTo(null);
      setEditingMessageId(null);

      if (targetEditId) {
        await supabase.from('chat_messages').update({
          content: txt,
          updated_at: new Date().toISOString()
        }).eq('id', targetEditId);
        toast.success('Message updated');
        fetchMessages();
        return;
      }

      await supabase.from('chat_messages').insert({
        conversation_id: activeConv.id,
        sender_id: user.id,
        content: txt,
        image_url: img || null,
        audio_url: uploadedAudioUrl || null,
        gif_url: gifUrl || null,
        reply_to_message: currentReplyObj
      });

      let preview = txt;
      if (!preview) {
        if (img) preview = 'Sent an image';
        else if (uploadedAudioUrl) preview = 'Sent a voice message';
        else if (gifUrl) preview = 'Sent a GIF';
      }
      if (preview) {
        await supabase.from('chat_conversations').update({ 
          last_message_preview: preview,
          updated_at: new Date().toISOString()
        }).eq('id', activeConv.id);
      }

      // ALPHA AI AUTOMATED RESPONSE TRIGGER (For Admins & Mods / Leader)
      const isAlphaChat = activeConv.type === 'direct' && activeConv.participants?.some((p: any) => p.user?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || p.user?.username?.toLowerCase() === 'alpha');
      if (isAlphaChat && isLeaderOrStaff) {
        const currentConvId = activeConv.id;
        // 1. Immediately show Alpha's animated typing bubble in the UI
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

            const currentUsername = profile?.username || user.user_metadata?.username || 'Ace_Zero';
            const currentTitle = getUserTitle(profile);

            const res = await fetch('/api/alpha', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: history,
                context: {
                  userId: user.id,
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
              let rawReply = data.reply as string;

              // 1. Strip raw [state: ...] tags completely for clean natural chat
              let cleanContent = rawReply.replace(/\[state:\s*[^\]]+\]/gi, '').trim();

              let extractedGifUrl: string | null = null;
              let extractedImageUrl: string | null = null;
              let extractedAudioUrl: string | null = null;

              // 2. Extract [gif: query] or [sticker: query]
              const gifMatch = cleanContent.match(/\[(?:gif|sticker):\s*([^\]]+)\]/i);
              if (gifMatch && gifMatch[1]) {
                const query = gifMatch[1].trim();
                cleanContent = cleanContent.replace(gifMatch[0], '').trim();
                try {
                  const gifRes = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=1`);
                  const gifJson = await gifRes.json();
                  if (gifJson.results && gifJson.results.length > 0) {
                    extractedGifUrl = gifJson.results[0].media[0].gif.url;
                  }
                } catch (e) {}
              }

              // 3. Extract [image: prompt] or [photo: prompt] or detect image requests in last user prompt
              const imgMatch = cleanContent.match(/\[(?:image|photo|picture):\s*([^\]]+)\]/i);
              const lastUserText = history[history.length - 1]?.parts[0]?.text || '';
              const isUserImageReq = /(image|picture|photo|generate|draw|show me|cat|dog|wallpaper)/i.test(lastUserText);

              if (imgMatch && imgMatch[1]) {
                const prompt = imgMatch[1].trim();
                cleanContent = cleanContent.replace(imgMatch[0], '').trim();
                const seed = Math.floor(Math.random() * 100000);
                extractedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
              } else if (isUserImageReq) {
                const prompt = lastUserText.replace(/(give me|generate|show me|a|an|image of|picture of|photo of|give|me)/gi, '').trim() || 'anime cat artwork';
                const seed = Math.floor(Math.random() * 100000);
                extractedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
              }

              // 4. Extract [voice: text] or [audio: text] or detect voice message requests
              const voiceMatch = cleanContent.match(/\[(?:voice|audio|speak):\s*([^\]]+)\]/i);
              const isUserVoiceReq = /(voice|speak|audio|talk|say it|say to me)/i.test(lastUserText);

              if (voiceMatch && voiceMatch[1]) {
                const speechText = voiceMatch[1].trim();
                cleanContent = cleanContent.replace(voiceMatch[0], '').trim();
                try {
                  const ttsRes = await fetch('/api/alpha/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: speechText })
                  });
                  if (ttsRes.ok) {
                    const audioBlob = await ttsRes.blob();
                    extractedAudioUrl = URL.createObjectURL(audioBlob);
                  }
                } catch (e) {}
              } else if (isUserVoiceReq && cleanContent) {
                try {
                  const ttsRes = await fetch('/api/alpha/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: cleanContent.slice(0, 300) })
                  });
                  if (ttsRes.ok) {
                    const audioBlob = await ttsRes.blob();
                    extractedAudioUrl = URL.createObjectURL(audioBlob);
                  }
                } catch (e) {}
              }

              // 5. Insert clean chat message into database with parsed media URLs
              await supabase.from('chat_messages').insert({
                conversation_id: currentConvId,
                sender_id: '5d38da6e-b568-4499-ab67-f588354add5d',
                content: cleanContent || (extractedImageUrl ? 'Here is the image you requested.' : extractedGifUrl ? 'Sent a GIF' : extractedAudioUrl ? 'Sent a voice message' : '...'),
                image_url: extractedImageUrl,
                gif_url: extractedGifUrl,
                audio_url: extractedAudioUrl
              });

              await supabase.from('chat_conversations').update({
                last_message_preview: (cleanContent || 'Sent a media file').substring(0, 100),
                updated_at: new Date().toISOString()
              }).eq('id', currentConvId);

              fetchMessages();
            }
          } catch (alphaErr) {
            console.error('Error generating Alpha reply:', alphaErr);
          } finally {
            // 2. Remove Alpha's typing bubble once complete
            setTypingUsers(prev => {
              const copy = { ...prev };
              delete copy['5d38da6e-b568-4499-ab67-f588354add5d'];
              return copy;
            });
          }
        }, 800);
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

    const getAudioStream = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const legacyGetUserMedia = (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia;
      if (legacyGetUserMedia) {
        return new Promise<MediaStream>((resolve, reject) => {
          legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
        });
      }
      throw new Error('SECURE_ORIGIN_REQUIRED');
    };

    try {
      const stream = await getAudioStream();

      // Real-time Soundwave Frequency Detection via Web Audio API
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

      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
        
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalMime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalMime });
        setAudioBlob(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      toast.success('🎙️ Voice recording started');
    } catch (err: any) {
      console.error("Recording error:", err);
      if (err?.message === 'SECURE_ORIGIN_REQUIRED') {
        toast.error('Microphone API requires HTTPS or localhost browser origin.');
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        toast.error('Microphone permission blocked! Click the lock/mic icon in your address bar to allow mic access.', { duration: 6000 });
      } else {
        toast.error(err?.message || 'Could not access microphone');
      }
    }
  };

  const stopRecording = () => {
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((track: any) => track.stop());
    }
    setIsRecording(false);
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const uploadAudio = async (blob: Blob) => {
    if (!user) return null;
    try {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `voice_${user.id}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('chat_audio')
        .upload(fileName, blob, { contentType: blob.type || 'audio/webm' });
        
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('chat_audio').getPublicUrl(fileName);
        if (publicUrl) return publicUrl;
      }
    } catch (err) {
      console.warn("Storage upload failed, using DataURL fallback:", err);
    }

    try {
      const dataUrl = await blobToDataURL(blob);
      return dataUrl;
    } catch (e) {
      console.error("DataURL conversion error:", e);
      return null;
    }
  };

  const handleViewProfile = () => {
    setShowOptions(false);
    if (!activeConv) return;
    if (activeConv.type === 'direct') {
      const otherUser = activeConv.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
      if (otherUser) {
        router.push(`/profile/${otherUser.username || otherUser.id}`);
      }
    }
  };

  const handleClearChat = async () => {
    if (!activeConv || !user || !confirm("Clear chat for you?")) return;
    await supabase.from('chat_participants').delete().eq('conversation_id', activeConv.id).eq('user_id', user.id);
    handleSelectConv(null);
    setShowOptions(false);
    fetchConversations();
    toast.success('Chat cleared');
  };

  if (!user) {
    return (
      <div className="w-full h-full liquid-glass !bg-black/60 !backdrop-blur-3xl border border-white/15 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-950/40 border border-primary-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,88,12,0.25)] backdrop-blur-md">
          <MessageSquare className="w-8 h-8 text-primary-400 drop-shadow-[0_0_12px_rgba(234,88,12,0.5)]" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">Access Direct Messages</h3>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-sm mb-8 leading-relaxed">
          Sign in to access direct messages, secret intel, and clan chats across the Shadow Garden network.
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-4 w-full max-w-xs">
          <Link 
            href="/social" 
            className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/15 border border-white/15 text-zinc-200 hover:text-white rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-lg backdrop-blur-md active:scale-95 text-center"
          >
            Back to Social
          </Link>
          <button 
            onClick={() => setShowAuthModal(true)} 
            className="flex-1 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] backdrop-blur-md active:scale-95 border border-primary-400/40 cursor-pointer"
          >
            Sign In
          </button>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="w-full h-full liquid-glass !bg-black/50 !backdrop-blur-3xl sm:border sm:border-white/20 sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.3)]">
      
      {/* Conversations List Sidebar */}
      <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/15 flex flex-col bg-black/40 backdrop-blur-2xl ${activeConv ? 'hidden md:flex' : 'flex'} h-full`}>
        {/* Glassmorphism Header Bar */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 bg-[#0a0a0d]/90 backdrop-blur-md shrink-0">
          {/* Back Arrow Pill Button */}
          <Link
            href="/social"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
            title="Back to Social"
          >
            <ArrowLeft size={16} />
          </Link>

          {/* Centered Messages Title */}
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 flex-1 text-center truncate">
            <MessageSquare size={16} className="text-primary-500 shrink-0" />
            <span>Messages</span>
          </h3>

          {/* Glassmorphism Plus Pill Button */}
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-9 h-9 rounded-full bg-primary-600/90 hover:bg-primary-500 border border-primary-500/30 text-white transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.35)] backdrop-blur-md active:scale-95"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
          {loading ? (
            <div className="p-6 text-center text-zinc-600 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs space-y-3">
              <p>No messages yet.</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-5 py-2 bg-primary-600/90 hover:bg-primary-500 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md cursor-pointer border border-primary-500/30 active:scale-95"
              >
                Send Message
              </button>
            </div>
          ) : (
            conversations.map(c => {
              const isSelected = activeConv?.id === c.id;
              let title = 'Direct Message';
              let avatar = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
              let userTitle: string | undefined = undefined;
              let isUserOnline = false;
              let otherParticipant: any = null;
              let clanLevel: number | undefined = undefined;
              
              if (c.type === 'clan') {
                title = c.clan?.name || 'Clan Group';
                avatar = c.clan?.avatar_url || avatar;
                clanLevel = c.clan?.level || 1;
                userTitle = `Clan Lv.${clanLevel}`;
              } else if (c.type === 'direct') {
                otherParticipant = c.participants?.find((p: any) => p.user?.id !== user.id)?.user;
                if (otherParticipant) {
                  title = otherParticipant.username;
                  avatar = otherParticipant.avatar_url || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
                  isUserOnline = (otherParticipant?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || otherParticipant?.username?.toLowerCase() === 'alpha') ? true : Boolean(activeUsers[otherParticipant.id]);
                  userTitle = getUserTitle(otherParticipant);
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
                  className={`p-3.5 sm:p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                    isSelected ? 'bg-primary-600/15 backdrop-blur-md border-l-4 border-primary-500' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="shrink-0 relative">
                      {c.type === 'direct' ? (
                        <ProfileAvatar profile={{...otherParticipant, avatar_url: avatar}} className="w-11 h-11" />
                      ) : (
                        <ClanAvatar clan={{id: c.clan?.id, avatar_url: avatar, level: clanLevel}} className="w-11 h-11" />
                      )}
                      {c.type === 'direct' && isUserOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#08080a] rounded-full z-10" />
                      )}
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                        {c.type !== 'clan' && userTitle && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary-300 bg-primary-950/60 border border-primary-500/30 rounded-full shrink-0 truncate backdrop-blur-md">
                            {userTitle}
                          </span>
                        )}
                      </div>
                      
                      {timeFormatted && (
                        <span className="text-[11px] font-medium text-zinc-500 shrink-0">
                          {timeFormatted}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className={`text-xs truncate leading-snug ${c.unread_count > 0 ? 'text-white font-bold' : 'text-zinc-400'}`}>
                        {subtitle}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-md shadow-primary-500/50 backdrop-blur-md border border-primary-400/30">
                          {c.unread_count > 99 ? '99+' : c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Window */}
      <div className={`flex-1 flex-col min-w-0 bg-[#060608]/90 backdrop-blur-xl h-full ${activeConv ? 'flex' : 'hidden md:flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Top Bar */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0c0c10]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleSelectConv(null)}
                    className="md:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
                    title="Back to Chats"
                  >
                    <ArrowLeft size={18} />
                  </button>
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

                    const isUserOnline = (otherUser?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || otherUser?.username?.toLowerCase() === 'alpha') ? true : (otherUser?.id ? Boolean(activeUsers[otherUser.id]) : false);
                    
                    return (
                      <div 
                        onClick={!isClan ? handleViewProfile : undefined}
                        className={`flex items-center gap-3 min-w-0 ${!isClan ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      >
                        <div className="relative shrink-0">
                          {isClan ? (
                            <ClanAvatar clan={{...activeConv.clan, avatar_url: headerAvatar}} className="w-11 h-11" />
                          ) : (
                            <>
                              <ProfileAvatar profile={{...otherUser, avatar_url: headerAvatar}} className="w-10 h-10" />
                              {isUserOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0c0c10] rounded-full z-10" />
                              )}
                            </>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">{headerTitle}</h3>
                            {(() => {
                              const headerDisplayTitle = !isClan && otherUser ? getUserTitle(otherUser) : undefined;

                              return headerDisplayTitle ? (
                                <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-950/70 border border-amber-500/40 rounded-full shrink-0 truncate backdrop-blur-md shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                  {headerDisplayTitle}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isClan ? (
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Clan Group Chat</span>
                            ) : (
                              <>
                                {isUserOnline ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Now
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-400 truncate">
                                    {otherUser?.last_seen_at 
                                      ? `Active ${formatDistanceToNow(new Date(otherUser.last_seen_at))} ago` 
                                      : 'Offline'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Glassmorphic Options Dropdown Menu Trigger */}
                <div className="relative shrink-0 ml-2" ref={optionsRef}>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-48 bg-[#14141a]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl py-2 z-50 overflow-hidden">
                      {activeConv.type === 'clan' && (
                        <>
                          <button 
                            onClick={() => {
                              router.push(`/social?tab=clans&clanId=${activeConv.clan_id}`);
                              setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Globe size={14} className="text-zinc-400" /> Visit Clan
                          </button>
                          <div className="h-px bg-white/10 my-1"></div>
                        </>
                      )}
                      
                      {activeConv.type !== 'clan' && (
                        <>
                          <button 
                            onClick={handleViewProfile}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <User size={14} className="text-zinc-400" /> View Profile
                          </button>
                          <div className="h-px bg-white/10 my-1"></div>
                          <button onClick={async () => {
                             toast.success("User blocked");
                             setShowOptions(false);
                          }} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer">
                            <Ban size={14} /> Block User
                          </button>
                        </>
                      )}
                      <button onClick={handleClearChat} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer">
                        <Trash2 size={14} /> Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

            {/* Messages Stream */}
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-6 flex flex-col">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-xs mt-auto mb-auto">
                  Say hello! Send your first message below.
                </div>
              ) : (
                (() => {
                  const myMessages = messages.filter(m => m.sender_id === user.id);
                  const myLastMessageId = myMessages.length > 0 ? myMessages[myMessages.length - 1].id : null;

                  return messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    const isMyLast = msg.id === myLastMessageId;
                    const prevMsg = messages[idx - 1];
                    const nextMsg = messages[idx + 1];
                    const isFirstInStack = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const isLastInStack = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                    let bubbleClasses = 'rounded-3xl';
                    if (isMe) {
                        if (isFirstInStack && isLastInStack) bubbleClasses = 'rounded-3xl rounded-br-md';
                        else if (isFirstInStack) bubbleClasses = 'rounded-t-3xl rounded-bl-3xl rounded-br-md';
                        else if (isLastInStack) bubbleClasses = 'rounded-b-3xl rounded-tl-3xl rounded-tr-md';
                        else bubbleClasses = 'rounded-l-3xl rounded-r-md';
                    } else {
                        if (isFirstInStack && isLastInStack) bubbleClasses = 'rounded-3xl rounded-bl-md';
                        else if (isFirstInStack) bubbleClasses = 'rounded-t-3xl rounded-br-3xl rounded-bl-md';
                        else if (isLastInStack) bubbleClasses = 'rounded-b-3xl rounded-tr-3xl rounded-tl-md';
                        else bubbleClasses = 'rounded-r-3xl rounded-l-md';
                    }

                    const replyData = (msg as any).reply_to_message;

                    return (
                      <motion.div 
                        key={msg.id} 
                        drag="x"
                        dragConstraints={{ left: 0, right: 60 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 35) {
                            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                              try { navigator.vibrate(25); } catch (e) {}
                            }
                            setReplyingTo(msg);
                            toast.info(`Replying to @${msg.sender?.username || 'User'}`);
                          }
                        }}
                        className={`group relative flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${isLastInStack ? 'mb-4' : 'mb-1'}`}
                      >
                        {!isMe && (
                          <div className="shrink-0 w-7 mb-0.5">
                            {isLastInStack && (
                              <ProfileAvatar profile={msg.sender} className="w-7 h-7 cursor-pointer" />
                            )}
                          </div>
                        )}

                        {/* Desktop 3-Dots Action Trigger Button (Hover / Click) */}
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isMe ? 'order-first' : 'order-last'}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedMsgForMenu(msg)}
                            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 flex items-center justify-center backdrop-blur-md cursor-pointer transition-all active:scale-95"
                            title="Message Options"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        <div 
                          onClick={() => setSelectedMsgForMenu(msg)}
                          className={`max-w-[82%] sm:max-w-[65%] flex flex-col cursor-pointer ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          {!isMe && isFirstInStack && (
                            <div className="flex items-center gap-1.5 mb-1 ml-1">
                              <span className="text-[9px] font-bold text-zinc-400">{msg.sender?.username || 'User'}</span>
                              <RoleTitleBadge role={msg.sender?.role} adminTitle={msg.sender?.admin_title} />
                            </div>
                          )}

                          {/* Nested Quote Reply Box */}
                          {replyData && (
                            <div className="mb-1.5 px-3 py-1.5 rounded-2xl bg-white/10 border-l-2 border-primary-500 text-[10px] text-zinc-300 backdrop-blur-md max-w-full truncate shadow-sm">
                              <span className="font-bold text-primary-400">Replying to @{replyData.username}: </span>
                              <span className="italic">{replyData.content}</span>
                            </div>
                          )}

                          {msg.image_url && (
                            <img src={msg.image_url} alt="" className={`max-w-xs mb-0.5 border border-white/10 object-cover shadow-lg ${bubbleClasses}`} />
                          )}
                          
                          {msg.gif_url && (
                            <img src={msg.gif_url} alt="GIF" className={`max-w-[150px] mb-0.5 border border-white/10 shadow-md ${bubbleClasses}`} />
                          )}

                          {msg.audio_url && (
                            <div className="mb-1">
                              <VoiceMessagePlayer audioUrl={msg.audio_url} isMe={isMe} />
                            </div>
                          )}

                          {msg.content && (
                            <p
                              className={`text-xs sm:text-sm px-4 py-2.5 leading-relaxed shadow-md ${bubbleClasses} ${
                                isMe
                                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border border-primary-500/30 backdrop-blur-md'
                                  : 'bg-[#14141a]/90 text-zinc-100 border border-white/10 backdrop-blur-md'
                              }`}
                            >
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  });
                })()
              )}
              
              {/* Typing Indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-end gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 shrink-0 mb-0.5 flex items-center justify-center">
                    <User size={12} className="text-zinc-500" />
                  </div>
                  <div className="bg-[#14141a]/90 text-zinc-400 border border-white/10 rounded-3xl rounded-bl-sm px-4 py-2.5 shadow-md flex items-center gap-1.5 w-fit backdrop-blur-md">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mr-1">Typing</span>
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} />
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} />
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} />
                  </div>
                </div>
              )}
            </div>

            {/* Replying Banner */}
            {replyingTo && (
              <div className="px-4 py-2 bg-[#121218]/90 border-t border-primary-500/30 flex items-center justify-between backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-1 h-7 bg-primary-500 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-primary-400">Replying to @{replyingTo.sender?.username || 'User'}</p>
                    <p className="text-xs text-zinc-300 truncate leading-snug">{replyingTo.content || (replyingTo.image_url ? '[Image]' : replyingTo.audio_url ? '[Voice]' : '[Media]')}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Editing Banner */}
            {editingMessageId && (
              <div className="px-4 py-2 bg-amber-950/80 border-t border-amber-500/40 flex items-center justify-between backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-1 h-7 bg-amber-500 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-amber-400">Editing Message</p>
                    <p className="text-xs text-zinc-300 truncate leading-snug">Update your message content below</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setEditingMessageId(null); setInputMsg(''); }} className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Bar */}
            {activeConv?.type === 'direct' && activeConv.participants?.some((p: any) => (p.user?.id === '5d38da6e-b568-4499-ab67-f588354add5d' || p.user?.username?.toLowerCase() === 'alpha') && p.user?.id !== user?.id) && !isLeaderOrStaff ? (
              <div className="p-4 border-t border-white/10 bg-[#0c0c10]/95 backdrop-blur-xl flex justify-center text-center">
                 <p className="text-zinc-400 text-xs italic font-medium">Direct transmission to Alpha is locked for regular members. Only Council Members (Admins & Moderators) may converse directly with Alpha.</p>
              </div>
            ) : (
              <div className="relative">
                <AnimatePresence>
                  {showGifTray && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 left-3 right-3 bg-[#14141a]/95 border border-white/15 rounded-3xl shadow-2xl z-50 backdrop-blur-2xl overflow-hidden"
                    >
                      {/* GIF Search Bar */}
                      <div className="flex items-center gap-2 p-2.5 border-b border-white/10">
                        <Search size={13} className="text-zinc-500 shrink-0" />
                        <input
                          type="text"
                          value={gifQuery}
                          onChange={e => setGifQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') fetchGifs(gifQuery); }}
                          placeholder="Search GIFs..."
                          className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => fetchGifs(gifQuery)}
                          className="text-[10px] font-bold text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30 hover:bg-primary-500/10 transition-colors cursor-pointer"
                        >
                          Go
                        </button>
                      </div>
                      {/* GIF Results */}
                      {gifLoading ? (
                        <div className="flex items-center justify-center h-20">
                          <Loader2 size={18} className="animate-spin text-primary-400" />
                        </div>
                      ) : (
                        <div className="flex gap-1.5 p-2 overflow-x-auto no-scrollbar">
                          {gifResults.length === 0 ? (
                            <p className="text-zinc-500 text-xs p-2">No GIFs found. Try searching!</p>
                          ) : gifResults.map(gif => (
                            <img
                              key={gif.id}
                              src={gif.preview}
                              alt="gif"
                              className="h-16 w-auto rounded-2xl cursor-pointer object-cover hover:ring-2 hover:ring-primary-500 transition-all shrink-0"
                              onClick={() => handleSendMessage(undefined, gif.url)}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-center text-[9px] text-zinc-600 pb-1.5">Powered by GIPHY</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-[#0c0c10]/95 backdrop-blur-xl flex items-center gap-2.5">
                  
                  {/* Upload Image Pill Button */}
                  <button
                    type="button"
                    onClick={() => document.getElementById('chat-image-upload')?.click()}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                    title="Upload Image"
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin text-primary-400" /> : <ImageIcon size={18} />}
                  </button>
                  <input id="chat-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                  {/* GIF Tray Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showGifTray;
                      setShowGifTray(next);
                      if (next && gifResults.length === 0) fetchGifs(gifQuery);
                    }}
                    className={`w-10 h-10 rounded-full border transition-all shrink-0 flex items-center justify-center active:scale-95 cursor-pointer backdrop-blur-md ${showGifTray ? 'bg-primary-600/90 border-primary-500/30 text-white shadow-[0_4px_15px_rgba(99,102,241,0.35)]' : 'bg-white/10 hover:bg-white/20 border-white/15 text-zinc-300 hover:text-white'}`}
                    title="GIF / Sticker"
                  >
                    <Smile size={18} />
                  </button>

                  <div className="flex-1 relative">
                    {imageUrl && (
                      <div className="absolute -top-14 left-0 w-12 h-12 bg-zinc-800 rounded-2xl border border-white/15 overflow-hidden group z-10 shadow-lg">
                        <img src={imageUrl} alt="upload" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setImageUrl('')} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><X size={14}/></button>
                      </div>
                    )}
                    {audioBlob && (
                      <div className="absolute -top-16 left-0 z-20 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="relative">
                          <VoiceMessagePlayer audioUrl={URL.createObjectURL(audioBlob)} isMe={true} />
                          <button 
                            type="button" 
                            onClick={() => setAudioBlob(null)} 
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 border border-black text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                            title="Discard recording"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {mentionState.isMentioning && (
                      <MentionDropdown
                        suggestions={mentionState.users}
                        selectedIndex={mentionState.selectedIndex}
                        onSelect={(username) => {
                          setInputMsg(insertMention(username));
                        }}
                        position="top"
                      />
                    )}

                    {isRecording ? (
                      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-red-950/80 via-black/90 to-red-950/80 border border-red-500/50 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-xl animate-in fade-in duration-200">
                        {/* Live Timer & Pulsing Dot */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                          <span className="text-xs font-mono font-extrabold text-red-400 tracking-wider">
                            {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Liquid Glass Soundwave Lines Visualizer (Real-time Audio Input) */}
                        <div className="flex-1 flex items-center justify-center gap-1 h-5 px-2 overflow-hidden">
                          {liveWaveform.map((h, idx) => (
                            <motion.div
                              key={idx}
                              className="w-1 rounded-full bg-gradient-to-t from-red-500 via-amber-400 to-primary-400"
                              animate={{ height: `${h}%` }}
                              transition={{ duration: 0.08, ease: "easeOut" }}
                            />
                          ))}
                        </div>

                        {/* Cancel Button */}
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/30 text-zinc-300 hover:text-red-400 transition-all cursor-pointer shrink-0"
                          title="Discard recording"
                        >
                          <Trash2 size={15} />
                        </button>

                        {/* Complete Button */}
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-3 py-1 bg-gradient-to-r from-red-600 to-primary-600 hover:from-red-500 hover:to-primary-500 text-white text-xs font-bold rounded-full transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 border border-red-400/40"
                          title="Done recording"
                        >
                          <Check size={14} />
                          <span>Done</span>
                        </button>
                      </div>
                    ) : (
                      <input
                        id="chat-input-field"
                        type="text"
                        value={inputMsg}
                        onChange={e => {
                          setInputMsg(e.target.value);
                        }}
                        onKeyDown={e => {
                          if (handleKeyDown(e)) return;
                        }}
                        placeholder="Message..."
                        className="w-full bg-black/50 border border-white/15 rounded-full px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    )}
                  </div>
                  
                  {/* Voice Record Pill Button */}
                  <button
                    type="button"
                    onClick={startRecording}
                    className={`w-10 h-10 rounded-full transition-all shrink-0 flex items-center justify-center active:scale-95 cursor-pointer backdrop-blur-md ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)]' : 'bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white'}`}
                    title={isRecording ? "Stop Recording" : "Voice Message"}
                  >
                    {isRecording ? <Square size={16} /> : <Mic size={18} />}
                  </button>

                  {/* Mention & Tag Icons */}
                  {(activeConv?.type === 'clan' || (activeConv?.type === 'direct' && activeConv.participants?.some((p: any) => p.user?.id === '5d38da6e-b568-4499-ab67-f588354add5d'))) && (
                    <>
                      <button
                        type="button"
                        onClick={() => setInputMsg(prev => prev + (prev.endsWith(' ') || prev === '' ? '@' : ' @'))}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white transition-all shrink-0 flex items-center justify-center cursor-pointer backdrop-blur-md text-xs font-bold"
                        title="Mention someone"
                      >
                        @
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMsg(prev => prev + (prev.endsWith(' ') || prev === '' ? '#' : ' #'))}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white transition-all shrink-0 flex items-center justify-center cursor-pointer backdrop-blur-md text-xs font-bold"
                        title="Add a hashtag"
                      >
                        #
                      </button>
                    </>
                  )}

                  {/* Send Pill Button */}
                  <button
                    type="submit"
                    disabled={(!inputMsg.trim() && !imageUrl && !audioBlob) || uploadingImage}
                    className="w-10 h-10 bg-primary-600/90 hover:bg-primary-500 disabled:opacity-30 text-white rounded-full transition-all shrink-0 shadow-[0_4px_15px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 flex items-center justify-center active:scale-95 cursor-pointer"
                    title="Send"
                  >
                    <Send size={17} />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs gap-3 p-8 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Liquid Glass Icon Capsule */}
            <div className="p-6 liquid-glass rounded-full border border-white/25 shadow-[0_10px_35px_rgba(239,68,68,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-3xl flex items-center justify-center animate-pulse">
              <MessageSquare size={44} className="text-primary-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
            </div>

            <h3 className="text-base font-black text-white uppercase tracking-widest mt-2 drop-shadow-md">Your Messages</h3>
            <p className="text-zinc-400 text-center max-w-xs leading-relaxed font-medium">
              Send private 1-on-1 messages or chat with your Clan members in real time.
            </p>

            {/* Liquid Glass Primary Button */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all duration-300 shadow-[0_8px_32px_rgba(239,68,68,0.4),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:shadow-[0_12px_45px_rgba(239,68,68,0.65),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/40 bg-gradient-to-r from-primary-600/60 via-white/20 to-primary-600/40 backdrop-blur-3xl relative overflow-hidden group hover:scale-[1.05] active:scale-95 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                <MessageSquarePlus size={18} className="text-primary-300 animate-bounce" />
                Start New Chat
              </span>
            </button>
          </div>
        )}
      </div>

      {/* New Chat User Search Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0d0d10]/95 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <MessageSquarePlus size={16} className="text-primary-500" /> New Message
                </h3>
                <button onClick={() => setShowNewChatModal(false)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  placeholder="Search user by name..."
                  className="w-full bg-black/50 border border-white/15 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                {isSearching ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-6 text-zinc-600 text-xs">
                    {searchUserQuery ? 'No users found' : 'Type a username to start a DM'}
                  </div>
                ) : (
                  searchResults.map(u => {
                    const adminTitle = u.admin_title;
                    const userTitle = (u.title && u.title !== u.username) ? u.title : null;
                    const displayTitle = adminTitle || userTitle || (
                      (u.level || 1) >= 100 ? 'Realm Sovereign' :
                      (u.level || 1) >= 75 ? 'Shadow Monarch' :
                      (u.level || 1) >= 50 ? 'Grandmaster' :
                      (u.level || 1) >= 25 ? 'Elite Vanguard' :
                      (u.level || 1) >= 10 ? 'Rising Champion' : 'Novice Adventurer'
                    );
                    return (
                      <div
                        key={u.id}
                        onClick={() => startDirectChat(u)}
                        className="p-3 bg-white/5 hover:bg-primary-600/20 border border-white/10 hover:border-primary-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0">
                            <ProfileAvatar profile={u} className="w-10 h-10" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">@{u.username}</span>
                            {displayTitle && (
                              <span className="text-[10px] font-extrabold text-amber-400 tracking-wide drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                                [{displayTitle}]
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-primary-400 font-bold uppercase bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">Chat</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Options Liquid Glass Action Sheet Modal (Mobile & Desktop) */}
      <AnimatePresence>
        {selectedMsgForMenu && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="w-full max-w-sm bg-[#121218]/95 border border-white/20 rounded-3xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-3xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Message Options</span>
                  <span className="text-[10px] font-medium text-zinc-400">@{selectedMsgForMenu.sender?.username || 'User'}</span>
                </div>
                <button onClick={() => setSelectedMsgForMenu(null)} className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Message Content Preview */}
              <div className="p-3 mb-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300 italic max-h-20 overflow-y-auto">
                "{selectedMsgForMenu.content || (selectedMsgForMenu.image_url ? '[Image]' : selectedMsgForMenu.audio_url ? '[Voice]' : '[Media]')}"
              </div>

              <div className="flex flex-col gap-2">
                {/* ↩️ Reply Option */}
                <button
                  onClick={() => {
                    setReplyingTo(selectedMsgForMenu);
                    setSelectedMsgForMenu(null);
                    const el = document.getElementById('chat-input-field');
                    if (el) el.focus();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-3 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-primary-400">↩️</span> Reply to Message
                </button>

                {/* ⏩ Forward Message Option */}
                <button
                  onClick={() => {
                    setForwardingMsg(selectedMsgForMenu);
                    setSelectedMsgForMenu(null);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-3 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-blue-400">⏩</span> Forward Message
                </button>

                {/* ✏️ Edit Option - ONLY shown for user's LAST message */}
                {(() => {
                  const myMessages = messages.filter(m => m.sender_id === user?.id);
                  const myLastId = myMessages.length > 0 ? myMessages[myMessages.length - 1].id : null;
                  const isMyLastMessage = selectedMsgForMenu.id === myLastId;

                  return isMyLastMessage ? (
                    <button
                      onClick={() => {
                        setInputMsg(selectedMsgForMenu.content || '');
                        setEditingMessageId(selectedMsgForMenu.id);
                        setSelectedMsgForMenu(null);
                        const el = document.getElementById('chat-input-field');
                        if (el) el.focus();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-3 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>✏️</span> Edit Message (Last Message)
                    </button>
                  ) : null;
                })()}

                {/* 🗑️ Delete Option */}
                {(selectedMsgForMenu.sender_id === user?.id || isLeaderOrStaff) && (
                  <button
                    onClick={() => {
                      deleteMessage(selectedMsgForMenu.id);
                      setSelectedMsgForMenu(null);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-3 transition-all active:scale-95 cursor-pointer mt-1"
                  >
                    <Trash2 size={16} /> Delete Message
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forward Message Picker Modal */}
      <AnimatePresence>
        {forwardingMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0d0d10]/95 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Send size={16} className="text-blue-400" /> Forward Message
                </h3>
                <button onClick={() => setForwardingMsg(null)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-zinc-400 italic">Select a conversation to forward this message to:</p>

              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-6 text-zinc-600 text-xs">No active conversations found</div>
                ) : (
                  conversations.map(c => {
                    const otherP = c.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
                    const name = c.type === 'clan' ? (c.clan?.name || 'Clan Chat') : (otherP?.username || 'Direct Chat');

                    return (
                      <div
                        key={c.id}
                        onClick={async () => {
                          if (!supabase || !user || !forwardingMsg) return;
                          try {
                            const forwardContent = forwardingMsg.content 
                              ? `[Forwarded]: ${forwardingMsg.content}` 
                              : '[Forwarded Media]';

                            await supabase.from('chat_messages').insert({
                              conversation_id: c.id,
                              sender_id: user.id,
                              content: forwardContent,
                              image_url: forwardingMsg.image_url || null,
                              audio_url: forwardingMsg.audio_url || null,
                              gif_url: forwardingMsg.gif_url || null
                            });

                            await supabase.from('chat_conversations').update({
                              last_message_preview: forwardContent,
                              updated_at: new Date().toISOString()
                            }).eq('id', c.id);

                            toast.success(`Message forwarded to ${name}`);
                            setForwardingMsg(null);
                          } catch (err: any) {
                            toast.error('Failed to forward message');
                          }
                        }}
                        className="p-3 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <ProfileAvatar profile={otherP} className="w-8 h-8" />
                          <span className="text-xs font-bold text-white">{name}</span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-bold uppercase bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">Send</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
