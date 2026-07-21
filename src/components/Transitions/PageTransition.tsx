"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that render edge-to-edge and ignore safe areas
  const isEdgeToEdge = 
    pathname === '/' || 
    pathname.startsWith('/watch') || 
    pathname.startsWith('/donghua-watch') || 
    pathname.startsWith('/drama-watch') ||
    pathname.startsWith('/hindi-watch') ||
    pathname.startsWith('/movies-watch');

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      onAnimationComplete={(definition) => {
        const el = document.querySelector('.page-transition-wrapper') as HTMLElement;
        if (el) {
          el.style.transform = 'none';
        }
      }}
      className={`page-transition-wrapper min-h-screen ${!isEdgeToEdge ? 'page-safe-area' : ''}`}
    >
      {children}
    </motion.div>
  );
}
