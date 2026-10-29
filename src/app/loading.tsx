import React from 'react';
import { PageSkeleton } from '@/components/UIx/SkeletonLoaders';

export default function GlobalLoading() {
  return (
    <div className="w-full min-h-screen bg-[#050505] text-white">
      <PageSkeleton />
    </div>
  );
}
