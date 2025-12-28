/**
 * LÓGICA DE PROPIEDADES - HOUSEZEN ADMIN
 * Sincronizado con: nombre, direccion_completa, referencia, casero_id
 */

// 1. Generador de código aleatorio (4 números + 3 letras)
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// 2. Carga las propiedades desde Supabase
export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Cargando tus propiedades...</div>';

    try {
        if (!window._supabase || !window.currentUser) {
            console.log("Esperando conexión o usuario...");
            return;
        }

        const { data: properties, error } = await window._supabase
            .from('propiedades')
            .select('id, nombre, direccion_completa, referencia')
            .eq('casero_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(properties || []);
    } catch (error) {
        console.error('Error al cargar propiedades:', error);
        container.innerHTML = '<p style="color:red; padding:20px;">Error al cargar los datos.</p>';
    }
}

// 3. Dibuja las tarjetas en el contenedor
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666;">
                <i class="fa-solid fa-building-circle-exclamation" style="font-size:3rem; margin-bottom:15px; opacity:0.3;"></i>
                <p>Aún no has añadido ninguna propiedad.</p>
            </div>`;
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card">
            <div class="property-header">
                <div>
                    <div style="font-weight:bold; color:var(--primary-color); font-size:1.1rem;">${prop.nombre}</div>
                    <div style="font-size:0.85rem; color:#6b7280;">${prop.direccion_completa}</div>
                </div>
                <button class="icon-btn delete" onclick="deleteProperty('${prop.id}')" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div style="margin-top:15px; padding-top:10px; border-top:1px dashed #e5e7eb;">
                <span style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Código de vinculación</span>
                <div style="font-family:monospace; font-size:1.3rem; font-weight:bold; color:#1f2937; letter-spacing:2px;">
                    ${prop.referencia}
                </div>
            </div>
        </div>
    `).join('');
}

// 4. Lógica para abrir el modal (Crear/Editar)
export async function openPropertyModal() {
    const modal = document.getElementById('property-form-modal');
    const form = document.getElementById('propertyForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('property-id').value = '';
    
    // Generamos el código automático para la nueva propiedad
    const refInput = document.getElementById('property-reference');
    if (refInput) {
        refInput.value = generatePropertyCode();
    }

    modal.classList.add('active');
}

// 5. Cerrar modal
export function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) modal.classList.remove('active');
}

// 6. Guardar los datos (Insertar)
export async function handlePropertySubmit(e) {
    e.preventDefault();
    
    const propertyData = {
        casero_id: window.currentUser.id,
        nombre: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        referencia: document.getElementById('property-reference').value
    };

    try {
        const { error } = await window._supabase
            .from('propiedades')
            .insert([propertyData]);

        if (error) throw error;
        
        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast('Propiedad añadida con éxito');
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error: ' + error.message);
    }
}

// 7. Funciones Globales para el HTML
window.deleteProperty = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) return;
    
    try {
        const { error } = await window._supabase
            .from('propiedades')
            .delete()
            .eq('id', id);

        if (error) throw error;
        loadProperties();
        if (window.showToast) window.showToast('Propiedad eliminada');
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
};
