async function loadIncidentsLogistics() {
    const container = document.getElementById('incidents-logistics-container');
    container.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <div class="empty-state-text">Cargando incidencias...</div>
        </div>
    `;

    try {
        let incidents = [];

        if (isAdmin) {
            const { data } = await _supabase
                .from('incidencias')
                .select('*')
                .order('created_at', { ascending: false });

            incidents = data || [];
        } else {
            const { data } = await _supabase
                .from('incidencias')
                .select(`
                    *,
                    propiedades!inner (
                        id,
                        casero_id
                    )
                `)
                .eq('propiedades.casero_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-home"></i>
                        <div class="empty-state-text">No hay incidencias vinculadas a tus propiedades</div>
                    </div>
                `;
                return;
            }

            incidents = data;
        }

        const filterEstado = document.getElementById('filter-estado').value;
        const filterUrgencia = document.getElementById('filter-urgencia').value;

        if (filterEstado) {
            incidents = incidents.filter(i => i.estado === filterEstado);
        }

        if (filterUrgencia) {
            incidents = incidents.filter(i => i.urgencia === filterUrgencia);
        }

        if (incidents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-filter"></i>
                    <div class="empty-state-text">No se encontraron incidencias con estos filtros</div>
                </div>
            `;
            return;
        }

        renderIncidentsList(incidents);

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
                <div class="incident-title">${inc.titulo}</div>
                <span class="status-badge status-${inc.estado.replace(/ /g, '-')}" data-estado="${inc.estado}">${inc.estado}</span>
            </div>
            <div class="incident-info">
                <div class="incident-info-row">
                    <i class="fa-solid fa-user"></i>
                    <span>${inc.nombre_inquilino || 'Sin nombre'}</span>
                </div>
                <div class="incident-info-row">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${inc.direccion || 'Sin dirección'}</span>
                </div>
                <div class="incident-info-row">
                    <i class="fa-solid fa-tag"></i>
                    <span>${inc.categoria}</span>
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

    content.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
    `;

    modal.classList.add('active');

    try {
        const { data: incident } = await _supabase
            .from('incidencias')
            .select('*')
            .eq('id', incidentId)
            .single();

        if (!incident) {
            showToast('Incidencia no encontrada');
            return;
        }

        const { data: historial } = await _supabase
            .from('historial_estados')
            .select('*')
            .eq('incidencia_id', incidentId)
            .order('created_at', { ascending: true });

        const { data: tecnicos } = await _supabase
            .from('tecnicos')
            .select('*')
            .eq('casero_id', currentUser.id)
            .eq('activo', true);

        renderIncidentDetail(incident, historial, tecnicos);

    } catch (error) {
        console.error('Error loading incident detail:', error);
        showToast('Error al cargar el detalle');
    }
}

function renderIncidentDetail(incident, historial, tecnicos) {
    const content = document.getElementById('incident-detail-content');

    const estados = [
        'Reportada',
        'Asignación de Pago',
        'En manos del Técnico',
        'Reparación en Curso',
        'Presupuesto Pendiente',
        'Solucionado'
    ];

    const currentStateIndex = estados.indexOf(incident.estado);

    const stepperHtml = estados.map((estado, index) => {
        const isCompleted = index < currentStateIndex;
        const isActive = index === currentStateIndex;
        const stepClass = isCompleted ? 'completed' : (isActive ? 'active' : '');

        const historialItem = historial?.find(h => h.estado_nuevo === estado);
        const timeDisplay = historialItem
            ? formatDate(historialItem.created_at)
            : isActive
                ? 'En curso...'
                : 'Pendiente';

        return `
            <div class="stepper-step ${stepClass}">
                <div class="step-icon">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i>' : (index + 1)}
                </div>
                <div class="step-content">
                    <div class="step-title">${estado}</div>
                    <div class="step-time">${timeDisplay}</div>
                    ${historialItem && historialItem.notas ? `<div class="step-notes">${historialItem.notas}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    const tecnicoOptions = tecnicos && tecnicos.length > 0
        ? tecnicos.map(t => `<option value="${t.id}" ${incident.tecnico_id === t.id ? 'selected' : ''}>${t.nombre} - ${t.especialidad}</option>`).join('')
        : '<option value="">No hay técnicos disponibles</option>';

    const html = `
        <div style="padding: 25px;">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Inquilino</div>
                    <div class="info-value">${incident.nombre_inquilino || 'Sin nombre'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${incident.email_inquilino || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Teléfono</div>
                    <div class="info-value">${incident.telefono || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dirección</div>
                    <div class="info-value">${incident.direccion || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Categoría</div>
                    <div class="info-value">${incident.categoria}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Urgencia</div>
                    <div class="info-value">
                        <span class="urgency-badge urgency-${incident.urgencia}">${incident.urgencia.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div style="margin: 20px 0;">
                <h4 style="font-weight: 800; margin-bottom: 10px; color: var(--text-light); font-size: 0.85rem; text-transform: uppercase;">Descripción</h4>
                <p style="color: var(--text-main); line-height: 1.6;">${incident.descripcion}</p>
            </div>

            ${incident.notas_casero ? `
                <div style="margin: 20px 0;">
                    <h4 style="font-weight: 800; margin-bottom: 10px; color: var(--text-light); font-size: 0.85rem; text-transform: uppercase;">Notas del Casero</h4>
                    <p style="color: var(--text-main); line-height: 1.6; background: var(--primary-light); padding: 12px; border-radius: var(--radius-md);">${incident.notas_casero}</p>
                </div>
            ` : ''}

            <div style="margin: 30px 0;">
                <h4 style="font-weight: 800; margin-bottom: 20px; color: var(--secondary); font-size: 1.1rem;">Trazabilidad de la Incidencia</h4>
                <div class="stepper">
                    ${stepperHtml}
                </div>
            </div>

            ${incident.estado === 'Reportada' ? `
                <div class="action-section">
                    <h4>Asignar Responsable de Pago</h4>
                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Casero')">
                            <i class="fa-solid fa-user-tie"></i> Casero
                        </button>
                        <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Inquilino')">
                            <i class="fa-solid fa-user"></i> Inquilino
                        </button>
                        <button class="action-btn primary" onclick="asignarResponsable('${incident.id}', 'Seguro')">
                            <i class="fa-solid fa-shield"></i> Seguro
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Asignación de Pago' && incident.responsable_pago ? `
                <div class="action-section">
                    <h4>Responsable: ${incident.responsable_pago}</h4>
                    <div style="margin-top: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Asignar Técnico</label>
                        <select id="tecnico-select" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px;">
                            <option value="">Selecciona un técnico...</option>
                            ${tecnicoOptions}
                        </select>
                        <button class="action-btn success" onclick="asignarTecnico('${incident.id}')">
                            <i class="fa-solid fa-toolbox"></i> Asignar y Avanzar
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'En manos del Técnico' ? `
                <div class="action-section">
                    <h4>Técnico Asignado</h4>
                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="avanzarEstado('${incident.id}', 'Reparación en Curso')">
                            <i class="fa-solid fa-gear"></i> Iniciar Reparación
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Reparación en Curso' ? `
                <div class="action-section">
                    <h4>Solicitar Presupuesto</h4>
                    <div style="margin-top: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Monto (€)</label>
                        <input type="number" id="presupuesto-monto" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px;" placeholder="0.00" step="0.01">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Descripción</label>
                        <textarea id="presupuesto-descripcion" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px; min-height: 80px;" placeholder="Descripción del presupuesto..."></textarea>
                        <button class="action-btn primary" onclick="enviarPresupuesto('${incident.id}')">
                            <i class="fa-solid fa-file-invoice-dollar"></i> Enviar Presupuesto
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Presupuesto Pendiente' && incident.presupuesto_estado === 'pendiente' ? `
                <div class="action-section">
                    <h4>Presupuesto Enviado</h4>
                    <div class="info-grid" style="margin: 15px 0;">
                        <div class="info-item">
                            <div class="info-label">Monto</div>
                            <div class="info-value">${incident.presupuesto_monto} €</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Estado</div>
                            <div class="info-value">Pendiente de aceptación</div>
                        </div>
                    </div>
                    ${incident.presupuesto_descripcion ? `<p style="color: var(--text-main); margin-bottom: 15px;">${incident.presupuesto_descripcion}</p>` : ''}
                    <div class="action-buttons">
                        <button class="action-btn success" onclick="gestionarPresupuesto('${incident.id}', 'aceptado')">
                            <i class="fa-solid fa-check"></i> Aceptar
                        </button>
                        <button class="action-btn danger" onclick="gestionarPresupuesto('${incident.id}', 'rechazado')">
                            <i class="fa-solid fa-times"></i> Rechazar
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.presupuesto_estado === 'aceptado' && incident.estado !== 'Solucionado' ? `
                <div class="action-section">
                    <h4>Presupuesto Aceptado</h4>
                    <p style="color: var(--success); font-weight: 700; margin-bottom: 15px;">Presupuesto de ${incident.presupuesto_monto}€ aceptado</p>
                    <div class="action-buttons">
                        <button class="action-btn success" onclick="avanzarEstado('${incident.id}', 'Solucionado')">
                            <i class="fa-solid fa-check-circle"></i> Marcar como Solucionado
                        </button>
                    </div>
                </div>
            ` : ''}

            ${incident.estado === 'Solucionado' ? `
                <div class="action-section" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border: 2px solid var(--success);">
                    <h4 style="color: var(--success);">
                        <i class="fa-solid fa-check-circle"></i> Incidencia Solucionada
                    </h4>
                    <p style="color: var(--text-main); margin-top: 10px;">Esta incidencia ha sido completada exitosamente.</p>
                </div>
            ` : ''}

            <div style="margin-top: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem;">Notas Internas del Casero</label>
                <textarea id="notas-casero" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-md); min-height: 80px;">${incident.notas_casero || ''}</textarea>
                <button class="action-btn primary" style="margin-top: 10px;" onclick="guardarNotas('${incident.id}')">
                    <i class="fa-solid fa-save"></i> Guardar Notas
                </button>
            </div>
        </div>
    `;

    content.innerHTML = html;
}

async function asignarResponsable(incidentId, responsable) {
    try {
        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({
                responsable_pago: responsable,
                estado: 'Asignación de Pago'
            })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        const { error: historialError } = await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Reportada',
                estado_nuevo: 'Asignación de Pago',
                notas: `Responsable de pago asignado: ${responsable}`,
                cambiado_por: currentUser.id
            });

        if (historialError) throw historialError;

        showToast(`Responsable asignado: ${responsable}`);
        showIncidentDetail(incidentId);
        loadDashboard();

    } catch (error) {
        console.error('Error asignando responsable:', error);
        showToast('Error al asignar responsable');
    }
}

async function asignarTecnico(incidentId) {
    const tecnicoId = document.getElementById('tecnico-select').value;

    if (!tecnicoId) {
        showToast('Selecciona un técnico');
        return;
    }

    try {
        const { data: tecnico } = await _supabase
            .from('tecnicos')
            .select('nombre')
            .eq('id', tecnicoId)
            .single();

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({
                tecnico_id: tecnicoId,
                estado: 'En manos del Técnico'
            })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        const { error: historialError } = await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Asignación de Pago',
                estado_nuevo: 'En manos del Técnico',
                notas: `Técnico asignado: ${tecnico.nombre}`,
                cambiado_por: currentUser.id
            });

        if (historialError) throw historialError;

        showToast('Técnico asignado correctamente');
        showIncidentDetail(incidentId);
        loadDashboard();

    } catch (error) {
        console.error('Error asignando técnico:', error);
        showToast('Error al asignar técnico');
    }
}

async function avanzarEstado(incidentId, nuevoEstado) {
    try {
        const { data: incident } = await _supabase
            .from('incidencias')
            .select('estado')
            .eq('id', incidentId)
            .single();

        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({ estado: nuevoEstado })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        const { error: historialError } = await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: incident.estado,
                estado_nuevo: nuevoEstado,
                cambiado_por: currentUser.id
            });

        if (historialError) throw historialError;

        showToast('Estado actualizado correctamente');
        showIncidentDetail(incidentId);
        loadDashboard();

    } catch (error) {
        console.error('Error avanzando estado:', error);
        showToast('Error al actualizar estado');
    }
}

async function enviarPresupuesto(incidentId) {
    const monto = document.getElementById('presupuesto-monto').value;
    const descripcion = document.getElementById('presupuesto-descripcion').value;

    if (!monto || parseFloat(monto) <= 0) {
        showToast('Introduce un monto válido');
        return;
    }

    try {
        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({
                presupuesto_monto: parseFloat(monto),
                presupuesto_descripcion: descripcion,
                presupuesto_estado: 'pendiente',
                estado: 'Presupuesto Pendiente'
            })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        const { error: historialError } = await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Reparación en Curso',
                estado_nuevo: 'Presupuesto Pendiente',
                notas: `Presupuesto enviado: ${monto}€`,
                cambiado_por: currentUser.id
            });

        if (historialError) throw historialError;

        showToast('Presupuesto enviado correctamente');
        showIncidentDetail(incidentId);
        loadDashboard();

    } catch (error) {
        console.error('Error enviando presupuesto:', error);
        showToast('Error al enviar presupuesto');
    }
}

async function gestionarPresupuesto(incidentId, decision) {
    try {
        const { error: updateError } = await _supabase
            .from('incidencias')
            .update({ presupuesto_estado: decision })
            .eq('id', incidentId);

        if (updateError) throw updateError;

        const mensaje = decision === 'aceptado'
            ? 'Presupuesto aceptado - Se procederá con el pago'
            : 'Presupuesto rechazado - Se debe negociar';

        const { error: historialError } = await _supabase
            .from('historial_estados')
            .insert({
                incidencia_id: incidentId,
                estado_anterior: 'Presupuesto Pendiente',
                estado_nuevo: 'Presupuesto Pendiente',
                notas: mensaje,
                cambiado_por: currentUser.id
            });

        if (historialError) throw historialError;

        showToast(decision === 'aceptado' ? 'Presupuesto aceptado' : 'Presupuesto rechazado');
        showIncidentDetail(incidentId);
        loadDashboard();

    } catch (error) {
        console.error('Error gestionando presupuesto:', error);
        showToast('Error al gestionar presupuesto');
    }
}

async function guardarNotas(incidentId) {
    const notas = document.getElementById('notas-casero').value;

    try {
        const { error } = await _supabase
            .from('incidencias')
            .update({ notas_casero: notas })
            .eq('id', incidentId);

        if (error) throw error;

        showToast('Notas guardadas correctamente');

    } catch (error) {
        console.error('Error guardando notas:', error);
        showToast('Error al guardar notas');
    }
}

function closeIncidentDetailModal() {
    document.getElementById('incident-detail-modal').classList.remove('active');
    loadIncidentsLogistics();
}
