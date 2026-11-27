import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Cotizacion, PuntoReparto } from '../api/types'
import type { SeleccionEntrega } from '../utils/entregaTipos'
import ResumenCotizacion from './ResumenCotizacion'

interface Props {
  items: { productoId: number; cantidad: number }[]
  onCambio: (seleccion: SeleccionEntrega | null) => void
}

/** Elegir en qué sede recoger el pedido (gratis). */
export default function EntregaRecojo({ items, onCambio }: Props) {
  const [puntos, setPuntos] = useState<PuntoReparto[] | null>(null)
  const [puntoId, setPuntoId] = useState('')
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clave = JSON.stringify(items)
  const punto = puntos?.find(p => String(p.id) === puntoId)

  useEffect(() => {
    api.puntosRecojo()
      .then(setPuntos)
      .catch(e => { setPuntos([]); setError(e instanceof Error ? e.message : 'No se pudieron cargar las sedes.') })
  }, [])

  useEffect(() => {
    setCotizacion(null)
    setError(null)
    if (!punto) return
    let vigente = true
    setCargando(true)
    api.cotizarEnvio(JSON.parse(clave) as Props['items'], { tipoEntrega: 'RECOJO', puntoRepartoId: punto.id })
      .then(c => { if (vigente) setCotizacion(c) })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo calcular la fecha.') })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [punto, clave])

  useEffect(() => {
    if (punto && cotizacion?.cubierto) {
      onCambio({ checkout: { tipoEntrega: 'RECOJO', puntoRepartoId: punto.id }, cotizacion })
    } else {
      onCambio(null)
    }
  }, [punto, cotizacion, onCambio])

  return (
    <div>
      <label className="form-label small mb-1" htmlFor="recojoSede">Sede donde recogerás</label>
      <select id="recojoSede" className="form-select" value={puntoId} onChange={e => setPuntoId(e.target.value)} disabled={puntos === null}>
        <option value="">{puntos === null ? 'Cargando sedes…' : 'Elige una sede…'}</option>
        {(puntos ?? []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      {punto && <div className="small text-muted mt-1"><i className="bi bi-geo-alt me-1" />{punto.direccion}</div>}
      {puntos !== null && puntos.length === 0 && !error && (
        <div className="small text-danger mt-1">Por ahora no hay sedes habilitadas para recojo.</div>
      )}
      <ResumenCotizacion cargando={cargando} error={error} cotizacion={cotizacion} />
    </div>
  )
}
