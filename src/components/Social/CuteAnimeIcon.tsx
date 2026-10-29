import React from 'react';

interface CuteAnimeIconProps {
  className?: string;
  size?: number;
}

/**
 * Cute Chibi Anime Mascot / Kawaii Neko TV Icon
 * Designed specifically for anime title tags and media badges.
 */
export const CuteAnimeIcon: React.FC<CuteAnimeIconProps> = ({ 
  className = "w-3.5 h-3.5", 
  size = 14 
}) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Neko Ear */}
      <path d="M4 8.5 L6.8 2.2 C7.1 1.6 8 1.9 8.2 2.6 L9.5 8.5 Z" />
      {/* Right Neko Ear */}
      <path d="M20 8.5 L17.2 2.2 C16.9 1.6 16 1.9 15.8 2.6 L14.5 8.5 Z" />
      {/* Screen Body */}
      <rect x="3" y="7" width="18" height="13.5" rx="4" />
      {/* Happy Kawaii Curved Eyes ^_^ */}
      <path d="M7 13.2 C8 11.8 9 11.8 10 13.2" stroke="#0e0e13" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M14 13.2 C15 11.8 16 11.8 17 13.2" stroke="#0e0e13" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Blush Cheeks */}
      <circle cx="6.2" cy="15.2" r="1.2" fill="#f43f5e" />
      <circle cx="17.8" cy="15.2" r="1.2" fill="#f43f5e" />
      {/* Cute Neko Cat Mouth (w) */}
      <path d="M10.8 15 C11.3 16 11.8 16 12 15 C12.2 16 12.7 16 13.2 15" stroke="#0e0e13" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
};

export default CuteAnimeIcon;
