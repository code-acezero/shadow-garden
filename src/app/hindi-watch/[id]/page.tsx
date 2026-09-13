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
      title: 'Watch Hindi Dubbed Anime Online Free HD | Shadow Garden',
      description: 'Stream top anime dubbed in Hindi online for free in HD on Shadow Garden. Enjoy high quality Hindi audio with zero buffering.',
    };
  }

  const cleanTitle = data.title || 'Hindi Anime';
  const epText = ep ? ` Episode ${ep}` : '';
  const cleanDesc = (data.synopsis || `Watch ${cleanTitle} Hindi Dubbed in High Definition.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 180)
    .trim();

  const seoTitle = `Watch ${cleanTitle}${epText} Hindi Dubbed Online Free HD`;
  const seoDesc = `Watch ${cleanTitle}${epText} in Hindi Audio online for free in 1080p Full HD on Shadow Garden. Stream all Hindi dubbed anime episodes with high speed servers. ${cleanDesc}...`;
  const canonicalUrl = `https://shadow-garden.site/hindi-watch/${encodeURIComponent(id)}${ep ? `?ep=${ep}` : ''}`;
  const posterUrl = data.image || 'https://shadow-garden.site/og-image.png';

  const keywords = [
    `watch ${cleanTitle} in hindi`,
    `${cleanTitle} hindi dubbed`,
    `${cleanTitle} hindi episodes`,
    `${cleanTitle} episode 1 hindi`,
    `stream ${cleanTitle} hindi`,
    'watch hindi dubbed anime free',
    'hindi anime online',
    'hindi anime download',
    'shadow garden hindi'
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
      title: `Watch ${cleanTitle}${epText} Hindi Dubbed - Shadow Garden`,
      description: seoDesc,
      url: canonicalUrl,
      siteName: 'Shadow Garden',
      images: [{ url: posterUrl, width: 1200, height: 630, alt: `Watch ${cleanTitle} in Hindi` }],
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

  const data = await hpi.hindi.getDetails(id).catch(() => null);
  const cleanTitle = data?.title || 'Hindi Anime';
  const cleanDesc = (data?.synopsis || `Watch ${cleanTitle} Hindi Dubbed on Shadow Garden.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 250);
  const posterUrl = data?.image || 'https://shadow-garden.site/og-image.png';
  const pageUrl = `https://shadow-garden.site/hindi-watch/${encodeURIComponent(id)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TVSeries",
        "name": `${cleanTitle} (Hindi Dubbed)`,
        "url": pageUrl,
        "image": posterUrl,
        "description": cleanDesc,
        "inLanguage": ["hi", "en"],
        "potentialAction": {
          "@type": "WatchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": pageUrl,
            "inLanguage": "hi"
          }
        }
      },
      {
        "@type": "VideoObject",
        "name": `Watch ${cleanTitle}${ep ? ` Episode ${ep}` : ''} Hindi Dubbed`,
        "description": `Stream ${cleanTitle} in Hindi audio online free on Shadow Garden.`,
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

