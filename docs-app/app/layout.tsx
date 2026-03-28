import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ClarityInit } from "@/components/ClarityInit";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://charts.bretgordon.com"),
  title: "Charts Documentation",
  description: "API reference, setup guides, and migration docs for Charts — a Kotlin Multiplatform charting library built on Compose.",
  keywords: ["charts", "kotlin", "compose", "multiplatform", "visualization", "data"],
  authors: [{ name: "Charts Team" }],
  openGraph: {
    title: "Charts Documentation",
    description: "API reference and integration guides for Charts, a Compose Multiplatform charting library.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Charts Documentation",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://d31fy84ku2wzt.cloudfront.net" />
      </head>
      <body style={{ colorScheme: 'dark' }}>
        <ClarityInit />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
