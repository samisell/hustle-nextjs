import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ThemeProvider from "@/components/shared/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hustle University",
  description: "Hustle University platform for learning, investing, community collaboration, and wallet-powered growth.",
  keywords: ["Hustle University", "Learning", "Investments", "Referrals", "Community", "Next.js", "Prisma"],
  authors: [{ name: "Hustle University Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Hustle University",
    description: "Learn, invest, and grow your network with Hustle University.",
    url: "https://hustleuniversity.app",
    siteName: "Hustle University",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hustle University",
    description: "Learn, invest, and grow your network with Hustle University.",
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
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
