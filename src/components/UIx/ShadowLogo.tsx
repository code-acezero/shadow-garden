import React from 'react';

const ShadowLogo = ({ size = "w-8 h-8" }: { size?: string }) => (
    <div className={`relative flex items-center justify-center ${size} shrink-0 bg-transparent`}>
        <style jsx>{`
            @keyframes breath-glow {
                0%, 100% { 
                    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)); 
                    transform: scale(0.95); 
                }
                50% { 
                    filter: drop-shadow(0 0 16px rgba(255, 255, 255, 1)); 
                    transform: scale(1.08); 
                }
            }
            @keyframes spin-slow {
                100% { transform: rotate(360deg); }
            }
        `}</style>
        
        {/* Layer 1: The Breathing Wrapper (Changed 3s to 6s for slower breath) */}
        <div 
            className="w-full h-full flex items-center justify-center"
            style={{ animation: 'breath-glow 6s ease-in-out infinite' }} 
        >
            {/* Layer 2: The Spinning Icon */}
            <svg 
                viewBox="0 0 24 24" 
                className="w-full h-full"
                style={{ animation: 'spin-slow 8s linear infinite' }}
            >
                {/* White Yang Side */}
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2c-2.761 0-5.261 1.119-7.071 2.929A9.969 9.969 0 0 0 2 12c0 5.523 4.477 10 10 10Z" fill="white"/>
                
                {/* Red Yin Side */}
                <path d="M12 2a10 10 0 0 0 0 20 5 5 0 0 1 0-10 5 5 0 0 0 0-10Z" fill="#dc2626"/>
                
                {/* Dots */}
                <circle cx="12" cy="7" r="1.5" fill="white" />
                <circle cx="12" cy="17" r="1.5" fill="#dc2626" />
                
                {/* Outline */}
                <circle cx="12" cy="12" r="10" fill="none" stroke="black" strokeWidth="0.5" strokeOpacity="0.3" />
            </svg>
        </div>
    </div>
);

export default ShadowLogo;