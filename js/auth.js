/**
 * js/auth.js - Gestión de Autenticación Global
 */

async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // 1. Escuchar cambios en la sesión (Login/Logout/Retorno de Google)
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);

        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;

            // Actualizar interfaz
            updateUserDisplay(session.user);

            // Cambiar de pantalla de Login a App
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');

            if (loginPage && appContent) {
                loginPage.classList.add('hidden');
                appContent.classList.remove('hidden');
                console.log("🖥️ Pantalla cambiada a la APP");
                
                // Si acabamos de entrar, forzamos cargar la primera página
                if (window.showPage) window.showPage('propiedades');
            }
        } else {
            // Si no hay sesión, asegurar que estamos en login
            window.currentUser = null;
        }
    });

    // 2. Verificación inmediata (por si ya hay una sesión activa al refrescar)
    const { data: { session } } = await window._supabase.auth.getSession();
    if (session) {
        console.log("🏠 Sesión previa recuperada");
        window.currentUser = session.user;
        updateUserDisplay(session.user);
    }
}

// Actualiza el nombre del usuario en la interfaz
async function updateUserDisplay(user) {
    // Nombre en el sidebar
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        const userName = user.user_metadata?.full_name || user.email;
        sidebarUsername.textContent = userName;
    }

    // Email en el formulario de perfil
    const perfilEmail = document.getElementById('perfil-email');
    if (perfilEmail) {
        perfilEmail.value = user.email;
    }

    // Asegurar que el perfil existe en la base de datos
    await createOrUpdateCaseroProfile(user);
}

// Crea o actualiza el perfil en la tabla 'perfiles'
async function createOrUpdateCaseroProfile(user) {
    try {
        const perfilData = {
            id: user.id,
            email: user.email,
            nombre: user.user_metadata?.full_name || null,
            rol: 'casero'
        };

        // Verificamos si existe
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

// --- FUNCIONES GLOBALES (Para que ui.js las vea) ---

window.loginWithGoogle = async () => {
    console.log("🚀 Lanzando bumerán a Google...");
    const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://housezenapp.github.io/caserozen/'
        }
    });
    if (error) console.error("❌ Error en el inicio de sesión:", error.message);
};

window.logout = async () => {
    console.log("👋 Cerrando sesión...");
    await window._supabase.auth.signOut();
    window.currentUser = null;
    location.reload(); // Recargamos para limpiar todo rastro de datos en memoria
};

// Exponer inicializador
window.initAuth = initAuth;
