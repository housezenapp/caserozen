// 1. GESTIÓN DE INTERFAZ (UI)
function showLogin() {
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage) loginPage.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
}

function showApp(user) {
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage) loginPage.style.display = 'none';
    if (appContent) appContent.style.display = 'block';

    // Actualizar nombre del casero en el menú
    const name = user.user_metadata?.full_name || user.email;
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = name;
}

// 2. REGISTRO EN BASE DE DATOS
async function ensureCaseroProfile(user) {
    if (!user) return;
    console.log("Actualizando perfil en base de datos...");
    try {
        const { error } = await window._supabase.from('caseros').upsert({
            id: user.id,
            email: user.email,
            nombre_completo: user.user_metadata?.full_name || '',
            ultima_conexion: new Date().toISOString()
        });
        if (error) throw error;
    } catch (err) {
        console.error("Error guardando perfil:", err.message);
    }
}

// 3. CARGA DE MÓDULOS EXTERNOS
async function loadAppData() {
    try {
        console.log("Cargando propiedades...");
        const { loadProperties } = await import('./properties.js');
        if (typeof loadProperties === 'function') {
            await loadProperties();
        }
    } catch (err) {
        console.error("Error al cargar propiedades del casero:", err);
    }
}

// 4. FLUJO PRINCIPAL (initAuth)
export async function initAuth() {
    // Vincular botón de Google
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) {
        btn.onclick = async () => {
            console.log("Redirigiendo a Google OAuth...");
            const { error } = await window._supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + window.location.pathname }
            });
            if (error) alert("Error al conectar: " + error.message);
        };
    }

    // EL DETECTOR MAESTRO (Controla toda la entrada)
    const handleSession = async (session) => {
        if (session) {
            console.log("✅ Sesión válida detectada.");
            window.currentUser = session.user;

            // Limpiar la URL si venimos de Google
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }

            showApp(session.user);
            await ensureCaseroProfile(session.user);
            await loadAppData();
        } else {
            console.log("❌ Sin sesión. Redirigiendo a login.");
            showLogin();
        }
    };

    // Comprobación inicial (Nada más cargar)
    const { data: { session } } = await window._supabase.auth.getSession();
    handleSession(session);

    // Escuchar cambios (Login/Logout)
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Evento Auth Detectado:", event);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            handleSession(session);
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });
}

// 5. LOGOUT GLOBAL
window.logout = async () => {
    console.log("Cerrando sesión...");
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
