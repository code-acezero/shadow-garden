import { Metadata } from 'next';
import LandingClient from '@/components/Landing/LandingClient'; // ✅ Moved to components folder

// --- SERVER SIDE METADATA ---
export const metadata: Metadata = {
  title: 'Shadow Garden | The Ultimate Sanctuary',
  description: 'Enter the Shadow Garden. Access over 15,000 anime series in the forbidden library. The ultimate sanctuary for the awakened.',
  openGraph: {
    title: 'Shadow Garden | The Ultimate Sanctuary',
    description: 'Join the guild. Access the archives. Become legend.',
    images: ['/images/index/bg-1.jpg'], // Make sure this image exists in public/images/index/
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shadow Garden | The Ultimate Sanctuary',
    description: 'Join the guild. Access the archives. Become legend.',
    images: ['/images/index/bg-1.jpg'],
  }
};

export default function Page() {
  return <LandingClient />;
}