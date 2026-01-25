import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; 
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from "@/hooks/useSettings";
// Import the new wrapper instead of using next/dynamic here

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        
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