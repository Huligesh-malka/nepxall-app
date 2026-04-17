const CACHE_NAME = "nepxall-cache-v2"; // 🔥 change version

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  console.log("✅ SW Installing...");
  self.skipWaiting(); // 🔥 important

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  console.log("✅ SW Activated");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim(); // 🔥 important
});

// FETCH (Network first strategy)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});