"use client";

import { useEffect, useState, useRef } from 'react';
import { adManager, AdsConfig } from '@/lib/adManager';

export default function AdScriptInjector() {
  const [config, setConfig] = useState<AdsConfig | null>(null);
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    // 1. Initial local config load
    const initialConfig = adManager.getConfig();
    setConfig(initialConfig);

    // 2. Background database sync
    adManager.syncFromDatabase().then((synced) => {
      setConfig(synced);
    });

    // 3. Listen for admin live updates
    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };

    window.addEventListener('shadow-ads-config-changed', handleConfigChange);
    return () => window.removeEventListener('shadow-ads-config-changed', handleConfigChange);
  }, []);

  useEffect(() => {
    if (!config || !config.enabled) return;
    if (adManager.isExempt()) return;
    if (!config.socialBarEnabled && !config.popunderEnabled) return;
    if (scriptInjectedRef.current) return;

    // Delay script injection to prevent interfering with first impression & Core Web Vitals
    const delayMs = (config.socialBarDelaySeconds || 15) * 1000;

    const timer = setTimeout(() => {
      if (typeof document === 'undefined') return;
      if (scriptInjectedRef.current) return;

      const injectScript = (url: string, name: string) => {
        if (!url) return;
        if (document.querySelector(`script[src="${url}"]`)) return;

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.onerror = () => {
          console.warn(`[Adsterra] ${name} script blocked or unreachable`);
        };
        document.body.appendChild(script);
        console.log(`[Adsterra] ${name} script initialized`);
      };

      // 1. Social Bar (In-page push notification)
      if (config.socialBarEnabled) {
        const socialUrl = config.socialBarScriptUrl || 'https://divinglibrary.com/c3/9b/d7/c39bd7bee74d0bb41da0c29f683939d8.js';
        injectScript(socialUrl, 'Social Bar');
      }

      // 2. Popunder (Background under-tab on click)
      if (config.popunderEnabled) {
        const popunderUrl = config.popunderScriptUrl || config.adScriptUrl || 'https://divinglibrary.com/70/10/05/70100569fb256cc9e16e5631a53f9905.js';
        injectScript(popunderUrl, 'Popunder');
      }

      scriptInjectedRef.current = true;
    }, delayMs);

    return () => clearTimeout(timer);
  }, [config]);

  // Clean up floating Social Bar scripts/iframes if disabled
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!config || !config.socialBarEnabled) {
      const socialScripts = document.querySelectorAll('script[src*="c39bd7bee74d0bb41da0c29f683939d8"]');
      socialScripts.forEach(s => s.remove());
      const iframes = document.querySelectorAll('iframe[id*="container-c39b"], iframe[class*="container-c39b"], [id*="container-c39b"]');
      iframes.forEach(el => el.remove());
    }
  }, [config]);

  // Watch for and enforce bottom-right placement & dark theme on Social Bar iframe
  useEffect(() => {
    if (!config || !config.enabled || !config.socialBarEnabled) return;
    if (adManager.isExempt()) return;
    if (typeof document === 'undefined') return;

    const styleAndRepositionSocialBar = () => {
      const iframes = document.querySelectorAll('iframe[id*="container-c39b"], iframe[class*="container-c39b"], [id*="container-c39b"]');
      iframes.forEach((el) => {
        const iframe = el as HTMLIFrameElement;
        // 1. Force placement to bottom-right corner and eliminate outer frame box
        iframe.style.setProperty('position', 'fixed', 'important');
        iframe.style.setProperty('inset', 'auto 20px 105px auto', 'important');
        iframe.style.setProperty('top', 'auto', 'important');
        iframe.style.setProperty('bottom', '105px', 'important');
        iframe.style.setProperty('right', '20px', 'important');
        iframe.style.setProperty('left', 'auto', 'important');
        iframe.style.setProperty('background', 'transparent', 'important');
        iframe.style.setProperty('background-color', 'transparent', 'important');
        iframe.style.setProperty('border', 'none', 'important');
        iframe.style.setProperty('box-shadow', 'none', 'important');
        iframe.style.setProperty('outline', 'none', 'important');
        iframe.style.setProperty('overflow', 'visible', 'important');
        iframe.style.setProperty('max-width', '360px', 'important');
        iframe.style.setProperty('transform', 'scale(0.96)', 'important');
        iframe.style.setProperty('transform-origin', 'bottom right', 'important');
        iframe.style.setProperty('z-index', '9990', 'important');

        // 2. Inject simple, small, clean styling into iframe content document
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && doc.head && !doc.getElementById('shadow-garden-sb-style')) {
            const customStyle = doc.createElement('style');
            customStyle.id = 'shadow-garden-sb-style';
            customStyle.textContent = `
              body, html {
                background: transparent !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              [class*="__wrap"] {
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              [class*="__content"] {
                background: rgba(18, 18, 22, 0.96) !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.7) !important;
                padding: 10px 14px !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                max-width: 330px !important;
                backdrop-filter: blur(10px) !important;
                margin: 0 !important;
              }
              [class*="__link"] {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
              }
              [class*="__message-icon"] {
                width: 38px !important;
                height: 38px !important;
                min-width: 38px !important;
                border-radius: 8px !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                object-fit: cover !important;
              }
              [class*="__name__abonem"] {
                color: #f4f4f5 !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-weight: 600 !important;
                font-size: 12px !important;
                line-height: 1.3 !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
              }
              [class*="__btn-bloc"] {
                margin-top: 5px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
              }
              [class*="__btn1"] {
                background: #dc2626 !important;
                color: #ffffff !important;
                border-radius: 6px !important;
                font-weight: 700 !important;
                font-size: 11px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.04em !important;
                padding: 4px 12px !important;
                box-shadow: none !important;
                transition: background 0.15s ease !important;
              }
              [class*="__btn1"]:hover {
                background: #ef4444 !important;
              }
              [class*="__closelink"] {
                color: #71717a !important;
                font-size: 10px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                padding: 2px 4px !important;
                transition: color 0.15s !important;
              }
              [class*="__closelink"]:hover {
                color: #ffffff !important;
              }
              [class*="__number"] {
                background: #dc2626 !important;
                width: 14px !important;
                height: 14px !important;
                font-size: 9px !important;
                line-height: 14px !important;
                top: -4px !important;
                right: -4px !important;
              }
            `;
            doc.head.appendChild(customStyle);
          }
        } catch (e) {
          // Ignore cross-origin issues if any
        }
      });
    };

    // Run immediately & check continuously
    styleAndRepositionSocialBar();
    const interval = setInterval(styleAndRepositionSocialBar, 1500);

    // Also observe DOM tree additions
    const observer = new MutationObserver(() => {
      styleAndRepositionSocialBar();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [config]);

  return null;
}
