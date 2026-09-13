import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Anime Online | Find Episodes, Movies & Series in HD',
  description: 'Search over 15,000 anime series and movies on Shadow Garden. Filter by genre, year, status, and audio type (Subbed or Dubbed). Instant search with 1080p HD streaming.',
  keywords: [
    'search anime',
    'find anime episodes',
    'anime database search',
    'watch anime by genre',
    'search subbed anime',
    'search dubbed anime'
  ],
  alternates: {
    canonical: 'https://shadow-garden.site/search',
  },
  openGraph: {
    title: 'Search Anime Online | Shadow Garden',
    description: 'Search over 15,000 anime series and movies on Shadow Garden with Sub and Dub options.',
    url: 'https://shadow-garden.site/search',
    siteName: 'Shadow Garden',
    type: 'website',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
