import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime Release Schedule & Broadcast Calendar | Airing Today',
  description: 'Track weekly anime release schedules, broadcast airtimes, and countdowns for new episodes airing today in Japan and streaming worldwide on Shadow Garden.',
  keywords: [
    'anime release schedule',
    'anime schedule today',
    'anime broadcast calendar',
    'when does new anime air',
    'anime countdown schedule',
    'weekly anime releases'
  ],
  alternates: {
    canonical: 'https://shadow-garden.site/schedule',
  },
  openGraph: {
    title: 'Anime Release Schedule & Broadcast Calendar | Shadow Garden',
    description: 'Track weekly anime release schedules, broadcast airtimes, and countdowns for new episodes airing today.',
    url: 'https://shadow-garden.site/schedule',
    siteName: 'Shadow Garden',
    type: 'website',
  },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
