import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pranshusharma.tech"),
  title: "Delhi Smart Bus · Live Tracking & Fleet Intelligence",
  description: "Real-time GPS bus tracking, crowd occupancy intelligence, and accurate arrivals for Delhi DTC & DIMTS electric buses.",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Delhi Smart Bus · Live Public Transit Tracking",
    description: "Track live buses, seat occupancy, and accurate arrival ETAs across 19 major Delhi NCR corridors.",
    url: "https://pranshusharma.tech",
    siteName: "Smart Bus Delhi",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delhi Smart Bus · Live Transit Tracking",
    description: "Live GPS bus arrival tracking and crowd telemetry across Delhi NCR.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

import { AuthProvider } from "@/lib/auth-context";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { CookieBanner } from "@/components/ui/CookieBanner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${devanagari.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TransitSystem",
              name: "Delhi Smart Public Bus Transit",
              url: "https://pranshusharma.tech",
              description: "Live telemetry, real-time arrival ETAs, and seat occupancy for Delhi commuter buses.",
              areaServed: {
                "@type": "AdministrativeArea",
                name: "National Capital Region, Delhi, India",
              },
            }),
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <RegisterServiceWorker />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
