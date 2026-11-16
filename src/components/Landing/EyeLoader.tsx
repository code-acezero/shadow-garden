"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ════════════════════════════════════════════════════════════════
   EyeLoader – a pair of anime eyes opening out of the dark.
   Each eye "acts" (glances, glares, rolls, smiles…) and then blinks
   into the next one. Pure SVG + one requestAnimationFrame loop.
   No dependencies, no Tailwind needed.
   ════════════════════════════════════════════════════════════════ */

const W = 880, H = 400; // frame
const CX = 200, CY = 122, X1 = 40, X2 = 360; // one eye, local coordinates
const UP = 92, LOW = 70; // lid travel above / below the centre line
const f = (n: number) => n.toFixed(1);
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;

/* ───────────── acting: poses & keyframes ───────────── */
type Pose = {
  lx: number; ly: number; // where the eyes look (px)
  open: number; raise: number; arc: number; // lid opening · lower lid raise · smile arc
  brow: number; tilt: number; // widen / narrow · angry slant of the upper lid
  pupil: number; vein: number; // pupil size · vein intensity
  ex: number; // extra (second pair) eyes open
  roll: number; zoom: number; shake: number; spin: number; // camera roll/zoom/shake · iris spin multiplier
};
const REST: Pose = {
  lx: 0, ly: 0, open: 1, raise: 0, arc: 0, brow: 0, tilt: 0, pupil: 1, vein: 0,
  ex: 0, roll: 0, zoom: 0, shake: 0, spin: 1,
};
const PK = Object.keys(REST) as (keyof Pose)[];
type Key = [number, Partial<Pose>]; // [ms from start of the hold, changes]
type TL = { t: number; p: Pose }[];
const TEMPO = 1.2; // global slow-down of every performance

function expand(keys: Key[]): TL {
  let p = { ...REST };
  return keys.map(([t, d]) => ({ t: t * TEMPO, p: (p = { ...p, ...d }) }));
}
function poseAt(tl: TL, t: number): Pose {
  const n = tl.length;
  if (t <= tl[0].t) return tl[0].p;
  if (t >= tl[n - 1].t) return tl[n - 1].p;
  let i = 0;
  while (tl[i + 1].t <= t) i++;
  const a = tl[i], b = tl[i + 1], h = b.t - a.t, u = (t - a.t) / h;
  const pa = tl[Math.max(i - 1, 0)], pb = tl[Math.min(i + 2, n - 1)];
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const out = { ...REST };
  for (const k of PK) {
    // Catmull-Rom tangents → velocity stays continuous through every keyframe (no stop-and-go)
    const m0 = i === 0 ? 0 : ((b.p[k] - pa.p[k]) / (b.t - pa.t)) * h;
    const m1 = i + 2 >= n ? 0 : ((pb.p[k] - a.p[k]) / (pb.t - a.t)) * h;
    out[k] = h00 * a.p[k] + h10 * m0 + h01 * b.p[k] + h11 * m1;
  }
  out.ex = cl(out.ex); out.raise = cl(out.raise); out.arc = cl(out.arc); out.tilt = cl(out.tilt);
  out.vein = cl(out.vein); out.open = cl(out.open, 0, 1.2); out.pupil = cl(out.pupil, 0.3, 1.8);
  return out;
}

/* ───────────── eyelid geometry (one eye, local coords) ───────────── */
function lids(o0: number, raise: number, arc: number, brow: number, tilt: number) {
  const o = o0 * (1 + brow * 0.08);
  const up = UP * o * 1.3333;
  const lo = LOW * o * (1 - 0.75 * raise) * 1.3333;
  const sag = (1 - cl(o)) * 14 - arc * 30; // closed lids bow down, smiling ones bow up
  const iy = CY + 8, oy = CY - 8; // inner (tear duct) and outer corner
  const u1 = CY - up + sag + tilt * 30 * cl(o), u2 = CY - up * 1.05 + sag - tilt * 6 * cl(o);
  const l1 = CY + lo * 0.95 + sag, l2 = CY + lo + sag;
  const upper = `C${X1 + 50} ${f(u1)} ${X2 - 120} ${f(u2)} ${X2} ${oy}`;
  const lower = `C${X2 - 70} ${f(l1)} ${X1 + 90} ${f(l2)} ${X1} ${iy}`;
  return {
    clip: `M${X1} ${iy}${upper}${lower}Z`,
    shade: f(CY - UP * o - 2),
  };
}

/* ───────────── per-frame values for every animated attribute ───────────── */
type Rec = Record<string, string>;
type Frame = { m: Rec; x: Rec };
const ATTR: Record<string, string> = {
  clip: "d", shade: "y",
  iris: "transform", spin: "transform", pupil: "transform", cam: "transform", fade: "opacity", veins: "opacity",
};

function frame(o: number, p: Pose, ang: number, now: number, zb: number, reduce: boolean): Frame {
  const m: Rec = lids(o * p.open, p.raise, p.arc, p.brow, p.tilt);
  const x: Rec = lids(o * cl(p.ex) * 0.9, 0.35, 0, 0, 0);
  const sc = 1 + 0.03 * (1 - o);
  const y = f(CY + 2 + p.ly);
  const sh = reduce ? 0 : p.shake * 1.4; // slow, low-amplitude handheld sway
  const z = 1 + zb + p.zoom;
  m.irisR = `translate(${f(CX + p.lx)} ${y}) scale(${sc.toFixed(3)})`;
  m.irisL = `translate(${f(CX - p.lx)} ${y}) scale(${(-sc).toFixed(3)} ${sc.toFixed(3)})`;
  m.spin = `rotate(${f(ang)})`;
  m.pupil = `scale(${p.pupil.toFixed(3)})`;
  m.veins = (0.35 + 0.65 * cl(p.vein)).toFixed(2);
  m.fade = cl(0.12 + 1.15 * o).toFixed(2); // eyes emerge from the dark as the lids open
  m.cam = `translate(440 200) rotate(${f(p.roll + sh * 0.25 * Math.sin(now / 190))}) scale(${z.toFixed(3)}) translate(${f(-440 + sh * Math.sin(now / 130))} ${f(-200 - 36 * cl(p.ex) + sh * Math.cos(now / 170))})`;
  return { m, x };
}

/* ───────────── iris building blocks ───────────── */
function blade(r0: number, r1: number, sweep: number, A: number, p: number, rot: number) {
  const n = 28, L: string[] = [], R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, c = rot + sweep * t - Math.PI / 2, a = A * Math.pow(1 - t, p), r = r0 + (r1 - r0) * t;
    L.push(`${f(r * Math.cos(c + a))} ${f(r * Math.sin(c + a))}`);
    R.push(`${f(r * Math.cos(c - a))} ${f(r * Math.sin(c - a))}`);
  }
  return `M${L.join("L")}L${R.reverse().join("L")}Z`;
}
const blades = (n: number, r0: number, r1: number, sw: number, A: number, p: number, off = 0) =>
  Array.from({ length: n }, (_, k) => blade(r0, r1, sw, A, p, off + (k * 2 * Math.PI) / n)).join("");
const ring = (n: number, a: number, b: number, r: number) =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2, q = i % 6 === 0 ? a : b;
    return `M${f(q * Math.cos(t))} ${f(q * Math.sin(t))}L${f(r * Math.cos(t))} ${f(r * Math.sin(t))}`;
  }).join("");
const tri = (r: number, o: number) =>
  [0, 1, 2].map((k) => `${f(r * Math.cos(o + k * 2.0944))} ${f(r * Math.sin(o + k * 2.0944))}`).join("L");

const FIB = Array.from({ length: 64 }, (_, i) => {
  const a = (i / 64) * Math.PI * 2, r0 = 20 + 8 * Math.abs(Math.sin(i * 7.3)), r1 = 58 + 16 * Math.abs(Math.sin(i * 3.1 + 1));
  return `M${f(r0 * Math.cos(a))} ${f(r0 * Math.sin(a))}L${f(r1 * Math.cos(a))} ${f(r1 * Math.sin(a))}`;
}).join("");

const GRADS: Record<string, string[]> = {
  red: ["#ff3a2a", "#d4141a", "#6e0508"], crimson: ["#ff4a5c", "#b30019", "#3d0008"],
  vamp: ["#ff8a3d", "#d0021b", "#470010"], ghoul: ["#ff2338", "#c40018", "#50000c"],
  rinne: ["#e2d3f7", "#a98ad6", "#573790"], byak: ["#ffffff", "#e6e3f6", "#b6b0da"],
  six: ["#f2fdff", "#6fd0ff", "#1d5fc4"], suku: ["#ff9a45", "#c80f1e", "#34000a"],
  demon: ["#f7e4ff", "#a45ae6", "#3a1272"], cyber: ["#efffb8", "#86e22a", "#1d5a00"],
  hollow: ["#fff3b0", "#f2b705", "#7a4a00"],
};

const Disc = ({ g, fib = "#fff" }: { g: string; fib?: string }) => (
  <>
    <circle r={80} fill={`url(#eyl-${g})`} />
    <path d={FIB} stroke={fib} strokeOpacity={0.12} strokeWidth={1} fill="none" />
    <circle r={37} fill="none" stroke={fib} strokeOpacity={0.18} strokeWidth={1.4} />
    <circle r={76.5} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={7} />
  </>
);

/** Rinnegan rings that light up one after another, plus ripples travelling outward */
const Ripples = () => (
  <>
    <circle r={74} fill="url(#eyl-lum)">
      <animate attributeName="opacity" values=".1;.6;.1" dur="2.6s" repeatCount="indefinite" />
    </circle>
    {[14, 27, 40, 53, 66].map((r, i) => (
      <circle key={r} r={r} fill="none" stroke="#3d2670" strokeWidth={2.4}>
        <animate attributeName="stroke-opacity" values=".3;1;.3" dur="2.6s" begin={`${i * 0.4 - 2.6}s`} repeatCount="indefinite" />
      </circle>
    ))}
    {[0, -1.3].map((b) => (
      <circle key={b} fill="none" stroke="#f1e6ff">
        <animate attributeName="r" values="6;70" dur="2.6s" begin={`${b}s`} repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values=".8;0" dur="2.6s" begin={`${b}s`} repeatCount="indefinite" />
        <animate attributeName="stroke-width" values="3.5;1" dur="2.6s" begin={`${b}s`} repeatCount="indefinite" />
      </circle>
    ))}
  </>
);
const Pupil = ({ r }: { r: number }) => <circle data-r="pupil" transform="scale(1)" r={r} fill="#050001" />;
const Slit = ({ rx, ry, c = "#050001" }: { rx: number; ry: number; c?: string }) => (
  <ellipse data-r="pupil" transform="scale(1)" rx={rx} ry={ry} fill={c} />
);

const Tomoe = ({ n }: { n: number }) => (
  <g fill="#0b0000">
    {Array.from({ length: n }, (_, i) => (
      <g key={i} transform={`rotate(${(360 / n) * i})`}>
        <circle cy={-48} r={9.5} />
        <path d="M0 -57.5Q37 -53 41 -28.5Q20 -41 0 -38.5Z" />
      </g>
    ))}
  </g>
);
const sharinganBase = (<><Disc g="red" /><circle r={48} fill="none" stroke="#120000" strokeWidth={2.4} /><Pupil r={13} /></>);
const mangekyoBase = (<><Disc g="red" /><circle r={27} fill="none" stroke="#0a0000" strokeWidth={5} /><Pupil r={12} /></>);
const BLK = "#0a0000";

const VEINS =
  "M40 122C80 112 110 100 130 96M46 129C84 129 112 125 132 120M360 122C320 112 290 100 270 96M354 129C316 129 288 125 268 120" +
  "M146 50C154 70 160 82 166 94M254 50C246 70 240 82 234 94M168 198C172 180 176 170 182 160M232 198C228 180 224 170 218 160" +
  "M96 108C100 120 104 130 108 140M304 108C300 120 296 130 292 140";

/* ───────────── the eyes ───────────── */
type Eye = {
  sclera: string;
  spin: number; veins?: string;
  four?: boolean; twitch?: boolean;
  base: ReactNode; rot?: ReactNode;
  tl: TL; dur: number;
};
const SCL = "#f4eeea";
const RST: Partial<Pose> = REST;
function E(o: Partial<Eye> & { base: ReactNode; keys: Key[] }): Eye {
  const { keys, ...rest } = o;
  const tl = expand(keys);
  return {
    sclera: SCL, spin: 0,
    ...rest, tl, dur: tl[tl.length - 1].t + 200,
  };
}

export const EYES: Eye[] = [
  E({ // Sharingan, one tomoe: nervous scan
    spin: 140, twitch: true, base: sharinganBase, rot: <Tomoe n={1} />,
    keys: [[0, {}], [500, { lx: -48 }], [1100, { lx: 48, ly: 4 }],
      [1700, { lx: 0, ly: 0, tilt: 0.5, brow: -0.2, open: 0.9, pupil: 0.8, spin: 1.8 }], [2300, RST]],
  }),
  E({ // Sharingan, two tomoe: tracking
    spin: 190, twitch: true, base: sharinganBase, rot: <Tomoe n={2} />,
    keys: [[0, {}], [350, { ly: -14, lx: -20 }], [800, { lx: 36, ly: -6 }], [1250, { lx: 30, ly: 10 }],
      [1700, { lx: 0, ly: 0, open: 0.82, tilt: 0.6, pupil: 0.75, spin: 2.2, brow: -0.3 }], [2400, RST]],
  }),
  E({ // Sharingan, three tomoe: fast saccades then lock-on
    spin: 240, twitch: true, base: sharinganBase, rot: <Tomoe n={3} />,
    keys: [[0, {}], [250, { lx: -50 }], [500, { lx: 50 }], [750, { lx: -30, ly: -8 }], [1000, { lx: 34, ly: 6 }],
      [1450, { lx: 0, ly: 0, open: 0.78, tilt: 0.85, brow: -0.5, pupil: 0.7, spin: 2.8, zoom: 0.05 }], [2300, RST]],
  }),
  E({ // Mangekyō (Itachi): calm, heavy-lidded
    spin: 200, twitch: true, base: mangekyoBase,
    rot: <path d={blades(3, 24, 76, 1.5, 0.62, 1.1)} fill={BLK} />,
    keys: [[0, { open: 0.75 }], [700, { ly: 10, open: 0.55, brow: 0.1 }], [1500, { ly: -6, open: 0.85, brow: 0.25, lx: 20 }], [2300, RST]],
  }),
  E({ // Mangekyō (Kakashi): the eye-smile
    spin: -220, twitch: true, base: mangekyoBase,
    rot: <path d={blades(3, 22, 78, 0.45, 0.82, 1)} fill={BLK} />,
    keys: [[0, { open: 0.9 }], [500, { lx: -30 }], [1100, { lx: 0, open: 0.3, raise: 1, arc: 0.85, brow: 0.4 }],
      [1900, { open: 0.3, raise: 1, arc: 0.85, brow: 0.4 }], [2400, RST]],
  }),
  E({ // Mangekyō (Sasuke): glare
    spin: 210, twitch: true, base: mangekyoBase, rot: <path d={blades(3, 24, 74, 0.95, 0.75, 0.85)} fill={BLK} />,
    keys: [[0, {}], [500, { ly: 8, open: 0.9, tilt: 0.3 }],
      [1200, { ly: -2, open: 0.72, tilt: 0.95, brow: -0.6, pupil: 0.8, zoom: 0.04 }],
      [1900, { vein: 0.8 }], [2500, RST]],
  }),
  E({ // Eternal Mangekyō: dutch-angle stare
    spin: -260, twitch: true, base: mangekyoBase,
    rot: (<>
      <path d={blades(3, 24, 78, 1.1, 0.5, 1.3)} fill={BLK} />
      <path d={blades(3, 24, 56, -0.9, 0.42, 1.2, Math.PI / 3)} fill={BLK} />
    </>),
    keys: [[0, {}], [600, { lx: -24, roll: -2 }], [1500, { lx: 24, roll: 2, pupil: 1.15 }],
      [2100, { lx: 0, roll: 0, open: 0.8, tilt: 0.7, vein: 1, pupil: 0.8, zoom: 0.06, shake: 0.4 }], [2800, RST]],
  }),
  E({ // Rinnegan: rings light up in waves, then a shockwave
    spin: 40,
    base: (<>
      <Disc g="rinne" />
      <Ripples />
      <Pupil r={6} />
    </>),
    rot: <circle r={73} fill="none" stroke="#3d2670" strokeWidth={2.2} strokeDasharray="1.5 7" />,
    keys: [[0, { open: 0.85 }], [700, { ly: -12, open: 0.9, brow: 0.15 }], [1400, { ly: 2, open: 1, zoom: 0.09, shake: 1 }],
      [1750, { shake: 0, zoom: 0.02 }], [2500, RST]],
  }),
  E({ // Byakugan: veins swell, 360° scan
    sclera: "#f1eef9", veins: "#6a5fa8", spin: 0,
    base: (<>
      <Disc g="byak" fib="#7d75b8" />
      <circle r={79} fill="none" stroke="#9d96cc" strokeWidth={3} />
      <circle r={13} fill="none" stroke="#b9b2e0" strokeOpacity={0.7} strokeWidth={1.6} />
    </>),
    keys: [[0, {}], [300, { lx: -55, ly: -6, vein: 0.4 }], [700, { lx: 50, ly: 6, vein: 0.8 }], [1100, { lx: -20, ly: -14, vein: 1 }],
      [1500, { lx: 30, ly: 10 }], [1900, { lx: 0, ly: 0, open: 0.85, tilt: 0.4, brow: -0.3 }], [2600, RST]],
  }),
  E({ // Six Eyes: blindfold drops
    spin: 18, base: (<>
      <Disc g="six" fib="#ffffff" />
      <circle r={20} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />
      <Pupil r={9} />
      <path d="M-27 -33L-24 -24L-15 -21L-24 -18L-27 -9L-30 -18L-39 -21L-30 -24Z" fill="#fff" opacity={0.9} />
    </>),
    rot: <circle r={62} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="2 9" />,
    keys: [[0, {}], [700, { lx: -34, arc: 0.2, open: 0.95 }], [1500, { lx: 0, arc: 0.15, raise: 0.4, open: 0.95, pupil: 0.85, zoom: 0.04 }], [2400, RST]],
  }),
  E({ // Sukuna: the second pair opens
    sclera: "#1a1521", four: true,
    base: (<>
      <Disc g="suku" fib="#ffd0a0" />
      <circle r={44} fill="none" stroke="#1a0006" strokeOpacity={0.6} strokeWidth={2} />
      <Slit rx={5.5} ry={30} />
    </>),
    keys: [[0, { open: 0.85, tilt: 0.5 }], [500, { lx: -20, open: 0.9, tilt: 0.6 }], [1100, { lx: 0, open: 1, tilt: 0.7, brow: -0.2 }],
      [1600, { ex: 1, tilt: 0.8, zoom: -0.07 }], [2500, { ex: 1 }], [3000, RST]],
  }),
  E({ // Mushoku Tensei demon eye: eyeballs roll
    spin: 70,
    base: (<>
      <Disc g="demon" fib="#fff" />
      <circle r={30} fill="none" stroke="#ffd36a" strokeOpacity={0.8} strokeWidth={2} />
      <Slit rx={7} ry={26} />
    </>),
    rot: (<g fill="none" stroke="#ffd36a" strokeWidth={2.2} strokeLinejoin="round">
      <path d={`M${tri(54, -1.5708)}ZM${tri(54, 1.5708)}Z`} />
      <circle r={66} strokeDasharray="3 6" strokeOpacity={0.8} />
    </g>),
    keys: [[0, { open: 1.05, brow: 0.4 }], [250, { lx: -40, ly: -8 }], [450, { ly: -18, lx: -20 }], [650, { lx: 0, ly: -22 }],
      [850, { lx: 30, ly: -16 }], [1050, { lx: 46, ly: -2 }], [1250, { lx: 30, ly: 14 }], [1450, { lx: 0, ly: 18 }],
      [1650, { lx: -30, ly: 12 }], [1850, { lx: -44, ly: 0 }], [2050, { lx: -24, ly: -16 }], [2250, { lx: 0, ly: -22 }],
      [2650, { lx: 0, ly: 0, pupil: 0.6, spin: 2, open: 0.85, tilt: 0.4, brow: 0 }], [3100, RST]],
  }),
  E({ // Shinigami eyes (Light): wide-eyed, then the smirk
    spin: -28, veins: "#c4162b", sclera: "#f6e9ea",
    base: (<>
      <Disc g="crimson" fib="#ffb0b8" />
      <circle r={32} fill="#ff6b78" opacity={0.22} />
      <circle r={50} fill="none" stroke="#1a0005" strokeOpacity={0.5} strokeWidth={1.4} />
      <Pupil r={12} />
    </>),
    rot: <path d={ring(72, 55, 61, 70)} stroke="#1a0005" strokeOpacity={0.85} strokeWidth={1.5} strokeLinecap="round" fill="none" />,
    keys: [[0, {}], [400, { open: 1.12, brow: 0.7, pupil: 0.55 }], [1000, { open: 1.12, brow: 0.8, pupil: 0.35 }],
      [1500, { open: 0.7, brow: -0.4, tilt: 0.8, raise: 0.5, pupil: 0.5, arc: 0.1 }], [2100, { lx: 30 }], [2600, RST]],
  }),
  E({ // Cyborg scan: black sclera, HUD reticle pupil
    sclera: "#1a1521", spin: -40,
    base: (<>
      <Disc g="cyber" fib="#e8ffb0" />
      <circle r={44} fill="none" stroke="#0a2a00" strokeOpacity={0.55} strokeWidth={2} />
      <path d="M-70 0H-22M22 0H70M0 -70V-22M0 22V70" stroke="#0a2a00" strokeOpacity={0.7} strokeWidth={2} />
      <circle data-r="pupil" transform="scale(1)" r={11} fill="#030a00" />
    </>),
    rot: (<g fill="none" stroke="#0a2a00" strokeOpacity={0.8} strokeWidth={3}>
      <circle r={58} strokeDasharray="38 24" />
      <circle r={66} strokeDasharray="2 10" strokeOpacity={0.6} />
    </g>),
    keys: [[0, {}], [400, { lx: -50, ly: -6 }], [900, { lx: 52, ly: 4 }], [1400, { lx: -20, ly: 12 }],
      [1900, { lx: 0, ly: 0, pupil: 0.55, spin: 2.4, zoom: 0.05 }], [2500, RST]],
  }),
  E({ // Vampire: sideways glance, hunger
    sclera: "#f2e9ec", base: (<>
      <Disc g="vamp" fib="#ffb08a" />
      <ellipse data-r="pupil" transform="scale(1)" ry={58} rx={9} fill="#050001">
        <animate attributeName="rx" values="9;5.5;9" dur="2.4s" repeatCount="indefinite" />
      </ellipse>
    </>),
    keys: [[0, {}], [400, { lx: -36, tilt: 0.2 }], [1000, { lx: 34, ly: -4, open: 0.9, tilt: 0.5, pupil: 0.55 }],
      [1600, { lx: 0, ly: 0, open: 0.8, tilt: 0.7, raise: 0.4, pupil: 1.4, brow: -0.2 }], [2300, RST]],
  }),
  E({ // Ghoul (Kaneki): twitch, spreading veins
    sclera: "#1a1521", veins: "#8a0f22", base: (<>
      <Disc g="ghoul" fib="#ff9aa6" />
      <circle r={56} fill="none" stroke="#ff5a6a" strokeOpacity={0.22} strokeWidth={2} />
      <circle data-r="pupil" transform="scale(1)" r={11} fill="#050001"><animate attributeName="r" values="11;8;11" dur="1.7s" repeatCount="indefinite" /></circle>
    </>),
    keys: [[0, { open: 0.85 }], [400, { open: 0.55, tilt: 0.3, shake: 0.5 }], [700, { open: 0.9, shake: 0, vein: 0.4 }],
      [1000, { open: 0.5, shake: 0.6, vein: 0.7 }], [1400, { open: 1.1, brow: 0.6, pupil: 0.45, vein: 1, shake: 0, zoom: 0.05 }],
      [2200, { zoom: 0.05 }], [2800, RST]],
  }),
  E({ // Hollow: eyes snap wide, then a grin
    sclera: "#1a1521", base: (<>
      <Disc g="hollow" fib="#fff6c0" />
      <circle r={50} fill="none" stroke="#3a2200" strokeOpacity={0.5} strokeWidth={2} />
      <Pupil r={10} />
    </>),
    keys: [[0, { open: 0.7 }], [500, { open: 1.15, pupil: 0.7, brow: 0.5 }], [1100, { arc: 0.15, raise: 0.3, tilt: 0.6, brow: -0.2, open: 1 }],
      [1800, { lx: 0 }], [2400, RST]],
  }),
];

/* ───────────── one eye (drawn in local coords, mirrored for the left eye) ───────────── */
function Unit({ eye, side, u, F }: { eye: Eye; side: "L" | "R"; u: "m" | "x"; F: Frame }) {
  const U = F[u], L = side === "L", id = `eyl-c-${u}${side}`;
  const P = (r: string, s = ""): Record<string, any> => ({ "data-r": r, "data-u": u, "data-s": s, [ATTR[r]]: U[r + s] ?? F.m[r + s] });
  const t =
    u === "m"
      ? L ? "translate(430 78) scale(-1 1)" : "translate(450 78)"
      : L ? "translate(334 254.6) scale(-0.52 0.52)" : "translate(546 254.6) scale(0.52)";
  return (
    <g transform={t} display={u === "x" && !eye.four ? "none" : undefined}>
      <clipPath id={id}><path {...P("clip")} /></clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width={400} height={244} fill={eye.sclera} />
        {eye.veins && <path {...P("veins")} d={VEINS} fill="none" stroke={eye.veins} strokeWidth={1.6} strokeLinecap="round" />}
        <g {...P("iris", side)}>
          {eye.base}
          <g {...P("spin")}>{eye.rot}</g>
          <ellipse cx={-28} cy={-32} rx={17} ry={11} transform="rotate(-28 -28 -32)" fill="#fff" opacity={0.7} />
          <circle cx={30} cy={28} r={6} fill="#fff" opacity={0.5} />
          <path d="M-50 22A56 56 0 0 0 18 54" fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={5} strokeLinecap="round" />
        </g>
        <rect width={400} height={244} fill="url(#eyl-ball)" />
        <rect {...P("shade")} width={400} height={92} fill="url(#eyl-shade)" />
      </g>
    </g>
  );
}

/* ───────────── component ───────────── */
export type EyeLoaderProps = {
  /** width in px (responsive, never wider than 94vw) */
  size?: number;
  /** 1 = normal, 2 = twice as fast … */
  speed?: number;
  /** cover the viewport on a dark backdrop (handy for app/loading.tsx) */
  fullscreen?: boolean;
  /** screen-reader text */
  label?: string;
  className?: string;
  /** freeze on one eye by index (for tweaking designs) at `previewAt` ms into its performance */
  preview?: number;
  previewAt?: number;
  /** Optional callback fired when specified cycles/eyes complete */
  onComplete?: () => void;
  /** Optional maximum number of eye cycles before calling onComplete */
  maxCycles?: number;
  /** Optional initial eye index to start on */
  initialEye?: number;
};

type Item = { el: SVGElement; r: string; u: "m" | "x"; s: string };

export default function EyeLoader({
  size = 760, speed = 1, fullscreen = false, label = "Loading", className, preview, previewAt = 1200,
  onComplete, maxCycles, initialEye = 0,
}: EyeLoaderProps) {
  const [idx, setIdx] = useState(preview ?? initialEye);
  const eye = EYES[idx];
  const rootR = useRef<HTMLDivElement>(null);
  const svgR = useRef<SVGSVGElement>(null);
  const items = useRef<Item[]>([]);
  const completedCycles = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const F0 = frame(
    preview != null ? 1 : 0, preview != null ? poseAt(eye.tl, previewAt) : REST,
    previewAt * 0.05, 0, 0, true,
  );

  useEffect(() => {
    items.current = Array.from(rootR.current!.querySelectorAll<SVGElement>("[data-r]")).map((el) => ({
      el, r: el.dataset.r!, u: (el.dataset.u || "m") as "m" | "x", s: el.dataset.s || "",
    }));
  }, [idx]);

  useEffect(() => {
    if (preview != null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = EYES.length;
    let i = (initialEye >= 0 && initialEye < N) ? initialEye : 0;
    let phase: "open" | "hold" | "close" = "open";
    let t0 = performance.now(), last = t0, from = 0, o = 0, ang = 0, zb = 0, raf = 0;
    setIdx(i);

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const e = EYES[i];
      let p: Pose;
      let target = 0;
      if (phase === "open") {
        const q = cl((now - t0) / ((e.twitch ? 240 : 560) / speed));
        o = from + (1 - from) * easeOut(q);
        p = reduce ? REST : e.tl[0].p;
        if (q >= 1) { phase = "hold"; t0 = now; }
      } else if (phase === "hold") {
        const t = (now - t0) * speed;
        o = 1;
        p = reduce ? REST : poseAt(e.tl, t);
        target = 0.04 * cl(t / e.dur);
        if (t >= e.dur) { phase = "close"; t0 = now; }
      } else {
        const nx = EYES[(i + 1) % N], to = nx.twitch ? 0.2 : 0;
        const q = cl((now - t0) / ((nx.twitch ? 150 : 300) / speed));
        o = 1 + (to - 1) * easeIn(q);
        p = reduce ? REST : e.tl[e.tl.length - 1].p;
        target = 0.04;
        if (q >= 1) {
          completedCycles.current++;
          if (maxCycles && completedCycles.current >= maxCycles) {
            onCompleteRef.current?.();
            return;
          }
          i = (i + 1) % N;
          setIdx(i);
          from = to;
          phase = "open";
          t0 = now;
        }
      }
      zb += (target - zb) * (1 - Math.exp(-dt / 260));
      if (!reduce) ang = (ang + e.spin * p.spin * speed * (dt / 1000) * (0.7 + 0.3 * o)) % 360;

      const F = frame(o, p, ang, now, reduce ? 0 : zb, reduce);
      for (const { el, r, u, s } of items.current) {
        const v = F[u][r + s] ?? F.m[r + s];
        if (v !== undefined) el.setAttribute(ATTR[r], v);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [preview, speed, maxCycles, initialEye]);

  const G = (r: string, s = "", u: "m" | "x" = "m"): Record<string, any> => ({
    "data-r": r, "data-u": u, "data-s": s, [ATTR[r]]: F0[u][r + s],
  });

  return (
    <div
      ref={rootR}
      role="status"
      aria-live="polite"
      className={className}
      style={{
        display: "grid", placeItems: "center",
        ...(fullscreen ? { position: "fixed", inset: 0, zIndex: 50, background: "#000" } : null),
      }}
    >
      <svg
        ref={svgR}
        viewBox={`0 0 ${W} ${H}`}
        width={size}
        style={{ display: "block", maxWidth: "94vw", height: "auto", overflow: "hidden" }}
        aria-hidden
      >
        <defs>
          {Object.entries(GRADS).map(([id, [a, b, c]]) => (
            <radialGradient key={id} id={`eyl-${id}`}>
              <stop offset="0" stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={c} />
            </radialGradient>
          ))}
          <radialGradient id="eyl-lum"><stop offset="0" stopColor="#f3e8ff" stopOpacity=".9" /><stop offset="1" stopColor="#b79cf0" stopOpacity="0" /></radialGradient>
          <radialGradient id="eyl-ball" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={190}>
            <stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".38" />
          </radialGradient>
          <linearGradient id="eyl-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".42" /><stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g {...G("cam")}>
          <g {...G("fade")}>
            <Unit eye={eye} side="R" u="m" F={F0} />
            <Unit eye={eye} side="L" u="m" F={F0} />
            <Unit eye={eye} side="R" u="x" F={F0} />
            <Unit eye={eye} side="L" u="x" F={F0} />
          </g>
        </g>
      </svg>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{label}</span>
    </div>
  );
}
