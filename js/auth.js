// js/auth.js
export async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // Este es el bumerán: atrapa la sesión cuando vuelves de Google
    window._supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);
        
        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;
            
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
    }
}

window.loginWithGoogle = async () => {
    console.log("🚀 Lanzando bumerán a Google...");
    const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Usa la URL exacta que Google espera
            redirectTo: 'https://caserav.github.io/caserozen/'
        }
    });
    if (error) console.error("❌ Error en la salida:", error.message);
};
