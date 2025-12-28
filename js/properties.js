// Usamos window._supabase que definimos en app.js
const _supabase = window._supabase;

function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

async function isCodeUnique(code) {
    const { data } = await _supabase
        .from('propiedades')
        .select('id')
        .eq('referencia', code)
        .maybeSingle();
    return !data;
}

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

// EXPORTAMOS para que ui.js pueda llamarla
export async function loadProperties() {
    const container = document.getElementById('properties-container');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>`;

    try {
        const { data: properties, error } = await _supabase
            .from('propiedades')
            .select('*')
            .eq('casero_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderProperties(properties || []);
    } catch (error) {
        console.error('Error:', error);
        if (window.showToast) window.showToast('Error al cargar propiedades');
    }
}

function renderProperties(properties) {
    const container = document.getElementById('properties-container');
    if (properties.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-building"></i><p>Aún no tienes propiedades</p></div>`;
        return;
    }

    container.innerHTML = properties.map(prop => `
        <div class="property-card">
            <div class="property-header">
                <div class="property-title">${prop.direccion_completa || 'Sin dirección'}</div>
                <div class="property-actions">
                    <button class="icon-btn" onclick="editProperty('${prop.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn delete" onclick="deleteProperty('${prop.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="property-info">
                <div class="property-info-row"><i class="fa-solid fa-tag"></i> <span>Ref: <strong>${prop.referencia}</strong></span></div>
            </div>
            <span class="active-badge ${prop.activa ? 'active' : 'inactive'}">${prop.activa ? 'Activa' : 'Inactiva'}</span>
        </div>
    `).join('');
}

// EXPORTAMOS el modal
export async function openPropertyModal(propertyId = null) {
    const modal = document.getElementById('property-form-modal');
    const form = document.getElementById('propertyForm');
    if (!modal) return;

    if (propertyId) {
        document.getElementById('property-modal-title').textContent = 'Editar Propiedad';
        await loadPropertyData(propertyId);
    } else {
        document.getElementById('property-modal-title').textContent = 'Nueva Propiedad';
        form.reset();
        document.getElementById('property-id').value = '';
        document.getElementById('property-active').checked = true;
        document.getElementById('property-reference').value = 'Generando...';
        const newCode = await generateUniquePropertyCode();
        document.getElementById('property-reference').value = newCode;
    }
    modal.classList.add('active');
}

async function loadPropertyData(propertyId) {
    const { data: property } = await _supabase.from('propiedades').select('*').eq('id', propertyId).single();
    if (property) {
        document.getElementById('property-id').value = property.id;
        document.getElementById('property-address').value = property.direccion_completa;
        document.getElementById('property-reference').value = property.referencia;
        document.getElementById('property-active').checked = property.activa;
    }
}

export function closePropertyModal() {
    document.getElementById('property-form-modal').classList.remove('active');
}

export async function handlePropertySubmit(e) {
    e.preventDefault();
    const propertyId = document.getElementById('property-id').value;
    
    const propertyData = {
        casero_id: window.currentUser.id,
        direccion_completa: document.getElementById('property-address').value,
        referencia: document.getElementById('property-reference').value,
        activa: document.getElementById('property-active').checked
    };

    try {
        let error;
        if (propertyId) {
            ({ error } = await _supabase.from('propiedades').update(propertyData).eq('id', propertyId));
        } else {
            ({ error } = await _supabase.from('propiedades').insert([propertyData]));
        }

        if (error) throw error;
        closePropertyModal();
        loadProperties();
        if (window.showToast) window.showToast('Propiedad guardada');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar: ' + error.message);
    }
}

// HACEMOS LAS FUNCIONES GLOBALES para que el HTML (onclick) las vea
window.editProperty = editProperty;
window.deleteProperty = deleteProperty;

async function editProperty(id) { openPropertyModal(id); }

async function deleteProperty(id) {
    if (!confirm('¿Eliminar propiedad?')) return;
    await _supabase.from('propiedades').delete().eq('id', id);
    loadProperties();
}
