export interface ThemeLayers {
  layer0_bg: string;        // Deepest background canvas
  layer1_card: string;      // Container / Card / Panel surface
  layer2_elevated: string;  // Elevated dropdowns, modals, hover states
  layer3_border: string;    // Crisp borders and dividers
  layer4_accent: string;    // Primary brand accent / CTAs
  layer5_sky: string;       // Secondary highlight / Sky accent
  text: string;             // Primary text
  textMuted: string;        // Secondary muted text
}

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  category: 'Astral & Space' | 'Elemental' | 'Cyber & Neon' | 'Classic & Monochrome' | 'Pastel & Anime';
  dark: ThemeLayers;
  light: ThemeLayers;
}

export const COLOR_PALETTES: ColorPalette[] = [
  // 1. SKY PURPLE VIOLET (Default)
  {
    id: 'sky-purple-violet',
    name: 'Sky Purple Violet',
    description: 'Celestial sky blue & ethereal purple-violet aura inspired by twilight skies.',
    category: 'Astral & Space',
    dark: {
      layer0_bg: '#070512',
      layer1_card: '#0f0b24',
      layer2_elevated: '#1a133b',
      layer3_border: '#2e2163',
      layer4_accent: '#8b5cf6',
      layer5_sky: '#38bdf8',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    },
    light: {
      layer0_bg: '#f8f7ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#ede9fe',
      layer3_border: '#ddd6fe',
      layer4_accent: '#7c3aed',
      layer5_sky: '#0284c7',
      text: '#0f172a',
      textMuted: '#64748b',
    },
  },

  // 2. VOID OBSIDIAN / CRIMSON (Shadow Garden Original)
  {
    id: 'void-crimson',
    name: 'Void Crimson',
    description: 'Pitch obsidian shadows accented with blood-red crimson flames.',
    category: 'Classic & Monochrome',
    dark: {
      layer0_bg: '#050505',
      layer1_card: '#0f0f13',
      layer2_elevated: '#17171f',
      layer3_border: '#282833',
      layer4_accent: '#ef4444',
      layer5_sky: '#f87171',
      text: '#fafafa',
      textMuted: '#a1a1aa',
    },
    light: {
      layer0_bg: '#fafafa',
      layer1_card: '#ffffff',
      layer2_elevated: '#fee2e2',
      layer3_border: '#fecaca',
      layer4_accent: '#dc2626',
      layer5_sky: '#b91c1c',
      text: '#18181b',
      textMuted: '#71717a',
    },
  },

  // 3. CYBER EMERALD
  {
    id: 'cyber-emerald',
    name: 'Cyber Emerald',
    description: 'Deep digital rainforest infused with radiant emerald and mint green.',
    category: 'Cyber & Neon',
    dark: {
      layer0_bg: '#030d08',
      layer1_card: '#081a11',
      layer2_elevated: '#0f291c',
      layer3_border: '#1b4731',
      layer4_accent: '#10b981',
      layer5_sky: '#34d399',
      text: '#f0fdf4',
      textMuted: '#86efac',
    },
    light: {
      layer0_bg: '#f0fdf4',
      layer1_card: '#ffffff',
      layer2_elevated: '#dcfce7',
      layer3_border: '#bbf7d0',
      layer4_accent: '#059669',
      layer5_sky: '#10b981',
      text: '#064e3b',
      textMuted: '#047857',
    },
  },

  // 4. SOLAR GOLD
  {
    id: 'solar-gold',
    name: 'Solar Gold',
    description: 'Warm obsidian dusk balanced with golden sunlight and radiant amber.',
    category: 'Elemental',
    dark: {
      layer0_bg: '#0c0802',
      layer1_card: '#1a1205',
      layer2_elevated: '#281c08',
      layer3_border: '#45300d',
      layer4_accent: '#f59e0b',
      layer5_sky: '#fbbf24',
      text: '#fffbeb',
      textMuted: '#fcd34d',
    },
    light: {
      layer0_bg: '#fffdf5',
      layer1_card: '#ffffff',
      layer2_elevated: '#fef3c7',
      layer3_border: '#fde68a',
      layer4_accent: '#d97706',
      layer5_sky: '#b45309',
      text: '#451a03',
      textMuted: '#78350f',
    },
  },

  // 5. MIDNIGHT SAPPHIRE
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    description: 'Abyssal navy trench elevated with cobalt blue and sapphire crystalline.',
    category: 'Astral & Space',
    dark: {
      layer0_bg: '#020713',
      layer1_card: '#081229',
      layer2_elevated: '#0f2042',
      layer3_border: '#1a356e',
      layer4_accent: '#3b82f6',
      layer5_sky: '#60a5fa',
      text: '#eff6ff',
      textMuted: '#93c5fd',
    },
    light: {
      layer0_bg: '#f0f6ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#dbeafe',
      layer3_border: '#bfdbfe',
      layer4_accent: '#2563eb',
      layer5_sky: '#1d4ed8',
      text: '#172554',
      textMuted: '#1e40af',
    },
  },

  // 6. ROSE QUARTZ
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    description: 'Blossoming sakura pink tones floating over velvet plum darkness.',
    category: 'Pastel & Anime',
    dark: {
      layer0_bg: '#0d0408',
      layer1_card: '#1c0a13',
      layer2_elevated: '#2e1221',
      layer3_border: '#4f1e39',
      layer4_accent: '#f43f5e',
      layer5_sky: '#fb7185',
      text: '#fff1f2',
      textMuted: '#fda4af',
    },
    light: {
      layer0_bg: '#fff5f7',
      layer1_card: '#ffffff',
      layer2_elevated: '#ffe4e6',
      layer3_border: '#fecdd3',
      layer4_accent: '#e11d48',
      layer5_sky: '#be123c',
      text: '#4c0519',
      textMuted: '#9f1239',
    },
  },

  // 7. VORTEX CYAN
  {
    id: 'vortex-cyan',
    name: 'Vortex Cyan',
    description: 'Hyper-saturated electric cyan and aquamarine from an anime quantum core.',
    category: 'Cyber & Neon',
    dark: {
      layer0_bg: '#020b0e',
      layer1_card: '#06171d',
      layer2_elevated: '#0a2630',
      layer3_border: '#123e4f',
      layer4_accent: '#06b6d4',
      layer5_sky: '#22d3ee',
      text: '#ecfeff',
      textMuted: '#67e8f9',
    },
    light: {
      layer0_bg: '#f0fdff',
      layer1_card: '#ffffff',
      layer2_elevated: '#cffafe',
      layer3_border: '#a5f3fc',
      layer4_accent: '#0891b2',
      layer5_sky: '#0e7490',
      text: '#083344',
      textMuted: '#155e75',
    },
  },

  // 8. AMETHYST TWILIGHT
  {
    id: 'amethyst-twilight',
    name: 'Amethyst Twilight',
    description: 'Deep mystical amethyst jewel tones with soft starlight violet luminescence.',
    category: 'Astral & Space',
    dark: {
      layer0_bg: '#090412',
      layer1_card: '#130a24',
      layer2_elevated: '#1f113a',
      layer3_border: '#351d63',
      layer4_accent: '#9333ea',
      layer5_sky: '#a855f7',
      text: '#faf5ff',
      textMuted: '#d8b4fe',
    },
    light: {
      layer0_bg: '#fcf8ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#f3e8ff',
      layer3_border: '#e9d5ff',
      layer4_accent: '#7e22ce',
      layer5_sky: '#6b21a8',
      text: '#3b0764',
      textMuted: '#581c87',
    },
  },

  // 9. HYPER ORANGE
  {
    id: 'hyper-orange',
    name: 'Hyper Orange',
    description: 'Energetic shounen anime protagonist orange bursting with solar intensity.',
    category: 'Elemental',
    dark: {
      layer0_bg: '#0d0702',
      layer1_card: '#1c1005',
      layer2_elevated: '#2d1a08',
      layer3_border: '#4a2b0e',
      layer4_accent: '#f97316',
      layer5_sky: '#fb923c',
      text: '#fff7ed',
      textMuted: '#fdba74',
    },
    light: {
      layer0_bg: '#fffaf5',
      layer1_card: '#ffffff',
      layer2_elevated: '#ffedd5',
      layer3_border: '#fed7aa',
      layer4_accent: '#ea580c',
      layer5_sky: '#c2410c',
      text: '#431407',
      textMuted: '#7c2d12',
    },
  },

  // 10. ARCTIC FROST
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Glacial crystal frost with crisp icy cyan reflections.',
    category: 'Elemental',
    dark: {
      layer0_bg: '#04090f',
      layer1_card: '#0a1622',
      layer2_elevated: '#102236',
      layer3_border: '#1b3b5c',
      layer4_accent: '#38bdf8',
      layer5_sky: '#7dd3fc',
      text: '#f0f9ff',
      textMuted: '#bae6fd',
    },
    light: {
      layer0_bg: '#f4faff',
      layer1_card: '#ffffff',
      layer2_elevated: '#e0f2fe',
      layer3_border: '#bae6fd',
      layer4_accent: '#0284c7',
      layer5_sky: '#0369a1',
      text: '#0c4a6e',
      textMuted: '#075985',
    },
  },

  // 11. PHANTOM MONO
  {
    id: 'phantom-mono',
    name: 'Phantom Mono',
    description: 'Precision stealth titanium, carbon fibers, and monochromatic pure contrasts.',
    category: 'Classic & Monochrome',
    dark: {
      layer0_bg: '#050505',
      layer1_card: '#121214',
      layer2_elevated: '#1c1c1f',
      layer3_border: '#2e2e33',
      layer4_accent: '#e4e4e7',
      layer5_sky: '#f4f4f5',
      text: '#ffffff',
      textMuted: '#a1a1aa',
    },
    light: {
      layer0_bg: '#ffffff',
      layer1_card: '#f4f4f5',
      layer2_elevated: '#e4e4e7',
      layer3_border: '#d4d4d8',
      layer4_accent: '#18181b',
      layer5_sky: '#27272a',
      text: '#09090b',
      textMuted: '#52525b',
    },
  },

  // 12. CELESTIAL GOLD
  {
    id: 'celestial-gold',
    name: 'Celestial Gold',
    description: 'Majestic royal palace marble intertwined with pure celestial yellow gold.',
    category: 'Elemental',
    dark: {
      layer0_bg: '#090703',
      layer1_card: '#141006',
      layer2_elevated: '#211a0a',
      layer3_border: '#382c12',
      layer4_accent: '#eab308',
      layer5_sky: '#facc15',
      text: '#fefce8',
      textMuted: '#fef08a',
    },
    light: {
      layer0_bg: '#fffef0',
      layer1_card: '#ffffff',
      layer2_elevated: '#fef9c3',
      layer3_border: '#fef08a',
      layer4_accent: '#ca8a04',
      layer5_sky: '#a16207',
      text: '#422006',
      textMuted: '#713f12',
    },
  },

  // 13. BLOOD MOON
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    description: 'Ominous crimson dusk eclipse inspired by Tsukuyomi and vampire clans.',
    category: 'Classic & Monochrome',
    dark: {
      layer0_bg: '#0a0204',
      layer1_card: '#17060a',
      layer2_elevated: '#260a11',
      layer3_border: '#3f111c',
      layer4_accent: '#e11d48',
      layer5_sky: '#fb7185',
      text: '#fff1f2',
      textMuted: '#fda4af',
    },
    light: {
      layer0_bg: '#fff5f6',
      layer1_card: '#ffffff',
      layer2_elevated: '#ffe4e6',
      layer3_border: '#fecdd3',
      layer4_accent: '#be123c',
      layer5_sky: '#9f1239',
      text: '#4c0519',
      textMuted: '#881337',
    },
  },

  // 14. TOXIC LIME
  {
    id: 'toxic-lime',
    name: 'Toxic Lime',
    description: 'High-voltage radioactive neon lime green charging through dark matter.',
    category: 'Cyber & Neon',
    dark: {
      layer0_bg: '#060b02',
      layer1_card: '#0e1906',
      layer2_elevated: '#182b0b',
      layer3_border: '#284712',
      layer4_accent: '#84cc16',
      layer5_sky: '#a3e635',
      text: '#f7fee7',
      textMuted: '#bef264',
    },
    light: {
      layer0_bg: '#fafff2',
      layer1_card: '#ffffff',
      layer2_elevated: '#ecfccb',
      layer3_border: '#d9f99d',
      layer4_accent: '#65a30d',
      layer5_sky: '#4d7c0f',
      text: '#1a2e05',
      textMuted: '#3f6212',
    },
  },

  // 15. DEEP ABYSS
  {
    id: 'deep-abyss',
    name: 'Deep Abyss',
    description: 'Challenger Deep bioluminescent indigo waters with ocean trench echoes.',
    category: 'Astral & Space',
    dark: {
      layer0_bg: '#030510',
      layer1_card: '#070b21',
      layer2_elevated: '#0e1538',
      layer3_border: '#172354',
      layer4_accent: '#6366f1',
      layer5_sky: '#818cf8',
      text: '#eef2ff',
      textMuted: '#a5b4fc',
    },
    light: {
      layer0_bg: '#f5f7ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#e0e7ff',
      layer3_border: '#c7d2fe',
      layer4_accent: '#4f46e5',
      layer5_sky: '#4338ca',
      text: '#1e1b4b',
      textMuted: '#312e81',
    },
  },

  // 16. MAGMA VOLCANO
  {
    id: 'magma-volcano',
    name: 'Magma Volcano',
    description: 'Molten magma cracks illuminating ancient obsidian caldera rock.',
    category: 'Elemental',
    dark: {
      layer0_bg: '#0b0402',
      layer1_card: '#190a05',
      layer2_elevated: '#2a1109',
      layer3_border: '#451c0e',
      layer4_accent: '#f97316',
      layer5_sky: '#ef4444',
      text: '#fff7ed',
      textMuted: '#fdba74',
    },
    light: {
      layer0_bg: '#fffaf7',
      layer1_card: '#ffffff',
      layer2_elevated: '#ffedd5',
      layer3_border: '#fed7aa',
      layer4_accent: '#c2410c',
      layer5_sky: '#b91c1c',
      text: '#431407',
      textMuted: '#7c2d12',
    },
  },

  // 17. LAVENDER DREAM
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Serene lavender fields kissed by gentle dawn light and pastel calm.',
    category: 'Pastel & Anime',
    dark: {
      layer0_bg: '#08060f',
      layer1_card: '#110e1f',
      layer2_elevated: '#1c1731',
      layer3_border: '#312852',
      layer4_accent: '#a78bfa',
      layer5_sky: '#c4b5fd',
      text: '#f5f3ff',
      textMuted: '#ddd6fe',
    },
    light: {
      layer0_bg: '#faf8ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#ede9fe',
      layer3_border: '#ddd6fe',
      layer4_accent: '#7c3aed',
      layer5_sky: '#6d28d9',
      text: '#2e1065',
      textMuted: '#4c1d95',
    },
  },

  // 18. NEO TOKYO
  {
    id: 'neo-tokyo',
    name: 'Neo Tokyo',
    description: 'Cyberpunk Shibuya crossing bathed in neon magenta and holographic lights.',
    category: 'Cyber & Neon',
    dark: {
      layer0_bg: '#0b030b',
      layer1_card: '#1a071a',
      layer2_elevated: '#2b0c2b',
      layer3_border: '#471447',
      layer4_accent: '#d946ef',
      layer5_sky: '#e879f9',
      text: '#fdf4ff',
      textMuted: '#f0abfc',
    },
    light: {
      layer0_bg: '#fff7fe',
      layer1_card: '#ffffff',
      layer2_elevated: '#fae8ff',
      layer3_border: '#f5d0fe',
      layer4_accent: '#c026d3',
      layer5_sky: '#a21caf',
      text: '#4a044e',
      textMuted: '#701a75',
    },
  },

  // 19. FOREST MOSS
  {
    id: 'forest-moss',
    name: 'Forest Moss',
    description: 'Ancient enchanted forest grove with deep pine moss and morning dew.',
    category: 'Elemental',
    dark: {
      layer0_bg: '#040a06',
      layer1_card: '#0a140d',
      layer2_elevated: '#122216',
      layer3_border: '#1f3825',
      layer4_accent: '#22c55e',
      layer5_sky: '#4ade80',
      text: '#f0fdf4',
      textMuted: '#86efac',
    },
    light: {
      layer0_bg: '#f4fbf6',
      layer1_card: '#ffffff',
      layer2_elevated: '#dcfce7',
      layer3_border: '#bbf7d0',
      layer4_accent: '#16a34a',
      layer5_sky: '#15803d',
      text: '#052e16',
      textMuted: '#14532d',
    },
  },

  // 20. ROYAL REGALIA
  {
    id: 'royal-regalia',
    name: 'Royal Regalia',
    description: 'Empress velvet violet adorned with shimmering pure gold filigree.',
    category: 'Astral & Space',
    dark: {
      layer0_bg: '#07030e',
      layer1_card: '#120921',
      layer2_elevated: '#1f1036',
      layer3_border: '#351b5c',
      layer4_accent: '#8b5cf6',
      layer5_sky: '#eab308',
      text: '#faf5ff',
      textMuted: '#d8b4fe',
    },
    light: {
      layer0_bg: '#fcf8ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#f3e8ff',
      layer3_border: '#e9d5ff',
      layer4_accent: '#6d28d9',
      layer5_sky: '#ca8a04',
      text: '#3b0764',
      textMuted: '#581c87',
    },
  },

  // 21. SYNTHWAVE 80S
  {
    id: 'synthwave-80s',
    name: 'Synthwave 80s',
    description: 'Retro outrun grid with neon sunset pink, violet skies, and laser cyan.',
    category: 'Cyber & Neon',
    dark: {
      layer0_bg: '#090412',
      layer1_card: '#150926',
      layer2_elevated: '#220e3d',
      layer3_border: '#381663',
      layer4_accent: '#ec4899',
      layer5_sky: '#06b6d4',
      text: '#fdf2f8',
      textMuted: '#f472b6',
    },
    light: {
      layer0_bg: '#fff5fb',
      layer1_card: '#ffffff',
      layer2_elevated: '#fce7f3',
      layer3_border: '#fbcfe8',
      layer4_accent: '#db2777',
      layer5_sky: '#0891b2',
      text: '#500724',
      textMuted: '#831843',
    },
  },

  // 22. COFFEE MOCHA
  {
    id: 'coffee-mocha',
    name: 'Coffee Mocha',
    description: 'Cozy anime cafe warmth with roasted espresso, warm caramel, and cream.',
    category: 'Pastel & Anime',
    dark: {
      layer0_bg: '#0a0705',
      layer1_card: '#17100b',
      layer2_elevated: '#251b12',
      layer3_border: '#3b2b1d',
      layer4_accent: '#d97706',
      layer5_sky: '#fbbf24',
      text: '#fffbeb',
      textMuted: '#d97706',
    },
    light: {
      layer0_bg: '#fcf8f5',
      layer1_card: '#ffffff',
      layer2_elevated: '#f5ebe0',
      layer3_border: '#e6ccb2',
      layer4_accent: '#9c6644',
      layer5_sky: '#7f4f24',
      text: '#2b1b17',
      textMuted: '#582f0e',
    },
  },

  // 23. STELLAR NEBULA
  {
    id: 'stellar-nebula',
    name: 'Stellar Nebula',
    description: 'Deep cosmic nebula with swirling stardust violet and radiant teal.',
    category: 'Astral & Space',
    dark: {
      layer0_bg: '#040611',
      layer1_card: '#0a1026',
      layer2_elevated: '#121b3d',
      layer3_border: '#1f2e63',
      layer4_accent: '#6366f1',
      layer5_sky: '#14b8a6',
      text: '#eef2ff',
      textMuted: '#a5b4fc',
    },
    light: {
      layer0_bg: '#f6f8ff',
      layer1_card: '#ffffff',
      layer2_elevated: '#e0e7ff',
      layer3_border: '#c7d2fe',
      layer4_accent: '#4338ca',
      layer5_sky: '#0d9488',
      text: '#1e1b4b',
      textMuted: '#312e81',
    },
  },
];

export const DEFAULT_THEME_ID = 'sky-purple-violet';

/**
 * Convert Hex to HSL string: "H S% L%" for Tailwind custom variables
 */
function hexToHsl(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h = Math.round(h * 60);
  }

  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Apply the 5-layer theme system to the entire DOM and root CSS variables
 */
export function applyColorPalette(paletteId: string = DEFAULT_THEME_ID, mode?: 'dark' | 'light') {
  if (typeof document === 'undefined') return;

  const savedMode = (mode || localStorage.getItem('shadow_theme_mode') || 'dark') as 'dark' | 'light';
  const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
  const root = document.documentElement;
  const layers = savedMode === 'light' ? palette.light : palette.dark;

  // 1. Toggle root theme class
  if (savedMode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // 2. Set the 5 distinct architectural layers
  root.style.setProperty('--bg-surface', layers.layer0_bg);
  root.style.setProperty('--card-surface', layers.layer1_card);
  root.style.setProperty('--elevated-surface', layers.layer2_elevated);
  root.style.setProperty('--border-highlight', layers.layer3_border);
  root.style.setProperty('--primary-accent', layers.layer4_accent);
  root.style.setProperty('--secondary-accent', layers.layer5_sky);

  // 3. Set global tailwind base tokens
  const accentHsl = hexToHsl(layers.layer4_accent);
  const bgHsl = hexToHsl(layers.layer0_bg);
  const textHsl = hexToHsl(layers.text);

  root.style.setProperty('--background', bgHsl);
  root.style.setProperty('--foreground', textHsl);
  root.style.setProperty('--card', hexToHsl(layers.layer1_card));
  root.style.setProperty('--card-foreground', textHsl);
  root.style.setProperty('--primary', accentHsl);
  root.style.setProperty('--primary-color', layers.layer4_accent);
  root.style.setProperty('--ring', accentHsl);
  root.style.setProperty('--border', hexToHsl(layers.layer3_border));

  // 4. Update the primary scale so existing bg-primary-500, etc. work seamlessly
  root.style.setProperty('--primary-50', savedMode === 'light' ? layers.layer0_bg : '#ede9fe');
  root.style.setProperty('--primary-100', '#ddd6fe');
  root.style.setProperty('--primary-200', '#c4b5fd');
  root.style.setProperty('--primary-300', '#a78bfa');
  root.style.setProperty('--primary-400', layers.layer5_sky);
  root.style.setProperty('--primary-500', layers.layer4_accent);
  root.style.setProperty('--primary-600', layers.layer4_accent);
  root.style.setProperty('--primary-700', savedMode === 'light' ? '#6d28d9' : '#5b21b6');
  root.style.setProperty('--primary-800', savedMode === 'light' ? '#5b21b6' : '#4c1d95');
  root.style.setProperty('--primary-900', layers.layer1_card);
  root.style.setProperty('--primary-950', layers.layer0_bg);

  // 5. Persist choices
  localStorage.setItem('shadow_color_palette', palette.id);
  localStorage.setItem('shadow_theme_mode', savedMode);

  // 6. Broadcast event so other components update synchronously
  window.dispatchEvent(new CustomEvent('shadow-theme-change', {
    detail: { theme: palette, mode: savedMode, layers }
  }));
}
