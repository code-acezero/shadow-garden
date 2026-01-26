import type { Metadata } from "next";
import PageTransition from "@/components/Transitions/PageTransition";
import ClientOnly from "@/components/ClientOnly";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; 
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from "@/hooks/useSettings";
import { 
  badUnicorn, demoness, horrorshow, hunters, 
  kareudon, monas, nyctophobia, onePiece 
} from '@/lib/fonts';

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Shadow Garden",
  description: "Ultimate Anime Streaming Experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <html lang="en" className={`dark ${fontVariables}`} suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[#050505] text-foreground antialiased`}
        suppressHydrationWarning
      >
        <SettingsProvider>
          <AuthProvider>

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
