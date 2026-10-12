/* global caches, fetch, self */

const CACHE_NAME = 'gridsplat-cache-v2';
const APP_SHELL = [
  '/splatworks/gridsplat/',
  '/splatworks/gridsplat/index.html',
  '/splatworks/gridsplat/manifest.webmanifest',
  '/splatworks/gridsplat/gridsplat_icon.png',
  '/splatworks/gridsplat/gridsplat_splash.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('gridsplat-cache-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  const url = new URL(request.url);
  const staticPath = url.pathname.startsWith('/splatworks/gridsplat/') || url.pathname.startsWith('/splatworks/shared/') || url.pathname.startsWith('/assets/') || url.pathname === '/data/drawsplat-tools.json';
  if (request.method !== 'GET' || url.origin !== self.location.origin || !staticPath || url.searchParams.has('open-file')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          if (response.ok) cache.put(request, copy).catch(() => {});
        });

        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then(async (cached) => cached ?? (request.mode === 'navigate' ? await caches.match('/splatworks/gridsplat/') : null) ?? Response.error()),
      ),
  );
});
