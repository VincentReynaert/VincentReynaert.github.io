const CACHE_PREFIX = "urps-obesite-onepage-";
const CACHE_NAME = `${CACHE_PREFIX}20261006-r2`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "../URPS_Ob_HUB/index.html?v=20261006-r2",
  "../URPS_Ob_HUB/Hub.css?v=20261006-r2",
  "../URPS_Ob_HUB/Hub.js?v=20261006-r2",
  "../URPS_Ob_blocA/index.html?v=20261006-r2",
  "../URPS_Ob_blocA/Bloc_A.css?v=20261006-r2",
  "../URPS_Ob_blocA/Bloc_A.js?v=20261006-r2",
  "../URPS_Ob_blocB/index.html?v=20261006-r2",
  "../URPS_Ob_blocB/Bloc_B.css?v=20261006-r2",
  "../URPS_Ob_blocB/Bloc_B.js?v=20261006-r2",
  "../shared/scene-layout.css?v=20261006-r2",
  "../shared/scene-layout.js?v=20261006-r2",
  "../shared/scene-runtime.js?v=20261006-r2"
];
const shellPaths = new Set(APP_SHELL.map((path) => new URL(path, self.registration.scope).pathname));

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map((path) => new Request(path, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !shellPaths.has(url.pathname)) return;
  // Refresh the questionnaire online; retain the last working version offline.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request, { ignoreSearch: url.pathname.endsWith(".html") || url.pathname.endsWith("/") });
      if (cached) return cached;
      throw error;
    }
  })());
});
