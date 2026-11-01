// Minimal service worker: network-first for pages, cache-first for static assets. Admin and API are never cached.
const V = 'ssc-v1', SHELL = ['/', '/offline.html', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api') || u.pathname.startsWith('/admin')) return;
  const static_ = u.pathname.startsWith('/_next/static') || u.pathname.startsWith('/icons');
  e.respondWith(static_
    ? caches.match(e.request).then(h => h || fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }))
    : fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(h => h || caches.match('/offline.html'))));
});
