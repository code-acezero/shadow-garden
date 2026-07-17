import { Metadata, ResolvingMetadata } from 'next';
import { dpi } from '@/lib/dpi';
import WatchClient from './WatchClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;

  const data = await dpi.getInfo(id).catch(() => null);

  if (!data) {
    return {
      title: 'Watch Donghua | Shadow Garden',
      description: 'Access the Shadow Garden Archives.',
    };
  }

  const cleanDesc = data.detail.synopsis?.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...';

  return {
    title: `Watch ${data.detail.title} | Shadow Garden`,
    description: cleanDesc,
    openGraph: {
      title: `Watch ${data.detail.title}`,
      description: cleanDesc,
      images: [data.detail.image],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Watch ${data.detail.title}`,
      description: cleanDesc,
      images: [data.detail.image],
    },
  };
}

export default function Page() {
  return <WatchClient />;
}
