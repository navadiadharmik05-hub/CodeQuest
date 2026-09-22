/// <reference lib="webworker" />
// =============================================================================
// CodeQuest — Custom Service Worker additions
// This file is merged into the Workbox-generated sw.js by @ducanh2912/next-pwa.
// Placed in /worker/index.js — the customWorkerSrc setting points here.
// =============================================================================

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_VERSION = "cq-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE    = `${CACHE_VERSION}-api`;

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
];

// ---------------------------------------------------------------------------
// Install — pre-cache shell
// ---------------------------------------------------------------------------
sw.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  sw.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean old caches
// ---------------------------------------------------------------------------
sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  sw.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — strategy router
// ---------------------------------------------------------------------------
sw.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // API routes: network-first, fall back to cached response
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

async function networkFirst(req: Request, cacheName: string): Promise<Response> {
  try {
    const res = await fetch(req.clone());
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached ?? Response.error();
  }
}

async function cacheFirst(req: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req.clone());
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // Return offline page for navigation requests
    if (req.mode === "navigate") {
      return (await caches.match("/offline.html")) ?? Response.error();
    }
    return Response.error();
  }
}

// ---------------------------------------------------------------------------
// Push notifications (future use)
// ---------------------------------------------------------------------------
sw.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? { title: "CodeQuest", body: "New quest available!" };
  event.waitUntil(
    sw.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: data,
    })
  );
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(sw.clients.openWindow("/"));
});
