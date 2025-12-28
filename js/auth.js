// --- FUNCIONES DE INTERFAZ ---
function showLogin() {
    console.log("Mostrando pantalla de Login");
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage) loginPage.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
}

function showApp(user) {
    console.log("Mostrando pantalla de Aplicación");
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage) loginPage.style.display = 'none';
    if (appContent) appContent.style.display = 'block';

    const name = user.user_metadata?.full_name || user.email;
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = name;
}

// --- LOGICA DE BASE DE DATOS ---
async function ensureCaseroProfile(user) {
    if (!user) return;
    try {
        const { error } = await window._supabase.from('caseros').upsert({
            id: user.id,
            email: user.email,
            nombre_completo: user.user_metadata?.full_name || ''
        });
        if (error) throw error;
        console.log("✅ Perfil de casero sincronizado");
    } catch (err) {
        console.error("❌ Error en base de datos:", err.message);
    }
}

// --- CARGA DE DATOS ---
async function loadPropertiesData() {
    try {
        const { loadProperties } = await import('./properties.js');
        if (loadProperties) await loadProperties();
    } catch (e) {
        console.warn("Aviso: No se pudieron cargar las propiedades aún.");
    }
}

// --- FUNCIÓN PRINCIPAL DE AUTENTICACIÓN ---
export async function initAuth() {
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) {
        btn.onclick = async () => {
            console.log("Iniciando OAuth...");
            await window._supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + window.location.pathname }
            });
        };
    }

    // Proceso unificado de entrada
    const handleEntry = async (session) => {
        if (session) {
            console.log("🔑 Sesión confirmada para:", session.user.email);
            window.currentUser = session.user;

            // Limpiar URL
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }

            showApp(session.user);
            await ensureCaseroProfile(session.user);
            await loadPropertiesData();
        } else {
            showLogin();
        }
    };

    console.log("Buscando sesión existente...");
    const { data: { session }, error } = await window._supabase.auth.getSession();

    if (error) {
        console.error("Error al recuperar sesión:", error);
        showLogin();
        return;
    }

    if (session) {
        await handleEntry(session);
    } else {
        showLogin();
    }

    window._supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log("Evento detectado:", event);
        if (newSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            await handleEntry(newSession);
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });
}

window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
