import type { Metadata } from "next";
import { Bodoni_Moda, Sora, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import "@stemory/ui/tokens.css";
import "@stemory/ui/typography.css";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-tagline",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Stemory Blooms",
    default: "Stemory Blooms | Everlasting Handcrafted Bouquets",
  },
  description: "Artisanal pipe-cleaner flowers that never wilt. Handcrafted with love in Morocco.",
  metadataBase: new URL('https://stemoryblooms.com'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Stemory Blooms | Everlasting Handcrafted Bouquets",
    description: "Artisanal pipe-cleaner flowers that never wilt. Handcrafted with love in Morocco.",
    url: "https://stemoryblooms.com",
    siteName: "Stemory Blooms",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Stemory Blooms - Luxury Everlasting Bouquets",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Stemory Blooms | Everlasting Handcrafted Bouquets",
    description: "Artisanal pipe-cleaner flowers that never wilt. Handcrafted with love in Morocco.",
    images: ["/og-image.jpg"],
  }
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${bodoniModa.variable} ${sora.variable} ${cormorantGaramond.variable}`}>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
