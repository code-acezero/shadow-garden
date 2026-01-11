import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; 
import { AuthProvider } from '@/context/AuthContext';
import WhisperIsland from "@/components/UIx/WhisperIsland";
import { SettingsProvider } from "@/hooks/useSettings"; // <--- IMPORT THIS

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shadow Garden",
  description: "Ultimate Anime Streaming Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" className="dark" suppressHydrationWarning={true}>
        <body className={`${inter.className} bg-background text-foreground`}>
        
        {/* 1. SETTINGS PROVIDER MUST BE AT THE TOP */}
        <SettingsProvider>
            
            {/* 2. AUTH PROVIDER WRAPS CONTENT */}
            <AuthProvider>
            
                {/* 3. WHISPER ISLAND (Needs access to both Settings and Auth) */}
                <WhisperIsland />
                
                {/* GLOBAL MENU */}
                <Navigation /> 
                
                {/* PAGE CONTENT */}
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