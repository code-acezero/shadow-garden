"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, Trash2, CheckCheck, ExternalLink, Film, Tv, MessageSquare, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

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

export interface NotificationsProps {
  buttonClassName?: string;
  bellSize?: number;
  unboxed?: boolean;
}

export default function Notifications({ buttonClassName, bellSize = 20, unboxed = false }: NotificationsProps = {}) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tempNotifications, setTempNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Dismiss on outside click without blocking user interactions on other options
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleOutsideClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isOpen]);

  // Listen for custom temp notification events
  useEffect(() => {
    const handleAddTemp = (e: any) => {
      setTempNotifications(prev => [e.detail, ...prev]);
    };
    const handleClearTemp = () => {
      setTempNotifications(prev => prev.filter(n => n.type !== 'unread_message'));
    };
    
    window.addEventListener('add_temp_notification', handleAddTemp);
    window.addEventListener('clear_temp_notifications', handleClearTemp);
    
    return () => {
      window.removeEventListener('add_temp_notification', handleAddTemp);
      window.removeEventListener('clear_temp_notifications', handleClearTemp);
    };
  }, []);

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

  // Combine real and temp notifications for display
  const allNotifications = [...tempNotifications, ...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 2. Realtime listener, background Oracle check & initial load
  useEffect(() => {
    if (!user || !supabase) return;

    fetchNotifications();

    // Trigger background library check at most once every 10 minutes per session
    try {
      const lastChecked = sessionStorage.getItem('oracle_checked_timestamp');
      const now = Date.now();
      if (!lastChecked || now - Number(lastChecked) > 10 * 60 * 1000) {
        sessionStorage.setItem('oracle_checked_timestamp', String(now));
        fetch('/api/oracle').catch(() => {});
      }
    } catch (e) {}

    const channelName = `realtime-notifications-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          fetchNotifications();
          if (payload.eventType === 'INSERT' && payload.new) {
            // Live broadcast to pet mascot in the top nav island
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('shadow-whisper', {
                detail: {
                  id: Date.now(),
                  type: 'info',
                  title: 'New Episode Alert!',
                  message: payload.new.content,
                  link: payload.new.link
                }
              }));
            }

            if (settings?.pushNotifs !== false && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const notif = new window.Notification('Kagemi Alert', {
                  body: payload.new.content || 'New alert received',
                  icon: '/icon.png'
                });
                notif.onclick = () => {
                  window.focus();
                  if (payload.new.link) router.push(payload.new.link);
                };
              } catch (err) {
                console.error('Push notification error:', err);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, settings?.pushNotifs, router]);

  // Guest Traveller Episode Checker (Anikoto Client Sync)
  useEffect(() => {
    if (user || typeof window === 'undefined') return;

    const checkGuestEpisodes = async () => {
      try {
        const localWatchlist = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
        const watching = localWatchlist.filter((item: any) => (item.status === 'watching' || !item.status));
        if (watching.length === 0) return;

        const res = await fetch('/api/anime/airing-today?page=1&perPage=24&releasedOnly=true');
        if (!res.ok) return;
        const json = await res.json();
        const recentEpisodes: any[] = json.data || json.items || [];
        if (!recentEpisodes || recentEpisodes.length === 0) return;

        const notifiedMap = JSON.parse(localStorage.getItem('shadow_guest_notified') || '{}');
        const newTempList: NotificationItem[] = [];

        for (const localItem of watching) {
          const localId = String(localItem.id || localItem.anime_id || '').trim();
          const matchNum = localId.match(/(\d+)$/);
          const numId = matchNum ? matchNum[1] : null;

          const matchedAired = recentEpisodes.find((item: any) => {
            const rawId = String(item.id || '').trim();
            return rawId === localId || (numId && rawId === numId);
          });

          if (!matchedAired) continue;

          const latestEp = Number(matchedAired.episode) || 1;
          const watchedEp = Number(localItem.last_episode_number || localItem.episode || localItem.progress) || 0;
          if (watchedEp >= latestEp) continue;

          const notifyKey = `${localId}-ep-${latestEp}`;
          if (notifiedMap[notifyKey]) continue;

          // Mark notified locally
          notifiedMap[notifyKey] = true;

          newTempList.push({
            id: `temp-${notifyKey}`,
            user_id: 'guest',
            type: 'anime_update',
            content: `New episode (${latestEp}) of "${matchedAired.title || localItem.title || localItem.anime_title}" is now available!`,
            image_url: matchedAired.poster || localItem.poster || localItem.anime_image,
            link: `/watch/${localId}?ep=${latestEp}`,
            is_read: false,
            created_at: new Date().toISOString()
          });

          // Dispatch whisper to mascot!
          window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: {
              id: Date.now(),
              type: 'info',
              title: 'New Episode Alert!',
              message: `Episode ${latestEp} of "${matchedAired.title || localItem.title}" is now available!`,
              link: `/watch/${localId}?ep=${latestEp}`
            }
          }));
        }

        if (newTempList.length > 0) {
          localStorage.setItem('shadow_guest_notified', JSON.stringify(notifiedMap));
          setTempNotifications(prev => [...newTempList, ...prev]);
        }
      } catch (err) {
        console.warn('Guest episode check error:', err);
      }
    };

    // Run 3 seconds after page load so it doesn't block critical rendering
    const timer = setTimeout(checkGuestEpisodes, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  // 3. Mark all notifications as read
  const markAllRead = async () => {
    if (!user || !supabase || allNotifications.length === 0) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setTempNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // 4. Clear all notifications (DELETE SAFELY BY ID)
  const clearAll = async () => {
    if (!user || !supabase || allNotifications.length === 0) return;
    const realIds = notifications.map(n => n.id).filter(Boolean);
    try {
      setNotifications([]);
      setTempNotifications([]);
      if (realIds.length > 0) {
        await supabase
          .from('notifications')
          .delete()
          .in('id', realIds);
      }
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
      setTempNotifications(prev => prev.filter(n => n.id !== id));
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
        setTempNotifications(prev =>
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
      case 'MENTION':
        return <Bell size={14} className="text-red-400" />;
      default:
        return <Bell size={14} className="text-primary-400" />;
    }
  };

  return (
    <div className={cn("relative z-50", unboxed ? "flex items-center justify-center" : "w-full h-full")}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center group transition-all outline-none",
          unboxed
            ? "p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-90"
            : buttonClassName || "w-full h-full rounded-full liquid-glass hover:bg-white/10"
        )}
        title="Notifications"
      >
        <Bell
          size={bellSize}
          className={`relative z-10 transition-colors ${
            isOpen ? 'text-white' : 'text-zinc-400 group-hover:text-white'
          }`}
        />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute min-w-[15px] h-[15px] px-1 bg-primary-600 text-[8.5px] font-black text-white rounded-full flex items-center justify-center border border-[#0c1322] shadow-[0_0_8px_rgba(220,38,38,0.8)] z-20 pointer-events-none leading-none",
            unboxed ? "-top-0.5 -right-0.5" : "-top-1 -right-1"
          )}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Desktop backdrop overlay (dimmed on desktop, hidden on mobile so screen is never darkened) */}
            <div 
              className="hidden md:block fixed inset-0 z-40 bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }} 
            />

            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="fixed top-[52px] sm:top-14 left-2 right-2 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-96 bg-[#0c1322] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-3.5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                    <Bell size={13} className="text-primary-500" /> Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold bg-primary-600/20 text-primary-400 border border-primary-500/30 px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck size={12} /> Mark Read
                    </button>
                  )}
                  {allNotifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto no-scrollbar divide-y divide-white/5">
                {allNotifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Bell size={32} className="opacity-20 stroke-[1.5]" />
                    <p className="text-xs font-bold uppercase tracking-wider">No notifications yet</p>
                    <span className="text-[10px] text-zinc-600">Tracked series alerts and system updates will appear here.</span>
                  </div>
                ) : (
                  allNotifications.map(item => {
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