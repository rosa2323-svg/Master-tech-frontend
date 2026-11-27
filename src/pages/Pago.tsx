import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import type { CheckoutEmbebido } from '../api/types'
import { iniciarCheckoutIncrustado, type CheckoutIncrustado } from '../utils/stripe'

const formatoRestante = (seg: number) =>
  `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`

/** Pago incrustado de Stripe con cuenta regresiva. Los datos llegan desde el carrito (no se pueden abrir directo). */
export default function Pago() {
  const datos = (useLocation().state as CheckoutEmbebido | null) ?? null
  const contenedor = useRef<HTMLDivElement>(null)
  const [restante, setRestante] = useState(() => (datos ? Math.max(0, datos.expiraEn - Math.floor(Date.now() / 1000)) : 0))
  const [error, setError] = useState<string | null>(null)
  const [cargandoForm, setCargandoForm] = useState(true)
  const expirado = datos !== null && restante <= 0

  useEffect(() => { document.title = 'Pago | MASTER TECH' }, [])

  // Cuenta regresiva (se calcula contra la hora de vencimiento, no restando de a uno: no se desfasa).
  useEffect(() => {
    if (!datos) return
    const id = window.setInterval(() => {
      setRestante(Math.max(0, datos.expiraEn - Math.floor(Date.now() / 1000)))
    }, 1000)
    return () => window.clearInterval(id)
  }, [datos])

  // Monta el formulario de Stripe; al vencer el tiempo o al salir de la página lo destruye.
  useEffect(() => {
    if (!datos || expirado || !contenedor.current) return
    let cancelado = false
    let checkout: CheckoutIncrustado | null = null
    iniciarCheckoutIncrustado(datos.publishableKey, datos.clientSecret)
      .then(c => {
        if (cancelado || !contenedor.current) { c.destroy(); return }
        checkout = c
        c.mount(contenedor.current)
        setCargandoForm(false)
      })
      .catch(e => { if (!cancelado) { setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago.'); setCargandoForm(false) } })
    return () => { cancelado = true; checkout?.destroy() }
  }, [datos, expirado])

  if (!datos) return <Navigate to="/carrito" replace />

  return (
    <div className="bg-light py-5">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '1px' }}><i className="bi bi-credit-card-2-front me-2" />Pago seguro</h2>
          {!expirado && (
            <span className={`badge fs-6 ${restante <= 300 ? 'bg-danger' : 'bg-dark'}`} role="timer" aria-live="off">
              <i className="bi bi-hourglass-split me-1" />Tiempo para pagar: {formatoRestante(restante)}
            </span>
          )}
        </div>

        {expirado ? (
          <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5">
            <i className="bi bi-clock-history text-danger" style={{ fontSize: '3.5rem' }} />
            <h3 className="fw-bold mt-3">Se acabó el tiempo para pagar</h3>
            <p className="text-muted">No se realizó ningún cobro. Tu carrito sigue guardado: vuelve a empezar el pago cuando quieras.</p>
            <div><Link to="/carrito" className="btn btn-dark rounded-pill px-5">Volver al carrito</Link></div>
          </div>
        ) : (
          <>
            {restante <= 300 && (
              <div className="alert alert-warning py-2 small">Quedan pocos minutos: si el tiempo se agota tendrás que volver a empezar el pago.</div>
            )}
            {error && (
              <div className="alert alert-danger">
                {error} <Link to="/carrito" className="alert-link">Volver al carrito</Link>
              </div>
            )}
            {cargandoForm && !error && <div className="text-center text-muted py-5">Cargando el formulario de pago…</div>}
            <div ref={contenedor} className="card border-0 shadow-sm rounded-4 p-2" hidden={cargandoForm || !!error} />
            <p className="text-center text-muted small mt-3 mb-0">
              <i className="bi bi-lock-fill me-1" />Pago procesado por Stripe. Tus datos de tarjeta no pasan por Master Tech.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
