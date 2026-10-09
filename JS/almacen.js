
const CLAVE_CATEGORIAS = "mastertech_categorias";
const UMBRAL_STOCK_BAJO = 5;

const CATEGORIAS_INICIALES = [
    { id: 1, slug: "laptops",     nombre: "Laptops",     descripcion: "Laptops y PCs de escritorio" },
    { id: 2, slug: "telefonos",   nombre: "Teléfonos",   descripcion: "Smartphones y celulares" },
    { id: 3, slug: "accesorios",  nombre: "Accesorios",  descripcion: "Periféricos y consolas" },
    { id: 4, slug: "componentes", nombre: "Componentes", descripcion: "Partes para armado de PC" }
];

function leerLista(clave, inicial) {
    try {
        const guardado = JSON.parse(localStorage.getItem(clave));
        return Array.isArray(guardado) ? guardado : structuredClone(inicial);
    } catch {
        return structuredClone(inicial);
    }
}

function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
}

function siguienteId(lista) {
    return lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;
}

// ---------- Productos ----------

function obtenerProductos() {
    return leerLista(CLAVE_PRODUCTOS, PRODUCTOS_INICIALES);
}

function crearProducto(datos) {
    const lista = obtenerProductos();
    const nuevo = { ...datos, id: siguienteId(lista) };
    lista.push(nuevo);
    guardarLista(CLAVE_PRODUCTOS, lista);
    return nuevo;
}

// Conserva los campos que el formulario no edita (ej. especificaciones)
function actualizarProducto(id, datos) {
    const lista = obtenerProductos().map(p => (p.id === id ? { ...p, ...datos, id } : p));
    guardarLista(CLAVE_PRODUCTOS, lista);
}

function eliminarProducto(id) {
    guardarLista(CLAVE_PRODUCTOS, obtenerProductos().filter(p => p.id !== id));
}

function calcularMetricas(lista) {
    return {
        total: lista.length,
        stockBajo: lista.filter(p => p.stock <= UMBRAL_STOCK_BAJO).length,
        valorInventario: lista.reduce((suma, p) => suma + p.precio * p.stock, 0)
    };
}

// ---------- Categorías ----------

function obtenerCategorias() {
    return leerLista(CLAVE_CATEGORIAS, CATEGORIAS_INICIALES);
}

function contarProductosPorCategoria(slug) {
    return obtenerProductos().filter(p => p.categoria === slug).length;
}

function crearSlug(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Devuelve { ok, error }. El slug no cambia al editar para no romper productos ni enlaces.
function crearCategoria({ nombre, descripcion }) {
    const lista = obtenerCategorias();
    const slug = crearSlug(nombre);
    if (!slug) return { ok: false, error: "Escribe un nombre válido." };
    if (lista.some(c => c.slug === slug)) return { ok: false, error: "Ya existe una categoría con ese nombre." };
    lista.push({ id: siguienteId(lista), slug, nombre, descripcion });
    guardarLista(CLAVE_CATEGORIAS, lista);
    return { ok: true };
}

function actualizarCategoria(id, { nombre, descripcion }) {
    const lista = obtenerCategorias();
    if (!lista.some(c => c.id === id)) {
        return { ok: false, error: "La categoría no existe." };
    }
    const slugNuevo = crearSlug(nombre);
    if (!slugNuevo) return { ok: false, error: "Escribe un nombre válido." };
    if (lista.some(c => c.id !== id && crearSlug(c.nombre) === slugNuevo)) {
        return { ok: false, error: "Ya existe una categoría con ese nombre." };
    }
    guardarLista(CLAVE_CATEGORIAS, lista.map(c => (c.id === id ? { ...c, nombre, descripcion } : c)));
    return { ok: true };
}

function eliminarCategoria(id) {
    const lista = obtenerCategorias();
    const categoria = lista.find(c => c.id === id);
    if (!categoria) return { ok: false, error: "La categoría no existe." };
    const cantidad = contarProductosPorCategoria(categoria.slug);
    if (cantidad > 0) {
        return { ok: false, error: `No se puede eliminar "${categoria.nombre}": tiene ${cantidad} producto(s) asociado(s).` };
    }
    guardarLista(CLAVE_CATEGORIAS, lista.filter(c => c.id !== id));
    return { ok: true };
}
