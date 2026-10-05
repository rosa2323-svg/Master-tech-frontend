// Órdenes de ejemplo (simulación). Cuando exista el backend,
// este arreglo se reemplaza por los datos que devuelva el servidor.
function escaparHtml(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
const ordenes = [
    {
        numero: "MT-000123",
        fecha: "28/09/2026",
        estado: "Entregado",
        detalles: [
            { producto: "Laptop Lenovo IdeaPad 3", cantidad: 1, precio: 2499.00 },
            { producto: "Mouse inalámbrico Logitech", cantidad: 2, precio: 60.00 }
        ]
    },
    {
        numero: "MT-000118",
        fecha: "15/09/2026",
        estado: "En camino",
        detalles: [
            { producto: "Smartphone Samsung Galaxy A15", cantidad: 1, precio: 749.00 },
            { producto: "Funda protectora", cantidad: 1, precio: 39.00 }
        ]
    },
    {
        numero: "MT-000102",
        fecha: "02/09/2026",
        estado: "Entregado",
        detalles: [
            { producto: "Memoria RAM Kingston 16GB", cantidad: 2, precio: 180.00 }
        ]
    }
];

const clasesEstado = {
    "Entregado": "bg-success",
    "En camino": "bg-warning text-dark",
    "Pendiente": "bg-secondary"
};

function formatearSoles(monto) {
    return "S/ " + monto.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calcularTotal(orden) {
    return orden.detalles.reduce((suma, d) => suma + d.cantidad * d.precio, 0);
}

function crearOrden(orden, indice) {
    const id = "orden-" + (indice + 1);
    const claseBadge = clasesEstado[orden.estado] || "bg-secondary";

    const filas = orden.detalles.map(d => `
        <tr>
            <td>${escaparHtml(d.producto)}</td>
            <td class="text-center">${escaparHtml(d.cantidad)}</td>
            <td class="text-end">${escaparHtml(formatearSoles(d.precio))}</td>
            <td class="text-end">${escaparHtml(formatearSoles(d.cantidad * d.precio))}</td>
        </tr>
    `).join("");

    const total = formatearSoles(calcularTotal(orden));

    return `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                        data-bs-target="#${id}" aria-expanded="false" aria-controls="${id}">
                    <div class="d-flex flex-column flex-md-row w-100 justify-content-between align-items-md-center me-3 gap-2">
                        <div>
                            <span class="fw-bold">${escaparHtml(orden.numero)}</span>
                            <span class="text-muted small ms-2">${escaparHtml(orden.fecha)}</span>
                        </div>
                        <div>
                            <span class="badge ${claseBadge} me-3">${escaparHtml(orden.estado)}</span>
                            <span class="fw-bold">${escaparHtml(total)}</span>
                        </div>
                    </div>
                </button>
            </h2>
            <div id="${id}" class="accordion-collapse collapse" data-bs-parent="#acordeonOrdenes">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center">Cant.</th>
                                    <th class="text-end">Precio unit.</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" class="text-end fw-bold">Total</td>
                                    <td class="text-end fw-bold text-danger">${escaparHtml(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderizarOrdenes(lista) {
    const contenedor = document.getElementById("acordeonOrdenes");
    const mensajeVacio = document.getElementById("mensajeSinOrdenes");
    if (!contenedor || !mensajeVacio) return;

    if (lista.length === 0) {
        contenedor.innerHTML = "";
        mensajeVacio.classList.remove("d-none");
        return;
    }

    mensajeVacio.classList.add("d-none");
    contenedor.innerHTML = lista.map(crearOrden).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    renderizarOrdenes(ordenes);
});
// ===== Datos personales (simulación con localStorage) =====
// Cuando exista el backend, obtenerPerfil() y guardarPerfil()
// se reemplazan por llamadas al servidor.
const CLAVE_PERFIL = "mastertech_perfil";

function obtenerPerfil() {
    try {
        const guardado = localStorage.getItem(CLAVE_PERFIL);
        return guardado ? JSON.parse(guardado) : null;
    } catch (error) {
        return null;
    }
}

function guardarPerfil(datos) {
    try {
        localStorage.setItem(CLAVE_PERFIL, JSON.stringify(datos));
        return true;
    } catch (error) {
        return false;
    }
}

function cargarFormularioPerfil() {
    const datos = obtenerPerfil();
    if (!datos) return;

    document.getElementById("inputNombre").value = datos.nombre || "";
    document.getElementById("inputDireccion").value = datos.direccion || "";
    document.getElementById("inputTelefono").value = datos.telefono || "";
}

function mostrarMensajeGuardado() {
    const mensaje = document.getElementById("mensajeGuardado");
    mensaje.classList.remove("d-none");
    setTimeout(() => mensaje.classList.add("d-none"), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPerfil");
    if (!form) return;

    cargarFormularioPerfil();

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        ["inputNombre", "inputDireccion", "inputTelefono"].forEach((id) => {
            const campo = document.getElementById(id);
            campo.value = campo.value.trim();
        });

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const datos = {
            nombre: document.getElementById("inputNombre").value.trim(),
            direccion: document.getElementById("inputDireccion").value.trim(),
            telefono: document.getElementById("inputTelefono").value.trim()
        };

        if (guardarPerfil(datos)) {
            form.classList.remove("was-validated");
            mostrarMensajeGuardado();
        } else {
            alert("No se pudieron guardar los datos en este navegador.");
        }
    });
});