import { Suspense } from "react";
import { Metadata, Viewport } from "next";
import PageTransition from "@/components/Transitions/PageTransition";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from "@/hooks/useSettings";
import CustomLoader from "@/components/UIx/CustomLoader"; 
import NavigationLoader from "@/components/UIx/NavigationLoader"; 
import { createClient } from "@supabase/supabase-js"; 
import { SITE_CONFIG } from '@/lib/site-config'; 
import WelcomeModal from "@/components/UIx/WelcomeModal";
import { UserDataProvider } from '@/context/UserDataContext';
import AlphaWidget from '@/components/AI/AlphaWidget';
import GuildBoardPopupRenderer from '@/components/UIx/GuildBoardPopupRenderer';
import AnalyticsTracker from '@/components/Analytics/AnalyticsTracker';
import AdScriptInjector from '@/components/Ads/AdScriptInjector';
import PWAInstaller from '@/components/PWA/PWAInstaller';
import ChunkErrorRecovery from '@/components/Utils/ChunkErrorRecovery';
import { ATELIER_GLOBAL_DEFS_SVG, ATELIER_GLOBAL_CSS } from '@/lib/atelierFrames';

// Import fonts from your library (Optimized: These are just variable definitions now)
import { 
  poppins, lemonMilk, gradvis, above, minomu 
} from '@/lib/fonts';

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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kagemi.site'),
    title: {
      default: config.seo_title,
      template: `%s | ${config.site_name}`
    },
    description: config.seo_desc,
    applicationName: config.site_name,
    authors: [{ name: "Kagemi", url: "https://kagemi.site" }],
    generator: "Next.js",
    keywords: config.seo_keywords.split(',').map(k => k.trim()),
    referrer: "origin-when-cross-origin",
    creator: "Kagemi Team",
    publisher: "Kagemi",
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
      canonical: "https://kagemi.site",
      languages: {
        'id-ID': 'https://kagemi.site/id',
        'ja-JP': 'https://kagemi.site/jp',
        'hi-IN': 'https://kagemi.site/in',
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: SITE_CONFIG.locales, 
      url: "https://kagemi.site",
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
      creator: "@KagemiAnime",
    },
    icons: {
      icon: "/icon.svg",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: config.site_name,
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
    poppins.variable,
    lemonMilk.variable,
    gradvis.variable,
    above.variable,
    minomu.variable
  ].join(' ');

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": SITE_CONFIG.name,
        "url": "https://kagemi.site",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://kagemi.site/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "description": "The Ultimate Anime Streaming Platform from Another World."
      },
      {
        "@type": "Organization",
        "name": "Kagemi",
        "url": "https://kagemi.site",
        "logo": "https://kagemi.site/icon.svg",
        "sameAs": [
          "https://twitter.com/kagemianime",
          "https://discord.gg/kagemi"
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Service worker cache cleanup
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(k) {
                        if (k.indexOf('v6') === -1) {
                          caches.delete(k);
                        }
                      });
                    });
                  }
                  // 2. Global Unified Theme Pre-Hydration
                  var themeId = localStorage.getItem('shadow_color_palette') || 'sky-purple-violet';
                  var themeMode = localStorage.getItem('shadow_theme_mode') || 'dark';
                  var root = document.documentElement;
                  if (themeMode === 'light') {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  } else {
                    root.classList.remove('light');
                    root.classList.add('dark');
                  }
                  // Apply default Sky Purple Violet tokens immediately
                  if (themeId === 'sky-purple-violet') {
                    if (themeMode === 'light') {
                      root.style.setProperty('--bg-surface', '#f8f7ff');
                      root.style.setProperty('--card-surface', '#ffffff');
                      root.style.setProperty('--elevated-surface', '#ede9fe');
                      root.style.setProperty('--border-highlight', '#ddd6fe');
                      root.style.setProperty('--primary-accent', '#7c3aed');
                      root.style.setProperty('--secondary-accent', '#0284c7');
                      root.style.setProperty('--primary-color', '#7c3aed');
                      root.style.setProperty('--primary-500', '#7c3aed');
                      root.style.setProperty('--primary-600', '#6d28d9');
                    } else {
                      root.style.setProperty('--bg-surface', '#070512');
                      root.style.setProperty('--card-surface', '#0f0b24');
                      root.style.setProperty('--elevated-surface', '#1a133b');
                      root.style.setProperty('--border-highlight', '#2e2163');
                      root.style.setProperty('--primary-accent', '#8b5cf6');
                      root.style.setProperty('--secondary-accent', '#38bdf8');
                      root.style.setProperty('--primary-color', '#8b5cf6');
                      root.style.setProperty('--primary-500', '#8b5cf6');
                      root.style.setProperty('--primary-600', '#7c3aed');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
              <style id="atelier-global-styles" dangerouslySetInnerHTML={{ __html: ATELIER_GLOBAL_CSS }} />
      </head>
      <body className={`font-sans bg-[#050505] text-foreground antialiased selection:bg-primary-900/30 selection:text-primary-50`} suppressHydrationWarning>
        {/* Global Frame Symbols & Defs */}
        <div id="atelier-global-defs" aria-hidden="true" className="contents" dangerouslySetInnerHTML={{ __html: ATELIER_GLOBAL_DEFS_SVG }} />
        
        {/* JSON-LD Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        
        {/* PWA Service Worker & Install Prompt */}
        <PWAInstaller />

        {/* Automatic ChunkLoadError Self-Healing */}
        <ChunkErrorRecovery />

        {/* Global Navigation Loader */}
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>

        {/* Global Loading Overlay */}
        <CustomLoader />

        {/* The Gatekeeper: Ensures Audio Autoplay via Interaction */}
        <WelcomeModal />

        {/* AuthProvider must wrap SettingsProvider so settings can access user ID */}
        <AuthProvider>
          <UserDataProvider>
            <SettingsProvider>
              <AnalyticsTracker />
              <AdScriptInjector />

              <main className="min-h-screen relative overflow-clip w-full">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>

              <Navigation />
              <AlphaWidget />
              <GuildBoardPopupRenderer />
            </SettingsProvider>
          </UserDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}