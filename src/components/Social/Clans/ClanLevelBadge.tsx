"use client";

import React from 'react';
import { Shield, Award, Crown, Flame, Star, Zap, Gem, Compass, TrendingUp } from 'lucide-react';

interface ClanLevelBadgeProps {
  level?: number;
  className?: string;
  showTitle?: boolean;
}

export function getClanBadgeInfo(level: number = 1) {
  if (level >= 150) {
    return {
      tier: 10,
      title: "Celestial Realm",
      color: "from-amber-400 via-rose-500 to-purple-600 text-amber-200 border-amber-400/40 shadow-amber-500/20",
      icon: Crown,
      iconColor: "text-amber-300"
    };
  } else if (level >= 100) {
    return {
      tier: 9,
      title: "Shadow Crown",
      color: "from-purple-600 via-indigo-600 to-violet-900 text-purple-200 border-purple-400/40 shadow-purple-500/20",
      icon: Crown,
      iconColor: "text-purple-300"
    };
  } else if (level >= 90) {
    return {
      tier: 8,
      title: "Mythic Phoenix",
      color: "from-red-500 via-orange-500 to-amber-600 text-orange-200 border-orange-400/40 shadow-orange-500/20",
      icon: Award,
      iconColor: "text-orange-300"
    };
  } else if (level >= 70) {
    return {
      tier: 7,
      title: "Flame Sovereign",
      color: "from-amber-600 via-red-600 to-yellow-500 text-amber-200 border-amber-500/40 shadow-amber-600/20",
      icon: Flame,
      iconColor: "text-amber-400"
    };
  } else if (level >= 50) {
    return {
      tier: 6,
      title: "Diamond Legion",
      color: "from-cyan-400 via-sky-500 to-blue-600 text-cyan-200 border-cyan-400/40 shadow-cyan-500/20",
      icon: Gem,
      iconColor: "text-cyan-300"
    };
  } else if (level >= 40) {
    return {
      tier: 5,
      title: "Platinum Order",
      color: "from-slate-300 via-zinc-400 to-slate-500 text-slate-200 border-slate-300/40 shadow-slate-400/20",
      icon: Star,
      iconColor: "text-slate-200"
    };
  } else if (level >= 30) {
    return {
      tier: 4,
      title: "Gold Guild",
      color: "from-yellow-400 via-amber-500 to-yellow-600 text-yellow-100 border-yellow-400/40 shadow-yellow-500/20",
      icon: Award,
      iconColor: "text-yellow-300"
    };
  } else if (level >= 20) {
    return {
      tier: 3,
      title: "Silver Knight",
      color: "from-gray-400 via-slate-400 to-zinc-500 text-gray-200 border-gray-400/30 shadow-gray-400/10",
      icon: Shield,
      iconColor: "text-gray-300"
    };
  } else if (level >= 10) {
    return {
      tier: 2,
      title: "Iron Vanguard",
      color: "from-zinc-600 via-neutral-600 to-zinc-700 text-zinc-300 border-zinc-500/30",
      icon: Zap,
      iconColor: "text-zinc-400"
    };
  } else {
    return {
      tier: 1,
      title: "Bronze Novice",
      color: "from-amber-800 via-amber-900 to-stone-900 text-amber-300 border-amber-700/30",
      icon: Compass,
      iconColor: "text-amber-400"
    };
  }
}

export function getRequiredClanXP(level: number = 1): number {
  const lvl = Math.max(1, Math.floor(level));
  // Progressive RPG exponential scaling curve:
  // Lv 1: 500 CP
  // Lv 2: 1,600 CP
  // Lv 3: 3,660 CP
  // Lv 4: 6,580 CP
  // Lv 5: 10,230 CP
  // Lv 10: 40,040 CP
  // Lv 20: 148,000 CP
  return Math.floor(500 * lvl + (Math.pow(lvl - 1, 1.85) * 600));
}

export async function addClanXP(supabase: any, clanId: string, amount: number) {
  if (!supabase || !clanId) return;

  try {
    const { data: clan, error } = await supabase
      .from('clans')
      .select('level, xp, name')
      .eq('id', clanId)
      .single();

    if (error || !clan) return;

    let currentLevel = Number(clan.level) || 1;
    let currentXp = (Number(clan.xp) || 0) + amount;
    let requiredXp = getRequiredClanXP(currentLevel);
    let leveledUp = false;

    while (currentXp >= requiredXp) {
      currentXp -= requiredXp;
      currentLevel += 1;
      requiredXp = getRequiredClanXP(currentLevel);
      leveledUp = true;
    }

    await supabase
      .from('clans')
      .update({ level: currentLevel, xp: currentXp })
      .eq('id', clanId);

    if (leveledUp) {
      const badge = getClanBadgeInfo(currentLevel);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('clan-level-up', {
          detail: { clanId, level: currentLevel, title: badge.title }
        });
        window.dispatchEvent(event);
      }
    }
  } catch (err) {
    console.error('Failed to update clan XP:', err);
  }
}

export function ClanXPProgressBar({
  level = 1,
  xp = 0,
  className = "",
  themeColor
}: {
  level?: number;
  xp?: number;
  className?: string;
  themeColor?: string;
}) {
  const info = getClanBadgeInfo(level);
  const currentLevel = level;
  const currentCp = xp;
  const requiredCp = getRequiredClanXP(currentLevel);
  const percentage = Math.min(100, Math.floor((currentCp / requiredCp) * 100));

  return (
    <div className={`w-full bg-[#0d0d12] border border-white/15 rounded-2xl p-4 space-y-2.5 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30"
        style={{ backgroundColor: themeColor || '#6366f1' }}
      />

      <div className="flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-2 font-black text-white uppercase tracking-wider text-xs">
          <div
            className="p-1.5 rounded-lg border text-white shadow-sm"
            style={{ backgroundColor: themeColor ? `${themeColor}30` : 'rgba(99, 102, 241, 0.2)', borderColor: themeColor ? `${themeColor}60` : 'rgba(99, 102, 241, 0.3)' }}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="block leading-tight">Clan Points (CP)</span>
            <span className="text-[9px] font-mono text-zinc-400 font-normal">Level {currentLevel} • {info.title}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-black" style={{ color: themeColor || '#818cf8' }}>
            {currentCp} <span className="text-zinc-400 font-normal">/ {requiredCp} CP</span>
          </span>
          <span className="block text-[10px] font-bold text-emerald-400">{percentage}% COMPLETE</span>
        </div>
      </div>

      {/* Bold Progress Bar Container */}
      <div className="w-full h-4 sm:h-5 bg-black/90 rounded-xl border border-white/20 overflow-hidden relative p-0.5 shadow-inner">
        <div
          className={`h-full rounded-lg transition-all duration-500 shadow-lg relative flex items-center justify-end pr-2 ${!themeColor ? `bg-gradient-to-r ${info.color}` : ''}`}
          style={{
            width: `${Math.max(percentage, 5)}%`,
            backgroundColor: themeColor || undefined
          }}
        >
          {percentage >= 15 && (
            <span className="text-[10px] font-black font-mono text-white drop-shadow-md tracking-wider">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5 relative z-10">
        <span>Current Badge: <strong className="text-white font-bold uppercase tracking-wider">{info.title}</strong></span>
        <span>Next Upgrade: <strong className="text-primary-300 font-bold">{requiredCp - currentCp} CP Needed</strong></span>
      </div>
    </div>
  );
}

export default function ClanLevelBadge({ level = 1, className = "", showTitle = false }: ClanLevelBadgeProps) {
  const info = getClanBadgeInfo(level);
  const IconComponent = info.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gradient-to-r ${info.color} shadow-sm backdrop-blur-md ${className}`}
      title={`Clan Level ${level} • ${info.title}`}
    >
      <IconComponent className={`w-3 h-3 ${info.iconColor}`} />
      <span>Lv. {level}</span>
      {showTitle && <span className="font-sans text-[9px] uppercase tracking-wider ml-1 opacity-90">{info.title}</span>}
    </span>
  );
}
