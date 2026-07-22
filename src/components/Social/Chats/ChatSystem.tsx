"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Send, Users, User, Image as ImageIcon, Search, Shield, 
  Loader2, MessageSquarePlus, Heart, ArrowLeft, Plus, Check, CheckCheck, X, Circle, MoreVertical, Trash2, Mic, Square, Ban, Smile, Globe
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
  };
}

export default function ChatSystem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get('chatId');

  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const [showGifTray, setShowGifTray] = useState(false);
  const [gifQuery, setGifQuery] = useState('anime');
  const [gifResults, setGifResults] = useState<Array<{id: string; url: string; preview: string}>>([]);
  const [gifLoading, setGifLoading] = useState(false);

  const GIPHY_KEY = 'dc6zaTOxFJmzC';

  const fetchGifs = useCallback(async (query: string) => {
    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=16&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=16&rating=g`;
      const res = await fetch(endpoint);
      const json = await res.json();
      setGifResults((json.data || []).map((g: any) => ({
        id: g.id,
        url: g.images.fixed_height.url,
        preview: g.images.fixed_height_small.url,
      })));
    } catch {
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  }, []);

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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`*, conversation:chat_conversations(*, clan:clans(name, avatar_url, level), participants:chat_participants(user:profiles(id, username, avatar_url, last_seen_at, frame_id, level, show_level, title)), messages:chat_messages(content, image_url, audio_url, gif_url, created_at))`)
        .eq('user_id', user.id)
        .order('created_at', { foreignTable: 'conversation.messages', ascending: false })
        .limit(1, { foreignTable: 'conversation.messages' });

      if (error) throw error;
      const convs = (data || []).map((p: any) => {
          const conv = p.conversation;
          if (conv && conv.messages && conv.messages.length > 0) {
              const lastM = conv.messages[0];
              if (!conv.last_message_preview) {
                  if (lastM.content) conv.last_message_preview = lastM.content;
                  else if (lastM.image_url) conv.last_message_preview = 'Sent an image';
                  else if (lastM.audio_url) conv.last_message_preview = 'Sent a voice message';
                  else if (lastM.gif_url) conv.last_message_preview = 'Sent a GIF';
              }
          }
          if (conv) conv.participant_last_read = p.last_read_at;
          return conv;
      }).filter(Boolean).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      await Promise.all(convs.map(async (conv: any) => {
          const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', conv.participant_last_read || '1970-01-01T00:00:00Z');
          conv.unread_count = count || 0;
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
    } catch (err) {
      console.error('Fetch convs error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSelectConv = useCallback((conv: any) => {
    setActiveConv(conv);
    if (typeof window !== 'undefined') {
      if (conv) {
        window.history.replaceState(null, '', `/messages?chatId=${conv.id}`);
      } else {
        window.history.replaceState(null, '', '/messages');
      }
    }
  }, []);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConv || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`*, sender:profiles(username, avatar_url, frame_id, level, show_level)`)
        .eq('conversation_id', activeConv.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, [activeConv]);

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
        .select('id, username, avatar_url')
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
      fetchConversations();
      setActiveConv({
          ...conv,
          participants: [
              { user: { id: user.id, username: user.user_metadata?.username, avatar_url: user.user_metadata?.avatar_url } },
              { user: { id: targetUser.id, username: targetUser.username, avatar_url: targetUser.avatar_url } }
          ]
      });
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
      setInputMsg('');
      setImageUrl('');
      setAudioBlob(null);

      await supabase.from('chat_messages').insert({
        conversation_id: activeConv.id,
        sender_id: user.id,
        content: txt,
        image_url: img || null,
        audio_url: uploadedAudioUrl || null,
        gif_url: gifUrl || null
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
    }
  };

  const uploadAudio = async (blob: Blob) => {
    if (!user) return null;
    const fileName = `voice_${user.id}_${Date.now()}.webm`;
    const { data, error } = await supabase.storage.from('chat_audio').upload(fileName, blob, { contentType: 'audio/webm' });
    if (error) { toast.error("Failed to upload voice message"); return null; }
    const { data: { publicUrl } } = supabase.storage.from('chat_audio').getPublicUrl(fileName);
    return publicUrl;
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
      <div className="p-12 text-center bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl text-zinc-500 text-xs font-bold">
        Sign in to access Direct Messages and Clan chats.
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0c0c0e]/95 backdrop-blur-2xl border-0 sm:border sm:border-white/10 sm:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
      
      {/* Conversations List Sidebar */}
      <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-[#08080a]/90 backdrop-blur-xl ${activeConv ? 'hidden md:flex' : 'flex'} h-full`}>
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
              let avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${c.id}`;
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
                  avatar = otherParticipant.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherParticipant.id}`;
                  userTitle = otherParticipant.title || 'Member';
                  isUserOnline = Boolean(activeUsers[otherParticipant.id]);
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
                        headerAvatar = otherUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.id}`;
                      }
                    }

                    const isUserOnline = otherUser?.id ? Boolean(activeUsers[otherUser.id]) : false;
                    
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
                            {!isClan && otherUser?.title && (
                              <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-primary-300 bg-primary-950/60 border border-primary-500/30 rounded-full shrink-0 truncate backdrop-blur-md">
                                {otherUser.title}
                              </span>
                            )}
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
                    <div className="absolute right-0 mt-2 w-48 bg-[#14141a]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl py-2 z-50 overflow-hidden">
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
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
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

                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${isLastInStack ? 'mb-4' : 'mb-1'}`}>
                      {!isMe && (
                        <div className="shrink-0 w-7 mb-0.5">
                          {isLastInStack && (
                            <ProfileAvatar profile={msg.sender} className="w-7 h-7 cursor-pointer" />
                          )}
                        </div>
                      )}
                      <div className={`max-w-[82%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && isFirstInStack && (
                          <span className="text-[9px] font-bold text-zinc-400 mb-1 ml-1">{msg.sender?.username || 'User'}</span>
                        )}

                        {msg.image_url && (
                          <img src={msg.image_url} alt="" className={`max-w-xs mb-0.5 border border-white/10 object-cover shadow-lg ${bubbleClasses}`} />
                        )}
                        
                        {msg.gif_url && (
                          <img src={msg.gif_url} alt="GIF" className={`max-w-[150px] mb-0.5 border border-white/10 shadow-md ${bubbleClasses}`} />
                        )}

                        {msg.audio_url && (
                          <div className={`mb-0.5 px-3.5 py-2 flex items-center gap-2 ${bubbleClasses} ${isMe ? 'bg-primary-600/90 text-white backdrop-blur-md' : 'bg-[#14141a]/90 backdrop-blur-md border border-white/10'}`}>
                            <audio controls src={msg.audio_url} className="h-8 max-w-[200px]" />
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
                    </div>
                  );
                })
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

            {/* Input Bar */}
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
                    <div className="absolute -top-14 left-0 h-12 px-4 bg-zinc-800/90 backdrop-blur-md rounded-full border border-white/15 flex items-center gap-2 z-10 shadow-lg">
                      <Mic size={16} className="text-primary-400 animate-pulse"/>
                      <span className="text-xs font-bold text-white">Voice Message Ready</span>
                      <button type="button" onClick={() => setAudioBlob(null)} className="p-1 hover:bg-white/10 rounded-full text-white cursor-pointer"><X size={14}/></button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    placeholder={isRecording ? "Recording..." : "Message..."}
                    disabled={isRecording}
                    className="w-full bg-black/50 border border-white/15 rounded-full px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                
                {/* Voice Record Pill Button */}
                <button
                  type="button"
                  onPointerDown={startRecording}
                  onPointerUp={stopRecording}
                  onPointerLeave={stopRecording}
                  className={`w-10 h-10 rounded-full transition-all shrink-0 flex items-center justify-center active:scale-95 cursor-pointer backdrop-blur-md ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white'}`}
                  title="Hold for Voice Message"
                >
                  {isRecording ? <Square size={16} /> : <Mic size={18} />}
                </button>

                {/* Mention & Tag Icons */}
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-xs gap-3 p-8">
            <div className="p-5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md shadow-xl">
              <MessageSquare size={40} className="text-primary-500 opacity-80" />
            </div>
            <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">Your Messages</h3>
            <p className="text-zinc-500 text-center max-w-xs leading-relaxed">
              Send private 1-on-1 messages or chat with your Clan members in real time.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-2 px-6 py-2.5 bg-primary-600/90 hover:bg-primary-500 text-white rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 active:scale-95 cursor-pointer"
            >
              Start New Chat
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
                  searchResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => startDirectChat(u)}
                      className="p-3 bg-white/5 hover:bg-primary-600/20 border border-white/10 hover:border-primary-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all backdrop-blur-md"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <span className="text-xs font-bold text-white">@{u.username}</span>
                      </div>
                      <span className="text-[10px] text-primary-400 font-bold uppercase bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">Chat</span>
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
