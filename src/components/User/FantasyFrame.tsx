"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';

// ─── Frame Tier Config ────────────────────────────────────────────────────────
export const FRAME_TIERS = {
  none:       { tier: 0,  name: 'No Frame',         label: 'Free',         stars: 0 },
  iron:       { tier: 1,  name: 'Iron Seal',        label: 'Common',       stars: 1 },
  bronze:     { tier: 2,  name: 'Bronze Crest',     label: 'Uncommon',     stars: 1 },
  silver:     { tier: 3,  name: 'Silver Knight',    label: 'Uncommon',     stars: 2 },
  crimson:    { tier: 4,  name: 'Crimson Blade',    label: 'Rare',         stars: 3 },
  sapphire:   { tier: 5,  name: 'Sapphire Arc',     label: 'Rare',         stars: 3 },
  emerald:    { tier: 6,  name: 'Emerald Wilds',    label: 'Epic',         stars: 4 },
  golden:     { tier: 7,  name: 'Golden Realm',     label: 'Epic',         stars: 4 },
  shadow:     { tier: 8,  name: 'Shadow Void',      label: 'Legendary',    stars: 5 },
  celestial:  { tier: 9,  name: 'Celestial Rift',   label: 'Legendary',    stars: 5 },
  divine:     { tier: 10, name: 'Divine Archon',    label: 'Mythic',       stars: 5 },
  admin:      { tier: 11, name: 'The Eternal',      label: 'Exclusive',    stars: 5 },
  moderator:  { tier: 12, name: 'The Warden',       label: 'Exclusive',    stars: 5 },
} as const;

export type FrameId = keyof typeof FRAME_TIERS;

// Kept for legacy import compat
export const FRAMES: Record<string, any> = Object.fromEntries(
  Object.keys(FRAME_TIERS).map(k => [k, { css: '', effects: '' }])
);

// ─── Level Color Palette ──────────────────────────────────────────────────────
export function getLevelColors(lvl: number) {
  if (lvl < 10)  return { stroke: '#71717a', from: '#52525b', via: '#3f3f46', to: '#27272a', shadow: 'rgba(113,113,122,0.7)',  stars: 1, gem: '#71717a', textFill: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' };
  if (lvl < 25)  return { stroke: '#4ade80', from: '#22c55e', via: '#16a34a', to: '#14532d', shadow: 'rgba(74,222,128,0.8)',   stars: 1, gem: '#4ade80', textFill: '#f0fdf4', textShadow: '0 0 4px rgba(34,197,94,0.8)' };
  if (lvl < 50)  return { stroke: '#60a5fa', from: '#3b82f6', via: '#2563eb', to: '#1e3a8a', shadow: 'rgba(96,165,250,0.8)',   stars: 2, gem: '#60a5fa', textFill: '#eff6ff', textShadow: '0 0 5px rgba(59,130,246,0.8)' };
  if (lvl < 75)  return { stroke: '#c084fc', from: '#a855f7', via: '#7e22ce', to: '#3b0764', shadow: 'rgba(192,132,252,0.8)', stars: 3, gem: '#c084fc', textFill: '#faf5ff', textShadow: '0 0 6px rgba(168,85,247,0.8)' };
  if (lvl < 100) return { stroke: '#fbbf24', from: '#f59e0b', via: '#d97706', to: '#78350f', shadow: 'rgba(251,191,36,0.9)',   stars: 4, gem: '#fbbf24', textFill: '#fffbeb', textShadow: '0 0 6px rgba(245,158,11,0.9)' };
  return         { stroke: '#f87171', from: '#ef4444', via: '#b91c1c', to: '#450a0a', shadow: 'rgba(248,113,113,1)',    stars: 5, gem: '#ff6b6b', textFill: '#fef2f2', textShadow: '0 0 8px rgba(239,68,68,1)' };
}

export function getFrameColors(frameId: string = 'none', lvl: number = 1) {
  if (!frameId || frameId === 'none') {
    return getLevelColors(lvl);
  }

  switch (frameId) {
    case 'iron':
      return { stroke: '#a1a1aa', from: '#52525b', via: '#3f3f46', to: '#27272a', shadow: 'rgba(161,161,170,0.85)', gem: '#a1a1aa', textFill: '#f4f4f5', textShadow: '0 1px 3px rgba(0,0,0,0.9)' };
    case 'bronze':
      return { stroke: '#fb923c', from: '#ea580c', via: '#c2410c', to: '#7c2d12', shadow: 'rgba(251,146,60,0.9)', gem: '#fdba74', textFill: '#fff7ed', textShadow: '0 1px 3px rgba(124,45,18,0.9)' };
    case 'silver':
      return { stroke: '#cbd5e1', from: '#94a3b8', via: '#64748b', to: '#334155', shadow: 'rgba(203,213,225,0.95)', gem: '#e2e8f0', textFill: '#ffffff', textShadow: '0 0 5px rgba(255,255,255,0.8)' };
    case 'crimson':
      return { stroke: '#f87171', from: '#ef4444', via: '#dc2626', to: '#7f1d1d', shadow: 'rgba(248,113,113,0.95)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 6px rgba(220,38,38,0.9)' };
    case 'sapphire':
      return { stroke: '#60a5fa', from: '#3b82f6', via: '#1d4ed8', to: '#1e3a8a', shadow: 'rgba(96,165,250,0.95)', gem: '#93c5fd', textFill: '#eff6ff', textShadow: '0 0 6px rgba(29,78,216,0.9)' };
    case 'emerald':
      return { stroke: '#4ade80', from: '#22c55e', via: '#15803d', to: '#14532d', shadow: 'rgba(74,222,128,0.95)', gem: '#86efac', textFill: '#f0fdf4', textShadow: '0 0 6px rgba(21,128,61,0.9)' };
    case 'golden':
      return { stroke: '#fbbf24', from: '#f59e0b', via: '#b45309', to: '#78350f', shadow: 'rgba(251,191,36,1)', gem: '#fde047', textFill: '#fffbeb', textShadow: '0 0 8px rgba(245,158,11,0.9)' };
    case 'shadow':
      return { stroke: '#c084fc', from: '#a855f7', via: '#7e22ce', to: '#3b0764', shadow: 'rgba(192,132,252,1)', gem: '#e9d5ff', textFill: '#faf5ff', textShadow: '0 0 8px rgba(168,85,247,0.9)' };
    case 'celestial':
      return { stroke: '#38bdf8', from: '#0ea5e9', via: '#0284c7', to: '#0c4a6e', shadow: 'rgba(56,189,248,1)', gem: '#bae6fd', textFill: '#f0f9ff', textShadow: '0 0 10px rgba(14,165,233,1)' };
    case 'divine':
      return { stroke: '#fef08a', from: '#eab308', via: '#ca8a04', to: '#713f12', shadow: 'rgba(254,240,138,1)', gem: '#fef08a', textFill: '#ffffff', textShadow: '0 0 12px rgba(234,179,8,1)' };
    case 'admin':
      return { stroke: '#f59e0b', from: '#ef4444', via: '#d97706', to: '#450a0a', shadow: 'rgba(245,158,11,1)', gem: '#fbbf24', textFill: '#fffbeb', textShadow: '0 0 12px rgba(245,158,11,1)' };
    case 'moderator':
      return { stroke: '#f87171', from: '#dc2626', via: '#991b1b', to: '#450a0a', shadow: 'rgba(248,113,113,1)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 12px rgba(220,38,38,1)' };
    default:
      return getLevelColors(lvl);
  }
}

// ─── User Level Badge (Inverted Pyramid / Chevron) ────────────────────────────
export function UserLevelBadge({ level, frameId = 'none', className = 'w-full h-full' }: { level: number | string; frameId?: string; className?: string }) {
  const numLvl   = typeof level === 'string' ? parseInt(level) || 1 : level;
  const colors   = getFrameColors(frameId, numLvl);
  const gradId   = `ulb_${numLvl}_${frameId}_${Math.random().toString(36).slice(2, 7)}`;
  const hasGlow  = numLvl >= 10 || frameId !== 'none';
  const hasGem   = numLvl >= 25 || frameId !== 'none';
  const hasWings = numLvl >= 50 || ['shadow', 'celestial', 'divine', 'admin', 'moderator'].includes(frameId);
  const hasCrown = numLvl >= 75 || ['divine', 'admin'].includes(frameId);
  const isGod    = numLvl >= 100 || ['divine', 'admin'].includes(frameId);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible" style={{ filter: hasGlow ? `drop-shadow(0 0 ${isGod ? '8px' : '5px'} ${colors.shadow})` : 'none' }}>
        <defs>
          <linearGradient id={gradId} x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.from} />
            <stop offset="0.5" stopColor={colors.via} />
            <stop offset="1" stopColor={colors.to} />
          </linearGradient>
          <linearGradient id={`${gradId}_gem`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffffff80" />
            <stop offset="1" stopColor={colors.gem} />
          </linearGradient>
        </defs>

        {/* Wing ornaments for lv50+ */}
        {hasWings && (
          <>
            <path d="M2 10 C4 8 7 9 6 13 L4 12 Z"  fill={colors.from} opacity="0.7" />
            <path d="M30 10 C28 8 25 9 26 13 L28 12 Z" fill={colors.from} opacity="0.7" />
          </>
        )}
        
        {/* Extra Wings for lv100+ */}
        {isGod && (
          <>
            <path d="M0 14 C3 11 8 13 7 18 L4 16 Z"  fill={colors.via} opacity="0.9" />
            <path d="M32 14 C29 11 24 13 25 18 L28 16 Z" fill={colors.via} opacity="0.9" />
          </>
        )}

        {/* Crown tips for lv75+ */}
        {hasCrown && (
          <>
            <path d="M16 0 L13 6 L16 5 L19 6 Z" fill={colors.stroke} />
            <path d="M10 2 L9 7 L11 6.5 Z"      fill={colors.stroke} opacity="0.7" />
            <path d="M22 2 L23 7 L21 6.5 Z"     fill={colors.stroke} opacity="0.7" />
          </>
        )}

        {/* Main inverted pyramid body */}
        <path
          d="M2 6 L30 6 L16 28 Z"
          fill={`url(#${gradId})`}
          stroke={colors.stroke}
          strokeWidth={isGod ? "2" : "1.5"}
          strokeLinejoin="round"
        />

        {/* Horizontal bands (engrave lines) */}
        {numLvl >= 10 && <line x1="7"  y1="12" x2="25" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />}
        {numLvl >= 25 && <line x1="10" y1="17" x2="22" y2="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />}
        {numLvl >= 50 && <line x1="13" y1="22" x2="19" y2="22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />}

        {/* Center gem for lv25+ */}
        {hasGem && (
          <polygon points="16,9 18,12 16,15 14,12" fill={`url(#${gradId}_gem)`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        )}
        
        {/* Extra bottom gem for lv100+ */}
        {isGod && (
          <polygon points="16,18 17.5,21 16,24 14.5,21" fill={`url(#${gradId}_gem)`} stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
        )}

        {/* Level number */}
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill={colors.textFill || "rgba(255,255,255,1)"}
          fontSize={isGod ? "18" : "22"}
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="-0.5"
          style={{ textShadow: colors.textShadow || (hasGlow ? '0 2px 4px rgba(0,0,0,0.8)' : '0 1px 2px rgba(0,0,0,0.8)') }}
        >
          {numLvl}
        </text>
      </svg>
    </div>
  );
}

// ─── Frame Corner Ornament SVG ────────────────────────────────────────────────
function CornerOrnament({ tier, color, size = 12, opacity = 0.9 }: { tier: number; color: string; size?: number; opacity?: number }) {
  if (tier >= 11) {
    // Admin / Mod: Extra large ornate corners
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ opacity }}>
        <path d="M0 0 L16 0 L16 2 L4 2 L4 16 L0 16 Z" fill={color} />
        <path d="M6 6 L12 6 L12 8 L8 8 L8 12 L6 12 Z" fill={color} opacity="0.6" />
        <circle cx="4" cy="4" r="2.5" fill={color} />
        <circle cx="12" cy="4" r="1.5" fill={color} />
        <circle cx="4" cy="12" r="1.5" fill={color} />
      </svg>
    );
  } else if (tier >= 7) {
    // Tiers 7-10: Complex jeweled corners
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
        <path d="M0 0 L14 0 L14 3 L3 3 L3 14 L0 14 Z" fill={color} />
        <circle cx="3" cy="3" r="2" fill={color} />
        <circle cx="9" cy="1.5" r="1" fill={color} opacity="0.8" />
        <circle cx="1.5" cy="9" r="1" fill={color} opacity="0.8" />
        <path d="M5 5 L8 5 L5 8 Z" fill={color} opacity="0.5" />
      </svg>
    );
  } else if (tier >= 4) {
    // Tiers 4-6: Flared diagonal flair
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity }}>
        <path d="M0 0 L12 0 L10 2 L2 2 L2 10 L0 12 Z" fill={color} />
        <path d="M3 3 L7 3 L3 7 Z" fill={color} opacity="0.7" />
      </svg>
    );
  } else {
    // Tiers 1-3: Simple L-bracket
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity }}>
        <path d="M0 0 L12 0 L12 3 L3 3 L3 12 L0 12 Z" fill={color} />
        <circle cx="3" cy="3" r="1.5" fill={color} opacity="0.8" />
      </svg>
    );
  }
}

// ─── Frame Definitions ────────────────────────────────────────────────────────
interface FrameDef {
  border: string;           // CSS color
  glow: string;             // box-shadow color
  bg: string;               // ring bg gradient
  corner: string;           // corner ornament color
  cornerOpacity?: number;
  animate?: 'pulse' | 'spin' | 'spinReverse' | 'aurora' | 'divine' | 'eternal' | 'warden' | 'breathe' | 'orbit' | 'spin-fast' | 'celestial-burst';
  rings?: number;           // extra spinning rings
  particles?: boolean;
  assetUrl?: string;        // Path to the high-end PNG texture
  assetBlend?: React.CSSProperties['mixBlendMode']; // e.g. 'screen' to hide black background
  assetScale?: number;      // scale factor for the asset image
}

const FRAME_DEFS: Record<string, FrameDef> = {
  none:      { border: 'transparent', glow: 'none', bg: 'transparent', corner: 'transparent' },
  iron:      { border: '#71717a', glow: 'none', bg: '#52525b', corner: '#71717a', assetUrl: '/frames/frame_magic.png', assetBlend: 'screen', assetScale: 1.15, animate: 'breathe' },
  bronze:    { border: '#b45309', glow: '0 0 5px rgba(180,83,9,0.35)', bg: 'conic-gradient(#92400e, #d97706, #b45309, #d97706, #92400e)', corner: '#d97706', assetUrl: '/frames/frame_steampunk.png', assetBlend: 'screen', assetScale: 1.2, animate: 'spinReverse' },
  silver:    { border: '#94a3b8', glow: '0 0 5px rgba(148,163,184,0.35)', bg: 'conic-gradient(#64748b, #cbd5e1, #94a3b8, #cbd5e1, #64748b)', corner: '#cbd5e1', assetUrl: '/frames/frame_vines.png', assetBlend: 'screen', assetScale: 1.2, animate: 'breathe' },
  sapphire:  { border: '#3b82f6', glow: '0 0 6px rgba(59,130,246,0.4)', bg: 'conic-gradient(#1e3a8a, #60a5fa, #2563eb, #60a5fa, #1e3a8a)', corner: '#93c5fd', assetUrl: '/frames/frame_magic.png', assetBlend: 'screen', assetScale: 1.25, animate: 'breathe' },
  crimson:   { border: '#dc2626', glow: '0 0 6px rgba(220,38,38,0.4)', bg: 'conic-gradient(#7f1d1d, #ef4444, #b91c1c, #ef4444, #7f1d1d)', corner: '#f87171', assetUrl: '/frames/frame_blades.png', assetBlend: 'screen', assetScale: 1.3, animate: 'spin-fast' },
  emerald:   { border: '#10b981', glow: '0 0 6px rgba(16,185,129,0.4)', bg: 'conic-gradient(#064e3b, #34d399, #059669, #34d399, #064e3b)', corner: '#6ee7b7', assetUrl: '/frames/frame_vines.png', assetBlend: 'screen', assetScale: 1.25, animate: 'breathe' },
  golden:    { border: '#f59e0b', glow: '0 0 7px rgba(245,158,11,0.45)', bg: 'conic-gradient(#78350f, #fbbf24, #d97706, #fbbf24, #78350f)', corner: '#fde68a', animate: 'spin', rings: 1 },
  shadow:    { border: '#7c3aed', glow: '0 0 8px rgba(124,58,237,0.45)', bg: 'conic-gradient(#1e1b4b, #8b5cf6, #4c1d95, #8b5cf6, #1e1b4b)', corner: '#c4b5fd', assetUrl: '/frames/frame_cosmic.png', assetBlend: 'screen', assetScale: 1.35, animate: 'spinReverse', rings: 1, particles: true },
  celestial: { border: '#38bdf8', glow: '0 0 8px rgba(56,189,248,0.45)', bg: 'conic-gradient(#0284c7, #38bdf8, #a855f7, #ec4899, #38bdf8, #0284c7)', corner: '#bae6fd', assetUrl: '/frames/frame_gyro.png', assetBlend: 'screen', assetScale: 1.4, animate: 'orbit', rings: 2 },
  divine:    { border: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.45)', bg: 'conic-gradient(#fbbf24, #f9a8d4, #fbbf24, #c084fc, #fbbf24)', corner: '#fff7ed', assetUrl: '/frames/frame_cosmic.png', assetBlend: 'screen', assetScale: 1.4, animate: 'aurora', rings: 2, particles: true },
  admin:     { border: '#a855f7', glow: '0 0 10px rgba(168,85,247,0.5)', bg: 'conic-gradient(#581c87, #a855f7, #dc2626, #7e22ce, #ef4444, #a855f7, #581c87)', corner: '#e9d5ff', assetUrl: '/frames/frame_celestial.png', assetBlend: 'screen', assetScale: 1.5, animate: 'celestial-burst', rings: 3, particles: true },
  moderator: { border: '#0ea5e9', glow: '0 0 8px rgba(14,165,233,0.45)', bg: 'conic-gradient(#0c4a6e, #38bdf8, #0369a1, #38bdf8, #0c4a6e)', corner: '#bae6fd', assetUrl: '/frames/frame_gyro.png', assetBlend: 'screen', assetScale: 1.5, animate: 'warden', rings: 2, particles: true },
};

// Aliases for frame IDs mapped from natural language / DB values
FRAME_DEFS['warden'] = FRAME_DEFS.moderator;
FRAME_DEFS['the_warden'] = FRAME_DEFS.moderator;
FRAME_DEFS['celestial_nebula'] = FRAME_DEFS.celestial;
FRAME_DEFS['shadow_portal'] = FRAME_DEFS.shadow;
FRAME_DEFS['akatsuki'] = FRAME_DEFS.admin;
FRAME_DEFS['demon_slayer'] = FRAME_DEFS.crimson;
FRAME_DEFS['wings_of_freedom'] = FRAME_DEFS.celestial;

// ─── Main Frame Component ─────────────────────────────────────────────────────
interface FantasyFrameProps {
  frameId?: string;
  level?: number;
  showLevelTag?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: number; // diameter in px, default 64
  transparentBg?: boolean;
}

export default function FantasyFrame({
  frameId = 'none',
  level,
  showLevelTag = true,
  children,
  className = '',
  size,
  transparentBg = false,
}: FantasyFrameProps) {
  const frame = FRAME_DEFS[frameId as keyof typeof FRAME_DEFS] ?? FRAME_DEFS.none;
  const settingsContext = useSettings();
  const isHidden = settingsContext?.settings?.hideLevelBadge;
  const shouldShowTag = level !== undefined && showLevelTag && !isHidden;

  const spinDuration  = frameId === 'divine' ? 2 : frameId === 'eternal' ? 1.5 : frameId === 'celestial' ? 3 : 4;
  const spinDuration2 = spinDuration * 1.6;
  const spinDuration3 = spinDuration * 2.4;

  const ringOpacity = (tier: number) => {
    if (tier >= 3) return 0.9;
    if (tier >= 2) return 0.7;
    return 0.5;
  };

  const tierInfo = FRAME_TIERS[frameId as keyof typeof FRAME_TIERS] ?? FRAME_TIERS.none;
  const rings = FRAME_DEFS[frameId]?.rings ?? 0;
  
  // Mod/Admin frames have a thicker border
  const BORDER = tierInfo.tier >= 11 ? 2 : (frameId === 'none' ? 0 : 1);

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes ff-spin        { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes ff-spin-fast   { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes ff-spin-r      { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes ff-pulse-glow  { 0%,100% { opacity: 0.6; }  50% { opacity: 1; } }
        @keyframes ff-breathe     { 0%,100% { transform: scale(1) rotate(0deg); opacity: 0.85; } 50% { transform: scale(1.05) rotate(2deg); opacity: 1; } }
        @keyframes ff-aurora      { 0% { filter: hue-rotate(0deg); transform: rotate(0deg) scale(1); }  50% { filter: hue-rotate(180deg); transform: rotate(180deg) scale(1.05); } 100% { filter: hue-rotate(360deg); transform: rotate(360deg) scale(1); } }
        @keyframes ff-divine      { 0% { filter: hue-rotate(0deg) brightness(1); transform: scale(1); }  50% { filter: hue-rotate(180deg) brightness(1.4); transform: scale(1.08); }  100% { filter: hue-rotate(360deg) brightness(1); transform: scale(1); } }
        @keyframes ff-eternal     { 0% { filter: brightness(1) hue-rotate(0deg); }  33% { filter: brightness(1.8) hue-rotate(60deg); }  66% { filter: brightness(1.2) hue-rotate(-60deg); }  100% { filter: brightness(1) hue-rotate(0deg); } }
        @keyframes ff-orbit       { 0% { transform: rotateZ(0deg) rotateX(15deg) rotateY(15deg); } 100% { transform: rotateZ(360deg) rotateX(15deg) rotateY(15deg); } }
        @keyframes ff-warden-spin { 0% { transform: rotate(0deg) scale(1); }  50% { transform: rotate(180deg) scale(1.03); }  100% { transform: rotate(360deg) scale(1); } }
        @keyframes ff-celestial-burst { 0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg) drop-shadow(0 0 10px rgba(168,85,247,0.5)); } 50% { transform: scale(1.04) rotate(180deg); filter: hue-rotate(240deg) drop-shadow(0 0 16px rgba(220,38,38,0.6)); } }
        @keyframes ff-purple-shock { 0%, 100% { opacity: 0.7; transform: scale(1); filter: drop-shadow(0 0 6px #a855f7); } 50% { opacity: 1; transform: scale(1.03) rotate(3deg); filter: drop-shadow(0 0 12px #dc2626); } }
        @keyframes ff-sunwave { 0%, 100% { filter: drop-shadow(0 0 10px rgba(245,158,11,0.6)); transform: scale(1); } 50% { filter: drop-shadow(0 0 18px rgba(251,191,36,0.7)); transform: scale(1.03); } }
        @keyframes ff-particle    { 0%,100% { transform: translate(0,0) scale(1); opacity: 0; }  30% { opacity: 0.9; }  70% { transform: translate(var(--dx), var(--dy)) scale(0.6); opacity: 0.6; }  100% { opacity: 0; } }
        @keyframes ff-aura-wave   { 0%, 100% { opacity: 0.2; transform: scale(0.95); } 50% { opacity: 0.6; transform: scale(1.05); } }
        @keyframes ff-firefly-1   { 0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 0; } 100% { transform: translate(25px, -35px) scale(1.2); opacity: 0; } }
        @keyframes ff-firefly-2   { 0% { transform: translate(0, 0) scale(0.8); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 0; } 100% { transform: translate(-30px, -45px) scale(0.5); opacity: 0; } }
        
        @keyframes ff-shock-jitter {
          0% { opacity: 0.6; transform: scale(1) translate(0px, 0px); }
          25% { opacity: 0.9; transform: scale(1.02) translate(1px, -1px); }
          50% { opacity: 0.5; transform: scale(0.98) translate(-1px, 1px); }
          75% { opacity: 1; transform: scale(1.01) translate(-1px, -1px); }
          100% { opacity: 0.7; transform: scale(1) translate(1px, 1px); }
        }
        @keyframes ff-lightning-flash-1 {
          0%, 90% { opacity: 0; transform: rotate(0deg) scale(1); }
          92% { opacity: 1; transform: rotate(10deg) scale(1.1); }
          95% { opacity: 0.3; transform: rotate(-5deg) scale(0.9); }
          98% { opacity: 1; transform: rotate(5deg) scale(1.05); }
          100% { opacity: 0; transform: rotate(0deg) scale(1); }
        }
        @keyframes ff-lightning-flash-2 {
          0%, 85% { opacity: 0; transform: rotate(0deg) scale(1) scaleX(1); }
          87% { opacity: 1; transform: rotate(-15deg) scale(1.1) scaleX(-1); }
          91% { opacity: 0.2; transform: rotate(10deg) scale(0.9) scaleX(-1); }
          95% { opacity: 1; transform: rotate(-5deg) scale(1.05) scaleX(-1); }
          100% { opacity: 0; transform: rotate(0deg) scale(1) scaleX(1); }
        }
        @keyframes ff-lightning-flash-3 {
          0%, 80% { opacity: 0; transform: rotate(0deg) scale(1) scaleY(1); }
          82% { opacity: 1; transform: rotate(20deg) scale(1.2) scaleY(-1); }
          86% { opacity: 0.4; transform: rotate(-15deg) scale(0.8) scaleY(-1); }
          90% { opacity: 1; transform: rotate(15deg) scale(1.1) scaleY(-1); }
          100% { opacity: 0; transform: rotate(0deg) scale(1) scaleY(1); }
        }
        @keyframes ff-storm-flash {
          0%, 90%, 100% { opacity: 0; }
          92% { opacity: 0.6; }
          94% { opacity: 0.1; }
          96% { opacity: 0.8; }
        }
        @keyframes ff-sunfire-spin {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
      `}</style>

      {/* ── Global SVG Filters for hyper-realistic effects ── */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="tesla-lightning" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="heatwave-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.035" numOctaves="2" result="noise">
              <animate attributeName="baseFrequency" values="0.015 0.035; 0.025 0.05; 0.015 0.035" dur="3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className={`relative flex flex-col items-center justify-center ${className}`} style={size ? { width: size, height: size } : {}}>

        {/* ── Outer ring(s) ── */}
        {rings >= 1 && frameId !== 'none' && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -(BORDER + 5),
              background: frame.bg,
              animation: `ff-spin ${spinDuration2}s linear infinite`,
              opacity: ringOpacity(rings),
              WebkitMaskImage: 'radial-gradient(transparent 80%, black 100%)',
              maskImage:        'radial-gradient(transparent 80%, black 100%)',
              filter: frameId === 'divine' || frameId === 'admin' || frameId === 'celestial' ? 'brightness(1.5)' : undefined,
            }}
          />
        )}
        {rings >= 2 && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -(BORDER + 10),
              background: frame.bg,
              animation: `ff-spin-r ${spinDuration3}s linear infinite`,
              opacity: ringOpacity(rings) * 0.6,
              WebkitMaskImage: 'radial-gradient(transparent 82%, black 100%)',
              maskImage:        'radial-gradient(transparent 82%, black 100%)',
            }}
          />
        )}
        {rings >= 3 && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -(BORDER + 16),
              background: frame.bg,
              animation: `ff-spin ${spinDuration * 0.8}s linear infinite`,
              opacity: 0.4,
              WebkitMaskImage: 'radial-gradient(transparent 83%, black 100%)',
              maskImage:        'radial-gradient(transparent 83%, black 100%)',
              filter: 'blur(1px)',
            }}
          />
        )}

        {/* ── Frame ring (Background gradient base) ── */}
        {frameId !== 'none' && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -BORDER,
              background: frame.bg,
              animation: frame.animate === 'spin'        ? `ff-spin ${spinDuration}s linear infinite`
                       : frame.animate === 'spinReverse' ? `ff-spin-r ${spinDuration}s linear infinite`
                       : frame.animate === 'aurora'      ? `ff-aurora 6s linear infinite`
                       : frame.animate === 'divine'      ? `ff-divine 4s ease-in-out infinite`
                       : frame.animate === 'eternal'     ? `ff-eternal 3s ease-in-out infinite`
                       : frame.animate === 'warden'      ? `ff-warden-spin ${spinDuration}s ease-in-out infinite`
                       : frame.animate === 'pulse'       ? `ff-pulse-glow 2.5s ease-in-out infinite`
                       : frame.animate === 'celestial-burst' ? `ff-celestial-burst 4s ease-in-out infinite`
                       : undefined,
              boxShadow: frame.glow !== 'none' ? frame.glow : undefined,
              filter: frameId === 'golden' ? 'url(#heatwave-filter)' : undefined,
              WebkitMaskImage: transparentBg ? 'radial-gradient(circle closest-side, transparent 79%, black 80%)' : undefined,
              maskImage: transparentBg ? 'radial-gradient(circle closest-side, transparent 79%, black 80%)' : undefined,
            }}
          />
        )}

        {/* ── High-End Visual Asset Layer ── */}
        {frame.assetUrl && (
          <div
            className="absolute flex items-center justify-center pointer-events-none rounded-full overflow-hidden"
            style={{
              inset: '-15%',
              zIndex: 20,
              mixBlendMode: frame.assetBlend || 'screen',
              pointerEvents: 'none',
              isolation: 'isolate',
              WebkitMaskImage: 'radial-gradient(circle closest-side, transparent 48%, black 58%, black 82%, transparent 98%)',
              maskImage: 'radial-gradient(circle closest-side, transparent 48%, black 58%, black 82%, transparent 98%)',
            }}
          >
            <img 
              src={frame.assetUrl} 
              alt="" 
              className="w-full h-full object-contain pointer-events-none rounded-full"
              style={{
                transform: `scale(${frame.assetScale || 1})`,
                animation: frame.animate === 'spin'        ? `ff-spin ${spinDuration * 2}s cubic-bezier(0.4, 0, 0.2, 1) infinite`
                         : frame.animate === 'spin-fast'   ? `ff-spin-fast ${spinDuration * 0.8}s linear infinite`
                         : frame.animate === 'spinReverse' ? `ff-spin-r ${spinDuration * 2}s cubic-bezier(0.4, 0, 0.2, 1) infinite`
                         : frame.animate === 'aurora'      ? `ff-aurora 8s cubic-bezier(0.4, 0, 0.2, 1) infinite`
                         : frame.animate === 'divine'      ? `ff-divine 5s ease-in-out infinite`
                         : frame.animate === 'eternal'     ? `ff-eternal 4s ease-in-out infinite`
                         : frame.animate === 'warden'      ? `ff-warden-spin ${spinDuration}s ease-in-out infinite`
                         : frame.animate === 'breathe'     ? `ff-breathe 4s ease-in-out infinite`
                         : frame.animate === 'orbit'       ? `ff-orbit ${spinDuration * 3}s linear infinite`
                         : frame.animate === 'celestial-burst' ? `ff-celestial-burst 4s ease-in-out infinite`
                         : undefined,
              }}
            />
          </div>
        )}

        {/* ── Inner mask + avatar ── */}
        <div
          className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background: transparentBg ? 'transparent' : '#000',
            zIndex: 10,
            border: frameId === 'none' ? 'none' : `1px solid rgba(255,255,255,0.1)`,
            transform: frameId !== 'none' ? 'scale(0.80)' : 'scale(1)', // Perfectly centered inner avatar
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            WebkitMaskImage: '-webkit-radial-gradient(white, black)', // Fix for Safari border-radius overflow
          }}
        >
          {children}

          {/* ── Purple Electric Shock Over Avatar (The Eternal) ── */}
          {frameId === 'admin' && (
            <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden rounded-full">
              {/* Perimeter shock */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-400 shadow-[0_0_15px_#a855f7,inset_0_0_20px_#dc2626] opacity-80 animate-[ff-shock-jitter_0.15s_infinite]" />
            </div>
          )}

          {/* ── Blue Electric Shock Over Avatar (Sapphire Arc) ── */}
          {frameId === 'sapphire' && (
            <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden rounded-full">
              {/* Perimeter shock */}
              <div className="absolute inset-0 rounded-full border border-blue-400 shadow-[0_0_10px_#3b82f6,inset_0_0_10px_#60a5fa] opacity-80 animate-[ff-shock-jitter_0.2s_infinite]" />
            </div>
          )}

          {/* ── Aura Wave & Fireflies based on Level ── */}
          {(level && level >= 25) && (
            <div className="absolute inset-0 pointer-events-none z-20 mix-blend-screen overflow-hidden">
              {/* Aura */}
              <div 
                className="absolute inset-[-10%] rounded-full opacity-50 animate-[ff-aura-wave_4s_ease-in-out_infinite]"
                style={{ background: `radial-gradient(circle at center, transparent 30%, ${getFrameColors(frameId, level).from} 80%, transparent)` }}
              />
              
              {/* Fireflies for higher levels */}
              {level >= 50 && (
                <>
                  <div className="absolute bottom-[20%] left-[30%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff] animate-[ff-firefly-1_5s_ease-in-out_infinite]" />
                  <div className="absolute bottom-[30%] right-[25%] w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff] animate-[ff-firefly-2_6s_ease-in-out_infinite_1s]" />
                </>
              )}
              {level >= 100 && (
                <>
                  <div className="absolute bottom-[40%] left-[20%] w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff] animate-[ff-firefly-2_7s_ease-in-out_infinite_2.5s]" />
                  <div className="absolute top-[30%] right-[30%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff] animate-[ff-firefly-1_8s_ease-in-out_infinite_0.5s]" />
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Outer Bleeding Electric Shocks (Rapid Tesla Flash) ── */}
        {frameId === 'admin' && (
            <div className="absolute inset-[-12%] pointer-events-none z-[110]">
              <div className="absolute inset-[12%] rounded-full bg-white mix-blend-overlay animate-[ff-storm-flash_2.5s_infinite]" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[ff-lightning-flash-1_1.2s_infinite]">
                <path d="M0,20 L30,40 L45,10 L70,50 L100,30" fill="none" stroke="#ffffff" strokeWidth="1.5" filter="url(#tesla-lightning) drop-shadow(0 0 4px #a855f7)" />
              </svg>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[ff-lightning-flash-2_1.7s_infinite_0.4s]">
                <path d="M20,100 L40,70 L30,40 L60,20 L80,0" fill="none" stroke="#fca5a5" strokeWidth="2" filter="url(#tesla-lightning) drop-shadow(0 0 5px #dc2626)" />
              </svg>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[ff-lightning-flash-3_2.1s_infinite_0.9s]">
                <path d="M0,80 L40,90 L60,60 L90,100" fill="none" stroke="#d8b4fe" strokeWidth="2" filter="url(#tesla-lightning) drop-shadow(0 0 6px #7e22ce)" />
              </svg>
            </div>
        )}
        
        {frameId === 'sapphire' && (
            <div className="absolute inset-[-8%] pointer-events-none z-[110]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[ff-lightning-flash-1_1.5s_infinite]">
                <path d="M10,0 L30,40 L80,20 L100,70" fill="none" stroke="#ffffff" strokeWidth="1.5" filter="url(#tesla-lightning) drop-shadow(0 0 4px #3b82f6)" />
              </svg>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[ff-lightning-flash-2_2s_infinite_0.5s]">
                <path d="M0,60 L40,80 L60,30 L90,100" fill="none" stroke="#bfdbfe" strokeWidth="2" filter="url(#tesla-lightning) drop-shadow(0 0 5px #2563eb)" />
              </svg>
            </div>
        )}

        {/* ── Corner ornaments (tier 1+) ── */}
        {/* {tierInfo.tier >= 1 && frameId !== 'none' && (
          <>
            <div className="absolute top-0 left-0 pointer-events-none" style={{ transform: 'translate(-2px,-2px)', zIndex: 20 }}>
              <CornerOrnament tier={tierInfo.tier} color={frame.corner} size={tierInfo.tier >= 11 ? 20 : (tierInfo.tier >= 7 ? 14 : 10)} opacity={frame.cornerOpacity ?? 0.8} />
            </div>
            <div className="absolute top-0 right-0 pointer-events-none" style={{ transform: 'translate(2px,-2px) scaleX(-1)', zIndex: 20 }}>
              <CornerOrnament tier={tierInfo.tier} color={frame.corner} size={tierInfo.tier >= 11 ? 20 : (tierInfo.tier >= 7 ? 14 : 10)} opacity={frame.cornerOpacity ?? 0.8} />
            </div>
            <div className="absolute bottom-0 left-0 pointer-events-none" style={{ transform: 'translate(-2px,2px) scaleY(-1)', zIndex: 20 }}>
              <CornerOrnament tier={tierInfo.tier} color={frame.corner} size={tierInfo.tier >= 11 ? 20 : (tierInfo.tier >= 7 ? 14 : 10)} opacity={frame.cornerOpacity ?? 0.8} />
            </div>
            <div className="absolute bottom-0 right-0 pointer-events-none" style={{ transform: 'translate(2px,2px) scale(-1)', zIndex: 20 }}>
              <CornerOrnament tier={tierInfo.tier} color={frame.corner} size={tierInfo.tier >= 11 ? 20 : (tierInfo.tier >= 7 ? 14 : 10)} opacity={frame.cornerOpacity ?? 0.8} />
            </div>
          </>
        )} */}

        {/* ── Glow bloom ── */}
        {frameId !== 'none' && frame.glow !== 'none' && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: frame.glow,
              zIndex: 5,
              animation: 'ff-pulse-glow 2.5s ease-in-out infinite',
            }}
          />
        )}

        {/* ── Level Badge ── */}
        {shouldShowTag && (
          <div 
            className="absolute left-1/2 z-30 pointer-events-none flex items-center justify-center"
            style={{ 
              width: '40%',
              height: '40%',
              bottom: frameId !== 'none' ? '10%' : '0%', 
              transform: 'translate(-50%, 50%)'
            }}
          >
            <UserLevelBadge level={level!} frameId={frameId} className="w-full h-full overflow-visible" />
          </div>
        )}
      </div>
    </>
  );
}
