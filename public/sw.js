const CACHE_NAME = "needforscore-v3";
const STATIC_ASSETS = [
  "/favicon.png",
  "/manifest.json",
];

// Install: cache static assets and activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // @ts-ignore
  self.skipWaiting();
});

// Activate: clean old caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // @ts-ignore
  self.clients.claim();
});

// Fetch strategy:
// - HTML / navigation requests: ALWAYS network-first so users see latest deploys
// - API (rest/auth): network-first with cache fallback
// - Other static assets: cache-first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isNavigation =
    request.mode === "navigate" ||
    (request.destination === "document") ||
    request.headers.get("accept")?.includes("text/html");

  // Never cache HTML/navigations — always go to network so deploys are visible
  if (isNavigation) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/index.html").then((r) => r || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Supabase / API: network-first
  if (url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((r) => r || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // Static assets: cache first, fallback to network
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) return response;
      return fetch(request).then((fetchResponse) => {
        if (fetchResponse.ok) {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return fetchResponse;
      });
    })
  );
});
