// js/paquete.js

document.addEventListener('DOMContentLoaded', () => {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.innerText = `Usuario: ${localStorage.getItem('currentUser') || 'Invitado'}`;
    }
    
    renderPaqueteTable();

    // Evento de Alta/Modificación de Paquete
    const paqueteForm = document.getElementById('paqueteForm');
    if (paqueteForm) {
        paqueteForm.addEventListener('submit', handlePaqueteSubmit);
    }

    // Evento de Registro de Anomalía (RF5)
    const anomaliaForm = document.getElementById('anomaliaForm');
    if (anomaliaForm) {
        anomaliaForm.addEventListener('submit', handleAnomaliaSubmit);
    }
});

let paqueteList = JSON.parse(localStorage.getItem('paqueteListKey')) || [];

function renderPaqueteTable() {
    const tableBody = document.getElementById('paqueteTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    let enProceso = 0;
    let entregados = 0;

    if (paqueteList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted p-4">No hay paquetes registrados en el depósito.</td></tr>`;
    } else {
        paqueteList.forEach((pkg, index) => {
            if (pkg.estado === 'Entregado') entregados++;
            else enProceso++;

            let badgeClass = 'bg-warning text-dark';
            if(pkg.estado === 'Entregado') badgeClass = 'bg-success';
            if(pkg.estado === 'En reparto') badgeClass = 'bg-info text-dark';
            if(pkg.estado === 'En sucursal esperando retiro' || pkg.estado === 'Anomalía') badgeClass = 'bg-danger text-white';

            const enviosCount = pkg.vecesEnviado || 0;

            tableBody.innerHTML += `
                <tr>
                    <td class="align-middle"><span class="badge bg-secondary">${pkg.tracking}</span></td>
                    <td class="align-middle">${pkg.remitente}</td>
                    <td class="align-middle">${pkg.destinatario}</td>
                    <td class="align-middle">${pkg.direccion} (CP ${pkg.cp})</td>
                    <td class="align-middle">${pkg.peso} kg</td>
                    <td class="align-middle text-center fw-bold">${enviosCount}/3</td>
                    <td class="align-middle">
                        <span class="badge ${badgeClass}">${pkg.estado}</span>
                    </td>
                    <td class="align-middle">
                        <div class="d-flex flex-nowrap gap-1">
                            <button class="btn btn-sm btn-warning" onclick="editPaquete(${index})">Editar</button>
                            
                            ${(pkg.estado !== 'Entregado' && pkg.estado !== 'Dado de baja' && pkg.estado !== 'Anomalía') ? 
                                `<button class="btn btn-sm btn-danger" onclick="abrirModalAnomalia(${index})">Registrar anomalía</button>` : ''}
                            
                            ${(pkg.anomalia) ? 
                                `<button class="btn btn-sm btn-outline-danger fw-bold" onclick="verDetalleAnomalia(${index})">Ver Anomalía</button>` : ''}
                            
                            ${(pkg.estado === 'En sucursal esperando retiro') ? 
                                `<button class="btn btn-sm btn-success" onclick="marcarEntregado(${index})">Entregar</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById('countTotal').innerText = paqueteList.length;
    document.getElementById('countProceso').innerText = enProceso;
    document.getElementById('countEntregados').innerText = entregados;
}

function savePaquetesToLocalStorage() {
    localStorage.setItem('paqueteListKey', JSON.stringify(paqueteList));
    renderPaqueteTable();
}

function handlePaqueteSubmit(e) {
    e.preventDefault(); 
    
    const index = document.getElementById('editIndex').value;
    
    const data = {
        tracking: document.getElementById('tracking').value.toUpperCase().trim(),
        peso: document.getElementById('peso').value.trim(),
        remitente: document.getElementById('remitente').value.trim(),
        destinatario: document.getElementById('destinatario').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        cp: document.getElementById('cp').value.trim(),
        vecesEnviado: index === "" ? 0 : (paqueteList[index].vecesEnviado || 0),
        estado: index === "" ? "En sucursal listo para envío" : paqueteList[index].estado,
        anomalia: index !== "" ? paqueteList[index].anomalia : null 
    };

    if (index === "") {
        const existe = paqueteList.some(p => p.tracking === data.tracking);
        if (existe) {
            alert(`Error: Ya existe un bulto con el Nro. de Seguimiento: ${data.tracking}`);
            return;
        }
        paqueteList.push(data);
    } else {
        paqueteList[index] = data;
    }

    savePaquetesToLocalStorage();

    const modalElement = document.getElementById('paqueteModal');
    if (modalElement) {
        const closeBtn = modalElement.querySelector('.btn-close');
        if (closeBtn) closeBtn.click();
    }
}

function editPaquete(index) {
    document.getElementById('modalTitle').innerText = "Modificar Paquete";
    document.getElementById('editIndex').value = index;
    const pkg = paqueteList[index];
    
    document.getElementById('tracking').value = pkg.tracking;
    document.getElementById('tracking').readOnly = true; 
    document.getElementById('peso').value = pkg.peso;
    document.getElementById('remitente').value = pkg.remitente;
    document.getElementById('destinatario').value = pkg.destinatario;
    document.getElementById('direccion').value = pkg.direccion;
    document.getElementById('cp').value = pkg.cp;

    const modal = new bootstrap.Modal(document.getElementById('paqueteModal'));
    modal.show();
}

function marcarEntregado(index) {
    if(confirm("¿Confirmar la entrega de este paquete directamente en la sucursal?")) {
        paqueteList[index].estado = "Entregado";
        savePaquetesToLocalStorage();
    }
}

function clearPaqueteForm() {
    document.getElementById('modalTitle').innerText = "Registrar Paquete Manual";
    document.getElementById('editIndex').value = "";
    document.getElementById('tracking').readOnly = false;
    const form = document.getElementById('paqueteForm');
    if (form) form.reset();
}

// -------------------------------------------------------------------
// LÓGICA DE NEGOCIO: REGISTRAR ANOMALÍA (RF5)
// -------------------------------------------------------------------

function abrirModalAnomalia(index) {
    const form = document.getElementById('anomaliaForm');
    if(form) form.reset();
    
    const pkg = paqueteList[index];
    document.getElementById('anomaliaIndex').value = index;
    
    document.getElementById('anomaliaTracking').value = pkg.tracking;
    
    const currentUser = localStorage.getItem('currentUser') || '';
    document.getElementById('anomaliaLegajo').value = currentUser;
    
    const modal = new bootstrap.Modal(document.getElementById('anomaliaModal'));
    modal.show();
}

function handleAnomaliaSubmit(e) {
    e.preventDefault();
    
    const index = document.getElementById('anomaliaIndex').value;
    const tracking = document.getElementById('anomaliaTracking').value.trim();
    const nombre = document.getElementById('anomaliaNombre').value.trim();
    const motivo = document.getElementById('anomaliaMotivo').value.trim();
    const legajo = document.getElementById('anomaliaLegajo').value.trim();

    if (!nombre || !motivo || !legajo) {
        alert("Error: Por favor, complete todos los campos requeridos.");
        return;
    }

    paqueteList[index].estado = "Anomalía";
    
    paqueteList[index].anomalia = {
        tracking: tracking,
        nombre: nombre,
        motivo: motivo,
        legajoResponsable: legajo,
        fechaHora: new Date().toLocaleString()
    };

    savePaquetesToLocalStorage();

    const modalElement = document.getElementById('anomaliaModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
    
    alert("Anomalía registrada correctamente.");
}

// -------------------------------------------------------------------
// VISTA: VER DETALLES DE ANOMALÍA
// -------------------------------------------------------------------

function verDetalleAnomalia(index) {
    const pkg = paqueteList[index];
    
    if (!pkg.anomalia) {
        alert("No se encontraron detalles de anomalía registrados para este paquete.");
        return;
    }

    document.getElementById('verAnomaliaTracking').innerText = pkg.anomalia.tracking || pkg.tracking;
    document.getElementById('verAnomaliaNombre').innerText = pkg.anomalia.nombre;
    document.getElementById('verAnomaliaMotivo').innerText = pkg.anomalia.motivo;
    document.getElementById('verAnomaliaLegajo').innerText = pkg.anomalia.legajoResponsable;
    document.getElementById('verAnomaliaFecha').innerText = pkg.anomalia.fechaHora || 'Fecha no registrada';

    const modal = new bootstrap.Modal(document.getElementById('verAnomaliaModal'));
    modal.show();
}