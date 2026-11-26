import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Venta } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { formatoDiaLargo, formatoSoles } from '../utils/format'

/** Destino de Stripe tras el pago: verifica la sesión, registra la venta y vacía el carrito. */
export default function PagoConfirmar() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { sesion, cargando: cargandoSesion } = useAuth()
  const { vaciar } = useCart()
  const { recargar } = useCatalog()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lanzado = useRef(false)

  useEffect(() => { document.title = 'Confirmando pago | MASTER TECH' }, [])

  useEffect(() => {
    if (cargandoSesion || lanzado.current) return
    if (!sessionId) { setError('Falta el identificador de la sesión de pago.'); return }
    if (!sesion) { setError('Inicia sesión para ver la confirmación de tu compra.'); return }
    lanzado.current = true
    api.confirmarPago(sessionId)
        .then(v => { setVenta(v); vaciar(); void recargar() })
        .catch(e => setError(e instanceof Error ? e.message : 'No se pudo confirmar el pago.'))
  }, [cargandoSesion, sessionId, sesion, vaciar, recargar])

  if (error) {
    return (
        <div className="container py-5 text-center">
          <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3.5rem' }} />
          <h3 className="fw-bold mt-3">No pudimos confirmar tu compra</h3>
          <p className="text-muted">{error}</p>
          <Link to="/carrito" className="btn btn-dark rounded-pill px-5">Volver al carrito</Link>
        </div>
    )
  }

  if (!venta) {
    return <div className="container py-5 text-center text-muted">Confirmando tu pago…</div>
  }

  return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }} />
          <h2 className="fw-bold mt-3">¡Pago exitoso!</h2>
          <p className="text-muted">Gracias por tu compra en Master Tech.</p>
          <ul className="list-unstyled text-start mx-auto my-3" style={{ maxWidth: 360 }}>
            <li className="d-flex justify-content-between mb-2"><span className="text-muted">N.º de orden</span><strong>{venta.numeroOrden}</strong></li>
            <li className="d-flex justify-content-between mb-2"><span className="text-muted">Productos</span><strong>{venta.cantidadItems}</strong></li>
            <li className="d-flex justify-content-between mb-2"><span className="text-muted">Subtotal</span><strong>{formatoSoles(venta.total)}</strong></li>
            <li className="d-flex justify-content-between mb-2"><span className="text-muted">Envío</span><strong>{venta.costoEnvio ? formatoSoles(venta.costoEnvio) : 'Gratis'}</strong></li>
            <li className="d-flex justify-content-between"><span className="text-muted">Total pagado</span><strong className="text-danger">{formatoSoles(venta.total + (venta.costoEnvio ?? 0))}</strong></li>
            {venta.fechaEstimadaEntrega && (
                <li className="mt-3 small text-muted"><i className="bi bi-truck me-1" />Llegada estimada: hasta el {formatoDiaLargo(venta.fechaEstimadaEntrega)}</li>
            )}
          </ul>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Link to="/perfil" className="btn btn-danger rounded-pill px-4">Ver mis compras</Link>
            <Link to="/" className="btn btn-outline-dark rounded-pill px-4">Seguir comprando</Link>
          </div>
        </div>
      </div>
  )
}
