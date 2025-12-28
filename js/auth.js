// 1. Lógica de inicio con Google
async function loginWithGoogle() {
    await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
}

// 2. El Portero (initAuth)
export async function initAuth() {
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) btn.onclick = loginWithGoogle;

    // Esta función centraliza la entrada a la app
    const handleAuth = async (session) => {
        if (session) {
            window.currentUser = session.user;

            // Limpia el enlace largo de Google en la barra de direcciones
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }

            // Cambia la interfaz visual
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';

            // Actualiza nombre en el menú
            const nameDisplay = document.getElementById('sidebar-username');
            if (nameDisplay) nameDisplay.textContent = session.user.user_metadata?.full_name || session.user.email;

            // Registro silencioso en la tabla 'caseros'
            await window._supabase.from('caseros').upsert({
                id: session.user.id,
                email: session.user.email,
                nombre_completo: session.user.user_metadata?.full_name || ''
            });

            // CARGA DE PROPIEDADES (Importación dinámica)
            try {
                const { loadProperties } = await import('./properties.js');
                loadProperties();
            } catch (err) {
                console.error("Error cargando propiedades:", err);
            }
        } else {
            // Si no hay sesión, muestra el login
            document.getElementById('login-page').style.display = 'flex';
            document.getElementById('app-content').style.display = 'none';
        }
    };

    // ESCUCHA ACTIVA: Detecta sesión al cargar y cuando cambia el estado
    const { data } = await window._supabase.auth.getSession();
    handleAuth(data.session);

    window._supabase.auth.onAuthStateChange((_event, session) => {
        handleAuth(session);
    });
}

// 3. Función de Logout accesible desde el menú
window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
