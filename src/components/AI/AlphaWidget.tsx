"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, X, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { demoness, hunters } from '@/lib/fonts';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Extract state tag [state: <word>] from Alpha's response
function extractStateAndContent(text: string, currentState: string) {
  const stateRegex = /\[state:\s*([a-zA-Z0-9_-]+)\]/i;
  const match = text.match(stateRegex);
  
  let cleanText = text;
  let newState = currentState;

  if (match) {
    newState = match[1].toLowerCase();
    cleanText = text.replace(stateRegex, '').trim();
  }

  // Ensure state matches one of the valid images, fallback to 'relax'
  const validStates = ['bow', 'error', 'explain', 'greet', 'guard', 'relax', 'success', 'surprise', 'think', 'whisper'];
  if (!validStates.includes(newState)) {
    newState = 'relax';
  }

  return { cleanText, newState };
}

export default function AlphaWidget() {
  const { profile } = useAuth();
  const { library } = useUserData();
  const pathname = usePathname();
  const userName = profile?.username || 'Shadow';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('greet');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        {
          role: 'model',
          content: `[state: greet] I am ready for your orders, Master ${userName}. How can I assist you today?`,
        },
      ]);
    }
  }, [userName, messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Global Toggle Event
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    if (typeof window !== 'undefined') {
        window.addEventListener('shadow-toggle-alpha', handleToggle);
    }
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('shadow-toggle-alpha', handleToggle);
        }
    };
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build library summary to provide as context
      const watchlistContext = library.slice(0, 15).map(i => `${i.title} (${i.status})`).join(', ');

      const res = await fetch('/api/alpha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          context: {
             url: pathname,
             watchlist: watchlistContext || 'Empty'
          }
        }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      const rawReply = data.reply || '[state: error] I have nothing to report.';

      setMessages([...newMessages, { role: 'model', content: rawReply }]);

      const { newState } = extractStateAndContent(rawReply, state);
      setState(newState);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'model',
          content: '[state: error] An error occurred in our communications network.',
        },
      ]);
      setState('error');
    } finally {
      setLoading(false);
    }
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const currentMessageContent = lastMessage ? extractStateAndContent(lastMessage.content, state).cleanText : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-0 right-0 md:bottom-8 md:right-8 z-[9999] w-full md:w-auto font-sans pointer-events-none flex flex-col md:flex-row items-end justify-end md:gap-4"
        >
            {/* Chat Box (Left side on desktop, bottom on mobile) */}
            <div className="relative w-full md:w-[400px] max-h-[80vh] rounded-t-[30px] md:rounded-[30px] bg-black/80 backdrop-blur-2xl border border-primary-500/20 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden pointer-events-auto flex flex-col z-20 mb-0 md:mb-4">
                
                {/* Header Section */}
                <div className="p-5 relative z-20 flex flex-col items-start border-b border-white/5 bg-gradient-to-t from-black/50 to-transparent">
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95 text-zinc-400 hover:text-white">
                        <X size={16} />
                    </button>
                    <span className={`text-primary-500 text-[10px] tracking-[0.2em] font-bold uppercase ${hunters.className} mb-1`}>
                        Shadow Garden
                    </span>
                    <span className={`text-3xl text-white leading-none drop-shadow-md ${demoness.className}`}>ALPHA</span>
                </div>

                {/* Dialogue Box */}
                <div className="flex-1 min-h-[250px] max-h-[400px] p-5 overflow-y-auto custom-scrollbar flex flex-col z-20 relative bg-[#050505]/40">
                    <AnimatePresence mode="wait">
                        {lastMessage && lastMessage.role === 'model' && (
                            <motion.div
                                key={lastMessage.content}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full"
                            >
                                <div className="bg-primary-950/40 border border-primary-500/30 rounded-2xl rounded-tl-sm p-4 text-primary-50 text-sm md:text-[15px] leading-relaxed shadow-inner">
                                    <span className="text-primary-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">Alpha</span>
                                    {currentMessageContent}
                                </div>
                            </motion.div>
                        )}
                        {lastMessage && lastMessage.role === 'user' && (
                            <motion.div
                                key={lastMessage.content}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full flex justify-end mt-4"
                            >
                                <div className="bg-zinc-800/80 border border-white/10 rounded-2xl rounded-tr-sm p-4 text-zinc-200 text-sm md:text-[15px] leading-relaxed max-w-[85%]">
                                    {lastMessage.content}
                                </div>
                            </motion.div>
                        )}
                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-primary-500 text-xs font-bold uppercase mt-4 justify-start">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/60 border-t border-white/10 z-20">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Give an order..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-12 text-white placeholder-zinc-500 text-sm outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all shadow-inner"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-full transition-all disabled:opacity-50 disabled:hover:bg-primary-600 active:scale-90"
                        >
                            <Send size={16} className="translate-x-[1px] translate-y-[1px]" />
                        </button>
                    </form>
                </div>

            </div>

            {/* Character Sprite (Right side on desktop, peeking from top on mobile) */}
            <div className="absolute bottom-[40vh] md:relative md:bottom-0 right-4 md:right-0 w-[180px] md:w-[350px] h-[300px] md:h-[550px] pointer-events-none z-10 flex items-end justify-end">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={state}
                        initial={{ opacity: 0, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(4px)' }}
                        transition={{ duration: 0.3 }}
                        src={`/images/alpha/alpha-${state}.png`}
                        alt="Alpha"
                        className="h-full w-full object-contain object-bottom drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        onError={(e) => (e.currentTarget.src = `/images/alpha/alpha-relax.png`)}
                    />
                </AnimatePresence>
            </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
