import { Metadata } from 'next';
import MangaHomeClient from '@/components/Manga/MangaHomeClient';

export const metadata: Metadata = {
  title: 'Mangvels - Read Manga, Manhwa, Comics & Light Novels Online | Kagemi',
  description: 'Read the latest Manga, Manhwa, Webtoons, Light Novels, Web Novels, and Comics online for free with English, Hindi, and Bengali support on Kagemi Mangvels.',
  keywords: [
    'mangvels',
    'read manga online',
    'read manhwa online',
    'read webtoons free',
    'read light novels online',
    'manga in hindi',
    'manga in bengali',
    'light novels in hindi',
    'light novels in bengali'
  ],
  openGraph: {
    title: 'Kagemi Mangvels - Manga, Comics & Light Novels Archive',
    description: 'Read Manga, Manhwa, Webtoons, Light Novels & Comics in English, Hindi & Bengali.'
  }
};

export default function MangaPage() {
  return <MangaHomeClient />;
}
