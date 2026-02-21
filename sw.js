const CACHE_VERSION = "v8";
const STATIC_CACHE = `restobar-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `restobar-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./brand-logo.png",
  "./brand-login.png"
];

const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font", "manifest"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  const reqUrl = new URL(event.request.url);
  const sameOrigin = reqUrl.origin === self.location.origin;

  if (sameOrigin && STATIC_DESTINATIONS.has(event.request.destination)) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (sameOrigin) {
    event.respondWith(networkFirst(event.request));
  }
});

async function handleNavigationRequest(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;

    const response = await fetch(event.request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(event.request, response.clone());
    return response;
  } catch (_err) {
    const cachedPage = await caches.match(event.request);
    if (cachedPage) return cachedPage;
    return (await caches.match("./index.html")) || offlineResponse();
  }
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(event.request);
  const networkPromise = fetch(event.request)
    .then((response) => {
      if (response.ok) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;
  return offlineResponse();
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return (await caches.match("./index.html")) || offlineResponse();
    }
    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response("Offline", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
