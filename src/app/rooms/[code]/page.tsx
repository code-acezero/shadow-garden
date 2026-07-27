"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Play, Pause, X, Users, MessageSquare, ArrowLeft, Loader2, MonitorPlay, Send, Shield, Lock, Trash2, LogOut, Crown, UserX, Volume2, VolumeX, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';
import { PageSkeleton } from '@/components/UIx/SkeletonLoaders';

export default function WatchRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const routeParams = useParams();
  const roomCode = (routeParams?.code as string) || '';
  const { user } = useAuth();

  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Player & Stream state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const chatBottomRef = React.useRef<HTMLDivElement | null>(null);

  const isHost = room?.host_id === user?.id;

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Room Data & Messages
  const fetchRoomData = useCallback(async () => {
    if (!supabase || !roomCode) return;
    try {
      const { data, error } = await supabase
        .from('watch_rooms')
        .select(`*, host:profiles(username, avatar_url)`)
        .eq('code', roomCode)
        .single();

      if (error || !data) {
        toast.error('Watch room not found');
        router.push('/rooms');
        return;
      }

      setRoom(data);
      setIsPlaying(data.is_playing);
      setVideoTime(data.video_timestamp || 0);

      // Fetch members
      const { data: memData } = await supabase
        .from('room_members')
        .select(`*, user:profiles(username, avatar_url, level, frame_id, show_level)`)
        .eq('room_id', data.id);
      setMembers(memData || []);

      // Fetch ephemeral messages
      const { data: msgData } = await supabase
        .from('room_messages')
        .select(`*, user:profiles(username, avatar_url, level, frame_id, show_level)`)
        .eq('room_id', data.id)
        .order('created_at', { ascending: true });
      setMessages(msgData || []);
      setTimeout(scrollToBottom, 100);

    } catch (err) {
      console.error('Error loading room:', err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, router]);

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!roomCode || !supabase) return;
    fetchRoomData();

    // Subscribe to room state changes
    const roomChannel = supabase
      .channel(`watchroom-${roomCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'watch_rooms', filter: `code=eq.${roomCode}` },
        (payload: any) => {
          if (payload.new) {
            setRoom(payload.new);
            setIsPlaying(payload.new.is_playing);
            setVideoTime(payload.new.video_timestamp);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages' },
        (payload: any) => {
          fetchRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomCode, fetchRoomData]);

  // 3. Host Periodic Playback Sync Heartbeat
  useEffect(() => {
    if (!isHost || !isPlaying || !room || !supabase) return;
    const interval = setInterval(() => {
      setVideoTime(prev => {
        const nextTime = prev + 3;
        supabase.from('watch_rooms').update({ video_timestamp: nextTime }).eq('id', room.id);
        return nextTime;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isHost, isPlaying, room]);

  // Sync Playback Action (Host Only)
  const togglePlayback = async () => {
    if (!isHost || !supabase || !room) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    await supabase
      .from('watch_rooms')
      .update({ is_playing: nextState, video_timestamp: videoTime })
      .eq('id', room.id);
  };

  // Change Stream Source (Host Only)
  const handleChangeStreamSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost || !supabase || !room || !customStreamUrl.trim()) return;

    try {
      await supabase
        .from('watch_rooms')
        .update({ custom_stream_url: customStreamUrl.trim() })
        .eq('id', room.id);
      
      setRoom((prev: any) => ({ ...prev, custom_stream_url: customStreamUrl.trim() }));
      setShowSourceModal(false);
      setCustomStreamUrl('');
      toast.success('Media stream updated by host');
    } catch (err) {
      toast.error('Failed to update media stream');
    }
  };

  // Kick Member (Host Only)
  const handleKickMember = async (memberUserId: string) => {
    if (!isHost || !supabase || !room) return;
    try {
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', memberUserId);
      
      setMembers(prev => prev.filter(m => m.user_id !== memberUserId));
      toast.success('Member removed from watchroom');
    } catch (err) {
      toast.error('Failed to kick member');
    }
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const textToSend = customContent || inputMsg;
    if (!user || !supabase || !textToSend.trim() || !room) return;

    try {
      if (!customContent) setInputMsg('');
      await supabase.from('room_messages').insert({
        room_id: room.id,
        user_id: user.id,
        content: textToSend.trim(),
      });
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  // Close / Destroy Room (Host Only)
  const handleCloseRoom = async () => {
    if (!isHost || !supabase || !room) return;
    try {
      await supabase.from('room_messages').delete().eq('room_id', room.id);
      await supabase.from('watch_rooms').delete().eq('id', room.id);
      toast.success('Watch room closed');
      router.push('/rooms');
    } catch (err) {
      toast.error('Failed to close room');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  // Get Video Source Embed URL
  const videoSrc = room?.custom_stream_url 
    ? room.custom_stream_url
    : `https://vidsrc.to/embed/${room?.media_type || 'anime'}/${room?.media_id || '1'}`;

  const quickReactions = ['🔥', '😂', '😱', '❤️', '👏', '🍿', '⚡'];

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col safe-top">
      {/* Header bar */}
      <div className="bg-[#0a0a0a] border-b border-white/10 px-4 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30">
            {room?.media_type}
          </span>
          <h1 className="text-sm font-black text-white uppercase tracking-wider line-clamp-1">{room?.title}</h1>
          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded-md hidden sm:inline-block">
            CODE: {room?.code}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isHost && (
            <>
              <button
                onClick={() => setShowSourceModal(true)}
                className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <MonitorPlay size={14} /> Source
              </button>
              <button
                onClick={handleCloseRoom}
                className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Close
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/rooms')}
            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>

      {/* Main Grid: Synchronized Player + Live Chat & Members */}
      <div className="flex-1 w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Synchronized Player Container */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Embedded Stream */}
            <iframe
              src={videoSrc}
              className="w-full h-full border-0 pointer-events-auto"
              allowFullScreen
              allow="autoplay; fullscreen"
            />

            {/* Sync Playback Lock Overlay */}
            {isHost && (
              <div className="absolute bottom-4 left-4 z-20">
                <button
                  onClick={togglePlayback}
                  className="px-4 py-2 bg-black/80 border border-white/20 hover:bg-primary-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 backdrop-blur-md"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Pause All Viewers' : 'Sync Play All Viewers'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Ephemeral Chat & Members Panel */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 flex flex-col h-[550px] lg:h-auto shadow-2xl">
          {/* Members Bar */}
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Users size={14} className="text-primary-500" /> Viewers ({members.length})
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[180px]">
              {members.map(m => (
                <div key={m.id} className="relative group shrink-0" title={m.user?.username}>
                  <ProfileAvatar profile={m.user} className="w-6 h-6" />
                  {m.user_id === room?.host_id && (
                    <Crown className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 drop-shadow" />
                  )}
                  {isHost && m.user_id !== user?.id && (
                    <button
                      onClick={() => handleKickMember(m.user_id)}
                      className="absolute inset-0 bg-red-900/80 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <UserX size={12} className="text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs">No live messages yet. Say hello!</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2.5">
                  <ProfileAvatar profile={msg.user} className="w-7 h-7 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                        {msg.user?.username || 'Viewer'}
                        {msg.user_id === room?.host_id && <Crown size={10} className="text-yellow-400" />}
                      </span>
                    </div>
                    <p className="text-xs text-white bg-white/5 border border-white/5 rounded-2xl px-3 py-2 mt-1 inline-block break-words max-w-[90%]">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reactions Bar */}
          <div className="py-2 flex items-center justify-between border-t border-white/5">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendMessage(undefined, emoji)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-sm transition-transform active:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Send live message..."
              className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-full transition-all shrink-0 shadow-lg"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Host Change Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <MonitorPlay size={16} className="text-primary-500" /> Update Stream Source
              </h3>
              <button onClick={() => setShowSourceModal(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleChangeStreamSource} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-mono block mb-1.5">Custom Stream Embed / Video URL</label>
                <input
                  type="url"
                  value={customStreamUrl}
                  onChange={e => setCustomStreamUrl(e.target.value)}
                  placeholder="https://... (HLS, YouTube, or Embed URL)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowSourceModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-500 text-xs font-bold">
                  Save Source
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
