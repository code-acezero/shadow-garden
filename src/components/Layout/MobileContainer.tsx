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
        "w-full min-h-full flex flex-col",
        className
      )}
    >
      <div className="flex-1 px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}