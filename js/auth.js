/**
 * js/auth.js - Gestión de Autenticación Global (Versión Reforzada)
 */

async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // 1. Limpiar tokens de la URL (Evita que la PWA se bloquee al volver de Google)
    const url = new URL(window.location.href);
    if (url.hash || url.searchParams.has('code')) {
        window.history.replaceState(null, null, window.location.pathname);
    }

    // 2. Escuchar cambios en la sesión
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);

        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;

            // Sincronizar UI y Base de Datos
            await updateUserDisplay(session.user);

            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');

            if (loginPage && appContent) {
                loginPage.classList.add('hidden');
                appContent.classList.remove('hidden');
                
                // DISPARAR CARGAS AUTOMÁTICAS:
                // Cargamos propiedades e incidencias en cuanto entramos
                if (window.loadProperties) window.loadProperties();
                if (window.loadIncidents) window.loadIncidents();
                
                // Mostrar la página principal
                if (window.showPage) window.showPage('incidencias');
            }
        } else {
            window.currentUser = null;
            document.getElementById('login-page')?.classList.remove('hidden');
            document.getElementById('app-content')?.classList.add('hidden');
        }
    });

    // 3. Verificación inmediata inicial
    const { data: { session } } = await window._supabase.auth.getSession();
    if (session) {
        window.currentUser = session.user;
        await updateUserDisplay(session.user);
    }
}

// Sincroniza el perfil y actualiza la UI
async function updateUserDisplay(user) {
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        const userName = user.user_metadata?.full_name || user.email;
        sidebarUsername.textContent = userName;
    }

    const perfilEmail = document.getElementById('perfil-email');
    if (perfilEmail) {
        perfilEmail.value = user.email;
    }

    // Tu función original de DB
    await createOrUpdateCaseroProfile(user);
}

// Crea o actualiza el perfil en la tabla 'perfiles' (Tu lógica original)
async function createOrUpdateCaseroProfile(user) {
    try {
        const perfilData = {
            id: user.id,
            email: user.email,
            nombre: user.user_metadata?.full_name || null,
            rol: 'casero'
        };

        const { data: existing } = await window._supabase
            .from('perfiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (existing) {
            await window._supabase
                .from('perfiles')
                .update({ email: perfilData.email, nombre: perfilData.nombre, rol: perfilData.rol })
                .eq('id', user.id);
            console.log("✅ Perfil sincronizado");
        } else {
            await window._supabase
                .from('perfiles')
                .insert([perfilData]);
            console.log("✅ Perfil creado por primera vez");
        }
    } catch (error) {
        console.error("❌ Error sincronizando perfil:", error);
    }
}

// --- FUNCIONES GLOBALES REFORZADAS ---

window.loginWithGoogle = async () => {
    console.log("🚀 Redirigiendo a Google...");
    const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Usamos una ruta dinámica para que funcione siempre, 
            // tanto en local como en GitHub Pages
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) console.error("❌ Error:", error.message);
};

window.logout = async () => {
    console.log("👋 Cerrando sesión...");
    await window._supabase.auth.signOut();
    window.currentUser = null;
    // Reinicio total a la URL limpia para evitar que la PWA se quede pillada
    window.location.href = window.location.origin + window.location.pathname;
};

window.initAuth = initAuth;
