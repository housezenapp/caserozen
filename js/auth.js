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

// 2. El "Portero": Se ejecuta cuando la web carga
export async function initAuth() {
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) btn.onclick = loginWithGoogle;

    // Escuchamos cambios de estado (Entrada/Salida)
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            window.currentUser = session.user;
            
            // PRIMERO mostramos la app para evitar que se quede colgado
            showApp();
            
            // DESPUÉS aseguramos el perfil sin bloquear la carga
            ensureCaseroProfile(); 
            
            // Disparamos la carga de propiedades
            const { loadProperties } = await import('./properties.js');
            loadProperties();
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });

    // Comprobación manual inicial por si la sesión ya existe
    const { data: { session } } = await window._supabase.auth.getSession();
    if (session) {
        window.currentUser = session.user;
        showApp();
    } else {
        showLogin();
    }
}

// 3. Crear ficha de casero (Silencioso)
async function ensureCaseroProfile() {
    if (!window.currentUser) return;
    try {
        await window._supabase.from('caseros').upsert({
            id: window.currentUser.id,
            email: window.currentUser.email,
            nombre_completo: window.currentUser.user_metadata?.full_name || ''
        });
    } catch (e) {
        console.warn("Error guardando perfil de casero:", e);
    }
}

// 4. Control de pantalla
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

window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
