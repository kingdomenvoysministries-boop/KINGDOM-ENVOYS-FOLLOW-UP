// Kingdom Envoys Ministries follow-up: service worker
// Network first: the newest version of the app is always used when online,
// and the saved copy is only a fallback when the phone has no connection.
// Data (Supabase) is never cached here, so edits always sync live across devices.
const CACHE = 'kem-followup-v1';
const SHELL = ['./', './index.html', './manifest.json', './logo.png', './favicon.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const LIB_HOSTS = ['cdn.tailwindcss.com', 'unpkg.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'esm.sh'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return; // live data: never cached
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin && !LIB_HOSTS.includes(url.hostname)) return;

    e.respondWith(
        fetch(req).then(res => {
            if (res && (res.ok || res.type === 'opaque')) {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
            }
            return res;
        }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
    );
});
