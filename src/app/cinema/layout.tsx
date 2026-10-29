import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Movies & Asian Dramas in HD | Cinema, Series & Kdrama Streaming',
  description: 'Stream the latest blockbuster cinema movies, Hollywood, Bollywood, Korean dramas, Chinese dramas, and web series online for free in 1080p Full HD with multi-language and Hindi audio on Kagemi.',
  keywords: [
    'watch cinema online',
    'stream free movies hd',
    'watch asian drama online',
    'kdrama streaming free',
    'hindi dubbed movies and dramas',
    'hollywood blockbusters free',
    'bollywood movies online',
    'kagemi cinema'
  ],
  alternates: {
    canonical: 'https://kagemi.site/cinema',
  },
  openGraph: {
    title: 'Watch Movies & Asian Dramas in HD | Kagemi Cinema',
    description: 'Stream the latest blockbuster movies, Asian dramas, and web series in 1080p Full HD with multi-audio support.',
    url: 'https://kagemi.site/cinema',
    siteName: 'Kagemi',
    type: 'website',
  },
};

export default function CinemaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
