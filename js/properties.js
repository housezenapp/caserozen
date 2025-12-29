/**
 * js/properties.js - Gestión de Propiedades Vinculadas
 */
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

async function isCodeUnique(code) {
    const { data } = await window._supabase
        .from('propiedades')
        .select('id')
        .eq('referencia', code)
        .maybeSingle();
    return !data;
}

export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container || !window.currentUser) return;

    container.innerHTML = '<div class="loading-state">Cargando...</div>';

    try {
        const { data: properties, error } = await window._supabase
            .from('propiedades')
            .select('*')
            .eq('casero_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(properties || []);
    } catch (error) {
        console.error('Error cargando propiedades:', error);
    }
}

function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (properties.length === 0) {
        container.innerHTML = '<p class="empty-list">No tienes propiedades registradas.</p>';
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card" id="prop-${prop.id}">
            <div class="property-header">
                <div>
                    <strong>${prop.nombre}</strong>
                    <div class="addr">${prop.direccion_completa}</div>
                </div>
                <button class="delete-btn" onclick="deleteProperty('${prop.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="property-code-box">
                <small>Código Inquilino:</small>
                <code>${prop.referencia}</code>
            </div>
        </div>
    `).join('');
}

export async function openPropertyModal() {
    const modal = document.getElementById('property-form-modal');
    const refInput = document.getElementById('property-reference');
    if (!modal) return;

    document.getElementById('propertyForm').reset();
    modal.style.display = 'flex';

    if (refInput) {
        refInput.value = 'Generando...';
        let code = generatePropertyCode();
        while (!(await isCodeUnique(code))) {
            code = generatePropertyCode();
        }
        refInput.value = code;
    }
}

export function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) modal.style.display = 'none';
}

export async function handlePropertySubmit(e) {
    e.preventDefault();
    if (!window.currentUser) return alert("Sesión no válida");

    const propertyData = {
        casero_id: window.currentUser.id, // ID REAL DE GOOGLE
        nombre: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        referencia: document.getElementById('property-reference').value
    };

    const { error } = await window._supabase.from('propiedades').insert([propertyData]);

    if (error) {
        alert("Error al guardar: " + error.message);
    } else {
        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast("Propiedad guardada");
    }
}

window.deleteProperty = async (id) => {
    if (!confirm('¿Eliminar propiedad?')) return;
    const { error } = await window._supabase.from('propiedades').delete().eq('id', id);
    if (!error) loadProperties();
};
