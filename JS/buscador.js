
const enSubcarpeta = window.location.pathname.includes("/html/");
const rutaImagenes = enSubcarpeta ? "../Imagenes/" : "Imagenes/";

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("productGrid")) {
        renderizarProductos(productos, "productGrid", rutaImagenes);
    }
});
