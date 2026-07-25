"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ClanLevelBadgeProps {
  level?: number;
  xp?: number;
  className?: string;
  showTitle?: boolean;
}

export function getClanBadgeInfo(level: number = 1) {
  const lvl = typeof level === 'string' ? parseInt(level) || 1 : (level || 1);

  if (lvl >= 150) return {
    tier: 10, title: 'Celestial Realm',
    color: { primary: '#fbbf24', secondary: '#f43f5e', bg: '#1f0010', stroke: '#ffffff', glow: 'rgba(251,191,36,1)', from: '#f43f5e', via: '#fbbf24', to: '#ffffff' },
  };
  if (lvl >= 100) return {
    tier: 9, title: 'Shadow Crown',
    color: { primary: '#a855f7', secondary: '#4c1d95', bg: '#0f0820', stroke: '#c4b5fd', glow: 'rgba(168,85,247,1)', from: '#4c1d95', via: '#a855f7', to: '#e879f9' },
  };
  if (lvl >= 90) return {
    tier: 8, title: 'Mythic Phoenix',
    color: { primary: '#f43f5e', secondary: '#be123c', bg: '#1c000a', stroke: '#fda4af', glow: 'rgba(244,63,94,0.9)', from: '#be123c', via: '#f43f5e', to: '#fb7185' },
  };
  if (lvl >= 70) return {
    tier: 7, title: 'Flame Sovereign',
    color: { primary: '#f97316', secondary: '#c2410c', bg: '#1c0a00', stroke: '#fdba74', glow: 'rgba(249,115,22,0.9)', from: '#c2410c', via: '#f97316', to: '#ffedd5' },
  };
  if (lvl >= 50) return {
    tier: 6, title: 'Diamond Legion',
    color: { primary: '#06b6d4', secondary: '#0891b2', bg: '#001a24', stroke: '#67e8f9', glow: 'rgba(6,182,212,0.9)', from: '#0891b2', via: '#06b6d4', to: '#cffafe' },
  };
  if (lvl >= 40) return {
    tier: 5, title: 'Platinum Order',
    color: { primary: '#38bdf8', secondary: '#0284c7', bg: '#081420', stroke: '#bae6fd', glow: 'rgba(56,189,248,0.8)', from: '#0284c7', via: '#38bdf8', to: '#e0f2fe' },
  };
  if (lvl >= 30) return {
    tier: 4, title: 'Gold Guild',
    color: { primary: '#eab308', secondary: '#a16207', bg: '#141000', stroke: '#fef08a', glow: 'rgba(234,179,8,0.85)', from: '#a16207', via: '#eab308', to: '#fef9c3' },
  };
  if (lvl >= 20) return {
    tier: 3, title: 'Silver Knight',
    color: { primary: '#cbd5e1', secondary: '#64748b', bg: '#0b0f17', stroke: '#f8fafc', glow: 'rgba(203,213,225,0.75)', from: '#64748b', via: '#cbd5e1', to: '#ffffff' },
  };
  if (lvl >= 10) return {
    tier: 2, title: 'Iron Vanguard',
    color: { primary: '#94a3b8', secondary: '#475569', bg: '#090a0f', stroke: '#cbd5e1', glow: 'rgba(148,163,184,0.5)', from: '#475569', via: '#94a3b8', to: '#cbd5e1' },
  };
  return {
    tier: 1, title: 'Bronze Novice',
    color: { primary: '#d97706', secondary: '#78350f', bg: '#120800', stroke: '#fde68a', glow: 'rgba(217,119,6,0.6)', from: '#78350f', via: '#d97706', to: '#fef3c7' },
  };
}

export const CLAN_RANKS = [
  { level: 1, title: 'Bronze Novice', cpRequired: 0, description: 'Newly formed clan starting their journey.' },
  { level: 10, title: 'Iron Vanguard', cpRequired: 5000, description: 'Battle-hardened operatives with proven discipline.' },
  { level: 20, title: 'Silver Knight', cpRequired: 12000, description: 'Esteemed clan known for honor and tactical victories.' },
  { level: 30, title: 'Gold Guild', cpRequired: 22000, description: 'Prestigious guild dominating sector rankings.' },
  { level: 40, title: 'Platinum Order', cpRequired: 36000, description: 'Elite Order with advanced technological mastery.' },
  { level: 50, title: 'Diamond Legion', cpRequired: 55000, description: 'Crystalline legion revered across the OtakuVerse.' },
  { level: 70, title: 'Flame Sovereign', cpRequired: 80000, description: 'Fiery sovereign domain commanding infernal power.' },
  { level: 90, title: 'Mythic Phoenix', cpRequired: 115000, description: 'Legendary Phoenix resurrected with mythic glory.' },
  { level: 100, title: 'Shadow Crown', cpRequired: 160000, description: 'Imperial Shadow domain sitting upon the void throne.' },
  { level: 150, title: 'Celestial Realm', cpRequired: 220000, description: 'Godly realm ascending into divine immortality.' }
];

export function getRequiredClanXP(level: number = 1): number {
  const lvl = Math.max(1, Math.floor(level));
  return Math.floor(500 * lvl + Math.pow(lvl - 1, 1.85) * 600);
}

export async function addClanXP(supabase: any, clanId: string, amount: number) {
  if (!supabase || !clanId) return;
  try {
    const { data: clan, error } = await supabase
      .from('clans').select('level, xp, name').eq('id', clanId).single();
    if (error || !clan) return;
    let currentLevel = Number(clan.level) || 1;
    let currentXp    = (Number(clan.xp) || 0) + amount;
    let requiredXp   = getRequiredClanXP(currentLevel);
    let leveledUp    = false;
    while (currentXp >= requiredXp) {
      currentXp -= requiredXp; currentLevel++; requiredXp = getRequiredClanXP(currentLevel); leveledUp = true;
    }
    await supabase.from('clans').update({ level: currentLevel, xp: currentXp }).eq('id', clanId);
    if (leveledUp) {
      const badge = getClanBadgeInfo(currentLevel);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clan-level-up', { detail: { clanId, level: currentLevel, title: badge.title } }));
    }
  } catch (err) { console.error('Failed to update clan XP:', err); }
}

// ─── Clan Shield SVG Badge (Evolves with Rank) ──────────────────────────────────
export function ClanShieldBadge({ level = 1, size = 32, showLevel = true, className = '' }: { level?: number | string; size?: number; showLevel?: boolean; className?: string }) {
  const numLevel = typeof level === 'string' ? parseInt(level) || 1 : level;
  const info  = getClanBadgeInfo(numLevel);
  const c     = info.color;
  const tier  = info.tier;
  const gradId = `csg_${numLevel}_${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <style>{`
        @keyframes csg-glow { 0%,100% { filter: drop-shadow(0 0 3px ${c.glow}); } 50% { filter: drop-shadow(0 0 9px ${c.glow}); } }
        @keyframes csg-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-1px); } }
      `}</style>
      <svg
        viewBox="0 0 36 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        style={{
          animation: tier >= 5 ? 'csg-glow 2.5s ease-in-out infinite, csg-float 3s ease-in-out infinite' : undefined,
          filter: `drop-shadow(0 0 ${Math.min(tier * 2, 10)}px ${c.glow})`
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="18" y1="2" x2="18" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor={c.from || c.secondary} />
            <stop offset="0.5" stopColor={c.primary} />
            <stop offset="1" stopColor={c.bg || '#0b0f17'} />
          </linearGradient>
          <linearGradient id={`${gradId}_hl`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="rgba(255,255,255,0.6)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* TIER 10: CELESTIAL ANGEL WINGS & HALO (Rank 150+) */}
        {tier === 10 && (
          <g filter={`drop-shadow(0 0 6px ${c.primary})`}>
            {/* Celestial Halo */}
            <ellipse cx="18" cy="3" rx="10" ry="2.5" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
            {/* 6-Feather Divine Wings */}
            <path d="M4 14 C-4 8 -6 18 -2 24 C0 26 5 21 6 18 Z" fill="url(#csg_gold)" stroke="#fff" strokeWidth="0.8" />
            <path d="M32 14 C40 8 42 18 38 24 C36 26 31 21 30 18 Z" fill="url(#csg_gold)" stroke="#fff" strokeWidth="0.8" />
            <path d="M2 18 C-6 16 -5 26 0 30 C2 31 6 25 6 22 Z" fill={c.secondary} />
            <path d="M34 18 C42 16 41 26 36 30 C34 31 30 25 30 22 Z" fill={c.secondary} />
          </g>
        )}

        {/* TIER 9: SHADOW CROWN & VOID WINGS (Rank 100-149) */}
        {tier === 9 && (
          <g>
            {/* 5-Spire Imperial Crown */}
            <path d="M10 6 L12 2 L15 5 L18 1 L21 5 L24 2 L26 6 Z" fill={c.primary} stroke={c.stroke} strokeWidth="0.8" />
            {/* Void Wings */}
            <path d="M3 14 C-3 10 -4 20 0 25 C2 27 6 21 6 17 Z" fill={c.secondary} />
            <path d="M33 14 C39 10 40 20 36 25 C34 27 30 21 30 17 Z" fill={c.secondary} />
          </g>
        )}

        {/* TIER 7 & 8: PHOENIX & FLAME WINGS (Rank 70-99) */}
        {(tier === 7 || tier === 8) && (
          <g opacity="0.95">
            <path d="M4 16 C-2 12 -3 22 1 26 C3 27 6 22 6 18 Z" fill={c.primary} />
            <path d="M32 16 C38 12 39 22 35 26 C33 27 30 22 30 18 Z" fill={c.primary} />
          </g>
        )}

        {/* TIER 4-6: RIVETS / SIDE NOTCH ORNAMENTS (Rank 30-69) */}
        {tier >= 4 && tier <= 6 && (
          <g opacity="0.8">
            <circle cx="2" cy="14" r="1.5" fill={c.stroke} />
            <circle cx="34" cy="14" r="1.5" fill={c.stroke} />
          </g>
        )}

        {/* ─── MAIN SHIELD GEOMETRY BY RANK TIER ─────────────────── */}
        {/* Tier 5 & 6: Sci-Fantasy Hexagonal & Diamond Cut */}
        {tier === 5 || tier === 6 ? (
          <polygon
            points="18,4 32,10 32,26 18,39 4,26 4,10"
            fill={`url(#${gradId})`}
            stroke={c.stroke}
            strokeWidth="1.8"
          />
        ) : tier >= 7 ? (
          /* Tier 7+: Imperial Royal Aegis Shield */
          <path
            d="M6 5 L30 5 L31 20 C31 30 18 39 18 39 C18 39 5 30 5 20 Z"
            fill={`url(#${gradId})`}
            stroke={c.stroke}
            strokeWidth="2"
          />
        ) : tier === 2 ? (
          /* Tier 2: Spiked Iron Shield */
          <path
            d="M5 7 L18 3 L31 7 L31 22 C31 30 18 38 18 38 C18 38 5 30 5 22 Z"
            fill={`url(#${gradId})`}
            stroke={c.stroke}
            strokeWidth="1.6"
          />
        ) : (
          /* Tier 1 & 3 & 4: Classic Medieval Heater Shield */
          <path
            d="M6 5 L30 5 L30 22 C30 30 18 38 18 38 C18 38 6 30 6 22 Z"
            fill={`url(#${gradId})`}
            stroke={c.stroke}
            strokeWidth="1.5"
          />
        )}

        {/* Inner Glass Highlight Layer */}
        <path
          d="M8 7 L28 7 L28 20 C28 27 18 34 18 34 C18 34 8 27 8 20 Z"
          fill={`url(#${gradId}_hl)`}
          opacity="0.25"
        />

        {/* ─── INSIGNIA CRESTS & GEMS BY TIER ───────────────────── */}
        {/* Tier 10: Celestial Star of Divinity */}
        {tier === 10 && (
          <g transform="translate(18,20)">
            <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#fff" filter="drop-shadow(0 0 4px #fbbf24)" />
            <circle cx="0" cy="0" r="2.5" fill="#f43f5e" />
          </g>
        )}

        {/* Tier 9: Shadow Void Eye */}
        {tier === 9 && (
          <g transform="translate(18,20)">
            <polygon points="0,-6 5,0 0,6 -5,0" fill="#a855f7" stroke="#fff" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#fff" />
          </g>
        )}

        {/* Tier 8: Mythic Phoenix Crest */}
        {tier === 8 && (
          <g transform="translate(18,20)">
            <path d="M0,-6 L4,-1 L2,5 L-2,5 L-4,-1 Z" fill="#fda4af" stroke={c.stroke} strokeWidth="0.8" />
            <circle cx="0" cy="-1" r="1.8" fill="#fff" />
          </g>
        )}

        {/* Tier 7: Flame Sovereign Core */}
        {tier === 7 && (
          <g transform="translate(18,20)">
            <polygon points="0,-6 4,0 0,6 -4,0" fill="#f97316" stroke="#fff" strokeWidth="0.8" />
          </g>
        )}

        {/* Tier 5 & 6: Diamond Crystal Core */}
        {(tier === 5 || tier === 6) && (
          <g transform="translate(18,19)">
            <polygon points="0,-6 5,-1 0,5 -5,-1" fill={c.primary} stroke="#fff" strokeWidth="0.8" />
          </g>
        )}

        {/* Tier 4: Gold Guild Cross Banner Crest */}
        {tier === 4 && (
          <g>
            <line x1="10" y1="14" x2="26" y2="14" stroke={c.stroke} strokeWidth="1.2" opacity="0.8" />
            <line x1="18" y1="8" x2="18" y2="26" stroke={c.stroke} strokeWidth="1.2" opacity="0.8" />
            <circle cx="18" cy="14" r="3" fill={c.primary} stroke="#fff" strokeWidth="0.8" />
          </g>
        )}

        {/* Tier 3: Silver Fleur-de-lis Gem */}
        {tier === 3 && (
          <g transform="translate(18,18)">
            <polygon points="0,-5 3,0 0,5 -3,0" fill={c.primary} stroke="#fff" strokeWidth="0.8" />
          </g>
        )}

        {/* Tier 2: Iron Vanguard Blade Cross */}
        {tier === 2 && (
          <g transform="translate(18,18)">
            <path d="M-1,-5 L1,-5 L1,5 L-1,5 Z" fill={c.stroke} />
            <path d="M-5,-1 L5,-1 L5,1 L-5,1 Z" fill={c.stroke} />
          </g>
        )}

        {/* Tier 1: Bronze Novice Chevron */}
        {tier === 1 && (
          <path d="M12 16 L18 21 L24 16" fill="none" stroke={c.stroke} strokeWidth="1.8" strokeLinecap="round" />
        )}

        {/* Star Badges at top for Tier 2+ */}
        {tier >= 2 && Array.from({ length: Math.min(tier, 5) }).map((_, i) => (
          <circle
            key={i}
            cx={14.5 + i * 1.8}
            cy="7"
            r="0.75"
            fill="#fff"
            opacity={0.85}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── XP Progress Bar ──────────────────────────────────────────────────────────
export function ClanXPProgressBar({ level = 1, xp = 0, className = '', themeColor }: { level?: number; xp?: number; className?: string; themeColor?: string }) {
  const info       = getClanBadgeInfo(level);
  const requiredCp = getRequiredClanXP(level);
  const percentage = Math.min(100, Math.floor((xp / requiredCp) * 100));
  const c          = info.color;

  return (
    <div className={`w-full bg-[#0d0d12] border border-white/15 rounded-2xl p-4 space-y-2.5 shadow-xl relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30" style={{ backgroundColor: themeColor || c.primary }} />
      <div className="flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-2 font-black text-white uppercase tracking-wider">
          <div className="p-1.5 rounded-lg border text-white shadow-sm" style={{ backgroundColor: `${(themeColor || c.primary)}30`, borderColor: `${(themeColor || c.primary)}60` }}>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="block leading-tight">Clan Points (CP)</span>
            <span className="text-[9px] font-mono text-zinc-400 font-normal">{info.title} • {xp} CP</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-black" style={{ color: themeColor || c.primary }}>
            {xp} <span className="text-zinc-400 font-normal">/ {requiredCp} CP</span>
          </span>
          <span className="block text-[10px] font-bold text-emerald-400">{percentage}% COMPLETE</span>
        </div>
      </div>
      <div className="w-full h-4 sm:h-5 bg-black/90 rounded-xl border border-white/20 overflow-hidden relative p-0.5 shadow-inner">
        <div
          className="h-full rounded-lg transition-all duration-500 shadow-lg relative flex items-center justify-end pr-2"
          style={{ width: `${Math.max(percentage, 4)}%`, backgroundColor: themeColor || c.primary }}
        >
          {percentage >= 15 && <span className="text-[10px] font-black font-mono text-white drop-shadow-md tracking-wider">{percentage}%</span>}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5 relative z-10">
        <span>Badge: <strong className="text-white font-bold uppercase">{info.title}</strong></span>
        <span>Next: <strong style={{ color: themeColor || c.primary }}>{requiredCp - xp} CP Needed</strong></span>
      </div>
    </div>
  );
}

// ─── Default inline badge (used in UI chips) ──────────────────────────────────
export default function ClanLevelBadge({ level = 1, xp = 0, className = '', showTitle = false }: ClanLevelBadgeProps) {
  const info = getClanBadgeInfo(level);
  const c    = info.color;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${className}`}
      style={{ background: `linear-gradient(to right, ${c.secondary}30, ${c.primary}30)`, borderColor: `${c.primary}50`, color: c.stroke, boxShadow: `0 0 8px ${c.glow}` }}
      title={`${info.title}${xp ? ` • ${xp} CP` : ''}`}
    >
      <ClanShieldBadge level={level} size={20} showLevel={false} />
      <span className="font-sans text-[10px] uppercase font-black tracking-wider">{info.title}</span>
      {xp > 0 && <span className="opacity-75 font-mono text-[9px]">({xp} CP)</span>}
    </span>
  );
}
