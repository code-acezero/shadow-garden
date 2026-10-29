"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playGummyPop } from '@/lib/audioManager';
import { cn } from '@/lib/utils';

interface Gummy3DIconProps {
  src: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  sizeClassName?: string;
}

export default function Gummy3DIcon({
  src,
  alt,
  fallback,
  className,
  sizeClassName = "w-10 h-10 md:w-12 md:h-12"
}: Gummy3DIconProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  }, []);

  return (
    <motion.div
      whileHover={{ 
        scale: 1.15, 
        rotate: [-2, 3, -1, 0],
        transition: { duration: 0.32, ease: "easeOut" } 
      }}
      whileTap={{ scale: 0.88 }}
      onClick={() => playGummyPop()}
      className={cn(
        "relative shrink-0 flex items-center justify-center select-none cursor-pointer transform-gpu",
        sizeClassName,
        className
      )}
      title={alt}
    >
      {!hasError ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="eager"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)] transition-all duration-300",
            isLoaded ? "opacity-100 scale-100" : "opacity-90"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {fallback}
        </div>
      )}
    </motion.div>
  );
}
