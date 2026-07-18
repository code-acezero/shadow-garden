"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, X } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        {
          role: 'model',
          content: `[state: greet] Welcome, integration candidate. I am Alpha, your primary guide through the Shadow Garden systems.\n\nGive me an order below, and let us commence.`,
        },
      ]);
    }
  }, [userName, messages.length, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
      const watchlistContext = library.slice(0, 15).map(i => `${i.title} (${i.status})`).join(', ');

      const res = await fetch('/api/alpha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          context: {
             url: pathname,
             watchlist: watchlistContext || 'Empty',
             userName: profile?.username || 'Guest',
             email: profile?.email || ''
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

  const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
  const currentMessageContent = lastModelMessage ? extractStateAndContent(lastModelMessage.content, state).cleanText : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center font-sans"
        >
            {/* Dimmed Overlay */}
            <div 
                className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[2px] cursor-pointer" 
                onClick={() => setIsOpen(false)}
            />

            {/* Close Button Top Right */}
            <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-6 right-6 p-3 bg-black/50 border border-white/10 hover:bg-white/10 hover:text-white rounded-md text-zinc-400 transition-all z-50 backdrop-blur-md"
            >
                <X size={24} />
            </button>

            {/* Main Visual Novel Container */}
            <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-center md:justify-end px-4 md:px-12 pointer-events-none pb-[25vh] md:pb-0">
                
                {/* Speech Bubble (Left Side of Alpha) */}
                <div className="relative w-full md:w-[450px] z-20 pointer-events-auto mb-12 md:mb-[40vh] md:-mr-[5%] xl:-mr-[10%] flex-shrink-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentMessageContent}
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full"
                        >
                            {/* Hexagon Name Tag */}
                            <div className="absolute -top-5 left-6 z-30 drop-shadow-md">
                                <div 
                                    className="bg-orange-600 text-white px-8 py-1 font-black tracking-[0.2em] uppercase flex items-center justify-center border border-orange-400 text-sm shadow-[0_0_15px_rgba(234,88,12,0.5)]"
                                    style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
                                >
                                    Alpha
                                </div>
                            </div>

                            {/* Main Bubble */}
                            <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md border-[2px] border-orange-600/50 rounded-2xl p-6 min-h-[140px] shadow-[0_10px_40px_rgba(0,0,0,0.8)] shadow-orange-900/20">
                                {loading ? (
                                    <div className="flex items-center gap-3 text-orange-500 font-bold h-full">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing order...
                                    </div>
                                ) : (
                                    <div className="text-zinc-200 font-medium text-base md:text-lg leading-relaxed whitespace-pre-wrap font-sans">
                                        {currentMessageContent}
                                    </div>
                                )}

                                {/* Tail pointing right */}
                                <div className="hidden md:block absolute top-1/2 -right-[16px] transform -translate-y-1/2 w-0 h-0 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-l-[16px] border-l-orange-600/50">
                                    <div className="absolute -top-[12px] -left-[18px] w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[14px] border-l-[#0a0a0a]" />
                                </div>
                                {/* Tail pointing down (mobile) */}
                                <div className="block md:hidden absolute -bottom-[16px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[16px] border-t-orange-600/50">
                                    <div className="absolute -top-[18px] -left-[12px] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-[#0a0a0a]" />
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Character Sprite (Right Side) */}
                <div className="absolute bottom-0 right-0 md:relative md:w-auto h-[60vh] md:h-[100vh] z-10 flex items-end justify-center md:justify-end scale-[1.1] md:scale-[1.15] origin-bottom pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={state}
                            initial={{ opacity: 0, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, filter: 'blur(5px)' }}
                            transition={{ duration: 0.3 }}
                            src={`/images/alpha/alpha-${state}.png`}
                            alt="Alpha"
                            className="h-full object-contain object-bottom drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
                            onError={(e) => (e.currentTarget.src = `/images/alpha/alpha-relax.png`)}
                        />
                    </AnimatePresence>
                </div>

            </div>

            {/* Bottom Input Area (Under Alpha) */}
            <div className="absolute bottom-6 right-6 md:right-12 w-[calc(100%-48px)] md:w-[380px] z-40 pointer-events-auto">
                <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 border-t-orange-500/30 rounded-xl p-3 shadow-[0_0_30px_rgba(234,88,12,0.1)] relative">
                    
                    <div className="text-zinc-500 text-[10px] font-black tracking-[0.2em] mb-2 pl-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        IDENTIFIER CODE
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="relative flex">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 pl-4 pr-12 text-white text-sm outline-none focus:border-orange-500/50 transition-colors shadow-inner"
                            disabled={loading}
                            autoComplete="off"
                            placeholder="Awaiting orders..."
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:text-white disabled:opacity-30 transition-colors active:scale-90"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
