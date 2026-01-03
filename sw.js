// sw.js - Service Worker para CaseroZen PWA
const VERSION = 'v2.0.0';
const CACHE_NAME = `caserozen-${VERSION}`;

// Archivos estáticos para cachear (para funcionar offline básico)
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/js/app.js',
  '/js/auth.js',
  '/js/ui.js',
  '/js/properties.js',
  '/js/incidents.js',
  '/js/profile.js',
  '/js/diagnostic.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker versión', VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando archivos estáticos');
        // Intentar cachear, pero no fallar si algo falla
        return cache.addAll(STATIC_CACHE_URLS).catch(err => {
          console.warn('[SW] Error al cachear algunos archivos:', err);
        });
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker versión', VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Tomar control de todas las páginas inmediatamente
      return self.clients.claim();
    })
  );
});

// Manejo de peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estrategia: Network First para APIs y datos dinámicos, Cache First para estáticos
  if (request.method !== 'GET') {
    // Para POST, PUT, DELETE, siempre ir a red
    event.respondWith(fetch(request));
    return;
  }
  
  // Para Supabase y APIs externas, siempre red
  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('cdn-icons-png.flaticon.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Si falla la red, intentar desde cache si es un recurso estático
        return caches.match(request);
      })
    );
    return;
  }
  
  // Para archivos locales, Cache First con fallback a red
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // También intentar actualizar en segundo plano
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
        }).catch(() => {
          // Ignorar errores de actualización en segundo plano
        });
        return cachedResponse;
      }
      
      // Si no está en cache, ir a red
      return fetch(request).then((response) => {
        // Solo cachear respuestas exitosas y del mismo origen
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Manejo de mensajes del cliente (para actualizaciones)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
