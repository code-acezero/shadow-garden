"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint } from "lucide-react";
import { playVoice } from "@/lib/voice"; // Re-using your existing voice logic
import { usePathname } from "next/navigation";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on the landing page — it has its own interaction gate
    if (pathname === "/") return;

    // Check both keys: guild_audio_permit (this modal) or shadow_audio_permitted (set by landing)
    const hasPermit =
      localStorage.getItem("guild_audio_permit") === "true" ||
      localStorage.getItem("shadow_audio_permitted") === "true";

    if (!hasPermit) {
      setIsOpen(true);
    }
  }, [pathname]);

  const handleGrant = async () => {
    try {
      // 1. Save audio permissions
      localStorage.setItem("guild_audio_permit", "true");
      localStorage.setItem("shadow_audio_permitted", "true");
      
      // 2. Automatically activate default telepathy voice pack ('Alpha')
      const currentSettings = localStorage.getItem("shadow_voice_settings");
      if (!currentSettings) {
        localStorage.setItem("shadow_voice_settings", JSON.stringify({ pack: 'Alpha', language: 'en', enabled: true }));
      } else {
        try {
          const parsed = JSON.parse(currentSettings);
          parsed.enabled = true;
          if (!parsed.pack) parsed.pack = 'Alpha';
          localStorage.setItem("shadow_voice_settings", JSON.stringify(parsed));
        } catch {
          localStorage.setItem("shadow_voice_settings", JSON.stringify({ pack: 'Alpha', language: 'en', enabled: true }));
        }
      }

      // 3. Unlock browser Web Audio API context
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
        }
      }

      // 4. Play standard welcome voice immediately inside click handler to unblock audio
      playVoice('WELCOME'); 

      // 5. Close modal
      setIsOpen(false);
      
    } catch (e) {
      console.error("Audio unlock failed", e);
      setIsOpen(false); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4"
        >
          {/* Main Card */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm sm:max-w-md bg-[#080c14]/95 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-2xl"
          >
            {/* Decorative "Scanner" Line */}
            <motion.div 
              initial={{ top: 0 }}
              animate={{ top: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-[1px] bg-white/20 shadow-[0_0_10px_white]"
            />

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/80">
                <Fingerprint size={24} />
            </div>

            {/* Title */}
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
              Guild Needs Access to Play Audio
            </h2>

            {/* Text */}
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-6">
              Please allow the <span className="text-white font-bold">Guild Receptionist</span> to welcome you.
            </p>

            {/* Button */}
            <button 
              onClick={handleGrant}
              className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-transform active:scale-95"
            >
              Grant Access
            </button>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}