import { Metadata, ResolvingMetadata } from 'next';
import { AnimeService } from '@/lib/api';
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
  const data = await AnimeService.getAnimeInfo(id).catch(() => null);

  if (!data) {
    return {
      title: 'Watch Anime | Shadow Garden',
      description: 'Access the Shadow Garden Archives.',
    };
  }

  const cleanDesc = data.description?.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...';

  return {
    title: `Watch ${data.title} | Shadow Garden`,
    description: cleanDesc,
    openGraph: {
      title: `Watch ${data.title}`,
      description: cleanDesc,
      images: [data.poster],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Watch ${data.title}`,
      description: cleanDesc,
      images: [data.poster],
    },
  };
}

// 2. RENDER THE CLIENT COMPONENT
export default function Page() {
  return <WatchClient />;
}