"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'moderator')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> Home
        router.replace('/home');
      } else if (profile && !allowedRoles.includes(profile.role)) {
        // Logged in but unauthorized -> Home
        router.replace('/home');
      }
    }
  }, [user, profile, isLoading, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-primary-600">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="ml-2 font-mono text-xs uppercase tracking-widest">Verifying Clearance...</span>
      </div>
    );
  }

  // Visual Block for unauthorized users (if redirect lags)
  if (!user || (profile && !allowedRoles.includes(profile.role))) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-primary-600 space-y-4">
        <ShieldAlert className="w-16 h-16 animate-pulse" />
        <h2 className="text-2xl font-[Cinzel] font-bold">Restricted Area</h2>
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Only Guild Masters Allowed</p>
      </div>
    );
  }

  return <>{children}</>;
}