async function initAuth() {
    try {
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error);
            showLogin();
            return;
        }

        if (session) {
            currentUser = session.user;
            showApp();
        } else {
            showLogin();
        }

        _supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);

            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                showApp();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLogin();
            } else if (event === 'TOKEN_REFRESHED' && session) {
                currentUser = session.user;
            }
        });

        authInitialized = true;
    } catch (err) {
        console.error('Init auth error:', err);
        showLogin();
    }
}

async function loginWithGoogle() {
    const currentUrl = window.location.href.split('?')[0].split('#')[0];

    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: currentUrl,
            skipBrowserRedirect: false,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    });

    if (error) {
        console.error('Auth error:', error);
        showToast('Error al iniciar sesión: ' + error.message);
    }
}

async function logout() {
    const { error } = await _supabase.auth.signOut();
    if (!error) {
        showToast('Sesión cerrada');
        currentUser = null;
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    if (currentUser) {
        const displayName = currentUser.user_metadata?.full_name || currentUser.email;
        document.getElementById('sidebar-username').textContent = displayName;

        loadDashboard();
        loadProfile();
    }
}
