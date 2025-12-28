import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';

const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGllaXNieHZydWlqdm54YnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDAwMDYsImV4cCI6MjA4MjQxNjAwNn0.7U6_U83D2iIqK_kY8tq-B7N_T3pS9B7y4K_o5Z7fI_o';

window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initUI(); // <-- Nueva función para el menú
});

function initUI() {
    console.log("🛠️ Inicializando eventos del menú...");

    // 1. Botón para abrir/cerrar menú (Mobile)
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.onclick = () => {
            sidebar.classList.toggle('active');
        };
    }

    // 2. Navegación entre secciones (Propiedades, Reportes, etc.)
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');

            // Quitar 'active' de todos los enlaces y secciones
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Activar el seleccionado
            link.classList.add('active');
            const activeSection = document.getElementById(targetSection);
            if (activeSection) activeSection.classList.add('active');

            // Cerrar menú en móvil tras hacer clic
            if (sidebar) sidebar.classList.remove('active');
        };
    });
}
