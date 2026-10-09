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

    // leerLista viene de almacen.js
    function obtenerVentas() {
        return leerLista(CLAVE_VENTAS, VENTAS_PRUEBA);
    }

    const estado = { texto: "", columna: "fecha", direccion: "desc" };

    const cuerpo = document.getElementById("cuerpoTabla");

    const cantidadItems = v => v.detalles.reduce((suma, d) => suma + d.cantidad, 0);

    const formatoFecha = iso => new Date(iso).toLocaleString("es-PE", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    function valorColumna(v, col) {
        if (col === "items") return cantidadItems(v);
        if (col === "fecha") return new Date(v.fecha).getTime();
        return v[col];
    }

    function ventasVisibles() {
        const t = estado.texto.trim().toLowerCase();
        const lista = obtenerVentas().filter(v =>
            !t ||
            String(v.id).includes(t) ||
            v.cliente.toLowerCase().includes(t) ||
            v.numeroOrden.toLowerCase().includes(t));

        const sentido = estado.direccion === "asc" ? 1 : -1;
        return lista.sort((a, b) => {
            const x = valorColumna(a, estado.columna), y = valorColumna(b, estado.columna);
            const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "es");
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

    function pintarTabla() {
        const lista = ventasVisibles();
        if (lista.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="7"><div class="vacio"><i class="bi bi-inbox"></i>
                ${estado.texto ? "No hay ventas que coincidan." : "No hay ventas registradas."}</div></td></tr>`;
        } else {
            cuerpo.innerHTML = lista.map(v => `
                <tr>
                    <td class="texto-tenue">${v.id}</td>
                    <td>${formatoFecha(v.fecha)}</td>
                    <td class="fw-semibold">${escaparHtml(v.cliente)}</td>
                    <td class="texto-tenue">${escaparHtml(v.numeroOrden)}</td>
                    <td><span class="etiqueta-categoria">${escaparHtml(v.estado)}</span></td>
                    <td class="text-center">${cantidadItems(v)}</td>
                    <td class="precio-admin">${formatoSoles(v.total)}</td>
                </tr>`).join("");
        }
        pintarEncabezados();
    }

    // Eventos
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

    pintarTabla();
})();