import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ThemeProvider from "@/components/shared/ThemeProvider";

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
        className="antialiased bg-background text-foreground"
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
