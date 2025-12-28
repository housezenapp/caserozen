
    // 1. Control de Pantallas
function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp(userName) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = userName;
}

// 2. Lógica de Autenticación Simulada
export async function initAuth() {
    const btn = document.getElementById('btnGoogleLogin');

    // Datos del usuario ficticio para desarrollo
    const fakeUser = {
        id: '00000000-0000-0000-0000-000000000000', // ID genérico
        email: 'casero_admin@caserozen.com',
        user_metadata: { full_name: 'Casero Admin (Modo Test)' }
    };

    if (btn) {
        btn.onclick = () => {
            console.log("🔓 Saltando Google Login...");
            
            // Guardamos sesión ficticia en memoria y en disco local
            window.currentUser = fakeUser;
            localStorage.setItem('caserozen_bypass', 'true');
            
            arrancarApp();
        };
    }

    async function arrancarApp() {
        showApp(window.currentUser.user_metadata.full_name);
        
        // Carga de propiedades desde la base de datos real
        try {
            console.log("📦 Cargando propiedades de la DB...");
            const { loadProperties } = await import('./properties.js');
            if (loadProperties) await loadProperties();
        } catch (err) {
            console.error("⚠️ Error al cargar propiedades:", err);
        }
    }

    // Comprobamos si ya habíamos entrado antes (para no loguear cada vez)
    if (localStorage.getItem('caserozen_bypass') === 'true') {
        window.currentUser = fakeUser;
        arrancarApp();
    } else {
        showLogin();
    }
}

// 3. Logout (Limpiar el bypass)
window.logout = () => {
    localStorage.removeItem('caserozen_bypass');
    window.location.reload();
};
