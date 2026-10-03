
const enSubcarpeta = window.location.pathname.includes("/html/");
const rutaImagenes = enSubcarpeta ? "../Imagenes/" : "Imagenes/";
const paginaResultados = enSubcarpeta ? "resultados-busqueda.html" : "html/resultados-busqueda.html";

function normalizarTexto(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function buscarProductos(termino) {
    const t = normalizarTexto(termino);
    if (!t) return productos;
    return productos.filter(p =>
        normalizarTexto(p.nombre).includes(t) ||
        normalizarTexto(p.marca).includes(t) ||
        normalizarTexto(p.categoria).includes(t)
    );
}

document.addEventListener("DOMContentLoaded", function () {
    const inputBusqueda = document.getElementById("inputBusqueda");
    const parametros = new URLSearchParams(window.location.search);
    if (inputBusqueda) {
        inputBusqueda.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                const termino = this.value.trim();
                if (termino) {
                    window.location.href = `${paginaResultados}?query=${encodeURIComponent(termino)}`;
                }
            }
        });
    }
    const tituloCategoria = document.getElementById("tituloCategoria");
    const textoBusqueda = document.getElementById("textoBusqueda");

    if (tituloCategoria) {
        const categoria = parametros.get("cat") || "";
        const nombres = {
            laptops: "Laptops y Computadoras",
            telefonos: "Telefonos y Tablets",
            accesorios: "Accesorios",
            componentes: "Componentes"
        };
        tituloCategoria.textContent = nombres[categoria] || categoria;
        document.title = "Categoria: " + (nombres[categoria] || categoria);
        renderizarProductos(productos.filter(p => p.categoria === categoria), "productGrid", rutaImagenes);

    } else if (textoBusqueda) {
        const termino = parametros.get("query") || "";
        const resultados = buscarProductos(termino);
        textoBusqueda.textContent = `"${termino}"`;
        inputBusqueda.value = termino;
        document.getElementById("totalResultados").textContent = resultados.length;
        renderizarProductos(resultados, "productGrid", rutaImagenes, termino);

    } else if (document.getElementById("productGrid")) {
        renderizarProductos(productos, "productGrid", rutaImagenes);
    }
});