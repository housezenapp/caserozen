// 1. Esta función es la que lanza la ventanita de Google
async function loginWithGoogle() {
    try {
        console.log("Iniciando flujo de Google...");
        // Usamos window._supabase porque lo creamos globalmente en app.js
        const { error } = await window._supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Esto redirige a la misma página donde estás
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error("Error en login:", err.message);
        alert("Error al conectar con Google: " + err.message);
    }
}

// 2. El "Portero": Se ejecuta cuando la web carga
export async function initAuth() {
    console.log("Portero activado...");

    // VINCULACIÓN DEL BOTÓN: 
    // Como el HTML no "ve" la función por ser un módulo, la asignamos aquí a mano
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) {
        btn.onclick = loginWithGoogle;
        console.log("Botón de Google vinculado correctamente");
    }

    // Comprobamos si el usuario ya estaba logueado
    const { data: { session } } = await window._supabase.auth.getSession();
    
    if (session) {
        window.currentUser = session.user;
        await ensureCaseroProfile();
        showApp();
    } else {
        showLogin();
    }

    // Escuchamos si entra o sale
    window._supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            window.currentUser = session.user;
            showApp();
        } else if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });
}

// 3. Crea tu ficha en la tabla 'caseros' si eres nuevo
async function ensureCaseroProfile() {
    if (!window.currentUser) return;
    
    const { id, email, user_metadata } = window.currentUser;
    
    // El 'upsert' inserta si no existe o actualiza si ya existe
    await window._supabase.from('caseros').upsert({
        id: id,
        email: email,
        nombre_completo: user_metadata?.full_name || ''
    });
}

// 4. Funciones de control de pantalla
function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    
    const name = window.currentUser?.user_metadata?.full_name || window.currentUser?.email;
    const display = document.getElementById('sidebar-username');
    if (display) display.textContent = name;
}

// Hacemos el logout accesible para el menú lateral
window.logout = async () => {
    await window._supabase.auth.signOut();
    window.location.reload();
};
