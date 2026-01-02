/**
 * js/ui.js - Interfaz y Eventos (Versión Integrada y Estable)
 */

// --- UTILIDADES ---
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function showPage(pageName) {
    console.log("📄 Navegando a:", pageName);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
    }

    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Cerrar sidebar automáticamente en móvil al navegar
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // Cargas automáticas según la sección
    if (pageName === 'incidencias') {
        if (typeof window.loadIncidents === 'function') window.loadIncidents();
    } else if (pageName === 'propiedades') {
        if (typeof window.loadProperties === 'function') window.loadProperties();
    } else if (pageName === 'perfil') {
        if (typeof window.loadProfile === 'function') window.loadProfile();
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// --- CONFIGURACIÓN DE EVENTOS (setupEventListeners) ---
function setupEventListeners() {
    console.log("🔘 Conectando manejadores de eventos...");

    // Tabs de Login/Registro
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            if (targetTab === 'login') {
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('registerForm').style.display = 'none';
            } else {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('registerForm').style.display = 'block';
            }
        });
    });

    // Formularios de Email
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (typeof window.loginWithEmail === 'function') await window.loginWithEmail(email, password);
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;

            if (password !== confirmPassword) {
                showToast('Las contraseñas no coinciden');
                return;
            }
            if (password.length < 6) {
                showToast('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            if (typeof window.registerWithEmail === 'function') await window.registerWithEmail(email, password);
        });
    }

    // --- BOTÓN GOOGLE (Crítico) ---
    const btnGoogle = document.getElementById('btnGoogleLogin');
    if (btnGoogle) {
        // Clonamos para evitar múltiples listeners si se llama a setupEventListeners varias veces
        const newBtnGoogle = btnGoogle.cloneNode(true);
        btnGoogle.parentNode.replaceChild(newBtnGoogle, btnGoogle);
        
        newBtnGoogle.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("Click en Google Login");
            if (window.loginWithGoogle) {
                await window.loginWithGoogle();
            }
        });
    }

    // MENÚ LATERAL Y LOGOUT
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);

    const overlay = document.getElementById('menuOverlay');
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.logout) {
                window.logout(); // Llama a la función reforzada en auth.js
            }
        });
    }

    // NAVEGACIÓN
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) showPage(page);
        });
    });

    // PROPIEDADES Y PERFIL
    const btnAddProp = document.getElementById('btnAddProperty');
    if (btnAddProp) {
        btnAddProp.addEventListener('click', () => {
            if (typeof window.openPropertyModal === 'function') window.openPropertyModal();
        });
    }

    const closePropModalBtn = document.getElementById('closePropertyModal');
    if (closePropModalBtn) {
        closePropModalBtn.addEventListener('click', () => {
            if (typeof window.closePropertyModal === 'function') window.closePropertyModal();
        });
    }

    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', (e) => {
            if (typeof window.handlePropertySubmit === 'function') window.handlePropertySubmit(e);
        });
    }

    const perfilForm = document.getElementById('perfilForm');
    if (perfilForm) {
        perfilForm.addEventListener('submit', (e) => {
            if (typeof window.handleProfileSubmit === 'function') window.handleProfileSubmit(e);
        });
    }

    // MODAL INCIDENCIAS
    const closeIncModal = document.getElementById('closeIncidentModal');
    if (closeIncModal) {
        closeIncModal.addEventListener('click', () => {
            if (typeof window.closeIncidentDetailModal === 'function') window.closeIncidentDetailModal();
        });
    }

    // FILTROS
    const filterEstado = document.getElementById('filter-estado');
    if (filterEstado) filterEstado.addEventListener('change', () => {
        if (typeof window.loadIncidents === 'function') window.loadIncidents();
    });

    const filterUrgencia = document.getElementById('filter-urgencia');
    if (filterUrgencia) filterUrgencia.addEventListener('change', () => {
        if (typeof window.loadIncidents === 'function') window.loadIncidents();
    });
}

// Exposición global
window.showPage = showPage;
window.setupEventListeners = setupEventListeners;
window.showToast = showToast;
window.toggleSidebar = toggleSidebar;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
