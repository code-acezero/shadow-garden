// Shadow Garden Atelier Frame System
// Direct compilation of the handcrafted SVG engine from Kagemi Frame Atelier
// Features: 122 Showcase Frames across 19 Collections + 29 Level / Board of Darkness / Council of Shadows Frames
// Mathematical layer depth, SMIL keyframe transformations, and Top-Nav Tesla Lightning Storm

export interface AtelierFrame {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  tier: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  colorKey: string;
  colors: [string, string, string];
  motif: string;
  attachment: string;
  effect: string;
  rawSpec: string;
  index: number;
  price: number;
  legacyId?: string;
}

// ─── Mathematical Helpers & Projection ────────────────────────────────────────
const PI = Math.PI;
const cs = (a: number) => Math.cos((a * PI) / 180);
const sn = (a: number) => Math.sin((a * PI) / 180);
const f1 = (n: number) => n.toFixed(1);

// ─── Color Palettes (17 Distinct Themes) ───────────────────────────────────────
export const PAL: Record<string, [string, string, string]> = {
  gold: ['#ffe28a', '#e0a02c', '#fff4c8'],
  silver: ['#f2f6ff', '#9aa8c4', '#ffffff'],
  ruby: ['#ff6b7d', '#b3122e', '#ffc2cb'],
  cyan: ['#6df3ff', '#1f8fd6', '#d6fbff'],
  jade: ['#8bf5b0', '#1e9a5e', '#d6ffe4'],
  rose: ['#ffa9d1', '#e0508f', '#ffe0ee'],
  violet: ['#c59bff', '#6a2fd6', '#eadbff'],
  ember: ['#ffb347', '#e8441a', '#fff0c2'],
  ice: ['#c9f1ff', '#58a8e8', '#ffffff'],
  void: ['#8a63ff', '#2a1450', '#ff4f7b'],
  brass: ['#f0c26a', '#9a5a22', '#ffe9b0'],
  copper: ['#ffa56a', '#a8431f', '#ffd9bf'],
  lime: ['#c8ff6a', '#3f9a2c', '#f2ffd0'],
  mint: ['#9ff5e3', '#4cb7c9', '#f0fffb'],
  sun: ['#fff07a', '#ff9a1f', '#ffffff'],
  night: ['#5b7bff', '#1c1f6b', '#b8c6ff'],
  blood: ['#ff3b57', '#4a0714', '#ffb0bc'],
};

// ─── Motif Path Data ─────────────────────────────────────────────────────────
export const M: Record<string, string> = {
  leaf: 'M0-11C8-4 8 6 0 11C-8 6-8-4 0-11Z',
  dia: 'M0-10L6 0L0 10L-6 0Z',
  spike: 'M0-13L3.5 5L-3.5 5Z',
  petal: 'M0 2C-9-5-7-14 0-12C7-14 9-5 0 2Z',
  star: 'M0-11Q1.5-1.5 11 0Q1.5 1.5 0 11Q-1.5 1.5-11 0Q-1.5-1.5 0-11Z',
  flame: 'M0-13C6-6 9 0 6 6C4 11-4 11-6 6C-9 0-3-4 0-13Z',
  heart: 'M0 9C-13-2-8-11 0-5C8-11 13-2 0 9Z',
  moon: 'M3-10A10 10 0 1 0 3 10A8 8 0 1 1 3-10Z',
  paw: 'M0 1C-6 1-7 9 0 9C7 9 6 1 0 1ZM-8-1a2.3 3 0 1 0 .1 0ZM-3-6a2.3 3 0 1 0 .1 0ZM3-6a2.3 3 0 1 0 .1 0ZM8-1a2.3 3 0 1 0 .1 0Z',
  orb: 'M-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0Z',
  blade: 'M0-14L3-6V6L0 10L-3 6V-6Z',
  fang: 'M-3 10Q0 0 0-10Q3 0 3 10Z',
  cross: 'M-2-10H2V-2H10V2H2V10H-2V2H-10V-2H-2Z',
  bolt: 'M2-12L-6 2H0L-3 12L7-3H1Z',
  tm: 'M-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0ZM2.4 1.6Q5.4 6-3 8Q1.2 5-.4 2.6Z',
  r0: 'M-3-9V9M-3-3L5-9M-3 1L5-5',
  r1: 'M-4-9V9L4 3',
  r2: 'M0-9V9M-5-4L0 0L5-4',
  r3: 'M-4-9L4 9M4-9L-4 9',
  r4: 'M-4-9V9M4-9V9M-4-3L4 3',
  r5: 'M0-9L5 0L0 9L-5 0ZM0-9V9',
  r6: 'M-4 9L0-9L4 9M-3 3H3',
  r7: 'M-4-9L4-3L-4 3L4 9',
};

// ─── Attachment Geometry Calculation ──────────────────────────────────────────
const P_coord = (r: number, a: number) => `${f1(100 + r * cs(a))} ${f1(100 + r * sn(a))}`;
const R0 = 67.5;
const ab = (a1: number, a2: number) => `A${R0} ${R0} 0 0 0 ${P_coord(R0, a1)}Z`;
const ea = (a1: number, a2: number, ta: number, tr: number, w: number) =>
  `M${P_coord(R0, a1)}Q${P_coord((R0 + tr) / 2 + w, a1 - 4)} ${P_coord(tr, ta)}Q${P_coord((R0 + tr) / 2 + w, a2 + 4)} ${P_coord(R0, a2)}${ab(a1, a2)}`;
const sh0 = 'fill="#0005" stroke="none"';

export const AT: Record<string, string> = {
  ear: `<path d="${ea(-68, -34, -51, 90, 2)}"/><path d="${ea(-61, -41, -51, 82, 1)}" ${sh0}/>`,
  fox: `<path d="${ea(-70, -42, -60, 104, -1)}"/><path d="${ea(-64, -48, -58, 92, 0)}" ${sh0}/><path d="M${P_coord(95, -62)}L${P_coord(105, -60)}L${P_coord(95, -55)}Z" fill="#000a" stroke="none"/>`,
  wolf: `<path d="${ea(-76, -34, -52, 96, 6)}"/><path d="${ea(-68, -42, -52, 86, 3)}" ${sh0}/>`,
  bun: `<path d="M${P_coord(R0, -62)}C${P_coord(95, -68)} ${P_coord(124, -62)} ${P_coord(124, -52)}C${P_coord(124, -42)} ${P_coord(98, -44)} ${P_coord(R0, -40)}${ab(-62, -40)}"/><path d="M${P_coord(R0, -57)}C${P_coord(94, -62)} ${P_coord(114, -57)} ${P_coord(114, -51)}C${P_coord(114, -45)} ${P_coord(96, -45)} ${P_coord(R0, -44)}${ab(-57, -44)}" ${sh0}/>`,
  fin: `<path d="M${P_coord(R0, -66)}C${P_coord(84, -72)} ${P_coord(104, -62)} ${P_coord(112, -42)}C${P_coord(102, -47)} ${P_coord(95, -42)} ${P_coord(98, -31)}C${P_coord(88, -34)} ${P_coord(80, -30)} ${P_coord(R0, -26)}${ab(-66, -26)}"/><path d="M${P_coord(R0, -58)}L${P_coord(104, -48)}M${P_coord(R0, -44)}L${P_coord(94, -34)}" fill="none" stroke="#0006" stroke-width="1.2"/>`,
  crest: `<path d="${(() => {
    const ts = [-104, -97, -90, -83, -76], tr = [82, 90, 100, 90, 82];
    let d = 'M' + P_coord(R0, -110);
    ts.forEach((a, j) => {
      d += 'L' + P_coord(tr[j], a);
      if (j < 4) d += 'L' + P_coord(72, a + 3.5);
    });
    return d + 'L' + P_coord(R0, -70) + `A${R0} ${R0} 0 0 0 ${P_coord(R0, -110)}Z`;
  })()}"/>`,
  antler: `<path d="M${P_coord(68, -60)}Q${P_coord(86, -70)} ${P_coord(104, -58)}M${P_coord(86, -67)}L${P_coord(100, -80)}M${P_coord(96, -61)}L${P_coord(112, -66)}M${P_coord(75, -64)}L${P_coord(86, -80)}" fill="none" stroke-width="3" stroke-linecap="round"/>`,
  horn: '<path d="M128 52C126 28 146 10 172 6C160 20 158 36 150 60Z"/>',
  wing: '<path d="M146 98C166 70 190 62 216 34C214 64 206 88 186 102C198 100 208 100 218 102C206 118 180 124 148 118Z"/><path d="M152 102C170 88 190 82 206 68M152 110C172 102 192 102 208 102M154 96C172 80 192 70 208 52M154 114C172 110 194 112 210 112" fill="none" stroke="#0007" stroke-width="1.5"/>',
  wing2: '<path d="M146 100L190 44L182 80L212 66L198 98L218 98L192 120L146 112Z"/>',
  sword: '<path d="M62 164L170 34L180 42L70 172Z"/><path d="M162 26L186 46L182 52L156 32Z"/>',
  pipe: '<path d="M148 76C172 72 184 56 180 28" fill="none" stroke-width="6" stroke-linecap="round"/><circle cx="180" cy="26" r="5"/>',
  crown: '<path d="M70 38L78 6L92 26L100-6L108 26L122 6L130 38Z"/><circle cx="100" cy="6" r="3.5" fill="#fff" stroke="none"/><circle cx="78" cy="6" r="2.5" fill="#fff" stroke="none"/><circle cx="122" cy="6" r="2.5" fill="#fff" stroke="none"/>',
  halo: '<ellipse cx="100" cy="6" rx="30" ry="7" fill="none" stroke-width="3.5"/>',
  gem: '<path d="M100 4L112 22L100 46L88 22Z"/><path d="M100 4V46M88 22H112" fill="none" stroke="#fff6" stroke-width="1"/>',
  scythe: '<path d="M44 168L164 28" fill="none" stroke-width="3" stroke-linecap="round"/><path d="M162 28C190 22 206 46 198 72C192 52 178 42 158 40Z"/>',
};

export const SGL: Record<string, number> = { crown: 1, halo: 1, gem: 1, crest: 1, scythe: 1 };
export const BK: Record<string, number> = { wing: 1, wing2: 1, sword: 1, pipe: 1, scythe: 1 };
export const MD: Record<string, number> = { ear: 1, bun: 1, fox: 1, wolf: 1, fin: 1, antler: 1, horn: 1 };

export const FXT: Record<string, [string, string, number]> = {
  sakura: ['petal', '#ffb3d1', 1],
  ember: ['flame', '#ff8a3a', -1],
  snow: ['orb', '#ffffff', 1],
  spark: ['star', '#ffe9a0', -1],
  fly: ['orb', '#dfff7a', -0.3],
  steam: ['orb', '#d9d2c0', -1],
  heart: ['heart', '#ff8fc2', -1],
  leaf: ['leaf', '#79d46c', 1],
  rune: ['r2', '#9fd0ff', -1],
  soul: ['flame', '#9b6bff', -1],
  bolt: ['bolt', '#bfe8ff', 0],
  feather: ['petal', '#ffffff', 1],
  star: ['star', '#ffffff', 0],
  bubble: ['orb', '#b8f0ff', -1],
};

const C = (id: string, col: string) =>
  /^r\d/.test(id)
    ? `fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${col}"`;

const R = (
  n: number,
  r: number,
  id: string | ((k: number) => string),
  sc: number,
  col: string,
  off = 0,
  cl = '',
  cx = 100,
  cy = 100
) =>
  Array.from({ length: n }, (_, k) => {
    const a = off + (k * 360) / n;
    const d = typeof id === 'function' ? id(k) : id;
    const u = `<use href="#m-${d}" transform="translate(${f1(cx + r * cs(a))} ${f1(
      cy + r * sn(a)
    )}) rotate(${f1(a + 90)}) scale(${sc})" ${C(d, col)}/>`;
    return cl
      ? `<g class="${cl}" style="--d:${2 + (k % 3)}s;animation-delay:-${(k * 0.37).toFixed(2)}s">${u}</g>`
      : u;
  }).join('');

const S = (d: number, x: string, rv?: number | boolean, cx = 100, cy = 100) =>
  `<g><animateTransform attributeName="transform" type="rotate" from="${rv ? 360 : 0} ${cx} ${cy}" to="${
    rv ? 0 : 360
  } ${cx} ${cy}" dur="${d}s" repeatCount="indefinite"/>${x}</g>`;

const O = (r: number, w: number, s: string, x = '') =>
  `<circle cx="100" cy="100" r="${f1(r)}" fill="none" stroke="${s}" stroke-width="${w}" ${x}/>`;

const pt = (r: number, a: number) => `${f1(100 + r * cs(a))},${f1(100 + r * sn(a))}`;

const pg = (n: number, r: number, o = 0, s = 1) =>
  Array.from({ length: n }, (_, k) => pt(r, o + (((k * s) % n) * 360) / n)).join(' ');

const gear = (n: number, r1: number, r2: number, rh: number, cx = 100, cy = 100) => {
  let d = '';
  const s = (2 * PI) / n;
  for (let k = 0; k < n; k++) {
    const a = k * s;
    [
      [0, r1],
      [0.12, r2],
      [0.38, r2],
      [0.5, r1],
    ].forEach(([u, r], j) => {
      d +=
        (k + j ? 'L' : 'M') +
        f1(cx + r * Math.cos(a + u * s)) +
        ' ' +
        f1(cy + r * Math.sin(a + u * s));
    });
  }
  return `${d}ZM${f1(cx + rh)} ${cy}a${rh} ${rh} 0 1 0 ${-2 * rh} 0a${rh} ${rh} 0 1 0 ${2 * rh} 0Z`;
};

const wv = (r: number, a: number, fq: number, ph = 0) =>
  'M' +
  Array.from({ length: 73 }, (_, k) => {
    const t = k * 5;
    const q = r + a * sn(t * fq + ph);
    return `${f1(100 + q * cs(t))} ${f1(100 + q * sn(t))}`;
  }).join('L') +
  'Z';

const mk = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

const sp = (r: number, sw: number, o: number) =>
  'M' +
  Array.from({ length: 30 }, (_, k) => {
    const a = o + (k * sw) / 29;
    const q = r - k * 0.35;
    return `${f1(100 + q * cs(a))} ${f1(100 + q * sn(a))}`;
  }).join('L');

const pd = (n: number, r: number, o: number) => `M${pg(n, r, o).split(' ').join('L')}Z`;

const RP = (d: string, w: number, A: string) => {
  const s = `d="${d}" fill="none" stroke-linejoin="round"`;
  return (
    `<path ${s} stroke="#000" stroke-width="${w + 2}" opacity=".45" transform="translate(0 2.5)"/>` +
    `<path ${s} stroke="${A}" stroke-width="${w}"/>` +
    `<path ${s} stroke="url(#sh)" stroke-width="${w}"/>` +
    `<path ${s} stroke="#fff" stroke-opacity=".6" stroke-width="1"/>`
  );
};

const O3 = (r: number, w: number, A: string) =>
  O(r + 1, w + 2, '#000', 'opacity=".45" transform="translate(0 2.5)"') +
  O(r, w, A) +
  O(r, w, 'url(#sh)') +
  O(r - w / 2 + 0.8, 1, '#fff', 'opacity=".65"') +
  O(r + w / 2 - 0.8, 1, '#000', 'opacity=".35"') +
  O(r, Math.max(1, w / 3), '#fff', 'stroke-dasharray="1.5 5" stroke-linecap="round" opacity=".55"');

const RG = (v: number, r: number, w: number, A: string) =>
  [
    () => O3(r, w, A),
    () => RP(pd(6, r * 1.1, -90), w, A),
    () => RP(pd(8, r * 1.05, -67.5), w, A),
    () => RP(wv(r, 2.6, 12), w, A),
    () => RP(wv(r, 2.2, 6), w * 0.7, A) + RP(wv(r, 2.2, 6, 180), w * 0.7, A),
  ][v]();

const EM = [
  'heart',
  'star',
  'moon',
  'flame',
  'cross',
  'blade',
  'leaf',
  'fang',
  'paw',
  'petal',
  'bolt',
  'dia',
  'spike',
  'orb',
];

const Y = (z: number, x: string) =>
  `<g class="ly" style="--z:${z}"><g transform="translate(100 100) scale(.84) translate(-100 -100)">${x}</g></g>`;

const Y0 = (z: number, x: string) => `<g class="ly" style="--z:${z}">${x}</g>`;

const G2 = (r: number, w: number, A: string) =>
  O(r + 0.6, w + 1, '#000', 'opacity=".4"') +
  O(r, w, A) +
  O(r - w / 2 + 0.4, 0.6, '#fff', 'opacity=".7"');

const TK = (n: number, r: number, l: number, col: string, op = 0.8) =>
  O(r, l, col, `stroke-dasharray=".7 ${f1((2 * PI * r) / n - 0.7)}" opacity="${op}"`);

const AR = (r: number, a: number, sw: number, w: number, col: string, x = '') =>
  O(
    r,
    w,
    col,
    `stroke-dasharray="${f1(((2 * PI * r) * sw) / 360)} ${f1(2 * PI * r)}" transform="rotate(${a} 100 100)" stroke-linecap="round" ${x}`
  );

const sc = (x: string, s = 0.62) =>
  `<g transform="translate(100 100) scale(${s}) translate(-100 -100)">${x}</g>`;

const pa = (k: string, i: number, n = 6, r0 = 56, r1 = 76) => {
  const X = FXT[k];
  if (!X) return '';
  const rd = mk(i * 97 + 13);
  return Array.from({ length: n }, () => {
    const a = rd() * 360;
    const d = r0 + rd() * (r1 - r0);
    return `<g class="${X[2] ? 'rise' : 'tw'}" style="--d:${(2.2 + rd() * 2.5).toFixed(
      1
    )}s;--y:${Math.round(X[2] * (24 + rd() * 24))}px;--x:${Math.round(
      rd() * 14 - 7
    )}px;animation-delay:-${(rd() * 4).toFixed(1)}s"><use href="#m-${X[0]}" transform="translate(${f1(
      100 + d * cs(a)
    )} ${f1(100 + d * sn(a))}) scale(${(0.4 + rd() * 0.4).toFixed(2)})" ${C(X[0], X[1])}/></g>`;
  }).join('');
};

const pips = (n: number, col: string) =>
  Array.from(
    { length: n },
    (_, k) => `<circle cx="${f1(100 + (k - (n - 1) / 2) * 5)}" cy="168" r="1.4" fill="${col}"/>`
  ).join('');

const E = (k: string, c: [string, string, string], i: number, s = 0.62) =>
  sc(EL[k] ? EL[k](c, 86, 0, mk(i * 13 + 7)) : '', s);

// ─── Elemental Generators ─────────────────────────────────────────────────────
export const EL: Record<
  string,
  (c: [string, string, string], rr: number, T: number, rd: () => number) => string
> = {
  fire: (c, rr, T) =>
    `<g filter="url(#fl)">${R(14 + T, rr + 7, 'flame', 1.9 + 0.25 * T, '#d62b0c')}${R(
      14 + T,
      rr + 7,
      'flame',
      1.3 + 0.2 * T,
      '#ff8a1f',
      12,
      'p'
    )}${R(14 + T, rr + 7, 'flame', 0.7 + 0.15 * T, '#fff3a0', 6, 'p')}</g>`,
  water: (c, rr, T) =>
    S(34, `<path d="${wv(rr + 9, 3.5, 7)}" fill="none" stroke="${c[0]}" stroke-width="1.8"/>`) +
    S(
      26,
      `<path d="${wv(rr + 14, 3, 10, 90)}" fill="none" stroke="${c[2]}" stroke-width="1.2" opacity=".8"/>`,
      1
    ) +
    S(
      20,
      R(6 + T, rr + 11, 'orb', 1.2, c[2], 0, 'b') + R(6 + T, rr + 11, 'orb', 0.45, '#fff', 0, 'b'),
      1
    ),
  earth: (c, rr, T) =>
    S(
      50,
      R(6 + T, rr + 14, 'dia', 2 + 0.2 * T, '#6b4f33', 0, 'b') +
        R(6 + T, rr + 14, 'dia', 1.2 + 0.1 * T, '#b08d5e', 0, 'b') +
        R(6 + T, rr + 14, 'dia', 0.5, c[2], 0, 'tw')
    ) + R(14, rr + 3, 'spike', 0.9, '#5e4630', 10),
  steam: (c, rr, T, rd) =>
    `<g filter="url(#bl)">${Array.from({ length: 3 + T }, () => {
      const a = rd() * 360;
      const d = rr + rd() * 14;
      return `<g class="rise" style="--d:${(3 + rd() * 2).toFixed(1)}s;--y:-45px;--x:${Math.round(
        rd() * 20 - 10
      )}px;animation-delay:-${(rd() * 4).toFixed(1)}s"><circle cx="${f1(
        100 + d * cs(a)
      )}" cy="${f1(100 + d * sn(a))}" r="${Math.round(6 + rd() * 5)}" fill="#f2efe6" fill-opacity=".75"/></g>`;
    }).join('')}</g>`,
  light: (c, rr, T) =>
    `<g opacity=".5">${S(70, R(24, rr + 10, 'spike', 2.4 + 0.2 * T, '#fff6c0'))}</g>` +
    S(45, R(12, rr + 12, 'spike', 1.6, c[0]), 1) +
    R(4, rr + 8, 'star', 2 + 0.2 * T, '#fff', 45, 'p'),
  thunder: (c, rr, T, rd) =>
    Array.from({ length: 4 + T }, (_, j) => {
      const a = (j * 360) / (4 + T) + rd() * 20;
      const n = 5;
      const p = Array.from({ length: n + 1 }, (_, q) =>
        pt(rr + 2 + (q * (24 + 4 * T)) / n, a + (q ? (rd() - 0.5) * 24 : 0))
      ).join(' ');
      return `<g class="fk" style="--d:${(1.4 + rd() * 1.6).toFixed(1)}s;animation-delay:-${(
        rd() * 3
      ).toFixed(2)}s"><polyline points="${p}" fill="none" stroke="${
        c[0]
      }" stroke-width="4" opacity=".5" stroke-linejoin="round"/><polyline points="${p}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>`;
    }).join(''),
  elec: (c, rr, T, rd) =>
    [0, 1]
      .map((j) => {
        const v = [0, 1, 2].map(
          () =>
            'M' +
            Array.from({ length: 48 }, (_, k) => {
              const a = k * 7.5;
              const q = rr + 8 + j * 7 + (rd() - 0.5) * (7 + T);
              return `${f1(100 + q * cs(a))} ${f1(100 + q * sn(a))}`;
            }).join('L') +
            'Z'
        );
        return `<path d="${v[0]}" fill="none" stroke="${j ? '#fff' : c[0]}" stroke-width="${
          j ? 1 : 2
        }" stroke-linejoin="round"><animate attributeName="d" values="${v.join(';')};${
          v[0]
        }" dur="${(0.5 + j * 0.2).toFixed(1)}s" repeatCount="indefinite"/></path>`;
      })
      .join('') + R(6, rr + 13, 'bolt', 0.9, '#fff', 0, 'tw'),
  wind: (c, rr) =>
    [0, 1, 2]
      .map((j) =>
        S(
          9 + j * 6,
          `<path d="${sp(rr + 6 + j * 7, 150 + j * 30, 0)}${sp(
            rr + 6 + j * 7,
            150 + j * 30,
            180
          )}" fill="none" stroke="${j ? c[2] : c[0]}" stroke-width="${(2.6 - j * 0.6).toFixed(
            1
          )}" stroke-linecap="round" opacity=".8"/>`,
          j % 2
        )
      )
      .join(''),
};

// ─── Categories & Metadata ───────────────────────────────────────────────────
export const ATELIER_CATEGORIES: Record<string, { name: string; icon: string }> = {
  st: { name: 'Steampunk', icon: 'Compass' },
  me: { name: 'Mechanical', icon: 'Cpu' },
  ru: { name: 'Runes', icon: 'Feather' },
  ju: { name: 'Jungle', icon: 'Trees' },
  cu: { name: 'Cute', icon: 'Heart' },
  an: { name: 'Animals', icon: 'Cat' },
  da: { name: 'Dark Aura', icon: 'Flame' },
  kn: { name: 'Knights', icon: 'Shield' },
  em: { name: 'Emperors', icon: 'Crown' },
  lo: { name: 'Lords', icon: 'Award' },
  el: { name: 'Elemental', icon: 'Zap' },
  ce: { name: 'Celestial', icon: 'Moon' },
  yo: { name: 'Yokai & Sakura', icon: 'Ghost' },
  sa: { name: 'Sea & Abyss', icon: 'Waves' },
  ho: { name: 'Holy & Angelic', icon: 'Sun' },
  cw: { name: 'Clockwork', icon: 'Clock' },
  as: { name: 'Astronomical', icon: 'Compass' },
  sg: { name: 'Shinigami', icon: 'Skull' },
  to: { name: 'Tomoe Eyes', icon: 'Eye' },
  bd: { name: 'Board of Darkness', icon: 'ShieldAlert' },
  cs: { name: 'Council of Shadows', icon: 'Layers' },
  lv: { name: 'Level Milestones', icon: 'Trophy' },
};

export const ATELIER_RARITIES: Record<number, { label: AtelierFrame['rarity']; color: string; basePrice: number }> = {
  1: { label: 'Common', color: '#6b7589', basePrice: 500 },
  2: { label: 'Rare', color: '#2f6fe0', basePrice: 1200 },
  3: { label: 'Epic', color: '#9333ea', basePrice: 2500 },
  4: { label: 'Legendary', color: '#d97706', basePrice: 4200 },
  5: { label: 'Mythic', color: '#dc2626', basePrice: 7000 },
};

export function toFrameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ─── JAPANESE / ANIME NAME UPGRADE ALIAS MAPPING ──────────────────────────────
export const FRAME_NAME_ALIASES: Record<string, string> = {
  'Brass Cogwheel': 'Kogane',
  'Copper Boiler Ring': 'Akagane',
  'Clockwork Aviator': 'Sorafune',
  'Airship Captain’s Wheel': 'Kaji',
  'Aether Engine Core': 'Kikan',
  'Grand Horologist’s Eternity': 'Tokiwa',
  'Circuit Halo': 'Denko',
  'Mecha Pilot Ring': 'Kishin',
  'Neon Servo Ring': 'Nexa',
  'Plasma Reactor': 'Plasmo',
  'Quantum Seraph Unit': 'Seraphis',
  'Omega Titan Core': 'Omega',
  'Elder Glyph Circle': 'Futhark',
  'Frostbound Runes': 'Kori',
  'Arcane Sigil Wheel': 'Arcana',
  'Ember Rune Seal': 'Ember',
  'Sage’s Astral Seal': 'Sennin',
  'World Tree Runestone': 'Yggra',
  'Vine Wreath': 'Tsuta',
  'Firefly Thicket': 'Hotaru',
  'Orchid Canopy': 'Ran',
  'Overgrown Ruins': 'Haikyo',
  'Spirit Stag Grove': 'Shika',
  'Yggdrasil’s Crown': 'Shinju',
  'Sakura Puff': 'Mochi',
  'Kitty Bell Collar': 'Suzu',
  'Bunny Cloud': 'Usagi',
  'Star Candy Dream': 'Candy',
  'Angel Cupcake': 'Tenshi',
  'Magical Girl Grand Bloom': 'Mahou',
  'Paw Print Border': 'Nikukyu',
  'Fox Spirit': 'Kon',
  'Moon Wolf': 'Okami',
  'Azure Dragon': 'Seiryu',
  'Phoenix Rebirth': 'Houou',
  'Celestial Qilin': 'Kirin',
  'Shadow Wisp': 'Kage',
  'Crimson Eyes': 'Akame',
  'Abyssal Maw': 'Yami',
  'Cursed Flame': 'Noroi',
  'Reaper’s Sovereign': 'Shiou',
  'Void Calamity': 'Kyomu',
  'Squire’s Plate': 'Kote',
  'Iron Vanguard': 'Tetsu',
  'Holy Paladin': 'Seiki',
  'Dragoon Knight': 'Ryuki',
  'Crusader Order': 'Gunki',
  'Dawnbringer Grand Marshal': 'Reimei',
  'Jade Seal': 'Hisui',
  'Dynasty Gold': 'Ouka',
  'Imperial Phoenix': 'Housen',
  'Sun Emperor': 'Taiyo',
  'Dragon Throne': 'Ryuza',
  'Celestial Autocrat': 'Tenno',
  'Warlord’s Sigil': 'Bushou',
  'Demon Lord’s Crown': 'Maou',
  'Overlord Orbitals': 'Haou',
  'Vampire Lord': 'Kyuketsu',
  'Sword Saint Lord': 'Kensei',
  'Lord of Calamity': 'Wazawai',
  'Ember Spark': 'Hibana',
  'Tide Spiral': 'Uzu',
  'Breeze Ribbon': 'Sofu',
  'Static Halo': 'Piri',
  'Boulder Bastion': 'Gan',
  'Thunder Crown': 'Raimei',
  'Glacier Bloom': 'Hyoka',
  'Geyser Fountain': 'Funsui',
  'Radiant Dawn': 'Hikari',
  'Cyclone Dragon': 'Tatsumaki',
  'Tsunami Leviathan': 'Tsunami',
  'Magma Titan': 'Yougan',
  'Stormcaller Archon': 'Arashi',
  'Primordial Convergence': 'Genesis',
  'Crescent Moon': 'Mikazuki',
  'Constellation Ring': 'Seiza',
  'Starlight Veil': 'Hoshizora',
  'Eclipse Oracle': 'Nisshoku',
  'Galaxy Guardian': 'Ginga',
  'Cosmic Genesis': 'Uchu',
  'Sakura Drift': 'Sakura',
  'Paper Lantern Night': 'Chochin',
  'Kitsune Mask': 'Kitsune',
  'Oni Festival': 'Matsuri',
  'Tengu Wind Shrine': 'Tengu',
  'Nine-Tailed Kitsune God': 'Kyuubi',
  'Pearl Tide': 'Tama',
  'Coral Reef Crown': 'Sango',
  'Siren’s Lagoon': 'Ningyo',
  'Kraken’s Grasp': 'Kraken',
  'Abyssal Leviathan': 'Shinkai',
  'Poseidon’s Trident Realm': 'Kaiou',
  'Feather Halo': 'Hane',
  'Cathedral Glass': 'Kirari',
  'Seraph’s Mercy': 'Jihi',
  'Valkyrie’s Oath': 'Chikai',
  'Archangel Judgement': 'Shinpan',
  'Heaven’s Gate Sovereign': 'Tengoku',
};

// ─── RAW SHOWCASE SPECIFICATIONS (121 Frames across 19 Collections) ───────────
export const RAW_SHOWCASE_FRAMES: string[] = [
  'Brass Cogwheel|st|1|brass|dia|-|steam',
  'Copper Boiler Ring|st|2|copper|orb|pipe|steam',
  'Clockwork Aviator|st|3|gold|star|wing2|spark',
  'Airship Captain’s Wheel|st|3|brass|leaf|-|steam',
  'Aether Engine Core|st|4|cyan|bolt|pipe|steam+elec',
  'Grand Horologist’s Eternity|st|5|gold|star|crown|steam+light',
  'Circuit Halo|me|1|cyan|dia|-|spark',
  'Mecha Pilot Ring|me|2|silver|blade|-|bolt',
  'Neon Servo Ring|me|3|lime|bolt|-|elec',
  'Plasma Reactor|me|3|ember|dia|pipe|ember',
  'Quantum Seraph Unit|me|4|ice|star|wing|star',
  'Omega Titan Core|me|5|cyan|blade|wing2|elec+thunder',
  'Elder Glyph Circle|ru|1|jade|dia|-|rune',
  'Frostbound Runes|ru|2|ice|dia|-|snow',
  'Arcane Sigil Wheel|ru|3|violet|star|-|rune',
  'Ember Rune Seal|ru|3|ember|flame|-|fire',
  'Sage’s Astral Seal|ru|4|gold|moon|halo|rune+light',
  'World Tree Runestone|ru|5|jade|leaf|antler|wind+fly',
  'Vine Wreath|ju|1|jade|leaf|-|leaf',
  'Firefly Thicket|ju|2|lime|orb|-|fly',
  'Orchid Canopy|ju|3|rose|petal|-|sakura',
  'Overgrown Ruins|ju|3|mint|leaf|-|leaf',
  'Spirit Stag Grove|ju|4|jade|leaf|antler|fly',
  'Yggdrasil’s Crown|ju|5|lime|leaf|crown|fly',
  'Sakura Puff|cu|1|rose|heart|-|heart',
  'Kitty Bell Collar|cu|2|rose|paw|ear|heart',
  'Bunny Cloud|cu|2|mint|star|bun|star',
  'Star Candy Dream|cu|3|violet|star|-|star',
  'Angel Cupcake|cu|4|rose|heart|halo|heart',
  'Magical Girl Grand Bloom|cu|5|rose|heart|wing|star',
  'Paw Print Border|an|1|copper|paw|-|-',
  'Fox Spirit|an|2|ember|flame|fox|ember',
  'Moon Wolf|an|3|silver|fang|wolf|snow',
  'Azure Dragon|an|3|cyan|fang|horn|thunder',
  'Phoenix Rebirth|an|4|ember|flame|wing|fire',
  'Celestial Qilin|an|5|gold|flame|antler|light+spark',
  'Shadow Wisp|da|1|void|flame|-|soul',
  'Crimson Eyes|da|2|blood|fang|-|ember',
  'Abyssal Maw|da|3|void|fang|horn|soul',
  'Cursed Flame|da|3|violet|flame|-|soul',
  'Reaper’s Sovereign|da|4|blood|spike|wing2|ember',
  'Void Calamity|da|5|void|spike|horn|soul',
  'Squire’s Plate|kn|1|silver|blade|-|-',
  'Iron Vanguard|kn|2|silver|cross|-|spark',
  'Holy Paladin|kn|3|gold|cross|wing|feather',
  'Dragoon Knight|kn|3|ruby|spike|horn|ember',
  'Crusader Order|kn|4|gold|blade|sword|spark',
  'Dawnbringer Grand Marshal|kn|5|sun|cross|wing|light+feather',
  'Jade Seal|em|1|jade|dia|-|-',
  'Dynasty Gold|em|2|gold|petal|gem|-',
  'Imperial Phoenix|em|3|ruby|flame|crown|ember',
  'Sun Emperor|em|4|sun|spike|halo|light+spark',
  'Dragon Throne|em|5|gold|fang|horn|spark',
  'Celestial Autocrat|em|5|sun|star|crown|star',
  'Warlord’s Sigil|lo|2|ruby|blade|-|-',
  'Demon Lord’s Crown|lo|3|blood|spike|horn|ember',
  'Overlord Orbitals|lo|3|void|blade|-|soul',
  'Vampire Lord|lo|4|blood|moon|wing2|soul',
  'Sword Saint Lord|lo|4|silver|blade|-|spark',
  'Lord of Calamity|lo|5|void|blade|horn|thunder',
  'Ember Spark|el|1|ember|flame|-|fire',
  'Tide Spiral|el|2|cyan|orb|-|water',
  'Breeze Ribbon|el|2|mint|leaf|-|wind+leaf',
  'Static Halo|el|2|violet|bolt|-|elec',
  'Boulder Bastion|el|3|copper|dia|-|earth',
  'Thunder Crown|el|3|sun|bolt|-|thunder',
  'Glacier Bloom|el|3|ice|dia|-|snow',
  'Geyser Fountain|el|3|cyan|orb|-|steam+bubble',
  'Radiant Dawn|el|3|sun|star|halo|light',
  'Cyclone Dragon|el|4|mint|leaf|-|wind+leaf',
  'Tsunami Leviathan|el|4|cyan|fang|-|water',
  'Magma Titan|el|4|ember|dia|horn|fire+earth',
  'Stormcaller Archon|el|5|violet|bolt|horn|thunder+elec',
  'Primordial Convergence|el|5|sun|star|wing|fire+thunder+wind',
  'Crescent Moon|ce|1|silver|moon|-|star',
  'Constellation Ring|ce|2|night|star|-|star',
  'Starlight Veil|ce|3|violet|star|-|star',
  'Eclipse Oracle|ce|4|sun|moon|halo|spark',
  'Galaxy Guardian|ce|4|night|star|wing|star',
  'Cosmic Genesis|ce|5|violet|star|wing|star',
  'Sakura Drift|yo|1|rose|petal|-|sakura',
  'Paper Lantern Night|yo|2|ember|orb|-|fly',
  'Kitsune Mask|yo|3|ruby|flame|fox|ember',
  'Oni Festival|yo|3|blood|spike|horn|ember',
  'Tengu Wind Shrine|yo|4|silver|leaf|wing|wind+feather',
  'Nine-Tailed Kitsune God|yo|5|ember|flame|fox|fire',
  'Pearl Tide|sa|1|mint|orb|-|bubble',
  'Coral Reef Crown|sa|2|rose|leaf|-|water',
  'Siren’s Lagoon|sa|3|cyan|petal|-|water',
  'Kraken’s Grasp|sa|3|void|fang|-|water+soul',
  'Abyssal Leviathan|sa|4|night|fang|horn|water+elec',
  'Poseidon’s Trident Realm|sa|5|cyan|fang|crown|water+thunder',
  'Feather Halo|ho|1|silver|petal|halo|feather',
  'Cathedral Glass|ho|2|sun|cross|-|light',
  'Seraph’s Mercy|ho|3|silver|petal|wing|feather+light',
  'Valkyrie’s Oath|ho|3|gold|blade|wing|light',
  'Archangel Judgement|ho|4|sun|cross|wing|light+spark',
  'Heaven’s Gate Sovereign|ho|5|sun|star|wing|light+feather',
  // ── Clockwork Collection (cw) ──
  'Tokei|cw|1|brass|dia|-|-',
  'Zenmai|cw|2|gold|star|-|spark',
  'Haguruma|cw|3|copper|orb|pipe|steam',
  'Karakuri|cw|3|silver|blade|-|spark',
  'Shikake|cw|4|brass|dia|wing2|steam',
  'Jikuu|cw|5|sun|star|crown|light',
  // ── Astronomical Collection (as) ──
  'Hoshiban|as|1|night|star|-|star',
  'Tenmon|as|2|gold|star|-|spark',
  'Wakusei|as|3|cyan|orb|-|star',
  'Zodiac|as|3|violet|star|-|star',
  'Shingetsu|as|4|silver|moon|halo|star',
  'Tenkyu|as|5|gold|star|crown|light',
  // ── Shinigami Collection (sg) ──
  'Higanbana|sg|1|ruby|fang|-|soul',
  'Reikon|sg|2|ice|flame|-|soul',
  'Kama|sg|3|void|spike|scythe|soul',
  'Yomi|sg|4|night|fang|scythe|soul',
  'Shinigami|sg|5|void|flame|scythe|soul',
  // ── Tomoe Eyes Collection (to) ──
  'Tomoe|to|2|ruby|dia|-|-',
  'Mitsu|to|3|blood|dia|-|ember',
  'Kagami|to|3|violet|dia|-|-',
  'Rinne|to|4|ruby|dia|-|spark',
  'Mangetsu|to|4|blood|dia|-|ember',
  'Shinen|to|5|ember|dia|-|fire',
];

export const ATELIER_SHOWCASE_FRAMES: AtelierFrame[] = RAW_SHOWCASE_FRAMES.map((rawSpec, idx) => {
  const [origName, category, tierStr, colorKey, motif, attachment, effect] = rawSpec.split('|');
  const tier = parseInt(tierStr, 10);
  const rarity = (ATELIER_RARITIES[tier]?.label || 'Common') as AtelierFrame['rarity'];
  const colors = PAL[colorKey] || ['#ffffff', '#9aa8c4', '#ffffff'];
  const name = FRAME_NAME_ALIASES[origName] || origName;
  const legacyId = toFrameSlug(origName);
  const id = toFrameSlug(name);
  const basePrice = ATELIER_RARITIES[tier]?.basePrice || 1200;
  const price = Math.round((basePrice + (idx % 4) * (basePrice / 10)) / 50) * 50;

  return {
    id,
    name,
    category,
    categoryName: ATELIER_CATEGORIES[category]?.name || 'Showcase',
    tier,
    rarity,
    colorKey,
    colors,
    motif,
    attachment,
    effect,
    rawSpec,
    index: idx,
    price,
    legacyId,
  };
});

const SHOWCASE_LOOKUP = new Map<string, AtelierFrame>();
ATELIER_SHOWCASE_FRAMES.forEach((f) => {
  SHOWCASE_LOOKUP.set(f.id, f);
  SHOWCASE_LOOKUP.set(toFrameSlug(f.name), f);
  if (f.legacyId) {
    SHOWCASE_LOOKUP.set(f.legacyId, f);
  }
});

// ─── SPECIAL / LEVEL / COUNCIL OF SHADOWS / BOARD OF DARKNESS FRAMES ─────────
export interface SpecialFrameDef {
  id: string;
  aliases?: string[];
  name: string;
  group: 'lv' | 'bd' | 'cs';
  categoryName: string;
  desc: string;
  colors: [string, string, string];
  type: 'level' | 'darkness' | 'council' | 'role';
  minLevel?: number;
  price?: number;
  renderFn: (colors: [string, string, string], gradRef: string, index: number, uniquePrefix?: string) => string;
}

// ─── Top-Nav Yin-Yang Logo Tesla Lightning Filter Engine ─────────────────────
// Direct compilation of the electric displacement geometry from ShadowLogo.tsx
const TESLA_FILTER_REF = 'url(#fl-tesla)';

// High-Voltage Tesla Arcs designed for avatar circular perimeter
const buildTeslaLogoArcs = (uniqueId: string) => `
  <!-- Ambient storm electric flicker aura -->
  <circle cx="100" cy="100" r="62" fill="none" stroke="#c084fc" stroke-width="8" opacity="0" class="shadow-tesla-storm" filter="url(#bl)" />

  <!-- Tesla Electric Arc 1: Brilliant White & Sky Violet Flash (Displacement Filter) -->
  <g class="shadow-tesla-arc-1" style="filter: drop-shadow(0 0 5px #7c3aed) drop-shadow(0 0 2px #ffffff);">
    <path
      d="M38,72 L66,46 L95,66 L124,40 L156,68 L172,52"
      fill="none"
      stroke="#c084fc"
      stroke-width="2.6"
      stroke-linejoin="round"
      stroke-linecap="round"
      filter="${TESLA_FILTER_REF}"
    />
    <path
      d="M38,72 L66,46 L95,66 L124,40 L156,68 L172,52"
      fill="none"
      stroke="#ffffff"
      stroke-width="1.2"
      stroke-linejoin="round"
      stroke-linecap="round"
      filter="${TESLA_FILTER_REF}"
    />
  </g>

  <!-- Tesla Electric Arc 2: Sky Cyan & Deep Violet Flash -->
  <g class="shadow-tesla-arc-2" style="filter: drop-shadow(0 0 6px #7c3aed);">
    <path
      d="M32,136 L64,160 L96,134 L132,164 L168,132"
      fill="none"
      stroke="#7c3aed"
      stroke-width="2.6"
      stroke-linejoin="round"
      stroke-linecap="round"
      filter="${TESLA_FILTER_REF}"
    />
    <path
      d="M32,136 L64,160 L96,134 L132,164 L168,132"
      fill="none"
      stroke="#ffffff"
      stroke-width="1.2"
      stroke-linejoin="round"
      stroke-linecap="round"
      filter="${TESLA_FILTER_REF}"
    />
  </g>

  <!-- Tesla Orbital Lightning Halo -->
  <g class="p" style="--d:2.5s; filter: drop-shadow(0 0 4px #c084fc);">
    <path
      d="M48,56 L100,42 L152,56 L164,100 L152,144 L100,158 L48,144 L36,100 Z"
      fill="none"
      stroke="#c084fc"
      stroke-width="2"
      stroke-linejoin="round"
      filter="${TESLA_FILTER_REF}"
    />
    <path
      d="M48,56 L100,42 L152,56 L164,100 L152,144 L100,158 L48,144 L36,100 Z"
      fill="none"
      stroke="#ffffff"
      stroke-width="1"
      stroke-linejoin="round"
      filter="${TESLA_FILTER_REF}"
    />
  </g>
`;

// Dragon head ornament for Stage 1 of The Eternal
const DR = `<g transform="translate(161 100)"><path d="M0-10C5-10 7-5 5-1L3 5H-3L-5-1C-7-5-5-10 0-10Z" fill="#35d6a8" stroke="#ffe9a0" stroke-width=".8"/><path d="M4-7Q11-9 14-3M-4-7Q-11-9-14-3" fill="none" stroke="#ffd36e" stroke-width=".9"/><path d="M-2 4Q-7 9-4 15M2 4Q7 9 4 15" fill="none" stroke="#ffd36e" stroke-width="1.2" stroke-linecap="round"/><circle cx="2.2" cy="-4" r="1" fill="#fff"/><circle cx="-2.2" cy="-4" r="1" fill="#fff"/></g>`;

// First Shadow: Alpha neural web & data pulses
const FS = (c: [string, string, string], i: number) => {
  const tri = (s: number) =>
    `<polygon points="${pg(3, 71, s)}" fill="none" stroke="${c[2]}" stroke-width=".7" opacity=".8"/>`;
  const spk = `<path d="${Array.from({ length: 6 }, (_, k) => 'M' + pt(58, -90 + k * 60) + 'L' + pt(71, -90 + k * 60)).join(
    ''
  )}" fill="none" stroke="${c[0]}" stroke-width=".6" opacity=".7"/>`;
  return (
    `<g class="p" style="--d:3.4s">${O(62, 6, c[1], 'opacity=".35"')}</g>` +
    S(70, tri(-90) + tri(90) + spk + R(6, 71, 'orb', 0.5, '#fff', -90)) +
    S(50, O(64, 1, c[0], 'stroke-dasharray="9 3 2 3" opacity=".7"'), 1) +
    [0, 1]
      .map(
        (j) =>
          `<circle r="1.8" fill="${j ? c[2] : '#fff'}"><animateMotion dur="${
            4 + j * 2
          }s" repeatCount="indefinite" path="M100 37A63 63 0 1 ${j ? 0 : 1} 99.9 37"/></circle>`
      )
      .join('') +
    R(1, 64, 'blade', 0.8, c[0], -90) +
    R(1, 64, 'blade', 0.55, c[0], -112) +
    R(1, 64, 'blade', 0.55, c[0], -68) +
    R(1, 60, 'dia', 0.9, '#fff', -90, 'p')
  );
};

const rg = (col: string) =>
  O(57.6, 3.2, '#000', 'opacity=".4"') +
  O(57, 2.4, col) +
  O(56.3, 0.7, '#fff', 'opacity=".6"') +
  O(59.5, 5, col, 'opacity=".18"');

const T52 = (a: number) => (a / 52).toFixed(4);

const GI = (avTarget: string = '#av') => {
  const g = (x: string, t: number) =>
    `<g><animateTransform attributeName="transform" type="translate" values="${x}" calcMode="discrete" dur="${t}s" repeatCount="indefinite"/><use href="${avTarget}"/></g>`;
  return `<g filter="url(#gr)" style="mix-blend-mode:screen">${g(
    '0 0;-3 1;2 -1;-2 0;3 1;0 0',
    2.4
  )}</g><g filter="url(#gc)" style="mix-blend-mode:screen">${g(
    '0 0;3 -1;-2 1;2 0;-3 -1;0 0',
    2.1
  )}</g><g clip-path="url(#sl)">${g('0 0;7 0;-6 0;0 0;5 0;-8 0', 3)}</g>`;
};

const ROT = (x: string) => {
  const kt = [0];
  const v = [0];
  const sp_arr = [];
  let a = 0;
  for (let k = 0; k < 10; k++) {
    a += 36;
    kt.push((k * 5.2 + 3.6) / 52);
    v.push(a);
    sp_arr.push('0 0 1 1');
    a += 720;
    kt.push((k + 1) / 10);
    v.push(a);
    sp_arr.push('.6 .013 .4 .987');
  }
  return `<g><animateTransform attributeName="transform" type="rotate" values="${v
    .map((q) => q + ' 100 100')
    .join(';')}" keyTimes="${kt.map((q) => q.toFixed(4)).join(';')}" calcMode="spline" keySplines="${sp_arr.join(
    ';'
  )}" dur="52s" repeatCount="indefinite"/>${x}</g>`;
};

const ph3 = (p: number, x: string) => {
  const on = p ? (p - 1) * 5.2 + 4.2 : 0;
  const off = p * 5.2 + 4.6;
  const [kt, o, dk, dv] =
    p === 0
      ? [
          [0, 4.2, 4.6, 51, 51.4, 52],
          [1, 1, 0, 0, 1, 1],
          [0, 4.6, 51],
          ['inline', 'none', 'inline'],
        ]
      : [
          [0, on, on + 0.4, off - 0.4, off, 52],
          [0, 0, 1, 1, 0, 0],
          [0, on, off],
          ['none', 'inline', 'none'],
        ];
  return `<g opacity="0" display="none"><animate attributeName="opacity" values="${o.join(
    ';'
  )}" keyTimes="${kt.map(T52).join(
    ';'
  )}" dur="52s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv.join(
    ';'
  )}" keyTimes="${dk.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/>${x}</g>`;
};

const SW2 = (() => {
  const kt = [0];
  const vo = [0];
  const ro = [56];
  for (let k = 0; k < 10; k++) {
    const s = k * 5.2 + 4.4;
    kt.push(s - 0.05, s, s + 0.6);
    vo.push(0, 0.9, 0);
    ro.push(56, 56, 80);
  }
  kt.push(52);
  vo.push(0);
  ro.push(80);
  const a = (n: string, v: number[]) =>
    `<animate attributeName="${n}" values="${v.join(';')}" keyTimes="${kt
      .map(T52)
      .join(';')}" dur="52s" repeatCount="indefinite"/>`;
  return `<circle cx="100" cy="100" r="56" fill="none" stroke="#fff" stroke-width="1.2" opacity="0">${a(
    'r',
    ro
  )}${a('opacity', vo)}</circle>`;
})();

// Inter-Phase Tesla Lightning Surge for The Eternal
const ZAP_TESLA = (i: number, avTarget: string = '#av') => {
  const kt = [0];
  const v = [0];
  const dk = [0];
  const dv = ['none'];
  for (let k = 0; k < 10; k++) {
    const s = k * 5.2 + 3.6;
    kt.push(s, s + 0.3, s + 1.3, s + 1.6);
    v.push(0, 1, 1, 0);
    dk.push(s, s + 1.6);
    dv.push('inline', 'none');
  }
  return `<g opacity="0" display="none"><animate attributeName="opacity" values="${v.join(
    ';'
  )}" keyTimes="${kt.map(T52).join(
    ';'
  )}" dur="52s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv.join(
    ';'
  )}" keyTimes="${dk.map(T52).join(
    ';'
  )}" dur="52s" repeatCount="indefinite"/><circle cx="100" cy="100" r="52" fill="url(#pl)"/>${GI(avTarget)}${buildTeslaLogoArcs(
    `zap_${i}`
  )}</g>`;
};

// The 10 Elemental Phases of The Eternal Master Frame with Top-Nav Tesla Lightning
export const ET3 = (c: [string, string, string], A: string, i: number, uniquePrefix?: string) => {
  const avTarget = uniquePrefix ? `#av_${uniquePrefix}` : '#av';
  const ph = [
    // 0: Water
    rg('#4cc9ff') +
      S(30, `<path d="${wv(61, 2.6, 8)}" fill="none" stroke="#9fe8ff" stroke-width="1.1"/>`) +
      S(22, `<path d="${wv(64, 2, 11, 90)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".6"/>`, 1) +
      S(26, R(6, 67, 'orb', 0.5, '#bfefff', 0, 'b'), 1) +
      pa('bubble', i, 4),
    // 1: Dragon Sovereign
    S(
      40,
      AR(61, 0, 210, 4.2, '#2fbf9a') +
        AR(61, 210, 60, 3, '#2fbf9a') +
        AR(61, 270, 40, 1.8, '#2fbf9a') +
        AR(59.6, 6, 200, 0.9, '#ffe9a0', 'opacity=".8"') +
        DR
    ) +
      O(57, 1, '#6b4d12', 'opacity=".6"') +
      R(1, 70, 'orb', 0.6, '#bff5ff', -30, 'p'),
    // 2: Gale Wind
    rg('#bfffe0') + E('wind', ['#bfffe0', '#4cb7a0', '#fff'], i, 0.62) + pa('leaf', i, 4),
    // 3: Enchanted Jungle
    rg('#6ee08a') +
      `<path d="${wv(61, 2.4, 9)}" fill="none" stroke="#3fbf6a" stroke-width="1.2"/>` +
      R(10, 64, 'leaf', 0.5, '#8dff9f', 0, 'b') +
      S(16, R(3, 67, 'orb', 0.9, '#d9ffb0') + R(3, 67, 'orb', 0.4, '#fff')) +
      R(4, 62, 'petal', 0.5, '#ffd0e8', 20) +
      pa('fly', i, 5),
    // 4: Ethereal Mist
    rg('#dfe6ff') + R(9, 61, 'orb', 2.4, 'url(#cm)', 0, 'b') + S(80, R(7, 67, 'orb', 1.8, 'url(#cm)'), 1),
    // 5: Earth Caldera
    rg('#d9a066') + E('earth', ['#ffa56a', '#a8431f', '#ffd9bf'], i, 0.62) + S(40, R(6, 66, 'dia', 1.3, '#8fe8ff', 0, 'tw'), 1),
    // 6: Steampunk Core
    rg('#c98a2e') +
      S(
        40,
        `<path fill-rule="evenodd" d="${gear(16, 58, 64, 54)}" fill="#d9a441" stroke="#ffe9a0" stroke-width=".7"/>` +
          R(16, 60, 'orb', 0.22, '#5a3410')
      ) +
      [40, 220]
        .map(
          (a) =>
            `<g transform="translate(${f1(100 + 67.5 * cs(a))} ${f1(100 + 67.5 * sn(a))})">${S(
              20,
              `<path fill-rule="evenodd" d="${gear(8, 4.2, 7.2, 2, 0, 0)}" fill="#b87a22" stroke="#ffe9a0" stroke-width=".6"/>`,
              1,
              0,
              0
            )}</g>`
        )
        .join('') +
      pa('steam', i, 4),
    // 7: Clockwork Chronometer
    rg('#e8c15a') +
      TK(60, 63, 2, '#fff1c0', 0.9) +
      R(12, 64, 'dia', 0.55, '#ffe9a0') +
      O(53.5, 0.6, '#ffe9a0', 'opacity=".7"') +
      S(52, `<path d="M100 43V26" stroke="#ffe9a0" stroke-width="2.2" stroke-linecap="round"/>`) +
      S(8, `<path d="M100 43V18" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`) +
      S(3, `<path d="M100 43V14" stroke="#ff6a5a" stroke-width=".8"/><circle cx="100" cy="12" r="1.6" fill="#ff6a5a"/>`),
    // 8: Cyber Matrix Core
    rg('#00f0ff') +
      `<g transform="translate(1.6 0)" opacity=".7">${O(57, 1.2, '#ff3df2')}</g><g transform="translate(-1.6 0)" opacity=".7">${O(
        57,
        1.2,
        '#00ffd0'
      )}</g>` +
      S(14, AR(62, 0, 70, 1.6, '#00f0ff') + AR(62, 180, 70, 1.6, '#ff3df2')) +
      `<circle cx="100" cy="100" r="66" fill="none" stroke="#00ffd0" stroke-width="2.4" stroke-dasharray="2 3 6 2" opacity=".8"><animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.2s" repeatCount="indefinite"/></circle>` +
      R(4, 67, 'blade', 0.5, '#ff3df2', 45) +
      R(16, 71, 'orb', 0.16, '#7fffd4', 0, 'tw'),
    // 9: Lightning & Tesla Core Storm (Top-Nav Yin-Yang Electricity)
    rg('#9fd0ff') +
      TK(80, 62.5, 2, '#7fd6ff', 0.7) +
      R(8, 57, 'orb', 0.75, '#7fd6ff', 22.5, 'p') +
      R(8, 57, 'orb', 0.32, '#fff', 22.5) +
      R(1, 60, 'dia', 0.9, '#fff', -90, 'p') +
      buildTeslaLogoArcs(`et_phase9_${i}`),
  ]
    .map((x, p) => ph3(p, x))
    .join('');

  return ROT(ph) + ZAP_TESLA(i, avTarget) + SW2;
};

// Aliased helper for legacy callers
export const ETL2 = ET3;

const shCouncil = (
  n: number,
  desc: string,
  pc: [string, string, string],
  ex: (c: [string, string, string], i: number) => string
): SpecialFrameDef => {
  const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  const name = `${ORD[n - 1]} Shadow`;
  return {
    id: toFrameSlug(name),
    aliases: [`shadow_${n}`, `council_${n}`, toFrameSlug(name)],
    name,
    group: 'cs',
    categoryName: 'Council of Shadows',
    desc,
    colors: pc,
    type: 'council',
    price: 6000,
    renderFn: (c, A, i) => pips(n, c[0]) + G2(57, 1.8, A) + O(61, 0.7, c[0], 'stroke-dasharray="2 5" opacity=".7"') + ex(c, i),
  };
};

export const RAW_SPECIAL_FRAMES: SpecialFrameDef[] = [
  // ── Level Milestones & Staff ──
  {
    id: 'arcane_runic_circle',
    aliases: ['arcane_runic', 'arcane'],
    name: 'Arcane Runic Circle',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Cyan runes with crackling violet arcs',
    colors: ['#7ff6ff', '#2aa7d8', '#c9a8ff'],
    type: 'level',
    minLevel: 1,
    renderFn: (c, A, i) =>
      G2(57, 2, A) +
      S(70, R(8, 64, (k) => 'r' + k, 0.75, c[0], 0, 'tw')) +
      O(61, 0.7, c[0], 'stroke-dasharray="1 3" opacity=".7"') +
      E('elec', ['#b98bff', '#fff', '#fff'], i, 0.6),
  },
  {
    id: 'neko_kawaii_whiskers',
    aliases: ['neko_whiskers', 'kawaii_whiskers', 'nekomimi'],
    name: 'Neko Kawaii Whiskers',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Soft kitten ears, whiskers and paw prints',
    colors: ['#ff9fcb', '#e0508f', '#ffffff'],
    type: 'level',
    minLevel: 5,
    renderFn: (c, A) => {
      const e = (s: number) =>
        `<g transform="matrix(${s} 0 0 1 ${s < 0 ? 200 : 0} 0)"><path d="M${pt(55, -70)}Q${pt(68, -72)} ${pt(
          83,
          -56
        )}Q${pt(70, -46)} ${pt(55, -38)}Z" fill="${A}" stroke="${c[2]}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${pt(
          56,
          -63
        )}Q${pt(66, -63)} ${pt(76, -56)}Q${pt(67, -50)} ${pt(56, -45)}Z" fill="#c2377a" opacity=".8"/></g>`;
      const w = `<path d="M42 98L20 92M42 103L18 103M43 108L22 115" fill="none" stroke="${c[2]}" stroke-width="1" stroke-linecap="round" opacity=".85"/>`;
      return (
        e(1) +
        e(-1) +
        G2(57, 2, A) +
        w +
        `<g transform="matrix(-1 0 0 1 200 0)">${w}</g>` +
        R(2, 64, 'paw', 0.5, c[2], 45) +
        `<circle cx="148" cy="48" r="2.4" fill="${c[0]}" class="tw" style="--d:2s"/>`
      );
    },
  },
  {
    id: 'iron',
    aliases: ['iron_seal'],
    name: 'Iron Seal',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Forged iron band with studded rivets',
    colors: ['#c9d3de', '#59626f', '#e8f0f8'],
    type: 'level',
    minLevel: 10,
    renderFn: (c, A) =>
      G2(57, 3, A) +
      O(53.5, 0.8, c[2], 'opacity=".5"') +
      O(61, 1, c[1], 'stroke-dasharray="7 3"') +
      R(8, 57, 'orb', 0.42, '#232830', 22.5) +
      R(8, 57, 'orb', 0.18, c[2], 22.5),
  },
  {
    id: 'bronze',
    aliases: ['bronze_crest'],
    name: 'Bronze Crest',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Warm bronze ring with four small crests',
    colors: ['#ffbf7a', '#a8581f', '#ffe3c2'],
    type: 'level',
    minLevel: 20,
    renderFn: (c, A) =>
      G2(57, 2.6, A) +
      O(61, 0.8, c[0], 'opacity=".8"') +
      R(4, 64, 'blade', 0.7, c[0], 45) +
      R(4, 57, 'dia', 0.45, c[2], 0) +
      TK(48, 64.5, 1.6, c[1], 0.6),
  },
  {
    id: 'silver',
    aliases: ['silver_knight'],
    name: 'Silver Knight',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Woven silver with a sweeping shine',
    colors: ['#f4f8ff', '#8fa0bd', '#ffffff'],
    type: 'level',
    minLevel: 35,
    renderFn: (c, A) =>
      `<path d="${wv(57, 1.5, 14)}" fill="none" stroke="${c[0]}" stroke-width="1.2"/><path d="${wv(
        57,
        1.5,
        14,
        180
      )}" fill="none" stroke="${c[1]}" stroke-width="1.2"/>` +
      G2(57, 1.4, A) +
      S(5, AR(57, 0, 45, 2.4, '#fff', 'opacity=".9"')) +
      R(2, 63, 'blade', 0.75, c[0], 0) +
      R(1, 62, 'dia', 0.7, '#9fc0ff', -90),
  },
  {
    id: 'crimson',
    aliases: ['crimson_blade'],
    name: 'Crimson Blade',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Blood aura with four slim blades and embers',
    colors: ['#ff6070', '#a3101f', '#ffc2c8'],
    type: 'level',
    minLevel: 50,
    renderFn: (c, A, i) =>
      `<g class="p" style="--d:2.6s">${O(57, 6, c[1], 'opacity=".35"')}</g>` +
      G2(57, 2, A) +
      R(4, 67, 'blade', 1.15, c[0], 45) +
      R(4, 67, 'blade', 0.5, '#fff', 45) +
      pa('ember', i),
  },
  {
    id: 'sapphire',
    aliases: ['sapphire_arc'],
    name: 'Sapphire Arc',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Sapphire arcs with crackling inner light',
    colors: ['#8fd0ff', '#2563eb', '#e0f2ff'],
    type: 'level',
    minLevel: 65,
    renderFn: (c, A, i) =>
      G2(57, 2, A) +
      S(14, AR(62, 0, 70, 1.6, c[0]) + AR(62, 180, 70, 1.6, c[0])) +
      S(22, AR(65.5, 40, 40, 1, c[2]), 1) +
      R(3, 57, 'dia', 0.8, c[2], 90) +
      E('elec', ['#7fb8ff', '#fff', '#fff'], i, 0.58),
  },
  {
    id: 'emerald',
    aliases: ['emerald_wilds'],
    name: 'Emerald Wilds',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'A breathing nature ring with drifting leaves',
    colors: ['#7dffb0', '#14a35a', '#eafff1'],
    type: 'level',
    minLevel: 75,
    renderFn: (c, A, i) =>
      `<g class="p" style="--d:3s">${O(57, 5, c[0], 'opacity=".22"')}</g><path d="${wv(
        60.5,
        2,
        9
      )}" fill="none" stroke="${c[0]}" stroke-width=".9"/>` +
      G2(57, 1.8, A) +
      R(10, 63, 'leaf', 0.5, c[0], 0, 'b') +
      R(5, 57, 'petal', 0.55, '#fff', 18) +
      pa('fly', i, 5),
  },
  {
    id: 'golden',
    aliases: ['golden_realm'],
    name: 'Golden Realm',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Molten gold with fine rays and heat shimmer',
    colors: ['#ffe28a', '#d98e17', '#fff7d6'],
    type: 'level',
    minLevel: 80,
    renderFn: (c, A, i) =>
      `<g opacity=".7">${S(90, R(36, 60, 'spike', 0.7, c[0]))}</g><g filter="url(#fl)">${O(
        64,
        1.3,
        c[0],
        'opacity=".7"'
      )}</g>` +
      G2(57, 2.4, A) +
      R(1, 62, 'dia', 1, c[2], -90) +
      pa('spark', i, 5),
  },
  {
    id: 'shadow',
    aliases: ['shadow_void'],
    name: 'Shadow Void',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Dark essence that pulls light inward',
    colors: ['#a07bff', '#2a1450', '#ff4f7b'],
    type: 'level',
    minLevel: 85,
    renderFn: (c, A, i) => {
      const r = mk(i * 5 + 1);
      return (
        `<g filter="url(#fl)">${O(61, 5, c[1], 'opacity=".6"')}${O(64, 3, c[0], 'opacity=".3"')}</g>` +
        O(57, 2.4, '#0d0818') +
        O(57, 0.8, c[0]) +
        Array.from({ length: 8 }, () => {
          const a = r() * 360;
          return `<g class="rise" style="--d:${(2 + r() * 1.6).toFixed(1)}s;--x:${f1(-20 * cs(a))}px;--y:${f1(
            -20 * sn(a)
          )}px;animation-delay:-${(r() * 3).toFixed(1)}s"><use href="#m-orb" transform="translate(${f1(
            100 + 78 * cs(a)
          )} ${f1(100 + 78 * sn(a))}) scale(.3)" fill="${c[2]}"/></g>`;
        }).join('')
      );
    },
  },
  {
    id: 'celestial',
    aliases: ['celestial_rift'],
    name: 'Celestial Rift',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'A pulsing violet tear between worlds',
    colors: ['#d9a6ff', '#7a2fe0', '#9fe8ff'],
    type: 'level',
    minLevel: 90,
    renderFn: (c, A, i) =>
      `<g filter="url(#bl)">${O(58, 5, c[1], 'opacity=".6"')}</g><path d="${wv(
        58,
        3.2,
        17
      )}" fill="none" stroke="${c[0]}" stroke-width="1.2" class="p" style="--d:2.4s"/>` +
      O(57, 0.6, '#fff', 'opacity=".6"') +
      pa('star', i, 8, 55, 70) +
      S(30, R(2, 66, 'moon', 0.7, c[2])),
  },
  {
    id: 'divine',
    aliases: ['divine_archon'],
    name: 'Divine Archon',
    group: 'lv',
    categoryName: 'Level Milestones',
    desc: 'Prismatic corona, a thin halo and light wings',
    colors: ['#fff3b0', '#ffb86b', '#ff9fd0'],
    type: 'level',
    minLevel: 95,
    renderFn: (c, A, i) => {
      const w = `<path d="M158 100C168 88 180 82 192 70M158 106C170 100 184 100 196 98M158 112C168 112 180 116 190 124" fill="none" stroke="${c[0]}" stroke-width="1.1" opacity=".9"/>`;
      return (
        `<g opacity=".5">${S(60, R(30, 61, 'spike', 0.8, '#fff6c0'))}${S(45, R(20, 63, 'spike', 0.55, c[2]), 1)}</g>` +
        G2(57, 2, A) +
        O(61.5, 0.8, c[2]) +
        `<ellipse cx="100" cy="34" rx="14" ry="3" fill="none" stroke="${c[0]}" stroke-width="1.3"/>` +
        w +
        `<g transform="matrix(-1 0 0 1 200 0)">${w}</g>` +
        pa('feather', i, 5)
      );
    },
  },
  {
    id: 'admin',
    aliases: ['the_eternal', 'eternal'],
    name: 'The Eternal',
    group: 'lv',
    categoryName: 'Supreme Staff',
    desc: 'Guild Master Shadow. Rests calm, then spins up with tesla lightning and transforms across ten elements.',
    colors: ['#e8f4ff', '#5b3cff', '#7fd6ff'],
    type: 'role',
    minLevel: 100,
    renderFn: (c, A, i, uniquePrefix) => ET3(c, A, i, uniquePrefix),
  },
  {
    id: 'moderator',
    aliases: ['the_warden', 'warden'],
    name: 'The Warden',
    group: 'lv',
    categoryName: 'Sanctuary Wardens',
    desc: 'Sanctuary Wardens. Counter-rotating seals and pylons',
    colors: ['#7fffd4', '#1f8f8a', '#ffe08a'],
    type: 'role',
    renderFn: (c, A) =>
      G2(57, 2, A) +
      S(50, `<polygon points="${pg(6, 64)}" fill="none" stroke="${c[0]}" stroke-width="1"/>`) +
      S(50, `<polygon points="${pg(6, 64, 30)}" fill="none" stroke="${c[2]}" stroke-width=".8"/>`, 1) +
      R(4, 62, 'spike', 0.8, c[2], 0) +
      S(70, R(12, 71, (k) => 'r' + (k % 8), 0.5, c[0]), 1) +
      O(53.5, 0.6, c[2], 'opacity=".6"'),
  },

  // ── Board of Darkness ──
  {
    id: 'abyss_archon',
    aliases: ['abyss', 'archon_abyss'],
    name: 'Abyss Archon',
    group: 'bd',
    categoryName: 'Board of Darkness',
    desc: 'Deep-sea tendrils with glowing plankton',
    colors: ['#5ee7ff', '#12457a', '#a6fff0'],
    type: 'darkness',
    price: 4500,
    renderFn: (c, A, i) =>
      S(50, `<path d="${wv(62, 3, 5)}" fill="none" stroke="${c[1]}" stroke-width="2.2" opacity=".85"/>`) +
      S(37, `<path d="${wv(62, 3, 5, 180)}" fill="none" stroke="${c[0]}" stroke-width=".9"/>`, 1) +
      G2(57, 2, A) +
      R(10, 67, 'orb', 0.32, c[2], 0, 'tw') +
      E('water', c, i, 0.6),
  },
  {
    id: 'void_monarch',
    aliases: ['void_king', 'monarch_void'],
    name: 'Void Monarch',
    group: 'bd',
    categoryName: 'Board of Darkness',
    desc: 'A black ring, a slim crown and drifting souls',
    colors: ['#b794ff', '#1a0b3a', '#ff4fa3'],
    type: 'darkness',
    price: 4500,
    renderFn: (c, A, i) =>
      `<g filter="url(#fl)">${O(62, 3, c[1], 'opacity=".6"')}</g>` +
      O(57, 3, '#08040f') +
      O(57, 0.9, c[0]) +
      `<path d="M86 41L90 28L95 36L100 23L105 36L110 28L114 41Z" fill="${c[0]}" stroke="${c[2]}" stroke-width=".8"/>` +
      pa('soul', i, 6),
  },
  {
    id: 'eclipse_blade',
    aliases: ['eclipse', 'blade_eclipse'],
    name: 'Eclipse Blade',
    group: 'bd',
    categoryName: 'Board of Darkness',
    desc: 'A black disc, golden corona and twin crescents',
    colors: ['#ffd36e', '#2a1a05', '#ffffff'],
    type: 'darkness',
    price: 4500,
    renderFn: (c, A) =>
      `<g opacity=".75">${S(80, R(24, 60, 'spike', 0.65, c[0]))}</g>` +
      O(57, 3.6, '#060606') +
      O(59.6, 0.9, c[0]) +
      O(54.8, 0.7, c[0], 'opacity=".7"') +
      R(2, 66, 'moon', 1.5, c[0], 0),
  },
  {
    id: 'umbral_lord',
    aliases: ['umbral', 'lord_umbral'],
    name: 'Umbral Lord',
    group: 'bd',
    categoryName: 'Board of Darkness',
    desc: 'Shadow flames, thorns and small curved horns',
    colors: ['#b7a6e8', '#2b2250', '#e0d0ff'],
    type: 'darkness',
    price: 4500,
    renderFn: (c, A, i) => {
      const h = (s: number) =>
        `<g transform="matrix(${s} 0 0 1 ${s < 0 ? 200 : 0} 0)"><path d="M${pt(55, -70)}Q${pt(82, -86)} ${pt(
          98,
          -60
        )}Q${pt(76, -70)} ${pt(55, -50)}Z" fill="${A}" stroke="${c[2]}" stroke-width="1" stroke-linejoin="round"/></g>`;
      return (
        `<g filter="url(#fl)">${R(10, 61, 'flame', 0.85, c[1], 0, 'p')}</g>` +
        h(1) +
        h(-1) +
        G2(57, 1.8, A) +
        R(16, 62, 'spike', 0.6, c[0]) +
        pa('soul', i, 5)
      );
    },
  },
  {
    id: 'dark_primarch',
    aliases: ['primarch_dark', 'primarch'],
    name: 'Dark Primarch',
    group: 'bd',
    categoryName: 'Board of Darkness',
    desc: 'Armored ring, chevrons and a command crest',
    colors: ['#ff5a6e', '#3a0610', '#ffb3b3'],
    type: 'darkness',
    price: 4500,
    renderFn: (c, A, i) =>
      G2(57, 2.6, A) +
      O(61, 1, c[0], 'stroke-dasharray="14 4" opacity=".9"') +
      R(8, 64, 'blade', 0.8, c[0], 22.5) +
      `<path d="M100 26L107 37L100 49L93 37Z" fill="${c[0]}" stroke="${c[2]}" stroke-width=".8"/>` +
      R(4, 63, 'spike', 0.9, c[1], 45) +
      pa('ember', i, 5),
  },

  // ── Council of Shadows (Alpha + 2..10) ──
  {
    id: 'first_shadow',
    aliases: ['alpha', 'shadow_1', 'council_1'],
    name: 'First Shadow',
    group: 'cs',
    categoryName: 'Council of Shadows',
    desc: 'Alpha, the AI leader: a neural web, data pulses and a slim crown',
    colors: ['#ffffff', '#7a3cff', '#ff4fa3'],
    type: 'council',
    price: 6000,
    renderFn: (c, A, i) =>
      pips(1, c[0]) + G2(57, 1.8, A) + O(61, 0.7, c[0], 'stroke-dasharray="2 5" opacity=".7"') + FS(c, i),
  },
  shCouncil(2, 'Shadow of flame', ['#ffb347', '#e8441a', '#fff0c2'], (c, i) => E('fire', c, i, 0.58)),
  shCouncil(3, 'Shadow of tide', ['#6df3ff', '#1f8fd6', '#d6fbff'], (c, i) => E('water', c, i, 0.6)),
  shCouncil(4, 'Shadow of gale', ['#bfffe0', '#4cb7a0', '#ffffff'], (c, i) => E('wind', c, i, 0.6)),
  shCouncil(5, 'Shadow of thunder', ['#8fd6ff', '#4a3bff', '#ffffff'], (c, i) => E('thunder', c, i, 0.6)),
  shCouncil(6, 'Shadow of stone', ['#ffa56a', '#8a5a2b', '#ffd9bf'], (c, i) => E('earth', c, i, 0.6)),
  shCouncil(7, 'Shadow of frost', ['#c9f1ff', '#58a8e8', '#ffffff'], (c, i) =>
    R(12, 61, 'dia', 0.6, '#e6f8ff', 0, 'tw') + pa('snow', i, 7)
  ),
  shCouncil(8, 'Shadow of bloom', ['#9fff9f', '#2a8f4a', '#f2ffd0'], (c, i) =>
    R(10, 62, 'leaf', 0.55, c[0], 0, 'b') + pa('leaf', i, 5)
  ),
  shCouncil(9, 'Shadow of the moon', ['#e6e0ff', '#5a4fa8', '#ffffff'], (c, i) =>
    S(30, R(2, 65, 'moon', 0.9, c[0])) + pa('star', i, 6)
  ),
  shCouncil(10, 'Shadow of dusk', ['#ff9a7a', '#6a2a58', '#ffd0b8'], (c, i) =>
    pa('ember', i, 5) + R(6, 60, 'flame', 0.55, c[0], 0, 'p')
  ),
];

const SPECIAL_LOOKUP = new Map<string, SpecialFrameDef>();
RAW_SPECIAL_FRAMES.forEach((s) => {
  SPECIAL_LOOKUP.set(s.id, s);
  SPECIAL_LOOKUP.set(toFrameSlug(s.name), s);
  if (s.aliases) {
    s.aliases.forEach((a) => SPECIAL_LOOKUP.set(a, s));
  }
});

// Legacy ID Aliases mapping old database keys to new frames
const LEGACY_ALIASES: Record<string, string> = {
  shadow_sovereign_supreme: 'first_shadow',
  celestia_divine_throne: 'tokiwa',
  infinite_tsukuyomi: 'akame',
  primordial_dragon: 'omega',
  god_hand_eclipse: 'kyomu',
  celestial_emperor: 'tenno',
  solo_shadow_arise: 'shiou',
  magic_circle: 'arcana',
  cosmic_ring: 'uchu',
  shadow_monarch: 'first_shadow',
  super_saiyan: 'taiyo',
  domain_expansion: 'noroi',
  bankai_ice: 'hyoka',
  cyber_matrix: 'kikan',
  sun_breathing: 'housen',
  susanoo: 'wazawai',
  rinnegan: 'seiza',
  blood_moon: 'kyuketsu',
  frost_nova: 'kori',
  abyssal_kraken: 'yami',
  storm_bringer: 'arashi',
  celestial_starlight: 'hoshizora',
  solar_flare: 'hikari',
  radiant_angel: 'shinpan',
  demon_lord: 'maou',
  valkyrie: 'chikai',
  chaos_singularity: 'kyomu',
  strawberry_bunny: 'usagi',
  cute_neko_paws: 'suzu',
  pastel_dream: 'candy',
  slime_bouncy: 'mochi',
  chibi_boba_milk_tea: 'tenshi',
  kawaii_ghost_boo: 'kage',
  magic_star_wand: 'mahou',
  starlight_kitsune: 'kon',
  fluffy_hamster_bread: 'usagi',
  sleepy_cloud_moon: 'mikazuki',
  nekomimi: 'neko_kawaii_whiskers',
};

// ─── Resolver Engine ─────────────────────────────────────────────────────────
export function getAtelierFrame(frameId?: string | null): {
  type: 'showcase' | 'special' | 'none';
  showcase?: AtelierFrame;
  special?: SpecialFrameDef;
} {
  if (!frameId || frameId === 'none') return { type: 'none' };
  const cleanId = frameId.toLowerCase().trim();

  // 1. Direct special match
  const specialMatch = SPECIAL_LOOKUP.get(cleanId);
  if (specialMatch) return { type: 'special', special: specialMatch };

  // 2. Direct showcase match
  const showcaseMatch = SHOWCASE_LOOKUP.get(cleanId);
  if (showcaseMatch) return { type: 'showcase', showcase: showcaseMatch };

  // 3. Slugified fallback
  const slug = toFrameSlug(cleanId);
  const specialBySlug = SPECIAL_LOOKUP.get(slug);
  if (specialBySlug) return { type: 'special', special: specialBySlug };
  const showcaseBySlug = SHOWCASE_LOOKUP.get(slug);
  if (showcaseBySlug) return { type: 'showcase', showcase: showcaseBySlug };

  // 4. Legacy alias fallback
  const legacyTarget = LEGACY_ALIASES[cleanId];
  if (legacyTarget) {
    const aliasedShowcase = SHOWCASE_LOOKUP.get(toFrameSlug(legacyTarget));
    if (aliasedShowcase) return { type: 'showcase', showcase: aliasedShowcase };
    const aliasedSpecial = SPECIAL_LOOKUP.get(toFrameSlug(legacyTarget));
    if (aliasedSpecial) return { type: 'special', special: aliasedSpecial };
  }

  return { type: 'none' };
}

// ─── SVG GENERATOR ENGINE ────────────────────────────────────────────────────
export function generateShowcaseFrameSvg(
  frame: AtelierFrame,
  options: {
    avatarUrl?: string | null;
    uniqueId?: string;
    transparentCenter?: boolean;
  } = {}
): string {
  const i = frame.index;
  const s = frame.rawSpec;
  const uniquePrefix = options.uniqueId || `sc_${frame.id}_${i}`;

  const x = s.split('|');
  const [origName, ct, tierStr, colKey, m, a0, fk] = x;
  const at = a0 === 'horn' ? (ct === 'em' ? 'crown' : 'an kn sa da'.includes(ct) ? 'fin' : 'crest') : a0;
  const T = parseInt(tierStr, 10);
  const c = PAL[colKey] || ['#ffffff', '#9aa8c4', '#ffffff'];
  const rr = 62 + 2 * T;
  const k = rr / 68;
  const v = (i * 3) % 5;
  const L = 2 * PI * rr;
  const A = `url(#a_${uniquePrefix})`;
  const B = `url(#b_${uniquePrefix})`;
  const rd = mk(i * 97 + 13);

  const att = (id: string) =>
    (SGL[id] ? [1] : [1, -1])
      .map((sx) => {
        const tf = `translate(100 100) scale(${sx * k} ${k}) translate(-100 -100)`;
        return `<use href="#A-${id}" transform="translate(0 3) ${tf}" fill="#000" stroke="#000" opacity=".4"/><use href="#A-${id}" transform="${tf}" fill="${A}" stroke="${c[2]}" stroke-width="1.3"/><use href="#A-${id}" transform="${tf}" fill="url(#sh)" stroke="none"/>`;
      })
      .join('');

  let g = '';
  let post = '';

  if (ct === 'st') {
    g =
      S(
        45,
        `<path fill-rule="evenodd" d="${gear(12 + 2 * T, rr + 2, rr + 8, rr - 3)}" fill="${A}" stroke="${
          c[2]
        }" stroke-width=".8"/>` + R(12, rr + 5, 'orb', 0.5, '#2a1306')
      ) +
      [40, 220]
        .map(
          (a) =>
            `<g transform="translate(${f1(100 + (rr + 14) * cs(a))} ${f1(100 + (rr + 14) * sn(a))})">${S(
              (45 * 8) / (12 + 2 * T),
              `<path fill-rule="evenodd" d="${gear(8, 7, 11, 3, 0, 0)}" fill="${c[1]}" stroke="${
                c[2]
              }" stroke-width=".8"/>`,
              1,
              0,
              0
            )}</g>`
        )
        .join('') +
      (T > 2
        ? `<g transform="translate(100 ${100 + rr + 10})"><circle r="9" fill="#1b1209" stroke="${
            c[0]
          }" stroke-width="2"/><path d="M0 0V-6" stroke="#ff5a3c" stroke-width="1.8" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-55;55;-55" dur="3s" repeatCount="indefinite"/></path></g>`
        : '');
  } else if (ct === 'me') {
    const rv = rr + 8;
    g =
      S(30, O(rv, 4 + T * 0.5, A, `stroke-dasharray="${f1((2 * PI * rv) / 6 - 5)} 5"`)) +
      S(20, O(rr + 17, 1.5, c[2], 'stroke-dasharray="2 5"'), 1) +
      S(4 + T / 2, O(rr - 3, 2.5, c[2], `stroke-dasharray="${f1(L / 9)} ${f1(L)}" stroke-linecap="round"`)) +
      (T > 2
        ? S(26, `<polygon points="${pg(6, rr + 23)}" fill="none" stroke="${c[0]}" stroke-width="1.2"/>`, 1) +
          R(6, rr + 23, 'orb', 0.6, c[2], 0, 'tw')
        : '');
  } else if (ct === 'ru') {
    const sn_ = [5, 5, 7, 7, 8][T - 1];
    const ss = [2, 2, 3, 3, 3][T - 1];
    g =
      S(60, `<polygon points="${pg(sn_, rr - 7, -90, ss)}" fill="none" stroke="${c[1]}" stroke-width="1.3"/>`) +
      O(rr + 4, 1, c[2], 'stroke-dasharray="1 4"') +
      S(80, R(10 + T, rr + 13, (j) => 'r' + ((j + i) % 8), 0.95, c[0], 0, 'tw')) +
      (T > 3 ? S(40, R(14, rr + 27, (j) => 'r' + ((j * 3 + i) % 8), 0.8, c[2], 0, 'tw'), 1) : '');
  } else if (ct === 'ju') {
    g =
      `<path d="${wv(rr + 4, 3.5, 9)}" fill="none" stroke="${c[1]}" stroke-width="3.2"/><path d="${wv(
        rr + 4,
        3.5,
        9,
        180
      )}" fill="none" stroke="${c[0]}" stroke-width="1.4" opacity=".8"/>` +
      R(12 + 2 * T, rr + 5, 'leaf', 0.9, A, 0, 'b') +
      (T > 1
        ? Array.from({ length: 2 + T }, (_, j) => {
            const a = (j * 360) / (2 + T) + 20;
            const xCoord = 100 + (rr + 5) * cs(a);
            const yCoord = 100 + (rr + 5) * sn(a);
            return (
              R(5, 6, 'petal', 0.75, c[2], 0, '', xCoord, yCoord) +
              `<circle cx="${f1(xCoord)}" cy="${f1(yCoord)}" r="2.6" fill="${c[1]}"/>`
            );
          }).join('')
        : '');
  } else if (ct === 'cu') {
    g =
      R(12 + T, rr + 1, 'orb', 1.9, '#fff') +
      R(12 + T, rr + 1, 'orb', 1.1, c[0]) +
      R(6 + T, rr + 14, m, 0.95, c[1], 0, 'b') +
      R(6, rr + 24, 'star', 0.5, '#fff', 15, 'tw') +
      (T > 2
        ? `<g transform="translate(${f1(100 + rr * cs(50))} ${f1(
            100 + rr * sn(50)
          )})"><use href="#m-petal" transform="translate(-6 0) rotate(-90) scale(1.1)" fill="${
            c[1]
          }"/><use href="#m-petal" transform="translate(6 0) rotate(90) scale(1.1)" fill="${
            c[1]
          }"/><circle r="3" fill="${c[2]}"/></g>`
        : '');
  } else if (ct === 'an') {
    g =
      R(28 + 4 * T, rr + 2, 'spike', 0.55, c[1]) +
      R(4, rr + 12, 'paw', 0.75, c[2], 45) +
      (T > 3
        ? S(18, O(rr + 20, 2, A, `stroke-dasharray="${f1(L / 3)} ${f1(L / 6)}" stroke-linecap="round"`), 1)
        : '');
  } else if (ct === 'da') {
    const ey = 100 - rr - 12;
    const e = `<path d="M78 ${ey}Q90 ${ey - 9} 98 ${ey + 2}Q88 ${ey + 5} 78 ${ey}Z" fill="${c[2]}"`;
    g =
      `<g filter="url(#fl)">` +
      O(rr + 3, 7, c[1], 'opacity=".7"') +
      O(rr + 9, 4, c[0], 'opacity=".5"') +
      R(10 + 2 * T, rr + 8, 'flame', 1.4 + 0.2 * T, c[1], 0, 'p') +
      `</g>` +
      (T > 2 ? `<g class="p" style="--d:2.4s">${e}/>${e} transform="matrix(-1 0 0 1 200 0)"/></g>` : '');
  } else if (ct === 'kn') {
    g =
      O(rr + 4, 6 + T * 0.6, A, `stroke-dasharray="${f1(((2 * PI * (rr + 4)) / 8) - 3)} 3"`) +
      O(rr - 4, 2, c[2]) +
      R(8, rr + 4, 'orb', 0.7, '#1d1a2b', 22.5) +
      `<path d="M-9-9H9V2Q9 10 0 15Q-9 10-9 2Z" transform="translate(100 ${
        100 + rr + 10
      })" fill="${A}" stroke="${c[2]}" stroke-width="1.4"/><use href="#m-cross" transform="translate(100 ${
        100 + rr + 8
      }) scale(.6)" fill="#fff"/>`;
  } else if (ct === 'em') {
    g =
      `<g opacity=".55">${S(70, R(16, rr + 12, 'spike', 1.5 + 0.2 * T, c[1]))}</g>` +
      (T > 3 ? `<g opacity=".4">${S(55, R(12, rr + 16, 'spike', 2.2, c[0]), 1)}</g>` : '') +
      O(rr + 7, 2, c[0]) +
      R(24, rr + 3.5, 'petal', 0.55, c[2]);
    post = R(8, rr, 'dia', 1.3, c[2], 22.5, 'tw');
  } else if (ct === 'lo') {
    g =
      R(18 + T, rr + 3, 'spike', 1, c[1]) +
      S(
        30,
        `<polygon points="${pg(3, rr + 9, -90)}" fill="none" stroke="${c[0]}" stroke-width="1.3"/><polygon points="${pg(
          3,
          rr + 9,
          90
        )}" fill="none" stroke="${c[0]}" stroke-width="1.3"/>`
      );
    post =
      S(14, R(T > 3 ? 6 : 3, rr + 17, 'blade', 1.5, c[0])) +
      (T > 3 ? S(26, R(4, rr + 27, 'moon', 1, c[2], 0, 'b'), 1) : '');
  } else if (ct === 'el') {
    g =
      S(35, `<path d="${wv(rr + 6, 4, 12)}" fill="none" stroke="${c[1]}" stroke-width="2.5"/>`, 1) +
      `<circle cx="100" cy="100" r="${
        rr + 15
      }" fill="none" stroke="${c[2]}" stroke-width="1.8" stroke-dasharray="3 7 14 5"><animate attributeName="stroke-dashoffset" from="0" to="-58" dur="2s" repeatCount="indefinite"/></circle>`;
  } else if (ct === 'ce') {
    const r2 = mk(i * 31 + 5);
    const n = 6 + T;
    const pp = Array.from({ length: n }, (_, j) => {
      const a = (j * 360) / n + r2() * 30;
      const d = rr + 10 + r2() * 18;
      return [100 + d * cs(a), 100 + d * sn(a)];
    });
    g =
      `<g filter="url(#bl)" opacity=".6">${O(rr + 8, 12, c[1])}</g><polyline points="${pp
        .concat([pp[0]])
        .map((q) => f1(q[0]) + ',' + f1(q[1]))
        .join(' ')}" fill="none" stroke="${c[2]}" stroke-width=".9" opacity=".7"/>` +
      pp
        .map(
          (q) =>
            `<g class="tw" style="--d:${(2 + r2() * 2) | 0}s;animation-delay:-${(r2() * 3).toFixed(
              1
            )}s"><use href="#m-star" transform="translate(${f1(q[0])} ${f1(q[1])}) scale(.7)" fill="${
              c[2]
            }"/></g>`
        )
        .join('');
    post =
      S(20, R(T > 3 ? 2 : 1, rr + 14, 'moon', 1.4, c[0])) +
      S(5, O(rr + 4, 3, c[2], `stroke-dasharray="${f1(L / 10)} ${f1(L)}" stroke-linecap="round" opacity=".9"`));
  } else if (ct === 'cw') {
    const clk = v % 2 === 0;
    const n1 = 10 + 2 * T;
    g =
      TK(60, rr + 9, 3, c[2], 0.9) +
      R(12, rr + 8, 'dia', 0.5, c[0]) +
      S(
        48,
        `<path fill-rule="evenodd" d="${gear(n1, rr + 1, rr + 7, rr - 4)}" fill="${A}" stroke="${
          c[2]
        }" stroke-width=".7"/>`
      ) +
      (clk
        ? S(44, `<path d="M100 ${100 - rr - 6}V${100 - rr - 20}" stroke="${c[2]}" stroke-width="2.2" stroke-linecap="round"/>`) +
          S(9, `<path d="M100 ${100 - rr - 6}V${100 - rr - 27}" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`) +
          (T > 3
            ? S(3, `<path d="M100 ${100 - rr - 6}V${100 - rr - 30}" stroke="#ff6a5a" stroke-width=".8"/>`)
            : '')
        : [90, 210, 330]
            .slice(0, T > 2 ? 3 : T > 1 ? 2 : 1)
            .map(
              (a) =>
                `<g transform="translate(${f1(100 + (rr + 10) * cs(a))} ${f1(100 + (rr + 10) * sn(a))})">${S(
                  (48 * 8) / n1,
                  `<path fill-rule="evenodd" d="${gear(8, 4.5, 7.5, 2, 0, 0)}" fill="${c[1]}" stroke="${
                    c[2]
                  }" stroke-width=".6"/>`,
                  1,
                  0,
                  0
                )}</g>`
            )
            .join(''));
  } else if (ct === 'as') {
    const elArc = (a: number) =>
      `<ellipse cx="100" cy="100" rx="${rr + 11}" ry="${
        (rr + 11) * 0.34
      }" fill="none" stroke="${c[0]}" stroke-width=".8" opacity=".85" transform="rotate(${a} 100 100)"/>`;
    g =
      S(90, elArc(0) + (T > 1 ? elArc(60) : '') + (T > 2 ? elArc(120) : '')) +
      R(12, rr + 6, (k) => 'r' + (k % 8), 0.55, c[2], 0, 'tw') +
      O(rr + 17, 0.6, c[2], 'stroke-dasharray="1 4" opacity=".7"') +
      S(14, R(1, rr + 10, 'orb', 0.8, c[2])) +
      (T > 1 ? S(22, R(1, rr + 17, 'orb', 1.2, c[0], 120), 1) : '') +
      (T > 3 ? S(40, R(1, rr + 24, 'orb', 0.9, '#fff', 240)) : '');
  } else if (ct === 'sg') {
    g =
      R(8 + 2 * T, rr + 6, 'flame', 0.8 + 0.06 * T, '#7fd0ff', 0, 'p') +
      R(8 + 2 * T, rr + 6, 'flame', 0.45 + 0.04 * T, '#fff', 9, 'p') +
      R(16 + T, rr + 3, 'fang', 0.45, c[0]) +
      (T > 3 ? S(40, O(rr + 16, 0.8, c[2], 'stroke-dasharray="3 7"'), 1) : '');
  } else if (ct === 'to') {
    g =
      O(rr + 4, 5 + T * 0.6, A) +
      TK(28, rr + 4, 5 + T * 0.6, '#2a0000', 0.85) +
      S(18 - T, R(3, rr + 4, 'tm', 1.05 + 0.05 * T, '#150000')) +
      (T > 3
        ? S(30, R(3, rr + 14, 'blade', 1.1, '#150000', 60), 1) + O(rr + 11, 0.8, c[2], 'opacity=".8"')
        : '') +
      (T > 4 ? S(9, R(6, rr + 22, 'tm', 0.8, c[0])) : '');
  } else if (ct === 'sa') {
    g =
      S(40, `<path d="${wv(rr + 4, 3.5, 10)}" fill="none" stroke="${c[1]}" stroke-width="3"/>`, 1) +
      R(14 + T, rr + 5, 'leaf', 0.8, c[2], 0, 'b') +
      S(60, O(rr + 13, 1.4, c[0], 'stroke-dasharray="2 6"'));
    post = R(8, rr, 'orb', 1.4, '#fff', 22.5) + R(8, rr, 'orb', 0.55, c[0], 22.5);
  } else if (ct === 'ho') {
    g =
      O(rr + 9, 1.5, c[2], 'stroke-dasharray="1 4"') +
      S(60, R(16, rr + 5, 'petal', 1.3, '#fff')) +
      R(4, rr + 17, 'cross', 0.9, c[0], 45, 'p') +
      S(40, O(rr + 14, 1.2, c[0], 'stroke-dasharray="10 6"'), 1);
  } else {
    g =
      R(16, rr + 3, 'petal', 1.1, c[2], 0, 'p') +
      S(22, R(5, rr + 17, 'orb', 1.5, c[0]), 1) +
      S(22, R(5, rr + 17, 'orb', 0.7, '#fff'), 1) +
      (T > 2
        ? `<use href="#m-moon" transform="translate(${f1(100 + (rr + 22) * cs(-45))} ${f1(
            100 + (rr + 22) * sn(-45)
          )}) scale(1.8)" fill="${c[0]}"/>`
        : '');
  }

  const mo =
    S(
      44 - 5 * T,
      R(6 + 2 * T + v, rr + 8 + v * 1.5, m, 0.7 + T * 0.07, c[0]),
      v % 2
    ) +
    (T > 2
      ? S(
          30,
          R(8 + T, rr, ['dia', 'orb', 'star'][v % 3], 0.85, c[2]) +
            R(8 + T, rr, ['dia', 'orb', 'star'][v % 3], 0.35, '#fff'),
          1
        )
      : '') +
    (T > 3 ? R(10, rr + 25, 'star', 0.55, c[2], 0, 'tw') : '');

  const rays =
    T > 3 && ct !== 'em'
      ? `<g opacity=".35">${S(80, R(20, rr + 20, 'spike', 1.2 + 0.25 * T, c[0]), 1)}</g>`
      : '';

  const eb = EM[(i * 3) % 14];
  const emb =
    T > 1 && ct !== 'st' && ct !== 'kn'
      ? `<g transform="translate(100 ${f1(100 + rr)})"><circle r="${5 + T}" fill="#150f2a" stroke="${A}" stroke-width="2"/><use href="#m-${eb}" transform="scale(${(
          0.4 +
          T * 0.07
        ).toFixed(2)})" ${C(eb, c[2])}/></g>`
      : '';

  const shine =
    T > 2
      ? S(
          6 - T * 0.6,
          O(rr, 3.2, '#fff', `stroke-dasharray="26 ${f1(L - 26)}" stroke-linecap="round" opacity=".85"`)
        )
      : '';

  let fx = '';
  let el = '';
  const ks = fk.split('+');
  const X = FXT[ks.find((q) => FXT[q]) || ''];
  ks.forEach((q) => {
    if (EL[q]) el += EL[q](c, rr, T, rd);
  });
  if (X) {
    for (let q = 0; q < 4 + 2 * T; q++) {
      const a = rd() * 360;
      const d = rr - 4 + rd() * (24 + 4 * T);
      fx += `<g class="${X[2] ? 'rise' : 'tw'}" style="--d:${(2.2 + rd() * 2.5).toFixed(1)}s;--y:${Math.round(
        X[2] * (30 + rd() * 30)
      )}px;--x:${Math.round(rd() * 20 - 10)}px;animation-delay:-${(rd() * 4).toFixed(1)}s"><use href="#m-${
        X[0]
      }" transform="translate(${f1(100 + d * cs(a))} ${f1(100 + d * sn(a))}) scale(${(
        0.5 +
        rd() * 0.5
      ).toFixed(2)})" ${C(X[0], X[1])}/></g>`;
    }
  }

  const avNode = options.transparentCenter
    ? ''
    : options.avatarUrl
    ? `<image href="${options.avatarUrl}" x="48" y="48" width="104" height="104" clip-path="url(#cp)" preserveAspectRatio="xMidYMid slice"/>`
    : `<use href="#av"/>`;

  return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${frame.name}" class="w-full h-full block overflow-visible">
<defs>
<linearGradient id="a_${uniquePrefix}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
<radialGradient id="b_${uniquePrefix}"><stop offset=".55" stop-color="${c[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient>
</defs>
${options.transparentCenter ? '' : `<circle cx="100" cy="100" r="${(rr + 10 + 2 * T) * 0.84}" fill="${B}" class="p" style="--d:3.6s"/>`}
${Y(0, rays)}
${Y(-0.6, BK[at] ? att(at) : '')}
${Y(0.3, g)}
${avNode}
${O(50, 7, '#000', 'opacity=".4"')}
${Y(0.6, MD[at] ? att(at) : '')}
${Y(0.7, RG(ct === 'st' ? 0 : v, rr, 2 + T * 0.4, A) + O(rr - 4, 1, c[2], 'opacity=".7"') + post + shine + emb)}
${O(52.5, 2, c[1])}
${Y(1.1, mo)}
${Y(1.5, at !== '-' && !BK[at] && !MD[at] ? att(at) : '')}
${Y(1.9, fx + el)}
</svg>`;
}

export function generateSpecialFrameSvg(
  frame: SpecialFrameDef,
  options: {
    avatarUrl?: string | null;
    uniqueId?: string;
    transparentCenter?: boolean;
  } = {}
): string {
  const i = 400 + Math.abs(frame.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 500);
  const uniquePrefix = options.uniqueId || `sp_${frame.id}_${i}`;
  const c = frame.colors;
  const A = `url(#a_${uniquePrefix})`;
  const actualAvatar = options.avatarUrl || 'https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c';

  const avNode = options.transparentCenter
    ? ''
    : options.avatarUrl
    ? `<image href="${options.avatarUrl}" x="48" y="48" width="104" height="104" clip-path="url(#cp)" preserveAspectRatio="xMidYMid slice"/>`
    : `<use href="#av"/>`;

  return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${frame.name}" class="w-full h-full block overflow-visible">
<defs>
<linearGradient id="a_${uniquePrefix}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
<radialGradient id="b_${uniquePrefix}"><stop offset=".6" stop-color="${c[1]}" stop-opacity=".5"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient>
<g id="av_${uniquePrefix}"><image href="${actualAvatar}" x="48" y="48" width="104" height="104" clip-path="url(#cp)" preserveAspectRatio="xMidYMid slice"/></g>
</defs>
${options.transparentCenter ? '' : `<circle cx="100" cy="100" r="68" fill="url(#b_${uniquePrefix})" class="p" style="--d:4s"/>`}
${avNode}
${O(52.5, 1.6, c[1])}
${Y0(1, frame.renderFn(c, A, i, uniquePrefix))}
${frame.id === 'admin' ? '' : S(8 + (i % 5), AR(57, 0, 30, 2.6, '#fff', 'opacity=".55"'))}
${frame.id !== 'admin' && frame.type === 'darkness' ? S(40, O(70, 0.6, c[0], 'stroke-dasharray="1 6" opacity=".5"'), 1) : ''}
</svg>`;
}

// ─── Global SVG Definitions & Global CSS ─────────────────────────────────────
export const ATELIER_GLOBAL_DEFS_SVG = `
<svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;">
<defs id="df">
<clipPath id="cp"><circle cx="100" cy="100" r="52"/></clipPath>
<filter id="fl" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".02 .05" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="7s" values=".02 .05;.03 .09;.02 .05" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="14"/></filter>
<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4.5"/></filter>
<filter id="gr"><feColorMatrix values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter>
<filter id="gc"><feColorMatrix values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>
<clipPath id="sl"><rect x="40" y="62" width="120" height="9"/><rect x="40" y="96" width="120" height="14"/><rect x="40" y="128" width="120" height="7"/></clipPath>
<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
<radialGradient id="cm"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="pl"><stop offset="0" stop-color="#cfe8ff" stop-opacity=".45"/><stop offset="1" stop-color="#7fa8ff" stop-opacity="0"/></radialGradient>

<!-- Top-Nav Yin-Yang Logo Tesla Lightning Displacement Filter -->
<filter id="fl-tesla" x="-40%" y="-40%" width="180%" height="180%">
  <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" result="noise">
    <animate attributeName="baseFrequency" values="0.09;0.14;0.08;0.12;0.10" dur="0.8s" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G"/>
</filter>

<g id="av"><image href="https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c" x="48" y="48" width="104" height="104" clip-path="url(#cp)" preserveAspectRatio="xMidYMid slice"/></g>
${Object.entries(M)
  .map(([k, d]) => `<path id="m-${k}" d="${d}"/>`)
  .join('\n')}
${Object.entries(AT)
  .map(([k, h]) => `<g id="A-${k}">${h}</g>`)
  .join('\n')}
</defs>
</svg>
`;

export const ATELIER_GLOBAL_CSS = `
@keyframes pl { 50% { transform: scale(1.14); opacity: .65; } }
@keyframes tw { 0%, 100% { opacity: .2; } 50% { opacity: 1; } }
@keyframes bo { 50% { transform: translateY(-3px); } }
@keyframes ri { 0% { transform: translate(0, 0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(var(--x, 0), var(--y, -30px)); opacity: 0; } }
@keyframes fk { 0%, 86%, 95%, 100% { opacity: 0; } 88%, 93% { opacity: 1; } 91% { opacity: .2; } }

/* Top-Nav Yin-Yang Logo Tesla Lightning Keyframes */
@keyframes shadow-lightning-flash-1 {
  0%, 82% { opacity: 0; transform: rotate(0deg) scale(0.96); }
  84% { opacity: 1; transform: rotate(6deg) scale(1.06); }
  88% { opacity: 0.15; transform: rotate(-4deg) scale(0.95); }
  92% { opacity: 0.95; transform: rotate(3deg) scale(1.03); }
  96% { opacity: 0.2; transform: rotate(0deg) scale(0.98); }
  100% { opacity: 0; transform: rotate(0deg) scale(1); }
}
@keyframes shadow-lightning-flash-2 {
  0%, 78% { opacity: 0; transform: rotate(0deg) scale(0.95) scaleX(-1); }
  80% { opacity: 0.95; transform: rotate(-10deg) scale(1.06) scaleX(-1); }
  85% { opacity: 0.1; transform: rotate(8deg) scale(0.93) scaleX(-1); }
  90% { opacity: 0.9; transform: rotate(-3deg) scale(1.03) scaleX(-1); }
  95% { opacity: 0; transform: rotate(0deg) scale(1) scaleX(-1); }
  29% { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes shadow-storm-flicker {
  0%, 82%, 100% { opacity: 0; }
  84% { opacity: 0.45; }
  87% { opacity: 0.08; }
  91% { opacity: 0.55; }
  94% { opacity: 0; }
}

.shadow-tesla-arc-1 { transform-box: fill-box; transform-origin: center; animation: shadow-lightning-flash-1 2.1s infinite; }
.shadow-tesla-arc-2 { transform-box: fill-box; transform-origin: center; animation: shadow-lightning-flash-2 2.7s infinite 0.5s; }
.shadow-tesla-storm { animation: shadow-storm-flicker 2.6s infinite; }

.p { transform-box: fill-box; transform-origin: center; animation: pl var(--d, 3s) ease-in-out infinite; }
.b { animation: bo var(--d, 3s) ease-in-out infinite; }
.tw { animation: tw var(--d, 3s) ease-in-out infinite; }
.rise { animation: ri var(--d, 3s) linear infinite; }
.fk { animation: fk var(--d, 2s) linear infinite; }
.ly { transform: translate(calc(var(--z, 0) * var(--px, 0) * 1px), calc(var(--z, 0) * var(--py, 0) * 1px)); transition: transform .2s ease-out; }
.z * { animation-play-state: paused !important; }

/* Frozen Preview State: completely freezes particles (.rise), sparks (.fk), pulses (.p, .tw, .b), tesla arcs, and all animations */
.ff-preview:not(.ff-playing),
.ff-preview:not(.ff-playing) *,
.ff-preview:not(.ff-playing) .rise,
.ff-preview:not(.ff-playing) .fk,
.ff-preview:not(.ff-playing) .p,
.ff-preview:not(.ff-playing) .tw,
.ff-preview:not(.ff-playing) .b,
.ff-preview:not(.ff-playing) .shadow-tesla-arc-1,
.ff-preview:not(.ff-playing) .shadow-tesla-arc-2,
.ff-preview:not(.ff-playing) .shadow-tesla-storm,
.ff-preview.ff-frozen,
.ff-preview.ff-frozen *,
.ff-preview.ff-frozen .rise,
.ff-preview.ff-frozen .fk,
.ff-preview.ff-frozen .p,
.ff-preview.ff-frozen .tw,
.ff-preview.ff-frozen .b,
.ff-preview.ff-frozen .shadow-tesla-arc-1,
.ff-preview.ff-frozen .shadow-tesla-arc-2,
.ff-preview.ff-frozen .shadow-tesla-storm,
.ff-frozen,
.ff-frozen * {
  animation-play-state: paused !important;
}

/* Run animations on Card Hover or when Explicitly Tapped/Playing */
.group:hover .ff-preview,
.group:hover .ff-preview *,
.group:hover .ff-preview .rise,
.group:hover .ff-preview .fk,
.group:hover .ff-preview .p,
.group:hover .ff-preview .tw,
.group:hover .ff-preview .b,
.group:hover .ff-preview .shadow-tesla-arc-1,
.group:hover .ff-preview .shadow-tesla-arc-2,
.group:hover .ff-preview .shadow-tesla-storm,
.ff-preview:hover,
.ff-preview:hover *,
.ff-preview:hover .rise,
.ff-preview:hover .fk,
.ff-preview:hover .p,
.ff-preview:hover .tw,
.ff-preview:hover .b,
.ff-preview.ff-playing,
.ff-preview.ff-playing *,
.ff-preview.ff-playing .rise,
.ff-preview.ff-playing .fk,
.ff-preview.ff-playing .p,
.ff-preview.ff-playing .tw,
.ff-preview.ff-playing .b {
  animation-play-state: running !important;
}

@media (prefers-reduced-motion: reduce) {
  svg * { animation: none !important; }
}
`;

// ─── Unified Store Frame Inventory ───────────────────────────────────────────
export const ALL_ATELIER_STORE_FRAMES = [
  ...ATELIER_SHOWCASE_FRAMES.map((f) => ({
    id: f.id,
    name: f.name,
    type: 'store' as const,
    minLevel: 0,
    price: f.price,
    tag: f.rarity,
    tierBadge: `Tier ${f.tier}`,
    description: `${f.rarity} ${f.categoryName} Frame. Motif: ${f.motif}, Attachment: ${f.attachment}.`,
    category: f.category,
    categoryName: f.categoryName,
    color: f.colors[0],
    colors: f.colors,
    legacyId: f.legacyId,
  })),
  ...RAW_SPECIAL_FRAMES.filter((f) => f.type === 'council').map((f) => ({
    id: f.id,
    name: f.name,
    type: 'store' as const,
    minLevel: 0,
    price: f.price || 6000,
    tag: 'Council',
    tierBadge: 'Council of Shadows',
    description: f.desc,
    category: 'cs',
    categoryName: 'Council of Shadows',
    color: f.colors[0],
    colors: f.colors,
  })),
  ...RAW_SPECIAL_FRAMES.filter((f) => f.type === 'darkness').map((f) => ({
    id: f.id,
    name: f.name,
    type: 'store' as const,
    minLevel: 0,
    price: f.price || 4500,
    tag: 'Darkness',
    tierBadge: 'Board of Darkness',
    description: f.desc,
    category: 'bd',
    categoryName: 'Board of Darkness',
    color: f.colors[0],
    colors: f.colors,
  })),
  ...RAW_SPECIAL_FRAMES.filter((f) => f.type === 'level').map((f) => ({
    id: f.id,
    name: f.name,
    type: 'level' as const,
    minLevel: f.minLevel || 0,
    price: 0,
    tag: `Lv. ${f.minLevel}`,
    tierBadge: 'Milestone',
    description: f.desc,
    category: 'lv',
    categoryName: 'Level Milestones',
    color: f.colors[0],
    colors: f.colors,
  })),
  ...RAW_SPECIAL_FRAMES.filter((f) => f.type === 'role').map((f) => ({
    id: f.id,
    name: f.name,
    type: 'role' as const,
    minLevel: 0,
    price: 0,
    tag: 'Staff',
    tierBadge: 'Exclusive',
    description: f.desc,
    category: 'role',
    categoryName: 'Supreme Staff',
    color: f.colors[0],
    colors: f.colors,
  })),
];
