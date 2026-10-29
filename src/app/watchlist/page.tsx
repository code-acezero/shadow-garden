"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function WatchlistRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const destination = params ? `/library?${params}` : '/library';
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white text-xs font-mono">
      <span className="text-zinc-500 animate-pulse">Redirecting to Library...</span>
    </div>
  );
}

export default function WatchlistRedirectPage() {
  return (
    <Suspense fallback={null}>
      <WatchlistRedirectContent />
    </Suspense>
  );
}