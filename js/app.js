import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';

// Configuración obligatoria
const SUPABASE_URL = 'https://qpecqvvjyoycsxuvrzge.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWNxdnZqeW95Y3N4dXZyemdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDEyMTIsImV4cCI6MjA4MjQxNzIxMn0._NYiFimE45ATHyQEH1bE2PPebi7YvcMl5lylOXFxjEs';

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
