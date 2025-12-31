/** js/incidents.js - Gestión Completa **/

async function loadIncidents() {
    const container = document.getElementById('incidents-logistics-container');
    if (!container) return;
    
    container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    try {
        let incidents = [];

        // 1. Obtener inquilinos vinculados
        const { data: vinculos, error: vError } = await window._supabase
            .from('perfil_propiedades')
            .select('id_perfil_inquilino')
            .eq('id_perfil_casero', window.currentUser.id);

        if (vError) throw vError;
        const listaIds = vinculos?.map(v => v.id_perfil_inquilino) || [];

        if (listaIds.length > 0) {
            // 2. Cargar incidencias de esos inquilinos
            const { data, error } = await window._supabase
                .from('incidencias')
                .select('*')
                .in('user_id', listaIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            incidents = data || [];
        }

        if (incidents.length === 0) {
            renderEmpty(container, "No hay incidencias vinculadas");
            return;
        }

        updateStats(incidents);
        renderIncidentsList(incidents);

    } catch (error) {
        console.error('Error:', error);
    }
}

function renderEmpty(c, m) {
    ['stat-urgent', 'stat-pending', 'stat-progress'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });
    c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-home"></i><div class="empty-state-text">${m}</div></div>`;
}

function updateStats(inc) {
    const u = document.getElementById('stat-urgent');
    const p = document.getElementById('stat-pending');
    const pr = document.getElementById('stat-progress');
    
    if (u) u.textContent = inc.filter(i => i.urgencia === 'alta' && i.estado !== 'Solucionado').length;
    if (p) p.textContent = inc.filter(i => i.estado === 'Reportada').length;
    if (pr) pr.textContent = inc.filter(i => i.estado !== 'Reportada' && i.estado !== 'Solucionado').length;
}

function renderIncidentsList(incidents) {
    const container = document.getElementById('incidents-logistics-container');
    const fEstado = document.getElementById('filter-estado')?.value;
    const fUrgencia = document.getElementById('filter-urgencia')?.value;

    let filtered = incidents.filter(i => {
        return (!fEstado || i.estado === fEstado) && (!fUrgencia || i.urgencia === fUrgencia);
    });

    container.innerHTML = filtered.map(inc => `
        <div class="incident-card urgency-${inc.urgencia}" onclick="showIncidentDetail('${inc.id}')">
            <div class="incident-header">
                <div class="incident-title">${inc.titulo || 'Incidencia'}</div>
                <span class="status-badge status-${inc.estado.replace(/ /g, '-')}" data-estado="${inc.estado}">${inc.estado}</span>
            </div>
            <div class="incident-info">
                <div class="incident-info-row"><i class="fa-solid fa-user"></i><span>${inc.nombre_inquilino || 'Inquilino'}</span></div>
                <div class="incident-info-row"><i class="fa-solid fa-location-dot"></i><span>${inc.direccion || 'Sin dirección'}</span></div>
            </div>
            <div class="incident-footer">
                <span>${formatDate(inc.created_at)}</span>
                <span class="urgency-badge urgency-${inc.urgencia}">${inc.urgencia.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
}

async function showIncidentDetail(id) {
    const modal = document.getElementById('incident-detail-modal');
    if (!modal) return;
    modal.classList.add('active');
    
    try {
        const { data: inc } = await window._supabase.from('incidencias').select('*').eq('id', id).single();
        const { data: hist } = await window._supabase.from('historial_estados').select('*').eq('incidencia_id', id).order('created_at', { ascending: true });
        const { data: tecs } = await window._supabase.from('tecnicos').select('*').eq('casero_id', window.currentUser.id);
        
        renderIncidentDetail(inc, hist, tecs);
    } catch (e) { console.error(e); }
}

// --- FUNCIONES DE ACCIÓN REPARADAS ---
async function asigResp(id, r) { 
    await window._supabase.from('incidencias').update({ responsable_pago: r, estado: 'Asignación de Pago' }).eq('id', id); 
    showIncidentDetail(id); loadIncidents(); 
}

async function asigTec(id) { 
    const tId = document.getElementById('tec-sel').value; 
    await window._supabase.from('incidencias').update({ tecnico_id: tId, estado: 'En manos del Técnico' }).eq('id', id); 
    showIncidentDetail(id); loadIncidents(); 
}

async function avanzar(id, n) { 
    const { data } = await window._supabase.from('incidencias').select('estado').eq('id', id).single();
    await window._supabase.from('incidencias').update({ estado: n }).eq('id', id);
    await window._supabase.from('historial_estados').insert({ incidencia_id: id, estado_anterior: data.estado, estado_nuevo: n, cambiado_por: window.currentUser.id });
    showIncidentDetail(id); loadIncidents();
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function closeIncidentDetailModal() {
    document.getElementById('incident-detail-modal').classList.remove('active');
}
