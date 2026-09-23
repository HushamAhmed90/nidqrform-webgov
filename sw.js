// Service worker: caches the app shell so the form opens and works with
// no internet connection once it has been opened one time.
// Bump CACHE whenever any cached file changes so phones pick up the update.
var CACHE = 'nid-form-v3';
var SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/img/irq.png',
  '/css/fonts/noto-sans-arabic-arabic-400-normal.woff2',
  '/css/fonts/noto-sans-arabic-arabic-700-normal.woff2',
  '/css/fonts/cairo-regular.woff2',
  '/css/fonts/cairo-semibold.woff2',
  '/js/qrcode.min.js',
  '/js/html2canvas.min.js',
  '/js/data.js',
  '/js/fields.js',
  '/js/mobile-strings.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Never touch ads, analytics or any other site.
  if (url.origin !== self.location.origin || url.pathname.indexOf('/_vercel/') === 0) return;

  // Pages: network first (to get updates), cached copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('/index.html', copy); });
        return res;
      }).catch(function () { return caches.match('/index.html'); })
    );
    return;
  }

  // Static files: cache first, refresh in the background.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
