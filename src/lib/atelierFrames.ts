// Shadow Garden Atelier Frame System
// Direct compilation of the handcrafted SVG engine from Kagemi Frame Atelier
// Features: 98 Showcase Frames + 29 Level / Board of Darkness / Council of Shadows Frames
// Mathematical layer depth, SMIL keyframe transformations, and Tesla-Coil elemental storm

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
}

// ─── Mathematical Helpers & Projection ────────────────────────────────────────
const PI = Math.PI;
const cs = (a: number) => Math.cos((a * PI) / 180);
const sn = (a: number) => Math.sin((a * PI) / 180);
const f1 = (n: number) => n.toFixed(1);

// ─── Color Palettes ───────────────────────────────────────────────────────────
export const PAL: Record<string, [string, string, string]> = {
  gold: ['#ffe28a', '#e0a02c', '#fff4c8'],
  silver: ['#f2f6ff', '#9aa8c4', '#ffffff'],
  copper: ['#ffc08a', '#b8622c', '#ffe0c8'],
  brass: ['#ebd288', '#997e36', '#fff1c2'],
  ruby: ['#ff8a98', '#c92a3e', '#ffd0d6'],
  cyan: ['#8ae8ff', '#2096b8', '#d0f6ff'],
  void: ['#b494f0', '#4a2b85', '#dfd0f8'],
  blood: ['#ff6b6b', '#851a1a', '#ffbaba'],
  jade: ['#8affc2', '#23995c', '#d2ffe5'],
  rose: ['#ffa8ca', '#b83b6e', '#ffd6e6'],
  violet: ['#d096ff', '#6e2eb8', '#eed4ff'],
  ice: ['#c4f0ff', '#4aa4cc', '#e8f9ff'],
  ember: ['#ff9d6b', '#ba3f18', '#ffd1ba'],
  sun: ['#fff07a', '#c78d0a', '#fff9c7'],
  night: ['#8a9dff', '#28388a', '#d4dcff'],
  mint: ['#a8ffd8', '#2cb87d', '#dcffef'],
  lime: ['#d4ff7a', '#78b81a', '#edffba'],
};

// ─── Motif Path Data ─────────────────────────────────────────────────────────
export const M: Record<string, string> = {
  leaf: 'M0-11C8-4 8 6 0 11C-8 6-8-4 0-11Z',
  dia: 'M0-10L6 0L0 10L-6 0Z',
  spike: 'M0-12L4 0L0 4L-4 0Z',
  petal: 'M0-10C7-10 9-3 0 10C-9-3-7-10 0-10Z',
  star: 'M0-11L3-3L11-3L5 2L7 10L0 5L-7 10L-5 2L-11-3L-3-3Z',
  flame: 'M0-11C5-6 7 0 3 6C0 10-6 7-4 2C-2-2-1-6 0-11Z',
  heart: 'M0-5C0-9 5-11 8-7C11-3 7 3 0 9C-7 3-11-3-8-7C-5-11 0-9 0-5Z',
  moon: 'M-4-10A9 9 0 1 1-4 10A7 7 0 0 0-4-10Z',
  paw: 'M0-3C2-3 4-1 4 2C4 5 2 6 0 6C-2 6-4 5-4 2C-4-1-2-3 0-3ZM-5-7C-4-7-3-6-3-4C-3-3-4-2-5-2C-7-2-7-3-7-4C-7-6-6-7-5-7ZM5-7C6-7 7-6 7-4C7-3 6-2 5-2C4-2 3-3 3-4C3-6 4-7 5-7ZM-1-9C0-9 1-8 1-7C1-5 0-4-1-4C-2-4-3-5-3-7C-3-8-2-9-1-9Z',
  orb: 'M0-5A5 5 0 1 1 0 5A5 5 0 1 1 0-5Z',
  blade: 'M0-12C3-6 4 2 2 12L0 10L-2 12C-4 2-3-6 0-12Z',
  fang: 'M-4-10C2-8 5 0 0 10C-2 4-5-2-4-10Z',
  cross: 'M-2-11H2V-2H11V2H2V11H-2V2H-11V-2H-2Z',
  bolt: 'M2-11L-5 0H1L-2 11L7-1H1Z',
  r0: 'M0-10L10 0L0 10L-10 0Z',
  r1: 'M-7-7L7-7L7 7L-7 7Z',
  r2: 'M0-10A10 10 0 1 1-0.1-10',
  r3: 'M-8-4L0-10L8-4L5 6L-5 6Z',
  r4: 'M0-10V10M-10 0H10',
  r5: 'M-6-6L6 6M6-6L-6 6',
  r6: 'M0-10C6-10 9-4 6 2L0 10L-6 2C-9-4-6-10 0-10Z',
  r7: 'M-8-8H8L0 10Z',
};

// ─── Attachments ─────────────────────────────────────────────────────────────
export const AT: Record<string, string> = {
  ear: '<path d="M125.3 37.4Q125.0 23.2 156.6 30.1Q169.9 59.6 156.0 62.3A67.5 67.5 0 0 0 125.3 37.4Z"/><path d="M132.7 41.0Q132.0 31.3 151.6 36.3Q160.5 54.4 150.9 55.7A67.5 67.5 0 0 0 132.7 41.0Z" fill="#0005" stroke="none"/>',
  fox: '<path d="M123.1 36.6Q123.4 18.5 152.0 9.9Q166.8 47.8 150.2 54.8A67.5 67.5 0 0 0 123.1 36.6Z"/><path d="M129.6 39.3Q129.9 26.1 148.8 22.0Q157.4 44.6 145.2 49.8A67.5 67.5 0 0 0 129.6 39.3Z" fill="#0005" stroke="none"/><path d="M144.6 16.1L152.5 9.1L154.5 22.2Z" fill="#000a" stroke="none"/>',
  wolf: '<path d="M116.3 34.5Q115.2 13.6 159.1 24.4Q176.0 56.1 156.0 62.3A67.5 67.5 0 0 0 116.3 34.5Z"/><path d="M125.3 37.4Q124.6 24.2 152.9 32.2Q162.8 50.9 150.2 54.8A67.5 67.5 0 0 0 125.3 37.4Z" fill="#0005" stroke="none"/>',
  bun: '<path d="M131.7 40.4C135.6 11.9 158.2 -9.5 176.3 2.3C192.1 17.0 170.5 31.9 151.7 56.6A67.5 67.5 0 0 0 131.7 40.4Z"/><path d="M136.8 43.4C144.1 17.0 162.1 4.4 171.7 11.4C180.6 19.4 167.9 32.1 148.6 53.1A67.5 67.5 0 0 0 136.8 43.4Z" fill="#0005" stroke="none"/>',
  horn: '<path d="M128 52C126 28 146 10 172 6C160 20 158 36 150 60Z"/>',
  antler: '<path d="M134.0 41.1Q129.4 19.2 155.1 11.8M133.6 20.8L117.4 1.5M146.5 16.0L145.6 -2.3M132.9 32.6L114.9 15.3" fill="none" stroke-width="3" stroke-linecap="round"/>',
  fin: '<path d="M127.5 38.3C126.0 20.1 148.8 8.2 183.2 25.1C169.6 25.4 170.6 36.4 184.0 49.5C173.0 50.8 169.3 60.0 160.7 70.4A67.5 67.5 0 0 0 127.5 38.3Z"/><path d="M135.8 42.8L169.6 22.7M148.6 53.1L177.9 47.4" fill="none" stroke="#0006" stroke-width="1.2"/>',
  crest: '<path d="M76.9 36.6L80.2 20.4L86.9 29.2L89.0 10.7L95.6 28.1L100.0 0.0L104.4 28.1L111.0 10.7L113.1 29.2L119.8 20.4L123.1 36.6A67.5 67.5 0 0 0 76.9 36.6Z"/>',
  wing: '<path d="M146 98C166 70 190 62 216 34C214 64 206 88 186 102C198 100 208 100 218 102C206 118 180 124 148 118Z"/><path d="M152 102C170 88 190 82 206 68M152 110C172 102 192 102 208 102M154 96C172 80 192 70 208 52M154 114C172 110 194 112 210 112" fill="none" stroke="#0007" stroke-width="1.5"/>',
  wing2: '<path d="M146 100L190 44L182 80L212 66L198 98L218 98L192 120L146 112Z"/>',
  sword: '<path d="M62 164L170 34L180 42L70 172Z"/><path d="M162 26L186 46L182 52L156 32Z"/>',
  pipe: '<path d="M148 76C172 72 184 56 180 28" fill="none" stroke-width="6" stroke-linecap="round"/><circle cx="180" cy="26" r="5"/>',
  crown: '<path d="M70 38L78 6L92 26L100-6L108 26L122 6L130 38Z"/><circle cx="100" cy="6" r="3.5" fill="#fff" stroke="none"/><circle cx="78" cy="6" r="2.5" fill="#fff" stroke="none"/><circle cx="122" cy="6" r="2.5" fill="#fff" stroke="none"/>',
  halo: '<ellipse cx="100" cy="6" rx="30" ry="7" fill="none" stroke-width="3.5"/>',
  gem: '<path d="M100 4L112 22L100 46L88 22Z"/><path d="M100 4V46M88 22H112" fill="none" stroke="#fff6" stroke-width="1"/>',
};

const SGL: Record<string, number> = { crown: 1, halo: 1, gem: 1, crest: 1 };
const BK: Record<string, number> = { wing: 1, wing2: 1, sword: 1, pipe: 1 };
const MD: Record<string, number> = { ear: 1, bun: 1, fox: 1, wolf: 1, fin: 1, antler: 1, horn: 1 };

export const FXT: Record<string, [string, string, number]> = {
  sakura: ['petal', '#ffb3d1', 1],
  ember: ['flame', '#ff8a3a', -1],
  snow: ['orb', '#e0f4ff', 1],
  spark: ['spike', '#ffe680', -1],
  leaf: ['leaf', '#8affaa', 1],
  bubble: ['orb', '#a8f0ff', -1],
  feather: ['petal', '#ffffff', 1],
  star: ['star', '#fff099', 1],
  rune: ['dia', '#c496ff', -1],
  fly: ['orb', '#b8ff8a', 1],
  soul: ['flame', '#9fa8ff', -1],
  heart: ['heart', '#ff94ba', 1],
};

const C = (id: string, col: string) =>
  /^r\d/.test(id) ? `fill="none" stroke="${col}" stroke-width="1.8"` : `fill="${col}"`;

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
    const a = off + (360 / n) * k;
    const mid = typeof id === 'function' ? id(k) : id;
    return `<use href="#m-${mid}" transform="translate(${f1(cx + r * cs(a))} ${f1(cy + r * sn(a))}) rotate(${f1(
      a + 90
    )}) scale(${sc})" ${C(mid, col)} ${cl ? `class="${cl}"` : ''}/>`;
  }).join('');

const S = (d: number, x: string, rv?: number, cx = 100, cy = 100) =>
  `<g><animateTransform attributeName="transform" type="rotate" from="${rv ? '360' : '0'} ${cx} ${cy}" to="${
    rv ? '0' : '360'
  } ${cx} ${cy}" dur="${d}s" repeatCount="indefinite"/>${x}</g>`;

const O = (r: number, w: number, s: string, x = '') =>
  `<circle cx="100" cy="100" r="${f1(r)}" fill="none" stroke="${s}" stroke-width="${w}" ${x}/>`;

const pt = (r: number, a: number) => f1(100 + r * cs(a)) + ',' + f1(100 + r * sn(a));
const pg = (n: number, r: number, o = 0, s = 1) =>
  Array.from({ length: n }, (_, k) => pt(r * (s && k % 2 ? s : 1), o + (360 / n) * k)).join(' ');

const gear = (n: number, r1: number, r2: number, rh: number, cx = 100, cy = 100) => {
  let d = '';
  const s = (2 * PI) / n;
  for (let k = 0; k < n; k++) {
    const a = k * s;
    const a1 = a + s * 0.25;
    const a2 = a + s * 0.5;
    const a3 = a + s * 0.75;
    d += (k ? 'L' : 'M') + f1(cx + r1 * Math.cos(a)) + ' ' + f1(cy + r1 * Math.sin(a));
    d += 'L' + f1(cx + r2 * Math.cos(a1)) + ' ' + f1(cy + r2 * Math.sin(a1));
    d += 'L' + f1(cx + r2 * Math.cos(a2)) + ' ' + f1(cy + r2 * Math.sin(a2));
    d += 'L' + f1(cx + r1 * Math.cos(a3)) + ' ' + f1(cy + r1 * Math.sin(a3));
  }
  return d + `Z M${cx - rh} ${cy} A${rh} ${rh} 0 1 0 ${cx + rh} ${cy} A${rh} ${rh} 0 1 0 ${cx - rh} ${cy}Z`;
};

const wv = (r: number, a: number, fq: number, ph = 0) =>
  'M' +
  Array.from({ length: 73 }, (_, k) => {
    const t = k * 5;
    const q = r + a * sn(t * fq + ph);
    return f1(100 + q * cs(t)) + ' ' + f1(100 + q * sn(t));
  }).join('L');

const mk = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;

const sp = (r: number, sw: number, o: number) =>
  'M' +
  Array.from({ length: 30 }, (_, k) => {
    const a = o + (k * sw) / 29;
    const q = r - k * 0.35;
    return f1(100 + q * cs(a)) + ' ' + f1(100 + q * sn(a));
  }).join('L');

const pd = (n: number, r: number, o = 0) => 'M' + pg(n, r, o).split(' ').join('L') + 'Z';
const RP = (d: string, w: number, A: string) => {
  const s = `d="${d}" fill="none" stroke-linejoin="round"`;
  return `<path ${s} stroke="#000" stroke-width="${w + 2}" opacity=".45" transform="translate(0 2.5)"/><path ${s} stroke="${A}" stroke-width="${w}"/><path ${s} stroke="#fff" stroke-width=".7" opacity=".6"/>`;
};

const O3 = (r: number, w: number, A: string) =>
  O(r + 1, w + 2, '#000', 'opacity=".45" transform="translate(0 2.5)"') +
  O(r, w, A) +
  O(r - w / 2 + 0.4, 0.7, '#fff', 'opacity=".6"');

const RG = (v: number, r: number, w: number, A: string) =>
  [
    () => O3(r, w, A),
    () => RP(pd(6, r * 1.1, -90), w, A),
    () => RP(pd(8, r * 1.05, -90), w, A),
    () => RP(pd(4, r * 1.18, 0), w, A),
    () => RP(pd(12, r * 1.02, 0), w, A),
  ][v % 5]();

const EM = ['heart', 'star', 'moon', 'flame', 'cross', 'blade', 'leaf', 'fang', 'paw', 'petal', 'dia', 'spike', 'orb', 'bolt'];

const Y = (z: number, x: string) =>
  `<g class="ly" style="--z:${z}"><g transform="translate(100 100) scale(${(1 + z * 0.05).toFixed(3)}) translate(-100 -100)">${x}</g></g>`;

const Y0 = (z: number, x: string) => `<g class="ly" style="--z:${z}">${x}</g>`;

const G2 = (r: number, w: number, A: string) =>
  O(r + 0.6, w + 1, '#000', 'opacity=".4"') + O(r, w, A) + O(r - w / 2 + 0.4, 0.6, '#fff', 'opacity=".55"');

const TK = (n: number, r: number, l: number, col: string, op = 0.8) =>
  O(r, l, col, `stroke-dasharray=".7 ${f1((2 * PI * r) / n - 0.7)}" stroke-linecap="round" opacity="${op}"`);

const AR = (r: number, a: number, sw: number, w: number, col: string, x = '') =>
  O(
    r,
    w,
    col,
    `stroke-dasharray="${f1((2 * PI * r * sw) / 360)} ${f1((2 * PI * r * (360 - sw)) / 360)}" stroke-dashoffset="${f1(
      (-2 * PI * r * a) / 360
    )}" ${x}`
  );

const sc = (x: string, s = 0.62) =>
  `<g transform="translate(100 100) scale(${s}) translate(-100 -100)">${x}</g>`;

const pips = (n: number, col: string) =>
  Array.from({ length: n }, (_, k) =>
    `<circle cx="${f1(100 + (k - (n - 1) / 2) * 5)}" cy="35" r="1.4" fill="${col}"/>`
  ).join('');

const fd = (a: number, b: number, x: string, dur = 32) =>
  `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a.toFixed(3)};${(a + 0.03).toFixed(
    3
  )};${(b - 0.03).toFixed(3)};${b.toFixed(3)};1" dur="${dur}s" repeatCount="indefinite"/>${x}</g>`;

// ─── Elemental Generator Engine ──────────────────────────────────────────────
const EL: Record<string, (c: [string, string, string], rr: number, v: number, rd: () => number) => string> = {
  fire: (c, rr) =>
    `<g filter="url(#fl)">${O(rr + 4, 3, c[0], 'opacity=".7"')}${O(rr + 7, 2, c[1], 'opacity=".5"')}</g>` +
    S(24, R(12, rr + 3, 'flame', 0.8, c[0], 0, 'p')) +
    S(16, R(8, rr + 6, 'flame', 0.5, c[1], 15, 'p'), 1),
  water: (c, rr) =>
    S(20, `<path d="${wv(rr + 3, 2.5, 7)}" fill="none" stroke="${c[0]}" stroke-width="1.8"/>`) +
    S(14, `<path d="${wv(rr + 6, 2, 9, 45)}" fill="none" stroke="${c[2]}" stroke-width="1"/>`, 1),
  wind: (c, rr) =>
    S(12, `<path d="${sp(rr + 8, 110, 0)}" fill="none" stroke="${c[0]}" stroke-width="1.8" stroke-linecap="round"/>`) +
    S(12, `<path d="${sp(rr + 8, 110, 180)}" fill="none" stroke="${c[2]}" stroke-width="1.4" stroke-linecap="round"/>`) +
    S(18, R(4, rr + 5, 'leaf', 0.65, c[0]), 1),
  elec: (c, rr, v, rd) =>
    Array.from({ length: 3 }, () => {
      const p = Array.from({ length: 9 }, (_, q) => pt(rr + (rd() - 0.5) * 8, q * 45 + (rd() - 0.5) * 15)).join('L');
      return `<path d="M${p}Z" fill="none" stroke="${c[0]}" stroke-width="1.1" class="fk" style="--d:${(
        0.8 +
        rd() * 0.8
      ).toFixed(2)}s"/>`;
    }).join(''),
  earth: (c, rr) =>
    R(8, rr + 4, 'dia', 0.9, c[1], 0) +
    R(8, rr + 4, 'dia', 0.5, c[2], 22.5) +
    O(rr + 7, 1.2, c[0], 'stroke-dasharray="4 6"'),
  light: (c, rr) =>
    `<g opacity=".8">${S(60, R(24, rr + 6, 'spike', 0.7, c[0]))}${S(40, R(12, rr + 8, 'spike', 1.1, c[2]), 1)}</g>`,
  dark: (c, rr) =>
    `<g filter="url(#fl)">${O(rr + 5, 4, c[1], 'opacity=".6"')}${O(rr + 8, 2, c[0], 'opacity=".4"')}</g>` +
    S(30, R(6, rr + 6, 'moon', 0.7, c[0]), 1),
  thunder: (c, rr, v, rd) =>
    EL.elec(c, rr, v, rd) + S(40, R(6, rr + 7, 'bolt', 0.7, c[2], 0, 'p')),
};

const E = (k: string, c: [string, string, string], i: number, s = 0.62) =>
  sc(EL[k](c, 86, 0, mk(i * 13 + 7)), s);

const pa = (k: string, i: number, n = 6, r0 = 56, r1 = 76) => {
  const X = FXT[k];
  const rd = mk(i * 97 + 13);
  return Array.from({ length: n }, () => {
    const a = rd() * 360;
    const r = r0 + rd() * (r1 - r0);
    const d = (1.8 + rd() * 2.2).toFixed(1);
    const dly = (-rd() * 3).toFixed(1);
    const scVal = (0.35 + rd() * 0.45).toFixed(2);
    const tx = f1(X[2] * (10 + rd() * 18));
    const ty = f1(-15 - rd() * 22);
    return `<g class="rise" style="--d:${d}s;--x:${tx}px;--y:${ty}px;animation-delay:${dly}s"><use href="#m-${
      X[0]
    }" transform="translate(${pt(r, a)}) scale(${scVal})" ${C(X[0], X[1])}/></g>`;
  }).join('');
};

// ─── Tesla & Lightning Generator Helpers ─────────────────────────────────────
const AN = (v: string[], du: string, st: string, w: number, o: number) =>
  `<path d="${v[0]}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"><animate attributeName="d" values="${v.join(
    ';'
  )};${v[0]}" dur="${du}s" repeatCount="indefinite"/></path>`;

const BO = (v: string[], col: string, du = 0.3, w = 3) =>
  AN(v, String(du), col, w, 0.35) + AN(v, String(du), '#fff', w / 3, 0.95);

const JT = (r: () => number, a0: number, a1: number, rb: number, bl: number, n: number, j: number) =>
  [0, 1, 2].map(() =>
    'M' +
    Array.from({ length: n + 1 }, (_, q) => {
      const t = q / n;
      const a = a0 + (a1 - a0) * t;
      const d = rb + Math.sin(t * PI) * bl + (q && q < n ? (r() - 0.5) * j : 0);
      return f1(100 + d * cs(a)) + ' ' + f1(100 + d * sn(a));
    }).join('L')
  );

const BR = (r: () => number, a: number, len: number, nb: number, sp: number, r0 = 58) =>
  [0, 1, 2].map(() => {
    const p = Array.from({ length: 6 }, (_, q) => pt(r0 + (len * q) / 5, a + (q ? (r() - 0.5) * sp : 0)));
    let d = 'M' + p.join('L');
    for (let b = 0; b < nb; b++) {
      const q = 2 + (b % 3);
      d += 'M' + p[q] + 'L' + pt(r0 + (len * (q + 1.4)) / 5, a + (r() - 0.5) * sp * 3.2);
    }
    return d;
  });

const TC = (k: number, col: string, i: number) => {
  const r = mk(i * 31 + k * 7 + 1);
  const fl = (x: string, d = 0.5) =>
    `<g><animate attributeName="opacity" values="1;.3;1;.6;1" keyTimes="0;.25;.5;.75;1" calcMode="discrete" dur="${d}s" repeatCount="indefinite"/>${x}</g>`;
  const vx = (o: number) =>
    [0, 1, 2].map(() =>
      'M' +
      Array.from({ length: 26 }, (_, q) => {
        const a = o + q * 14;
        const d = 72 - q * 0.5 + (r() - 0.5) * 3;
        return f1(100 + d * cs(a)) + ' ' + f1(100 + d * sn(a));
      }).join('L')
    );
  let h = '';
  if (k === 0) for (let n = 0; n < 6; n++) h += fl(BO(BR(r, n * 60 + 15, 24, 2, 12), col, 0.28, 3));
  else if (k === 1) {
    for (let n = 0; n < 6; n++) h += fl(BO(JT(r, n * 60 + 15, n * 60 + 75, 58, 10, 9, 3), col, 0.4, 3));
    h += R(6, 57, 'orb', 0.6, '#fff', 15, 'p');
  } else if (k === 2)
    h = S(2.6, BO(JT(r, 0, 55, 61, 3, 10, 2.5), col, 0.22, 3)) + S(40, BO(BR(r, 0, 18, 1, 10), col, 0.26, 2.6));
  else if (k === 3) h = S(6, BO(vx(0), col, 0.3, 2.4)) + S(6, BO(vx(180), col, 0.3, 2.4));
  else if (k === 4) for (let n = 0; n < 5; n++) h += fl(BO(BR(r, n * 72 + 20, 28, 3, 16), col, 0.45, 2.6), 0.7);
  else if (k === 5)
    h =
      R(24, 62, 'orb', 0.22, '#fff', 0, 'tw') +
      [0, 1, 2].map((n) => fl(BO(JT(r, n * 120, n * 120 + 70, 66, 14, 12, 5), col, 0.7, 2.4), 0.9)).join('');
  else {
    for (let n = 0; n < 4; n++) h += fl(BO(BR(r, n * 90 + 45, -38, 2, 14, 98), col, 0.8, 3.4), 0.8);
    h += R(4, 59, 'star', 0.5, '#fff', 45, 'p');
  }
  return h;
};

const ph2 = (p: number, x: string) => {
  const N = 8;
  const s = p / N;
  const e = (p + 1) / N;
  const f = 0.07;
  const h = f / 2;
  const t = (a: number) => a.toFixed(3);
  const [k, o, z, r] =
    p === 0
      ? [
          [0, e - h, e + h, 1 - f, 1],
          [1, 1, 0, 0, 1],
          [1, 1, 1.08, 0.9, 1],
          [0, 0, 10, -10, 0],
        ]
      : p === N - 1
      ? [
          [0, s - h, s + h, 1 - f, 1],
          [0, 0, 1, 1, 0],
          [0.9, 0.9, 1, 1, 1.08],
          [-10, -10, 0, 0, 10],
        ]
      : [
          [0, s - h, s + h, e - h, e + h, 1],
          [0, 0, 1, 1, 0, 0],
          [0.9, 0.9, 1, 1, 1.08, 1.08],
          [-10, -10, 0, 0, 10, 10],
        ];
  const kt = k.map(t).join(';');
  const an = (ty: string, v: string) =>
    `<animateTransform attributeName="transform" type="${ty}" values="${v}" keyTimes="${kt}" dur="32s" repeatCount="indefinite"/>`;
  return `<g opacity="0"><animate attributeName="opacity" values="${o.join(
    ';'
  )}" keyTimes="${kt}" dur="32s" repeatCount="indefinite"/><g>${an(
    'rotate',
    r.map((a) => a + ' 100 100').join(';')
  )}<g transform="translate(100 100)"><g>${an(
    'scale',
    z.join(';')
  )}<g transform="translate(-100 -100)">${x}</g></g></g></g></g>`;
};

const SW = (() => {
  const kt = [0, 0.04];
  const vo = [0.9, 0];
  const ro = [56, 80];
  for (let k = 1; k < 8; k++) {
    const b = k / 8;
    kt.push(b - 0.001, b, b + 0.04);
    vo.push(0, 0.9, 0);
    ro.push(56, 56, 80);
  }
  kt.push(1);
  vo.push(0);
  ro.push(80);
  const a = (n: string, v: number[]) =>
    `<animate attributeName="${n}" values="${v.join(';')}" keyTimes="${kt
      .map((x) => x.toFixed(3))
      .join(';')}" dur="32s" repeatCount="indefinite"/>`;
  return `<circle cx="100" cy="100" r="56" fill="none" stroke="#fff" stroke-width="1.2" opacity="0">${a('r', ro)}${a(
    'opacity',
    vo
  )}</circle>`;
})();

const rg = (col: string) =>
  O(57.6, 3.2, '#000', 'opacity=".4"') +
  O(57, 2.4, col) +
  O(56.3, 0.7, '#fff', 'opacity=".6"') +
  O(59.5, 5, col, 'opacity=".18"');

const DR =
  `<g transform="translate(161 100)"><path d="M0-10C5-10 7-5 5-1L3 5H-3L-5-1C-7-5-5-10 0-10Z" fill="#35d6a8" stroke="#ffe9a0" stroke-width=".8"/><path d="M4-7Q11-9 14-3M-4-7Q-11-9-14-3" fill="none" stroke="#ffd36e" stroke-width=".9"/><path d="M-2 4Q-7 9-4 15M2 4Q7 9 4 15" fill="none" stroke="#ffd36e" stroke-width="1.2" stroke-linecap="round"/><circle cx="2.2" cy="-4" r="1" fill="#fff"/><circle cx="-2.2" cy="-4" r="1" fill="#fff"/></g>`;

const TS = (c: [string, string, string], A: string, i: number) => {
  const r = mk(i * 29 + 3);
  const an = (v: string[], du: string, st: string, w: number, o: number) =>
    `<path d="${v[0]}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"><animate attributeName="d" values="${v.join(
      ';'
    )};${v[0]}" dur="${du}s" repeatCount="indefinite"/></path>`;
  const fl = (x: string) =>
    `<g><animate attributeName="opacity" values="1;.3;1;.65;1" keyTimes="0;.25;.5;.75;1" calcMode="discrete" dur="${(
      0.3 +
      r() * 0.3
    ).toFixed(2)}s" repeatCount="indefinite"/>${x}</g>`;
  let h = '';
  for (let k = 0; k < 8; k++) {
    const a0 = k * 45 + 22.5;
    const v = [0, 1, 2].map(() =>
      'M' +
      Array.from({ length: 10 }, (_, q) => {
        const t = q / 9;
        const a = a0 + 45 * t;
        const d = 58 + Math.sin(t * PI) * 8 + (q && q < 9 ? (r() - 0.5) * 7 : 0);
        return f1(100 + d * cs(a)) + ' ' + f1(100 + d * sn(a));
      }).join('L')
    );
    const du = (0.3 + r() * 0.25).toFixed(2);
    h += fl(an(v, du, c[2], 3.2, 0.35) + an(v, du, '#fff', 1, 0.95));
  }
  for (let k = 0; k < 4; k++) {
    const a = k * 90 + 22.5;
    const len = 18 + r() * 10;
    const v = [0, 1, 2].map(() => {
      const p = Array.from({ length: 6 }, (_, q) => pt(58 + (len * q) / 5, a + (q ? (r() - 0.5) * 11 : 0)));
      return 'M' + p.join('L') + 'M' + p[3] + 'L' + pt(58 + len * 0.85, a + (r() - 0.5) * 40);
    });
    const du = (0.25 + r() * 0.2).toFixed(2);
    h += `<g opacity="0"><animate attributeName="opacity" values="0;1;0;.8;1;0;0" calcMode="discrete" dur="${(
      0.8 +
      r() * 0.8
    ).toFixed(2)}s" repeatCount="indefinite"/>${an(v, du, c[2], 3, 0.35)}${an(v, du, '#fff', 1, 0.95)}</g>`;
  }
  // Transverse erratic Tesla coil discharges jumping directly over the profile picture
  for (let k = 0; k < 3; k++) {
    const a0 = k * 120 + 20 + (r() - 0.5) * 30;
    const a1 = a0 + 180 + (r() - 0.5) * 40;
    const v = [0, 1, 2].map(() => {
      const p = Array.from({ length: 8 }, (_, q) => {
        const t = q / 7;
        const dist = (1 - 2 * t) * 52;
        const ang = dist >= 0 ? a0 : a1;
        const rad = Math.abs(dist) + (q && q < 7 ? (r() - 0.5) * 14 : 0);
        return pt(rad, ang + (q && q < 7 ? (r() - 0.5) * 28 : 0));
      });
      return 'M' + p.join('L');
    });
    const du = (0.18 + r() * 0.15).toFixed(2);
    h += `<g opacity="0"><animate attributeName="opacity" values="0;1;0;.9;0;1;0" keyTimes="0;.15;.3;.45;.6;.75;1" calcMode="discrete" dur="${(
      0.4 +
      r() * 0.4
    ).toFixed(2)}s" repeatCount="indefinite"/>${an(v, du, '#c4b5fd', 2.8, 0.5)}${an(v, du, '#fff', 1.2, 0.95)}</g>`;
  }
  // Inward erratic Tesla coil strikes penetrating toward avatar center
  for (let k = 0; k < 3; k++) {
    const a = k * 120 + 60 + (r() - 0.5) * 30;
    const len = -36 - r() * 14;
    const v = [0, 1, 2].map(() => {
      const p = Array.from({ length: 6 }, (_, q) => pt(56 + (len * q) / 5, a + (q ? (r() - 0.5) * 22 : 0)));
      return 'M' + p.join('L') + 'M' + p[2] + 'L' + pt(56 + len * 0.7, a + (r() - 0.5) * 38);
    });
    const du = (0.2 + r() * 0.18).toFixed(2);
    h += `<g opacity="0"><animate attributeName="opacity" values="0;1;.8;0;1;0" keyTimes="0;.2;.4;.6;.8;1" calcMode="discrete" dur="${(
      0.5 +
      r() * 0.5
    ).toFixed(2)}s" repeatCount="indefinite"/>${an(v, du, c[2], 2.5, 0.45)}${an(v, du, '#fff', 1.1, 0.95)}</g>`;
  }
  return (
    `<g filter="url(#bl)" class="p" style="--d:3s">${O(59, 7, c[1], 'opacity=".55"')}</g>` +
    O(57, 3.2, '#0b0716') +
    G2(57, 1.4, A) +
    O(57, 0.8, '#dff1ff', 'opacity=".9"') +
    TK(80, 62.5, 2, c[2], 0.7) +
    h +
    R(8, 57, 'orb', 0.75, c[2], 22.5, 'p') +
    R(8, 57, 'orb', 0.32, '#fff', 22.5) +
    R(1, 60, 'dia', 0.9, '#fff', -90, 'p') +
    pa('star', i, 6)
  );
};

// The Eternal Master Frame (ETL2): Transforms through eight elements, each with its own tesla-coil discharge
export const ETL2 = (c: [string, string, string], A: string, i: number) =>
  [
    rg('#ff8a3c') +
      R(18, 59, 'flame', 0.95, '#ff6a1f', 0, 'p') +
      R(18, 59, 'flame', 0.55, '#ffd36e', 10, 'p') +
      TC(0, '#ffb347', i) +
      pa('ember', i, 5),
    rg('#4cc9ff') +
      S(30, `<path d="${wv(61, 2.6, 8)}" fill="none" stroke="#9fe8ff" stroke-width="1.1"/>`) +
      S(26, R(6, 67, 'orb', 0.5, '#bfefff', 0, 'b'), 1) +
      TC(1, '#7fe3ff', i) +
      pa('bubble', i, 4),
    S(
      40,
      AR(61, 0, 210, 4.2, '#2fbf9a') +
        AR(61, 210, 60, 3, '#2fbf9a') +
        AR(61, 270, 40, 1.8, '#2fbf9a') +
        AR(59.6, 6, 200, 0.9, '#ffe9a0', 'opacity=".8"') +
        DR
    ) +
      O(57, 1, '#6b4d12', 'opacity=".6"') +
      TC(2, '#ffe08a', i),
    rg('#bfffe0') + E('wind', ['#bfffe0', '#4cb7a0', '#fff'], i, 0.62) + TC(3, '#d6ffe9', i) + pa('leaf', i, 4),
    rg('#6ee08a') +
      `<path d="${wv(61, 2.4, 9)}" fill="none" stroke="#3fbf6a" stroke-width="1.2"/>` +
      R(10, 64, 'leaf', 0.5, '#8dff9f', 0, 'b') +
      R(4, 62, 'petal', 0.5, '#ffd0e8', 20) +
      TC(4, '#9bff8a', i) +
      pa('fly', i, 5),
    rg('#dfe6ff') +
      O(60, 1.2, '#c4b5fd', 'stroke-dasharray="3 5" opacity=".8"') +
      TC(5, '#d9c8ff', i),
    rg('#d9a066') + E('earth', ['#ffa56a', '#a8431f', '#ffd9bf'], i, 0.62) + TC(6, '#ffcf7a', i),
    TS(c, A, i),
  ]
    .map((x, p) => ph2(p, x))
    .join('') + SW;

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

// ─── Categories & Rarities ───────────────────────────────────────────────────
export const ATELIER_CATEGORIES: Record<string, { name: string; icon: string }> = {
  st: { name: 'Steampunk', icon: 'Compass' },
  me: { name: 'Mechanical', icon: 'Cpu' },
  ru: { name: 'Runes', icon: 'Feather' },
  ju: { name: 'Jungle', icon: 'Trees' },
  cu: { name: 'Cute', icon: 'Heart' },
  an: { name: 'Animals', icon: 'Cat' },
  da: { name: 'Dark Aura', icon: 'Ghost' },
  kn: { name: 'Knights', icon: 'Swords' },
  em: { name: 'Emperors', icon: 'Crown' },
  lo: { name: 'Lords', icon: 'Award' },
  el: { name: 'Elemental', icon: 'Zap' },
  ce: { name: 'Celestial', icon: 'Moon' },
  yo: { name: 'Yokai & Sakura', icon: 'Flame' },
  sa: { name: 'Sea & Abyss', icon: 'Waves' },
  ho: { name: 'Holy & Angelic', icon: 'Sun' },
  cs: { name: 'Council of Shadows', icon: 'Crown' },
  bd: { name: 'Board of Darkness', icon: 'ShieldAlert' },
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

// ─── RAW SHOWCASE SPECIFICATIONS (98 Handcrafted Frames) ────────────────────────
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
  'Fox Spirit|an|2|ember|flame|ear|ember',
  'Moon Wolf|an|3|silver|fang|ear|snow',
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
  'Kitsune Mask|yo|3|ruby|flame|ear|ember',
  'Oni Festival|yo|3|blood|spike|horn|ember',
  'Tengu Wind Shrine|yo|4|silver|leaf|wing|wind+feather',
  'Nine-Tailed Kitsune God|yo|5|ember|flame|ear|fire',
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
];

export const ATELIER_SHOWCASE_FRAMES: AtelierFrame[] = RAW_SHOWCASE_FRAMES.map((rawSpec, idx) => {
  const [name, category, tierStr, colorKey, motif, attachment, effect] = rawSpec.split('|');
  const tier = parseInt(tierStr, 10);
  const rarity = (ATELIER_RARITIES[tier]?.label || 'Common') as AtelierFrame['rarity'];
  const colors = PAL[colorKey] || ['#ffffff', '#9aa8c4', '#ffffff'];

  return {
    id: toFrameSlug(name),
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
  };
});

const SHOWCASE_LOOKUP = new Map<string, AtelierFrame>();
ATELIER_SHOWCASE_FRAMES.forEach((f) => {
  SHOWCASE_LOOKUP.set(f.id, f);
  SHOWCASE_LOOKUP.set(toFrameSlug(f.name), f);
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
  type: 'level' | 'role' | 'darkness' | 'council';
  minLevel?: number;
  price?: number;
  renderFn: (c: [string, string, string], A: string, i: number) => string;
}

const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

const shCouncil = (
  n: number,
  d: string,
  pc: [string, string, string],
  ex: (c: [string, string, string], i: number) => string
): SpecialFrameDef => {
  const name = `${ORD[n - 1]} Shadow`;
  return {
    id: toFrameSlug(name),
    aliases: [name.toLowerCase(), `shadow_${n}`],
    name,
    group: 'cs',
    categoryName: 'Council of Shadows',
    desc: d,
    colors: pc,
    type: 'council',
    price: 6000,
    renderFn: (c, A, i) => pips(n, c[0]) + G2(57, 1.8, A) + ex(c, i),
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
    aliases: ['neko_whiskers', 'kawaii_whiskers'],
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
    desc: 'Guild Master Shadow. Transforms through eight elements, each with its own tesla-coil discharge',
    colors: ['#e8f4ff', '#5b3cff', '#7fd6ff'],
    type: 'role',
    minLevel: 100,
    renderFn: (c, A, i) => ETL2(c, A, i),
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

// Legacy ID Aliases mapping to closest Atelier counterparts
const LEGACY_ALIASES: Record<string, string> = {
  shadow_sovereign_supreme: 'first_shadow',
  celestia_divine_throne: 'grand_horologist’s_eternity',
  infinite_tsukuyomi: 'crimson_eyes',
  primordial_dragon: 'omega_titan_core',
  god_hand_eclipse: 'void_calamity',
  celestial_emperor: 'celestial_autocrat',
  solo_shadow_arise: 'reaper’s_sovereign',
  magic_circle: 'arcane_sigil_wheel',
  cosmic_ring: 'cosmic_genesis',
  shadow_monarch: 'first_shadow',
  super_saiyan: 'sun_emperor',
  domain_expansion: 'cursed_flame',
  bankai_ice: 'glacier_bloom',
  cyber_matrix: 'aether_engine_core',
  sun_breathing: 'imperial_phoenix',
  susanoo: 'lord_of_calamity',
  rinnegan: 'constellation_ring',
  blood_moon: 'vampire_lord',
  frost_nova: 'frostbound_runes',
  abyssal_kraken: 'abyssal_maw',
  storm_bringer: 'stormcaller_archon',
  celestial_starlight: 'starlight_veil',
  solar_flare: 'radiant_dawn',
  radiant_angel: 'archangel_judgement',
  demon_lord: 'demon_lord’s_crown',
  valkyrie: 'valkyrie’s_oath',
  chaos_singularity: 'void_calamity',
  strawberry_bunny: 'bunny_cloud',
  cute_neko_paws: 'kitty_bell_collar',
  pastel_dream: 'star_candy_dream',
  slime_bouncy: 'sakura_puff',
  chibi_boba_milk_tea: 'angel_cupcake',
  kawaii_ghost_boo: 'shadow_wisp',
  magic_star_wand: 'magical_girl_grand_bloom',
  starlight_kitsune: 'fox_spirit',
  fluffy_hamster_bread: 'bunny_cloud',
  sleepy_cloud_moon: 'crescent_moon',
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

  // 5. Default fallback to first showcase frame or none
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
  const [nm, ct, tierStr, colKey, m, at, fk] = x;
  const T = parseInt(tierStr, 10);
  const c = PAL[colKey] || ['#ffffff', '#9aa8c4', '#ffffff'];
  const A = `url(#a_${uniquePrefix})`;
  const L = 2 * PI * 68;

  const att = (id: string) =>
    (SGL[id] ? [1] : [1, -1])
      .map((sx) => {
        const tf = `translate(100 100) scale(${sx} 1) translate(-100 -100)`;
        return `<g transform="${tf}"><use href="#A-${id}" ${C(id, c[0])}/></g>`;
      })
      .join('');

  let g = '';
  let post = '';
  const BASE_BUILDERS = [
    () => {
      const v = i % 5;
      const rr = 58;
      g += RG(v, rr, 2.4, A);
      if (v === 0) g += TK(48, rr + 7, 2, c[0], 0.7);
    },
    () => {
      const v = i % 4;
      const rr = 58;
      g += RG(v, rr, 3.2, A);
      g += O(rr - 2.5, 0.7, c[2], 'opacity=".6"');
      g += R(v === 1 ? 6 : 8, rr + 6, v === 0 ? 'orb' : 'dia', 0.55, c[1], 0, 'tw');
    },
    () => {
      const v = i % 3;
      const rr = 58;
      if (v === 0) g += `<path d="${gear(12, rr + 10, rr + 5, rr - 1)}" fill="${A}" opacity=".95"/>`;
      else if (v === 1) g += RG(1, rr, 3.4, A) + R(6, rr + 8, 'blade', 0.85, c[0], 0);
      else g += RG(2, rr, 3.6, A) + R(8, rr + 7, 'spike', 0.8, c[2], 22.5);
      g += TK(60, rr + 7, 1.8, '#fff', 0.8);
    },
    () => {
      const v = i % 3;
      const rr = 58;
      g += O(rr + 7, 5, c[1], 'opacity=".22"');
      g += RG(v, rr, 4.4, A);
      g += R(v === 0 ? 8 : 12, rr + 9, 'spike', 1, c[0], 0, 'p');
      g += S(18, AR(rr + 1.2, 0, 70, 2.2, '#fff', 'opacity=".9"'));
      g += TK(72, rr + 9, 2.4, c[2], 0.9);
    },
    () => {
      const rr = 58;
      g += `<g filter="url(#fl)">${O(rr + 7, 5, c[1], 'opacity=".45"')}</g>`;
      g += RG(i % 5, rr, 5.2, A);
      g += R(16, rr + 10, 'spike', 1.25, c[0], 0, 'p');
      g += S(10, AR(rr + 1.6, 0, 90, 2.6, '#fff', 'opacity=".95"'));
      g += S(14, AR(rr + 4, 180, 80, 1.4, c[2]), 1);
      g += TK(84, rr + 10, 2.8, '#fff', 0.95);
      post += R(4, rr + 14, 'dia', 1.4, c[0], 45, 'tw');
    },
  ];

  BASE_BUILDERS[T - 1]();

  const v = i % 4;
  const rr = 58;
  const mo = S(
    44 - 5 * T,
    R(6 + 2 * T + v, rr + 8 + v * 1.5, m, 0.7 + T * 0.07, c[0]),
    v % 2
  ) + (T > 2 ? S(30, R(8 + T, rr, m, 0.45, c[2]), 1) : '');

  const rays =
    T > 3 && ct !== 'em'
      ? `<g opacity=".35">${S(80, R(20, rr + 20, 'spike', 1.2 + 0.25 * T, c[0]))}</g>`
      : '';

  const eb = EM[(i * 3) % 14];
  const emb =
    T > 1 && ct !== 'st' && ct !== 'kn'
      ? `<g transform="translate(100 ${f1(100 - rr - 1)}) scale(${0.8 + T * 0.08})">${C(eb, c[2])}<use href="#m-${eb}"/></g>`
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
    if (EL[q]) el += EL[q](c, rr, v, mk(i * 19 + 5));
    if (FXT[q]) fx += pa(q, i, 4 + T * 2, rr - 2, rr + 18);
  });

  const avNode = options.transparentCenter
    ? ''
    : options.avatarUrl
    ? `<image href="${options.avatarUrl}" x="48" y="48" width="104" height="104" clip-path="url(#cp)" preserveAspectRatio="xMidYMid slice"/>`
    : `<use href="#av"/>`;

  return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${nm}" class="w-full h-full block overflow-visible">
<defs>
<linearGradient id="a_${uniquePrefix}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
<radialGradient id="b_${uniquePrefix}"><stop offset=".6" stop-color="${c[1]}" stop-opacity=".4"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient>
</defs>
${options.transparentCenter ? '' : `<circle cx="100" cy="100" r="68" fill="url(#b_${uniquePrefix})" class="p" style="--d:4s"/>`}
${avNode}
${Y(-0.3, at && at !== '-' && BK[at] ? att(at) : '')}
${Y(-0.2, rays)}
${Y(0, g + O(52.5, 1.4, c[1]))}
${Y(0.4, mo)}
${Y(0.8, shine)}
${Y(1.1, post + emb)}
${Y(1.5, at && at !== '-' && !BK[at] ? att(at) : '')}
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

  const avNode = options.transparentCenter
    ? ''
    : options.avatarUrl
    ? `<image href="${options.avatarUrl}" x="48" y="48" width="104" height="104" clip-path="url(#cp)" preserveAspectRatio="xMidYMid slice"/>`
    : `<use href="#av"/>`;

  return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${frame.name}" class="w-full h-full block overflow-visible">
<defs>
<linearGradient id="a_${uniquePrefix}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
<radialGradient id="b_${uniquePrefix}"><stop offset=".6" stop-color="${c[1]}" stop-opacity=".5"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient>
</defs>
${options.transparentCenter ? '' : `<circle cx="100" cy="100" r="68" fill="url(#b_${uniquePrefix})" class="p" style="--d:4s"/>`}
${avNode}
${O(52.5, 1.6, c[1])}
${Y0(1, frame.renderFn(c, A, i))}
</svg>`;
}

// ─── Global SVG Definitions & Global CSS ─────────────────────────────────────
export const ATELIER_GLOBAL_DEFS_SVG = `
<svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;">
<defs id="df">
<filter id="fl" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" result="t"><animate attributeName="baseFrequency" values=".04;.07;.04" dur="6s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="t" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
<filter id="gr"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/><feOffset dx="2.4" dy="0"/></filter>
<filter id="gc"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/><feOffset dx="-2.4" dy="0"/></filter>
<clipPath id="sl"><path d="M0 0h200v200H0zM0 10h200v4H0zM0 30h200v3H0zM0 70h200v5H0zM0 110h200v3H0zM0 150h200v4H0zM0 180h200v3H0z" clip-rule="evenodd"/></clipPath>
<linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="cm"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="cp"><circle cx="100" cy="100" r="52"/></clipPath>
<g id="av"><circle cx="100" cy="100" r="52" fill="#0d0a1a"/><circle cx="100" cy="100" r="50" fill="#181330"/><circle cx="100" cy="92" r="20" fill="#2b2354"/><ellipse cx="100" cy="132" rx="34" ry="24" fill="#2b2354"/></g>
${Object.entries(M)
  .map(([k, d]) =>
    /^r\d/.test(k)
      ? `<path id="m-${k}" d="${d}" fill="none" stroke-width="1.8"/>`
      : `<path id="m-${k}" d="${d}"/>`
  )
  .join('\n')}
${Object.entries(AT)
  .map(([k, h]) => `<g id="A-${k}">${h}</g>`)
  .join('\n')}
</defs>
</svg>
`;

export const ATELIER_GLOBAL_CSS = `
@keyframes pl { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
@keyframes tw { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
@keyframes bo { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes ri { 0% { transform: translate(0, 0) scale(1); opacity: 0.85; } 100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; } }
@keyframes fk { 0%, 86%, 95%, 100% { opacity: 0; } 88%, 93% { opacity: 1; } 91% { opacity: 0.2; } }
.p { animation: pl var(--d, 3s) ease-in-out infinite; }
.b { animation: bo var(--d, 2.4s) ease-in-out infinite; }
.tw { animation: tw var(--d, 2s) ease-in-out infinite; }
.rise { animation: ri var(--d, 2.2s) cubic-bezier(0.2, 0.8, 0.4, 1) infinite; }
.fk { animation: fk var(--d, 3s) steps(1) infinite; }
.ly { transform: translate(100px, 100px) scale(calc(1 + var(--z, 0) * 0.05)) translate(-100px, -100px); }
.ff-frozen, .ff-frozen * { animation-play-state: paused !important; }
`;

// ─── Unified Store Frame Inventory ───────────────────────────────────────────
export const ALL_ATELIER_STORE_FRAMES = [
  ...ATELIER_SHOWCASE_FRAMES.map((f) => ({
    id: f.id,
    name: f.name,
    type: 'store' as const,
    minLevel: 0,
    price: ATELIER_RARITIES[f.tier]?.basePrice || 2500,
    tag: f.rarity,
    tierBadge: `Tier ${f.tier}`,
    description: `${f.rarity} ${f.categoryName} Frame. Motif: ${f.motif}, Attachment: ${f.attachment}.`,
    category: f.category,
    categoryName: f.categoryName,
    color: f.colors[0],
    colors: f.colors,
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
