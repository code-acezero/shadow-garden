import React from 'react';

interface ShadowShortsIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Shadow Garden Style Shorts Icon
 * Blends the vertical Reel / Shorts format with Cid Kagenou's signature Shadow Slime Katana.
 */
export function ShadowShortsIcon({
  size = 18,
  strokeWidth = 2,
  className = '',
  ...props
}: ShadowShortsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Vertical Shorts Reel Frame */}
      <rect x="6" y="2.5" width="12" height="19" rx="3.5" />
      
      {/* Top Camera Notch */}
      <circle cx="12" cy="5.5" r="0.75" fill="currentColor" stroke="none" />
      
      {/* Shadow Slime Blade Slash across the reel */}
      <path d="M4 19.5L8 15.5M7 16.5L18.5 5" />
      
      {/* Katana Tsuba / Crossguard */}
      <path d="M6 17.5L8.5 15" />
      
      {/* Play Arrowhead / Shadow Core */}
      <polygon points="11,10 14.5,12 11,14" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default ShadowShortsIcon;
