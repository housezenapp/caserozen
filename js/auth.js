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
async function updateUserDisplay(user) {
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

    // Crear o actualizar registro en la tabla caseros
    await createOrUpdateCaseroProfile(user);
}

// Crea o actualiza el perfil del casero en la base de datos
async function createOrUpdateCaseroProfile(user) {
    try {
        console.log("🔍 Verificando perfil para usuario:", user.id);

        // Verificar si ya existe un perfil
        const { data: existing, error: selectError } = await window._supabase
            .from('perfiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (selectError && selectError.code !== 'PGRST116') {
            console.error("❌ Error al verificar perfil:", selectError);
            return;
        }

        // Datos del perfil según la estructura de la tabla perfiles
        const perfilData = {
            id: user.id,
            email: user.email,
            nombre: user.user_metadata?.full_name || null,
            rol: 'casero' // <--- LÍNEA AÑADIDA
            
        };

        console.log("📦 Datos a guardar:", perfilData);

        if (existing) {
            console.log("📝 Perfil ya existe, actualizando...");
            // Actualizar perfil existente
            const { error: updateError } = await window._supabase
                .from('perfiles')
                .update({ email: perfilData.email, nombre: perfilData.nombre, rol: perfilData.rol })
                .eq('id', user.id);

            if (updateError) {
                console.error("❌ Error al actualizar perfil:", updateError);
                console.error("Detalles:", updateError.message, updateError.details);
            } else {
                console.log("✅ Perfil actualizado correctamente");
            }
        } else {
            console.log("➕ Perfil no existe, creando nuevo...");
            // Crear nuevo perfil
            const { data, error: insertError } = await window._supabase
                .from('perfiles')
                .insert([perfilData])
                .select();

            if (insertError) {
                console.error("❌ Error al crear perfil:", insertError);
                console.error("Detalles:", insertError.message, insertError.details, insertError.hint);
            } else {
                console.log("✅ Perfil creado correctamente:", data);
            }
        }
    } catch (error) {
        console.error("❌ Error en createOrUpdateCaseroProfile:", error);
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
