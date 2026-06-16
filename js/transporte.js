// js/transporte.js

document.addEventListener('DOMContentLoaded', () => {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.innerText = `Usuario: ${localStorage.getItem('currentUser') || 'Invitado'}`;
    }
    renderTransportTable();
    const transporteForm = document.getElementById('transporteForm');
    if (transporteForm) {
        transporteForm.addEventListener('submit', handleTransportSubmit);
    }
});

let transporteList = JSON.parse(localStorage.getItem('transporteListKey')) || [];

function renderTransportTable() {
    const tableBody = document.getElementById('transporteTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    if (transporteList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">No hay vehículos de transporte registrados.</td></tr>`;
        return;
    }

    transporteList.forEach((trans, index) => {
        let badgeEstado = 'bg-secondary';
        if(trans.estado === 'Disponible') badgeEstado = 'bg-success';
        if(trans.estado === 'En uso') badgeEstado = 'bg-info text-dark';
        if(trans.estado === 'Fuera de servicio') badgeEstado = 'bg-danger';

        tableBody.innerHTML += `
            <tr>
                <td><strong>${trans.patente}</strong></td>
                <td>${trans.tipo}</td>
                <td>${trans.marca}</td>
                <td>${trans.modelo}</td>
                <td>${trans.capacidad} kg / ${trans.volumen} m³</td>
                <td><span class="badge ${badgeEstado}">${trans.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editTransport(${index})" data-bs-toggle="modal" data-bs-target="#transporteModal">Editar</button>
                    ${trans.estado !== 'En uso' ? `
                    <button class="btn btn-sm ${trans.estado === 'Disponible' ? 'btn-danger' : 'btn-secondary'}" onclick="toggleTransportStatus(${index})">
                        ${trans.estado === 'Disponible' ? 'Baja' : 'Alta'}
                    </button>` : ''}
                </td>
            </tr>
        `;
    });
}

function saveTransportToLocalStorage() {
    localStorage.setItem('transporteListKey', JSON.stringify(transporteList));
    renderTransportTable();
}

function handleTransportSubmit(e) {
    e.preventDefault();
    const index = document.getElementById('editIndex').value;
    
    const data = {
        patente: document.getElementById('patente').value.toUpperCase(),
        tipo: document.getElementById('tipo').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        capacidad: document.getElementById('capacidad').value,
        volumen: document.getElementById('volumen').value,
        estado: index === "" ? "Disponible" : transporteList[index].estado
    };

    if (index === "") {
        const existe = transporteList.some(t => t.patente === data.patente);
        if (existe) {
            alert("Error: Ya existe un transporte registrado con esa patente.");
            return;
        }
        transporteList.push(data);
    } else {
        transporteList[index] = data;
    }

    saveTransportToLocalStorage();
    
    const modalElement = document.getElementById('transporteModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
}

function editTransport(index) {
    document.getElementById('modalTitle').innerText = "Modificar Transporte";
    document.getElementById('editIndex').value = index;
    const trans = transporteList[index];
    
    document.getElementById('patente').value = trans.patente;
    document.getElementById('patente').readOnly = true; 
    
    document.getElementById('tipo').value = trans.tipo;
    document.getElementById('marca').value = trans.marca;
    document.getElementById('modelo').value = trans.modelo;
    document.getElementById('capacidad').value = trans.capacidad;
    document.getElementById('volumen').value = trans.volumen;
}

function toggleTransportStatus(index) {
    transporteList[index].estado = transporteList[index].estado === "Disponible" ? "Fuera de servicio" : "Disponible";
    saveTransportToLocalStorage();
}

function clearTransportForm() {
    document.getElementById('modalTitle').innerText = "Dar de Alta Transporte";
    document.getElementById('editIndex').value = "";
    document.getElementById('patente').readOnly = false;
    const transporteForm = document.getElementById('transporteForm');
    if (transporteForm) {
        transporteForm.reset();
    }
}