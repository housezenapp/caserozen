import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';

const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGllaXNieHZydWlqdm54YnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDAwMDYsImV4cCI6MjA4MjQxNjAwNn0.7U6_U83D2iIqK_kY8tq-B7N_T3pS9B7y4K_o5Z7fI_o';

// Creamos el cliente y lo exponemos globalmente de inmediato
window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Sistema arrancado. Llamando al portero...");
    initAuth();
});
