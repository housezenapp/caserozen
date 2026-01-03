
/**
 * js/auth.js - Gestión de Autenticación Global
 */

async function initAuth() {
    console.log("🕵️ Vigilante de sesión activado...");

    // 1. Escuchar cambios en la sesión (Login/Logout/Retorno de Google/Token Refresh)
    window._supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔔 Cambio de estado detectado:", event);

        if (session) {
            console.log("✅ Usuario detectado:", session.user.email);
            window.currentUser = session.user;

            // Actualizar interfaz
            await updateUserDisplay(session.user);

            // Cambiar de pantalla de Login a App
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');

            if (loginPage && appContent) {
                loginPage.classList.add('hidden');
                appContent.classList.remove('hidden');
                console.log("🖥️ Pantalla cambiada a la APP");
                
                // Si acabamos de entrar o refrescamos token, cargar datos
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (window.showPage) window.showPage('incidencias');
                }
            }
        } else {
            // Si no hay sesión, asegurar que estamos en login
            window.currentUser = null;
            const loginPage = document.getElementById('login-page');
            const appContent = document.getElementById('app-content');
            if (loginPage && appContent) {
                loginPage.classList.remove('hidden');
                appContent.classList.add('hidden');
            }
        }
    });

    // 2. Verificación inmediata (por si ya hay una sesión activa al refrescar)
    const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
    
    if (session && !sessionError) {
        console.log("🏠 Sesión previa recuperada");
        
        // Verificar que la sesión sigue siendo válida
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        if (timeUntilExpiry < 60) { // Si expira en menos de 1 minuto, cerrar sesión
            console.log("⚠️ Sesión expirada, cerrando...");
            await forceLogout();
            return;
        }
        
        window.currentUser = session.user;
        await updateUserDisplay(session.user);
        
        // Cambiar de pantalla de Login a App si hay sesión
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');
        
        if (loginPage && appContent) {
            loginPage.classList.add('hidden');
            appContent.classList.remove('hidden');
            console.log("🖥️ Pantalla cambiada a la APP (sesión recuperada)");
            
            // Esperar un momento para que todos los scripts se hayan cargado
            setTimeout(async () => {
                // Verificar nuevamente la sesión antes de cargar
                const hasValidSession = await checkAndRefreshSession();
                if (!hasValidSession) {
                    return; // forceLogout ya fue llamado
                }
                
                // Verificar si el contenedor está vacío o tiene estado de carga persistente
                const incidentsContainer = document.getElementById('incidents-logistics-container');
                const propertiesContainer = document.getElementById('properties-container');
                
                const activePage = document.querySelector('.page.active');
                const pageId = activePage ? activePage.id : null;
                
                // Cargar datos según la página activa
                if (pageId === 'page-incidencias' || !pageId) {
                    // Si no hay contenido o solo hay loading, cargar incidencias
                    if (!incidentsContainer || !incidentsContainer.innerHTML.trim() || incidentsContainer.querySelector('.loading-state')) {
                        console.log("📥 Cargando incidencias (sesión recuperada)...");
                        if (typeof window.loadIncidents === 'function') {
                            await window.loadIncidents();
                        } else if (typeof window.showPage === 'function') {
                            window.showPage('incidencias');
                        }
                    }
                } else if (pageId === 'page-propiedades') {
                    if (!propertiesContainer || !propertiesContainer.innerHTML.trim() || propertiesContainer.querySelector('.loading-state')) {
                        console.log("📥 Cargando propiedades (sesión recuperada)...");
                        if (typeof window.loadProperties === 'function') {
                            await window.loadProperties();
                        } else if (typeof window.showPage === 'function') {
                            window.showPage('propiedades');
                        }
                    }
                } else {
                    // Usar showPage como fallback
                    if (typeof window.showPage === 'function') {
                        window.showPage('incidencias');
                    }
                }
            }, 200); // Aumentar a 200ms para dar más tiempo
        }
    } else {
        // No hay sesión válida, asegurar que estamos en login
        window.currentUser = null;
        const loginPage = document.getElementById('login-page');
        const appContent = document.getElementById('app-content');
        if (loginPage && appContent) {
            loginPage.classList.remove('hidden');
            appContent.classList.add('hidden');
        }
    }
}

// Actualiza el nombre del usuario en la interfaz
async function updateUserDisplay(user) {
    // Nombre en el sidebar
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        const userName = user.user_metadata?.full_name || user.email;
        sidebarUsername.textContent = userName;
    }

    // Email en el formulario de perfil
    const perfilEmail = document.getElementById('perfil-email');
    if (perfilEmail) {
        perfilEmail.value = user.email;
    }

    // Asegurar que el perfil existe en la base de datos
    await createOrUpdateCaseroProfile(user);
}

// Crea o actualiza el perfil en la tabla 'perfiles'
async function createOrUpdateCaseroProfile(user) {
    try {
        const perfilData = {
            id: user.id,
            email: user.email,
            nombre: user.user_metadata?.full_name || null,
            rol: 'casero'
        };

        // Verificamos si existe
        const { data: existing } = await window._supabase
            .from('perfiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (existing) {
            await window._supabase
                .from('perfiles')
                .update({ email: perfilData.email, nombre: perfilData.nombre, rol: perfilData.rol })
                .eq('id', user.id);
            console.log("✅ Perfil sincronizado");
        } else {
            await window._supabase
                .from('perfiles')
                .insert([perfilData]);
            console.log("✅ Perfil creado por primera vez");
        }
    } catch (error) {
        console.error("❌ Error sincronizando perfil:", error);
    }
}

// --- FUNCIONES GLOBALES (Para que ui.js las vea) ---

window.loginWithGoogle = async () => {
    console.log("🚀 Lanzando inicio de sesión con Google...");
    
    // Verificar que Supabase esté inicializado
    if (!window._supabase) {
        console.error("❌ Supabase no está inicializado");
        throw new Error("La conexión a la base de datos no está disponible");
    }
    
    try {
        const { data, error } = await window._supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        
        if (error) {
            console.error("❌ Error en el inicio de sesión:", error);
            throw error;
        }
        
        console.log("✅ Redirección a Google iniciada correctamente");
        return data;
    } catch (error) {
        console.error("❌ Error completo al iniciar sesión con Google:", error);
        throw error;
    }
};

window.logout = async () => {
    console.log("👋 Cerrando sesión...");
    await window._supabase.auth.signOut();
    window.currentUser = null;
    location.reload(); // Recargamos para limpiar todo rastro de datos en memoria
};

// Función para forzar cierre de sesión cuando hay problemas
async function forceLogout() {
    console.log("🚨 Forzando cierre de sesión debido a problemas de autenticación...");
    window.currentUser = null;
    
    try {
        await window._supabase.auth.signOut();
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
    
    // Cambiar a pantalla de login
    const loginPage = document.getElementById('login-page');
    const appContent = document.getElementById('app-content');
    if (loginPage && appContent) {
        loginPage.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
    
    if (window.showToast) {
        window.showToast("Sesión cerrada. Por favor, inicia sesión nuevamente.");
    }
}

// Función para verificar y refrescar la sesión
async function checkAndRefreshSession() {
    try {
        const { data: { session }, error } = await window._supabase.auth.getSession();
        
        if (error) {
            console.error("❌ Error al verificar sesión:", error);
            await forceLogout();
            return false;
        }
        
        if (!session) {
            console.log("⚠️ No hay sesión activa");
            window.currentUser = null;
            return false;
        }
        
        // Verificar si el token está próximo a expirar (menos de 5 minutos)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        if (timeUntilExpiry < 300) { // 5 minutos
            console.log("🔄 Token próximo a expirar, refrescando...");
            const { data: { session: newSession }, error: refreshError } = await window._supabase.auth.refreshSession();
            
            if (refreshError || !newSession) {
                console.error("❌ Error al refrescar sesión:", refreshError);
                await forceLogout();
                return false;
            }
            
            window.currentUser = newSession.user;
            return true;
        }
        
        window.currentUser = session.user;
        return true;
    } catch (error) {
        console.error("❌ Error al verificar sesión:", error);
        await forceLogout();
        return false;
    }
}

// Listener para detectar cuando la pestaña pierde el foco - CERRAR SESIÓN AUTOMÁTICAMENTE
function setupVisibilityListener() {
    let logoutTimeout = null;
    let isLoggingOut = false;
    
    const triggerLogout = async () => {
        if (isLoggingOut) return; // Evitar múltiples cierres simultáneos
        isLoggingOut = true;
        console.log("🚪 Cerrando sesión automáticamente...");
        
        if (typeof window.forceLogout === 'function') {
            await window.forceLogout();
        } else if (typeof window.logout === 'function') {
            await window.logout();
        }
    };
    
    const scheduleLogout = (reason) => {
        if (logoutTimeout) {
            clearTimeout(logoutTimeout);
        }
        console.log(`👋 ${reason}, programando cierre de sesión en 1 segundo...`);
        
        logoutTimeout = setTimeout(() => {
            triggerLogout();
        }, 1000);
    };
    
    const cancelLogout = () => {
        if (logoutTimeout) {
            clearTimeout(logoutTimeout);
            logoutTimeout = null;
            console.log("✅ Operación cancelada, no se cerrará sesión");
        }
    };
    
    // Evento principal: cuando la pestaña se oculta/muestra
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pestaña oculta (cambio de pestaña o minimizar ventana)
            scheduleLogout("Pestaña oculta");
        } else {
            // Pestaña visible de nuevo
            cancelLogout();
        }
    });
    
    // Para escritorio: cuando la ventana pierde/gana el foco
    window.addEventListener('blur', () => {
        // Solo activar si la pestaña también está oculta
        // En escritorio, blur puede dispararse aunque la pestaña siga visible
        if (document.hidden) {
            scheduleLogout("Ventana perdió el foco");
        }
    });
    
    window.addEventListener('focus', () => {
        cancelLogout();
    });
    
    // Para móvil: cuando la app pasa a segundo plano
    window.addEventListener('pagehide', () => {
        scheduleLogout("Página oculta (móvil)");
    });
    
    // Detectar cuando cambias de pestaña en el mismo navegador (especialmente en escritorio)
    window.addEventListener('beforeunload', () => {
        // Cancelar el timeout ya que la página se está recargando/navegando
        if (logoutTimeout) {
            clearTimeout(logoutTimeout);
        }
    });
    
    console.log("✅ Listener de visibilidad configurado para móvil y escritorio");
}

// Exponer funciones
window.initAuth = initAuth;
window.checkAndRefreshSession = checkAndRefreshSession;
window.setupVisibilityListener = setupVisibilityListener;
window.forceLogout = forceLogout;