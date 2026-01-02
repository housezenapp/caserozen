/**
 * js/properties.js - Gestión de Datos de Propiedades
 */

// 1. Generador de código único (Interno)
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// 2. Carga de propiedades desde Supabase
async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando tus propiedades...</div>';

    if (!window.currentUser) {
        container.innerHTML = '<p class="error-msg">Debes iniciar sesión para ver tus propiedades.</p>';
        return;
    }

    try {
        const { data, error } = await window._supabase
            .from('propiedades')
            .select('*')
            .eq('perfil_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(data || []);
    } catch (error) {
        console.error('❌ Error al cargar propiedades:', error);
        container.innerHTML = '<p class="error-msg">Error al conectar con la base de datos.</p>';
    }
}

// 3. Renderizado
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (!container) return;
    
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

// 4. Lógica del Modal
async function openPropertyModal() {
    const modal = document.getElementById('property-form-modal');
    const refInput = document.getElementById('property-reference');
    if (!modal) return;

    document.getElementById('propertyForm').reset();
    
    if (refInput) {
        refInput.value = generatePropertyCode();
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// 5. Guardado
async function handlePropertySubmit(e) {
    if (e) e.preventDefault();

    if (!window.currentUser) {
        alert("Error: No se detectó sesión activa.");
        return;
    }

    const codigoVinculacion = document.getElementById('property-reference').value;

    const propertyData = {
        id: codigoVinculacion, 
        perfil_id: window.currentUser.id,
        nombre_propiedad: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        codigo_vinculacion: codigoVinculacion
    };

    try {
        const { error } = await window._supabase
            .from('propiedades')
            .insert([propertyData]);

        if (error) throw error;

        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast("Propiedad registrada");

    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert("Error al guardar: " + error.message);
    }
}

// --- EXPOSICIÓN GLOBAL ---
window.loadProperties = loadProperties;
window.openPropertyModal = openPropertyModal;
window.closePropertyModal = closePropertyModal;
window.handlePropertySubmit = handlePropertySubmit;

window.deleteProperty = async (id) => {
    if (!confirm("¿Eliminar propiedad?")) return;
    try {
        const { error } = await window._supabase
            .from('propiedades')
            .delete()
            .eq('id', id);
        if (error) throw error;
        loadProperties();
        if (window.showToast) window.showToast("Propiedad eliminada");
    } catch (error) {
        alert("Error al eliminar.");
    }
};
