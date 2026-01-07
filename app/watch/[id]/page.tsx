import React from 'react';
import { useParams } from 'react-router-dom';
import WatchClient from '@/components/Anime/Watch';

export default function WatchPage() {
  // 1. Grab the "id" from the URL using the hook
  const { id } = useParams<{ id: string }>();

  // 2. Safety check
  if (!id) {
    return <div className="text-white text-center mt-20">Error: No Anime ID provided</div>;
  }

  // 3. Pass it to your client component
  return <WatchClient animeId={id} />;
}