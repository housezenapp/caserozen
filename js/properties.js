/**
 * js/properties.js - Gestión de Datos de Propiedades
 */

// 1. Generador de código único (Formato: 1234ABC)
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// 2. Carga de propiedades desde Supabase
export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    // Mostrar estado de carga
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando tus propiedades...</div>';

    if (!window.currentUser) {
        container.innerHTML = '<p class="error-msg">Debes iniciar sesión para ver tus propiedades.</p>';
        return;
    }

    try {
        console.log('🏠 Cargando propiedades para el usuario:', window.currentUser.id);

        const { data, error } = await window._supabase
            .from('propiedades')
            .select('*')
            .eq('perfil_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error al cargar propiedades:', error);
            throw error;
        }

        console.log('✅ Propiedades cargadas:', data);
        renderProperties(data || []);
    } catch (error) {
        console.error('❌ Error al cargar propiedades:', error);
        container.innerHTML = '<p class="error-msg">Error al conectar con la base de datos.</p>';
    }
}

// 3. Renderizado de las tarjetas de propiedad
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <p>Aún no has registrado ninguna propiedad.</p>
                <small>Pulsa el botón "+" para empezar.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card anim-fade-in">
            <div class="property-info">
                <h3>${prop.nombre_propiedad || 'Sin nombre'}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${prop.direccion_completa}</p>
                <div class="property-code">
                    <span>Código de vinculación:</span>
                    <strong class="copy-code" title="Click para copiar">${prop.codigo_vinculacion || prop.id}</strong>
                </div>
            </div>
            <div class="property-actions">
                <button class="btn-icon delete" onclick="deleteProperty('${prop.id}')" title="Eliminar propiedad">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 4. Lógica del Modal (Abrir/Cerrar)
export async function openPropertyModal() {
    const modal = document.getElementById('property-form-modal');
    const refInput = document.getElementById('property-reference');
    if (!modal) return;

    // Resetear formulario
    document.getElementById('propertyForm').reset();
    
    // Generar código visual inmediato
    if (refInput) {
        refInput.value = 'Generando...';
        const newCode = generatePropertyCode();
        refInput.value = newCode;
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
}

export function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// 5. Guardado en Base de Datos
export async function handlePropertySubmit(e) {
    e.preventDefault();

    if (!window.currentUser) {
        alert("Error: No se detectó una sesión activa de Google.");
        return;
    }

    const codigoVinculacion = document.getElementById('property-reference').value;

    const propertyData = {
        id: codigoVinculacion, // El código de vinculación es el ID único
        perfil_id: window.currentUser.id, // ID del usuario autenticado
        nombre_propiedad: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        codigo_vinculacion: codigoVinculacion
    };

    console.log('💾 Guardando propiedad:', propertyData);

    try {
        const { data, error } = await window._supabase
            .from('propiedades')
            .insert([propertyData])
            .select();

        if (error) {
            console.error('❌ Error al guardar propiedad:', error);
            throw error;
        }

        console.log('✅ Propiedad guardada correctamente:', data);

        // Éxito
        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast("Propiedad registrada correctamente");

    } catch (error) {
        console.error('❌ Error completo al guardar:', error);
        console.error('📋 Detalles:', error.message, error.details, error.hint);
        alert("No se pudo guardar la propiedad: " + (error.message || 'Error desconocido'));
    }
}

// 6. Función Global para borrar
window.deleteProperty = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta propiedad? Se perderán todos los datos vinculados.")) return;

    try {
        const { error } = await window._supabase
            .from('propiedades')
            .delete()
            .eq('id', id);

        if (error) throw error;

        loadProperties();
        if (window.showToast) window.showToast("Propiedad eliminada");
    } catch (error) {
        alert("Error al eliminar la propiedad.");
    }
};
