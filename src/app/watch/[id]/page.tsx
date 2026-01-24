import { Metadata, ResolvingMetadata } from 'next';
import { AnimeAPI_V2 } from '@/lib/api'; // Ensure this path matches your api import
import WatchClient from './WatchClient'; // Imports your renamed file

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// 1. GENERATE DYNAMIC METADATA (Server-Side)
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  
  // Fetch minimal info for SEO
  const data: any = await AnimeAPI_V2.getAnimeInfo(id).catch(() => null);
  const info = data?.anime?.info;

  if (!info) {
    return {
      title: 'Watch Anime | Shadow Garden',
      description: 'Access the Shadow Garden Archives.',
    };
  }

  // Clean description for SEO (remove HTML tags if any)
  const cleanDesc = info.description?.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...';

  return {
    title: `Watch ${info.name} | Shadow Garden`,
    description: cleanDesc,
    openGraph: {
      title: `Watch ${info.name}`,
      description: cleanDesc,
      images: [info.poster], // Shows the anime poster on Discord/Twitter
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