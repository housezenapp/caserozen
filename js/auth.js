// Variable global para el usuario
let currentUser = null;

async function initAuth() {
    try {
        console.log('🔄 Iniciando autenticación...');
        // Comprobamos si hay una sesión guardada en el navegador
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (session) {
            console.log('✅ Sesión encontrada:', session.user.email);
            currentUser = session.user;
            await ensureCaseroProfile(); // Nos aseguramos de que esté en la tabla de caseros
            showApp();
        } else {
            showLogin();
        }

        // Este "oído" escucha si el usuario entra o sale en cualquier momento
        _supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await ensureCaseroProfile();
                showApp();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLogin();
            }
        });

    } catch (err) {
        console.error('❌ Error de inicio:', err);
        showLogin();
    }
}

// LOGIN SOLO CON GOOGLE
async function loginWithGoogle() {
    try {
        const { error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Esto hace que funcione tanto en local como en GitHub automáticamente
                redirectTo: window.location.origin + window.location.pathname
            }
        });

        if (error) throw error;
    } catch (err) {
        console.error('❌ Error Google login:', err.message);
        alert('Error al conectar con Google: ' + err.message);
    }
}

// ESTO CREA TU PERFIL EN TU TABLA SI NO EXISTE
async function ensureCaseroProfile() {
    if (!currentUser) return;

    // Buscamos si ya estás en la tabla 'caseros' que creamos con SQL
    const { data: existingProfile } = await _supabase
        .from('caseros')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (!existingProfile) {
        // Si no estás, te insertamos (usamos tu nombre de Google)
        await _supabase.from('caseros').insert({
            id: currentUser.id,
            email: currentUser.email,
            nombre_completo: currentUser.user_metadata?.full_name || 'Nuevo Casero'
        });
    }
}

async function logout() {
    await _supabase.auth.signOut();
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    if (currentUser) {
        // Ponemos tu nombre en la barra lateral
        const name = currentUser.user_metadata?.full_name || currentUser.email;
        const userDisplay = document.getElementById('sidebar-username');
        if (userDisplay) userDisplay.textContent = name;

        // Lanzamos la carga de datos (incidencias y propiedades)
        if (typeof loadIncidents === 'function') loadIncidents();
    }
}
