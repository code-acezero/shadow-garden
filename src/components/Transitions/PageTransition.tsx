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
  const isShortsWatch = pathname?.startsWith('/shorts/watch');

  // Pure opacity transition avoids jarring layout reflows and eliminates page/nav sliding
  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <motion.div
      key={pathname}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration: isMobile ? 0.16 : 0.22,
        ease: "easeInOut",
      }}
      style={{ willChange: 'opacity' }}
      className={`page-transition-wrapper min-h-screen w-full ${(isMaster || isLanding || isShortsWatch) ? '!p-0 !pt-0 !pb-0' : 'page-safe-area'}`}
    >
      {children}
    </motion.div>
  );
}
