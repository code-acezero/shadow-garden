import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation"; // Importing your old Navigation
import { Toaster } from "@/components/ui/toaster"; // Assuming you have Shadcn Toaster

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
        {/* GLOBAL MENU */}
        <Navigation /> 
        
        {/* PAGE CONTENT */}
        <main className="min-h-screen">
            {children}
        </main>

        <Toaster />
      </body>
    </html>
  );
}