/**
 * © 2026 Wander Pires Silva Coelho - Software Proprietário
 */
// Service Worker para PWA
const CACHE_NAME = 'certificados-v25';
const urlsToCache = [
  '/login.html',
  '/index.html',
  '/admin.html',
  '/auth.js',
  '/app.js',
  '/admin.js'
];

// Instalar Service Worker - ativa imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Ativar Service Worker - assume controle imediatamente
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições - network-first (sempre busca atualização)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salvar cópia no cache para uso offline
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sem rede - usar cache como fallback
        return caches.match(event.request);
      })
  );
});
