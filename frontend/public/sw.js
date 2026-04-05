/**
 * Palomino Village OS — Service Worker Agresivo
 * "Modo Pueblo Offline": el muro y perfiles cargan instantáneamente
 * incluso sin señal, usando datos cacheados del último momento de conexión.
 *
 * Estrategia: Stale-While-Revalidate para API, Cache-First para assets.
 */

const CACHE_NAME = 'pvo-v1';
const API_CACHE = 'pvo-api-v1';

// Assets estáticos que se pre-cachean al instalar
const PRECACHE_URLS = [
  '/',
  '/muro',
  '/pagos',
  '/perfil',
  '/torneos',
  '/manifest.json',
];

// Rutas de API que se cachean agresivamente
const API_PATTERNS = [
  '/api/v1/community/feed/',
  '/api/v1/users/',
  '/api/v1/tournaments/leaderboard/',
  '/api/v1/tournaments/node/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET requests
  if (request.method !== 'GET') return;

  // Rutas de API → Stale-While-Revalidate
  const isApiRoute = API_PATTERNS.some((pattern) =>
    url.pathname.includes(pattern)
  );

  if (isApiRoute) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Assets estáticos y navegación → Cache-First con fallback a red
  if (request.mode === 'navigate' || isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

/**
 * Stale-While-Revalidate: devuelve cache inmediatamente,
 * actualiza en background. Perfecto para feeds y perfiles.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse); // Si falla la red, ya devolvimos cache

  // Si hay cache, devolver inmediatamente. Si no, esperar la red.
  return cachedResponse || fetchPromise;
}

/**
 * Cache-First: busca en cache, si no hay va a la red.
 * Para páginas y assets estáticos.
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Offline fallback: devolver la página principal cacheada
    if (request.mode === 'navigate') {
      return cache.match('/') || new Response('Offline', { status: 503 });
    }
    return new Response('Offline', { status: 503 });
  }
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/i.test(pathname);
}

// Escuchar mensajes para forzar sync cuando vuelve la conexión
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
