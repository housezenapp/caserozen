/** js/incidents.js - Gestión de Incidencias vinculadas por Perfil **/
async function loadIncidents() {
    const container = document.getElementById('incidents-logistics-container');
    container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i><div class="empty-state-text">Cargando incidencias...</div></div>`;
    try {
        let incidents = [];
        if (window.isAdmin) {
            const { data } = await _supabase.from('incidencias').select('*').order('created_at', { ascending: false });
            incidents = data || [];
        } else {
            const { data: v, error: ve } = await _supabase.from('perfil_propiedades').select('id_perfil_inquilino').eq('id_perfil_casero', currentUser.id);
            if (ve) throw ve;
            const ids = v?.map(i => i.id_perfil_inquilino) || [];
            if (ids.length === 0) { return renderEmpty(container, "No tienes inquilinos vinculados"); }
            const { data: d, error: de } = await _supabase.from('incidencias').select('*').in('user_id', ids).order('created_at', { ascending: false });
            if (de) throw de;
            incidents = d || [];
        }
        if (incidents.length === 0) return renderEmpty(container, "No hay incidencias");
        updateStats(incidents);
        renderIncidentsList(incidents);
    } catch (e) { console.error(e); showToast('Error al cargar'); }
}

function renderEmpty(c, m) {
    ['stat-urgent','stat-pending','stat-progress'].forEach(id => document.getElementById(id).textContent = '0');
    c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-home"></i><div class="empty-state-text">${m}</div></div>`;
}

function updateStats(inc) {
    document.getElementById('stat-urgent').textContent = inc.filter(i => i.urgencia === 'alta' && i.estado !== 'Solucionado').length;
    document.getElementById('stat-pending').textContent = inc.filter(i => i.estado === 'Reportada').length;
    document.getElementById('stat-progress').textContent = inc.filter(i => i.estado !== 'Reportada' && i.estado !== 'Solucionado').length;
}

function renderIncidentsList(inc) {
    const c = document.getElementById('incidents-logistics-container');
    const fE = document.getElementById('filter-estado').value;
    const fU = document.getElementById('filter-urgencia').value;
    let filtered = inc.filter(i => (!fE || i.estado === fE) && (!fU || i.urgencia === fU));
    c.innerHTML = filtered.map(i => `
        <div class="incident-card urgency-${i.urgencia}" onclick="showIncidentDetail('${i.id}')">
            <div class="incident-header"><div class="incident-title">${i.titulo || 'Incidencia'}</div><span class="status-badge status-${i.estado.replace(/ /g, '-')}" data-estado="${i.estado}">${i.estado}</span></div>
            <div class="incident-info">
                <div class="incident-info-row"><i class="fa-solid fa-user"></i><span>${i.nombre_inquilino || 'Inquilino'}</span></div>
                <div class="incident-info-row"><i class="fa-solid fa-location-dot"></i><span>${i.direccion || 'N/A'}</span></div>
            </div>
            <div class="incident-footer"><span>${formatDate(i.created_at)}</span><span class="urgency-badge urgency-${i.urgencia}">${i.urgencia.toUpperCase()}</span></div>
        </div>`).join('');
}

async function showIncidentDetail(id) {
    const modal = document.getElementById('incident-detail-modal');
    document.getElementById('incident-detail-content').innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
    modal.classList.add('active');
    try {
        const { data: inc } = await _supabase.from('incidencias').select('*').eq('id', id).single();
        const { data: hist } = await _supabase.from('historial_estados').select('*').eq('incidencia_id', id).order('created_at', { ascending: true });
        const { data: tecs } = await _supabase.from('tecnicos').select('*').eq('casero_id', currentUser.id).eq('activo', true);
        renderIncidentDetail(inc, hist, tecs);
    } catch (e) { console.error(e); }
}

function renderIncidentDetail(i, h, t) {
    const ests = ['Reportada', 'Asignación de Pago', 'En manos del Técnico', 'Reparación en Curso', 'Presupuesto Pendiente', 'Solucionado'];
    const curIdx = ests.indexOf(i.estado);
    const stepH = ests.map((e, idx) => {
        const hI = h?.find(hi => hi.estado_nuevo === e);
        return `<div class="stepper-step ${idx < curIdx ? 'completed' : (idx === curIdx ? 'active' : '')}">
            <div class="step-icon">${idx < curIdx ? '<i class="fa-solid fa-check"></i>' : (idx + 1)}</div>
            <div class="step-content"><div class="step-title">${e}</div><div class="step-time">${hI ? formatDate(hI.created_at) : (idx === curIdx ? 'En curso' : 'Pendiente')}</div></div>
        </div>`;
    }).join('');
    const tecO = t?.map(tec => `<option value="${tec.id}" ${i.tecnico_id === tec.id ? 'selected' : ''}>${tec.nombre}</option>`).join('') || '';
    document.getElementById('incident-detail-content').innerHTML = `
        <div style="padding:20px;">
            <div class="info-grid">
                <div class="info-item"><div class="info-label">Inquilino</div><div>${i.nombre_inquilino || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Urgencia</div><span class="urgency-badge urgency-${i.urgencia}">${i.urgencia}</span></div>
            </div>
            <p><strong>Descripción:</strong> ${i.descripcion}</p>
            <div class="stepper">${stepH}</div>
            <div class="action-section">
                ${i.estado === 'Reportada' ? `<button class="action-btn primary" onclick="asigResp('${i.id}','Casero')">Pago Casero</button><button class="action-btn primary" onclick="asigResp('${i.id}','Inquilino')">Pago Inquilino</button>` : ''}
                ${i.estado === 'Asignación de Pago' ? `<select id="tec-sel">${tecO}</select><button class="action-btn success" onclick="asigTec('${i.id}')">Asignar</button>` : ''}
                ${i.estado === 'En manos del Técnico' ? `<button class="action-btn primary" onclick="avanzar('${i.id}','Reparación en Curso')">Empezar</button>` : ''}
                ${i.estado === 'Reparación en Curso' ? `<input type="number" id="pre-mon" placeholder="€"><button class="action-btn primary" onclick="envPre('${i.id}')">Enviar Presupuesto</button>` : ''}
                ${i.estado === 'Presupuesto Pendiente' ? `<button class="action-btn success" onclick="gestPre('${i.id}','aceptado')">Aceptar</button><button class="action-btn danger" onclick="gestPre('${i.id}','rechazado')">Rechazar</button>` : ''}
                ${i.presupuesto_estado === 'aceptado' && i.estado !== 'Solucionado' ? `<button class="action-btn success" onclick="avanzar('${i.id}','Solucionado')">Cerrar</button>` : ''}
            </div>
            <textarea id="not-cas" style="width:100%; margin-top:10px;">${i.notes_casero || ''}</textarea>
            <button class="action-btn" onclick="saveNotes('${i.id}')">Guardar Notas</button>
        </div>`;
}

async function asigResp(id, r) { await _supabase.from('incidencias').update({ responsable_pago: r, estado: 'Asignación de Pago' }).eq('id', id); refresh(id); }
async function asigTec(id) { const tId = document.getElementById('tec-sel').value; await _supabase.from('incidencias').update({ tecnico_id: tId, estado: 'En manos del Técnico' }).eq('id', id); refresh(id); }
async function avanzar(id, n) { const { data } = await _supabase.from('incidencias').select('estado').eq('id', id).single(); await _supabase.from('incidencias').update({ estado: n }).eq('id', id); await _supabase.from('historial_estados').insert({ incidencia_id: id, estado_anterior: data.estado, estado_nuevo: n, cambiado_por: currentUser.id }); refresh(id); }
async function envPre(id) { const m = document.getElementById('pre-mon').value; await _supabase.from('incidencias').update({ presupuesto_monto: m, presupuesto_estado: 'pendiente', estado: 'Presupuesto Pendiente' }).eq('id', id); refresh(id); }
async function gestPre(id, d) { await _supabase.from('incidencias').update({ presupuesto_estado: d }).eq('id', id); refresh(id); }
async function saveNotes(id) { await _supabase.from('incidencias').update({ notes_casero: document.getElementById('not-cas').value }).eq('id', id); showToast('Guardado'); }
function refresh(id) { showIncidentDetail(id); loadIncidents(); }
function closeIncidentDetailModal() { document.getElementById('incident-detail-modal').classList.remove('active'); loadIncidents(); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : ''; }
