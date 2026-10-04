// ===== CARRITO MASTER TECH =====
const CLAVE_CARRITO = 'carritoMasterTech';
const RAIZ = location.pathname.includes('/html/') ? '../' : '';
const IMG_DEFECTO = RAIZ + 'Imagenes/consolatarjeta.jpg';

function obtenerCarrito() {
    try { return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []; }
    catch (e) { return []; }
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    actualizarBadge();
}

function formatoSoles(n) {
    return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function textoSeguro(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function actualizarBadge() {
    const total = obtenerCarrito().reduce((acc, p) => acc + p.cantidad, 0);
    document.querySelectorAll('.badge-carrito').forEach(b => b.textContent = total);
}

function avisar(mensaje) {
    if (typeof mostrarAlerta === 'function') mostrarAlerta(mensaje);
    else alert(mensaje);
}

// Botón "Agregar al carrito" (tarjetas y promos)
function agregarAlCarrito(btn) {
    const carrito = obtenerCarrito();
    const id = String(btn.dataset.id);
    const existente = carrito.find(p => p.id === id);
    const stock = parseInt(btn.dataset.stock) || 99;

    if (existente) {
        if (existente.cantidad >= existente.stock) {
            avisar('No hay más stock disponible de este producto.');
            return;
        }
        existente.cantidad++;
    } else {
        carrito.push({
            id: id,
            nombre: btn.dataset.nombre,
            precio: parseFloat(btn.dataset.precio),
            imagen: (btn.dataset.imagen || '').replace(/^(\.\.\/|\/)+/, ''),
            marca: btn.dataset.marca || '',
            stock: stock,
            cantidad: 1
        });
    }
    guardarCarrito(carrito);

    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Agregado';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 900);
}

function cambiarCantidad(id, nueva) {
    const carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === id);
    if (!item) return;
    item.cantidad = Math.min(item.stock, Math.max(1, parseInt(nueva) || 1));
    guardarCarrito(carrito);
    renderCarrito();
}

function eliminarItem(id) {
    guardarCarrito(obtenerCarrito().filter(p => p.id !== id));
    renderCarrito();
}

function vaciarCarrito() {
    if (confirm('¿Vaciar todo el carrito?')) {
        guardarCarrito([]);
        renderCarrito();
    }
}

function continuarCompra() {
    if (!obtenerCarrito().length) {
        avisar('Tu carrito está vacío.');
        return;
    }
    avisar('Compra simulada: el pago se conectará cuando exista el backend.');
}

function renderCarrito() {
    const tbody = document.getElementById('carritoItems');
    if (!tbody) return; // no estamos en la vista del carrito

    const carrito = obtenerCarrito();
    document.getElementById('carritoVacio').classList.toggle('d-none', carrito.length > 0);
    document.getElementById('carritoLleno').classList.toggle('d-none', carrito.length === 0);

    // Tabla de ítems
    tbody.innerHTML = carrito.map(p => `
        <tr data-id="${textoSeguro(p.id)}">
            <td>
                <img class="cart-img" src="${RAIZ}${textoSeguro(p.imagen)}" alt="${textoSeguro(p.nombre)}"
                     onerror="this.onerror=null;this.src='${IMG_DEFECTO}'">
            </td>
            <td><span class="fw-semibold">${textoSeguro(p.nombre)}</span></td>
            <td class="text-center">
                <input type="number" class="form-control form-control-sm qty-input d-inline-block"
                       value="${p.cantidad}" min="1" max="${p.stock}" data-accion="cantidad">
            </td>
            <td class="text-end fw-semibold">${formatoSoles(p.precio)}</td>
            <td class="text-end fw-bold text-danger">${formatoSoles(p.precio * p.cantidad)}</td>
            <td class="text-center">
                <button type="button" class="btn-eliminar" title="Eliminar" data-accion="eliminar">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </td>
        </tr>`).join('');

    // Resumen
    document.getElementById('resumenItems').innerHTML = carrito.map(p => `
        <li class="d-flex justify-content-between mb-2 text-muted small">
            <span>${textoSeguro(p.nombre)} <span class="ms-1 text-secondary">× ${p.cantidad}</span></span>
            <span>${formatoSoles(p.precio * p.cantidad)}</span>
        </li>`).join('');

    const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    document.getElementById('resTotal').textContent = formatoSoles(total);
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarBadge();
    renderCarrito();

    // Botones "Agregar al carrito" de las tarjetas (las pinta renderizado.js)
    document.addEventListener('click', e => {
        const btn = e.target.closest('.btn-agregar');
        if (btn && !btn.disabled) agregarAlCarrito(btn);
    });

    const tbody = document.getElementById('carritoItems');
    if (tbody) {
        tbody.addEventListener('change', e => {
            if (e.target.dataset.accion === 'cantidad') {
                cambiarCantidad(e.target.closest('tr').dataset.id, e.target.value);
            }
        });
        tbody.addEventListener('click', e => {
            const btn = e.target.closest('[data-accion="eliminar"]');
            if (btn) eliminarItem(btn.closest('tr').dataset.id);
        });
    }

    const btnVaciar = document.getElementById('btnVaciar');
    const btnContinuar = document.getElementById('btnContinuar');
    if (btnVaciar) btnVaciar.addEventListener('click', vaciarCarrito);
    if (btnContinuar) btnContinuar.addEventListener('click', continuarCompra);
});