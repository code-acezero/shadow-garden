"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Trash2, CheckCheck, ExternalLink, Film, Tv, MessageSquare, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id?: string;
  type?: string;
  entity_id?: string;
  content?: string;
  image_url?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch real notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Realtime listener & initial load
  useEffect(() => {
    if (!user || !supabase) return;

    fetchNotifications();

    const channel = supabase
      .channel(`realtime-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // 3. Mark all notifications as read
  const markAllRead = async () => {
    if (!user || !supabase || notifications.length === 0) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // 4. Clear all notifications (DELETE)
  const clearAll = async () => {
    if (!user || !supabase || notifications.length === 0) return;
    try {
      setNotifications([]);
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // 5. Delete single notification
  const removeNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !supabase) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // 6. Handle click notification (Mark read & Navigate)
  const handleNotifClick = async (item: NotificationItem) => {
    if (!item.is_read && user && supabase) {
      try {
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', item.id);
      } catch (err) {
        console.error('Error marking read:', err);
      }
    }

    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'anime_update':
      case 'EPISODE_ALERT':
        return <Tv size={14} className="text-emerald-400" />;
      case 'GUILD_WARNING':
        return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'REPLY':
        return <MessageSquare size={14} className="text-sky-400" />;
      default:
        return <Bell size={14} className="text-primary-400" />;
    }
  };

  return (
    <div className="relative z-50">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 group transition-all outline-none"
        title="Notifications"
      >
        <div
          className={`absolute inset-0 bg-primary-600/20 rounded-full transition-transform duration-300 ${
            isOpen ? 'scale-100' : 'scale-0 group-hover:scale-100'
          }`}
        />
        <Bell
          size={20}
          className={`relative z-10 transition-colors ${
            isOpen ? 'text-white' : 'text-zinc-400 group-hover:text-white'
          }`}
        />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-primary-600 text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-[#050505] shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9)] overflow-hidden z-50 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary-950/20 via-black to-transparent">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                    <Bell size={14} className="text-primary-500" /> Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold bg-primary-600/30 text-primary-400 border border-primary-500/30 px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} /> Mark Read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] text-red-400/80 hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                      title="Clear all notifications"
                    >
                      <Trash2 size={12} /> Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto no-scrollbar divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Bell size={32} className="opacity-20 stroke-[1.5]" />
                    <p className="text-xs font-bold uppercase tracking-wider">No notifications yet</p>
                    <span className="text-[10px] text-zinc-600">Tracked series alerts and system updates will appear here.</span>
                  </div>
                ) : (
                  notifications.map(item => {
                    const timeAgo = item.created_at
                      ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                      : '';

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotifClick(item)}
                        className={`relative p-3.5 flex gap-3 transition-colors cursor-pointer group hover:bg-white/5 ${
                          !item.is_read ? 'bg-primary-500/5' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Status Dot / Image / Icon */}
                        <div className="relative shrink-0 mt-0.5">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-md"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                              {getNotifIcon(item.type)}
                            </div>
                          )}
                          {!item.is_read && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-black shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-xs leading-snug ${!item.is_read ? 'text-white font-bold' : 'text-zinc-300 font-medium'}`}>
                            {item.content}
                          </p>
                          <span className="text-[9px] text-zinc-500 font-mono mt-1 block">
                            {timeAgo}
                          </span>
                        </div>

                        {/* Delete Single Action */}
                        <button
                          onClick={e => removeNotif(item.id, e)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity p-1"
                          title="Remove notification"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}