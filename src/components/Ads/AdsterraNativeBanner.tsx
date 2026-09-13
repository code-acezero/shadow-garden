"use client";

import React, { useState, useEffect, useRef } from 'react';
import { adManager, AdsConfig } from '@/lib/adManager';
import { ExternalLink, Radio, X } from 'lucide-react';

interface AdsterraNativeBannerProps {
  location?: 'watch' | 'download' | 'otakuverse' | 'general';
  format?: '728x90' | '300x250' | 'native';
  className?: string;
}

export default function AdsterraNativeBanner({
  location = 'general',
  format = 'native',
  className = '',
}: AdsterraNativeBannerProps) {
  const [config, setConfig] = useState<AdsConfig>(adManager.getConfig());
  const [dismissed, setDismissed] = useState(false);
  const [hasAdsterraFilled, setHasAdsterraFilled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    setConfig(adManager.getConfig());
    const handleConfigChange = (e: any) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('shadow-ads-config-changed', handleConfigChange);
    return () => window.removeEventListener('shadow-ads-config-changed', handleConfigChange);
  }, []);

  const bannerUnitId = config.nativeBannerUnitId || 'd0b85e11abfe70f8bf477f8ec122a128';
  const bannerScriptUrl = config.nativeBannerScriptUrl || 'https://divinglibrary.com/d0b85e11abfe70f8bf477f8ec122a128/invoke.js';

  useEffect(() => {
    if (!config.enabled || !config.nativeBannerEnabled || dismissed) return;
    if (adManager.isExempt()) return;
    if (typeof document === 'undefined') return;

    // Check location specific toggle
    if (location === 'watch' && !config.showOnWatchPage) return;
    if (location === 'download' && !config.showOnDownloadPage) return;
    if (location === 'otakuverse' && !config.showOnOtakuVerse) return;

    const containerId = `container-${bannerUnitId}`;
    const targetElement = document.getElementById(containerId);

    // Watch if Adsterra injects ad nodes (iframes or banners) into container
    let observer: MutationObserver | null = null;
    if (targetElement) {
      if (targetElement.children.length > 0) {
        setHasAdsterraFilled(true);
      }
      observer = new MutationObserver(() => {
        if (targetElement.children.length > 0) {
          setHasAdsterraFilled(true);
        }
      });
      observer.observe(targetElement, { childList: true, subtree: true });
    }

    // Inject the Adsterra Native Banner script if not already present
    if (!scriptInjectedRef.current && !document.querySelector(`script[src="${bannerScriptUrl}"]`)) {
      try {
        const script = document.createElement('script');
        script.src = bannerScriptUrl;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.onerror = () => {
          console.warn('[Adsterra] Native banner script blocked or unreachable');
        };
        document.body.appendChild(script);
        scriptInjectedRef.current = true;
      } catch (e) {
        console.warn('[Adsterra] Error injecting native banner script:', e);
      }
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [config, dismissed, location, bannerUnitId, bannerScriptUrl]);

  if (dismissed || !config.enabled || !config.nativeBannerEnabled) return null;
  if (adManager.isExempt()) return null;
  if (location === 'watch' && !config.showOnWatchPage) return null;
  if (location === 'download' && !config.showOnDownloadPage) return null;
  if (location === 'otakuverse' && !config.showOnOtakuVerse) return null;

  const handleSponsorClick = () => {
    adManager.triggerSmartlink('native_banner');
  };

  const containerId = `container-${bannerUnitId}`;

  return (
    <div
      className={`w-full my-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 backdrop-blur-2xl transition-all duration-300 relative group overflow-hidden ${className}`}
    >
      {/* Liquid Glass Highlight & Shine Overlays */}
      <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl" />

      {/* Unified Single-Layer Header */}
      <div className="relative z-10 w-full flex items-center justify-between text-[9px] font-mono tracking-widest text-zinc-500 uppercase mb-2">
        <span className="flex items-center gap-2 text-zinc-400">
          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-primary-400 text-[9px] font-black tracking-wider">AD</span>
          <span className="tracking-widest uppercase text-zinc-400 font-medium">Sponsored Transmission</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSponsorClick}
            className="hover:text-primary-400 flex items-center gap-1 transition-colors text-[9px] text-zinc-400 font-medium tracking-wider"
            title="Explore Sponsor"
          >
            <span>Visit Partner</span>
            <ExternalLink size={10} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="hover:text-white p-0.5 rounded transition-colors text-zinc-600 hover:text-zinc-300"
            title="Hide for this session"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Adsterra Native Banner Container */}
      <div
        id={containerId}
        ref={containerRef}
        className={`relative z-10 w-full flex items-center justify-center overflow-hidden ${hasAdsterraFilled ? 'min-h-[90px]' : 'empty:hidden'}`}
      />

      {/* Seamless Single-Layer Fallback (Displayed when Adsterra container is waiting/empty or blocked by adblock) */}
      {!hasAdsterraFilled && (
        <div
          onClick={handleSponsorClick}
          className="relative z-10 w-full pt-1 pb-0.5 flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-primary-400 shrink-0">
              <Radio size={16} className="text-primary-500 group-hover:animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-primary-300 transition-colors truncate">
                Ultra HD Anime Stream Network &amp; Partner Releases
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                Support Shadow Garden free servers &amp; explore sponsored anime content
              </p>
            </div>
          </div>
          <span className="w-full sm:w-auto justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white text-[10px] font-bold tracking-wider uppercase transition-all border border-white/20 shrink-0 flex items-center gap-1.5">
            <span>Explore</span>
            <ExternalLink size={10} />
          </span>
        </div>
      )}
    </div>
  );
}
