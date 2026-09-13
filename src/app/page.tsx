import { Metadata } from 'next';
import LandingClient from '@/components/Landing/LandingClient'; 
import LandingErrorBoundary from '@/components/Landing/LandingErrorBoundary';

// Force dynamic rendering so Vercel never serves stale prerendered HTML
// across deployments (prevents chunk hash mismatch / ChunkLoadError 404s)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- HIGH-INTENT ANIME STREAMING METADATA ---
export const metadata: Metadata = {
  title: 'Watch Anime Online Free in HD | English Sub & Dub Streaming',
  description: 'Stream over 15,000+ anime series and movies online for free in 1080p Full HD with English Subbed and Dubbed options. Zero lag, multiple high-speed servers, updated daily on Shadow Garden.',
  keywords: [
    'watch anime online free',
    'anime streaming site',
    'free anime streaming',
    'watch anime sub and dub',
    'anime online english subbed',
    'stream anime hd 1080p',
    'best anime streaming sites',
    'watch anime free',
    'latest anime episodes',
    'english dub anime online',
    'anime subbed free',
    'shadow garden anime',
    'watch anime without ads free'
  ],
  alternates: {
    canonical: 'https://shadow-garden.site',
  },
  openGraph: {
    title: 'Watch Anime Online Free in HD | English Sub & Dub Streaming | Shadow Garden',
    description: 'Stream over 15,000+ anime series and movies online for free in 1080p Full HD. Fast servers, zero lag, updated daily.',
    url: 'https://shadow-garden.site',
    siteName: 'Shadow Garden',
    images: [{
      url: '/images/index/bg-1.jpg',
      width: 1200,
      height: 630,
      alt: 'Shadow Garden - Watch Anime Online Free in HD'
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watch Anime Online Free in HD | English Sub & Dub Streaming | Shadow Garden',
    description: 'Stream 15,000+ anime series and movies online for free in 1080p Full HD with English Subbed and Dubbed options.',
    images: ['/images/index/bg-1.jpg'],
  }
};

export default function Page() {
  return (
    <LandingErrorBoundary>
      <LandingClient />
    </LandingErrorBoundary>
  );
}