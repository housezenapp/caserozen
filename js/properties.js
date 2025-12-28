/**
 * ARCHIVO DEFINITIVO: js/properties.js
 * Sincronizado con tabla: id, casero_id, nombre, direccion_completa, referencia
 */

// 1. Generador interno de código (4 números + 3 letras)
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// 2. Comprobar si el código existe en Supabase (Garantiza unicidad)
async function isCodeUnique(code) {
    const { data } = await window._supabase
        .from('propiedades')
        .select('id')
        .eq('referencia', code)
        .maybeSingle();
    return !data; // Retorna true si NO existe (es único)
}

// 3. Cargar lista de propiedades del casero actual
export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    // Si no hay usuario (invitado), usamos un ID genérico para que no falle la carga
    const userId = window.currentUser?.id || '00000000-0000-0000-0000-000000000000';

    container.innerHTML = '<div class="loading-state">Cargando propiedades...</div>';

    try {
        const { data: properties, error } = await window._supabase
            .from('propiedades')
            .select('id, nombre, direccion_completa, referencia')
            .eq('casero_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(properties || []);
    } catch (error) {
        console.error('Error cargando propiedades:', error);
        container.innerHTML = '<p class="error-msg">Error al conectar con la base de datos.</p>';
    }
}

// 4. Dibujar las tarjetas en el HTML
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (!container) return;

    if (properties.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666; background:#f9fafb; border-radius:12px; border:2px dashed #ddd;">
                <i class="fa-solid fa-building-circle-exclamation" style="font-size:2rem; margin-bottom:10px; color:#ccc;"></i>
                <p>No tienes propiedades registradas todavía.</p>
            </div>`;
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card" id="prop-${prop.id}">
            <div class="property-header">
                <div class="property-main-info">
                    <strong style="color:#14B8A6; font-size:1.1rem; display:block;">${prop.nombre}</strong>
                    <span style="font-size:0.85rem; color:#666;"><i class="fa-solid fa-location-dot"></i> ${prop.direccion_completa}</span>
                </div>
                <button class="icon-btn delete" onclick="deleteProperty('${prop.id}')" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="property-footer" style="margin-top:15px; padding-top:12px; border-top:1px dashed #eee; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <small style="color:#999; display:block; font-size:0.7rem; text-transform:uppercase;">Código Vinculación</small>
                    <code style="font-family:'Courier New', monospace; font-size:1.2rem; font-weight:800; color:#1f2937;">${prop.referencia}</code>
                </div>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('${prop.referencia}'); alert('Código copiado');" style="background:#f3f4f6; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">
                    <i class="fa-solid fa-copy"></i>
                </button>
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

    // 1. Limpiar y mostrar modal al instante
    form.reset();
    document.getElementById('property-id').value = '';
    modal.style.display = 'flex';
    modal.classList.add('active');

    // 2. Generar código local inmediato (sin esperar a la DB)
    const tempCode = generatePropertyCode();
    if (refInput) {
        refInput.value = tempCode;
        
        // 3. Intento de validación silenciosa (opcional)
        // Si la DB no responde, nos quedamos con el generado arriba
        try {
            const { data } = await window._supabase
                .from('propiedades')
                .select('id')
                .eq('referencia', tempCode)
                .maybeSingle();
            
            if (data) {
                // Si justo ese existe, generamos otro y listo
                refInput.value = generatePropertyCode();
            }
        } catch (e) {
            console.warn("No se pudo validar el código, pero usamos el generado localmente.");
        }
    }
}

// 6. Cerrar Modal
export function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// 7. Guardar en Supabase (Insertar nueva propiedad)
export async function handlePropertySubmit(e) {
    e.preventDefault();
    
    // Si no hay sesión real, usamos el ID de invitado
    const userId = window.currentUser?.id || '00000000-0000-0000-0000-000000000000';

    const propertyData = {
        casero_id: userId,
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
        await loadProperties(); // Recargar lista
        
        if (window.showToast) {
            window.showToast('✅ Propiedad guardada con éxito');
        } else {
            alert('✅ Propiedad guardada con éxito');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la propiedad: ' + error.message);
    }
}

// 8. Borrar propiedad (Función Global para el onclick)
window.deleteProperty = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad? Se perderá el vínculo con el inquilino.')) return;
    
    try {
        const { error } = await window._supabase
            .from('propiedades')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        // Efecto visual: eliminar del DOM directamente
        const card = document.getElementById(`prop-${id}`);
        if (card) card.remove();
        
        // Recargar por si acaso
        loadProperties();
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('No se pudo eliminar la propiedad.');
    }
};
