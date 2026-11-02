import { catalog, type FrameMeta } from './frames/engine';

export const LEVEL_MILESTONES: Record<string, number> = {
  'iron-seal': 5,
  'bronze-crest': 10,
  'silver-knight': 20,
  'crimson-blade': 35,
  'sapphire-arc': 50,
  'emerald-wilds': 65,
  'golden-realm': 75,
  'shadow-void': 85,
  'celestial-rift': 95,
  'divine-archon': 100,
  'arcane-runic-circle': 100,
};

const LEGACY_ID_MAP: Record<string, string> = {
  // Staff & Special
  'admin': 'the-eternal',
  'eternal': 'the-eternal',
  'the_eternal': 'the-eternal',
  'the-eternal': 'the-eternal',
  'moderator': 'the-warden',
  'warden': 'the-warden',
  'the_warden': 'the-warden',
  'the-warden': 'the-warden',
  'magic_circle': 'arcane-runic-circle',
  'magic-circle': 'arcane-runic-circle',
  
  // Level Progression Frames
  'iron': 'iron-seal',
  'bronze': 'bronze-crest',
  'silver': 'silver-knight',
  'crimson': 'crimson-blade',
  'sapphire': 'sapphire-arc',
  'emerald': 'emerald-wilds',
  'golden': 'golden-realm',
  'shadow': 'shadow-void',
  'celestial': 'celestial-rift',
  'divine': 'divine-archon',

  // Board of Darkness
  'abyss_archon': 'abyss-archon',
  'void_monarch': 'void-monarch',
  'eclipse_blade': 'eclipse-blade',
  'umbral_lord': 'umbral-lord',
  'dark_primarch': 'dark-primarch',

  // Council of Shadows
  'first_shadow': 'first-shadow',
  'second_shadow': 'second-shadow',
  'third_shadow': 'third-shadow',
  'fourth_shadow': 'fourth-shadow',
  'fifth_shadow': 'fifth-shadow',
  'sixth_shadow': 'sixth-shadow',
  'seventh_shadow': 'seventh-shadow',
  'eighth_shadow': 'eighth-shadow',
  'ninth_shadow': 'ninth-shadow',
  'tenth_shadow': 'tenth-shadow',
};

const CATALOG_SET = new Set(catalog.map((c) => c.id));

/**
 * Normalizes any frame id (legacy snake_case, short names, or aliases)
 * to the exact engine catalog id. Returns 'none' if invalid.
 */
export function normalizeFrameId(rawId?: string | null): string {
  if (!rawId || rawId === 'none') return 'none';
  const clean = rawId.trim().toLowerCase();
  
  // Direct catalog match
  if (CATALOG_SET.has(clean)) return clean;

  // Direct alias match
  if (LEGACY_ID_MAP[clean]) return LEGACY_ID_MAP[clean];

  // Try kebab-case
  const kebab = clean.replace(/_/g, '-');
  if (CATALOG_SET.has(kebab)) return kebab;
  if (LEGACY_ID_MAP[kebab]) return LEGACY_ID_MAP[kebab];

  return clean;
}

export function isEternalFrame(id?: string | null): boolean {
  if (!id) return false;
  const n = normalizeFrameId(id);
  return n === 'the-eternal';
}

export function isWardenFrame(id?: string | null): boolean {
  if (!id) return false;
  const n = normalizeFrameId(id);
  return n === 'the-warden';
}

export function isStaffFrame(id?: string | null): boolean {
  if (!id) return false;
  const n = normalizeFrameId(id);
  return (
    n === 'the-eternal' ||
    n === 'the-warden' ||
    catalog.some((c) => c.id === n && (c.group.startsWith('title') || n === 'the-eternal' || n === 'the-warden'))
  );
}

export interface KagemiStoreFrame {
  id: string;
  name: string;
  type: 'store' | 'level' | 'role';
  minLevel: number;
  price: number;
  tag: string;
  tierBadge: string;
  description: string;
  category: string;
  categoryName: string;
  color: string;
  colors: [string, string, string];
  group: FrameMeta['group'];
}

export const ALL_KAGEMI_FRAMES: KagemiStoreFrame[] = catalog.map((f) => {
  if (f.group === 'title-council-of-shadows') {
    return {
      id: f.id,
      name: f.name,
      type: 'role',
      minLevel: 0,
      price: 6000,
      tag: 'Council',
      tierBadge: 'Council of Shadows',
      description: f.description || `${f.name} - Official Council of Shadows Frame.`,
      category: 'cs',
      categoryName: 'Council of Shadows',
      color: '#c084fc',
      colors: ['#c084fc', '#8b5cf6', '#3b0764'],
      group: f.group,
    };
  }

  if (f.group === 'title-board-of-darkness') {
    return {
      id: f.id,
      name: f.name,
      type: 'role',
      minLevel: 0,
      price: 4500,
      tag: 'Darkness',
      tierBadge: 'Board of Darkness',
      description: f.description || `${f.name} - Official Board of Darkness Frame.`,
      category: 'bd',
      categoryName: 'Board of Darkness',
      color: '#e11d48',
      colors: ['#e11d48', '#991b1b', '#000000'],
      group: f.group,
    };
  }

  if (f.group === 'level') {
    const isSpecialRole = f.id === 'the-eternal' || f.id === 'the-warden';
    const lvl = LEVEL_MILESTONES[f.id] || 0;
    return {
      id: f.id,
      name: f.name,
      type: isSpecialRole ? 'role' : 'level',
      minLevel: lvl,
      price: 0,
      tag: isSpecialRole ? (f.id === 'the-eternal' ? 'Guild Master' : 'Warden') : `Lv. ${lvl}`,
      tierBadge: isSpecialRole ? 'Exclusive' : 'Milestone',
      description: f.description || `${f.name} aura frame.`,
      category: isSpecialRole ? 'role' : 'lv',
      categoryName: isSpecialRole ? 'Supreme Staff' : 'Level Milestones',
      color: f.id === 'the-eternal' ? '#f59e0b' : '#38bdf8',
      colors: ['#fbbf24', '#f59e0b', '#78350f'],
      group: f.group,
    };
  }

  // Store Collections
  return {
    id: f.id,
    name: f.name,
    type: 'store',
    minLevel: 0,
    price: f.price || 500,
    tag: f.rarity || 'Common',
    tierBadge: f.tier ? `Tier ${f.tier}` : 'Store',
    description: f.description || `${f.rarity || 'Store'} ${f.collection} Frame.`,
    category: f.collectionKey || 'st',
    categoryName: f.collection || 'Steampunk',
    color: '#38bdf8',
    colors: ['#38bdf8', '#0284c7', '#082f49'],
    group: f.group,
  };
});
