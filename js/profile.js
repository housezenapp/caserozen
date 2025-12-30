import { showToast } from './ui.js';

window.loadProfile = async function() {
    try {
        console.log('🔍 Cargando perfil del usuario:', window.currentUser?.id);

        const { data: perfil, error } = await window._supabase
            .from('perfiles')
            .select('*')
            .eq('id', window.currentUser.id)
            .maybeSingle();

        console.log('📦 Perfil cargado:', perfil);
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Error al cargar perfil:', error);
            throw error;
        }

        if (perfil) {
            document.getElementById('perfil-nombre').value = perfil.nombre || '';
            document.getElementById('perfil-telefono').value = perfil.telefono || '';
            document.getElementById('perfil-direccion').value = perfil.direccion || '';
            console.log('✅ Campos del perfil rellenados');
        } else {
            console.log('ℹ️ No existe perfil previo');
        }

        document.getElementById('perfil-email').value = window.currentUser.email || '';

    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showToast('Error al cargar el perfil');
    }
};

window.handleProfileSubmit = async function(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSavePerfil');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    console.log('👤 Usuario actual:', window.currentUser);

    const profileData = {
        id: window.currentUser.id,
        nombre: document.getElementById('perfil-nombre').value,
        email: window.currentUser.email,
        telefono: document.getElementById('perfil-telefono').value || null,
        direccion: document.getElementById('perfil-direccion').value || null
    };

    console.log('💾 Datos del perfil a guardar:', profileData);

    try {
        const { data: existing, error: selectError } = await window._supabase
            .from('perfiles')
            .select('id')
            .eq('id', window.currentUser.id)
            .maybeSingle();

        console.log('🔍 Perfil existente:', existing);
        if (selectError && selectError.code !== 'PGRST116') {
            console.log('⚠️ Error al buscar perfil:', selectError);
        }

        if (existing) {
            console.log('📝 Actualizando perfil existente...');
            const { data, error } = await window._supabase
                .from('perfiles')
                .update(profileData)
                .eq('id', window.currentUser.id)
                .select();

            console.log('📊 Resultado de actualización:', { data, error });
            if (error) throw error;
            console.log('✅ Perfil actualizado en Supabase');
        } else {
            console.log('➕ Insertando nuevo perfil...');
            const { data, error } = await window._supabase
                .from('perfiles')
                .insert([profileData])
                .select();

            console.log('📊 Resultado de inserción:', { data, error });
            if (error) throw error;
            console.log('✅ Perfil insertado en Supabase');
        }

        showToast('Perfil guardado correctamente');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-save"></i> Actualizar Datos';
        }, 2000);

    } catch (error) {
        console.error('❌ Error completo saving profile:', error);
        console.error('📋 Detalles del error:', error.message, error.details, error.hint);
        showToast('Error al guardar el perfil: ' + (error.message || 'Error desconocido'));
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Actualizar Datos';
    } finally {
        btn.disabled = false;
    }
};
