import { 
    loadProperties, 
    openPropertyModal, 
    closePropertyModal, 
    handlePropertySubmit 
} from './properties.js';

// Añadimos export para que app.js pueda activar los botones
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

    // Cerramos el menú tras elegir página
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // Llamadas a las funciones de carga de cada sección
    if (pageName === 'incidencias') {
        if (typeof loadIncidents === 'function') loadIncidents();
    } else if (pageName === 'propiedades') {
        // Ahora cargamos las propiedades usando la función importada
        loadProperties();
    } else if (pageName === 'perfil') {
        if (typeof loadProfile === 'function') loadProfile();
    }
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Esta es la función principal que ejecutará app.js
export function setupEventListeners() {
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

    // BOTÓN GOOGLE
    const btnGoogle = document.getElementById('btnGoogleLogin');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
            if (window.loginWithGoogle) await window.loginWithGoogle();
        });
    }

    // MENÚ LATERAL Y LOGOUT
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);

    const overlay = document.getElementById('menuOverlay');
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
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
        btnAddProp.addEventListener('click', () => {
            // Llamamos a la función importada de properties.js
            openPropertyModal();
        });
    }

    const closePropModalBtn = document.getElementById('closePropertyModal');
    if (closePropModalBtn) {
        closePropModalBtn.addEventListener('click', () => {
            closePropertyModal();
        });
    }

    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', (e) => {
            handlePropertySubmit(e);
        });
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
