// Vista de detalle: lee ?id= de la URL, busca el producto en productos.js y arma el layout
(function () {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    const p = productos.find(x => x.id === id);
    const contenedor = document.getElementById("detalleProducto");

    // Producto inexistente
    if (!p) {
        document.title = "MASTER TECH | Producto no encontrado";
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h5 class="mt-3 text-muted">No encontramos este producto</h5>
                <a href="../index.html" class="btn btn-dark mt-2 px-4">Volver al inicio</a>
            </div>`;
        return;
    }

    document.title = "MASTER TECH | " + p.nombre;

    const agotado = p.stock <= 0;
    const ultimas = p.stock > 0 && p.stock <= 5;
    const estado = agotado ? '<span class="badge bg-secondary">Agotado</span>'
        : ultimas ? `<span class="badge bg-warning text-dark">Últimas ${p.stock}</span>`
            : '<span class="badge bg-success">En stock</span>';

    // Información técnica: usa p.especificaciones si existe; si no, datos básicos
    const specs = p.especificaciones || {
        "Marca": p.marca,
        "Unidades disponibles": p.stock
    };
    const filasSpecs = Object.entries(specs).map(([clave, valor]) => `
        <tr>
            <th class="fw-semibold w-50">${escaparHtml(clave)}</th>
            <td>${escaparHtml(valor)}</td>
        </tr>`).join("");

    const nombre = escaparHtml(p.nombre);
    const marca = escaparHtml(p.marca);

    contenedor.innerHTML = `
    <div class="row g-5">
        <div class="col-12 col-md-6">
            <div class="bg-white rounded-4 shadow-sm p-4 text-center">
                <img src="../Imagenes/${escaparHtml(p.imagen)}" alt="${nombre}"
                     class="img-fluid" style="max-height: 420px; object-fit: contain;">
            </div>
        </div>
        <div class="col-12 col-md-6">
            <span class="badge bg-dark text-uppercase mb-2">${marca}</span>
            <h2 class="fw-bold mb-3">${nombre}</h2>
            <div class="d-flex align-items-center gap-3 mb-4">
                <span class="fs-2 fw-bold">S/ ${p.precio.toFixed(2)}</span>
                ${estado}
            </div>

            <h6 class="fw-bold text-uppercase mb-2">Información técnica</h6>
            <table class="table table-sm mb-4">
                <tbody>${filasSpecs}</tbody>
            </table>

            <button type="button" class="btn-agregar" ${agotado ? "disabled" : ""}
                    data-id="${p.id}" data-nombre="${nombre}"
                    data-precio="${p.precio.toFixed(2)}" data-marca="${marca}">
                <i class="bi bi-cart-plus me-1"></i>${agotado ? "Agotado" : "Agregar al carrito"}
            </button>
        </div>
    </div>`;

    // Productos relacionados: misma categoría, sin el producto actual
    const relacionados = productos
        .filter(x => x.categoria === p.categoria && x.id !== p.id)
        .slice(0, 4);

    if (relacionados.length > 0) {
        document.getElementById("seccionRelacionados").classList.remove("d-none");
        renderizarProductos(relacionados, "relacionados", "../Imagenes/");
    }
})();