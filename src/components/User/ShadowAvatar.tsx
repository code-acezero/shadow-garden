"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ShadowAvatarProps {
    gender?: string;
    className?: string;
}

export default function ShadowAvatar({ gender = 'male', className }: ShadowAvatarProps) {
    const isFemale = gender?.toLowerCase() === 'female';

    return (
        <div className={cn("w-full h-full bg-[#050505] flex items-end justify-center overflow-hidden relative", className)}>
            {/* Red Glow Background */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-red-600 blur-[20px] opacity-40 animate-pulse" />
            
            {/* Silhouette SVG */}
            <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-full h-[90%] text-black z-10 drop-shadow-[0_-2px_4px_rgba(220,38,38,0.5)]"
                xmlns="http://www.w3.org/2000/svg"
            >
                {isFemale ? (
                    // Female Silhouette path
                    <path d="M12 2C9 2 7 3.5 7 6C7 7.5 8 9 9 9.5V10C9 12 6 13 6 16V22H18V16C18 13 15 12 15 10V9.5C16 9 17 7.5 17 6C17 3.5 15 2 12 2Z" />
                ) : (
                    // Male Silhouette path
                    <path d="M12 2C9.5 2 7.5 3.5 7.5 6C7.5 8 8.5 9.5 9.5 10C7.5 11 5 13 5 16V22H19V16C19 13 16.5 11 14.5 10C15.5 9.5 16.5 8 16.5 6C16.5 3.5 14.5 2 12 2Z" />
                )}
            </svg>
        </div>
    );
}