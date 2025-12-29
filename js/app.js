/**
 * js/app.js - Orquestador Principal
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth, logout } from './auth.js';
import { 
    loadProperties, 
    openPropertyModal, 
    closePropertyModal, 
    handlePropertySubmit 
} from './properties.js';

const SUPABASE_URL = 'https://qpecqvvjyoycsxuvrzge.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWNxdnZqeW95Y3N4dXZyemdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDEyMTIsImV4cCI6MjA4MjQxNzIxMn0._NYiFimE45ATHyQEH1bE2PPebi7YvcMl5lylOXFxjEs';

window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    initAuth(); // Inicializa Google Auth
    initUI();   // Inicializa Menús y Botones
});

function initUI() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    const menuBtn = document.getElementById('menuBtn');

    // Navegación Sidebar
    if (menuBtn) menuBtn.onclick = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    };

    if (overlay) overlay.onclick = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            const pageId = item.getAttribute('data-page');
            if (!pageId) return;

            // Cambiar vista activa
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${pageId}`)?.classList.add('active');
            
            // Cargar datos si es necesario
            if (pageId === 'propiedades') loadProperties();

            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };
    });

    // Eventos Propiedades
    const btnAdd = document.getElementById('btnAddProperty');
    if (btnAdd) btnAdd.onclick = openPropertyModal;

    const btnClose = document.getElementById('closePropertyModal');
    if (btnClose) btnClose.onclick = closePropertyModal;

    const propertyForm = document.getElementById('propertyForm');
    if (propertyForm) {
        propertyForm.onsubmit = handlePropertySubmit;
    }

    // Botón Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.onclick = logout;
    }
}

window.showToast = (msg) => {
    const t = document.getElementById('toast');
    if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
};
