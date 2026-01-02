// sw.js - El "limpiador" de CaseroZen
const VERSION = 'v1.0';

self.addEventListener('install', (event) => {
    // Forzar a que esta versión sea la activa inmediatamente
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Limpiar cualquier rastro de versiones viejas que bloquean la app
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => caches.delete(key))
        ))
    );
});

self.addEventListener('fetch', (event) => {
    // No guarda nada en caché por ahora (para evitar que se quede pillada)
    // Simplemente deja pasar la petición a internet
    event.respondWith(fetch(event.request));
});
