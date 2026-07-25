'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';


export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Stop loader whenever pathname or searchParams change (navigation finished)
  useEffect(() => {
    setIsNavigating(false);
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 400);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Global click interceptor for instant feedback on internal links/buttons
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a, button[data-navigate], [role="button"]');
      if (!target) return;

      const href = target.getAttribute('href') || target.getAttribute('data-href');
      
      // If it's an internal link navigation
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          setIsNavigating(true);
          setProgress(25);
        }
      }
    };

    // Custom window event for programatic router pushes
    const handleNavStart = () => {
      setIsNavigating(true);
      setProgress(30);
    };

    window.addEventListener('click', handleAnchorClick, { capture: true });
    window.addEventListener('shadow-nav-start', handleNavStart);

    return () => {
      window.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('shadow-nav-start', handleNavStart);
    };
  }, []);

  // Increment progress bar smoothly while loading
  useEffect(() => {
    if (!isNavigating) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 15;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isNavigating]);

  return (
    <>
      {/* Top Crimson Progress Line */}
      <AnimatePresence>
        {(isNavigating || progress > 0) && (
          <motion.div
            className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-700 via-primary-500 to-red-400 z-[999999] shadow-[0_0_12px_rgba(220,38,38,0.8)] pointer-events-none"
            initial={{ opacity: 1, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: progress / 100 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: 'left' }}
            transition={{ ease: 'easeOut', duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
