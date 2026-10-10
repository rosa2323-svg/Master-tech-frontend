// Órdenes de ejemplo (simulación). Cuando exista el backend,
// este arreglo se reemplaza por los datos que devuelva el servidor.
function escaparHtml(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
const ordenes = [
    {
        numero: "MT-000123",
        fecha: "28/09/2026",
        estado: "Entregado",
        detalles: [
            { producto: "Laptop Lenovo IdeaPad 3", cantidad: 1, precio: 2499.00 },
            { producto: "Mouse inalámbrico Logitech", cantidad: 2, precio: 60.00 }
        ]
    },
    {
        numero: "MT-000118",
        fecha: "15/09/2026",
        estado: "En camino",
        detalles: [
            { producto: "Smartphone Samsung Galaxy A15", cantidad: 1, precio: 749.00 },
            { producto: "Funda protectora", cantidad: 1, precio: 39.00 }
        ]
    },
    {
        numero: "MT-000102",
        fecha: "02/09/2026",
        estado: "Entregado",
        detalles: [
            { producto: "Memoria RAM Kingston 16GB", cantidad: 2, precio: 180.00 }
        ]
    }
];

const clasesEstado = {
    "Entregado": "bg-success",
    "En camino": "bg-warning text-dark",
    "Pendiente": "bg-secondary"
};

function formatearSoles(monto) {
    return "S/ " + monto.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calcularTotal(orden) {
    return orden.detalles.reduce((suma, d) => suma + d.cantidad * d.precio, 0);
}

function crearOrden(orden, indice) {
    const id = "orden-" + (indice + 1);
    const claseBadge = clasesEstado[orden.estado] || "bg-secondary";

    const filas = orden.detalles.map(d => `
        <tr>
            <td>${escaparHtml(d.producto)}</td>
            <td class="text-center">${escaparHtml(d.cantidad)}</td>
            <td class="text-end">${escaparHtml(formatearSoles(d.precio))}</td>
            <td class="text-end">${escaparHtml(formatearSoles(d.cantidad * d.precio))}</td>
        </tr>
    `).join("");

    const total = formatearSoles(calcularTotal(orden));

    return `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                        data-bs-target="#${id}" aria-expanded="false" aria-controls="${id}">
                    <div class="d-flex flex-column flex-md-row w-100 justify-content-between align-items-md-center me-3 gap-2">
                        <div>
                            <span class="fw-bold">${escaparHtml(orden.numero)}</span>
                            <span class="text-muted small ms-2">${escaparHtml(orden.fecha)}</span>
                        </div>
                        <div>
                            <span class="badge ${claseBadge} me-3">${escaparHtml(orden.estado)}</span>
                            <span class="fw-bold">${escaparHtml(total)}</span>
                        </div>
                    </div>
                </button>
            </h2>
            <div id="${id}" class="accordion-collapse collapse" data-bs-parent="#acordeonOrdenes">
                <div class="accordion-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center">Cant.</th>
                                    <th class="text-end">Precio unit.</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" class="text-end fw-bold">Total</td>
                                    <td class="text-end fw-bold text-danger">${escaparHtml(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderizarOrdenes(lista) {
    const contenedor = document.getElementById("acordeonOrdenes");
    const mensajeVacio = document.getElementById("mensajeSinOrdenes");
    if (!contenedor || !mensajeVacio) return;

    if (lista.length === 0) {
        contenedor.innerHTML = "";
        mensajeVacio.classList.remove("d-none");
        return;
    }

    mensajeVacio.classList.add("d-none");
    contenedor.innerHTML = lista.map(crearOrden).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    renderizarOrdenes(ordenes);
});
// ===== Datos personales (simulación con localStorage) =====
const CLAVE_PERFIL = "mastertech_perfil";

function obtenerPerfil() {
    try {
        const guardado = localStorage.getItem(CLAVE_PERFIL);
        return guardado ? JSON.parse(guardado) : null;
    } catch (error) {
        return null;
    }
}

function guardarPerfil(datos) {
    try {
        localStorage.setItem(CLAVE_PERFIL, JSON.stringify(datos));
        return true;
    } catch (error) {
        return false;
    }
}

function cargarFormularioPerfil() {
    const datos = obtenerPerfil();
    if (!datos) return;

    document.getElementById("inputNombre").value = datos.nombre || "";
    document.getElementById("inputDireccion").value = datos.direccion || "";
    document.getElementById("inputTelefono").value = datos.telefono || "";
}

function mostrarMensajeGuardado() {
    const mensaje = document.getElementById("mensajeGuardado");
    mensaje.classList.remove("d-none");
    setTimeout(() => mensaje.classList.add("d-none"), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPerfil");
    if (!form) return;
    // Nombre: no permite números ni símbolos (tampoco al pegar texto)
    const inputNombre = document.getElementById("inputNombre");
    inputNombre.addEventListener("input", () => {
        inputNombre.value = inputNombre.value.replace(/[^\p{L} ']/gu, "");
    });

    cargarFormularioPerfil();

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        ["inputNombre", "inputDireccion", "inputTelefono"].forEach((id) => {
            const campo = document.getElementById(id);
            campo.value = campo.value.trim();
        });

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const datos = {
            nombre: document.getElementById("inputNombre").value.trim(),
            direccion: document.getElementById("inputDireccion").value.trim(),
            telefono: document.getElementById("inputTelefono").value.trim()
        };

        if (guardarPerfil(datos)) {
            form.classList.remove("was-validated");
            mostrarMensajeGuardado();
            actualizarBanner();
        } else {
            alert("No se pudieron guardar los datos en este navegador.");
        }
    });
});
// ===== Cambiar contraseña (simulación con localStorage) =====
// La contraseña nunca se guarda en texto plano: se guarda un hash (PBKDF2-SHA256 con sal).
// Cuando exista el backend, obtenerCredencial(), guardarCredencial() y el hash
// se reemplazan por el cifrado y las llamadas al servidor.
const CLAVE_PASSWORD = "mastertech_password";
const ITERACIONES_PASSWORD = 100000;
const TEXTOS_ERROR_PASSWORD = {
    inputPasswordActual: "Ingresa tu contraseña actual.",
    inputPasswordNueva: "La nueva contraseña debe tener mínimo 8 caracteres.",
    inputPasswordConfirmar: "Confirma la nueva contraseña."
};

function obtenerCredencial() {
    try {
        const guardada = localStorage.getItem(CLAVE_PASSWORD);
        return guardada ? JSON.parse(guardada) : null;
    } catch (error) {
        return null;
    }
}

function guardarCredencial(credencial) {
    try {
        localStorage.setItem(CLAVE_PASSWORD, JSON.stringify(credencial));
        return true;
    } catch (error) {
        return false;
    }
}

function aHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function deHex(hex) {
    return new Uint8Array((hex.match(/.{2}/g) || []).map(par => parseInt(par, 16)));
}

// Devuelve { sal, hash }. Si no se pasa sal, genera una nueva al azar.
async function hashearPassword(password, salHex) {
    const sal = salHex ? deHex(salHex) : crypto.getRandomValues(new Uint8Array(16));
    const material = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: sal, iterations: ITERACIONES_PASSWORD, hash: "SHA-256" },
        material, 256
    );
    return { sal: aHex(sal), hash: aHex(bits) };
}

async function passwordCorrecta(password, credencial) {
    const calculada = await hashearPassword(password, credencial.sal);
    return calculada.hash === credencial.hash;
}

function marcarErrorPassword(campo, texto) {
    campo.setCustomValidity(texto);
    const aviso = campo.parentElement.querySelector(".invalid-feedback");
    if (aviso) aviso.textContent = texto;
}

function mostrarMensajePassword(texto, exito) {
    const caja = document.getElementById("mensajePassword");
    caja.textContent = texto;
    caja.classList.remove("d-none", "alert-success", "alert-danger");
    caja.classList.add(exito ? "alert-success" : "alert-danger");
    setTimeout(() => caja.classList.add("d-none"), 4000);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPassword");
    if (!form) return;

    const actual = document.getElementById("inputPasswordActual");
    const nueva = document.getElementById("inputPasswordNueva");
    const confirmar = document.getElementById("inputPasswordConfirmar");
    const aviso = document.getElementById("avisoSinPassword");

    // Si todavía no hay contraseña guardada, el campo "actual" se desactiva
    function prepararCampoActual() {
        const hayPassword = obtenerCredencial() !== null;
        actual.disabled = !hayPassword;
        actual.required = hayPassword;
        aviso.classList.toggle("d-none", hayPassword);
    }

    function limpiarErrores() {
        [actual, nueva, confirmar].forEach(campo => {
            campo.setCustomValidity("");
            const texto = campo.parentElement.querySelector(".invalid-feedback");
            if (texto) texto.textContent = TEXTOS_ERROR_PASSWORD[campo.id];
        });
    }

    prepararCampoActual();

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        limpiarErrores();

        if (!window.crypto || !crypto.subtle) {
            mostrarMensajePassword("Este navegador no permite cifrar la contraseña en esta página. Abre el sitio con Live Server (localhost).", false);
            return;
        }

        const credencial = obtenerCredencial();

        if (nueva.value && nueva.value.length < 8) {
            marcarErrorPassword(nueva, TEXTOS_ERROR_PASSWORD.inputPasswordNueva);
        }
        if (confirmar.value && confirmar.value !== nueva.value) {
            marcarErrorPassword(confirmar, "Las contraseñas no coinciden.");
        }
        if (credencial && actual.value) {
            let esCorrecta;
            try {
                esCorrecta = await passwordCorrecta(actual.value, credencial);
            } catch (error) {
                esCorrecta = false;
            }
            if (!esCorrecta) {
                marcarErrorPassword(actual, "La contraseña actual es incorrecta.");
            } else if (nueva.value === actual.value) {
                marcarErrorPassword(nueva, "La nueva contraseña debe ser distinta de la actual.");
            }
        }

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const nuevaCredencial = await hashearPassword(nueva.value);
        if (guardarCredencial(nuevaCredencial)) {
            form.reset();
            form.classList.remove("was-validated");
            prepararCampoActual();
            mostrarMensajePassword("Contraseña actualizada correctamente.", true);
        } else {
            mostrarMensajePassword("No se pudo guardar la contraseña en este navegador.", false);
        }
    });
});
// ===== Banner del perfil e ícono elegible (simulación con localStorage) =====
const CLAVE_ICONO = "mastertech_icono_perfil";
const CLAVE_MIEMBRO = "mastertech_miembro_desde";
const ICONO_POR_DEFECTO = "bi-person-circle";
const ICONOS_PERFIL = [
    { clase: "bi-person-circle", nombre: "Persona" },
    { clase: "bi-emoji-smile-fill", nombre: "Sonrisa" },
    { clase: "bi-controller", nombre: "Control de juegos" },
    { clase: "bi-joystick", nombre: "Joystick" },
    { clase: "bi-cpu-fill", nombre: "Procesador" },
    { clase: "bi-laptop", nombre: "Laptop" },
    { clase: "bi-phone-fill", nombre: "Teléfono" },
    { clase: "bi-headset", nombre: "Audífonos" },
    { clase: "bi-rocket-takeoff-fill", nombre: "Cohete" },
    { clase: "bi-lightning-charge-fill", nombre: "Rayo" },
    { clase: "bi-robot", nombre: "Robot" },
    { clase: "bi-trophy-fill", nombre: "Trofeo" },
    { clase: "bi-stars", nombre: "Estrellas" },
    { clase: "bi-fire", nombre: "Fuego" },
    { clase: "bi-moon-stars-fill", nombre: "Luna" },
    { clase: "bi-heart-fill", nombre: "Corazón" }
];

function esIconoValido(clase) {
    return ICONOS_PERFIL.some(icono => icono.clase === clase);
}

function obtenerIcono() {
    try {
        const guardado = localStorage.getItem(CLAVE_ICONO);
        return esIconoValido(guardado) ? guardado : ICONO_POR_DEFECTO;
    } catch (error) {
        return ICONO_POR_DEFECTO;
    }
}

function guardarIcono(clase) {
    if (!esIconoValido(clase)) return false;
    try {
        localStorage.setItem(CLAVE_ICONO, clase);
        return true;
    } catch (error) {
        return false;
    }
}

// La primera vez que se abre el perfil se guarda la fecha; después siempre se muestra esa.
function obtenerMiembroDesde() {
    try {
        let fecha = new Date(localStorage.getItem(CLAVE_MIEMBRO));
        if (isNaN(fecha)) {
            fecha = new Date();
            localStorage.setItem(CLAVE_MIEMBRO, fecha.toISOString());
        }
        return fecha;
    } catch (error) {
        return new Date();
    }
}

function actualizarBanner() {
    const icono = document.getElementById("iconoPerfil");
    if (!icono) return;

    icono.className = "bi " + obtenerIcono();

    const perfil = obtenerPerfil();
    document.getElementById("bannerNombre").textContent =
        perfil && perfil.nombre ? perfil.nombre : "Usuario Master Tech";

    document.getElementById("bannerMiembro").textContent =
        obtenerMiembroDesde().toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

function pintarListaIconos() {
    const lista = document.getElementById("listaIconos");
    if (!lista) return;

    const actual = obtenerIcono();
    lista.innerHTML = ICONOS_PERFIL.map(i => `
        <div class="col-3">
            <button type="button" class="btn ${i.clase === actual ? "btn-danger" : "btn-outline-secondary"} w-100 py-3"
                    data-icono="${escaparHtml(i.clase)}"
                    aria-label="Elegir ícono: ${escaparHtml(i.nombre)}" title="${escaparHtml(i.nombre)}">
                <i class="bi ${escaparHtml(i.clase)} fs-3"></i>
            </button>
        </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("iconoPerfil")) return;

    actualizarBanner();
    pintarListaIconos();

    document.getElementById("listaIconos").addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-icono]");
        if (!boton) return;

        if (guardarIcono(boton.dataset.icono)) {
            actualizarBanner();
            pintarListaIconos();
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalIconos"));
            if (modal) modal.hide();
        } else {
            alert("No se pudo guardar el ícono en este navegador.");
        }
    });
});