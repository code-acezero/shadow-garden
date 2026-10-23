import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Hindi Dubbed Anime Online Free | Shadow Garden Hindi Majesty',
  description: 'Stream popular Hindi dubbed anime online for free in 1080p Full HD with dual audio, official voiceovers, and fan dubs. Fast servers, updated daily on Shadow Garden.',
  keywords: [
    'watch hindi dubbed anime online',
    'hindi anime streaming',
    'hindi dub anime free',
    'anime in hindi',
    'shadow garden hindi',
    'hindi dubbed anime episodes',
    'latest hindi anime',
    'hindi anime movies',
    'hindi fan dub anime'
  ],
  alternates: {
    canonical: 'https://shadow-garden.site/hindi',
  },
  openGraph: {
    title: 'Watch Hindi Dubbed Anime Online Free | Shadow Garden Hindi Majesty',
    description: 'Stream popular Hindi dubbed anime online for free in 1080p Full HD with dual audio.',
    url: 'https://shadow-garden.site/hindi',
    siteName: 'Shadow Garden',
    type: 'website',
  },
};

export default function HindiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
