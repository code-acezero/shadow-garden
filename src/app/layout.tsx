import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; // Using 'sonner' as consistent with previous files
import { AuthProvider } from '@/context/AuthContext';

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        {/* PROVIDER WRAPS EVERYTHING */}
        <AuthProvider>
            {/* GLOBAL MENU (Now has access to AuthContext) */}
            <Navigation /> 
            
            {/* PAGE CONTENT */}
            <main className="min-h-screen">
                {children}
            </main>

            <Toaster position="bottom-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}