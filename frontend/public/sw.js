// Service Worker for Delhi Smart Bus Tracking PWA
const CACHE_NAME = "delhi-smart-bus-v2";
const STATIC_ASSETS = [
  "/",
  "/services",
  "/activity",
  "/account",
  "/manifest.webmanifest",
  "/favicon.ico"
];

// 1. Install event: Cache critical app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event: Stale-While-Revalidate for shell, Network-First for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Static shell routes & assets: Stale-While-Revalidate
  if (
    url.origin === self.location.origin &&
    (url.pathname === "/" ||
      url.pathname.startsWith("/services") ||
      url.pathname.startsWith("/activity") ||
      url.pathname.startsWith("/account") ||
      url.pathname.startsWith("/_next/static"))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Network-First for API requests with cache fallback
  if (url.pathname.startsWith("/v1/") || url.pathname.startsWith("/buses/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            // Append offline header to alert UI
            const newHeaders = new Headers(cached.headers);
            newHeaders.set("X-Offline-Fallback", "true");
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers: newHeaders
            });
          }
          return new Response(
            JSON.stringify({ error: "offline", message: "You are offline. Showing cached transit data." }),
            { headers: { "Content-Type": "application/json" } }
          );
        })
    );
  }
});
