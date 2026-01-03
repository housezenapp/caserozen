
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

    // Verificar si hay una página activa pero sin datos cargados
    setTimeout(() => {
        const appContent = document.getElementById('app-content');
        if (appContent && !appContent.classList.contains('hidden')) {
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageId = activePage.id;
                const hasLoadingState = activePage.querySelector('.loading-state');
                const hasContent = activePage.querySelector('.property-card, .incident-card, .empty-state:not(.loading-state)');
                
                // Si hay estado de carga pero no hay contenido, intentar cargar datos
                if (hasLoadingState && !hasContent) {
                    console.log(`⚠️ Página ${pageId} activa pero sin datos, intentando cargar...`);
                    if (pageId === 'page-incidencias' && typeof window.loadIncidents === 'function') {
                        window.loadIncidents();
                    } else if (pageId === 'page-propiedades' && typeof window.loadProperties === 'function') {
                        window.loadProperties();
                    }
                }
            }
        }
    }, 1000); // Esperar 1 segundo después de la inicialización

    // Verificar después de un tiempo si hay estados de carga persistentes
    setTimeout(async () => {
        const loadingElements = document.querySelectorAll('.loading-state');
        const appContent = document.getElementById('app-content');
        
        // Si hay elementos de carga y estamos en la app (no en login)
        if (loadingElements.length > 0 && appContent && !appContent.classList.contains('hidden')) {
            console.log("⚠️ Detectado estado de carga persistente después de 5 segundos, verificando sesión...");
            
            // Verificar que realmente estemos cargando (el elemento sigue en el DOM)
            const stillLoading = Array.from(loadingElements).some(el => 
                el.textContent && (el.textContent.includes('Cargando') || el.textContent.includes('loading'))
            );
            
            if (stillLoading) {
                if (typeof window.checkAndRefreshSession === 'function') {
                    const hasValidSession = await window.checkAndRefreshSession();
                    if (!hasValidSession) {
                        // forceLogout ya fue llamado
                        return;
                    } else {
                        // Forzar recarga de la página activa
                        const activePage = document.querySelector('.page.active');
                        if (activePage) {
                            const pageId = activePage.id;
                            console.log(`🔄 Forzando recarga de ${pageId}...`);
                            if (pageId === 'page-incidencias' && typeof window.loadIncidents === 'function') {
                                await window.loadIncidents();
                            } else if (pageId === 'page-propiedades' && typeof window.loadProperties === 'function') {
                                await window.loadProperties();
                            }
                        }
                    }
                }
            }
        }
    }, 5000); // Reducir a 5 segundos
    
    // Si después de 8 segundos aún hay carga, forzar cierre de sesión
    setTimeout(async () => {
        const loadingElements = document.querySelectorAll('.loading-state');
        const appContent = document.getElementById('app-content');
        
        if (loadingElements.length > 0 && appContent && !appContent.classList.contains('hidden')) {
            const stillLoading = Array.from(loadingElements).some(el => 
                el.textContent && (el.textContent.includes('Cargando') || el.textContent.includes('loading'))
            );
            
            if (stillLoading) {
                console.error("❌ Estado de carga persistente después de 8 segundos - cerrando sesión");
                if (typeof window.forceLogout === 'function') {
                    await window.forceLogout();
                }
            }
        }
    }, 8000);

    console.log("✅ Aplicación inicializada correctamente");
});
