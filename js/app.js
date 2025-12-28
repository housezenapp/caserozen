import { CONFIG } from './config.js';
import { initAuth } from './auth.js';
import { setupEventListeners } from './ui.js';

// 1. CONEXIÓN GLOBAL: Creamos la conexión para que todos los archivos la usen
// Usamos window._supabase para que sea accesible desde cualquier parte del código
window._supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// 2. SERVICE WORKER: Capacidad PWA (Instalar en móvil)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('✅ Service Worker listo'))
            .catch(err => console.error('❌ Error SW:', err));
    });
}

// 3. INICIO DE LA APP: El orden de encendido es vital
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App CaseroZen iniciando...');
    
    try {
        // Primero: Activamos todos los botones y el menú lateral (UI)
        // Esto hace que las "tres barritas" empiecen a escuchar clics
        setupEventListeners();
        console.log('✅ Interfaz (UI) lista');

        // Segundo: Arrancamos el control de acceso (Auth)
        // Esto verifica si el usuario está logueado o muestra el login
        await initAuth();
        console.log('✅ Sistema de Autenticación cargado');

    } catch (error) {
        console.error('❌ Error crítico en el arranque:', error);
    }
});
