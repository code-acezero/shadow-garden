import React from 'react';

export const DragonIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* A stylized dragon icon vector */}
    <path d="M12 2C8 2 5.5 5 5.5 5S4 6 4 8c0 3 2 4 4 6-1.5 2-4 3-4 3s2 1 4 .5c2 1 5 1 7-1 2-2 3-5 3-7 0-2-1.5-3-1.5-3S16 2 12 2z" />
    <path d="M9 10c0 1 1 1.5 2 1.5s2-.5 2-1.5" />
    <path d="M7 6c0-1 1-1.5 2-1.5" />
    <path d="M17 6c0-1-1-1.5-2-1.5" />
    <path d="M12 11v6" />
    <path d="M10 17l2 3 2-3" />
    <path d="M6 14l-2 2" />
    <path d="M18 14l2 2" />
  </svg>
);
