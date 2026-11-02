import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-bricolage",
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
    icon: [
      { url: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Delhi Bus",
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
      className={`${inter.variable} ${bricolage.variable} ${devanagari.variable} ${jetbrainsMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("smart_bus_theme")||localStorage.getItem("theme")||localStorage.getItem("delhi_bus_theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.setAttribute("data-theme","dark");}else{document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`,
          }}
        />
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
