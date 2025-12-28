import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';

// Configuración obligatoria
const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI'; // <--- Pon tu clave aquí

// Inicialización del cliente global
// Lo ponemos en window para que sea accesible desde cualquier otro script (.js)
window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Evento de inicio: Solo arranca cuando el HTML está cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 App CaseroZen iniciando...");
    
    // Lanzamos el sistema de autenticación
    initAuth();

    // Registro del Service Worker para PWA (Instalación en móvil)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log("✅ Service Worker listo"))
            .catch(err => console.error("❌ Error SW:", err));
    }
});
