import { Metadata, ResolvingMetadata } from 'next';
import { AnimeService } from '@/lib/api';
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
  
  // Fetch anime metadata
  const data = await AnimeService.getAnimeInfo(id).catch(() => null);

  if (!data) {
    return {
      title: 'Watch Anime Online Free in HD | Shadow Garden',
      description: 'Stream popular anime online for free with English Subbed and Dubbed episodes in 1080p HD on Shadow Garden.',
    };
  }

  const epTitle = ep ? ` Episode ${ep}` : '';
  const cleanTitle = data.title || 'Anime';
  const cleanDesc = (data.description || `Watch ${cleanTitle}${epTitle} online in High Definition.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 180)
    .trim();

  const seoTitle = `Watch ${cleanTitle}${epTitle} Online Free HD (English Sub & Dub)`;
  const seoDesc = `Watch ${cleanTitle}${epTitle} online for free with English Subbed and Dubbed streams in 1080p Full HD. Stream all episodes with multiple fast servers and zero lag. ${cleanDesc}...`;

  const canonicalUrl = `https://shadow-garden.site/watch/${encodeURIComponent(id)}${ep ? `?ep=${ep}` : ''}`;
  const posterUrl = data.poster || 'https://shadow-garden.site/og-image.png';

  const keywords = [
    `watch ${cleanTitle} online`,
    `watch ${cleanTitle} free`,
    `${cleanTitle} english sub`,
    `${cleanTitle} english dub`,
    `${cleanTitle} episode 1`,
    `${cleanTitle} all episodes`,
    `stream ${cleanTitle} hd`,
    `watch ${cleanTitle} 1080p`,
    'watch anime online free',
    'free anime streaming',
    'english sub anime',
    'shadow garden anime'
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
      title: `Watch ${cleanTitle}${epTitle} (English Sub & Dub) - Shadow Garden`,
      description: seoDesc,
      url: canonicalUrl,
      siteName: 'Shadow Garden',
      images: [
        {
          url: posterUrl,
          width: 1200,
          height: 630,
          alt: `Watch ${cleanTitle} Online Free`,
        },
      ],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Watch ${cleanTitle}${epTitle} Online Free HD | Shadow Garden`,
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

  const data = await AnimeService.getAnimeInfo(id).catch(() => null);

  const cleanTitle = data?.title || 'Anime';
  const cleanDesc = (data?.description || `Watch ${cleanTitle} online in HD on Shadow Garden.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 250);
  const posterUrl = data?.poster || 'https://shadow-garden.site/og-image.png';
  const pageUrl = `https://shadow-garden.site/watch/${encodeURIComponent(id)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ((data as any)?.type === 'movie' || (data as any)?.stats?.type?.toLowerCase() === 'movie') ? "Movie" : "TVSeries",
        "name": cleanTitle,
        "url": pageUrl,
        "image": posterUrl,
        "description": cleanDesc,
        "inLanguage": ["ja", "en"],
        "potentialAction": {
          "@type": "WatchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": pageUrl,
            "inLanguage": "en",
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          }
        }
      },
      {
        "@type": "VideoObject",
        "name": `Watch ${cleanTitle}${ep ? ` Episode ${ep}` : ''} Online Free HD`,
        "description": `Stream ${cleanTitle} in HD with English subtitles and dubbing on Shadow Garden.`,
        "thumbnailUrl": [posterUrl],
        "uploadDate": new Date().toISOString(),
        "contentUrl": pageUrl,
        "embedUrl": pageUrl
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://shadow-garden.site/home"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Anime",
            "item": "https://shadow-garden.site/anime"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": cleanTitle,
            "item": pageUrl
          }
        ]
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