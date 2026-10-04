// Funcion reutilizable: index.html, categoria.html y resultados.html (checklist 2 y 3).
// rutaImagenes: "Imagenes/" desde la raiz, "../Imagenes/" desde html/

// Escapa texto antes de meterlo en un template HTML (evita romper atributos o inyectar HTML).
function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function crearTarjetaProducto(producto, rutaImagenes) {
    const nombre = escaparHtml(producto.nombre);
    const marca = escaparHtml(producto.marca);
    const agotado = producto.stock <= 0;
    const ultimas = producto.stock > 0 && producto.stock <= 5;

    // Desde el index la ruta es "html/producto.html"; desde html/ es "producto.html"
    const rutaPaginas = rutaImagenes.startsWith("..") ? "" : "html/";
    const urlDetalle = `${rutaPaginas}producto.html?id=${producto.id}`;

    return `
    <div class="col-6 col-sm-4 col-md-3">
        <div class="tarjeta-producto">
            <a href="${urlDetalle}">
                <div class="tarjeta-producto-img">
                    <img src="${rutaImagenes}${escaparHtml(producto.imagen)}" alt="${nombre}">
                </div>
            </a>
            <div class="p-3 d-flex flex-column flex-grow-1">
                <span class="tarjeta-producto-marca">${marca}</span>
                <a href="${urlDetalle}" class="text-decoration-none text-reset">
                    <p class="tarjeta-producto-nombre">${nombre}</p>
                </a>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <span class="tarjeta-producto-precio">S/ ${producto.precio.toFixed(2)}</span>
                    ${agotado ? '<span class="badge bg-secondary">Agotado</span>'
        : ultimas ? `<span class="badge bg-warning text-dark">Últimas ${producto.stock}</span>`
            : '<span class="badge bg-success">En stock</span>'}
                </div>
                <button type="button" class="btn-agregar" ${agotado ? "disabled" : ""}
                        data-id="${producto.id}" data-nombre="${nombre}"
                        data-precio="${producto.precio.toFixed(2)}" data-marca="${marca}">
                    <i class="bi bi-cart-plus me-1"></i>${agotado ? "Agotado" : "Agregar al carrito"}
                </button>
            </div>
        </div>
    </div>`;
}

function renderizarProductos(lista, idContenedor, rutaImagenes, termino) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    if (lista.length === 0) {
        mostrarSinResultados(contenedor, termino);
        return;
    }
    contenedor.innerHTML = lista.map(p => crearTarjetaProducto(p, rutaImagenes)).join("");
}

// Interfaz "Sin resultados" (checklist 3 de la tarjeta del buscador)
function mostrarSinResultados(contenedor, termino) {
    contenedor.innerHTML = `
    <div class="col-12 text-center py-5">
        <i class="bi bi-search fs-1 text-muted"></i>
        <h5 class="mt-3 text-muted">No encontramos productos${termino ? ' para <strong id="terminoSinResultados"></strong>' : ''}</h5>
        <p class="text-muted small">Intenta con otro termino o explora nuestras categorias.</p>
    </div>`;
    const spanTermino = document.getElementById("terminoSinResultados");
    if (spanTermino) spanTermino.textContent = `"${termino}"`; // textContent evita inyectar HTML
}