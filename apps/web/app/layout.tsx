import type { Metadata } from "next";
import { Bodoni_Moda, Sora, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "Stemory Blooms | Everlasting Handcrafted Bouquets",
  description: "Artisanal pipe-cleaner flowers that never wilt. Handcrafted with love in Morocco.",
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
        </body>
      </html>
    </ClerkProvider>
  );
}
