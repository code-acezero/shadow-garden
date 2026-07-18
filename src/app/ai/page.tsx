"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { demoness, hunters } from '@/lib/fonts';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Maps emotion + pose to a sprite image path.
// Replace these with your actual character sprite images.
function getSpriteUrl(emotion: string, pose: string) {
  // For now we use a text placeholder. Swap this with real images like:
  // return `/images/alpha-${emotion}-${pose}.png`;
  const label = emotion + ' ' + pose;
  return `https://placehold.co/400x700/0a0a0a/a855f7?font=montserrat&text=Alpha%0A%5B${encodeURIComponent(label)}%5D`;
}

export default function AlphaAI() {
  const router = useRouter();
  const { profile } = useAuth();
  const userName = profile?.username || 'Shadow';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [pose, setPose] = useState('standing');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting on mount
  useEffect(() => {
    setMessages([
      {
        role: 'model',
        content: `[state: neutral, pose: standing] I am ready for your orders, Master ${userName}. What is our next move?`,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractStateAndContent = (text: string) => {
    const stateRegex = /\[state:\s*([a-zA-Z0-9_-]+),\s*pose:\s*([a-zA-Z0-9_-]+)\]/i;
    const match = text.match(stateRegex);

    let cleanText = text;
    let newEmotion = emotion;
    let newPose = pose;

    if (match) {
      newEmotion = match[1].toLowerCase();
      newPose = match[2].toLowerCase();
      cleanText = text.replace(stateRegex, '').trim();
    }

    return { cleanText, newEmotion, newPose };
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/alpha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      const rawReply =
        data.reply || '[state: neutral, pose: standing] I have nothing to report.';

      setMessages([...newMessages, { role: 'model', content: rawReply }]);

      const { newEmotion, newPose } = extractStateAndContent(rawReply);
      setEmotion(newEmotion);
      setPose(newPose);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'model',
          content:
            '[state: angry, pose: standing] An error occurred in our communications network.',
        },
      ]);
      setEmotion('angry');
      setPose('standing');
    } finally {
      setLoading(false);
    }
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const currentMessageContent =
    lastMessage ? extractStateAndContent(lastMessage.content).cleanText : '';

  const spriteUrl = getSpriteUrl(emotion, pose);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[99999] overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 via-transparent to-black pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url('/images/noise.png')" }}
      />

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <button
          onClick={() => router.back()}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white backdrop-blur-md transition-all active:scale-95 shadow-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center flex flex-col items-center">
          <span className={`text-primary-500 text-xs tracking-[0.3em] font-bold uppercase ${hunters.className}`}>
            Shadow Garden
          </span>
          <span className={`text-3xl text-white leading-none ${demoness.className}`}>ALPHA</span>
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.25em] mt-0.5">
            The First Shadow
          </span>
        </div>
        <div className="w-11" />
      </div>

      {/* Character Sprite Container */}
      <div className="absolute inset-0 flex justify-center items-end pb-[28vh] pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={`${emotion}-${pose}`}
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            src={spriteUrl}
            alt="Alpha"
            className="h-[55vh] md:h-[65vh] object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.25)] select-none"
          />
        </AnimatePresence>
      </div>

      {/* Emotion State Badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${emotion}-${pose}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="absolute left-6 bottom-[30vh] hidden md:flex flex-col gap-1 z-40"
        >
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">State</div>
          <div className="bg-primary-900/50 border border-primary-500/20 rounded-xl px-3 py-1.5 text-primary-400 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
            {emotion}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-zinc-400 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
            {pose}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Chat Interface Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col items-center z-50 bg-gradient-to-t from-black via-black/70 to-transparent pt-40">
        <div className="w-full max-w-3xl relative">
          {/* Alpha's Dialogue Bubble */}
          <AnimatePresence mode="wait">
            {lastMessage && lastMessage.role === 'model' && (
              <motion.div
                key={lastMessage.content}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mb-5 relative"
              >
                {/* Alpha Name Tag */}
                <div className="absolute -top-4 left-6 z-10">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary-900/60 border border-primary-400/40">
                    Alpha
                  </div>
                </div>
                {/* Dialogue Box */}
                <div className="bg-black/70 backdrop-blur-2xl border border-white/10 border-t-2 border-t-primary-500/60 rounded-3xl p-6 md:p-8 pt-10 shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
                  {/* Decorative bg */}
                  <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
                    <ShieldAlert size={120} />
                  </div>
                  {loading && (
                    <div className="flex items-center gap-3 text-primary-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm italic">Alpha is processing...</span>
                    </div>
                  )}
                  {!loading && (
                    <p className="text-white text-base md:text-lg leading-relaxed relative z-10">
                      {currentMessageContent}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 shadow-2xl focus-within:border-primary-500/40 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Give your orders, Master..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-600 text-sm md:text-base font-medium"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-900/50 active:scale-95"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
