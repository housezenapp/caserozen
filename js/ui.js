function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function showPage(pageName) {
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

    toggleSidebar();

    if (pageName === 'incidencias') {
        loadIncidents();
    } else if (pageName === 'propiedades') {
        loadProperties();
    } else if (pageName === 'perfil') {
        loadProfile();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function setupEventListeners() {
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

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await loginWithEmail(email, password);
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
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

        await registerWithEmail(email, password);
    });

    document.getElementById('btnGoogleLogin').addEventListener('click', async () => {
        await loginWithGoogle();
    });

    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
    document.getElementById('menuOverlay').addEventListener('click', toggleSidebar);
    document.getElementById('btnLogout').addEventListener('click', logout);

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });

    document.getElementById('btnAddProperty').addEventListener('click', () => {
        openPropertyModal();
    });

    document.getElementById('closePropertyModal').addEventListener('click', () => {
        closePropertyModal();
    });

    document.getElementById('propertyForm').addEventListener('submit', handlePropertySubmit);

    document.getElementById('perfilForm').addEventListener('submit', handleProfileSubmit);

    document.getElementById('closeIncidentModal').addEventListener('click', () => {
        closeIncidentDetailModal();
    });

    document.getElementById('filter-estado').addEventListener('change', loadIncidents);
    document.getElementById('filter-urgencia').addEventListener('change', loadIncidents);
}
