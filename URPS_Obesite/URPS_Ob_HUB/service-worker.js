const CACHE_PREFIX = "urps-obesite-hub-";
const CACHE_NAME = `${CACHE_PREFIX}20261008-r2`;
const APP_SHELL = [
  "../shared/vendor/jspdf.umd.min.js",
  "../shared/vendor/xlsx.full.min.js",
  "../shared/results-export.js?v=20261008-r1",
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./Hub.css?v=20261008-r1",
  "./Hub.js?v=20261008-r2",
  "../shared/scene-layout.css?v=20261008-r1",
  "../shared/scene-layout.js?v=20261008-r1",
  "../shared/scene-runtime.js?v=20261008-r1"
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
