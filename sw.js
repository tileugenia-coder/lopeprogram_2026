// Enkel service worker for Marias treningsdagbok.
// Cacher app-skallet (index.html + ikoner) slik at appen åpner selv med
// dårlig eller manglende nett. Data lagres uansett i localStorage/Firebase,
// ikke her – dette handler kun om at selve appen skal laste raskt og pålitelig.

const CACHE_NAME = 'treningsdagbok-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for HTML (så nye endringer/deployer alltid vinner når nett finnes),
// fallback til cache når nettet er borte.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
