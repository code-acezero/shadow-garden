"use client";

import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

// ── Trusted domains: popups to these are allowed through ───────────────────
const TRUSTED_DOMAINS = [
  'youtube.com', 'youtu.be', 'vimeo.com', 'google.com',
  'dailymotion.com', 'twitch.tv', 'bilibili.com',
];

function isTrusted(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    const clean = hostname.replace(/^www\./, '');
    return TRUSTED_DOMAINS.some(d => clean === d || clean.endsWith(`.${d}`));
  } catch {
    // Relative URLs (e.g. "/" paths) are internal — safe
    return url.startsWith('/') && !url.startsWith('//');
  }
}

function dispatchBlock(count: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('shadow-whisper', {
      detail: {
        id: Date.now(),
        type: 'warning',
        title: '🛡️ Ad Shield',
        message: `You clicked and closed ${count} ad${count !== 1 ? 's' : ''}.`,
      },
    })
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface IframeAdShieldProps {
  /** The iframe (or wrapper containing it) to protect */
  children: ReactNode;
  /** Whether shield is active. Default: true */
  enabled?: boolean;
  /** Extra className for the outer wrapper */
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function IframeAdShield({
  children,
  enabled = true,
  className = 'relative w-full h-full',
}: IframeAdShieldProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const isOverRef     = useRef(false);          // mouse is over the iframe area
  const blockedRef    = useRef(0);              // total blocks this session
  const cooldownRef   = useRef(false);          // debounce duplicate notifications
  const [blockedCount, setBlockedCount]     = useState(0);

  // ── Helper: report a blocked event ────────────────────────────────────────
  const reportBlock = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 2500);

    blockedRef.current += 1;
    const n = blockedRef.current;
    setBlockedCount(n);
    dispatchBlock(n);
  }, []);

  // ── Layer 1: window.open() override ───────────────────────────────────────
  // Iframes can call window.open() on the parent to open ad tabs.
  useEffect(() => {
    if (!enabled) return;
    const original = window.open.bind(window);

    (window as any).open = function (
      url?: string | URL,
      target?: string,
      features?: string
    ): Window | null {
      const urlStr = url?.toString() ?? '';

      // Block: empty URL, or untrusted domain called while mouse is near iframe
      if (!urlStr || (!isTrusted(urlStr) && isOverRef.current)) {
        console.warn('[AdShield] Blocked window.open:', urlStr || '(blank)');
        reportBlock();
        return null;
      }

      // Untrusted popup when mouse is NOT over iframe — still suspicious
      if (urlStr && !isTrusted(urlStr) && target === '_blank') {
        console.warn('[AdShield] Blocked untrusted popup:', urlStr);
        reportBlock();
        return null;
      }

      return original(url, target, features);
    };

    return () => { window.open = original; };
  }, [enabled, reportBlock]);

  // ── Layer 2: visibilitychange — tab-steal detection ───────────────────────
  // When an invisible <a> inside the iframe opens a new tab, our page goes
  // into `hidden` state. We detect this while the mouse is over our container.
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden && isOverRef.current) {
        console.warn('[AdShield] Tab-steal redirect detected via visibilitychange');
        reportBlock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled, reportBlock]);

  // ── Layer 3: blur tracker — catches focus-steal via window.open ──────────
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      if (!isOverRef.current) return;
      // Give the browser 150 ms to resolve whether a new tab opened.
      // If we're in 'hidden' state after that, it was a redirect.
      setTimeout(() => {
        if (document.hidden) {
          console.warn('[AdShield] Redirect detected via window blur');
          reportBlock();
        }
      }, 150);
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [enabled, reportBlock]);

  // ── Layer 4: top-frame navigation guard (target="_top") ───────────────────
  // Some ads navigate the current tab away using <a target="_top">.
  // beforeunload is our last line of defence.
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOverRef.current) {
        e.preventDefault();
        e.returnValue = ''; // triggers browser "Leave page?" dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  // ── Mouse tracking ────────────────────────────────────────────────────────
  const onMouseEnter = useCallback(() => { isOverRef.current = true;  }, []);
  const onMouseLeave = useCallback(() => { isOverRef.current = false; }, []);

  if (!enabled) return <>{children}</>;

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}

      {/* ── Blocked-count badge ── */}
      {blockedCount > 0 && (
        <div className="absolute top-2 left-2 z-[60] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-500">
          <ShieldCheck size={10} className="text-emerald-400 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
            {blockedCount} ad{blockedCount !== 1 ? 's' : ''} blocked
          </span>
        </div>
      )}
    </div>
  );
}
