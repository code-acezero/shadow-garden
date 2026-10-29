import { Metadata, ResolvingMetadata } from 'next';
import { AnimeService } from '@/lib/api';
import { slugifyTitle } from '@/lib/utils';
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
  const rawId = params.id;
  const cleanId = rawId ? (rawId.match(/^(\d+)/)?.[1] || rawId) : '';
  const ep = searchParams?.ep ? String(searchParams.ep) : null;
  
  // Fetch anime metadata
  const data = await AnimeService.getAnimeInfo(cleanId || rawId).catch(() => null);

  if (!data) {
    return {
      title: 'Watch Anime Online Free in HD | Kagemi',
      description: 'Stream popular anime online for free with English Subbed and Dubbed episodes in 1080p HD on Kagemi.',
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

  const slug = slugifyTitle(cleanTitle);
  const canonicalId = slug ? `${data.id}-${slug}` : String(data.id);
  const canonicalUrl = `https://kagemi.site/watch/${encodeURIComponent(canonicalId)}${ep ? `?ep=${ep}` : ''}`;
  const posterUrl = data.poster || 'https://kagemi.site/og-image.png';

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
    'kagemi anime'
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
      title: `Watch ${cleanTitle}${epTitle} (English Sub & Dub) - Kagemi`,
      description: seoDesc,
      url: canonicalUrl,
      siteName: 'Kagemi',
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
      title: `Watch ${cleanTitle}${epTitle} Online Free HD | Kagemi`,
      description: seoDesc,
      images: [posterUrl],
      creator: '@KagemiAnime',
    },
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const rawId = params.id;
  const cleanId = rawId ? (rawId.match(/^(\d+)/)?.[1] || rawId) : '';
  const ep = searchParams?.ep ? String(searchParams.ep) : null;

  const data = await AnimeService.getAnimeInfo(cleanId || rawId).catch(() => null);

  const cleanTitle = data?.title || 'Anime';
  const cleanDesc = (data?.description || `Watch ${cleanTitle} online in HD on Kagemi.`)
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 250);
  const posterUrl = data?.poster || 'https://kagemi.site/og-image.png';
  const slug = slugifyTitle(cleanTitle);
  const canonicalId = slug ? `${data?.id || cleanId}-${slug}` : String(data?.id || cleanId);
  const pageUrl = `https://kagemi.site/watch/${encodeURIComponent(canonicalId)}`;

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
        "description": `Stream ${cleanTitle} in HD with English subtitles and dubbing on Kagemi.`,
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
      <WatchClient initialAnime={data} />
    </>
  );
}