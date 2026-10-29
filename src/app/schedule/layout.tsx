import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime Release Schedule & Broadcast Calendar | Airing Today',
  description: 'Track weekly anime release schedules, broadcast airtimes, and countdowns for new episodes airing today in Japan and streaming worldwide on Kagemi.',
  keywords: [
    'anime release schedule',
    'anime schedule today',
    'anime broadcast calendar',
    'when does new anime air',
    'anime countdown schedule',
    'weekly anime releases'
  ],
  alternates: {
    canonical: 'https://kagemi.site/schedule',
  },
  openGraph: {
    title: 'Anime Release Schedule & Broadcast Calendar | Kagemi',
    description: 'Track weekly anime release schedules, broadcast airtimes, and countdowns for new episodes airing today.',
    url: 'https://kagemi.site/schedule',
    siteName: 'Kagemi',
    type: 'website',
  },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
