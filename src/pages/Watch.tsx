import React from 'react';
import { useParams } from 'react-router-dom';
import WatchClient from '@/components/Anime/Watch';

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="text-white text-center mt-20">Error: No Anime ID provided</div>;
  }

  return <WatchClient animeId={id} />;
}