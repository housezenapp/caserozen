import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initAuth } from './auth.js';
import { 
    loadProperties, 
    openPropertyModal, 
    closePropertyModal, 
    handlePropertySubmit 
} from './properties.js';

// 1. CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGllaXNieHZydWlqdm54YnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDAwMDYsImV4cCI6MjA4MjQxNjAwNn0.7U6_U83D2iIqK_kY8tq-B7N_T3pS9B7y4K_o5Z7fI_o';

window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ARRANQUE DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Autenticación (Modo Bypass/Invitado configurado en auth.js)
    initAuth();
    
    // Inicializar Interfaz de Usuario y Eventos
    initUI();
});

// 3. CONTROL DE INTERFAZ Y NAVEGACIÓN
function initUI() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    // --- Lógica del Menú Lateral (Sidebar) ---
    function toggleMenu() {
        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    }

    if (menuBtn) menuBtn.onclick = toggleMenu;
    if (overlay) overlay.onclick = toggleMenu;

    // --- Navegación entre Secciones ---
    navItems.forEach(item => {
        item.onclick = () => {
            const pageId = item.getAttribute('data-page');
            if (!pageId) return; 

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) {
                targetPage.classList.add('active');
                if (pageId === 'propiedades') {
                    loadProperties();
                }
            }

            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
                toggleMenu();
            }
        };
    });

    // --- GESTIÓN DE PROPIEDADES (Lo que faltaba) ---
    
    // 1. Abrir modal
    const btnAdd = document.getElementById('btnAddProperty');
    if (btnAdd) {
        btnAdd.onclick = (e) => {
            e.preventDefault();
            openPropertyModal();
        };
    }

    // 2. Cerrar modal
    const btnClose = document.getElementById('closePropertyModal');
    if (btnClose) {
        btnClose.onclick = (e) => {
            e.preventDefault();
            closePropertyModal();
        };
    }

    // 3. Enviar Formulario (CRÍTICO)
    const propertyForm = document.getElementById('propertyForm');
    if (propertyForm) {
        propertyForm.onsubmit = async (e) => {
            console.log("Formulario detectado, guardando...");
            await handlePropertySubmit(e);
        };
    }
}
    // --- Eventos del Módulo de Propiedades ---
    const btnAdd = document.getElementById('btnAddProperty');
if (btnAdd) {
    btnAdd.onclick = (e) => {
        e.preventDefault();
        openPropertyModal();
    };
}

    const btnCloseModal = document.getElementById('closePropertyModal');
    if (btnCloseModal) {
        btnCloseModal.onclick = closePropertyModal;
    }

    const propertyForm = document.getElementById('propertyForm');
    if (propertyForm) {
        propertyForm.onsubmit = handlePropertySubmit;
    }

    // --- Inicializar Logout ---
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.onclick = () => {
            if (window.logout) window.logout();
        };
    }
}

// 4. UTILIDADES GLOBALES (Toast/Notificaciones)
window.showToast = (message) => {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message);
    }
};
