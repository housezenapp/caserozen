// Hacemos que la función sea accesible desde el HTML
window.loginWithGoogle = async () => {
    try {
        console.log('init login...');
        const { error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Esto detecta automáticamente si estás en local o en GitHub
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error('Error:', err.message);
    }
};

window.logout = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

export async function initAuth() {
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (session) {
        window.currentUser = session.user;
        await ensureCaseroProfile();
        showApp();
    } else {
        showLogin();
    }

    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            window.currentUser = session.user;
            showApp();
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });
}

async function ensureCaseroProfile() {
    if (!window.currentUser) return;
    const { id, email, user_metadata } = window.currentUser;
    
    await _supabase.from('caseros').upsert({
        id: id,
        email: email,
        nombre_completo: user_metadata?.full_name || ''
    });
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    const name = window.currentUser?.user_metadata?.full_name || window.currentUser?.email;
    document.getElementById('sidebar-username').textContent = name;
}
