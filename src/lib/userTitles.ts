// ==============================================================================
// SHADOW GARDEN V2: USER TITLES & RANKS ENGINE (RECONSTRUCTED)
// Date: 2026-10-30
// Description:
//   Pure isolated logic for user titles, Board of Darkness admin titles,
//   Council of Shadows moderator titles, former honors, and single-active title sync.
// ==============================================================================

import { supabase } from '@/lib/supabase';

export type TitleCategory = 'level' | 'staff' | 'former' | 'special';

export interface TitleDefinition {
  id: string;
  title: string;
  category: TitleCategory;
  minLevel?: number;
  roles?: string[];
  description: string;
  badgeStyle: {
    bracketColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    glow?: string;
  };
}

// ── 1. Comprehensive Title Registry ───────────────────────────────────────────
export const ALL_TITLES: TitleDefinition[] = [
  // ── Level Progression Milestones (Free, earned through participation) ──
  {
    id: 'novice',
    title: 'Novice',
    category: 'level',
    minLevel: 1,
    description: 'Granted upon entering the Shadow realm.',
    badgeStyle: {
      bracketColor: 'text-zinc-400 font-medium',
      badgeBg: 'bg-zinc-800/80',
      badgeText: 'text-zinc-300',
      badgeBorder: 'border-zinc-700/60',
    },
  },
  {
    id: 'pathfinder',
    title: 'Pathfinder',
    category: 'level',
    minLevel: 5,
    description: 'Beginning exploration into uncharted territory.',
    badgeStyle: {
      bracketColor: 'text-zinc-300 font-medium',
      badgeBg: 'bg-zinc-700/40',
      badgeText: 'text-zinc-200',
      badgeBorder: 'border-zinc-600/50',
    },
  },
  {
    id: 'champion',
    title: 'Champion',
    category: 'level',
    minLevel: 10,
    description: 'Battle-tested initiate displaying martial potential.',
    badgeStyle: {
      bracketColor: 'text-sky-400 font-medium',
      badgeBg: 'bg-sky-950/40',
      badgeText: 'text-sky-300',
      badgeBorder: 'border-sky-500/40',
    },
  },
  {
    id: 'commander',
    title: 'Commander',
    category: 'level',
    minLevel: 20,
    description: 'Skilled operative executing guild missions.',
    badgeStyle: {
      bracketColor: 'text-blue-400 font-semibold',
      badgeBg: 'bg-blue-950/50',
      badgeText: 'text-blue-300',
      badgeBorder: 'border-blue-500/40',
    },
  },
  {
    id: 'vanguard',
    title: 'Vanguard',
    category: 'level',
    minLevel: 35,
    description: 'Frontline leader of Shadow expeditionary forces.',
    badgeStyle: {
      bracketColor: 'text-emerald-400 font-bold',
      badgeBg: 'bg-emerald-950/40',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/40',
    },
  },
  {
    id: 'grandmaster',
    title: 'Grandmaster',
    category: 'level',
    minLevel: 50,
    description: 'Master of shadow magic and battlefield tactics.',
    badgeStyle: {
      bracketColor: 'text-cyan-400 font-bold',
      badgeBg: 'bg-cyan-950/40',
      badgeText: 'text-cyan-300',
      badgeBorder: 'border-cyan-500/40',
    },
  },
  {
    id: 'sovereign',
    title: 'Sovereign',
    category: 'level',
    minLevel: 65,
    description: 'Eradicator of high-level realm threats.',
    badgeStyle: {
      bracketColor: 'text-violet-400 font-extrabold',
      badgeBg: 'bg-violet-950/40',
      badgeText: 'text-violet-300',
      badgeBorder: 'border-violet-500/40',
    },
  },
  {
    id: 'conqueror',
    title: 'Conqueror',
    category: 'level',
    minLevel: 80,
    description: 'Legendary warrior revered across kingdoms.',
    badgeStyle: {
      bracketColor: 'text-rose-400 font-extrabold',
      badgeBg: 'bg-rose-950/50',
      badgeText: 'text-rose-300',
      badgeBorder: 'border-rose-500/40',
    },
  },
  {
    id: 'overlord',
    title: 'Overlord',
    category: 'level',
    minLevel: 90,
    description: 'Wielder of ancient dark arts & shadow domain.',
    badgeStyle: {
      bracketColor: 'text-purple-400 font-black drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]',
      badgeBg: 'bg-purple-950/60',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-500/50',
      glow: 'rgba(168,85,247,0.5)',
    },
  },
  {
    id: 'monarch',
    title: 'Monarch',
    category: 'level',
    minLevel: 100,
    description: 'The ultimate level 100 supreme peak of power.',
    badgeStyle: {
      bracketColor: 'text-amber-300 font-black drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]',
      badgeBg: 'bg-amber-950/60',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/50',
      glow: 'rgba(251,191,36,0.6)',
    },
  },

  // ── Apex Staff Rank: Guild Master (Strictly 1 Worldwide) ──
  {
    id: 'guild_master',
    title: 'Guild Master',
    category: 'staff',
    roles: ['master', 'leader'],
    description: 'Supreme Guild Master of Shadow Garden. Absolute sovereign authority.',
    badgeStyle: {
      bracketColor: 'text-amber-400 font-black tracking-wide drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]',
      badgeBg: 'bg-amber-950/80',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/70',
      glow: 'rgba(251,191,36,0.8)',
    },
  },
  {
    id: 'shadow',
    title: 'Shadow',
    category: 'staff',
    roles: ['master', 'leader'],
    description: 'Supreme Guild Master of Shadow Garden. Absolute sovereign authority.',
    badgeStyle: {
      bracketColor: 'text-amber-400 font-black tracking-wide drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]',
      badgeBg: 'bg-amber-950/80',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/70',
      glow: 'rgba(251,191,36,0.8)',
    },
  },

  // ── Group I: Board of Darkness (Admins - Staff Ranks) ──
  {
    id: 'abyss_archon',
    title: 'Abyss Archon',
    category: 'staff',
    roles: ['admin'],
    description: 'High commander of the umbral depths. Board of Darkness administrator.',
    badgeStyle: {
      bracketColor: 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]',
      badgeBg: 'bg-purple-950/70',
      badgeText: 'text-purple-200',
      badgeBorder: 'border-purple-500/60',
      glow: 'rgba(168,85,247,0.5)',
    },
  },
  {
    id: 'void_monarch',
    title: 'Void Monarch',
    category: 'staff',
    roles: ['admin'],
    description: 'Wielder of boundless void dominion. Board of Darkness administrator.',
    badgeStyle: {
      bracketColor: 'text-violet-400 font-bold drop-shadow-[0_0_8px_rgba(139,92,246,0.7)]',
      badgeBg: 'bg-violet-950/70',
      badgeText: 'text-violet-200',
      badgeBorder: 'border-violet-500/60',
      glow: 'rgba(139,92,246,0.5)',
    },
  },
  {
    id: 'eclipse_blade',
    title: 'Eclipse Blade',
    category: 'staff',
    roles: ['admin'],
    description: 'Executor of celestial shadow strikes. Board of Darkness administrator.',
    badgeStyle: {
      bracketColor: 'text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]',
      badgeBg: 'bg-rose-950/70',
      badgeText: 'text-rose-200',
      badgeBorder: 'border-rose-500/60',
      glow: 'rgba(244,63,94,0.5)',
    },
  },
  {
    id: 'umbral_lord',
    title: 'Umbral Lord',
    category: 'staff',
    roles: ['admin'],
    description: 'Governor of realm underworld protocols. Board of Darkness administrator.',
    badgeStyle: {
      bracketColor: 'text-indigo-400 font-bold drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]',
      badgeBg: 'bg-indigo-950/70',
      badgeText: 'text-indigo-200',
      badgeBorder: 'border-indigo-500/60',
      glow: 'rgba(99,102,241,0.5)',
    },
  },
  {
    id: 'dark_primarch',
    title: 'Dark Primarch',
    category: 'staff',
    roles: ['admin'],
    description: 'Ancient keeper of the dark covenant. Board of Darkness administrator.',
    badgeStyle: {
      bracketColor: 'text-amber-300 font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]',
      badgeBg: 'bg-amber-950/70',
      badgeText: 'text-amber-200',
      badgeBorder: 'border-amber-500/60',
      glow: 'rgba(245,158,11,0.5)',
    },
  },
  {
    id: 'admin',
    title: 'Admin',
    category: 'staff',
    roles: ['admin'],
    description: 'High council administrator governing realm infrastructure.',
    badgeStyle: {
      bracketColor: 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]',
      badgeBg: 'bg-purple-950/70',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-500/50',
      glow: 'rgba(168,85,247,0.5)',
    },
  },

  // ── Group II: Council of Shadows (Moderators - Staff Ranks) ──
  {
    id: 'first_shadow',
    title: 'First Shadow',
    category: 'staff',
    roles: ['ai_leader'],
    description: 'Alpha, the first and eternal second-in-command of Shadow Garden.',
    badgeStyle: {
      bracketColor: 'text-purple-300 font-black tracking-wide drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]',
      badgeBg: 'bg-purple-950/80',
      badgeText: 'text-purple-200',
      badgeBorder: 'border-purple-500/70',
      glow: 'rgba(168,85,247,0.8)',
    },
  },
  {
    id: 'second_shadow',
    title: 'Second Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Beta, master of realm lore, intel, and strategic doctrine.',
    badgeStyle: {
      bracketColor: 'text-sky-300 font-extrabold drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]',
      badgeBg: 'bg-sky-950/70',
      badgeText: 'text-sky-200',
      badgeBorder: 'border-sky-500/60',
      glow: 'rgba(56,189,248,0.5)',
    },
  },
  {
    id: 'third_shadow',
    title: 'Third Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Gamma, financial and economic visionary of the shadow empire.',
    badgeStyle: {
      bracketColor: 'text-emerald-300 font-extrabold drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]',
      badgeBg: 'bg-emerald-950/70',
      badgeText: 'text-emerald-200',
      badgeBorder: 'border-emerald-500/60',
      glow: 'rgba(16,185,129,0.5)',
    },
  },
  {
    id: 'fourth_shadow',
    title: 'Fourth Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Delta, untamed martial power and supreme frontline enforcer.',
    badgeStyle: {
      bracketColor: 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]',
      badgeBg: 'bg-amber-950/70',
      badgeText: 'text-amber-200',
      badgeBorder: 'border-amber-500/60',
      glow: 'rgba(251,191,36,0.5)',
    },
  },
  {
    id: 'fifth_shadow',
    title: 'Fifth Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Epsilon, virtuoso of precision mana manipulation and espionage.',
    badgeStyle: {
      bracketColor: 'text-cyan-300 font-extrabold drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]',
      badgeBg: 'bg-cyan-950/70',
      badgeText: 'text-cyan-200',
      badgeBorder: 'border-cyan-500/60',
      glow: 'rgba(6,182,212,0.5)',
    },
  },
  {
    id: 'sixth_shadow',
    title: 'Sixth Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Zeta, phantom explorer operating behind hostile frontier lines.',
    badgeStyle: {
      bracketColor: 'text-violet-300 font-extrabold drop-shadow-[0_0_8px_rgba(139,92,246,0.7)]',
      badgeBg: 'bg-violet-950/70',
      badgeText: 'text-violet-200',
      badgeBorder: 'border-violet-500/60',
      glow: 'rgba(139,92,246,0.5)',
    },
  },
  {
    id: 'seventh_shadow',
    title: 'Seventh Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Eta, mastermind architect of realm artifacts and dark technology.',
    badgeStyle: {
      bracketColor: 'text-fuchsia-300 font-extrabold drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]',
      badgeBg: 'bg-fuchsia-950/70',
      badgeText: 'text-fuchsia-200',
      badgeBorder: 'border-fuchsia-500/60',
      glow: 'rgba(217,70,239,0.5)',
    },
  },
  {
    id: 'eighth_shadow',
    title: 'Eighth Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Omega, guardian of inner sanctum perimeter and order.',
    badgeStyle: {
      bracketColor: 'text-blue-300 font-extrabold drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]',
      badgeBg: 'bg-blue-950/70',
      badgeText: 'text-blue-200',
      badgeBorder: 'border-blue-500/60',
      glow: 'rgba(59,130,246,0.5)',
    },
  },
  {
    id: 'ninth_shadow',
    title: 'Ninth Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Phantom, elusive operative tracking clandestine realm threats.',
    badgeStyle: {
      bracketColor: 'text-teal-300 font-extrabold drop-shadow-[0_0_8px_rgba(20,184,166,0.7)]',
      badgeBg: 'bg-teal-950/70',
      badgeText: 'text-teal-200',
      badgeBorder: 'border-teal-500/60',
      glow: 'rgba(20,184,166,0.5)',
    },
  },
  {
    id: 'tenth_shadow',
    title: 'Tenth Shadow',
    category: 'staff',
    roles: ['moderator'],
    description: 'Mirage, master of distortion and perception control.',
    badgeStyle: {
      bracketColor: 'text-rose-300 font-extrabold drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]',
      badgeBg: 'bg-rose-950/70',
      badgeText: 'text-rose-200',
      badgeBorder: 'border-rose-500/60',
      glow: 'rgba(244,63,94,0.5)',
    },
  },
  {
    id: 'warden',
    title: 'Warden',
    category: 'staff',
    roles: ['moderator'],
    description: 'Enforcer of realm order and guardian of community peace.',
    badgeStyle: {
      bracketColor: 'text-blue-400 font-extrabold drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]',
      badgeBg: 'bg-blue-950/70',
      badgeText: 'text-blue-300',
      badgeBorder: 'border-blue-500/50',
      glow: 'rgba(59,130,246,0.5)',
    },
  },

  // ── Bestowed Former Official Titles (Permanent Legacy in Vault) ──
  {
    id: 'former_master',
    title: 'Former Guild Master',
    category: 'former',
    description: 'Honorary mantle retained by the revered predecessor of Shadow Garden.',
    badgeStyle: {
      bracketColor: 'text-amber-400 font-extrabold tracking-wide drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]',
      badgeBg: 'bg-amber-950/70',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/50',
      glow: 'rgba(251,191,36,0.6)',
    },
  },
  {
    id: 'former_admin',
    title: 'Former Admin',
    category: 'former',
    description: 'Honorary title retained by a veteran administrator of the realm.',
    badgeStyle: {
      bracketColor: 'text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]',
      badgeBg: 'bg-purple-950/60',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-500/40',
      glow: 'rgba(168,85,247,0.4)',
    },
  },
  {
    id: 'former_mod',
    title: 'Former Moderator',
    category: 'former',
    description: 'Honorary title retained by a guardian who once enforced realm order.',
    badgeStyle: {
      bracketColor: 'text-sky-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]',
      badgeBg: 'bg-sky-950/60',
      badgeText: 'text-sky-300',
      badgeBorder: 'border-sky-500/40',
      glow: 'rgba(56,189,248,0.4)',
    },
  },

  // ── Special & Achievement Titles ──
  {
    id: 'eminence_in_shadow',
    title: 'Eminence',
    category: 'special',
    description: 'One who lurks in shadows and slays the shadows from the unseen.',
    badgeStyle: {
      bracketColor: 'text-purple-400 font-bold',
      badgeBg: 'bg-purple-900/30',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-500/40',
    },
  },
  {
    id: 'ancient_primarch',
    title: 'Ancient Primarch',
    category: 'special',
    description: 'Bearer of forgotten celestial truths and ancient lineage.',
    badgeStyle: {
      bracketColor: 'text-amber-200 font-extrabold',
      badgeBg: 'bg-amber-900/30',
      badgeText: 'text-amber-200',
      badgeBorder: 'border-amber-400/40',
    },
  },
  {
    id: 'shadowblade',
    title: 'Shadowblade',
    category: 'special',
    description: 'Master of lethal precision and stealth strikes.',
    badgeStyle: {
      bracketColor: 'text-emerald-300 font-bold',
      badgeBg: 'bg-emerald-900/30',
      badgeText: 'text-emerald-200',
      badgeBorder: 'border-emerald-500/40',
    },
  },
];

// Helper to filter out meaningless titles
export const isInvalidTitle = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return true;
  const clean = val.trim().toLowerCase();
  return !clean || clean === 'anonymous' || clean === 'anonnymous' || clean === 'none';
};

// Guild Master apex authority checker
export function isGuildMaster(profile?: any): boolean {
  if (!profile || typeof profile !== 'object') return false;
  if (profile.role === 'master' || profile.role === 'leader') return true;
  if (profile.settings?.is_guild_master === true) return true;
  const adminTitle = (profile.admin_title || '').trim().toLowerCase();
  if (adminTitle === 'shadow' || adminTitle === 'guild master') return true;
  const currentTitle = (profile.title || profile.settings?.equipped_title || '').trim().toLowerCase();
  if (currentTitle === 'shadow' || currentTitle === 'guild master') {
    if (profile.role === 'admin' || profile.username?.toLowerCase() === 'ace_zero') return true;
  }
  if (profile.username && profile.username.toLowerCase() === 'ace_zero') {
    return true;
  }
  return false;
}

// ── Former Titles Persistence & Retrieval ─────────────────────────────────────
export function getFormerTitles(profile?: any): string[] {
  if (!profile || typeof profile !== 'object') return [];

  const titlesSet = new Set<string>();

  // 1. From settings.former_titles
  if (profile.settings && Array.isArray(profile.settings.former_titles)) {
    for (const t of profile.settings.former_titles) {
      if (typeof t === 'string' && t.trim()) titlesSet.add(t.trim());
    }
  }

  // 2. From column former_titles (if exists)
  if (Array.isArray(profile.former_titles)) {
    for (const t of profile.former_titles) {
      if (typeof t === 'string' && t.trim()) titlesSet.add(t.trim());
    }
  }

  // 3. Client localStorage cache
  if (typeof window !== 'undefined' && profile.id) {
    try {
      const saved = localStorage.getItem(`shadow_former_titles_${profile.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            if (typeof t === 'string' && t.trim()) titlesSet.add(t.trim());
          }
        }
      }
    } catch {}
  }

  return Array.from(titlesSet);
}

export async function addFormerTitle(profileId: string, titleName: string): Promise<void> {
  if (!profileId || !titleName) return;
  const clean = titleName.trim();

  // 1. Update localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`shadow_former_titles_${profileId}`);
      const list: string[] = saved ? JSON.parse(saved) : [];
      if (!list.includes(clean)) {
        list.push(clean);
        localStorage.setItem(`shadow_former_titles_${profileId}`, JSON.stringify(list));
      }
    } catch {}
  }

  // 2. Update Supabase profiles.settings
  try {
    const { data } = await supabase.from('profiles').select('settings').eq('id', profileId).single();
    const currentSettings = data?.settings || {};
    const formerList: string[] = Array.isArray(currentSettings.former_titles) ? currentSettings.former_titles : [];
    if (!formerList.includes(clean)) {
      formerList.push(clean);
      await supabase.from('profiles').update({
        settings: { ...currentSettings, former_titles: formerList }
      }).eq('id', profileId);
    }
  } catch (err) {
    console.warn('Error saving former title:', err);
  }
}

// ── 2. Determine All Titles Available to User ─────────────────────────────────
export function getAvailableTitles(profile: any): TitleDefinition[] {
  if (!profile || typeof profile !== 'object') {
    return [ALL_TITLES[0]]; // Novice default
  }

  const level = typeof profile.level === 'number' ? profile.level : 1;
  const role = profile.role || 'user';
  const master = isGuildMaster(profile);
  const isAlpha = profile.id === '5d38da6e-b568-4499-ab67-f588354add5d' || 
                  (profile.username && profile.username.toLowerCase() === 'alpha') ||
                  role === 'ai_leader';

  const available: TitleDefinition[] = [];

  // 1. Add all Level Milestones up to current level
  for (const t of ALL_TITLES) {
    if (t.category === 'level' && t.minLevel !== undefined && level >= t.minLevel) {
      available.push(t);
    }
  }

  // 2. Apex Staff Rank: Guild Master (Both Guild Master & Shadow titles unlocked)
  if (master) {
    const gmTitle = ALL_TITLES.find(t => t.id === 'guild_master');
    if (gmTitle && !available.some(a => a.id === gmTitle.id)) {
      available.push(gmTitle);
    }
    const shadowTitle = ALL_TITLES.find(t => t.id === 'shadow');
    if (shadowTitle && !available.some(a => a.id === shadowTitle.id)) {
      available.push(shadowTitle);
    }
  }

  // 3. Alpha AI
  if (isAlpha) {
    const firstShadow = ALL_TITLES.find(t => t.id === 'first_shadow');
    if (firstShadow && !available.some(a => a.id === firstShadow.id)) {
      available.push(firstShadow);
    }
  }

  // 4. Assigned Admin Title / Board of Darkness Title (Admins)
  if (role === 'admin' && !master) {
    if (profile.admin_title && !isInvalidTitle(profile.admin_title) && profile.admin_title.toLowerCase() !== 'shadow') {
      const assignedDef = getTitleDefinition(profile.admin_title);
      if (!available.some(a => a.title.toLowerCase() === assignedDef.title.toLowerCase())) {
        available.push({
          ...assignedDef,
          category: 'staff',
        });
      }
    } else {
      const adminDef = ALL_TITLES.find(t => t.id === 'admin');
      if (adminDef && !available.some(a => a.id === adminDef.id)) {
        available.push(adminDef);
      }
    }
  }

  // 5. Assigned Moderator Title / Council of Shadows Title (Moderators)
  if (role === 'moderator') {
    if (profile.admin_title && !isInvalidTitle(profile.admin_title)) {
      const assignedDef = getTitleDefinition(profile.admin_title);
      if (!available.some(a => a.title.toLowerCase() === assignedDef.title.toLowerCase())) {
        available.push({
          ...assignedDef,
          category: 'staff',
        });
      }
    } else {
      const wardenDef = ALL_TITLES.find(t => t.id === 'warden');
      if (wardenDef && !available.some(a => a.id === wardenDef.id)) {
        available.push(wardenDef);
      }
    }
  }

  // 6. Bestowed Former Legacy Titles (Permanent in Vault)
  const formerList = getFormerTitles(profile);
  for (const fTitle of formerList) {
    const trimmed = fTitle.trim();
    const existing = ALL_TITLES.find(t => t.title.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!available.some(a => a.id === existing.id)) available.push(existing);
    } else {
      available.push({
        id: `former_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        title: trimmed,
        category: 'former',
        description: 'Honorary former title permanently preserved in your vault.',
        badgeStyle: {
          bracketColor: 'text-amber-300 font-bold',
          badgeBg: 'bg-amber-950/40',
          badgeText: 'text-amber-200',
          badgeBorder: 'border-amber-500/40',
        },
      });
    }
  }

  // 7. Explicit DB custom title (profile.title) if not already present
  if (profile.title && !isInvalidTitle(profile.title)) {
    const def = getTitleDefinition(profile.title);
    if (!available.some(a => a.title.toLowerCase() === def.title.toLowerCase())) {
      available.push(def);
    }
  }

  // Ensure Novice is at least present
  if (available.length === 0) {
    available.push(ALL_TITLES[0]);
  }

  return available;
}

// ── 3. Resolve Highest Level Milestone ─────────────────────────────────────────
export function getHighestMilestoneTitle(profile?: any): string {
  const lvl = typeof profile?.level === 'number' ? profile.level : 1;
  const levelTitles = ALL_TITLES
    .filter(t => t.category === 'level' && t.minLevel !== undefined && lvl >= t.minLevel)
    .sort((a, b) => (b.minLevel || 0) - (a.minLevel || 0));

  if (levelTitles.length > 0) {
    return levelTitles[0].title;
  }
  return 'Novice';
}

// ── 4. Resolve Single Active Equipped Title for Display ──────────────────────
// Rule: Exactly ONE title active at a time worldwide across all sources.
export function getEquippedTitle(profile?: any): string {
  if (!profile || typeof profile !== 'object') return 'Novice';

  const master = isGuildMaster(profile);

  // 1. Check local client optimistic override first (for instant UX feedback)
  if (typeof window !== 'undefined' && profile.id) {
    const local = localStorage.getItem(`shadow_equipped_title_${profile.id}`);
    if (local && !isInvalidTitle(local)) {
      const clean = local.trim();
      const lower = clean.toLowerCase();
      if (lower === 'shadow' || lower === 'guild master') {
        if (master) return lower === 'shadow' ? 'Shadow' : 'Guild Master';
      } else {
        return clean;
      }
    }
  }

  // 1b. Check direct profile.equipped_title override
  if (profile.equipped_title && !isInvalidTitle(profile.equipped_title)) {
    const clean = profile.equipped_title.trim();
    const lower = clean.toLowerCase();
    if (lower === 'shadow' || lower === 'guild master') {
      if (master) return lower === 'shadow' ? 'Shadow' : 'Guild Master';
    } else {
      return clean;
    }
  }

  // 2. Check profile.settings.equipped_title
  if (profile.settings?.equipped_title && !isInvalidTitle(profile.settings.equipped_title)) {
    const clean = profile.settings.equipped_title.trim();
    const lower = clean.toLowerCase();
    if (lower === 'shadow' || lower === 'guild master') {
      if (master) return lower === 'shadow' ? 'Shadow' : 'Guild Master';
    } else {
      return clean;
    }
  }

  // 3. Check profile.title (canonical Supabase column)
  if (profile.title && !isInvalidTitle(profile.title)) {
    const clean = profile.title.trim();
    const lower = clean.toLowerCase();
    if (lower === 'shadow' || lower === 'guild master') {
      if (master) return lower === 'shadow' ? 'Shadow' : 'Guild Master';
    } else {
      return clean;
    }
  }

  // 4. Default fallbacks:
  // Alpha AI
  if (profile.id === '5d38da6e-b568-4499-ab67-f588354add5d' || (profile.username && profile.username.toLowerCase() === 'alpha') || profile.role === 'ai_leader') {
    return 'First Shadow';
  }

  // Guild Master defaults to 'Guild Master' (or 'Shadow')
  if (master) {
    return 'Guild Master';
  }

  // Admin defaults to assigned admin_title or 'Admin'
  if (profile.role === 'admin') {
    if (profile.admin_title && !isInvalidTitle(profile.admin_title) && profile.admin_title.toLowerCase() !== 'shadow' && profile.admin_title.toLowerCase() !== 'guild master') {
      return profile.admin_title.trim();
    }
    return 'Admin';
  }

  // Moderator defaults to assigned admin_title or 'Warden'
  if (profile.role === 'moderator') {
    if (profile.admin_title && !isInvalidTitle(profile.admin_title)) {
      return profile.admin_title.trim();
    }
    return 'Warden';
  }

  // Fallback to highest unlocked level milestone
  return getHighestMilestoneTitle(profile);
}

// ── 5. Get Title Definition by Title String or ID ─────────────────────────────
export function getTitleDefinition(titleOrId?: string | null): TitleDefinition {
  if (!titleOrId) return ALL_TITLES[0];
  const clean = titleOrId.trim().toLowerCase();
  const match = ALL_TITLES.find(t => t.id === clean || t.title.toLowerCase() === clean);
  if (match) return match;

  // Fallback ad-hoc definition
  return {
    id: clean,
    title: titleOrId.trim(),
    category: clean.startsWith('former') ? 'former' : 'special',
    description: clean.startsWith('former') ? 'Honorary former title permanently preserved in your vault.' : 'Honored Title',
    badgeStyle: {
      bracketColor: clean.startsWith('former') ? 'text-amber-300 font-bold' : 'text-purple-400 font-bold',
      badgeBg: clean.startsWith('former') ? 'bg-amber-950/40' : 'bg-purple-950/40',
      badgeText: clean.startsWith('former') ? 'text-amber-200' : 'text-purple-200',
      badgeBorder: clean.startsWith('former') ? 'border-amber-500/40' : 'border-purple-500/40',
    },
  };
}

// ── 6. Next Milestone Progress Calculator ─────────────────────────────────────
export function getNextMilestone(level: number): {
  nextTitle: TitleDefinition | null;
  levelsRemaining: number;
  progressPercent: number;
} {
  const milestones = ALL_TITLES.filter(t => t.category === 'level' && t.minLevel !== undefined)
    .sort((a, b) => (a.minLevel || 0) - (b.minLevel || 0));

  const next = milestones.find(m => (m.minLevel || 0) > level);
  if (!next) {
    return { nextTitle: null, levelsRemaining: 0, progressPercent: 100 };
  }

  const prevMin = milestones.filter(m => (m.minLevel || 0) <= level).pop()?.minLevel || 0;
  const range = (next.minLevel || 100) - prevMin;
  const current = level - prevMin;
  const progressPercent = Math.min(100, Math.max(0, Math.round((current / (range || 1)) * 100)));

  return {
    nextTitle: next,
    levelsRemaining: (next.minLevel || 0) - level,
    progressPercent,
  };
}

// ── 7. Map Staff / Bestowed Titles to Their Exclusive Profile Frame ─────────────
export function getFrameForTitle(titleName?: string | null, role?: string | null): string | null {
  if (!titleName && !role) return null;
  const t = (titleName || '').trim().toLowerCase();
  const r = (role || '').trim().toLowerCase();

  // 1. Board of Darkness Admin Titles -> Exclusive Board Frames
  if (t === 'abyss archon') return 'abyss_archon';
  if (t === 'void monarch') return 'void_monarch';
  if (t === 'eclipse blade') return 'eclipse_blade';
  if (t === 'umbral lord') return 'umbral_lord';
  if (t === 'dark primarch') return 'dark_primarch';
  if (t === 'guild master' || t === 'shadow' || t === 'admin') return 'admin';

  // 2. Council of Shadows Moderator Titles -> Exclusive Council Frames
  if (t === 'first shadow') return 'first_shadow';
  if (t === 'second shadow') return 'second_shadow';
  if (t === 'third shadow') return 'third_shadow';
  if (t === 'fourth shadow') return 'fourth_shadow';
  if (t === 'fifth shadow') return 'fifth_shadow';
  if (t === 'sixth shadow') return 'sixth_shadow';
  if (t === 'seventh shadow') return 'seventh_shadow';
  if (t === 'eighth shadow') return 'eighth_shadow';
  if (t === 'ninth shadow') return 'ninth_shadow';
  if (t === 'tenth shadow') return 'tenth_shadow';
  if (t === 'the warden' || t === 'warden' || t === 'moderator') return 'moderator';

  // 3. Fallbacks by Staff Role
  if (r === 'admin' || r === 'leader' || r === 'master') return 'admin';
  if (r === 'moderator') return 'moderator';

  return null;
}

