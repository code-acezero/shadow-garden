import WatchClient from './WatchClient';
import { omni } from '@/lib/omni';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await omni.movies.getDetail(id);
  if (!data) return { title: 'Not Found | Shadow Garden' };
  return {
    title: `Watch ${data.title} | Shadow Garden`,
    description: data.description || 'Watch movies and series online on Shadow Garden.',
    openGraph: {
      images: [data.image],
    },
  };
}

export default function Page() {
  return <WatchClient />;
}
