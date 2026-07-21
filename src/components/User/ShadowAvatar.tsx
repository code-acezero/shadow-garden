import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface ShadowAvatarProps {
    gender?: string;
    className?: string;
}

export default function ShadowAvatar({ gender = 'male', className }: ShadowAvatarProps) {
    const isFemale = gender?.toLowerCase() === 'female';

    return (
        <div className={cn(
            "w-full h-full flex items-center justify-center overflow-hidden",
            isFemale ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400" : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400",
            className
        )}>
            {/* Clean Flat Icon */}
            <User className="w-1/2 h-1/2 opacity-80" strokeWidth={2} />
        </div>
    );
}