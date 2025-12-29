/**
 * js/app.js - Orquestador Principal
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';
import { setupEventListeners } from './ui.js';

// 1. CONFIGURACIÓN CORRECTA (Basada en tu Callback URL)
const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
// Esta es la anon key correspondiente a rplieisbxvruijvnxbya
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbGllaXNieHZydWlqdm54YnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDAwMDYsImV4cCI6MjA4MjQxNjAwNn0.7U6_U83D2iIqK_kY8tq-B7N_T3pS9B7y4K_o5Z7fI_o';

window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("CaseroZen: Iniciando con el proyecto rplieis...");
    
    // Inicializar Auth y luego los botones de ui.js
    await initAuth();
    setupEventListeners();
});
