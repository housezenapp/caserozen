// js/auth.js
export async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // Este es el bumerán: atrapa la sesión cuando vuelves de Google
    window._supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);

        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;

            // Actualizar el nombre del usuario en el sidebar
            updateUserDisplay(session.user);

            // Forzamos el cambio de pantalla
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');

            if (loginPage && appContent) {
                loginPage.classList.add('hidden');
                appContent.classList.remove('hidden');
                console.log("🖥️ Pantalla cambiada a la APP");
            } else {
                console.error("❌ ERROR: No encuentro los IDs login-page o app-content en el HTML");
            }
        }
    });

    // Verificación inmediata por si ya estabas logueado
    const { data: { session } } = await window._supabase.auth.getSession();
    if (session) {
        console.log("🏠 Sesión previa recuperada");
        window.currentUser = session.user;
        updateUserDisplay(session.user);
    }
}

// Actualiza el nombre del usuario en la interfaz
function updateUserDisplay(user) {
    // Actualizar nombre en el sidebar (debajo de "Sesión Activa")
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        const userName = user.user_metadata?.full_name || user.email;
        sidebarUsername.textContent = userName;
        console.log("📝 Nombre actualizado en sidebar:", userName);
    }

    // Actualizar email en el perfil
    const perfilEmail = document.getElementById('perfil-email');
    if (perfilEmail) {
        perfilEmail.value = user.email;
        console.log("📧 Email actualizado en perfil:", user.email);
    }
}

window.loginWithGoogle = async () => {
    console.log("🚀 Lanzando bumerán a Google...");
    const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Usa la URL exacta que Google espera
            redirectTo: 'https://housezenapp.github.io/caserozen/'
        }
    });
    if (error) console.error("❌ Error en la salida:", error.message);
};

window.logout = async () => {
    console.log("👋 Cerrando sesión...");
    const { error } = await window._supabase.auth.signOut();

    if (error) {
        console.error("❌ Error al cerrar sesión:", error.message);
        return;
    }

    // Limpiar usuario actual
    window.currentUser = null;

    // Volver a la pantalla de login
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');

    if (loginPage && appContent) {
        appContent.classList.add('hidden');
        loginPage.classList.remove('hidden');
        console.log("🔒 Sesión cerrada, volviendo al login");
    }
};
