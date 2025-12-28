import { CONFIG } from './config.js';

// 1. CONEXIÓN GLOBAL: Creamos la conexión para que todos los archivos (auth, incidents) la usen
// Usamos window._supabase para que sea accesible desde cualquier parte del código
window._supabase = supabase.createClient(CONFIG.CONFIG_URL || CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// 2. SERVICE WORKER: Mantenemos la capacidad de instalar la app en el móvil
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('✅ Service Worker listo'))
            .catch(err => console.error('❌ Error SW:', err));
    });
}

// 3. INICIO DE LA APP
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App CaseroZen iniciando...');
    
    // Configuramos los botones (clics en menús, etc.)
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }

    // Arrancamos el portero (Auth) que configuramos en el paso anterior
    if (typeof initAuth === 'function') {
        await initAuth();
    }
});
