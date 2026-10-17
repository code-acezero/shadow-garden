"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

export const DIRECTIONS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
] as const;

export const REACTIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const;

export type MascotDirection = (typeof DIRECTIONS)[number];
export type MascotReaction = (typeof REACTIONS)[number];

// Clockwise from the right, matching atan2 with y pointing down.
const CLOCKWISE: MascotDirection[] = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
];

const SECTOR = (Math.PI * 2) / CLOCKWISE.length;
const HYSTERESIS = 0.12;
const DEAD_ZONE = 60;

const PAYOFFS: MascotReaction[] = ['heart', 'sparkle', 'delighted', 'wink', 'surprised'];
const BOOP_PAYOFF = 120;
const BOOP_END = 600;
const SQUASH_MS = 420;
const DIZZY_AFTER = 4;
const DIZZY_WINDOW = 1600;
const DIZZY_END = 1200;

const SQUASH: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'ease-in' },
  { transform: 'scale(1.12, 0.84)', offset: 0.18, easing: 'ease-out' },
  { transform: 'scale(0.94, 1.09)', offset: 0.45, easing: 'ease-in-out' },
  { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
];

function cell(index: number): CSSProperties {
  return {
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
  };
}

function wrap(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

const layerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundSize: '300% 300%',
  backgroundRepeat: 'no-repeat',
};

// Play a tiny, cute cartoon pop sound using Web Audio API
export function playBoopSound(isDizzy = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isDizzy ? 'sawtooth' : 'sine';
    const now = ctx.currentTime;
    
    if (isDizzy) {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    } else {
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export interface PageMascotProps {
  /** Path to the 3x3 head directions sprite sheet */
  directions: string;
  /** Path to the 3x3 reactions sprite sheet */
  reactions: string;
  /** Size in pixels (square) */
  size?: number;
  className?: string;
  label?: string;
  enableSound?: boolean;
  onBoop?: (info: { count: number; reaction: MascotReaction | null; isDizzy: boolean }) => void;
  style?: CSSProperties;
}

export const PageMascot: React.FC<PageMascotProps> = ({
  directions,
  reactions,
  size = 56,
  className,
  label = 'mascot',
  enableSound = true,
  onBoop,
  style,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const squashRef = useRef<HTMLSpanElement>(null);
  const timersRef = useRef<number[]>([]);
  const boopsRef = useRef({ count: 0, at: 0 });
  const [direction, setDirection] = useState<MascotDirection>('center');
  const [reaction, setReaction] = useState<MascotReaction | null>(null);

  // Track cursor movement across the viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    let sector = -1;
    let pointer: { x: number; y: number } | null = null;

    const aim = () => {
      const button = buttonRef.current;
      if (!button || !pointer) return;

      const box = button.getBoundingClientRect();
      const dx = pointer.x - (box.left + box.width / 2);
      const dy = pointer.y - (box.top + box.height / 2);

      // Dead zone: looking straight at user
      if (Math.hypot(dx, dy) < DEAD_ZONE) {
        sector = -1;
        setDirection('center');
        return;
      }

      // Hold current sector until well past edge
      const angle = Math.atan2(dy, dx);
      if (sector !== -1 && Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) {
        return;
      }

      sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
      setDirection(CLOCKWISE[sector]);
    };

    const onPointerMove = (e: MouseEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      aim();
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('scroll', aim, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('scroll', aim);
    };
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Boop handler
  const handleBoop = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    const later = (ms: number, next: MascotReaction | null) => {
      timersRef.current.push(window.setTimeout(() => setReaction(next), ms));
    };

    const now = Date.now();
    const boops = boopsRef.current;
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1;
    boops.at = now;

    const isDizzy = boops.count >= DIZZY_AFTER;

    if (enableSound) {
      playBoopSound(isDizzy);
    }

    if (isDizzy) {
      boops.count = 0;
      setReaction('dizzy');
      later(DIZZY_END, null);
      onBoop?.({ count: boops.count, reaction: 'dizzy', isDizzy: true });
    } else {
      setReaction('blink');
      const payoff = PAYOFFS[(boops.count - 1) % PAYOFFS.length];
      later(BOOP_PAYOFF, payoff);
      later(BOOP_END, null);
      onBoop?.({ count: boops.count, reaction: payoff, isDizzy: false });
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    squashRef.current?.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' });
  }, [enableSound, onBoop]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleBoop}
      aria-label={`Boop the ${label}`}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        padding: 0,
        border: 0,
        background: 'transparent',
        appearance: 'none',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        ...style,
      }}
    >
      <span
        ref={squashRef}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          height: '100%',
          transformOrigin: '50% 85%',
        }}
      >
        {/* Layer 1: Head Directions */}
        <span
          style={{
            ...layerStyle,
            backgroundImage: `url(${directions})`,
            ...cell(DIRECTIONS.indexOf(direction)),
            opacity: reaction ? 0 : 1,
            transition: 'opacity 80ms ease',
          }}
        />

        {/* Layer 2: Emotional Reactions / Boops */}
        <span
          style={{
            ...layerStyle,
            backgroundImage: `url(${reactions})`,
            ...cell(REACTIONS.indexOf(reaction ?? 'blink')),
            opacity: reaction ? 1 : 0,
            transition: 'opacity 80ms ease',
          }}
        />
      </span>
    </button>
  );
};

export default PageMascot;
