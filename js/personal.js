// js/personal.js

// Al cargar la ventana, inicializamos la visualización del usuario y la tabla
document.addEventListener('DOMContentLoaded', () => {
    // Muestra en la barra de navegación el usuario logueado extraído de localStorage
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.innerText = `Usuario: ${localStorage.getItem('currentUser') || 'Invitado'}`;
    }
    
    // Renderizado inicial al cargar la pantalla
    renderTable();

    // Escuchar el evento de envío del formulario
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handleFormSubmit);
    }
});

// PERSISTENCIA DEL ABM: Intentar leer los datos guardados en localStorage; si no existen, inicializar vacío
let personalList = JSON.parse(localStorage.getItem('personalListKey')) || [];

// Función para renderizar la tabla leyendo el arreglo en memoria
function renderTable() {
    const tableBody = document.getElementById('personalTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    if (personalList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">No hay personal registrado en el sistema.</td></tr>`;
        return;
    }

    personalList.forEach((emp, index) => {
        tableBody.innerHTML += `
            <tr>
                <td>${emp.legajo}</td>
                <td>${emp.dni}</td>
                <td>${emp.apellido}, ${emp.nombre}</td>
                <td>${emp.email}</td>
                <td><span class="badge ${emp.estado === 'Activo' ? 'bg-success' : 'bg-danger'}">${emp.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editEmployee(${index})" data-bs-toggle="modal" data-bs-target="#personalModal">Editar</button>
                    <button class="btn btn-sm ${emp.estado === 'Activo' ? 'btn-danger' : 'btn-secondary'}" onclick="toggleStatus(${index})">
                        ${emp.estado === 'Activo' ? 'Baja' : 'Alta'}
                    </button>
                </td>
            </tr>
        `;
    });
}

// Función para guardar los cambios del arreglo directamente al localStorage
function saveToLocalStorage() {
    localStorage.setItem('personalListKey', JSON.stringify(personalList));
    renderTable();
}

// Manejo del Envío del Formulario (Alta o Edición)
function handleFormSubmit(e) {
    e.preventDefault();
    const index = document.getElementById('editIndex').value;
    
    const data = {
        dni: document.getElementById('dni').value,
        sexo: document.getElementById('sexo').value,
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        direccion: document.getElementById('direccion').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        cbu: document.getElementById('cbu').value,
        estado: index === "" ? "Activo" : personalList[index].estado
    };

    if (index === "") {
        // RF8 - Alta: Crear un legajo único incremental basado en el último elemento
        data.legajo = personalList.length > 0 ? personalList[personalList.length - 1].legajo + 1 : 1001;
        personalList.push(data);
    } else {
        // RF10 - Modificación: Mantener el legajo previo y actualizar campos
        data.legajo = personalList[index].legajo;
        personalList[index] = data;
    }

    // Guardar cambios en el localStorage y cerrar modal
    saveToLocalStorage();
    
    const modalElement = document.getElementById('personalModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
}

// Cargar datos en el formulario para editar
function editEmployee(index) {
    document.getElementById('modalTitle').innerText = "Modificar Personal";
    document.getElementById('editIndex').value = index;
    const emp = personalList[index];
    
    document.getElementById('dni').value = emp.dni;
    document.getElementById('sexo').value = emp.sexo;
    document.getElementById('nombre').value = emp.nombre;
    document.getElementById('apellido').value = emp.apellido;
    document.getElementById('direccion').value = emp.direccion;
    document.getElementById('telefono').value = emp.telefono;
    document.getElementById('email').value = emp.email;
    document.getElementById('cbu').value = emp.cbu;
}

// RF9 - Baja/Alta de Personal cambiando el estado dinámicamente
function toggleStatus(index) {
    personalList[index].estado = personalList[index].estado === "Activo" ? "Inactivo" : "Activo";
    saveToLocalStorage();
}

// Limpiar el formulario al presionar "+ Dar de Alta Personal"
function clearForm() {
    document.getElementById('modalTitle').innerText = "Dar de Alta Personal";
    document.getElementById('editIndex').value = "";
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
        personalForm.reset();
    }
}