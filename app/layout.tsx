import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminLayout } from "./admin-layout-wrapper";
import Script from "next/script";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";

const inter = Inter({
  weight: ['400', '600', '700'], // Reduced from 6 to 3 weights
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: "Wingside - Where Flavor Takes Flight | 20 Bold Wing Flavors",
  description: "Experience 20 bold wing flavors across 6 categories at Wingside. From BBQ to Boozy, order online for delivery or visit our hotspots. Your wings, your way.",
  keywords: ["wings", "chicken wings", "wing flavors", "food delivery", "restaurant", "Wingside", "BBQ wings", "hot wings", "delivery", "takeout"],
  authors: [{ name: "Wingside Foods Limited" }],
  creator: "Wingside",
  publisher: "Wingside Foods Limited",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Wingside - Where Flavor Takes Flight',
    description: 'Your wings, your way. 20 bold flavors, endless cravings. Order now for delivery or visit our hotspots.',
    siteName: 'Wingside',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Wingside - Delicious Chicken Wings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wingside - Where Flavor Takes Flight',
    description: 'Your wings, your way. 20 bold flavors, endless cravings.',
    images: ['/og-image.png'],
    creator: '@wingside',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F7C400',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://cxbqochxrhokdscgijxe.supabase.co" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://cxbqochxrhokdscgijxe.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Skip Navigation Link for Keyboard Users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
        >
          Skip to main content
        </a>
        <ServiceWorkerProvider />
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  );
}
