/**
 * ARCHIVO DEFINITIVO: js/properties.js
 * Sincronizado con tabla: id, casero_id, nombre, direccion_completa, referencia
 */

// 1. Generador interno de código
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// 2. Comprobar si el código existe en Supabase
async function isCodeUnique(code) {
    const { data } = await window._supabase
        .from('propiedades')
        .select('id')
        .eq('referencia', code)
        .maybeSingle();
    return !data;
}

// 3. Cargar lista de propiedades
export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container || !window.currentUser) return;

    container.innerHTML = '<div class="loading-state">Cargando...</div>';

    try {
        const { data: properties, error } = await window._supabase
            .from('propiedades')
            .select('id, nombre, direccion_completa, referencia')
            .eq('casero_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(properties || []);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 4. Dibujar las tarjetas
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (properties.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No tienes propiedades.</p>';
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card">
            <div class="property-header">
                <div>
                    <strong style="color:#14B8A6; font-size:1.1rem;">${prop.nombre}</strong>
                    <div style="font-size:0.8rem; color:#666;">${prop.direccion_completa}</div>
                </div>
                <button class="icon-btn delete" onclick="deleteProperty('${prop.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #ddd;">
                <small style="color:#999;">Código vinculación:</small>
                <div style="font-family:monospace; font-size:1.2rem; font-weight:bold;">${prop.referencia}</div>
            </div>
        </div>
    `).join('');
}

// 5. Abrir Modal y Generar código VALIDADO
export async function openPropertyModal() {
    const modal = document.getElementById('property-form-modal');
    const form = document.getElementById('propertyForm');
    const refInput = document.getElementById('property-reference');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('property-id').value = '';
    
    if (refInput) {
        refInput.value = 'Validando código...';
        let code;
        let unique = false;
        while (!unique) {
            code = generatePropertyCode();
            unique = await isCodeUnique(code);
        }
        refInput.value = code;
    }

    modal.classList.add('active');
}

// 6. Cerrar Modal
export function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) modal.classList.remove('active');
}

// 7. Guardar en Supabase
export async function handlePropertySubmit(e) {
    e.preventDefault();
    
    const propertyData = {
        casero_id: window.currentUser.id,
        nombre: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        referencia: document.getElementById('property-reference').value
    };

    try {
        const { error } = await window._supabase.from('propiedades').insert([propertyData]);
        if (error) throw error;
        
        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast('Propiedad guardada');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// 8. Borrar propiedad
window.deleteProperty = async (id) => {
    if (!confirm('¿Eliminar propiedad?')) return;
    try {
        await window._supabase.from('propiedades').delete().eq('id', id);
        loadProperties();
    } catch (error) {
        console.error(error);
    }
};
