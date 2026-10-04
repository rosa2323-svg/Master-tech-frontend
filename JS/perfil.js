// Órdenes de ejemplo (simulación). Cuando exista el backend,
// este arreglo se reemplaza por los datos que devuelva el servidor.
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
            <td>${d.producto}</td>
            <td class="text-center">${d.cantidad}</td>
            <td class="text-end">${formatearSoles(d.precio)}</td>
            <td class="text-end">${formatearSoles(d.cantidad * d.precio)}</td>
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
                            <span class="fw-bold">${orden.numero}</span>
                            <span class="text-muted small ms-2">${orden.fecha}</span>
                        </div>
                        <div>
                            <span class="badge ${claseBadge} me-3">${orden.estado}</span>
                            <span class="fw-bold">${total}</span>
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
                                    <td class="text-end fw-bold text-danger">${total}</td>
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