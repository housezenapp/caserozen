/**
 * js/auth.js - Gestión de Identidad y Sesión
 */

// 1. Funciones globales para que ui.js y el HTML las encuentren
window.loginWithGoogle = async () => {
    console.log("Iniciando Google Auth...");
    const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) console.error("Error en el inicio de sesión:", error.message);
};

window.logout = async () => {
    console.log("Cerrando sesión...");
    const { error } = await window._supabase.auth.signOut();
    if (error) console.error("Error al cerrar sesión:", error.message);
    location.reload();
};

// 2. Inicialización y escucha de cambios
export async function initAuth() {
    // Escuchar cambios de estado (Login/Logout)
    window._supabase.auth.onAuthStateChange((event, session) => {
        console.log("Evento de Auth detectado:", event);
        if (session) {
            window.currentUser = session.user;
            toggleScreens(true);
        } else {
            window.currentUser = null;
            toggleScreens(false);
        }
    });

    // Verificar si ya hay una sesión al cargar la página
    const { data: { session } } = await window._supabase.auth.getSession();
    if (session) {
        window.currentUser = session.user;
        toggleScreens(true);
    }
}

// 3. Control visual de pantallas (Login vs App)
function toggleScreens(isLoggedIn) {
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');

    if (isLoggedIn) {
        if (loginPage) loginPage.classList.add('hidden');
        if (appContent) appContent.classList.remove('hidden');
        
        // Actualizar datos de perfil si existen
        const emailEl = document.getElementById('user-email');
        if (emailEl && window.currentUser) {
            emailEl.textContent = window.currentUser.email;
        }
    } else {
        if (loginPage) loginPage.classList.remove('hidden');
        if (appContent) appContent.classList.add('hidden');
    }
}
