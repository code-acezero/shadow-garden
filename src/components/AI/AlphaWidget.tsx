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
          className="fixed bottom-20 md:bottom-24 right-4 md:right-8 z-[9999] w-[90vw] md:w-[420px] max-w-full font-sans pointer-events-none"
        >
            <div className="relative w-full rounded-[30px] bg-black/80 backdrop-blur-2xl border border-primary-500/20 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-visible pointer-events-auto flex flex-col">
                
                {/* Character Sprite Overflowing Top */}
                <div className="absolute -top-32 md:-top-40 left-1/2 -translate-x-1/2 h-[220px] md:h-[260px] pointer-events-none z-10 flex items-end justify-center">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={state}
                            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                            transition={{ duration: 0.3 }}
                            src={`/images/alpha/alpha-${state}.png`}
                            alt="Alpha"
                            className="h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                            onError={(e) => (e.currentTarget.src = `/images/alpha/alpha-relax.png`)}
                        />
                    </AnimatePresence>
                </div>

                {/* Header Section */}
                <div className="pt-24 md:pt-28 pb-4 px-6 relative z-20 flex flex-col items-center border-b border-white/5 bg-gradient-to-t from-black/50 to-transparent rounded-t-[30px]">
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95 text-zinc-400 hover:text-white">
                        <X size={16} />
                    </button>
                    <div className="absolute top-4 left-4 p-1.5 bg-primary-500/20 text-primary-400 rounded-full">
                        <Bot size={16} />
                    </div>
                    <span className={`text-primary-500 text-[10px] tracking-[0.2em] font-bold uppercase ${hunters.className} mb-1`}>
                        Shadow Garden
                    </span>
                    <span className={`text-3xl text-white leading-none drop-shadow-md ${demoness.className}`}>ALPHA</span>
                </div>

                {/* Dialogue Box */}
                <div className="flex-1 min-h-[140px] max-h-[300px] p-5 overflow-y-auto custom-scrollbar flex flex-col z-20 relative bg-[#050505]/40">
                    <AnimatePresence mode="wait">
                        {lastMessage && lastMessage.role === 'model' && (
                            <motion.div
                                key={lastMessage.content}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full"
                            >
                                <div className="bg-primary-950/40 border border-primary-500/30 rounded-2xl p-4 text-primary-50 text-sm md:text-[15px] leading-relaxed shadow-inner">
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
                                className="w-full flex justify-end"
                            >
                                <div className="bg-zinc-800/80 border border-white/10 rounded-2xl p-4 text-zinc-200 text-sm md:text-[15px] leading-relaxed max-w-[85%]">
                                    {lastMessage.content}
                                </div>
                            </motion.div>
                        )}
                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-primary-500 text-xs font-bold uppercase mt-4 justify-center">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/60 rounded-b-[30px] border-t border-white/10 z-20">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
