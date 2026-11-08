/* MYRQVIA PWA shell. The auth API is never cached. */
const VERSION = 'myrqvia-v12-2026-11-08-ios-controls';
const SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/manifest.webmanifest',
  '/css/tokens.css',
  '/css/app.css',
  '/css/imessage.css',
  '/css/login.css',
  '/css/typography.css',
  '/js/config.js',
  '/js/icons.js',
  '/js/data.js',
  '/js/presence.js',
  '/js/recall.js',
  '/js/realtime.js',
  '/js/app.js',
  '/js/i18n.js',
  '/js/auth-service.js',
  '/js/login.js',
  '/js/pwa.js',
  '/assets/favicon.svg',
  '/assets/icon-128.png',
  '/assets/icon-256.png',
  '/assets/icon-512.png'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(SHELL.map(async (url) => {
      try { await cache.add(new Request(url, { cache: 'reload' })); } catch (error) { /* optional asset */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(VERSION);
        cache.put(request, response.clone());
        return response;
      } catch (error) {
        return (await caches.match(request)) || (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      fetch(request).then((response) => {
        if (response && response.ok) caches.open(VERSION).then((cache) => cache.put(request, response));
      }).catch(() => {});
      return cached;
    }
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(VERSION);
      cache.put(request, response.clone());
    }
    return response;
  })());
});
