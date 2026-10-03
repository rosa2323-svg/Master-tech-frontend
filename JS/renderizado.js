function crearTarjetaProducto(producto, rutaImagenes) {
    const agotado = producto.stock <= 0;
    const ultimas = producto.stock > 0 && producto.stock <= 5;

    return `
    <div class="col-6 col-sm-4 col-md-3">
        <div class="tarjeta-producto">
            <div class="tarjeta-producto-img">
                <img src="${rutaImagenes}${producto.imagen}" alt="${producto.nombre}">
            </div>
            <div class="p-3 d-flex flex-column flex-grow-1">
                <span class="tarjeta-producto-marca">${producto.marca}</span>
                <p class="tarjeta-producto-nombre">${producto.nombre}</p>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <span class="tarjeta-producto-precio">S/ ${producto.precio.toFixed(2)}</span>
                    ${agotado ? '<span class="badge bg-secondary">Agotado</span>'
        : ultimas ? `<span class="badge bg-warning text-dark">Ultimas ${producto.stock}</span>`
            : '<span class="badge bg-success">En stock</span>'}
                </div>
                <button type="button" class="btn-agregar" ${agotado ? "disabled" : ""}
                        data-id="${producto.id}" data-nombre="${producto.nombre.replace(/"/g, "&quot;")}"
                        data-precio="${producto.precio.toFixed(2)}" data-marca="${producto.marca}">
                    <i class="bi bi-cart-plus me-1"></i>${agotado ? "Agotado" : "Agregar al carrito"}
                </button>
            </div>
        </div>
    </div>`;
}

function renderizarProductos(lista, idContenedor, rutaImagenes) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    contenedor.innerHTML = lista.map(p => crearTarjetaProducto(p, rutaImagenes)).join("");
}
