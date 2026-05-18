const CACHE_NAME = "kaoyan-daily-task-v37";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./mobile-preview.html",
  "./styles.css",
  "./app.js",
  "./generated-content.js",
  "./generated-lookup.js",
  "./generated-reading-overrides.js",
  "./generated-grammar.js",
  "./generated-writing.js",
  "./exam-analysis-data.js",
  "./generated-exam.js",
  "./manifest.webmanifest",
  "./icon-192.svg",
  "./icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }
  const shouldRuntimeCache = url.pathname.includes("/analysis_processed/") || url.pathname.includes("/images/");
  if (shouldRuntimeCache) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => caches.match(event.request))
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
