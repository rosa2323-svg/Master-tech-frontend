import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import EntregaPedido from '../components/EntregaPedido'
import type { SeleccionEntrega } from '../components/entregaTipos'
import { formatoSoles, imagenProducto, IMG_DEFECTO } from '../utils/format'

export default function Cart() {
  const navigate = useNavigate()
  const { items, total, setCantidad, quitar, vaciar, sincronizar } = useCart()
  const { productos, cargando } = useCatalog()
  const { sesion, abrirLogin } = useAuth()
  const { mostrarAlerta } = useAlert()
  const [pagando, setPagando] = useState(false)
  const [seleccion, setSeleccion] = useState<SeleccionEntrega | null>(null)
  const itemsPedido = useMemo(() => items.map(i => ({ productoId: i.id, cantidad: i.cantidad })), [items])
  const costoEnvio = sesion ? (seleccion?.cotizacion.costoEnvio ?? 0) : 0

  useEffect(() => { document.title = 'Carrito | MASTER TECH' }, [])
  useEffect(() => { if (!cargando) sincronizar(productos) }, [cargando, productos, sincronizar])

  const continuarCompra = async () => {
    if (!items.length) return mostrarAlerta('Tu carrito está vacío.')
    if (!sesion) {
      mostrarAlerta('Inicia sesión para continuar con tu compra.')
      abrirLogin()
      return
    }
    if (!seleccion) return mostrarAlerta('Completa cómo quieres recibir tu pedido (dirección de entrega o sede de recojo).')
    setPagando(true)
    try {
      const pago = await api.checkout(itemsPedido, seleccion.checkout)
      navigate('/pago', { state: pago }) // pago incrustado de Stripe, con tiempo límite
    } catch (e) {
      mostrarAlerta(e instanceof Error ? e.message : 'No se pudo iniciar el pago.')
      setPagando(false)
    }
  }

  return (
    <div className="bg-light py-5">
      <div className="container">
        <h2 className="fw-bold mb-4" style={{ letterSpacing: '1px' }}><i className="bi bi-cart3 me-2" />Mi Carrito</h2>

        {items.length === 0 ? (
          <div className="empty-cart">
            <i className="bi bi-cart-x text-muted d-block mb-3" />
            <h5 className="fw-bold">Tu carrito está vacío</h5>
            <p className="text-muted">Agrega productos desde nuestras categorías.</p>
            <Link to="/" className="btn btn-dark px-5 mt-2 rounded-pill"><i className="bi bi-arrow-left me-1" /> Seguir comprando</Link>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th style={{ width: 80 }}>Imagen</th>
                          <th>Producto</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-end">Precio unit.</th>
                          <th className="text-end">Subtotal</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(i => (
                          <tr key={i.id}>
                            <td>
                              <img className="cart-img" src={imagenProducto(i.imagenUrl)} alt={i.nombre}
                                   onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_DEFECTO }} />
                            </td>
                            <td><Link to={`/producto/${i.id}`} className="fw-semibold text-dark text-decoration-none">{i.nombre}</Link></td>
                            <td className="text-center">
                              <input type="number" className="form-control form-control-sm qty-input d-inline-block"
                                     value={i.cantidad} min={1} max={i.stock} aria-label={`Cantidad de ${i.nombre}`}
                                     onChange={e => setCantidad(i.id, parseInt(e.target.value))} />
                            </td>
                            <td className="text-end fw-semibold">{formatoSoles(i.precio)}</td>
                            <td className="text-end fw-bold text-danger">{formatoSoles(i.precio * i.cantidad)}</td>
                            <td className="text-center">
                              <button type="button" className="btn-eliminar" title="Eliminar" aria-label={`Eliminar ${i.nombre}`}
                                      onClick={() => quitar(i.id)}>
                                <i className="bi bi-trash3-fill" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <Link to="/" className="btn btn-outline-dark rounded-pill px-4"><i className="bi bi-arrow-left me-1" /> Seguir comprando</Link>
                <button type="button" className="btn btn-outline-danger rounded-pill px-4"
                        onClick={() => { if (window.confirm('¿Vaciar todo el carrito?')) vaciar() }}>
                  <i className="bi bi-trash3 me-1" /> Vaciar carrito
                </button>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="resumen-card p-4 sticky-top" style={{ top: 90 }}>
                <h5 className="fw-bold mb-4">Resumen del pedido</h5>
                <ul className="list-unstyled">
                  {items.map(i => (
                    <li key={i.id} className="d-flex justify-content-between mb-2 text-muted small">
                      <span>{i.nombre} <span className="ms-1 text-secondary">× {i.cantidad}</span></span>
                      <span>{formatoSoles(i.precio * i.cantidad)}</span>
                    </li>
                  ))}
                </ul>
                <hr />
                {sesion
                  ? <EntregaPedido items={itemsPedido} onCambio={setSeleccion} />
                  : <p className="small text-muted"><i className="bi bi-geo-alt me-1" />Inicia sesión para elegir cómo recibir tu pedido.</p>}
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Envío</span>
                  {seleccion
                    ? (costoEnvio === 0
                        ? <span className="text-success fw-semibold">{seleccion.cotizacion.tipoEntrega === 'RECOJO' ? 'Recojo gratis' : 'Gratis'}</span>
                        : <span>{formatoSoles(costoEnvio)}</span>)
                    : <span className="small">Elige cómo recibirlo</span>}
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold fs-5">Total</span>
                  <span className="fw-bold fs-5 text-danger">{formatoSoles(total + costoEnvio)}</span>
                </div>
                <button type="button" className="btn btn-comprar w-100 py-3 fs-6" disabled={pagando || !seleccion} onClick={continuarCompra}>
                  <i className="bi bi-credit-card-fill me-2" />{pagando ? 'Preparando el pago…' : 'Continuar compra'}
                </button>
                <p className="text-center text-muted small mt-3 mb-0"><i className="bi bi-lock-fill me-1" /> Pago seguro garantizado</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
