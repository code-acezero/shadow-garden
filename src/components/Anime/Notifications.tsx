import React, { useState, useEffect } from 'react';
import { Bell, X, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data Structure
interface Notif {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
}

const INITIAL_NOTIFS: Notif[] = [
  { id: 1, title: 'Welcome to Shadow Garden', desc: 'Your ultimate anime journey begins here.', time: 'Just now', type: 'success', read: false },
  { id: 2, title: 'System Upgrade', desc: 'V2 Search Engine is now online.', time: '1h ago', type: 'info', read: false },
  { id: 3, title: 'New Episode', desc: 'Solo Leveling Episode 12 is available.', time: '2h ago', type: 'alert', read: true },
];

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load from LocalStorage or use Initial
  useEffect(() => {
    const saved = localStorage.getItem('shadow_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: Notif) => !n.read).length);
    } else {
      setNotifications(INITIAL_NOTIFS);
      setUnreadCount(INITIAL_NOTIFS.filter(n => !n.read).length);
    }
  }, []);

  // Save updates
  const updateNotifications = (newNotifs: Notif[]) => {
    setNotifications(newNotifs);
    setUnreadCount(newNotifs.filter(n => !n.read).length);
    localStorage.setItem('shadow_notifications', JSON.stringify(newNotifs));
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    updateNotifications(updated);
  };

  const removeNotif = (id: number) => {
    const updated = notifications.filter(n => n.id !== id);
    updateNotifications(updated);
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 group transition-all"
      >
        <div className={`absolute inset-0 bg-primary-600/20 rounded-full transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-0 group-hover:scale-100'}`} />
        <Bell size={20} className={`relative z-10 transition-colors ${isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse border-2 border-[#050505] flex items-center justify-center">
             {/* Optional: Add number inside if needed */}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 md:w-96 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary-900/10 to-transparent">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-white text-sm">Notifications</h3>
                   {unreadCount > 0 && <span className="text-[10px] bg-primary-600 text-white px-1.5 rounded-full">{unreadCount}</span>}
                </div>
                <div className="flex gap-2">
                   <button onClick={markAllRead} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1">
                      <Check size={12} /> Mark read
                   </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                   <div className="p-8 text-center text-gray-500 text-xs">No new notifications</div>
                ) : (
                  notifications.map((item) => (
                    <div 
                      key={item.id} 
                      className={`relative p-4 border-b border-white/5 hover:bg-white/5 transition-colors group ${!item.read ? 'bg-primary-500/5' : ''}`}
                    >
                      <button 
                         onClick={() => removeNotif(item.id)}
                         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity p-1"
                      >
                         <X size={12} />
                      </button>

                      <div className="flex gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!item.read ? 'bg-primary-500 shadow-[0_0_8px_red]' : 'bg-gray-600'}`} />
                        <div>
                          <h4 className={`text-sm ${!item.read ? 'text-white font-bold' : 'text-gray-400 font-medium'}`}>{item.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                          <span className="text-[10px] text-gray-600 mt-2 block font-mono">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}