import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';

// Configuración de Supabase
const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI'; // <--- PEGA AQUÍ TU CLAVE ANON

// Creamos el cliente global
window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Arrancamos la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 App CaseroZen iniciando...");
    initAuth();
});
