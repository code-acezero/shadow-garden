import { Metadata, ResolvingMetadata } from 'next';
import { AnimeAPI_V2 } from '@/lib/api';
import WatchClient from './WatchClient';

// FIX 1: Update type to use Promise
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props, // FIX 2: Do not destructure immediately
  parent: ResolvingMetadata
): Promise<Metadata> {
  // FIX 3: Await the params before using them
  const params = await props.params;
  const id = params.id;
  
  // Fetch minimal info for SEO
  // Added ': any' to fix the TS error you saw earlier
  const data: any = await AnimeAPI_V2.getAnimeInfo(id).catch(() => null);
  const info = data?.anime?.info;

  if (!info) {
    return {
      title: 'Watch Anime | Shadow Garden',
      description: 'Access the Shadow Garden Archives.',
    };
  }

  const cleanDesc = info.description?.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...';

  return {
    title: `Watch ${info.name} | Shadow Garden`,
    description: cleanDesc,
    openGraph: {
      title: `Watch ${info.name}`,
      description: cleanDesc,
      images: [info.poster],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Watch ${info.name}`,
      description: cleanDesc,
      images: [info.poster],
    },
  };
}

// 2. RENDER THE CLIENT COMPONENT
export default function Page() {
  return <WatchClient />;
}