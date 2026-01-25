import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; 
import { Toaster } from 'sonner'; 
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from "@/hooks/useSettings";
// Import the new wrapper instead of using next/dynamic here
import { 
  badUnicorn, demoness, horrorshow, hunters, 
  kareudon, monas, nyctophobia, onePiece 
} from '@/lib/fonts';

 

  
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
   const fontVariables = [
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