'use client';

import React, { useId } from 'react';

const ShadowLogo = ({ 
    size = "w-8 h-8",
    spinDuration = "11s"
}: { 
    size?: string;
    spinDuration?: string;
}) => {
    const rawId = useId();
    const id = rawId.replace(/:/g, '_');

    return (
        <div className={`relative flex items-center justify-center ${size} shrink-0 bg-transparent select-none`}>
            <style>{`
                @keyframes shadow-logo-spin {
                    100% { transform: rotate(360deg); }
                }
                @keyframes shadow-lightning-flash-1 {
                    0%, 82% { opacity: 0; transform: rotate(0deg) scale(0.96); }
                    84% { opacity: 1; transform: rotate(6deg) scale(1.06); }
                    88% { opacity: 0.15; transform: rotate(-4deg) scale(0.95); }
                    92% { opacity: 0.95; transform: rotate(3deg) scale(1.03); }
                    96% { opacity: 0.2; transform: rotate(0deg) scale(0.98); }
                    100% { opacity: 0; transform: rotate(0deg) scale(1); }
                }
                @keyframes shadow-lightning-flash-2 {
                    0%, 78% { opacity: 0; transform: rotate(0deg) scale(0.95) scaleX(-1); }
                    80% { opacity: 0.95; transform: rotate(-10deg) scale(1.06) scaleX(-1); }
                    85% { opacity: 0.1; transform: rotate(8deg) scale(0.93) scaleX(-1); }
                    90% { opacity: 0.9; transform: rotate(-3deg) scale(1.03) scaleX(-1); }
                    95% { opacity: 0; transform: rotate(0deg) scale(1) scaleX(-1); }
                    29% { opacity: 0; }
                    100% { opacity: 0; }
                }
                @keyframes shadow-storm-flicker {
                    0%, 82%, 100% { opacity: 0; }
                    84% { opacity: 0.45; }
                    87% { opacity: 0.08; }
                    91% { opacity: 0.55; }
                    94% { opacity: 0; }
                }
            `}</style>
            
            <div className="w-full h-full flex items-center justify-center relative">
                
                {/* SVG Filter for Hyper-Realistic Tesla Electric Shocks */}
                <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
                    <defs>
                        <filter id={`tesla_lightning_${id}`} x="-30%" y="-30%" width="160%" height="160%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
                        </filter>

                        {/* Pure Polished Chrome Metallic White (No dirty dark shades) */}
                        <linearGradient id={`white_metal_${id}`} x1="10%" y1="0%" x2="90%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="35%" stopColor="#f8fafc" />
                            <stop offset="70%" stopColor="#f1f5f9" />
                            <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>

                        {/* Royal Monet 3D Metallic Violet Gradient */}
                        <linearGradient id={`violet_metal_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#d8b4fe" />
                            <stop offset="30%" stopColor="#a855f7" />
                            <stop offset="65%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#4c1d95" />
                        </linearGradient>

                        {/* Polished Metallic Bevel Rim (Violet-White Specular Rim) */}
                        <linearGradient id={`rim_metal_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                            <stop offset="40%" stopColor="#c084fc" stopOpacity="0.8" />
                            <stop offset="75%" stopColor="#9333ea" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.9" />
                        </linearGradient>

                        {/* Subtle Specular Glare (Top Curve Sheen) */}
                        <linearGradient id={`specular_glare_${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Spinning Metallic Yin-Yang Sphere */}
                <svg 
                    viewBox="0 0 32 32" 
                    className="w-full h-full overflow-visible"
                    style={{ 
                        animation: `shadow-logo-spin ${spinDuration} linear infinite`,
                        filter: 'drop-shadow(0 2px 6px rgba(124, 58, 237, 0.45))'
                    }}
                >
                    {/* Yang Side (Brilliant Metallic White) */}
                    <path 
                        d="M16 30 C23.732 30 30 23.732 30 16 S23.732 2 16 2 C12.134 2 8.634 3.567 6.1 6.1 A13.96 13.96 0 0 0 2 16 c0 7.732 6.268 14 14 14 Z" 
                        fill={`url(#white_metal_${id})`} 
                    />
                    
                    {/* Yin Side (Royal Metallic Violet) */}
                    <path 
                        d="M16 2 A14 14 0 0 0 16 30 A7 7 0 0 1 16 16 A7 7 0 0 0 16 2 Z" 
                        fill={`url(#violet_metal_${id})`} 
                    />
                    
                    {/* Complementary Embedded 3D Metal Dots */}
                    {/* White Dot on Violet Half */}
                    <circle cx="16" cy="9" r="2.2" fill={`url(#white_metal_${id})`} />
                    <circle cx="15.3" cy="8.3" r="0.7" fill="#ffffff" />

                    {/* Violet Dot on White Half */}
                    <circle cx="16" cy="23" r="2.2" fill={`url(#violet_metal_${id})`} />
                    <circle cx="15.3" cy="22.3" r="0.7" fill="#f3e8ff" />

                    {/* 3D Specular Curvature Highlight */}
                    <ellipse cx="16" cy="11" rx="10" ry="6" fill={`url(#specular_glare_${id})`} pointerEvents="none" />

                    {/* Polished Metallic Bevel Rim */}
                    <circle 
                        cx="16" 
                        cy="16" 
                        r="14" 
                        fill="none" 
                        stroke={`url(#rim_metal_${id})`} 
                        strokeWidth="1.2" 
                    />
                </svg>

                {/* Sky Purple Electric / Tesla Thunder Overlay (Flashes intermittently with zero idle bar) */}
                <div className="absolute inset-[-15%] pointer-events-none z-30 overflow-visible">
                    {/* Subtle Flash Overlay */}
                    <div 
                        className="absolute inset-[15%] rounded-full bg-violet-300 mix-blend-overlay pointer-events-none opacity-0" 
                        style={{ animation: 'shadow-storm-flicker 2.6s infinite' }} 
                    />

                    {/* Electric Arc 1: Brilliant White & Sky Violet Flash */}
                    <svg 
                        viewBox="0 0 100 100" 
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-0"
                        style={{ animation: 'shadow-lightning-flash-1 2.1s infinite' }}
                    >
                        <g style={{ filter: 'drop-shadow(0 0 4px #c084fc) drop-shadow(0 0 2px #ffffff)' }}>
                            <path 
                                d="M8,22 L32,38 L42,12 L68,46 L94,24" 
                                fill="none" 
                                stroke="#ffffff" 
                                strokeWidth="1.8" 
                                filter={`url(#tesla_lightning_${id})`} 
                            />
                        </g>
                    </svg>

                    {/* Electric Arc 2: Sky Cyan & Purple Spark */}
                    <svg 
                        viewBox="0 0 100 100" 
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-0"
                        style={{ animation: 'shadow-lightning-flash-2 2.7s infinite 0.5s' }}
                    >
                        <g style={{ filter: 'drop-shadow(0 0 5px #7c3aed)' }}>
                            <path 
                                d="M12,82 L38,62 L30,36 L64,22 L86,10" 
                                fill="none" 
                                stroke="#c084fc" 
                                strokeWidth="1.8" 
                                filter={`url(#tesla_lightning_${id})`} 
                            />
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default ShadowLogo;
