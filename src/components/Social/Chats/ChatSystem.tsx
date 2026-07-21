"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Send, Users, User, Image as ImageIcon, Search, Shield, 
  Loader2, MessageSquarePlus, Heart, ArrowLeft, Plus, Check, CheckCheck, X, Circle, MoreVertical, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';
import { ImageAPI } from '@/lib/api';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  sender?: { username: string; avatar_url: string };
}

export default function ChatSystem() {
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
  const [uploadingImage, setUploadingImage] = useState(false);

  // 1. Fetch User Conversations
  const fetchConversations = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`*, conversation:chat_conversations(*, clan:clans(name, avatar_url), participants:chat_participants(user:profiles(id, username, avatar_url, last_seen_at)))`)
        .eq('user_id', user.id);

      if (error) throw error;
      const convs = (data || []).map((p: any) => p.conversation).filter(Boolean).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setConversations(convs);
      if (convs.length > 0 && !activeConv && typeof window !== 'undefined' && window.innerWidth >= 768) {
        setActiveConv(convs[0]);
      }
    } catch (err) {
      console.error('Fetch convs error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeConv]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConv || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`*, sender:profiles(username, avatar_url)`)
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
        .subscribe(async (status) => {
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
      // Create or get conversation
      const { data: conv, error } = await supabase
        .from('chat_conversations')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (error) throw error;

      // Add participants
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !activeConv || (!inputMsg.trim() && !imageUrl)) return;

    try {
      const txt = inputMsg;
      const img = imageUrl;
      setInputMsg('');
      setImageUrl('');

      await supabase.from('chat_messages').insert({
        conversation_id: activeConv.id,
        sender_id: user.id,
        content: txt,
        image_url: img || null
      });
    } catch (err) {
      console.error('Send message error:', err);
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

  const handleClearChat = async () => {
    if (!activeConv || !user || !confirm("Clear chat for you?")) return;
    // For DMs, removing participant hides it
    await supabase.from('chat_participants').delete().eq('conversation_id', activeConv.id).eq('user_id', user.id);
    setActiveConv(null);
    setShowOptions(false);
    fetchConversations();
    toast.success('Chat cleared');
  };

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#0a0a0a] border border-white/10 rounded-3xl text-zinc-500 text-xs">
        Sign in to access Instagram-style Direct Messages and Clan chats.
      </div>
    );
  }

  return (
    <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" style={{ height: "calc(100dvh - var(--nav-height-top) - var(--nav-height-bottom) - 100px)", minHeight: "450px" }}>
      
      {/* Conversations List Sidebar (Hidden on mobile if chat is active) */}
      <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-[#08080a] ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-primary-500" /> Messages
          </h3>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-1.5 bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600 hover:text-white rounded-full transition-all"
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
                className="px-4 py-2 bg-primary-600 text-white rounded-full text-xs font-bold uppercase"
              >
                Send Message
              </button>
            </div>
          ) : (
            conversations.map(c => {
              const isSelected = activeConv?.id === c.id;
              let title = 'Direct Message';
              let avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${c.id}`;
              
              if (c.type === 'clan') {
                title = `Clan: ${c.clan?.name}`;
                avatar = c.clan?.avatar_url || avatar;
              } else if (c.type === 'direct') {
                const otherParticipant = c.participants?.find((p: any) => p.user?.id !== user.id)?.user;
                if (otherParticipant) {
                  title = otherParticipant.username;
                  avatar = otherParticipant.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherParticipant.id}`;
                }
              }

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected ? 'bg-primary-600/15 border-l-4 border-primary-500' : 'hover:bg-white/5'
                  }`}
                >
                  <img 
                    src={avatar} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${c.id}`);
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mt-0.5 truncate">{c.last_message_preview || `${c.type} chat`}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Window */}
      <div className={`flex-1 flex-col min-w-0 bg-[#050507] ${activeConv ? 'flex' : 'hidden md:flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Top Bar */}
              <div className="p-3.5 px-5 border-b border-white/10 bg-[#0a0a0d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1.5 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  {(() => {
                    const isClan = activeConv.type === 'clan';
                    let headerTitle = isClan ? activeConv.clan?.name : 'Direct Message';
                    let headerAvatar = isClan ? activeConv.clan?.avatar_url : '';
                    
                    if (!isClan) {
                      const otherParticipant = activeConv.participants?.find((p: any) => p.user?.id !== user.id)?.user;
                      if (otherParticipant) {
                        headerTitle = otherParticipant.username;
                        headerAvatar = otherParticipant.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherParticipant.id}`;
                      }
                    }
                    
                    return (
                      <>
                        <img 
                          src={headerAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeConv.id}`} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white leading-tight truncate">{headerTitle}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isClan ? (
                              <span className="text-[10px] text-primary-400">Clan Group Chat</span>
                            ) : (
                              <>
                                {Object.keys(activeUsers).length > 0 ? (
                                  <>
                                    <Circle size={8} className="fill-green-500 text-green-500" />
                                    <span className="text-[10px] text-green-500 font-bold">Online</span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">
                                    {activeConv.participants?.find((p: any) => p.user?.id !== user.id)?.user?.last_seen_at 
                                      ? `Active ${formatDistanceToNow(new Date(activeConv.participants?.find((p: any) => p.user?.id !== user.id)?.user?.last_seen_at))} ago` 
                                      : 'Offline'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Options Menu */}
                <div className="relative">
                  <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                    <MoreVertical size={18} />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#18181c] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                      <button className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/5 flex items-center gap-2">
                        <User size={14} /> View Profile
                      </button>
                      <div className="h-px bg-white/10 my-1"></div>
                      <button onClick={handleClearChat} className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                        <Trash2 size={14} /> Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 text-xs">
                  Say hello! Send your first message below.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === user.id;
                  const senderAvatar = msg.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_id}`;

                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <img
                        src={senderAvatar}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mb-1"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_id}`);
                        }}
                      />
                      <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[9px] font-bold text-zinc-500 mb-1 ml-1">{msg.sender?.username || 'User'}</span>
                        )}

                        {msg.image_url && (
                          <img src={msg.image_url} alt="" className="max-w-xs rounded-2xl mb-1 border border-white/10 object-cover" />
                        )}

                        {msg.content && (
                          <p
                            className={`text-xs px-4 py-2.5 rounded-2xl leading-relaxed ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-br-sm shadow-md'
                                : 'bg-[#18181c] text-zinc-100 border border-white/10 rounded-bl-sm'
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
                <div className="flex items-end gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 shrink-0 mb-1 flex items-center justify-center">
                    <User size={12} className="text-zinc-500" />
                  </div>
                  <div className="bg-[#18181c] text-zinc-400 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md flex items-center gap-1.5 w-fit">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mr-1">Typing</span>
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} />
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} />
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-white/10 bg-[#0a0a0d] flex items-center gap-2">
              
              <div className="relative">
                <button type="button" onClick={() => document.getElementById('chat-image-upload')?.click()} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                  {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                </button>
                <input id="chat-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              <div className="flex-1 relative">
                {imageUrl && (
                  <div className="absolute -top-12 left-0 w-10 h-10 bg-zinc-800 rounded-lg border border-white/10 overflow-hidden group">
                    <img src={imageUrl} alt="upload" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImageUrl('')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><X size={12}/></button>
                  </div>
                )}
                <input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Message..."
                  className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={!inputMsg.trim() && !imageUrl}
                className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded-full transition-all shrink-0 shadow-lg"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-xs gap-3 p-8">
            <div className="p-4 bg-white/5 rounded-full border border-white/10">
              <MessageSquare size={36} className="text-primary-500 opacity-60" />
            </div>
            <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">Your Messages</h3>
            <p className="text-zinc-500 text-center max-w-xs">
              Send private 1-on-1 messages or chat with your Clan members.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat User Search Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0d0d10] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <MessageSquarePlus size={14} className="text-primary-500" /> New Message
                </h3>
                <button onClick={() => setShowNewChatModal(false)} className="text-zinc-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  placeholder="Search user by name..."
                  className="w-full bg-black/50 border border-white/10 rounded-full pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
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
                      className="p-3 bg-white/5 hover:bg-primary-600/20 border border-white/5 hover:border-primary-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <span className="text-xs font-bold text-white">@{u.username}</span>
                      </div>
                      <span className="text-[10px] text-primary-400 font-bold uppercase">Chat</span>
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
