import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Donghua Online Free with English Subtitles | Chinese Anime Streaming',
  description: 'Stream the best Chinese anime (Donghua) online for free in 1080p Full HD with English subtitles. Fast servers, zero lag, updated daily on Kagemi.',
  keywords: [
    'watch donghua online',
    'chinese anime streaming',
    'watch donghua english sub',
    'donghua free hd',
    'chinese anime online',
    'top donghua episodes',
    'donghua streaming site'
  ],
  alternates: {
    canonical: 'https://kagemi.site/donghua',
  },
  openGraph: {
    title: 'Watch Donghua Online Free with English Subtitles | Kagemi',
    description: 'Stream top Chinese anime (Donghua) online for free in 1080p Full HD with English subtitles.',
    url: 'https://kagemi.site/donghua',
    siteName: 'Kagemi',
    type: 'website',
  },
};

export default function DonghuaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
