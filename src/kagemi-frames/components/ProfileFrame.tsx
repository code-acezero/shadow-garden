'use client';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { frameMarkup } from '../frames/engine';

export type AnimateMode = 'always' | 'inview' | 'hover' | 'never';
export interface ProfileFrameProps {
  /** Frame id from `catalog`, e.g. "the-eternal", "kogane". */
  frame: string;
  /** Avatar image URL. Any picture works, including the glitch layers. */
  src?: string;
  size?: number | string;
  /** 'always' = animate always (your own profile), 'inview' = while on screen (use sparingly), 'hover' = only on hover (default, best for lists), 'never' = still pose. */
  animate?: AnimateMode;
  /** Tilts depth layers with the pointer. Use on profile pages / previews only. */
  parallax?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

const FALLBACK_AVATAR = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
const ANIME_FALLBACK = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';

export default function ProfileFrame({ frame, src, size = 96, animate = 'inview', parallax = false, className = '', style, label }: ProfileFrameProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(animate === 'always' || animate === 'inview');
  const [hover, setHover] = useState(false);
  const posed = useRef<string>('');

  // Normalize avatar URL against dead hosting links
  const safeSrc = useMemo(() => {
    if (!src || src.includes('imgbb.com') || src.includes('ibb.co')) {
      return FALLBACK_AVATAR;
    }
    return src;
  }, [src]);

  // Build the SVG only when the frame is near the viewport (keeps long lists light).
  useEffect(() => {
    if (animate === 'always') {
      setNear(true);
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [animate]);

  const html = useMemo(() => {
    if (!near || !frame || frame === 'none') return '';
    return frameMarkup(frame, uid, safeSrc);
  }, [near, frame, uid, safeSrc]);

  // Play only when allowed; otherwise freeze on a nice still pose.
  useEffect(() => {
    const svg = host.current?.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return;
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = !reduced && (animate === 'always' || (animate === 'inview' && near) || (animate === 'hover' && hover));
    // Pick the still pose only once per mount. Later pauses keep their place and resume from there.
    if (posed.current !== html) { 
      try { svg.setCurrentTime(2.5); } catch {}
      posed.current = html; 
    }
    if (run) { 
      try { svg.unpauseAnimations(); } catch {}
      svg.classList.remove('kf-paused'); 
    } else { 
      try { svg.pauseAnimations(); } catch {}
      svg.classList.add('kf-paused'); 
    }
  }, [html, animate, near, hover]);

  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    const el = host.current, svg = el?.querySelector('svg');
    if (!el || !svg) return;
    const r = el.getBoundingClientRect();
    svg.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 14));
    svg.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 14));
  };
  const untilt = () => {
    const svg = host.current?.querySelector('svg');
    svg?.style.setProperty('--px', '0'); svg?.style.setProperty('--py', '0');
  };

  // Plain avatar fallback for 'none' or un-framed state
  if (frame === 'none') {
    return (
      <div
        ref={host}
        className={`kf-root flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size, ...style }}
        role="img"
        aria-label={label ?? frame}
      >
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-zinc-950">
          <img
            src={safeSrc}
            alt={label ?? frame}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ANIME_FALLBACK;
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={host}
      className={`kf-root ${className}`}
      style={{ width: size, height: size, ...style }}
      role="img"
      aria-label={label ?? frame}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => { setHover(false); untilt(); }}
      onPointerMove={parallax ? tilt : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
