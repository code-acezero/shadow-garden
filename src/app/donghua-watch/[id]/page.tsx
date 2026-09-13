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
  const searchParams = await props.searchParams;
  const id = params.id;
  const ep = searchParams?.ep ? String(searchParams.ep) : null;

  const data = await dpi.getInfo(id).catch(() => null);

  if (!data) {
    return {
      title: 'Watch Chinese Donghua Online Free HD | Shadow Garden',
      description: 'Stream popular Chinese anime (Donghua) with English subtitles in 1080p HD on Shadow Garden.',
    };
  }

  const cleanTitle = data.detail.title || 'Donghua';
  const epText = ep ? ` Episode ${ep}` : '';
  const cleanDesc = (data.detail.synopsis || `Watch ${cleanTitle} Chinese anime online.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 180)
    .trim();

  const seoTitle = `Watch ${cleanTitle}${epText} (Chinese Donghua) English Sub Online Free HD`;
  const seoDesc = `Watch ${cleanTitle}${epText} Chinese Donghua online for free with English Subtitles in 1080p HD on Shadow Garden. Stream all episodes with multiple fast servers. ${cleanDesc}...`;
  const canonicalUrl = `https://shadow-garden.site/donghua-watch/${encodeURIComponent(id)}${ep ? `?ep=${ep}` : ''}`;
  const posterUrl = data.detail.image || 'https://shadow-garden.site/og-image.png';

  const keywords = [
    `watch ${cleanTitle} online`,
    `${cleanTitle} english sub`,
    `${cleanTitle} donghua`,
    `${cleanTitle} chinese anime`,
    `${cleanTitle} episode 1 english sub`,
    `stream ${cleanTitle} hd`,
    'watch donghua free online',
    'chinese anime with english sub',
    'shadow garden donghua'
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
      title: `Watch ${cleanTitle}${epText} English Sub (Donghua) - Shadow Garden`,
      description: seoDesc,
      url: canonicalUrl,
      siteName: 'Shadow Garden',
      images: [{ url: posterUrl, width: 1200, height: 630, alt: `Watch ${cleanTitle} Donghua` }],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDesc,
      images: [posterUrl],
      creator: '@ShadowGarden',
    },
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const id = params.id;
  const ep = searchParams?.ep ? String(searchParams.ep) : null;

  const data = await dpi.getInfo(id).catch(() => null);
  const cleanTitle = data?.detail?.title || 'Donghua';
  const cleanDesc = (data?.detail?.synopsis || `Watch ${cleanTitle} on Shadow Garden.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 250);
  const posterUrl = data?.detail?.image || 'https://shadow-garden.site/og-image.png';
  const pageUrl = `https://shadow-garden.site/donghua-watch/${encodeURIComponent(id)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TVSeries",
        "name": `${cleanTitle} (Chinese Donghua)`,
        "url": pageUrl,
        "image": posterUrl,
        "description": cleanDesc,
        "inLanguage": ["zh", "en"],
        "potentialAction": {
          "@type": "WatchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": pageUrl,
            "inLanguage": "en"
          }
        }
      },
      {
        "@type": "VideoObject",
        "name": `Watch ${cleanTitle}${ep ? ` Episode ${ep}` : ''} English Sub`,
        "description": `Stream ${cleanTitle} Chinese Donghua online free with English subtitles on Shadow Garden.`,
        "thumbnailUrl": [posterUrl],
        "uploadDate": new Date().toISOString(),
        "contentUrl": pageUrl,
        "embedUrl": pageUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WatchClient />
    </>
  );
}

