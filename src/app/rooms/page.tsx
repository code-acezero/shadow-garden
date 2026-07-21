"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Play, Lock, Globe, Radio, Clock, Shield, Trash2, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import Footer from '@/components/Anime/Footer';

export interface WatchRoom {
  id: string;
  code: string;
  title: string;
  host_id: string;
  media_id: string;
  media_type: string;
  episode_number: number;
  video_timestamp: number;
  is_playing: boolean;
  is_private: boolean;
  created_at: string;
  host?: { username: string; avatar_url: string };
  member_count?: number;
}

export default function RoomsHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<WatchRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [roomTitle, setRoomTitle] = useState('');
  const [mediaId, setMediaId] = useState('solo-leveling');
  const [mediaType, setMediaType] = useState('anime');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');

  const fetchRooms = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watch_rooms')
        .select(`*, host:profiles(username, avatar_url)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!user || !supabase) {
      toast.error('Log in to create a watch room');
      return;
    }

    if (!roomTitle.trim()) {
      toast.error('Room title is required');
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from('watch_rooms')
        .insert({
          code,
          title: roomTitle,
          host_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          is_private: isPrivate,
          passcode: isPrivate ? passcode : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add host as room member
      await supabase.from('room_members').insert({
        room_id: data.id,
        user_id: user.id,
        role: 'host',
      });

      toast.success(`Watch Room Created! Code: ${code}`);
      setCreateModalOpen(false);
      router.push(`/rooms/${code}`);
    } catch (err: any) {
      console.error('Create room error:', err);
      toast.error(err.message || 'Failed to create room');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col safe-top pt-20 md:pt-24 pb-20 md:pb-0">
      <div className="w-full max-w-[1350px] mx-auto px-4 flex-1">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-600/20 border border-primary-500/30 rounded-2xl text-primary-400">
                <Users size={24} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                Synchronized Watch Rooms
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-2 max-w-xl">
              Watch Anime, Donghua, Movies & Drama together in real-time. Live synchronized video, temporary chat, and full room controls.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-900/40 flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Create Watch Room
          </button>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-16 text-center bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col items-center gap-4">
            <Users size={48} className="text-zinc-600" />
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">No Active Watch Rooms</h3>
            <p className="text-xs text-zinc-500 max-w-md">Be the first to host a watch party! Create a room and invite your friends or guild members.</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 px-6 py-2.5 bg-primary-600 text-white rounded-full text-xs font-bold uppercase tracking-wider"
            >
              Start A Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div
                key={room.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 hover:border-primary-500/50 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30">
                      {room.media_type}
                    </span>
                    {room.is_private ? (
                      <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                        <Lock size={12} /> Private
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Globe size={12} /> Public
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                    {room.title}
                  </h3>

                  <div className="flex items-center gap-3 mt-4">
                    <img
                      src={room.host?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Host'}
                      alt=""
                      className="w-8 h-8 rounded-full border border-white/10 object-cover"
                    />
                    <div className="text-xs">
                      <span className="text-zinc-500 text-[10px] block">Hosted by</span>
                      <span className="font-bold text-zinc-200">{room.host?.username || 'Host'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">
                    CODE: <strong className="text-white">{room.code}</strong>
                  </span>

                  <Link
                    href={`/rooms/${room.code}`}
                    className="px-4 py-2 bg-white/5 hover:bg-primary-600 border border-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    Join Room <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Radio size={16} className="text-primary-500" /> Create Watch Room
                </h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Room Title</label>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={e => setRoomTitle(e.target.value)}
                    placeholder="Solo Leveling Ep 12 Watch Party..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Category</label>
                    <select
                      value={mediaType}
                      onChange={e => setMediaType(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="anime">Anime</option>
                      <option value="donghua">Donghua</option>
                      <option value="movie">Movie</option>
                      <option value="drama">Drama</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Media Slug / ID</label>
                    <input
                      type="text"
                      value={mediaId}
                      onChange={e => setMediaId(e.target.value)}
                      placeholder="solo-leveling"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Private Room</h4>
                    <p className="text-[10px] text-zinc-500">Require passcode to join.</p>
                  </div>
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-primary-600' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isPrivate ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {isPrivate && (
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Room Passcode</label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      placeholder="Enter 4-digit passcode..."
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Launch Room
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
