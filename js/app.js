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

    console.log("✅ Aplicación inicializada correctamente");
});
