(function () {
    const cuerpo = document.getElementById("cuerpoTabla");
    const form = document.getElementById("formCategoria");
    const campoId = document.getElementById("categoriaId");
    const errorForm = document.getElementById("errorFormCategoria");
    const modalCategoria = new bootstrap.Modal(document.getElementById("modalCategoria"));
    const modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));
    let idPorEliminar = null;

    function pintarTabla() {
        const categorias = obtenerCategorias();
        if (categorias.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="5"><div class="vacio"><i class="bi bi-tags"></i>
                Aún no hay categorías. Crea la primera con "Nueva categoría".</div></td></tr>`;
            return;
        }
        cuerpo.innerHTML = categorias.map(c => {
            const cantidad = contarProductosPorCategoria(c.slug);
            const conteo = cantidad === 0
                ? '<span class="etiqueta-conteo conteo-vacia">Vacía</span>'
                : `<span class="etiqueta-conteo conteo-con">${cantidad} producto${cantidad === 1 ? "" : "s"}</span>`;
            const accionEliminar = cantidad === 0
                ? `<button type="button" class="btn-accion btn-borrar" data-accion="eliminar" data-id="${c.id}">
                       <i class="bi bi-trash-fill"></i> Eliminar</button>`
                : `<span class="btn-accion btn-bloqueado" title="Tiene productos asociados">
                       <i class="bi bi-lock-fill"></i> Bloqueado</span>`;
            return `
            <tr>
                <td class="texto-tenue">${c.id}</td>
                <td class="fw-semibold">${escaparHtml(c.nombre)}</td>
                <td class="texto-tenue">${escaparHtml(c.descripcion || "—")}</td>
                <td>${conteo}</td>
                <td class="celda-acciones">
                    <button type="button" class="btn-accion btn-editar" data-accion="editar" data-id="${c.id}">
                        <i class="bi bi-pencil-fill"></i> Editar</button>
                    ${accionEliminar}
                </td>
            </tr>`;
        }).join("");
    }

    function abrirFormulario(categoria) {
        form.reset();
        form.classList.remove("was-validated");
        errorForm.classList.add("d-none");
        campoId.value = categoria ? categoria.id : "";
        document.getElementById("tituloModalCategoria").textContent = categoria ? "Editar categoría" : "Nueva categoría";
        document.getElementById("textoGuardarCategoria").textContent = categoria ? "Guardar cambios" : "Crear categoría";
        if (categoria) {
            document.getElementById("categoriaNombre").value = categoria.nombre;
            document.getElementById("categoriaDescripcion").value = categoria.descripcion || "";
        }
        modalCategoria.show();
    }

    document.getElementById("btnNuevaCategoria").addEventListener("click", () => abrirFormulario(null));

    cuerpo.addEventListener("click", e => {
        const boton = e.target.closest("button[data-accion]");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        const categoria = obtenerCategorias().find(c => c.id === id);
        if (!categoria) return;
        if (boton.dataset.accion === "editar") {
            abrirFormulario(categoria);
        } else {
            idPorEliminar = id;
            document.getElementById("nombreCategoriaEliminar").textContent = categoria.nombre;
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
            nombre: document.getElementById("categoriaNombre").value.trim(),
            descripcion: document.getElementById("categoriaDescripcion").value.trim()
        };
        const id = Number(campoId.value);
        const resultado = id ? actualizarCategoria(id, datos) : crearCategoria(datos);
        if (!resultado.ok) {
            errorForm.textContent = resultado.error;
            errorForm.classList.remove("d-none");
            return;
        }
        modalCategoria.hide();
        mostrarAviso("success", id ? "Categoría actualizada." : "Categoría creada.");
        pintarTabla();
    });

    document.getElementById("btnConfirmarEliminar").addEventListener("click", () => {
        if (idPorEliminar === null) return;
        const resultado = eliminarCategoria(idPorEliminar);
        idPorEliminar = null;
        modalEliminar.hide();
        mostrarAviso(resultado.ok ? "success" : "danger", resultado.ok ? "Categoría eliminada." : resultado.error);
        pintarTabla();
    });

    pintarTabla();
})();
