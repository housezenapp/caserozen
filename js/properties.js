let editingPropertyId = null;

function generatePropertyCode() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({length: 3}, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `${numbers}${letters}`;
}

async function isCodeUnique(code) {
    const { data, error } = await _supabase
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

    if (attempts >= maxAttempts) {
        throw new Error('No se pudo generar un código único');
    }

    return code;
}

async function loadProperties() {
    const container = document.getElementById('properties-container');
    container.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <div class="empty-state-text">Cargando propiedades...</div>
        </div>
    `;

    try {
        const { data: properties, error } = await _supabase
            .from('propiedades')
            .select('*')
            .eq('casero_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!properties || properties.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-building"></i>
                    <div class="empty-state-text">Aún no has añadido propiedades</div>
                </div>
            `;
            return;
        }

        renderProperties(properties);

    } catch (error) {
        console.error('Error loading properties:', error);
        showToast('Error al cargar las propiedades');
    }
}

function renderProperties(properties) {
    const container = document.getElementById('properties-container');

    const html = properties.map(prop => `
        <div class="property-card">
            <div class="property-header">
                <div class="property-title">${prop.direccion_completa}</div>
                <div class="property-actions">
                    <button class="icon-btn" onclick="editProperty('${prop.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteProperty('${prop.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            ${prop.referencia ? `
                <div class="property-info">
                    <div class="property-info-row">
                        <i class="fa-solid fa-tag"></i>
                        <span>Ref: ${prop.referencia}</span>
                    </div>
                </div>
            ` : ''}
            ${prop.inquilino_nombre || prop.inquilino_email ? `
                <div class="property-info">
                    ${prop.inquilino_nombre ? `
                        <div class="property-info-row">
                            <i class="fa-solid fa-user"></i>
                            <span>${prop.inquilino_nombre}</span>
                        </div>
                    ` : ''}
                    ${prop.inquilino_email ? `
                        <div class="property-info-row">
                            <i class="fa-solid fa-envelope"></i>
                            <span>${prop.inquilino_email}</span>
                        </div>
                    ` : ''}
                    ${prop.inquilino_telefono ? `
                        <div class="property-info-row">
                            <i class="fa-solid fa-phone"></i>
                            <span>${prop.inquilino_telefono}</span>
                        </div>
                    ` : ''}
                    ${prop.fecha_inicio_alquiler ? `
                        <div class="property-info-row">
                            <i class="fa-solid fa-calendar"></i>
                            <span>Inicio: ${formatDateShort(prop.fecha_inicio_alquiler)}</span>
                        </div>
                    ` : ''}
                </div>
            ` : '<p style="color: var(--text-lighter); font-size: 0.9rem;">Sin inquilino asignado</p>'}
            <span class="active-badge ${prop.activa ? 'active' : 'inactive'}">
                ${prop.activa ? 'Activa' : 'Inactiva'}
            </span>
        </div>
    `).join('');

    container.innerHTML = html;
}

async function openPropertyModal(propertyId = null) {
    editingPropertyId = propertyId;
    const modal = document.getElementById('property-form-modal');
    const form = document.getElementById('propertyForm');

    if (propertyId) {
        document.getElementById('property-modal-title').textContent = 'Editar Propiedad';
        await loadPropertyData(propertyId);
    } else {
        document.getElementById('property-modal-title').textContent = 'Nueva Propiedad';
        form.reset();
        document.getElementById('property-id').value = '';
        document.getElementById('property-active').checked = true;
        document.getElementById('property-reference').value = 'Generando...';

        try {
            const newCode = await generateUniquePropertyCode();
            document.getElementById('property-reference').value = newCode;
        } catch (error) {
            console.error('Error generando código:', error);
            showToast('Error al generar código de referencia');
            document.getElementById('property-reference').value = '';
        }
    }

    modal.classList.add('active');
}

async function loadPropertyData(propertyId) {
    try {
        const { data: property, error } = await _supabase
            .from('propiedades')
            .select('*')
            .eq('id', propertyId)
            .single();

        if (error) throw error;

        document.getElementById('property-id').value = property.id;
        document.getElementById('property-address').value = property.direccion_completa || '';
        document.getElementById('property-reference').value = property.referencia || '';
        document.getElementById('property-tenant-name').value = property.inquilino_nombre || '';
        document.getElementById('property-tenant-email').value = property.inquilino_email || '';
        document.getElementById('property-tenant-phone').value = property.inquilino_telefono || '';
        document.getElementById('property-start-date').value = property.fecha_inicio_alquiler || '';
        document.getElementById('property-active').checked = property.activa;

    } catch (error) {
        console.error('Error loading property:', error);
        showToast('Error al cargar la propiedad');
    }
}

function closePropertyModal() {
    document.getElementById('property-form-modal').classList.remove('active');
    editingPropertyId = null;
}

async function handlePropertySubmit(e) {
    e.preventDefault();

    const propertyId = document.getElementById('property-id').value;
    const referencia = document.getElementById('property-reference').value;

    if (!referencia || referencia === 'Generando...') {
        showToast('Espere a que se genere el código de referencia');
        return;
    }

    console.log('Usuario actual:', currentUser);

    const { data: { session } } = await _supabase.auth.getSession();
    console.log('Sesión actual:', session);
    console.log('Token JWT:', session?.access_token);
    console.log('Usuario de sesión:', session?.user?.id);
    console.log('Comparación IDs:', {
        currentUser: currentUser?.id,
        sessionUser: session?.user?.id,
        sonIguales: currentUser?.id === session?.user?.id
    });

    const propertyData = {
        casero_id: currentUser.id,
        direccion_completa: document.getElementById('property-address').value,
        referencia: referencia,
        inquilino_nombre: document.getElementById('property-tenant-name').value || null,
        inquilino_email: document.getElementById('property-tenant-email').value || null,
        inquilino_telefono: document.getElementById('property-tenant-phone').value || null,
        fecha_inicio_alquiler: document.getElementById('property-start-date').value || null,
        activa: document.getElementById('property-active').checked
    };

    console.log('Datos de propiedad a guardar:', propertyData);

    try {
        if (propertyId) {
            console.log('Actualizando propiedad:', propertyId);
            const { data, error } = await _supabase
                .from('propiedades')
                .update(propertyData)
                .eq('id', propertyId)
                .select();

            console.log('Resultado de actualización:', { data, error });
            if (error) throw error;
            showToast('Propiedad actualizada correctamente');
        } else {
            console.log('Insertando nueva propiedad...');
            const { data, error } = await _supabase
                .from('propiedades')
                .insert([propertyData])
                .select();

            console.log('Resultado de inserción:', { data, error });
            if (error) throw error;
            showToast('Propiedad añadida correctamente');
        }

        closePropertyModal();
        loadProperties();

    } catch (error) {
        console.error('Error completo saving property:', error);
        console.error('Detalles del error:', error.message, error.details, error.hint);
        showToast('Error al guardar la propiedad: ' + (error.message || 'Error desconocido'));
    }
}

async function editProperty(propertyId) {
    openPropertyModal(propertyId);
}

async function deleteProperty(propertyId) {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) {
        return;
    }

    try {
        const { error } = await _supabase
            .from('propiedades')
            .delete()
            .eq('id', propertyId);

        if (error) throw error;

        showToast('Propiedad eliminada correctamente');
        loadProperties();

    } catch (error) {
        console.error('Error deleting property:', error);
        showToast('Error al eliminar la propiedad');
    }
}
