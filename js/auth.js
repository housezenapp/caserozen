async function initAuth() {
    try {
        console.log('🔄 Iniciando autenticación...');
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error('❌ Session error:', error);
            showLogin();
            return;
        }

        if (session) {
            console.log('✅ Sesión encontrada:', session.user.email);
            currentUser = session.user;
            await ensureCaseroProfile();
            showApp();
        } else {
            console.log('ℹ️ No hay sesión activa');
            showLogin();
        }

        _supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 Auth state changed:', event, session?.user?.email);

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
        console.error('❌ Init auth error:', err);
        showLogin();
    }
}

async function loginWithEmail(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Login error:', error);
        showToast('Error: ' + error.message);
        return false;
    }

    return true;
}

async function registerWithEmail(email, password) {
    const { data, error } = await _supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error('Register error:', error);
        showToast('Error: ' + error.message);
        return false;
    }

    showToast('¡Cuenta creada! Iniciando sesión...');
    return true;
}

async function loginWithGoogle() {
    try {
        showToast('Redirigiendo a Google...');

        const { data, error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'https://caserav.github.io/caserozen/'
            }
        });

        if (error) {
            console.error('❌ Google login error:', error);
            showToast('Error: ' + error.message);
            return false;
        }

        console.log('✅ Redirigiendo a Google OAuth...');
        return true;
    } catch (err) {
        console.error('❌ Error inesperado:', err);
        showToast('Error al conectar con Google');
        return false;
    }
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

        loadIncidents();
        loadProfile();
    }
}
