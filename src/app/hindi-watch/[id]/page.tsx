import { Metadata, ResolvingMetadata } from 'next';
import { hpi } from '@/lib/hpi';
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
  const searchParams = await props.searchParams;
  const id = params.id;
  const ep = searchParams?.ep ? String(searchParams.ep) : null;

  const data = await hpi.hindi.getDetails(id).catch(() => null);

  if (!data) {
    return {
      title: 'Watch Hindi Dubbed Anime Online Free HD | Kagemi',
      description: 'Stream top anime dubbed in Hindi online for free in HD on Kagemi. Enjoy high quality Hindi audio with zero buffering.',
    };
  }

  const cleanTitle = data.title || 'Hindi Anime';
  const epText = ep ? ` Episode ${ep}` : '';
  const cleanDesc = (data.synopsis || `Watch ${cleanTitle} Hindi Dubbed in High Definition.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 180)
    .trim();

  const seoTitle = `Watch ${cleanTitle}${epText} Hindi Dubbed Online Free HD`;
  const seoDesc = `Watch ${cleanTitle}${epText} in Hindi Audio online for free in 1080p Full HD on Kagemi. Stream all Hindi dubbed anime episodes with high speed servers. ${cleanDesc}...`;
  const canonicalUrl = `https://kagemi.site/hindi-watch/${encodeURIComponent(id)}${ep ? `?ep=${ep}` : ''}`;
  const posterUrl = data.image || 'https://kagemi.site/og-image.png';

  const keywords = [
    `watch ${cleanTitle} in hindi`,
    `${cleanTitle} hindi dubbed`,
    `${cleanTitle} hindi episodes`,
    `${cleanTitle} episode 1 hindi`,
    `stream ${cleanTitle} hindi`,
    'watch hindi dubbed anime free',
    'hindi anime online',
    'hindi anime download',
    'kagemi hindi'
  ];

  return {
    title: seoTitle,
    description: seoDesc,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `Watch ${cleanTitle}${epText} Hindi Dubbed - Kagemi`,
      description: seoDesc,
      url: canonicalUrl,
      siteName: 'Kagemi',
      images: [{ url: posterUrl, width: 1200, height: 630, alt: `Watch ${cleanTitle} in Hindi` }],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDesc,
      images: [posterUrl],
      creator: '@KagemiAnime',
    },
  };
}

import { redirect } from 'next/navigation';

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const ep = searchParams?.ep ? `&ep=${searchParams.ep}` : '';
  redirect(`/watch/${params.id}?audio=hi${ep}`);
}

