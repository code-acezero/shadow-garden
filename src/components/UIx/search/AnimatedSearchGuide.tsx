"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GUIDE_PROMPTS } from './SearchConfig';

interface AnimatedSearchGuideProps {
  activeTargetId?: string;
  onSelectPrompt?: (prefix: string) => void;
  className?: string;
}

export const AnimatedSearchGuide: React.FC<AnimatedSearchGuideProps> = ({ 
  activeTargetId,
  onSelectPrompt,
  className = "" 
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % GUIDE_PROMPTS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const current = GUIDE_PROMPTS[index];

  return (
    <div 
      className={`absolute inset-0 flex items-center pointer-events-none overflow-hidden pl-2 ${className}`}
      onClick={(e) => {
        if (current.prefix && onSelectPrompt) {
          e.stopPropagation();
          onSelectPrompt(current.prefix);
        }
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center text-zinc-500 select-none truncate w-full text-[10px] md:text-xs"
        >
          <span className="truncate tracking-wide font-normal">
            {current.text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedSearchGuide;
