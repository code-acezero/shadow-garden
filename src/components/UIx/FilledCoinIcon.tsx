"use client";

import React, { useId } from 'react';

interface FilledCoinIconProps {
  size?: number | string;
  className?: string;
}

export function FilledCoinIcon({ size = 16, className = "" }: FilledCoinIconProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const gradId = `coin_grad_${safeId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none overflow-visible ${className}`}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="95%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <linearGradient id={`${gradId}_star`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Outer Coin Body - Solid Filled Golden Disc */}
      <circle cx="12" cy="12" r="10.5" fill={`url(#${gradId})`} stroke="#b45309" strokeWidth="1" />

      {/* Embossed Inner Rim */}
      <circle cx="12" cy="12" r="8" fill="none" stroke="#fef08a" strokeWidth="0.8" opacity="0.85" />

      {/* Subtle Upper Gloss Highlight */}
      <path
        d="M6 11 A 6.5 6.5 0 0 1 13 5.5"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Embossed Center Star / Coin Crest */}
      <path
        d="M12 6.8 L13.4 10.6 L17.2 12 L13.4 13.4 L12 17.2 L10.6 13.4 L6.8 12 L10.6 10.6 Z"
        fill={`url(#${gradId}_star)`}
        stroke="#d97706"
        strokeWidth="0.5"
      />

      {/* Central Diamond Spark */}
      <circle cx="12" cy="12" r="1.3" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

export default FilledCoinIcon;

