// app/watch/[id]/page.tsx
import WatchClient from '@/components/Anime/Watch';

export default function Page({ params }: { params: { id: string } }) {
  return <WatchClient animeId={params.id} />;
}