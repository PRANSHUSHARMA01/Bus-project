import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delhi Smart Public Bus Fleet System",
  description: "Real-time bus tracking, route-aware ETA, demand forecasting and fleet management for Delhi, India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-gray-100 antialiased selection:bg-blue-600 selection:text-white">
        {/* Top Operational Navigation Header */}
        <header className="h-16 border-b border-gray-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚍</span>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-tight tracking-tight text-white flex items-center gap-2">
                Delhi Transit Smart Fleet
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Live System
                </span>
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                3 Routes · 18 Active Buses · 23 Delhi Stops
              </p>
            </div>
          </div>

          {/* Navigation Portal Switchers */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors text-gray-200 hover:text-white flex items-center gap-1.5"
            >
              <span>🗺️</span>
              <span>Passenger Map</span>
            </Link>
            <Link
              href="/conductor"
              className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors text-gray-200 hover:text-white flex items-center gap-1.5"
            >
              <span>🎫</span>
              <span>Conductor Console</span>
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>Admin HQ</span>
            </Link>
          </nav>
        </header>

        {/* Dynamic Main Page Content */}
        <main className="flex-1 flex flex-col relative">{children}</main>
      </body>
    </html>
  );
}
