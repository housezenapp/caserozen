
/**
 * js/auth.js - Gestión de Autenticación Global
 */

async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // 1. Escuchar cambios en la sesión (Login/Logout/Retorno de Google/Token Refresh)
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);

        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;

            // Actualizar interfaz
            await updateUserDisplay(session.user);

            // Cambiar de pantalla de Login a App
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');

            if (loginPage && appContent) {
                loginPage.classList.add('hidden');
                appContent.classList.remove('hidden');
                console.log("🖥️ Pantalla cambiada a la APP");
                
                // Si acabamos de entrar o refrescamos token, cargar datos
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (window.showPage) window.showPage('incidencias');
                }
            }
        } else {
            // Si no hay sesión, asegurar que estamos en login
            window.currentUser = null;
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');
            if (loginPage && appContent) {
                loginPage.classList.remove('hidden');
                appContent.classList.add('hidden');
            }
        }
    });

    // 2. Verificación inmediata (por si ya hay una sesión activa al refrescar)
    const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
    
    if (session && !sessionError) {
        console.log("🏠 Sesión previa recuperada");
        window.currentUser = session.user;
        await updateUserDisplay(session.user);
        
        // Cambiar de pantalla de Login a App si hay sesión
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');
        
        if (loginPage && appContent) {
            loginPage.classList.add('hidden');
            appContent.classList.remove('hidden');
            console.log("🖥️ Pantalla cambiada a la APP (sesión recuperada)");
            
            // Cargar la página de incidencias por defecto
            if (window.showPage) window.showPage('incidencias');
        }
    } else {
        // No hay sesión válida, asegurar que estamos en login
        window.currentUser = null;
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');
        if (loginPage && appContent) {
            loginPage.classList.remove('hidden');
            appContent.classList.add('hidden');
        }
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

// Función para verificar y refrescar la sesión
async function checkAndRefreshSession() {
    try {
        const { data: { session }, error } = await window._supabase.auth.getSession();
        
        if (error) {
            console.error("❌ Error al verificar sesión:", error);
            window.currentUser = null;
            return false;
        }
        
        if (!session) {
            console.log("⚠️ No hay sesión activa");
            window.currentUser = null;
            return false;
        }
        
        // Verificar si el token está próximo a expirar (menos de 5 minutos)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        if (timeUntilExpiry < 300) { // 5 minutos
            console.log("🔄 Token próximo a expirar, refrescando...");
            const { data: { session: newSession }, error: refreshError } = await window._supabase.auth.refreshSession();
            
            if (refreshError || !newSession) {
                console.error("❌ Error al refrescar sesión:", refreshError);
                window.currentUser = null;
                return false;
            }
            
            window.currentUser = newSession.user;
            return true;
        }
        
        window.currentUser = session.user;
        return true;
    } catch (error) {
        console.error("❌ Error al verificar sesión:", error);
        window.currentUser = null;
        return false;
    }
}

// Listener para detectar cuando la pestaña vuelve a estar activa
function setupVisibilityListener() {
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            // La pestaña volvió a estar activa
            console.log("👁️ Pestaña activa, verificando sesión...");
            const hasValidSession = await checkAndRefreshSession();
            
            if (!hasValidSession) {
                // Sesión expirada, redirigir a login
                const loginPage = document.getElementById('login-page');
                const appContent = document.getElementById('app-content');
                if (loginPage && appContent) {
                    loginPage.classList.remove('hidden');
                    appContent.classList.add('hidden');
                }
                if (window.showToast) window.showToast("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            } else {
                // Recargar datos si estamos en una página que los muestra
                const activePage = document.querySelector('.page.active');
                if (activePage) {
                    const pageId = activePage.id;
                    if (pageId === 'page-incidencias' && typeof window.loadIncidents === 'function') {
                        window.loadIncidents();
                    } else if (pageId === 'page-propiedades' && typeof window.loadProperties === 'function') {
                        window.loadProperties();
                    }
                }
            }
        }
    });
}

// Exponer funciones
window.initAuth = initAuth;
window.checkAndRefreshSession = checkAndRefreshSession;
window.setupVisibilityListener = setupVisibilityListener;