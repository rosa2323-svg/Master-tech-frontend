
const enSubcarpeta = window.location.pathname.includes("/html/");
const rutaImagenes = enSubcarpeta ? "../Imagenes/" : "Imagenes/";

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
    const parametros = new URLSearchParams(window.location.search);
    const tituloCategoria = document.getElementById("tituloCategoria");

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

    } else if (document.getElementById("productGrid")) {
        renderizarProductos(productos, "productGrid", rutaImagenes);
    }
});
