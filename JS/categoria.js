// Breadcrumb y link activo de la categoría actual (no dibuja productos)
(function () {
    const TITULOS = {
        laptops:     "Laptops y Computadoras",
        telefonos:   "Teléfonos y Tablets",
        accesorios:  "Accesorios",
        componentes: "Componentes"
    };

    const cat = (new URLSearchParams(window.location.search).get("cat") || "").toLowerCase();
    const titulo = TITULOS[cat];

    // Breadcrumb
    document.getElementById("breadcrumbActual").textContent = titulo || "Categoría no encontrada";

    // Resaltar el link activo del navbar
    if (titulo) {
        document.querySelectorAll(".navbar-nav .nav-link").forEach(a => {
            if (a.getAttribute("href").endsWith("cat=" + cat)) {
                a.classList.add("active", "fw-bold");
            }
        });
    }
})();