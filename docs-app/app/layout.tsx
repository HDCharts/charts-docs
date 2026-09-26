import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ibmPlexSans = localFont({
  src: [
    { path: "./fonts/IBMPlexSans-Regular.ttf", weight: "400" },
    { path: "./fonts/IBMPlexSans-Medium.ttf", weight: "500" },
    { path: "./fonts/IBMPlexSans-SemiBold.ttf", weight: "600" },
    { path: "./fonts/IBMPlexSans-Bold.ttf", weight: "700" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.ttf", weight: "400" },
    { path: "./fonts/IBMPlexMono-Medium.ttf", weight: "500" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://charts.hdcode.dev"),
  title: "HDCharts — Compose Multiplatform charting",
  description: "Charts for Android, iOS, desktop, and web, built with Compose Multiplatform.",
  keywords: ["charts", "kotlin", "compose", "multiplatform", "visualization", "data"],
  authors: [{ name: "hdcode.dev" }],
  openGraph: {
    title: "HDCharts — Compose Multiplatform charting",
    description: "Charts for Android, iOS, desktop, and web, built with Compose Multiplatform.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HDCharts Documentation",
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
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://d31fy84ku2wzt.cloudfront.net" />
      </head>
      <body style={{ colorScheme: 'light' }}>
        {children}
      </body>
    </html>
  );
}
