// js/reparto.js

document.addEventListener('DOMContentLoaded', () => {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.innerText = `Usuario: ${localStorage.getItem('currentUser') || 'Invitado'}`;
    }
    renderRepartoTable();
    document.getElementById('repartoForm').addEventListener('submit', handleRepartoSubmit);
});

let repartosList = JSON.parse(localStorage.getItem('repartosListKey')) || [];
let paquetesList = JSON.parse(localStorage.getItem('paqueteListKey')) || [];
let personalList = JSON.parse(localStorage.getItem('personalListKey')) || [];
let transporteList = JSON.parse(localStorage.getItem('transporteListKey')) || [];

let paquetesSeleccionados = [];
let hojaRutaBloqueada = false;
let repartoIdSeleccionadoDetalle = null;

function prepareRepartoModal() {
    document.getElementById('repartoForm').reset();
    document.getElementById('editRepartoId').value = "";
    document.getElementById('repartoModalTitle').innerText = "Configurar Nuevo Reparto Logístico";
    
    paquetesSeleccionados = [];
    hojaRutaBloqueada = false;
    
    document.getElementById('hojaRutaSection').classList.add('d-none');
    document.getElementById('btnGuardarReparto').disabled = true;
    document.getElementById('btnAsignarHojaRuta').className = "btn btn-sm btn-success";
    document.getElementById('btnAsignarHojaRuta').innerText = "Fijar Orden de Ruta";

    cargarComboTransporte("");
    cargarCheckboxesPersonal([]);
    renderSelectorPaquetes();
}

function cargarComboTransporte(patenteActual) {
    const transportSelect = document.getElementById('repTransporte');
    transportSelect.innerHTML = '<option value="">-- Sin Vehículo Asignado --</option>';
    
    transporteList.forEach(t => {
        if (t.estado === 'Disponible' || t.patente === patenteActual) {
            const selected = t.patente === patenteActual ? 'selected' : '';
            transportSelect.innerHTML += `<option value="${t.patente}" ${selected}>${t.marca} - [${t.patente}]</option>`;
        }
    });
}

function cargarCheckboxesPersonal(personalAsignado) {
    const personalContainer = document.getElementById('repPersonalContainer');
    personalContainer.innerHTML = '';
    
    personalList.filter(p => p.estado === 'Activo').forEach(p => {
        const nombreCompleto = `${p.apellido}, ${p.nombre}`;
        const checked = personalAsignado.includes(nombreCompleto) ? 'checked' : '';
        personalContainer.innerHTML += `
            <div class="form-check">
                <input class="form-check-input check-personal" type="checkbox" value="${nombreCompleto}" id="p_${p.legajo}" ${checked}>
                <label class="form-check-label" for="p_${p.legajo}">${p.apellido}, ${p.nombre}</label>
            </div>`;
    });
}

function renderSelectorPaquetes() {
    const tbody = document.getElementById('repPaquetesContainer');
    tbody.innerHTML = '';
    
    const trackingsSeleccionados = paquetesSeleccionados.map(s => s.tracking);
    const disponibles = paquetesList.filter(p => p.estado === 'En sucursal listo para envío' || trackingsSeleccionados.includes(p.tracking));

    if (disponibles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-3">No hay paquetes elegibles listos para envío.</td></tr>`;
        return;
    }

    disponibles.forEach(p => {
        const yaElegido = trackingsSeleccionados.includes(p.tracking);
        tbody.innerHTML += `
            <tr>
                <td class="text-center">
                    <input class="form-check-input check-origen-paquete" type="checkbox" value="${p.tracking}"
                    ${yaElegido ? 'checked' : ''} onchange="procesarCheckPaquete('${p.tracking}')" ${hojaRutaBloqueada ? 'disabled' : ''}>
                </td>
                <td><strong>${p.tracking}</strong></td>
                <td>${p.destinatario}</td>
                <td>${p.direccion}</td>
                <td>${p.peso} kg</td>
            </tr>`;
    });
}

function procesarCheckPaquete(tracking) {
    const indice = paquetesSeleccionados.findIndex(p => p.tracking === tracking);
    if (indice > -1) {
        paquetesSeleccionados.splice(indice, 1);
    } else {
        const pkg = paquetesList.find(p => p.tracking === tracking);
        if(pkg) paquetesSeleccionados.push({...pkg});
    }

    hojaRutaBloqueada = false;
    
    document.getElementById('btnGuardarReparto').disabled = paquetesSeleccionados.length === 0;
    
    document.getElementById('btnAsignarHojaRuta').className = "btn btn-sm btn-success";
    document.getElementById('btnAsignarHojaRuta').innerText = "Fijar Orden de Ruta";

    const section = document.getElementById('hojaRutaSection');
    if (paquetesSeleccionados.length > 0) {
        section.classList.remove('d-none');
    } else {
        section.classList.add('d-none');
    }
    renderHojaRutaOrdenable();
}

function renderHojaRutaOrdenable() {
    const tbody = document.getElementById('hojaRutaOrdenableBody');
    tbody.innerHTML = '';

    paquetesSeleccionados.forEach((p, i) => {
        tbody.innerHTML += `
            <tr>
                <td class="text-center align-middle bg-light"><strong>${i + 1}º</strong></td>
                <td class="align-middle"><span class="badge bg-secondary">${p.tracking}</span></td>
                <td class="align-middle"><small>${p.destinatario} (${p.direccion})</small></td>
                <td class="text-center align-middle">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary px-2" onclick="subirPaquete(${i})" ${i === 0 || hojaRutaBloqueada ? 'disabled' : ''}>Atrás</button>
                        <button type="button" class="btn btn-outline-primary px-2" onclick="bajarPaquete(${i})" ${i === paquetesSeleccionados.length - 1 || hojaRutaBloqueada ? 'disabled' : ''}>Siguiente</button>
                    </div>
                </td>
            </tr>`;
    });
}

function subirPaquete(index) {
    if (index === 0) return;
    [paquetesSeleccionados[index], paquetesSeleccionados[index - 1]] = [paquetesSeleccionados[index - 1], paquetesSeleccionados[index]];
    renderHojaRutaOrdenable();
}

function bajarPaquete(index) {
    if (index === paquetesSeleccionados.length - 1) return;
    [paquetesSeleccionados[index], paquetesSeleccionados[index + 1]] = [paquetesSeleccionados[index + 1], paquetesSeleccionados[index]];
    renderHojaRutaOrdenable();
}

function lockAndAssignHojaRuta() {
    if (paquetesSeleccionados.length === 0) return;
    hojaRutaBloqueada = true;
    
    const btn = document.getElementById('btnAsignarHojaRuta');
    btn.className = "btn btn-sm btn-secondary";
    btn.innerText = "Ruta Confirmada";

    renderSelectorPaquetes();
    renderHojaRutaOrdenable();
}

function handleRepartoSubmit(e) {
    e.preventDefault();

    if (paquetesSeleccionados.length === 0) {
        alert("Debe seleccionar al menos un paquete para crear el reparto.");
        return;
    }

    const checkedPersonal = Array.from(document.querySelectorAll('.check-personal:checked')).map(cb => cb.value);
    if (checkedPersonal.length > 2) {
        alert("Restricción: Asigne un máximo de 2 operarios.");
        return;
    }

    const idEdicion = document.getElementById('editRepartoId').value;
    const transporteSeleccionado = document.getElementById('repTransporte').value;
    
    const tienePersonal = checkedPersonal.length > 0;
    const tieneTransporte = transporteSeleccionado !== "";
    const tieneHojaRuta = hojaRutaBloqueada;

    const estadoAsignado = (tienePersonal && tieneTransporte && tieneHojaRuta) ? 'Listo para iniciar' : 'En preparación';

    paquetesSeleccionados.forEach(p => p.estado = 'En reparto');
    const codigosNuevos = paquetesSeleccionados.map(p => p.tracking);

    if (idEdicion !== "") {
        const idxReparto = repartosList.findIndex(r => r.id == idEdicion);
        if (idxReparto > -1) {
            const antiguosTrackings = repartosList[idxReparto].paquetes.map(p => p.tracking);
            
            paquetesList.forEach(p => {
                if (antiguosTrackings.includes(p.tracking) && !codigosNuevos.includes(p.tracking)) {
                    p.estado = 'En sucursal listo para envío';
                }
            });

            const transporteAnterior = repartosList[idxReparto].transporte;
            if (transporteAnterior && transporteAnterior !== transporteSeleccionado) {
                const idxOldT = transporteList.findIndex(t => t.patente === transporteAnterior);
                if (idxOldT > -1) transporteList[idxOldT].estado = 'Disponible';
            }

            repartosList[idxReparto].transporte = transporteSeleccionado;
            repartosList[idxReparto].personal = checkedPersonal;
            repartosList[idxReparto].paquetes = [...paquetesSeleccionados];
            repartosList[idxReparto].estado = estadoAsignado;
        }
    } else {
        const nuevoReparto = {
            id: repartosList.length > 0 ? repartosList[repartosList.length - 1].id + 1 : 5001,
            transporte: transporteSeleccionado,
            personal: checkedPersonal,
            paquetes: [...paquetesSeleccionados],
            estado: estadoAsignado 
        };
        repartosList.push(nuevoReparto);
    }

    if (transporteSeleccionado) {
        const idxNewT = transporteList.findIndex(t => t.patente === transporteSeleccionado);
        if (idxNewT > -1) transporteList[idxNewT].estado = 'En uso';
    }

    paquetesList.forEach(p => {
        if (codigosNuevos.includes(p.tracking)) {
            p.estado = 'En reparto';
        }
    });

    localStorage.setItem('repartosListKey', JSON.stringify(repartosList));
    localStorage.setItem('transporteListKey', JSON.stringify(transporteList));
    localStorage.setItem('paqueteListKey', JSON.stringify(paquetesList));

    renderRepartoTable();
    bootstrap.Modal.getInstance(document.getElementById('repartoModal')).hide();
}

function renderRepartoTable() {
    const tbody = document.getElementById('repartoTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (repartosList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">No hay repartos registrados.</td></tr>`;
        return;
    }

    repartosList.forEach((r, index) => {
        let claseBadge = 'bg-secondary';
        if (r.estado === 'Listo para iniciar') claseBadge = 'bg-primary';
        if (r.estado === 'En proceso') claseBadge = 'bg-warning text-dark';
        if (r.estado === 'Finalizado') claseBadge = 'bg-success';
        if (r.estado === 'Cancelado por anomalía') claseBadge = 'bg-danger';

        let actionButtons = `<button class="btn btn-sm btn-info text-white fw-bold me-1" onclick="verDetalleReparto(${index})">Ver Detalle</button>`;
        
        if (r.estado === 'Listo para iniciar') {
            actionButtons += `<button class="btn btn-sm btn-success fw-bold" onclick="iniciarReparto(${index})">Iniciar</button>`;
        } else if (r.estado === 'En proceso') {
            actionButtons += `<button class="btn btn-sm btn-danger fw-bold" onclick="finalizarReparto(${index})">Finalizar</button>`;
        }

        let vehiculoTexto = r.transporte ? r.transporte : 'N/A';
        let personalTexto = r.personal && r.personal.length > 0 ? r.personal.join(' / ') : 'N/A';

        tbody.innerHTML += `
            <tr>
                <td class="align-middle"><strong>#${r.id}</strong></td>
                <td class="align-middle"><span class="badge bg-dark">${vehiculoTexto}</span></td>
                <td class="align-middle"><small>${personalTexto}</small></td>
                <td class="align-middle"><span class="badge bg-primary">${r.paquetes.length} bultos</span></td>
                <td class="align-middle"><span class="badge ${claseBadge}">${r.estado}</span></td>
                <td class="align-middle">
                    <div class="d-flex flex-nowrap gap-1">
                        ${actionButtons}
                    </div>
                </td>
            </tr>`;
    });
}

function iniciarReparto(index) {
    if(confirm("¿Está seguro que desea dar inicio al recorrido de este reparto?")) {
        const reparto = repartosList[index];
        reparto.estado = 'En proceso';

        localStorage.setItem('repartosListKey', JSON.stringify(repartosList));
        
        renderRepartoTable();
        alert("Reparto iniciado con éxito.");
    }
}

function finalizarReparto(index) {
    if(confirm("¿Confirma la finalización de este reparto? Los paquetes no entregados volverán a sucursal.")) {
        const reparto = repartosList[index];
        reparto.estado = 'Finalizado';

        const idxTransporte = transporteList.findIndex(t => t.patente === reparto.transporte);
        if(idxTransporte > -1) {
            transporteList[idxTransporte].estado = 'Disponible';
        }

        reparto.paquetes.forEach(pkg => {
            const paqueteMaster = paquetesList.find(p => p.tracking === pkg.tracking);
            
            if(paqueteMaster && paqueteMaster.estado !== 'Entregado' && paqueteMaster.estado !== 'Anomalía') {
                paqueteMaster.vecesEnviado = (paqueteMaster.vecesEnviado || 0) + 1;
                
                if(paqueteMaster.vecesEnviado >= 3) {
                    paqueteMaster.estado = 'En sucursal esperando retiro';
                } else {
                    paqueteMaster.estado = 'En sucursal listo para envío';
                }
            }
        });

        localStorage.setItem('repartosListKey', JSON.stringify(repartosList));
        localStorage.setItem('transporteListKey', JSON.stringify(transporteList));
        localStorage.setItem('paqueteListKey', JSON.stringify(paquetesList));

        renderRepartoTable();
        alert("Reparto finalizado correctamente.");
    }
}

function verDetalleReparto(index) {
    const reparto = repartosList[index];
    repartoIdSeleccionadoDetalle = reparto.id;

    document.getElementById('detRepartoTitle').innerText = `Detalles Completos del Reparto #${reparto.id} - Estado: ${reparto.estado}`;
    document.getElementById('detTransporte').innerText = reparto.transporte ? `Patente Vehicular: ${reparto.transporte}` : "No asignado";
    document.getElementById('detPersonal').innerText = reparto.personal && reparto.personal.length > 0 ? reparto.personal.join(' y ') : "No asignado";

    const btnModificar = document.getElementById('btnModificarDesdeDetalle');

    if (reparto.estado === 'Finalizado' || reparto.estado === 'En proceso' || reparto.estado === 'Cancelado por anomalía') {
        btnModificar.disabled = true;
    } else {
        btnModificar.disabled = false;
    }

    const tbodyRuta = document.getElementById('detHojaRutaTableBody');
    tbodyRuta.innerHTML = '';

    reparto.paquetes.forEach((pkg, i) => {
        const paqueteMaster = paquetesList.find(p => p.tracking === pkg.tracking) || pkg;
        let badgeEstadoClase = 'bg-secondary text-white';
        
        if (paqueteMaster.estado === 'Entregado') badgeEstadoClase = 'bg-success text-white';
        else if (paqueteMaster.estado === 'En reparto') badgeEstadoClase = 'bg-info text-dark';
        else if (paqueteMaster.estado === 'Anomalía') badgeEstadoClase = 'bg-danger text-white';
        else if (paqueteMaster.estado === 'En sucursal esperando retiro') badgeEstadoClase = 'bg-danger text-white';

        let entregarBtnHTML = '';
        if (reparto.estado === 'En proceso' && paqueteMaster.estado !== 'Entregado' && paqueteMaster.estado !== 'Anomalía') {
            entregarBtnHTML = `<button class="btn btn-sm btn-success py-0 px-2 ms-2" onclick="entregarPaqueteDesdeReparto('${paqueteMaster.tracking}')">Entregar</button>`;
        }

        tbodyRuta.innerHTML += `
            <tr>
                <td class="text-center font-weight-bold table-secondary align-middle"><strong>${i + 1}º</strong></td>
                <td class="align-middle"><span class="badge bg-secondary">${pkg.tracking}</span></td>
                <td class="align-middle">${pkg.destinatario}</td>
                <td class="align-middle"><small>${pkg.direccion} (CP ${pkg.cp})</small></td>
                <td class="align-middle">${pkg.peso} kg</td>
                <td class="text-center align-middle">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="badge ${badgeEstadoClase}">${paqueteMaster.estado}</span>
                        ${entregarBtnHTML}
                    </div>
                </td>
            </tr>`;
    });

    // FIX DEL BACKDROP FANTASMA: getOrCreateInstance en lugar de generar una ventana nueva
    const modalElement = document.getElementById('detalleRepartoModal');
    const modalDetalle = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalDetalle.show();
}

window.entregarPaqueteDesdeReparto = function(tracking) {
    if(confirm(`¿Confirmar la entrega del paquete ${tracking}?`)) {
        const pkgIndex = paquetesList.findIndex(p => p.tracking === tracking);
        if(pkgIndex > -1) {
            paquetesList[pkgIndex].estado = 'Entregado';
            localStorage.setItem('paqueteListKey', JSON.stringify(paquetesList));
            
            const idxReparto = repartosList.findIndex(r => r.id == repartoIdSeleccionadoDetalle);
            if(idxReparto > -1) {
                // Actualiza visualmente sin causar conflicto de ventanas
                verDetalleReparto(idxReparto);
            }
        }
    }
}

function dispararEdicionDesdeDetalle() {
    if (!repartoIdSeleccionadoDetalle) return;

    const reparto = repartosList.find(r => r.id == repartoIdSeleccionadoDetalle);
    if (!reparto || reparto.estado === 'Finalizado' || reparto.estado === 'En proceso') {
        return; 
    }

    const modalDetalleElement = document.getElementById('detalleRepartoModal');
    const modalDetalleInstance = bootstrap.Modal.getInstance(modalDetalleElement);
    if (modalDetalleInstance) {
        modalDetalleInstance.hide();
    }

    document.getElementById('editRepartoId').value = reparto.id;
    document.getElementById('repartoModalTitle').innerText = `Editar Reparto #${reparto.id}`;

    hojaRutaBloqueada = false;
    document.getElementById('btnGuardarReparto').disabled = false;
    document.getElementById('btnAsignarHojaRuta').className = "btn btn-sm btn-success";
    document.getElementById('btnAsignarHojaRuta').innerText = "Fijar Orden de Ruta";

    paquetesSeleccionados = [...reparto.paquetes];

    cargarComboTransporte(reparto.transporte);
    cargarCheckboxesPersonal(reparto.personal);
    
    document.getElementById('hojaRutaSection').classList.remove('d-none');
    renderSelectorPaquetes();
    renderHojaRutaOrdenable();

    setTimeout(() => {
        // FIX DEL BACKDROP FANTASMA: getOrCreateInstance en lugar de generar una ventana nueva
        const modalReparto = bootstrap.Modal.getOrCreateInstance(document.getElementById('repartoModal'));
        modalReparto.show();
    }, 400);
}
