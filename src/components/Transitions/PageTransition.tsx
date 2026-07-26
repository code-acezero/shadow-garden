"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile/tablet once on mount — avoids re-render on resize
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
  }, []);

  const isMaster = pathname?.startsWith('/master');
  const isLanding = pathname === '/';

  // Mobile/Tablet: opacity only (no y-offset = no layout reflow)
  // Desktop: subtle y-offset for premium feel
  const variants = isMobile
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      };

  return (
    <motion.div
      key={pathname}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration: isMobile ? 0.18 : 0.3,
        ease: "easeOut",
      }}
      style={{ willChange: 'opacity, transform' }}
      className={`page-transition-wrapper min-h-screen w-full ${(isMaster || isLanding) ? '!p-0 !pt-0 !pb-0' : 'page-safe-area'}`}
    >
      {children}
    </motion.div>
  );
}
