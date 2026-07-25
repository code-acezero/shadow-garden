"use client";

import React from 'react';
import { Globe } from 'lucide-react';

export interface CountryInfo {
  code: string;
  name: string;
  shortName: string;
  flagSvg: React.ReactNode;
}

export function getCountryInfo(raw?: string, fallbackType?: string): CountryInfo {
  const query = `${raw || ''} ${fallbackType || ''}`.toLowerCase();

  if (query.includes('korea') || query.includes('k-drama') || query.includes('kr')) {
    return {
      code: 'KR',
      name: 'South Korea',
      shortName: 'K-Drama',
      flagSvg: (
        <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm border border-white/20" aria-hidden="true">
          <rect width="36" height="24" fill="#ffffff" />
          {/* Taegeuk */}
          <path d="M 18 6 A 6 6 0 0 1 18 18 A 6 6 0 0 1 18 6" fill="#c60c30" />
          <path d="M 18 12 A 3 3 0 0 0 18 18 A 3 3 0 0 1 18 12" fill="#c60c30" />
          <path d="M 18 6 A 3 3 0 0 1 18 12 A 3 3 0 0 0 18 6" fill="#003478" />
          <path d="M 18 12 A 6 6 0 0 1 18 18 A 3 3 0 0 1 18 12" fill="#003478" />
          {/* Simplified trigrams */}
          <rect x="6" y="5" width="4" height="1" fill="#000000" transform="rotate(-30 8 5.5)" />
          <rect x="6" y="7" width="4" height="1" fill="#000000" transform="rotate(-30 8 7.5)" />
          <rect x="26" y="16" width="4" height="1" fill="#000000" transform="rotate(-30 28 16.5)" />
          <rect x="26" y="18" width="4" height="1" fill="#000000" transform="rotate(-30 28 18.5)" />
        </svg>
      ),
    };
  }

  if (query.includes('china') || query.includes('chinese') || query.includes('c-drama') || query.includes('cn')) {
    return {
      code: 'CN',
      name: 'China',
      shortName: 'C-Drama',
      flagSvg: (
        <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm border border-white/10" aria-hidden="true">
          <rect width="36" height="24" fill="#de2910" />
          {/* Main star */}
          <polygon points="7,4 8.2,7.5 12,7.5 9,9.7 10.1,13.2 7,11 3.9,13.2 5,9.7 2,7.5 5.8,7.5" fill="#ffde00" />
          {/* Small stars */}
          <polygon points="14,3 14.5,4.5 16,4.5 14.8,5.4 15.2,6.8 14,5.9 12.8,6.8 13.2,5.4 12,4.5 13.5,4.5" fill="#ffde00" />
          <polygon points="16,6 16.5,7.5 18,7.5 16.8,8.4 17.2,9.8 16,8.9 14.8,9.8 15.2,8.4 14,7.5 15.5,7.5" fill="#ffde00" />
          <polygon points="16,10 16.5,11.5 18,11.5 16.8,12.4 17.2,13.8 16,12.9 14.8,13.8 15.2,12.4 14,11.5 15.5,11.5" fill="#ffde00" />
          <polygon points="14,13 14.5,14.5 16,14.5 14.8,15.4 15.2,16.8 14,15.9 12.8,16.8 13.2,15.4 12,14.5 13.5,14.5" fill="#ffde00" />
        </svg>
      ),
    };
  }

  if (query.includes('japan') || query.includes('japanese') || query.includes('j-drama') || query.includes('jp')) {
    return {
      code: 'JP',
      name: 'Japan',
      shortName: 'J-Drama',
      flagSvg: (
        <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm border border-white/20" aria-hidden="true">
          <rect width="36" height="24" fill="#ffffff" />
          <circle cx="18" cy="12" r="6.5" fill="#bc002d" />
        </svg>
      ),
    };
  }

  if (query.includes('turkey') || query.includes('turkish') || query.includes('tr')) {
    return {
      code: 'TR',
      name: 'Turkey',
      shortName: 'Turkish',
      flagSvg: (
        <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm border border-white/10" aria-hidden="true">
          <rect width="36" height="24" fill="#e30a17" />
          <circle cx="15" cy="12" r="5.5" fill="#ffffff" />
          <circle cx="16.5" cy="12" r="4.3" fill="#e30a17" />
          <polygon points="23,12 24.2,10.7 23.5,12.4 25.1,11.8 23.6,12.9 24.5,14.4 23.1,13.2 21.8,14.4 22.4,12.8 20.9,12 22.5,12.3" fill="#ffffff" />
        </svg>
      ),
    };
  }

  if (query.includes('thai') || query.includes('thailand') || query.includes('th')) {
    return {
      code: 'TH',
      name: 'Thailand',
      shortName: 'Thai',
      flagSvg: (
        <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm border border-white/10" aria-hidden="true">
          <rect width="36" height="24" fill="#a51931" />
          <rect y="4" width="36" height="16" fill="#f4f5f8" />
          <rect y="8" width="36" height="8" fill="#2d2a4a" />
        </svg>
      ),
    };
  }

  if (query.includes('hindi') || query.includes('india') || query.includes('in')) {
    return {
      code: 'IN',
      name: 'Hindi',
      shortName: 'Hindi',
      flagSvg: (
        <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shrink-0 shadow-sm border border-white/10" aria-hidden="true">
          <rect width="36" height="8" fill="#ff9933" />
          <rect y="8" width="36" height="8" fill="#ffffff" />
          <rect y="16" width="36" height="8" fill="#138808" />
          <circle cx="18" cy="12" r="2.5" fill="none" stroke="#000080" strokeWidth="0.8" />
        </svg>
      ),
    };
  }

  // Fallback
  const display = raw || fallbackType || 'Drama';
  return {
    code: 'WORLD',
    name: display,
    shortName: display,
    flagSvg: <Globe size={12} className="text-cyan-400 shrink-0" />,
  };
}

interface CountryBadgeProps {
  country?: string;
  type?: string;
  showFullname?: boolean;
  className?: string;
}

export default function CountryBadge({ country, type, showFullname = false, className = '' }: CountryBadgeProps) {
  const info = getCountryInfo(country, type);

  return (
    <div className={`inline-flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-cyan-500/30 z-10 shadow-sm ${className}`}>
      {info.flagSvg}
      <span className="text-[9px] font-black text-white uppercase tracking-wider">
        {showFullname ? info.name : info.shortName}
      </span>
    </div>
  );
}
