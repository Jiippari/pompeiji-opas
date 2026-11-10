/* Pompeiji-opas — service worker: tallentaa koko oppaan puhelimeen, jotta se toimii ilman nettiä.
 * Nosta VERSIO (sama kuin app.js:ssä) aina kun julkaiset muutoksia — muuten puhelimet
 * jatkavat vanhan version käyttöä. */
const VERSIO = '2026-11-10.4';
const VALIMUISTI = 'pompeiji-' + VERSIO;
const TIEDOSTOT = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'lib/leaflet/leaflet.js',
  'lib/leaflet/leaflet.css',
  'data/kartta.js',
  'data/kohteet-1.js',
  'data/kohteet-2.js',
  'data/kohteet-3.js',
  'data/reitit.js',
  'data/tietoa.js',
  'data/aanet.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VALIMUISTI).then(c => c.addAll(TIEDOSTOT)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(avaimet => Promise.all(avaimet.filter(k => k.startsWith('pompeiji-') && k !== VALIMUISTI).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

// Ensin välimuistista, sitten verkosta. Sivulataukset palauttavat aina index.html:n.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
