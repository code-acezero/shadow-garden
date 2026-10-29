"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, Send, Heart } from 'lucide-react';
import PostShareModal from '@/components/Social/PostShareModal';
import MascotPerch from '@/components/Mascot/MascotPerch';
import { playGummyPop } from '@/lib/audioManager';
import { 
  atraxSquishTapVariants, 
  atraxChipTapVariants, 
  atraxJellyWobbleVariants 
} from '@/lib/atraxMotion';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface CuteShareBarProps {
  className?: string;
  badgeText?: string;
  badgeSubtext?: string;
  title?: string;
  description?: string;
  shareUrl?: string;
}

export default function CuteShareBar({
  className,
  badgeText = "Spread The Word",
  badgeSubtext = "Join the Guild",
  title = "Invite your Nakama to Kagemi!",
  description = "Share the sanctuary to unlock watch parties, synchronized playback, and 15,000+ anime & donghua in ultra HD with zero ads.",
  shareUrl,
}: CuteShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [urlToShare, setUrlToShare] = useState('https://kagemi.site');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlToShare(shareUrl || window.location.href);
    }
  }, [shareUrl]);

  const shareTitle = "Kagemi - Next-Gen Anime & Donghua Sanctuary";
  const shareContent = "Stream 15,000+ anime & donghua in ultra HD with 0 ads, join real-time watch rooms, and chat with fellow otakus!";

  const handleCopyLink = async () => {
    playGummyPop(0.35);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToShare);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement("textarea");
        textArea.value = urlToShare;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Sanctuary link copied! Share with your friends 🌸");
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error("Failed to copy link", err);
      toast.error("Could not copy link");
    }
  };

  const directShareButtons = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.023-.474-1.611-.667-2.651-2.298-2.731-2.404-.08-.107-.655-.873-.655-1.666 0-.792.417-1.18.566-1.341.149-.161.326-.201.434-.201.109 0 .218.001.313.006.1.005.234-.038.366.279.135.326.46 1.12.5 1.202.04.081.067.176.014.283-.053.107-.08.175-.16.27-.08.094-.168.21-.24.282-.08.08-.163.167-.07.327.093.16.415.684.891 1.108.614.547 1.132.716 1.292.796.16.08.254.067.348-.041.094-.108.4-.467.507-.628.107-.161.214-.135.361-.081.147.054.933.44 1.093.52.16.081.267.121.307.189.04.068.04.392-.104.797z" />
        </svg>
      ),
      hoverStyle: 'hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_2px_12px_rgba(16,185,129,0.15)]',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + urlToShare)}`
    },
    {
      name: 'Telegram',
      icon: <Send size={13} />,
      hoverStyle: 'hover:border-cyan-500/40 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 shadow-[0_2px_12px_rgba(34,211,238,0.15)]',
      url: `https://t.me/share/url?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'X',
      icon: (
        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      hoverStyle: 'hover:border-white/30 text-zinc-300 bg-white/[0.06] hover:bg-white/[0.12] shadow-[0_2px_12px_rgba(255,255,255,0.06)]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(urlToShare)}`
    }
  ];

  return (
    <section className={cn("w-full px-2 sm:px-4 my-8 md:my-10", className)}>
      <div className="relative rounded-[28px] border border-white/[0.08] hover:border-pink-500/30 bg-gradient-to-r from-[#0d0714] via-[#140b1e]/90 to-[#0d0714] backdrop-blur-xl p-4 sm:p-5 md:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 overflow-hidden transition-all duration-500 group">
        
        {/* Subtle Ambient Backlight Gradients */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* LEFT: Character Duo + Content */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5 w-full lg:w-auto relative z-10">
          
          {/* CUTE DUO PODIUM: Big Miku GIF + Companion Pet Mascot */}
          <div className="relative flex items-center justify-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] shrink-0">
            {/* Ambient Aura under Duo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-purple-500/10 to-cyan-500/20 blur-xl rounded-2xl pointer-events-none" />

            {/* BIG MIKU GIF (With jelly wobble and bouncy sound) */}
            <motion.div
              variants={atraxJellyWobbleVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={() => playGummyPop(0.4)}
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 cursor-pointer flex items-center justify-center select-none"
              title="Click Miku for jelly bounce!"
            >
              <img 
                src="/images/index/sticker-1.gif" 
                alt="Hatsune Miku" 
                className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(244,63,94,0.45)] pointer-events-none" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </motion.div>

            {/* PET MASCOT COMPANION (No messages, No edit gear) */}
            <div className="relative shrink-0 flex items-center justify-center pt-1" title="Interactive Sanctuary Mascot">
              <MascotPerch 
                noMessages={true} 
                noEdit={true} 
                size={54} 
                className="shrink-0 drop-shadow-[0_8px_16px_rgba(34,211,238,0.35)] transition-transform hover:scale-105 active:scale-95" 
              />
            </div>
          </div>

          {/* TEXT HEADINGS */}
          <div className="flex flex-col justify-center max-w-xl">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                <Heart size={10} className="fill-pink-400 text-pink-400" />
                <span>{badgeText}</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">{badgeSubtext}</span>
            </div>

            <h4 className="text-base sm:text-lg md:text-xl font-bold text-white mt-1.5 font-lemon tracking-wide">
              {title}
            </h4>

            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 sm:line-clamp-none font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* RIGHT: JELLY INTERACTIVE SHARING CLUSTER */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto relative z-10 shrink-0">
          
          {/* 1-TAP COPY LINK JELLY BUTTON */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleCopyLink}
            className={cn(
              "h-11 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all duration-300 select-none shadow-md",
              copied 
                ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-900/30"
                : "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-400 text-white border-pink-400/30 shadow-[0_4px_20px_rgba(244,63,94,0.35)]"
            )}
            title="Click to copy page link"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, rotate: 20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="flex items-center gap-1.5 text-white"
                >
                  <Check size={15} className="stroke-[3]" />
                  <span>Copied! 🎉</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="flex items-center gap-1.5"
                >
                  <Copy size={14} className="stroke-[2.5]" />
                  <span>Copy Link</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* DIRECT 1-TAP SOCIAL JELLY CHIPS */}
          <div className="flex items-center gap-1.5">
            {directShareButtons.map((btn) => (
              <motion.a
                key={btn.name}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={atraxChipTapVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={() => playGummyPop(0.3)}
                className={cn(
                  "h-11 w-11 rounded-2xl border border-white/[0.08] flex items-center justify-center transition-all select-none backdrop-blur-sm",
                  btn.hoverStyle
                )}
                title={`Share on ${btn.name}`}
              >
                {btn.icon}
              </motion.a>
            ))}
          </div>

          {/* MORE OPTIONS JELLY TRIGGER (Opens PostShareModal) */}
          <PostShareModal
            customUrl={urlToShare}
            customTitle={shareTitle}
            customContent={shareContent}
            trigger={
              <motion.button
                variants={atraxChipTapVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={() => playGummyPop(0.25)}
                className="h-11 px-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-pink-500/40 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all select-none shadow-sm"
                title="More sharing options & QR code"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">More</span>
              </motion.button>
            }
          />

        </div>

      </div>
    </section>
  );
}
