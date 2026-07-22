"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Play, Pause, X, Users, MessageSquare, ArrowLeft, Loader2, MonitorPlay, Send, Shield, Lock, Trash2, LogOut, Crown, UserX, Volume2, VolumeX, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';

export default function WatchRoomPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const roomCode = params.code as string;
  const { user } = useAuth();

  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

  const isHost = room?.host_id === user?.id;

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

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !inputMsg.trim() || !room) return;

    try {
      const msg = inputMsg;
      setInputMsg('');
      await supabase.from('room_messages').insert({
        room_id: room.id,
        user_id: user.id,
        content: msg,
      });
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  // Close / Destroy Room (Host Only)
  const handleCloseRoom = async () => {
    if (!isHost || !supabase || !room) return;
    try {
      // Ephemeral chat deletion
      await supabase.from('room_messages').delete().eq('room_id', room.id);
      await supabase.from('watch_rooms').delete().eq('id', room.id);
      toast.success('Watch room closed');
      router.push('/rooms');
    } catch (err) {
      toast.error('Failed to close room');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col safe-top pt-16 md:pt-20 pb-20 md:pb-0">
      {/* Header bar */}
      <div className="bg-[#0a0a0a] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30">
            {room?.media_type}
          </span>
          <h1 className="text-sm font-black text-white uppercase tracking-wider">{room?.title}</h1>
          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
            CODE: {room?.code}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isHost && (
            <button
              onClick={handleCloseRoom}
              className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Close Room
            </button>
          )}
          <button
            onClick={() => router.push('/rooms')}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>

      {/* Main Grid: Player + Live Chat & Members */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Synchronized Player Container */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Embedded Iframe Stream */}
            <iframe
              src={`https://vidsrc.to/embed/${room?.media_type}/${room?.media_id}`}
              className="w-full h-full border-0 pointer-events-auto"
              allowFullScreen
              allow="autoplay; fullscreen"
            />

            {/* Sync Playback Lock Overlay */}
            {isHost && (
              <div className="absolute bottom-4 left-4 z-20">
                <button
                  onClick={togglePlayback}
                  className="px-4 py-2 bg-black/80 border border-white/20 hover:bg-primary-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Pause All Viewers' : 'Sync Play All Viewers'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Ephemeral Chat & Members Panel */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 flex flex-col h-[600px] shadow-2xl">
          {/* Members Bar */}
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Users size={14} className="text-primary-500" /> Members ({members.length})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Live Ephemeral Chat</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-xs">No chat messages yet.</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 shrink-0 mt-0.5 relative">
                    <ProfileAvatar profile={msg.user} className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400">{msg.user?.username || 'Viewer'}</span>
                    </div>
                    <p className="text-xs text-white bg-white/5 border border-white/5 rounded-2xl px-3 py-2 mt-1">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Send live chat message..."
              className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-full transition-all shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
