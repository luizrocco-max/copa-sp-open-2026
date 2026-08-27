/* Service worker do site da Copa SP Open.
   Regra principal: a PÁGINA e o DATASET vêm SEMPRE da rede primeiro.
   O cache só entra em ação quando o aparelho está sem internet — assim o
   app nunca mostra resultado desatualizado por causa de cache. */
const V = 'copa-sp-open-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icon.png', './icon-180.png', './icon-192.png', './icon-512.png',
  './icon-maskable-512.png', './og.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;   // não intercepta terceiros

  const isData = url.pathname.endsWith('dataset.json');
  const isDoc  = req.mode === 'navigate' || url.pathname.endsWith('.html') ||
                 url.pathname === '/' || url.pathname.endsWith('/');

  if (isData || isDoc) {
    // rede primeiro (dados sempre atuais); cache é só rede de segurança
    e.respondWith(
      fetch(req).then(r => {
        if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)).catch(() => {}); }
        return r;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(r => r || caches.match('./index.html', { ignoreSearch: true }))
      )
    );
    return;
  }

  // ícones e imagens: cache primeiro (não mudam)
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)).catch(() => {}); }
        return res;
      });
    })
  );
});
