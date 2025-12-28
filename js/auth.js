// 1. Lanzar Google Login
async function loginWithGoogle() {
    try {
        const { error } = await window._supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error("Error en login:", err.message);
    }
}

// 2. El "Portero" mejorado
export async function initAuth() {
    console.log("Detectando sesión...");
    
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) btn.onclick = loginWithGoogle;

    // ESCUCHA ACTIVA: Para cambios de estado futuros
    window._supabase.auth.onAuthStateChange((event, session) => {
        console.log("Cambio de Auth Detectado:", event);
        if (session) {
            window.currentUser = session.user;
            showApp();
            ensureCaseroProfile();
        } else {
            showLogin();
        }
    });

    // EMPUJÓN MANUAL: Comprobamos la sesión inmediatamente
    const { data, error } = await window._supabase.auth.getSession();
    
    if (data?.session) {
        console.log("Sesión recuperada manualmente");
        window.currentUser = data.session.user;
        showApp();
        ensureCaseroProfile();
    } else {
        console.log("No hay sesión activa, mostrando login");
        showLogin();
    }
}

// 3. Crear ficha de casero
async function ensureCaseroProfile() {
    if (!window.currentUser) return;
    try {
        await window._supabase.from('caseros').upsert({
            id: window.currentUser.id,
            email: window.currentUser.email,
            nombre_completo: window.currentUser.user_metadata?.full_name || ''
        });
    } catch (e) {
        console.error("Error en perfil casero:", e);
    }
}

// 4. Control de pantalla (Asegurando que los IDs existan)
function showLogin() {
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage) loginPage.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
}

function showApp() {
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    
    if (loginPage) loginPage.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
    
    // Limpiar la URL del enlace largo (token) para que quede limpia
    if (window.location.hash) {
        window.history.replaceState(null, null, window.location.pathname);
    }
    
    const name = window.currentUser?.user_metadata?.full_name || window.currentUser?.email;
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = name;

    // Cargar propiedades
    import('./properties.js').then(m => m.loadProperties());
}

window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
