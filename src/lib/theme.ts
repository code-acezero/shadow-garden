export interface ColorPalette {
  id: string;
  name: string;
  isDark: boolean;
  shades: {
    bg: string;        // Layer 0: Main background surface
    card: string;      // Layer 1: Card/Panel container surface
    border: string;    // Layer 2: Border / Divider highlight
    accent: string;    // Layer 3: Primary accent / Solid text / Button
  };
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'void-obsidian',
    name: 'Void Obsidian',
    isDark: true,
    shades: {
      bg: '#050505',
      card: '#0e0e11',
      border: '#1f1f26',
      accent: '#dc2626', // Solid Crimson
    },
  },
  {
    id: 'shadow-violet',
    name: 'Shadow Violet',
    isDark: true,
    shades: {
      bg: '#07050d',
      card: '#120d21',
      border: '#261b42',
      accent: '#9333ea', // Solid Violet
    },
  },
  {
    id: 'cyber-emerald',
    name: 'Cyber Emerald',
    isDark: true,
    shades: {
      bg: '#030d08',
      card: '#091c13',
      border: '#143b28',
      accent: '#10b981', // Solid Emerald
    },
  },
  {
    id: 'solar-gold',
    name: 'Solar Gold',
    isDark: true,
    shades: {
      bg: '#0d0903',
      card: '#1f1507',
      border: '#3b290e',
      accent: '#f59e0b', // Solid Amber/Gold
    },
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    isDark: true,
    shades: {
      bg: '#030814',
      card: '#0a142e',
      border: '#172c61',
      accent: '#3b82f6', // Solid Sapphire Blue
    },
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    isDark: true,
    shades: {
      bg: '#0d0408',
      card: '#1c0a13',
      border: '#3d1629',
      accent: '#f43f5e', // Solid Rose
    },
  },
  {
    id: 'monochrome-dark',
    name: 'Monochrome Dark',
    isDark: true,
    shades: {
      bg: '#000000',
      card: '#121212',
      border: '#282828',
      accent: '#ffffff', // Solid Pure White
    },
  },
  {
    id: 'monochrome-light',
    name: 'Monochrome Light',
    isDark: false,
    shades: {
      bg: '#ffffff',
      card: '#f4f4f5',
      border: '#e4e4e7',
      accent: '#09090b', // Solid Pitch Black
    },
  },
  {
    id: 'scarlet-crimson',
    name: 'Scarlet Crimson',
    isDark: true,
    shades: {
      bg: '#0a0203',
      card: '#1c0609',
      border: '#3d0d14',
      accent: '#ef4444', // Solid Scarlet
    },
  },
  {
    id: 'vortex-cyan',
    name: 'Vortex Cyan',
    isDark: true,
    shades: {
      bg: '#020d0d',
      card: '#061d1d',
      border: '#0d3d3d',
      accent: '#06b6d4', // Solid Cyan
    },
  },
];

export function applyColorPalette(paletteId: string) {
  if (typeof document === 'undefined') return;

  const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
  const root = document.documentElement;

  root.style.setProperty('--bg-surface', palette.shades.bg);
  root.style.setProperty('--card-surface', palette.shades.card);
  root.style.setProperty('--border-highlight', palette.shades.border);
  root.style.setProperty('--primary-accent', palette.shades.accent);

  localStorage.setItem('shadow_color_palette', palette.id);
}
