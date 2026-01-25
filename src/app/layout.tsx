import type { Metadata } from "next";
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

// ✅ FIX: Added 'variable' to the Inter configuration
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter', // This enables the .variable property
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Shadow Garden",
  description: "Ultimate Anime Streaming Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ Mapping variables from your Armory
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
            <Navigation /> 
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster position="bottom-right" theme="dark" />
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}