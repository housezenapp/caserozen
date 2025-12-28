// 1. Función de Login
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

// 2. Portero y Detector de Sesión
export async function initAuth() {
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) btn.onclick = loginWithGoogle;

    const handleAuth = async (session) => {
        if (session) {
            window.currentUser = session.user;
            
            // Limpia el enlace largo de la URL
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }

            showApp();
            await ensureCaseroProfile();
            
            // Carga propiedades
            try {
                const { loadProperties } = await import('./properties.js');
                loadProperties();
            } catch (e) {
                console.error("Error cargando propiedades:", e);
            }
        } else {
            showLogin();
        }
    };

    // Comprobación inicial
    const { data } = await window._supabase.auth.getSession();
    await handleAuth(data.session);

    // Escucha cambios
    window._supabase.auth.onAuthStateChange(async (event, session) => {
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
    await window._supabase.from('caseros').upsert({
        id: id,
        email: email,
        nombre_completo: user_metadata?.full_name || ''
    });
}

// 4. Control Visual
function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    const name = window.currentUser?.user_metadata?.full_name || window.currentUser?.email;
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = name;
}

window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
