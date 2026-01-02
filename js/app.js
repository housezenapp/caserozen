/**
 * js/app.js - Orquestador Principal
 */

// 1. Registro del Service Worker (Limpiador de caché)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log("🚀 Sistema de estabilidad PWA activado", reg.scope))
            .catch(err => console.error("❌ Error al registrar el SW", err));
    });
}

// 2. CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3VidXhyemdtZW5tY2p5aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTExOTksImV4cCI6MjA4MjU2NzE5OX0.TwwlcvGnk_17IEtii1JxFBYVCUY6u_8ICo-rP6GjhYM';

if (typeof supabase !== 'undefined') {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error("❌ Error: La librería de Supabase no se ha cargado.");
}

// 3. ARRANQUE DE LA APP
document.addEventListener('DOMContentLoaded', async () => {
    console.log("✨ CaseroZen: Iniciando aplicación...");

    try {
        // Intentamos inicializar el Auth
        if (typeof window.initAuth === 'function') {
            await window.initAuth();
        }
    } catch (error) {
        console.error("⚠️ Error en initAuth, pero continuamos:", error);
    }

    // IMPORTANTE: Esto debe ejecutarse SIEMPRE. 
    // Si los listeners no se activan, los botones (Google/Cerrar Sesión) no hacen nada.
    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
        console.log("🔘 Botones conectados");
    }

    console.log("✅ Aplicación inicializada correctamente");
});
