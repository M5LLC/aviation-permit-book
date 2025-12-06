/**
 * Service Worker for Permit Book PWA
 *
 * Provides:
 * - Offline support with cache-first strategy for static assets
 * - Network-first strategy for API/data requests
 * - Background sync for offline actions (future)
 */

const CACHE_NAME = 'permit-book-v2';
const STATIC_CACHE_NAME = 'permit-book-static-v2';
const DATA_CACHE_NAME = 'permit-book-data-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
    // Don't skipWaiting here - let updates happen naturally
    // or via explicit user action through the message handler
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    // Don't claim clients immediately - let them update on next navigation
    // This prevents page reloads during auth operations
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase and external requests
  if (url.origin !== self.location.origin) {
    // For Firebase/API requests, use network-first
    if (url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('googleapis.com')) {
      event.respondWith(networkFirst(event.request, DATA_CACHE_NAME));
    }
    return;
  }

  // For static assets (JS, CSS, images), use cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE_NAME));
    return;
  }

  // For navigation requests, use network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(event.request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(event.request, CACHE_NAME));
});

/**
 * Check if request is for a static asset
 */
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached response but update cache in background
    fetchAndCache(request, cacheName);
    return cachedResponse;
  }

  return fetchAndCache(request, cacheName);
}

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network-first with offline page fallback
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Return cached index.html for navigation
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Fetch and cache a request
 */
async function fetchAndCache(request, cacheName) {
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
