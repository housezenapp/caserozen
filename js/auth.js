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
            await ensureCaseroProfile();
            showApp();
        } else {
            showLogin();
        }

        _supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await ensureCaseroProfile();
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
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        console.error('Login error:', error);
        showToast('Error: ' + error.message);
        return false;
    }

    return true;
}

async function ensureCaseroProfile() {
    if (!currentUser) return;

    const { data: existingProfile } = await _supabase
        .from('caseros')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (!existingProfile) {
        const { error } = await _supabase
            .from('caseros')
            .insert({
                id: currentUser.id,
                email: currentUser.email,
                nombre_completo: currentUser.user_metadata?.full_name || ''
            });

        if (error && error.code !== '23505') {
            console.error('Error creating casero profile:', error);
        }
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

async function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    if (currentUser) {
        const displayName = currentUser.user_metadata?.full_name || currentUser.email;
        document.getElementById('sidebar-username').textContent = displayName;

        isAdmin = await checkIfAdmin();

        if (isAdmin) {
            console.log('✅ Usuario administrador detectado - Verás TODAS las incidencias');
        } else {
            console.log('ℹ️ Usuario casero - Verás solo incidencias de tus propiedades');
        }

        loadDashboard();
        loadProfile();
    }
}
