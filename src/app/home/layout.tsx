import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Free Anime Online HD | Trending & Popular Anime Streaming',
  description: 'Watch trending, top-rated, and newly updated anime series online for free with English subtitles and dubbing in 1080p Full HD on Shadow Garden. Zero buffering, multiple stream servers.',
  keywords: [
    'watch anime online free',
    'trending anime',
    'popular anime streaming',
    'new anime episodes free',
    'stream anime 1080p',
    'anime sub and dub online',
    'free anime site'
  ],
  alternates: {
    canonical: 'https://shadow-garden.site/home',
  },
  openGraph: {
    title: 'Watch Free Anime Online HD | Trending & Popular Anime Streaming | Shadow Garden',
    description: 'Watch trending, top-rated, and newly updated anime series online for free in 1080p Full HD. Fast stream servers, updated daily.',
    url: 'https://shadow-garden.site/home',
    siteName: 'Shadow Garden',
    type: 'website',
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
