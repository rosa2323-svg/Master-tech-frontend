import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { EnvioEvento } from '../api/types'
import { claseEstado } from '../utils/estados'
import { formatoFecha } from '../utils/format'

interface Props {
  pedidoId: number
  /** Quién lo mira: el despachador o el cliente dueño del pedido. */
  modo: 'despacho' | 'cliente'
  /** Cambia cuando el pedido avanza, para volver a cargar. */
  version: string
}

/** Línea de tiempo de los estados por los que pasó un pedido. */
export default function HistorialPedido({ pedidoId, modo, version }: Props) {
  const [eventos, setEventos] = useState<EnvioEvento[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    const pedir = modo === 'despacho' ? api.eventosPedido(pedidoId) : api.seguimientoPedido(pedidoId)
    pedir
      .then(e => { if (vigente) { setEventos(e); setError(null) } })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar el historial.') })
    return () => { vigente = false }
  }, [pedidoId, modo, version])

  if (error) return <div className="small text-danger">{error}</div>
  if (eventos === null) return <div className="small text-muted">Cargando historial…</div>
  if (eventos.length === 0) return <div className="small text-muted">Sin movimientos registrados.</div>

  return (
    <ul className="list-unstyled mb-0">
      {eventos.map((e, i) => (
        <li key={`${e.estado}-${e.fecha}-${i}`} className="d-flex align-items-start gap-2 mb-2">
          <span className={`badge ${claseEstado(e.estado)} mt-1`}>{e.estado}</span>
          <span className="small">
            {formatoFecha(e.fecha)}
            {e.usuarioNombre && <span className="text-muted"> · por {e.usuarioNombre}</span>}
            {e.nota && <div className="text-muted">{e.nota}</div>}
          </span>
        </li>
      ))}
    </ul>
  )
}
