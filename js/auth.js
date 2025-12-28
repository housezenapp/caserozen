// 1. Función de Login
async function loginWithGoogle() {
    try {
        console.log("Iniciando flujo de Google...");
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

// 2. Portero y Detector de Sesión
export async function initAuth() {
    console.log("Verificando sesión...");

    const btn = document.getElementById('btnGoogleLogin');
    if (btn) btn.onclick = loginWithGoogle;

    // Función interna para procesar la entrada
    const handleAuth = async (session) => {
        if (session) {
            console.log("✅ Acceso concedido:", session.user.email);
            window.currentUser = session.user;
            
            // LIMPIEZA DE URL: Borra el access_token de la barra de direcciones
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }

            showApp();
            await ensureCaseroProfile();
            
            // Carga de propiedades
            try {
                const { loadProperties } = await import('./properties.js');
                loadProperties();
            } catch (e) {
                console.error("Error cargando propiedades:", e);
            }
        } else {
            console.log("❌ Sin sesión activa");
            showLogin();
        }
    };

    // Paso 1: Comprobar si ya hay sesión (o si acabamos de volver de Google)
    const { data, error } = await window._supabase.auth.getSession();
    if (error) console.error("Error recuperando sesión:", error);
    await handleAuth(data.session);

    // Paso 2: Escuchar cambios de estado
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Evento de Autenticación:", event);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await handleAuth(session);
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });
}

// 3. Registro en Base de Datos
async function ensureCaseroProfile() {
    if (!window.currentUser) return;
    const { id, email, user_metadata } = window.currentUser;
    
    const { error } = await window._supabase.from('caseros').upsert({
        id: id,
        email: email,
        nombre_completo: user_metadata?.full_name || ''
    });
    
    if (error) console.error("Error actualizando perfil casero:", error);
}

// 4. Control Visual de Pantallas
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
    
    const name = window.currentUser?.user_metadata?.full_name || window.currentUser?.email;
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = name;
}

// Logout Global
window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
