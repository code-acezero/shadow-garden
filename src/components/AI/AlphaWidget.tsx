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
            <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between px-4 md:px-12 pointer-events-none pb-[15vh] md:pb-0">
                
                {/* Speech Bubble (Left Side) */}
                <div className="relative w-full md:w-[50%] lg:w-[45%] z-20 pointer-events-auto mb-12 md:mb-[30vh]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentMessageContent}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full"
                        >
                            {/* Hexagon Name Tag */}
                            <div className="absolute -top-5 left-8 z-30 drop-shadow-md">
                                <div 
                                    className="bg-[#2A4489] text-white px-10 py-1 font-semibold tracking-wider flex items-center justify-center border border-[#6D91E5] text-lg"
                                    style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
                                >
                                    Alpha
                                </div>
                            </div>

                            {/* Main Bubble */}
                            <div className="relative bg-[#F4F6FB] border-[4px] border-[#2A4489] rounded-2xl p-6 md:p-8 min-h-[180px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                {loading ? (
                                    <div className="flex items-center gap-3 text-[#2A4489] font-bold h-full">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing order...
                                    </div>
                                ) : (
                                    <div className="text-black font-medium text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                                        {currentMessageContent}
                                    </div>
                                )}

                                {/* Tail pointing right */}
                                <div className="hidden md:block absolute top-1/2 -right-[24px] transform -translate-y-1/2 w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-l-[26px] border-l-[#2A4489]">
                                    <div className="absolute -top-[16px] -left-[27px] w-0 h-0 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent border-l-[21px] border-l-[#F4F6FB]" />
                                </div>
                                {/* Tail pointing down (mobile) */}
                                <div className="block md:hidden absolute -bottom-[24px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[26px] border-t-[#2A4489]">
                                    <div className="absolute -top-[27px] -left-[16px] w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[21px] border-t-[#F4F6FB]" />
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Character Sprite (Right Side) */}
                <div className="absolute bottom-0 right-0 md:relative md:w-[50%] lg:w-[45%] h-[50vh] md:h-[85vh] z-10 flex items-end justify-center md:justify-end">
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

            {/* Bottom Input Area */}
            <div className="absolute bottom-6 md:bottom-12 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-40 pointer-events-auto">
                <div className="bg-[#1A1E24]/90 backdrop-blur-md border-[3px] border-[#4DAF8C]/60 rounded-xl p-4 shadow-[0_0_30px_rgba(77,175,140,0.15)] relative">
                    
                    {/* Glowing Accent */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[#4DAF8C] opacity-80 pointer-events-none">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                        </svg>
                    </div>

                    <div className="text-[#E0E0E0] text-sm font-semibold tracking-[0.1em] mb-2 pl-1">
                        IDENTIFIER CODE:
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="relative flex">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-[#2A2E35] border border-white/10 rounded-md py-3 pl-4 pr-14 text-white text-base outline-none focus:border-[#4DAF8C]/80 transition-colors shadow-inner"
                            disabled={loading}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#4DAF8C] hover:text-[#3d9173] disabled:opacity-50 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
