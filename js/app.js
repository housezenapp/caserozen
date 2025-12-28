import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';

// CREDENCIALES REALES
const SUPABASE_URL = 'https://qpecqvvjyoycsxuvrzge.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWNxdnZqeW95Y3N4dXZyemdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDEyMTIsImV4cCI6MjA4MjQxNzIxMn0._NYiFimE45ATHyQEH1bE2PPebi7YvcMl5lylOXFxjEs';

// Inicialización del cliente en el objeto window para que auth.js lo vea
window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Arrancamos todo
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 App CaseroZen iniciando...");
    initAuth();

    // Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log("SW error", err));
    }
});
