/* Skjer det noe? — minimal offline service worker.
   - navigations: network-first, fall back to cache, then the /offline page
   - same-origin static assets: cache-first with background refresh
   - cross-origin (Supabase API, OSM tiles, Brønnøysund) is left untouched
   Favourites live in localStorage, so they work offline regardless. */
importScripts("/sw-cache-policy.js");

const CACHE = "sdn-v2";
const PRECACHE = ["/offline", "/manifest.webmanifest", "/icon.svg"];
const { isCacheableResponse, isPublicNavigation } = self.SW_CACHE_POLICY;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip cross-origin
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    if (!isPublicNavigation(url.pathname)) {
      event.respondWith(fetch(req).catch(() => caches.match("/offline")));
      return;
    }

    event.respondWith(
      fetch(req)
        .then((res) => {
          if (isCacheableResponse(res)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/offline"))),
    );
    return;
  }

  const isAsset =
    url.pathname.startsWith("/_next/") ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname);
  if (isAsset) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (isCacheableResponse(res)) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
