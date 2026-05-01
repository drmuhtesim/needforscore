const CACHE_NAME = "needforscore-v6";
const STATIC_ASSETS = ["/favicon.png", "/manifest.json"];

// Install: pre-cache minimal static assets and activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // @ts-ignore
  self.skipWaiting();
});

// Activate: drop old caches and take control of all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
      // @ts-ignore
      await self.clients.claim();
    })()
  );
});

// Listen for SKIP_WAITING from the page (so newly installed SW can take over immediately)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    // @ts-ignore
    self.skipWaiting();
  }
});

/**
 * Fetch strategy:
 * - HTML / navigations: NETWORK-ONLY (no cache fallback) so new deploys are always seen.
 * - Hashed build assets under /assets/: cache-first (immutable, hash changes per build).
 * - Supabase REST/Auth: network-only.
 * - Other static (favicon, manifest, images): cache-first with network fallback.
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  const isNavigation =
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("accept")?.includes("text/html");

  // Always go to network for HTML so deploys propagate immediately
  if (isNavigation) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(
        () => new Response("Offline", { status: 503 })
      )
    );
    return;
  }

  // Don't cache Supabase API responses
  if (
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.endsWith("supabase.co")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Hashed Vite build assets — safe to cache aggressively (filename changes per build)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Other static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
