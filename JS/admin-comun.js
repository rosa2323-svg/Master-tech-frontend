/**
 * Formatea un número como moneda en soles peruanos.
 * @param {number} numero - El número a formatear.
 * @returns {string} El número formateado como moneda en soles.
 */
function formatoSoles(numero) {
    return "S/ " + numero.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// tipo: "success" | "danger" | "warning"
function mostrarAviso(tipo, mensaje) {
    const contenedor = document.getElementById("avisos");
    if (!contenedor) return;
    const aviso = document.createElement("div");
    aviso.className = `alert alert-${tipo} alert-dismissible fade show`;
    aviso.setAttribute("role", "alert");
    const texto = document.createElement("span");
    texto.textContent = mensaje; // textContent evita inyectar HTML
    const cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.className = "btn-close";
    cerrar.setAttribute("data-bs-dismiss", "alert");
    cerrar.setAttribute("aria-label", "Cerrar");
    aviso.append(texto, cerrar);
    contenedor.replaceChildren(aviso);
    if (tipo === "success") setTimeout(() => aviso.remove(), 4000);
}
