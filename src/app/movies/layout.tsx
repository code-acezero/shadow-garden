import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Anime Movies Online Free in HD | Sub & Dub Anime Films',
  description: 'Stream top-rated anime movies online for free in 1080p Full HD with English Subbed and Dubbed audio. Multiple high-speed servers, updated catalog on Kagemi.',
  keywords: [
    'watch anime movies online',
    'anime movies free',
    'free anime film streaming',
    'full anime movies english sub',
    'anime movies dubbed online',
    'stream anime movie 1080p',
    'top rated anime movies'
  ],
  alternates: {
    canonical: 'https://kagemi.site/movies',
  },
  openGraph: {
    title: 'Watch Anime Movies Online Free in HD | Sub & Dub Anime Films | Kagemi',
    description: 'Stream top-rated anime movies online for free in 1080p Full HD with English Subbed and Dubbed audio.',
    url: 'https://kagemi.site/movies',
    siteName: 'Kagemi',
    type: 'website',
  },
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
