const CACHE_NAME = "nepxall-cache-v4";

self.addEventListener("install", (event) => {
  console.log("SW Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW Activated");
  event.waitUntil(self.clients.claim());
});

// ✅ REQUIRED: proper fetch handling
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});