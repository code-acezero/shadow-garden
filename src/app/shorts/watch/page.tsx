import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShortDramaById } from '@/lib/shorts';
import WatchClientLoader from './WatchClientLoader';

interface WatchPageProps {
  searchParams: Promise<{ id?: string; ep?: string }>;
}

export async function generateMetadata({ searchParams }: WatchPageProps): Promise<Metadata> {
  const { id } = await searchParams;
  if (!id) return { title: 'Watch Shorts - Shadow Garden' };

  const drama = await getShortDramaById(id);
  if (!drama) return { title: 'Mini-Drama - Shadow Garden' };

  return {
    title: `${drama.title} - Watch Free Vertical Drama | Shadow Garden`,
    description: drama.description || 'Watch full unlocked vertical episodes in HD.',
    openGraph: {
      title: drama.title,
      description: drama.description,
      images: [drama.cover]
    }
  };
}

export default async function ShortsWatchPage({ searchParams }: WatchPageProps) {
  const { id, ep } = await searchParams;
  const initialEp = Math.max(1, parseInt(ep || '1', 10));

  if (!id) {
    notFound();
  }

  const drama = await getShortDramaById(id);

  if (!drama) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-xl font-bold mb-2">Short Drama Not Found</h1>
        <p className="text-xs text-slate-400 mb-4">
          This vertical drama may have been removed or the ID is invalid.
        </p>
        <a 
          href="/shorts" 
          className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold"
        >
          Back to Shorts Catalog
        </a>
      </div>
    );
  }

  return (
    <main className="w-full h-screen max-h-screen bg-black text-white relative overflow-hidden">
      <WatchClientLoader drama={drama} initialEpisode={initialEp} />
    </main>
  );
}
