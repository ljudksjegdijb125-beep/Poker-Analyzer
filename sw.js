const CACHE_NAME = 'pokeji-v28.0';
const APP_ENTRY = './index.html';
const APP_SHELL = [
  './',
  APP_ENTRY,
  './assets/app.css',
  './assets/app.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icons/apps/chat-a-heart.webp',
  './assets/icons/apps/character-k-spade.webp',
  './assets/icons/apps/group-q-club.webp',
  './assets/icons/apps/moments-diamond.webp'
];

async function cacheOne(cache, url) {
  try {
    const response = await fetch(new Request(url, {cache: 'reload'}));
    if (!response.ok) return {url, ok: false, status: response.status};
    await cache.put(url, response.clone());
    return {url, ok: true};
  } catch (error) {
    return {url, ok: false, error: String(error)};
  }
}

async function warmAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.all(APP_SHELL.map(url => cacheOne(cache, url)));
  const failed = results.filter(result => !result.ok).map(result => result.url);
  const windows = await self.clients.matchAll({type: 'window'});
  windows.forEach(client => client.postMessage({type: 'PRECACHE_COMPLETE', failed}));
}

self.addEventListener('install', event => {
  // Installation only creates the cache. Asset downloads run after activation,
  // so a slow or missing file cannot hold the PWA in the installing state.
  event.waitUntil(caches.open(CACHE_NAME));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('pokeji-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        try { await cache.put(event.request, response.clone()); } catch {}
      }
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return (await cache.match(APP_ENTRY)) || (await cache.match('./')) || new Response('扑克机暂时离线', {
          status: 503,
          headers: {'Content-Type': 'text/plain; charset=utf-8'}
        });
      }
      return Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'PRECACHE_APP') event.waitUntil(warmAppShell());
});
