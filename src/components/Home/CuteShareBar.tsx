"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, Send } from 'lucide-react';
import PostShareModal from '@/components/Social/PostShareModal';
import { MascotPerch, MASCOT_ROSTER } from '@/components/Mascot/MascotPerch';
import { playGummyPop } from '@/lib/audioManager';
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
  badgeSubtext,
  title = "Share Kagemi with your friends",
  description = "Stream anime, donghua, and cinema together with synchronized rooms & zero ads.",
  shareUrl,
}: CuteShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [urlToShare, setUrlToShare] = useState('https://kagemi.site');
  const [randomPetId, setRandomPetId] = useState<string>('fox');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlToShare(shareUrl || window.location.href);
      // Pick a random pet from roster on every reload
      if (MASCOT_ROSTER && MASCOT_ROSTER.length > 0) {
        const randomIndex = Math.floor(Math.random() * MASCOT_ROSTER.length);
        setRandomPetId(MASCOT_ROSTER[randomIndex].id);
      }
    }
  }, [shareUrl]);

  const shareTitle = "Kagemi - Watch Anime & Donghua in HD";
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
      toast.success("Link copied! Share with your friends 🌸");
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
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
      hoverStyle: 'text-emerald-400 bg-white/[0.04] hover:bg-emerald-500/15',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + urlToShare)}`
    },
    {
      name: 'Telegram',
      icon: <Send size={13} />,
      hoverStyle: 'text-cyan-400 bg-white/[0.04] hover:bg-cyan-500/15',
      url: `https://t.me/share/url?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'X',
      icon: (
        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      hoverStyle: 'text-zinc-300 bg-white/[0.04] hover:bg-white/[0.1]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(urlToShare)}`
    }
  ];

  return (
    <section className={cn("w-full px-2 sm:px-4 my-8 md:my-10 select-none", className)}>
      <div className="w-full py-6 md:py-8 flex items-center justify-between gap-4 md:gap-8">
        
        {/* LEFT CORNER: Miku GIF */}
        <div className="w-16 sm:w-20 md:w-24 shrink-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => playGummyPop(0.35)}
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 cursor-pointer flex items-center justify-center select-none"
            title="Hatsune Miku"
          >
            <img 
              src="/images/index/sticker-1.gif" 
              alt="Hatsune Miku" 
              className="w-full h-full object-contain pointer-events-none" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </motion.div>
        </div>

        {/* CENTER: Clean, Professional, Perfectly Symmetrical Share Content */}
        <div className="flex-1 min-w-0 flex flex-col items-center text-center max-w-xl mx-auto px-2">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">
            {badgeText}
          </span>

          <h4 className="text-base sm:text-lg md:text-xl font-bold text-white mt-1 font-lemon tracking-wide">
            {title}
          </h4>

          <p className="text-xs text-zinc-400 mt-1 max-w-md font-medium leading-relaxed">
            {description}
          </p>

          {/* Symmetrical Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {/* Copy Link Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleCopyLink}
              className={cn(
                "h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer shadow-none",
                copied 
                  ? "bg-emerald-600 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              )}
            >
              {copied ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="stroke-[2.5]" />
                  <span>Copy Link</span>
                </>
              )}
            </motion.button>

            {/* Direct Social Buttons */}
            <div className="flex items-center gap-1.5">
              {directShareButtons.map((btn) => (
                <motion.a
                  key={btn.name}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.08 }}
                  onClick={() => playGummyPop(0.25)}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
                    btn.hoverStyle
                  )}
                  title={`Share on ${btn.name}`}
                >
                  {btn.icon}
                </motion.a>
              ))}

              <PostShareModal
                customUrl={urlToShare}
                customTitle={shareTitle}
                customContent={shareContent}
                trigger={
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.08 }}
                    onClick={() => playGummyPop(0.2)}
                    className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="More sharing options & QR code"
                  >
                    <Share2 size={13} />
                    <span className="text-[11px]">More</span>
                  </motion.button>
                }
              />
            </div>
          </div>
        </div>

        {/* RIGHT CORNER: Random Interactive Pet Companion */}
        <div className="w-16 sm:w-20 md:w-24 shrink-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer select-none"
            title="Random Companion Pet"
          >
            <MascotPerch 
              noMessages={true} 
              noEdit={true} 
              size={52} 
              overrideCharacterId={randomPetId}
              className="shrink-0"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
