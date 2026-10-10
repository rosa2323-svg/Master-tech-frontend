(function () {
    const VENTAS_PRUEBA = [
        {
            id: 1, fecha: "2026-10-01T14:32:00", cliente: "Carlos Mendoza", numeroOrden: "ORD-0001", estado: "PAGADO",
            total: 459.80,
            detalles: [
                { cantidad: 1, producto: "Mouse Gamer RGB", precioUnitario: 129.90 },
                { cantidad: 1, producto: "Teclado Mecánico", precioUnitario: 249.90 },
                { cantidad: 2, producto: "Cable HDMI 2m", precioUnitario: 40.00 }
            ]
        },
        {
            id: 2, fecha: "2026-10-02T10:05:00", cliente: "Lucía Paredes", numeroOrden: "ORD-0002", estado: "ENVIADO",
            total: 89.90,
            detalles: [
                { cantidad: 1, producto: "Audífonos Bluetooth", precioUnitario: 89.90 }
            ]
        },
        {
            id: 3, fecha: "2026-10-03T18:47:00", cliente: "Jorge Quispe", numeroOrden: "ORD-0003", estado: "PENDIENTE",
            total: 1299.00,
            detalles: [
                { cantidad: 1, producto: "Monitor 27\" 144Hz", precioUnitario: 1299.00 }
            ]
        },
        {
            id: 4, fecha: "2026-10-04T09:15:00", cliente: "María Torres", numeroOrden: "ORD-0004", estado: "PAGADO",
            total: 159.80,
            detalles: [
                { cantidad: 2, producto: "Memoria USB 64GB", precioUnitario: 29.90 },
                { cantidad: 1, producto: "Mouse Pad XL", precioUnitario: 100.00 }
            ]
        },
        {
            id: 5, fecha: "2026-10-05T16:20:00", cliente: "Diego Ramos", numeroOrden: "ORD-0005", estado: "CANCELADO",
            total: 349.90,
            detalles: [
                { cantidad: 1, producto: "Webcam Full HD", precioUnitario: 349.90 }
            ]
        }
    ];

    const CLAVE_VENTAS = "mastertech_ventas";

    // "prueba": no hay nada guardado | "ilegible": hay datos pero no se pueden leer | "real": ventas guardadas
    function origenVentas() {
        let crudo;
        try {
            crudo = localStorage.getItem(CLAVE_VENTAS);
        } catch {
            return "ilegible";
        }
        if (crudo === null) return "prueba";
        try {
            return Array.isArray(JSON.parse(crudo)) ? "real" : "ilegible";
        } catch {
            return "ilegible";
        }
    }

    // Deja cada venta con todos sus campos, para que un registro incompleto no rompa la tabla
    function normalizarVenta(v) {
        const detalles = Array.isArray(v.detalles) ? v.detalles : [];
        return {
            id: String(v.id ?? ""),
            fecha: String(v.fecha ?? ""),
            cliente: String(v.cliente ?? ""),
            numeroOrden: String(v.numeroOrden ?? ""),
            estado: String(v.estado ?? ""),
            total: Number(v.total) || 0,
            detalles: detalles
                .filter(d => d && typeof d === "object")
                .map(d => ({
                    cantidad: Number(d.cantidad) || 0,
                    producto: String(d.producto ?? ""),
                    precioUnitario: Number(d.precioUnitario) || 0
                }))
        };
    }

    // leerLista viene de almacen.js
    function obtenerVentas() {
        return leerLista(CLAVE_VENTAS, VENTAS_PRUEBA)
            .filter(v => v && typeof v === "object")
            .map(normalizarVenta);
    }

    const estado = { texto: "", columna: "fecha", direccion: "desc" };
    const abiertas = new Set(); // ids (texto) de las ventas con el detalle desplegado

    const cuerpo = document.getElementById("cuerpoTabla");

    const cantidadItems = v => v.detalles.reduce((suma, d) => suma + d.cantidad, 0);

    const formatoFecha = iso => {
        const fecha = new Date(iso);
        return isNaN(fecha) ? "—" : fecha.toLocaleString("es-PE", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const plantilla = id => document.getElementById(id).content.firstElementChild.cloneNode(true);

    // Rellena los elementos con data-campo usando textContent
    function llenar(nodo, datos) {
        Object.entries(datos).forEach(([campo, valor]) => {
            nodo.querySelector(`[data-campo="${campo}"]`).textContent = valor;
        });
    }

    function valorColumna(v, col) {
        if (col === "items") return cantidadItems(v);
        if (col === "fecha") return new Date(v.fecha).getTime() || 0;
        return v[col];
    }

    function ventasVisibles() {
        const t = estado.texto.trim().toLowerCase();
        const lista = obtenerVentas().filter(v =>
            !t ||
            v.id.toLowerCase().includes(t) ||
            v.cliente.toLowerCase().includes(t) ||
            v.numeroOrden.toLowerCase().includes(t));

        const sentido = estado.direccion === "asc" ? 1 : -1;
        return lista.sort((a, b) => {
            const x = valorColumna(a, estado.columna), y = valorColumna(b, estado.columna);
            const cmp = typeof x === "number"
                ? x - y
                : String(x).localeCompare(String(y), "es", { numeric: true });
            return cmp * sentido;
        });
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

    function crearFilaVenta(v) {
        const abierta = abiertas.has(v.id);
        const fila = plantilla("plantillaVenta");
        llenar(fila, {
            id: v.id,
            fecha: formatoFecha(v.fecha),
            cliente: v.cliente,
            numeroOrden: v.numeroOrden,
            estado: v.estado,
            items: cantidadItems(v),
            total: formatoSoles(v.total)
        });
        const boton = fila.querySelector("[data-accion='detalle']");
        boton.dataset.id = v.id;
        boton.setAttribute("aria-expanded", abierta);
        boton.setAttribute("aria-controls", "detalle-" + v.id);
        boton.title = (abierta ? "Ocultar" : "Ver") + " productos de la venta";
        fila.querySelector("[data-campo='chevron']").className = "bi " + (abierta ? "bi-chevron-up" : "bi-chevron-down");
        return fila;
    }

    function crearFilaDetalle(v) {
        const fila = plantilla("plantillaDetalle");
        fila.id = "detalle-" + v.id;
        const lista = fila.querySelector("[data-campo='lista']");
        v.detalles.forEach(d => {
            const item = plantilla("plantillaProducto");
            llenar(item, {
                cantidad: d.cantidad + "x",
                producto: d.producto,
                unitario: "(" + formatoSoles(d.precioUnitario) + " c/u)",
                subtotal: formatoSoles(d.cantidad * d.precioUnitario)
            });
            lista.appendChild(item);
        });
        return fila;
    }

    function crearFilaVacia() {
        const fila = plantilla("plantillaVacio");
        llenar(fila, { mensaje: estado.texto ? "No hay ventas que coincidan." : "No hay ventas registradas." });
        return fila;
    }

    function pintarTabla() {
        const lista = ventasVisibles();
        const filas = [];
        if (lista.length === 0) {
            filas.push(crearFilaVacia());
        } else {
            lista.forEach(v => {
                filas.push(crearFilaVenta(v));
                if (abiertas.has(v.id)) filas.push(crearFilaDetalle(v));
            });
        }
        cuerpo.replaceChildren(...filas);
        pintarEncabezados();
    }

    // Eventos
    cuerpo.addEventListener("click", e => {
        const boton = e.target.closest("button[data-id]");
        if (!boton) return;
        const id = boton.dataset.id;
        if (abiertas.has(id)) abiertas.delete(id); else abiertas.add(id);
        pintarTabla();
        // pintarTabla reemplaza los botones: devolver el foco al de la misma venta
        const nuevo = cuerpo.querySelector(`button[data-id="${CSS.escape(id)}"]`);
        if (nuevo) nuevo.focus();
    });

    document.querySelectorAll("th.ordenable").forEach(th => {
        th.querySelector(".btn-orden").addEventListener("click", () => {
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

    document.getElementById("btnLimpiar").addEventListener("click", () => {
        estado.texto = "";
        document.getElementById("buscador").value = "";
        pintarTabla();
    });

    const origen = origenVentas();
    if (origen === "prueba") {
        mostrarAviso("warning", "Estás viendo ventas de prueba: todavía no hay ventas guardadas en el sistema.");
    } else if (origen === "ilegible") {
        mostrarAviso("danger", "No se pudieron leer las ventas guardadas. Se muestran ventas de prueba, no el historial real.");
    }
    pintarTabla();
})();