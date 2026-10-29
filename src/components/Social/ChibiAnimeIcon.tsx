import React from 'react';

interface ChibiAnimeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * ChibiAnimeIcon - A custom, high-fidelity vector icon of a cute chibi anime character
 * with expressive anime eyes, cat ears, blushing cheeks, and a signature :3 smile.
 */
export const ChibiAnimeIcon: React.FC<ChibiAnimeIconProps> = ({
  size = 20,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer Cat / Kitsune Ears */}
      <path
        d="M4.5 9L3 3.5L8.5 5.2"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 9L21 3.5L15.5 5.2"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Inner Ear Fluff (Cute soft pink accent) */}
      <path
        d="M4.8 6.5L4.2 4.2L6.8 5.2"
        fill="#f43f5e"
        opacity="0.8"
      />
      <path
        d="M19.2 6.5L19.8 4.2L17.2 5.2"
        fill="#f43f5e"
        opacity="0.8"
      />

      {/* Chibi Head Outline */}
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="14.5"
        rx="7.25"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* Ahoge (Antenna Hair strand curl on top) */}
      <path
        d="M12 6.5C12 3.8 14.2 3.2 13.5 1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Front Anime Hair Bangs */}
      <path
        d="M4 10.5C5.8 8.8 8 9.2 9.8 7.5C11.5 9.5 13 8 14.5 7.5C16.2 9.2 18.5 8.5 20 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Chibi Eyes: Large expressive anime eyes */}
      <ellipse cx="8.2" cy="13.2" rx="1.6" ry="2.2" fill="currentColor" />
      <ellipse cx="15.8" cy="13.2" rx="1.6" ry="2.2" fill="currentColor" />

      {/* Eye Highlights (Anime light-catch reflections) */}
      <circle cx="8.7" cy="12.3" r="0.75" fill="#ffffff" />
      <circle cx="7.7" cy="14" r="0.35" fill="#ffffff" opacity="0.8" />
      <circle cx="16.3" cy="12.3" r="0.75" fill="#ffffff" />
      <circle cx="15.3" cy="14" r="0.35" fill="#ffffff" opacity="0.8" />

      {/* Blushing Anime Cheeks */}
      <ellipse cx="6" cy="15.8" rx="1.4" ry="0.8" fill="#f43f5e" opacity="0.85" />
      <ellipse cx="18" cy="15.8" rx="1.4" ry="0.8" fill="#f43f5e" opacity="0.85" />

      {/* Cute Anime Mouth (Cat-like :3 smile) */}
      <path
        d="M10.8 15.8C11.3 16.6 11.9 16.6 12 15.9C12.1 16.6 12.7 16.6 13.2 15.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChibiAnimeIcon;
