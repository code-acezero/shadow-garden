import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/Transitions/PageTransition";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; 
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from "@/hooks/useSettings";
import CustomLoader from "@/components/UIx/CustomLoader"; 
import { createClient } from "@supabase/supabase-js"; 
import { SITE_CONFIG } from '@/lib/site-config'; 
import WelcomeModal from "@/components/UIx/WelcomeModal";

// Import fonts from your library (Optimized: These are just variable definitions now)
import { 
  badUnicorn, demoness, horrorshow, hunters, 
  kareudon, monas, nyctophobia, onePiece 
} from '@/lib/fonts';

// Keep Inter preloaded as the default UI font for speed
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap', 
});

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// --- DYNAMIC SEO FETCHING ---
export async function generateMetadata(): Promise<Metadata> {
  const config: Record<string, string> = {
    site_name: SITE_CONFIG.name,
    seo_title: SITE_CONFIG.title,
    seo_desc: SITE_CONFIG.description,
    seo_keywords: SITE_CONFIG.keywords
  };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data, error } = await supabase.from('site_config').select('*');
        if (data && !error) {
            data.forEach(item => {
                if (item.value?.trim()) config[item.key] = item.value;
            });
        }
    }
  } catch (e) {
      console.warn("⚠️ SEO Fetch Failed, using shared defaults:", e);
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shadow-garden.site'),
    title: {
      default: config.seo_title,
      template: `%s | ${config.site_name}`
    },
    description: config.seo_desc,
    applicationName: config.site_name,
    authors: [{ name: "Shadow Garden", url: "https://shadow-garden.site" }],
    generator: "Next.js",
    keywords: config.seo_keywords.split(',').map(k => k.trim()),
    referrer: "origin-when-cross-origin",
    creator: "Shadow Garden Team",
    publisher: "Shadow Garden",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: "https://shadow-garden.site",
      languages: {
        'id-ID': 'https://shadow-garden.site/id',
        'ja-JP': 'https://shadow-garden.site/jp',
        'hi-IN': 'https://shadow-garden.site/in',
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: SITE_CONFIG.locales, 
      url: "https://shadow-garden.site",
      siteName: config.site_name,
      title: config.seo_title,
      description: config.seo_desc,
      images: [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630, alt: config.site_name }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.seo_title,
      description: config.seo_desc,
      images: [SITE_CONFIG.ogImage],
      creator: "@ShadowGarden",
    },
    icons: {
      icon: "/icon.svg",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Combine all font variable definitions
  // Since we set preload: false in fonts.ts, this barely adds any size to the initial load
  const fontVariables = [
    inter.variable, 
    badUnicorn.variable, 
    demoness.variable, 
    horrorshow.variable, 
    hunters.variable, 
    kareudon.variable, 
    monas.variable, 
    nyctophobia.variable, 
    onePiece.variable
  ].join(' ');

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": SITE_CONFIG.name,
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
        "logo": "https://shadow-garden.site/icon.svg",
        "sameAs": [
          "https://twitter.com/shadowgarden",
          "https://discord.gg/shadowgarden"
        ]
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Guild Navigation",
        "hasPart": SITE_CONFIG.navigation.map(nav => ({
            "@type": "WebPage",
            "name": nav.name,
            "url": nav.url,
            ...(nav.description && { "description": nav.description })
        }))
      }
    ]
  };

  return (
    <html lang="en" className={`dark ${fontVariables}`} suppressHydrationWarning>
      <body className={`font-sans bg-[#050505] text-foreground antialiased selection:bg-primary-900/30 selection:text-primary-50`} suppressHydrationWarning>
        
        {/* JSON-LD Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Global Loading Overlay */}
        <CustomLoader />

        {/* The Gatekeeper: Ensures Audio Autoplay via Interaction */}
        <WelcomeModal />

        {/* AuthProvider must wrap SettingsProvider so settings can access user ID */}
        <AuthProvider>
          <SettingsProvider>
            <Navigation />

            <main className="min-h-screen relative overflow-hidden">
              <PageTransition>
                {children}
              </PageTransition>
            </main>

            <Toaster position="bottom-right" theme="dark" />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}