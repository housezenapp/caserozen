// Función para generar el código de 4 números y 3 letras (Lógica de Bolt)
function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

// Verifica si el código ya existe en Supabase
async function isCodeUnique(code) {
    const { data } = await window._supabase
        .from('propiedades')
        .select('id')
        .eq('referencia', code)
        .maybeSingle();
    return !data;
}

// Genera un código único reintentando si es necesario
async function generateUniquePropertyCode() {
    let code;
    let attempts = 0;
    const maxAttempts = 10;
    do {
        code = generatePropertyCode();
        attempts++;
    } while (!(await isCodeUnique(code)) && attempts < maxAttempts);
    if (attempts >= maxAttempts) throw new Error('No se pudo generar un código único');
    return code;
}

// Carga las propiedades del casero actual
export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>`;

    try {
        if (!window._supabase) throw new Error("Supabase no detectado");
        if (!window.currentUser) {
            console.log("Propiedades: Esperando a que el usuario se identifique...");
            return;
        }

        const { data: properties, error } = await window._supabase
            .from('propiedades')
            .select('*')
            .eq('casero_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(properties || []);
    } catch (error) {
        console.error('Error en loadProperties:', error);
        container.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">Error al conectar con la base de datos.</p>`;
    }
}

// Dibuja las tarjetas de propiedad en el HTML
function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-building"></i>
                <p>Aún no tienes propiedades añadidas.</p>
            </div>`;
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card">
            <div class="property-header">
                <div class="property-title">${prop.direccion_completa || 'Sin dirección'}</div>
                <div class="property-actions">
                    <button class="icon-btn" onclick="editProperty('${prop.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteProperty('${prop.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="property-info">
                <div class="property-info-row">
                    <i class="fa-solid fa-tag"></i> 
                    <span>Código vinculación: <strong>${prop.referencia}</strong></span>
                </div>
            </div>
            <span class="active-badge ${prop.activa ? 'active' : 'inactive'}">
                ${prop.activa ? 'Activa' : 'Inactiva'}
            </span>
        </div>
    `).join('');
}

// Abre el modal para crear o editar
export async function openPropertyModal(propertyId = null) {
    const modal = document.getElementById('property-form-modal');
    const form = document.getElementById('propertyForm');
    const titleEl = document.getElementById('property-modal-title');
    
    if (!modal || !form) return;

    if (propertyId) {
        if (titleEl) titleEl.textContent = 'Editar Propiedad';
        await loadPropertyData(propertyId);
    } else {
        if (titleEl) titleEl.textContent = 'Nueva Propiedad';
        form.reset();
        document.getElementById('property-id').value = '';
        document.getElementById('property-active').checked = true;
        
        const refInput = document.getElementById('property-reference');
        if (refInput) {
            refInput.value = 'Generando...';
            const newCode = await generateUniquePropertyCode();
            refInput.value = newCode;
        }
    }
    modal.classList.add('active');
}

// Carga los datos de un piso específico en el formulario
async function loadPropertyData(propertyId) {
    try {
        const { data: property, error } = await window._supabase
            .from('propiedades')
            .select('*')
            .eq('id', propertyId)
            .single();

        if (error) throw error;
        if (property) {
            document.getElementById('property-id').value = property.id;
            document.getElementById('property-address').value = property.direccion_completa;
            document.getElementById('property-reference').value = property.referencia;
            document.getElementById('property-active').checked = property.activa;
        }
    } catch (error) {
        console.error('Error cargando datos del piso:', error);
    }
}

export function closePropertyModal() {
    const modal = document.getElementById('property-form-modal');
    if (modal) modal.classList.remove('active');
}

// Guarda los datos en Supabase
export async function handlePropertySubmit(e) {
    e.preventDefault();
    
    // Solo leemos los campos que hemos dejado en el HTML arriba
    const propertyId = document.getElementById('property-id').value;
    
    const propertyData = {
        casero_id: window.currentUser.id,
        nombre: document.getElementById('property-name').value,
        direccion_completa: document.getElementById('property-address').value,
        referencia: document.getElementById('property-reference').value,
        activa: true
    };

    try {
        let result;
        if (propertyId) {
            // Si hay ID, actualizamos la fila existente
            result = await window._supabase.from('propiedades').update(propertyData).eq('id', propertyId);
        } else {
            // Si no hay ID, creamos una fila nueva
            result = await window._supabase.from('propiedades').insert([propertyData]);
        }

        if (result.error) throw result.error;
        
        closePropertyModal();
        loadProperties(); // Refrescamos la lista para ver el cambio
        if (window.showToast) window.showToast('¡Guardado con éxito!');
        
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Fallo al guardar: ' + error.message);
    }
}

// Hacemos que estas funciones sean globales para los botones onclick del HTML
window.editProperty = async (id) => { openPropertyModal(id); };
window.deleteProperty = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar esta propiedad?')) return;
    try {
        const { error } = await window._supabase.from('propiedades').delete().eq('id', id);
        if (error) throw error;
        loadProperties();
        if (window.showToast) window.showToast('Propiedad eliminada');
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
};
