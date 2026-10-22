// NutriSnap AI — service worker
// Keeps the app installable and shows a friendly page when there is no internet.
// It deliberately does NOT store app pages or API answers, so you never see old
// versions of the app after an update. Only the offline page and the icon are kept.

const CACHE = 'nutrisnap-shell-v1';
const OFFLINE_URL = '/offline.html';
const KEEP = [OFFLINE_URL, '/icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(KEEP)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // never touch saving/paying/login requests
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // never touch the API, Firebase, Google or Creem

  // Opening a page: always go to the internet first; if that fails, show the offline page
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // The offline page and the icon can come from the saved copy
  if (KEEP.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
