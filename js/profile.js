async function loadProfile() {
    try {
        const { data: perfil, error } = await _supabase
            .from('perfiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (perfil) {
            document.getElementById('perfil-nombre').value = perfil.nombre || '';
            document.getElementById('perfil-telefono').value = perfil.telefono || '';
            document.getElementById('perfil-direccion').value = perfil.direccion || '';
        }

        document.getElementById('perfil-email').value = currentUser.email || '';

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error al cargar el perfil');
    }
}

async function handleProfileSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSavePerfil');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    console.log('Usuario actual:', currentUser);

    const profileData = {
        id: currentUser.id,
        nombre: document.getElementById('perfil-nombre').value,
        email: currentUser.email,
        telefono: document.getElementById('perfil-telefono').value || null,
        direccion: document.getElementById('perfil-direccion').value || null
    };

    console.log('Datos del perfil a guardar:', profileData);

    try {
        const { data: existing, error: selectError } = await _supabase
            .from('perfiles')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

        console.log('Perfil existente:', existing);
        if (selectError) console.log('Error al buscar perfil:', selectError);

        if (existing) {
            console.log('Actualizando perfil existente...');
            const { data, error } = await _supabase
                .from('perfiles')
                .update(profileData)
                .eq('id', currentUser.id)
                .select();

            console.log('Resultado de actualización:', { data, error });
            if (error) throw error;
        } else {
            console.log('Insertando nuevo perfil...');
            const { data, error } = await _supabase
                .from('perfiles')
                .insert([profileData])
                .select();

            console.log('Resultado de inserción:', { data, error });
            if (error) throw error;
        }

        showToast('Perfil guardado correctamente');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Perfil';
        }, 2000);

    } catch (error) {
        console.error('Error completo saving profile:', error);
        console.error('Detalles del error:', error.message, error.details, error.hint);
        showToast('Error al guardar el perfil: ' + (error.message || 'Error desconocido'));
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Perfil';
    } finally {
        btn.disabled = false;
    }
}
