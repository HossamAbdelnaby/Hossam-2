import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/layout/navigation";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clash of Clans Tournament & Player Services Platform",
  description: "Professional platform for organizing Clash of Clans tournaments and providing player-related services",
  keywords: ["Clash of Clans", "Tournaments", "Player Services", "Gaming", "CWL"],
  authors: [{ name: "Clash Tournaments Team" }],
  openGraph: {
    title: "Clash of Clans Tournament Platform",
    description: "Organize tournaments and find players for your Clash of Clans clan",
    url: "https://clashtournaments.com",
    siteName: "Clash Tournaments",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clash of Clans Tournament Platform",
    description: "Organize tournaments and find players for your Clash of Clans clan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
