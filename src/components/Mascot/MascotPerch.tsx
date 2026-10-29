"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageMascot, { MascotReaction } from './PageMascot';
import { cn } from '@/lib/utils';

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

export interface MascotConfig {
  characterId: string;
  styleId: string;
  soundEnabled: boolean;
  hidden: boolean;
}

export const DEFAULT_CONFIG: MascotConfig = {
  characterId: 'fox',
  styleId: 'color',
  soundEnabled: true,
  hidden: false,
};

export const MascotPerch: React.FC<{ 
  className?: string; 
  embedded?: boolean;
  size?: number;
  noMessages?: boolean;
  noEdit?: boolean;
  onBoopSpeech?: (text: string) => void;
}> = ({ 
  className, 
  embedded = false,
  size,
  noMessages = false,
  noEdit = false,
  onBoopSpeech
}) => {
  const [config, setConfig] = useState<MascotConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved config and listen for live updates from Settings page
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

    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<MascotConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        try {
          const fresh = localStorage.getItem('shadow_mascot_config');
          if (fresh) setConfig((prev) => ({ ...prev, ...JSON.parse(fresh) }));
        } catch {}
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'shadow_mascot_config' && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('shadow_mascot_config_changed', handleConfigChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('shadow_mascot_config_changed', handleConfigChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
    const text = customText || currentCharacter.quotes[Math.floor(Math.random() * currentCharacter.quotes.length)];
    if (onBoopSpeech) {
      onBoopSpeech(text);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow_pet_speak', { 
        detail: { text, petId: currentCharacter.id, petName: currentCharacter.name } 
      }));
    }
    if (noMessages) return;
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
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
      triggerSpeech("Shadow surge! ✨");
    } else {
      triggerSpeech();
    }
  };

  // Occasional random friendly quip
  useEffect(() => {
    if (!mounted || config.hidden || noMessages) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.65) {
        triggerSpeech();
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [mounted, config.hidden, currentCharacter, noMessages]);

  if (!mounted || config.hidden) {
    return null;
  }

  return (
    <div className={cn("relative pointer-events-auto flex items-center justify-center select-none group shrink-0", className)}>
      {/* SPEECH BUBBLE (Floats below mascot for guaranteed viewport visibility) */}
      <AnimatePresence>
        {!noMessages && speech && (
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

      <PageMascot
        directions={directionsPath}
        reactions={reactionsPath}
        size={size || (embedded ? 32 : 40)}
        label={currentCharacter.name}
        enableSound={config.soundEnabled}
        onBoop={handleBoop}
        className="transition-transform active:scale-95 cursor-pointer"
      />
    </div>
  );
};

export default MascotPerch;
