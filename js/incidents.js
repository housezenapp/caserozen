/** js/incidents.js **/
async function loadIncidents() {
    const container = document.getElementById('incidents-logistics-container');
    if (!container) return;
    container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
    try {
        let incidents = [];
        // Filtro por vinculación de confianza (Tu ID: 258a3c0c...)
        const { data: v, error: ve } = await _supabase.from('perfil_propiedades').select('id_perfil_inquilino').eq('id_perfil_casero', currentUser.id);
        if (ve) throw ve;
        const ids = v?.map(i => i.id_perfil_inquilino) || [];
        
        if (ids.length > 0) {
            const { data: d, error: de } = await _supabase.from('incidencias').select('*').in('user_id', ids).order('created_at', { ascending: false });
            if (de) throw de;
            incidents = d || [];
        }

        if (incidents.length === 0) {
            return renderEmpty(container, "No hay incidencias vinculadas");
        }
        updateStats(incidents);
        renderIncidentsList(incidents);
    } catch (e) { 
        console.error("Error en incidencias:", e);
    }
}

function renderEmpty(c, m) {
    const stats = ['stat-urgent','stat-pending','stat-progress'];
    stats.forEach(id => { if(document.getElementById(id)) document.getElementById(id).textContent = '0'; });
    c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-home"></i><div class="empty-state-text">${m}</div></div>`;
}

function updateStats(inc) {
    if(document.getElementById('stat-urgent')) document.getElementById('stat-urgent').textContent = inc.filter(i => i.urgencia === 'alta' && i.estado !== 'Solucionado').length;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = inc.filter(i => i.estado === 'Reportada').length;
    if(document.getElementById('stat-progress')) document.getElementById('stat-progress').textContent = inc.filter(i => i.estado !== 'Reportada' && i.estado !== 'Solucionado').length;
}

function renderIncidentsList(inc) {
    const c = document.getElementById('incidents-logistics-container');
    const fE = document.getElementById('filter-estado')?.value || '';
    const fU = document.getElementById('filter-urgencia')?.value || '';
    let filtered = inc.filter(i => (!fE || i.estado === fE) && (!fU || i.urgencia === fU));
    c.innerHTML = filtered.map(i => `
        <div class="incident-card urgency-${i.urgencia}" onclick="showIncidentDetail('${i.id}')">
            <div class="incident-header"><strong>${i.titulo || 'Incidencia'}</strong> <span class="status-badge">${i.estado}</span></div>
            <div class="incident-info">
                <div><i class="fa-solid fa-user"></i> ${i.nombre_inquilino || 'Inquilino'}</div>
                <div><i class="fa-solid fa-location-dot"></i> ${i.direccion || 'N/A'}</div>
            </div>
        </div>`).join('');
}

async function showIncidentDetail(id) {
    const modal = document.getElementById('incident-detail-modal');
    if(!modal) return;
    modal.classList.add('active');
    try {
        const { data: inc } = await _supabase.from('incidencias').select('*').eq('id', id).single();
        const { data: tecs } = await _supabase.from('tecnicos').select('*').eq('casero_id', currentUser.id);
        
        document.getElementById('incident-detail-content').innerHTML = `
            <div style="padding:20px;">
                <h3>${inc.titulo || 'Detalle'}</h3>
                <p>${inc.descripcion}</p>
                <hr>
                <label>Notas Casero:</label>
                <textarea id="not-cas" style="width:100%; height:80px;">${inc.notas_casero || ''}</textarea>
                <button class="action-btn" onclick="saveNotes('${inc.id}')">Guardar Notas</button>
                <button class="action-btn danger" onclick="closeIncidentDetailModal()">Cerrar</button>
            </div>`;
    } catch (e) { console.error(e); }
}

async function saveNotes(id) {
    const notas = document.getElementById('not-cas').value;
    await _supabase.from('incidencias').update({ notas_casero: notas }).eq('id', id);
    alert('Notas guardadas');
}

function closeIncidentDetailModal() {
    document.getElementById('incident-detail-modal').classList.remove('active');
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString() : ''; }
