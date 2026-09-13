import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Asian Dramas Online Free in HD | Kdrama & Cdrama Streaming',
  description: 'Stream Korean dramas, Chinese dramas, and Asian movies online for free in 1080p Full HD with English subtitles on Shadow Garden. Zero buffering, fast servers.',
  keywords: [
    'watch asian drama online',
    'kdrama streaming free',
    'cdrama english sub',
    'watch korean drama free',
    'free kdrama streaming site',
    'asian drama hd'
  ],
  alternates: {
    canonical: 'https://shadow-garden.site/drama',
  },
  openGraph: {
    title: 'Watch Asian Dramas Online Free in HD | Shadow Garden',
    description: 'Stream Korean and Chinese dramas online for free in 1080p Full HD with English subtitles.',
    url: 'https://shadow-garden.site/drama',
    siteName: 'Shadow Garden',
    type: 'website',
  },
};

export default function DramaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
