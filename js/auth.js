/**
 * js/auth.js - Gestión de Identidad Real
 */
export async function initAuth() {
    // 1. Verificar si ya existe una sesión activa
    const { data: { session }, error } = await window._supabase.auth.getSession();
    
    if (session && session.user) {
        window.currentUser = session.user;
        updateUIWithUser(session.user);
    } else {
        setupLoginButton();
    }

    // 2. Escuchar cambios en el estado de autenticación
    window._supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            window.currentUser = session.user;
            updateUIWithUser(session.user);
        } else if (event === 'SIGNED_OUT') {
            window.currentUser = null;
            location.reload();
        }
    });
}

function setupLoginButton() {
    const loginBtn = document.getElementById('google-login-btn');
    if (loginBtn) {
        loginBtn.onclick = async () => {
            const { error } = await window._supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin 
                }
            });
            if (error) alert("Error al conectar con Google: " + error.message);
        };
    }
}

function updateUIWithUser(user) {
    const authSection = document.getElementById('auth-section');
    const mainApp = document.getElementById('main-app');
    
    if (authSection) authSection.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');

    // Actualizar datos del perfil en el sidebar
    const userEmailEl = document.getElementById('user-email');
    const userNameEl = document.getElementById('sidebar-username');
    
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (userNameEl) userNameEl.textContent = user.user_metadata?.full_name || 'Casero';
}

export async function logout() {
    const { error } = await window._supabase.auth.signOut();
    if (error) console.error("Error logout:", error.message);
}
