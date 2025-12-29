import { 
    loadProperties, 
    openPropertyModal, 
    closePropertyModal, 
    handlePropertySubmit 
} from './properties.js';

// --- UTILIDADES ---
export function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

export function showPage(pageName) {
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

    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    if (pageName === 'incidencias') {
        if (typeof loadIncidents === 'function') loadIncidents();
    } else if (pageName === 'propiedades') {
        loadProperties();
    } else if (pageName === 'perfil') {
        if (typeof loadProfile === 'function') loadProfile();
    }
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// --- CONFIGURACIÓN DE EVENTOS (setupEventListeners) ---
export function setupEventListeners() {
    console.log("Activando todos los manejadores de eventos...");

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
            if (typeof loginWithEmail === 'function') await loginWithEmail(email, password);
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
            if (typeof registerWithEmail === 'function') await registerWithEmail(email, password);
        });
    }

    // --- BOTÓN GOOGLE (Conexión Crítica de Bolt) ---
    const btnGoogle = document.getElementById('btnGoogleLogin');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async (e) => {
            e.preventDefault();
            if (window.loginWithGoogle) {
                await window.loginWithGoogle();
            } else {
                console.error("Función window.loginWithGoogle no encontrada");
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
            if (window.logout) window.logout();
        });
    }

    // NAVEGACIÓN
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });

    // PROPIEDADES Y PERFIL
    const btnAddProp = document.getElementById('btnAddProperty');
    if (btnAddProp) {
        btnAddProp.addEventListener('click', openPropertyModal);
    }

    const closePropModalBtn = document.getElementById('closePropertyModal');
    if (closePropModalBtn) {
        closePropModalBtn.addEventListener('click', closePropertyModal);
    }

    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', handlePropertySubmit);
    }

    const perfilForm = document.getElementById('perfilForm');
    if (perfilForm) {
        perfilForm.addEventListener('submit', (e) => {
            if (typeof handleProfileSubmit === 'function') handleProfileSubmit(e);
        });
    }

    const closeIncModal = document.getElementById('closeIncidentModal');
    if (closeIncModal) {
        closeIncModal.addEventListener('click', () => {
            if (typeof closeIncidentDetailModal === 'function') closeIncidentDetailModal();
        });
    }

    // FILTROS
    const filterEstado = document.getElementById('filter-estado');
    if (filterEstado) filterEstado.addEventListener('change', () => {
        if (typeof loadIncidents === 'function') loadIncidents();
    });

    const filterUrgencia = document.getElementById('filter-urgencia');
    if (filterUrgencia) filterUrgencia.addEventListener('change', () => {
        if (typeof loadIncidents === 'function') loadIncidents();
    });
}
