// Capa de datos del admin. No toca el DOM.
// Al migrar a React: reemplaza el cuerpo de estas funciones por fetch a la API o por un store,
// manteniendo los mismos nombres y valores de retorno.
// Requiere productos.js cargado antes (CLAVE_PRODUCTOS y PRODUCTOS_INICIALES).

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
