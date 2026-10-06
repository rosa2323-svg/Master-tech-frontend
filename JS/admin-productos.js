(function () {
    const estado = { texto: "", soloStockBajo: false, columna: "id", direccion: "asc" };

    const cuerpo = document.getElementById("cuerpoTabla");
    const form = document.getElementById("formProducto");
    const campoId = document.getElementById("productoId");
    const selectCategoria = document.getElementById("productoCategoria");
    const modalProducto = new bootstrap.Modal(document.getElementById("modalProducto"));
    const modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));
    let idPorEliminar = null;

    const nombreCategoria = slug => (obtenerCategorias().find(c => c.slug === slug) || {}).nombre || slug;

    function productosVisibles() {
        const t = estado.texto.trim().toLowerCase();
        const lista = obtenerProductos().filter(p =>
            (!t || p.nombre.toLowerCase().includes(t) || p.marca.toLowerCase().includes(t)) &&
            (!estado.soloStockBajo || p.stock <= UMBRAL_STOCK_BAJO));

        const sentido = estado.direccion === "asc" ? 1 : -1;
        const valor = p => (estado.columna === "categoria" ? nombreCategoria(p.categoria) : p[estado.columna]);
        return lista.sort((a, b) => {
            const x = valor(a), y = valor(b);
            const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "es");
            return cmp * sentido;
        });
    }

    function insigniaStock(stock) {
        if (stock <= 0) return '<span class="badge bg-danger">Sin stock</span>';
        if (stock <= UMBRAL_STOCK_BAJO) return `<span class="badge bg-warning text-dark">${stock}</span>`;
        return `<span class="badge bg-success">${stock}</span>`;
    }

    function pintarMetricas() {
        const m = calcularMetricas(obtenerProductos());
        document.getElementById("metricaTotal").textContent = m.total;
        document.getElementById("metricaStockBajo").textContent = m.stockBajo;
        document.getElementById("metricaValor").textContent = formatoSoles(m.valorInventario);
    }

    function pintarEncabezados() {
        document.querySelectorAll("th.ordenable").forEach(th => {
            const activo = th.dataset.col === estado.columna;
            th.classList.toggle("orden-activo", activo);
            th.setAttribute("aria-sort", activo ? (estado.direccion === "asc" ? "ascending" : "descending") : "none");
            th.querySelector(".icono-orden").className = "bi icono-orden " +
                (!activo ? "bi-arrow-down-up" : estado.direccion === "asc" ? "bi-arrow-up" : "bi-arrow-down");
        });
    }

    function pintarTabla() {
        const lista = productosVisibles();
        if (lista.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="7"><div class="vacio"><i class="bi bi-inbox"></i>
                No hay productos que coincidan.</div></td></tr>`;
        } else {
            cuerpo.innerHTML = lista.map(p => `
            <tr class="${p.stock <= 0 ? "fila-agotada" : ""}">
                <td class="texto-tenue">${p.id}</td>
                <td class="fw-semibold">${escaparHtml(p.nombre)}</td>
                <td>${escaparHtml(p.marca)}</td>
                <td><span class="etiqueta-categoria">${escaparHtml(nombreCategoria(p.categoria))}</span></td>
                <td class="precio-admin">${formatoSoles(p.precio)}</td>
                <td class="text-center">${insigniaStock(p.stock)}</td>
                <td class="celda-acciones">
                    <button type="button" class="btn-accion btn-editar" data-accion="editar" data-id="${p.id}">
                        <i class="bi bi-pencil-fill"></i> Editar</button>
                    <button type="button" class="btn-accion btn-borrar" data-accion="eliminar" data-id="${p.id}">
                        <i class="bi bi-trash-fill"></i> Eliminar</button>
                </td>
            </tr>`).join("");
        }
        pintarMetricas();
        pintarEncabezados();
    }

    function llenarCategorias() {
        selectCategoria.innerHTML = '<option value="">Selecciona una categoría</option>' +
            obtenerCategorias().map(c =>
                `<option value="${escaparHtml(c.slug)}">${escaparHtml(c.nombre)}</option>`).join("");
    }

    function abrirFormulario(producto) {
        form.reset();
        form.classList.remove("was-validated");
        llenarCategorias();
        campoId.value = producto ? producto.id : "";
        document.getElementById("tituloModalProducto").textContent = producto ? "Editar producto" : "Nuevo producto";
        document.getElementById("textoGuardarProducto").textContent = producto ? "Guardar cambios" : "Crear producto";
        if (producto) {
            document.getElementById("productoNombre").value = producto.nombre;
            selectCategoria.value = producto.categoria;
            document.getElementById("productoMarca").value = producto.marca;
            document.getElementById("productoImagen").value = producto.imagen;
            document.getElementById("productoPrecio").value = producto.precio;
            document.getElementById("productoStock").value = producto.stock;
        }
        modalProducto.show();
    }

    // Eventos
    document.getElementById("btnNuevoProducto").addEventListener("click", () => abrirFormulario(null));

    cuerpo.addEventListener("click", e => {
        const boton = e.target.closest("button[data-accion]");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        const producto = obtenerProductos().find(p => p.id === id);
        if (!producto) return;
        if (boton.dataset.accion === "editar") {
            abrirFormulario(producto);
        } else {
            idPorEliminar = id;
            document.getElementById("nombreProductoEliminar").textContent = producto.nombre;
            modalEliminar.show();
        }
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }
        const datos = {
            nombre: document.getElementById("productoNombre").value.trim(),
            categoria: selectCategoria.value,
            marca: document.getElementById("productoMarca").value.trim(),
            imagen: document.getElementById("productoImagen").value.trim(),
            precio: parseFloat(document.getElementById("productoPrecio").value),
            stock: parseInt(document.getElementById("productoStock").value, 10)
        };
        const id = Number(campoId.value);
        if (id) {
            actualizarProducto(id, datos);
            mostrarAviso("success", "Producto actualizado.");
        } else {
            crearProducto(datos);
            mostrarAviso("success", "Producto creado.");
        }
        modalProducto.hide();
        pintarTabla();
    });

    document.getElementById("btnConfirmarEliminar").addEventListener("click", () => {
        if (idPorEliminar === null) return;
        eliminarProducto(idPorEliminar);
        idPorEliminar = null;
        modalEliminar.hide();
        mostrarAviso("success", "Producto eliminado.");
        pintarTabla();
    });

    document.querySelectorAll("th.ordenable").forEach(th => {
        th.addEventListener("click", () => {
            if (estado.columna === th.dataset.col) {
                estado.direccion = estado.direccion === "asc" ? "desc" : "asc";
            } else {
                estado.columna = th.dataset.col;
                estado.direccion = "asc";
            }
            pintarTabla();
        });
    });

    document.getElementById("buscador").addEventListener("input", e => {
        estado.texto = e.target.value;
        pintarTabla();
    });

    const botonStockBajo = document.getElementById("btnStockBajo");
    botonStockBajo.addEventListener("click", () => {
        estado.soloStockBajo = !estado.soloStockBajo;
        botonStockBajo.classList.toggle("activo", estado.soloStockBajo);
        botonStockBajo.setAttribute("aria-pressed", estado.soloStockBajo);
        pintarTabla();
    });

    document.getElementById("btnLimpiar").addEventListener("click", () => {
        estado.texto = "";
        estado.soloStockBajo = false;
        document.getElementById("buscador").value = "";
        botonStockBajo.classList.remove("activo");
        botonStockBajo.setAttribute("aria-pressed", "false");
        pintarTabla();
    });

    pintarTabla();
})();
