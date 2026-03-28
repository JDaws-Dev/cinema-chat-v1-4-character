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
  title: "The Last Picture Show \u2014 Talk to Vinny",
  description:
    "A legendary video store clerk who knows exactly what you should watch next. Tell him what you're in the mood for.",
  openGraph: {
    title: "The Last Picture Show \u2014 Talk to Vinny",
    description:
      "A legendary video store clerk who knows exactly what you should watch next.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
