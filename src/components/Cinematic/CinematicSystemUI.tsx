"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Volume2, VolumeX, ArrowRight, ArrowLeft, 
  Sparkles, CheckCircle2, Crown, Zap, Lock, BookOpen, X
} from 'lucide-react';
import { useCinematicStore, Gender } from '@/store/useCinematicStore';
import { cinematicAudio } from '@/lib/audio/CinematicAudioEngine';

export function CinematicSystemUI() {
  const router = useRouter();
  const {
    currentPhase,
    setPhase,
    gender,
    setGender,
    audioMuted,
    toggleAudioMute,
    permitAudioAndCookies,
    instructionPage,
    setInstructionPage,
    isInstructionsOpen,
    setIsInstructionsOpen,
  } = useCinematicStore();

  // Phase 1 Interstellar Title auto-advance timer to Phase 2
  useEffect(() => {
    if (currentPhase === 1) {
      const timer = setTimeout(() => {
        setPhase(2);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, setPhase]);

  // Phase 8 Whiteout Router Redirect to /home + COMPLETE AUDIO TEARDOWN
  useEffect(() => {
    if (currentPhase === 8) {
      cinematicAudio.stopAllAudio(); // Completely stop all Web Audio nodes & oscillators
      const timer = setTimeout(() => {
        router.push('/home');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, router]);

  const handleGenderSelect = (selectedGender: Gender) => {
    cinematicAudio.playSound('sfx_ui_click');
    setGender(selectedGender);
    setPhase(3); // Start Hyper-Travel & Drone View

    // Auto-advance Phase 3 -> Phase 4 after hyper travel completes
    setTimeout(() => {
      setPhase(4);
    }, 4200);
  };

  const handleEnterTraveler = () => {
    cinematicAudio.playSound('sfx_ui_click');
    setPhase(5); // Start FPV Drop & Confusion

    // Auto-advance Phase 5 -> Phase 6 (The Walk) after 3.2s
    setTimeout(() => {
      setPhase(6);
    }, 3500);
  };

  const handleGatePromptOk = () => {
    cinematicAudio.playSound('sfx_ui_click');
    setPhase(7); // Start Black Hole Suction & Time Tunnel

    // Auto-advance Phase 7 -> Phase 8 (Whiteout & Redirect) after 2.5s
    setTimeout(() => {
      setPhase(8);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden select-none font-sans">
      
      {/* GLOBAL AUDIO MUTE TOGGLE BUTTON (Phases 1-7) */}
      {currentPhase > 0 && currentPhase < 8 && (
        <div className="absolute top-6 right-6 z-50 pointer-events-auto">
          <button
            onClick={() => {
              cinematicAudio.playSound('sfx_ui_click');
              toggleAudioMute();
              cinematicAudio.setMuted(!audioMuted);
            }}
            className="p-3 rounded-full bg-black/60 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900/40 hover:border-purple-400 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center justify-center active:scale-95"
            title={audioMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {audioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 0: MERGED COOKIE & AUDIO PERMISSION GRANT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentPhase === 0 && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.4 }}
              className="relative w-full max-w-lg bg-[#090912]/90 border-2 border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.4)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-pulse" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 block font-mono">SYSTEM PROTOCOL</span>
                  <h2 className="text-xl font-black text-white tracking-wide uppercase">NEURAL SYNC & PERMISSION</h2>
                </div>
              </div>

              <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-mono bg-black/40 p-4 rounded-2xl border border-white/10 my-6">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                  <span><strong>Audio Engine Consent:</strong> Permits 3D spatial sound, cinematic voiceovers, and ambient drones.</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                  <span><strong>Cookie & Session Storage:</strong> Enables progression state saving and preference retention.</span>
                </p>
              </div>

              <button
                onClick={() => {
                  cinematicAudio.playSound('sfx_ui_click');
                  permitAudioAndCookies();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-300/40 transition-all transform active:scale-95 flex items-center justify-center gap-3 group"
              >
                <span>PERMIT AUDIO & NEURAL SYNC</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PHASE 1: INTERSTELLAR MOVIE TITLE OVERLAY */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentPhase === 1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none z-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              className="text-center space-y-4"
            >
              <span className="text-xs md:text-sm font-black tracking-[0.4em] text-purple-400 uppercase font-mono drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]">
                WELCOME TO THE VOID
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 tracking-[0.25em] uppercase font-serif drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                shadow garden
              </h1>
              <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto opacity-75" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PHASE 2: SOLO LEVELING GENDER SELECTION QUEST POPUP */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentPhase === 2 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto z-40 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative w-full max-w-md bg-[#0a0a14]/95 border-2 border-purple-500/60 rounded-3xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.5)] overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-purple-500/20 pb-4">
                <Crown className="w-6 h-6 text-purple-400" />
                <span className="text-xs font-black tracking-[0.2em] text-purple-300 uppercase font-mono">
                  QUEST: SELECT YOUR MONARCH VESSEL
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-6 font-mono text-center">
                Choose your avatar embodiment before neural transportation into the gate.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onMouseEnter={() => cinematicAudio.playSound('sfx_ui_hover')}
                  onClick={() => handleGenderSelect('male')}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                    gender === 'male'
                      ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                      : 'bg-black/40 border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-purple-300" />
                  </div>
                  <span className="text-xs font-black text-white tracking-widest uppercase">MALE</span>
                  <span className="text-[9px] text-purple-400 font-mono">SHADOW HUNTER</span>
                </button>

                <button
                  onMouseEnter={() => cinematicAudio.playSound('sfx_ui_hover')}
                  onClick={() => handleGenderSelect('female')}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                    gender === 'female'
                      ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                      : 'bg-black/40 border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-pink-500/20 border border-pink-400/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-pink-300" />
                  </div>
                  <span className="text-xs font-black text-white tracking-widest uppercase">FEMALE</span>
                  <span className="text-[9px] text-pink-400 font-mono">CELESTIAL MONARCH</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PHASE 4: 3-PAGE INSTRUCTION MANUAL & MAIN LANDING UI (HIGH TOP-DOWN FRONT) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentPhase === 4 && (
          <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-auto z-40 bg-gradient-to-t from-black/80 via-transparent to-black/40">
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
                <span className="text-sm font-black text-white tracking-widest font-mono uppercase">SHADOW GARDEN</span>
              </div>

              <button
                onClick={() => {
                  cinematicAudio.playSound('sfx_ui_click');
                  setIsInstructionsOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-purple-900/40 hover:border-purple-400 transition-all flex items-center gap-2"
              >
                <BookOpen size={14} className="text-purple-400" />
                <span>SYSTEM GUIDE (MANUAL)</span>
              </button>
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-3 my-auto">
              <span className="text-xs font-black tracking-[0.3em] text-cyan-400 uppercase font-mono">
                GATE THRESHOLD REVEALED
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase font-serif drop-shadow-lg">
                THE OPEN ARCHIVES
              </h2>
              <p className="text-xs text-zinc-300 font-mono">
                The open gate stands before you with its swirling black hole. Initiate traveler drop.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto mb-6">
              <button
                onClick={handleEnterTraveler}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_35px_rgba(147,51,234,0.6)] border border-purple-300/40 transition-all transform active:scale-95 flex items-center justify-center gap-3 group"
              >
                <span>ENTER AS A TRAVELER</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  cinematicAudio.playSound('sfx_ui_click');
                  cinematicAudio.stopAllAudio();
                  router.push('/login');
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black/60 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-[0.2em] border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock size={14} className="text-purple-400" />
                <span>SIGN IN / AWAKEN</span>
              </button>
            </div>

            {/* 3-PAGE INSTRUCTION MANUAL MODAL */}
            <AnimatePresence>
              {isInstructionsOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-xl bg-[#0a0a14] border-2 border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.4)]"
                  >
                    <button
                      onClick={() => setIsInstructionsOpen(false)}
                      className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen size={20} className="text-cyan-400" />
                      <span className="text-xs font-black text-cyan-400 font-mono uppercase tracking-widest">
                        SYSTEM MANUAL — PAGE {instructionPage} / 3
                      </span>
                    </div>

                    <div className="min-h-[160px] bg-black/50 p-6 rounded-2xl border border-white/10 text-xs text-zinc-300 font-mono leading-relaxed space-y-3">
                      {instructionPage === 1 && (
                        <>
                          <h4 className="text-sm font-bold text-cyan-300 uppercase">PAGE 1: ARCHIVE LIBRARIES & CATALOGS</h4>
                          <p>Explore over 15,000 anime series, donghua, and Asian dramas in full high-definition streaming with instant portal switching.</p>
                        </>
                      )}
                      {instructionPage === 2 && (
                        <>
                          <h4 className="text-sm font-bold text-cyan-300 uppercase">PAGE 2: CUSTOM PLAYER & STREAMING NODES</h4>
                          <p>Switch seamlessly between server nodes, download episodes for offline viewing, adjust playback speed, and track watched progress.</p>
                        </>
                      )}
                      {instructionPage === 3 && (
                        <>
                          <h4 className="text-sm font-bold text-cyan-300 uppercase">PAGE 3: SOVEREIGN RANKS & COMMUNITY</h4>
                          <p>Awaken your profile level, earn custom frames, post intel reports in the social feed, and chat with fellow agents in the realm.</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <button
                        disabled={instructionPage === 1}
                        onClick={() => setInstructionPage(instructionPage - 1)}
                        className="px-4 py-2 rounded-xl bg-white/5 disabled:opacity-30 text-xs font-bold text-white flex items-center gap-2"
                      >
                        <ArrowLeft size={14} /> PREV
                      </button>

                      <button
                        onClick={() => {
                          if (instructionPage < 3) {
                            setInstructionPage(instructionPage + 1);
                          } else {
                            setIsInstructionsOpen(false);
                          }
                        }}
                        className="px-6 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                        {instructionPage < 3 ? 'NEXT' : 'GOT IT'} <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PHASE 6: THE CONFIRMATION PROMPT ("Are you sure you want to enter...") */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentPhase === 6 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto z-40 bg-black/30">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="relative w-full max-w-md bg-[#0a0a14]/95 border-2 border-rose-500/60 rounded-3xl p-8 shadow-[0_0_60px_rgba(244,63,94,0.5)] text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400 mx-auto flex items-center justify-center">
                <Crown size={28} className="text-rose-400" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-rose-400 font-mono tracking-[0.25em] uppercase">SYSTEM CONFIRMATION</span>
                <h3 className="text-lg font-black text-white tracking-wide uppercase">
                  Are you sure you want to enter the world of shadow garden?
                </h3>
              </div>

              <button
                onClick={handleGatePromptOk}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_35px_rgba(244,63,94,0.6)] border border-rose-300/40 transition-all transform active:scale-95"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PHASE 8: WHITEOUT FLASH & ARRIVAL ROUTER REDIRECT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentPhase === 8 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.0 }}
              className="space-y-3 font-mono"
            >
              <span className="text-xs font-black text-purple-900 tracking-[0.3em] uppercase">
                DIMENSIONAL WORMHOLE TRAVERSED
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight uppercase font-serif">
                Destination reached.
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
