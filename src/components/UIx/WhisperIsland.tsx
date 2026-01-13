"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings'; 
import { Bell, MessageCircle, Heart, Tv, Zap } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function WhisperIsland() {
  const { user } = useAuth();
  const { settings } = useSettings(); 
  const router = useRouter();
  
  // HYDRATION FIX: Prevent SSR mismatch by tracking mount state
  const [hasMounted, setHasMounted] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [activeNotif, setActiveNotif] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 1. Listen for "Whispers" (Realtime Notifications)
  useEffect(() => {
    if (!user || !supabase || !hasMounted) return;

    const channel = supabase.channel('whisper-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, async (payload) => {
        let actor = null;
        if (supabase) {
             const { data } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', payload.new.actor_id)
                .single();
             actor = data;
        }
        const fullNotif = { ...payload.new, actor };
        setQueue((prev) => [...prev, fullNotif]);
      })
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [user, hasMounted]);

  // 2. Queue Processor: Handle flow of incoming notifications
  useEffect(() => {
    if (!activeNotif && queue.length > 0) {
      const next = queue[0];
      setActiveNotif(next);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, activeNotif]);

  // 3. Auto-Dismiss Logic
  useEffect(() => {
    if (activeNotif && !isHovered) {
      const timer = setTimeout(() => {
        setActiveNotif(null);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [activeNotif, isHovered]);

  // Glow Color Logic based on notification type
  const getGlowColor = (type: string) => {
    switch (type) {
        case 'like': return 'shadow-red-500/50 border-red-500/30';
        case 'comment': return 'shadow-blue-500/50 border-blue-500/30';
        case 'anime_update': return 'shadow-green-500/50 border-green-500/30';
        default: return 'shadow-purple-500/50 border-purple-500/30';
    }
  };

  // Guard against server-side rendering and disabled settings
  if (!hasMounted || settings?.enableWhisper === false) return null; 

  return (
    <div className="fixed top-4 left-0 right-0 z-[200] flex justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        {activeNotif && (
          <motion.div
            key={activeNotif.id}
            layout
            // --- DYNAMIC ISLAND MORPH ANIMATION ---
            initial={{ 
                width: 10, 
                height: 10, 
                opacity: 0, 
                borderRadius: 50,
                y: 0 
            }}
            animate={{ 
                width: "auto", 
                height: "auto", 
                opacity: 1, 
                borderRadius: 30,
                y: 10,
                transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    mass: 0.8
                }
            }}
            exit={{ 
                width: 10, 
                height: 10, 
                opacity: 0, 
                y: 0,
                transition: { duration: 0.3, ease: "backIn" }
            }}
            // ---------------------------------------------
            
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => {
                if (activeNotif.link) router.push(activeNotif.link);
                setActiveNotif(null);
            }}
            className={`
                pointer-events-auto cursor-pointer relative 
                bg-black/95 backdrop-blur-xl 
                border flex items-center gap-3 overflow-hidden
                shadow-[0_0_30px_-5px_rgba(0,0,0,0.8)]
                ${getGlowColor(activeNotif.type)}
            `}
            style={{ minWidth: 40, minHeight: 40 }}
          >
            {/* Heartbeat Pulse (Animated Edge Glow) */}
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 rounded-[30px] shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]`}
            />

            {/* Content Manifestation */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                className="flex items-center gap-3 p-2 pr-5 w-full whitespace-nowrap"
            >
                {/* Visual Avatar / Poster Section */}
                <div className="relative shrink-0">
                    {activeNotif.image_url ? (
                        <img src={activeNotif.image_url} alt="Notification Poster" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    ) : (
                        <Avatar className="w-10 h-10 border border-white/10">
                            <AvatarImage src={activeNotif.actor?.avatar_url} />
                            <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                                {activeNotif.type === 'system' ? <Tv size={16}/> : activeNotif.actor?.username?.[0] || '?'}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    
                    {/* Action Category Badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center bg-zinc-900">
                        {activeNotif.type === 'like' && <Heart size={8} className="text-red-500 fill-current"/>}
                        {activeNotif.type === 'comment' && <MessageCircle size={8} className="text-blue-500 fill-current"/>}
                        {activeNotif.type === 'anime_update' && <Zap size={8} className="text-green-500 fill-current"/>}
                        {activeNotif.type === 'system' && <Bell size={8} className="text-purple-500 fill-current"/>}
                    </div>
                </div>

                {/* Intelligence Feed Section */}
                <div className="flex flex-col justify-center min-w-[180px] max-w-[250px]">
                    <div className="flex items-center gap-2">
                        <h4 className="text-white text-xs font-black truncate uppercase tracking-tighter">
                            {activeNotif.actor?.username || "SHADOW_COMMAND"}
                        </h4>
                        <span className="text-[8px] text-zinc-600 font-bold opacity-60">SIGNAL_RECVD</span>
                    </div>
                    <p className="text-zinc-400 text-[10px] truncate tracking-tight">{activeNotif.content}</p>
                </div>

                {/* Tactical Navigation Button */}
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600/20 hover:border-red-500/50 transition-all shrink-0">
                    <span className="text-[8px] font-black text-white">INTERCEPT</span>
                </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}