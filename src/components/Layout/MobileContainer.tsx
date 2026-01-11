"use client"

import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility, or just remove if not

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  hasBottomNav?: boolean; // Set true if you have a bottom navigation bar
}

export default function MobileContainer({ 
  children, 
  className, 
  hasBottomNav = false 
}: MobileContainerProps) {
  return (
    <div 
      className={cn(
        // Base Layout
        "w-full min-h-screen flex flex-col",
        // Mobile Optimization:
        // 1. pb-safe: Adds padding for iPhone bottom swipe bar
        // 2. pt-safe: Adds padding for Notch/Status bar
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]", 
        // 3. Spacing for Bottom Nav (if exists)
        hasBottomNav ? "pb-20" : "", 
        className
      )}
    >
      <div className="flex-1 px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}