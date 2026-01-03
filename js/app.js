
// Registro del Service Worker (Limpiador de caché)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log("🚀 Sistema de estabilidad PWA activado", reg.scope))
            .catch(err => console.error("❌ Error al registrar el SW", err));
    });
}

/**
 * js/app.js - Orquestador Principal
 */

// 1. CONFIGURACIÓN DE SUPABASE (Disponible globalmente)
const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3VidXhyemdtZW5tY2p5aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTExOTksImV4cCI6MjA4MjU2NzE5OX0.TwwlcvGnk_17IEtii1JxFBYVCUY6u_8ICo-rP6GjhYM';

// Usamos la librería que ya debe estar cargada en el HTML
if (typeof supabase !== 'undefined') {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error("❌ Error: La librería de Supabase no se ha cargado. Revisa tu index.html");
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("✨ CaseroZen: Iniciando aplicación...");

    // 2. INICIALIZACIÓN
    // Llamamos a las funciones que ya están en el objeto 'window' 
    // porque las cargamos en los otros archivos JS
    if (typeof window.initAuth === 'function') {
        await window.initAuth();
    }

    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }

    // Activar listener para detectar cuando la pestaña vuelve a estar activa
    if (typeof window.setupVisibilityListener === 'function') {
        window.setupVisibilityListener();
    }

    // Verificar después de un tiempo si hay estados de carga persistentes
    setTimeout(async () => {
        const loadingElements = document.querySelectorAll('.loading-state');
        const appContent = document.getElementById('app-content');
        const loginPage = document.getElementById('login-page');
        
        // Si hay elementos de carga y estamos en la app (no en login)
        if (loadingElements.length > 0 && appContent && !appContent.classList.contains('hidden')) {
            console.log("⚠️ Detectado estado de carga persistente al iniciar, verificando sesión...");
            
            if (typeof window.checkAndRefreshSession === 'function') {
                const hasValidSession = await window.checkAndRefreshSession();
                if (!hasValidSession) {
                    // forceLogout ya fue llamado
                    return;
                } else {
                    // Recargar la página activa
                    const activePage = document.querySelector('.page.active');
                    if (activePage) {
                        const pageId = activePage.id;
                        if (pageId === 'page-incidencias' && typeof window.loadIncidents === 'function') {
                            await window.loadIncidents();
                        } else if (pageId === 'page-propiedades' && typeof window.loadProperties === 'function') {
                            await window.loadProperties();
                        }
                    }
                }
            }
        }
    }, 8000); // Esperar 8 segundos después de iniciar

    console.log("✅ Aplicación inicializada correctamente");
});
