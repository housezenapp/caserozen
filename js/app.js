/**
 * js/app.js - Orquestador Principal
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';
import { setupEventListeners } from './ui.js';

// 1. CONFIGURACIÓN CORRECTA (Basada en tu Callback URL)
const SUPABASE_URL = 'https://ebkubuxrzgmenmcjyima.supabase.co';
// Esta es la anon key correspondiente a ebkubuxrzgmenmcjyima
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3VidXhyemdtZW5tY2p5aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTExOTksImV4cCI6MjA4MjU2NzE5OX0.TwwlcvGnk_17IEtii1JxFBYVCUY6u_8ICo-rP6GjhYM';

window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("CaseroZen: Iniciando con el proyecto rplieis...");
    
    // Inicializar Auth y luego los botones de ui.js
    await initAuth();
    setupEventListeners();
});
