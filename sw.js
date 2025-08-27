const CACHE_NAME = 'snl-arena-v1';
const FILES = [
  '/','/index.html','/style.css','/app.js','/manifest.json',
  '/assets/bgm.wav','/assets/icon-192.png','/assets/icon-512.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=> { if(k!==CACHE_NAME) return caches.delete(k); } )))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { return caches.open(CACHE_NAME).then(cache => { cache.put(e.request, res.clone()); return res; }); })).catch(()=>caches.match('/index.html')));
});
