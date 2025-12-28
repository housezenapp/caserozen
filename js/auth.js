async function loginWithGoogle() {
    console.log("Intentando conectar con Google en:", window._supabase.supabaseUrl);
    const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) console.error("Error detallado de Supabase:", error);
}

export async function initAuth() {
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) btn.onclick = loginWithGoogle;

    const handleAuth = async (session) => {
        if (session) {
            window.currentUser = session.user;
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
            
            const nameDisplay = document.getElementById('sidebar-username');
            if (nameDisplay) nameDisplay.textContent = session.user.user_metadata?.full_name || session.user.email;

            await window._supabase.from('caseros').upsert({
                id: session.user.id,
                email: session.user.email,
                nombre_completo: session.user.user_metadata?.full_name || ''
            });

            try {
                const { loadProperties } = await import('./properties.js');
                loadProperties();
            } catch (err) { console.error("Error propiedades:", err); }
        } else {
            document.getElementById('login-page').style.display = 'flex';
            document.getElementById('app-content').style.display = 'none';
        }
    };

    const { data } = await window._supabase.auth.getSession();
    handleAuth(data.session);

    window._supabase.auth.onAuthStateChange((_event, session) => {
        handleAuth(session);
    });
}

window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.href = window.location.origin + window.location.pathname;
};
