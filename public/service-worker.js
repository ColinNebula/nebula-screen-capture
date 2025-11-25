/* eslint-disable no-restricted-globals */

// SERVICE WORKER VERSION - Update this when you need to force cache refresh
const CACHE_VERSION = "nebula-v2.0.1";
const CACHE_NAME = CACHE_VERSION;

// Cache static assets
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing - Version:", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS).catch(err => {
          console.warn("Some assets failed to cache:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated - Version:", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("Claiming clients");
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === "error") {
              return response;
            }

            const responseToCache = response.clone();

            if (event.request.destination === "image" || 
                event.request.destination === "style" || 
                event.request.destination === "script") {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              }).catch(() => {
                // Silently ignore cache storage errors
              });
            }

            return response;
          });
      })
      .catch(error => {
        // Handle all fetch and cache errors here
        console.warn("Request failed for:", event.request.url);
        
        // Try to serve index.html for navigation requests
        if (event.request.destination === "document" || event.request.mode === "navigate") {
          return caches.match("/index.html")
            .then(response => response || new Response("Offline", { status: 503 }));
        }
        
        // For assets, return a minimal error response
        return new Response("", {
          status: 408,
          statusText: "Request Timeout"
        });
      })
  );
});

// Message event - handle skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
