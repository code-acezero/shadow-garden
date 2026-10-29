import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Hindi Dubbed Anime Online Free | Kagemi Hindi Majesty',
  description: 'Stream popular Hindi dubbed anime online for free in 1080p Full HD with dual audio, official voiceovers, and fan dubs. Fast servers, updated daily on Kagemi.',
  keywords: [
    'watch hindi dubbed anime online',
    'hindi anime streaming',
    'hindi dub anime free',
    'anime in hindi',
    'kagemi hindi',
    'hindi dubbed anime episodes',
    'latest hindi anime',
    'hindi anime movies',
    'hindi fan dub anime'
  ],
  alternates: {
    canonical: 'https://kagemi.site/hindi',
  },
  openGraph: {
    title: 'Watch Hindi Dubbed Anime Online Free | Kagemi Hindi Majesty',
    description: 'Stream popular Hindi dubbed anime online for free in 1080p Full HD with dual audio.',
    url: 'https://kagemi.site/hindi',
    siteName: 'Kagemi',
    type: 'website',
  },
};

export default function HindiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
