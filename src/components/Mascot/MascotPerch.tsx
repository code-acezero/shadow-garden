"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Volume2, VolumeX, Shuffle, Settings2, X, Check, Heart, Shield, Wand2, Cat, Cpu, Flame, Smile, PawPrint } from 'lucide-react';
import PageMascot, { MascotReaction } from './PageMascot';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MascotCharacter {
  id: string;
  name: string;
  title: string;
  icon: string;
  supportedStyles?: string[];
  quotes: string[];
}

export const MASCOT_ROSTER: MascotCharacter[] = [
  {
    id: 'fox',
    name: 'Kitsune',
    title: 'Shadow Spirit',
    icon: '🦊',
    supportedStyles: ['color', 'pixel', 'ink', 'sketch', 'riso', 'paper'],
    quotes: [
      "I am Atomic... kitsune edition!",
      "Spotted your cursor! Whatcha watching?",
      "Shadow Garden's fluffiest agent!",
      "Boop received! +50 Shadow Mana!",
      "Nine tails, zero regrets!",
    ],
  },
  {
    id: 'cat',
    name: 'Kage',
    title: 'Shadow Familiar',
    icon: '🐱',
    quotes: [
      "Meow~ Watching from the shadows!",
      "Did somebody say streaming marathon?",
      "Purr... poking me won't pause the video!",
      "Master, your next episode awaits!",
      "Kage bunshin no jutsu!",
    ],
  },
  {
    id: 'knight',
    name: 'Paladin',
    title: 'Order Guardian',
    icon: '🛡️',
    quotes: [
      "Shields ready, Master!",
      "Guarding your watchlist with my life!",
      "A true warrior never skips the intro!",
      "By the solemn oath of Shadow Garden!",
      "Honor! Glory! High-bitrate streaming!",
    ],
  },
  {
    id: 'wizard',
    name: 'Mage',
    title: 'Dark Sorcerer',
    icon: '🧙',
    quotes: [
      "Casting spell: Infinite Anime!",
      "Arcane frequency stabilized!",
      "Abracadabra... boop!",
      "The mana flows through your clicks!",
      "Knowledge is power. Anime is life.",
    ],
  },
  {
    id: 'drone',
    name: 'Scout-07',
    title: 'Cyber Recon',
    icon: '🛸',
    quotes: [
      "BEEP BOOP. Otaku detected.",
      "Scanning perimeter... all streams clear.",
      "Recon flight path locked to cursor.",
      "System firmware: Shadow OS v2.4.",
      "Thermal signatures nominal. Nice click!",
    ],
  },
  {
    id: 'panda',
    name: 'Bao',
    title: 'Zen Master',
    icon: '🐼',
    quotes: [
      "Zen mode engaged... chill and watch.",
      "Bamboo snacks ready for the season finale!",
      "Slow down, traveler. Breathe and enjoy.",
      "Big soft hugs from the shadows!",
    ],
  },
  {
    id: 'frog',
    name: 'Shinobi',
    title: 'Ninja Amphibian',
    icon: '🐸',
    quotes: [
      "Ribbit! Stealth mode activated!",
      "Leaping across your screen!",
      "Secret ninja art: Instant Stream!",
      "You cannot catch the ninja frog!",
    ],
  },
  {
    id: 'dino',
    name: 'Rex',
    title: 'Chibi Kaiju',
    icon: '🦖',
    quotes: [
      "Rawr! (That means I like anime!)",
      "Tiny arms, huge love for cinema!",
      "Kaiju power roaring within!",
      "Don't extinguish my watch party!",
    ],
  },
];

export const STYLE_OPTIONS = [
  { id: 'color', label: 'Vibrant Color', suffix: '' },
  { id: 'pixel', label: 'Retro Pixel', suffix: '-pixel' },
  { id: 'ink', label: 'Manga Ink', suffix: '-ink' },
  { id: 'sketch', label: 'Storyboard Sketch', suffix: '-sketch' },
  { id: 'riso', label: 'Two-Tone Riso', suffix: '-riso' },
  { id: 'paper', label: 'Paper Craft', suffix: '-paper' },
];

interface MascotConfig {
  characterId: string;
  styleId: string;
  soundEnabled: boolean;
  hidden: boolean;
}

const DEFAULT_CONFIG: MascotConfig = {
  characterId: 'fox',
  styleId: 'color',
  soundEnabled: true,
  hidden: false,
};

export const MascotPerch: React.FC<{ className?: string }> = ({ className }) => {
  const [config, setConfig] = useState<MascotConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved config
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('shadow_mascot_config');
      if (saved) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save config
  const updateConfig = (patch: Partial<MascotConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('shadow_mascot_config', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const currentCharacter = useMemo(() => {
    return MASCOT_ROSTER.find((c) => c.id === config.characterId) || MASCOT_ROSTER[0];
  }, [config.characterId]);

  // Compute sprite sheet paths
  const { directionsPath, reactionsPath } = useMemo(() => {
    const char = currentCharacter;
    let filePrefix = char.id;

    // Apply style if supported
    if (char.supportedStyles && char.supportedStyles.includes(config.styleId)) {
      const styleMeta = STYLE_OPTIONS.find((s) => s.id === config.styleId);
      if (styleMeta && styleMeta.suffix) {
        filePrefix = `${char.id}${styleMeta.suffix}`;
      }
    }

    return {
      directionsPath: `/mascots/${filePrefix}-directions.webp`,
      reactionsPath: `/mascots/${filePrefix}-reactions.webp`,
    };
  }, [currentCharacter, config.styleId]);

  // Say something cute in the speech bubble
  const triggerSpeech = (customText?: string) => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    const text = customText || currentCharacter.quotes[Math.floor(Math.random() * currentCharacter.quotes.length)];
    setSpeech(text);
    bubbleTimerRef.current = setTimeout(() => {
      setSpeech(null);
    }, 3800);
  };

  const handleBoop = (info: { count: number; reaction: MascotReaction | null; isDizzy: boolean }) => {
    if (info.isDizzy) {
      triggerSpeech("Woah... dizzy! @~@ (too fast!)");
    } else if (info.reaction === 'heart') {
      triggerSpeech("Heart eyes! You're awesome! ❤️");
    } else if (info.reaction === 'sparkle') {
      triggerSpeech("Sparkle surge! ✨");
    } else {
      triggerSpeech();
    }
  };

  // Occasional random friendly quip
  useEffect(() => {
    if (!mounted || config.hidden) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.65) {
        triggerSpeech();
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [mounted, config.hidden, currentCharacter]);

  if (!mounted || config.hidden) {
    return (
      <div className={cn("hidden md:flex items-center", className)}>
        {/* Unhide button when hidden */}
        {mounted && config.hidden && (
          <button
            onClick={() => updateConfig({ hidden: false })}
            title="Summon Page Mascot"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 hover:border-cyan-400/40 text-[10px] text-zinc-400 hover:text-white transition-all pointer-events-auto"
          >
            <span>🐾 Mascot</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative pointer-events-auto flex items-center select-none group", className)}>
      {/* SPEECH BUBBLE (Floats below mascot for guaranteed viewport visibility) */}
      <AnimatePresence>
        {speech && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-[120] pointer-events-none whitespace-nowrap"
          >
            <div className="relative px-3.5 py-1.5 rounded-[22px] bg-[#0c1322] border border-cyan-400/50 shadow-[0_12px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white text-[11px] font-bold tracking-tight flex items-center gap-1.5">
              <span className="text-cyan-400 font-black">{currentCharacter.icon}</span>
              <span>{speech}</span>
              {/* Little Speech Bubble Arrow pointing UP */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0c1322] border-l border-t border-cyan-400/50 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MASCOT BUTTON & SPRITE IN ATRAX-UI MONET POD */}
      <div className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#0c1322] border border-white/[0.14] hover:border-cyan-400/60 shadow-[0_10px_25px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.18)] transition-all atrax-bubbly-btn atrax-squish-tap">
        {/* Subtle glowing halo on hover */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10" />

        <PageMascot
          directions={directionsPath}
          reactions={reactionsPath}
          size={40}
          label={currentCharacter.name}
          enableSound={config.soundEnabled}
          onBoop={handleBoop}
          className="transition-transform active:scale-95"
        />

        {/* Mini quick-gear dropdown trigger */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#141d30] border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500 hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-20 active:scale-95 atrax-squish-tap"
              title="Customize Mascot"
            >
              <Settings2 size={9} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={8}
            className="w-56 bg-[#0c1322] border border-white/15 rounded-[24px] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] z-[150] text-zinc-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-1.5 px-1">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400">
                <PawPrint size={13} className="text-cyan-400" />
                <span>Page Companion</span>
              </div>
              <button
                onClick={() => updateConfig({ hidden: true })}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-tight px-1.5 py-0.5 rounded hover:bg-white/5"
                title="Hide mascot"
              >
                Hide
              </button>
            </div>

            {/* Character Selector */}
            <DropdownMenuLabel className="text-[10px] font-black uppercase text-zinc-400 tracking-wider px-1 py-1">
              Choose Character
            </DropdownMenuLabel>
            <div className="grid grid-cols-4 gap-1 p-1">
              {MASCOT_ROSTER.map((char) => {
                const isSelected = char.id === currentCharacter.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => {
                      updateConfig({ characterId: char.id });
                      triggerSpeech(`Hello! I'm ${char.name}!`);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-1.5 rounded-xl border text-xs transition-all",
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    )}
                    title={`${char.name} (${char.title})`}
                  >
                    <span className="text-base leading-none mb-1">{char.icon}</span>
                    <span className="text-[8.5px] font-bold truncate max-w-full">{char.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Style Selector (for Fox / Kitsune) */}
            {currentCharacter.supportedStyles && (
              <>
                <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-zinc-400 tracking-wider px-1 py-1">
                  Art Style
                </DropdownMenuLabel>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {STYLE_OPTIONS.filter((s) => currentCharacter.supportedStyles?.includes(s.id)).map((st) => {
                    const isStyleActive = config.styleId === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => updateConfig({ styleId: st.id })}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tight border transition-all text-center truncate",
                          isStyleActive
                            ? "bg-cyan-500 text-black border-cyan-400 font-black"
                            : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white"
                        )}
                      >
                        {st.label.replace('Vibrant ', '').replace('Retro ', '')}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />

            {/* Sound Toggle */}
            <DropdownMenuItem
              onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
              className="flex items-center justify-between px-2 py-1.5 rounded-xl text-[11px] font-bold text-zinc-300 hover:bg-white/5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {config.soundEnabled ? <Volume2 size={13} className="text-cyan-400" /> : <VolumeX size={13} className="text-zinc-500" />}
                <span>Boop Sound Effects</span>
              </div>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase", config.soundEnabled ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800 text-zinc-500")}>
                {config.soundEnabled ? 'ON' : 'MUTED'}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default MascotPerch;
