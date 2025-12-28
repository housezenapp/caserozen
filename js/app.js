import { CONFIG } from './config.js';
import { initAuth } from './auth.js';

// 1. CONEXIÓN GLOBAL: Creamos la conexión para que todos los archivos la usen
// Usamos window._supabase para que sea accesible desde cualquier parte del código
window._supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

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
    
    try {
        // Arrancamos el portero (Auth)
        // Esto activará el botón de Google y revisará si ya estabas logueado
        await initAuth();
        console.log('✅ Sistema de Autenticación cargado');

        // Configuramos los botones de la interfaz (menús, navegación, etc.)
        if (typeof setupEventListeners === 'function') {
            setupEventListeners();
            console.log('✅ Eventos de UI configurados');
        }
    } catch (error) {
        console.error('❌ Error crítico en el inicio de la App:', error);
    }
});
