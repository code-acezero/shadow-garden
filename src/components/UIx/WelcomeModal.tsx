"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { playVoice } from "@/lib/voice"; // Re-using your existing voice logic

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if we already have permission
    const hasPermit = localStorage.getItem("guild_audio_permit");
    
    // 2. If not, show the modal immediately
    if (!hasPermit) {
      setIsOpen(true);
    }
  }, []);

  const handleGrant = async () => {
    try {
      // 3. The Magic: Playing audio inside a click handler unlocks the browser
      // We play the standard welcome voice immediately upon click
      await playVoice('WELCOME'); 

      // 4. Save the permit forever
      localStorage.setItem("guild_audio_permit", "true");
      
      // 5. Close the gate
      setIsOpen(false);
      
    } catch (e) {
      console.error("Audio unlock failed", e);
      // Even if it fails, we close it to not block the user, 
      // but usually, a click event is enough to satisfy Chrome.
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          {/* Main Card */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-[90%] max-w-[320px] bg-[#050505] border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
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