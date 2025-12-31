/**
 * js/incidents.js - Gestión de Incidencias para CaseroZen
 */

async function loadIncidents() {
    const container = document.getElementById('incidents-logistics-container');
    container.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <div class="empty-state-text">Cargando incidencias...</div>
        </div>
    `;

    try {
        let incidents = [];

        // isAdmin viene definido globalmente o por el rol del perfil
        if (window.isAdmin) {
            const { data } = await _supabase
                .from('incidencias')
                .select('*')
                .order('created_at', { ascending: false });

            incidents = data || [];
        } else {
            // --- LÓGICA DE VINCULACIÓN POR PERFIL_PROPIEDADES ---
            // 1. Buscamos los inquilinos asociados a este casero
            const { data: vinculos, error: vError } = await _supabase
                .from('perfil_propiedades')
                .select('id_perfil_inquilino')
                .eq('id_perfil_casero', currentUser.id);

            if (vError) throw vError;

            // Extraemos los IDs de los inquilinos
            const listaInquilinos = vinculos?.map(v => v.id_perfil_inquilino) || [];

            if (listaInquilinos.length === 0) {
                // Si no hay vínculos, reseteamos contadores y avisamos
                document.getElementById('stat-urgent').textContent = '0';
                document.getElementById('stat-pending').textContent = '0';
                document.getElementById('stat-progress').textContent = '0';
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-user-slash"></i>
                        <div class="empty-state-text">No tienes inquilinos vinculados todavía</div>
                    </div>
                `;
                return;
            }

            // 2. Cargamos las incidencias que pertenezcan a esos inquilinos
            const { data, error } = await _supabase
                .from('incidencias')
                .select('*')
                .in('user_id', listaInquilinos)
                .order('created_at', { ascending: false });

            if (error) throw error;
            incidents = data || [];
        }

        // Estadísticas
        const urgentes = incidents.filter(i => i.urgencia === 'alta' && i.estado !== 'Solucionado').length;
        const pendientes = incidents.filter(i => i.estado === 'Reportada').length;
        const enProceso = incidents.filter(i => 
            i.estado !== 'Reportada' && i.estado !== 'Solucionado'
        ).length;

        document.getElementById('stat-urgent').textContent = urgentes;
        document.getElementById('stat-pending').textContent = pendientes;
        document.getElementById('stat-progress').textContent = enProceso;

        // Filtros de UI
        const filterEstado = document.getElementById('filter-estado').value;
        const filterUrgencia = document.getElementById('filter-urgencia').value;

        let filteredIncidents = [...incidents];

        if (filterEstado) {
            filteredIncidents = filteredIncidents.filter(i => i.estado === filterEstado);
        }

        if (filterUrgencia) {
            filteredIncidents = filteredIncidents.filter(i => i.urgencia === filterUrgencia);
        }

        if (filteredIncidents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-filter"></i>
                    <div class="empty-state-text">No hay incidencias con estos filtros</div>
                </div>
            `;
            return;
        }

        renderIncidentsList(filteredIncidents);

    } catch (error) {
        console.error('Error loading incidents:', error);
        showToast('Error al cargar las incidencias');
    }
}

function renderIncidentsList(incidents) {
    const container = document.getElementById('incidents-logistics-container');

    const html = incidents.map(inc => `
        <div class="incident-card urgency-${inc.urgencia}" onclick="showIncidentDetail('${inc.id}')">
            <div class="incident-header">
                <div class="incident-title">${inc.titulo || 'Sin Título'}</div>
                <span class="status-badge status-${inc.estado.replace(/ /g, '-')}" data-estado="${inc.estado}">${inc.estado}</span>
            </div>
            <div class="incident-info">
                <div class="incident-info-row">
                    <i class="fa-solid fa-user"></i>
                    <span>${inc.nombre_inquilino || 'Inquilino'}</span>
                </div>
                <div class="incident-info-row">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${inc.direccion || 'Sin dirección'}</span>
                </div>
            </div>
            <div class="incident-footer">
                <span>${formatDate(inc.created_at)}</span>
                <span class="urgency-badge urgency-${inc.urgencia}">${inc.urgencia.toUpperCase()}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

async function showIncidentDetail(incidentId) {
    const modal = document.getElementById('incident-detail-modal');
    const content = document.getElementById('incident-detail-content');
    content.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
    modal.classList.add('active');

    try {
        const { data: incident } = await _supabase.from('incidencias').select('*').eq('id', incidentId).single();
        if (!incident) return;

        const { data: historial } = await _supabase.from('historial_estados').select('*').eq('incidencia_id', incidentId).order('created_at', { ascending: true });
        const { data: tecnicos } = await _supabase.from('tecnicos').select('*').eq('casero_id', currentUser.id).eq('activo', true);

        renderIncidentDetail(incident, historial, tecnicos);
    } catch (error) {
        console.error('Error detail:', error);
    }
}

function renderIncidentDetail(incident, historial, tecnicos) {
    const content = document.getElementById('incident-detail-content');
    const estados = ['Reportada', 'Asignación de Pago', 'En manos del Técnico', 'Reparación en Curso', 'Presupuesto Pendiente', 'Solucionado'];
    const currentStateIndex = estados.indexOf(incident.estado);

    const stepperHtml = estados.map((estado, index) => {
        const stepClass = index < currentStateIndex ? 'completed' : (index === currentStateIndex ? 'active' : '');
        const historialItem = historial?.find(h => h.estado_nuevo === estado);
        return `
            <div class="stepper-step ${stepClass}">
                <div class="step-icon">${index < currentStateIndex ? '<i class="fa-solid fa-check"></i>' : (index + 1)}</div>
                <div class="step-content">
                    <div class="step-title">${estado}</div>
                    <div class="step-time">${historialItem ? formatDate(historialItem.created_at) : (index === currentStateIndex ? 'En curso...' : 'Pendiente')}</div>
                </div>
            </div>`;
    }).join('');

    const tecnicoOptions = tecnicos?.map(t => `<option value="${t.id}" ${incident.tecnico_id === t.id ? 'selected' : ''}>${t.nombre}</option>`).join('') || '';

    content.innerHTML = `
        <div style="padding: 25px;">
            <div class="info-grid">
                <div class="info-item"><div class="info-label">Inquilino</div><div class="info-value">${incident.nombre_inquilino || 'Sin nombre'}</div></div>
                <div class="info-item"><div class="info-label">Teléfono</div><div class="info-value">${incident.telefono || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Dirección</div><div class="info-value">${incident.direccion || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Urgencia</div><div class="info-value"><span class="urgency-badge urgency-${incident.urgencia}">${incident.urgencia.toUpperCase()}</span></div></div>
            </div>
            <div style="margin: 20px 0;"><h4>Descripción</h4><p>${incident.descripcion}</p></div>
            <div class="stepper" style="margin: 30px 0;">${stepperHtml}</div>

            ${incident.estado === 'Reportada' ? `
                <div class="action-section">
                    <h4>Asignar Responsable de Pago</h4>
                    <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Casero')">Casero</button>
                    <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Inquilino')">Inquilino</button>
                </div>` : ''}

            ${incident.estado === 'Asignación de Pago' ? `
                <div class="action-section">
                    <h4>Asignar Técnico</h4>
                    <select id="tecnico-select" style="width:100%; padding:10px; margin-bottom:10px;"><option value="">Selecciona técnico...</option>${tecnicoOptions}</select>
                    <button class="action-btn success" onclick="asignarTecnico('${incident.id}')">Asignar y Avanzar</button>
                </div>` : ''}

            ${incident.estado === 'En manos del Técnico' ? `
                <button class="action-btn primary" onclick="avanzarEstado('${incident.id}', 'Reparación en Curso')">Iniciar Reparación</button>` : ''}

            ${incident.estado === 'Reparación en Curso' ? `
                <div class="action-section">
                    <h4>Enviar Presupuesto</h4>
                    <input type="number" id="presupuesto-monto" placeholder="Monto €" style="width:100%; margin-bottom:10px;">
                    <button class="action-btn primary" onclick="enviarPresupuesto('${incident.id}')">Enviar</button>
                </div>` : ''}

            ${incident.estado === 'Presupuesto Pendiente' ? `
                <div class="action-buttons">
                    <button class="action-btn success" onclick="gestionarPresupuesto('${incident.id}', 'aceptado')">Aceptar</button>
                    <button class="action-btn danger" onclick="gestionarPresupuesto('${incident.id}', 'rechazado')">Rechazar</button>
                </div>` : ''}

            ${incident.presupuesto_estado === 'aceptado' && incident.estado !== 'Solucionado' ? `
                <button class="action-btn success" onclick="avanzarEstado('${incident.id}', 'Solucionado')">Cerrar Incidencia</button>` : ''}
            
            <div style="margin-top:20px;">
                <textarea id="notas-casero" style="width:100%; min-height:80px;">${incident.notas_casero || ''}</textarea>
                <button class="action-btn primary" onclick="guardarNotas('${incident.id}')">Guardar Notas</button>
            </div>
        </div>`;
}

// Funciones Auxiliares de Acción
async function asignarResponsable(incidentId, responsable) {
    await _supabase.from('incidencias').update({ responsable_pago: responsable, estado: 'Asignación de Pago' }).eq('id', incidentId);
    await _supabase.from('historial_estados').insert({ incidencia_id: incidentId, estado_anterior: 'Reportada', estado_nuevo: 'Asignación de Pago', notas: `Pago: ${responsable}`, cambiado_por: currentUser.id });
    showIncidentDetail(incidentId); loadIncidents();
}

async function asignarTecnico(incidentId) {
    const tId = document.getElementById('tecnico-select').value;
    if (!tId) return;
    await _supabase.from('incidencias').update({ tecnico_id: tId, estado: 'En manos del Técnico' }).eq('id', incidentId);
    showIncidentDetail(incidentId); loadIncidents();
}

async function avanzarEstado(incidentId, nuevo) {
    const { data: inc } = await _supabase.from('incidencias').select('estado').eq('id', incidentId).single();
    await _supabase.from('incidencias').update({ estado: nuevo }).eq('id', incidentId);
    await _supabase.from('historial_estados').insert({ incidencia_id: incidentId, estado_anterior: inc.estado, estado_nuevo: nuevo, cambiado_por: currentUser.id });
    showIncidentDetail(incidentId); loadIncidents();
}

async function enviarPresupuesto(incidentId) {
    const m = document.getElementById('presupuesto-monto').value;
    await _supabase.from('incidencias').update({ presupuesto_monto: m, presupuesto_estado: 'pendiente', estado: 'Presupuesto Pendiente' }).eq('id', incidentId);
    showIncidentDetail(incidentId); loadIncidents();
}

async function gestionarPresupuesto(incidentId, dec) {
    await _supabase.from('incidencias').update({ presupuesto_estado: dec }).eq('id', incidentId);
    showIncidentDetail(incidentId); loadIncidents();
}

async function guardarNotas(incidentId) {
    const n = document.getElementById('notas-casero').value;
    await _supabase.from('incidencias').update({ notas_casero: n }).eq('id', incidentId);
    showToast('Notas guardadas');
}

function closeIncidentDetailModal() {
    document.getElementById('incident-detail-modal').classList.remove('active');
    loadIncidents();
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
