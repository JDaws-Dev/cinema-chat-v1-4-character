import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fridaynightvideo.app"),
  title: "Friday Night Video",
  description:
    "A 3D Blockbuster-style video store experience. Browse shelves, grab movies, complete challenges, and earn movie prop collectibles.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Friday Night Video",
    description:
      "Browse the shelves. Pick a movie. Chat with Vinny. It's Friday night, 1992.",
    type: "website",
    url: "https://fridaynightvideo.app",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Friday Night Video - Your Neighborhood Video Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Friday Night Video",
    description:
      "Browse the shelves. Pick a movie. Chat with Vinny. It's Friday night, 1992.",
    images: ["/images/og-share.png"],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
    "theme-color": "#0a0e18",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable} antialiased`} style={{ height: "100%", margin: 0 }}>
      <body style={{ height: "100%", margin: 0, padding: 0, overflow: "hidden" }}>{children}</body>
    </html>
  );
}
