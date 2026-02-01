import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/Transitions/PageTransition";
import ClientOnly from "@/components/ClientOnly";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; 
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from "@/hooks/useSettings";
import CustomLoader from "@/components/UIx/CustomLoader"; 
// import VoiceInitializer from "@/components/Layout/VoiceInitializer"; // 🛑 REMOVED: Conflicting with WhisperIsland

import { 
  badUnicorn, demoness, horrorshow, hunters, 
  kareudon, monas, nyctophobia, onePiece 
} from '@/lib/fonts';

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shadow-garden.site'),
  title: {
    default: "Shadow Garden Guild | The Ultimate Anime Streaming Platform",
    template: "%s | Shadow Garden Guild"
  },
  description: "Enter the Shadow Garden Guild. Watch ad-free anime in 1080p with English Sub & Dub.",
  applicationName: "Shadow Garden Guild",
  authors: [{ name: "Shadow Garden", url: "https://shadow-garden.site" }],
  generator: "Next.js",
  keywords: ["Shadow Garden Guild", "Anime", "Streaming", "Free"],
  referrer: "origin-when-cross-origin",
  creator: "Shadow Garden Team",
  publisher: "Shadow Garden",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://shadow-garden.site" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shadow-garden.site",
    siteName: "Shadow Garden Guild",
    title: "Shadow Garden | Watch Free Anime Online (No Ads)",
    description: "The ultimate platform for the awakened.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Shadow Garden Guild" }],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = [
    inter.variable, badUnicorn.variable, demoness.variable, 
    horrorshow.variable, hunters.variable, kareudon.variable, 
    monas.variable, nyctophobia.variable, onePiece.variable
  ].join(' ');

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Shadow Garden Guild",
        "url": "https://shadow-garden.site",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://shadow-garden.site/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "description": "The Ultimate Anime Streaming Platform from Another World."
      },
      {
        "@type": "Organization",
        "name": "Shadow Garden",
        "url": "https://shadow-garden.site",
        "logo": "https://shadow-garden.site/icon.svg"
      }
    ]
  };

  return (
    <html lang="en" className={`dark ${fontVariables}`} suppressHydrationWarning>
      <body className={`${inter.className} bg-[#050505] text-foreground antialiased`} suppressHydrationWarning>
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <CustomLoader />

        <SettingsProvider>
          <AuthProvider>
            
            {/* 🛑 DISABLED: WhisperIsland now handles all voice greetings. 
                Having this active caused double audio triggers. */}
            {/* <VoiceInitializer /> */}

            <ClientOnly>
              <Navigation />
            </ClientOnly>

            <main className="min-h-screen overflow-hidden">
              <PageTransition>
                {children}
              </PageTransition>
            </main>

            <Toaster position="bottom-right" theme="dark" />
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}