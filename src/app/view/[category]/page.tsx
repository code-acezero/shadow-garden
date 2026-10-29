"use client";

import { useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ViewCategoryRedirectContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = (params?.category as string) || '';
  const page = searchParams.get('page');

  useEffect(() => {
    if (!category) {
      router.replace('/explore');
      return;
    }

    const query = new URLSearchParams();
    if (page && page !== '1') query.set('page', page);

    if (category === 'donghua') {
      query.set('library', 'donghua');
    } else if (category === 'hindi') {
      query.set('library', 'hindi');
    } else if (category === 'drama') {
      query.set('library', 'drama');
    } else if (category === 'movies') {
      query.set('library', 'movies');
    } else if (category === 'manga') {
      query.set('library', 'manga');
    } else if (category === 'ongoing' || category === 'airing') {
      query.set('category', 'airing');
    } else {
      query.set('category', category);
    }

    router.replace(`/explore?${query.toString()}`);
  }, [category, page, router]);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#07090e] text-white">
      <Loader2 className="animate-spin text-primary-500" size={28} />
      <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Opening in Explore...</span>
    </div>
  );
}

export default function ViewCategoryRedirect() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#07090e] text-white">
        <Loader2 className="animate-spin text-primary-500" size={28} />
      </div>
    }>
      <ViewCategoryRedirectContent />
    </Suspense>
  );
}