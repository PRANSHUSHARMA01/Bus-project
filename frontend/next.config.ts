import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 https://api.pranshusharma.tech https://*.supabase.co https://api.mapbox.com https://demotiles.maplibre.org; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
