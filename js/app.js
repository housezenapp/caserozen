/**
 * js/app.js - Orquestador Principal
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';
import { setupEventListeners } from './ui.js';

// 1. CONFIGURACIÓN DE SUPABASE (Tus credenciales reales)
const SUPABASE_URL = 'https://qpecqvvjyoycsxuvrzge.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWNxdnZqeW95Y3N4dXZyemdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDEyMTIsImV4cCI6MjA4MjQxNzIxMn0._NYiFimE45ATHyQEH1bE2PPebi7YvcMl5lylOXFxjEs';

// Inicializar cliente global para que auth.js y properties.js lo usen
window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("CaseroZen: Iniciando...");

    // A. Inicializar Autenticación (Define window.currentUser)
    await initAuth();

    // B. Activar todos los Listeners de tu ui.js (Google, Menús, Propiedades)
    // Aquí es donde "despiertan" los botones de tu ui.js largo
    setupEventListeners();
    
    console.log("CaseroZen: Sistema conectado y listo.");
});
